/**
 * i18nGestoria.js — Diccionari modular pur de la Gestoria de Poble en les 5 llengües
 * oficials (ca, es, en, eu, gl). Zero imports, zero React, zero DOM i zero xarxa.
 *
 * Quan la llengua és 'ca' (per defecte), totes les funcions retornen exactament
 * les cadenes i estructures originals en valencià sense cap mutació.
 */

export const CODIS_IDIOMA_GESTORIA = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const LOCALES_IDIOMA = Object.freeze({
  ca: 'ca-ES',
  es: 'es-ES',
  en: 'en-GB',
  eu: 'eu-ES',
  gl: 'gl-ES'
});

export function codiIdiomaGestoria(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split('-')[0];
  return CODIS_IDIOMA_GESTORIA.includes(codi) ? codi : 'ca';
}

export function localeIdiomaGestoria(idioma) {
  return LOCALES_IDIOMA[codiIdiomaGestoria(idioma)];
}

const t4 = (es, en, eu, gl) => Object.freeze({ es, en, eu, gl });

/* ── 1. Cadenes estàtiques UI: Closca, Tauler, Quadre, Full, Enviament i Escàner ── */
const CADENES_PART_1 = {
  /* Insígnies i capçaleres comunes */
  GESTORIA: t4('GESTORÍA', 'BOOKKEEPING', 'GESTORIA', 'XESTORÍA'),
  'PANELL INTERN': t4('PANEL INTERNO', 'INTERNAL PANEL', 'BARNE PANELA', 'PANEL INTERNO'),
  'En proves · Beta oberta': t4('En pruebas · Beta abierta', 'In testing · Open beta', 'Probetan · Beta irekia', 'En probas · Beta aberta'),
  'En obres': t4('En obras', 'Under construction', 'Lanean', 'En obras'),
  'Titular sense configurar': t4('Titular sin configurar', 'Account holder not set', 'Titularra konfiguratu gabe', 'Titular sen configurar'),
  'Mostra les xifres': t4('Mostrar las cifras', 'Show figures', 'Erakutsi zifrak', 'Mostrar as cifras'),
  'Mostra les dades': t4('Mostrar los datos', 'Show data', 'Erakutsi datuak', 'Mostrar os datos'),
  'Sense dades': t4('Sin datos', 'No data', 'Daturik gabe', 'Sen datos'),
  'Import amagat': t4('Importe oculto', 'Hidden amount', 'Zenbateko ezkutua', 'Importe oculto'),
  'Xifra amagada': t4('Cifra oculta', 'Hidden figure', 'Zifra ezkutua', 'Cifra oculta'),
  'Valor amagat': t4('Valor oculto', 'Hidden value', 'Balio ezkutua', 'Valor oculto'),
  'Cancel·la': t4('Cancelar', 'Cancel', 'Utzi', 'Cancelar'),
  Desa: t4('Guardar', 'Save', 'Gorde', 'Gardar'),
  Continua: t4('Continuar', 'Continue', 'Jarraitu', 'Continuar'),
  'Següent': t4('Siguiente', 'Next', 'Hurrengoa', 'Seguinte'),
  Aplica: t4('Aplicar', 'Apply', 'Aplikatu', 'Aplicar'),
  Confirma: t4('Confirmar', 'Confirm', 'Berretsi', 'Confirmar'),
  Rebutja: t4('Rechazar', 'Reject', 'Baztertu', 'Rexeitar'),
  Corregix: t4('Corregir', 'Edit', 'Zuzendu', 'Corrixir'),
  Lleva: t4('Quitar', 'Remove', 'Kendu', 'Quitar'),
  Copia: t4('Copiar', 'Copy', 'Kopiatu', 'Copiar'),
  Exclou: t4('Excluir', 'Exclude', 'Baztertu', 'Excluír'),
  'Desfés': t4('Deshacer', 'Undo', 'Desegin', 'Desfacer'),
  'Sí': t4('Sí', 'Yes', 'Bai', 'Si'),
  No: t4('No', 'No', 'Ez', 'Non'),
  Fet: t4('Hecho', 'Done', 'Eginda', 'Feito'),
  Ara: t4('Ahora', 'Current', 'Orain', 'Agora'),
  'Encara no': t4('Todavía no', 'Not yet', 'Oraindik ez', 'Aínda non'),
  'Opcional.': t4('Opcional.', 'Optional.', 'Aukerakoa.', 'Opcional.'),
  Nom: t4('Nombre', 'Name', 'Izena', 'Nome'),
  'Població': t4('Población', 'Town', 'Herria', 'Poboación'),
  'Oblida les dades': t4('Olvidar los datos', 'Forget data', 'Ahaztu datuak', 'Esquecer os datos'),
  'Oblida la carpeta': t4('Olvidar la carpeta', 'Forget folder', 'Ahaztu karpeta', 'Esquecer a carpeta'),
  'Lectura completada.': t4('Lectura completada.', 'Reading completed.', 'Irakurketa osatuta.', 'Lectura completada.'),
  'Les dades s’han oblidat.': t4('Los datos se han olvidado.', 'Data has been cleared.', 'Datuak ahaztu dira.', 'Os datos esquecéronse.'),
  'Lectura cancel·lada. Les dades s’han oblidat.': t4(
    'Lectura cancelada. Los datos se han olvidado.',
    'Reading cancelled. Data has been cleared.',
    'Irakurketa bertan behera utzi da. Datuak ahaztu dira.',
    'Lectura cancelada. Os datos esquecéronse.'
  ),
  'Llegint les aprovacions dels tractors…': t4(
    'Leyendo las aprobaciones de los tractores…',
    'Reading tractor approvals…',
    'Traktoreen onespenak irakurtzen…',
    'Lendo as aprobacións dos tractores…'
  ),
  'Cal aprovar el tractor': t4(
    'Hay que aprobar el tractor',
    'Tractor approval required',
    'Traktorea onartu behar da',
    'Cómpre aprobar o tractor'
  ),

  /* Mòduls de ShellGestoria */
  'Tauler Central': t4('Tablero Central', 'Central Dashboard', 'Aginte Mahai Nagusia', 'Taboleiro Central'),
  'Gestoria de Poble': t4('Gestoría del Pueblo', 'Village Bookkeeping', 'Herriko Gestoria', 'Xestoría de Pobo'),
  'Facturació': t4('Facturación', 'Invoicing', 'Fakturazioa', 'Facturación'),
  'Factures, rectificatives i pressupostos': t4(
    'Facturas, rectificativas y presupuestos',
    'Invoices, credit notes and quotes',
    'Fakturak, zuzentzaileak eta aurrekontuak',
    'Facturas, rectificativas e orzamentos'
  ),
  'L’emissió de factures sobre el llibre Veri*Factu encara no té pantalla: ara només n’hi ha el nucli. És el pas 2 del pla de la Gestoria.': t4(
    'La emisión de facturas sobre el libro encadenado aún no tiene pantalla aquí: accede desde Facturación en la barra lateral.',
    'Issuing invoices from this shell view is not mounted here: use Invoicing in the sidebar.',
    'Liburu kateatuko fakturen jaulkipena ez dago hemen muntatuta: erabili alboko barrako Fakturazioa.',
    'A emisión de facturas sobre o libro encadeado aínda non ten pantalla aquí: accede desde Facturación na barra lateral.'
  ),
  Contactes: t4('Contactos', 'Contacts', 'Kontaktuak', 'Contactos'),
  'Clients i proveïdors': t4('Clientes y proveedores', 'Clients and suppliers', 'Bezeroak eta hornitzaileak', 'Clientes e provedores'),
  'La llibreta de clients i proveïdors encara no existix. Mentrestant, els proveïdors habituals els aprén el full trimestral.': t4(
    'La libreta de clientes y proveedores todavía no existe. Mientras tanto, la hoja trimestral aprende los proveedores habituales.',
    'The clients and suppliers address book is not built yet. Meanwhile, the quarterly sheet learns recurring suppliers.',
    'Bezero eta hornitzaileen agenda oraindik ez dago eginda. Bitartean, hiruhileko orriak ohiko hornitzaileak ikasten ditu.',
    'A axenda de clientes e provedores aínda non existe. Mentres tanto, a folla trimestral aprende os provedores habituais.'
  ),
  'Burocràcia': t4('Burocracia', 'Paperwork', 'Burokrazia', 'Burocracia'),
  'Models, cotitzacions i notificacions': t4(
    'Modelos, cotizaciones y notificaciones',
    'Tax forms, contributions and notices',
    'Ereduak, kotizazioak eta jakinarazpenak',
    'Modelos, cotizacións e notificacións'
  ),
  'El calendari d’obligacions i els avisos de terminis tenen el model pur, però encara no tenen pantalla. És el pas 4 del pla de la Gestoria.': t4(
    'El calendario de obligaciones y los avisos de plazos tienen el modelo puro, pero todavía no tienen pantalla. Es el paso 4 del plan de la Gestoría.',
    'The obligations calendar and deadline reminders have a pure model, but no screen yet. It is step 4 of the Bookkeeping roadmap.',
    'Betebeharren egutegiak eta epe-abisuek eredu purua dute, baina oraindik ez dute pantailarik. Gestoriako planaren 4. urratsa da.',
    'O calendario de obrigas e os avisos de prazos teñen o modelo puro, pero aínda non teñen pantalla. É o paso 4 do plan da Xestoría.'
  ),
  'Bancs i Tresoreria': t4('Bancos y Tesorería', 'Banking and Treasury', 'Bankuak eta Diruzaintza', 'Bancos e Tesouraría'),
  'Estat de comptes reals i conciliació': t4(
    'Estado de cuentas reales y conciliación',
    'Real account balances and reconciliation',
    'Kontu errealen egoera eta bateratzea',
    'Estado de contas reais e conciliación'
  ),
  Impostos: t4('Impuestos', 'Taxes', 'Zergak', 'Impostos'),
  'Estimacions del 303 i del 130': t4('Estimaciones del 303 y del 130', 'Form 303 and 130 estimates', '303 eta 130 ereduen estimazioak', 'Estimacións do 303 e do 130'),
  'Full trimestral': t4('Hoja trimestral', 'Quarterly sheet', 'Hiruhileko orria', 'Folla trimestral'),
  'El full de factures del trimestre per a la gestoria': t4(
    'La hoja de facturas del trimestre para la gestoría',
    'The quarterly invoice sheet for your tax advisor',
    'Gestoriarako hiruhileko faktura-orria',
    'A folla de facturas do trimestre para a xestoría'
  ),
  Informes: t4('Informes', 'Reports', 'Txostenak', 'Informes'),
  'Els models i els fulls ja lliurats': t4(
    'Los modelos y las hojas ya entregados',
    'Previously filed forms and delivered sheets',
    'Dagoeneko aurkeztutako ereduak eta orriak',
    'Os modelos e as follas xa entregados'
  ),
  'L’històric dels models presentats i dels fulls lliurats, per a contrastar-hi les estimacions, encara no existix.': t4(
    'El histórico de modelos presentados y hojas entregadas para contrastar las estimaciones todavía no existe.',
    'The archive of filed tax forms and delivered sheets for comparing estimates is not built yet.',
    'Aurkeztutako ereduen eta entregatutako orrien historikoa, estimazioak kontrastatzeko, oraindik ez dago eginda.',
    'O histórico dos modelos presentados e das follas entregadas para contrastar as estimacións aínda non existe.'
  ),
  'Escàner Local': t4('Escáner Local', 'Local Scanner', 'Tokiko Eskanerra', 'Escáner Local'),
  'Tota la carpeta d’un colp: bancs, factures, duplicats i buits': t4(
    'Toda la carpeta de un vistazo: bancos, facturas, duplicados y huecos',
    'Your whole folder at a glance: bank statements, invoices, duplicates and gaps',
    'Karpeta osoa begirada batean: bankuak, fakturak, bikoiztuak eta hutsuneak',
    'Toda a carpeta dun golpe: bancos, facturas, duplicados e ocos'
  ),
  'Este mòdul de la Gestoria encara no existix: ací es diu què hi haurà i en quin pas del pla arriba.': t4(
    'Este módulo de la Gestoría todavía no existe: aquí se explica qué habrá y en qué paso del plan llega.',
    'This Bookkeeping module is not built yet: here you can see what is planned and when it arrives.',
    'Gestoriako modulu hau oraindik ez dago eginda: hemen azaltzen da zer egongo den eta planaren zein urratsetan iritsiko den.',
    'Este módulo da Xestoría aínda non existe: aquí explícase que haberá e en que paso do plan chega.'
  ),
  'Ací tens la realitat de la teua empresa, calculada en este ordinador amb els extractes que tries.': t4(
    'Aquí tienes la realidad de tu empresa, calculada en este ordenador con los extractos que elijas.',
    'Here is your business reality, computed on this computer from the bank statements you choose.',
    'Hemen duzu zure enpresaren errealitatea, ordenagailu honetan zuk aukeratutako laburpenekin kalkulatuta.',
    'Aquí tes a realidade da túa empresa, calculada neste ordenador cos extractos que escollas.'
  ),
  'Qui porta esta gestoria?': t4('¿Quién lleva esta gestoría?', 'Who runs this bookkeeping?', 'Nork darama gestoria hau?', 'Quen leva esta xestoría?'),
  'Configura el titular': t4('Configurar el titular', 'Set account holder', 'Konfiguratu titularra', 'Configurar o titular'),
  'Entra al compte': t4('Entrar en la cuenta', 'Sign in', 'Sartu kontuan', 'Entrar na conta'),
  'Pots dir ací el nom i la població (només en este ordinador i mentre la Gestoria està oberta) o entrar al teu compte, que en acabar et torna al Tauler.': t4(
    'Puedes indicar aquí el nombre y la población (solo en este ordenador y mientras la Gestoría esté abierta) o entrar en tu cuenta, que al terminar te devuelve al Tablero.',
    'You can enter a name and town here (kept only in memory while Bookkeeping is open) or sign in to your account, returning directly to the Dashboard.',
    'Hemen izena eta herria adieraz ditzakezu (ordenagailu honetan soilik eta Gestoria irekita dagoen bitartean) edo zure kontuan sartu, amaitzean Arbelera itzuliz.',
    'Podes indicar aquí o nome e a poboación (só neste ordenador e mentres a Xestoría estea aberta) ou entrar na túa conta, que ao rematar te devolve ao Taboleiro.'
  ),
  'Pots dir ací el nom i la població: només en este ordinador i mentre la Gestoria està oberta.': t4(
    'Puedes indicar aquí el nombre y la población: solo en este ordenador y mientras la Gestoría esté abierta.',
    'You can enter a name and town here: kept only on this computer while Bookkeeping is open.',
    'Hemen izena eta herria adieraz ditzakezu: ordenagailu honetan soilik eta Gestoria irekita dagoen bitartean.',
    'Podes indicar aquí o nome e a poboación: só neste ordenador e mentres a Xestoría estea aberta.'
  ),
  'Titular d’esta pàgina': t4('Titular de esta página', 'Account holder for this page', 'Orri honetako titularra', 'Titular desta páxina'),
  'Canvia el titular': t4('Cambiar el titular', 'Change holder', 'Aldatu titularra', 'Cambiar o titular'),
  'Oblida el titular': t4('Olvidar el titular', 'Clear holder', 'Ahaztu titularra', 'Esquecer o titular'),
  'Només viu en la memòria d’esta pàgina: no és cap compte i no ix d’este ordinador.': t4(
    'Solo vive en la memoria de esta página: no es ninguna cuenta y no sale de este ordenador.',
    'Lives only in this page’s memory: it is not an account and never leaves this computer.',
    'Orri honen memorian soilik bizi da: ez da kontu bat eta ez da ordenagailu honetatik ateratzen.',
    'Só vive na memoria desta páxina: non é ningunha conta e non sae deste ordenador.'
  ),
  'Només es guarda en la memòria d’esta pàgina: no ix d’este ordinador, no és cap compte i «Oblida el titular» o «Oblida les dades» l’esborren.': t4(
    'Solo se guarda en la memoria de esta página: no sale de este ordenador, no es ninguna cuenta y «Olvidar el titular» u «Olvidar los datos» lo borran.',
    'Kept only in this page’s memory: it never leaves this computer, is not an account, and “Clear holder” or “Forget data” erases it.',
    'Orri honen memorian soilik gordetzen da: ez da ordenagailu honetatik ateratzen, ez da kontu bat eta «Ahaztu titularra» edo «Ahaztu datuak» sakatzeak ezabatzen du.',
    'Só se garda na memoria desta páxina: non sae deste ordenador, non é ningunha conta e «Esquecer o titular» ou «Esquecer os datos» bórrano.'
  ),

  /* TargetaTauler i Tauler */
  'Les xifres de la Gestoria no es traduïxen: el que mostren no ix d’este ordinador.': t4(
    'Las cifras de la Gestoría no se envían a traducir: lo que muestran no sale de este ordenador.',
    'Bookkeeping figures are never sent to translation services: nothing shown here leaves this computer.',
    'Gestoriako zifrak ez dira itzultzera bidaltzen: erakusten dutena ez da ordenagailu honetatik ateratzen.',
    'As cifras da Xestoría non se envían a traducir: o que mostran non sae deste ordenador.'
  ),
  'A la Gestoria no s’hi comenta: les dades no ixen d’este ordinador. Si vols parlar amb Sóc de Poble, obri el Xat; en eixir de la Gestoria, la lectura dels extractes s’oblida.': t4(
    'En la Gestoría no se comenta: los datos no salen de este ordenador. Si quieres hablar con Sóc de Poble, abre el Chat; al salir de la Gestoría, la lectura de los extractos se olvida.',
    'Commenting is disabled in Bookkeeping: your data never leaves this computer. To talk with Sóc de Poble, open Chat; leaving Bookkeeping clears loaded statements.',
    'Gestorian ez da iruzkinik egiten: datuak ez dira ordenagailu honetatik ateratzen. Sóc de Poblerekin hitz egiteko, ireki Txata; Gestoriatik irtetean, laburpenen irakurketa ahaztu egiten da.',
    'Na Xestoría non se comenta: os datos non saen deste ordenador. Se queres falar con Sóc de Poble, abre o Chat; ao saír da Xestoría, a lectura dos extractos esquécese.'
  ),
  'Esta pàgina és privada i no es comparteix. El full per a la gestoria es prepara a la secció «Plantilla Gestoria» del Quadre de comandament, després de revisar-lo al Full trimestral.': t4(
    'Esta página es privada y no se comparte. La hoja para la gestoría se prepara en la sección «Plantilla Gestoría» del Cuadro de mando, tras revisarla en la Hoja trimestral.',
    'This page is private and cannot be shared. Your advisor’s spreadsheet is prepared under “Advisor Template” in the Command Deck after reviewing the Quarterly Sheet.',
    'Orri hau pribatua da eta ez da partekatzen. Gestoriarako orria Aginte Koadroko «Gestoria Txantiloia» atalean prestatzen da, Hiruhileko orrian berrikusi ondoren.',
    'Esta páxina é privada e non se comparte. A folla para a xestoría prepárase na sección «Modelo Xestoría» do Cadro de mando, tras revisala na Folla trimestral.'
  ),
  'Esta pàgina és privada: no es connecta al teu Bloc, perquè les xifres només viuen en este ordinador.': t4(
    'Esta página es privada: no se conecta a tu Bloc, porque las cifras solo viven en este ordenador.',
    'This page is private: it does not connect to your Notebook because figures live solely on this computer.',
    'Orri hau pribatua da: ez da zure Blokera konektatzen, zifrak ordenagailu honetan soilik bizi direlako.',
    'Esta páxina é privada: non se conecta ao teu Caderno, porque as cifras só viven neste ordenador.'
  ),
  Targetes: t4('Tarjetas', 'Cards', 'Txartelak', 'Tarxetas'),
  'Quadre de comandament': t4('Cuadro de mando', 'Command deck', 'Aginte-koadroa', 'Cadro de mando'),
  'Vista comprimida': t4('Vista comprimida', 'Compact view', 'Ikuspegi trinkoa', 'Vista comprimida'),
  'La teua realitat': t4('Tu realidad', 'Your reality', 'Zure errealitatea', 'A túa realidade'),
  'Finances (últims 30 dies)': t4('Finanzas (últimos 30 días)', 'Finances (last 30 days)', 'Finantzak (azken 30 egunak)', 'Finanzas (últimos 30 días)'),
  'Estimacions del trimestre': t4('Estimaciones del trimestre', 'Quarterly estimates', 'Hiruhilekoaren estimazioak', 'Estimacións do trimestre'),
  Concepte: t4('Concepto', 'Item', 'Kontzeptua', 'Concepto'),
  Xifra: t4('Cifra', 'Figure', 'Zifra', 'Cifra'),
  'Trimestre anterior': t4('Trimestre anterior', 'Previous quarter', 'Aurreko hiruhilekoa', 'Trimestre anterior'),
  Hui: t4('Hoy', 'Today', 'Gaur', 'Hoxe'),
  'Trimestre següent': t4('Trimestre siguiente', 'Next quarter', 'Hurrengo hiruhilekoa', 'Trimestre seguinte'),
  'Context del panell': t4('Contexto del panel', 'Panel context', 'Panelaren testuingurua', 'Contexto do panel'),
  'Vista del panell': t4('Vista del panel', 'Panel view', 'Panelaren ikuspegia', 'Vista do panel'),
  'Sense trimestre': t4('Sin trimestre', 'No quarter', 'Hiruhilekorik gabe', 'Sen trimestre'),
  'El termini': t4('El plazo', 'Filing deadline', 'Epea', 'O prazo'),
  'Terminis orientatius: a verificar amb la gestoria.': t4(
    'Plazos orientativos: a verificar con la gestoría.',
    'Indicative deadlines: verify with your tax advisor.',
    'Epe orientagarriak: gestoriarekin egiaztatzekoak.',
    'Prazos orientativos: a verificar coa xestoría.'
  ),
  'Hisenda sobre la caixa real': t4('Hacienda sobre la caja real', 'Taxes against real cash', 'Ogasuna kutxa errealaren gainean', 'Facenda sobre a caixa real'),
  'Ni el 303 ni el 130 d’este trimestre surten a pagar: el detall de cada model és a la targeta Hisenda.': t4(
    'Ni el 303 ni el 130 de este trimestre salen a pagar: el detalle de cada modelo está en la tarjeta Hacienda.',
    'Neither Form 303 nor Form 130 has a payable balance this quarter: check the Taxes card for details.',
    'Hiruhileko honetako 303 eta 130 ereduek ez dute ordaintzeko emaitzarik: eredu bakoitzaren xehetasuna Ogasuna txartelean dago.',
    'Nin o 303 nin o 130 deste trimestre saen a pagar: o detalle de cada modelo está na tarxeta Facenda.'
  ),
  'La caixa real és zero o en descobert: no en queda cap part per a l’estimació de Hisenda.': t4(
    'La caja real es cero o está en descubierto: no queda margen para la estimación de Hacienda.',
    'Real cash is zero or overdrawn: no balance covers the estimated tax liability.',
    'Kutxa erreala zero da edo zorpean dago: ez da zatirik geratzen Ogasunaren estimaziorako.',
    'A caixa real é cero ou está en descuberto: non queda marxe para a estimación de Facenda.'
  ),
  'La part de la caixa real que caldria per a Hisenda': t4(
    'La parte de la caja real necesaria para Hacienda',
    'Share of real cash needed for estimated taxes',
    'Ogasunerako beharko litzatekeen kutxa errealaren zatia',
    'A parte da caixa real que cumpría para Facenda'
  ),
  'L’estimació supera la caixa real.': t4(
    'La estimación supera la caja real.',
    'The estimate exceeds available cash.',
    'Estimazioak kutxa erreala gainditzen du.',
    'A estimación supera a caixa real.'
  ),
  'Estat de la lectura': t4('Estado de la lectura', 'Reading status', 'Irakurketaren egoera', 'Estado da lectura'),
  'Tria els extractes del banc': t4('Elige los extractos del banco', 'Choose bank statements', 'Aukeratu bankuko laburpenak', 'Escolle os extractos do banco'),
  'Norma 43 o el CSV de moviments i, si vols, la configuració de l’empresa (.json) per a la teua boina. Res es puja enlloc.': t4(
    'Norma 43 o el CSV de movimientos y, si quieres, la configuración de la empresa (.json) para la cabecera. Nada se sube a ningún sitio.',
    'AEB Norma 43 or transactions CSV and, optionally, your company profile (.json) for the header. Nothing is uploaded anywhere.',
    '43 Araua edo mugimenduen CSVa eta, nahi baduzu, enpresaren konfigurazioa (.json) goibururako. Ez da ezer inora igotzen.',
    'Norma 43 ou o CSV de movementos e, se queres, a configuración da empresa (.json) para a cabeceira. Nada se sobe a ningún sitio.'
  ),
  'Llegint els extractes…': t4('Leyendo los extractos…', 'Reading statements…', 'Laburpenak irakurtzen…', 'Lendo os extractos…'),
  'No s’han pogut llegir els extractes': t4(
    'No se han podido leer los extractos',
    'Could not read statements',
    'Ezin izan dira laburpenak irakurri',
    'Non se puideron ler os extractos'
  ),
  'Hi ha fitxers que no s’han llegit': t4(
    'Hay archivos que no se han leído',
    'Some files were not read',
    'Irakurri ez diren fitxategiak daude',
    'Hai ficheiros que non se leron'
  ),
  'Notes de la lectura': t4('Notas de la lectura', 'Reading notes', 'Irakurketaren oharrak', 'Notas da lectura'),
  'Encara no hi ha cap compte': t4('Todavía no hay ninguna cuenta', 'No bank accounts loaded yet', 'Oraindik ez dago konturik', 'Aínda non hai ningunha conta'),
  'Tria els extractes del banc: cada compte hi tindrà la seua targeta, amb el saldo i el que hi ha entrat i eixit.': t4(
    'Elige los extractos del banco: cada cuenta tendrá su tarjeta, con el saldo y lo que ha entrado y salido.',
    'Choose your bank statements: each account gets its own card showing its balance, inflows and outflows.',
    'Aukeratu bankuko laburpenak: kontu bakoitzak bere txartela izango du, saldoarekin eta sartu zein irtendakoarekin.',
    'Escolle os extractos do banco: cada conta terá a súa tarxeta, co saldo e o que entrou e saíu.'
  ),
  'La xifra': t4('La cifra', 'The figure', 'Zifra', 'A cifra'),
  'D’on ix': t4('De dónde sale', 'Source', 'Nondik datorren', 'De onde sae'),

  /* CabinaAvio i PlantillaGestoria */
  'Mes sencer': t4('Mes completo', 'Full month', 'Hilabete osoa', 'Mes enteiro'),
  'Part del mes': t4('Parte del mes', 'Partial month', 'Hilabetearen zatia', 'Parte do mes'),
  'Sense extractes': t4('Sin extractos', 'No statements', 'Laburpenik gabe', 'Sen extractos'),
  'Encara no hi ha cap mes amb moviments en euros': t4(
    'Todavía no hay ningún mes con movimientos en euros',
    'No months with euro transactions yet',
    'Oraindik ez dago eurotako mugimendurik duen hilabeterik',
    'Aínda non hai ningún mes con movementos en euros'
  ),
  'Gràfics amagats': t4('Gráficos ocultos', 'Hidden charts', 'Grafiko ezkutuak', 'Gráficos ocultos'),
  'Prem l’ull de la boina per a veure’ls: l’alçada de les barres diu les xifres.': t4(
    'Pulsa el ojo de la cabecera para verlos: la altura de las barras revela las cifras.',
    'Press the eye icon in the header to reveal them: bar heights reflect real amounts.',
    'Sakatu goiburuko begia ikusteko: barren altuerak zifrak adierazten ditu.',
    'Preme o ollo da cabeceira para velos: a altura das barras indica as cifras.'
  ),
  'Entrades per mes': t4('Entradas por mes', 'Monthly inflows', 'Sarrerak hilabeteka', 'Entradas por mes'),
  'Eixides per mes': t4('Salidas por mes', 'Monthly outflows', 'Irteerak hilabeteka', 'Saídas por mes'),
  'Sense moviments': t4('Sin movimientos', 'No transactions', 'Mugimendurik gabe', 'Sen movementos'),
  'Taula · Flux de caixa per mes': t4('Tabla · Flujo de caja por mes', 'Table · Monthly cash flow', 'Taula · Kutxa-fluxua hilabeteka', 'Táboa · Fluxo de caixa por mes'),
  Mes: t4('Mes', 'Month', 'Hilabetea', 'Mes'),
  Cobertura: t4('Cobertura', 'Coverage', 'Estaldura', 'Cobertura'),
  Entrades: t4('Entradas', 'Inflows', 'Sarrerak', 'Entradas'),
  Eixides: t4('Salidas', 'Outflows', 'Irteerak', 'Saídas'),
  Net: t4('Neto', 'Net', 'Garbia', 'Neto'),
  Falta: t4('Falta', 'Missing', 'Falta da', 'Falta'),
  'Falta, i el banc té el càrrec': t4('Falta, y el banco tiene el cargo', 'Missing, bank charge found', 'Falta da, eta bankuak zordunketa du', 'Falta, e o banco ten o cargo'),
  'En falta alguna': t4('Falta alguna', 'Some may be missing', 'Baten bat falta da', 'Falta algunha'),
  'Sense extracte del mes': t4('Sin extracto del mes', 'No statement for month', 'Hilabeteko laburpenik gabe', 'Sen extracto do mes'),
  'Sense historial per a buscar-lo': t4('Sin historial para buscarlo', 'No history to match', 'Bilatzeko historikorik gabe', 'Sen historial para buscalo'),
  'Cap càrrec que hi case': t4('Ningún cargo coincide', 'No matching bank charge', 'Bat datorren zordunketarik ez', 'Ningún cargo que cadre'),
  'Diversos càrrecs hi podrien casar': t4('Varios cargos podrían coincidir', 'Multiple charges might match', 'Zordunketa bat baino gehiago etor litezke bat', 'Varios cargos poderían cadrar'),
  'Un càrrec que també podria ser d’un altre mes': t4(
    'Un cargo que también podría ser de otro mes',
    'Charge could belong to another month',
    'Beste hilabete batekoa ere izan litekeen zordunketa',
    'Un cargo que tamén podería ser doutro mes'
  ),
  'Ja n’hi ha alguna: no es busca': t4('Ya hay alguna: no se busca', 'Invoice present: not searched', 'Badago baten bat: ez da bilatzen', 'Xa hai algunha: non se busca'),
  'Analitza el trimestre al Full trimestral: amb les seues factures i els extractes del banc, ací es diu quines factures habituals podrien faltar.': t4(
    'Analiza el trimestre en la Hoja trimestral: con sus facturas y los extractos del banco, aquí se indica qué facturas habituales podrían faltar.',
    'Analyse the quarter in the Quarterly Sheet: combining its invoices with bank statements highlights recurring invoices that might be missing.',
    'Aztertu hiruhilekoa Hiruhileko orrian: hango fakturekin eta bankuko laburpenekin, hemen ohiko zein faktura falta litezkeen esaten da.',
    'Analiza o trimestre na Folla trimestral: coas súas facturas e os extractos do banco, aquí dise que facturas habituais poderían faltar.'
  ),
  'No s’ha pogut creuar el Full trimestral amb els extractes: revisa’ls al Full.': t4(
    'No se ha podido cruzar la Hoja trimestral con los extractos: revísalos en la Hoja.',
    'Could not cross-check the Quarterly Sheet with bank statements: review them in the Sheet.',
    'Ezin izan da Hiruhileko orria laburpenekin gurutzatu: berrikusi Orrian.',
    'Non se puido cruzar a Folla trimestral cos extractos: revísaos na Folla.'
  ),
  'Taula · Factures que falten': t4('Tabla · Facturas que faltan', 'Table · Missing invoices', 'Taula · Falta diren fakturak', 'Táboa · Facturas que faltan'),
  'Proveïdor': t4('Proveedor', 'Supplier', 'Hornitzailea', 'Provedor'),
  Estat: t4('Estado', 'Status', 'Egoera', 'Estado'),
  'Càrrec al banc': t4('Cargo en el banco', 'Bank charge', 'Bankuko zordunketa', 'Cargo no banco'),
  'On demanar-la': t4('Dónde pedirla', 'Where to request it', 'Non eskatu', 'Onde pedila'),
  'La seua àrea de clients o el correu': t4('Su área de clientes o el correo', 'Customer portal or email', 'Bere bezero-gunea edo posta', 'A súa área de clientes ou o correo'),
  'Cap proveïdor habitual no té cap mes sense factura amb les dades d’este Full.': t4(
    'Ningún proveedor habitual tiene meses sin factura según los datos de esta Hoja.',
    'No recurring supplier has a month without an invoice based on this Sheet.',
    'Ohiko hornitzaile bakar batek ere ez du fakturarik gabeko hilabeterik Orri honetako datuekin.',
    'Ningún provedor habitual ten ningún mes sen factura cos datos desta Folla.'
  ),
  'Altres indicis del trimestre': t4('Otros indicios del trimestre', 'Other quarterly clues', 'Hiruhilekoko beste zantzu batzuk', 'Outros indicios do trimestre'),
  'Extractes antics': t4('Extractos antiguos', 'Outdated statements', 'Laburpen zaharrak', 'Extractos antigos'),
  Instruments: t4('Instrumentos', 'Instruments', 'Tresnak', 'Instrumentos'),
  'Flux de caixa per mes': t4('Flujo de caja por mes', 'Monthly cash flow', 'Kutxa-fluxua hilabeteka', 'Fluxo de caixa por mes'),
  Venciments: t4('Vencimientos', 'Deadlines', 'Epemugak', 'Vencementos'),
  'Sense el dia d’avui no es poden dir els venciments.': t4(
    'Sin la fecha de hoy no se pueden calcular los vencimientos.',
    'Deadlines cannot be computed without today’s date.',
    'Gaurko egunik gabe ezin dira epemugak kalkulatu.',
    'Sen o día de hoxe non se poden indicar os vencementos.'
  ),
  'Factures que falten': t4('Facturas que faltan', 'Missing invoices', 'Falta diren fakturak', 'Facturas que faltan'),
  'Plantilla Gestoria': t4('Plantilla Gestoría', 'Advisor Template', 'Gestoria Txantiloia', 'Modelo Xestoría'),
  'El full de la gestoria el prepara el Full trimestral.': t4(
    'La hoja de la gestoría la prepara la Hoja trimestral.',
    'The advisor spreadsheet is generated in the Quarterly Sheet.',
    'Gestoriako orria Hiruhileko orriak prestatzen du.',
    'A folla da xestoría prepáraa a Folla trimestral.'
  ),
  'Encara no hi ha cap full generat': t4('Todavía no hay ninguna hoja generada', 'No spreadsheet generated yet', 'Oraindik ez dago sortutako orririk', 'Aínda non hai ningunha folla xerada'),
  'Obri el Full trimestral': t4('Abrir la Hoja trimestral', 'Open Quarterly Sheet', 'Ireki Hiruhileko orria', 'Abrir a Folla trimestral'),
  'Al Full trimestral, analitza el trimestre, revisa la proposta i prem «Genera el full»: ací el veuràs tal com el rebrà la gestoria, i el podràs descarregar o preparar-ne el correu.': t4(
    'En la Hoja trimestral, analiza el trimestre, revisa la propuesta y pulsa «Generar la hoja»: aquí la verás tal como la recibirá la gestoría y podrás descargarla o preparar el correo.',
    'In the Quarterly Sheet, analyse the quarter, review the draft and press “Generate sheet”: you will see it here exactly as your advisor receives it, ready to download or email.',
    'Hiruhileko orrian, aztertu hiruhilekoa, berrikusi proposamena eta sakatu «Sortu orria»: hemen gestoriak jasoko duen bezalaxe ikusiko duzu, deskargatzeko edo mezua prestatzeko.',
    'Na Folla trimestral, analiza o trimestre, revisa a proposta e preme «Xerar a folla»: aquí verala tal como a recibirá a xestoría e poderás descargala ou preparar o correo.'
  ),
  'Taula · Plantilla Gestoria': t4('Tabla · Plantilla Gestoría', 'Table · Advisor Template', 'Taula · Gestoria Txantiloia', 'Táboa · Modelo Xestoría'),
  'Full amagat': t4('Hoja oculta', 'Hidden sheet', 'Orri ezkutua', 'Folla oculta'),
  'Prem l’ull de la boina per a veure’l: el full porta imports, noms i NIF.': t4(
    'Pulsa el ojo de la cabecera para verla: la hoja contiene importes, nombres y NIF.',
    'Press the eye icon in the header to view it: the sheet contains amounts, names and tax IDs.',
    'Sakatu goiburuko begia ikusteko: orriak zenbatekoak, izenak eta IFZak ditu.',
    'Preme o ollo da cabeceira para vela: a folla leva importes, nomes e NIF.'
  ),
  'Descarrega l’XLSX': t4('Descargar el XLSX', 'Download XLSX', 'Deskargatu XLSX', 'Descargar o XLSX'),
  'Descarrega el CSV': t4('Descargar el CSV', 'Download CSV', 'Deskargatu CSV', 'Descargar o CSV'),
  'Prepara el correu per a la gestoria': t4(
    'Preparar el correo para la gestoría',
    'Prepare email for tax advisor',
    'Prestatu gestoriarako mezua',
    'Preparar o correo para a xestoría'
  ),
  'Vista prèvia del full': t4('Vista previa de la hoja', 'Spreadsheet preview', 'Orriaren aurrebista', 'Vista previa da folla'),

  /* ContenidorGestoria, PanellGestoria i EnviamentGestoria */
  'No s’han pogut llegir les aprovacions dels tractors': t4(
    'No se han podido leer las aprobaciones de los tractores',
    'Could not read tractor approvals',
    'Ezin izan dira traktoreen onespenak irakurri',
    'Non se puideron ler as aprobacións dos tractores'
  ),
  Aprovat: t4('Aprobado', 'Approved', 'Onartuta', 'Aprobado'),
  Pendent: t4('Pendiente', 'Pending', 'Zain', 'Pendente'),
  Caducat: t4('Caducado', 'Expired', 'Iraungita', 'Caducado'),
  Revocat: t4('Revocado', 'Revoked', 'Baliogabetuta', 'Revogado'),
  'Versió canviada': t4('Versión cambiada', 'Version changed', 'Bertsioa aldatuta', 'Versión cambiada'),
  Incomplet: t4('Incompleto', 'Incomplete', 'Osatu gabea', 'Incompleto'),
  'Sense empremta': t4('Sin huella', 'No hash', 'Aztarnarik gabe', 'Sen pegada'),
  'Llistant la carpeta': t4('Listando la carpeta', 'Listing folder', 'Karpeta zerrendatzen', 'Listando a carpeta'),
  'Llegint els fulls dels trimestres anteriors': t4(
    'Leyendo las hojas de trimestres anteriores',
    'Reading previous quarters’ sheets',
    'Aurreko hiruhilekoetako orriak irakurtzen',
    'Lendo as follas dos trimestres anteriores'
  ),
  'Llegint les factures': t4('Leyendo las facturas', 'Reading invoices', 'Fakturak irakurtzen', 'Lendo as facturas'),
  'Traient els camps de cada factura': t4('Extrayendo los campos de cada factura', 'Extracting invoice fields', 'Faktura bakoitzeko eremuak ateratzen', 'Tirando os campos de cada factura'),
  'Revisant el trimestre': t4('Revisando el trimestre', 'Auditing quarter', 'Hiruhilekoa berrikusten', 'Revisando o trimestre'),
  'Preparant l’anàlisi': t4('Preparando el análisis', 'Preparing analysis', 'Analisia prestatzen', 'Preparando a análise'),
  'Prepara el full trimestral per a la gestoria a partir de la teua carpeta de factures. L’anàlisi es fa en este ordinador: les factures no es pugen enlloc ni es guarden al navegador. Només el correu del pas 5, si el prepares tu, ix cap a la gestoria.': t4(
    'Prepara la hoja trimestral para la gestoría a partir de tu carpeta de facturas. El análisis se hace en este ordenador: las facturas no se suben a ningún sitio ni se guardan en el navegador. Solo el correo del paso 5, si lo preparas tú, sale hacia la gestoría.',
    'Prepare your quarterly invoice spreadsheet from your local folder. Analysis runs on this computer: invoices are never uploaded or stored in the browser. Only the step 5 email draft, initiated by you, goes to your advisor.',
    'Prestatu gestoriarako hiruhileko orria zure faktura-karpetatik abiatuta. Analisia ordenagailu honetan egiten da: fakturak ez dira inora igotzen ezta nabigatzailean gordetzen ere. 5. urratseko mezua soilik, zuk prestatzen baduzu, doa gestoriara.',
    'Prepara a folla trimestral para a xestoría a partir da túa carpeta de facturas. A análise faise neste ordenador: as facturas non se soben a ningún sitio nin se gardan no navegador. Só o correo do paso 5, se o preparas ti, sae cara á xestoría.'
  ),
  Desenxufa: t4('Desenchufar', 'Disconnect', 'Deskonektatu', 'Desenchufar'),
  'Aprovació dels tractors': t4('Aprobación de los tractores', 'Tractor approvals', 'Traktoreen onespena', 'Aprobación dos tractores'),
  'El tractor de factures està aprovat: pots triar la carpeta.': t4(
    'El tractor de facturas está aprobado: puedes elegir la carpeta.',
    'The invoice tractor is approved: you can select a folder.',
    'Fakturen traktorea onartuta dago: karpeta aukera dezakezu.',
    'O tractor de facturas está aprobado: podes escoller a carpeta.'
  ),
  'Cal aprovar el tractor de factures': t4(
    'Hay que aprobar el tractor de facturas',
    'Invoice tractor approval required',
    'Fakturen traktorea onartu behar da',
    'Cómpre aprobar o tractor de facturas'
  ),
  'Carpeta i trimestre': t4('Carpeta y trimestre', 'Folder and quarter', 'Karpeta eta hiruhilekoa', 'Carpeta e trimestre'),
  'Trimestre que prepares': t4('Trimestre que preparas', 'Quarter to prepare', 'Prestatzen ari zaren hiruhilekoa', 'Trimestre que preparas'),
  Any: t4('Año', 'Year', 'Urtea', 'Ano'),
  Trimestre: t4('Trimestre', 'Quarter', 'Hiruhilekoa', 'Trimestre'),
  'L’anàlisi no ix d’este ordinador': t4(
    'El análisis no sale de este ordenador',
    'Analysis never leaves this computer',
    'Analisia ez da ordenagailu honetatik ateratzen',
    'A análise non sae deste ordenador'
  ),
  'El navegador només dona a esta pàgina la carpeta que tries, i només per a llegir-la. Les factures viuen en memòria fins que prems «Desenxufa» o tanques la pestanya. L’únic pas que ix d’este ordinador és el correu per a la gestoria, que inicies tu al pas 5.': t4(
    'El navegador solo entrega a esta página la carpeta que eliges, y únicamente en lectura. Las facturas viven en memoria hasta que pulsas «Desenchufar» o cierras la pestaña. El único paso externo es el correo para la gestoría que tú inicias en el paso 5.',
    'The browser grants read-only access solely to the folder you pick. Invoices stay in memory until you press “Disconnect” or close the tab. Nothing leaves this device except the advisor email you initiate in step 5.',
    'Nabigatzaileak zuk aukeratutako karpeta soilik ematen dio orri honi, irakurtzeko bakarrik. Fakturak memorian bizi dira «Deskonektatu» sakatu edo fitxa itxi arte. Ordenagailu honetatik irteten den urrats bakarra 5. urratsean zuk abiarazten duzun mezua da.',
    'O navegador só dá a esta páxina a carpeta que escolles, e só para lela. As facturas viven en memoria ata que premes «Desenchufar» ou pechas a lapela. O único paso que sae deste ordenador é o correo para a xestoría que inicias ti no paso 5.'
  ),
  'Tria una altra carpeta': t4('Elegir otra carpeta', 'Choose another folder', 'Aukeratu beste karpeta bat', 'Escoller outra carpeta'),
  'Tria la carpeta de factures': t4('Elegir la carpeta de facturas', 'Choose invoices folder', 'Aukeratu fakturen karpeta', 'Escoller a carpeta de facturas'),
  'Este navegador no obri el selector de carpetes: tria-la amb este botó. Res es puja enlloc.': t4(
    'Este navegador no abre el selector de carpetas: elígela con este botón. Nada se sube a ningún sitio.',
    'This browser does not support the native folder picker: select your folder with this button. Nothing is uploaded.',
    'Nabigatzaile honek ez du karpeta-hautatzailea irekitzen: aukeratu botoi honekin. Ez da ezer inora igotzen.',
    'Este navegador non abre o selector de carpetas: escóllea con este botón. Nada se sobe a ningún sitio.'
  ),
  'Primer cal aprovar el tractor de factures (pas 1).': t4(
    'Primero hay que aprobar el tractor de facturas (paso 1).',
    'Approve the invoice tractor first (step 1).',
    'Lehenik fakturen traktorea onartu behar da (1. urratsa).',
    'Primeiro cómpre aprobar o tractor de facturas (paso 1).'
  ),
  'Revisió': t4('Revisión', 'Review', 'Berrikuspena', 'Revisión'),
  'Quan analitzes la carpeta, ací veuràs la proposta per a revisar-la i corregir-la.': t4(
    'Cuando analices la carpeta, aquí verás la propuesta para revisarla y corregirla.',
    'Once you analyse the folder, the draft will appear here for review and editing.',
    'Karpeta aztertzean, hemen ikusiko duzu proposamena berrikusteko eta zuzentzeko.',
    'Cando analices a carpeta, aquí verás a proposta para revisala e corrixila.'
  ),
  'Correu no revisat': t4('Correo no revisado', 'Email not cross-checked', 'Posta berrikusi gabe', 'Correo non revisado'),
  'Sense creuar el correu, les factures que falten es busquen només a la carpeta i a l’historial: esta revisió no pot ser completa.': t4(
    'Sin cruzar el correo, las facturas que faltan se buscan solo en la carpeta y en el historial: esta revisión no puede ser completa.',
    'Without cross-checking email, missing invoices are only searched in the folder and past sheets: this check cannot be exhaustive.',
    'Posta gurutzatu gabe, falta diren fakturak karpetan eta historikoan soilik bilatzen dira: berrikuspen hau ezin da osoa izan.',
    'Sen cruzar o correo, as facturas que faltan búscanse só na carpeta e no historial: esta revisión non pode ser completa.'
  ),
  'Titular del full': t4('Titular de la hoja', 'Sheet account holder', 'Orriaren titularra', 'Titular da folla'),
  'El nom que encapçala el full i els fitxers.': t4(
    'El nombre que encabeza la hoja y los archivos.',
    'The name heading the spreadsheet and exported files.',
    'Orria eta fitxategiak izendatzen dituen izena.',
    'O nome que encabeza a folla e os ficheiros.'
  ),
  'Creua amb el correu': t4('Cruzar con el correo', 'Cross-check with email', 'Gurutzatu postarekin', 'Cruzar co correo'),
  'Opcional. Amb una exportació del correu del trimestre (.mbox o .eml) es busquen les factures que t’han arribat per correu i no són a la carpeta. Només se’n lligen el remitent, l’assumpte, la data i el nom dels adjunts.': t4(
    'Opcional. Con una exportación del correo del trimestre (.mbox o .eml) se buscan facturas recibidas por correo que no estén en la carpeta. Solo se leen remitente, asunto, fecha y nombre de adjuntos.',
    'Optional. Using a quarterly email export (.mbox or .eml), checks for emailed invoices missing from your folder. Reads only sender, subject, date and attachment filenames.',
    'Aukerakoa. Hiruhilekoko postaren esportazio batekin (.mbox edo .eml) postaz iritsi eta karpetan ez dauden fakturak bilatzen dira. Igorlea, gaia, data eta eranskinen izenak soilik irakurtzen dira.',
    'Opcional. Cunha exportación do correo do trimestre (.mbox ou .eml) búscanse as facturas que chegaron por correo e non están na carpeta. Só se len o remitente, o asunto, a data e o nome dos anexos.'
  ),
  'Exportació del correu (.mbox o .eml)': t4('Exportación del correo (.mbox o .eml)', 'Email export (.mbox or .eml)', 'Postaren esportazioa (.mbox edo .eml)', 'Exportación do correo (.mbox ou .eml)'),
  'Cal aprovar el tractor del correu': t4('Hay que aprobar el tractor del correo', 'Email tractor approval required', 'Postaren traktorea onartu behar da', 'Cómpre aprobar o tractor do correo'),
  'Creuant el correu…': t4('Cruzando el correo…', 'Cross-checking email…', 'Posta gurutzatzen…', 'Cruzando o correo…'),
  'Proposta del full': t4('Propuesta de la hoja', 'Spreadsheet draft', 'Orriaren proposamena', 'Proposta da folla'),
  'Quan hi haja una proposta, ací la veuràs tal com la rebrà la gestoria.': t4(
    'Cuando haya una propuesta, aquí la verás tal como la recibirá la gestoría.',
    'Once a draft is ready, you will preview it here exactly as your advisor receives it.',
    'Proposamen bat dagoenean, hemen ikusiko duzu gestoriak jasoko duen bezalaxe.',
    'Cando haxa unha proposta, aquí verala tal como a recibirá a xestoría.'
  ),
  'He revisat la proposta': t4('He revisado la propuesta', 'I have reviewed the draft', 'Proposamena berrikusi dut', 'Revisei a proposta'),
  'Les dades, les incidències i el full tal com el veurà la gestoria. Si canvies res, l’hauràs de tornar a revisar.': t4(
    'Los datos, las incidencias y la hoja tal como la verá la gestoría. Si cambias algo, tendrás que volver a revisarla.',
    'The figures, warnings and spreadsheet as your advisor will see it. Any edit requires re-confirming.',
    'Datuak, gorabeherak eta orria gestoriak ikusiko duen bezala. Zerbait aldatuz gero, berriro berrikusi beharko duzu.',
    'Os datos, as incidencias e a folla tal como a verá a xestoría. Se cambias algo, terás que volver revisala.'
  ),
  'Genera-la igualment: les incidències queden anotades': t4(
    'Generarla igualmente: las incidencias quedan anotadas',
    'Generate anyway: warnings remain recorded',
    'Sortu hala ere: gorabeherak jasota geratzen dira',
    'Xerala igualmente: as incidencias quedan anotadas'
  ),
  'En prémer el botó aproves esta proposta exacta: qualsevol canvi posterior l’anul·la.': t4(
    'Al pulsar el botón apruebas esta propuesta exacta: cualquier cambio posterior la anula.',
    'Pressing the button approves this exact draft: any subsequent edit invalidates it.',
    'Botoia sakatzean proposamen zehatz hau onartzen duzu: ondorengo edozein aldaketak baliogabetzen du.',
    'Ao premer o botón aprobas esta proposta exacta: calquera cambio posterior anúlaa.'
  ),
  'Genera el full': t4('Generar la hoja', 'Generate sheet', 'Sortu orria', 'Xerar a folla'),
  'Fitxers generats': t4('Archivos generados', 'Generated files', 'Sortutako fitxategiak', 'Ficheiros xerados'),
  'Envia a la gestoria': t4('Enviar a la gestoría', 'Send to tax advisor', 'Bidali gestoriara', 'Enviar á xestoría'),
  'Quan hages generat el full, ací podràs preparar el correu. L’enviament el fas sempre tu.': t4(
    'Cuando hayas generado la hoja, aquí podrás preparar el correo. El envío lo haces siempre tú.',
    'Once the sheet is generated, you can prepare the email draft here. Sending is always done by you.',
    'Orria sortu ondoren, hemen prestatu ahal izango duzu mezua. Bidalketa beti zuk zeuk egiten duzu.',
    'Cando xeres a folla, aquí poderás preparar o correo. O envío falo sempre ti.'
  ),
  'Vols desenxufar la Gestoria?': t4('¿Quieres desenchufar la Gestoría?', 'Disconnect Bookkeeping?', 'Gestoria deskonektatu nahi duzu?', 'Queres desenchufar a Xestoría?'),
  'S’oblidaran la carpeta, la proposta, el correu creuat i els fulls generats que no hages descarregat o desat. No s’esborra cap fitxer teu.': t4(
    'Se olvidarán la carpeta, la propuesta, el correo cruzado y las hojas generadas que no hayas descargado o guardado. No se borra ningún archivo tuyo.',
    'The folder, draft, cross-checked email and any unsaved generated sheets will be cleared from memory. None of your files are deleted.',
    'Karpeta, proposamena, gurutzatutako posta eta deskargatu edo gorde ez dituzun orri sortuak ahaztuko dira. Ez da zure fitxategirik ezabatzen.',
    'Esqueceranse a carpeta, a proposta, o correo cruzado e as follas xeradas que non descargases ou gardases. Non se borra ningún ficheiro teu.'
  ),
  'Sí, desenxufa': t4('Sí, desenchufar', 'Yes, disconnect', 'Bai, deskonektatu', 'Si, desenchufar'),
  'Ja hi ha este fitxer a la carpeta': t4('Este archivo ya existe en la carpeta', 'File already exists in folder', 'Fitxategi hau badago karpetan', 'Xa existe este ficheiro na carpeta'),
  'Sí, substituïx-lo': t4('Sí, sustituirlo', 'Yes, overwrite it', 'Bai, ordezkatu', 'Si, substituílo'),
  'No, deixa’l': t4('No, dejarlo', 'No, keep existing', 'Ez, utzi dagoen bezala', 'Non, deixalo'),
  Ingressos: t4('Ingresos', 'Income', 'Diru-sarrerak', 'Ingresos'),
  Despeses: t4('Gastos', 'Expenses', 'Gastuak', 'Gastos'),
  'Cap ingrés.': t4('Ningún ingreso.', 'No income entries.', 'Diru-sarrerarik ez.', 'Ningún ingreso.'),
  'Cap despesa.': t4('Ningún gasto.', 'No expense entries.', 'Gasturik ez.', 'Ningún gasto.'),
  'Afig un ingrés': t4('Añadir un ingreso', 'Add income', 'Gehitu diru-sarrera bat', 'Engadir un ingreso'),
  'Afig una despesa': t4('Añadir un gasto', 'Add expense', 'Gehitu gastu bat', 'Engadir un gasto'),
  Totals: t4('Totales', 'Totals', 'Guztizkoak', 'Totais'),
  Accions: t4('Acciones', 'Actions', 'Ekintzak', 'Accións'),
  Completa: t4('Completa', 'Complete', 'Osatuta', 'Completa'),
  Tipus: t4('Tipo', 'Type', 'Mota', 'Tipo'),
  Data: t4('Fecha', 'Date', 'Data', 'Data'),
  'Factura/Ref': t4('Factura/Ref', 'Invoice/Ref', 'Faktura/Erref', 'Factura/Ref'),
  'Proveïdor/Client': t4('Proveedor/Cliente', 'Supplier/Client', 'Hornitzailea/Bezeroa', 'Provedor/Cliente'),
  'NIF/CIF': t4('NIF/CIF', 'Tax ID', 'IFZ/IFK', 'NIF/CIF'),
  'Base imposable': t4('Base imponible', 'Taxable base', 'Zerga-oinarria', 'Base impoñible'),
  'Quota IVA': t4('Cuota IVA', 'VAT amount', 'BEZ kuota', 'Cota IVE'),
  'Quota IRPF': t4('Cuota IRPF', 'IRPF withheld', 'PFEZ kuota', 'Cota IRPF'),
  Total: t4('Total', 'Total', 'Guztira', 'Total'),
  'Són indicis per a revisar, no veredictes fiscals: la paraula final és teua i de la teua gestoria.': t4(
    'Son indicios para revisar, no veredictos fiscales: la última palabra es tuya y de tu gestoría.',
    'These are clues for review, not tax rulings: the final decision rests with you and your tax advisor.',
    'Berrikusteko zantzuak dira, ez epai fiskalak: azken hitza zurea eta zure gestoriarena da.',
    'Son indicios para revisar, non veredictos fiscais: a última palabra é túa e da túa xestoría.'
  ),
  'Cap incidència detectada a la carpeta.': t4(
    'Ninguna incidencia detectada en la carpeta.',
    'No issues detected in the folder.',
    'Ez da gorabeherarik hauteman karpetan.',
    'Ningunha incidencia detectada na carpeta.'
  ),
  Destinatari: t4('Destinatario', 'Recipient', 'Hartzailea', 'Destinatario'),
  "L'adreça de correu de la gestoria.": t4('La dirección de correo de la gestoría.', 'Your tax advisor’s email address.', 'Gestoriaren helbide elektronikoa.', 'O enderezo de correo da xestoría.'),
  "Nom per a l'assumpte": t4('Nombre para el asunto', 'Name for subject line', 'Gairako izena', 'Nome para o asunto'),
  "Com et coneix la gestoria: el teu nom o el de l'empresa.": t4(
    'Cómo te conoce la gestoría: tu nombre o el de la empresa.',
    'How your advisor knows you: your name or company name.',
    'Nola ezagutzen zaituen gestoriak: zure izena edo enpresarena.',
    'Como te coñece a xestoría: o teu nome ou o da empresa.'
  ),
  'Persona de la gestoria (opcional)': t4('Persona de la gestoría (opcional)', 'Advisor contact name (optional)', 'Gestoriako pertsona (aukerakoa)', 'Persoa da xestoría (opcional)'),
  'El nom per a la salutació. Si el deixes buit, el correu diu només «Hola».': t4(
    'El nombre para el saludo. Si lo dejas vacío, el correo dice solo «Hola».',
    'Greeting name. If left blank, the email starts with a simple greeting.',
    'Agurrerako izena. Hutsik uzten baduzu, mezuak «Kaixo» besterik ez du esango.',
    'O nome para o saúdo. Se o deixas baleiro, o correo di só «Ola».'
  ),
  Assumpte: t4('Asunto', 'Subject', 'Gaia', 'Asunto'),
  'Text del correu': t4('Texto del correo', 'Email body', 'Mezuaren testua', 'Texto do correo'),
  'Torna a la plantilla': t4('Volver a la plantilla', 'Reset to template', 'Itzuli txantiloira', 'Volver ao modelo'),
  'Vista prèvia': t4('Vista previa', 'Preview', 'Aurrebista', 'Vista previa'),
  'Per a': t4('Para', 'To', 'Norentzat', 'Para'),
  'Encara no hi ha destinatari.': t4('Todavía no hay destinatario.', 'No recipient yet.', 'Oraindik ez dago hartzailerik.', 'Aínda non hai destinatario.'),
  'Sense assumpte.': t4('Sin asunto.', 'No subject.', 'Gairik gabe.', 'Sen asunto.'),
  Adjunts: t4('Adjuntos', 'Attachments', 'Eranskinak', 'Anexos'),
  'Cap.': t4('Ninguno.', 'None.', 'Bat ere ez.', 'Ningún.'),
  "He revisat el full i l'adjunt abans d'enviar-lo": t4(
    'He revisado la hoja y el adjunto antes de enviarlo',
    'I have reviewed the spreadsheet and attachment before sending',
    'Orria eta eranskina berrikusi ditut bidali aurretik',
    'Revisei a folla e o anexo antes de envialo'
  ),
  'Obri la redacció de Gmail': t4('Abrir redacción en Gmail', 'Open Gmail compose', 'Ireki Gmail idazketa', 'Abrir a redacción de Gmail'),
  "Descarrega l'esborrany (.eml)": t4('Descargar borrador (.eml)', 'Download draft (.eml)', 'Deskargatu zirriborroa (.eml)', 'Descargar o borrador (.eml)'),
  'Comparteix…': t4('Compartir…', 'Share…', 'Partekatu…', 'Compartir…'),
  'Encara no hi ha cap full per adjuntar.': t4(
    'Todavía no hay ninguna hoja para adjuntar.',
    'No spreadsheet available to attach yet.',
    'Oraindik ez dago eransteko orririk.',
    'Aínda non hai ningunha folla para anexar.'
  ),

  /* Escàner Local */
  'Per a abocar els extractes cal també el Tauler': t4(
    'Para volcar los extractos hace falta aprobar también el Tablero',
    'Dashboard approval is also required to load statements',
    'Laburpenak iraultzeko Arbela ere onartu behar da',
    'Para envorcar os extractos cómpre aprobar tamén o Taboleiro'
  ),
  'El Tauler llig els extractes amb el seu tractor, «Gestoria · Tauler de l’empresa», que encara no està aprovat. L’Escàner pot analitzar la carpeta igualment.': t4(
    'El Tablero lee los extractos con su tractor, «Gestoría · Tablero de la empresa», que aún no está aprobado. El Escáner puede analizar la carpeta igualmente.',
    'The Dashboard reads statements using its tractor, “Bookkeeping · Company Dashboard”, which is not approved yet. The Scanner can still inspect the folder.',
    'Arbelak bere traktorearekin irakurtzen ditu laburpenak, «Gestoria · Enpresaren arbela», oraindik onartu gabe dagoena. Eskanerrak karpeta azter dezake hala ere.',
    'O Taboleiro le os extractos co seu tractor, «Xestoría · Taboleiro da empresa», que aínda non está aprobado. O Escáner pode analizar a carpeta igualmente.'
  ),
  'Tria la carpeta': t4('Elige la carpeta', 'Choose folder', 'Aukeratu karpeta', 'Escolle a carpeta'),
  'La carpeta no ix d’este ordinador': t4(
    'La carpeta no sale de este ordenador',
    'Your folder never leaves this computer',
    'Karpeta ez da ordenagailu honetatik ateratzen',
    'A carpeta non sae deste ordenador'
  ),
  'L’Escàner en llig el nom, la mida i la data de cada fitxer. Només en llig els bytes per a comparar els que tenen la mateixa mida (els duplicats) i els primers 4 kB dels extractes del banc. No llig mai la carpeta de la identitat ni l’arxiu, no mou ni esborra res i no guarda res.': t4(
    'El Escáner lee el nombre, el tamaño y la fecha de cada archivo. Solo lee los bytes para comparar los del mismo tamaño (duplicados) y los primeros 4 kB de los extractos bancarios. Nunca lee la carpeta de identidad ni el archivo, no mueve ni borra nada y no guarda nada.',
    'The Scanner reads each file’s name, size and date. It only reads bytes to compare equal-sized files (duplicates) and the first 4 kB of bank statements. It never reads identity or archive folders, moves or deletes nothing, and stores nothing.',
    'Eskanerrak fitxategi bakoitzaren izena, tamaina eta data irakurtzen ditu. Tamaina berekoak alderatzeko (bikoiztuak) eta bankuko laburpenen lehen 4 kB-ak soilik irakurtzen ditu. Ez du inoiz nortasunaren karpeta ez artxiboa irakurtzen, ez du ezer mugitzen edo ezabatzen eta ez du ezer gordetzen.',
    'O Escáner le o nome, o tamaño e a data de cada ficheiro. Só le os bytes para comparar os do mesmo tamaño (duplicados) e os primeiros 4 kB dos extractos bancarios. Nunca le a carpeta de identidade nin o arquivo, non move nin borra nada e non garda nada.'
  ),
  'Tria la carpeta arrel': t4('Elegir la carpeta raíz', 'Choose root folder', 'Aukeratu erroko karpeta', 'Escoller a carpeta raíz'),
  'Este navegador no obri el selector de carpetes: tria-la amb este botó. Res es puja enlloc. A l’iPhone i a l’iPad només es poden triar fitxers solts: sense carpetes, l’Escàner no sap els trimestres ni els bancs.': t4(
    'Este navegador no abre el selector de carpetas: elígela con este botón. Nada se sube a ningún sitio. En iPhone e iPad solo pueden elegirse archivos sueltos: sin carpetas, el Escáner no distingue trimestres ni bancos.',
    'This browser does not open a folder picker: choose it with this button. Nothing is uploaded. On iPhone and iPad only individual files can be picked, without folder structure.',
    'Nabigatzaile honek ez du karpeta-hautatzailea irekitzen: aukeratu botoi honekin. Ez da ezer inora igotzen. iPhone eta iPaden fitxategi solteak soilik aukera daitezke: karpetarik gabe, Eskanerrak ez ditu hiruhilekoak ez bankuak bereizten.',
    'Este navegador non abre o selector de carpetas: escóllea con este botón. Nada se sobe a ningún sitio. No iPhone e no iPad só se poden escoller ficheiros soltos: sen carpetas, o Escáner non distingue os trimestres nin os bancos.'
  ),
  'Analitzant la carpeta…': t4('Analizando la carpeta…', 'Scanning folder…', 'Karpeta aztertzen…', 'Analizando a carpeta…'),
  'No s’ha pogut analitzar la carpeta': t4('No se ha podido analizar la carpeta', 'Could not scan folder', 'Ezin izan da karpeta aztertu', 'Non se puido analizar a carpeta'),
  'Radiografia de la carpeta': t4('Radiografía de la carpeta', 'Folder X-ray', 'Karpetaren erradiografia', 'Radiografía da carpeta'),
  'Apartats de la radiografia': t4('Apartados de la radiografía', 'X-ray sections', 'Erradiografiaren atalak', 'Apartados da radiografía'),
  Bancs: t4('Bancos', 'Banking', 'Bankuak', 'Bancos'),
  Factures: t4('Facturas', 'Invoices', 'Fakturak', 'Facturas'),
  Duplicats: t4('Duplicados', 'Duplicates', 'Bikoiztuak', 'Duplicados'),
  Dates: t4('Fechas', 'Dates', 'Datak', 'Datas'),
  Buits: t4('Huecos', 'Gaps', 'Hutsuneak', 'Ocos'),
  Alertes: t4('Alertas', 'Alerts', 'Alertak', 'Alertas'),
  Identitat: t4('Identidad', 'Identity', 'Nortasuna', 'Identidade'),
  'Arxiu i altres': t4('Archivo y otros', 'Archive and other', 'Artxiboa eta besteak', 'Arquivo e outros'),
  'Res en este apartat.': t4('Nada en este apartado.', 'Nothing in this section.', 'Ezer ez atal honetan.', 'Nada neste apartado.'),
  'Extractes per al Tauler': t4('Extractos para el Tablero', 'Statements for Dashboard', 'Arbelerako laburpenak', 'Extractos para o Taboleiro'),
  'Els extractes que s’abocaran al Tauler': t4('Extractos que se volcarán al Tablero', 'Statements to load into Dashboard', 'Arbelera irauliko diren laburpenak', 'Os extractos que se envorcarán ao Taboleiro'),
  'No s’ha trobat cap extracte del banc en la carpeta.': t4(
    'No se ha encontrado ningún extracto bancario en la carpeta.',
    'No bank statements found in the folder.',
    'Ez da bankuko laburpenik aurkitu karpetan.',
    'Non se atopou ningún extracto do banco na carpeta.'
  ),
  'Obri Identitat i Finestreta': t4('Abrir Identidad y Ventanilla', 'Open Identity & One-Stop Desk', 'Ireki Nortasuna eta Leihatila', 'Abrir Identidade e Xanela')
};

