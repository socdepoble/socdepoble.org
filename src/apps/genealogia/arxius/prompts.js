/**
 * Arbre Genealògic · Prompts Mestres auto-emplenables (P0-114, grup «arxius»).
 *
 * Set plantilles de prompt, en cinc llengües, que la persona copia al seu
 * assistent: les quatre de Pablo Carballo (entrevista, cognom, cerca en
 * arxius i arbre visual), el mur genealògic amb el FAN Club, la
 * transcripció paleogràfica i el Genealogical Proof Standard (GPS).
 *
 * Tractor-promesa: l'app no envia res a cap assistent ni cerca als arxius.
 * Prepara un text pla (cap HTML) que la interfície copia amb
 * navigator.clipboard.writeText.
 *
 * Tot prompt porta, en la llengua demanada: activar la Cerca Web; cap dada
 * sense URL exacta i verificable ([FALTA CONFIRMAR] si no en té); els quatre
 * estats; Cognom ≠ Parentiu; no inventar; la transcripció literal amb
 * [il·legible] i [dubtós: …]; les quatre precisions de data; i els arxius
 * suggerits, amb la seua adreça real o la indicació de verificar-la.
 *
 * RGPD, en dues capes: filtraVius del nucli anonimitza les persones vives, i
 * a més este mòdul calcula el conjunt de vives sobre l'arbre ORIGINAL amb
 * idsVius i només n'escriu l'etiqueta «Persona viva (dades
 * protegides)». Sense `incloureVius: true` (una casella explícita de la
 * vista), cap dada d'una persona viva entra al prompt, i una persona viva no
 * pot ser la persona central. L'entrevista i les notes no hi entren mai:
 * porten noms de vius.
 */
import {
  ETIQUETES_ESTAT,
  IDIOMES,
  detectaContradiccions,
  estatEfectiu,
  etiquetaData,
  filtraVius,
  idsVius,
  intervalAny,
  numeraSosa
} from '../nucli/index.js';
import { ARXIUS, arxiuPerId, arxiusPer } from './cataleg.js';
import { liniaNeta } from './linia.js';

export const MAX_PERSONES_PROMPT = 150;
export const MAX_VINCLES_PROMPT = 300;
const MAX_FONTS_PROMPT = 20;

const NECESSITA_PERSONA = Object.freeze({
  entrevista: false,
  cognom: true,
  'cerca-arxius': true,
  'arbre-visual': false,
  mur: true,
  transcripcio: false,
  gps: true
});

/* ── Les plantilles, en cinc llengües ─────────────────────────────────── */

