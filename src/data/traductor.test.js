/* Traductor Sobirà (ordre del Mestre, 260930 · via B) · El client neutre del
   servei de traducció: el contracte acordat amb Codex (auditoria 260930_2150,
   ronda D1), la validació de la resposta i els errors tipats. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test, vi } from 'vitest';
import {
  CODI_TRADUCCIO, ErrorTraductor, LIMITS_TRADUCCIO, LLENGUES_TRADUCCIO, NOMS_PROPIS, bytesDe, caractersDe,
  creaTraductor, partixEnLots, partixText, protegixNoms, restauraNoms, tradueixTot, urlDeServei
} from './traductor.js';

const URL_SERVEI = '/wp-json/socdepoble/v1/traduir';
const resposta = (status, cos) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => { if (cos instanceof Error) throw cos; return cos; },
});
const fetchQueTorna = (status, cos) => vi.fn(async () => resposta(status, cos));
const errorDe = async (promesa) => { try { await promesa; } catch (error) { return error; } throw new Error('no ha fallat'); };

describe('contracte de la petició', () => {
  test('un sol lot: POST JSON amb textos, desti, origen CA i format; sense galetes ni nonce (esmena 1 de Codex)', async () => {
    const fetch = fetchQueTorna(200, { traduccions: ['Hola', '¿Qué tal?'], origen: 'CA', desti: 'ES', cache: false });
    const { traduccions, cache } = await creaTraductor({ url: URL_SERVEI, fetch }).tradueix(['Hola', 'Què tal?'], 'ES');
    expect(traduccions).toEqual(['Hola', '¿Qué tal?']);
    expect(cache).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [adreca, opcions] = fetch.mock.calls[0];
    expect(adreca).toBe(`${window.location.origin}${URL_SERVEI}`);
    expect(opcions.method).toBe('POST');
    expect(opcions.credentials).toBe('omit');
    expect(opcions.headers).toEqual({ 'Content-Type': 'application/json', Accept: 'application/json' });
    expect(Object.keys(opcions.headers).map((nom) => nom.toLowerCase())).not.toContain('x-wp-nonce');
    expect(JSON.parse(opcions.body)).toEqual({ textos: ['Hola', 'Què tal?'], desti: 'ES', origen: 'CA', format: 'text' });
  });

  test('la llista tancada de destins: ES, GL, EU, EN-GB, FR i DE; qualsevol altre no ix de la pàgina', async () => {
    /* Ordre del Mestre (261030 01:30), literal: el gallec i el basc, després del castellà. */
    expect(LLENGUES_TRADUCCIO.map((llengua) => llengua.codi)).toEqual(['ES', 'GL', 'EU', 'EN-GB', 'FR', 'DE']);
    expect(LLENGUES_TRADUCCIO.filter(({ codi }) => codi === 'GL' || codi === 'EU')).toEqual([
      { codi: 'GL', nom: 'Gallec', cap: 'al gallec', lang: 'gl' },
      { codi: 'EU', nom: 'Basc', cap: 'al basc', lang: 'eu' },
    ]);
    const fetch = fetchQueTorna(200, { traduccions: ['x'] });
    const traductor = creaTraductor({ url: URL_SERVEI, fetch });
    for (const codi of ['GL', 'EU']) {
      expect((await traductor.tradueix(['x'], codi)).traduccions).toEqual(['x']);
      expect(JSON.parse(fetch.mock.calls.at(-1)[1].body).desti).toBe(codi);
    }
    fetch.mockClear();
    for (const desti of ['CA', 'EN', 'es', 'IT', '', 'gl', 'EUS']) {
      expect((await errorDe(traductor.tradueix(['x'], desti))).codi).toBe(CODI_TRADUCCIO.PETICIO_INVALIDA);
    }
    expect((await errorDe(traductor.tradueix([], 'ES'))).codi).toBe(CODI_TRADUCCIO.PETICIO_INVALIDA);
    expect((await errorDe(traductor.tradueix([3], 'ES'))).codi).toBe(CODI_TRADUCCIO.PETICIO_INVALIDA);
    expect((await errorDe(traductor.tradueix(['x'], 'ES', { format: 'markdown' }))).codi).toBe(CODI_TRADUCCIO.PETICIO_INVALIDA);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('sense URL, o amb una URL d’un altre origen, el servei no està disponible i no es fa cap petició', async () => {
    const fetch = vi.fn();
    for (const url of [undefined, '', '   ', 'https://api.deepl.com/v2/translate', '//altre.example/traduir', 'javascript:alert(1)', `http://usuari:clau@${window.location.host}/x`]) {
      const traductor = creaTraductor({ url, fetch });
      expect(traductor.disponible).toBe(false);
      const error = await errorDe(traductor.tradueix(['Hola'], 'ES'));
      expect(error).toBeInstanceOf(ErrorTraductor);
      expect(error.codi).toBe(CODI_TRADUCCIO.NO_DISPONIBLE);
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(urlDeServei(`${window.location.origin}/wp-json/x`)).toBe(`${window.location.origin}/wp-json/x`);
  });
});

