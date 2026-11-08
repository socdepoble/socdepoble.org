/**
 * IDEA-171 · Mapa Honest del Saber Actual de la IAIA MarIA per al Seu 2n Número Exclusiu de WhatsApp
 * (`Hermes WhatsApp Gateway` + `Node 0` · `iaia:latest` + `hermes3:8b` + `SQLite FTS5`).
 * El model `iaia:latest` és el de la P0-41 i la P0-43 del Llibre Mestre (261107); al Node 0,
 * `iaia-maria:latest` en queda com a àlies idèntic. Esta targeta no ho verifica al Node 0.
 *
 * Principi d'Humilitat Epistemològica («Zero Al·lucinació de Poble»):
 * La IAIA MarIA declara en 5 llengües (ca, es, en, eu, gl) els dominis dels quals ja té fonts citades
 * a l'arbre, i adverteix amb honestedat que allò que encara no estiga documentat no s'ho inventa mai,
 * sinó que ho anota per a aprendre-ho a poc a poc amb la gent del poble.
 *
 * Fonts de cada domini (R11, arbitratge de Claude):
 *  01 pou: src/data/patrimoni/anatomiaRural.js (POU: cotes, discrepàncies i època; FONT_POU).
 *  02 oli: acta 261103_1228 (7 productes) i supabase/snippets/2611031750 (correcció Oli-F3).
 *  03 patrimoni: anatomiaRural.js, herbariLaTorre117.js, bancLlavors.js, arbresMonumentals.js, rutesDePoble.js.
 *  04 calendari: src/utils/temporada/dades.js diu ell mateix «NO VERIFICAT»: domini en preparació.
 *  05 història: rutesDePoble.js («Itineraris per La Torre de les Maçanes», 2021).
 *  06 Batec de Vida: IDEA-123/124, pendent d'integració: domini en preparació, no avisa ningú.
 *  07 Fediversity: PDF d'arquitectura de juliol de 2025 (actors p. 1, tecnologies pp. 2–3 i 7, portabilitat p. 5).
 * Ni la IP de LAN ni camins del servidor: esta dada arriba al paquet públic.
 * Tampoc l'adreça local del servei de models: viu només al pont de tooling/node0, perquè el codi de
 * l'aplicació web no s'hi connecta (pageContent.r9.test.js, «les peces que sostenen les xifres»).
 */

export const IAIA_WHATSAPP_NODE0_ARCHITECTURE = Object.freeze({
  gateway: 'Hermes WhatsApp Gateway',
  primaryModel: 'iaia:latest',
  reasoningFallbackModel: 'hermes3:8b',
  memoryEngine: 'SQLite FTS5 + Honcho Dialectical Profile',
  trajectoryTags: Object.freeze(['[DISCOVERY]', '[DEADEND]', '[CORRECTION]', '[SEQUENCE]']),
});

export const IAIA_SABER_DOMAINS_IDS = Object.freeze([
  'pou-de-neu-rentonar',
  'oli-oliva-la-torre',
  'patrimoni-anatomia-herbari-llavors-arbres-rutes',
  'calendari-agricola-i-receptari-mas',
  'genealogia-i-historia-la-torre',
  'batec-de-vida-i-emergencies-offline',
  'arquitectura-fediversity-node0',
]);

/** Dominis sense fonts verificades: el simulador hi respon sempre amb humilitat. */
export const IAIA_SABER_DOMAINS_EN_PREPARACIO = Object.freeze([
  'calendari-agricola-i-receptari-mas',
  'batec-de-vida-i-emergencies-offline',
]);

