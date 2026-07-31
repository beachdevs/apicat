import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { formatResponse, runCli } from '../src/cli.js';
import { getApis } from '../src/fetch.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = join(root, 'apicat.yaml');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

test('cli usage includes the package version', async () => {
  const output = [];
  const code = await runCli([], { out: value => output.push(value) });

  assert.strictEqual(code, 0);
  assert.match(output.join('\n'), new RegExp(`apicat\\x1b\\[0m \\x1b\\[90mv${version} — call APIs`));
});

test('api help prints the YAML help text without making a request', async () => {
  const output = [];
  const code = await runCli(['-config', config, 'httpbin.get', '--help'], {
    out: value => output.push(value)
  });

  assert.strictEqual(code, 0);
  assert.deepStrictEqual(output, ['Send a GET request to httpbin.org/get.']);
});

test('update refuses to overwrite an existing config without confirmation', async () => {
  const errors = [];
  const code = await runCli(['update'], {
    err: value => errors.push(value),
    userConfigPath: config
  });

  assert.strictEqual(code, 1);
  assert.deepStrictEqual(errors, [`Refusing to overwrite ${config} without confirmation. Run \`apic update\` in an interactive terminal.`]);
});

test('jq API field prints raw selected output', () => {
  const catfact = getApis(config).find(api => api.id === 'catfact.getFact');

  assert.strictEqual(catfact.jq, '.fact');
  assert.strictEqual(formatResponse('{"fact":"Cats purr."}', catfact.jq), 'Cats purr.');
});

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
