/* D-C4-5 (COMMIT 5, decisió del Mestre) · La consulta documental del diàleg
   va perdre la interfície en R21.3 (ConsultaIAIA.jsx) i el seu embolcall
   (consultaTecnicaIAIA) s'ha retirat d'iaiaLocal.js. Ací queda el que valia:
   el rànquing del cercador guiat de la Wiki, provat amb el mateix camí que
   feia l'embolcall (construeixIndex del manifest i cercaRellevant amb
   DOCUMENTS_PER_RESPOSTA i cercaGuiada), la guarda de visibilitat i la
   salutació. Una llista buida és l'antic estat 'sense_resultats'. Les proves
   que només provaven l'embolcall (cancel·lació, temps màxim, pregunta
   invàlida, salutació, indisponibilitat i escalfament) s'han esborrat amb ell. */
import { expect, test } from 'vitest';
import {
  construeixIndex, cerca, cercaRellevant, componResposta, DOCUMENTS_PER_RESPOSTA, respostaDeLaIAIA, SALUTACIO_TECNICA_IAIA,
  arrel, termesDeLaPregunta, tokenitza
} from './iaiaLocal.js';
import { wikiManifest } from './wikiManifest.js';
import { publicMetadata } from '../../tooling/wiki/lib/publication-policy.mjs';
import CA from '../config/idiomes/ca.js';

/* El cercador guiat, tal com el cridava l'embolcall retirat. */
const guiat = (index, pregunta) => cercaRellevant(index, pregunta, DOCUMENTS_PER_RESPOSTA, { cercaGuiada: true });
const ids = (fonts) => fonts.map((font) => font.id);
/* La Wiki del paquet, indexada una sola vegada per a tot el fitxer. */
let indexDeLaWiki = null;
const wiki = () => (indexDeLaWiki ??= construeixIndex(wikiManifest.items));
/* La ruta de cada línia de la resposta composta (componResposta, la del fil). */
const destins = (fonts) => (componResposta(fonts) ?? '').split('\n')
  .filter((linia) => linia.startsWith('· ')).map((linia) => linia.split(' — ').pop());

/* Revisió de la crítica · Una pregunta d'una sola paraula («Com funciona
   Sollutia?») demana la paraula al títol del document. */
const publicDoc = { id: 'model', title: 'Arquitectura amb Sollutia', content: '# Arquitectura amb Sollutia\n\nEl client passa pel port neutral. Sollutia només oferix lectura GET.\n\nEl taulell mostra les vendes del dia.' };

test('la font porta una afirmació del document i un destí navegable, sense inventar una síntesi', () => {
  const fonts = guiat(construeixIndex([publicDoc]), 'Com funciona Sollutia?');
  expect(fonts.map(({ id, titol, fragment }) => ({ id, titol, fragment }))).toEqual([
    { id: 'model', titol: 'Arquitectura amb Sollutia', fragment: 'El client passa pel port neutral. Sollutia només oferix lectura GET.' }
  ]);
  expect(destins(fonts)).toEqual(['/wikidepoble?item=model']);
  expect(componResposta(fonts)).toContain(fonts[0].fragment);
  expect(componResposta(fonts)).not.toContain('vendes');
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
  const perALaIA = ['personalitat_iaia', 'perfil_psiquiatric', 'agents_equip_ia', 'sgq_prompts', '03_llibre_d_or_memoria_episodica',
    '04_taula_potencia_models', '03_equip_ia'];
  const carpetes = ['folder:02_saber/obsidian_plugins', 'folder:02_saber/03_consola_termodinamica'];
  const index = construeixIndex([...perALaIA.map((id) => ({ ...publicDoc, id })), ...carpetes.map((categoryId, i) => ({ ...publicDoc, id: `equip${i}`, categoryId })),
    { ...publicDoc, id: 'model' }]);
  expect(cerca(index, 'Sollutia').map((r) => r.id)).toEqual(['model']);
});

test('una pregunta funcional no premia «funciona» i conserva el tema al final d’un paràgraf llarg', () => {
  const fonts = guiat(construeixIndex([
    { id: 'personalitat', title: 'IAIA', content: '# IAIA\n\nLa IAIA parla amb una personalitat amable i directa.' },
    { id: 'soroll', title: 'Com funciona', content: '# Com funciona\n\nEsta funció funciona per a totes les persones del poble.' },
    { id: 'rebost', title: 'El Rebost', content: `# El Rebost\n\nRebostar és una paraula diferent. ${'Una col·laboració il·lustrada. '.repeat(350)}El Rebost guarda la llista dels productes que necessites comprar.` }
  ]), 'Com funciona el Rebost, IAIA?');
  expect(fonts).toHaveLength(1);
  expect(fonts[0].fragment).toContain('El Rebost guarda');
  expect(fonts[0].fragment.length).toBeLessThanOrEqual(362);
});

