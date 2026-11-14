/**
 * laVeuDeSocDePobleContent.js · Onada R23 · Contingut editorial canònic en 5
 * llengües de la publicació llarga del Mur «La Veu de Sóc de Poble»
 * (/mur/la-veu-de-soc-de-poble i àlies /page/la-veu-de-soc-de-poble).
 *
 * Lleis editorials estrictes verificades:
 *   · Marca i sintagma: SEMPRE «de poble» / «Sóc de Poble» (mai «del poble» ni «dels pobles», ni «sobirà»).
 *   · Llei 0 (Honestedat Radical): diferencia nítidament què ja escoltem hui
 *     (síntesi immediata al navegador + les 7 mostres obertes de Matxa-TTS v2
 *     sintetitzades al Node 0 i suport en els corpus NEL-VIVES de la Universitat
 *     d'Alacant) i què estem obrint en proves al Mac mini M4 (túnel públic de
 *     veu neuronal gratuïta i arxiu oral participatiu CC BY-SA 4.0).
 *   · Targeta incrustada canònica: `pagina:node-zero` flotant a la dreta (`360px`).
 */

export const LA_VEU_DE_SOC_DE_POBLE_ID = 'la-veu-de-soc-de-poble';
export const LA_VEU_DE_SOC_DE_POBLE_RUTA = `/mur/${LA_VEU_DE_SOC_DE_POBLE_ID}`;

const atributHtml = (valor) => String(valor ?? '')
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

function grupTargetaNodeZero(langReserva = null) {
  const titol = "Node 0 · Mac mini M4: el servidor de l'habitació";
  const subtitol = 'El maquinari del pilot comunitari, les mesures de màquina i allò que queda per verificar';
  const entradilla = 'El Node 0 és el Mac mini Apple M4 de La Torre de les Maçanes (10 nuclis i 24 GiB de memòria mesurats per SSH el 3 de novembre). Des del 3 de novembre de 2026 servix el node pilot operatiu socdepoble.cat a través de Cloudflare amb NodeInfo 2.1, WebFinger dinàmic, manifest Ed25519 signat i streaming d’arxius multimèdia pesants (HTTP 206), descarregant el servidor principal mentre compartix encara el mateix backend Supabase.';
  const imatge = '/assets/uploads/brain/mac_mini_m4_1787721966622.webp';
  const langAttr = langReserva ? ` lang="${atributHtml(langReserva)}"` : '';
  return [
    '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">',
    `<div data-sdp-targeta="pagina:node-zero" class="sdp-targeta" data-ruta="/page/node-zero"${langAttr}`,
    ` data-titol="${atributHtml(titol)}" data-subtitol="${atributHtml(subtitol)}"`,
    ` data-entradilla="${atributHtml(entradilla)}" data-imatge="${atributHtml(imatge)}"`,
    ' data-autor="Sóc de Poble" data-autor-ruta="/projecte">',
    `<a href="/page/node-zero" rel="noopener noreferrer nofollow">${atributHtml(titol)}</a>`,
    '</div></div>',
  ].join('');
}

export const GRUP_TARGETA_NODE_ZERO_CA = grupTargetaNodeZero(null);
export const GRUP_TARGETA_NODE_ZERO_TRADUIT = grupTargetaNodeZero('ca');

