/* IDEA-41 (Llibre Mestre; Mestre 261028, Bloc H: determinista, sense IA) ·
   El motor de «🎴 Proposa Card» amb notes sintètiques: títol, subtítol i
   entradilla des de les primeres línies del cos, només en els camps buits, i
   el cos sense exactament les línies pujades (cap paràgraf dues voltes). */
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  MAX_ENTRADILLA, MAX_SUBTITOL, MAX_TITOL, MIDA_PREVISIO, MOTIUS, campBuit, hiHaPropostaDeCard, proposaCard
} from './proposaCard.js';
import { LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA } from './llavorNota.js';

const nota = (content, camps = {}) => ({ title: '', subtitle: '', lead: '', content, ...camps });
const resum = (r) => ({ motiu: r.motiu, camps: { ...r.camps }, cos: r.cos });

describe('proposaCard · les tres passes', () => {
  test('títol, línia curta i primer paràgraf: H1, H2 i entradilla, i el cos sense ells', () => {
    const r = proposaCard(nota('<p>La festa del poble</p><p>Tres dies de música i taules llargues.</p><p>Enguany la comissió ha triat el carrer Major.</p><p>La resta del text.</p>'));
    expect(resum(r)).toEqual({
      motiu: MOTIUS.proposta,
      camps: { title: 'La festa del poble', subtitle: 'Tres dies de música i taules llargues', lead: 'Enguany la comissió ha triat el carrer Major.' },
      cos: '<p>La resta del text.</p>'
    });
    expect(r.mogudes.map((m) => m.camp)).toEqual(['title', 'subtitle', 'lead']);
    expect(Object.isFrozen(r) && Object.isFrozen(r.camps) && Object.isFrozen(r.mogudes)).toBe(true);
  });

  test('cap paràgraf no queda dues voltes: el que puja ja no és al cos, i la resta del cos és intacta', () => {
    const cos = '<p>Títol</p><p>Subtítol</p><p>Entradilla.</p><h3>Secció</h3><p>Un <strong>paràgraf</strong> amb <a href="https://exemple.cat">enllaç</a>.</p>';
    const r = proposaCard(nota(cos));
    expect(r.cos).toBe('<h3>Secció</h3><p>Un <strong>paràgraf</strong> amb <a href="https://exemple.cat">enllaç</a>.</p>');
    for (const { text } of r.mogudes) expect(r.cos).not.toContain(text);
  });

  test('una nota ja estructurada (els tres camps plens): res a proposar i el cos tal qual', () => {
    const cos = '<p>Primera línia</p><p>Segona</p>';
    const r = proposaCard(nota(cos, { title: 'Títol', subtitle: 'Subtítol', lead: '<p>Entradilla</p>' }));
    expect(resum(r)).toEqual({ motiu: MOTIUS.complet, camps: {}, cos });
    expect(hiHaPropostaDeCard(nota(cos, { title: 'T', subtitle: 'S', lead: 'E' }))).toBe(false);
  });

  test('només omple els camps buits: un títol ple no es toca i la primera línia passa al subtítol', () => {
    const r = proposaCard(nota('<p>Una línia curta</p><p>El paràgraf de l’entradilla.</p>', { title: 'El meu títol' }));
    expect(r.camps).toEqual({ subtitle: 'Una línia curta', lead: 'El paràgraf de l’entradilla.' });
    expect(r.cos).toBe('');
    // Amb el subtítol ple, la primera línia va a l'entradilla.
    expect(proposaCard(nota('<p>Una línia</p><p>Una altra</p>', { title: 'T', subtitle: 'S' })).camps).toEqual({ lead: 'Una línia' });
  });

  test('sense cap línia (cos buit, paràgrafs buits o només espais): res a proposar', () => {
    for (const cos of ['', '   ', '<p></p>', '<p><br></p><p></p>', '<p>&nbsp;</p>']) {
      expect(proposaCard(nota(cos)).motiu, JSON.stringify(cos)).toBe(MOTIUS.buit);
      expect(hiHaPropostaDeCard(nota(cos)), JSON.stringify(cos)).toBe(false);
    }
    expect(proposaCard({}).motiu).toBe(MOTIUS.buit);
    expect(proposaCard(null).motiu).toBe(MOTIUS.buit);
  });

  test('una sola línia: només el títol, i el cos queda buit', () => {
    expect(resum(proposaCard(nota('<p>Una sola línia</p>')))).toEqual({ motiu: MOTIUS.proposta, camps: { title: 'Una sola línia' }, cos: '' });
  });

  test('una primera línia molt llarga no és cap títol ni subtítol: si cap, és l’entradilla; si no, res', () => {
    const llarga = `Era una vesprada de juliol ${'i la plaça bullia de gent '.repeat(8)}`.trim();
    expect(llarga.length).toBeGreaterThan(MAX_SUBTITOL);
    expect(llarga.length).toBeLessThanOrEqual(MAX_ENTRADILLA);
    const r = proposaCard(nota(`<p>${llarga}</p><p>Segon paràgraf</p>`));
    expect(resum(r)).toEqual({ motiu: MOTIUS.proposta, camps: { lead: llarga }, cos: '<p>Segon paràgraf</p>' });
    const enorme = 'a'.repeat(MAX_ENTRADILLA + 1);
    expect(resum(proposaCard(nota(`<p>${enorme}</p>`)))).toEqual({ motiu: MOTIUS.res, camps: {}, cos: `<p>${enorme}</p>` });
  });

  test('els límits són inclusius: MAX_TITOL entra al títol; un caràcter més, no', () => {
    const just = 'x'.repeat(MAX_TITOL);
    expect(proposaCard(nota(`<p>${just}</p>`)).camps.title).toBe(just);
    expect(proposaCard(nota(`<p>${just}x</p>`)).camps.title).toBeUndefined();
  });

  test('sense títol no hi ha subtítol: el subtítol és «la línia curta següent» al títol', () => {
    const titolLlarg = 't'.repeat(MAX_TITOL + 5);
    const r = proposaCard(nota(`<p>${titolLlarg}</p><p>Curta</p>`));
    expect(r.camps.subtitle).toBeUndefined();
    expect(r.camps.lead).toBe(titolLlarg);
  });
});

