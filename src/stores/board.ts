import { defineStore } from 'pinia';
import { computed, nextTick, reactive, ref } from 'vue';
import type { Card, ChecklistItem, Column, Priority, SortField } from '@/types';
import { COLUMN_PRESETS, PRIORITY_META, PRIO_RANK, TYPE_META } from '@/data/seed';
import { TODAY } from '@/utils/date';
import { uniqueId } from '@/utils/id';
import { useDragDrop } from '@/composables/useDragDrop';
import { useCalendar } from '@/composables/useCalendar';
import { useWorkspaceStore } from './workspace';
import { useActivityStore } from './activity';

export interface DropTarget {
  colId: string;
  beforeId: string | null;
}

export const useBoardStore = defineStore('board', () => {
  const workspace = useWorkspaceStore();

  // ---- Active-board proxies (read-only views; mutations go through actions) ----
  const cards = computed<Card[]>(() => workspace.activeBoard?.cards ?? []);
  const COLUMNS = computed<Column[]>(() => workspace.activeBoard?.columns ?? []);

  const findCard = (id: string | null | undefined): Card | undefined =>
    id ? cards.value.find((c) => c.id === id) : undefined;

  // ---- Filters & sort ----
  const searchQ = ref('');
  const filterLabel = ref<string[]>([]);
  const filterAssignee = ref<string[]>([]);
  const filterOverdue = ref(false);
  const sortBy = ref<SortField>(null);
  const sortDir = ref<'asc' | 'desc'>('asc');

  function toggleSort(field: 'due' | 'priority') {
    if (sortBy.value === field) {
      if (sortDir.value === 'asc') sortDir.value = 'desc';
      else { sortBy.value = null; sortDir.value = 'asc'; }
    } else {
      sortBy.value = field;
      sortDir.value = 'asc';
    }
  }

  const visible = computed(() => {
    const q = searchQ.value.trim().toLowerCase();
    return cards.value.filter((c) => {
      if (q && !(c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))) return false;
      if (filterLabel.value.length && !c.labels.some((l) => filterLabel.value.includes(l))) return false;
      if (filterAssignee.value.length && !c.assignees.some((a) => filterAssignee.value.includes(a))) return false;
      if (filterOverdue.value) {
        if (!c.due) return false;
        const d = new Date(c.due + 'T00:00:00');
        if (d >= TODAY || c.col === 'done') return false;
      }
      return true;
    });
  });

  const sortedVisible = computed(() => {
    const list = [...visible.value];
    if (!sortBy.value) return list;
    const dir = sortDir.value === 'asc' ? 1 : -1;
    if (sortBy.value === 'due') {
      list.sort((a, b) => {
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) * dir;
      });
    } else if (sortBy.value === 'priority') {
      list.sort((a, b) => (PRIO_RANK[b.priority] - PRIO_RANK[a.priority]) * dir);
    }
    return list;
  });

  const cardsByCol = computed(() => {
    const m: Record<string, Card[]> = {};
    COLUMNS.value.forEach((c) => { m[c.id] = []; });
    visible.value.forEach((c) => { (m[c.col] ??= []).push(c); });
    return m;
  });

  const totalByCol = computed(() => {
    const m: Record<string, number> = {};
    COLUMNS.value.forEach((c) => { m[c.id] = cards.value.filter((k) => k.col === c.id).length; });
    return m;
  });

  const sprintStats = computed(() => {
    const total = cards.value.length;
    const done = cards.value.filter((c) => c.col === 'done').length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  });

  const overdueCount = computed(() =>
    cards.value.filter((c) =>
      c.due && new Date(c.due + 'T00:00:00') < TODAY && c.col !== 'done'
    ).length,
  );

  // ---- Card dialog ----
  const dialogCardId = ref<string | null>(null);
  const currentCard = computed(() => findCard(dialogCardId.value) ?? null);
  function openCard(id: string) { dialogCardId.value = id; }
  function closeCard() { dialogCardId.value = null; }

  // ---- Inline add card ----
  const addingInCol = ref<string | null>(null);
  const newCardTitle = ref('');
  function beginAdd(colId: string) {
    addingInCol.value = colId;
    newCardTitle.value = '';
    nextTick(() => document.getElementById('add-input-' + colId)?.focus());
  }
  function cancelAdd() { addingInCol.value = null; newCardTitle.value = ''; }
  function commitAdd(colId: string) {
    const t = newCardTitle.value.trim();
    if (!t) { cancelAdd(); return; }
    const board = workspace.activeBoard;
    if (!board) return;
    const now = new Date().toISOString();
    board.cards.push({
      id: workspace.nextCardId(),
      col: colId, type: 'task', title: t,
      labels: [], assignees: [], due: null, priority: 'medium',
      comments: 0, attachments: 0,
      createdAt: now, updatedAt: now,
    });
    newCardTitle.value = '';
    addingInCol.value = null;
  }

  // ---- Drag & drop ----
  function moveCard(cardId: string, target: DropTarget) {
    if (cardId === target.beforeId) return;
    const board = workspace.activeBoard;
    if (!board) return;
    const i = board.cards.findIndex((c) => c.id === cardId);
    if (i === -1) return;
    const [c] = board.cards.splice(i, 1);
    c.col = target.colId;
    if (target.beforeId === null) {
      board.cards.push(c);
    } else {
      const j = board.cards.findIndex((x) => x.id === target.beforeId);
      if (j === -1) board.cards.push(c);
      else board.cards.splice(j, 0, c);
    }
  }

  const dragDrop = useDragDrop<DropTarget>((id, target) => moveCard(id, target));

  // ---- Calendar ----
  const calendar = useCalendar(() => visible.value);

  // ---- Checklist ----
  function toggleCheck(card: Card, i: number) {
    if (!card.checklist) return;
    card.checklist[i].d = !card.checklist[i].d;
  }

  // ---- New / edit task dialog ----
  const newTaskOpen = ref(false);
  const newTaskEditId = ref<string | null>(null);
  const newTask = reactive({
    title: '',
    description: '',
    col: 'todo',
    type: 'task' as Card['type'],
    priority: 'medium' as Priority,
    due: '',
    labels: [] as string[],
    assignees: [] as string[],
    checklist: [] as ChecklistItem[],
    newChecklistItem: '',
  });
  function resetNewTask() {
    newTask.title = '';
    newTask.description = '';
    newTask.col = COLUMNS.value[0]?.id ?? 'todo';
    newTask.type = 'task';
    newTask.priority = 'medium';
    newTask.due = '';
    newTask.labels = [];
    newTask.assignees = [];
    newTask.checklist = [];
    newTask.newChecklistItem = '';
    newTaskEditId.value = null;
  }
  function openNewTask(colId?: string) {
    resetNewTask();
    if (colId) newTask.col = colId;
    newTaskOpen.value = true;
  }
  function deleteCard(id: string) {
    const board = workspace.activeBoard;
    if (!board) return;
    const i = board.cards.findIndex((c) => c.id === id);
    if (i !== -1) board.cards.splice(i, 1);
    useActivityStore().dropForCardIds([id]);
    closeCard();
  }
  function openEditTask(card: Card) {
    newTaskEditId.value = card.id;
    newTask.title = card.title;
    newTask.description = card.description || '';
    newTask.col = card.col;
    newTask.type = card.type;
    newTask.priority = card.priority;
    newTask.due = card.due || '';
    newTask.labels = [...card.labels];
    newTask.assignees = [...card.assignees];
    newTask.checklist = card.checklist ? card.checklist.map((c) => ({ ...c })) : [];
    newTask.newChecklistItem = '';
    closeCard();
    nextTick(() => { newTaskOpen.value = true; });
  }
  function addChecklistItem() {
    const t = newTask.newChecklistItem.trim();
    if (!t) return;
    newTask.checklist.push({ t, d: false });
    newTask.newChecklistItem = '';
  }
  function removeChecklistItem(i: number) { newTask.checklist.splice(i, 1); }
  function toggleArrayVal(arr: string[], v: string) {
    const i = arr.indexOf(v);
    if (i === -1) arr.push(v); else arr.splice(i, 1);
  }
  function commitNewTask() {
    const t = newTask.title.trim();
    if (!t) return;
    const board = workspace.activeBoard;
    if (!board) return;
    const now = new Date().toISOString();
    if (newTaskEditId.value) {
      const c = findCard(newTaskEditId.value);
      if (c) {
        c.title = t;
        c.description = newTask.description.trim() || undefined;
        c.col = newTask.col;
        c.type = newTask.type;
        c.priority = newTask.priority;
        c.due = newTask.due || null;
        c.labels = [...newTask.labels];
        c.assignees = [...newTask.assignees];
        if (newTask.checklist.length) c.checklist = newTask.checklist.map((x) => ({ t: x.t, d: x.d }));
        else delete c.checklist;
        c.updatedAt = now;
      }
    } else {
      const card: Card = {
        id: workspace.nextCardId(),
        col: newTask.col,
        type: newTask.type,
        title: t,
        description: newTask.description.trim() || undefined,
        labels: [...newTask.labels],
        assignees: [...newTask.assignees],
        due: newTask.due || null,
        priority: newTask.priority,
        comments: 0,
        attachments: 0,
        createdAt: now,
        updatedAt: now,
      };
      if (newTask.checklist.length) card.checklist = newTask.checklist.map((c) => ({ t: c.t, d: c.d }));
      board.cards.push(card);
    }
    newTaskOpen.value = false;
  }

  // ---- Column CRUD ----
  const addingColumn = ref(false);
  const newColumnTitle = ref('');
  const newColumnColor = ref('#0EA5E9');
  const editingCol = ref<string | null>(null);
  const editingColTitle = ref('');
  const deleteColDialog = ref(false);
  const deleteColTarget = ref<{ id: string; title: string; count: number }>({ id: '', title: '', count: 0 });

  function beginAddColumn() {
    addingColumn.value = true;
    newColumnTitle.value = '';
    newColumnColor.value = COLUMN_PRESETS[COLUMNS.value.length % COLUMN_PRESETS.length];
    nextTick(() => document.getElementById('new-column-input')?.focus());
  }
  function commitAddColumn() {
    const board = workspace.activeBoard;
    if (!board) return;
    const t = newColumnTitle.value.trim();
    if (!t) { addingColumn.value = false; return; }
    board.columns.push({ id: uniqueId('col_'), title: t, dot: newColumnColor.value });
    addingColumn.value = false;
    newColumnTitle.value = '';
  }
  function cancelAddColumn() { addingColumn.value = false; newColumnTitle.value = ''; }
  function startRenameColumn(col: Column) {
    editingCol.value = col.id;
    editingColTitle.value = col.title;
    nextTick(() => {
      const el = document.getElementById('rename-col-' + col.id) as HTMLInputElement | null;
      if (el) { el.focus(); el.select(); }
    });
  }
  function commitRenameColumn(col: Column) {
    const t = editingColTitle.value.trim();
    if (t) col.title = t;
    editingCol.value = null;
  }
  function deleteColumn(colId: string) {
    const board = workspace.activeBoard;
    if (!board) return;
    const col = board.columns.find((c) => c.id === colId);
    if (!col) return;
    const colCards = board.cards.filter((c) => c.col === colId).length;
    if (colCards > 0) {
      deleteColTarget.value = { id: colId, title: col.title, count: colCards };
      deleteColDialog.value = true;
      return;
    }
    const i = board.columns.findIndex((c) => c.id === colId);
    if (i !== -1) board.columns.splice(i, 1);
  }
  function confirmDeleteColumn() {
    const board = workspace.activeBoard;
    if (!board) return;
    const colId = deleteColTarget.value.id;
    const fallback = board.columns.find((c) => c.id !== colId)?.id || 'backlog';
    board.cards.forEach((c) => { if (c.col === colId) c.col = fallback; });
    const i = board.columns.findIndex((c) => c.id === colId);
    if (i !== -1) board.columns.splice(i, 1);
    deleteColDialog.value = false;
  }
  function changeColumnColor(col: Column, color: string) { col.dot = color; }
  function moveColumn(colId: string, dir: number) {
    const board = workspace.activeBoard;
    if (!board) return;
    const i = board.columns.findIndex((c) => c.id === colId);
    if (i === -1) return;
    const j = i + dir;
    if (j < 0 || j >= board.columns.length) return;
    const tmp = board.columns[i];
    board.columns.splice(i, 1);
    board.columns.splice(j, 0, tmp);
  }

  // ---- Cleanup helpers used by other stores ----
  function dropFilterLabel(key: string) {
    filterLabel.value = filterLabel.value.filter((k) => k !== key);
  }

  // Reset card dialog when board changes
  function clearActiveCardDialog() {
    dialogCardId.value = null;
  }

  return {
    TYPE_META, PRIORITY_META, COLUMN_PRESETS,
    cards, COLUMNS,
    searchQ, filterLabel, filterAssignee, filterOverdue,
    sortBy, sortDir, toggleSort,
    visible, sortedVisible, cardsByCol, totalByCol, sprintStats, overdueCount,
    dialogCardId, currentCard, openCard, closeCard, clearActiveCardDialog,
    addingInCol, newCardTitle, beginAdd, cancelAdd, commitAdd,
    dragOverTarget: dragDrop.dragOverTarget,
    onDragStart: dragDrop.onDragStart,
    onDragEnd: dragDrop.onDragEnd,
    onDrop: dragDrop.onDrop,
    setDragOver: dragDrop.setDragOver,
    moveCard,
    calMonth: calendar.calMonth,
    calNext: calendar.calNext,
    calPrev: calendar.calPrev,
    calCells: calendar.calCells,
    monthLabel: calendar.monthLabel,
    toggleCheck,
    newTaskOpen, newTaskEditId, newTask,
    openNewTask, openEditTask, commitNewTask, deleteCard,
    addChecklistItem, removeChecklistItem, toggleArrayVal,
    addingColumn, newColumnTitle, newColumnColor,
    beginAddColumn, commitAddColumn, cancelAddColumn,
    editingCol, editingColTitle, startRenameColumn, commitRenameColumn,
    deleteColumn, changeColumnColor, moveColumn,
    deleteColDialog, deleteColTarget, confirmDeleteColumn,
    dropFilterLabel,
  };
});
