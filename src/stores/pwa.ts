import { defineStore } from 'pinia';
import { ref } from 'vue';
import { registerSW } from 'virtual:pwa-register';

const UPDATE_APPLIED_KEY = 'pwa:update-applied';

export const usePwaStore = defineStore('pwa', () => {
  const updateReady = ref(false);
  const offlineReady = ref(false);
  const updateApplied = ref(false);

  let updateFn: ((reload?: boolean) => Promise<void>) | null = null;

  function register() {
    if (typeof window === 'undefined') return;
    try {
      if (sessionStorage.getItem(UPDATE_APPLIED_KEY) === '1') {
        sessionStorage.removeItem(UPDATE_APPLIED_KEY);
        updateApplied.value = true;
        setTimeout(() => { updateApplied.value = false; }, 5000);
      }
    } catch { /* ignore */ }
    updateFn = registerSW({
      immediate: true,
      onNeedRefresh() { updateReady.value = true; },
      onOfflineReady() {
        offlineReady.value = true;
        // auto-dismiss after a few seconds — it's just an FYI
        setTimeout(() => { offlineReady.value = false; }, 4000);
      },
      onRegisterError(err) {
        console.warn('Service worker registration failed:', err);
      },
    });
  }

  async function applyUpdate() {
    try { sessionStorage.setItem(UPDATE_APPLIED_KEY, '1'); } catch { /* ignore */ }
    if (updateFn) await updateFn(true);
  }

  function dismissOfflineReady() { offlineReady.value = false; }
  function dismissUpdate() { updateReady.value = false; }
  function dismissUpdateApplied() { updateApplied.value = false; }

  return {
    updateReady, offlineReady, updateApplied,
    register, applyUpdate, dismissOfflineReady, dismissUpdate, dismissUpdateApplied,
  };
});
