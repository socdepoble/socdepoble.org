/**
 * textosGestorLocal.js — Els textos del Gestor d'arxius locals del Mas
 * (`/multimedia` → «Carpeta local» · IDEA-54/55 · Onada 261029_1605) i el
 * mapa ÚNIC codi d'error → clau i18n.
 *
 * Cada text és un parell ['section.multimedia.local.…', 'reserva']: la clau i
 * la reserva valenciana, que és el valor de ca.js (i18n.multimedia.test.js ho
 * comprova, i també que les cinc llengües tenen la clau). Les reserves no
 * porten cap apòstrof recte (cal ’).
 *
 * El traductor de l'app, `t(clau, reserva)`, no omple marcadors: ho fa
 * `omple`, amb una funció de substitució (un «$&» d'un nom de fitxer no es
 * reinterpreta mai). Res d'ací importa el motor: el contrast amb els codis
 * exportats el fa la prova (textosGestorLocal.test.js).
 */

const congela = (objecte) => Object.freeze(Object.fromEntries(
  Object.entries(objecte).map(([nom, parell]) => [nom, Object.freeze(parell)])
));

/** Els textos de la interfície, pel sufix de la clau (`T['ops.mou']`). */
export const TEXTOS_LOCAL = congela({
  'pestanya': ['section.multimedia.local.pestanya', 'Carpeta local'],
  'titol': ['section.multimedia.local.titol', 'Gestor d’arxius locals'],
  'entradeta': ['section.multimedia.local.entradeta', 'Obri les carpetes del teu ordinador sense pujar cap fitxer a Internet: imatges, textos, àudio, vídeo i PDF.'],
  'volums': ['section.multimedia.local.volums', 'Volums i carpetes locals'],
  'vincula': ['section.multimedia.local.vincula', 'Vincular carpeta local'],
  'recordada': ['section.multimedia.local.recordada', 'Carpeta recordada: «{nom}»'],
  'reconnectaAjuda': ['section.multimedia.local.reconnectaAjuda', 'El navegador torna a demanar permís quan tornes: un clic i continues on ho havies deixat.'],
  'reconnecta': ['section.multimedia.local.reconnecta', 'Reconnectar amb 1 clic'],
  'oblida': ['section.multimedia.local.oblida', 'Oblidar'],
  'desconnecta': ['section.multimedia.local.desconnecta', 'Desconnectar'],
  'relleig': ['section.multimedia.local.relleig', 'Tornar a llegir'],
  'llegint': ['section.multimedia.local.llegint', 'Llegint la carpeta…'],
  'denegat': ['section.multimedia.local.denegat', 'El navegador ha denegat l’accés a «{nom}»: torna-la a vincular o oblida-la.'],
  'desapareguda': ['section.multimedia.local.desapareguda', 'No es troba «{nom}»: potser s’ha mogut o esborrat.'],
  'gestCaducat': ['section.multimedia.local.gestCaducat', 'El navegador no ha mostrat la petició de permís: torna a prémer «Reconnectar amb 1 clic».'],
  'sessio': ['section.multimedia.local.sessio', 'Només esta sessió'],
  'nomesLectura': ['section.multimedia.local.nomesLectura', 'Només lectura'],
  'senseSelector': ['section.multimedia.local.senseSelector', 'Este navegador no pot recordar carpetes ni escriure-hi: tria-la cada vegada.'],
  'privadesa': ['section.multimedia.local.privadesa', 'Les carpetes vinculades només es recorden en este navegador. En un ordinador compartit, oblida-les en acabar.'],
  'desplacades': ['section.multimedia.local.desplacades', 'S’han oblidat les carpetes més antigues: {noms}.'],
  'noRecordada': ['section.multimedia.local.noRecordada', 'No s’ha pogut recordar la carpeta en este navegador: s’obri només per a esta sessió.'],
  'diagnostic': ['section.multimedia.local.diagnostic', 'Diagnòstic de «{nom}»'],
  'diagnosticXifres': ['section.multimedia.local.diagnosticXifres', 'Fitxers: {n} · {pes}'],
  'resum.publicades': ['section.multimedia.local.resum.publicades', 'Publicades a la web: {n}'],
  'resum.inedites': ['section.multimedia.local.resum.inedites', 'Inèdites sense WebP: {n}'],
  'resum.bessones': ['section.multimedia.local.resum.bessones', 'Bessones WebP: {n} (estalvi {pes})'],
  'resum.avisos': ['section.multimedia.local.resum.avisos', 'Avisos de pes o duplicats: {n}'],
  'resum.exactes': ['section.multimedia.local.resum.exactes', 'Duplicats exactes: {n}'],
  'hash.verifica': ['section.multimedia.local.hash.verifica', 'Verificar duplicats exactes (SHA-256)'],
  'hash.calculant': ['section.multimedia.local.hash.calculant', 'Calculant empremtes SHA-256: {n} de {total}'],
  'hash.resultat': ['section.multimedia.local.hash.resultat', 'Grups de fitxers idèntics byte a byte: {n}'],
  'hash.cap': ['section.multimedia.local.hash.cap', 'Cap duplicat exacte: els fitxers de la mateixa mida tenen contingut diferent.'],
  'hash.atura': ['section.multimedia.local.hash.atura', 'Aturar la verificació'],
  'hash.aturada': ['section.multimedia.local.hash.aturada', 'Verificació aturada: el resultat és parcial.'],
  'hash.truncat': ['section.multimedia.local.hash.truncat', 'S’ha arribat al límit de {fitxers} fitxers o {pes}: la verificació és parcial.'],
  'hash.omesos': ['section.multimedia.local.hash.omesos', 'Fitxers que no s’han pogut llegir: {n}.'],
  'carpetes': ['section.multimedia.local.carpetes', 'Carpetes'],
  'arrel': ['section.multimedia.local.arrel', 'Tota la carpeta ({n})'],
  'desplega': ['section.multimedia.local.desplega', 'Desplegar «{nom}»'],
  'plega': ['section.multimedia.local.plega', 'Plegar «{nom}»'],
  'carpetaBuida': ['section.multimedia.local.carpetaBuida', 'Esta carpeta és buida.'],
  'filtre.estat': ['section.multimedia.local.filtre.estat', 'Filtre per estat'],
  'filtre.tots': ['section.multimedia.local.filtre.tots', 'Tots els estats'],
  'filtre.publicades': ['section.multimedia.local.filtre.publicades', 'Publicades a la web'],
  'filtre.inedites': ['section.multimedia.local.filtre.inedites', 'Inèdites (sense WebP)'],
  'filtre.bessones': ['section.multimedia.local.filtre.bessones', 'Amb bessona WebP'],
  'filtre.alertes': ['section.multimedia.local.filtre.alertes', 'Pes alt o duplicades'],
  'filtre.tipus': ['section.multimedia.local.filtre.tipus', 'Tipus d’arxiu'],
  'tipus.tots': ['section.multimedia.local.tipus.tots', 'Tots els tipus'],
  'tipus.imatge': ['section.multimedia.local.tipus.imatge', 'Imatges'],
  'tipus.audio': ['section.multimedia.local.tipus.audio', 'Àudio'],
  'tipus.video': ['section.multimedia.local.tipus.video', 'Vídeo'],
  'tipus.text': ['section.multimedia.local.tipus.text', 'Text i dades'],
  'tipus.codi': ['section.multimedia.local.tipus.codi', 'Codi i registres (només lectura)'],
  'tipus.document': ['section.multimedia.local.tipus.document', 'Documents'],
  'tipus.altre': ['section.multimedia.local.tipus.altre', 'Altres'],
  'cerca': ['section.multimedia.local.cerca', 'Cerca per nom o ruta'],
  'vista': ['section.multimedia.local.vista', 'Vista dels arxius'],
  'vista.graella': ['section.multimedia.local.vista.graella', 'Graella d’àlbum'],
  'vista.taula': ['section.multimedia.local.vista.taula', 'Explorador d’arxius (taula)'],
  'fitxers': ['section.multimedia.local.fitxers', 'Fitxers a la vista ({n})'],
  'buit': ['section.multimedia.local.buit', 'Cap fitxer coincidix amb els filtres.'],
  'insignia.publicada': ['section.multimedia.local.insignia.publicada', 'Publicada'],
  'insignia.bessona': ['section.multimedia.local.insignia.bessona', 'Bessona WebP'],
  'insignia.inedita': ['section.multimedia.local.insignia.inedita', 'Inèdita'],
  'insignia.pesAlt': ['section.multimedia.local.insignia.pesAlt', 'Pes alt'],
  'insignia.duplicada': ['section.multimedia.local.insignia.duplicada', 'Duplicada'],
  'insignia.possible': ['section.multimedia.local.insignia.possible', 'Possible duplicat'],
  'paginacio': ['section.multimedia.local.paginacio', 'Paginació dels arxius'],
  'pagina': ['section.multimedia.local.pagina', 'Pàgina {n} de {total}'],
  'anterior': ['section.multimedia.local.anterior', 'Pàgina anterior'],
  'seguent': ['section.multimedia.local.seguent', 'Pàgina següent'],
  'col.nom': ['section.multimedia.local.col.nom', 'Nom'],
  'col.carpeta': ['section.multimedia.local.col.carpeta', 'Carpeta'],
  'col.tipus': ['section.multimedia.local.col.tipus', 'Tipus'],
  'col.mida': ['section.multimedia.local.col.mida', 'Mida'],
  'col.estat': ['section.multimedia.local.col.estat', 'Estat'],
  'col.modificat': ['section.multimedia.local.col.modificat', 'Modificat'],
  'detall.tanca': ['section.multimedia.local.detall.tanca', 'Tancar el detall'],
  'detall.ruta': ['section.multimedia.local.detall.ruta', 'Ubicació a la carpeta'],
  'detall.mides': ['section.multimedia.local.detall.mides', 'Mides en píxels'],
  'detall.exif': ['section.multimedia.local.detall.exif', 'Metadades EXIF'],
  'detall.senseExif': ['section.multimedia.local.detall.senseExif', 'Esta imatge no porta metadades EXIF.'],
  'detall.data': ['section.multimedia.local.detall.data', 'Data i hora de captura'],
  'detall.camera': ['section.multimedia.local.detall.camera', 'Càmera'],
  'detall.autor': ['section.multimedia.local.detall.autor', 'Autoria'],
  'detall.gps': ['section.multimedia.local.detall.gps', 'Coordenades GPS'],
  'detall.estatWeb': ['section.multimedia.local.detall.estatWeb', 'Estat respecte a la web'],
  'detall.emparellada': ['section.multimedia.local.detall.emparellada', 'Publicada a la web: {src}'],
  'detall.inedita': ['section.multimedia.local.detall.inedita', 'Inèdita: encara no té versió .webp ni figura a la web.'],
  'detall.suport': ['section.multimedia.local.detall.suport', 'Arxiu local de suport'],
  'detall.teBessona': ['section.multimedia.local.detall.teBessona', 'Té bessona: {ruta} ({pes}, estalvi de {estalvi})'],
  'detall.esBessona': ['section.multimedia.local.detall.esBessona', 'És la bessona WebP de {ruta} ({pes})'],
  'detall.mateixaMida': ['section.multimedia.local.detall.mateixaMida', 'Possible duplicat per mida: {rutes}'],
  'detall.mateixNom': ['section.multimedia.local.detall.mateixNom', 'El mateix nom en altres carpetes: {rutes}'],
  'detall.exactes': ['section.multimedia.local.detall.exactes', 'Duplicat exacte (SHA-256) de: {rutes}'],
  'detall.senseVista': ['section.multimedia.local.detall.senseVista', 'Este tipus d’arxiu no té vista prèvia: el pots descarregar.'],
  'detall.descarrega': ['section.multimedia.local.detall.descarrega', 'Descarregar'],
  'detall.pdf': ['section.multimedia.local.detall.pdf', 'Obrir el PDF en una pestanya nova'],
  'detall.noPdf': ['section.multimedia.local.detall.noPdf', 'El fitxer no comença com un PDF: només es pot descarregar.'],
  'detall.noReprodueix': ['section.multimedia.local.detall.noReprodueix', 'Este navegador no pot reproduir este format.'],
  'detall.codiSegur': ['section.multimedia.local.detall.codiSegur', 'Per seguretat, l’HTML, l’SVG i el codi es mostren com a text i mai s’executen.'],
  'detall.massaGran': ['section.multimedia.local.detall.massaGran', 'És massa gran per a obrir-lo ací ({pes}).'],
  'detall.carregant': ['section.multimedia.local.detall.carregant', 'Carregant «{nom}»…'],
  'detall.fontSvg': ['section.multimedia.local.detall.fontSvg', 'Codi font de l’SVG'],
  'detall.text': ['section.multimedia.local.detall.text', 'Contingut (només lectura)'],
  'proposta.titol': ['section.multimedia.local.proposta.titol', 'Proposta per a catalogar (cal confirmar-la)'],
  'proposta.ajuda': ['section.multimedia.local.proposta.ajuda', 'És una proposta automàtica: comprova-la abans de catalogar la imatge.'],
  'proposta.poble': ['section.multimedia.local.proposta.poble', 'Poble proposat: {poble}'],
  'proposta.comarca': ['section.multimedia.local.proposta.comarca', 'Comarca: {comarca}'],
  'proposta.confianca.alta': ['section.multimedia.local.proposta.confianca.alta', 'Confiança alta'],
  'proposta.confianca.mitjana': ['section.multimedia.local.proposta.confianca.mitjana', 'Confiança mitjana'],
  'proposta.confianca.baixa': ['section.multimedia.local.proposta.confianca.baixa', 'Confiança baixa'],
  'proposta.motiu.cens': ['section.multimedia.local.proposta.motiu.cens', 'La imatge ja està catalogada al cens del Mas.'],
  'proposta.motiu.gps': ['section.multimedia.local.proposta.motiu.gps', 'Les coordenades GPS són a {km} km del poble.'],
  'proposta.motiu.gpsProximitat': ['section.multimedia.local.proposta.motiu.gpsProximitat', 'Les coordenades GPS són a {km} km: pot ser este poble o un de veí.'],
  'proposta.motiu.gpsComarca': ['section.multimedia.local.proposta.motiu.gpsComarca', 'Les coordenades GPS són a {km} km del poble més proper: només se’n proposa la comarca.'],
  'proposta.motiu.nom': ['section.multimedia.local.proposta.motiu.nom', 'El nom de la ruta nomena el poble.'],
  'proposta.motiu.nomAlies': ['section.multimedia.local.proposta.motiu.nomAlies', 'La ruta porta un nom semblant al del poble.'],
  'proposta.avis.nomAmbigu': ['section.multimedia.local.proposta.avis.nomAmbigu', 'La ruta nomena més d’un poble: no se’n proposa cap pel nom.'],
  'proposta.avis.gpsINomDiscrepen': ['section.multimedia.local.proposta.avis.gpsINomDiscrepen', 'El GPS i el nom de la ruta apunten a pobles diferents.'],
  'proposta.avis.censIGpsDiscrepen': ['section.multimedia.local.proposta.avis.censIGpsDiscrepen', 'El cens i el GPS de la imatge apunten a pobles diferents.'],
  'proposta.avis.gpsLluny': ['section.multimedia.local.proposta.avis.gpsLluny', 'Les coordenades GPS són lluny de tots els pobles del Mas.'],
  'proposta.categoria': ['section.multimedia.local.proposta.categoria', 'Categoria del catàleg: {categoria}'],
  'proposta.ambit.poble': ['section.multimedia.local.proposta.ambit.poble', 'Poble'],
  'proposta.ambit.persona': ['section.multimedia.local.proposta.ambit.persona', 'Persona'],
  'proposta.ambit.entitat': ['section.multimedia.local.proposta.ambit.entitat', 'Entitat'],
  'proposta.ambit.ia': ['section.multimedia.local.proposta.ambit.ia', 'IA'],
  'proposta.ambit.contingut': ['section.multimedia.local.proposta.ambit.contingut', 'Contingut'],
  'proposta.origen': ['section.multimedia.local.proposta.origen', 'Origen: {origen} ({motiu})'],
  'proposta.origens.ia': ['section.multimedia.local.proposta.origens.ia', 'Imatge feta amb IA'],
  'proposta.origens.foto': ['section.multimedia.local.proposta.origens.foto', 'Fotografia'],
  'proposta.origens.sistema': ['section.multimedia.local.proposta.origens.sistema', 'Recurs del sistema'],
  'proposta.motiuOrigen.cens': ['section.multimedia.local.proposta.motiuOrigen.cens', 'segons el cens'],
  'proposta.motiuOrigen.exifCamera': ['section.multimedia.local.proposta.motiuOrigen.exifCamera', 'l’EXIF nomena una càmera'],
  'proposta.motiuOrigen.nomIa': ['section.multimedia.local.proposta.motiuOrigen.nomIa', 'el nom és d’imatge d’IA'],
  'proposta.cap': ['section.multimedia.local.proposta.cap', 'Sense proposta: la imatge no porta GPS ni cap nom de poble conegut.'],
  'lab.titol': ['section.multimedia.local.lab.titol', 'Laboratori WebP: abans i després'],
  'lab.qualitat': ['section.multimedia.local.lab.qualitat', 'Qualitat WebP'],
  'lab.q72': ['section.multimedia.local.lab.q72', 'Més lleuger (72 %)'],
  'lab.q78': ['section.multimedia.local.lab.q78', 'Equilibrat (78 %)'],
  'lab.q84': ['section.multimedia.local.lab.q84', 'Recomanat (84 %)'],
  'lab.q92': ['section.multimedia.local.lab.q92', 'Màxima fidelitat (92 %)'],
  'lab.resolucio': ['section.multimedia.local.lab.resolucio', 'Resolució'],
  'lab.midaOriginal': ['section.multimedia.local.lab.midaOriginal', 'Mida original'],
  'lab.maxim': ['section.multimedia.local.lab.maxim', 'Màxim {px} px'],
  'lab.abans': ['section.multimedia.local.lab.abans', 'Abans: {ext} · {pes}'],
  'lab.despres': ['section.multimedia.local.lab.despres', 'Després: {ample} × {alt} px · {pes} · {estalvi}'],
  'lab.mateixPes': ['section.multimedia.local.lab.mateixPes', 'mateix pes'],
  'lab.mesPesat': ['section.multimedia.local.lab.mesPesat', '+{percent} % més pesat'],
  'lab.descarrega': ['section.multimedia.local.lab.descarrega', 'Descarregar .webp ({pes})'],
  'lab.desa': ['section.multimedia.local.lab.desa', 'Desar .webp a la carpeta local'],
  'lab.substitueix': ['section.multimedia.local.lab.substitueix', 'Substituir la bessona .webp'],
  'lab.desaIMou': ['section.multimedia.local.lab.desaIMou', 'Desar .webp i moure l’original a originals_raster_public/'],
  'lab.desat': ['section.multimedia.local.lab.desat', 'S’ha desat «{ruta}» ({pes}) a la carpeta local.'],
  'lab.desatIMogut': ['section.multimedia.local.lab.desatIMogut', 'S’ha desat «{webp}» i l’original s’ha mogut a «{original}».'],
  'lab.senseWebp': ['section.multimedia.local.lab.senseWebp', 'Este navegador no sap codificar WebP: prova-ho amb Chrome, Edge o Firefox.'],
  'lab.generant': ['section.multimedia.local.lab.generant', 'Generant la previsualització WebP…'],
  'lab.confirmaTitol': ['section.multimedia.local.lab.confirmaTitol', 'Ja hi ha «{ruta}»'],
  'lab.confirmaText': ['section.multimedia.local.lab.confirmaText', 'Vols substituir la .webp que ja hi ha a la carpeta?'],
  'lab.confirma': ['section.multimedia.local.lab.confirma', 'Substituir'],
  'lab.previsualitzacio': ['section.multimedia.local.lab.previsualitzacio', 'Previsualització WebP de «{nom}»'],
  'text.etiqueta': ['section.multimedia.local.text.etiqueta', 'Contingut de «{nom}»'],
  'text.desa': ['section.multimedia.local.text.desa', 'Desar canvis al fitxer local'],
  'text.desat': ['section.multimedia.local.text.desat', 'Canvis desats a «{ruta}».'],
  'text.pendents': ['section.multimedia.local.text.pendents', 'Hi ha canvis sense desar: ⌘S o Ctrl+S per a desar.'],
  'text.senseCanvis': ['section.multimedia.local.text.senseCanvis', 'Sense canvis pendents.'],
  'text.envia': ['section.multimedia.local.text.envia', 'Enviar al Bloc de Notes'],
  'text.enviaAjuda': ['section.multimedia.local.text.enviaAjuda', 'Crea una nota amb este text al teu Bloc de Notes; amb sessió, la nota es desa al servidor del poble.'],
  'text.calEntrar': ['section.multimedia.local.text.calEntrar', 'Per a enviar-lo al Bloc de Notes cal entrar al compte.'],
  'text.errorNota': ['section.multimedia.local.text.errorNota', 'No s’ha pogut crear la nota. Comprova la connexió i la sessió.'],
  'text.massaLlarg': ['section.multimedia.local.text.massaLlarg', 'Massa text per a una nota ({pes}; màxim {max}).'],
  'text.nou': ['section.multimedia.local.text.nou', 'Nou fitxer .md'],
  'text.nomNou': ['section.multimedia.local.text.nomNou', 'Nom del fitxer nou'],
  'text.ajudaNom': ['section.multimedia.local.text.ajudaNom', 'Es crearà a «{carpeta}»; s’hi afegirà .md si cal.'],
  'text.crea': ['section.multimedia.local.text.crea', 'Crear el fitxer'],
  'text.creat': ['section.multimedia.local.text.creat', 'S’ha creat «{ruta}».'],
  'text.existeix': ['section.multimedia.local.text.existeix', '«{nom}» ja existix en esta carpeta.'],
  'text.jsonInvalid': ['section.multimedia.local.text.jsonInvalid', 'El contingut no és JSON vàlid: no es desa per a no trencar el fitxer.'],
  'text.desaIgualment': ['section.multimedia.local.text.desaIgualment', 'Desar igualment'],
  'text.conflicteTitol': ['section.multimedia.local.text.conflicteTitol', 'El fitxer ha canviat al disc'],
  'text.canviExtern': ['section.multimedia.local.text.canviExtern', 'El fitxer ha canviat fora del Mas des que l’has obert. Si el sobreescrius, es perdran eixos canvis.'],
  'text.sobreescriu': ['section.multimedia.local.text.sobreescriu', 'Sobreescriure igualment'],
  'text.descartaTitol': ['section.multimedia.local.text.descartaTitol', 'Vols descartar els canvis sense desar?'],
  'text.descartaText': ['section.multimedia.local.text.descartaText', 'Els canvis que no has desat es perdran.'],
  'text.descarta': ['section.multimedia.local.text.descarta', 'Descartar els canvis'],
  'text.nomesLectura': ['section.multimedia.local.text.nomesLectura', 'Este fitxer es mostra només en lectura.'],
  'text.saltsMixtos': ['section.multimedia.local.text.saltsMixtos', 'Este fitxer barreja salts de línia: en desar quedaran tots iguals (LF).'],
  'permis.escriptura': ['section.multimedia.local.permis.escriptura', 'Per a canviar fitxers, el navegador et demanarà permís per a escriure en «{nom}».'],
  'permis.gestCaducat': ['section.multimedia.local.permis.gestCaducat', 'El navegador no ha mostrat la petició de permís: torna a prémer el botó.'],
  'ops.titol': ['section.multimedia.local.ops.titol', 'Operacions al disc'],
  'ops.desti': ['section.multimedia.local.ops.desti', 'Carpeta destí'],
  'ops.arrel': ['section.multimedia.local.ops.arrel', 'Arrel de «{nom}»'],
  'ops.mou': ['section.multimedia.local.ops.mou', 'Moure'],
  'ops.mogut': ['section.multimedia.local.ops.mogut', 'S’ha mogut a «{ruta}» (comprovació: {verificacio}).'],
  'ops.verificacio.sha256': ['section.multimedia.local.ops.verificacio.sha256', 'SHA-256 idèntic'],
  'ops.verificacio.bytes': ['section.multimedia.local.ops.verificacio.bytes', 'comparació byte a byte'],
  'ops.verificacio.mida': ['section.multimedia.local.ops.verificacio.mida', 'només la mida (fitxer gran)'],
  'ops.senseDesti': ['section.multimedia.local.ops.senseDesti', 'No hi ha cap altra carpeta: crea’n una primer.'],
  'ops.nouNom': ['section.multimedia.local.ops.nouNom', 'Nom nou'],
  'ops.ajudaNom': ['section.multimedia.local.ops.ajudaNom', 'L’extensió «.{ext}» es conserva.'],
  'ops.reanomena': ['section.multimedia.local.ops.reanomena', 'Reanomenar'],
  'ops.reanomenat': ['section.multimedia.local.ops.reanomenat', 'Ara es diu «{nom}».'],
  'ops.elimina': ['section.multimedia.local.ops.elimina', 'Eliminar del disc'],
  'ops.confirmaElimina': ['section.multimedia.local.ops.confirmaElimina', 'Vols eliminar «{nom}»?'],
  'ops.confirmaEliminaText': ['section.multimedia.local.ops.confirmaEliminaText', 'S’esborrarà del disc i no anirà a la Paperera.'],
  'ops.eliminaDefinitiu': ['section.multimedia.local.ops.eliminaDefinitiu', 'Eliminar definitivament'],
  'ops.eliminat': ['section.multimedia.local.ops.eliminat', 'S’ha esborrat «{ruta}» del disc.'],
  'ops.bloquejat': ['section.multimedia.local.ops.bloquejat', 'Desa o descarta els canvis del text abans de moure, reanomenar o eliminar el fitxer.'],
  'ops.accionsCarpeta': ['section.multimedia.local.ops.accionsCarpeta', 'Accions de carpeta'],
  'ops.novaCarpeta': ['section.multimedia.local.ops.novaCarpeta', 'Nova carpeta'],
  'ops.nomCarpeta': ['section.multimedia.local.ops.nomCarpeta', 'Nom de la carpeta nova'],
  'ops.ajudaCarpeta': ['section.multimedia.local.ops.ajudaCarpeta', 'Es crearà dins de «{carpeta}».'],
  'ops.creaCarpeta': ['section.multimedia.local.ops.creaCarpeta', 'Crear la carpeta'],
  'ops.carpetaCreada': ['section.multimedia.local.ops.carpetaCreada', 'S’ha creat la carpeta «{ruta}».'],
  'ops.eliminaCarpeta': ['section.multimedia.local.ops.eliminaCarpeta', 'Eliminar esta carpeta buida'],
  'ops.confirmaEliminaCarpeta': ['section.multimedia.local.ops.confirmaEliminaCarpeta', 'Vols eliminar la carpeta «{nom}»?'],
  'ops.carpetaEliminada': ['section.multimedia.local.ops.carpetaEliminada', 'S’ha esborrat la carpeta «{ruta}».']
});