const PLANTILLES = Object.freeze({
  ca: {
    entrevista: {
      titol: 'Entrevista guiada (una pregunta per torn)',
      descripcio: 'Prompt perquè el teu assistent t’entreviste generació a generació, sense inventar res (mètode de Pablo Carballo, pas 1).',
      objectiu: 'Fes-me una entrevista per a completar l’arbre genealògic de la meua família. Tens a baix el que ja sabem.',
      passos: 'Fes UNA sola pregunta cada vegada i espera la meua resposta. Comença pel malnom de la casa («Els de Ca…») i pel mas, la partida o el poble; després puja per generacions: jo i els meus germans (G4), els pares (G3), els iaios paterns i materns (G2) i els besavis (G1). Per a cada persona, demana el nom, els dos cognoms (també el matern), l’any (encara que siga aproximat), el lloc i l’ofici. Pregunta també pels germans dels iaios, els padrins i els testimonis. Si una resposta és vaga, marca-la [APROXIMAT]; no dones res per fet.',
      format: 'Quan acabem, fes un resum per generacions (G4 → G1) amb l’estat de cada dada.'
    },
    cognom: {
      titol: 'Història i origen del cognom',
      descripcio: 'Prompt per a separar la història documentada d’un cognom de les interpretacions (pas 2).',
      objectiu: 'Explica’m la història, l’origen geogràfic i les migracions del cognom {cognom}, començant per {lloc}.',
      passos: 'Separa nítidament la dada històrica documentada (amb URL) de la interpretació probable. Compartir cognom no fa parents: no em digues que una persona coneguda amb el mateix cognom és avantpassada meua sense una cadena de partides que ho prove.',
      format: 'Dues llistes: «Documentat» (cada dada amb URL i estat) i «Interpretació» (sempre [FALTA CONFIRMAR]).'
    },
    'cerca-arxius': {
      titol: 'Cerca en arxius públics',
      descripcio: 'Prompt per a buscar registres d’una persona difunta en arxius i fonts obertes, amb la URL exacta de cada dada (pas 3).',
      objectiu: 'Busca registres públics de {central} als arxius de la llista i en altres fonts obertes (registres digitalitzats, premsa, esqueles).',
      passos: 'Per a cada troballa, dona l’arxiu, el tipus de registre, la data, el lloc, el text literal rellevant, la URL exacta i la força del vincle amb un dels quatre estats. Fes servir els germans, els padrins, els testimonis i els veïns (el FAN Club) per a triangular. Si un arxiu no té consulta en línia, digues on s’ha de demanar.',
      format: 'Una llista amb una línia per troballa: dada · font · URL · estat.'
    },
    'arbre-visual': {
      titol: 'Arbre visual per generacions',
      descripcio: 'Prompt per a dibuixar en text l’arbre de la família, separant el confirmat de les pistes (pas 4).',
      objectiu: 'Fes un arbre genealògic visual per generacions amb les dades de baix, en text (llista sagnada o esquema), per a compartir-lo amb la família.',
      passos: 'Diferencia nítidament les persones que la família ha confirmat de les pistes pendents de confirmar. Usa la numeració Sosa-Stradonitz (1 la persona arrel, 2n el pare i 2n+1 la mare) quan hi siga. No afiges cap persona que no estiga a la llista i deixa les persones protegides tal com estan.',
      format: 'Un arbre de text amb el número Sosa, el nom, les dates i l’estat de cada persona.'
    },
    mur: {
      titol: 'Mur genealògic i FAN Club',
      descripcio: 'Prompt per a trencar un mur genealògic (brick wall) amb hipòtesis comprovables i branques col·laterals.',
      objectiu: 'M’he encallat amb {central}: no trobe els seus pares o el seu origen. Ajuda’m a trencar este mur.',
      passos: 'Fes una llista d’hipòtesis ordenades per probabilitat i, per a cada una, quin registre concret la provaria o la descartaria i en quin arxiu. Investiga les branques col·laterals (germans, padrins, testimonis i veïns: el FAN Club). Una hipòtesi sense document és [FALTA CONFIRMAR].',
      format: 'Hipòtesis numerades amb: per què, quin registre, quin arxiu, quina URL i quin estat.'
    },
    transcripcio: {
      titol: 'Transcripció paleogràfica',
      descripcio: 'Prompt per a transcriure literalment una partida manuscrita antiga, marcant el que no es llig.',
      objectiu: 'T’adjuntaré la imatge (o el text) d’una partida manuscrita antiga relacionada amb {central}. Transcriu-la i explica-la.',
      passos: 'Primer, la transcripció literal línia a línia, amb l’ortografia i les abreviatures originals, sense modernitzar; marca [il·legible] el que no es llig i [dubtós: …] el que no és segur. Després, a banda, una versió en llengua actual i les dades extretes (persones, rols, dates, llocs, padrins i testimonis), cada una amb el seu estat. No completes res que no es llija.',
      format: 'Tres blocs: transcripció literal · versió actual · dades extretes amb estat.'
    },
    gps: {
      titol: 'Genealogical Proof Standard (GPS)',
      descripcio: 'Prompt per a avaluar una conclusió amb els cinc elements de l’estàndard de prova genealògica.',
      objectiu: 'Avalua el que sabem de {central} segons els cinc elements del Genealogical Proof Standard.',
      passos: '(1) Cerca raonablement exhaustiva: quines fonts falten per consultar. (2) Citació completa de cada font, amb URL. (3) Anàlisi i correlació: font original o derivada, informació primària o secundària, evidència directa o indirecta. (4) Resolució de les contradiccions. (5) Conclusió raonada i escrita.',
      format: 'Cinc apartats numerats i una conclusió final amb un dels quatre estats.'
    }
  },
  es: {
    entrevista: {
      titol: 'Entrevista guiada (una pregunta por turno)',
      descripcio: 'Prompt para que tu asistente te entreviste generación a generación, sin inventar nada (método de Pablo Carballo, paso 1).',
      objectiu: 'Hazme una entrevista para completar el árbol genealógico de mi familia. Abajo tienes lo que ya sabemos.',
      passos: 'Haz UNA sola pregunta cada vez y espera mi respuesta. Empieza por el apodo de la casa («Els de Ca…») y por el mas, la partida o el pueblo; después sube por generaciones: yo y mis hermanos (G4), los padres (G3), los abuelos paternos y maternos (G2) y los bisabuelos (G1). Para cada persona, pregunta el nombre, los dos apellidos (también el materno), el año (aunque sea aproximado), el lugar y el oficio. Pregunta también por los hermanos de los abuelos, los padrinos y los testigos. Si una respuesta es vaga, márcala [APROXIMAT]; no des nada por hecho.',
      format: 'Cuando acabemos, haz un resumen por generaciones (G4 → G1) con el estado de cada dato.'
    },
    cognom: {
      titol: 'Historia y origen del apellido',
      descripcio: 'Prompt para separar la historia documentada de un apellido de las interpretaciones (paso 2).',
      objectiu: 'Explícame la historia, el origen geográfico y las migraciones del apellido {cognom}, empezando por {lloc}.',
      passos: 'Separa con claridad el dato histórico documentado (con URL) de la interpretación probable. Compartir apellido no hace parientes: no me digas que una persona conocida con el mismo apellido es antepasada mía sin una cadena de partidas que lo pruebe.',
      format: 'Dos listas: «Documentado» (cada dato con URL y estado) e «Interpretación» (siempre [FALTA CONFIRMAR]).'
    },
    'cerca-arxius': {
      titol: 'Búsqueda en archivos públicos',
      descripcio: 'Prompt para buscar registros de una persona fallecida en archivos y fuentes abiertas, con la URL exacta de cada dato (paso 3).',
      objectiu: 'Busca registros públicos de {central} en los archivos de la lista y en otras fuentes abiertas (registros digitalizados, prensa, esquelas).',
      passos: 'Para cada hallazgo, da el archivo, el tipo de registro, la fecha, el lugar, el texto literal relevante, la URL exacta y la fuerza del vínculo con uno de los cuatro estados. Usa a los hermanos, los padrinos, los testigos y los vecinos (el FAN Club) para triangular. Si un archivo no tiene consulta en línea, di dónde hay que pedirlo.',
      format: 'Una lista con una línea por hallazgo: dato · fuente · URL · estado.'
    },
    'arbre-visual': {
      titol: 'Árbol visual por generaciones',
      descripcio: 'Prompt para dibujar en texto el árbol de la familia, separando lo confirmado de las pistas (paso 4).',
      objectiu: 'Haz un árbol genealógico visual por generaciones con los datos de abajo, en texto (lista sangrada o esquema), para compartirlo con la familia.',
      passos: 'Diferencia con claridad las personas que la familia ha confirmado de las pistas pendientes de confirmar. Usa la numeración Sosa-Stradonitz (1 la persona raíz, 2n el padre y 2n+1 la madre) cuando esté. No añadas ninguna persona que no esté en la lista y deja las personas protegidas tal como están.',
      format: 'Un árbol de texto con el número Sosa, el nombre, las fechas y el estado de cada persona.'
    },
    mur: {
      titol: 'Muro genealógico y FAN Club',
      descripcio: 'Prompt para romper un muro genealógico (brick wall) con hipótesis comprobables y ramas colaterales.',
      objectiu: 'Me he atascado con {central}: no encuentro sus padres o su origen. Ayúdame a romper este muro.',
      passos: 'Haz una lista de hipótesis ordenadas por probabilidad y, para cada una, qué registro concreto la probaría o la descartaría y en qué archivo. Investiga las ramas colaterales (hermanos, padrinos, testigos y vecinos: el FAN Club). Una hipótesis sin documento es [FALTA CONFIRMAR].',
      format: 'Hipótesis numeradas con: por qué, qué registro, qué archivo, qué URL y qué estado.'
    },
    transcripcio: {
      titol: 'Transcripción paleográfica',
      descripcio: 'Prompt para transcribir literalmente una partida manuscrita antigua, marcando lo que no se lee.',
      objectiu: 'Te adjuntaré la imagen (o el texto) de una partida manuscrita antigua relacionada con {central}. Transcríbela y explícala.',
      passos: 'Primero, la transcripción literal línea a línea, con la ortografía y las abreviaturas originales, sin modernizar; marca [il·legible] lo que no se lee y [dubtós: …] lo que no es seguro. Después, aparte, una versión en lengua actual y los datos extraídos (personas, roles, fechas, lugares, padrinos y testigos), cada uno con su estado. No completes nada que no se lea.',
      format: 'Tres bloques: transcripción literal · versión actual · datos extraídos con estado.'
    },
    gps: {
      titol: 'Genealogical Proof Standard (GPS)',
      descripcio: 'Prompt para evaluar una conclusión con los cinco elementos del estándar de prueba genealógica.',
      objectiu: 'Evalúa lo que sabemos de {central} según los cinco elementos del Genealogical Proof Standard.',
      passos: '(1) Búsqueda razonablemente exhaustiva: qué fuentes faltan por consultar. (2) Cita completa de cada fuente, con URL. (3) Análisis y correlación: fuente original o derivada, información primaria o secundaria, evidencia directa o indirecta. (4) Resolución de las contradicciones. (5) Conclusión razonada y escrita.',
      format: 'Cinco apartados numerados y una conclusión final con uno de los cuatro estados.'
    }
  },
  en: {
    entrevista: {
      titol: 'Guided interview (one question per turn)',
      descripcio: 'Prompt so your assistant interviews you generation by generation, without making anything up (Pablo Carballo’s method, step 1).',
      objectiu: 'Interview me to complete my family tree. Below is what we already know.',
      passos: 'Ask ONE question at a time and wait for my answer. Start with the house nickname (“Els de Ca…”) and the farmstead, rural district or village; then go up by generations: me and my siblings (G4), my parents (G3), my paternal and maternal grandparents (G2) and my great-grandparents (G1). For each person, ask for the first name, both surnames (including the mother’s), the year (even if approximate), the place and the trade. Also ask about the grandparents’ siblings, the godparents and the witnesses. If an answer is vague, mark it [APROXIMAT]; take nothing for granted.',
      format: 'When we finish, write a summary by generation (G4 → G1) with the state of every fact.'
    },
    cognom: {
      titol: 'Surname history and origin',
      descripcio: 'Prompt to separate the documented history of a surname from interpretations (step 2).',
      objectiu: 'Tell me the history, geographic origin and migrations of the surname {cognom}, starting from {lloc}.',
      passos: 'Clearly separate documented historical facts (with URL) from probable interpretation. Sharing a surname does not make people relatives: do not tell me that a well-known person with the same surname is my ancestor without a chain of records that proves it.',
      format: 'Two lists: “Documented” (each fact with URL and state) and “Interpretation” (always [FALTA CONFIRMAR]).'
    },
    'cerca-arxius': {
      titol: 'Public archive search',
      descripcio: 'Prompt to look for records of a deceased person in archives and open sources, with the exact URL of every fact (step 3).',
      objectiu: 'Look for public records of {central} in the archives listed and in other open sources (digitised records, newspapers, death notices).',
      passos: 'For each finding, give the archive, the record type, the date, the place, the relevant literal text, the exact URL and the strength of the link with one of the four states. Use siblings, godparents, witnesses and neighbours (the FAN Club) to triangulate. If an archive has no online search, say where the record must be requested.',
      format: 'A list with one line per finding: fact · source · URL · state.'
    },
    'arbre-visual': {
      titol: 'Visual tree by generation',
      descripcio: 'Prompt to draw the family tree in text, separating what is confirmed from leads (step 4).',
      objectiu: 'Draw a visual family tree by generation with the data below, in text (indented list or outline), to share with the family.',
      passos: 'Clearly distinguish the people the family has confirmed from leads still to be confirmed. Use Sosa-Stradonitz (Ahnentafel) numbering (1 the root person, 2n the father and 2n+1 the mother) where it is given. Do not add anyone who is not on the list, and leave protected people as they are.',
      format: 'A text tree with the Sosa number, name, dates and state of each person.'
    },
    mur: {
      titol: 'Brick wall and FAN Club',
      descripcio: 'Prompt to break through a genealogical brick wall with testable hypotheses and collateral lines.',
      objectiu: 'I am stuck with {central}: I cannot find their parents or their origin. Help me break through this brick wall.',
      passos: 'List hypotheses ordered by likelihood and, for each one, which specific record would prove or rule it out and in which archive. Research the collateral lines (siblings, godparents, witnesses and neighbours: the FAN Club). A hypothesis without a document is [FALTA CONFIRMAR].',
      format: 'Numbered hypotheses with: why, which record, which archive, which URL and which state.'
    },
    transcripcio: {
      titol: 'Palaeographic transcription',
      descripcio: 'Prompt to transcribe an old handwritten record literally, marking what cannot be read.',
      objectiu: 'I will attach the image (or the text) of an old handwritten record related to {central}. Transcribe it and explain it.',
      passos: 'First, the literal transcription line by line, with the original spelling and abbreviations, without modernising; mark [il·legible] whatever cannot be read and [dubtós: …] whatever is uncertain. Then, separately, a version in present-day language and the extracted data (people, roles, dates, places, godparents and witnesses), each with its state. Do not fill in anything that cannot be read.',
      format: 'Three blocks: literal transcription · present-day version · extracted data with state.'
    },
    gps: {
      titol: 'Genealogical Proof Standard (GPS)',
      descripcio: 'Prompt to assess a conclusion with the five elements of the Genealogical Proof Standard.',
      objectiu: 'Assess what we know about {central} against the five elements of the Genealogical Proof Standard.',
      passos: '(1) Reasonably exhaustive research: which sources are still to be consulted. (2) Complete citation of every source, with URL. (3) Analysis and correlation: original or derivative source, primary or secondary information, direct or indirect evidence. (4) Resolution of conflicting evidence. (5) A soundly reasoned, written conclusion.',
      format: 'Five numbered sections and a final conclusion with one of the four states.'
    }
  },
  eu: {
    entrevista: {
      titol: 'Elkarrizketa gidatua (galdera bat txandako)',
      descripcio: 'Zure laguntzaileak belaunaldiz belaunaldi elkarrizketa diezazun prompta, ezer asmatu gabe (Pablo Carballoren metodoa, 1. urratsa).',
      objectiu: 'Egidazu elkarrizketa bat nire familiaren zuhaitz genealogikoa osatzeko. Behean dago dagoeneko dakiguna.',
      passos: 'Egin galdera BAKAR bat aldi bakoitzean eta itxaron nire erantzuna. Hasi etxeko ezizenarekin («Els de Ca…») eta baserriarekin, auzoarekin edo herriarekin; gero igo belaunaldiz belaunaldi: ni eta nire anai-arrebak (G4), gurasoak (G3), aitaren eta amaren aldeko aitona-amonak (G2) eta birraitona-amonak (G1). Pertsona bakoitzeko, galdetu izena, bi abizenak (amarena ere bai), urtea (gutxi gorabeherakoa bada ere), tokia eta lanbidea. Galdetu baita aitona-amonen anai-arrebei, aitabitxiei eta lekukoei buruz ere. Erantzun bat lausoa bada, markatu [APROXIMAT]; ez eman ezer ziurtzat.',
      format: 'Amaitzean, egin laburpen bat belaunaldika (G4 → G1), datu bakoitzaren egoerarekin.'
    },
    cognom: {
      titol: 'Abizenaren historia eta jatorria',
      descripcio: 'Abizen baten historia dokumentatua interpretazioetatik bereizteko prompta (2. urratsa).',
      objectiu: 'Azaldu {cognom} abizenaren historia, jatorri geografikoa eta migrazioak. Hasi toki honetatik: {lloc}.',
      passos: 'Bereizi argi datu historiko dokumentatua (URLarekin) interpretazio probabletik. Abizena partekatzeak ez gaitu senide egiten: ez esan abizen bereko pertsona ezagun bat nire arbasoa denik, hori frogatzen duen agiri-katerik gabe.',
      format: 'Bi zerrenda: «Dokumentatua» (datu bakoitza URL eta egoerarekin) eta «Interpretazioa» (beti [FALTA CONFIRMAR]).'
    },
    'cerca-arxius': {
      titol: 'Bilaketa artxibo publikoetan',
      descripcio: 'Hildako pertsona baten erregistroak artxiboetan eta iturri irekietan bilatzeko prompta, datu bakoitzaren URL zehatzarekin (3. urratsa).',
      objectiu: 'Bilatu pertsona honen erregistro publikoak: {central}. Erabili zerrendako artxiboak eta beste iturri ireki batzuk (erregistro digitalizatuak, prentsa, hilberriak).',
      passos: 'Aurkikuntza bakoitzeko, eman artxiboa, erregistro mota, data, tokia, testu literal garrantzitsua, URL zehatza eta loturaren indarra lau egoeretako batekin. Erabili anai-arrebak, aitabitxiak, lekukoak eta auzokoak (FAN Club-a) triangelatzeko. Artxibo batek sareko kontsultarik ez badu, esan non eskatu behar den.',
      format: 'Zerrenda bat, lerro bat aurkikuntza bakoitzeko: datua · iturria · URL · egoera.'
    },
    'arbre-visual': {
      titol: 'Zuhaitz bisuala belaunaldika',
      descripcio: 'Familiaren zuhaitza testuz marrazteko prompta, baieztatua arrastoetatik bereizita (4. urratsa).',
      objectiu: 'Egin zuhaitz genealogiko bisual bat belaunaldika beheko datuekin, testuz (koskadun zerrenda edo eskema), familiarekin partekatzeko.',
      passos: 'Bereizi argi familiak baieztatutako pertsonak baieztatzeke dauden arrastoetatik. Erabili Sosa-Stradonitz zenbakikuntza (1 erroko pertsona, 2n aita eta 2n+1 ama) agertzen denean. Ez gehitu zerrendan ez dagoen inor, eta utzi babestutako pertsonak dauden bezala.',
      format: 'Testuzko zuhaitz bat, pertsona bakoitzaren Sosa zenbakiarekin, izenarekin, datekin eta egoerarekin.'
    },
    mur: {
      titol: 'Horma genealogikoa eta FAN Club-a',
      descripcio: 'Horma genealogiko bat (brick wall) hipotesi egiaztagarriekin eta alboko adarrekin hausteko prompta.',
      objectiu: 'Trabatuta nago pertsona honekin: {central}. Ez ditut haren gurasoak edo jatorria aurkitzen. Lagundu horma hau hausten.',
      passos: 'Egin hipotesien zerrenda bat probabilitatearen arabera ordenatuta eta, bakoitzarentzat, zein erregistro zehatzek frogatuko edo baztertuko lukeen eta zein artxibotan. Ikertu alboko adarrak (anai-arrebak, aitabitxiak, lekukoak eta auzokoak: FAN Club-a). Dokumenturik gabeko hipotesia [FALTA CONFIRMAR] da.',
      format: 'Hipotesi zenbakituak: zergatik, zein erregistro, zein artxibo, zein URL eta zein egoera.'
    },
    transcripcio: {
      titol: 'Transkripzio paleografikoa',
      descripcio: 'Eskuz idatzitako agiri zahar bat hitzez hitz transkribatzeko prompta, irakurtzen ez dena markatuta.',
      objectiu: 'Eskuz idatzitako agiri zahar baten irudia (edo testua) erantsiko dizut, pertsona honekin lotua: {central}. Transkribatu eta azaldu.',
      passos: 'Lehenik, transkripzio literala lerroz lerro, jatorrizko ortografia eta laburdurekin, modernizatu gabe; markatu [il·legible] irakurtzen ez dena eta [dubtós: …] ziurra ez dena. Gero, aparte, gaur egungo hizkuntzako bertsio bat eta ateratako datuak (pertsonak, rolak, datak, tokiak, aitabitxiak eta lekukoak), bakoitza bere egoerarekin. Ez osatu irakurtzen ez den ezer.',
      format: 'Hiru bloke: transkripzio literala · gaur egungo bertsioa · ateratako datuak egoerarekin.'
    },
    gps: {
      titol: 'Genealogical Proof Standard (GPS)',
      descripcio: 'Ondorio bat froga genealogikoaren estandarraren bost elementuekin ebaluatzeko prompta.',
      objectiu: 'Ebaluatu Genealogical Proof Standard-aren bost elementuen arabera pertsona honi buruz dakiguna: {central}.',
      passos: '(1) Bilaketa nahiko zehatza: zein iturri falta diren kontsultatzeko. (2) Iturri bakoitzaren aipamen osoa, URLarekin. (3) Analisia eta korrelazioa: jatorrizko iturria edo eratorria, informazio primarioa edo sekundarioa, ebidentzia zuzena edo zeharkakoa. (4) Kontraesanen ebazpena. (5) Ondorio arrazoitua eta idatzia.',
      format: 'Bost atal zenbakitu eta azken ondorio bat lau egoeretako batekin.'
    }
  },
  gl: {
    entrevista: {
      titol: 'Entrevista guiada (unha pregunta por quenda)',
      descripcio: 'Prompt para que o teu asistente te entreviste xeración a xeración, sen inventar nada (método de Pablo Carballo, paso 1).',
      objectiu: 'Faime unha entrevista para completar a árbore xenealóxica da miña familia. Abaixo tes o que xa sabemos.',
      passos: 'Fai UNHA soa pregunta cada vez e agarda a miña resposta. Comeza polo alcume da casa («Els de Ca…») e polo lugar, a parroquia ou a vila; despois sobe por xeracións: eu e os meus irmáns (G4), os pais (G3), os avós paternos e maternos (G2) e os bisavós (G1). Para cada persoa, pregunta o nome, os dous apelidos (tamén o materno), o ano (aínda que sexa aproximado), o lugar e o oficio. Pregunta tamén polos irmáns dos avós, os padriños e as testemuñas. Se unha resposta é vaga, márcaa [APROXIMAT]; non deas nada por feito.',
      format: 'Cando rematemos, fai un resumo por xeracións (G4 → G1) co estado de cada dato.'
    },
    cognom: {
      titol: 'Historia e orixe do apelido',
      descripcio: 'Prompt para separar a historia documentada dun apelido das interpretacións (paso 2).',
      objectiu: 'Explícame a historia, a orixe xeográfica e as migracións do apelido {cognom}, comezando por {lloc}.',
      passos: 'Separa con claridade o dato histórico documentado (con URL) da interpretación probable. Compartir apelido non fai parentes: non me digas que unha persoa coñecida co mesmo apelido é antepasada miña sen unha cadea de partidas que o probe.',
      format: 'Dúas listas: «Documentado» (cada dato con URL e estado) e «Interpretación» (sempre [FALTA CONFIRMAR]).'
    },
    'cerca-arxius': {
      titol: 'Busca en arquivos públicos',
      descripcio: 'Prompt para buscar rexistros dunha persoa falecida en arquivos e fontes abertas, coa URL exacta de cada dato (paso 3).',
      objectiu: 'Busca rexistros públicos de {central} nos arquivos da lista e noutras fontes abertas (rexistros dixitalizados, prensa, esquelas).',
      passos: 'Para cada achado, dá o arquivo, o tipo de rexistro, a data, o lugar, o texto literal relevante, a URL exacta e a forza do vínculo cun dos catro estados. Usa os irmáns, os padriños, as testemuñas e os veciños (o FAN Club) para triangular. Se un arquivo non ten consulta en liña, di onde hai que pedilo.',
      format: 'Unha lista cunha liña por achado: dato · fonte · URL · estado.'
    },
    'arbre-visual': {
      titol: 'Árbore visual por xeracións',
      descripcio: 'Prompt para debuxar en texto a árbore da familia, separando o confirmado das pistas (paso 4).',
      objectiu: 'Fai unha árbore xenealóxica visual por xeracións cos datos de abaixo, en texto (lista sangrada ou esquema), para compartila coa familia.',
      passos: 'Diferencia con claridade as persoas que a familia confirmou das pistas pendentes de confirmar. Usa a numeración Sosa-Stradonitz (1 a persoa raíz, 2n o pai e 2n+1 a nai) cando estea. Non engadas ningunha persoa que non estea na lista e deixa as persoas protexidas tal como están.',
      format: 'Unha árbore de texto co número Sosa, o nome, as datas e o estado de cada persoa.'
    },
    mur: {
      titol: 'Muro xenealóxico e FAN Club',
      descripcio: 'Prompt para romper un muro xenealóxico (brick wall) con hipóteses comprobables e ramas colaterais.',
      objectiu: 'Quedei atascado con {central}: non atopo os seus pais ou a súa orixe. Axúdame a romper este muro.',
      passos: 'Fai unha lista de hipóteses ordenadas por probabilidade e, para cada unha, que rexistro concreto a probaría ou a descartaría e en que arquivo. Investiga as ramas colaterais (irmáns, padriños, testemuñas e veciños: o FAN Club). Unha hipótese sen documento é [FALTA CONFIRMAR].',
      format: 'Hipóteses numeradas con: por que, que rexistro, que arquivo, que URL e que estado.'
    },
    transcripcio: {
      titol: 'Transcrición paleográfica',
      descripcio: 'Prompt para transcribir literalmente unha partida manuscrita antiga, marcando o que non se le.',
      objectiu: 'Achegareiche a imaxe (ou o texto) dunha partida manuscrita antiga relacionada con {central}. Transcríbea e explícaa.',
      passos: 'Primeiro, a transcrición literal liña a liña, coa ortografía e as abreviaturas orixinais, sen modernizar; marca [il·legible] o que non se le e [dubtós: …] o que non é seguro. Despois, á parte, unha versión en lingua actual e os datos extraídos (persoas, papeis, datas, lugares, padriños e testemuñas), cada un co seu estado. Non completes nada que non se lea.',
      format: 'Tres bloques: transcrición literal · versión actual · datos extraídos con estado.'
    },
    gps: {
      titol: 'Genealogical Proof Standard (GPS)',
      descripcio: 'Prompt para avaliar unha conclusión cos cinco elementos do estándar de proba xenealóxica.',
      objectiu: 'Avalía o que sabemos de {central} segundo os cinco elementos do Genealogical Proof Standard.',
      passos: '(1) Busca razoablemente exhaustiva: que fontes faltan por consultar. (2) Cita completa de cada fonte, con URL. (3) Análise e correlación: fonte orixinal ou derivada, información primaria ou secundaria, evidencia directa ou indirecta. (4) Resolución das contradicións. (5) Conclusión razoada e escrita.',
      format: 'Cinco apartados numerados e unha conclusión final cun dos catro estados.'
    }
  }
});

