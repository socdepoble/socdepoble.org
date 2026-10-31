// @vitest-environment node
/* IDEA-56 (pla 261029_1605, Bloc F.2) · El cervell local zero-tokens de la
   IAIA MarIA: la capa local (l'Atles Operatiu del Sistema i els pobles de la
   llavor) respon sense cap càrrega ni xarxa; la segona capa (la Wiki i les
   pàgines triades de PAGE_COPY) només quan l'Atles no ho sap. Ací es fixen
   les cinc preguntes del Mestre, el castellà, les negatives, la privacitat,
   la integritat de l'Atles, les pàgines, el llindar i el temps. */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  ATLES_OPERATIU, DF_MAXIM_DEL_COS, ENCAPCALAMENT_DE_LA_WIKI, ENCAPCALAMENT_DE_SOC_DE_POBLE, EQUIVALENCIES, MAXIM_FRAGMENT_DE_L_ATLES,
  PAGINES_PER_A_LA_IAIA, RUTA_INTERNA, RUTES_DE_PAGINA, componResposta, construeixIndex, cercaRellevant, documentDelPoble,
  documentsDePageCopy, indexDeLaCapaLocal, oblidaIndexDeLaWiki, respostaDeLaIAIA, rutaDePagina, termesDeLaPregunta, textDeHtml, tokenitza
} from './iaiaLocal.js';
import { MOCK_TOWNS } from '../sections/pobles/townsSeed.js';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { legalContent } from '../sections/text/legalContent.js';
import { SECTIONS } from '../config/sections.js';
import { RUTES_CANONIQUES } from '../config/navigation.js';
import { SYSTEM_PAGES } from '../config/systemPages.js';
import CA from '../config/idiomes/ca.js';

afterEach(() => { oblidaIndexDeLaWiki(); });

const plega = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const liniesDeRuta = (text) => String(text).split('\n').filter((linia) => linia.startsWith('· '));

/* Les cinc preguntes del Mestre (prompt 1605, §5 F.2). */
const DEL_MESTRE = [
  ['Què és el Mercat?', 'atles:mercat', 'El Mercat', '/mercat'],
  ["Parla'm de Rentonar", 'atles:rentonar', 'El Rentonar', '/rentonar'],
  ['Qui és Javi?', 'atles:javi', 'Javi Llinares', '/javillinares'],
  ['Com funciona Multimèdia?', 'atles:multimedia', "Multimèdia i Gestor d'Arxius", '/multimedia'],
  ['¿Qué es Sóc de Poble?', 'atles:socdepoble', 'Sóc de Poble', '/projecte']
];

describe('la capa local respon sense cap càrrega', () => {
  test.each(DEL_MESTRE)('«%s» → %s, sense xarxa', async (pregunta, id, titol, ruta) => {
    const carrega = vi.fn();
    const text = await respostaDeLaIAIA(pregunta, { carrega });
    expect(carrega).not.toHaveBeenCalled();
    expect(text.split('\n')[0]).toBe(ENCAPCALAMENT_DE_SOC_DE_POBLE);
    expect(liniesDeRuta(text)).toEqual([`· ${titol} — ${ruta}`]);
    expect(cercaRellevant(indexDeLaCapaLocal(), pregunta).map((resultat) => resultat.id)).toEqual([id]);
  });

  test.each([
    ['¿Qué es el mercado?', 'atles:mercat'],
    ['¿Quién es Javi?', 'atles:javi'],
    ['Háblame de Rentonar', 'atles:rentonar'],
    ['¿Cómo funciona el chat?', 'atles:xat'],
    ['Propón Card', 'atles:proposa_card']
  ])('en castellà, «%s» → %s', async (pregunta, id) => {
    expect(cercaRellevant(indexDeLaCapaLocal(), pregunta).map((resultat) => resultat.id)).toEqual([id]);
    const carrega = vi.fn();
    expect((await respostaDeLaIAIA(pregunta, { carrega })).split('\n')[0]).toBe(ENCAPCALAMENT_DE_SOC_DE_POBLE);
    expect(carrega).not.toHaveBeenCalled();
  });

  test.each([
    ['Què és el Xat?', 'atles:xat'], ['Què és el Mur?', 'atles:mur'], ['Com faig una nota?', 'atles:notes'],
    ['Qui és el servei tècnic?', 'atles:javi'], ['Què és el Mas?', 'atles:socdepoble'], ['Quins pobles hi ha?', 'atles:pobles'],
    ['Penàguila', 'poble:penaguila'], ['On és la Torre de les Maçanes?', 'poble:la-torre-de-les-macanes'],
    ['Com puc publicar al Mercat?', 'atles:mercat'], ['Com pujo una foto al xat?', 'atles:xat']
  ])('«%s» → %s', (pregunta, id) => {
    expect(cercaRellevant(indexDeLaCapaLocal(), pregunta).map((resultat) => resultat.id)).toEqual([id]);
  });
});

