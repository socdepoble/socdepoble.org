/**
 * vistaEnConstruccioModel.js — Diccionari canònic i projecció pura de les vistes en construcció del Xat (Onada R32.22 · T2 HMR).
 */

const CAP = Object.freeze([]);

export const VISTES_EN_CONSTRUCCIO = Object.freeze({
  telefonades: Object.freeze({
    accio: Object.freeze({ tipus: 'nou', etiqueta: ['section.xat.vista.telefonades.nova', 'Nova telefonada'] }),
    cerca: ['section.xat.nou.cerca', 'Nom del contacte'],
    descripcio: ['section.xat.vista.telefonades.text', 'Ací hi haurà les telefonades i les videotelefonades amb la gent de poble: les perdudes, les rebudes i les que fas tu.'],
    avis: Object.freeze(['nav.telefonades.avis', 'Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament.']),
  }),
});

export const TEXTOS_CONSTRUCCIO = Object.freeze({
  titol: Object.freeze(['section.xat.construccio.titol', 'En construcció']),
  avis: Object.freeze(['section.xat.construccio.avis', 'Encara no està disponible: es construirà en una fase següent del xat.']),
});

/**
 * Els textos d'una vista, ja traduïts, per a passar-los a VistaEnConstruccio.
 * Null si la vista no és una de les que estan en construcció (des del 261004,
 * Telefonades i Destacats). `avis` és buit si la vista no en porta cap de
 * propi (la targeta pinta llavors el genèric).
 */
export function textosDeVista(id, t) {
  const config = VISTES_EN_CONSTRUCCIO[id];
  if (!config) return null;
  const tr = (parell) => (parell ? t(parell[0], parell[1]) : '');
  return {
    icones: (config.icones || CAP).map(([clau, text, Icona]) => ({ etiqueta: t(clau, text), Icona })),
    subtitol: tr(config.subtitol),
    accio: config.accio ? { tipus: config.accio.tipus, etiqueta: tr(config.accio.etiqueta) } : null,
    segments: config.segments ? { etiqueta: tr(config.segments.etiqueta), opcions: config.segments.opcions.map(tr) } : null,
    cerca: tr(config.cerca),
    descripcio: tr(config.descripcio),
    avis: tr(config.avis),
  };
}
