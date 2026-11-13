/**
 * ControlSection.jsx — el Panell de Control (/control i l'àlies /utilitats).
 *
 * D3 (ordre del Mestre, 260930): cap targeta porta a una ruta que no existix.
 * «Gestoria de Poble» no té secció i diu «EN OBRES» sense clic, com les
 * altres; «Missatges per a dubtes» obri el Xat (/xat). D16: «Novetats» s'ha
 * amagat del rail del Xat i la targeta «Ajustos del xat» és ara l'entrada al
 * Control del xat (/control-xat). Porta el mateix dibuix que la capçalera
 * d'eixa pàgina (CircleDashed): el que toques és el que s'obri.
 *
 * CU (Onada 3, 261003) · Les Utilitats guanyen el Snippet, l'única amb fitxa
 * de detall (des de R16-W1 viu a «Maquinària i Sistema»: vegeu el paràgraf
 * R16-W1, al final). La fitxa s'obri amb una consulta sobre la mateixa ruta
 * (/control?fitxa=snippet, o /utilitats?fitxa=snippet): les rutes de Control
 * són exactes i no se n'afig cap (destiSnippet.js).
 * Correcció de la revisió · Com que el camí no canvia, App no recoloca res:
 * quan ?fitxa canvia, la fitxa s'obri des de dalt i el Panell torna on era en
 * prémer la targeta, amb el focus a <main> com en una ruta nova
 * (vistaDeLaFitxa.js).
 * control-03 (revisió del Panell, 261104) · El mateix per a les fitxes de
 * «Mode rural» i «Restaurar dades obertes» (?fitxa=mode-rural|opendata), que
 * s'obrien on era el Panell i amb el focus al <body>.
 *
 * P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció»,
 * aprovat pel Mestre el 261003, que alça el W4-04 per a la presentació
 * d'este fitxer) · Les targetes de dalt porten dues portes, «Publicar» i
 * «Saber-ne més». Els destins viuen a destinsControl.js, l'única taula: cap
 * porta porta a una ruta que no és a App i les que no en tenen diuen que
 * estan en obres. Peça C (ordre del Mestre, 261007, prompt 261007_1628) ·
 * Són vuit: les sis de P5 i, des del W4-08 (261004), Treball i Habitatge
 * (DESTINS_CONTROL). Abans esta capçalera en deia sis.
 * ESMENA 261003 22:34 (directrius 2234 i 2245 del Mestre) · Són
 * UniversalCards estàndard, en la graella de sempre (.sdp-card-grid): boina
 * de l'entitat socdepoble (l'autor obri el seu xat corporatiu), imatge, i
 * títol, subtítol i entradilla visibles, llegits de la UniversalPage de cada
 * targeta (PAGE_COPY), on porta «Saber-ne més». Mapa, Vehicle Compartit i
 * Animalets continuen a les posicions 4, 5 i 6, amb els títols literals de
 * 2245 (ControlSection.test.jsx ho vigila). Les Utilitats, el Snippet i els
 * botons de baix no canvien.
 *
 * P6 · Onada 4, sisena passada (directriu 261003_2325 del Mestre) · Les
 * targetes del Panell SÓN pàgines: boina taronja dalt (Sóc de Poble, La Torre
 * de les Maçanes, data i hora) i peu blau baix (Traduir, Comentar i
 * Compartir), com al Mur. L'única variació és el cos: les dues portes en lloc
 * de l'enllaç de tota la targeta, i cap etiqueta. Per això Mapa, Vehicle
 * Compartit i Animalets ja no porten la píndola «EN OBRES»: diu que estan en
 * obres la porta Publicar inerta (aria-disabled, «(en obres)» al nom i el
 * toast). El peu porta a la pàgina de la targeta, la de «Saber-ne més»:
 * Comentar, al seu objecte; Compartir, la seua adreça; Traduir, el de totes
 * les targetes. La directriu 2325 diu el peu sense Connectar; derogat per
 * l'ordre del Mestre del 261009 (vegeu la Revisió R3, al final d'esta
 * capçalera).
 * W4-09 · L'autor porta al xat corporatiu resolt pel port del backend
 * (xatCorporatiu.js); sense resoldre, no és enllaç i el Panell ho diu.
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · Derogat per l'ordre
 * del Mestre del 261004 (prompt 261004_0515), per a la boina: l'autor de
 * totes les targetes del Panell, dalt i baix, porta SEMPRE a la seua pàgina,
 * la del projecte (AUTORIA_SOCDEPOBLE.authorHref). El xat corporatiu passa a
 * Comentar del peu (el missatge directe a l'autor, skill sdp-universal-page);
 * sense resoldre, Comentar avisa i l'Alerta del Panell es conserva.
 * Ordre del Mestre (261007) · «COMENTARIS = XAT» (correcció C2) · Derogat el
 * Comentar propi del Panell: les targetes no passen cap onComment i porten
 * el menú de dues vies de totes (BotoComentar, useAccions). «En privat» és
 * este mateix xat amb Sóc de Poble; «En públic» es queda desactivada mentre
 * /page/<clau> i /plugin/<id> no tinguen xat públic. L'Alerta llig la
 * resolució ÚNICA de l'app (useXatSocDePobleResolt), no una de pròpia.
 * T8 (ordre del Mestre, 261004, «imatges fantasma») · La imatge de les
 * targetes de dalt és la capçalera de la seua pàgina (contingutDe): cap
 * il·lustració escrita a mà.
 *
 * P7-B · Onada 4, setena passada, bloc B (prompt 261004_0015 T3; relleu
 * PLUGINS_P7.txt) · «Utilitats i Connectors» pinta les utilitats de
 * registrePlugins.js (l'única taula: cap text ni ruta copiats ací; dotze des
 * del W4-08 (261004), quan MarIA hi va afegir «disseny»; la peça C (261007)
 * corregix el compte, que deia onze; onze de nou des de l'ordre del Mestre
 * (261007) · Bàscula descartada per ara, que la lleva de la interfície i la
 * deixa només al Full de ruta; huit des de l'Onada 8 (261009), que en trau
 * la Consola, el Cervell i Disseny) com a
 * UniversalCards canòniques: boina de Sóc de Poble, il·lustració, títol,
 * subtítol, entradilla, l'enllaç de tota la targeta a la seua pàgina
 * (/plugin/<id>, pel router) i el peu blau de P6 cap a eixa pàgina. El
 * Snippet continua al final, amb la seua fitxa (/control?fitxa=snippet) i la
 * mateixa anatomia. La preferència de DetallEspai ('sdp_utilitats_actives')
 * només amaga una utilitat amb un false explícit: per defecte es veuen totes.
 * R16-W1 · DEROGADA la secció «Utilitats i Connectors»: es quedava buida (cada
 * targeta de baix viu en un espai o a «Maquinària i Sistema») i ja no es
 * pinta. El Snippet, amb la mateixa fitxa i la mateixa anatomia, tanca
 * «Maquinària i Sistema».
 * W4-08 · Cens decidit pel Mestre (Acta 261004_0206, §4; relleu 02:30 de
 * l'informe de Claude 1951) · Mapa, Vehicle Compartit i Animalets viuen NOMÉS
 * dalt, com a targetes de publicació: cap plugin que ja té targeta dalt
 * (DESTINS_CONTROL) es repetix baix. Les eines d'administració van a la seua
 * secció, «Maquinària i Sistema» (IDS_MAQUINARIA). Cada targeta de baix
 * navega a /plugin/<id> (W4-11): «Obrir» el decidix la pàgina del plugin amb
 * useDestiDelPlugin, mai esta graella. L'Onada 8 (261009; decisions D3 i D7
 * de MarIA) en va fer una excepció per a les tres pàgines del sistema, que
 * portaven el botó «Obrir…» de la seua pàgina. DEROGADA per l'Onada 10
 * (vegeu més avall): W4-11 torna a valdre per a TOTES les targetes de baix.
 * Revisió R3 · Derogada per l'ordre del Mestre del 261009 (requeriments
 * 261009_1300, punt 2: les targetes del Panell «no poden perdre elements» i
 * «han de ser autèntiques Universal Cards»; decisió D1 de MarIA): totes les
 * targetes del Panell, dalt i baix, porten Connectar i el copyright. Abans,
 * showConnect={false} i cap copyright. La prova R3 vigila ara el peu de
 * quatre accions.
 *
 * Onada 8 (261009; requeriments 261009_1300, punt 2; decisions D2, D4, D5 i
 * D7 de MarIA) · «Consola Termodinàmica», «El Cervell» i «Panell de Disseny»
 * són pàgines, no plugins: ixen del registre. «Maquinària i Sistema» les
 * pintava primer, amb la targeta del Mur (la data de la seua pàgina, les
 * etiquetes o el botó «Obrir…», el copyright i Connectar), i la preferència
 * de DetallEspai les amagava per la seua clau. DEROGAT per l'Onada 10 (el
 * paràgraf següent): continuen sent pàgines i no plugins, però ja no tenen
 * targeta al Panell.
 *
 * Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) ·
 *   · «Consola Termodinàmica», «El Cervell» i «Disseny Pedra Seca» ixen del
 *     Panell de Control i viuen només al Mur (SYSTEM_PAGES, MurSection). Ací
 *     no en queda res: ni la targeta, ni la llista de les pàgines de la
 *     maquinària que portava destinsControl.js, ni la lectura del copy del
 *     core. «Maquinària i Sistema» conserva la secció, l'h2 i les dues eines
 *     del registre: el Lector RSS i el TPV del Bar (R16-W1 · DEROGAT per al
 *     TPV del Bar, que passa a «Economia i Empresa»: del registre, la secció
 *     només porta el Lector RSS). Les preferències ja
 *     desades amb les claus d'aquelles pàgines es queden al storage, sense
 *     efecte: no s'esborra res (profile/aplicacions.js, `panell: null`).
 *   · W4-11 torna a valdre per a totes les targetes de baix: cap targeta
 *     obri directament una eina ni pinta cap botó gran.
 *   · M4 · TOTES les targetes de plugin del Panell (Gestoria, Rebost
 *     Domèstic, Salut, Lector RSS, TPV del Bar i el Snippet) passen a targeta
 *     canònica: la franja taronja amb la data i l'hora, i les etiquetes
 *     Categoria i Etiqueta. Ixen del registre (camps `data` i `etiquetes` de
 *     registrePlugins.js), com la resta de la targeta: cap text ni cap data
 *     copiats ací. El Snippet, que no és del registre, porta les seues
 *     (SNIPPET, més avall, i destiSnippet.js). DEROGADES, només per a estes
 *     targetes: la D6 de l'Onada 8 («cap data per a les eines»), la P6 («cap
 *     etiqueta al Panell») i la R1 dels espais en la part de «cap data».
 *     L'ordre nova: la targeta de plugin porta la data FIXA de la seua font,
 *     que no ix de les dades de ningú, i les dues etiquetes. La resta de R1
 *     continua sencera: cap xifra, comptador ni avís que isca de les dades.
 *   · M3 · El Rebost Domèstic i Salut es queden ací, a «La llar»: no entren
 *     al Mur. R16-W1 · DEROGAT M3 per al Rebost, que passa a «Economia i
 *     Empresa»; Salut continua a «La llar».
 *   · Les huit targetes de dalt no canvien: la data de la seua pàgina i cap
 *     etiqueta (P6).
 *
 * Onada 2 de la Gestoria (ordre del Mestre, 261004; MAPA_EMPRESA_GESTORIA.txt
 * §2.2; decisió A11: només les targetes que ja funcionen) · Dos espais nous,
 * «L'empresa» i «La llar», entre «Publica al poble» i les Utilitats (R16-W1:
 * «L'empresa» es diu «Economia i Empresa», i els dos espais van entre
 * «Publica al poble» i «Maquinària i Sistema»). Els
 * llig del registre (ESPAIS_PLUGINS i el camp `espai` de cada plugin): cap
 * text ni ruta copiats ací. Cada targeta és la TargetaDUtilitat de sempre
 * (boina de Sóc de Poble cap al projecte, il·lustració, títol, subtítol,
 * entradilla, tota la targeta cap a /plugin/<id> i el peu canònic). Targetes
 * estàtiques: cap xifra ni dada (R1); des de l'Onada 10, amb l'única excepció
 * de la data fixa del registre (vegeu més amunt). Un plugin d'un espai no es
 * repetix a «Maquinària i Sistema» (W4-08), i cap targeta viu en dos espais
 * (R3).
 *
 * R16-W1 · L'estructura d'ara, de dalt a baix:
 *   · «Publica al poble»: les huit targetes de doble acció (DESTINS_CONTROL).
 *   · «Economia i Empresa» i «La llar», els dos espais del registre
 *     (ESPAIS_PLUGINS). Quin plugin va a cada espai ho diu el registre (camp
 *     `espai`), no este fitxer. DEROGAT M3 per al Rebost: el Rebost Domèstic
 *     passa de «La llar» a «Economia i Empresa», amb la Gestoria i el TPV del
 *     Bar.
 *   · «Maquinària i Sistema», una sola graella: La IAIA Sabuda (només amb la
 *     curadoria cultural encesa, PRODUCCIO-02), el Lector RSS (l'únic del
 *     registre, IDS_MAQUINARIA) i el Snippet, al final.
 *   · Els botons de baix: els de les fitxes de Mode rural i de les dades
 *     obertes, Missatges per a dubtes, Compte i contrasenya i Eixir del poble.
 *   La secció «Utilitats i Connectors» ja no existix: no en queda cap h2 ni
 *   cap graella.
 *
 * R18 · T2 (P0-101; prompt 261111_0148) · Les targetes del registre (els dos
 * espais i «Maquinària i Sistema») pinten etiquetesAmbEstat(plugin, idioma):
 * la Categoria i l'Etiqueta del registre i, si l'eina és en proves, la
 * insígnia «En proves · Beta oberta» en la llengua de la interfície, la
 * mateixa que la pàgina del plugin (PluginPage.jsx). Una eina estable pinta
 * exactament el que pintava. DEROGAT per P0-113 (ordre del Mestre, 261111)
 * «Hui cap eina del registre és en proves»: la Gestoria, el TPV del Bar i el
 * Rebost («Economia i Empresa»), Salut («La llar») i el Lector RSS
 * («Maquinària i Sistema») s'obrin en producció i porten la insígnia;
 * l'Arbre Genealògic, en obres, no (betaOberta.test.jsx). Cap canvi de codi
 * ací: el Panell ja llig `estat` per etiquetesAmbEstat.
 * DEROGAT per R19 · T3 (pla 261111_1720): l'Arbre Genealògic també s'obri i
 * porta la insígnia a la web pròpia.
 */
