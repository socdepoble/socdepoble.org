/**
 * DialegsModeracio.jsx — Fase D (261020, tasca 2; pla 261020_1300 · App Store
 * 1.2 i Google Play UGC) · Els tres diàlegs de la moderació i el seu
 * amfitrió, que ProveidorModeracio (app/contexts/ModeracioContext.jsx) pinta
 * després dels fills, en este ordre: denúncia, bloqueig i normes. L'ordre
 * importa: «Bloqueja també {nom}» tanca la denúncia i obri el bloqueig en el
 * MATEIX pintat, i els efectes corren en l'ordre de l'arbre (el primer torna
 * el focus a l'obridor i el segon el pren com a seu, a la SPA i a la
 * incrustació).
 *
 *   · DialegDenuncia · el motiu (els quatre de MOTIUS_DENUNCIA, en ràdios) i
 *     un detall opcional de fins a 1.000 caràcters. El resultat es diu dins
 *     del diàleg, mai amb un avís efímer (davall del vel no es veuria): «Hem
 *     rebut la denúncia» o «Ja ens havies avisat», amb «Tanca» enfocat i, si
 *     es pot, «Bloqueja també {nom}». Un error, en línia (role=alert), i el
 *     diàleg continua obert.
 *   · DialegBloqueig · la confirmació destructiva (el focus inicial a
 *     «Cancel·la», Llei de la Por Orgànica). El text d'una entitat no promet
 *     amagar-ne els missatges del xat (crítica 261020, 16).
 *   · DialegNormes · les normes de convivència abans de la primera
 *     publicació. «Accepte i continue» espera la casella; «Ara no», Escape,
 *     el vel i l'enllaç a l'avís legal declinen (l'enllaç tanca abans de
 *     navegar: el diàleg no es queda damunt de /legal).
 * Mentre treballen, ni Escape, ni el vel, ni «Cancel·la» no els tanquen, tret
 * que el navegador ja l'haja tancat pel seu compte (info.forcat).
 * Cada diàleg es munta la primera vegada que s'obri i ja no es desmunta: fins
 * llavors l'app no porta cap <dialog> nou (Llei del Píxel), i després el
 * focus pot tornar a l'obridor en tancar-lo.
 * Fora de Pedra Seca (C1 no hi mana); els textos són a textosModeracio.js.
 */
import { useId, useState } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { Alerta, AreaText, Boto, Camp, Casella, Dialeg, DialegConfirmacio, GrupOpcions } from '../PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../PedraSeca/hooks/useTraductorOpcional.js';
import {
  TEXTOS_ERROR_MODERACIO, TEXTOS_MODERACIO, TEXTOS_MOTIUS, omple, textDErrorDeModeracio
} from '../PedraSeca/organismes/textosModeracio.js';
import { MAXIM_DETALL_DENUNCIA, MOTIUS_DENUNCIA } from '../../data/contracte.js';

const PERFILS = new Set(['persona', 'entitat']);

/* L'últim objectiu que ha arribat: mentre el diàleg es tanca, el proveïdor ja
   el passa a null i el text no ha de canviar davall de la persona. */
function useDarrerObjectiu(objectiu) {
  const [darrer, setDarrer] = useState(objectiu ?? null);
  if (objectiu && objectiu !== darrer) setDarrer(objectiu);
  return objectiu ?? darrer;
}

/* Cada obertura comença de nou (el patró de SelectorVisibilitat: un ajust
   durant el pintat; el <dialog> es queda muntat). */
function useCadaObertura(obert, reinicia) {
  const [obertAbans, setObertAbans] = useState(obert);
  if (obert !== obertAbans) {
    setObertAbans(obert);
    if (obert) reinicia();
  }
}

const nomDe = (objectiu, t) => String(objectiu?.autor?.nom || objectiu?.titol || '').trim()
  || tradueix(t, TEXTOS_MODERACIO.bloquejosSenseNom);

