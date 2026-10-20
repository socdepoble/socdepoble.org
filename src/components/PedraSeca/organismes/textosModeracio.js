/**
 * textosModeracio.js — Fase D (261020, tasca 2; pla 261020_1300 · App Store
 * 1.2 i Google Play UGC) · Els textos de la moderació (denunciar, bloquejar,
 * les normes de convivència i la llista de bloquejos), en parells [clau i18n,
 * reserva en valencià]: la reserva és el valor valencià del diccionari
 * (i18n.js, section.moderacio.*), i i18n.moderacio.test.js els contrasta.
 * Viuen fora del .jsx, com TEXTOS_COMENTAR (textosComentar.js): són dades,
 * no cap component del catàleg (C1 també casa les exportacions en
 * majúscules d'un .jsx).
 *
 * Els noms ({nom}) i el termini ({termini}) s'hi posen amb `omple`, el de
 * config/moderacio.js (amb una funció de reemplaç: un nom amb «$&» es pinta
 * tal qual). El termini de revisió és UNA sola clau (crítica 261020, 7): el
 * text de la denúncia rebuda i el de les normes el porten de la mateixa font.
 */
export { omple } from '../../../config/moderacio.js';

const clau = (nom, reserva) => Object.freeze([`section.moderacio.${nom}`, reserva]);

export const TEXTOS_MODERACIO = Object.freeze({
  /* Els menús i els botons */
  opcions: clau('opcions', 'Més opcions'),
  menu: clau('menu', 'Opcions del contingut'),
  denuncia: clau('denuncia', 'Denuncia el contingut'),
  denunciaMissatge: clau('denunciaMissatge', 'Denuncia el missatge'),
  denunciaPersona: clau('denunciaPersona', 'Denuncia {nom}'),
  bloqueja: clau('bloqueja', 'Bloqueja {nom}'),
  desbloqueja: clau('desbloqueja', 'Desbloqueja {nom}'),
  cancela: clau('cancela', 'Cancel·la'),
  tanca: clau('tanca', 'Tanca'),
  /* requires_human_decision (Mestre): el termini de revisió de cada denúncia. */
  termini: clau('termini', 'en menys de 24 hores'),

  /* El diàleg de denúncia */
  denunciaTitol: clau('denuncia.titol', 'Denuncia este contingut'),
  denunciaTitolMissatge: clau('denuncia.titolMissatge', 'Denuncia este missatge'),
  denunciaTitolPersona: clau('denuncia.titolPersona', 'Denuncia esta persona o entitat'),
  denunciaDescripcio: clau('denuncia.descripcio',
    'Ho revisarà l’equip de moderació de Sóc de Poble. Qui l’ha publicat no sabrà qui l’ha denunciat.'),
  denunciaLlegenda: clau('denuncia.llegenda', 'Per què el denuncies?'),
  denunciaEnvia: clau('denuncia.envia', 'Envia la denúncia'),
  denunciaRebuda: clau('denuncia.rebuda', 'Gràcies. Hem rebut la denúncia i la revisarem {termini}.'),
  denunciaRepetida: clau('denuncia.repetida', 'Ja ens havies avisat d’este contingut. El revisarem igualment.'),
  denunciaBloquejaTambe: clau('denuncia.bloquejaTambe', 'Bloqueja també {nom}'),
  detallEtiqueta: clau('detall.etiqueta', 'Detalls (opcional)'),
  detallAjuda: clau('detall.ajuda', 'Fins a 1.000 caràcters.'),

  /* El diàleg de bloqueig i els avisos (ModeracioContext.jsx porta la seua
     còpia dels tres avisos, amb les mateixes claus i reserves) */
  bloqueigTitol: clau('bloqueig.titol', 'Vols bloquejar {nom}?'),
  bloqueigDescripcio: clau('bloqueig.descripcio',
    'No veuràs les seues publicacions al Mur, al Mercat ni a l’Agenda, ni els seus missatges al xat. {nom} no rebrà cap avís.'),
  bloqueigDescripcioEntitat: clau('bloqueig.descripcioEntitat',
    'No veuràs les publicacions de {nom} al Mur, al Mercat ni a l’Agenda. {nom} no rebrà cap avís.'),
  bloqueigDesfer: clau('bloqueig.desfer',
    'Ho pots desfer quan vulgues al teu perfil, a Privacitat i dades, o al Control del xat, a Privacitat i seguretat.'),
  bloqueigConfirma: clau('bloqueig.confirma', 'Bloqueja'),
  bloqueigFet: clau('bloqueig.fet', 'Has bloquejat {nom}.'),
  bloqueigNomesSessio: clau('bloqueig.nomesSessio',
    'Has bloquejat {nom} en esta sessió: el servidor encara no guarda els bloquejos.'),
  desbloqueigFet: clau('desbloqueig.fet', 'Has desbloquejat {nom}.'),

  /* Les normes de convivència, abans de la primera publicació */
  normesTitol: clau('normes.titol', 'Normes de convivència del poble'),
  normesIntro: clau('normes.intro', 'Abans de publicar per primera vegada, llig-les. Són poques i de sentit comú.'),
  normesRespecte: clau('normes.respecte', 'Respecta les persones: res d’insults, amenaces, assetjament ni discriminació.'),
  normesContingut: clau('normes.contingut', 'Res de contingut sexual explícit, violent o il·legal, ni res que pose ningú en perill.'),
  normesEnganys: clau('normes.enganys', 'Res d’enganys: ni spam, ni estafes, ni suplantar ningú, ni escampar desinformació.'),
  normesDrets: clau('normes.drets', 'Publica només el que és teu o tens permís per a compartir, i respecta la intimitat dels altres.'),
  normesToleranciaZero: clau('normes.toleranciaZero',
    'Tolerància zero: retirem el contingut que incomplix estes normes i expulsem qui el publica. Revisem cada denúncia {termini}.'),
  normesEines: clau('normes.eines',
    'Des del botó ⋮ de cada publicació i de cada missatge pots denunciar un contingut o bloquejar una persona.'),
  normesAccepte: clau('normes.accepte', 'He llegit les normes de convivència i les accepte.'),
  normesContinua: clau('normes.continua', 'Accepte i continue'),
  normesAraNo: clau('normes.araNo', 'Ara no'),
  normesLegal: clau('normes.legal', 'Avís legal i privacitat'),
  normesError: clau('normes.error', 'No s’ha pogut desar l’acceptació. Torna-ho a provar.'),
  calAcceptar: clau('normes.calAcceptar', 'Per a publicar, cal acceptar les normes de convivència.'),

  /* El contingut amagat i la llista de bloquejos */
  bloquejatMissatge: clau('bloquejat.missatge', 'Missatge amagat: has bloquejat esta persona.'),
  bloquejatPrevia: clau('bloquejat.previa', 'Missatge amagat'),
  /* El títol de la pàgina d'un element que has bloquejat (ItemDetailSection). */
  bloquejatTitol: clau('bloquejat.titol', 'Contingut amagat'),
  bloquejatDetall: clau('bloquejat.detall', 'Has bloquejat qui ha publicat este contingut: ja no el veuràs.'),
  bloquejatTornar: clau('bloquejat.tornar', 'Torna al llistat'),
  bloquejosTitol: clau('bloquejos.titol', 'Persones i entitats bloquejades'),
  bloquejosBuit: clau('bloquejos.buit', 'No has bloquejat ningú.'),
  bloquejosDesbloqueja: clau('bloquejos.desbloqueja', 'Desbloqueja'),
  bloquejosSenseNom: clau('bloquejos.senseNom', 'Sense nom'),
  bloquejosCarregant: clau('bloquejos.carregant', 'Carregant els bloquejos…'),
  bloquejosSenseSessio: clau('bloquejos.senseSessio', 'Entra al compte per a vore les persones que has bloquejat.'),
  bloquejosError: clau('bloquejos.error', 'No s’han pogut carregar els bloquejos. Torna-ho a provar.'),
  bloquejosNomesSessio: clau('bloquejos.nomesSessio', 'Estos bloquejos només duren esta sessió: el servidor encara no els guarda.'),
  bloquejosRestaPendent: clau('bloquejos.restaPendent',
    'Silenciar les notificacions i el xifratge extrem a extrem encara no estan disponibles: es construiran en la fase següent del xat.')
});

