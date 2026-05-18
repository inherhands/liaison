import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ThemeService } from './services/theme';
import { TagOptionService } from './services/tag-option';
import { OnboardingService } from './services/onboarding';
import { TimerDeviceService } from './services/timer-device.service';
import { TimerService } from './services/timer.service';
import { OnboardingComponent } from './components/onboarding/onboarding';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbar, MatButton, MatIcon, OnboardingComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Liaison');
  protected readonly onboarding = inject(OnboardingService);

  constructor() {
    inject(ThemeService).init();
    this.onboarding.init();
    if (!this.onboarding.active()) {
      inject(TagOptionService).seedIfEmpty();
      const timerDeviceService = inject(TimerDeviceService);
      timerDeviceService.seedIfEmpty();
      inject(TimerService).loadSessions();
      inject(Router).navigate(['/calendar']);
    }

    if (localStorage.getItem('updateApplied') === 'true') {
      localStorage.removeItem('updateApplied');
      inject(MatSnackBar).open('App updated successfully.', 'Dismiss', { duration: 4000 });
    }
  }
}
