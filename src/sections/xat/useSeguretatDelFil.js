/**
 * useSeguretatDelFil.js — L'estat del xifratge d'una conversa i el seu número de
 * seguretat per a la interfície (P1-12 pas 17; pla 261101_1246, T7 · S5; disseny
 * E2EE §4.4 i §13).
 *
 * Darrere de la bandera compilada E2EE_ACTIU_PER_DEFECTE (apagada): sense ella, cap
 * lectura del port ni del servei, i els dos hooks fan sempre els mateixos hooks
 * amb camins que no fan res (el patró de useOblitXat). Conversa.jsx només els
 * importa a través d'una constant plegada per la bandera: apagada, el paquet de
 * producció no en porta res.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getBackendImplementation } from '../../data/backendPort.js';
import { serveiXifratXat } from '../../data/xifratXat.js';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import { estatXifratgeDelFil } from './estatXifratgeFil.js';

/* El servei del decorador del backend instal·lat; null amb la bandera apagada. */
const serveiActual = () => (E2EE_ACTIU_PER_DEFECTE ? serveiXifratXat(getBackendImplementation()) : null);

/** L'estat del xifratge de `fil` ({ estat, visible, potVerificar, text, nota }; estatXifratgeFil.js). */
export function useEstatXifratgeDelFil(fil) {
  const servei = serveiActual();
  return estatXifratgeDelFil({
    actiu: E2EE_ACTIU_PER_DEFECTE === true && Boolean(servei),
    abast: servei?.abastDelFil?.(fil) ?? null,
    entornSegur: servei?.entornSegur?.() === true
  });
}

/** Els estats del número de seguretat. */
export const ESTAT_NUMERO = Object.freeze({
  inactiu: 'inactiu',
  calculant: 'calculant',
  llest: 'llest',
  senseClau: 'sense-clau',
  senseClausPropies: 'sense-claus-propies',
  clauCanviada: 'clau-canviada',
  error: 'error'
});

const INACTIU = Object.freeze({ estat: ESTAT_NUMERO.inactiu, numero: null, kid: null, verificat: false, pendent: false, avis: null, ocupat: false });
const CALCULANT = Object.freeze({ ...INACTIU, estat: ESTAT_NUMERO.calculant });

/* PC155-02 · Un número és d'un abast: el fil, la instància del servei (la del
   backend instal·lat), el backend i el tenant de la config i, si el consumidor
   el passa, l'àmbit de dades del xat (persona i actor: ambitEstable de
   XatContext). Cap validació ací (mai llança, cap regex): només una clau
   estable per a comparar. */
const IDS_DE_SERVEI = new WeakMap();
let seguentIdDeServei = 0;
const idDeServei = (servei) => {
  if (!servei || (typeof servei !== 'object' && typeof servei !== 'function')) return 0;
  if (!IDS_DE_SERVEI.has(servei)) IDS_DE_SERVEI.set(servei, ++seguentIdDeServei);
  return IDS_DE_SERVEI.get(servei);
};
/* Sense retallar: dos textos diferents són dos abasts diferents. */
const textDe = (valor) => (typeof valor === 'string' ? valor : '');

/** La clau d'abast d'un número de seguretat (pura; el servei compta per identitat).
    Mateixa precedència d'àlies que normalizeBackendConfig; el tenant, sense caixa. */
export function clauDAbastDelNumero({ filId = '', servei = null, config = null, ambit = null } = {}) {
  const c = config !== null && typeof config === 'object' ? config : {};
  return JSON.stringify([
    textDe(filId), idDeServei(servei), textDe(c.backendId),
    textDe(c.backend_url ?? c.backendUrl ?? c.supabaseUrl), textDe(c.tenant_id ?? c.tenantId).toLowerCase(),
    textDe(c.dataMode), textDe(ambit)
  ]);
}

/* Un canvi d'àmbit (la persona o l'actor han canviat): el resultat ja no és de ningú. */
const esCanviDAmbit = (error) => error?.code === 'AMBIT_CANVIAT' || error?.codi === 'ambit-canviat';

/* Un error del càlcul → l'estat honest que es mostra. */
function estatDeLError(error) {
  if (error?.codi === 'sense-clau-altre') return ESTAT_NUMERO.senseClau;
  if (error?.codi === 'claus-bloquejades') return ESTAT_NUMERO.senseClausPropies;
  if (error?.codi === 'kid-no-fixat') return ESTAT_NUMERO.clauCanviada;
  return ESTAT_NUMERO.error;
}

/**
 * El número de seguretat del directe `fil` mentre el panell és obert (`obert`) i la
 * conversa en té (`potVerificar`). Torna { estat, numero, kid, verificat, avis,
 * ocupat, marca(verificat) }. `avis`: 'canviat' (la clau ha canviat mentre es
 * mirava: el número ja és el nou) o 'errorMarca'; només acompanya un número
 * llest. Un resultat tardà (panell tancat, conversa canviada, components
 * desmuntats o un àmbit nou) no pinta res: crypto.subtle no s'avorta, i per això
 * es descarta per generació.
 *
 * PC155-02 · `ambit` (opcional): l'àmbit de dades del xat (ambitEstable). El
 * número porta la clau d'abast amb què s'ha calculat; amb el mateix fil.id i un
 * abast nou (tenant, backend, servei, persona o actor), el número i la marca
 * d'abans no es veuen ni un sol render, la promesa en vol es descarta i es
 * torna a calcular amb la config i el servei nous.
 */
