/**
 * iaiaRebostRural.js — el rebost rural de la IAIA MarIA (P1-24, Onada 2).
 *
 * Kit Onada 2 de Codex (261101), auditat i integrat per Claude · Càpsules
 * curades de cultura rural i d'ús quotidià que la IAIA diu senceres al fil,
 * sense xarxa, quan l'Atles Operatiu (iaiaLocal.js) no sap la pregunta i
 * abans de baixar la Wiki. Es busquen en un índex curat a part
 * (iaiaLocal.js · cercaAlRebostRural): no alteren el rànquing de l'Atles.
 *
 * QUÈ DIUEN
 *   Dos fets culturals, amb la seua font (consultades l'01-11-2026): la
 *   pedra seca (UNESCO) i la pilota valenciana (Ministeri de Cultura). La
 *   resta són criteris editorials per a documentar la memòria del poble i
 *   per a preparar textos veïnals: cap fet històric, cap instrucció legal,
 *   cap horari ni cap agenda. Quan diuen què fa Sóc de Poble, és el que fa
 *   hui (fontEditorial nomena la peça): la IAIA no publica, no envia, no
 *   reserva i no valida res; qui publica és la persona, al Mur o al Mercat.
 *   El Bloc de Notes és privat; cap càpsula no promet cap col·lecció de
 *   memòria oral (atles:patrimoni_fonts diu que encara no n'hi ha).
 *
 * COM ES TROBEN
 *   `claus` són les etiquetes de l'índex. Una pregunta d'una sola paraula
 *   només troba una càpsula si la paraula és, tal qual, una de les seues
 *   claus: «trobe» fa l'arrel de «trobada», i «eines», «partides» o «dites»
 *   diuen massa coses. `minimTermes` demana més arrels distintes: «pedra»
 *   sola (o «pedra pedres») és la de les proves de la Wiki, «perdut» sol és
 *   també Animalets i «oficis» sol, Treball. `exclou` porta la pregunta a un
 *   altre tema: «Pedra Seca» és també el mètode i el sistema de disseny de
 *   Sóc de Poble, i d'això en respon la Wiki; «treball d'ofici» o
 *   «entrevista de treball» són de feina, i «la recepta del metge», de salut.
 *   Amb tres paraules o més, la càpsula n'ha de mostrar més de la meitat
 *   (iaiaLocal.js · cercaAlRebostRural).
 *
 * Cap entrada passa de MAXIM_FRAGMENT_DE_L_ATLES caràcters, i cap porta
 * marcatge, adreces web ni correus (iaiaRebostRural.test.js ho vigila).
 */
