/**
 * i18nGestoriaA11y.js — Diccionari modular pur d'accessibilitat (a11y) per als
 * atributs restants de la Gestoria en les 5 llengües oficials (ca, es, en, eu, gl).
 * Zero imports, zero React, zero DOM i zero xarxa (DAG estricte sense cicles).
 * En 'ca' retorna les cadenes originals byte a byte i manté WCAG 2.5.3 en les 5 llengües.
 */

const CODIS = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

function codiDe(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return CODIS.includes(codi) ? codi : 'ca';
}

const EST = Object.freeze({
  facturesExclosesAria: Object.freeze({
    ca: 'Factures excloses',
    es: 'Facturas excluidas',
    en: 'Excluded invoices',
    eu: 'Baztertutako fakturak',
    gl: 'Facturas excluídas'
  }),
  importsJaEnEuros: Object.freeze({
    ca: 'Els imports ja són en euros',
    es: 'Los importes ya están en euros',
    en: 'Amounts are already in euros',
    eu: 'Zenbatekoak eurotan daude jada',
    gl: 'Os importes xa están en euros'
  }),
  tornaProposta: Object.freeze({
    ca: 'Torna a la proposta',
    es: 'Devolver a la propuesta',
    en: 'Restore to draft',
    eu: 'Itzuli proposamenera',
    gl: 'Volver á proposta'
  }),
  qrCotejoAria: Object.freeze({
    ca: 'Codi QR de cotejo de la factura a l’AEAT',
    es: 'Código QR de cotejo de la factura en la AEAT',
    en: 'Tax agency verification QR code for the invoice',
    eu: 'Fakturaren AEATeko egiaztapen QR kodea',
    gl: 'Código QR de cotexo da factura na AEAT'
  }),
  papersNomOpacAria: Object.freeze({
    ca: 'Papers de nom opac',
    es: 'Documentos de nombre opaco',
    en: 'Opaque-named documents',
    eu: 'Izen opakuko agiriak',
    gl: 'Papeis de nome opaco'
  }),
  comprovaPaper: Object.freeze({
    ca: 'Comprova el paper',
    es: 'Comprobar el documento',
    en: 'Verify document',
    eu: 'Egiaztatu agiria',
    gl: 'Comprobar o papel'
  }),
  obriPestanya: Object.freeze({
    ca: 'Obri’l en una pestanya',
    es: 'Abrir en una pestaña',
    en: 'Open in new tab',
    eu: 'Ireki fitxa batean',
    gl: 'Abrilo nunha lapela'
  }),
  lligLo: Object.freeze({
    ca: 'Llig-lo',
    es: 'Leerlo',
    en: 'Read it',
    eu: 'Irakurri',
    gl: 'Lelo'
  }),
  confirmaEste: Object.freeze({
    ca: 'Confirma este',
    es: 'Confirmar este',
    en: 'Confirm this one',
    eu: 'Berretsi hau',
    gl: 'Confirmar este'
  }),
  rebutjaL: Object.freeze({
    ca: 'Rebutja’l',
    es: 'Rechazarlo',
    en: 'Reject it',
    eu: 'Baztertu hau',
    gl: 'Rexeitalo'
  }),
  lesTeuesReglesAria: Object.freeze({
    ca: 'Les teues regles',
    es: 'Tus reglas',
    en: 'Your rules',
    eu: 'Zure arauak',
    gl: 'As túas regras'
  })
});

