/**
 * useArxivaDelFil.js — L'entrada «Arxiva la conversa» / «Desarxiva la conversa»
 * del menú «⋯» de la conversa oberta (Onada R22 · T1).
 *
 * Torna { accio, carregant }:
 *   · accio · { etiqueta, onTria } per a CapcaleraConversa (accioArxiva), o
 *     null si el fil no es pot arxivar (actors permanents, visitants o contextos
 *     de prova parcials).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useXat } from './XatContext.jsx';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import { TEXTOS_ARXIVA } from './arxivaXat.js';

const tradueix = (t, [clau, reserva]) => (typeof t === 'function' ? t(clau, reserva) : reserva);

export function useArxivaDelFil(fil, t) {
  const xat = useXat();
  const { showToast } = useToast();
  const [carregant, setCarregant] = useState(false);
  const enVol = useRef(false);
  const viu = useRef(true);

  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; };
  }, []);

  const filId = typeof fil?.id === 'string' ? fil.id : '';
  const potArxivarFil = typeof xat?.potArxivarFil === 'function' ? xat.potArxivarFil : null;
  const arxivaFil = typeof xat?.arxivaFil === 'function' ? xat.arxivaFil : null;
  const disponible = Boolean(potArxivarFil && arxivaFil && filId) && potArxivarFil(filId) === true;
  const arxivat = fil?.arxivat === true;

  const executa = useCallback(async () => {
    if (enVol.current || !arxivaFil || !filId) return;
    const seguent = !arxivat;
    enVol.current = true;
    setCarregant(true);
    let resultat = null;
    try {
      resultat = await arxivaFil(filId, seguent);
    } catch {
      resultat = null;
    } finally {
      enVol.current = false;
      if (viu.current) setCarregant(false);
    }
    if (!viu.current) return;
    const estat = resultat?.estat;
    if (estat !== 'fet' && estat !== 'local') {
      showToast(tradueix(t, TEXTOS_ARXIVA.error), 'error');
      return;
    }
    if (!seguent) {
      showToast(tradueix(t, TEXTOS_ARXIVA.desfet), 'success');
      return;
    }
    if (estat === 'local') {
      showToast(tradueix(t, TEXTOS_ARXIVA.nomesLocal));
      return;
    }
    showToast(tradueix(t, TEXTOS_ARXIVA.fet), 'success');
  }, [arxivaFil, filId, arxivat, showToast, t]);

  const accio = disponible
    ? {
      etiqueta: tradueix(t, arxivat ? TEXTOS_ARXIVA.desfes : TEXTOS_ARXIVA.menu),
      onTria: executa
    }
    : null;

  return { accio, carregant };
}

export default useArxivaDelFil;
