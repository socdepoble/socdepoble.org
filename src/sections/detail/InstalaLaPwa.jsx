/**
 * InstalaLaPwa.jsx · P1-69 (ordre del Mestre, 261028 20:13; decisions de
 * l'onada 2 del Bloc H) · «📲 Instal·lar l'App (PWA)» a /page/descarregues,
 * DALT I AL FINAL, el patró de /page/consola (accioAlFinal): dins del bloc
 * blanc de l'H1 (div.page-title-accio, la ranura accioPrincipal de PageFrame)
 * i repetit després del cos (div.sdp-pagina-accio). El cos (PAGE_COPY) no
 * canvia ni un byte: l'empremta de la frontissa aprovada el 261028 continua
 * valent. La pàgina no té cap apartat «1. Aplicació web progressiva (PWA)»:
 * el seu és «A l'ordinador i des de qualsevol navegador», i la guia hi porta
 * (TITOL_INSTRUCCIONS, l'H4 de les instruccions de cada navegador).
 *
 * Què pinta (modeDInstalacio):
 *  · 'instalada' · ja corre instal·lada (display-mode del manifest o
 *    navigator.standalone) o s'acaba d'instal·lar: l'avís d'èxit
 *    «Aplicació ja instal·lada en aquest dispositiu», sense botó;
 *  · 'directa' · Chromium (escriptori o Android) ha oferit
 *    beforeinstallprompt: el clic obri el diàleg del navegador (demana()
 *    crida prompt() dins del clic, sense cap await abans) i la pàgina en
 *    reflectix el resultat;
 *  · 'ios', 'safari-mac' i 'menu' · sense esdeveniment: el clic desplega la
 *    guia (dos passos a l'iPhone i a l'iPad, el menú Arxiu al Safari del Mac,
 *    el menú del navegador a Chromium i Android);
 *  · null · Firefox d'escriptori i la resta: cap botó que no puga complir.
 * Darrere, les ranures de botiga (config/canalsDeBotiga.js), que hui no
 * pinten res.
 *
 * Es decidix amb la dada (useInstalacioDeLaPagina, que crida
 * PageDetailSection), mai amb l'element: un element que pinta null faria un
 * div.page-title-accio buit. El ganxo no llig cap context de React. Qui sap
 * si esta és l'entrada pròpia és el magatzem de la instal·lació: només
 * src/main.jsx en crida la captura. Ni el paquet autònom (WordPress,
 * Sollutia), on instal·lar seria instal·lar la pàgina de l'amfitrió, ni l'app
 * nativa no la criden, i allí no es pinta res. La pàgina ja és nomesWeb
 * (T1-06): la guarda d'esAppNativa és defensa en profunditat.
 *
 * Revisió adversarial (261028) · «Instal·lada» ve del magatzem
 * (estaInstalada), que recorda la instal·lació feta en qualsevol pàgina; el
 * navegador integrat d'Android (Instagram, Facebook: «; wv)») no rep cap
 * guia, perquè el seu menú no instal·la; l'avís de «cancel·lada» només ix al
 * costat del botó premut, i el d'«instal·lada» és viu només dalt (un sol
 * anunci); després d'«accepted» el focus va a l'avís que substituïx el
 * botó; una guia oberta no es plega sola si l'oferta arriba després; les
 * botigues van només dalt (un enllaç per botiga a la pàgina).
 */
import { useCallback, useEffect, useId, useState, useSyncExternalStore } from 'react';
import { useUIActions } from '../../app/contexts/UIContext';
import { CANALS_DE_BOTIGA, canalsOberts } from '../../config/canalsDeBotiga.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { INSTALACIO, esFinestraDApp } from '../../pwa/instalacio.js';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';

/* La clau de la pàgina del sistema que porta l'acció (SYSTEM_PAGES, nomesWeb). */
export const PAGINA_D_INSTALACIO = 'descarregues';

/* L'H4 de PAGE_COPY.descarregues amb les instruccions de cada navegador. El
   sanejador lleva els `id`: la guia el troba pel text. */
export const TITOL_INSTRUCCIONS = "Com s'instal·la des del navegador";

