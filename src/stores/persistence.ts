import { nextTick, watch } from 'vue';
import type { Attachment, Comment, Label, Person, Project } from '@/types';
import { useActivityStore } from './activity';
import { useBoardStore } from './board';
import { useHistoryStore, type HistorySnapshot } from './history';
import { useLabelsStore } from './labels';
import { usePeopleStore } from './people';
import { useWorkspaceStore } from './workspace';

const STORAGE_KEY = 'kanrds-state-v1';

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

export function setupPersistence() {
  const workspace = useWorkspaceStore();
  const board = useBoardStore();
  const people = usePeopleStore();
  const labels = useLabelsStore();
  const activity = useActivityStore();
  const history = useHistoryStore();

  // ---- Restore ----
  let saved: PersistedState | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) saved = JSON.parse(raw) as PersistedState;
  } catch (e) {
    console.warn('Falha ao restaurar estado:', e);
  }

  if (saved) {
    if (saved.projects) workspace.setProjects(saved.projects);
    if (saved.expandedProjects) workspace.setExpanded(saved.expandedProjects);
    workspace.setActive(saved.activeProjectId ?? null, saved.activeBoardId ?? null);
    if (saved.PEOPLE) people.setPeople(saved.PEOPLE);
    if (saved.LABELS) labels.setLabels(saved.LABELS);
    if (saved.cardComments) activity.setComments(saved.cardComments);
    if (saved.cardAttachments) activity.setAttachments(saved.cardAttachments);
  }

  activity.seedFromCards(workspace.allCards());

  watch(
    () => workspace.activeBoardId,
    () => board.clearActiveCardDialog(),
  );

  // ---- Snapshot helpers ----
  function snapshot(): HistorySnapshot {
    return {
      projects: JSON.parse(JSON.stringify(workspace.projects)) as Project[],
      expandedProjects: { ...workspace.expandedProjects },
      activeProjectId: workspace.activeProjectId,
      activeBoardId: workspace.activeBoardId,
      PEOPLE: JSON.parse(JSON.stringify(people.PEOPLE)) as Person[],
      LABELS: JSON.parse(JSON.stringify(labels.LABELS)) as Record<string, Label>,
      cardComments: JSON.parse(JSON.stringify(activity.cardComments)) as Record<string, Comment[]>,
      cardAttachments: JSON.parse(JSON.stringify(activity.cardAttachments)) as Record<string, Attachment[]>,
    };
  }

  function applySnapshot(s: HistorySnapshot) {
    history.setSuspended(true);
    workspace.setProjects(s.projects ?? []);
    workspace.setExpanded(s.expandedProjects ?? {});
    workspace.setActive(s.activeProjectId ?? null, s.activeBoardId ?? null);
    people.setPeople(s.PEOPLE ?? []);
    labels.setLabels(s.LABELS ?? {});
    activity.setComments(s.cardComments ?? {});
    activity.setAttachments(s.cardAttachments ?? {});
    nextTick(() => {
      // Wait one extra tick so the watcher's scheduled record settles.
      setTimeout(() => history.setSuspended(false), 0);
    });
  }

  // ---- Save (debounced) ----
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot()));
    } catch (e) {
      console.warn('Falha ao persistir:', e);
    }
  }
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 250);
  }

  // ---- History (debounced) ----
  let histTimer: ReturnType<typeof setTimeout> | null = null;
  function scheduleRecord() {
    if (histTimer) clearTimeout(histTimer);
    histTimer = setTimeout(() => history.record(snapshot()), 300);
  }
  function flushRecord() {
    if (histTimer) {
      clearTimeout(histTimer);
      histTimer = null;
      history.record(snapshot());
    }
  }

  history.init(snapshot());
  history.bind(snapshot, applySnapshot, flushRecord);

  watch(
    () => [
      workspace.projects,
      workspace.expandedProjects,
      workspace.activeProjectId,
      workspace.activeBoardId,
      people.PEOPLE,
      labels.LABELS,
      activity.cardComments,
      activity.cardAttachments,
    ],
    () => {
      scheduleSave();
      scheduleRecord();
    },
    { deep: true },
  );
}