/** El diàleg «Denuncia este contingut». Vegeu la capçalera i ModeracioContext.jsx (el contracte de les props). */
export function DialegDenuncia({ obert = false, objectiu = null, potBloquejarTambe = false, onTanca, onEnvia, onBloqueja }) {
  const t = useTraductorOpcional();
  const o = useDarrerObjectiu(objectiu);
  const [motiu, setMotiu] = useState(null);
  const [detall, setDetall] = useState('');
  const [ocupat, setOcupat] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [error, setError] = useState(null);
  const idResultat = useId();
  useCadaObertura(obert, () => {
    setMotiu(null);
    setDetall('');
    setOcupat(false);
    setResultat(null);
    setError(null);
  });

  const tanca = (motiuTancar, info) => {
    if (ocupat && !info?.forcat) return;
    onTanca?.(motiuTancar);
  };
  const envia = async () => {
    if (ocupat || !motiu) return;
    setOcupat(true);
    setError(null);
    try {
      const rebuda = await onEnvia?.({ motiu, detall: detall.trim() });
      setResultat({ repetida: rebuda?.repetida === true });
    } catch (e) {
      setError(e);
    } finally {
      setOcupat(false);
    }
  };

  const nom = nomDe(o, t);
  const titol = tradueix(t, o?.tipus === 'missatge' ? TEXTOS_MODERACIO.denunciaTitolMissatge
    : PERFILS.has(o?.tipus) ? TEXTOS_MODERACIO.denunciaTitolPersona : TEXTOS_MODERACIO.denunciaTitol);
  const termini = tradueix(t, TEXTOS_MODERACIO.termini);
  const opcions = MOTIUS_DENUNCIA.map((valor) => ({
    valor,
    etiqueta: tradueix(t, TEXTOS_MOTIUS[valor].etiqueta),
    ajuda: tradueix(t, TEXTOS_MOTIUS[valor].ajuda)
  }));

  return (
    <Dialeg obert={obert} onTanca={tanca} titol={titol} descripcio={tradueix(t, TEXTOS_MODERACIO.denunciaDescripcio)}
      mida="m" tancaEnVel={!ocupat}
      accions={resultat ? (
        <>
          {potBloquejarTambe ? (
            <Boto varietat="secundari" onClick={() => onBloqueja?.()}>
              {omple(tradueix(t, TEXTOS_MODERACIO.denunciaBloquejaTambe), { nom })}
            </Boto>
          ) : null}
          {/* Una clau pròpia: és un botó nou (autoFocus), no el d'enviar reaprofitat.
              Fase D (261020, revisió) · el botó enfocat du el resultat com a
              descripció: VoiceOver no anuncia una regió viva que naix amb el
              text ja posat, i el lector diria només «Tanca, botó». */}
          <Boto key="tanca" varietat="primari" autoFocus aria-describedby={idResultat}
            onClick={() => onTanca?.('fet')}>{tradueix(t, TEXTOS_MODERACIO.tanca)}</Boto>
        </>
      ) : (
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={ocupat}>{tradueix(t, TEXTOS_MODERACIO.cancela)}</Boto>
          <Boto key="envia" varietat="primari" onClick={envia} carregant={ocupat} disabled={!motiu}>{tradueix(t, TEXTOS_MODERACIO.denunciaEnvia)}</Boto>
        </>
      )}>
      {resultat ? (
        /* Fase D (261020, revisió) · Alerta no passa l'id: l'embolcall el du.
           Sense regió viva (viva={false}): el lector que sí l'anunciaria en
           inserir-la no el diu dues vegades. */
        <div id={idResultat}>
          <Alerta to="exit" viva={false}>
            {resultat.repetida
              ? tradueix(t, TEXTOS_MODERACIO.denunciaRepetida)
              : omple(tradueix(t, TEXTOS_MODERACIO.denunciaRebuda), { termini })}
          </Alerta>
        </div>
      ) : (
        <>
          <GrupOpcions llegenda={tradueix(t, TEXTOS_MODERACIO.denunciaLlegenda)} valor={motiu} onCanvi={setMotiu}
            disabled={ocupat} opcions={opcions} />
          <Camp etiqueta={tradueix(t, TEXTOS_MODERACIO.detallEtiqueta)} ajuda={tradueix(t, TEXTOS_MODERACIO.detallAjuda)}>
            <AreaText files={3} maxLength={MAXIM_DETALL_DENUNCIA} value={detall} disabled={ocupat}
              onChange={(e) => setDetall(e.target.value)} />
          </Camp>
          {error ? <Alerta to="error">{tradueix(t, textDErrorDeModeracio(error))}</Alerta> : null}
        </>
      )}
    </Dialeg>
  );
}

/** La confirmació «Vols bloquejar {nom}?». onConfirma resol amb el diàleg ja tancat, o rebutja amb el `code`. */
export function DialegBloqueig({ obert = false, objectiu = null, onTanca, onConfirma }) {
  const t = useTraductorOpcional();
  const o = useDarrerObjectiu(objectiu);
  const [ocupat, setOcupat] = useState(false);
  const [error, setError] = useState(null);
  useCadaObertura(obert, () => {
    setOcupat(false);
    setError(null);
  });

  const tanca = (motiu, info) => {
    if (ocupat && !info?.forcat) return;
    onTanca?.(motiu);
  };
  const confirma = async () => {
    if (ocupat) return;
    setOcupat(true);
    setError(null);
    try {
      await onConfirma?.();
    } catch (e) {
      setError(e);
    } finally {
      setOcupat(false);
    }
  };

  const nom = nomDe(o, t);
  const descripcio = tradueix(t, o?.autor?.tipus === 'entitat'
    ? TEXTOS_MODERACIO.bloqueigDescripcioEntitat : TEXTOS_MODERACIO.bloqueigDescripcio);
  return (
    <DialegConfirmacio obert={obert} onTanca={tanca} onConfirma={confirma} destructiu carregant={ocupat}
      titol={omple(tradueix(t, TEXTOS_MODERACIO.bloqueigTitol), { nom })} descripcio={omple(descripcio, { nom })}
      etiquetaConfirma={tradueix(t, TEXTOS_MODERACIO.bloqueigConfirma)} etiquetaCancela={tradueix(t, TEXTOS_MODERACIO.cancela)}>
      <p>{tradueix(t, TEXTOS_MODERACIO.bloqueigDesfer)}</p>
      {error ? <Alerta to="error">{tradueix(t, textDErrorDeModeracio(error))}</Alerta> : null}
    </DialegConfirmacio>
  );
}