/* Motius de la captura (motiuPerNoOferir) que diuen que la finestra no és de
   l'entrada pròpia, o que no s'hi pot instal·lar res: cap captura (paquet
   autònom o app nativa), un iframe, l'app nativa o un context insegur. */
const SENSE_ENTRADA_PROPIA = new Set(['sense-captura', 'sense-finestra', 'incrustat', 'nativa', 'context-insegur']);
const MODES_DE_GUIA = new Set(['ios', 'safari-mac', 'menu']);
const NO_ES_SAFARI = /\b(?:Chrome|Chromium|CriOS|FxiOS|EdgiOS|Edg|OPR|Firefox)\//;

/** La finestra és la de l'entrada pròpia (src/main.jsx) i s'hi pot instal·lar. */
export function esEntradaPropia(motiu) {
  return motiu !== undefined && !SENSE_ENTRADA_PROPIA.has(motiu);
}

/**
 * La guia d'un navegador sense beforeinstallprompt, per l'agent d'usuari.
 * Pura i tolerant: mai no llança.
 *  · 'ios' · iPhone, iPad i iPod; l'iPadOS es presenta com a Mac, però tàctil;
 *  · 'safari-mac' · el Safari del Mac a partir del 17 («Afegeix al Dock»);
 *  · 'menu' · Android (Firefox i la resta també hi afigen a la pantalla d'inici);
 *  · null · la resta (Firefox d'escriptori, un Safari antic, el navegador
 *    integrat d'una app d'Android, «; wv)», que no té cap opció d'instal·lar…).
 * @param {{ navegador?: Navigator }} [opcions]
 * @returns {'ios'|'safari-mac'|'menu'|null}
 */
/** El navegador integrat d'una app d'Android (Instagram, Facebook): «; wv)». */
function esNavegadorIntegrat(navegador) {
  try { return /;\s*wv\)/.test(String(navegador?.userAgent || '')); } catch { return false; }
}

export function guiaDInstalacio({ navegador = globalThis.navigator } = {}) {
  try {
    const agent = String(navegador?.userAgent || '');
    const mac = /\bMacintosh\b/.test(agent);
    if (/\b(?:iPhone|iPad|iPod)\b/.test(agent) || (mac && Number(navegador?.maxTouchPoints) > 1)) return 'ios';
    if (mac) {
      const versio = NO_ES_SAFARI.test(agent) ? null : /\bVersion\/(\d+)[\d.]*\b.*\bSafari\//.exec(agent);
      return versio && Number(versio[1]) >= 17 ? 'safari-mac' : null;
    }
    if (esNavegadorIntegrat(navegador)) return null;
    if (/\bAndroid\b/.test(agent)) return 'menu';
  } catch { /* un navigator trencat no és cap senyal */ }
  return null;
}

/**
 * El mode de l'acció, o null si no se n'ha de pintar cap. Pura: `motiu` és
 * el de l'última captura (INSTALACIO.motiuDeLaCaptura), `ofereix` si hi ha
 * un esdeveniment guardat i `instalada` si s'ha instal·lat en esta càrrega
 * (INSTALACIO.estaInstalada).
 * @returns {'instalada'|'directa'|'ios'|'safari-mac'|'menu'|null}
 */
export function modeDInstalacio({ motiu, ofereix = false, instalada = false, finestra, navegador = finestra?.navigator } = {}) {
  if (!esEntradaPropia(motiu)) return null;
  if (instalada === true || motiu === 'instalada' || esFinestraDApp(finestra, navegador)) return 'instalada';
  if (ofereix) return 'directa';
  // Chromium escolta però encara no ha oferit res (o ja s'ha gastat): el seu menú també instal·la.
  // Un navegador integrat que escolta l'esdeveniment no té cap menú que instal·le: res.
  if (motiu === null || motiu === 'mobil') return esNavegadorIntegrat(navegador) ? null : 'menu';
  if (motiu === 'sense-suport') return guiaDInstalacio({ navegador });
  return null;
}

const senseSubscripcio = () => () => {};
const senseOferta = () => false;

