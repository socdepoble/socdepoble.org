/**
 * DialegValors — categories o etiquetes d'un document.
 *
 * Dos tipus d'acció, i la modal els separa:
 *   · SELECCIONAR i AFEGIR són d'esta nota: caselles que es confirmen amb
 *     «Desar» (Pedra Seca: casella = decisió confirmada).
 *   · REANOMENAR i ESBORRAR són del catàleg i toquen totes les notes: s'apliquen
 *     en l'acte (esborrar, després d'una confirmació a la mateixa fila).
 *
 * REGLA D'ORFANDAT: amb `minim` > 0, el darrer valor triat no es pot desmarcar
 * ni esborrar, i «Desar» espera fins que n'hi haja prou. `fixos` són els valors
 * de sèrie del bloc: sempre tornen al catàleg, per això no es reanomenen ni
 * s'esborren.
 */
import { useId, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Dialeg, Boto, Camp, CampText, Casella } from '../../PedraSeca/index.js';

const CAP = Object.freeze([]);
const netejaNom = (valor) => String(valor ?? '').trim();

/* T7B-V3 · Per què una fila no porta llapis ni paperera: la frase nomena els
   valors de sèrie que es veuen a la llista («A», «A» i «B», «A», «B» i «C»). */
const cites = (noms) => {
  const c = noms.map((n) => `«${n}»`);
  return c.length > 1 ? `${c.slice(0, -1).join(', ')} i ${c[c.length - 1]}` : c[0];
};
export const textDeSerie = (noms) => (noms.length > 1
  ? `${cites(noms)} són de sèrie: no es reanomenen ni s’esborren.`
  : `${cites(noms)} és de sèrie: no es reanomena ni s’esborra.`);

