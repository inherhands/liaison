import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { EventService } from '../../services/event';
import { PartnerService } from '../../services/partner';
import { TagOptionService } from '../../services/tag-option';
import { EventType, SexEvent, NoteEvent, SoloEvent, RefusalEvent, TrackerEvent } from '../../models/event.model';
import { generateId } from '../../utils/uuid';

@Component({
  selector: 'app-event-form',
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatSelectModule,
    MatIconModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './event-form.html',
  styleUrl: './event-form.css',
})
export class EventFormComponent implements OnInit {
  private eventService = inject(EventService);
  private partnerService = inject(PartnerService);
  private tagOptionService = inject(TagOptionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editId: string | null = null;
  returnDate: string | null = null;
  returnYear: number | null = null;
  returnMonth: number | null = null;
  get isEditMode(): boolean { return !!this.editId; }

  eventTypes: EventType[] = ['Sex', 'Note', 'Solo', 'Refusal'];
  partners = this.partnerService.partners;
  submitting = false;

  selectedType: EventType = 'Sex';
  pickerDate: Date = new Date();
  pickerTime: string = new Date().toTimeString().slice(0, 5);

  // Sex fields
  sexPartner = '';
  sexTypeOptions = signal(['Vaginal', 'Anal']);
  sexTypeSelected = signal<string[]>([]);
  sexCount = 1;
  myOrgasms = 0;
  partnerOrgasms = 0;
  positionOptions = signal(['Woman on top', 'Man on top', '69', 'Doggy']);
  positionsSelected = signal<string[]>([]);
  tagOptions = signal(['Sleepy', 'Quick', 'Romantic']);
  tagsSelected = signal<string[]>([]);
  initiation: 'Me' | 'Partner' | 'Both' = 'Both';
  toyOptions = signal(['Dildo', 'Vibrator', 'Butt Plug']);
  toysSelected = signal<string[]>([]);

  // Note fields
  noteText = '';

  // Solo fields
  soloCount = 1;
  soloMyOrgasms = 0;
  soloToyOptions = signal(['Dildo', 'Vibrator', 'Butt Plug']);
  soloToysSelected = signal<string[]>([]);
  soloTagOptions = signal(['Quick', 'Sleepy', 'Edging']);
  soloTagsSelected = signal<string[]>([]);
  soloNotes = '';

  // Refusal fields
  refusalPartner = '';
  refusalText = '';

  // Sex notes
  sexNotes = '';

  // New tag/option inputs
  newSexType = '';
  newPosition = '';
  newTag = '';
  newToy = '';
  newSoloToy = '';
  newSoloTag = '';

  async ngOnInit(): Promise<void> {
    this.partnerService.loadPartners();

    this.tagOptionService.getOptions('sexType').then(v => this.sexTypeOptions.set(v));
    this.tagOptionService.getOptions('positions').then(v => this.positionOptions.set(v));
    this.tagOptionService.getOptions('tags').then(v => this.tagOptions.set(v));
    this.tagOptionService.getOptions('toys').then(v => this.toyOptions.set(v));
    this.tagOptionService.getOptions('soloToys').then(v => this.soloToyOptions.set(v));
    this.tagOptionService.getOptions('soloTags').then(v => this.soloTagOptions.set(v));

    this.editId = this.route.snapshot.paramMap.get('id');
    this.returnDate = this.route.snapshot.queryParamMap.get('date');
    const year = this.route.snapshot.queryParamMap.get('year');
    const month = this.route.snapshot.queryParamMap.get('month');
    if (year) this.returnYear = parseInt(year, 10);
    if (month !== null && month !== '') this.returnMonth = parseInt(month, 10);
    
    if (this.editId) {
      const event = await this.eventService.getEvent(this.editId);
      if (event) this.populateFromEvent(event);
    }
  }

  private populateFromEvent(event: TrackerEvent): void {
    this.selectedType = event.type;
    const dt = new Date(event.date);
    this.pickerDate = dt;
    this.pickerTime = dt.toTimeString().slice(0, 5);

    if (event.type === 'Sex') {
      this.sexPartner = event.partner;
      this.sexTypeSelected.set([...event.sexType]);
      this.positionsSelected.set([...event.positions]);
      this.tagsSelected.set([...event.tags]);
      this.toysSelected.set([...event.toys]);
      this.sexCount = event.count;
      this.myOrgasms = event.myOrgasms;
      this.partnerOrgasms = event.partnerOrgasms;
      this.initiation = event.initiation;
      this.sexNotes = event.notes ?? '';
    } else if (event.type === 'Note') {
      this.noteText = event.text;
    } else if (event.type === 'Solo') {
      this.soloCount = event.count;
      this.soloMyOrgasms = event.myOrgasms;
      this.soloToysSelected.set([...event.toys]);
      this.soloTagsSelected.set([...(event.tags ?? [])]);
      this.soloNotes = event.notes ?? '';
    } else if (event.type === 'Refusal') {
      this.refusalPartner = event.partner;
      this.refusalText = event.text;
    }
  }

  toggleChip(sig: ReturnType<typeof signal<string[]>>, value: string): void {
    const cur = sig();
    sig.set(cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value]);
  }

