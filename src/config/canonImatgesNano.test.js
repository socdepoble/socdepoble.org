// @vitest-environment node
/* IDEA-250 (Onada R24) · Certificació física i contractual de les 9 imatges mestres del Nano
   i guarda executable d'ancoratge multi-imatge («Style Lock» de 3–4 referències). */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  CANON_9_IMATGES_MESTRES_NANO,
  COMPOSICIONS_NANO,
  INVARIANTS_MORFOLOGIQUES_NANO,
  MAX_REFERENCIES_STYLE_LOCK,
  MIN_REFERENCIES_STYLE_LOCK,
  RESOLUCIO_QUADRADA_CANONICA_PX,
  seleccionaReferenciesPerComposicio,
  validaReferenciesStyleLockNano
} from './canonImatgesNano.js';

const ARREL = process.cwd();

describe('IDEA-250 · Cànon de les 9 imatges mestres del Nano i Style Lock', () => {
  test('declara exactament les 9 imatges mestres i totes existixen físicament amb bytes reals a public/', () => {
    expect(CANON_9_IMATGES_MESTRES_NANO).toHaveLength(9);
    expect(INVARIANTS_MORFOLOGIQUES_NANO).toHaveLength(6);
    expect(RESOLUCIO_QUADRADA_CANONICA_PX).toBe(1600);

    const ids = new Set();
    for (const entrada of CANON_9_IMATGES_MESTRES_NANO) {
      expect(ids.has(entrada.id), entrada.id).toBe(false);
      ids.add(entrada.id);
      expect(COMPOSICIONS_NANO).toContain(entrada.composicio);
      expect(entrada.descripcioCanonica.length).toBeGreaterThan(30);

      const rutaHr = resolve(ARREL, entrada.camiAltaResolucio);
      expect(existsSync(rutaHr), entrada.camiAltaResolucio).toBe(true);
      const statHr = statSync(rutaHr);
      expect(statHr.size, entrada.camiAltaResolucio).toBeGreaterThan(10_000);
      const capHr = readFileSync(rutaHr).subarray(0, 3);
      // Signatura JPEG (FF D8 FF)
      expect([capHr[0], capHr[1], capHr[2]], entrada.camiAltaResolucio).toEqual([0xff, 0xd8, 0xff]);

      const rutaPublic = resolve(ARREL, `public${entrada.camiPublic}`);
      expect(existsSync(rutaPublic), entrada.camiPublic).toBe(true);
      expect(statSync(rutaPublic).size, entrada.camiPublic).toBeGreaterThan(5_000);
    }
  });

  test('coincidix 100% amb la llista mestra de .agents/skills/core-calibratge-visual-nano/SKILL.md', () => {
    const skill = readFileSync(resolve(ARREL, '.agents/skills/core-calibratge-visual-nano/SKILL.md'), 'utf8');
    for (const entrada of CANON_9_IMATGES_MESTRES_NANO) {
      expect(skill).toContain(`\`${entrada.camiAltaResolucio}\``);
    }
  });

  test('validaReferenciesStyleLockNano exigix entre 3 i 4 imatges canòniques sense duplicats ni rutes alienes', () => {
    expect(MIN_REFERENCIES_STYLE_LOCK).toBe(3);
    expect(MAX_REFERENCIES_STYLE_LOCK).toBe(4);

    expect(validaReferenciesStyleLockNano(null)).toEqual({ ok: false, codi: 'format-invalid' });
    expect(validaReferenciesStyleLockNano(['public/assets/ui/plugins/disseny_vinyeta.jpg', 'public/assets/nano_cards/snippet_nano_card.jpg']))
      .toEqual({ ok: false, codi: 'poques-referencies', minim: 3 });

    const cinc = CANON_9_IMATGES_MESTRES_NANO.slice(0, 5).map((e) => e.camiAltaResolucio);
    expect(validaReferenciesStyleLockNano(cinc)).toEqual({ ok: false, codi: 'massa-referencies', maxim: 4 });

    expect(validaReferenciesStyleLockNano([
      'public/assets/ui/plugins/disseny_vinyeta.jpg',
      'public/assets/nano_cards/snippet_nano_card.jpg',
      'public/assets/inventat/fora_de_canon.jpg'
    ])).toEqual({
      ok: false,
      codi: 'fora-del-canon',
      referencia: 'public/assets/inventat/fora_de_canon.jpg'
    });

    expect(validaReferenciesStyleLockNano([
      'public/assets/ui/plugins/disseny_vinyeta.jpg',
      '/Users/demo/socdepoble.org/public/assets/ui/plugins/disseny_vinyeta.jpg',
      'public/assets/nano_cards/snippet_nano_card.jpg'
    ])).toEqual({
      ok: false,
      codi: 'referencia-duplicada',
      id: 'disseny-vinyeta'
    });

    for (const composicio of COMPOSICIONS_NANO) {
      const triades = seleccionaReferenciesPerComposicio(composicio, 4);
      expect(triades).toHaveLength(4);
      expect(triades[0].composicio).toBe(composicio);
      const validacio = validaReferenciesStyleLockNano(
        triades.map((e) => `/abs/repo/${e.camiAltaResolucio}`)
      );
      expect(validacio.ok).toBe(true);
      expect(validacio.imatges.map((i) => i.id)).toEqual(triades.map((t) => t.id));
    }
  });
});
