// @vitest-environment node
/* Finestreta · nucli · validadors d'identitat. Ordre del Mestre, 13-10-2026
   (pla 261013_1405, front H). Tots els identificadors de prova es generen
   ací calculant-ne el control amb una implementació independent del mòdul:
   cap DNI, NIE, NAF ni referència cadastral escrit a mà. */
import { describe, expect, test } from 'vitest';
import { ORGANISMES as ORGANISMES_DOCUMENT } from '../../identitat/nucli/document.js';
import {
  CAMPS_IDENTITAT, congela, normalitzaIpf, ORGANISMES, plegaAlineat, plegaText, PROVINCIES, provinciaDelCodiPostal, ROLS,
  teFormaIdentificador, validaAdreca, validaCamp, validaCnae, validaCodiIne, validaCodiPostal, validaComplement, validaCorreu,
  validaData, validaDenominacio, validaEpigrafIae, validaImport, validaNaf, validaNifEntitat, validaNifPersona, validaNomLloc,
  validaNomPropi, validaNumeroInscripcio, validaNumeroVia, validaReferenciaCadastral, validaRefSuma, validaSeccio, validaSegons,
  validaTelefon, validaVia, VALIDADORS, esDataIso, esMomentIso
} from './validadorsIdentitat.js';

/* ---------- Generadors independents ---------- */
const LLETRES = 'TRWAGMYFPDXBNJZSQVHLCKE';
const dni = (n) => `${String(n).padStart(8, '0')}${LLETRES[n % 23]}`;
const nie = (prefix, n) => {
  const cos = String(n).padStart(7, '0');
  return `${prefix}${cos}${LLETRES[Number(`${'XYZ'.indexOf(prefix)}${cos}`) % 23]}`;
};
function controlCif(xifres) {
  const parells = Number(xifres[1]) + Number(xifres[3]) + Number(xifres[5]);
  const senars = [0, 2, 4, 6].map((i) => Number(xifres[i]) * 2).map((n) => (n > 9 ? n - 9 : n)).reduce((a, b) => a + b, 0);
  const c = (10 - ((parells + senars) % 10)) % 10;
  return { xifra: String(c), lletra: 'JABCDEFGHI'[c] };
}
const cif = (lletra, xifres, forma = 'xifra') => `${lletra}${xifres}${controlCif(xifres)[forma]}`;
/* NAF amb aritmètica de BigInt i concatenació de text, no com el mòdul. */
function naf(prov, n) {
  const p = String(prov).padStart(2, '0');
  const cos = String(n).padStart(8, '0');
  const base = n < 10000000 ? BigInt(n) + BigInt(prov) * BigInt(10000000) : BigInt(`${p}${cos}`);
  return `${p}${cos}${String(base % 97n).padStart(2, '0')}`;
}
/* Referència cadastral: el valor de cada lletra és la seua posició en l'alfabet amb la Ñ. */
const ALFABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
const PESOS = [13, 15, 12, 5, 4, 17, 9, 21, 3, 7, 1];
const lletraRc = (cadena) => 'MQWERTYUIOPASDFGHJKLBZX'[[...cadena].reduce((s, c, i) => s + (/\d/.test(c) ? Number(c) : ALFABET.indexOf(c) + 1) * PESOS[i], 0) % 23];
const rc = (...trossos) => {
  const cos = trossos.join('');
  return cos + lletraRc(cos.slice(0, 7) + cos.slice(14, 18)) + lletraRc(cos.slice(7, 14) + cos.slice(14, 18));
};
const altraLletra = (l, alfabet) => alfabet[(alfabet.indexOf(l) + 1) % alfabet.length];

describe('plegat', () => {
  test('plegaText lleva accents i passa a minúscules', () => {
    expect(plegaText('Número de AFILIACIÓN')).toBe('numero de afiliacion');
    expect(plegaText(null)).toBe('');
  });

  test('plegaAlineat conserva la llargària i la posició de cada caràcter', () => {
    for (const text of ['Maçanes, Ñ', 'Gal·la Àngels', 'línia\nsegona', `astral ${String.fromCodePoint(0x1f33e)} fi`]) {
      const plegat = plegaAlineat(text);
      expect(plegat).toHaveLength(text.length);
    }
    expect(plegaAlineat('ÑAÇ')).toBe('nac');
  });

  test('congela en profunditat', () => {
    const x = congela({ a: { b: [1] } });
    expect(Object.isFrozen(x.a.b)).toBe(true);
  });
});