describe('el que la IAIA no sap', () => {
  test.each(['quin temps fa a Tòquio', 'asdfgh', '¿Qué tiempo hace en Tokio?', 'Quant costa?', 'Benidorm', 'futbol', 'telèfon', 'NIF'])(
    '«%s»: cap document de cap capa, i la IAIA respon la frase de sempre (null)',
    async (pregunta) => {
      expect(cercaRellevant(indexDeLaCapaLocal(), pregunta)).toEqual([]);
      expect(await respostaDeLaIAIA(pregunta)).toBeNull();
    }
  );

  test('«asdfgh» busca (no és cap salutació): torna null, no la salutació', () => {
    expect(termesDeLaPregunta('asdfgh')).toEqual(['asdfgh']);
  });
});

describe('privacitat', () => {
  /* Les dades del titular de la pàgina legal, llegides d'allí (cap còpia ací). */
  const html = JSON.stringify(legalContent);
  const nif = /NIF:<\/strong>\s*([0-9A-Z]{9})/.exec(html)?.[1];
  const domicili = /Domicili:<\/strong>\s*([^<,]+)/.exec(html)?.[1]?.trim();
  const delicat = (text) => /\b\d{8}[A-Z]\b|@|mailto/i.test(text) || text.includes(nif) || text.includes(domicili);
  /* Les pàgines poden dir «@usuari» (Versions): ací compta un correu sencer. */
  const ambDadesPersonals = (text) => /\b\d{8}[A-Z]\b|[\w.+-]+@[\w-]+\.\w|mailto/i.test(text) || text.includes(nif) || text.includes(domicili);

  test('la pàgina legal porta les dades del titular (la prova les sap llegir)', () => {
    expect([nif?.length, Boolean(domicili)]).toEqual([9, true]);
  });

  test.each(['Qui és Javi?', 'On viu Javi?', 'adreça de Javi', 'NIF de Javi', 'correu de Javi', 'telèfon de Javi', 'Qui és el responsable del tractament?'])(
    '«%s»: cap NIF, domicili, correu ni enllaç de correu a la resposta',
    async (pregunta) => {
      expect([pregunta, delicat(String(await respostaDeLaIAIA(pregunta) ?? ''))]).toEqual([pregunta, false]);
    }
  );

  test('cap pàgina de l’equip ni la legal; cap document de PAGE_COPY amb dades personals', () => {
    for (const clau of ['legal', 'consola', 'cervell', 'disseny', 'notes', 'notes_shared']) expect(PAGINES_PER_A_LA_IAIA).not.toContain(clau);
    expect(documentsDePageCopy(PAGE_COPY).filter((document) => ambDadesPersonals(`${document.title} ${document.subtitle} ${document.content}`)).map((d) => d.id)).toEqual([]);
    /* Sonda: el patró veu les dades del titular de la pàgina legal. */
    expect(ambDadesPersonals(textDeHtml(legalContent.html))).toBe(true);
    /* Encara que algú li passe la pàgina legal sencera, no entra. */
    expect(documentsDePageCopy({ legal: legalContent })).toEqual([]);
  });
});

