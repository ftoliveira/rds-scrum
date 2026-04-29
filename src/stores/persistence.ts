import { watch } from 'vue';
import type { Attachment, Comment, Label, Person, Project } from '@/types';
import { useActivityStore } from './activity';
import { useBoardStore } from './board';
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

  // Seed missing comments for cards that declare a count
  activity.seedFromCards(workspace.allCards());

  // Reset card dialog when board switches
  watch(
    () => workspace.activeBoardId,
    () => board.clearActiveCardDialog(),
  );

  // ---- Save (debounced) ----
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  function snapshot(): PersistedState {
    return {
      projects: JSON.parse(JSON.stringify(workspace.projects)),
      expandedProjects: { ...workspace.expandedProjects },
      activeProjectId: workspace.activeProjectId,
      activeBoardId: workspace.activeBoardId,
      PEOPLE: JSON.parse(JSON.stringify(people.PEOPLE)),
      LABELS: JSON.parse(JSON.stringify(labels.LABELS)),
      cardComments: JSON.parse(JSON.stringify(activity.cardComments)),
      cardAttachments: JSON.parse(JSON.stringify(activity.cardAttachments)),
    };
  }
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
    scheduleSave,
    { deep: true },
  );
}
