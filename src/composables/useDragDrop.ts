import { ref } from 'vue';

export function useDragDrop<TKey>(onDropToTarget: (id: string, target: TKey) => void) {
  const dragId = ref<string | null>(null);
  const dragOverTarget = ref<TKey | null>(null);

  function onDragStart(e: DragEvent, id: string) {
    dragId.value = id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
    }
    (e.currentTarget as HTMLElement | null)?.classList.add('dragging');
  }

  function onDragEnd(e: DragEvent) {
    dragId.value = null;
    dragOverTarget.value = null;
    (e.currentTarget as HTMLElement | null)?.classList.remove('dragging');
  }

  function onDragOver(e: DragEvent, target: TKey) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    dragOverTarget.value = target;
  }

  function onDragLeave(target: TKey) {
    if (dragOverTarget.value === target) dragOverTarget.value = null;
  }

  function onDrop(e: DragEvent, target: TKey) {
    e.preventDefault();
    const id = e.dataTransfer?.getData('text/plain') || dragId.value;
    if (id) onDropToTarget(id, target);
    dragId.value = null;
    dragOverTarget.value = null;
  }

  return { dragId, dragOverTarget, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop };
}
