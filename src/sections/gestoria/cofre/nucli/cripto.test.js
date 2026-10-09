// @vitest-environment node
/* El nucli criptogràfic del cofre (Onada 6, ordre del Mestre, 261009:
   cofre xifrat). WebCrypto de veres: el de l'entorn (globalThis.crypto), que
   es comprova que hi és abans de res. Es mira l'anada i tornada, que un
   xifrat, un IV o un lloc manipulats fan fallar el GCM, els 10.000 IV únics,
   el farciment a 4 KiB, el codi de recuperació en base32, la frase de pas
   mínima i que una KEK errònia no desembolcalla la DEK. Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import {
  BLOC_FARCIT, BYTES_CODI, BYTES_DEK_EMBOLCALLADA, ITERACIONS_KDF, KDF, aBase64, aadDe, avaluaFrase, bytesDelCodi,
  codiDeBytes, deBase64, desembolcalla, desfarceix, desxifraValor, embolcalla, esIdOpac, exigixFrase, farceix,
  generaDek, kekDeFrase, kekDelCodi, llegixParametres, nouId, nousParametres, parametresDesats, xifraValor
} from './cripto.js';

const cripto = globalThis.crypto;
const ID = '6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b';
const ALTRE_ID = '0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d';
const PROVES = 1000;

async function dekDeTreball() {
  const dek = await generaDek(cripto);
  const parametres = nousParametres(cripto, PROVES);
  const kek = await kekDeFrase(cripto, 'frase de prova del poble', parametres);
  return desembolcalla(cripto, await embolcalla(cripto, dek, kek), kek);
}

/* Gira un bit d'un text base64 (per a manipular un xifrat o un IV). */
function giraBit(text, posicio = 0) {
  const bytes = deBase64(text);
  bytes[posicio] ^= 1;
  return aBase64(bytes);
}

describe('l’entorn', () => {
  test('hi ha WebCrypto (globalThis.crypto.subtle) amb el que fa falta', () => {
    expect(cripto?.subtle).toBeTruthy();
    for (const metode of ['importKey', 'deriveKey', 'generateKey', 'wrapKey', 'unwrapKey', 'encrypt', 'decrypt']) {
      expect(typeof cripto.subtle[metode], metode).toBe('function');
    }
    expect(typeof cripto.getRandomValues).toBe('function');
  });
});

describe('base64 i codi de recuperació', () => {
  test('base64: anada i tornada de totes les mides xicotetes, i rebuig de textos que no ho són', () => {
    for (let n = 0; n < 40; n += 1) {
      const bytes = cripto.getRandomValues(new Uint8Array(n));
      expect([...deBase64(aBase64(bytes))]).toEqual([...bytes]);
    }
    expect(aBase64(new TextEncoder().encode('Sóc de Poble!'))).toBe('U8OzYyBkZSBQb2JsZSE=');
    for (const dolent of ['abc', 'a=bc', '!!!!', 42, null]) expect(() => deBase64(dolent)).toThrow(TypeError);
  });

  test('base64 canònic: els bits sobrers abans del farciment han de ser zero', () => {
    expect([...deBase64('AA==')]).toEqual([0]);
    expect([...deBase64('AAA=')]).toEqual([0, 0]);
    expect([...deBase64('/w==')]).toEqual([255]);
    // «AB==» i «AAB=» dirien els mateixos bytes que «AA==» i «AAA=»: no són canònics.
    for (const dolent of ['AB==', 'AP==', 'AAB=', 'AAD=', '/x==']) expect(() => deBase64(dolent), dolent).toThrow(TypeError);
  });

  test('el codi: 26 caràcters en grups de 4, i torna als mateixos 16 bytes encara que s’escriga mal', () => {
    const bytes = cripto.getRandomValues(new Uint8Array(BYTES_CODI));
    const codi = codiDeBytes(bytes);
    expect(codi).toMatch(/^(?:[A-Z2-7]{4}-){6}[A-Z2-7]{2}$/);
    expect([...bytesDelCodi(codi)]).toEqual([...bytes]);
    expect([...bytesDelCodi(` ${codi.toLowerCase().replace(/-/g, ' ')} `)]).toEqual([...bytes]);
    // Les confusions de lectura: O per 0, I per 1, B per 8.
    const zero = codiDeBytes(new Uint8Array(BYTES_CODI));
    expect(zero).toBe('AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AA');
    expect(codiDeBytes(Uint8Array.from({ length: BYTES_CODI }, () => 255))).toBe('7777-7777-7777-7777-7777-7777-74');
  });

  test('un codi mal format o amb els bits sobrers alterats es refusa amb CODI_INVALID', () => {
    for (const dolent of ['', 'ABCD', 'AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-A!', 'AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AAA', null]) {
      expect(() => bytesDelCodi(dolent), String(dolent)).toThrow(expect.objectContaining({ codi: 'CODI_INVALID' }));
    }
    // L'última lletra porta 2 bits sobrers, sempre zero: «AB» els té a 01.
    expect(() => bytesDelCodi('AAAA-AAAA-AAAA-AAAA-AAAA-AAAA-AB')).toThrow(expect.objectContaining({ codi: 'CODI_INVALID' }));
  });
});

