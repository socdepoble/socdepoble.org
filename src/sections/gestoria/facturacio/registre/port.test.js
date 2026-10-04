// @vitest-environment node
/* El contracte del llibre: només afegir. El port de memòria, la comprovació
   compartida d'afegit, l'exportació i la restauració d'una còpia. El NIF del
   client es compon a trossos perquè la porta de qualitat no hi veja un
   literal amb forma de DNI. */
import { describe, expect, test } from 'vitest';
import { creaFacturaEmesa } from '../facturaEmesa.js';
import { registraAlta, registraAnulacio, verificaCadena } from './cadena.js';
import {
  ESQUEMA_LLIBRE, METODES_OPCIONALS, METODES_PORT, METODES_VETATS, creaPortMemoria, llibreDesDeJson, restauraCopia, validaPort
} from './port.js';
import { creaRegistreAlta } from './registreAlta.js';
import { creaRegistreAnulacio } from './registreAnulacio.js';

const CIF_EMISSOR = 'B12345674';
const DNI_CLIENT = ['1234', '5678', 'Z'].join('');
const MIGDIA = Date.UTC(2026, 9, 4, 10, 0, 0);
/* Un domicili sintètic: cap adreça real. */
const DOMICILI = Object.freeze({ adreca: 'Plaça del Poble, 1', codiPostal: '46999', poblacio: 'Poble de Prova' });

function factura(numero, { emissor = CIF_EMISSOR, destinatari = DNI_CLIENT } = {}) {
  return creaFacturaEmesa({
    tipus: 'F1',
    numSerie: `A2026-${String(numero).padStart(4, '0')}`,
    dataExpedicio: '2026-10-04',
    emissor: { nif: emissor, nom: 'Emissor', domicili: DOMICILI },
    destinatari: { nif: destinatari, nom: 'Client', domicili: DOMICILI },
    descripcio: 'Servici',
    linies: [{ concepte: 'Servici', quantitat: 1, preuUnitari: 1000 * numero, tipusIva: 21 }]
  });
}

async function ple(n, port = creaPortMemoria(), { des = 1, instant = MIGDIA } = {}) {
  for (let i = des; i < des + n; i += 1) await registraAlta(port, factura(i), { instant: instant + i * 1000 });
  return port;
}

const verifica = (registres) => verificaCadena(registres);
const obert = (valor) => JSON.parse(JSON.stringify(valor));

