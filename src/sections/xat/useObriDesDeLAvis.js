/* B8C-6 (marató 261101_2143; Bloc B8, D-B8C-1 i D-B8C-6) · Obrir la conversa
   des d'un avís push, sense que el servei de push sàpia mai el fil.

   L'avís és cec: el worker porta a la ruta neutra (/xat?obri=no-llegits) o,
   si la pàgina ja era al Xat, el registre rep un toc sense cap dada. El destí
   es calcula ací, amb els fils de la sessió ACTUAL (destiDelAvis.js):
     · una sola conversa amb missatges nous → /xat/<id>;
     · més d'una → la llista (/xat);
     · cap → si venia de la ruta, la llista; si era un toc, la persona es
       queda on és.

   Disparadors:
     (i)  la ruta de l'avís, NOMÉS amb la bandera (la constant de build, no
          avisosPushDisponibles(): a la web l'adaptador arriba per import() i,
          en obrir des de l'avís, este hook es munta abans i es perdria el
          toc). Apagada, la ruta només lleva el marcador;
     (ii) un toc del registre (escoltaTocAvisPush, també el pendent).
   Un disparador nou substituïx el vell (la generació).

   Màquina d'estats (ARB-07). Després d'`await xat.recarrega()`, els fils del
   render encara són els vells: el context escriu la seua ref al moment, però
   chatThreads és un derivat que canvia en el pintat següent. Per això el
   destí NO es calcula dins de la promesa:
     'sessio'        → espera la sessió; 'fora' acaba (la llista si venia de
                       la ruta); 'dins' passa a 'recarregant';
     'recarregant'   → recarrega amb un sostre de ESPERA_AVIS_MS des del
                       disparador; true → 'resol'; false, null (una altra
                       càrrega l'ha superada) o el sostre → 'espera-llista',
                       amb la llista d'eixe moment com a referència;
     'resol'         → es resol a l'efecte posterior al pintat on s'ha fixat:
                       eixe pintat ja porta els fils que la recàrrega ha deixat;
     'espera-llista' → es resol quan la llista canvia o quan arriba el sostre.
   Si, mentrestant, la persona ja ha anat a una altra ruta, ha triat ella: el
   disparador s'abandona sense navegar. */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from '../../app/contexts/RouterContext';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { AVISOS_PUSH_XAT_ACTIUS, escoltaTocAvisPush } from '../../config/avisosPushXat.js';
import { destiDelToc, esRutaDeLAvis } from './destiDelAvis.js';
import { useXat } from './XatContext';

/** El sostre de l'espera de la llista fresca: passat, es resol amb el que hi ha. */
export const ESPERA_AVIS_MS = 8000;

const LLISTA = '/xat';
const CAP = Object.freeze([]);

export default function useObriDesDeLAvis() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const sessio = useSessioOpcional();
  const xat = useXat();
  const estatSessio = typeof sessio?.estat === 'string' ? sessio.estat : 'fora';
  const fils = Array.isArray(xat.chatThreads) ? xat.chatThreads : CAP;
  const recarrega = typeof xat.recarrega === 'function' ? xat.recarrega : null;

  const ruta = search ? `${pathname}?${search}` : pathname;

  const [pendent, setPendent] = useState(null);
  const generacio = useRef(0);
  /* La generació que ja ha llançat la seua recàrrega: el doble efecte de
     StrictMode no en fa dues. */
  const llancada = useRef(0);
  /* El que l'última pintada ha vist: la promesa en llig la llista d'eixe
     moment com a referència, mai per a calcular el destí. */
  const filsVius = useRef(fils);
  const recarregaViva = useRef(recarrega);
  const navegaViu = useRef(navigate);
  const rutaViva = useRef(ruta);
  useEffect(() => {
    filsVius.current = fils;
    recarregaViva.current = recarrega;
    navegaViu.current = navigate;
    rutaViva.current = ruta;
  });

  /* (ii) El toc del registre: sense cap dada. El pendent arriba en escoltar. */
  useEffect(() => escoltaTocAvisPush(() => {
    generacio.current += 1;
    setPendent({ gen: generacio.current, origen: 'toc', fase: 'sessio', inici: Date.now(), ruta: rutaViva.current, referencia: null });
  }), []);

  /* (i) La ruta de l'avís. */
  const rutaDeLAvis = esRutaDeLAvis(pathname, search);
  useEffect(() => {
    if (!rutaDeLAvis) return;
    if (!AVISOS_PUSH_XAT_ACTIUS) {
      navegaViu.current(LLISTA, { replace: true });
      return;
    }
    generacio.current += 1;
    setPendent({ gen: generacio.current, origen: 'ruta', fase: 'sessio', inici: Date.now(), ruta, referencia: null });
  }, [rutaDeLAvis, ruta]);

  /* Fase 'sessio' → 'recarregant'. */
  useEffect(() => {
    if (!pendent || pendent.fase !== 'sessio' || estatSessio === 'comprovant') return;
    const { gen, origen, inici } = pendent;
    if (estatSessio !== 'dins') {
      if (origen === 'ruta' && rutaViva.current === pendent.ruta) navegaViu.current(LLISTA, { replace: true });
      setPendent(null);
      return;
    }
    setPendent({ ...pendent, fase: 'recarregant' });
    if (llancada.current === gen) return;
    llancada.current = gen;
    const resta = Math.max(0, inici + ESPERA_AVIS_MS - Date.now());
    let temps;
    const sostre = new Promise((resol) => { temps = globalThis.setTimeout(() => resol(undefined), resta); });
    let carrega;
    try {
      const fn = recarregaViva.current;
      carrega = fn ? Promise.resolve(fn()).catch(() => false) : Promise.resolve(false);
    } catch {
      carrega = Promise.resolve(false);
    }
    Promise.race([carrega, sostre]).then((resultat) => {
      globalThis.clearTimeout(temps);
      if (gen !== generacio.current) return;
      setPendent((actual) => {
        if (!actual || actual.gen !== gen || actual.fase !== 'recarregant') return actual;
        return resultat === true
          ? { ...actual, fase: 'resol' }
          : { ...actual, fase: 'espera-llista', referencia: filsVius.current };
      });
    });
  }, [pendent, estatSessio]);

  /* Resolució: 'resol' de seguida; 'espera-llista' quan la llista canvia o al sostre. */
  useEffect(() => {
    if (!pendent || (pendent.fase !== 'resol' && pendent.fase !== 'espera-llista')) return undefined;
    const resol = (llista) => {
      const { origen } = pendent;
      setPendent(null);
      /* La persona ja és en una altra ruta: ha triat ella. */
      if (rutaViva.current !== pendent.ruta) return;
      /* El destí, sempre amb la sessió d'ara: si ja no hi és, res d'abans. */
      const desti = estatSessio === 'dins' ? destiDelToc(llista) : null;
      if (desti && desti !== rutaViva.current) navegaViu.current(desti, origen === 'ruta' ? { replace: true } : undefined);
      else if (!desti && origen === 'ruta') navegaViu.current(LLISTA, { replace: true });
    };
    const resta = pendent.inici + ESPERA_AVIS_MS - Date.now();
    if (pendent.fase === 'resol' || fils !== pendent.referencia || resta <= 0) {
      resol(fils);
      return undefined;
    }
    const temps = globalThis.setTimeout(() => resol(filsVius.current), resta);
    return () => { globalThis.clearTimeout(temps); };
  }, [pendent, fils, estatSessio]);
}
