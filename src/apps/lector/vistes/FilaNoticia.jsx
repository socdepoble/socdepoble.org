/**
 * Lector de notícies · la fila d'una notícia a la llista de l'espai de treball
 * (el `renderItem` de vistes/Noticies.jsx).
 *
 * Ordre del Mestre (261024, 15:05) · «El Snippet Curador i l'RSS són la
 * mateixa criatura: tots dos capturen foto, títol, font/data i entradeta. La
 * targeta de notícia de la columna del mig ha de tindre el mateix patró visual
 * elegant, net i matemàtic que el Bloc de notes / Feedly (Pedra Seca).» És la
 * fila del Bloc de notes (sections/notes/NotaFitxa.jsx, la fitxa no activa)
 * amb les mateixes classes globals i la mateixa variant de la llista
 * (`listClassName` sdp-bloc-list--notes, modules.css):
 *   media      el quadrat de l'esquerra: la miniatura o, sense, la icona de
 *              la categoria (com ItemMedia)
 *   títol      dues línies com a molt
 *   meta       «font · data · Nou», el primer subtítol
 *   entradeta  el resum de l'article, el segon subtítol (dues línies)
 * Cap targeta, cap boina, cap pastilla: la fila no és un article.
 *
 * LA MINIATURA. Només la que torna el servei de notícies (servei.imatge: una
 * adreça del mateix servei, que fa de pont), mai l'origen de la font: el
 * navegador de qui llig no demana res a la web d'un tercer. Sense servei (la
 * llavor, un port de proves), cap miniatura. Sense referent, en diferit, i si
 * no carrega, la icona.
 */
import { useState } from 'react';

function Miniatura({ src, reserva }) {
  const [caiguda, setCaiguda] = useState(false);
  if (caiguda) return reserva;
  return (
    <img className="sdp-gestor-fitxa__imatge" src={src} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
      onError={() => setCaiguda(true)} />
  );
}

/* `item`: la fila del model (Noticies.jsx · filesDeLaLlista), amb `icon` (un component de Lucide),
   `subtitle` (la meta), `entradeta` i `miniatura` (una adreça del servei o null). */
export function FilaNoticia({ item, active, onSelect }) {
  const Icona = item.icon;
  const reserva = Icona ? <Icona size={24} /> : null;
  return (
    <button type="button" className="sdp-gestor-fitxa" aria-current={active ? 'true' : undefined} onClick={onSelect}>
      <span className="sdp-gestor-fitxa__media" aria-hidden="true">
        {item.miniatura ? <Miniatura key={item.miniatura} src={item.miniatura} reserva={reserva} /> : reserva}
      </span>
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-gestor-fitxa__titol">{item.title}</span>
        {item.subtitle ? <span className="sdp-gestor-fitxa__subtitol">{item.subtitle}</span> : null}
        {item.entradeta ? <span className="sdp-gestor-fitxa__subtitol">{item.entradeta}</span> : null}
      </span>
    </button>
  );
}
