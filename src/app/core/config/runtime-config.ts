import { InjectionToken } from '@angular/core';

import { runtimeConfig } from '../../../environments/runtime-config.generated';

export type DataBackend = 'local' | 'supabase';

export interface RuntimeConfig {
  dataBackend: DataBackend;
  supabaseTarget: 'prod' | 'staging';
  supabaseUrl: string;
  supabasePublishableKey: string;
}

export const RUNTIME_CONFIG = new InjectionToken<RuntimeConfig>('RUNTIME_CONFIG', {
  providedIn: 'root',
  factory: () => runtimeConfig,
});
