import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Attachment, Comment, Label, Person, Project } from '@/types';

export interface HistorySnapshot {
  projects?: Project[];
  expandedProjects?: Record<string, boolean>;
  activeProjectId?: string | null;
  activeBoardId?: string | null;
  PEOPLE?: Person[];
  LABELS?: Record<string, Label>;
  cardComments?: Record<string, Comment[]>;
  cardAttachments?: Record<string, Attachment[]>;
}

const MAX_HISTORY = 50;

export const useHistoryStore = defineStore('history', () => {
  const undoStack = ref<HistorySnapshot[]>([]);
  const redoStack = ref<HistorySnapshot[]>([]);
  let lastStable: string | null = null;
  let suspended = false;

  // Bound by setupPersistence — we keep the store decoupled from other stores.
  let _snapshotFn: (() => HistorySnapshot) | null = null;
  let _applyFn: ((s: HistorySnapshot) => void) | null = null;
  let _flushFn: (() => void) | null = null;

  function bind(
    snapshotFn: () => HistorySnapshot,
    applyFn: (s: HistorySnapshot) => void,
    flushFn: () => void,
  ) {
    _snapshotFn = snapshotFn;
    _applyFn = applyFn;
    _flushFn = flushFn;
  }

  function init(initial: HistorySnapshot) {
    lastStable = JSON.stringify(initial);
    undoStack.value = [];
    redoStack.value = [];
  }

  function record(current: HistorySnapshot) {
    if (suspended) return;
    const serialized = JSON.stringify(current);
    if (serialized === lastStable) return;
    if (lastStable !== null) {
      undoStack.value.push(JSON.parse(lastStable) as HistorySnapshot);
      if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift();
      redoStack.value = [];
    }
    lastStable = serialized;
  }

  function setSuspended(v: boolean) { suspended = v; }

  function undo() {
    if (!_snapshotFn || !_applyFn) return;
    _flushFn?.();
    if (!undoStack.value.length) return;
    const prev = undoStack.value.pop()!;
    const current = _snapshotFn();
    redoStack.value.push(JSON.parse(JSON.stringify(current)) as HistorySnapshot);
    if (redoStack.value.length > MAX_HISTORY) redoStack.value.shift();
    lastStable = JSON.stringify(prev);
    _applyFn(prev);
  }

  function redo() {
    if (!_snapshotFn || !_applyFn) return;
    _flushFn?.();
    if (!redoStack.value.length) return;
    const next = redoStack.value.pop()!;
    const current = _snapshotFn();
    undoStack.value.push(JSON.parse(JSON.stringify(current)) as HistorySnapshot);
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift();
    lastStable = JSON.stringify(next);
    _applyFn(next);
  }

  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  return {
    undoStack, redoStack, canUndo, canRedo,
    bind, init, record, setSuspended,
    undo, redo,
  };
});