/** El text de cada codi de CODIS_ERROR_ARXIU_LOCAL (el motor). */
export const ERRORS_LOCAL = congela({
  RUTA_INVALIDA: ['section.multimedia.local.error.rutaInvalida', 'La ruta no és d’un fitxer vàlid de la carpeta.'],
  FONT_OBLIDADA: ['section.multimedia.local.error.fontOblidada', 'La carpeta s’ha desconnectat: torna-la a obrir.'],
  FONT_ILLEGIBLE: ['section.multimedia.local.error.fontIllegible', 'No s’ha pogut recórrer la carpeta: potser ja no hi ha permís.'],
  FITXER_ILLEGIBLE: ['section.multimedia.local.error.fitxerIllegible', 'No s’ha pogut llegir el fitxer: potser s’ha mogut o esborrat.'],
  FITXER_MASSA_GRAN: ['section.multimedia.local.error.fitxerMassaGran', 'El fitxer és massa gran per a obrir-lo ací.'],
  FITXER_JA_EXISTEIX: ['section.multimedia.local.error.fitxerJaExisteix', 'Ja hi ha un fitxer o una carpeta amb este nom: no se sobreescriu.'],
  CARPETA_NO_TROBADA: ['section.multimedia.local.error.carpetaNoTrobada', 'La carpeta no existix: torna a llegir la carpeta local.'],
  ESCRIPTURA_DENEGADA: ['section.multimedia.local.error.escripturaDenegada', 'S’ha denegat el permís d’escriptura a la carpeta local.'],
  ESCRIPTURA_NO_PERMESA: ['section.multimedia.local.error.escripturaNoPermesa', 'Des d’ací només es poden escriure fitxers de text i .webp.'],
  ESCRIPTURA_FALLIDA: ['section.multimedia.local.error.escripturaFallida', 'No s’ha pogut escriure al disc: no s’ha canviat res.'],
  NOMES_LECTURA: ['section.multimedia.local.error.nomesLectura', 'Esta carpeta és de només lectura en este navegador.'],
  NO_ES_TEXT: ['section.multimedia.local.error.noEsText', 'No és un arxiu de text.'],
  NO_ES_UTF8: ['section.multimedia.local.error.noEsUtf8', 'No és text UTF-8: no es pot editar ací.'],
  NO_ES_WEBP: ['section.multimedia.local.error.noEsWebp', 'Les dades no són d’una imatge WebP.'],
  CONFLICTE_DISC: ['section.multimedia.local.error.conflicteDisc', 'El fitxer ha canviat al disc mentrestant: no s’ha tocat res.'],
  SENSE_CRIPTO: ['section.multimedia.local.error.senseCripto', 'Este navegador no pot calcular SHA-256 (cal una connexió segura).'],
  PARAMETRES_INVALIDS: ['section.multimedia.local.error.parametresInvalids', 'L’operació no es pot fer amb estes dades.'],
  SELECTOR_NO_DISPONIBLE: ['section.multimedia.local.error.selectorNoDisponible', 'Este navegador no pot obrir el selector de carpetes.'],
  SELECCIO_CANCELLADA: ['section.multimedia.local.error.seleccioCancellada', 'No s’ha triat cap carpeta.'],
  CAL_GEST: ['section.multimedia.local.error.calGest', 'El navegador només obri el selector just després d’un clic: torna a prémer el botó.'],
  SELECTOR_FALLIT: ['section.multimedia.local.error.selectorFallit', 'No s’ha pogut obrir la carpeta local.'],
  NOM_INVALID: ['section.multimedia.local.error.nomInvalid', 'Este nom no és vàlid per a un fitxer o una carpeta.'],
  MATEIXA_RUTA: ['section.multimedia.local.error.mateixaRuta', 'El fitxer ja és on vols moure’l.'],
  NOM_EQUIVALENT: ['section.multimedia.local.error.nomEquivalent', 'El nom nou només canvia majúscules o accents: per al disc és el mateix fitxer.'],
  EXTENSIO_NO_CONSERVADA: ['section.multimedia.local.error.extensioNoConservada', 'El fitxer ha de conservar la seua extensió.'],
  NO_ES_FITXER: ['section.multimedia.local.error.noEsFitxer', 'És una carpeta: només es mouen fitxers.'],
  CARPETA_NO_BUIDA: ['section.multimedia.local.error.carpetaNoBuida', 'La carpeta no està buida (també compten els fitxers ocults): no s’esborra.'],
  MOVIMENT_NO_VERIFICAT: ['section.multimedia.local.error.movimentNoVerificat', 'La còpia no s’ha pogut verificar: s’ha esborrat la còpia i l’original no s’ha tocat.'],
  MOVIMENT_INCOMPLET: ['section.multimedia.local.error.movimentIncomplet', 'S’ha copiat a «{desti}», però l’original «{origen}» no s’ha pogut esborrar: ara n’hi ha dos.'],
  ORIGINAL_NO_MOGUT: ['section.multimedia.local.error.originalNoMogut', 'S’ha desat «{webp}», però l’original no s’ha pogut moure a «{desti}».']
});

