/**
 * AlertaMunicipal.jsx — T3.3 (marató nocturna 261101, carril B3) · El
 * distintiu d'una alerta municipal a la seua targeta i l'avís de les vigents
 * al capdamunt del Mur. Qui és una alerta i qui la pot marcar ho decidix
 * alertesMunicipals.js; ací només es pinta.
 *
 * Peces de sempre (Pedra Seca): la insígnia d'estat (Insignia, amb el to del
 * semàfor: perill per a l'alerta, avís per al bàndol) i l'alerta en línia
 * (Alerta). La icona és redundant (aria-hidden): el text és el que diu què és.
 *
 * SEMÀNTICA ACCESSIBLE
 *  · A cada targeta, text visible SENSE cap regió viva: un Mur de cinquanta
 *    targetes que s'anunciaren totes en pintar-se seria soroll.
 *  · Una sola regió viva per a tot el Mur, `role="status"` (educada i
 *    atòmica): l'avís de les alertes vigents. No `role="alert"`: el
 *    contingut ja és a la pantalla quan s'obri el Mur, no respon a res que la
 *    persona haja fet, i una regió assertiva el tornaria a llegir per damunt
 *    del títol de la pàgina en cada visita. La regió es munta buida (quan
 *    hi ha alguna publicació candidata) i s'omple quan el directori
 *    confirma l'ajuntament: un lector només anuncia el canvi d'una regió que
 *    ja existia.
 *
 * T7 · P1-22 (261101) · El distintiu, el títol de l'avís i el nom de cada
 * avís de la llista, en la llengua de la interfície (els parells de
 * alertesMunicipals.js); fora de l'app o en valencià, els textos de sempre.
 */
import { Megaphone, TriangleAlert } from 'lucide-react';
import { Alerta, Insignia } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { Link } from '../../app/contexts/RouterContext';
import { esRutaInterna, getSectionItemPath } from '../../config/navigation';
import { TEXTOS_ALERTES, TIPUS_ALERTA } from './alertesMunicipals.js';

const ICONA = Object.freeze({ alerta: TriangleAlert, bandol_urgent: Megaphone });

/** La classe de la targeta de cada to (modules.css · ALERTES MUNICIPALS DEL MUR). */
export const CLASSE_DE_LA_TARGETA = Object.freeze({
  error: 'sdp-mur-alerta-targeta--perill',
  avis: 'sdp-mur-alerta-targeta--avis'
});

/** El distintiu de la targeta: «Alerta municipal» o «Bàndol urgent». Un tipus desconegut, res. */
export function DistintiuAlertaMunicipal({ tipus }) {
  const t = useTraductorOpcional();
  const alerta = Object.hasOwn(TIPUS_ALERTA, tipus) ? TIPUS_ALERTA[tipus] : null;
  if (!alerta) return null;
  const Icona = ICONA[alerta.clau];
  return (
    <p className="sdp-mur-alerta">
      <Insignia to={alerta.to}>
        <Icona size={20} aria-hidden="true" focusable="false" />
        {tradueix(t, alerta.etiqueta)}
      </Insignia>
    </p>
  );
}

/* On porta l'avís: la mateixa pàgina que obri la targeta (TargetaDelMur · mainHref). */
const rutaDe = (item) => (esRutaInterna(item.mainHref) ? item.mainHref : null) || getSectionItemPath('mur', item.id);

/**
 * La regió viva de les alertes vigents del Mur. `activa` la munta (buida);
 * sense, no hi ha res al DOM. `alertes`: [{ item, tipus }] en l'ordre del Mur.
 */
export function RegioAlertesVigents({ activa = false, alertes = [] }) {
  const t = useTraductorOpcional();
  if (!activa) return null;
  const vigents = Array.isArray(alertes) ? alertes.filter((alerta) => Object.hasOwn(TIPUS_ALERTA, alerta?.tipus)) : [];
  const titol = vigents.length === 1
    ? tradueix(t, TEXTOS_ALERTES.una)
    : tradueix(t, TEXTOS_ALERTES.diverses).replace('{n}', () => String(vigents.length));
  return (
    <div role="status">
      {vigents.length ? (
        <Alerta to="avis" viva={false} titol={titol}>
          <ul>
            {vigents.map(({ item, tipus }) => (
              <li key={`${item.type}-${item.id}`}>
                {tradueix(t, TIPUS_ALERTA[tipus].etiqueta)}: <Link to={rutaDe(item)} className="sdp-mur-alertes__enllac">{item.title || item.name}</Link>
              </li>
            ))}
          </ul>
        </Alerta>
      ) : null}
    </div>
  );
}
