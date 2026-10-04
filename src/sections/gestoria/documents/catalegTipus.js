/**
 * catalegTipus.js — què és cada paper de l'empresa i de la llar, per a què
 * servix i quan es pot esborrar.
 *
 * Dada pura i congelada, com nucli/cataleg.js: la taula del MAPA de l'empresa
 * i de la llar (§3.2, nit del 261004), amb 37 tipus i res de personal. Els
 * textos «Quan es pot esborrar» són els de la taula, literals. TOTS els
 * terminis són orientatius i es mostren «a verificar amb la gestoria»: cap
 * s'ha contrastat amb una font oficial.
 *
 * Cada tipus porta, a més del text, la seua regla de conservació en forma de
 * dada perquè plaNeteja.js calcule la data mínima. La lectura és sempre la
 * prudent:
 *   · Si la taula dona diversos terminis, s'aplica el més llarg.
 *   · Un termini amb condició («fins a 10 si hi ha bases negatives») s'aplica
 *     sempre que la persona no haja dit expressament que la condició és falsa:
 *     un fet desconegut compta com a cert.
 *   · «Des del final del termini de declaració» es compta des del 31 de
 *     desembre de l'any següent al del document, que mai és abans.
 *   · Una condició («quan n'hi ha un de més nou») només es complix si la
 *     persona ho ha dit; si no se sap, no es complix.
 *
 * Protecció: 'sempre' vol dir que mai és candidat automàtic (com a molt, es
 * pot arxivar); 'fins-venciment', que no ho és fins que vence el seu termini.
 * Un esborrat de qualsevol tipus protegit demana confirmació escrita.
 * JS pur: sense DOM ni React.
 */

/** L'avís que acompanya tot termini d'esta taula. */
export const AVIS_TERMINI = 'a verificar amb la gestoria';

/** El tipus de tot el que el classificador no reconeix: mai es proposa res. */
export const TIPUS_DESCONEGUT = 'desconegut';

/** Àmbit: de l'empresa, de la llar o segons el document. */
export const AMBITS = Object.freeze(['empresa', 'llar', 'segons']);

export const SENSIBILITATS = Object.freeze([
  'ordinaria', 'economica', 'identitat', 'laboral', 'salut', 'patrimoni', 'credencial', 'desconeguda'
]);

export const PROTECCIONS = Object.freeze(['no', 'fins-venciment', 'sempre']);

/**
 * Regles de conservació:
 *   · 'mai': no s'esborra mai des de l'app.
 *   · 'persona': ho decidix la persona (o és una acció humana); mai es proposa.
 *   · 'arxiu': el seu lloc és l'arxiu; mai la paperera.
 *   · 'termini': { des, anys, si? } — data mínima = data base + anys.
 *   · 'condicio': { fet, valor } — només es complix si fets[fet] === valor.
 */
export const REGLES = Object.freeze(['mai', 'persona', 'arxiu', 'termini', 'condicio']);

/**
 * Dates base dels terminis i què vol dir que falten: 'revisa' (sense eixa
 * data no es pot calcular res i la persona l'ha de completar) o 'vigent'
 * (sense data de fi, el document encara està en vigor).
 */
export const DATES_BASE = Object.freeze({
  exercici: Object.freeze({ etiqueta: "el 31 de desembre de l'any següent al del document", camp: 'data', siFalta: 'revisa' }),
  data: Object.freeze({ etiqueta: 'la data del document', camp: 'data', siFalta: 'revisa' }),
  caducitat: Object.freeze({ etiqueta: 'la data de caducitat', camp: 'caducitat', siFalta: 'revisa' }),
  fiVigencia: Object.freeze({ etiqueta: 'la fi de la vigència o de la titularitat', camp: 'fiVigencia', siFalta: 'vigent' }),
  fermesa: Object.freeze({ etiqueta: 'la data en què és ferm', camp: 'fermesa', siFalta: 'vigent' }),
  justificacio: Object.freeze({ etiqueta: 'la data de la justificació', camp: 'justificacio', siFalta: 'vigent' })
});

