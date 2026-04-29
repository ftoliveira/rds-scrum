<script setup lang="ts">
import { useBoardStore } from '@/stores/board';

const s = useBoardStore();

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
            <th style="width:110px; cursor:pointer; user-select:none;" @click="s.toggleSort('due')">
              <span style="display:inline-flex; align-items:center; gap:4px;">
                Prazo
                <v-icon size="14" :color="s.sortBy === 'due' ? 'primary' : '#CBD5E1'">
                  {{ s.sortBy === 'due' ? (s.sortDir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down') : 'mdi-unfold-more-horizontal' }}
                </v-icon>
              </span>
            </th>
            <th style="width:100px; cursor:pointer; user-select:none;" @click="s.toggleSort('priority')">
              <span style="display:inline-flex; align-items:center; gap:4px;">
                Prioridade
                <v-icon size="14" :color="s.sortBy === 'priority' ? 'primary' : '#CBD5E1'">
                  {{ s.sortBy === 'priority' ? (s.sortDir === 'asc' ? 'mdi-arrow-up' : 'mdi-arrow-down') : 'mdi-unfold-more-horizontal' }}
                </v-icon>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in s.sortedVisible" :key="c.id" class="list-row"
              @click="s.openCard(c.id)" style="cursor:pointer;">
            <td>
              <span class="card-type-icon" :style="{ background: s.TYPE_META[c.type].color }">
                <v-icon size="11">{{ s.TYPE_META[c.type].icon }}</v-icon>
              </span>
            </td>
            <td><span class="card-key">{{ c.id }}</span></td>
            <td style="font-weight:500;">{{ c.title }}</td>
            <td>
              <v-chip size="x-small" variant="tonal" :color="statusColor(c.col)" style="font-weight:500;">
                {{ s.COLUMNS.find(x => x.id === c.col)?.title }}
              </v-chip>
            </td>
            <td>
              <span v-for="l in c.labels.slice(0, 2)" :key="l"
                    class="label-chip"
                    :style="{ background: s.LABELS[l]?.bg, color: s.LABELS[l]?.fg, marginRight: '4px' }">
                {{ s.LABELS[l]?.name }}
              </span>
            </td>
            <td>
              <div style="display:flex;">
                <span v-for="(aid, i) in c.assignees" :key="aid"
                      class="avatar-sm"
                      :style="{ background: s.personById(aid)?.color, marginLeft: i === 0 ? '0' : '-8px' }">
                  {{ s.personById(aid)?.initials }}
                </span>
              </div>
            </td>
            <td>
              <span v-if="c.due" :class="s.fmtDue(c.due)?.cls" style="font-size:13px;">{{ s.fmtDue(c.due)?.lbl }}</span>
              <span v-else style="color:#CBD5E1; font-size:13px;">—</span>
            </td>
            <td>
              <v-icon size="18" :color="s.PRIORITY_META[c.priority].color">{{ s.PRIORITY_META[c.priority].icon }}</v-icon>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
