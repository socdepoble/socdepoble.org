/**
 * VisibilitatDeLaConnexio.jsx — L'interruptor públic/privat de la connexió que
 * s'acaba de fer, a /connectar (FEDI-23, ordre del Mestre, 261103: «switch
 * públic/privat al Perfil i a /connectar»). El del Perfil és
 * VisibilitatConnexions (profile/ConnexionsPubliques.jsx, Codex); este només
 * governa UNA connexió: la de qui connecta (tu o el barret d'una entitat que
 * administres) amb el destí.
 *
 *   · Capacitat 'connexionsPubliques' del port. Sense, o si el servidor no té
 *     la migració (NO-DISPONIBLE a la lectura), no es pinta res: /connectar
 *     funciona igual.
 *   · Una lectura de preferenciesConnexions del subjecte (la persona pròpia o
 *     una entitat que administra: el servidor ho torna a validar). Només se'n
 *     guarda la visibilitat global i la d'esta connexió: ni la llista ni cap
 *     altra fila van a l'estat.
 *   · La global privada domina (contracte.js, connexionsPubliques): aleshores
 *     no hi ha interruptor, sinó la línia que diu on es canvia. Amb la global
 *     pública, l'interruptor desa la visibilitat d'esta connexió amb
 *     desaVisibilitatConnexions({ …subjecte, visibilitatConnexions, connexio }).
 *   · L'ajuda diu, abans del clic, que l'altra banda també la pot amagar.
 *   · La clau és l'àmbit sencer (backend, sessió, subjecte i destí), com
 *     useFitxaDeConnexio: una resposta d'una clau antiga no es pinta.
 * Tots els textos passen per t(): section.connectar.visibilitat.*.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSession } from '../../app/contexts/SessionContext';
import { Interruptor } from '../../components/PedraSeca/index.js';
import { omple } from '../../config/moderacio.js';
import { entradaSessio } from '../../data/identitat.js';
import { backendScope } from '../../config/backendConfig.js';
import { desaVisibilitatConnexions, preferenciesConnexions, teCapacitat } from '../../data/backendPort.js';
import { connexionsPotserDisponibles, recordaSiNoDisponibles } from './sondaConnexions.js';

/* Un port sense la capacitat (o un mock parcial) no ha de fer caure la vista. */
function teConnexionsPubliques() {
  try {
    return teCapacitat('connexionsPubliques') === true
      && typeof preferenciesConnexions === 'function' && typeof desaVisibilitatConnexions === 'function';
  } catch { return false; }
}

function ambitDelBackend(config) {
  try { return backendScope(config); } catch { return 'backend:invàlid'; }
}

const esDesti = (connexio) => (fila) => fila?.tipus === connexio.tipus && fila.id != null && String(fila.id) === String(connexio.id);

/** De les preferències, només la global i la d'esta connexió (o null si no hi és). Pura. */
export function visibilitatDe(preferencies, connexio) {
  const global = preferencies?.visibilitatConnexions === 'publica' ? 'publica' : 'privada';
  const fila = (Array.isArray(preferencies?.connexions) ? preferencies.connexions : []).find(esDesti(connexio));
  const vincle = fila ? (fila.visibilitatConnexions === 'privada' ? 'privada' : 'publica') : null;
  return { global, vincle };
}

const codiDe = (error) => (typeof error?.code === 'string' && error.code ? error.code : null);

/**
 * `com`: id de l'entitat del barret, o null (la persona de la sessió).
 * `connexio`: { tipus: 'persona' | 'entitat', id } del destí (contacte.seguiment).
 */