import {
  KeyRound,
  LogOut,
  MessageSquare
} from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { useEixidaSegura } from '../../components/universal/EixidaSegura.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { COPYRIGHT_SDP, encapcalamentDeTargeta } from '../../components/universal/editorial.js';
import { Alerta, UniversalButton, UniversalCard } from '../../components/PedraSeca';
import { useXatSocDePobleResolt } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { llegixUtilitatsActives, subscriuUtilitatsActives } from '../profile/utilitatsActives.js';
import { FitxaSnippet } from './FitxaSnippet.jsx';
import { CLAU_FITXA, DATA_DEL_SNIPPET, ETIQUETES_DEL_SNIPPET, FITXA_SNIPPET, rutaDeLaFitxa } from './destiSnippet.js';
import { DATA_NODRIR_IAIA, ETIQUETES_NODRIR_IAIA, IMATGE_NODRIR_IAIA, PAGINA_NODRIR_IAIA, RUTA_PAGINA_NODRIR_IAIA, TEXTOS_IAIA_SABUDA } from '../text/pageContent.nodrirIaia.js';
import { posicioDeLaVista, recolocaLaVista } from './vistaDeLaFitxa.js';
import { AUTORIA_SOCDEPOBLE, DESTINS_CONTROL, TEXTOS_PORTES, contingutDe, portesDe } from './destinsControl.js';
import { AVISOS_XAT_CORPORATIU } from './xatCorporatiu.js';
import { ESPAIS_PLUGINS, PLUGINS, TEXTOS_ESPAIS_PLUGINS, etiquetesAmbEstat, pluginsDeLEspai, rutaDelPlugin } from '../plugins/registrePlugins.js';
import { TEXTOS_MODE_RURAL } from './textosModeRural.js';
import { TEXTOS_RESTAURADOR } from '../pobles/RestauradorOpenData.jsx';
import { RUTA_COMPTE } from '../../config/rutaEntrada.js';
const ModeRural = lazy(() => import('./ModeRural.jsx'));
const FitxaOpenData = lazy(() => import('./FitxaOpenData.jsx'));