describe('NIF de persona i d’entitat', () => {
  test.each([0, 1, 23, 4242, 31415926, 99999999])('DNI generat %i', (n) => {
    expect(validaNifPersona(dni(n))).toEqual({ valid: true, normalitzat: dni(n), avis: null });
  });

  test('NIE generats', () => {
    for (const [p, n] of [['X', 1], ['Y', 7654321], ['Z', 42]]) expect(validaNifPersona(nie(p, n)).valid).toBe(true);
  });

  test('lletra errònia o CIF: no és el NIF d’una persona', () => {
    const bo = dni(27182818);
    expect(validaNifPersona(bo.slice(0, 8) + altraLletra(bo[8], LLETRES))).toMatchObject({ valid: false, normalitzat: null });
    const entitat = cif('G', '1234567');
    expect(validaNifPersona(entitat)).toMatchObject({ valid: false });
    expect(validaNifPersona(entitat).avis).toMatch(/entitat/);
  });

  test('CIF amb G: vàlid i sense avís; amb una altra lletra, vàlid amb avís', () => {
    expect(validaNifEntitat(cif('G', '7654321'))).toEqual({ valid: true, normalitzat: cif('G', '7654321'), avis: null });
    const societat = validaNifEntitat(cif('B', '2468013'));
    expect(societat.valid).toBe(true);
    expect(societat.avis).toMatch(/G/);
    expect(validaNifEntitat(dni(4242)).valid).toBe(false);
  });

  test('IPF de la TGSS: lleva el dígit de tipus i els zeros', () => {
    const bo = dni(12345678);
    expect(normalitzaIpf(`1${bo}`)).toBe(bo);
    expect(normalitzaIpf(`10${bo}`)).toBe(bo);
    expect(normalitzaIpf(`1 0${bo.slice(0, 8)} ${bo[8].toLowerCase()}`)).toBe(bo);
    const curt = dni(4242);
    expect(normalitzaIpf(`1${String(4242).padStart(9, '0')}${curt[8]}`)).toBe(curt);
    const estranger = nie('X', 1234567);
    expect(normalitzaIpf(`6${estranger}`)).toBe(estranger);
    expect(normalitzaIpf(`60${estranger}`)).toBe(estranger);
  });

  test('IPF: un DNI bo no es toca, i un control dolent no es converteix en bo', () => {
    const bo = dni(23456789);
    expect(normalitzaIpf(bo)).toBe(bo);
    const dolent = bo.slice(0, 8) + altraLletra(bo[8], LLETRES);
    expect(validaNifPersona(normalitzaIpf(`1${dolent}`)).valid).toBe(false);
  });
});

describe('NAF', () => {
  test('les dues branques: n < 10^7 i n ≥ 10^7', () => {
    for (const [prov, n] of [[3, 1234567], [3, 1], [28, 9999999], [3, 12345678], [46, 87654321], [1, 10000000]]) {
      expect(validaNaf(naf(prov, n)), `${prov}/${n}`).toMatchObject({ valid: true, normalitzat: naf(prov, n) });
    }
  });

  test('amb separadors «/», espai i guionet', () => {
    const bo = naf(3, 12345678);
    for (const sep of ['/', ' ', '-']) expect(validaNaf(`${bo.slice(0, 2)}${sep}${bo.slice(2, 10)}${sep}${bo.slice(10)}`).normalitzat).toBe(bo);
  });

  test('control erroni, massa curt o massa llarg: no vàlid', () => {
    const bo = naf(12, 3456789);
    const dolent = bo.slice(0, 10) + String((Number(bo.slice(10)) + 1) % 97).padStart(2, '0');
    expect(validaNaf(dolent).valid).toBe(false);
    expect(validaNaf(bo.slice(1)).valid).toBe(false);
    expect(validaNaf(`${bo}0`).valid).toBe(false);
    expect(validaNaf(null).valid).toBe(false);
  });
});

