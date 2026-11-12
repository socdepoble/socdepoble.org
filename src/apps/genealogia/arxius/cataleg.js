/**
 * Arbre Genealògic · catàleg d'arxius públics (P0-114, grup «arxius»).
 *
 * Una llista TANCADA d'arxius on una persona pot buscar els seus
 * avantpassats. L'app no hi cerca per ella: ensenya què hi ha, com s'hi
 * entra i genera consultes i prompts que la persona copia.
 *
 * Tractor-promesa: només porta enllaç actiu una adreça que sabem que
 * existix i que és la portada de l'organisme o una pàgina pública estable.
 * Les que ningú no ha confirmat (ARV/SAVEX, AHP, parròquies i padrons) van
 * amb `url: null` i `verificar: true`, i `comAccedir` explica on trobar-les.
 * L'app mai inventa una adreça: tota `url` passa per `adrecaOficial`, que
 * exigix https, cap credencial i un domini de DOMINIS_OFICIALS; si no,
 * el mòdul no carrega (falla en calent, no en silenci).
 *
 * Sense dependències, sense xarxa, sense regex.
 */

export const DOMINIS_OFICIALS = Object.freeze([
  'pares.cultura.gob.es',
  'censoarchivos.mcu.es',
  'prensahistorica.mcu.es',
  'bvpb.mcu.es',
  'www.familysearch.org',
  'sede.mjusticia.gob.es',
  'www.ine.es'
]);

export const AMBITS = Object.freeze(['estatal', 'autonomic', 'provincial', 'diocesa', 'municipal', 'internacional']);
export const REGISTRES = Object.freeze(['baptisme', 'matrimoni', 'defuncio', 'padro', 'notarial', 'militar', 'premsa', 'emigracio']);
export const ACCESSOS = Object.freeze(['en-linia', 'parcial', 'presencial']);
const LLENGUES = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

/** true si `valor` és una adreça https, sense credencials ni port, d'un domini de la llista tancada. */
export function esAdrecaOficial(valor) {
  if (typeof valor !== 'string' || valor.length === 0 || valor.length > 2048) return false;
  let url;
  try {
    url = new URL(valor);
  } catch {
    return false;
  }
  return url.protocol === 'https:' && url.username === '' && url.password === '' && url.port === ''
    && DOMINIS_OFICIALS.includes(url.hostname);
}

function adrecaOficial(valor) {
  if (valor === null) return null;
  if (!esAdrecaOficial(valor)) throw new TypeError('genealogia/arxius: adreça fora de la llista tancada');
  return valor;
}

function textos(objecte) {
  for (const llengua of LLENGUES) {
    if (typeof objecte[llengua] !== 'string' || objecte[llengua].length === 0) {
      throw new TypeError(`genealogia/arxius: falta el text en ${llengua}`);
    }
  }
  return Object.freeze({ ca: objecte.ca, es: objecte.es, en: objecte.en, eu: objecte.eu, gl: objecte.gl });
}

function arxiu(dades) {
  if (!AMBITS.includes(dades.ambit)) throw new TypeError('genealogia/arxius: àmbit desconegut');
  if (!ACCESSOS.includes(dades.acces)) throw new TypeError('genealogia/arxius: accés desconegut');
  if (!dades.registres.every((r) => REGISTRES.includes(r))) throw new TypeError('genealogia/arxius: registre desconegut');
  const url = adrecaOficial(dades.url);
  return Object.freeze({
    id: dades.id,
    nom: textos(dades.nom),
    url,
    // Sense adreça confirmada, sempre s'ha de verificar.
    verificar: url === null ? true : Boolean(dades.verificar),
    ambit: dades.ambit,
    periode: Object.freeze({ des: dades.periode.des, fins: dades.periode.fins }),
    registres: Object.freeze([...dades.registres]),
    acces: dades.acces,
    que: textos(dades.que),
    comAccedir: textos(dades.comAccedir),
    consell: textos(dades.consell)
  });
}

