import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ViewMode } from '@/types';

const STORAGE_KEY = 'kanrds-state-v1';

interface PersistedShape {
  projects: never[];
  expandedProjects: Record<string, never>;
  activeProjectId: null;
  activeBoardId: null;
  PEOPLE: never[];
  LABELS: Record<string, never>;
}

export const useUiStore = defineStore('ui', () => {
  const drawer = ref(true);
  const view = ref<ViewMode>('board');
  const resetConfirmOpen = ref(false);
  const clearDbConfirmOpen = ref(false);

  function resetAllData() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    location.reload();
  }
  function clearAllData() {
    try {
      const empty: PersistedShape = {
        projects: [], expandedProjects: {}, activeProjectId: null, activeBoardId: null,
        PEOPLE: [], LABELS: {},
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    } catch {}
    location.reload();
  }

  return {
    drawer, view,
    resetConfirmOpen, clearDbConfirmOpen,
    resetAllData, clearAllData,
  };
});
