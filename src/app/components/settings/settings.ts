import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Database } from '../../services/database';
import { EventService } from '../../services/event';
import { PartnerService } from '../../services/partner';
import { TagOptionService } from '../../services/tag-option';
import { TimerDeviceService } from '../../services/timer-device.service';
import { TimerService } from '../../services/timer.service';
import { ThemeService, Theme } from '../../services/theme';
import { TrackerEvent, Partner, TagOption } from '../../models/event.model';
import { TimerDevice, TimerSession, ActiveTimer } from '../../models/timer.model';

interface BackupData {
  version: number;
  exportedAt: string;
  events: TrackerEvent[];
  partners: Partner[];
  tagOptions: TagOption[];
  timerDevices?: TimerDevice[];
  timerSessions?: TimerSession[];
  activeTimers?: ActiveTimer[];
}

@Component({
  selector: 'app-settings',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatDividerModule, MatButtonToggleModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class SettingsComponent {
  private db = inject(Database);
  private eventService = inject(EventService);
  private partnerService = inject(PartnerService);
  private tagOptionService = inject(TagOptionService);
  private timerDeviceService = inject(TimerDeviceService);
  private timerService = inject(TimerService);
  private themeService = inject(ThemeService);

  theme = this.themeService.theme;

  exporting = signal(false);
  importing = signal(false);
  erasing = signal(false);
  importResult = signal<{ success: boolean; message: string } | null>(null);
  eraseResult = signal<{ success: boolean; message: string } | null>(null);

  setTheme(t: Theme): void {
    this.themeService.setTheme(t);
  }

  async exportData(): Promise<void> {
    this.exporting.set(true);
    try {
      const [events, partners, tagOptions, timerDevices, timerSessions] = await Promise.all([
        this.db.getAllEvents(),
        this.db.getAllPartners(),
        this.db.getAllTagOptions(),
        this.db.getAllTimerDevices(),
        this.db.getAllTimerSessions(),
      ]);

      const backup: BackupData = {
        version: 3,
        exportedAt: new Date().toISOString(),
        events,
        partners,
        tagOptions,
        timerDevices,
        timerSessions,
        activeTimers: this.timerService.activeTimers(),
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      this.exporting.set(false);
    }
  }

  triggerFileInput(): void {
    document.getElementById('import-file-input')?.click();
  }

  async eraseAllData(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to erase everything?\n\nAll events, partners, tag options and settings will be permanently removed from this device. The app will restart fresh, as if newly installed.\n\nThis cannot be undone. Ensure you have exported a backup first.'
    );
    if (!confirmed) return;

    this.erasing.set(true);
    try {
      this.db.close();
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase('liaison-events');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('Database is blocked'));
      });
      localStorage.clear();
      window.location.href = '/liaison/';
    } catch (e) {
      this.eraseResult.set({ success: false, message: 'Failed to erase data: ' + (e as Error).message });
      this.erasing.set(false);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    input.value = '';

    this.importing.set(true);
    this.importResult.set(null);
    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      if (!data.version || !Array.isArray(data.events) || !Array.isArray(data.partners)) {
        this.importResult.set({ success: false, message: 'Invalid backup file format.' });
        return;
      }

      await Promise.all([
        this.db.clearAll(),
        this.db.clearPartners(),
        this.db.clearTagOptions(),
        this.db.clearTimerDevices(),
        this.db.clearTimerSessions(),
      ]);

      await Promise.all([
        ...data.events.map(e => this.db.putEvent(e)),
        ...data.partners.map(p => this.db.putPartner(p)),
        ...(data.tagOptions ?? []).map(t => this.db.putTagOption(t)),
        ...(data.timerDevices ?? []).map(d => this.db.putTimerDevice(d)),
        ...(data.timerSessions ?? []).map(s => this.db.addTimerSession(s)),
      ]);

      this.tagOptionService.clearCache();
      await this.eventService.loadEvents();
      await this.partnerService.loadPartners();
      await this.timerDeviceService.load();
      await this.timerService.loadSessions();
      this.timerService.restoreActiveTimers(data.activeTimers ?? []);

      const tagCount = (data.tagOptions ?? []).length;
      this.importResult.set({
        success: true,
        message: `Restored ${data.events.length} event${data.events.length === 1 ? '' : 's'}, ${data.partners.length} partner${data.partners.length === 1 ? '' : 's'}, ${tagCount} tag option${tagCount === 1 ? '' : 's'} and ${(data.timerSessions ?? []).length} timer session${(data.timerSessions ?? []).length === 1 ? '' : 's'}.`,
      });
    } catch (e) {
      this.importResult.set({ success: false, message: 'Failed to import: ' + (e as Error).message });
    } finally {
      this.importing.set(false);
    }
  }
}
