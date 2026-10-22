/**
 * Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25; MCR b36_xat.3) · La IAIA
 * local busca a la Wiki pública del paquet i contesta amb els 3 documents més
 * pròxims. Ací es prova el mòdul pur (tokenització, índex, cerca i resposta),
 * la càrrega a demanda amb les seues eixides de reserva i, amb la Wiki de
 * veres, que els enllaços porten a documents que la Wiki pinta.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  DOCUMENTS_PER_RESPOSTA, ENCAPCALAMENT_DE_LA_WIKI, RUTA_DE_LA_WIKI, SALUTACIO_TECNICA_IAIA, TEMPS_MAXIM_DE_LA_WIKI,
  arrel, cerca, cercaRellevant, componResposta, construeixIndex, consultaTecnicaIAIA, oblidaIndexDeLaWiki, respostaDeLaIAIA,
  rutaDeDocumentWiki,
  termesDeLaPregunta, titolDeDocument, tokenitza
} from './iaiaLocal.js';
import { wikiManifest } from './wikiManifest.js';
import { SECTIONS } from '../config/sections.js';
import { extreuEditorial } from '../sections/wiki-de-poble/parseMarkdown.js';

afterEach(() => { vi.useRealTimers(); oblidaIndexDeLaWiki(); });

const doc = (id, content, extra = {}) => ({ id, title: id, subtitle: '', tags: [], attributes: {}, content, ...extra });

const FIXTURA = [
  doc('pedra_seca', '# La pedra seca\n\nMurs de pedra seca sense ciment, com els marges dels bancals.'),
  doc('bancals', '# Els bancals\n\nEls marges sostenen la terra. La pedra hi apareix de passada.'),
  doc('tomaques', '# Calendari de les tomaques\n\nQuan es planten les tomaques de penjar.', { subtitle: 'Hort i reg', tags: ['hort'] }),
  doc('sollutia', '# Soci Sollutia\n\nSollutia és l’amfitrió de l’app.', { attributes: { description: 'Infraestructura i Model B' } }),
  doc('cuina', '# Receptes\n\nLa cassola i el pa de casa.')
];

describe('tokenitza i termesDeLaPregunta', () => {
  test('minúscules, sense diacrítics, «l·l» com a «ll», sense paraules buides ni curtes', () => {
    expect(tokenitza('Què és la INTEL·LIGÈNCIA artificial del poble? 2026 ok')).toEqual(['intelligencia', 'artificial', 'poble']);
    expect(tokenitza("L'Ànima de la IAIA")).toEqual(['anima', 'iaia']);
  });

  test('el destí d’un enllaç del Markdown i les adreces soltes no compten', () => {
    expect(tokenitza('[Genotip](?item=02_genotip) i https://exemple.cat/coses')).toEqual(['genotip']);
  });

  test('una pregunta que només saluda o nomena la IAIA no busca res', () => {
    for (const pregunta of ['Bon dia, IAIA', 'Hola IAIA MarIA!', 'Bona nit', 'Gràcies, iaia', '', null, '   ']) {
      expect([pregunta, termesDeLaPregunta(pregunta)]).toEqual([pregunta, []]);
    }
  });

  test('el vocatiu IAIA no contamina el tema, i cap terme no es repetix', () => {
    expect(termesDeLaPregunta('Què és la pedra seca?')).toEqual(['pedra', 'seca']);
    expect(termesDeLaPregunta('La personalitat de la IAIA, la IAIA!')).toEqual(['personalitat']);
  });
});

/* Gauntlet 261022_0225 (crítica Claude) · IAIA-2. L'arrel lleugera. */
describe('arrel', () => {
  test('les formes d’un verb i el plural comparteixen arrel; una paraula curta es queda sencera', () => {
    for (const familia of [['pujo', 'puge', 'pujar', 'pugen', 'pujat', 'puja'], ['esborre', 'esborrar', 'esborra', 'esborrat', 'esborrades'],
      ['busque', 'buscar', 'busca', 'busques'], ['pague', 'pagar', 'pagueu'], ['compte', 'comptes'], ['foto', 'fotos'], ['xat', 'xats'],
      ['paper', 'papers'], ['dada', 'dades'], ['privat', 'privada', 'privades'], ['mercat', 'mercats'],
      ['sistema', 'sistemes'], ['cadena', 'cadenes'], ['preparada', 'preparades', 'preparat', 'preparats']]) {
      expect([familia, new Set(familia.map(arrel)).size]).toEqual([familia, 1]);
    }
    expect(arrel('xat')).toBe('xat');
    expect(arrel('autor')).toBe('autor');
  });

  /* Revisió de la crítica · El plural torna al singular abans de llevar el
     verb: un plural femení ja no es retalla un pas més que el seu singular. */
  test('un plural no cau en l’arrel d’una altra paraula', () => {
    for (const [plural, altra] of [['barates', 'bar'], ['nomenes', 'nom'], ['safates', 'saf']]) {
      expect([plural, arrel(plural) === arrel(altra)]).toEqual([plural, false]);
    }
    expect(termesDeLaPregunta('Com passe les portes de qualitat?')).toEqual(['passe', 'qualitat']);
  });
});

