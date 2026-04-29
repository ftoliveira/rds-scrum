import { defineStore } from 'pinia';
import { computed, nextTick, reactive, ref, watch } from 'vue';
import type { Attachment, Board, Card, ChecklistItem, Column, Comment, Label, Person, Priority, Project, SortField, ViewMode } from '@/types';
import {
  AVATAR_COLORS, COLUMN_PRESETS, LABEL_PRESETS, PRIORITY_META, PRIO_RANK,
  PROJECT_COLORS, SEED_CARDS, SEED_COMMENT_TEMPLATES, SEED_LABELS, SEED_PEOPLE,
  SKYLINE_COLUMNS, TODAY, TYPE_META, iso,
} from '@/data/seed';

const STORAGE_KEY = 'kanrds-state-v1';
const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

interface PersistedState {
  projects?: Project[];
  expandedProjects?: Record<string, boolean>;
  activeProjectId?: string | null;
  activeBoardId?: string | null;
  PEOPLE?: Person[];
  LABELS?: Record<string, Label>;
  cardComments?: Record<string, Comment[]>;
  cardAttachments?: Record<string, Attachment[]>;
}

const cloneCol = (c: Column): Column => ({ id: c.id, title: c.title, dot: c.dot });
const cloneCard = (c: Card): Card => ({
  ...c,
  labels: [...c.labels],
  assignees: [...c.assignees],
  checklist: c.checklist ? c.checklist.map((ci) => ({ ...ci })) : undefined,
});

function buildSeedProjects(): Project[] {
  return [
    {
      id: 'p1', name: 'SkyLine', color: '#0F766E', icon: 'mdi-rocket-launch-outline',
      boards: [
        { id: 'b1', name: 'Sprint 42', columns: SKYLINE_COLUMNS.map(cloneCol), cards: SEED_CARDS.map(cloneCard) },
        { id: 'b2', name: 'Plataforma · Infra', columns: SKYLINE_COLUMNS.map(cloneCol), cards: [] },
        { id: 'b3', name: 'Mobile · iOS 3.0', columns: SKYLINE_COLUMNS.map(cloneCol), cards: [] },
      ],
    },
    {
      id: 'p2', name: 'Marketing', color: '#EC4899', icon: 'mdi-bullhorn-outline',
      boards: [{ id: 'b4', name: 'Growth experiments', columns: SKYLINE_COLUMNS.map(cloneCol), cards: [] }],
    },
    {
      id: 'p3', name: 'Operações', color: '#F59E0B', icon: 'mdi-cog-outline',
      boards: [{ id: 'b5', name: 'Suporte L2', columns: SKYLINE_COLUMNS.map(cloneCol), cards: [] }],
    },
  ];
}

