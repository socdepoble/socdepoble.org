/**
 * Aprendre.jsx — Repàs espaiat de la Gestoria en cascada de cinc fases:
 * concepte → imatge per recordar → record sense pista → explicació de la
 * resposta → repàs programat. Una targeta cada vegada.
 *
 * Les targetes noves o oblidades (caixa 0) fan la cascada sencera; les que ja
 * estan en repàs comencen pel record sense pista, perquè el concepte seria la
 * pista. Tot són botons natius amb text; a cada canvi de fase el focus va al
 * títol de la fase. Sense animacions pròpies (prefers-reduced-motion).
 *
 * El progrés és opcional i només local (magatzemProgres.js): «Oblida el meu
 * progrés» l'esborra, i magatzem={null} el limita a la sessió.
 * Proves: props `magatzem` i `ara` (rellotge injectable).
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { BARALLA_GESTORIA } from './baralla.js';
import { CAIXES_PER_DEFECTE, ZONA_HORARIA, estatInicial, pendents, proximRepas, reconcilia, respon } from './leitner.js';
import { creaMagatzemProgres, magatzemProgres } from './magatzemProgres.js';

const FASES = ['Concepte', 'Imatge per recordar', 'Record sense pista', 'Explicació de la resposta', 'Repàs programat'];
const FASE = { concepte: 0, imatge: 1, record: 2, explicacio: 3, programat: 4 };
const ULTIMA_CAIXA = CAIXES_PER_DEFECTE.length - 1;
const araPerDefecte = () => new Date();
const enMs = valor => (valor instanceof Date ? valor.getTime() : valor);

let formatDia = null;
function diaLlegible(ms) {
  formatDia ||= new Intl.DateTimeFormat('ca-ES', { timeZone: ZONA_HORARIA, weekday: 'long', day: 'numeric', month: 'long' });
  return formatDia.format(ms);
}

const durada = dies => (dies === 0 ? 'hui mateix' : dies === 1 ? '1 dia' : `${dies} dies`);
const INTERVALS = CAIXES_PER_DEFECTE.map((dies, caixa) => `caixa ${caixa}: ${durada(dies)}`).join(' · ');

/* Una targeta en repàs (caixa ≥ 1) no torna a ensenyar el concepte. */
const faseInicial = estat => (estat?.caixa > 0 ? FASE.record : FASE.concepte);

function novaSessio(llista, baralla, ara) {
  const estats = Object.fromEntries(llista.map(estat => [estat.cardId, estat]));
  const cua = pendents(llista, baralla, ara).map(pendent => pendent.targeta.id);
  return { estats, cua, fase: faseInicial(estats[cua[0]]) };
}

function etiquetaCaixa(estat) {
  const caixa = estat?.caixa > 0 ? estat.caixa : 0;
  return `Caixa ${caixa} de ${ULTIMA_CAIXA}${estat?.dueAt == null ? ' · nova' : ''}`;
}

