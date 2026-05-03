import { Routes } from '@angular/router';
import { EventListComponent } from './components/event-list/event-list';
import { EventFormComponent } from './components/event-form/event-form';
import { PartnersComponent } from './components/partners/partners';
import { EditPartnerComponent } from './components/edit-partner/edit-partner';
import { ImportExportComponent } from './components/import-export/import-export';
import { CalendarComponent } from './components/calendar/calendar';
import { StatisticsComponent } from './components/statistics/statistics';

export const routes: Routes = [
  { path: '', redirectTo: 'calendar', pathMatch: 'full' },
  { path: 'events', component: EventListComponent },
  { path: 'add-event', component: EventFormComponent },
  { path: 'edit-event/:id', component: EventFormComponent },
  { path: 'partners', component: PartnersComponent },
  { path: 'edit-partner/:id', component: EditPartnerComponent },
  { path: 'import-export', component: ImportExportComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'statistics', component: StatisticsComponent },
];