test('el fragment no interpreta HTML, comentaris ni blocs de codi com una resposta', () => {
  const fonts = guiat(construeixIndex([{ id: 'quota', title: 'Quota', content: '# Quota\n\n<!-- quota secret -->\n\n```js\nquota executable\n```\n\nLa quota limita la mida dels fitxers que es poden pujar.' }]), 'quota');
  expect(fonts[0].fragment).toBe('La quota limita la mida dels fitxers que es poden pujar.');
  expect(componResposta(fonts)).not.toMatch(/secret|executable/);
});

/* IAIA-8 · La salutació literal del Mestre (prompt 261022_0225, Tasca 4). */
test('la salutació és, lletra per lletra, la del Mestre, i el diccionari valencià la porta igual', () => {
  const literal = 'Ara no estic pa tonteries, però sí que puc contestar-te preguntes tècniques i explicar-te com funciona qualsevol racó del poble.';
  expect(SALUTACIO_TECNICA_IAIA).toBe(literal);
  expect(CA['section.xat.iaia.salutacio']).toBe(literal);
});

/* IDEA-56 (pla 261029_1605, Bloc F.2) · L'Atles i les pàgines són del fil
   de la IAIA: el cercador guiat continua sent la Wiki sola.
   Ordre del Mestre (30-10-2026; f4 D.2, P1-49) · «Què és el Mercat?» ja no
   torna buit: troba les dues pàgines de la Wiki que nomenen el Mercat, i
   continua sense cap entrada de l'Atles (actualitzat a posta). */
