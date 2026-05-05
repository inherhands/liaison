import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '../../services/event';
import { PartnerService } from '../../services/partner';
import { TrackerEvent, SexEvent, NoteEvent, SoloEvent, RefusalEvent, HealthEvent } from '../../models/event.model';

@Component({
  selector: 'app-event-list',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
  private partnerService = inject(PartnerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  dateFilter = signal<string | null>(null);

  events = computed(() => {
    const filter = this.dateFilter();
    const all = this.eventService.events();
    if (!filter) return all;
    return all.filter(e => e.date.slice(0, 10) === filter);
  });

  ngOnInit(): void {
    this.eventService.loadEvents();
    this.partnerService.loadPartners();
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
