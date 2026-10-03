import { Injectable, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';

import { RUNTIME_CONFIG } from '../config/runtime-config';

/**
 * Single access point to the Supabase client. Only repository implementations may use it.
 * The library is loaded with a dynamic import so `DATA_BACKEND=local` builds never download
 * it or contact Supabase.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly config = inject(RUNTIME_CONFIG);
  private clientPromise: Promise<SupabaseClient> | null = null;

  get enabled(): boolean {
    return this.config.dataBackend === 'supabase';
  }

  getClient(): Promise<SupabaseClient> {
    if (!this.enabled) {
      return Promise.reject(new Error('Supabase is disabled: DATA_BACKEND is "local".'));
    }
    this.clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(this.config.supabaseUrl, this.config.supabasePublishableKey),
    );
    return this.clientPromise;
  }
}
