/**
 * visibilitatFitxa.js — Què diu el selector de visibilitat (T41) a la fitxa
 * del Perfil. Pur: sense React ni backend (Model B).
 *
 * T41 (ordre del Mestre, 260928) · Fitxa Pública (tothom sap que hi eres) o
 * Fitxa Privada (amb el candau, ningú et veu i fas el que vols), explicat
 * sense prometre el que el servidor encara no fa:
 *   · persona: `profiles.is_public`. La fitxa pública d'una ALTRA persona
 *     encara no es pot llegir al servidor (falta la RPC perfil_public,
 *     supabase/perfils.js): la marca es desa, i ho diem;
 *   · organització: `organizations.visibility` 'public' | 'members'. Privada
 *     vol dir «només les persones membres», no «ningú»;
 *   · agent IA: sempre pública, amb l'avís d'intel·ligència artificial;
 *   · empresa, entitat o ajuntament (kind 'company', 'entity' o 'city_hall'):
 *     sempre pública, sense l'opció «Fitxa privada» (decisió del Mestre, xat
 *     261031, RGPD). Els grups conserven la tria.
 * Persona i organització es poden tornar a fer privades: el text «reversible»
 * només ix ací, on és cert.
 */

import { tradueix } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';

const p = (nom, reserva) => Object.freeze([`section.perfil.visibilitat.${nom}`, reserva]);
export const TEXTOS_VISIBILITAT_FITXA = Object.freeze({
  reversible: p('reversible', 'Si la fas pública, la pots tornar a fer privada quan vulgues, des d’ací mateix.'),
  avisFitxaPublica: p('avisFitxaPublica', 'La teua fitxa és pública perquè el veïnat et puga trobar. Pots canviar-la a privada quan vulgues.'),
  llegenda: p('llegenda', 'Visibilitat de la fitxa'),
  publicaEtiqueta: p('publica.etiqueta', 'Fitxa pública'),
  privadaEtiqueta: p('privada.etiqueta', 'Fitxa privada'),
  accioFerPublica: p('accio.ferPublica', 'Fer-la pública'),
  accioDeixarPublica: p('accio.deixarPublica', 'Deixar-la pública'),
  accioFerPrivada: p('accio.ferPrivada', 'Fer-la privada'),
  accioDeixarPrivada: p('accio.deixarPrivada', 'Deixar-la privada'),
  personaTitol: p('persona.titol', 'Qui pot vore la teua fitxa?'),
  personaDescripcio: p('persona.descripcio', 'Tria com vols estar al poble. No és per a sempre: ho pots canviar quan vulgues.'),
  personaPublicaExplicacio: p('persona.publicaExplicacio', 'Tothom podrà saber que hi eres: la fitxa queda marcada perquè la gent del poble la puga trobar i llegir.'),
  personaPrivadaExplicacio: p('persona.privadaExplicacio', 'Amb el candau tancat ningú més veu la teua fitxa: hi pots escriure i provar el que vulgues.'),
  personaAvisPublica: p('persona.avisPublica', 'Encara falta una peça al servidor perquè altres persones puguen obrir fitxes de persones: fins que hi siga, la marca es desa però la fitxa només la veus tu.'),
  orgTitol: p('org.titol', 'Qui pot vore la fitxa de l’entitat?'),
  orgDescripcio: p('org.descripcio', 'Tria com vol estar l’entitat al poble. Ho pots canviar quan vulgues.'),
  orgPublicaExplicacio: p('org.publicaExplicacio', 'Tothom sap que hi sou: qualsevol persona del poble pot trobar la fitxa de l’entitat i llegir-la.'),
  orgPrivadaExplicacio: p('org.privadaExplicacio', 'Amb el candau tancat només la veuen les persones membres de l’entitat.'),
  agentTitol: p('agent.titol', 'Qui pot vore la fitxa de l’agent?'),
  agentDescripcio: p('agent.descripcio', 'La fitxa d’un agent IA és sempre pública.'),
  agentPublicaExplicacio: p('agent.publicaExplicacio', 'La fitxa de l’agent és pública i porta sempre l’avís d’intel·ligència artificial.'),
  agentPrivadaExplicacio: p('agent.privadaExplicacio', 'Un agent IA no pot tindre la fitxa amagada.'),
  motiuAgent: p('motiuAgent', 'La fitxa d’un agent IA sempre és pública i porta l’avís d’intel·ligència artificial.'),
  motiuFiguraPublica: p('motiuFiguraPublica', 'Les empreses, les entitats i els ajuntaments són figures públiques del directori: la seua fitxa ha de ser pública.'),
});

