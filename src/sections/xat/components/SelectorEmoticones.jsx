/**
 * SelectorEmoticones.jsx — el calaix d'emoticones del compositor del xat
 * (pla 261022_1425: «Emojis grans i paritat WhatsApp», aprovat pel Mestre).
 *
 * El munta el Compositor damunt del camp, en obrir la carona. Per a gent gran
 * de poble: cada emoticona és un glif de 38px en una diana de 52px (la
 * variant gran de la llista de GraellaEmojis), el doble que a les apps de
 * missatgeria.
 *
 *   · Pestanyes (role tablist, fletxes, Inici i Fi): la primera, «Del poble»
 *     (les recents i la tria rural d'emoticonesXat.js), i després les
 *     famílies del catàleg Emojis XL, les mateixes del Bloc i del Perfil
 *     (familiesEmojis.js). Cada una porta el seu nom com a nom accessible i
 *     com a títol visible del panell: una icona sola no ho diu prou clar.
 *   · El catàleg (292 kB) arriba a demanda, la primera vegada que s'obri el
 *     calaix, i es queda en memòria. «Del poble» no l'espera. Les emoticones
 *     que este navegador no reconeix (utils/emoji · emojiSol: Safari 16 porta
 *     les dades d'Unicode 14) no es pinten: es veurien trencades, i la
 *     interfície no promet el que no fa.
 *   · Cada llista és la de GraellaEmojis (LlistaEmojis): un sol botó al
 *     tabulador i les fletxes s'hi mouen. Triar crida onTria(glif); qui munta
 *     el calaix decidix on va el text i el focus.
 *   · Les recents es lligen en obrir: triar no les reordena davall del dit,
 *     com a WhatsApp. Es veuen ordenades la pròxima vegada.
 *   · Escape crida onTanca. `enfocaEnObrir` porta el focus a la pestanya
 *     activa (obert amb el teclat, o en mòbil, on cal amagar el teclat de la
 *     pantalla); `retenFocus` (ample) fa que clicar un botó del calaix no
 *     furte el focus al camp, com a WhatsApp Web.
 *
 * CONTRACTE
 *   id · t · onTria (glif) · onTanca () · enfocaEnObrir · retenFocus · estret
 *   carregaCataleg () => Promise<{ GRUPS_EMOJIS }> (estable; per defecte, el del Bloc)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Apple, Car, Flag, Heart, Lightbulb, PawPrint, Smile, Tractor, Users, Volleyball } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/index.js';
import { LlistaEmojis } from '../../../components/universal/classificacio/GraellaEmojis.jsx';
import { emojiSol } from '../../../utils/emoji.js';
import { carregaCatalegEmojis } from '../../notes/canalEmojis.js';
import { EMOTICONES_DEL_POBLE, llegixRecents, recordaRecent } from '../emoticonesXat.js';

const POBLE = 'poble';
const CAP = Object.freeze([]);

/* Les pestanyes del catàleg, en l'ordre de familiesEmojis.js: la icona i el nom
   traduït de cada família. Una família que no hi és (les dades sintètiques de
   les proves) porta la carona i el nom que du. */
const FAMILIES = Object.freeze([
  ['cares-emocions', Smile, 'section.xat.emoticones.familia.cares', 'Cares'],
  ['persones-cos', Users, 'section.xat.emoticones.familia.persones', 'Persones'],
  ['animals-natura', PawPrint, 'section.xat.emoticones.familia.animals', 'Animals'],
  ['menjar-beguda', Apple, 'section.xat.emoticones.familia.menjar', 'Menjar'],
  ['activitats', Volleyball, 'section.xat.emoticones.familia.activitats', 'Activitats'],
  ['viatges-llocs', Car, 'section.xat.emoticones.familia.viatges', 'Viatges'],
  ['objectes', Lightbulb, 'section.xat.emoticones.familia.objectes', 'Objectes'],
  ['simbols', Heart, 'section.xat.emoticones.familia.simbols', 'Símbols'],
  ['banderes', Flag, 'section.xat.emoticones.familia.banderes', 'Banderes']
]);
const PER_ID = new Map(FAMILIES.map((familia) => [familia[0], familia]));

