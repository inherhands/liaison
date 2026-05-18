import { Injectable, signal } from '@angular/core';
import { Database } from './database';
import { TimerDevice } from '../models/timer.model';
import { generateId } from '../utils/uuid';

const DEVICE_DEFAULTS = ['Chastity cage', 'Butt plug'];

@Injectable({ providedIn: 'root' })
export class TimerDeviceService {
  readonly devices = signal<TimerDevice[]>([]);
  private seedPromise: Promise<void> | null = null;

  constructor(private db: Database) {}

  seedIfEmpty(): Promise<void> {
    if (!this.seedPromise) {
      this.seedPromise = this._seed();
    }
    return this.seedPromise;
  }

  private async _seed(): Promise<void> {
    const count = await this.db.countTimerDevices();
    if (count === 0) {
      let t = Date.now();
      for (const name of DEVICE_DEFAULTS) {
        const device: TimerDevice = { id: generateId(), name, createdAt: t++ };
        await this.db.putTimerDevice(device);
      }
    }
    await this._load();
  }

  async load(): Promise<void> {
    if (this.seedPromise) await this.seedPromise;
    await this._load();
  }

  private async _load(): Promise<void> {
    const all = await this.db.getAllTimerDevices();
    all.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
    this.devices.set(all);
  }

  async addDevice(name: string): Promise<void> {
    const device: TimerDevice = { id: generateId(), name: name.trim(), createdAt: Date.now() };
    await this.db.putTimerDevice(device);
    this.devices.update(d => [...d, device]);
  }

  async deleteDevice(id: string): Promise<void> {
    await this.db.deleteTimerDevice(id);
    this.devices.update(d => d.filter(dev => dev.id !== id));
  }
}
