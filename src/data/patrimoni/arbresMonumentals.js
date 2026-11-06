/** IDEA-115 (Onada R9, carril C5) · Catàleg d'Arbres Emblemàtics i Monumentals de La Torre de les Maçanes.
 *
 * Font única: la pàgina 619 de WordPress de socdepoble.net (10-04-2017), copiada a _cultura_de_poble/trilogia_mediterrania_i_moli_la_torre/wp_socdepoble_net/00_10_pagines_completes.json.
 * Els 19 noms, les dues marques «(Monumental)» i l'enllaç de cada fitxa són literals de la font; els paràgrafs
 * citats també. La pàgina font no dona cap mesura, edat ni descripció per arbre: ací tampoc (G9-01).
 * Cap foto: les imatges de la font són de tercers (Decisió 3, 261007).
 */
const congela = (valor) => {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const fill of Object.values(valor)) congela(fill);
    Object.freeze(valor);
  }
  return valor;
};

export const VERSIO_ARBRES_MONUMENTALS = '1.0.0';

export const FONT_ARBRES_MONUMENTALS = congela({
 "wpId": 619,
 "slug": "cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes",
 "titol": "Catàleg d’Arbres Emblemàtics i Monumentals de La Torre de les Maçanes",
 "enllac": "https://socdepoble.net/2017/04/10/cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes/",
 "data": "2017-04-10T19:00:25",
 "document": "_cultura_de_poble/trilogia_mediterrania_i_moli_la_torre/wp_socdepoble_net/00_10_pagines_completes.json",
 "sha256": "0e9b0e946186fa82caa6f9931fa54a083100b8a2d16a728a28d68a3f5c1983d6",
 "camp": "cataleg-d-arbres-emblematics-i-monumentals-de-la-torre-de-les-macanes",
 "cites": {
  "actualitzacio": 1,
  "deuAnys": 3,
  "senseBioleg": 7,
  "autoria": 23,
  "ordenanca": 25,
  "collabora": 29
 },
 "paragrafs": {
  "actualitzacio": "ACTUALITZACIÓ: ABRIL 2017",
  "deuAnys": "Transcorreguts 10 anys des de l’elaboració del Catàleg d’Arbres Monumentals i Emblemàtics del nostre poble, ens hem proposat tornar-lo a posar en valor difonent-lo, amb un format diferent del original, presentant-lo ara en A4 i en aquesta web, més manejable i que inclou  fotos, d’aquell moment, dels  arbres catalogats que encara no s’havien difós.",
  "senseBioleg": "Donat que al nostre grup no comptem amb cap biòleg, no entrarem a detallar aspectes tècnics de l’evolució d’aquestos, bàsicament comentarem el que visualment podem apreciar dels canvis que s’evidencien en el seu estat i el seu entorn.",
  "autoria": "Pedro Ferrer Rodriguez, enginyer tècnic forestal i biòleg amb la col·laboració de l’associació El Rentonar, hem elaborat un catàleg d’arbres, que per la seua grandària, antiguitat, arrels culturals o pel lloc on han crescut, es considera que són emblemàtics per al paisatge i entorn del poble.",
  "ordenanca": "Considerem que aquests arbres són suficientment importants, com per a ser protegits mitjançant l’Ordenança Municipal de Protecció d’Arbres d’Interès Local, en vigor des de l’any 2005, en l’Ajuntament de La Torre de les Maçanes, que els defensen de qualsevol agressió que puguen tindre.",
  "collabora": "Des d’aquesta pàgina, vos convidem a que col·laboreu amb aquesta iniciativa amb la vostra informació (ó participació) per a la millora i ampliació d’aquest catàleg."
 }
});

