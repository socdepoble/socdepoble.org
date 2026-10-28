/**
 * natiu/entrada.jsx — Entrada pròpia de l'app nativa (Fases 1 i 2 de
 * l'empaquetat mòbil, 261003). La munta vite.natiu.config.js en lloc de
 * main.jsx. Disseny: _wiki_de_poble/04_escriptori/02_investigacio_ia/
 * 261003_1330_empaquetat_mobil_claude/ARQUITECTURA.txt, §1.2 i §5.
 *
 * L'app nativa no és cap amfitrió: és Sóc de Poble mateix, com socdepoble.org.
 * Per això entra com main.jsx i fixa la capa del paquet per la via interna.
 *
 * Fa els passos 0, 2, 3 i 4b del §1.2 amb el tenant del build (FASES_1_I_2.txt
 * §2.1c, dia 1). Fase D (261020, tasca 1) · El pas 0 ja hi és: l'adaptador de
 * l'entrada amb Apple i Google (natiu/entradaSocial.js), que és l'únic que
 * nomena un paquet natiu i només el carrega al primer toc. Encara arribaran, i
 * en este ordre: l'1 (tria del poble i sessió duradora) i el 4a (selector de
 * poble). El 5 (escoltes natives) hi és des del 261026: el menú «Compartir»
 * (natiu/compartirNatiu.js) i els avisos del xat (natiu/avisosNatius.js).
 *
 * Diferències amb main.jsx, totes del §1.2:
 *   · el mode de dades és sempre 'remote';
 *   · no s'exposa window.SocDePoble: dins de l'app no hi ha cap amfitrió;
 *   · no es registra cap worker (la CSP de l'app porta worker-src 'none').
 */

import styles from '../css/index.css?inline';
import { createRoot } from 'react-dom/client';
import PedraSecaEmbed from '../PedraSecaEmbed.jsx';
import { configura, arrenca } from '../host.js';
import { capaDelPaquet, fixaCapaDelPaquet } from '../config/capaDelPaquet.js';
import { registraEntradaNativa } from '../config/entradaNativa.js';
import { creaEntradaSocial, entradaSenseProveidors, plataformaDelDispositiu } from './entradaSocial.js';
import { createTranslator, llegeixIdiomaTriat, llenguaDelDispositiu, pintaAmbDiccionari, resolIdioma } from '../config/i18n.js';
import { lliuraCompartit, registraAlliberadorCompartit, registraTalladorCompartit, sessioCompartit } from '../config/compartirNatiu.js';
import { registraAvisosNatius } from '../config/avisosNatius.js';
import { creaReceptorCompartit } from './compartirNatiu.js';
import { creaAvisosNatius } from './avisosNatius.js';

const styleNode = document.createElement('style');
styleNode.textContent = styles;
document.head.appendChild(styleNode);

/* El que és del lloc, com a main.jsx: l'app és l'ama de la URL i de la capçalera. */
const DEL_LLOC = Object.freeze({
  pluginUrl: '/',
  manageDocumentHead: true,
  routerType: 'browser'
});

