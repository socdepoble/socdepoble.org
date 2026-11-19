/**
 * DialegDenunciaContingut.jsx — Procediment estructurat d'avís i retirada
 * diligent (LSSI Art. 16 / DSA Art. 16 · P0-114 Escut 2 · Onada R32.13).
 *
 * Component modular diferible (`React.lazy`) fora de Pedra Seca (C1 no hi mana),
 * construït íntegrament sobre peces de Pedra Seca (`Dialeg`, `GrupOpcions`,
 * `Camp`, `AreaText`, `Alerta`, `Boto`).
 *
 * Cobrix els 6 estats canònics de la interfície:
 *  · Permission · Quan el recurs és propi, institucional o no denunciable.
 *  · Empty      · Sense motiu estructurat seleccionat (amb orientació explícita).
 *  · Loading    · Mentre es registra la notificació.
 *  · Success    · Confirmada pel servidor de Sóc de Poble (rebut validat; cap termini promés).
 *  · Partial    · Guardada a la cua local auditada quan el remot no està disponible.
 *  · Error      · Fallada de validació o límit temporal, conservant l'esborrany.
 */
import { useId, useState } from 'react';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { omple } from '../../config/moderacio.js';
import { Alerta, AreaText, Boto, Camp, Dialeg, GrupOpcions } from '../PedraSeca/index.js';
import { useModeracio } from '../PedraSeca/hooks/moderacioDePoble.js';
import {
  MAXIM_DETALL_DENUNCIA_LSSI,
  MOTIUS_DENUNCIA_LSSI,
  desaDenunciaEnCuaLocal,
  textosDenunciaContingut
} from './i18nDenunciaContingut.js';
import { enviaDenunciaLssi, nouIdOperacioDenuncia } from './enviaDenunciaLssi.js';

const TIPUS_PERFIL = new Set(['persona', 'entitat']);

function useDarrerObjectiu(objectiu) {
  const [darrer, setDarrer] = useState(objectiu ?? null);
  if (objectiu && objectiu !== darrer) setDarrer(objectiu);
  return objectiu ?? darrer;
}

function useCadaObertura(obert, reinicia) {
  const [obertAbans, setObertAbans] = useState(obert);
  if (obert !== obertAbans) {
    setObertAbans(obert);
    if (obert) reinicia();
  }
}

function missatgeErrorCodi(codi, tx) {
  if (codi === 'motiu-invalid') return tx.errorMotiu;
  if (codi === 'detall-massa-llarg') return tx.errorDetallLlarg;
  if (codi === 'limit') return tx.errorLimit;
  if (codi === 'objectiu-invalid') return tx.errorObjectiu;
  return tx.errorGeneral;
}

