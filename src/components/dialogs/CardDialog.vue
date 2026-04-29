<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useBoardStore } from '@/stores/board';

const s = useBoardStore();
const { dialogCardId, newCommentText } = storeToRefs(s);
const attachmentInput = ref<HTMLInputElement | null>(null);

function onModelUpdate(v: boolean) { if (!v) s.closeCard(); }
</script>

<template>
  <v-dialog :model-value="!!dialogCardId" @update:model-value="onModelUpdate" max-width="920" class="card-dialog">
    <v-card v-if="s.currentCard" rounded="lg">
      <div style="padding:18px 24px 12px; border-bottom:1px solid #EAEDF1; display:flex; align-items:center; gap:10px;">
        <span class="card-type-icon" :style="{ background: s.TYPE_META[s.currentCard.type].color }">
          <v-icon size="11">{{ s.TYPE_META[s.currentCard.type].icon }}</v-icon>
        </span>
        <span class="card-key">{{ s.currentCard.id }}</span>
        <v-chip size="x-small" variant="tonal" color="primary" style="font-weight:500;">
          {{ s.COLUMNS.find(x => x.id === s.currentCard!.col)?.title }}
        </v-chip>
        <v-spacer />
        <v-btn icon="mdi-share-variant-outline" variant="text" size="small" />
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon="mdi-dots-horizontal" variant="text" size="small" v-bind="props" />
          </template>
          <v-list density="compact" min-width="180">
            <v-list-item prepend-icon="mdi-pencil-outline" title="Editar tarefa" @click="s.openEditTask(s.currentCard!)" />
            <v-list-item prepend-icon="mdi-content-copy" title="Duplicar" />
            <v-list-item prepend-icon="mdi-link-variant" title="Copiar link" />
            <v-divider class="my-1" />
            <v-list-item prepend-icon="mdi-delete-outline" title="Excluir" base-color="error"
                         @click="s.deleteCard(s.currentCard!.id)" />
          </v-list>
        </v-menu>
        <v-btn icon="mdi-close" variant="text" size="small" @click="s.closeCard" />
      </div>

      <div style="display:grid; grid-template-columns: 1fr 260px;">
        <div style="padding:20px 24px;">
          <div style="font-size:20px; font-weight:600; line-height:1.3; margin-bottom:18px; color:#1A202C;">
            {{ s.currentCard.title }}
          </div>

          <div class="section-label">Descrição</div>
          <div style="font-size:14px; color:#334155; line-height:1.6; margin-bottom:20px;">
            Precisamos definir um fluxo de autenticação enterprise que suporte os principais provedores SAML 2.0 (Okta, Azure AD, Google Workspace). A experiência deve cobrir provisionamento via SCIM quando disponível, fallback para JIT provisioning, e mapeamento de grupos para roles internas.
          </div>

          <div v-if="s.currentCard.checklist">
            <div class="section-label">
              Checklist — {{ s.currentCard.checklist.filter(i => i.d).length }}/{{ s.currentCard.checklist.length }}
            </div>
            <div style="height:6px; background:#EAEDF1; border-radius:4px; overflow:hidden; margin-bottom:12px;">
              <div :style="{
                height: '100%',
                width: (s.currentCard.checklist.filter(i => i.d).length / s.currentCard.checklist.length * 100) + '%',
                background: 'var(--k-primary)',
              }" />
            </div>
            <div v-for="(ci, i) in s.currentCard.checklist" :key="i" class="checkitem" :class="{ done: ci.d }">
              <v-checkbox-btn :model-value="ci.d" color="primary"
                              @update:model-value="s.toggleCheck(s.currentCard!, i)" />
              <span class="c-label">{{ ci.t }}</span>
            </div>
            <v-btn variant="text" size="small" prepend-icon="mdi-plus" color="primary" class="mt-2" style="padding-left:0;">
              Adicionar item
            </v-btn>
          </div>

          <!-- Anexos -->
          <div style="display:flex; align-items:center; margin-top:24px; margin-bottom:8px; gap:6px;">
            <div class="section-label" style="margin-bottom:0;">
              <v-icon size="12" style="margin-right:4px; transform:translateY(-1px);">mdi-paperclip</v-icon>
              Anexos
              <span style="font-weight:400; text-transform:none; letter-spacing:0; font-size:12px; color:#94A3B8; margin-left:6px;">
                {{ s.attachmentCount(s.currentCard.id) }} arquivo(s)
              </span>
            </div>
            <v-spacer />
            <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-plus" density="comfortable"
                   @click="attachmentInput?.click()">
              Anexar
            </v-btn>
            <input ref="attachmentInput" type="file" multiple style="display:none;"
                   @change="s.onAttachmentInputChange($event, s.currentCard!.id)" />
          </div>

          <div class="att-dropzone" :class="{ 'is-over': s.attachmentDragOver }"
               @dragover="s.onAttachmentDragOver" @dragleave="s.onAttachmentDragLeave"
               @drop="s.onAttachmentDrop($event, s.currentCard!.id)"
               @click="attachmentInput?.click()">
            <v-icon size="22" color="#94A3B8">mdi-cloud-upload-outline</v-icon>
            <div style="font-size:13px; color:#475569; margin-top:4px;">
              Arraste arquivos aqui ou <span style="color:var(--k-primary); font-weight:500;">clique para selecionar</span>
            </div>
            <div style="font-size:11px; color:#94A3B8; margin-top:2px;">Até {{ s.fmtFileSize(5 * 1024 * 1024) }} por arquivo</div>
          </div>

          <div v-if="s.attachmentError" class="att-error">
            <v-icon size="14" color="#B91C1C">mdi-alert-circle-outline</v-icon>
            <span>{{ s.attachmentError }}</span>
          </div>

          <div v-if="s.attachmentCount(s.currentCard.id)" class="att-grid">
            <div v-for="att in (s.cardAttachments[s.currentCard.id] || [])" :key="att.id"
                 class="att-item" @click="s.downloadAttachment(att)">
              <div class="att-thumb">
                <img v-if="s.isImageAttachment(att)" :src="att.dataUrl" :alt="att.name" />
                <v-icon v-else size="32" color="#64748B">{{ s.fileIconFor(att) }}</v-icon>
              </div>
              <div class="att-meta">
                <div class="att-name" :title="att.name">{{ att.name }}</div>
                <div class="att-sub">{{ s.fmtFileSize(att.size) }}</div>
              </div>
              <div class="att-actions" @click.stop>
                <v-btn icon="mdi-download-outline" size="x-small" variant="text" density="comfortable"
                       @click="s.downloadAttachment(att)" title="Baixar" />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" density="comfortable"
                       @click="s.removeAttachment(s.currentCard!.id, att.id)" title="Remover" />
              </div>
            </div>
          </div>

          <div class="section-label mt-6">
            Atividade
            <span style="font-weight:400; text-transform:none; letter-spacing:0; font-size:12px; color:#94A3B8; margin-left:6px;">
              {{ (s.cardComments[s.currentCard.id] || []).length }} comentário(s)
            </span>
          </div>

          <div style="display:flex; gap:12px; margin-bottom:14px; align-items:flex-start;">
            <span class="avatar-sm" style="background:#6366F1; width:28px; height:28px; font-size:11px; flex-shrink:0; margin-top:4px;">VM</span>
            <div style="flex:1;">
              <v-textarea v-model="newCommentText" placeholder="Escrever um comentário..."
                          density="compact" rows="2" variant="outlined" hide-details auto-grow rounded="lg"
                          @keydown.ctrl.enter.prevent="s.saveComment(s.currentCard!.id)" />
              <div v-if="newCommentText.trim()" style="display:flex; gap:6px; margin-top:6px;">
                <v-btn size="x-small" color="primary" variant="flat" @click="s.saveComment(s.currentCard!.id)" prepend-icon="mdi-send">Enviar</v-btn>
                <v-btn size="x-small" variant="text" @click="newCommentText = ''">Cancelar</v-btn>
                <span style="font-size:11px; color:#94A3B8; align-self:center; margin-left:4px;">Ctrl+Enter para enviar</span>
              </div>
            </div>
          </div>

          <div v-for="cm in (s.cardComments[s.currentCard.id] || [])" :key="cm.id"
               style="display:flex; gap:12px; margin-bottom:12px; align-items:flex-start;">
            <span class="avatar-sm" :style="{ background: cm.color, width: '28px', height: '28px', fontSize: '11px', flexShrink: 0, marginTop: '2px' }">{{ cm.initials }}</span>
            <div style="flex:1; background:#F8FAFC; padding:10px 12px; border-radius:10px; border:1px solid #EAEDF1; position:relative;">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                <b style="font-size:13px;">{{ cm.author }}</b>
                <span style="color:#94A3B8; font-size:12px;">· {{ cm.time }}</span>
                <v-spacer />
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" density="comfortable"
                       style="opacity:.5;" @click="s.removeComment(s.currentCard!.id, cm.id)"
                       title="Remover comentário" />
              </div>
              <div style="font-size:13px; color:#334155; line-height:1.5;">{{ cm.text }}</div>
            </div>
          </div>

          <div v-if="!(s.cardComments[s.currentCard.id] || []).length && !newCommentText"
               style="text-align:center; color:#CBD5E1; font-size:13px; padding:12px 0;">
            Nenhum comentário ainda. Seja o primeiro!
          </div>
        </div>

        <div style="padding:20px 20px; background:#FAFBFC; border-left:1px solid #EAEDF1;">
          <div class="section-label">Responsáveis</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin-bottom:16px;">
            <div v-for="aid in s.currentCard.assignees" :key="aid"
                 style="display:flex; align-items:center; gap:6px; background:#fff; height:28px; padding:0 10px 0 3px; border-radius:999px; border:1px solid #EAEDF1;">
              <span class="avatar-sm" :style="{ background: s.personById(aid)?.color, width: '22px', height: '22px', fontSize: '10px', border: 0 }">{{ s.personById(aid)?.initials }}</span>
              <span style="font-size:12px;">{{ s.personById(aid)?.name.split(' ')[0] }}</span>
            </div>
          </div>

          <div class="section-label">Etiquetas</div>
          <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:16px;">
            <span v-for="l in s.currentCard.labels" :key="l"
                  class="label-chip"
                  :style="{ background: s.LABELS[l]?.bg, color: s.LABELS[l]?.fg }">
              {{ s.LABELS[l]?.name }}
            </span>
          </div>

          <div class="section-label">Prioridade</div>
          <v-menu>
            <template #activator="{ props }">
              <button v-bind="props" type="button"
                      style="display:flex; align-items:center; gap:6px; margin-bottom:16px; background:#fff; border:1px solid #EAEDF1; border-radius:8px; padding:6px 10px; cursor:pointer; width:100%;">
                <v-icon size="18" :color="s.PRIORITY_META[s.currentCard.priority].color">{{ s.PRIORITY_META[s.currentCard.priority].icon }}</v-icon>
                <span style="font-size:13px; font-weight:500;">{{ s.PRIORITY_META[s.currentCard.priority].label }}</span>
                <v-spacer />
                <v-icon size="14" color="#94A3B8">mdi-chevron-down</v-icon>
              </button>
            </template>
            <v-list density="compact" min-width="180">
              <v-list-item v-for="(meta, key) in s.PRIORITY_META" :key="key"
                           :active="s.currentCard.priority === key"
                           @click="s.currentCard!.priority = key as any">
                <template #prepend>
                  <v-icon size="18" :color="meta.color" style="margin-right:8px;">{{ meta.icon }}</v-icon>
                </template>
                <v-list-item-title>{{ meta.label }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <div class="section-label">Prazo</div>
          <div v-if="s.currentCard.due" style="font-size:13px; margin-bottom:16px;" :class="s.fmtDue(s.currentCard.due)?.cls">
            <v-icon size="14">mdi-calendar-outline</v-icon> {{ s.fmtDue(s.currentCard.due)?.lbl }}
          </div>
          <div v-else style="color:#94A3B8; font-size:13px; margin-bottom:16px;">Sem prazo</div>

          <div class="section-label">Sprint</div>
          <div style="font-size:13px; font-weight:500; margin-bottom:16px;">Sprint 42</div>

          <div class="section-label">Estimativa</div>
          <div style="font-size:13px; font-weight:500; margin-bottom:16px;">5 pts</div>

          <v-divider class="my-3" />

          <div style="font-size:11px; color:#94A3B8;">Criado há 6 dias · atualizado há 3h</div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>
