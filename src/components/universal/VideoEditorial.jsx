/**
 * VideoEditorial.jsx — L'únic punt de l'App que pinta l'iframe d'un vídeo editorial.
 *
 *   · R12 de Codex, integrat al Bloc 4 de l'Onada R6. L'HTML que es desa mai
 *     no porta un iframe: el sanejador (utils/sanitize.js) el prohibix. El cos
 *     guarda un marcador inert, `<div data-sdp-youtube="ID" data-titol="…">`,
 *     amb un enllaç de reserva (richText/extensions/videoEditorial.js), i el
 *     complement declaratiu `video_youtube` de l'Aplec arriba com a dades.
 *   · Este component és qui convertix eixe id en un iframe: un id de YouTube
 *     (11 caràcters d'este alfabet) i un sol origen, el de YouTube sense galetes.
 *     Cap URL, cap altre amfitrió, cap atribut que vinga de l'HTML.
 *   · Gauntlet R9 · G2-04 · Façana de clic, com la del Lector i «Vore mapa».
 *     Abans del gest, cap iframe ni cap petició a tercers: el títol, l'avís i
 *     el botó «Veure el vídeo (YouTube)», sense cap miniatura de i.ytimg.com.
 *     Després del clic, l'iframe de sempre. No es recorda res: un clic per
 *     vídeo.
 *   · Gauntlet R10 · VFC-01 · El «sí» és d'un sol id. Si el lloc passa a un
 *     altre vídeo (A→B), s'oblida durant el render, i tornar a A demana un clic
 *     nou. El focus passa a l'iframe dins del mateix clic (flushSync) i només
 *     llavors: cap efecte no el pot moure després.
 *   · Gauntlet R10 · VFC-09 · Amb més d'un vídeo, cada botó té un nom propi:
 *     aria-label és el text visible del botó i, darrere, el títol del vídeo
 *     (WCAG 2.5.3: el nom comença pel que es veu). La descripció
 *     (aria-describedby, amb un id de useId) és l'avís de tercers. Amb
 *     titolVisible={false} és igual: el títol entra al nom sense cap node nou,
 *     i el text de la pàgina no el repetix.
 *   · FBV-02 · VFC-07 · Ni l'apartat 11 ni el 21 de /legal 2.5 no nomenen
 *     YouTube (l'apartat 23, d'agraïments, enllaça canals de YouTube, però no
 *     parla d'este reproductor). L'apartat 11 diu el principi (a un servei de
 *     fora només s'hi va amb un botó), però l'apartat 21 només parla
 *     d'OpenStreetMap, de «Traduir» i de la Viquipèdia. Per tant, l'únic que
 *     informa l'usuari és l'avís d'esta façana. Nomenar-lo a /legal és una
 *     decisió del Mestre (una 2.6). La prova ho vigila.
 *   · FBV-03 · «Vore mapa» sí que recorda la tria (sdp-mapa-fons) i la
 *     Viquipèdia té el seu «sí». Són d'altres serveis i /legal els nomena: cap
 *     d'eixes claus no es reutilitza per a YouTube.
 *   · FBV-01 · La classe video-editorial__facana deixa que modules.css pinte
 *     la façana amb el crom quan viu sobre el fons fosc de .aplec-2023__video.
 *     VFC-04 · I que hi lleve el farciment de .sdp-buit a la icona (l'EstatBuit
 *     li posa eixa classe): sense això, la CirclePlay no es pintava mai.
 *   · FBV-05 · titolVisible={false}: qui ja mostra el títol al costat (el visor
 *     d'Anatomia Rural, amb el seu <cite>) no el repetix a la façana. L'avís
 *     passa a ser el títol de la façana i l'iframe conserva el títol accessible.
 */
import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CirclePlay, Play } from 'lucide-react';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import { createTranslator } from '../../config/i18n.js';
import { Boto } from '../PedraSeca/atoms/Boto.jsx';
import { EstatBuit } from '../PedraSeca/atoms/estats.jsx';

export const ORIGEN_VIDEO_EDITORIAL = 'https://www.youtube-nocookie.com';
const FORMA_ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;
const MAXIM_TITOL = 200;
const T_PER_DEFECTE = createTranslator('ca');

/** Un id de YouTube té 11 caràcters de l'alfabet [A-Za-z0-9_-]. */
export const esIdVideoEditorial = (id) => typeof id === 'string' && FORMA_ID_YOUTUBE.test(id);

/** El títol accessible: text d'una línia, retallat; buit si no és text. */
export const titolDeVideoEditorial = (titol) => (typeof titol === 'string' ? titol.replace(/\s+/g, ' ').trim().slice(0, MAXIM_TITOL) : '');

/** El vídeo; sense un id vàlid, res (cap iframe buit ni cap origen alternatiu). */
export function VideoEditorial({ id, title, titolVisible = true }) {
  const t = useUIActionsOpcional()?.t || T_PER_DEFECTE;
  /* VFC-01 · El «sí» és d'este id i de cap altre: si el lloc passa a un altre vídeo, s'oblida
     ara mateix (A→B→A torna a la façana i demana un clic nou). */
  const [obertPer, setObertPer] = useState(null);
  if (obertPer !== null && obertPer !== id) setObertPer(null);
  const obert = obertPer !== null && obertPer === id;
  const marc = useRef(null);
  const idAvis = useId();
  if (!esIdVideoEditorial(id)) return null;
  const titol = titolDeVideoEditorial(title) || t('editor.video.titolPerDefecte');
  if (!obert) {
    const veure = t('editor.video.veure');
    const avis = <span id={idAvis}>{t('editor.video.avisTercers')}</span>;
    /* Després del gest, i només llavors, el focus passa al reproductor: el botó ja no hi és. */
    const obri = () => {
      flushSync(() => setObertPer(id));
      marc.current?.focus();
    };
    return (
      <EstatBuit className="video-editorial__facana" icona={CirclePlay} titol={titolVisible ? titol : avis}
        accio={<Boto varietat="primari" icona={Play} aria-label={`${veure} ${titol}`} aria-describedby={idAvis} onClick={obri}>{veure}</Boto>}>
        {titolVisible ? avis : null}
      </EstatBuit>
    );
  }
  return (
    <iframe
      ref={marc}
      src={`${ORIGEN_VIDEO_EDITORIAL}/embed/${id}`}
      title={titol}
      width="1080" height="608" loading="lazy"
      referrerPolicy="strict-origin-when-cross-origin"
      allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
    />
  );
}
