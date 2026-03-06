# apicat

`apicat` gives you a tiny API toolbox with one short command: `ac`.

Keep your API definitions in a single `.apicat` file, then list them, inspect them, and call them from the CLI or from JavaScript. It works well for quick experiments, repeatable API calls, and "what was that curl again?" moments.

## Why It’s Nice

- One command: `ac`
- One config file: `.apicat`
- HTTP and WebSocket support
- Variables with `$VAR` and required variables with `$!VAR`
- Works as both a CLI and a library

## Quick Start

Install it:

```bash
npm install -g apicat
# or
bun add -g apicat
```

Then use it:

```bash
npx apicat
ac ls
ac httpbin.get
ac openrouter.chat API_KEY=$OPENROUTER_API_KEY MODEL=openai/gpt-4o-mini PROMPT="hello"
```

`npx apicat` and `ac` hit the same CLI.

API IDs use `<service>.<name>` form, like `httpbin.get`, `openai.chat`, or `echo.ws`.

## The Shape Of It

`ac` looks for config in this order:

1. `-config <path>`
2. `~/.apicat`
3. the bundled `.apicat`

On first interactive run, it can copy the bundled `.apicat` to `~/.apicat` so you have your own editable version.

## CLI Cheatsheet

```bash
# show help
ac

# list APIs
ac ls
ac list openai
ac ls httpbin

# show matching config lines
ac help httpbin

# use a custom config
ac -config ./custom.yaml ls
ac -config ./custom.yaml httpbin.get

# call an API with runtime vars
ac httpbin.get foo=bar
ac -time httpbin.get
ac -debug httpbin.get

# copy one API definition into local ./.apicat
ac fetch echo.ws
ac fetch openai.chat

# refresh ~/.apicat from the published config
ac update
```

## A Few Good Examples

```bash
# OpenAI-compatible API
ac openai.chat \
  OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1 \
  OPENAI_COMPATIBLE_API_KEY=$OPENAI_API_KEY \
  MODEL=gpt-4o-mini \
  PROMPT="Write a haiku about logs"

# OpenRouter
ac openrouter.chat \
  API_KEY=$OPENROUTER_API_KEY \
  MODEL=openai/gpt-4o-mini \
  PROVIDER=openai \
  PROMPT="Say hello"

# simple GET
ac httpbin.get
```

Parameters automatically fall back to matching environment variables when possible.

## Use It From Code

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

## The `.apicat` File

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

`fetch <name>` merges a definition into local `./.apicat`, creating it if needed.

## For LLM Prompts

If you want a model to learn your API definitions, point it at:

`https://raw.githubusercontent.com/beachdevs/apicat/refs/heads/master/.apicat`

## Notes

- `update` overwrites `~/.apicat` with the latest published `.apicat`
- `-config <path>` can point at any YAML file
- `apis.txt` is still supported for compatibility
