import { useEffect, useRef, useState } from 'react';
import { Alerta, AreaText, Boto, Camp } from '../../components/PedraSeca';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { BlocPerfil } from './BlocPerfil.jsx';
import {
  emetActivitatMoveActivityPub, importaPaquetSobiraniaMunicipal,
  verificaEnllacBidireccionalAlsoKnownAs, verificaMigracioActorFep7628,
} from '../../data/federacio/portabilitatFediversity.js';

const text = (clau, reserva) => Object.freeze([`perfil.portabilitat.${clau}`, reserva]);
export const TEXTOS_PORTABILITAT = Object.freeze({
  titol: text('titol', 'Portabilitat federada'),
  explica: text('explica', 'Comprova els perfils del Fedivers i prepara el fitxer de trasllat.'),
  abast: text('abast', 'La comprovació usa els documents que aportes. No consulta els servidors ni comunica cap trasllat.'),
  origen: text('origen', 'Perfil federat d’origen (JSON)'),
  desti: text('desti', 'Perfil federat de destinació (JSON)'),
  ajudaActors: text('ajudaActors', 'Aporta els documents ActivityPub dels dos perfils. Han de declarar-se mútuament a alsoKnownAs i l’origen ha d’apuntar a la destinació amb movedTo.'),
  comprova: text('comprova', 'Comprovar el trasllat'),
  correcte: text('correcte', 'Els enllaços dels documents són coherents. El fitxer Move està preparat localment, pendent de signar i entregar al servidor.'),
  errorActors: text('errorActors', 'No es pot preparar el trasllat. Revisa els identificadors HTTPS, alsoKnownAs i movedTo dels dos perfils.'),
  errorJson: text('errorJson', 'Revisa el JSON: cal un objecte vàlid de menys de 2 MB en cada camp.'),
  move: text('move', 'Fitxer de trasllat Move (JSON)'),
  descarrega: text('descarrega', 'Descarregar el fitxer Move'),
  errorDescarrega: text('errorDescarrega', 'No s’ha pogut preparar la descàrrega. Conserva el JSON que apareix ací.'),
  natiu: text('natiu', 'El JSON preparat està disponible ací per a copiar-lo. La descàrrega del fitxer es fa des del navegador web.'),
  verificaPaquet: text('verificaPaquet', 'Comprovar un paquet municipal signat'),
  paquet: text('paquet', 'Paquet municipal (JSON)'),
  clau: text('clau', 'Clau pública d’origen (JWK)'),
  ajudaClau: text('ajudaClau', 'Usa una clau pública obtinguda d’una font de confiança. No pegues cap clau privada ni confies en una clau només perquè vinga dins del paquet.'),
  botoPaquet: text('botoPaquet', 'Comprovar la signatura del paquet'),
  paquetValid: text('paquetValid', 'La signatura i els resums del paquet són correctes per a la clau pública aportada. Les dades no s’han importat a cap servidor.'),
  paquetInvalid: text('paquetInvalid', 'El paquet no supera la comprovació. Revisa el fitxer original i la clau pública de confiança.'),
  clauPrivada: text('clauPrivada', 'Este camp només admet una clau pública Ed25519. Retira qualsevol material de clau privada.'),
});

const LIMIT_JSON = 2_000_000;
const comJson = value => value ? JSON.stringify(value, null, 2) : '';
const esObjecte = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function llegixObjecte(valor) {
  if (!valor || valor.length > LIMIT_JSON || new TextEncoder().encode(valor).byteLength > LIMIT_JSON) throw new TypeError('json');
  const parsed = JSON.parse(valor);
  if (!esObjecte(parsed)) throw new TypeError('json');
  return parsed;
}

