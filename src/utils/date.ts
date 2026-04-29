const _today = new Date();
_today.setHours(0, 0, 0, 0);
export const TODAY = _today;

export function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export const MONTHS_PT_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];
export const MONTHS_PT_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
export const DOWS_PT_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export function fmtDue(isoDate: string | null) {
  if (!isoDate) return null;
  const d = new Date(isoDate + 'T00:00:00');
  const diff = Math.round((d.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  const lbl = `${d.getDate()} ${MONTHS_PT_SHORT[d.getMonth()]}`;
  let cls = '';
  if (diff < 0) cls = 'due-over';
  else if (diff <= 2) cls = 'due-soon';
  return { lbl, diff, cls };
}

export function fmtDateTime(isoDateTime: string | null | undefined): string {
  if (!isoDateTime) return '';
  const d = new Date(isoDateTime);
  if (isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_PT_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}