test('el cercador guiat és la Wiki: «Què és el Mercat?» troba la Wiki, i cap font és de l’Atles, d’un poble ni d’una pàgina', () => {
  expect(ids(guiat(wiki(), 'Què és el Mercat?'))).toEqual(['ADR-2026-11-PAGINACIO-SECCIONS', '00_index_maquina']);
  for (const pregunta of ['Què és el Mercat?', 'Qui és Javi?', 'Què és un node?', 'Penàguila', 'Què és Sollutia?']) {
    const fonts = guiat(wiki(), pregunta);
    expect([pregunta, ids(fonts).filter((id) => /^(?:atles|poble|pagina):/.test(id))]).toEqual([pregunta, []]);
    expect([pregunta, destins(fonts).every((desti) => desti.startsWith('/wikidepoble?item='))]).toEqual([pregunta, true]);
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
const GUIATS = [ADR, FULL, COMU];

test('f4 D.2 · el nom d’una eina al cos troba la Wiki que el diu; el fil de la IAIA no canvia', () => {
  const index = construeixIndex(GUIATS);
  const mercat = guiat(index, 'Mercat');
  expect(ids(mercat)).toEqual(['adr']);
  expect(mercat[0].fragment).toContain('al Mercat');
  expect(ids(guiat(index, 'Què és el Xat?'))).toEqual(['full']);
  expect(ids(guiat(index, '¿Qué es el mercado?'))).toEqual(['adr']);
  expect(cercaRellevant(index, 'Mercat')).toEqual([]);
  expect(cercaRellevant(index, 'Què és el Xat?')).toEqual([]);
});

test('f4 D.2 · una paraula comuna, una majúscula d’inici de frase, «Sóc de Poble» o el codi en línia no fan cap nom', () => {
  for (const pregunta of ['Quant costa?', 'Com faig una nota?', 'Consola', 'Poble', 'Sentinelles', 'preu']) {
    expect([pregunta, guiat(construeixIndex(GUIATS), pregunta)]).toEqual([pregunta, []]);
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
   font mostra el nom de l'eina al seu fragment: el cercador no promet res
   que no es veja. */
test.each([
  ['Consola', 'el_projecte', 'Consola'],
  ['Mercat', 'ADR-2026-11-PAGINACIO-SECCIONS', 'Mercat'],
  ['Què és el Xat?', '00_full_de_ruta', 'Xat'],
  ['Com funcionen els tractors?', 'ADR-2026-12-MODULS-OPCIONALS', 'Tractors']
])('f4 D.2 · «%s» troba la Wiki pública que en parla', (pregunta, primera, nom) => {
  const fonts = guiat(wiki(), pregunta);
  expect([pregunta, fonts[0]?.id]).toEqual([pregunta, primera]);
  expect([pregunta, fonts.filter((font) => !font.fragment.includes(nom)).map((font) => font.id)]).toEqual([pregunta, []]);
  expect([pregunta, destins(fonts)]).toEqual([pregunta, fonts.map((font) => `/wikidepoble?item=${encodeURIComponent(font.id)}`)]);
});

/* Sentinelles i la Viquipèdia no surten a cap document de la Wiki pública
   (ni al títol ni al cos), ni cap pàgina explica com es traduïx una pàgina o
   com es ven al Mercat: la llista buida és la veritat. Si la Wiki en publica
   una pàgina, esta prova cau i la cerca l'ha de trobar. */
test.each([
  ['Sentinelles', ['sentinelles']],
  ['Viquipèdia', ['viquipèdia', 'wikipedia']],
  ['Com tradueixo una pàgina?', []],
  ['Com vendre al Mercat?', []]
])('f4 D.2 · «%s»: la Wiki pública no en parla, i el cercador no s’ho inventa', (pregunta, absents) => {
  expect(guiat(wiki(), pregunta)).toEqual([]);
  for (const paraula of absents) {
    const [forma] = tokenitza(paraula);
    expect([paraula, wiki().docsAmb.get(arrel(forma)) ?? 0]).toEqual([paraula, 0]);
  }
});

/* Gauntlet f4a (corrector iaia-consulta; iaia-guiada-paraules-comunes-com-a-nom)
   · Sobre la Wiki de veres: una paraula comuna no és el nom d'una eina. Abans,
   «Quina hora és?» trobava l'arquitectura («· Data: … · Hora: 14:30»), «Foto»
   les regles del prompt d'imatges i «Sessió», l'índex de les plantilles. */
test.each(['Quina hora és?', 'Quin temps fa?', 'Data', 'Mostrar', 'Estat', 'Demana', 'Sessió', 'Regla', 'Foto', 'Temps', 'Ordre',
  'Memòria', 'Codi', 'Prompt', 'Mode', 'Arxiu', 'Valencià', 'Línia'])('f4a · «%s»: el cercador guiat no pren una paraula comuna per nom d’eina', (pregunta) => {
  expect(guiat(wiki(), pregunta)).toEqual([]);
});

test('f4a · cap font del cercador guiat és l’índex de les plantilles, els connectors de disseny ni les regles del prompt d’imatges', () => {
  const instruccions = ['00_index_plantilles', 'connectors_mcp_disseny', 'identitat_visual'];
  for (const pregunta of ['Consell', 'Sessió', 'Prompt', 'Codi', 'Mode', 'Regla', 'Foto', 'Valencià', 'Línia', 'Marmota', 'Acta']) {
    expect([pregunta, ids(guiat(wiki(), pregunta)).filter((id) => instruccions.includes(id))]).toEqual([pregunta, []]);
  }
});

/* Gauntlet f4a (corrector iaia-consulta; iaia-salut-paraula-buida-nom-d-app) ·
   «Salut» és el nom d'una app i una salutació: la pregunta troba l'app, i la
   salutació no busca res (cap terme de la pregunta) i continua saludant al fil. */
test('f4a · «Què és Salut?» troba l’app a la Wiki; «Salut!» continua sent una salutació', async () => {
  for (const pregunta of ['Què és Salut?', 'Com funciona Salut']) {
    const fonts = guiat(wiki(), pregunta);
    expect([pregunta, ids(fonts).includes('ADR-2026-10-APPS-DEL-DISPOSITIU')]).toEqual([pregunta, true]);
    expect([pregunta, fonts.filter((font) => !font.fragment.includes('Salut')).map((font) => font.id)]).toEqual([pregunta, []]);
  }
  for (const salutacio of ['Salut!', 'Salut', 'IAIA, salut! Com va?', 'IAIA salut, com va?', 'Moltes gràcies i salut']) {
    expect([salutacio, termesDeLaPregunta(salutacio)]).toEqual([salutacio, []]);
    expect([salutacio, await respostaDeLaIAIA(salutacio)]).toEqual([salutacio, SALUTACIO_TECNICA_IAIA]);
  }
  expect(termesDeLaPregunta('Salut, què és el Mercat?')).toEqual(['mercat']);
  expect(await respostaDeLaIAIA('Què és Salut?')).not.toBe(SALUTACIO_TECNICA_IAIA);
});
