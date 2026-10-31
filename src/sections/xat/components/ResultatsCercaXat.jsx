/**
 * ResultatsCercaXat.jsx — els resultats de la cerca global del Xat (T69).
 * Pinta el que torna cercaXat() (cercaXat.js) i res més: tres grups,
 * «Converses», «Persones» i «Missatges», amb els fragments ressaltats amb
 * <mark>, l'avís honest de l'abast (només els missatges carregats en esta
 * sessió) i un estat buit que diu la veritat per als filtres sense dades.
 *
 * Cap HTML: els `parts` són trossos { text, marca } i es pinten com a text.
 *
 * Les files parlen com les de la llista (T67): una comunitat porta l'avatar
 * quadrat apilat, el xebró i els noms dels seus grups (de `comunitats`, les
 * de useXat()), mai «Cap missatge.»; un grup, la icona de persones; un canal,
 * el megàfon; i totes, el tipus en text per a lectors de pantalla.
 *
 * F4 (D.3, ordre del Mestre del 261030) · La píndola de la llista (Tot · No
 * llegits · Preferits · Grups) també mana sobre la cerca (MITJÀ-01). Sense
 * cap resultat amb una píndola que no és «Tot» (`pindola`, el seu nom) però
 * amb resultats a «Tot» (`resultatsATot`, que compta XatSection), l'estat buit
 * no diu «Cap resultat per a…», que és fals: diu que és la píndola, quants n'hi
 * ha a «Tot» i porta un botó que hi torna (`onTornaATot`).
 *
 * Gauntlet F4 (xat-estat-buit-zona-viva-reemplacada) · Una sola zona viva,
 * sempre muntada mentre hi ha cerca i sempre el primer fill: un lector (NVDA,
 * JAWS, sovint VoiceOver) no anuncia una regió role="status" que naix amb el
 * text ja posat (la mateixa regla que la llista de XatSection, Revisió 261008).
 * L'estat buit de sempre és eixe node, visible i amb la classe de sempre; amb
 * resultats, o amb l'estat buit per la píndola (que pinta el seu text i el
 * botó a banda, sense role), el node és només per al lector. Després de
 * «Torna a «Tot»», diu quants resultats hi ha a «Tot» fins que la cerca canvia.
 */
