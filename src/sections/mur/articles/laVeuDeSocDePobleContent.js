/**
 * laVeuDeSocDePobleContent.js · Onades R23 + R27 · Contingut editorial canònic en 5
 * llengües de la publicació llarga del Mur «La Veu de Sóc de Poble»
 * (/mur/la-veu-de-soc-de-poble i àlies /page/la-veu-de-soc-de-poble).
 *
 * Lleis editorials estrictes verificades:
 *   · Marca i sintagma: SEMPRE «de poble» / «Sóc de Poble» (sense «del poble» ni «dels pobles», ni adjectius grandiloqüents).
 *   · Llei 0 (Honestedat Radical post-SQL 5/5 i R27): diferencia nítidament què ja
 *     escoltem i tenim desplegat hui (síntesi neuronal oberta en directe des del
 *     Node 0 amb les 7 veus de Matxa-TTS v2, barra inferior universal de so centrada
 *     al mòbil i a l'ordinador preparada per a Ràdio de Poble, i taules SQL
 *     comunitàries desplegades al Supabase compartit amb RLS) i quin pas obrim
 *     progressivament (agregació web de consens darrere de bandera i adaptació
 *     acústica comarcal sota llicència CC BY-SA 4.0).
 *   · R28 (carril B, Llei 0) · La barra inferior (BarraReproductorVeu.jsx) només
 *     té bloc anterior, pausa/continua, bloc següent, apartats i cerca, copiar i
 *     tancar: cap control de velocitat ni selector de veu propi; la veu es tria
 *     al menú Traduir o al banc de veus i la barra la seguix
 *     (subscriuVeuPreferida). Les taules existixen al servidor compartit, però
 *     mentre VITE_SDP_CONSENS_ISOGLOSSES siga apagada (src/data/supabase/index.js)
 *     els vots i les paraules del joc es queden en el dispositiu i el resum de
 *     consens no es mostra; el text no afirma cap entrenament comarcal en present.
 *   · Paritat 1:1 en les 5 llengües (ca, es, en, eu, gl): 6 seccions H3 a totes.
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

const TARGETA_NODE_ZERO_TEXTS = Object.freeze({
  ca: Object.freeze({
    titol: "Node 0 · Mac mini M4: el servidor de l'habitació",
    subtitol: 'El maquinari del pilot comunitari, les mesures de màquina i allò que queda per verificar',
    entradilla: 'El Node 0 és el Mac mini Apple M4 de La Torre de les Maçanes (10 nuclis i 24 GiB de memòria mesurats per SSH el 3 de novembre). Servix el node pilot operatiu socdepoble.cat amb NodeInfo 2.1, WebFinger dinàmic, síntesi oberta Matxa-TTS v2 en directe i streaming HTTP 206, mentre compartix el backend Supabase.',
  }),
  es: Object.freeze({
    titol: 'Nodo 0 · Mac mini M4: el servidor de la habitación',
    subtitol: 'El hardware del piloto comunitario, las mediciones de máquina y lo que queda por verificar',
    entradilla: 'El Nodo 0 es el Mac mini Apple M4 de La Torre de les Maçanes (10 núcleos y 24 GiB de memoria medidos por SSH el 3 de noviembre). Sirve el nodo piloto operativo socdepoble.cat con NodeInfo 2.1, WebFinger dinámico, síntesis abierta Matxa-TTS v2 en directo y streaming HTTP 206, compartiendo el backend Supabase.',
  }),
  en: Object.freeze({
    titol: 'Node 0 · Mac mini M4: the room server',
    subtitol: 'Community pilot hardware, machine measurements, and what remains to be verified',
    entradilla: 'Node 0 is the Apple M4 Mac mini in La Torre de les Maçanes (10 cores and 24 GiB unified memory measured via SSH on 3 November). It serves the live socdepoble.cat pilot with NodeInfo 2.1, dynamic WebFinger, live Matxa-TTS v2 neural speech, and HTTP 206 streaming while sharing the Supabase backend.',
  }),
  eu: Object.freeze({
    titol: '0 Nodoa · Mac mini M4: gelako zerbitzaria',
    subtitol: 'Piloto komunitarioaren hardwarea, makinaren neurketak eta egiaztatzeko geratzen dena',
    entradilla: '0 Nodoa La Torre de les Maçaneseko Apple M4 Mac mini-a da (10 nukleo eta 24 GiB memoria bateratu, azaroaren 3an SSH bidez neurtuta). socdepoble.cat piloto operatiboa zerbitzatzen du NodeInfo 2.1, WebFinger dinamiko, zuzeneko Matxa-TTS v2 ahots ireki eta HTTP 206 streamingarekin, Supabase partekatuz.',
  }),
  gl: Object.freeze({
    titol: 'Nodo 0 · Mac mini M4: o servidor do cuarto',
    subtitol: 'O hardware do piloto comunitario, as medicións de máquina e o que queda por verificar',
    entradilla: 'O Nodo 0 é o Mac mini Apple M4 de La Torre de les Maçanes (10 núcleos e 24 GiB de memoria medidos por SSH o 3 de novembro). Serve o nodo piloto operativo socdepoble.cat con NodeInfo 2.1, WebFinger dinámico, síntese aberta Matxa-TTS v2 en directo e streaming HTTP 206, compartindo o backend Supabase.',
  }),
});

function grupTargetaNodeZero(idioma = 'ca') {
  const fitxa = TARGETA_NODE_ZERO_TEXTS[idioma] ?? TARGETA_NODE_ZERO_TEXTS.ca;
  const imatge = '/assets/uploads/brain/mac_mini_m4_1787721966622.webp';
  return [
    '<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta">',
    '<div data-sdp-targeta="pagina:node-zero" class="sdp-targeta" data-ruta="/page/node-zero"',
    ` data-titol="${atributHtml(fitxa.titol)}" data-subtitol="${atributHtml(fitxa.subtitol)}"`,
    ` data-entradilla="${atributHtml(fitxa.entradilla)}" data-imatge="${atributHtml(imatge)}"`,
    ' data-autor="Sóc de Poble" data-autor-ruta="/projecte">',
    `<a href="/page/node-zero" rel="noopener noreferrer nofollow">${atributHtml(fitxa.titol)}</a>`,
    '</div></div>',
  ].join('');
}

export const GRUP_TARGETA_NODE_ZERO_CA = grupTargetaNodeZero('ca');
export const GRUP_TARGETA_NODE_ZERO_TRADUIT = grupTargetaNodeZero('es');

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

  '<h3>5. Reproductor inferior centrat, selector de veus i en quin punt estem hui (Llei 0)</h3>',
  '<p>Perquè tota esta riquesa siga còmoda tant al mòbil com a l’ordinador sense omplir la barra superior amb més icones, podeu activar <strong>«Escoltar esta pàgina en veu alta»</strong> des del menú <strong>Traduir</strong> o des del botó <strong>«Escolta la IAIA»</strong>: s’obri a baix una <strong>barra reproductora universal centrada</strong> (damunt de la navegació mòbil i centrada sobre el panell de lectura en escriptori), amb bloc anterior, pausa i continua, bloc següent, apartats i cerca, copiar el fragment i tancar, i amb una arquitectura preparada per a la futura <strong>Ràdio de Poble</strong>. La veu es tria al menú <strong>Traduir</strong> o al banc de veus d’esta pàgina, i la barra la seguix.</p>',
  '<p>Seguint la nostra <strong>Llei 0 d’honestedat radical</strong>, vos expliquem amb transparència cristal·lina què funciona ja en directe i quin pas obrim progressivament:</p>',
  '<ul>',
  '<li><strong>Veu neuronal en directe i taules comunitàries ja desplegades:</strong> quan escoltes qualsevol pàgina o refrany en la nostra llengua, l’app es connecta gratuïtament al motor <strong>Matxa-TTS v2 del nostre Mac mini M4</strong> (<code>https://socdepoble.cat/api/v1/node0/veu</code>) amb <strong>qualsevol de les 7 veus obertes</strong> (<em>Gina</em>, <em>Arnau</em>, <em>Berta</em>, <em>Lluc</em>, <em>Emma</em>, <em>Èlia</em> o <em>Olga</em>), i al <strong>Supabase compartit</strong> ja existixen, amb seguretat RLS, les taules comunitàries per a paraules dialectals, vots del joc i metadades del refranyer.</li>',
  '<li><strong>El pas que encara no hem obert:</strong> mentre la connexió del joc amb eixes taules continue apagada, els vots i les paraules que aportes a «D’on parles?» es queden en este dispositiu, i el resum del consens comarcal encara no es mostra. Amb les gravacions de 15 segons del Refranyer passa igual: l’aportació s’anota en este dispositiu i l’àudio el pots descarregar. El magatzem de mostres orals del Node 0 està en preparació, i les adaptacions acústiques comarcals amb mostres cedides sota llicència <code>CC BY-SA 4.0</code> vindran després.</li>',
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
      '<p>Todo empezó compartiendo por WhatsApp dos vídeos cortos de <strong>Oli de La Torre</strong> con la cuadrilla de amigos. La imagen emocionaba y el aceite lucía como el oro líquido que es, pero casi todos señalaron con cariño lo mismo antes de terminar el primer minuto: <em>«Se oye muy limpio, pero esa locución suena a Barcelona; no parece una vecina de La Torre, ni de Xixona, ni de L’Alacantí, ni de Alcoy»</em>.</p>',
      '<p>Tenían toda la razón. Cuando hablas de olivos centenarios sujetos por márgenes de piedra seca en <strong>La Torre de les Maçanes (L’Alacantí)</strong> mirando hacia Aitana y el Rentonar, <strong>la voz es memoria, hogar y confianza</strong>. Una herramienta digital con vocación <strong>de pueblo</strong> —pensada para que una persona mayor pulse un botón y escuche una crónica, una receta o un bando— no puede hablar siempre con un único acento estándar de laboratorio.</p>',

      '<h3>2. Cómo logramos que este servicio de voz sea 100 % gratuito: el Mac mini M4 y el Node 0</h3>',
      grupTargetaNodeZero('es'),
      '<p>La primera pregunta es muy directa: <strong>¿cómo ofrecer síntesis de voz neuronal sin cobrar cuotas ni poner publicidad?</strong> En el mercado actual, las plataformas comerciales de voz en la nube facturan un <strong>peaje por cada carácter, sílaba o minuto generado</strong>. En una iniciativa cívica y rural sin ánimo de lucro, cuantas más personas mayores escucharan crónicas, recetas y refranes, más crecería una factura mensual insostenible.</p>',
      '<p>Nuestra respuesta aplica la economía de la <strong>piedra seca</strong>: en lugar de alquilar voces ajenas por sílaba en la nube, hemos instalado en <strong>el Mas</strong> (La Torre de les Maçanes, L’Alacantí) el <a href="/page/node-zero"><strong>Node 0</strong></a>, un pequeño <strong>Mac mini con chip Apple M4 de 10 núcleos y 24 GiB de memoria unificada</strong> que ya sirve <code>socdepoble.cat</code>. Una vez encendido en casa, <strong>sintetizar mil frases o cien mil tiene coste marginal cero en licencias externas</strong>, garantizando un servicio libre y gratuito.</p>',

      '<h3>3. El equipo de IAs con el que trabajamos y los sistemas especializados de lengua descargados</h3>',
      '<p>En <strong>Sóc de Poble</strong> colaboramos un coordinador humano, modelos de escritorio de frontera (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em> y la orquestadora <em>IAIA MarIA</em>) y <strong>ocho escuelas locales abiertas sobre Ollama en el Node 0</strong> (<em>Qwen</em>, <em>DeepSeek</em>, <em>Gemma 3</em>, <em>Hermes</em>, <em>Mistral</em>, <em>GLM-4</em> y <em>Phi-4</em>). Pero los modelos generalistas de conversación no bastan para hablar bien nuestra lengua: necesitábamos descargar en el Node 0 <strong>sistemas abiertos de síntesis neuronal, fonética y corpus orales</strong>:</p>',
      '<ul>',
      '<li><strong>Matxa-TTS v2 Multiaccent (Proyecto AINA · Barcelona Supercomputing Center y alVoCat):</strong> motor neuronal abierto en formato <strong>ONNX (260 MB)</strong> que en nuestro chip M4 genera <strong>9 segundos de voz nítida en apenas 1,3 segundos</strong> (factor <code>0,15</code>), con cuatro voces valencianas de estudio verificadas por frecuencia fundamental (<em>Gina</em>, <em>Berta</em>, <em>Arnau</em> y <em>Lluc</em>) junto a la noroccidental (<em>Emma</em>), la central (<em>Èlia</em>) y la balear (<em>Olga</em>).</li>',
      '<li><strong>Corpus orales NEL-VIVES del centro CENID (Universidad de Alicante) y criterios de la AVL:</strong> apoyo filológico y fonético abierto para cuidar las vocales abiertas, las sibilantes sonoras y el vocabulario meridional.</li>',
      '<li><strong>Whisper y laboratorio de adaptación acústica sobre Apple Silicon (F5-TTS-MLX):</strong> herramientas abiertas instaladas en el Mac mini para transcribir y afinar progresivamente las variantes comarcales con muestras cedidas con permiso explícito.</li>',
      '</ul>',

      '<h3>4. La inteligencia tradicional enseñando a la IA (y por qué ninguna voz de estudio habla aún como en La Torre)</h3>',
      '<p>En las primeras pruebas en frío, un modelo local pequeño sin diccionario de tierra llegó a decirnos que una <em>rabosa</em> era «un conejo pequeño», igual que en muchos mapas aparece <em>Serra del Rontonar</em> donde en La Torre siempre se ha dicho <em>«mosatros diem el Rentonar»</em> (junto a <em>aspencat</em>, <em>pual</em> o <em>queraïlla</em>). Y al escuchar las cuatro voces valencianas de <em>Matxa-TTS v2</em> comprobamos con honestidad otra verdad: son voces limpias de estudio entrenadas sobre valenciano general, pero <strong>ninguna habla todavía con el deje exacto y la cadencia de La Torre de les Maçanes (L’Alacantí), Xixona o los valles de Aitana</strong>.</p>',
      '<p>Ahí nace la idea madre de <strong>La Voz de Sóc de Poble</strong>: <strong>usar la inteligencia tradicional de nuestras abuelas, agricultores y cuadrillas para enseñar y mejorar la inteligencia artificial</strong>, sumando la riqueza viva de L’Alacantí, el Vinalopó, El Comtat, l’Alcoià, la Marina, la Safor, la Ribera, l’Horta, la Plana, el Maestrat, les Terres de l’Ebre, Ponent y las Islas Baleares: <strong>todas juntas forman la lengua entera</strong>.</p>',

      '<h3>5. Reproductor inferior centrado, selector de voces y en qué punto estamos hoy (Ley 0)</h3>',
      '<p>Para que escuchar sea cómodo tanto en el móvil como en el ordenador sin recargar la barra superior, puedes activar la lectura en voz alta desde el icono <strong>Traducir</strong> o desde el botón <strong>«Escucha a la IAIA»</strong>: aparece abajo una <strong>barra reproductora universal centrada</strong> (sobre la navegación inferior en móvil y centrada sobre la columna de lectura en escritorio), con bloque anterior, pausa y continuar, bloque siguiente, apartados y búsqueda, copiar el fragmento y cerrar, y con una arquitectura preparada para la futura <strong>Radio de Pueblo</strong>. La voz se elige en el menú <strong>Traducir</strong> o en el banco de voces de esta página, y la barra la sigue.</p>',
      '<p>Siguiendo nuestra <strong>Ley 0 de honestidad radical</strong>, detallamos qué funciona ya en vivo y qué abrimos paso a paso:</p>',
      '<ul>',
      '<li><strong>Voz neuronal en directo y tablas comunitarias desplegadas:</strong> al escuchar cualquier página o refrán en nuestra lengua, el dispositivo se conecta gratuitamente a <strong>Matxa-TTS v2 en nuestro Mac mini M4</strong> (<code>https://socdepoble.cat/api/v1/node0/veu</code>) con <strong>cualquiera de las 7 voces abiertas</strong>, y en el <strong>Supabase compartido</strong> ya existen, con seguridad RLS, las tablas comunitarias para palabras dialectales, votos del juego y metadatos del refranero.</li>',
      '<li><strong>El paso que todavía no hemos abierto:</strong> mientras la conexión del juego con esas tablas siga apagada, los votos y las palabras que aportas a «¿De dónde hablas?» se quedan en este dispositivo, y el resumen del consenso comarcal todavía no se muestra. Con las grabaciones de 15 segundos del Refranero pasa lo mismo: la aportación se anota en este dispositivo y el audio lo puedes descargar. El almacén de muestras orales del Node 0 está en preparación, y las adaptaciones acústicas comarcales con muestras cedidas bajo licencia <code>CC BY-SA 4.0</code> llegarán después.</li>',
      '</ul>',

      '<h3>6. Juega a «¿De dónde hablas?» y graba los refranes de tu comarca</h3>',
      '<p>Para enseñar a una IA las variantes de cada territorio hacen falta <strong>las palabras vivas (el léxico)</strong> y <strong>la música exacta de la voz (la prosodia)</strong>. Por eso reunimos en esta misma página un doble laboratorio abierto:</p>',
      '<ul>',
      '<li>Arriba tienes el juego interactivo <strong>«¿De dónde hablas?»</strong>: en <strong>12 palabras cotidianas</strong> descubres con qué comarcas coincide tu habla, activas la voz recomendada y anotas en el buzón esas palabras de casa que no salen en los manuales.</li>',
      '<li>A continuación del banco de voces tienes el <strong>Refranero Sonoro por Comarcas</strong>: <strong>32 dichos tradicionales</strong> donde puedes pulsar el micrófono, <strong>grabar hasta 15 segundos con tu propia voz</strong> indicando tu pueblo y cederlo libremente (<code>CC BY-SA 4.0</code>).</li>',
      '</ul>',
      '<p>Prueba el juego, escucha las siete voces, graba un refrán con los mayores de casa y compártelo por WhatsApp: <strong>con un Mac mini en casa y la sabiduría tradicional de nuestra gente, haremos que la tecnología hable con el acento de cada comarca y sin coste para nadie</strong>.</p>',
    ].join('\n'),
  }),
  en: Object.freeze({
    title: 'The Voice of Sóc de Poble: why every rural county deserves its own accent—completely free of charge',
    subtitle: 'Our Mac mini M4 at Node 0, open speech models, the “Where do you speak from?” quiz, and the Spoken Proverb Archive',
    entradilla: 'When we shared two short videos about Oli de La Torre on WhatsApp, friends pointed out an essential truth: a village platform must sound like the people who live among its olive terraces. Here is how we keep it 100% free on our Mac mini M4 (Node 0) using open speech models and traditional village wisdom.',
    html: [
      '<h3>1. When friends on WhatsApp point out what truly matters</h3>',
      '<p>Everything started by sharing two short videos of <strong>Oli de La Torre</strong> in a friends’ WhatsApp group. The olive groves shone, yet nearly everyone smiled and noted the exact same thing within the first minute: <em>“The audio is crisp, but that voice sounds like Barcelona—not a neighbour from La Torre, Xixona, L’Alacantí, or Alcoi!”</em>.</p>',
      '<p>They were completely right. Among the century-old olive trees and dry-stone terraces of <strong>La Torre de les Maçanes (L’Alacantí)</strong> facing Aitana and el Rentonar, <strong>voice is memory, home, and trust</strong>. A digital tool built in a true village spirit—so an elder can tap one button and hear a chronicle, a recipe, or a town notice—cannot speak with a single laboratory accent as if every valley sounded identical.</p>',

      '<h3>2. How we keep neural voice 100% free: our Mac mini M4 at Node 0</h3>',
      grupTargetaNodeZero('en'),
      '<p>The first question people ask is straightforward: <strong>how can you offer neural text-to-speech with zero subscription fees and zero ads?</strong> Commercial cloud voice platforms charge a <strong>toll per character, syllable, or minute of audio</strong>. For a non-profit rural community, the more elders listened to long stories and recipes, the faster an unsustainable monthly bill would grow.</p>',
      '<p>Our answer applies <strong>dry-stone</strong> economics to technology: instead of renting cloud voices per word, we run our own open engines at <strong>el Mas</strong> (La Torre de les Maçanes, L’Alacantí) on <a href="/page/node-zero"><strong>Node 0</strong></a>, a quiet <strong>Apple M4 Mac mini (10 cores, 24 GiB unified memory)</strong> serving <code>socdepoble.cat</code>. Once powered on at home, <strong>synthesising a thousand sentences or a hundred thousand carries zero marginal licensing cost</strong>, keeping Sóc de Poble open and free for everyone.</p>',

      '<h3>3. Our collaborating AI team and the specialized open language systems we downloaded</h3>',
      '<p>At <strong>Sóc de Poble</strong>, one human coordinator works alongside frontier desktop models (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em>, and orchestrator <em>IAIA MarIA</em>) plus <strong>eight local open Ollama schools inside Node 0</strong> (<em>Qwen</em>, <em>DeepSeek</em>, <em>Gemma 3</em>, <em>Hermes</em>, <em>Mistral</em>, <em>GLM-4</em>, and <em>Phi-4</em>). Yet general conversational models are not enough to speak local varieties well—so we installed specialized open speech and phonetic systems on Node 0:</p>',
      '<ul>',
      '<li><strong>Matxa-TTS v2 Multiaccent (Projecte AINA · Barcelona Supercomputing Center &amp; alVoCat):</strong> an open <strong>260 MB ONNX</strong> neural engine generating <strong>9 seconds of crisp speech in just 1.3 seconds</strong> on our M4 chip (real-time factor <code>0.15</code>), across four pitch-verified Valencian studio voices (<em>Gina</em>, <em>Berta</em>, <em>Arnau</em>, and <em>Lluc</em>) alongside North-Western (<em>Emma</em>), Central (<em>Èlia</em>), and Balearic (<em>Olga</em>).</li>',
      '<li><strong>CENID NEL-VIVES oral corpora (University of Alicante) and AVL standards:</strong> open linguistic research from Alicante caring for open vowels, voiced sibilants, and southern vocabulary ignored by generic engines.</li>',
      '<li><strong>Whisper and Apple Silicon acoustic adaptation lab (F5-TTS-MLX):</strong> open transcription and phonetic alignment tools installed on the Mac mini to progressively refine county accents from explicitly contributed samples.</li>',
      '</ul>',

      '<h3>4. Traditional village intelligence teaching AI (and why studio voices do not yet sound like La Torre)</h3>',
      '<p>During a cold test without a local lexicon, a small local model confidently claimed that a <em>rabosa</em> (fox) was “a little rabbit”—just as maps print <em>Serra del Rontonar</em> while locals in La Torre have always said <em>“mosatros diem el Rentonar”</em> (alongside <em>aspencat</em>, <em>pual</em>, or <em>queraïlla</em>). Listening to the four Valencian voices of <em>Matxa-TTS v2</em> confirmed a second honest truth: while clean and natural, <strong>they are studio voices trained on general Valencian, and none yet speaks with the exact melody and cadence of La Torre de les Maçanes (L’Alacantí), Xixona, or the valleys of Aitana</strong>.</p>',
      '<p>That is the core purpose of <strong>The Voice of Sóc de Poble</strong>: <strong>using traditional human wisdom from grandmothers, olive growers, and neighbours to teach and improve artificial intelligence</strong> across every comarca—from L’Alacantí, El Comtat, and la Marina to la Safor, la Plana, el Maestrat, Terres de l’Ebre, Ponent, and the Balearic Islands. None ranks above another: <strong>together they form the whole living language</strong>.</p>',

      '<h3>5. Centered bottom sound player, voice selector, and where we stand today (Law 0)</h3>',
      '<p>So listening feels effortless on both phones and computers without adding extra top-bar clutter, you can trigger aloud reading from the <strong>Translate</strong> menu or the <strong>“Listen to IAIA”</strong> button: a <strong>centered universal bottom player bar</strong> opens above mobile navigation and centered over the desktop reading column, with previous block, pause and resume, next block, sections and search, copy the passage, and close, built on an audio architecture ready for <strong>Village Radio</strong>. The voice is chosen in the <strong>Translate</strong> menu or in this page’s voice bank, and the bar follows it.</p>',
      '<p>Following our <strong>Law 0 of radical honesty</strong>, here is what runs live today and what we are opening step by step:</p>',
      '<ul>',
      '<li><strong>Live neural speech and deployed community tables:</strong> when listening to pages or proverbs in our language, your device connects free of charge to <strong>Matxa-TTS v2 on our Mac mini M4</strong> (<code>https://socdepoble.cat/api/v1/node0/veu</code>) across <strong>all 7 open voices</strong>, and RLS-protected community tables for dialect words, quiz votes, and proverb metadata already exist on the <strong>shared Supabase</strong> server.</li>',
      '<li><strong>What we have not opened yet:</strong> while the quiz’s connection to those tables stays switched off, the votes and words you add in “Where do you speak from?” stay on this device, and the county consensus summary is not shown yet. The same goes for 15-second proverb recordings: your contribution is noted on this device and you can download the audio. Node 0’s store for oral samples is still being prepared, and county acoustic adaptations built from samples shared under <code>CC BY-SA 4.0</code> will come later.</li>',
      '</ul>',

      '<h3>6. Play “Where do you speak from?” and record your county’s proverbs</h3>',
      '<p>Teaching AI regional speech takes two ingredients working together: <strong>living words (lexicon)</strong> and <strong>the exact music of speech (prosody and intonation)</strong>. That is why this page brings together a two-part open lab:</p>',
      '<ul>',
      '<li>At the top, play <strong>“Where do you speak from?”</strong>: across <strong>12 everyday words</strong>, see which counties match your speech, activate the recommended voice in one click, and submit local words missing from textbooks.</li>',
      '<li>Right below the 7-voice bank, explore the <strong>Spoken Proverb Archive by County</strong>: <strong>32 traditional sayings</strong> where you can tap the microphone, <strong>record up to 15 seconds in your own voice</strong> naming your village, and share it under <code>CC BY-SA 4.0</code>.</li>',
      '</ul>',
      '<p>Try the quiz, audition all seven voices, record a proverb with elders at home, and share the link on WhatsApp: <strong>with a Mac mini at home and the traditional wisdom of our neighbours, technology can speak with every county’s accent at zero cost to anyone</strong>.</p>',
    ].join('\n'),
  }),
  eu: Object.freeze({
    title: 'Sóc de Pobleren Ahotsa: zergatik eskualde bakoitzak bere azentua doan entzutea merezi duen',
    subtitle: 'Gure Mac mini M4 0 Nodoan, hizkuntza-sistema irekiak, «Nongo hizkera duzu?» jokoa eta Eskualdekako Atsotitz Sonoroak',
    entradilla: 'Oli de La Torreren bideoak WhatsApp bidez partekatzean, lagunek egia borobila gogorarazi ziguten: herriko tresna batek gure jendeak hitz egiten duen bezala entzun behar da. Hona hemen nola egiten dugun % 100 doakoa 0 Nodoan (Mac mini M4) eredu irekiekin eta jakintza tradizionalarekin.',
    html: [
      '<h3>1. Lagunek WhatsApp bidez entzun eta egia borobila esaten dutenean</h3>',
      '<p>Dena <strong>Oli de La Torre</strong>-ren bi bideo labur lagun-kuadrillarekin WhatsApp bidez partekatzean hasi zen. Olibondoek hunkitzen zuten, baina ia denek gauza bera adierazi zuten lehen minutua amaitu aurretik: <em>«Oso garbi entzuten da, baina ahots hori Bartzelonakoa da; ez dirudi La Torre, Xixona, L’Alacantí edo Alcoiko bizilagun batena!»</em>.</p>',
      '<p>Arrazoi osoa zuten. <strong>La Torre de les Maçanes (L’Alacantí)</strong> herriko harri lehorreko olibondo ehunurtekoez hitz egitean, Aitana eta Rentonarrera begira, <strong>ahotsa oroimena, etxea eta konfiantza da</strong>. Herri-bokazioa duen tresna digital batek —adineko batek botoi bat sakatu eta albiste, errezeta edo bando bat entzuteko egina— ezin du beti laborategiko azentu bakar batekin hitz egin.</p>',

      '<h3>2. Nola lortzen dugun ahots-zerbitzu hau % 100 doakoa izatea: Mac mini M4 eta 0 Nodoa</h3>',
      grupTargetaNodeZero('eu'),
      '<p>Lehen galdera oso zuzena da: <strong>nola eskaini ahots neuronalaren sintesia kuotarik kobratu eta iragarkirik jarri gabe?</strong> Hodeiko plataforma komertzialek <strong>karaktere, silaba edo minutu bakoitzeko bidesaria</strong> kobratzen dute. Irabazi-asmorik gabeko landa-proiektu batean, zenbat eta adineko gehiagok kronikak eta errezetak entzun, orduan eta jasanezinagoa litzateke hileko faktura.</p>',
      '<p>Gure erantzunak <strong>harri lehorraren</strong> ekonomia darabil: kanpoko ahotsak alokatu beharrean, <strong>el Mas</strong>-en (La Torre de les Maçanes, L’Alacantí) <a href="/page/node-zero"><strong>0 Nodoa</strong></a> jarri dugu martxan, <code>socdepoble.cat</code> zerbitzatzen duen <strong>10 nukleo eta 24 GiB-eko memoria bateratuko Apple M4 Mac mini</strong> isila. Etxean piztuta, <strong>mila esaldi edo ehun mila sintetizatzeak zero kostu marjinal du kanpoko lizentzietan</strong>.</p>',

      '<h3>3. Gure AA taldea eta deskargatu ditugun hizkuntza-sistema espezializatuak</h3>',
      '<p><strong>Sóc de Poble</strong>-n giza koordinatzaile batek, mahaigaineko eredu aurreratuek (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em> eta <em>IAIA MarIA</em> orkestratzaileak) eta <strong>0 Nodoaren barruko Ollamako zortzi eskola irekiek</strong> (<em>Qwen</em>, <em>DeepSeek</em>, <em>Gemma 3</em>, <em>Hermes</em>, <em>Mistral</em>, <em>GLM-4</em> eta <em>Phi-4</em>) elkarrekin lan egiten dugu. Baina elkarrizketa-eredu orokorrak ez dira nahikoak eskualde bakoitzeko hizkera zaintzeko; horregatik, sistema ireki espezializatuak instalatu ditugu:</p>',
      '<ul>',
      '<li><strong>Matxa-TTS v2 Multiaccent (AINA Proiektua · Barcelona Supercomputing Center eta alVoCat):</strong> <strong>ONNX (260 MB)</strong> motor neuronal irekia, gure M4 txipean <strong>9 segundoko ahots garbia 1,3 segundotan</strong> sortzen duena (<code>0,15</code> faktorea), oinarrizko maiztasunaz egiaztatutako lau ahots valentziarrekin (<em>Gina</em>, <em>Berta</em>, <em>Arnau</em> eta <em>Lluc</em>), ipar-mendebaldekoarekin (<em>Emma</em>), erdialdekoarekin (<em>Èlia</em>) eta balearrarekin (<em>Olga</em>).</li>',
      '<li><strong>CENID zentroko NEL-VIVES ahozko corpusak (Alacanteko Unibertsitatea) eta AVL irizpideak:</strong> hegoaldeko bokal irekiak, txistukari ozenak eta tokiko hiztegia zaintzeko ikerketa-oinarri irekia.</li>',
      '<li><strong>Whisper eta Apple Silicon gaineko egokitzapen akustikoko laborategia (F5-TTS-MLX):</strong> baimen esplizituz lagatako ahozko laginekin eskualde-aldaerak fintzeko tresna irekiak.</li>',
      '</ul>',

      '<h3>4. Jakintza tradizionala adimen artifizialari irakasten (eta zergatik estudioko ahotsek ez duten oraindik La Torren bezala hitz egiten)</h3>',
      '<p>Lehen proba hotzetan, tokiko hiztegirik gabeko eredu txiki batek <em>rabosa</em> hitza «untxi txiki bat» zela erantzun zigun, eta mapetan <em>Serra del Rontonar</em> agertzen da La Torren beti <em>«mosatros diem el Rentonar»</em> esan den lekuan (<em>aspencat</em>, <em>pual</em> edo <em>queraïlla</em> bezala). Eta <em>Matxa-TTS v2</em>-ren lau ahots valentziarrak entzutean beste egia bat egiaztatu genuen: estudioko ahots garbiak dira, baina <strong>batek ere ez du oraindik La Torre de les Maçanes (L’Alacantí), Xixona edo Aitana inguruko kadentzia eta doinu zehatza</strong>.</p>',
      '<p>Hortik sortzen da <strong>Sóc de Pobleren Ahotsa</strong>: <strong>gure amona-aitonen, nekazarien eta auzotarren jakintza tradizionala erabiltzea adimen artifizialari eskualde bakoitzeko hizkera bizia irakasteko</strong>, L’Alacantí, El Comtat eta Marinatik hasi eta Safor, Plana, Maestrat, Ebroko Lurrak, Ponent eta Balear Uharteetaraino: <strong>guztiek batera osatzen dute hizkuntza osoa</strong>.</p>',

      '<h3>5. Beheko erreproduzitzaile erdiratua, ahots-hautatzailea eta gaur egungo egoera (0 Legea)</h3>',
      '<p>Mugikorrean zein ordenagailuan eroso entzuteko goiko barra botoiz bete gabe, irakurketa ozena <strong>Itzuli</strong> menutik edo <strong>«Entzun IAIAri»</strong> botoitik aktiba dezakezu: behean <strong>soinu-barra unibertsal erdiratua</strong> irekitzen da (mugikorreko nabigazioaren gainean eta mahaigaineko irakurketa-zutabearen gainean erdiratuta), aurreko blokea, pausatu eta jarraitu, hurrengo blokea, atalak eta bilaketa, zatia kopiatu eta itxi botoiekin, eta etorkizuneko <strong>Herri Irratirako</strong> prestatutako arkitekturarekin. Ahotsa <strong>Itzuli</strong> menuan edo orri honetako ahots-bankuan aukeratzen da, eta barrak hari jarraitzen dio.</p>',
      '<p>Gure <strong>zintzotasun erradikaleko 0 Legeari</strong> jarraituz, hona zer dabilen zuzenean gaur eta zer irekitzen ari garen urratsez urrats:</p>',
      '<ul>',
      '<li><strong>Zuzeneko ahots neuronala eta hedatutako taula komunitarioak:</strong> gure hizkuntzan edozein orri edo atsotitz entzutean, gailua doan konektatzen da gure Mac mini M4ko <strong>Matxa-TTS v2</strong> motorrera (<code>https://socdepoble.cat/api/v1/node0/veu</code>) <strong>7 ahots irekietako edozeinekin</strong>, eta <strong>Supabase partekatuan</strong> badaude jada, RLS segurtasunarekin, hitz dialektalen, jokoko botoen eta atsotitzen metadatuen taulak.</li>',
      '<li><strong>Oraindik ireki ez dugun urratsa:</strong> jokoaren eta taula horien arteko konexioa itzalita dagoen bitartean, «Nongo hizkera duzu?» jokoan ematen dituzun botoak eta hitzak gailu honetan geratzen dira, eta eskualdeko adostasunaren laburpena ez da oraindik erakusten. Atsotitzen 15 segundoko grabazioekin gauza bera gertatzen da: ekarpena gailu honetan erregistratzen da eta audioa deskarga dezakezu. 0 Nodoko ahozko laginen biltegia prestatzen ari gara, eta <code>CC BY-SA 4.0</code> lizentziaz lagatako laginekin egindako eskualdeko egokitzapen akustikoak geroago etorriko dira.</li>',
      '</ul>',

      '<h3>6. Jokatu «Nongo hizkera duzu?» jokoan eta grabatu zure eskualdeko atsotitzak</h3>',
      '<p>AA bati lurralde bakoitzeko aldaerak irakasteko bi osagai behar dira batera: <strong>hitz biziak (lexikoa)</strong> eta <strong>ahotsaren musika zehatza (prosodia)</strong>. Horregatik, orri honetan bertan laborategi bikoitz irekia bildu dugu:</p>',
      '<ul>',
      '<li>Goian <strong>«Nongo hizkera duzu?»</strong> joko interaktiboa duzu: <strong>eguneroko 12 hitzetan</strong> zure hizkera zein eskualderekin datorren bat ikusiko duzu, gomendatutako ahotsa klik batez aktibatu eta eskuliburuetan agertzen ez diren etxeko hitzak postontzian utzi.</li>',
      '<li>Ahots-bankuaren azpian <strong>Eskualdekako Atsotitz Sonoroak</strong> dituzu: <strong>32 esaera tradizional</strong>, mikrofonoa sakatu, <strong>zure ahotsez gehienez 15 segundo grabatu</strong> zure herria aipatuz eta <code>CC BY-SA 4.0</code> lizentziarekin askatasunez uzteko.</li>',
      '</ul>',
      '<p>Probatu jokoa, entzun zazpi ahotsak, grabatu atsotitz bat etxeko adinekoekin eta zabaldu lotura WhatsApp bidez: <strong>etxean Mac mini bat eta gure jendearen jakintza tradizionala ditugula, teknologiak eskualde bakoitzeko azentuarekin eta inorentzat kosturik gabe hitz egitea lortuko dugu</strong>.</p>',
    ].join('\n'),
  }),
  gl: Object.freeze({
    title: 'A Voz de Sóc de Poble: por que cada comarca merece escoitarse co seu propio acento e de balde',
    subtitle: 'O noso Mac mini M4 no Node 0, sistemas abertos de lingua, xogo «De onde falas?» e Refraneiro Sonoro comarcal',
    entradilla: 'Ao compartir por WhatsApp dous vídeos de Oli de La Torre, as amizades lembráronnos unha verdade esencial: unha ferramenta de vila ten que soar como fala a nosa xente. Explicámosche como o facemos 100 % gratuíto desde o noso Mac mini M4 (Node 0) con modelos abertos e coa sabedoría tradicional.',
    html: [
      '<h3>1. Cando as amizades escoitan por WhatsApp e din unha verdade coma un templo</h3>',
      '<p>Todo comezou compartindo por WhatsApp dous vídeos curtos de <strong>Oli de La Torre</strong> coa cuadrilla de amizades. A imaxe emocionaba e o aceite lucía, mais case todo o mundo sinalou con agarimo o mesmo antes de rematar o primeiro minuto: <em>«Óese moi limpo, pero esa voz soa a Barcelona; non parece unha veciña de La Torre, nin de Xixona, nin de L’Alacantí, nin de Alcoi!»</em>.</p>',
      '<p>Tiñan toda a razón. Cando falas de oliveiras centenarias agarradas aos socalcos de pedra seca en <strong>La Torre de les Maçanes (L’Alacantí)</strong> mirando cara a Aitana e o Rentonar, <strong>a voz é memoria, casa e confianza</strong>. Unha ferramenta dixital con espírito <strong>de vila</strong> —pensada para que unha persoa maior prema un botón e escoite unha crónica, unha receita ou un bando— non pode falar sempre cun único acento estándar de laboratorio.</p>',

      '<h3>2. Como facemos que este servizo de voz sexa 100 % gratuíto: o Mac mini M4 e o Node 0</h3>',
      grupTargetaNodeZero('gl'),
      '<p>A primeira pregunta é moi directa: <strong>como ofrecer síntese de voz neuronal sen cobrar cotas nin poñer publicidade?</strong> As plataformas comerciais de voz na nube facturan unha <strong>peaxe por cada carácter, sílaba ou minuto xerado</strong>. Nun proxecto cívico e rural sen ánimo de lucro, canta máis xente maior escoitase crónicas, receitas e refráns, máis medraría unha factura mensual insostible.</p>',
      '<p>A nosa resposta aplica a economía da <strong>pedra seca</strong>: en vez de alugar voces alleas por sílaba na nube, instalamos en <strong>el Mas</strong> (La Torre de les Maçanes, L’Alacantí) o <a href="/page/node-zero"><strong>Node 0</strong></a>, un pequeno <strong>Mac mini con chip Apple M4 de 10 núcleos e 24 GiB de memoria unificada</strong> que xa serve <code>socdepoble.cat</code>. Unha vez aceso na casa, <strong>sintetizar mil frases ou cen mil ten custo marxinal cero en licenzas externas</strong>, garantindo unha escoita aberta e gratuíta.</p>',

      '<h3>3. O equipo de IAs co que traballamos e os sistemas especializados de lingua descargados</h3>',
      '<p>En <strong>Sóc de Poble</strong> traballamos man a man un coordinador humano, modelos de escritorio de fronteira (<em>Claude</em>, <em>Codex</em>, <em>Gemini</em> e a orquestradora <em>IAIA MarIA</em>) e <strong>oito escolas locais abertas sobre Ollama dentro do Node 0</strong> (<em>Qwen</em>, <em>DeepSeek</em>, <em>Gemma 3</em>, <em>Hermes</em>, <em>Mistral</em>, <em>GLM-4</em> e <em>Phi-4</em>). Pero cos modelos xeralistas de conversa non abonda para falar ben a nosa lingua: precisabamos descargar no Node 0 <strong>sistemas abertos de síntese neuronal, fonética e corpus orais</strong>:</p>',
      '<ul>',
      '<li><strong>Matxa-TTS v2 Multiaccent (Proxecto AINA · Barcelona Supercomputing Center e alVoCat):</strong> motor neuronal aberto en formato <strong>ONNX (260 MB)</strong> que no noso chip M4 xera <strong>9 segundos de voz nítida en apenas 1,3 segundos</strong> (factor <code>0,15</code>), con catro voces valencianas de estudo verificadas por frecuencia fundamental (<em>Gina</em>, <em>Berta</em>, <em>Arnau</em> e <em>Lluc</em>) xunto á noroccidental (<em>Emma</em>), á central (<em>Èlia</em>) e á balear (<em>Olga</em>).</li>',
      '<li><strong>Corpus orais NEL-VIVES do centro CENID (Universidade de Alacant) e criterios da AVL:</strong> apoio filolóxico e fonético aberto para coidar as vogais abertas, as sibilantes sonoras e o vocabulario meridional.</li>',
      '<li><strong>Whisper e laboratorio de adaptación acústica sobre Apple Silicon (F5-TTS-MLX):</strong> ferramentas abertas instaladas no Mac mini para transcribir e afinar progresivamente as variantes comarcais con mostras cedidas con permiso explícito.</li>',
      '</ul>',

      '<h3>4. A intelixencia tradicional ensinando á IA (e por que ningunha voz de estudo fala aínda como en La Torre)</h3>',
      '<p>Nas primeiras probas en frío, un modelo local pequeno sen dicionario da terra chegou a dicirnos que unha <em>rabosa</em> era «un coello pequeno», igual que en moitos mapas sae escrito <em>Serra del Rontonar</em> onde en La Torre toda a vida se dixo <em>«mosatros diem el Rentonar»</em> (xunto a <em>aspencat</em>, <em>pual</em> ou <em>queraïlla</em>). E ao escoitar as catro voces valencianas de <em>Matxa-TTS v2</em> comprobamos con honestidade outra verdade: son voces limpas de estudo adestradas sobre valenciano xeral, pero <strong>ningunha fala aínda co deixe exacto e a cadencia de La Torre de les Maçanes (L’Alacantí), Xixona ou os vales de Aitana</strong>.</p>',
      '<p>Aí nace a idea nai de <strong>A Voz de Sóc de Poble</strong>: <strong>empregar a intelixencia tradicional das nosas avoas, labregos e cuadrillas para ensinar e mellorar a intelixencia artificial</strong>, sumando a riqueza viva de L’Alacantí, o Vinalopó, El Comtat, l’Alcoià, a Marina, a Safor, a Ribera, l’Horta, a Plana, o Maestrat, as Terres de l’Ebre, Ponent e as Illes Balears: <strong>todas xuntas fan a lingua enteira</strong>.</p>',

      '<h3>5. Reprodutor inferior centrado, selector de voces e en que punto estamos hoxe (Lei 0)</h3>',
      '<p>Para que escoitar sexa cómodo tanto no móbil coma no ordenador sen encher a barra superior de botóns, podes activar a lectura en voz alta desde a icona <strong>Traducir</strong> ou desde o botón <strong>«Escoita a IAIA»</strong>: ábrese embaixo unha <strong>barra reprodutora universal centrada</strong> (sobre a navegación inferior no móbil e centrada sobre a columna de lectura no escritorio), con bloque anterior, pausa e continuar, bloque seguinte, apartados e busca, copiar o fragmento e pechar, e cunha arquitectura preparada para a futura <strong>Radio da Vila</strong>. A voz escóllese no menú <strong>Traducir</strong> ou no banco de voces desta páxina, e a barra séguea.</p>',
      '<p>Seguindo a nosa <strong>Lei 0 de honestidade radical</strong>, explicamos que funciona xa en directo e que paso abrimos pouco a pouco:</p>',
      '<ul>',
      '<li><strong>Voz neuronal en directo e táboas comunitarias despregadas:</strong> ao escoitar calquera páxina ou refrán na nosa lingua, o aparello conéctase de balde a <strong>Matxa-TTS v2 no noso Mac mini M4</strong> (<code>https://socdepoble.cat/api/v1/node0/veu</code>) con <strong>calquera das 7 voces abertas</strong>, e no <strong>Supabase compartido</strong> xa existen, con seguridade RLS, as táboas comunitarias para palabras dialectais, votos do xogo e metadatos do refraneiro.</li>',
      '<li><strong>O paso que aínda non abrimos:</strong> mentres a conexión do xogo con esas táboas siga apagada, os votos e as palabras que achegas a «De onde falas?» quedan neste aparello, e o resumo do consenso comarcal aínda non se amosa. Coas gravacións de 15 segundos do Refraneiro pasa o mesmo: a achega anótase neste aparello e o audio pódelo descargar. O almacén de mostras orais do Node 0 está en preparación, e as adaptacións acústicas comarcais con mostras cedidas baixo licenza <code>CC BY-SA 4.0</code> chegarán despois.</li>',
      '</ul>',

      '<h3>6. Xoga a «De onde falas?» e grava os refráns da túa comarca</h3>',
      '<p>Para ensinar a unha IA as variantes de cada territorio cómpren <strong>as palabras vivas (o léxico)</strong> e <strong>a música exacta da voz (a prosodia)</strong>. Por iso reunimos nesta mesma páxina un dobre laboratorio aberto:</p>',
      '<ul>',
      '<li>Arriba tes o xogo interactivo <strong>«De onde falas?»</strong>: en <strong>12 palabras cotiás</strong> descobres con que comarcas coincide a túa fala, activas a voz recomendada e anotas na caixa de correo esas palabras da casa que non saen nos manuais.</li>',
      '<li>A continuación do banco de voces tes o <strong>Refraneiro Sonoro por Comarcas</strong>: <strong>32 ditos tradicionais</strong> onde podes premer o micrófono, <strong>gravar ata 15 segundos coa túa propia voz</strong> dicindo de que vila es e cedelo libremente (<code>CC BY-SA 4.0</code>).</li>',
      '</ul>',
      '<p>Proba o xogo, escoita as sete voces, grava un refrán cos maiores da casa e comparte a ligazón por WhatsApp: <strong>cun Mac mini na casa e a sabedoría tradicional da nosa xente, faremos que a tecnoloxía fale co acento de cada comarca e sen custo para ninguén</strong>.</p>',
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
