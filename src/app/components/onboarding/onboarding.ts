import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { OnboardingService } from '../../services/onboarding';
import { PartnerService } from '../../services/partner';
import { TagOptionService } from '../../services/tag-option';
import { TimerDeviceService } from '../../services/timer-device.service';
import { TimerService } from '../../services/timer.service';
import { Partner } from '../../models/event.model';

@Component({
  selector: 'app-onboarding',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatIconModule, MatFormFieldModule, MatInputModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css',
})
export class OnboardingComponent {
  private onboardingService = inject(OnboardingService);
  private partnerService = inject(PartnerService);
  private tagOptionService = inject(TagOptionService);
  private timerDeviceService = inject(TimerDeviceService);
  private timerService = inject(TimerService);

  step = signal(0);
  partnerName = '';
  partnerSex: Partner['sex'] | '' = '';
  partnerAdded = signal(false);

  next(): void {
    if (this.step() === 0) this.tagOptionService.seedIfEmpty();
    this.step.update(s => s + 1);
  }

  addPartner(): void {
    const name = this.partnerName.trim();
    if (!name) return;
    const sex = this.partnerSex || undefined;
    this.partnerService.createPartner(name, sex);
    this.partnerName = '';
    this.partnerSex = '';
    this.partnerAdded.set(true);
  }

  finish(): void {
    this.tagOptionService.seedIfEmpty();
    this.timerDeviceService.seedIfEmpty();
    this.timerService.loadSessions();
    this.onboardingService.complete();
  }

  skip(): void {
    this.tagOptionService.seedIfEmpty();
    this.timerDeviceService.seedIfEmpty();
    this.timerService.loadSessions();
    this.step.set(4);
  }
}
