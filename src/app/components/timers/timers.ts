import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { TimerService } from '../../services/timer.service';
import { TimerDeviceService } from '../../services/timer-device.service';
import { ActiveTimer, TimerDevice, TimerSession } from '../../models/timer.model';

interface EditState {
  id: string;
  kind: 'active' | 'session';
  startDate: string;   // YYYY-MM-DD
  startTime: string;   // HH:MM
  endDate: string;     // YYYY-MM-DD (session only)
  endTime: string;     // HH:MM (session only)
}

@Component({
  selector: 'app-timers',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatDividerModule],
  templateUrl: './timers.html',
  styleUrl: './timers.css',
})
export class TimersComponent implements OnInit, OnDestroy {
  protected readonly timerService = inject(TimerService);
  protected readonly deviceService = inject(TimerDeviceService);

  protected showNewTimer = signal(false);
  protected selectedDevice = signal<TimerDevice | null>(null);
  protected newTimerNotes = signal('');
  protected tick = signal(Date.now());
  protected editState = signal<EditState | null>(null);

  private tickInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.tickInterval = setInterval(() => this.tick.set(Date.now()), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  protected selectDevice(device: TimerDevice): void {
    this.selectedDevice.set(
      this.selectedDevice()?.id === device.id ? null : device
    );
  }

  protected startTimer(): void {
    const device = this.selectedDevice();
    if (!device) return;
    this.timerService.startTimer(device, this.newTimerNotes() || undefined);
    this.selectedDevice.set(null);
    this.newTimerNotes.set('');
    this.showNewTimer.set(false);
  }

  protected async stopTimer(id: string): Promise<void> {
    await this.timerService.stopTimer(id);
  }

  protected elapsed(startedAt: number): string {
    const ms = this.tick() - startedAt;
    return formatDuration(ms);
  }

  protected formatSession(durationMs: number): string {
    return formatDuration(durationMs);
  }

  protected formatDate(ms: number): string {
    return new Date(ms).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }

  protected async deleteSession(id: string): Promise<void> {
    await this.timerService.deleteSession(id);
  }

  protected cancelNewTimer(): void {
    this.showNewTimer.set(false);
    this.selectedDevice.set(null);
    this.newTimerNotes.set('');
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  protected openEditActive(timer: ActiveTimer): void {
    const start = new Date(timer.startedAt);
    this.editState.set({
      id: timer.id,
      kind: 'active',
      startDate: toDateInput(start),
      startTime: toTimeInput(start),
      endDate: '',
      endTime: '',
    });
  }

  protected openEditSession(session: TimerSession): void {
    const start = new Date(session.startedAt);
    const end = new Date(session.endedAt);
    this.editState.set({
      id: session.id,
      kind: 'session',
      startDate: toDateInput(start),
      startTime: toTimeInput(start),
      endDate: toDateInput(end),
      endTime: toTimeInput(end),
    });
  }

  protected cancelEdit(): void {
    this.editState.set(null);
  }

  protected async saveEdit(): Promise<void> {
    const state = this.editState();
    if (!state) return;

    const startMs = parseDateTimeMs(state.startDate, state.startTime);
    if (isNaN(startMs)) return;

    if (state.kind === 'active') {
      const timer = this.timerService.activeTimers().find(t => t.id === state.id);
      if (!timer) return;
      this.timerService.updateActiveTimer({ ...timer, startedAt: startMs });
    } else {
      const session = this.timerService.sessions().find(s => s.id === state.id);
      if (!session) return;
      const endMs = parseDateTimeMs(state.endDate, state.endTime);
      if (isNaN(endMs) || endMs <= startMs) return;
      const updated: TimerSession = {
        ...session,
        startedAt: startMs,
        endedAt: endMs,
        durationMs: endMs - startMs,
      };
      await this.timerService.updateSession(updated);
    }

    this.editState.set(null);
  }

  protected editEndInvalid(): boolean {
    const state = this.editState();
    if (!state || state.kind !== 'session') return false;
    const startMs = parseDateTimeMs(state.startDate, state.startTime);
    const endMs = parseDateTimeMs(state.endDate, state.endTime);
    return !isNaN(startMs) && !isNaN(endMs) && endMs <= startMs;
  }
}

function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInput(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseDateTimeMs(date: string, time: string): number {
  if (!date || !time) return NaN;
  return new Date(`${date}T${time}`).getTime();
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
