/* DOL-54 · Dins del tros diferit de Notes: lloc del desat i acte de publicació
   són estats diferents. Cap tria de l'aparador acredita una publicació.
   v1.2.20 · Gauntlet R1 (L2-01) · `memoria`: l'embolcall que només escriu en memòria (PublicacioEditable,
   la revisió d'una pàgina WP) no anuncia cap desat. (L2-04) · `creacioPendent`: una creació aturada no
   és cap creació en vol. (L2-05) · L'ajuda de l'aparador es compon amb els botons que hi ha de veres. */
export const TEXTOS_HONESTEDAT_DESAT = Object.freeze({
  ca: {
    local: 'Còpia local: no s’envia al servidor. Si el navegador no permet desar-la, només queda en esta pestanya.',
    preparada: 'Encara no s’ha creat cap nota al servidor. La primera escriptura es desarà automàticament com a esborrany privat.',
    creant: 'Creant l’esborrany privat al servidor. Fins a la confirmació, el text només és en esta pestanya.',
    creacioPendent: 'La nota encara no s’ha creat al servidor: es tornarà a provar quan hi tornes a escriure. Mentrestant, el text només és en esta pestanya.',
    fallida: 'No s’ha confirmat la creació al servidor. Conserva esta pestanya oberta i torna-ho a provar.',
    privada: 'Esborrany privat desat al servidor. No està publicat.',
    pendent: 'Canvis locals pendents de confirmació al servidor. L’autodesat no publica la nota.',
    pestanya: 'Canvis pendents només en esta pestanya: el dispositiu no ha pogut guardar-ne la còpia. L’autodesat no publica la nota.',
    memoria: 'Canvis només en esta pantalla: no es desen com a esborrany. Si ixes o obris una altra peça abans de publicar-los, es perden.',
    publicada: 'Hi ha una versió publicada. Les edicions es desen com a esborrany privat; la versió pública només canvia en confirmar l’actualització.',
    preferencia: 'És la preferència per a la pròxima publicació.',
    preferenciaAplica: 'Per a aplicar-la, confirma «{boto}».',
    preferenciaRetira: 'Per a retirar una publicació, usa «{boto}».',
    preferenciaBloquejada: 'Ara no es pot publicar des d’ací: només s’aplicarà quan es puga publicar.',
    cancelada: 'La identitat ha canviat. No s’ha enviat esta publicació; torna a revisar-la amb la identitat actual.',
  },
  es: {
    local: 'Copia local: no se envía al servidor. Si el navegador no permite guardarla, solo queda en esta pestaña.',
    preparada: 'Todavía no se ha creado ninguna nota en el servidor. La primera escritura se guardará automáticamente como borrador privado.',
    creant: 'Creando el borrador privado en el servidor. Hasta la confirmación, el texto solo está en esta pestaña.',
    creacioPendent: 'La nota todavía no se ha creado en el servidor: se volverá a intentar cuando vuelvas a escribir. Mientras tanto, el texto solo está en esta pestaña.',
    fallida: 'No se ha confirmado la creación en el servidor. Mantén esta pestaña abierta y vuelve a intentarlo.',
    privada: 'Borrador privado guardado en el servidor. No está publicado.',
    pendent: 'Cambios locales pendientes de confirmación en el servidor. El autoguardado no publica la nota.',
    pestanya: 'Cambios pendientes solo en esta pestaña: el dispositivo no ha podido guardar la copia. El autoguardado no publica la nota.',
    memoria: 'Cambios solo en esta pantalla: no se guardan como borrador. Si sales o abres otra pieza antes de publicarlos, se pierden.',
    publicada: 'Hay una versión publicada. Las ediciones se guardan como borrador privado; la versión pública solo cambia al confirmar la actualización.',
    preferencia: 'Es la preferencia para la próxima publicación.',
    preferenciaAplica: 'Para aplicarla, confirma «{boto}».',
    preferenciaRetira: 'Para retirar una publicación, usa «{boto}».',
    preferenciaBloquejada: 'Ahora no se puede publicar desde aquí: solo se aplicará cuando se pueda publicar.',
    cancelada: 'La identidad ha cambiado. No se ha enviado esta publicación; revísala con la identidad actual.',
  },
  en: {
    local: 'Local copy: it is not sent to the server. If the browser cannot save it, it remains in this tab only.',
    preparada: 'No note has been created on the server yet. Your first edit will be saved automatically as a private draft.',
    creant: 'Creating the private draft on the server. Until confirmation, the text is in this tab only.',
    creacioPendent: 'The note has not been created on the server yet: it will be tried again when you type again. Meanwhile, the text is in this tab only.',
    fallida: 'Creation on the server has not been confirmed. Keep this tab open and try again.',
    privada: 'Private draft saved on the server. It is not published.',
    pendent: 'Local changes await server confirmation. Autosave does not publish the note.',
    pestanya: 'Pending changes are in this tab only: the device could not save a copy. Autosave does not publish the note.',
    memoria: 'Changes are on this screen only: they are not saved as a draft. If you leave or open another item before publishing them, they are lost.',
    publicada: 'A published version exists. Edits are saved as a private draft; the public version only changes when you confirm the update.',
    preferencia: 'This is the preference for the next publication.',
    preferenciaAplica: 'To apply it, confirm “{boto}”.',
    preferenciaRetira: 'To withdraw a publication, use “{boto}”.',
    preferenciaBloquejada: 'Publishing is not possible from here right now: it will only apply once it can be published.',
    cancelada: 'Your identity has changed. This publication was not sent; review it with your current identity.',
  },
  eu: {
    local: 'Tokiko kopia: ez da zerbitzarira bidaltzen. Nabigatzaileak ezin badu gorde, fitxa honetan bakarrik geratzen da.',
    preparada: 'Oraindik ez da oharrik sortu zerbitzarian. Lehen aldaketa automatikoki zirriborro pribatu gisa gordeko da.',
    creant: 'Zerbitzarian zirriborro pribatua sortzen. Berretsi arte, testua fitxa honetan bakarrik dago.',
    creacioPendent: 'Oharra ez da oraindik zerbitzarian sortu: berriro idazten duzunean saiatuko da berriro. Bitartean, testua fitxa honetan bakarrik dago.',
    fallida: 'Ez da zerbitzarian sortu dela berretsi. Mantendu fitxa hau irekita eta saiatu berriro.',
    privada: 'Zerbitzarian gordetako zirriborro pribatua. Ez dago argitaratuta.',
    pendent: 'Tokiko aldaketak zerbitzariaren berrespenaren zain daude. Gordetze automatikoak ez du oharra argitaratzen.',
    pestanya: 'Zain dauden aldaketak fitxa honetan bakarrik daude: gailuak ezin izan du kopia gorde. Gordetze automatikoak ez du oharra argitaratzen.',
    memoria: 'Aldaketak pantaila honetan bakarrik daude: ez dira zirriborro gisa gordetzen. Argitaratu aurretik irteten bazara edo beste elementu bat irekitzen baduzu, galdu egiten dira.',
    publicada: 'Argitaratutako bertsio bat dago. Aldaketak zirriborro pribatu gisa gordetzen dira; bertsio publikoa eguneratzea berrestean bakarrik aldatzen da.',
    preferencia: 'Hurrengo argitalpenerako lehentasuna da.',
    preferenciaAplica: 'Aplikatzeko, berretsi «{boto}».',
    preferenciaRetira: 'Argitalpena kentzeko, erabili «{boto}».',
    preferenciaBloquejada: 'Orain ezin da hemendik argitaratu: argitaratu ahal denean bakarrik aplikatuko da.',
    cancelada: 'Identitatea aldatu da. Argitalpen hau ez da bidali; berrikusi uneko identitatearekin.',
  },
  gl: {
    local: 'Copia local: non se envía ao servidor. Se o navegador non permite gardala, só queda nesta lapela.',
    preparada: 'Aínda non se creou ningunha nota no servidor. A primeira escritura gardarase automaticamente como borrador privado.',
    creant: 'Creando o borrador privado no servidor. Ata a confirmación, o texto só está nesta lapela.',
    creacioPendent: 'A nota aínda non se creou no servidor: tentarase de novo cando volvas escribir. Mentres tanto, o texto só está nesta lapela.',
    fallida: 'Non se confirmou a creación no servidor. Mantén esta lapela aberta e téntao de novo.',
    privada: 'Borrador privado gardado no servidor. Non está publicado.',
    pendent: 'Cambios locais pendentes de confirmación no servidor. O gardado automático non publica a nota.',
    pestanya: 'Cambios pendentes só nesta lapela: o dispositivo non puido gardar a copia. O gardado automático non publica a nota.',
    memoria: 'Cambios só nesta pantalla: non se gardan como borrador. Se saes ou abres outra peza antes de publicalos, pérdense.',
    publicada: 'Hai unha versión publicada. As edicións gárdanse como borrador privado; a versión pública só cambia ao confirmar a actualización.',
    preferencia: 'É a preferencia para a próxima publicación.',
    preferenciaAplica: 'Para aplicala, confirma «{boto}».',
    preferenciaRetira: 'Para retirar unha publicación, usa «{boto}».',
    preferenciaBloquejada: 'Agora non se pode publicar desde aquí: só se aplicará cando se poida publicar.',
    cancelada: 'A identidade cambiou. Non se enviou esta publicación; revísaa coa identidade actual.',
  },
});