/** El text de cada codi de CODIS_LIMITACIO_LOCAL (avisos de `font.limitacions`). */
export const LIMITACIONS_LOCAL = congela({
  CARPETA_TRUNCADA: ['section.multimedia.local.limit.carpetaTruncada', 'La carpeta té massa fitxers: només se’n mostren els primers.'],
  PROFUNDITAT_MAXIMA: ['section.multimedia.local.limit.profunditatMaxima', 'Hi ha carpetes massa endins: no s’han recorregut.'],
  FITXER_ILLEGIBLE: ['section.multimedia.local.limit.fitxerIllegible', 'Alguns fitxers no s’han pogut obrir i no es mostren.'],
  CARPETA_ILLEGIBLE: ['section.multimedia.local.limit.carpetaIllegible', 'Algunes carpetes no s’han pogut recórrer.']
});

/** El text de cada codi de CODIS_BIBLIOTECA_LOCAL (`bib.desa` → { ok:false, codi }). */
export const ERRORS_BIBLIOTECA_LOCAL = congela({
  HANDLE_INVALID: ['section.multimedia.local.bib.handleInvalid', 'El navegador no ha donat una carpeta vàlida.'],
  SENSE_INDEXEDDB: ['section.multimedia.local.bib.senseIndexeddb', 'Este navegador no deixa recordar carpetes (potser és una finestra privada).'],
  TRANSACCIO_FALLIDA: ['section.multimedia.local.bib.transaccioFallida', 'No s’ha pogut desar la carpeta a la memòria del navegador.'],
  SENSE_ESPAI: ['section.multimedia.local.bib.senseEspai', 'El navegador no té espai per a recordar més carpetes.'],
  NO_CLONABLE: ['section.multimedia.local.bib.noClonable', 'Este navegador no sap recordar esta carpeta entre visites.']
});

