// Fails the build if the browser bundle contains privileged Supabase credentials.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = resolve(root, 'dist/cost-management-app/browser');
const textExtensions = new Set([
  '.js',
  '.mjs',
  '.css',
  '.html',
  '.json',
  '.map',
  '.txt',
  '.webmanifest',
]);

const patterns = [
  { name: 'Supabase secret key', regex: /sb_secret_[A-Za-z0-9_-]+/ },
  { name: 'service_role reference', regex: /service_role/ },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

// Legacy Supabase keys are JWTs; decode their payloads to catch a service_role token.
function findServiceRoleJwt(content) {
  for (const match of content.matchAll(/eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
    try {
      const payload = JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8'));
      if (payload?.role === 'service_role') {
        return true;
      }
    } catch {
      // Not a JWT payload.
    }
  }
  return false;
}

const findings = [];
for (const file of walk(bundleDir)) {
  const ext = file.slice(file.lastIndexOf('.'));
  if (!textExtensions.has(ext)) {
    continue;
  }
  const content = readFileSync(file, 'utf8');
  for (const { name, regex } of patterns) {
    if (regex.test(content)) {
      findings.push(`${relative(root, file)}: ${name}`);
    }
  }
  if (findServiceRoleJwt(content)) {
    findings.push(`${relative(root, file)}: service_role JWT`);
  }
}

if (findings.length > 0) {
  console.error('[bundle-scan] Privileged credentials found in the browser bundle:');
  for (const finding of findings) {
    console.error(`  - ${finding}`);
  }
  process.exit(1);
}

console.log(`[bundle-scan] OK: no privileged Supabase credentials in ${relative(root, bundleDir)}`);
