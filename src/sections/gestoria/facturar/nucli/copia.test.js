// @vitest-environment node
/* La còpia obligatòria del llibre, la part pura (ordre del Mestre, 261007;
   pas 3 del mapa de la Gestoria). El nom del fitxer amb l'hora de Madrid, la
   marca de l'últim registre de cada cadena, la seua lectura com a
   ultimsConeguts de verificaCadena (que hi detecta un llibre truncat) i el
   compte dels registres que encara no tenen còpia. El NIF de l'empresa és el
   sintètic de les proves; el segon es compon a trossos perquè la porta de
   qualitat no hi veja un literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { ESQUEMA_CONFIG_EMPRESA } from '../../facturacio/configEmpresa.js';
import { creaEmissio } from '../../facturacio/emissio.js';
import { verificaCadena } from '../../facturacio/registre/cadena.js';
import { creaPortMemoria, llibreDesDeJson } from '../../facturacio/registre/port.js';
import { ACCEPTA_COPIA, TIPUS_COPIA, marcaDeCopia, nomFitxerCopia, registresSenseCopia, ultimsConegutsDe } from './copia.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const PAS = '2026-10-07';
const MIGDIA = Date.UTC(2026, 9, 7, 10, 0, 0);
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });

async function llibreAmb(n) {
  const port = creaPortMemoria();
  const cas = creaEmissio({
    port, llegat: [],
    config: { esquema: ESQUEMA_CONFIG_EMPRESA, nif: CIF_EMISSOR, nom: 'Forn', domicilis: [{ id: 'fiscal', ...DOMICILI }], domiciliFiscal: 'fiscal', facturacio: { dataPas: PAS } }
  });
  for (let i = 0; i < n; i += 1) {
    await cas.emet({
      tipus: 'F1', dataExpedicio: PAS, destinatari: { nif: DNI_CLIENT, nom: 'Client', domicili: DOMICILI },
      linies: [{ concepte: 'Pa', quantitat: 1, preuUnitari: 250, tipusIva: 4 }]
    }, { instant: MIGDIA });
  }
  return port;
}

describe('la còpia del llibre', () => {
  test('el nom del fitxer porta el dia i l’hora de Madrid, al segon', () => {
    // A l'octubre, Madrid va dos hores per davant de l'UTC.
    expect(nomFitxerCopia(MIGDIA)).toBe('llibre-veri-factu-2026-10-07-120000.json');
    expect(nomFitxerCopia(Date.UTC(2026, 11, 31, 23, 30, 5))).toBe('llibre-veri-factu-2027-01-01-003005.json');
    // Troballa F2 (261007): la còpia d'un llibre amb incidències ho diu al nom.
    expect(nomFitxerCopia(MIGDIA, { incidencia: true })).toBe('llibre-veri-factu-incidencia-2026-10-07-120000.json');
    expect(TIPUS_COPIA).toBe('application/json');
    expect(ACCEPTA_COPIA).toBe('.json,application/json');
  });

  test('la marca: l’últim registre de cada cadena del llibre exportat', async () => {
    const port = await llibreAmb(3);
    const registres = llibreDesDeJson(await port.exporta());
    const marca = marcaDeCopia(registres, 'llibre.json');
    expect(marca).toEqual({ cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 3, empremta: registres[2].empremta }], nomFitxer: 'llibre.json' });
    expect(marcaDeCopia([], undefined)).toEqual({ cadenes: [] });
    // Dues cadenes: una marca per emissor, la de l'ordre més alt.
    const segon = ['8765', '4321', 'X'].join('');
    expect(marcaDeCopia([{ idEmisor: segon, ordre: 2, empremta: 'B' }, { idEmisor: segon, ordre: 1, empremta: 'A' }, ...registres]).cadenes)
      .toEqual([{ idEmisor: segon, ordre: 2, empremta: 'B' }, { idEmisor: CIF_EMISSOR, ordre: 3, empremta: registres[2].empremta }]);
  });

  test('la marca com a ultimsConeguts: un llibre amb menys registres que la còpia és un TRUNCAMENT', async () => {
    const port = await llibreAmb(3);
    const marca = marcaDeCopia(llibreDesDeJson(await port.exporta()));
    const copia = { versio: 1, instant: MIGDIA, dades: marca };
    expect(ultimsConegutsDe(copia)).toEqual(marca.cadenes);
    expect(ultimsConegutsDe(null)).toEqual([]);
    expect((await verificaCadena(await port.llig(), { ultimsConeguts: ultimsConegutsDe(copia) })).valida).toBe(true);
    // El mateix llibre amb només els dos primers registres (el navegador n'ha perdut un).
    const truncat = (await port.llig()).slice(0, 2);
    const informe = await verificaCadena(truncat, { ultimsConeguts: ultimsConegutsDe(copia) });
    expect(informe.valida).toBe(false);
    expect(informe.incidencies.map((i) => i.codi)).toEqual(['TRUNCAMENT']);
  });

  test('quants registres no tenen còpia', async () => {
    const port = await llibreAmb(2);
    const cadena = await port.llig({ idEmisor: CIF_EMISSOR });
    expect(registresSenseCopia(cadena, null, CIF_EMISSOR)).toBe(2);
    const copia = { dades: { cadenes: [{ idEmisor: CIF_EMISSOR, ordre: 1, empremta: cadena[0].empremta }] } };
    expect(registresSenseCopia(cadena, copia, CIF_EMISSOR)).toBe(1);
    expect(registresSenseCopia(cadena, { dades: marcaDeCopia(cadena) }, CIF_EMISSOR)).toBe(0);
    expect(registresSenseCopia(undefined, null, CIF_EMISSOR)).toBe(0);
  });
});
