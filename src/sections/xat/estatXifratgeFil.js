/**
 * estatXifratgeFil.js — L'estat honest del xifratge d'una conversa per a la
 * interfície (P1-12 pas 17; pla 261101_1246, T7 · S5; disseny E2EE §3, §4.4 i
 * §13). Pur: no importa React, el port ni cap mòdul criptogràfic.
 *
 * Regles d'honestedat (§13):
 *   · Amb la bandera apagada (o sense servei de xifratge), res: cap text, cap
 *     entrada al menú. El xat no és xifrat i la interfície no ho insinua.
 *   · Un text només on és cert: «es xifren» només en un fil que el decorador
 *     xifra de veres (abast xifrat, no bloquejat, entorn segur); la IAIA i els
 *     xats públics diuen que NO són xifrats d'extrem a extrem.
 *   · No hi ha cap interruptor per conversa: DM-1 i DM-3 (tota conversa privada
 *     xifrada, esperar abans que enviar en clar) i la marca apegalosa (§3) no
 *     ho permeten. Per conversa hi ha l'estat i la verificació.
 */

const parell = (nom, reserva) => Object.freeze([`section.xat.xifratge.${nom}`, reserva]);

/** Els textos [clau, reserva en valencià] del xifratge del xat. */
export const TEXTOS_XIFRATGE = Object.freeze({
  menu: parell('menu', 'Xifratge i número de seguretat'),
  avisFil: parell('avisFil', 'Els missatges i els fitxers d’este xat es xifren al teu aparell abans d’eixir. Al servidor de Sóc de Poble només arriben xifrats i no hi tenim les claus per a obrir-los. Sí que veiem qui parla amb qui i quan. Comproveu el número de seguretat per a estar-ne segurs.'),
  /* Gauntlet T7b-G07 · Un xat només teu (tipus 'personal') no té cap parell amb qui comparar. */
  avisFilPersonal: parell('avisFilPersonal', 'Els missatges i els fitxers d’este xat es xifren al teu aparell abans d’eixir. Al servidor de Sóc de Poble només arriben xifrats i no hi tenim les claus per a obrir-los. Sí que veiem quan hi escrius. En un xat només teu no hi ha cap número de seguretat que comparar.'),
  iaia: parell('iaia', 'Xat amb la IAIA: no està xifrat d’extrem a extrem.'),
  public: parell('public', 'Xat públic: el pot llegir qualsevol persona que hi entre i no està xifrat d’extrem a extrem.'),
  sensePrimitives: parell('sensePrimitives', 'Des d’esta adreça no es pot xifrar. Obri Sóc de Poble a l’app o a socdepoble.org per a llegir i escriure en este xat.'),
  canviInesperat: parell('canviInesperat', 'Este xat ha canviat al servidor de manera inesperada. Per seguretat, no s’hi pot escriure.'),
  entitatPendent: parell('entitatPendent', 'Els xats amb entitats encara no es poden xifrar d’extrem a extrem: des d’este aparell, de moment, no s’hi pot escriure.'),
  clauCanviadaForta: parell('clauCanviadaForta', '{nom} té una clau de seguretat nova que la clau anterior no ha confirmat. Passa quan algú perd l’aparell i la frase, o si algú s’ha posat pel mig. Parla amb {nom} per a saber què ha passat.'),
  /* M02 · Canvis de clau d'un contacte (disseny E2EE §4.4, CS-01, D-05 a; marató
     261101_2143): l'alerta al fil, l'acceptació expressa i la clau pròpia. */
  clauCanviadaContinua: parell('clauCanviadaContinua', 'He parlat amb {nom}: continua'),
  clauCanviadaSuau: parell('clauCanviadaSuau', 'La clau de seguretat de {nom} ha canviat i ho ha confirmat la seua clau anterior.'),
  verificatBloquejat: parell('verificatBloquejat', 'Havies verificat {nom} i la seua clau ha canviat. Torna-la a verificar per a continuar.'),
  clauPropiaAlarma: parell('clauPropiaAlarma', 'S’ha registrat una clau nova per al teu compte que no és d’este aparell. Si no has sigut tu, avisa’ns.'),
  clauNovaSenseConfirmar: parell('clauNovaSenseConfirmar', 'Clau nova sense confirmar'),
  bifurcacio: parell('bifurcacio', 'Les claus d’este xat no coincidixen entre aparells. Compareu el número de seguretat.'),
  errorAccepta: parell('errorAccepta', 'No s’ha pogut confirmar la clau nova. Torna-ho a provar.'),
  numero: Object.freeze({
    titol: parell('numero.titol', 'Número de seguretat'),
    explica: parell('numero.explica', 'Si este número és igual al teu aparell i al de {nom}, ningú no ha canviat les vostres claus pel camí. Compareu-lo en persona o per telèfon.'),
    calculant: parell('numero.calculant', 'Calculant el número de seguretat…'),
    marca: parell('numero.marca', 'Marca com a verificat'),
    desmarca: parell('numero.desmarca', 'Lleva la marca de verificat'),
    verificat: parell('numero.verificat', 'Verificat: has comparat este número amb {nom}.'),
    senseClau: parell('numero.senseClau', '{nom} encara no ha activat els xats privats xifrats en cap aparell: encara no hi ha cap número que comparar.'),
    senseClausPropies: parell('numero.senseClausPropies', 'Este aparell encara no té les teues claus dels xats privats: encara no hi ha cap número que comparar.'),
    canviat: parell('numero.canviat', 'La clau de {nom} ha canviat mentre miraves el número. Compareu este número nou abans de marcar-lo.'),
    error: parell('numero.error', 'No s’ha pogut calcular el número de seguretat. Torna-ho a provar.'),
    errorMarca: parell('numero.errorMarca', 'No s’ha pogut desar la marca. Torna-ho a provar.'),
    grup: parell('numero.grup', 'En un grup, el número de seguretat es compara amb cada persona des del vostre xat privat.')
  })
});

