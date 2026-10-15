/**
 * TargetaTauler.jsx — la targeta del Tauler de la Gestoria: la UniversalCard
 * de sempre, orientada a la gestió de l'empresa (principi 3 de la Gestoria).
 *
 * Ordre del Mestre, 261004 (regla d'or 1; MAPA_EMPRESA_GESTORIA §2.4;
 * guardes de GESTORIA_REFERENCIA.txt):
 *  · LA BOINA PERSONAL. L'autor és el titular de les dades (la seua
 *    identitat privada, de la configuració local), enllaçat a la seua pàgina;
 *    mai una autora fingida. La pastilla és la data de la darrera
 *    sincronització: un <time> sense clic, que no porta al Calendari.
 *  · EL COS SENCER. Títol, subtítol i l'entradeta que explica què és la
 *    xifra. Sense xifra (sense dades o sense factures), el perquè.
 *  · LA XIFRA, AMAGADA PER DEFECTE. El quadrat de 128 px diu «Import amagat»
 *    (o «Xifra amagada») i la xifra NO és al DOM fins que la persona prem
 *    l'ull de la boina (aria-pressed): ni al quadrat, ni als noms
 *    accessibles. El desenfocament no és accessible i no es fa servir; cap
 *    opacitat sobre text.
 *  · TOTA LA TARGETA CLICABLE cap a la seua pàgina pròpia dins de la closca
 *    (onObri), i Connectar porta al mateix lloc sense comptar res.
 *  · EL PEU, PRIVAT. Compartir mai (una targeta privada no es comparteix),
 *    Comentar no es pinta, i Traduir només avisa: cap xifra no ix cap al
 *    servei de traducció.
 *    Derogat EN PART per l'ordre del Mestre, 14-10-2026 (prompt 261014_2015,
 *    punt 5; decisió de les 21:20), sobre D-A (261004) i el MAPA §2.4: la
 *    barra blava i el peu de la Gestoria porten les accions de sempre
 *    (Comentar, Compartir i Connectar), però cap no trau res d'este ordinador
 *    ni fa eixir de la Gestoria (on la lectura dels extractes s'oblidaria): en
 *    prémer-les, diuen per què (AVISOS_ACCIONS_PRIVADES). A la barra, amb les
 *    accions inoperatives de PageFrame (barraPrivada, aria-disabled); al peu,
 *    UniversalCard no les té, i un handler propi avisa (peuPrivat), amb
 *    l'opt-in `ambAccionsPrivades`. Sense qui avise (onAvis), totes dues fallen
 *    tancades: les accions apagades, el DOM de sempre (l'Històric, que no ho
 *    demana, no canvia cap píxel). Connectar del peu continua obrint la pàgina.
 * Les dades de la targeta (títol, xifra, etiquetes) les fa
 * nucli/targetesTauler.js; ací només es pinten.
 */
import { useState } from 'react';
import {
  Building2, Calculator, Eye, EyeOff, Hourglass, Landmark, Link2, Percent, Receipt, Scale, TrendingDown, TrendingUp, Wallet
} from 'lucide-react';
import { UniversalCard } from '../../../components/PedraSeca/organismes/UniversalCard.jsx';
import { etiquetaXifra, textAmagat, textXifra } from './nucli/targetesTauler.js';

/** La icona de cada targeta (la del quadrat quan no hi ha xifra). */
export const ICONES_TAULER = Object.freeze({
  wallet: Wallet, landmark: Landmark, hourglass: Hourglass, receipt: Receipt, trendingUp: TrendingUp,
  trendingDown: TrendingDown, scale: Scale, building: Building2, link: Link2, percent: Percent, calculator: Calculator
});

/** El que diu Traduir: les xifres de la Gestoria no ixen cap al servei de traducció. */
export const AVIS_XIFRES_SENSE_TRADUCCIO = 'Les xifres de la Gestoria no es traduïxen: el que mostren no ix d’este ordinador.';

/* Connectar porta a la pàgina de la targeta i no compta res (MAPA §2.4). */
const SENSE_TELEMETRIA = Object.freeze({ comptar: false });

/**
 * El que diuen les accions de la barra i del peu de la Gestoria en prémer-les
 * (ordre del Mestre, 14-10-2026, punt 5): per què no ixen d'este ordinador.
 * Cap text porta dades: ni xifres, ni comptes, ni el nom del titular.
 */
export const AVISOS_ACCIONS_PRIVADES = Object.freeze({
  comentar: 'A la Gestoria no s’hi comenta: les dades no ixen d’este ordinador. Si vols parlar amb Sóc de Poble, obri el Xat; en eixir de la Gestoria, la lectura dels extractes s’oblida.',
  compartir: 'Esta pàgina és privada i no es comparteix. El full per a la gestoria es prepara a la secció «Plantilla Gestoria» del Quadre de comandament, després de revisar-lo al Full trimestral.',
  connectar: 'Esta pàgina és privada: no es connecta al teu Bloc, perquè les xifres només viuen en este ordinador.'
});

/**
 * Les accions de la barra blava d'una pàgina de la Gestoria (PaginaApp →
 * PageFrame): pintades i inoperatives, amb el perquè. Sense onAvis, apagades
 * (falla tancada: el DOM de sempre).
 * @param {((text: string) => void)|null} onAvis
 * @returns {object} les props per a PaginaApp
 */
