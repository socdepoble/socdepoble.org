/**
 * dadesRegistreCanvis.js — Índex lleuger i atòmic de les versions de Sóc de Poble
 * en 5 llengües (ca, es, en, eu, gl) per a /disseny?categoria=registre-de-canvis
 * (Onada v1.2.25 · Lot G3 · IDEA-354).
 *
 * Dissenyat per a viatjar exclusivament en tros diferit (+0 B al nucli WP).
 * L'arxiu històric extens (2013 – anteriors) continua a pageContent.versionsHistoric.js
 * darrere d'import() sota demanda dins ArxiuHistoricVersions.jsx.
 */

export const LLENGUES_REGISTRE_CANVIS = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export function normalitzaLlenguaRc(llengua = 'ca') {
  const codi = String(llengua || 'ca').trim().toLowerCase().slice(0, 2);
  return LLENGUES_REGISTRE_CANVIS.includes(codi) ? codi : 'ca';
}

export const RUTA_REGISTRE_CANVIS = '/disseny?categoria=registre-de-canvis&item=registre-de-canvis-conjunt';

export const TEXTOS_REGISTRE_CANVIS = Object.freeze({
  ca: Object.freeze({
    categoriaNom: 'Registre de canvis',
    vistaConjunt: 'Vista de conjunt',
    subtitolConjunt: 'Historial atòmic d’entregues i estat dels canals oficials',
    expandirTot: 'Expandir tot',
    plegarTot: 'Plegar tot',
    millores: (n) => `Millores (${n})`,
    correccions: (n) => `Correccions (${n})`,
    obert: 'Obert',
    tancat: 'Tancat',
    obriFitxa: 'Obri la versió',
    tornarConjunt: 'Vista de conjunt',
    versioAnterior: 'Versió anterior',
    versioSeguent: 'Versió següent',
    arxiuHistoricIntro: 'L’arxiu històric complet (des del 2013 fins a la v1.2.20) es carrega només quan el demanes, per a mantindre l’aplicació lleugera.',
    abastTitol: 'Estat i abast d’esta entrega',
    peuVersioAria: (v) => `Registre de canvis · v${v}`,
    peuVersioTitle: (v) => `Registre de canvis · v${v}`
  }),
  es: Object.freeze({
    categoriaNom: 'Registro de cambios',
    vistaConjunt: 'Vista general',
    subtitolConjunt: 'Historial atómico de entregas y estado de los canales oficiales',
    expandirTot: 'Expandir todo',
    plegarTot: 'Plegar todo',
    millores: (n) => `Mejoras (${n})`,
    correccions: (n) => `Correcciones (${n})`,
    obert: 'Abierto',
    tancat: 'Cerrado',
    obriFitxa: 'Abrir esta versión',
    tornarConjunt: 'Vista general',
    versioAnterior: 'Versión anterior',
    versioSeguent: 'Versión siguiente',
    arxiuHistoricIntro: 'El archivo histórico completo (desde 2013 hasta la v1.2.20) se carga solo cuando lo pides, para mantener la aplicación ligera.',
    abastTitol: 'Estado y alcance de esta entrega',
    peuVersioAria: (v) => `Registro de cambios · v${v}`,
    peuVersioTitle: (v) => `Registro de cambios · v${v}`
  }),
  en: Object.freeze({
    categoriaNom: 'Changelog',
    vistaConjunt: 'Overview',
    subtitolConjunt: 'Atomic release history and live official channel status',
    expandirTot: 'Expand all',
    plegarTot: 'Collapse all',
    millores: (n) => `Improvements (${n})`,
    correccions: (n) => `Fixes (${n})`,
    obert: 'Open',
    tancat: 'Closed',
    obriFitxa: 'Open release',
    tornarConjunt: 'Overview',
    versioAnterior: 'Previous release',
    versioSeguent: 'Next release',
    arxiuHistoricIntro: 'The full historical archive (from 2013 up to v1.2.20) loads on demand only, keeping the app lightweight.',
    abastTitol: 'Status and scope of this release',
    peuVersioAria: (v) => `Changelog · v${v}`,
    peuVersioTitle: (v) => `Changelog · v${v}`
  }),
  eu: Object.freeze({
    categoriaNom: 'Aldaketen erregistroa',
    vistaConjunt: 'Ikuspegi orokorra',
    subtitolConjunt: 'Bertsioen historia atomikoa eta kanal ofizialen egoera',
    expandirTot: 'Zabaldu guztiak',
    plegarTot: 'Tolestu guztiak',
    millores: (n) => `Hobekuntzak (${n})`,
    correccions: (n) => `Zuzenketak (${n})`,
    obert: 'Irekita',
    tancat: 'Itxita',
    obriFitxa: 'Ireki bertsioa',
    tornarConjunt: 'Ikuspegi orokorra',
    versioAnterior: 'Aurreko bertsioa',
    versioSeguent: 'Hurrengo bertsioa',
    arxiuHistoricIntro: 'Artxibo historiko osoa (2013tik v1.2.20ra arte) eskatzen duzunean bakarrik kargatzen da, aplikazioa arin mantentzeko.',
    abastTitol: 'Entrega honen egoera eta irismena',
    peuVersioAria: (v) => `Aldaketen erregistroa · v${v}`,
    peuVersioTitle: (v) => `Aldaketen erregistroa · v${v}`
  }),
  gl: Object.freeze({
    categoriaNom: 'Rexistro de cambios',
    vistaConjunt: 'Vista de conxunto',
    subtitolConjunt: 'Historial atómico de entregas e estado das canles oficiais',
    expandirTot: 'Expandir todo',
    plegarTot: 'Pregar todo',
    millores: (n) => `Melloras (${n})`,
    correccions: (n) => `Correccións (${n})`,
    obert: 'Aberto',
    tancat: 'Pechado',
    obriFitxa: 'Abrir a versión',
    tornarConjunt: 'Vista de conxunto',
    versioAnterior: 'Versión anterior',
    versioSeguent: 'Versión seguinte',
    arxiuHistoricIntro: 'O arquivo histórico completo (desde 2013 ata a v1.2.20) cárgase só cando o pides, para manter a aplicación lixeira.',
    abastTitol: 'Estado e alcance desta entrega',
    peuVersioAria: (v) => `Rexistro de cambios · v${v}`,
    peuVersioTitle: (v) => `Rexistro de cambios · v${v}`
  })
});

