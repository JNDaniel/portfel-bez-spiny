import { execSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';

// The Auth suite runs against the local Supabase stack. Only the API URL and the publishable key
// are read from `supabase status`; secret and service_role keys are never read or passed on.
function readLocalSupabase(): { apiUrl: string; publishableKey: string } {
  const notRunning = new Error('Lokalny Supabase nie działa. Uruchom: npx supabase start');
  let output: string;
  try {
    output = execSync('npx supabase status -o env', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    throw notRunning;
  }

  const values = new Map<string, string>();
  for (const line of output.split('\n')) {
    const match = /^(API_URL|PUBLISHABLE_KEY)=(.*)$/.exec(line.trim());
    if (match) {
      values.set(match[1], match[2].replace(/^"(.*)"$/, '$1'));
    }
  }

  const apiUrl = values.get('API_URL');
  const publishableKey = values.get('PUBLISHABLE_KEY');
  if (!apiUrl || !publishableKey) {
    throw notRunning;
  }
  return { apiUrl, publishableKey };
}

const { apiUrl, publishableKey } = readLocalSupabase();

export default defineConfig({
  testDir: './e2e/auth',
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  outputDir: 'test-results-auth',
  reporter: [['html', { outputFolder: 'playwright-report-auth' }]],
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Pixel',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run serve:e2e-auth',
    url: 'http://localhost:4300',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATA_BACKEND: 'supabase',
      SUPABASE_URL_STAGING: apiUrl,
      SUPABASE_PUBLISHABLE_KEY_STAGING: publishableKey,
    },
  },
});
