import { Injectable } from '@angular/core';
import { Database } from './database';
import { TagCategory, TagOption } from '../models/event.model';

const DEFAULTS: Record<TagCategory, string[]> = {
  sexType:   ['Vaginal', 'Anal'],
  positions: ['Woman on top', 'Man on top', '69', 'Doggy'],
  tags:      ['Sleepy', 'Quick', 'Romantic'],
  toys:      ['Dildo', 'Vibrator', 'Butt Plug'],
  soloToys:  ['Dildo', 'Vibrator', 'Butt Plug'],
  soloTags:  ['Quick', 'Sleepy', 'Edging'],
};

@Injectable({ providedIn: 'root' })
export class TagOptionService {
  private cache = new Map<TagCategory, string[]>();

  constructor(private db: Database) {}

  async getOptions(category: TagCategory): Promise<string[]> {
    if (this.cache.has(category)) return this.cache.get(category)!;

    const stored = await this.db.getTagOptionsByCategory(category);
    const storedValues = stored.map(o => o.value);
    const all = [...DEFAULTS[category]];
    for (const v of storedValues) {
      if (!all.includes(v)) all.push(v);
    }
    this.cache.set(category, all);
    return all;
  }

  clearCache(): void {
    this.cache.clear();
  }

  ensureOption(category: TagCategory, value: string): void {
    const cached = this.cache.get(category) ?? [...DEFAULTS[category]];
    if (!cached.includes(value)) cached.push(value);
    this.cache.set(category, cached);

    const id = `${category}:${value}`;
    const option: TagOption = { id, category, value };
    this.db.putTagOption(option).catch(e => console.error('Failed to save tag option:', e));
  }
}
