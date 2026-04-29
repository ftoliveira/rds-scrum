export type CardType = 'story' | 'bug' | 'task' | 'feature' | 'epic';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type ViewMode = 'board' | 'list' | 'calendar';
export type SortField = 'due' | 'priority' | null;

export interface ChecklistItem {
  t: string;
  d: boolean;
}

export interface Card {
  id: string;
  col: string;
  type: CardType;
  title: string;
  description?: string;
  labels: string[];
  assignees: string[];
  due: string | null;
  priority: Priority;
  comments: number;
  attachments: number;
  checklist?: ChecklistItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Column {
  id: string;
  title: string;
  dot: string;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  cards: Card[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  boards: Board[];
}

export interface Person {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: string;
  email: string;
}

export interface Label {
  name: string;
  bg: string;
  fg: string;
}

export interface Comment {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  time: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  addedAt: string;
}

export interface TypeMeta {
  icon: string;
  color: string;
}

export interface PriorityMeta {
  color: string;
  icon: string;
  label: string;
}
