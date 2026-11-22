import { normalizeLanguage } from '../../config/i18n.js';
import { omple } from '../../config/moderacio.js';

const DICCIONARI_PERFIL_PUBLIC = Object.freeze({
  ca: Object.freeze({
    entitat: 'Entitat',
    grup: 'Grup',
    ia: 'Intel·ligència artificial',
    altLogotip: 'Logotip de {nom}',
    altAvatar: 'Avatar de {nom}',
    rentonarRegio: 'Arxiu històric, estatutari i constitutiu d’El Rentonar',
    rentonarDadesRegistralsAria: 'Dades registrals d’El Rentonar',
    rentonarPestanyesAria: 'Seccions documentals d’El Rentonar',
    rentonarTabHistoria: 'Història i Registre (1994–2026)',
    rentonarTabEstatuts: 'Estatuts Vigents (LO 1/2002)',
    rentonarTabActa: 'Model d’Acta Assembleària',
    rentonarAccioArbres: 'Obrir el Workspace de Natura i els 19 Arbres Singulars (2007–2020)',
    rentonarImprimirActa: 'Imprimir model d’acta'
  }),
  es: Object.freeze({
    entitat: 'Entidad',
    grup: 'Grupo',
    ia: 'Inteligencia artificial',
    altLogotip: 'Logotipo de {nom}',
    altAvatar: 'Avatar de {nom}',
    rentonarRegio: 'Archivo histórico, estatutario y constitutivo de El Rentonar',
    rentonarDadesRegistralsAria: 'Datos registrales de El Rentonar',
    rentonarPestanyesAria: 'Secciones documentales de El Rentonar',
    rentonarTabHistoria: 'Historia y Registro (1994–2026)',
    rentonarTabEstatuts: 'Estatutos Vigentes (LO 1/2002)',
    rentonarTabActa: 'Modelo de Acta Asamblearia',
    rentonarAccioArbres: 'Abrir el Espacio de Naturaleza y los 19 Árboles Singulares (2007–2020)',
    rentonarImprimirActa: 'Imprimir modelo de acta'
  }),
  en: Object.freeze({
    entitat: 'Organisation',
    grup: 'Group',
    ia: 'Artificial intelligence',
    altLogotip: 'Logo of {nom}',
    altAvatar: 'Avatar of {nom}',
    rentonarRegio: 'Historical, statutory and founding archive of El Rentonar',
    rentonarDadesRegistralsAria: 'Registry details of El Rentonar',
    rentonarPestanyesAria: 'Documentary sections of El Rentonar',
    rentonarTabHistoria: 'History and Registry (1994–2026)',
    rentonarTabEstatuts: 'Bylaws in Force (LO 1/2002)',
    rentonarTabActa: 'Assembly Minutes Template',
    rentonarAccioArbres: 'Open the Nature Workspace and the 19 Remarkable Trees (2007–2020)',
    rentonarImprimirActa: 'Print minutes template'
  }),
  eu: Object.freeze({
    entitat: 'Erakundea',
    grup: 'Taldea',
    ia: 'Adimen artifiziala',
    altLogotip: '{nom}-(r)en logotipoa',
    altAvatar: '{nom}-(r)en abatarra',
    rentonarRegio: 'El Rentonarren artxibo historiko, estatutario eta eratzailea',
    rentonarDadesRegistralsAria: 'El Rentonarren erregistro-datuak',
    rentonarPestanyesAria: 'El Rentonarren dokumentu-atalak',
    rentonarTabHistoria: 'Historia eta Erregistroa (1994–2026)',
    rentonarTabEstatuts: 'Indarreko Estatutuak (LO 1/2002)',
    rentonarTabActa: 'Batzar-aktaren Eredua',
    rentonarAccioArbres: 'Ireki Naturaren Lan-eremua eta 19 Zuhaitz Apartekoak (2007–2020)',
    rentonarImprimirActa: 'Inprimatu akta-eredua'
  }),
  gl: Object.freeze({
    entitat: 'Entidade',
    grup: 'Grupo',
    ia: 'Intelixencia artificial',
    altLogotip: 'Logotipo de {nom}',
    altAvatar: 'Avatar de {nom}',
    rentonarRegio: 'Arquivo histórico, estatutario e constitutivo de El Rentonar',
    rentonarDadesRegistralsAria: 'Datos rexistrais de El Rentonar',
    rentonarPestanyesAria: 'Seccións documentais de El Rentonar',
    rentonarTabHistoria: 'Historia e Rexistro (1994–2026)',
    rentonarTabEstatuts: 'Estatutos Vixentes (LO 1/2002)',
    rentonarTabActa: 'Modelo de Acta Asemblearia',
    rentonarAccioArbres: 'Abrir o Espazo de Natureza e as 19 Árbores Singulares (2007–2020)',
    rentonarImprimirActa: 'Imprimir modelo de acta'
  })
});

export function textosPerfilPublicPerIdioma(language = 'ca') {
  const codi = normalizeLanguage(language);
  return DICCIONARI_PERFIL_PUBLIC[codi] || DICCIONARI_PERFIL_PUBLIC.ca;
}

export function etiquetaTipusPerfilPublic(tipus, { t, language = 'ca' } = {}) {
  const dict = textosPerfilPublicPerIdioma(language);
  const tradueix = typeof t === 'function' ? t : (_clau, reserva) => reserva;
  if (tipus === 'entitat') return tradueix('section.detail.pobles.entitats.entitat', dict.entitat);
  if (tipus === 'grup') return tradueix('section.detail.pobles.entitats.grup', dict.grup);
  if (tipus === 'ia') return tradueix('section.perfil.fitxa.ia', dict.ia);
  return null;
}

export function altLogotipPerfilPublic(nom, language = 'ca') {
  const dict = textosPerfilPublicPerIdioma(language);
  return omple(dict.altLogotip, { nom: String(nom ?? '') });
}

export function altAvatarPerfilPublic(nom, language = 'ca') {
  const dict = textosPerfilPublicPerIdioma(language);
  return omple(dict.altAvatar, { nom: String(nom ?? '') });
}