/**
 * El ganxo de PageDetailSection: per a /page/descarregues, { mode, instala,
 * canals }, o null si no s'ha de pintar res (una altra pàgina, l'app nativa,
 * fora de l'entrada pròpia, o cap mode ni cap botiga oberta). Es crida a
 * totes les /page/*; fora de Descàrregues no se subscriu a res. `instala`
 * s'ha de cridar directament des del clic. «Instal·lada» és del magatzem:
 * appinstalled o «accepted» en qualsevol pàgina d'esta càrrega.
 */
export function useInstalacioDeLaPagina(clau, { magatzem = INSTALACIO, canals = CANALS_DE_BOTIGA } = {}) {
  const actiu = clau === PAGINA_D_INSTALACIO;
  const subscriu = actiu ? magatzem.subscriu : senseSubscripcio;
  const ofereix = useSyncExternalStore(subscriu, actiu ? magatzem.ofereix : senseOferta, senseOferta);
  const instalada = useSyncExternalStore(subscriu, actiu ? magatzem.estaInstalada : senseOferta, senseOferta);
  const instala = useCallback(() => magatzem.demana(), [magatzem]);

  if (!actiu || esAppNativa()) return null;
  const motiu = magatzem.motiuDeLaCaptura();
  if (!esEntradaPropia(motiu)) return null;
  const mode = modeDInstalacio({ motiu, ofereix, instalada, finestra: globalThis.window });
  const oberts = canalsOberts(canals);
  if (!mode && oberts.length === 0) return null;
  return { mode, instala, canals: oberts };
}

/* L'H4 visible de les instruccions, al mateix arbre que `node` (el document o
   el shadow root), o null: amb la pàgina traduïda el cos original és hidden. */
function titolDInstruccions(node) {
  try {
    const arrel = node?.getRootNode?.() || globalThis.document;
    for (const titol of arrel?.querySelectorAll?.('.cms-preview h4') ?? []) {
      if (titol.textContent.trim() === TITOL_INSTRUCCIONS && !titol.closest('[hidden]')) return titol;
    }
  } catch { /* sense document no hi ha on anar */ }
  return null;
}

/* La guia d'un navegador sense oferta: un avís informatiu, sense regió viva
   (Alerta, viva={false}); el botó que l'obri ja diu que s'ha desplegat. Si
   l'oferta arriba amb la guia oberta ('directa'), continua dient el menú. */
function GuiaDInstalacio({ mode, t, accions }) {
  let cos;
  if (mode === 'ios') {
    cos = (
      <>
        <ol>
          <li>{t('section.descarregues.guia.ios.pas1', 'Prem Compartir ⬆️ (el quadre amb la fletxa cap amunt).')}</li>
          <li>{t('section.descarregues.guia.ios.pas2', "Toca «Afegeix a la pantalla d'inici».")}</li>
        </ol>
        <p>{t('section.descarregues.guia.ios.safari', "Si no hi veus l'opció, obri esta pàgina amb Safari.")}</p>
      </>
    );
  } else if (mode === 'safari-mac') {
    cos = <p>{t('section.descarregues.guia.mac', 'Al Safari del Mac (macOS Sonoma o posterior): menú Arxiu → «Afegeix al Dock».')}</p>;
  } else {
    cos = <p>{t('section.descarregues.guia.menu', "Obri el menú del navegador i tria l'opció d'instal·lar Sóc de Poble com a aplicació (al mòbil, «Afegeix a la pantalla d'inici»).")}</p>;
  }
  return <Alerta to="info" viva={false} accions={accions}>{cos}</Alerta>;
}

/**
 * L'acció de /page/descarregues. `instalacio` és el que torna
 * useInstalacioDeLaPagina; sense, no pinta res. `lloc`, com AccioDeLaPagina:
 * 'dalt' (per defecte) · les peces soltes, dins de div.page-title-accio, i
 * les botigues obertes; 'baix' · només l'acció, dins de div.sdp-pagina-accio,
 * després del cos (sense acció, res: cap div buit).
 */
