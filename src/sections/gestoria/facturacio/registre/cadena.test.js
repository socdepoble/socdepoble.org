// @vitest-environment node
/* La cadena: afegir sense bifurcar i verificar-la sencera. Cada falsificació
   es fa sobre una còpia oberta d'un registre bo, com la faria qui toca el
   llibre a mà. El NIF del client es compon a trossos perquè la porta de
   qualitat no hi veja un literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { creaFacturaEmesa } from '../facturaEmesa.js';
import { INCIDENCIES, afegixALaCadena, registraAlta, registraAnulacio, verificaCadena } from './cadena.js';
import { empremtaDeRegistre } from './empremta.js';
import { creaPortMemoria } from './port.js';
import { creaRegistreAlta } from './registreAlta.js';
import { creaRegistreAnulacio } from './registreAnulacio.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const MIGDIA = Date.UTC(2026, 9, 4, 10, 0, 0);
/* Un domicili sintètic: cap adreça real. */
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });

function factura(numero, { emissor = CIF_EMISSOR, destinatari = DNI_CLIENT, preu = 1000 } = {}) {
  return creaFacturaEmesa({
    tipus: 'F1',
    numSerie: `A2026-${String(numero).padStart(4, '0')}`,
    dataExpedicio: '2026-10-04',
    emissor: { nif: emissor, nom: 'Emissor', domicili: DOMICILI },
    destinatari: { nif: destinatari, nom: 'Client', domicili: DOMICILI },
    descripcio: 'Servici',
    linies: [{ concepte: 'Servici', quantitat: 1, preuUnitari: preu, tipusIva: 21 }]
  });
}

/* Un llibre de n altes seguides, d'un segon en un segon. */
async function llibre(n) {
  const port = creaPortMemoria();
  for (let i = 1; i <= n; i += 1) await registraAlta(port, factura(i), { instant: MIGDIA + i * 1000 });
  return { port, registres: [...(await port.llig())] };
}

const obert = (valor) => JSON.parse(JSON.stringify(valor));
const codis = (informe) => informe.incidencies.map((i) => `${i.codi}@${i.posicio}`);

describe('una cadena bona', () => {
  test('altes i una anul·lació, verificades sense cap incidència', async () => {
    const { port } = await llibre(3);
    await registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0002', dataExpedicio: '2026-10-04', motiu: 'Duplicada', instant: MIGDIA + 9000 });
    const registres = await port.llig();
    expect(registres.map((r) => `${r.ordre}:${r.tipusRegistre}`)).toEqual(['1:alta', '2:alta', '3:alta', '4:anulacio']);
    const informe = await verificaCadena(registres);
    expect(informe).toEqual({
      valida: true, registres: 4, incidencies: [],
      cadenes: [{ idEmisor: CIF_EMISSOR, registres: 4, ultim: { ordre: 4, empremta: registres[3].empremta } }]
    });
  });

  test('dos emissors barrejats al llibre: cada un amb la seua cadena', async () => {
    const port = creaPortMemoria();
    await registraAlta(port, factura(1), { instant: MIGDIA });
    await registraAlta(port, factura(1, { emissor: DNI_CLIENT, destinatari: CIF_EMISSOR }), { instant: MIGDIA + 1000 });
    await registraAlta(port, factura(2), { instant: MIGDIA + 2000 });
    const registres = [...(await port.llig())];
    // En l'ordre en què es van escriure, no el del llibre: la verificació separa per emissor.
    const barrejats = [registres[0], registres[2], registres[1]].sort((a, b) => a.dataHoraHusGeneracio.localeCompare(b.dataHoraHusGeneracio));
    const informe = await verificaCadena(barrejats);
    expect(informe.valida).toBe(true);
    expect(informe.cadenes.map((c) => [c.idEmisor, c.registres])).toEqual([[CIF_EMISSOR, 2], [DNI_CLIENT, 1]]);
  });

  test('una verificació parcial, a partir del registre d’abans', async () => {
    const { port, registres } = await llibre(4);
    const finestra = await port.llig({ idEmisor: CIF_EMISSOR, des: 3 });
    expect((await verificaCadena(finestra, { anterior: registres[1] })).valida).toBe(true);
    // Sense dir-li d'on ve, la finestra és una cadena a la qual falta el principi.
    const senseAnterior = await verificaCadena(finestra);
    expect(senseAnterior.valida).toBe(false);
    expect(codis(senseAnterior)[0]).toBe('TRENCAMENT@0');
  });
});

/* Un registre amb una altra factura, coherent i completa (un altre preu), i els
   totals del registre al dia: el que faria qui retoca el llibre amb trellat. */