/* P5 · Una targeta de doble acció: la UniversalCard de sempre amb el
   contingut de la seua pàgina i les dues portes. Sense il·lustració, la
   icona va a la insígnia lateral.
   P6 · Amb el peu de sempre cap a la seua pàgina (mainHref, sense overlay
   perquè té portes) i sense etiquetes.
   Ordre del Mestre (261009; revisió R3 derogada) · Universal Card sencera:
   Connectar (el de sempre de useAccions, cap a la seua pàgina) i el
   copyright de les pàgines del sistema.
   T6 (261004) · La boina, la d'AUTORIA_SOCDEPOBLE amb la seua ruta (el
   projecte).
   Ordre del Mestre (261007) · Cap onComment: Comentar és el menú de dues
   vies de totes les targetes («En privat», el xat amb Sóc de Poble).
   T8 (261004) · La imatge i el seu text alternatiu, els de la capçalera de
   la pàgina (contingutDe): la targeta reflectix el hero. */
function TargetaDeDesti({ desti, t }) {
  const contingut = contingutDe(desti);
  if (!contingut) return null;
  const Icona = desti.icona;
  return (
    <UniversalCard
      title={contingut.titol}
      subtitle={contingut.subtitol}
      body={contingut.entradilla}
      imageUrl={contingut.imatge || undefined}
      imageAlt={contingut.imatgeAlt}
      squareBadge={!contingut.imatge && Icona ? {
        type: 'custom',
        label: contingut.titol,
        content: <Icona size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />
      } : null}
      {...AUTORIA_SOCDEPOBLE}
      time={contingut.time}
      date={contingut.date}
      dateTime={contingut.dateTime}
      mainHref={desti.saberMes}
      hasFooter={true}
      copyright={COPYRIGHT_SDP}
      portes={portesDe(desti, t)}
    />
  );
}