describe('validació de la resposta', () => {
  test('una resposta amb una altra longitud, amb no-cadenes o amb un altre destí és invàlida', async () => {
    const dolentes = [
      { traduccions: ['només una'] },
      { traduccions: ['a', 2] },
      { traduccions: 'a,b' },
      { traduccions: ['a', 'b'], desti: 'FR' },
      null,
      new SyntaxError('no és JSON'),
    ];
    for (const cos of dolentes) {
      const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: fetchQueTorna(200, cos) }).tradueix(['a', 'b'], 'ES'));
      expect(error.codi).toBe(CODI_TRADUCCIO.RESPOSTA_INVALIDA);
    }
  });
});

describe('errors tipats', () => {
  test('un error de WP REST porta l’estat i el codi del servidor, mai el seu text', async () => {
    const fetch = fetchQueTorna(429, { code: 'sdp_traduccio_limit', message: 'Translation request could not be completed.', data: { status: 429 } });
    const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch }).tradueix(['Hola'], 'ES'));
    expect(error).toBeInstanceOf(ErrorTraductor);
    expect(error.codi).toBe(CODI_TRADUCCIO.SERVIDOR);
    expect(error.status).toBe(429);
    expect(error.codiServidor).toBe('sdp_traduccio_limit');
    expect(error.message).not.toMatch(/Translation request/);
  });

  test('una pàgina d’error sense JSON (un intermediari) continua sent un error del servidor, sense codi', async () => {
    const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: fetchQueTorna(502, new SyntaxError('<html>')) }).tradueix(['Hola'], 'ES'));
    expect(error.codi).toBe(CODI_TRADUCCIO.SERVIDOR);
    expect(error.status).toBe(502);
    expect(error.codiServidor).toBeNull();
  });

  test('la xarxa caiguda és INABASTABLE (estat 0) i un avortament és CANCELLADA', async () => {
    const caiguda = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: caiguda }).tradueix(['Hola'], 'ES'));
    expect(error.codi).toBe(CODI_TRADUCCIO.INABASTABLE);
    expect(error.status).toBe(0);
    const control = new AbortController();
    const avortat = vi.fn(async () => { control.abort(); throw new DOMException('abort', 'AbortError'); });
    const cancel = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: avortat }).tradueix(['Hola'], 'ES', { signal: control.signal }));
    expect(cancel.codi).toBe(CODI_TRADUCCIO.CANCELLADA);
    // C7 · El fetch rep un senyal compost, que s'avorta amb el de fora.
    const propi = avortat.mock.calls[0][1].signal;
    expect(propi).toBeInstanceOf(AbortSignal);
    expect(propi.aborted).toBe(true);
  });
});

/* C7 (Codex 261030) · El client neutral té termini propi, que cobrix també
   la lectura del cos, i distingix la cancel·lació humana del termini. */
