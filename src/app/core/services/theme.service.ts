import { Injectable, effect, signal } from "@angular/core";

@Injectable({
  providedIn: "root"
})
export class ThemeService {
  private readonly STORAGE_KEY = "costflow_theme";
  public readonly isDark = signal<boolean>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      if (dark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem(this.STORAGE_KEY, "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem(this.STORAGE_KEY, "light");
      }
    });
  }

  toggleTheme() {
    this.isDark.update(prev => !prev);
  }

  setTheme(dark: boolean) {
    this.isDark.set(dark);
  }

  private getInitialTheme(): boolean {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      return saved === "dark";
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
}