/* ── 2. Cadenes estàtiques UI: Aprendre, Facturació, Cofre, Històric i Finestreta ── */
const CADENES_PART_2 = {
  /* Aprendre */
  'Imatge per recordar': t4('Imagen para recordar', 'Memory image', 'Gogoratzeko irudia', 'Imaxe para lembrar'),
  'Record sense pista': t4('Recuerdo sin pista', 'Cue-free recall', 'Arrastorik gabeko oroitzapena', 'Lembranza sen pista'),
  'Explicació de la resposta': t4('Explicación de la respuesta', 'Answer explanation', 'Erantzunaren azalpena', 'Explicación da resposta'),
  'Repàs programat': t4('Repaso programado', 'Scheduled review', 'Programatutako errepikapena', 'Repaso programado'),
  'No s’ha pogut llegir el progrés desat. Comences de zero.': t4(
    'No se ha podido leer el progreso guardado. Empiezas de cero.',
    'Could not read saved progress. Starting fresh.',
    'Ezin izan da gordetako aurrerapena irakurri. Hutsetik hasiko zara.',
    'Non se puido ler o progreso gardado. Comezas de cero.'
  ),
  'No s’ha pogut desar el progrés en este dispositiu. Pots continuar, però potser no es recordarà.': t4(
    'No se ha podido guardar el progreso en este dispositivo. Puedes continuar, pero quizá no se recuerde.',
    'Could not save progress on this device. You can continue, though it may not persist.',
    'Ezin izan da aurrerapena gailu honetan gorde. Jarrai dezakezu, baina agian ez da gogoratuko.',
    'Non se puido gardar o progreso neste dispositivo. Podes continuar, pero quizais non se lembre.'
  ),
  'Progrés oblidat: totes les targetes tornen a ser noves.': t4(
    'Progreso olvidado: todas las tarjetas vuelven a ser nuevas.',
    'Progress cleared: all cards are reset as new.',
    'Aurrerapena ahaztuta: txartel guztiak berriak dira berriro.',
    'Progreso esquecido: todas as tarxetas volven ser novas.'
  ),
  'No s’ha pogut esborrar el progrés desat en este dispositiu.': t4(
    'No se ha podido borrar el progreso guardado en este dispositivo.',
    'Could not erase saved progress on this device.',
    'Ezin izan da gailu honetan gordetako aurrerapena ezabatu.',
    'Non se puido borrar o progreso gardado neste dispositivo.'
  ),
  'Carregant el teu progrés…': t4('Cargando tu progreso…', 'Loading your progress…', 'Zure aurrerapena kargatzen…', 'Cargando o teu progreso…'),
  'Mostra la imatge': t4('Mostrar la imagen', 'Show memory image', 'Erakutsi irudia', 'Mostrar a imaxe'),
  'Per a recordar-ho:': t4('Para recordarlo:', 'Memory hook:', 'Gogoratzeko:', 'Para lembralo:'),
  'Sense mirar res, intenta recordar la resposta.': t4(
    'Sin mirar nada, intenta recordar la respuesta.',
    'Without peeking, try to recall the answer.',
    'Ezer begiratu gabe, saiatu erantzuna gogoratzen.',
    'Sen mirar nada, tenta lembrar a resposta.'
  ),
  'Ho recorde': t4('Lo recuerdo', 'I remember it', 'Gogoratzen dut', 'Lémbroo'),
  'No ho recorde': t4('No lo recuerdo', 'I don’t remember', 'Ez dut gogoratzen', 'Non o lembro'),
  'Has dit que ho recordaves': t4('Has dicho que lo recordabas', 'You said you remembered it', 'Gogoratzen zenuela esan duzu', 'Dixeches que o lembrabas'),
  'Has dit que no ho recordaves': t4('Has dicho que no lo recordabas', 'You said you didn’t remember', 'Ez zenuela gogoratzen esan duzu', 'Dixeches que non o lembrabas'),
  'Resposta:': t4('Respuesta:', 'Answer:', 'Erantzuna:', 'Resposta:'),
  'Si la resposta no és la que pensaves, corregix-ho abans de continuar.': t4(
    'Si la respuesta no es la que pensabas, corrígelo antes de continuar.',
    'If the answer differs from what you had in mind, adjust your rating before continuing.',
    'Erantzuna uste zenuena ez bada, zuzendu jarraitu aurretik.',
    'Se a resposta non é a que pensabas, corríxeo antes de continuar.'
  ),
  'Corregix: no ho recordava': t4('Corregir: no lo recordaba', 'Change: I didn’t remember', 'Zuzendu: ez nuen gogoratzen', 'Corrixir: non o lembraba'),
  'Corregix: sí que ho recordava': t4('Corregir: sí que lo recordaba', 'Change: I did remember', 'Zuzendu: bai gogoratzen nuen', 'Corrixir: si que o lembraba'),
  'Torna a la caixa 0': t4('Vuelve a la caja 0', 'Back to box 0', '0. kutxara itzultzen da', 'Volve á caixa 0'),
  'Torna a eixir en este mateix repàs, al final de la cua.': t4(
    'Volverá a salir en este mismo repaso, al final de la cola.',
    'Will reappear at the end of today’s review session.',
    'Errepikapen honetan bertan agertuko da berriro, ilararen amaieran.',
    'Volverá saír neste mesmo repaso, ao final da quenda.'
  ),
  'Següent targeta': t4('Siguiente tarjeta', 'Next card', 'Hurrengo txartela', 'Seguinte tarxeta'),
  'Acaba el repàs': t4('Terminar el repaso', 'Finish review', 'Amaitu errepikapena', 'Rematar o repaso'),
  'Repàs fet per hui': t4('Repaso completado por hoy', 'All caught up for today', 'Gaurko errepikapena eginda', 'Repaso feito por hoxe'),
  'No hi ha cap repàs programat.': t4('No hay ningún repaso programado.', 'No upcoming reviews scheduled.', 'Ez dago programatutako errepikapenik.', 'Non hai ningún repaso programado.'),
  'Caixa de cada targeta': t4('Caja de cada tarjeta', 'Box per card', 'Txartel bakoitzaren kutxa', 'Caixa de cada tarxeta'),
  'El progrés es guarda només en este dispositiu, sense dades personals.': t4(
    'El progreso se guarda únicamente en este dispositivo, sin datos personales.',
    'Progress is stored solely on this device, with zero personal data.',
    'Aurrerapena gailu honetan soilik gordetzen da, datu pertsonalik gabe.',
    'O progreso gárdase unicamente neste dispositivo, sen datos persoais.'
  ),
  'El progrés només dura esta sessió: no es guarda enlloc.': t4(
    'El progreso solo dura esta sesión: no se guarda en ningún sitio.',
    'Progress lasts only for this session: nothing is saved.',
    'Aurrerapenak saio honetan soilik irauten du: ez da inon gordetzen.',
    'O progreso só dura esta sesión: non se garda en ningún sitio.'
  ),
  'Oblida el meu progrés': t4('Olvidar mi progreso', 'Reset my progress', 'Ahaztu nire aurrerapena', 'Esquecer o meu progreso'),
  'Vols oblidar el teu progrés?': t4('¿Quieres olvidar tu progreso?', 'Reset your learning progress?', 'Zure aurrerapena ahaztu nahi duzu?', 'Queres esquecer o teu progreso?'),
  'S’esborraran les caixes i les dates de repàs d’esta baralla en este dispositiu. Les targetes no canvien.': t4(
    'Se borrarán las cajas y las fechas de repaso de esta baraja en este dispositivo. Las tarjetas no cambian.',
    'Box levels and review dates for this deck on this device will be erased. The cards themselves remain unchanged.',
    'Gailu honetako karta-sorta honen kutxak eta errepikapen-datak ezabatuko dira. Txartelak ez dira aldatzen.',
    'Borraranse as caixas e as datas de repaso desta baralla neste dispositivo. As tarxetas non cambian.'
  ),
  'Sí, oblida’l': t4('Sí, olvidarlo', 'Yes, reset it', 'Bai, ahaztu', 'Si, esquecelo'),

  /* Facturació interna: PasPerfil, PasLlegat, FormulariFactura, LlibreFactures, CopiaLlibre, ImpressioFactura */
  NIF: t4('NIF', 'Tax ID (NIF)', 'IFZ', 'NIF'),
  'Nom legal': t4('Nombre legal', 'Legal name', 'Legezko izena', 'Nome legal'),
  'Nom comercial': t4('Nombre comercial', 'Trade name', 'Izen komertziala', 'Nome comercial'),
  'Nom comercial (opcional)': t4('Nombre comercial (opcional)', 'Trade name (optional)', 'Izen komertziala (aukerakoa)', 'Nome comercial (opcional)'),
  'Domicili fiscal': t4('Domicilio fiscal', 'Registered tax address', 'Zerga-egoitza', 'Domicilio fiscal'),
  'Primer dia que factures ací': t4('Primer día que facturas aquí', 'First invoicing date here', 'Hemen fakturatzen duzun lehen eguna', 'Primeiro día que facturas aquí'),
  'Canvia les dades de l’empresa': t4('Cambiar los datos de la empresa', 'Edit company details', 'Aldatu enpresaren datuak', 'Cambiar os datos da empresa'),
  'Estes dades van a cada factura com a emissor. Es guarden només en este ordinador, i cada canvi es guarda com una versió nova: les factures ja fetes conserven les dades del dia que es van emetre.': t4(
    'Estos datos figuran en cada factura como emisor. Se guardan solo en este ordenador y cada cambio crea una versión nueva: las facturas ya emitidas conservan los datos del día de emisión.',
    'These details appear as the issuer on every invoice. Stored only on this computer; each update creates a new version so past invoices retain the details active when issued.',
    'Datu hauek faktura bakoitzean jaulkitzaile gisa agertzen dira. Ordenagailu honetan soilik gordetzen dira eta aldaketa bakoitzak bertsio berri bat sortzen du: jaulkitako fakturek bere eguneko datuak gordetzen dituzte.',
    'Estes datos van en cada factura como emisor. Gárdanse só neste ordenador e cada cambio gárdase como unha versión nova: as facturas xa feitas conservan os datos do día en que se emitiron.'
  ),
  'Importa la configuració (opcional)': t4('Importar configuración (opcional)', 'Import configuration (optional)', 'Inportatu konfigurazioa (aukerakoa)', 'Importar a configuración (opcional)'),
  'Si ja tens el fitxer .json de l’empresa (el mateix que llig el Tauler), tria’l i s’omplirà el formulari.': t4(
    'Si ya tienes el archivo .json de la empresa (el mismo que lee el Tablero), elígelo y se rellenará el formulario.',
    'If you already have your company .json file (also used by the Dashboard), pick it to pre-fill this form.',
    'Enpresaren .json fitxategia baduzu (Arbelak irakurtzen duen bera), aukeratu eta inprimakia beteko da.',
    'Se xa tes o ficheiro .json da empresa (o mesmo que le o Taboleiro), escólleo e encherase o formulario.'
  ),
  'Tria el fitxer': t4('Elegir archivo', 'Choose file', 'Aukeratu fitxategia', 'Escoller o ficheiro'),
  'L’empresa': t4('La empresa', 'Company', 'Enpresa', 'A empresa'),
  'Ja hi ha factures emeses amb este NIF: no es pot canviar.': t4(
    'Ya hay facturas emitidas con este NIF: no se puede cambiar.',
    'Invoices have already been issued under this Tax ID: it cannot be changed.',
    ' dagoeneko badira IFZ honekin jaulkitako fakturak: ezin da aldatu.'.trim(),
    'Xa hai facturas emitidas con este NIF: non se pode cambiar.'
  ),
  'El DNI, el NIE o el CIF de qui factura.': t4('El DNI, NIE o CIF de quien factura.', 'National or corporate tax ID of the issuer.', 'Fakturatzen duenaren NAN, AIZ edo IFK.', 'O DNI, o NIE ou o CIF de quen factura.'),
  'La raó social, o el nom i els cognoms si eres autònom.': t4(
    'La razón social, o el nombre y apellidos si eres autónomo.',
    'Registered company name, or full name if self-employed.',
    'Sozietatearen izena, edo izen-abizenak autonomoa bazara.',
    'A razón social, ou o nome e apelidos se es autónomo.'
  ),
  'El nom amb què et coneix la gent, si no és el legal.': t4(
    'El nombre con el que te conoce la gente, si es distinto del legal.',
    'Public trading name, if different from your legal name.',
    'Jendeak ezagutzen zaituen izena, legezkoa ez bada.',
    'O nome co que te coñece a xente, se non é o legal.'
  ),
  'Adreça': t4('Dirección', 'Street address', 'Helbidea', 'Enderezo'),
  'Codi postal': t4('Código postal', 'Postal code', 'Posta-kodea', 'Código postal'),
  'Província (opcional)': t4('Provincia (opcional)', 'Province (optional)', 'Probintzia (aukerakoa)', 'Provincia (opcional)'),
  'Ja hi ha factures emeses des d’este dia: no es pot canviar.': t4(
    'Ya hay facturas emitidas desde este día: no se puede cambiar.',
    'Invoices have already been issued since this date: it cannot be changed.',
    'Egun honetatik aurrera fakturak jaulki dira dagoeneko: ezin da aldatu.',
    'Xa hai facturas emitidas desde este día: non se pode cambiar.'
  ),
  'El primer dia que factures amb este programa. Les factures d’abans d’eixe dia les fa l’eina que feies servir.': t4(
    'El primer día que facturas con este programa. Las facturas anteriores a ese día corresponden a tu herramienta previa.',
    'The first day you issue invoices with this tool. Earlier dates remain closed under your previous invoicing tool.',
    'Programa honekin fakturatzen duzun lehen eguna. Egun horren aurreko fakturak lehengo tresnak egiten ditu.',
    'O primeiro día que facturas con este programa. As facturas anteriores a ese día fainas a ferramenta que usabas antes.'
  ),
  'Revisa les dades de l’empresa': t4('Revisa los datos de la empresa', 'Check company details', 'Berrikusi enpresaren datuak', 'Revisa os datos da empresa'),
  'Desa les dades de l’empresa': t4('Guardar los datos de la empresa', 'Save company details', 'Gorde enpresaren datuak', 'Gardar os datos da empresa'),
  'Deixa-ho com estava': t4('Dejarlo como estaba', 'Keep unchanged', 'Utzi zegoen bezala', 'Deixalo como estaba'),
  'Primer cal desar les dades de l’empresa (pas 1).': t4(
    'Primero hay que guardar los datos de la empresa (paso 1).',
    'Save your company details first (step 1).',
    'Lehenik enpresaren datuak gorde behar dira (1. urratsa).',
    'Primeiro cómpre gardar os datos da empresa (paso 1).'
  ),
  'No hi havia factures d’abans: el programa comença de zero.': t4(
    'No había facturas anteriores: el programa empieza de cero.',
    'No prior invoices declared: starting from scratch.',
    'Ez zegoen aurreko fakturarik: programa hutsetik hasten da.',
    'Non había facturas anteriores: o programa comeza de cero.'
  ),
  'Torna a carregar les factures d’abans': t4('Volver a cargar las facturas anteriores', 'Reload previous invoices', 'Berriro kargatu aurreko fakturak', 'Volver cargar as facturas anteriores'),
  'Si abans facturaves amb un altre programa, posa ací els números d’aquelles factures. El programa no els continua: obri una sèrie nova i deixa tancades les d’abans, perquè cap número no es puga confondre.': t4(
    'Si antes facturabas con otro programa, indica aquí los números de aquellas facturas. Este programa no las continúa: abre una serie nueva y deja cerradas las anteriores para evitar duplicidades.',
    'If you previously invoiced with another tool, paste those invoice numbers here. This tool starts a fresh series and locks legacy prefixes so numbers never collide.',
    'Lehen beste programa batekin fakturatzen bazenuen, jarri hemen faktura haien zenbakiak. Programak ez ditu jarraitzen: serie berri bat irekitzen du eta aurrekoak itxita uzten ditu.',
    'Se antes facturabas con outro programa, pon aquí os números daquelas facturas. O programa non os continúa: abre unha serie nova e deixa pechadas as anteriores para que ningún número se confunda.'
  ),
  'Ja has emés factures amb este programa: ara només pots afegir-hi factures d’abans. Torna a posar-hi totes les que ja havies declarat, i les que falten.': t4(
    'Ya has emitido facturas con este programa: ahora solo puedes añadir facturas anteriores. Vuelve a incluir todas las ya declaradas más las que falten.',
    'You have already issued invoices here: legacy series can only be expanded. Include all previously declared numbers plus any missing ones.',
    'Dagoeneko fakturak jaulki dituzu programa honekin: orain aurreko fakturak gehitu besterik ezin duzu egin. Jarri berriro lehendik adierazitako guztiak eta falta direnak.',
    'Xa emitiches facturas con este programa: agora só podes engadir facturas anteriores. Volve poñer todas as que xa declararas e as que falten.'
  ),
  'Números de les factures d’abans': t4('Números de las facturas anteriores', 'Previous invoice numbers', 'Aurreko fakturen zenbakiak', 'Números das facturas anteriores'),
  'Un per línia, tal com eixien a les factures (per exemple «F26 0001»).': t4(
    'Uno por línea, tal como figuraban en las facturas (por ejemplo «F26 0001»).',
    'One per line, exactly as printed on past invoices (e.g. “F26 0001”).',
    'Bat lerroko, fakturetan agertzen ziren bezala (adibidez «F26 0001»).',
    'Un por liña, tal como saían nas facturas (por exemplo «F26 0001»).'
  ),
  'O carrega’ls d’un fitxer de text (opcional)': t4(
    'O cárgalos desde un archivo de texto (opcional)',
    'Or load them from a text file (optional)',
    'Edo kargatu testu-fitxategi batetik (aukerakoa)',
    'Ou cárgaos dun ficheiro de texto (opcional)'
  ),
  'Un fitxer .txt o .csv amb els números.': t4('Un archivo .txt o .csv con los números.', 'A .txt or .csv file listing the numbers.', 'Zenbakiak dituen .txt edo .csv fitxategi bat.', 'Un ficheiro .txt ou .csv cos números.'),
  'No s’han pogut llegir les factures d’abans': t4('No se han podido leer las facturas anteriores', 'Could not read previous invoices', 'Ezin izan dira aurreko fakturak irakurri', 'Non se puideron ler as facturas anteriores'),
  'Així es perdrien factures d’abans ja declarades': t4(
    'Así se perderían facturas anteriores ya declaradas',
    'Previously declared legacy invoices would be lost',
    'Horrela lehendik adierazitako aurreko fakturak galduko lirateke',
    'Así perderíanse facturas anteriores xa declaradas'
  ),
  'Desa les factures d’abans': t4('Guardar las facturas anteriores', 'Save previous invoices', 'Gorde aurreko fakturak', 'Gardar as facturas anteriores'),
  'No en tinc: comence de zero': t4('No tengo: empiezo de cero', 'None: I am starting fresh', 'Ez daukat: hutsetik hasiko naiz', 'Non teño: comezo de cero'),
  'Ara no es pot emetre cap factura': t4('Ahora no se puede emitir ninguna factura', 'Cannot issue invoices right now', 'Orain ezin da fakturarik jaulki', 'Agora non se pode emitir ningunha factura'),
  'La cadena del llibre té incidències (pas 4). Si tens una còpia bona del llibre, restaura-la al pas 5: quan la cadena torne a ser correcta, podràs tornar a emetre.': t4(
    'La cadena del libro tiene incidencias (paso 4). Si tienes una copia válida del libro, restáurala en el paso 5: cuando la cadena vuelva a ser íntegra podrás emitir de nuevo.',
    'The ledger chain has integrity issues (step 4). Restore a valid backup in step 5 to resume issuing invoices.',
    'Liburuaren kateak gorabeherak ditu (4. urratsa). Liburuaren kopia on bat baduzu, leheneratu 5. urratsean: katea zuzena denean berriro jaulki ahal izango duzu.',
    'A cadea do libro ten incidencias (paso 4). Se tes unha copia boa do libro, restáuraa no paso 5: cando a cadea volva ser correcta poderás volver emitir.'
  ),
  'Amb estes dades no es pot emetre': t4('Con estos datos no se puede emitir', 'Cannot issue with these details', 'Datu hauekin ezin da jaulki', 'Con estes datos non se pode emitir'),
  'Per a emetre factures, primer cal desar les dades de l’empresa (pas 1) i les factures d’abans (pas 2).': t4(
    'Para emitir facturas, primero hay que guardar los datos de la empresa (paso 1) y las facturas anteriores (paso 2).',
    'To issue invoices, save your company details (step 1) and previous invoices (step 2) first.',
    'Fakturak jaulkitzeko, lehenik enpresaren datuak (1. urratsa) eta aurreko fakturak (2. urratsa) gorde behar dira.',
    'Para emitir facturas, primeiro cómpre gardar os datos da empresa (paso 1) e as facturas anteriores (paso 2).'
  ),
  'Qui factura?': t4('¿Quién factura?', 'Who is invoicing?', 'Nork fakturatzen du?', 'Quen factura?'),
  'Són les dades de l’empresa del pas 1: el nom legal es canvia allí; el NIF ja no, perquè hi ha factures emeses.': t4(
    'Son los datos de la empresa del paso 1: el nombre legal se cambia allí; el NIF ya no, porque hay facturas emitidas.',
    'Company details from step 1: legal name can be updated there; Tax ID is locked because invoices exist.',
    '1. urratseko enpresaren datuak dira: legezko izena han aldatzen da; IFZ ez, jaulkitako fakturak daudelako.',
    'Son os datos da empresa do paso 1: o nome legal cámbiase alí; o NIF xa non, porque hai facturas emitidas.'
  ),
  'Són les dades de l’empresa del pas 1: es canvien allí.': t4(
    'Son los datos de la empresa del paso 1: se cambian allí.',
    'Company details from step 1: edit them there.',
    '1. urratseko enpresaren datuak dira: han aldatzen dira.',
    'Son os datos da empresa do paso 1: cámbianse alí.'
  ),
  'A qui i què?': t4('¿A quién y qué?', 'To whom and what?', 'Nori eta zer?', 'A quen e que?'),
  'Quina factura fas?': t4('¿Qué factura haces?', 'Invoice type', 'Zein faktura egiten duzu?', 'Que factura fas?'),
  Triada: t4('Elegida', 'Selected', 'Aukeratua', 'Escollida'),
  'Data de l’operació (opcional)': t4('Fecha de la operación (opcional)', 'Service/delivery date (optional)', 'Eragiketaren data (aukerakoa)', 'Data da operación (opcional)'),
  'Només si la venda o el servei és d’un altre dia que la factura.': t4(
    'Solo si la venta o el servicio es de un día distinto al de la factura.',
    'Only if the sale or service took place on a different date than the invoice.',
    'Salmenta edo zerbitzua fakturaren egunaz bestelako batekoa bada soilik.',
    'Só se a venda ou o servizo é doutro día distinto ao da factura.'
  ),
  'Descripció de l’operació (opcional)': t4('Descripción de la operación (opcional)', 'Operation description (optional)', 'Eragiketaren deskribapena (aukerakoa)', 'Descrición da operación (opcional)'),
  'Si la deixes buida, és el concepte de la primera línia.': t4(
    'Si la dejas vacía, se usa el concepto de la primera línea.',
    'If left blank, defaults to the first line item description.',
    'Hutsik uzten baduzu, lehen lerroko kontzeptua erabiliko da.',
    'Se a deixas baleira, é o concepto da primeira liña.'
  ),
  'El client': t4('El cliente', 'Client', 'Bezeroa', 'O cliente'),
  'Cap: un client nou': t4('Ninguno: un cliente nuevo', 'None: new client', 'Bat ere ez: bezero berria', 'Ningún: un cliente novo'),
  'Client d’una factura anterior (opcional)': t4('Cliente de una factura anterior (opcional)', 'Client from a previous invoice (optional)', 'Aurreko faktura bateko bezeroa (aukerakoa)', 'Cliente dunha factura anterior (opcional)'),
  'Tria’l i s’ompliran les seues dades, que pots canviar abans d’emetre.': t4(
    'Elígelo y se rellenarán sus datos, que puedes editar antes de emitir.',
    'Select to pre-fill client details; you can edit them before issuing.',
    'Aukeratu eta bere datuak beteko dira; jaulki aurretik alda ditzakezu.',
    'Escólleo e encheranse os seus datos, que podes cambiar antes de emitir.'
  ),
  'NIF del client': t4('NIF del cliente', 'Client Tax ID', 'Bezeroaren IFZ', 'NIF do cliente'),
  'Nom o raó social': t4('Nombre o razón social', 'Full name or company name', 'Izena edo sozietatearen izena', 'Nome ou razón social'),
  'Els preus ja porten l’IVA (com en un tiquet de caixa)': t4(
    'Los precios ya incluyen el IVA (como en un tiquet de caja)',
    'Prices already include VAT (as on a retail receipt)',
    'Prezioek BEZa barne daukate (kutxako tiket batean bezala)',
    'Os prezos xa levan o IVE (como nun tícket de caixa)'
  ),
  Quantitat: t4('Cantidad', 'Quantity', 'Kopurua', 'Cantidade'),
  'Preu per unitat, amb l’IVA': t4('Precio por unidad, con IVA', 'Unit price, VAT included', 'Unitateko prezioa, BEZ barne', 'Prezo por unidade, co IVE'),
  'Preu per unitat, sense l’IVA': t4('Precio por unidad, sin IVA', 'Unit price, excluding VAT', 'Unitateko prezioa, BEZik gabe', 'Prezo por unidade, sen o IVE'),
  'En euros, amb coma per als cèntims: 12,50.': t4('En euros, con coma para los céntimos: 12,50.', 'In euros, comma for cents: 12,50.', 'Eurotan, zentimoetarako komarekin: 12,50.', 'En euros, con coma para os céntimos: 12,50.'),
  'En euros, amb coma per als cèntims; el que resta, en negatiu: -12,50.': t4(
    'En euros, con coma para los céntimos; lo que resta, en negativo: -12,50.',
    'In euros, comma for cents; negative for reductions: -12,50.',
    'Eurotan, zentimoetarako komarekin; kentzen duena, negatiboan: -12,50.',
    'En euros, con coma para os céntimos; o que resta, en negativo: -12,50.'
  ),
  IVA: t4('IVA', 'VAT', 'BEZ', 'IVE'),
  'Afig una línia': t4('Añadir una línea', 'Add line item', 'Gehitu lerro bat', 'Engadir unha liña'),
  'Retenció d’IRPF': t4('Retención de IRPF', 'IRPF withholding', 'PFEZ atxikipena', 'Retención de IRPF'),
  'Si factures una activitat professional a una empresa o a un professional, et retenen una part.': t4(
    'Si facturas una actividad profesional a una empresa o profesional, te retienen una parte.',
    'Applicable when billing professional services to a company or self-employed client.',
    'Enpresa edo profesional bati jarduera profesional bat fakturatzen badiozu, zati bat atxikitzen dizute.',
    'Se facturas unha actividade profesional a unha empresa ou profesional, retéñenche unha parte.'
  ),
  'Revisa i emet': t4('Revisa y emite', 'Review and issue', 'Berrikusi eta jaulki', 'Revisa e emite'),
  'Data de la factura': t4('Fecha de la factura', 'Invoice date', 'Fakturaren data', 'Data da factura'),
  'Com a molt, la d’avui.': t4('Como máximo, la de hoy.', 'At latest, today’s date.', 'Gehienez, gaurkoa.', 'Como moito, a de hoxe.'),
  'Número que tindrà': t4('Número que tendrá', 'Assigned number', 'Izango duen zenbakia', 'Número que terá'),
  'No se’n pot donar cap': t4('No se puede asignar ninguno', 'Cannot assign number', 'Ezin da bat ere eman', 'Non se pode dar ningún'),
  'Calculant…': t4('Calculando…', 'Calculating…', 'Kalkulatzen…', 'Calculando…'),
  'Total a pagar': t4('Total a pagar', 'Total payable', 'Ordaintzeko guztira', 'Total a pagar'),
  'El total apareix quan la factura està completa.': t4(
    'El total aparece cuando la factura está completa.',
    'Totals appear once the invoice fields are complete.',
    'Guztizkoa faktura osatuta dagoenean agertzen da.',
    'O total aparece cando a factura está completa.'
  ),
  'Falta alguna cosa a la factura': t4('Falta algo en la factura', 'Invoice is incomplete', 'Zerbait falta da fakturan', 'Falta algo na factura'),
  'Revisa i emet la factura': t4('Revisar y emitir la factura', 'Review and issue invoice', 'Berrikusi eta jaulki faktura', 'Revisar e emitir a factura'),
  'Una factura emesa entra al llibre i ja no s’esborra: si cal, es rectifica o s’anul·la.': t4(
    'Una factura emitida entra en el libro y ya no se borra: si hace falta, se rectifica o se anula.',
    'An issued invoice is chained into the ledger and cannot be deleted: if needed, issue a credit note or void record.',
    'Jaulkitako faktura liburuan sartzen da eta ez da ezabatzen: behar izanez gero, zuzendu edo baliogabetzen da.',
    'Unha factura emitida entra no libro e xa non se borra: se cómpre, rectifícase ou anúlase.'
  ),
  'Sí, emet-la': t4('Sí, emitirla', 'Yes, issue it', 'Bai, jaulki', 'Si, emitila'),
  'Torna a verificar': t4('Volver a verificar', 'Verify again', 'Egiaztatu berriro', 'Volver verificar'),
  'Any del llibre': t4('Año del libro', 'Ledger year', 'Liburuaren urtea', 'Ano do libro'),
  'Període': t4('Período', 'Period', 'Aldia', 'Período'),
  'Estat de les factures': t4('Estado de las facturas', 'Invoice status', 'Fakturen egoera', 'Estado das facturas'),
  'Cerca per número, client o NIF': t4('Buscar por número, cliente o NIF', 'Search by number, client or Tax ID', 'Bilatu zenbaki, bezero edo IFZ bidez', 'Buscar por número, cliente ou NIF'),
  'Factures emeses': t4('Facturas emitidas', 'Issued invoices', 'Jaulkitako fakturak', 'Facturas emitidas'),
  'Número': t4('Número', 'Number', 'Zenbakia', 'Número'),
  Client: t4('Cliente', 'Client', 'Bezeroa', 'Cliente'),
  Base: t4('Base', 'Base', 'Oinarria', 'Base'),
  'Acció': t4('Acción', 'Action', 'Ekintza', 'Acción'),
  'Anul·lada': t4('Anulada', 'Voided', 'Baliogabetuta', 'Anulada'),
  Emesa: t4('Emitida', 'Issued', 'Jaulkita', 'Emitida'),
  Factura: t4('Factura', 'Invoice', 'Faktura', 'Factura'),
  'Anul·la': t4('Anular', 'Void', 'Baliogabetu', 'Anular'),
  'Total del període': t4('Total del período', 'Period total', 'Aldiko guztizkoa', 'Total do período'),
  'Detalls tècnics: l’XML de prova per a l’AEAT': t4(
    'Detalles técnicos: el XML de prueba para la AEAT',
    'Technical details: test XML for AEAT',
    'Xehetasun teknikoak: AEATerako probako XMLa',
    'Detalles técnicos: o XML de proba para a AEAT'
  ),
  'L’XML de prova porta els registres com els enviarà el programa a l’AEAT quan hi haja remissió. Ara no s’envia res, i encara li falta el bloc del sistema informàtic (la declaració responsable del programa no existix).': t4(
    'El XML de prueba contiene los registros con la estructura prevista para la AEAT. Ahora no se envía nada y aún falta el bloque de declaración responsable del sistema.',
    'The test XML formats ledger records using the AEAT schema. Nothing is transmitted, and no software certification block exists yet.',
    'Probako XMLak erregistroak AEATerako aurreikusitako egituran daramatza. Orain ez da ezer bidaltzen eta sistemaren erantzukizunpeko adierazpenaren blokea falta zaio.',
    'O XML de proba leva os rexistros coa estrutura prevista para a AEAT. Agora non se envía nada e aínda lle falta o bloque de declaración responsable do sistema.'
  ),
  'Descarrega l’XML de prova per a l’AEAT': t4(
    'Descargar el XML de prueba para la AEAT',
    'Download test XML for AEAT',
    'Deskargatu AEATerako probako XMLa',
    'Descargar o XML de proba para a AEAT'
  ),
  'Descarregar el llibre sense xifrar?': t4('¿Descargar el libro sin cifrar?', 'Download unencrypted ledger?', 'Liburua zifratu gabe deskargatu?', 'Descargar o libro sen cifrar?'),
  'Descarrega’l': t4('Descargarlo', 'Download it', 'Deskargatu', 'Descargalo'),
  'Imprimeix o desa en PDF': t4('Imprimir o guardar en PDF', 'Print or save as PDF', 'Inprimatu edo gorde PDFan', 'Imprimir ou gardar en PDF'),
  'Tanca la factura': t4('Cerrar la factura', 'Close invoice', 'Itxi faktura', 'Pechar a factura'),
  'Llibre amb incidències': t4('Libro con incidencias', 'Ledger has issues', 'Gorabeheradun liburua', 'Libro con incidencias'),
  'Sense còpia': t4('Sin copia', 'No backup', 'Kopiarik gabe', 'Sen copia'),
  'Còpia antiga': t4('Copia antigua', 'Outdated backup', 'Kopia zaharra', 'Copia antiga'),
  'Al dia': t4('Al día', 'Up to date', 'Egunean', 'Ao día'),
  'El llibre viu en este navegador, que el pot esborrar si es netegen les dades del lloc. Fes-ne còpia cada dia que factures i guarda-la també fora d’este ordinador: un llapis USB o la carpeta de la gestoria.': t4(
    'El libro vive en este navegador, que puede borrarlo si se limpian los datos del sitio. Haz copia cada día que factures y guárdala también fuera de este ordenador: un pendrive USB o la carpeta de la gestoría.',
    'The ledger lives in this browser and can be erased if site data is cleared. Back it up every day you invoice and keep a copy outside this computer, such as a USB drive or your bookkeeping folder.',
    'Liburua nabigatzaile honetan bizi da, eta guneko datuak garbitzean ezaba dezake. Egin kopia fakturatzen duzun egun bakoitzean eta gorde ordenagailu honetatik kanpo ere: USB batean edo gestoriako karpetan.',
    'O libro vive neste navegador, que o pode borrar se se limpan os datos do sitio. Fai copia cada día que factures e gárdaa tamén fóra deste ordenador: nun lapis USB ou na carpeta da xestoría.'
  ),
  'Encara no hi ha cap còpia del llibre': t4('Todavía no hay ninguna copia del libro', 'No ledger backup yet', 'Oraindik ez dago liburuaren kopiarik', 'Aínda non hai ningunha copia do libro'),
  'Fes-ne una ara: sense còpia, si el navegador esborra les dades, el llibre es perd.': t4(
    'Haz una ahora: sin copia, si el navegador borra los datos, el libro se pierde.',
    'Create one now: without a backup, clearing browser data loses the ledger.',
    'Egin bat orain: kopiarik gabe, nabigatzaileak datuak ezabatzen baditu, liburua galdu egiten da.',
    'Fai unha agora: sen copia, se o navegador borra os datos, o libro pérdese.'
  ),
  'Desa la còpia en una carpeta': t4('Guardar la copia en una carpeta', 'Save backup to folder', 'Gorde kopia karpeta batean', 'Gardar a copia nunha carpeta'),
  'Descarrega la còpia': t4('Descargar la copia', 'Download backup', 'Deskargatu kopia', 'Descargar a copia'),
  'Restaura una còpia': t4('Restaurar una copia', 'Restore a backup', 'Leheneratu kopia bat', 'Restaurar unha copia'),
  'Tria un fitxer de còpia del llibre (.json). Abans de tocar res es verifica la cadena sencera; només s’hi afig el que falta i mai es reescriu el que ja hi ha.': t4(
    'Elige un archivo de copia del libro (.json). Antes de tocar nada se verifica la cadena completa; solo se añade lo que falta y nunca se reescribe lo existente.',
    'Choose a ledger backup file (.json). The entire chain is verified first; only missing records are appended and existing entries are never overwritten.',
    'Aukeratu liburuaren kopia-fitxategi bat (.json). Ezer ukitu aurretik kate osoa egiaztatzen da; falta dena soilik gehitzen da eta lehendik dagoena ez da inoiz berridazten.',
    'Escolle un ficheiro de copia do libro (.json). Antes de tocar nada verifícase a cadea enteira; só se engade o que falta e nunca se reescribe o que xa hai.'
  ),
  'Tria la còpia': t4('Elegir la copia', 'Choose backup', 'Aukeratu kopia', 'Escoller a copia'),

  /* PortaCofre */
  Comprovant: t4('Comprobando', 'Checking', 'Egiaztatzen', 'Comprobando'),
  'No disponible': t4('No disponible', 'Unavailable', 'Ez dago erabilgarri', 'Non dispoñible'),
  'Sense crear': t4('Sin crear', 'Not created', 'Sortu gabe', 'Sen crear'),
  Bloquejat: t4('Bloqueado', 'Locked', 'Blokeatuta', 'Bloqueado'),
  Obert: t4('Abierto', 'Unlocked', 'Irekita', 'Aberto'),
  'Sense frase': t4('Sin frase', 'Empty passphrase', 'Esaldirik gabe', 'Sen frase'),
  'Massa curta': t4('Demasiado corta', 'Too short', 'Laburregia', 'Demasiado curta'),
  'Massa repetida': t4('Demasiado repetida', 'Too repetitive', 'Errepikatuegia', 'Demasiado repetida'),
  'Massa previsible': t4('Demasiado previsible', 'Too predictable', 'Aurreikusgarriegia', 'Demasiado previsible'),
  'Massa llarga': t4('Demasiado larga', 'Too long', 'Luzeegia', 'Demasiado longa'),
  Justa: t4('Justa', 'Fair', 'Justua', 'Xusta'),
  Bona: t4('Buena', 'Good', 'Ona', 'Boa'),
  'Molt bona': t4('Muy buena', 'Strong', 'Oso ona', 'Moi boa'),
  'Almenys 12 caràcters o 4 paraules. Quatre o cinc paraules sense relació entre elles són més fàcils de recordar i més fortes que una contrasenya curta i rara.': t4(
    'Al menos 12 caracteres o 4 palabras. Cuatro o cinco palabras sin relación entre sí son más fáciles de recordar y más fuertes que una contraseña corta y rara.',
    'At least 12 characters or 4 words. Four or five unrelated words are easier to remember and stronger than a short complex password.',
    'Gutxienez 12 karaktere edo 4 hitz. Elkarren artean loturarik ez duten lau edo bost hitz errazagoak dira gogoratzeko eta pasahitz labur bat baino sendoagoak.',
    'Polo menos 12 caracteres ou 4 palabras. Catro ou cinco palabras sen relación entre elas son máis fáciles de lembrar e máis fortes ca un contrasinal curto e raro.'
  ),
  'Mostra la frase de pas': t4('Mostrar la frase de paso', 'Show passphrase', 'Erakutsi pasaesaldia', 'Mostrar a frase de paso'),
  'Robustesa:': t4('Robustez:', 'Strength:', 'Sendotasuna:', 'Robustez:'),
  'Les dues frases no coincidixen.': t4('Las dos frases no coinciden.', 'Passphrases do not match.', 'Bi esaldiak ez datoz bat.', 'As dúas frases non coinciden.'),
  'Frase de pas nova': t4('Frase de paso nueva', 'New passphrase', 'Pasaesaldi berria', 'Frase de paso nova'),
  'Repetix la frase de pas': t4('Repite la frase de paso', 'Repeat passphrase', 'Errepikatu pasaesaldia', 'Repite a frase de paso'),
  'Mostra la repetició de la frase': t4('Mostrar la repetición de la frase', 'Show repeated passphrase', 'Erakutsi esaldiaren errepikapena', 'Mostrar a repetición da frase'),
  'El que guardes en este cofre es desa xifrat en este navegador. Només la teua frase de pas o el codi de recuperació l’obrin: ningú més, tampoc Sóc de Poble, ho pot recuperar si perds totes dues coses.': t4(
    'Lo que guardas en este cofre se almacena cifrado en este navegador. Solo tu frase de paso o el código de recuperación lo abren: nadie más, tampoco Sóc de Poble, puede recuperarlo si pierdes ambos.',
    'Everything stored in this vault is encrypted locally in your browser. Only your passphrase or recovery code unlocks it: nobody else, including Sóc de Poble, can recover it if both are lost.',
    'Kutxa honetan gordetzen duzuna zifratuta gordetzen da nabigatzaile honetan. Zure pasaesaldiak edo berreskuratze-kodeak soilik irekitzen dute: beste inork ezin du berreskuratu biak galtzen badituzu.',
    'O que gardas neste cofre gárdase cifrado neste navegador. Só a túa frase de paso ou o código de recuperación o abren: ninguén máis, tampouco Sóc de Poble, o pode recuperar se perdes as dúas cousas.'
  ),
  'Crea el cofre': t4('Crear el cofre', 'Create vault', 'Sortu kutxa', 'Crear o cofre'),
  'Frase de pas': t4('Frase de paso', 'Passphrase', 'Pasaesaldia', 'Frase de paso'),
  'Obri el cofre': t4('Abrir el cofre', 'Unlock vault', 'Ireki kutxa', 'Abrir o cofre'),
  'He oblidat la frase de pas': t4('He olvidado la frase de paso', 'I forgot my passphrase', 'Pasaesaldia ahaztu dut', 'Esquecín a frase de paso'),
  'Codi de recuperació': t4('Código de recuperación', 'Recovery code', 'Berreskuratze-kodea', 'Código de recuperación'),
  'Les 26 lletres i xifres que vas apuntar en crear el cofre (ABCD-EFGH-…).': t4(
    'Las 26 letras y cifras que anotaste al crear el cofre (ABCD-EFGH-…).',
    'The 26 letters and digits you wrote down when creating the vault (ABCD-EFGH-…).',
    'Kutxa sortzean idatzi zenituen 26 letra eta zifrak (ABCD-EFGH-…).',
    'As 26 letras e cifras que apuntaches ao crear o cofre (ABCD-EFGH-…).'
  ),
  'Recupera el cofre': t4('Recuperar el cofre', 'Recover vault', 'Berreskuratu kutxa', 'Recuperar o cofre'),
  'Torna a la frase de pas': t4('Volver a la frase de paso', 'Back to passphrase', 'Itzuli pasaesaldira', 'Volver á frase de paso'),
  'Apunta ara el codi de recuperació': t4('Anota ahora el código de recuperación', 'Write down your recovery code now', 'Idatzi orain berreskuratze-kodea', 'Apunta agora o código de recuperación'),
  'L’he apuntat en paper i el guarde en un lloc segur': t4(
    'Lo he anotado en papel y lo guardo en un lugar seguro',
    'I have written it on paper and stored it in a safe place',
    'Paperean idatzi dut eta leku seguruan gordeko dut',
    'Apunteino en papel e gárdoo nun lugar seguro'
  ),
  'Restaura una còpia xifrada': t4('Restaurar una copia cifrada', 'Restore encrypted backup', 'Leheneratu kopia zifratu bat', 'Restaurar unha copia cifrada'),
  'Importa una còpia xifrada': t4('Importar una copia cifrada', 'Import encrypted backup', 'Inportatu kopia zifratu bat', 'Importar unha copia cifrada'),
  'Un fitxer .json fet amb «Descarrega la còpia xifrada». Abans de tocar res es comprova sencer; en un cofre obert només s’hi afig el que falta.': t4(
    'Un archivo .json creado con «Descargar la copia cifrada». Antes de tocar nada se verifica íntegro; en un cofre abierto solo añade lo que falta.',
    'A .json file created via “Download encrypted backup”. Verified in full before changes; into an unlocked vault it only merges missing entries.',
    '«Deskargatu kopia zifratua» aukerarekin egindako .json fitxategia. Ezer ukitu aurretik osorik egiaztatzen da; irekitako kutxa batean falta dena soilik gehitzen du.',
    'Un ficheiro .json feito con «Descargar a copia cifrada». Antes de tocar nada compróbase enteiro; nun cofre aberto só engade o que falta.'
  ),
  'Frase de pas de la còpia': t4('Frase de paso de la copia', 'Backup passphrase', 'Kopiaren pasaesaldia', 'Frase de paso da copia'),
  'Mostra la frase de la còpia': t4('Mostrar la frase de la copia', 'Show backup passphrase', 'Erakutsi kopiaren pasaesaldia', 'Mostrar a frase da copia'),
  'Restaura la còpia': t4('Restaurar la copia', 'Restore backup', 'Leheneratu kopia', 'Restaurar a copia'),
  'Importa la còpia': t4('Importar la copia', 'Import backup', 'Inportatu kopia', 'Importar a copia'),
  'Cofre xifrat': t4('Cofre cifrado', 'Encrypted vault', 'Kutxa zifratua', 'Cofre cifrado'),
  'Comprovant el cofre…': t4('Comprobando el cofre…', 'Checking vault…', 'Kutxa egiaztatzen…', 'Comprobando o cofre…'),
  'El cofre és obert': t4('El cofre está abierto', 'Vault is unlocked', 'Kutxa irekita dago', 'O cofre está aberto'),
  'Es bloqueja sol després de 10 minuts sense activitat, si la pestanya està amagada més de 5 minuts o si ixes de la pàgina.': t4(
    'Se bloquea automáticamente tras 10 minutos sin actividad, tras 5 minutos en segundo plano o al salir de la página.',
    'Locks automatically after 10 minutes of inactivity, 5 minutes in a hidden tab, or when leaving the page.',
    'Bakarrik blokeatzen da 10 minutuz jarduerarik ez badago, fitxa 5 minutuz baino gehiagoz ezkutatuta badago edo orritik irtetean.',
    'Bloquéase só despois de 10 minutos sen actividade, se a lapela está oculta máis de 5 minutos ou se saes da páxina.'
  ),
  Bloqueja: t4('Bloquear', 'Lock', 'Blokeatu', 'Bloquear'),
  'Còpies i claus del cofre': t4('Copias y claves del cofre', 'Vault backups and keys', 'Kutxaren kopiak eta gakoak', 'Copias e chaves do cofre'),
  'Còpia de seguretat xifrada': t4('Copia de seguridad cifrada', 'Encrypted backup', 'Segurtasun-kopia zifratua', 'Copia de seguridade cifrada'),
  'Descarrega la còpia xifrada': t4('Descargar la copia cifrada', 'Download encrypted backup', 'Deskargatu kopia zifratua', 'Descargar a copia cifrada'),
  'Canvia la frase de pas': t4('Cambiar la frase de paso', 'Change passphrase', 'Aldatu pasaesaldia', 'Cambiar a frase de paso'),
  'Codi de recuperació nou': t4('Nuevo código de recuperación', 'New recovery code', 'Berreskuratze-kode berria', 'Código de recuperación novo'),
  'Fes un codi nou': t4('Crear un código nuevo', 'Generate new code', 'Sortu kode berria', 'Facer un código novo'),
  'Exporta sense xifrar': t4('Exportar sin cifrar', 'Export unencrypted', 'Esportatu zifratu gabe', 'Exportar sen cifrar'),
  'Descarrega sense xifrar': t4('Descargar sin cifrar', 'Download unencrypted', 'Deskargatu zifratu gabe', 'Descargar sen cifrar'),

  /* Històric i IA + PanellSimulacio */
  'Històric i IA': t4('Histórico e IA', 'History and AI', 'Historikoa eta AA', 'Histórico e IA'),
  'El banc des de l’any passat, la despesa en IA i les simulacions': t4(
    'El banco desde el año pasado, el gasto en IA y las simulaciones',
    'Bank statements since last year, AI spend and tax simulations',
    'Iaztik bankua, AAn egindako gastua eta simulazioak',
    'O banco desde o ano pasado, o gasto en IA e as simulacións'
  ),
  'El panell del director financer: tots els extractes de l’1 de gener de l’any passat al final del trimestre passat, classificats en este ordinador.': t4(
    'El panel del director financiero: todos los extractos desde el 1 de enero del año pasado hasta el cierre del último trimestre, clasificados en este ordenador.',
    'CFO overview: all bank statements from January 1st of last year through the end of last quarter, classified locally on this computer.',
    'Finantza-zuzendariaren panela: iazko urtarrilaren 1etik aurreko hiruhilekoaren amaiera arteko laburpen guztiak, ordenagailu honetan sailkatuta.',
    'O panel de dirección financeira: todos os extractos desde o 1 de xaneiro do ano pasado ata o final do trimestre pasado, clasificados neste ordenador.'
  ),
  'Tria els extractes del banc de tot el període': t4(
    'Elige los extractos bancarios de todo el período',
    'Choose bank statements for the full period',
    'Aukeratu aldi osoko bankuko laburpenak',
    'Escolle os extractos do banco de todo o período'
  ),
  'Llegint i classificant els extractes…': t4('Leyendo y clasificando los extractos…', 'Reading and classifying statements…', 'Laburpenak irakurtzen eta sailkatzen…', 'Lendo e clasificando os extractos…'),
  'Torna a llegir amb les regles': t4('Volver a leer con las reglas', 'Re-read with rules', 'Irakurri berriro arauekin', 'Volver ler coas regras'),
  'La foto del director financer': t4('La foto del director financiero', 'CFO snapshot', 'Finantza-zuzendariaren argazkia', 'A foto de dirección financeira'),
  'L’històric': t4('El histórico', 'History', 'Historikoa', 'O histórico'),
  'Agrupa l’històric': t4('Agrupar el histórico', 'Group history by', 'Multzokatu historikoa', 'Agrupar o histórico'),
  'Per mes': t4('Por mes', 'By month', 'Hilabeteka', 'Por mes'),
  'Per trimestre': t4('Por trimestre', 'By quarter', 'Hiruhilekoka', 'Por trimestre'),
  'Per any': t4('Por año', 'By year', 'Urteka', 'Por ano'),
  'L’històric per mes': t4('El histórico por mes', 'History by month', 'Historikoa hilabeteka', 'O histórico por mes'),
  'L’històric per trimestre': t4('El histórico por trimestre', 'History by quarter', 'Historikoa hiruhilekoka', 'O histórico por trimestre'),
  'L’històric per any': t4('El histórico por año', 'History by year', 'Historikoa urteka', 'O histórico por ano'),
  'Despesa en IA': t4('Gasto en IA', 'AI spend', 'AA gastua', 'Gasto en IA'),
  'IA sobre les eixides': t4('IA sobre salidas', 'AI share of outflows', 'AA irteeren gainean', 'IA sobre as saídas'),
  'Eixides per mes, sense traspassos': t4('Salidas por mes, sin traspasos', 'Monthly outflows, excluding transfers', 'Irteerak hilabeteka, eskualdaketarik gabe', 'Saídas por mes, sen traspasos'),
  'El període per categoria': t4('El período por categoría', 'Period by category', 'Aldia kategoriaka', 'O período por categoría'),
  Categoria: t4('Categoría', 'Category', 'Kategoria', 'Categoría'),
  Moviments: t4('Movimientos', 'Transactions', 'Mugimenduak', 'Movementos'),
  'La despesa en IA': t4('El gasto en IA', 'AI expenditure', 'AAn egindako gastua', 'O gasto en IA'),
  'Despesa neta en IA per mes': t4('Gasto neto en IA por mes', 'Net monthly AI spend', 'AA gastu garbia hilabeteka', 'Gasto neto en IA por mes'),
  'La despesa en IA per proveïdor': t4('El gasto en IA por proveedor', 'AI spend by supplier', 'AA gastua hornitzaileka', 'O gasto en IA por provedor'),
  'Cap moviment del període és d’IA.': t4('Ningún movimiento del período corresponde a IA.', 'No AI transactions in this period.', 'Aldiko mugimendu bakar bat ere ez da AAkoa.', 'Ningún movemento do período é de IA.'),
  'Per revisar': t4('Por revisar', 'For review', 'Berrikusteko', 'Por revisar'),
  'No hi ha cap moviment per revisar.': t4('No hay ningún movimiento por revisar.', 'No transactions pending review.', 'Ez dago berrikusteko mugimendurik.', 'Non hai ningún movemento por revisar.'),
  'Afig la regla': t4('Añadir la regla', 'Add rule', 'Gehitu araua', 'Engadir a regra'),
  'Simulacions d’impostos': t4('Simulaciones de impuestos', 'Tax simulations', 'Zerga-simulazioak', 'Simulacións de impostos'),
  Escenaris: t4('Escenarios', 'Scenarios', 'Eszenatokiak', 'Escenarios'),
  'Facturació (% de canvi)': t4('Facturación (% de cambio)', 'Invoicing (% change)', 'Fakturazioa (aldaketa %)', 'Facturación (% de cambio)'),
  'Despesa en IA (% de canvi)': t4('Gasto en IA (% de cambio)', 'AI spend (% change)', 'AA gastua (aldaketa %)', 'Gasto en IA (% de cambio)'),
  'Paràmetres i suposicions': t4('Parámetros y suposiciones', 'Parameters and assumptions', 'Parametroak eta hipotesiak', 'Parámetros e suposicións'),
  'Suposicions sobre els moviments del banc': t4('Suposiciones sobre los movimientos bancarios', 'Assumptions on bank transactions', 'Banku-mugimenduei buruzko hipotesiak', 'Suposicións sobre os movementos do banco'),
  'El llibre per a la gestora': t4('El libro para la gestoría', 'Workbook for tax advisor', 'Gestoriarako liburua', 'O libro para a xestoría'),
  'Prepara el llibre (XLSX)': t4('Preparar el libro (XLSX)', 'Prepare workbook (XLSX)', 'Prestatu liburua (XLSX)', 'Preparar o libro (XLSX)'),
  'Encara no hi ha cap extracte': t4('Todavía no hay ningún extracto', 'No bank statements loaded yet', 'Oraindik ez dago laburpenik', 'Aínda non hai ningún extracto'),
  'Tria els extractes del banc de tot el període (un per trimestre i compte, per exemple): l’Històric els unix sense comptar dues vegades els dies repetits.': t4(
    'Elige los extractos bancarios de todo el período (uno por trimestre y cuenta, por ejemplo): el Histórico los une sin duplicar días solapados.',
    'Select bank statements covering the whole period (e.g. one per quarter and account): History merges them without double-counting overlapping days.',
    'Aukeratu aldi osoko banku-laburpenak (bat hiruhileko eta kontu bakoitzeko, adibidez): Historikoak batu egiten ditu errepikatutako egunak bi aldiz zenbatu gabe.',
    'Escolle os extractos do banco de todo o período (un por trimestre e conta, por exemplo): o Histórico úneos sen contar dúas veces os días repetidos.'
  ),

  /* Identitat i Finestreta */
  'Identitat i Finestreta': t4('Identidad y Ventanilla', 'Identity and One-Stop Desk', 'Nortasuna eta Leihatila', 'Identidade e Xanela'),
  'La teua fitxa legal, privada, i els tràmits preparats per a copiar': t4(
    'Tu ficha legal privada y los trámites listos para copiar',
    'Your private legal profile and pre-filled administrative forms',
    'Zure legezko fitxa pribatua eta kopiatzeko prest dauden izapideak',
    'A túa ficha legal privada e os trámites preparados para copiar'
  ),
  'Els teus papers d’identitat, llegits en este ordinador: confirmes cada dada, es desa xifrada al cofre i la Finestreta te-la prepara per a copiar-la als tràmits. No signa ni presenta res.': t4(
    'Tus documentos de identidad, leídos en este ordenador: confirmas cada dato, se guarda cifrado en el cofre y la Ventanilla lo deja listo para copiarlo en los trámites. No firma ni presenta nada.',
    'Your identity documents, read locally on this computer: confirm each field, store it encrypted in the vault, and copy fields into official forms. Never signs or submits anything.',
    'Zure nortasun-agiriak, ordenagailu honetan irakurrita: datu bakoitza berresten duzu, kutxan zifratuta gordetzen da eta Leihatilak izapideetan kopiatzeko prestatzen dizu. Ez du ezer sinatzen ez aurkezten.',
    'Os teus papeis de identidade, lidos neste ordenador: confirmas cada dato, gárdase cifrado no cofre e a Xanela prepáracho para copialo nos trámites. Non asina nin presenta nada.'
  ),
  'Esta pàgina no signa ni presenta cap tràmit: et prepara els camps perquè els copies tu a la seu electrònica de l’organisme, o per a imprimir-ne un esborrany.': t4(
    'Esta página no firma ni presenta ningún trámite: prepara los campos para que tú los copies en la sede electrónica del organismo o imprimas un borrador.',
    'This page neither signs nor submits any filing: it prepares your fields to copy into the agency’s e-portal or print as a draft.',
    'Orri honek ez du izapiderik sinatzen ez aurkezten: eremuak prestatzen dizkizu erakundearen egoitza elektronikoan kopiatzeko edo zirriborroa inprimatzeko.',
    'Esta páxina non asina nin presenta ningún trámite: prepárache os campos para que os copies ti na sede electrónica do organismo ou imprimas un borrador.'
  ),
  'Obrint la teua fitxa…': t4('Abriendo tu ficha…', 'Opening your profile…', 'Zure fitxa irekitzen…', 'Abrindo a túa ficha…'),
  'La carpeta arrel de la Gestoria, la que conté 01_Identitat_Legal i 03_Burocracia. Abans d’obrir cap paper, et diré quins llegiré i quins no.': t4(
    'La carpeta raíz de la Gestoría, la que contiene 01_Identitat_Legal y 03_Burocracia. Antes de abrir ningún documento, verás cuáles se leerán y cuáles no.',
    'Your Bookkeeping root folder containing 01_Identitat_Legal and 03_Burocracia. Before opening any file, you will see exactly which files will be read or skipped.',
    'Gestoriako erroko karpeta, 01_Identitat_Legal eta 03_Burocracia dituena. Agiririk ireki aurretik, zeintzuk irakurriko diren eta zeintzuk ez esango dizut.',
    'A carpeta raíz da Xestoría, a que contén 01_Identitat_Legal e 03_Burocracia. Antes de abrir ningún papel, direiche cales lerei e cales non.'
  ),
  'Els papers no ixen d’este ordinador': t4(
    'Los documentos no salen de este ordenador',
    'Documents never leave this computer',
    'Agiriak ez dira ordenagailu honetatik ateratzen',
    'Os papeis non saen deste ordenador'
  ),
  'Es lligen en la memòria d’esta pàgina i se’n descarten els bytes i el text en acabar: només queden les propostes, que no es desen fins que les confirmes. Mai s’obrin els de salut, banc, credencials, renda, herència, el model 145 ni les imatges.': t4(
    'Se leen en la memoria de esta página y se descartan sus bytes y texto al terminar: solo quedan las propuestas, que no se guardan hasta que las confirmas. Nunca se abren documentos de salud, banco, credenciales, renta, herencia, modelo 145 ni imágenes.',
    'Read in memory and discarded immediately after extraction: only proposed fields remain, saved only when confirmed by you. Health, banking, credentials, income tax, inheritance, Form 145 and image files are never opened.',
    'Orri honen memorian irakurtzen dira eta amaitzean byteak eta testua baztertzen dira: proposamenak soilik geratzen dira, zuk berretsi arte gordetzen ez direnak. Osasuneko, bankuko, kredentzialetako, errentako, herentziako, 145 ereduko agiriak eta irudiak ez dira inoiz irekitzen.',
    'Lense na memoria desta páxina e descártanse os bytes e o texto ao rematar: só quedan as propostas, que non se gardan ata que as confirmas. Nunca se abren os de saúde, banco, credenciais, renda, herdanza, o modelo 145 nin as imaxes.'
  ),
  'Tria la carpeta arrel de la Gestoria': t4(
    'Elegir la carpeta raíz de la Gestoría',
    'Choose Bookkeeping root folder',
    'Aukeratu Gestoriako erroko karpeta',
    'Escoller a carpeta raíz da Xestoría'
  ),
  'Mirant els noms dels papers…': t4('Revisando los nombres de los documentos…', 'Inspecting document filenames…', 'Agirien izenak begiratzen…', 'Mirando os nomes dos papeis…'),
  'No s’ha pogut continuar': t4('No se ha podido continuar', 'Could not continue', 'Ezin izan da jarraitu', 'Non se puido continuar'),
  'Què llegiré i què no': t4('Qué leeré y qué no', 'What will and won’t be read', 'Zer irakurriko dudan eta zer ez', 'Que lerei e que non'),
  'Decidit només pel nom de cada paper i per la seua carpeta, sense obrir-ne cap.': t4(
    'Decidido únicamente por el nombre de cada documento y su carpeta, sin abrir ninguno.',
    'Determined strictly from filenames and folder paths, without opening any file.',
    'Agiri bakoitzaren izenaren eta karpetaren arabera soilik erabakita, bat bera ere ireki gabe.',
    'Decidido só polo nome de cada papel e pola súa carpeta, sen abrir ningún.'
  ),
  'Es llegirà': t4('Se leerá', 'Will read', 'Irakurriko da', 'Lerase'),
  'Només si el marques': t4('Solo si lo marcas', 'Only if checked', 'Markatzen baduzu soilik', 'Só se o marcas'),
  'No s’obrirà': t4('No se abrirá', 'Skipped', 'Ez da irekiko', 'Non se abrirá'),
  'Desmarca tots': t4('Desmarcar todos', 'Uncheck all', 'Desmarkatu guztiak', 'Desmarcar todos'),
  'Llig-lo': t4('Leerlo', 'Read file', 'Irakurri', 'Lelo'),
  'Llegint els papers': t4('Leyendo los documentos', 'Reading documents', 'Agiriak irakurtzen', 'Lendo os papeis'),
  'Propostes per revisar': t4('Propuestas por revisar', 'Proposed fields for review', 'Berrikusteko proposamenak', 'Propostas para revisar'),
  'Cap proposta entra a la fitxa sola: la confirmes, la rebutges o l’entres a mà. Quan dos papers diuen coses diferents, tries tu.': t4(
    'Ninguna propuesta entra sola en la ficha: la confirmas, la rechazas o la introduces a mano. Cuando dos documentos discrepan, decides tú.',
    'No proposal enters your profile automatically: confirm, reject or type it manually. When two documents disagree, you choose.',
    'Proposamen bakar bat ere ez da fitxan bakarrik sartzen: berretsi, baztertu edo eskuz sartzen duzu. Bi agirik gauza desberdinak diotenean, zuk aukeratzen duzu.',
    'Ningunha proposta entra na ficha soa: confírmala, rexéitala ou introdúcela á man. Cando dous papeis din cousas diferentes, escolles ti.'
  ),
  'Confiança alta': t4('Confianza alta', 'High confidence', 'Konfiantza handia', 'Confianza alta'),
  'Confiança mitjana': t4('Confianza media', 'Medium confidence', 'Konfiantza ertaina', 'Confianza media'),
  'Confiança baixa': t4('Confianza baja', 'Low confidence', 'Konfiantza txikia', 'Confianza baixa'),
  'Tria el camp': t4('Elige el campo', 'Select field', 'Aukeratu eremua', 'Escolle o campo'),
  'Camp que vols entrar a mà': t4('Campo que quieres introducir a mano', 'Field to enter manually', 'Eskuz sartu nahi duzun eremua', 'Campo que queres introducir á man'),
  Valor: t4('Valor', 'Value', 'Balioa', 'Valor'),
  'Un import, en euros (1.234,56); una data, dd/mm/aaaa.': t4(
    'Un importe, en euros (1.234,56); una fecha, dd/mm/aaaa.',
    'An amount in euros (1.234,56); a date as dd/mm/yyyy.',
    'Zenbateko bat, eurotan (1.234,56); data bat, ee/hh/uuuu.',
    'Un importe, en euros (1.234,56); unha data, dd/mm/aaaa.'
  ),
  'Afig-lo a la fitxa': t4('Añadirlo a la ficha', 'Add to profile', 'Gehitu fitxara', 'Engadilo á ficha'),
  'La teua fitxa': t4('Tu ficha', 'Your profile', 'Zure fitxa', 'A túa ficha'),
  'Només els valors que has confirmat o entrat a mà. Es desen xifrats al cofre d’este navegador, amb el paper d’on ixen.': t4(
    'Solo los valores que has confirmado o introducido a mano. Se guardan cifrados en el cofre de este navegador junto con su documento de origen.',
    'Only values confirmed or entered manually by you. Stored encrypted in this browser’s vault alongside their source document.',
    'Berretsi edo eskuz sartu dituzun balioak soilik. Nabigatzaile honetako kutxan zifratuta gordetzen dira, jatorrizko agiriarekin batera.',
    'Só os valores que confirmaches ou introduciches á man. Gárdanse cifrados no cofre deste navegador, co papel de onde saen.'
  ),
  'Encara no hi ha cap valor confirmat.': t4('Todavía no hay ningún valor confirmado.', 'No confirmed values yet.', 'Oraindik ez dago berretsitako baliorik.', 'Aínda non hai ningún valor confirmado.'),
  Finestreta: t4('Ventanilla', 'One-Stop Desk', 'Leihatila', 'Xanela'),
  'Els formularis s’omplin NOMÉS amb els valors confirmats de la teua fitxa, cadascun validat amb el tipus del camp: un NIF no entra mai en un camp de nom.': t4(
    'Los formularios se rellenan SOLO con los valores confirmados de tu ficha, validando el tipo de cada campo: un NIF nunca entra en un campo de nombre.',
    'Forms are populated ONLY from confirmed profile values, strictly type-checked: a Tax ID never lands in a name field.',
    'Inprimakiak zure fitxako balio berretsiekin SOILIK betetzen dira, eremu bakoitzaren mota egiaztatuz: IFZ bat ez da inoiz izen-eremu batean sartzen.',
    'Os formularios énchense SÓ cos valores confirmados da túa ficha, cada un validado co tipo do campo: un NIF non entra nunca nun campo de nome.'
  ),
  'L’app no signa ni presenta res': t4('La app no firma ni presenta nada', 'This app never signs or submits', 'Aplikazioak ez du ezer sinatzen ez aurkezten', 'A app non asina nin presenta nada'),
  'Formularis de la Finestreta': t4('Formularios de la Ventanilla', 'One-Stop Desk forms', 'Leihatilako inprimakiak', 'Formularios da Xanela'),
  Llest: t4('Listo', 'Ready', 'Prest', 'Listo'),
  'Falta a la fitxa': t4('Falta en la ficha', 'Missing in profile', 'Fitxan falta da', 'Falta na ficha'),
  'Sense confirmar': t4('Sin confirmar', 'Unconfirmed', 'Berretsi gabe', 'Sen confirmar'),
  'No quadra amb el camp': t4('No encaja con el campo', 'Type mismatch', 'Ez dator bat eremuarekin', 'Non cadra co campo'),
  'L’escrius tu': t4('Lo escribes tú', 'Entered by you', 'Zuk idazten duzu', 'Escríbelo ti'),
  'Esborrany per imprimir': t4('Borrador para imprimir', 'Printable draft', 'Inprimatzeko zirriborroa', 'Borrador para imprimir'),
  'Imprimix esta pàgina: és un esborrany per a copiar, no el model de l’organisme.': t4(
    'Imprime esta página: es un borrador de apoyo para copiar, no el modelo oficial del organismo.',
    'Print this page: it is a reference draft for copying, not the agency’s official form.',
    'Inprimatu orri hau: kopiatzeko zirriborroa da, ez erakundearen eredu ofiziala.',
    'Imprime esta páxina: é un borrador para copiar, non o modelo do organismo.'
  ),
  'Obri l’ull de la barra perquè l’esborrany porte els valors.': t4(
    'Abre el ojo de la cabecera para que el borrador incluya los valores.',
    'Press the eye icon in the header so the draft includes your values.',
    'Ireki goiburuko begia zirriborroak balioak eraman ditzan.',
    'Abre o ollo da barra para que o borrador leve os valores.'
  ),
  'Encara no has triat cap carpeta': t4('Todavía no has elegido ninguna carpeta', 'No folder selected yet', 'Oraindik ez duzu karpetarik aukeratu', 'Aínda non escolliches ningunha carpeta'),
  'Tria la carpeta arrel de la Gestoria: primer et diré quins papers llegiré i quins no, i només després els llegiré.': t4(
    'Elige la carpeta raíz de la Gestoría: primero te mostraré qué documentos leeré y cuáles no, y solo después los leeré.',
    'Choose your Bookkeeping root folder: first you will see which files will be read or skipped, before any file is opened.',
    'Aukeratu Gestoriako erroko karpeta: lehenik zein agiri irakurriko ditudan eta zeintzuk ez esango dizut, eta ondoren soilik irakurriko ditut.',
    'Escolle a carpeta raíz da Xestoría: primeiro direiche que papeis lerei e cales non, e só despois os lerei.'
  ),

  /* Etiquetes dels camps de la Fitxa d'identitat i dels tipus de paper */
  'NIF o NIE': t4('NIF o NIE', 'Tax ID (NIF/NIE)', 'IFZ edo AIZ', 'NIF ou NIE'),
  'Primer cognom': t4('Primer apellido', 'First surname', 'Lehen abizena', 'Primeiro apelido'),
  'Segon cognom': t4('Segundo apellido', 'Second surname', 'Bigarren abizena', 'Segundo apelido'),
  'Data de naixement': t4('Fecha de nacimiento', 'Date of birth', 'Jaioteguna', 'Data de nacemento'),
  'Tipus de via': t4('Tipo de vía', 'Street type', 'Bide-mota', 'Tipo de vía'),
  'Nom de la via': t4('Nombre de la vía', 'Street name', 'Bidearen izena', 'Nome da vía'),
  'Pis, porta o escala': t4('Piso, puerta o escalera', 'Floor, door or stair', 'Solairua, atea edo eskailera', 'Piso, porta ou escaleira'),
  Municipi: t4('Municipio', 'Municipality', 'Udalerria', 'Municipio'),
  'Codi INE del municipi': t4('Código INE del municipio', 'INE municipality code', 'Udalerriaren INE kodea', 'Código INE do municipio'),
  'Província': t4('Provincia', 'Province', 'Probintzia', 'Provincia'),
  'País': t4('País', 'Country', 'Herrialdea', 'País'),
  'Telèfon': t4('Teléfono', 'Phone', 'Telefonoa', 'Teléfono'),
  'Correu electrònic': t4('Correo electrónico', 'Email', 'Helbide elektronikoa', 'Correo electrónico'),
  'Mitjà de notificació (electronica o postal)': t4('Medio de notificación (electrónica o postal)', 'Notification channel (electronic or postal)', 'Jakinarazpen-bidea (elektronikoa edo postaz)', 'Medio de notificación (electrónica ou postal)'),
  'Número d’afiliació a la Seguretat Social': t4('Número de afiliación a la Seguridad Social', 'Social Security affiliation number', 'Gizarte Segurantzako afiliazio-zenbakia', 'Número de afiliación á Seguridade Social'),
  'Règim de la Seguretat Social': t4('Régimen de la Seguridad Social', 'Social Security regime', 'Gizarte Segurantzako erregimena', 'Réxime da Seguridade Social'),
  'Data d’alta': t4('Fecha de alta', 'Registration date', 'Alta-data', 'Data de alta'),
  'Data d’efectes': t4('Fecha de efectos', 'Effective date', 'Ondorio-data', 'Data de efectos'),
  'Base de cotització': t4('Base de cotización', 'Contribution base', 'Kotizazio-oinarria', 'Base de cotización'),
  'Mútua': t4('Mutua', 'Mutual insurer', 'Mutua', 'Mutua'),
  CNAE: t4('CNAE', 'CNAE activity code', 'CNAE', 'CNAE'),
  'Descripció de l’activitat': t4('Descripción de la actividad', 'Activity description', 'Jardueraren deskribapena', 'Descrición da actividade'),
  'Epígraf de l’IAE': t4('Epígrafe del IAE', 'IAE tax heading', 'JEZ epigrafea', 'Epígrafe do IAE'),
  'Data d’alta censal': t4('Fecha de alta censal', 'Tax census registration date', 'Zentsu-altaren data', 'Data de alta censual'),
  'Domicili de l’activitat': t4('Domicilio de la actividad', 'Business activity address', 'Jardueraren helbidea', 'Domicilio da actividade'),
  'NIF de l’entitat': t4('NIF de la entidad', 'Entity Tax ID', 'Entitatearen IFZ', 'NIF da entidade'),
  'Denominació': t4('Denominación', 'Entity name', 'Izena', 'Denominación'),
  'Domicili social': t4('Domicilio social', 'Registered office', 'Egoitza soziala', 'Domicilio social'),
  Registre: t4('Registro', 'Registry', 'Erregistroa', 'Rexistro'),
  'Número d’inscripció': t4('Número de inscripción', 'Registration number', 'Inskripzio-zenbakia', 'Número de inscrición'),
  'Secció del registre': t4('Sección del registro', 'Registry section', 'Erregistroaren atala', 'Sección do rexistro'),
  'Data d’inscripció': t4('Fecha de inscripción', 'Registration date', 'Inskripzio-data', 'Data de inscrición'),
  'Concepte del tribut': t4('Concepto del tributo', 'Local tax concept', 'Zergaren kontzeptua', 'Concepto do tributo'),
  'Referència de SUMA': t4('Referencia de SUMA', 'SUMA reference', 'SUMA erreferentzia', 'Referencia de SUMA'),
  'Referència cadastral': t4('Referencia catastral', 'Cadastral reference', 'Katastro-erreferentzia', 'Referencia catastral'),
  'Adreça de l’objecte tributari': t4('Dirección del objeto tributario', 'Taxable property address', 'Zerga-objektuaren helbidea', 'Enderezo do obxecto tributario'),
  'Municipi de l’objecte tributari': t4('Municipio del objeto tributario', 'Taxable property municipality', 'Zerga-objektuaren udalerria', 'Municipio do obxecto tributario'),
  'Càrrec': t4('Cargo', 'Role / Office', 'Kargua', 'Cargo'),
  'Tipus de representació': t4('Tipo de representación', 'Representation type', 'Ordezkaritza-mota', 'Tipo de representación'),
  'Vigent des de': t4('Vigente desde', 'Active since', 'Indarrean noiztik', 'Vixente desde'),
  'Vigent fins a': t4('Vigente hasta', 'Valid until', 'Indarrean noiz arte', 'Vixente ata'),
  Persona: t4('Persona', 'Individual', 'Pertsona', 'Persoa'),
  Activitat: t4('Actividad', 'Activity', 'Jarduera', 'Actividade'),
  Entitat: t4('Entidad', 'Entity', 'Entitatea', 'Entidade'),

  /* Estats del tractor quan no està aprovat */
  'encara no està aprovat': t4('todavía no está aprobado', 'is not approved yet', 'oraindik ez dago onartuta', 'aínda non está aprobado'),
  'té l’aprovació caducada': t4('tiene la aprobación caducada', 'has an expired approval', 'onespena iraungita dauka', 'ten a aprobación caducada'),
  'té l’aprovació revocada': t4('tiene la aprobación revocada', 'has a revoked approval', 'onespena baliogabetuta dauka', 'ten a aprobación revogada'),
  'ha canviat des que el vas aprovar': t4('ha cambiado desde que lo aprobaste', 'has changed since you approved it', 'onartu zenuenetik aldatu egin da', 'cambiou desde que o aprobaches'),
  'no té tots els fitxers declarats': t4('no tiene todos los archivos declarados', 'is missing declared source files', 'ez ditu adierazitako fitxategi guztiak', 'non ten todos os ficheiros declarados'),
  'no s’ha pogut comprovar': t4('no se ha podido comprobar', 'could not be verified', 'ezin izan da egiaztatu', 'non se puido comprobar'),

  /* Targetes i textos dels nuclis purs (targetesTauler, cabinaAvio, impostos, formulari) */
  'Caixa real': t4('Caja real', 'Real cash', 'Kutxa erreala', 'Caixa real'),
  'El saldo disponible als teus comptes': t4('El saldo disponible en tus cuentas', 'Available balance across your accounts', 'Zure kontuetan erabilgarri dagoen saldoa', 'O saldo dispoñible nas túas contas'),
  Hisenda: t4('Hacienda', 'Tax Liability', 'Ogasuna', 'Facenda'),
  'Els mesos que la caixa paga les despeses': t4('Los meses que la caja cubre los gastos', 'Months of expenses covered by cash', 'Kutxak gastuak ordaintzen dituen hilabeteak', 'Os meses que a caixa paga os gastos'),
  'Factures i vendes': t4('Facturas y ventas', 'Invoices and sales', 'Fakturak eta salmentak', 'Facturas e vendas'),
  Rendiment: t4('Rendimiento', 'Net performance', 'Errendimendua', 'Rendemento'),
  'Conciliació': t4('Conciliación', 'Reconciliation', 'Bateratzea', 'Conciliación'),
  Banc: t4('Banco', 'Bank', 'Bankua', 'Banco'),
  Incompleta: t4('Incompleta', 'Incomplete', 'Osatu gabea', 'Incompleta'),
  'Estimació incompleta': t4('Estimación incompleta', 'Incomplete estimate', 'Estimazio osatu gabea', 'Estimación incompleta'),
  'Sense dades: encara no has triat cap extracte del banc.': t4(
    'Sin datos: todavía no has elegido ningún extracto del banco.',
    'No data: you have not selected any bank statements yet.',
    'Daturik gabe: oraindik ez duzu bankuko laburpenik aukeratu.',
    'Sen datos: aínda non escolliches ningún extracto do banco.'
  ),
  'Sense factures del trimestre al Tauler: no hi ha cap estimació.': t4(
    'Sin facturas del trimestre en el Tablero: no hay estimación.',
    'No quarterly invoices loaded into the Dashboard: no estimate available.',
    'Hiruhilekoko fakturarik ez Arbelan: ez dago estimaziorik.',
    'Sen facturas do trimestre no Taboleiro: non hai estimación.'
  ),
  'Sense llibres: encara no hi ha cap factura.': t4(
    'Vacío: todavía no hay ninguna factura.',
    'Empty: no invoices recorded yet.',
    'Hutsik: oraindik ez dago fakturarik.',
    'Baleiro: aínda non hai ningunha factura.'
  ),
  'Cadena íntegra': t4('Cadena íntegra', 'Chain verified', 'Kate osoa', 'Cadea íntegra'),
  Buida: t4('Vacía', 'Empty', 'Hutsik', 'Baleira'),
  'El llibre encara és buit': t4('El libro todavía está vacío', 'The ledger is still empty', 'Liburua hutsik dago oraindik', 'O libro aínda está baleiro'),
  'Quan emetes la primera factura, ací es verificarà tota la cadena.': t4(
    'Cuando emitas la primera factura, aquí se verificará toda la cadena.',
    'Once you issue your first invoice, the entire hash chain will be verified here.',
    'Lehen faktura jaulkitzean, hemen egiaztatuko da kate osoa.',
    'Cando emitas a primeira factura, aquí verificarase toda a cadea.'
  ),
  'A verificar contra el model vigent': t4(
    'A verificar contra el modelo vigente',
    'Verify against current official form',
    'Indarreko ereduarekin egiaztatzekoa',
    'A verificar contra o modelo vixente'
  ),
  '[NO VERIFICAT]': t4('[NO VERIFICADO]', '[UNVERIFIED]', '[EGIAZTATU GABEA]', '[NON VERIFICADO]')
};

