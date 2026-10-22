/**
 * caraDeSocDePoble.js — Gauntlet 261022_0225 (XAT-3) · La regla única de la
 * cara de la comunitat de Sóc de Poble al Xat. Abans només la sabia
 * AvatarComunitat (la fila de la llista i la fitxa); el rail, «Comunitats» i
 * «Preferits» pintaven la imatge del fil: en remot, el logo pujat de
 * l'organització (coalesce(f.imatge_url, o.logo_url), 2609282100_xat_de_pagina.sql)
 * o, sense, les inicials «SD». Una mateixa comunitat portava dos cares en la
 * mateixa pantalla.
 *
 * Ara totes hi passen i porten el logo quadrat verd que el Mestre ha fixat
 * (AJUDA_PER_CLAU.socdepoble.avatar, xatsPerDefecte.js), tinga o no imatge el
 * fil. Compta com a Sóc de Poble la comunitat de l'entitat pilot, per
 * identitat (el subjecte n'és l'entitat: esEntitatDelProjecte, l'id de la
 * llavor o el remot que el backend ja ha registrat), mai pel nom. Els Avisos
 * (el megàfon), els grups de dins (la seua icona) i els directes (la seua
 * imatge, AvatarFil) no hi entren. Una entitat homònima conserva la seua
 * cara. Pur: cap React ni cap xarxa.
 */
import { esEntitatDelProjecte } from '../../config/navigation.js';
import { AJUDA_PER_CLAU } from '../../data/xatsPerDefecte.js';

/** El logo oficial de Sóc de Poble, la font única d'AJUDA. */
export const LOGO_DE_SOC_DE_POBLE = AJUDA_PER_CLAU.socdepoble.avatar;

/** Cert si `fil` és la comunitat de Sóc de Poble (vegeu dalt). */
export function esComunitatDeSocDePoble(fil) {
  if (!fil || fil.tipus === 'canal' || fil.esCanal === true || fil.tipus === 'grup' || fil.esGrup === true) return false;
  return fil.subjecte?.tipus === 'entitat' && esEntitatDelProjecte(fil.subjecte);
}

/** La imatge que pinta la cara d'una comunitat: el logo oficial per a Sóc de Poble; la resta, la seua. */
export const caraDeComunitat = (fil) => (esComunitatDeSocDePoble(fil) ? LOGO_DE_SOC_DE_POBLE : (fil?.avatar_url ?? null));
