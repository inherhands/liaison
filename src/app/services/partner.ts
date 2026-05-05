import { Injectable, signal } from '@angular/core';
import { Database } from './database';
import { Partner } from '../models/event.model';
import { generateId } from '../utils/uuid';

@Injectable({
  providedIn: 'root',
})
export class PartnerService {
  readonly partners = signal<Partner[]>([]);

  constructor(private db: Database) {}

  async loadPartners(): Promise<void> {
    const partners = await this.db.getAllPartners();
    this.partners.set(partners);
  }

  createPartner(name: string, sex?: Partner['sex']): string {
    const id = generateId();
    const partner: Partner = { id, name, ...(sex ? { sex } : {}) };
    this.partners.update(list => [...list, partner]);
    this.db.addPartner(partner).catch(e => console.error('Failed to save partner:', e));
    return id;
  }

  updatePartner(partner: Partner): void {
    this.partners.update(list => list.map(p => p.id === partner.id ? partner : p));
    this.db.putPartner(partner).catch(e => console.error('Failed to update partner:', e));
  }

  deletePartner(id: string): void {
    this.partners.update(list => list.filter(p => p.id !== id));
    this.db.deletePartner(id).catch(e => console.error('Failed to delete partner:', e));
  }
}
