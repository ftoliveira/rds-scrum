<script setup lang="ts">
import { useBoardStore } from '@/stores/board';
import { useLabelsStore } from '@/stores/labels';
import { usePeopleStore } from '@/stores/people';
import { fmtDue } from '@/utils/date';

const board = useBoardStore();
const labels = useLabelsStore();
const people = usePeopleStore();

const statusColor = (col: string) =>
  col === 'done' ? 'success'
    : col === 'in_progress' ? 'warning'
    : col === 'review' ? '#8B5CF6'
    : 'default';
</script>

<template>
  <div class="pa-6">
    <v-card rounded="lg" border flat>
      <v-table density="comfortable">
        <thead>
          <tr style="background:#F8FAFC;">
            <th style="width:40px;" />
            <th style="width:100px;">ID</th>
            <th>Título</th>
            <th style="width:140px;">Status</th>
            <th style="width:120px;">Etiquetas</th>
            <th style="width:110px;">Responsável</th>
            <th style="width:110px; cursor:pointer; user-select:none;" @click="board.toggleSort('due')">
              <span style="display:inline-flex; align-items:center; gap:4px;">
                Prazo
                <v-icon size="14" :color="board.sortBy === 'due' ? 'primary' : '#CBD5E1'">
                  {{ board.sortBy === 'due' ? (board.sortDir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down') : 'mdi-unfold-more-horizontal' }}
                </v-icon>
              </span>
            </th>
            <th style="width:100px; cursor:pointer; user-select:none;" @click="board.toggleSort('priority')">
              <span style="display:inline-flex; align-items:center; gap:4px;">
                Prioridade
                <v-icon size="14" :color="board.sortBy === 'priority' ? 'primary' : '#CBD5E1'">
                  {{ board.sortBy === 'priority' ? (board.sortDir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down') : 'mdi-unfold-more-horizontal' }}
                </v-icon>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in board.sortedVisible" :key="c.id" class="list-row"
              @click="board.openCard(c.id)" style="cursor:pointer;">
            <td>
              <span class="card-type-icon" :style="{ background: board.TYPE_META[c.type].color }">
                <v-icon size="11">{{ board.TYPE_META[c.type].icon }}</v-icon>
              </span>
            </td>
            <td><span class="card-key">{{ c.id }}</span></td>
            <td style="font-weight:500;">{{ c.title }}</td>
            <td>
              <v-chip size="x-small" variant="tonal" :color="statusColor(c.col)" style="font-weight:500;">
                {{ board.COLUMNS.find(x => x.id === c.col)?.title }}
              </v-chip>
            </td>
            <td>
              <span v-for="l in c.labels.slice(0, 2)" :key="l"
                    class="label-chip"
                    :style="{ background: labels.LABELS[l]?.bg, color: labels.LABELS[l]?.fg, marginRight: '4px' }">
                {{ labels.LABELS[l]?.name }}
              </span>
            </td>
            <td>
              <div style="display:flex;">
                <span v-for="(aid, i) in c.assignees" :key="aid"
                      class="avatar-sm"
                      :style="{ background: people.personById(aid)?.color, marginLeft: i === 0 ? '0' : '-8px' }">
                  {{ people.personById(aid)?.initials }}
                </span>
              </div>
            </td>
            <td>
              <span v-if="c.due" :class="fmtDue(c.due)?.cls" style="font-size:13px;">{{ fmtDue(c.due)?.lbl }}</span>
              <span v-else style="color:#CBD5E1; font-size:13px;">—</span>
            </td>
            <td>
              <v-icon size="18" :color="board.PRIORITY_META[c.priority].color">{{ board.PRIORITY_META[c.priority].icon }}</v-icon>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
