import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type { Label } from '@/types';
import { LABEL_PRESETS, SEED_LABELS } from '@/data/seed';
import { useWorkspaceStore } from './workspace';

export const useLabelsStore = defineStore('labels', () => {
  const LABELS = reactive<Record<string, Label>>({ ...SEED_LABELS });

  function setLabels(next: Record<string, Label>) {
    Object.keys(LABELS).forEach((k) => delete LABELS[k]);
    Object.assign(LABELS, next);
  }

  const labelsDialogOpen = ref(false);
  const labelForm = reactive({
    key: '',
    name: '',
    fg: '#1E40AF',
    bg: '#DBEAFE',
    isEdit: false,
    origKey: '',
  });
  const labelFormError = ref('');

  function resetLabelForm() {
    labelForm.key = '';
    labelForm.name = '';
    labelForm.fg = '#1E40AF';
    labelForm.bg = '#DBEAFE';
    labelForm.isEdit = false;
    labelForm.origKey = '';
    labelFormError.value = '';
  }
  function startEditLabel(key: string) {
    const l = LABELS[key];
    if (!l) return;
    labelForm.key = key;
    labelForm.name = l.name;
    labelForm.fg = l.fg;
    labelForm.bg = l.bg;
    labelForm.isEdit = true;
    labelForm.origKey = key;
    labelFormError.value = '';
  }
  function saveLabel() {
    const key = labelForm.key.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) { labelFormError.value = 'Chave obrigatória.'; return; }
    if (!labelForm.name.trim()) { labelFormError.value = 'Nome obrigatório.'; return; }
    if (!labelForm.isEdit && LABELS[key]) { labelFormError.value = 'Essa chave já existe.'; return; }
    const workspace = useWorkspaceStore();
    if (labelForm.isEdit && labelForm.origKey !== key) {
      delete LABELS[labelForm.origKey];
      workspace.forEachCard((c) => {
        const i = c.labels.indexOf(labelForm.origKey);
        if (i !== -1) c.labels.splice(i, 1, key);
      });
    }
    LABELS[key] = { name: labelForm.name.trim(), fg: labelForm.fg, bg: labelForm.bg };
    resetLabelForm();
  }
  function deleteLabel(key: string, onLabelDeleted?: (key: string) => void) {
    delete LABELS[key];
    useWorkspaceStore().forEachCard((c) => {
      c.labels = c.labels.filter((l) => l !== key);
    });
    onLabelDeleted?.(key);
    if (labelForm.origKey === key) resetLabelForm();
  }
  function applyPreset(preset: { fg: string; bg: string }) {
    labelForm.fg = preset.fg;
    labelForm.bg = preset.bg;
  }

  return {
    LABELS, LABEL_PRESETS,
    setLabels,
    labelsDialogOpen, labelForm, labelFormError,
    resetLabelForm, startEditLabel, saveLabel, deleteLabel, applyPreset,
  };
});
