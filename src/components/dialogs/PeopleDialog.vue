<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useBoardStore } from '@/stores/board';
import { usePeopleStore } from '@/stores/people';

const people = usePeopleStore();
const board = useBoardStore();
const { peopleDialogOpen, personForm } = storeToRefs(people);
</script>

<template>
  <v-dialog v-model="peopleDialogOpen" max-width="780" scrollable>
    <v-card rounded="lg">
      <div style="padding:18px 24px 14px; border-bottom:1px solid #EAEDF1; display:flex; align-items:center; gap:10px;">
        <v-icon color="primary">mdi-account-group-outline</v-icon>
        <div style="font-weight:600; font-size:16px;">Gerenciar equipe</div>
        <v-chip size="x-small" variant="tonal" color="primary" style="font-weight:600;">{{ people.PEOPLE.length }} pessoas</v-chip>
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="peopleDialogOpen = false" />
      </div>

      <div style="display:grid; grid-template-columns:1fr 320px; min-height:460px;">
        <div style="padding:16px 20px; border-right:1px solid #EAEDF1; overflow-y:auto;">
          <div class="section-label" style="margin-bottom:12px;">Membros ({{ people.PEOPLE.length }})</div>
          <div v-for="p in people.PEOPLE" :key="p.id"
               style="display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:10px; margin-bottom:6px; border:1px solid #EAEDF1; background:#fff; cursor:pointer; transition: background .12s;"
               :style="personForm.id === p.id ? 'background:#E0F2F1; border-color:#4DB6AC;' : ''"
               @click="people.startEditPerson(p)">
            <span class="avatar-sm" :style="{ background: p.color, width: '36px', height: '36px', fontSize: '13px', flexShrink: 0 }">{{ p.initials }}</span>
            <div style="flex:1; min-width:0;">
              <div style="font-weight:500; font-size:14px;">{{ p.name }}</div>
              <div style="font-size:12px; color:#64748B;">{{ p.role || 'Sem cargo' }} · {{ p.email || 'Sem e-mail' }}</div>
            </div>
            <v-chip size="x-small" variant="tonal" color="default">
              {{ board.cards.filter(c => c.assignees.includes(p.id)).length }} tasks
            </v-chip>
            <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error" density="comfortable"
                   @click.stop="people.deletePerson(p.id)" />
          </div>
          <v-btn variant="tonal" color="primary" prepend-icon="mdi-plus" size="small" class="mt-3"
                 @click="people.resetPersonForm">Nova pessoa</v-btn>
        </div>

        <div style="padding:20px 20px; background:#FAFBFC;">
          <div class="section-label" style="margin-bottom:14px;">{{ personForm.id ? 'Editar membro' : 'Novo membro' }}</div>

          <div style="display:flex; justify-content:center; margin-bottom:16px;">
            <span class="avatar-sm" :style="{ background: personForm.color, width: '56px', height: '56px', fontSize: '20px', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,.12)' }">
              {{ personForm.initials || '?' }}
            </span>
          </div>

          <div class="section-label" style="margin-bottom:8px;">Cor do avatar</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
            <button v-for="c in people.AVATAR_COLORS" :key="c" type="button"
                    :style="{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: c,
                      border: '2px solid ' + (personForm.color === c ? '#fff' : 'transparent'),
                      outline: '2px solid ' + (personForm.color === c ? c : 'transparent'),
                      cursor: 'pointer',
                    }"
                    @click="personForm.color = c" />
          </div>

          <v-text-field v-model="personForm.name" label="Nome completo" variant="outlined" density="compact"
                        hide-details class="mb-3" rounded="lg" placeholder="Ana Ribeiro" />
          <v-text-field v-model="personForm.initials" label="Iniciais (2 letras)" variant="outlined" density="compact"
                        hide-details class="mb-3" rounded="lg" placeholder="AR" maxlength="2"
                        style="text-transform:uppercase;" />
          <v-text-field v-model="personForm.role" label="Cargo" variant="outlined" density="compact"
                        hide-details class="mb-3" rounded="lg" placeholder="Frontend, Backend, Design…" />
          <v-text-field v-model="personForm.email" label="E-mail" variant="outlined" density="compact"
                        hide-details class="mb-3" rounded="lg" placeholder="ana@empresa.com" />

          <div v-if="people.personFormError" style="color:#DC2626; font-size:12px; margin-bottom:8px;">{{ people.personFormError }}</div>

          <v-btn color="primary" variant="flat" block @click="people.savePerson"
                 :prepend-icon="personForm.id ? 'mdi-content-save-outline' : 'mdi-plus'">
            {{ personForm.id ? 'Salvar alterações' : 'Adicionar membro' }}
          </v-btn>
          <v-btn v-if="personForm.id" variant="text" block class="mt-2" @click="people.resetPersonForm">Cancelar edição</v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>
