/**
 * GraellaEmojis — la graella del catàleg Emojis XL per a triar un emoji
 * (Bloc 3.8 del Gauntlet, 261016: «substituint el text antic de drecera de
 * teclat de l'OS per una graella interactiva i accessible»).
 *
 * És la mateixa font que l'espècimen Emojis XL de Disseny (el catàleg RGI
 * d'Unicode, emojisUnicode18.js), però compacta: un selector, no el catàleg
 * de 5rem. La munten el DialegEmoticona (la ranura d'emoticona: triar
 * assigna) i el diàleg «Emojis» del Bloc de notes (el cos: triar inserix al
 * cursor o copia).
 *
 * Regla de capes (components/ no importa de sections/): les dades NO
 * s'importen ací. Qui la munta passa `carregaCataleg`, una funció que torna
 * (o promet) el mòdul amb { GRUPS_EMOJIS }: el Bloc fa un import() dinàmic,
 * i els 292 kB del catàleg només arriben quan s'obri la graella.
 *
 * Accessibilitat:
 *   · cada família és un <details> natiu (la primera, oberta): només pinta
 *     els seus botons quan és oberta, també la de Persones (2430);
 *   · cada emoji és un <button> natiu amb el nom oficial com a nom accessible
 *     (en anglès: lang="en") i el glif aria-hidden;
 *   · dins de cada llista, un sol botó entra a la seqüència del tabulador
 *     (tabindex mòbil): les fletxes, Inici i Fi s'hi mouen;
 *   · la cerca és un camp de cerca (role searchbox) amb etiqueta visible, pel
 *     nom oficial, i el recompte s'anuncia sense moure el focus.
 *
 * CONTRACTE
 *   carregaCataleg () => Promise<{ GRUPS_EMOJIS }>  (estable: es demana en muntar)
 *   onTria (glif, nom) => void
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Boto, Camp, CampText, Carregant } from '../../PedraSeca/index.js';

const CAP = Object.freeze([]);
/* Una cerca curta («a») casaria amb milers de noms: se'n pinten els primers. */
const MAXIM_RESULTATS = 120;
const ETIQUETA_CERCA = 'Cerca un emoji';
const AJUDA_CERCA = 'Pel nom oficial, en anglès: per exemple, «tomato» o «heart».';

/* Les tecles que mouen el focus dins d'una llista de botons. Amunt i avall
   salten una fila: les columnes es compten sobre la primera fila pintada
   (el navegador ja ha fet el layout; cap amplada pròpia). */
function columnesDe(botons) {
  const dalt = botons[0]?.offsetTop;
  const primera = botons.findIndex((boto) => boto.offsetTop !== dalt);
  return primera > 0 ? primera : botons.length;
}

function destiDeLaTecla(tecla, actual, botons) {
  if (tecla === 'Home') return 0;
  if (tecla === 'End') return botons.length - 1;
  if (tecla === 'ArrowRight') return actual + 1;
  if (tecla === 'ArrowLeft') return actual - 1;
  if (tecla === 'ArrowDown') return actual + columnesDe(botons);
  if (tecla === 'ArrowUp') return actual - columnesDe(botons);
  return null;
}

/* Un emoji. Memoritzat: moure el focus només torna a pintar els dos botons
   que canvien de tabindex, també a la família de Persones (2430). */
const BotoEmoji = memo(function BotoEmoji({ codi, glif, nom, index, enSequencia, onActiva, onTria }) {
  return (
    <li>
      <button
        type="button"
        className="sdp-graella-emojis__boto"
        data-emoji-code={codi}
        lang="en"
        aria-label={nom}
        title={nom}
        tabIndex={enSequencia ? 0 : -1}
        onFocus={() => onActiva(index)}
        onClick={() => onTria(glif, nom)}
      >
        <span aria-hidden="true">{glif}</span>
      </button>
    </li>
  );
});

/* Els botons d'una família (o dels resultats). Un sol tabindex 0 per llista. */
const Botons = memo(function Botons({ emojis, etiqueta, onTria }) {
  const [actiu, setActiu] = useState(0);
  const llista = useRef(null);
  const enSequencia = actiu < emojis.length ? actiu : 0;

  const mou = (e) => {
    const botons = Array.from(llista.current?.querySelectorAll('button') ?? CAP);
    const actual = botons.indexOf(e.target);
    if (actual < 0) return;
    const desti = destiDeLaTecla(e.key, actual, botons);
    if (desti === null || desti < 0 || desti >= botons.length) return;
    e.preventDefault();
    botons[desti].focus();
  };

  return (
    <ul ref={llista} className="sdp-graella-emojis__graella" aria-label={etiqueta} onKeyDown={mou}>
      {emojis.map(([codi, glif, nom], index) => (
        <BotoEmoji key={codi} codi={codi} glif={glif} nom={nom} index={index}
          enSequencia={index === enSequencia} onActiva={setActiu} onTria={onTria} />
      ))}
    </ul>
  );
});