export const IAIA_WHATSAPP_MAPA_SABER_TEXTS = Object.freeze({
  ca: {
    kicker: 'IDEA-171 · 2n Número Exclusiu de Mòbil en WhatsApp · Hermes Gateway + Node 0',
    title: 'El WhatsApp de la IAIA · Mapa Honest del Saber de Poble',
    subtitle:
      'Pensada per al Node 0 (iaia:latest + hermes3:8b + SQLite FTS5). Contesta només amb fonts citades i mai no s’inventa el que encara no sap.',
    architectureHeading: 'Arquitectura del Pont del WhatsApp de la IAIA (Hermes + Node 0 + Fediversity)',
    architectureSummary:
      'El segon número de mòbil exclusiu de la IAIA MarIA està pensat per a funcionar amb Hermes WhatsApp Gateway, en xarxa local amb el Mac mini M4 del Node 0. El pont només contesta amb els fragments del corpus de Cultura Rural que ha pogut llegir; si no en llig cap, la IAIA respon amb humilitat. Estat: el desplegament al Node 0 encara no està verificat.',
    readoutGatewayLabel: 'Pont',
    readoutNodeLabel: 'Node',
    readoutNodeValue: 'Node 0 · La Torre de les Maçanes (xarxa local)',
    readoutModelsLabel: 'Models',
    readoutMemoryLabel: 'Memòria i corpus',
    humilityPledgeTitle: 'Compromís d’Humilitat Epistemològica («Zero Fum i Zero Invenció»)',
    humilityPledgeBody:
      '«Bonica, jo de les coses que tinc documentades al Mas amb llibres, plànols i memòria oral verificada t’ho explique al mil·límetre; però del que encara no tenim contrastat al Node 0, abans calle que inventar-me un conte. Anem ampliant el cabàs del saber a poc a poc amb tot el poble!»',
    domainsHeading: 'Els 7 Dominis del Saber de la IAIA MarIA: 5 amb Fonts Citades i 2 en Preparació',
    simulatorHeading: 'Simulador del WhatsApp de la IAIA',
    simulatorDomainLabel: 'Tria un domini o una consulta fora de corpus',
    simulatorUnverifiedOption: '❓ Consulta encara no documentada al corpus del Mas (Prova d’humilitat)',
    simulatorPromptLabel: 'Pregunta del veí o veïna per WhatsApp',
    simulatorSendButton: 'Envia pel Pont Hermes WhatsApp',
    simulatorResponseHeading: 'Resposta de la IAIA MarIA (simulació)',
    simulatorSourcesLabel: 'Fonts:',
    simulatorStatusVerified: 'VERIFICAT AMB FONTS PRIMÀRIES',
    simulatorStatusHumility: 'HONESTEDAT ACTIVA · PENDENT DE DOCUMENTAR AMB EL POBLE',
    unverifiedSampleQuestion: 'Quin dia exacte es va inaugurar el primer molí de vent de l’any 1412?',
    unverifiedHonestReply:
      'Ai, fill meu, d’això encara no tinc els papers ni l’acta verificada a l’arxiu del Node 0. T’apunte la pregunta amb l’etiqueta [DISCOVERY] per consultar-ho amb els majors i l’arxiu municipal, perquè la IAIA MarIA no s’inventa mai cap dada que no estiga contrastada.',
    unverifiedSourcesNote: 'Cap font verificada encara.',
    domains: [
      {
        id: 'pou-de-neu-rentonar',
        num: '01',
        title: 'Pou de la Neu del Rentonar i el Comerç Valencià del Fred',
        sources:
          'Josep Maria Segura Martí, «El pou de la neu del Rentonar» (socdepoble.net, WP 3656), amb el plànol i el corpus de l’anatomia rural del Mas; Manuel Rico García (1880) per a les arroves; documental d’Eugenio Monesma sobre els pous de neu.',
        summary:
          'Cotes de l’anatomia rural del Mas: a 1.160 m d’altitud; 13,75 m de fondària des de les finestres superiors; diàmetre interior de 9,80 m segons l’article (9,75 m al plànol); capacitat estimada de 1.030 m³ segons l’article (més de 1.100 m³ segons el corpus) i 20.000 arroves segons Manuel Rico García (1880); 3 finestres superiors (nord, oest i est), de les quals només és oberta la de l’oest, d’1,55 × 1,70 m en un mur d’1,50 m de gruix; túnel d’accés sud de 9,10 m, a 10 m damunt del fons; galeria d’escorredor a l’est d’uns 29 m, de 0,50 × 0,70 m segons l’article (24 + 5 m al plànol); 4 estreps de 2 arcs creuats. Bastit entre els segles XVII i XVIII; documentat de 1724 a 1880.',
        sampleQuestion: 'Quines mides té el Pou de la Neu del Rentonar i qui el va construir?',
        sampleReply:
          'Segons l’article de Josep Maria Segura Martí, el Pou de la Neu del Rentonar fa 9,80 m de diàmetre interior (el plànol en diu 9,75) i 13,75 m de fondària des de les finestres superiors, amb un mur d’1,50 m de gruix. Té 3 finestres superiors (nord, oest i est), però només és oberta la de l’oest, d’1,55 × 1,70 m; un túnel d’accés al sud de 9,10 m, a 10 m damunt del fons, i una galeria d’escorredor a l’est d’uns 29 m. L’article en calcula 1.030 m³, i Manuel Rico García (1880) li donava 20.000 arroves. Qui el va bastir no consta: es va construir entre els segles XVII i XVIII, i els arxius en parlen de 1724 a 1880.',
      },
      {
        id: 'oli-oliva-la-torre',
        num: '02',
        title: 'Oli d’Oliva Verge Extra de La Torre en 7 Formats',
        sources:
          'Fitxes dels 7 productes oficials d’Oli de La Torre (olidelatorre.com), publicades al Mercat de Sóc de Poble.',
        summary:
          'Varietats Alfafarenca i Mançanella, d’oliveres tradicionals de muntanya de la comarca. Oli de categoria superior, obtingut només per procediments mecànics i de la primera extracció en fred. 7 formats: 250 ml, 500 ml, 2 l i 5 l, i caixes de 12 de 500 ml, de 6 de 2 l i de 3 de 5 l.',
        sampleQuestion: 'Quines varietats d’oliva fan l’oli de La Torre i en quins formats s’envasa?',
        sampleReply:
          'L’oli de La Torre es fa amb olives Alfafarenca i Mançanella, d’oliveres tradicionals de muntanya de la nostra comarca, només per procediments mecànics i de la primera extracció en fred. Al Mercat de Sóc de Poble el tens en 7 formats: 250 ml, 500 ml, 2 l i 5 l, i caixes de 12 de 500 ml, de 6 de 2 l i de 3 de 5 l.',
      },
      {
        id: 'patrimoni-anatomia-herbari-llavors-arbres-rutes',
        num: '03',
        title: 'Anatomia Rural, Herbari, Banc de Llavors, 19 Arbres Emblemàtics i Monumentals i Rutes',
        sources:
          'Anatomia rural del Mas (9 construccions), herbari de 117 fitxes de La Torre, 3 catàlegs publicats de varietats tradicionals, Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes (2017) i «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021).',
        summary:
          'Les 5 pàgines de patrimoni: l’anatomia de 9 construccions rurals (del pou de neu i l’almàssera als molins, el forn i la sénia), un herbari de 117 fitxes (amb el timó, el romer, la sàlvia o la pebrella), la consulta de 3 catàlegs de varietats tradicionals de llavors, els 19 arbres del catàleg d’emblemàtics i monumentals (2 hi consten com a monumentals) i 6 itineraris pel poble.',
        sampleQuestion: 'Quins arbres i rutes puc consultar al patrimoni de La Torre?',
        sampleReply:
          'Tens els 19 arbres del Catàleg d’Arbres Emblemàtics i Monumentals de La Torre (2017), dels quals 2 hi consten com a monumentals, i els 6 itineraris de «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021). També hi ha l’herbari de 117 fitxes, amb plantes com la pebrella, la sàlvia, el rabet de gat o el timó, i la consulta de 3 catàlegs de varietats tradicionals de llavors.',
      },
      {
        id: 'calendari-agricola-i-receptari-mas',
        num: '04',
        title: 'Calendari Agrícola i Receptari del Mas (en preparació)',
        sources:
          'Calendari de temporada de la Nevera de Casa (orientatiu i pendent de revisió) i receptari de llavor de la Nevera.',
        summary:
          'Encara no verificat: el calendari de temporada és orientatiu i només parla de mesos de collita. Les dates de planter i de trasplantament encara no tenen cap font.',
        sampleQuestion: 'Quan es fa el planter i el trasplantament de la tomaca a la muntanya?',
        sampleReply:
          'D’això encara no tinc res verificat: el calendari de temporada del Mas és orientatiu i només parla de collites, i les dates de planter i de trasplantament de la tomaca no les tinc contrastades. T’ho apunte amb l’etiqueta [DISCOVERY] per preguntar-ho als llauradors del poble.',
      },
      {
        id: 'genealogia-i-historia-la-torre',
        num: '05',
        title: 'Història Documentada de La Torre de les Maçanes',
        sources:
          '«Itineraris per La Torre de les Maçanes» (Gent de La Torre · El Diari de La Torre de les Maçanes, revisió de 2021).',
        summary:
          'Els itineraris documenten l’Església de Santa Anna i el casc antic, la Casa Alta (l’edifici que dona nom i identitat al poble, amb museu) i la Foia de Cortès, un mas fortificat. La genealogia i els llinatges encara no tenen cap corpus verificat.',
        sampleQuestion: 'Quin origen té la Casa Alta de La Torre de les Maçanes?',
        sampleReply:
          'Segons els «Itineraris per La Torre de les Maçanes» (2021), la Casa Alta, al carrer del Castell, és l’edifici més emblemàtic del poble, el que li dona nom i identitat, i hi ha un museu. De quan es va bastir encara no tinc cap font verificada: t’ho apunte amb l’etiqueta [DISCOVERY] per consultar-ho amb l’arxiu i amb els majors.',
      },
      {
        id: 'batec-de-vida-i-emergencies-offline',
        num: '06',
        title: 'Batec de Vida (IDEA-123/124, en preparació)',
        sources: 'Proposta de les IDEA-123/124, pendent d’integració.',
        summary:
          'Encara no actiu: és una proposta d’acompanyament per a gent major que viu sola. Ara mateix no avisa ningú.',
        sampleQuestion: 'Com funciona l’alerta de 6 hores del Batec de Vida per als majors?',
        sampleReply:
          'El Batec de Vida encara no està actiu: és una idea en preparació i ara mateix no avisa ningú. Si et preocupa algú, no esperes cap avís automàtic: telefona-li o passa per sa casa, i si és urgent crida al 112.',
      },
      {
        id: 'arquitectura-fediversity-node0',
        num: '07',
        title: 'Arquitectura: Sóc de Poble, el Node 0 i el Pla de Fediversity',
        sources:
          'Fediversity, «Implementation and planning» (PDF d’arquitectura, juliol de 2025): actors a la p. 1, tecnologies a les pp. 2–3 i 7, portabilitat a la p. 5.',
        summary:
          'Segons el PDF d’arquitectura de Fediversity: 5 actors (Maintainers, Developers, Hosting provider, Operator i User; p. 1); un mòdul de configuració NixOS que es desplega amb NixOps4 o OpenTofu sobre una màquina NixOS o un hipervisor Proxmox, amb Garage com a emmagatzematge d’objectes compatible amb S3 (pp. 2–3) i CI/CD amb Forgejo (p. 7); i 3 passos per a portar les aplicacions a un altre allotjament: registre del domini, desplegament i còpia de les dades (p. 5).',
        sampleQuestion: 'Com es connecta Sóc de Poble amb Fediversity i el Node 0?',
        sampleReply:
          'Fediversity descriu 5 actors (Maintainers, Developers, Hosting provider, Operator i User) i 3 passos per a portar les aplicacions a un altre allotjament: actualitzar el DNS del domini, tornar a desplegar-les amb el mòdul de configuració reproduïble i copiar-ne les dades amb scripts de còpia i restauració (PDF d’arquitectura de juliol de 2025, pp. 1 i 5). Que el Node 0 de Sóc de Poble ja funcione així no ho tinc verificat, i no ho afirme.',
      },
    ],
  },
  es: {
    kicker: 'IDEA-171 · 2º Número Exclusivo de Móvil en WhatsApp · Hermes Gateway + Nodo 0',
    title: 'El WhatsApp de la IAIA · Mapa Honesto del Saber de Pueblo',
    subtitle:
      'Pensada para el Nodo 0 (iaia:latest + hermes3:8b + SQLite FTS5). Responde solo con fuentes citadas y nunca inventa lo que aún no sabe.',
    architectureHeading: 'Arquitectura del Puente del WhatsApp de la IAIA (Hermes + Nodo 0 + Fediversity)',
    architectureSummary:
      'El segundo número de móvil exclusivo de la IAIA MarIA está pensado para funcionar con Hermes WhatsApp Gateway, en red local con el Mac mini M4 del Nodo 0. El puente solo responde con los fragmentos del corpus de Cultura Rural que ha podido leer; si no lee ninguno, la IAIA responde con humildad. Estado: el despliegue en el Nodo 0 aún no está verificado.',
    readoutGatewayLabel: 'Puente',
    readoutNodeLabel: 'Nodo',
    readoutNodeValue: 'Nodo 0 · La Torre de les Maçanes (red local)',
    readoutModelsLabel: 'Modelos',
    readoutMemoryLabel: 'Memoria y corpus',
    humilityPledgeTitle: 'Compromiso de Humildad Epistemológica («Cero Humo y Cero Invención»)',
    humilityPledgeBody:
      '«Corazón, de lo que tengo documentado en el Mas con libros, planos y memoria oral verificada te lo explico al milímetro; pero de lo que aún no tenemos contrastado en el Nodo 0, antes callo que inventarme un cuento. ¡Vamos ampliando el capazo del saber poco a poco con todo el pueblo!»',
    domainsHeading: 'Los 7 Dominios del Saber de la IAIA MarIA: 5 con Fuentes Citadas y 2 en Preparación',
    simulatorHeading: 'Simulador del WhatsApp de la IAIA',
    simulatorDomainLabel: 'Elige un dominio o una consulta fuera de corpus',
    simulatorUnverifiedOption: '❓ Consulta aún no documentada en el corpus del Mas (Prueba de humildad)',
    simulatorPromptLabel: 'Pregunta del vecino o vecina por WhatsApp',
    simulatorSendButton: 'Enviar por el Puente Hermes WhatsApp',
    simulatorResponseHeading: 'Respuesta de la IAIA MarIA (simulación)',
    simulatorSourcesLabel: 'Fuentes:',
    simulatorStatusVerified: 'VERIFICADO CON FUENTES PRIMARIAS',
    simulatorStatusHumility: 'HONESTIDAD ACTIVA · PENDIENTE DE DOCUMENTAR CON EL PUEBLO',
    unverifiedSampleQuestion: '¿Qué día exacto se inauguró el primer molino de viento del año 1412?',
    unverifiedHonestReply:
      'Ay, hijo mío, de eso todavía no tengo los papeles ni el acta verificada en el archivo del Nodo 0. Te apunto la pregunta con la etiqueta [DISCOVERY] para consultarlo con los mayores y el archivo municipal, porque la IAIA MarIA nunca se inventa ningún dato que no esté contrastado.',
    unverifiedSourcesNote: 'Aún ninguna fuente verificada.',
    domains: [
      {
        id: 'pou-de-neu-rentonar',
        num: '01',
        title: 'Pozo de Nieve del Rentonar y el Comercio Valenciano del Frío',
        sources:
          'Josep Maria Segura Martí, «El pou de la neu del Rentonar» (socdepoble.net, WP 3656), con el plano y el corpus de la anatomía rural del Mas; Manuel Rico García (1880) para las arrobas; documental de Eugenio Monesma sobre los pozos de nieve.',
        summary:
          'Cotas de la anatomía rural del Mas: a 1.160 m de altitud; 13,75 m de profundidad desde las ventanas superiores; diámetro interior de 9,80 m según el artículo (9,75 m en el plano); capacidad estimada de 1.030 m³ según el artículo (más de 1.100 m³ según el corpus) y 20.000 arrobas según Manuel Rico García (1880); 3 ventanas superiores (norte, oeste y este), de las que solo está abierta la del oeste, de 1,55 × 1,70 m en un muro de 1,50 m de grosor; túnel de acceso sur de 9,10 m, a 10 m sobre el fondo; galería de desagüe al este de unos 29 m, de 0,50 × 0,70 m según el artículo (24 + 5 m en el plano); 4 estribos de 2 arcos cruzados. Construido entre los siglos XVII y XVIII; documentado de 1724 a 1880.',
        sampleQuestion: '¿Qué medidas tiene el Pozo de la Nieve del Rentonar y quién lo construyó?',
        sampleReply:
          'Según el artículo de Josep Maria Segura Martí, el Pozo de la Nieve del Rentonar mide 9,80 m de diámetro interior (el plano dice 9,75) y 13,75 m de profundidad desde las ventanas superiores, con un muro de 1,50 m de grosor. Tiene 3 ventanas superiores (norte, oeste y este), pero solo está abierta la del oeste, de 1,55 × 1,70 m; un túnel de acceso al sur de 9,10 m, a 10 m sobre el fondo, y una galería de desagüe al este de unos 29 m. El artículo le calcula 1.030 m³, y Manuel Rico García (1880) le daba 20.000 arrobas. Quién lo levantó no consta: se construyó entre los siglos XVII y XVIII, y los archivos hablan de él de 1724 a 1880.',
      },
      {
        id: 'oli-oliva-la-torre',
        num: '02',
        title: 'Aceite de Oliva Virgen Extra de La Torre en 7 Formatos',
        sources:
          'Fichas de los 7 productos oficiales de Oli de La Torre (olidelatorre.com), publicadas en el Mercado de Sóc de Poble.',
        summary:
          'Variedades Alfafarenca y Mançanella, de olivos tradicionales de montaña de la comarca. Aceite de categoría superior, obtenido solo por procedimientos mecánicos y de la primera extracción en frío. 7 formatos: 250 ml, 500 ml, 2 l y 5 l, y cajas de 12 de 500 ml, de 6 de 2 l y de 3 de 5 l.',
        sampleQuestion: '¿Qué variedades de aceituna hacen el aceite de La Torre y en qué formatos se envasa?',
        sampleReply:
          'El aceite de La Torre se hace con aceitunas Alfafarenca y Mançanella, de olivos tradicionales de montaña de nuestra comarca, solo por procedimientos mecánicos y de la primera extracción en frío. En el Mercado de Sóc de Poble lo tienes en 7 formatos: 250 ml, 500 ml, 2 l y 5 l, y cajas de 12 de 500 ml, de 6 de 2 l y de 3 de 5 l.',
      },
      {
        id: 'patrimoni-anatomia-herbari-llavors-arbres-rutes',
        num: '03',
        title: 'Anatomía Rural, Herbario, Banco de Semillas, 19 Árboles Emblemáticos y Monumentales y Rutas',
        sources:
          'Anatomía rural del Mas (9 construcciones), herbario de 117 fichas de La Torre, 3 catálogos publicados de variedades tradicionales, Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes (2017) e «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021).',
        summary:
          'Las 5 páginas de patrimonio: la anatomía de 9 construcciones rurales (del pozo de nieve y la almazara a los molinos, el horno y la noria), un herbario de 117 fichas (con el tomillo, el romero, la salvia o la pebrella), la consulta de 3 catálogos de variedades tradicionales de semillas, los 19 árboles del catálogo de emblemáticos y monumentales (2 constan como monumentales) y 6 itinerarios por el pueblo.',
        sampleQuestion: '¿Qué árboles y rutas puedo consultar en el patrimonio de La Torre?',
        sampleReply:
          'Tienes los 19 árboles del Catàleg d’Arbres Emblemàtics i Monumentals de La Torre (2017), de los que 2 constan como monumentales, y los 6 itinerarios de «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021). También está el herbario de 117 fichas, con plantas como la pebrella, la salvia, el rabo de gato o el tomillo, y la consulta de 3 catálogos de variedades tradicionales de semillas.',
      },
      {
        id: 'calendari-agricola-i-receptari-mas',
        num: '04',
        title: 'Calendario Agrícola y Recetario del Mas (en preparación)',
        sources:
          'Calendario de temporada de La Nevera de Casa (orientativo y pendiente de revisión) y recetario inicial de La Nevera.',
        summary:
          'Aún no verificado: el calendario de temporada es orientativo y solo habla de meses de cosecha. Las fechas de semillero y de trasplante aún no tienen ninguna fuente.',
        sampleQuestion: '¿Cuándo se hace el semillero y el trasplante del tomate en la montaña?',
        sampleReply:
          'De eso aún no tengo nada verificado: el calendario de temporada del Mas es orientativo y solo habla de cosechas, y las fechas de semillero y de trasplante del tomate no las tengo contrastadas. Te lo apunto con la etiqueta [DISCOVERY] para preguntarlo a los labradores del pueblo.',
      },
      {
        id: 'genealogia-i-historia-la-torre',
        num: '05',
        title: 'Historia Documentada de La Torre de les Maçanes',
        sources:
          '«Itineraris per La Torre de les Maçanes» (Gent de La Torre · El Diari de La Torre de les Maçanes, revisión de 2021).',
        summary:
          'Los itinerarios documentan la Iglesia de Santa Anna y el casco antiguo, la Casa Alta (el edificio que da nombre e identidad al pueblo, con museo) y la Foia de Cortès, un mas fortificado. La genealogía y los linajes aún no tienen ningún corpus verificado.',
        sampleQuestion: '¿Qué origen tiene la Casa Alta de La Torre de les Maçanes?',
        sampleReply:
          'Según los «Itineraris per La Torre de les Maçanes» (2021), la Casa Alta, en la calle del Castell, es el edificio más emblemático del pueblo, el que le da nombre e identidad, y tiene un museo. De cuándo se construyó aún no tengo ninguna fuente verificada: te lo apunto con la etiqueta [DISCOVERY] para consultarlo con el archivo y con los mayores.',
      },
      {
        id: 'batec-de-vida-i-emergencies-offline',
        num: '06',
        title: 'Latido de Vida (IDEA-123/124, en preparación)',
        sources: 'Propuesta de las IDEA-123/124, pendiente de integración.',
        summary:
          'Aún no activo: es una propuesta de acompañamiento para personas mayores que viven solas. Ahora mismo no avisa a nadie.',
        sampleQuestion: '¿Cómo funciona la alerta de 6 horas del Latido de Vida para mayores?',
        sampleReply:
          'El Latido de Vida aún no está activo: es una idea en preparación y ahora mismo no avisa a nadie. Si te preocupa alguien, no esperes ningún aviso automático: llámale o pasa por su casa, y si es urgente llama al 112.',
      },
      {
        id: 'arquitectura-fediversity-node0',
        num: '07',
        title: 'Arquitectura: Sóc de Poble, el Nodo 0 y el Plan de Fediversity',
        sources:
          'Fediversity, «Implementation and planning» (PDF de arquitectura, julio de 2025): actores en la p. 1, tecnologías en las pp. 2–3 y 7, portabilidad en la p. 5.',
        summary:
          'Según el PDF de arquitectura de Fediversity: 5 actores (Maintainers, Developers, Hosting provider, Operator y User; p. 1); un módulo de configuración NixOS que se despliega con NixOps4 u OpenTofu sobre una máquina NixOS o un hipervisor Proxmox, con Garage como almacenamiento de objetos compatible con S3 (pp. 2–3) y CI/CD con Forgejo (p. 7); y 3 pasos para llevar las aplicaciones a otro alojamiento: registro del dominio, despliegue y copia de los datos (p. 5).',
        sampleQuestion: '¿Cómo se conecta Sóc de Poble con Fediversity y el Nodo 0?',
        sampleReply:
          'Fediversity describe 5 actores (Maintainers, Developers, Hosting provider, Operator y User) y 3 pasos para llevar las aplicaciones a otro alojamiento: actualizar el DNS del dominio, volver a desplegarlas con el módulo de configuración reproducible y copiar sus datos con scripts de copia y restauración (PDF de arquitectura de julio de 2025, pp. 1 y 5). Que el Nodo 0 de Sóc de Poble ya funcione así no lo tengo verificado, y no lo afirmo.',
      },
    ],
  },
  en: {
    kicker: 'IDEA-171 · Exclusive 2nd Mobile Number on WhatsApp · Hermes Gateway + Node 0',
    title: 'The IAIA’s WhatsApp · Honest Village Knowledge Map',
    subtitle:
      'Designed for Node 0 (iaia:latest + hermes3:8b + SQLite FTS5). Replies only with cited sources and never makes up what it does not yet know.',
    architectureHeading: 'Architecture of the IAIA’s WhatsApp Bridge (Hermes + Node 0 + Fediversity)',
    architectureSummary:
      'IAIA MarIA’s exclusive second mobile number is designed to run on Hermes WhatsApp Gateway, over the local network with the Node 0 Mac mini M4. The bridge only answers with the Rural Culture corpus fragments it could read; if it reads none, IAIA replies with humility. Status: the deployment on Node 0 is not yet verified.',
    readoutGatewayLabel: 'Bridge',
    readoutNodeLabel: 'Node',
    readoutNodeValue: 'Node 0 · La Torre de les Maçanes (local network)',
    readoutModelsLabel: 'Models',
    readoutMemoryLabel: 'Memory and corpus',
    humilityPledgeTitle: 'Epistemological Humility Pledge (“Zero Smoke and Zero Hallucination”)',
    humilityPledgeBody:
      '“My dear, whatever we hold documented at the Mas with monographs, archaeological plans, and verified oral memory, I will explain down to the millimeter; for anything not yet verified in Node 0, I would rather stay silent than make up a tale. We grow our basket of knowledge step by step together with the village!”',
    domainsHeading: 'The 7 Knowledge Domains of IAIA MarIA: 5 with Cited Sources and 2 in Preparation',
    simulatorHeading: 'Simulator of the IAIA’s WhatsApp',
    simulatorDomainLabel: 'Select a domain or an out-of-corpus query',
    simulatorUnverifiedOption: '❓ Query not yet documented in the Mas corpus (Humility check)',
    simulatorPromptLabel: 'Villager question via WhatsApp',
    simulatorSendButton: 'Send via Hermes WhatsApp Bridge',
    simulatorResponseHeading: 'IAIA MarIA’s reply (simulation)',
    simulatorSourcesLabel: 'Sources:',
    simulatorStatusVerified: 'VERIFIED WITH PRIMARY SOURCES',
    simulatorStatusHumility: 'ACTIVE HONESTY · PENDING DOCUMENTATION WITH THE VILLAGE',
    unverifiedSampleQuestion: 'On what exact day was the first windmill inaugurated in the year 1412?',
    unverifiedHonestReply:
      'Oh my dear, I do not yet have verified records or minutes for that in the Node 0 archive. I am logging your question with the [DISCOVERY] tag so we can ask our elders and check the municipal archive: IAIA MarIA never invents unverified facts.',
    unverifiedSourcesNote: 'No verified source yet.',
    domains: [
      {
        id: 'pou-de-neu-rentonar',
        num: '01',
        title: 'El Rentonar Snow Well and the Valencian Ice Trade',
        sources:
          'Josep Maria Segura Martí, «El pou de la neu del Rentonar» (socdepoble.net, WP 3656), with the plan and corpus of the Mas rural anatomy; Manuel Rico García (1880) for the arrobas; Eugenio Monesma documentary on snow wells.',
        summary:
          'Dimensions from the Mas rural anatomy: at 1,160 m altitude; 13.75 m deep from the upper windows; inner diameter 9.80 m according to the article (9.75 m on the plan); estimated capacity 1,030 m³ according to the article (over 1,100 m³ according to the corpus) and 20,000 arrobas according to Manuel Rico García (1880); 3 upper windows (north, west and east), of which only the west one is open, 1.55 × 1.70 m in a 1.50 m thick wall; south access tunnel 9.10 m long, 10 m above the floor; east drainage gallery about 29 m long, 0.50 × 0.70 m according to the article (24 + 5 m on the plan); 4 springers of 2 crossed arches. Built between the 17th and 18th centuries; documented from 1724 to 1880.',
        sampleQuestion: 'What are the dimensions of the Rentonar Snow Well and who built it?',
        sampleReply:
          'According to Josep Maria Segura Martí’s article, the Rentonar Snow Well has a 9.80 m inner diameter (the plan says 9.75) and is 13.75 m deep from the upper windows, with a 1.50 m thick wall. It has 3 upper windows (north, west and east), but only the west one is open, 1.55 × 1.70 m; a 9.10 m south access tunnel, 10 m above the floor; and an east drainage gallery about 29 m long. The article estimates 1,030 m³, and Manuel Rico García (1880) gave it 20,000 arrobas. Who built it is not recorded: it was built between the 17th and 18th centuries, and the archives mention it from 1724 to 1880.',
      },
      {
        id: 'oli-oliva-la-torre',
        num: '02',
        title: 'La Torre Extra Virgin Olive Oil in 7 Formats',
        sources:
          'Sheets of the 7 official Oli de La Torre products (olidelatorre.com), published in the Sóc de Poble Market.',
        summary:
          'Alfafarenca and Mançanella varieties, from traditional mountain olive trees of the district. Superior category oil, obtained solely by mechanical means from the first cold extraction. 7 formats: 250 ml, 500 ml, 2 l and 5 l, and boxes of 12 × 500 ml, 6 × 2 l and 3 × 5 l.',
        sampleQuestion: 'Which olive varieties produce La Torre oil and in what formats is it bottled?',
        sampleReply:
          'La Torre oil is made from Alfafarenca and Mançanella olives, from traditional mountain olive trees of our district, solely by mechanical means from the first cold extraction. In the Sóc de Poble Market you will find it in 7 formats: 250 ml, 500 ml, 2 l and 5 l, and boxes of 12 × 500 ml, 6 × 2 l and 3 × 5 l.',
      },
      {
        id: 'patrimoni-anatomia-herbari-llavors-arbres-rutes',
        num: '03',
        title: 'Rural Anatomy, Herbarium, Seed Bank, 19 Emblematic and Monumental Trees and Trails',
        sources:
          'Mas rural anatomy (9 structures), La Torre herbarium of 117 entries, 3 published catalogues of traditional varieties, Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes (2017) and «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021).',
        summary:
          'The 5 heritage pages: the anatomy of 9 rural structures (from the snow well and the oil mill to the flour mills, the oven and the noria), a herbarium of 117 entries (with thyme, rosemary, sage or pebrella), a lookup of 3 catalogues of traditional seed varieties, the 19 trees of the emblematic and monumental catalogue (2 listed as monumental) and 6 village itineraries.',
        sampleQuestion: 'Which monumental trees and trails can I explore in La Torre?',
        sampleReply:
          'You have the 19 trees of the Catàleg d’Arbres Emblemàtics i Monumentals de La Torre (2017), 2 of which are listed as monumental, and the 6 itineraries of «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021). There is also the herbarium of 117 entries, with plants such as pebrella, sage, ironwort (rabet de gat) or thyme, and a lookup of 3 catalogues of traditional seed varieties.',
      },
      {
        id: 'calendari-agricola-i-receptari-mas',
        num: '04',
        title: 'Agricultural Calendar and Mas Recipe Book (in preparation)',
        sources:
          'Seasonal calendar of La Nevera de Casa (indicative and pending review) and the starter recipe set of La Nevera.',
        summary:
          'Not yet verified: the seasonal calendar is indicative and only covers harvest months. Seedbed and transplanting dates do not have any source yet.',
        sampleQuestion: 'When are tomato seedbeds and terrace transplants done in the mountain?',
        sampleReply:
          'I do not have anything verified on that yet: the Mas seasonal calendar is indicative and only covers harvests, and I have not checked tomato seedbed and transplanting dates. I am logging it with the [DISCOVERY] tag to ask the village farmers.',
      },
      {
        id: 'genealogia-i-historia-la-torre',
        num: '05',
        title: 'Documented History of La Torre de les Maçanes',
        sources:
          '«Itineraris per La Torre de les Maçanes» (Gent de La Torre · El Diari de La Torre de les Maçanes, 2021 revision).',
        summary:
          'The itineraries document the Church of Santa Anna and the old quarter, Casa Alta (the building that gives the village its name and identity, with a museum) and Foia de Cortès, a fortified farmhouse. Genealogy and lineages do not have any verified corpus yet.',
        sampleQuestion: 'What is the historical origin of Casa Alta in La Torre de les Maçanes?',
        sampleReply:
          'According to «Itineraris per La Torre de les Maçanes» (2021), Casa Alta, on Carrer del Castell, is the village’s most emblematic building, the one that gives it its name and identity, and it houses a museum. I do not have any verified source yet on when it was built: I am logging it with the [DISCOVERY] tag to check with the archive and our elders.',
      },
      {
        id: 'batec-de-vida-i-emergencies-offline',
        num: '06',
        title: 'Heartbeat of Life (IDEA-123/124, in preparation)',
        sources: 'Proposal IDEA-123/124, pending integration.',
        summary:
          'Not active yet: it is a proposed support service for older people living alone. Right now it does not alert anyone.',
        sampleQuestion: 'How does the 6-hour Heartbeat of Life alert work for elders?',
        sampleReply:
          'Heartbeat of Life is not active yet: it is an idea in preparation and right now it does not alert anyone. If you are worried about someone, do not wait for an automatic alert: call them or visit them, and in an emergency call 112.',
      },
      {
        id: 'arquitectura-fediversity-node0',
        num: '07',
        title: 'Architecture: Sóc de Poble, Node 0 and the Fediversity Plan',
        sources:
          'Fediversity, «Implementation and planning» (architecture PDF, July 2025): actors on p. 1, technologies on pp. 2–3 and 7, portability on p. 5.',
        summary:
          'According to the Fediversity architecture PDF: 5 actors (Maintainers, Developers, Hosting provider, Operator and User; p. 1); a NixOS configuration module deployed with NixOps4 or OpenTofu on a NixOS machine or a Proxmox hypervisor, with Garage as S3-compatible object storage (pp. 2–3) and CI/CD with Forgejo (p. 7); and 3 steps to move applications to another host: domain registration, deployment and data copy (p. 5).',
        sampleQuestion: 'How does Sóc de Poble integrate with Fediversity and Node 0?',
        sampleReply:
          'Fediversity describes 5 actors (Maintainers, Developers, Hosting provider, Operator and User) and 3 steps to move applications to another host: update the domain’s DNS records, redeploy them with the reproducible configuration module and copy their data with back-up/restore scripts (architecture PDF, July 2025, pp. 1 and 5). I have not verified that Sóc de Poble’s Node 0 already works this way, and I do not claim it.',
      },
    ],
  },
  eu: {
    kicker: 'IDEA-171 · WhatsApp-eko 2. Mugikor Zenbaki Esklusiboa · Hermes Gateway + 0 Nodoa',
    title: 'IAIAren WhatsAppa · Herriko Jakintzaren Mapa Zintzoa',
    subtitle:
      '0 Nodorako pentsatua (iaia:latest + hermes3:8b + SQLite FTS5). Aipatutako iturriekin bakarrik erantzuten du eta ez du inoiz asmatzen oraindik ez dakiena.',
    architectureHeading: 'IAIAren WhatsApp Zubiaren Arkitektura (Hermes + 0 Nodoa + Fediversity)',
    architectureSummary:
      'IAIA MarIAren bigarren mugikor-zenbaki esklusiboa Hermes WhatsApp Gateway-rekin ibiltzeko pentsatua dago, 0 Nodoko Mac mini M4-arekin sare lokalean. Zubiak irakurri ahal izan dituen Landa Kulturako corpus-zatiekin bakarrik erantzuten du; bat ere irakurtzen ez badu, IAIAk apaltasunez erantzuten du. Egoera: 0 Nodoko hedapena oraindik ez dago egiaztatuta.',
    readoutGatewayLabel: 'Zubia',
    readoutNodeLabel: 'Nodoa',
    readoutNodeValue: '0 Nodoa · La Torre de les Maçanes (sare lokala)',
    readoutModelsLabel: 'Ereduak',
    readoutMemoryLabel: 'Memoria eta corpusa',
    humilityPledgeTitle: 'Apaltasun Epistemologikoaren Konpromisoa («Kerik Ez eta Asmakizunik Ez»)',
    humilityPledgeBody:
      '«Bihotza, Mas-en liburu, plano eta ahozko oroimen egiaztatuekin dokumentatuta daukadana milimetroraino azalduko dizut; baina 0 Nodoan oraindik egiaztatu gabe dagoenaz, nahiago dut isilik egon ipuin bat asmatzea baino. Herri osoarekin batera goaz jakintzaren saskia pixkanaka betetzen!»',
    domainsHeading: 'IAIA MarIAren Jakintzaren 7 Eremuak: 5 Aipatutako Iturriekin eta 2 Prestatzen',
    simulatorHeading: 'IAIAren WhatsApparen Simulagailua',
    simulatorDomainLabel: 'Aukeratu eremu bat edo corpusetik kanpoko kontsulta bat',
    simulatorUnverifiedOption: '❓ Mas-eko corpusean oraindik dokumentatu gabeko kontsulta (Apaltasun proba)',
    simulatorPromptLabel: 'Bizilagunaren galdera WhatsApp bidez',
    simulatorSendButton: 'Bidali Hermes WhatsApp Zubiaren bidez',
    simulatorResponseHeading: 'IAIA MarIAren erantzuna (simulazioa)',
    simulatorSourcesLabel: 'Iturriak:',
    simulatorStatusVerified: 'LEHEN MAILAKO ITURRIEKIN EGIAZTATUA',
    simulatorStatusHumility: 'ZINTZOTASUN AKTIBOA · HERRIAREKIN DOKUMENTATZEKE',
    unverifiedSampleQuestion: 'Zein egun zehatzetan inauguratu zen 1412ko lehen haize-errota?',
    unverifiedHonestReply:
      'Ai, ene, horri buruz oraindik ez daukat paperik ezta akta egiaztaturik ere 0 Nodoko artxiboan. Zure galdera [DISCOVERY] etiketarekin gordeko dut adinekoekin eta udal artxiboan kontsultatzeko, IAIA MarIAk ez baitu inoiz egiaztatu gabeko daturik asmatzen.',
    unverifiedSourcesNote: 'Oraindik ez dago iturri egiaztaturik.',
    domains: [
      {
        id: 'pou-de-neu-rentonar',
        num: '01',
        title: 'Rentonarko Elur-Putzua eta Hotzaren Valentziako Merkataritza',
        sources:
          'Josep Maria Segura Martí, «El pou de la neu del Rentonar» (socdepoble.net, WP 3656), Mas-eko landa-anatomiaren planoarekin eta corpusarekin; Manuel Rico García (1880) arrobetarako; Eugenio Monesmaren dokumentala elur-putzuei buruz.',
        summary:
          'Mas-eko landa-anatomiaren neurriak: 1.160 m-ko altueran; 13,75 m-ko sakonera goiko leihoetatik; 9,80 m-ko barne-diametroa artikuluaren arabera (9,75 m planoan); 1.030 m³-ko edukiera artikuluaren arabera (1.100 m³ baino gehiago corpusaren arabera) eta 20.000 arroba Manuel Rico Garcíaren arabera (1880); goiko 3 leiho (iparraldea, mendebaldea eta ekialdea), eta mendebaldekoa bakarrik dago irekita, 1,55 × 1,70 m-koa, 1,50 m-ko lodierako horman; hegoaldeko sarbide-tunela, 9,10 m-koa, hondotik 10 m-ra; ekialdeko drainatze-galeria, 29 m ingurukoa, 0,50 × 0,70 m-koa artikuluaren arabera (24 + 5 m planoan); gurutzatutako 2 arkuren 4 oinarri. XVII. eta XVIII. mendeen artean eraikia; 1724tik 1880ra dokumentatua.',
        sampleQuestion: 'Zein neurri ditu Rentonarko Elur-Putzuak eta nork eraiki zuen?',
        sampleReply:
          'Josep Maria Segura Martíren artikuluaren arabera, Rentonarko Elur-Putzuak 9,80 m-ko barne-diametroa du (planoak 9,75 dio) eta 13,75 m-ko sakonera goiko leihoetatik, 1,50 m-ko lodierako hormarekin. Goiko 3 leiho ditu (iparraldea, mendebaldea eta ekialdea), baina mendebaldekoa bakarrik dago irekita, 1,55 × 1,70 m-koa; hegoaldean 9,10 m-ko sarbide-tunel bat, hondotik 10 m-ra, eta ekialdean 29 m inguruko drainatze-galeria bat. Artikuluak 1.030 m³ kalkulatzen ditu, eta Manuel Rico Garcíak (1880) 20.000 arroba ematen zizkion. Nork eraiki zuen ez dago jasota: XVII. eta XVIII. mendeen artean eraiki zen, eta artxiboek 1724tik 1880ra aipatzen dute.',
      },
      {
        id: 'oli-oliva-la-torre',
        num: '02',
        title: 'La Torreko Oliba Olio Birjina Estra 7 Formatutan',
        sources:
          'Oli de La Torreren 7 produktu ofizialen fitxak (olidelatorre.com), Sóc de Poble Merkatuan argitaratuak.',
        summary:
          'Alfafarenca eta Mançanella barietateak, eskualdeko mendiko olibondo tradizionaletakoak. Kategoria goreneko olioa, prozedura mekanikoen bidez bakarrik eta hotzean egindako lehen erauzketatik lortua. 7 formatu: 250 ml, 500 ml, 2 l eta 5 l, eta 12 × 500 ml, 6 × 2 l eta 3 × 5 l-ko kutxak.',
        sampleQuestion: 'Zein oliba-barietatek egiten dute La Torreko olioa eta zein formatutan ontziratzen da?',
        sampleReply:
          'La Torreko olioa Alfafarenca eta Mançanella olibekin egiten da, gure eskualdeko mendiko olibondo tradizionaletatik, prozedura mekanikoen bidez bakarrik eta hotzean egindako lehen erauzketatik. Sóc de Poble Merkatuan 7 formatutan duzu: 250 ml, 500 ml, 2 l eta 5 l, eta 12 × 500 ml, 6 × 2 l eta 3 × 5 l-ko kutxak.',
      },
      {
        id: 'patrimoni-anatomia-herbari-llavors-arbres-rutes',
        num: '03',
        title: 'Landa Anatomia, Herbarioa, Hazi Bankua, 19 Zuhaitz Enblematiko eta Monumental eta Ibilbideak',
        sources:
          'Mas-eko landa-anatomia (9 eraikin), La Torreko 117 fitxako herbarioa, barietate tradizionalen 3 katalogo argitaratu, Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes (2017) eta «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021).',
        summary:
          'Ondarearen 5 orriak: 9 landa-eraikinen anatomia (elur-putzutik eta olio-errotatik errota, labe eta noriaraino), 117 fitxako herbarioa (ezkaia, erromeroa, salbia edo pebrella barne), hazi-barietate tradizionalen 3 katalogoren kontsulta, zuhaitz enblematiko eta monumentalen katalogoko 19 zuhaitzak (2 monumental gisa agertzen dira) eta herriko 6 ibilbide.',
        sampleQuestion: 'Zein zuhaitz eta ibilbide kontsulta ditzaket La Torreko ondarean?',
        sampleReply:
          'La Torreko Zuhaitz Enblematiko eta Monumentalen Katalogoko (2017) 19 zuhaitzak dituzu, horietatik 2 monumental gisa agertzen dira, eta «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021) argitalpeneko 6 ibilbideak. Badago 117 fitxako herbarioa ere, pebrella, salbia, rabet de gat edo ezkaia bezalako landareekin, eta hazi-barietate tradizionalen 3 katalogoren kontsulta.',
      },
      {
        id: 'calendari-agricola-i-receptari-mas',
        num: '04',
        title: 'Nekazaritza Egutegia eta Mas-eko Errezeta Liburua (prestatzen)',
        sources:
          'La Nevera de Casaren sasoiko egutegia (orientagarria eta berrikusteke) eta La Neveraren hasierako errezetak.',
        summary:
          'Oraindik egiaztatu gabe: sasoiko egutegia orientagarria da eta uzta-hilabeteak bakarrik ematen ditu. Hazitegiko eta landaketako datek ez dute oraindik iturririk.',
        sampleQuestion: 'Noiz egiten dira tomatearen hazitegia eta landaketa mendian?',
        sampleReply:
          'Horri buruz ez daukat ezer egiaztaturik oraindik: Mas-eko sasoiko egutegia orientagarria da eta uztei buruz bakarrik ari da, eta tomatearen hazitegiko eta landaketako datak ez ditut egiaztatuta. [DISCOVERY] etiketarekin gordeko dut herriko nekazariei galdetzeko.',
      },
      {
        id: 'genealogia-i-historia-la-torre',
        num: '05',
        title: 'La Torre de les Maçanesko Historia Dokumentatua',
        sources:
          '«Itineraris per La Torre de les Maçanes» (Gent de La Torre · El Diari de La Torre de les Maçanes, 2021eko berrikuspena).',
        summary:
          'Ibilbideek Santa Anna eliza eta alde zaharra, Casa Alta (herriari izena eta nortasuna ematen dion eraikina, museoarekin) eta Foia de Cortès baserri gotortua dokumentatzen dituzte. Genealogiak eta leinuek ez dute oraindik corpus egiaztaturik.',
        sampleQuestion: 'Zein jatorri du La Torre de les Maçanesko Casa Altak?',
        sampleReply:
          '«Itineraris per La Torre de les Maçanes» (2021) argitalpenaren arabera, Casa Alta, Carrer del Castell kalean, herriko eraikinik enblematikoena da, herriari izena eta nortasuna ematen diona, eta museo bat dauka. Noiz eraiki zen ez daukat oraindik iturri egiaztaturik: [DISCOVERY] etiketarekin gordeko dut artxiboan eta adinekoekin kontsultatzeko.',
      },
      {
        id: 'batec-de-vida-i-emergencies-offline',
        num: '06',
        title: 'Bizi Taupada (IDEA-123/124, prestatzen)',
        sources: 'IDEA-123/124 proposamena, integratzeke.',
        summary:
          'Oraindik ez dago martxan: bakarrik bizi diren adinekoei laguntzeko proposamen bat da. Oraingoz ez dio inori abisatzen.',
        sampleQuestion: 'Nola funtzionatzen du adinekoentzako Bizi Taupadaren 6 orduko alertak?',
        sampleReply:
          'Bizi Taupada oraindik ez dago martxan: prestatzen ari den ideia bat da, eta oraingoz ez dio inori abisatzen. Norbaitez kezkatuta bazaude, ez itxaron abisu automatikorik: deitu iezaiozu edo joan haren etxera, eta larrialdi bat bada, deitu 112ra.',
      },
      {
        id: 'arquitectura-fediversity-node0',
        num: '07',
        title: 'Arkitektura: Sóc de Poble, 0 Nodoa eta Fediversityren Plana',
        sources:
          'Fediversity, «Implementation and planning» (arkitektura-PDFa, 2025eko uztaila): eragileak 1. orrialdean, teknologiak 2.–3. eta 7. orrialdeetan, eramangarritasuna 5. orrialdean.',
        summary:
          'Fediversityren arkitektura-PDFaren arabera: 5 eragile (Maintainers, Developers, Hosting provider, Operator eta User; 1. or.); NixOS konfigurazio-modulu bat, NixOps4 edo OpenTofu bidez hedatzen dena NixOS makina batean edo Proxmox hipervisore batean, Garage S3-rekin bateragarria den objektu-biltegi gisa (2.–3. or.) eta CI/CD Forgejorekin (7. or.); eta aplikazioak beste ostalari batera eramateko 3 urrats: domeinuaren erregistroa, hedapena eta datuen kopia (5. or.).',
        sampleQuestion: 'Nola konektatzen da Sóc de Poble Fediversity eta 0 Nodoarekin?',
        sampleReply:
          'Fediversityk 5 eragile deskribatzen ditu (Maintainers, Developers, Hosting provider, Operator eta User) eta aplikazioak beste ostalari batera eramateko 3 urrats: domeinuaren DNSa eguneratu, konfigurazio-modulu erreproduzigarriarekin berriro hedatu eta datuak kopia- eta leheneratze-scriptekin kopiatu (2025eko uztaileko arkitektura-PDFa, 1. eta 5. or.). Sóc de Pobleren 0 Nodoak dagoeneko horrela funtzionatzen duenik ez daukat egiaztatuta, eta ez dut baieztatzen.',
      },
    ],
  },
  gl: {
    kicker: 'IDEA-171 · 2º Número Exclusivo de Móbil en WhatsApp · Hermes Gateway + Nodo 0',
    title: 'O WhatsApp da IAIA · Mapa Honesto do Saber de Aldea',
    subtitle:
      'Pensada para o Nodo 0 (iaia:latest + hermes3:8b + SQLite FTS5). Responde só con fontes citadas e nunca inventa o que aínda non sabe.',
    architectureHeading: 'Arquitectura da Ponte do WhatsApp da IAIA (Hermes + Nodo 0 + Fediversity)',
    architectureSummary:
      'O segundo número de móbil exclusivo da IAIA MarIA está pensado para funcionar con Hermes WhatsApp Gateway, en rede local co Mac mini M4 do Nodo 0. A ponte só responde cos fragmentos do corpus de Cultura Rural que puido ler; se non le ningún, a IAIA responde con humildade. Estado: o despregamento no Nodo 0 aínda non está verificado.',
    readoutGatewayLabel: 'Ponte',
    readoutNodeLabel: 'Nodo',
    readoutNodeValue: 'Nodo 0 · La Torre de les Maçanes (rede local)',
    readoutModelsLabel: 'Modelos',
    readoutMemoryLabel: 'Memoria e corpus',
    humilityPledgeTitle: 'Compromiso de Humildade Epistemolóxica («Cero Fume e Cero Invención»)',
    humilityPledgeBody:
      '«Corazón, do que teño documentado no Mas con libros, planos e memoria oral verificada explícocho ao milímetro; pero do que aínda non temos contrastado no Nodo 0, antes calo que inventar un conto. Imos ampliando o cabazo do saber pouco a pouco con toda a aldea!»',
    domainsHeading: 'Os 7 Dominios do Saber da IAIA MarIA: 5 con Fontes Citadas e 2 en Preparación',
    simulatorHeading: 'Simulador do WhatsApp da IAIA',
    simulatorDomainLabel: 'Escolle un dominio ou unha consulta fóra de corpus',
    simulatorUnverifiedOption: '❓ Consulta aínda non documentada no corpus do Mas (Proba de humildade)',
    simulatorPromptLabel: 'Pregunta do veciño ou veciña por WhatsApp',
    simulatorSendButton: 'Enviar pola Ponte Hermes WhatsApp',
    simulatorResponseHeading: 'Resposta da IAIA MarIA (simulación)',
    simulatorSourcesLabel: 'Fontes:',
    simulatorStatusVerified: 'VERIFICADO CON FONTES PRIMARIAS',
    simulatorStatusHumility: 'HONESTIDADE ACTIVA · PENDENTE DE DOCUMENTAR COA ALDEA',
    unverifiedSampleQuestion: 'Que día exacto se inaugurou o primeiro muíño de vento do ano 1412?',
    unverifiedHonestReply:
      'Ai, meu rei, diso aínda non teño os papeis nin a acta verificada no arquivo do Nodo 0. Apúntoche a pregunta coa etiqueta [DISCOVERY] para consultalo cos maiores e no arquivo municipal, porque a IAIA MarIA nunca inventa ningún dato que non estea contrastado.',
    unverifiedSourcesNote: 'Aínda ningunha fonte verificada.',
    domains: [
      {
        id: 'pou-de-neu-rentonar',
        num: '01',
        title: 'Pozo da Neve do Rentonar e o Comercio Valenciano do Frío',
        sources:
          'Josep Maria Segura Martí, «El pou de la neu del Rentonar» (socdepoble.net, WP 3656), co plano e o corpus da anatomía rural do Mas; Manuel Rico García (1880) para as arrobas; documental de Eugenio Monesma sobre os pozos de neve.',
        summary:
          'Cotas da anatomía rural do Mas: a 1.160 m de altitude; 13,75 m de profundidade dende as fiestras superiores; diámetro interior de 9,80 m segundo o artigo (9,75 m no plano); capacidade estimada de 1.030 m³ segundo o artigo (máis de 1.100 m³ segundo o corpus) e 20.000 arrobas segundo Manuel Rico García (1880); 3 fiestras superiores (norte, oeste e leste), das que só está aberta a do oeste, de 1,55 × 1,70 m nun muro de 1,50 m de grosor; túnel de acceso sur de 9,10 m, a 10 m sobre o fondo; galería de drenaxe ao leste duns 29 m, de 0,50 × 0,70 m segundo o artigo (24 + 5 m no plano); 4 estribos de 2 arcos cruzados. Construído entre os séculos XVII e XVIII; documentado de 1724 a 1880.',
        sampleQuestion: 'Que medidas ten o Pozo da Neve do Rentonar e quen o construíu?',
        sampleReply:
          'Segundo o artigo de Josep Maria Segura Martí, o Pozo da Neve do Rentonar mide 9,80 m de diámetro interior (o plano di 9,75) e 13,75 m de profundidade dende as fiestras superiores, cun muro de 1,50 m de grosor. Ten 3 fiestras superiores (norte, oeste e leste), pero só está aberta a do oeste, de 1,55 × 1,70 m; un túnel de acceso ao sur de 9,10 m, a 10 m sobre o fondo, e unha galería de drenaxe ao leste duns 29 m. O artigo calcúlalle 1.030 m³, e Manuel Rico García (1880) dáballe 20.000 arrobas. Quen o ergueu non consta: construíuse entre os séculos XVII e XVIII, e os arquivos falan del de 1724 a 1880.',
      },
      {
        id: 'oli-oliva-la-torre',
        num: '02',
        title: 'Aceite de Oliva Virxe Extra de La Torre en 7 Formatos',
        sources:
          'Fichas dos 7 produtos oficiais de Oli de La Torre (olidelatorre.com), publicadas no Mercado de Sóc de Poble.',
        summary:
          'Variedades Alfafarenca e Mançanella, de oliveiras tradicionais de montaña da comarca. Aceite de categoría superior, obtido só por procedementos mecánicos e da primeira extracción en frío. 7 formatos: 250 ml, 500 ml, 2 l e 5 l, e caixas de 12 de 500 ml, de 6 de 2 l e de 3 de 5 l.',
        sampleQuestion: 'Que variedades de oliva fan o aceite de La Torre e en que formatos se envasa?',
        sampleReply:
          'O aceite de La Torre faise con olivas Alfafarenca e Mançanella, de oliveiras tradicionais de montaña da nosa comarca, só por procedementos mecánicos e da primeira extracción en frío. No Mercado de Sóc de Poble tes 7 formatos: 250 ml, 500 ml, 2 l e 5 l, e caixas de 12 de 500 ml, de 6 de 2 l e de 3 de 5 l.',
      },
      {
        id: 'patrimoni-anatomia-herbari-llavors-arbres-rutes',
        num: '03',
        title: 'Anatomía Rural, Herbario, Banco de Sementes, 19 Árbores Emblemáticas e Monumentais e Rutas',
        sources:
          'Anatomía rural do Mas (9 construcións), herbario de 117 fichas de La Torre, 3 catálogos publicados de variedades tradicionais, Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes (2017) e «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021).',
        summary:
          'As 5 páxinas de patrimonio: a anatomía de 9 construcións rurais (do pozo de neve e a almazara aos muíños, o forno e a nora), un herbario de 117 fichas (co tomiño, o romeu, a salvia ou a pebrella), a consulta de 3 catálogos de variedades tradicionais de sementes, as 19 árbores do catálogo de emblemáticas e monumentais (2 constan como monumentais) e 6 itinerarios pola vila.',
        sampleQuestion: 'Que árbores e rutas podo consultar no patrimonio de La Torre?',
        sampleReply:
          'Tes as 19 árbores do Catàleg d’Arbres Emblemàtics i Monumentals de La Torre (2017), das que 2 constan como monumentais, e os 6 itinerarios de «Itineraris per La Torre de les Maçanes» (Gent de La Torre, 2021). Tamén está o herbario de 117 fichas, con plantas como a pebrella, a salvia, o rabet de gat ou o tomiño, e a consulta de 3 catálogos de variedades tradicionais de sementes.',
      },
      {
        id: 'calendari-agricola-i-receptari-mas',
        num: '04',
        title: 'Calendario Agrícola e Receitario do Mas (en preparación)',
        sources:
          'Calendario de tempada de La Nevera de Casa (orientativo e pendente de revisión) e receitario inicial de La Nevera.',
        summary:
          'Aínda non verificado: o calendario de tempada é orientativo e só fala de meses de colleita. As datas de sementeiro e de transplante aínda non teñen ningunha fonte.',
        sampleQuestion: 'Cando se fai o sementeiro e o transplante do tomate na montaña?',
        sampleReply:
          'Diso aínda non teño nada verificado: o calendario de tempada do Mas é orientativo e só fala de colleitas, e as datas de sementeiro e de transplante do tomate non as teño contrastadas. Apúntocho coa etiqueta [DISCOVERY] para preguntarllo aos labregos da vila.',
      },
      {
        id: 'genealogia-i-historia-la-torre',
        num: '05',
        title: 'Historia Documentada de La Torre de les Maçanes',
        sources:
          '«Itineraris per La Torre de les Maçanes» (Gent de La Torre · El Diari de La Torre de les Maçanes, revisión de 2021).',
        summary:
          'Os itinerarios documentan a Igrexa de Santa Anna e o casco vello, a Casa Alta (o edificio que dá nome e identidade á vila, con museo) e a Foia de Cortès, unha casa de labranza fortificada. A xenealoxía e as liñaxes aínda non teñen ningún corpus verificado.',
        sampleQuestion: 'Que orixe ten a Casa Alta de La Torre de les Maçanes?',
        sampleReply:
          'Segundo os «Itineraris per La Torre de les Maçanes» (2021), a Casa Alta, na rúa do Castell, é o edificio máis emblemático da vila, o que lle dá nome e identidade, e ten un museo. De cando se construíu aínda non teño ningunha fonte verificada: apúntocho coa etiqueta [DISCOVERY] para consultalo co arquivo e cos maiores.',
      },
      {
        id: 'batec-de-vida-i-emergencies-offline',
        num: '06',
        title: 'Latexo de Vida (IDEA-123/124, en preparación)',
        sources: 'Proposta das IDEA-123/124, pendente de integración.',
        summary:
          'Aínda non activo: é unha proposta de acompañamento para persoas maiores que viven soas. Agora mesmo non avisa a ninguén.',
        sampleQuestion: 'Como funciona a alerta de 6 horas do Latexo de Vida para maiores?',
        sampleReply:
          'O Latexo de Vida aínda non está activo: é unha idea en preparación e agora mesmo non avisa a ninguén. Se che preocupa alguén, non agardes ningún aviso automático: chámao ou pasa pola súa casa, e se é urxente chama ao 112.',
      },
      {
        id: 'arquitectura-fediversity-node0',
        num: '07',
        title: 'Arquitectura: Sóc de Poble, o Nodo 0 e o Plan de Fediversity',
        sources:
          'Fediversity, «Implementation and planning» (PDF de arquitectura, xullo de 2025): actores na p. 1, tecnoloxías nas pp. 2–3 e 7, portabilidade na p. 5.',
        summary:
          'Segundo o PDF de arquitectura de Fediversity: 5 actores (Maintainers, Developers, Hosting provider, Operator e User; p. 1); un módulo de configuración NixOS que se desprega con NixOps4 ou OpenTofu nunha máquina NixOS ou nun hipervisor Proxmox, con Garage como almacenamento de obxectos compatible con S3 (pp. 2–3) e CI/CD con Forgejo (p. 7); e 3 pasos para levar as aplicacións a outro aloxamento: rexistro do dominio, despregamento e copia dos datos (p. 5).',
        sampleQuestion: 'Como se conecta Sóc de Poble con Fediversity e o Nodo 0?',
        sampleReply:
          'Fediversity describe 5 actores (Maintainers, Developers, Hosting provider, Operator e User) e 3 pasos para levar as aplicacións a outro aloxamento: actualizar o DNS do dominio, volver despregalas co módulo de configuración reproducible e copiar os seus datos con scripts de copia e restauración (PDF de arquitectura de xullo de 2025, pp. 1 e 5). Que o Nodo 0 de Sóc de Poble xa funcione así non o teño verificado, e non o afirmo.',
      },
    ],
  },
});