/* ── Regles comunes i rètols ──────────────────────────────────────────── */

const REGLES = Object.freeze({
  ca: [
    'Abans de començar, activa la Cerca Web del teu assistent. Si no la tens, digues-ho i no inventes resultats.',
    'Cada dada que aportes ha de portar la URL exacta i verificable d’on l’has treta (o la signatura de l’arxiu). Una dada sense URL es marca [FALTA CONFIRMAR].',
    'Marca cada dada amb un d’estos quatre estats, escrits tal qual: [CONFIRMAT] (font documental amb URL), [APROXIMAT] (memòria oral, edat declarada o data aproximada), [FALTA CONFIRMAR] (pista sense prova) i [CONTRADICCIÓ] (dues fonts no casen: mostra-les totes dues).',
    'Cognom ≠ Parentiu: compartir cognom o poble no prova cap parentiu. Un vincle només val amb una partida o un document que l’explicite.',
    'No inventes persones, dates, llocs ni vincles. Si no trobes res, digues-ho clarament.',
    'Si transcrius un document manuscrit, fes-ho literal, amb l’ortografia original i sense modernitzar; marca [il·legible] el que no es llig i [dubtós: …] el que no és segur.',
    'Dates: 1908 és exacta, ~1908 aproximada (±5 anys), 1908? estimada (±10 anys); «desconeguda» vol dir que no se sap.',
    'Les persones marcades «Persona viva (dades protegides)» no s’han d’investigar, identificar ni completar.',
    'Cap resposta teua és una garantia: és una pista que la família ha de comprovar a la font.'
  ],
  es: [
    'Antes de empezar, activa la Búsqueda web de tu asistente. Si no la tienes, dilo y no inventes resultados.',
    'Cada dato que aportes debe llevar la URL exacta y verificable de donde lo has sacado (o la signatura del archivo). Un dato sin URL se marca [FALTA CONFIRMAR].',
    'Marca cada dato con uno de estos cuatro estados, escritos tal cual: [CONFIRMAT] (fuente documental con URL), [APROXIMAT] (memoria oral, edad declarada o fecha aproximada), [FALTA CONFIRMAR] (pista sin prueba) y [CONTRADICCIÓ] (dos fuentes no coinciden: muéstralas ambas).',
    'Apellido ≠ Parentesco: compartir apellido o pueblo no prueba ningún parentesco. Un vínculo solo vale con una partida o un documento que lo explicite.',
    'No inventes personas, fechas, lugares ni vínculos. Si no encuentras nada, dilo claramente.',
    'Si transcribes un documento manuscrito, hazlo literal, con la ortografía original y sin modernizar; marca [il·legible] lo que no se lee y [dubtós: …] lo que no es seguro.',
    'Fechas: 1908 es exacta, ~1908 aproximada (±5 años), 1908? estimada (±10 años); «desconocida» significa que no se sabe.',
    'Las personas marcadas «Persona viva (datos protegidos)» no se deben investigar, identificar ni completar.',
    'Ninguna respuesta tuya es una garantía: es una pista que la familia debe comprobar en la fuente.'
  ],
  en: [
    'Before you start, turn on your assistant’s Web Search. If you do not have it, say so and do not make up results.',
    'Every fact you give must carry the exact, verifiable URL where you found it (or the archive call number). A fact without a URL is marked [FALTA CONFIRMAR].',
    'Tag every fact with one of these four states, written exactly like this: [CONFIRMAT] (documentary source with URL), [APROXIMAT] (oral memory, declared age or approximate date), [FALTA CONFIRMAR] (lead without proof) and [CONTRADICCIÓ] (two sources disagree: show both).',
    'Surname ≠ Kinship: sharing a surname or a village proves no kinship. A link only counts with a record or document that states it.',
    'Do not invent people, dates, places or links. If you find nothing, say so clearly.',
    'If you transcribe a handwritten document, do it literally, in the original spelling, without modernising; mark [il·legible] whatever cannot be read and [dubtós: …] whatever is uncertain.',
    'Dates: 1908 is exact, ~1908 approximate (±5 years), 1908? estimated (±10 years); “unknown” means it is not known.',
    'People marked “Living person (protected data)” must not be researched, identified or completed.',
    'No answer of yours is a guarantee: it is a lead the family must check at the source.'
  ],
  eu: [
    'Hasi aurretik, aktibatu zure laguntzailearen Web Bilaketa. Ez baduzu, esan eta ez asmatu emaitzarik.',
    'Ematen duzun datu bakoitzak non aurkitu duzun adierazten duen URL zehatz eta egiaztagarria eraman behar du (edo artxiboko signatura). URLrik gabeko datua [FALTA CONFIRMAR] markatzen da.',
    'Markatu datu bakoitza lau egoera hauetako batekin, horrela idatzita: [CONFIRMAT] (URLdun dokumentu-iturria), [APROXIMAT] (ahozko memoria, aitortutako adina edo gutxi gorabeherako data), [FALTA CONFIRMAR] (frogarik gabeko arrastoa) eta [CONTRADICCIÓ] (bi iturri ez datoz bat: erakutsi biak).',
    'Abizena ≠ Ahaidetasuna: abizena edo herria partekatzeak ez du ahaidetasunik frogatzen. Lotura batek agiri edo dokumentu batek esplizituki adierazten badu bakarrik balio du.',
    'Ez asmatu pertsonarik, datarik, tokirik ezta loturarik ere. Ezer aurkitzen ez baduzu, esan argi.',
    'Eskuz idatzitako dokumentu bat transkribatzen baduzu, egin hitzez hitz, jatorrizko ortografiarekin eta modernizatu gabe; markatu [il·legible] irakurtzen ez dena eta [dubtós: …] ziurra ez dena.',
    'Datak: 1908 zehatza da, ~1908 gutxi gorabeherakoa (±5 urte), 1908? estimatua (±10 urte); «ezezaguna» esan nahi du ez dakigula.',
    '«Pertsona bizia (datu babestuak)» markatutako pertsonak ez dira ikertu, identifikatu ezta osatu behar.',
    'Zure erantzunak ez dira bermea: familiak iturrian egiaztatu behar duen arrastoa dira.'
  ],
  gl: [
    'Antes de comezar, activa a Busca web do teu asistente. Se non a tes, dio e non inventes resultados.',
    'Cada dato que achegues debe levar a URL exacta e verificable de onde o sacaches (ou a sinatura do arquivo). Un dato sen URL márcase [FALTA CONFIRMAR].',
    'Marca cada dato cun destes catro estados, escritos tal cal: [CONFIRMAT] (fonte documental con URL), [APROXIMAT] (memoria oral, idade declarada ou data aproximada), [FALTA CONFIRMAR] (pista sen proba) e [CONTRADICCIÓ] (dúas fontes non coinciden: amósaas ambas).',
    'Apelido ≠ Parentesco: compartir apelido ou vila non proba ningún parentesco. Un vínculo só vale cunha partida ou un documento que o explicite.',
    'Non inventes persoas, datas, lugares nin vínculos. Se non atopas nada, dio claramente.',
    'Se transcribes un documento manuscrito, faino literal, coa ortografía orixinal e sen modernizar; marca [il·legible] o que non se le e [dubtós: …] o que non é seguro.',
    'Datas: 1908 é exacta, ~1908 aproximada (±5 anos), 1908? estimada (±10 anos); «descoñecida» significa que non se sabe.',
    'As persoas marcadas «Persoa viva (datos protexidos)» non se deben investigar, identificar nin completar.',
    'Ningunha resposta túa é unha garantía: é unha pista que a familia debe comprobar na fonte.'
  ]
});

