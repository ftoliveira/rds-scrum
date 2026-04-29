<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useBoardStore } from '@/stores/board';
import type { Column } from '@/types';
import KanCard from './KanCard.vue';

defineProps<{ col: Column }>();
const board = useBoardStore();
const { dragOverCol, addingInCol, newCardTitle, editingCol, editingColTitle } = storeToRefs(board);
</script>

<template>
  <div class="kan-col"
       :class="{ 'drag-over': dragOverCol === col.id }"
       @dragover="board.onDragOver($event, col.id)"
       @dragleave="board.onDragLeave(col.id)"
       @drop="board.onDrop($event, col.id)">
    <div class="kan-col-header">
      <span class="kan-dot" :style="{ background: col.dot, cursor: 'pointer' }" title="Mudar cor">
        <v-menu>
          <template #activator="{ props }">
            <span v-bind="props" style="display:inline-block; width:100%; height:100%; border-radius:50%;" />
          </template>
          <v-list density="compact">
            <v-list-item style="min-height:auto; padding:8px;">
              <div style="display:flex; flex-wrap:wrap; gap:6px; max-width:160px;">
                <button v-for="c in board.COLUMN_PRESETS" :key="c" type="button"
                        @click="board.changeColumnColor(col, c)"
                        :style="{
                          width: '22px', height: '22px', borderRadius: '50%',
                          background: c,
                          border: '2px solid ' + (col.dot === c ? '#fff' : 'transparent'),
                          outline: '2px solid ' + (col.dot === c ? c : 'transparent'),
                          cursor: 'pointer',
                        }" />
              </div>
            </v-list-item>
          </v-list>
        </v-menu>
      </span>

      <input v-if="editingCol === col.id"
             :id="'rename-col-' + col.id"
             v-model="editingColTitle"
             class="kan-col-title"
             style="border:none; outline:1px solid #4DB6AC; border-radius:4px; padding:2px 4px; background:#fff; flex:1; min-width:0; font-size:13px; font-weight:600;"
             @keydown.enter.prevent="board.commitRenameColumn(col)"
             @keydown.esc="editingCol = null"
             @blur="board.commitRenameColumn(col)" />
      <span v-else class="kan-col-title" @dblclick="board.startRenameColumn(col)"
            style="cursor:pointer;" title="Duplo clique para renomear">{{ col.title }}</span>

      <span class="kan-count">{{ board.cardsByCol[col.id]?.length ?? 0 }}</span>
      <v-spacer />
      <v-btn icon="mdi-plus" variant="text" size="x-small" density="comfortable" @click="board.beginAdd(col.id)" />
      <v-menu>
        <template #activator="{ props }">
          <v-btn icon="mdi-dots-horizontal" variant="text" size="x-small" density="comfortable" v-bind="props" />
        </template>
        <v-list density="compact" min-width="180">
          <v-list-item prepend-icon="mdi-pencil-outline" title="Renomear" @click="board.startRenameColumn(col)" />
          <v-list-item prepend-icon="mdi-arrow-left" title="Mover para esquerda" @click="board.moveColumn(col.id, -1)" />
          <v-list-item prepend-icon="mdi-arrow-right" title="Mover para direita" @click="board.moveColumn(col.id, 1)" />
          <v-divider class="my-1" />
          <v-list-item prepend-icon="mdi-delete-outline" title="Excluir lista" base-color="error"
                       @click="board.deleteColumn(col.id)" />
        </v-list>
      </v-menu>
    </div>

    <div class="kan-col-body">
      <div v-if="addingInCol === col.id" class="kan-add-input">
        <textarea
          :id="'add-input-' + col.id"
          v-model="newCardTitle"
          placeholder="Digite um título e pressione Enter..."
          @keydown.enter.prevent="board.commitAdd(col.id)"
          @keydown.esc="board.cancelAdd()"
        />
        <div class="kan-add-actions">
          <v-btn size="x-small" color="primary" variant="flat" @click="board.commitAdd(col.id)">Adicionar</v-btn>
          <v-btn size="x-small" variant="text" @click="board.cancelAdd()">Cancelar</v-btn>
        </div>
      </div>

      <KanCard v-for="card in board.cardsByCol[col.id]" :key="card.id" :card="card" />
    </div>

    <button class="kan-add" @click="board.beginAdd(col.id)">
      <v-icon size="16">mdi-plus</v-icon> Adicionar card
    </button>
  </div>
</template>
