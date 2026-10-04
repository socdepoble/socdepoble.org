// @vitest-environment node
/* La configuració de l'empresa: només l'esquema i la validació. Cap valor
   real: el NIF és el sintètic de les proves, el del client es compon a
   trossos, i l'IBAN es compon ací (un compte de zeros i les xifres de control
   calculades amb BigInt), mai escrit sencer. */
import { describe, expect, test } from 'vitest';
import {
  ESQUEMA_CONFIG_EMPRESA, compteDe, emissorDe, llegixConfigEmpresa, normalitzaIban, validaConfigEmpresa
} from './configEmpresa.js';
import { creaFacturaEmesa } from './facturaEmesa.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');

/* Un IBAN espanyol sintètic: «ES», les xifres de control (98 menys el mòdul 97
   del compte seguit de E=14, S=28 i «00») i un compte de zeros acabat en u. */
function ibanSintetic(compte = `${'0'.repeat(19)}1`) {
  const resta = BigInt(`${compte}142800`) % 97n;
  return ['E', 'S', String(98n - resta).padStart(2, '0'), compte].join('');
}

function config(canvis = {}) {
  return {
    esquema: ESQUEMA_CONFIG_EMPRESA,
    nif: CIF_EMISSOR,
    nom: 'Forn del Poble SL',
    nomComercial: 'El Forn',
    domicilis: [
      { id: 'fiscal', adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' },
      { id: 'obrador', adreca: 'Camí del Molí, 3', codiPostal: '46998', poblacio: 'Poble de Prova', provincia: 'València' }
    ],
    domiciliFiscal: 'fiscal',
    comptes: [{ id: 'compte-principal', iban: ibanSintetic(), titular: 'Forn del Poble SL' }],
    logo: 'logo-forn',
    facturacio: { dataPas: '2027-01-01', prefixos: { F1: 'A', F2: 'T' } },
    ...canvis
  };
}

describe('la configuració de l’empresa', () => {
  test('una configuració bona: neta, normalitzada i congelada', () => {
    expect(validaConfigEmpresa(config())).toEqual([]);
    const neta = llegixConfigEmpresa(config({ nif: ' b-1234567.4 ' }));
    expect(neta.nif).toBe(CIF_EMISSOR);
    expect(neta.facturacio).toEqual({ dataPas: '2027-01-01', prefixos: { F1: 'A', F2: 'T' } });
    expect(Object.isFrozen(neta.domicilis[1])).toBe(true);
    expect(validaConfigEmpresa(config({ comptes: undefined, logo: undefined, facturacio: undefined, nomComercial: undefined }))).toEqual([]);
  });

  test('l’IBAN: la forma i les xifres de control (mòdul 97)', () => {
    const bo = ibanSintetic();
    expect(normalitzaIban(bo)).toBe(bo);
    expect(normalitzaIban(bo.replace(/(.{4})/g, '$1 ').toLowerCase())).toBe(bo);
    const dolent = `${bo.slice(0, 2)}${String((Number(bo.slice(2, 4)) + 1) % 100).padStart(2, '0')}${bo.slice(4)}`;
    expect(normalitzaIban(dolent)).toBeNull();
    // L'espanyol fa 24 caràcters.
    expect(normalitzaIban(bo.slice(0, -1))).toBeNull();
    expect(normalitzaIban(null)).toBeNull();
    expect(validaConfigEmpresa(config({ comptes: [{ id: 'c1', iban: dolent }] })).join(' ')).toMatch(/IBAN no és vàlid/);
  });

  test('els camps: obligatoris, coneguts i ben formats', () => {
    const errors = (canvis) => validaConfigEmpresa(config(canvis)).join(' ');
    expect(errors({ nif: 'B12345675' })).toMatch(/NIF de l'empresa/);
    expect(errors({ nom: '' })).toMatch(/nom legal/);
    expect(errors({ domicilis: [] })).toMatch(/almenys un domicili/);
    expect(errors({ domiciliFiscal: 'cap' })).toMatch(/domiciliFiscal/);
    expect(errors({ domicilis: [config().domicilis[0], config().domicilis[0]] })).toMatch(/sense repetir/);
    expect(errors({ domicilis: [{ ...config().domicilis[0], codiPostal: '99001' }] })).toMatch(/codi postal del domicili 1/);
    expect(errors({ comptes: [{ id: ibanSintetic().toLowerCase(), iban: ibanSintetic() }] })).toMatch(/mai el número del compte/);
    expect(errors({ logo: 'Logo del Forn.png' })).toMatch(/logo/);
    expect(errors({ facturacio: { dataPas: '01/01/2027' } })).toMatch(/data de pas/);
    expect(errors({ facturacio: { prefixos: { F1: 'P' } } })).toMatch(/sèrie dels pressupostos/);
    expect(errors({ facturacio: { prefixos: { F9: 'A' } } })).toMatch(/tipus de factura desconegut «F9»/);
    expect(errors({ facturacio: { prefixos: { F1: 'a1' } } })).toMatch(/lletres majúscules/);
    expect(errors({ facturacio: { serie: 'F' } })).toMatch(/camp desconegut «serie»/);
    expect(errors({ secret: 'x' })).toMatch(/Camp desconegut: «secret»/);
    expect(validaConfigEmpresa(null)).toHaveLength(1);
    expect(() => llegixConfigEmpresa(config({ nom: '' }))).toThrow(expect.objectContaining({ codi: 'CONFIG_INVALIDA' }));
  });

  test('emissorDe: el domicili triat (per defecte, el fiscal); la factura en congela una còpia', () => {
    const c = config();
    expect(emissorDe(c)).toEqual({
      nif: CIF_EMISSOR, nom: 'Forn del Poble SL', nomComercial: 'El Forn',
      domicili: { adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' }
    });
    expect(emissorDe(c, { domicili: 'obrador' }).domicili).toEqual({
      adreca: 'Camí del Molí, 3', codiPostal: '46998', poblacio: 'Poble de Prova', provincia: 'València'
    });
    expect(() => emissorDe(c, { domicili: 'cap' })).toThrow(expect.objectContaining({ codi: 'DOMICILI_INEXISTENT' }));
    const factura = creaFacturaEmesa({
      tipus: 'F1', numSerie: 'A2027-0001', dataExpedicio: '2027-01-04', emissor: emissorDe(c),
      destinatari: { nif: DNI_CLIENT, nom: 'Bar', domicili: c.domicilis[1] },
      linies: [{ concepte: 'Pa', quantitat: 1, preuUnitari: 100, tipusIva: 4 }],
      cobrament: { metode: 'transferencia', compte: 'compte-principal' }
    });
    c.domicilis[0].adreca = 'Una altra adreça';
    expect(factura.emissor.domicili.adreca).toBe('Plaça del Poble, 1');
    // El domicili del destinatari no s'emporta l'id de la configuració.
    expect('id' in factura.destinatari.domicili).toBe(false);
    // La factura només porta la referència: el número del compte el resol compteDe, per a imprimir-lo.
    expect(JSON.stringify(factura)).not.toContain(ibanSintetic());
    expect(compteDe(config(), factura.cobrament.compte)).toEqual({ id: 'compte-principal', iban: ibanSintetic(), titular: 'Forn del Poble SL' });
    expect(() => compteDe(config(), 'cap')).toThrow(expect.objectContaining({ codi: 'COMPTE_INEXISTENT' }));
  });
});
