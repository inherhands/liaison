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
import { ThemeService, Theme } from '../../services/theme';
import { TrackerEvent, Partner, TagOption } from '../../models/event.model';

interface BackupData {
  version: number;
  exportedAt: string;
  events: TrackerEvent[];
  partners: Partner[];
  tagOptions: TagOption[];
}

@Component({
  selector: 'app-import-export',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatDividerModule, MatButtonToggleModule],
  templateUrl: './import-export.html',
  styleUrl: './import-export.css',
})
export class ImportExportComponent {
  private db = inject(Database);
  private eventService = inject(EventService);
  private partnerService = inject(PartnerService);
  private tagOptionService = inject(TagOptionService);
  private themeService = inject(ThemeService);

  theme = this.themeService.theme;

  exporting = signal(false);
  importing = signal(false);
  importResult = signal<{ success: boolean; message: string } | null>(null);

  setTheme(t: Theme): void {
    this.themeService.setTheme(t);
  }

  async exportData(): Promise<void> {
    this.exporting.set(true);
    try {
      const [events, partners, tagOptions] = await Promise.all([
        this.db.getAllEvents(),
        this.db.getAllPartners(),
        this.db.getAllTagOptions(),
      ]);

      const backup: BackupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        events,
        partners,
        tagOptions,
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
      ]);

      await Promise.all([
        ...data.events.map(e => this.db.putEvent(e)),
        ...data.partners.map(p => this.db.putPartner(p)),
        ...(data.tagOptions ?? []).map(t => this.db.putTagOption(t)),
      ]);

      this.tagOptionService.clearCache();
      await this.eventService.loadEvents();
      await this.partnerService.loadPartners();

      this.importResult.set({
        success: true,
        message: `Restored ${data.events.length} events, ${data.partners.length} partners.`,
      });
    } catch (e) {
      this.importResult.set({ success: false, message: 'Failed to import: ' + (e as Error).message });
    } finally {
      this.importing.set(false);
    }
  }
}
