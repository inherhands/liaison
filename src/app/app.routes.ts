import { Routes } from '@angular/router';
import { EventListComponent } from './components/event-list/event-list';
import { EventFormComponent } from './components/event-form/event-form';
import { PartnersComponent } from './components/partners/partners';
import { EditPartnerComponent } from './components/edit-partner/edit-partner';
import { SettingsComponent } from './components/settings/settings';
import { CalendarComponent } from './components/calendar/calendar';
import { StatisticsComponent } from './components/statistics/statistics';
import { TagManagerComponent } from './components/tag-manager/tag-manager';
import { OnboardingPlaceholderComponent } from './components/onboarding/onboarding-placeholder';

export const routes: Routes = [
  { path: '', component: OnboardingPlaceholderComponent, pathMatch: 'full' },
  { path: 'events', component: EventListComponent },
  { path: 'add-event', component: EventFormComponent },
  { path: 'edit-event/:id', component: EventFormComponent },
  { path: 'partners', component: PartnersComponent },
  { path: 'add-partner', component: EditPartnerComponent },
  { path: 'edit-partner/:id', component: EditPartnerComponent },
  { path: 'settings', component: SettingsComponent },
  { path: 'tag-manager', component: TagManagerComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'statistics', component: StatisticsComponent },
];
