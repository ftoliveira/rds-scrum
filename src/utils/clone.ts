import type { Card, Column } from '@/types';

export const cloneCol = (c: Column): Column => ({
  id: c.id,
  title: c.title,
  dot: c.dot,
});

export const cloneCard = (c: Card): Card => ({
  ...c,
  labels: [...c.labels],
  assignees: [...c.assignees],
  checklist: c.checklist ? c.checklist.map((ci) => ({ ...ci })) : undefined,
});
