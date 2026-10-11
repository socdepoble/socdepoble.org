/**
 * SegonFactor.jsx — el segon factor (TOTP) del superadmin.
 * Onada 11 (261010; prompt 261010_1730, tasca 2) · Requeriment del Mestre
 * (261010_1140 §2): el segon factor «s'ha de resoldre i programar al client»
 * amb una aplicació d'autenticació, el panell ha de ser «altament usable»,
 * accessible des del perfil del superadministrador, i «cap administrador pot
 * quedar atrapat o expulsat de la consola». private.es_superadmin() exigix
 * aal2 (migració 2610061448): sense el segon factor confirmat en ESTA sessió
 * el servidor rebutja tot el que faça el Tauler.
 *
 * Es pinta a dos llocs amb el mateix codi: la columna del mig del Tauler quan
 * la sessió és aal1 (AdminSection.jsx) i «El compte» del Perfil (DetallAjust,
 * acció 'segon-factor'). Només parla amb el port (capacitat 'segonFactor',
 * contracte.js) i només peces de Pedra Seca.
 *
 * Estats (per este ordre):
 *   · sense la capacitat → ho diu, cap crida;
 *   · carregant la llista de factors; error de la llista, amb reintent;
 *   · inscripció en marxa → el QR, la clau a mà, el camp del codi i «Confirma»;
 *   · cap factor verificat → explicació i «Activa el segon factor»;
 *   · factor verificat i sessió aal1 → el codi i «Confirma amb l'autenticador»;
 *   · factor verificat i sessió aal2 → «Segon factor actiu» i «Retira el segon
 *     factor», darrere d'una confirmació (DialegConfirmacio destructiu).
 *
 * Els errors arriben del port amb un `code` de CODI_SEGON_FACTOR i la vista
 * pinta la frase de MISSATGE_SEGON_FACTOR; cap text del proveïdor
 * d'autenticació arriba a la pantalla. Honestedat: este client no té codis
 * de recuperació, i es diu.
 */
import { useEffect, useRef, useState } from 'react';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { Alerta, Boto, Camp, CampText, Carregant, DialegConfirmacio, EstatBuit, Insignia } from '../../components/PedraSeca/index.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { inscriuFactor, llistaFactors, reptaFactor, retiraFactor, teCapacitat, verificaFactor } from '../../data/backendPort.js';
import { CODI_SEGON_FACTOR, MISSATGE_SEGON_FACTOR, esBackendInabastable } from '../../data/errorsBackend.js';

/* El nom amb què el factor s'inscriu al servidor d'autenticació (friendly_name). */
export const NOM_FACTOR = 'Autenticador del Mestre';
/* Les xifres d'un codi TOTP, i la mida (en píxels CSS) de la imatge del QR. */
export const XIFRES_CODI = 6;
const MIDA_QR = 200;

const TEXT_RECUPERACIO = 'Si perds l’autenticador, este client no té codis de recuperació: cal demanar a l’equip que retire el factor des del servidor d’autenticació.';
const TEXT_PISTA = 'Val qualsevol aplicació d’autenticació: Google Authenticator, Aegis, FreeOTP…';
const TEXT_SERVIDOR_INABASTABLE = 'No s’ha pogut contactar amb el servidor. Comprova la connexió i torna-ho a provar.';

const esCancel = (error) => error?.name === 'AbortError';

/* El port, si en sap ('segonFactor'); sense la capacitat, o amb un mock parcial
   del port a les proves, null i cap crida. El mateix blindatge que els membres
   d'una organització (PerfilContext.membresDelPort). */
function portDeSegonFactor() {
  try {
    if (!teCapacitat('segonFactor')) return null;
    const metodes = [llistaFactors, inscriuFactor, reptaFactor, verificaFactor, retiraFactor];
    if (!metodes.every((metode) => typeof metode === 'function')) return null;
    return { llista: llistaFactors, inscriu: inscriuFactor, repta: reptaFactor, verifica: verificaFactor, retira: retiraFactor };
  } catch {
    return null;
  }
}

/* La frase de CODI_SEGON_FACTOR del `code` de l'error; sense un codi conegut,
   la del servidor inabastable o la genèrica. Mai el text del proveïdor. */
function textDError(error) {
  const code = error?.code;
  if (typeof code === 'string' && Object.hasOwn(MISSATGE_SEGON_FACTOR, code)) return MISSATGE_SEGON_FACTOR[code];
  if (esBackendInabastable(error)) return TEXT_SERVIDOR_INABASTABLE;
  return MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.DESCONEGUT];
}

/* Només xifres, i com a molt les del codi: el camp no accepta res més. */
const nomesXifres = (text) => String(text ?? '').replace(/\D/g, '').slice(0, XIFRES_CODI);

