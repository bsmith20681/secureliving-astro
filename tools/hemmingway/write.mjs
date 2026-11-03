// Sends a system prompt and a user prompt to the Hemmingway API and saves the reply.
//
// Usage:
//   node tools/hemmingway/write.mjs --system <file> --user <file> --out <file>
//     [--model hemmingway-1.5] [--effort xhigh|medium|low] [--max-tokens 32768]
//
// The API key is read from HEMMINGWAY_API_KEY, either in the environment or in
// the project's .env file. Docs: https://hemmingway.io/platform/#docs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE_URL = 'https://hemmingway.io/v1';
const MAX_RETRIES = 2;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    args[argv[i].slice(2)] = argv[i + 1];
    i++;
  }
  return args;
}

function loadApiKey() {
  if (process.env.HEMMINGWAY_API_KEY) return process.env.HEMMINGWAY_API_KEY;
  const envPath = resolve(projectRoot, '.env');
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith('HEMMINGWAY_API_KEY='));
  if (!line) return null;
  return line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '');
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

// Streams the completion so long thinking phases don't hit an idle timeout.
async function streamCompletion(apiKey, body) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let code = 'unknown';
    let message = await res.text();
    try {
      const parsed = JSON.parse(message).error;
      code = parsed.code;
      message = parsed.message;
    } catch {}
    const error = new Error(`${res.status} ${code}: ${message}`);
    error.retryable = res.status === 502 || (res.status === 429 && code === 'busy');
    throw error;
  }

  let content = '';
  let reasoning = '';
  let finishReason = null;
  let usage = null;
  let buffer = '';
  const decoder = new TextDecoder();

  for await (const chunk of res.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.startsWith('data:')) continue; // skips ": keep-alive" comments
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      const event = JSON.parse(data);
      if (event.usage) usage = event.usage;
      const choice = event.choices?.[0];
      if (!choice) continue;
      if (choice.delta?.content) content += choice.delta.content;
      // The docs name the field reasoning_content; some servers send it as reasoning.
      const thought = choice.delta?.reasoning_content ?? choice.delta?.reasoning;
      if (thought) {
        if (!reasoning) process.stderr.write('Thinking');
        reasoning += thought;
        if (reasoning.length % 2000 < thought.length) process.stderr.write('.');
      }
      if (choice.finish_reason) finishReason = choice.finish_reason;
    }
  }
  if (reasoning) process.stderr.write('\n');

  return { content, reasoning, finishReason, usage, requestId: res.headers.get('x-request-id') };
}

const args = parseArgs(process.argv.slice(2));
if (!args.system || !args.user || !args.out) {
  fail('usage: node tools/hemmingway/write.mjs --system <file> --user <file> --out <file>');
}

const apiKey = loadApiKey();
if (!apiKey) fail('HEMMINGWAY_API_KEY is not set. Add it to .env in the project root.');
if (!apiKey.startsWith('hemmingway_live_')) fail('HEMMINGWAY_API_KEY should start with "hemmingway_live_".');

const body = {
  model: args.model ?? 'hemmingway-1.5',
  reasoning_effort: args.effort ?? 'xhigh',
  max_tokens: Number(args['max-tokens'] ?? 32768),
  stream: true,
  stream_options: { include_usage: true },
  messages: [
    { role: 'system', content: readFileSync(args.system, 'utf8') },
    { role: 'user', content: readFileSync(args.user, 'utf8') },
  ],
};

console.error(`Sending to ${body.model} (effort: ${body.reasoning_effort})...`);

let result;
for (let attempt = 0; ; attempt++) {
  try {
    result = await streamCompletion(apiKey, body);
    break;
  } catch (error) {
    if (!error.retryable || attempt >= MAX_RETRIES) fail(error.message);
    console.error(`${error.message}. Retrying in 15 seconds...`);
    await new Promise((r) => setTimeout(r, 15000));
  }
}

if (!result.content.trim()) fail(`The model returned no content (finish reason: ${result.finishReason}).`);

mkdirSync(dirname(resolve(args.out)), { recursive: true });
writeFileSync(args.out, result.content);
if (result.reasoning) writeFileSync(args.out.replace(/\.md$/, '') + '.thinking.md', result.reasoning);

const u = result.usage ?? {};
const cached = u.prompt_tokens_details?.cached_tokens ?? 0;
const cost =
  ((u.prompt_tokens - cached) * 0.24 + cached * 0.024 + u.completion_tokens * 0.9) / 1_000_000;

console.error(`Saved ${args.out}`);
console.error(
  `Tokens: ${u.prompt_tokens ?? '?'} in (${cached} cached), ${u.completion_tokens ?? '?'} out. ` +
    `Cost: about $${Number.isFinite(cost) ? cost.toFixed(4) : '?'}. Request id: ${result.requestId}`,
);
if (result.finishReason === 'length') {
  console.error('Warning: the reply hit max_tokens and is cut off. Shorten the prompt or lower the effort and run again.');
  process.exit(2);
}
