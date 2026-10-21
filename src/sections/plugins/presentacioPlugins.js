/**
 * presentacioPlugins.js — Onada 10 (261010; pla 261010_1121; decisió del
 * Mestre del 261010, M4: «els sis paràgrafs només són per al Rebost i
 * Salut») · La presentació llarga de la pàgina d'un plugin (/plugin/<id>,
 * PluginPage.jsx): sis paràgrafs que diuen què és l'eina, com es fa servir,
 * on es queden les dades i què NO fa.
 *
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 6; pla §7.3) · Sis
 * blocs: cada paràgraf porta davant el seu títol <h3>, sense punt final. El
 * cos comença en H3, com el de les pàgines de text (paginaDeText.test.js):
 * l'H1 i l'H2 continuen sent el títol i el subtítol del registre, i davall
 * de l'entradilla ve l'H3 (sdp-universal-page §1.E.4, core-llegibilitat-text
 * §2: H1 → H2 → Entradeta → H3 → Paràgraf). Els paràgrafs no canvien ni una
 * lletra; els títols són un esborrany per al Mestre. Cap canvi de CSS: l'H3
 * global de base.css ja és el canònic.
 *
 * Va a banda del registre (registrePlugins.js) a propòsit: el registre
 * viatja amb el Panell de Control, que només en pinta la targeta, i este
 * text llarg només ha de viatjar amb la pàgina. L'entradilla curta del
 * registre continua sent el cos de la targeta i l'entradilla de la pàgina;
 * açò és el COS de la pàgina, darrere d'ella.
 *
 *   PRESENTACIO_PLUGINS       { rebost, salut }: una cadena HTML per plugin,
 *                             només amb <h3>, <p> i <strong>: sis blocs, un
 *                             <h3> i el seu <p>, un element per línia. Cap
 *                             H1 ni H2: són el títol i el subtítol del
 *                             registre, i una pàgina no els repetix.
 *   presentacioDelPlugin(id)  eixa cadena, o null si el plugin no en té (la
 *                             resta del registre, i qualsevol id que no siga
 *                             una clau pròpia: «constructor» no és cap
 *                             plugin).
 *
 * Qui la pinta és CosDeLaPagina (sections/text/TextSection.jsx), que saneja
 * l'HTML: el mateix camí i el mateix article «cms-preview» de les pàgines de
 * text. En esta carpeta ningú escriu HTML cru (qualitat.test.js).
 *
 * Els literals que el text cita entre cometes són els que pinta l'app,
 * comprovats al codi el 261010:
 *   rebost · «N’hi ha», «Se n’acaba» i «S’ha acabat» (apps/nevera/vistes/
 *            vestits.js, TEXTOS_CASA); «El que tens a casa», «No el
 *            seguisques», «Cal comprar» i «Afig-ho tot» (vistes/Casa.jsx);
 *            «La compra» i «Ajustos» (manifest.js, entrades); la còpia que
 *            es descarrega i es recupera (vistes/Ajustos.jsx). Gratuïta,
 *            sense dades personals i sense cap crida de xarxa: manifest.js.
 *   salut  · «Avui», «Full per al metge» i «Resum i avisos» (apps/salut/
 *            manifest.js, entrades); els nou botons d'apunt (nucli/
 *            diccionari.js, camp `boto`); el mode nit i «He apuntat tot el
 *            dia» (vistes/Diari.jsx); «Ho he entés» (vistes/Ajustos.jsx);
 *            «parla-ho amb el metge» i «truca al 112» (textos.js, AVIS_SALUT,
 *            i nucli/alertes.js).
 * Si l'app canvia un d'eixos textos, este s'ha de canviar amb ell.
 *
 * Cap consell mèdic i cap promesa: el text de Salut diu el mateix que l'avís
 * de l'app (apps/salut/textos.js) i, com ell, és un ESBORRANY que ha de
 * revisar el Mestre i, idealment, algú de salut. Les dues eines porten
 * entorn 'desenvolupament': el text diu que estan en proves i que el botó
 * pot ser inert.
 *
 * Pur: sense React ni xarxa.
 */