describe('el contracte', () => {
  test('quatre mètodes obligatoris; cap que actualitze, esborre o buide', () => {
    expect(METODES_PORT).toEqual(['afegix', 'ultim', 'llig', 'exporta']);
    const bo = { afegix() {}, ultim() {}, llig() {}, exporta() {} };
    expect(validaPort(bo)).toBe(bo);
    expect(() => validaPort({ ...bo, ultim: undefined })).toThrow(expect.objectContaining({ codi: 'PORT_INVALID', detalls: ['ultim'] }));
    for (const vetat of ['esborra', 'actualitza', 'put', 'delete', 'clear', 'buida']) {
      expect(METODES_VETATS).toContain(vetat);
      expect(() => validaPort({ ...bo, [vetat]() {} }), vetat).toThrow(/només admet afegir/);
    }
    expect(() => validaPort({ ...bo, ambEscriptor: 'sí' })).toThrow(/ambEscriptor/);
    expect(() => validaPort(null)).toThrow(expect.objectContaining({ codi: 'PORT_INVALID' }));
  });

  test('una llista blanca: qualsevol altre mètode, es diga com es diga, fa refusar el port', () => {
    const bo = { afegix() {}, ultim() {}, llig() {}, exporta() {} };
    for (const inventat of ['reescriu', 'sobreescriu', 'trunca', 'purga', 'deleteAll', 'qualsevol']) {
      expect(() => validaPort({ ...bo, [inventat]() {} }), inventat).toThrow(expect.objectContaining({ codi: 'PORT_INVALID', detalls: [inventat] }));
    }
    // També els heretats d'una classe i les propietats calculades.
    class PortAmbClasse {
      afegix() {}
      ultim() {}
      llig() {}
      exporta() {}
      purga() {}
    }
    expect(() => validaPort(new PortAmbClasse())).toThrow(/sobren purga/);
    expect(() => validaPort(Object.defineProperty({ ...bo }, 'reescriu', { get: () => () => {} }))).toThrow(/sobren reescriu/);
    // Els opcionals i les dades que no són funcions sí que hi caben.
    // Ni un mètode amb clau Symbol, propi o heretat d'una classe: també és un mètode més.
    const reescriu = Symbol('reescriu');
    expect(() => validaPort({ ...bo, [reescriu]() {} })).toThrow(expect.objectContaining({ codi: 'PORT_INVALID', detalls: ['Symbol(reescriu)'] }));
    expect(() => validaPort(Object.defineProperty({ ...bo }, Symbol('trunca'), { get: () => () => {} }))).toThrow(/sobren Symbol\(trunca\)/);
    class PortAmbSymbol {
      afegix() {}
      ultim() {}
      llig() {}
      exporta() {}
      [Symbol.for('purga')]() {}
    }
    expect(() => validaPort(new PortAmbSymbol())).toThrow(/sobren Symbol\(purga\)/);
    // Una dada amb clau Symbol que no és funció no és cap mètode: hi cap.
    const ambMarca = { ...bo, [Symbol('marca')]: 'prova' };
    expect(validaPort(ambMarca)).toBe(ambMarca);
    expect(METODES_OPCIONALS).toEqual(['ambEscriptor', 'demanaPersistencia', 'tanca']);
    const ambOpcionals = { ...bo, ambEscriptor() {}, demanaPersistencia() {}, tanca() {}, tipus: 'prova', persistent: true };
    expect(validaPort(ambOpcionals)).toBe(ambOpcionals);
    expect(() => validaPort({ ...bo, tanca: 1 })).toThrow(/tanca, si hi és, ha de ser una funció/);
  });

  test('el port de memòria complix el contracte, és congelat i diu que no és persistent', () => {
    const port = creaPortMemoria();
    expect(validaPort(port)).toBe(port);
    expect(Object.isFrozen(port)).toBe(true);
    expect(port).toMatchObject({ tipus: 'memoria', persistent: false, coordinacio: 'pestanya' });
    expect(METODES_VETATS.filter((m) => m in port)).toEqual([]);
  });
});

