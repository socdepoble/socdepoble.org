/**
 * useSalut.jsx — l'estat de Salut: llig el magatzem, calcula les jornades i
 * oferix les operacions. Les vistes no toquen mai el magatzem directament.
 *
 * Una sola pestanya escriu (Web Locks); la resta queda en lectura i ho diu.
 * Si una altra pestanya canvia alguna cosa, esta ho torna a llegir.
 * Res d'açò ix del dispositiu ni passa per cap consola: els errors es
 * traduïxen a un text per a la persona (textos.js · textError).
 *
 *   <ProveidorSalut magatzem? rellotge? nouId? ofsetDe?> … </ProveidorSalut>
 *   const salut = useSalut();
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { carregaTot, creaMagatzemSalut, desaMeta, importaCopia } from './magatzem.js';
import { creaCopia } from './nucli/copia.js';
import { validaApunt } from './nucli/diccionari.js';
import { alcadesPerData, assignaJornades, dataDe, jornadaDe, momentLocal, ofsetLocal } from './nucli/hores.js';
import { VERSIO_AVIS } from './textos.js';

const SalutContext = createContext(null);
const RELLOTGE = () => new Date();
const NOU_ID = () => globalThis.crypto.randomUUID();

/** La jornada del moment `moment` amb les alçades apuntades i l'hora habitual. */
export function jornadaDelMoment(moment, apunts, persona) {
  const alcades = alcadesPerData(apunts);
  return jornadaDe(moment, alcades.get(dataDe(moment)) ?? persona.horaAlcarHabitual);
}