/** Les normes de convivència. onTanca(motiu) declina; onAccepta resol amb el diàleg ja tancat, o rebutja amb el `code`. */
export function DialegNormes({ obert = false, onTanca, onAccepta }) {
  const t = useTraductorOpcional();
  const [marcada, setMarcada] = useState(false);
  const [ocupat, setOcupat] = useState(false);
  const [error, setError] = useState(null);
  useCadaObertura(obert, () => {
    setMarcada(false);
    setOcupat(false);
    setError(null);
  });

  const tanca = (motiu, info) => {
    if (ocupat && !info?.forcat) return;
    onTanca?.(motiu);
  };
  const accepta = async () => {
    if (ocupat || !marcada) return;
    setOcupat(true);
    setError(null);
    try {
      await onAccepta?.();
    } catch (e) {
      setError(e);
    } finally {
      setOcupat(false);
    }
  };

  /* Un code conegut diu què passa (la versió, el límit); la resta, «no s'ha
     pogut desar l'acceptació». T2 (261024; Codex C-02) · 'no-disponible' (en
     remot, sense la migració) porta el seu text: sense acceptació desada no
     es publica, i el de les denúncies no tocaria ací. */
  const textError = error?.code === 'no-disponible' ? TEXTOS_MODERACIO.normesNoDisponible
    : error && Object.hasOwn(TEXTOS_ERROR_MODERACIO, error.code) && error.code !== 'desconegut'
      ? textDErrorDeModeracio(error) : TEXTOS_MODERACIO.normesError;
  const termini = tradueix(t, TEXTOS_MODERACIO.termini);
  return (
    <Dialeg obert={obert} onTanca={tanca} titol={tradueix(t, TEXTOS_MODERACIO.normesTitol)}
      descripcio={tradueix(t, TEXTOS_MODERACIO.normesIntro)} mida="m" tancaEnVel={!ocupat}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={ocupat}>{tradueix(t, TEXTOS_MODERACIO.normesAraNo)}</Boto>
          <Boto varietat="primari" onClick={accepta} carregant={ocupat} disabled={!marcada}>{tradueix(t, TEXTOS_MODERACIO.normesContinua)}</Boto>
        </>
      )}>
      <ol className="sdp-normes">
        <li>{tradueix(t, TEXTOS_MODERACIO.normesRespecte)}</li>
        <li>{tradueix(t, TEXTOS_MODERACIO.normesContingut)}</li>
        <li>{tradueix(t, TEXTOS_MODERACIO.normesEnganys)}</li>
        <li>{tradueix(t, TEXTOS_MODERACIO.normesDrets)}</li>
        <li className="sdp-normes__zero">{omple(tradueix(t, TEXTOS_MODERACIO.normesToleranciaZero), { termini })}</li>
      </ol>
      <p>{tradueix(t, TEXTOS_MODERACIO.normesEines)}</p>
      <p>
        <Link to="/legal" onClick={() => { if (!ocupat) onTanca?.('legal'); }}>{tradueix(t, TEXTOS_MODERACIO.normesLegal)}</Link>
      </p>
      <Casella etiqueta={tradueix(t, TEXTOS_MODERACIO.normesAccepte)} checked={marcada} disabled={ocupat}
        onChange={(e) => setMarcada(e.target.checked)} />
      {error ? <Alerta to="error">{tradueix(t, textError)}</Alerta> : null}
    </Dialeg>
  );
}

/* Muntat en obrir-se per primera vegada, i ja no es desmunta. */
function useMuntatEnObrir(obert) {
  const [muntat, setMuntat] = useState(Boolean(obert));
  if (obert && !muntat) setMuntat(true);
  return muntat || Boolean(obert);
}

/**
 * L'amfitrió que ProveidorModeracio rep per la prop `Dialegs`: les props
 * `denuncia`, `bloqueig` i `normes` són les del proveïdor (vegeu la seua
 * capçalera). L'ordre de l'arbre és el de la capçalera d'este fitxer.
 */
export function DialegsModeracio({ denuncia = {}, bloqueig = {}, normes = {} }) {
  const ambDenuncia = useMuntatEnObrir(denuncia.obert);
  const ambBloqueig = useMuntatEnObrir(bloqueig.obert);
  const ambNormes = useMuntatEnObrir(normes.obert);
  return (
    <>
      {ambDenuncia ? <DialegDenuncia {...denuncia} /> : null}
      {ambBloqueig ? <DialegBloqueig {...bloqueig} /> : null}
      {ambNormes ? <DialegNormes {...normes} /> : null}
    </>
  );
}

export default DialegsModeracio;