export function InstalaLaPwa({ instalacio, lloc = 'dalt' }) {
  const { t } = useUIActions();
  const [obert, setObert] = useState(false);
  const [ambInstruccions, setAmbInstruccions] = useState(false);
  // L'elecció al diàleg del navegador és d'esta instància: un sol avís, al costat del botó premut.
  const [cancelada, setCancelada] = useState(false);
  // La caixa del botó premut: si s'instal·la, el botó desapareix i el focus va a l'avís que el substituïx.
  const [caixaDelClic, setCaixaDelClic] = useState(null);
  const idGuia = useId();
  const mode = instalacio?.mode ?? null;

  useEffect(() => {
    if (mode !== 'instalada' || !caixaDelClic) return;
    const avis = caixaDelClic.querySelector?.('.sdp-alerta--exit');
    if (!avis) return;
    if (!avis.hasAttribute('tabindex')) avis.setAttribute('tabindex', '-1');
    avis.focus?.({ preventScroll: true });
  }, [mode, caixaDelClic]);

  if (!instalacio) return null;
  const { instala, canals = [] } = instalacio;
  const ambGuia = MODES_DE_GUIA.has(mode);
  const ambBoto = mode === 'directa' || ambGuia;
  // Oberta abans que arribara l'oferta, la guia no es plega sola: en 'directa' diu el menú del navegador.
  const guiaOberta = obert && ambBoto;
  // Les botigues, només dalt: un sol enllaç per botiga a la pàgina, visible també amb la pàgina traduïda.
  const ambBotigues = lloc !== 'baix' && canals.length > 0;
  if (!mode && !ambBotigues) return null;

  const obriLaGuia = (node) => {
    setAmbInstruccions(titolDInstruccions(node) !== null);
    setObert(true);
  };
  const enClic = (e) => {
    const node = e.currentTarget;
    if (mode === 'directa') {
      const caixa = node.parentElement;
      // Dins del clic i sense cap await abans: prompt() necessita l'activació de l'usuari.
      instala().then((eleccio) => {
        setCancelada(eleccio === 'dismissed');
        if (eleccio === 'accepted') setCaixaDelClic(caixa);
        else if (eleccio === 'error') obriLaGuia(node);
      });
      return;
    }
    if (obert) setObert(false);
    else obriLaGuia(node);
  };
  const vesALesInstruccions = (e) => {
    const titol = titolDInstruccions(e.currentTarget);
    if (!titol) return;
    titol.scrollIntoView?.({ block: 'start' });
    // El focus també hi va: qui navega amb el teclat continua des d'allí.
    if (!titol.hasAttribute('tabindex')) titol.setAttribute('tabindex', '-1');
    titol.focus?.({ preventScroll: true });
  };

  const contingut = (
    <>
      {mode === 'instalada' ? (
        // Una sola regió viva a la pàgina, la de dalt (també es veu amb la pàgina traduïda).
        <Alerta to="exit" viva={lloc !== 'baix'}>{t('section.descarregues.instalada', 'Aplicació ja instal·lada en aquest dispositiu')}</Alerta>
      ) : null}
      {ambBoto ? (
        <Boto
          varietat="primari"
          mida="gran"
          ple
          onClick={enClic}
          aria-expanded={ambGuia || obert ? guiaOberta : undefined}
          aria-controls={guiaOberta ? idGuia : undefined}
        >
          <span aria-hidden="true">📲 </span>{t('section.descarregues.instalar', "Instal·lar l'App (PWA)")}
        </Boto>
      ) : null}
      {cancelada && mode !== 'instalada' ? (
        <Alerta to="info">{t('section.descarregues.cancelada', "Instal·lació cancel·lada. Si canvies d'opinió, també ho pots fer des del menú del navegador.")}</Alerta>
      ) : null}
      {guiaOberta ? (
        <div id={idGuia}>
          <GuiaDInstalacio
            mode={mode}
            t={t}
            accions={ambInstruccions ? (
              <Boto varietat="secundari" onClick={vesALesInstruccions}>
                {t('section.descarregues.guia.vore', 'Vore les instruccions de cada navegador')}
              </Boto>
            ) : null}
          />
        </div>
      ) : null}
      {ambBotigues ? (
        <div className="sdp-accions">
          {canals.map((canal) => (
            <a key={canal.id} className="sdp-boto sdp-boto--secundari sdp-boto--gran" href={canal.url}>{canal.nom}</a>
          ))}
        </div>
      ) : null}
    </>
  );
  if (lloc !== 'baix') return contingut;
  return <div className="sdp-pagina-accio">{contingut}</div>;
}
