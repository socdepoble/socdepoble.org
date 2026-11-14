/**
 * LaVeuDeSocDePobleArticle.jsx · Onada R23 · Vista completa de la publicació
 * del Mur «La Veu de Sóc de Poble» (/mur/la-veu-de-soc-de-poble).
 *
 * Reunix:
 *   1. El botó de lectura oral (`BotoVeuIaia`) connectat en viu a les 7 veus
 *      obertes de Matxa-TTS v2 del Node 0 i píndola de veu activa.
 *   2. El joc interactiu d'isoglosses «D'on parles?» (`JocDonParlesCard`, lazy).
 *   3. El cos editorial sanejant i respectant edicions del Bloc de notes (`cosDeLArticle`).
 *   4. El banc d'escolta amb les 7 mostres obertes (`preload="none"`) i canvi
 *      immediat audible de la veu de lectura en polsar «Tria esta veu».
 *   5. El `RefranyerSonorCard` (lazy) amb 32 dites netes i gravadora de 15 s.
 */
import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Volume2 } from 'lucide-react';
import { renderRichText } from '../../detail/detailRichText.jsx';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { BotoVeuIaia } from '../../../components/PedraSeca/molecules/BotoVeuIaia.jsx';
import { desplacaASeccio } from '../../../components/universal/PageFrame.jsx';
import { useVeuLecturaPaginaActiva } from '../../../components/universal/veu/VeuLecturaPaginaContext.js';
import { tradueix, useTraductorOpcional } from '../../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useUIActionsOpcional, useUIStateOpcional } from '../../../app/contexts/UIContext.jsx';
import { resolveAsset } from '../../../config/assetResolver.js';
import { createTranslator } from '../../../config/i18n.js';
import {
  VEUS_TERRITORIALS,
  VEU_AUTO_NAVEGADOR,
  desaVeuPreferida,
  llegeixVeuPreferida,
  subscriuVeuPreferida,
} from '../../../services/veusTerritorials.js';
import { cosDeLArticle, cosPerAPintar } from './cosCanonic.js';
import { nomDeLaVeu } from './nomDeLaVeu.js';
import { textPlaDelCos } from './NovesTecnologiesCulturaRuralArticle.jsx';
import {
  LA_VEU_DE_SOC_DE_POBLE_HTML,
  LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS,
} from './laVeuDeSocDePobleContent.js';

const T_PER_DEFECTE = createTranslator('ca');
const JocDonParlesCard = lazy(() => import('../../../components/patrimoni/JocDonParlesCard.jsx'));
const RefranyerSonorCard = lazy(() => import('../../../components/patrimoni/RefranyerSonorCard.jsx'));

const VEUS_AMB_MOSTRA = Object.freeze(VEUS_TERRITORIALS.filter((v) => Boolean(v.mostraAsset)));

function useIdiomaActiu() {
  try {
    const lang = useUIStateOpcional()?.language;
    return ['ca', 'es', 'en', 'eu', 'gl'].includes(lang) ? lang : 'ca';
  } catch {
    return 'ca';
  }
}

