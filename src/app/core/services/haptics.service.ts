import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const STYLES = {
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
} as const;

@Injectable({ providedIn: 'root' })
export class HapticsService {
  async impact(style: keyof typeof STYLES): Promise<void> {
    try {
      await Haptics.impact({ style: STYLES[style] });
    } catch {
      // Haptics rejects where the vibrate API is missing (desktop browsers, jsdom).
    }
  }
}
