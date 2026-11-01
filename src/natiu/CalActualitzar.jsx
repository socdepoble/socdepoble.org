/**
 * natiu/CalActualitzar.jsx — P0-23 (BOT-A2; Gauntlet Claude 261025_1705;
 * rebasat a l'assalt 261101) · La pantalla de l'app nativa massa vella. La
 * pinta entrada.jsx en lloc de l'App quan el node diu que esta versió ja no la
 * servix (versioMinima.js).
 *
 * Viu fora de tots els proveïdors de l'App: el traductor és el de la llengua
 * triada o, si no n'hi ha cap, la del dispositiu (`amfitrio`, TE-05, com la
 * `language` que entrada.jsx dona a l'App), i el diccionari ja hi és perquè es
 * pinta amb pintaAmbDiccionari, com l'App. Cap acció dins de l'app: l'enllaç
 * de la botiga, si el node en dona un d'https, i la web, que sempre és la
 * vigent.
 *
 * Arriba tard i sense avís (la resposta del node pot tardar, també més de
 * 5 s si la sessió desada s'ha de renovar; versioClient.js): en muntar-se, el
 * focus va al títol, perquè el lector de pantalla anuncie el canvi i qui
 * escrivia dins de l'App no es quede amb el focus perdut al body.
 */

import { useEffect, useRef } from 'react';
import { createTranslator, llegeixIdiomaTriat, resolIdioma } from '../config/i18n.js';
import { origenPublic } from '../config/origenPublic.js';

export default function CalActualitzar({ enllac = null, amfitrio = null }) {
  const t = createTranslator(resolIdioma({ triat: llegeixIdiomaTriat(), amfitrio }));
  const titolRef = useRef(null);
  useEffect(() => { titolRef.current?.focus(); }, []);
  return (
    <main className="sdp-buit sdp-cal-actualitzar" aria-labelledby="sdp-cal-actualitzar-titol">
      <h2 id="sdp-cal-actualitzar-titol" ref={titolRef} tabIndex={-1} className="sdp-buit__titol">{t('app.actualitza.titol', 'Cal actualitzar l’app')}</h2>
      <p className="sdp-buit__text">
        {t('app.actualitza.text', 'Esta versió de l’app ja no s’entén amb el servidor del poble. Actualitza-la per a continuar publicant i xatejant. Mentrestant, pots entrar per la web.')}
      </p>
      {enllac ? (
        <a className="sdp-boto sdp-boto--primari sdp-boto--gran" href={enllac} target="_blank" rel="noopener noreferrer">
          {t('app.actualitza.botiga', 'Actualitza l’app')}
        </a>
      ) : null}
      <a className="sdp-boto sdp-boto--fantasma" href={origenPublic()} target="_blank" rel="noopener noreferrer">
        {t('app.actualitza.web', 'Obri Sóc de Poble al navegador')}
      </a>
    </main>
  );
}
