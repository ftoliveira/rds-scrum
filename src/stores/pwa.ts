import { defineStore } from 'pinia';
import { ref } from 'vue';
import { registerSW } from 'virtual:pwa-register';

export const usePwaStore = defineStore('pwa', () => {
  const updateReady = ref(false);
  const offlineReady = ref(false);

  let updateFn: ((reload?: boolean) => Promise<void>) | null = null;

  function register() {
    if (typeof window === 'undefined') return;
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
    if (updateFn) await updateFn(true);
  }

  function dismissOfflineReady() { offlineReady.value = false; }
  function dismissUpdate() { updateReady.value = false; }

  return {
    updateReady, offlineReady,
    register, applyUpdate, dismissOfflineReady, dismissUpdate,
  };
});
