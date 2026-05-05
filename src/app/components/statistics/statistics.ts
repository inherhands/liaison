import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '../../services/event';
import { SexEvent, SoloEvent } from '../../models/event.model';

type EventType = 'Sex' | 'Solo' | 'Note' | 'Refusal' | 'Health';
const ALL_TYPES: EventType[] = ['Sex', 'Solo', 'Note', 'Refusal', 'Health'];

interface MonthBar {
  label: string;
  sex: number;
  solo: number;
  note: number;
  refusal: number;
  health: number;
  total: number;
}

interface StatRow {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-statistics',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.css',
})
export class StatisticsComponent implements OnInit {
  private eventService = inject(EventService);

  MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  ALL_TYPES = ALL_TYPES;

  today = new Date();
  viewYear = signal(this.today.getFullYear());

  // Set of active type filters; empty set = All
  activeFilters = signal<Set<EventType>>(new Set());

  isAll = computed(() => this.activeFilters().size === 0);

  isActive(type: EventType): boolean {
    return this.activeFilters().size === 0 || this.activeFilters().has(type);
  }

  toggleFilter(type: EventType): void {
    const cur = new Set(this.activeFilters());
    if (cur.has(type)) {
      cur.delete(type);
    } else {
      cur.add(type);
    }
    this.activeFilters.set(cur);
  }

  selectAll(): void {
    this.activeFilters.set(new Set());
  }

  yearEvents = computed(() => {
    const year = this.viewYear();
    return this.eventService.events().filter(e => new Date(e.date).getFullYear() === year);
  });

  filteredEvents = computed(() => {
    const filters = this.activeFilters();
    const events = this.yearEvents();
    if (filters.size === 0) return events;
    return events.filter(e => filters.has(e.type as EventType));
  });

  monthBars = computed<MonthBar[]>(() => {
    const events = this.yearEvents();
    const filters = this.activeFilters();
    return this.MONTH_NAMES.map((label, m) => {
      const month = events.filter(e => new Date(e.date).getMonth() === m);
      const sex     = month.filter(e => e.type === 'Sex').length;
      const solo    = month.filter(e => e.type === 'Solo').length;
      const note    = month.filter(e => e.type === 'Note').length;
      const refusal = month.filter(e => e.type === 'Refusal').length;
      const health  = month.filter(e => e.type === 'Health').length;
      const total = (filters.size === 0 || filters.has('Sex')     ? sex     : 0)
                  + (filters.size === 0 || filters.has('Solo')    ? solo    : 0)
                  + (filters.size === 0 || filters.has('Note')    ? note    : 0)
                  + (filters.size === 0 || filters.has('Refusal') ? refusal : 0)
                  + (filters.size === 0 || filters.has('Health')  ? health  : 0);
      return { label, sex, solo, note, refusal, health, total };
    });
  });

  maxBarValue = computed(() => {
    const filters = this.activeFilters();
    return Math.max(...this.monthBars().map(b => {
      return (filters.size === 0 || filters.has('Sex')     ? b.sex     : 0)
           + (filters.size === 0 || filters.has('Solo')    ? b.solo    : 0)
           + (filters.size === 0 || filters.has('Note')    ? b.note    : 0)
           + (filters.size === 0 || filters.has('Refusal') ? b.refusal : 0)
           + (filters.size === 0 || filters.has('Health')  ? b.health  : 0);
    }), 1);
  });

  showSeg(type: EventType): boolean {
    const f = this.activeFilters();
    return f.size === 0 || f.has(type);
  }