export function VisibilitatDeLaConnexio({ com = null, nomCom = '', connexio = null, nom = '', config = {} }) {
  const id = useId();
  const { t } = useUIActions();
  const usuariId = useSession()?.currentUser?.id ?? null;
  const subjecte = com ? { tipus: 'entitat', id: String(com) } : usuariId != null ? { tipus: 'persona', id: String(usuariId) } : null;
  const desti = connexio && ['persona', 'entitat'].includes(connexio.tipus) && connexio.id != null ? { tipus: connexio.tipus, id: String(connexio.id) } : null;
  const entrada = entradaSessio();
  /* Ronda 7 (GLOBAL-06) · Si este backend ja ha dit NO-DISPONIBLE, ni es pregunta (sondaConnexions.js). */
  const clau = teConnexionsPubliques() && connexionsPotserDisponibles(ambitDelBackend(config)) && subjecte && desti
    ? JSON.stringify([ambitDelBackend(config), usuariId == null ? null : String(usuariId), subjecte.tipus, subjecte.id, desti.tipus, desti.id, entrada])
    : null;
  /* { clau, estat: 'llest' | 'error' | 'no-disponible', global, vincle } i { clau, ocupat, error }. */
  const [lectura, setLectura] = useState(null);
  const [accio, setAccio] = useState(null);
  const configRef = useRef(config);
  configRef.current = config;
  const ocupatRef = useRef(null);
  const abastRef = useRef({ clau, generacio: 0 });
  if (abastRef.current.clau !== clau) {
    abastRef.current = { clau, generacio: abastRef.current.generacio + 1 };
    ocupatRef.current = null;
  }
  const generacio = abastRef.current.generacio;
  const viu = useRef(true);
  useEffect(() => {
    viu.current = true;
    return () => {
      viu.current = false;
      abastRef.current = { ...abastRef.current, generacio: abastRef.current.generacio + 1 };
      ocupatRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!clau) return undefined;
    /* El subjecte i el destí, de la mateixa clau: la lectura és sempre la de la clau vigent. */
    const [, , subjecteTipus, subjecteId, destiTipus, destiId] = JSON.parse(clau);
    const generacioLectura = abastRef.current.generacio;
    const controlador = new AbortController();
    const opcio = { ...configRef.current, signal: controlador.signal };
    const encara = () => viu.current && !controlador.signal.aborted
      && abastRef.current.clau === clau && abastRef.current.generacio === generacioLectura
      && entradaSessio() === entrada;
    Promise.resolve()
      .then(() => encara() ? preferenciesConnexions({ tipus: subjecteTipus, id: subjecteId }, opcio) : null)
      .then((preferencies) => {
        if (encara()) setLectura({ clau, generacio: generacioLectura, estat: 'llest', ...visibilitatDe(preferencies, { tipus: destiTipus, id: destiId }) });
      })
      .catch((e) => {
        recordaSiNoDisponibles(JSON.parse(clau)[0], e);
        if (encara() && e?.name !== 'AbortError') setLectura({ clau, generacio: generacioLectura, estat: codiDe(e) === 'NO-DISPONIBLE' ? 'no-disponible' : 'error', global: null, vincle: null });
      });
    return () => controlador.abort();
  }, [clau, entrada]);

  const vigent = lectura?.clau === clau && lectura.generacio === generacio ? lectura : null;
  const accioVigent = accio?.clau === clau && accio.generacio === generacio ? accio : null;
  if (!clau || !vigent || vigent.estat === 'no-disponible') return null;

  const qui = com ? nomCom : '';
  if (vigent.estat === 'error') {
    return <p className="sdp-connectar__ajuda">{t('section.connectar.visibilitat.errorLectura', 'No s’ha pogut llegir si esta connexió es mostra a la fitxa pública.')}</p>;
  }
  if (vigent.global !== 'publica') {
    return (
      <p className="sdp-connectar__ajuda">{com
        ? omple(t('section.connectar.visibilitat.globalPrivadaCom', 'Les connexions de {entitat} són privades: esta no es mostra a la seua fitxa pública. Es canvia a «Visibilitat de les connexions», a la privacitat de l’entitat.'), { entitat: qui })
        : t('section.connectar.visibilitat.globalPrivada', 'Les teues connexions són privades: esta no es mostra a la teua fitxa pública. Es canvia a «Visibilitat de les connexions», a la privacitat del teu Perfil.')}</p>
    );
  }
  /* La fila encara no hi és (una lectura d'abans de connectar): res, fins a la pròxima. */
  if (!vigent.vincle) return null;

  const canvia = async (actiu) => {
    const encara = () => viu.current && abastRef.current.clau === clau
      && abastRef.current.generacio === generacio && entradaSessio() === entrada;
    if (ocupatRef.current || !encara()) return;
    const operacio = {};
    const opcio = { ...configRef.current };
    ocupatRef.current = operacio;
    setAccio({ clau, generacio, ocupat: true, error: false });
    try {
      await desaVisibilitatConnexions({ ...subjecte, visibilitatConnexions: actiu ? 'publica' : 'privada', connexio: desti }, opcio);
      if (!encara()) return;
      const preferencies = await preferenciesConnexions(subjecte, opcio);
      if (!encara()) return;
      setLectura({ clau, generacio, estat: 'llest', ...visibilitatDe(preferencies, desti) });
      setAccio({ clau, generacio, ocupat: false, error: false });
    } catch (e) {
      if (encara()) setAccio(e?.name === 'AbortError' ? null : { clau, generacio, ocupat: false, error: true });
    } finally {
      if (ocupatRef.current === operacio) ocupatRef.current = null;
    }
  };

  /* L'ajuda va abans de l'interruptor: el que l'altra banda pot fer es diu abans del clic. */
  return (
    <>
      <p id={`${id}-ajuda`} className="sdp-connectar__ajuda">
        {omple(t('section.connectar.visibilitat.ajuda', 'Encara que la mostres, no es veurà si {nom} l’amaga per la seua banda.'), { nom })}
      </p>
      <Interruptor
        etiqueta={com
          ? omple(t('section.connectar.visibilitat.interruptorCom', 'Mostrar la connexió amb {nom} a la fitxa pública de {entitat}'), { nom, entitat: qui })
          : omple(t('section.connectar.visibilitat.interruptor', 'Mostrar la connexió amb {nom} a la teua fitxa pública'), { nom })}
        actiu={vigent.vincle === 'publica'} onCanvi={canvia} desactivat={accioVigent?.ocupat === true}
        textosEstat={{ si: t('section.connectar.visibilitat.publica', 'Pública'), no: t('section.connectar.visibilitat.privada', 'Privada') }} />
      {accioVigent?.error ? (
        <p role="status" className="sdp-camp__error">{t('section.connectar.visibilitat.error', 'No s’ha pogut canviar la visibilitat de la connexió. Torna-ho a provar.')}</p>
      ) : null}
    </>
  );
}

export default VisibilitatDeLaConnexio;
