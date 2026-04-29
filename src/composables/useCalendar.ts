import { computed, ref } from 'vue';
import type { Card } from '@/types';
import { MONTHS_PT_FULL, TODAY, iso } from '@/utils/date';

export function useCalendar(getVisible: () => Card[]) {
  const calMonth = ref(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1));

  function calNext() {
    const n = new Date(calMonth.value);
    n.setMonth(n.getMonth() + 1);
    calMonth.value = n;
  }

  function calPrev() {
    const n = new Date(calMonth.value);
    n.setMonth(n.getMonth() - 1);
    calMonth.value = n;
  }

  const calCells = computed(() => {
    const first = new Date(calMonth.value);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    const visibleCards = getVisible();
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const items = visibleCards.filter((c) => c.due === iso(d));
      cells.push({
        date: d,
        day: d.getDate(),
        out: d.getMonth() !== first.getMonth(),
        today: iso(d) === iso(TODAY),
        items,
      });
    }
    return cells;
  });

  const monthLabel = computed(
    () => `${MONTHS_PT_FULL[calMonth.value.getMonth()]} ${calMonth.value.getFullYear()}`,
  );

  return { calMonth, calNext, calPrev, calCells, monthLabel };
}
