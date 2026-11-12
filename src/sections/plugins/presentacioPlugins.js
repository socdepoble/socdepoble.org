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
 * destí ja no hi ha cap botó inert (PluginPage.jsx, F2). (DEROGAT per P0-113,
 * vegeu més avall: el Rebost i Salut deien «en lloc del botó, la pàgina et
 * diu per què i què pots fer».)
 *
 *   PRESENTACIO_PLUGINS       { rebost, salut, genealogia, gestoria, rss, avisador }: una cadena HTML per plugin,
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
 * revisar el Mestre i, idealment, algú de salut. El text diu que les eines
 * estan en proves. DEROGAT (Gauntlet 261022_0225, F2) «i que el botó pot ser
 * inert»: sense destí no n'hi ha cap.
 *
 * P0-113 (ordre del Mestre, 261111: «ENCÉN en producció» el Rebost, Salut,
 * la Gestoria i el Lector RSS «com a eines gratuïtes obertes») · Les quatre
 * s'obrin en producció, i l'últim bloc ja no parla de no poder-les obrir:
 * DEROGAT «en lloc del botó, la pàgina et diu per què i què pots fer» (el
 * Rebost i Salut) i «Si ací baix no tens el botó, davall et diem per què»
 * (la Gestoria i el Lector, el bloc «Si encara no la/el pots obrir»). Ara
 * diuen, breu, que estan en proves, que el botó hi porta i, la Gestoria i el
 * Lector, que són gratuïts; cap parla de pagar. Salut conserva que només
 * s'obri a la pàgina pròpia (amaDelDocument). Esborrany pendent del Mestre.
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
  '<p>I el que <strong>no fa</strong>: no porta <strong>preus</strong>, al Rebost no hi ha <strong>quantitats</strong> ni <strong>dates de caducitat</strong>, i <strong>no compra res per tu</strong>. Només recorda el que tu li dius. Encara està <strong>en proves</strong>: el botó <strong>«Obrir el Rebost»</strong> t’hi porta.</p>'
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
  '<p>D’ací només ixen <strong>dos fitxers</strong>, i sempre <strong>per la teua mà</strong>: la còpia de seguretat, que ho porta tot, i el full per al metge, que descarregues o compartixes tu. Al full, <strong>el nom</strong> de la persona <strong>no hi va</strong> si no l’escrius en eixe moment. Per la mena de dades que guarda, el quadern només s’obri a la <strong>pàgina pròpia</strong> de Sóc de Poble, mai dins d’una altra web, i la primera vegada et demana que lliges l’avís i digues <strong>«Ho he entés»</strong>. Encara està <strong>en proves</strong>: a la pàgina pròpia, el botó <strong>«Obrir Salut»</strong> t’hi porta.</p>'
];

const GESTORIA = [
  '<h3>Per a què et servix</h3>',
  '<p>La <strong>Gestoria</strong> és un quadern per a <strong>ordenar els papers</strong> de la teua activitat: <strong>factures</strong>, <strong>contactes</strong> i <strong>comptes del trimestre</strong>. Així els <strong>tens a mà</strong> quan parles amb qui et porta la gestió.</p>',
  '<h3>Per on comences</h3>',
  '<p>Si ací baix tens el botó <strong>«Obrir la Gestoria»</strong>, prem-lo. Comença per <strong>«Facturació»</strong>: és la part que <strong>ja funciona</strong> sense cap pas previ. El Tauler i <strong>«Identitat i Finestreta»</strong> encara demanen <strong>una aprovació</strong> que hui no es pot fer des d’esta web. <strong>Revisa cada dada</strong> abans de donar-la per bona.</p>',
  '<h3>Un exemple del poble</h3>',
  '<p>Si <strong>vens oli</strong> o portes un <strong>taller</strong>, pots <strong>ordenar les factures</strong> de la faena i preparar el <strong>full trimestral</strong>. El que <strong>no has apuntat</strong> no apareix en els <strong>comptes</strong>.</p>',
  '<h3>Els papers continuen sent teus</h3>',
  '<p>Les <strong>dades financeres</strong> es guarden en <strong>este dispositiu</strong>. <strong>No apareixen a soles</strong> en un <strong>altre ordinador</strong>. Conserva els <strong>justificants originals</strong> i les còpies que necessites.</p>',
  '<h3>Què has de fer tu</h3>',
  '<p>L’eina <strong>no presenta impostos ni envia documents</strong> per tu. <strong>Tu revises</strong> els papers i <strong>decidixes</strong> què compartixes amb la teua gestora o gestor.</p>',
  '<h3>Gratuïta i en proves</h3>',
  '<p>La Gestoria és <strong>gratuïta</strong> i encara està <strong>en proves</strong>. <strong>Desactivar-la</strong> o tornar-la a activar <strong>no esborra</strong> els teus papers.</p>'
];