export const useBoardStore = defineStore('board', () => {
  // ---- Restore from localStorage ----
  let saved: PersistedState | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw) as PersistedState;
  } catch (e) { console.warn('Falha ao restaurar estado:', e); }

  const projects = reactive<Project[]>(saved ? (saved.projects ?? []) : buildSeedProjects());
  const expandedProjects = reactive<Record<string, boolean>>(saved?.expandedProjects ?? { p1: true, p2: false, p3: false });
  const activeProjectId = ref<string | null>(saved ? (saved.activeProjectId ?? null) : 'p1');
  const activeBoardId = ref<string | null>(saved ? (saved.activeBoardId ?? null) : 'b1');
  const PEOPLE = reactive<Person[]>(saved ? (saved.PEOPLE ?? []) : SEED_PEOPLE.map((p) => ({ ...p })));
  const LABELS = reactive<Record<string, Label>>(saved ? (saved.LABELS ?? {}) : { ...SEED_LABELS });

  const activeProject = computed(() => projects.find((p) => p.id === activeProjectId.value) ?? projects[0]);
  const activeBoard = computed(() => activeProject.value?.boards.find((b) => b.id === activeBoardId.value) ?? activeProject.value?.boards[0]);

  // Live mirrors of active board's columns + cards (existing splice-style code keeps working)
  const COLUMNS = reactive<Column[]>([]);
  const cards = reactive<Card[]>([]);

  function hydrateBoard() {
    const b = activeBoard.value;
    if (!b) {
      COLUMNS.splice(0, COLUMNS.length);
      cards.splice(0, cards.length);
      return;
    }
    COLUMNS.splice(0, COLUMNS.length, ...b.columns.map(cloneCol));
    cards.splice(0, cards.length, ...b.cards.map(cloneCard));
  }
  hydrateBoard();

  // Sync changes back to active board
  watch(cards, () => {
    const p = projects.find((x) => x.id === activeProjectId.value);
    const b = p?.boards.find((x) => x.id === activeBoardId.value);
    if (b) b.cards = cards.map(cloneCard);
  }, { deep: true });
  watch(COLUMNS, () => {
    const p = projects.find((x) => x.id === activeProjectId.value);
    const b = p?.boards.find((x) => x.id === activeBoardId.value);
    if (b) b.columns = COLUMNS.map(cloneCol);
  }, { deep: true });

  // ---- UI state ----
  const drawer = ref(true);
  const view = ref<ViewMode>('board');
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
    } else { sortBy.value = field; sortDir.value = 'asc'; }
  }

  // ---- Computed lists ----
  const visible = computed(() => {
    const q = searchQ.value.trim().toLowerCase();
    return cards.filter((c) => {
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
    COLUMNS.forEach((c) => { m[c.id] = []; });
    visible.value.forEach((c) => { (m[c.col] ??= []).push(c); });
    return m;
  });
  const totalByCol = computed(() => {
    const m: Record<string, number> = {};
    COLUMNS.forEach((c) => { m[c.id] = cards.filter((k) => k.col === c.id).length; });
    return m;
  });
  const sprintStats = computed(() => {
    const total = cards.length;
    const done = cards.filter((c) => c.col === 'done').length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  });
  const overdueCount = computed(() =>
    cards.filter((c) => c.due && new Date(c.due + 'T00:00:00') < TODAY && c.col !== 'done').length,
  );

  const personById = (id: string) => PEOPLE.find((p) => p.id === id);

  // ---- Card dialog ----
  const dialogCardId = ref<string | null>(null);
  const currentCard = computed(() => cards.find((c) => c.id === dialogCardId.value) ?? null);
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
    const nextNum = 200 + cards.length;
    cards.push({
      id: 'KAN-' + nextNum, col: colId, type: 'task', title: t,
      labels: [], assignees: [], due: null, priority: 'medium',
      comments: 0, attachments: 0,
    });
    newCardTitle.value = '';
    addingInCol.value = null;
  }

  // ---- Drag/drop ----
  const dragCardId = ref<string | null>(null);
  const dragOverCol = ref<string | null>(null);
  function onDragStart(e: DragEvent, id: string) {
    dragCardId.value = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    }
    (e.currentTarget as HTMLElement).classList.add('dragging');
  }
  function onDragEnd(e: DragEvent) {
    dragCardId.value = null;
    dragOverCol.value = null;
    (e.currentTarget as HTMLElement).classList.remove('dragging');
  }
  function onDragOver(e: DragEvent, colId: string) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    dragOverCol.value = colId;
  }
  function onDragLeave(colId: string) {
    if (dragOverCol.value === colId) dragOverCol.value = null;
  }
  function onDrop(e: DragEvent, colId: string) {
    e.preventDefault();
    const id = e.dataTransfer?.getData('text/plain') || dragCardId.value;
    const c = cards.find((x) => x.id === id);
    if (c) c.col = colId;
    dragCardId.value = null;
    dragOverCol.value = null;
  }

  // ---- Date formatting ----
  function fmtDue(isoDate: string | null) {
    if (!isoDate) return null;
    const d = new Date(isoDate + 'T00:00:00');
    const diff = Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const lbl = `${d.getDate()} ${months[d.getMonth()]}`;
    let cls = '';
    if (diff < 0) cls = 'due-over';
    else if (diff <= 2) cls = 'due-soon';
    return { lbl, diff, cls };
  }

  // ---- Calendar ----
  const calMonth = ref(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));
  function calNext() { const n = new Date(calMonth.value); n.setMonth(n.getMonth() + 1); calMonth.value = n; }
  function calPrev() { const n = new Date(calMonth.value); n.setMonth(n.getMonth() - 1); calMonth.value = n; }
  const calCells = computed(() => {
    const first = new Date(calMonth.value);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const items = visible.value.filter((c) => c.due === iso(d));
      cells.push({
        date: d, day: d.getDate(),
        out: d.getMonth() !== first.getMonth(),
        today: iso(d) === iso(TODAY),
        items,
      });
    }
    return cells;
  });
  const monthLabel = computed(() => {
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${months[calMonth.value.getMonth()]} ${calMonth.value.getFullYear()}`;
  });

  function toggleCheck(card: Card, i: number) {
    if (!card.checklist) return;
    card.checklist[i].d = !card.checklist[i].d;
  }

  // ---- Comments ----
  const cardComments = reactive<Record<string, Comment[]>>(saved?.cardComments ?? {});
  // Seed comments if missing
  cards.forEach((c) => {
    if (cardComments[c.id]) return;
    const n = Math.max(0, c.comments || 0);
    if (!n) return;
    cardComments[c.id] = Array.from({ length: n }, (_, i) => ({
      id: 'c' + i,
      ...SEED_COMMENT_TEMPLATES[i % SEED_COMMENT_TEMPLATES.length],
    }));
  });
  const newCommentText = ref('');
  function commentCount(cardId: string) { return (cardComments[cardId] || []).length; }
  function saveComment(cardId: string) {
    const t = newCommentText.value.trim();
    if (!t) return;
    if (!cardComments[cardId]) cardComments[cardId] = [];
    cardComments[cardId].unshift({
      id: Date.now().toString(),
      author: 'Você', initials: 'VM', color: '#6366F1',
      text: t, time: 'agora',
    });
    const c = cards.find((x) => x.id === cardId);
    if (c) c.comments = cardComments[cardId].length;
    newCommentText.value = '';
  }
  function removeComment(cardId: string, commentId: string) {
    if (!cardComments[cardId]) return;
    cardComments[cardId] = cardComments[cardId].filter((x) => x.id !== commentId);
    const c = cards.find((x) => x.id === cardId);
    if (c) c.comments = cardComments[cardId].length;
  }

  // ---- Attachments ----
  const cardAttachments = reactive<Record<string, Attachment[]>>(saved?.cardAttachments ?? {});
  const attachmentError = ref('');
  const attachmentDragOver = ref(false);
  function attachmentCount(cardId: string) { return (cardAttachments[cardId] || []).length; }
  function isImageAttachment(att: Attachment | null | undefined) {
    return !!att && typeof att.type === 'string' && att.type.startsWith('image/');
  }
  function fmtFileSize(bytes: number) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  function fileIconFor(att: Attachment) {
    const t = (att?.type || '').toLowerCase();
    const n = (att?.name || '').toLowerCase();
    if (t.startsWith('image/')) return 'mdi-file-image-outline';
    if (t.startsWith('video/')) return 'mdi-file-video-outline';
    if (t.startsWith('audio/')) return 'mdi-file-music-outline';
    if (t === 'application/pdf' || n.endsWith('.pdf')) return 'mdi-file-pdf-box';
    if (t.includes('zip') || /\.(zip|rar|7z)$/.test(n)) return 'mdi-folder-zip-outline';
    if (t.includes('word') || /\.(doc|docx)$/.test(n)) return 'mdi-file-word-outline';
    if (t.includes('sheet') || /\.(xls|xlsx|csv)$/.test(n)) return 'mdi-file-excel-outline';
    if (t.includes('presentation') || /\.(ppt|pptx)$/.test(n)) return 'mdi-file-powerpoint-outline';
    if (t.startsWith('text/') || /\.(md|txt)$/.test(n)) return 'mdi-file-document-outline';
    if (/\.(js|ts|jsx|tsx|py|rb|go|rs|java|cpp|c|cs|html|css|json|xml|yml|yaml)$/.test(n)) return 'mdi-file-code-outline';
    return 'mdi-file-outline';
  }
  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }
  async function addAttachmentFiles(cardId: string, fileList: FileList) {
    attachmentError.value = '';
    if (!cardId || !fileList || !fileList.length) return;
    if (!cardAttachments[cardId]) cardAttachments[cardId] = [];
    const skipped: string[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > ATTACHMENT_MAX_BYTES) {
        skipped.push(`${file.name} (${fmtFileSize(file.size)})`);
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        cardAttachments[cardId].unshift({
          id: 'att_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
          name: file.name, type: file.type || '', size: file.size,
          dataUrl, addedAt: new Date().toISOString(),
        });
      } catch { skipped.push(file.name); }
    }
    const c = cards.find((x) => x.id === cardId);
    if (c) c.attachments = cardAttachments[cardId].length;
    if (skipped.length) {
      attachmentError.value = `Não foi possível anexar (limite ${fmtFileSize(ATTACHMENT_MAX_BYTES)} por arquivo): ${skipped.join(', ')}`;
      setTimeout(() => { attachmentError.value = ''; }, 6000);
    }
  }
  function removeAttachment(cardId: string, attId: string) {
    if (!cardAttachments[cardId]) return;
    cardAttachments[cardId] = cardAttachments[cardId].filter((a) => a.id !== attId);
    const c = cards.find((x) => x.id === cardId);
    if (c) c.attachments = cardAttachments[cardId].length;
  }
  function downloadAttachment(att: Attachment) {
    if (!att?.dataUrl) return;
    const a = document.createElement('a');
    a.href = att.dataUrl; a.download = att.name || 'attachment';
    document.body.appendChild(a); a.click(); a.remove();
  }
  function onAttachmentDragOver(e: DragEvent) { e.preventDefault(); attachmentDragOver.value = true; }
  function onAttachmentDragLeave() { attachmentDragOver.value = false; }
  async function onAttachmentDrop(e: DragEvent, cardId: string) {
    e.preventDefault();
    attachmentDragOver.value = false;
    const files = e.dataTransfer?.files;
    if (files?.length) await addAttachmentFiles(cardId, files);
  }
  async function onAttachmentInputChange(e: Event, cardId: string) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) await addAttachmentFiles(cardId, target.files);
    target.value = '';
  }

  // ---- New / edit task dialog ----
  const newTaskOpen = ref(false);
  const newTaskEditId = ref<string | null>(null);
  const newTask = reactive({
    title: '', description: '', col: 'todo', type: 'task' as Card['type'],
    priority: 'medium' as Priority, due: '', labels: [] as string[], assignees: [] as string[],
    checklist: [] as ChecklistItem[], newChecklistItem: '',
  });
  function resetNewTask() {
    newTask.title = ''; newTask.description = '';
    newTask.col = COLUMNS[0]?.id ?? 'todo'; newTask.type = 'task';
    newTask.priority = 'medium'; newTask.due = '';
    newTask.labels = []; newTask.assignees = [];
    newTask.checklist = []; newTask.newChecklistItem = '';
    newTaskEditId.value = null;
  }
  function openNewTask(colId?: string) {
    resetNewTask();
    if (colId) newTask.col = colId;
    newTaskOpen.value = true;
  }
  function deleteCard(id: string) {
    const i = cards.findIndex((c) => c.id === id);
    if (i !== -1) cards.splice(i, 1);
    closeCard();
  }
  function openEditTask(card: Card) {
    newTaskEditId.value = card.id;
    newTask.title = card.title;
    newTask.description = '';
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
    if (newTaskEditId.value) {
      const c = cards.find((x) => x.id === newTaskEditId.value);
      if (c) {
        c.title = t; c.col = newTask.col; c.type = newTask.type;
        c.priority = newTask.priority; c.due = newTask.due || null;
        c.labels = [...newTask.labels]; c.assignees = [...newTask.assignees];
        if (newTask.checklist.length) c.checklist = newTask.checklist.map((x) => ({ t: x.t, d: x.d }));
        else delete c.checklist;
      }
    } else {
      const nextNum = 200 + cards.length;
      const card: Card = {
        id: 'KAN-' + nextNum, col: newTask.col, type: newTask.type, title: t,
        labels: [...newTask.labels], assignees: [...newTask.assignees],
        due: newTask.due || null, priority: newTask.priority,
        comments: 0, attachments: 0,
      };
      if (newTask.checklist.length) card.checklist = newTask.checklist.map((c) => ({ t: c.t, d: c.d }));
      cards.push(card);
    }
    newTaskOpen.value = false;
  }

  // ---- People ----
  const peopleDialogOpen = ref(false);
  const personForm = reactive({ id: null as string | null, name: '', initials: '', color: '#6366F1', role: '', email: '' });
  const personFormError = ref('');
  function openPeopleDialog() { peopleDialogOpen.value = true; }
  function startEditPerson(p: Person) {
    personForm.id = p.id; personForm.name = p.name; personForm.initials = p.initials;
    personForm.color = p.color; personForm.role = p.role || ''; personForm.email = p.email || '';
    personFormError.value = '';
  }
  function resetPersonForm() {
    personForm.id = null; personForm.name = ''; personForm.initials = '';
    personForm.color = AVATAR_COLORS[PEOPLE.length % AVATAR_COLORS.length];
    personForm.role = ''; personForm.email = '';
    personFormError.value = '';
  }
  function autoInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  watch(() => personForm.name, (v) => { if (!personForm.id) personForm.initials = autoInitials(v); });
  function savePerson() {
    if (!personForm.name.trim()) { personFormError.value = 'Nome obrigatório.'; return; }
    if (!personForm.initials.trim()) { personFormError.value = 'Iniciais obrigatórias.'; return; }
    if (personForm.id) {
      const p = PEOPLE.find((x) => x.id === personForm.id);
      if (p) {
        p.name = personForm.name.trim();
        p.initials = personForm.initials.trim().toUpperCase().slice(0, 2);
        p.color = personForm.color; p.role = personForm.role; p.email = personForm.email;
      }
    } else {
      PEOPLE.push({
        id: 'u' + Date.now(),
        name: personForm.name.trim(),
        initials: personForm.initials.trim().toUpperCase().slice(0, 2),
        color: personForm.color, role: personForm.role, email: personForm.email,
      });
    }
    resetPersonForm();
  }
  function deletePerson(id: string) {
    const i = PEOPLE.findIndex((x) => x.id === id);
    if (i !== -1) PEOPLE.splice(i, 1);
    cards.forEach((c) => { c.assignees = c.assignees.filter((a) => a !== id); });
    if (personForm.id === id) resetPersonForm();
  }

  // ---- Labels ----
  const labelsDialogOpen = ref(false);
  const labelForm = reactive({ key: '', name: '', fg: '#1E40AF', bg: '#DBEAFE', isEdit: false, origKey: '' });
  const labelFormError = ref('');
  function resetLabelForm() {
    labelForm.key = ''; labelForm.name = ''; labelForm.fg = '#1E40AF'; labelForm.bg = '#DBEAFE';
    labelForm.isEdit = false; labelForm.origKey = '';
    labelFormError.value = '';
  }
  function startEditLabel(key: string) {
    const l = LABELS[key];
    labelForm.key = key; labelForm.name = l.name; labelForm.fg = l.fg; labelForm.bg = l.bg;
    labelForm.isEdit = true; labelForm.origKey = key;
    labelFormError.value = '';
  }
  function saveLabel() {
    const key = labelForm.key.trim().toLowerCase().replace(/\s+/g, '-');
    if (!key) { labelFormError.value = 'Chave obrigatória.'; return; }
    if (!labelForm.name.trim()) { labelFormError.value = 'Nome obrigatório.'; return; }
    if (!labelForm.isEdit && LABELS[key]) { labelFormError.value = 'Essa chave já existe.'; return; }
    if (labelForm.isEdit && labelForm.origKey !== key) {
      delete LABELS[labelForm.origKey];
      cards.forEach((c) => {
        const i = c.labels.indexOf(labelForm.origKey);
        if (i !== -1) c.labels.splice(i, 1, key);
      });
    }
    LABELS[key] = { name: labelForm.name.trim(), fg: labelForm.fg, bg: labelForm.bg };
    resetLabelForm();
  }
  function deleteLabel(key: string) {
    delete LABELS[key];
    cards.forEach((c) => { c.labels = c.labels.filter((l) => l !== key); });
    filterLabel.value = filterLabel.value.filter((k) => k !== key);
    if (labelForm.origKey === key) resetLabelForm();
  }
  function applyPreset(preset: { fg: string; bg: string }) {
    labelForm.fg = preset.fg; labelForm.bg = preset.bg;
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
    newColumnColor.value = COLUMN_PRESETS[COLUMNS.length % COLUMN_PRESETS.length];
    nextTick(() => document.getElementById('new-column-input')?.focus());
  }
  function commitAddColumn() {
    const t = newColumnTitle.value.trim();
    if (!t) { addingColumn.value = false; return; }
    const id = 'col_' + Date.now();
    COLUMNS.push({ id, title: t, dot: newColumnColor.value });
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
    const col = COLUMNS.find((c) => c.id === colId);
    if (!col) return;
    const colCards = cards.filter((c) => c.col === colId).length;
    if (colCards > 0) {
      deleteColTarget.value = { id: colId, title: col.title, count: colCards };
      deleteColDialog.value = true;
      return;
    }
    const i = COLUMNS.findIndex((c) => c.id === colId);
    if (i !== -1) COLUMNS.splice(i, 1);
  }
  function confirmDeleteColumn() {
    const colId = deleteColTarget.value.id;
    const fallback = COLUMNS.find((c) => c.id !== colId)?.id || 'backlog';
    cards.forEach((c) => { if (c.col === colId) c.col = fallback; });
    const i = COLUMNS.findIndex((c) => c.id === colId);
    if (i !== -1) COLUMNS.splice(i, 1);
    deleteColDialog.value = false;
  }
  function changeColumnColor(col: Column, color: string) { col.dot = color; }
  function moveColumn(colId: string, dir: number) {
    const i = COLUMNS.findIndex((c) => c.id === colId);
    if (i === -1) return;
    const j = i + dir;
    if (j < 0 || j >= COLUMNS.length) return;
    const tmp = COLUMNS[i]; COLUMNS.splice(i, 1); COLUMNS.splice(j, 0, tmp);
  }

  // ---- Project / Board CRUD ----
  function nextId(prefix: string) {
    let n = 1;
    while (
      projects.some((p) => p.id === prefix + n) ||
      projects.some((p) => p.boards.some((b) => b.id === prefix + n))
    ) n++;
    return prefix + n;
  }

  function switchBoard(projectId: string, boardId: string) {
    const curProject = projects.find((p) => p.id === activeProjectId.value);
    const curBoard = curProject?.boards.find((b) => b.id === activeBoardId.value);
    if (curBoard) {
      curBoard.cards = cards.map(cloneCard);
      curBoard.columns = COLUMNS.map(cloneCol);
    }
    activeProjectId.value = projectId;
    activeBoardId.value = boardId;
    dialogCardId.value = null;
    nextTick(hydrateBoard);
  }

  function addProject(name: string) {
    const t = (name || '').trim();
    if (!t) return;
    const id = nextId('p');
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
    const board: Board = { id: nextId('b'), name: 'Board principal', columns: SKYLINE_COLUMNS.map(cloneCol), cards: [] };
    projects.push({ id, name: t, color, icon: 'mdi-folder-outline', boards: [board] });
    expandedProjects[id] = true;
    switchBoard(id, board.id);
  }
  function removeProject(projectId: string) {
    const i = projects.findIndex((p) => p.id === projectId);
    if (i === -1) return;
    const wasActive = activeProjectId.value === projectId;
    projects.splice(i, 1);
    if (wasActive) {
      const fb = projects[0];
      if (fb) {
        activeProjectId.value = fb.id;
        activeBoardId.value = fb.boards[0]?.id ?? null;
        dialogCardId.value = null;
        nextTick(hydrateBoard);
      } else {
        COLUMNS.splice(0, COLUMNS.length);
        cards.splice(0, cards.length);
        activeProjectId.value = null;
        activeBoardId.value = null;
      }
    }
  }
  function renameProject(projectId: string, name: string) {
    const p = projects.find((x) => x.id === projectId);
    if (p && name.trim()) p.name = name.trim();
  }
  function addBoard(projectId: string, name: string) {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    const t = (name || '').trim();
    if (!t) return;
    const isDoneCol = (c: Column) => {
      const id = (c.id || '').toLowerCase();
      const title = (c.title || '').toLowerCase().trim();
      return id === 'done' || ['done', 'concluído', 'concluido', 'concluídos', 'concluidos', 'finalizado', 'finalizados', 'feito', 'feitos'].includes(title);
    };
    const sourceBoard = p.boards[0] ?? activeBoard.value ?? null;
    const newCols: Column[] = (sourceBoard?.columns ?? SKYLINE_COLUMNS).map(cloneCol);
    const doneIds = new Set((sourceBoard?.columns ?? []).filter(isDoneCol).map((c) => c.id));
    const sourceCards = sourceBoard && sourceBoard.id === activeBoardId.value ? cards : (sourceBoard?.cards ?? []);
    const newCards: Card[] = sourceCards
      .filter((c) => !doneIds.has(c.col))
      .map((c, idx) => {
        const newId = 'KAN-' + (300 + Math.floor(Math.random() * 9000) + idx);
        if (cardComments[c.id]) cardComments[newId] = cardComments[c.id].map((m) => ({ ...m }));
        if (cardAttachments[c.id]) cardAttachments[newId] = cardAttachments[c.id].map((a) => ({ ...a }));
        return {
          ...c, id: newId,
          labels: [...(c.labels || [])],
          assignees: [...(c.assignees || [])],
          checklist: c.checklist?.length ? c.checklist.map((it) => ({ ...it })) : undefined,
        };
      });
    const board: Board = { id: nextId('b'), name: t, columns: newCols, cards: newCards };
    p.boards.push(board);
    expandedProjects[projectId] = true;
    switchBoard(projectId, board.id);
  }
  function removeBoard(projectId: string, boardId: string) {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    const i = p.boards.findIndex((b) => b.id === boardId);
    if (i === -1) return;
    const wasActive = activeBoardId.value === boardId;
    p.boards.splice(i, 1);
    if (wasActive) {
      let nextProjectId: string | null = projectId;
      let nextBoardId: string | null = p.boards[0]?.id ?? null;
      if (!nextBoardId) {
        const fbProject = projects.find((x) => x.boards.length);
        if (fbProject) {
          nextProjectId = fbProject.id;
          nextBoardId = fbProject.boards[0].id;
        } else { nextProjectId = null; nextBoardId = null; }
      }
      activeProjectId.value = nextProjectId;
      activeBoardId.value = nextBoardId;
      dialogCardId.value = null;
      if (nextBoardId) nextTick(hydrateBoard);
      else { COLUMNS.splice(0, COLUMNS.length); cards.splice(0, cards.length); }
    }
  }
  function renameBoard(projectId: string, boardId: string, name: string) {
    const p = projects.find((x) => x.id === projectId);
    const b = p?.boards.find((x) => x.id === boardId);
    if (b && name.trim()) b.name = name.trim();
  }

  // ---- Sidebar inline forms ----
  const addingProject = ref(false);
  const newProjectName = ref('');
  const addingBoardIn = ref<string | null>(null);
  const newBoardName = ref('');
  const editingProjectId = ref<string | null>(null);
  const editingProjectName = ref('');
  const editingBoardId = ref<string | null>(null);
  const editingBoardName = ref('');
  function beginAddProject() {
    addingProject.value = true;
    newProjectName.value = '';
    nextTick(() => document.getElementById('new-project-input')?.focus());
  }
  function commitAddProject() {
    if (newProjectName.value.trim()) addProject(newProjectName.value);
    addingProject.value = false; newProjectName.value = '';
  }
  function beginAddBoard(projectId: string) {
    addingBoardIn.value = projectId;
    newBoardName.value = '';
    expandedProjects[projectId] = true;
    nextTick(() => document.getElementById('new-board-input')?.focus());
  }
  function commitAddBoard() {
    if (addingBoardIn.value && newBoardName.value.trim()) {
      addBoard(addingBoardIn.value, newBoardName.value);
    }
    addingBoardIn.value = null; newBoardName.value = '';
  }
  function beginRenameProject(p: Project) {
    editingProjectId.value = p.id;
    editingProjectName.value = p.name;
    nextTick(() => document.getElementById('edit-project-input-' + p.id)?.focus());
  }
  function commitRenameProject() {
    if (editingProjectId.value && editingProjectName.value.trim()) {
      renameProject(editingProjectId.value, editingProjectName.value);
    }
    editingProjectId.value = null;
  }
  function beginRenameBoard(b: Board) {
    editingBoardId.value = b.id;
    editingBoardName.value = b.name;
    nextTick(() => document.getElementById('edit-board-input-' + b.id)?.focus());
  }
  function commitRenameBoard(projectId: string) {
    if (editingBoardId.value && editingBoardName.value.trim()) {
      renameBoard(projectId, editingBoardId.value, editingBoardName.value);
    }
    editingBoardId.value = null;
  }
  function toggleProject(projectId: string) {
    expandedProjects[projectId] = !expandedProjects[projectId];
  }

  // ---- Persistence ----
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  function saveState() {
    const project = projects.find((p) => p.id === activeProjectId.value);
    const board = project?.boards.find((b) => b.id === activeBoardId.value);
    if (board) {
      board.cards = JSON.parse(JSON.stringify(cards));
      board.columns = JSON.parse(JSON.stringify(COLUMNS));
    }
    try {
      const snap: PersistedState = {
        projects: JSON.parse(JSON.stringify(projects)),
        expandedProjects: { ...expandedProjects },
        activeProjectId: activeProjectId.value,
        activeBoardId: activeBoardId.value,
        PEOPLE: JSON.parse(JSON.stringify(PEOPLE)),
        LABELS: JSON.parse(JSON.stringify(LABELS)),
        cardComments: JSON.parse(JSON.stringify(cardComments)),
        cardAttachments: JSON.parse(JSON.stringify(cardAttachments)),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch (e) { console.warn('Falha ao persistir:', e); }
  }
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 250);
  }
  watch([projects, expandedProjects, PEOPLE, LABELS, cardComments, cardAttachments, cards, COLUMNS], scheduleSave, { deep: true });
  watch([activeProjectId, activeBoardId], scheduleSave);

  const resetConfirmOpen = ref(false);
  function resetAllData() {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    location.reload();
  }

  const clearDbConfirmOpen = ref(false);
  function clearAllData() {
    try {
      const empty: PersistedState = { projects: [], expandedProjects: {}, activeProjectId: null, activeBoardId: null, PEOPLE: [], LABELS: {} };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(empty));
    } catch {}
    location.reload();
  }

  return {
    // constants
    TYPE_META, PRIORITY_META, COLUMN_PRESETS, AVATAR_COLORS, LABEL_PRESETS,
    // state
    drawer, view, projects, expandedProjects, activeProjectId, activeBoardId,
    activeProject, activeBoard, COLUMNS, cards, PEOPLE, LABELS,
    searchQ, filterLabel, filterAssignee, filterOverdue,
    sortBy, sortDir, toggleSort, sortedVisible,
    visible, cardsByCol, totalByCol, sprintStats, overdueCount,
    // card dialog
    dialogCardId, currentCard, openCard, closeCard,
    // inline add
    addingInCol, newCardTitle, beginAdd, cancelAdd, commitAdd,
    // drag/drop
    onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, dragOverCol,
    // utils
    fmtDue, personById,
    // calendar
    calCells, calNext, calPrev, monthLabel,
    // checklist
    toggleCheck,
    // comments
    cardComments, newCommentText, saveComment, removeComment, commentCount,
    // attachments
    cardAttachments, attachmentCount, attachmentError,
    isImageAttachment, fmtFileSize, fileIconFor,
    addAttachmentFiles, removeAttachment, downloadAttachment,
    attachmentDragOver, onAttachmentDragOver, onAttachmentDragLeave,
    onAttachmentDrop, onAttachmentInputChange,
    // people management
    peopleDialogOpen, openPeopleDialog, personForm, personFormError,
    startEditPerson, resetPersonForm, savePerson, deletePerson,
    // labels management
    labelsDialogOpen, labelForm, labelFormError,
    resetLabelForm, startEditLabel, saveLabel, deleteLabel, applyPreset,
    // column CRUD
    addingColumn, newColumnTitle, newColumnColor, beginAddColumn, commitAddColumn, cancelAddColumn,
    editingCol, editingColTitle, startRenameColumn, commitRenameColumn,
    deleteColumn, changeColumnColor, moveColumn,
    deleteColDialog, deleteColTarget, confirmDeleteColumn,
    // task form
    newTaskOpen, newTaskEditId, newTask, openNewTask, openEditTask, commitNewTask, deleteCard,
    addChecklistItem, removeChecklistItem, toggleArrayVal,
    // project/board CRUD
    switchBoard, addProject, removeProject, addBoard, removeBoard,
    addingProject, newProjectName, beginAddProject, commitAddProject,
    addingBoardIn, newBoardName, beginAddBoard, commitAddBoard,
    editingProjectId, editingProjectName, beginRenameProject, commitRenameProject,
    editingBoardId, editingBoardName, beginRenameBoard, commitRenameBoard,
    toggleProject,
    // reset / clear
    resetAllData, resetConfirmOpen,
    clearAllData, clearDbConfirmOpen,
  };
});