const REBOST = [
  '<h3>Què és el Rebost</h3>',
  '<p>El <strong>Rebost Domèstic</strong> és el lloc on apuntes <strong>què tens a casa</strong>, a la nevera i al rebost. Viu dins de <strong>La Nevera de Casa</strong>, la nostra eina per a la compra. És <strong>gratuïta</strong>, <strong>no demana cap dada personal</strong> i no cal entrar amb cap compte per a fer-la servir.</p>',
  '<h3>Tres respostes per a cada article</h3>',
  '<p>Funciona amb <strong>tres respostes</strong>. Busques un article, com ara les tomaques, la llet o l’oli d’oliva, el toques i dius què en queda: <strong>«N’hi ha»</strong>, <strong>«Se n’acaba»</strong> o <strong>«S’ha acabat»</strong>. Un toc tria i tanca. El que seguixes ix davant de tot, davall de <strong>«El que tens a casa»</strong>, i si un article ja no t’interessa tries <strong>«No el seguisques»</strong>.</p>',
  '<h3>El que cal comprar</h3>',
  '<p>Amb això, <strong>el Rebost et diu què cal comprar</strong>. Tot el que s’ha acabat o se n’acaba apareix a <strong>«Cal comprar»</strong>, primer el que ja no en queda. Amb el <strong>«+»</strong> ho passes a la llista de la compra i amb <strong>«Afig-ho tot»</strong>, tot d’una. I quan a «La compra» ho marques com a <strong>comprat</strong>, el Rebost torna a dir «N’hi ha» sense que hages de tocar res més.</p>',
  '<h3>Què més hi ha a La Nevera de Casa</h3>',
  '<p>El Rebost no va a soles. A La Nevera de Casa tens també <strong>les llistes de la compra</strong> (en pots tindre més d’una), un <strong>catàleg per seccions</strong>, com les del súper, els <strong>articles propis</strong> que crees tu i una vista de <strong>temporada</strong> que et diu quina fruita i quina verdura toca cada mes. Eixe calendari és <strong>orientatiu</strong> i encara l’hem de revisar.</p>',
  '<h3>On es queden les dades</h3>',
  '<p><strong>Tot es guarda en este dispositiu</strong>, dins d’este navegador, i <strong>no ix mai d’ací</strong>: l’eina no fa cap crida a internet. Per això mateix, el que apuntes <strong>no apareix a soles en un altre mòbil</strong> de casa. Per a passar-ho a un altre lloc o per a no perdre-ho, a <strong>Ajustos</strong> pots <strong>descarregar una còpia</strong> i recuperar-la quan vulgues; recuperar-la substituïx el que hi haja en eixe moment.</p>',
  '<h3>Què no fa</h3>',
  '<p>I el que <strong>no fa</strong>: no porta <strong>preus</strong>, al Rebost no hi ha <strong>quantitats</strong> ni <strong>dates de caducitat</strong>, i <strong>no compra res per tu</strong>. Només recorda el que tu li dius. Encara està <strong>en proves</strong>: si ací es pot obrir, el botó <strong>«Obrir el Rebost»</strong> t’hi porta; si no, el botó no fa res i la pàgina et diu <strong>per què</strong>.</p>'
];

