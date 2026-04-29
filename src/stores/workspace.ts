import { defineStore } from 'pinia';
import { computed, nextTick, reactive, ref } from 'vue';
import type { Board, Card, Column, Project } from '@/types';
import { cloneCard, cloneCol } from '@/utils/clone';
import { nextSeq } from '@/utils/id';
import { PROJECT_COLORS, SEED_CARDS, SKYLINE_COLUMNS } from '@/data/seed';

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

const DONE_COL_TITLES = new Set([
  'done', 'concluído', 'concluido', 'concluídos', 'concluidos',
  'finalizado', 'finalizados', 'feito', 'feitos',
]);
const isDoneCol = (c: Column) => {
  const id = (c.id || '').toLowerCase();
  const title = (c.title || '').toLowerCase().trim();
  return id === 'done' || DONE_COL_TITLES.has(title);
};

export const useWorkspaceStore = defineStore('workspace', () => {
  const projects = reactive<Project[]>(buildSeedProjects());
  const expandedProjects = reactive<Record<string, boolean>>({ p1: true, p2: false, p3: false });
  const activeProjectId = ref<string | null>('p1');
  const activeBoardId = ref<string | null>('b1');

  const activeProject = computed(
    () => projects.find((p) => p.id === activeProjectId.value) ?? projects[0],
  );
  const activeBoard = computed(
    () => activeProject.value?.boards.find((b) => b.id === activeBoardId.value)
      ?? activeProject.value?.boards[0],
  );

  function allCards(): Card[] {
    const out: Card[] = [];
    for (const p of projects) {
      for (const b of p.boards) {
        for (const c of b.cards) out.push(c);
      }
    }
    return out;
  }

  function forEachCard(cb: (c: Card) => void) {
    for (const p of projects) {
      for (const b of p.boards) {
        for (const c of b.cards) cb(c);
      }
    }
  }

  function nextProjectId() {
    return 'p' + nextSeq(projects.map((p) => p.id), 'p');
  }
  function nextBoardId() {
    const used: string[] = [];
    for (const p of projects) for (const b of p.boards) used.push(b.id);
    return 'b' + nextSeq(used, 'b');
  }
  function nextCardId() {
    return 'KAN-' + nextSeq(allCards().map((c) => c.id), 'KAN-');
  }

  function setProjects(next: Project[]) {
    projects.splice(0, projects.length, ...next);
  }
  function setExpanded(map: Record<string, boolean>) {
    Object.keys(expandedProjects).forEach((k) => delete expandedProjects[k]);
    Object.assign(expandedProjects, map);
  }
  function setActive(projectId: string | null, boardId: string | null) {
    activeProjectId.value = projectId;
    activeBoardId.value = boardId;
  }

  function switchBoard(projectId: string, boardId: string) {
    activeProjectId.value = projectId;
    activeBoardId.value = boardId;
  }

  function addProject(name: string) {
    const t = (name || '').trim();
    if (!t) return;
    const id = nextProjectId();
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
    const board: Board = {
      id: nextBoardId(),
      name: 'Board principal',
      columns: SKYLINE_COLUMNS.map(cloneCol),
      cards: [],
    };
    projects.push({ id, name: t, color, icon: 'mdi-folder-outline', boards: [board] });
    expandedProjects[id] = true;
    switchBoard(id, board.id);
  }

  function removeProject(projectId: string, onCardsRemoved?: (cardIds: string[]) => void) {
    const i = projects.findIndex((p) => p.id === projectId);
    if (i === -1) return;
    const wasActive = activeProjectId.value === projectId;
    const removedCardIds = projects[i].boards.flatMap((b) => b.cards.map((c) => c.id));
    projects.splice(i, 1);
    delete expandedProjects[projectId];
    onCardsRemoved?.(removedCardIds);
    if (wasActive) {
      const fb = projects[0];
      activeProjectId.value = fb?.id ?? null;
      activeBoardId.value = fb?.boards[0]?.id ?? null;
    }
  }

  function renameProject(projectId: string, name: string) {
    const p = projects.find((x) => x.id === projectId);
    if (p && name.trim()) p.name = name.trim();
  }

  function addBoard(projectId: string, name: string): Record<string, string> | undefined {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    const t = (name || '').trim();
    if (!t) return;
    const sourceBoard = p.boards[0] ?? activeBoard.value ?? null;
    const newCols: Column[] = (sourceBoard?.columns ?? SKYLINE_COLUMNS).map(cloneCol);
    const doneIds = new Set((sourceBoard?.columns ?? []).filter(isDoneCol).map((c) => c.id));
    const sourceCards = sourceBoard?.cards ?? [];
    const newCards: Card[] = [];
    const idMap: Record<string, string> = {};
    for (const c of sourceCards) {
      if (doneIds.has(c.col)) continue;
      const newId = nextCardId();
      idMap[c.id] = newId;
      newCards.push({ ...cloneCard(c), id: newId });
    }
    const board: Board = { id: nextBoardId(), name: t, columns: newCols, cards: newCards };
    p.boards.push(board);
    expandedProjects[projectId] = true;
    switchBoard(projectId, board.id);
    return idMap;
  }

  function removeBoard(projectId: string, boardId: string, onCardsRemoved?: (cardIds: string[]) => void) {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return;
    const i = p.boards.findIndex((b) => b.id === boardId);
    if (i === -1) return;
    const wasActive = activeBoardId.value === boardId;
    const removedCardIds = p.boards[i].cards.map((c) => c.id);
    p.boards.splice(i, 1);
    onCardsRemoved?.(removedCardIds);
    if (wasActive) {
      let nextProj: string | null = projectId;
      let nextBrd: string | null = p.boards[0]?.id ?? null;
      if (!nextBrd) {
        const fbProject = projects.find((x) => x.boards.length);
        if (fbProject) {
          nextProj = fbProject.id;
          nextBrd = fbProject.boards[0].id;
        } else {
          nextProj = null;
          nextBrd = null;
        }
      }
      activeProjectId.value = nextProj;
      activeBoardId.value = nextBrd;
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
    addingProject.value = false;
    newProjectName.value = '';
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
    addingBoardIn.value = null;
    newBoardName.value = '';
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

  return {
    projects, expandedProjects, activeProjectId, activeBoardId,
    activeProject, activeBoard,
    allCards, forEachCard, nextCardId,
    setProjects, setExpanded, setActive,
    switchBoard, addProject, removeProject, renameProject,
    addBoard, removeBoard, renameBoard,
    addingProject, newProjectName, addingBoardIn, newBoardName,
    editingProjectId, editingProjectName, editingBoardId, editingBoardName,
    beginAddProject, commitAddProject, beginAddBoard, commitAddBoard,
    beginRenameProject, commitRenameProject, beginRenameBoard, commitRenameBoard,
    toggleProject,
  };
});