describe('termini i cancel·lació (C7)', () => {
  const penjat = () => vi.fn((_, { signal }) => new Promise((__, rebutja) => {
    signal.addEventListener('abort', () => rebutja(new DOMException('Aborted', 'AbortError')));
  }));

  test('un servidor que no respon: passat el termini, INABASTABLE amb l’estat 0 (no CANCELLADA)', async () => {
    const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch: penjat(), termini: 20 }).tradueix(['Hola'], 'ES'));
    expect(error).toMatchObject({ codi: CODI_TRADUCCIO.INABASTABLE, status: 0 });
  });

  test('un cos JSON que no arriba mai també talla al termini', async () => {
    const fetch = vi.fn(async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) }));
    const error = await errorDe(creaTraductor({ url: URL_SERVEI, fetch, termini: 20 }).tradueix(['Hola'], 'ES'));
    expect(error).toMatchObject({ codi: CODI_TRADUCCIO.INABASTABLE, status: 0 });
  });

  test('la cancel·lació de fora durant la lectura del cos és CANCELLADA', async () => {
    const control = new AbortController();
    const fetch = vi.fn(async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) }));
    const promesa = errorDe(creaTraductor({ url: URL_SERVEI, fetch, termini: 5000 }).tradueix(['Hola'], 'ES', { signal: control.signal }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    control.abort();
    expect((await promesa).codi).toBe(CODI_TRADUCCIO.CANCELLADA);
  });

  test('un senyal ja avortat: CANCELLADA sense cap petició', async () => {
    const fetch = vi.fn();
    const control = new AbortController();
    control.abort();
    expect((await errorDe(creaTraductor({ url: URL_SERVEI, fetch }).tradueix(['Hola'], 'ES', { signal: control.signal }))).codi)
      .toBe(CODI_TRADUCCIO.CANCELLADA);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('el temporitzador i l’oient del senyal de fora s’alliberen sempre (també en un error)', async () => {
    vi.useFakeTimers();
    try {
      for (const fetch of [fetchQueTorna(200, { traduccions: ['Hola'] }), fetchQueTorna(500, {}), vi.fn(async () => { throw new TypeError('x'); })]) {
        const control = new AbortController();
        const afig = vi.spyOn(control.signal, 'addEventListener');
        const lleva = vi.spyOn(control.signal, 'removeEventListener');
        await errorDe(creaTraductor({ url: URL_SERVEI, fetch }).tradueix(['Hola'], 'ES', { signal: control.signal })).catch(() => null);
        expect(vi.getTimerCount()).toBe(0);
        expect(lleva).toHaveBeenCalledWith('abort', afig.mock.calls[0][1]);
      }
    } finally {
      vi.useRealTimers();
    }
  });
});

/* Decisió del Mestre (261030 §3) · Els noms propis no es traduïxen. Les
   traduccions d'estes proves són extractes de respostes REALS del 261030
   (frases inventades): beta.apertium.org cat|spa i cat|glg, MyMemory ca|eu
   i ca|de, que tornen les marques intactes. */