describe('l’Atles Operatiu del Sistema', () => {
  /* Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity) · I la
     d'una pàgina del sistema servida a /page/<clau> (SYSTEM_PAGES): hui,
     només la candidatura, /page/fediversity. */
  const rutesValides = new Set([
    ...SECTIONS.filter((seccio) => ['xat', 'mur', 'mercat', 'pobles', 'notes', 'multimedia', 'projecte'].includes(seccio.id)).map((seccio) => seccio.path),
    RUTES_CANONIQUES.javillinares, RUTES_CANONIQUES.rentonar,
    ...SYSTEM_PAGES.map((pagina) => pagina.href).filter((ruta) => ruta.startsWith('/page/'))
  ]);
  const text = (entrada) => entrada.paragrafs.join(' ');
  const perId = (id) => ATLES_OPERATIU.find((entrada) => entrada.id === id);

  test('ids únics amb el prefix atles:, cada entrada sencera dins del màxim, el títol al primer paràgraf', () => {
    const ids = ATLES_OPERATIU.map((entrada) => entrada.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entrada of ATLES_OPERATIU) {
      expect([entrada.id, entrada.id.startsWith('atles:'), text(entrada).length <= MAXIM_FRAGMENT_DE_L_ATLES]).toEqual([entrada.id, true, true]);
    }
    expect(Object.isFrozen(ATLES_OPERATIU) && ATLES_OPERATIU.every((entrada) => Object.isFrozen(entrada) && Object.isFrozen(entrada.paragrafs))).toBe(true);
  });

  test('cap marcatge, adreça web, correu ni paraula de les fixtures de les proves', () => {
    const vetades = ['sollutia', 'pedra', 'quota', 'rebost', 'safata'];
    for (const entrada of ATLES_OPERATIU) {
      const cos = `${entrada.titol} ${text(entrada)}`;
      expect([entrada.id, /[<`@]|http/.test(cos)]).toEqual([entrada.id, false]);
      expect([entrada.id, vetades.filter((paraula) => plega(cos).includes(paraula))]).toEqual([entrada.id, []]);
    }
  });

  test('cada ruta és interna, d’una secció o d’una identitat canònica, i cada títol troba la seua entrada', () => {
    for (const entrada of ATLES_OPERATIU) {
      expect([entrada.id, RUTA_INTERNA.test(entrada.ruta), rutesValides.has(entrada.ruta)]).toEqual([entrada.id, true, true]);
      expect([entrada.id, cercaRellevant(indexDeLaCapaLocal(), entrada.titol)[0]?.id]).toEqual([entrada.id, entrada.id]);
    }
  });

  test('els fets que depenen d’altres peces casen amb la seua font', () => {
    for (const poble of MOCK_TOWNS) expect(text(perId('atles:pobles'))).toContain(poble.title);
    expect(text(perId('atles:multimedia'))).toContain(CA['section.multimedia.local.vincula']);
    expect(text(perId('atles:multimedia'))).toContain(CA['section.multimedia.local.privadesa']);
    expect(text(perId('atles:proposa_card'))).toContain(CA['section.notes.proposaCard']);
    expect(text(perId('atles:proposa_card'))).toContain(CA['section.notes.proposaCardDesfer']);
    /* Bloc F.1 (P1-70) · Cap promesa que no siga certa en tots els modes:
       la IAIA es pot apagar, i Javi no té directe en remot sense compte. */
    expect(text(perId('atles:xat'))).toContain('quatre converses fixes');
    expect(text(perId('atles:xat'))).toContain('nivell d');
    expect(plega(text(perId('atles:javi')))).not.toMatch(/directe|parla amb ell|escriu-li/);
  });

  test('l’Atles no respon cap pregunta de les fixtures d’iaiaLocal.test.js ni d’iaiaLocal.consulta.test.js', () => {
    for (const pregunta of ['Què és Sollutia?', 'pedra', 'Com funciona Sollutia?', 'quota', 'Com funciona el Rebost, IAIA?', 'zzqx',
      'Com esborre la safata del pis?', 'Com esborre el meu compte?', 'Què és Sollutia i el Model B?', 'Sollutia']) {
      expect([pregunta, cercaRellevant(indexDeLaCapaLocal(), pregunta)]).toEqual([pregunta, []]);
    }
  });

  test('la fitxa d’un poble: nom, comarca, text i comunitat, sense població; una fitxa sense id es bota', () => {
    const torre = MOCK_TOWNS.find((poble) => poble.id === 'la-torre-de-les-macanes');
    expect(documentDelPoble(torre)).toEqual({
      id: 'poble:la-torre-de-les-macanes', title: torre.title, tags: [torre.comarca], ruta: '/pobles/la-torre-de-les-macanes', font: 'poble',
      content: `# ${torre.title}\n\n${torre.content} Al Xat, la seua comunitat es diu «Gent de la Torre».`
    });
    expect(documentDelPoble(torre).content).not.toContain(torre.population);
    expect([documentDelPoble(null), documentDelPoble({ title: 'X' })]).toEqual([null, null]);
    expect(indexDeLaCapaLocal().documents.map((document) => document.id).filter((id) => id.startsWith('poble:')))
      .toEqual(MOCK_TOWNS.map((poble) => `poble:${poble.id}`));
  });
});

/* Gauntlet 261029 (cicle 1, iaia-resposta-buida-per-etiqueta) · Una paraula
   que només és al títol o a les claus («Què és el Mas?») trobava l'entrada i
   la IAIA responia només l'enllaç. A la capa curada, el fragment buit és el
   primer bloc: l'entrada sencera de l'Atles, la fitxa del poble. */
describe('la capa curada sempre diu el text (Gauntlet 261029, cicle 1)', () => {
  const sencera = (id) => ATLES_OPERATIU.find((entrada) => entrada.id === id).paragrafs.join(' ');

  test('cada clau de cada entrada de l’Atles troba l’entrada, amb l’entrada sencera com a fragment', () => {
    for (const entrada of ATLES_OPERATIU) {
      for (const clau of entrada.claus) {
        const trobada = cercaRellevant(indexDeLaCapaLocal(), clau).find((resultat) => resultat.id === entrada.id);
        expect([entrada.id, clau, trobada?.fragment]).toEqual([entrada.id, clau, sencera(entrada.id)]);
      }
    }
  });

  test('cada comarca troba els seus pobles amb la fitxa, no només l’enllaç', () => {
    for (const poble of MOCK_TOWNS.filter((p) => typeof p.comarca === 'string')) {
      const trobat = cercaRellevant(indexDeLaCapaLocal(), poble.comarca, MOCK_TOWNS.length).find((resultat) => resultat.id === `poble:${poble.id}`);
      expect([poble.id, Boolean(trobat?.fragment)]).toEqual([poble.id, true]);
    }
  });

  test.each([['Què és el Mas?', 'atles:socdepoble'], ['Què és la plataforma?', 'atles:socdepoble'], ['Comprar', 'atles:mercat'],
    ['Vendre', 'atles:mercat'], ['Fototeca', 'atles:multimedia']])('«%s»: la resposta porta el text de %s, no només l’enllaç', async (pregunta, id) => {
    const text = await respostaDeLaIAIA(pregunta, { carrega: vi.fn() });
    expect(text.split('\n')).toEqual([ENCAPCALAMENT_DE_SOC_DE_POBLE, sencera(id), expect.stringMatching(/^· /)]);
  });

  test('la Wiki no canvia: un document que només casa pel títol continua sense fragment', () => {
    const [wiki] = cercaRellevant(construeixIndex([{ id: 'w', title: 'Gallines', content: '# Gallines\n\nLes cabres del corral pasturen cada matí.' }]), 'gallines');
    expect(wiki.fragment).toBe('');
  });
});

/* Gauntlet 261029 (cicle 1, atles-xat-sense-negreta) · La IAIA explica la
   negreta del Xat (IDEA-53) des de l'Atles, sense cap càrrega i sense la
   jerga tècnica de la Wiki. */
describe('la negreta del Xat a l’Atles (Gauntlet 261029, cicle 1)', () => {
  const negreta = () => ATLES_OPERATIU.find((entrada) => entrada.id === 'atles:negreta').paragrafs.join(' ');

  test.each(['Negreta', 'Com poso negreta?', 'Com faig una negreta al xat?', 'negreta al xat', 'Com es fa la negreta?', '¿Cómo pongo negrita?',
    'Com destaque una paraula al xat?', 'Com poso una paraula en negreta al xat?'])('«%s» → atles:negreta, sense cap càrrega', async (pregunta) => {
    expect(cercaRellevant(indexDeLaCapaLocal(), pregunta).map((resultat) => resultat.id)).toEqual(['atles:negreta']);
    const carrega = vi.fn();
    const text = await respostaDeLaIAIA(pregunta, { carrega });
    expect(carrega).not.toHaveBeenCalled();
    expect(text.split('\n')).toEqual([ENCAPCALAMENT_DE_SOC_DE_POBLE, negreta(), '· La negreta — /xat']);
    expect(text).not.toMatch(/E2EE|Shamir|HKDF|Guàrdia/);
  });

  test('diu el que fa el codi: el botó N, la drecera del seu títol, els asteriscs i el cursor al mig', () => {
    const drecera = /\(([^)]+)\)/.exec(CA['section.xat.negreta.titol'])?.[1];
    expect(drecera).toBe('⌘B / Ctrl+B');
    expect(negreta()).toContain(drecera);
    expect(negreta()).toContain(`botó ${CA['section.xat.negreta.lletra']}`);
    expect(negreta()).toContain('asteriscs');
    expect(negreta()).toContain('cursor al mig');
  });
});

/* Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity) · La IAIA
   respon de la candidatura des de l'Atles, en valencià i en castellà, sense
   cap càrrega, i diu el mateix que la pàgina: en avaluació, cap diner rebut.
   L'enllaç és el de la pàgina, /page/fediversity. */
describe('la candidatura NLnet a l’Atles (30-10-2026)', () => {
  const candidatura = () => ATLES_OPERATIU.find((entrada) => entrada.id === 'atles:fediversity').paragrafs.join(' ');

  test.each(['Què és NGI Fediversity?', '¿Qué es NGI Fediversity?', 'la subvenció d’NLnet', '¿Qué es la subvención de NLnet?',
    'candidatura europea', 'Fediversity', 'NLnet'])('«%s» → atles:fediversity, sense cap càrrega', async (pregunta) => {
    expect(cercaRellevant(indexDeLaCapaLocal(), pregunta)[0]?.id).toBe('atles:fediversity');
    const carrega = vi.fn();
    const text = await respostaDeLaIAIA(pregunta, { carrega });
    expect(carrega).not.toHaveBeenCalled();
    expect(text.split('\n').slice(0, 3)).toEqual([ENCAPCALAMENT_DE_SOC_DE_POBLE, candidatura(), '· Candidatura NLnet · NGI Fediversity — /page/fediversity']);
  });

  test('diu el que diu la pàgina: en avaluació, sense diners rebuts, i les xifres del formulari', () => {
    expect(candidatura()).toContain('en avaluació');
    expect(candidatura()).toContain("encara no s'ha concedit cap diner");
    expect(candidatura()).toContain('50.000 €');
    expect(candidatura()).toContain('1.000 hores');
    expect(PAGE_COPY.fediversity.lead).toContain("encara no s'ha concedit cap diner");
    expect(RUTA_INTERNA.test('/page/fediversity')).toBe(true);
    expect(plega(candidatura())).not.toMatch(/concedida|hem rebut|financat per/);
  });

  /* Ordre del Mestre (30-10-2026, ~00:50) · Els nodes actius i la visió
     «Gent de…»: la IAIA respon el mateix que /page/fediversity i que la
     pàgina Nodes i Fedivers, en valencià i en castellà. */
  test.each(['Què és Gent de la Torre?', '¿Qué es Gent de la Torre?', 'gentdelatorre.net', 'Puc obrir el node del meu poble?',
    '¿Puedo abrir el nodo de mi pueblo?'])('«%s» → atles:gentdelatorre, amb els dos nodes, sense cap càrrega', async (pregunta) => {
    expect(cercaRellevant(indexDeLaCapaLocal(), pregunta)[0]?.id).toBe('atles:gentdelatorre');
    const carrega = vi.fn();
    const text = await respostaDeLaIAIA(pregunta, { carrega });
    expect(carrega).not.toHaveBeenCalled();
    expect(text).toContain('gentdelatorre.net');
    expect(text).toContain('socdepoble.org');
    expect(liniesDeRuta(text)[0]).toBe('· Gent de la Torre — /page/fediversity');
  });

  test.each(['Quins nodes hi ha?', '¿Qué nodos hay?'])('«%s» → la pàgina Nodes i Fedivers, que nomena els dos nodes actius', async (pregunta) => {
    expect(cercaRellevant(indexDeLaCapaLocal(), pregunta)).toEqual([]);
    const text = await respostaDeLaIAIA(pregunta);
    expect(liniesDeRuta(text)[0]).toBe(`· ${PAGE_COPY.fedivers.title} — /fedivers`);
    expect(text).toContain('socdepoble.org');
    expect(text).toContain('gentdelatorre.net');
  });

  test('la visió «Gent de…», sense cap node inventat ni cap descàrrega que no és pública', () => {
    const nodes = ATLES_OPERATIU.find((entrada) => entrada.id === 'atles:gentdelatorre').paragrafs.join(' ');
    expect(nodes).toContain("Hui encara no n'hi ha cap més");
    // 31-10-2026 · WordPress.org ha aprovat el connector (slug socdepoble), però la fitxa no és pública
    // fins al primer commit SVN: l'Atles diu l'aprovació i res més.
    expect(nodes).toContain('El directori de connectors de WordPress.org ja ha aprovat el connector, amb el nom socdepoble.');
    expect(nodes).not.toContain('encara no és al directori');
    expect(nodes).not.toMatch(/gentde(?!latorre)[a-z]+\./i);
  });

  test('«Què és el Fedivers?» i «Què és un node?» no canvien de resposta', () => {
    expect(cercaRellevant(indexDeLaCapaLocal(), 'Què és el Fedivers?').map((resultat) => resultat.id)).not.toContain('atles:fediversity');
    expect(cercaRellevant(indexDeLaCapaLocal(), 'Què és un node?').map((resultat) => resultat.id)).not.toContain('atles:fediversity');
  });
});

describe('les pàgines de PAGE_COPY (segona capa)', () => {
  test('les 18 triades, amb la ruta de la seua secció o /page/<clau>, sense HTML', () => {
    const documents = documentsDePageCopy(PAGE_COPY);
    expect(documents.map((document) => document.id)).toEqual(PAGINES_PER_A_LA_IAIA.map((clau) => `pagina:${clau}`));
    expect(PAGINES_PER_A_LA_IAIA).toHaveLength(18);
    for (const document of documents) {
      const clau = document.id.slice('pagina:'.length);
      const esperada = SECTIONS.find((seccio) => seccio.pageKey === clau)?.path ?? `/page/${clau}`;
      expect([clau, document.ruta, rutaDePagina(clau), RUTA_INTERNA.test(document.ruta)]).toEqual([clau, esperada, esperada, true]);
      expect([clau, /[<>]|&amp;/.test(document.content)]).toEqual([clau, false]);
      expect([clau, /<script|<style|<iframe|\son\w+=/i.test(PAGE_COPY[clau].html || '')]).toEqual([clau, false]);
    }
    for (const [clau, ruta] of Object.entries(RUTES_DE_PAGINA)) expect([clau, SECTIONS.find((seccio) => seccio.pageKey === clau)?.path]).toEqual([clau, ruta]);
  });

  test('textDeHtml: títols com a línia ###, paràgrafs separats, entitats sense tornar a formar etiquetes', () => {
    expect(textDeHtml('<h3>Títol</h3><p>Hola &amp; adeu <strong>fort</strong> &lt;b&gt;</p>')).toBe('### Títol\n\nHola & adeu fort ‹b›');
    expect(textDeHtml('<ul><li>u</li><li>dos<br/>tres</li></ul>')).toBe('u\n\ndos\n\ntres');
    expect([textDeHtml(null), textDeHtml('&lt;script&gt;')]).toEqual(['', '‹script›']);
  });

  /* Gauntlet intern (F.2) · Un comentari HTML no es veu a la pàgina
     (PAGE_COPY.roadmap n'amaga un tros): la IAIA no el cita. Un «<» o un
     «>» solt no torna a formar cap etiqueta. */
  test('textDeHtml: sense els comentaris (tancats o no) i sense cap «<» ni «>» solt', () => {
    expect(textDeHtml('<p>Visible</p><!--\n<h3>Amagat</h3><p>secret</p>\n--><p>També</p>')).toBe('Visible\n\nTambé');
    expect(textDeHtml('<p>Visible</p><!-- sense tancar <p>secret</p>')).toBe('Visible');
    expect(textDeHtml('3 > 2 i a < b <<script>>x')).toBe('3 › 2 i a ‹ b ‹›x');
    expect(PAGE_COPY.roadmap.html).toContain('<!--');
    expect(documentsDePageCopy(PAGE_COPY).find((document) => document.id === 'pagina:roadmap').content).not.toMatch(/<!--|-->/);
  });

  test('textDeHtml és lineal (sense retrocés): 64 KiB d’etiquetes i comentaris sense tancar en menys de 50 ms', () => {
    for (const adversari of [`${'<a'.repeat(16_384)}${'&amp'.repeat(8_192)}`, '<!--'.repeat(16_384), `${'<h2 '.repeat(8_192)}${'<li '.repeat(8_192)}`]) {
      const inici = performance.now();
      textDeHtml(adversari);
      expect(performance.now() - inici).toBeLessThan(50);
    }
  });

  test('«Què és un node?» i «Com instal·le l’app al mòbil?» les troba la segona capa (pàgines)', async () => {
    const node = await respostaDeLaIAIA('Què és un node?');
    expect(node.split('\n')[0]).toBe(ENCAPCALAMENT_DE_SOC_DE_POBLE);
    expect(liniesDeRuta(node)[0]).toBe(`· ${PAGE_COPY.fedivers.title} — /fedivers`);
    const app = await respostaDeLaIAIA('Com instal·le l’app al mòbil?');
    expect(liniesDeRuta(app)[0]).toBe(`· ${PAGE_COPY.descarregues.title} — /page/descarregues`);
  });

  test('una pregunta de la Wiki continua portant la capçalera de la Wiki', async () => {
    expect((await respostaDeLaIAIA('Què és el Trellat?')).split('\n')[0]).toBe(ENCAPCALAMENT_DE_LA_WIKI);
  });
});

describe('el llindar suavitzat', () => {
  const doc = (id, content, extra = {}) => ({ id, title: id, tags: [], attributes: {}, content, ...extra });
  const relleno = 'Un text prou llarg perquè siga un fragment citable del document.';
  const ids = (index, pregunta) => cercaRellevant(index, pregunta).map((resultat) => resultat.id);

  test('una paraula a les etiquetes compta com al títol', () => {
    expect(ids(construeixIndex([doc('a', `# Hort\n\n${relleno}`, { tags: ['reg'] })]), 'reg')).toEqual(['a']);
  });

  test('una paraula només al cos: la troba una pàgina de Sóc de Poble, mai el cos de la Wiki', () => {
    const cos = `# Animals\n\nLes gallines del corral ponen ous cada matí. ${relleno}`;
    expect(ids(construeixIndex([doc('p', cos, { font: 'pagina', ruta: '/page/animalets' })]), 'gallines')).toEqual(['p']);
    expect(ids(construeixIndex([doc('w', cos)]), 'gallines')).toEqual([]);
  });

  test('si un altre document la porta al títol, el cos de la pàgina ja no entra; si és massa comuna (df > màxim), tampoc', () => {
    const cos = `# Animals\n\nLes gallines del corral ponen ous cada matí. ${relleno}`;
    const ambTitol = construeixIndex([doc('p', cos, { font: 'pagina' }), doc('g', `# Gallines\n\n${relleno}`)]);
    expect(ids(ambTitol, 'gallines')).toEqual(['g']);
    const comunes = Array.from({ length: DF_MAXIM_DEL_COS + 1 }, (_, i) => doc(`p${i}`, cos, { font: 'pagina' }));
    expect(ids(construeixIndex(comunes), 'gallines')).toEqual([]);
    expect(ids(construeixIndex(comunes.slice(0, DF_MAXIM_DEL_COS)), 'gallines')).toHaveLength(DF_MAXIM_DEL_COS);
  });

  test('a la capa curada no entra res sense ancoratge, ni amb dues paraules visibles', () => {
    const curat = construeixIndex([doc('c', `# Hort\n\nLes gallines i les cabres del corral. ${relleno}`)], { curat: true });
    expect(ids(curat, 'gallines cabres')).toEqual([]);
    expect(ids(construeixIndex([doc('c', `# Hort\n\nLes gallines i les cabres del corral. ${relleno}`)]), 'gallines cabres')).toEqual(['c']);
  });
});

describe('capçalera, rutes i sanejament', () => {
  test('tots de la Wiki (o sense font), la capçalera de la Wiki; amb un de Sóc de Poble, la de Sóc de Poble', () => {
    const wiki = { id: 'w', titol: 'W', fragment: '' };
    expect(componResposta([wiki]).split('\n')[0]).toBe(ENCAPCALAMENT_DE_LA_WIKI);
    expect(componResposta([{ ...wiki, font: 'wiki' }]).split('\n')[0]).toBe(ENCAPCALAMENT_DE_LA_WIKI);
    for (const font of ['pagina', 'atles', 'poble']) {
      expect(componResposta([wiki, { id: 'x', titol: 'X', fragment: '', font, ruta: '/mercat' }])).toBe(
        `${ENCAPCALAMENT_DE_SOC_DE_POBLE}\n· W — /wikidepoble?item=w\n· X — /mercat`
      );
    }
  });

  test.each(['javascript:alert(1)', 'https://x.cat', '/admin', '//x.cat/mercat', '/mercat?x=1'])(
    'una ruta injectada que no és interna (%s) es descarta: la línia porta la de la Wiki',
    async (ruta) => {
      const carrega = async () => ({ items: [{ id: 'gallines', title: 'Gallines', font: 'pagina', ruta, content: '# Gallines\n\nLes gallines del corral ponen ous cada matí.' }] });
      const text = await respostaDeLaIAIA('gallines', { carrega });
      expect(liniesDeRuta(text)).toEqual(['· Gallines — /wikidepoble?item=gallines']);
      expect(text).not.toContain(ruta);
    }
  );

  test('un resultat de la Wiki porta les claus de sempre; un de l’Atles, també la ruta i la font', () => {
    const [wiki] = cercaRellevant(construeixIndex([{ id: 'w', title: 'Gallines', content: '# Gallines\n\nLes gallines del corral ponen ous cada matí.' }]), 'gallines');
    expect(Object.keys(wiki).sort()).toEqual(['fragment', 'id', 'puntuacio', 'titol']);
    const [atles] = cercaRellevant(indexDeLaCapaLocal(), 'Què és el Mercat?');
    expect(atles).toMatchObject({ id: 'atles:mercat', ruta: '/mercat', font: 'atles' });
    /* L'entrada de l'Atles es diu sencera. */
    expect(atles.fragment).toBe(ATLES_OPERATIU.find((entrada) => entrada.id === 'atles:mercat').paragrafs.join(' '));
  });
});

describe('tokenització', () => {
  test('«Sóc de Poble» és un sol terme; el castellà passa al valencià; «el Mas» no és paraula buida', () => {
    expect(tokenitza('Sóc de Poble')).toEqual(['socdepoble']);
    expect(tokenitza('soy de pueblo')).toEqual(['socdepoble']);
    expect(tokenitza('¿Qué es el mercado?')).toEqual(['mercat']);
    expect(tokenitza('el Mas')).toEqual(['mas']);
    expect(termesDeLaPregunta('¿Quién es Javi?')).toEqual(['javi']);
    expect(Object.isFrozen(EQUIVALENCIES)).toBe(true);
  });

  /* Gauntlet intern (F.2) · Les equivalències són un objecte: una paraula
     que és el nom d'una clau heretada no es pot perdre ni canviar. */
  test('«constructor» o «hasOwnProperty» són paraules, no claus heretades', () => {
    expect(tokenitza('constructor hasOwnProperty')).toEqual(['constructor', 'hasownproperty']);
  });
});

describe('temps', () => {
  const mediana = (valors) => [...valors].sort((a, b) => a - b)[Math.floor(valors.length / 2)];

  test('la capa local en calent respon cada pregunta del Mestre en menys de 10 ms (mediana de 5)', () => {
    indexDeLaCapaLocal();
    for (const [pregunta] of DEL_MESTRE) {
      const mesures = Array.from({ length: 5 }, () => {
        const inici = performance.now();
        componResposta(cercaRellevant(indexDeLaCapaLocal(), pregunta));
        return performance.now() - inici;
      });
      expect([pregunta, mediana(mesures) < 10]).toEqual([pregunta, true]);
    }
  });

  test('la primera construcció de la capa local, en fred, en menys de 50 ms', () => {
    oblidaIndexDeLaWiki();
    const inici = performance.now();
    const index = indexDeLaCapaLocal();
    expect(performance.now() - inici).toBeLessThan(50);
    expect(index.documents).toHaveLength(ATLES_OPERATIU.length + MOCK_TOWNS.length);
    expect(indexDeLaCapaLocal()).toBe(index);
  });
});