/* Una família: el summary diu el nom i quantes n'hi ha; els botons, només
   oberta. El <details> és controlat: React el deixa com diu el navegador. */
const Familia = memo(function Familia({ grup, oberta, onCommuta, onTria }) {
  return (
    <details open={oberta} onToggle={(e) => onCommuta(grup.id, e.currentTarget.open)}>
      <summary>{grup.nom} ({grup.emojis.length})</summary>
      {oberta ? <Botons emojis={grup.emojis} etiqueta={grup.nom} onTria={onTria} /> : null}
    </details>
  );
});

function textDelRecompte(trobats, total) {
  if (!total) return 'Cap emoji amb eixe nom.';
  if (total > trobats) return `Els primers ${trobats} de ${total} emojis: afina la cerca.`;
  return total === 1 ? '1 emoji.' : `${total} emojis.`;
}

export function GraellaEmojis({ carregaCataleg, onTria }) {
  const [cataleg, setCataleg] = useState({ estat: 'carregant', grups: CAP });
  const [intent, setIntent] = useState(0);
  const [terme, setTerme] = useState('');
  const [oberts, setOberts] = useState(null);

  useEffect(() => {
    let viu = true;
    /* Un «Torna-ho a provar» torna a l'estat de càrrega; el primer muntatge ja hi és. */
    setCataleg((abans) => (abans.estat === 'carregant' ? abans : { estat: 'carregant', grups: CAP }));
    Promise.resolve()
      .then(() => carregaCataleg())
      .then((modul) => {
        if (!viu) return;
        const grups = Array.isArray(modul?.GRUPS_EMOJIS) ? modul.GRUPS_EMOJIS : null;
        setCataleg(grups ? { estat: 'llest', grups } : { estat: 'error', grups: CAP });
      })
      .catch(() => { if (viu) setCataleg({ estat: 'error', grups: CAP }); });
    return () => { viu = false; };
  }, [carregaCataleg, intent]);

  /* La primera família arrenca oberta; després mana la persona. */
  const familiesObertes = oberts ?? new Set(cataleg.grups.length ? [cataleg.grups[0].id] : CAP);
  const commuta = useCallback((id, oberta) => {
    setOberts((abans) => {
      const actuals = abans ?? new Set(cataleg.grups.length ? [cataleg.grups[0].id] : CAP);
      if (actuals.has(id) === oberta) return abans ?? actuals;
      const seguents = new Set(actuals);
      if (oberta) seguents.add(id);
      else seguents.delete(id);
      return seguents;
    });
  }, [cataleg.grups]);

  const tria = useCallback((glif, nom) => onTria?.(glif, nom), [onTria]);

  const consulta = terme.trim().toLowerCase();
  const resultats = useMemo(() => {
    if (!consulta) return null;
    const tots = cataleg.grups.flatMap((grup) => grup.emojis.filter(([, , nom]) => nom.toLowerCase().includes(consulta)));
    return { total: tots.length, emojis: tots.slice(0, MAXIM_RESULTATS) };
  }, [consulta, cataleg.grups]);

  if (cataleg.estat === 'carregant') return <Carregant etiqueta="Carregant els emojis…" />;
  if (cataleg.estat === 'error') {
    return (
      <div className="sdp-graella-emojis" role="alert">
        <p className="sdp-graella-emojis__estat">No s’han pogut carregar els emojis.</p>
        <Boto varietat="secundari" onClick={() => setIntent((n) => n + 1)}>Torna-ho a provar</Boto>
      </div>
    );
  }

  return (
    <div className="sdp-graella-emojis">
      <Camp etiqueta={ETIQUETA_CERCA} ajuda={AJUDA_CERCA}>
        <CampText
          tipus="search"
          name="graellaEmojisCerca"
          autoComplete="off"
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          onKeyDown={(e) => {
            /* Amb text, Escape esborra; buit, el deixa passar i el diàleg es tanca. */
            if (e.key === 'Escape' && terme) { e.preventDefault(); e.stopPropagation(); setTerme(''); }
          }}
        />
      </Camp>
      <p className="sdp-graella-emojis__estat" role="status" aria-live="polite" aria-atomic="true">
        {resultats ? textDelRecompte(resultats.emojis.length, resultats.total) : ''}
      </p>
      {resultats ? (
        resultats.emojis.length ? <Botons key={consulta} emojis={resultats.emojis} etiqueta="Resultats de la cerca" onTria={tria} /> : null
      ) : cataleg.grups.map((grup) => (
        <Familia key={grup.id} grup={grup} oberta={familiesObertes.has(grup.id)} onCommuta={commuta} onTria={tria} />
      ))}
    </div>
  );
}

export default GraellaEmojis;
