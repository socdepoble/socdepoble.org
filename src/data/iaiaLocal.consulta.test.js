import { afterEach, expect, test, vi } from 'vitest';
import {
  consultaTecnicaIAIA, construeixIndex, cerca, cercaRellevant, MAXIM_PREGUNTA_IAIA, respostaDeLaIAIA, SALUTACIO_TECNICA_IAIA,
  TEMPS_MAXIM_DE_LA_CONSULTA, TEMPS_MAXIM_DE_LA_WIKI, arrel, termesDeLaPregunta, tokenitza
} from './iaiaLocal.js';
import { wikiManifest } from './wikiManifest.js';
import { publicMetadata } from '../../tooling/wiki/lib/publication-policy.mjs';
import CA from '../config/idiomes/ca.js';

/* Revisió de la crítica · Una pregunta d'una sola paraula («Com funciona
   Sollutia?») demana la paraula al títol del document. */
const publicDoc = { id: 'model', title: 'Arquitectura amb Sollutia', content: '# Arquitectura amb Sollutia\n\nEl client passa pel port neutral. Sollutia només oferix lectura GET.\n\nEl taulell mostra les vendes del dia.' };
const carrega = async () => ({ items: [publicDoc] });
afterEach(() => vi.useRealTimers());

test('la resposta conté una afirmació de la font i un destí navegable, sense inventar una síntesi', async () => {
  const r = await consultaTecnicaIAIA('Com funciona Sollutia?', { carrega });
  expect(r.estat).toBe('resposta');
  expect(r.fonts).toEqual([{ id: 'model', titol: 'Arquitectura amb Sollutia', fragment: 'El client passa pel port neutral. Sollutia només oferix lectura GET.', ruta: '/wikidepoble?item=model' }]);
  expect(r.text).toContain(r.fonts[0].fragment);
  expect(r.text).not.toContain('vendes');
});

test('un document explícitament privat mai entra a la cerca encara que el carregador el torne', () => {
  const index = construeixIndex([{ ...publicDoc, visibility: 'private' }, { ...publicDoc, id: 'secret', attributes: { visibility: 'private' } }]);
  expect(cerca(index, 'Sollutia')).toEqual([]);
});

/* Gauntlet 261022_0225 (crítica Claude) · IAIA-6. La guarda del client és
   la mateixa frontera que la política de publicació que diu recolzar: cap
   visibilitat explícita que no siga 'public', ni arxivat ni quarantena. */
test('la guarda de visibilitat del client coincidix amb publicMetadata del compilador', () => {
  const casos = [
    {}, { visibility: 'public' }, { visibility: 'private' }, { visibility: 'interna' }, { visibility: 'restricted' },
    { visibility: 'equip' }, { visibility: '' }, { visibility: undefined }, { status: 'arxivat' }, { status: 'quarantena' },
    { status: 'canonic' }, { status: 'esborrany', visibility: 'public' }, { status: 'arxivat', visibility: 'public' }
  ];
  for (const attributes of casos) {
    const servit = cerca(construeixIndex([{ ...publicDoc, attributes }]), 'Sollutia').length > 0;
    expect([attributes, servit]).toEqual([attributes, publicMetadata(attributes)]);
  }
  for (const visibility of ['interna', 'restricted', 'equip']) {
    expect(cerca(construeixIndex([{ ...publicDoc, visibility }]), 'Sollutia')).toEqual([]);
  }
  expect(cerca(construeixIndex([{ ...publicDoc, attributes: ['public'] }]), 'Sollutia')).toEqual([]);
});

test('les plantilles i els prompts publicats no es presenten com a instruccions d’ajuda', () => {
  const index = construeixIndex(['plantilla', 'prompt', 'bundle', 'skill', 'protocol'].map((type) => ({
    ...publicDoc, id: type, attributes: { type }
  })));
  expect(cerca(index, 'Sollutia')).toEqual([]);
});

/* IAIA-2 · Documents públics que parlen a la IA («Eres L'Ens Híbrid…»,
   «tin en compte el cens del Consell…»): no són ajuda per al poble. */