export const LA_VEU_DE_SOC_DE_POBLE_HTML = [
  '<h3>1. Quan els amics escolten per WhatsApp i diuen la veritat com un temple</h3>',
  '<p>Tot ha començat com comencen les coses de veritat a les nostres comarques: compartint per WhatsApp dos vídeos curts d’<strong>Oli de La Torre</strong> amb la quadrilla d’amics. La imatge emocionava, el relat de les oliveres s’entenia i l’oli lluïa com l’or líquid que és, però gairebé tots van assenyalar amb carinyo la mateixa cosa abans que s’acabara el primer minut: <em>«Xiquet, se sent molt net, però eixa veu és de Barcelona; no pareix una amiga de La Torre, ni de Xixona, ni de L’Alacantí, ni d’Alcoi!»</em>.</p>',
  '<p>Tenien tota la raó del món. Quan parles d’unes oliveres centenàries agarrades als marges de pedra seca de <strong>La Torre de les Maçanes (L’Alacantí)</strong>, mirant cap a Aitana, el Rentonar i les valls veïnes, la veu no és un embolcall tècnic ni un detall secundari: <strong>la veu és memòria, casa i confiança</strong>. Si una eina digital vol ser de veres <strong>de poble</strong> —pensada perquè una persona gran polse un botó i escolte una notícia, una recepta o un ban com si li’l contara una veïna a la fresca—, no pot parlar sempre amb un únic accent estàndard de laboratori com si totes les comarques sonaren igual.</p>',

  '<h3>2. Com ho fem perquè este servei de veu siga 100 % gratuït: el Mac mini M4 i el Node 0</h3>',
  GRUP_TARGETA_NODE_ZERO_CA,
  '<p>La primera pregunta que ens fan sempre és molt directa: <strong>com podeu oferir síntesi de veu neuronal sense cobrar quotes ni posar publicitat?</strong> Al mercat actual, les grans plataformes comercials de veu al núvol facturen un <strong>peatge per cada caràcter, síl·laba o minut d’àudio generat</strong>. Per a una empresa amb subscripcions cares eixe model pot funcionar, però per a un projecte cívic i rural sense ànim de lucre seria una trampa: com més gent gran escoltara cròniques llargues, contes, receptes i converses, més pujaria una factura mensual impossible de sostindre.</p>',
  '<p>La nostra resposta és aplicar l’economia de la <strong>pedra seca</strong> a la tecnologia: en lloc de llogar veus alienes pagant per cada paraula al núvol, hem instal·lat a <strong>el Mas</strong> (a La Torre de les Maçanes, L’Alacantí) el nostre propi cor físic de càlcul, el <a href="/page/node-zero"><strong>Node 0</strong></a>. Es tracta d’un xicotet <strong>Mac mini amb xip Apple M4 de 10 nuclis i 24 GiB de memòria unificada</strong>, silenciós i d’escala domèstica, que ja servix el pilot operatiu <code>socdepoble.cat</code> i que calcula els models oberts a casa mateix. Una vegada encés l’aparell, <strong>sintetitzar mil frases o cent mil té cost marginal zero en llicències i peatges externs</strong>: així garantim que escoltar Sóc de Poble continue sent un servei obert i gratuït per a qualsevol veïna o veí.</p>',

  '<h3>3. L’equip d’IAs amb què treballem i els sistemes especialitzats de llengua que hem descarregat</h3>',
  '<p><strong>Sóc de Poble</strong> es construeix amb un ofici híbrid poc habitual: un coordinador humà treballant colze a colze amb una taula ben avinguda d’intel·ligències artificials. Per als dissenys grans, la seguretat i l’arquitectura col·laborem amb models d’escriptori de frontera (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em> i l’orquestradora <em>IAIA MarIA</em>), mentre que dins del mateix <strong>Node 0</strong> conviuen <strong>huit escoles locals obertes sobre Ollama</strong> (<em>Qwen</em>, <em>DeepSeek</em>, <em>Gemma 3</em>, <em>Hermes</em>, <em>Mistral</em>, <em>GLM-4</em> i <em>Phi-4</em>) que revisen en grup les nostres publicacions abans d’eixir a la llum i classifiquen memòria sense dependre de tercers.</p>',
  '<p>Ara bé, en posar-nos a treballar la llengua viva de cada comarca hem comprovat una lliçó fonamental: <strong>amb els grans models generalistes de conversa no n’hi ha prou per a parlar bé la nostra llengua</strong>. Necessitàvem descarregar i posar a prova al Node 0 <strong>sistemes especialitzats de síntesi neuronal, fonètica i corpus orals oberts</strong> creats específicament per la comunitat científica de casa nostra:</p>',
  '<ul>',
  '<li><strong>Matxa-TTS v2 Multiaccent (Projecte AINA · Barcelona Supercomputing Center i alVoCat):</strong> hem descarregat al Node 0 este motor neuronal obert en format <strong>ONNX (260 MB)</strong> amb llicència lliure per a usos no comercials. En les proves acústiques verificades sobre el xip M4 genera <strong>9 segons de veu nítida en tot just 1,3 segons</strong> (factor de temps real <code>0,15</code>), amb quatre veus valencianes d’estudi verificades per freqüència fonamental (dues femenines, <em>Gina</em> i <em>Berta</em>, i dues masculines, <em>Arnau</em> i <em>Lluc</em>) al costat de la nord-occidental (<em>Emma</em>), la central (<em>Èlia</em>) i la balear (<em>Olga</em>).</li>',
  '<li><strong>Corpus orals NEL-VIVES del centre CENID (Universitat d’Alacant) i criteris de l’AVL:</strong> ens recolzem en els recursos oberts d’investigació lingüística impulsats des d’Alacant i en la normativa valenciana de l’Acadèmia Valenciana de la Llengua per a cuidar el timbre de les vocals obertes, les sibilants sonores, les caigudes naturals i el vocabulari meridional que els motors genèrics solen ignorar.</li>',
  '<li><strong>Whisper i laboratori d’adaptació acústica sobre Apple Silicon (F5-TTS-MLX):</strong> al costat del sintetitzador, hem instal·lat al Mac mini les eines obertes de transcripció i alineació fonètica que ens permetran anar afinant progressivament les variants dialectals de cada territori a mesura que reunim mostres orals cedides amb permís explícit.</li>',
  '</ul>',

  '<h3>4. La intel·ligència tradicional ensenyant a la intel·ligència artificial (i per què cap veu d’estudi parla encara com a La Torre)</h3>',
  '<p>Vos contem una anècdota real d’estes mateixes proves perquè s’entenga per què fem este projecte. Quan li hem preguntat en fred a un model local menut, sense diccionari de terra al davant, què volia dir la paraula <em>rabosa</em> en una dita de muntanya, ens ha respost ben convençut que era <em>«un conill menut»</em>! Passa fins i tot amb els noms de les nostres serres: als mapes i a la Viquipèdia hi ix escrit <em>Serra del Rontonar</em>, mentre que a La Torre de les Maçanes tota la vida s’ha dit <em>«mosatros diem el Rentonar»</em> (igual que s’hi diu <em>aspencat</em>, <em>pual</em>, <em>querilla</em> o <em>queraïlla</em>). I encara hem comprovat una segona veritat escoltant les mostres: <strong>tot i que les quatre veus valencianes de Matxa-TTS v2 sonen netes i naturals, són veus d’estudi entrenades sobre valencià general i cap d’elles no parla encara amb el deix exacte, la melodia i la cadència amb què parlem a La Torre de les Maçanes (L’Alacantí), a Xixona o a les valls d’Aitana i el Rentonar</strong>.</p>',
  '<p>Ací rau precisament la idea mare de <strong>La Veu de Sóc de Poble</strong>: no conformar-nos amb quatre locutors genèrics de laboratori, sinó <strong>utilitzar la intel·ligència tradicional de casa nostra per a ensenyar, corregir i millorar la intel·ligència artificial</strong>. Són les nostres iaies i iaios, els llauradors d’olivera, les forneres i les quadrilles de cada comarca qui guarden el tresor viu que cap servidor llunyà coneix: des del valencià de L’Alacantí i les Valls del Vinalopó (on conviuen <em>hui</em> a la serra i <em>avui</em> cap a la costa al costat d’<em>eixir</em>, <em>creïlla</em>, <em>bresquilla</em> i <em>espencat</em>), passant pel Comtat, l’Alcoià, la Marina i la Vall d’Albaida; el <em>comboi</em>, les <em>bajoques</em> i els <em>fesols</em> de la Safor, la Costera, la Ribera i l’Horta; la <em>pataca</em> i la <em>tomata</em> de la Plana, el Maestrat i els Ports; fins a les Terres de l’Ebre, Ponent, la Catalunya Central, Girona i el <em>trempó</em> i la <em>tomàtiga</em> de les Illes Balears. Cap d’estes maneres de parlar val més que una altra: <strong>totes juntes fan la llengua sencera</strong>.</p>',

  '<h3>5. Com funciona el Selector de Veus al menú «Traduir» i en quin punt estem hui (Llei 0)</h3>',
  '<p>Perquè tota esta riquesa siga fàcil d’utilitzar sense omplir la barra superior amb més botons, hem integrat la lectura oral directament dins de la icona <strong>Traduir</strong> de cada pàgina: amb un sol toc podeu polsar <strong>«Escoltar esta pàgina en veu alta»</strong> i deixar triada la vostra opció preferida dins de <strong>«Veu i accent»</strong>.</p>',
  '<p>Seguint la nostra <strong>Llei 0 d’honestedat radical</strong>, vos expliquem amb transparència cristal·lina què ja fa l’aplicació hui mateix i quin pas estem construint entre tots:</p>',
  '<ul>',
  '<li><strong>El que ja funciona hui en directe des del Node 0:</strong> quan escoltes qualsevol pàgina o refrany en la nostra llengua, el dispositiu es connecta gratuïtament al motor neuronal obert <strong>Matxa-TTS v2 del nostre Mac mini M4</strong> utilitzant <strong>qualsevol de les 7 veus obertes que tries</strong> (<em>Gina</em>, <em>Arnau</em>, <em>Berta</em>, <em>Lluc</em>, <em>Emma</em>, <em>Èlia</em> o <em>Olga</em>), amb degradació automàtica al motor del dispositiu per a les traduccions o si no hi ha cobertura.</li>',
  '<li><strong>El pas que construïm ara amb la vostra veu:</strong> amb les paraules i gravacions de 15 segons que cediu lliurement ací mateix (<code>CC BY-SA 4.0</code>) anirem entrenant al Node 0 adaptacions acústiques comarcals perquè, pas a pas, La Torre, L’Alacantí, El Comtat, el Maestrat i cada comarca tinguen una veu que els reconega de veres.</li>',
  '</ul>',

  '<h3>6. Juga a «D’on parles?» i grava els refranys de la teua comarca</h3>',
  '<p>Per a ensenyar de veres a una IA les variants de cada territori fan falta dos ingredients que van de la mà: <strong>les paraules vives (el lèxic)</strong> i <strong>la música exacta de la veu (la prosòdia i l’entonació)</strong>. Per això hem reunit en esta mateixa pàgina un doble laboratori obert a tothom:</p>',
  '<ul>',
  '<li>A dalt de tot teniu el joc interactiu <strong>«D’on parles?»</strong>: en <strong>12 paraules quotidianes</strong> descobreixes amb quines comarques coincideix més la teua parla, actives d’un clic la veu recomanada i pots apuntar a la bústia <em>«Al meu poble ho diem d’una altra manera!»</em> eixos mots de casa que no ixen als manuals.</li>',
  '<li>Just a continuació del banc de veus teniu el <strong>Refranyer Sonor per Comarques</strong>: <strong>32 dites tradicionals</strong> d’oratge, olivera, taula i convivència on podeu polsar el micròfon, <strong>gravar fins a 15 segons amb la vostra pròpia veu</strong> dient de quin poble sou i cedir-ho lliurement (<code>CC BY-SA 4.0</code>) per anar construint un arxiu oral viu i ètic.</li>',
  '</ul>',
  '<p>Proveu el joc, escolteu les set veus del banc, graveu un refrany amb els majors de casa i passeu l’enllaç pel grup de WhatsApp de la quadrilla: <strong>amb un Mac mini a casa i la saviesa tradicional de la nostra gent, farem que la tecnologia parle amb l’accent de cada comarca i sense cost per a ningú</strong>.</p>',
].join('\n');

