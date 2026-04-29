import type { Card, Column, Label, Person, PriorityMeta, TypeMeta } from '@/types';

const today = new Date();
today.setHours(0, 0, 0, 0);

export const TODAY = today;
export const iso = (d: Date): string => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const PROJECT_COLORS = [
  '#0F766E', '#6366F1', '#EC4899', '#F59E0B', '#10B981',
  '#0EA5E9', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316',
];

export const COLUMN_PRESETS = [
  '#94A3B8', '#64748B', '#F59E0B', '#8B5CF6', '#16A34A',
  '#0EA5E9', '#EC4899', '#EF4444', '#10B981', '#6366F1',
];

export const AVATAR_COLORS = [
  '#EC4899', '#6366F1', '#F59E0B', '#10B981', '#8B5CF6',
  '#0EA5E9', '#EF4444', '#14B8A6', '#F97316', '#84CC16',
];

export const LABEL_PRESETS = [
  { fg: '#991B1B', bg: '#FEE2E2' }, { fg: '#1E40AF', bg: '#DBEAFE' },
  { fg: '#065F46', bg: '#D1FAE5' }, { fg: '#92400E', bg: '#FEF3C7' },
  { fg: '#3730A3', bg: '#E0E7FF' }, { fg: '#9D174D', bg: '#FCE7F3' },
  { fg: '#475569', bg: '#F1F5F9' }, { fg: '#B91C1C', bg: '#FEF2F2' },
  { fg: '#164E63', bg: '#CFFAFE' }, { fg: '#713F12', bg: '#FEF9C3' },
];

export const TYPE_META: Record<string, TypeMeta> = {
  story:   { icon: 'mdi-bookmark',         color: '#16A34A' },
  bug:     { icon: 'mdi-bug',              color: '#DC2626' },
  task:    { icon: 'mdi-check-circle',     color: '#0284C7' },
  feature: { icon: 'mdi-star-four-points', color: '#8B5CF6' },
  epic:    { icon: 'mdi-lightning-bolt',   color: '#D97706' },
};

export const PRIORITY_META: Record<string, PriorityMeta> = {
  low:      { color: '#94A3B8', icon: 'mdi-chevron-down',       label: 'Baixa' },
  medium:   { color: '#F59E0B', icon: 'mdi-equal',              label: 'Média' },
  high:     { color: '#EF4444', icon: 'mdi-chevron-up',         label: 'Alta' },
  critical: { color: '#B91C1C', icon: 'mdi-chevron-double-up',  label: 'Crítica' },
};

export const PRIO_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export const SEED_PEOPLE: Person[] = [
  { id: 'u1', name: 'Ana Ribeiro',    initials: 'AR', color: '#EC4899', role: 'Frontend',  email: 'ana@skyline.dev' },
  { id: 'u2', name: 'Bruno Carvalho', initials: 'BC', color: '#6366F1', role: 'Backend',   email: 'bruno@skyline.dev' },
  { id: 'u3', name: 'Clara Nunes',    initials: 'CN', color: '#F59E0B', role: 'Fullstack', email: 'clara@skyline.dev' },
  { id: 'u4', name: 'Diego Lopes',    initials: 'DL', color: '#10B981', role: 'DevOps',    email: 'diego@skyline.dev' },
  { id: 'u5', name: 'Erika Tanaka',   initials: 'ET', color: '#8B5CF6', role: 'Design',    email: 'erika@skyline.dev' },
  { id: 'u6', name: 'Felipe Moura',   initials: 'FM', color: '#0EA5E9', role: 'Backend',   email: 'felipe@skyline.dev' },
];

export const SEED_LABELS: Record<string, Label> = {
  bug:      { name: 'bug',      bg: '#FEE2E2', fg: '#991B1B' },
  feature:  { name: 'feature',  bg: '#DBEAFE', fg: '#1E40AF' },
  chore:    { name: 'chore',    bg: '#F1F5F9', fg: '#475569' },
  research: { name: 'research', bg: '#FEF3C7', fg: '#92400E' },
  design:   { name: 'design',   bg: '#FCE7F3', fg: '#9D174D' },
  infra:    { name: 'infra',    bg: '#E0E7FF', fg: '#3730A3' },
  docs:     { name: 'docs',     bg: '#D1FAE5', fg: '#065F46' },
  urgent:   { name: 'urgent',   bg: '#FEF2F2', fg: '#B91C1C' },
};

export const SKYLINE_COLUMNS: Column[] = [
  { id: 'backlog',     title: 'Backlog',     dot: '#94A3B8' },
  { id: 'todo',        title: 'To Do',       dot: '#64748B' },
  { id: 'in_progress', title: 'In Progress', dot: '#F59E0B' },
  { id: 'review',      title: 'Review',      dot: '#8B5CF6' },
  { id: 'done',        title: 'Done',        dot: '#16A34A' },
];