function textPlaEditorial(html) {
  if (typeof html !== 'string' || !html.trim()) return '';
  if (typeof DOMParser === 'function') {
    const analitzat = new DOMParser().parseFromString(html, 'text/html');
    for (const grup of analitzat.querySelectorAll('[data-sdp-targetes]')) {
      grup.remove();
    }
    return (analitzat.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return textPlaDelCos(html);
}

export function LaVeuDeSocDePobleArticle({ item = {} }) {
  const t = useUIActionsOpcional()?.t || T_PER_DEFECTE;
  const tOpc = useTraductorOpcional();
  const veuPaginaActiva = useVeuLecturaPaginaActiva();
  const idioma = useIdiomaActiu();
  const idMostres = useId();
  const bancVeusRef = useRef(null);
  const [veuPreferida, setVeuPreferida] = useState(() => llegeixVeuPreferida());

  useEffect(() => subscriuVeuPreferida(setVeuPreferida), []);

  const blocIdioma = LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS[idioma] || LA_VEU_DE_SOC_DE_POBLE_TRADUCCIONS.ca;
  const htmlCanonic = idioma === 'ca' ? LA_VEU_DE_SOC_DE_POBLE_HTML : blocIdioma.html;
  const cos = cosPerAPintar(cosDeLArticle(idioma === 'ca' ? item : null, htmlCanonic));

  const titolVeu = idioma === 'ca' ? (item?.title || blocIdioma.title) : blocIdioma.title;
  const entradillaVeu = idioma === 'ca' ? (item?.entradilla || item?.post_subtitle || blocIdioma.entradilla) : blocIdioma.entradilla;

  const textDeLaVeu = useMemo(
    () => [titolVeu, entradillaVeu, textPlaEditorial(cos)].filter(Boolean).join('\n'),
    [titolVeu, entradillaVeu, cos]
  );

  const veuActivaObj = useMemo(
    () => VEUS_TERRITORIALS.find((v) => v.id === veuPreferida) || VEUS_TERRITORIALS[0],
    [veuPreferida]
  );
  const nomVeuActiva = tradueix(tOpc, [veuActivaObj.clauNom, veuActivaObj.reservaNom]);

  const triaVeuAmbRespostaAudible = async (veu) => {
    /* Pausa qualsevol mostra estàtica del banc per evitar solapaments */
    const llista = bancVeusRef.current;
    if (llista) {
      for (const elAudio of llista.querySelectorAll('audio')) {
        try { elAudio.pause(); } catch { /* ignorat */ }
      }
    }

    const desada = desaVeuPreferida(veu.id);
    setVeuPreferida(desada);

    try {
      const modul = await import('../../../services/veuIaiaService.js');
      if (modul.estaParlant()) {
        modul.parla(textDeLaVeu, { idioma, privat: false, veu: desada }).catch(() => {});
        return;
      }
      if (desada !== VEU_AUTO_NAVEGADOR) {
        const etiqueta = tradueix(tOpc, [veu.clauNom, veu.reservaNom]).replace('·', ',');
        const salutacio = `Veu activada: ${etiqueta}. Ja pots escoltar la pàgina i els refranys amb esta veu.`;
        modul.parla(salutacio, { idioma: 'ca', privat: false, veu: desada }).catch(() => {});
      }
    } catch {
      /* En proves sense síntesi o sense xarxa, la preferència ja ha quedat guardada. */
    }
  };

  const vesAlBancDeVeus = () => {
    if (bancVeusRef.current) {
      desplacaASeccio(bancVeusRef.current, { behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sdp-article-veu">
      <div className="sdp-article-veu__escolta-cap" data-sdp-no-locutar="">
        {!veuPaginaActiva ? (
          <BotoVeuIaia
            text={textDeLaVeu}
            idioma={idioma}
            privat={false}
            aria-label={nomDeLaVeu(t, titolVeu)}
          />
        ) : null}
        <Boto varietat="secundari" onClick={vesAlBancDeVeus}>
          <Volume2 size={18} aria-hidden="true" focusable="false" />
          <span>
            {tradueix(tOpc, ['patrimoni.bancVeus.veuActivaPindola', 'Veu activa: {veu}'])
              .replace('{veu}', nomVeuActiva)}
          </span>
        </Boto>
      </div>

      <Suspense fallback={<p className="sdp-muted" role="status">{tradueix(tOpc, ['patrimoni.jocParla.carregant', 'S’està carregant el joc de comarques…'])}</p>}>
        <JocDonParlesCard />
      </Suspense>

      <div className="sdp-article-veu__cos">
        {renderRichText(cos)}
      </div>

      <section ref={bancVeusRef} className="sdp-subtargeta sdp-banc-veus" data-sdp-no-locutar="" aria-labelledby={idMostres}>
        <h3 id={idMostres} className="sdp-banc-veus__titol">
          {tradueix(tOpc, ['patrimoni.bancVeus.titol', 'Banc d’escolta: les 7 veus obertes multiaccent (Matxa-TTS v2)'])}
        </h3>
        <p className="sdp-banc-veus__descripcio">
          {tradueix(tOpc, [
            'patrimoni.bancVeus.descripcio',
            'Escolta les quatre veus valencianes d’estudi (Gina i Berta femenines; Arnau i Lluc masculines) al costat de la nord-occidental (Emma), la central (Èlia) i la balear (Olga). Quan prems «Tria esta veu», tota la lectura en veu alta de la pàgina i dels refranys passa a sonar immediatament amb eixa veu neuronal des del nostre Node 0.',
          ])}
        </p>
        <ul className="sdp-banc-veus__llista">
          {VEUS_AMB_MOSTRA.map((veu) => {
            const triada = veuPreferida === veu.id;
            const nomVeu = tradueix(tOpc, [veu.clauNom, veu.reservaNom]);
            return (
              <li key={veu.id} className="sdp-banc-veus__item">
                <div className="sdp-banc-veus__item-cap">
                  <div>
                    <strong className="sdp-banc-veus__nom">{nomVeu}</strong>
                    <span className="sdp-banc-veus__territori">{veu.territori}</span>
                  </div>
                  <Boto
                    varietat={triada ? 'primari' : 'secundari'}
                    aria-pressed={triada}
                    onClick={() => triaVeuAmbRespostaAudible(veu)}
                  >
                    {triada ? <Check size={16} aria-hidden="true" focusable="false" /> : null}
                    <span>
                      {triada
                        ? tradueix(tOpc, ['patrimoni.bancVeus.preferidaActiva', 'Veu preferida'])
                        : tradueix(tOpc, ['patrimoni.bancVeus.triaVeu', 'Tria esta veu'])}
                    </span>
                  </Boto>
                </div>
                <audio
                  controls
                  preload="none"
                  className="sdp-banc-veus__audio"
                  src={resolveAsset(veu.mostraAsset)}
                  aria-label={nomVeu}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <Suspense fallback={<p className="sdp-muted" role="status">{tradueix(tOpc, ['patrimoni.refranyer.carregant', 'S’està carregant el Refranyer Sonor…'])}</p>}>
        <RefranyerSonorCard />
      </Suspense>
    </div>
  );
}

export default LaVeuDeSocDePobleArticle;
