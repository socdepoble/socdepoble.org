/* Onada R32.16 · T2 (IDEA-287) · Diccionari diferit en 5 llengües per a
   l'aparador didàctic de la Guia pas a pas (/page/tot-el-que-pots-fer i /page/guia):
   QuadreDeComandament amb xifres reals, mostres visuals inerts i enllaços a les
   eines complementàries. Llei 35 (6-8 <strong> per paràgraf) i Llei 32 estrictes.
   v1.2.22 · Gauntlet R1 (L2-04 · L5-05) · IDEA-323.4 · L'interruptor ja és el «Mode Bancal · Sol i Lletra
   Gran»: encés, posa la lletra gran, botons de 56 px i el contrast màxim AAA (≥ 7:1). La mostra de
   l'interruptor pinta el rètol viu de textosModeSenior.js (TEXTOS_MODE_SENIOR[llengua].xip). Este
   diccionari només l'importa AparadorGuiaPasAPas.jsx, un tros diferit (lazyRoute a PageDetailSection.jsx):
   la importació no toca el tros d'arrencada.
   v1.2.23 · D-V1223-TEXT-BANCAL (ordre del Mestre 261123) · La mostra diu «AAA ≥ 7:1», no «≥ 10:1»: és el
   mínim real del Mode Bancal (pedra-900 sobre el taronja de marca #FF7300, 7,12:1, en clar i en fosc). */
import { TEXTOS_MODE_SENIOR } from '../../config/textosModeSenior.js';