export const SEED_CARDS: Card[] = [
  { id:'KAN-142', col:'backlog', type:'feature', title:'Implement SSO login via SAML 2.0 for enterprise customers', labels:['feature','infra'], assignees:['u2'], due: iso(addDays(today, 18)), priority:'high', comments:3, attachments:1, checklist:[{t:'Research IdPs', d:true},{t:'Spike on Okta', d:false},{t:'ADR draft', d:false}] },
  { id:'KAN-156', col:'backlog', type:'task',    title:'Migrate legacy metrics dashboard to new charting lib', labels:['chore','infra'], assignees:['u6'], due: iso(addDays(today, 22)), priority:'medium', comments:0, attachments:0 },
  { id:'KAN-161', col:'backlog', type:'story',   title:'Allow bulk edit of tasks from the list view', labels:['feature'], assignees:['u3','u1'], due: iso(addDays(today, 30)), priority:'medium', comments:5, attachments:2 },
  { id:'KAN-167', col:'backlog', type:'bug',     title:'Timezone offset wrong when exporting CSV from reports', labels:['bug'], assignees:['u4'], due: iso(addDays(today, 12)), priority:'low', comments:2, attachments:0 },
  { id:'KAN-170', col:'backlog', type:'task',    title:'Investigate flaky CI job on macOS runners', labels:['infra','research'], assignees:['u6'], due: null, priority:'low', comments:1, attachments:0 },

  { id:'KAN-128', col:'todo', type:'feature', title:'Add keyboard shortcuts overlay (⌘/)', labels:['feature','design'], assignees:['u5'], due: iso(addDays(today, 6)), priority:'medium', comments:4, attachments:1, checklist:[{t:'Design overlay', d:true},{t:'Register shortcuts', d:false}] },
  { id:'KAN-133', col:'todo', type:'story',   title:'Onboarding tour for first-time board creators', labels:['feature','design'], assignees:['u1','u5'], due: iso(addDays(today, 9)), priority:'high', comments:7, attachments:3 },
  { id:'KAN-139', col:'todo', type:'bug',     title:'Drag-and-drop fails on Firefox for nested swimlanes', labels:['bug','urgent'], assignees:['u2'], due: iso(addDays(today, 2)), priority:'critical', comments:12, attachments:2 },
  { id:'KAN-145', col:'todo', type:'task',    title:'Write API docs for /boards/:id/automations', labels:['docs'], assignees:['u4'], due: iso(addDays(today, 10)), priority:'low', comments:0, attachments:0 },

  { id:'KAN-118', col:'in_progress', type:'feature', title:'Real-time collaborative cursors on board view', labels:['feature','infra'], assignees:['u2','u6'], due: iso(addDays(today, 4)), priority:'high', comments:9, attachments:1, checklist:[{t:'WebSocket channel', d:true},{t:'Cursor renderer', d:true},{t:'Presence dedupe', d:false},{t:'QA pass', d:false}] },
  { id:'KAN-122', col:'in_progress', type:'bug',     title:'Card due date off by one day in Safari', labels:['bug'], assignees:['u1'], due: iso(addDays(today, 1)), priority:'high', comments:6, attachments:1 },
  { id:'KAN-125', col:'in_progress', type:'task',    title:'Refactor board reducer to use immer for nested updates', labels:['chore'], assignees:['u3'], due: iso(addDays(today, 7)), priority:'medium', comments:2, attachments:0 },
  { id:'KAN-131', col:'in_progress', type:'story',   title:'Inline markdown preview on card description', labels:['feature'], assignees:['u5'], due: iso(addDays(today, 5)), priority:'medium', comments:3, attachments:0 },

  { id:'KAN-109', col:'review', type:'feature', title:'Saved views with per-user filter persistence', labels:['feature'], assignees:['u4'], due: iso(addDays(today, 2)), priority:'high', comments:11, attachments:2 },
  { id:'KAN-114', col:'review', type:'bug',     title:'Notification badge flickers on mount', labels:['bug'], assignees:['u1'], due: iso(addDays(today, 3)), priority:'low', comments:1, attachments:0 },
  { id:'KAN-117', col:'review', type:'task',    title:'Add retry-with-backoff to sync queue', labels:['infra','chore'], assignees:['u2'], due: iso(addDays(today, 4)), priority:'medium', comments:4, attachments:1 },

  { id:'KAN-101', col:'done', type:'story',   title:'Dark mode pass for settings pages', labels:['design'], assignees:['u5'], due: iso(addDays(today, -3)), priority:'low', comments:3, attachments:0 },
  { id:'KAN-104', col:'done', type:'feature', title:'Shareable public links for read-only boards', labels:['feature'], assignees:['u4','u2'], due: iso(addDays(today, -5)), priority:'medium', comments:8, attachments:1 },
  { id:'KAN-107', col:'done', type:'bug',     title:'Fix NPE on empty sprint velocity chart', labels:['bug'], assignees:['u3'], due: iso(addDays(today, -1)), priority:'medium', comments:2, attachments:0 },
  { id:'KAN-112', col:'done', type:'task',    title:'Upgrade Node to 20 LTS across services', labels:['infra','chore'], assignees:['u6'], due: iso(addDays(today, -8)), priority:'low', comments:0, attachments:0 },
];

export const SEED_COMMENT_TEMPLATES = [
  { author: 'Ana Ribeiro',    initials: 'AR', color: '#EC4899', text: 'Falei com a galera de infra, o Okta já tem tenant dedicado. Bora focar primeiro nele e depois generalizar.', time: 'há 3h' },
  { author: 'Bruno Carvalho', initials: 'BC', color: '#6366F1', text: 'Subi um draft do schema de tokens em /docs/auth.md — feedback bem-vindo.', time: 'há 1d' },
  { author: 'Camila Souza',   initials: 'CS', color: '#10B981', text: 'Os mocks do Figma já estão atualizados com o novo fluxo. Vou compartilhar o link no canal.', time: 'há 2d' },
  { author: 'Diego Oliveira', initials: 'DO', color: '#F59E0B', text: 'QA validou em homolog, sem regressões. Liberado pra subir em prod no próximo deploy.', time: 'há 4d' },
  { author: 'Eduarda Lima',   initials: 'EL', color: '#8B5CF6', text: 'Ajustei o copy conforme conversamos. Confere se ficou bom?', time: 'há 5d' },
];