describe('noms propis protegits', () => {
  const REALS = Object.freeze([
    ['ES', 'Benvinguts a Sóc de Poble i a Gent de la Torre; la IAIA MarIA i la Pedra Seca viuen al Mas.',
      'Bienvenidos a ZSDPAZ y a ZSDPBZ; la ZSDPCZ y la ZSDPDZ viven al ZSDPEZ.',
      'Bienvenidos a Sóc de Poble y a Gent de la Torre; la IAIA MarIA y la Pedra Seca viven al Mas.'],
    ['GL', 'Benvinguts a Sóc de Poble i a Gent de la Torre; la IAIA MarIA viu al Mas.',
      'Benvidos a ZSDPAZ e a ZSDPBZ; a ZSDPCZ vive no ZSDPEZ.',
      'Benvidos a Sóc de Poble e a Gent de la Torre; a IAIA MarIA vive no Mas.'],
    ['EU', 'Benvinguts a Sóc de Poble i a Gent de la Torre; la IAIA MarIA viu al Mas.',
      'Ongi etorri ZSDPAZ eta ZSDPBZ-ra; ZSDPCZ ZSDPEZ-en bizi da.',
      'Ongi etorri Sóc de Poble eta Gent de la Torre-ra; IAIA MarIA Mas-en bizi da.'],
    ['DE', 'Benvinguts a Sóc de Poble i a Gent de la Torre; la IAIA MarIA viu al Mas.',
      'Willkommen bei ZSDPAZ und ZSDPBZ; ZSDPCZ lebt in ZSDPEZ.',
      'Willkommen bei Sóc de Poble und Gent de la Torre; IAIA MarIA lebt in Mas.'],
  ]);

  test('protegixNoms: cada nom, una marca; de «el Mas», només «Mas»; res a mitja paraula', () => {
    expect(protegixNoms(REALS[0][1])).toBe('Benvinguts a ZSDPAZ i a ZSDPBZ; la ZSDPCZ i la ZSDPDZ viuen al ZSDPEZ.');
    expect(protegixNoms('El Mas, del Mas, pel Mas i al Mas.')).toBe('El ZSDPEZ, del ZSDPEZ, pel ZSDPEZ i al ZSDPEZ.');
    expect(protegixNoms('Més mas. El Masó. Pedra Secallana. Sóc de Pobles.')).toBe('Més mas. El Masó. Pedra Secallana. Sóc de Pobles.');
    expect(protegixNoms('Un text amb ZSDPAZ ja escrit i Sóc de Poble')).toBe('Un text amb ZSDPAZ ja escrit i Sóc de Poble');
    // Gauntlet 261030 (cicle 2) · La IAIA i MarIA soles, després de «IAIA MarIA».
    expect(NOMS_PROPIS).toEqual(['Sóc de Poble', 'Gent de la Torre', 'IAIA MarIA', 'Pedra Seca', 'IAIA', 'MarIA']);
  });

  /* Gauntlet 261030 (cicle 2, noms-propis-iaia-sola-sense-proteccio) · Sense
     marca, Apertium torna «La YAYA local responde. Mantenimiento de la YAYA.
     Parla con Maria.» (resposta real). Les d'ací són extractes de respostes
     REALS (261030, frase inventada amb les marques, fins a la coma):
     cat|spa, cat|glg, cat|eng, cat|fra i ca|de les tornen intactes; ca|eu
     canvia ZSDPGZ per ZSDPFZ. */
  const FRASE_IAIA = 'La IAIA local respon. Manteniment de la IAIA. Parla amb MarIA';
  const REALS_IAIA = Object.freeze([
    ['ES', 'La ZSDPFZ local responde. Mantenimiento de la ZSDPFZ. Parla con ZSDPGZ',
      'La IAIA local responde. Mantenimiento de la IAIA. Parla con MarIA'],
    ['GL', 'A ZSDPFZ local responde. Mantemento da ZSDPFZ. Fala con ZSDPGZ',
      'A IAIA local responde. Mantemento da IAIA. Fala con MarIA'],
    ['EN-GB', 'The ZSDPFZ local responds. Maintenance of the ZSDPFZ. It Talks with ZSDPGZ',
      'The IAIA local responds. Maintenance of the IAIA. It Talks with MarIA'],
    ['FR', 'La ZSDPFZ locale répond. Maintien de la ZSDPFZ. Il parle avec ZSDPGZ',
      'La IAIA locale répond. Maintien de la IAIA. Il parle avec MarIA'],
    ['DE', 'Das lokale ZSDPFZ antwortet. Pflege des ZSDPFZ. Sprechen Sie mit ZSDPGZ',
      'Das lokale IAIA antwortet. Pflege des IAIA. Sprechen Sie mit MarIA'],
  ]);

  test('protegixNoms: «IAIA» i «MarIA» soles porten marca pròpia; «IAIA MarIA» sencera, la seua; res a mitja paraula', () => {
    expect(protegixNoms(FRASE_IAIA)).toBe('La ZSDPFZ local respon. Manteniment de la ZSDPFZ. Parla amb ZSDPGZ');
    expect(protegixNoms('Fet per la IAIA MarIA i la IAIA.')).toBe('Fet per la ZSDPCZ i la ZSDPFZ.');
    expect(protegixNoms('IAIAs, MarIAna i Maria no són noms protegits.')).toBe('IAIAs, MarIAna i Maria no són noms protegits.');
    expect(restauraNoms('Hecho por la ZSDPCZ y la ZSDPFZ.', 'Fet per la ZSDPCZ i la ZSDPFZ.')).toBe('Hecho por la IAIA MarIA y la IAIA.');
  });

  /* Cicle 4 · MITJÀ-03 (Gemini 261030), no reproduïda: RE_NOMS NO es menja el
     separador entre dos noms seguits (el que consumix és el caràcter d'ABANS
     del nom; el de després només el mira). La proposta, un lookbehind, no és
     del Baseline (Safari 16.0; el lookbehind arriba a la 16.4): traductor.js
     va al tros de PageFrame i un SyntaxError hi tombaria totes les pàgines. */
  test('protegixNoms: dos noms seguits, amb un sol separador o cap espai, tots dos marcats i restaurats; sense lookbehind', () => {
    const casos = [
      ['IAIA,MarIA', 'ZSDPFZ,ZSDPGZ'], ['MarIA MarIA', 'ZSDPGZ ZSDPGZ'], ['IAIA-MarIA', 'ZSDPFZ-ZSDPGZ'],
      ['Pedra Seca IAIA', 'ZSDPDZ ZSDPFZ'], ['«IAIA»«MarIA»', '«ZSDPFZ»«ZSDPGZ»'], ['IAIA MarIA MarIA', 'ZSDPCZ ZSDPGZ'],
      ['Gent de la Torre Sóc de Poble', 'ZSDPBZ ZSDPAZ'], ['al Mas del Mas', 'al ZSDPEZ del ZSDPEZ'], ['IAIA del Mas', 'ZSDPFZ del ZSDPEZ'],
    ];
    for (const [text, protegit] of casos) {
      expect([text, protegixNoms(text), restauraNoms(protegit, protegixNoms(text))]).toEqual([text, protegit, text]);
    }
    const font = (nom) => readFileSync(fileURLToPath(new URL(nom, import.meta.url)), 'utf8');
    for (const nom of ['./traductor.js', './traductorLliure.js', '../components/universal/traduccio/blocsTraduibles.js']) {
      expect([nom, /\(\?<[=!]/.test(font(nom))]).toEqual([nom, false]);
    }
  });

  test('tradueixTot: «la IAIA» i «MarIA» no ixen ni es traduïxen (respostes reals); si el motor les confon, l’original', async () => {
    for (const [desti, real, esperat] of REALS_IAIA) {
      const fetch = vi.fn(async (_, { body }) => resposta(200, { traduccions: JSON.parse(body).textos.map((text) => (text === protegixNoms(FRASE_IAIA) ? real : text)) }));
      expect([desti, await tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), [FRASE_IAIA], desti)]).toEqual([desti, [esperat]]);
      expect(fetch.mock.calls[0][1].body).not.toMatch(/IAIA|MarIA/);
    }
    // ca|eu real: «Hitz egin ZSDPFZrekin» per ZSDPGZ → no se sap on va cada nom: l'original, marcat.
    const eu = 'Tokiko ZSDPFZak erantzuten du. ZSDPFZaren mantentze-lanak. Hitz egin ZSDPFZrekin';
    const fetch = vi.fn(async () => resposta(200, { traduccions: [eu] }));
    const originals = [];
    expect(await tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), [FRASE_IAIA], 'EU', { enOriginal: (i) => originals.push(i) })).toEqual([FRASE_IAIA]);
    expect(originals).toEqual([0]);
  });

  /* Gauntlet 261030 (cicle 2, traduccio-lang-index-i-blocs-de-reserva) ·
     enOriginal diu quins textos tornen en l'original: el motor n'ha perdut
     una marca o l'ha tornat tal com l'ha rebut. */
  test('tradueixTot · enOriginal: els textos que tornen en l’original (marca perduda o sense traduir), i només eixos', async () => {
    const fetch = vi.fn(async (_, { body }) => resposta(200, {
      traduccions: JSON.parse(body).textos.map((text) => (text === 'NLnet' ? text : text.replace('ZSDPAZ', 'Soy de Pueblo').toUpperCase()))
    }));
    const originals = [];
    expect(await tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), ['Visca Sóc de Poble', 'Bon dia', 'NLnet'], 'ES', { enOriginal: (i) => originals.push(i) }))
      .toEqual(['Visca Sóc de Poble', 'BON DIA', 'NLnet']);
    expect(originals).toEqual([0, 2]);
  });

  test('restauraNoms: torna els noms; una marca perduda, afegida o canviada → null', () => {
    const protegit = protegixNoms(REALS[0][1]);
    expect(restauraNoms(REALS[0][2], protegit)).toBe(REALS[0][3]);
    expect(restauraNoms('Bienvenidos a y a ZSDPBZ; la ZSDPCZ y la ZSDPDZ viven al ZSDPEZ.', protegit)).toBeNull();
    expect(restauraNoms(`${REALS[0][2]} ZSDPAZ`, protegit)).toBeNull();
    expect(restauraNoms(REALS[0][2].replace('ZSDPAZ', 'ZSDPQZ'), protegit)).toBeNull();
    expect(restauraNoms('Hola', 'Hola')).toBe('Hola');
  });

  test('tradueixTot: cap nom propi ix de la pàgina i tots tornen al seu lloc (respostes reals)', async () => {
    for (const [desti, original, real, esperat] of REALS) {
      const fetch = vi.fn(async (_, { body }) => {
        const { textos } = JSON.parse(body);
        return resposta(200, { traduccions: textos.map((text) => (text === protegixNoms(original) ? real : text)) });
      });
      expect(await tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), [original], desti)).toEqual([esperat]);
      expect(fetch.mock.calls[0][1].body).not.toMatch(/Sóc de Poble|Gent de la Torre|IAIA MarIA|Pedra Seca|\bMas\b/);
    }
  });

  test('tradueixTot: si el motor perd una marca, eixe text torna en l’original, sense perdre cap paraula', async () => {
    const fetch = vi.fn(async (_, { body }) => resposta(200, { traduccions: JSON.parse(body).textos.map((text) => text.replace('ZSDPAZ', 'Soy de Pueblo').toUpperCase()) }));
    expect(await tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), ['Visca Sóc de Poble', 'Bon dia'], 'ES'))
      .toEqual(['Visca Sóc de Poble', 'BON DIA']);
  });
});