export const CADENES_GESTORIA = Object.freeze({
  ...CADENES_PART_1,
  ...CADENES_PART_2
});

/* ── 3. Opcions, cadena i formularis dels nuclis purs ── */
const CADENES_NUCLI_EXTRA = {
  'Factura completa': t4('Factura completa', 'Full invoice', 'Faktura osoa', 'Factura completa'),
  'La de sempre: porta les dades del client.': t4(
    'La habitual: incluye los datos del cliente.',
    'Standard invoice including full client details.',
    'Ohikoa: bezeroaren datuak daramatza.',
    'A de sempre: leva os datos do cliente.'
  ),
  'Factura simplificada (tiquet)': t4('Factura simplificada (tiquet)', 'Simplified invoice (receipt)', 'Faktura sinplifikatua (tiketa)', 'Factura simplificada (tícket)'),
  'Sense dades del client, fins a 400 € amb l’IVA inclòs.': t4(
    'Sin datos del cliente, hasta 400 € con IVA incluido.',
    'Without client details, up to €400 VAT included.',
    'Bezeroaren daturik gabe, 400 € arte BEZ barne.',
    'Sen datos do cliente, ata 400 € co IVE incluído.'
  ),
  'Factura completa en lloc de tiquets': t4(
    'Factura completa en sustitución de tiquets',
    'Full invoice replacing receipts',
    'Tiketak ordezkatzeko faktura osoa',
    'Factura completa en lugar de tíckets'
  ),
  'Quan un client et demana la factura d’uns tiquets que ja li havies fet.': t4(
    'Cuando un cliente te pide factura de unos tiquets ya emitidos.',
    'When a client requests a full invoice for previously issued receipts.',
    'Bezero batek lehendik egindako tiket batzuen faktura eskatzen dizunean.',
    'Cando un cliente che pide a factura duns tíckets que xa lle fixeras.'
  ),
  'Factura rectificativa': t4('Factura rectificativa', 'Credit / corrective invoice', 'Faktura zuzentzailea', 'Factura rectificativa'),
  'Per a corregir una factura que ja has emés: la del llibre no es toca, esta la corregix.': t4(
    'Para corregir una factura ya emitida: la del libro no se toca, esta la rectifica.',
    'To correct an issued invoice: the original remains untouched in the ledger.',
    'Jaulkitako faktura bat zuzentzeko: liburukoa ez da ukitzen, honek zuzentzen du.',
    'Para corrixir unha factura xa emitida: a do libro non se toca, esta corríxea.'
  ),
  'Exempta (art. 20 de la Llei de l’IVA)': t4(
    'Exenta (art. 20 de la Ley del IVA)',
    'VAT-exempt (Art. 20 Spanish VAT Act)',
    'Salbuetsia (BEZ Legearen 20. art.)',
    'Exenta (art. 20 da Lei do IVE)'
  ),
  'Sense retenció': t4('Sin retención', 'No withholding', 'Atxikipenik gabe', 'Sen retención'),
  '7 % (inici d’activitat: l’any d’alta i els dos següents)': t4(
    '7 % (inicio de actividad: año de alta y los dos siguientes)',
    '7 % (new activity: registration year plus next two)',
    '% 7 (jarduera-hasiera: alta-urtea eta hurrengo biak)',
    '7 % (inicio de actividade: ano de alta e os dous seguintes)'
  ),
  '15 % (activitat professional)': t4('15 % (actividad profesional)', '15 % (standard professional rate)', '% 15 (jarduera profesionala)', '15 % (actividade profesional)'),
  'Un error, un descompte, una devolució o un canvi del preu': t4(
    'Un error, descuento, devolución o cambio de precio',
    'Error, discount, return or price adjustment',
    'Akats bat, deskontu bat, itzulketa edo prezio-aldaketa',
    'Un erro, desconto, devolución ou cambio do prezo'
  ),
  'El client és en concurs de creditors': t4('El cliente está en concurso de acreedores', 'Client insolvency proceedings', 'Bezeroa hartzekodunen konkurtsoan dago', 'O cliente está en concurso de acredores'),
  'Un cobrament que ja no es podrà fer (crèdit incobrable)': t4('Un cobro incobrable (crédito incobrable)', 'Uncollectible receivable (bad debt)', 'Kobratu ezingo den kreditua', 'Un cobro que xa non se poderá facer (crédito incobrable)'),
  'Una altra causa': t4('Otra causa', 'Other legal cause', 'Beste arrazoi bat', 'Outra causa'),
  'La substituïx sencera': t4('La sustituye entera', 'Full replacement', 'Osorik ordezkatzen du', 'Substitúea enteira'),
  'Escrius la factura com havia de ser, amb totes les línies.': t4(
    'Escribes la factura completa tal como debía ser.',
    'Write the complete invoice as it should have been.',
    'Faktura behar zuen bezala idazten duzu, lerro guztiekin.',
    'Escribes a factura como tiña que ser, con todas as liñas.'
  ),
  'Només la diferència': t4('Solo la diferencia', 'Difference only', 'Aldea soilik', 'Só a diferenza'),
  'Escrius només el que canvia; el que resta, amb el preu en negatiu (-12,50).': t4(
    'Escribes solo lo que cambia; lo que resta, con precio negativo (-12,50).',
    'Enter only the adjustment; reductions take a negative unit price (-12,50).',
    'Aldatzen dena soilik idazten duzu; kentzen duena, prezio negatiboarekin (-12,50).',
    'Escribes só o que cambia; o que resta, co prezo en negativo (-12,50).'
  ),
  'Més opcions': t4('Más opciones', 'More options', 'Aukera gehiago', 'Máis opcións'),
  '1r trimestre': t4('1.º trimestre', 'Q1', '1. hiruhilekoa', '1.º trimestre'),
  '2n trimestre': t4('2.º trimestre', 'Q2', '2. hiruhilekoa', '2.º trimestre'),
  '3r trimestre': t4('3.º trimestre', 'Q3', '3. hiruhilekoa', '3.º trimestre'),
  '4t trimestre': t4('4.º trimestre', 'Q4', '4. hiruhilekoa', '4.º trimestre'),
  'Tot l’any': t4('Todo el año', 'Full year', 'Urte osoa', 'Todo o ano'),
  Totes: t4('Todas', 'All', 'Guztiak', 'Todas'),
  Emeses: t4('Emitidas', 'Issued', 'Jaulkiak', 'Emitidas'),
  'Anul·lades': t4('Anuladas', 'Voided', 'Baliogabetuak', 'Anuladas'),
  Rectificatives: t4('Rectificativas', 'Credit notes', 'Zuzentzaileak', 'Rectificativas'),
  'Sense verificar': t4('Sin verificar', 'Unverified', 'Egiaztatu gabe', 'Sen verificar'),
  'Encara no s’ha verificat la cadena': t4('Todavía no se ha verificado la cadena', 'Chain not verified yet', 'Katea oraindik ez da egiaztatu', 'Aínda non se verificou a cadea'),
  'Amb incidències': t4('Con incidencias', 'Has issues', 'Gorabeherekin', 'Con incidencias'),
  'La cadena del llibre té incidències': t4('La cadena del libro tiene incidencias', 'Ledger chain has integrity issues', 'Liburuaren kateak gorabeherak ditu', 'A cadea do libro ten incidencias'),
  'El llibre encara és buit.': t4('El libro todavía está vacío.', 'The ledger is still empty.', 'Liburua hutsik dago oraindik.', 'O libro aínda está baleiro.'),
  'L’únic registre del llibre s’ha tornat a calcular: ningú no l’ha tocat.': t4(
    'El único registro del libro se ha recalculado: nadie lo ha alterado.',
    'The single record in the ledger was re-hashed: it has not been tampered with.',
    'Liburuko erregistro bakarra birkalkulatu da: inork ez du ukitu.',
    'O único rexistro do libro volveuse calcular: ninguén o tocou.'
  ),
  'Correcta, amb avisos': t4('Correcta, con avisos', 'Valid, with warnings', 'Zuzena, abisuekin', 'Correcta, con avisos'),
  'La cadena és correcta, però hi ha avisos': t4('La cadena es íntegra, pero hay avisos', 'Chain is intact, with warnings', 'Katea zuzena da, baina abisuak daude', 'A cadea é correcta, pero hai avisos'),
  Correcta: t4('Correcta', 'Verified', 'Zuzena', 'Correcta'),
  'La cadena és correcta': t4('La cadena es íntegra', 'Chain is intact', 'Katea zuzena da', 'A cadea é correcta'),
  'Gestoria · Full trimestral de factures': t4(
    'Gestoría · Hoja trimestral de facturas',
    'Bookkeeping · Quarterly invoice sheet',
    'Gestoria · Hiruhileko faktura-orria',
    'Xestoría · Folla trimestral de facturas'
  ),
  'Gestoria · Creuament amb el correu': t4(
    'Gestoría · Cruce con el correo',
    'Bookkeeping · Email cross-check',
    'Gestoria · Postarekin gurutzatzea',
    'Xestoría · Cruzamento co correo'
  ),
  'Estimació per a revisar amb la gestoria: no és cap declaració.': t4(
    'Estimación para revisar con la gestoría: no es ninguna declaración.',
    'Estimate for review with your tax advisor: not an official filing.',
    'Gestoriarekin berrikusteko estimazioa: ez da inongo aitorpena.',
    'Estimación para revisar coa xestoría: non é ningunha declaración.'
  ),
  'La suma dels saldos en euros dels teus comptes, l’últim dia dels extractes que tries.': t4(
    'La suma de los saldos en euros de tus cuentas en el último día de los extractos que elijas.',
    'Sum of euro balances across your accounts on the closing date of the selected statements.',
    'Zure kontuen eurotako saldoen batura, aukeratutako laburpenen azken egunean.',
    'A suma dos saldos en euros das túas contas no último día dos extractos que escollas.'
  ),
  'El que caldria pagar este trimestre per l’IVA (303) i pel pagament fraccionat de l’IRPF (130), cada model pel seu compte. Estimació per a revisar amb la gestoria: no és cap declaració.': t4(
    'Lo que habría que pagar este trimestre por el IVA (303) y el pago fraccionado del IRPF (130), cada modelo por separado. Estimación para revisar con la gestoría: no es ninguna declaración.',
    'Estimated payable amount this quarter for VAT (Form 303) and IRPF prepayment (Form 130), computed separately. Estimate for review with your advisor: not a filing.',
    'Hiruhileko honetan BEZagatik (303) eta PFEZaren zatikako ordainketagatik (130) ordaindu beharrekoa, eredu bakoitza bere aldetik. Gestoriarekin berrikusteko estimazioa: ez da aitorpena.',
    'O que cumpría pagar este trimestre polo IVE (303) e polo pagamento fraccionado do IRPF (130), cada modelo pola súa conta. Estimación para revisar coa xestoría: non é ningunha declaración.'
  ),
  'La caixa real dividida per la despesa mitjana de cada mes dels últims mesos dels extractes (com a molt, sis).': t4(
    'La caja real dividida por el gasto medio mensual de los últimos meses de los extractos (como máximo, seis).',
    'Real cash divided by average monthly outflows across recent statement months (up to six).',
    'Kutxa erreala laburpenetako azken hilabeteetako hileko batez besteko gastuarekin zatituta (gehienez sei).',
    'A caixa real dividida polo gasto medio mensual dos últimos meses dos extractos (como moito, seis).'
  ),
  'Les factures emeses dels últims 30 dies': t4(
    'Las facturas emitidas de los últimos 30 días',
    'Issued invoices over the last 30 days',
    'Azken 30 egunetan jaulkitako fakturak',
    'As facturas emitidas dos últimos 30 días'
  ),
  'Encara no hi ha cap factura al Tauler: analitza un trimestre al Full trimestral i les seues factures arribaran ací.': t4(
    'Todavía no hay ninguna factura en el Tablero: analiza un trimestre en la Hoja trimestral y sus facturas llegarán aquí.',
    'No invoices loaded in the Dashboard yet: analyse a quarter in the Quarterly Sheet to bring them here.',
    'Oraindik ez dago fakturarik Arbelan: aztertu hiruhileko bat Hiruhileko orrian eta fakturak hona iritsiko dira.',
    'Aínda non hai ningunha factura no Taboleiro: analiza un trimestre na Folla trimestral e as súas facturas chegarán aquí.'
  ),
  'Vendes recents': t4('Ventas recientes', 'Recent sales', 'Azken salmentak', 'Vendas recentes'),
  'Compres recents': t4('Compras recientes', 'Recent purchases', 'Azken erosketak', 'Compras recentes'),
  'Benefici net': t4('Beneficio neto', 'Net margin', 'Mozkin garbia', 'Beneficio neto'),
  'Moviments del banc sense factura': t4('Movimientos bancarios sin factura', 'Unmatched bank transactions', 'Fakturarik gabeko banku-mugimenduak', 'Movementos do banco sen factura'),
  'Encara no hi ha factures al Tauler: tots els moviments del banc estan per conciliar.': t4(
    'Todavía no hay facturas en el Tablero: todos los movimientos bancarios están por conciliar.',
    'No invoices loaded in the Dashboard yet: all bank transactions remain unmatched.',
    'Oraindik ez dago fakturarik Arbelan: bankuko mugimendu guztiak bateratzeko daude.',
    'Aínda non hai facturas no Taboleiro: todos os movementos do banco están por conciliar.'
  ),
  'Els moviments del banc que encara no tenen la seua factura. La seua pàgina diu també les factures sense pagament.': t4(
    'Los movimientos bancarios que aún no tienen su factura. Su página muestra también las facturas sin cobro o pago.',
    'Bank transactions not yet matched to an invoice. Its detail page also lists unpaid invoices.',
    'Oraindik fakturarik ez duten banku-mugimenduak. Bere orriak ordainketarik gabeko fakturak ere erakusten ditu.',
    'Os movementos do banco que aínda non teñen a súa factura. A súa páxina indica tamén as facturas sen pagamento.'
  ),
  'Sense factures': t4('Sin facturas', 'No invoices', 'Fakturarik gabe', 'Sen facturas'),
  'IVA · model 303': t4('IVA · modelo 303', 'VAT · Form 303', 'BEZa · 303 eredua', 'IVE · modelo 303'),
  'IRPF · model 130': t4('IRPF · modelo 130', 'IRPF · Form 130', 'PFEZa · 130 eredua', 'IRPF · modelo 130'),
  'Estimació del trimestre': t4('Estimación del trimestre', 'Quarterly estimate', 'Hiruhilekoaren estimazioa', 'Estimación do trimestre'),
  'L’IVA de les factures emeses menys l’IVA deduïble de les rebudes del trimestre. Estimació per a revisar amb la gestoria: no és cap declaració.': t4(
    'El IVA de las facturas emitidas menos el IVA deducible de las recibidas del trimestre. Estimación para revisar con la gestoría: no es ninguna declaración.',
    'Output VAT on issued invoices minus deductible input VAT on received invoices for the quarter. Estimate for review with your advisor: not a filing.',
    'Hiruhilekoan jaulkitako fakturen BEZa ken jasotakoen BEZ kengarria. Gestoriarekin berrikusteko estimazioa: ez da aitorpena.',
    'O IVE das facturas emitidas menos o IVE deducible das recibidas do trimestre. Estimación para revisar coa xestoría: non é ningunha declaración.'
  ),
  'El 20 % del rendiment de l’any fins al final del trimestre, menys les retencions i els pagaments anteriors. Estimació per a revisar amb la gestoria: no és cap declaració.': t4(
    'El 20 % del rendimiento del año hasta el cierre del trimestre, menos retenciones y pagos anteriores. Estimación para revisar con la gestoría: no es ninguna declaración.',
    '20 % of year-to-date net profit through quarter-end, minus withholdings and prior prepayments. Estimate for review with your advisor: not a filing.',
    'Hiruhilekoaren amaiera arteko urteko etekinaren % 20, atxikipenak eta aurreko ordainketak kenduta. Gestoriarekin berrikusteko estimazioa: ez da aitorpena.',
    'O 20 % do rendemento do ano ata o final do trimestre, menos as retencións e os pagamentos anteriores. Estimación para revisar coa xestoría: non é ningunha declaración.'
  ),
  'Sense factures de l’any al Tauler: no hi ha cap estimació.': t4(
    'Sin facturas del año en el Tablero: no hay estimación.',
    'No year-to-date invoices in the Dashboard: no estimate available.',
    'Urteko fakturarik ez Arbelan: ez dago estimaziorik.',
    'Sen facturas do ano no Taboleiro: non hai estimación.'
  ),
  'Sense caixa real en euros: la comparació necessita el saldo en euros dels extractes del banc.': t4(
    'Sin caja real en euros: la comparación necesita el saldo en euros de los extractos bancarios.',
    'No euro cash balance loaded: this comparison requires euro bank statement balances.',
    'Eurotako kutxa errealik gabe: alderaketak bankuko laburpenen eurotako saldoa behar du.',
    'Sen caixa real en euros: a comparación precisa o saldo en euros dos extractos do banco.'
  ),
  'Sense estimació de Hisenda per a este trimestre: les factures arriben del Full trimestral.': t4(
    'Sin estimación de Hacienda para este trimestre: las facturas llegan desde la Hoja trimestral.',
    'No tax estimate for this quarter yet: invoices come from the Quarterly Sheet.',
    'Hiruhileko honetarako Ogasunaren estimaziorik gabe: fakturak Hiruhileko orritik datoz.',
    'Sen estimación de Facenda para este trimestre: as facturas chegan da Folla trimestral.'
  ),
  'El termini del trimestre': t4('El plazo del trimestre', 'Quarter deadline', 'Hiruhilekoaren epea', 'O prazo do trimestre'),
  'Sense dia d’avui no es pot dir on és el trimestre.': t4(
    'Sin la fecha de hoy no se puede situar el trimestre.',
    'Cannot place the quarter without today’s date.',
    'Gaurko egunik gabe ezin da hiruhilekoa kokatu.',
    'Sen o día de hoxe non se pode situar o trimestre.'
  ),
  'Encara no hi ha cap extracte amb data: les xifres del banc no tenen dia de referència.': t4(
    'Todavía no hay ningún extracto con fecha: las cifras bancarias no tienen día de referencia.',
    'No dated bank statements loaded yet: bank figures have no reference date.',
    'Oraindik ez dago datadun laburpenik: bankuko zifrek ez dute erreferentzia-egunik.',
    'Aínda non hai ningún extracto con data: as cifras do banco non teñen día de referencia.'
  ),
  'La suma dels saldos en euros l’últim dia dels extractes.': t4(
    'La suma de los saldos en euros el último día de los extractos.',
    'Sum of euro account balances on the closing date of statements.',
    'Laburpenen azken eguneko eurotako saldoen batura.',
    'A suma dos saldos en euros o último día dos extractos.'
  ),
  'Despesa mensual mitjana': t4('Gasto mensual medio', 'Average monthly outflow', 'Hileko batez besteko gastua', 'Gasto mensual medio'),
  'Les eixides dels comptes en euros, de mitjana per mes (com a molt, sis mesos).': t4(
    'Las salidas de las cuentas en euros, de media mensual (como máximo, seis meses).',
    'Monthly average outflows across euro accounts (up to six months).',
    'Eurotako kontuen irteerak, hileko batez bestekoa (gehienez sei hilabete).',
    'As saídas das contas en euros, de media por mes (como moito, seis meses).'
  ),
  'Dies de cobertura': t4('Días de cobertura', 'Days of runway', 'Estaldura-egunak', 'Días de cobertura'),
  'Els dies que la caixa real paga la despesa mitjana, sense cap entrada.': t4(
    'Los días que la caja real cubre el gasto medio sin nuevas entradas.',
    'Days that real cash covers average outflows with zero new inflows.',
    'Kutxa errealak sarrerarik gabe batez besteko gastua ordaintzen duen egunak.',
    'Os días que a caixa real paga o gasto medio, sen ningunha entrada.'
  ),
  'L’IVA repercutit menys el deduïble del trimestre.': t4(
    'El IVA repercutido menos el deducible del trimestre.',
    'Quarterly output VAT minus deductible input VAT.',
    'Hiruhilekoan jasanarazitako BEZa ken kengarria.',
    'O IVE repercutido menos o deducible do trimestre.'
  ),
  'El pagament fraccionat del trimestre.': t4('El pago fraccionado del trimestre.', 'Quarterly income tax prepayment.', 'Hiruhilekoko zatikako ordainketa.', 'O pagamento fraccionado do trimestre.'),
  'Hisenda a pagar': t4('Hacienda a pagar', 'Payable taxes', 'Ordaintzeko Ogasuna', 'Facenda a pagar'),
  'El que surt a pagar del 303 i del 130, cada model pel seu compte: un 303 a compensar no hi resta.': t4(
    'Lo que sale a pagar del 303 y del 130 por separado: un 303 a compensar no resta.',
    'Combined payable amounts of Forms 303 and 130 separately: a negative Form 303 does not offset Form 130.',
    '303 eta 130 ereduetan ordaintzeko ateratzen dena, bakoitza bere aldetik: konpentsatzeko 303 batek ez du kentzen.',
    'O que sae a pagar do 303 e do 130, cada modelo pola súa conta: un 303 a compensar non resta.'
  ),
  'Liquiditat davant de Hisenda': t4('Liquidez frente a Hacienda', 'Cash-to-tax coverage', 'Likidezia Ogasunaren aurrean', 'Liquidez fronte a Facenda'),
  'Quantes vegades la caixa real cobrix el que surt a pagar a Hisenda.': t4(
    'Cuántas veces la caja real cubre lo que sale a pagar a Hacienda.',
    'How many times real cash covers estimated payable taxes.',
    'Zenbat aldiz estaltzen duen kutxa errealak Ogasunari ordaindu beharrekoa.',
    'Cantas veces a caixa real cobre o que sae a pagar a Facenda.'
  ),
  'Dies de cobertura després de Hisenda': t4('Días de cobertura tras Hacienda', 'Runway days after taxes', 'Estaldura-egunak Ogasunaren ondoren', 'Días de cobertura despois de Facenda'),
  'Els dies que la caixa real paga la despesa mitjana un colp pagat el que surt a Hisenda.': t4(
    'Los días que la caja real cubre el gasto medio tras descontar Hacienda.',
    'Days of average outflows covered by cash after deducting estimated payable taxes.',
    'Ogasuna ordaindu ondoren kutxa errealak batez besteko gastua estaltzen duen egunak.',
    'Os días que a caixa real paga o gasto medio unha vez pagado o que sae a Facenda.'
  ),
  'La caixa davant de Hisenda és l’única ràtio de liquiditat que es pot calcular ací: sense balanç, ni la ràtio corrent ni la prova àcida.': t4(
    'La caja frente a Hacienda es la única ratio de liquidez calculable aquí: sin balance no hay ratio corriente ni prueba ácida.',
    'Cash against taxes is the only liquidity ratio computable here: without a full balance sheet there is no current or quick ratio.',
    'Ogasunaren aurreko kutxa da hemen kalkula daitekeen likidezia-ratio bakarra: balantzerik gabe ez dago ratio korronterik.',
    'A caixa fronte a Facenda é a única ratio de liquidez que se pode calcular aquí: sen balance, nin a ratio corrente nin a proba ácida.'
  ),
  'Les entrades i les eixides dels comptes en euros de cada mes de calendari, com a molt dels 12 últims fins a l’últim dia dels extractes i des del primer mes que tenen. Els traspassos entre els teus comptes compten com a entrada en un i com a eixida en l’altre.': t4(
    'Las entradas y salidas de las cuentas en euros por mes natural, hasta los 12 últimos desde el primer mes con extractos. Los traspasos entre tus cuentas cuentan como entrada en una y salida en la otra.',
    'Monthly inflows and outflows across euro accounts for up to the last 12 calendar months. Internal transfers count as inflow in one account and outflow in the other.',
    'Eurotako kontuen sarrerak eta irteerak hilabete naturaleko, gehienez azken 12etan. Kontuen arteko eskualdaketak sarrera dira batean eta irteera bestean.',
    'As entradas e saídas das contas en euros de cada mes natural, como moito dos 12 últimos ata o último día dos extractos. Os traspasos entre contas contan como entrada nunha e saída na outra.'
  ),
  'El saldo de tots els comptes en euros': t4('El saldo de todas las cuentas en euros', 'Combined euro account balances', 'Eurotako kontu guztien saldoa', 'O saldo de todas as contas en euros'),
  'El que ix cada mes, de mitjana': t4('Lo que sale cada mes, de media', 'Average monthly outflows', 'Hilero irteten dena, batez beste', 'O que sae cada mes, de media'),
  'Consum net mensual': t4('Consumo neto mensual', 'Monthly net burn', 'Hileko kontsumo garbia', 'Consumo neto mensual'),
  'El que gasta la caixa cada mes': t4('Lo que consume la caja cada mes', 'Monthly net cash consumption', 'Kutxak hilero gastatzen duena', 'O que gasta a caixa cada mes'),
  'Autonomia de caixa': t4('Autonomía de caja', 'Cash runway', 'Kutxaren autonomia', 'Autonomía de caixa'),
  'Els mesos que aguanta la caixa sense ingressos nous': t4('Los meses que aguanta la caja sin nuevos ingresos', 'Months cash lasts without new revenue', 'Diru-sarrera berririk gabe kutxak irauten duen hilabeteak', 'Os meses que aguanta a caixa sen ingresos novos'),
  'La caixa real dividida pel consum net mensual: el que els anglesos diuen «runway».': t4(
    'La caja real dividida por el consumo neto mensual (runway).',
    'Real cash divided by monthly net burn (cash runway).',
    'Kutxa erreala hileko kontsumo garbiarekin zatituta (runway).',
    'A caixa real dividida polo consumo neto mensual (runway).'
  ),
  'Pes de l’IA (% de la despesa)': t4('Peso de la IA (% del gasto)', 'AI share (% of outflows)', 'AAren pisua (gastuaren %)', 'Peso da IA (% do gasto)'),
  'La part de les eixides que va a la intel·ligència artificial': t4('La parte de las salidas destinada a inteligencia artificial', 'Share of outflows spent on artificial intelligence', 'Adimen artifizialera bideratutako irteeren zatia', 'A parte das saídas destinada á intelixencia artificial'),
  'La despesa neta en IA (eixides menys devolucions) sobre totes les eixides del període, sense traspassos, en percentatge arredonit.': t4(
    'El gasto neto en IA (salidas menos devoluciones) sobre el total de salidas del período sin traspasos, redondeado.',
    'Net AI spend (outflows minus refunds) as a rounded percentage of total outflows excluding transfers.',
    'AAko gastu garbia (irteerak ken itzulketak) aldiko irteera guztien gainean eskualdaketarik gabe, ehuneko biribilduan.',
    'O gasto neto en IA (saídas menos devolucións) sobre todas as saídas do período sen traspasos, en porcentaxe redondeada.'
  ),
  'Provisió d’impostos': t4('Provisión de impuestos', 'Tax provision', 'Zerga-hornidura', 'Provisión de impostos'),
  'Sense extractes del trimestre: no hi ha cap estimació.': t4(
    'Sin extractos del trimestre: no hay estimación.',
    'No statements for the quarter: no estimate available.',
    'Hiruhilekoko laburpenik gabe: ez dago estimaziorik.',
    'Sen extractos do trimestre: non hai estimación.'
  ),
  Estimació: t4('Estimación', 'Estimate', 'Estimazioa', 'Estimación'),
  'Este navegador no deixa desar el llibre de factures (IndexedDB): ací no es pot emetre cap factura.': t4(
    'Este navegador no permite guardar el libro de facturas (IndexedDB): aquí no se puede emitir ninguna factura.',
    'This browser does not allow saving the invoice ledger (IndexedDB): invoices cannot be issued here.',
    'Nabigatzaile honek ez du faktura-liburua gordetzen uzten (IndexedDB): hemen ezin da fakturarik jaulki.',
    'Este navegador non deixa gardar o libro de facturas (IndexedDB): aquí non se pode emitir ningunha factura.'
  ),
  'Este navegador no deixa calcular l’empremta de les factures. Obri la Gestoria amb https o des d’este mateix ordinador (localhost).': t4(
    'Este navegador no permite calcular la huella de las facturas. Abre la Gestoría con https o desde este mismo ordenador (localhost).',
    'This browser cannot compute invoice hashes. Open Bookkeeping over https or from localhost on this computer.',
    'Nabigatzaile honek ezin du fakturen aztarna kalkulatu. Ireki Gestoria https bidez edo ordenagailu honetan bertan (localhost).',
    'Este navegador non deixa calcular a pegada das facturas. Abre a Xestoría con https ou desde este mesmo ordenador (localhost).'
  ),
  'Les anul·lades no sumen.': t4('Las anuladas no suman.', 'Voided invoices are excluded.', 'Baliogabetuek ez dute batzen.', 'As anuladas non suman.'),
  'Les que en substituïxen d’altres sumen la diferència.': t4(
    'Las que sustituyen a otras suman la diferencia.',
    'Replacement invoices add only the net difference.',
    'Beste batzuk ordezkatzen dituztenek aldea batzen dute.',
    'As que substitúen outras suman a diferenza.'
  ),
  'Anul·la només una factura que no s’havia d’haver emés. Si el que cal és corregir-la, fes una rectificativa. La factura i el seu número es queden al llibre.': t4(
    'Anula solo una factura que no debía haberse emitido. Si lo que hace falta es corregirla, emite una rectificativa. La factura y su número permanecen en el libro.',
    'Void only an invoice that should never have been issued. To amend an error, issue a credit/corrective invoice instead. Both the invoice and its number stay recorded.',
    'Inoiz jaulki behar ez zen faktura bat soilik baliogabetu. Zuzendu behar bada, egin faktura zuzentzaile bat. Faktura eta bere zenbakia liburuan geratzen dira.',
    'Anula só unha factura que non se debía emitir. Se o que cómpre é corrixila, fai unha rectificativa. A factura e o seu número quedan no libro.'
  ),
  'Sí, anul·la-la': t4('Sí, anularla', 'Yes, void it', 'Bai, baliogabetu', 'Si, anulala'),
  'Per què l’anul·les? (opcional)': t4('¿Por qué la anulas? (opcional)', 'Reason for voiding (optional)', 'Zergatik baliogabetzen duzu? (aukerakoa)', 'Por que a anulas? (opcional)'),
  'Queda al llibre, per a qui el revise.': t4('Queda en el libro, para quien lo revise.', 'Saved in the ledger for audit review.', 'Liburuan geratzen da, berrikusiko duenarentzat.', 'Queda no libro, para quen o revise.'),
  'El CSV ix sense contrasenya: porta els noms, els NIF i els imports de totes les factures del període, perquè el pugues obrir o passar a la gestoria. Desa’l només en un lloc segur.': t4(
    'El CSV sale sin contraseña: incluye nombres, NIF e importes de todas las facturas del período para abrirlo o entregarlo a la gestoría. Guárdalo solo en un lugar seguro.',
    'The CSV is exported unencrypted: it contains names, Tax IDs and amounts for every invoice in the period so your advisor can open it. Store it securely.',
    'CSVa pasahitzik gabe ateratzen da: aldiko faktura guztien izenak, IFZak eta zenbatekoak daramatza gestoriari emateko. Gorde leku seguru batean bakarrik.',
    'O CSV sae sen contrasinal: leva os nomes, os NIF e os importes de todas as facturas do período para abrilo ou pasalo á xestoría. Gárdao só nun lugar seguro.'
  )
};