describe('afegir, i res més', () => {
  test('afegix, ultim i llig: congelats i en l’ordre de la cadena', async () => {
    const port = await ple(3);
    const ultim = await port.ultim(CIF_EMISSOR);
    expect(ultim.ordre).toBe(3);
    expect(Object.isFrozen(ultim)).toBe(true);
    expect(await port.ultim(DNI_CLIENT)).toBeNull();
    const tots = await port.llig();
    expect(tots.map((r) => r.numSerie)).toEqual(['A2026-0001', 'A2026-0002', 'A2026-0003']);
    expect(Object.isFrozen(tots)).toBe(true);
    expect((await port.llig({ idEmisor: CIF_EMISSOR, des: 2 })).map((r) => r.ordre)).toEqual([2, 3]);
  });

  test('un registre que no va just darrere de l’últim no entra (CADENA_CANVIADA)', async () => {
    const port = creaPortMemoria();
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const segon = await creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA + 1000 });
    await expect(port.afegix(segon)).rejects.toMatchObject({ codi: 'CADENA_CANVIADA' });
    await port.afegix(primer);
    await expect(port.afegix(primer)).rejects.toMatchObject({ codi: 'CADENA_CANVIADA' });
    await port.afegix(segon);
    expect((await port.llig()).length).toBe(2);
  });

  /* F01 de l'auditoria de Codex (261004_1010): el número i la data de
     l'anterior no entren al hash de l'AEAT. Abans el port desava este
     registre i verificaCadena el donava per TRENCAMENT després. */
  test('un encadenament que nomena un altre anterior no entra (ENCADENAMENT_INCOHERENT) i el llibre no canvia', async () => {
    const port = creaPortMemoria();
    const primer = await registraAlta(port, factura(1), { instant: MIGDIA });
    const retocs = [
      ['numSerie', (r) => { r.encadenament.numSerie = 'A2026-0999'; }],
      ['dataExpedicio', (r) => { r.encadenament.dataExpedicio = '2026-10-03'; }]
    ];
    for (const [camp, retoca] of retocs) {
      const segon = obert(await creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA + 1000 }));
      retoca(segon);
      await expect(port.afegix(segon), camp).rejects.toMatchObject({ codi: 'ENCADENAMENT_INCOHERENT', detalls: [camp] });
      expect(await port.llig()).toHaveLength(1);
    }
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
    // El mateix registre, sense retocar, sí que entra.
    await port.afegix(await creaRegistreAlta({ factura: factura(2), anterior: primer, instant: MIGDIA + 1000 }));
    expect((await port.llig()).map((r) => r.numSerie)).toEqual(['A2026-0001', 'A2026-0002']);
  });

  test('una alta repetida, una anul·lació sense alta o repetida: no entren', async () => {
    const port = await ple(1);
    const primer = await port.ultim(CIF_EMISSOR);
    const repetida = await creaRegistreAlta({ factura: factura(1), anterior: primer, instant: MIGDIA + 5000 });
    await expect(port.afegix(repetida)).rejects.toMatchObject({ codi: 'DUPLICAT' });
    const absent = await creaRegistreAlta({ factura: factura(9), instant: MIGDIA });
    const senseAlta = await creaRegistreAnulacio({ alta: absent, anterior: primer, instant: MIGDIA + 5000 });
    await expect(port.afegix(senseAlta)).rejects.toMatchObject({ codi: 'FACTURA_INEXISTENT' });
    await registraAnulacio(port, { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0001', dataExpedicio: '2026-10-04', instant: MIGDIA + 6000 });
    const ultim = await port.ultim(CIF_EMISSOR);
    const segona = await creaRegistreAnulacio({ alta: primer, anterior: ultim, instant: MIGDIA + 7000 });
    await expect(port.afegix(segona)).rejects.toMatchObject({ codi: 'DUPLICAT' });
    expect((await port.llig()).map((r) => r.tipusRegistre)).toEqual(['alta', 'anulacio']);
  });

  test('un registre amb l’empremta que no li correspon no entra (EMPREMTA_ALTERADA)', async () => {
    const port = creaPortMemoria();
    const primer = await creaRegistreAlta({ factura: factura(1), instant: MIGDIA });
    const fals = { ...JSON.parse(JSON.stringify(primer)), empremta: 'A'.repeat(64) };
    await expect(port.afegix(fals)).rejects.toMatchObject({ codi: 'EMPREMTA_ALTERADA' });
    await expect(port.afegix({ ...fals, nota: 'x' })).rejects.toMatchObject({ codi: 'REGISTRE_INVALID' });
    expect(await port.llig()).toEqual([]);
  });

  test('desa la còpia que ha verificat, no l’objecte de qui crida, encara que canvie durant el resum', async () => {
    const port = creaPortMemoria();
    const viu = obert(await creaRegistreAlta({ factura: factura(1), instant: MIGDIA }));
    const promesa = port.afegix(viu);
    // L'hora és a l'empremta però cap altre camp no la contrasta: un canvi ací només el veu el resum.
    viu.dataHoraHusGeneracio = '2026-10-04T12:00:09+02:00';
    const desat = await promesa;
    expect(desat.dataHoraHusGeneracio).toBe('2026-10-04T12:00:00+02:00');
    expect((await port.ultim(CIF_EMISSOR)).dataHoraHusGeneracio).toBe('2026-10-04T12:00:00+02:00');
    expect((await verificaCadena(await port.llig())).valida).toBe(true);
  });

  test('un registre que no es pot copiar en JSON (BigInt, circular) dona REGISTRE_INVALID, no un error sense codi', async () => {
    const port = creaPortMemoria();
    const bo = obert(await creaRegistreAlta({ factura: factura(1), instant: MIGDIA }));
    const ambBigInt = { ...bo, ordre: 1n };
    const circular = { ...bo };
    circular.jo = circular;
    const ambGetterQueLlanca = Object.defineProperty({ ...bo }, 'trencat', { enumerable: true, get() { throw new Error('no'); } });
    for (const dolent of [ambBigInt, circular, ambGetterQueLlanca]) {
      await expect(port.afegix(dolent)).rejects.toMatchObject({ codi: 'REGISTRE_INVALID', detalls: [expect.stringMatching(/no es pot copiar en JSON/)] });
    }
    expect(await port.llig()).toEqual([]);
    // El mateix registre, copiable, sí que entra.
    expect((await port.afegix(bo)).ordre).toBe(1);
  });

  test('sense idEmisor no es llig ni s’escriu res', async () => {
    const port = creaPortMemoria();
    await expect(port.ultim('')).rejects.toThrow(TypeError);
    await expect(port.ultim()).rejects.toThrow(TypeError);
    await expect(port.llig({ idEmisor: 3 })).rejects.toThrow(TypeError);
    await expect(port.afegix(null)).rejects.toThrow(TypeError);
  });
});