  isSelected(sig: ReturnType<typeof signal<string[]>>, value: string): boolean {
    return sig().includes(value);
  }

  addSexType(): void {
    const val = this.newSexType.trim();
    this.newSexType = '';
    if (val && !this.sexTypeOptions().includes(val)) {
      this.sexTypeOptions.update(o => [...o, val]);
      this.sexTypeSelected.update(s => [...s, val]);
      this.tagOptionService.ensureOption('sexType', val);
    }
  }

  addPosition(): void {
    const val = this.newPosition.trim();
    this.newPosition = '';
    if (val && !this.positionOptions().includes(val)) {
      this.positionOptions.update(o => [...o, val]);
      this.positionsSelected.update(s => [...s, val]);
      this.tagOptionService.ensureOption('positions', val);
    }
  }

  addTag(): void {
    const val = this.newTag.trim();
    this.newTag = '';
    if (val && !this.tagOptions().includes(val)) {
      this.tagOptions.update(o => [...o, val]);
      this.tagsSelected.update(s => [...s, val]);
      this.tagOptionService.ensureOption('tags', val);
    }
  }

  addToy(): void {
    const val = this.newToy.trim();
    this.newToy = '';
    if (val && !this.toyOptions().includes(val)) {
      this.toyOptions.update(o => [...o, val]);
      this.toysSelected.update(s => [...s, val]);
      this.tagOptionService.ensureOption('toys', val);
    }
  }

  addSoloToy(): void {
    const val = this.newSoloToy.trim();
    this.newSoloToy = '';
    if (val && !this.soloToyOptions().includes(val)) {
      this.soloToyOptions.update(o => [...o, val]);
      this.soloToysSelected.update(s => [...s, val]);
      this.tagOptionService.ensureOption('soloToys', val);
    }
  }

  addSoloTag(): void {
    const val = this.newSoloTag.trim();
    this.newSoloTag = '';
    if (val && !this.soloTagOptions().includes(val)) {
      this.soloTagOptions.update(o => [...o, val]);
      this.soloTagsSelected.update(s => [...s, val]);
      this.tagOptionService.ensureOption('soloTags', val);
    }
  }

  increment(field: 'sexCount' | 'myOrgasms' | 'partnerOrgasms' | 'soloCount' | 'soloMyOrgasms'): void {
    (this[field] as number)++;
  }

  decrement(field: 'sexCount' | 'myOrgasms' | 'partnerOrgasms' | 'soloCount' | 'soloMyOrgasms'): void {
    if ((this[field] as number) > 0) (this[field] as number)--;
  }

  async submitForm(): Promise<void> {
    this.submitting = true;
    try {
      const [hours, minutes] = this.pickerTime.split(':').map(Number);
      const dt = new Date(this.pickerDate);
      dt.setHours(hours, minutes, 0, 0);
      const base = { date: dt.toISOString() };
      const type = this.selectedType;

      let event: TrackerEvent | null = null;

      if (type === 'Sex') {
        event = {
          id: this.editId ?? generateId(),
          ...base,
          type: 'Sex',
          partner: this.sexPartner,
          sexType: this.sexTypeSelected(),
          count: this.sexCount,
          myOrgasms: this.myOrgasms,
          partnerOrgasms: this.partnerOrgasms,
          positions: this.positionsSelected(),
          tags: this.tagsSelected(),
          initiation: this.initiation,
          toys: this.toysSelected(),
          notes: this.sexNotes.trim() || undefined,
        };
      } else if (type === 'Note') {
        event = { id: this.editId ?? generateId(), ...base, type: 'Note', text: this.noteText };
      } else if (type === 'Solo') {
        event = {
          id: this.editId ?? generateId(),
          ...base,
          type: 'Solo',
          count: this.soloCount,
          myOrgasms: this.soloMyOrgasms,
          toys: this.soloToysSelected(),
          tags: this.soloTagsSelected(),
          notes: this.soloNotes.trim() || undefined,
        };
      } else if (type === 'Refusal') {
        event = {
          id: this.editId ?? generateId(),
          ...base,
          type: 'Refusal',
          partner: this.refusalPartner,
          text: this.refusalText,
        };
      }

      if (!event) return;

      if (this.isEditMode) {
        await this.eventService.updateEvent(event);
      } else {
        await this.eventService.createEvent(event);
      }

      const params: any = {};
      if (this.returnDate) {
        params.date = this.returnDate;
      }
      if (this.returnYear !== null) {
        params.year = this.returnYear;
      }
      if (this.returnMonth !== null) {
        params.month = this.returnMonth;
      }
      this.router.navigate(['/events'], { queryParams: params });
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    } finally {
      this.submitting = false;
    }
  }

  cancel(): void {
    const params: any = {};
    if (this.returnDate) {
      params.date = this.returnDate;
    }
    if (this.returnYear !== null) {
      params.year = this.returnYear;
    }
    if (this.returnMonth !== null) {
      params.month = this.returnMonth;
    }
    this.router.navigate(['/events'], { queryParams: params });
  }

  get canSubmit(): boolean {
    const type = this.selectedType;
    if (type === 'Sex') return !!this.sexPartner;
    if (type === 'Note') return !!this.noteText.trim();
    if (type === 'Refusal') return !!this.refusalPartner;
    return true;
  }
}
