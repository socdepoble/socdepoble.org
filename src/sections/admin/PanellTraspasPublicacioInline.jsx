import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { lligPublicadorsRegistrats, listPublicOrganizations, reverteixTraspasPublicacio, teCapacitat, traspassaPublicacio } from '../../data/backendPort.js';
import { capturaReversioPublicacio, capturaTraspasPublicacio, validaRespostaCopublicacio } from '../../data/copublicacio.js';
import { backendScope } from '../../config/backendConfig.js';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { Alerta, Boto, Camp, Casella, GrupCamps, Selector } from '../../components/PedraSeca/index.js';
import { BarraTaronja } from '../../components/universal/barres/BarraTaronja.jsx';
import { encapcalamentDeTargeta } from '../../components/universal/editorial.js';
import { useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import {
  PUBLICADOR_PER_DEFECTE,
  UUID_SOC_DE_POBLE,
  projectaLecturaCopublicacio
} from '../../components/universal/barres/publicadorsBarraTaronja.js';
import {
  ACTORS_REGISTRATS_BASE,
  RECURSOS_CATALEG_CANONICS,
  UUID_RENTONAR,
  adaptaOrganitzacioRegistrada,
  clauRecursValida,
  esActorSdp,
  generaUuidOperacio,
  missatgeDErrorCopublicacio,
} from './panellTraspasPublicacioModel.js';

/**
 * Onada R19 (T2) · Panell Inline de «Traspàs d'Autoria / Co-Publicació» d'1 Clic.
 *
 * Disseny Pedra Seca i Contracte `copublicacio`:
 * - Zero modals flotants de configuració: quadre editorial inline en el flux de lectura.
 * - Botons d'acció centrats (`justify-content: center`) amb alçària >= 48 px.
 * - Zero `<dl>` de dues columnes: encapçalaments `<h3>`/`<h4>` i paràgrafs nets.
 * - Connectat al contracte `copublicacio` de `backendPort.js` (`lligPublicadorsRegistrats`,
 *   `traspassaPublicacio`, `reverteixTraspasPublicacio`) amb UUID `operacioId` estable
 *   tant durant reintents de traspàs com durant reintents de reversió, exclusió de
 *   `Sóc de Poble` dels `copublicadorsRegistratsIds` quan `mantindreCopublicadorSdp`
 *   ja expressa la intenció, i avís explícit de segon factor AAL2 (`cal-segon-factor`).
 */

const CONFIG_BUIDA = Object.freeze({});

function ambCapacitatCopublicacio() {
  try {
    return teCapacitat('copublicacio') === true;
  } catch {
    return false;
  }
}

export function PanellTraspasPublicacioInline(props) {
  const sessio = useSessioOpcional();
  const config = useUIStateOpcional()?.externalConfig ?? CONFIG_BUIDA;
  if (!props.modeEspecimen) {
    if (!sessio?.esSuperadmin || !sessio.currentUser?.id) return null;
    if (sessio.nivell !== 'aal2') {
      return <Alerta to="avis" titol="Cal confirmar el segon factor de seguretat (AAL2)">
        Confirma el segon factor a «El compte» per a gestionar la publicació.
      </Alerta>;
    }
  }
  const abast = props.modeEspecimen ? 'especimen' : [backendScope(config), sessio.currentUser.id, sessio.generacio];
  return <EditorTraspasPublicacioInline
    key={JSON.stringify([abast, props.recursTipusInicial, props.recursIdInicial])}
    {...props}
    config={config}
  />;
}

function EditorTraspasPublicacioInline({
  recursTipusInicial = 'pagina',
  recursIdInicial = 'receptes',
  actorsRegistratsExtra = [],
  modeEspecimen = false,
  onPublicadorsActualitzats = null,
  onRespostaAutoritativa = null,
  config
}) {
  const idTitol = useId();
  const traductor = useTraductorOpcional();
  const configActual = useRef(config);
  configActual.current = config;

  const clauInicial = `${recursTipusInicial}:${recursIdInicial}`;
  const [clauRecurs, setClauRecurs] = useState(clauRecursValida(clauInicial));
  const recursActual = useMemo(() => {
    const trobat = RECURSOS_CATALEG_CANONICS.find((r) => r.clau === clauRecurs);
    if (trobat) return trobat;
    const [tipus, ...resta] = clauRecurs.split(':');
    const id = resta.join(':') || recursIdInicial;
    return {
      clau: `${tipus || recursTipusInicial}:${id}`,
      recursTipus: tipus || recursTipusInicial,
      recursId: id,
      etiqueta: `${tipus || recursTipusInicial} · ${id}`,
      creditsObra: ''
    };
  }, [clauRecurs, recursTipusInicial, recursIdInicial]);

  const [actorsRemots, setActorsRemots] = useState([]);
  const [estatDirectori, setEstatDirectori] = useState('loading');
  const [intentDirectori, setIntentDirectori] = useState(0);
  const [actorsVigents, setActorsVigents] = useState([]);
  const [intentLectura, setIntentLectura] = useState(0);
  const [versioEsperada, setVersioEsperada] = useState(0);
  const [ultimTraspasId, setUltimTraspasId] = useState(null);
  const [actorPrincipalId, setActorPrincipalId] = useState(modeEspecimen ? UUID_RENTONAR : '');
  const [mantindreCopublicadorSdp, setMantindreCopublicadorSdp] = useState(true);
  const [copublicadorsExtraIds, setCopublicadorsExtraIds] = useState([]);
  const [aplicant, setAplicant] = useState(false);
  const [estatMissatge, setEstatMissatge] = useState(null);
  const [clauLecturaValida, setClauLecturaValida] = useState('');
  const [carregantLectura, setCarregantLectura] = useState(false);

  const clauActivaRef = useRef(recursActual.clau);
  clauActivaRef.current = recursActual.clau;
  const muntatRef = useRef(true);
  useLayoutEffect(() => {
    muntatRef.current = true;
    return () => {
      muntatRef.current = false;
    };
  }, []);

  /* UUID d'operació idempotent per al traspàs: estable durant reintents de la mateixa intenció. */
  const signaturaTraspas = `${recursActual.recursTipus}|${recursActual.recursId}|${actorPrincipalId}|${mantindreCopublicadorSdp ? '1' : '0'}|${copublicadorsExtraIds.join(',')}|v${versioEsperada}`;
  const operacioTraspasRef = useRef({ signatura: '', id: '' });
  const obteOperacioTraspasId = useCallback(() => {
    if (operacioTraspasRef.current.signatura !== signaturaTraspas || !operacioTraspasRef.current.id) {
      operacioTraspasRef.current = { signatura: signaturaTraspas, id: generaUuidOperacio() };
    }
    return operacioTraspasRef.current.id;
  }, [signaturaTraspas]);

  /* UUID d'operació idempotent per a la reversió: estable durant reintents i sempre != traspasId. */
  const signaturaReversio = `${recursActual.recursTipus}|${recursActual.recursId}|rev:${ultimTraspasId ?? ''}|v${versioEsperada}`;
  const operacioReversioRef = useRef({ signatura: '', id: '' });
  const obteOperacioReversioId = useCallback(() => {
    if (
      operacioReversioRef.current.signatura !== signaturaReversio
      || !operacioReversioRef.current.id
      || operacioReversioRef.current.id === String(ultimTraspasId ?? '').toLowerCase()
    ) {
      operacioReversioRef.current = {
        signatura: signaturaReversio,
        id: generaUuidOperacio()
      };
    }
    return operacioReversioRef.current.id;
  }, [signaturaReversio, ultimTraspasId]);

  const actorsDisponibles = useMemo(() => {
    const mapa = new Map([[PUBLICADOR_PER_DEFECTE.actorId, PUBLICADOR_PER_DEFECTE]]);
    if (modeEspecimen) {
      for (const base of ACTORS_REGISTRATS_BASE) mapa.set(base.actorId, base);
      for (const extra of actorsRegistratsExtra) {
        const net = adaptaOrganitzacioRegistrada(extra);
        if (net) mapa.set(net.actorId, net);
      }
    }
    for (const remot of [...actorsRemots, ...actorsVigents]) {
      const net = adaptaOrganitzacioRegistrada(remot);
      if (net) mapa.set(net.actorId, net);
    }
    return Array.from(mapa.values());
  }, [modeEspecimen, actorsRegistratsExtra, actorsRemots, actorsVigents]);

  const capacitatActiva = !modeEspecimen && ambCapacitatCopublicacio();
  const actorValid = actorsDisponibles.some(actor => actor.actorId === actorPrincipalId);
  const enCurs = useRef(false);
  const actualitzaEditors = useCallback(lectura => {
    const actors = lectura.publicadorsRegistrats;
    const principal = actors[0]?.actor_id ?? '';
    setVersioEsperada(lectura.versio);
    setActorsVigents(actors);
    setActorPrincipalId(principal);
    setMantindreCopublicadorSdp(actors.length === 0 || esActorSdp(principal)
      || actors.slice(1).some(actor => esActorSdp(actor.actor_id)));
    setCopublicadorsExtraIds(actors.slice(1).filter(actor => !esActorSdp(actor.actor_id)).map(actor => actor.actor_id));
  }, []);

  useEffect(() => {
    if (!capacitatActiva) return undefined;
    const control = new AbortController();
    const configCrida = { ...configActual.current, signal: control.signal };
    setEstatDirectori('loading');
    setActorsRemots([]);
    Promise.resolve()
      .then(() => listPublicOrganizations({}, configCrida))
      .then(files => {
        if (control.signal.aborted) return;
        if (!Array.isArray(files)) throw new Error('El directori no ha tornat una llista.');
        setActorsRemots(files);
        setEstatDirectori('ready');
      })
      .catch(() => {
        if (control.signal.aborted) return;
        setActorsRemots([]);
        setEstatDirectori('error');
      });
    return () => control.abort();
  }, [capacitatActiva, intentDirectori]);

  useEffect(() => {
    if (!capacitatActiva) return undefined;
    const { clau: clauPeticio, recursTipus, recursId } = recursActual;
    const control = new AbortController();
    const configCrida = { ...configActual.current, signal: control.signal };
    const consulta = { recursTipus, recursId };
    setClauLecturaValida('');
    setCarregantLectura(true);
    setVersioEsperada(0);
    setUltimTraspasId(null);
    setActorPrincipalId('');
    setMantindreCopublicadorSdp(true);
    setCopublicadorsExtraIds([]);
    setActorsVigents([]);

    Promise.resolve()
      .then(() => lligPublicadorsRegistrats(consulta, configCrida))
      .then(lectura => {
        if (control.signal.aborted || clauActivaRef.current !== clauPeticio) return;
        actualitzaEditors(validaRespostaCopublicacio(lectura, consulta));
        setClauLecturaValida(clauPeticio);
        setCarregantLectura(false);
      })
      .catch(() => {
        if (control.signal.aborted || clauActivaRef.current !== clauPeticio) return;
        setCarregantLectura(false);
        setEstatMissatge({
          to: 'error',
          titol: 'Error en llegir els publicadors del recurs',
          text: 'S’ha bloquejat el traspàs fins obtindre la lectura autoritativa d’esta fitxa.'
        });
      });

    return () => control.abort();
  }, [capacitatActiva, recursActual, actualitzaEditors, intentLectura]);

  const previsualitzacioPublicadors = useMemo(() => {
    const mapa = new Map(actorsDisponibles.map((a) => [a.actorId, a]));
    const principal = mapa.get(actorPrincipalId) || PUBLICADOR_PER_DEFECTE;
    const resultat = [{ ...principal, rol: 'principal' }];

    if (mantindreCopublicadorSdp && !esActorSdp(principal.actorId)) {
      const sdp = mapa.get(UUID_SOC_DE_POBLE) || PUBLICADOR_PER_DEFECTE;
      resultat.push({ ...sdp, rol: 'copublicador' });
    }
    for (const idExtra of copublicadorsExtraIds) {
      if (idExtra === principal.actorId || esActorSdp(idExtra)) continue;
      const actor = mapa.get(idExtra);
      if (actor) resultat.push({ ...actor, rol: 'copublicador' });
    }
    return resultat;
  }, [actorsDisponibles, actorPrincipalId, mantindreCopublicadorSdp, copublicadorsExtraIds]);

  const opcionsRecursos = RECURSOS_CATALEG_CANONICS.some((r) => r.clau === recursActual.clau)
    ? RECURSOS_CATALEG_CANONICS.map((r) => ({ valor: r.clau, etiqueta: r.etiqueta }))
    : [
        { valor: recursActual.clau, etiqueta: recursActual.etiqueta },
        ...RECURSOS_CATALEG_CANONICS.map((r) => ({ valor: r.clau, etiqueta: r.etiqueta }))
      ];

  const opcionsActors = [
    { valor: '', etiqueta: 'Tria un compte registrat' },
    ...actorsDisponibles.map(actor => ({
      valor: actor.actorId,
      etiqueta: `${actor.name}${actor.town ? ` (${actor.town})` : ''} · ${actor.href}`
    }))
  ];

  const candidatsCopublicadorsExtra = actorsDisponibles.filter(
    (actor) => actor.actorId !== actorPrincipalId && !esActorSdp(actor.actorId)
  );

  const commutaCopublicadorExtra = (actorId) => {
    setCopublicadorsExtraIds((prev) => (
      prev.includes(actorId) ? prev.filter((id) => id !== actorId) : [...prev, actorId]
    ));
  };

  const lecturaBloquejada = !modeEspecimen && (!capacitatActiva || estatDirectori !== 'ready' || carregantLectura || clauLecturaValida !== recursActual.clau);
  const dataPrevisualitzacio = encapcalamentDeTargeta(modeEspecimen ? { date: '2026-11-11T18:00:00' } : null, { t: traductor });

  function simula(revertir) {
    if (revertir) {
      setActorPrincipalId(UUID_SOC_DE_POBLE);
      setMantindreCopublicadorSdp(true);
      setCopublicadorsExtraIds([]);
    }
    setUltimTraspasId(revertir ? null : 'especimen');
    setVersioEsperada(versio => versio + 1);
    setEstatMissatge({ to: 'info', titol: revertir ? 'Traspàs revertit a l’espècimen' : 'Simulació d’espècimen aplicada' });
    onPublicadorsActualitzats?.(revertir ? [PUBLICADOR_PER_DEFECTE] : previsualitzacioPublicadors);
  }

  async function executa(revertir) {
    if (enCurs.current || lecturaBloquejada || (revertir ? !ultimTraspasId : !actorValid)) return;
    if (modeEspecimen) {
      simula(revertir);
      return;
    }
    const { recursTipus, recursId, clau: clauOperada } = recursActual;
    const continua = () => muntatRef.current && clauActivaRef.current === clauOperada;
    enCurs.current = true;
    setAplicant(true);
    setEstatMissatge(null);
    try {
      const recurs = { recursTipus, recursId };
      const base = { ...recurs, versioEsperada };
      const entrada = revertir
        ? capturaReversioPublicacio({ ...base, traspasId: ultimTraspasId, operacioId: obteOperacioReversioId() })
        : capturaTraspasPublicacio({
            ...base,
            nouActorRegistratId: actorPrincipalId,
            mantindreCopublicadorSdp: !esActorSdp(actorPrincipalId) && mantindreCopublicadorSdp,
            copublicadorsRegistratsIds: copublicadorsExtraIds.filter(id => id !== actorPrincipalId && !esActorSdp(id)),
            operacioId: obteOperacioTraspasId()
          });
      const accio = revertir ? reverteixTraspasPublicacio : traspassaPublicacio;
      const valor = await accio(entrada, configActual.current);
      if (!continua()) return;
      const resposta = validaRespostaCopublicacio(valor, recurs, entrada);
      actualitzaEditors(resposta);
      const esVigent = resposta.versioOperacio === resposta.versio;
      setUltimTraspasId(!revertir && esVigent ? resposta.operacioId : null);
      operacioTraspasRef.current = { signatura: '', id: '' };
      operacioReversioRef.current = { signatura: '', id: '' };
      onPublicadorsActualitzats?.(projectaLecturaCopublicacio(resposta));
      onRespostaAutoritativa?.(resposta);
      setEstatMissatge({
        to: 'exit',
        titol: esVigent ? (revertir ? 'Traspàs desfet' : 'Publicació actualitzada') : 'Publicació actualitzada per una operació posterior'
      });
    } catch (error) {
      if (!continua()) return;
      if (error?.code === 'conflicte-versio') {
        setClauLecturaValida('');
        setUltimTraspasId(null);
        setIntentLectura(actual => actual + 1);
      }
      setEstatMissatge(missatgeDErrorCopublicacio(error, revertir ? 'revertir el traspàs' : 'desar el traspàs'));
    } finally {
      enCurs.current = false;
      if (continua()) setAplicant(false);
    }
  }

  return (
    <section className="sdp-traspas-inline" lang="ca" aria-labelledby={idTitol}>
      <header className="sdp-traspas-inline__cap">
        <h3 id={idTitol} className="sdp-traspas-inline__titol">
          Traspàs de publicació i co-publicació registrada
        </h3>
        <p className="sdp-traspas-inline__resum">
          Assigna en un clic quines entitats amb compte registrat real signen la publicació a la Barra Taronja. Els drets d’autor i la llicència de l’obra es mantenen sempre al bloc editorial del document.
        </p>
      </header>

      <Alerta to="info" titol="Llei de la Barra Taronja (només comptes registrats)">
        Les entitats documentals que encara no s’han donat d’alta al padró conserven íntegra la seua autoria i llicència al peu del títol, però no apareixen com a publicadores fins que registren el seu compte oficial.
        {recursActual.creditsObra ? ` Crèdit editorial actual: ${recursActual.creditsObra}.` : ''}
      </Alerta>

      <div className="sdp-traspas-inline__camps">
        <Camp
          etiqueta="Pàgina o catàleg a configurar"
          ajuda={carregantLectura
            ? `Llegint estat autoritatiu de ${recursActual.recursTipus} / ${recursActual.recursId}…`
            : `Recurs seleccionat: ${recursActual.recursTipus} / ${recursActual.recursId} · Versió de lectura: ${versioEsperada}`}
        >
          <Selector
            opcions={opcionsRecursos}
            value={recursActual.clau}
            disabled={aplicant}
            onChange={(e) => {
              const novaClau = e.target.value;
              clauActivaRef.current = novaClau;
              setClauLecturaValida('');
              setAplicant(false);
              setUltimTraspasId(null);
              setEstatMissatge(null);
              setClauRecurs(novaClau);
            }}
          />
        </Camp>

        <Camp
          etiqueta="Entitat o persona registrada titular de la publicació"
          ajuda="El servidor comprova que els comptes triats siguen públics i actius."
        >
          <Selector
            opcions={opcionsActors}
            value={actorPrincipalId}
            disabled={aplicant || lecturaBloquejada}
            onChange={(e) => {
              setActorPrincipalId(e.target.value);
              setEstatMissatge(null);
            }}
          />
        </Camp>

        <GrupCamps llegenda="Modalitat de co-publicació">
          <Casella
            etiqueta="Mantindre Sóc de Poble com a entitat co-publicadora"
            ajuda="Activat: es mostra el mosaic quadrangular compost amb les dues entitats registrades. Desactivat: traspàs complet de publicació a l’entitat triada."
            checked={mantindreCopublicadorSdp}
            disabled={aplicant || lecturaBloquejada || !actorValid || esActorSdp(actorPrincipalId)}
            onChange={(e) => {
              setMantindreCopublicadorSdp(e.target.checked);
              setEstatMissatge(null);
            }}
          />
          {candidatsCopublicadorsExtra.map((actor) => (
            <Casella
              key={actor.actorId}
              etiqueta={`Afegir ${actor.name}${actor.town ? ` (${actor.town})` : ''} com a co-publicadora`}
              ajuda={`Fitxa registrada: ${actor.href}`}
              checked={copublicadorsExtraIds.includes(actor.actorId)}
              disabled={aplicant || lecturaBloquejada || !actorValid}
              onChange={() => {
                commutaCopublicadorExtra(actor.actorId);
                setEstatMissatge(null);
              }}
            />
          ))}
        </GrupCamps>
      </div>

      {!modeEspecimen && !capacitatActiva ? <Alerta to="info">El node encara no oferix la co-publicació registrada.</Alerta> : null}
      {!modeEspecimen && capacitatActiva && estatDirectori === 'error' ? (
        <Alerta to="avis" titol="No s’ha pogut carregar el directori de comptes registrats"
          accions={<Boto disabled={aplicant} onClick={() => setIntentDirectori(intent => intent + 1)}>Torna-ho a provar</Boto>}>
          El traspàs queda bloquejat fins que es puga comprovar la llista. La lectura dels publicadors de la fitxa es conserva separadament.
        </Alerta>
      ) : null}
      <div className="sdp-traspas-inline__previsualitzacio">
        <h4 className="sdp-traspas-inline__subtitol">{modeEspecimen || (!carregantLectura && !lecturaBloquejada && actorValid) ? 'Previsualització de la Barra Taronja' : 'Publicació registrada actual'}</h4>
        <BarraTaronja
          publicadorsRegistrats={modeEspecimen || (!carregantLectura && !lecturaBloquejada && actorValid) ? previsualitzacioPublicadors : actorsVigents}
          etiqueta={modeEspecimen || (!carregantLectura && !lecturaBloquejada && actorValid) ? 'Previsualització de co-publicació registrada' : 'Publicació registrada actual'}
          date={dataPrevisualitzacio.date}
          time={dataPrevisualitzacio.time}
          dateTime={dataPrevisualitzacio.dateTime}
        />
      </div>

      {estatMissatge ? (
        <Alerta to={estatMissatge.to} titol={estatMissatge.titol}>
          {estatMissatge.text}
        </Alerta>
      ) : null}

      <div className="sdp-traspas-inline__accions">
        <Boto varietat="primari" disabled={aplicant || lecturaBloquejada || !actorValid} onClick={() => executa(false)}>
          {aplicant
            ? 'Aplicant configuració…'
            : carregantLectura
              ? 'Llegint fitxa seleccionada…'
              : mantindreCopublicadorSdp && !esActorSdp(actorPrincipalId)
                ? 'Activar co-publicació en 1 clic'
                : 'Aplicar traspàs de publicació en 1 clic'}
        </Boto>
        {ultimTraspasId ? (
          <Boto varietat="secundari" disabled={aplicant || lecturaBloquejada} onClick={() => executa(true)}>
            Desfer l’últim traspàs
          </Boto>
        ) : null}
      </div>
    </section>
  );
}

export default PanellTraspasPublicacioInline;