const RSS = [
  '<h3>Les notícies, en un mateix lloc</h3>',
  '<p>El <strong>Lector RSS</strong> està pensat per a <strong>llegir, tot junt</strong>, el que publiquen l’<strong>ajuntament</strong>, la cooperativa, el club o la <strong>comissió de festes</strong>. Així <strong>no has d’anar</strong> de web en web. Cada web que publica notícies és una <strong>font</strong>.</p>',
  '<h3>Com es fa servir</h3>',
  '<p>Si ací baix tens el botó <strong>«Obrir el Lector»</strong>, prem-lo. A la <strong>columna de les carpetes</strong>, <strong>«Gestiona les fonts»</strong> et deixa <strong>triar les webs</strong> que t’interessen i <strong>afegir-ne de teues</strong>, i a <strong>«Notícies»</strong> llegiràs el que publiquen.</p>',
  '<h3>Com està ara</h3>',
  '<p>El lector encara està <strong>en proves</strong>. <strong>De sèrie</strong> porta <strong>webs de coneixement obert</strong>, i les <strong>webs del poble</strong> encara no hi estan connectades. Si esta web <strong>no té el servei</strong> de notícies, el lector et diu que encara <strong>no hi ha cap font connectada</strong>.</p>',
  '<h3>Un exemple de cada dia</h3>',
  '<p><strong>Quan el poble hi siga</strong>, podràs <strong>seguir els avisos</strong> de les entitats que t’interessen i <strong>obrir cada notícia</strong> per a llegir-la. Cada notícia diu de <strong>quina web</strong> ve: el lector <strong>te la porta</strong>, però <strong>no l’ha escrita</strong>.</p>',
  '<h3>El que recorda el lector</h3>',
  '<p>El que <strong>lliges</strong>, el que <strong>deses</strong> i les <strong>fonts</strong> que seguixes es queden en <strong>este navegador</strong>. Si <strong>canvies de mòbil</strong> o d’ordinador, <strong>no ho trobaràs</strong>. Per a llegir una font que afegixes tu, el servei de notícies de Sóc de Poble <strong>en rep l’adreça</strong>.</p>',
  '<h3>Gratuït i en proves</h3>',
  '<p>El lector és <strong>gratuït</strong> i encara està <strong>en proves</strong>. <strong>Desactivar-lo</strong> o tornar-lo a activar <strong>no esborra</strong> res.</p>'
];

/* R19 · T3 (ordre del Mestre, 261111; pla 261111_1720: «encesa de
   /app/genealogia a registrePlugins.js») · L'Arbre Genealògic ja és una app
   que s'obri en producció (apps/genealogia), i la presentació torna al
   present amb el que fa de veres. Cada bloc, contra el codi de l'app:
     1 · les fitxes (nom, cognoms, malnom, casa, lloc i ofici; dates exactes,
         aproximades o estimades): textos.js, 'camp.*' i 'precisio.*';
     2 · l'entrevista d'una sola pregunta per torn, de la casa i el mas als
         besavis (nucli/passosEntrevista.js), i la fitxa a «Persones»;
     3 · els quatre estats i «Cognom ≠ Parentiu» (textos.js, 'avis.estats' i
         'entrevista.cognom');
     4 · «Germans, padrins i testimonis», «Arxius públics» i «Prompts per a
         copiar» (manifest.js; textos.js, 'fan.explica',
         'arxiu.consultes.explica', 'prompts.explica' i 'avis.noFa');
     5 · les dades al dispositiu, la còpia i les persones vives (textos.js,
         'avis.on', 'panell.copia.text' i 'avis.vius');
     6 · «GEDCOM i còpia» i «Prepara, no publica» (textos.js,
         'exporta.preparaNoPublica'), la pàgina pròpia (dadesPersonals 'salut',
         amaDelDocument, com Salut) i «Entesos» (vistes/Intercanvi.jsx,
         PortaAvis d'AppGenealogia.jsx).
   Cap promesa de dictat de veu ni d'arbre per a imprimir: l'app no en porta.
   presentacioPlugins.test.js en vigila els literals citats.
   DEROGAT (R18 · T2, P0-101) el text en futur i «Encara està en obres: el
   botó «Obrir l’Arbre Genealògic» encara no s’obri, i la pàgina et diu per
   què.»: hui el botó hi porta. Esborrany pendent del Mestre. */
