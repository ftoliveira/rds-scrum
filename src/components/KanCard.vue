<script setup lang="ts">
import { useBoardStore } from '@/stores/board';
import type { Card } from '@/types';

defineProps<{ card: Card }>();
const s = useBoardStore();
</script>

<template>
  <div
    class="kan-card"
    draggable="true"
    @dragstart="s.onDragStart($event, card.id)"
    @dragend="s.onDragEnd($event)"
    @click="s.openCard(card.id)"
  >
    <div class="priority-bar" :style="{ background: s.PRIORITY_META[card.priority].color }" />

    <div class="card-type-row">
      <span class="card-type-icon" :style="{ background: s.TYPE_META[card.type].color }">
        <v-icon size="11">{{ s.TYPE_META[card.type].icon }}</v-icon>
      </span>
      <span class="card-key">{{ card.id }}</span>
      <v-spacer />
      <v-icon size="14" :color="s.PRIORITY_META[card.priority].color">
        {{ s.PRIORITY_META[card.priority].icon }}
      </v-icon>
    </div>

    <div class="card-title">{{ card.title }}</div>

    <div v-if="card.labels.length" class="card-labels">
      <span v-for="l in card.labels" :key="l"
            class="label-chip"
            :style="{ background: s.LABELS[l]?.bg, color: s.LABELS[l]?.fg }">
        {{ s.LABELS[l]?.name }}
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
        <span v-if="card.due" class="meta-item" :class="s.fmtDue(card.due)?.cls">
          <v-icon size="13">mdi-clock-outline</v-icon>
          {{ s.fmtDue(card.due)?.lbl }}
        </span>
        <span v-if="s.commentCount(card.id)" class="meta-item">
          <v-icon size="13">mdi-message-outline</v-icon>{{ s.commentCount(card.id) }}
        </span>
        <span v-if="s.attachmentCount(card.id)" class="meta-item">
          <v-icon size="13">mdi-paperclip</v-icon>{{ s.attachmentCount(card.id) }}
        </span>
      </div>
      <div style="display:flex;">
        <span v-for="(aid, i) in card.assignees" :key="aid"
              class="avatar-sm"
              :style="{
                background: s.personById(aid)?.color,
                marginLeft: i === 0 ? '0' : '-8px',
              }"
              :title="s.personById(aid)?.name">
          {{ s.personById(aid)?.initials }}
        </span>
      </div>
    </div>
  </div>
</template>