const SALUT = [
  '<h3>Què és Salut</h3>',
  '<p><strong>Salut · Cuidant dels Nostres</strong> és un <strong>quadern domèstic</strong> per a qui <strong>cuida d’algú</strong>. Servix per a apuntar com <strong>orina, beu, fa de ventre i dorm</strong>, i com està, la persona que cuides, i per a <strong>ensenyar-ho al metge o a infermeria en un full clar</strong>. Així no ho has de recordar tot de memòria quan arribes a la consulta.</p>',
  '<h3>Com s’apunta</h3>',
  '<p>A la pantalla <strong>«Avui»</strong> tries <strong>què vols apuntar</strong> i s’obri el seu formulari: «Ha orinat», «Ha begut», «Escapament», «Absorbent», «Ha fet de ventre», «Conducta», «Medicació», «Son» i «Altres» (la temperatura, una caiguda, que menja poc o que està diferent de sempre). Hi ha un <strong>mode nit</strong> amb només el que es fa a les fosques, i cada apunt es pot <strong>corregir o esborrar</strong> després. Si a casa no voleu apuntar la medicació, les deposicions o la conducta, eixos apartats <strong>es poden apagar</strong>.</p>',
  '<h3>Els comptes i el full per al metge</h3>',
  '<p>Amb els apunts, el quadern <strong>fa els comptes</strong>: les vegades que orina <strong>de dia i de nit</strong>, el que ha <strong>begut</strong>, els escapaments i els canvis d’absorbent. Pots fer un <strong>diari de tres dies</strong> seguits i, al final, el <strong>«Full per al metge»</strong> ho ordena en una taula, dia per dia. I és estricte: les mitjanes només compten els dies que marques amb <strong>«He apuntat tot el dia»</strong>, i els volums només ixen quan totes les vegades que ha orinat estan mesurades. <strong>Cap xifra feta amb forats</strong>.</p>',
  '<h3>Els avisos, i el que no fan</h3>',
  '<p>A <strong>«Resum i avisos»</strong> el quadern t’assenyala el que val la pena mirar. <strong>No és un producte sanitari</strong>: <strong>no posa nom a res</strong>, no diu què li passa a ningú i <strong>no recomana tractaments</strong> ni quantitats de medicació. Només diu <strong>«parla-ho amb el metge»</strong> o, si hi ha perill, <strong>«truca al 112»</strong>. Cada avís t’explica per què el veus i amb quines dades teues, i no t’envia cap notificació: el trobes quan hi entres. I que no n’hi haja cap <strong>no vol dir que tot vaja bé</strong>.</p>',
  '<h3>On es queden les dades</h3>',
  '<p>Les dades <strong>es queden en este dispositiu</strong>, dins d’este navegador. <strong>No s’envien</strong> a Sóc de Poble, ni a cap servidor, ni a cap intel·ligència artificial. Això té una altra cara: <strong>si s’esborren les dades del navegador o canvies de dispositiu, es perden</strong>, i per això el quadern et recorda que faces <strong>còpies de seguretat</strong>. I qui òbriga este navegador en este dispositiu <strong>ho pot vore tot</strong>.</p>',
  '<h3>Què ix d’ací i on s’obri</h3>',
  '<p>D’ací només ixen <strong>dos fitxers</strong>, i sempre <strong>per la teua mà</strong>: la còpia de seguretat, que ho porta tot, i el full per al metge, que descarregues o compartixes tu. Al full, el nom de la persona <strong>no hi va</strong> si no l’escrius en eixe moment. Per la mena de dades que guarda, el quadern <strong>només s’obri a la pàgina pròpia de Sóc de Poble</strong>, mai dins d’una altra web, i la primera vegada et demana que lliges l’avís i digues <strong>«Ho he entés»</strong>. Encara està <strong>en proves</strong>: si ací no es pot obrir, el botó <strong>«Obrir Salut»</strong> no fa res i la pàgina et diu per què.</p>'
];

/** El cos de la pàgina de cada plugin que en té: sis blocs (un <h3> i el seu <p>), un element per línia. */
export const PRESENTACIO_PLUGINS = Object.freeze({
  rebost: REBOST.join('\n'),
  salut: SALUT.join('\n')
});

/** L'HTML de la presentació d'un plugin (només claus pròpies), o null. */
export function presentacioDelPlugin(id) {
  if (typeof id !== 'string' || !Object.hasOwn(PRESENTACIO_PLUGINS, id)) return null;
  return PRESENTACIO_PLUGINS[id];
}