/** Les dates que la persona pot donar d'un document, en llenguatge pla. */
export const ETIQUETES_DATA = Object.freeze({
  data: 'la data del document',
  caducitat: 'la data de caducitat',
  fiVigencia: 'la data de fi de la vigència o de la titularitat',
  fermesa: 'la data en què és ferm',
  justificacio: 'la data de la justificació'
});

/** Els fets que la persona pot declarar d'un document, en llenguatge pla. */
export const ETIQUETES_FET = Object.freeze({
  basesNegatives: 'hi ha bases negatives o deduccions pendents',
  acceptat: "el pressupost s'ha acceptat",
  fonsEuropeus: "l'ajuda porta fons europeus",
  dePersones: 'és una assegurança de persones',
  afecteActivitat: "està afecte a l'activitat",
  originalConservat: "es conserva l'original",
  teMesNou: "n'hi ha un de més nou",
  posteriorAlTancament: 'és posterior a un tancament trimestral',
  esLaUltima: "és l'última còpia bona",
  esTancamentExercici: "és la còpia del tancament d'exercici",
  documentSignatEsborrat: "el document que signa ja s'ha esborrat",
  serveiDonatDeBaixa: "el servei s'ha donat de baixa",
  dissenyEnDesus: 'el disseny ja no es vol'
});

const MAI = Object.freeze({ regla: 'mai' });
const PERSONA = Object.freeze({ regla: 'persona' });
const ARXIU = Object.freeze({ regla: 'arxiu' });
/* `si`: el fet (o la llista de fets) que ha de ser cert perquè el termini s'aplique. */
const termini = (des, anys, si = null) => Object.freeze(si
  ? { regla: 'termini', des, anys, si: Object.freeze([].concat(si)) }
  : { regla: 'termini', des, anys });
const condicio = (fet, valor = true) => Object.freeze({ regla: 'condicio', fet, valor });

/* «4 anys (LGT); 6 per als llibres i justificants mercantils (CCom); fins a 10 amb bases negatives»: el més llarg. */
const COM_LA_FACTURA = [termini('exercici', 6), termini('exercici', 10, 'basesNegatives')];

function tipus(dades) {
  return Object.freeze({ ...dades, conservacio: Object.freeze([...dades.conservacio]) });
}