export const CODIS_IDIOMA_GUIA_PAS_A_PAS = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export const TEXTOS_APARADOR_GUIA = Object.freeze({
  ca: Object.freeze({
    quadreH3: 'Mapa ràpid de capacitats i garanties de lectura',
    quadreIntro:
      'Este quadre resumix les <strong>xifres reals verificades</strong> que trobaràs en recórrer la guia: <strong>cinc llengües completes</strong> d’interfície, <strong>tretze passos guiats</strong> amb accés directe, <strong>sis eines comunitàries</strong> en proves obertes i el <strong>Mode Bancal</strong> amb dianes de <strong>56 × 56 píxels</strong> i <strong>zero publicitat comercial</strong>.',
    estatText: 'Guia viva · 5 llengües actives',
    periode: 'Tall verificat del codi · Onada R32.16',
    xifres: Object.freeze([
      { clau: 'llengues', nom: 'Llengües d’interfície', valor: '5', lector: '5 llengües d’interfície: valencià, castellà, anglés, basc i gallec' },
      { clau: 'passos', nom: 'Passos amb enllaç', valor: '13', lector: '13 passos guiats amb enllaç directe' },
      { clau: 'dianes', nom: 'Diana Mode Bancal', valor: '56 px', lector: '56 per 56 píxels de diana mínima en Mode Bancal' },
      { clau: 'anuncis', nom: 'Anuncis i comissions', valor: '0 €', lector: 'Zero euros en comissions i zero anuncis comercials' }
    ]),
    ranquingTitol: 'On es guarden les dades segons cada espai',
    ranquingFiles: Object.freeze([
      { clau: 'comunitat', nom: 'Vida compartida (Mur, Mercat, Calendari, Mapa, Xat)', codi: 'servidor de Sóc de Poble', valor: '5 espais', proporcio: 5 / 13 },
      { clau: 'dispositiu', nom: 'Eines personals i d’associació (Rebost, Salut, Gestoria, Bar, Genealogia)', codi: 'al teu dispositiu', valor: '5 eines', proporcio: 5 / 13 },
      { clau: 'preferencies', nom: 'Lectura, Idioma, Notes privades i Finestres locals', codi: 'este navegador', valor: '3 ajustos', proporcio: 3 / 13 }
    ]),
    mostresH3: 'Mostres visuals dels controls que trobaràs a l’aplicació',
    mostresIntro:
      'Estes <strong>dues mostres estàtiques</strong> t’ensenyen l’aspecte real dels <strong>botons principals</strong> abans d’entrar a cada pantalla: estan marcades com a <strong>exemples de lectura</strong> perquè pugues reconéixer el <strong>selector d’assistència RSVP</strong> amb avís d’horari i l’<strong>interruptor del Mode Bancal</strong> sense alterar <strong>cap dada real</strong> de la teua sessió ni <strong>cap preferència desada</strong>.',
    mostraRsvpCaption: 'Mostra de lectura · Selector d’assistència (Assistiré / Potser / No assistiré) i avís de coincidència horària al Calendari.',
    mostraRsvpActe: 'Taller de pedra en sec a la plaça',
    mostraRsvpData: 'Dissabte 17 d’octubre · 10:00 – 11:30',
    mostraRsvpAvisTitol: 'Coincidència d’horari a la teua agenda:',
    mostraRsvpAvisCos: 'Coincidix en horari amb «Mercat de llavors», on també has marcat «Assistiré». La teua resposta es conserva igualment.',
    mostraSeniorCaption: 'Mostra de lectura · Interruptor d’un sol toc del Mode Bancal (Sol i Lletra Gran: lletra gran, 56 px i contrast màxim AAA ≥ 7:1).',
    mostraSeniorEtiqueta: TEXTOS_MODE_SENIOR.ca.xip,
    mostraSeniorEstat: 'Actiu · 56 × 56 px · Contrast AAA ≥ 7:1',
    einesExtraH3: 'Més eines obertes i documentació de Sóc de Poble',
    einesExtraParagraf:
      'A més dels tretze passos anteriors, des d’ací pots obrir directament <strong>El Bar (TPV d’associacions)</strong> per a barres populars sense tiquet fiscal, l’<strong>Arbre Genealògic</strong> amb xifrat opcional per frase de pas, el <strong>Lector de notícies</strong> comarcal, el teu <strong>Perfil personal i d’entitats</strong> i la <strong>Wiki de Poble</strong> en format de <strong>lectura vertical contínua</strong> sense <strong>cap taula ampla</strong>.',
    enllacosExtra: Object.freeze([
      { to: '/plugin/tpv', text: 'Obri El Bar (TPV)' },
      { to: '/plugin/genealogia', text: 'Obri l’Arbre Genealògic' },
      { to: '/plugin/rss', text: 'Obri el Lector de notícies' },
      { to: '/el-meu-perfil', text: 'Obri el meu Perfil' },
      { to: '/wikidepoble', text: 'Obri la Wiki de Poble' }
    ])
  }),
  es: Object.freeze({
    quadreH3: 'Mapa rápido de capacidades y garantías de lectura',
    quadreIntro:
      'Este cuadro resume las <strong>cifras reales verificadas</strong> que encontrarás al recorrer la guía: <strong>cinco lenguas completas</strong> de interfaz, <strong>trece pasos guiados</strong> con acceso directo, <strong>seis herramientas comunitarias</strong> en pruebas abiertas y el <strong>Modo Bancal</strong> con dianas de <strong>56 × 56 píxeles</strong> y <strong>cero publicidad comercial</strong>.',
    estatText: 'Guía viva · 5 lenguas activas',
    periode: 'Corte verificado del código · Oleada R32.16',
    xifres: Object.freeze([
      { clau: 'llengues', nom: 'Lenguas de interfaz', valor: '5', lector: '5 lenguas de interfaz: valenciano, castellano, inglés, euskera y gallego' },
      { clau: 'passos', nom: 'Pasos con enlace', valor: '13', lector: '13 pasos guiados con enlace directo' },
      { clau: 'dianes', nom: 'Diana Modo Bancal', valor: '56 px', lector: '56 por 56 píxeles de diana mínima en Modo Bancal' },
      { clau: 'anuncis', nom: 'Anuncios y comisiones', valor: '0 €', lector: 'Cero euros en comisiones y cero anuncios comerciales' }
    ]),
    ranquingTitol: 'Dónde se guardan los datos según cada espacio',
    ranquingFiles: Object.freeze([
      { clau: 'comunitat', nom: 'Vida compartida (Muro, Mercado, Calendario, Mapa, Chat)', codi: 'servidor de Sóc de Poble', valor: '5 espacios', proporcio: 5 / 13 },
      { clau: 'dispositiu', nom: 'Herramientas personales y de asociación (Despensa, Salud, Gestoría, Bar, Genealogía)', codi: 'en tu dispositivo', valor: '5 herramientas', proporcio: 5 / 13 },
      { clau: 'preferencies', nom: 'Lectura, Idioma, Notas privadas y Ventanas locales', codi: 'este navegador', valor: '3 ajustes', proporcio: 3 / 13 }
    ]),
    mostresH3: 'Muestras visuales de los controles que encontrarás en la aplicación',
    mostresIntro:
      'Estas <strong>dos muestras estáticas</strong> te enseñan el aspecto real de los <strong>botones principales</strong> antes de entrar en cada pantalla: están marcadas como <strong>ejemplos de lectura</strong> para que reconozcas el <strong>selector de asistencia RSVP</strong> con aviso horario y el <strong>interruptor del Modo Bancal</strong> sin alterar <strong>ningún dato real</strong> de tu sesión ni <strong>ninguna preferencia guardada</strong>.',
    mostraRsvpCaption: 'Muestra de lectura · Selector de asistencia (Asistiré / Quizá / No asistiré) y aviso de coincidencia horaria en el Calendario.',
    mostraRsvpActe: 'Taller de piedra en seco en la plaza',
    mostraRsvpData: 'Sábado 17 de octubre · 10:00 – 11:30',
    mostraRsvpAvisTitol: 'Coincidencia de horario en tu agenda:',
    mostraRsvpAvisCos: 'Coincide en horario con «Mercado de semillas», donde también has marcado «Asistiré». Tu respuesta se conserva igualmente.',
    mostraSeniorCaption: 'Muestra de lectura · Interruptor de un solo toque del Modo Bancal (Sol y Letra Grande: letra grande, 56 px y contraste máximo AAA ≥ 7:1).',
    mostraSeniorEtiqueta: TEXTOS_MODE_SENIOR.es.xip,
    mostraSeniorEstat: 'Activo · 56 × 56 px · Contraste AAA ≥ 7:1',
    einesExtraH3: 'Más herramientas abiertas y documentación de Sóc de Poble',
    einesExtraParagraf:
      'Además de los trece pasos anteriores, desde aquí puedes abrir directamente <strong>El Bar (TPV de asociaciones)</strong> para barras populares sin tique fiscal, el <strong>Árbol Genealógico</strong> con cifrado opcional por frase de paso, el <strong>Lector de noticias</strong> comarcal, tu <strong>Perfil personal y de entidades</strong> y la <strong>Wiki de Poble</strong> en formato de <strong>lectura vertical continua</strong> sin <strong>ninguna tabla ancha</strong>.',
    enllacosExtra: Object.freeze([
      { to: '/plugin/tpv', text: 'Abre El Bar (TPV)' },
      { to: '/plugin/genealogia', text: 'Abre el Árbol Genealógico' },
      { to: '/plugin/rss', text: 'Abre el Lector de noticias' },
      { to: '/el-meu-perfil', text: 'Abre mi Perfil' },
      { to: '/wikidepoble', text: 'Abre la Wiki de Poble' }
    ])
  }),
  en: Object.freeze({
    quadreH3: 'Quick capability map and reading guarantees',
    quadreIntro:
      'This board summarises the <strong>verified live figures</strong> covered across this guide: <strong>five full interface languages</strong>, <strong>thirteen guided steps</strong> with direct links, <strong>six community tools</strong> in open testing and one-tap <strong>Bancal Mode</strong> featuring <strong>56 × 56 pixel targets</strong> and <strong>zero commercial advertising</strong>.',
    estatText: 'Living guide · 5 active languages',
    periode: 'Verified codebase snapshot · Wave R32.16',
    xifres: Object.freeze([
      { clau: 'llengues', nom: 'Interface languages', valor: '5', lector: '5 interface languages: Valencian, Spanish, English, Basque and Galician' },
      { clau: 'passos', nom: 'Linked steps', valor: '13', lector: '13 guided steps with direct links' },
      { clau: 'dianes', nom: 'Bancal Mode target', valor: '56 px', lector: '56 by 56 pixel minimum target in Bancal Mode' },
      { clau: 'anuncis', nom: 'Ads and commissions', valor: '0 €', lector: 'Zero euros in commissions and zero commercial ads' }
    ]),
    ranquingTitol: 'Where your data lives in each space',
    ranquingFiles: Object.freeze([
      { clau: 'comunitat', nom: 'Shared village life (Wall, Market, Calendar, Map, Chat)', codi: 'the Sóc de Poble server', valor: '5 spaces', proporcio: 5 / 13 },
      { clau: 'dispositiu', nom: 'Personal and group tools (Pantry, Health, Bookkeeping, Bar, Family Tree)', codi: 'on your device', valor: '5 tools', proporcio: 5 / 13 },
      { clau: 'preferencies', nom: 'Reading, Language, Private Notes and Local Windows', codi: 'this browser', valor: '3 settings', proporcio: 3 / 13 }
    ]),
    mostresH3: 'Visual previews of the controls you will meet in the app',
    mostresIntro:
      'These <strong>two static specimens</strong> show the exact look of the <strong>primary controls</strong> before you open each screen: they are marked as <strong>inert reading examples</strong> so you can recognise the <strong>RSVP attendance selector</strong> with schedule notice and the <strong>Bancal Mode switch</strong> without changing <strong>any live session data</strong> or <strong>saved browser preferences</strong>.',
    mostraRsvpCaption: 'Reading specimen · Attendance selector (Attending / Maybe / Not attending) and schedule overlap notice on the Calendar.',
    mostraRsvpActe: 'Dry-stone workshop in the square',
    mostraRsvpData: 'Saturday 17 October · 10:00 – 11:30',
    mostraRsvpAvisTitol: 'Schedule overlap in your calendar:',
    mostraRsvpAvisCos: 'Overlaps in time with «Seed swap market», which you also marked as «Attending». Your response is kept either way.',
    mostraSeniorCaption: 'Reading specimen · One-tap Bancal Mode switch (Sun & Large Text: large type, 56 px targets and maximum AAA contrast ≥ 7:1).',
    mostraSeniorEtiqueta: TEXTOS_MODE_SENIOR.en.xip,
    mostraSeniorEstat: 'Active · 56 × 56 px · Contrast AAA ≥ 7:1',
    einesExtraH3: 'Additional open tools and Sóc de Poble documentation',
    einesExtraParagraf:
      'Beyond the thirteen steps above, you can jump straight to <strong>The Bar (association POS)</strong> for community counters without fiscal receipts, the passphrase-protected <strong>Family Tree</strong>, the regional <strong>News Reader</strong>, your <strong>personal and organisation Profile</strong> and the <strong>Village Wiki</strong> formatted for <strong>continuous vertical reading</strong> without <strong>any wide tables</strong>.',
    enllacosExtra: Object.freeze([
      { to: '/plugin/tpv', text: 'Open The Bar (POS)' },
      { to: '/plugin/genealogia', text: 'Open the Family Tree' },
      { to: '/plugin/rss', text: 'Open the News Reader' },
      { to: '/el-meu-perfil', text: 'Open my Profile' },
      { to: '/wikidepoble', text: 'Open the Village Wiki' }
    ])
  }),
  eu: Object.freeze({
    quadreH3: 'Gaitasunen mapa azkarra eta irakurketa-bermeak',
    quadreIntro:
      'Taula honek gidan zehar aurkituko dituzun <strong>egiaztatutako zifra errealak</strong> laburbiltzen ditu: <strong>interfazeko bost hizkuntza</strong> oso, esteka zuzena duten <strong>hamahiru urrats gidatu</strong>, proba irekietan dauden <strong>komunitateko sei tresna</strong> eta <strong>Bankal Modua</strong> <strong>56 × 56 pixeleko dianekin</strong> eta <strong>zero publizitate komertzialekin</strong>.',
    estatText: 'Gida bizia · 5 hizkuntza aktibo',
    periode: 'Egiaztatutako kode-moztea · R32.16 olatua',
    xifres: Object.freeze([
      { clau: 'llengues', nom: 'Interfaze-hizkuntzak', valor: '5', lector: '5 interfaze-hizkuntza: valentziera, gaztelania, ingelesa, euskara eta galegoa' },
      { clau: 'passos', nom: 'Estekadun urratsak', valor: '13', lector: 'Esteka zuzena duten 13 urrats gidatu' },
      { clau: 'dianes', nom: 'Bankal Moduko diana', valor: '56 px', lector: 'Gutxienez 56 bider 56 pixeleko diana Bankal Moduan' },
      { clau: 'anuncis', nom: 'Iragarkiak eta komisioak', valor: '0 €', lector: 'Zero euro komisiotan eta zero iragarki komertzial' }
    ]),
    ranquingTitol: 'Non gordetzen diren datuak gune bakoitzaren arabera',
    ranquingFiles: Object.freeze([
      { clau: 'comunitat', nom: 'Bizitza partekatua (Horma, Merkatua, Egutegia, Mapa, Txata)', codi: 'Sóc de Pobleren zerbitzaria', valor: '5 gune', proporcio: 5 / 13 },
      { clau: 'dispositiu', nom: 'Tresna pertsonal eta elkartekoak (Jakitegia, Osasuna, Gestoria, Taberna, Genealogia)', codi: 'zure gailuan', valor: '5 tresna', proporcio: 5 / 13 },
      { clau: 'preferencies', nom: 'Irakurketa, Hizkuntza, Ohar pribatuak eta Leiho lokalak', codi: 'nabigatzaile hau', valor: '3 ezarpen', proporcio: 3 / 13 }
    ]),
    mostresH3: 'Aplikazioan aurkituko dituzun kontrolen lagin bisualak',
    mostresIntro:
      '<strong>Bi lagin estatiko</strong> hauek pantaila bakoitzean sartu aurretik <strong>botoi nagusien</strong> benetako itxura erakusten dizute: <strong>irakurketa-adibide geldo</strong> gisa markatuta daude, ordutegi-oharra duen <strong>RSVP asistentzia-hautatzailea</strong> eta <strong>Bankal Moduaren etengailua</strong> ezagutzeko, zure saioko <strong>inolako datu errealik</strong> edo <strong>gordetako hobespenik</strong> aldatu gabe.',
    mostraRsvpCaption: 'Irakurketa-lagina · Asistentzia-hautatzailea (Joango naiz / Beharbada / Ez naiz joango) eta ordutegi-gainjartze oharra Egutegian.',
    mostraRsvpActe: 'Harri lehorreko tailerra plazan',
    mostraRsvpData: 'Urriak 17, larunbata · 10:00 – 11:30',
    mostraRsvpAvisTitol: 'Ordutegi-gainjartzea zure agendan:',
    mostraRsvpAvisCos: 'Ordutegian bat dator «Hazi-merkatua» ekitaldiarekin, eta han ere «Joango naiz» markatu duzu. Zure erantzuna berdin gordeko da.',
    mostraSeniorCaption: 'Irakurketa-lagina · Ukitu bakarreko Bankal Moduaren etengailua (Eguzkia eta Letra Handia: letra handia, 56 px eta AAA kontraste handiena ≥ 7:1).',
    mostraSeniorEtiqueta: TEXTOS_MODE_SENIOR.eu.xip,
    mostraSeniorEstat: 'Aktibo · 56 × 56 px · Kontrastea AAA ≥ 7:1',
    einesExtraH3: 'Tresna ireki gehiago eta Sóc de Pobleren dokumentazioa',
    einesExtraParagraf:
      'Aurreko hamahiru urratsez gain, hemendik zuzenean ireki ditzakezu <strong>Taberna (elkarteen TPVa)</strong> tiketa fiskalik gabeko txosnetarako, pasaesaldidun <strong>Zuhaitz Genealogikoa</strong>, eskualdeko <strong>Albiste-irakurgailua</strong>, zure <strong>Profil pertsonal eta elkartekoa</strong> eta <strong>Herriko Wikia</strong> <strong>irakurketa bertikal jarraituan</strong> antolatuta <strong>taula zabalik gabe</strong>.',
    enllacosExtra: Object.freeze([
      { to: '/plugin/tpv', text: 'Ireki Taberna (TPV)' },
      { to: '/plugin/genealogia', text: 'Ireki Zuhaitz Genealogikoa' },
      { to: '/plugin/rss', text: 'Ireki Albiste-irakurgailua' },
      { to: '/el-meu-perfil', text: 'Ireki nire Profila' },
      { to: '/wikidepoble', text: 'Ireki Herriko Wikia' }
    ])
  }),
  gl: Object.freeze({
    quadreH3: 'Mapa rápido de capacidades e garantías de lectura',
    quadreIntro:
      'Este cadro resume as <strong>cifras reais verificadas</strong> que atoparás ao percorrer a guía: <strong>cinco linguas completas</strong> de interface, <strong>trece pasos guiados</strong> con acceso directo, <strong>seis ferramentas comunitarias</strong> en probas abertas e o <strong>Modo Bancal</strong> con dianas de <strong>56 × 56 píxeles</strong> e <strong>cero publicidade comercial</strong>.',
    estatText: 'Guía viva · 5 linguas activas',
    periode: 'Corte verificado do código · Onda R32.16',
    xifres: Object.freeze([
      { clau: 'llengues', nom: 'Linguas de interface', valor: '5', lector: '5 linguas de interface: valenciano, castelán, inglés, éuscaro e galego' },
      { clau: 'passos', nom: 'Pasos con ligazón', valor: '13', lector: '13 pasos guiados con ligazón directa' },
      { clau: 'dianes', nom: 'Diana Modo Bancal', valor: '56 px', lector: '56 por 56 píxeles de diana mínima en Modo Bancal' },
      { clau: 'anuncis', nom: 'Anuncios e comisións', valor: '0 €', lector: 'Cero euros en comisións e cero anuncios comerciais' }
    ]),
    ranquingTitol: 'Onde se gardan os datos segundo cada espazo',
    ranquingFiles: Object.freeze([
      { clau: 'comunitat', nom: 'Vida compartida (Muro, Mercado, Calendario, Mapa, Chat)', codi: 'servidor de Sóc de Poble', valor: '5 espazos', proporcio: 5 / 13 },
      { clau: 'dispositiu', nom: 'Ferramentas persoais e de asociación (Despensa, Saúde, Xestoría, Bar, Xenealoxía)', codi: 'no teu dispositivo', valor: '5 ferramentas', proporcio: 5 / 13 },
      { clau: 'preferencies', nom: 'Lectura, Lingua, Notas privadas e Xanelas locais', codi: 'este navegador', valor: '3 axustes', proporcio: 3 / 13 }
    ]),
    mostresH3: 'Mostras visuais dos controis que atoparás na aplicación',
    mostresIntro:
      'Estas <strong>dúas mostras estáticas</strong> amósanche o aspecto real dos <strong>botóns principais</strong> antes de entrar en cada pantalla: están marcadas como <strong>exemplos de lectura</strong> para que recoñezas o <strong>selector de asistencia RSVP</strong> con aviso horario e o <strong>interruptor do Modo Bancal</strong> sen alterar <strong>ningún dato real</strong> da túa sesión nin <strong>ningunha preferencia gardada</strong>.',
    mostraRsvpCaption: 'Mostra de lectura · Selector de asistencia (Asistirei / Quizais / Non asistirei) e aviso de coincidencia horaria no Calendario.',
    mostraRsvpActe: 'Obradoiro de pedra en seco na praza',
    mostraRsvpData: 'Sábado 17 de outubro · 10:00 – 11:30',
    mostraRsvpAvisTitol: 'Coincidencia de horario na túa axenda:',
    mostraRsvpAvisCos: 'Coincide en horario con «Mercado de sementes», onde tamén marcaches «Asistirei». A túa resposta consérvase igualmente.',
    mostraSeniorCaption: 'Mostra de lectura · Interruptor dun só toque do Modo Bancal (Sol e Letra Grande: letra grande, 56 px e contraste máximo AAA ≥ 7:1).',
    mostraSeniorEtiqueta: TEXTOS_MODE_SENIOR.gl.xip,
    mostraSeniorEstat: 'Activo · 56 × 56 px · Contraste AAA ≥ 7:1',
    einesExtraH3: 'Máis ferramentas abertas e documentación de Sóc de Poble',
    einesExtraParagraf:
      'Ademais dos trece pasos anteriores, dende aquí podes abrir directamente <strong>O Bar (TPV de asociacións)</strong> para barras populares sen tícket fiscal, a <strong>Árbore Xenealóxica</strong> con cifrado opcional por frase de paso, o <strong>Lector de novas</strong> comarcal, o teu <strong>Perfil persoal e de entidades</strong> e a <strong>Wiki de Poble</strong> en formato de <strong>lectura vertical continua</strong> sen <strong>ningunha táboa ancha</strong>.',
    enllacosExtra: Object.freeze([
      { to: '/plugin/tpv', text: 'Abre O Bar (TPV)' },
      { to: '/plugin/genealogia', text: 'Abre a Árbore Xenealóxica' },
      { to: '/plugin/rss', text: 'Abre o Lector de novas' },
      { to: '/el-meu-perfil', text: 'Abre o meu Perfil' },
      { to: '/wikidepoble', text: 'Abre a Wiki de Poble' }
    ])
  })
});

export function textosAparadorGuia(llengua = 'ca') {
  const base = String(llengua || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_APARADOR_GUIA, base) ? TEXTOS_APARADOR_GUIA[base] : TEXTOS_APARADOR_GUIA.ca;
}
