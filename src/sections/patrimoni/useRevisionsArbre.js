import { useEffect, useRef, useState } from 'react';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { backendScope } from '../../config/backendConfig.js';
import { desaRevisioPatrimoni, esborraRevisioPatrimoni, getRuntimeDataMode,
  llistaRevisionsPatrimoni, teCapacitat } from '../../data/backendPort.js';
import { capturaEdicioRevisioPatrimoni } from '../../data/revisionsPatrimoni.js';

const CONFIG_BUIDA = Object.freeze({});
const FILES_BUIDES = Object.freeze([]);
const avortada = () => new DOMException('La fitxa o la sessió ha canviat.', 'AbortError');
function filesDelArbre(files, entitatSlug) {
  if (!Array.isArray(files) || files.length > 100) throw new TypeError('Resposta de campanyes invàlida.');
  const ids = new Set();
  const anys = new Set();
  return files.map(fila => {
    const neta = capturaEdicioRevisioPatrimoni(fila, 1);
    if (neta.entitatTipus !== 'arbre' || neta.entitatSlug !== entitatSlug) throw new TypeError('La campanya pertany a una altra peça.');
    if (ids.has(neta.id) || anys.has(neta.campanyaAny)) throw new TypeError('La resposta conté campanyes duplicades.');
    ids.add(neta.id); anys.add(neta.campanyaAny);
    return neta;
  });
}

export function useRevisionsArbre(entitatSlug) {
  const config = useUIStateOpcional()?.externalConfig ?? CONFIG_BUIDA;
  const sessio = useSessioOpcional();
  const autoritzat = sessio?.estat === 'dins' && Boolean(sessio?.currentUser?.id);
  const key = JSON.stringify([backendScope(config), sessio?.currentUser?.id ?? null, entitatSlug, autoritzat]);
  const scope = useRef(key);
  scope.current = key;
  const connexio = useRef(null);
  const [estat, setEstat] = useState({ key: null, files: FILES_BUIDES, fase: 'carregant', error: null });
  let disponible = false;
  let mode = null;
  try {
    disponible = teCapacitat('revisionsPatrimoni');
    mode = getRuntimeDataMode(config);
  } catch { /* Un adaptador encara absent es mostra com a no disponible. */ }

  useEffect(() => {
    const controller = new AbortController();
    const actual = { key, controller, ocupat: disponible };
    connexio.current = actual;
    setEstat({ key, files: FILES_BUIDES, fase: disponible ? 'carregant' : 'no-disponible', error: null });
    if (disponible) {
      llistaRevisionsPatrimoni({ entitatTipus: 'arbre', entitatSlug: entitatSlug, limit: 100 },
        { ...config, signal: controller.signal }).then(files => {
        if (controller.signal.aborted || scope.current !== key) return;
        setEstat({ key, files: filesDelArbre(files, entitatSlug), cursorAny: files.at(-1)?.campanyaAny ?? null,
          mes: files.length === 100, fase: 'llest', error: null });
      }).catch(error => {
        if (controller.signal.aborted || scope.current !== key) return;
        setEstat({ key, files: FILES_BUIDES, fase: 'error', error });
      }).finally(() => { actual.ocupat = false; });
    }
    return () => { controller.abort(); if (connexio.current === actual) connexio.current = null; };
  }, [entitatSlug, config, disponible, key]);

  async function escriu(entrada, esBaixa) {
    const actual = connexio.current;
    if (!actual || actual.key !== key || scope.current !== key || actual.controller.signal.aborted) throw avortada();
    if (!autoritzat || !disponible) throw new Error('Cal una sessió autoritzada en un node amb revisions de patrimoni.');
    if (actual.ocupat) throw new Error('Hi ha una operació de campanya en curs.');
    actual.ocupat = true;
    try {
      const input = { ...entrada, entitatTipus: 'arbre', entitatSlug: entitatSlug };
      const opcions = { ...config, signal: actual.controller.signal };
      const resultat = esBaixa ? await esborraRevisioPatrimoni(input, opcions) : await desaRevisioPatrimoni(input, opcions);
      if (actual.controller.signal.aborted || scope.current !== key) throw avortada();
      const fila = esBaixa ? null : filesDelArbre([resultat], entitatSlug)[0];
      setEstat(previ => {
        if (previ.key !== key) return previ;
        const files = previ.files.filter(item => item.campanyaAny !== entrada.campanyaAny);
        if (fila) files.push(fila);
        return { key, files: files.sort((a, b) => b.campanyaAny - a.campanyaAny),
          cursorAny: previ.cursorAny, mes: previ.mes, fase: 'llest', error: null };
      });
      return resultat;
    } finally { actual.ocupat = false; }
  }

  async function anteriors() {
    const actual = connexio.current;
    if (!actual || actual.key !== key || actual.ocupat || !estat.mes || !estat.files.length) return;
    actual.ocupat = true;
    setEstat(previ => ({ ...previ, fase: 'carregant-mes', error: null }));
    try {
      const abansAny = estat.cursorAny;
      const files = await llistaRevisionsPatrimoni({ entitatTipus: 'arbre', entitatSlug: entitatSlug, limit: 100, abansAny },
        { ...config, signal: actual.controller.signal });
      const netes = filesDelArbre(files, entitatSlug);
      if (actual.controller.signal.aborted || scope.current !== key) return;
      if (netes.some(fila => fila.campanyaAny >= abansAny)) throw new TypeError('La paginació de campanyes no avança.');
      setEstat(previ => {
        const perAny = new Map(previ.files.map(fila => [fila.campanyaAny, fila]));
        for (const fila of netes) perAny.set(fila.campanyaAny, fila);
        return { key, files: [...perAny.values()].sort((a, b) => b.campanyaAny - a.campanyaAny),
          cursorAny: netes.at(-1)?.campanyaAny ?? null, mes: netes.length === 100, fase: 'llest', error: null };
      });
    } catch (error) {
      if (!actual.controller.signal.aborted && scope.current === key) setEstat(previ => ({ ...previ, fase: 'error', error }));
    } finally { actual.ocupat = false; }
  }

  const visible = estat.key === key ? estat : { files: FILES_BUIDES, fase: 'carregant', error: null };
  return { ...visible, key, autoritzat, disponible, mode, anteriors,
    desa: entrada => escriu(entrada, false), esborra: entrada => escriu(entrada, true) };
}
