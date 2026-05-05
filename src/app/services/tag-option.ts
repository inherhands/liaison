import { Injectable } from '@angular/core';
import { Database } from './database';
import { TagCategory, TagOption } from '../models/event.model';

export const TAG_DEFAULTS: Record<TagCategory, string[]> = {
  sexType:        ['Vaginal', 'Anal', 'Oral'],
  positions:      ['Woman on top', 'Man on top', '69', 'Doggy'],
  tags:           ['Quick', 'Sleepy', 'Romantic'],
  toys:           ['Dildo', 'Vibrator', 'Butt Plug'],
  soloTags:       ['Quick', 'Sleepy', 'Edging'],
  healthSymptoms: ['Cold', 'Flu', 'Fatigue', 'Headache', 'Nausea', 'Pulled muscle', 'Back pain'],
  refusalTags:    ['Tired', 'Stressed', 'Not in the mood', 'Unwell', 'Argument'],
};

@Injectable({ providedIn: 'root' })
export class TagOptionService {
  private cache = new Map<TagCategory, string[]>();
  private seeded = false;

  constructor(private db: Database) {}

  async seedIfEmpty(): Promise<void> {
    if (this.seeded) return;
    this.seeded = true;
    const count = await this.db.countTagOptions();
    if (count > 0) return;
    const all: TagOption[] = [];
    let t = Date.now();
    for (const [cat, values] of Object.entries(TAG_DEFAULTS) as [TagCategory, string[]][]) {
      for (const value of values) {
        all.push({ id: `${cat}:${value}`, category: cat, value, createdAt: t++ });
      }
    }
    await Promise.all(all.map(o => this.db.putTagOption(o)));
  }

  async getOptions(category: TagCategory): Promise<string[]> {
    if (this.cache.has(category)) return this.cache.get(category)!;
    const stored = await this.db.getTagOptionsByCategory(category);
    const values = stored.map(o => o.value);
    this.cache.set(category, values);
    return values;
  }

  clearCache(): void {
    this.cache.clear();
  }

  ensureOption(category: TagCategory, value: string): void {
    const cached = this.cache.get(category) ?? [];
    if (!cached.includes(value)) cached.push(value);
    this.cache.set(category, cached);
    const id = `${category}:${value}`;
    this.db.putTagOption({ id, category, value, createdAt: Date.now() }).catch(e => console.error('Failed to save tag option:', e));
  }

  async deleteOption(category: TagCategory, value: string): Promise<void> {
    const id = `${category}:${value}`;
    await this.db.deleteTagOption(id);
    const cached = this.cache.get(category);
    if (cached) this.cache.set(category, cached.filter(v => v !== value));
  }

  async getAllByCategory(): Promise<Record<TagCategory, TagOption[]>> {
    const all = await this.db.getAllTagOptions();
    all.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    const result = {} as Record<TagCategory, TagOption[]>;
    for (const cat of Object.keys(TAG_DEFAULTS) as TagCategory[]) {
      result[cat] = [];
    }
    for (const opt of all) {
      result[opt.category]?.push(opt);
    }
    return result;
  }
}
