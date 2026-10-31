// @vitest-environment node
/* Ordre del Mestre del 30-10-2026 (~15:00, B4) · «Llevar el marc blanc físic
   de les vinyetes antigues»: cap il·lustració de public/assets/nano_cards/
   ni de la taula de la Consola (imatgesConsola.js) porta incrustat als
   píxels un marge blanc (o crema) ni el filet de vinyeta a les 4 bandes; la
   targeta, l'Arxiu visual i la pàgina les pinten a sang.

   LÍMIT DECLARAT · No hi ha cap descodificador d'imatges a node_modules i no
   s'hi afig cap dependència (cap npm install sense el Mestre): esta prova no
   llig cap píxel. Llig el MANIFEST de mesures (voresImatges.json), fet amb
   Python i Pillow, i el lliga a cada fitxer pel sha256:
     (1) cada imatge de nano_cards i de imatgesConsola.js (també la bessona
         .webp que pinta el tauler) té entrada, i el sha256 i el pes de cada
         entrada són els del fitxer: si algú canvia una imatge sense tornar a
         mesurar-la, cau;
     (2) cap d'eixes mesures té les 4 bandes blanques ni el filet a les 4.
   La mesura és per línies senceres: un marc dibuixat a mà que només ocupa
   un tros de la vora no el veu. Per això les vinyetes retallades per B4
   s'han mirat una a una (lupa dels cantons i franges de les 4 vores) abans
   i després del retall.

   Definicions (les del camp «llindars» del manifest) · Píxel de PAPER:
   min(R,G,B) >= 200 i max-min <= 40 (blanc o crema). Píxel de TINTA:
   max(R,G,B) <= 90. Per banda, des de la vora cap a dins: «blanc» són les
   línies seguides amb un 90 % de paper o més; «filet», les línies seguides
   amb un 60 % de tinta o més que comencen dins de les 3 línies següents al
   blanc; «paper0» i «tinta0», les fraccions de la línia de la vora. Una banda
   és blanca si blanc > 0.

   Regeneració, des de l'arrel del repositori (Python 3 amb Pillow, amb WebP).
   L'eixida és determinista: si cap imatge no canvia, el fitxer no canvia.

python3 -I - > src/sections/multimedia/voresImatges.json <<'PY'
import hashlib, json, os
from PIL import Image
CARPETES = ('public/assets/nano_cards', 'public/assets/ui/plugins')
BANDES = ('dalt', 'baix', 'esquerra', 'dreta')
LP, LT, FF = 0.9, 0.6, 3
def paper(p): return min(p) >= 200 and max(p) - min(p) <= 40
def tinta(p): return max(p) <= 90
def linia(px, w, h, b, k):
    if b == 'dalt': return [px[x, k] for x in range(w)]
    if b == 'baix': return [px[x, h - 1 - k] for x in range(w)]
    if b == 'esquerra': return [px[k, y] for y in range(h)]
    return [px[w - 1 - k, y] for y in range(h)]
def mesura(rgb, b):
    w, h = rgb.size
    px = rgb.load()
    n = max(8, (h if b in ('dalt', 'baix') else w) // 6)
    f = [(sum(map(paper, l)) / len(l), sum(map(tinta, l)) / len(l)) for l in (linia(px, w, h, b, k) for k in range(n))]
    blanc = 0
    while blanc < n and f[blanc][0] >= LP: blanc += 1
    filet = 0
    for i in range(blanc, min(blanc + FF, n)):
        if f[i][1] >= LT:
            k = i
            while k < n and f[k][1] >= LT: k += 1
            filet = k - i
            break
    return [blanc, filet, round(f[0][0], 3), round(f[0][1], 3)]
def entrada(cami):
    with open(cami, 'rb') as fh: dades = fh.read()
    img = Image.open(cami)
    rgb = img.convert('RGB')
    return {'sha256': hashlib.sha256(dades).hexdigest(), 'bytes': len(dades), 'mida': list(img.size), 'format': img.format,
            'vores': {b: mesura(rgb, b) for b in BANDES}}
fitxers = sorted(os.path.join(c, n) for c in CARPETES for n in os.listdir(c) if n.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')))
cap = {'schema': 'sdp.vores-imatges.v1', 'carpetes': list(CARPETES), 'columnes': ['blanc', 'filet', 'paper0', 'tinta0'],
       'llindars': {'paper': 'min(R,G,B) >= 200 i max(R,G,B) - min(R,G,B) <= 40', 'tinta': 'max(R,G,B) <= 90',
                    'liniaPaper': LP, 'liniaTinta': LT, 'finestraFilet': FF}}
linies = ['{'] + [f' {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},' for k, v in cap.items()] + [' "imatges": {']
linies += [f'  {json.dumps(f[len("public"):])}: {json.dumps(entrada(f))}' + (',' if i < len(fitxers) - 1 else '') for i, f in enumerate(fitxers)]
print('\n'.join(linies + [' }', '}']))
PY
*/
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { IMATGES_CONSOLA, miniaturaDe } from '../consola/imatgesConsola.js';

const ARREL = process.cwd();
const MANIFEST = JSON.parse(readFileSync(path.join(ARREL, 'src/sections/multimedia/voresImatges.json'), 'utf8'));
const RASTER = /\.(?:jpe?g|png|webp)$/i;
const BANDES = Object.freeze(['dalt', 'baix', 'esquerra', 'dreta']);

const alDisc = (src) => path.join(ARREL, 'public', ...src.split('/').filter(Boolean));
const columna = (nom) => MANIFEST.columnes.indexOf(nom);
const mesura = (src, banda, nom) => MANIFEST.imatges[src].vores[banda][columna(nom)];
const quatreBlanques = (src) => BANDES.every((banda) => mesura(src, banda, 'blanc') > 0);
const filetALesQuatre = (src) => BANDES.every((banda) => mesura(src, banda, 'filet') > 0);

