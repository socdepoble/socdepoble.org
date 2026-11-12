/* Onada R18 · Carril 3 (Kit R18.3 de Gemini Carbon: P0-97, P0-100 i P0-101), amb les correccions de l'arbitratge R18.
   Les proves fixen el que hi ha a l'arbre, no el que el kit prometia:
   · P0-97 · La marca «Sóc de Poble» no es traduïx al nom de l'app d'iPhone (InfoPlist.strings de cada llengua). Les
     metadades de botiga (scripts/botigues/metadades-aso-app-store.json) són del carril de MarIA i no es lligen ací.
   · P0-100 · /page/arbres-monumentals presenta la Biblioteca Multipoble amb el llibre de La Torre: el nombre d'arbres
     ix del catàleg de 2020 (ARBRES_MONUMENTALS_2020), la fitxa CIEF v232 és una projecció de lectura i cap format
     d'intercanvi (Darwin Core, JSON-LD, GeoJSON, BibTeX) no es nomena mentre cap mòdul no l'exporte.
   · P0-101 · /disseny explica el sostre de l'entrada, l'avís de les eines en proves amb el text que veu el veí
     (TEXTOS_BETA_OBERTA) i les quatre columnes, sense cap nom de classe CSS a la prosa pública. La insígnia s'aplica
     dins de la targeta: la regla de .sp-card-labels no li torna la píndola ni el nowrap. Cap container-type a
     l'<aside> del Workspace (modules.css ho documenta: encongix la navegació).
   · Arbitratge R18.3 · Tractor-promesa: la foto de 2020 només en els arbres que la tenen (P1-b), les cotes pendents
     són les de 2007 (P2-d), cap «paquet de dades» (P2-e), la prova de /disseny diu que llig les traduccions (P2-f) i
     agents_equip_ia.md no promet eines obertes a la comunitat ni cap consola inexistent (P1-a). */
import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PAGE_COPY } from './pageContent.js';
import { localitzaPagina } from './pageContent.r10.js';
import { ESTAT_PROVES, PLUGINS, TEXTOS_BETA_OBERTA } from '../plugins/registrePlugins.js';
import { ARBRES_MONUMENTALS_2020 } from '../../data/patrimoni/arbresMonumentals2020.js';

const llegix = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const LLENGUES = ['ca', 'es', 'en', 'eu', 'gl'];
const MARCA_TRADUIDA = /Soy de Pueblo|I'm from the Village|Son de Pobo|Herrikoa Naiz/i;
/* Arbitratge R18.3 (P1-b) · Els arbres que tenen foto de 2020 (fotos.foto2020), comptats a les dades. */
const AMB_FOTO_2020 = ARBRES_MONUMENTALS_2020.filter((a) => Boolean(a.fotos?.foto2020)).length;
const ARBRES_AMB_FOTO = { ca: 'arbres', es: 'árboles', en: 'trees', eu: 'zuhaitzetan', gl: 'árbores' };

