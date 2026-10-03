/* Suport de proves de utils/fulls: ZIP com els d'Excel, LibreOffice o
   Numbers, amb les entrades en DEFLATE (node:zlib), i les rareses que
   llegeixZip ha de tolerar o rebutjar: comentari al final, entrada xifrada,
   ZIP64, un altre mètode, dades malmeses, una mida declarada que no quadra o
   un nom en una altra codificació.
   Només per a proves (importa node:zlib): cap fitxer de producció l'importa.

   Porta tractor-pedra-seca, LLEI_08 (subarbre orfe): este fitxer no penjarà
   mai de cap entrada, perquè només l'importen proves. Cal una excepció a
   EXCEPCIONS_ORFE o que el tractor excloga `__fixtures__` (decisió del Mestre). */
import { deflateRawSync } from 'node:zlib';
import { crc32 } from '../zip.js';

const MIDA_LOCAL = 30;
const MIDA_CENTRAL = 46;
const MIDA_FINAL = 22;
const MIDA_LOCALITZADOR = 20;
const DATA_DOS = 0x0021;

function bloc(mida) {
  const bytes = new Uint8Array(mida);
  return { bytes, vista: new DataView(bytes.buffer) };
}

/**
 * Un ZIP fet a mà, entrada per entrada.
 * @param {Array<{ nom: string, dades: string|Uint8Array, metode?: number, crues?: Uint8Array,
 *   mida?: number, xifrat?: boolean, zip64?: boolean, bytesNom?: Uint8Array, bitUtf8?: boolean }>} entrades
 *   metode: 8 (per defecte), 0 o qualsevol altre (es declara tal qual, amb
 *   les dades sense comprimir); crues: els bytes que van al ZIP en lloc dels
 *   de deflateRawSync (per a fer-ne de malmesos); mida: la mida descomprimida
 *   declarada (per defecte, la real); xifrat: el bit 0; zip64: mides
 *   0xFFFFFFFF al directori central; bytesNom: els bytes del nom en lloc del
 *   nom en UTF-8; bitUtf8: el bit 11 (per defecte, si el nom no és ASCII).
 * @param {{ comentari?: string, localitzadorZip64?: boolean }} [opcions]
 * @returns {Uint8Array}
 */
export function zipAmbDeflate(entrades, { comentari = '', localitzadorZip64 = false } = {}) {
  const codificador = new TextEncoder();
  const locals = [];
  const centrals = [];
  let pos = 0;
  for (const entrada of entrades) {
    const nom = entrada.bytesNom ?? codificador.encode(entrada.nom);
    const dades = typeof entrada.dades === 'string' ? codificador.encode(entrada.dades) : entrada.dades;
    const metode = entrada.metode ?? 8;
    const crues = entrada.crues ?? (metode === 8 ? new Uint8Array(deflateRawSync(dades)) : dades);
    const crc = crc32(dades);
    const mida = entrada.mida ?? dades.length;
    const flags = (entrada.xifrat ? 0x0001 : 0) | ((entrada.bitUtf8 ?? nom.some((b) => b > 0x7f)) ? 0x0800 : 0);

    const local = bloc(MIDA_LOCAL);
    local.vista.setUint32(0, 0x04034b50, true);
    local.vista.setUint16(4, 20, true);
    local.vista.setUint16(6, flags, true);
    local.vista.setUint16(8, metode, true);
    local.vista.setUint16(12, DATA_DOS, true);
    local.vista.setUint32(14, crc, true);
    local.vista.setUint32(18, crues.length, true);
    local.vista.setUint32(22, mida, true);
    local.vista.setUint16(26, nom.length, true);
    locals.push(local.bytes, nom, crues);

    const central = bloc(MIDA_CENTRAL);
    central.vista.setUint32(0, 0x02014b50, true);
    central.vista.setUint16(4, 20, true);
    central.vista.setUint16(6, 20, true);
    central.vista.setUint16(8, flags, true);
    central.vista.setUint16(10, metode, true);
    central.vista.setUint16(14, DATA_DOS, true);
    central.vista.setUint32(16, crc, true);
    central.vista.setUint32(20, entrada.zip64 ? 0xffffffff : crues.length, true);
    central.vista.setUint32(24, entrada.zip64 ? 0xffffffff : mida, true);
    central.vista.setUint16(28, nom.length, true);
    central.vista.setUint32(42, pos, true);
    centrals.push(central.bytes, nom);
    pos += MIDA_LOCAL + nom.length + crues.length;
  }
  const midaCentral = centrals.reduce((suma, b) => suma + b.length, 0);
  const finals = [];
  if (localitzadorZip64) {
    const localitzador = bloc(MIDA_LOCALITZADOR);
    localitzador.vista.setUint32(0, 0x07064b50, true);
    localitzador.vista.setUint32(16, 1, true);
    finals.push(localitzador.bytes);
  }
  const textComentari = codificador.encode(comentari);
  const final = bloc(MIDA_FINAL);
  final.vista.setUint32(0, 0x06054b50, true);
  final.vista.setUint16(8, entrades.length, true);
  final.vista.setUint16(10, entrades.length, true);
  final.vista.setUint32(12, midaCentral, true);
  final.vista.setUint32(16, pos, true);
  final.vista.setUint16(20, textComentari.length, true);
  finals.push(final.bytes, textComentari);

  const trossos = [...locals, ...centrals, ...finals];
  const eixida = new Uint8Array(trossos.reduce((suma, b) => suma + b.length, 0));
  let desti = 0;
  for (const tros of trossos) {
    eixida.set(tros, desti);
    desti += tros.length;
  }
  return eixida;
}