/* Pla 261018_1605 (Tasca 1, D3; ordre del Mestre, 18-10-2026) · L'avís de
   l'ajust «Estat del perfil» d'«El compte» (DetallAjust, tipus 'visibilitat'),
   només quan el valor DESAT de la persona és públic. Font única: cap altre
   mòdul no en porta còpia. PERSONA.avisPublica (l'editor) no canvia: el seu
   text és pendent de la decisió del Mestre. */
export const AVIS_FITXA_PUBLICA = TEXTOS_VISIBILITAT_FITXA.avisFitxaPublica[1];

export const MOTIU_AGENT = TEXTOS_VISIBILITAT_FITXA.motiuAgent[1];

/* Decisió del Mestre (xat 261031, RGPD) · Les empreses, les entitats i els
   ajuntaments són figures públiques del directori (com fa el servidor amb la
   migració 2610311500): el selector no oferix «Fitxa privada» i ho diu en una
   sola línia. Els grups ('group') conserven la tria. */
export const KINDS_FIGURA_PUBLICA = Object.freeze(['company', 'entity', 'city_hall']);
export const MOTIU_FIGURA_PUBLICA = TEXTOS_VISIBILITAT_FITXA.motiuFiguraPublica[1];

/** Si el tipus d'organització és una figura pública del directori. */
export const esFiguraPublica = (kind) => KINDS_FIGURA_PUBLICA.includes(kind);

/** Els textos del selector segons la mena de fitxa ('persona' | 'agent' | organització). */
export function textosDeFitxa(mena, t = null) {
  const V = TEXTOS_VISIBILITAT_FITXA;
  const llegenda = tradueix(t, V.llegenda);
  const publicaEtiqueta = tradueix(t, V.publicaEtiqueta);
  const privadaEtiqueta = tradueix(t, V.privadaEtiqueta);
  const accioFerPublica = tradueix(t, V.accioFerPublica);
  const accioDeixarPublica = tradueix(t, V.accioDeixarPublica);
  const accioFerPrivada = tradueix(t, V.accioFerPrivada);
  const accioDeixarPrivada = tradueix(t, V.accioDeixarPrivada);
  if (mena === 'persona') {
    return Object.freeze({
      titol: tradueix(t, V.personaTitol),
      descripcio: tradueix(t, V.personaDescripcio),
      llegenda,
      publica: Object.freeze({
        etiqueta: publicaEtiqueta,
        explicacio: tradueix(t, V.personaPublicaExplicacio),
        accio: accioFerPublica,
        accioIgual: accioDeixarPublica,
      }),
      privada: Object.freeze({
        etiqueta: privadaEtiqueta,
        explicacio: tradueix(t, V.personaPrivadaExplicacio),
        accio: accioFerPrivada,
        accioIgual: accioDeixarPrivada,
      }),
      reversible: tradueix(t, V.reversible),
      irreversible: null,
      avisPublica: tradueix(t, V.personaAvisPublica),
    });
  }
  if (mena === 'agent') {
    return Object.freeze({
      titol: tradueix(t, V.agentTitol),
      descripcio: tradueix(t, V.agentDescripcio),
      llegenda,
      publica: Object.freeze({
        etiqueta: publicaEtiqueta,
        explicacio: tradueix(t, V.agentPublicaExplicacio),
        accio: accioDeixarPublica,
        accioIgual: accioDeixarPublica,
      }),
      privada: Object.freeze({
        etiqueta: privadaEtiqueta,
        explicacio: tradueix(t, V.agentPrivadaExplicacio),
        accio: accioFerPrivada,
        accioIgual: accioDeixarPrivada,
      }),
      reversible: null,
      irreversible: null,
      avisPublica: null,
    });
  }
  return Object.freeze({
    titol: tradueix(t, V.orgTitol),
    descripcio: tradueix(t, V.orgDescripcio),
    llegenda,
    publica: Object.freeze({
      etiqueta: publicaEtiqueta,
      explicacio: tradueix(t, V.orgPublicaExplicacio),
      accio: accioFerPublica,
      accioIgual: accioDeixarPublica,
    }),
    privada: Object.freeze({
      etiqueta: privadaEtiqueta,
      explicacio: tradueix(t, V.orgPrivadaExplicacio),
      accio: accioFerPrivada,
      accioIgual: accioDeixarPrivada,
    }),
    reversible: tradueix(t, V.reversible),
    irreversible: null,
    avisPublica: null,
  });
}

/** El que no es pot triar (null si tot es pot triar). `amaga`: l'opció ni s'oferix. */
export function bloqueigDeFitxa(mena, kind, t = null) {
  if (mena === 'agent') return { opcio: 'privada', motiu: tradueix(t, TEXTOS_VISIBILITAT_FITXA.motiuAgent) };
  if (mena === 'organitzacio' && esFiguraPublica(kind)) {
    return { opcio: 'privada', motiu: tradueix(t, TEXTOS_VISIBILITAT_FITXA.motiuFiguraPublica), amaga: true };
  }
  return null;
}