export const VERSIONS_REGISTRE = Object.freeze([
  Object.freeze({
    id: 'v1-2-25',
    itemId: 'registre-de-canvis-v1-2-25',
    versio: 'v1.2.25',
    data: Object.freeze({
      ca: '25 de novembre de 2026',
      es: '25 de noviembre de 2026',
      en: '25 November 2026',
      eu: '2026ko azaroaren 25a',
      gl: '25 de novembro de 2026'
    }),
    titol: Object.freeze({
      ca: 'Integrada en la v1.2.26 · onada v1.2.25 (Registre de canvis a /disseny i navegació per teclat)',
      es: 'Integrada en la v1.2.26 · oleada v1.2.25 (Registro de cambios en /disseny y navegación por teclado)',
      en: 'Integrated into v1.2.26 · wave v1.2.25 (Changelog in /disseny and keyboard navigation)',
      eu: 'v1.2.26an integratua · v1.2.25 olatua (Aldaketen erregistroa /disseny atalean eta teklatu-nabigazioa)',
      gl: 'Integrada na v1.2.26 · onda v1.2.25 (Rexistro de cambios en /disseny e navegación por teclado)'
    }),
    resum: Object.freeze({
      ca: 'Esta onada no es va publicar a soles: arriba a la web i al connector amb la v1.2.26 (26 de novembre de 2026), i la crònica completa és la de la v1.2.26 a /versions.',
      es: 'Esta oleada no se publicó sola: llega a la web y al conector con la v1.2.26 (26 de noviembre de 2026), y la crónica completa es la de la v1.2.26 en /versions.',
      en: 'This wave was not released on its own: it reaches the website and the plugin with v1.2.26 (26 November 2026), and the full chronicle is the v1.2.26 one in /versions.',
      eu: 'Olatu hau ez zen bakarrik argitaratu: v1.2.26rekin iristen da webera eta konektorera (2026ko azaroaren 26a), eta kronika osoa /versions orriko v1.2.26koa da.',
      gl: 'Esta onda non se publicou soa: chega á web e ao conector coa v1.2.26 (26 de novembro de 2026), e a crónica completa é a da v1.2.26 en /versions.'
    }),
    abast: Object.freeze({
      ca: 'No publicada a soles: integrada en la v1.2.26 (web 1.2.26; connector 1.1.33 al repositori i 1.1.32 a WordPress.org). Les aplicacions de les botigues continuen en la 1.2.24 (build 29).',
      es: 'No publicada sola: integrada en la v1.2.26 (web 1.2.26; conector 1.1.33 en el repositorio y 1.1.32 en WordPress.org). Las aplicaciones de las tiendas siguen en la 1.2.24 (build 29).',
      en: 'Not released on its own: integrated into v1.2.26 (website 1.2.26; plugin 1.1.33 in the repository and 1.1.32 on WordPress.org). The store apps stay on 1.2.24 (build 29).',
      eu: 'Ez zen bakarrik argitaratu: v1.2.26an integratua (weba 1.2.26; konektorea 1.1.33 biltegian eta 1.1.32 WordPress.org-en). Denden aplikazioak 1.2.24an jarraitzen dute (29. builda).',
      gl: 'Non publicada soa: integrada na v1.2.26 (web 1.2.26; conector 1.1.33 no repositorio e 1.1.32 en WordPress.org). As aplicacións das tendas seguen na 1.2.24 (build 29).'
    }),
    millores: Object.freeze({
      ca: [
        'Disseny (IDEA-354): Registre de canvis atòmic en tres columnes amb blocs desplegables accessibles i versió clicable al peu del menú lateral.',
        'Teclat (IDEA-355): navegació fluida amb fletxes entre columnes i elements respectant els editors de text i els formularis.'
      ],
      es: [
        'Diseño (IDEA-354): Registro de cambios atómico en tres columnas con bloques desplegables accesibles y versión clicable al pie del menú lateral.',
        'Teclado (IDEA-355): navegación fluida con flechas entre columnas y elementos respetando los editores de texto y formularios.'
      ],
      en: [
        'Design (IDEA-354): atomic 3-column Changelog with accessible collapsible sections and clickable version footer in the sidebar.',
        'Keyboard (IDEA-355): smooth arrow-key navigation across columns and items while keeping text editors and forms intact.'
      ],
      eu: [
        'Diseinua (IDEA-354): 3 zutabeko aldaketen erregistro atomikoa bloke tolesgarri irisgarriekin eta alboko menuaren oinean klik egiteko bertsioarekin.',
        'Teklatua (IDEA-355): zutabeen eta elementuen arteko gezi-nabigazio arina testu-editoreak eta formularioak errespetatuz.'
      ],
      gl: [
        'Deseño (IDEA-354): Rexistro de cambios atómico en tres columnas con bloques despregables accesibles e versión clicable ao pé do menú lateral.',
        'Teclado (IDEA-355): navegación fluída con frechas entre columnas e elementos respectando os editores de texto e formularios.'
      ]
    }),
    correccions: Object.freeze({
      ca: [
        'Registre de canvis en tros diferit sense carregar l’arxiu històric a l’arrencada.',
        'Criteris d’accessibilitat i contrast AAA aplicats als blocs desplegables i a la navegació per teclat.'
      ],
      es: [
        'Registro de cambios en bloque diferido sin cargar el archivo histórico en el arranque.',
        'Criterios de accesibilidad y contraste AAA aplicados a los bloques desplegables y a la navegación por teclado.'
      ],
      en: [
        'Lazy-loaded changelog view without pulling the historical archive into initial startup.',
        'AAA accessibility and contrast applied to collapsible sections and keyboard navigation.'
      ],
      eu: [
        'Aldaketen erregistroa karga geroratuan, artxibo historikoa abiaraztean kargatu gabe.',
        'AAA irisgarritasun- eta kontraste-irizpideak bloke tolesgarrietan eta teklatu-nabigazioan aplikatuta.'
      ],
      gl: [
        'Rexistro de cambios en bloque diferido sen cargar o arquivo histórico no arranque.',
        'Criterios de accesibilidade e contraste AAA aplicados aos bloques despregables e á navegación por teclado.'
      ]
    })
  }),
  Object.freeze({
    id: 'v1-2-24',
    itemId: 'registre-de-canvis-v1-2-24',
    versio: 'v1.2.24',
    data: Object.freeze({
      ca: '24 de novembre de 2026',
      es: '24 de noviembre de 2026',
      en: '24 November 2026',
      eu: '2026ko azaroaren 24a',
      gl: '24 de novembro de 2026'
    }),
    titol: Object.freeze({
      ca: 'Reconeixements en cinc llengües, «Elimina per a tothom» al Xat i compartir que sempre respon',
      es: 'Reconocimientos en cinco lenguas, «Eliminar para todos» en el Chat y compartir que siempre responde',
      en: 'Acknowledgements in five languages, «Delete for everyone» in Chat and reliable sharing',
      eu: 'Esker onak bost hizkuntzetan, «Ezabatu guztiontzat» Txatean eta beti erantzuten duen partekatzea',
      gl: 'Recoñecementos en cinco linguas, «Eliminar para todos» no Chat e compartir que sempre responde'
    }),
    resum: Object.freeze({
      ca: 'Obri la pàgina pública de reconeixements i fonts d’inspiració en les 5 llengües, incorpora «Elimina per a tothom» als missatges propis del Xat i garantix resposta del botó Compartir en qualsevol dispositiu.',
      es: 'Abre la página pública de reconocimientos y fuentes de inspiración en las 5 lenguas, incorpora «Eliminar para todos» en mensajes propios del Chat y garantiza respuesta del botón Compartir en cualquier dispositivo.',
      en: 'Opens the public acknowledgements page in all 5 languages, adds «Delete for everyone» on own Chat messages and guarantees a working fallback on the Share button.',
      eu: 'Esker onen orri publikoa 5 hizkuntzetan irekitzen du, Txateko zure mezuetan «Ezabatu guztiontzat» gehitzen du eta Partekatu botoiak edozein gailutan erantzutea bermatzen du.',
      gl: 'Abre a páxina pública de recoñecementos nas 5 linguas, engade «Eliminar para todos» nas mensaxes propias do Chat e garante resposta do botón Compartir en calquera dispositivo.'
    }),
    abast: Object.freeze({
      ca: 'Versió 1.2.24 (build 29) al repositori; connector WordPress 1.1.32 preparat sobre la 1.1.31 publicada.',
      es: 'Versión 1.2.24 (build 29) en el repositorio; conector WordPress 1.1.32 preparado sobre la 1.1.31 publicada.',
      en: 'Version 1.2.24 (build 29) in repository; WordPress plugin 1.1.32 prepared over published 1.1.31.',
      eu: '1.2.24 bertsioa (29. builda) biltegian; WordPress 1.1.32 konektorea prestatuta argitaratutako 1.1.31 gainean.',
      gl: 'Versión 1.2.24 (build 29) no repositorio; conector WordPress 1.1.32 preparado sobre a 1.1.31 publicada.'
    }),
    millores: Object.freeze({
      ca: [
        'Nova pàgina pública Reconeixements i fonts d’inspiració en 5 llengües.',
        '«Elimina per a tothom» sense límit temporal als missatges propis i d’entitats autoritzades al Xat.',
        'El botó «Compartir» copia l’enllaç o mostra l’adreça 15 s si el menú del dispositiu no s’obri.',
        'Al·lèrgens clars i prudents al Bar i al Rebost, i preus sense equívocs en factures de la Gestoria.'
      ],
      es: [
        'Nueva página pública Reconocimientos y fuentes de inspiración en 5 lenguas.',
        '«Eliminar para todos» sin límite de tiempo en mensajes propios y de entidades autorizadas en el Chat.',
        'El botón «Compartir» copia el enlace o muestra la dirección 15 s si el menú del dispositivo no se abre.',
        'Alérgenos claros y prudentes en el Bar y la Despensa, y precios sin equívocos en facturas de Gestoría.'
      ],
      en: [
        'New public Acknowledgements & sources of inspiration page in all 5 languages.',
        '«Delete for everyone» without time limits on your own and authorised organisation Chat messages.',
        'The «Share» button copies the link or displays the URL for 15 s when native sharing is unavailable.',
        'Cautious allergen labels in Bar and Pantry, plus unambiguous pricing in Management invoices.'
      ],
      eu: [
        'Esker onak eta inspirazio-iturriak orri publiko berria 5 hizkuntzetan.',
        '«Ezabatu guztiontzat» denbora-mugarik gabe zure eta baimendutako erakundeen Txat mezuetan.',
        '«Partekatu» botoiak esteka kopiatzen du edo helbidea 15 s erakusten du jatorrizko menua ireki ezin bada.',
        'Alergeno argiak Tabernan eta Jakitegian, eta zalantzarik gabeko prezioak Gestoriako fakturetan.'
      ],
      gl: [
        'Nova páxina pública Recoñecementos e fontes de inspiración nas 5 linguas.',
        '«Eliminar para todos» sen límite de tempo nas mensaxes propias e de entidades autorizadas no Chat.',
        'O botón «Compartir» copia a ligazón ou amosa o enderezo 15 s se o menú nativo non abre.',
        'Alérxenos claros e prudentes no Bar e na Despensa, e prezos sen equívocos nas facturas da Xestoría.'
      ]
    }),
    correccions: Object.freeze({
      ca: [
        'Els enllaços externs s’obrin sempre en pestanya nova i les portades compartides viatgen lleugeres.',
        'Pujada resistent de fotografies grans en dispositius modestos sense congelar la pantalla ni perdre esborranys.'
      ],
      es: [
        'Los enlaces externos se abren siempre en pestaña nueva y las portadas compartidas viajan ligeras.',
        'Subida resistente de fotografías grandes en dispositivos modestos sin congelar la pantalla ni perder borradores.'
      ],
      en: [
        'External links always open in a new tab and shared cover images stay lightweight.',
        'Resilient large photo uploads on modest devices without freezing the screen or losing drafts.'
      ],
      eu: [
        'Kanpoko estekak beti fitxa berrian irekitzen dira eta partekatutako azalak arinak dira.',
        'Argazki handien igoera sendoa gailu xumeetan pantaila izoztu eta zirriborroa galdu gabe.'
      ],
      gl: [
        'As ligazóns externas ábrense sempre en lapela nova e as portadas compartidas son lixeiras.',
        'Subida resistente de fotografías grandes en aparellos modestos sen conxelar a pantalla nin perder borradores.'
      ]
    })
  }),
  Object.freeze({
    id: 'v1-2-23',
    itemId: 'registre-de-canvis-v1-2-23',
    versio: 'v1.2.23',
    data: Object.freeze({
      ca: '23 de novembre de 2026',
      es: '23 de noviembre de 2026',
      en: '23 November 2026',
      eu: '2026ko azaroaren 23a',
      gl: '23 de novembro de 2026'
    }),
    titol: Object.freeze({
      ca: 'El lloc de les fotos a la vista, «Editar» des de la pàgina i menú del Xat simplificat',
      es: 'El lugar de las fotos a la vista, «Editar» desde la página y menú del Chat simplificado',
      en: 'Photo location control, «Edit» from the page and streamlined Chat menu',
      eu: 'Argazkien lekua agerian, «Editatu» orritik bertatik eta Txataren menu sinplifikatua',
      gl: 'O lugar das fotos á vista, «Editar» desde a páxina e menú do Chat simplificado'
    }),
    resum: Object.freeze({
      ca: 'Introdueix l’interruptor «Amaga el lloc» en 1 toc al Xat, al Bloc de notes i al Perfil, afig el botó «Editar» a les teues publicacions i unifica el menú esquerre del Xat.',
      es: 'Introduce el interruptor «Ocultar el lugar» en 1 toque en Chat, Bloc de notas y Perfil, añade el botón «Editar» en tus publicaciones y unifica el menú izquierdo del Chat.',
      en: 'Introduces the one-tap «Hide the location» switch in Chat, Notebook and Profile, adds «Edit» to your own posts, and simplifies the Chat left menu.',
      eu: '«Ezkutatu kokapena» etengailua ekartzen du ukitu batean Txatera, Koadernora eta Profilera, «Editatu» gehitzen du zure argitalpenetan eta Txataren ezkerreko menua sinplifikatzen du.',
      gl: 'Introduce o interruptor «Agochar o lugar» nun toque no Chat, Caderno e Perfil, engade «Editar» nas túas publicacións e simplifica o menú esquerdo do Chat.'
    }),
    abast: Object.freeze({
      ca: 'Versió 1.2.23 (build 28); les cinc migracions de servidor associades es van aplicar i verificar la nit del 23 al 24 de novembre de 2026.',
      es: 'Versión 1.2.23 (build 28); las cinco migraciones de servidor asociadas se aplicaron y verificaron la noche del 23 al 24 de noviembre de 2026.',
      en: 'Version 1.2.23 (build 28); its five server migrations were applied and verified overnight on 23–24 November 2026.',
      eu: '1.2.23 bertsioa (28. builda); lotutako zerbitzariko bost migrazioak 2026ko azaroaren 23-24ko gauean aplikatu eta egiaztatu ziren.',
      gl: 'Versión 1.2.23 (build 28); as cinco migracións de servidor asociadas aplicáronse e verificáronse na noite do 23 ao 24 de novembro de 2026.'
    }),
    millores: Object.freeze({
      ca: [
        'Interruptor «Amaga el lloc» en un sol toc al Xat, Bloc de notes i Perfil.',
        'Botó «Editar» a la barra blava per a publicacions pròpies i d’entitats autoritzades.',
        'Menú del Xat simplificat, fitxes de notes sense línies tallades i Mode Bancal amb contrast AAA documentat.'
      ],
      es: [
        'Interruptor «Ocultar el lugar» en un toque en Chat, Bloc de notas y Perfil.',
        'Botón «Editar» en la barra azul para publicaciones propias y de entidades autorizadas.',
        'Menú del Chat simplificado, fichas de notas sin líneas cortadas y Modo Bancal con contraste AAA documentado.'
      ],
      en: [
        'One-tap «Hide the location» switch in Chat, Notebook and Profile.',
        '«Edit» button on the blue bar for your own and authorised organisation posts.',
        'Simpler Chat menu, uncut note cards and verified AAA contrast description in Bancal Mode.'
      ],
      eu: [
        '«Ezkutatu kokapena» etengailua ukitu bakarrean Txatean, Koadernoan eta Profilean.',
        '«Editatu» botoia barra urdinean zure eta baimendutako erakundeen argitalpenetan.',
        'Txataren menu sinpleagoa, lerro moztu gabeko ohar-fitxak eta Bankal Moduko AAA kontraste egiaztatua.'
      ],
      gl: [
        'Interruptor «Agochar o lugar» nun toque no Chat, Caderno de notas e Perfil.',
        'Botón «Editar» na barra azul para publicacións propias e de entidades autorizadas.',
        'Menú do Chat simplificado, fichas de notas sen liñas cortadas e Modo Bancal con contraste AAA documentado.'
      ]
    }),
    correccions: Object.freeze({
      ca: [
        'Si una gravació de veu falla o es talla, l’àudio recollit es conserva al Xat per a escoltar-lo.',
        'Els preus amb coma decimal i variants coincidixen al Mercat, a la cerca i a la lectura sense cobertura.'
      ],
      es: [
        'Si una grabación de voz falla o se corta, el audio capturado se conserva en el Chat para escucharlo.',
        'Los precios con coma decimal y variantes coinciden en el Mercado, en la búsqueda y en lectura sin cobertura.'
      ],
      en: [
        'If a voice recording fails or is interrupted, captured audio remains in Chat ready to review.',
        'Decimal-comma prices and variant pricing match across Market, Search and offline reading copies.'
      ],
      eu: [
        'Ahots-grabazioak huts egiten badu edo mozten bada, jasotako audioa Txatean gordetzen da entzuteko.',
        'Koma hamartardun prezioak eta aldaerak bat datoz Merkatuan, bilaketan eta estaldurarik gabeko irakurketan.'
      ],
      gl: [
        'Se unha gravación de voz falla ou se corta, o audio recollido consérvase no Chat para escoitalo.',
        'Os prezos con coma decimal e variantes coinciden no Mercado, na busca e na lectura sen cobertura.'
      ]
    })
  }),
  Object.freeze({
    id: 'v1-2-22',
    itemId: 'registre-de-canvis-v1-2-22',
    versio: 'v1.2.22',
    data: Object.freeze({
      ca: '22 de novembre de 2026',
      es: '22 de noviembre de 2026',
      en: '22 November 2026',
      eu: '2026ko azaroaren 22a',
      gl: '22 de novembro de 2026'
    }),
    titol: Object.freeze({
      ca: 'Un Xat obert a tots els pobles, un sol Mode Bancal i tres oliveres al Banc de Llavors',
      es: 'Un Chat abierto a todos los pueblos, un solo Modo Bancal y tres olivos en el Banco de Semillas',
      en: 'An open Chat for every village, a single Bancal Mode and three olive varieties in the Seed Bank',
      eu: 'Herri guztietara irekitako Txata, Bankal Modu bakarra eta hiru olibondo Hazi Bankuan',
      gl: 'Un Chat aberto a todas as vilas, un só Modo Bancal e tres oliveiras no Banco de Sementes'
    }),
    resum: Object.freeze({
      ca: 'Unifica Lletra Gran i Contrast Alt en un sol «Mode Bancal · Sol i Lletra Gran», suma tres varietats d’olivera al Banc de Llavors i millora la barra negra i el calaix mòbil.',
      es: 'Unifica Letra Grande y Contraste Alto en un solo «Modo Bancal · Sol y Letra Grande», suma tres variedades de olivo al Banco de Semillas y mejora la barra negra y el cajón móvil.',
      en: 'Unifies Large Text and High Contrast into one «Bancal Mode · Sun & Large Text», adds three olive varieties to the Seed Bank, and refines the top bar and mobile drawer.',
      eu: 'Letra Handia eta Kontraste Altua «Bankal Modua» bakarrean bateratzen ditu, hiru olibondo-barietate gehitzen ditu Hazi Bankura eta goiko barra zein mugikorreko tiradera hobetzen ditu.',
      gl: 'Unifica Letra Grande e Contraste Alto nun só «Modo Bancal · Sol e Letra Grande», suma tres variedades de oliveira ao Banco de Sementes e mellora a barra negra e o caixón móbil.'
    }),
    abast: Object.freeze({
      ca: 'Onades R32.42 i R32.43 (versió 1.2.22, build 27).',
      es: 'Oleadas R32.42 y R32.43 (versión 1.2.22, build 27).',
      en: 'Waves R32.42 and R32.43 (version 1.2.22, build 27).',
      eu: 'R32.42 eta R32.43 olatuak (1.2.22 bertsioa, 27. builda).',
      gl: 'Ondas R32.42 e R32.43 (versión 1.2.22, build 27).'
    }),
    millores: Object.freeze({
      ca: [
        'Quarta font al Banc de Llavors: Alfafara (Alfafarenca), Blanqueta i Villalonga (estudi GVA/IVIA).',
        'Un sol interruptor «Mode Bancal · Sol i Lletra Gran» al Xat, Perfil i Ajustos.',
        'Logotip més gran al mòbil, barra negra més clara i un sol logotip visible dins el calaix lateral.'
      ],
      es: [
        'Cuarta fuente en el Banco de Semillas: Alfafara (Alfafarenca), Blanqueta y Villalonga (estudio GVA/IVIA).',
        'Un solo interruptor «Modo Bancal · Sol y Letra Grande» en Chat, Perfil y Ajustes.',
        'Logotipo más grande en móvil, barra negra más clara y un solo logotipo visible en el cajón lateral.'
      ],
      en: [
        'Fourth Seed Bank source: Alfafara (Alfafarenca), Blanqueta and Villalonga olive varieties (GVA/IVIA).',
        'Single «Bancal Mode · Sun & Large Text» toggle in Chat, Profile and Settings.',
        'Larger mobile logo, cleaner top bar and a single visible logo inside the side drawer.'
      ],
      eu: [
        'Laugarren iturria Hazi Bankuan: Alfafara, Blanqueta eta Villalonga olibondo-barietateak (GVA/IVIA).',
        '«Bankal Modua» etengailu bakarra Txatean, Profilean eta Ezarpenetan.',
        'Mugikorreko logotipo handiagoa, barra beltz garbiagoa eta logotipo bakar bat alboko tiraderan.'
      ],
      gl: [
        'Cuarta fonte no Banco de Sementes: Alfafara, Blanqueta e Villalonga (estudo GVA/IVIA).',
        'Un só interruptor «Modo Bancal · Sol e Letra Grande» no Chat, Perfil e Axustes.',
        'Logotipo máis grande no móbil, barra negra máis limpa e un só logotipo visible no caixón lateral.'
      ]
    }),
    correccions: Object.freeze({
      ca: [
        'Una sola benvinguda a l’accés del Xat sense repetir textos.',
        'Sanejament d’ubicació en vídeos del telèfon i filtre coherent de visibilitat al Mur per a membres.'
      ],
      es: [
        'Una sola bienvenida en el acceso del Chat sin repetir textos.',
        'Saneamiento de ubicación en vídeos del teléfono y filtro coherente de visibilidad en el Muro para miembros.'
      ],
      en: [
        'Single welcome message at the Chat entrance with no duplicate heading.',
        'Location sanitisation on phone videos and consistent Wall visibility filtering for members.'
      ],
      eu: [
        'Ongietorri bakarra Txateko sarbidean testuak errepikatu gabe.',
        'Mugikorreko bideoetan kokapen-garbiketa eta Hormako ikusgarritasun-iragazki koherentea kideentzat.'
      ],
      gl: [
        'Unha soa benvida no acceso do Chat sen repetir textos.',
        'Saneamento de localización en vídeos do teléfono e filtro coherente de visibilidade no Muro para membros.'
      ]
    })
  }),
  Object.freeze({
    id: 'v1-2-21',
    itemId: 'registre-de-canvis-v1-2-21',
    versio: 'v1.2.21',
    data: Object.freeze({
      ca: '22 de novembre de 2026',
      es: '22 de noviembre de 2026',
      en: '22 November 2026',
      eu: '2026ko azaroaren 22a',
      gl: '22 de novembro de 2026'
    }),
    titol: Object.freeze({
      ca: 'Les pàgines de l’Atles a tota l’amplada, un accés al Xat que cap en pantalles estretes i el mateix preu al Mur i al Mercat',
      es: 'Las páginas del Atles a todo lo ancho, un acceso al Chat que cabe en pantallas estrechas y el mismo precio en el Muro y en el Mercado',
      en: 'Atles pages at full width, a Chat entrance that fits narrow screens and the same price on the Wall and in the Market',
      eu: 'Atleseko orriak zabalera osoan, pantaila estuetan kabitzen den Txaterako sarbidea eta prezio bera Horman eta Merkatuan',
      gl: 'As páxinas do Atles a todo o ancho, un acceso ao Chat que cabe en pantallas estreitas e o mesmo prezo no Muro e no Mercado'
    }),
    resum: Object.freeze({
      ca: 'Les cinc pàgines de l’Atles 2D es lligen de punta a punta, el Mode Bancal guanya contrast al sol, l’accés al Xat i el Bar caben en mòbils estrets i un producte mostra el mateix preu al Mur i al Mercat.',
      es: 'Las cinco páginas del Atles 2D se leen de punta a punta, el modo Bancal gana contraste al sol, el acceso al Chat y el Bar caben en móviles estrechos y un producto muestra el mismo precio en el Muro y en el Mercado.',
      en: 'All five Atles 2D pages read edge-to-edge, Bancal mode increases sun contrast, Chat entrance and Bar fit narrow phones, and Market products display the same price on the Wall and in the list.',
      eu: 'Atles 2Dren bost orriak ertz batetik bestera irakurtzen dira, Bancal moduak kontrastea irabazten du eguzkitan, Txata eta Taberna mugikor estuetan kabitzen dira eta produktuak prezio bera du Horman eta Merkatuan.',
      gl: 'As cinco páxinas do Atles 2D lense de punta a punta, o modo Bancal gaña contraste ao sol, o acceso ao Chat e o Bar caben en móbiles estreitos e un produto mostra o mesmo prezo no Muro e no Mercado.'
    }),
    abast: Object.freeze({
      ca: 'Onada R32.41 (versió 1.2.21, build 26) al repositori; connector WordPress 1.1.28 publicat i 1.1.29 preparat.',
      es: 'Oleada R32.41 (versión 1.2.21, build 26) en el repositorio; conector WordPress 1.1.28 publicado y 1.1.29 preparado.',
      en: 'Wave R32.41 (version 1.2.21, build 26) in repository; WordPress plugin 1.1.28 published and 1.1.29 prepared.',
      eu: 'R32.41 olatua (1.2.21 bertsioa, 26. builda) biltegian; WordPress 1.1.28 konektorea argitaratuta eta 1.1.29 prestatuta.',
      gl: 'Onda R32.41 (versión 1.2.21, build 26) no repositorio; conector WordPress 1.1.28 publicado e 1.1.29 preparado.'
    }),
    millores: Object.freeze({
      ca: [
        'Atles 2D: les cinc pàgines es lligen a tota l’amplada sense deixar mitja pàgina buida.',
        'Mode Bancal amb contrast reforçat en tema clar i fosc per a llegir a ple sol.',
        'Benvinguda més clara a Connectar i en comunitats del Xat per a qui encara no té compte.'
      ],
      es: [
        'Atles 2D: las cinco páginas se leen a todo lo ancho sin dejar media página vacía.',
        'Modo Bancal con contraste reforzado en tema claro y oscuro para leer a pleno sol.',
        'Bienvenida más clara en Conectar y en comunidades del Chat para quien todavía no tiene cuenta.'
      ],
      en: [
        'Atles 2D: all five pages read full-width without leaving half the page empty.',
        'Bancal mode with stronger contrast in light and dark themes for outdoor sunlight.',
        'Clearer welcome in Connect and Chat communities for visitors without an account.'
      ],
      eu: [
        'Atles 2D: bost orriak zabalera osoan irakurtzen dira orri erdi hutsik utzi gabe.',
        'Bancal modua kontraste indartuarekin gai argi eta ilunean eguzkitan irakurtzeko.',
        'Harrera argiagoa Konektatu atalean eta Txateko komunitateetan konturik ez dutenentzat.'
      ],
      gl: [
        'Atles 2D: as cinco páxinas lense a todo o ancho sen deixar media páxina baleira.',
        'Modo Bancal con contraste reforzado en tema claro e escuro para ler ao sol.',
        'Benvida máis clara en Conectar e en comunidades do Chat para quen aínda non ten conta.'
      ]
    }),
    correccions: Object.freeze({
      ca: [
        'Entrar i Registrar-se al Xat i els botons principals del Bar ja no queden tapats en pantalles estretes.',
        'L’adreça del Calendari Agrícola porta al Banc de Llavors amb rètols en cinc llengües.',
        'El mateix preu del Mercat al Mur, la llista i la fitxa, i tancament segur del micròfon en gravacions de veu tallades.'
      ],
      es: [
        'Entrar y Registrarse en el Chat y los botones principales del Bar ya no quedan tapados en pantallas estrechas.',
        'La dirección del Calendario Agrícola lleva al Banco de Semillas con rótulos en cinco lenguas.',
        'El mismo precio del Mercado en el Muro, la lista y la ficha, y cierre seguro del micrófono en grabaciones de voz cortadas.'
      ],
      en: [
        'Chat sign-in/sign-up and main Bar buttons are no longer covered on narrow screens.',
        'Agricultural Calendar route leads to Seed Bank with five-language labels.',
        'Consistent Market pricing across Wall, list and detail, plus clean microphone release on interrupted voice recordings.'
      ],
      eu: [
        'Txateko Sartu/Erregistratu eta Tabernako botoi nagusiak ez dira gehiago estaltzen pantaila estuetan.',
        'Nekazaritza Egutegiaren helbideak Hazi Bankura darama bost hizkuntzatako errotuluekin.',
        'Merkatuko prezio bera Horman, zerrendan eta fitxan, eta mikrofonoa seguru ixtea etendako ahots-grabazioetan.'
      ],
      gl: [
        'Entrar e Rexistrarse no Chat e os botóns principais do Bar xa non quedan tapados en pantallas estreitas.',
        'O enderezo do Calendario Agrícola leva ao Banco de Sementes con rótulos en cinco linguas.',
        'O mesmo prezo do Mercado no Muro, na lista e na ficha, e peche seguro do micrófono en gravacións de voz cortadas.'
      ]
    })
  }),
  Object.freeze({
    id: 'v1-2-20',
    itemId: 'registre-de-canvis-v1-2-20',
    versio: 'v1.2.20',
    data: Object.freeze({
      ca: '22 de novembre de 2026',
      es: '22 de noviembre de 2026',
      en: '22 November 2026',
      eu: '2026ko azaroaren 22a',
      gl: '22 de novembro de 2026'
    }),
    titol: Object.freeze({
      ca: 'Lectura sense cobertura, fotos netes i Bloc de notes transparent',
      es: 'Lectura sin cobertura, fotos limpias y Bloc de notas transparente',
      en: 'Offline public reading, cleaner photos and transparent Notebook status',
      eu: 'Estaldurarik gabeko irakurketa, argazki garbiak eta Koaderno gardena',
      gl: 'Lectura sen cobertura, fotos limpas e Caderno de notas transparente'
    }),
    resum: Object.freeze({
      ca: 'Conserva durant 7 dies còpies de lectura de pàgines públiques obertes sense sessió i mostra clarament si cada nota és còpia local, esborrany privat o peça publicada.',
      es: 'Conserva durante 7 días copias de lectura de páginas públicas abiertas sin sesión y muestra claramente si cada nota es copia local, borrador privado o pieza publicada.',
      en: 'Keeps 7-day reading copies of public pages opened without signing in and clearly labels local copies, private drafts and published posts.',
      eu: 'Saioa hasi gabe irekitako orri publikoen irakurketa-kopiak 7 egunez gordetzen ditu eta ohar bakoitza tokikoa, zirriborro pribatua edo argitaratua den argi erakusten du.',
      gl: 'Conserva durante 7 días copias de lectura de páxinas públicas abertas sen sesión e mostra claramente se cada nota é copia local, borrador privado ou peza publicada.'
    }),
    abast: Object.freeze({
      ca: 'Onada R32.34 (versió 1.2.20, build 25).',
      es: 'Oleada R32.34 (versión 1.2.20, build 25).',
      en: 'Wave R32.34 (version 1.2.20, build 25).',
      eu: 'R32.34 olatua (1.2.20 bertsioa, 25. builda).',
      gl: 'Onda R32.34 (versión 1.2.20, build 25).'
    }),
    millores: Object.freeze({
      ca: [
        'Còpia de lectura pública sense cobertura durant 7 dies (mai guarda contingut privat).',
        'El Bloc de notes indica l’estat real de cada text i no publica res sense confirmació explícita.'
      ],
      es: [
        'Copia de lectura pública sin cobertura durante 7 días (nunca guarda contenido privado).',
        'El Bloc de notas indica el estado real de cada texto y no publica nada sin confirmación explícita.'
      ],
      en: [
        '7-day offline reading cache for public pages (never stores private content).',
        'Notebook shows the real status of every note and never publishes without confirmation.'
      ],
      eu: [
        'Orri publikoen 7 eguneko estaldurarik gabeko irakurketa-kopia (inoiz ez du eduki pribaturik gordetzen).',
        'Koadernoak testu bakoitzaren benetako egoera erakusten du eta ez du ezer argitaratzen berrespenik gabe.'
      ],
      gl: [
        'Copia de lectura pública sen cobertura durante 7 días (nunca garda contido privado).',
        'O Caderno de notas indica o estado real de cada texto e non publica nada sen confirmación explícita.'
      ]
    }),
    correccions: Object.freeze({
      ca: [
        'Repeticions del Calendari precises fins i tot de matinada o en canvis d’hora.',
        'Preus del Mercat formatats amb coma decimal en les cinc llengües.'
      ],
      es: [
        'Repeticiones del Calendario precisas incluso de madrugada o en cambios de hora.',
        'Precios del Mercado formateados con coma decimal en las cinco lenguas.'
      ],
      en: [
        'Repeating Calendar events end on the exact day even across midnight or DST changes.',
        'Market prices formatted with decimal commas across all five languages.'
      ],
      eu: [
        'Egutegiko errepikapen zehatzak baita goizaldean edo ordu-aldaketetan ere.',
        'Merkatuko prezioak koma hamartarrarekin bost hizkuntzetan.'
      ],
      gl: [
        'Repeticións do Calendario precisas incluso de madrugada ou en cambios de hora.',
        'Prezos do Mercado formatados con coma decimal nas cinco linguas.'
      ]
    })
  })
]);

