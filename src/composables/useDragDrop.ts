import { ref } from 'vue';

export function useDragDrop<TKey>(onDropToTarget: (id: string, target: TKey) => void) {
  const dragId = ref<string | null>(null);
  const dragOverTarget = ref<TKey | null>(null);

  function setDragOver(target: TKey) {
    dragOverTarget.value = target;
  }
  function clearDragOver() {
    dragOverTarget.value = null;
  }

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

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const target = dragOverTarget.value;
    if (!target) {
      dragId.value = null;
      return;
    }
    const id = e.dataTransfer?.getData('text/plain') || dragId.value;
    if (id) onDropToTarget(id, target);
    dragId.value = null;
    dragOverTarget.value = null;
  }

  return {
    dragId, dragOverTarget,
    setDragOver, clearDragOver,
    onDragStart, onDragEnd, onDrop,
  };
}