/* Les seccions de «Del poble» (emoticonesXat.js), amb el nom traduït. */
const SECCIONS = Object.freeze({
  cares: 'section.xat.emoticones.seccio.cares',
  gestos: 'section.xat.emoticones.seccio.gestos',
  horta: 'section.xat.emoticones.seccio.horta',
  natura: 'section.xat.emoticones.seccio.natura',
  festes: 'section.xat.emoticones.seccio.festes'
});

/* El catàleg de cada carregador, ja sense les emoticones que este navegador
   no reconeix: una sola càrrega per sessió. Una que falla s'oblida i es pot
   tornar a provar. */
const CATALEGS = new WeakMap();
function catalegDe(carrega) {
  let promesa = CATALEGS.get(carrega);
  if (!promesa) {
    promesa = Promise.resolve()
      .then(() => carrega())
      .then((modul) => {
        if (!Array.isArray(modul?.GRUPS_EMOJIS)) throw new Error('Catàleg sense GRUPS_EMOJIS');
        return Object.freeze(modul.GRUPS_EMOJIS
          .map((grup) => Object.freeze({ ...grup, emojis: (grup.emojis ?? CAP).filter(([, glif]) => emojiSol(glif)) }))
          .filter((grup) => grup.emojis.length));
      });
    promesa.catch(() => CATALEGS.delete(carrega));
    CATALEGS.set(carrega, promesa);
  }
  return promesa;
}

/** Les pestanyes: «Del poble» i les famílies (les del catàleg, o les conegudes mentre arriba). */
function pestanyesDe(t, grups) {
  const coneguda = ([id, Icona, clau, nom]) => ({ id, Icona, nom: t(clau, nom) });
  const families = grups
    ? grups.map((grup) => (PER_ID.has(grup.id) ? coneguda(PER_ID.get(grup.id)) : { id: grup.id, Icona: Smile, nom: grup.nom }))
    : FAMILIES.map(coneguda);
  return [{ id: POBLE, Icona: Tractor, nom: t('section.xat.emoticones.poble', 'Del poble') }, ...families];
}

function Seccio({ titol, emojis, onTria }) {
  return (
    <section className="sdp-xat-emojis__seccio">
      <h3 className="sdp-xat-emojis__titol">{titol}</h3>
      <LlistaEmojis gran emojis={emojis} etiqueta={titol} onTria={onTria} />
    </section>
  );
}

