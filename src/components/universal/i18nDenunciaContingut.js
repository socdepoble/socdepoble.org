/**
 * i18nDenunciaContingut.js — Diccionari 5 llengües i cua local auditada per al
 * procediment estructurat de notificació i retirada de continguts il·lícits
 * (LSSI Art. 16 / DSA Art. 16 · P0-114 Escut 2 · Onada R32.13).
 *
 * Ortogonal a `src/data/*` i als diccionaris de config (0 B a l'arrencada WP).
 */
import { getVal, setVal } from '../../config/storage.js';
import { normalitzaNfcSeguraUi } from '../../utils/normalitzaEntradaUi.js';

export const MOTIUS_DENUNCIA_LSSI = Object.freeze([
  'contingut_illicit',
  'suplantacio',
  'assetjament',
  'spam',
  'drets_autor'
]);

/* Onada R32.14 (Gauntlet) · El detall viatja amb el prefix [LSSI-16:<motiu>] (fins a 28 caràcters) i els dos ports
   en admeten 1.000: la persona en pot escriure 970, i res no es retalla en silenci. */
export const MAXIM_DETALL_DENUNCIA_LSSI = 970;
const MAXIM_DETALL_PORTS = 1000;
export const MAXIM_CUA_DENUNCIES_LOCALS = 50;
export const CLAU_CUA_DENUNCIES_LSSI = 'moderacio:cua_denuncies_lssi_v1';

const EQUIVALENCIA_MOTIU_PORT = Object.freeze({
  contingut_illicit: 'ofensiu',
  suplantacio: 'spam_frau',
  assetjament: 'ofensiu',
  spam: 'spam_frau',
  drets_autor: 'altre'
});

/** Traduïx el motiu estructurat LSSI Art. 16 al contracte base del port de moderació. */
export function motiuPortModeracio(motiuLssi) {
  return Object.hasOwn(EQUIVALENCIA_MOTIU_PORT, motiuLssi)
    ? EQUIVALENCIA_MOTIU_PORT[motiuLssi]
    : 'altre';
}

const RE_CONTROL_LSSI = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu;
const RE_SURROGAT_SOLT = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/**
 * Saneja en O(n) un text per al flux LSSI Art. 16 sense estavellar-se quan
 * `normalitzaNfcSeguraUi` retorna `null` (títol maliciós amb >64 marques Zalgo,
 * surrogat solt o cadena >1.024 caràcters). Evita que un anunci hostil puga
 * boicotejar el botó de denúncia provocant `null.trim()`.
 */
function textSanejatUiLssi(valor, maxLongitudNfc = 2304) {
  const cru = String(valor ?? '');
  const nfc = normalitzaNfcSeguraUi(cru, { maxLongitud: maxLongitudNfc });
  if (nfc !== null) {
    return nfc.replace(RE_CONTROL_LSSI, '').trim();
  }
  const benFormat = typeof cru.toWellFormed === 'function'
    ? cru.toWellFormed()
    : cru.replace(RE_SURROGAT_SOLT, '\uFFFD');
  return benFormat.replace(RE_CONTROL_LSSI, '').trim();
}

function retallaUtf16BenFormat(text, maxUnitats) {
  if (text.length <= maxUnitats) return text;
  let tall = text.slice(0, maxUnitats);
  const darrerCodi = tall.charCodeAt(tall.length - 1);
  if (darrerCodi >= 0xd800 && darrerCodi <= 0xdbff) {
    tall = tall.slice(0, -1);
  }
  return tall;
}

/** Construeix el detall auditat amb prefix LSSI-16; amb el detall dins del límit, mai passa dels 1.000 dels ports ni trenca emojis UTF-16. */
export function detallPerAlPortModeracio(motiuLssi, detallCru) {
  const net = textSanejatUiLssi(detallCru, 2304);
  const prefix = `[LSSI-16:${motiuLssi}]`;
  if (!net) return prefix;
  const combinat = `${prefix} ${net}`;
  return retallaUtf16BenFormat(combinat, MAXIM_DETALL_PORTS);
}

function esEntradaCuaValida(item) {
  return Boolean(
    item &&
    typeof item === 'object' &&
    typeof item.tipus === 'string' &&
    typeof item.recursId === 'string' &&
    MOTIUS_DENUNCIA_LSSI.includes(item.motiu)
  );
}