const TOTES_LES_CADENES = Object.freeze({
  ...CADENES_GESTORIA,
  ...CADENES_NUCLI_EXTRA
});

/**
 * Traduïx una cadena fixa o procedent dels nuclis purs a la llengua activa.
 * En valencià ('ca') retorna l'entrada tal qual sense cap transformació.
 */
export function tg(idioma, text) {
  const llengua = codiIdiomaGestoria(idioma);
  if (llengua === 'ca' || typeof text !== 'string' || !text) return text;
  const directa = TOTES_LES_CADENES[text]?.[llengua];
  if (directa) return directa;
  if (text.startsWith('Més opcions: ')) {
    const detall = text.slice('Més opcions: '.length).split(', ').map((p) => tg(llengua, p)).join(', ');
    return `${tg(llengua, 'Més opcions')}: ${detall}`;
  }
  const mReg = /^Els (\d+) registres del llibre s’han tornat a calcular: cada un va darrere de l’anterior i ningú no l’ha tocat\.$/.exec(text);
  if (mReg) {
    const n = mReg[1];
    return {
      es: `Los ${n} registros del libro se han recalculado: cada uno enlaza con el anterior y ninguno ha sido alterado.`,
      en: `All ${n} ledger records were re-hashed: every link matches the previous one without tampering.`,
      eu: `Liburuko ${n} erregistroak birkalkulatu dira: bakoitza aurrekoari lotuta dago eta inork ez ditu ukitu.`,
      gl: `Os ${n} rexistros do libro volvéronse calcular: cada un vai detrás do anterior e ninguén os tocou.`
    }[llengua];
  }
  const mCompte = /^Compte (\d+)$/.exec(text);
  if (mCompte) {
    const n = mCompte[1];
    return { es: `Cuenta ${n}`, en: `Account ${n}`, eu: `${n}. kontua`, gl: `Conta ${n}` }[llengua];
  }
  const mModels = /^Models 303 i 130 · (.+)$/.exec(text);
  if (mModels) {
    const p = mModels[1] === 'el trimestre'
      ? { es: 'el trimestre', en: 'the quarter', eu: 'hiruhilekoa', gl: 'o trimestre' }[llengua]
      : mModels[1];
    return {
      es: `Modelos 303 y 130 · ${p}`,
      en: `Forms 303 & 130 · ${p}`,
      eu: `303 eta 130 ereduak · ${p}`,
      gl: `Modelos 303 e 130 · ${p}`
    }[llengua];
  }
  const m303130 = /^303 i 130 · (.+)$/.exec(text);
  if (m303130) {
    return {
      es: `303 y 130 · ${m303130[1]}`,
      en: `Forms 303 & 130 · ${m303130[1]}`,
      eu: `303 eta 130 · ${m303130[1]}`,
      gl: `303 e 130 · ${m303130[1]}`
    }[llengua];
  }
  const mEstTrim = /^Estimació del (\S+ \S+)$/.exec(text);
  if (mEstTrim) {
    return {
      es: `Estimación del ${mEstTrim[1]}`,
      en: `Estimate for ${mEstTrim[1]}`,
      eu: `${mEstTrim[1]} estimazioa`,
      gl: `Estimación do ${mEstTrim[1]}`
    }[llengua];
  }
  const mTermini = /^Termini (\S+)$/.exec(text);
  if (mTermini) {
    return {
      es: `Plazo ${mTermini[1]}`,
      en: `Due ${mTermini[1]}`,
      eu: `Epea ${mTermini[1]}`,
      gl: `Prazo ${mTermini[1]}`
    }[llengua];
  }
  const mDiaTrim = /^El (\d+T \d+): dia (\d+) de (\d+)$/.exec(text);
  if (mDiaTrim) {
    const [, q, v, m] = mDiaTrim;
    return { es: `El ${q}: día ${v} de ${m}`, en: `${q}: day ${v} of ${m}`, eu: `${q}: ${m}tik ${v}. eguna`, gl: `O ${q}: día ${v} de ${m}` }[llengua];
  }
  const mPresDia = /^Presentació del (\d+T \d+): dia (\d+) de (\d+)$/.exec(text);
  if (mPresDia) {
    const [, q, v, m] = mPresDia;
    return {
      es: `Presentación del ${q}: día ${v} de ${m}`,
      en: `Filing window for ${q}: day ${v} of ${m}`,
      eu: `${q} aurkezpena: ${m}tik ${v}. eguna`,
      gl: `Presentación do ${q}: día ${v} de ${m}`
    }[llengua];
  }
  const mElTrim = /^El (\d+T \d+)$/.exec(text);
  if (mElTrim) {
    return { es: `El ${mElTrim[1]}`, en: mElTrim[1], eu: mElTrim[1], gl: `O ${mElTrim[1]}` }[llengua];
  }
  const mPresRang = /^La presentació del 303 i del 130 va del (\S+) al (\S+)\.$/.exec(text);
  if (mPresRang) {
    const [, d1, d2] = mPresRang;
    return {
      es: `La presentación del 303 y del 130 va del ${d1} al ${d2}.`,
      en: `Filing for Forms 303 and 130 runs from ${d1} to ${d2}.`,
      eu: `303 eta 130 ereduen aurkezpena ${d1}(e)tik ${d2}(e)ra doa.`,
      gl: `A presentación do 303 e do 130 vai do ${d1} ao ${d2}.`
    }[llengua];
  }
  const mPresVa = /^La presentació va del (\S+) al (\S+)\.$/.exec(text);
  if (mPresVa) {
    const [, d1, d2] = mPresVa;
    return {
      es: `La presentación va del ${d1} al ${d2}.`,
      en: `Filing runs from ${d1} to ${d2}.`,
      eu: `Aurkezpena ${d1}(e)tik ${d2}(e)ra doa.`,
      gl: `A presentación vai do ${d1} ao ${d2}.`
    }[llengua];
  }
  const mPresVenc = /^La presentació va acabar el (\S+)\.$/.exec(text);
  if (mPresVenc) {
    const d = mPresVenc[1];
    return { es: `La presentación acabó el ${d}.`, en: `Filing closed on ${d}.`, eu: `Aurkezpena ${d}(e)an amaitu zen.`, gl: `A presentación rematou o ${d}.` }[llengua];
  }
  const mTermVenc = /^El termini de presentació del (\d+T \d+) va acabar el (\S+)\.$/.exec(text);
  if (mTermVenc) {
    const [, q, d] = mTermVenc;
    return {
      es: `El plazo de presentación del ${q} acabó el ${d}.`,
      en: `The filing deadline for ${q} closed on ${d}.`,
      eu: `${q} aurkezteko epea ${d}(e)an amaitu zen.`,
      gl: `O prazo de presentación do ${q} rematou o ${d}.`
    }[llengua];
  }
  const mAraTerm = /^Ara és el termini de presentació del 303 i del 130, que acaba (?:hui, el (\S+)|el (\S+): (?:queda un dia|queden (\d+) dies))\.$/.exec(text);
  if (mAraTerm) {
    const [, huiD, fiD, nDies] = mAraTerm;
    if (huiD) {
      return {
        es: `Hoy acaba el plazo de presentación del 303 y del 130 (${huiD}).`,
        en: `Filing window for Forms 303 and 130 closes today, ${huiD}.`,
        eu: `Gaur amaitzen da 303 eta 130 ereduak aurkezteko epea (${huiD}).`,
        gl: `Hoxe remata o prazo de presentación do 303 e do 130 (${huiD}).`
      }[llengua];
    }
    const n = nDies ?? '1';
    return {
      es: `Plazo abierto del 303 y del 130, hasta el ${fiD} (${n === '1' ? 'queda 1 día' : `quedan ${n} días`}).`,
      en: `Filing open for Forms 303 and 130 until ${fiD} (${n === '1' ? '1 day left' : `${n} days left`}).`,
      eu: `303 eta 130 aurkezteko epea zabalik ${fiD} arte (${n === '1' ? 'egun 1 falta da' : `${n} egun falta dira`}).`,
      gl: `Prazo aberto do 303 e do 130 ata o ${fiD} (${n === '1' ? 'queda 1 día' : `quedan ${n} días`}).`
    }[llengua];
  }
  const mPresComp = /^La presentació acaba (?:hui, el (\S+)|el (\S+): (?:queda un dia|queden (\d+) dies))\.$/.exec(text);
  if (mPresComp) {
    const [, huiD, fiD, nDies] = mPresComp;
    if (huiD) {
      return {
        es: `La presentación acaba hoy, el ${huiD}.`,
        en: `Filing closes today, ${huiD}.`,
        eu: `Aurkezpena gaur amaitzen da, ${huiD}(e)an.`,
        gl: `A presentación remata hoxe, o ${huiD}.`
      }[llengua];
    }
    const n = nDies ?? '1';
    return {
      es: `La presentación acaba el ${fiD}: ${n === '1' ? 'queda un día' : `quedan ${n} días`}.`,
      en: `Filing closes on ${fiD}: ${n === '1' ? '1 day left' : `${n} days left`}.`,
      eu: `Aurkezpena ${fiD}(e)an amaitzen da: ${n === '1' ? 'egun bat falta da' : `${n} egun falta dira`}.`,
      gl: `A presentación remata o ${fiD}: ${n === '1' ? 'queda un día' : `quedan ${n} días`}.`
    }[llengua];
  }
  const mFin30 = 'dels 30 dies que acaben l’últim dia dels extractes';
  if (text.includes(mFin30)) {
    if (text.startsWith('Quantes factures has emés ')) {
      return {
        es: 'Cuántas facturas has emitido en los 30 días previos al cierre de los extractos. Su página indica la base imponible.',
        en: 'How many invoices you issued in the 30 days ending on your latest statement date. Its page shows the taxable base.',
        eu: 'Zenbat faktura jaulki dituzun laburpenen azken eguneko aurreko 30 egunetan. Bere orriak zerga-oinarria erakusten du.',
        gl: 'Cantas facturas emitiches nos 30 días que rematan o último día dos extractos. A súa páxina indica a base impoñible.'
      }[llengua];
    }
    if (text.startsWith('El que ha entrat menys el que ha eixit ')) {
      return {
        es: 'Lo que ha entrado menos lo que ha salido en tus cuentas en euros en los últimos 30 días de los extractos (IVA incluido).',
        en: 'Inflows minus outflows across your euro accounts over the last 30 statement days (VAT included).',
        eu: 'Laburpenetako azken 30 egunetan eurotako kontuetan sartutakoa ken irtendakoa (BEZ barne).',
        gl: 'O que entrou menos o que saíu nas túas contas en euros nos últimos 30 días dos extractos (IVE incluído).'
      }[llengua];
    }
    if (text.startsWith('El que ha entrat ')) {
      return {
        es: 'Lo que ha entrado en tus cuentas en euros en los últimos 30 días de los extractos (IVA incluido).',
        en: 'Inflows into your euro accounts over the last 30 statement days (VAT included).',
        eu: 'Laburpenetako azken 30 egunetan eurotako kontuetan sartutakoa (BEZ barne).',
        gl: 'O que entrou nas túas contas en euros nos últimos 30 días dos extractos (IVE incluído).'
      }[llengua];
    }
    if (text.startsWith('El que ha eixit ')) {
      return {
        es: 'Lo que ha salido de tus cuentas en euros en los últimos 30 días de los extractos (IVA incluido).',
        en: 'Outflows from your euro accounts over the last 30 statement days (VAT included).',
        eu: 'Laburpenetako azken 30 egunetan eurotako kontuetatik irtendakoa (BEZ barne).',
        gl: 'O que saíu das túas contas en euros nos últimos 30 días dos extractos (IVE incluído).'
      }[llengua];
    }
  }
  return text;
}

