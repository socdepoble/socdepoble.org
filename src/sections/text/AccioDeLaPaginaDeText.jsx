/**
 * AccioDeLaPaginaDeText.jsx — Onada 10 (261010; decisió del Mestre del
 * 261010) · El botó gran d'una pàgina de text amb ruta pròpia: hui, «Anar al
 * xat» al manifest de la IAIA (/anima des del Bloc 3.6.3; abans /iaia), que
 * entra directe al xat amb la IAIA MarIA.
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
 * (useXat().modeDades): la conversa que obri és la de la fila «IAIA MarIA» de
 * la llista (sections/xat/useObriXatPerDefecte.js · rutaDelXatDeLaIAIA).
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 6) ·
 *   · D2 · En remot i sense sessió (useXat().senseSessio), la fila que el
 *     convidat veu és la conversa de mostra, i el botó hi porta.
 *   · D4 · `lloc`, calcat d'AccioDeLaPagina (PageDetailSection.jsx):
 *     · 'dalt' (per defecte) · la porta sola, dins de div.page-title-accio;
 *     · 'baix' · la mateixa porta dins de div.sdp-pagina-accio, després del
 *       cos (TextRoute la passa com a fill de TextSection).
 */
import { useUIActions } from '../../app/contexts/UIContext';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { useXat } from '../xat/XatContext';
import { accioDeLaPaginaDeText } from './accionsDeText.js';

export function AccioDeLaPaginaDeText({ pageKey, lloc = 'dalt' }) {
  const { t } = useUIActions();
  const { modeDades, senseSessio } = useXat();
  const porta = accioDeLaPaginaDeText(pageKey, t, modeDades, senseSessio);
  if (!porta) return null;
  if (lloc !== 'baix') return <PortaDePagina porta={porta} />;
  return (
    <div className="sdp-pagina-accio">
      <PortaDePagina porta={porta} />
    </div>
  );
}
