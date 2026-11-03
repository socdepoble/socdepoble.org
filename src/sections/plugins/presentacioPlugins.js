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
 * DEROGAT (Gauntlet 261022_0225, F2/F7) «Els paràgrafs no canvien ni una
 * lletra»: l'últim paràgraf del Rebost i de Salut canvia perquè «el botó no
 * fa res» ja no és cert; pendent de revisió del Mestre (i, el de Salut, de
 * qui en revise el text de salut: és un ESBORRANY, vegeu baix).
 *
 * Va a banda del registre (registrePlugins.js) a propòsit: el registre
 * viatja amb el Panell de Control, que només en pinta la targeta, i este
 * text llarg només ha de viatjar amb la pàgina. L'entradilla curta del
 * registre continua sent el cos de la targeta i l'entradilla de la pàgina;
 * açò és el COS de la pàgina, darrere d'ella.
 *
 * EXTENSIÓ de M4 (d31c1ccd; prompt 261021_2345, tasca 2; Gauntlet
 * 261022_0225, F8) · «Només per al Rebost i Salut» ja no és literal: la
 * Gestoria i el Lector RSS també porten sis blocs, perquè l'auditoria
 * didàctica va trobar que no explicaven què són ni com es fan servir. Amb
 * presentació, M2 els dona també el botó de dalt quan es poden obrir
 * (PluginPage.jsx). Pendent que el Mestre ho confirme.
 *
 * Gauntlet 261022_0225 (F7 i auditoria didàctica) · Els paràgrafs ja no són
 * intocables: el text del botó i els blocs de la Gestoria i del Lector diuen
 * com està l'eina ARA, en present, i són certs es puga obrir o no, i també
 * si l'ha desactivada la persona (l'últim bloc és neutre: no dona per fet
 * que la web no la pot obrir ni que el botó de baix és «Desactiva»). Sense
 * destí ja no hi ha cap botó inert (PluginPage.jsx, F2): el Rebost i Salut
 * diuen «en lloc del botó, la pàgina et diu per què i què pots fer».
 *
 *   PRESENTACIO_PLUGINS       { rebost, salut, gestoria, rss }: una cadena HTML per plugin,
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
 * Onada 6 (261103, prompt 261102_1532; ordre del Mestre de les negretes
 * d'escaneig) · Cada paràgraf porta les negretes del contracte de densitat
 * (6–8 si té 40 paraules o més; 5–7, 2–4 o 1–3 si és més curt), sobre el
 * nucli de cada frase i en sintagmes curts: llegint només els H3 i les
 * negretes s'ha d'entendre què diu cada frase. Només s'hi han afegit o mogut
 * <strong>; cap lletra del text no canvia (presentacioPlugins.test.js en vigila la densitat i els literals citats).
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
 *   gestoria · «Identitat i Finestreta» i «Facturació» (apps/gestoria/
 *            manifest.js, entrades). Gauntlet 261022_0225, F8.
 *   rss    · «Notícies» (apps/lector/manifest.js, entrada) i «Gestiona les
 *            fonts» (el diàleg de l'arbre, apps/lector/vistes/GestioFonts.jsx;
 *            261024, la pàgina «Fonts» ja no existix). Que encara no hi ha
 *            cap font connectada ho diu l'estat buit de l'app
 *            (apps/lector/AppLector.jsx).
 * Si l'app canvia un d'eixos textos, este s'ha de canviar amb ell.
 *
 * Cap consell mèdic i cap promesa: el text de Salut diu el mateix que l'avís
 * de l'app (apps/salut/textos.js) i, com ell, és un ESBORRANY que ha de
 * revisar el Mestre i, idealment, algú de salut. Les dues eines porten
 * entorn 'desenvolupament': el text diu que estan en proves. DEROGAT (Gauntlet
 * 261022_0225, F2) «i que el botó pot ser inert»: sense destí no n'hi ha cap,
 * i el text diu que la pàgina explica per què i què pots fer.
 *
 * Pur: sense React ni xarxa.
 */

const REBOST = [
  '<h3>Què és el Rebost</h3>',
  '<p>El <strong>Rebost Domèstic</strong> és el lloc on apuntes <strong>què tens a casa</strong>, a la nevera i al rebost. Viu dins de <strong>La Nevera de Casa</strong>, la nostra eina per a la compra. És <strong>gratuïta</strong>, <strong>no demana cap dada personal</strong> i <strong>no cal entrar</strong> amb cap compte per a fer-la servir.</p>',
  '<h3>Tres respostes per a cada article</h3>',
  '<p>Funciona amb <strong>tres respostes</strong>. Busques un article, com ara les tomaques, la llet o l’oli d’oliva, el toques i dius què en queda: <strong>«N’hi ha»</strong>, <strong>«Se n’acaba»</strong> o <strong>«S’ha acabat»</strong>. Un toc tria i tanca. El que seguixes ix davant de tot, davall de <strong>«El que tens a casa»</strong>, i si un article ja no t’interessa tries <strong>«No el seguisques»</strong>.</p>',
  '<h3>El que cal comprar</h3>',
  '<p>Amb això, el Rebost et diu <strong>què cal comprar</strong>. Tot el que s’ha acabat o se n’acaba apareix a <strong>«Cal comprar»</strong>, primer el que ja no en queda. Amb el <strong>«+»</strong> ho passes a la <strong>llista de la compra</strong> i amb <strong>«Afig-ho tot»</strong>, tot d’una. I quan a «La compra» ho marques com a <strong>comprat</strong>, el Rebost torna a dir <strong>«N’hi ha»</strong> sense que hages de tocar res més.</p>',
  '<h3>Què més hi ha a La Nevera de Casa</h3>',
  '<p>El Rebost <strong>no va a soles</strong>. A La Nevera de Casa tens també <strong>les llistes de la compra</strong> (en pots tindre <strong>més d’una</strong>), un <strong>catàleg per seccions</strong>, com les del súper, els <strong>articles propis</strong> que crees tu i una vista de <strong>temporada</strong> que et diu quina fruita i quina verdura toca cada mes. Eixe calendari és <strong>orientatiu</strong> i encara l’hem de revisar.</p>',
  '<h3>On es queden les dades</h3>',
  '<p><strong>Tot es guarda en este dispositiu</strong>, dins d’este navegador, i <strong>no ix mai d’ací</strong>: l’eina no fa <strong>cap crida a internet</strong>. Per això mateix, el que apuntes <strong>no apareix a soles</strong> en un altre mòbil de casa. Per a passar-ho a un altre lloc o per a no perdre-ho, a <strong>Ajustos</strong> pots <strong>descarregar una còpia</strong> i recuperar-la quan vulgues; <strong>recuperar-la substituïx</strong> el que hi haja en eixe moment.</p>',
  '<h3>Què no fa</h3>',
  '<p>I el que <strong>no fa</strong>: no porta <strong>preus</strong>, al Rebost no hi ha <strong>quantitats</strong> ni <strong>dates de caducitat</strong>, i <strong>no compra res per tu</strong>. Només recorda el que tu li dius. Encara està <strong>en proves</strong>: si ací es pot obrir, el botó <strong>«Obrir el Rebost»</strong> t’hi porta; si no, en lloc del botó la pàgina et diu <strong>per què</strong> i què pots fer.</p>'
];

const SALUT = [
  '<h3>Què és Salut</h3>',
  '<p><strong>Salut · Cuidant dels Nostres</strong> és un <strong>quadern domèstic</strong> per a qui <strong>cuida d’algú</strong>. Servix per a apuntar com <strong>orina, beu</strong>, <strong>fa de ventre i dorm</strong>, i com està, la persona que cuides, i per a <strong>ensenyar-ho al metge</strong> o a infermeria en un <strong>full clar</strong>. Així no ho has de recordar tot <strong>de memòria</strong> quan arribes a la consulta.</p>',
  '<h3>Com s’apunta</h3>',
  '<p>A la pantalla <strong>«Avui»</strong> tries <strong>què vols apuntar</strong> i s’obri el seu <strong>formulari</strong>: «Ha orinat», «Ha begut», «Escapament», «Absorbent», «Ha fet de ventre», «Conducta», «Medicació», «Son» i «Altres» (la temperatura, una caiguda, que menja poc o que està diferent de sempre). Hi ha un <strong>mode nit</strong> amb només el que es fa <strong>a les fosques</strong>, i cada apunt es pot <strong>corregir o esborrar</strong> després. Si a casa no voleu apuntar la medicació, les deposicions o la conducta, eixos apartats <strong>es poden apagar</strong>.</p>',
  '<h3>Els comptes i el full per al metge</h3>',
  '<p>Amb els apunts, el quadern <strong>fa els comptes</strong>: les vegades que orina <strong>de dia i de nit</strong>, el que ha <strong>begut</strong>, els escapaments i els canvis d’absorbent. Pots fer un <strong>diari de tres dies</strong> seguits i, al final, el <strong>«Full per al metge»</strong> ho ordena en una taula, dia per dia. I és estricte: les mitjanes només compten els dies que marques amb <strong>«He apuntat tot el dia»</strong>, i els volums només ixen quan totes les vegades que ha orinat estan mesurades. <strong>Cap xifra feta amb forats</strong>.</p>',
  '<h3>Els avisos, i el que no fan</h3>',
  '<p>A <strong>«Resum i avisos»</strong> el quadern t’assenyala el que val la pena mirar. <strong>No és un producte sanitari</strong>: <strong>no posa nom a res</strong>, no diu què li passa a ningú i <strong>no recomana tractaments</strong> ni quantitats de medicació. Només diu <strong>«parla-ho amb el metge»</strong> o, si hi ha perill, <strong>«truca al 112»</strong>. Cada avís t’explica per què el veus i amb quines dades teues, i no t’envia cap notificació: el trobes quan hi entres. I que no n’hi haja cap <strong>no vol dir</strong> que <strong>tot vaja bé</strong>.</p>',
  '<h3>On es queden les dades</h3>',
  '<p>Les dades <strong>es queden en este dispositiu</strong>, dins d’este navegador. <strong>No s’envien</strong> a Sóc de Poble, ni a cap servidor, ni a cap intel·ligència artificial. Això té una altra cara: si <strong>s’esborren les dades</strong> del navegador o <strong>canvies de dispositiu</strong>, <strong>es perden</strong>, i per això el quadern et recorda que faces <strong>còpies de seguretat</strong>. I qui òbriga este navegador en este dispositiu <strong>ho pot vore tot</strong>.</p>',
  '<h3>Què ix d’ací i on s’obri</h3>',
  '<p>D’ací només ixen <strong>dos fitxers</strong>, i sempre <strong>per la teua mà</strong>: la còpia de seguretat, que ho porta tot, i el full per al metge, que descarregues o compartixes tu. Al full, <strong>el nom</strong> de la persona <strong>no hi va</strong> si no l’escrius en eixe moment. Per la mena de dades que guarda, el quadern només s’obri a la <strong>pàgina pròpia</strong> de Sóc de Poble, mai dins d’una altra web, i la primera vegada et demana que lliges l’avís i digues <strong>«Ho he entés»</strong>. Encara està <strong>en proves</strong>: si ací no es pot obrir, en lloc del botó <strong>«Obrir Salut»</strong> la pàgina et diu per què i què pots fer.</p>'
];

const GESTORIA = [
  '<h3>Per a què et servix</h3>',
  '<p>La <strong>Gestoria</strong> és un quadern per a <strong>ordenar els papers</strong> de la teua activitat: <strong>factures</strong>, <strong>contactes</strong> i <strong>comptes del trimestre</strong>. Així els <strong>tens a mà</strong> quan parles amb qui et porta la gestió.</p>',
  '<h3>Per on comences</h3>',
  '<p>Si ací baix tens el botó <strong>«Obrir la Gestoria»</strong>, prem-lo. Comença per <strong>«Identitat i Finestreta»</strong>, amb el <strong>teu nom</strong> i el del <strong>teu negoci</strong>, i després entra a <strong>«Facturació»</strong>. <strong>Revisa cada dada</strong> abans de donar-la per bona.</p>',
  '<h3>Un exemple del poble</h3>',
  '<p>Si <strong>vens oli</strong> o portes un <strong>taller</strong>, pots <strong>ordenar les factures</strong> de la faena i preparar el <strong>full trimestral</strong>. El que <strong>no has apuntat</strong> no apareix en els <strong>comptes</strong>.</p>',
  '<h3>Els papers continuen sent teus</h3>',
  '<p>Les <strong>dades financeres</strong> es guarden en <strong>este dispositiu</strong>. <strong>No apareixen a soles</strong> en un <strong>altre ordinador</strong>. Conserva els <strong>justificants originals</strong> i les còpies que necessites.</p>',
  '<h3>Què has de fer tu</h3>',
  '<p>L’eina <strong>no presenta impostos ni envia documents</strong> per tu. <strong>Tu revises</strong> els papers i <strong>decidixes</strong> què compartixes amb la teua gestora o gestor.</p>',
  '<h3>Si encara no la pots obrir</h3>',
  '<p>Encara està <strong>en proves</strong>. Si ací baix <strong>no tens el botó</strong>, davall et diem <strong>per què</strong> i <strong>què pots fer</strong>. <strong>Desactivar-la</strong> o tornar-la a activar <strong>no esborra</strong> els teus papers.</p>'
];

const RSS = [
  '<h3>Les notícies, en un mateix lloc</h3>',
  '<p>El <strong>Lector RSS</strong> està pensat per a <strong>llegir, tot junt</strong>, el que publiquen l’<strong>ajuntament</strong>, la cooperativa, el club o la <strong>comissió de festes</strong>. Així <strong>no has d’anar</strong> de web en web. Cada web que publica notícies és una <strong>font</strong>.</p>',
  '<h3>Com es fa servir</h3>',
  '<p>Si ací baix tens el botó <strong>«Obrir el Lector»</strong>, prem-lo. A la <strong>columna de les carpetes</strong>, <strong>«Gestiona les fonts»</strong> et deixa <strong>triar les webs</strong> que t’interessen i <strong>afegir-ne de teues</strong>, i a <strong>«Notícies»</strong> llegiràs el que publiquen.</p>',
  '<h3>Com està ara</h3>',
  '<p>El lector encara està <strong>en proves</strong>: de moment no hi ha <strong>cap font connectada</strong> i <strong>no arriba cap notícia</strong>, així que les dues pestanyes <strong>ixen buides</strong>. Quan les <strong>webs del poble</strong> estiguen connectades, les notícies <strong>arribaran ací soles</strong>.</p>',
  '<h3>Un exemple de cada dia</h3>',
  '<p><strong>Quan funcione</strong>, podràs <strong>seguir els avisos</strong> de les entitats que t’interessen i <strong>obrir cada notícia</strong> per a llegir-la. Cada notícia diu de <strong>quina web</strong> ve: el lector <strong>te la porta</strong>, però <strong>no l’ha escrita</strong>.</p>',
  '<h3>El que recorda el lector</h3>',
  '<p>El que <strong>lliges</strong>, el que <strong>deses</strong> i les <strong>fonts</strong> que seguixes es queden en <strong>este navegador</strong>. Si <strong>canvies de mòbil</strong> o d’ordinador, <strong>no ho trobaràs</strong>.</p>',
  '<h3>Si encara no el pots obrir</h3>',
  '<p>Si ací baix <strong>no tens el botó</strong>, davall et diem <strong>per què</strong> i què <strong>pots fer</strong>. <strong>Desactivar-lo</strong> o tornar-lo a activar <strong>no esborra</strong> res.</p>'
];

/** Sis blocs didàctics per eina, sense duplicar els títols de la pàgina. */
export const PRESENTACIO_PLUGINS = Object.freeze({
  rebost: REBOST.join('\n'),
  salut: SALUT.join('\n'),
  gestoria: GESTORIA.join('\n'),
  rss: RSS.join('\n')
});

/** L'HTML de la presentació d'un plugin (només claus pròpies), o null. */
export function presentacioDelPlugin(id) {
  if (typeof id !== 'string' || !Object.hasOwn(PRESENTACIO_PLUGINS, id)) return null;
  return PRESENTACIO_PLUGINS[id];
}
