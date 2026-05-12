import { Injectable, signal } from '@angular/core';
import { Database } from './database';
import { ActiveTimer, TimerDevice, TimerSession } from '../models/timer.model';
import { generateId } from '../utils/uuid';

const ACTIVE_TIMERS_KEY = 'active-timers';

@Injectable({ providedIn: 'root' })
export class TimerService {
  readonly activeTimers = signal<ActiveTimer[]>([]);
  readonly sessions = signal<TimerSession[]>([]);

  constructor(private db: Database) {
    this.loadActiveFromStorage();
  }

  private loadActiveFromStorage(): void {
    try {
      const raw = localStorage.getItem(ACTIVE_TIMERS_KEY);
      if (raw) this.activeTimers.set(JSON.parse(raw));
    } catch {
      this.activeTimers.set([]);
    }
  }

  private persistActive(): void {
    localStorage.setItem(ACTIVE_TIMERS_KEY, JSON.stringify(this.activeTimers()));
  }

  startTimer(device: TimerDevice, notes?: string): void {
    const timer: ActiveTimer = {
      id: generateId(),
      deviceId: device.id,
      deviceName: device.name,
      startedAt: Date.now(),
      notes,
    };
    this.activeTimers.update(ts => [...ts, timer]);
    this.persistActive();
  }

  async stopTimer(id: string): Promise<void> {
    const timer = this.activeTimers().find(t => t.id === id);
    if (!timer) return;

    const endedAt = Date.now();
    const session: TimerSession = {
      id: generateId(),
      deviceId: timer.deviceId,
      deviceName: timer.deviceName,
      startedAt: timer.startedAt,
      endedAt,
      durationMs: endedAt - timer.startedAt,
      notes: timer.notes,
    };

    await this.db.addTimerSession(session);
    this.sessions.update(s => [session, ...s]);
    this.activeTimers.update(ts => ts.filter(t => t.id !== id));
    this.persistActive();
  }

  async loadSessions(): Promise<void> {
    const all = await this.db.getAllTimerSessions();
    all.sort((a, b) => b.endedAt - a.endedAt);
    this.sessions.set(all);
  }

  async deleteSession(id: string): Promise<void> {
    await this.db.deleteTimerSession(id);
    this.sessions.update(s => s.filter(session => session.id !== id));
  }

  async updateSession(updated: TimerSession): Promise<void> {
    await this.db.putTimerSession(updated);
    this.sessions.update(s =>
      s.map(session => session.id === updated.id ? updated : session)
       .sort((a, b) => b.endedAt - a.endedAt)
    );
  }

  updateActiveTimer(updated: ActiveTimer): void {
    this.activeTimers.update(ts => ts.map(t => t.id === updated.id ? updated : t));
    this.persistActive();
  }

  restoreActiveTimers(timers: ActiveTimer[]): void {
    this.activeTimers.set(timers);
    this.persistActive();
  }

  clearActiveTimers(): void {
    this.activeTimers.set([]);
    localStorage.removeItem(ACTIVE_TIMERS_KEY);
  }
}
