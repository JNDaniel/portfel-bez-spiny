import { TestBed } from '@angular/core/testing';

import { RUNTIME_CONFIG, RuntimeConfig } from '../config/runtime-config';
import { SupabaseClientService } from './supabase-client.service';

function setup(config: Partial<RuntimeConfig>): SupabaseClientService {
  TestBed.configureTestingModule({
    providers: [
      {
        provide: RUNTIME_CONFIG,
        useValue: {
          dataBackend: 'local',
          supabaseTarget: 'staging',
          supabaseUrl: 'http://127.0.0.1:54321',
          supabasePublishableKey: 'sb_publishable_test',
          ...config,
        } satisfies RuntimeConfig,
      },
    ],
  });
  return TestBed.inject(SupabaseClientService);
}

describe('SupabaseClientService', () => {
  it('is disabled and refuses to create a client when DATA_BACKEND is local', async () => {
    const service = setup({ dataBackend: 'local' });

    expect(service.enabled).toBeFalse();
    await expectAsync(service.getClient()).toBeRejectedWithError(/DATA_BACKEND is "local"/);
  });

  it('creates one shared client when DATA_BACKEND is supabase', async () => {
    const service = setup({ dataBackend: 'supabase' });

    const first = await service.getClient();
    const second = await service.getClient();

    expect(service.enabled).toBeTrue();
    expect(first).toBe(second);
  });
});
