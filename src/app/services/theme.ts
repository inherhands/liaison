import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';

  readonly theme = signal<Theme>(this.loadTheme());

  private loadTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'material') return 'light'; // migrate old value
    return (stored as Theme) ?? 'dark';
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    document.body.classList.toggle('theme-light', theme === 'light');
  }

  init(): void {
    document.body.classList.toggle('theme-light', this.theme() === 'light');
  }
}