describe('referència cadastral', () => {
  const urbana = () => rc('1234567', 'VH5797', 'S', '0001');
  test('generada amb les lletres de control: vàlida, també en minúscules i amb espais', () => {
    const bo = urbana();
    expect(bo).toHaveLength(20);
    expect(validaReferenciaCadastral(bo)).toMatchObject({ valid: true, normalitzat: bo, parcial: false });
    expect(validaReferenciaCadastral(bo.toLowerCase()).normalitzat).toBe(bo);
    expect(validaReferenciaCadastral(`${bo.slice(0, 7)} ${bo.slice(7, 14)} ${bo.slice(14, 18)} ${bo.slice(18)}`).normalitzat).toBe(bo);
  });

  test('amb la Ñ, que val 15', () => {
    const ambEnye = rc('03123Ñ0', '0100123', '0000');
    expect(validaReferenciaCadastral(ambEnye).valid).toBe(true);
  });

  test('una lletra de control errònia: no vàlida', () => {
    const bo = urbana();
    expect(validaReferenciaCadastral(bo.slice(0, 19) + altraLletra(bo[19], 'MQWERTYUIOPASDFGHJKLBZX')).valid).toBe(false);
    expect(validaReferenciaCadastral(bo.slice(0, 18) + altraLletra(bo[18], 'MQWERTYUIOPASDFGHJKLBZX') + bo[19]).valid).toBe(false);
  });

  test('14 caràcters: parcial, sense validar', () => {
    expect(validaReferenciaCadastral(urbana().slice(0, 14))).toMatchObject({ valid: false, parcial: true, normalitzat: null });
    expect(validaReferenciaCadastral('massa curta')).toMatchObject({ valid: false, parcial: false });
  });
});

describe('codi postal, província i INE', () => {
  test('01xxx a 52xxx bons, amb la seua província', () => {
    expect(validaCodiPostal('01000')).toMatchObject({ valid: true, provincia: 'Araba/Álava' });
    expect(validaCodiPostal('52999')).toMatchObject({ valid: true, provincia: 'Melilla' });
    expect(validaCodiPostal('03837')).toMatchObject({ valid: true, normalitzat: '03837', provincia: 'Alacant/Alicante' });
    expect(provinciaDelCodiPostal('46001')).toBe('València/Valencia');
    expect(PROVINCIES).toHaveLength(52);
  });

  test('00xxx, 53xxx i formes que no són cinc xifres: dolents', () => {
    for (const cp of ['00123', '53000', '9999', '123456', 'abcde', null]) expect(validaCodiPostal(cp).valid, String(cp)).toBe(false);
    expect(provinciaDelCodiPostal('53000')).toBeNull();
  });

  test('codi INE: cinc xifres d’una província', () => {
    expect(validaCodiIne('03128').valid).toBe(true);
    expect(validaCodiIne('99128').valid).toBe(false);
  });
});

describe('dates, telèfon i correu', () => {
  test('dates plausibles amb l’any de quatre xifres, en ISO', () => {
    expect(validaData('15/03/1975').normalitzat).toBe('1975-03-15');
    expect(validaData('2026-10-13').normalitzat).toBe('2026-10-13');
    expect(validaData('1 de marzo de 2024').normalitzat).toBe('2024-03-01');
    for (const dolenta of ['15/03/75', '31/02/2024', '01/01/1899', 'demà', null]) expect(validaData(dolenta).valid, String(dolenta)).toBe(false);
  });

  test('telèfon: nou xifres que comencen per 6-9, amb +34 o 0034', () => {
    const mobil = ['6', '12', '345', '678'].join('');
    expect(validaTelefon(mobil).normalitzat).toBe(mobil);
    expect(validaTelefon(`+34 ${mobil.slice(0, 3)} ${mobil.slice(3, 6)} ${mobil.slice(6)}`).normalitzat).toBe(mobil);
    expect(validaTelefon(`0034${mobil}`).normalitzat).toBe(mobil);
    expect(validaTelefon(['5', '12345678'].join('')).valid).toBe(false);
    expect(validaTelefon(mobil.slice(1)).valid).toBe(false);
  });

  test('correu de forma, amb el domini en minúscules', () => {
    expect(validaCorreu('Persona@Exemple.CAT').normalitzat).toBe('Persona@exemple.cat');
    for (const dolent of ['sense arroba', 'a@b', '@exemple.cat']) expect(validaCorreu(dolent).valid).toBe(false);
  });

  test('esDataIso i esMomentIso', () => {
    expect(esDataIso('2026-02-29')).toBe(false);
    expect(esDataIso('2028-02-29')).toBe(true);
    expect(esMomentIso('2026-10-13T15:40:00Z')).toBe(true);
    expect(esMomentIso('2026-10-13T15:40:00.123+02:00')).toBe(true);
    expect(esMomentIso('2026-10-13')).toBe(false);
  });
});