export default function Aprendre({ baralla = BARALLA_GESTORIA, magatzem, ara = araPerDefecte }) {
  const desti = useMemo(
    () => (magatzem === null ? creaMagatzemProgres({ idb: null }) : magatzem || magatzemProgres()),
    [magatzem]
  );
  const [llesta, setLlesta] = useState(false);
  const [estats, setEstats] = useState({});
  const [cua, setCua] = useState([]);
  const [fase, setFase] = useState(FASE.concepte);
  const [verdicte, setVerdicte] = useState(null);
  const [programat, setProgramat] = useState(null);
  const [avis, setAvis] = useState(null);
  const [missatge, setMissatge] = useState('');
  const [confirma, setConfirma] = useState(false);
  const [oblidant, setOblidant] = useState(false);
  // Cada canvi de fase el compta: l'efecte de focus el seguix.
  const [pas, setPas] = useState(0);
  const titolFase = useRef(null);
  const idTitol = useId();

  const targetes = useMemo(() => new Map(baralla.targetes.map(targeta => [targeta.id, targeta])), [baralla]);

  useEffect(() => {
    let viu = true;
    setLlesta(false);
    desti.carrega(baralla.id).catch(() => {
      if (viu) setAvis('No s’ha pogut llegir el progrés desat. Comences de zero.');
      return [];
    }).then(desats => {
      if (!viu) return;
      const net = reconcilia(desats, baralla);
      // Una targeta que ha canviat de versió torna a la caixa 0: es desa així.
      for (const estat of net) {
        if (!desats.includes(estat)) desti.desa({ ...estat, barallaId: baralla.id }).catch(() => undefined);
      }
      const sessio = novaSessio(net, baralla, enMs(ara()));
      setEstats(sessio.estats);
      setCua(sessio.cua);
      setFase(sessio.fase);
      setVerdicte(null);
      setProgramat(null);
      setLlesta(true);
    });
    return () => { viu = false; };
  }, [desti, baralla, ara]);

  useEffect(() => {
    if (pas > 0) titolFase.current?.focus();
  }, [pas]);

  const actual = llesta && cua.length ? targetes.get(cua[0]) : null;
  const estatActual = actual ? estats[actual.id] || estatInicial(actual.id, actual.versio) : null;
  // Una targeta no recordada torna al final de la cua d'este mateix repàs.
  const tornaHui = Boolean(programat) && verdicte === false && programat.estat.dueAt <= enMs(ara());
  const quedaran = cua.length - 1 + (tornaHui ? 1 : 0);

  const vesA = seguent => { setFase(seguent); setPas(n => n + 1); };

  function desa(estat) {
    desti.desa({ ...estat, barallaId: baralla.id }).catch(() => {
      setAvis('No s’ha pogut desar el progrés en este dispositiu. Pots continuar, però potser no es recordarà.');
    });
  }

  function contesta(encert) {
    setVerdicte(encert);
    vesA(FASE.explicacio);
  }

  function programa() {
    const nou = respon(estatActual, { encert: verdicte, ara: ara() });
    setEstats(previs => ({ ...previs, [nou.cardId]: nou }));
    setProgramat({ estat: nou, caixaAbans: estatActual.caixa });
    desa(nou);
    vesA(FASE.programat);
  }

  function seguentTargeta() {
    const resta = cua.slice(1);
    if (tornaHui) resta.push(programat.estat.cardId);
    setCua(resta);
    setVerdicte(null);
    setProgramat(null);
    setMissatge('');
    vesA(faseInicial(estats[resta[0]]));
  }

  async function oblida() {
    setOblidant(true);
    try {
      await desti.esborra(baralla.id);
      const sessio = novaSessio([], baralla, enMs(ara()));
      setEstats(sessio.estats);
      setCua(sessio.cua);
      setFase(sessio.fase);
      setVerdicte(null);
      setProgramat(null);
      setAvis(null);
      setMissatge('Progrés oblidat: totes les targetes tornen a ser noves.');
    } catch {
      setAvis('No s’ha pogut esborrar el progrés desat en este dispositiu.');
    } finally {
      setOblidant(false);
      setConfirma(false);
    }
  }

  const proxim = llesta && !actual ? proximRepas(Object.values(estats), baralla, enMs(ara())) : null;

  return (
    <section aria-labelledby={idTitol}>
      <h2 id={idTitol}>{baralla.titol}</h2>
      <Alerta to="info" viva={false}>{baralla.avis}</Alerta>
      <p>
        Repàs per caixes de Leitner: cada targeta viu en una caixa. Si la recordes, puja a la següent i tarda més
        a tornar; si no, torna a la caixa 0 i la repasses hui mateix. Intervals: {INTERVALS}.
      </p>
      {avis ? <Alerta to="avis">{avis}</Alerta> : null}
      <p role="status">{missatge}</p>

      {!llesta ? <p>Carregant el teu progrés…</p> : (
        <>
          <p>Pendents hui: <strong>{cua.length}</strong></p>

          {actual ? (
            <article aria-label={`Targeta: ${actual.titol}`}>
              <p>
                <strong>{actual.titol}</strong> <Insignia to="neutre">{etiquetaCaixa(estatActual)}</Insignia>
              </p>
              <p>Fase {fase + 1} de {FASES.length}</p>
              <h3 ref={titolFase} tabIndex={-1}>{FASES[fase]}</h3>

              {fase === FASE.concepte ? (
                <>
                  <p>{actual.concepte}</p>
                  <Boto varietat="primari" onClick={() => vesA(FASE.imatge)}>Mostra la imatge</Boto>
                </>
              ) : null}

              {fase === FASE.imatge ? (
                <>
                  <p>{actual.concepte}</p>
                  <p><strong>Per a recordar-ho:</strong> {actual.mnemotecnia}</p>
                  <Boto varietat="primari" onClick={() => vesA(FASE.record)}>Següent</Boto>
                </>
              ) : null}

              {fase === FASE.record ? (
                <>
                  <p>Sense mirar res, intenta recordar la resposta.</p>
                  <p><strong>{actual.pregunta}</strong></p>
                  <Boto varietat="primari" onClick={() => contesta(true)}>Ho recorde</Boto>
                  <Boto varietat="secundari" onClick={() => contesta(false)}>No ho recorde</Boto>
                </>
              ) : null}

              {fase === FASE.explicacio ? (
                <>
                  <p><strong>{actual.pregunta}</strong></p>
                  <p>
                    <Insignia to={verdicte ? 'exit' : 'avis'}>
                      {verdicte ? 'Has dit que ho recordaves' : 'Has dit que no ho recordaves'}
                    </Insignia>
                  </p>
                  <p><strong>Resposta:</strong> {actual.resposta}</p>
                  <p>{actual.explicacio}</p>
                  <p>Si la resposta no és la que pensaves, corregix-ho abans de continuar.</p>
                  <Boto varietat="fantasma" onClick={() => setVerdicte(valor => !valor)}>
                    {verdicte ? 'Corregix: no ho recordava' : 'Corregix: sí que ho recordava'}
                  </Boto>
                  <Boto varietat="primari" onClick={programa}>Següent</Boto>
                </>
              ) : null}

              {fase === FASE.programat && programat ? (
                <>
                  <p>
                    <Insignia to={verdicte ? 'exit' : 'avis'}>
                      {!verdicte ? 'Torna a la caixa 0'
                        : programat.caixaAbans >= ULTIMA_CAIXA ? `Es queda a la caixa ${ULTIMA_CAIXA}, la més alta`
                          : `Puja a la caixa ${programat.estat.caixa}`}
                    </Insignia>
                  </p>
                  <p>
                    {tornaHui
                      ? 'Torna a eixir en este mateix repàs, al final de la cua.'
                      : `Tornarà a eixir el ${diaLlegible(programat.estat.dueAt)}.`}
                  </p>
                  <Boto varietat="primari" onClick={seguentTargeta}>
                    {quedaran > 0 ? 'Següent targeta' : 'Acaba el repàs'}
                  </Boto>
                </>
              ) : null}
            </article>
          ) : (
            <>
              <h3 ref={titolFase} tabIndex={-1}>Repàs fet per hui</h3>
              <p>
                {proxim === null
                  ? 'No hi ha cap repàs programat.'
                  : `Pròxim repàs: ${diaLlegible(proxim)}.`}
              </p>
            </>
          )}

          <details>
            <summary>Caixa de cada targeta</summary>
            <ul>
              {baralla.targetes.map(targeta => {
                const estat = estats[targeta.id];
                return (
                  <li key={targeta.id}>
                    {targeta.titol}: {etiquetaCaixa(estat)}
                    {estat?.dueAt != null ? ` · torna el ${diaLlegible(estat.dueAt)}` : ''}
                  </li>
                );
              })}
            </ul>
          </details>

          <p>
            {desti.persistent
              ? 'El progrés es guarda només en este dispositiu, sense dades personals.'
              : 'El progrés només dura esta sessió: no es guarda enlloc.'}
          </p>
          <Boto varietat="secundari" onClick={() => setConfirma(true)}>Oblida el meu progrés</Boto>
        </>
      )}

      <DialegConfirmacio
        obert={confirma}
        destructiu
        carregant={oblidant}
        titol="Vols oblidar el teu progrés?"
        descripcio="S’esborraran les caixes i les dates de repàs d’esta baralla en este dispositiu. Les targetes no canvien."
        etiquetaConfirma="Sí, oblida’l"
        onTanca={() => { if (!oblidant) setConfirma(false); }}
        onConfirma={oblida}
      />
    </section>
  );
}
