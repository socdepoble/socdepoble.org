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
import { barallaGestoria, diaLlegibleGestoria, tf, tg } from '../i18nGestoria.js';

const FASES = ['Concepte', 'Imatge per recordar', 'Record sense pista', 'Explicació de la resposta', 'Repàs programat'];
const FASE = { concepte: 0, imatge: 1, record: 2, explicacio: 3, programat: 4 };
const ULTIMA_CAIXA = CAIXES_PER_DEFECTE.length - 1;
const araPerDefecte = () => new Date();
const enMs = valor => (valor instanceof Date ? valor.getTime() : valor);

/* Una targeta en repàs (caixa ≥ 1) no torna a ensenyar el concepte. */
const faseInicial = estat => (estat?.caixa > 0 ? FASE.record : FASE.concepte);

function novaSessio(llista, baralla, ara) {
  const estats = Object.fromEntries(llista.map(estat => [estat.cardId, estat]));
  const cua = pendents(llista, baralla, ara).map(pendent => pendent.targeta.id);
  return { estats, cua, fase: faseInicial(estats[cua[0]]) };
}

function etiquetaCaixa(estat, idioma) {
  const caixa = estat?.caixa > 0 ? estat.caixa : 0;
  return tf(idioma, 'etiquetaCaixa', caixa, ULTIMA_CAIXA, estat?.dueAt == null);
}