export const CAPSULES_RURALS = Object.freeze([
  {
    id: 'rebost:pedra_seca', titol: 'Pedra seca i marges', ruta: '/notes', claus: ['pedra seca', 'marges', 'marge'], minimTermes: 2,
    exclou: ['mètode', 'disseny', 'sistema', 'llibre', 'lleis', 'integració', 'tokens', 'components', 'codi', 'reglament'],
    paragrafs: [
      "Els marges de pedra seca s'alcen encaixant pedres sense morter, un saber transmés amb la pràctica que la UNESCO reconeix com a patrimoni immaterial. Per a documentar-ne un, fotografia'l sense moure cap pedra i anota el nom del lloc; per a arreglar-lo cal una persona d'ofici.",
      "A Sóc de Poble, «Pedra Seca» també és el nom del mètode de treball i del sistema de disseny, que en prenen la idea: peces que encaixen sense ciment. D'això en parla la Wiki de Poble."
    ],
    fontEditorial: 'https://ich.unesco.org/en/RL/art-of-dry-stone-construction-knowledge-and-techniques-02106 · .agents/QUI_SOC.md (§1)'
  },
  {
    id: 'rebost:pilota', titol: 'Pilota valenciana i trinquet', ruta: '/calendari', claus: ['pilota', 'trinquet', 'trinquets'],
    paragrafs: [
      "La pilota valenciana és un joc tradicional amb diverses modalitats, unes al carrer i altres al trinquet. Per a començar, pregunta al club o a l'escola de pilota del poble, si n'hi ha, quines modalitats ensenyen.",
      "Si algú ha publicat una partida al poble, la trobaràs al Calendari, amb les altres targetes del Mur; jo no conec els horaris ni les partides de hui."
    ],
    fontEditorial: 'https://www.portalinmaterial.cultura.gob.es/pci-ccaa/comunidad-valenciana/pilota.html · sections.js (Calendari: el calendari del Mur)'
  },
  {
    id: 'rebost:toponimia', titol: 'Toponímia i noms de lloc', ruta: '/notes', claus: ['toponímia', 'topònims'],
    paragrafs: [
      "Els noms de les partides, els camins i els masos són memòria del lloc. Per a recollir-los, apunta cada nom tal com el diu qui te'l conta i d'on ve el testimoni. Si hi ha dues formes, conserva-les totes dues amb la seua font, sense triar-ne cap com a oficial."
    ],
    fontEditorial: 'criteri editorial de documentació oral'
  },
  {
    id: 'rebost:llavador', titol: 'Records del llavador', ruta: '/notes', claus: ['llavador', 'llavadors'],
    paragrafs: [
      "Per a documentar els records d'un llavador, pregunta qui hi anava, com s'organitzaven i quines paraules feien servir. Distingix el record personal de la dada comprovada, i demana permís abans de publicar la veu o la imatge d'una altra persona."
    ],
    fontEditorial: 'criteri editorial de documentació oral'
  },
  {
    id: 'rebost:receptari', titol: 'Receptari de casa', ruta: '/notes', claus: ['receptari', 'recepta', 'receptes'],
    /* La recepta del metge no és de cuina. */
    exclou: ['metge', 'metgessa', 'mèdic', 'mèdica', 'farmàcia', 'medicament', 'medicaments'],
    paragrafs: [
      "Per a conservar una recepta de casa, anota els ingredients, les quantitats, els passos i qui te l'ha explicada. Si cada família la fa d'una manera, escriu totes les variants. Al Bloc de Notes la pots guardar; jo no valide conserves ni done consells de salut."
    ],
    fontEditorial: 'criteri editorial de documentació oral · atles:notes (iaiaLocal.js)'
  },
  {
    id: 'rebost:refranyer', titol: 'Refranyer i dites', ruta: '/notes', claus: ['refranyer', 'refranys', 'refrany'],
    paragrafs: [
      "Les dites i els refranys del poble conserven una manera de parlar. Apunta les paraules exactes, quan es deien i qui te les ha contades, amb el seu permís. Un refrany sobre l'oratge és tradició oral, no una previsió del temps."
    ],
    fontEditorial: 'criteri editorial de documentació oral'
  },
  {
    id: 'rebost:oficis', titol: 'Oficis i eines antigues', ruta: '/notes', claus: ['oficis', 'ofici'], minimTermes: 2,
    /* «Hi ha treball d'ofici al poble?» busca feina: és de la pàgina Treball. */
    exclou: ['treball', 'feina', 'faena', 'oferta', 'ofertes'],
    paragrafs: [
      "Per a recollir un ofici antic, fotografia les eines amb permís i pregunta el nom de cada peça, per a què servia i qui n'ensenyava l'ús. Anota si és un testimoni o una suposició. No manipules una eina que no coneixes per a reproduir-ne el treball."
    ],
    fontEditorial: 'criteri editorial de documentació oral'
  },
  {
    id: 'rebost:canconer', titol: 'Cançoner i memòria cantada', ruta: '/notes', claus: ['cançoner', 'cançons', 'cançó'],
    paragrafs: [
      "Per a conservar una cançó antiga, apunta'n el títol, qui la recorda i quan es cantava. Demana permís abans de gravar-la o de compartir-la. Primer, la referència i el context: no cal publicar la lletra sencera per a documentar-ne el record."
    ],
    fontEditorial: 'criteri editorial de documentació oral'
  },
  {
    id: 'rebost:anunci_veinal', titol: 'Preparar un anunci veïnal', ruta: '/mur', claus: ['anunci', 'anuncis'],
    paragrafs: [
      "Per a preparar un anunci veïnal, escriu què oferixes o què necessites, en quin poble i fins quan és útil. Repassa el text i no poses dades de contacte d'altres persones. Si és per a vendre, canviar o regalar coses, el lloc és el Mercat. No publique res per tu: l'anunci el publiques tu quan estiga a punt."
    ],
    fontEditorial: 'atles:mur i atles:mercat (iaiaLocal.js); PAGE_COPY.publicar_mur i publicar_mercat (pageContent.js)'
  },
  {
    id: 'rebost:convocatoria', titol: 'Preparar una convocatòria', ruta: '/calendari', claus: ['convocatòria', 'convocatòries', 'convocar'],
    paragrafs: [
      "Per a convocar una reunió, posa en la convocatòria el títol, el dia amb l'any, l'hora, el lloc i qui l'organitza. Si encara no està confirmada, digues-ho. Comprova estes dades amb qui organitza abans de compartir-la; jo no tinc cap agenda en directe."
    ],
    fontEditorial: 'PAGE_COPY.publicar_calendari (pageContent.js) · criteri editorial'
  },
  {
    id: 'rebost:text_alternatiu', titol: 'Descriure una fotografia', ruta: '/mur', claus: ['alternatiu', 'descripció'],
    paragrafs: [
      "Una bona descripció, o text alternatiu, diu el que aporta una fotografia: què s'hi veu i què ajuda a entendre el missatge. Quan compartisques una foto al Mur, escriu-ho també en el text, perquè qui no la pot vore no es perda res. No deduïsques identitats ni dades privades d'una imatge."
    ],
    fontEditorial: "criteri editorial d'accessibilitat · PAGE_COPY.publicar_mur (pageContent.js)"
  },
  {
    id: 'rebost:trobada', titol: 'Preparar una trobada veïnal', ruta: '/calendari', claus: ['trobada', 'trobades'],
    paragrafs: [
      "Per a preparar una trobada, acordeu el motiu, el lloc, l'hora i una manera de confirmar qui hi va. Pregunta si algú necessita un accés adaptat. Després escriu una convocatòria i revisa-la; jo no faig reserves ni envie invitacions per tu."
    ],
    fontEditorial: 'criteri editorial'
  },
  {
    id: 'rebost:objecte_perdut', titol: "Redactar un avís d'objecte perdut", ruta: '/mur', claus: ['objecte', 'perdut', 'perduda'], minimTermes: 2,
    paragrafs: [
      "En un avís d'objecte perdut posa una descripció general, el dia i la zona aproximada. Guarda't algun detall per a comprovar qui el reclama. No publiques documents d'identitat, adreces privades ni fotos amb dades personals."
    ],
    fontEditorial: 'criteri editorial de privacitat'
  },
  {
    id: 'rebost:entrevista', titol: 'Entrevistar una persona major', ruta: '/notes', claus: ['entrevista', 'entrevistes', 'entrevistar'],
    /* Una entrevista de treball no és de memòria oral. */
    exclou: ['treball', 'feina', 'faena', 'oferta', 'ofertes', 'currículum'],
    paragrafs: [
      "Abans d'una entrevista, explica per a què servirà i pregunta si la persona vol participar i si es pot gravar. Pots començar pels records del treball i dels llocs del poble. Deixa que pare quan vulga i acordeu què es pot compartir."
    ],
    fontEditorial: 'criteri editorial de documentació oral'
  },
  {
    id: 'rebost:cartell', titol: 'Revisar un cartell', ruta: '/mur', claus: ['cartell', 'cartells'],
    paragrafs: [
      "Per a revisar un cartell, comprova que el títol, el dia, l'hora i el lloc es lligen bé. Escriu també eixa informació com a text, perquè no depenga només de la imatge. Qualsevol canvi, consulta'l amb qui organitza abans de difondre'l."
    ],
    fontEditorial: "criteri editorial d'accessibilitat"
  },
  {
    id: 'rebost:acta_veinal', titol: 'Escriure una acta de reunió', ruta: '/notes', claus: ['acta'],
    paragrafs: [
      "Una acta de reunió recull la data, qui hi assistix, els temes, els acords i qui s'encarrega de cada pas. Distingix una proposta d'un acord pres. Abans de compartir-la, revisa-la amb les persones que hi van participar, sobretot si porta dades seues."
    ],
    fontEditorial: 'criteri editorial'
  }
].map((capsula) => Object.freeze({
  ...capsula, claus: Object.freeze([...capsula.claus]), exclou: Object.freeze([...(capsula.exclou || [])]), paragrafs: Object.freeze([...capsula.paragrafs])
})));
