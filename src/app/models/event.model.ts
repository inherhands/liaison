export type EventType = 'Sex' | 'Note' | 'Solo' | 'Refusal' | 'Health';

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
  tags: string[];
  text: string;
}

export interface HealthEvent extends BaseEvent {
  type: 'Health';
  affectedParty: 'Me' | 'Partner' | 'Both';
  partner?: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  symptoms: string[];
  notes?: string;
}

export type TrackerEvent = SexEvent | NoteEvent | SoloEvent | RefusalEvent | HealthEvent;

export interface Partner {
  id: string;
  name: string;
  sex?: 'male' | 'female' | 'other';
}

export type TagCategory = 'sexType' | 'positions' | 'tags' | 'toys' | 'soloTags' | 'healthSymptoms' | 'refusalTags';

export interface TagOption {
  id: string; // `${category}:${value}`
  category: TagCategory;
  value: string;
  createdAt?: number;
}