/* P7-B · Una utilitat de la graella de baix: la UniversalCard canònica, com
   les de dalt però amb l'enllaç de tota la targeta en lloc de les portes.
   Boina de Sóc de Poble, la il·lustració, títol, subtítol i entradilla, i el
   peu blau de P6 cap a la mateixa pàgina que obri la targeta: Traduir,
   Comentar i Compartir.
   Ordre del Mestre (261009; revisió R3 derogada) · I Connectar i el
   copyright, com dalt.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
   Targeta canònica sencera: la franja taronja amb la data i l'hora, i les
   etiquetes Categoria i Etiqueta. DEROGAT «boina sense data (el registre no
   en porta cap)» i «cap etiqueta»: el registre ja porta les dues coses, i
   l'ordre nova és pintar-les.
   `data` · la cadena de data de la font (el registre, o el Snippet), o
   null. Es llig amb dataHoraDeBarra, com la de les targetes de dalt
   (contingutDe) i la de la barra taronja de la seua pàgina: targeta i pàgina
   diuen el mateix. Sense data, cap pastilla: no se n'inventa cap (T51).
   `etiquetes` · les de la font, tal qual ({ text, className }); sense, cap
   llista.
   Cap `accio` ni cap `portes`: la targeta de plugin no ha portat mai botó
   gran, i així continua (W4-11: «Obrir» el decidix la seua pàgina).
   `ruta` · la pàgina de la utilitat; és un Link del router: porta la base de
   l'amfitrió a l'href i navega dins del router en memòria de WordPress.
   `abansDObrir` · el Snippet hi recorda on era el Panell (vistaDeLaFitxa.js).
   T6 (261004) · La boina porta al projecte, com dalt.
   Ordre del Mestre (261007) · Comentar, el menú de dues vies, com dalt. */
function TargetaDUtilitat({ titol, subtitol, entradilla, imatge, imatgeAlt = '', ruta, abansDObrir, data = null, etiquetes, dataTestId }) {
  const t = useTraductorOpcional();
  return (
    <UniversalCard
      title={titol}
      subtitle={subtitol}
      body={entradilla || undefined}
      imageUrl={imatge}
      imageAlt={imatgeAlt}
      {...AUTORIA_SOCDEPOBLE}
      {...encapcalamentDeTargeta({ created_at: data }, { author: AUTORIA_SOCDEPOBLE.author, location: AUTORIA_SOCDEPOBLE.location, t })}
      labels={etiquetes}
      mainHref={ruta}
      onMainClick={abansDObrir}
      hasFooter={true}
      copyright={COPYRIGHT_SDP}
      dataTestId={dataTestId}
    />
  );
}

