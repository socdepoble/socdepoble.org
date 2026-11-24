/** Shared pure endpoint selector. Names such as Node 0 / IAIA alone do not
 * identify inference: the same service also serves deterministic human APIs. */
const AI_HOSTS = ['api.openai.com','api.anthropic.com','generativelanguage.googleapis.com','api.mistral.ai','api.groq.com','api.deepseek.com','api.cohere.ai','api.cohere.com','api-inference.huggingface.co','api.together.xyz','openrouter.ai'];
export function classificaEndpoint(value) {
  if(typeof value!=='string')return 'dynamic';
  let url;try{url=new URL(value,'https://fixture.invalid');}catch{return 'dynamic';}
  if(url.port==='11434'||AI_HOSTS.some(host=>url.hostname===host||url.hostname.endsWith(`.${host}`))
    ||/^\/api\/v1\/node0\/(?:veu|iaia)(?:\/|$)/.test(url.pathname)
    ||/^\/(?:__iaia\/traduir|functions\/v1\/iaia)(?:\/|$)/.test(url.pathname)
    ||/\/(?:api\/generate|api\/chat|v1\/chat\/completions|v1\/embeddings|v1\/messages)(?:\/|$)/.test(url.pathname))return 'ai';
  return 'non-ai';
}
