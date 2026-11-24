// @vitest-environment node
import { expect, test } from 'vitest';
import { textPla } from './metadadesSocials.js';

// Referència antiga només sobre entrades de prova fitades; mai text extern.
function referencia(valor, limit = 300) {
  const entitats = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&#39;': "'" };
  const text = valor.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]*>/g, ' ')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2').replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/`/g, '')
    .replace(/[*_~]+/g, (tirada, pos, tot) => /[\p{L}\p{N}]$/u.test(tot.slice(Math.max(0, pos - 2), pos)) && /^[\p{L}\p{N}]/u.test(tot.slice(pos + tirada.length, pos + tirada.length + 2)) ? tirada : '')
    .replace(/&(?:amp|lt|gt|quot|apos|#39);/g, value => entitats[value]).replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim();
  let output = '';
  for (const char of text) { if (output.length + char.length > limit) break; output += char; }
  return output.replace(/[*_~]+$/, '').trimEnd();
}
test('R32.56: HTML/Markdown acotat conserva la semàntica anterior en dues passades', () => {
  const tokens = ['<', '>', '[', ']', '|', '(', ')', '!', '`', 'script', '</script>', '<script>', '<style>x</style>', 'a', 'é', '🙂', '*', '_', '~', '&amp;', '\n', ' '];
  let seed = 3256;
  for (let n = 0; n < 1200; n++) {
    let input = '';
    for (let k = 0; k < 24; k++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; input += tokens[seed % tokens.length]; }
    const limit = 1 + n % 90, output = textPla(input, limit);
    expect(output, input).toBe(referencia(input, limit));
    // Una entrada malmesa pot formar sintaxi nova en llevar tags; el
    // contracte ací és paritat, també en la segona passada de l'algorisme.
    expect(textPla(output, limit), input).toBe(referencia(referencia(input, limit), limit));
  }
});