/* Onada 2 de la Gestoria (261004; MAPA §2.2) · Un espai del Panell,
   «Economia i Empresa» o «La llar»: una secció amb el seu h2, l'entradeta i la
   graella de sempre, amb les targetes canòniques del registre. Sense cap
   targeta visible (la persona les ha llevades totes a DetallEspai), no es
   pinta: cap capçalera buida.
   Onada 10 (261010; decisions M3 i M4 del Mestre) · El Rebost Domèstic i
   Salut es quedaven a «La llar» (M3), i totes les targetes dels espais porten
   la data i les etiquetes del registre (M4).
   R16-W1 · DEROGAT M3 per al Rebost, que passa a «Economia i Empresa»; Salut
   continua a «La llar». Quin plugin va a cada espai ho diu el registre (camp
   `espai`).
   R16b (C3-12) · El títol i l'entradeta, en la llengua de la interfície
   (TEXTOS_ESPAIS_PLUGINS, el mateix codi d'idioma que TEXTOS_CONTROL); sense
   textos per a eixa llengua, els del registre (ESPAIS_PLUGINS). */
function EspaiDelPanell({ espai, idioma, visibles }) {
  const plugins = pluginsDeLEspai(espai.id).filter(visibles);
  if (plugins.length === 0) return null;
  const textos = TEXTOS_ESPAIS_PLUGINS[idioma]?.[espai.id] ?? espai;
  return (
    <section>
      <h2>{textos.titol}</h2>
      <p className="lead">{textos.entradeta}</p>
      <div className="sdp-card-grid">
        {plugins.map((plugin) => (
          <TargetaDUtilitat
            key={plugin.id}
            titol={plugin.titol}
            subtitol={plugin.subtitol}
            entradilla={plugin.entradilla}
            imatge={plugin.imatge}
            imatgeAlt={plugin.imatgeAlt}
            ruta={rutaDelPlugin(plugin.id)}
            data={plugin.data}
            etiquetes={etiquetesAmbEstat(plugin, idioma)}
            dataTestId={`control-plugin-${plugin.id}`}
          />
        ))}
      </div>
    </section>
  );
}

/* P7-B · La preferència de les Utilitats ({ <id>: booleà }, la que escriu
   DetallEspai.jsx) es llig com una EXCLUSIÓ explícita: una utilitat s'amaga
   NOMÉS si el valor guardat és exactament false. Sense preferència, malmesa o
   amb qualsevol altre valor, es veu: per defecte es pinten totes les del
   registre que no tenen targeta dalt (W4-08) i el Snippet.
   Higiene d'amfitrió (ordre del Mestre, 261004) · Es llig per
   utilitatsActives.js: la clau amb prefix de storage.js i, si no n'hi ha, la
   de llegat ('sdp_utilitats_actives').
   Peça C (ordre del Mestre, 261007, prompt 261007_1628) · Les claus són els
   ids d'esta graella: DetallEspai ja escriu amb l'id del Panell
   (profile/aplicacions.js, camp `panell`: 'rss', no 'lector-rss'), i el
   Perfil llig la mateixa regla (estaAlPanell). Una preferència desada abans
   amb l'id vell arriba ací traduïda (utilitatsActives.js, ALIES_DEL_PANELL).
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010) · La
   Consola i el Cervell ja no tenen targeta ací: al Perfil porten `panell:
   null` i no ofereixen cap preferència. Les claus que algú ja tinga desades
   ('consola', 'cervell', 'disseny' o la vella 'metriques') no casen amb cap
   targeta: es queden al storage, sense efecte. */
/* L'id del Snippet a APLICACIONS (profile/aplicacions.js), el que hi guarda DetallEspai. */
const ID_SNIPPET = 'snippet';
/* R16-W1 · La targeta de La IAIA Sabuda, en les cinc llengües de l'App.
   R16b · Una sola font, pageContent.nodrirIaia.js: el títol i el subtítol són els de
   TEXTOS_IAIA_SABUDA, i l'entradeta i el text alternatiu, els de la seua pàgina
   (PAGINA_NODRIR_IAIA). Ací no se'n copia cap.
   R16b (tercera ronda) · Les etiquetes, també per llengua (ETIQUETES_NODRIR_IAIA): una Categoria
   i una Etiqueta sense enllaç, com les altres targetes de baix. Cap altre fitxer llig esta taula:
   és local. La targeta no té cap preferència per a amagar-la (cap entrada d'APLICACIONS,
   profile/aplicacions.js, en porta l'id): només la governa la curadoria cultural. */
const PAGINA_IAIA_SABUDA = PAGINA_NODRIR_IAIA['la-iaia-sabuda'];
const TEXTOS_CONTROL = Object.freeze(Object.fromEntries(
  Object.entries(TEXTOS_IAIA_SABUDA).map(([llengua, { titol, subtitol }]) => {
    const pagina = llengua === 'ca' ? PAGINA_IAIA_SABUDA : PAGINA_IAIA_SABUDA.translations[llengua];
    return [llengua, Object.freeze({
      nodrirIaia: Object.freeze({
        titol, subtitol, resum: pagina.lead, imatgeAlt: pagina.imageAlt, etiquetes: ETIQUETES_NODRIR_IAIA[llengua]
      })
    })];
  })
));
/* PRODUCCIO-02 (revisió R15b) · La IAIA Sabuda només té targeta amb la curadoria cultural encesa
   (VITE_SDP_CURADORIA_CULTURAL=1, la mateixa guarda que el Mur a targetesMur.js): apagada, la seua
   pàgina no recull res. Es llig en cada pintat perquè vi.stubEnv la governe. */
