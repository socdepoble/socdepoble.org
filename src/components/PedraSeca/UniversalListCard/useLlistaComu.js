/**
 * useLlistaComu.js — Fase E (261020, tasca 2; pla 261020_2045) · l'estat
 * viu d'una llista d'«El Comú» a la vista, sense saber d'on ve ni on va.
 *
 *   const { llista, resum, fes, rebutRemot, error, netejaError, clientInstanceId } =
 *     useLlistaComu(llistaDelPort, { actor, onMuta, rellotge, generaId })
 *
 * Dues capes, com qualsevol llista optimista amb un servidor que mana:
 *   · `confirmada`: la darrera instantània acceptada (la inicial, la de la
 *     prop, la d'un remot o la resposta del servidor a un toc);
 *   · `pendents`: els tocs en vol, en ordre, amb el rellotge i els ids que
 *     van fer servir. La llista pintada és sempre confirmada + pendents.
 * · fes(accio) aplica l'acció al nucli pur i pinta de seguida (en el mateix
 *   fotograma del toc). Si hi ha onMuta, li passa
 *   { accio, llista, revisioBase, clientInstanceId }: és el lloc on la tasca 4
 *   enxufarà el port (rpc_muta_element_comu).
 *     - Si respon amb una instantània, és la del servidor i mana: passa a
 *       confirmada i els tocs que encara són en vol s'hi tornen a aplicar.
 *       Una resposta directa no és cap ressò, encara que porte el nostre
 *       clientInstanceId i la mateixa revisió.
 *     - Si respon sense res, el toc es dona per acceptat tal com es va pintar.
 *     - Si falla, el toc ix de la cua i la llista es refà des de confirmada
 *       amb la resta (cap toc fantasma), i l'error es pinta pel seu `codi`
 *       (o «desconegut»: mai un missatge del servidor).
 * · rebutRemot(instantania) (el canal en viu): una altra llista, una revisió
 *   més vella que la confirmada o el ressò del propi toc mentre n'hi ha en
 *   vol no pinten res (la guarda anti-eco); la resta passa a confirmada.
 * · La prop `llista` fa el mateix quan canvia; si porta una altra llista (un
 *   altre id) o una de no vàlida, la vista es reinicia: res de la d'abans
 *   (una fitxa privada, posem per cas) no es continua pintant ni exportant.
 * · La identitat és la de la sessió (actor), mai un text escrit a mà.
 *
 * Presentacional: cap emmagatzematge, cap xarxa, cap backend. El rellotge i
 * els identificadors es poden injectar (proves i espècimens deterministes).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CODIS_COMU, aplicaAccio, normalitzaLlista, resumDe, triaInstantania, validaLlista } from './nucliComu.js';

let comptador = 0;
/** Un identificador opac per a la instància o per a un element nou. */
export function idNou() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  comptador += 1;
  return `comu-${comptador.toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

const errorDe = (motiu) => ({ codi: CODIS_COMU.includes(motiu?.codi) ? motiu.codi : 'desconegut' });
const valida = (llista) => validaLlista(llista).ok;

/** Un generador que torna, en ordre, els ids d'abans i, quan s'acaben, en demana de nous. */
function repetidor(ids, generaId) {
  let i = 0;
  return () => {
    if (i < ids.length) return ids[i++];
    const nou = generaId();
    ids.push(nou);
    i += 1;
    return nou;
  };
}

export function useLlistaComu(llistaEntrada, { actor = null, onMuta = null, rellotge = null, generaId = idNou } = {}) {
  const [clientInstanceId] = useState(() => generaId());
  const [llista, setLlista] = useState(() => (valida(llistaEntrada) ? normalitzaLlista(llistaEntrada) : null));
  const [error, setError] = useState(() => (valida(llistaEntrada) ? null : { codi: 'llista-invalida' }));
  const actual = useRef(llista);
  const confirmada = useRef(llista);
  const pendents = useRef([]);
  const muntat = useRef(true);
  const comptadorDeTocs = useRef(0);

  const posa = useCallback((nova) => {
    actual.current = nova;
    setLlista(nova);
  }, []);

  /** confirmada + els tocs en vol, amb el seu rellotge i els seus ids. */
  const refa = useCallback(() => {
    const base = confirmada.current;
    if (!base) return posa(null);
    const resultat = pendents.current.reduce((l, p) => {
      const r = aplicaAccio(l, p.accio, { actor: p.actor, ara: p.ara, nouId: repetidor(p.ids, generaId) });
      return r.ok ? { ...r.llista, darrerClientInstanceId: clientInstanceId } : l;
    }, base);
    return posa(resultat);
  }, [clientInstanceId, generaId, posa]);

  /** Una instantània nova que mana: passa a confirmada i s'hi tornen a aplicar els pendents. */
  const confirma = useCallback((instantania) => {
    confirmada.current = normalitzaLlista(instantania);
    refa();
    setError((e) => (e?.codi === 'llista-invalida' ? null : e));
  }, [refa]);

  /** Una altra llista, o cap: tot torna a començar. */
  const reinicia = useCallback((instantania) => {
    pendents.current = [];
    if (valida(instantania)) {
      confirmada.current = normalitzaLlista(instantania);
      posa(confirmada.current);
      setError(null);
    } else {
      confirmada.current = null;
      posa(null);
      setError({ codi: 'llista-invalida' });
    }
  }, [posa]);

  useEffect(() => {
    muntat.current = true;
    return () => { muntat.current = false; };
  }, []);

  /** El canal en viu: la guarda d'id, de revisions i anti-eco. */
  const rebutRemot = useCallback((remota) => {
    if (!valida(remota)) return;
    const base = confirmada.current;
    if (!base) return reinicia(remota);
    if (remota.id !== base.id) return;
    const ressoEnVol = remota.darrerClientInstanceId === clientInstanceId && pendents.current.length > 0;
    if (ressoEnVol) return;
    const triada = triaInstantania(base, remota, {});
    if (triada !== base) confirma(triada);
  }, [clientInstanceId, confirma, reinicia]);

  /* La prop: la primera ja és l'estat inicial; una d'altra llista (o cap) reinicia. */
  const darreraEntrada = useRef(llistaEntrada);
  useEffect(() => {
    if (llistaEntrada === darreraEntrada.current) return;
    darreraEntrada.current = llistaEntrada;
    if (!valida(llistaEntrada) || llistaEntrada.id !== confirmada.current?.id) reinicia(llistaEntrada);
    else rebutRemot(llistaEntrada);
  }, [llistaEntrada, rebutRemot, reinicia]);

  const fes = useCallback((accio) => {
    const anterior = actual.current;
    if (!anterior) return { ok: false, error: { codi: 'llista-invalida' } };
    const ara = (typeof rellotge === 'function' ? rellotge() : new Date()).toISOString();
    const ids = [];
    const resultat = aplicaAccio(anterior, accio, { actor, ara, nouId: repetidor(ids, generaId) });
    if (!resultat.ok) {
      setError(resultat.error);
      return resultat;
    }
    comptadorDeTocs.current += 1;
    const toc = { num: comptadorDeTocs.current, accio, actor, ara, ids, llistaId: anterior.id };
    pendents.current = [...pendents.current, toc];
    const nova = { ...resultat.llista, darrerClientInstanceId: clientInstanceId };
    posa(nova);
    setError(null);
    const treu = () => { pendents.current = pendents.current.filter((p) => p !== toc); };
    const viu = () => muntat.current && confirmada.current?.id === toc.llistaId;
    if (typeof onMuta !== 'function') {
      /* Sense port, el toc ja és la veritat (l'espècimen, les proves). */
      treu();
      confirmada.current = nova;
      return { ok: true, llista: nova };
    }
    Promise.resolve()
      .then(() => onMuta({ accio, llista: nova, revisioBase: anterior.revisio, clientInstanceId }))
      .then((remota) => {
        if (!viu()) return;
        treu();
        if (valida(remota) && remota.id === toc.llistaId) {
          /* La resposta del servidor al nostre toc mana, tret que ja en tinguem una de més nova. */
          if ((remota.revisio ?? 0) >= (confirmada.current.revisio ?? 0)) confirma(remota);
          else refa();
          return;
        }
        /* Acceptat sense instantània: el toc passa a la base tal com es va aplicar. */
        const r = aplicaAccio(confirmada.current, accio, { actor, ara, nouId: repetidor(ids, generaId) });
        if (r.ok) confirmada.current = r.llista;
        refa();
      })
      .catch((motiu) => {
        if (!viu()) return;
        treu();
        refa();
        setError(errorDe(motiu));
      });
    return { ok: true, llista: nova };
  }, [actor, clientInstanceId, confirma, generaId, onMuta, posa, refa, rellotge]);

  const netejaError = useCallback(() => setError(null), []);
  const resum = useMemo(() => (llista ? resumDe(llista, actor) : null), [llista, actor]);

  return { llista, resum, fes, rebutRemot, error, netejaError, clientInstanceId };
}
