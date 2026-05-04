<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useActivityStore } from '@/stores/activity';
import { useBoardStore } from '@/stores/board';
import { useLabelsStore } from '@/stores/labels';
import { usePeopleStore } from '@/stores/people';
import { useWorkspaceStore } from '@/stores/workspace';
import type { Priority } from '@/types';
import { fmtDateTime, fmtDue } from '@/utils/date';
import { ATTACHMENT_MAX_BYTES, downloadDataUrl, fileIconFor, fmtFileSize, isImageAttachment } from '@/utils/file';

const board = useBoardStore();
const labels = useLabelsStore();
const people = usePeopleStore();
const activity = useActivityStore();
const workspace = useWorkspaceStore();
const { dialogCardId } = storeToRefs(board);
const { newCommentText } = storeToRefs(activity);
const attachmentInput = ref<HTMLInputElement | null>(null);
const newCheckItemText = ref('');
const showNewCheckItem = ref(false);
const newCheckItemInput = ref<{ focus: () => void } | null>(null);

function onModelUpdate(v: boolean) { if (!v) board.closeCard(); }
function openAddCheckItem() {
  showNewCheckItem.value = true;
  nextTick(() => newCheckItemInput.value?.focus());
}
function confirmAddCheckItem() {
  if (board.currentCard) board.addCardChecklistItem(board.currentCard, newCheckItemText.value);
  newCheckItemText.value = '';
  showNewCheckItem.value = false;
}
function cancelAddCheckItem() {
  newCheckItemText.value = '';
  showNewCheckItem.value = false;
}
function setPriority(key: string) {
  if (board.currentCard) board.currentCard.priority = key as Priority;
}
</script>

