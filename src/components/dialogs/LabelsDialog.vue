<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useBoardStore } from '@/stores/board';
import { useLabelsStore } from '@/stores/labels';

const labels = useLabelsStore();
const board = useBoardStore();
const { labelsDialogOpen, labelForm } = storeToRefs(labels);

function deleteLabel(key: string) {
  labels.deleteLabel(key, (k) => board.dropFilterLabel(k));
}
</script>

<template>
  <v-dialog v-model="labelsDialogOpen" max-width="780" scrollable>
    <v-card rounded="lg">
      <div style="padding:18px 24px 14px; border-bottom:1px solid #EAEDF1; display:flex; align-items:center; gap:10px;">
        <v-icon color="primary">mdi-tag-multiple-outline</v-icon>
        <div style="font-weight:600; font-size:16px;">Gerenciar etiquetas</div>
        <v-chip size="x-small" variant="tonal" color="primary" style="font-weight:600;">{{ Object.keys(labels.LABELS).length }} etiquetas</v-chip>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="labelsDialogOpen = false" />
      </div>

      <div style="display:grid; grid-template-columns:1fr 320px; min-height:420px;">
        <div style="padding:16px 20px; border-right:1px solid #EAEDF1; overflow-y:auto;">
          <div class="section-label" style="margin-bottom:12px;">Etiquetas ({{ Object.keys(labels.LABELS).length }})</div>
          <div v-for="(lbl, key) in labels.LABELS" :key="key"
               style="display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:10px; margin-bottom:6px; border:1px solid #EAEDF1; background:#fff; cursor:pointer;"
               :style="labelForm.origKey === key && labelForm.isEdit ? 'background:#E0F2F1; border-color:#4DB6AC;' : ''"
               @click="labels.startEditLabel(key as string)">
            <span class="label-chip" :style="{ background: lbl.bg, color: lbl.fg, fontSize: '12px' }">{{ lbl.name }}</span>
            <div style="display:flex; gap:6px; margin-left:4px;">
              <span style="width:18px; height:18px; border-radius:50%; display:inline-block;" :style="{ background: lbl.fg }" />
              <span style="width:18px; height:18px; border-radius:50%; display:inline-block; border:1px solid #E2E8F0;" :style="{ background: lbl.bg }" />
            </div>
            <div style="font-size:12px; color:#64748B; flex:1;">chave: <code>{{ key }}</code></div>
            <v-chip size="x-small" variant="tonal" color="default">
              {{ board.cards.filter(c => c.labels.includes(key as string)).length }} cards
            </v-chip>
            <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" density="comfortable"
                   @click.stop="deleteLabel(key as string)" />
          </div>
          <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" size="small" class="mt-3"
                 @click="labels.resetLabelForm">Nova etiqueta</v-btn>
        </div>

        <div style="padding:20px 20px; background:#FAFBFC;">
          <div class="section-label" style="margin-bottom:14px;">{{ labelForm.isEdit ? 'Editar etiqueta' : 'Nova etiqueta' }}</div>

          <div style="display:flex; justify-content:center; margin-bottom:16px;">
            <span class="label-chip" :style="{ background: labelForm.bg, color: labelForm.fg, fontSize: '13px', padding: '5px 14px' }">
              {{ labelForm.name || 'prévia' }}
            </span>
          </div>

          <v-text-field v-model="labelForm.name" label="Nome da etiqueta" variant="outlined" density="compact"
                        hide-details class="mb-3" rounded="lg" placeholder="ex: api, mobile, spike…" />
          <v-text-field v-model="labelForm.key" label="Chave (identificador)" variant="outlined" density="compact"
                        hide-details class="mb-3" rounded="lg" placeholder="api-v2"
                        :disabled="labelForm.isEdit" />

          <div class="section-label" style="margin-bottom:8px;">Cores predefinidas</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">
            <button v-for="(pr, i) in labels.LABEL_PRESETS" :key="i" type="button"
                    @click="labels.applyPreset(pr)"
                    :style="{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      padding: '3px 8px', borderRadius: '6px',
                      background: pr.bg, color: pr.fg,
                      fontSize: '11px', fontWeight: 600,
                      border: '1.5px solid ' + pr.fg + '40', cursor: 'pointer',
                    }">Aa</button>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
            <div>
              <div class="section-label" style="margin-bottom:6px;">Cor do texto</div>
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="color" v-model="labelForm.fg"
                       style="width:36px; height:36px; border:none; border-radius:8px; cursor:pointer; padding:2px;">
                <span style="font-size:12px; font-family:monospace;">{{ labelForm.fg }}</span>
              </div>
            </div>
            <div>
              <div class="section-label" style="margin-bottom:6px;">Cor de fundo</div>
              <div style="display:flex; align-items:center; gap:8px;">
                <input type="color" v-model="labelForm.bg"
                       style="width:36px; height:36px; border:none; border-radius:8px; cursor:pointer; padding:2px;">
                <span style="font-size:12px; font-family:monospace;">{{ labelForm.bg }}</span>
              </div>
            </div>
          </div>

          <div v-if="labels.labelFormError" style="color:#DC2626; font-size:12px; margin-bottom:8px;">{{ labels.labelFormError }}</div>

          <v-btn color="primary" variant="flat" block @click="labels.saveLabel"
                 :prepend-icon="labelForm.isEdit ? 'mdi-content-save-outline' : 'mdi-plus'">
            {{ labelForm.isEdit ? 'Salvar alterações' : 'Criar etiqueta' }}
          </v-btn>
          <v-btn v-if="labelForm.isEdit" variant="text" block class="mt-2" @click="labels.resetLabelForm">Cancelar edição</v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>