  stats = computed<StatRow[]>(() => {
    const year = this.viewYear();
    const all = this.yearEvents();
    const sexEvents  = all.filter(e => e.type === 'Sex')  as SexEvent[];
    const soloEvents = all.filter(e => e.type === 'Solo') as SoloEvent[];

    const totalSex  = sexEvents.length;
    const totalSolo = soloEvents.length;

    const myOrgasms = sexEvents.reduce((s, e) => s + e.myOrgasms, 0)
                    + soloEvents.reduce((s, e) => s + e.myOrgasms, 0);
    const partnerOrgasms = sexEvents.reduce((s, e) => s + e.partnerOrgasms, 0);
    const totalCount     = sexEvents.reduce((s, e) => s + e.count, 0);

    const yearStart  = new Date(year, 0, 1);
    const yearEnd    = new Date(year, 11, 31);
    const effectiveEnd = year === this.today.getFullYear() ? this.today : yearEnd;
    const elapsedMs  = effectiveEnd.getTime() - yearStart.getTime();
    const elapsedWeeks  = Math.max(elapsedMs / (7 * 86400000), 1);
    const elapsedMonths = Math.max(elapsedMs / (30.4375 * 86400000), 1);

    const avgSexPerWeek  = totalSex > 0 ? (totalSex / elapsedWeeks).toFixed(1)  : '0';
    const avgSexPerMonth = totalSex > 0 ? (totalSex / elapsedMonths).toFixed(1) : '0';

    const favPartner  = this.topItem(sexEvents.map(e => e.partner));
    const favPosition = this.topItem(sexEvents.flatMap(e => e.positions));
    const favSexType  = this.topItem(sexEvents.flatMap(e => e.sexType));
    const favToy      = this.topItem([...sexEvents.flatMap(e => e.toys), ...soloEvents.flatMap(e => e.toys)]);
    const favTag      = this.topItem(sexEvents.flatMap(e => e.tags));

    const initiationMe      = sexEvents.filter(e => e.initiation === 'Me').length;
    const initiationPartner = sexEvents.filter(e => e.initiation === 'Partner').length;
    const initiationBoth    = sexEvents.filter(e => e.initiation === 'Both').length;
    const initiationSummary = totalSex > 0
      ? `Me ${initiationMe}, Partner ${initiationPartner}, Both ${initiationBoth}` : '—';

    const longestStreak = this.longestConsecutiveDays(all.map(e => e.date.slice(0, 10)));

    const allSexEvents = this.eventService.events().filter(e => e.type === 'Sex') as SexEvent[];
    const prevYearLastSex = allSexEvents
      .filter(e => new Date(e.date).getFullYear() < year)
      .map(e => e.date.slice(0, 10))
      .sort()
      .at(-1);
    const sexDates = sexEvents.map(e => e.date.slice(0, 10));
    if (prevYearLastSex) sexDates.push(prevYearLastSex);
    const dryStreak = this.longestGap(sexDates);

    return [
      { label: 'Total sex sessions',             value: totalSex },
      { label: 'Total solo sessions',            value: totalSolo },
      { label: 'Total session count (sex × count)', value: totalCount },
      { label: 'My orgasms (sex + solo)',         value: myOrgasms },
      { label: 'Partner orgasms',                value: partnerOrgasms },
      { label: 'Avg sex sessions / week',        value: avgSexPerWeek },
      { label: 'Avg sex sessions / month',       value: avgSexPerMonth },
      { label: 'Initiation breakdown',           value: initiationSummary },
      { label: 'Favourite partner',              value: favPartner  ?? '—' },
      { label: 'Favourite position',             value: favPosition ?? '—' },
      { label: 'Favourite sex type',             value: favSexType  ?? '—' },
      { label: 'Favourite toy',                  value: favToy      ?? '—' },
      { label: 'Favourite tag',                  value: favTag      ?? '—' },
      { label: 'Longest activity streak (days)', value: longestStreak },
      { label: 'Longest sex gap (days)',         value: dryStreak ?? '—' },
    ];
  });

  ngOnInit(): void {
    this.eventService.loadEvents();
  }

  prevYear(): void { this.viewYear.update(y => y - 1); }
  nextYear(): void { this.viewYear.update(y => y + 1); }

  barSegmentPct(count: number): number {
    return (count / this.maxBarValue()) * 100;
  }

  private topItem(items: string[]): string | null {
    if (items.length === 0) return null;
    const freq = new Map<string, number>();
    for (const item of items) freq.set(item, (freq.get(item) ?? 0) + 1);
    return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  private longestConsecutiveDays(dates: string[]): number {
    if (dates.length === 0) return 0;
    const unique = [...new Set(dates)].sort();
    let max = 1, cur = 1;
    for (let i = 1; i < unique.length; i++) {
      const diff = (new Date(unique[i]).getTime() - new Date(unique[i - 1]).getTime()) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
      if (cur > max) max = cur;
    }
    return max;
  }

  private longestGap(dates: string[]): number | null {
    if (dates.length < 2) return null;
    const sorted = [...new Set(dates)].sort();
    let max = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
      if (diff > max) max = diff;
    }
    return Math.round(max);
  }
}