/* ── 4. Plantilles parametritzades per llengua ── */
export const PLANTILLES_GESTORIA = Object.freeze({
  ca: Object.freeze({
    salutacioTitular: (nom, salutacio) => `Hola, ${nom}! ${salutacio}`,
    dadesLlegides: (hora, data) => `Dades llegides a les ${hora} del ${data}`,
    mostraXifraDe: (titol) => `Mostra la xifra de ${titol}`,
    taulaBloc: (titol) => `Taula · ${titol}`,
    detallTargeta: (titol) => `El detall de ${titol}`,
    portaTauler: (estat, lloc) => `El Tauler llig els extractes del banc amb el tractor «Gestoria · Tauler de l’empresa», que ${estat}. Aprova’l amb la teua signatura ${lloc}: sense, cap fitxer es llig i el Tauler no té xifres.`,
    portaHistoric: (estat, lloc) => `L’Històric llig els extractes del banc amb el tractor «Gestoria · Històric del banc i despesa en IA», que ${estat}. Aprova’l amb la teua signatura ${lloc}: sense, cap fitxer es llig i no hi ha cap xifra.`,
    portaEscaner: (estat, lloc) => `L’Escàner Local recorre la carpeta amb el tractor «Gestoria · Escàner Local de la carpeta», que ${estat}. Aprova’l amb la teua signatura ${lloc}: sense, no es llista ni es llig cap fitxer.`,
    portaIdentitat: (estat, lloc) => `La Fitxa d’identitat llig els teus papers amb el tractor «Gestoria · Fitxa d’identitat i Finestreta», que ${estat}. Aprova’l amb la teua signatura ${lloc}: sense, cap paper es llig.`,
    portaFactures: (nom, lloc) => `Abans de llegir cap factura, llig la fitxa de «${nom}» i aprova’n la versió exacta ${lloc}. Sense eixa aprovació no es pot continuar.`,
    notaCorreuOpcional: (nom) => `El creuament amb el correu és opcional. Per a fer-lo, aprova també «${nom}».`,
    analitzaTrimestre: (t, any) => `Analitza el ${t}T de ${any}`,
    leitnerIntro: (intervals) => `Repàs per caixes de Leitner: cada targeta viu en una caixa. Si la recordes, puja a la següent i tarda més a tornar; si no, torna a la caixa 0 i la repasses hui mateix. Intervals: ${intervals}.`,
    intervalCaixa: (caixa, dies) => `caixa ${caixa}: ${dies === 0 ? 'hui mateix' : dies === 1 ? '1 dia' : `${dies} dies`}`,
    pendentsHui: () => 'Pendents hui:',
    etiquetaCaixa: (caixa, max, nova) => `Caixa ${caixa} de ${max}${nova ? ' · nova' : ''}`,
    faseDe: (i, n) => `Fase ${i} de ${n}`,
    targetaAria: (titol) => `Targeta: ${titol}`,
    esQuedaCaixaAlta: (max) => `Es queda a la caixa ${max}, la més alta`,
    pujaCaixa: (caixa) => `Puja a la caixa ${caixa}`,
    tornaraEl: (dia) => `Tornarà a eixir el ${dia}.`,
    proximRepas: (dia) => `Pròxim repàs: ${dia}.`,
    tornaEl: (dia) => ` · torna el ${dia}`,
    dadesDesadesVersio: (v) => `Les dades desades (versió ${v})`,
    notaVersioPerfil: (v) => `Versió ${v} del perfil, desada en este ordinador. Les dades no ixen d’ací.`,
    liniaNum: (n) => `Línia ${n}`,
    llevaLinia: (n) => `Lleva la línia ${n}`,
    emetsFactura: (num) => (num ? `Emets la factura ${num}?` : 'Emets la factura?'),
    anullesFactura: (num) => (num ? `Anul·les la factura ${num}?` : 'Anul·les la factura?'),
    facturaTitol: (num) => `La factura ${num}`,
    abocaExtractes: (n) => (n === 1 ? 'Aboca 1 extracte al Tauler' : `Aboca ${n} extractes al Tauler`),
    periodeDe: (any) => `Període de ${any}`,
    verificadaALes: (hora) => `Verificada a les ${hora}.`,
    mostraFacturaAria: (num) => `Mostra la factura ${num}`,
    anullaFacturaAria: (num) => `Anul·la la factura ${num}`,
    mostraNFactures: (n) => `Mostra les ${n} factures`,
    descarregaLlibreCsv: (any, trim) => {
      const ord = { 1: '1r', 2: '2n', 3: '3r', 4: '4t' }[trim];
      const sufix = any === null ? '' : (ord ? ` del ${ord} trimestre de ${any}` : ` de ${any}`);
      return `Descarrega el llibre${sufix} (CSV)`;
    }
  }),
  es: Object.freeze({
    salutacioTitular: (nom, salutacio) => `¡Hola, ${nom}! ${salutacio}`,
    dadesLlegides: (hora, data) => `Datos leídos a las ${hora} del ${data}`,
    mostraXifraDe: (titol) => `Mostrar la cifra de ${titol}`,
    taulaBloc: (titol) => `Tabla · ${titol}`,
    detallTargeta: (titol) => `El detalle de ${titol}`,
    portaTauler: (estat, lloc) => `El Tablero lee los extractos bancarios con el tractor «Gestoría · Tablero de la empresa», que ${estat}. Apruébalo con tu firma ${lloc}: sin ella, no se lee ningún archivo ni hay cifras.`,
    portaHistoric: (estat, lloc) => `El Histórico lee los extractos bancarios con el tractor «Gestoría · Histórico bancario y gasto en IA», que ${estat}. Apruébalo con tu firma ${lloc}: sin ella, no se lee ningún archivo.`,
    portaEscaner: (estat, lloc) => `El Escáner Local recorre la carpeta con el tractor «Gestoría · Escáner Local de la carpeta», que ${estat}. Apruébalo con tu firma ${lloc}: sin ella, no se lista ni se lee ningún archivo.`,
    portaIdentitat: (estat, lloc) => `La Ficha de identidad lee tus documentos con el tractor «Gestoría · Ficha de identidad y Ventanilla», que ${estat}. Apruébalo con tu firma ${lloc}: sin ella, no se lee ningún documento.`,
    portaFactures: (nom, lloc) => `Antes de leer ninguna factura, lee la ficha de «${nom}» y aprueba su versión exacta ${lloc}. Sin esa aprobación no se puede continuar.`,
    notaCorreuOpcional: (nom) => `El cruce con el correo es opcional. Para hacerlo, aprueba también «${nom}».`,
    analitzaTrimestre: (t, any) => `Analizar el ${t}T de ${any}`,
    leitnerIntro: (intervals) => `Repaso por cajas de Leitner: cada tarjeta vive en una caja. Si la recuerdas, sube a la siguiente y tarda más en volver; si no, vuelve a la caja 0 y la repasas hoy mismo. Intervalos: ${intervals}.`,
    intervalCaixa: (caixa, dies) => `caja ${caixa}: ${dies === 0 ? 'hoy mismo' : dies === 1 ? '1 día' : `${dies} días`}`,
    pendentsHui: () => 'Pendientes hoy:',
    etiquetaCaixa: (caixa, max, nova) => `Caja ${caixa} de ${max}${nova ? ' · nueva' : ''}`,
    faseDe: (i, n) => `Fase ${i} de ${n}`,
    targetaAria: (titol) => `Tarjeta: ${titol}`,
    esQuedaCaixaAlta: (max) => `Se queda en la caja ${max}, la más alta`,
    pujaCaixa: (caixa) => `Sube a la caja ${caixa}`,
    tornaraEl: (dia) => `Volverá a salir el ${dia}.`,
    proximRepas: (dia) => `Próximo repaso: ${dia}.`,
    tornaEl: (dia) => ` · vuelve el ${dia}`,
    dadesDesadesVersio: (v) => `Los datos guardados (versión ${v})`,
    notaVersioPerfil: (v) => `Versión ${v} del perfil, guardada en este ordenador. Los datos no salen de aquí.`,
    liniaNum: (n) => `Línea ${n}`,
    llevaLinia: (n) => `Quitar la línea ${n}`,
    emetsFactura: (num) => (num ? `¿Emites la factura ${num}?` : '¿Emites la factura?'),
    anullesFactura: (num) => (num ? `¿Anulas la factura ${num}?` : '¿Anulas la factura?'),
    facturaTitol: (num) => `La factura ${num}`,
    abocaExtractes: (n) => (n === 1 ? 'Volcar 1 extracto al Tablero' : `Volcar ${n} extractos al Tablero`),
    periodeDe: (any) => `Período de ${any}`,
    verificadaALes: (hora) => `Verificada a las ${hora}.`,
    mostraFacturaAria: (num) => `Mostrar la factura ${num}`,
    anullaFacturaAria: (num) => `Anular la factura ${num}`,
    mostraNFactures: (n) => `Mostrar las ${n} facturas`,
    descarregaLlibreCsv: (any, trim) => {
      const ord = { 1: '1.º', 2: '2.º', 3: '3.º', 4: '4.º' }[trim];
      const sufix = any === null ? '' : (ord ? ` del ${ord} trimestre de ${any}` : ` de ${any}`);
      return `Descargar el libro${sufix} (CSV)`;
    }
  }),
  en: Object.freeze({
    salutacioTitular: (nom, salutacio) => `Hello, ${nom}! ${salutacio}`,
    dadesLlegides: (hora, data) => `Data read at ${hora} on ${data}`,
    mostraXifraDe: (titol) => `Show figure for ${titol}`,
    taulaBloc: (titol) => `Table · ${titol}`,
    detallTargeta: (titol) => `Breakdown of ${titol}`,
    portaTauler: (estat, lloc) => `The Dashboard reads bank statements using the tractor “Bookkeeping · Company Dashboard”, which ${estat}. Approve it with your signature ${lloc}: without it, no files are read.`,
    portaHistoric: (estat, lloc) => `History reads bank statements using the tractor “Bookkeeping · Bank History & AI Spend”, which ${estat}. Approve it with your signature ${lloc}: without it, no files are read.`,
    portaEscaner: (estat, lloc) => `Local Scanner inspects your folder using the tractor “Bookkeeping · Local Folder Scanner”, which ${estat}. Approve it with your signature ${lloc}: without it, no files are listed or read.`,
    portaIdentitat: (estat, lloc) => `Identity Profile reads your documents using the tractor “Bookkeeping · Identity & One-Stop Desk”, which ${estat}. Approve it with your signature ${lloc}: without it, no documents are read.`,
    portaFactures: (nom, lloc) => `Before reading any invoice, read the spec sheet for “${nom}” and approve its exact version ${lloc}. You cannot proceed without approval.`,
    notaCorreuOpcional: (nom) => `Email cross-checking is optional. To use it, also approve “${nom}”.`,
    analitzaTrimestre: (t, any) => `Analyse Q${t} ${any}`,
    leitnerIntro: (intervals) => `Leitner box spaced repetition: each card lives in a box. Recall it to promote it to a longer interval; miss it and it returns to box 0 for review today. Intervals: ${intervals}.`,
    intervalCaixa: (caixa, dies) => `box ${caixa}: ${dies === 0 ? 'today' : dies === 1 ? '1 day' : `${dies} days`}`,
    pendentsHui: () => 'Due today:',
    etiquetaCaixa: (caixa, max, nova) => `Box ${caixa} of ${max}${nova ? ' · new' : ''}`,
    faseDe: (i, n) => `Step ${i} of ${n}`,
    targetaAria: (titol) => `Card: ${titol}`,
    esQuedaCaixaAlta: (max) => `Stays in box ${max}, the highest`,
    pujaCaixa: (caixa) => `Moves up to box ${caixa}`,
    tornaraEl: (dia) => `Scheduled again on ${dia}.`,
    proximRepas: (dia) => `Next review: ${dia}.`,
    tornaEl: (dia) => ` · due ${dia}`,
    dadesDesadesVersio: (v) => `Saved company details (version ${v})`,
    notaVersioPerfil: (v) => `Profile version ${v}, saved on this computer. Never transmitted.`,
    liniaNum: (n) => `Line ${n}`,
    llevaLinia: (n) => `Remove line ${n}`,
    emetsFactura: (num) => (num ? `Issue invoice ${num}?` : 'Issue invoice?'),
    anullesFactura: (num) => (num ? `Void invoice ${num}?` : 'Void invoice?'),
    facturaTitol: (num) => `Invoice ${num}`,
    abocaExtractes: (n) => (n === 1 ? 'Load 1 statement into Dashboard' : `Load ${n} statements into Dashboard`),
    periodeDe: (any) => `Period ${any}`,
    verificadaALes: (hora) => `Verified at ${hora}.`,
    mostraFacturaAria: (num) => `Show invoice ${num}`,
    anullaFacturaAria: (num) => `Void invoice ${num}`,
    mostraNFactures: (n) => `Show all ${n} invoices`,
    descarregaLlibreCsv: (any, trim) => {
      const ord = { 1: 'Q1', 2: 'Q2', 3: 'Q3', 4: 'Q4' }[trim];
      const sufix = any === null ? '' : (ord ? ` for ${ord} ${any}` : ` for ${any}`);
      return `Download ledger${sufix} (CSV)`;
    }
  }),
  eu: Object.freeze({
    salutacioTitular: (nom, salutacio) => `Kaixo, ${nom}! ${salutacio}`,
    dadesLlegides: (hora, data) => `${data}(e)ko ${hora}(e)tan irakurritako datuak`,
    mostraXifraDe: (titol) => `Erakutsi ${titol} zifra`,
    taulaBloc: (titol) => `Taula · ${titol}`,
    detallTargeta: (titol) => `${titol} xehetasuna`,
    portaTauler: (estat, lloc) => `Arbelak «Gestoria · Enpresaren arbela» traktorearekin irakurtzen ditu laburpenak, eta traktore hori ${estat}. Onartu zure sinadurarekin ${lloc}: hori gabe, ez da fitxategirik irakurtzen.`,
    portaHistoric: (estat, lloc) => `Historikoak «Gestoria · Banku-historikoa eta AA gastua» traktorearekin irakurtzen ditu laburpenak, eta traktore hori ${estat}. Onartu zure sinadurarekin ${lloc}: hori gabe, ez da fitxategirik irakurtzen.`,
    portaEscaner: (estat, lloc) => `Tokiko Eskanerrak «Gestoria · Karpetaren tokiko eskanerra» traktorearekin aztertzen du karpeta, eta traktore hori ${estat}. Onartu zure sinadurarekin ${lloc}: hori gabe, ez da fitxategirik zerrendatzen ez irakurtzen.`,
    portaIdentitat: (estat, lloc) => `Nortasun Fitxak «Gestoria · Nortasun-fitxa eta Leihatila» traktorearekin irakurtzen ditu agiriak, eta traktore hori ${estat}. Onartu zure sinadurarekin ${lloc}: hori gabe, ez da agiririk irakurtzen.`,
    portaFactures: (nom, lloc) => `Fakturarik irakurri aurretik, irakurri «${nom}» fitxa eta onartu bertsio zehatza ${lloc}. Onespen hori gabe ezin da jarraitu.`,
    notaCorreuOpcional: (nom) => `Postarekin gurutzatzea aukerakoa da. Egiteko, onartu «${nom}» ere.`,
    analitzaTrimestre: (t, any) => `Aztertu ${any}ko ${t}H`,
    leitnerIntro: (intervals) => `Leitner kutxen bidezko errepikapena: txartel bakoitza kutxa batean bizi da. Gogoratzen baduzu, hurrengora igotzen da; bestela, 0. kutxara itzultzen da gaur berrikusteko. Tarteak: ${intervals}.`,
    intervalCaixa: (caixa, dies) => `${caixa}. kutxa: ${dies === 0 ? 'gaur bertan' : dies === 1 ? 'egun 1' : `${dies} egun`}`,
    pendentsHui: () => 'Gaurko zain:',
    etiquetaCaixa: (caixa, max, nova) => `${max}tik ${caixa}. kutxa${nova ? ' · berria' : ''}`,
    faseDe: (i, n) => `${n}tik ${i}. fasea`,
    targetaAria: (titol) => `Txartela: ${titol}`,
    esQuedaCaixaAlta: (max) => `${max}. kutxan geratzen da, altuenean`,
    pujaCaixa: (caixa) => `${caixa}. kutxara igotzen da`,
    tornaraEl: (dia) => `${dia}(e)an agertuko da berriro.`,
    proximRepas: (dia) => `Hurrengo errepikapena: ${dia}.`,
    tornaEl: (dia) => ` · ${dia}(e)an itzuliko da`,
    dadesDesadesVersio: (v) => `Gordetako datuak (${v}. bertsioa)`,
    notaVersioPerfil: (v) => `Profilaren ${v}. bertsioa, ordenagailu honetan gordeta. Datuak ez dira hemendik ateratzen.`,
    liniaNum: (n) => `${n}. lerroa`,
    llevaLinia: (n) => `Kendu ${n}. lerroa`,
    emetsFactura: (num) => (num ? `${num} faktura jaulki nahi duzu?` : 'Faktura jaulki nahi duzu?'),
    anullesFactura: (num) => (num ? `${num} faktura baliogabetu nahi duzu?` : 'Faktura baliogabetu nahi duzu?'),
    facturaTitol: (num) => `${num} faktura`,
    abocaExtractes: (n) => (n === 1 ? 'Irauli laburpen 1 Arbelera' : `Irauli ${n} laburpen Arbelera`),
    periodeDe: (any) => `${any}ko aldia`,
    verificadaALes: (hora) => `${hora}(e)tan egiaztatua.`,
    mostraFacturaAria: (num) => `Erakutsi ${num} faktura`,
    anullaFacturaAria: (num) => `Baliogabetu ${num} faktura`,
    mostraNFactures: (n) => `Erakutsi ${n} fakturak`,
    descarregaLlibreCsv: (any, trim) => {
      const ord = { 1: '1.', 2: '2.', 3: '3.', 4: '4.' }[trim];
      const sufix = any === null ? '' : (ord ? ` (${any}ko ${ord} hiruhilekoa)` : ` (${any})`);
      return `Deskargatu liburua${sufix} (CSV)`;
    }
  }),
  gl: Object.freeze({
    salutacioTitular: (nom, salutacio) => `Ola, ${nom}! ${salutacio}`,
    dadesLlegides: (hora, data) => `Datos lidos ás ${hora} do ${data}`,
    mostraXifraDe: (titol) => `Mostrar a cifra de ${titol}`,
    taulaBloc: (titol) => `Táboa · ${titol}`,
    detallTargeta: (titol) => `O detalle de ${titol}`,
    portaTauler: (estat, lloc) => `O Taboleiro le os extractos do banco co tractor «Xestoría · Taboleiro da empresa», que ${estat}. Apróbao coa túa sinatura ${lloc}: sen ela, ningún ficheiro se le nin hai cifras.`,
    portaHistoric: (estat, lloc) => `O Histórico le os extractos do banco co tractor «Xestoría · Histórico do banco e gasto en IA», que ${estat}. Apróbao coa túa sinatura ${lloc}: sen ela, ningún ficheiro se le.`,
    portaEscaner: (estat, lloc) => `O Escáner Local percorre a carpeta co tractor «Xestoría · Escáner Local da carpeta», que ${estat}. Apróbao coa túa sinatura ${lloc}: sen ela, non se lista nin se le ningún ficheiro.`,
    portaIdentitat: (estat, lloc) => `A Ficha de identidade le os teus papeis co tractor «Xestoría · Ficha de identidade e Xanela», que ${estat}. Apróbao coa túa sinatura ${lloc}: sen ela, ningún papel se le.`,
    portaFactures: (nom, lloc) => `Antes de ler ningunha factura, le a ficha de «${nom}» e aproba a súa versión exacta ${lloc}. Sen esa aprobación non se pode continuar.`,
    notaCorreuOpcional: (nom) => `O cruzamento co correo é opcional. Para facelo, aproba tamén «${nom}».`,
    analitzaTrimestre: (t, any) => `Analizar o ${t}T de ${any}`,
    leitnerIntro: (intervals) => `Repaso por caixas de Leitner: cada tarxeta vive nunha caixa. Se a lembras, sobe á seguinte e tarda máis en volver; se non, volve á caixa 0 e repásala hoxe mesmo. Intervalos: ${intervals}.`,
    intervalCaixa: (caixa, dies) => `caixa ${caixa}: ${dies === 0 ? 'hoxe mesmo' : dies === 1 ? '1 día' : `${dies} días`}`,
    pendentsHui: () => 'Pendentes hoxe:',
    etiquetaCaixa: (caixa, max, nova) => `Caixa ${caixa} de ${max}${nova ? ' · nova' : ''}`,
    faseDe: (i, n) => `Fase ${i} de ${n}`,
    targetaAria: (titol) => `Tarxeta: ${titol}`,
    esQuedaCaixaAlta: (max) => `Queda na caixa ${max}, a máis alta`,
    pujaCaixa: (caixa) => `Sobe á caixa ${caixa}`,
    tornaraEl: (dia) => `Volverá saír o ${dia}.`,
    proximRepas: (dia) => `Próximo repaso: ${dia}.`,
    tornaEl: (dia) => ` · volve o ${dia}`,
    dadesDesadesVersio: (v) => `Os datos gardados (versión ${v})`,
    notaVersioPerfil: (v) => `Versión ${v} do perfil, gardada neste ordenador. Os datos non saen de aquí.`,
    liniaNum: (n) => `Liña ${n}`,
    llevaLinia: (n) => `Quitar a liña ${n}`,
    emetsFactura: (num) => (num ? `Emites a factura ${num}?` : 'Emites a factura?'),
    anullesFactura: (num) => (num ? `Anulas a factura ${num}?` : 'Anulas a factura?'),
    facturaTitol: (num) => `A factura ${num}`,
    abocaExtractes: (n) => (n === 1 ? 'Envorcar 1 extracto ao Taboleiro' : `Envorcar ${n} extractos ao Taboleiro`),
    periodeDe: (any) => `Período de ${any}`,
    verificadaALes: (hora) => `Verificada ás ${hora}.`,
    mostraFacturaAria: (num) => `Mostrar a factura ${num}`,
    anullaFacturaAria: (num) => `Anular a factura ${num}`,
    mostraNFactures: (n) => `Mostrar as ${n} facturas`,
    descarregaLlibreCsv: (any, trim) => {
      const ord = { 1: '1.º', 2: '2.º', 3: '3.º', 4: '4.º' }[trim];
      const sufix = any === null ? '' : (ord ? ` do ${ord} trimestre de ${any}` : ` de ${any}`);
      return `Descargar o libro${sufix} (CSV)`;
    }
  })
});