const GENEALOGIA = [
  '<h3>Què és l’Arbre Genealògic</h3>',
  '<p>L’<strong>Arbre Genealògic</strong> és un quadern per a <strong>recollir la memòria de la família</strong> i ordenar-la en un <strong>arbre</strong>. Guarda els <strong>noms i els cognoms</strong>, el <strong>malnom de la casa</strong>, el <strong>mas o el poble</strong> i l’ofici de cada persona, amb dates <strong>exactes o aproximades</strong>, perquè els nets sàpien d’on venen.</p>',
  '<h3>Una pregunta cada vegada</h3>',
  '<p>Primer <strong>crees un arbre</strong> i, a l’<strong>«Entrevista»</strong>, respons <strong>una sola pregunta</strong> cada vegada: el <strong>malnom de la casa</strong>, el mas o el poble, tu i els teus germans, els pares, els <strong>quatre iaios</strong> i els besavis que recordes. El que no és obligatori, <strong>ho pots saltar</strong>, i a <strong>«Persones»</strong> completes cada fitxa quan vulgues.</p>',
  '<h3>Què és segur i què és memòria</h3>',
  '<p>Cada fitxa i cada vincle diu <strong>com ho saps</strong>: <strong>[CONFIRMAT]</strong> si hi ha un document, <strong>[APROXIMAT]</strong> si ho diu la memòria de la família, <strong>[FALTA CONFIRMAR]</strong> si encara no hi ha prova i <strong>[CONTRADICCIÓ]</strong> si les dates no lliguen. L’eina <strong>no inventa cap dada</strong>, i compartir cognom no vol dir ser família: <strong>mai no ajunta ningú</strong> pel cognom.</p>',
  '<h3>Germans, padrins i arxius</h3>',
  '<p>A <strong>«Germans, padrins i testimonis»</strong> veus la <strong>gent del voltant</strong> de cada persona: els padrins i els testimonis solen ser família o veïns de la casa. A <strong>«Arxius públics»</strong> trobes on buscar i les <strong>consultes per a copiar</strong> al cercador de cada arxiu, i a <strong>«Prompts per a copiar»</strong>, un text per al teu assistent. <strong>No cerca als arxius</strong> ni parla amb cap intel·ligència artificial: <strong>ho copies tu</strong>.</p>',
  '<h3>On es queden les dades</h3>',
  '<p>Les dades <strong>es queden en este dispositiu</strong>, dins d’este navegador, i <strong>no s’envien enlloc</strong>: no cal cap compte. Si el navegador les esborra, <strong>es perden</strong>, i per això l’eina et recorda que <strong>faces una còpia</strong> de tant en tant. Les <strong>persones que poden estar vives</strong> ixen com <strong>«Persona viva»</strong> a les consultes, als prompts i als fitxers, si no marques la casella amb el seu consentiment.</p>',
  '<h3>Els fitxers i on s’obri</h3>',
  '<p>A <strong>«GEDCOM i còpia»</strong> pots <strong>exportar l’arbre en GEDCOM</strong>, el format dels programes de genealogia, o en una còpia per a tornar-la a carregar ací, i també importar-ne un. <strong>«Prepara, no publica»</strong>: el fitxer no es puja enlloc, i tu decidixes on el guardes i amb qui el compartixes. Per la mena de dades que guarda, l’Arbre Genealògic només s’obri a la <strong>pàgina pròpia</strong> de Sóc de Poble, mai dins d’una altra web, i la primera vegada et demana que lliges l’avís i digues <strong>«Entesos»</strong>. Encara està <strong>en proves</strong>: a la pàgina pròpia, el botó <strong>«Obrir l’Arbre Genealògic»</strong> t’hi porta.</p>'
];

