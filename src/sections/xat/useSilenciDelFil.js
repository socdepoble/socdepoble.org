/**
 * useSilenciDelFil.js — L'entrada «Silencia les notificacions» / «Deixa de
 * silenciar» del menú «⋯» de la conversa i el seu diàleg (B8C-5, marató
 * 261101_2143; B8-CLIENT §2.3).
 *
 * Torna { accio, dialeg }:
 *   · accio · { etiqueta, onTria } per a CapcaleraConversa (accioSilenci), o
 *     null si el fil no es pot silenciar. Un fil sense silenci obri el diàleg;
 *     un fil silenciat el desfà directament ('cap'), sense cap diàleg.
 *   · dialeg · les props de DialegSilenci: { obert, onTanca, onConfirma(durada), carregant }.
 * L'avís del resultat va pel toast de sempre (useToast): mai un èxit fals.
 *
 * Defensa (ARB-08): un useXat parcial (proves que el simulen) o el BUIT de fora
 * del proveïdor no porten cap entrada de menú.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useXat } from './XatContext.jsx';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import { TEXTOS_SILENCI, textDelSilenci } from './silenciXat.js';

const tradueix = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);

export function useSilenciDelFil(fil, t, locale = 'ca-ES') {
  const xat = useXat();
  const { showToast } = useToast();
  const [obert, setObert] = useState(false);
  const [carregant, setCarregant] = useState(false);
  const enVol = useRef(false);
  const viu = useRef(true);
  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; };
  }, []);

  const filId = typeof fil?.id === 'string' ? fil.id : '';
  const potSilenciarFil = typeof xat?.potSilenciarFil === 'function' ? xat.potSilenciarFil : null;
  const silenciaFil = typeof xat?.silenciaFil === 'function' ? xat.silenciaFil : null;
  const disponible = Boolean(potSilenciarFil && silenciaFil && filId) && potSilenciarFil(filId) === true;
  const silenciat = fil?.silenciat === true;

  /* Un sol canvi en vol. El diàleg es tanca sempre: un toast no es veuria
     damunt d'un <dialog> modal (capa superior). */
  const executa = useCallback(async (durada) => {
    if (enVol.current || !silenciaFil || !filId) return;
    enVol.current = true;
    setCarregant(true);
    let resultat = null;
    try {
      resultat = await silenciaFil(filId, durada);
    } catch {
      resultat = null;
    } finally {
      enVol.current = false;
      if (viu.current) setCarregant(false);
    }
    if (!viu.current) return;
    setObert(false);
    const estat = resultat?.estat;
    if (estat !== 'fet' && estat !== 'local') {
      showToast(tradueix(t, TEXTOS_SILENCI.error), 'error');
      return;
    }
    if (durada === 'cap') {
      showToast(tradueix(t, TEXTOS_SILENCI.desfet), 'success');
      return;
    }
    /* D-B8C-4 · Sense el servidor, el silenci viu en memòria fins a recarregar: ho diu. */
    if (estat === 'local') {
      showToast(tradueix(t, TEXTOS_SILENCI.nomesLocal));
      return;
    }
    showToast(textDelSilenci(resultat.finsAl ?? null, locale, t), 'success');
  }, [silenciaFil, filId, showToast, t, locale]);

  const obri = useCallback(() => setObert(true), []);
  const desfes = useCallback(() => { executa('cap'); }, [executa]);
  const tanca = useCallback(() => setObert(false), []);

  const accio = disponible
    ? { etiqueta: tradueix(t, silenciat ? TEXTOS_SILENCI.desfes : TEXTOS_SILENCI.menu), onTria: silenciat ? desfes : obri }
    : null;
  return {
    accio,
    dialeg: { obert: disponible && obert, onTanca: tanca, onConfirma: executa, carregant }
  };
}

export default useSilenciDelFil;