export function tf(idioma, clau, ...args) {
  const llengua = codiIdiomaGestoria(idioma);
  const fn = PLANTILLES_GESTORIA[llengua]?.[clau] ?? PLANTILLES_GESTORIA.ca[clau];
  return typeof fn === 'function' ? fn(...args) : '';
}

const FORMATADORS_DIA = new Map();
export function diaLlegibleGestoria(ms, idioma = 'ca', zonaHoraria = 'Europe/Madrid') {
  const llengua = codiIdiomaGestoria(idioma);
  const clau = `${llengua}|${zonaHoraria}`;
  if (!FORMATADORS_DIA.has(clau)) {
    FORMATADORS_DIA.set(
      clau,
      new Intl.DateTimeFormat(LOCALES_IDIOMA[llengua], { timeZone: zonaHoraria, weekday: 'long', day: 'numeric', month: 'long' })
    );
  }
  return FORMATADORS_DIA.get(clau).format(ms);
}

/* ── 5. Baralla formativa d'Aprendre en es, en, eu, gl (mateixos id i versio) ── */
const c4 = (titol, concepte, mnemotecnia, pregunta, resposta, explicacio) =>
  Object.freeze({ titol, concepte, mnemotecnia, pregunta, resposta, explicacio });

const BARALLA_I18N = Object.freeze({
  es: Object.freeze({
    titol: 'Aprender la gestoría',
    avis: 'Contenido formativo general; confírmalo siempre con tu gestoría.',
    targetes: Object.freeze({
      'gestoria-trimestres': c4(
        'Los cuatro trimestres',
        'El año fiscal se divide en cuatro trimestres naturales: 1T de enero a marzo, 2T de abril a junio, 3T de julio a septiembre y 4T de octubre a diciembre.',
        'Cada trimestre acaba en un mes múltiplo de tres: marzo (3), junio (6), septiembre (9) y diciembre (12).',
        '¿Qué meses incluye el tercer trimestre (3T)?',
        'Julio, agosto y septiembre.',
        'Los trimestres son naturales para todos: el 3T va del 1 de julio al 30 de septiembre.'
      ),
      'gestoria-model-303': c4(
        'Modelo 303: el IVA del trimestre',
        'El modelo 303 es la autoliquidación trimestral del IVA: declaras el IVA cobrado en tus facturas y el soportado en gastos de la actividad.',
        '303 se lee igual de ida y de vuelta, como el IVA: entra con las ventas y sale con las compras.',
        '¿Qué impuesto liquida el modelo 303 y cada cuánto?',
        'El IVA, cada trimestre.',
        'Resta el IVA soportado deducible del repercutido: si sale positivo ingresas; si sale negativo compensas o en el 4T pides devolución.'
      ),
      'gestoria-model-130': c4(
        'Modelo 130: pago a cuenta de la renta',
        'El modelo 130 es el pago fraccionado del IRPF en estimación directa: cada trimestre adelantas parte del impuesto anual.',
        '1-3-0: una renta, tres meses, cero si no ganas.',
        '¿Cómo se calcula el modelo 130?',
        'El 20 % del rendimiento neto acumulado desde el 1 de enero, menos pagos anteriores del año y retenciones soportadas.',
        'Es acumulado desde enero. Si al menos el 70 % de tus ingresos profesionales del año anterior llevaron retención, no estás obligado.'
      ),
      'gestoria-terminis-303-130': c4(
        'Plazos del 303 y del 130',
        'Se presentan del 1 al 20 de abril (1T), julio (2T) y octubre (3T), y del 1 al 30 de enero del año siguiente (4T).',
        'Veinte días por trimestre; enero tiene treinta porque cierra el año.',
        '¿Hasta qué día puedes presentar el 303 y el 130 del cuarto trimestre?',
        'Hasta el 30 de enero del año siguiente.',
        'Si el último día es inhábil pasa al siguiente hábil; con domiciliación bancaria el plazo termina unos días antes.'
      ),
      'gestoria-iva-repercutit-suportat': c4(
        'IVA repercutido e IVA soportado',
        'El IVA repercutido es el que cobras a clientes; el soportado es el que te cobran los proveedores.',
        'Repercutido: lo pasas al cliente. Soportado: lo soportas al pagar.',
        '¿El IVA de una factura emitida a un cliente es repercutido o soportado?',
        'Repercutido.',
        'Solo puedes deducir el IVA soportado de gastos afectos a la actividad con factura completa a tu nombre.'
      ),
      'gestoria-tipus-iva': c4(
        'Los tipos de IVA',
        'En Península y Baleares hay tres tipos de IVA: general del 21 %, reducido del 10 % y superreducido del 4 %.',
        '21 general; 10 los dedos de las manos; 4 las patas de una silla.',
        '¿Cuáles son los tipos de IVA general, reducido y superreducido?',
        'General 21 %, reducido 10 % y superreducido 4 %.',
        'La mayoría de servicios profesionales tributan al 21 %. Canarias, Ceuta y Melilla tienen impuestos propios.'
      ),
      'gestoria-factura-rebut': c4(
        'Factura o recibo',
        'Un recibo acredita el pago, pero no basta para deducir el IVA: necesitas factura completa con tu nombre y NIF.',
        'El recibo dice «he pagado»; la factura dice «a quién, por qué y con qué IVA».',
        '¿Puedes deducir el IVA si solo tienes el recibo bancario?',
        'No. Necesitas la factura completa con tu NIF.',
        'Pide siempre factura completa con serie, número, fecha, NIF de emisor y receptor, base y cuota de IVA.'
      ),
      'gestoria-inversio-subjecte-passiu': c4(
        'Proveedor de la UE sin IVA',
        'Cuando una empresa de otro país de la UE te factura sin IVA como operador intracomunitario, se aplica inversión del sujeto pasivo.',
        'El balón cambia de campo: tú calculas el IVA repercutido y soportado.',
        '¿Cómo declaras en el 303 la factura sin IVA de un proveedor de la UE?',
        'Por inversión del sujeto pasivo: declaras a la vez IVA repercutido y soportado.',
        'Además de anotarlo en ambos lados del 303, la operación se informa en el modelo 349.'
      ),
      'gestoria-model-349': c4(
        'Modelo 349: declaración recapitulativa',
        'El modelo 349 declara las compras y ventas intracomunitarias de bienes y servicios con empresas de la UE.',
        'El 349 es la lista europea: no paga nada, solo recapitula.',
        '¿Qué modelo recoge las operaciones con empresas de otros países de la UE?',
        'El modelo 349.',
        'Es informativo y solo se presenta cuando ha habido operaciones intracomunitarias en el período.'
      ),
      'gestoria-roi-036': c4(
        'El ROI y el modelo 036',
        'El Registro de Operadores Intracomunitarios (ROI) permite operar con NIF-IVA europeo VIES; el alta se pide con el modelo 036.',
        'ROI: la llave europea que se solicita con el 036.',
        '¿Con qué modelo solicitas el alta en el ROI?',
        'Con el modelo 036, la declaración censal.',
        'Sin alta en VIES, el proveedor europeo puede facturarte con el IVA de su país.'
      ),
      'gestoria-lletra-nif': c4(
        'La letra del NIF',
        'El NIF personal lleva una letra de control obtenida del resto de dividir el número entre 23.',
        'Veintitrés letras de guardia para detectar errores al copiar.',
        '¿Para qué sirve la letra final del NIF?',
        'Es un dígito de control frente a errores de transcripción.',
        'Si bailas una cifra, la letra no cuadra y el programa puede avisarte antes de entregar la hoja.'
      ),
      'gestoria-lletra-entitat': c4(
        'La primera letra del NIF de entidad',
        'Indica la forma jurídica: A sociedad anónima, B sociedad limitada, F cooperativa, G asociación o fundación.',
        'A de Anónima, B de Limitada, F de Cooperativa, G de Asociación.',
        '¿Qué forma jurídica indica un NIF que empieza por B?',
        'Sociedad de responsabilidad limitada.',
        'Leer la letra inicial ayuda a detectar NIF mal copiados o contrapartes mal identificadas.'
      ),
      'gestoria-conservacio-factures': c4(
        'Cuánto tiempo guardar las facturas',
        'Al menos cuatro años por prescripción fiscal, y seis años según el Código de Comercio para documentación mercantil.',
        'Cuatro para Hacienda, seis para Comercio: guarda hasta el plazo mayor.',
        '¿Cuánto tiempo mínimo debes conservar las facturas por prescripción fiscal?',
        'Cuatro años.',
        'Se cuentan desde el fin del plazo de presentación de la declaración correspondiente.'
      ),
      'gestoria-retencio-irpf': c4(
        'La retención de IRPF en facturas',
        'En actividades profesionales facturadas a empresas o profesionales se aplica el 15 % de retención (7 % al inicio).',
        'Arranque al 7 %, crucero al 15 %.',
        '¿Qué retención lleva normalmente una factura profesional a una empresa?',
        'El 15 %; el 7 % el año de inicio y los dos siguientes.',
        'Se calcula sobre la base imponible; a clientes particulares no se les practica retención.'
      ),
      'gestoria-iva-no-es-teu': c4(
        'El IVA no es tuyo',
        'El IVA cobrado no es un ingreso propio: lo custodias para ingresarlo en Hacienda con el 303.',
        'El IVA es una mochila prestada: la llevas tú, pero no es tuya.',
        'Cobras 121 € con un 21 % de IVA. ¿Qué parte es ingreso tuyo?',
        '100 €. Los 21 € son IVA a liquidar.',
        'Apártalo en una reserva para no gastarlo antes de presentar el trimestre.'
      ),
      'gestoria-base-iva-retencio': c4(
        'Base, IVA y retención',
        'El total a cobrar es base imponible más IVA menos retención de IRPF; ambos porcentajes se calculan sobre la base.',
        'Base, sube IVA, baja retención: «base, más, menos».',
        'Base 1.000 €, IVA 21 % y retención 15 %. ¿Total a cobrar?',
        '1.060 €: 1.000 + 210 − 150.',
        'Los 210 € van al 303 y los 150 € los ingresa tu cliente a cuenta de tu IRPF.'
      ),
      'gestoria-numeracio-correlativa': c4(
        'Numeración correlativa',
        'Las facturas emitidas deben llevar numeración correlativa sin saltos dentro de cada serie; las rectificativas llevan serie propia.',
        'Como los dientes de un peine: si falta uno, se nota enseguida.',
        '¿Puedes dejar huecos en la numeración de tus facturas emitidas?',
        'No. Dentro de cada serie debe ser correlativa.',
        'Si una factura tiene error, no reutilices su número: corrígela mediante una factura rectificativa.'
      )
    })
  }),
  en: Object.freeze({
    titol: 'Learn Bookkeeping',
    avis: 'General educational content; always confirm specifics with your tax advisor.',
    targetes: Object.freeze({
      'gestoria-trimestres': c4(
        'The four tax quarters',
        'The Spanish tax year splits into four calendar quarters: Q1 Jan–Mar, Q2 Apr–Jun, Q3 Jul–Sep and Q4 Oct–Dec.',
        'Each quarter ends on a multiple of three: March (3), June (6), September (9), December (12).',
        'Which months make up the third quarter (Q3)?',
        'July, August and September.',
        'Quarters follow the calendar year for everyone regardless of registration date.'
      ),
      'gestoria-model-303': c4(
        'Form 303: quarterly VAT',
        'Form 303 is the quarterly VAT return: declare VAT charged on sales minus deductible VAT paid on business expenses.',
        '303 reads the same forwards and backwards: VAT comes in on sales and goes out on purchases.',
        'Which tax does Form 303 settle and how often?',
        'VAT, every quarter.',
        'Positive results are paid; negative balances carry forward to offset future quarters or request a refund in Q4.'
      ),
      'gestoria-model-130': c4(
        'Form 130: income tax prepayment',
        'Form 130 is the quarterly personal income tax (IRPF) prepayment for self-employed direct assessment.',
        '1-3-0: one income tax, three months, zero if net profit is zero.',
        'How is Form 130 calculated?',
        '20 % of year-to-date net profit minus prior prepayments and withholdings.',
        'Cumulative from January 1st. Exempt if at least 70 % of prior-year professional income carried IRPF withholding.'
      ),
      'gestoria-terminis-303-130': c4(
        'Deadlines for Forms 303 & 130',
        'Filed April 1–20 (Q1), July 1–20 (Q2), October 1–20 (Q3), and January 1–30 of the following year (Q4).',
        'Twenty days per quarter; thirty in January to close the year.',
        'Until what date can Q4 Forms 303 and 130 be filed?',
        'Until January 30th of the following year.',
        'Direct debit deadlines close a few days earlier; weekend/holiday deadlines shift to the next business day.'
      ),
      'gestoria-iva-repercutit-suportat': c4(
        'Output VAT vs. Input VAT',
        'Output VAT (repercutido) is charged to clients; input VAT (soportado) is paid to suppliers.',
        'Output goes out to clients; input comes in on supplier bills.',
        'Is VAT on an invoice you issue to a client output or input VAT?',
        'Output VAT.',
        'Input VAT is only deductible on business-related expenses backed by a full invoice bearing your Tax ID.'
      ),
      'gestoria-tipus-iva': c4(
        'Spanish VAT rates',
        'Mainland Spain and the Balearic Islands apply three VAT rates: 21 % standard, 10 % reduced and 4 % super-reduced.',
        '21 standard; 10 fingers; 4 legs on a chair.',
        'What are the standard, reduced and super-reduced VAT rates?',
        '21 % standard, 10 % reduced and 4 % super-reduced.',
        'Most professional services carry 21 %. Canary Islands, Ceuta and Melilla use separate indirect taxes.'
      ),
      'gestoria-factura-rebut': c4(
        'Full invoice vs. payment receipt',
        'A bank slip or receipt proves payment, not tax deductibility. Deducting VAT requires a full invoice with your name and Tax ID.',
        'A receipt says “paid”; an invoice says “who, what and how much VAT”.',
        'Can you deduct VAT with only a payment receipt?',
        'No. You need a full invoice with your Tax ID.',
        'Always request a complete invoice showing series, number, date, both Tax IDs, taxable base and VAT breakdown.'
      ),
      'gestoria-inversio-subjecte-passiu': c4(
        'EU supplier without VAT',
        'When an EU B2B supplier bills you without VAT under VIES, the reverse-charge mechanism applies.',
        'You self-assess both output and input VAT on your return.',
        'How is an intra-EU VAT-free supplier invoice declared on Form 303?',
        'Via reverse charge: declare both output and deductible input VAT simultaneously.',
        'Net cash impact is zero if 100 % deductible, and the transaction is also reported on Form 349.'
      ),
      'gestoria-model-349': c4(
        'Form 349: EU recapitulative statement',
        'Form 349 lists intra-EU B2B supplies and acquisitions of goods and services.',
        'Form 349 is the European cross-check list: informational, zero payment.',
        'Which form reports intra-EU B2B transactions?',
        'Form 349.',
        'Informational only; filed solely for periods in which intra-EU operations occurred.'
      ),
      'gestoria-roi-036': c4(
        'ROI / VIES and Form 036',
        'ROI registers you in the EU VIES VAT registry; registration is requested via census Form 036.',
        'ROI opens EU B2B invoicing via Form 036.',
        'Which form requests registration in the intra-EU operators registry (ROI)?',
        'Form 036.',
        'Without active VIES status, EU suppliers may charge foreign VAT as if you were a consumer.'
      ),
      'gestoria-lletra-nif': c4(
        'Personal NIF check letter',
        'Spanish personal Tax IDs end with a check letter computed from the number modulo 23.',
        'Twenty-three letters guarding against typos.',
        'What is the purpose of the final letter on a personal NIF?',
        'Check character that catches transcription typos.',
        'A single mistyped digit changes the remainder and triggers an immediate validation warning.'
      ),
      'gestoria-lletra-entitat': c4(
        'Entity NIF prefix letter',
        'Corporate Tax IDs start with a legal-form letter: A public limited, B limited liability, F cooperative, G association/foundation.',
        'A SA, B SL, F Cooperative, G Non-profit.',
        'Which legal form does a Tax ID starting with B indicate?',
        'Limited liability company (SL).',
        'Checking the prefix helps spot misclassified counterparties before exporting.'
      ),
      'gestoria-conservacio-factures': c4(
        'Invoice retention period',
        'Keep issued and received invoices at least 4 years for tax statute of limitations, and 6 years under the Commercial Code.',
        'Four years for tax, six for commercial books.',
        'What is the minimum tax retention period for invoices?',
        'Four years.',
        'Counted from the filing deadline of the return in which the invoice is included.'
      ),
      'gestoria-retencio-irpf': c4(
        'IRPF withholding on invoices',
        'Professional invoices to Spanish companies or self-employed clients carry 15 % IRPF withholding (7 % in the first three years).',
        'Start at 7 %, cruise at 15 %.',
        'What IRPF withholding applies to standard B2B professional invoices?',
        '15 % (or 7 % in the registration year and next two years).',
        'Applied on the taxable base; never applied when billing private individuals.'
      ),
      'gestoria-iva-no-es-teu': c4(
        'Collected VAT is not revenue',
        'VAT collected from clients belongs to the tax agency until settled on Form 303.',
        'VAT is a borrowed backpack: you carry it, you don’t own it.',
        'You collect €121 including 21 % VAT. How much is your revenue?',
        '€100. The remaining €21 is VAT held for settlement.',
        'Set collected VAT aside so quarterly settlement never squeezes your cash.'
      ),
      'gestoria-base-iva-retencio': c4(
        'Base, VAT and withholding math',
        'Net payable equals taxable base plus VAT minus IRPF withholding; both percentages apply to the base.',
        'Base, add VAT, subtract withholding.',
        'Base €1,000, 21 % VAT, 15 % withholding. Total payable by client?',
        '€1,060: 1,000 + 210 − 150.',
        '€210 goes to Form 303 and €150 is remitted by your client as an IRPF credit for you.'
      ),
      'gestoria-numeracio-correlativa': c4(
        'Sequential invoice numbering',
        'Issued invoices must be numbered sequentially without gaps within each series; credit notes use their own series.',
        'Like teeth on a comb: a missing number stands out immediately.',
        'Can you leave numbering gaps in issued invoices?',
        'No. Numbering within each series must be strictly sequential.',
        'Never delete or reuse an issued number; issue a corrective invoice instead.'
      )
    })
  }),
  eu: Object.freeze({
    titol: 'Gestoria ikasi',
    avis: 'Prestakuntza-eduki orokorra; egiaztatu beti zure gestoriarekin.',
    targetes: Object.freeze({
      'gestoria-trimestres': c4(
        'Lau hiruhilekoak',
        'Zerga-urtea lau hiruhileko naturaletan banatzen da: 1H urtarrila–martxoa, 2H apirila–ekaina, 3H uztaila–iraila eta 4H urria–abendua.',
        'Hiruhileko bakoitza hiruren multiploa den hilabete batean amaitzen da: 3, 6, 9 eta 12.',
        'Zein hilabete hartzen ditu hirugarren hiruhilekoak (3H)?',
        'Uztaila, abuztua eta iraila.',
        'Hiruhilekoak naturalak dira guztientzat: uztailaren 1etik irailaren 30era.'
      ),
      'gestoria-model-303': c4(
        '303 eredua: hiruhilekoko BEZa',
        '303 eredua BEZaren hiruhilekoko autolikidazioa da: kobratutako BEZa eta gastuetan jasandako BEZ kengarria aitortzen dira.',
        '303 berdin irakurtzen da joan eta etorri: salmentekin sartu eta erosketekin irten.',
        'Zein zerga likidatzen du 303 ereduak eta zenbatetik behin?',
        'BEZa, hiruhileko bakoitzean.',
        'Emaitza positiboa bada ordaindu egiten da; negatiboa bada hurrengoetan konpentsatu edo 4Hn itzulketa eskatzen da.'
      ),
      'gestoria-model-130': c4(
        '130 eredua: errentaren aurrerapena',
        '130 eredua PFEZaren zatikako ordainketa da zuzeneko zenatespenean: urteko zergaren zati bat aurreratzen duzu.',
        '1-3-0: errenta bat, hiru hilabete, zero irabazirik ez badago.',
        'Nola kalkulatzen da 130 eredua?',
        'Urtarrilaren 1etik metatutako etekin garbiaren % 20, aurreko ordainketak eta atxikipenak kenduta.',
        'Aurreko urteko diru-sarrera profesionalen % 70ek gutxienez atxikipena izan bazuten, ez dago aurkezteko beharrik.'
      ),
      'gestoria-terminis-303-130': c4(
        '303 eta 130 ereduen epeak',
        'Apirilaren, uztailaren eta urriaren 1etik 20ra (1H–3H), eta hurrengo urteko urtarrilaren 1etik 30era (4H).',
        'Hogei egun hiruhilekoko; urtarrilean hogeita hamar urtea ixteko.',
        'Noiz arte aurkez daitezke laugarren hiruhilekoko 303 eta 130 ereduak?',
        'Hurrengo urteko urtarrilaren 30era arte.',
        'Azken eguna baliogabea bada, hurrengo lanegunera pasatzen da.'
      ),
      'gestoria-iva-repercutit-suportat': c4(
        'Jasanarazitako BEZa eta jasandako BEZa',
        'Jasanarazitako BEZa bezeroei kobratzen diezuna da; jasandako BEZa hornitzaileek kobratzen dizutena.',
        'Jasanarazia bezeroari pasatzen diozu; jasandakoa zuk ordaintzen duzu.',
        'Bezero bati jaulkitako fakturako BEZa jasanarazia ala jasandakoa da?',
        'Jasanarazia.',
        'Jarduerari lotutako gastuen BEZ jasandakoa soilik kendu daiteke, zure IFZdun faktura osoarekin.'
      ),
      'gestoria-tipus-iva': c4(
        'BEZ tasak',
        'Penintsulan eta Balearretan hiru tasa daude: orokorra % 21, murriztua % 10 eta oso murriztua % 4.',
        '21 orokorra; 10 eskuetako hatzak; 4 aulkiaren hankak.',
        'Zenbatekoak dira BEZ tasa orokorra, murriztua eta oso murriztua?',
        'Orokorra % 21, murriztua % 10 eta oso murriztua % 4.',
        'Zerbitzu profesional gehienak % 21ean doaz.'
      ),
      'gestoria-factura-rebut': c4(
        'Faktura ala ordainagiria',
        'Ordainagiriak ordainketa egiaztatzen du, baina BEZa kentzeko zure izena eta IFZ dituen faktura osoa behar duzu.',
        'Ordainagiriak «ordaindu dut» dio; fakturak «nori, zergatik eta zenbat BEZ».',
        'Kendu al dezakezu BEZa ordainagiria soilik baduzu?',
        'Ez. Zure IFZa duen faktura osoa behar duzu.',
        'Eskatu beti faktura osoa hornitzaileari.'
      ),
      'gestoria-inversio-subjecte-passiu': c4(
        'EBko hornitzailea BEZik gabe',
        'EBko beste herrialde bateko enpresa batek BEZik gabe fakturatzen dizunean, subjektu pasiboaren inbertsioa aplikatzen da.',
        'Pilota zelaiz aldatzen da: zuk kalkulatzen dituzu bi BEZak.',
        'Nola aitortzen da 303 ereduan EBko hornitzaile baten BEZik gabeko faktura?',
        'Subjektu pasiboaren inbertsioz: jasanarazitako eta jasandako BEZa aldi berean aitortuz.',
        'Horrez gain, eragiketa 349 ereduan sartzen da.'
      ),
      'gestoria-model-349': c4(
        '349 eredua: laburpen-aitorpena',
        '349 ereduak EBko beste herrialdeetako enpresekin egindako erosketak eta salmentak biltzen ditu.',
        '349a Europako zerrenda da: informatiboa, ordainketarik gabe.',
        'Zein ereduk biltzen ditu EBko beste herrialdeetako enpresekiko eragiketak?',
        '349 ereduak.',
        'Eragiketak izan diren aldietan soilik aurkezten da.'
      ),
      'gestoria-roi-036': c4(
        'ROI eta 036 eredua',
        'ROIa Batasun Barneko Eragileen Erregistroa da (VIES); alta 036 zentsu-ereduarekin eskatzen da.',
        'ROI: Europako giltza 036 ereduarekin.',
        'Zein eredurekin eskatzen da alta ROIn?',
        '036 ereduarekin.',
        'VIESen alta izan gabe, hornitzaile europarrak bere BEZarekin faktura diezazuke.'
      ),
      'gestoria-lletra-nif': c4(
        'IFZaren letra',
        'Pertsona baten IFzak kontrol-letra bat darama, zenbakia 23z zatitzearen hondarretik aterata.',
        'Hogeita hiru letra akatsak harrapatzeko.',
        'Zertarako balio du IFZaren azken letrak?',
        'Kopiatzean egindako akatsak hautemateko kontrola da.',
        'Zifra bakar bat aldatuz gero, letra ez dator bat.'
      ),
      'gestoria-lletra-entitat': c4(
        'Entitate baten IFZaren lehen letra',
        'Forma juridikoa adierazten du: A sozietate anonimoa, B mugatua, F kooperatiba, G elkartea edo fundazioa.',
        'A Anonimoa, B Mugatua, F Kooperatiba, G Elkartea.',
        'Zein forma juridiko adierazten du B letraz hasten den IFZ batek?',
        'Erantzukizun mugatuko sozietatea.',
        'Lehen letra irakurtzeak gaizki identifikatutako kontraparteak hautematen laguntzen du.'
      ),
      'gestoria-conservacio-factures': c4(
        'Fakturak zenbat denboraz gorde',
        'Gutxienez lau urtez zerga-preskripzioagatik, eta sei urtez Merkataritza Kodearen arabera.',
        'Lau Ogasunerako, sei Merkataritzarako.',
        'Gutxienez zenbat denboraz gorde behar dira fakturak zerga-preskripzioagatik?',
        'Lau urtez.',
        'Aitorpena aurkezteko epea amaitzen denetik zenbatzen dira.'
      ),
      'gestoria-retencio-irpf': c4(
        'PFEZ atxikipena fakturetan',
        'Jarduera profesionaletan enpresa edo profesionalei fakturatzean % 15eko atxikipena doa (% 7 hasieran).',
        'Hasieran % 7, gero % 15.',
        'Zein PFEZ atxikipen darama normalean enpresa bati egindako faktura profesionalak?',
        '% 15; % 7 hasierako urtean eta hurrengo bietan.',
        'Zerga-oinarriaren gainean kalkulatzen da; partikularrei ez zaie atxikipenik egiten.'
      ),
      'gestoria-iva-no-es-teu': c4(
        'BEZa ez da zurea',
        'Kobratzen duzun BEZa ez da zure diru-sarrera: Ogasunaren kontura gordetzen duzu 303arekin entregatu arte.',
        'BEZa utzitako motxila da: zuk daramazu, baina ez da zurea.',
        '121 € kobratzen dituzu (% 21 BEZ barne). Zein zati da zure diru-sarrera?',
        '100 €. Beste 21 €-ak Ogasunari likidatzeko BEZa dira.',
        'Gorde BEZa aparteko erreserba batean.'
      ),
      'gestoria-base-iva-retencio': c4(
        'Oinarria, BEZa eta atxikipena',
        'Kobratzeko guztizkoa zerga-oinarria gehi BEZa ken PFEZ atxikipena da; bi ehunekoak oinarriari aplikatzen zaizkio.',
        'Oinarria, gehi BEZa, ken atxikipena.',
        '1.000 €-ko oinarria, % 21eko BEZa eta % 15eko atxikipena. Zenbat da kobratzekoa?',
        '1.060 €: 1.000 + 210 − 150.',
        '210 € 303ra doaz eta 150 € bezeroak sartzen ditu zure PFEZaren kontura.'
      ),
      'gestoria-numeracio-correlativa': c4(
        'Zenbakitze korrelatiboa',
        'Jaulkitako fakturek serie bakoitzean jauzirik gabeko zenbaki korrelatiboa eraman behar dute; zuzentzaileek serie propioa dute.',
        'Orrazi baten hortzak bezala: bat falta bada, berehala nabari da.',
        'Utz al daiteke hutsunerik jaulkitako fakturen zenbakitzean?',
        'Ez. Serie bakoitzaren barruan korrelatiboa izan behar du.',
        'Faktura bat okerra bada, ez berrerabili zenbakia: zuzendu faktura zuzentzaile batekin.'
      )
    })
  }),
  gl: Object.freeze({
    titol: 'Aprender a xestoría',
    avis: 'Contido formativo xeral; confírmao sempre coa túa xestoría.',
    targetes: Object.freeze({
      'gestoria-trimestres': c4(
        'Os catro trimestres',
        'O ano fiscal divídese en catro trimestres naturais: 1T de xaneiro a marzo, 2T de abril a xuño, 3T de xullo a setembro e 4T de outubro a decembro.',
        'Cada trimestre remata nun mes múltiplo de tres: marzo (3), xuño (6), setembro (9) e decembro (12).',
        'Que meses inclúe o terceiro trimestre (3T)?',
        'Xullo, agosto e setembro.',
        'Os trimestres son naturais para todo o mundo: o 3T vai do 1 de xullo ao 30 de setembro.'
      ),
      'gestoria-model-303': c4(
        'Modelo 303: o IVE do trimestre',
        'O modelo 303 é a autoliquidación trimestral do IVE: declaras o IVE cobrado nas túas facturas e o soportado nos gastos da actividade.',
        '303 lese igual de ida e de volta, coma o IVE: entra coas vendas e sae coas compras.',
        'Que imposto liquida o modelo 303 e cada canto?',
        'O IVE, cada trimestre.',
        'Resta o IVE soportado deducible do repercutido: se sae positivo ingresas; se sae negativo compensas ou no 4T pides devolución.'
      ),
      'gestoria-model-130': c4(
        'Modelo 130: pagamento fraccionado da renda',
        'O modelo 130 é o pagamento fraccionado do IRPF en estimación directa: cada trimestre adiantas parte do imposto anual.',
        '1-3-0: unha renda, tres meses, cero se non gañas.',
        'Como se calcula o modelo 130?',
        'O 20 % do rendemento neto acumulado desde o 1 de xaneiro, menos pagamentos anteriores do ano e retencións.',
        'Se polo menos o 70 % dos ingresos profesionais do ano anterior levaron retención, non estás obrigado a presentalo.'
      ),
      'gestoria-terminis-303-130': c4(
        'Prazos do 303 e do 130',
        'Preséntanse do 1 ao 20 de abril (1T), xullo (2T) e outubro (3T), e do 1 ao 30 de xaneiro do ano seguinte (4T).',
        'Vinte días por trimestre; xaneiro ten trinta porque pecha o ano.',
        'Ata que día podes presentar o 303 e o 130 do cuarto trimestre?',
        'Ata o 30 de xaneiro do ano seguinte.',
        'Se o último día é inhábil pasa ao primeiro hábil seguinte; con domiciliación remata uns días antes.'
      ),
      'gestoria-iva-repercutit-suportat': c4(
        'IVE repercutido e IVE soportado',
        'O IVE repercutido é o que cobras aos clientes; o soportado é o que che cobran os provedores.',
        'Repercutido: pásalo ao cliente. Soportado: sopórtalo ti ao pagar.',
        'O IVE dunha factura emitida a un cliente é repercutido ou soportado?',
        'Repercutido.',
        'Só podes deducir o IVE soportado de gastos afectos á actividade con factura completa ao teu nome.'
      ),
      'gestoria-tipus-iva': c4(
        'Os tipos de IVE',
        'Na Península e Baleares o IVE ten tres tipos: xeral do 21 %, reducido do 10 % e superreducido do 4 %.',
        '21 xeral; 10 dedos das mans; 4 patas dunha cadeira.',
        'Canto valen os tipos de IVE xeral, reducido e superreducido?',
        'Xeral 21 %, reducido 10 % e superreducido 4 %.',
        'A maioría de servizos profesionais van ao 21 %. Canarias, Ceuta e Melilla teñen impostos propios.'
      ),
      'gestoria-factura-rebut': c4(
        'Factura ou recibo',
        'Un recibo acredita o pagamento, pero para deducir o IVE precisas a factura completa co teu nome e NIF.',
        'O recibo di «paguei»; a factura di «a quen, por que e canto IVE».',
        'Podes deducir o IVE dun gasto se só tes o recibo do pagamento?',
        'Non. Precisas a factura completa co teu NIF.',
        'Pide sempre factura completa ao provedor.'
      ),
      'gestoria-inversio-subjecte-passiu': c4(
        'Provedor da UE sen IVE',
        'Cando unha empresa doutro país da UE che factura sen IVE como empresa, aplícase a inversión do suxeito pasivo.',
        'A pelota cambia de campo: ti autoliquidas o IVE.',
        'Como declaras no 303 a factura sen IVE dun provedor da UE?',
        'Por inversión do suxeito pasivo: declaras á vez o IVE repercutido e o soportado.',
        'Ademais, esa operación inclúese no modelo 349.'
      ),
      'gestoria-model-349': c4(
        'Modelo 349: declaración recapitulativa',
        'O modelo 349 recolle as compras e vendas intracomunitarias con empresas doutros países da UE.',
        'O 349 é a lista europea: non paga nada, só recapitula.',
        'Que modelo recolle as operacións con empresas doutros países da UE?',
        'O modelo 349.',
        'É informativo e só se presenta nos períodos con operacións.'
      ),
      'gestoria-roi-036': c4(
        'O ROI e o modelo 036',
        'O Rexistro de Operadores Intracomunitarios (ROI) permite operar con NIF-IVE europeo VIES; a alta pídese co modelo 036.',
        'ROI: a chave europea que se pide co 036.',
        'Con que modelo pides a alta no ROI?',
        'Co modelo 036, a declaración censual.',
        'Sen estar no VIES, o provedor europeo pode facturarche co IVE do seu país.'
      ),
      'gestoria-lletra-nif': c4(
        'A letra do NIF',
        'O NIF persoal leva unha letra final calculada co resto de dividir o número entre 23.',
        'Vinte e tres letras de garda contra erros ao copiar.',
        'Para que serve a letra final do NIF?',
        'É un control que delata erros ao transcribilo.',
        'Se cambias unha cifra, a letra deixa de cadrar.'
      ),
      'gestoria-lletra-entitat': c4(
        'A primeira letra do NIF dunha entidade',
        'Indica a forma xurídica: A sociedade anónima, B limitada, F cooperativa, G asociación ou fundación.',
        'A Anónima, B Limitada, F Cooperativa, G Asociación.',
        'Que forma xurídica indica un NIF de entidade que comeza por B?',
        'Unha sociedade de responsabilidade limitada.',
        'Axuda a detectar contrapartes mal identificadas antes de enviar a folla.'
      ),
      'gestoria-conservacio-factures': c4(
        'Canto tempo gardar as facturas',
        'Polo menos catro anos por prescrición fiscal, e seis anos segundo o Código de Comercio.',
        'Catro para Facenda, seis para Comercio.',
        'Canto tempo mínimo debes gardar as facturas por prescrición fiscal?',
        'Catro anos.',
        'Cóntanse desde que remata o prazo de presentación da declaración.'
      ),
      'gestoria-retencio-irpf': c4(
        'A retención de IRPF nas facturas',
        'Nas facturas profesionais a empresas ou profesionais aplícase o 15 % de retención (7 % ao inicio).',
        'Arrancada ao 7 %, cruceiro ao 15 %.',
        'Que retención leva normalmente a factura dun profesional a unha empresa?',
        'O 15 %; o 7 % o ano de inicio e os dous seguintes.',
        'Calcúlase sobre a base impoñible; a particulares non se aplica retención.'
      ),
      'gestoria-iva-no-es-teu': c4(
        'O IVE non é teu',
        'O IVE que cobras non é ingreso teu: gárdalo por conta de Facenda ata liquidalo co 303.',
        'O IVE é unha mochila emprestada: lévala ti, pero non é túa.',
        'Cobras 121 € cun 21 % de IVE. Que parte é ingreso da túa actividade?',
        '100 €. Os 21 € de IVE debes liquidalos a Facenda.',
        'Apártao nunha reserva para non gastalo antes do trimestre.'
      ),
      'gestoria-base-iva-retencio': c4(
        'Base, IVE e retención',
        'O total a cobrar é base impoñible máis IVE menos retención de IRPF; ambos aplícanse sobre a base.',
        'Base, sobe IVE, baixa retención.',
        'Base de 1.000 €, IVE do 21 % e retención do 15 %. Cal é o total a cobrar?',
        '1.060 €: 1.000 + 210 − 150.',
        'Os 210 € van ao 303 e os 150 € ingrésaos o cliente a conta do teu IRPF.'
      ),
      'gestoria-numeracio-correlativa': c4(
        'Numeración correlativa',
        'As facturas emitidas deben levar número correlativo sen saltos dentro de cada serie; as rectificativas teñen serie propia.',
        'Coma os dentes dun peite: se falta un, nótase.',
        'Podes deixar un oco na numeración das facturas emitidas?',
        'Non. Dentro de cada serie a numeración ten que ser correlativa.',
        'Se unha factura é errónea, non reutilices o número: corríxea cunha rectificativa.'
      )
    })
  })
});

