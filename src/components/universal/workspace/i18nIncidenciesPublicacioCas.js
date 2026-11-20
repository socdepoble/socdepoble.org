/**
 * i18nIncidenciesPublicacioCas.js — Diccionari en les 5 llengües (ca, es, en, eu, gl)
 * per al panell de resolució d'incidències durables de la cua CAS de publicacions
 * (Onada R32.17 · Lot 01 · D-R32.15-1).
 *
 * Complix estrictament la Llei 32: sempre «el servidor de Sóc de Poble», sense cap altra
 * denominació del servidor ni cap adjectiu de sobirania.
 */

export const CODIS_IDIOMA_INCIDENCIES_CAS = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export const DICCIONARI_INCIDENCIES_CAS = Object.freeze({
  ca: Object.freeze({
    regioAria: 'Incidències pendents de sincronització al catàleg',
    titolPanell: 'Publicacions que esperen la teua confirmació',
    resumPanell: 'S’han apartat temporalment de la cua automàtica perquè no encallen la resta de referències. El teu esborrany local està guardat en aquest dispositiu.',
    audienciaPublica: 'Mur públic',
    audienciaPrivada: 'Nota privada',
    etiquetaCodiConflicte: 'Canvi recent al servidor',
    etiquetaCodiDesconeguda: 'Versió anterior sense segell',
    etiquetaCodiRebuig: 'Rebuig permanent (SDP-PUB-CAS-001/002/004/005)',
    explicacioConflicte: 'El servidor de Sóc de Poble té ara una versió més recent d’aquesta publicació (editada des d’un altre lloc o sessió). Revisa-la i confirma si vols aplicar-hi el teu canvi local.',
    explicacioDesconeguda: 'Aquesta referència prové d’una confirmació anterior sense testimoni de versió. Comprova la versió actual al servidor de Sóc de Poble abans de reintentar.',
    explicacioRebuig: 'El servidor de Sóc de Poble ha rebutjat aquesta operació (canvi d’autoria, contingut no publicable, moderació o codi d’operació divergent: SDP-PUB-CAS-001/002/004/005) i l’ha tret de la cua automàtica.',
    avisRetiradaMur: 'Atenció (retirada del Mur en espera): volies retirar aquesta referència del Mur públic, però mentre no resolgues la incidència el servidor de Sóc de Poble conserva publicada l’última versió pública.',
    estatServidorLlegitExisteix: 'El servidor de Sóc de Poble conserva una fila activa amb data de versió verificada:',
    estatServidorLlegitNoExisteix: ' Aquesta fila ja no existeix al servidor de Sóc de Poble; si la reintentes, es publicarà com a creació nova.',
    estatServidorPendentLectura: 'Encara no s’ha pogut llegir la versió actual del servidor de Sóc de Poble. Prem «Comprova el servidor» abans de resoldre.',
    botoReintentaVersioActual: 'Reintenta amb la versió actual del servidor',
    botoPublicaComNova: 'Torna a publicar com a creació nova',
    botoComprovaServidor: 'Comprova el servidor',
    resolent: 'Sincronitzant…',
    comprovant: 'Comprovant…',
    exitResolucio: 'Incidència resolta i reintent enviat al servidor de Sóc de Poble.',
    errorSenseIncidencia: 'Aquesta incidència ja s’havia resolt o tancat.',
    errorVersioInvalida: 'Falta llegir una versió vàlida del servidor de Sóc de Poble abans de continuar.',
    errorCasNoDisponible: 'El control de versions de publicacions no està actiu en aquesta configuració.',
    errorSensePermis: 'Cal tindre la sessió activa amb permisos d’edició per a resoldre la incidència.',
    errorGeneral: 'No s’ha pogut completar el reintent amb el servidor de Sóc de Poble. El teu esborrany local continua guardat.',
    senseTitol: 'Referència sense títol'
  }),
  es: Object.freeze({
    regioAria: 'Incidencias pendientes de sincronización en el catálogo',
    titolPanell: 'Publicaciones que esperan tu confirmación',
    resumPanell: 'Se han apartado temporalmente de la cola automática para no bloquear el resto de referencias. Tu borrador local sigue guardado en este dispositivo.',
    audienciaPublica: 'Muro público',
    audienciaPrivada: 'Nota privada',
    etiquetaCodiConflicte: 'Cambio reciente en el servidor',
    etiquetaCodiDesconeguda: 'Versión previa sin sello',
    etiquetaCodiRebuig: 'Rechazo permanente (SDP-PUB-CAS-001/002/004/005)',
    explicacioConflicte: 'El servidor de Sóc de Poble tiene ahora una versión más reciente de esta publicación (editada desde otro lugar o sesión). Revísala y confirma si quieres aplicar tu cambio local.',
    explicacioDesconeguda: 'Esta referencia procede de una confirmación previa sin testigo de versión. Comprueba la versión actual en el servidor de Sóc de Poble antes de reintentar.',
    explicacioRebuig: 'El servidor de Sóc de Poble ha rechazado esta operación (cambio de autoría, contenido no publicable, moderación o código de operación divergente: SDP-PUB-CAS-001/002/004/005) y la ha retirado de la cola automática.',
    avisRetiradaMur: 'Atención (retirada del Muro en espera): querías retirar esta referencia del Muro público, pero mientras no resuelvas la incidencia el servidor de Sóc de Poble conserva publicada la última versión pública.',
    estatServidorLlegitExisteix: 'El servidor de Sóc de Poble conserva una fila activa con fecha de versión verificada:',
    estatServidorLlegitNoExisteix: 'Esta fila ya no existe en el servidor de Sóc de Poble; si reintentas, se publicará como creación nueva.',
    estatServidorPendentLectura: 'Aún no se ha podido leer la versión actual del servidor de Sóc de Poble. Pulsa «Comprobar el servidor» antes de resolver.',
    botoReintentaVersioActual: 'Reintentar con la versión actual del servidor',
    botoPublicaComNova: 'Volver a publicar como creación nueva',
    botoComprovaServidor: 'Comprobar el servidor',
    resolent: 'Sincronizando…',
    comprovant: 'Comprobando…',
    exitResolucio: 'Incidencia resuelta y reintento enviado al servidor de Sóc de Poble.',
    errorSenseIncidencia: 'Esta incidencia ya se había resuelto o cerrado.',
    errorVersioInvalida: 'Falta leer una versión válida del servidor de Sóc de Poble antes de continuar.',
    errorCasNoDisponible: 'El control de versiones de publicaciones no está activo en esta configuración.',
    errorSensePermis: 'Necesitas una sesión activa con permisos de edición para resolver la incidencia.',
    errorGeneral: 'No se ha podido completar el reintento con el servidor de Sóc de Poble. Tu borrador local sigue guardado.',
    senseTitol: 'Referencia sin título'
  }),
  en: Object.freeze({
    regioAria: 'Pending catalogue synchronization issues',
    titolPanell: 'Publications awaiting your confirmation',
    resumPanell: 'They have been stepped aside from the automatic queue so other references keep moving. Your local draft remains safely saved on this device.',
    audienciaPublica: 'Public wall',
    audienciaPrivada: 'Private note',
    etiquetaCodiConflicte: 'Recent change on server',
    etiquetaCodiDesconeguda: 'Previous version without token',
    etiquetaCodiRebuig: 'Permanent rejection (SDP-PUB-CAS-001/002/004/005)',
    explicacioConflicte: 'The Sóc de Poble server currently holds a newer version of this publication (edited elsewhere). Review it and confirm whether to apply your local change on top of it.',
    explicacioDesconeguda: 'This reference comes from an earlier acknowledgement without a version token. Check the current version on the Sóc de Poble server before retrying.',
    explicacioRebuig: 'The Sóc de Poble server rejected this operation (authorship mismatch, non-publishable content, moderation withdrawal, or divergent operation hash: SDP-PUB-CAS-001/002/004/005) and removed it from automatic retries.',
    avisRetiradaMur: 'Notice (pending Wall withdrawal): you requested removing this reference from the Public Wall, but until you resolve this issue the Sóc de Poble server keeps the latest public version online.',
    estatServidorLlegitExisteix: 'The Sóc de Poble server holds an active row with verified version timestamp:',
    estatServidorLlegitNoExisteix: 'This row no longer exists on the Sóc de Poble server; retrying will publish it as a brand-new creation.',
    estatServidorPendentLectura: 'The current version on the Sóc de Poble server has not been read yet. Press “Check server” before resolving.',
    botoReintentaVersioActual: 'Retry with current server version',
    botoPublicaComNova: 'Publish again as a new creation',
    botoComprovaServidor: 'Check server',
    resolent: 'Synchronizing…',
    comprovant: 'Checking…',
    exitResolucio: 'Issue resolved and retry sent to the Sóc de Poble server.',
    errorSenseIncidencia: 'This issue was already resolved or closed.',
    errorVersioInvalida: 'A valid version from the Sóc de Poble server must be read before continuing.',
    errorCasNoDisponible: 'Versioned publication mode is not active in this configuration.',
    errorSensePermis: 'An active session with editing permissions is required to resolve this issue.',
    errorGeneral: 'Could not complete the retry with the Sóc de Poble server. Your local draft remains saved.',
    senseTitol: 'Untitled reference'
  }),
  eu: Object.freeze({
    regioAria: 'Katalogoan sinkronizatzeko zain dauden gorabeherak',
    titolPanell: 'Zure baieztapenaren zain dauden argitalpenak',
    resumPanell: 'Ilara automatikotik aldi baterako apartatu dira gainerako erreferentziak ez blokeatzeko. Zure zirriborro lokala gailu honetan gordeta dago.',
    audienciaPublica: 'Horma publikoa',
    audienciaPrivada: 'Ohar pribatua',
    etiquetaCodiConflicte: 'Aldaketa berria zerbitzarian',
    etiquetaCodiDesconeguda: 'Zigilu gabeko aurreko bertsioa',
    etiquetaCodiRebuig: 'Uko iraunkorra (SDP-PUB-CAS-001/002/004/005)',
    explicacioConflicte: 'Sóc de Pobleren zerbitzariak argitalpen honen bertsio berriago bat du orain (beste saio edo gailu batetik editatua). Berrikusi eta baieztatu zure aldaketa lokala aplikatu nahi duzun.',
    explicacioDesconeguda: 'Erreferentzia hau bertsio-lekukorik gabeko aurreko baieztapen batetik dator. Egiaztatu egungo bertsioa Sóc de Pobleren zerbitzarian berriro saiatu aurretik.',
    explicacioRebuig: 'Sóc de Pobleren zerbitzariak eragiketa hau baztertu du (egiletza-aldaketa, argitaratu ezin den edukia, moderazioa edo eragiketa-kode desberdina: SDP-PUB-CAS-001/002/004/005) eta ilara automatikotik atera du.',
    avisRetiradaMur: 'Adi (Hormatik kentzea zain): erreferentzia hau Horma publikotik kendu nahi zenuen, baina gorabehera ebatzi arte Sóc de Pobleren zerbitzariak azken bertsio publikoa argitaratuta mantentzen du.',
    estatServidorLlegitExisteix: 'Sóc de Pobleren zerbitzariak errenkada aktibo bat du egiaztatutako bertsio-datarekin:',
    estatServidorLlegitNoExisteix: 'Errenkada hau ez dago jada Sóc de Pobleren zerbitzarian; berriro saiatzean sorkuntza berri gisa argitaratuko da.',
    estatServidorPendentLectura: 'Oraindik ezin izan da Sóc de Pobleren zerbitzariko egungo bertsioa irakurri. Sakatu «Egiaztatu zerbitzaria» ebatzi aurretik.',
    botoReintentaVersioActual: 'Saiatu berriro zerbitzariko egungo bertsioarekin',
    botoPublicaComNova: 'Argitaratu berriro sorkuntza berri gisa',
    botoComprovaServidor: 'Egiaztatu zerbitzaria',
    resolent: 'Sinkronizatzen…',
    comprovant: 'Egiaztatzen…',
    exitResolucio: 'Gorabehera ebatzita eta saiakera berria Sóc de Pobleren zerbitzarira bidalita.',
    errorSenseIncidencia: 'Gorabehera hau dagoeneko ebatzita edo itxita zegoen.',
    errorVersioInvalida: 'Jarraitu aurretik Sóc de Pobleren zerbitzariko baliozko bertsio bat irakurri behar da.',
    errorCasNoDisponible: 'Argitalpenen bertsio-kontrola ez dago aktibo konfigurazio honetan.',
    errorSensePermis: 'Editatzeko baimena duen saio aktiboa behar da gorabehera ebazteko.',
    errorGeneral: 'Ezin izan da Sóc de Pobleren zerbitzariarekiko saiakera osatu. Zure zirriborro lokala gordeta dago.',
    senseTitol: 'Izenbururik gabeko erreferentzia'
  }),
  gl: Object.freeze({
    regioAria: 'Incidencias pendentes de sincronización no catálogo',
    titolPanell: 'Publicacións que agardan a túa confirmación',
    resumPanell: 'Apartáronse temporalmente da cola automática para non bloquear o resto de referencias. O teu borrador local segue gardado neste dispositivo.',
    audienciaPublica: 'Muro público',
    audienciaPrivada: 'Nota privada',
    etiquetaCodiConflicte: 'Cambio recente no servidor',
    etiquetaCodiDesconeguda: 'Versión previa sen selo',
    etiquetaCodiRebuig: 'Rexeitamento permanente (SDP-PUB-CAS-001/002/004/005)',
    explicacioConflicte: 'O servidor de Sóc de Poble ten agora unha versión máis recente desta publicación (editada dende outro lugar ou sesión). Revísaa e confirma se queres aplicar o teu cambio local.',
    explicacioDesconeguda: 'Esta referencia procede dunha confirmación previa sen testemuña de versión. Comproba a versión actual no servidor de Sóc de Poble antes de tentar de novo.',
    explicacioRebuig: 'O servidor de Sóc de Poble rexeitou esta operación (cambio de autoría, contido non publicable, moderación ou código de operación diverxente: SDP-PUB-CAS-001/002/004/005) e retirouse da cola automática.',
    avisRetiradaMur: 'Atención (retirada do Muro en espera): querías retirar esta referencia do Muro público, pero mentres non resolvas a incidencia o servidor de Sóc de Poble conserva publicada a última versión pública.',
    estatServidorLlegitExisteix: 'O servidor de Sóc de Poble conserva unha fila activa con data de versión verificada:',
    estatServidorLlegitNoExisteix: 'Esta fila xa non existe no servidor de Sóc de Poble; se tentas de novo, publicarase como creación nova.',
    estatServidorPendentLectura: 'Aínda non se puido ler a versión actual do servidor de Sóc de Poble. Preme «Comprobar o servidor» antes de resolver.',
    botoReintentaVersioActual: 'Tentar de novo coa versión actual do servidor',
    botoPublicaComNova: 'Volver publicar como creación nova',
    botoComprovaServidor: 'Comprobar o servidor',
    resolent: 'Sincronizando…',
    comprovant: 'Comprobando…',
    exitResolucio: 'Incidencia resolta e novo intento enviado ao servidor de Sóc de Poble.',
    errorSenseIncidencia: 'Esta incidencia xa estaba resolta ou pechada.',
    errorVersioInvalida: 'Falta ler unha versión válida do servidor de Sóc de Poble antes de continuar.',
    errorCasNoDisponible: 'O control de versións de publicacións non está activo nesta configuración.',
    errorSensePermis: 'Cómpre unha sesión activa con permisos de edición para resolver a incidencia.',
    errorGeneral: 'Non se puido completar o intento co servidor de Sóc de Poble. O teu borrador local segue gardado.',
    senseTitol: 'Referencia sen título'
  })
});

export function textosIncidenciesCas(idioma) {
  const codi = String(idioma || 'ca').slice(0, 2).toLowerCase();
  return DICCIONARI_INCIDENCIES_CAS[codi] || DICCIONARI_INCIDENCIES_CAS.ca;
}

export function missatgeErrorIncidenciaCas(error, tx) {
  const codi = String(error?.codi ?? error?.code ?? '');
  if (codi === 'sense-incidencia') return tx.errorSenseIncidencia;
  if (codi === 'versio-invalida') return tx.errorVersioInvalida;
  if (codi === 'cas-no-disponible') return tx.errorCasNoDisponible;
  if (codi === 'sense-permis' || codi === 'nomes-lectura') return tx.errorSensePermis;
  return tx.errorGeneral;
}
