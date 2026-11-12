/**
 * Documentació històrica, registral i estatutària pública de l'Associació
 * «Rentonar, Grup per la Conservació de la Natura i el Patrimoni»
 * (La Torre de les Maçanes, l'Alacantí · 1994–2026).
 *
 * Fonts primàries contrastades:
 *   1. Certificació registral i Estatuts segellats (Llei Orgànica 1/2002):
 *      Registre Autonòmic d'Associacions de la Comunitat Valenciana, Unitat
 *      Territorial d'Alacant, núm. 4444 de la Secció Primera (Resolució de la
 *      Direcció General de Justícia i Interior de 17/11/2006; diligència de
 *      08/03/2007; Assemblea d'adaptació de 06/03/2004).
 *   2. Crònica fundacional i arxiu públic d'El Rentonar (1994–2024):
 *      constitució del 22/10/1994 (legalització del 22/11/1994), Ordenança
 *      Municipal d'Arbres d'Interés Local (07/09/2007), Assemblea Pública de
 *      Reconstrucció Forestal «Poc a poc s'encén el foc» (06/10/2012) i
 *      Catàleg dels 19 Arbres Singulars (2020) + crònica «La Xilella arriba al
 *      Cipreret» (22/09/2024).
 *   3. Model d'Acta d'Assemblea General Extraordinària (2026): redactat per Sóc
 *      de Poble, amb marcadors oberts; no és cap acta aprovada.
 *
 * Arbitratge R17.3 (P1) · Zero PII i zero identificadors sense font: el codi
 * públic no porta noms de persones particulars signants, ni cap DNI/NIF, ni
 * domicilis particulars, ni identificadors (D-U-N-S, expedients de marca,
 * correus o acreditacions) que no tinguen una font al repositori. El CIF de
 * l'entitat casa amb src/sections/text/legalContent.js.
 */

export const ATRIBUCIO_RENTONAR =
  'CC BY-NC-SA 4.0 Pedro Ferrer Rodriguez · El Rentonar. Natura i Patrimoni.';

export const FITXA_REGISTRAL_RENTONAR = Object.freeze({
  denominacioOficial: 'RENTONAR, GRUP PER LA CONSERVACIO DE LA NATURA I EL PATRIMONI',
  denominacioFundacional1994: 'Rentonar, Grup de Voluntaris contra Incendis',
  dataConstitucio: '22/10/1994',
  dataLegalitzacioInicial: '22/11/1994',
  dataAdaptacioEstatutaria: '06/03/2004',
  registreAutonomic: 'Registre Autonòmic d’Associacions de la Comunitat Valenciana · Unitat Territorial d’Alacant',
  numeroRegistre: '4444 · Secció Primera',
  resolucioInscripcio: 'Resolució de la Direcció General de Justícia i Interior de 17/11/2006 (diligència a Alacant de 08/03/2007)',
  cifEntitat: 'G-03967668',
  domiciliEstatutariPublic: 'Avda. País Valencià, s/n · 03108 La Torre de les Maçanes (Alacant)',
  ambitTerritorial: 'Comunitat Valenciana (amb arrelament principal a La Torre de les Maçanes)',
  regimCarrecs: 'Sense ànim de lucre · Tots els càrrecs de la Junta Directiva són gratuïts i no retribuïts (Art. 15 Estatuts)',
  atribucio: ATRIBUCIO_RENTONAR
});