const CACHE_BARALLA = new Map();
export function barallaGestoria(barallaBase, idioma = 'ca') {
  const llengua = codiIdiomaGestoria(idioma);
  if (llengua === 'ca' || !barallaBase || barallaBase.id !== 'gestoria-autonoms') return barallaBase;
  if (CACHE_BARALLA.has(llengua)) return CACHE_BARALLA.get(llengua);
  const trad = BARALLA_I18N[llengua];
  const localitzada = Object.freeze({
    ...barallaBase,
    titol: trad.titol,
    avis: trad.avis,
    targetes: Object.freeze(barallaBase.targetes.map((t) => {
      const tr = trad.targetes[t.id];
      return tr ? Object.freeze({ ...t, ...tr }) : t;
    }))
  });
  CACHE_BARALLA.set(llengua, localitzada);
  return localitzada;
}

/* ── 6. Localitzadors purs d'objectes derivats dels nuclis ── */
export function localitzaTargetaGestoria(targeta, idioma = 'ca') {
  const llengua = codiIdiomaGestoria(idioma);
  if (llengua === 'ca' || !targeta) return targeta;
  return {
    ...targeta,
    titol: tg(llengua, targeta.titol),
    subtitol: tg(llengua, targeta.subtitol),
    entradeta: tg(llengua, targeta.entradeta),
    senseXifra: tg(llengua, targeta.senseXifra),
    etiquetes: Array.isArray(targeta.etiquetes)
      ? targeta.etiquetes.map((e) => ({ ...e, text: tg(llengua, e.text) }))
      : targeta.etiquetes,
    detall: Array.isArray(targeta.detall)
      ? targeta.detall.map((d) => ({ ...d, etiqueta: tg(llengua, d.etiqueta) }))
      : targeta.detall,
    notes: Array.isArray(targeta.notes) ? targeta.notes.map((n) => tg(llengua, n)) : targeta.notes,
    font: tg(llengua, targeta.font)
  };
}

