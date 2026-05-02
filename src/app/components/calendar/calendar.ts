import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '../../services/event';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  eventCount: number;
  eventTypes: Set<string>;
}

@Component({
  selector: 'app-calendar',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class CalendarComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private eventService = inject(EventService);

  today = new Date();
  viewYear = signal(this.today.getFullYear());
  viewMonth = signal(this.today.getMonth());

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

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: CalendarDay[] = [];

    // Leading days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push(this.makeDay(new Date(year, month - 1, daysInPrevMonth - i), false, events));
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(this.makeDay(new Date(year, month, d), true, events));
    }

    // Trailing days to complete the last row
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      cells.push(this.makeDay(new Date(year, month + 1, d), false, events));
    }

    return cells;
  });

  private makeDay(date: Date, inMonth: boolean, events: { date: string; type: string }[]): CalendarDay {
    const key = this.toDateKey(date);
    const dayEvents = events.filter(e => e.date.slice(0, 10) === key);
    return {
      date,
      inMonth,
      eventCount: dayEvents.length,
      eventTypes: new Set(dayEvents.map(e => e.type)),
    };
  }

  ngOnInit(): void {
    this.eventService.loadEvents();
    
    // Check for year and month query parameters (passed from event-list)
    const year = this.route.snapshot.queryParamMap.get('year');
    const month = this.route.snapshot.queryParamMap.get('month');
    
    if (year && month !== null) {
      this.viewYear.set(parseInt(year, 10));
      this.viewMonth.set(parseInt(month, 10));
    }
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