export const ARBRES_MONUMENTALS_LA_TORRE = congela([
 {
  "ordre": 1,
  "id": "arbre-01-albers-blancs-del-pont",
  "nom": "Àlbers blancs del Pont",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/albers-blancs-del-pont-de-la-torre-de-les-macanes/",
  "liniaText": 37
 },
 {
  "ordre": 2,
  "id": "arbre-02-alborc-del-xipreret",
  "nom": "Àlborç del Xipreret",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/alborc-del-xipreret-de-la-torre-de-les-macanes/",
  "liniaText": 39
 },
 {
  "ordre": 3,
  "id": "arbre-03-carrasca-de-la-foia-blanca",
  "nom": "Carrasca de La Foia Blanca",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/carrasca-de-la-foia-blanca-de-la-torre-de-les-macanes/",
  "liniaText": 41
 },
 {
  "ordre": 4,
  "id": "arbre-04-carrasca-de-la-zurca",
  "nom": "Carrasca de La Zurca",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/carrasca-de-la-zurca-de-la-torre-de-les-macanes/",
  "liniaText": 43
 },
 {
  "ordre": 5,
  "id": "arbre-05-carrasca-de-nofre",
  "nom": "Carrasca de Nofre",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/carrasca-de-nofre-de-la-torre-de-les-macanes/",
  "liniaText": 45
 },
 {
  "ordre": 6,
  "id": "arbre-06-carrasca-del-buitre",
  "nom": "Carrasca del Buitre",
  "monumental": true,
  "enllac": "https://socdepoble.net/2007/09/07/carrasca-del-buitre-de-la-torre-de-les-macanes/",
  "liniaText": 47
 },
 {
  "ordre": 7,
  "id": "arbre-07-carrasca-del-moral",
  "nom": "Carrasca del Moral",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/carrasca-del-moral-de-la-torre-de-les-macanes/",
  "liniaText": 49
 },
 {
  "ordre": 8,
  "id": "arbre-08-fleixos-del-barranc-d-horta",
  "nom": "Fleixos del Barranc d’Horta",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/fleixos-del-barranc-dhorta-de-la-torre-de-les-macanes/",
  "liniaText": 51
 },
 {
  "ordre": 9,
  "id": "arbre-09-ginebre-de-mitja-orella",
  "nom": "Ginebre de Mitja Orella",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/ginebre-de-mitja-orella-de-la-torre-de-les-macanes/",
  "liniaText": 53
 },
 {
  "ordre": 10,
  "id": "arbre-10-llorer-de-villa-maria",
  "nom": "Llorer de Villa María",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/llorer-de-villa-maria-de-la-torre-de-les-macanes/",
  "liniaText": 55
 },
 {
  "ordre": 11,
  "id": "arbre-11-oms-de-la-placa-de-l-esglesia",
  "nom": "Oms de la Plaça de l’Església",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/oms-de-la-placa-de-lesglesia-de-la-torre-de-les-macanes/",
  "liniaText": 57
 },
 {
  "ordre": 12,
  "id": "arbre-12-pi-de-la-foia-boix",
  "nom": "Pi de la Foia Boix",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/pi-de-la-foia-boix-de-la-torre-de-les-macanes/",
  "liniaText": 59
 },
 {
  "ordre": 13,
  "id": "arbre-13-pi-del-mas-de-pipa",
  "nom": "Pi del Mas de Pipa",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/pi-del-mas-de-pipa-de-la-torre-de-les-macanes/",
  "liniaText": 61
 },
 {
  "ordre": 14,
  "id": "arbre-14-pi-del-pla-verd",
  "nom": "Pi del Pla Verd",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/pi-del-pla-verd-de-la-torre-de-les-macanes/",
  "liniaText": 63
 },
 {
  "ordre": 15,
  "id": "arbre-15-pi-dels-arrendaors",
  "nom": "Pi dels Arrendaors",
  "monumental": true,
  "enllac": "https://socdepoble.net/2007/09/07/pi-dels-arrendaors-de-la-torre-de-les-macanes/",
  "liniaText": 65
 },
 {
  "ordre": 16,
  "id": "arbre-16-roures-de-nofre",
  "nom": "Roures de Nofre",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/roures-de-nofre-de-la-torre-de-les-macanes/",
  "liniaText": 67
 },
 {
  "ordre": 17,
  "id": "arbre-17-xiprer-de-la-foia",
  "nom": "Xiprer de la Foia",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/xiprer-de-la-foia-de-la-torre-de-les-macanes/",
  "liniaText": 69
 },
 {
  "ordre": 18,
  "id": "arbre-18-xiprers-del-calvari",
  "nom": "Xiprers del Calvari",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/xiprers-del-calvari-de-la-torre-de-les-macanes/",
  "liniaText": 71
 },
 {
  "ordre": 19,
  "id": "arbre-19-xiprers-del-cementeri",
  "nom": "Xiprers del Cementeri",
  "monumental": false,
  "enllac": "https://socdepoble.net/2007/09/07/xiprers-del-cementeri-de-la-torre-de-les-macanes/",
  "liniaText": 73
 }
]);
