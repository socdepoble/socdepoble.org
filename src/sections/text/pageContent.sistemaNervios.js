/* v1.2.6 · Portada pròpia (P0-117, decisió del Mestre del 17-11-2026): il·lustració nova de MarIA amb Nano,
   rebuda a _investigacio_ia_de_poble/261117_r326_claude_integracio/portada_sistema_nervios/ i reduïda a 1024 px. */
export const IMATGE_SISTEMA_NERVIOS = '/assets/ui/plugins/sistema_nervios_vinyeta.jpg';
export const RUTA_PAGINA_SISTEMA_NERVIOS = '/page/sistema-nervios';
export const DATA_SISTEMA_NERVIOS = '2026-11-17T00:14:00+01:00';

const ext = (url, label) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;

const REPOS = Object.freeze({
  ecc: 'https://github.com/affaan-m/everything-claude-code',
  craft: 'https://github.com/storytold/craft-anything',
  openSeo: 'https://github.com/every-app/open-seo',
  selfhosted: 'https://github.com/awesome-selfhosted/awesome-selfhosted',
  cal: 'https://github.com/calcom/cal.diy',
  wanderer: 'https://github.com/Flomp/wanderer',
  voiceStudio: 'https://github.com/debpalash/VoiceStudio',
  openWhispr: 'https://github.com/OpenWhispr/openwhispr',
  cap: 'https://github.com/CapSoftware/Cap',
  appFlowy: 'https://github.com/AppFlowy-IO/AppFlowy',
  openProject: 'https://github.com/opf/openproject',
  chatwoot: 'https://github.com/chatwoot/chatwoot',
  higgsfield: 'https://github.com/wide-trace/open-higgsfield',
});

