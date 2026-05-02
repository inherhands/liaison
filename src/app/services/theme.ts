import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'material';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';

  readonly theme = signal<Theme>(this.loadTheme());

  private loadTheme(): Theme {
    return (localStorage.getItem(this.STORAGE_KEY) as Theme) ?? 'dark';
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    document.body.classList.toggle('theme-material', theme === 'material');
  }

  init(): void {
    document.body.classList.toggle('theme-material', this.theme() === 'material');
  }
}