export const CATALEG_TIPUS = Object.freeze([
  tipus({
    id: 'factura-emesa',
    nom: 'Factura emesa',
    queEs: 'Factura que has fet tu (F1, F2, R)',
    perAQueServix: "IVA repercutit, llibre d'expedides, prova d'ingrés",
    quanEsborrar: '4 anys des del final del termini de declaració (art. 66 LGT); 6 per als llibres i justificants mercantils (art. 30 CCom); fins a 10 si hi ha bases negatives o deduccions pendents (art. 66 bis)',
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'fins-venciment',
    conservacio: COM_LA_FACTURA
  }),
  tipus({
    id: 'llibre-verifactu',
    nom: 'Llibre de registres Veri*Factu',
    queEs: 'La cadena encadenada de factures',
    perAQueServix: "Prova d'integritat davant l'AEAT",
    quanEsborrar: "Mai des de l'app; s'exporta",
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'sempre',
    conservacio: [MAI]
  }),
  tipus({
    id: 'factura-rebuda',
    nom: 'Factura rebuda',
    queEs: "Factura d'un proveïdor",
    perAQueServix: "Deduir l'IVA i la despesa",
    quanEsborrar: 'Com la factura emesa',
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'fins-venciment',
    conservacio: COM_LA_FACTURA
  }),
  tipus({
    id: 'rebut-pagament',
    nom: 'Rebut o justificant de pagament',
    queEs: "Prova que s'ha pagat; no és una factura",
    perAQueServix: 'Conciliar; justificar una subvenció',
    quanEsborrar: "Quan ja no el necessite ni la factura ni l'expedient; com a mínim 4 anys",
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'no',
    // Mentre el necessite la factura: es pren el termini de la factura.
    conservacio: COM_LA_FACTURA
  }),
  tipus({
    id: 'tiquet-simplificat',
    nom: 'Tiquet simplificat',
    queEs: 'Factura simplificada sense destinatari',
    perAQueServix: "Despesa menor (no permet deduir l'IVA)",
    quanEsborrar: "4 anys si és de l'activitat; de casa, quan acabe la garantia",
    ambit: 'segons',
    sensibilitat: 'economica',
    protegit: 'no',
    conservacio: [termini('exercici', 4)]
  }),
  tipus({
    id: 'pressupost',
    nom: 'Pressupost',
    queEs: 'Oferta sense valor fiscal',
    perAQueServix: 'Convertir-lo en factura; prova de les condicions',
    quanEsborrar: "El no acceptat, un any després de caducar [PROPOSTA]; l'acceptat, amb la seua factura",
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'no',
    // L'acceptat viu tant com la seua factura: els terminis de la factura, només si s'ha acceptat.
    conservacio: [termini('caducitat', 1), termini('exercici', 6, 'acceptat'), termini('exercici', 10, ['acceptat', 'basesNegatives'])]
  }),
  tipus({
    id: 'full-trimestral',
    nom: 'Full trimestral lliurat (CSV, XLSX, PDF)',
    queEs: "El que es va entregar a la gestoria",
    perAQueServix: 'Prova del lliurament',
    quanEsborrar: '4 anys',
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'no',
    conservacio: [termini('exercici', 4)]
  }),
  tipus({
    id: 'model-presentat',
    nom: 'Model presentat i justificant (303, 130, 349, 390, 347, 100)',
    queEs: 'Declaració',
    perAQueServix: "Prova davant d'una comprovació",
    quanEsborrar: '4 anys des del final del termini; mentre hi haja recurs o inspecció, mai',
    ambit: 'segons',
    sensibilitat: 'economica',
    protegit: 'sempre',
    conservacio: [termini('exercici', 4)]
  }),
  tipus({
    id: 'extracte-bancari',
    nom: 'Extracte bancari (Norma 43, CSV, XLS)',
    queEs: 'Moviments del compte',
    perAQueServix: 'Conciliació i tresoreria',
    quanEsborrar: '4 anys (activitat); 6 per als llibres mercantils',
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'no',
    conservacio: [termini('exercici', 6)]
  }),
  tipus({
    id: 'copia-automatica',
    nom: "Còpia automàtica d'un programa (autodesades, .log)",
    queEs: 'Còpia intermèdia',
    perAQueServix: "Cap, si hi ha l'última bona",
    quanEsborrar: "Després de cada tancament trimestral, conservant l'última i la de tancament d'exercici [PROPOSTA]",
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'no',
    conservacio: [condicio('posteriorAlTancament'), condicio('esLaUltima', false), condicio('esTancamentExercici', false)]
  }),
  tipus({
    id: 'duplicat-exacte',
    nom: 'Duplicat exacte (mateix sha256)',
    queEs: 'Una còpia',
    perAQueServix: 'Cap',
    quanEsborrar: "Sempre que es conserve l'original i no siga una còpia que llig el repositori",
    ambit: 'segons',
    sensibilitat: 'ordinaria',
    protegit: 'no',
    conservacio: [condicio('originalConservat')]
  }),
  tipus({
    id: 'document-identitat',
    nom: "Document d'identitat",
    queEs: 'Identificació',
    perAQueServix: 'Tràmits',
    quanEsborrar: 'El caducat, destrucció segura amb un «sí»; el vigent, mai',
    ambit: 'llar',
    sensibilitat: 'identitat',
    protegit: 'sempre',
    conservacio: [termini('fiVigencia', 0)]
  }),
  tipus({
    id: 'acte-seguretat-social',
    nom: 'Alta, baixa o variació del RETA; resolucions de la TGSS',
    queEs: 'Actes de la Seguretat Social',
    perAQueServix: "Prova d'afiliació i períodes",
    quanEsborrar: "4 anys (art. 24 LGSS); recomanat conservar sempre l'últim informe de vida laboral i el de bases",
    ambit: 'empresa',
    sensibilitat: 'laboral',
    protegit: 'sempre',
    conservacio: [termini('exercici', 4)]
  }),
  tipus({
    id: 'rebut-cotitzacio',
    nom: 'Rebut de cotització mensual',
    queEs: 'Quota pagada',
    perAQueServix: 'Despesa deduïble i prova',
    quanEsborrar: '4 anys',
    ambit: 'empresa',
    sensibilitat: 'laboral',
    protegit: 'no',
    conservacio: [termini('exercici', 4)]
  }),
  tipus({
    id: 'informe-vida-laboral',
    nom: 'Informe de vida laboral o de bases',
    queEs: 'Una fotografia en una data',
    perAQueServix: 'Prova',
    quanEsborrar: "Quan n'hi ha un de més nou (es conserva l'últim)",
    ambit: 'empresa',
    sensibilitat: 'laboral',
    protegit: 'no',
    conservacio: [condicio('teMesNou')]
  }),
  tipus({
    id: 'certificat-titularitat',
    nom: 'Certificat de titularitat bancària',
    queEs: 'Prova del compte',
    perAQueServix: 'Tràmits',
    quanEsborrar: "Quan canvia el compte o caduca la vigència que demana l'organisme",
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'no',
    conservacio: [termini('fiVigencia', 0)]
  }),
  tipus({
    id: 'demanda-ocupacio',
    nom: "Demanda d'ocupació i renovacions",
    queEs: 'Inscripció',
    perAQueServix: 'Renovar-la a temps',
    quanEsborrar: "L'anterior, quan es renova (es conserva la prova de la renovació)",
    ambit: 'llar',
    sensibilitat: 'laboral',
    protegit: 'no',
    conservacio: [condicio('teMesNou')]
  }),
  tipus({
    id: 'model-145',
    nom: 'Model 145',
    queEs: 'Dades per a les retencions',
    perAQueServix: "Retencions d'IRPF",
    quanEsborrar: 'Mentre estiga vigent, i 4 anys més',
    ambit: 'empresa',
    sensibilitat: 'laboral',
    protegit: 'no',
    conservacio: [termini('fiVigencia', 4)]
  }),
  tipus({
    id: 'incapacitat-temporal',
    nom: 'Incapacitat temporal (comunicat mèdic, sol·licituds)',
    queEs: 'Dades de salut',
    perAQueServix: 'La prestació',
    quanEsborrar: "Ho decidix la persona; FORA de l'ERP",
    ambit: 'llar',
    sensibilitat: 'salut',
    protegit: 'sempre',
    conservacio: [PERSONA]
  }),
  tipus({
    id: 'notificacio-administrativa',
    nom: 'Notificació o resolució administrativa (TGSS, SUMA, OEPM)',
    queEs: 'Acte amb termini de recurs',
    perAQueServix: 'Recórrer; prova',
    quanEsborrar: '4 anys des que és ferma; amb un recurs obert, mai',
    ambit: 'segons',
    sensibilitat: 'ordinaria',
    protegit: 'fins-venciment',
    conservacio: [termini('fermesa', 4)]
  }),
  tipus({
    id: 'rebut-tribut-local',
    nom: 'Rebut de tribut local (IBI, vehicles)',
    queEs: 'Pagament anual',
    perAQueServix: "Prova; l'IBI segueix el bé",
    quanEsborrar: 'IBI: mentre es siga propietari i 4 anys més; vehicles: 4 anys',
    ambit: 'segons',
    sensibilitat: 'economica',
    protegit: 'no',
    conservacio: [termini('exercici', 4), termini('fiVigencia', 4)]
  }),
  tipus({
    id: 'expedient-marca',
    nom: 'Expedient de marca',
    queEs: 'Sol·licitud, suspens, contestació, concessió',
    perAQueServix: 'El dret sobre la marca',
    quanEsborrar: 'Mentre la marca estiga viva (renovació cada 10 anys) i, com a prova, mai',
    ambit: 'empresa',
    sensibilitat: 'ordinaria',
    protegit: 'sempre',
    conservacio: [MAI]
  }),
  tipus({
    id: 'subvencio',
    nom: 'Ajuda o subvenció (sol·licitud, resolució, acords, justificació)',
    queEs: 'Expedient',
    perAQueServix: 'Control i reintegrament',
    quanEsborrar: '4 anys des de la justificació (art. 39 LGS); amb fons europeus potser 5 (mireu les bases)',
    ambit: 'empresa',
    sensibilitat: 'economica',
    protegit: 'fins-venciment',
    conservacio: [termini('justificacio', 4), termini('justificacio', 5, 'fonsEuropeus')]
  }),
  tipus({
    id: 'signatura-electronica',
    nom: 'Signatura electrònica (.p7s, informe de signatura)',
    queEs: 'Prova de signatura',
    perAQueServix: 'Validesa del document signat',
    quanEsborrar: 'Amb el document que signa',
    ambit: 'segons',
    sensibilitat: 'identitat',
    protegit: 'fins-venciment',
    conservacio: [condicio('documentSignatEsborrat')]
  }),
  tipus({
    id: 'titol-propietat',
    nom: 'Escriptura, hipoteca, herència, obres de millora',
    queEs: 'Títols de propietat',
    perAQueServix: "Valor d'adquisició i drets",
    quanEsborrar: 'Mentre es tinga el bé i 4 anys des de la venda',
    ambit: 'llar',
    sensibilitat: 'patrimoni',
    protegit: 'sempre',
    conservacio: [termini('fiVigencia', 4)]
  }),
  tipus({
    id: 'declaracio-renda',
    nom: 'Declaració de la renda',
    queEs: 'Declaració anual',
    perAQueServix: 'Prova',
    quanEsborrar: '4 anys des del final del termini voluntari',
    ambit: 'llar',
    sensibilitat: 'economica',
    protegit: 'fins-venciment',
    conservacio: [termini('exercici', 4)]
  }),
  tipus({
    id: 'polissa-asseguranca',
    nom: "Pòlissa d'assegurança",
    queEs: 'Contracte',
    perAQueServix: 'Sinistres',
    quanEsborrar: 'Vigència més 2 anys (danys) o 5 (persones) (art. 23 LCS)',
    ambit: 'segons',
    sensibilitat: 'economica',
    protegit: 'no',
    conservacio: [termini('fiVigencia', 2), termini('fiVigencia', 5, 'dePersones')]
  }),
  tipus({
    id: 'garantia',
    nom: 'Garantia (factura o tiquet de compra)',
    queEs: 'Prova de compra',
    perAQueServix: 'Reclamar',
    quanEsborrar: 'Mentre dure la garantia legal (3 anys per a béns nous) més el temps de reclamar',
    ambit: 'llar',
    sensibilitat: 'ordinaria',
    protegit: 'no',
    // La fi de la vigència és la fi de la garantia més el temps de reclamar, que la persona coneix.
    conservacio: [termini('data', 3), termini('fiVigencia', 0)]
  }),
  tipus({
    id: 'rebut-domestic',
    nom: 'Rebut domèstic (llum, aigua, telèfon, comunitat, lloguer)',
    queEs: 'Pagament periòdic',
    perAQueServix: 'Prova',
    quanEsborrar: "5 anys (art. 1966 CC); si està afecte a l'activitat, com la factura",
    ambit: 'llar',
    sensibilitat: 'economica',
    protegit: 'no',
    conservacio: [termini('data', 5), termini('exercici', 6, 'afecteActivitat')]
  }),
  tipus({
    id: 'cataleg-botiga',
    nom: 'Catàleg de botiga o llista de preus (CSV)',
    queEs: 'Fotografia de preus',
    perAQueServix: 'Refrescar el catàleg',
    quanEsborrar: 'Quan arriba un tall nou i el repositori ja no el llig',
    ambit: 'llar',
    sensibilitat: 'ordinaria',
    protegit: 'no',
    conservacio: [condicio('teMesNou')]
  }),
  tipus({
    id: 'plantilla-en-blanc',
    nom: 'Plantilla en blanc (diaris, llista, calendari)',
    queEs: 'Model reutilitzable',
    perAQueServix: 'Producte',
    quanEsborrar: "Mai; les versions antigues, a l'arxiu",
    ambit: 'empresa',
    sensibilitat: 'ordinaria',
    protegit: 'sempre',
    conservacio: [MAI]
  }),
  tipus({
    id: 'mostra-salut',
    nom: 'Mostra emplenada de salut',
    queEs: "Dades de salut d'una tercera persona",
    perAQueServix: 'Les cures',
    quanEsborrar: 'Ho decidix la persona; mai al repositori',
    ambit: 'llar',
    sensibilitat: 'salut',
    protegit: 'sempre',
    conservacio: [PERSONA]
  }),
  tipus({
    id: 'credencial-clar',
    nom: 'Credencial en clar',
    queEs: 'No és un document',
    perAQueServix: 'Cap',
    quanEsborrar: "Es mou a un gestor de contrasenyes i la còpia en clar s'esborra amb confirmació",
    ambit: 'segons',
    sensibilitat: 'credencial',
    protegit: 'sempre',
    conservacio: [PERSONA]
  }),
  tipus({
    id: 'enllac',
    nom: 'Enllaç (.webloc)',
    queEs: 'Marcador',
    perAQueServix: 'Accés a un servei',
    quanEsborrar: 'Quan es dóna de baixa el servei',
    ambit: 'segons',
    sensibilitat: 'ordinaria',
    protegit: 'no',
    conservacio: [condicio('serveiDonatDeBaixa')]
  }),
  tipus({
    id: 'font-disseny',
    nom: 'Font de disseny (.afpub, .afdesign)',
    queEs: 'El fitxer editable',
    perAQueServix: 'Regenerar les exportacions',
    quanEsborrar: 'Mentre es vulga el disseny; les exportacions es poden regenerar',
    ambit: 'empresa',
    sensibilitat: 'ordinaria',
    protegit: 'no',
    conservacio: [condicio('dissenyEnDesus')]
  }),
  tipus({
    id: 'codi-antic',
    nom: 'Codi antic o prototip',
    queEs: 'Codi',
    perAQueServix: 'Referència',
    quanEsborrar: "A l'arxiu; mai es publica",
    ambit: 'empresa',
    sensibilitat: 'ordinaria',
    protegit: 'no',
    conservacio: [ARXIU]
  }),
  tipus({
    id: TIPUS_DESCONEGUT,
    nom: 'Desconegut',
    queEs: 'Res que el classificador reconega',
    perAQueServix: 'Cap',
    quanEsborrar: "MAI: «revisa'l»",
    ambit: 'segons',
    sensibilitat: 'desconeguda',
    protegit: 'sempre',
    conservacio: [MAI]
  })
]);