export function localitzaDadesTauler(dades, idioma = 'ca') {
  const llengua = codiIdiomaGestoria(idioma);
  if (llengua === 'ca' || !dades) return dades;
  return {
    ...dades,
    targetes: Array.isArray(dades.targetes) ? dades.targetes.map((t) => localitzaTargetaGestoria(t, llengua)) : dades.targetes,
    rellotge: dades.rellotge ? {
      ...dades.rellotge,
      etiqueta: tg(llengua, dades.rellotge.etiqueta),
      text: tg(llengua, dades.rellotge.text),
      obert: dades.rellotge.obert ? tg(llengua, dades.rellotge.obert) : dades.rellotge.obert
    } : dades.rellotge,
    liquidacio: dades.liquidacio ? {
      ...dades.liquidacio,
      motiu: dades.liquidacio.motiu ? tg(llengua, dades.liquidacio.motiu) : dades.liquidacio.motiu
    } : dades.liquidacio,
    cabina: dades.cabina ? {
      ...dades.cabina,
      referencia: tg(llengua, dades.cabina.referencia),
      avisFrescor: dades.cabina.avisFrescor ? tg(llengua, dades.cabina.avisFrescor) : dades.cabina.avisFrescor,
      notes: Array.isArray(dades.cabina.notes) ? dades.cabina.notes.map((n) => tg(llengua, n)) : dades.cabina.notes,
      notaFlux: tg(llengua, dades.cabina.notaFlux),
      notaTerminis: tg(llengua, dades.cabina.notaTerminis),
      venciments: Array.isArray(dades.cabina.venciments)
        ? dades.cabina.venciments.map((v) => ({ ...v, titol: tg(llengua, v.titol), text: tg(llengua, v.text) }))
        : dades.cabina.venciments,
      instruments: Array.isArray(dades.cabina.instruments)
        ? dades.cabina.instruments.map((inst) => ({
          ...inst,
          titol: tg(llengua, inst.titol),
          explica: tg(llengua, inst.explica),
          senseXifra: tg(llengua, inst.senseXifra),
          avis: inst.avis ? tg(llengua, inst.avis) : inst.avis
        }))
        : dades.cabina.instruments
    } : dades.cabina
  };
}

export function localitzaOpcionsGestoria(opcions, idioma = 'ca') {
  const llengua = codiIdiomaGestoria(idioma);
  if (llengua === 'ca' || !Array.isArray(opcions)) return opcions;
  return opcions.map((o) => ({
    ...o,
    ...(typeof o.etiqueta === 'string' ? { etiqueta: tg(llengua, o.etiqueta) } : {}),
    ...(typeof o.text === 'string' ? { text: tg(llengua, o.text) } : {}),
    ...(typeof o.ajuda === 'string' ? { ajuda: tg(llengua, o.ajuda) } : {})
  }));
}

export function localitzaEstatCadenaGestoria(estat, idioma = 'ca') {
  const llengua = codiIdiomaGestoria(idioma);
  if (llengua === 'ca' || !estat) return estat;
  return {
    ...estat,
    insignia: tg(llengua, estat.insignia),
    titol: tg(llengua, estat.titol),
    text: tg(llengua, estat.text)
  };
}

export { tga } from './i18nGestoriaA11y.js';
