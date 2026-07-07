import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runCli } from '../src/cli.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = join(root, 'apicat.yaml');

test('cli.js module and apicli executable list APIs', async () => {
  const moduleOut = [];
  const moduleErr = [];
  const code = await runCli(['-config', config, 'ls'], {
    out: (...args) => moduleOut.push(args.join(' ')),
    err: (...args) => moduleErr.push(args.join(' '))
  });

  assert.strictEqual(code, 0);
  assert.deepStrictEqual(moduleErr, []);
  assert.strictEqual(moduleOut[0], '');
  assert.match(moduleOut.join('\n'), /\x1b\[36mhttpbin\.get\x1b\[0m/);
  assert.strictEqual(moduleOut.at(-1), '');

  const executable = spawnSync(process.execPath, [join(root, 'src/apicli'), '-config', config, 'ls'], {
    encoding: 'utf8',
    cwd: root
  });

  assert.strictEqual(executable.status, 0);
  assert.strictEqual(executable.stderr, '');
  assert.match(executable.stdout, /^\n\x1b\[36mhttpbin\.get\x1b\[0m/m);
  assert.match(executable.stdout, /\n\n$/);
});