export const LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS = Object.freeze({
  ca: Object.freeze({
    title: 'La Veu de Sóc de Poble: per què cada comarca mereix escoltar-se amb el seu propi accent i de forma gratuïta',
    subtitle: 'El nostre Mac mini M4 al Node 0, sistemes oberts de llengua, joc «D’on parles?» i Refranyer Sonor per comarques',
    entradilla: 'Arran dels vídeos d’Oli de La Torre, els amics per WhatsApp ens van recordar una veritat essencial: una eina de poble ha de sonar com parla la nostra gent. T’expliquem com ho fem 100 % gratuït des del nostre Mac mini M4 (Node 0) amb models oberts de llengua i com la intel·ligència tradicional ensenya a la IA.',
    html: LA_VEU_DE_SOC_DE_POBLE_HTML,
  }),
  es: Object.freeze({
    title: 'La Voz de Sóc de Poble: por qué cada comarca merece escucharse con su propio acento y de forma gratuita',
    subtitle: 'Nuestro Mac mini M4 en el Node 0, sistemas abiertos de lengua, juego «¿De dónde hablas?» y Refranero Sonoro comarcal',
    entradilla: 'A raíz de los vídeos de Oli de La Torre, los amigos por WhatsApp nos recordaron una verdad esencial: una herramienta de pueblo debe sonar como habla nuestra gente. Te explicamos cómo lo hacemos 100 % gratuito desde nuestro Mac mini M4 (Node 0) con modelos abiertos y cómo la sabiduría tradicional enseña a la IA.',
    html: [
      '<h3>1. Cuando los amigos escuchan por WhatsApp y dicen una verdad como un templo</h3>',
      '<p>Todo empezó compartiendo por WhatsApp dos vídeos cortos de <strong>Oli de La Torre</strong> con la cuadrilla de amigos. La imagen emocionaba y el aceite lucía como el oro líquido que es, pero casi todos señalaron con cariño lo mismo en el primer minuto: <em>«Se oye muy limpio, pero esa locución suena a catalán central de Barcelona; no parece una vecina de La Torre, ni de Xixona, ni de L’Alacantí, ni de Alcoy»</em>.</p>',
      '<p>Tenían toda la razón. Cuando hablas de olivos centenarios sujetos por márgenes de piedra seca en <strong>La Torre de les Maçanes (L’Alacantí)</strong> mirando hacia Aitana, <strong>la voz es memoria, hogar y confianza</strong>. Una herramienta digital con espíritu <strong>de pueblo</strong> —pensada para que una persona mayor pulse un botón y escuche una crónica, una receta o un bando— no puede hablar siempre con un único acento estándar de laboratorio.</p>',

      '<h3>2. Cómo logramos que este servicio de voz sea 100 % gratuito: el Mac mini M4 y el Node 0</h3>',
      GRUP_TARGETA_NODE_ZERO_TRADUIT,
      '<p>La pregunta clave es inmediata: <strong>¿cómo ofrecer voz neuronal de calidad sin cobrar cuotas ni poner anuncios?</strong> Las grandes plataformas comerciales de voz en la nube cobran un peaje por cada carácter, sílaba o minuto generado. En una comunidad rural sin ánimo de lucro, cuantas más personas mayores escucharan noticias, recetas y refranes, más crecería una factura mensual insostenible.</p>',
      '<p>Nuestra solución aplica la economía de la piedra seca: en lugar de alquilar voces por sílaba en la nube, ejecutamos nuestros propios motores abiertos en <strong>el Mas</strong> (en La Torre de les Maçanes, L’Alacantí) sobre el <a href="/page/node-zero"><strong>Node 0</strong></a>, un pequeño <strong>Mac mini con chip Apple M4 de 10 núcleos y 24 GiB de memoria unificada</strong>. Con el equipo trabajando silenciosamente en casa, <strong>sintetizar mil frases o cien mil tiene coste marginal cero en licencias externas</strong>, garantizando que escuchar Sóc de Poble sea siempre libre y gratuito.</p>',

      '<h3>3. El equipo de IAs con el que trabajamos y los modelos especializados de lengua descargados</h3>',
      '<p>En <strong>Sóc de Poble</strong> trabajamos codo con codo un coordinador humano, asistentes de frontera (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em> y la orquestadora <em>IAIA MarIA</em>) y <strong>ocho escuelas locales abiertas sobre Ollama en el Node 0</strong> (<em>Qwen</em>, <em>DeepSeek</em>, <em>Gemma 3</em>, <em>Hermes</em>, <em>Mistral</em>, <em>GLM-4</em> y <em>Phi-4</em>). Pero para afinar el habla viva de cada territorio hemos descargado sistemas abiertos especializados en lengua y fonética:</p>',
      '<ul>',
      '<li><strong>Matxa-TTS v2 Multiaccent (Proyecto AINA · Barcelona Supercomputing Center y alVoCat):</strong> motor neuronal abierto en formato ONNX (260 MB) que en nuestro chip M4 genera 9 segundos de voz en apenas 1,3 segundos, con cuatro voces valencianas de estudio verificadas acústicamente (dos femeninas, <em>Gina</em> y <em>Berta</em>, y dos masculinas, <em>Arnau</em> y <em>Lluc</em>), voz noroccidental (<em>Emma</em>), central (<em>Èlia</em>) y balear (<em>Olga</em>).</li>',
      '<li><strong>Corpus orales NEL-VIVES del centro CENID (Universidad de Alicante) y criterios de la AVL:</strong> base filológica y fonética abierta para cuidar la entonación meridional, alicantina y comarcal.</li>',
      '<li><strong>Whisper y laboratorio acústico sobre Apple Silicon (F5-TTS-MLX):</strong> herramientas abiertas descargadas en el Node 0 para transcribir y perfeccionar progresivamente las variantes dialectales con muestras cedidas éticamente.</li>',
      '</ul>',

      '<h3>4. La inteligencia tradicional enseñando a la IA (y por qué ninguna voz de estudio habla aún como en La Torre)</h3>',
      '<p>En las primeras pruebas en frío, un modelo local pequeño sin diccionario comarcal llegó a decirnos que una <em>rabosa</em> era «un conejo pequeño». Y al escuchar las cuatro voces valencianas de <em>Matxa-TTS v2</em> comprobamos con honestidad (Ley 0) otro hecho clave: son voces limpias de estudio entrenadas sobre valenciano general, pero <strong>ninguna suena todavía con el deje exacto y la cadencia con que hablamos en La Torre de les Maçanes (L’Alacantí), Xixona o los valles de Aitana</strong>. Por eso nace este archivo abierto: <strong>es la inteligencia tradicional de nuestras abuelas, agricultores y vecinos la que enseñará a la IA el habla real de cada comarca</strong>, desde <em>hui/avui i eixir</em>, <em>creïlla</em>, <em>bresquilla</em> y <em>espencat</em> en L’Alacantí y El Comtat hasta el <em>comboi</em>, la <em>pataca</em> y el <em>trempó</em>.</p>',

      '<h3>5. El selector de voces en el menú «Traducir» y nuestro doble laboratorio vivo</h3>',
      '<p>Dentro del icono <strong>Traducir</strong> de la barra superior —sin añadir botones extra— ya puedes escuchar cualquier página en voz alta y elegir tu voz preferida. Con transparencia total (Ley 0): hoy la lectura inmediata funciona en tu navegador, aquí debajo puedes escuchar las <strong>7 muestras reales generadas y verificadas en el Node 0 con Matxa-TTS v2</strong> como punto de partida mientras abrimos el túnel público seguro del Mac mini, y te invitamos a jugar arriba a <strong>«¿De dónde hablas?»</strong> y a grabar hasta 15 segundos en el <strong>Refranero Sonoro</strong> (<code>CC BY-SA 4.0</code>) para entrenar juntos las voces propias de cada comarca.</p>',
    ].join('\n'),
  }),
  en: Object.freeze({
    title: 'The Voice of Sóc de Poble: why every rural county deserves its own accent—completely free of charge',
    subtitle: 'Our Mac mini M4 at Node 0, open speech models, the “Where do you speak from?” quiz, and the Spoken Proverb Archive',
    entradilla: 'When we shared two short videos about Oli de La Torre on WhatsApp, friends pointed out an essential truth: a village platform must sound like the people who live among its olive terraces. Here is how we keep it 100% free on our Mac mini M4 (Node 0) using open speech models and traditional village wisdom.',
    html: [
      '<h3>1. When friends on WhatsApp point out what truly matters</h3>',
      '<p>It began by sharing two short videos of <strong>Oli de La Torre</strong> in a friends’ WhatsApp group. Everyone loved the olive groves, yet nearly everyone smiled and noted the exact same thing within seconds: <em>“The audio is crisp, but that voice is Central Catalan from Barcelona—not a neighbour from La Torre, Xixona, L’Alacantí, or Alcoi!”</em>. Among the dry-stone terraces of <strong>La Torre de les Maçanes (L’Alacantí)</strong>, <strong>voice is memory, home, and trust</strong>.</p>',

      '<h3>2. How we keep neural voice 100% free: our Mac mini M4 at Node 0</h3>',
      GRUP_TARGETA_NODE_ZERO_TRADUIT,
      '<p>Commercial cloud voice APIs charge a toll per character or per second of generated speech—a pay-per-syllable trap that would punish a non-profit rural community the more elders listen to long chronicles, recipes, and village notices. Instead, we apply dry-stone economics at <strong>el Mas</strong> in La Torre de les Maçanes (L’Alacantí) through <a href="/page/node-zero"><strong>Node 0</strong></a>: a quiet, compact <strong>Apple M4 Mac mini (10 cores, 24 GiB unified memory)</strong>. Running open models on our own local hardware means <strong>zero marginal licensing fees per word</strong>, keeping accessibility permanently free.</p>',

      '<h3>3. Our collaborating AI team and the specialized open language systems we downloaded</h3>',
      '<p>At <strong>Sóc de Poble</strong>, one human coordinator works alongside frontier desktop AIs (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em>, <em>IAIA MarIA</em>) and <strong>eight local open Ollama model families inside Node 0</strong> (<em>Qwen</em>, <em>DeepSeek</em>, <em>Gemma 3</em>, <em>Hermes</em>, <em>Mistral</em>, <em>GLM-4</em>, and <em>Phi-4</em>). Because general-purpose LLMs stumble on local dialects, we downloaded specialized open speech and linguistic tools for these trials: <strong>Matxa-TTS v2 Multiaccent</strong> (Projecte AINA / Barcelona Supercomputing Center, 260 MB ONNX synthesizing 9s of speech in 1.3s on the M4 chip across verified female Valencian voices <em>Gina</em> and <em>Berta</em>, male Valencian voices <em>Arnau</em> and <em>Lluc</em>, North-Western <em>Emma</em>, Central <em>Èlia</em>, and Balearic <em>Olga</em>), the University of Alicante’s <strong>CENID NEL-VIVES</strong> Valencian speech corpora, <strong>Whisper</strong>, and <strong>F5-TTS-MLX</strong>.</p>',

      '<h3>4. Traditional village intelligence teaching AI (and why studio voices do not yet sound like La Torre)</h3>',
      '<p>During an early cold test without local lexicons, a small local model confidently claimed that a <em>rabosa</em> (fox) was “a little rabbit”! And listening carefully to the four Valencian studio voices of <em>Matxa-TTS v2</em> reveals another honest truth (Law 0): while clear and natural, <strong>none yet captures the exact mountain cadence spoken in La Torre de les Maçanes (L’Alacantí) or neighbouring valleys</strong>. That is precisely why we built this open lexical box and <strong>Spoken Proverb Archive</strong> (<code>CC BY-SA 4.0</code>): so <strong>traditional human wisdom from elders, farmers, and neighbours can train authentic local voices on Node 0</strong>.</p>',

      '<h3>5. Voice selector inside the “Translate” menu and our living two-step lab</h3>',
      '<p>Right inside the existing <strong>Translate</strong> toolbar icon—adding zero extra clutter—you can listen to any page aloud and pick your preferred voice. With radical honesty (Law 0): instant reading works today via your browser’s speech engine while our Node 0 public voice tunnel completes testing, you can audition all <strong>7 verified Matxa-TTS v2 samples</strong> below, play the <strong>12-word dialect quiz</strong> above, and record 15-second proverbs in our <strong>Spoken Proverb Archive</strong> (<code>CC BY-SA 4.0</code>).</p>',
    ].join('\n'),
  }),
  eu: Object.freeze({
    title: 'Sóc de Pobleren Ahotsa: zergatik eskualde bakoitzak bere azentua doan entzutea merezi duen',
    subtitle: 'Gure Mac mini M4 Node 0 zerbitzarian, hizkuntza-eredu irekiak, «Nongo hizkera duzu?» jokoa eta Atsotitz Sonoroak',
    entradilla: 'Oli de La Torreren bideoak WhatsApp bidez partekatzean, lagunek egia borobila gogorarazi ziguten: herriko tresna batek gure jendeak hitz egiten duen bezala entzun behar da. Hona hemen nola egiten dugun % 100 doakoa Node 0 (Mac mini M4) eta jakintza tradizionalarekin.',
    html: [
      '<h3>1. Lagunek WhatsApp bidez egia esaten dutenean</h3>',
      '<p><strong>Oli de La Torre</strong>-ren bi bideo labur lagunekin partekatzean sortu zen txinparta: irudia bikaina zen, baina ahotsa Bartzelonako katalan zentralekoa zen, ez <strong>La Torre de les Maçanes (L’Alacantí)</strong>, Xixona edo Alcoiko bizilagun batena. Harri lehorreko olibondoen artean, <strong>ahotsa oroimena, etxea eta konfiantza da</strong>.</p>',

      '<h3>2. Nola egiten dugun % 100 doakoa: Mac mini M4 eta Node 0</h3>',
      GRUP_TARGETA_NODE_ZERO_TRADUIT,
      '<p>Hodeiko ahots-zerbitzu komertzialek silaba edo minutu bakoitzeko bidesaria kobratzen dute. Irabazi-asmorik gabeko herri-proiektu batean hori jasanezina litzateke adinekoek egunero kronikak eta errezetak entzutean. Horregatik, <strong>el Mas</strong>-en (La Torre de les Maçanes, L’Alacantí) gure <a href="/page/node-zero"><strong>Node 0</strong></a> daukagu: <strong>Apple M4 txipa eta 24 GiB-eko memoria bateratua duen Mac mini</strong> isil bat, eredu irekiak kostu marjinal zeroan exekutatzen dituena.</p>',

      '<h3>3. Gure AA taldea, hizkuntza-sistema espezializatuak eta zintzotasun erradikala</h3>',
      '<p>Giza koordinatzaile batek, mahaigaineko AA ereduek (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em>, <em>IAIA MarIA</em>) eta Node 0 barruko <strong>Ollama-ko zortzi eskola irekiek</strong> lan egiten dugu elkarrekin, hizkuntza-eredu espezializatuekin batera: <strong>Matxa-TTS v2 Multiaccent</strong> (Projecte AINA / BSC, 9 segundoko ahotsa 1,3 segundotan sortuz: <em>Gina</em> eta <em>Berta</em> emakumezko ahots valentziarrak, <em>Arnau</em> eta <em>Lluc</em> gizonezkoak, <em>Emma</em>, <em>Èlia</em> eta <em>Olga</em>), Alacanteko Unibertsitateko <strong>CENID NEL-VIVES</strong> ahozko corpusak, <strong>Whisper</strong> eta <strong>F5-TTS-MLX</strong>. Zintzotasunez diogu (0 Legea): estudioko ahots horietako batek ere ez du oraindik La Torre de les Maçaneseko doinu zehatza, eta horregatik sortu ditugu <strong>Itzuli</strong> menuko hautatzailea, 12 hitzeko jokoa eta <strong>Atsotitz Sonoroen</strong> grabagailu irekia (<code>CC BY-SA 4.0</code>), adinekoen <strong>jakintza tradizionalak adimen artifizialari</strong> herri bakoitzeko benetako ahotsa irakats diezaion.</p>',
    ].join('\n'),
  }),
  gl: Object.freeze({
    title: 'A Voz de Sóc de Poble: por que cada comarca merece escoitarse co seu propio acento e de balde',
    subtitle: 'O noso Mac mini M4 no Node 0, sistemas abertos de lingua, xogo «De onde falas?» e Refraneiro Sonoro comarcal',
    entradilla: 'Ao compartir por WhatsApp dous vídeos de Oli de La Torre, as amizades lembráronnos unha verdade esencial: unha ferramenta con alma de aldea ten que soar como fala a nosa xente. Explicámosche como o facemos 100 % gratuíto dende o noso Mac mini M4 (Node 0) e coa sabedoría tradicional.',
    html: [
      '<h3>1. Cando as amizades escoitan por WhatsApp e din a verdade</h3>',
      '<p>Todo comezou compartindo dous vídeos curtos de <strong>Oli de La Torre</strong> por WhatsApp. A historia emocionaba, mais case todo o mundo sinalou o mesmo detalle: a locución soaba a catalán central de Barcelona, non a unha veciña de <strong>La Torre de les Maçanes (L’Alacantí)</strong>, de Xixona ou de Alcoi. Entre oliveiras centenarias e pedra seca, <strong>a voz é memoria, casa e confianza</strong>.</p>',

      '<h3>2. Como facemos que este servizo sexa 100 % gratuíto: o Mac mini M4 e o Node 0</h3>',
      GRUP_TARGETA_NODE_ZERO_TRADUIT,
      '<p>As plataformas comerciais de voz na nube cobran peaxe por cada sílaba ou minuto xerado, algo inviable para unha comunidade rural sen ánimo de lucro onde a xente maior escoita crónicas, receitas e refráns. En <strong>el Mas</strong> (La Torre de les Maçanes, L’Alacantí) apostamos polo <a href="/page/node-zero"><strong>Node 0</strong></a>: un <strong>Mac mini Apple M4 de 10 núcleos e 24 GiB de memoria unificada</strong> que executa modelos abertos na propia casa a <strong>custo marxinal cero por palabra</strong>.</p>',

      '<h3>3. O equipo de IAs, os motores abertos de lingua e a intelixencia tradicional</h3>',
      '<p>Traballamos man a man un coordinador humano, modelos de fronteira (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em>, <em>IAIA MarIA</em>) e <strong>oito escolas locais abertas en Ollama dentro do Node 0</strong>, apoiándonos en sistemas lingüísticos especializados descargados para estas primeiras probas: <strong>Matxa-TTS v2 Multiaccent</strong> (Projecte AINA / BSC, capaz de sintetizar 9 s en 1,3 s coas voces valencianas femininas <em>Gina</em> e <em>Berta</em>, as masculinas <em>Arnau</em> e <em>Lluc</em>, mais <em>Emma</em>, <em>Èlia</em> e <em>Olga</em>), os corpus orais <strong>NEL-VIVES do CENID</strong> da Universidade de Alacant, <strong>Whisper</strong> e <strong>F5-TTS-MLX</strong>.</p>',
      '<p>Cando un modelo pequeno sen dicionario local chegou a confundir unha <em>rabosa</em> cun coello —e ao comprobar con honestidade (Lei 0) que ningunha desas catro voces de estudo fala aínda coa cadencia exacta de La Torre de les Maçanes (L’Alacantí)— quedou clara a nosa regra de ouro: <strong>é a intelixencia tradicional das nosas avoas e labregos a que ten que ensinar e mellorar a intelixencia artificial</strong>. Xa podes escoller voz dende a icona <strong>Traducir</strong>, escoitar abaixo as 7 mostras verificadas do Node 0, xogar arriba ás 12 palabras de <strong>«De onde falas?»</strong> e gravar os ditos da túa terra no <strong>Refraneiro Sonoro</strong> (<code>CC BY-SA 4.0</code>).</p>',
    ].join('\n'),
  }),
});

