import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { PartnerService } from '../../services/partner';
import { EventService } from '../../services/event';
import { SexEvent, RefusalEvent } from '../../models/event.model';

@Component({
  selector: 'app-partners',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
  ],
  templateUrl: './partners.html',
  styleUrl: './partners.css',
})
export class PartnersComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private eventService = inject(EventService);
  partners = this.partnerService.partners;
  newName = '';

  ngOnInit(): void {
    this.partnerService.loadPartners();
    this.eventService.loadEvents();
  }

  addPartner(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.newName = '';
    this.partnerService.createPartner(name);
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
