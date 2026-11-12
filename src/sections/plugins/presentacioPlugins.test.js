/**
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4: «els
 * sis paràgrafs només són per al Rebost i Salut») · La presentació llarga de
 * la pàgina d'un plugin (presentacioPlugins.js): sis paràgrafs per al Rebost
 * i per a Salut, i null per a la resta del registre.
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 6; pla §7.3) · Cada
 * paràgraf porta davant el seu títol <h3>: el cos comença en H3
 * (sdp-universal-page §1.E.4, core-llegibilitat-text §2), i els paràgrafs no
 * canvien. DEROGAT (Gauntlet 261022_0225, F2/F7) «els paràgrafs no canvien»:
 * l'últim del Rebost i de Salut canvia perquè «el botó no fa res» ja no és
 * cert; pendent de revisió del Mestre (el de Salut, també del text de salut).
 * EXTENSIÓ (d31c1ccd; Gauntlet 261022_0225, F8) · La Gestoria i el Lector RSS
 * també en porten sis, i els seus literals citats tenen guarda (CITES).
 * Gauntlet 261022_0225 (F7) · Els textos diuen com està l'eina ara, en
 * paraules del poble, i cap promet un botó inert.
 *
 * El que fixa:
 *   · la forma: una cadena per plugin, sis blocs (un <h3> sense punt final i
 *     el seu <p>, un element per línia), només <h3>, <p> i <strong>, cap
 *     altre encapçalament (l'H1 i l'H2 són els del registre) i cap atribut;
 *   · que el sanejador de les pàgines de text no en lleva res: el que
 *     s'escriu és el que es pinta;
 *   · que els literals que el text cita entre cometes són els que pinta
 *     l'app (llegits de la font de src/apps/nevera i src/apps/salut): si
 *     l'app en canvia un, esta prova cau i el text es canvia amb ell;
 *   · que el text de Salut no diu res que l'avís de l'app no diga: ni un nom
 *     de malaltia, ni un consell, ni una xifra que no siga el 112.
 * Com es pinta a la pàgina (CosDeLaPagina, entre l'entradilla i el botó) ho
 * prova PluginPage.test.jsx.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { sanitizeHtml } from '../../utils/sanitize';
import { PRESENTACIO_PLUGINS, presentacioDelPlugin } from './presentacioPlugins.js';
import { IDS_PLUGINS, pluginPerId } from './registrePlugins.js';

/* P0-114 (ordre del Mestre, 261111, punt 3: «presentar també les sis seccions didàctiques <h3> +
   <p> a presentacioPlugins.js per a genealogia i avisador») · L'Avisador també en porta sis. */
const AMB_PRESENTACIO = ['rebost', 'salut', 'genealogia', 'gestoria', 'rss', 'avisador'];
const font = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');
/* Els elements d'una presentació: un per línia, cada <h3> davant del seu <p>. */
const linies = (html) => html.split('\n');
/* Només els paràgrafs (261021, tasca 6): paragrafs(salut)[1] continua sent el de «Avui». */
const paragrafs = (html) => linies(html).filter((linia) => linia.startsWith('<p>'));
const senseMarques = (html) => html.replace(/<[^>]+>/g, '');
/* El text dels títols H3 d'una presentació, en ordre. */
const titols = (html) => linies(html).filter((linia) => linia.startsWith('<h3>')).map(senseMarques);
/* Els noms de totes les marques d'un HTML, d'obertura i de tancament. */
const marques = (html) => [...html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)].map(([, nom]) => nom.toLowerCase());