describe('proposaCard · títols en HTML i en Markdown', () => {
  test('un títol HTML del cos (h1–h6) puja al títol i es lleva sencer', () => {
    for (const nivell of [1, 2, 3, 6]) {
      const r = proposaCard(nota(`<h${nivell}>Mercat de <em>dissabte</em></h${nivell}><p>Paràgraf.</p>`, { subtitle: 'S' }));
      expect(r.camps, `h${nivell}`).toEqual({ title: 'Mercat de dissabte', lead: 'Paràgraf.' });
      expect(r.cos).toBe('');
    }
    // Amb el subtítol buit, la línia curta de darrere és el subtítol.
    expect(proposaCard(nota('<h2>Mercat</h2><p>Cada dissabte.</p>')).camps).toEqual({ title: 'Mercat', subtitle: 'Cada dissabte' });
  });

  test('un títol del cos també pot ser el subtítol, però mai l’entradilla', () => {
    expect(proposaCard(nota('<h2>Títol</h2><h3>Subtítol</h3><p>Entradilla</p>')).camps)
      .toEqual({ title: 'Títol', subtitle: 'Subtítol', lead: 'Entradilla' });
    // Amb el títol i el subtítol plens, un h3 a l'inici no és cap entradilla.
    expect(proposaCard(nota('<h3>Secció</h3><p>Text</p>', { title: 'T', subtitle: 'S' })).motiu).toBe(MOTIUS.res);
  });

  test('Markdown: «# Títol» i «## Subtítol» perden la marca; un títol Markdown no és cap entradilla', () => {
    expect(resum(proposaCard(nota('<p># El rebost</p><p>## Què hi ha hui ##</p><p>Tomaques i figues.</p><p>Més.</p>')))).toEqual({
      motiu: MOTIUS.proposta,
      camps: { title: 'El rebost', subtitle: 'Què hi ha hui', lead: 'Tomaques i figues.' },
      cos: '<p>Més.</p>'
    });
    expect(proposaCard(nota('<p>### Secció</p>', { title: 'T', subtitle: 'S' })).motiu).toBe(MOTIUS.res);
    // Un coixinet sense espai no és cap títol: és text.
    expect(proposaCard(nota('<p>#etiqueta</p>')).camps.title).toBe('#etiqueta');
  });

  test('HTML escrit com a text (les etiquetes d’un títol enganxades com a lletres): la marca es lleva i el camp rep text escapat', () => {
    const r = proposaCard(nota('<p>&lt;h1&gt;Fira &amp; mercat&lt;/h1&gt;</p><p>Entradilla</p>', { subtitle: 'S' }));
    expect(r.camps).toEqual({ title: 'Fira &amp; mercat', lead: 'Entradilla' });
    expect(r.mogudes[0]).toEqual({ camp: 'title', text: 'Fira & mercat' });
  });
});

