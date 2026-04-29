import type { Attachment } from '@/types';

export const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

export function fmtFileSize(bytes: number): string {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function isImageAttachment(att: Attachment | null | undefined): boolean {
  return !!att && typeof att.type === 'string' && att.type.startsWith('image/');
}

export function fileIconFor(att: Attachment): string {
  const t = (att?.type || '').toLowerCase();
  const n = (att?.name || '').toLowerCase();
  if (t.startsWith('image/')) return 'mdi-file-image-outline';
  if (t.startsWith('video/')) return 'mdi-file-video-outline';
  if (t.startsWith('audio/')) return 'mdi-file-music-outline';
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'mdi-file-pdf-box';
  if (t.includes('zip') || /\.(zip|rar|7z)$/.test(n)) return 'mdi-folder-zip-outline';
  if (t.includes('word') || /\.(doc|docx)$/.test(n)) return 'mdi-file-word-outline';
  if (t.includes('sheet') || /\.(xls|xlsx|csv)$/.test(n)) return 'mdi-file-excel-outline';
  if (t.includes('presentation') || /\.(ppt|pptx)$/.test(n)) return 'mdi-file-powerpoint-outline';
  if (t.startsWith('text/') || /\.(md|txt)$/.test(n)) return 'mdi-file-document-outline';
  if (/\.(js|ts|jsx|tsx|py|rb|go|rs|java|cpp|c|cs|html|css|json|xml|yml|yaml)$/.test(n)) return 'mdi-file-code-outline';
  return 'mdi-file-outline';
}

export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function downloadDataUrl(name: string, dataUrl: string): void {
  if (!dataUrl) return;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = name || 'attachment';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
