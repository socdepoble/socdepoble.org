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
 *
 * T7 · S2 (assalt 261101) · Cada avís diu fins quan és vigent, amb data i
 * hora ABSOLUTES (<time dateTime>, en el locale de la interfície): «vigent
 * fins a dimarts, 3 de novembre, a les 14:05». Mai un compte enrere: dins
 * de role="status", un text que canviara cada minut el lector el tornaria a
 * llegir cada minut. Quan l'avís caduca, el rellotge del Mur
 * (useRellotgeAlertes) el trau de la regió. Sense `caducaAl`, el <li> de
 * sempre.
 */
import { Megaphone, TriangleAlert } from 'lucide-react';
import { Alerta, Insignia } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { Link } from '../../app/contexts/RouterContext';
import { esRutaInterna, getSectionItemPath } from '../../config/navigation';
import { useLocaleOpcional } from '../multimedia/useLocaleOpcional.js';
import { TEXTOS_ALERTES, TIPUS_ALERTA, esInstantRepresentable, trossosDeCaducitat } from './alertesMunicipals.js';

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

/* La caducitat d'un avís: « · vigent fins a …», o res sense `caducaAl`
   representable (toISOString llançaria i tombaria el Mur). */
function VigentFins({ caducaAl, t, locale }) {
  if (!esInstantRepresentable(caducaAl)) return null;
  // El <time> embolcalla només la data; la frase de cada llengua, al seu voltant.
  const frase = tradueix(t, TEXTOS_ALERTES.vigentFins);
  const buit = frase.indexOf('{data}');
  const abans = buit >= 0 ? frase.slice(0, buit) : `${frase} `;
  const despres = buit >= 0 ? frase.slice(buit + '{data}'.length) : '';
  /* Gauntlet transversal 261101 (VC-01) · L'hora, amb el «a les» que la
     presenta, va en un sol tros que no es parteix (.sdp-mur-alertes__hora):
     a 1280 px la línia tallava «a les / 17:44». El text del <time> és el de
     sempre, caràcter a caràcter. */
  const { data, hora } = trossosDeCaducitat(caducaAl, locale);
  return (
    <>
      {' · '}{abans}
      <time dateTime={new Date(caducaAl).toISOString()}>
        {data}{hora ? <span className="sdp-mur-alertes__hora">{hora}</span> : null}
      </time>
      {despres}
    </>
  );
}

/**
 * La regió viva de les alertes vigents del Mur. `activa` la munta (buida);
 * sense, no hi ha res al DOM. `alertes`: [{ item, tipus, caducaAl? }] en
 * l'ordre del Mur; `caducaAl` (ms) afig la data absoluta de caducitat.
 */
export function RegioAlertesVigents({ activa = false, alertes = [] }) {
  const t = useTraductorOpcional();
  const locale = useLocaleOpcional();
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
            {vigents.map(({ item, tipus, caducaAl }) => (
              <li key={`${item.type}-${item.id}`}>
                {tradueix(t, TIPUS_ALERTA[tipus].etiqueta)}: <Link to={rutaDe(item)} className="sdp-mur-alertes__enllac">{item.title || item.name}</Link>
                <VigentFins caducaAl={caducaAl} t={t} locale={locale} />
              </li>
            ))}
          </ul>
        </Alerta>
      ) : null}
    </div>
  );
}
