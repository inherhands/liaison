import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbar } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ThemeService } from './services/theme';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbar, MatButton, MatIcon],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Liaison');
  protected readonly updateAvailable = signal(false);

  constructor() {
    inject(ThemeService).init();

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
