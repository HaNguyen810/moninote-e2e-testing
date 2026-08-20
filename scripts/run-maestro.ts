import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const target = process.argv[2];
if (target !== 'android' && target !== 'web') {
  console.error('Usage: run-maestro.ts <android|web> [flow-name]');
  process.exit(1);
}

const flowsDir = path.resolve(import.meta.dirname, `../maestro/${target}/flows`);
const requested = process.argv[3];

const flows = requested
  ? [requested.endsWith('.yaml') ? requested : `${requested}.yaml`]
  : readdirSync(flowsDir).filter((f) => f.endsWith('.yaml'));

for (const flow of flows) {
  const flowPath = path.join(flowsDir, flow);
  console.log(`\n▶ maestro test ${flow}`);
  const result = spawnSync('maestro', ['test', flowPath], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