const init = () => {
  const arrel = document.getElementById('root');
  if (arrel && (!arrel.hasChildNodes() || arrel.innerHTML.trim() === '')) {

    /* Pas 0 del §1.2 (Fase D, 261020, tasca 1): els adaptadors natius, abans de
       la capa i del primer pintat (/registre llig el registre de manera síncrona).
       Mai tomba l'arrencada: sense ells, el correu continua. Els dos clients de
       Google són públics i només viuen a .env.natiu.local (vite.natiu.config.js). */
    try {
      registraEntradaNativa(creaEntradaSocial({
        plataforma: plataformaDelDispositiu(),
        clients: {
          googleWeb: import.meta.env.VITE_NATIU_GOOGLE_WEB_CLIENT_ID,
          googleIos: import.meta.env.VITE_NATIU_GOOGLE_IOS_CLIENT_ID
        }
      }));
    } catch (e) {
      console.error('[natiu] Entrada nativa no registrada:', e);
      /* Fase D (261020, revisió) · Ni així /registre torna al Google web, que dins
         de l'app no pot acabar: la plataforma queda registrada sense cap botó, i
         només hi ha el correu. */
      try { registraEntradaNativa(entradaSenseProveidors(plataformaDelDispositiu())); }
      catch (e2) { console.error('[natiu] Ni tan sols la plataforma de l’entrada nativa:', e2); }
    }

    /* Pas 5 del §1.2 (261026, ordre del Mestre, prompt 261026_1615): les
       escoltes natives, abans del primer pintat perquè una compartició o el
       toc d'un avís que han obert l'App no es perden. El menú «Compartir» i
       els avisos del xat; cap dels dos tomba mai l'arrencada. */
    /* Pla 261028_1526 (P1-22, TE-05) · Dins de l'app, la llengua del sistema
       fa d'amfitrió (T1: tria explícita > dispositiu > ca): el WebView porta
       la del telèfon a navigator.languages. Una que l'app no parla, cap. */
    const idioma = llenguaDelDispositiu(typeof navigator === 'undefined'
      ? []
      : (navigator.languages?.length ? navigator.languages : [navigator.language]));
    /* El nom del canal d'Android es llig en crear-lo (el primer avís), amb el
       diccionari de la llengua triada ja carregat. */
    const canalDelXat = () => {
      const t = createTranslator(resolIdioma({ triat: llegeixIdiomaTriat(), amfitrio: idioma }));
      return {
        nom: t('section.xat.avisNatiu.canal', 'Missatges del xat'),
        descripcio: t('section.xat.avisNatiu.canalDescripcio', 'Avisos dels missatges nous de Sóc de Poble')
      };
    };
    try { registraAvisosNatius(creaAvisosNatius({ plataforma: plataformaDelDispositiu(), canal: canalDelXat })); }
    catch (e) { console.error('[natiu] Avisos natius no registrats:', e); }
    /* Un canvi de sessió caduca el lot que encara es llig, i el natiu (el
       tallador) en talla la còpia i les restes (pla 261028_1526, P1-31). */
    const receptor = creaReceptorCompartit({ sessio: sessioCompartit, registraTallador: registraTalladorCompartit });
    if (receptor) {
      // La còpia nativa la tanca el registre: en enviar o descartar (Gauntlet 261026_1615).
      registraAlliberadorCompartit(receptor.allibera);
      receptor.escolta(lliuraCompartit)
        .catch((e) => console.error('[natiu] Receptor del menú Compartir no connectat:', e));
    }

    /* Pas 2 del §1.2: la capa, abans de res més. El backend segellat al build
       (errorsEntornNatiu el vol https i públic) i el tenant del build, fins que
       hi haja selector de poble. Sense VITE_TENANT_ID, la capa va sense tenant. */
    fixaCapaDelPaquet({
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      dataMode: 'remote',
      tenantId: import.meta.env.VITE_TENANT_ID
    });

    // Pas 3: exactament com main.jsx.
    configura({
      config: DEL_LLOC,
      auth: {
        issuer: import.meta.env.VITE_APP_ISSUER || 'https://auth.socdepoble.org',
        audiences: (import.meta.env.VITE_APP_AUDIENCES || 'authenticated').split(','),
        persistencia: 'local'
      }
    });

    /* Onada 12 (261011; ordres 261011_0130, punt 7) · Com main.jsx: el rebuig
       té amo, i quanLlest() torna a arrencar en el reintent de la vista. */
    arrenca().catch((e) => console.error('[natiu] Arrencada fallida:', e));

    // Pas 4b: la capa del paquet per davall de la del lloc, com main.jsx.
    /* Fase D (261020, tasca 4.1) · L1 · Com main.jsx: amb una tria desada que
       no és el valencià, el primer pintat espera el seu diccionari (un tros
       local, capacitor:// o https://localhost), com a molt
       ESPERA_DEL_PRIMER_PINTAT ms. Cap fotograma en valencià en obrir l'app.
       TE-05 · La del dispositiu, com la `language` d'un amfitrió: també espera
       el seu diccionari. No va a configura(), que només porta el del lloc. */
    const root = createRoot(arrel);
    const delDispositiu = idioma ? { language: idioma } : {};
    pintaAmbDiccionari(() => root.render(
      <PedraSecaEmbed config={{ ...capaDelPaquet(), ...DEL_LLOC, ...delDispositiu }} isFirstInstance={true} targetNode={arrel} />
    ), { amfitrio: idioma });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
