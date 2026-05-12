import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ThemeService } from './services/theme';
import { TagOptionService } from './services/tag-option';
import { OnboardingService } from './services/onboarding';
import { TimerDeviceService } from './services/timer-device.service';
import { TimerService } from './services/timer.service';
import { OnboardingComponent } from './components/onboarding/onboarding';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbar, MatButton, MatIcon, OnboardingComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Liaison');
  protected readonly updateAvailable = signal(false);
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

    const swUpdate = inject(SwUpdate, { optional: true });
    if (swUpdate?.isEnabled) {
      swUpdate.versionUpdates
        .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
        .subscribe(() => this.updateAvailable.set(true));

      // Check for update on launch, then every 6 hours
      swUpdate.checkForUpdate();
      setInterval(() => swUpdate.checkForUpdate(), 6 * 60 * 60 * 1000);
    }
  }

  applyUpdate(): void {
    window.location.reload();
  }
}