/* Les imatges del disc de les carpetes del manifest, amb el camí públic. */
const DEL_DISC = MANIFEST.carpetes.flatMap((carpeta) => readdirSync(path.join(ARREL, carpeta))
  .filter((nom) => RASTER.test(nom))
  .map((nom) => `/${carpeta.replace(/^public\//, '')}/${nom}`)).sort();
const NANO_CARDS = DEL_DISC.filter((src) => src.startsWith('/assets/nano_cards/'));
/* La taula de la Consola nomena l'original; el tauler en pinta la bessona. */
const DE_LA_CONSOLA = [...new Set(Object.values(IMATGES_CONSOLA)
  .filter(({ imatge }) => imatge)
  .flatMap(({ imatge }) => [imatge, miniaturaDe(imatge)]))].sort();
const ABAST = [...new Set([...NANO_CARDS, ...DE_LA_CONSOLA])].sort();

/* B4 · Les vinyetes del 3-4 d'octubre que portaven el marc als píxels, ara
   retallades a sang i reescalades a 1024 (el criteri del Cervell), en .jpg i
   en la seua bessona .webp. */
const RETALLADES = Object.freeze([
  '/assets/nano_cards/animalets_nano_card', '/assets/nano_cards/cervell_nano_card',
  '/assets/nano_cards/gestoria_nano_card', '/assets/nano_cards/lector_rss_nano_card',
  '/assets/ui/plugins/disseny_vinyeta'
].flatMap((base) => [`${base}.jpg`, `${base}.webp`]));

describe('el manifest de vores (voresImatges.json)', () => {
  test('és el de les dues carpetes, amb les columnes i els llindars de la capçalera', () => {
    expect(MANIFEST.schema).toBe('sdp.vores-imatges.v1');
    expect(MANIFEST.carpetes).toEqual(['public/assets/nano_cards', 'public/assets/ui/plugins']);
    expect(MANIFEST.columnes).toEqual(['blanc', 'filet', 'paper0', 'tinta0']);
    expect(MANIFEST.llindars).toEqual({
      paper: 'min(R,G,B) >= 200 i max(R,G,B) - min(R,G,B) <= 40', tinta: 'max(R,G,B) <= 90',
      liniaPaper: 0.9, liniaTinta: 0.6, finestraFilet: 3
    });
  });

  test('cada imatge de les carpetes té entrada, i cada entrada és una imatge de les carpetes', () => {
    expect(NANO_CARDS.length).toBeGreaterThan(20);
    expect(Object.keys(MANIFEST.imatges).sort()).toEqual(DEL_DISC);
  });

  test('cada imatge de imatgesConsola.js, i la bessona que en pinta el tauler, té entrada', () => {
    expect(DE_LA_CONSOLA.length).toBeGreaterThan(10);
    expect(DE_LA_CONSOLA.filter((src) => !Object.hasOwn(MANIFEST.imatges, src))).toEqual([]);
  });

  test.each(Object.keys(MANIFEST.imatges).sort())('%s: el pes i el sha256 són els del fitxer', (src) => {
    const bytes = readFileSync(alDisc(src));
    const missatge = `${src} ha canviat sense tornar a mesurar-la: regenera voresImatges.json (capçalera d'esta prova)`;
    expect(bytes.length, missatge).toBe(MANIFEST.imatges[src].bytes);
    expect(createHash('sha256').update(bytes).digest('hex'), missatge).toBe(MANIFEST.imatges[src].sha256);
  });
});

describe('cap marc físic a les vinyetes (B4)', () => {
  test('cap imatge de nano_cards ni de imatgesConsola.js té les 4 bandes blanques', () => {
    expect(ABAST.filter(quatreBlanques)).toEqual([]);
  });

  test('ni el filet de vinyeta a les 4 bandes', () => {
    expect(ABAST.filter(filetALesQuatre)).toEqual([]);
  });

  test('les vinyetes retallades per B4 són a sang i de 1024×1024, en .jpg i en .webp', () => {
    for (const src of RETALLADES) {
      expect(MANIFEST.imatges[src]?.mida, src).toEqual([1024, 1024]);
      for (const banda of BANDES) {
        expect([mesura(src, banda, 'blanc'), mesura(src, banda, 'filet')], `${src} · ${banda}`).toEqual([0, 0]);
      }
    }
  });

  /* Ordre del Mestre (30-10-2026, prompt 2208, T4.3; QA-T3-IMG-02) · La portada de
     Fedivers (og:image de /fedivers) ja és a sang: sense el marc blanc ni el filet a
     cap banda, amb la mateixa mida (1376×768), i la variant social, regenerada des
     d'ella, tampoc no porta les bandes blanques laterals. Ja no queda cap excepció. */
  test('a les carpetes ja no queda cap marc', () => {
    expect(DEL_DISC.filter((src) => quatreBlanques(src) || filetALesQuatre(src))).toEqual([]);
  });

  test('la portada de Fedivers i la seua variant social són a sang a les 4 bandes', () => {
    const FEDIVERS = { '/assets/ui/plugins/fedivers_vinyeta.webp': [1376, 768], '/assets/ui/plugins/fedivers_vinyeta-social-1200x630.jpg': [1200, 630] };
    for (const [src, mida] of Object.entries(FEDIVERS)) {
      expect(MANIFEST.imatges[src]?.mida, src).toEqual(mida);
      for (const banda of BANDES) {
        expect([mesura(src, banda, 'blanc'), mesura(src, banda, 'filet')], `${src} · ${banda}`).toEqual([0, 0]);
      }
    }
  });
});
