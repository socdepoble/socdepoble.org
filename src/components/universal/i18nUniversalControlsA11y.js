/**
 * Onada R32.39 · Lot 02 · Diccionari diferit d'accessibilitat per als controls
 * universals diferits (DocumentPrintPreview, EstatDesament i PaginaEmojis) en
 * les 5 llengües oficials (ca, es, en, eu, gl).
 * Conserva byte a byte el valencià (ca) i no toca el paquet estàtic d'arrencada (+0 B al nucli).
 */
const DICCIONARI_CONTROLS_UNIVERSALS = Object.freeze({
  ca: Object.freeze({
    impressio: Object.freeze({
      titolDialeg: "Vista prèvia d'impressió",
      avisImpressio: 'El document es prepara al teu dispositiu. En imprimir, tria A4 i «Desar com a PDF». Revisa els salts de pàgina en la vista prèvia del navegador.',
      imprimirDesarPdf: 'Imprimir / Desar PDF',
      inclourePortada: 'Incloure portada',
      titolIframeA4: 'Document A4',
    }),
    desament: Object.freeze({
      net: 'Tots els canvis estan desats.',
      pendent: 'Canvis pendents de desar.',
      enviant: 'Canvis pendents de desar.',
      sessio: 'Canvis pendents: cal tornar a entrar per a desar-los.',
      error: 'No s’han pogut desar tots els canvis.',
      titolDetall: 'Estat del desament',
      voreDetall: (base) => `${base} Vore el detall`,
      entesos: 'Entesos',
    }),
    emojis: Object.freeze({
      titolPerDefecte: 'Emojis',
      tornar: 'Tornar',
      tancar: 'Tancar',
      ajudaInserir: 'Toca un emoji i s’escriurà on tenies el cursor, a la nota oberta.',
      ajudaCopiar: 'Toca un emoji per copiar-lo al porta-retalls: ara no hi ha cap nota oberta on escriure’l.',
      ajudaPerfil: 'Toca un emoji per assignar-lo com a emoticona de la teua fitxa.',
    }),
  }),
  es: Object.freeze({
    impressio: Object.freeze({
      titolDialeg: 'Vista previa de impresión',
      avisImpressio: 'El documento se prepara en tu dispositivo. Al imprimir, elige A4 y «Guardar como PDF». Revisa los saltos de página en la vista previa del navegador.',
      imprimirDesarPdf: 'Imprimir / Guardar PDF',
      inclourePortada: 'Incluir portada',
      titolIframeA4: 'Documento A4',
    }),
    desament: Object.freeze({
      net: 'Todos los cambios están guardados.',
      pendent: 'Cambios pendientes de guardar.',
      enviant: 'Cambios pendientes de guardar.',
      sessio: 'Cambios pendientes: vuelve a iniciar sesión para guardarlos.',
      error: 'No se han podido guardar todos los cambios.',
      titolDetall: 'Estado del guardado',
      voreDetall: (base) => `${base} Ver el detalle`,
      entesos: 'Entendido',
    }),
    emojis: Object.freeze({
      titolPerDefecte: 'Emojis',
      tornar: 'Volver',
      tancar: 'Cerrar',
      ajudaInserir: 'Toca un emoji y se escribirá donde tenías el cursor, en la nota abierta.',
      ajudaCopiar: 'Toca un emoji para copiarlo al portapapeles: ahora no hay ninguna nota abierta donde escribirlo.',
      ajudaPerfil: 'Toca un emoji para asignarlo como emoticono de tu ficha.',
    }),
  }),
  en: Object.freeze({
    impressio: Object.freeze({
      titolDialeg: 'Print preview',
      avisImpressio: 'The document is prepared on your device. When printing, choose A4 and “Save as PDF”. Check page breaks in the browser preview.',
      imprimirDesarPdf: 'Print / Save PDF',
      inclourePortada: 'Include cover',
      titolIframeA4: 'A4 document',
    }),
    desament: Object.freeze({
      net: 'All changes are saved.',
      pendent: 'Unsaved changes pending.',
      enviant: 'Unsaved changes pending.',
      sessio: 'Unsaved changes: sign in again to save them.',
      error: 'Could not save all changes.',
      titolDetall: 'Save status',
      voreDetall: (base) => `${base} View details`,
      entesos: 'Got it',
    }),
    emojis: Object.freeze({
      titolPerDefecte: 'Emojis',
      tornar: 'Back',
      tancar: 'Close',
      ajudaInserir: 'Tap an emoji to insert it at the cursor in the open note.',
      ajudaCopiar: 'Tap an emoji to copy it to the clipboard: no note is currently open.',
      ajudaPerfil: 'Tap an emoji to set it as your profile icon.',
    }),
  }),
  eu: Object.freeze({
    impressio: Object.freeze({
      titolDialeg: 'Inprimatzeko aurrebista',
      avisImpressio: 'Dokumentua zure gailuan prestatzen da. Inprimatzean, aukeratu A4 eta «Gorde PDF gisa». Berrikusi orri-jauziak nabigatzailearen aurrebistan.',
      imprimirDesarPdf: 'Inprimatu / Gorde PDFa',
      inclourePortada: 'Sartu azala',
      titolIframeA4: 'A4 dokumentua',
    }),
    desament: Object.freeze({
      net: 'Aldaketa guztiak gordeta daude.',
      pendent: 'Gordetzeko dauden aldaketak.',
      enviant: 'Gordetzeko dauden aldaketak.',
      sessio: 'Gordetzeko dauden aldaketak: hasi saioa berriro gordetzeko.',
      error: 'Ezin izan dira aldaketa guztiak gorde.',
      titolDetall: 'Gordetzearen egoera',
      voreDetall: (base) => `${base} Ikusi xehetasuna`,
      entesos: 'Ulertuta',
    }),
    emojis: Object.freeze({
      titolPerDefecte: 'Emojiak',
      tornar: 'Itzuli',
      tancar: 'Itxi',
      ajudaInserir: 'Ukitu emoji bat eta kurtsorea zenuen tokian idatziko da, irekitako oharrean.',
      ajudaCopiar: 'Ukitu emoji bat arbelean kopiatzeko: ez dago ohar irekirik idazteko.',
      ajudaPerfil: 'Ukitu emoji bat zure fitxako ikono gisa ezartzeko.',
    }),
  }),
  gl: Object.freeze({
    impressio: Object.freeze({
      titolDialeg: 'Vista previa de impresión',
      avisImpressio: 'O documento prepárase no teu dispositivo. Ao imprimir, escolle A4 e «Gardar como PDF». Revisa os saltos de páxina na vista previa do navegador.',
      imprimirDesarPdf: 'Imprimir / Gardar PDF',
      inclourePortada: 'Incluír portada',
      titolIframeA4: 'Documento A4',
    }),
    desament: Object.freeze({
      net: 'Todos os cambios están gardados.',
      pendent: 'Cambios pendentes de gardar.',
      enviant: 'Cambios pendentes de gardar.',
      sessio: 'Cambios pendentes: volve iniciar sesión para gardalos.',
      error: 'Non se puideron gardar todos os cambios.',
      titolDetall: 'Estado do gardado',
      voreDetall: (base) => `${base} Ver o detalle`,
      entesos: 'Entendido',
    }),
    emojis: Object.freeze({
      titolPerDefecte: 'Emojis',
      tornar: 'Volver',
      tancar: 'Pechar',
      ajudaInserir: 'Toca un emoji e escribirase onde tiñas o cursor, na nota aberta.',
      ajudaCopiar: 'Toca un emoji para copialo ao portapapeis: agora non hai ningunha nota aberta onde escribilo.',
      ajudaPerfil: 'Toca un emoji para asignalo como emoticona da túa ficha.',
    }),
  }),
});

export function codiLlenguaUniversalA11y(language = 'ca') {
  const base = String(language || 'ca').toLowerCase().split('-')[0];
  return Object.hasOwn(DICCIONARI_CONTROLS_UNIVERSALS, base) ? base : 'ca';
}

export function textosUniversalControlsA11y(language = 'ca') {
  return DICCIONARI_CONTROLS_UNIVERSALS[codiLlenguaUniversalA11y(language)];
}
