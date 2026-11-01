// @vitest-environment node
/* T3.2-UI (marató 261101) · L'adaptador del Bloc per a la fitxa de memòria
   oral de «🎴 Proposa Card»: l'hora del clic (no la de crear-lo), l'autor i
   la revisió amb sessió, i els pobles de l'aplicació. Gauntlet 2 (261101,
   G2-MO-08): l'identificador del compte no arriba mai al fitxer OKF; hi va
   `human:sense-identificador`. El relat està escrit per a esta prova: no és
   el testimoni de cap persona real. */
import { describe, expect, test, vi } from 'vitest';
import { PERSONA_SENSE_IDENTIFICADOR, memoriaOralDelBloc } from './memoriaOralDelBloc.js';
import { MOTIUS_MEMORIA, estructuraMemoriaOral, nivellDeConfianca } from './proposaCard.js';

const NOTA = Object.freeze({
  title: '',
  subtitle: '',
  lead: '',
  content: '<p>A Sella, quan arribava la collita de les olives, tot el poble anava al molí i les xiquetes portaven el berenar als bancals de dalt.</p>'
});
const ARA = new Date('2026-11-01T03:00:00Z');
const DESPRES = new Date('2026-11-01T03:05:00Z');
const HUMA = 'human:sense-identificador';

describe('memoriaOralDelBloc', () => {
  test('estructura: la fitxa del motor amb l’hora del clic, un autor humà sense identificador i els pobles de la llavor', () => {
    const rellotge = vi.fn(() => ARA);
    const { estructura } = memoriaOralDelBloc({ persona: 'u-1', rellotge });
    expect(rellotge).not.toHaveBeenCalled();
    const fitxa = estructura(NOTA);
    expect(rellotge).toHaveBeenCalledTimes(1);
    expect(fitxa).toEqual(estructuraMemoriaOral(NOTA, { ara: ARA, autor: PERSONA_SENSE_IDENTIFICADOR }));
    expect(fitxa.motiu).toBe(MOTIUS_MEMORIA.proposta);
    expect(fitxa.municipi?.nom).toBe('Sella');
    expect(fitxa.okf.frontmatter.generated).toEqual({ by: expect.stringMatching(/^socdepoble-memoria-oral\//), at: ARA.toISOString() });
    expect(fitxa.okf.frontmatter.sources[0].author).toBe(HUMA);
    expect(fitxa.okf.frontmatter.status).toBe('draft');
    expect(fitxa.okf.markdown).not.toContain('u-1');
  });

  test('els pobles de l’aplicació manen; una llista buida (encara carregant) torna a la llavor', () => {
    const pobles = [{ id: 'benimantell', title: 'Benimantell', comarca: 'la Marina Baixa', provincia: 'Alacant' }];
    const nota = { ...NOTA, content: NOTA.content.replace('A Sella', 'A Benimantell') };
    expect(memoriaOralDelBloc({ pobles, rellotge: () => ARA }).estructura(nota).municipi?.id).toBe('benimantell');
    expect(memoriaOralDelBloc({ pobles: [], rellotge: () => ARA }).estructura(nota).municipi).toBeNull();
    expect(memoriaOralDelBloc({ pobles: [], rellotge: () => ARA }).estructura(NOTA).municipi?.nom).toBe('Sella');
  });

  test('revisa: amb sessió, signa una persona sense identificador amb l’hora de la revisió, sense tocar la fitxa d’abans', () => {
    let ara = ARA;
    const adaptador = memoriaOralDelBloc({ persona: 'u-1', rellotge: () => ara });
    const fitxa = adaptador.estructura(NOTA);
    ara = DESPRES;
    const revisada = adaptador.revisa(fitxa);
    expect(revisada.okf.frontmatter.status).toBe('stable');
    expect(revisada.okf.frontmatter.verified).toEqual([{ by: HUMA, at: DESPRES.toISOString() }]);
    expect(nivellDeConfianca(revisada.okf.frontmatter)).toBe('human-reviewed');
    expect(revisada.okf.markdown).not.toContain('u-1');
    expect(revisada.okf.markdown).toMatch(/\nstatus: stable\n/);
    expect(fitxa.okf.frontmatter.status).toBe('draft');
    expect(fitxa.okf.frontmatter.verified).toBeUndefined();
  });

  test('revisa amb correcció (Gauntlet 261101, B2-04): les etiquetes i el poble que tria la persona; qui signa i quan, els posa l’adaptador', () => {
    const relat = { ...NOTA, content: '<p>A Sella, quan arribava la collita de les olives, tot el poble anava al molí, i de Xixona pujava la banda de música per a les festes.</p>' };
    const adaptador = memoriaOralDelBloc({ persona: 'u-1', rellotge: () => DESPRES });
    const fitxa = adaptador.estructura(relat);
    expect(fitxa.candidats.map((c) => c.id)).toEqual(['sella', 'xixona']);
    expect(fitxa.etiquetes.map((e) => e.id)).toEqual(expect.arrayContaining(['collita', 'festes']));
    const revisada = adaptador.revisa(fitxa, { etiquetes: ['collita'], municipi: 'xixona', persona: 'intrus', ara: '2020-01-01T00:00:00Z' });
    expect(revisada.okf.frontmatter.tags).toEqual(['collita']);
    expect(revisada.okf.frontmatter.municipi).toBe('xixona');
    expect(revisada.okf.cami).toMatch(/^memoria-oral\/xixona\//);
    expect(revisada.okf.frontmatter.verified).toEqual([{ by: HUMA, at: DESPRES.toISOString() }]);
    // Cap poble: null; sense correcció, com abans.
    expect(adaptador.revisa(fitxa, { municipi: null }).okf.frontmatter).not.toHaveProperty('municipi');
    expect(adaptador.revisa(fitxa).okf.cos).toBe(fitxa.okf.cos);
  });

  test('sense sessió (o amb un id que el motor no admet), cap revisió i cap autor', () => {
    for (const persona of [null, undefined, '', 'amb espais', ' u-1']) {
      const adaptador = memoriaOralDelBloc({ persona, rellotge: () => ARA });
      expect(adaptador.revisa, String(persona)).toBeNull();
      expect(adaptador.estructura(NOTA).okf.frontmatter.sources[0].author, String(persona)).toBeUndefined();
    }
    // Un id numèric també és una sessió, i tampoc no arriba al fitxer.
    const numeric = memoriaOralDelBloc({ persona: 42, rellotge: () => ARA });
    expect(typeof numeric.revisa).toBe('function');
    expect(numeric.estructura(NOTA).okf.frontmatter.sources[0].author).toBe(HUMA);
  });

  test('G2-MO-08 · cap identificador del compte al fitxer, ni en l’esborrany ni revisat (ni en el registre)', () => {
    const id = '7f3c9a2e-5b1d-4c8e-9a0f-2d6b8e4c1a55';
    const adaptador = memoriaOralDelBloc({ persona: id, rellotge: () => ARA });
    const esborrany = adaptador.estructura(NOTA);
    const revisada = adaptador.revisa(esborrany, { municipi: null });
    for (const fitxa of [esborrany, revisada]) expect(JSON.stringify(fitxa)).not.toContain(id);
    expect(revisada.okf.frontmatter.verified.map((v) => v.by)).toEqual([HUMA]);
    expect(PERSONA_SENSE_IDENTIFICADOR).toBe('sense-identificador');
  });

  test('l’adaptador és immutable', () => {
    const adaptador = memoriaOralDelBloc();
    expect(Object.isFrozen(adaptador)).toBe(true);
    expect(Object.keys(adaptador).sort()).toEqual(['estructura', 'revisa']);
  });
});
