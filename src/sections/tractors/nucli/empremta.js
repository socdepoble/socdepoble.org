/**
 * empremta.js — l'empremta SHA-256 de la versió exacta d'un tractor.
 *
 * Cobrix el manifest (sense camps derivats), la fitxa explicativa i totes les
 * fonts declarades. Qualsevol canvi en una d'elles canvia l'empremta i, per
 * tant, invalida l'aprovació. Els finals de línia CRLF i el BOM inicial es
 * normalitzen perquè Windows, Node i Vite donen la mateixa empremta.
 */
import { desdeUtf8, jsonCanonic, resolSubtle, sha256Hex } from './canonic.js';
import { CAMPS_DERIVATS, PATRO_EMPREMTA, validaManifest } from './registre.js';

export const SCHEMA_EMPREMTA = 'sdp.empremta.v1';

export class ErrorEmpremta extends Error {
  constructor(codi, missatge, detalls = []) {
    super(missatge);
    this.name = 'ErrorEmpremta';
    this.codi = codi;
    this.detalls = detalls;
  }
}

export function normalitzaText(contingut) {
  const text = typeof contingut === 'string' ? contingut : desdeUtf8(contingut);
  return text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
}

export function manifestNet(manifest) {
  const net = {};
  for (const clau of Object.keys(manifest)) {
    if (!CAMPS_DERIVATS.includes(clau)) net[clau] = manifest[clau];
  }
  return net;
}

function textDe(ruta, contingut) {
  try {
    return normalitzaText(contingut);
  } catch {
    throw new ErrorEmpremta('EMPREMTA_INVALIDA', `«${ruta}» no és text UTF-8 vàlid.`, [ruta]);
  }
}

/* Comprova que les fonts rebudes són exactament les declarades. */
function fontsDeclarades(manifest, fonts) {
  if (!Array.isArray(fonts)) {
    throw new ErrorEmpremta('EMPREMTA_INVALIDA', 'Les fonts han de ser una llista de { ruta, contingut }.');
  }
  const declarades = new Set(manifest.fonts);
  const rebudes = new Map();
  for (const font of fonts) {
    const ruta = font?.ruta;
    if (typeof ruta !== 'string' || !declarades.has(ruta)) {
      throw new ErrorEmpremta('EMPREMTA_INVALIDA', `Font no declarada al manifest: ${String(ruta)}.`, [ruta]);
    }
    if (rebudes.has(ruta)) throw new ErrorEmpremta('EMPREMTA_INVALIDA', `Font repetida: ${ruta}.`, [ruta]);
    rebudes.set(ruta, font.contingut);
  }
  const absents = manifest.fonts.filter((ruta) => rebudes.get(ruta) == null);
  if (absents.length) {
    throw new ErrorEmpremta('EMPREMTA_INCOMPLETA', `Falten fonts declarades: ${absents.join(', ')}.`, absents);
  }
  return rebudes;
}

/* El text exacte que es resumix; útil per a mostrar-lo o recalcular-lo a mà. */
export async function preimatgeEmpremta({ manifest, fitxa, fonts } = {}, subtle) {
  const errors = validaManifest(manifest);
  if (errors.length) throw new ErrorEmpremta('EMPREMTA_INVALIDA', `Manifest invàlid: ${errors.join(' ')}`, errors);
  if (fitxa == null) {
    throw new ErrorEmpremta('EMPREMTA_INCOMPLETA', `Falta la fitxa explicativa (${manifest.fitxa}).`, [manifest.fitxa]);
  }
  const rebudes = fontsDeclarades(manifest, fonts);
  const s = resolSubtle(subtle);
  const parelles = [];
  for (const ruta of [...rebudes.keys()].sort()) {
    parelles.push([ruta, await sha256Hex(textDe(ruta, rebudes.get(ruta)), s)]);
  }
  return jsonCanonic({
    schema: SCHEMA_EMPREMTA,
    manifest: manifestNet(manifest),
    fitxa: await sha256Hex(textDe(manifest.fitxa, fitxa), s),
    fonts: parelles
  });
}

export async function calculaEmpremta(entrada, subtle) {
  const s = resolSubtle(subtle);
  return `sha256:${await sha256Hex(await preimatgeEmpremta(entrada, s), s)}`;
}

/* «A3F9-1C2B»: el que el Mestre escriu per a confirmar. No és seguretat
   criptogràfica, sinó prova de lectura. */
export function empremtaCurta(empremta) {
  if (typeof empremta !== 'string' || !PATRO_EMPREMTA.test(empremta)) {
    throw new ErrorEmpremta('EMPREMTA_INVALIDA', 'Empremta mal formada.', [String(empremta)]);
  }
  const curta = empremta.slice(7, 15).toUpperCase();
  return `${curta.slice(0, 4)}-${curta.slice(4)}`;
}