/** Els estats possibles del xifratge d'una conversa. */
export const ESTAT_XIFRATGE = Object.freeze({
  apagat: 'apagat',
  noDisponible: 'no-disponible',
  public: 'public',
  iaia: 'iaia',
  bloquejat: 'bloquejat',
  sensePrimitives: 'sense-primitives',
  entitatPendent: 'entitat-pendent',
  xifrat: 'xifrat'
});

/* Un objecte congelat per combinació: la mateixa identitat entre pintades. */
const estat = (nom, { visible = true, potVerificar = false, text = null, nota = null } = {}) => Object.freeze({ estat: nom, visible, potVerificar, text, nota });
const APAGAT = estat(ESTAT_XIFRATGE.apagat, { visible: false });
const NO_DISPONIBLE = estat(ESTAT_XIFRATGE.noDisponible, { visible: false });
const PUBLIC = estat(ESTAT_XIFRATGE.public, { text: TEXTOS_XIFRATGE.public });
const IAIA = estat(ESTAT_XIFRATGE.iaia, { text: TEXTOS_XIFRATGE.iaia });
const BLOQUEJAT = estat(ESTAT_XIFRATGE.bloquejat, { text: TEXTOS_XIFRATGE.canviInesperat });
const SENSE_PRIMITIVES = estat(ESTAT_XIFRATGE.sensePrimitives, { text: TEXTOS_XIFRATGE.sensePrimitives });
const ENTITAT_PENDENT = estat(ESTAT_XIFRATGE.entitatPendent, { text: TEXTOS_XIFRATGE.entitatPendent });
const XIFRAT_DIRECTE = estat(ESTAT_XIFRATGE.xifrat, { potVerificar: true, text: TEXTOS_XIFRATGE.avisFil });
const XIFRAT_GRUP = estat(ESTAT_XIFRATGE.xifrat, { text: TEXTOS_XIFRATGE.avisFil, nota: TEXTOS_XIFRATGE.numero.grup });
const XIFRAT_PERSONAL = estat(ESTAT_XIFRATGE.xifrat, { text: TEXTOS_XIFRATGE.avisFilPersonal });

/**
 * L'estat del xifratge d'una conversa: { estat, visible, potVerificar, text, nota }.
 * `abast` és la forma d'ambitDelFil ({ xifrat, bloquejat, motiu, tipusFil }) que dona
 * el servei del decorador; `entornSegur`, si este entorn pot xifrar de veres.
 * visible: si el menú de la conversa porta «Xifratge i número de seguretat».
 * potVerificar: si hi ha número de seguretat (un directe entre dues persones).
 */
export function estatXifratgeDelFil({ actiu = false, abast = null, entornSegur = false } = {}) {
  if (actiu !== true) return APAGAT;
  if (!abast || typeof abast !== 'object') return NO_DISPONIBLE;
  const { motiu = null, tipusFil = null } = abast;
  if (motiu === 'mode-no-remot' || motiu === 'fil-sintetic') return NO_DISPONIBLE;
  if (abast.bloquejat === true) return BLOQUEJAT;
  if (abast.xifrat !== true) {
    if (motiu === 'public') return PUBLIC;
    if (motiu === 'iaia') return IAIA;
    return BLOQUEJAT;
  }
  if (entornSegur !== true) return SENSE_PRIMITIVES;
  if (tipusFil === 'entitat') return ENTITAT_PENDENT;
  if (tipusFil === 'grup') return XIFRAT_GRUP;
  if (tipusFil === 'directe' && motiu === 'directe-persona') return XIFRAT_DIRECTE;
  if (tipusFil === 'directe' && motiu === 'personal') return XIFRAT_PERSONAL;
  return BLOQUEJAT;
}