const ambCuradoriaCultural = () => import.meta.env.VITE_SDP_CURADORIA_CULTURAL === '1';
/* W4-08 · Les eines d'administració i de sistema del registre: la secció
   «Maquinària i Sistema». Onada 10 (261010; decisió del Mestre del 261010) ·
   La Consola, el Cervell i Disseny hi viuen només al Mur.
   R16-W1 · El TPV del Bar passa a «Economia i Empresa» (registre, camp
   `espai`): del registre hi queda el Lector RSS, i el Snippet s'hi afig. */
const IDS_MAQUINARIA = Object.freeze(['rss']);
/* W4-08 · Decisió del Mestre: un plugin amb targeta de publicació dalt (Mapa,
   Vehicle Compartit i Animalets) no es repetix a les graelles de baix. */
const IDS_NOMES_DALT = new Set(DESTINS_CONTROL.map((desti) => desti.id));
const visible = (amagades) => (plugin) => !amagades.has(plugin.id) && !IDS_NOMES_DALT.has(plugin.id);
const SENSE_ESPAI = PLUGINS.filter((plugin) => !plugin.espai);
const PLUGINS_MAQUINARIA = SENSE_ESPAI.filter((plugin) => IDS_MAQUINARIA.includes(plugin.id));
/* El Snippet no és del registre de plugins: la seua targeta de sempre.
   Onada 10 (261010; pla 261010_1121; decisió del Mestre del 261010, M4) ·
   També passa a targeta canònica, amb les dues coses que porten les del
   registre:
     data      · DATA_DEL_SNIPPET (destiSnippet.js, on viuen el criteri i
                 l'evidència): només el dia, perquè cap font en documenta
                 l'hora. La pastilla pinta la data sense hora; l'hora no
                 s'inventa (T51). La mateixa constant alimenta la barra
                 taronja de la fitxa: targeta i pàgina diuen el mateix.
     etiquetes · una Categoria i una Etiqueta, en l'ordre de la skill
                 sdp-universal-page (§4) i sense enllaç (D3). Són un
                 ESBORRANY per al Mestre: la Categoria, la mateixa de les
                 eines del registre; l'Etiqueta diu què és.
                 Onada 11 (261010; prompt 261010_1730, tasca 6, D5) · Viuen a
                 destiSnippet.js (ETIQUETES_DEL_SNIPPET), amb la data: la
                 fitxa les pinta a la seua capçalera, com la pàgina d'un
                 plugin, i targeta i fitxa diuen el mateix. */
const SNIPPET = Object.freeze({
  titol: 'Snippet',
  subtitol: 'Extensió de Chrome per a desar webs al Bloc',
  imatge: '/assets/nano_cards/snippet_nano_card.jpg',
  data: DATA_DEL_SNIPPET,
  etiquetes: ETIQUETES_DEL_SNIPPET
});

/* La preferència ja arriba sanejada (un objecte pla o {}): només compta el false explícit. */
function utilitatsAmagades(preferencia) {
  return new Set(Object.keys(preferencia).filter((id) => preferencia[id] === false));
}

/* control-03 (revisió del Panell, 261104) · Les fitxes que s'obrin amb
   ?fitxa sobre la mateixa ruta. Un valor que no n'és cap pinta el Panell. */
const FITXA_MODE_RURAL = 'mode-rural';
const FITXA_OPENDATA = 'opendata';
const FITXES = new Set([FITXA_SNIPPET, FITXA_MODE_RURAL, FITXA_OPENDATA]);

export default function ControlSection() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useUIActions();
  /* control-03 (261104) · La vista pintada: '' és el Panell. Abans només es
     recolocava el Snippet (un booleà); ara, qualsevol fitxa. */
  const demanada = params.get(CLAU_FITXA);
  const fitxa = FITXES.has(demanada) ? demanada : '';
  /* El cos de la vista pintada (el .content-wrapper del Panell o de la fitxa
     o, mentre es carrega una fitxa diferida, el seu text d'espera). */
  const vistaRef = useRef(null);
  /* On era el Panell quan es va prémer la targeta del Snippet o un dels
     botons de les fitxes. */
  const posicioDelPanell = useRef(0);
  /* La vista que ja s'ha col·locat: en muntar no es toca res (App ja ho fa). */
  const vistaColocada = useRef(fitxa);
  useLayoutEffect(() => {
    if (vistaColocada.current === fitxa) return;
    vistaColocada.current = fitxa;
    recolocaLaVista(vistaRef.current, fitxa ? 0 : posicioDelPanell.current);
  }, [fitxa]);
  const recordaLaPosicio = useCallback(() => {
    posicioDelPanell.current = posicioDeLaVista(vistaRef.current);
  }, []);
  /* control-03 (261104) · La primera vegada, el mòdul diferit encara no hi
     és: el text d'espera porta el ref perquè la vista es col·loque ja (i el
     focus vaja a <main>). La fitxa, quan arriba, el porta al seu cos.
     control-06 (261104) · El text d'espera passa pel traductor, com el botó
     que l'obri: abans pintava la reserva en valencià. */
  if (fitxa === FITXA_MODE_RURAL) return <Suspense fallback={<p ref={vistaRef} role="status">{t(...TEXTOS_MODE_RURAL.titol)}</p>}><ModeRural vistaRef={vistaRef} onBack={() => navigate('/control')} /></Suspense>;
  if (fitxa === FITXA_OPENDATA) return <Suspense fallback={<p ref={vistaRef} role="status">{t(...TEXTOS_RESTAURADOR.titol)}</p>}><FitxaOpenData vistaRef={vistaRef} onBack={() => navigate('/control')} /></Suspense>;
  return fitxa === FITXA_SNIPPET
    ? <FitxaSnippet vistaRef={vistaRef} />
    : <PanellControl vistaRef={vistaRef} abansDeLaFitxa={recordaLaPosicio} />;
}

