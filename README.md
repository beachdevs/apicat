[logo](./logo.png)

`apicat` is a tiny API caller.

Keep your API definitions in one `.apicat` file, then list them, inspect them, and fire them off from the CLI or from JavaScript. It is built for quick experiments, repeatable calls, and "what was that curl again?" moments.

## ⚡ Quick Start

```bash
npx apicat <ls | service.name> KEY=VALUE
```

or install..

```bash
npm install -g apicat
# or
bun add -g apicat

$ apic ls
$ apic httpbin.get
```

Examples:

```bash
npx apicat ls
npx apicat httpbin.get
npx apicat openrouter.chat API_KEY=$OPENROUTER_API_KEY MODEL=openai/gpt-4o-mini PROMPT="hello"
```

## 🤖 For LLM Prompts. Cli-free!

No installation required.

If you want a model to learn your API definitions, tell it:

`Learn api definitions from https://unpkg.com/apicat`



Variables can be defined in the call or will be used if named the same in env.

API IDs use `<service>.<name>` form, like `httpbin.get`, `openai.chat`, or `echo.ws`.

## 🎉 API goodness

- One command: `apic`
- One config file: `.apicat`
- HTTP and WebSocket support
- Variables with `$VAR` and required variables with `$!VAR`
- Works as both a CLI and a library

## 🧠 How It Thinks

On first interactive run, it can copy the bundled `.apicat` to `~/.apicat` so you have your own editable version instead of poking at the packaged one.

## 🧰 CLI Cheatsheet

```bash
# show the menu
apic

# list the toy box
apic ls
apic list openai
apic ls httpbin

# grep, but friendlier
apic help httpbin

# bring your own config
apic -config ./custom.yaml ls
apic -config ./custom.yaml httpbin.get

# call something
apic httpbin.get foo=bar
apic -time httpbin.get
apic -debug httpbin.get

# steal one definition into local ./.apicat
apic fetch echo.ws
apic fetch openai.chat

# refresh ~/.apicat from the published config
apic update
```

## 🪄 A Few Good Tricks

```bash
# OpenAI-compatible chat
apic openai.chat \
  OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1 \
  OPENAI_COMPATIBLE_API_KEY=$OPENAI_API_KEY \
  MODEL=gpt-4o-mini \
  PROMPT="Write a haiku about logs"

# OpenRouter
apic openrouter.chat \
  API_KEY=$OPENROUTER_API_KEY \
  MODEL=openai/gpt-4o-mini \
  PROVIDER=openai \
  PROMPT="Say hello"

# plain old GET
apic httpbin.get
```

Parameters automatically fall back to matching environment variables when possible.

## 💻 Use It From Code

Install it locally if you want to import it:

```bash
npm install apicat
# or
bun add apicat
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
    OPENAI_COMPATIBLE_BASE_URL: 'https://api.openai.com/v1',
    OPENAI_COMPATIBLE_API_KEY: process.env.OPENAI_API_KEY,
    MODEL: 'gpt-4o-mini',
    PROMPT: 'Hello world'
  }
});

console.log(await chat.json());
```

`fetchApi` returns a normal Fetch `Response`, so you can use `status`, `ok`, `headers`, `text()`, `json()`, and the rest of the usual response methods.

## 📜 The `.apicat` Spellbook

Top-level keys are `service.name`.

```yaml
httpbin.get:
  url: https://httpbin.org/get
  method: GET
  headers: {}

openai.chat:
  url: https://api.openai.com/v1/chat/completions
  method: POST
  headers:
    Authorization: "Bearer $!API_KEY"
    Content-Type: application/json
  body: |
    {"model":"$!MODEL","messages":[{"role":"user","content":"$!PROMPT"}]}

echo.ws:
  url: wss://echo-websocket.fly.dev/.ws
  body: $!PROMPT
```