export function DialegDenunciaContingut({
  obert = false,
  objectiu = null,
  idioma,
  config = null,
  permisDenuncia = true,
  onTanca,
  onEnvia = null
}) {
  const ui = useUIStateOpcional();
  const moderacio = useModeracio();
  const llengua = idioma || ui?.llenguaDelText || ui?.language || 'ca';
  const tx = textosDenunciaContingut(llengua);

  const o = useDarrerObjectiu(objectiu);
  const [motiu, setMotiu] = useState(null);
  const [detall, setDetall] = useState('');
  const [ocupat, setOcupat] = useState(false);
  const [resultat, setResultat] = useState(null); // { estat: 'servidor' | 'parcial', repetida: boolean }
  const [errorCodi, setErrorCodi] = useState(null);
  const idResultat = useId();

  useCadaObertura(obert, () => {
    setMotiu(null);
    setDetall('');
    setOcupat(false);
    setResultat(null);
    setErrorCodi(null);
  });

  const esDenegat = permisDenuncia === false
    || o?.propietari === true
    || o?.projecte === true
    || !o?.id
    || !o?.tipus;

  const tanca = (motiuTancament, info) => {
    if (ocupat && !info?.forcat) return;
    onTanca?.(motiuTancament);
  };

  const canviaMotiu = (nouMotiu) => {
    setMotiu(nouMotiu);
    if (errorCodi === 'motiu-invalid') setErrorCodi(null);
  };

  const canviaDetall = (event) => {
    const valor = event.target.value;
    setDetall(valor);
    if (errorCodi === 'detall-massa-llarg' && valor.trim().length <= MAXIM_DETALL_DENUNCIA_LSSI) {
      setErrorCodi(null);
    }
  };

  const envia = async () => {
    if (ocupat || esDenegat) return;
    if (!motiu || !MOTIUS_DENUNCIA_LSSI.includes(motiu)) {
      setErrorCodi('motiu-invalid');
      return;
    }
    if (detall.trim().length > MAXIM_DETALL_DENUNCIA_LSSI) {
      setErrorCodi('detall-massa-llarg');
      return;
    }

    setOcupat(true);
    setErrorCodi(null);

    try {
      const avis = {
        tipus: o.tipus,
        recursId: String(o.id),
        titol: o.titol || o.nom || '',
        motiu,
        detall
      };
      /* Costura R32.14 · L'avís es desa a la cua d'este dispositiu ABANS del
         primer intent, amb un UUID d'operació estable que cada replay del
         mateix text reutilitza (el servidor diligent el deduplica). */
      const previ = desaDenunciaEnCuaLocal({
        ...avis,
        estatSincronitzacio: 'cua-local',
        operacioId: nouIdOperacioDenuncia()
      });
      const operacioId = previ.entrada.operacioId;

      let confirmatServidor = false;
      let repetidaRemota = false;

      if (typeof onEnvia === 'function') {
        const resposta = await onEnvia({
          tipus: o.tipus,
          recursId: String(o.id),
          titol: avis.titol,
          motiu,
          detall: detall.trim(),
          operacioId
        });
        confirmatServidor = resposta?.parcial !== true;
        repetidaRemota = resposta?.repetida === true;
      } else {
        /* Diligent (publicacions amb UUID) → port de moderació → cua local.
           Només hi ha «servidor» si el servidor ho ha confirmat (Llei 0). */
        const resposta = await enviaDenunciaLssi({
          objectiu: o,
          motiu,
          detall,
          operacioId,
          config: config ?? ui?.externalConfig ?? null
        });
        confirmatServidor = resposta.servidor === true;
        repetidaRemota = resposta.repetida === true;
      }

      if (confirmatServidor) {
        desaDenunciaEnCuaLocal({ ...avis, estatSincronitzacio: 'servidor' });
      } else if (previ.desada === false) {
        /* Gauntlet R32.14 · Ni el servidor ni este navegador l'han guardada: cap «desada en este dispositiu». */
        setErrorCodi('no-desada');
        return;
      }

      setResultat({
        estat: confirmatServidor ? 'servidor' : 'parcial',
        /* Gauntlet R32.14 · «Ja hi havia una notificació teua pendent» només ho diu el servidor (la cua d'este
           dispositiu no és de cap compte). */
        repetida: repetidaRemota
      });
    } catch (err) {
      setErrorCodi(err?.code || 'desconegut');
    } finally {
      setOcupat(false);
    }
  };

  const esPerfil = TIPUS_PERFIL.has(o?.tipus);
  const titol = esPerfil ? tx.titolPerfil : tx.titolContingut;
  const nomAutor = String(o?.autor?.nom || o?.titol || o?.nom || '').trim();
  const potBloquejarTambe = Boolean(
    moderacio?.potBloquejar &&
    moderacio?.demanaBloqueig &&
    o?.bloquejable === true &&
    nomAutor
  );

  const opcions = MOTIUS_DENUNCIA_LSSI.map((clau) => ({
    valor: clau,
    etiqueta: tx.motius[clau].etiqueta,
    ajuda: tx.motius[clau].ajuda
  }));

  let accions;
  if (esDenegat || resultat) {
    accions = (
      <>
        {resultat && potBloquejarTambe ? (
          <Boto
            varietat="secundari"
            onClick={() => {
              onTanca?.('bloqueja');
              moderacio.demanaBloqueig(o);
            }}
          >
            {omple(tx.bloquejaTambe, { nom: nomAutor })}
          </Boto>
        ) : null}
        <Boto
          key="tanca"
          varietat="primari"
          autoFocus
          aria-describedby={idResultat}
          onClick={() => onTanca?.('fet')}
        >
          {tx.tanca}
        </Boto>
      </>
    );
  } else {
    accions = (
      <>
        <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={ocupat}>
          {tx.cancela}
        </Boto>
        <Boto key="envia" varietat="primari" onClick={envia} carregant={ocupat}>
          {ocupat ? tx.carregant : tx.envia}
        </Boto>
      </>
    );
  }

  return (
    <Dialeg
      obert={obert}
      onTanca={tanca}
      titol={titol}
      descripcio={tx.descripcio}
      mida="m"
      tancaEnVel={!ocupat}
      accions={accions}
    >
      {esDenegat ? (
        <div id={idResultat} data-estat-denuncia="permission">
          <Alerta to="info" viva={false}>
            {tx.permisDenegat}
          </Alerta>
        </div>
      ) : resultat ? (
        <div id={idResultat} data-estat-denuncia={resultat.estat === 'servidor' ? 'success' : 'partial'}>
          <Alerta to={resultat.estat === 'servidor' ? 'exit' : 'avis'} viva={false}>
            {resultat.estat === 'parcial'
              ? tx.parcialCuaLocal
              : (resultat.repetida ? tx.exitRepetida : tx.exitServidor)}
          </Alerta>
        </div>
      ) : (
        <div data-estat-denuncia={ocupat ? 'loading' : (errorCodi ? 'error' : (motiu ? 'ready' : 'empty'))}>
          <GrupOpcions
            llegenda={tx.llegendaMotius}
            valor={motiu}
            onCanvi={canviaMotiu}
            disabled={ocupat}
            opcions={opcions}
          />
          {!motiu && !errorCodi ? (
            <p className="sdp-camp__ajuda">{tx.estatBuitAjuda}</p>
          ) : null}
          <Camp
            etiqueta={tx.detallEtiqueta}
            ajuda={tx.detallAjuda}
            error={errorCodi === 'detall-massa-llarg' ? tx.errorDetallLlarg : undefined}
          >
            <AreaText
              files={3}
              maxLength={MAXIM_DETALL_DENUNCIA_LSSI + 20}
              value={detall}
              disabled={ocupat}
              onChange={canviaDetall}
            />
          </Camp>
          {errorCodi ? (
            <Alerta to="error">
              {missatgeErrorCodi(errorCodi, tx)}
            </Alerta>
          ) : null}
        </div>
      )}
    </Dialeg>
  );
}

export default DialegDenunciaContingut;
