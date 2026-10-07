/**
 * SincronitzacioTargetes.jsx — El resolvedor de les targetes incrustades
 * sincronitzades.
 *
 * Ordre del Mestre (261007) · «No vull cards inventades, vull cards de
 * veritat». Una targeta incrustada (data-sdp-targeta) es pinta amb les dades
 * de l'original que porta la seua clau i la seua ruta, no amb la instantània
 * que es va desar en inserir-la. Es reutilitza la maquinària que ja hi ha,
 * sense cap camí nou:
 *   · l'original, amb el resolvedor únic de les connexions
 *     (elementDeSeccio.js · useOriginalDeConnexio), el mateix del lector, de
 *     la fitxa del Bloc i de la mini-card de Connectar: primer l'element de la
 *     seua secció (Mur, Mercat, agenda, Pobles) i, si no ve de cap secció, la
 *     pàgina de text de la seua ruta (el pageCopy del contingut core, amb
 *     PAGE_COPY de reserva, com les rutes de veres);
 *   · la targeta, la miniatura de la UniversalPage de l'original
 *     (components/universal/targetaDeLaPagina.js) amb les props que rep eixa
 *     pàgina: les de TextSection (paginaDeText.js · propsDePaginaDeText) o les
 *     de la pàgina de detall (paginaDElement). Per a «Drets d'autor» dins de
 *     «Legal i privacitat»: el còmic, el subtítol, l'entradilla, «Sistema», el
 *     rellotge 00:00 · 30/01/26, l'avatar de Sóc de Poble i La Torre de les
 *     Maçanes, com la seua targeta del Mur;
 *   · l'acció gran d'una pàgina del sistema, si en té (systemPages.js ·
 *     accioDeLaPagina, la mateixa porta de la targeta del Mur: «Anar al xat»).
 * Sense original (encara carrega, ja no hi és o és d'un altre poble), null:
 * la targeta pinta la instantània.
 *
 * ON ES MUNTA ProveidorSincronitzacioTargetes. Als quatre llocs que pinten
 * targetes incrustades, tots dins de seccions que es carreguen tard
 * (lazyRoute): el cos de TextSection amb targetes, el Bloc de Notes sencer
 * (lectura i editor), el cos d'ItemDetailSection i la presentació de
 * PerfilPublicSection. NO a App.jsx: este mòdul arrossega el resolvedor
 * d'originals (elementDeSeccio → detailSectionMeta → detailRichText → la
 * UniversalCard), que el paquet inicial no porta i no ha de portar (la
 * primera càrrega, també al connector de WordPress). Tampoc dins de
 * detailRichText.jsx: faria un cicle d'importacions. La prova
 * SincronitzacioTargetes.test.jsx fixa els quatre llocs. El valor és el hook
 * useDadesDeLOriginal, una constant de mòdul
 * (TargetesSincronitzadesContext.js).
 */
import { useMemo } from 'react';
import { useUIActions } from '../../app/contexts/UIContext';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { propsDeTargetaDeLaPagina } from '../../components/universal/targetaDeLaPagina.js';
import { objecteDeTargeta } from '../../components/universal/richText/extensions/targetes/formaDelGrup.js';
import { TargetesSincronitzadesContext } from '../../components/universal/richText/extensions/targetes/TargetesSincronitzadesContext.js';
import { accioDeLaPagina } from '../../config/systemPages.js';
import { propsDePaginaDeText } from '../text/paginaDeText.js';
import { paginaDElement, useOriginalDeConnexio } from './elementDeSeccio.js';

/**
 * L'origen que entén useOriginalDeConnexio d'una targeta incrustada: la
 * secció i l'id de la seua clau («producte:9» → mercat, 9) i la seua ruta.
 * Una pàgina no té secció: es resol per la ruta. null sense clau vàlida.
 */
export function origenDeTargeta(attrs) {
  const objecte = objecteDeTargeta(attrs);
  if (!objecte) return null;
  return {
    sectionId: objecte.seccio || null,
    itemId: objecte.seccio ? objecte.id : null,
    ruta: objecte.ruta || ''
  };
}

/**
 * Pur · Les props de dades d'UniversalCard d'un original resolt
 * (useOriginalDeConnexio), o null si no s'ha resolt.
 */
export function propsDeLOriginal(original, t) {
  if (original?.tipus === 'pagina' && original.page) {
    const props = propsDeTargetaDeLaPagina(propsDePaginaDeText(original.page, original.pageKey, t));
    if (!props) return null;
    const porta = accioDeLaPagina(original.pageKey, t);
    return porta ? { ...props, accio: <PortaDePagina porta={porta} /> } : props;
  }
  if (original?.tipus === 'seccio' && original.section && original.item) {
    return propsDeTargetaDeLaPagina(paginaDElement(original.section, original.item));
  }
  return null;
}

/** El hook que injecta l'app (TargetesSincronitzadesContext): attrs → props, o null. */
export function useDadesDeLOriginal(attrs) {
  const { t } = useUIActions();
  const { tipus, section, item, page, pageKey } = useOriginalDeConnexio(origenDeTargeta(attrs));
  /* L'objecte que torna el resolvedor és nou a cada render; les seues peces
     (la secció, l'element i la pàgina), no. */
  return useMemo(
    () => propsDeLOriginal({ tipus, section, item, page, pageKey }, t),
    [tipus, section, item, page, pageKey, t]
  );
}

export function ProveidorSincronitzacioTargetes({ children }) {
  return (
    <TargetesSincronitzadesContext.Provider value={useDadesDeLOriginal}>
      {children}
    </TargetesSincronitzadesContext.Provider>
  );
}