import { useId, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { etiquetaLlista } from '../temps.js';
import { FILTRES_CERCA_XAT } from '../cercaXat.js';
import { senseMarquesDeNegreta } from '../negreta.js';
import FilaPersona from './FilaPersona.jsx';
import { AvatarComunitat, AvatarFil, esComunitat, etiquetaDeTipus, nomsDelsGrups } from './FilaConversa.jsx';

const CAP = Object.freeze([]);

/* Els trossos d'un text no tenen identitat pròpia: la posició és la clau. */
function Ressaltat({ parts = [] }) {
  return parts.map((part, i) => (part.marca
    ? <mark key={i} className="sdp-xat-marca">{part.text}</mark>
    : <span key={i}>{part.text}</span>));
}

function nomDe(fil, t) {
  return fil?.name || fil?.title || t('section.xat.conversaSenseNom', 'Conversa');
}

function Grup({ titol, children }) {
  const id = useId();
  return (
    <section className="sdp-xat-seccio" aria-labelledby={id}>
      <h3 id={id} className="sdp-xat-seccio__titol">{titol}</h3>
      <ul className="sdp-xat-llista">{children}</ul>
    </section>
  );
}

/* El nom d'una fila de resultat, ressaltat si cal, i el seu tipus en text. */
function NomDeFila({ fil, parts, t }) {
  const tipus = etiquetaDeTipus(fil, t);
  return (
    <span className="sdp-xat-fila__nom">
      {parts?.length ? <Ressaltat parts={parts} /> : nomDe(fil, t)}
      {tipus ? <span className="sdp-nomes-lector">{`, ${tipus}`}</span> : null}
    </span>
  );
}

export default function ResultatsCercaXat({
  resultat, terme = '', filtre = null, onObriFil, onObriPersona, obrintAmb = null, locale, t, comunitats = CAP,
  pindola = null, resultatsATot = 0, onTornaATot = null
}) {
  const { converses = [], persones = [], missatges = [] } = resultat || {};
  const filtreActiu = FILTRES_CERCA_XAT.find((f) => f.id === filtre) || null;
  const netTerme = String(terme || '').trim();
  /* Els grups de cada comunitat, per a la segona línia de la seua fila. */
  const grupsPerComunitat = useMemo(() => new Map((Array.isArray(comunitats) ? comunitats : CAP)
    .map((c) => [String(c?.fil?.id), nomsDelsGrups(c?.fills)])), [comunitats]);

  let buit = null;
  if (filtreActiu && !missatges.length) {
    buit = t('section.xat.cerca.filtreBuit', "Encara no hi ha cap missatge d'este tipus en les converses obertes.");
  } else if (!converses.length && !persones.length && !missatges.length) {
    /* Gauntlet 261025_0545 (TE-03) · Amb una funció de reemplaç: un terme
       amb «$'» o «$&» es repetix tal qual (moderacio.js, omple). */
    buit = t('section.xat.cerca.capResultat', 'Cap resultat per a «{terme}».').replace('{terme}', () => netTerme);
  }
  /* F4 (D.3) · Buit només per la píndola: la veritat i el camí de tornada. */
  const nATot = Number(resultatsATot) || 0;
  let amagatsPerLaPindola = null;
  if (buit && pindola && nATot > 0 && typeof onTornaATot === 'function') {
    const tot = t('section.xat.filtres.tot', 'Tot');
    const aTot = nATot === 1
      ? t('section.xat.cerca.pindola.aTot.un', 'Hi ha {n} resultat a «{tot}».')
      : t('section.xat.cerca.pindola.aTot', 'Hi ha {n} resultats a «{tot}».');
    const quantsATot = aTot.replace('{n}', () => String(nATot)).replace('{tot}', () => tot);
    amagatsPerLaPindola = {
      text: `${t('section.xat.cerca.pindola.buit', 'Cap resultat amb el filtre «{filtre}».').replace('{filtre}', () => pindola)} ${quantsATot}`,
      quantsATot,
      boto: t('section.xat.cerca.pindola.tornaATot', 'Torna a «{tot}»').replace('{tot}', () => tot)
    };
  }

  /* Gauntlet F4 · «Torna a «Tot»» deixa a la zona viva quants resultats hi
     ha a «Tot» (el text que ja es llegia), mentre el terme i el filtre de la
     cerca siguen els mateixos i ja sense píndola. Quan deixa de valdre,
     s'oblida (estat derivat del render anterior): tornar després a «Tot» amb
     la píndola no el repetix. */
  const [tornada, setTornada] = useState(null);
  const tornadaVigent = Boolean(tornada) && !buit && !pindola
    && tornada.terme === netTerme && tornada.filtre === filtre;
  if (tornada && !tornadaVigent) setTornada(null);
  const tornaATot = () => {
    setTornada({ text: amagatsPerLaPindola.quantsATot, terme: netTerme, filtre });
    onTornaATot();
  };

  let anunci = '';
  if (amagatsPerLaPindola) anunci = amagatsPerLaPindola.text;
  else if (buit) anunci = buit;
  else if (tornadaVigent) anunci = tornada.text;
  /* Només l'estat buit de sempre es veu en la zona viva mateixa. */
  const zonaVisible = Boolean(buit) && !amagatsPerLaPindola;

  return (
    <div className="sdp-xat-resultats" role="region" aria-label={t('section.xat.cerca.resultats', 'Resultats de la cerca')}>
      <p className={zonaVisible ? 'sdp-workspace-state' : 'sdp-nomes-lector'} role="status">{anunci}</p>
      {amagatsPerLaPindola ? (
        <div className="sdp-workspace-state">
          <p>{amagatsPerLaPindola.text}</p>
          <button type="button" className="sdp-xat-pindola" onClick={tornaATot}>{amagatsPerLaPindola.boto}</button>
        </div>
      ) : null}

      {converses.length ? (
        <Grup titol={t('section.xat.cerca.grup.converses', 'Converses')}>
          {converses.map(({ fil, parts, partsUltim }) => {
            const comunitat = esComunitat(fil);
            /* IDEA-53 · Les previes, sense les marques de la negreta. */
            let previa = senseMarquesDeNegreta(fil.ultimText) || t('section.xat.capMissatge', 'Cap missatge.');
            if (comunitat) previa = grupsPerComunitat.get(String(fil.id)) || '';
            else if (partsUltim?.length) previa = <Ressaltat parts={partsUltim} />;
            return (
              <li key={`c-${fil.id}`}>
                <button type="button" className={comunitat ? 'sdp-xat-fila sdp-xat-fila--comunitat' : 'sdp-xat-fila'} onClick={() => onObriFil(fil)}>
                  {comunitat ? <AvatarComunitat fil={fil} nom={nomDe(fil, t)} /> : <AvatarFil fil={fil} nom={nomDe(fil, t)} />}
                  <span className="sdp-xat-fila__cos">
                    <span className="sdp-xat-fila__cap">
                      <NomDeFila fil={fil} parts={parts} t={t} />
                      {comunitat ? (
                        <ChevronRight className="sdp-xat-fila__xebro" size={20} aria-hidden="true" focusable="false" />
                      ) : null}
                      {!comunitat && fil.ultimAl ? (
                        <time className="sdp-xat-fila__hora" dateTime={fil.ultimAl}>{etiquetaLlista(fil.ultimAl, { locale, t })}</time>
                      ) : null}
                    </span>
                    <span className="sdp-xat-fila__peu">
                      <span className="sdp-xat-fila__previa">{previa}</span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </Grup>
      ) : null}

      {persones.length ? (
        <Grup titol={t('section.xat.cerca.grup.persones', 'Persones')}>
          {persones.map(({ membre }) => (
            <li key={`p-${membre.usuari_id ?? membre.usuariId}`}>
              <FilaPersona membre={membre} obrint={obrintAmb === membre.usuari_id} onSelect={onObriPersona} t={t} />
            </li>
          ))}
        </Grup>
      ) : null}

      {missatges.length ? (
        <Grup titol={t('section.xat.cerca.grup.missatges', 'Missatges')}>
          {missatges.map(({ fil, missatge, parts }, i) => (
            <li key={`m-${fil.id}-${missatge.id ?? i}`}>
              <button type="button" className="sdp-xat-fila" onClick={() => onObriFil(fil)}>
                <AvatarFil fil={fil} nom={nomDe(fil, t)} />
                <span className="sdp-xat-fila__cos">
                  <span className="sdp-xat-fila__cap">
                    <NomDeFila fil={fil} t={t} />
                    {missatge.creatAl ? (
                      <time className="sdp-xat-fila__hora" dateTime={missatge.creatAl}>{etiquetaLlista(missatge.creatAl, { locale, t })}</time>
                    ) : null}
                  </span>
                  <span className="sdp-xat-fila__peu">
                    <span className="sdp-xat-fila__previa">
                      {missatge.sender !== 'me' && missatge.author ? `${missatge.author}: ` : null}
                      {parts?.length ? <Ressaltat parts={parts} /> : senseMarquesDeNegreta(missatge.text)}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </Grup>
      ) : null}

      <p className="sdp-xat-resultats__avis">
        {t('section.xat.cerca.avisLocal', 'Només es busca en les converses obertes en esta sessió.')}
      </p>
    </div>
  );
}
