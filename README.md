<p align="center">
  <img src="./logo.png" alt="apicat logo" width="220" />
</p>

`apicat` is a tiny API caller.

Keep your API definitions in YAML, then list them, inspect them, and fire them off from the CLI or from JavaScript. It is built for quick experiments, repeatable calls, and "what was that curl again?" moments.

## ⚡ Quick Start

```bash
npx apicat <ls | service.name> KEY=VALUE
```

or install:

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

## 🤖 apicat for your LLM

No installation required.

If you want a model to learn your API definitions, tell it:

`Learn api definitions from https://unpkg.com/apicat`



Variables can be defined in the call or will be used if named the same in env. `API_KEY` also falls back to `OPENROUTER_API_KEY`, `OPENAI_API_KEY`, or `CEREBRAS_API_KEY`.

API IDs use `<service>.<name>` form, like `httpbin.get`, `openai.chat`, or `echo.ws`.

## 🎉 API goodness

- One command: `apic`
- One bundled config file: `apicat.yaml`
- Optional user config: `~/.apicat`
- HTTP and WebSocket support
- Variables with `$VAR` and required variables with `$!VAR`
- Works as a CLI, a library, and an exported CLI module
- No package dependencies or lockfile

## 🧠 How It Thinks

On first interactive run, it can copy the bundled `apicat.yaml` to `~/.apicat` so you have your own editable version instead of poking at the packaged one.

## 🧰 CLI Cheatsheet

```bash
# show the menu
apic

# list the toy box
apic ls
apic list openai
apic ls httpbin

# ls prints a blank line before and after the colored entries

# grep, but friendlier
apic help httpbin

# show help defined for one API
apic openai.chat --help

# catfact.getFact uses its jq field to print only the fact
apic catfact.getFact

# bring your own config
apic -config ./custom.yaml ls
apic -config ./custom.yaml httpbin.get

# call something
apic httpbin.get foo=bar
apic -time httpbin.get
apic -debug httpbin.get

# refresh ~/.apicat from the published apicat.yaml
apic update
```

## 🪄 A Few Good Tricks

```bash
# OpenAI-compatible chat
apic openai.chat \
  OPENAI_URL=https://api.openai.com \
  OPENAI_API_KEY=$OPENAI_API_KEY \
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

Variables automatically fall back to matching environment variables when possible.

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
    OPENAI_URL: 'https://api.openai.com',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MODEL: 'gpt-4o-mini',
    PROMPT: 'Hello world'
  }
});

console.log(await chat.json());
```

For an OpenRouter chat completion, pass the values referenced by the
`openrouter.chat` definition in `vars`:

```javascript
import { fetchApi } from 'apicat';

const res = await fetchApi('openrouter', 'chat', {
  vars: {
    API_KEY: process.env.OPENROUTER_API_KEY,
    MODEL: 'openai/gpt-4.1-mini',
    OPTIONAL_PROMPT: 'Be concise.',
    PROMPT: 'Give me one interesting cat fact.',
    PROVIDER: 'openai'
  }
});

if (!res.ok) throw new Error(`OpenRouter request failed: ${res.status} ${await res.text()}`);

const data = await res.json();
console.log(data.choices[0].message.content);
```

`fetchApi` returns a normal Fetch `Response`, so you can use `status`, `ok`, `headers`, `text()`, `json()`, and the rest of the usual response methods.

You can also import the CLI runner directly:

```javascript
import { runCli } from 'apicat/cli';

const code = await runCli(['ls']);
```

## 📜 The `apicat.yaml` Spellbook

Top-level keys are `service.name`.

```yaml
httpbin.get:
  url: https://httpbin.org/get
  method: GET
  headers: {}
  help: Send a GET request to httpbin.org/get.

catfact.getFact:
  url: https://catfact.ninja/fact
  method: GET
  headers: {}
  jq: .fact
  help: Fetch a random cat fact.

openai.chat:
  url: $!OPENAI_URL/v1/chat/completions
  method: POST
  headers:
    Authorization: "Bearer $!OPENAI_API_KEY"
  body: |
    {
      "model": "$!MODEL",
      "messages": [{"role": "system", "content": "$SYSTEM_PROMPT"}, {"role": "user", "content": "$!PROMPT"}],
      "think": false,
      "stream": false
    }

echo.ws:
  url: wss://echo-websocket.fly.dev/.ws
  body: $!PROMPT
```

Use an optional `help` string to describe an API. `apic service.name --help` prints it and exits without making a request.

Use an optional `jq` expression to filter an HTTP JSON response with `jq -r`. For example, `jq: .fact` makes `apic catfact.getFact` print only the fact instead of the complete response. This requires the `jq` command to be installed.