const RETOLS = Object.freeze({
  ca: {
    intro: 'Prompt preparat amb l’app Arbre Genealògic de Sóc de Poble. Les dades de la família són de baix i no estan verificades si no porten [CONFIRMAT].',
    tasca: 'Què has de fer', regles: 'Regles obligatòries', format: 'Format de la resposta', context: 'Dades de l’arbre',
    casa: 'Casa', poble: 'Poble', mas: 'Mas o partida', persones: 'Persones', vincles: 'Vincles coneguts',
    central: 'Persona central', fonts: 'Fonts ja anotades', senseFonts: 'Encara no hi ha cap font anotada.', senseUrl: 'sense URL',
    arxius: 'Arxius suggerits', verificar: 'adreça per verificar', viva: 'Persona viva (dades protegides)', desconeguda: 'desconeguda',
    naixement: 'naixement', defuncio: 'defunció', lloc: 'lloc', ofici: 'ofici', malnom: 'malnom', sosa: 'Sosa',
    mes: 'i {n} persones més que no hi caben', buit: 'Encara no hi ha cap persona a l’arbre.', transcripcio: 'transcripció anotada',
    centralRef: 'la persona central ({ref})', senseCentral: 'les persones de l’arbre marcades [FALTA CONFIRMAR]',
    cognomFamilia: 'de la família', llocFamilia: 'el poble de la família',
    relacions: { progenitor: 'és progenitor o progenitora de', parella: 'és parella de', germa: 'és germà o germana de', padri: 'és padrí o padrina de', testimoni: 'és testimoni de', vei: 'és veí o veïna de' }
  },
  es: {
    intro: 'Prompt preparado con la app Árbol Genealógico de Sóc de Poble. Los datos de la familia están abajo y no están verificados si no llevan [CONFIRMAT].',
    tasca: 'Qué tienes que hacer', regles: 'Reglas obligatorias', format: 'Formato de la respuesta', context: 'Datos del árbol',
    casa: 'Casa', poble: 'Pueblo', mas: 'Mas o partida', persones: 'Personas', vincles: 'Vínculos conocidos',
    central: 'Persona central', fonts: 'Fuentes ya anotadas', senseFonts: 'Aún no hay ninguna fuente anotada.', senseUrl: 'sin URL',
    arxius: 'Archivos sugeridos', verificar: 'dirección por verificar', viva: 'Persona viva (datos protegidos)', desconeguda: 'desconocida',
    naixement: 'nacimiento', defuncio: 'defunción', lloc: 'lugar', ofici: 'oficio', malnom: 'apodo', sosa: 'Sosa',
    mes: 'y {n} personas más que no caben', buit: 'Aún no hay ninguna persona en el árbol.', transcripcio: 'transcripción anotada',
    centralRef: 'la persona central ({ref})', senseCentral: 'las personas del árbol marcadas [FALTA CONFIRMAR]',
    cognomFamilia: 'de la familia', llocFamilia: 'el pueblo de la familia',
    relacions: { progenitor: 'es progenitor o progenitora de', parella: 'es pareja de', germa: 'es hermano o hermana de', padri: 'es padrino o madrina de', testimoni: 'es testigo de', vei: 'es vecino o vecina de' }
  },
  en: {
    intro: 'Prompt prepared with the Family Tree app by Sóc de Poble. The family’s data is below and is not verified unless it carries [CONFIRMAT].',
    tasca: 'What to do', regles: 'Mandatory rules', format: 'Answer format', context: 'Tree data',
    casa: 'House', poble: 'Village', mas: 'Farmstead or district', persones: 'People', vincles: 'Known links',
    central: 'Focus person', fonts: 'Sources already noted', senseFonts: 'No source has been noted yet.', senseUrl: 'no URL',
    arxius: 'Suggested archives', verificar: 'address to be verified', viva: 'Living person (protected data)', desconeguda: 'unknown',
    naixement: 'birth', defuncio: 'death', lloc: 'place', ofici: 'trade', malnom: 'nickname', sosa: 'Sosa',
    mes: 'and {n} more people who do not fit', buit: 'There is nobody in the tree yet.', transcripcio: 'noted transcription',
    centralRef: 'the focus person ({ref})', senseCentral: 'the people in the tree marked [FALTA CONFIRMAR]',
    cognomFamilia: 'of the family', llocFamilia: 'the family’s village',
    relacions: { progenitor: 'is a parent of', parella: 'is the partner of', germa: 'is a sibling of', padri: 'is a godparent of', testimoni: 'is a witness for', vei: 'is a neighbour of' }
  },
  eu: {
    intro: 'Sóc de Pobleren Zuhaitz Genealogikoa aplikazioarekin prestatutako prompta. Familiaren datuak behean daude, eta ez daude egiaztatuta [CONFIRMAT] ez badaramate.',
    tasca: 'Zer egin behar duzun', regles: 'Arau derrigorrezkoak', format: 'Erantzunaren formatua', context: 'Zuhaitzaren datuak',
    casa: 'Etxea', poble: 'Herria', mas: 'Baserria edo auzoa', persones: 'Pertsonak', vincles: 'Lotura ezagunak',
    central: 'Pertsona nagusia', fonts: 'Idatzitako iturriak', senseFonts: 'Oraindik ez dago iturririk idatzita.', senseUrl: 'URLrik gabe',
    arxius: 'Gomendatutako artxiboak', verificar: 'egiaztatu beharreko helbidea', viva: 'Pertsona bizia (datu babestuak)', desconeguda: 'ezezaguna',
    naixement: 'jaiotza', defuncio: 'heriotza', lloc: 'tokia', ofici: 'lanbidea', malnom: 'ezizena', sosa: 'Sosa',
    mes: 'eta sartzen ez diren beste {n} pertsona', buit: 'Oraindik ez dago inor zuhaitzean.', transcripcio: 'idatzitako transkripzioa',
    centralRef: 'pertsona nagusia ({ref})', senseCentral: 'zuhaitzean [FALTA CONFIRMAR] markatutako pertsonak',
    cognomFamilia: 'familiaren', llocFamilia: 'familiaren herria',
    relacions: { progenitor: 'honen gurasoa da:', parella: 'honen bikotea da:', germa: 'honen anai-arreba da:', padri: 'honen aitabitxi edo amabitxia da:', testimoni: 'honen lekukoa da:', vei: 'honen auzokoa da:' }
  },
  gl: {
    intro: 'Prompt preparado coa app Árbore Xenealóxica de Sóc de Poble. Os datos da familia están abaixo e non están verificados se non levan [CONFIRMAT].',
    tasca: 'Que tes que facer', regles: 'Regras obrigatorias', format: 'Formato da resposta', context: 'Datos da árbore',
    casa: 'Casa', poble: 'Vila', mas: 'Lugar ou parroquia', persones: 'Persoas', vincles: 'Vínculos coñecidos',
    central: 'Persoa central', fonts: 'Fontes xa anotadas', senseFonts: 'Aínda non hai ningunha fonte anotada.', senseUrl: 'sen URL',
    arxius: 'Arquivos suxeridos', verificar: 'enderezo por verificar', viva: 'Persoa viva (datos protexidos)', desconeguda: 'descoñecida',
    naixement: 'nacemento', defuncio: 'defunción', lloc: 'lugar', ofici: 'oficio', malnom: 'alcume', sosa: 'Sosa',
    mes: 'e {n} persoas máis que non caben', buit: 'Aínda non hai ningunha persoa na árbore.', transcripcio: 'transcrición anotada',
    centralRef: 'a persoa central ({ref})', senseCentral: 'as persoas da árbore marcadas [FALTA CONFIRMAR]',
    cognomFamilia: 'da familia', llocFamilia: 'a vila da familia',
    relacions: { progenitor: 'é proxenitor ou proxenitora de', parella: 'é parella de', germa: 'é irmán ou irmá de', padri: 'é padriño ou madriña de', testimoni: 'é testemuña de', vei: 'é veciño ou veciña de' }
  }
});

