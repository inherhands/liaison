import { Injectable, signal } from '@angular/core';
import { Database } from './database';
import { TrackerEvent } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  readonly events = signal<TrackerEvent[]>([]);

  constructor(private db: Database) {}

  async getEvent(id: string): Promise<TrackerEvent | undefined> {
    return this.db.getEvent(id);
  }

  async createEvent(event: TrackerEvent): Promise<void> {
    this.events.update(list => [event, ...list].sort((a, b) => b.date.localeCompare(a.date)));
    this.db.addEvent(event).catch(e => console.error('Failed to save event:', e));
  }

  async loadEvents(): Promise<void> {
    const events = await this.db.getAllEvents();
    events.sort((a, b) => b.date.localeCompare(a.date));
    this.events.set(events);
  }

  async updateEvent(event: TrackerEvent): Promise<void> {
    this.events.update(list => list.map(e => e.id === event.id ? event : e).sort((a, b) => b.date.localeCompare(a.date)));
    this.db.updateEvent(event).catch(e => console.error('Failed to update event:', e));
  }

  async deleteEvent(id: string): Promise<void> {
    this.events.update(list => list.filter(e => e.id !== id));
    this.db.deleteEvent(id).catch(e => console.error('Failed to delete event:', e));
  }

  async getEventsByType(type: string): Promise<TrackerEvent[]> {
    return this.db.queryEventsByType(type);
  }

  async getEventsByDateRange(startDate: string, endDate: string): Promise<TrackerEvent[]> {
    return this.db.queryEventsByDateRange(startDate, endDate);
  }
}
