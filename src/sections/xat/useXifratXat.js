/** Connexió de RAM del decorador al mateix àmbit confirmat per XatContext. */
import { useCallback, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { getBackendImplementation } from '../../data/backendPort.js';
import { serveiXifratXat } from '../../data/xifratXat.js';
import { clausDelContextXat } from '../../data/xifratXatContext.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { ESTAT_OBLIT_XAT, escoltaOblitXat, estatOblitXat, reintentaOblitXat } from '../../data/xifratXatEixida.js';

/* P1-12 pas 17 (D-09) · Amb la bandera apagada, ni subscripció ni lectura. */
const senseSubscripcio = () => () => {};
const senseEstat = () => null;
const senseReintent = async () => null;
const reintentaSenseArguments = () => reintentaOblitXat();

/**
 * P1-12 pas 17 (D-09) · L'estat de l'oblit del xat en eixir: { estat, pendents,
 * quanMs } (estat 'oblidat' o 'OBLIT_FALLIT') o null, i `reintenta()`, que torna
 * l'estat agregat de després. Viu fora de la sessió (la persona ja ha eixit), i
 * per això no depén de l'àmbit. La instantània del mòdul és estable
 * (useSyncExternalStore). Bandera apagada: null i un reintent que no fa res.
 */
export function useOblitXat() {
  const actiu = E2EE_ACTIU_PER_DEFECTE === true;
  const estat = useSyncExternalStore(
    actiu ? escoltaOblitXat : senseSubscripcio,
    actiu ? estatOblitXat : senseEstat,
    actiu ? estatOblitXat : senseEstat
  );
  const oblit = useMemo(() => (estat ? Object.freeze({
    estat: estat.estat,
    pendents: Object.freeze(Array.isArray(estat.pendents) ? [...estat.pendents] : []),
    quanMs: Number.isFinite(estat.quanMs) ? estat.quanMs : null
  }) : null), [estat]);
  return useMemo(() => Object.freeze({
    oblit,
    fallit: oblit?.estat === ESTAT_OBLIT_XAT.fallit,
    reintenta: actiu ? reintentaSenseArguments : senseReintent
  }), [oblit, actiu]);
}

export default function useXifratXat({ config, joId, ambitEstable }) {
  // Flag compilat, mai rebut de configura() ni d'un amfitrió.
  const claus = E2EE_ACTIU_PER_DEFECTE ? clausDelContextXat({ config, joId, ambitEstable }) : null;
  const identitat = claus?.clauIdentitat ?? null;
  const ambit = claus?.ambitEstable ?? null;
  // Objecte estable amb JWT; un A→B→A crea una connexió A nova.
  const connexio = useMemo(() => ({ ambit, identitat }), [ambit, identitat]);
  const confirmada = useRef(null);
  const serveiActual = useRef(null);
  const sincronitza = useCallback(() => {
    if (!E2EE_ACTIU_PER_DEFECTE || confirmada.current !== connexio) return null;
    const servei = serveiXifratXat(getBackendImplementation());
    if (serveiActual.current && serveiActual.current !== servei) serveiActual.current.oblidaClausXat();
    serveiActual.current = servei;
    if (!servei) return null;
    if (connexio.identitat && connexio.ambit) servei.fixaAmbit(connexio.ambit, connexio.identitat);
    else servei.oblidaClausXat();
    return servei;
  }, [connexio]);
  useLayoutEffect(() => {
    confirmada.current = connexio;
    sincronitza();
    return () => { if (confirmada.current === connexio) confirmada.current = null; };
  }, [connexio, sincronitza]);
  useLayoutEffect(() => () => {
    // StrictMode pot reconnectar; destroy del backend usa desmunta().
    serveiActual.current?.oblidaClausXat();
    serveiActual.current = null;
  }, []);
  // També després de hostReady: el backend pot haver-se instal·lat tard.
  return sincronitza;
}
