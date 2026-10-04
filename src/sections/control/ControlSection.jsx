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
 * de detall. La fitxa s'obri amb una consulta sobre la mateixa ruta
 * (/control?fitxa=snippet, o /utilitats?fitxa=snippet): les rutes de Control
 * són exactes i no se n'afig cap (destiSnippet.js).
 * Correcció de la revisió · Com que el camí no canvia, App no recoloca res:
 * quan ?fitxa canvia, la fitxa s'obri des de dalt i el Panell torna on era en
 * prémer la targeta, amb el focus a <main> com en una ruta nova
 * (vistaDeLaFitxa.js).
 *
 * P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció»,
 * aprovat pel Mestre el 261003, que alça el W4-04 per a la presentació
 * d'este fitxer) · Les sis targetes de dalt porten dues portes, «Publicar» i
 * «Saber-ne més». Els destins viuen a destinsControl.js, l'única taula: cap
 * porta porta a una ruta que no és a App i les que no en tenen diuen que
 * estan en obres.
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
 * les targetes. La directriu 2325 diu el peu sense Connectar; el codi d'ara
 * el pinta (vegeu la Revisió R3, al final d'esta capçalera).
 * W4-09 · L'autor porta al xat corporatiu resolt pel port del backend
 * (xatCorporatiu.js); sense resoldre, no és enllaç i el Panell ho diu.
 *
 * P7-B · Onada 4, setena passada, bloc B (prompt 261004_0015 T3; relleu
 * PLUGINS_P7.txt) · «Utilitats i Connectors» pinta les onze utilitats de
 * registrePlugins.js (l'única taula: cap text ni ruta copiats ací) com a
 * UniversalCards canòniques: boina de Sóc de Poble, il·lustració, títol,
 * subtítol, entradilla, l'enllaç de tota la targeta a la seua pàgina
 * (/plugin/<id>, pel router) i el peu blau de P6 cap a eixa pàgina. El
 * Snippet continua al final, amb la seua fitxa (/control?fitxa=snippet) i la
 * mateixa anatomia. La preferència de DetallEspai ('sdp_utilitats_actives')
 * només amaga una utilitat amb un false explícit: per defecte es veuen totes.
 * W4-08 · Cens decidit pel Mestre (Acta 261004_0206, §4; relleu 02:30 de
 * l'informe de Claude 1951) · Mapa, Vehicle Compartit i Animalets viuen NOMÉS
 * dalt, com a targetes de publicació: cap plugin que ja té targeta dalt
 * (DESTINS_CONTROL) es repetix baix. Les eines d'administració van a la seua
 * secció, «Maquinària i Sistema» (IDS_MAQUINARIA). Cada targeta de baix
 * navega a /plugin/<id> (W4-11): «Obrir» el decidix la pàgina del plugin amb
 * useDestiDelPlugin, mai esta graella.
 * Revisió R3 · El Connectar del peu (showConnect) espera la decisió del
 * Mestre: la prova R3 de ControlSection.test.jsx en fa de fusible.
 */
import {
  LogOut,
  MessageSquare
} from 'lucide-react';
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { useEixidaSegura } from '../../components/universal/EixidaSegura.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Alerta, UniversalButton, UniversalCard } from '../../components/universal/../PedraSeca';
import { useUIActions } from '../../app/contexts/UIContext';
import { objecteDePagina } from '../../config/objecteConnectable.js';
import { getPreferenciaLlegat } from '../../config/storage.js';
import { FitxaSnippet } from './FitxaSnippet.jsx';
import { CLAU_FITXA, FITXA_SNIPPET, rutaDeLaFitxa } from './destiSnippet.js';
import { posicioDeLaVista, recolocaLaVista } from './vistaDeLaFitxa.js';
import { AUTORIA_SOCDEPOBLE, DESTINS_CONTROL, TEXTOS_PORTES, contingutDe, portesDe } from './destinsControl.js';
import { useXatCorporatiu } from './xatCorporatiu.js';
import { PLUGINS, rutaDelPlugin } from '../plugins/registrePlugins.js';

/* P5 · Una targeta de doble acció: la UniversalCard de sempre amb el
   contingut de la seua pàgina i les dues portes. Sense il·lustració (el
   Mapa), la icona va a la insígnia lateral.
   P6 · Amb el peu de sempre cap a la seua pàgina (mainHref, sense overlay
   perquè té portes) i sense etiquetes. Connectar (showConnect) espera la
   decisió del Mestre (revisió R3). `autorHref`: el xat corporatiu resolt, o
   res. */
function TargetaDeDesti({ desti, t, autorHref }) {
  const contingut = contingutDe(desti);
  if (!contingut) return null;
  const Icona = desti.icona;
  return (
    <UniversalCard
      title={contingut.titol}
      subtitle={contingut.subtitol}
      body={contingut.entradilla}
      imageUrl={desti.imatge || undefined}
      squareBadge={!desti.imatge && Icona ? {
        type: 'custom',
        label: contingut.titol,
        content: <Icona size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />
      } : null}
      {...AUTORIA_SOCDEPOBLE}
      authorHref={autorHref || undefined}
      time={contingut.time}
      date={contingut.date}
      dateTime={contingut.dateTime}
      mainHref={desti.saberMes}
      objecte={objecteDePagina({ titol: contingut.titol, ruta: desti.saberMes, id: desti.saberMes })}
      hasFooter={true}
      showConnect={true}
      portes={portesDe(desti, t)}
    />
  );
}

/* P7-B · Una utilitat de la graella de baix: la UniversalCard canònica, com
   les de dalt però amb l'enllaç de tota la targeta en lloc de les portes.
   Boina de Sóc de Poble sense data (el registre no en porta cap i no se
   n'inventa cap, com la seua pàgina), la il·lustració, títol, subtítol i
   entradilla, cap etiqueta, i el peu blau de P6 cap a la mateixa pàgina que
   obri la targeta: Traduir, Comentar i Compartir (Connectar, com dalt,
   espera la decisió del Mestre).
   `ruta` · la pàgina de la utilitat; és un Link del router: porta la base de
   l'amfitrió a l'href i navega dins del router en memòria de WordPress.
   `abansDObrir` · el Snippet hi recorda on era el Panell (vistaDeLaFitxa.js). */
function TargetaDUtilitat({ titol, subtitol, entradilla, imatge, imatgeAlt = '', ruta, autorHref, abansDObrir }) {
  return (
    <UniversalCard
      title={titol}
      subtitle={subtitol}
      body={entradilla || undefined}
      imageUrl={imatge}
      imageAlt={imatgeAlt}
      {...AUTORIA_SOCDEPOBLE}
      authorHref={autorHref || undefined}
      mainHref={ruta}
      onMainClick={abansDObrir}
      objecte={objecteDePagina({ titol, ruta, id: ruta })}
      hasFooter={true}
      showConnect={true}
    />
  );
}

/* P7-B · La preferència de les Utilitats (DetallEspai.jsx l'escriu amb la
   clau de llegat 'sdp_utilitats_actives': { <id>: booleà }) es llig com una
   EXCLUSIÓ explícita: una utilitat s'amaga NOMÉS si el valor guardat és
   exactament false. Sense preferència, malmesa o amb qualsevol altre valor,
   es veu: per defecte es pinten totes les del registre que no tenen targeta
   dalt (W4-08) i el Snippet. */
const CLAU_UTILITATS = 'sdp_utilitats_actives';
/* L'id del Snippet a APLICACIONS (profile/aplicacions.js), el que hi guarda DetallEspai. */
const ID_SNIPPET = 'snippet';
/* W4-08 · Les eines d'administració i de sistema, en l'ordre del registre:
   la secció «Maquinària i Sistema». */
const IDS_MAQUINARIA = Object.freeze(['consola', 'cervell', 'rss', 'tpv', 'bascula', 'disseny']);
/* W4-08 · Decisió del Mestre: un plugin amb targeta de publicació dalt (Mapa,
   Vehicle Compartit i Animalets) no es repetix a les graelles de baix. */
const IDS_NOMES_DALT = new Set(DESTINS_CONTROL.map((desti) => desti.id));
const visible = (amagades) => (plugin) => !amagades.has(plugin.id) && !IDS_NOMES_DALT.has(plugin.id);
/* Les dues graelles de baix: les utilitats i la maquinària, sense repetits. */
const PLUGINS_UTILITATS = PLUGINS.filter((plugin) => !IDS_MAQUINARIA.includes(plugin.id));
const PLUGINS_MAQUINARIA = PLUGINS.filter((plugin) => IDS_MAQUINARIA.includes(plugin.id));
/* El Snippet no és del registre de plugins: la seua targeta de sempre. */
const SNIPPET = Object.freeze({
  titol: 'Snippet',
  subtitol: 'Extensió de Chrome per a desar webs al Bloc',
  imatge: '/assets/nano_cards/snippet_nano_card.jpg'
});

function utilitatsAmagades(cru) {
  let valor = null;
  try {
    valor = JSON.parse(cru);
  } catch {
    return new Set();
  }
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return new Set();
  return new Set(Object.keys(valor).filter((id) => valor[id] === false));
}

export default function ControlSection() {
  const [params] = useSearchParams();
  const esFitxa = params.get(CLAU_FITXA) === FITXA_SNIPPET;
  /* El cos de la vista pintada (el .content-wrapper del Panell o de la fitxa). */
  const vistaRef = useRef(null);
  /* On era el Panell quan es va prémer la targeta del Snippet. */
  const posicioDelPanell = useRef(0);
  /* La vista que ja s'ha col·locat: en muntar no es toca res (App ja ho fa). */
  const vistaColocada = useRef(esFitxa);
  useLayoutEffect(() => {
    if (vistaColocada.current === esFitxa) return;
    vistaColocada.current = esFitxa;
    recolocaLaVista(vistaRef.current, esFitxa ? 0 : posicioDelPanell.current);
  }, [esFitxa]);
  const recordaLaPosicio = useCallback(() => {
    posicioDelPanell.current = posicioDeLaVista(vistaRef.current);
  }, []);
  return esFitxa
    ? <FitxaSnippet vistaRef={vistaRef} />
    : <PanellControl vistaRef={vistaRef} abansDeLaFitxa={recordaLaPosicio} />;
}

function PanellControl({ vistaRef, abansDeLaFitxa }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useUIActions();
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
     la preferència; ací només es llig en muntar el Panell, per storage.js). */
  const [amagades] = useState(() => utilitatsAmagades(getPreferenciaLlegat(CLAU_UTILITATS)));

  /* P5 · El títol de la graella, per a lector: les targetes h3 pengen d'un h2. */
  const idDestins = useId();
  /* W4-09 · On porta l'autor de la boina: en llavor, el xat de la llavor; en
     remot, l'entitat resolta pel port. Sense entitat o amb error, avís honest. */
  const xatCorporatiu = useXatCorporatiu();
  const senseXatCorporatiu = xatCorporatiu.estat === 'absent' || xatCorporatiu.estat === 'error';

  return (
    <UniversalPage
      title={t('section.control.title', 'Panell de Control')}
      subtitle={t(
        'section.control.subtitle',
        "Node principal i accés a les eines d'administració i gestió"
      )}
      lead={t(
        'section.control.lead',
        "Tria on vols publicar i crea nous continguts des de l'editor universal."
      )}
      chrome="system"
      showLogos={true}
    >
      <div ref={vistaRef} className="content-wrapper">
        <section aria-labelledby={idDestins}>
          <h2 id={idDestins} className="sdp-sr-only">{t(...TEXTOS_PORTES.titol)}</h2>
          {/* P5 · Les targetes de doble acció, en la graella de sempre (destinsControl.js):
              les sis de 2245 i, des del 261004, Treball i Habitatge. */}
          <div className="sdp-card-grid">
            {DESTINS_CONTROL.map((desti) => (
              <TargetaDeDesti key={desti.id} desti={desti} t={t} autorHref={xatCorporatiu.href} />
            ))}
          </div>
          {senseXatCorporatiu ? (
            <Alerta to="info">Xat de Sóc de Poble: encara no disponible en este servidor.</Alerta>
          ) : null}
        </section>

        <section>
          <h2>Utilitats i Connectors (Plugins)</h2>

          <p className="lead">
            El sistema s'anirà enriquint amb aquest tipus d'utilitats (o plugins) que es poden activar si es necessiten.
            Són independents del sistema base, cosa que permet endollar funcionalitats a mesura només per als usuaris o clients que les demanen.
          </p>

          <div className="sdp-card-grid">
            {PLUGINS_UTILITATS.filter(visible(amagades)).map((plugin) => (
              <TargetaDUtilitat
                key={plugin.id}
                titol={plugin.titol}
                subtitol={plugin.subtitol}
                entradilla={plugin.entradilla}
                imatge={plugin.imatge}
                imatgeAlt={plugin.imatgeAlt}
                ruta={rutaDelPlugin(plugin.id)}
                autorHref={xatCorporatiu.href}
              />
            ))}
            {amagades.has(ID_SNIPPET) ? null : (
              <TargetaDUtilitat
                titol={SNIPPET.titol}
                subtitol={SNIPPET.subtitol}
                imatge={SNIPPET.imatge}
                ruta={rutaDeLaFitxa(pathname)}
                autorHref={xatCorporatiu.href}
                abansDObrir={abansDeLaFitxa}
              />
            )}
          </div>
        </section>

        {/* W4-08 · La separació de les Utilitats la dona el full d'estils
            (.sdp-control-maquinaria, modules.css), sense estil en línia. */}
        <section className="sdp-control-maquinaria">
          <h2>Maquinària i Sistema</h2>

          <p className="lead">
            Panells d'administració, configuració de disseny i eines internes de la plataforma.
            Aquestes utilitats normalment s'activen només per a l'equip d'administració.
          </p>

          <div className="sdp-card-grid">
            {PLUGINS_MAQUINARIA.filter(visible(amagades)).map((plugin) => (
              <TargetaDUtilitat
                key={plugin.id}
                titol={plugin.titol}
                subtitol={plugin.subtitol}
                entradilla={plugin.entradilla}
                imatge={plugin.imatge}
                imatgeAlt={plugin.imatgeAlt}
                ruta={rutaDelPlugin(plugin.id)}
                autorHref={xatCorporatiu.href}
              />
            ))}
          </div>
        </section>

        <div className="sdp-control-actions">
          {/* D3 · El fil '0001' no existix (els id són UUID): obri el Xat. */}
          <UniversalButton
            onClick={() => navigate('/xat')}
            variant="primary"
            icon={<MessageSquare size={18} />}
            className="sdp-btn-ample"
          >
            Missatges per a dubtes
          </UniversalButton>

          <UniversalButton
            variant="ghost"
            icon={<LogOut size={18} />}
            onClick={eixida.demana}
            disabled={eixida.ocupat || Boolean(eixida.avis)}
            className="sdp-btn-ample"
          >
            Eixir del poble
          </UniversalButton>
        </div>
        {eixida.avis}
        {eixida.error ? <p className="sdp-camp__error" role="alert">{eixida.error}</p> : null}
      </div>
    </UniversalPage>
  );
}