describe('activitat i tributs', () => {
  test('CNAE: quatre xifres, també amb punt; mai 00', () => {
    expect(validaCnae('62.01').normalitzat).toBe('6201');
    expect(validaCnae('4711').normalitzat).toBe('4711');
    for (const dolent of ['0001', '621', '62.011', 'ab.cd']) expect(validaCnae(dolent).valid).toBe(false);
  });

  test('epígraf de l’IAE: només la forma', () => {
    expect(validaEpigrafIae('751.1').valid).toBe(true);
    expect(validaEpigrafIae('843').valid).toBe(true);
    for (const dolent of ['0', '12345', '751.123', 'J']) expect(validaEpigrafIae(dolent).valid).toBe(false);
  });

  test('referència de SUMA: forma, alguna xifra, i mai un NIF ni una referència cadastral (tipatge estricte)', () => {
    expect(validaRefSuma('0312 3456 78').normalitzat).toBe('0312345678');
    expect(validaRefSuma('ABCDEFG').valid).toBe(false);
    expect(validaRefSuma('12345').valid).toBe(false);
    expect(validaRefSuma(dni(4242)).valid).toBe(false);
    expect(validaRefSuma(rc('1234567', 'VH5797', 'S', '0001')).valid).toBe(false);
  });

  test('import en cèntims enters i positius', () => {
    expect(validaImport(95000).valid).toBe(true);
    for (const dolent of [0, -1, 1.5, '950,00', 100000000]) expect(validaImport(dolent).valid).toBe(false);
  });
});

describe('noms i textos (regressió Xylella: un NIF no cap en un camp de nom)', () => {
  test('noms propis amb accents, apòstrof, punt volat i guionet', () => {
    for (const nom of ['Llinares', 'Gal·la', 'D’Alba', 'María José', 'Pérez-Llorca', 'ÑÚÑEZ']) expect(validaNomPropi(nom).valid, nom).toBe(true);
  });

  test('un NIF, un NIE o qualsevol xifra no és un nom', () => {
    for (const valor of [dni(4242), nie('Y', 7654321), cif('G', '1234567'), 'Javi 2', 'X']) {
      expect(validaNomPropi(valor).valid, valor).toBe(false);
    }
  });

  test('llocs, vies, complements, adreces i denominacions', () => {
    expect(validaNomLloc('La Torre de les Maçanes').valid).toBe(true);
    expect(validaNomLloc('Alacant/Alicante').valid).toBe(true);
    expect(validaNomLloc('03837').valid).toBe(false);
    expect(validaVia('Carrer 9 d’Octubre').valid).toBe(true);
    expect(validaComplement('2º B').valid).toBe(true);
    expect(validaAdreca('Carrer Major, 5, 03837 La Torre de les Maçanes').valid).toBe(true);
    expect(validaDenominacio('Associació Cultural El Rentonar').valid).toBe(true);
  });

  test('cap text lliure amaga un identificador personal', () => {
    const iban = ['ES', '76', ' 0000', ' 1111', ' 2222', ' 3333', ' 4444'].join('');
    for (const amagat of [`Carrer ${dni(4242)}`, `Associació ${cif('G', '7654321')}`, `Partida ${naf(3, 1234567)}`, `Major ${iban}`]) {
      expect(teFormaIdentificador(amagat), amagat).toBe(true);
      expect(validaAdreca(amagat).valid, amagat).toBe(false);
      expect(validaDenominacio(amagat).valid, amagat).toBe(false);
    }
    expect(teFormaIdentificador('Carrer Major, 5, 03837')).toBe(false);
  });

  test('número de via, inscripció i secció', () => {
    expect(validaNumeroVia('12b').normalitzat).toBe('12B');
    expect(validaNumeroVia('s/n').normalitzat).toBe('S/N');
    expect(validaNumeroVia('Km 3,5').valid).toBe(true);
    expect(validaNumeroVia('dotze').valid).toBe(false);
    expect(validaNumeroInscripcio('CV-01-012345-A').normalitzat).toBe('CV-01-012345-A');
    expect(validaNumeroInscripcio('SENSE').valid).toBe(false);
    expect(validaNumeroInscripcio(dni(4242)).valid).toBe(false);
    expect(validaSeccio('1ª').valid).toBe(true);
    expect(validaSeccio('primera').normalitzat).toBe('PRIMERA');
    expect(validaSeccio('dotzena').valid).toBe(false);
  });
});