<template>
  <v-dialog :model-value="!!dialogCardId" @update:model-value="onModelUpdate" max-width="920" class="card-dialog">
    <v-card v-if="board.currentCard" rounded="lg">
      <div style="padding:18px 24px 12px; border-bottom:1px solid #EAEDF1; display:flex; align-items:center; gap:10px;">
        <span class="card-type-icon" :style="{ background: board.TYPE_META[board.currentCard.type].color }">
          <v-icon size="11">{{ board.TYPE_META[board.currentCard.type].icon }}</v-icon>
        </span>
        <span class="card-key">{{ board.currentCard.id }}</span>
        <v-chip size="x-small" variant="tonal" color="primary" style="font-weight:500;">
          {{ board.COLUMNS.find(x => x.id === board.currentCard!.col)?.title }}
        </v-chip>
        <v-spacer />
        <v-btn icon="mdi-share-variant-outline" variant="text" size="small" />
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon="mdi-dots-horizontal" variant="text" size="small" v-bind="props" />
          </template>
          <v-list density="compact" min-width="180">
            <v-list-item prepend-icon="mdi-pencil-outline" title="Editar tarefa" @click="board.openEditTask(board.currentCard!)" />
            <v-list-item prepend-icon="mdi-content-copy" title="Duplicar" />
            <v-list-item prepend-icon="mdi-link-variant" title="Copiar link" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="mdi-delete-outline" title="Excluir" base-color="error"
                         @click="board.deleteCard(board.currentCard!.id)" />
          </v-list>
        </v-menu>
        <v-btn icon="mdi-close" variant="text" size="small" @click="board.closeCard" />
      </div>

      <div style="display:grid; grid-template-columns: 1fr 260px;">
        <div style="padding:20px 24px;">
          <div style="font-size:20px; font-weight:600; line-height:1.3; margin-bottom:18px; color:#1A202C;">
            {{ board.currentCard.title }}
          </div>

          <div class="section-label">Descrição</div>
          <div v-if="board.currentCard.description"
               style="font-size:14px; color:#334155; line-height:1.6; margin-bottom:20px; white-space:pre-wrap;">
            {{ board.currentCard.description }}
          </div>
          <div v-else
               style="font-size:13px; color:#94A3B8; font-style:italic; margin-bottom:20px;">
            Sem descrição. Clique em "Editar tarefa" para adicionar uma.
          </div>

          <div v-if="board.currentCard.checklist">
            <div class="section-label">
              Checklist — {{ board.currentCard.checklist.filter(i => i.d).length }}/{{ board.currentCard.checklist.length }}
            </div>
            <div style="height:6px; background:#EAEDF1; border-radius:4px; overflow:hidden; margin-bottom:12px;">
              <div :style="{
                height: '100%',
                width: (board.currentCard.checklist.filter(i => i.d).length / board.currentCard.checklist.length * 100) + '%',
                background: 'var(--k-primary)',
              }" />
            </div>
            <div v-for="(ci, i) in board.currentCard.checklist" :key="i" class="checkitem" :class="{ done: ci.d }">
              <v-checkbox-btn :model-value="ci.d" color="primary"
                              @update:model-value="board.toggleCheck(board.currentCard!, i)" />
              <span class="c-label">{{ ci.t }}</span>
            </div>
            <div v-if="showNewCheckItem" style="display:flex; gap:6px; align-items:center; margin-top:6px;">
              <v-text-field ref="newCheckItemInput" v-model="newCheckItemText" autofocus density="compact" variant="outlined"
                            hide-details rounded="lg" placeholder="Novo item..."
                            @keydown.enter.prevent="confirmAddCheckItem"
                            @keydown.esc.prevent="cancelAddCheckItem" />
              <v-btn size="small" color="primary" variant="flat" icon="mdi-check" @click="confirmAddCheckItem" />
              <v-btn size="small" variant="text" icon="mdi-close" @click="cancelAddCheckItem" />
            </div>
            <v-btn v-else variant="text" size="small" prepend-icon="mdi-plus" color="primary" class="mt-2"
                   style="padding-left:0;" @click="openAddCheckItem">
              Adicionar item
            </v-btn>
          </div>

          <div style="display:flex; align-items:center; margin-top:24px; margin-bottom:8px; gap:6px;">
            <div class="section-label" style="margin-bottom:0;">
              <v-icon size="12" style="margin-right:4px; transform:translateY(-1px);">mdi-paperclip</v-icon>
              Anexos
              <span style="font-weight:400; text-transform:none; letter-spacing:0; font-size:12px; color:#94A3B8; margin-left:6px;">
                {{ activity.attachmentCount(board.currentCard.id) }} arquivo(s)
              </span>
            </div>
            <v-spacer />
            <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-plus" density="comfortable"
                   @click="attachmentInput?.click()">
              Anexar
            </v-btn>
            <input ref="attachmentInput" type="file" multiple style="display:none;"
                   @change="activity.onAttachmentInputChange($event, board.currentCard!.id)" />
          </div>

          <div class="att-dropzone" :class="{ 'is-over': activity.attachmentDragOver }"
               @dragover="activity.onAttachmentDragOver" @dragleave="activity.onAttachmentDragLeave"
               @drop="activity.onAttachmentDrop($event, board.currentCard!.id)"
               @click="attachmentInput?.click()">
            <v-icon size="22" color="#94A3B8">mdi-cloud-upload-outline</v-icon>
            <div style="font-size:13px; color:#475569; margin-top:4px;">
              Arraste arquivos aqui ou <span style="color:var(--k-primary); font-weight:500;">clique para selecionar</span>
            </div>
            <div style="font-size:11px; color:#94A3B8; margin-top:2px;">Até {{ fmtFileSize(ATTACHMENT_MAX_BYTES) }} por arquivo</div>
          </div>

          <div v-if="activity.attachmentError" class="att-error">
            <v-icon size="14" color="#B91C1C">mdi-alert-circle-outline</v-icon>
            <span>{{ activity.attachmentError }}</span>
          </div>

          <div v-if="activity.attachmentCount(board.currentCard.id)" class="att-grid">
            <div v-for="att in (activity.cardAttachments[board.currentCard.id] || [])" :key="att.id"
                 class="att-item" @click="downloadDataUrl(att.name, att.dataUrl)">
              <div class="att-thumb">
                <img v-if="isImageAttachment(att)" :src="att.dataUrl" :alt="att.name" />
                <v-icon v-else size="32" color="#64748B">{{ fileIconFor(att) }}</v-icon>
              </div>
              <div class="att-meta">
                <div class="att-name" :title="att.name">{{ att.name }}</div>
                <div class="att-sub">{{ fmtFileSize(att.size) }}</div>
              </div>
              <div class="att-actions" @click.stop>
                <v-btn icon="mdi-download-outline" size="x-small" variant="text" density="comfortable"
                       @click="downloadDataUrl(att.name, att.dataUrl)" title="Baixar" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" density="comfortable"
                       @click="activity.removeAttachment(board.currentCard!.id, att.id)" title="Remover" />
              </div>
            </div>
          </div>

          <div class="section-label mt-6">
            Atividade
            <span style="font-weight:400; text-transform:none; letter-spacing:0; font-size:12px; color:#94A3B8; margin-left:6px;">
              {{ (activity.cardComments[board.currentCard.id] || []).length }} comentário(s)
            </span>
          </div>

          <div style="display:flex; gap:12px; margin-bottom:14px; align-items:flex-start;">
            <span class="avatar-sm" style="background:#6366F1; width:28px; height:28px; font-size:11px; flex-shrink:0; margin-top:4px;">VM</span>
            <div style="flex:1;">
              <v-textarea v-model="newCommentText" placeholder="Escrever um comentário..."
                          density="compact" rows="2" variant="outlined" hide-details auto-grow rounded="lg"
                          @keydown.ctrl.enter.prevent="activity.saveComment(board.currentCard!.id)" />
              <div v-if="newCommentText.trim()" style="display:flex; gap:6px; margin-top:6px;">
                <v-btn size="x-small" color="primary" variant="flat" @click="activity.saveComment(board.currentCard!.id)" prepend-icon="mdi-send">Enviar</v-btn>
                <v-btn size="x-small" variant="text" @click="newCommentText = ''">Cancelar</v-btn>
                <span style="font-size:11px; color:#94A3B8; align-self:center; margin-left:4px;">Ctrl+Enter para enviar</span>
              </div>
            </div>
          </div>

          <div v-for="cm in (activity.cardComments[board.currentCard.id] || [])" :key="cm.id"
               style="display:flex; gap:12px; margin-bottom:12px; align-items:flex-start;">
            <span class="avatar-sm" :style="{ background: cm.color, width: '28px', height: '28px', fontSize: '11px', flexShrink: 0, marginTop: '2px' }">{{ cm.initials }}</span>
            <div style="flex:1; background:#F8FAFC; padding:10px 12px; border-radius:10px; border:1px solid #EAEDF1; position:relative;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <b style="font-size:13px;">{{ cm.author }}</b>
                <span style="color:#94A3B8; font-size:12px;">· {{ cm.time }}</span>
                <v-spacer />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" density="comfortable"
                       style="opacity:.5;" @click="activity.removeComment(board.currentCard!.id, cm.id)"
                       title="Remover comentário" />
              </div>
              <div style="font-size:13px; color:#334155; line-height:1.5;">{{ cm.text }}</div>
            </div>
          </div>

          <div v-if="!(activity.cardComments[board.currentCard.id] || []).length && !newCommentText"
               style="text-align:center; color:#CBD5E1; font-size:13px; padding:12px 0;">
            Nenhum comentário ainda. Seja o primeiro!
          </div>
        </div>

        <div style="padding:20px 20px; background:#FAFBFC; border-left:1px solid #EAEDF1;">
          <div class="section-label">Responsáveis</div>
          <div v-if="board.currentCard.assignees.length"
               style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:16px;">
            <div v-for="aid in board.currentCard.assignees" :key="aid"
                 style="display:flex; align-items:center; gap:6px; background:#fff; height:28px; padding:0 10px 0 3px; border-radius:999px; border:1px solid #EAEDF1;">
              <span class="avatar-sm" :style="{ background: people.personById(aid)?.color, width: '22px', height: '22px', fontSize: '10px', border: 0 }">{{ people.personById(aid)?.initials }}</span>
              <span style="font-size:12px;">{{ people.personById(aid)?.name.split(' ')[0] }}</span>
            </div>
          </div>
          <div v-else style="color:#94A3B8; font-size:13px; margin-bottom:16px;">Sem responsáveis</div>

          <div class="section-label">Etiquetas</div>
          <div v-if="board.currentCard.labels.length"
               style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:16px;">
            <span v-for="l in board.currentCard.labels" :key="l"
                  class="label-chip"
                  :style="{ background: labels.LABELS[l]?.bg, color: labels.LABELS[l]?.fg }">
              {{ labels.LABELS[l]?.name }}
            </span>
          </div>
          <div v-else style="color:#94A3B8; font-size:13px; margin-bottom:16px;">Sem etiquetas</div>

          <div class="section-label">Prioridade</div>
          <v-menu>
            <template #activator="{ props }">
              <button v-bind="props" type="button"
                      style="display:flex; align-items:center; gap:6px; margin-bottom:16px; background:#fff; border:1px solid #EAEDF1; border-radius:8px; padding:6px 10px; cursor:pointer; width:100%;">
                <v-icon size="18" :color="board.PRIORITY_META[board.currentCard.priority].color">{{ board.PRIORITY_META[board.currentCard.priority].icon }}</v-icon>
                <span style="font-size:13px; font-weight:500;">{{ board.PRIORITY_META[board.currentCard.priority].label }}</span>
                <v-spacer />
                <v-icon size="14" color="#94A3B8">mdi-chevron-down</v-icon>
              </button>
            </template>
            <v-list density="compact" min-width="180">
              <v-list-item v-for="(meta, key) in board.PRIORITY_META" :key="key"
                           :active="board.currentCard.priority === key"
                           @click="setPriority(key as string)">
                <template #prepend>
                  <v-icon size="18" :color="meta.color" style="margin-right:8px;">{{ meta.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ meta.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <div class="section-label">Prazo</div>
          <div v-if="board.currentCard.due" style="font-size:13px; margin-bottom:16px;" :class="fmtDue(board.currentCard.due)?.cls">
            <v-icon size="14">mdi-calendar-outline</v-icon> {{ fmtDue(board.currentCard.due)?.lbl }}
          </div>
          <div v-else style="color:#94A3B8; font-size:13px; margin-bottom:16px;">Sem prazo</div>

          <div class="section-label">Board</div>
          <div style="font-size:13px; font-weight:500; margin-bottom:16px;">
            {{ workspace.activeBoard?.name || '—' }}
          </div>

          <v-divider class="my-3" />

          <div v-if="board.currentCard.createdAt || board.currentCard.updatedAt" style="font-size:11px; color:#94A3B8;">
            <template v-if="board.currentCard.createdAt">Criado em {{ fmtDateTime(board.currentCard.createdAt) }}</template>
            <template v-if="board.currentCard.updatedAt && board.currentCard.updatedAt !== board.currentCard.createdAt">
              · atualizado em {{ fmtDateTime(board.currentCard.updatedAt) }}
            </template>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>