export function useNumeroSeguretat({ fil, config = null, obert = false, potVerificar = false, ambit = null } = {}) {
  const filId = typeof fil?.id === 'string' ? fil.id : '';
  const actiu = E2EE_ACTIU_PER_DEFECTE === true && obert === true && potVerificar === true && Boolean(filId);
  /* PC155-02 · El servei només es llig si el panell calcula; la clau en diu l'abast. */
  const servei = actiu ? serveiActual() : null;
  const clau = actiu ? clauDAbastDelNumero({ filId, servei, config, ambit }) : '';
  const [estat, setEstat] = useState(() => ({ ...INACTIU, clau: '' }));
  const generacio = useRef(0);
  const configRef = useRef(config);
  configRef.current = config;
  const serveiRef = useRef(servei);
  serveiRef.current = servei;
  /* La clau del render vigent: una marca d'un render anterior no la satisfà (PC155-02b). */
  const clauRef = useRef(clau);
  clauRef.current = clau;

  /* `kidMostrat`: el kid del número que hi havia quan la marca ha tornat kid-canviat.
     Si el número nou és de la mateixa clau, la clau no ha canviat (és la fixació
     d'este aparell la que no quadra): cap «ha canviat», sinó que no s'ha desat. */
  const calcula = useCallback(async ({ avis = null, kidMostrat = null } = {}) => {
    const servei = serveiRef.current;
    const meua = ++generacio.current;
    if (!servei) {
      setEstat({ ...INACTIU, clau });
      return;
    }
    setEstat({ ...CALCULANT, clau });
    try {
      const resultat = await servei.numeroSeguretat(filId, configRef.current ?? {});
      if (meua !== generacio.current) return;
      const avisFinal = avis === 'canviat' && kidMostrat !== null && resultat.kid === kidMostrat ? 'errorMarca' : avis;
      setEstat({ estat: ESTAT_NUMERO.llest, numero: resultat.numero, kid: resultat.kid, verificat: resultat.verificat === true, pendent: resultat.pendent === true, avis: avisFinal, ocupat: false, clau });
    } catch (error) {
      if (meua !== generacio.current) return;
      /* Un àmbit nou: en silenci, sense número ni roda (el resultat ja no és de ningú).
         Sense número, cap avís: l'estat ja diu què passa. */
      setEstat(esCanviDAmbit(error) ? { ...INACTIU, clau } : { ...INACTIU, estat: estatDeLError(error), clau });
    }
  }, [filId, clau]);

  /* Un abast nou recrea `calcula`: la neteja apuja la generació (la promesa en vol
     es descarta) i es torna a calcular. */
  useEffect(() => {
    if (!actiu) {
      generacio.current += 1;
      setEstat({ ...INACTIU, clau: '' });
      return undefined;
    }
    calcula();
    return () => { generacio.current += 1; };
  }, [actiu, calcula]);

  const marca = useCallback(async (verificat) => {
    const servei = serveiRef.current;
    /* PC155-02b · Només el número de l'abast vigent es pot marcar: una marca
       capturada abans del canvi no envia el kid d'A amb la config de B. */
    if (!servei || estat.clau !== clauRef.current || estat.estat !== ESTAT_NUMERO.llest || estat.ocupat) return;
    const meua = ++generacio.current;
    setEstat((previ) => ({ ...previ, ocupat: true, avis: null }));
    try {
      const resultat = await servei.marcaVerificat(filId, { kid: estat.kid, verificat: verificat === true }, configRef.current ?? {});
      if (meua !== generacio.current) return;
      setEstat({ estat: ESTAT_NUMERO.llest, numero: resultat.numero, kid: resultat.kid, verificat: resultat.verificat === true, pendent: resultat.pendent === true, avis: null, ocupat: false, clau: estat.clau });
    } catch (error) {
      if (meua !== generacio.current) return;
      if (esCanviDAmbit(error)) {
        setEstat({ ...INACTIU, clau: estat.clau });
        return;
      }
      if (error?.codi === 'kid-canviat') {
        /* La clau ha canviat mentre es mirava: cap marca, i el número nou en lloc del vell. */
        await calcula({ avis: 'canviat', kidMostrat: estat.kid });
        return;
      }
      const estatNou = estatDeLError(error);
      if (estatNou !== ESTAT_NUMERO.error) {
        /* Gauntlet T7b-G01 · Mentre es marcava, l'altra persona ha publicat una clau
           sense continuïtat (kid-no-fixat), no en té cap o les pròpies s'han
           bloquejat: el número que es mostrava ja no és de cap clau vàlida. Fora el
           número i el botó, i l'estat honest. */
        setEstat({ ...INACTIU, estat: estatNou, clau: estat.clau });
        return;
      }
      setEstat((previ) => ({ ...previ, ocupat: false, avis: 'errorMarca' }));
    }
  }, [estat, filId, calcula]);

  /* PC155-02 · Derivat en pintar: un número d'un altre abast no es veu ni un sol
     render, encara que l'efecte no haja corregut. La clau no ix del ganxo. */
  const { clau: clauDelNumero, ...vigent } = estat;
  if (clauDelNumero !== clau) return { ...(actiu ? CALCULANT : INACTIU), marca };
  return { ...vigent, marca };
}
