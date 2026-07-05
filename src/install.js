#!/usr/bin/env bun
import fs from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const defaultUserConfigPath = join(homedir(), '.apicat');
export const defaultBundledConfigPath = join(root, '.apicat');

export async function ensureUserConfig(options = {}) {
  const {
    arg,
    configPath,
    userConfigPath = defaultUserConfigPath,
    bundledConfigPath = defaultBundledConfigPath,
    createInterfaceFn = createInterface,
    hasUserConfig = (path) => fs.existsSync(path),
    bundledExists = (path) => fs.existsSync(path),
    stdinIsTTY = process.stdin.isTTY,
    stdoutIsTTY = process.stdout.isTTY,
    copyFile = fs.copyFileSync,
    stderr = console.error
  } = options;

  if (arg === 'update' || configPath || hasUserConfig(userConfigPath) || !bundledExists(bundledConfigPath) || !stdinIsTTY || !stdoutIsTTY) return;

  const rl = createInterfaceFn({ input: process.stdin, output: process.stdout });
  try {
    const question = `Copy .apicat to ${userConfigPath}? This lets you customize it. If not, apic will use the file bundled with the package. [Y/n] `;
    const answer = (await rl.question(question)).trim().toLowerCase();
    if (answer === '' || answer === 'y' || answer === 'yes') {
      copyFile(bundledConfigPath, userConfigPath);
      stderr(`Using ${userConfigPath}`);
    } else {
      stderr(`Using bundled config at ${bundledConfigPath}`);
    }
  } finally {
    rl.close();
  }
}