export function barraPrivada(onAvis) {
  if (typeof onAvis !== 'function') return { showComment: false, showShare: false, showConnect: false };
  return {
    accionsInoperatives: true,
    onClickInoperatiu: (accio) => onAvis(AVISOS_ACCIONS_PRIVADES[accio] ?? AVISOS_ACCIONS_PRIVADES.compartir)
  };
}

/**
 * Comentar i Compartir del peu d'una targeta: UniversalCard no té accions
 * inoperatives, i un handler propi avisa (com les previsualitzacions que
 * avisen de useAccions). Sense onAvis, apagades (falla tancada).
 * @param {((text: string) => void)|null} onAvis
 * @returns {object} les props per a UniversalCard
 */
export function peuPrivat(onAvis) {
  if (typeof onAvis !== 'function') return { showShare: false, showComment: false };
  return {
    onComment: () => onAvis(AVISOS_ACCIONS_PRIVADES.comentar),
    onShare: () => onAvis(AVISOS_ACCIONS_PRIVADES.compartir)
  };
}

/**
 * L'ull de privacitat: un sol control per boina, amb aria-pressed (premut =
 * les xifres es veuen). El nom no canvia: el que canvia és l'estat.
 */
export function UllPrivacitat({ visible = false, onCommuta, etiqueta = 'Mostra les xifres' }) {
  const Icona = visible ? Eye : EyeOff;
  return (
    <button type="button" className="sdp-gestoria-ull" aria-pressed={visible ? 'true' : 'false'}
      aria-label={etiqueta} title={etiqueta} onClick={onCommuta}>
      <Icona size={20} aria-hidden="true" focusable="false" />
    </button>
  );
}

/* El quadrat: la xifra mostrada, la xifra amagada o, sense xifra, la icona. */
function quadratDe(targeta, mostra) {
  if (targeta.xifra && mostra) {
    return { type: 'price', value: textXifra(targeta.xifra), label: `${targeta.titol}: ${etiquetaXifra(targeta.xifra)}` };
  }
  if (targeta.xifra) {
    const amagat = textAmagat(targeta.xifra);
    return {
      type: 'custom',
      label: amagat,
      content: (
        <>
          <EyeOff size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />
          <span className="sdp-nomes-lector">{amagat}</span>
        </>
      )
    };
  }
  const Icona = ICONES_TAULER[targeta.icona] ?? Wallet;
  return { type: 'custom', label: targeta.titol, content: <Icona size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" /> };
}

/**
 * @param {object} p
 * @param {object} p.targeta una de targetesDelTauler (nucli/targetesTauler.js)
 * @param {{ nom: string, poble?: string, avatar?: string|null, href?: string|null }} p.titular la boina personal
 * @param {{ time: string, date: string, dateTime: string }|null} [p.pastilla] la darrera sincronització
 * @param {boolean} [p.visibleInicial] la xifra es veu en pintar-se (l'ull de la closca); per defecte, no
 * @param {(id: string) => void} [p.onObri] obri la pàgina pròpia de la targeta
 * @param {(text: string) => void} [p.onAvis] diu un avís a la persona (Traduir i, amb ambAccionsPrivades, Comentar i Compartir)
 * @param {boolean} [p.ambAccionsPrivades] el peu porta Comentar i Compartir, que només avisen (ordre del Mestre,
 *   14-10-2026, punt 5); sense, apagats com sempre
 */
export function TargetaTauler({ targeta, titular, pastilla = null, visibleInicial = false, onObri, onAvis, ambAccionsPrivades = false }) {
  const [visible, setVisible] = useState(visibleInicial === true);
  const ambXifra = Boolean(targeta.xifra);
  const obri = () => onObri?.(targeta.id);
  return (
    <UniversalCard
      className="sdp-gestoria-tauler__targeta"
      author={titular?.nom}
      location={titular?.poble || undefined}
      avatarUrl={titular?.avatar || undefined}
      authorHref={titular?.href || undefined}
      imatgePrivada
      time={pastilla?.time}
      date={pastilla?.date}
      dateTime={pastilla?.dateTime}
      onDateTime={false}
      headerAction={ambXifra ? (
        <UllPrivacitat visible={visible} etiqueta={`Mostra la xifra de ${targeta.titol}`}
          onCommuta={() => setVisible((abans) => !abans)} />
      ) : null}
      squareBadge={quadratDe(targeta, visible)}
      title={targeta.titol}
      subtitle={targeta.subtitol}
      body={(
        <>
          <p>{targeta.entradeta}</p>
          {ambXifra ? null : <p>{targeta.senseXifra}</p>}
        </>
      )}
      labels={targeta.etiquetes}
      onMainClick={obri}
      hasFooter
      {...peuPrivat(ambAccionsPrivades === true ? onAvis : null)}
      onTranslate={() => onAvis?.(AVIS_XIFRES_SENSE_TRADUCCIO)}
      onConnect={obri}
      telemetria={SENSE_TELEMETRIA}
    />
  );
}

export default TargetaTauler;
