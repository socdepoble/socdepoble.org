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
 *   · agent IA: sempre pública, amb l'avís d'intel·ligència artificial.
 * Persona i organització es poden tornar a fer privades: el text «reversible»
 * només ix ací, on és cert.
 */

const REVERSIBLE = 'Si la fas pública, la pots tornar a fer privada quan vulgues, des d’ací mateix.';

/* Pla 261018_1605 (Tasca 1, D3; ordre del Mestre, 18-10-2026) · L'avís de
   l'ajust «Estat del perfil» d'«El compte» (DetallAjust, tipus 'visibilitat'),
   només quan el valor DESAT de la persona és públic. Font única: cap altre
   mòdul no en porta còpia. PERSONA.avisPublica (l'editor) no canvia: el seu
   text és pendent de la decisió del Mestre. */
export const AVIS_FITXA_PUBLICA = 'La teua fitxa és pública perquè el veïnat et puga trobar. Pots canviar-la a privada quan vulgues.';

const PERSONA = Object.freeze({
  titol: 'Qui pot vore la teua fitxa?',
  descripcio: 'Tria com vols estar al poble. No és per a sempre: ho pots canviar quan vulgues.',
  llegenda: 'Visibilitat de la fitxa',
  publica: Object.freeze({
    etiqueta: 'Fitxa pública',
    explicacio: 'Tothom podrà saber que hi eres: la fitxa queda marcada perquè la gent del poble la puga trobar i llegir.',
    accio: 'Fer-la pública',
    accioIgual: 'Deixar-la pública',
  }),
  privada: Object.freeze({
    etiqueta: 'Fitxa privada',
    explicacio: 'Amb el candau tancat ningú més veu la teua fitxa: hi pots escriure i provar el que vulgues.',
    accio: 'Fer-la privada',
    accioIgual: 'Deixar-la privada',
  }),
  reversible: REVERSIBLE,
  irreversible: null,
  avisPublica: 'Encara falta una peça al servidor perquè altres persones puguen obrir fitxes de persones: fins que hi siga, la marca es desa però la fitxa només la veus tu.',
});

const ORGANITZACIO = Object.freeze({
  titol: 'Qui pot vore la fitxa de l’entitat?',
  descripcio: 'Tria com vol estar l’entitat al poble. Ho pots canviar quan vulgues.',
  llegenda: 'Visibilitat de la fitxa',
  publica: Object.freeze({
    etiqueta: 'Fitxa pública',
    explicacio: 'Tothom sap que hi sou: qualsevol persona del poble pot trobar la fitxa de l’entitat i llegir-la.',
    accio: 'Fer-la pública',
    accioIgual: 'Deixar-la pública',
  }),
  privada: Object.freeze({
    etiqueta: 'Fitxa privada',
    explicacio: 'Amb el candau tancat només la veuen les persones membres de l’entitat.',
    accio: 'Fer-la privada',
    accioIgual: 'Deixar-la privada',
  }),
  reversible: REVERSIBLE,
  irreversible: null,
  avisPublica: null,
});

const AGENT = Object.freeze({
  titol: 'Qui pot vore la fitxa de l’agent?',
  descripcio: 'La fitxa d’un agent IA és sempre pública.',
  llegenda: 'Visibilitat de la fitxa',
  publica: Object.freeze({
    etiqueta: 'Fitxa pública',
    explicacio: 'La fitxa de l’agent és pública i porta sempre l’avís d’intel·ligència artificial.',
    accio: 'Deixar-la pública',
    accioIgual: 'Deixar-la pública',
  }),
  privada: Object.freeze({
    etiqueta: 'Fitxa privada',
    explicacio: 'Un agent IA no pot tindre la fitxa amagada.',
    accio: 'Fer-la privada',
    accioIgual: 'Deixar-la privada',
  }),
  reversible: null,
  irreversible: null,
  avisPublica: null,
});

export const MOTIU_AGENT = 'La fitxa d’un agent IA sempre és pública i porta l’avís d’intel·ligència artificial.';

/** Els textos del selector segons la mena de fitxa ('persona' | 'agent' | organització). */
export function textosDeFitxa(mena) {
  if (mena === 'persona') return PERSONA;
  if (mena === 'agent') return AGENT;
  return ORGANITZACIO;
}

/** El que no es pot triar (null si tot es pot triar). */
export function bloqueigDeFitxa(mena) {
  return mena === 'agent' ? { opcio: 'privada', motiu: MOTIU_AGENT } : null;
}