/* ── Catàleg públic de plantilles ─────────────────────────────────────── */

const IDS_PLANTILLA = Object.freeze(['entrevista', 'cognom', 'cerca-arxius', 'arbre-visual', 'mur', 'transcripcio', 'gps']);
const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const perLlengua = (camp, id) => Object.freeze(Object.fromEntries(LLENGUES.map((l) => [l, PLANTILLES[l][id][camp]])));

export const PLANTILLES_PROMPT = Object.freeze(IDS_PLANTILLA.map((id) => Object.freeze({
  id,
  titol: perLlengua('titol', id),
  descripcio: perLlengua('descripcio', id),
  necessitaPersona: NECESSITA_PERSONA[id]
})));

export const esPlantilla = (valor) => PLANTILLES_PROMPT.some((p) => p.id === valor);

/* ── Ajudants ─────────────────────────────────────────────────────────── */

/** Substituïx {clau} d'una sola passada (un valor que porte «{…}» no es torna a substituir). Sense regex. */
function omple(plantilla, valors) {
  let sortida = '';
  let posicio = 0;
  while (posicio < plantilla.length) {
    const obri = plantilla.indexOf('{', posicio);
    const tanca = obri === -1 ? -1 : plantilla.indexOf('}', obri);
    if (obri === -1 || tanca === -1) {
      sortida += plantilla.slice(posicio);
      break;
    }
    const clau = plantilla.slice(obri + 1, tanca);
    sortida += plantilla.slice(posicio, obri);
    sortida += Object.hasOwn(valors, clau) ? String(valors[clau]) : plantilla.slice(obri, tanca + 1);
    posicio = tanca + 1;
  }
  return sortida;
}