describe('la frase de pas', () => {
  test('mínim: 12 caràcters o 4 paraules, i 5 caràcters diferents', () => {
    expect(avaluaFrase('').nivell).toBe('buida');
    expect(avaluaFrase('curta').valida).toBe(false);
    expect(avaluaFrase('onze lletre').valida).toBe(false);
    expect(avaluaFrase('aaaaaaaaaaaaaaaa')).toMatchObject({ valida: false, nivell: 'repetida' });
    expect(avaluaFrase('dotze lletra')).toMatchObject({ valida: true, nivell: 'justa', caracters: 12 });
    expect(avaluaFrase('pa sol mar riu').valida).toBe(true);
    expect(avaluaFrase('gat sol mar riu')).toMatchObject({ valida: true, paraules: 4 });
    expect(avaluaFrase('olivera vella del mas').nivell).toBe('bona');
    expect(avaluaFrase('la torre de les maçanes té un forn de pa').nivell).toBe('molt-bona');
    expect(() => exigixFrase('curta')).toThrow(expect.objectContaining({ codi: 'CONTRASENYA_FEBLE' }));
    expect(() => exigixFrase(12345678901234)).toThrow(TypeError);
  });

  test('previsible: seqüències, repeticions per blocs i paraules trivials no valen', () => {
    for (const previsible of ['123456789012', 'abcdefghijkl', 'aaa bbb ccc ddd', 'abcdeabcdeab', 'ABCDEFGHIJKLMN', '9876543210abc']) {
      expect(avaluaFrase(previsible), previsible).toMatchObject({ valida: false, nivell: 'previsible' });
      expect(() => exigixFrase(previsible)).toThrow(expect.objectContaining({ codi: 'CONTRASENYA_FEBLE' }));
    }
    // «aaa», «abc» i «1234» no compten com a paraules.
    expect(avaluaFrase('aaa bbb ccc ddd').paraules).toBe(0);
    expect(avaluaFrase('121212121212').nivell).toBe('repetida');
    // Les dobles d'una frase normal no la fan previsible.
    expect(avaluaFrase('dotze lletra').valida).toBe(true);
    expect(avaluaFrase('olivera vella del mas de dalt').nivell).toBe('molt-bona');
    expect(avaluaFrase('setze caràcters ok').nivell).toBe('bona');
  });

  test('NFC: la mateixa frase amb l’accent compost o descompost deriva la mateixa KEK', async () => {
    const compost = 'caçadora de la serra';
    const descompost = compost.normalize('NFD');
    expect(descompost).not.toBe(compost);
    const parametres = nousParametres(cripto, PROVES);
    const dek = await generaDek(cripto);
    const embolcall = await embolcalla(cripto, dek, await kekDeFrase(cripto, compost, parametres));
    await expect(desembolcalla(cripto, embolcall, await kekDeFrase(cripto, descompost, parametres))).resolves.toBeTruthy();
  });
});

