import { defineStore } from 'pinia';
import { reactive, ref, watch } from 'vue';
import type { Person } from '@/types';
import { AVATAR_COLORS, SEED_PEOPLE } from '@/data/seed';
import { useWorkspaceStore } from './workspace';

function autoInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export const usePeopleStore = defineStore('people', () => {
  const PEOPLE = reactive<Person[]>(SEED_PEOPLE.map((p) => ({ ...p })));

  function setPeople(next: Person[]) {
    PEOPLE.splice(0, PEOPLE.length, ...next);
  }

  const personById = (id: string) => PEOPLE.find((p) => p.id === id);

  const peopleDialogOpen = ref(false);
  const personForm = reactive({
    id: null as string | null,
    name: '',
    initials: '',
    color: '#6366F1',
    role: '',
    email: '',
  });
  const personFormError = ref('');

  function openPeopleDialog() { peopleDialogOpen.value = true; }
  function startEditPerson(p: Person) {
    personForm.id = p.id;
    personForm.name = p.name;
    personForm.initials = p.initials;
    personForm.color = p.color;
    personForm.role = p.role || '';
    personForm.email = p.email || '';
    personFormError.value = '';
  }
  function resetPersonForm() {
    personForm.id = null;
    personForm.name = '';
    personForm.initials = '';
    personForm.color = AVATAR_COLORS[PEOPLE.length % AVATAR_COLORS.length];
    personForm.role = '';
    personForm.email = '';
    personFormError.value = '';
  }
  watch(() => personForm.name, (v) => {
    if (!personForm.id) personForm.initials = autoInitials(v);
  });

  function savePerson() {
    if (!personForm.name.trim()) { personFormError.value = 'Nome obrigatório.'; return; }
    if (!personForm.initials.trim()) { personFormError.value = 'Iniciais obrigatórias.'; return; }
    if (personForm.id) {
      const p = PEOPLE.find((x) => x.id === personForm.id);
      if (p) {
        p.name = personForm.name.trim();
        p.initials = personForm.initials.trim().toUpperCase().slice(0, 2);
        p.color = personForm.color;
        p.role = personForm.role;
        p.email = personForm.email;
      }
    } else {
      PEOPLE.push({
        id: 'u' + Date.now(),
        name: personForm.name.trim(),
        initials: personForm.initials.trim().toUpperCase().slice(0, 2),
        color: personForm.color,
        role: personForm.role,
        email: personForm.email,
      });
    }
    resetPersonForm();
  }

  function deletePerson(id: string) {
    const i = PEOPLE.findIndex((x) => x.id === id);
    if (i !== -1) PEOPLE.splice(i, 1);
    useWorkspaceStore().forEachCard((c) => {
      c.assignees = c.assignees.filter((a) => a !== id);
    });
    if (personForm.id === id) resetPersonForm();
  }

  return {
    PEOPLE, AVATAR_COLORS,
    personById, setPeople,
    peopleDialogOpen, personForm, personFormError,
    openPeopleDialog, startEditPerson, resetPersonForm, savePerson, deletePerson,
  };
});
