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
 *   · l'acció gran de la targeta d'una pàgina del sistema, si en té
 *     (systemPages.js · accioDeLaTargeta, la mateixa porta de la targeta del
 *     Mur: «Anar al xat»). Onada 10 (261010; pla 261010_1121; decisió del
 *     Mestre del 261010) · La Consola i el Cervell, incrustades, tampoc
 *     porten el botó «Obrir…»: pinten les etiquetes de PAGE_COPY, com al Mur.
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
import { accioDeLaTargeta } from '../../config/systemPages.js';
import { propia, publicacioTraduible } from '../../components/universal/traduccio/planTraduccioPublicacio.js';
import { propsDePaginaDeText } from '../text/paginaDeText.js';
import { paginaTraduible } from '../text/planTraduccioPagina.js';
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

/* R51 (P0-46 / IDEA-177; forat G2 de l'auditoria R11) · La targeta
   incrustada d'un original RESOLT porta el translation_mode de l'original
   (propietat pròpia), i UniversalCard no hi oferix Traduir amb un mode
   protegit ('curated_5_langs', 'none' o invàlid). Mentre l'original no es
   resol, la targeta pinta la instantània, que no sap el mode: la lectura
   (CosAmbTargetes) no hi oferix Traduir (troballes R12G-BH-01, RIG-01 i D2;
   un mode desconegut es tracta com a protegit). Amb tots dos camins, cap
   text d'un original protegit ix cap al motor des del botó de la targeta.
   Abast mínim: la targeta continua pintant el text de l'original; la versió
   revisada (curated) dins de la targeta incrustada queda fora d'este pas.
   Sense mode, les props de sempre.
   Troballa DQ-01 · El mode es llig com el llig el pla de cada original: una
   publicació, propietat pròpia de DADES (planTraduccioPublicacio.js · propia,
   com TargetaDelMur; un accessor no s'executa i hi compta com a absent); una
   pàgina, propietat pròpia (planTraduccioPagina, que en llig el valor).
   Troballes RIG2-01 i DIS-R2-01 · El mode sol no basta perquè la targeta
   incrustada no discrepe de la de l'original: UniversalCard només en fa el
   pis mínim (translationMode.js · allowsMachineTranslation), i un original
   amb 'on_the_fly' (o una pàgina amb translation_mode null) sense llengua
   original de les cinc passa eixe pis, quan el seu pla és un error i la seua
   targeta al Mur, el seu detall o TextSection el pinten sense Traduir. Ací hi
   ha l'element SENCER: la targeta porta també el veredicte del pla
   (publicacioTraduible o paginaTraduible), i sense Traduir quan el pla no
   l'oferix (showTranslate: false, com TargetaDelMur). El mode continua
   viatjant com a defensa en profunditat (UniversalCard i tradueixTot). Amb
   un pla que oferix Traduir, o sense mode, cap clau nova. */
const modeDeLaPublicacio = (item) => propia(item, 'translation_mode');
const modeDeLaPagina = (page) => (Object.hasOwn(page, 'translation_mode') ? page.translation_mode : undefined);
const SENSE_TRADUIR = Object.freeze({ showTranslate: false });
const ambTraduccioDeLOriginal = (props, mode, traduible) => {
  if (!props) return props;
  const ambMode = mode !== undefined ? { ...props, modeTraduccio: mode } : props;
  return traduible ? ambMode : { ...ambMode, ...SENSE_TRADUIR };
};

/**
 * Pur · Les props de dades d'UniversalCard d'un original resolt
 * (useOriginalDeConnexio), o null si no s'ha resolt.
 */
export function propsDeLOriginal(original, t) {
  if (original?.tipus === 'pagina' && original.page) {
    const props = ambTraduccioDeLOriginal(
      propsDeTargetaDeLaPagina(propsDePaginaDeText(original.page, original.pageKey, t)),
      modeDeLaPagina(original.page),
      paginaTraduible(original.page)
    );
    if (!props) return null;
    const porta = accioDeLaTargeta(original.pageKey, t);
    return porta ? { ...props, accio: <PortaDePagina porta={porta} /> } : props;
  }
  if (original?.tipus === 'seccio' && original.section && original.item) {
    return ambTraduccioDeLOriginal(
      propsDeTargetaDeLaPagina(paginaDElement(original.section, original.item)),
      modeDeLaPublicacio(original.item),
      publicacioTraduible(original.item)
    );
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