function ambUnaAltraFactura(registre, altra) {
  return { ...obert(registre), factura: obert(altra), quotaTotal: altra.quotaTotal, importTotal: altra.importTotal };
}

describe('el que detecta', () => {
  test('un registre alterat: l’empremta ja no correspon als camps', async () => {
    const { registres } = await llibre(3);
    const alterat = ambUnaAltraFactura(registres[1], factura(2, { preu: 1100 }));
    const informe = await verificaCadena([registres[0], alterat, registres[2]]);
    expect(informe.valida).toBe(false);
    expect(codis(informe)).toEqual(['EMPREMTA_ALTERADA@1']);
    // També l'hora de generació: no és a cap altre camp, però sí a l'empremta.
    const rellotge = { ...obert(registres[1]), dataHoraHusGeneracio: '2026-10-04T12:00:03+02:00' };
    expect(codis(await verificaCadena([registres[0], rellotge, registres[2]]))).toEqual(['EMPREMTA_ALTERADA@1']);
  });

  test('un registre alterat i amb l’empremta refeta: es trenca l’enllaç del següent', async () => {
    const { registres } = await llibre(3);
    const alterat = ambUnaAltraFactura(registres[1], factura(2, { preu: 1100 }));
    alterat.empremta = await empremtaDeRegistre(alterat);
    expect(codis(await verificaCadena([registres[0], alterat, registres[2]]))).toEqual(['TRENCAMENT@2']);
  });

  test('la factura retocada dins del registre (preu, destinatari, camps de més), amb l’empremta intacta: registre invàlid', async () => {
    const { registres } = await llibre(2);
    const retocs = [
      (r) => { r.factura.linies[0].preuUnitari = 1; },
      (r) => { r.factura.destinatari = null; },
      (r) => { r.factura.nota = 'afegida a mà'; },
      (r) => { r.factura.linies = 'cap'; }
    ];
    for (const retoca of retocs) {
      const alterat = obert(registres[1]);
      retoca(alterat);
      expect(codis(await verificaCadena([registres[0], alterat])), String(retoca)).toEqual(['REGISTRE_INVALID@1']);
    }
  });

  test('el límit escrit: un text retocat amb coherència (el nom del client) no el veu ni l’empremta ni el recàlcul', async () => {
    // Protegir el text demana la remissió a l'AEAT o la signatura XAdES (PENDENT, fase 3): cadena.js ho diu.
    const { registres } = await llibre(2);
    const alterat = obert(registres[1]);
    alterat.factura.destinatari.nom = 'Un altre client';
    expect((await verificaCadena([registres[0], alterat])).valida).toBe(true);
  });

  test('un registre esborrat del mig: trencament', async () => {
    const { registres } = await llibre(4);
    expect(codis(await verificaCadena([registres[0], registres[1], registres[3]]))).toEqual(['TRENCAMENT@2']);
  });

  test('dos registres intercanviats: reordenació', async () => {
    const { registres } = await llibre(4);
    const informe = await verificaCadena([registres[0], registres[2], registres[1], registres[3]]);
    expect(informe.valida).toBe(false);
    expect(informe.incidencies.filter((i) => i.greu).map((i) => `${i.codi}@${i.posicio}`)).toEqual(['REORDENACIO@1', 'REORDENACIO@2', 'REORDENACIO@3']);
    // L'hora del segon desordenat va arrere respecte del que el precedix: avís, a més.
    expect(informe.incidencies.filter((i) => !i.greu).map((i) => i.codi)).toEqual(['RELLOTGE_ENRERE']);
  });

  test('el número d’ordre canviat a mà (no entra a l’empremta): reordenació', async () => {
    const { registres } = await llibre(3);
    expect(codis(await verificaCadena([registres[0], registres[1], { ...obert(registres[2]), ordre: 7 }]))).toEqual(['REORDENACIO@2']);
  });

  test('dos registres darrere del mateix anterior: bifurcació', async () => {
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const [a, b] = await Promise.all([
      creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA + 1000 }),
      creaRegistreAlta({ factura: factura(3), anterior: primer, instant: MIGDIA + 1000 })
    ]);
    const informe = await verificaCadena([primer, a, b]);
    expect(informe.valida).toBe(false);
    expect(codis(informe)).toEqual(['BIFURCACIO@1', 'BIFURCACIO@2']);
  });

  test('dos primers registres: bifurcació', async () => {
    const [a, b] = await Promise.all([1, 2].map((n) => creaRegistreAlta({ factura: factura(n), instant: MIGDIA })));
    expect(codis(await verificaCadena([a, b]))).toEqual(['BIFURCACIO@0', 'BIFURCACIO@1']);
  });

  test('la mateixa factura donada d’alta dues vegades: duplicat', async () => {
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const repetit = await creaRegistreAlta({ factura: factura(1), anterior: primer, instant: MIGDIA + 1000 });
    expect(codis(await verificaCadena([primer, repetit]))).toEqual(['DUPLICAT@1']);
  });

  test('una anul·lació d’una factura que no té alta al llibre', async () => {
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const absent = await creaRegistreAlta({ factura: factura(9), instant: MIGDIA });
    const anul = await creaRegistreAnulacio({ alta: absent, anterior: primer, instant: MIGDIA + 1000 });
    expect(codis(await verificaCadena([primer, anul]))).toEqual(['ANULACIO_SENSE_ALTA@1']);
  });

  test('un rellotge que va arrere és un avís, no invalida la cadena', async () => {
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const segon = await creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA - 60000 });
    const informe = await verificaCadena([primer, segon]);
    expect(informe.valida).toBe(true);
    expect(informe.incidencies).toEqual([expect.objectContaining({ codi: 'RELLOTGE_ENRERE', greu: false, posicio: 1 })]);
  });

  test('un truncament respecte de l’últim registre conegut', async () => {
    const { registres } = await llibre(3);
    const conegut = { idEmisor: CIF_EMISSOR, ordre: 3, empremta: registres[2].empremta };
    expect((await verificaCadena(registres, { ultimsConeguts: [conegut] })).valida).toBe(true);
    expect(codis(await verificaCadena(registres.slice(0, 2), { ultimsConeguts: [conegut] }))).toEqual(['TRUNCAMENT@null']);
  });

  test('entrades que no són registres', async () => {
    const informe = await verificaCadena([null, {}, 'text']);
    expect(codis(informe)).toEqual(['REGISTRE_INVALID@0', 'REGISTRE_INVALID@1', 'REGISTRE_INVALID@2']);
    await expect(verificaCadena('no')).rejects.toThrow(TypeError);
  });

  test('el pes de cada incidència', () => {
    expect(Object.entries(INCIDENCIES).filter(([, pes]) => pes === 'avis').map(([codi]) => codi)).toEqual(['RELLOTGE_ENRERE']);
  });
});

