// @vitest-environment node
/* Cicle 3 del Gauntlet (261030), àrea VD · vocabulari de llei dura.
   La porta tooling/gates/tractor-vocabulari.mjs (V1 · classe-forastera) donava
   per NOVES quatre classes que ja eren a HEAD i que cap full declarava, perquè
   no tenien cap regla: eren ganxos de focus o de proves.
     · sdp-edicio-avancada__capcalera i __logotip (UniversalEditorShell):
       ara data-sdp-ranura="capcalera" | "logotip"; hi apunten DESTINS_FOCUS i
       DESTI_FOCUS_RANURA del Perfil;
     · sdp-boto-targeta-viva (TargetaViva): fora; el xip es troba pel nom;
     · sdp-enquadrament--senzill (DialegEnquadrament): fora; el mode senzill
       ja el diu sdp-enquadrament__dialeg--senzill.
   Llei del Píxel: cap d'estes classes tenia regla en cap full (ni ara ni a
   HEAD), i el ganxo nou tampoc en té cap: el DOM pintat és el mateix. La línia
   base .agents/deute/.vocabulari-deute.json és de governança i no es toca.
   sdp-traduccio-cos (PageFrame) és d'una altra àrea i no entra ací. */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { escaneja } from '../../../tooling/gates/tractor-vocabulari.mjs';

const ARREL = process.cwd();
const normalitza = (ruta) => ruta.split(path.sep).join('/');

const GANXOS = Object.freeze([
  { fitxer: 'src/components/universal/UniversalEditorShell.jsx', classe: 'sdp-edicio-avancada__capcalera' },
  { fitxer: 'src/components/universal/UniversalEditorShell.jsx', classe: 'sdp-edicio-avancada__logotip' },
  { fitxer: 'src/components/universal/TargetaViva.jsx', classe: 'sdp-boto-targeta-viva' },
  { fitxer: 'src/components/universal/enquadrament/DialegEnquadrament.jsx', classe: 'sdp-enquadrament--senzill' }
]);

/* Tots els fulls CSS de src/ (també els que no són canònics: si un full
   pintara una d'estes classes, llevar-la canviaria píxels). */
function fullsCss(dir = 'src', acc = []) {
  for (const nom of readdirSync(path.join(ARREL, dir))) {
    if (nom === 'node_modules' || nom.startsWith('.')) continue;
    const rel = path.join(dir, nom);
    if (statSync(path.join(ARREL, rel)).isDirectory()) fullsCss(rel, acc);
    else if (nom.endsWith('.css')) acc.push(rel);
  }
  return acc;
}
const senseComentaris = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('V1 · classe-forastera: els quatre ganxos sense estil ja no són classes', () => {
  let escaneig;
  beforeAll(() => { escaneig = escaneja(); }, 120000);

  test('la porta de veres (escaneja) no troba cap dels quatre', () => {
    /* Sonda: la porta ha llegit el vocabulari i escaneja el JSX. */
    expect(escaneig.vocab.size).toBeGreaterThan(1000);
    expect(escaneig.vocab.has('sdp-edicio-avancada__imatge')).toBe(true);
    const trobades = escaneig.infraccions
      .filter((i) => i.regla === 'classe-forastera')
      .map((i) => `${normalitza(i.fitxer)}|${i.token}`);
    expect(GANXOS.map(({ fitxer, classe }) => `${fitxer}|${classe}`).filter((id) => trobades.includes(id))).toEqual([]);
  });

  test('cap full de src/ pinta les classes retirades ni el ganxo nou (Llei del Píxel)', () => {
    const fulls = fullsCss();
    expect(fulls.length).toBeGreaterThan(10);
    const css = fulls.map((f) => senseComentaris(readFileSync(path.join(ARREL, f), 'utf8'))).join('\n');
    for (const { classe } of GANXOS) {
      expect(css, classe).not.toMatch(new RegExp(`\\.${classe.replace(/-/g, '\\-')}(?![\\w-])`));
    }
    expect(css).not.toContain('data-sdp-ranura');
  });

  test('les ranures del desplegable porten data-sdp-ranura, i els destins del focus hi apunten', () => {
    const closca = readFileSync(path.join(ARREL, 'src/components/universal/UniversalEditorShell.jsx'), 'utf8');
    expect(closca).toContain('<div className="sdp-edicio-avancada__imatge" data-sdp-ranura="capcalera">');
    expect(closca).toContain('<div className="sdp-edicio-avancada__imatge" data-sdp-ranura="logotip">');
    expect(closca.match(/\[data-sdp-ranura="capcalera"\]/g)?.length).toBeGreaterThanOrEqual(3);
    expect(closca.match(/\[data-sdp-ranura="logotip"\]/g)?.length).toBeGreaterThanOrEqual(2);
    const perfil = readFileSync(path.join(ARREL, 'src/sections/profile/PerfilEditor.jsx'), 'utf8');
    expect(perfil).toContain('.sdp-editor-document [data-sdp-ranura="logotip"] button:not(:disabled)');
  });
});
