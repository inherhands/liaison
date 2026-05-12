import { Injectable } from '@angular/core';
import { TrackerEvent, Partner, TagOption, TagCategory } from '../models/event.model';
import { TimerDevice, TimerSession } from '../models/timer.model';

@Injectable({
  providedIn: 'root',
})
export class Database {
  private db: IDBDatabase | null = null;
  private dbName = 'liaison-events';
  private eventsStore = 'events';
  private partnersStore = 'partners';
  private tagOptionsStore = 'tagOptions';
  private timerSessionsStore = 'timerSessions';
  private timerDevicesStore = 'timerDevices';
  private dbVersion = 5;
  private initPromise: Promise<void> | null = null;

  private ensureReady(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          if (!db.objectStoreNames.contains(this.eventsStore)) {
            const store = db.createObjectStore(this.eventsStore, { keyPath: 'id' });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('date', 'date', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.partnersStore)) {
            db.createObjectStore(this.partnersStore, { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains(this.tagOptionsStore)) {
            const store = db.createObjectStore(this.tagOptionsStore, { keyPath: 'id' });
            store.createIndex('category', 'category', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.timerSessionsStore)) {
            const store = db.createObjectStore(this.timerSessionsStore, { keyPath: 'id' });
            store.createIndex('deviceId', 'deviceId', { unique: false });
          }

          if (!db.objectStoreNames.contains(this.timerDevicesStore)) {
            db.createObjectStore(this.timerDevicesStore, { keyPath: 'id' });
          }
        };
      });
    }
    return this.initPromise;
  }

  // ── Events ──────────────────────────────────────────────────────────────

  async addEvent(event: TrackerEvent): Promise<string> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readwrite');
    const store = tx.objectStore(this.eventsStore);
    const request = store.add(event);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  async getEvent(id: string): Promise<TrackerEvent | undefined> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readonly');
    const store = tx.objectStore(this.eventsStore);
    const request = store.get(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as TrackerEvent);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllEvents(): Promise<TrackerEvent[]> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readonly');
    const store = tx.objectStore(this.eventsStore);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as TrackerEvent[]);
      request.onerror = () => reject(request.error);
    });
  }

  async updateEvent(event: TrackerEvent): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readwrite');
    const store = tx.objectStore(this.eventsStore);
    const request = store.put(event);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEvent(id: string): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readwrite');
    const store = tx.objectStore(this.eventsStore);
    const request = store.delete(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async queryEventsByType(type: string): Promise<TrackerEvent[]> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readonly');
    const store = tx.objectStore(this.eventsStore);
    const index = store.index('type');
    const request = index.getAll(type);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as TrackerEvent[]);
      request.onerror = () => reject(request.error);
    });
  }

  async queryEventsByDateRange(startDate: string, endDate: string): Promise<TrackerEvent[]> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readonly');
    const store = tx.objectStore(this.eventsStore);
    const index = store.index('date');
    const range = IDBKeyRange.bound(startDate, endDate);
    const request = index.getAll(range);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as TrackerEvent[]);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readwrite');
    const store = tx.objectStore(this.eventsStore);
    const request = store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ── Partners ─────────────────────────────────────────────────────────────

  async addPartner(partner: Partner): Promise<string> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.partnersStore, 'readwrite');
    const store = tx.objectStore(this.partnersStore);
    const request = store.add(partner);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPartners(): Promise<Partner[]> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.partnersStore, 'readonly');
    const store = tx.objectStore(this.partnersStore);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as Partner[]);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePartner(id: string): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.partnersStore, 'readwrite');
    const store = tx.objectStore(this.partnersStore);
    const request = store.delete(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ── Tag Options ───────────────────────────────────────────────────────────

  async getTagOptionsByCategory(category: TagCategory): Promise<TagOption[]> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.tagOptionsStore, 'readonly');
    const store = tx.objectStore(this.tagOptionsStore);
    const index = store.index('category');
    const request = index.getAll(category);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as TagOption[]);
      request.onerror = () => reject(request.error);
    });
  }

  async putTagOption(option: TagOption): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.tagOptionsStore, 'readwrite');
    const store = tx.objectStore(this.tagOptionsStore);
    const request = store.put(option);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTagOptions(): Promise<TagOption[]> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.tagOptionsStore, 'readonly');
    const store = tx.objectStore(this.tagOptionsStore);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as TagOption[]);
      request.onerror = () => reject(request.error);
    });
  }

  async putPartner(partner: Partner): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.partnersStore, 'readwrite');
    const store = tx.objectStore(this.partnersStore);
    const request = store.put(partner);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async putEvent(event: TrackerEvent): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.eventsStore, 'readwrite');
    const store = tx.objectStore(this.eventsStore);
    const request = store.put(event);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearPartners(): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.partnersStore, 'readwrite');
    const store = tx.objectStore(this.partnersStore);
    const request = store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  close(): void {
    this.db?.close();
    this.db = null;
    this.initPromise = null;
  }

  async countTagOptions(): Promise<number> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.tagOptionsStore, 'readonly');
    const store = tx.objectStore(this.tagOptionsStore);
    const request = store.count();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTagOption(id: string): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.tagOptionsStore, 'readwrite');
    const store = tx.objectStore(this.tagOptionsStore);
    const request = store.delete(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearTagOptions(): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.tagOptionsStore, 'readwrite');
    const store = tx.objectStore(this.tagOptionsStore);
    const request = store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ── Timer Devices ─────────────────────────────────────────────────────────

  async putTimerDevice(device: TimerDevice): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerDevicesStore, 'readwrite');
    const store = tx.objectStore(this.timerDevicesStore);
    const request = store.put(device);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTimerDevices(): Promise<TimerDevice[]> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerDevicesStore, 'readonly');
    const store = tx.objectStore(this.timerDevicesStore);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as TimerDevice[]);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTimerDevice(id: string): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerDevicesStore, 'readwrite');
    const store = tx.objectStore(this.timerDevicesStore);
    const request = store.delete(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async countTimerDevices(): Promise<number> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerDevicesStore, 'readonly');
    const store = tx.objectStore(this.timerDevicesStore);
    const request = store.count();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearTimerDevices(): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerDevicesStore, 'readwrite');
    const store = tx.objectStore(this.timerDevicesStore);
    const request = store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ── Timer Sessions ────────────────────────────────────────────────────────

  async addTimerSession(session: TimerSession): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerSessionsStore, 'readwrite');
    const store = tx.objectStore(this.timerSessionsStore);
    const request = store.add(session);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async putTimerSession(session: TimerSession): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerSessionsStore, 'readwrite');
    const store = tx.objectStore(this.timerSessionsStore);
    const request = store.put(session);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAllTimerSessions(): Promise<TimerSession[]> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerSessionsStore, 'readonly');
    const store = tx.objectStore(this.timerSessionsStore);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as TimerSession[]);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTimerSession(id: string): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerSessionsStore, 'readwrite');
    const store = tx.objectStore(this.timerSessionsStore);
    const request = store.delete(id);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearTimerSessions(): Promise<void> {
    await this.ensureReady();
    const tx = this.db!.transaction(this.timerSessionsStore, 'readwrite');
    const store = tx.objectStore(this.timerSessionsStore);
    const request = store.clear();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