describe('presentació dels plugins', () => {
  test('les eines amb presentació són del registre', () => {
    expect(Object.isFrozen(PRESENTACIO_PLUGINS)).toBe(true);
    expect(Object.keys(PRESENTACIO_PLUGINS)).toEqual(AMB_PRESENTACIO);
    for (const id of AMB_PRESENTACIO) {
      expect([id, IDS_PLUGINS.includes(id), typeof PRESENTACIO_PLUGINS[id]]).toEqual([id, true, 'string']);
    }
  });

  test('presentacioDelPlugin: l’HTML de les eines didàctiques, i null per a la resta', () => {
    for (const id of AMB_PRESENTACIO) expect([id, presentacioDelPlugin(id)]).toEqual([id, PRESENTACIO_PLUGINS[id]]);
    for (const id of IDS_PLUGINS.filter((un) => !AMB_PRESENTACIO.includes(un))) {
      expect([id, presentacioDelPlugin(id)]).toEqual([id, null]);
    }
    // Només claus pròpies: res heretat d'Object, ni un id que no és text.
    for (const res of ['', 'constructor', '__proto__', 'toString', 'hasOwnProperty', 'Rebost', 'rebost/', 'consola', null, undefined, 3, ['rebost']]) {
      expect([String(res), presentacioDelPlugin(res)]).toEqual([String(res), null]);
    }
  });

  test.each(AMB_PRESENTACIO)('%s: sis blocs (un <h3> i el seu <p>), només h3, p i strong, cap altre encapçalament i cap atribut', (id) => {
    const html = presentacioDelPlugin(id);
    const plugin = pluginPerId(id);
    // Ordre del Mestre (261021, prompt 261021_0015, tasca 6) · El cos comença en H3 i alterna títol i paràgraf.
    expect(html).toMatch(/^<h3>/);
    expect(linies(html)).toHaveLength(12);
    for (const [index, linia] of linies(html).entries()) {
      const forma = index % 2 === 0 ? /^<h3>[^<]+<\/h3>$/ : /^<p>.+<\/p>$/;
      expect([index, forma.test(linia)]).toEqual([index, true]);
    }
    expect(paragrafs(html)).toHaveLength(6);
    for (const [index, paragraf] of paragrafs(html).entries()) {
      expect([index, /^<p>.+<\/p>$/.test(paragraf)]).toEqual([index, true]);
      // Un sol <p> per línia, i les negretes ben tancades.
      expect([index, paragraf.split('<p>').length - 1, paragraf.split('</p>').length - 1]).toEqual([index, 1, 1]);
      expect([index, paragraf.split('<strong>').length]).toEqual([index, paragraf.split('</strong>').length]);
      expect([index, senseMarques(paragraf).trim().length > 0]).toEqual([index, true]);
    }
    // Sis títols, tots distints, sense espais sobrers ni punt final, i cap repetix l'H1 ni l'H2 del registre.
    expect(titols(html)).toHaveLength(6);
    expect(new Set(titols(html)).size).toBe(6);
    for (const titol of titols(html)) {
      expect([titol, titol.length > 0, titol === titol.trim(), titol.endsWith('.')]).toEqual([titol, true, true, false]);
      expect([titol, titol === plugin.titol, titol === plugin.subtitol]).toEqual([titol, false, false]);
    }
    expect(html.split('<p>').length - 1).toBe(6);
    expect(html.split('<h3>').length - 1).toBe(6);
    expect([...new Set(marques(html))].sort()).toEqual(['h3', 'p', 'strong']);
    // Cap altre encapçalament. Escrit com a classe [124-6]: design_guard llig els literals de capçalera de qualsevol .js.
    expect(html).not.toMatch(/<h[124-6]\b/i);
    // Cap atribut (ni classe, ni estil, ni enllaç): totes les marques són nues.
    expect(html.match(/<[^>]+>/g).filter((marca) => !/^<\/?(?:h3|p|strong)>$/.test(marca))).toEqual([]);
    // Cap entitat: el text pla que es llig és el que hi ha escrit.
    expect(html).not.toMatch(/&[a-z#0-9]+;/i);
  });

  test.each(AMB_PRESENTACIO)('%s: el sanejador de les pàgines de text no en lleva ni en canvia res', (id) => {
    const html = presentacioDelPlugin(id);
    expect(sanitizeHtml(html)).toBe(html);
  });

  test.each(AMB_PRESENTACIO)('%s: diu el nom de l’eina i el del seu botó, els del registre', (id) => {
    const text = senseMarques(presentacioDelPlugin(id));
    const plugin = pluginPerId(id);
    expect(text).toContain(plugin.titol);
    expect(text).toContain(`«${plugin.etiquetaObrir}»`);
    /* I diu, honestament, com està: en proves si té destí. R18 · T2 (P0-101)
       · Una eina sense destí (obrir null: hui cap; DEROGAT per R19 · T3
       «hui, l'Arbre Genealògic») no està en proves, està en obres, i el text
       ho diu. Abans: 'en proves' per a totes. */
    expect(text).toContain(plugin.obrir === null ? 'en obres' : 'en proves');
    /* Gauntlet 261022_0225 (F2) · DEROGAT «el botó pot no fer res»: sense
       destí no hi ha cap botó inert, i el text no ho pot prometre. */
    expect(text).not.toMatch(/no fa res/);
    /* P0-113 (ordre del Mestre, 261111: «ENCÉN en producció» les eines amb app «com a eines
       gratuïtes obertes») · Les quatre amb destí s'obrin en producció: el text diu que estan en
       proves i que el botó hi porta, i cap ja no parla de no poder-les obrir. DEROGAT «en lloc
       del botó la pàgina et diu per què i què pots fer» (el Rebost i Salut) i «Si ací baix no
       tens el botó, davall et diem per què» (la Gestoria i el Lector). */
    /* R19 · T3 (ordre del Mestre, 261111; pla 261111_1720) · L'Arbre Genealògic torna amb el Rebost i
       Salut: s'obri en producció i, com Salut (dades de salut), només a la pàgina pròpia. DEROGADA la
       branca «Encara està en obres: el botó «Obrir l’Arbre Genealògic» encara no s’obri, i la pàgina
       et diu per què.» (R18 · T2, P0-101). */
    if (['rebost', 'salut', 'genealogia'].includes(id)) {
      expect(text).toMatch(new RegExp(`Encara està en proves: (?:a la pàgina pròpia, )?el botó «${plugin.etiquetaObrir}» t’hi porta\\.`));
    }
    /* P0-114 (ordre del Mestre, 261111) · L'Avisador s'obri en producció (la seua pàgina): el text
       diu, com el Rebost, que està en proves i que el botó hi porta. */
    else if (id === 'avisador') expect(text).toMatch(/Encara està en proves: el botó «Obrir l’Avisador» t’hi porta\./);
    /* La Gestoria i el Lector: un últim bloc neutre, cert en qualsevol estat (també si l'ha
       desactivada la persona): gratuïts, en proves, i desactivar no esborra res. */
    else {
      expect(text).toMatch(/(?:La Gestoria|El lector) és gratuït(?:a)? i encara està en proves\. Desactivar-(la|lo) o tornar-\1 a activar no esborra/);
      expect(text).not.toMatch(/esta web encara no (?:la|el) pot obrir|com desactivar-/);
    }
    // Cap text diu que l'eina no es pot obrir ací, ni que no està a punt per a tothom.
    if (plugin.obrir !== null) {
      expect(text).not.toMatch(/en lloc del botó|no tens el botó|encara no (?:la|el) pots obrir|a punt per a tothom/i);
    }
  });

  /* Gauntlet 261022_0225 (F7 i auditoria didàctica) · Cap jerga i cap promesa
     del que no hi ha: ni descàrregues, ni paquets, ni notícies de mostra que
     ja no existixen, ni «quan estiga disponible» davant d'un botó que pot ser-hi. */
  test.each(AMB_PRESENTACIO)('%s: paraules del poble, en present', (id) => {
    const text = senseMarques(presentacioDelPlugin(id));
    expect(text).not.toMatch(/\bnode\b|\bapps?\b|amfitri|premium|desenvolupament|paquet|descàrrega independent|versió compatible|acredit|notícies de mostra|sincronitza|Quan (?:l’eina )?estiga disponible/i);
    /* P0-113 (ordre del Mestre, 261111: «Res dins de l'app ha de donar a entendre que es
       cobrarà per cap eina») · Cap paraula de pagament, de subscripció ni de contracte. */
    expect(text).not.toMatch(/pagament|\bpag(?:ar|a|ues)\b|subscripci|contracta|de pago|tarifa|\bquota\b/i);
  });
});

/* Els literals que el text cita entre cometes són els que pinta l'app. Es
   lligen de la font (text), sense muntar cap app: [literal, fitxer, com hi
   apareix escrit]. */
describe('els literals citats són els de l’app', () => {
  const NEVERA = 'src/apps/nevera';
  const SALUT = 'src/apps/salut';
  const CITES = {
    rebost: [
      ['N’hi ha', `${NEVERA}/vistes/vestits.js`, "'hi-ha': 'N’hi ha'"],
      ['Se n’acaba', `${NEVERA}/vistes/vestits.js`, "'se-n-acaba': 'Se n’acaba'"],
      ['S’ha acabat', `${NEVERA}/vistes/vestits.js`, "acabat: 'S’ha acabat'"],
      ['El que tens a casa', `${NEVERA}/vistes/Casa.jsx`, "nom: 'El que tens a casa'"],
      ['No el seguisques', `${NEVERA}/vistes/Casa.jsx`, "etiqueta: 'No el seguisques'"],
      ['Cal comprar', `${NEVERA}/vistes/Casa.jsx`, 'titol="Cal comprar"'],
      ['Afig-ho tot', `${NEVERA}/vistes/Casa.jsx`, "text: 'Afig-ho tot'"],
      ['La compra', `${NEVERA}/manifest.js`, "ca: 'La compra'"]
    ],
    salut: [
      ['Avui', `${SALUT}/manifest.js`, "ca: 'Avui'"],
      ['Full per al metge', `${SALUT}/manifest.js`, "ca: 'Full per al metge'"],
      ['Resum i avisos', `${SALUT}/manifest.js`, "ca: 'Resum i avisos'"],
      ['He apuntat tot el dia', `${SALUT}/vistes/Diari.jsx`, 'etiqueta="He apuntat tot el dia"'],
      ['Ho he entés', `${SALUT}/vistes/Ajustos.jsx`, '>Ho he entés</Boto>'],
      ['parla-ho amb el metge', `${SALUT}/textos.js`, '«parla-ho amb el metge»'],
      ['truca al 112', `${SALUT}/textos.js`, '«truca al 112»']
    ],
    /* Gauntlet 261022_0225 (F8) · Les entrades de la Gestoria i del Lector
       que el text cita: si l'app les canvia de nom, esta prova cau. */
    gestoria: [
      ['Identitat i Finestreta', 'src/apps/gestoria/manifest.js', "ca: 'Identitat i Finestreta'"],
      ['Facturació', 'src/apps/gestoria/manifest.js', "ca: 'Facturació'"]
    ],
    /* Actualitzada a posta (261024 Lector): per ordre del Mestre (15:05) la pàgina
       «Fonts» ja no existix; la gestió és el diàleg «Gestiona les fonts» de l'arbre. */
    rss: [
      ['Gestiona les fonts', 'src/apps/lector/vistes/GestioFonts.jsx', 'titol="Gestiona les fonts"'],
      ['Notícies', 'src/apps/lector/manifest.js', "ca: 'Notícies'"]
    ],
    /* P0-114 (ordre del Mestre, 261111) · El botó del formulari de la pàgina de L'Avisador. */
    avisador: [
      ['Activa l’Avisador', 'src/pages/textosAvisador.js', "activa: text('activa', 'Activa l’Avisador')"]
    ],
    /* R19 · T3 (ordre del Mestre, 261111; pla 261111_1720) · Les entrades de l'Arbre Genealògic que el
       text cita (manifest.js), el títol de l'exportació, la persona protegida i el botó de l'avís
       (textos.js): si l'app en canvia una, esta prova cau i el text es canvia amb ella. */
    genealogia: [
      ['Entrevista', 'src/apps/genealogia/manifest.js', "ca: 'Entrevista'"],
      ['Persones', 'src/apps/genealogia/manifest.js', "ca: 'Persones'"],
      ['Germans, padrins i testimonis', 'src/apps/genealogia/manifest.js', "ca: 'Germans, padrins i testimonis'"],
      ['Arxius públics', 'src/apps/genealogia/manifest.js', "ca: 'Arxius públics'"],
      ['Prompts per a copiar', 'src/apps/genealogia/manifest.js', "ca: 'Prompts per a copiar'"],
      ['GEDCOM i còpia', 'src/apps/genealogia/manifest.js', "ca: 'GEDCOM i còpia'"],
      ['Prepara, no publica', 'src/apps/genealogia/textos.js', "'exporta.preparaNoPublica.titol': 'Prepara, no publica'"],
      ['Persona viva', 'src/apps/genealogia/textos.js', "'persona.viva': 'Persona viva'"],
      ['Entesos', 'src/apps/genealogia/textos.js', "'boto.entesos': 'Entesos'"]
    ]
  };

  /* R19 · T3 (ordre del Mestre, 261111; pla 261111_1720) · Tractor-promesa: l'Arbre Genealògic diu en
     present només el que fa l'app. Una sola pregunta per torn, de la casa i el mas als besavis
     (passosEntrevista.js); els quatre estats i «mai no ajunta ningú pel cognom»; no cerca als arxius ni
     parla amb cap IA; les dades al dispositiu i la còpia; només a la pàgina pròpia (dades de salut,
     com Salut) i l'avís que s'accepta abans d'entrar. Cap promesa de dictat ni d'arbre per a imprimir:
     l'app no en porta. */
  test('genealogia: cada afirmació té el seu text o el seu codi a l’app', () => {
    const text = senseMarques(presentacioDelPlugin('genealogia'));
    const textos = font('src/apps/genealogia/textos.js');
    const passos = font('src/apps/genealogia/nucli/passosEntrevista.js');
    const manifest = font('src/apps/genealogia/manifest.js');
    expect(text).toContain('una sola pregunta cada vegada');
    expect(textos).toContain("'entrevista.regla': 'Una sola pregunta cada vegada.");
    expect(passos).toContain('cada pas\n * és UNA sola pregunta');
    for (const id of ['casa', 'lloc', 'g4-jo', 'g4-germa', 'g3-pare', 'g3-mare', 'g2-pare-pare', 'g1-besavi']) {
      expect([id, passos.includes(`id: '${id}'`)]).toEqual([id, true]);
    }
    expect(text).toContain('els quatre iaios');
    expect(passos).toContain("export const PASSOS_G2 = Object.freeze(['g2-pare-pare', 'g2-mare-pare', 'g2-pare-mare', 'g2-mare-mare']);");
    expect(textos).toContain('[CONFIRMAT] vol dir que hi ha un document; [APROXIMAT], que ho diu la memòria; [FALTA CONFIRMAR], que encara no hi ha prova; [CONTRADICCIÓ], que les dates no lliguen.');
    for (const estat of ['[CONFIRMAT]', '[APROXIMAT]', '[FALTA CONFIRMAR]', '[CONTRADICCIÓ]']) expect([estat, text.includes(estat)]).toEqual([estat, true]);
    expect(text).toContain('mai no ajunta ningú pel cognom');
    expect(textos).toContain('L’app mai no ajunta ningú pel cognom.');
    expect(text).toContain('No cerca als arxius ni parla amb cap intel·ligència artificial');
    expect(textos).toContain("'avis.noFa': 'L’app no cerca als arxius ni parla amb cap IA");
    expect(text).toContain('Les dades es queden en este dispositiu, dins d’este navegador, i no s’envien enlloc');
    expect(textos).toContain("'avis.on': 'Les dades es queden en este dispositiu, en este navegador. No hi ha cap compte ni cap servidor.");
    expect(textos).toContain("'panell.copia.text': 'Fes una còpia de tant en tant");
    expect(text).toContain('el fitxer no es puja enlloc, i tu decidixes on el guardes i amb qui el compartixes');
    expect(textos).toContain('No el puja enlloc: tu decidixes on el guardes i amb qui el compartixes.');
    // Només a la pàgina pròpia, com Salut: les dades personals de salut obrin la guarda d'ama del document.
    expect(text).toContain('només s’obri a la pàgina pròpia de Sóc de Poble, mai dins d’una altra web');
    expect(manifest).toContain("dadesPersonals: 'salut',");
    expect(font('src/apps/genealogia/AppGenealogia.jsx')).toContain("if (!genealogia.avisAcceptat && pathname !== ruta('avis')) return <Navigate to={ruta('avis')} replace />;");
    // Cap promesa del que l'app no fa: ni dictat de veu, ni impressió, ni futur.
    expect(text).not.toMatch(/veu alta|dictat|imprimir|serà |podràs|tindràs|en obres/i);
  });

  /* P0-114 (ordre del Mestre, 261111) · Veritat nua: el que diu el text de L'Avisador ix del seu
     servei i de la seua pàgina. Les hores (HORES_AVISADOR), d'una a tres persones (estatAvisador), el
     descans de com a molt dotze hores (MAXIM_DESCANS_MINUTS), la condició de la sessió oberta i el
     112 (textosAvisador.js, `limitacions`). Cap promesa de servidor ni de sincronització. */
  test('avisador: les hores, les persones, el descans i les condicions són els del servei i de la pàgina', () => {
    const text = senseMarques(presentacioDelPlugin('avisador'));
    const servei = font('src/services/avisador.js');
    const pagina = font('src/pages/textosAvisador.js');
    expect(servei).toContain('export const HORES_AVISADOR = Object.freeze([4, 8, 12, 24]);');
    expect(text).toContain('quatre, huit, dotze o vint-i-quatre');
    expect(servei).toContain('persones.length < 1 || persones.length > 3');
    expect(text).toContain('d’una a tres persones');
    expect(servei).toContain('export const MAXIM_DESCANS_MINUTS = 720;');
    expect(pagina).toContain('El descans nocturn pot durar com a màxim 12 hores.');
    expect(text).toContain('el descans pot durar com a molt dotze hores');
    expect(pagina).toContain('Funciona amb la sessió personal oberta, mentre l’app pot executar-se i té connexió al Xat.');
    expect(text).toContain('Només funciona amb la sessió personal oberta, mentre Sóc de Poble pot executar-se i té connexió al Xat.');
    expect(pagina).toContain('Per a una emergència, telefona al 112.');
    expect(text).toContain('Per a una emergència, telefona al 112.');
    expect(pagina).toContain('Els ajustos es guarden en este dispositiu.');
    expect(text).toContain('Els ajustos es guarden en este dispositiu');
    expect(text).not.toMatch(/sincron|n[úu]vol|servidor|còpia|garanti|sempre arriba/i);
  });

  /* P0-113 (ordre del Mestre, 261111) · Actualitzada a posta: el Lector és obert en producció i, amb
     el servei de notícies del backend (plataforma/fontServeis.js), hi arriben les fonts de coneixement
     obert. El text ja no diu que no arriba cap notícia: diu quan apareix l'estat buit, amb les paraules
     de l'app. La intenció es conserva (el text i l'estat buit diuen el mateix). I diu que l'adreça d'una
     font personal la rep el servei (fontRemota.js, feedPersonal). */
  test('rss: «encara no hi ha cap font connectada» és el que diu l’estat buit de l’app, i només quan no hi ha servei', () => {
    const text = senseMarques(presentacioDelPlugin('rss'));
    expect(text).toContain('el lector et diu que encara no hi ha cap font connectada');
    expect(text).toContain('Si esta web no té el servei de notícies');
    expect(text).not.toMatch(/no arriba cap notícia|ixen buides|Quan funcione/);
    expect(font('src/apps/lector/AppLector.jsx')).toContain('Encara no hi ha cap font connectada');
    expect(text).toContain('el servei de notícies de Sóc de Poble en rep l’adreça');
    expect(font('src/apps/lector/fontRemota.js')).toContain('feedPersonal(url');
  });

  /* P0-113 · La Gestoria oberta en producció: el Tauler, la Finestreta, l'Històric i l'Escàner demanen
     l'aprovació d'un tractor, i el panell d'aprovació només existix en desenvolupament
     (WikiDePobleSection.jsx, EINES_LOCALS). El text no envia la persona a una vista bloquejada: comença
     per la Facturació, que no passa per cap tractor. */
  test('gestoria: comença per la Facturació, que no demana cap tractor, i diu que la resta encara demana una aprovació', () => {
    const text = senseMarques(presentacioDelPlugin('gestoria'));
    expect(text).toContain('Comença per «Facturació»: és la part que ja funciona sense cap pas previ.');
    expect(text).toContain('encara demanen una aprovació que hui no es pot fer des d’esta web');
    expect(font('src/sections/gestoria/facturar/Facturacio.jsx')).not.toMatch(/useTractors|Cal aprovar el tractor/);
    expect(font('src/sections/wiki-de-poble/WikiDePobleSection.jsx')).toContain('const EINES_LOCALS = import.meta.env.DEV ? {');
  });

  test.each(Object.entries(CITES).flatMap(([id, cites]) => cites.map((cita) => [id, ...cita])))(
    '%s cita «%s», que és a %s', (id, literal, fitxer, comHiEs) => {
      expect(senseMarques(presentacioDelPlugin(id))).toContain(`«${literal}»`);
      expect(font(fitxer)).toContain(comHiEs);
    }
  );

  test('rebost: «Ajustos» és una entrada de la Nevera, i la còpia es descarrega i es recupera allí', () => {
    expect(presentacioDelPlugin('rebost')).toContain('a <strong>Ajustos</strong> pots <strong>descarregar una còpia</strong> i recuperar-la');
    expect(font('src/apps/nevera/manifest.js')).toContain("ca: 'Ajustos'");
    const ajustos = font('src/apps/nevera/vistes/Ajustos.jsx');
    expect(ajustos).toContain('>Descarrega una còpia</Boto>');
    expect(ajustos).toContain('etiqueta="Recupera una còpia"');
  });

  /* P0-113 (ordre del Mestre, 261111) · La Nevera s'obri en producció (encesa per defecte i
     sense entorn de desenvolupament): el text la diu gratuïta i en proves, i ja no tancada.
     Abans: el manifest portava entorn 'desenvolupament'. */
  test('rebost: gratuïta, sense dades personals i en proves, com diu el manifest de la Nevera', () => {
    const manifest = font('src/apps/nevera/manifest.js');
    expect(manifest).toContain("nivell: 'gratuit'");
    expect(manifest).toContain('dadesPersonals: false');
    expect(manifest).toContain('actiuPerDefecte: true');
    expect(manifest).not.toContain("entorn: 'desenvolupament'");
    const text = senseMarques(presentacioDelPlugin('rebost'));
    expect(text).toContain('És gratuïta, no demana cap dada personal');
    expect(text).toContain('l’eina no fa cap crida a internet');
  });

  /* Els nou botons d'apunt de la pantalla «Avui»: el text els cita TOTS, amb
     el nom del camp `boto` del diccionari de Salut, i cap que no hi siga. */
  test('salut: els botons d’apunt citats són exactament els del diccionari de l’app', () => {
    const botons = [...font('src/apps/salut/nucli/diccionari.js').matchAll(/\bboto: '([^']+)'/g)].map(([, nom]) => nom);
    expect(botons).toHaveLength(9);
    const segon = senseMarques(paragrafs(presentacioDelPlugin('salut'))[1]);
    const citats = [...segon.matchAll(/«([^»]+)»/g)].map(([, nom]) => nom);
    expect(citats[0]).toBe('Avui');
    expect([...citats.slice(1)].sort()).toEqual([...botons].sort());
  });

  test('salut: el mode nit existix a la pantalla d’apuntar', () => {
    expect(senseMarques(presentacioDelPlugin('salut'))).toContain('Hi ha un mode nit');
    expect(font('src/apps/salut/vistes/Diari.jsx')).toMatch(/^\s*Mode nit$/m);
  });
});

/* Cap consell mèdic i cap promesa. El text de Salut diu el mateix que l'avís
   de l'app (apps/salut/textos.js), que és un esborrany pendent de la revisió
   del Mestre i, idealment, d'algú de salut. Açò no substituïx eixa revisió:
   només vigila que no s'hi cole el que l'avís prohibix. */
describe('salut: el text no promet ni aconsella', () => {
  const text = senseMarques(PRESENTACIO_PLUGINS.salut);

  test('diu què no és, amb les paraules de l’avís de l’app', () => {
    const avis = font('src/apps/salut/textos.js');
    for (const frase of ['No és un producte sanitari', 'no diu què li passa a ningú', 'no recomana tractaments ni quantitats de medicació',
      'no vol dir que tot vaja bé']) {
      expect([frase, text.includes(frase), avis.includes(frase)]).toEqual([frase, true, true]);
    }
  });

  test('on van les dades: el mateix que diu l’avís', () => {
    const avis = font('src/apps/salut/textos.js');
    expect(text).toContain('No s’envien a Sóc de Poble, ni a cap servidor, ni a cap intel·ligència artificial.');
    expect(avis).toContain('No s’envien a Sóc de Poble, ni a cap servidor, ni a cap intel·ligència artificial.');
    expect(text).toContain('es queden en este dispositiu, dins d’este navegador');
    expect(avis).toContain('Es queden en este dispositiu, dins d’este navegador');
  });

  test('cap xifra que no siga el 112, i cap paraula de diagnòstic, de dosi ni de garantia', () => {
    expect(text.replace(/\b112\b/g, '')).not.toMatch(/\d/);
    expect(text).not.toMatch(/diagn[oò]stic|infecci|dem[eè]nci|malalti|\bdosi\b|mil·lilitres|\bml\b|garanti/i);
  });

  test('el Rebost tampoc porta cap xifra', () => {
    expect(senseMarques(PRESENTACIO_PLUGINS.rebost)).not.toMatch(/\d/);
  });
});

/* Onada 6 (261103, prompt 261102_1532; ordre del Mestre de les negretes
   d'escaneig, core-llegibilitat-text) · Prova d'Or de Lectura Diagonal: cada
   paràgraf porta les negretes del contracte de densitat segons la seua
   llargària (40 paraules o més: 6–8; 25–39: 5–7; 12–24: 2–4; menys: 1–3), cap
   paràgraf pla, i cada negreta és un sintagma curt (6 paraules com a màxim),
   no una paraula buida, ni buida ni niuada. Les paraules es compten com a
   tirades de lletres o xifres: «d’ací» en són dos (el verificador d'O6, amb Intl.Segmenter, en compta un, i diagonal.mjs compta per espais: este test és el més estricte). */
describe('negretes d’escaneig de la presentació', () => {
  const paraules = (text) => (text.match(/[\p{L}\p{N}]+/gu) ?? []).length;
  const tram = (n) => (n >= 40 ? [6, 8] : n >= 25 ? [5, 7] : n >= 12 ? [2, 4] : [1, 3]);
  const BUIDES = new Set(['i', 'o', 'de', 'del', 'la', 'el', 'els', 'les', 'a', 'al', 'en', 'amb', 'per', 'que', 'un', 'una', 'és']);

  test.each(AMB_PRESENTACIO)('%s: cada paràgraf té les negretes que li toquen', (id) => {
    for (const [index, paragraf] of paragrafs(presentacioDelPlugin(id)).entries()) {
      const llarg = paraules(senseMarques(paragraf));
      const negretes = [...paragraf.matchAll(/<strong>(.*?)<\/strong>/g)].map(([, dins]) => dins);
      const [minim, maxim] = tram(llarg);
      expect([index, llarg, negretes.length >= minim && negretes.length <= maxim]).toEqual([index, llarg, true]);
      for (const negreta of negretes) {
        expect([index, negreta, negreta.includes('<'), negreta.trim() === negreta, negreta.length > 0]).toEqual([index, negreta, false, true, true]);
        expect([index, negreta, paraules(negreta) <= 6, BUIDES.has(negreta.toLowerCase())]).toEqual([index, negreta, true, false]);
      }
    }
  });
});
