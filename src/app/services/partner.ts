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

  createPartner(name: string): string {
    const id = generateId();
    const partner: Partner = { id, name };
    this.partners.update(list => [...list, partner]);
    this.db.addPartner(partner).catch(e => console.error('Failed to save partner:', e));
    return id;
  }

  deletePartner(id: string): void {
    this.partners.update(list => list.filter(p => p.id !== id));
    this.db.deletePartner(id).catch(e => console.error('Failed to delete partner:', e));
  }
}