/** La reserva per a un error sense codi conegut. */
export const ERROR_GENERIC_LOCAL = Object.freeze(['section.multimedia.local.error.generic', 'No s’ha pogut fer l’operació.']);

/** CONFLICTE_DISC d'un moviment que ha conservat la còpia (detall.copiaConservada). */
export const ERROR_COPIA_CONSERVADA_LOCAL = Object.freeze(['section.multimedia.local.error.copiaConservada', 'L’original ha desaparegut mentre es movia: la còpia es conserva a «{copiaConservada}».']);

/** MOVIMENT_INCOMPLET d'una còpia que no s'ha pogut comparar amb l'original (detall.motiu 'SENSE_VERIFICAR', QA-A02). */
export const ERROR_MOVIMENT_SENSE_VERIFICAR_LOCAL = Object.freeze(['section.multimedia.local.error.movimentSenseVerificar', 'S’ha copiat a «{desti}», però no s’ha pogut comprovar que la còpia siga idèntica: l’original «{origen}» es conserva i ara n’hi ha dos.']);

/** RUTA_INVALIDA d'un nom amb caràcters invisibles (detall.motiu 'CARACTERS_INVISIBLES', QA-A05). */
export const ERROR_RUTA_INVISIBLES_LOCAL = Object.freeze(['section.multimedia.local.error.rutaInvisibles', 'El nom porta caràcters invisibles (de control o de direcció del text): es pot obrir, però des del Mas no es pot crear, moure, reanomenar ni esborrar.']);