describe('proposaCard · línies, marques i el que no és text', () => {
  test('dins d’un paràgraf, cada salt de línia (<br>) separa una línia: es lleva només el que puja', () => {
    const r = proposaCard(nota('<p>Títol<br>Subtítol curt<br>Primera frase de l’entradilla<br>i la segona.</p><p>Cos.</p>'));
    expect(r.camps).toEqual({ title: 'Títol', subtitle: 'Subtítol curt', lead: 'Primera frase de l’entradilla i la segona.' });
    expect(r.cos).toBe('<p>Cos.</p>');
    // Amb el subtítol ple, el que resta del paràgraf es queda tal qual.
    const parcial = proposaCard(nota('<p>Títol<br><br>Resta <strong>del</strong> paràgraf</p>', { subtitle: 'S', lead: 'E' }));
    expect(parcial.camps).toEqual({ title: 'Títol' });
    expect(parcial.cos).toBe('<p>Resta <strong>del</strong> paràgraf</p>');
  });

  test('les marques no pugen: el camp rep text pla escapat', () => {
    const r = proposaCard(nota('<p><strong>Negreta</strong> &lt;i&gt; <a href="/x">enllaç</a></p>'));
    expect(r.camps.title).toBe('Negreta &lt;i&gt; enllaç');
  });

  test('punt final: el títol i el subtítol el perden; els punts suspensius i l’entradilla, no', () => {
    expect(proposaCard(nota('<p>Títol.</p><p>Subtítol.</p><p>Entradilla.</p>')).camps)
      .toEqual({ title: 'Títol', subtitle: 'Subtítol', lead: 'Entradilla.' });
    expect(proposaCard(nota('<p>I ara què...</p>')).camps.title).toBe('I ara què...');
    expect(proposaCard(nota('<p>Per què?</p>')).camps.title).toBe('Per què?');
  });

  test('el recorregut para en el primer bloc que no és text: imatges, llistes i targetes no es toquen mai', () => {
    const imatge = '<img src="data:image/webp;base64,AAAA" alt="">';
    const llista = '<ul><li><p>U</p></li></ul>';
    expect(resum(proposaCard(nota(`${imatge}<p>Text</p>`)))).toEqual({ motiu: MOTIUS.res, camps: {}, cos: `${imatge}<p>Text</p>` });
    expect(proposaCard(nota(`${llista}<p>Text</p>`)).motiu).toBe(MOTIUS.res);
    expect(proposaCard(nota('<p><img src="/f.webp" alt="">Peu</p><p>Text</p>')).motiu).toBe(MOTIUS.res);
    // Abans del bloc, sí; el bloc i el que ve darrere es queden en el seu ordre.
    const r = proposaCard(nota(`<p>Títol</p>${llista}<p>Després</p>`));
    expect(r.camps).toEqual({ title: 'Títol' });
    expect(r.cos).toBe(`${llista}<p>Després</p>`);
  });

  test('els paràgrafs buits de l’inici es boten i es queden', () => {
    const r = proposaCard(nota('<p></p><p>Títol</p><p></p><p>Entradilla llarga de prova.</p>', { subtitle: 'S' }));
    expect(r.camps).toEqual({ title: 'Títol', lead: 'Entradilla llarga de prova.' });
    expect(r.cos).toBe('<p></p><p></p>');
  });

  test('la llavor verge (la d’ara i la d’abans) no es proposa mai', () => {
    for (const llavor of [LLAVOR_NOTA, LLAVOR_NOTA_ANTIGA]) {
      expect(proposaCard(nota(llavor)).motiu).toBe(MOTIUS.llavor);
      expect(hiHaPropostaDeCard(nota(llavor))).toBe(false);
    }
  });
});

