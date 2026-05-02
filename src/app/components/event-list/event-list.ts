import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '../../services/event';
import { TrackerEvent, SexEvent, NoteEvent, SoloEvent, RefusalEvent } from '../../models/event.model';

@Component({
  selector: 'app-event-list',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './event-list.html',
  styleUrl: './event-list.css',
})
export class EventListComponent implements OnInit {
  private eventService = inject(EventService);
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
    this.router.navigate(['/calendar']);
  }

  asSex(e: TrackerEvent): SexEvent { return e as SexEvent; }
  asNote(e: TrackerEvent): NoteEvent { return e as NoteEvent; }
  asSolo(e: TrackerEvent): SoloEvent { const s = e as SoloEvent; return { ...s, tags: s.tags ?? [] }; }
  asRefusal(e: TrackerEvent): RefusalEvent { return e as RefusalEvent; }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  editEvent(id: string): void {
    this.router.navigate(['/edit-event', id]);
  }

  deleteEvent(id: string): void {
    if (confirm('Delete this event?')) {
      this.eventService.deleteEvent(id);
    }
  }
}