describe('afegir sense bifurcar', () => {
  test('cinc emissions alhora al mateix port: una darrere de l’altra, sense cap bifurcació', async () => {
    const port = creaPortMemoria();
    await Promise.all([1, 2, 3, 4, 5].map((n) => registraAlta(port, factura(n), { instant: MIGDIA + n })));
    const registres = await port.llig();
    expect(registres.map((r) => r.ordre)).toEqual([1, 2, 3, 4, 5]);
    expect((await verificaCadena(registres)).valida).toBe(true);
  });

  test('sense la secció d’un sol escriptor, el port refusa el segon registre generat amb el mateix anterior', async () => {
    const port = creaPortMemoria();
    const senseSeccio = { afegix: port.afegix, ultim: port.ultim, llig: port.llig, exporta: port.exporta };
    const resultats = await Promise.allSettled([1, 2].map((n) => registraAlta(senseSeccio, factura(n), { instant: MIGDIA })));
    expect(resultats.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected']);
    expect(resultats.find((r) => r.status === 'rejected').reason.codi).toBe('CADENA_CANVIADA');
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });

  test('un registre construït per a un altre emissor no entra', async () => {
    const port = creaPortMemoria();
    const construeix = () => creaRegistreAlta({ factura: factura(1, { emissor: DNI_CLIENT, destinatari: CIF_EMISSOR }), instant: MIGDIA });
    await expect(afegixALaCadena(port, { idEmisor: CIF_EMISSOR, construeix })).rejects.toMatchObject({ codi: 'CADENA_ALIENA' });
    await expect(afegixALaCadena(port, { idEmisor: CIF_EMISSOR })).rejects.toThrow(TypeError);
  });

  test('anul·lar una factura que no és al llibre, o dues vegades', async () => {
    const { port } = await llibre(1);
    const dades = { idEmisor: CIF_EMISSOR, dataExpedicio: '2026-10-04', instant: MIGDIA + 5000 };
    await expect(registraAnulacio(port, { ...dades, numSerie: 'A2026-0009' })).rejects.toMatchObject({ codi: 'FACTURA_INEXISTENT' });
    await registraAnulacio(port, { ...dades, numSerie: 'A2026-0001' });
    await expect(registraAnulacio(port, { ...dades, numSerie: 'A2026-0001' })).rejects.toMatchObject({ codi: 'DUPLICAT' });
  });
});
