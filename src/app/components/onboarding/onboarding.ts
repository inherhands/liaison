import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OnboardingService } from '../../services/onboarding';
import { PartnerService } from '../../services/partner';
import { TagOptionService } from '../../services/tag-option';

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class OnboardingComponent {
  private onboardingService = inject(OnboardingService);
  private partnerService = inject(PartnerService);
  private tagOptionService = inject(TagOptionService);

  step = signal(0);
  partnerName = '';
  partnerAdded = signal(false);

  next(): void {
    if (this.step() === 0) this.tagOptionService.seedIfEmpty();
    this.step.update(s => s + 1);
  }

  addPartner(): void {
    const name = this.partnerName.trim();
    if (!name) return;
    this.partnerService.createPartner(name);
    this.partnerName = '';
    this.partnerAdded.set(true);
  }

  finish(): void {
    this.tagOptionService.seedIfEmpty();
    this.onboardingService.complete();
  }

  skip(): void {
    this.tagOptionService.seedIfEmpty();
    this.onboardingService.complete();
  }
}