export const LA_VEU_DE_SOC_DE_POBLE_COPY = LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS;

export const LA_VEU_DE_SOC_DE_POBLE_POST = Object.freeze({
  id: LA_VEU_DE_SOC_DE_POBLE_ID,
  slug: LA_VEU_DE_SOC_DE_POBLE_ID,
  type: 'post',
  title: LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS.ca.title,
  post_subtitle: LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS.ca.subtitle,
  description: 'Com fem gratuïta la veu neuronal des del Mac mini M4 (Node 0) amb models oberts, joc de comarques «D’on parles?» i Refranyer Sonor',
  entradilla: LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS.ca.entradilla,
  image_url: '/assets/mur/la_veu_de_soc_de_poble_nano_v4.webp',
  image_alt: "Vinyeta d'estil còmic mediterrani en una plaça assolellada de poble amb una iaia parlant per l'embut del Destil·lador d'Accents, un llaurador amb boina i faixa i dos robotets amb bombeta prenent nota",
  content: LA_VEU_DE_SOC_DE_POBLE_HTML,
  translations: LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS,
  created_at: '2026-11-13T22:05:00+01:00',
  important: true,
  author_entity_id: 'socdepoble',
  author: 'Sóc de Poble',
  author_name: 'Sóc de Poble',
  author_avatar: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  author_location: 'La Torre de les Maçanes',
  town: 'La Torre de les Maçanes',
  town_name: 'La Torre de les Maçanes',
  poble_id: 'la-torre-de-les-macanes',
  categoria_tematica_id: 'patrimoni-cultura',
  category: '🎭 Cultura, Música i Llengua',
  tags: ['Patrimoni', 'Cims per la llengua', 'Node 0', 'Projecte Sóc de Poble'],
  labels: [
    { text: '🎭 Cultura, Música i Llengua', className: 'sdp-badge-category' },
    { text: 'Patrimoni', className: 'sdp-badge-tag' },
    { text: 'Cims per la llengua', className: 'sdp-badge-tag' },
    { text: 'Node 0', className: 'sdp-badge-tag' },
  ],
  copyright: 'Text, joc dialectal i refranyer sonor: Sóc de Poble (CC BY-SA 4.0) · Mostres de síntesi: Matxa-TTS v2 (Projecte AINA / BSC)',
});