export const ARXIUS = Object.freeze([
  arxiu({
    id: 'pares',
    nom: {
      ca: 'PARES · Portal d’Arxius Espanyols',
      es: 'PARES · Portal de Archivos Españoles',
      en: 'PARES · Spanish Archives Portal',
      eu: 'PARES · Espainiako Artxiboen Ataria',
      gl: 'PARES · Portal de Arquivos Españois'
    },
    url: 'https://pares.cultura.gob.es/',
    verificar: false,
    ambit: 'estatal',
    periode: { des: null, fins: null },
    registres: ['emigracio'],
    acces: 'parcial',
    que: {
      ca: 'Descripcions i imatges digitalitzades dels arxius estatals (entre altres, l’Arxiu de la Corona d’Aragó, l’Arxiu Històric Nacional, Simancas i Índies): plets, expedients i registres d’emigració.',
      es: 'Descripciones e imágenes digitalizadas de los archivos estatales (entre otros, el Archivo de la Corona de Aragón, el Archivo Histórico Nacional, Simancas e Indias): pleitos, expedientes y registros de emigración.',
      en: 'Descriptions and digitised images from the Spanish state archives (among others, the Crown of Aragon Archive, the National Historical Archive, Simancas and the Indies): lawsuits, files and emigration records.',
      eu: 'Estatuko artxiboetako deskribapenak eta irudi digitalizatuak (besteak beste, Aragoiko Koroaren Artxiboa, Artxibo Historiko Nazionala, Simancas eta Indiak): auziak, espedienteak eta emigrazio-erregistroak.',
      gl: 'Descricións e imaxes dixitalizadas dos arquivos estatais (entre outros, o Arquivo da Coroa de Aragón, o Arquivo Histórico Nacional, Simancas e Indias): preitos, expedientes e rexistros de emigración.'
    },
    comAccedir: {
      ca: 'Obri la portada de PARES; l’adreça antiga pares.mcu.es porta al mateix portal. La cerca és gratuïta i, per a algunes imatges, pot caldre un registre gratuït.',
      es: 'Abre la portada de PARES; la dirección antigua pares.mcu.es lleva al mismo portal. La búsqueda es gratuita y, para algunas imágenes, puede hacer falta un registro gratuito.',
      en: 'Open the PARES home page; the old address pares.mcu.es leads to the same portal. Searching is free and some images may require a free registration.',
      eu: 'Ireki PARESen azala; pares.mcu.es helbide zaharrak ataria berera darama. Bilaketa doakoa da, eta irudi batzuetarako doako erregistroa behar izan daiteke.',
      gl: 'Abre a portada de PARES; o enderezo antigo pares.mcu.es leva ao mesmo portal. A busca é de balde e, para algunhas imaxes, pode facer falta un rexistro gratuíto.'
    },
    consell: {
      ca: 'Cerca pel cognom i el poble i filtra per arxiu. Anota la signatura o el codi de referència de cada document: és el que fa la dada verificable.',
      es: 'Busca por apellido y pueblo y filtra por archivo. Anota la signatura o el código de referencia de cada documento: es lo que hace el dato verificable.',
      en: 'Search by surname and village and filter by archive. Note the call number or reference code of each document: it is what makes the fact verifiable.',
      eu: 'Bilatu abizenaren eta herriaren arabera eta iragazi artxiboaren arabera. Idatzi dokumentu bakoitzaren signatura edo erreferentzia-kodea: horrek egiten du datua egiaztagarri.',
      gl: 'Busca polo apelido e a vila e filtra por arquivo. Anota a sinatura ou o código de referencia de cada documento: é o que fai o dato verificable.'
    }
  }),
  arxiu({
    id: 'arv-savex',
    nom: {
      ca: 'Arxiu del Regne de València (SAVEX)',
      es: 'Archivo del Reino de Valencia (SAVEX)',
      en: 'Archive of the Kingdom of Valencia (SAVEX)',
      eu: 'Valentziako Erresumako Artxiboa (SAVEX)',
      gl: 'Arquivo do Reino de Valencia (SAVEX)'
    },
    url: null,
    verificar: true,
    ambit: 'autonomic',
    periode: { des: null, fins: null },
    registres: ['notarial'],
    acces: 'parcial',
    que: {
      ca: 'Documentació de les institucions històriques del Regne de València i fons notarials (testaments, capítols matrimonials, compravendes). Molt útil abans del Registre Civil.',
      es: 'Documentación de las instituciones históricas del Reino de Valencia y fondos notariales (testamentos, capitulaciones matrimoniales, compraventas). Muy útil antes del Registro Civil.',
      en: 'Records of the historical institutions of the Kingdom of Valencia and notarial collections (wills, marriage contracts, sales). Very useful before the Civil Registry.',
      eu: 'Valentziako Erresumako erakunde historikoen dokumentazioa eta notario-funtsak (testamentuak, ezkontza-itunak, salerosketak). Oso baliagarria Erregistro Zibilaren aurretik.',
      gl: 'Documentación das institucións históricas do Reino de Valencia e fondos notariais (testamentos, capitulacións matrimoniais, compravendas). Moi útil antes do Rexistro Civil.'
    },
    comAccedir: {
      ca: 'L’adreça oficial encara s’ha de verificar, i per això l’app no hi posa cap enllaç. Busca «Arxiu del Regne de València» al Censo-guía d’Arxius o a la web de la Generalitat Valenciana.',
      es: 'La dirección oficial aún debe verificarse, y por eso la app no pone ningún enlace. Busca «Archivo del Reino de Valencia» en el Censo-guía de Archivos o en la web de la Generalitat Valenciana.',
      en: 'The official address still has to be verified, so the app shows no link. Look up “Archivo del Reino de Valencia” in the Censo-guía de Archivos or on the Generalitat Valenciana website.',
      eu: 'Helbide ofiziala oraindik egiaztatu behar da, eta horregatik aplikazioak ez du estekarik jartzen. Bilatu «Archivo del Reino de Valencia» Artxiboen Censo-guían edo Generalitat Valencianaren webgunean.',
      gl: 'O enderezo oficial aínda se debe verificar, e por iso a app non pon ningunha ligazón. Busca «Archivo del Reino de Valencia» no Censo-guía de Arquivos ou na web da Generalitat Valenciana.'
    },
    consell: {
      ca: 'Abans d’anar-hi, prepara els cognoms, el poble i l’interval d’anys. Els inventaris et diuen quin fons i quina caixa has de demanar.',
      es: 'Antes de ir, prepara los apellidos, el pueblo y el intervalo de años. Los inventarios te dicen qué fondo y qué caja debes pedir.',
      en: 'Before you go, prepare the surnames, the village and the range of years. The inventories tell you which collection and which box to request.',
      eu: 'Joan aurretik, prestatu abizenak, herria eta urte-tartea. Inbentarioek esaten dizute zein funts eta zein kutxa eskatu.',
      gl: 'Antes de ir, prepara os apelidos, a vila e o intervalo de anos. Os inventarios dinche que fondo e que caixa debes pedir.'
    }
  }),
  arxiu({
    id: 'ahp',
    nom: {
      ca: 'Arxius Històrics Provincials',
      es: 'Archivos Históricos Provinciales',
      en: 'Provincial Historical Archives',
      eu: 'Probintziako Artxibo Historikoak',
      gl: 'Arquivos Históricos Provinciais'
    },
    url: null,
    verificar: true,
    ambit: 'provincial',
    periode: { des: null, fins: null },
    registres: ['notarial'],
    acces: 'presencial',
    que: {
      ca: 'Protocols notarials de més de cent anys (testaments, inventaris, capítols matrimonials) i fons d’Hisenda de la província.',
      es: 'Protocolos notariales de más de cien años (testamentos, inventarios, capitulaciones matrimoniales) y fondos de Hacienda de la provincia.',
      en: 'Notarial records older than a hundred years (wills, inventories, marriage contracts) and the province’s Treasury collections.',
      eu: 'Ehun urtetik gorako notario-protokoloak (testamentuak, inbentarioak, ezkontza-itunak) eta probintziako Ogasunaren funtsak.',
      gl: 'Protocolos notariais de máis de cen anos (testamentos, inventarios, capitulacións matrimoniais) e fondos de Facenda da provincia.'
    },
    comAccedir: {
      ca: 'Cada província en té un. L’app no hi posa enllaç: busca’l al Censo-guía d’Arxius pel nom de la província, on hi ha l’adreça i l’horari.',
      es: 'Cada provincia tiene uno. La app no pone enlace: búscalo en el Censo-guía de Archivos por el nombre de la provincia, donde constan la dirección y el horario.',
      en: 'Each province has one. The app shows no link: look it up in the Censo-guía de Archivos by the name of the province, where the address and opening hours are listed.',
      eu: 'Probintzia bakoitzak bat du. Aplikazioak ez du estekarik jartzen: bilatu Artxiboen Censo-guían probintziaren izenaren arabera; han daude helbidea eta ordutegia.',
      gl: 'Cada provincia ten un. A app non pon ligazón: búscao no Censo-guía de Arquivos polo nome da provincia, onde constan o enderezo e o horario.'
    },
    consell: {
      ca: 'Els protocols s’ordenen per notari i any: esbrina primer quin notari treballava al poble en eixos anys.',
      es: 'Los protocolos se ordenan por notario y año: averigua primero qué notario trabajaba en el pueblo en esos años.',
      en: 'Notarial records are arranged by notary and year: first find out which notary worked in the village in those years.',
      eu: 'Protokoloak notarioaren eta urtearen arabera ordenatzen dira: jakin lehenik zein notariok egiten zuen lan herrian urte haietan.',
      gl: 'Os protocolos ordénanse por notario e ano: descobre primeiro que notario traballaba na vila neses anos.'
    }
  }),
  arxiu({
    id: 'quinque-libri',
    nom: {
      ca: 'Llibres parroquials (Quinque Libri)',
      es: 'Libros parroquiales (Quinque Libri)',
      en: 'Parish registers (Quinque Libri)',
      eu: 'Parrokia-liburuak (Quinque Libri)',
      gl: 'Libros parroquiais (Quinque Libri)'
    },
    url: null,
    verificar: true,
    ambit: 'diocesa',
    periode: { des: null, fins: null },
    registres: ['baptisme', 'matrimoni', 'defuncio', 'padro'],
    acces: 'presencial',
    que: {
      ca: 'Baptismes, confirmacions, matrimonis, defuncions i llibres d’estat d’ànimes de cada parròquia. Són la font principal d’abans del Registre Civil (1871).',
      es: 'Bautismos, confirmaciones, matrimonios, defunciones y libros de estado de almas de cada parroquia. Son la fuente principal de antes del Registro Civil (1871).',
      en: 'Baptisms, confirmations, marriages, burials and status animarum books of each parish. They are the main source before the Civil Registry (1871).',
      eu: 'Parrokia bakoitzeko bataioak, konfirmazioak, ezkontzak, heriotzak eta arima-egoeren liburuak. Erregistro Zibilaren (1871) aurreko iturri nagusia dira.',
      gl: 'Bautismos, confirmacións, matrimonios, defuncións e libros de estado de almas de cada parroquia. Son a fonte principal de antes do Rexistro Civil (1871).'
    },
    comAccedir: {
      ca: 'Es guarden a la parròquia o a l’arxiu diocesà del bisbat. Localitza’ls al Censo-guía d’Arxius; molts estan microfilmats i es poden consultar al catàleg de FamilySearch.',
      es: 'Se guardan en la parroquia o en el archivo diocesano del obispado. Localízalos en el Censo-guía de Archivos; muchos están microfilmados y se pueden consultar en el catálogo de FamilySearch.',
      en: 'They are kept at the parish or at the diocesan archive. Locate them in the Censo-guía de Archivos; many have been microfilmed and can be consulted in the FamilySearch catalogue.',
      eu: 'Parrokian edo elizbarrutiko artxiboan gordetzen dira. Aurkitu Artxiboen Censo-guían; asko mikrofilmatuta daude eta FamilySearch-en katalogoan kontsulta daitezke.',
      gl: 'Gárdanse na parroquia ou no arquivo diocesano do bispado. Localízaos no Censo-guía de Arquivos; moitos están microfilmados e pódense consultar no catálogo de FamilySearch.'
    },
    consell: {
      ca: 'Anota sempre els padrins i els testimonis: ajuden a triangular. Transcriu la partida literal, amb l’ortografia original, i marca [il·legible] el que no es llig.',
      es: 'Anota siempre los padrinos y los testigos: ayudan a triangular. Transcribe la partida literal, con la ortografía original, y marca [il·legible] lo que no se lee.',
      en: 'Always note the godparents and the witnesses: they help to triangulate. Transcribe the entry literally, in the original spelling, and mark [il·legible] whatever cannot be read.',
      eu: 'Idatzi beti aitabitxiak eta lekukoak: triangelatzen laguntzen dute. Transkribatu agiria hitzez hitz, jatorrizko ortografiarekin, eta markatu [il·legible] irakurtzen ez dena.',
      gl: 'Anota sempre os padriños e as testemuñas: axudan a triangular. Transcribe a partida literal, coa ortografía orixinal, e marca [il·legible] o que non se le.'
    }
  }),
  arxiu({
    id: 'familysearch',
    nom: {
      ca: 'FamilySearch',
      es: 'FamilySearch',
      en: 'FamilySearch',
      eu: 'FamilySearch',
      gl: 'FamilySearch'
    },
    url: 'https://www.familysearch.org/search/catalog',
    verificar: false,
    ambit: 'internacional',
    periode: { des: null, fins: null },
    registres: ['baptisme', 'matrimoni', 'defuncio', 'padro'],
    acces: 'en-linia',
    que: {
      ca: 'Catàleg gratuït d’imatges i índexs de registres parroquials i civils de tot el món, amb molts llibres microfilmats a Espanya.',
      es: 'Catálogo gratuito de imágenes e índices de registros parroquiales y civiles de todo el mundo, con muchos libros microfilmados en España.',
      en: 'Free catalogue of images and indexes of parish and civil records from around the world, with many books microfilmed in Spain.',
      eu: 'Mundu osoko parrokia- eta erregistro zibileko irudien eta indizeen doako katalogoa, Espainian mikrofilmatutako liburu askorekin.',
      gl: 'Catálogo de balde de imaxes e índices de rexistros parroquiais e civís de todo o mundo, con moitos libros microfilmados en España.'
    },
    comAccedir: {
      ca: 'Cal un compte gratuït per a vore les imatges. Al catàleg, cerca pel nom del poble i tria la parròquia o el registre civil. Algunes imatges només es veuen en un centre o una biblioteca afiliada.',
      es: 'Hace falta una cuenta gratuita para ver las imágenes. En el catálogo, busca por el nombre del pueblo y elige la parroquia o el registro civil. Algunas imágenes solo se ven en un centro o una biblioteca afiliada.',
      en: 'A free account is needed to view images. In the catalogue, search by village name and choose the parish or civil registry. Some images can only be viewed at a centre or an affiliate library.',
      eu: 'Doako kontu bat behar da irudiak ikusteko. Katalogoan, bilatu herriaren izenaren arabera eta aukeratu parrokia edo erregistro zibila. Irudi batzuk zentro edo liburutegi afiliatu batean bakarrik ikus daitezke.',
      gl: 'Fai falta unha conta de balde para ver as imaxes. No catálogo, busca polo nome da vila e escolle a parroquia ou o rexistro civil. Algunhas imaxes só se ven nun centro ou nunha biblioteca afiliada.'
    },
    consell: {
      ca: 'Un índex no és la font: obri sempre la imatge de la partida i copia’n l’adreça i la referència de la imatge o del microfilm.',
      es: 'Un índice no es la fuente: abre siempre la imagen de la partida y copia su dirección y la referencia de la imagen o del microfilm.',
      en: 'An index is not the source: always open the image of the record and copy its address and the image or microfilm reference.',
      eu: 'Indize bat ez da iturria: ireki beti agiriaren irudia eta kopiatu haren helbidea eta irudiaren edo mikrofilmaren erreferentzia.',
      gl: 'Un índice non é a fonte: abre sempre a imaxe da partida e copia o seu enderezo e a referencia da imaxe ou do microfilme.'
    }
  }),
  arxiu({
    id: 'registre-civil',
    nom: {
      ca: 'Registre Civil',
      es: 'Registro Civil',
      en: 'Civil Registry',
      eu: 'Erregistro Zibila',
      gl: 'Rexistro Civil'
    },
    url: 'https://sede.mjusticia.gob.es/',
    verificar: false,
    ambit: 'estatal',
    periode: { des: 1871, fins: null },
    registres: ['baptisme', 'matrimoni', 'defuncio'],
    acces: 'parcial',
    que: {
      ca: 'Inscripcions de naixement, matrimoni i defunció des de 1871.',
      es: 'Inscripciones de nacimiento, matrimonio y defunción desde 1871.',
      en: 'Birth, marriage and death entries since 1871.',
      eu: 'Jaiotza-, ezkontza- eta heriotza-inskripzioak 1871tik.',
      gl: 'Inscricións de nacemento, matrimonio e defunción desde 1871.'
    },
    comAccedir: {
      ca: 'La seu electrònica del Ministeri de Justícia permet demanar certificats. Les inscripcions antigues es guarden al registre civil o al jutjat de pau del municipi.',
      es: 'La sede electrónica del Ministerio de Justicia permite pedir certificados. Las inscripciones antiguas se guardan en el registro civil o en el juzgado de paz del municipio.',
      en: 'The Ministry of Justice e-office lets you request certificates. Old entries are kept at the civil registry or the magistrate’s court of the municipality.',
      eu: 'Justizia Ministerioaren egoitza elektronikoan ziurtagiriak eska daitezke. Inskripzio zaharrak udalerriko erregistro zibilean edo bake-epaitegian gordetzen dira.',
      gl: 'A sede electrónica do Ministerio de Xustiza permite pedir certificados. As inscricións antigas gárdanse no rexistro civil ou no xulgado de paz do concello.'
    },
    consell: {
      ca: 'Demana la certificació literal, que copia tota la inscripció. L’accés a dades de persones vives pot estar limitat per la protecció de dades.',
      es: 'Pide la certificación literal, que copia toda la inscripción. El acceso a datos de personas vivas puede estar limitado por la protección de datos.',
      en: 'Ask for the full (literal) certificate, which copies the whole entry. Access to data about living people may be limited by data protection law.',
      eu: 'Eskatu ziurtagiri literala, inskripzio osoa kopiatzen duena. Bizirik dauden pertsonen datuetarako sarbidea mugatuta egon daiteke datuen babesagatik.',
      gl: 'Pide a certificación literal, que copia toda a inscrición. O acceso a datos de persoas vivas pode estar limitado pola protección de datos.'
    }
  }),
  arxiu({
    id: 'padrons',
    nom: {
      ca: 'Padrons i arxiu municipal',
      es: 'Padrones y archivo municipal',
      en: 'Municipal censuses and archive',
      eu: 'Udal-erroldak eta artxiboa',
      gl: 'Padróns e arquivo municipal'
    },
    url: null,
    verificar: true,
    ambit: 'municipal',
    periode: { des: null, fins: null },
    registres: ['padro', 'militar'],
    acces: 'presencial',
    que: {
      ca: 'Padrons d’habitants, censos i expedients de quintes, a l’arxiu de l’ajuntament.',
      es: 'Padrones de habitantes, censos y expedientes de quintas, en el archivo del ayuntamiento.',
      en: 'Residents’ registers, censuses and military draft files, at the town hall archive.',
      eu: 'Biztanleen erroldak, zentsuak eta soldadutzarako espedienteak, udaletxeko artxiboan.',
      gl: 'Padróns de habitantes, censos e expedientes de quintas, no arquivo do concello.'
    },
    comAccedir: {
      ca: 'L’app no hi posa enllaç: pregunta a l’ajuntament o busca l’arxiu municipal al Censo-guía d’Arxius. Alguns padrons estan digitalitzats per l’ajuntament o la diputació.',
      es: 'La app no pone enlace: pregunta en el ayuntamiento o busca el archivo municipal en el Censo-guía de Archivos. Algunos padrones están digitalizados por el ayuntamiento o la diputación.',
      en: 'The app shows no link: ask at the town hall or look up the municipal archive in the Censo-guía de Archivos. Some censuses have been digitised by the town hall or the provincial council.',
      eu: 'Aplikazioak ez du estekarik jartzen: galdetu udaletxean edo bilatu udal-artxiboa Artxiboen Censo-guían. Errolda batzuk udalak edo foru-aldundiak digitalizatu ditu.',
      gl: 'A app non pon ligazón: pregunta no concello ou busca o arquivo municipal no Censo-guía de Arquivos. Algúns padróns están dixitalizados polo concello ou a deputación.'
    },
    consell: {
      ca: 'El padró diu qui vivia a cada casa i amb quina edat declarada: és una bona prova de la casa, però l’edat sovint és aproximada ([APROXIMAT]).',
      es: 'El padrón dice quién vivía en cada casa y con qué edad declarada: es una buena prueba de la casa, pero la edad a menudo es aproximada ([APROXIMAT]).',
      en: 'The census says who lived in each house and their declared age: good evidence for the house, but the age is often approximate ([APROXIMAT]).',
      eu: 'Erroldak esaten du nor bizi zen etxe bakoitzean eta zein adin aitortu zuen: etxearen froga ona da, baina adina askotan gutxi gorabeherakoa da ([APROXIMAT]).',
      gl: 'O padrón di quen vivía en cada casa e con que idade declarada: é unha boa proba da casa, pero a idade adoita ser aproximada ([APROXIMAT]).'
    }
  }),
  arxiu({
    id: 'bvph',
    nom: {
      ca: 'Biblioteca Virtual de Premsa Històrica',
      es: 'Biblioteca Virtual de Prensa Histórica',
      en: 'Virtual Library of Historical Press',
      eu: 'Prentsa Historikoaren Liburutegi Birtuala',
      gl: 'Biblioteca Virtual de Prensa Histórica'
    },
    url: 'https://prensahistorica.mcu.es/',
    verificar: false,
    ambit: 'estatal',
    periode: { des: null, fins: null },
    registres: ['premsa', 'defuncio'],
    acces: 'en-linia',
    que: {
      ca: 'Diaris i revistes digitalitzats: esqueles, notícies locals i anuncis oficials.',
      es: 'Periódicos y revistas digitalizados: esquelas, noticias locales y anuncios oficiales.',
      en: 'Digitised newspapers and magazines: death notices, local news and official notices.',
      eu: 'Egunkari eta aldizkari digitalizatuak: hilberriak, tokiko albisteak eta iragarki ofizialak.',
      gl: 'Xornais e revistas dixitalizados: esquelas, noticias locais e anuncios oficiais.'
    },
    comAccedir: {
      ca: 'Accés lliure en línia. Cerca pel cognom i el poble i filtra per data.',
      es: 'Acceso libre en línea. Busca por apellido y pueblo y filtra por fecha.',
      en: 'Free online access. Search by surname and village and filter by date.',
      eu: 'Doako sarbidea sarean. Bilatu abizenaren eta herriaren arabera eta iragazi dataren arabera.',
      gl: 'Acceso libre en liña. Busca polo apelido e a vila e filtra por data.'
    },
    consell: {
      ca: 'Una esquela o una notícia apunta dates i parents, però no substituïx la partida: marca-la [APROXIMAT] fins que la contrastes.',
      es: 'Una esquela o una noticia apunta fechas y parientes, pero no sustituye la partida: márcala [APROXIMAT] hasta que la contrastes.',
      en: 'A death notice or a news item points to dates and relatives, but it does not replace the record: mark it [APROXIMAT] until you check it.',
      eu: 'Hilberri edo albiste batek datak eta senideak iradokitzen ditu, baina ez du agiria ordezkatzen: markatu [APROXIMAT] egiaztatu arte.',
      gl: 'Unha esquela ou unha noticia apunta datas e parentes, pero non substitúe a partida: márcaa [APROXIMAT] ata que a contrastes.'
    }
  }),
  arxiu({
    id: 'cens-guia',
    nom: {
      ca: 'Censo-guía d’Arxius d’Espanya i Iberoamèrica',
      es: 'Censo-guía de Archivos de España e Iberoamérica',
      en: 'Census-guide of Archives of Spain and Latin America',
      eu: 'Espainiako eta Iberoamerikako Artxiboen Censo-guía',
      gl: 'Censo-guía de Arquivos de España e Iberoamérica'
    },
    url: 'https://censoarchivos.mcu.es/',
    verificar: false,
    ambit: 'estatal',
    periode: { des: null, fins: null },
    registres: ['baptisme', 'matrimoni', 'defuncio', 'padro', 'notarial', 'militar', 'premsa', 'emigracio'],
    acces: 'en-linia',
    que: {
      ca: 'Directori oficial d’arxius: diu on es guarda cada arxiu parroquial, diocesà, municipal, notarial o provincial, i com contactar-hi.',
      es: 'Directorio oficial de archivos: dice dónde se guarda cada archivo parroquial, diocesano, municipal, notarial o provincial, y cómo contactar.',
      en: 'Official directory of archives: it tells you where each parish, diocesan, municipal, notarial or provincial archive is kept and how to contact it.',
      eu: 'Artxiboen direktorio ofiziala: parrokia-, elizbarruti-, udal-, notario- edo probintzia-artxibo bakoitza non gordetzen den eta nola harremanetan jarri esaten du.',
      gl: 'Directorio oficial de arquivos: di onde se garda cada arquivo parroquial, diocesano, municipal, notarial ou provincial, e como contactar.'
    },
    comAccedir: {
      ca: 'Cerca pel municipi o pel nom de l’arxiu i anota l’adreça i l’horari que hi consten.',
      es: 'Busca por el municipio o por el nombre del archivo y anota la dirección y el horario que constan.',
      en: 'Search by municipality or archive name and note the address and opening hours listed.',
      eu: 'Bilatu udalerriaren edo artxiboaren izenaren arabera eta idatzi agertzen diren helbidea eta ordutegia.',
      gl: 'Busca polo concello ou polo nome do arquivo e anota o enderezo e o horario que constan.'
    },
    consell: {
      ca: 'Comença ací quan no saps on són els llibres d’una parròquia o els padrons d’un poble.',
      es: 'Empieza aquí cuando no sabes dónde están los libros de una parroquia o los padrones de un pueblo.',
      en: 'Start here when you do not know where a parish’s books or a village’s censuses are kept.',
      eu: 'Hasi hemen parrokia baten liburuak edo herri baten erroldak non dauden ez dakizunean.',
      gl: 'Comeza aquí cando non sabes onde están os libros dunha parroquia ou os padróns dunha vila.'
    }
  })
]);

const PER_ID = new Map(ARXIUS.map((a) => [a.id, a]));

/** L'arxiu amb eixe id, o null (cap accés per clau d'objecte: només el Map). */
export function arxiuPerId(id) {
  if (typeof id !== 'string') return null;
  return PER_ID.get(id) ?? null;
}

export const esArxiu = (valor) => ARXIUS.some((a) => a.id === valor);

/**
 * Els arxius que valen per a un any i un tipus de registre. Sense `any`, no
 * filtra per període; sense `registre`, no filtra per tipus. El Registre
 * Civil només hi entra si l'any és 1871 o posterior.
 */
export function arxiusPer({ any = null, registre = null } = {}) {
  const anyValid = typeof any === 'number' && Number.isSafeInteger(any) ? any : null;
  const registreValid = typeof registre === 'string' && REGISTRES.includes(registre) ? registre : null;
  return ARXIUS.filter((a) => {
    if (registreValid !== null && !a.registres.includes(registreValid)) return false;
    if (anyValid !== null) {
      if (a.periode.des !== null && anyValid < a.periode.des) return false;
      if (a.periode.fins !== null && anyValid > a.periode.fins) return false;
    }
    return true;
  });
}
