import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '../../services/event';
import { PartnerService } from '../../services/partner';
import { TimerService } from '../../services/timer.service';
import { TrackerEvent, SexEvent, NoteEvent, SoloEvent, RefusalEvent, HealthEvent } from '../../models/event.model';
import { TimerSession, ActiveTimer } from '../../models/timer.model';

@Component({
  selector: 'app-event-list',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
  private partnerService = inject(PartnerService);
  private timerService = inject(TimerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  dateFilter = signal<string | null>(null);

  events = computed(() => {
    const filter = this.dateFilter();
    const all = this.eventService.events();
    if (!filter) return all;
    return all.filter(e => e.date.slice(0, 10) === filter);
  });

  dayTimers = computed<(TimerSession | ActiveTimer)[]>(() => {
    const filter = this.dateFilter();
    if (!filter) return [];
    const dayStart = new Date(filter + 'T00:00:00').getTime();
    const dayEnd   = dayStart + 86400000;
    const now      = Date.now();
    const sessions = this.timerService.sessions().filter(s => s.startedAt < dayEnd && s.endedAt > dayStart);
    const active   = this.timerService.activeTimers().filter(a => a.startedAt < dayEnd && now > dayStart);
    return [...sessions, ...active];
  });

  isActive(t: TimerSession | ActiveTimer): t is ActiveTimer {
    return !('endedAt' in t);
  }

timerStartLabel(t: TimerSession | ActiveTimer): string {
    return new Date(t.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  timerEndLabel(t: TimerSession | ActiveTimer): string {
    if (this.isActive(t)) return 'Ongoing...';
    return new Date((t as TimerSession).endedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  timerTotalDuration(t: TimerSession | ActiveTimer): string {
    const end = this.isActive(t) ? Date.now() : (t as TimerSession).endedAt;
    return this.formatDuration(end - t.startedAt);
  }

  timerDayDuration(t: TimerSession | ActiveTimer): string {
    const dayFilter = this.dateFilter();
    if (!dayFilter) return '';
    const dayStart = new Date(dayFilter + 'T00:00:00').getTime();
    const dayEnd   = dayStart + 86400000;
    const now      = Date.now();
    const start    = Math.max(t.startedAt, dayStart);
    const end      = Math.min(this.isActive(t) ? now : (t as TimerSession).endedAt, dayEnd);
    return this.formatDuration(Math.max(0, end - start));
  }

  isToday(): boolean {
    const filter = this.dateFilter();
    if (!filter) return false;
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return filter === key;
  }

  formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours   = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  ngOnInit(): void {
    this.eventService.loadEvents();
    this.partnerService.loadPartners();
    this.timerService.loadSessions();
    const date = this.route.snapshot.queryParamMap.get('date');
    this.dateFilter.set(date);
  }

  get filterLabel(): string {
    const f = this.dateFilter();
    if (!f) return '';
    return new Date(f + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' });
  }

  clearFilter(): void {
    this.dateFilter.set(null);
    this.router.navigate(['/events']);
  }

  backToCalendar(): void {
    const filter = this.dateFilter();
    if (filter) {
      const date = new Date(filter + 'T00:00:00');
      this.router.navigate(['/calendar'], {
        queryParams: {
          year: date.getFullYear(),
          month: date.getMonth()
        }
      });
    } else {
      this.router.navigate(['/calendar']);
    }
  }

  asSex(e: TrackerEvent): SexEvent { return e as SexEvent; }
  asNote(e: TrackerEvent): NoteEvent { return e as NoteEvent; }
  asSolo(e: TrackerEvent): SoloEvent { const s = e as SoloEvent; return { ...s, tags: s.tags ?? [] }; }
  asRefusal(e: TrackerEvent): RefusalEvent { const r = e as RefusalEvent; return { ...r, tags: r.tags ?? [] }; }
  asHealth(e: TrackerEvent): HealthEvent { return e as HealthEvent; }

  partnerIcon(name: string, refused = false): string {
    const partner = this.partnerService.partners().find(p => p.name === name);
    if (refused) {
      if (partner?.sex === 'female') return 'female_off';
      if (partner?.sex === 'male') return 'male_off';
      return 'person_off';
    }
    if (partner?.sex === 'female') return 'female';
    if (partner?.sex === 'male') return 'male';
    return 'person';
  }

  partnerIconClass(name: string): string {
    const partner = this.partnerService.partners().find(p => p.name === name);
    if (partner?.sex === 'female') return 'sex-icon-female';
    if (partner?.sex === 'male') return 'sex-icon-male';
    if (partner?.sex === 'other') return 'sex-icon-other';
    return 'sex-icon-none';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  editEvent(id: string): void {
    const params: any = {};
    const filter = this.dateFilter();
    if (filter) {
      params.date = filter;
      const date = new Date(filter + 'T00:00:00');
      params.year = date.getFullYear();
      params.month = date.getMonth();
    }
    this.router.navigate(['/edit-event', id], { queryParams: params });
  }

  deleteEvent(id: string): void {
    if (confirm('Delete this event?')) {
      this.eventService.deleteEvent(id);
    }
  }
}
