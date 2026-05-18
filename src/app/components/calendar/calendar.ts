import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '../../services/event';
import { TimerService } from '../../services/timer.service';

interface TimerSegment {
  left: number;   // % of day (0–100)
  width: number;  // % of day (0–100)
  index: number;  // for alternating colour on overlap
}

interface TimerEntry {
  deviceName: string;
  totalMs: number;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  eventCount: number;
  eventTypes: Set<string>;
  timerSegments: TimerSegment[];
  timerEntries: TimerEntry[];
}

@Component({
  selector: 'app-calendar',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class CalendarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);
  private timerService = inject(TimerService);

  today = new Date();
  viewYear = signal(this.today.getFullYear());
  viewMonth = signal(this.today.getMonth());

  private tick = signal(Date.now());
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  monthLabel = computed(() => {
    return new Date(this.viewYear(), this.viewMonth(), 1).toLocaleString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  });

  days = computed<CalendarDay[]>(() => {
    const year = this.viewYear();
    const month = this.viewMonth();
    const events = this.eventService.events();
    const sessions = this.timerService.sessions();
    const active = this.timerService.activeTimers();
    const now = this.tick();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: CalendarDay[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(this.makeDay(new Date(year, month - 1, daysInPrevMonth - i), false, events, sessions, active, now));
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(this.makeDay(new Date(year, month, d), true, events, sessions, active, now));
    }
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells.push(this.makeDay(new Date(year, month + 1, d), false, events, sessions, active, now));
    }

    return cells;
  });

  dayTitle(day: CalendarDay): string {
    const parts: string[] = [];
    for (const type of ['Sex', 'Solo', 'Note', 'Refusal', 'Health']) {
      if (day.eventTypes.has(type)) parts.push(type);
    }
    for (const t of day.timerEntries) {
      parts.push(`${t.deviceName}: ${this.formatDuration(t.totalMs)}`);
    }
    return parts.join('\n');
  }

  formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  private makeDay(
    date: Date,
    inMonth: boolean,
    events: { date: string; type: string }[],
    sessions: { startedAt: number; endedAt: number; deviceName: string }[],
    active: { startedAt: number; deviceName: string }[],
    now: number,
  ): CalendarDay {
    const key = this.toDateKey(date);
    const dayEvents = events.filter(e => e.date.slice(0, 10) === key);

    const dayStart = date.getTime();
    const dayEnd   = dayStart + 86400000;
    const DAY_MS   = 86400000;
    const clamp = (s: number, e: number) => Math.max(0, Math.min(e, dayEnd) - Math.max(s, dayStart));

    const intervals: [number, number][] = [];
    const timerEntries: TimerEntry[] = [];

    for (const s of sessions) {
      if (s.startedAt < dayEnd && s.endedAt > dayStart) {
        intervals.push([Math.max(s.startedAt, dayStart), Math.min(s.endedAt, dayEnd)]);
        timerEntries.push({ deviceName: s.deviceName, totalMs: clamp(s.startedAt, s.endedAt) });
      }
    }
    for (const a of active) {
      if (a.startedAt < dayEnd && now > dayStart) {
        intervals.push([Math.max(a.startedAt, dayStart), Math.min(now, dayEnd)]);
        timerEntries.push({ deviceName: a.deviceName, totalMs: clamp(a.startedAt, now) });
      }
    }

    // Sweep-line: collect all boundary points, then walk each sub-interval
    // counting how many source intervals cover it.
    const points = [...new Set(intervals.flatMap(([s, e]) => [s, e]))].sort((a, b) => a - b);

    const timerSegments: TimerSegment[] = [];
    for (let p = 0; p < points.length - 1; p++) {
      const segStart = points[p];
      const segEnd   = points[p + 1];
      const mid = (segStart + segEnd) / 2;
      const depth = intervals.filter(([s, e]) => s <= mid && mid < e).length;
      if (depth === 0) continue;
      const left  = ((segStart - dayStart) / DAY_MS) * 100;
      const width = ((segEnd - segStart)   / DAY_MS) * 100;
      timerSegments.push({ left, width, index: depth > 1 ? 1 : 0 });
    }

    return {
      date,
      inMonth,
      eventCount: dayEvents.length,
      eventTypes: new Set(dayEvents.map(e => e.type)),
      timerSegments,
      timerEntries,
    };
  }

  ngOnInit(): void {
    this.eventService.loadEvents();
    this.timerService.loadSessions();
    this.tickInterval = setInterval(() => this.tick.set(Date.now()), 10000);

    const year = this.route.snapshot.queryParamMap.get('year');
    const month = this.route.snapshot.queryParamMap.get('month');
    if (year && month !== null) {
      this.viewYear.set(parseInt(year, 10));
      this.viewMonth.set(parseInt(month, 10));
    }
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  prevMonth(): void {
    const m = this.viewMonth();
    if (m === 0) {
      this.viewYear.update(y => y - 1);
      this.viewMonth.set(11);
    } else {
      this.viewMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    const m = this.viewMonth();
    if (m === 11) {
      this.viewYear.update(y => y + 1);
      this.viewMonth.set(0);
    } else {
      this.viewMonth.update(m => m + 1);
    }
  }

  goToToday(): void {
    this.viewYear.set(this.today.getFullYear());
    this.viewMonth.set(this.today.getMonth());
  }

  selectDay(day: CalendarDay): void {
    if (!day.inMonth) return;
    this.router.navigate(['/events'], { queryParams: { date: this.toDateKey(day.date) } });
  }

  isToday(day: CalendarDay): boolean {
    return this.toDateKey(day.date) === this.toDateKey(this.today);
  }

  private toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