export const CRONOLOGIA_HISTORICA_RENTONAR = Object.freeze([
  Object.freeze({
    id: '1994-fundacio',
    periode: '1994 (22/10/1994 – 22/11/1994)',
    titol: 'Fundació veïnal com a Grup de Voluntaris contra Incendis',
    resum:
      'Naixement a La Torre de les Maçanes arran de la mobilització veïnal per a protegir les serres de la Grana, el Rentonar i els plans forestals del terme davant els incendis estivals. Constituïda el 22 d’octubre de 1994 i legalitzada el 22 de novembre de 1994.'
  }),
  Object.freeze({
    id: '2004-2007-estatuts',
    periode: '2004–2007 (06/03/2004 – 08/03/2007)',
    titol: 'Refundació estatutària: Natura i Patrimoni (Secció 1a · núm. 4444)',
    resum:
      'L’Assemblea General del 6 de març de 2004 adapta els Estatuts a la Llei Orgànica 1/2002 sota la denominació «Rentonar, Grup per la Conservació de la Natura i el Patrimoni», ampliant els fins a la investigació històrica, etnobotànica, arqueològica i etnològica. Inscrita per Resolució de 17/11/2006 i diligenciada a Alacant el 08/03/2007.'
  }),
  Object.freeze({
    id: '2007-cataleg-ordenanca',
    periode: '2007 (07/09/2007)',
    titol: 'Primer Catàleg d’Arbres d’Interés Local i Ordenança Municipal de Protecció',
    resum:
      'Inventari de camp pioner dels arbres monumentals i singulars del terme municipal i impulsió tècnica de l’Ordenança Municipal de Protecció d’Arbres d’Interés Local aprovada pel Ple de l’Ajuntament de La Torre de les Maçanes el 7 de setembre de 2007.'
  }),
  Object.freeze({
    id: '2012-foc-assemblea',
    periode: '2012 (01/09/2012 – 06/10/2012)',
    titol: 'Assemblea Pública «Poc a poc s’encén el foc: Reinventant el futur del nostre entorn»',
    resum:
      'Després del devastador incendi forestal d’agost de 2012, El Rentonar participa en la 9a Assemblea per la Defensa del Territori (Muro, 01/09/2012) i convoca a la Casa de Cultura de La Torre de les Maçanes (06/10/2012) la reunió oberta i constitutiva per a planificar la restauració ecològica, la custòdia del bosc i la prevenció comunitària.'
  }),
  Object.freeze({
    id: '2020-2024-arbres-xylella',
    periode: '2020–2024 (Catàleg 2020 · 01/08/2024 · 22/09/2024)',
    titol: 'Segon Catàleg dels 19 Arbres Singulars, 30é Aniversari i Alerta per Xylella',
    resum:
      'Publicació el 2020 de l’edició revisada i ampliada de 144 pàgines amb els 19 arbres i arbredes singulars del terme, celebració dels 30 anys de trajectòria associativa (agost de 2024) i comunicació pública, el 22 de setembre de 2024, del contagi per Xylella fastidiosa de l’Alborç del Xipreret i de diversos arbres del voltant.'
  }),
  Object.freeze({
    id: '2026-socdepoble',
    periode: '2026 (21/02/2026 – actualitat)',
    titol: 'Etapa Tecnològica i Cultural Oberta · Projecte Sóc de Poble',
    resum:
      'Entitat sense ànim de lucre validada per TechSoup i Goodstack (com recull l’avís legal de socdepoble.org) i paraigua associatiu i cultural de la biblioteca digital comunitària Sóc de Poble (socdepoble.org), preservant el coneixement rural en codi lliure i dades obertes.'
  })
]);

export const ESTATUTS_VIGENTS_RENTONAR = Object.freeze({
  marcLegal: 'Llei Orgànica 1/2002, de 22 de març, reguladora del Dret d’Associació, i Llei 14/2008 d’Associacions de la Comunitat Valenciana.',
  finsArticle4: Object.freeze([
    'Defensar el medi ambient i el patrimoni històric-cultural en general.',
    'Estudiar i divulgar tots els aspectes relacionats amb el nostre entorn natural i cultural.',
    'Conscienciar la població sobre el valor ecològic de la natura i la importància del patrimoni cultural com a senya d’identitat dels pobles.',
    'Promoure actituds de respecte envers la natura i el patrimoni en tots els àmbits socials i especialment entre els joves.'
  ]),
  activitatsArticle5: Object.freeze([
    'Vigilància ambiental i prevenció d’incendis forestals, neteja de fonts, sendes i paratges naturals.',
    'Repoblacions amb espècies autòctones, col·locació de caixes-niu i seguiment de flora i fauna amenaçada.',
    'Catalogació d’arbres monumentals, herbaris etnobotànics, forns de calç, pous de neu, masies i camins tradicionals.',
    'Excursions guiades, xarrades divulgatives, exposicions fotogràfiques, edició de publicacions i col·laboració amb centres educatius i institucions públiques.'
  ]),
  capitols: Object.freeze([
    Object.freeze({
      capitol: 'Capítol I (Arts. 1–5) · Denominació, Domicili, Àmbit, Fins i Activitats',
      contingut:
        'Constituïda amb personalitat jurídica pròpia i plena capacitat d’obrar, sense ànim de lucre i per temps indefinit. Domicili a l’Avda. País Valencià, s/n (03108 La Torre de les Maçanes) i àmbit principal a la Comunitat Valenciana.'
    }),
    Object.freeze({
      capitol: 'Capítol II (Arts. 6–9) · Persones Associades, Drets i Deures',
      contingut:
        'Poden formar part totes les persones físiques i jurídiques amb capacitat d’obrar que compartisquen els fins estatutaris. Dret de veu i vot en l’Assemblea General, accés transparent a l’estat de comptes i participació activa en els grups de treball.'
    }),
    Object.freeze({
      capitol: 'Capítol III (Arts. 10–20) · L’Assemblea General i l’Òrgan de Representació',
      contingut:
        'L’Assemblea General és l’òrgan suprem de govern (reunió ordinària anual i extraordinàries quan ho sol·licite l’òrgan de representació o el 10% dels socis). La Junta Directiva (Presidència, Vicepresidència, Secretaria, Tresoreria i Vocalies) és elegida per sufragi lliure per mandats de 4 anys; tots els càrrecs són gratuïts (Art. 15).'
    }),
    Object.freeze({
      capitol: 'Capítol IV–VI (Arts. 21–28) · Règim Econòmic, Documental i Dissolució',
      contingut:
        'Patrimoni fundacional zero i tancament d’exercici anual a 31 de desembre. Els recursos provenen de quotes, subvencions públiques, donacions i convenis culturals. En cas de dissolució (Art. 27), el romanent líquid es destina íntegrament a entitats publiques o no lucratives de conservació ambiental i patrimonial al mateix municipi o comarca.'
    })
  ])
});