/* P0-114 (ordre del Mestre, 261111, punt 3: «presentar també les sis
   seccions didàctiques <h3> + <p> a presentacioPlugins.js per a … avisador»)
   · Veritat nua, amb les paraules de la seua pàgina (pages/textosAvisador.js,
   `intro`, `limitacions`, `descansMaxim` i `activa`) i del seu servei
   (services/avisador.js: HORES_AVISADOR, de quatre a vint-i-quatre hores;
   d'una a tres persones amb conversa privada; el descans de com a molt dotze
   hores; components/salut/AvisadorEnSessio.jsx: uns minuts de gràcia en
   tornar). Cap promesa de servidor ni de sincronització: els ajustos viuen en
   este dispositiu (avisadorPreferencies.js) i l'únic que ix és el missatge del
   Xat a les persones triades. «App» no, que no és paraula del poble
   (presentacioPlugins.test.js): «Sóc de Poble». Esborrany pendent del
   Mestre. */
const AVISADOR = [
  '<h3>Què és l’Avisador</h3>',
  '<p><strong>L’Avisador</strong> és un <strong>avís veïnal</strong> per a qui viu a soles o vol que algú <strong>estiga pendent</strong>. Si passen les hores que has triat <strong>sense activitat</strong> a Sóc de Poble, envia pel <strong>Xat</strong> un missatge a les teues <strong>persones de confiança</strong> perquè es posen en contacte amb tu.</p>',
  '<h3>Com es posa en marxa</h3>',
  '<p>A la pàgina de l’Avisador tries <strong>quantes hores</strong> poden passar <strong>sense activitat</strong>: quatre, huit, dotze o vint-i-quatre. Després tries <strong>d’una a tres persones</strong> amb qui ja tens una <strong>conversa privada</strong> al <strong>Xat</strong>, lliges <strong>les condicions</strong> i prems <strong>«Activa l’Avisador»</strong>.</p>',
  '<h3>El descans de la nit</h3>',
  '<p>Per a no avisar <strong>mentre dorms</strong>, marques <strong>l’inici i la fi</strong> del <strong>descans nocturn</strong>. Durant eixe temps el comptador <strong>es pausa</strong>, i el descans pot durar com a molt <strong>dotze hores</strong>.</p>',
  '<h3>Quan funciona i quan no</h3>',
  '<p>Només funciona amb la <strong>sessió personal oberta</strong>, mentre Sóc de Poble <strong>pot executar-se</strong> i té <strong>connexió al Xat</strong>. Si Sóc de Poble està <strong>tancat o suspés</strong>, si el dispositiu està <strong>apagat</strong> o si el Xat <strong>no està disponible</strong>, l’avís <strong>pot no arribar</strong>. En tornar a obrir-lo, espera <strong>uns minuts</strong> abans d’avisar.</p>',
  '<h3>On es queden els ajustos</h3>',
  '<p>Els <strong>ajustos</strong> es guarden <strong>en este dispositiu</strong>, dins d’este <strong>navegador</strong>, i <strong>no passen a soles</strong> a un altre mòbil. El <strong>missatge d’avís</strong> viatja pel <strong>Xat de Sóc de Poble</strong>, com qualsevol altre missatge, i només el reben <strong>les persones que tries</strong>.</p>',
  '<h3>Què no fa</h3>',
  '<p>L’Avisador <strong>no és teleassistència</strong> ni un <strong>servei d’emergències</strong>: no truca a ningú i <strong>no sap on estàs</strong>. Per a una emergència, <strong>telefona al 112</strong>. Encara està <strong>en proves</strong>: el botó <strong>«Obrir l’Avisador»</strong> t’hi porta.</p>'
];

/** Sis blocs didàctics per eina, sense duplicar els títols de la pàgina. */
export const PRESENTACIO_PLUGINS = Object.freeze({
  rebost: REBOST.join('\n'),
  salut: SALUT.join('\n'),
  genealogia: GENEALOGIA.join('\n'),
  gestoria: GESTORIA.join('\n'),
  rss: RSS.join('\n'),
  avisador: AVISADOR.join('\n')
});

/** L'HTML de la presentació d'un plugin (només claus pròpies), o null. */
export function presentacioDelPlugin(id) {
  if (typeof id !== 'string' || !Object.hasOwn(PRESENTACIO_PLUGINS, id)) return null;
  return PRESENTACIO_PLUGINS[id];
}