test('els documents d’instruccions per a la IA no són coneixement d’ajuda', () => {
  const ids = ['personalitat_iaia', 'perfil_psiquiatric', 'agents_equip_ia', 'sgq_prompts', '03_llibre_d_or_memoria_episodica',
    '04_taula_potencia_models', '03_equip_ia'];
  const carpetes = ['folder:02_saber/obsidian_plugins', 'folder:02_saber/03_consola_termodinamica'];
  const index = construeixIndex([...ids.map((id) => ({ ...publicDoc, id })), ...carpetes.map((categoryId, i) => ({ ...publicDoc, id: `equip${i}`, categoryId })),
    { ...publicDoc, id: 'model' }]);
  expect(cerca(index, 'Sollutia').map((r) => r.id)).toEqual(['model']);
});

test('una consulta funcional no premia «funciona» i conserva el tema al final d’un paràgraf llarg', async () => {
  const r = await consultaTecnicaIAIA('Com funciona el Rebost, IAIA?', { carrega: async () => ({ items: [
    { id: 'personalitat', title: 'IAIA', content: '# IAIA\n\nLa IAIA parla amb una personalitat amable i directa.' },
    { id: 'soroll', title: 'Com funciona', content: '# Com funciona\n\nEsta funció funciona per a totes les persones del poble.' },
    { id: 'rebost', title: 'El Rebost', content: `# El Rebost\n\nRebostar és una paraula diferent. ${'Una col·laboració il·lustrada. '.repeat(350)}El Rebost guarda la llista dels productes que necessites comprar.` }
  ] }) });
  expect(r.fonts).toHaveLength(1);
  expect(r.fonts[0].fragment).toContain('El Rebost guarda');
  expect(r.fonts[0].fragment.length).toBeLessThanOrEqual(362);
});

test('una consulta ja cancel·lada no comença a carregar la Wiki', async () => {
  const control = new AbortController();
  control.abort();
  const loader = vi.fn(carrega);
  expect((await consultaTecnicaIAIA('Sollutia', { signal: control.signal, carrega: loader })).estat).toBe('cancel·lada');
  expect(loader).not.toHaveBeenCalled();
});

test('el fragment no interpreta HTML, comentaris ni blocs de codi com una resposta', async () => {
  const r = await consultaTecnicaIAIA('quota', { carrega: async () => ({ items: [{ id: 'quota', title: 'Quota', content: '# Quota\n\n<!-- quota secret -->\n\n```js\nquota executable\n```\n\nLa quota limita la mida dels fitxers que es poden pujar.' }] }) });
  expect(r.fonts[0].fragment).toBe('La quota limita la mida dels fitxers que es poden pujar.');
  expect(r.text).not.toMatch(/secret|executable/);
});

test('buit, massa llarg, salutació i cap coincidència tenen estats diferents', async () => {
  const loader = vi.fn(carrega);
  expect((await consultaTecnicaIAIA('', { carrega: loader })).estat).toBe('pregunta_invalida');
  expect((await consultaTecnicaIAIA('x'.repeat(MAXIM_PREGUNTA_IAIA + 1), { carrega: loader })).estat).toBe('pregunta_invalida');
  expect(await consultaTecnicaIAIA('Bon dia, IAIA', { carrega: loader })).toMatchObject({ estat: 'salutacio', text: SALUTACIO_TECNICA_IAIA });
  expect(loader).not.toHaveBeenCalled();
  expect((await consultaTecnicaIAIA('zzqxx', { carrega: loader })).estat).toBe('sense_resultats');
});

test('xarxa que no acaba: termini limitat i cap temporitzador viu', async () => {
  vi.useFakeTimers();
  const consulta = consultaTecnicaIAIA('Sollutia', { carrega: () => new Promise(() => {}), tempsMaxim: 3000 });
  await vi.advanceTimersByTimeAsync(3000);
  expect((await consulta).estat).toBe('no_disponible');
  expect(vi.getTimerCount()).toBe(0);
});

test('cancel·lar allibera el temporitzador i ignora una resposta tardana', async () => {
  vi.useFakeTimers();
  const control = new AbortController();
  let resol;
  const consulta = consultaTecnicaIAIA('Sollutia', { signal: control.signal, carrega: () => new Promise((r) => { resol = r; }) });
  await Promise.resolve();
  control.abort();
  expect((await consulta).estat).toBe('cancel·lada');
  expect(vi.getTimerCount()).toBe(0);
  resol({ items: [publicDoc] });
  await Promise.resolve();
});

test('rebuig de càrrega és indisponibilitat, mai una llista buida presentada com a coneixement', async () => {
  const r = await consultaTecnicaIAIA('Sollutia', { carrega: () => Promise.reject(new Error('xarxa')) });
  expect(r).toEqual({ estat: 'no_disponible', fonts: [] });
});