/** Llig la cua local auditada de notificacions LSSI Art. 16 en este dispositiu. */
export function lligCuaDenunciesLocals() {
  const cru = getVal(CLAU_CUA_DENUNCIES_LSSI, []);
  if (!Array.isArray(cru)) return [];
  return cru.filter(esEntradaCuaValida);
}

/**
 * Registra una notificació estructurada LSSI Art. 16 a la cua local auditada,
 * deduplicant per `(tipus, recursId, motiu)` i mantenint un sostre FIFO de 50 entrades.
 */
export function desaDenunciaEnCuaLocal({
  tipus,
  recursId,
  titol = '',
  motiu,
  detall = '',
  estatSincronitzacio = 'cua-local',
  operacioId = null,
  ara = () => new Date().toISOString()
}) {
  const tipusNet = String(tipus || '').trim();
  const idNet = String(recursId || '').trim();
  if (!tipusNet || !idNet || !MOTIUS_DENUNCIA_LSSI.includes(motiu)) {
    const err = new Error('Objectiu o motiu invàlid');
    err.code = 'objectiu-invalid';
    throw err;
  }
  const detallNet = textSanejatUiLssi(detall, 2304);
  if (detallNet.length > MAXIM_DETALL_DENUNCIA_LSSI) {
    const err = new Error('Detall massa llarg');
    err.code = 'detall-massa-llarg';
    throw err;
  }

  const actuals = lligCuaDenunciesLocals();
  const indexExistent = actuals.findIndex(
    (item) => item.tipus === tipusNet && item.recursId === idNet && item.motiu === motiu
  );

  const instant = ara();
  if (indexExistent >= 0) {
    const previ = actuals[indexExistent];
    /* Costura R32.14 · El UUID d'operació d'un avís es conserva en cada replay
       del mateix text mentre el servidor no l'ha confirmat; un detall nou, o un
       avís nou després d'una confirmació (Gauntlet R32.14), pren el UUID nou. */
    const mateixAvis = previ.detall === detallNet;
    const replay = mateixAvis && previ.operacioId && previ.estatSincronitzacio !== 'servidor';
    const actualitzat = Object.freeze({
      ...previ,
      detall: detallNet,
      operacioId: replay ? previ.operacioId : (operacioId || (mateixAvis ? previ.operacioId : null) || null),
      estatSincronitzacio: previ.estatSincronitzacio === 'servidor' && mateixAvis ? 'servidor' : estatSincronitzacio,
      darrerIntentAl: instant
    });
    const novaLlista = actuals.map((it, idx) => (idx === indexExistent ? actualitzat : it));
    /* Gauntlet R32.14 · `desada` diu si el navegador l'ha escrita de veres (setVal torna false sense emmagatzematge). */
    const desada = setVal(CLAU_CUA_DENUNCIES_LSSI, novaLlista);
    return { entrada: actualitzat, repetida: true, desada };
  }

  const titolNet = Array.from(textSanejatUiLssi(titol, 2304)).slice(0, 160).join('');
  const entrada = Object.freeze({
    denunciaId: `lssi16-${Date.now().toString(36)}-${actuals.length + 1}`,
    norma: 'LSSI-art-16',
    tipus: tipusNet,
    recursId: idNet,
    titol: titolNet,
    motiu,
    detall: detallNet,
    operacioId: operacioId || null,
    estatSincronitzacio,
    creatAl: instant,
    darrerIntentAl: instant
  });

  const retallada = [entrada, ...actuals].slice(0, MAXIM_CUA_DENUNCIES_LOCALS);
  const desada = setVal(CLAU_CUA_DENUNCIES_LSSI, retallada);
  return { entrada, repetida: false, desada };
}