export function textosHonestedatDesat(idioma = 'ca') {
  return TEXTOS_HONESTEDAT_DESAT[idioma] || TEXTOS_HONESTEDAT_DESAT.ca;
}

export function estatHonestNota({ memoria = false, local = false, preparada = false, creacio = null, publicada = false, desament = null } = {}, idioma = 'ca') {
  const textos = textosHonestedatDesat(idioma);
  /* v1.2.20 · Gauntlet R1 (L2-01) · Abans que «local»: en memòria tampoc no hi ha cap còpia al navegador. */
  if (memoria) return textos.memoria;
  if (local) return textos.local;
  /* v1.2.20 · Gauntlet R1 (L2-04) · Només 'enviant' és una creació en vol; 'pendent' (un AbortError) espera la pròxima escriptura. */
  if (preparada) {
    if (!creacio) return textos.preparada;
    return creacio.estat === 'error' ? textos.fallida : creacio.estat === 'enviant' ? textos.creant : textos.creacioPendent;
  }
  const pendent = desament && desament.estat !== 'net';
  const canvi = pendent ? (desament.pestanya ? textos.pestanya : textos.pendent) : '';
  if (publicada) return [textos.publicada, canvi].filter(Boolean).join(' ');
  return canvi || textos.privada;
}

/* v1.2.20 · Gauntlet R1 (L2-05) · L'ajuda de «Mostrar també al Mur» només nomena els botons que el panell
   pinta: `publicar`, el de confirmar del panell («Publicar al Mur», «Actualitzar al Mercat», «Compartir al
   Mur»…) o null si ara no es pot publicar; `retirar`, el de retirar si n'hi ha. */
export function ajudaPreferenciaMur({ publicar = null, retirar = null } = {}, idioma = 'ca') {
  const textos = textosHonestedatDesat(idioma);
  const ambBoto = (plantilla, boto) => plantilla.replace('{boto}', () => boto);
  return [
    textos.preferencia,
    publicar ? ambBoto(textos.preferenciaAplica, publicar) : textos.preferenciaBloquejada,
    retirar ? ambBoto(textos.preferenciaRetira, retirar) : '',
  ].filter(Boolean).join(' ');
}