function descarregaMove(move) {
  const url = URL.createObjectURL(new Blob([comJson(move)], { type: 'application/activity+json' }));
  try {
    const enllac = document.createElement('a');
    enllac.href = url;
    enllac.download = 'socdepoble-trasllat-move.json';
    enllac.rel = 'noopener';
    enllac.click();
  } finally {
    // Com la descàrrega existent de Privacitat: Safari necessita un instant.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

/**
 * FEDI-01 · Preparació i comprovació locals, amb el motor real. El port
 * neutral actual no té operacions de Move, de claus federades ni de
 * restauració d'este paquet: no es falsifica cap èxit remot. Tampoc es
 * publica cap clau ni es deriva confiança del fitxer que s'està comprovant.
 * `scopeKey` ha de canviar amb la identitat activa; buida documents i resultats.
 */
export function PortabilitatFederada({ actorOrigen = null, scopeKey = '' }) {
  const t = useTraductorOpcional();
  const tr = nom => tradueix(t, TEXTOS_PORTABILITAT[nom]);
  const [origen, setOrigen] = useState(() => comJson(actorOrigen));
  const [desti, setDesti] = useState('');
  const [move, setMove] = useState(null);
  const [error, setError] = useState(null);
  const [paquet, setPaquet] = useState('');
  const [clau, setClau] = useState('');
  const [prova, setProva] = useState(null);
  const [comprovant, setComprovant] = useState(false);
  const operacio = useRef(0);
  const viu = useRef(false);
  const origenInicial = useRef(actorOrigen);
  origenInicial.current = actorOrigen;
  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; operacio.current += 1; };
  }, []);
  useEffect(() => {
    operacio.current += 1;
    setOrigen(comJson(origenInicial.current)); setDesti(''); setMove(null); setError(null);
    setPaquet(''); setClau(''); setProva(null); setComprovant(false);
  }, [scopeKey]);

  const invalida = () => { setMove(null); setError(null); operacio.current += 1; setProva(null); setComprovant(false); };
  const comprova = event => {
    event.preventDefault();
    setError(null); setMove(null);
    let actorDOrigen;
    let actorDeDesti;
    try { actorDOrigen = llegixObjecte(origen); actorDeDesti = llegixObjecte(desti); }
    catch { setError('errorJson'); return; }
    const enllac = verificaEnllacBidireccionalAlsoKnownAs(actorDOrigen, actorDeDesti);
    if (!enllac.valid) { setError('errorActors'); return; }
    try {
      const preparat = emetActivitatMoveActivityPub({ actorOrigen: actorDOrigen, actorDesti: actorDeDesti, publicatEl: new Date().toISOString() });
      if (!verificaMigracioActorFep7628({ activitatMove: preparat, actorOrigen: actorDOrigen, actorDesti: actorDeDesti }).valid) {
        setError('errorActors'); return;
      }
      setMove(preparat);
    } catch { setError('errorActors'); }
  };

  const comprovaPaquet = async event => {
    event.preventDefault();
    const torn = ++operacio.current;
    setProva(null);
    let document;
    let publicKeyJwk;
    let actorDesti;
    try {
      document = llegixObjecte(paquet); publicKeyJwk = llegixObjecte(clau);
      actorDesti = desti.trim() ? llegixObjecte(desti) : undefined;
    } catch { setProva('errorJson'); return; }
    if (publicKeyJwk.kty !== 'OKP' || publicKeyJwk.crv !== 'Ed25519' || typeof publicKeyJwk.x !== 'string'
      || Object.hasOwn(publicKeyJwk, 'd') || Object.hasOwn(publicKeyJwk, 'secretKeyMultibase') || Object.hasOwn(publicKeyJwk, 'privateKeyJwk')) {
      setClau(''); setProva('clauPrivada'); return;
    }
    setComprovant(true);
    try {
      const resultat = await importaPaquetSobiraniaMunicipal(document, { publicKeyJwk, actorDesti });
      if (viu.current && operacio.current === torn) setProva(resultat.valid ? 'paquetValid' : 'paquetInvalid');
    } catch {
      if (viu.current && operacio.current === torn) setProva('paquetInvalid');
    } finally {
      if (viu.current && operacio.current === torn) setComprovant(false);
    }
  };

  return <BlocPerfil titol={tr('titol')}>
    <p className="perfil-compte__text">{tr('explica')}</p>
    <p className="perfil-compte__text">{tr('abast')}</p>
    <form onSubmit={comprova}>
      <Camp etiqueta={tr('origen')} ajuda={tr('ajudaActors')}>
        <AreaText files={5} maxLength={LIMIT_JSON} spellCheck={false} value={origen}
          onChange={event => { setOrigen(event.target.value); invalida(); }} />
      </Camp>
      <Camp etiqueta={tr('desti')}>
        <AreaText files={5} maxLength={LIMIT_JSON} spellCheck={false} value={desti}
          onChange={event => { setDesti(event.target.value); invalida(); }} />
      </Camp>
      <div className="sdp-alerta__accions perfil-compte__accions">
        <Boto tipus="submit">{tr('comprova')}</Boto>
      </div>
    </form>
    {error ? <Alerta to="error">{tr(error)}</Alerta> : null}
    {move ? <>
      <Alerta to="info">{tr('correcte')}</Alerta>
      <Camp etiqueta={tr('move')}><AreaText files={7} readOnly spellCheck={false} value={comJson(move)} /></Camp>
      {esAppNativa() ? <p className="perfil-compte__text">{tr('natiu')}</p> : <div className="sdp-alerta__accions perfil-compte__accions">
        <Boto onClick={() => { try { descarregaMove(move); } catch { setError('errorDescarrega'); } }}>{tr('descarrega')}</Boto>
      </div>}
    </> : null}
    <details>
      <summary className="sdp-boto sdp-boto--secundari">{tr('verificaPaquet')}</summary>
      <form onSubmit={comprovaPaquet}>
        <Camp etiqueta={tr('paquet')}>
          <AreaText files={6} maxLength={LIMIT_JSON} spellCheck={false} value={paquet}
            onChange={event => { setPaquet(event.target.value); operacio.current += 1; setProva(null); setComprovant(false); }} />
        </Camp>
        <Camp etiqueta={tr('clau')} ajuda={tr('ajudaClau')}>
          <AreaText files={4} maxLength={LIMIT_JSON} spellCheck={false} value={clau}
            onChange={event => { setClau(event.target.value); operacio.current += 1; setProva(null); setComprovant(false); }} />
        </Camp>
        <div className="sdp-alerta__accions perfil-compte__accions">
          <Boto tipus="submit" carregant={comprovant}>{tr('botoPaquet')}</Boto>
        </div>
      </form>
      {prova ? <Alerta to={prova === 'paquetValid' ? 'info' : 'error'}>{tr(prova)}</Alerta> : null}
    </details>
  </BlocPerfil>;
}

export default PortabilitatFederada;
