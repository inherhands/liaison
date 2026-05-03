import { Component, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { PartnerService } from '../../services/partner';
import { EventService } from '../../services/event';
import { Partner, SexEvent, RefusalEvent } from '../../models/event.model';

interface PartnerCard {
  partner: Partner;
  lastSexDaysAgo: number | null;
  lastSexLabel: string | null;
  sexThisYear: number;
  refusalsThisYear: number;
}

@Component({
  selector: 'app-partners',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './partners.html',
  styleUrl: './partners.css',
})
export class PartnersComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private eventService = inject(EventService);
  private router = inject(Router);

  partners = this.partnerService.partners;
  newName = '';

  partnerCards = computed<PartnerCard[]>(() => {
    const partners = this.partnerService.partners();
    const events = this.eventService.events();
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

    return partners.map(partner => {
      const sexEvents = events
        .filter(e => e.type === 'Sex' && (e as SexEvent).partner === partner.name)
        .map(e => e as SexEvent)
        .sort((a, b) => b.date.localeCompare(a.date));

      const refusalEvents = events.filter(
        e => e.type === 'Refusal' && (e as RefusalEvent).partner === partner.name
      );

      const lastSex = sexEvents[0];
      let lastSexDaysAgo: number | null = null;
      let lastSexLabel: string | null = null;

      if (lastSex) {
        const diff = now.getTime() - new Date(lastSex.date).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        lastSexDaysAgo = days;
        if (days === 0) lastSexLabel = 'Today';
        else if (days === 1) lastSexLabel = 'Yesterday';
        else if (days < 7) lastSexLabel = `${days} days ago`;
        else if (days < 14) lastSexLabel = '1 week ago';
        else if (days < 30) lastSexLabel = `${Math.floor(days / 7)} weeks ago`;
        else if (days < 60) lastSexLabel = '1 month ago';
        else if (days < 365) lastSexLabel = `${Math.floor(days / 30)} months ago`;
        else if (days < 730) lastSexLabel = '1 year ago';
        else lastSexLabel = `${Math.floor(days / 365)} years ago`;
      }

      const sexThisYear = sexEvents.filter(e => e.date >= yearStart).length;
      const refusalsThisYear = refusalEvents.filter(e => e.date >= yearStart).length;

      return { partner, lastSexDaysAgo, lastSexLabel, sexThisYear, refusalsThisYear };
    });
  });

  ngOnInit(): void {
    this.partnerService.loadPartners();
    this.eventService.loadEvents();
  }

  sexIcon(partner: Partner): string {
    if (partner.sex === 'female') return 'female';
    if (partner.sex === 'male') return 'male';
    return 'person';
  }

  addPartner(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.newName = '';
    this.partnerService.createPartner(name);
  }

  editPartner(id: string): void {
    this.router.navigate(['/edit-partner', id]);
  }

  deletePartner(id: string): void {
    const partner = this.partners().find(p => p.id === id);
    if (!partner) return;

    const events = this.eventService.events();
    const count = events.filter(e =>
      (e.type === 'Sex' || e.type === 'Refusal') &&
      (e as SexEvent | RefusalEvent).partner === partner.name
    ).length;

    const warning = count > 0
      ? `${partner.name} has ${count} associated event${count === 1 ? '' : 's'}. Those events will not be deleted but will lose their partner reference.\n\n`
      : '';

    if (confirm(`${warning}Remove partner "${partner.name}"?`)) {
      this.partnerService.deletePartner(id);
    }
  }
}