const PLANTILLES = Object.freeze({
  nomFilaFactura: (c, ingres, numOrdre, numFactura) => {
    const sufix = numFactura ? ` («${numFactura}»)` : '';
    return {
      ca: `${ingres ? 'l’ingrés' : 'la despesa'} ${numOrdre}${sufix}`,
      es: `${ingres ? 'el ingreso' : 'el gasto'} ${numOrdre}${sufix}`,
      en: `${ingres ? 'income' : 'expense'} ${numOrdre}${sufix}`,
      eu: `${numOrdre}. ${ingres ? 'sarrera' : 'gastua'}${sufix}`,
      gl: `${ingres ? 'o ingreso' : 'o gasto'} ${numOrdre}${sufix}`
    }[c];
  },
  celEditableAria: (c, titolColumna, ingres, numOrdre) => ({
    ca: `${titolColumna}, ${ingres ? 'ingrés' : 'despesa'} ${numOrdre}`,
    es: `${titolColumna}, ${ingres ? 'ingreso' : 'gasto'} ${numOrdre}`,
    en: `${titolColumna}, ${ingres ? 'income' : 'expense'} ${numOrdre}`,
    eu: `${titolColumna}, ${numOrdre}. ${ingres ? 'sarrera' : 'gastua'}`,
    gl: `${titolColumna}, ${ingres ? 'ingreso' : 'gasto'} ${numOrdre}`
  }[c]),
  totalEurosCarrecAria: (c, nomFila) => ({
    ca: `Total en euros del càrrec, ${nomFila}`,
    es: `Total en euros del cargo, ${nomFila}`,
    en: `Total charge in euros, ${nomFila}`,
    eu: `Zordunketaren guztizkoa eurotan, ${nomFila}`,
    gl: `Total en euros do cargo, ${nomFila}`
  }[c]),
  aplicaTotalEurosAria: (c, nomFila) => ({
    ca: `Aplica el total en euros, ${nomFila}`,
    es: `Aplicar el total en euros, ${nomFila}`,
    en: `Apply total in euros, ${nomFila}`,
    eu: `Aplikatu guztizkoa eurotan, ${nomFila}`,
    gl: `Aplicar o total en euros, ${nomFila}`
  }[c]),
  cancellaPasEurosAria: (c, nomFila) => ({
    ca: `Cancel·la el pas a euros, ${nomFila}`,
    es: `Cancelar el paso a euros, ${nomFila}`,
    en: `Cancel conversion to euros, ${nomFila}`,
    eu: `Utzi eurotarako bihurketa, ${nomFila}`,
    gl: `Cancelar o paso a euros, ${nomFila}`
  }[c]),
  importsJaEnEurosAria: (c, nomFila) => `${EST.importsJaEnEuros[c]}, ${nomFila}`,
  mouAFactures: (c, ingres) => ({
    ca: ingres ? 'Mou a despeses' : 'Mou a ingressos',
    es: ingres ? 'Mover a gastos' : 'Mover a ingresos',
    en: ingres ? 'Move to expenses' : 'Move to income',
    eu: ingres ? 'Eraman gastuetara' : 'Eraman sarreretara',
    gl: ingres ? 'Mover a gastos' : 'Mover a ingresos'
  }[c]),
  mouAFacturesAria: (c, ingres, nomFila) => `${PLANTILLES.mouAFactures(c, ingres)} ${nomFila}`,
  tornaPropostaAria: (c, num) => ({
    ca: `Torna a la proposta la factura ${num || 'sense número'}`,
    es: `Devolver a la propuesta la factura ${num || 'sin número'}`,
    en: `Restore to draft invoice ${num || 'unnumbered'}`,
    eu: `Itzuli proposamenera faktura: ${num || 'zenbakirik gabea'}`,
    gl: `Volver á proposta a factura ${num || 'sen número'}`
  }[c]),
  fullFacturaAria: (_c, titolLocalitzat, numeroModel) => `${titolLocalitzat} ${numeroModel}`,
  comprovaPaperAria: (c, ruta) => `${EST.comprovaPaper[c]}: ${ruta}`,
  obriPestanyaAria: (c, ruta) => `${EST.obriPestanya[c]}: ${ruta}`,
  lligLoAria: (c, ruta) => `${EST.lligLo[c]}: ${ruta}`,
  campOpcio: (c, etiqueta, num) => ({
    ca: `${etiqueta}, opció ${num}`,
    es: `${etiqueta}, opción ${num}`,
    en: `${etiqueta}, option ${num}`,
    eu: `${etiqueta}, ${num}. aukera`,
    gl: `${etiqueta}, opción ${num}`
  }[c]),
  confirmaEsteAria: (c, etiqueta) => ({
    ca: `Confirma este: valor nou de ${etiqueta}`,
    es: `Confirmar este: valor nuevo de ${etiqueta}`,
    en: `Confirm this one: new value for ${etiqueta}`,
    eu: `Berretsi hau: ${etiqueta} balio berria`,
    gl: `Confirmar este: valor novo de ${etiqueta}`
  }[c]),
  rebutjaLAria: (c, etiqueta) => ({
    ca: `Rebutja’l: valor nou de ${etiqueta}`,
    es: `Rechazarlo: valor nuevo de ${etiqueta}`,
    en: `Reject it: new value for ${etiqueta}`,
    eu: `Baztertu hau: ${etiqueta} balio berria`,
    gl: `Rexeitalo: valor novo de ${etiqueta}`
  }[c]),
  llevaReglaAria: (c, patro) => ({
    ca: `Lleva la regla «${patro}»`,
    es: `Quitar la regla «${patro}»`,
    en: `Remove rule «${patro}»`,
    eu: `Kendu araua: «${patro}»`,
    gl: `Quitar a regra «${patro}»`
  }[c]),
  avisosAnyAria: (c, any) => ({
    ca: `Avisos de ${any}`,
    es: `Avisos de ${any}`,
    en: `Notices for ${any}`,
    eu: `${any}ko oharrak`,
    gl: `Avisos de ${any}`
  }[c]),
  tramsAria: (c, nom, any) => ({
    ca: `Trams: ${nom} de ${any}`,
    es: `Tramos: ${nom} de ${any}`,
    en: `Brackets: ${nom} for ${any}`,
    eu: `Tarteak: ${any}ko ${nom}`,
    gl: `Tramos: ${nom} de ${any}`
  }[c]),
  llevaTramAria: (c, num) => ({
    ca: `Lleva el tram ${num}`,
    es: `Quitar el tramo ${num}`,
    en: `Remove bracket ${num}`,
    eu: `Kendu ${num}. tartea`,
    gl: `Quitar o tramo ${num}`
  }[c]),
  editaTramsTitol: (c, nom, any) => ({
    ca: `Edita els trams (${nom.toLowerCase()}, ${any})`,
    es: `Editar los tramos (${nom.toLowerCase()}, ${any})`,
    en: `Edit brackets (${nom.toLowerCase()}, ${any})`,
    eu: `Editatu tarteak (${nom.toLowerCase()}, ${any})`,
    gl: `Editar os tramos (${nom.toLowerCase()}, ${any})`
  }[c])
});

export function tga(idioma, clau, ...args) {
  const c = codiDe(idioma);
  if (Object.prototype.hasOwnProperty.call(EST, clau)) {
    return EST[clau][c];
  }
  const fn = PLANTILLES[clau];
  return typeof fn === 'function' ? fn(c, ...args) : String(clau ?? '');
}
