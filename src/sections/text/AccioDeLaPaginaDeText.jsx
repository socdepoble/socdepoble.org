/**
 * AccioDeLaPaginaDeText.jsx — Onada 10 (261010; decisió del Mestre del
 * 261010) · El botó gran d'una pàgina de text amb ruta pròpia: hui, «Anar al
 * xat» a /iaia, que entra directe al xat amb la IAIA MarIA.
 *
 * És la porta gran i blava de Pedra Seca (PortaDePagina: sdp-boto--primari
 * sdp-boto--gran sdp-boto--ple), un Link del router, la MATEIXA peça de
 * /page/xat (PageDetailSection.jsx · AccioDeLaPagina). TextRoute (App.jsx) el
 * passa a TextSection com a `accioPrincipal`, i PageFrame el pinta dins de
 * header.page-title > div.page-title-accio, darrere de l'H1.
 *
 * Com a PageDetailSection, qui el munta decidix amb la funció pura
 * (accioDeLaPaginaDeText), mai amb l'element: un element que pinta null és un
 * element vertader, i PageFrame pintaria un div.page-title-accio buit.
 *
 * El verb es traduïx ací dins i el destí es tria amb el mode de dades del xat
 * (useXat().modeDades): amb sessió, la conversa que obri és la de la fila
 * «IAIA MarIA» de la llista (sections/xat/useObriXatPerDefecte.js ·
 * rutaDelXatDeLaIAIA). En remot i sense sessió passa per l'entrada, com
 * «Comentar»: la sessió no es mira ací, i eixe cas està pendent del Mestre
 * (vegeu la nota de rutaDelXatDeLaIAIA).
 */
import { useUIActions } from '../../app/contexts/UIContext';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { useXat } from '../xat/XatContext';
import { accioDeLaPaginaDeText } from './accionsDeText.js';

export function AccioDeLaPaginaDeText({ pageKey }) {
  const { t } = useUIActions();
  const { modeDades } = useXat();
  const porta = accioDeLaPaginaDeText(pageKey, t, modeDades);
  return porta ? <PortaDePagina porta={porta} /> : null;
}