export function ProveidorSalut({ magatzem: propi, rellotge = RELLOTGE, nouId = NOU_ID, ofsetDe, children }) {
  const [magatzem] = useState(() => propi || creaMagatzemSalut());
  const [estat, setEstat] = useState({ carregat: false, error: null, dades: null });
  const [mode, setMode] = useState(magatzem.mode);
  const [persistent, setPersistent] = useState(magatzem.persistent);
  const viu = useRef(true);

  const recarrega = useCallback(async () => {
    try {
      const dades = await carregaTot(magatzem);
      if (viu.current) setEstat({ carregat: true, error: null, dades });
    } catch (error) {
      if (viu.current) setEstat((abans) => ({ ...abans, carregat: Boolean(abans.dades), error }));
    }
  }, [magatzem]);

  useEffect(() => {
    viu.current = true;
    const desfes = magatzem.subscriu((avis) => {
      if (avis.tipus === 'canvi') recarrega();
      else if (avis.tipus === 'mode') setMode(avis.mode);
      else if (avis.tipus === 'persistent') setPersistent(avis.persistent);
    });
    magatzem.obtinBloqueig().then((nou) => { if (viu.current) setMode(nou); });
    recarrega();
    return () => {
      viu.current = false;
      desfes();
      magatzem.tanca();
    };
  }, [magatzem, recarrega]);

  const dades = estat.dades;
  const persona = dades?.persona;
  const apunts = useMemo(() => (dades ? assignaJornades(dades.apunts, dades.persona) : []), [dades]);
  const jornades = useMemo(() => new Map((dades?.jornades || []).map((jornada) => [jornada.data, jornada])), [dades]);

  const ara = useCallback(() => momentLocal(rellotge()), [rellotge]);
  const ofset = useCallback((moment) => (ofsetDe ? ofsetDe(moment) : ofsetLocal(moment)), [ofsetDe]);

  /* Cada escriptura torna a llegir-ho tot: la font de veritat és el magatzem. */
  const escriu = useCallback(async (fn) => {
    if (magatzem.mode !== 'escriptora') throw Object.assign(new Error('El magatzem encara no permet escriure.'), { codi: 'NOMES_LECTURA' });
    const resultat = await fn();
    await recarrega();
    return resultat;
  }, [magatzem, recarrega]);

  const operacions = useMemo(() => ({
    /** Valida i desa un apunt (nou o editat). Torna { ok, errors, avisos, apunt }. */
    async desaApunt(cru) {
      const marca = rellotge().toISOString();
      const nou = !cru.id;
      const amb = { ...cru, id: cru.id || nouId(), creat: cru.creat || marca, modificat: marca };
      delete amb.jornada;
      const validacio = validaApunt(amb, { ambId: true });
      if (!validacio.ok) return validacio;
      const altres = (dades?.apunts || []).filter((apunt) => apunt.id !== amb.id);
      const [ambJornada] = assignaJornades([validacio.apunt, ...altres], dades?.persona || {});
      await escriu(() => magatzem.actualitza('apunts', amb.id, (actual) => {
        if (nou ? actual : !actual || (cru.modificat && cru.modificat !== actual.modificat)) {
          throw Object.assign(new Error('L’apunt ha canviat en una altra pestanya.'), { codi: 'CONFLICTE' });
        }
        return ambJornada;
      }));
      return { ...validacio, apunt: ambJornada, nou };
    },
    esborraApunt: (id) => escriu(() => magatzem.esborra('apunts', id)),
    marcaJornada: (data, canvis) => escriu(() => magatzem.actualitza('jornades', data,
      (actual) => ({ ...actual, ...canvis, data }))),
    creaPeriode: ({ inici, dies = 3 }) => escriu(async () => {
      const nou = { id: nouId(), inici, dies, estat: 'en-curs' };
      await magatzem.actualitzaBolcat(({ periodes }) => ({
        periodes: [...periodes.map((p) => p.estat === 'en-curs' ? { ...p, estat: 'acabat' } : p), nou]
      }), ['periodes']);
      return nou;
    }),
    acabaPeriode: (id) => escriu(() => magatzem.actualitza('periodes', id, (p) => p ? { ...p, estat: 'acabat' } : undefined)),
    desaValoracio: (valoracio) => escriu(() => magatzem.desa('valoracions', { ...valoracio, id: valoracio.id || nouId() })),
    acceptaAvis: () => escriu(() => desaMeta(magatzem, 'avis', { acceptatA: rellotge().toISOString(), versio: VERSIO_AVIS })),
    desaPersona: (nova) => escriu(() => desaMeta(magatzem, 'persona', nova)),
    descartaAlerta: (clau) => escriu(() => magatzem.actualitza('meta', 'descartades',
      (actual) => ({ clau: 'descartades', valor: [...(actual?.valor || []), clau] }))),
    /**
     * Apaga (true) o torna a encendre (false) un apartat de Salut. Va a la
     * base de Salut, no a les preferències de la plataforma (config/storage.js):
     * el que la família no apunta també diu alguna cosa de la persona.
     */
    apagaInterruptor: (id, apagat) => escriu(() => magatzem.actualitza('meta', 'apagats', (actual) => {
      const altres = (actual?.valor || []).filter((clau) => clau !== id);
      return { clau: 'apagats', valor: apagat ? [...altres, id] : altres };
    })),
    /**
     * La còpia de tot, en text JSON; anota quan s'ha fet. Fer la còpia només
     * llig: si la marca no es pot desar (una pestanya que només mira,
     * NOMES_LECTURA), la còpia es torna igual i el recordatori continua.
     */
    async copia() {
      const text = JSON.stringify(creaCopia(await carregaTot(magatzem), { ara: rellotge() }), null, 2);
      try {
        await escriu(() => desaMeta(magatzem, 'ultimaCopia', rellotge().toISOString()));
      } catch {
        /* Sense marca: la còpia val més que la data de l'última. */
      }
      return text;
    },
    /** Importa dades ja llegides (copia.js · llegixCopia). Torna l'informe. */
    importa: (entrant, modeImportacio) => escriu(() => importaCopia(magatzem, entrant, modeImportacio)),
    esborraTot: () => escriu(() => magatzem.buidaTot()),
    demanaPersistencia: () => magatzem.demanaPersistencia(),
    estatPersistencia: () => magatzem.estatPersistencia()
  }), [dades, magatzem, nouId, rellotge, escriu]);

  const valor = useMemo(() => {
    const moment = ara();
    const avui = persona ? jornadaDelMoment(moment.moment, apunts, persona) : dataDe(moment.moment);
    return {
      carregat: estat.carregat,
      error: estat.error,
      persistent,
      mode,
      nomesLectura: mode === 'lectora',
      persona: persona || {},
      avisAcceptat: Boolean(dades?.avis && dades.avis.versio >= VERSIO_AVIS),
      avis: dades?.avis || null,
      descartades: dades?.descartades || [],
      ultimaCopia: dades?.ultimaCopia || null,
      apagats: dades?.apagats || [],
      apunts,
      jornades,
      periodes: dades?.periodes || [],
      valoracions: dades?.valoracions || [],
      avui,
      ara,
      ofsetDe: ofset,
      ...operacions
    };
  }, [estat, persistent, mode, persona, dades, apunts, jornades, ara, ofset, operacions]);

  return <SalutContext.Provider value={valor}>{children}</SalutContext.Provider>;
}

export function useSalut() {
  const valor = useContext(SalutContext);
  if (!valor) throw new Error('useSalut s’ha de cridar dins de ProveidorSalut');
  return valor;
}
