/**
 * AvisOblitXat.jsx — L'avís d'OBLIT_FALLIT en eixir (P1-12 pas 17; disseny
 * §8.5 i §18 D-09).
 *
 * Qui ix d'un ordinador compartit ha de saber si les claus del xat d'este
 * aparell NO s'han pogut esborrar (mai un èxit fals): un diàleg de
 * confirmació de Pedra Seca, accessible (títol i descripció del <dialog>,
 * focus i Escape del Dialeg, botons de --sdp-touch-min), amb «Torna-ho a
 * provar» i «Entesos».
 *   · Obert només sense sessió i amb l'estat OBLIT_FALLIT. «Entesos» (o
 *     Escape, o el vel) el tanca fins a un estat nou: un reintent que torna a
 *     fallar el reobri.
 *   · «Torna-ho a provar» crida `reintenta()` (un sol vol: el botó es
 *     desactiva mentre dura) i només diu «fet» si l'estat de després és
 *     'oblidat'.
 *   · Sense cap fallada no pinta res. Una vegada obert, el <dialog> es queda
 *     muntat (tancat) perquè en tancar-se el focus torne on era.
 * Amb la bandera apagada `oblit` és sempre null: cap píxel.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { useUIActions } from '../../../app/contexts/UIContext';
import { useToast } from '../../../components/universal/NotificationContext.jsx';
import { ESTAT_OBLIT_XAT } from '../../../data/xifratXatEixida.js';

export default function AvisOblitXat({ oblit = null, reintenta = null, ambSessio = false }) {
  const { t } = useUIActions();
  const { showToast } = useToast();
  const [descartat, setDescartat] = useState(null);
  const [carregant, setCarregant] = useState(false);
  const [muntat, setMuntat] = useState(false);
  const enVol = useRef(false);
  const viu = useRef(true);
  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; };
  }, []);

  const fallit = !ambSessio && oblit?.estat === ESTAT_OBLIT_XAT.fallit;
  const obert = fallit && descartat !== oblit;
  useEffect(() => { if (obert) setMuntat(true); }, [obert]);

  const tanca = useCallback(() => { setDescartat(oblit); }, [oblit]);
  const tornaAProvar = useCallback(async () => {
    if (enVol.current || typeof reintenta !== 'function') return;
    enVol.current = true;
    setCarregant(true);
    let resultat = null;
    try {
      resultat = await reintenta();
    } catch {
      resultat = null;
    } finally {
      enVol.current = false;
      if (viu.current) setCarregant(false);
    }
    if (viu.current && resultat?.estat === ESTAT_OBLIT_XAT.oblidat) {
      showToast(t('section.xat.oblit.fet', 'Les claus del xat d’este aparell ja s’han esborrat.'), 'success');
    }
  }, [reintenta, showToast, t]);

  if (!obert && !muntat) return null;
  return (
    <DialegConfirmacio
      obert={obert}
      onTanca={tanca}
      onConfirma={tornaAProvar}
      carregant={carregant}
      titol={t('section.xat.oblit.fallit.titol', 'No s’han pogut esborrar les claus del xat')}
      descripcio={t('section.xat.oblit.fallit.cos', 'Has eixit, però este navegador no ha deixat esborrar les claus del xat xifrat d’este aparell. Si és un ordinador compartit, torna-ho a provar. Si continua fallant, tanca les altres pestanyes de Sóc de Poble o esborra les dades del lloc des del navegador.')}
      etiquetaConfirma={t('section.xat.oblit.fallit.reintenta', 'Torna-ho a provar')}
      etiquetaCancela={t('section.xat.oblit.fallit.entesos', 'Entesos')}
    />
  );
}