describe('proposaCard · previsió i camps buits', () => {
  test('la previsió diu el mateix motiu sense construir el cos', () => {
    const contingut = nota('<p>Títol</p><p>Text</p>');
    const previsio = proposaCard(contingut, { previsio: true });
    expect(previsio.motiu).toBe(MOTIUS.proposta);
    expect(previsio.cos).toBeNull();
    expect(proposaCard(contingut).cos).toBe('');
    expect(hiHaPropostaDeCard(contingut)).toBe(true);
  });

  test('un cos enorme (fotos en data:) només es llig pel principi en la previsió, i el resultat no canvia', () => {
    const foto = `<img src="data:image/webp;base64,${'A'.repeat(MIDA_PREVISIO * 4)}" alt="">`;
    const contingut = nota(`<p>Títol</p><p>Entradilla</p>${foto}<p>Final</p>`, { subtitle: 'S' });
    expect(proposaCard(contingut, { previsio: true }).camps).toEqual({ title: 'Títol', lead: 'Entradilla' });
    expect(proposaCard(contingut).camps).toEqual({ title: 'Títol', lead: 'Entradilla' });
    expect(proposaCard(contingut).cos).toBe(`${foto}<p>Final</p>`);
    // Un paràgraf tallat pel principi no compta: la previsió no s'inventa cap entradilla més curta.
    const llarg = nota(`<p>Títol</p><p>${'paraula '.repeat(MIDA_PREVISIO / 4)}</p>`, { subtitle: 'S' });
    expect(proposaCard(llarg, { previsio: true }).camps).toEqual({ title: 'Títol' });
    expect(proposaCard(llarg).camps).toEqual({ title: 'Títol' });
  });

  test('campBuit: buit és sense cap text (null, cadena buida, <br>, &nbsp;)', () => {
    for (const v of [null, undefined, '', '  ', '<br>', '<p></p>', '&nbsp;', '<p>&nbsp;<br></p>']) expect(campBuit(v), String(v)).toBe(true);
    for (const v of ['a', '<p>a</p>', '0']) expect(campBuit(v), v).toBe(false);
  });
});

/* Revisió adversarial 261028 · Els defectes del motor que van trobar les dues
   revisions, i les guardes de la previsió que cap prova no matava. */
