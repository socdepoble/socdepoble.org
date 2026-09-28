/* ═══════════════════════════════════════════════════════════════════
   T47 (ordre del Mestre, 260928) · ERRORS DE L'AUTODESAMENT

   Mòdul pur (sense React, sense xarxa): el poden importar perfilCamps.js
   i qualsevol validador sense arrossegar la cua ni el magatzem.

   La cua no decidix mai «perdre» un text: només decidix QUÈ fa amb ell
   segons el tipus de fallada.
     validacio  el client o un CHECK (23514, 22001) el rebutja → error de
                camp persistent; el text es conserva i no es reintenta sol.
     columna    la columna no existix (PGRST204, 42703) → quarantena
                d'eixe camp; la resta s'envia.
     sessio     sessió o actor diferent (AbortError, 401) → pendent sense
                avís; es repren en la pròxima entrada de sessió.
     conflicte  409 → el camp espera una decisió (Notes, T47b).
     servidor   permís (42501, 403), qualsevol altre 4xx i tota fallada no
                reconeguda (p. ex. «El perfil no s'ha confirmat…» de
                l'adaptador) → error de camp amb «Tornar a provar» i «Tornar
                al que hi ha desat»; es torna a provar en reprendre o en
                tornar a editar.
     temporal   NOMÉS xarxa (status 0 o el TypeError de fetch), temps
                esgotat (TimeoutError), 408, 429 i 5xx → reintent amb
                retrocés i en tornar la xarxa. T47 (correcció de la revisió,
                260928): una fallada determinista reintentada per sempre no
                oferia cap eixida a la persona.
   ═══════════════════════════════════════════════════════════════════ */

/** Un valor que no es pot desar tal com és. Porta la llargària per al comptador. */
export class ErrorValidacio extends Error {
  constructor(missatge, detalls = {}) {
    super(missatge);
    this.name = 'ErrorValidacio';
    const { columna = null, llargaria = null, minim = null, maxim = null } = detalls;
    this.columna = columna;
    this.llargaria = llargaria;
    this.minim = minim;
    this.maxim = maxim;
  }
}

/**
 * T47b (ordre del Mestre, 260928) · L'adaptador ja sap que el servidor no té la
 * columna d'un camp opcional (src/data/supabase/columnesOpcionals.js) i, llevat
 * eixos camps, no li queda res per enviar: ni tan sols fa la petició. `camps` són
 * els noms del port (p. ex. 'icon'); `columna`, la primera columna absent.
 */
export class ErrorColumnaAbsent extends Error {
  constructor(missatge, { columna = null, camps = [] } = {}) {
    super(missatge);
    this.name = 'ErrorColumnaAbsent';
    this.status = 400;
    this.columna = columna;
    this.camps = [...camps];
  }
}

/**
 * Quina columna diu el servidor que falta, o null. PostgREST ho diu de dues
 * maneres: PGRST204 («Could not find the 'lema' column of 'profiles'…») per
 * al cos del PATCH i 42703 («column organizations.copyright does not exist»)
 * per a les columnes del select.
 */
export function columnaAbsent(missatge) {
  const text = String(missatge || '');
  const cache = /Could not find the '([^']+)' column/i.exec(text);
  if (cache) return cache[1];
  const postgres = /column\s+(?:"?[\w]+"?\.)?"?([\w]+)"?\s+does not exist/i.exec(text);
  return postgres ? postgres[1] : null;
}

const RE_VALIDACIO = /\b(23514|22001)\b/;
const RE_COLUMNA = /PGRST204|\b42703\b/;
const RE_PERMIS = /\b42501\b/;
const RE_SESSIO = /La sessió ha (caducat|canviat)|Cal iniciar sessió/i;
/* El TypeError amb què fetch rebutja sense xarxa, per als adaptadors que no
   l'embolcallen amb status 0 (Chrome, Firefox, Safari, React Native). */
const RE_FETCH = /Failed to fetch|NetworkError|Load failed|Network request failed/i;

/** T47 (correcció de la revisió, 260928) · Només el que pot anar bé sol si s'espera. */
function esTemporal(error, missatge) {
  const status = error?.status;
  if (status === 0 || error?.name === 'TimeoutError') return true;
  if (status === 408 || status === 429 || (Number.isInteger(status) && status >= 500)) return true;
  return error?.name === 'TypeError' && RE_FETCH.test(missatge);
}

/** Classifica una fallada d'escriptura. Torna { tipus, missatge, …detalls }. */
export function classificaError(error) {
  const missatge = String(error?.message || '');
  if (error?.name === 'ErrorValidacio') {
    return { tipus: 'validacio', missatge, columna: error.columna ?? null,
      llargaria: error.llargaria ?? null, minim: error.minim ?? null, maxim: error.maxim ?? null };
  }
  if (error?.name === 'ErrorColumnaAbsent') return { tipus: 'columna', missatge, columna: error.columna ?? null };
  if (error?.name === 'AbortError' || error?.status === 401 || RE_SESSIO.test(missatge)) {
    return { tipus: 'sessio', missatge };
  }
  if (RE_VALIDACIO.test(missatge)) {
    return { tipus: 'validacio', missatge: 'El servidor no accepta este text tal com és (massa llarg o amb un format que no admet).' };
  }
  const columna = columnaAbsent(missatge);
  if (columna || RE_COLUMNA.test(missatge)) return { tipus: 'columna', missatge, columna };
  if (error?.status === 409) return { tipus: 'conflicte', missatge };
  if (error?.status === 403 || RE_PERMIS.test(missatge)) {
    return { tipus: 'servidor', missatge: 'no tens permís per a canviar este camp' };
  }
  if (esTemporal(error, missatge)) return { tipus: 'temporal', missatge };
  /* Un 4xx determinista o una fallada que no reconeixem: tornar-la a enviar
     sola donaria el mateix. Error de camp, el text es queda i la persona tria. */
  return { tipus: 'servidor', missatge };
}
