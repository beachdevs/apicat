<p align="center">
  <img src="./logo.png" alt="apicat logo" width="220" />
</p>

`apicat` is a tiny API caller.

Keep your API definitions in YAML, then list them, inspect them, and fire them off from the CLI or from JavaScript. It is built for quick experiments, repeatable calls, and "what was that curl again?" moments.

## ⚡ Quick Start

```bash
npx apicat <service.name> KEY=VALUE
```

Or install it locally. Use ```apic``` instead of ```npx apicat```.

```bash
npm install -g apicat

$ apic ls
$ apic httpbin.get
```

```
🔌 apicat v0.3.11 — call APIs (apic)

Commands
  apic <service.name> [k=v …]  Call API with optional params
  apic ls|list [pattern]       List APIs (e.g. apic list "openrouter")
  apic update                  Copy latest published .apicat to ~/.apicat
  apic <service.name> --help   Show help for this api call

Options
  apic <service.name> --time          Show request duration
  apic <service.name> --debug         Show fetch request/response info
  apic --config <path> httpbin.get    Use custom config file instead of ~/.apicat
```

## 🤖 apicat for your LLM

No installation required.

If you want an AI to learn your API definitions, tell it:

`Learn api definitions from https://unpkg.com/apicat`

## 🎉 API goodness

- One command: `apic`
- One bundled config file: `~/.apicat`
- HTTP and WebSocket support
- Variables with `$VAR` and required variables with `$!VAR`
- Works as a CLI, a library, and an exported CLI module

## 🧠 How It Thinks

On first interactive run, it can copy the bundled `apicat.yaml` to `~/.apicat`. Edit to your liking.

Variables can be defined in the call or will be used if named the same in env.

API IDs use `<service>.<name>` form, like `httpbin.get`, `openai.chat`, or `echo.ws`.

## 🧰 CLI Cheatsheet

```bash
# show the menu
apic

# list available apis
apic ls

# show help for an API
apic openai.chat --help

# use a different config
apic --config ./custom.yaml ls

# time or debug your calls
apic httpbin.get --time
apic httpbin.get --debug

# refresh ~/.apicat from the published apicat.yaml
apic update

# OpenAI-compatible chat
apic openai.chat \
  OPENAI_URL=https://api.openai.com \
  OPENAI_API_KEY=$OPENAI_API_KEY \
  MODEL=gpt-4o-mini \
  PROMPT="Write a haiku about logs"

# OpenRouter
apic openrouter.chat \
  API_KEY=$OPENROUTER_API_KEY \
  MODEL=openrouter/auto \
  PROMPT="Say hello"
```

## Key Value Parameters

```
apic openrouter.chat MODEL="openrouter/auto" PROMPT="Reply with only: ok"

Values will automatically be used if they exist in env. e.g. API_KEY

export API_KEY=...

# In the yaml config
openrouter.chat:
  url: https://openrouter.ai/api/v1/chat/completions
  method: POST
  headers:
    Authorization: "Bearer $!API_KEY"
  body: |
    {
      "model": "$!MODEL",
      "messages": [{"role": "user", "content": "$OPTIONAL_PROMPT"}, {"role": "user", "content": "$!PROMPT"}]
      , "provider": {"order": ["$PROVIDER"]}
    }
  jq: .choices[0].message.content
  help: Create an OpenRouter chat completion. Requires API_KEY, MODEL, and PROMPT.
```

## 💻 Use It From Code

Install it locally if you want to import it:

```bash
npm install -g apicat
```

Then:

```javascript
import { fetchApi, getApis, getRequest } from 'apicat';

const apis = getApis();
console.log(apis.map((api) => api.id));

const req = getRequest('httpbin', 'get');
console.log(req.url);

const res = await fetchApi('httpbin', 'get');
console.log(await res.json());

const chat = await fetchApi('openai', 'chat', {
  vars: {
    OPENAI_URL: 'https://api.openai.com',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MODEL: 'gpt-4o-mini',
    PROMPT: 'Hello world'
  }
});

console.log(await chat.json());
```

To load API definitions from a specific file, pass its path as `configPath`:

```javascript
const res = await fetchApi('httpbin', 'get', {
  configPath: './custom.yaml'
});
```

Without `configPath`, apicat uses `~/.apicat` when present, otherwise its bundled `apicat.yaml`.

For an OpenRouter chat completion, pass the values referenced by the `openrouter.chat` definition in `vars`:

```javascript
import { fetchApi } from 'apicat';

const res = await fetchApi('openrouter', 'chat', {
  vars: {
    API_KEY: process.env.OPENROUTER_API_KEY,
    MODEL: 'openrouter/auto',
    OPTIONAL_PROMPT: 'Be concise.',
    PROMPT: 'Give me one interesting cat fact.'
  }
});

if (!res.ok) throw new Error(`OpenRouter request failed: ${res.status} ${await res.text()}`);

const data = await res.json();
console.log(data.choices[0].message.content);
```

## YAML config
Simple! See apicat.yaml.
