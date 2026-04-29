import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useNetworkStatus() {
  const online = ref(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const onOnline = () => { online.value = true; };
  const onOffline = () => { online.value = false; };

  onMounted(() => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  });
  onBeforeUnmount(() => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  });

  return { online };
}