/* C4 · Els blocs amb enllaços o negretes van en una tanda HTML, després de la
   de text; un transport amb pressupost propi el comprova abans de res. */
describe('tradueixTot amb text i HTML', () => {
  test('dues tandes en ordre (text, després html), cada una amb el seu format; el resultat en l’ordre d’entrada', async () => {
    const fetch = vi.fn(async (_, { body }) => {
      const { textos, format } = JSON.parse(body);
      return resposta(200, { traduccions: textos.map((text) => `${format}:${text}`) });
    });
    const textos = ['Títol', { text: 'Bon <strong data-sdp="0">dia</strong>', format: 'html' }, 'Peu'];
    expect(await tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), textos, 'FR'))
      .toEqual(['text:Títol', 'html:Bon <strong data-sdp="0">dia</strong>', 'text:Peu']);
    expect(fetch.mock.calls.map(([, { body }]) => [JSON.parse(body).format, JSON.parse(body).textos])).toEqual([
      ['text', ['Títol', 'Peu']], ['html', ['Bon <strong data-sdp="0">dia</strong>']],
    ]);
  });

  test('comprovaPagina del transport s’executa ABANS de cap petició, amb els textos protegits', async () => {
    const fetch = vi.fn();
    const servidor = creaTraductor({ url: URL_SERVEI, fetch });
    const vist = [];
    const traductor = { ...servidor, comprovaPagina: (peticions, desti) => { vist.push([peticions, desti]); throw new ErrorTraductor(CODI_TRADUCCIO.MASSA_LLARGA); } };
    const error = await errorDe(tradueixTot(traductor, ['Sóc de Poble', { text: '<em data-sdp="0">x</em>', format: 'html' }], 'EU'));
    expect(error.codi).toBe(CODI_TRADUCCIO.MASSA_LLARGA);
    expect(vist).toEqual([[[{ text: 'ZSDPAZ', format: 'text' }, { text: '<em data-sdp="0">x</em>', format: 'html' }], 'EU']]);
    expect(fetch).not.toHaveBeenCalled();
    expect(servidor.admetHtml('EU')).toBe(true);
  });
});