export const METADADES_REGISTRE_ITEMS = Object.freeze({
  'registre-de-canvis-conjunt': Object.freeze({
    ca: { title: 'Vista de conjunt', subtitle: 'Estat dels canals i últimes versions', lead: 'Consulta en una sola pantalla l’estat en viu dels quatre canals oficials i les últimes entregues atòmiques amb blocs desplegables de millores i correccions.' },
    es: { title: 'Vista general', subtitle: 'Estado de canales y últimas versiones', lead: 'Consulta en una sola pantalla el estado en vivo de los cuatro canales oficiales y las últimas entregas atómicas con bloques desplegables de mejoras y correcciones.' },
    en: { title: 'Overview', subtitle: 'Official channels and recent releases', lead: 'Check live status across the four official channels and browse recent atomic releases with collapsible Improvements and Fixes sections.' },
    eu: { title: 'Ikuspegi orokorra', subtitle: 'Kanal ofizialak eta azken bertsioak', lead: 'Ikusi pantaila bakarrean lau kanal ofizialen egoera eta azken entrega atomikoak hobekuntza eta zuzenketa tolesgarriekin.' },
    gl: { title: 'Vista de conxunto', subtitle: 'Estado das canles e últimas versións', lead: 'Consulta nunha soa pantalla o estado en vivo das catro canles oficiais e as últimas entregas atómicas con bloques despregables de melloras e correccións.' }
  }),
  'registre-de-canvis-historic': Object.freeze({
    ca: { title: 'Arxiu històric (2013 – anteriors)', subtitle: 'Càrrega diferida sota demanda', lead: 'Accedix a la memòria completa d’entregues anteriors a la v1.2.20 sense carregar-la a l’arrencada.' },
    es: { title: 'Archivo histórico (2013 – anteriores)', subtitle: 'Carga diferida bajo demanda', lead: 'Accede a la memoria completa de entregas anteriores a la v1.2.20 sin cargarla en el arranque.' },
    en: { title: 'Historical archive (2013 – earlier)', subtitle: 'On-demand lazy archive', lead: 'Read the full chronicle of releases prior to v1.2.20 without loading it at startup.' },
    eu: { title: 'Artxibo historikoa (2013 – aurrekoak)', subtitle: 'Eskariaren araberako karga', lead: 'Sartu v1.2.20 aurreko bertsioen memoria osoan abiaraztean kargatu gabe.' },
    gl: { title: 'Arquivo histórico (2013 – anteriores)', subtitle: 'Carga diferida baixo demanda', lead: 'Accede á memoria completa das entregas anteriores á v1.2.20 sen cargala no arranque.' }
  })
});

export function localitzaItemRegistreCanvis(item, llengua = 'ca') {
  if (!item || item.categoryIds?.[0] !== 'registre-de-canvis') return null;
  const codi = normalitzaLlenguaRc(llengua);
  const tx = TEXTOS_REGISTRE_CANVIS[codi];
  const directe = METADADES_REGISTRE_ITEMS[item.id]?.[codi];
  if (directe) {
    return {
      ...item,
      title: directe.title,
      subtitle: directe.subtitle,
      lead: directe.lead,
      categoriaLabel: tx.categoriaNom,
      contentLanguage: codi
    };
  }
  const v = VERSIONS_REGISTRE.find((entrada) => entrada.itemId === item.id);
  if (!v) return null;
  return {
    ...item,
    title: v.versio,
    subtitle: `${v.data[codi]} · ${v.titol[codi]}`,
    lead: v.resum[codi],
    categoriaLabel: tx.categoriaNom,
    contentLanguage: codi
  };
}
