import { fetchApi } from 'apicat';

const res = await fetchApi('openrouter', 'chat', {
  vars: {
    API_KEY: process.env.OPENROUTER_API_KEY,
    MODEL: 'openai/gpt-4.1-mini',
    PROMPT: 'Give me one interesting cat fact.',
    OPTIONAL_PROMPT: 'Be concise.',
    PROVIDER: 'openai'
  }
});

if (!res.ok) throw new Error(`OpenRouter request failed: ${res.status} ${await res.text()}`);

const data = await res.json();
console.log(data.choices[0].message.content);