const ORDRE_GENERACIO = Object.freeze({ G1: 1, G2: 2, G3: 3, G4: 4 });
const ordreGeneracio = (generacio) => (typeof generacio === 'string' && Object.hasOwn(ORDRE_GENERACIO, generacio) ? ORDRE_GENERACIO[generacio] : 9);
const compara = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

function nomDe(persona) {
  return [liniaNeta(persona.nom, 80), liniaNeta(persona.cognom1, 80), liniaNeta(persona.cognom2, 80)]
    .filter((tros) => tros.length > 0).join(' ');
}

function dataVisible(data, idioma, retols) {
  if (!data || data.precisio === 'desconeguda') return retols.desconeguda;
  return liniaNeta(etiquetaData(data, idioma), 40) || retols.desconeguda;
}

function liniaPersona(persona, { ref, protegida, idioma, retols, estat, sosa }) {
  const generacio = liniaNeta(persona.generacio, 4) || '—';
  if (protegida) return `- ${ref} · ${generacio} · ${retols.viva}`;
  const trossos = [ref, generacio, nomDe(persona) || '—'];
  trossos.push(`${retols.naixement} ${dataVisible(persona.naixement, idioma, retols)}`);
  if (persona.defuncio) trossos.push(`${retols.defuncio} ${dataVisible(persona.defuncio, idioma, retols)}`);
  const lloc = liniaNeta(persona.lloc, 120);
  if (lloc) trossos.push(`${retols.lloc} ${lloc}`);
  const ofici = liniaNeta(persona.ofici, 80);
  if (ofici) trossos.push(`${retols.ofici} ${ofici}`);
  const casa = liniaNeta(persona.casa, 80);
  if (casa) trossos.push(`${retols.casa} ${casa}`);
  const malnom = liniaNeta(persona.malnom, 80);
  if (malnom) trossos.push(`${retols.malnom} ${malnom}`);
  trossos.push(ETIQUETES_ESTAT[estat] ?? ETIQUETES_ESTAT['falta-confirmar']);
  if (sosa.length > 0) trossos.push(`${retols.sosa} ${sosa.join(', ')}`);
  return `- ${trossos.join(' · ')}`;
}