describe('la còpia del llibre', () => {
  test('exporta en JSON canònic: els mateixos registres, els mateixos bytes', async () => {
    const port = await ple(2);
    const text = await port.exporta();
    expect(await port.exporta()).toBe(text);
    const llibre = JSON.parse(text);
    expect(llibre.esquema).toBe(ESQUEMA_LLIBRE);
    expect(llibre.registres.map((r) => r.ordre)).toEqual([1, 2]);
    expect(text).not.toMatch(/\s"|":\s/);
  });

  test('llibreDesDeJson refusa el que no és un llibre', () => {
    expect(() => llibreDesDeJson('{')).toThrow(expect.objectContaining({ codi: 'COPIA_INVALIDA' }));
    expect(() => llibreDesDeJson('{"esquema":"altre","registres":[]}')).toThrow(/no és un llibre/);
    expect(() => llibreDesDeJson(`{"esquema":"${ESQUEMA_LLIBRE}","registres":[{}]}`)).toThrow(/registres no vàlids/);
    expect(llibreDesDeJson(`{"esquema":"${ESQUEMA_LLIBRE}","registres":[]}`)).toEqual([]);
  });

  test('restaura en un port buit, i el llibre restaurat és idèntic', async () => {
    const origen = await ple(3);
    await registraAnulacio(origen, { idEmisor: CIF_EMISSOR, numSerie: 'A2026-0002', dataExpedicio: '2026-10-04', instant: MIGDIA + 9000 });
    const text = await origen.exporta();
    const desti = creaPortMemoria();
    expect(await restauraCopia(desti, text, { verifica })).toEqual({ afegits: 4 });
    expect(await desti.exporta()).toBe(text);
    // Tornar-la a bolcar no afig res.
    expect(await restauraCopia(desti, text, { verifica })).toEqual({ afegits: 0 });
  });

  test('un port amb el principi de la mateixa cadena rep només el que li falta', async () => {
    const origen = await ple(4);
    const parcial = creaPortMemoria();
    for (const r of (await origen.llig()).slice(0, 2)) await parcial.afegix(r);
    expect(await restauraCopia(parcial, await origen.exporta(), { verifica })).toEqual({ afegits: 2 });
    expect(await parcial.exporta()).toBe(await origen.exporta());
  });

  test('una còpia d’una altra cadena o falsificada no toca res', async () => {
    const origen = await ple(2);
    const text = await origen.exporta();
    const altre = creaPortMemoria();
    await registraAlta(altre, factura(1), { instant: MIGDIA + 500 });
    await expect(restauraCopia(altre, text, { verifica })).rejects.toMatchObject({ codi: 'COPIA_DIVERGENT' });
    expect((await altre.llig()).length).toBe(1);
    const falsificada = text.replace('"importTotal":2420', '"importTotal":2421').replace('"importTotal":2420', '"importTotal":2421');
    expect(falsificada).not.toBe(text);
    await expect(restauraCopia(creaPortMemoria(), falsificada, { verifica })).rejects.toMatchObject({ codi: 'COPIA_INVALIDA' });
    await expect(restauraCopia(creaPortMemoria(), text)).rejects.toThrow(TypeError);
  });

  test('una còpia amb la factura retocada (preu, destinatari) no es restaura, encara que les empremtes quadren', async () => {
    const text = await (await ple(2)).exporta();
    const retocs = [
      (llibre) => { llibre.registres[1].factura.linies[0].preuUnitari = 1; },
      (llibre) => { llibre.registres[1].factura.destinatari = null; }
    ];
    for (const retoca of retocs) {
      const llibre = JSON.parse(text);
      retoca(llibre);
      const desti = creaPortMemoria();
      await expect(restauraCopia(desti, JSON.stringify(llibre), { verifica }), String(retoca)).rejects.toMatchObject({ codi: 'COPIA_INVALIDA' });
      expect(await desti.llig()).toEqual([]);
    }
  });

  /* F03 de l'auditoria de Codex (261004_1010): la descripció no entra a
     l'empremta ni al recàlcul, i abans la restauració acabava amb
     { afegits: 0 } i dos textos diferents. */
  test('una còpia amb la descripció canviada passa la verificació fiscal però no la d’integritat (COPIA_ALTERADA)', async () => {
    const port = await ple(1);
    const original = await port.exporta();
    const llibre = JSON.parse(original);
    llibre.registres[0].factura.descripcio = 'Una descripció diferent';
    const retocada = JSON.stringify(llibre);
    // La verificació fiscal no ho veu: el text no és a l'empremta de l'AEAT.
    expect((await verificaCadena(llibre.registres)).valida).toBe(true);
    await expect(restauraCopia(port, retocada, { verifica })).rejects.toMatchObject({ codi: 'COPIA_ALTERADA', detalls: [1] });
    expect(await port.exporta()).toBe(original);
    // També quan la còpia és més llarga que el port: no s'afig res del que porta.
    const llarga = await ple(3);
    const llibreLlarg = JSON.parse(await llarga.exporta());
    llibreLlarg.registres[0].factura.descripcio = 'Una descripció diferent';
    const parcial = creaPortMemoria();
    await parcial.afegix((await llarga.llig())[0]);
    await expect(restauraCopia(parcial, JSON.stringify(llibreLlarg), { verifica })).rejects.toMatchObject({ codi: 'COPIA_ALTERADA' });
    expect(await parcial.llig()).toHaveLength(1);
    // I quan és més curta: el principi que porta s'ha de correspondre sencer.
    const curta = JSON.parse(await llarga.exporta());
    curta.registres = curta.registres.slice(0, 2);
    curta.registres[1].factura.descripcio = 'Una descripció diferent';
    await expect(restauraCopia(llarga, JSON.stringify(curta), { verifica })).rejects.toMatchObject({ codi: 'COPIA_ALTERADA', detalls: [2] });
    expect(await llarga.llig()).toHaveLength(3);
  });

  test('una còpia més vella que el port (el principi exacte de la cadena) no té res pendent', async () => {
    const port = await ple(2);
    const vella = await port.exporta();
    await ple(1, port, { des: 3 });
    expect(await restauraCopia(port, vella, { verifica })).toEqual({ afegits: 0 });
    expect((await port.llig()).length).toBe(3);
    // Amb un segon emissor que el port no té, se n'afig només eixe.
    const ambAltre = await ple(2);
    await registraAlta(ambAltre, factura(1, { emissor: DNI_CLIENT, destinatari: CIF_EMISSOR }), { instant: MIGDIA + 9000 });
    expect(await restauraCopia(port, await ambAltre.exporta(), { verifica })).toEqual({ afegits: 1 });
    expect((await port.ultim(DNI_CLIENT)).ordre).toBe(1);
  });

  test('una còpia més curta però d’una altra cadena sí que és divergent', async () => {
    const port = await ple(3);
    // Un minut més tard: les mateixes factures amb una altra hora fan una altra cadena.
    const altra = await ple(2, creaPortMemoria(), { instant: MIGDIA + 60000 });
    await expect(restauraCopia(port, await altra.exporta(), { verifica })).rejects.toMatchObject({ codi: 'COPIA_DIVERGENT' });
    expect((await port.llig()).length).toBe(3);
  });

  test('dos emissors, cada un amb la seua cadena', async () => {
    const port = await ple(2);
    await registraAlta(port, factura(1, { emissor: DNI_CLIENT, destinatari: CIF_EMISSOR }), { instant: MIGDIA + 9000 });
    expect((await port.ultim(DNI_CLIENT)).ordre).toBe(1);
    expect((await port.ultim(CIF_EMISSOR)).ordre).toBe(2);
    const copia = creaPortMemoria();
    expect(await restauraCopia(copia, await port.exporta(), { verifica })).toEqual({ afegits: 3 });
  });
});
