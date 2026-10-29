/** Connexió de RAM del decorador al mateix àmbit confirmat per XatContext. */
import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { getBackendImplementation } from '../../data/backendPort.js';
import { serveiXifratXat } from '../../data/xifratXat.js';
import { clausDelContextXat } from '../../data/xifratXatContext.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';

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
