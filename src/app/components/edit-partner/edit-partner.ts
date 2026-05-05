import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { PartnerService } from '../../services/partner';
import { Partner } from '../../models/event.model';

@Component({
  selector: 'app-edit-partner',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './edit-partner.html',
  styleUrl: './edit-partner.css',
})
export class EditPartnerComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  name = '';
  sex: 'male' | 'female' | 'other' | '' = '';
  isNew = false;
  private partnerId = '';

  ngOnInit(): void {
    this.partnerService.loadPartners();
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isNew = true;
      return;
    }
    this.partnerId = id;
    const partner = this.partnerService.partners().find(p => p.id === id);
    if (!partner) { this.router.navigate(['/partners']); return; }
    this.name = partner.name;
    this.sex = partner.sex ?? '';
  }

  save(): void {
    const name = this.name.trim();
    if (!name) return;
    const sex = this.sex || undefined;
    if (this.isNew) {
      this.partnerService.createPartner(name, sex);
    } else {
      const updated: Partner = { id: this.partnerId, name, ...(sex ? { sex } : {}) };
      this.partnerService.updatePartner(updated);
    }
    this.router.navigate(['/partners']);
  }

  cancel(): void {
    this.router.navigate(['/partners']);
  }
}
