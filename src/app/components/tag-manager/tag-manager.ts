import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { TagOptionService } from '../../services/tag-option';
import { TimerDeviceService } from '../../services/timer-device.service';
import { TimerService } from '../../services/timer.service';
import { TagCategory, TagOption } from '../../models/event.model';

interface CategoryGroup {
  category: TagCategory;
  label: string;
  chipClass: string;
  options: TagOption[];
  newValue: string;
}

const CATEGORY_META: { category: TagCategory; label: string; chipClass: string }[] = [
  { category: 'sexType',        label: 'Sex Types',        chipClass: 'chip-pink' },
  { category: 'positions',     label: 'Positions',         chipClass: 'chip-blue' },
  { category: 'toys',          label: 'Toys',              chipClass: 'chip-purple' },
  { category: 'tags',          label: 'Sex Tags',          chipClass: 'chip-green' },
  { category: 'soloTags',      label: 'Solo Tags',         chipClass: 'chip-green' },
  { category: 'healthSymptoms', label: 'Health Symptoms',  chipClass: 'chip-teal' },
  { category: 'refusalTags',   label: 'Refusal Reasons',  chipClass: 'chip-orange' },
];

@Component({
  selector: 'app-tag-manager',
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatDividerModule],
  templateUrl: './tag-manager.html',
  styleUrl: './tag-manager.css',
})
export class TagManagerComponent implements OnInit {
  private tagOptionService = inject(TagOptionService);
  protected readonly deviceService = inject(TimerDeviceService);
  private timerService = inject(TimerService);

  groups = signal<CategoryGroup[]>([]);
  newDeviceName = '';

  async ngOnInit(): Promise<void> {
    const byCategory = await this.tagOptionService.getAllByCategory();
    this.groups.set(
      CATEGORY_META.map(meta => ({
        ...meta,
        options: [...byCategory[meta.category]],
        newValue: '',
      }))
    );
  }

  async addOption(group: CategoryGroup): Promise<void> {
    const value = group.newValue.trim();
    if (!value || group.options.some(o => o.value === value)) return;
    group.newValue = '';
    const opt: TagOption = { id: `${group.category}:${value}`, category: group.category, value };
    this.tagOptionService.ensureOption(group.category, value);
    group.options.push(opt);
    this.groups.set([...this.groups()]);
  }

  async deleteOption(group: CategoryGroup, opt: TagOption): Promise<void> {
    await this.tagOptionService.deleteOption(group.category, opt.value);
    group.options = group.options.filter(o => o.id !== opt.id);
    this.groups.set([...this.groups()]);
  }

  onKeydown(event: KeyboardEvent, group: CategoryGroup): void {
    if (event.key === 'Enter') this.addOption(group);
  }

  async addDevice(): Promise<void> {
    const name = this.newDeviceName.trim();
    if (!name) return;
    await this.deviceService.addDevice(name);
    this.newDeviceName = '';
  }

  onDeviceKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.addDevice();
  }

  async deleteDevice(id: string): Promise<void> {
    const activeCount = this.timerService.activeTimers().filter(t => t.deviceId === id).length;
    const sessionCount = this.timerService.sessions().filter(s => s.deviceId === id).length;

    if (activeCount > 0 || sessionCount > 0) {
      const parts: string[] = [];
      if (activeCount > 0) parts.push(`${activeCount} active timer${activeCount === 1 ? '' : 's'}`);
      if (sessionCount > 0) parts.push(`${sessionCount} session${sessionCount === 1 ? '' : 's'} in history`);
      const confirmed = confirm(
        `This device has ${parts.join(' and ')}. Removing it won't delete those records, but they'll no longer match a device. Remove anyway?`
      );
      if (!confirmed) return;
    }

    await this.deviceService.deleteDevice(id);
  }
}
