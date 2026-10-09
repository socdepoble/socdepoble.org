import { useEffect, useState } from 'react';
import logoLight from '../assets/ui/logo-socdepoble-rect-blanc.svg';

/* Onada 7 (261009) · El logotip negre ix del tros d'entrada. Al paquet de
   WordPress (mode lib) Vite inlina cada SVG com a data URI, i l'import
   estàtic posava els dos logotips dins de l'entrada (138 KB cadascun) encara
   que cap crida no demana variant="dark". El blanc continua estàtic: el seu
   render no canvia. El negre es demana amb import() la primera vegada que
   algú el pinta, i es guarda ací perquè els muntatges següents el tinguen
   de seguida, sense tornar a passar per la reserva. */
let logoNegre = null;
let carregaNegre = null;

function demanaLogoNegre() {
  if (!carregaNegre) {
    carregaNegre = import('../assets/ui/logo-socdepoble-rect-negre.svg').then(
      (modul) => { logoNegre = modul.default; return logoNegre; },
      // Una fallada no es queda guardada: el pròxim muntatge ho torna a provar.
      (error) => { carregaNegre = null; throw error; }
    );
  }
  return carregaNegre;
}

/* Mentre el negre arriba, el mateix <img> porta un SVG transparent amb la
   proporció del logotip: amb width i height ocupa el seu lloc i no hi ha
   salt de maquetació. Sense src no valdria: el navegador hi pintaria el text
   alternatiu, i Firefox, a més, n'ignora width i height. */
const RESERVA = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 78'/%3E";

export default function BrandMark({ variant = 'light', className = '' }) {
  const fosc = variant === 'dark';
  const [negre, setNegre] = useState(logoNegre);

  useEffect(() => {
    /* Ací mana l'estat, no la memòria del mòdul: si el negre arriba entre el
       render i l'efecte, el render ha pintat la reserva, i la promesa ja
       resolta torna a pintar la instància en el microtask següent. */
    if (!fosc || negre) return undefined;
    /* Si la variant canvia o el component es desmunta abans que acabe la
       càrrega, la resposta ja no és per a ell: no toca l'estat, i una
       instància que ha passat a light no es torna a pintar debades. */
    let viu = true;
    demanaLogoNegre().then(
      (src) => { if (viu) setNegre(src); },
      // Sense el negre, la reserva es queda: un buit net, mai una imatge trencada.
      (error) => { if (import.meta.env.DEV) console.warn('[BrandMark] No s’ha pogut carregar el logotip negre.', error); }
    );
    return () => { viu = false; };
  }, [fosc, negre]);

  /* Revisió adversarial de l'Onada 7 · La memòria del mòdul també compta. Una
     instància muntada abans que arribara el negre (en light, o en dark i
     canviada a light) que passa a dark quan ja hi és el pinta en el primer
     render, sense cap fotograma de reserva. */
  const src = fosc ? (negre || logoNegre || RESERVA) : logoLight;

  return <img className={className} src={src} alt="Sóc de Poble" width="300" height="78" fetchpriority="high" />;
}
