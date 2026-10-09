/**
 * useCofre.js — l'estat de la porta del cofre xifrat de la Gestoria.
 *
 * Onada 6, ordre del Mestre (261009): cofre xifrat. El hook no guarda res
 * desxifrat: només l'estat del cofre, l'acció en curs, l'avís de l'última
 * acció (a la seua zona) i, una sola vegada, el codi de recuperació, que
 * s'oblida quan la persona diu que l'ha apuntat o quan el cofre es bloqueja.
 * Si el cofre es bloqueja amb un codi encara sense confirmar (per exemple,
 * 10 minuts apuntant-lo), eixe codi es perd: l'avís ho diu i, en tornar a
 * obrir, `codiSenseConfirmar` demana fer-ne un altre. Només en memòria.
 * El cofre avisa de cada obertura i de cada bloqueig (també l'automàtic); el
 * hook ho escolta i ho diu. Sense `cofre`, en crea un de propi i el tanca
 * (bloqueja) en desmuntar-se. Amb `cofre` (l'únic de l'app, cofreDeLaGestoria),
 * no el tanca: el bloqueja qui munta la vista, en eixir-ne (Historic.jsx).
 * Proves: el cofre, la descàrrega i el rellotge s'injecten.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { creaCofreLocal } from './cofre.js';

const TIPUS_COPIA = 'application/json';

/* Descàrrega amb Blob i un enllaç temporal, com a facturar/useFacturacio.js: res passa per cap servidor. */
function descarregaPerDefecte({ nom, tipus, dades }) {
  const url = URL.createObjectURL(new Blob([dades], { type: tipus || 'application/octet-stream' }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  // Safari necessita que la URL visca un moment després del clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const dos = (n) => String(n).padStart(2, '0');
/** «cofre-gestoria-20261009-0415.json» (hora local), amb `clar` si ix sense xifrar. */
export function nomDeLaCopia(instant, { clar = false } = {}) {
  const d = new Date(instant);
  const marca = `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}-${dos(d.getHours())}${dos(d.getMinutes())}`;
  return `cofre-gestoria-${clar ? 'SENSE-XIFRAR-' : ''}${marca}.json`;
}

const MOTIUS_BLOQUEIG = Object.freeze({
  manual: 'Has bloquejat el cofre.',
  inactivitat: 'El cofre s’ha bloquejat sol després de 10 minuts sense activitat.',
  oculta: 'El cofre s’ha bloquejat sol: la pestanya ha estat amagada més de 5 minuts.',
  pagehide: 'El cofre s’ha bloquejat en eixir de la pàgina.',
  canviat: 'El cofre s’ha bloquejat: ha canviat en una altra pestanya (frase, codi o clau). Torna a obrir-lo.'
});
export const AVIS_CODI_PERDUT = 'El codi de recuperació que es mostrava no s’havia confirmat i s’ha perdut: quan tornes a obrir el cofre, fes-ne un de nou a «Codi de recuperació nou».';

/* Els registres que ja no es podien llegir i s'han deixat com estaven en rotar la clau. */
const ambIllegibles = (text, illegibles) => {
  if (illegibles === 1) return `${text} Atenció: 1 registre ja no es podia llegir (manipulat o malmés) i s’ha deixat com estava.`;
  if (illegibles > 1) return `${text} Atenció: ${illegibles} registres ja no es podien llegir (manipulats o malmesos) i s’han deixat com estaven.`;
  return text;
};

/**
 * @param {{ cofre?: object, descarrega?: Function, rellotge?: () => number }} [opcions]
 */
export function useCofre({ cofre: cofreExtern = null, descarrega = descarregaPerDefecte, rellotge = () => Date.now() } = {}) {
  const [propi] = useState(() => (cofreExtern ? null : creaCofreLocal()));
  const cofre = cofreExtern ?? propi;
  /* Un cofre ja obert (l'únic de l'app, en tornar de la pàgina d'una targeta) es pinta obert de seguida: sense «Comprovant…». */
  const [estat, setEstat] = useState(() => (cofre.obert ? 'obert' : 'carregant'));
  const [ocupat, setOcupat] = useState(null);
  const [avis, setAvis] = useState(null);
  const [codiRecuperacio, setCodiRecuperacio] = useState(null);
  const [codiSenseConfirmar, setCodiSenseConfirmar] = useState(false);
  const codiPendent = useRef(false);
  const viu = useRef(true);

  const refresca = useCallback(async () => {
    try {
      const nou = await cofre.estat();
      if (viu.current) setEstat(nou);
    } catch {
      if (viu.current) setEstat('sense-magatzem');
    }
  }, [cofre]);

  useEffect(() => {
    viu.current = true;
    refresca();
    const deixa = cofre.subscriu(({ estat: nou, motiu }) => {
      if (!viu.current) return;
      setEstat(nou);
      if (nou === 'bloquejat') {
        const perdut = codiPendent.current;
        codiPendent.current = false;
        setCodiRecuperacio(null);
        if (perdut) setCodiSenseConfirmar(true);
        const text = MOTIUS_BLOQUEIG[motiu] ?? 'El cofre s’ha bloquejat.';
        setAvis({ zona: 'porta', to: motiu === 'manual' && !perdut ? 'info' : 'avis', text: perdut ? `${text} ${AVIS_CODI_PERDUT}` : text });
      }
    });
    return () => {
      viu.current = false;
      deixa();
      propi?.tanca();
    };
  }, [cofre, propi, refresca]);

  /* Un codi nou a la pantalla: pendent fins que la persona diu que l'ha apuntat. */
  const mostraCodi = useCallback((codi) => {
    codiPendent.current = true;
    setCodiRecuperacio(codi);
  }, []);

  /* Una acció: marca l'ocupació, buida l'avís, i l'error va a la seua zona. Torna cert si ha anat bé. */
  const executa = useCallback(async (que, zona, accio) => {
    setOcupat(que);
    setAvis(null);
    try {
      await accio();
      return true;
    } catch (error) {
      if (viu.current) setAvis({ zona, to: 'error', text: error?.message ?? String(error), codi: error?.codi ?? null });
      return false;
    } finally {
      if (viu.current) setOcupat(null);
      await refresca();
    }
  }, [refresca]);

  const crea = useCallback((frase) => executa('creant', 'porta', async () => {
    const { codiRecuperacio: codi } = await cofre.creaCofre(frase);
    mostraCodi(codi);
  }), [cofre, executa, mostraCodi]);

  const obre = useCallback((frase) => executa('obrint', 'porta', () => cofre.obreCofre(frase)), [cofre, executa]);

  const recupera = useCallback((codi, nova) => executa('recuperant', 'porta', async () => {
    const { codiRecuperacio: nou, illegibles } = await cofre.obreAmbCodi(codi, nova);
    mostraCodi(nou);
    setAvis({
      zona: 'porta',
      to: illegibles > 0 ? 'avis' : 'exit',
      text: ambIllegibles('Cofre recuperat amb una frase nova i la clau de les dades renovada: el codi usat i la frase d’abans ja no obrin res del que hi ha ara.', illegibles)
    });
  }), [cofre, executa, mostraCodi]);

  /* `rota`: la persona sospita que algú coneix la frase o el codi; es renoven també la clau de les dades i el codi. */
  const canvia = useCallback((actual, nova, rota = false) => executa('canviant', 'frase', async () => {
    const { rotada, codiRecuperacio: nou, illegibles } = await cofre.canviaContrasenya(actual, nova, { rotaClau: rota });
    if (rotada) {
      mostraCodi(nou);
      setAvis({
        zona: 'porta',
        to: illegibles > 0 ? 'avis' : 'exit',
        text: ambIllegibles('Frase de pas, clau de les dades i codi de recuperació renovats: la frase i el codi d’abans ja no obrin res del que hi ha ara.', illegibles)
      });
      return;
    }
    setAvis({
      zona: 'frase',
      to: 'exit',
      text: 'Frase de pas canviada. Les dades no s’han tocat i el codi de recuperació continua valent. Les còpies xifrades fetes abans s’obrin amb la frase d’aleshores.'
    });
  }), [cofre, executa, mostraCodi]);

  const renovaCodi = useCallback((frase) => executa('renovant', 'codi', async () => {
    const { codiRecuperacio: nou, illegibles } = await cofre.renovaCodi(frase);
    mostraCodi(nou);
    setAvis({
      zona: 'porta',
      to: illegibles > 0 ? 'avis' : 'exit',
      text: ambIllegibles('Codi de recuperació i clau de les dades renovats: el codi anterior ja no obri res del que hi ha ara.', illegibles)
    });
  }), [cofre, executa, mostraCodi]);

  const bloqueja = useCallback(() => cofre.bloqueja('manual'), [cofre]);
  const codiApuntat = useCallback(() => {
    codiPendent.current = false;
    setCodiRecuperacio(null);
    setCodiSenseConfirmar(false);
  }, []);
  const tancaAvis = useCallback(() => setAvis(null), []);

  const exporta = useCallback(() => executa('exportant', 'copia', async () => {
    const text = await cofre.exporta();
    const nom = nomDeLaCopia(rellotge());
    descarrega({ nom, tipus: TIPUS_COPIA, dades: new TextEncoder().encode(text) });
    setAvis({ zona: 'copia', to: 'exit', text: `S’ha descarregat «${nom}», xifrada. Guarda-la també fora d’este ordinador.` });
  }), [cofre, executa, descarrega, rellotge]);

  /* `zona`: 'porta' quan es restaura sense cofre, 'copia' dins del cofre obert. */
  const importa = useCallback((text, frase, zona = 'copia') => executa('important', zona, async () => {
    const { restaurat, afegits, conservats } = await cofre.importa(text, frase);
    setAvis({
      zona: restaurat ? 'porta' : 'copia',
      to: 'exit',
      text: restaurat
        ? `Cofre restaurat de la còpia (${afegits} ${afegits === 1 ? 'registre' : 'registres'}) i obert. La frase de pas i el codi de recuperació són els de la còpia.`
        : `Còpia importada: ${afegits} ${afegits === 1 ? 'registre nou' : 'registres nous'}; ${conservats} ja hi eren i no s’han tocat.`
    });
  }), [cofre, executa]);

  const exportaEnClar = useCallback((frase, confirmacio) => executa('exportant-clar', 'clar', async () => {
    const text = await cofre.exportaEnClar(frase, confirmacio);
    const nom = nomDeLaCopia(rellotge(), { clar: true });
    descarrega({ nom, tipus: TIPUS_COPIA, dades: new TextEncoder().encode(text) });
    setAvis({ zona: 'clar', to: 'avis', text: `S’ha descarregat «${nom}» SENSE XIFRAR. Esborra’l quan ja no el necessites.` });
  }), [cofre, executa, descarrega, rellotge]);

  return {
    cofre, estat, ocupat, avis, codiRecuperacio, codiSenseConfirmar,
    crea, obre, recupera, canvia, renovaCodi, bloqueja, codiApuntat, tancaAvis, exporta, importa, exportaEnClar
  };
}
