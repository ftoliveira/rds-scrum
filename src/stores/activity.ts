import { defineStore } from 'pinia';
import { reactive, ref } from 'vue';
import type { Attachment, Card, Comment } from '@/types';
import { SEED_COMMENT_TEMPLATES } from '@/data/seed';
import { ATTACHMENT_MAX_BYTES, fmtFileSize, readAsDataUrl } from '@/utils/file';
import { useWorkspaceStore } from './workspace';

export const useActivityStore = defineStore('activity', () => {
  // ---- Comments ----
  const cardComments = reactive<Record<string, Comment[]>>({});
  const newCommentText = ref('');

  function setComments(next: Record<string, Comment[]>) {
    Object.keys(cardComments).forEach((k) => delete cardComments[k]);
    Object.assign(cardComments, next);
  }

  function seedFromCards(cards: Card[]) {
    cards.forEach((c) => {
      if (cardComments[c.id]) return;
      const n = Math.max(0, c.comments || 0);
      if (!n) return;
      cardComments[c.id] = Array.from({ length: n }, (_, i) => ({
        id: 'c' + i,
        ...SEED_COMMENT_TEMPLATES[i % SEED_COMMENT_TEMPLATES.length],
      }));
    });
  }

  function commentCount(cardId: string) {
    return (cardComments[cardId] || []).length;
  }

  function findCard(cardId: string): Card | undefined {
    const ws = useWorkspaceStore();
    for (const p of ws.projects) {
      for (const b of p.boards) {
        const c = b.cards.find((x) => x.id === cardId);
        if (c) return c;
      }
    }
    return undefined;
  }

  function saveComment(cardId: string) {
    const t = newCommentText.value.trim();
    if (!t) return;
    if (!cardComments[cardId]) cardComments[cardId] = [];
    cardComments[cardId].unshift({
      id: Date.now().toString(),
      author: 'Você',
      initials: 'VM',
      color: '#6366F1',
      text: t,
      time: 'agora',
    });
    const c = findCard(cardId);
    if (c) c.comments = cardComments[cardId].length;
    newCommentText.value = '';
  }

  function editComment(cardId: string, commentId: string, text: string) {
    const t = text.trim();
    if (!t) return;
    const list = cardComments[cardId];
    if (!list) return;
    const cm = list.find((x) => x.id === commentId);
    if (!cm) return;
    if (cm.text === t) return;
    cm.text = t;
    cm.time = 'editado agora';
  }

  function removeComment(cardId: string, commentId: string) {
    if (!cardComments[cardId]) return;
    cardComments[cardId] = cardComments[cardId].filter((x) => x.id !== commentId);
    const c = findCard(cardId);
    if (c) c.comments = cardComments[cardId].length;
  }

  // ---- Attachments ----
  const cardAttachments = reactive<Record<string, Attachment[]>>({});
  const attachmentError = ref('');
  const attachmentDragOver = ref(false);

  function setAttachments(next: Record<string, Attachment[]>) {
    Object.keys(cardAttachments).forEach((k) => delete cardAttachments[k]);
    Object.assign(cardAttachments, next);
  }

  function attachmentCount(cardId: string) {
    return (cardAttachments[cardId] || []).length;
  }

  async function addAttachmentFiles(cardId: string, fileList: FileList) {
    attachmentError.value = '';
    if (!cardId || !fileList || !fileList.length) return;
    if (!cardAttachments[cardId]) cardAttachments[cardId] = [];
    const skipped: string[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > ATTACHMENT_MAX_BYTES) {
        skipped.push(`${file.name} (${fmtFileSize(file.size)})`);
        continue;
      }
      try {
        const dataUrl = await readAsDataUrl(file);
        cardAttachments[cardId].unshift({
          id: 'att_' + Date.now() + '_' + Math.floor(Math.random() * 1e6),
          name: file.name,
          type: file.type || '',
          size: file.size,
          dataUrl,
          addedAt: new Date().toISOString(),
        });
      } catch {
        skipped.push(file.name);
      }
    }
    const c = findCard(cardId);
    if (c) c.attachments = cardAttachments[cardId].length;
    if (skipped.length) {
      attachmentError.value =
        `Não foi possível anexar (limite ${fmtFileSize(ATTACHMENT_MAX_BYTES)} por arquivo): ${skipped.join(', ')}`;
      setTimeout(() => { attachmentError.value = ''; }, 6000);
    }
  }

  function removeAttachment(cardId: string, attId: string) {
    if (!cardAttachments[cardId]) return;
    cardAttachments[cardId] = cardAttachments[cardId].filter((a) => a.id !== attId);
    const c = findCard(cardId);
    if (c) c.attachments = cardAttachments[cardId].length;
  }

  function onAttachmentDragOver(e: DragEvent) { e.preventDefault(); attachmentDragOver.value = true; }
  function onAttachmentDragLeave() { attachmentDragOver.value = false; }
  async function onAttachmentDrop(e: DragEvent, cardId: string) {
    e.preventDefault();
    attachmentDragOver.value = false;
    const files = e.dataTransfer?.files;
    if (files?.length) await addAttachmentFiles(cardId, files);
  }
  async function onAttachmentInputChange(e: Event, cardId: string) {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) await addAttachmentFiles(cardId, target.files);
    target.value = '';
  }

  function dropForCardIds(cardIds: string[]) {
    cardIds.forEach((id) => {
      delete cardComments[id];
      delete cardAttachments[id];
    });
  }

  return {
    cardComments, newCommentText,
    setComments, seedFromCards, commentCount, saveComment, editComment, removeComment,
    cardAttachments, attachmentError, attachmentDragOver,
    setAttachments, attachmentCount,
    addAttachmentFiles, removeAttachment,
    onAttachmentDragOver, onAttachmentDragLeave, onAttachmentDrop, onAttachmentInputChange,
    dropForCardIds,
  };
});
