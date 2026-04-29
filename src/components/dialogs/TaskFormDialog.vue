<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useBoardStore } from '@/stores/board';

const s = useBoardStore();
const { newTaskOpen, newTask } = storeToRefs(s);

const typeItems = [
  { title: 'Task', value: 'task' },
  { title: 'Story', value: 'story' },
  { title: 'Bug', value: 'bug' },
  { title: 'Feature', value: 'feature' },
  { title: 'Epic', value: 'epic' },
];
const priorityItems = [
  { title: 'Baixa', value: 'low' },
  { title: 'Média', value: 'medium' },
  { title: 'Alta', value: 'high' },
  { title: 'Crítica', value: 'critical' },
];
const sprintItems = [
  { title: 'Sprint 42 (atual)', value: 's42' },
  { title: 'Sprint 43', value: 's43' },
  { title: 'Backlog', value: 'bl' },
];
const colItems = computed(() => s.COLUMNS.map(c => ({ title: c.title, value: c.id })));
</script>

<template>
  <v-dialog v-model="newTaskOpen" max-width="720" scrollable>
    <v-card rounded="lg">
      <div style="padding:18px 24px 14px; border-bottom:1px solid #EAEDF1; display:flex; align-items:center; gap:10px;">
        <v-icon color="primary">{{ s.newTaskEditId ? 'mdi-pencil-outline' : 'mdi-plus-circle-outline' }}</v-icon>
        <div style="font-weight:600; font-size:16px;">{{ s.newTaskEditId ? 'Editar tarefa' : 'Nova tarefa' }}</div>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="newTaskOpen = false" />
      </div>

      <div style="padding:20px 24px; max-height:70vh; overflow-y:auto;">
        <v-text-field v-model="newTask.title" placeholder="Dê um título para a tarefa..."
                      variant="outlined" density="comfortable" hide-details autofocus rounded="lg"
                      style="font-size:16px;" class="mb-4" />

        <div class="section-label">Descrição</div>
        <v-textarea v-model="newTask.description" placeholder="Descreva o contexto, critérios de aceitação..."
                    variant="outlined" density="compact" rows="3" auto-grow hide-details rounded="lg" class="mb-4" />

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;" class="mb-3">
          <div>
            <div class="section-label">Status</div>
            <v-select v-model="newTask.col" :items="colItems" variant="outlined"
                      density="compact" hide-details rounded="lg" />
          </div>
          <div>
            <div class="section-label">Tipo</div>
            <v-select v-model="newTask.type" :items="typeItems" variant="outlined"
                      density="compact" hide-details rounded="lg">
              <template #selection="{ item }">
                <span class="card-type-icon" :style="{ background: s.TYPE_META[item.raw.value].color, marginRight: '8px' }">
                  <v-icon size="11">{{ s.TYPE_META[item.raw.value].icon }}</v-icon>
                </span>
                {{ item.title }}
              </template>
            </v-select>
          </div>
          <div>
            <div class="section-label">Prioridade</div>
            <v-select v-model="newTask.priority" :items="priorityItems" variant="outlined"
                      density="compact" hide-details rounded="lg">
              <template #selection="{ item }">
                <v-icon size="16" :color="s.PRIORITY_META[item.raw.value].color" style="margin-right:4px;">{{ s.PRIORITY_META[item.raw.value].icon }}</v-icon>
                {{ item.title }}
              </template>
            </v-select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;" class="mb-4">
          <div>
            <div class="section-label">Prazo</div>
            <v-text-field v-model="newTask.due" type="date" variant="outlined" density="compact"
                          hide-details rounded="lg" prepend-inner-icon="mdi-calendar-outline" />
          </div>
          <div>
            <div class="section-label">Sprint</div>
            <v-select model-value="s42" :items="sprintItems" variant="outlined"
                      density="compact" hide-details rounded="lg" />
          </div>
        </div>

        <div class="section-label">Etiquetas</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;" class="mb-4">
          <button v-for="(lbl, key) in s.LABELS" :key="key" type="button"
                  @click="s.toggleArrayVal(newTask.labels, key as string)"
                  :style="{
                    background: newTask.labels.includes(key as string) ? lbl.bg : '#F8FAFC',
                    color: newTask.labels.includes(key as string) ? lbl.fg : '#64748B',
                    border: '1px solid ' + (newTask.labels.includes(key as string) ? lbl.fg + '40' : '#E2E8F0'),
                    fontWeight: newTask.labels.includes(key as string) ? 600 : 500,
                    fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                    cursor: 'pointer', transition: 'all .15s ease',
                  }">
            <v-icon v-if="newTask.labels.includes(key as string)" size="12" style="margin-right:3px;">mdi-check</v-icon>
            {{ lbl.name }}
          </button>
        </div>

        <div class="section-label">Responsáveis</div>
        <div style="display:flex; flex-wrap:wrap; gap:8px;" class="mb-4">
          <button v-for="p in s.PEOPLE" :key="p.id" type="button"
                  @click="s.toggleArrayVal(newTask.assignees, p.id)"
                  :style="{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    height: '32px', padding: '0 12px 0 4px', borderRadius: '999px',
                    background: newTask.assignees.includes(p.id) ? '#E0F2F1' : '#fff',
                    border: '1px solid ' + (newTask.assignees.includes(p.id) ? '#4DB6AC' : '#E2E8F0'),
                    fontSize: '13px', fontWeight: 500,
                    color: newTask.assignees.includes(p.id) ? '#00695C' : '#334155',
                    cursor: 'pointer',
                  }">
            <span class="avatar-sm" :style="{ background: p.color, width: '24px', height: '24px', fontSize: '10px', border: 0 }">{{ p.initials }}</span>
            {{ p.name.split(' ')[0] }}
            <v-icon v-if="newTask.assignees.includes(p.id)" size="14" color="#00897B">mdi-check</v-icon>
          </button>
        </div>

        <div class="section-label">Subtarefas</div>
        <div v-if="newTask.checklist.length" class="mb-2">
          <div v-for="(ci, i) in newTask.checklist" :key="i"
               style="display:flex; align-items:center; gap:2px; padding:4px 0;">
            <v-checkbox-btn v-model="ci.d" color="primary" density="compact"
                            style="flex:0 0 auto; --v-selection-control-size: 28px; margin-right:6px;" />
            <span style="flex:1; font-size:13px;"
                  :style="ci.d ? 'text-decoration:line-through; color:#94A3B8;' : ''">{{ ci.t }}</span>
            <v-btn icon="mdi-close" variant="text" size="x-small" density="comfortable" @click="s.removeChecklistItem(i)" />
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <v-text-field v-model="newTask.newChecklistItem" placeholder="Adicionar subtarefa..."
                        variant="outlined" density="compact" hide-details rounded="lg"
                        @keydown.enter.prevent="s.addChecklistItem"
                        prepend-inner-icon="mdi-plus" />
          <v-btn variant="tonal" color="primary" size="small" @click="s.addChecklistItem"
                 :disabled="!newTask.newChecklistItem.trim()">Adicionar</v-btn>
        </div>
      </div>

      <div style="padding:14px 24px; border-top:1px solid #EAEDF1; display:flex; align-items:center; gap:8px;">
        <div style="font-size:12px; color:#94A3B8;">
          <template v-if="s.newTaskEditId">
            Editando <b style="color:#334155;">{{ s.newTaskEditId }}</b>
          </template>
          <template v-else>
            Será criada como <b style="color:#334155;">KAN-{{ 200 + s.cards.length }}</b>
            em <b style="color:#334155;">{{ s.COLUMNS.find(c => c.id === newTask.col)?.title }}</b>
          </template>
        </div>
        <v-spacer />
        <v-btn variant="text" @click="newTaskOpen = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" @click="s.commitNewTask"
               :disabled="!newTask.title.trim()"
               :prepend-icon="s.newTaskEditId ? 'mdi-content-save-outline' : 'mdi-check'">
          {{ s.newTaskEditId ? 'Salvar alterações' : 'Criar tarefa' }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>