export default function Aprendre({ baralla: barallaProp = BARALLA_GESTORIA, magatzem, ara = araPerDefecte, idioma = 'ca' }) {
  const baralla = useMemo(() => barallaGestoria(barallaProp, idioma), [barallaProp, idioma]);
  const intervals = useMemo(
    () => CAIXES_PER_DEFECTE.map((dies, caixa) => tf(idioma, 'intervalCaixa', caixa, dies)).join(' · '),
    [idioma]
  );
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
      <h3 id={idTitol}>{baralla.titol}</h3>
      <Alerta to="info" viva={false}>{baralla.avis}</Alerta>
      <p>{tf(idioma, 'leitnerIntro', intervals)}</p>
      {avis ? <Alerta to="avis">{tg(idioma, avis)}</Alerta> : null}
      <p role="status">{tg(idioma, missatge)}</p>

      {!llesta ? <p>{tg(idioma, 'Carregant el teu progrés…')}</p> : (
        <>
          <p>{tf(idioma, 'pendentsHui')} <strong>{cua.length}</strong></p>

          {actual ? (
            <article aria-label={tf(idioma, 'targetaAria', actual.titol)}>
              <p>
                <strong>{actual.titol}</strong> <Insignia to="neutre">{etiquetaCaixa(estatActual, idioma)}</Insignia>
              </p>
              <p>{tf(idioma, 'faseDe', fase + 1, FASES.length)}</p>
              <h4 ref={titolFase} tabIndex={-1}>{tg(idioma, FASES[fase])}</h4>

              {fase === FASE.concepte ? (
                <>
                  <p>{actual.concepte}</p>
                  <Boto varietat="primari" onClick={() => vesA(FASE.imatge)}>{tg(idioma, 'Mostra la imatge')}</Boto>
                </>
              ) : null}

              {fase === FASE.imatge ? (
                <>
                  <p>{actual.concepte}</p>
                  <p><strong>{tg(idioma, 'Per a recordar-ho:')}</strong> {actual.mnemotecnia}</p>
                  <Boto varietat="primari" onClick={() => vesA(FASE.record)}>{tg(idioma, 'Següent')}</Boto>
                </>
              ) : null}

              {fase === FASE.record ? (
                <>
                  <p>{tg(idioma, 'Sense mirar res, intenta recordar la resposta.')}</p>
                  <p><strong>{actual.pregunta}</strong></p>
                  <Boto varietat="primari" onClick={() => contesta(true)}>{tg(idioma, 'Ho recorde')}</Boto>
                  <Boto varietat="secundari" onClick={() => contesta(false)}>{tg(idioma, 'No ho recorde')}</Boto>
                </>
              ) : null}

              {fase === FASE.explicacio ? (
                <>
                  <p><strong>{actual.pregunta}</strong></p>
                  <p>
                    <Insignia to={verdicte ? 'exit' : 'avis'}>
                      {tg(idioma, verdicte ? 'Has dit que ho recordaves' : 'Has dit que no ho recordaves')}
                    </Insignia>
                  </p>
                  <p><strong>{tg(idioma, 'Resposta:')}</strong> {actual.resposta}</p>
                  <p>{actual.explicacio}</p>
                  <p>{tg(idioma, 'Si la resposta no és la que pensaves, corregix-ho abans de continuar.')}</p>
                  <Boto varietat="fantasma" onClick={() => setVerdicte(valor => !valor)}>
                    {tg(idioma, verdicte ? 'Corregix: no ho recordava' : 'Corregix: sí que ho recordava')}
                  </Boto>
                  <Boto varietat="primari" onClick={programa}>{tg(idioma, 'Següent')}</Boto>
                </>
              ) : null}

              {fase === FASE.programat && programat ? (
                <>
                  <p>
                    <Insignia to={verdicte ? 'exit' : 'avis'}>
                      {!verdicte ? tg(idioma, 'Torna a la caixa 0')
                        : programat.caixaAbans >= ULTIMA_CAIXA ? tf(idioma, 'esQuedaCaixaAlta', ULTIMA_CAIXA)
                          : tf(idioma, 'pujaCaixa', programat.estat.caixa)}
                    </Insignia>
                  </p>
                  <p>
                    {tornaHui
                      ? tg(idioma, 'Torna a eixir en este mateix repàs, al final de la cua.')
                      : tf(idioma, 'tornaraEl', diaLlegibleGestoria(programat.estat.dueAt, idioma, ZONA_HORARIA))}
                  </p>
                  <Boto varietat="primari" onClick={seguentTargeta}>
                    {tg(idioma, quedaran > 0 ? 'Següent targeta' : 'Acaba el repàs')}
                  </Boto>
                </>
              ) : null}
            </article>
          ) : (
            <>
              <h4 ref={titolFase} tabIndex={-1}>{tg(idioma, 'Repàs fet per hui')}</h4>
              <p>
                {proxim === null
                  ? tg(idioma, 'No hi ha cap repàs programat.')
                  : tf(idioma, 'proximRepas', diaLlegibleGestoria(proxim, idioma, ZONA_HORARIA))}
              </p>
            </>
          )}

          <details>
            <summary>{tg(idioma, 'Caixa de cada targeta')}</summary>
            <ul>
              {baralla.targetes.map(targeta => {
                const estat = estats[targeta.id];
                return (
                  <li key={targeta.id}>
                    {targeta.titol}: {etiquetaCaixa(estat, idioma)}
                    {estat?.dueAt != null ? tf(idioma, 'tornaEl', diaLlegibleGestoria(estat.dueAt, idioma, ZONA_HORARIA)) : ''}
                  </li>
                );
              })}
            </ul>
          </details>

          <p>
            {tg(idioma, desti.persistent
              ? 'El progrés es guarda només en este dispositiu, sense dades personals.'
              : 'El progrés només dura esta sessió: no es guarda enlloc.')}
          </p>
          <Boto varietat="secundari" onClick={() => setConfirma(true)}>{tg(idioma, 'Oblida el meu progrés')}</Boto>
        </>
      )}

      <DialegConfirmacio
        obert={confirma}
        destructiu
        carregant={oblidant}
        titol={tg(idioma, 'Vols oblidar el teu progrés?')}
        descripcio={tg(idioma, 'S’esborraran les caixes i les dates de repàs d’esta baralla en este dispositiu. Les targetes no canvien.')}
        etiquetaConfirma={tg(idioma, 'Sí, oblida’l')}
        onTanca={() => { if (!oblidant) setConfirma(false); }}
        onConfirma={oblida}
      />
    </section>
  );
}
