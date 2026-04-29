<script setup lang="ts">
import { useActivityStore } from '@/stores/activity';
import { useBoardStore } from '@/stores/board';
import { useLabelsStore } from '@/stores/labels';
import { usePeopleStore } from '@/stores/people';
import type { Card } from '@/types';
import { fmtDue } from '@/utils/date';

const props = defineProps<{ card: Card }>();
const board = useBoardStore();
const labels = useLabelsStore();
const people = usePeopleStore();
const activity = useActivityStore();

function onCardDragOver(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const isAbove = e.clientY < rect.top + rect.height / 2;
  const colCards = board.cardsByCol[props.card.col] ?? [];
  const i = colCards.findIndex((c) => c.id === props.card.id);
  const beforeId = isAbove
    ? props.card.id
    : (colCards[i + 1]?.id ?? null);
  board.setDragOver({ colId: props.card.col, beforeId });
}
function onCardDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  board.onDrop(e);
}
</script>

<template>
  <div
    class="kan-card"
    draggable="true"
    @dragstart="board.onDragStart($event, card.id)"
    @dragend="board.onDragEnd($event)"
    @dragover="onCardDragOver"
    @drop="onCardDrop"
    @click="board.openCard(card.id)"
  >
    <div class="priority-bar" :style="{ background: board.PRIORITY_META[card.priority].color }" />

    <div class="card-type-row">
      <span class="card-type-icon" :style="{ background: board.TYPE_META[card.type].color }">
        <v-icon size="11">{{ board.TYPE_META[card.type].icon }}</v-icon>
      </span>
      <span class="card-key">{{ card.id }}</span>
      <v-spacer />
      <v-icon size="14" :color="board.PRIORITY_META[card.priority].color">
        {{ board.PRIORITY_META[card.priority].icon }}
      </v-icon>
    </div>

    <div class="card-title">{{ card.title }}</div>

    <div v-if="card.labels.length" class="card-labels">
      <span v-for="l in card.labels" :key="l"
            class="label-chip"
            :style="{ background: labels.LABELS[l]?.bg, color: labels.LABELS[l]?.fg }">
        {{ labels.LABELS[l]?.name }}
      </span>
    </div>

    <div v-if="card.checklist" style="margin:4px 0 10px;">
      <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:#64748B; margin-bottom:4px;">
        <v-icon size="12">mdi-check-circle-outline</v-icon>
        {{ card.checklist.filter(i=>i.d).length }}/{{ card.checklist.length }}
      </div>
      <div style="height:4px; background:#EAEDF1; border-radius:4px; overflow:hidden;">
        <div :style="{
          height: '100%',
          width: (card.checklist.filter(i=>i.d).length / card.checklist.length * 100) + '%',
          background: card.col === 'done' ? '#16A34A' : '#00897B',
        }" />
      </div>
    </div>

    <div class="card-foot">
      <div class="foot-meta">
        <span v-if="card.due" class="meta-item" :class="fmtDue(card.due)?.cls">
          <v-icon size="13">mdi-clock-outline</v-icon>
          {{ fmtDue(card.due)?.lbl }}
        </span>
        <span v-if="activity.commentCount(card.id)" class="meta-item">
          <v-icon size="13">mdi-message-outline</v-icon>{{ activity.commentCount(card.id) }}
        </span>
        <span v-if="activity.attachmentCount(card.id)" class="meta-item">
          <v-icon size="13">mdi-paperclip</v-icon>{{ activity.attachmentCount(card.id) }}
        </span>
      </div>
      <div style="display:flex;">
        <span v-for="(aid, i) in card.assignees" :key="aid"
              class="avatar-sm"
              :style="{
                background: people.personById(aid)?.color,
                marginLeft: i === 0 ? '0' : '-8px',
              }"
              :title="people.personById(aid)?.name">
          {{ people.personById(aid)?.initials }}
        </span>
      </div>
    </div>
  </div>
</template>