function liniesArxius(arxius, idioma, retols) {
  const linies = [];
  for (const arxiu of arxius) {
    const adreca = arxiu.url && !arxiu.verificar ? arxiu.url : `${retols.verificar}: ${arxiu.comAccedir[idioma]}`;
    linies.push(`- ${arxiu.nom[idioma]} · ${adreca}`);
    linies.push(`  ${arxiu.que[idioma]}`);
  }
  return linies;
}

/* ── El generador ─────────────────────────────────────────────────────── */

/**
 * Prepara el text d'un prompt mestre per a copiar.
 * @returns {{ ok: boolean, motiu: null | 'persona-viva' | 'plantilla', text: string, ocultes: number, avisos: Array<'cerca-web'|'url-verificable'|'vius-ocults'|'sense-garantia'> }}
 */
export function generaPrompt(plantillaId, complet, { personaId = null, arxiuId = null, idioma = 'ca', incloureVius = false, anyActual } = {}) {
  if (!esPlantilla(plantillaId)) return { ok: false, motiu: 'plantilla', text: '', ocultes: 0, avisos: [] };
  const llengua = IDIOMES.includes(idioma) ? idioma : 'ca';
  const retols = RETOLS[llengua];
  const plantilla = PLANTILLES[llengua][plantillaId];
  const ambVius = incloureVius === true;
  const opcions = { anyActual };
  const persones = Array.isArray(complet?.persones) ? complet.persones : [];

  // Primera capa: les vives es calculen sobre l'arbre original, abans de cap filtre.
  /* idsVius indexa l'arbre UNA sola vegada; esPersonaViva per persona el
     reindexaria a cada crida (cost quadràtic amb arbres de milers de persones). */
  const vivesOriginals = ambVius || persones.length === 0 ? new Set() : idsVius(complet, opcions);
  const centralOriginal = typeof personaId === 'string' ? persones.find((p) => p.id === personaId) ?? null : null;
  if (centralOriginal && vivesOriginals.has(centralOriginal.id)) {
    return { ok: false, motiu: 'persona-viva', text: '', ocultes: vivesOriginals.size, avisos: ['vius-ocults'] };
  }

  // Segona capa: el filtre del nucli (anonimitza) i, a més, el conjunt de dalt.
  const filtre = filtraVius(complet, { incloureVius: ambVius, mode: 'anonimitza', anyActual });
  const filtrat = filtre.complet;
  const protegides = new Set(ambVius ? [] : [...vivesOriginals, ...(Array.isArray(filtre.idsOcults) ? filtre.idsOcults : [])]);
  for (const persona of filtrat.persones) if (persona.privada === true) protegides.add(persona.id);
  const ocultes = ambVius ? 0 : Math.max(Number(filtre.ocultes) || 0, filtrat.persones.filter((p) => protegides.has(p.id)).length);

  // Si el filtre del nucli l'ha protegida, la persona central tampoc no pot ser-ho.
  if (centralOriginal && protegides.has(centralOriginal.id)) {
    return { ok: false, motiu: 'persona-viva', text: '', ocultes, avisos: ['vius-ocults'] };
  }
  const central = centralOriginal ? filtrat.persones.find((p) => p.id === centralOriginal.id) ?? null : null;
  const arrelId = filtrat.arbre?.arrelId;
  const sosa = typeof arrelId === 'string' && filtrat.persones.some((p) => p.id === arrelId)
    ? numeraSosa(filtrat, arrelId, { maxGeneracions: 10 }).perPersona
    : new Map();
  const alertes = detectaContradiccions(filtrat, opcions);
  const sosaDe = (id) => (Array.isArray(sosa.get(id)) ? sosa.get(id) : []);
  const primerSosa = (id) => (sosaDe(id).length > 0 ? Math.min(...sosaDe(id)) : Number.POSITIVE_INFINITY);

  const ordenades = [...filtrat.persones].sort((a, b) => {
    const perSosa = primerSosa(a.id) - primerSosa(b.id);
    if (perSosa < 0 || perSosa > 0) return perSosa;
    return ordreGeneracio(a.generacio) - ordreGeneracio(b.generacio) || compara(a.id, b.id);
  });
  let dins = ordenades.slice(0, MAX_PERSONES_PROMPT);
  if (central && !dins.includes(central)) dins = [central, ...dins.slice(0, MAX_PERSONES_PROMPT - 1)];
  const refs = new Map(dins.map((p, index) => [p.id, `P${index + 1}`]));

  const arbre = filtrat.arbre || {};
  const valors = {
    central: central ? omple(retols.centralRef, { ref: refs.get(central.id) }) : retols.senseCentral,
    cognom: (central && (liniaNeta(central.cognom1, 80) || liniaNeta(central.cognom2, 80))) || retols.cognomFamilia,
    lloc: (central && liniaNeta(central.lloc, 120)) || liniaNeta(arbre.poble, 120) || retols.llocFamilia
  };

  const linies = [`# ${plantilla.titol}`, '', retols.intro, '', `## ${retols.tasca}`, omple(plantilla.objectiu, valors), '', omple(plantilla.passos, valors), ''];
  linies.push(`## ${retols.regles}`);
  REGLES[llengua].forEach((regla, index) => linies.push(`${index + 1}. ${regla}`));
  linies.push('');

  linies.push(`## ${retols.context}`);
  const casa = liniaNeta(arbre.malnomCasa, 80);
  const poble = liniaNeta(arbre.poble, 120);
  const mas = liniaNeta(arbre.mas, 120);
  if (casa) linies.push(`${retols.casa}: ${casa}`);
  if (poble) linies.push(`${retols.poble}: ${poble}`);
  if (mas) linies.push(`${retols.mas}: ${mas}`);
  linies.push('', `### ${retols.persones}`);
  if (dins.length === 0) linies.push(retols.buit);
  for (const persona of dins) {
    linies.push(liniaPersona(persona, {
      ref: refs.get(persona.id),
      protegida: protegides.has(persona.id),
      idioma: llengua,
      retols,
      estat: estatEfectiu(persona, alertes),
      sosa: protegides.has(persona.id) ? [] : sosaDe(persona.id)
    }));
  }
  if (filtrat.persones.length > dins.length) linies.push(omple(retols.mes, { n: filtrat.persones.length - dins.length }));

  const vincles = (Array.isArray(filtrat.relacions) ? filtrat.relacions : [])
    .filter((r) => r && refs.has(r.de) && refs.has(r.a) && Object.hasOwn(retols.relacions, r.tipus))
    .slice(0, MAX_VINCLES_PROMPT);
  if (vincles.length > 0) {
    linies.push('', `### ${retols.vincles}`);
    for (const r of vincles) {
      linies.push(`- ${refs.get(r.de)} ${retols.relacions[r.tipus]} ${refs.get(r.a)} ${ETIQUETES_ESTAT[r.estat] ?? ETIQUETES_ESTAT['falta-confirmar']}`);
    }
  }

  if (central) {
    linies.push('', `## ${retols.central}: ${refs.get(central.id)}`);
    linies.push(liniaPersona(central, { ref: refs.get(central.id), protegida: false, idioma: llengua, retols, estat: estatEfectiu(central, alertes), sosa: sosaDe(central.id) }));
    linies.push('', `### ${retols.fonts}`);
    const fonts = (Array.isArray(central.fonts) ? central.fonts : []).slice(0, MAX_FONTS_PROMPT);
    if (fonts.length === 0) linies.push(retols.senseFonts);
    for (const font of fonts) {
      const trossos = [liniaNeta(font.titol, 200), liniaNeta(font.citacio, 500), liniaNeta(font.url, 2048) || retols.senseUrl]
        .filter((tros) => tros.length > 0);
      linies.push(`- ${trossos.join(' · ')}`);
      const transcripcio = plantillaId === 'transcripcio' ? liniaNeta(font.transcripcio, 4000) : '';
      if (transcripcio) linies.push(`  ${retols.transcripcio}: ${transcripcio}`);
    }
  }

  const triat = arxiuPerId(arxiuId);
  const anyCentral = central && central.naixement ? intervalAny(central.naixement)?.max ?? null : null;
  const arxius = triat ? [triat] : central ? arxiusPer({ any: anyCentral }) : ARXIUS;
  linies.push('', `## ${retols.arxius}`, ...liniesArxius(arxius, llengua, retols));
  linies.push('', `## ${retols.format}`, omple(plantilla.format, valors));

  const avisos = ['cerca-web', 'url-verificable'];
  if (ocultes > 0) avisos.push('vius-ocults');
  avisos.push('sense-garantia');
  return { ok: true, motiu: null, text: linies.join('\n'), ocultes, avisos };
}
