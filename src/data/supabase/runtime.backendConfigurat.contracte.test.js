/**
 * Onada R26 · Contracte de getBackendConfigurat (auditoria de Codex 261114_1737, R25.2-X01).
 *
 * El Kit R25 de Gemini esperava un objecte d'esta funció per a deduir backend i tenant, i
 * queia a sentinelles. El contracte real és un booleà: «hi ha URL i clau pública». El servei
 * del Xat (src/data/xat/serveiXat.js) ja no la fa servir per a l'abast del llinatge; esta prova
 * viu ací, al costat del mòdul, perquè cap prova de fora de src/data/supabase/ no l'importe
 * saltant-se el port (Porta Enxufe E1).
 */
import { describe, expect, it } from 'vitest';
import { getBackendConfigurat } from './runtime.js';

const CONFIG_A = Object.freeze({ dataMode: 'remote', backendUrl: 'https://a.example.test', supabaseAnonKey: 'sb_publishable_prova_a' });

describe('getBackendConfigurat · contracte booleà (R25.2-X01)', () => {
  it('torna true amb URL i clau pública, i sempre un booleà', () => {
    expect(getBackendConfigurat(CONFIG_A)).toBe(true);
    expect(typeof getBackendConfigurat(CONFIG_A)).toBe('boolean');
  });

  it('torna false (no una sentinella ni un objecte) sense configuració', () => {
    expect(getBackendConfigurat({})).toBe(false);
    expect(typeof getBackendConfigurat()).toBe('boolean');
  });
});