/* Els quatre motius (MOTIUS_DENUNCIA, contracte.js), en el mateix ordre: el
   nom i la línia d'ajuda del ràdio. Claus en camelCase (crítica 261020, 19). */
export const TEXTOS_MOTIUS = Object.freeze({
  ofensiu: Object.freeze({
    etiqueta: clau('motiu.ofensiu', 'Contingut ofensiu'),
    ajuda: clau('motiu.ofensiu.ajuda', 'Insults, odi, assetjament, violència o contingut sexual.')
  }),
  spam_frau: Object.freeze({
    etiqueta: clau('motiu.spamFrau', 'Spam o frau'),
    ajuda: clau('motiu.spamFrau.ajuda', 'Publicitat que ningú no ha demanat, estafes o enganys.')
  }),
  desinformacio: Object.freeze({
    etiqueta: clau('motiu.desinformacio', 'Desinformació'),
    ajuda: clau('motiu.desinformacio.ajuda', 'Informació falsa que pot fer mal a algú.')
  }),
  altre: Object.freeze({
    etiqueta: clau('motiu.altre', 'Un altre motiu'),
    ajuda: clau('motiu.altre.ajuda', 'Explica-ho davall, si vols.')
  })
});

/* El text de cada `code` de CODI_MODERACIO (crítica 261020, 19: els nou, i
   claus sense guionets perquè la paritat de LLEI_07 les veja). */
export const TEXTOS_ERROR_MODERACIO = Object.freeze({
  'objectiu-invalid': clau('error.objectiuInvalid', 'El contingut o la persona no són vàlids.'),
  'motiu-invalid': clau('error.motiuInvalid', 'Tria un dels motius de la llista.'),
  'detall-massa-llarg': clau('error.detallMassaLlarg', 'El detall passa de 1.000 caràcters.'),
  autobloqueig: clau('error.autobloqueig', 'No et pots bloquejar a tu mateix.'),
  'versio-invalida': clau('error.versioInvalida', 'La versió de les normes no és la vigent. Recarrega l’aplicació.'),
  limit: clau('error.limit', 'Has fet massa denúncies o bloquejos en poc de temps. Torna-ho a provar d’ací a una estona.'),
  'sense-sessio': clau('error.senseSessio', 'Cal entrar al compte per a bloquejar.'),
  'no-disponible': clau('error.noDisponible', 'Ara mateix no es poden enviar denúncies. Escriu-nos a socdepoble@socdepoble.org.'),
  desconegut: clau('error.desconegut', 'No s’ha pogut completar. Torna-ho a provar.')
});

/** El parell [clau, reserva] del text d'un error de moderació (pel `code`; un altre, «desconegut»). */
export const textDErrorDeModeracio = (error) => TEXTOS_ERROR_MODERACIO[error?.code] ?? TEXTOS_ERROR_MODERACIO.desconegut;