export default function SelectorEmoticones({
  id, t, onTria, onTanca, enfocaEnObrir = false, retenFocus = false, estret = false,
  carregaCataleg = carregaCatalegEmojis
}) {
  const [pestanya, setPestanya] = useState(POBLE);
  const [cataleg, setCataleg] = useState({ estat: 'carregant', grups: null });
  const [intent, setIntent] = useState(0);
  const [recents] = useState(llegixRecents);
  const barra = useRef(null);
  const panell = useRef(null);

  useEffect(() => {
    let viu = true;
    setCataleg((abans) => (abans.estat === 'llest' ? abans : { estat: 'carregant', grups: null }));
    catalegDe(carregaCataleg)
      .then((grups) => { if (viu) setCataleg({ estat: 'llest', grups }); })
      .catch(() => { if (viu) setCataleg({ estat: 'error', grups: null }); });
    return () => { viu = false; };
  }, [carregaCataleg, intent]);

  /* En obrir amb el teclat (o en mòbil), el focus entra a la pestanya activa. */
  useEffect(() => {
    if (enfocaEnObrir) barra.current?.querySelector('[aria-selected="true"]')?.focus();
  }, [enfocaEnObrir]);

  const pestanyes = pestanyesDe(t, cataleg.grups);
  /* Una família que el catàleg no porta (o que el navegador no pinta) torna a «Del poble». */
  const activa = pestanyes.some((p) => p.id === pestanya) ? pestanya : POBLE;
  const idPestanya = (clau) => `${id}-pestanya-${clau}`;
  const idPanell = `${id}-panell`;

  const triaPestanya = (clau) => {
    setPestanya(clau);
    if (panell.current) panell.current.scrollTop = 0;
  };

  const mouPestanya = (e) => {
    const botons = Array.from(barra.current?.querySelectorAll('[role="tab"]') ?? CAP);
    const actual = botons.indexOf(e.target);
    if (actual < 0) return;
    const ultim = botons.length - 1;
    const desti = { ArrowRight: actual === ultim ? 0 : actual + 1, ArrowLeft: actual === 0 ? ultim : actual - 1, Home: 0, End: ultim }[e.key];
    if (desti === undefined) return;
    e.preventDefault();
    botons[desti].focus();
    botons[desti].scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    triaPestanya(pestanyes[desti].id);
  };

  /* Estable (amb onTria estable): canviar de pestanya no torna a pintar les llistes. */
  const triaEmoji = useCallback((glif, nom) => {
    recordaRecent(glif, nom);
    onTria?.(glif);
  }, [onTria]);

  const alTeclat = (e) => {
    if (e.key !== 'Escape') return;
    e.preventDefault();
    onTanca?.();
  };

  /* Ample: un clic als botons del calaix no trau el focus del camp d'escriure. */
  const reten = (e) => { if (e.target.closest?.('button')) e.preventDefault(); };

  let contingut;
  if (activa === POBLE) {
    contingut = (
      <>
        {recents.length ? <Seccio titol={t('section.xat.emoticones.recents', 'Recents')} emojis={recents} onTria={triaEmoji} /> : null}
        {EMOTICONES_DEL_POBLE.map((seccio) => (
          <Seccio key={seccio.id} titol={t(SECCIONS[seccio.id], seccio.nom)} emojis={seccio.emojis} onTria={triaEmoji} />
        ))}
      </>
    );
  } else if (cataleg.estat === 'llest') {
    const grup = cataleg.grups.find((g) => g.id === activa);
    const nom = pestanyes.find((p) => p.id === activa).nom;
    contingut = <Seccio key={grup.id} titol={nom} emojis={grup.emojis} onTria={triaEmoji} />;
  } else if (cataleg.estat === 'error') {
    contingut = (
      <div className="sdp-xat-emojis__estat" role="alert">
        <p>{t('section.xat.emoticones.error', 'No s’han pogut carregar les emoticones.')}</p>
        <Boto varietat="secundari" onClick={() => setIntent((n) => n + 1)}>{t('common.reintenta', 'Torna-ho a provar')}</Boto>
      </div>
    );
  } else {
    contingut = <p className="sdp-xat-emojis__estat" role="status">{t('section.xat.emoticones.carregant', 'Carregant les emoticones…')}</p>;
  }

  return (
    <div
      id={id}
      className={`sdp-xat-emojis${estret ? ' sdp-xat-emojis--estret' : ''}`}
      role="dialog"
      aria-label={t('section.xat.emoticones.etiqueta', 'Emoticones')}
      onKeyDown={alTeclat}
      onMouseDown={retenFocus ? reten : undefined}
    >
      <div
        ref={barra}
        className="sdp-xat-emojis__pestanyes"
        role="tablist"
        aria-label={t('section.xat.emoticones.categories', 'Categories d’emoticones')}
        onKeyDown={mouPestanya}
      >
        {pestanyes.map(({ id: clau, Icona, nom }) => (
          <button
            key={clau}
            id={idPestanya(clau)}
            type="button"
            role="tab"
            className="sdp-xat-emojis__pestanya"
            aria-selected={clau === activa}
            aria-controls={idPanell}
            aria-label={nom}
            title={nom}
            tabIndex={clau === activa ? 0 : -1}
            onClick={() => triaPestanya(clau)}
          >
            <Icona size={22} aria-hidden="true" focusable="false" />
          </button>
        ))}
      </div>
      <div ref={panell} id={idPanell} className="sdp-xat-emojis__panell" role="tabpanel" aria-labelledby={idPestanya(activa)}>
        {contingut}
      </div>
    </div>
  );
}