const PER_ID = new Map(CATALEG_TIPUS.map((t) => [t.id, t]));

/** Cert si `id` és un tipus del catàleg. */
export const esTipus = (id) => typeof id === 'string' && PER_ID.has(id);

/**
 * El tipus del catàleg amb eixe id. Un id que no hi és torna el desconegut:
 * mai s'inventa un tipus ni es proposa res d'un id estrany.
 * @param {string} id
 * @returns {object}
 */
export function tipusDocument(id) {
  return PER_ID.get(id) ?? PER_ID.get(TIPUS_DESCONEGUT);
}

/** Cert si el tipus porta algun termini amb data (i, per tant, l'avís «a verificar»). */
export const teTermini = (id) => tipusDocument(id).conservacio.some((r) => r.regla === 'termini');

/**
 * La fitxa d'un tipus en llenguatge pla: QUÈ ÉS, PER A QUÈ SERVIX i QUAN ES
 * POT ESBORRAR. Tot termini amb data porta l'avís «a verificar amb la gestoria».
 * @param {string} id
 * @returns {{ id: string, nom: string, queEs: string, perAQueServix: string, quanEsborrar: string, ambit: string, sensibilitat: string, protegit: string }}
 */
export function fitxaTipus(id) {
  const t = tipusDocument(id);
  return {
    id: t.id,
    nom: t.nom,
    queEs: t.queEs,
    perAQueServix: t.perAQueServix,
    quanEsborrar: teTermini(t.id) ? `${t.quanEsborrar} (${AVIS_TERMINI})` : t.quanEsborrar,
    ambit: t.ambit,
    sensibilitat: t.sensibilitat,
    protegit: t.protegit
  };
}