const plegaPregunta = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:«»"'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * Simula la resposta honesta de la IAIA MarIA al pont WhatsApp Hermes + Node 0.
 * Només hi ha resposta verificada per a la pregunta de mostra d'un domini amb fonts citades.
 * Una pregunta escrita a mà, un domini en preparació o la consulta fora de corpus reben
 * la resposta d'humilitat epistemològica amb l'etiqueta d'auto-aprenentatge Hermes `[DISCOVERY]`.
 */
export function simulaRespostaHonestaIaiaWhatsapp({
  dominiId = 'pou-de-neu-rentonar',
  idioma = 'ca',
  pregunta = '',
} = {}) {
  const copy = IAIA_WHATSAPP_MAPA_SABER_TEXTS[idioma] || IAIA_WHATSAPP_MAPA_SABER_TEXTS.ca;
  const domain = copy.domains.find((d) => d.id === dominiId) || null;
  const preguntaNeta = String(pregunta ?? '').trim();
  const preguntaPropia = Boolean(domain && preguntaNeta) && plegaPregunta(preguntaNeta) !== plegaPregunta(domain.sampleQuestion);

  if (!domain || preguntaPropia) {
    return {
      verificat: false,
      dominiId: 'unverified',
      model: IAIA_WHATSAPP_NODE0_ARCHITECTURE.primaryModel,
      statusBadge: copy.simulatorStatusHumility,
      trajectoryTag: '[DISCOVERY]',
      preguntaEfectiva: preguntaNeta || copy.unverifiedSampleQuestion,
      resposta: copy.unverifiedHonestReply,
      fonts: copy.unverifiedSourcesNote,
    };
  }

  if (IAIA_SABER_DOMAINS_EN_PREPARACIO.includes(domain.id)) {
    return {
      verificat: false,
      dominiId: domain.id,
      model: IAIA_WHATSAPP_NODE0_ARCHITECTURE.primaryModel,
      statusBadge: copy.simulatorStatusHumility,
      trajectoryTag: '[DISCOVERY]',
      preguntaEfectiva: domain.sampleQuestion,
      resposta: domain.sampleReply,
      fonts: domain.sources,
    };
  }

  return {
    verificat: true,
    dominiId: domain.id,
    model: IAIA_WHATSAPP_NODE0_ARCHITECTURE.primaryModel,
    statusBadge: copy.simulatorStatusVerified,
    trajectoryTag: '[SEQUENCE]',
    preguntaEfectiva: domain.sampleQuestion,
    resposta: domain.sampleReply,
    fonts: domain.sources,
  };
}