export function DialegValors({
  obert, onTanca, titol, etiquetaNou, cataleg = CAP, seleccionats = CAP, minim = 0, fixos = CAP,
  usos = {}, avisMinim, onDesa, onReanomena, onEsborra, globalActiu = true, avisGlobal, extra = null
}) {
  const [triats, setTriats] = useState(() => new Set(seleccionats));
  const [afegits, setAfegits] = useState(CAP);
  const [amagats, setAmagats] = useState(() => new Set());
  const [nou, setNou] = useState('');
  const [editant, setEditant] = useState(null);
  const [nomEditat, setNomEditat] = useState('');
  const [errorNom, setErrorNom] = useState(null);
  const [confirmant, setConfirmant] = useState(null);

  // El catàleg pot arribar tard (desat asíncron): el que s'ha reanomenat o
  // esborrat ací s'amaga encara que el pare no s'haja actualitzat.
  const opcions = useMemo(
    () => [...new Set([...cataleg, ...afegits, ...triats])]
      .filter((v) => !amagats.has(v))
      .sort((a, b) => a.localeCompare(b, 'ca')),
    [cataleg, afegits, triats, amagats]
  );

  const alMinim = minim > 0 && triats.size <= minim;
  const bloquejat = (valor) => alMinim && triats.has(valor);
  const esFix = (valor) => fixos.includes(valor);
  const idSerie = useId();
  const deSerie = opcions.filter(esFix);

  const alterna = (valor) => setTriats((previ) => {
    const seguent = new Set(previ);
    if (seguent.has(valor)) seguent.delete(valor); else seguent.add(valor);
    return seguent;
  });

  const afegix = () => {
    const valor = netejaNom(nou);
    if (!valor) return;
    setAfegits((previ) => (previ.includes(valor) ? previ : [...previ, valor]));
    setAmagats((previ) => { const s = new Set(previ); s.delete(valor); return s; });
    setTriats((previ) => new Set([...previ, valor]));
    setNou('');
  };

  const comencaReanomenar = (valor) => {
    setConfirmant(null);
    setEditant(valor);
    setNomEditat(valor);
    setErrorNom(null);
  };

  const aplicaReanomenar = () => {
    const vell = editant;
    const nom = netejaNom(nomEditat);
    if (!nom) { setErrorNom('Escriu un nom.'); return; }
    if (nom !== vell && opcions.includes(nom)) { setErrorNom(`Ja hi ha «${nom}». Tria un altre nom.`); return; }
    if (nom !== vell) {
      onReanomena?.(vell, nom);
      const canvia = (llista) => llista.map((v) => (v === vell ? nom : v));
      setTriats((previ) => new Set(canvia([...previ])));
      setAfegits((previ) => canvia(previ).concat(previ.includes(vell) ? [] : [nom]));
      setAmagats((previ) => new Set([...previ, vell]));
    }
    setEditant(null);
  };

  const aplicaEsborrar = (valor) => {
    onEsborra?.(valor);
    setTriats((previ) => { const s = new Set(previ); s.delete(valor); return s; });
    setAfegits((previ) => previ.filter((v) => v !== valor));
    setAmagats((previ) => new Set([...previ, valor]));
    setConfirmant(null);
  };

  const fila = (valor) => {
    if (editant === valor) {
      return (
        <div className="sdp-classificacio-dialeg__edicio">
          <Camp etiqueta={`Nou nom per a «${valor}»`} error={errorNom}>
            <CampText
              value={nomEditat}
              autoFocus
              onChange={(e) => setNomEditat(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); aplicaReanomenar(); }
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setEditant(null); }
              }}
            />
          </Camp>
          <Boto varietat="primari" onClick={aplicaReanomenar}>Aplicar</Boto>
          <Boto varietat="secundari" onClick={() => setEditant(null)}>Cancel·lar</Boto>
        </div>
      );
    }
    if (confirmant === valor) {
      const n = usos[valor] || 0;
      return (
        <div className="sdp-classificacio-dialeg__edicio" role="group" aria-label={`Esborrar «${valor}»`}>
          <p className="sdp-classificacio-dialeg__avis">
            {`S'esborrarà «${valor}» de totes les notes${n ? ` (${n})` : ''}.`}
            {minim > 0 ? ' Les que es queden sense cap rebran «General».' : ''}
          </p>
          <Boto varietat="perill" aria-label={`Confirmar: esborrar «${valor}»`} onClick={() => aplicaEsborrar(valor)}>Esborrar</Boto>
          <Boto varietat="secundari" autoFocus onClick={() => setConfirmant(null)}>Cancel·lar</Boto>
        </div>
      );
    }
    /* T7 (P8) · Un valor de sèrie no es reanomena ni s'esborra mai: la fila
       no porta el llapis ni la paperera (abans, dos botons desactivats sense
       funció). Mentre falten notes per carregar (!globalActiu), els d'un
       valor propi es veuen desactivats i l'avís de davall diu per què.
       T7B-V3 · La casella d'un valor de sèrie es descriu amb la frase de
       davall que ho explica (aria-describedby); el nom continua sent el valor. */
    const fix = esFix(valor);
    return (
      <>
        <Casella
          etiqueta={valor}
          checked={triats.has(valor)}
          disabled={bloquejat(valor)}
          onChange={() => alterna(valor)}
          aria-describedby={fix ? idSerie : undefined}
        />
        {fix ? null : (
          <>
            <Boto
              varietat="fantasma" icona={Pencil}
              aria-label={`Reanomenar «${valor}»`} title="Reanomenar a totes les notes"
              disabled={!globalActiu}
              onClick={() => comencaReanomenar(valor)}
            />
            <Boto
              varietat="fantasma" icona={Trash2}
              aria-label={`Esborrar «${valor}»`} title="Esborrar de totes les notes"
              disabled={!globalActiu || bloquejat(valor)}
              onClick={() => { setEditant(null); setConfirmant(valor); }}
            />
          </>
        )}
      </>
    );
  };

  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={titol}
      mida="s"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>Cancel·lar</Boto>
          <Boto varietat="primari" disabled={triats.size < minim} onClick={() => onDesa?.([...triats])}>Desar</Boto>
        </>
      )}
    >
      {alMinim && avisMinim ? (
        <p className="sdp-classificacio-dialeg__avis" role="status">{avisMinim}</p>
      ) : null}
      <ul className="sdp-classificacio-dialeg__llista">
        {opcions.map((valor) => (
          <li key={valor} className="sdp-classificacio-dialeg__fila">{fila(valor)}</li>
        ))}
      </ul>
      <p className="sdp-classificacio-dialeg__avis">
        {globalActiu
          ? 'Reanomenar i esborrar s’apliquen de seguida a totes les notes.'
          : avisGlobal}
        {deSerie.length ? <>{' '}<span id={idSerie}>{textDeSerie(deSerie)}</span></> : null}
      </p>
      <div className="sdp-classificacio-dialeg__afegir">
        <Camp etiqueta={etiquetaNou} ajuda="Escriu el nom i prem Retorn o «Afegir».">
          <CampText
            value={nou}
            onChange={(e) => setNou(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); afegix(); } }}
          />
        </Camp>
        <Boto varietat="secundari" icona={Plus} onClick={afegix}>Afegir</Boto>
      </div>
      {extra}
    </Dialeg>
  );
}

export default DialegValors;
