/**
 * Gestoria de Poble · i18nGestoria.js (Onada R32.10 · T3-UI-03 + Onada R32.11 · Lot 05).
 *
 * Diccionari modular pur (zero React, zero DOM, zero xarxa) dels estats buits
 * i dels 6 estats UI de la micro-app de Gestoria en les 5 llengües oficials
 * (ca, es, en, eu, gl), amb didàctica honesta Llei 0 sobre l'abast pre-comptable.
 */
export const CODIS_IDIOMA_GESTORIA = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export const TEXTOS_BUIT_GESTORIA = Object.freeze({
  ca: Object.freeze({
    noCompiladaTitol: 'La Gestoria no és en este paquet',
    noCompiladaText: 'Esta versió de la web no porta la Gestoria.',
    tornaAlPortal: 'Torna al catàleg d’aplicacions',
    llibreBuitFiltres: 'Cap factura del període amb estos filtres.',
    llibreBuitInicial: 'Encara no has emés cap factura amb este programa.'
  }),
  es: Object.freeze({
    noCompiladaTitol: 'La Gestoría no está en este paquete',
    noCompiladaText: 'Esta versión de la web no incluye la Gestoría.',
    tornaAlPortal: 'Volver al catálogo de aplicaciones',
    llibreBuitFiltres: 'Ninguna factura del periodo con estos filtros.',
    llibreBuitInicial: 'Todavía no has emitido ninguna factura con este programa.'
  }),
  en: Object.freeze({
    noCompiladaTitol: 'Bookkeeping is not in this build',
    noCompiladaText: 'This web version does not include the Bookkeeping module.',
    tornaAlPortal: 'Back to applications catalogue',
    llibreBuitFiltres: 'No invoices in this period match these filters.',
    llibreBuitInicial: 'You have not issued any invoices with this tool yet.'
  }),
  eu: Object.freeze({
    noCompiladaTitol: 'Gestoria ez dago pakete honetan',
    noCompiladaText: 'Web bertsio honek ez dakar Gestoria.',
    tornaAlPortal: 'Itzuli aplikazioen katalogora',
    llibreBuitFiltres: 'Ez dago aldi honetako fakturarik iragazki hauekin.',
    llibreBuitInicial: 'Oraindik ez duzu fakturarik jaulki programa honekin.'
  }),
  gl: Object.freeze({
    noCompiladaTitol: 'A Xestoría non está neste paquete',
    noCompiladaText: 'Esta versión da web non inclúe a Xestoría.',
    tornaAlPortal: 'Volver ao catálogo de aplicacións',
    llibreBuitFiltres: 'Ningunha factura do período con estes filtros.',
    llibreBuitInicial: 'Aínda non emitiches ningunha factura con este programa.'
  })
});

export function codiIdiomaGestoria(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_BUIT_GESTORIA, codi) ? codi : 'ca';
}

export function textosBuitGestoria(idioma) {
  return TEXTOS_BUIT_GESTORIA[codiIdiomaGestoria(idioma)];
}

export const TEXTOS_SECCIONS_GESTORIA = Object.freeze({
  ca: Object.freeze({
    tauler: 'Tauler Central',
    facturacio: 'Facturació',
    contactes: 'Contactes',
    burocracia: 'Burocràcia',
    identitat: 'Identitat i Finestreta',
    bancs: 'Bancs i Tresoreria',
    impostos: 'Impostos',
    full: 'Full trimestral',
    historic: 'Històric i IA',
    informes: 'Informes',
    escaner: 'Escàner Local',
    aprendre: 'Aprendre'
  }),
  es: Object.freeze({
    tauler: 'Tablero Central',
    facturacio: 'Facturación',
    contactes: 'Contactos',
    burocracia: 'Burocracia',
    identitat: 'Identidad y Ventanilla',
    bancs: 'Bancos y Tesorería',
    impostos: 'Impuestos',
    full: 'Hoja trimestral',
    historic: 'Histórico e IA',
    informes: 'Informes',
    escaner: 'Escáner Local',
    aprendre: 'Aprender'
  }),
  en: Object.freeze({
    tauler: 'Central Dashboard',
    facturacio: 'Invoicing',
    contactes: 'Contacts',
    burocracia: 'Paperwork',
    identitat: 'Identity and One-Stop Desk',
    bancs: 'Banking and Treasury',
    impostos: 'Taxes',
    full: 'Quarterly sheet',
    historic: 'History and AI',
    informes: 'Reports',
    escaner: 'Local Scanner',
    aprendre: 'Learn'
  }),
  eu: Object.freeze({
    tauler: 'Aginte Mahai Nagusia',
    facturacio: 'Fakturazioa',
    contactes: 'Kontaktuak',
    burocracia: 'Burokrazia',
    identitat: 'Nortasuna eta Leihatila',
    bancs: 'Bankuak eta Diruzaintza',
    impostos: 'Zergak',
    full: 'Hiruhileko orria',
    historic: 'Historikoa eta AA',
    informes: 'Txostenak',
    escaner: 'Tokiko Eskanerra',
    aprendre: 'Ikasi'
  }),
  gl: Object.freeze({
    tauler: 'Taboleiro Central',
    facturacio: 'Facturación',
    contactes: 'Contactos',
    burocracia: 'Burocracia',
    identitat: 'Identidade e Xanela',
    bancs: 'Bancos e Tesouraría',
    impostos: 'Impostos',
    full: 'Folla trimestral',
    historic: 'Histórico e IA',
    informes: 'Informes',
    escaner: 'Escáner Local',
    aprendre: 'Aprender'
  })
});

export function textosSeccionsGestoria(idioma) {
  return TEXTOS_SECCIONS_GESTORIA[codiIdiomaGestoria(idioma)];
}