export const TEXTOS_DENUNCIA_CONTINGUT = Object.freeze({
  ca: Object.freeze({
    botoObrirContingut: 'Notifica contingut il·lícit (LSSI)',
    botoObrirPerfil: 'Notifica perfil o contingut il·lícit (LSSI)',
    titolContingut: 'Notificació de contingut il·lícit (LSSI art. 16)',
    titolPerfil: 'Notificació sobre perfil públic (LSSI art. 16)',
    descripcio: 'Procediment de coneixement efectiu i retirada diligent. Una persona de l’equip de moderació de Sóc de Poble revisa cada avís sense revelar la teua identitat a qui publica.',
    llegendaMotius: 'Motiu estructurat de la notificació',
    estatBuitAjuda: 'Selecciona un dels cinc motius legals de dalt per a activar l’enviament de la notificació.',
    detallEtiqueta: 'Fets o context verificable (opcional)',
    detallAjuda: 'Fins a 970 caràcters. Indica per què consideres que el contingut vulnera la llei o les normes.',
    carregant: 'Registrant la notificació…',
    envia: 'Envia la notificació',
    cancela: 'Cancel·la',
    tanca: 'Tanca',
    bloquejaTambe: 'Bloqueja també {nom}',
    exitServidor: 'Notificació rebuda al servidor de Sóc de Poble. Una persona responsable la revisarà de forma diligent.',
    exitRepetida: 'Ja hi havia una notificació teua pendent sobre este contingut. Continua pendent de revisió humana.',
    parcialCuaLocal: 'Notificació desada només en este dispositiu: el servidor de Sóc de Poble no l’ha confirmada. Torna-ho a provar quan tingues connexió o escriu a socdepoble@socdepoble.org per a urgències legals.',
    permisDenegat: 'No es pot enviar una notificació d’il·licitud sobre el teu propi perfil o sobre pàgines institucionals del sistema.',
    errorMotiu: 'Tria un dels cinc motius estructurats abans d’enviar.',
    errorDetallLlarg: 'L’explicació supera el màxim permés de 970 caràcters.',
    errorLimit: 'Has enviat massa notificacions seguides. Espera uns minuts abans de tornar-ho a provar.',
    errorObjectiu: 'L’identificador del contingut o perfil no és vàlid.',
    errorGeneral: 'No s’ha pogut registrar la notificació ara mateix. Revisa les dades i torna-ho a provar.',
    motius: Object.freeze({
      contingut_illicit: Object.freeze({
        etiqueta: 'Contingut il·lícit o perillós',
        ajuda: 'Delictes, violència greu, incitació a l’odi, explotació o risc per a la seguretat pública.'
      }),
      suplantacio: Object.freeze({
        etiqueta: 'Suplantació d’identitat',
        ajuda: 'Es fa passar per una altra persona, comerç, associació o institució sense autorització.'
      }),
      assetjament: Object.freeze({
        etiqueta: 'Assetjament, amenaces o intimitat',
        ajuda: 'Insults reiterats, coaccions, difamació o difusió de dades personals sense permís.'
      }),
      spam: Object.freeze({
        etiqueta: 'Spam, estafa o frau comercial',
        ajuda: 'Publicitat massiva no sol·licitada, pesca de credencials o engany econòmic.'
      }),
      drets_autor: Object.freeze({
        etiqueta: 'Vulneració de drets d’autor',
        ajuda: 'Còpia d’obres, fotografies o textos protegits sense llicència ni atribució.'
      })
    })
  }),
  es: Object.freeze({
    botoObrirContingut: 'Notificar contenido ilícito (LSSI)',
    botoObrirPerfil: 'Notificar perfil o contenido ilícito (LSSI)',
    titolContingut: 'Notificación de contenido ilícito (LSSI art. 16)',
    titolPerfil: 'Notificación sobre perfil público (LSSI art. 16)',
    descripcio: 'Procedimiento de conocimiento efectivo y retirada diligente. Una persona del equipo de moderación de Sóc de Poble revisa cada aviso sin revelar tu identidad a quien publica.',
    llegendaMotius: 'Motivo estructurado de la notificación',
    estatBuitAjuda: 'Selecciona uno de los cinco motivos legales superiores para activar el envío de la notificación.',
    detallEtiqueta: 'Hechos o contexto verificable (opcional)',
    detallAjuda: 'Hasta 970 caracteres. Indica por qué consideras que el contenido vulnera la ley o las normas.',
    carregant: 'Registrando la notificación…',
    envia: 'Enviar notificación',
    cancela: 'Cancelar',
    tanca: 'Cerrar',
    bloquejaTambe: 'Bloquear también a {nom}',
    exitServidor: 'Notificación recibida en el servidor de Sóc de Poble. Una persona responsable la revisará de forma diligente.',
    exitRepetida: 'Ya había una notificación tuya pendiente sobre este contenido. Sigue pendiente de revisión humana.',
    parcialCuaLocal: 'Notificación guardada solo en este dispositivo: el servidor de Sóc de Poble no la ha confirmado. Vuelve a intentarlo cuando tengas conexión o escribe a socdepoble@socdepoble.org para urgencias legales.',
    permisDenegat: 'No se puede enviar una notificación de ilicitud sobre tu propio perfil o sobre páginas institucionales del sistema.',
    errorMotiu: 'Elige uno de los cinco motivos estructurados antes de enviar.',
    errorDetallLlarg: 'La explicación supera el máximo permitido de 970 caracteres.',
    errorLimit: 'Has enviado demasiadas notificaciones seguidas. Espera unos minutos antes de volver a intentarlo.',
    errorObjectiu: 'El identificador del contenido o perfil no es válido.',
    errorGeneral: 'No se ha podido registrar la notificación ahora mismo. Revisa los datos y vuelve a intentarlo.',
    motius: Object.freeze({
      contingut_illicit: Object.freeze({
        etiqueta: 'Contenido ilícito o peligroso',
        ajuda: 'Delitos, violencia grave, incitación al odio, explotación o riesgo para la seguridad pública.'
      }),
      suplantacio: Object.freeze({
        etiqueta: 'Suplantación de identidad',
        ajuda: 'Se hace pasar por otra persona, comercio, asociación o institución sin autorización.'
      }),
      assetjament: Object.freeze({
        etiqueta: 'Acoso, amenazas o intimidad',
        ajuda: 'Insultos reiterados, coacciones, difamación o difusión de datos personales sin permiso.'
      }),
      spam: Object.freeze({
        etiqueta: 'Spam, estafa o fraude comercial',
        ajuda: 'Publicidad masiva no solicitada, robo de credenciales o engaño económico.'
      }),
      drets_autor: Object.freeze({
        etiqueta: 'Vulneración de derechos de autor',
        ajuda: 'Copia de obras, fotografías o textos protegidos sin licencia ni atribución.'
      })
    })
  }),
  en: Object.freeze({
    botoObrirContingut: 'Report unlawful content (LSSI)',
    botoObrirPerfil: 'Report unlawful profile or content (LSSI)',
    titolContingut: 'Unlawful content notice (LSSI Art. 16)',
    titolPerfil: 'Public profile notice (LSSI Art. 16)',
    descripcio: 'Notice-and-action procedure for diligent removal. A person on the Sóc de Poble moderation team reviews every report without disclosing your identity to the author.',
    llegendaMotius: 'Structured reason for this notice',
    estatBuitAjuda: 'Select one of the five legal grounds above to enable submitting this notice.',
    detallEtiqueta: 'Verifiable facts or context (optional)',
    detallAjuda: 'Up to 970 characters. Explain why you believe this content breaches the law or community rules.',
    carregant: 'Recording notice…',
    envia: 'Submit notice',
    cancela: 'Cancel',
    tanca: 'Close',
    bloquejaTambe: 'Also block {nom}',
    exitServidor: 'Notice received on the Sóc de Poble server. A human moderator will review it diligently.',
    exitRepetida: 'You already had a pending notice about this content. It is still awaiting human review.',
    parcialCuaLocal: 'Notice saved on this device only: the Sóc de Poble server has not confirmed it. Try again when you are online or email socdepoble@socdepoble.org for urgent legal notices.',
    permisDenegat: 'You cannot submit an unlawfulness notice against your own profile or institutional system pages.',
    errorMotiu: 'Choose one of the five structured reasons before submitting.',
    errorDetallLlarg: 'Your explanation exceeds the 970-character maximum.',
    errorLimit: 'You have sent too many notices in a short time. Please wait a few minutes and try again.',
    errorObjectiu: 'The content or profile identifier is not valid.',
    errorGeneral: 'Could not record the notice right now. Check the details and try again.',
    motius: Object.freeze({
      contingut_illicit: Object.freeze({
        etiqueta: 'Unlawful or dangerous content',
        ajuda: 'Offences, severe violence, hate speech, exploitation, or public safety risks.'
      }),
      suplantacio: Object.freeze({
        etiqueta: 'Impersonation',
        ajuda: 'Pretending to be another person, local business, association, or institution without permission.'
      }),
      assetjament: Object.freeze({
        etiqueta: 'Harassment, threats, or privacy breach',
        ajuda: 'Repeated abuse, coercion, defamation, or sharing private personal data without consent.'
      }),
      spam: Object.freeze({
        etiqueta: 'Spam, scam, or commercial fraud',
        ajuda: 'Unsolicited bulk advertising, phishing, or financial deception.'
      }),
      drets_autor: Object.freeze({
        etiqueta: 'Copyright infringement',
        ajuda: 'Copying protected works, photographs, or texts without a licence or attribution.'
      })
    })
  }),
  eu: Object.freeze({
    botoObrirContingut: 'Jakinarazi legez kanpoko edukia (LSSI)',
    botoObrirPerfil: 'Jakinarazi legez kanpoko profila edo edukia (LSSI)',
    titolContingut: 'Legez kanpoko edukiaren jakinarazpena (LSSI 16. art.)',
    titolPerfil: 'Profil publikoari buruzko jakinarazpena (LSSI 16. art.)',
    descripcio: 'Benetako ezagutza eta erretiratze arduratsurako prozedura. Sóc de Pobleren moderazio-taldeko pertsona batek abisu bakoitza berrikusten du, zure nortasuna egileari jakinarazi gabe.',
    llegendaMotius: 'Jakinarazpenaren arrazoi egituratua',
    estatBuitAjuda: 'Hautatu goiko bost legezko arrazoietako bat jakinarazpenaren bidalketa aktibatzeko.',
    detallEtiqueta: 'Gertakariak edo testuinguru egiaztagarria (aukerakoa)',
    detallAjuda: 'Gehienez 970 karaktere. Azaldu zergatik uste duzun edukiak legea edo arauak urratzen dituela.',
    carregant: 'Jakinarazpena erregistratzen…',
    envia: 'Bidali jakinarazpena',
    cancela: 'Utzi',
    tanca: 'Itxi',
    bloquejaTambe: 'Blokeatu {nom} ere',
    exitServidor: 'Jakinarazpena Sóc de Pobleren zerbitzarian jaso da. Giza arduradun batek arduraz berrikusiko du.',
    exitRepetida: 'Eduki honi buruzko zure jakinarazpen bat zain zegoen jada. Giza berrikuspenaren zain jarraitzen du.',
    parcialCuaLocal: 'Jakinarazpena gailu honetan bakarrik gorde da: Sóc de Pobleren zerbitzariak ez du baieztatu. Saiatu berriro konexioa duzunean, edo idatzi socdepoble@socdepoble.org helbidera legezko larrialdietarako.',
    permisDenegat: 'Ezin da legez kanpokotasun-jakinarazpenik bidali zure profil propioari edo sistemaren orri instituzionalei buruz.',
    errorMotiu: 'Aukeratu bost arrazoi egituratuetako bat bidali aurretik.',
    errorDetallLlarg: 'Azalpenak baimendutako 970 karaktereko muga gainditzen du.',
    errorLimit: 'Jakinarazpen gehiegi bidali dituzu jarraian. Itxaron minutu batzuk berriro saiatu aurretik.',
    errorObjectiu: 'Edukiaren edo profilaren identifikatzailea ez da baliozkoa.',
    errorGeneral: 'Ezin izan da jakinarazpena erregistratu oraintxe bertan. Berrikusi datuak eta saiatu berriro.',
    motius: Object.freeze({
      contingut_illicit: Object.freeze({
        etiqueta: 'Legez kanpoko edo eduki arriskutsua',
        ajuda: 'Delituak, indarkeria larria, gorroto-diskurtsoa, esplotazioa edo segurtasun publikorako arriskua.'
      }),
      suplantacio: Object.freeze({
        etiqueta: 'Nortasun-ordezkapena',
        ajuda: 'Beste pertsona, saltoki, elkarte edo erakunde baten itxura egitea baimenik gabe.'
      }),
      assetjament: Object.freeze({
        etiqueta: 'Jazarpena, mehatxuak edo intimitatea',
        ajuda: 'Irain errepikatuak, derrigortzeak, difamazioa edo datu pertsonalak baimenik gabe zabaltzea.'
      }),
      spam: Object.freeze({
        etiqueta: 'Spam-a, iruzurra edo engainu komertziala',
        ajuda: 'Eskatu gabeko publizitate masiboa, kredentzialen lapurreta edo iruzur ekonomikoa.'
      }),
      drets_autor: Object.freeze({
        etiqueta: 'Egile-eskubideen urraketa',
        ajuda: 'Babestutako lanak, argazkiak edo testuak lizentziarik edo aipamenik gabe kopiatzea.'
      })
    })
  }),
  gl: Object.freeze({
    botoObrirContingut: 'Notificar contido ilícito (LSSI)',
    botoObrirPerfil: 'Notificar perfil ou contido ilícito (LSSI)',
    titolContingut: 'Notificación de contido ilícito (LSSI art. 16)',
    titolPerfil: 'Notificación sobre perfil público (LSSI art. 16)',
    descripcio: 'Procedemento de coñecemento efectivo e retirada dilixente. Unha persoa do equipo de moderación de Sóc de Poble revisa cada aviso sen revelar a túa identidade a quen publica.',
    llegendaMotius: 'Motivo estruturado da notificación',
    estatBuitAjuda: 'Selecciona un dos cinco motivos legais superiores para activar o envío da notificación.',
    detallEtiqueta: 'Feitos ou contexto verificable (opcional)',
    detallAjuda: 'Ata 970 caracteres. Indica por que consideras que o contido vulnera a lei ou as normas.',
    carregant: 'Rexistrando a notificación…',
    envia: 'Enviar notificación',
    cancela: 'Cancelar',
    tanca: 'Pechar',
    bloquejaTambe: 'Bloquear tamén a {nom}',
    exitServidor: 'Notificación recibida no servidor de Sóc de Poble. Unha persoa responsable revisaraa de forma dilixente.',
    exitRepetida: 'Xa había unha notificación túa pendente sobre este contido. Segue pendente de revisión humana.',
    parcialCuaLocal: 'Notificación gardada só neste dispositivo: o servidor de Sóc de Poble non a confirmou. Téntao de novo cando teñas conexión ou escribe a socdepoble@socdepoble.org para urxencias legais.',
    permisDenegat: 'Non se pode enviar unha notificación de ilicitude sobre o teu propio perfil ou sobre páxinas institucionais do sistema.',
    errorMotiu: 'Escolle un dos cinco motivos estruturados antes de enviar.',
    errorDetallLlarg: 'A explicación supera o máximo permitido de 970 caracteres.',
    errorLimit: 'Enviaches demasiadas notificacións seguidas. Agarda uns minutos antes de tentalo de novo.',
    errorObjectiu: 'O identificador do contido ou perfil non é válido.',
    errorGeneral: 'Non se puido rexistrar a notificación agora mesmo. Revisa os datos e téntao de novo.',
    motius: Object.freeze({
      contingut_illicit: Object.freeze({
        etiqueta: 'Contido ilícito ou perigoso',
        ajuda: 'Delitos, violencia grave, incitación ao odio, explotación ou risco para a seguridade pública.'
      }),
      suplantacio: Object.freeze({
        etiqueta: 'Suplantación de identidade',
        ajuda: 'Faise pasar por outra persoa, comercio, asociación ou institución sen autorización.'
      }),
      assetjament: Object.freeze({
        etiqueta: 'Acoso, ameazas ou intimidade',
        ajuda: 'Insultos reiterados, coaccións, difamación ou difusión de datos persoais sen permiso.'
      }),
      spam: Object.freeze({
        etiqueta: 'Spam, estafa ou fraude comercial',
        ajuda: 'Publicidade masiva non solicitada, roubo de credenciais ou engano económico.'
      }),
      drets_autor: Object.freeze({
        etiqueta: 'Vulneración de dereitos de autor',
        ajuda: 'Copia de obras, fotografías ou textos protexidos sen licenza nin atribución.'
      })
    })
  })
});

export function textosDenunciaContingut(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(TEXTOS_DENUNCIA_CONTINGUT, codi)
    ? TEXTOS_DENUNCIA_CONTINGUT[codi]
    : TEXTOS_DENUNCIA_CONTINGUT.ca;
}