/** El traductor per defecte (sense UIProvider): la reserva valenciana. */
export const traduccioDeReserva = (_clau, reserva) => reserva;

/**
 * Omple els marcadors {nom} d'una plantilla. Un marcador sense valor es queda
 * tal qual (es veu, en compte d'amagar-se).
 * @param {string} plantilla
 * @param {Record<string, unknown>|null} [valors]
 */
export function omple(plantilla, valors = null) {
  const text = String(plantilla ?? '');
  if (!valors || typeof valors !== 'object') return text;
  return text.replace(/\{(\w+)\}/g, (tros, nom) => {
    const valor = Object.hasOwn(valors, nom) ? valors[nom] : undefined;
    return valor === undefined || valor === null ? tros : String(valor);
  });
}

/**
 * Tradueix un parell [clau, reserva] i n'omple els marcadors.
 * @param {(clau: string, reserva: string) => string} t
 * @param {readonly [string, string]} parell
 * @param {Record<string, unknown>|null} [valors]
 */
export function tradueix(t, parell, valors = null) {
  if (!Array.isArray(parell) || parell.length !== 2) return '';
  const [clau, reserva] = parell;
  let text = reserva;
  try {
    const traduit = typeof t === 'function' ? t(clau, reserva) : reserva;
    if (typeof traduit === 'string' && traduit !== '') text = traduit;
  } catch {
    text = reserva;
  }
  return omple(text, valors);
}

