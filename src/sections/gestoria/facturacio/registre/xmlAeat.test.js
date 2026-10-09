// @vitest-environment jsdom
/* L'XML de prova dels registres (Onada 6, 261009). Les factures s'emeten de
   veres amb el cas d'ús d'emissió sobre un port en memòria; l'XML es torna a
   llegir amb DOMParser: ben format, amb els espais de noms de l'AEAT, l'ordre
   dels elements de RegistroAlta i RegistroAnulacion, els valors en format de
   l'AEAT, l'encadenament i, sobretot, la Huella de cada registre es torna a
   calcular des dels camps de l'XML i coincidix. Sense el bloc
   SistemaInformatico és de prova (complet: false) i ho diu. Cap dada real: el
   NIF de l'empresa és el sintètic de les proves i el del client es compon a
   trossos. */
import { webcrypto } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { ESQUEMA_CONFIG_EMPRESA } from '../configEmpresa.js';
import { creaEmissio } from '../emissio.js';
import { registraAnulacio } from './cadena.js';
import { calculaEmpremta, cadenaAlta, cadenaAnulacio } from './empremta.js';
import { creaPortMemoria } from './port.js';
import { ESPAIS_DE_NOMS, MAX_REGISTRES, xmlDeRegistres } from './xmlAeat.js';

const subtle = webcrypto.subtle;
const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const ARA = Date.UTC(2026, 9, 9, 10, 0, 0);
const CONFIG = Object.freeze({
  esquema: ESQUEMA_CONFIG_EMPRESA, nif: CIF_EMISSOR, nom: 'Forn & Coca del Poble SL',
  domicilis: [{ id: 'fiscal', adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' }],
  domiciliFiscal: 'fiscal', facturacio: { dataPas: '2026-10-01' }
});
const CLIENT = Object.freeze({ nif: DNI_CLIENT, nom: 'Bar <la Plaça>', domicili: { adreca: 'Carrer Major, 2', codiPostal: '46998', poblacio: 'Poble de Prova' } });
const OBLIGAT = Object.freeze({ nom: CONFIG.nom, nif: CIF_EMISSOR });

async function llibre() {
  const port = creaPortMemoria({ subtle });
  const cas = creaEmissio({ port, config: CONFIG, llegat: [], subtle });
  const emet = (dades) => cas.emet({ dataExpedicio: '2026-10-08', ...dades }, { instant: ARA });
  await emet({ tipus: 'F1', destinatari: CLIENT, dataOperacio: '2026-10-05', descripcio: 'Venda al bar', linies: [
    { concepte: 'Pa', quantitat: 2, preuUnitari: 250, tipusIva: 4 }, { concepte: 'Classe', quantitat: 1, preuUnitari: 3000, exempcio: 'E1' }
  ] });
  await emet({ tipus: 'F2', ivaInclos: true, descripcio: 'Tiquet de barra', linies: [{ concepte: 'Cafè', quantitat: 3, preuUnitari: 110, tipusIva: 10 }] });
  await registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: 'T2026-0001', dataExpedicio: '2026-10-08', instant: ARA, subtle });
  await emet({
    tipus: 'R1', tipusRectificativa: 'S', rectificades: [{ numSerie: 'A2026-0001', dataExpedicio: '2026-10-08' }], descripcio: 'Correcció del preu',
    importRectificat: { base: 3500, quota: 20 }, destinatari: CLIENT, linies: [{ concepte: 'Pa', quantitat: 2, preuUnitari: 240, tipusIva: 4 }]
  });
  return port.llig();
}

const NS1 = ESPAIS_DE_NOMS.sum1;
const fills = (node) => [...node.children].map((c) => c.localName);
const valor = (node, nom) => node.getElementsByTagNameNS(NS1, nom)[0]?.textContent ?? null;

function llegix(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
  return doc;
}