describe('proposaCard · revisió adversarial 261028', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  test('un títol ple que el cos repetix a la primera línia no passa al subtítol: es queda al cos i la proposta seguix', () => {
    const r = proposaCard(nota('<h2>La festa del poble</h2><p>Tres dies de música</p><p>Enguany al carrer Major.</p>', { title: 'La festa del poble' }));
    expect(resum(r)).toEqual({
      motiu: MOTIUS.proposta,
      camps: { subtitle: 'Tres dies de música', lead: 'Enguany al carrer Major.' },
      cos: '<h2>La festa del poble</h2>'
    });
    // Sense distingir majúscules, punt final, marca Markdown ni entitats.
    expect(proposaCard(nota('<p># fira &amp; mercat.</p><p>Cada dissabte</p>', { title: 'Fira &amp; Mercat' })).camps).toEqual({ subtitle: 'Cada dissabte' });
    // La línia repetida i la següent en el mateix paràgraf: llevar-la deixaria el cos sense ella, i no es proposa res.
    const mateix = nota('<p>La festa<br>Tres dies</p><p>Resta</p>', { title: 'La festa' });
    expect(resum(proposaCard(mateix))).toEqual({ motiu: MOTIUS.res, camps: {}, cos: mateix.content });
    expect(hiHaPropostaDeCard(mateix)).toBe(false);
    // Un títol ple diferent: la primera línia continua sent el subtítol.
    expect(proposaCard(nota('<h2>Un altre</h2><p>Text</p>', { title: 'La festa' })).camps).toEqual({ subtitle: 'Un altre', lead: 'Text' });
  });

  test('una línia que sense el punt final no diu res no és cap títol ni subtítol (i no es lleva per a deixar el camp buit)', () => {
    const punt = proposaCard(nota('<p>.</p><p>Hola</p>'));
    expect(punt.camps.title).toBeUndefined();
    expect(punt.mogudes.every((m) => m.text !== '')).toBe(true);
    for (const cos of ['<p># .</p><p>Hola</p>', '<p>&lt;h2&gt;&lt;/h2&gt;</p><p>Hola</p>', '<p>&lt;h2&gt;.&lt;/h2&gt;</p><p>Hola</p>']) {
      expect(resum(proposaCard(nota(cos))), cos).toEqual({ motiu: MOTIUS.res, camps: {}, cos });
    }
    // Amb el títol ple, el subtítol tampoc no es queda buit.
    const sub = nota('<p># .</p><p>Hola</p>', { title: 'T' });
    expect(resum(proposaCard(sub))).toEqual({ motiu: MOTIUS.res, camps: {}, cos: sub.content });
  });

  test('HTML escrit com a text: només cauen els trossos amb forma d’etiqueta; un «<» solt és text i no es perd', () => {
    const r = proposaCard(nota('<p><br>&lt;h6&gt;mercat &amp; &lt; — &lt; x #etiqueta &gt;&lt;/h6&gt;<br></p><p>Entradilla</p>', { subtitle: 'S' }));
    expect(r.mogudes[0]).toEqual({ camp: 'title', text: 'mercat & < — < x #etiqueta >' });
    expect(r.camps).toEqual({ title: 'mercat &amp; &lt; — &lt; x #etiqueta &gt;', lead: 'Entradilla' });
    expect(r.cos).toBe('');
    // Les etiquetes de dins, sí: «<em>» i «</em>» cauen i el text es queda.
    expect(proposaCard(nota('<p>&lt;h1&gt;Fira &lt;em class="x"&gt;gran&lt;/em&gt;&lt;/h1&gt;</p>')).camps.title).toBe('Fira gran');
  });

  test('previsió: l’últim bloc d’un principi tallat no compta encara que siga curt (una foto en data: a mitges)', () => {
    const c = nota(`<p>Entradilla curta<img src="data:image/png;base64,${'A'.repeat(MIDA_PREVISIO + 4000)}"></p>`, { title: 'T', subtitle: 'S' });
    expect(proposaCard(c).motiu).toBe(MOTIUS.res);
    expect(proposaCard(c, { previsio: true }).motiu).toBe(MOTIUS.res);
    expect(hiHaPropostaDeCard(c)).toBe(false);
  });

  test('previsió: el DOMParser no rep mai més de MIDA_PREVISIO caràcters; aplicar-la llig el cos sencer', () => {
    const contingut = nota(`<p>Títol</p>${`<p>${'x'.repeat(100)}</p>`.repeat(400)}`);
    expect(contingut.content.length).toBeGreaterThan(MIDA_PREVISIO * 2);
    const parse = vi.spyOn(DOMParser.prototype, 'parseFromString');
    expect(hiHaPropostaDeCard(contingut)).toBe(true);
    expect(Math.max(...parse.mock.calls.map(([html]) => html.length))).toBeLessThanOrEqual(MIDA_PREVISIO);
    parse.mockClear();
    expect(proposaCard(contingut).camps.title).toBe('Títol');
    expect(parse.mock.calls.some(([html]) => html === contingut.content)).toBe(true);
  });
});