function PanellControl({ vistaRef, abansDeLaFitxa }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  /* R16b (tercera ronda) · La llengua de la interfície, de useUIActions: UIProvider hi posa la
     mateixa `language` que a l'estat (UIContext.jsx), i el Panell ja en llig `t`. */
  const { t, language } = useUIActions();
  const idioma = String(language || 'ca').toLowerCase().split('-')[0];
  const textosNodrir = (TEXTOS_CONTROL[idioma] || TEXTOS_CONTROL.ca).nodrirIaia;
  /* T47 (correcció de la revisió, 260928) · «Eixir del poble» és la mateixa
     eixida que «Tancar sessió»: la de SessionContext, que primer envia el
     pendent i després oblida els esborranys d'este dispositiu. C01 · Si
     queda res que el servidor no té, ho diu abans i la persona decidix.
     Ordre del Mestre 260930 (P2) · Sense recàrrega: a WordPress,
     window.location.reload() recarregava la pàgina sencera de l'amfitrió.
     Tancar la sessió ja mou la generació del servei i els proveïdors de la
     persona es buiden per àmbit (el mateix que «Tanca la sessió» dels
     Ajustos del Xat, FullAjustos.jsx). */
  const despresDEixir = useCallback(() => {
    navigate('/registre', { replace: true });
  }, [navigate]);
  const eixida = useEixidaSegura({ despres: despresDEixir });

  /* Les Utilitats que la persona ha llevat del Panell (DetallEspai.jsx escriu
     la preferència). Es llig en muntar el Panell i, si canvia mentre és a la
     vista, l'estat compartit d'utilitatsActives.js ho diu: cap 'storage' a
     window (ordre del Mestre, 261004). */
  const [amagades, setAmagades] = useState(() => utilitatsAmagades(llegixUtilitatsActives()));
  useEffect(
    () => subscriuUtilitatsActives(() => setAmagades(utilitatsAmagades(llegixUtilitatsActives()))),
    []
  );

  /* P5 · El títol de la graella, per a lector: les targetes h3 pengen d'un h2. */
  const idDestins = useId();
  /* W4-09 · El xat corporatiu: en llavor, el xat de la llavor; en remot,
     l'entitat resolta pel port. Sense entitat o amb error, avís honest.
     Ordre del Mestre (261007, correcció C2) · Ja no és el Comentar propi del
     Panell: és la via «En privat» del menú de totes les targetes, i la
     resolució és la ÚNICA de l'app (ProveidorXatSocDePoble). L'Alerta la
     llig amb useXatSocDePobleResolt, que la demana en obrir el Panell (sense
     esperar cap clic) i no en fa cap de pròpia. */
  const xatSocDePoble = useXatSocDePobleResolt();
  const senseXatSocDePoble = xatSocDePoble.estat === 'absent' || xatSocDePoble.estat === 'error';

  /* AH-04 · Fer clic sobre el cos, la imatge o el títol d'una targeta de
     publicació (fora de la boina, les portes i el peu) obri la seua pàgina
     explicativa (/page/<pagina>), igual que la porta «Saber-ne més». */
  const obriPaginaDeTargeta = useCallback((event) => {
    const objectiu = event.target instanceof Element ? event.target : null;
    if (!objectiu) return;
    if (objectiu.closest('a, button, input, select, textarea, [role="button"], [role="menuitem"], .sp-card-header, .sp-card-portes, .sp-card-footer')) {
      return;
    }
    const targeta = objectiu.closest('article.sp-card');
    if (!targeta) return;
    const graella = event.currentTarget;
    const index = [...graella.querySelectorAll(':scope > article.sp-card')].indexOf(targeta);
    const desti = DESTINS_CONTROL[index];
    if (desti?.saberMes) navigate(desti.saberMes);
  }, [navigate]);

  return (
    <UniversalPage
      title={t('section.control.title', 'Panell de Control')}
      subtitle={t(
        'section.control.subtitle',
        "Node principal i accés a les eines d'administració i gestió"
      )}
      lead={t(
        'section.control.lead'
      )}
      chrome="system"
      showLogos={true}
    >
      <div ref={vistaRef} className="content-wrapper">
        <section aria-labelledby={idDestins}>
          <h2 id={idDestins} className="sdp-sr-only">{t(...TEXTOS_PORTES.titol)}</h2>
          {/* P5 · Les targetes de doble acció, en la graella de sempre (destinsControl.js):
              les sis de 2245 i, des del 261004, Treball i Habitatge. */}
          <div className="sdp-card-grid" onClick={obriPaginaDeTargeta}>
            {DESTINS_CONTROL.map((desti) => (
              <TargetaDeDesti key={desti.id} desti={desti} t={t} />
            ))}
          </div>
          {senseXatSocDePoble ? (
            <Alerta to="info">{t(...AVISOS_XAT_CORPORATIU.noDisponible)}</Alerta>
          ) : null}
        </section>

        {/* Onada 2 de la Gestoria (261004) i R16-W1 · «Economia i Empresa» i «La llar»,
            en l'ordre del registre (ESPAIS_PLUGINS): dos espais separats. */}
        {ESPAIS_PLUGINS.map((espai) => (
          <EspaiDelPanell key={espai.id} espai={espai} idioma={idioma} visibles={visible(amagades)} />
        ))}

        {/* W4-08 i R16-W1 · «Maquinària i Sistema» agrupa en una sola .sdp-card-grid
            el Lector RSS i el Snippet, i davant, amb la curadoria cultural encesa,
            «La IAIA Sabuda». */}
        <section className="sdp-control-maquinaria">
          <h2>{t('section.control.maquinaria.titol', 'Maquinària i Sistema')}</h2>

          {/* R16b · L'entradeta diu el que hi ha: el Lector RSS i el Snippet per defecte, i La IAIA
              Sabuda només amb la curadoria cultural (per això «com»). Cap targeta és un panell
              d'administració ni demana cap rol: /control no porta guarda (App.jsx). */}
          <p className="lead">
            {t('section.control.maquinaria.lead', 'Altres eines de la plataforma, com el Lector RSS i el Snippet, l’extensió de Chrome per a desar webs al Bloc.')}
          </p>

          <div className="sdp-card-grid">
            {!ambCuradoriaCultural() ? null : (
              <TargetaDUtilitat
                titol={textosNodrir.titol}
                subtitol={textosNodrir.subtitol}
                entradilla={textosNodrir.resum}
                imatge={IMATGE_NODRIR_IAIA}
                imatgeAlt={textosNodrir.imatgeAlt}
                ruta={RUTA_PAGINA_NODRIR_IAIA}
                data={DATA_NODRIR_IAIA}
                etiquetes={textosNodrir.etiquetes}
                dataTestId="control-card-nodrir-iaia"
              />
            )}
            {PLUGINS_MAQUINARIA.filter(visible(amagades)).map((plugin) => (
              <TargetaDUtilitat
                key={plugin.id}
                titol={plugin.titol}
                subtitol={plugin.subtitol}
                entradilla={plugin.entradilla}
                imatge={plugin.imatge}
                imatgeAlt={plugin.imatgeAlt}
                ruta={rutaDelPlugin(plugin.id)}
                data={plugin.data}
                etiquetes={etiquetesAmbEstat(plugin, idioma)}
                dataTestId={`control-plugin-${plugin.id}`}
              />
            ))}
            {amagades.has(ID_SNIPPET) ? null : (
              <TargetaDUtilitat
                titol={SNIPPET.titol}
                subtitol={SNIPPET.subtitol}
                imatge={SNIPPET.imatge}
                ruta={rutaDeLaFitxa(pathname)}
                abansDObrir={abansDeLaFitxa}
                data={SNIPPET.data}
                etiquetes={SNIPPET.etiquetes}
                dataTestId="control-card-snippet"
              />
            )}
          </div>
        </section>

        <div className="sdp-control-actions">
          {/* control-03 (261104) · Com la targeta del Snippet, els dos botons
              recorden on era el Panell abans d'obrir la seua fitxa. */}
          <UniversalButton onClick={() => { abansDeLaFitxa(); navigate('/control?fitxa=mode-rural'); }} variant="secondary" className="sdp-btn-ample">
            {t(...TEXTOS_MODE_RURAL.titol)}
          </UniversalButton>
          <UniversalButton onClick={() => { abansDeLaFitxa(); navigate('/control?fitxa=opendata'); }} variant="secondary" className="sdp-btn-ample">
            {t(...TEXTOS_RESTAURADOR.titol)}
          </UniversalButton>
          {/* D3 · El fil '0001' no existix (els id són UUID): obri el Xat. */}
          <UniversalButton
            onClick={() => navigate('/xat')}
            variant="primary"
            icon={<MessageSquare size={18} />}
            className="sdp-btn-ample"
          >
            {t('section.control.dubtes', 'Missatges per a dubtes')}
          </UniversalButton>

          {/* P0-63 / IDEA-194 (ordre del Mestre, 261108) · La contrasenya viu a
              «El compte» del Perfil: qui la busca ací (per a entrar a l'App
              mòbil amb correu i contrasenya) hi va d'un toc. Sense sessió, la
              barrera del Perfil (RequireAuth) porta a l'entrada amb tornada, i
              en entrar s'aterra al compte (rutaEntrada.js, RUTA_COMPTE).
              UniversalButton és Boto (PedraSeca/index.js): la clau 🔑 va per
              `icona`, la seua API; `icon` i `variant` no hi arriben. */}
          <UniversalButton
            onClick={() => navigate(RUTA_COMPTE)}
            varietat="secundari"
            icona={KeyRound}
            className="sdp-btn-ample"
          >
            {t('section.control.compte', 'Compte i contrasenya')}
          </UniversalButton>

          <UniversalButton
            variant="ghost"
            icon={<LogOut size={18} />}
            onClick={eixida.demana}
            disabled={eixida.ocupat || Boolean(eixida.avis)}
            className="sdp-btn-ample"
          >
            {t('section.control.eixir', 'Eixir del poble')}
          </UniversalButton>
        </div>
        {eixida.avis}
        {eixida.error ? <p className="sdp-camp__error" role="alert">{eixida.error}</p> : null}
      </div>
    </UniversalPage>
  );
}
