<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useBoardStore } from '@/stores/board';

const s = useBoardStore();
const {
  projects, expandedProjects, activeProjectId, activeBoardId,
  addingProject, newProjectName, addingBoardIn, newBoardName,
  editingProjectId, editingProjectName, editingBoardId, editingBoardName,
} = storeToRefs(s);
</script>

<template>
  <div class="px-3 py-2 d-flex align-center" style="gap:6px;">
    <span class="text-caption" style="font-weight:600; letter-spacing:.08em; color:#64748B;">WORKSPACE</span>
    <v-spacer />
    <v-btn icon="mdi-plus" size="x-small" variant="text" density="comfortable"
           @click="s.beginAddProject" title="Novo projeto" />
  </div>

  <div class="px-2 pb-2" style="display:flex; flex-direction:column; gap:2px;">
    <template v-for="p in projects" :key="p.id">
      <div class="proj-row" :class="{ 'proj-row-active': p.id === activeProjectId }">
        <button class="proj-toggle" type="button" @click="s.toggleProject(p.id)"
                :aria-label="expandedProjects[p.id] ? 'Recolher' : 'Expandir'">
          <v-icon size="16" color="#94A3B8">{{ expandedProjects[p.id] ? 'mdi-chevron-down' : 'mdi-chevron-right' }}</v-icon>
        </button>
        <span class="proj-dot" :style="{ background: p.color }" />
        <template v-if="editingProjectId === p.id">
          <input :id="'edit-project-input-' + p.id" v-model="editingProjectName"
                 class="proj-edit-input"
                 @keyup.enter="s.commitRenameProject" @keyup.esc="editingProjectId = null"
                 @blur="s.commitRenameProject" />
        </template>
        <template v-else>
          <span class="proj-name" @dblclick="s.beginRenameProject(p)" :title="p.name">{{ p.name }}</span>
        </template>
        <span class="proj-count">{{ p.boards.length }}</span>
        <v-menu location="end">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon="mdi-dots-horizontal" size="x-small"
                   variant="text" density="comfortable" class="proj-menu-btn" />
          </template>
          <v-list density="compact" nav>
            <v-list-item @click="s.beginAddBoard(p.id)" prepend-icon="mdi-plus" title="Novo board" />
            <v-list-item @click="s.beginRenameProject(p)" prepend-icon="mdi-pencil-outline" title="Renomear" />
            <v-divider class="my-1" />
            <v-list-item @click="s.removeProject(p.id)" prepend-icon="mdi-delete-outline"
                         title="Excluir projeto" base-color="error" />
          </v-list>
        </v-menu>
      </div>

      <div v-if="expandedProjects[p.id]" style="display:flex; flex-direction:column; gap:1px; padding-bottom:4px;">
        <template v-for="b in p.boards" :key="b.id">
          <div class="board-row" :class="{ 'board-row-active': b.id === activeBoardId }"
               @click="s.switchBoard(p.id, b.id)">
            <v-icon size="12" :color="b.id === activeBoardId ? p.color : '#CBD5E1'" style="margin-left:2px;">
              {{ b.id === activeBoardId ? 'mdi-circle' : 'mdi-circle-outline' }}
            </v-icon>
            <template v-if="editingBoardId === b.id">
              <input :id="'edit-board-input-' + b.id" v-model="editingBoardName"
                     class="board-edit-input" @click.stop
                     @keyup.enter="s.commitRenameBoard(p.id)" @keyup.esc="editingBoardId = null"
                     @blur="s.commitRenameBoard(p.id)" />
            </template>
            <template v-else>
              <span class="board-name" @dblclick.stop="s.beginRenameBoard(b)">{{ b.name }}</span>
            </template>
            <v-menu location="end">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-dots-horizontal" size="x-small"
                       variant="text" density="comfortable" class="board-menu-btn" @click.stop />
              </template>
              <v-list density="compact" nav>
                <v-list-item @click="s.beginRenameBoard(b)" prepend-icon="mdi-pencil-outline" title="Renomear" />
                <v-divider class="my-1" />
                <v-list-item @click="s.removeBoard(p.id, b.id)" prepend-icon="mdi-delete-outline"
                             title="Excluir board" base-color="error" />
              </v-list>
            </v-menu>
          </div>
        </template>

        <div v-if="addingBoardIn === p.id" class="board-row" style="background:#F8FAFC;">
          <v-icon size="12" color="#CBD5E1" style="margin-left:2px;">mdi-circle-outline</v-icon>
          <input id="new-board-input" v-model="newBoardName"
                 class="board-edit-input" placeholder="Nome do board"
                 @keyup.enter="s.commitAddBoard" @keyup.esc="addingBoardIn = null"
                 @blur="s.commitAddBoard" />
        </div>
        <button v-else type="button" class="board-add-btn" @click="s.beginAddBoard(p.id)">
          <v-icon size="14" color="#94A3B8">mdi-plus</v-icon>
          <span>Novo board</span>
        </button>
      </div>
    </template>

    <div v-if="addingProject" class="proj-row" style="background:#F8FAFC;">
      <span style="width:18px;" />
      <span class="proj-dot" style="background:#CBD5E1;" />
      <input id="new-project-input" v-model="newProjectName"
             class="proj-edit-input" placeholder="Nome do projeto"
             @keyup.enter="s.commitAddProject" @keyup.esc="addingProject = false"
             @blur="s.commitAddProject" />
    </div>
    <button v-else type="button" class="proj-add-btn" @click="s.beginAddProject">
      <v-icon size="16" color="#94A3B8">mdi-plus</v-icon>
      <span>Novo projeto</span>
    </button>
  </div>
</template>