describe('titolDeDocument', () => {
  test('la capçalera «# Títol» en text pla, sense punt final; sense capçalera, el del manifest', () => {
    expect(titolDeDocument(doc('a', '# La **pedra** [seca](?item=x).\n\nCos'))).toBe('La pedra seca');
    expect(titolDeDocument(doc('b', '﻿\n\n# Amb BOM\r\nCos'))).toBe('Amb BOM');
    expect(titolDeDocument(doc('c', 'Cos sense capçalera\n# Tard', { title: 'Títol del manifest' }))).toBe('Títol del manifest');
    expect(titolDeDocument({ id: 'nomes-id' })).toBe('nomes-id');
  });

  test('a tota la Wiki del paquet, és el títol que pinta la pàgina del document (extreuEditorial)', () => {
    expect(wikiManifest.items.length).toBeGreaterThan(0);
    for (const item of wikiManifest.items) {
      const esperat = extreuEditorial(item.content).titol || item.title || item.id;
      expect([item.id, titolDeDocument(item)]).toEqual([item.id, esperat]);
    }
  });
});

describe('cerca', () => {
  const index = construeixIndex(FIXTURA);

  test('el document que ho porta al títol va primer, i n’ix com a molt 3', () => {
    const resultats = cerca(index, 'Murs de pedra seca');
    expect(resultats.map((r) => r.id)).toEqual(['pedra_seca', 'bancals']);
    expect(resultats[0]).toMatchObject({ titol: 'La pedra seca' });
    expect(resultats[0].puntuacio).toBeGreaterThan(resultats[1].puntuacio);
    expect(cerca(index, 'pedra seca tomaques sollutia cassola marges')).toHaveLength(DOCUMENTS_PER_RESPOSTA);
  });

  test('el subtítol, la descripció i les etiquetes també compten', () => {
    expect(cerca(index, 'hort').map((r) => r.id)).toEqual(['tomaques']);
    expect(cerca(index, 'infraestructura').map((r) => r.id)).toEqual(['sollutia']);
  });

  test('cap document sense cap paraula de la pregunta; salutacions i paraules desconegudes no troben res', () => {
    expect(cerca(index, 'zzqx vaixell')).toEqual([]);
    expect(cerca(index, 'Bon dia, IAIA')).toEqual([]);
    expect(cerca(construeixIndex([]), 'pedra')).toEqual([]);
    expect(cerca(null, 'pedra')).toEqual([]);
  });

  test('els empats es desfan per l’identificador: el resultat és estable', () => {
    const bessons = construeixIndex([doc('b', '# Riu'), doc('a', '# Riu'), doc('c', '# Riu')]);
    expect(cerca(bessons, 'riu').map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  test('un ítem sense id o sense cap paraula no entra a l’índex', () => {
    expect(construeixIndex([{ content: '# Sense id' }, doc('ok', '', { title: '' }), null]).documents).toEqual([]);
  });
});

/* Gauntlet 261022_0225 (crítica Claude) · IAIA-2. El llindar de
   rellevància: el títol i la prosa del fragment mostrat han de portar les
   paraules de la pregunta (totes si en són una o dues; dues si en són més). */
describe('cercaRellevant', () => {
  test('una coincidència solta, encara que puntue més, no es presenta com a resposta', () => {
    const index = construeixIndex([
      doc('safata', '# Safata d’eixida\n\nLa safata només esborre amb una confirmació del servidor. La safata esborre, esborre i esborre.'),
      doc('compte', '# Ajustos\n\nPer a esborrar el teu compte, obri els Ajustos i tria «Esborra el compte».')
    ]);
    expect(cerca(index, 'Com esborre el meu compte?').map((r) => r.id)).toContain('safata');
    expect(cercaRellevant(index, 'Com esborre el meu compte?').map((r) => r.id)).toEqual(['compte']);
    expect(cercaRellevant(index, 'Com esborre la safata del pis?').map((r) => r.id)).toEqual(['safata']);
  });

  test('cap document que passe el llindar, cap resultat', () => {
    expect(cercaRellevant(construeixIndex(FIXTURA), 'Com pujo una foto al xat?')).toEqual([]);
    expect(cercaRellevant(construeixIndex(FIXTURA), 'Bon dia, IAIA')).toEqual([]);
  });

  test('el codi en línia i els noms de fitxer no compten com a prosa que responga', () => {
    const index = construeixIndex([
      doc('paginacio', '# Paginació\n\nEl port demana `mercat` amb `order=created_at.desc&limit=50` i no tenia cap cursor.'),
      doc('memoria', '# Memòria\n\nTres persones grans han enviat una foto (font: 260926_2330_skill_esborrany_xat.md).')
    ]);
    expect(cerca(index, 'mercat').map((r) => r.id)).toEqual(['paginacio']);
    expect(cercaRellevant(index, 'mercat')).toEqual([]);
    expect(cercaRellevant(index, 'Com pujo una foto al xat?')).toEqual([]);
  });

  test('el títol compta, i amb tres paraules o més en basten dues', () => {
    const index = construeixIndex(FIXTURA);
    expect(cercaRellevant(index, 'Què és la pedra seca?').map((r) => r.id)).toEqual(['pedra_seca']);
    expect(cercaRellevant(index, 'marges de pedra seca del bancal').map((r) => r.id)).toEqual(['pedra_seca', 'bancals']);
  });

  /* Revisió de la crítica · «Què és un node?», «Quant costa?»: amb una sola
     paraula, la prosa d'un fragment no basta; el document l'ha de portar al títol. */
  test('una pregunta d’una sola paraula només troba els documents que la porten al títol', () => {
    const index = construeixIndex(FIXTURA);
    expect(cercaRellevant(index, 'Què són els bancals?').map((r) => r.id)).toEqual(['bancals']);
    expect(cerca(index, 'marges').map((r) => r.id).sort()).toEqual(['bancals', 'pedra_seca']);
    expect(cercaRellevant(index, 'marges')).toEqual([]);
  });

  test('tria d’entre tots els documents, no només d’entre els 3 primers de la cerca', () => {
    const soroll = [1, 2, 3, 4].map((i) => doc(`soroll${i}`, `# Nota ${i}\n\nTorn torn torn torn del pis.\n\nReg reg reg reg de la casa.`));
    const index = construeixIndex([...soroll, doc('sindic', '# Síndic\n\nEl torn de reg es demana al síndic, que guarda la llibreta de la comunitat de regants.')]);
    expect(cerca(index, 'torn de reg').map((r) => r.id)).not.toContain('sindic');
    expect(cercaRellevant(index, 'torn de reg').map((r) => r.id)).toEqual(['sindic']);
  });

  test('la paraula escrita tal qual mana sobre una que només en comparteix l’arrel per a retallar el fragment', () => {
    const llarg = `Rebostar és una altra cosa. ${'Una col·laboració il·lustrada. '.repeat(30)}El Rebost guarda la llista.`;
    const [resultat] = cercaRellevant(construeixIndex([doc('rebost', `# El Rebost\n\n${llarg}`)]), 'Rebost');
    expect(resultat.fragment).toMatch(/El Rebost guarda la llista\.$/);
  });
});

describe('componResposta i rutaDeDocumentWiki', () => {
  test('l’encapçalament literal i una línia per document amb el títol i l’enllaç /wikidepoble?item=<slug>', () => {
    const text = componResposta([{ id: 'pedra_seca', titol: 'La pedra seca' }, { id: 'ADR-2026-09-SOLLUTIA-MODEL-B', titol: 'Model B' }]);
    expect(text).toBe([
      'Això és el que en sé per la Wiki de Poble:',
      '· La pedra seca — /wikidepoble?item=pedra_seca',
      '· Model B — /wikidepoble?item=ADR-2026-09-SOLLUTIA-MODEL-B'
    ].join('\n'));
    expect(ENCAPCALAMENT_DE_LA_WIKI).toBe('Això és el que en sé per la Wiki de Poble:');
    expect(componResposta([])).toBeNull();
    expect(componResposta(null)).toBeNull();
  });

  test('la ruta és la de la secció Wiki de Poble, amb el slug codificat', () => {
    expect(SECTIONS.find((seccio) => seccio.id === 'wikidepoble')).toMatchObject({ path: RUTA_DE_LA_WIKI });
    expect(rutaDeDocumentWiki('a b&c')).toBe('/wikidepoble?item=a%20b%26c');
  });

  /* Revisió adversarial (Bloc 3.6.6) · encodeURIComponent deixa «!'()*» tal
     qual, i la bombolla no els reconeix dins d'una ruta: es codifiquen tots. */
  test('codifica també «!\'()*», i la Wiki llig el mateix id', () => {
    const ruta = rutaDeDocumentWiki("a(b)!c'd*e");
    expect(ruta).toBe('/wikidepoble?item=a%28b%29%21c%27d%2Ae');
    expect(new URL(ruta, 'http://localhost').searchParams.get('item')).toBe("a(b)!c'd*e");
    expect(rutaDeDocumentWiki('pedra_seca.v2~x-y')).toBe('/wikidepoble?item=pedra_seca.v2~x-y');
    // El punt final, que la bombolla llegiria com el de la frase.
    expect(rutaDeDocumentWiki('genoma.')).toBe('/wikidepoble?item=genoma%2E');
    expect(new URL(rutaDeDocumentWiki('genoma.'), 'http://localhost').searchParams.get('item')).toBe('genoma.');
  });
});

describe('respostaDeLaIAIA', () => {
  const ambFixtura = () => Promise.resolve({ items: FIXTURA });

  test('compon la resposta amb els documents trobats', async () => {
    const carrega = vi.fn(ambFixtura);
    expect(await respostaDeLaIAIA('Què és Sollutia?', { carrega })).toBe(
      `${ENCAPCALAMENT_DE_LA_WIKI}\nSollutia és l’amfitrió de l’app.\n· Soci Sollutia — /wikidepoble?item=sollutia`
    );
    expect(carrega).toHaveBeenCalledTimes(1);
  });

  test('sense cap document trobat, null', async () => {
    expect(await respostaDeLaIAIA('zzqx', { carrega: ambFixtura })).toBeNull();
  });

  /* Gauntlet 261022_0225 (crítica Claude) · IAIA-5. A una salutació, la
     seua salutació (la mateixa que la benvinguda), no «Ara estic en proves». */
  test('una salutació ni tan sols carrega la Wiki: la IAIA torna la salutació', async () => {
    const carrega = vi.fn(ambFixtura);
    expect(await respostaDeLaIAIA('Bon dia, IAIA', { carrega })).toBe(SALUTACIO_TECNICA_IAIA);
    /* Revisió de la crítica · I a tot missatge sense cap paraula que busque. */
    expect(await respostaDeLaIAIA('Gràcies', { carrega })).toBe(SALUTACIO_TECNICA_IAIA);
    expect(await respostaDeLaIAIA('   ', { carrega })).toBeNull();
    expect(carrega).not.toHaveBeenCalled();
  });

  test('si la càrrega falla o el manifest no és vàlid, null i mai cap rebuig', async () => {
    await expect(respostaDeLaIAIA('pedra', { carrega: () => Promise.reject(new Error('xarxa')) })).resolves.toBeNull();
    await expect(respostaDeLaIAIA('pedra', { carrega: () => { throw new Error('síncron'); } })).resolves.toBeNull();
    await expect(respostaDeLaIAIA('pedra', { carrega: () => Promise.resolve(null) })).resolves.toBeNull();
  });

  test(`si la Wiki no arriba en ${TEMPS_MAXIM_DE_LA_WIKI} ms, null`, async () => {
    vi.useFakeTimers();
    const resposta = respostaDeLaIAIA('pedra', { carrega: () => new Promise(() => {}) });
    await vi.advanceTimersByTimeAsync(TEMPS_MAXIM_DE_LA_WIKI);
    await expect(resposta).resolves.toBeNull();
  });
});

describe('amb la Wiki de veres del paquet', () => {
  const ids = new Set(wikiManifest.items.map((item) => item.id));
  const enllacos = (text) => [...String(text).matchAll(/\/wikidepoble\?item=([^\s]+)/g)].map((m) => decodeURIComponent(m[1]));

  test('la càrrega per defecte (import() del manifest) troba 3 documents que la Wiki pinta', async () => {
    const text = await respostaDeLaIAIA('Què és Sollutia i el Model B?');
    expect(text.split('\n')[0]).toBe(ENCAPCALAMENT_DE_LA_WIKI);
    const slugs = enllacos(text);
    expect(slugs).toHaveLength(DOCUMENTS_PER_RESPOSTA);
    expect(slugs.every((slug) => ids.has(slug))).toBe(true);
    /* Cada document trobat porta alguna paraula de la pregunta. */
    const index = construeixIndex(wikiManifest.items);
    for (const slug of slugs) {
      const document = index.documents.find((d) => d.id === slug);
      expect([slug, ['sollutia', 'model'].some((terme) => document.freq.has(arrel(terme)))]).toEqual([slug, true]);
    }
  });

  test('una salutació torna la salutació; una paraula que no hi és, null: la IAIA respon la frase de sempre', async () => {
    expect(await respostaDeLaIAIA('Bon dia, IAIA')).toBe(SALUTACIO_TECNICA_IAIA);
    expect(await respostaDeLaIAIA('zzqxwv')).toBeNull();
  });

  /* Gauntlet 261022_0225 (crítica Claude) · IAIA-2. Les huit preguntes de
     veïnat de la crítica, sobre la Wiki de veres, i les paràfrasis de la
     revisió: cada fila diu l'estat que n'espera i, si respon, la primera font;
     cap altra font fora de les que hi toquen. Cap instrucció per a la IA, cap
     plantilla, cap fitxa de l'equip. La Wiki pública encara no té cap manual
     d'ús (Tasca 4 PARCIAL): les fonts que hi toquen són de projecte. */
  test.each([
    ['Com puc publicar al Mercat?', 'sense_resultats'],
    ['Què és la Gestoria?', 'sense_resultats'],
    ['Com pujo una foto al xat?', 'sense_resultats'],
    ['Qui porta Sóc de Poble?', 'resposta', '00_full_de_ruta',
      ['00_full_de_ruta', '00_visio_i_pilars', 'identitat_visual', 'el_projecte', 'arquitectura_l_anima', '01_identitat', '00_index_identitat']],
    ['Com esborre el meu compte?', 'sense_resultats'],
    ['Què és un node?', 'sense_resultats'],
    ['Com puc connectar amb un autor?', 'sense_resultats'],
    ['Les meues dades són privades?', 'resposta', 'ADR-2026-08-ONLINE-FIRST',
      ['ADR-2026-08-ONLINE-FIRST', 'seguretat_execucio', 'ADR-2026-13-BYOP-XIFRAT-LOCAL', 'llei_05_privacitat']],
    ['Com faig una nota?', 'sense_resultats'],
    ['Quant costa?', 'sense_resultats'],
    ['Com instal·le l’app al mòbil?', 'sense_resultats'],
    ['Com em registre?', 'sense_resultats'],
    ['Què és el Rebost?', 'sense_resultats'],
    ['Com funciona el Bar?', 'sense_resultats'],
    ['Com passe les portes de qualitat?', 'sense_resultats']
  ])('«%s»: %s', async (pregunta, estat, primera, quehitoquen = []) => {
    const r = await consultaTecnicaIAIA(pregunta);
    const ids = r.fonts.map((font) => font.id);
    expect([pregunta, r.estat, ids[0]]).toEqual([pregunta, estat, primera]);
    expect([pregunta, ids.filter((id) => !quehitoquen.includes(id))]).toEqual([pregunta, []]);
  });

  test('les fonts bones continuen arribant: Sollutia, la privacitat, els pilars i el Trellat', async () => {
    expect((await consultaTecnicaIAIA('Què és Sollutia?')).fonts.map((f) => f.id).slice(0, 2).sort())
      .toEqual(['ADR-2026-09-SOLLUTIA-MODEL-B', 'soci_sollutia']);
    expect((await consultaTecnicaIAIA('Què diu la llei de privacitat?')).fonts[0].id).toBe('llei_05_privacitat');
    expect((await consultaTecnicaIAIA('Quins són els pilars de Sóc de Poble?')).fonts[0].id).toBe('00_visio_i_pilars');
    expect((await consultaTecnicaIAIA('Què és el Trellat?')).fonts[0].id).toBe('01_trellat');
  });

  /* Si un d'estos documents canvia d'id, la prova ho diu: la llista
     d'iaiaLocal.js s'ha d'actualitzar, mai buidar. */
  test('cap document de la Wiki que parle a la IA, de memòria de l’equip o de plantilla no ix com a font', () => {
    const index = construeixIndex(wikiManifest.items);
    const servits = new Set(index.documents.map((d) => d.id));
    for (const item of wikiManifest.items) {
      if (['plantilla', 'prompt', 'bundle', 'skill', 'protocol'].includes(item.attributes?.type)) expect([item.id, servits.has(item.id)]).toEqual([item.id, false]);
    }
    for (const id of ['personalitat_iaia', 'perfil_psiquiatric', 'agents_equip_ia', 'sgq_prompts', '03_llibre_d_or_memoria_episodica',
      '04_taula_potencia_models', '03_equip_ia']) {
      expect([id, wikiManifest.items.some((item) => item.id === id), servits.has(id)]).toEqual([id, true, false]);
    }
    for (const carpeta of ['folder:02_saber/obsidian_plugins', 'folder:02_saber/03_consola_termodinamica']) {
      const dins = wikiManifest.items.filter((item) => item.categoryId === carpeta).map((item) => item.id);
      expect([carpeta, dins.length > 0, dins.filter((id) => servits.has(id))]).toEqual([carpeta, true, []]);
    }
  });

  /* Qualitat mínima de la cerca. Mesura del 261016 sobre el manifest d'eixe
     dia: 79 de 79 documents es troben pel seu títol. El manifest es regenera
     amb la Wiki, i per això el sostre deixa un marge del 10 %. */
  test('cada document es troba pel seu propi títol entre els 3 primers', () => {
    const index = construeixIndex(wikiManifest.items);
    const ambTermes = index.documents.filter((d) => termesDeLaPregunta(d.titol).length);
    const perduts = ambTermes.filter((d) => !cerca(index, d.titol).some((r) => r.id === d.id)).map((d) => `${d.id}: ${d.titol}`);
    expect(ambTermes.length).toBeGreaterThan(0);
    expect(perduts.length / ambTermes.length, perduts.join('\n')).toBeLessThanOrEqual(0.1);
  });
});