describe('el catàleg dels camps', () => {
  test('cada camp té un rol conegut i un validador', () => {
    for (const [nom, definicio] of Object.entries(CAMPS_IDENTITAT)) {
      expect(ROLS, nom).toContain(definicio.rol);
      expect(Object.keys(VALIDADORS), nom).toContain(definicio.tipus);
      expect(nom, nom).toMatch(/^[a-z]+[A-Za-z]*\.[a-z][A-Za-z0-9]*$/);
    }
  });

  test('cap camp per a l’IBAN, el compte, la salut, el CSV ni cap credencial', () => {
    const vetats = /iban|compte|cuenta|banc|salut|medic|discapac|csv|verificacio|clau|clave|contrasen|password/i;
    expect(Object.keys(CAMPS_IDENTITAT).filter((nom) => vetats.test(nom))).toEqual([]);
  });

  test('els de contacte només s’entren a mà', () => {
    expect(Object.entries(CAMPS_IDENTITAT).filter(([, d]) => d.manual).map(([nom]) => nom).sort())
      .toEqual(['contacte.correu', 'contacte.mitjaNotificacio', 'contacte.telefon']);
  });

  test('validaCamp i validaSegons: un camp o un tipus desconegut no validen res', () => {
    expect(validaCamp('identificacio.nif', dni(4242)).valid).toBe(true);
    expect(validaCamp('identificacio.nom', dni(4242)).valid).toBe(false);
    expect(validaCamp('banc.iban', 'x').valid).toBe(false);
    expect(validaSegons('desconegut', 'x').valid).toBe(false);
    expect(validaSegons('toString', 'x').valid).toBe(false);
  });

  test('els organismes són els mateixos que els del document custodiat', () => {
    expect([...ORGANISMES]).toEqual([...ORGANISMES_DOCUMENT]);
  });

  test('cada validador és idempotent sobre el seu normalitzat (la fitxa guarda el normalitzat i el torna a validar)', () => {
    const mostres = {
      'nif-persona': ` ${dni(4242).toLowerCase()} `, 'nif-entitat': cif('G', '7654321'), naf: `03/${naf(3, 12345678).slice(2, 10)}/${naf(3, 12345678).slice(10)}`,
      'referencia-cadastral': rc('1234567', 'VH5797', 'S', '0001').toLowerCase(), 'codi-postal': ' 03837 ', 'codi-ine': '03128',
      provincia: 'Alacant/Alicante', pais: 'ES', data: '15/03/1975', telefon: ['+34 ', '612 345 678'].join(''), correu: 'A@B.CAT',
      'mitja-notificacio': 'postal', cnae: '62.01', 'epigraf-iae': ' 751.1 ', 'ref-suma': '0312-3456-78', 'nom-propi': '  Rosa   Maria ',
      'nom-lloc': 'La Torre de les Maçanes', via: 'Carrer 9 d’Octubre', 'numero-via': 's / n', complement: '2º B',
      adreca: 'Carrer Major, 5', denominacio: 'Associació La Sénia', text: 'Programació informàtica', 'numero-inscripcio': 'cv-01-012345-a',
      seccio: '1a', import: 95000, regim: 'RETA', 'concepte-tribut': 'IVTM', carrec: 'vocal', 'tipus-representacio': 'voluntaria', organisme: 'SUMA'
    };
    expect(Object.keys(mostres).sort()).toEqual(Object.keys(VALIDADORS).sort());
    for (const [tipus, mostra] of Object.entries(mostres)) {
      const primer = validaSegons(tipus, mostra);
      expect(primer.valid, tipus).toBe(true);
      expect(validaSegons(tipus, primer.normalitzat).normalitzat, tipus).toEqual(primer.normalitzat);
    }
  });

  test('tots els resultats van congelats', () => {
    expect(Object.isFrozen(validaNaf(naf(3, 1)))).toBe(true);
    expect(Object.isFrozen(validaNomPropi('x'))).toBe(true);
  });
});
