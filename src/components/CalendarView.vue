<script setup lang="ts">
import { useBoardStore } from '@/stores/board';
import { DOWS_PT_SHORT } from '@/utils/date';

const board = useBoardStore();
</script>

<template>
  <div class="pa-6">
    <div class="d-flex align-center mb-4">
      <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="board.calPrev" />
      <div style="font-weight:600; font-size:17px; min-width:200px; text-align:center;">{{ board.monthLabel }}</div>
      <v-btn icon="mdi-chevron-right" variant="text" size="small" @click="board.calNext" />
      <v-spacer />
      <v-chip size="small" variant="tonal" color="primary">
        {{ board.visible.filter(c => c.due).length }} itens com prazo
      </v-chip>
    </div>
    <div class="cal-grid">
      <div v-for="d in DOWS_PT_SHORT" :key="d" class="cal-dow">{{ d }}</div>
      <div v-for="(cell, i) in board.calCells" :key="i" class="cal-cell"
           :class="{ out: cell.out, today: cell.today }">
        <span class="cal-num">{{ cell.day }}</span>
        <span v-for="it in cell.items.slice(0, 3)" :key="it.id"
              class="cal-item"
              :class="'lbl-' + (it.labels[0] || '')"
              @click="board.openCard(it.id)">
          {{ it.id }} · {{ it.title }}
        </span>
        <span v-if="cell.items.length > 3" style="font-size:11px; color:#64748B; margin-top:3px; display:inline-block;">
          +{{ cell.items.length - 3 }} mais
        </span>
      </div>
    </div>
  </div>
</template>