/* IAIA-8 · La salutació literal del Mestre (prompt 261022_0225, Tasca 4). */
test('la salutació és, lletra per lletra, la del Mestre, i el diccionari valencià la porta igual', () => {
  const literal = 'Ara no estic pa tonteries, però sí que puc contestar-te preguntes tècniques i explicar-te com funciona qualsevol racó del poble.';
  expect(SALUTACIO_TECNICA_IAIA).toBe(literal);
  expect(CA['section.xat.iaia.salutacio']).toBe(literal);
});

/* IAIA-7 · Una connexió lenta del poble: la consulta espera més que la
   resposta del fil, perquè qui pregunta veu «Consultant la Wiki…». */
test('la consulta espera la primera càrrega més que el fil de la IAIA', async () => {
  vi.useFakeTimers();
  expect(TEMPS_MAXIM_DE_LA_CONSULTA).toBeGreaterThan(TEMPS_MAXIM_DE_LA_WIKI);
  const lenta = () => new Promise((r) => { setTimeout(() => r({ items: [publicDoc] }), TEMPS_MAXIM_DE_LA_WIKI + 2000); });
  const consulta = consultaTecnicaIAIA('Sollutia', { carrega: lenta });
  const fil = respostaDeLaIAIA('Sollutia', { carrega: lenta });
  await vi.advanceTimersByTimeAsync(TEMPS_MAXIM_DE_LA_WIKI + 2000);
  expect((await consulta).estat).toBe('resposta');
  await expect(fil).resolves.toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

/* Revisió de la crítica · Escalfar només baixa: l'índex (uns 50-80 ms al
   fil principal) es construïx a la primera pregunta, no mentre s'escriu. */
test('preparaWikiDeLaIAIA comença la càrrega del paquet abans de cap pregunta, no construïx l’índex i mai no rebutja', async () => {
  vi.resetModules();
  let carregues = 0;
  let lectures = 0;
  vi.doMock('./wikiManifest.js', () => {
    carregues += 1;
    return { wikiManifest: { get items() { lectures += 1; return [publicDoc]; } } };
  });
  try {
    const modul = await import('./iaiaLocal.js');
    expect(modul.preparaWikiDeLaIAIA()).toBeUndefined();
    await vi.waitFor(() => expect(carregues).toBe(1));
    await new Promise((resol) => { setTimeout(resol, 0); });
    expect(lectures).toBe(0);
    expect((await modul.consultaTecnicaIAIA('Sollutia')).estat).toBe('resposta');
    expect(carregues).toBe(1);
    expect(lectures).toBeGreaterThan(0);
  } finally {
    vi.doUnmock('./wikiManifest.js');
    vi.resetModules();
  }
});

/* IDEA-56 (pla 261029_1605, Bloc F.2) · L'Atles i les pàgines són del fil
   de la IAIA: la consulta del diàleg continua sent la Wiki sola (els seus
   textos diuen «He trobat N fonts a la Wiki»).
   Ordre del Mestre (30-10-2026; f4 D.2, P1-49) · «Què és el Mercat?» ja no
   torna buit: troba les dues pàgines de la Wiki que nomenen el Mercat, i
   continua sense cap entrada de l'Atles (actualitzat a posta). */
test('la consulta del diàleg continua sent la Wiki: «Què és el Mercat?» troba la Wiki, i cap font és de l’Atles, d’un poble ni d’una pàgina', async () => {
  expect((await consultaTecnicaIAIA('Què és el Mercat?')).fonts.map((font) => font.id)).toEqual(['ADR-2026-11-PAGINACIO-SECCIONS', '00_index_maquina']);
  for (const pregunta of ['Què és el Mercat?', 'Qui és Javi?', 'Què és un node?', 'Penàguila', 'Què és Sollutia?']) {
    const { fonts } = await consultaTecnicaIAIA(pregunta);
    expect([pregunta, fonts.filter((font) => /^(?:atles|poble|pagina):/.test(font.id))]).toEqual([pregunta, []]);
    expect([pregunta, fonts.every((font) => font.ruta.startsWith('/wikidepoble?item='))]).toEqual([pregunta, true]);
  }
});

/* Ordre del Mestre (30-10-2026; f4 D.2, P1-49 «queda operatiu com a cercador
   guiat de la Wiki») · El nom d'una eina troba el document de la Wiki que el
   diu com a nom al fragment mostrat, encara que no siga al títol: a mitja
   frase amb majúscula («al Mercat») o al cap de l'etiqueta en negreta d'un
   bloc («**Xat E2EE…**»). La majúscula d'inici de frase, de parèntesi o de
   «Sóc de Poble» no fa cap nom, ni el codi en línia. El fil de la IAIA
   (cercaRellevant sense cercaGuiada) no canvia. */
const ADR = { id: 'adr', title: 'Paginació de les seccions', content: '# Paginació de les seccions\n\nLes publicacions de més enllà de les 50 primeres tornen a ser abastables al Mur i al Mercat.' };
const FULL = { id: 'full', title: 'Full de ruta', content: '# Full de ruta\n\n- **Xat E2EE del poble** amb primitives WebCrypto i un magatzem xifrat al navegador.' };
const COMU = { id: 'comu', title: 'Diari de la collita', content: [
  '# Diari de la collita',
  'El preu del mercat de la fruita costa el que costa, i cada nota diu el cost del mes.',
  '(Nota: esta línia comença amb majúscula. Consola també, després d’un punt.)',
  'Sóc de Poble és la plataforma on la gent escriu del seu poble.',
  'La funció `Sentinelles` vigila la porta dels avisos del sistema.'
].join('\n\n') };
const guiada = async () => ({ items: [ADR, FULL, COMU] });

test('f4 D.2 · el nom d’una eina al cos troba la Wiki que el diu; el fil de la IAIA no canvia', async () => {
  const mercat = await consultaTecnicaIAIA('Mercat', { carrega: guiada });
  expect(mercat.estat).toBe('resposta');
  expect(mercat.fonts.map((font) => font.id)).toEqual(['adr']);
  expect(mercat.fonts[0].fragment).toContain('al Mercat');
  expect((await consultaTecnicaIAIA('Què és el Xat?', { carrega: guiada })).fonts.map((font) => font.id)).toEqual(['full']);
  expect((await consultaTecnicaIAIA('¿Qué es el mercado?', { carrega: guiada })).fonts.map((font) => font.id)).toEqual(['adr']);
  const index = construeixIndex([ADR, FULL, COMU]);
  expect(cercaRellevant(index, 'Mercat')).toEqual([]);
  expect(cercaRellevant(index, 'Què és el Xat?')).toEqual([]);
  expect(cercaRellevant(index, 'Mercat', 3, { cercaGuiada: true }).map((resultat) => resultat.id)).toEqual(['adr']);
});

test('f4 D.2 · una paraula comuna, una majúscula d’inici de frase, «Sóc de Poble» o el codi en línia no fan cap nom', async () => {
  for (const pregunta of ['Quant costa?', 'Com faig una nota?', 'Consola', 'Poble', 'Sentinelles', 'preu']) {
    expect([pregunta, await consultaTecnicaIAIA(pregunta, { carrega: guiada })]).toEqual([pregunta, { estat: 'sense_resultats', fonts: [] }]);
  }
});

/* Gauntlet f4a (corrector iaia-consulta; iaia-guiada-paraules-comunes-com-a-nom)
   · Les majúscules que no fan cap nom, amb documents mínims: cap paraula hi és
   comuna, i ho decidix la lectura del fragment. Cada fila porta el document
   que no ha d'eixir i el que sí, perquè la regla no passe per no trobar res. */
const doc = (id, text) => ({ id, title: `Document ${id}`, content: `# Document ${id}\n\n${text}` });
test.each([
  ['«·» separa com «:»', 'Hora', [doc('no', 'Categoria: Arquitectura · Data: 2026-06-19 · Hora: 14:30 i res més.'), doc('si', 'Al rellotge de la plaça, la Hora del poble la marca el campanar.')]],
  ['el punt d’un nom de codi tanca la frase', 'Mostrar', [doc('no', 'Cap pantalla en blanc, segons la doctrina A10/offline. Mostrar errors de xarxa honestos sempre.'), doc('si', 'Al menú de dalt, el botó Mostrar obri el panell sencer de la fitxa.')]],
  ['una paraula cridada no és un nom', 'Estat', [doc('no', 'Això ho diu L\'ESTAT del projecte sense cap dubte possible.'), doc('si', 'Les dades del padró les guarda l\'Estat i no l\'Ajuntament del poble.')]],
  ['una sigla sí que ho és', 'TPV', [doc('no', 'TPV i caixa van junts a la barra del Bar del poble.'), doc('si', 'La recepta del Bar porta el TPV per a cobrar a la barra.')]],
  ['el títol que obri una frase no fa noms', 'Consell', [doc('no', '- [Plantilla Prompt Consell (Base)](?item=prompt_consell)'), doc('si', 'Cada setmana el Consell de la IAIA revisa les propostes del poble.')]],
  ['ni amb «de» al mig', 'Codi', [doc('no', '- [Plantilla de Bundle de Codi](?item=bundle)'), doc('si', 'Tot el que publica el Codi del poble és lliure i obert per a tothom.')]],
  ['un article a l’inici de la frase no obri cap títol', 'Consola', [doc('no', 'Concepte Consola (A Sang / Sense Marcs): totes les il·lustracions omplin el llenç.'), doc('si', 'La Consola Termodinàmica és un marc d’ordre per a la feina del poble.')]],
  ['l’etiqueta compta si la seua primera paraula és el nom', 'Demana', [doc('no', '- **El que demana el Mestre** és una cosa que cal llegir amb calma.'), doc('si', '- **Demana** és el botó que envia la sol·licitud al grup del poble.')]],
  ['una etiqueta en minúscula tampoc', 'Regla', [doc('no', '- **regla del reg:** cap neteja de contingut esborra un registre del poble.'), doc('si', 'Al tauler, la Regla del reg diu qui rega cada dijous de l’estiu.')]]
])('f4a · %s («%s»)', (_regla, pregunta, items) => {
  expect(cercaRellevant(construeixIndex(items), pregunta, 3, { cercaGuiada: true }).map((resultat) => resultat.id)).toEqual(['si']);
});

/* Una paraula comuna: la prosa de més de tres documents l'escriu en minúscula,
   i més vegades que com a nom. «Memòria» no és nom d'eina encara que una
   etiqueta li pose majúscula; «Rebost», que la Wiki escriu més com a nom, sí,
   i «Xat», en minúscula només en dos documents, també. */
test('f4a · una paraula que la Wiki escriu sobretot en minúscula no és nom d’eina; un nom que també és paraula comuna, sí', () => {
  const minuscula = (paraula, n) => Array.from({ length: n }, (_, i) => doc(`${paraula}${i}`, `Cada casa del carrer ${i} guarda la ${paraula} de l’horta al poble.`));
  const memoria = [...minuscula('memòria', 4), doc('etiqueta', '- **Memòria per defecte.** Sense cap declaració, el document navega sol.')];
  expect(cercaRellevant(construeixIndex(memoria), 'Memòria', 3, { cercaGuiada: true })).toEqual([]);
  expect(cercaRellevant(construeixIndex(memoria.slice(1)), 'Memòria', 3, { cercaGuiada: true }).map((resultat) => resultat.id)).toEqual(['etiqueta']);
  const rebost = [...minuscula('rebost', 4), doc('app', 'Al poble, el Bar i el Rebost comparteixen magatzem. Al Rebost hi ha la llista, i el Rebost avisa quan falta pa al Rebost del Bar.')];
  expect(cercaRellevant(construeixIndex(rebost), 'Rebost', 3, { cercaGuiada: true }).map((resultat) => resultat.id)).toEqual(['app']);
  const xat = [...minuscula('xat', 2), FULL];
  expect(cercaRellevant(construeixIndex(xat), 'Què és el Xat?', 3, { cercaGuiada: true }).map((resultat) => resultat.id)).toEqual(['full']);
});

/* Les preguntes literals de l'ordre, sobre la Wiki de veres del paquet. Cada
   font mostra el nom de l'eina al seu fragment: la consulta no promet res
   que no es veja. */
test.each([
  ['Consola', 'el_projecte', 'Consola'],
  ['Mercat', 'ADR-2026-11-PAGINACIO-SECCIONS', 'Mercat'],
  ['Què és el Xat?', '00_full_de_ruta', 'Xat'],
  ['Com funcionen els tractors?', 'ADR-2026-12-MODULS-OPCIONALS', 'Tractors']
])('f4 D.2 · «%s» troba la Wiki pública que en parla', async (pregunta, primera, nom) => {
  const r = await consultaTecnicaIAIA(pregunta);
  expect([pregunta, r.estat, r.fonts[0]?.id]).toEqual([pregunta, 'resposta', primera]);
  expect([pregunta, r.fonts.filter((font) => !font.fragment.includes(nom)).map((font) => font.id)]).toEqual([pregunta, []]);
  expect([pregunta, r.fonts.every((font) => font.ruta === `/wikidepoble?item=${encodeURIComponent(font.id)}`)]).toEqual([pregunta, true]);
});

/* Sentinelles i la Viquipèdia no surten a cap document de la Wiki pública
   (ni al títol ni al cos), ni cap pàgina explica com es traduïx una pàgina o
   com es ven al Mercat: l'estat buit és la veritat. Si la Wiki en publica
   una pàgina, esta prova cau i la cerca l'ha de trobar. */
test.each([
  ['Sentinelles', ['sentinelles']],
  ['Viquipèdia', ['viquipèdia', 'wikipedia']],
  ['Com tradueixo una pàgina?', []],
  ['Com vendre al Mercat?', []]
])('f4 D.2 · «%s»: la Wiki pública no en parla, i la consulta no s’ho inventa', async (pregunta, absents) => {
  expect(await consultaTecnicaIAIA(pregunta)).toEqual({ estat: 'sense_resultats', fonts: [] });
  const index = construeixIndex(wikiManifest.items);
  for (const paraula of absents) {
    const [forma] = tokenitza(paraula);
    expect([paraula, index.docsAmb.get(arrel(forma)) ?? 0]).toEqual([paraula, 0]);
  }
});

/* Gauntlet f4a (corrector iaia-consulta; iaia-guiada-paraules-comunes-com-a-nom)
   · Sobre la Wiki de veres: una paraula comuna no és el nom d'una eina. Abans,
   «Quina hora és?» trobava l'arquitectura («· Data: … · Hora: 14:30»), «Foto»
   les regles del prompt d'imatges i «Sessió», l'índex de les plantilles. */
test.each(['Quina hora és?', 'Quin temps fa?', 'Data', 'Mostrar', 'Estat', 'Demana', 'Sessió', 'Regla', 'Foto', 'Temps', 'Ordre',
  'Memòria', 'Codi', 'Prompt', 'Mode', 'Arxiu', 'Valencià', 'Línia'])('f4a · «%s»: la consulta guiada no pren una paraula comuna per nom d’eina', async (pregunta) => {
  expect(await consultaTecnicaIAIA(pregunta)).toEqual({ estat: 'sense_resultats', fonts: [] });
});

test('f4a · cap font de la consulta guiada és l’índex de les plantilles, els connectors de disseny ni les regles del prompt d’imatges', async () => {
  const instruccions = ['00_index_plantilles', 'connectors_mcp_disseny', 'identitat_visual'];
  for (const pregunta of ['Consell', 'Sessió', 'Prompt', 'Codi', 'Mode', 'Regla', 'Foto', 'Valencià', 'Línia', 'Marmota', 'Acta']) {
    const { fonts } = await consultaTecnicaIAIA(pregunta);
    expect([pregunta, fonts.map((font) => font.id).filter((id) => instruccions.includes(id))]).toEqual([pregunta, []]);
  }
});

/* Gauntlet f4a (corrector iaia-consulta; iaia-salut-paraula-buida-nom-d-app) ·
   «Salut» és el nom d'una app i una salutació: la pregunta troba l'app, i la
   salutació continua saludant, al diàleg i al fil. */
test('f4a · «Què és Salut?» troba l’app a la Wiki; «Salut!» continua sent una salutació', async () => {
  for (const pregunta of ['Què és Salut?', 'Com funciona Salut']) {
    const r = await consultaTecnicaIAIA(pregunta);
    expect([pregunta, r.estat, r.fonts.map((font) => font.id).includes('ADR-2026-10-APPS-DEL-DISPOSITIU')]).toEqual([pregunta, 'resposta', true]);
    expect([pregunta, r.fonts.filter((font) => !font.fragment.includes('Salut')).map((font) => font.id)]).toEqual([pregunta, []]);
  }
  for (const salutacio of ['Salut!', 'Salut', 'IAIA, salut! Com va?', 'IAIA salut, com va?', 'Moltes gràcies i salut']) {
    expect([salutacio, (await consultaTecnicaIAIA(salutacio)).estat]).toEqual([salutacio, 'salutacio']);
    expect([salutacio, await respostaDeLaIAIA(salutacio)]).toEqual([salutacio, SALUTACIO_TECNICA_IAIA]);
  }
  expect(termesDeLaPregunta('Salut, què és el Mercat?')).toEqual(['mercat']);
  expect(await respostaDeLaIAIA('Què és Salut?')).not.toBe(SALUTACIO_TECNICA_IAIA);
});