/** El parell de text d'un error del motor (o la reserva genèrica). */
export function parellDErrorLocal(error) {
  const codi = error?.codi;
  if (codi === 'CONFLICTE_DISC' && typeof error?.detall?.copiaConservada === 'string') return ERROR_COPIA_CONSERVADA_LOCAL;
  if (codi === 'MOVIMENT_INCOMPLET' && error?.detall?.motiu === 'SENSE_VERIFICAR') return ERROR_MOVIMENT_SENSE_VERIFICAR_LOCAL;
  if (codi === 'RUTA_INVALIDA' && error?.detall?.motiu === 'CARACTERS_INVISIBLES') return ERROR_RUTA_INVISIBLES_LOCAL;
  return typeof codi === 'string' && Object.hasOwn(ERRORS_LOCAL, codi) ? ERRORS_LOCAL[codi] : ERROR_GENERIC_LOCAL;
}

/**
 * El missatge traduït d'un error del motor. Els marcadors s'omplin amb el
 * `detall` de l'error (origen, desti, webp, copiaConservada…) i amb `valors`.
 */
export function missatgeDErrorLocal(t, error, valors = null) {
  const detall = error?.detall && typeof error.detall === 'object' ? error.detall : {};
  return tradueix(t, parellDErrorLocal(error), { ...detall, ...(valors || {}) });
}

/** El missatge d'una limitació de la llista (`font.limitacions[i].codi`). */
export function missatgeDeLimitacioLocal(t, codi) {
  return tradueix(t, Object.hasOwn(LIMITACIONS_LOCAL, codi) ? LIMITACIONS_LOCAL[codi] : ERROR_GENERIC_LOCAL);
}

/** El missatge d'un codi de la biblioteca de carpetes recordades. */
export function missatgeDeBibliotecaLocal(t, codi) {
  return tradueix(t, Object.hasOwn(ERRORS_BIBLIOTECA_LOCAL, codi) ? ERRORS_BIBLIOTECA_LOCAL[codi] : ERROR_GENERIC_LOCAL);
}
