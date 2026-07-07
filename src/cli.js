import fs from 'node:fs';
import { fetchApi, fetchWS, getApi, getApis, getFlow, parseJsonResponse } from './fetch.js';
import { ensureUserConfig, defaultUserConfigPath, defaultBundledConfigPath } from './install.js';
import { parseYaml } from './yaml.js';

const publishedConfigUrl = 'https://raw.githubusercontent.com/beachdevs/apicat/refs/heads/master/apicat.yaml';
const c = { dim: '\x1b[90m', cyan: '\x1b[36m', green: '\x1b[32m', bold: '\x1b[1m', reset: '\x1b[0m' };

export const usage = `
🔌 ${c.bold}apicat${c.reset} ${c.dim}— call APIs (${c.cyan}apic${c.reset})${c.reset}

${c.bold}Commands${c.reset}
  ${c.cyan}ls|list${c.reset} [pattern]       List APIs (e.g. ${c.dim}apic list "openrouter"${c.reset})
  ${c.cyan}update${c.reset}                  Copy latest published ${c.dim}.apicat${c.reset} to ${c.dim}~/.apicat${c.reset}
  ${c.cyan}help${c.reset} <pattern>          Show matching lines (e.g. ${c.dim}apic help "httpbin*"${c.reset})
  ${c.green}<service.name>${c.reset} [k=v …]  Call API with optional params

${c.bold}Options${c.reset}
  ${c.cyan}-time${c.reset}                   Print request duration
  ${c.cyan}-debug${c.reset}                  Print fetch request/response info (e.g. ${c.dim}apic -debug httpbin.get${c.reset})
  ${c.cyan}-config${c.reset} <path>          Use custom config file (e.g. ${c.dim}apic -config ./custom.yaml httpbin.get${c.reset})

${c.bold}Example${c.reset}
  ${c.dim}apic openrouter.chat API_KEY=$OPENROUTER_API_KEY MODEL=openai/gpt-4o-mini PROMPT=Hello${c.reset}
  ${c.dim}apic -time httpbin.get${c.reset}
  ${c.dim}apic -debug httpbin.get${c.reset}
`;

export const parseArgs = (raw = []) => {
  const configIdx = raw.findIndex(a => a === '-config' || a === '--config');
  if (configIdx >= 0 && (!raw[configIdx + 1] || raw[configIdx + 1].startsWith('-'))) return { error: 'Error: -config requires a file path' };
  const args = raw.filter((a, i) => !['-time', '--time', '-debug', '--debug'].includes(a) && !(configIdx >= 0 && (i === configIdx || i === configIdx + 1)));
  return { args, arg: args[0], pattern: args[1] ?? '.', time: raw.includes('-time') || raw.includes('--time'), debug: raw.includes('-debug') || raw.includes('--debug'), configPath: configIdx >= 0 ? raw[configIdx + 1] : null };
};

export async function runCli(raw = process.argv.slice(2), io = {}) {
  const out = io.out ?? console.log, err = io.err ?? console.error;
  const userConfigPath = io.userConfigPath ?? defaultUserConfigPath;
  const bundledConfigPath = io.bundledConfigPath ?? defaultBundledConfigPath;
  const hasUser = () => fs.existsSync(userConfigPath);
  const cfg = (p) => p ?? (hasUser() ? userConfigPath : (fs.existsSync(bundledConfigPath) ? bundledConfigPath : null));
  const { error, args, arg, pattern, time, debug, configPath } = parseArgs(raw);
  const re = (s) => new RegExp(s.replace(/\*/g, '.*'), 'i');
  const printConfig = () => { const p = cfg(configPath); if (p) err(configPath ? 'config:' : hasUser() ? 'user:   ' : 'bundled:', p); };
  const search = (rx) => { const p = cfg(configPath); if (p && fs.existsSync(p)) for (const l of fs.readFileSync(p, 'utf8').split('\n')) if (rx.test(l)) out(l); };
  const update = async () => {
    const r = await fetch(publishedConfigUrl);
    if (!r.ok) throw new Error(`Failed to download ${publishedConfigUrl}: ${r.status} ${r.statusText}`);
    const text = await r.text();
    parseYaml(text);
    fs.writeFileSync(userConfigPath, text, 'utf8');
    out(userConfigPath);
  };

  if (error) return err(error), 1;
  await ensureUserConfig({ arg, configPath, userConfigPath, bundledConfigPath });
  if (!args.length) printConfig();
  if (!arg || arg === '-h' || arg === '--help') return out(usage), 0;
  if (arg === 'ls' || arg === 'list') {
    out('');
    for (const a of getApis(cfg(configPath))) {
      const id = a.id ?? `${a.service}.${a.name}`;
      if (re(pattern).test(id)) out(`${c.cyan}${id}${c.reset}`);
    }
    out('');
    return 0;
  }
  if (arg === 'help') return search(re(pattern)), 0;
  if (arg === 'update') {
    try { await update(); return 0; } catch (e) { err(e.message); return 1; }
  }
  if (!/^\w+\.\w+$/.test(arg)) return search(re(arg)), 0;

  const p = cfg(configPath), [service, name] = arg.split('.'), params = Object.fromEntries(args.slice(1).map(a => [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)]).filter(([k]) => k));
  const { base, steps } = getFlow(service, name, p), api = base ?? getApi(service, name, p);
  if (!api && !steps.length) return err('Unknown API:', arg), 1;
  const isWs = steps.length || String(api?.url ?? '').startsWith('ws');
  const hasBody = api?.body != null && String(api.body).trim() !== '';
  const jsonPost = api?.method === 'POST' && (typeof api.headers === 'string' ? /json|^bearer /i.test(api.headers) : Object.entries(api?.headers || {}).some(([k, v]) => k.toLowerCase() === 'content-type' && String(v).toLowerCase().includes('json')));
  const opts = isWs || hasBody ? { vars: params, configPath: p } : jsonPost ? { body: JSON.stringify(params), configPath: p } : { vars: params, configPath: p };
  if (debug) opts.debug = true;
  try {
    const t0 = time ? process.hrtime.bigint() : null;
    if (isWs) await fetchWS(service, name, { ...opts, onMessage: (_msg, ctx) => out(ctx.raw) });
    else out(JSON.stringify(parseJsonResponse(await (await fetchApi(service, name, opts)).text()), null, 2));
    if (t0) err(`\x1b[90m%ims\x1b[0m`, (Number(process.hrtime.bigint() - t0) / 1e6).toFixed(0));
    return 0;
  } catch (e) {
    err(e.message);
    return 1;
  }
}
