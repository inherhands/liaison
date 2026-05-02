export type EventType = 'Sex' | 'Note' | 'Solo' | 'Refusal';

export interface BaseEvent {
  id: string;
  type: EventType;
  date: string; // ISO datetime string
}

export interface SexEvent extends BaseEvent {
  type: 'Sex';
  partner: string;
  sexType: string[];
  count: number;
  myOrgasms: number;
  partnerOrgasms: number;
  positions: string[];
  tags: string[];
  initiation: 'Me' | 'Partner' | 'Both';
  toys: string[];
  notes?: string;
}

export interface NoteEvent extends BaseEvent {
  type: 'Note';
  text: string;
}

export interface SoloEvent extends BaseEvent {
  type: 'Solo';
  count: number;
  myOrgasms: number;
  toys: string[];
  tags: string[];
  notes?: string;
}

export interface RefusalEvent extends BaseEvent {
  type: 'Refusal';
  partner: string;
  text: string;
}

export type TrackerEvent = SexEvent | NoteEvent | SoloEvent | RefusalEvent;

export interface Partner {
  id: string;
  name: string;
}

export type TagCategory = 'sexType' | 'positions' | 'tags' | 'toys' | 'soloToys' | 'soloTags';

export interface TagOption {
  id: string; // `${category}:${value}`
  category: TagCategory;
  value: string;
}