describe('lots dins dels límits del servidor', () => {
  test('caràcters Unicode i bytes UTF-8 com els compta el servidor', () => {
    expect(caractersDe('Açò 🍅')).toBe(5);
    expect(bytesDe('Açò 🍅')).toBe(1 + 2 + 2 + 1 + 4);
  });

  test('els lots respecten 50 textos i 5000 caràcters, en ordre', () => {
    const cinquanta1 = Array.from({ length: 51 }, (_, i) => `t${i}`);
    const lots = partixEnLots(cinquanta1);
    expect(lots.map((lot) => lot.length)).toEqual([50, 1]);
    expect(lots.flat()).toEqual(cinquanta1);
    const llargs = ['a'.repeat(3000), 'b'.repeat(3000)];
    expect(partixEnLots(llargs)).toEqual([[llargs[0]], [llargs[1]]]);
    expect(partixEnLots(['c'.repeat(LIMITS_TRADUCCIO.caracters + 1)])).toBeNull();
  });

  test('un text massa llarg es parteix en espais i es torna a ajuntar', async () => {
    const paraula = 'pedra ';
    const llarg = paraula.repeat(1200).trim();
    const trossos = partixText(llarg, 5000);
    expect(trossos.length).toBe(2);
    expect(trossos.every((tros) => caractersDe(tros) <= 5000)).toBe(true);
    expect(trossos.join('')).toBe(llarg);
    const fetch = vi.fn(async (_, { body }) => resposta(200, { traduccions: JSON.parse(body).textos.map((t) => t.toUpperCase()) }));
    const traduccions = await tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), ['Títol', llarg], 'ES');
    // Títol (5) + primer tros (4998) passen de 5000: tres lots, un darrere de l'altre.
    expect(fetch.mock.calls.map(([, { body }]) => JSON.parse(body).textos.length)).toEqual([1, 1, 1]);
    expect(traduccions).toEqual(['TÍTOL', llarg.toUpperCase()]);
  });

  test('més lots dels permesos: MASSA_LLARGA sense cap petició', async () => {
    const fetch = vi.fn();
    const textos = Array.from({ length: 5 }, () => 'x'.repeat(4000));
    const error = await errorDe(tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), textos, 'ES'));
    expect(error.codi).toBe(CODI_TRADUCCIO.MASSA_LLARGA);
    expect(fetch).not.toHaveBeenCalled();
  });

  /* Ronda C9-2 · 4 lots de 5000 caràcters en deixaven passar 20000, i el
     servidor en dona 10000 al dia per a tot el poble: una pàgina entre els dos
     buidava el pressupost i fallava a mitges. */
  test('una pàgina de més caràcters que el pressupost diari: MASSA_LLARGA sense cap petició', async () => {
    const fetch = vi.fn();
    const textos = ['Títol', 'x'.repeat(LIMITS_TRADUCCIO.caractersPagina)];
    const error = await errorDe(tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), textos, 'ES'));
    expect(error.codi).toBe(CODI_TRADUCCIO.MASSA_LLARGA);
    expect(fetch).not.toHaveBeenCalled();
  });

  test('la primera fallada ho para tot: cap segona petició', async () => {
    const fetch = vi.fn(async () => resposta(503, { code: 'sdp_traduccio_ocupada' }));
    const error = await errorDe(tradueixTot(creaTraductor({ url: URL_SERVEI, fetch }), ['a'.repeat(3000), 'b'.repeat(3000)], 'FR'));
    expect(error.codiServidor).toBe('sdp_traduccio_ocupada');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
