/**
 * i18nEntitatsCompte.js — Textos en 5 llengües (`ca`, `es`, `en`, `eu`, `gl`) per a
 * l'alta d'organitzacions (Empresa / Grup · DialegNovaOrganitzacio.jsx) i les vistes
 * d'«El compte» i «Membres i connexions» (DetallCompte.jsx) · Onada R32.37.
 *
 * Viu dins del tros diferit de `src/sections/profile/` (+0 B a `pesDelNucli`) i
 * preserva byte a byte tots els textos valencians per defecte (`ca`).
 */

export const TEXTOS_ENTITATS_COMPTE = Object.freeze({
  ca: Object.freeze({
    novaOrgTitol: 'Nova organització',
    novaOrgDescripcio: 'Crea una empresa o un grup. Tu en seràs la persona propietària.',
    companyEtiqueta: 'Empresa o negoci',
    companyAjuda: 'Una botiga, un taller, una cooperativa…',
    groupEtiqueta: 'Grup',
    groupAjuda: 'Una colla, una associació, un col·lectiu…',
    cancellar: 'Cancel·lar',
    crear: 'Crear',
    nom: 'Nom',
    tipus: 'Tipus',
    poble: 'Poble',
    triaPoble: 'Tria un poble…',
    identificador: 'Identificador',
    ajudaAdreca: (adreca) => `Adreça pública: ${adreca}. No es podrà canviar.`,
    titolCompte: 'El compte',
    titolMembres: 'Membres i connexions',
    leadPersona: 'Les dades d’accés (correu, contrasenya, sessió i estat del perfil) i els drets de sèrie de les teues notes.',
    leadMembres: (nom, deNomFn) => `Qui forma part ${deNomFn(nom)} i el veïnat connectat amb l’entitat.`,
    leadOrganitzacio: (nom) => `Poble, correu, identificador i eixida de ${nom}.`
  }),
  es: Object.freeze({
    novaOrgTitol: 'Nueva organización',
    novaOrgDescripcio: 'Crea una empresa o un grupo. Tú serás la persona propietaria.',
    companyEtiqueta: 'Empresa o negocio',
    companyAjuda: 'Una tienda, un taller, una cooperativa…',
    groupEtiqueta: 'Grupo',
    groupAjuda: 'Una peña, una asociación, un colectivo…',
    cancellar: 'Cancelar',
    crear: 'Crear',
    nom: 'Nombre',
    tipus: 'Tipo',
    poble: 'Pueblo',
    triaPoble: 'Elige un pueblo…',
    identificador: 'Identificador',
    ajudaAdreca: (adreca) => `Dirección pública: ${adreca}. No se podrá cambiar.`,
    titolCompte: 'La cuenta',
    titolMembres: 'Miembros y conexiones',
    leadPersona: 'Los datos de acceso (correo, contraseña, sesión y estado del perfil) y los derechos predeterminados de tus notas.',
    leadMembres: (nom) => `Quién forma parte de ${nom} y el vecindario conectado con la entidad.`,
    leadOrganitzacio: (nom) => `Pueblo, correo, identificador y salida de ${nom}.`
  }),
  en: Object.freeze({
    novaOrgTitol: 'New organisation',
    novaOrgDescripcio: 'Create a business or a group. You will be its owner.',
    companyEtiqueta: 'Business or cooperative',
    companyAjuda: 'A shop, a workshop, a cooperative…',
    groupEtiqueta: 'Group',
    groupAjuda: 'A club, an association, a collective…',
    cancellar: 'Cancel',
    crear: 'Create',
    nom: 'Name',
    tipus: 'Type',
    poble: 'Village',
    triaPoble: 'Choose a village…',
    identificador: 'Identifier',
    ajudaAdreca: (adreca) => `Public address: ${adreca}. This cannot be changed.`,
    titolCompte: 'Account',
    titolMembres: 'Members and connections',
    leadPersona: 'Sign-in details (email, password, session and profile status) and default rights for your notes.',
    leadMembres: (nom) => `Who belongs to ${nom} and the neighbours connected with the entity.`,
    leadOrganitzacio: (nom) => `Village, email, identifier and leaving ${nom}.`
  }),
  eu: Object.freeze({
    novaOrgTitol: 'Erakunde berria',
    novaOrgDescripcio: 'Sortu enpresa edo talde bat. Zu izango zara jabea.',
    companyEtiqueta: 'Enpresa edo negozioa',
    companyAjuda: 'Denda bat, tailer bat, kooperatiba bat…',
    groupEtiqueta: 'Taldea',
    groupAjuda: 'Lagunarte bat, elkarte bat, kolektibo bat…',
    cancellar: 'Utzi',
    crear: 'Sortu',
    nom: 'Izena',
    tipus: 'Mota',
    poble: 'Herria',
    triaPoble: 'Aukeratu herri bat…',
    identificador: 'Identifikatzailea',
    ajudaAdreca: (adreca) => `Helbide publikoa: ${adreca}. Ezingo da aldatu.`,
    titolCompte: 'Kontua',
    titolMembres: 'Kideak eta loturak',
    leadPersona: 'Sarbide-datuak (helbide elektronikoa, pasahitza, saioa eta profilaren egoera) eta zure oharren lehenetsitako eskubideak.',
    leadMembres: (nom) => `${nom} erakundeko kideak eta harekin lotutako auzotarrak.`,
    leadOrganitzacio: (nom) => `${nom} erakundearen herria, helbide elektronikoa, identifikatzailea eta irteera.`
  }),
  gl: Object.freeze({
    novaOrgTitol: 'Nova organización',
    novaOrgDescripcio: 'Crea unha empresa ou un grupo. Ti serás a persoa propietaria.',
    companyEtiqueta: 'Empresa ou negocio',
    companyAjuda: 'Unha tenda, un obradoiro, unha cooperativa…',
    groupEtiqueta: 'Grupo',
    groupAjuda: 'Unha peña, unha asociación, un colectivo…',
    cancellar: 'Cancelar',
    crear: 'Crear',
    nom: 'Nome',
    tipus: 'Tipo',
    poble: 'Vila',
    triaPoble: 'Escolle unha vila…',
    identificador: 'Identificador',
    ajudaAdreca: (adreca) => `Enderezo público: ${adreca}. Non se poderá cambiar.`,
    titolCompte: 'A conta',
    titolMembres: 'Membros e conexións',
    leadPersona: 'Os datos de acceso (correo, contrasinal, sesión e estado do perfil) e os dereitos predeterminados das túas notas.',
    leadMembres: (nom) => `Quen forma parte de ${nom} e a veciñanza conectada coa entidade.`,
    leadOrganitzacio: (nom) => `Vila, correo, identificador e saída de ${nom}.`
  })
});

export function normalitzaCodiIdiomaEntitats(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_ENTITATS_COMPTE, codi) ? codi : 'ca';
}

export function textosEntitatsCompte(idioma) {
  return TEXTOS_ENTITATS_COMPTE[normalitzaCodiIdiomaEntitats(idioma)];
}