export function SegonFactor() {
  const { nivell = null } = useSession();
  const [port] = useState(portDeSegonFactor);
  const [factors, setFactors] = useState({ fase: 'carregant', llista: [], error: null });
  const [versio, setVersio] = useState(0);
  /* La inscripció en marxa: { id, qr, secret, uri } d'inscriuFactor. */
  const [inscripcio, setInscripcio] = useState(null);
  const [codi, setCodi] = useState('');
  const [ocupat, setOcupat] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const [confirmaRetirada, setConfirmaRetirada] = useState(false);

  /* Guarda de doble enviament (síncrona) i de desmuntatge (una resposta
     tardana no escriu en un component mort). */
  const ocupatRef = useRef(false);
  const viu = useRef(true);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);

  /* La llista de factors: en muntar-se i després de cada canvi (versio). */
  useEffect(() => {
    if (!port) return undefined;
    let viva = true;
    setFactors({ fase: 'carregant', llista: [], error: null });
    Promise.resolve()
      .then(() => port.llista())
      .then((llista) => {
        if (viva) setFactors({ fase: 'llest', llista: Array.isArray(llista) ? llista : [], error: null });
      })
      .catch((error) => {
        if (viva && !esCancel(error)) setFactors({ fase: 'error', llista: [], error: textDError(error) });
      });
    return () => { viva = false; };
  }, [port, versio]);

  const recarrega = () => setVersio((v) => v + 1);
  const verificats = factors.llista.filter((factor) => factor.estat === 'verificat');
  const pendents = factors.llista.filter((factor) => factor.estat !== 'verificat');
  const actiu = verificats.length > 0;

  /* Una operació a la vegada: la guarda, el «Treballant…» i el missatge. */
  async function opera(clau, feina) {
    if (ocupatRef.current) return;
    ocupatRef.current = true;
    setOcupat(clau);
    setMissatge(null);
    try {
      const exit = await feina();
      if (viu.current && exit) setMissatge({ tipus: 'exit', text: exit });
    } catch (error) {
      if (viu.current && !esCancel(error)) setMissatge({ tipus: 'error', text: textDError(error) });
    } finally {
      ocupatRef.current = false;
      if (viu.current) setOcupat(null);
    }
  }

  /* Una inscripció deixada a mitges una altra vegada queda al servidor com a
     factor pendent amb el mateix nom, i la nova xocaria amb ell (nom repetit):
     es retiren abans, sense fer soroll si no es pot (l'error de veres, si n'hi
     ha, el dirà la inscripció). */
  const activa = () => opera('activa', async () => {
    for (const pendent of pendents) {
      await Promise.resolve().then(() => port.retira(pendent.id)).catch(() => null);
    }
    const nova = await port.inscriu(NOM_FACTOR);
    if (viu.current) {
      setInscripcio(nova);
      setCodi('');
    }
    return null;
  });

  /* Cancel·lar la inscripció: el factor pendent es retira del servidor si es
     pot; si no, la pròxima «Activa» ho farà. */
  const cancellaInscripcio = () => {
    const pendent = inscripcio;
    setInscripcio(null);
    setCodi('');
    setMissatge(null);
    if (pendent?.id) Promise.resolve().then(() => port.retira(pendent.id)).catch(() => null);
  };

  /* El codi del repte: de la inscripció en marxa, o del factor ja verificat
     (la sessió aal1 que l'ha de confirmar). repta + verifica; verifica desa la
     sessió nova (aal2) i avisa: `nivell` canvia des del context. */
  function confirma(event) {
    event.preventDefault();
    const factorId = inscripcio?.id ?? verificats[0]?.id ?? null;
    const net = nomesXifres(codi);
    if (net.length !== XIFRES_CODI) {
      setMissatge({ tipus: 'error', text: `Escriu les ${XIFRES_CODI} xifres que mostra l’aplicació d’autenticació.` });
      return undefined;
    }
    if (!factorId) return undefined;
    return opera('confirma', async () => {
      const { repteId } = await port.repta(factorId);
      await port.verifica({ factorId, repteId, codi: net });
      if (!viu.current) return null;
      setInscripcio(null);
      setCodi('');
      recarrega();
      return 'Segon factor confirmat: esta sessió ja pot administrar.';
    });
  }

  /* La confirmació es tanca abans d'esperar el servidor: el missatge naix fora
     del <dialog> modal (amb ell obert quedaria inert i el lector no l'anunciaria). */
  const retira = () => {
    setConfirmaRetirada(false);
    return opera('retira', async () => {
      for (const factor of verificats) await port.retira(factor.id);
      if (!viu.current) return null;
      recarrega();
      return 'Segon factor retirat. Per a tornar a administrar caldrà activar-ne un altre.';
    });
  };

  const blocMissatge = missatge ? (
    <p className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'} role={missatge.tipus === 'exit' ? 'status' : 'alert'}>
      {missatge.text}
    </p>
  ) : null;

  const formulariCodi = (etiquetaBoto) => (
    <form className="sdp-segon-factor__formulari" onSubmit={confirma} noValidate>
      <Camp etiqueta="Codi de l’aplicació d’autenticació" ajuda={`${XIFRES_CODI} xifres; l’aplicació en mostra un de nou cada 30 segons.`}>
        <CampText className="sdp-segon-factor__codi" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*"
          maxLength={XIFRES_CODI} value={codi} onChange={(e) => setCodi(nomesXifres(e.target.value))} disabled={Boolean(ocupat)} />
      </Camp>
      <div className="sdp-alerta__accions">
        <Boto varietat="primari" tipus="submit" disabled={Boolean(ocupat)} carregant={ocupat === 'confirma'}>{etiquetaBoto}</Boto>
        {inscripcio ? <Boto varietat="fantasma" onClick={cancellaInscripcio} disabled={Boolean(ocupat)}>Cancel·la</Boto> : null}
      </div>
    </form>
  );

  let contingut;
  if (!port) {
    contingut = (
      <Alerta to="info" viva={false} titol="Segon factor no disponible">
        {MISSATGE_SEGON_FACTOR[CODI_SEGON_FACTOR.NO_DISPONIBLE]}
      </Alerta>
    );
  } else if (factors.fase === 'carregant') {
    contingut = <Carregant etiqueta="Comprovant el segon factor…" />;
  } else if (factors.fase === 'error') {
    contingut = (
      <Alerta to="error" titol="No s’ha pogut comprovar el segon factor" accions={<Boto onClick={recarrega}>Torna-ho a provar</Boto>}>
        {factors.error}
      </Alerta>
    );
  } else if (inscripcio) {
    contingut = (
      <div className="sdp-segon-factor__inscripcio">
        <p>{`Escaneja este codi QR amb l’aplicació d’autenticació i escriu davall el codi de ${XIFRES_CODI} xifres que et mostra.`}</p>
        <div className="sdp-segon-factor__qr">
          {inscripcio.qr
            ? <img src={inscripcio.qr} alt="Codi QR per a l’aplicació d’autenticació" width={MIDA_QR} height={MIDA_QR} />
            : <p className="sdp-camp__ajuda">El servidor no ha tornat cap codi QR: escriu la clau a mà.</p>}
        </div>
        <p className="sdp-camp__ajuda">{TEXT_PISTA}</p>
        <p>Si no pots escanejar-lo, escriu esta clau a mà: <code className="sdp-segon-factor__secret">{inscripcio.secret}</code></p>
        {formulariCodi('Confirma')}
      </div>
    );
  } else if (!actiu) {
    contingut = (
      <EstatBuit icona={ShieldOff} titol="Sense segon factor"
        accio={<Boto varietat="primari" onClick={activa} disabled={Boolean(ocupat)} carregant={ocupat === 'activa'}>Activa el segon factor</Boto>}>
        <p>{`El servidor només deixa administrar amb un segon factor confirmat: una aplicació d’autenticació al mòbil que dona un codi de ${XIFRES_CODI} xifres.`}</p>
        <p>{TEXT_RECUPERACIO}</p>
      </EstatBuit>
    );
  } else if (nivell !== 'aal2') {
    contingut = (
      <div className="sdp-segon-factor__confirmacio">
        <Alerta to="avis" viva={false} titol="Confirma el segon factor en esta sessió">
          {`Ja tens l’autenticador «${verificats[0].nom || NOM_FACTOR}». Escriu el codi que mostra ara per a poder administrar des d’esta sessió.`}
        </Alerta>
        {formulariCodi('Confirma amb l’autenticador')}
      </div>
    );
  } else {
    const factor = verificats[0];
    /* `creat` és additiu al contracte Factor (encara no el porta el port, D0):
       si arriba, la data; si no, res inventat. */
    const { date } = dataHoraDeBarra({ creat: factor.creat });
    contingut = (
      <div className="sdp-segon-factor__actiu">
        <p>
          <Insignia to="exit"><ShieldCheck size={16} aria-hidden="true" focusable="false" />Segon factor actiu</Insignia>
        </p>
        <p>{`${factor.nom || NOM_FACTOR}${date ? `, actiu des del ${date}` : ''}. Esta sessió ja pot administrar.`}</p>
        <p className="sdp-camp__ajuda">{TEXT_RECUPERACIO}</p>
        <div className="sdp-alerta__accions">
          <Boto varietat="perill" onClick={() => setConfirmaRetirada(true)} disabled={Boolean(ocupat)} carregant={ocupat === 'retira'}>
            Retira el segon factor
          </Boto>
        </div>
      </div>
    );
  }

  return (
    <section className="sdp-segon-factor" aria-label="Segon factor">
      {blocMissatge}
      {contingut}
      <DialegConfirmacio
        obert={confirmaRetirada}
        onTanca={() => setConfirmaRetirada(false)}
        onConfirma={retira}
        titol="Retirar el segon factor?"
        descripcio="Sense ell, esta sessió i les següents no podran administrar fins que n’actives un altre. Si ja no tens l’autenticador, retira’l ara que encara pots."
        etiquetaConfirma="Retira"
        destructiu
      />
    </section>
  );
}

export default SegonFactor;
