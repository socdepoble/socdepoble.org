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

/* Onada R30 · T3-VOC · Les quinze classes foranes que quedaven (línia base
   .agents/deute/.vocabulari-deute.json, V1, a la base d'R30). Cap no tenia regla en
   cap full de src/ (tampoc a public/, index.html ni wordpress-plugin/):
     · catorze eren mortes i se'n van (els elements es queden igual);
     · page-title-logo-personalitzat era un ganxo de focus i de proves: ara és
       data-sdp-ranura="logotip-personalitzat", com les ranures del desplegable.
   Llei del Píxel: una classe sense cap regla no pinta res. Els únics selectors que
   miren l'atribut class sense nomenar-ne cap (:not([class]), [class=""]) són de
   prosa (article.content-wrapper, .sdp-prose) o d'img/a/code/pre; cap element
   tocat no hi entra (vegeu l'informe a1_classes_foranes). */
const RETIRADES_R30 = Object.freeze([
  { fitxer: 'src/app/guards/RequireAuth.jsx', classe: 'sdp-route-loading-screen' },
  { fitxer: 'src/components/ErrorBoundary.jsx', classe: 'alert' },
  { fitxer: 'src/components/PedraSeca/atoms/Divisor.jsx', classe: 'sdp-divisor--amb-text' },
  { fitxer: 'src/components/PedraSeca/atoms/Divisor.jsx', classe: 'sdp-divisor__text' },
  { fitxer: 'src/components/universal/PageFrame.jsx', classe: 'page-title-logo-personalitzat' },
  { fitxer: 'src/components/universal/UniversalEditorShell.jsx', classe: 'sdp-estat' },
  { fitxer: 'src/components/universal/UniversalEditorShell.jsx', classe: 'sdp-estat--error' },
  { fitxer: 'src/components/universal/UniversalEditorShell.jsx', classe: 'sdp-estat__contenidor' },
  { fitxer: 'src/components/universal/UniversalEditorShell.jsx', classe: 'sdp-estat__descripcio' },
  { fitxer: 'src/components/universal/UniversalEditorShell.jsx', classe: 'sdp-estat__titol' },
  { fitxer: 'src/components/universal/workspace/SlotErrorBoundary.jsx', classe: 'sdp-pre-wrap' },
  { fitxer: 'src/components/universal/workspace/SlotErrorBoundary.jsx', classe: 'sdp-slot-error' },
  { fitxer: 'src/components/universal/workspace/SlotErrorBoundary.jsx', classe: 'section-title' },
  { fitxer: 'src/sections/profile/DetallAjust.jsx', classe: 'sdp-camp__check' },
  { fitxer: 'src/sections/profile/DetallAjust.jsx', classe: 'sdp-form' }
]);

describe('Onada R30 · V1 · classe-forastera: les quinze classes sense regla ja no hi són', () => {
  let escaneig;
  beforeAll(() => { escaneig = escaneja(); }, 120000);
  const id = ({ fitxer, classe }) => `classe-forastera|${fitxer}|${classe}`;

  test('la porta de veres no en troba cap, i la línia base ja no n\'admet cap', () => {
    expect(escaneig.vocab.size).toBeGreaterThan(1000);
    const trobades = new Set(escaneig.infraccions
      .filter((i) => i.regla === 'classe-forastera')
      .map((i) => `classe-forastera|${normalitza(i.fitxer)}|${i.token}`));
    expect(RETIRADES_R30.map(id).filter((x) => trobades.has(x))).toEqual([]);
    const deute = JSON.parse(readFileSync(path.join(ARREL, '.agents/deute/.vocabulari-deute.json'), 'utf8'));
    const admeses = new Set(deute['classe-forastera']?.identitats ?? []);
    expect(RETIRADES_R30.map(id).filter((x) => admeses.has(x))).toEqual([]);
  });

  test('cap full de src/ pinta cap de les quinze (Llei del Píxel)', () => {
    const css = fullsCss().map((f) => senseComentaris(readFileSync(path.join(ARREL, f), 'utf8'))).join('\n');
    for (const { classe } of RETIRADES_R30) {
      expect(css, classe).not.toMatch(new RegExp(`\\.${classe.replace(/-/g, '\\-')}(?![\\w-])`));
    }
  });

  test('cap fitxer tocat no torna a escriure la classe, i la ranura del logotip de PageFrame porta el ganxo nou', () => {
    for (const { fitxer, classe } of RETIRADES_R30) {
      const codi = readFileSync(path.join(ARREL, fitxer), 'utf8');
      expect(codi, `${fitxer} · ${classe}`).not.toMatch(new RegExp(`className=[^>]*["'\` ]${classe.replace(/-/g, '\\-')}["'\` ]`));
    }
    const marc = readFileSync(path.join(ARREL, 'src/components/universal/PageFrame.jsx'), 'utf8');
    expect(marc).toContain('<div data-sdp-ranura="logotip-personalitzat">');
    const closca = readFileSync(path.join(ARREL, 'src/components/universal/UniversalEditorShell.jsx'), 'utf8');
    expect(closca.match(/\[data-sdp-ranura="logotip-personalitzat"\]/g)?.length).toBeGreaterThanOrEqual(2);
    expect(closca).not.toContain('.page-title-logo-personalitzat');
    const perfil = readFileSync(path.join(ARREL, 'src/sections/profile/PerfilEditor.jsx'), 'utf8');
    expect(perfil).toContain('.sdp-editor-document [data-sdp-ranura="logotip-personalitzat"] button:not(:disabled)');
    expect(perfil).not.toContain('.page-title-logo-personalitzat');
  });
});
