<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useBoardStore } from '@/stores/board';
import KanColumn from './KanColumn.vue';

const board = useBoardStore();
const { addingColumn, newColumnTitle, newColumnColor } = storeToRefs(board);
</script>

<template>
  <div class="col-wrap">
    <KanColumn v-for="col in board.COLUMNS" :key="col.id" :col="col" />

    <div class="kan-col kan-col-add" :class="{ active: addingColumn }">
      <div v-if="!addingColumn" class="kan-add-col-empty" @click="board.beginAddColumn">
        <v-icon size="20">mdi-plus</v-icon>
        <span>Adicionar lista</span>
      </div>
      <div v-else class="kan-add-col-form">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
          <v-menu>
            <template #activator="{ props }">
              <span v-bind="props" :style="{
                width: '14px', height: '14px', borderRadius: '50%',
                background: newColumnColor, cursor: 'pointer', flexShrink: 0,
              }" />
            </template>
            <v-list density="compact">
              <v-list-item style="min-height:auto; padding:8px;">
                <div style="display:flex; flex-wrap:wrap; gap:6px; max-width:160px;">
                  <button v-for="c in board.COLUMN_PRESETS" :key="c" type="button"
                          @click="newColumnColor = c"
                          :style="{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: c,
                            border: '2px solid ' + (newColumnColor === c ? '#fff' : 'transparent'),
                            outline: '2px solid ' + (newColumnColor === c ? c : 'transparent'),
                            cursor: 'pointer',
                          }" />
                </div>
              </v-list-item>
            </v-list>
          </v-menu>
          <input id="new-column-input" v-model="newColumnTitle"
                 placeholder="Título da lista"
                 style="flex:1; border:none; outline:none; background:transparent; font-size:14px; font-weight:600; color:#1A202C;"
                 @keydown.enter.prevent="board.commitAddColumn"
                 @keydown.esc="board.cancelAddColumn" />
        </div>
        <div style="display:flex; gap:6px;">
          <v-btn color="primary" variant="flat" size="small" @click="board.commitAddColumn"
                 :disabled="!newColumnTitle.trim()">Adicionar lista</v-btn>
          <v-btn icon="mdi-close" variant="text" size="small" @click="board.cancelAddColumn" />
        </div>
      </div>
    </div>
  </div>
</template>