describe('Onada R18 · Carril 3 (Gemini Carbon) · P0-97, P0-100 i P0-101', () => {
  test('P0-97 / IDEA-228 · «Sóc de Poble» és el nom de l’app d’iPhone en les cinc llengües, sense traduir', () => {
    for (const lang of LLENGUES) {
      const plist = llegix(`ios/App/App/${lang}.lproj/InfoPlist.strings`);
      expect(plist, lang).toContain('"CFBundleDisplayName" = "Sóc de Poble";');
      expect(plist, lang).not.toMatch(MARCA_TRADUIDA);
    }
  });

  test('P0-100 / IDEA-231 · /page/arbres-monumentals presenta la Biblioteca Multipoble en 5 llengües, amb les xifres de les dades i sense formats que no existixen', () => {
    const lemes = {
      ca: 'Sóc de Poble, Portal de Pobles Connectats',
      es: 'Sóc de Poble, Portal de Pobles Connectats',
      en: 'Sóc de Poble, Connected Villages Portal',
      gl: 'Sóc de Poble, Portal de Pobos Conectados',
      eu: 'Sóc de Poble, Herri Konektatuen Ataria'
    };
    for (const [lang, lema] of Object.entries(lemes)) {
      const p = localitzaPagina(PAGE_COPY['arbres-monumentals'], lang);
      expect(p.contentLanguage).toBe(lang);
      expect(p.subtitle, lang).toContain(lema);
      expect(p.lead, lang).toContain(String(ARBRES_MONUMENTALS_2020.length));
      expect(p.lead, lang).toContain('2020');
      expect(p.lead, lang).toContain('El Rentonar');
      expect(p.lead, lang).toContain('Pedro Ferrer Rodriguez');
      for (const terme of ['CIEF v232', 'UTM ETRS89']) expect(p.html, `${lang} -> ${terme}`).toContain(terme);
      // Els germans de la biblioteca: l'herbari, el banc de llavors, l'anatomia rural i La IAIA Sabuda.
      for (const ruta of ['/page/herbari', '/page/banc-de-llavors', '/page/anatomia-rural', '/page/la-iaia-sabuda']) {
        expect(p.html, `${lang} -> ${ruta}`).toContain(`href="${ruta}"`);
      }
      expect(p.html, lang).not.toMatch(/Darwin Core|JSON-LD|GeoJSON|BibTeX|\b22 (exemplars|ejemplares|specimens|aleak|exemplares)/);
      /* Arbitratge R18.3 (P1-b i P2-d) · Cap comparador 2007 ↔ 2020 promés a cada arbre: el nombre d'arbres amb foto
         de 2020 ix de les dades, i les cotes pendents de contrastar són les de 2007 (el catàleg no en té de 2020). */
      expect(p.html, `${lang} -> foto 2020`).toContain(`<strong>${AMB_FOTO_2020} ${ARBRES_AMB_FOTO[lang]}</strong>`);
      expect(p.html, lang).not.toContain('2007 ↔ 2020');
      expect(p.html, lang).not.toMatch(/edici[óo]n? de 2020|2020 edition|2020ko edizioa/);
      expect([p.title, p.subtitle, p.lead, p.html].join(' '), lang).not.toMatch(MARCA_TRADUIDA);
    }
  });

  /* Arbitratge R18.3 (P2-f) · Esta prova llig les traduccions de PAGE_COPY.disseny (localitzaPagina), no la pantalla:
     DesignSection.jsx encara no passa per localitzaPagina. Quan ho faça, cal afegir-hi una prova de render. */
  test('P0-101 / IDEA-232 · les traduccions de PAGE_COPY.disseny (ca, es, en, eu i gl) documenten el sostre de l’entrada, les eines en proves i les quatre columnes, amb el text de la insígnia que veu el veí', () => {
    for (const lang of LLENGUES) {
      const p = localitzaPagina(PAGE_COPY.disseny, lang);
      expect(p.contentLanguage).toBe(lang);
      expect(p.html, lang).toContain('250');
      expect(p.html, lang).toContain(TEXTOS_BETA_OBERTA[lang]);
      expect(p.html, lang).toContain('href="/control"');
      expect(p.html, lang).toContain('href="/wikidepoble"');
      expect(p.html, lang).toContain('Noto Sans');
      expect(p.html, lang).not.toContain('<code>.sdp-');
      // Cap promesa general: cap càrrega «sota demanda» ni eines «obertes per defecte».
      expect([p.lead, p.html].join(' '), lang).not.toMatch(/sota demanda|bajo demanda|baixo demanda|lazy-loaded|eskaeraren arabera|per defecte|por defecto|desendollable|desenchufable/i);
      // Arbitratge R18.3 (P2-e) · Cap «paquet de dades»: importacioPaquetMunicipal és una capacitat absent.
      expect(p.html, lang).not.toMatch(/paquets? de dades|paquetes de datos|data packages|datu-pakete/i);
    }
  });

  test('P0-101 / IDEA-232 · CSS Pedra Seca: la insígnia «En proves · Beta oberta» guanya dins de la targeta, i cap container-type a l’<aside> del Workspace', () => {
    const componentsCss = llegix('src/css/components.css');
    const modulesCss = llegix('src/css/modules.css');
    expect(componentsCss).toMatch(/\.sdp-insignia-beta-oberta\s*\{[\s\S]*?border-radius:\s*0;[\s\S]*?white-space:\s*normal;[\s\S]*?overflow-wrap:\s*anywhere;/);
    // La regla de la targeta (0,2,0) va darrere de la base i davant de la insígnia, que hi pesa més (0,3,0).
    const etiquetaDeTargeta = componentsCss.indexOf('.sp-card-labels .sp-card-label,\n.sp-card-label {');
    const insigniaDeTargeta = componentsCss.indexOf('.sp-card-labels .sp-card-label.sdp-insignia-beta-oberta,');
    expect(etiquetaDeTargeta).toBeGreaterThan(-1);
    expect(insigniaDeTargeta).toBeGreaterThan(etiquetaDeTargeta);
    const regla = componentsCss.slice(insigniaDeTargeta, componentsCss.indexOf('}', insigniaDeTargeta));
    expect(regla).toMatch(/height:\s*auto;/);
    expect(regla).toMatch(/white-space:\s*normal;/);
    expect(regla).toMatch(/border-radius:\s*0;/);
    // Cap regla posa contenció d'amplària a l'<aside class="sdp-workspace-column">.
    expect(modulesCss).not.toMatch(/\.sdp-workspace-column\s*(?:,[^{}]*)?\{[^}]*container-type/);
  });

  test('Vocabulari d’equip IA: agents_equip_ia.md sense «sobirà/sobirana», sense infraestructura interna i amb «La IAIA Sabuda»', () => {
    const wiki = llegix('_wiki_de_poble/01_ser/agents_equip_ia.md');
    expect(wiki).not.toMatch(/sobir/i);
    expect(wiki).toContain('Cerca Verificada');
    expect(wiki).toContain('seguiment independent');
    expect(wiki).toContain('/page/la-iaia-sabuda');
    // La pàgina és pública (wikiManifest, rag-index i connector de WordPress): cap port, ruta interna ni base de dades local.
    expect(wiki).not.toMatch(/\bollama\b|11434|:3456|~\/\.hermes|state\.db/i);
  });

  test('Tractor-promesa (arbitratge R18.3, P1-a) · agents_equip_ia.md no promet eines obertes a la comunitat ni una consola que no existix', () => {
    const wiki = llegix('_wiki_de_poble/01_ser/agents_equip_ia.md');
    // Cap component del codi viu es diu així: només el trobava el manifest generat des d'esta mateixa Wiki.
    expect(wiki).not.toContain('ConsolaNodeZeroClean');
    // Consola i Cervell ja no són del registre (Onada 8): la frontera dels plugins no els pot nomenar, i diu quin avís
    // porta una eina en proves amb el text que veu el veí.
    const plugins = wiki.split('\n').find((linia) => linia.startsWith('- **Plugins i Laboratori'));
    expect(plugins).toBeDefined();
    expect(plugins).not.toMatch(/`Consola`|`Cervell`|`Snippet`/);
    expect(plugins).toContain(`«${TEXTOS_BETA_OBERTA.ca}»`);
    const enProves = PLUGINS.filter((plugin) => plugin.estat === ESTAT_PROVES);
    if (enProves.length === 0) {
      // Sense cap eina en proves al registre, cap eina del Panell està «oberta a la comunitat».
      expect(wiki).not.toMatch(/obert(?:a|es|s)? a la comunitat/i);
    } else {
      // P0-113 (ordre del Mestre, 261111) · Les eines en proves del registre (Gestoria, TPV del Bar, Rebost Domèstic,
      // Salut i Lector RSS) són a la frontera dels plugins: la Wiki les nomena pel començament del seu `titol`.
      const noms = enProves.map((plugin) => plugin.titol.split(' ')[0]);
      expect(noms.filter((nom) => !plugins.includes(`\`${nom}`))).toEqual([]);
    }
  });
});