describe('l’XML de prova de la remissió', () => {
  test('ben format, amb la capçalera, un RegistroFactura per registre i els espais de noms de l’AEAT', async () => {
    const registres = await llibre();
    const { xml, registres: quants, complet, pendents } = xmlDeRegistres(registres, { obligat: OBLIGAT });
    expect([quants, complet, pendents]).toEqual([4, false, ['SistemaInformatico']]);
    const doc = llegix(xml);
    const arrel = doc.documentElement;
    expect([arrel.localName, arrel.namespaceURI]).toEqual(['RegFactuSistemaFacturacion', ESPAIS_DE_NOMS.sum]);
    expect(fills(arrel)).toEqual(['Cabecera', 'RegistroFactura', 'RegistroFactura', 'RegistroFactura', 'RegistroFactura']);
    const cabecera = arrel.children[0];
    expect([valor(cabecera, 'NombreRazon'), valor(cabecera, 'NIF')]).toEqual(['Forn & Coca del Poble SL', CIF_EMISSOR]);
    expect(xml).toContain('Forn &amp; Coca del Poble SL');
    expect([...arrel.children].slice(1).map((rf) => rf.children[0].localName)).toEqual(['RegistroAlta', 'RegistroAlta', 'RegistroAnulacion', 'RegistroAlta']);
    // De prova: el lloc del SistemaInformatico porta el perquè, i no hi ha cap element inventat.
    expect(xml).toMatch(/<!-- PENDENT: SistemaInformatico/);
    expect(doc.getElementsByTagNameNS(NS1, 'SistemaInformatico')).toHaveLength(0);
    // Les línies de la factura no hi van.
    expect(xml).not.toMatch(/Classe|Cafè|>Pa</);
  });

  test('RegistroAlta: l’ordre de l’esquema, els valors en format de l’AEAT, l’exempció, la rectificativa i l’encadenament', async () => {
    const registres = await llibre();
    const doc = llegix(xmlDeRegistres(registres, { obligat: OBLIGAT }).xml);
    const [f1, f2, , r1] = [...doc.getElementsByTagNameNS(ESPAIS_DE_NOMS.sum, 'RegistroFactura')].map((rf) => rf.children[0]);
    expect(fills(f1)).toEqual(['IDVersion', 'IDFactura', 'NombreRazonEmisor', 'TipoFactura', 'FechaOperacion', 'DescripcionOperacion', 'Destinatarios',
      'Desglose', 'CuotaTotal', 'ImporteTotal', 'Encadenamiento', 'FechaHoraHusoGenRegistro', 'TipoHuella', 'Huella']);
    expect(fills(f1.children[1])).toEqual(['IDEmisorFactura', 'NumSerieFactura', 'FechaExpedicionFactura']);
    expect([valor(f1, 'NumSerieFactura'), valor(f1, 'FechaExpedicionFactura'), valor(f1, 'FechaOperacion'), valor(f1, 'TipoFactura')])
      .toEqual(['A2026-0001', '08-10-2026', '05-10-2026', 'F1']);
    expect([valor(f1, 'NombreRazon'), valor(f1, 'NIF')]).toEqual(['Bar <la Plaça>', DNI_CLIENT]);
    const detalls = [...f1.getElementsByTagNameNS(NS1, 'DetalleDesglose')];
    expect(detalls.map(fills)).toEqual([
      ['Impuesto', 'ClaveRegimen', 'CalificacionOperacion', 'TipoImpositivo', 'BaseImponibleOimporteNoSujeto', 'CuotaRepercutida'],
      ['Impuesto', 'ClaveRegimen', 'OperacionExenta', 'BaseImponibleOimporteNoSujeto']
    ]);
    expect(detalls.map((d) => [...d.children].map((c) => c.textContent))).toEqual([
      ['01', '01', 'S1', '4.00', '5.00', '0.20'],
      ['01', '01', 'E1', '30.00']
    ]);
    expect([valor(f1, 'CuotaTotal'), valor(f1, 'ImporteTotal'), valor(f1, 'TipoHuella')]).toEqual(['0.20', '35.20', '01']);
    expect(fills(f1.getElementsByTagNameNS(NS1, 'Encadenamiento')[0])).toEqual(['PrimerRegistro']);
    // La simplificada: sense destinataris, encadenada a la primera.
    expect(f2.getElementsByTagNameNS(NS1, 'Destinatarios')).toHaveLength(0);
    const anterior = f2.getElementsByTagNameNS(NS1, 'RegistroAnterior')[0];
    expect(fills(anterior)).toEqual(['IDEmisorFactura', 'NumSerieFactura', 'FechaExpedicionFactura', 'Huella']);
    expect(valor(anterior, 'Huella')).toBe(registres[0].empremta);
    // La rectificativa per substitució.
    expect(fills(r1).slice(3, 8)).toEqual(['TipoFactura', 'TipoRectificativa', 'FacturasRectificadas', 'ImporteRectificacion', 'DescripcionOperacion']);
    expect([valor(r1, 'TipoRectificativa'), valor(r1.getElementsByTagNameNS(NS1, 'IDFacturaRectificada')[0], 'NumSerieFactura'),
      valor(r1, 'BaseRectificada'), valor(r1, 'CuotaRectificada')]).toEqual(['S', 'A2026-0001', '35.00', '0.20']);
  });

  test('RegistroAnulacion, i la Huella de cada registre es torna a calcular des de l’XML', async () => {
    const registres = await llibre();
    const doc = llegix(xmlDeRegistres(registres, { obligat: OBLIGAT }).xml);
    const nodes = [...doc.getElementsByTagNameNS(ESPAIS_DE_NOMS.sum, 'RegistroFactura')].map((rf) => rf.children[0]);
    expect(fills(nodes[2])).toEqual(['IDVersion', 'IDFactura', 'Encadenamiento', 'FechaHoraHusoGenRegistro', 'TipoHuella', 'Huella']);
    expect(fills(nodes[2].children[1])).toEqual(['IDEmisorFacturaAnulada', 'NumSerieFacturaAnulada', 'FechaExpedicionFacturaAnulada']);
    for (const [i, node] of nodes.entries()) {
      const anterior = node.getElementsByTagNameNS(NS1, 'RegistroAnterior')[0];
      const comuns = { empremtaAnterior: anterior ? valor(anterior, 'Huella') : '', dataHoraHusGeneracio: valor(node, 'FechaHoraHusoGenRegistro') };
      const cadena = node.localName === 'RegistroAlta'
        ? cadenaAlta({
          ...comuns, idEmisor: valor(node, 'IDEmisorFactura'), numSerie: valor(node, 'NumSerieFactura'), dataExpedicio: valor(node, 'FechaExpedicionFactura'),
          tipusFactura: valor(node, 'TipoFactura'), quotaTotal: valor(node, 'CuotaTotal'), importTotal: valor(node, 'ImporteTotal')
        })
        : cadenaAnulacio({
          ...comuns, idEmisor: valor(node, 'IDEmisorFacturaAnulada'), numSerie: valor(node, 'NumSerieFacturaAnulada'),
          dataExpedicio: valor(node, 'FechaExpedicionFacturaAnulada')
        });
      // La Huella pròpia és l'últim fill (la del RegistroAnterior va abans, dins de l'encadenament).
      const huella = node.lastElementChild;
      expect(huella.localName).toBe('Huella');
      expect(await calculaEmpremta(cadena, subtle), `registre ${i + 1}`).toBe(huella.textContent);
      expect(huella.textContent).toBe(registres[i].empremta);
    }
  });

  test('amb les dades del sistema, el bloc va al seu lloc i l’XML ja no és de prova per això', async () => {
    const registres = await llibre();
    const sistema = {
      nom: 'Productor de proves', nif: CIF_EMISSOR, nomSistema: 'Sistema de proves', idSistema: 'ZZ', versio: '0.0.1',
      numeroInstalacio: '1', nomesVerifactu: 'S', multiOT: 'N', indicadorMultiplesOT: 'N'
    };
    const { xml, complet, pendents } = xmlDeRegistres(registres, { obligat: OBLIGAT, sistema });
    expect([complet, pendents]).toEqual([true, []]);
    const alta = llegix(xml).getElementsByTagNameNS(NS1, 'RegistroAlta')[0];
    expect(fills(alta).slice(-5)).toEqual(['Encadenamiento', 'SistemaInformatico', 'FechaHoraHusoGenRegistro', 'TipoHuella', 'Huella']);
    expect(fills(alta.getElementsByTagNameNS(NS1, 'SistemaInformatico')[0])).toEqual(['NombreRazon', 'NIF', 'NombreSistemaInformatico',
      'IdSistemaInformatico', 'Version', 'NumeroInstalacion', 'TipoUsoPosibleSoloVerifactu', 'TipoUsoPosibleMultiOT', 'IndicadorMultiplesOT']);
  });

  test('el que no es pot posar a l’XML: XML_INVALID i XML_MASSA_REGISTRES', async () => {
    const registres = await llibre();
    expect(() => xmlDeRegistres([], { obligat: OBLIGAT })).toThrow(expect.objectContaining({ codi: 'XML_INVALID' }));
    expect(() => xmlDeRegistres(registres, { obligat: { nom: 'Altra', nif: DNI_CLIENT } })).toThrow(expect.objectContaining({ codi: 'XML_INVALID' }));
    expect(() => xmlDeRegistres(registres, {})).toThrow(expect.objectContaining({ codi: 'XML_INVALID' }));
    expect(() => xmlDeRegistres([{ idEmisor: CIF_EMISSOR, tipusRegistre: 'esborrat' }], { obligat: OBLIGAT })).toThrow(expect.objectContaining({ codi: 'XML_INVALID' }));
    expect(() => xmlDeRegistres(new Array(MAX_REGISTRES + 1).fill(registres[0]), { obligat: OBLIGAT }))
      .toThrow(expect.objectContaining({ codi: 'XML_MASSA_REGISTRES' }));
  });
});
