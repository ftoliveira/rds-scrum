<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBoardStore } from '@/stores/board';
import { useHistoryStore } from '@/stores/history';
import { useLabelsStore } from '@/stores/labels';
import { usePeopleStore } from '@/stores/people';
import { usePwaStore } from '@/stores/pwa';
import { useUiStore } from '@/stores/ui';
import { useWorkspaceStore } from '@/stores/workspace';
import { useNetworkStatus } from '@/composables/useNetworkStatus';
import SidebarWorkspace from '@/components/SidebarWorkspace.vue';
import BoardView from '@/components/BoardView.vue';
import ListView from '@/components/ListView.vue';
import CalendarView from '@/components/CalendarView.vue';
import CardDialog from '@/components/dialogs/CardDialog.vue';
import TaskFormDialog from '@/components/dialogs/TaskFormDialog.vue';
import PeopleDialog from '@/components/dialogs/PeopleDialog.vue';
import LabelsDialog from '@/components/dialogs/LabelsDialog.vue';

const ui = useUiStore();
const workspace = useWorkspaceStore();
const board = useBoardStore();
const people = usePeopleStore();
const labels = useLabelsStore();
const history = useHistoryStore();
const pwa = usePwaStore();
const { online } = useNetworkStatus();

const { drawer, view, resetConfirmOpen, clearDbConfirmOpen } = storeToRefs(ui);
const { searchQ, filterLabel, filterAssignee, filterOverdue, deleteColDialog } = storeToRefs(board);
const { labelsDialogOpen } = storeToRefs(labels);

function clearFilters() {
  filterLabel.value = [];
  filterAssignee.value = [];
  searchQ.value = '';
  filterOverdue.value = false;
}
function toggleAssignee(id: string) {
  filterAssignee.value = filterAssignee.value.includes(id)
    ? filterAssignee.value.filter((k) => k !== id)
    : [...filterAssignee.value, id];
}

function isEditableTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  const tag = t.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return t.isContentEditable;
}
function onKeydown(e: KeyboardEvent) {
  if (!(e.ctrlKey || e.metaKey)) return;
  if (e.key.toLowerCase() !== 'z' && e.key.toLowerCase() !== 'y') return;
  if (isEditableTarget(e.target)) return;
  const isRedo = (e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y';
  e.preventDefault();
  if (isRedo) history.redo();
  else history.undo();
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" :width="248" permanent color="surface" border="end">
      <div class="pa-4 d-flex align-center" style="gap:10px;">
        <div class="brand-mark">K</div>
        <div>
          <div style="font-weight:700; font-size:15px; letter-spacing:-.01em; line-height:1;">KanRDS</div>
          <div style="font-size:11px; color:#64748B; margin-top:2px;">Engenharia · NIPCAD</div>
        </div>
      </div>

      <v-divider />

      <SidebarWorkspace />

      <v-divider />

      <v-list density="compact" nav class="px-2 py-2">
        <v-list-subheader class="text-caption" style="font-weight:600; letter-spacing:.08em;">CONFIGURAÇÕES</v-list-subheader>
        <v-list-item prepend-icon="mdi-account-group-outline" title="Gerenciar equipe" @click="people.openPeopleDialog" />
        <v-list-item prepend-icon="mdi-tag-multiple-outline" title="Gerenciar etiquetas" @click="labelsDialogOpen = true; labels.resetLabelForm()" />
      </v-list>

      <template #append>
        <div class="pa-3" style="border-top:1px solid #EAEDF1;">
          <div class="d-flex align-center" style="gap:10px;">
            <div class="avatar-sm" style="background:#6366F1; width:32px; height:32px; font-size:13px;">VM</div>
            <div style="line-height:1.2; flex:1;">
              <div style="font-size:13px; font-weight:500;">Você</div>
              <div style="font-size:11px; color:#64748B;">vm@skyline.dev</div>
            </div>
            <v-menu location="top end">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-cog-outline" variant="text" size="small" density="compact" />
              </template>
              <v-list density="compact" min-width="200">
                <v-list-item prepend-icon="mdi-restore" title="Restaurar dados iniciais"
                             @click="resetConfirmOpen = true" />
                <v-divider class="my-1" />
                <v-list-item prepend-icon="mdi-delete-sweep-outline" title="Limpar banco de dados"
                             base-color="error" @click="clearDbConfirmOpen = true" />
              </v-list>
            </v-menu>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="surface" flat height="60" border="b">
      <template #prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer" />
      </template>

      <div class="d-flex align-center" style="gap:8px; margin-left:-4px;">
        <span class="proj-dot" :style="{ background: workspace.activeProject?.color || '#94A3B8' }" style="margin-right:2px;" />
        <div style="font-size:12px; color:#94A3B8;">{{ workspace.activeProject?.name || '—' }}</div>
        <v-icon size="14" color="#CBD5E1">mdi-chevron-right</v-icon>
        <div style="font-weight:600; font-size:15px; color:#1A202C;">{{ workspace.activeBoard?.name || '—' }}</div>
        <v-chip size="x-small" variant="tonal" color="primary" style="margin-left:6px; font-weight:600;">ATIVO</v-chip>
      </div>

      <v-spacer />

      <div class="d-flex align-center" style="gap:2px; margin-right:12px;">
        <v-btn icon="mdi-undo-variant" variant="text" size="small" density="comfortable"
               :disabled="!history.canUndo" @click="history.undo"
               title="Desfazer (Ctrl+Z)" />
        <v-btn icon="mdi-redo-variant" variant="text" size="small" density="comfortable"
               :disabled="!history.canRedo" @click="history.redo"
               title="Refazer (Ctrl+Shift+Z)" />
      </div>

      <div class="d-flex align-center" style="gap:6px; margin-right:10px;">
        <div style="font-size:12px; color:#64748B;">{{ board.sprintStats.done }} / {{ board.sprintStats.total }} concluídos</div>
        <div class="sprint-progress"><div class="sprint-progress-bar" :style="{ width: board.sprintStats.pct + '%' }" /></div>
        <div style="font-size:12px; color:#00695C; font-weight:600; min-width:32px;">{{ board.sprintStats.pct }}%</div>
      </div>
    </v-app-bar>

    <v-main class="board-surface">
      <div class="d-flex align-center px-6 py-3" style="gap:10px; background:#fff; border-bottom:1px solid #E4E7EB;">
        <v-btn-toggle v-model="view" mandatory density="compact" divided variant="outlined"
                      color="primary" style="height:36px;">
          <v-btn value="board" size="small" prepend-icon="mdi-view-column-outline">Board</v-btn>
          <v-btn value="list" size="small" prepend-icon="mdi-format-list-bulleted">Lista</v-btn>
          <v-btn value="calendar" size="small" prepend-icon="mdi-calendar-outline">Calendário</v-btn>
        </v-btn-toggle>

        <v-divider vertical class="mx-2" />

        <v-text-field v-model="searchQ" prepend-inner-icon="mdi-magnify"
                      placeholder="Buscar por ID ou título..."
                      density="compact" hide-details variant="outlined" single-line rounded="lg"
                      style="max-width:280px;" />

        <v-menu :close-on-content-click="false">
          <template #activator="{ props }">
            <button v-bind="props" :class="['filter-pill', filterLabel.length && 'active']">
              <v-icon size="14">mdi-tag-outline</v-icon>
              <template v-if="filterLabel.length === 0">Etiqueta</template>
              <template v-else-if="filterLabel.length === 1">{{ labels.LABELS[filterLabel[0]]?.name }}</template>
              <template v-else>{{ labels.LABELS[filterLabel[0]]?.name }} <span style="opacity:.7;">+{{ filterLabel.length - 1 }}</span></template>
              <v-icon size="14">mdi-chevron-down</v-icon>
            </button>
          </template>
          <v-list density="compact" min-width="200" select-strategy="independent">
            <v-list-item @click="filterLabel = []" :active="filterLabel.length === 0">
              <v-list-item-title>Todas</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item v-for="(lbl, key) in labels.LABELS" :key="key"
                         :active="filterLabel.includes(key as string)"
                         @click="filterLabel.includes(key as string) ? filterLabel = filterLabel.filter(k => k !== key) : filterLabel.push(key as string)">
              <template #prepend>
                <v-checkbox-btn :model-value="filterLabel.includes(key as string)"
                                color="primary" density="compact" style="margin-right:4px;" />
                <span :style="{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '3px', background: lbl.fg, marginRight: '10px' }" />
              </template>
              <v-list-item-title>{{ lbl.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-menu :close-on-content-click="false">
          <template #activator="{ props }">
            <button v-bind="props" :class="['filter-pill', filterAssignee.length && 'active']">
              <v-icon size="14">mdi-account-outline</v-icon>
              <template v-if="filterAssignee.length === 0">Responsável</template>
              <template v-else-if="filterAssignee.length === 1">{{ people.personById(filterAssignee[0])?.name.split(' ')[0] }}</template>
              <template v-else>{{ people.personById(filterAssignee[0])?.name.split(' ')[0] }} <span style="opacity:.7;">+{{ filterAssignee.length - 1 }}</span></template>
              <v-icon size="14">mdi-chevron-down</v-icon>
            </button>
          </template>
          <v-list density="compact" min-width="220" select-strategy="independent">
            <v-list-item @click="filterAssignee = []" :active="filterAssignee.length === 0">
              <v-list-item-title>Todos</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item v-for="p in people.PEOPLE" :key="p.id"
                         :active="filterAssignee.includes(p.id)"
                         @click="toggleAssignee(p.id)">
              <template #prepend>
                <v-checkbox-btn :model-value="filterAssignee.includes(p.id)"
                                color="primary" density="compact" style="margin-right:4px;" />
                <span class="avatar-sm" :style="{ background: p.color, marginRight: '10px' }">{{ p.initials }}</span>
              </template>
              <v-list-item-title>{{ p.name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <button :class="['filter-pill', filterOverdue && 'active']"
                @click="filterOverdue = !filterOverdue"
                :style="filterOverdue ? 'background:#FEF2F2; border-color:#FCA5A5; color:#B91C1C; font-weight:500;' : ''">
          <v-icon size="14" :color="filterOverdue ? '#B91C1C' : undefined">mdi-clock-alert-outline</v-icon>
          Atrasadas
          <v-chip v-if="!filterOverdue" size="x-small" variant="tonal" color="error"
                  style="margin-left:2px; font-weight:700;">
            {{ board.overdueCount }}
          </v-chip>
        </button>

        <button v-if="filterLabel.length || filterAssignee.length || searchQ || filterOverdue"
                class="filter-pill" @click="clearFilters" style="color:#DC2626;">
          <v-icon size="14">mdi-close</v-icon> Limpar filtros
        </button>

        <v-spacer />

        <div class="d-flex align-center">
          <span v-for="(p, i) in people.PEOPLE.slice(0, 5)" :key="p.id"
                class="avatar-sm"
                :style="{ background: p.color, marginLeft: i === 0 ? '0' : '-8px', cursor: 'pointer' }"
                :title="p.name"
                @click="toggleAssignee(p.id)">
            {{ p.initials }}
          </span>
          <span v-if="people.PEOPLE.length > 5" class="avatar-sm"
                style="background:#CBD5E1; color:#475569; margin-left:-8px;">
            +{{ people.PEOPLE.length - 5 }}
          </span>
        </div>

        <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-playlist-plus"
               @click="board.beginAddColumn(); view = 'board'"
               style="margin-right:4px;" title="Adicionar nova lista ao board">Nova lista</v-btn>
      </div>

      <BoardView v-if="view === 'board'" />
      <ListView v-else-if="view === 'list'" />
      <CalendarView v-else-if="view === 'calendar'" />
    </v-main>

    <CardDialog />
    <TaskFormDialog />
    <PeopleDialog />
    <LabelsDialog />

    <v-snackbar :model-value="!online" :timeout="-1" location="bottom" color="warning" variant="elevated">
      <div style="display:flex; align-items:center; gap:8px;">
        <v-icon size="18">mdi-cloud-off-outline</v-icon>
        <span>Você está offline. As alterações continuam sendo salvas localmente.</span>
      </div>
    </v-snackbar>

    <v-snackbar :model-value="pwa.offlineReady" @update:model-value="pwa.dismissOfflineReady"
                :timeout="4000" location="bottom" color="success" variant="elevated">
      <div style="display:flex; align-items:center; gap:8px;">
        <v-icon size="18">mdi-check-circle-outline</v-icon>
        <span>App pronto para uso offline.</span>
      </div>
    </v-snackbar>

    <v-snackbar :model-value="pwa.updateApplied" @update:model-value="pwa.dismissUpdateApplied"
                :timeout="5000" location="bottom" color="success" variant="elevated">
      <div style="display:flex; align-items:center; gap:8px;">
        <v-icon size="18">mdi-check-circle-outline</v-icon>
        <span>Programa atualizado para a versão mais recente.</span>
      </div>
    </v-snackbar>

    <v-snackbar :model-value="pwa.updateReady" :timeout="-1" location="bottom" color="primary" variant="elevated">
      <div style="display:flex; align-items:center; gap:8px;">
        <v-icon size="18">mdi-update</v-icon>
        <span>Nova versão disponível.</span>
      </div>
      <template #actions>
        <v-btn variant="text" @click="pwa.applyUpdate">Atualizar</v-btn>
        <v-btn variant="text" @click="pwa.dismissUpdate">Depois</v-btn>
      </template>
    </v-snackbar>

    <v-dialog v-model="deleteColDialog" max-width="440" persistent>
      <v-card rounded="lg">
        <div style="padding:20px 24px 8px; display:flex; align-items:flex-start; gap:14px;">
          <div style="width:40px; height:40px; border-radius:50%; background:#FEE2E2; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <v-icon color="error" size="22">mdi-alert-outline</v-icon>
          </div>
          <div>
            <div style="font-weight:600; font-size:16px; color:#1A202C;">
              Excluir lista "{{ board.deleteColTarget.title }}"?
            </div>
            <div style="font-size:13px; color:#64748B; margin-top:6px; line-height:1.5;">
              Esta lista tem
              <b style="color:#1A202C;">{{ board.deleteColTarget.count }} card(s)</b>.
              Eles serão movidos automaticamente para a primeira lista disponível.
              Esta ação não pode ser desfeita.
            </div>
          </div>
        </div>
        <div style="padding:16px 24px 20px; display:flex; gap:8px; justify-content:flex-end;">
          <v-btn variant="text" @click="deleteColDialog = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" prepend-icon="mdi-delete-outline" @click="board.confirmDeleteColumn">
            Excluir lista
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="resetConfirmOpen" max-width="460" persistent>
      <v-card rounded="lg">
        <v-card-text class="pa-6">
          <div class="d-flex align-start" style="gap:14px;">
            <div style="width:40px; height:40px; border-radius:50%; background:#FEE2E2; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <v-icon size="22" color="error">mdi-restore-alert</v-icon>
            </div>
            <div style="flex:1;">
              <div style="font-size:16px; font-weight:600; color:#1A202C; margin-bottom:6px;">Restaurar dados iniciais?</div>
              <div style="font-size:13px; color:#64748B; line-height:1.5;">
                Todos os projetos, boards, tarefas, etiquetas, equipe e comentários que você adicionou serão removidos. O app voltará ao estado inicial de demonstração.
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0" style="justify-content:flex-end; gap:8px;">
          <v-btn variant="text" @click="resetConfirmOpen = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" prepend-icon="mdi-restore" @click="ui.resetAllData">Restaurar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="clearDbConfirmOpen" max-width="460" persistent>
      <v-card rounded="lg">
        <v-card-text class="pa-6">
          <div class="d-flex align-start" style="gap:14px;">
            <div style="width:40px; height:40px; border-radius:50%; background:#FEE2E2; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <v-icon size="22" color="error">mdi-delete-sweep-outline</v-icon>
            </div>
            <div style="flex:1;">
              <div style="font-size:16px; font-weight:600; color:#1A202C; margin-bottom:6px;">Limpar banco de dados?</div>
              <div style="font-size:13px; color:#64748B; line-height:1.5;">
                Todos os projetos, boards, tarefas, etiquetas, equipe e comentários serão removidos permanentemente. O app ficará em branco, sem nenhum dado.
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0" style="justify-content:flex-end; gap:8px;">
          <v-btn variant="text" @click="clearDbConfirmOpen = false">Cancelar</v-btn>
          <v-btn color="error" variant="flat" prepend-icon="mdi-delete-sweep-outline" @click="ui.clearAllData">Limpar tudo</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>