const RESULTAT_VOTACIO = '[Resultat de la votació: vots a favor / en contra / abstencions]';
const PERSONA_DESIGNADA = '[Persona o càrrec designat]';

/* Arbitratge R17.3 (P1) · Model redactat per Sóc de Poble: cada acord queda obert (resultat de la votació i
   persones designades per omplir). No és cap acta aprovada ni s'atribuïx a l'autoria d'El Rentonar. */
export const PLANTILLA_ACTA_ASSEMBLEA_RENTONAR = Object.freeze({
  titol: 'Model Institucional d’Acta d’Assemblea General Extraordinària',
  subtitol: 'Renovació de Junta Directiva, coordinació tècnica del projecte Sóc de Poble i cessió no exclusiva d’ús de la marca',
  avisModel: 'Model redactat per Sóc de Poble; no és cap acta aprovada.',
  notaCustodiaRgpd:
    'Plantilla pública sanejada segons RGPD: les dades identificatives personals (DNI/NIF i domicilis particulars dels membres de Junta) només es consignen a l’exemplar original signat i custodiat al Llibre Oficial d’Actes de l’Associació per a la seua inscripció al Registre Autonòmic d’Associacions de la GVA.',
  encapcalament:
    'A La Torre de les Maçanes (l’Alacantí), sent les [HH:MM] hores del dia [DD/MM/AAAA], a la seu social de l’entitat «RENTONAR, GRUP PER LA CONSERVACIO DE LA NATURA I EL PATRIMONI» (CIF G-03967668 · Registre Autonòmic d’Associacions GVA núm. 4444 Secció Primera), es reunixen en Assemblea General Extraordinària les persones sòcies prèviament convocades en temps i forma estatutaris.',
  ordreDelDia: Object.freeze([
    Object.freeze({
      punt: 'Primer · Constitució de la Mesa i verificació d’assistència',
      acord:
        'Verificació del quòrum d’assistència conforme als articles 11 i 12 dels Estatuts vigents: [Nombre de persones sòcies presents i representades].'
    }),
    Object.freeze({
      punt: 'Segon · Renovació i actualització de la Junta Directiva (Òrgan de Representació)',
      acord:
        `Proposta de renovació dels càrrecs de Presidència, Vicepresidència, Secretaria, Tresoreria i Vocalies per a un mandat estatutari de quatre anys, amb el caràcter gratuït i no retribuït de tots els càrrecs (Art. 15 dels Estatuts). ${RESULTAT_VOTACIO} · ${PERSONA_DESIGNADA} per a cada càrrec. Les dades registrals completes es recullen al certificat d’inscripció destinat a la Unitat Territorial d’Alacant.`
    }),
    Object.freeze({
      punt: 'Tercer · Adopció institucional de la plataforma cultural «Sóc de Poble» i coordinació tècnica',
      acord:
        `Proposta d’impulsar, dins dels fins estatutaris dels articles 4 i 5 (estudi, catalogació i divulgació del patrimoni natural, etnobotànic i cultural), el projecte tecnològic i comunitari obert «Sóc de Poble» (socdepoble.org), i de designar-ne la coordinació tècnica en règim de voluntariat associatiu no retribuït. ${RESULTAT_VOTACIO} · ${PERSONA_DESIGNADA}.`
    }),
    Object.freeze({
      punt: 'Quart · Recepció d’autorització d’ús gratuït i no exclusiu de la marca «Sóc de Poble»',
      acord:
        `Proposta d’acceptar la cessió d’ús gratuïta, no exclusiva i revocable de la denominació i identitat gràfica «Sóc de Poble» per a les activitats culturals, educatives i de recerca comunitària de l’Associació, mantenint-ne la titularitat separada del patrimoni associatiu. ${RESULTAT_VOTACIO}.`
    }),
    Object.freeze({
      punt: 'Cinqué · Facultació per a elevar acords i inscriure’ls al Registre Autonòmic (GVA)',
      acord:
        `Proposta de facultar la Presidència i la Secretaria entrants per a expedir les certificacions corresponents amb el vistiplau dels càrrecs sortints i tramitar-ne la inscripció telemàtica davant el Registre Autonòmic d’Associacions de la Generalitat Valenciana. ${RESULTAT_VOTACIO}.`
    })
  ]),
  peuSignatura:
    'I no havent-hi més assumptes a tractar, s’alça la sessió sent les [HH:MM] hores del mateix dia, estenent-se la present acta que signen la Secretaria amb el vistiplau de la Presidència. — El Secretari / La Secretària · Vistiplau: El President / La Presidenta.'
});
