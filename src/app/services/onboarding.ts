import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

const KEY = 'onboarding_complete';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private router = inject(Router);
  readonly active = signal(false);

  init(): void {
    if (!localStorage.getItem(KEY)) {
      this.active.set(true);
    }
  }

  complete(): void {
    localStorage.setItem(KEY, '1');
    this.active.set(false);
    this.router.navigate(['/calendar']);
  }
}