describe('KDF, KEK i DEK', () => {
  test('paràmetres versionats: v 1, PBKDF2-HMAC-SHA-256, 600.000 iteracions per defecte i sal de 16 B', () => {
    const parametres = nousParametres(cripto);
    expect(parametres).toMatchObject({ v: 1, kdf: KDF, iter: ITERACIONS_KDF });
    expect(ITERACIONS_KDF).toBe(600000);
    expect(parametres.sal).toHaveLength(16);
    expect([...nousParametres(cripto).sal]).not.toEqual([...parametres.sal]);
  });

  test('la KEK és AES-KW no extraïble; la DEK de treball és AES-GCM-256 no extraïble; l’embolcall fa 40 B', async () => {
    const parametres = nousParametres(cripto, PROVES);
    const kek = await kekDeFrase(cripto, 'una frase prou llarga', parametres);
    expect(kek.extractable).toBe(false);
    expect(kek.algorithm.name).toBe('AES-KW');
    expect([...kek.usages].sort()).toEqual(['unwrapKey', 'wrapKey']);
    const embolcall = await embolcalla(cripto, await generaDek(cripto), kek);
    expect(embolcall).toHaveLength(BYTES_DEK_EMBOLCALLADA);
    const dek = await desembolcalla(cripto, embolcall, kek);
    expect(dek.extractable).toBe(false);
    expect(dek.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    await expect(cripto.subtle.exportKey('raw', dek)).rejects.toThrow();
  });

  test('una KEK errònia (frase o codi) no desembolcalla: DESEMBOLCALLAT_FALLIT', async () => {
    const parametres = nousParametres(cripto, PROVES);
    const dek = await generaDek(cripto);
    const embolcall = await embolcalla(cripto, dek, await kekDeFrase(cripto, 'la frase bona de veres', parametres));
    await expect(desembolcalla(cripto, embolcall, await kekDeFrase(cripto, 'la frase dolenta de veres', parametres)))
      .rejects.toMatchObject({ codi: 'DESEMBOLCALLAT_FALLIT' });
    const codi = cripto.getRandomValues(new Uint8Array(BYTES_CODI));
    const delCodi = await embolcalla(cripto, dek, await kekDelCodi(cripto, codi, parametres));
    const copia = Uint8Array.from(codi);
    copia[0] ^= 1;
    await expect(desembolcalla(cripto, delCodi, await kekDelCodi(cripto, copia, parametres))).rejects.toMatchObject({ codi: 'DESEMBOLCALLAT_FALLIT' });
    // kekDelCodi no posa a zero els bytes de qui la crida.
    expect(codi.some((b) => b !== 0)).toBe(true);
  });

  test('llegixParametres: refusa versió, KDF, iteracions baixes i mides que no són les seues', () => {
    const parametres = nousParametres(cripto);
    const desats = parametresDesats(parametres, new Uint8Array(BYTES_DEK_EMBOLCALLADA));
    expect(llegixParametres(desats).iter).toBe(ITERACIONS_KDF);
    const dolents = [
      { ...desats, v: 2 }, { ...desats, kdf: 'PBKDF2-HMAC-SHA-1' }, { ...desats, iter: 1000 }, { ...desats, iter: 1.5 },
      { ...desats, sal: aBase64(new Uint8Array(8)) }, { ...desats, dek: aBase64(new Uint8Array(32)) }, { ...desats, sal: 'no és base64' }, null
    ];
    for (const dolent of dolents) expect(() => llegixParametres(dolent)).toThrow(expect.objectContaining({ codi: 'PARAMETRES_DESCONEGUTS' }));
    expect(llegixParametres({ ...desats, iter: 1000 }, { minIteracions: 1000 }).iter).toBe(1000);
  });
});

describe('els registres', () => {
  test('anada i tornada d’un valor JSON, amb accents i xifres', async () => {
    const dek = await dekDeTreball();
    const valor = { proveidor: 'Anthropic', import: -12345, categoria: 'ia', nota: 'Sóc de Poble · ç à é' };
    const xifrat = await xifraValor(cripto, dek, 'classificacions', ID, valor);
    expect(await desxifraValor(cripto, dek, 'classificacions', ID, xifrat)).toEqual(valor);
    expect(xifrat.xifrat).not.toContain('Anthropic');
  });

  test('farcit a múltiples de 4 KiB: un valor curt i un de quasi 4 KiB fan la mateixa mida', async () => {
    const dek = await dekDeTreball();
    const curt = await xifraValor(cripto, dek, 'proves', ID, 'x');
    const llarg = await xifraValor(cripto, dek, 'proves', ID, 'x'.repeat(BLOC_FARCIT - 10));
    const mes = await xifraValor(cripto, dek, 'proves', ID, 'x'.repeat(BLOC_FARCIT));
    expect(deBase64(curt.xifrat)).toHaveLength(BLOC_FARCIT + 16);
    expect(deBase64(llarg.xifrat)).toHaveLength(BLOC_FARCIT + 16);
    expect(deBase64(mes.xifrat)).toHaveLength(2 * BLOC_FARCIT + 16);
    expect([...desfarceix(farceix(new Uint8Array([1, 2, 3])))]).toEqual([1, 2, 3]);
    const brut = farceix(new Uint8Array([1, 2, 3]));
    brut[100] = 7;
    expect(() => desfarceix(brut)).toThrow(TypeError);
  });

  test('xifrat, IV o lloc (AAD) manipulats: REGISTRE_MANIPULAT i res desxifrat', async () => {
    const dek = await dekDeTreball();
    const xifrat = await xifraValor(cripto, dek, 'classificacions', ID, { secret: 'compte de prova' });
    const manipulat = expect.objectContaining({ codi: 'REGISTRE_MANIPULAT' });
    await expect(desxifraValor(cripto, dek, 'classificacions', ID, { ...xifrat, xifrat: giraBit(xifrat.xifrat, 7) })).rejects.toEqual(manipulat);
    await expect(desxifraValor(cripto, dek, 'classificacions', ID, { ...xifrat, xifrat: giraBit(xifrat.xifrat, BLOC_FARCIT + 3) })).rejects.toEqual(manipulat);
    await expect(desxifraValor(cripto, dek, 'classificacions', ID, { ...xifrat, iv: giraBit(xifrat.iv) })).rejects.toEqual(manipulat);
    await expect(desxifraValor(cripto, dek, 'classificacions', ID, { ...xifrat, iv: aBase64(new Uint8Array(16)) })).rejects.toEqual(manipulat);
    // El mateix registre en un altre lloc: l'AAD no quadra.
    await expect(desxifraValor(cripto, dek, 'classificacions', ALTRE_ID, xifrat)).rejects.toEqual(manipulat);
    await expect(desxifraValor(cripto, dek, 'simulacions', ID, xifrat)).rejects.toEqual(manipulat);
    // Una altra DEK tampoc.
    await expect(desxifraValor(cripto, await dekDeTreball(), 'classificacions', ID, xifrat)).rejects.toEqual(manipulat);
    expect(new TextDecoder().decode(aadDe('classificacions', ID))).toBe(`sdp.gestoria.cofre.v1|classificacions|${ID}`);
  });

  test('IV únics en 10.000 xifrats', async () => {
    const dek = await dekDeTreball();
    const ivs = new Set();
    for (let i = 0; i < 10000; i += 1) ivs.add((await xifraValor(cripto, dek, 'proves', ID, i)).iv);
    expect(ivs.size).toBe(10000);
    expect(deBase64([...ivs][0])).toHaveLength(12);
  }, 60000);

  test('lloc i valor: col·lecció en minúscules, id opac (UUID v4) i valor JSON', async () => {
    const dek = await dekDeTreball();
    await expect(xifraValor(cripto, dek, 'Classificacions', ID, 1)).rejects.toMatchObject({ codi: 'COLLECCIO_INVALIDA' });
    await expect(xifraValor(cripto, dek, 'proves', 'compte-principal', 1)).rejects.toMatchObject({ codi: 'ID_INVALID' });
    await expect(xifraValor(cripto, dek, 'proves', ID, undefined)).rejects.toMatchObject({ codi: 'VALOR_INVALID' });
    expect(esIdOpac(nouId(cripto))).toBe(true);
    expect(esIdOpac(nouId({ getRandomValues: (b) => cripto.getRandomValues(b) }))).toBe(true);
  });
});
