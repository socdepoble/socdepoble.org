import { useMemo } from 'react';
import { useUIActions } from '../../app/contexts/UIContext';
import { ARBRES_MONUMENTALS_LA_TORRE, FONT_ARBRES_MONUMENTALS } from '../../data/patrimoni/arbresMonumentals.js';
import EmpremtaFont from './EmpremtaFont.jsx';
import { traductorPatrimoni } from './textosPatrimoni.js';

/* IDEA-115 (Onada R9, carril C5) · /page/arbres-monumentals: els 19 arbres de la pàgina 619 del WordPress de
   socdepoble.net, amb el nom literal, la marca «(Monumental)» de la font i l'enllaç a la fitxa original. Cap
   mesura, edat, descripció ni foto: la pàgina font no en dona (G9-01) i les fotos són de tercers (Decisió 3,
   261007).
   Les cites van en l'ordre de la font i en dos blocs (R9V-C5-02): l'actualització d'abril de 2017 (línies 1, 3 i
   7 del camp text, amb «[…]» on se'n salta la 5) i, més avall, qui va fer el catàleg i quina protecció hi cita (línies
   23 i 25, seguides). Així no es llig «no comptem amb cap biòleg» (2017) com si contradiguera l'autoria.
   G1-07 (Gauntlet de l'arbre R9) · L'encapçalament diu «quina protecció hi cita», no «què el protegix»: la font
   (línia 25) planteja l'ordenança com una consideració, i cap font no diu que els 19 arbres hi consten. */
const dataDeLaFont = (iso) => {
  const [any, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${any}`;
};

/** Cos viu de TextSection a /page/arbres-monumentals. */
export default function ArbresMonumentalsSection() {
  const { t } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const font = FONT_ARBRES_MONUMENTALS;
  const titol = tr('patrimoni.arbres.titol', 'Els {n} arbres del catàleg', { n: ARBRES_MONUMENTALS_LA_TORRE.length });
  const finestra = tr('patrimoni.font.finestraNova', '(s’obri en una finestra nova)');
  return (
    <section aria-label={titol}>
      <h3>{titol}</h3>
      <p>{tr('patrimoni.arbres.senseMesures', 'La pàgina font dona el nom de cada arbre i l’enllaç a la seua fitxa: no hi ha mesures, edats ni descripcions per arbre, i ací no se n’inventa cap. Tampoc no hi ha fotos.')}</p>
      <ol lang="ca">
        {ARBRES_MONUMENTALS_LA_TORRE.map((arbre) => (
          <li key={arbre.id}>
            <a href={arbre.enllac} target="_blank" rel="noopener noreferrer" aria-label={`${tr('patrimoni.arbres.fitxa', 'Fitxa original de {nom} a socdepoble.net', { nom: arbre.nom })} ${finestra}`}>{arbre.nom}</a>
            {arbre.monumental && <> · <strong>{tr('patrimoni.arbres.monumental', 'Monumental')}</strong></>}
          </li>
        ))}
      </ol>
      <h4 lang="ca">{font.paragrafs.actualitzacio}</h4>
      <blockquote lang="ca" cite={font.enllac}>
        <p>{font.paragrafs.deuAnys}</p>
        <p>[…]</p>
        <p>{font.paragrafs.senseBioleg}</p>
      </blockquote>
      <h4>{tr('patrimoni.arbres.qui', 'Qui l’ha fet i quina protecció hi cita')}</h4>
      <blockquote lang="ca" cite={font.enllac}>
        <p>{font.paragrafs.autoria}</p>
        <p>{font.paragrafs.ordenanca}</p>
      </blockquote>
      <p>{tr('patrimoni.font.literal', 'Transcripció literal: es conserven les paraules i les xifres de la font, també les errates.')} {tr('patrimoni.font.llengua', 'El contingut documental es manté en la llengua de la font: no es traduïx.')}</p>
      <p>
        <a href={font.enllac} target="_blank" rel="noopener noreferrer">{tr('patrimoni.arbres.original', 'La pàgina original del catàleg a socdepoble.net')}</a>{' '}
        {finestra} · {tr('patrimoni.arbres.publicat', 'Publicada el')} {dataDeLaFont(font.data)}
      </p>
      <EmpremtaFont font={font} tr={tr} extra={<> · <code>WP {font.wpId}</code></>} />
    </section>
  );
}