function taulaHtml(caption, capcaleres, files) {
  const ths = capcaleres.map((h) => `<th scope="col">${h}</th>`).join('');
  const trs = files
    .map((celes) => `<tr>${celes.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('');
  return `<div class="sdp-taula-prosa"><table><caption>${caption}</caption><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
}

function construeixCos(c) {
  const seccions = c.seccions
    .map(([titol, ...paragrafs]) => `<h3>${titol}</h3>\n${paragrafs.map((p) => `<p>${p}</p>`).join('\n')}`)
    .join('\n\n');
  const taules = c.taules
    .map((t) => `<h4>${t.titol}</h4>\n<p>${t.intro}</p>\n${taulaHtml(t.caption, t.cols, t.rows)}`)
    .join('\n\n');
  return `\n${seccions}\n\n<h3>${c.titolMapa}</h3>\n<p>${c.introMapa}</p>\n\n${taules}\n\n<div class="sdp-pagina-accio"><a class="sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple" href="/wikidepoble?item=sistema_nervios_skills_i_repositoris">${c.ctaWiki}</a></div>\n<div class="sdp-pagina-accio"><a class="sdp-boto sdp-boto--secundari sdp-boto--gran sdp-boto--ple" href="/consola">${c.ctaConsola}</a></div>\n`;
}

const DADES = {
  ca: {
    title: 'El Sistema Nerviós de Sóc de Poble',
    subtitle: 'Com es combinen les 43 skills, els tractors automàtics i el govern humà',
    imageAlt: 'Il·lustració de còmic d’estil Bruguera a la plaça del poble: una iaia maneja les palanques d’una gran màquina de fusta plena de manòmetres i campanes, dos robotets de xapa amb bombeta al cap la vigilen i un veí amb boina, faixa i portapapers bota sorprés al costat d’una cabra',
    lead: 'Una guia clara per a qualsevol persona sense formació informàtica: què són les instruccions d’ofici (skills), què comproven els tractors automàtics i d’on ve cada peça que estudiem o guardem al Node 0.',
    seccions: [
      [
        'Neurones escrites i reflexos mecànics',
        'Construir una eina cívica que siga fàcil d’entendre per a una <strong>persona gran</strong> demana memòria i disciplina. A Sóc de Poble ho resolem separant dues peces: les <strong>neurones</strong> (les <strong>43 skills</strong> de <code>.agents/skills/</code>, breus manuals d’ofici escrits en llenguatge humà) i els <strong>reflexos musculars</strong> (els <strong>tractors i portes</strong> en JavaScript <code>.mjs</code> de <code>tooling/</code>).',
        'Una <strong>skill</strong> explica el criteri abans d’actuar: com maquetar un text llegible al sol, com respectar el disseny <strong>Pedra Seca</strong> o com protegir la privacitat. Un <strong>tractor</strong> no opina ni es cansa: mesura que els botons facen almenys <strong>48 × 48 píxels</strong>, que el contrast complisca el nivell <strong>AAA</strong>, que cap enllaç estiga trencat i que el paquet de WordPress no supere el seu pressupost de pes. Si una comprovació falla, l’entrega es para sola.',
      ],
      [
        'Per què l’humà mana encara que ningú pique codi a mà',
        'Hui ja no escrivim les pantalles lletra a lletra amb el teclat, però <strong>cap màquina pren decisions pel poble</strong>. La direcció humana de <strong>Javi Llinares</strong> definix els casos d’ús rurals, prioritza la senzillesa i aprova cada canvi abans d’entrar a producció.',
        'Al taller digital, la <strong>IAIA MarIA</strong> coordina en còpies aïllades (<code>/tmp/</code>) tres carrils de construcció (<strong>Claude</strong>, <strong>ChatGPT Codex</strong> i <strong>Gemini</strong>), consulta els <strong>12 membres del Consell</strong> amb el context complet del projecte i recolza les revisions en les <strong>8 escoles locals</strong> d’Ollama al <a href="/page/node-zero"><strong>Node 0</strong></a> (<code>Mac mini</code> amb <strong>xip Apple M4</strong>). Tot passa per proves reals i empremtes criptogràfiques <strong>SHA-256</strong>.',
      ],
    ],
    titolMapa: 'D’on ix cada peça: pròpia, adaptada o en reserva local',
    introMapa: 'Per evitar fum tecnològic, separem en tres taules verificables les nostres eines pròpies, les metodologies obertes que hem estudiat sense copiar codi alié al navegador i els programes lliures guardats al Node 0 amb <strong>0 bytes</strong> afegits a la web.',
    taules: [
      {
        titol: '1 · Maquinària 100 % pròpia de Sóc de Poble',
        intro: 'Construïda i mantinguda íntegrament dins del repositori per governar el disseny, la documentació i la seguretat.',
        caption: 'Peça o família pròpia, funció planera, qui l’utilitza i estat d’incorporació',
        cols: ['Peça o família', 'Què fa en paraules senzilles', 'Qui l’utilitza', 'Estat real'],
        rows: [
          ['<strong>Skills de govern, context i memòria</strong> (<code>core-*</code>: 27 skills)', 'Fixen la veu de poble, eviten canvis a cegues, mantenen l’Escriptori net i vigilen la seguretat i la llegibilitat.', 'MarIA, Claude, ChatGPT Codex, Gemini i direcció humana', '<strong>100 % propi</strong> · Actiu al repositori'],
          ['<strong>Skills de producte i Pedra Seca</strong> (<code>sdp-*</code>: 12 skills)', 'Definixen les regles visuals AAA, les columnes d’espai de treball, el TPV rural, el xat familiar i els casos d’ús.', 'Equips de construcció i tot el veïnat (resultat visual)', '<strong>100 % propi</strong> · Escrites a <code>.agents/skills/</code>; aplicades a <code>src/</code>'],
          ['<strong>Skills del cicle documental</strong> (<code>wiki-*</code>: 4 skills)', ' Asseguren plantilles canòniques per a plans i actes i mantenen viva la coherència entre codi i Wiki.', 'MarIA i secretaria tècnica', '<strong>100 % propi</strong> · Actiu amb <code>document.mjs</code>'],
          ['<strong> Cadena de portes i tractors</strong> (<code>tooling/gates/</code>, <code>wiki/</code> i <code>brain/</code>)', 'Més de seixanta comprovadors automàtics de contrast, teclat, censos, vocabulari CSS i pressupost de pes.', 'Execució automàtica abans de cada entrega', '<strong>100 % propi</strong> · Node.js determinista'],
        ],
      },
      {
        titol: '2 · Metodologies i repositoris oberts estudiats i adaptats',
        intro: ' Escoles de treball analitzades i traduïdes a regles i comprovadors propis, amb zero codi web alié incrustat.',
        caption: 'Metodologia o repositori extern estudiat, aportació adaptada, usuaris i nivell d’incorporació',
        cols: ['Font o repositori original', 'Què n’hem aprés i adaptat', 'Qui l’utilitza', 'Incorporació real'],
        rows: [
          ['<strong>Mètode MIT i Spec-Driven Development</strong>', 'Llegir les fonts vives, pactar l’especificació abans de programar i verificar amb proves empíriques.', 'Tots els carrils d’enginyeria', '<strong>Metodologia adaptada</strong> a <code>sdp-workflow</code>'],
          ['<strong>Google EGM · L’Elefant i els 8 Peixos Daurats</strong>', 'Un coordinador amb visió global i vuit revisors especialitzats d’un sol focus per detectar errors subtils.', 'Orquestració i les <strong>8 escoles locals</strong> del Node 0', '<strong>Arquitectura adaptada</strong> sense dependència web'],
          [`${ext(REPOS.ecc, 'affaan-m/everything-claude-code')} (<code>MIT</code>)`, 'Rúbriques contra prosa artificial (<code>deslop</code>), revisió d’estats de pantalla i recorreguts complets de clic.', 'Claude, ChatGPT Codex, Gemini i MarIA', '<strong>Estudiat i destil·lat</strong> · <code>0 %</code> codi alié a <code>src/</code>'],
          [`<strong>Enginyeria Inversa REA</strong> + ${ext(REPOS.craft, 'storytold/craft-anything')} (<code>MIT OR Apache-2.0</code>)`, 'Inspecció real dels paquets compilats (<code>dist/</code>) i extracció de les peces essencials de cada ofici rural.', 'Auditoria pre-entrega i disseny funcional', '<strong>Protocol propi</strong> a <code>core-tecniques-investigacio</code>'],
          [`${ext(REPOS.openSeo, 'every-app/open-seo')} (<code>MIT</code>), <strong>Emowe</strong> i <strong>Vigilant Tellado</strong>`, 'Llistes de control per a targetes compartides sense rastrejadors, semàfor de salut de skills i perímetre WordPress.', 'Consola Termodinàmica i portes de publicació', '<strong>Reimplementat de zero</strong> a <code>tooling/</code>'],
        ],
      },
      {
        titol: '3 · Motors lliures en reserva al Node 0 i peces descartades',
        intro: 'Eines gratuïtes consultades o allotjades en local al servidor del poble, sense sumar pes al navegador, més el registre honest de descarts.',
        caption: 'Repositori lliure al Node 0 o descartat, utilitat, destinataris i estat real',
        cols: ['Repositori i llicència', 'Utilitat per al poble o motiu de descart', 'Destinataris', 'Estat real'],
        rows: [
          [`${ext(REPOS.selfhosted, 'awesome-selfhosted/awesome-selfhosted')} (<code>CC-BY-SA-3.0</code>)`, 'Catàleg de <code>1.361</code> fitxes de programari lliure per triar alternatives obertes sense lligams comercials.', 'Arquitectura i escoles del Node 0', '<strong>Consulta local al Node 0</strong> · <code>0 B</code> a la web'],
          [`${ext(REPOS.cal, 'calcom/cal.diy')} (<code>MIT</code>) i ${ext(REPOS.wanderer, 'Flomp/wanderer')} (<code>AGPL-3.0</code>)`, 'Referències d’horaris per a reservar instal·lacions municipals (frontó o sales) i traces GPX de senderisme.', 'Futurs mòduls municipals i <a href="/page/rutes-de-poble">Rutes de Poble</a>', '<strong>Referència tècnica</strong> · Sense servidor alié actiu'],
          [`${ext(REPOS.voiceStudio, 'debpalash/VoiceStudio')} (<code>AGPL-3.0</code>) i ${ext(REPOS.openWhispr, 'OpenWhispr/openwhispr')} (<code>MIT</code>)`, 'Taller local en <strong>xip Apple M4</strong> per a locucions culturals i estudi de dictat de veu per a persones majors.', 'Taller sonor del Node 0 i memòria oral', '<strong>Taller local / en disseny</strong> · Fora del núvol'],
          [`${ext(REPOS.cap, 'CapSoftware/Cap')} (<code>AGPL-3.0</code>; crates <code>cap-camera*</code> i <code>scap-*</code> sota <code>MIT</code>)`, 'Gravador lliure d’escriptori per fer vídeos breus d’ajuda visual per a veïns i ajuntaments.', 'Comunicació didàctica humana', '<strong>Eina d’escriptori</strong> · Fora de l’aplicació'],
          [`${ext(REPOS.appFlowy, 'AppFlowy')}, ${ext(REPOS.openProject, 'openproject')} i ${ext(REPOS.chatwoot, 'chatwoot')}`, 'Estudiats per a taules, fites i bústia, però coberts ja pel nostre Bloc de Notes, Mapa de Ruta i Xat.', 'Consulta puntual de disseny', '<strong>No desplegats</strong> · Evitem duplicar servidors'],
          [`${ext(REPOS.higgsfield, 'wide-trace/open-higgsfield')} (sense llicència oberta)`, 'Sense llicència lliure verificada i dependent de claus externes de pagament.', 'Cap ús', '<strong>Descartat i bloquejat</strong> per higiene legal'],
        ],
      },
    ],
    ctaWiki: 'Obrir l’inventari complet a la Wiki de Poble',
    ctaConsola: 'Explorar la Consola Termodinàmica',
  },
  es: {
    title: 'El Sistema Nervioso de Sóc de Poble',
    subtitle: 'Cómo se combinan las 43 skills, los tractores automáticos y el gobierno humano',
    imageAlt: 'Ilustración de cómic de estilo Bruguera en la plaza del pueblo: una abuela maneja las palancas de una gran máquina de madera llena de manómetros y campanas, dos robotitos de chapa con una bombilla en la cabeza la vigilan y un vecino con boina, faja y portapapeles salta sorprendido junto a una cabra',
    lead: 'Una guía clara para cualquier persona sin formación informática: qué son las instrucciones de oficio (skills), qué comprueban los tractores automáticos y de dónde procede cada pieza que estudiamos o guardamos en el Node 0.',
    seccions: [
      [
        'Neuronas escritas y reflejos mecánicos',
        'Construir una herramienta cívica fácil de usar para una <strong>persona mayor</strong> exige memoria y disciplina. En Sóc de Poble lo resolvemos separando dos piezas: las <strong>neuronas</strong> (las <strong>43 skills</strong> de <code>.agents/skills/</code>, breves manuales de oficio escritos en lenguaje humano) y los <strong>reflejos musculares</strong> (los <strong>tractores y puertas</strong> en JavaScript <code>.mjs</code> de <code>tooling/</code>).',
        'Una <strong>skill</strong> explica el criterio antes de actuar: cómo maquetar texto legible al sol, cómo respetar el diseño <strong>Pedra Seca</strong> o cómo cuidar la privacidad. Un <strong>tractor</strong> no opina ni se cansa: mide que los botones alcancen al menos <strong>48 × 48 píxeles</strong>, que el contraste cumpla el nivel <strong>AAA</strong>, que ningún enlace esté roto y que el paquete de WordPress respete su límite de peso. Si una comprobación falla, la entrega se detiene.',
      ],
      [
        'Por qué la persona manda aunque nadie teclee código a mano',
        'Hoy ya no escribimos las pantallas letra a letra con el teclado, pero <strong>ninguna máquina decide por el pueblo</strong>. La dirección humana de <strong>Javi Llinares</strong> define los casos de uso rurales, prioriza la sencillez y aprueba cada cambio antes de llegar a producción.',
        'En el taller digital, la <strong>IAIA MarIA</strong> coordina en copias aisladas (<code>/tmp/</code>) tres carriles de construcción (<strong>Claude</strong>, <strong>ChatGPT Codex</strong> y <strong>Gemini</strong>), consulta a los <strong>12 miembros del Consejo</strong> con el contexto completo del proyecto y apoya las revisiones en las <strong>8 escuelas locales</strong> de Ollama en el <a href="/page/node-zero"><strong>Node 0</strong></a> (<code>Mac mini</code> con <strong>chip Apple M4</strong>). Todo se valida con pruebas reales y huellas criptográficas <strong>SHA-256</strong>.',
      ],
    ],
    titolMapa: 'De dónde sale cada pieza: propia, adaptada o en reserva local',
    introMapa: 'Para evitar humo tecnológico, separamos en tres tablas verificables nuestras herramientas propias, las metodologías abiertas estudiadas sin copiar código ajeno en el navegador y los programas libres guardados en el Node 0 con <strong>0 bytes</strong> añadidos a la web.',
    taules: [
      {
        titol: '1 · Maquinaria 100 % propia de Sóc de Poble',
        intro: 'Construida y mantenida íntegramente en el repositorio para gobernar el diseño, la documentación y la seguridad.',
        caption: 'Pieza o familia propia, función sencilla, quién la utiliza y estado de incorporación',
        cols: ['Pieza o familia', 'Qué hace en palabras sencillas', 'Quién la utiliza', 'Estado real'],
        rows: [
          ['<strong>Skills de gobierno, contexto y memoria</strong> (<code>core-*</code>: 27 skills)', 'Fijan la voz cercana, evitan cambios a ciegas, mantienen limpio el Escritorio y vigilan la seguridad y la lectura.', 'MarIA, Claude, ChatGPT Codex, Gemini y dirección humana', '<strong>100 % propio</strong> · Activo en el repositorio'],
          ['<strong>Skills de producto y Pedra Seca</strong> (<code>sdp-*</code>: 12 skills)', 'Definen las reglas visuales AAA, las columnas de trabajo, el TPV rural, el chat familiar y los casos de uso.', 'Equipos de construcción y vecindario (resultado visual)', '<strong>100 % propio</strong> · Escritas en <code>.agents/skills/</code>; aplicadas en <code>src/</code>'],
          ['<strong>Skills del ciclo documental</strong> (<code>wiki-*</code>: 4 skills)', 'Aseguran plantillas canónicas para planes y actas y mantienen viva la coherencia entre código y Wiki.', 'MarIA y secretaría técnica', '<strong>100 % propio</strong> · Activo con <code>document.mjs</code>'],
          ['<strong>Cadena de puertas y tractores</strong> (<code>tooling/gates/</code>, <code>wiki/</code> y <code>brain/</code>)', 'Más de sesenta comprobadores automáticos de contraste, teclado, censos, vocabulario CSS y presupuesto de peso.', 'Ejecución automática antes de cada entrega', '<strong>100 % propio</strong> · Node.js determinista'],
        ],
      },
      {
        titol: '2 · Metodologías y repositorios abiertos estudiados y adaptados',
        intro: 'Escuelas de trabajo analizadas y traducidas a reglas y comprobadores propios, sin incrustar código web ajeno.',
        caption: 'Metodología o repositorio externo estudiado, aportación adaptada, usuarios y nivel de incorporación',
        cols: ['Fuente o repositorio original', 'Qué hemos aprendido y adaptado', 'Quién lo utiliza', 'Incorporación real'],
        rows: [
          ['<strong>Método MIT y Spec-Driven Development</strong>', 'Leer las fuentes vivas, acordar la especificación antes de programar y verificar con pruebas empíricas.', 'Todos los carriles de ingeniería', '<strong>Metodología adaptada</strong> en <code>sdp-workflow</code>'],
          ['<strong>Google EGM · El Elefante y los 8 Peces Dorados</strong>', 'Un coordinador con visión global y ocho revisores especializados de un solo foco para detectar fallos sutiles.', 'Orquestación y las <strong>8 escuelas locales</strong> del Node 0', '<strong>Arquitectura adaptada</strong> sin dependencia web'],
          [`${ext(REPOS.ecc, 'affaan-m/everything-claude-code')} (<code>MIT</code>)`, 'Rúbricas contra prosa artificial (<code>deslop</code>), revisión de estados visuales y recorridos completos de clic.', 'Claude, ChatGPT Codex, Gemini y MarIA', '<strong>Estudiado y destilado</strong> · <code>0 %</code> código ajeno en <code>src/</code>'],
          [`<strong>Ingeniería Inversa REA</strong> + ${ext(REPOS.craft, 'storytold/craft-anything')} (<code>MIT OR Apache-2.0</code>)`, 'Inspección real de paquetes compilados (<code>dist/</code>) y extracción de las piezas esenciales de cada oficio rural.', 'Auditoría pre-entrega y diseño funcional', '<strong>Protocolo propio</strong> en <code>core-tecniques-investigacio</code>'],
          [`${ext(REPOS.openSeo, 'every-app/open-seo')} (<code>MIT</code>), <strong>Emowe</strong> y <strong>Vigilant Tellado</strong>`, 'Listas de control para tarjetas compartidas sin rastreadores, semáforo de salud de skills y perímetro WordPress.', 'Consola Termodinámica y puertas de publicación', '<strong>Reimplementado de cero</strong> en <code>tooling/</code>'],
        ],
      },
      {
        titol: '3 · Motores libres en reserva en el Node 0 y piezas descartadas',
        intro: 'Herramientas gratuitas consultadas o alojadas localmente en el servidor del pueblo, sin añadir peso al navegador, junto al registro honesto de descartes.',
        caption: 'Repositorio libre en el Node 0 o descartado, utilidad, destinatarios y estado real',
        cols: ['Repositorio y licencia', 'Utilidad para el pueblo o motivo de descarte', 'Destinatarios', 'Estado real'],
        rows: [
          [`${ext(REPOS.selfhosted, 'awesome-selfhosted/awesome-selfhosted')} (<code>CC-BY-SA-3.0</code>)`, 'Catálogo de <code>1.361</code> fichas de software libre para elegir alternativas abiertas sin ataduras comerciales.', 'Arquitectura y escuelas del Node 0', '<strong>Consulta local en el Node 0</strong> · <code>0 B</code> en la web'],
          [`${ext(REPOS.cal, 'calcom/cal.diy')} (<code>MIT</code>) y ${ext(REPOS.wanderer, 'Flomp/wanderer')} (<code>AGPL-3.0</code>)`, 'Referencias de horarios para reservar instalaciones municipales (frontón o salas) y trazas GPX de senderismo.', 'Futuros módulos municipales y <a href="/page/rutes-de-poble">Rutas de Pueblo</a>', '<strong>Referencia técnica</strong> · Sin servidor ajeno activo'],
          [`${ext(REPOS.voiceStudio, 'debpalash/VoiceStudio')} (<code>AGPL-3.0</code>) y ${ext(REPOS.openWhispr, 'OpenWhispr/openwhispr')} (<code>MIT</code>)`, 'Taller local en <strong>chip Apple M4</strong> para locuciones culturales y estudio de dictado por voz para mayores.', 'Taller sonoro del Node 0 y memoria oral', '<strong>Taller local / en diseño</strong> · Fuera de la nube'],
          [`${ext(REPOS.cap, 'CapSoftware/Cap')} (<code>AGPL-3.0</code>; crates <code>cap-camera*</code> y <code>scap-*</code> bajo <code>MIT</code>)`, 'Grabador libre de escritorio para preparar vídeos breves de ayuda visual para vecinos y ayuntamientos.', 'Comunicación didáctica humana', '<strong>Herramienta de escritorio</strong> · Fuera de la aplicación'],
          [`${ext(REPOS.appFlowy, 'AppFlowy')}, ${ext(REPOS.openProject, 'openproject')} y ${ext(REPOS.chatwoot, 'chatwoot')}`, 'Estudiados para tablas, hitos y buzón, pero cubiertos ya por nuestro Bloc de Notas, Mapa de Ruta y Chat.', 'Consulta puntual de diseño', '<strong>No desplegados</strong> · Evitamos duplicar servidores'],
          [`${ext(REPOS.higgsfield, 'wide-trace/open-higgsfield')} (sin licencia abierta)`, 'Sin licencia libre verificada y dependiente de claves externas de pago.', 'Ningún uso', '<strong>Descartado y bloqueado</strong> por higiene legal'],
        ],
      },
    ],
    ctaWiki: 'Abrir el inventario completo en la Wiki de Poble',
    ctaConsola: 'Explorar la Consola Termodinámica',
  },
  en: {
    title: 'The Nervous System of Sóc de Poble',
    subtitle: 'How 43 skills, automated tractors and human governance work together',
    imageAlt: 'Bruguera-style comic illustration in the village square: a grandmother works the levers of a large wooden machine full of gauges and bells, two little tin robots with light bulbs on their heads keep watch, and a neighbour in a beret and sash, holding a clipboard, jumps in surprise next to a goat',
    lead: 'A plain-language guide for non-programmers: what craft instructions (skills) are, what automated tractors verify, and the exact status of every open repository studied or stored on Node 0.',
    seccions: [
      [
        'Written neurons and mechanical reflexes',
        'Building a civic tool that feels effortless for an <strong>older neighbour</strong> requires institutional memory and discipline. At Sóc de Poble we split this into two parts: <strong>neurons</strong> (the <strong>43 skills</strong> in <code>.agents/skills/</code>, concise craft manuals written in plain language) and <strong>muscular reflexes</strong> (the deterministic JavaScript <code>.mjs</code> <strong>tractors and gates</strong> in <code>tooling/</code>).',
        'A <strong>skill</strong> sets the criteria before touching anything: how to format text readable in bright sunlight, how to honour <strong>Pedra Seca</strong> design, or how to protect privacy. A <strong>tractor</strong> never guesses or gets tired: it verifies <strong>48 × 48 pixel</strong> touch targets, <strong>AAA</strong> contrast, unbroken links, and the WordPress bundle size budget. If a check fails, delivery stops.',
      ],
      [
        'Why humans govern even when nobody hand-types code',
        'We no longer type screens character by character on a keyboard, yet <strong>no machine makes decisions for the village</strong>. Human direction by <strong>Javi Llinares</strong> defines rural use cases, safeguards simplicity, and approves every change before production.',
        'Inside the digital workshop, <strong>IAIA MarIA</strong> coordinates three isolated build lanes (<strong>Claude</strong>, <strong>ChatGPT Codex</strong>, and <strong>Gemini</strong>) in ephemeral clones (<code>/tmp/</code>), consults the <strong>12 Council members</strong> with full project context, and pairs reviews with the <strong>8 local review schools</strong> running on Ollama at <a href="/page/node-zero"><strong>Node 0</strong></a> (<code>Mac mini</code> with an <strong>Apple M4 chip</strong>). Every package is verified with real tests and <strong>SHA-256</strong> hashes.',
      ],
    ],
    titolMapa: 'Where every piece comes from: native, adapted, or in local reserve',
    introMapa: 'To avoid tech hype, three verifiable tables separate our native machinery, open methodologies studied without copying foreign browser code, and free engines stored at Node 0 adding <strong>0 bytes</strong> to the web app.',
    taules: [
      {
        titol: '1 · 100% native Sóc de Poble machinery',
        intro: 'Built and maintained entirely inside this repository to govern design, documentation, and security.',
        caption: 'Native piece or family, plain-language role, users, and incorporation status',
        cols: ['Piece or family', 'What it does in plain words', 'Who uses it', 'Real status'],
        rows: [
          ['<strong>Governance, context, and memory skills</strong> (<code>core-*</code>: 27 skills)', 'Preserve village voice, prevent blind edits, keep the Desk clean, and enforce security and readability.', 'MarIA, Claude, ChatGPT Codex, Gemini, and human lead', '<strong>100% native</strong> · Active in repository'],
          ['<strong>Product and Pedra Seca skills</strong> (<code>sdp-*</code>: 12 skills)', 'Define AAA visual rules, workspace columns, rural POS, family chat, and essential rural use cases.', 'Build teams and neighbours (visual outcome)', '<strong>100% native</strong> · Written in <code>.agents/skills/</code>; applied in <code>src/</code>'],
          ['<strong>Wiki lifecycle skills</strong> (<code>wiki-*</code>: 4 skills)', 'Enforce canonical templates for plans and minutes and keep code and Wiki aligned.', 'MarIA and technical secretariat', '<strong>100% native</strong> · Active via <code>document.mjs</code>'],
          ['<strong>Mechanical gate chain</strong> (<code>tooling/gates/</code>, <code>wiki/</code>, and <code>brain/</code>)', 'Over sixty deterministic checks for contrast, keyboard navigation, censuses, CSS vocabulary, and bundle size.', 'Automated local run before every delivery', '<strong>100% native</strong> · Deterministic Node.js'],
        ],
      },
      {
        titol: '2 · Studied and adapted open methodologies and repositories',
        intro: 'Engineering schools analysed and distilled into our own rules and gates, with zero foreign web code embedded.',
        caption: 'Studied external methodology or repository, adapted lesson, users, and incorporation level',
        cols: ['Original source or repository', 'What we learned and adapted', 'Who uses it', 'Real incorporation'],
        rows: [
          ['<strong>MIT Semantic Accumulation & Spec-Driven Development</strong>', 'Read live sources first, lock written specifications before coding, and validate empirically.', 'All engineering lanes', '<strong>Adapted methodology</strong> in <code>sdp-workflow</code>'],
          ['<strong>Google EGM · The Elephant and 8 Goldfish</strong>', 'One global-context coordinator paired with eight single-focus reviewers to catch subtle defects.', 'Orchestration and the <strong>8 local review schools</strong> at Node 0', '<strong>Adapted architecture</strong> with zero web dependency'],
          [`${ext(REPOS.ecc, 'affaan-m/everything-claude-code')} (<code>MIT</code>)`, 'Rubrics against AI filler prose (<code>deslop</code>), UI state audits, and end-to-end click-path checks.', 'Claude, ChatGPT Codex, Gemini, and MarIA', '<strong>Studied & distilled</strong> · <code>0%</code> foreign code in <code>src/</code>'],
          [`<strong>REA Artifact Inspection</strong> + ${ext(REPOS.craft, 'storytold/craft-anything')} (<code>MIT OR Apache-2.0</code>)`, 'Inspection of compiled bundles (<code>dist/</code>) and extraction of essential rural craft invariants.', 'Pre-release audit and feature design', '<strong>Native protocol</strong> in <code>core-tecniques-investigacio</code>'],
          [`${ext(REPOS.openSeo, 'every-app/open-seo')} (<code>MIT</code>), <strong>Emowe</strong>, and <strong>Vigilant Tellado</strong>`, 'Tracker-free social metadata checks, skill health traffic lights, and WordPress perimeter inspection.', 'Thermodynamic Console and release gates', '<strong>Reimplemented from scratch</strong> in <code>tooling/</code>'],
        ],
      },
      {
        titol: '3 · Free engines in reserve at Node 0 and discarded items',
        intro: 'Zero-cost open tools consulted or hosted locally on the village server without adding browser weight, plus transparent discards.',
        caption: 'Open repository at Node 0 or discarded item, purpose, audience, and real status',
        cols: ['Repository and licence', 'Village purpose or reason for discard', 'Audience', 'Real status'],
        rows: [
          [`${ext(REPOS.selfhosted, 'awesome-selfhosted/awesome-selfhosted')} (<code>CC-BY-SA-3.0</code>)`, 'Catalogue of <code>1,361</code> free self-hosted software records to select open tools without vendor lock-in.', 'Architecture team and Node 0 schools', '<strong>Local reference at Node 0</strong> · <code>0 B</code> on web'],
          [`${ext(REPOS.cal, 'calcom/cal.diy')} (<code>MIT</code>) & ${ext(REPOS.wanderer, 'Flomp/wanderer')} (<code>AGPL-3.0</code>)`, 'Slot-booking logic for municipal courts/rooms and GPX trail schemas for local hiking routes.', 'Future municipal modules & <a href="/page/rutes-de-poble">Village Trails</a>', '<strong>Technical reference</strong> · No foreign server deployed'],
          [`${ext(REPOS.voiceStudio, 'debpalash/VoiceStudio')} (<code>AGPL-3.0</code>) & ${ext(REPOS.openWhispr, 'OpenWhispr/openwhispr')} (<code>MIT</code>)`, 'Local studio on <strong>Apple M4 chip</strong> for cultural narration and local voice-dictation research for elders.', 'Node 0 audio workshop & oral history', '<strong>Local workshop / in design</strong> · Off-cloud'],
          [`${ext(REPOS.cap, 'CapSoftware/Cap')} (<code>AGPL-3.0</code>; <code>cap-camera*</code> and <code>scap-*</code> crates under <code>MIT</code>)`, 'Open desktop screen recorder to produce short visual help guides for neighbours and town halls.', 'Human didactic communication', '<strong>Desktop helper</strong> · Outside app codebase'],
          [`${ext(REPOS.appFlowy, 'AppFlowy')}, ${ext(REPOS.openProject, 'openproject')}, & ${ext(REPOS.chatwoot, 'chatwoot')}`, 'Reviewed for tables, grant milestones, and shared inbox, already covered by our Notes, Roadmap, and Chat.', 'Occasional design reference', '<strong>Not deployed</strong> · Avoids duplicate heavy servers'],
          [`${ext(REPOS.higgsfield, 'wide-trace/open-higgsfield')} (no verified open licence)`, 'Lacks a verified open-source licence and depends on paid external API keys.', 'None', '<strong>Discarded & blocked</strong> for legal hygiene'],
        ],
      },
    ],
    ctaWiki: 'Open the full inventory in the Village Wiki',
    ctaConsola: 'Explore the Thermodynamic Console',
  },
  eu: {
    title: 'Sóc de Pobleren Nerbio Sistema',
    subtitle: 'Nola uztartzen diren 43 skillak, traktore automatikoak eta giza gobernantza',
    imageAlt: 'Bruguera estiloko komiki-ilustrazioa herriko plazan: amona batek manometroz eta kanpaiz betetako egurrezko makina handi baten palankak erabiltzen ditu, buruan bonbilla duten txapazko bi robot txikik zaintzen dute, eta txapela, gerriko gorria eta idazoltza dituen auzokide batek salto egiten du harrituta ahuntz baten ondoan',
    lead: 'Informatika-prestakuntzarik ez duen edonorentzako gida argia: zer diren lanbide-jarraibideak (skillak), zer egiaztatzen duten traktore automatikoek eta zein den Node 0n aztertzen edo gordetzen dugun pieza bakoitzaren benetako egoera.',
    seccions: [
      [
        'Idatzizko neuronak eta erreflexu mekanikoak',
        '<strong>Adineko pertsona batentzat</strong> erraza izango den tresna zibiko bat eraikitzeko memoria eta diziplina behar dira. Sóc de Poblen bi pieza bereiziz konpontzen dugu hori: <strong>neuronak</strong> (<code>.agents/skills/</code> karpetako <strong>43 skillak</strong>, giza hizkuntzan idatzitako eskuliburu laburrak) eta <strong>gihar-erreflexuak</strong> (<code>tooling/</code> karpetako JavaScript <code>.mjs</code> <strong>traktore eta ateak</strong>).',
        '<strong>Skill</strong> batek irizpidea azaltzen du ezer ukitu aurretik: nola maketatu eguzkitan ondo irakurtzeko testua, nola errespetatu <strong>Pedra Seca</strong> diseinua edo nola babestu pribatutasuna. <strong>Traktore</strong> batek ez du iritzirik ematen eta ez da nekatzen: botoiek gutxienez <strong>48 × 48 pixel</strong> dituztela, kontrasteak <strong>AAA</strong> maila betetzen duela, estekak osorik daudela eta WordPresseko paketeak pisu-muga errespetatzen duela neurtzen du.',
      ],
      [
        'Zergatik agintzen duen gizakiak inork kodea eskuz tekleatu ez arren',
        'Gaur egun ez ditugu pantailak letraz letra teklatuarekin idazten, baina <strong>inongo makinak ez du herriaren izenean erabakitzen</strong>. <strong>Javi Llinaresen</strong> giza zuzendaritzak finkatzen ditu landa-erabilerak, sinpletasuna lehenesten du eta ekoizpenera igaro aurretik aldaketa bakoitza onartzen du.',
        'Tailer digitalean, <strong>IAIA MarIAk</strong> kopia isolatuetan (<code>/tmp/</code>) hiru eraikuntza-errei koordinatzen ditu (<strong>Claude</strong>, <strong>ChatGPT Codex</strong> eta <strong>Gemini</strong>), proiektuaren testuinguru osoarekin <strong>Kontseiluko 12 kideei</strong> kontsulta egiten die eta berrikuspenak <a href="/page/node-zero"><strong>Node 0</strong></a> zerbitzariko (<strong>Apple M4 txipa</strong> duen <code>Mac mini</code>) Ollamaren <strong>8 eskola lokaletan</strong> bermatzen ditu, <strong>SHA-256</strong> egiaztapenarekin.',
      ],
    ],
    titolMapa: 'Nondik datorren pieza bakoitza: propioa, egokitua edo erreserba lokalean',
    introMapa: 'Ke teknologikoa saihesteko, hiru taula egiaztagarritan bereizten ditugu gure tresna propioak, nabigatzailean kanpoko koderik kopiatu gabe aztertutako metodologia irekiak eta webean <strong>0 byte</strong> gehituz Node 0n gordetako programa libreak.',
    taules: [
      {
        titol: '1 · Sóc de Pobleren makineria % 100 propioa',
        intro: 'Biltegian bertan osorik eraikia eta mantendua, diseinua, dokumentazioa eta segurtasuna gobernatzeko.',
        caption: 'Pieza edo familia propioa, azalpen erraza, nork erabiltzen duen eta txertatze-egoera',
        cols: ['Pieza edo familia', 'Zer egiten du hitz errazetan', 'Nork erabiltzen du', 'Benetako egoera'],
        rows: [
          ['<strong>Gobernu, testuinguru eta memoria skillak</strong> (<code>core-*</code>: 27 skill)', 'Herriko ahotsa zaintzen dute, itsu-itsuko aldaketak saihesten dituzte, Mahaia garbi mantentzen dute eta segurtasuna bermatzen dute.', 'MarIA, Claude, ChatGPT Codex, Gemini eta giza zuzendaritza', '<strong>% 100 propioa</strong> · Biltegian aktibo'],
          ['<strong>Produktu eta Pedra Seca skillak</strong> (<code>sdp-*</code>: 12 skill)', 'AAA ikus-arauak, lan-zutabeak, landa-TPVa, familia-txata eta landa-erabilera kasuak definitzen dituzte.', 'Eraikuntza-taldeak eta auzokideak (emaitza bisuala)', '<strong>% 100 propioa</strong> · <code>.agents/skills/</code> karpetan idatziak; <code>src/</code> karpetan aplikatuak'],
          ['<strong>Wikiaren ziklo dokumentaleko skillak</strong> (<code>wiki-*</code>: 4 skill)', 'Plan eta aktetarako txantiloi kanonikoak bermatzen dituzte eta kodearen eta Wikiaren arteko koherentzia zaintzen dute.', 'MarIA eta idazkaritza teknikoa', '<strong>% 100 propioa</strong> · <code>document.mjs</code> bidez aktibo'],
          ['<strong>Ate eta traktoreen katea</strong> (<code>tooling/gates/</code>, <code>wiki/</code> eta <code>brain/</code>)', 'Hirurogei egiaztatzaile automatiko baino gehiago kontrasterako, teklaturako, erroldetarako eta pisu-aurrekonturako.', 'Entrega bakoitzaren aurreko exekuzio automatikoa', '<strong>% 100 propioa</strong> · Node.js determinista'],
        ],
      },
      {
        titol: '2 · Aztertutako eta egokitutako metodologia eta biltegi irekiak',
        intro: 'Aztertutako lan-eskolak, gure arau eta egiaztatzaile propioetara ekarriak, kanpoko web-koderik txertatu gabe.',
        caption: 'Aztertutako kanpoko metodologia edo biltegia, egokitutako ekarpena, erabiltzaileak eta txertatze-maila',
        cols: ['Jatorrizko iturria edo biltegia', 'Zer ikasi eta egokitu dugun', 'Nork erabiltzen du', 'Benetako txertatzea'],
        rows: [
          ['<strong>MIT Metodoa eta Spec-Driven Development</strong>', 'Iturri biziak irakurtzea, programatu aurretik zehaztapena adostea eta proba enpirikoekin egiaztatzea.', 'Ingeniaritza-errei guztiak', '<strong>Metodologia egokitua</strong> <code>sdp-workflow</code> barruan'],
          ['<strong>Google EGM · Elefantea eta 8 Urrezko Arrainak</strong>', 'Ikuspegi orokorreko koordinatzaile bat eta foku bakarreko zortzi berrikusle akats finak harrapatzeko.', 'Orkestrazioa eta Node 0ko <strong>8 eskola lokalak</strong>', '<strong>Arkitektura egokitua</strong> web-menpekotasunik gabe'],
          [`${ext(REPOS.ecc, 'affaan-m/everything-claude-code')} (<code>MIT</code>)`, 'Prosa artifizialaren aurkako errubrikak (<code>deslop</code>), pantaila-egoeren berrikuspena eta klik-ibilbideen ikuskaritza.', 'Claude, ChatGPT Codex, Gemini eta MarIA', '<strong>Aztertua eta destilatua</strong> · <code>% 0</code> kanpoko kode <code>src/</code>-n'],
          [`<strong>REA Alderantzizko Ingeniaritza</strong> + ${ext(REPOS.craft, 'storytold/craft-anything')} (<code>MIT OR Apache-2.0</code>)`, 'Konpilatutako paketeen (<code>dist/</code>) ikuskapena eta landa-lanbide bakoitzaren funtsezko piezen erauzketa.', 'Entrega aurreko auditoria eta diseinu funtzionala', '<strong>Protokolo propioa</strong> <code>core-tecniques-investigacio</code>-n'],
          [`${ext(REPOS.openSeo, 'every-app/open-seo')} (<code>MIT</code>), <strong>Emowe</strong> eta <strong>Vigilant Tellado</strong>`, 'Jarraitzailerik gabeko txartel partekatuen kontrola, skillen osasun-semaforoa eta WordPress perimetroa.', 'Kontsola Termodinamikoa eta argitalpen-ateak', '<strong>Hutsetik berridatzia</strong> <code>tooling/</code> barruan'],
        ],
      },
      {
        titol: '3 · Node 0n erreserban dauden motor libreak eta baztertutako piezak',
        intro: 'Herriko zerbitzarian lokalki kontsultatutako edo gordetako doako tresnak, nabigatzaileari pisurik gehitu gabe, bazterketen erregistro zintzoarekin batera.',
        caption: 'Node 0ko biltegi librea edo baztertua, erabilgarritasuna, hartzaileak eta benetako egoera',
        cols: ['Biltegia eta lizentzia', 'Herriarentzako erabilera edo baztertzeko arrazoia', 'Hartzaileak', 'Benetako egoera'],
        rows: [
          [`${ext(REPOS.selfhosted, 'awesome-selfhosted/awesome-selfhosted')} (<code>CC-BY-SA-3.0</code>)`, 'Software libreko <code>1.361</code> fitxako katalogoa, lotura komertzialik gabeko tresna irekiak aukeratzeko.', 'Arkitektura eta Node 0ko eskolak', '<strong>Kontsulta lokala Node 0n</strong> · <code>0 B</code> webean'],
          [`${ext(REPOS.cal, 'calcom/cal.diy')} (<code>MIT</code>) eta ${ext(REPOS.wanderer, 'Flomp/wanderer')} (<code>AGPL-3.0</code>)`, 'Udal-instalazioak (frontoia edo aretoak) erreserbatzeko ordutegi-logika eta mendi-ibilbideetarako GPX eskemak.', 'Etorkizuneko udal-moduluak eta <a href="/page/rutes-de-poble">Herriko Ibilbideak</a>', '<strong>Erreferentzia teknikoa</strong> · Kanpoko zerbitzaririk gabe'],
          [`${ext(REPOS.voiceStudio, 'debpalash/VoiceStudio')} (<code>AGPL-3.0</code>) eta ${ext(REPOS.openWhispr, 'OpenWhispr/openwhispr')} (<code>MIT</code>)`, '<strong>Apple M4 txipeko</strong> tailer lokala kultura-lokuzioetarako eta adinekoentzako ahots-diktaketa ikerketa.', 'Node 0ko soinu-tailerra eta ahozko memoria', '<strong>Tailer lokala / diseinuan</strong> · Hodeitik kanpo'],
          [`${ext(REPOS.cap, 'CapSoftware/Cap')} (<code>AGPL-3.0</code>; <code>cap-camera*</code> eta <code>scap-*</code> crateak <code>MIT</code> lizentziapean)`, 'Mahaigaineko grabagailu librea auzokide eta udalentzako laguntza-bideo laburrak prestatzeko.', 'Giza komunikazio didaktikoa', '<strong>Mahaigaineko tresna</strong> · Aplikaziotik kanpo'],
          [`${ext(REPOS.appFlowy, 'AppFlowy')}, ${ext(REPOS.openProject, 'openproject')} eta ${ext(REPOS.chatwoot, 'chatwoot')}`, 'Taulak, mugarriak eta postontzia aztertzeko ikusiak, baina gure Oharrak, Ibilbide Orria eta Txatarekin ebatziak.', 'Diseinu-kontsulta puntuala', '<strong>Ez hedatuak</strong> · Zerbitzari astunak bikoiztea saihesten dugu'],
          [`${ext(REPOS.higgsfield, 'wide-trace/open-higgsfield')} (lizentzia irekirik gabe)`, 'Egiaztatutako lizentzia librerik gabea eta ordainpeko kanpoko gakoen menpekoa.', 'Erabilerarik ez', '<strong>Baztertua eta blokeatua</strong> lege-higieneagatik'],
        ],
      },
    ],
    ctaWiki: 'Ireki inbentario osoa Herriko Wikian',
    ctaConsola: 'Arakatu Kontsola Termodinamikoa',
  },
  gl: {
    title: 'O Sistema Nervioso de Sóc de Poble',
    subtitle: 'Como se combinan as 43 skills, os tractores automáticos e o goberno humano',
    imageAlt: 'Ilustración de banda deseñada de estilo Bruguera na praza da aldea: unha avoa manexa as pancas dunha gran máquina de madeira chea de manómetros e campás, dous robotiños de folla de lata cunha lámpada na cabeza vixíana e un veciño con boina, faixa e portapapeis brinca sorprendido xunto a unha cabra',
    lead: 'Unha guía clara para calquera persoa sen formación informática: que son as instrucións de oficio (skills), que comproban os tractores automáticos e de onde vén cada peza que estudamos ou gardamos no Node 0.',
    seccions: [
      [
        'Neuronas escritas e reflexos mecánicos',
        'Construír unha ferramenta cívica doada de entender para unha <strong>persoa maior</strong> esixe memoria e disciplina. En Sóc de Poble resolvémolo separando dúas pezas: as <strong>neuronas</strong> (as <strong>43 skills</strong> de <code>.agents/skills/</code>, breves manuais de oficio escritos en linguaxe humana) e os <strong>reflexos musculares</strong> (os <strong>tractores e portas</strong> en JavaScript <code>.mjs</code> de <code>tooling/</code>).',
        'Unha <strong>skill</strong> explica o criterio antes de actuar: como maquetar texto lexible ao sol, como respectar o deseño <strong>Pedra Seca</strong> ou como coidar a privacidade. Un <strong>tractor</strong> non opina nin cansa: mide que os botóns teñan polo menos <strong>48 × 48 píxeles</strong>, que o contraste cumpra o nivel <strong>AAA</strong>, que ningunha ligazón estea rota e que o paquete de WordPress respecte o seu límite de peso. Se unha comprobación falla, a entrega detense.',
      ],
      [
        'Por que a persoa manda aínda que ninguén teclee código á man',
        'Hoxe xa non escribimos as pantallas letra a letra co teclado, pero <strong>ningunha máquina decide pola aldea</strong>. A dirección humana de <strong>Javi Llinares</strong> define os casos de uso rurais, prioriza a sinxeleza e aproba cada cambio antes de entrar en produción.',
        'No obradoiro dixital, a <strong>IAIA MarIA</strong> coordina en copias illadas (<code>/tmp/</code>) tres carrís de construción (<strong>Claude</strong>, <strong>ChatGPT Codex</strong> e <strong>Gemini</strong>), consulta os <strong>12 membros do Consello</strong> co contexto completo do proxecto e apoia as revisións nas <strong>8 escolas locais</strong> de Ollama no <a href="/page/node-zero"><strong>Node 0</strong></a> (<code>Mac mini</code> con <strong>chip Apple M4</strong>). Todo se valida con probas reais e pegadas criptográficas <strong>SHA-256</strong>.',
      ],
    ],
    titolMapa: 'De onde sae cada peza: propia, adaptada ou en reserva local',
    introMapa: 'Para evitar fume tecnolóxico, separamos en tres táboas verificables as nosas ferramentas propias, as metodoloxías abertas estudadas sen copiar código alleo no navegador e os programas libres gardados no Node 0 con <strong>0 bytes</strong> engadidos á web.',
    taules: [
      {
        titol: '1 · Maquinaria 100 % propia de Sóc de Poble',
        intro: 'Construída e mantida integramente no repositorio para gobernar o deseño, a documentación e a seguridade.',
        caption: 'Peza ou familia propia, función sinxela, quen a utiliza e estado de incorporación',
        cols: ['Peza ou familia', 'Que fai en palabras sinxelas', 'Quen a utiliza', 'Estado real'],
        rows: [
          ['<strong>Skills de goberno, contexto e memoria</strong> (<code>core-*</code>: 27 skills)', 'Fixan a voz próxima, evitan cambios ás cegas, manteñen limpo o Escritorio e vixían a seguridade e a lectura.', 'MarIA, Claude, ChatGPT Codex, Gemini e dirección humana', '<strong>100 % propio</strong> · Activo no repositorio'],
          ['<strong>Skills de produto e Pedra Seca</strong> (<code>sdp-*</code>: 12 skills)', 'Definen as regras visuais AAA, as columnas de traballo, o TPV rural, o chat familiar e os casos de uso.', 'Equipos de construción e veciñanza (resultado visual)', '<strong>100 % propio</strong> · Escritas en <code>.agents/skills/</code>; aplicadas en <code>src/</code>'],
          ['<strong>Skills do ciclo documental</strong> (<code>wiki-*</code>: 4 skills)', 'Aseguran modelos canónicos para plans e actas e manteñen viva a coherencia entre código e Wiki.', 'MarIA e secretaría técnica', '<strong>100 % propio</strong> · Activo con <code>document.mjs</code>'],
          ['<strong>Cadea de portas e tractores</strong> (<code>tooling/gates/</code>, <code>wiki/</code> e <code>brain/</code>)', 'Máis de sesenta comprobadores automáticos de contraste, teclado, censos, vocabulario CSS e orzamento de peso.', 'Execución automática antes de cada entrega', '<strong>100 % propio</strong> · Node.js determinista'],
        ],
      },
      {
        titol: '2 · Metodoloxías e repositorios abertos estudados e adaptados',
        intro: 'Escolas de traballo analizadas e traducidas a regras e comprobadores propios, sen incrustar código web alleo.',
        caption: 'Metodoloxía ou repositorio externo estudado, achega adaptada, usuarios e nivel de incorporación',
        cols: ['Fonte ou repositorio orixinal', 'Que aprendemos e adaptamos', 'Quen o utiliza', 'Incorporación real'],
        rows: [
          ['<strong>Método MIT e Spec-Driven Development</strong>', 'Ler as fontes vivas, acordar a especificación antes de programar e verificar con probas empíricas.', 'Todos os carrís de enxeñaría', '<strong>Metodoloxía adaptada</strong> en <code>sdp-workflow</code>'],
          ['<strong>Google EGM · O Elefante e os 8 Peixes Dourados</strong>', 'Un coordinador con visión global e oito revisores especializados dun só foco para detectar erros sutís.', 'Orquestración e as <strong>8 escolas locais</strong> do Node 0', '<strong>Arquitectura adaptada</strong> sen dependencia web'],
          [`${ext(REPOS.ecc, 'affaan-m/everything-claude-code')} (<code>MIT</code>)`, 'Rúbricas contra prosa artificial (<code>deslop</code>), revisión de estados visuais e percorridos completos de clic.', 'Claude, ChatGPT Codex, Gemini e MarIA', '<strong>Estudado e destilado</strong> · <code>0 %</code> código alleo en <code>src/</code>'],
          [`<strong>Enxeñaría Inversa REA</strong> + ${ext(REPOS.craft, 'storytold/craft-anything')} (<code>MIT OR Apache-2.0</code>)`, 'Inspección real de paquetes compilados (<code>dist/</code>) e extracción das pezas esenciais de cada oficio rural.', 'Auditoría pre-entrega e deseño funcional', '<strong>Protocolo propio</strong> en <code>core-tecniques-investigacio</code>'],
          [`${ext(REPOS.openSeo, 'every-app/open-seo')} (<code>MIT</code>), <strong>Emowe</strong> e <strong>Vigilant Tellado</strong>`, 'Listas de control para tarxetas compartidas sen rastrexadores, semáforo de saúde de skills e perímetro WordPress.', 'Consola Termodinámica e portas de publicación', '<strong>Reimplementado de cero</strong> en <code>tooling/</code>'],
        ],
      },
      {
        titol: '3 · Motores libres en reserva no Node 0 e pezas descartadas',
        intro: 'Ferramentas gratuítas consultadas ou aloxadas localmente no servidor da aldea, sen engadir peso ao navegador, xunto co rexistro honesto de descartes.',
        caption: 'Repositorio libre no Node 0 ou descartado, utilidade, destinatarios e estado real',
        cols: ['Repositorio e licenza', 'Utilidade para a aldea ou motivo de descarte', 'Destinatarios', 'Estado real'],
        rows: [
          [`${ext(REPOS.selfhosted, 'awesome-selfhosted/awesome-selfhosted')} (<code>CC-BY-SA-3.0</code>)`, 'Catálogo de <code>1.361</code> fichas de software libre para escoller alternativas abertas sen ataduras comerciais.', 'Arquitectura e escolas do Node 0', '<strong>Consulta local no Node 0</strong> · <code>0 B</code> na web'],
          [`${ext(REPOS.cal, 'calcom/cal.diy')} (<code>MIT</code>) e ${ext(REPOS.wanderer, 'Flomp/wanderer')} (<code>AGPL-3.0</code>)`, 'Referencias de horarios para reservar instalacións municipais (frontón ou salas) e trazas GPX de sendeirismo.', 'Futuros módulos municipais e <a href="/page/rutes-de-poble">Rutas de Aldea</a>', '<strong>Referencia técnica</strong> · Sen servidor alleo activo'],
          [`${ext(REPOS.voiceStudio, 'debpalash/VoiceStudio')} (<code>AGPL-3.0</code>) e ${ext(REPOS.openWhispr, 'OpenWhispr/openwhispr')} (<code>MIT</code>)`, 'Obradoiro local en <strong>chip Apple M4</strong> para locucións culturais e estudo de ditado por voz para maiores.', 'Obradoiro sonoro do Node 0 e memoria oral', '<strong>Obradoiro local / en deseño</strong> · Fóra da nube'],
          [`${ext(REPOS.cap, 'CapSoftware/Cap')} (<code>AGPL-3.0</code>; crates <code>cap-camera*</code> e <code>scap-*</code> baixo <code>MIT</code>)`, 'Gravador libre de escritorio para preparar vídeos breves de axuda visual para veciñanza e concellos.', 'Comunicación didáctica humana', '<strong>Ferramenta de escritorio</strong> · Fóra da aplicación'],
          [`${ext(REPOS.appFlowy, 'AppFlowy')}, ${ext(REPOS.openProject, 'openproject')} e ${ext(REPOS.chatwoot, 'chatwoot')}`, 'Estudados para táboas, fitos e caixa de correo, pero cubertos xa polo noso Bloc de Notas, Mapa de Ruta e Chat.', 'Consulta puntual de deseño', '<strong>Non despregados</strong> · Evitamos duplicar servidores'],
          [`${ext(REPOS.higgsfield, 'wide-trace/open-higgsfield')} (sen licenza aberta)`, 'Sen licenza libre verificada e dependente de chaves externas de pagamento.', 'Ningún uso', '<strong>Descartado e bloqueado</strong> por hixiene legal'],
        ],
      },
    ],
    ctaWiki: 'Abrir o inventario completo na Wiki de Poble',
    ctaConsola: 'Explorar a Consola Termodinámica',
  },
};

const localitzada = (lang) => {
  const c = DADES[lang];
  return {
    title: c.title,
    subtitle: c.subtitle,
    imageAlt: c.imageAlt,
    lead: c.lead,
    html: construeixCos(c),
  };
};

const baseCa = localitzada('ca');

export const PAGINA_SISTEMA_NERVIOS = {
  'sistema-nervios': {
    date: DATA_SISTEMA_NERVIOS,
    image: IMATGE_SISTEMA_NERVIOS,
    imageWidth: 1024,
    imageHeight: 1024,
    contentLanguage: 'ca',
    ...baseCa,
    translations: {
      es: localitzada('es'),
      en: localitzada('en'),
      eu: localitzada('eu'),
      gl: localitzada('gl'),
    },
  },
};
