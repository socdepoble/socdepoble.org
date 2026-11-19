/**
 * Lector de notícies · quan cap de les fonts que se seguixen no ha respost
 * (T5, P1-07, 261024). Va al detall de l'espai, en lloc del buit de la
 * carpeta (Noticies.jsx · SenseNoticia), i només quan la ronda ha acabat i han
 * caigut totes: amb una que responga, les notícies es veuen i l'avís és
 * AvisFonts (comunes.jsx).
 *
 * El que diu, en paraules de la gent («el servei de notícies», mai
 * «servidor», «amfitrió» ni «node»; Gemini G2-02.1, 261024: sense «del poble»
 * quan es parla del servei):
 *   · per què no arriben, pel `motiu` (MOTIUS_NOTICIES, fontNoticies.js);
 *     sense xarxa al dispositiu, sempre 'sense-connexio'. Interfície amb el
 *     servei (261024): 'adreca', una adreça que el servei no llig i a qui no
 *     ha demanat res (correcció R5-08: mai «la font ha enviat»), i
 *     'personals-off', les fonts teues quan el servei encara no les llig;
 *   · «Torna-ho a provar», que torna a demanar la ronda sencera;
 *   · que el poble no s'atura: quatre portes a la resta de Sóc de Poble (el
 *     Mur, l'Agenda, el Mercat i els Pobles), enllaços de veres (Link del
 *     router, amb la base si l'app viu incrustada) amb la pell de botó;
 *   · si la persona en té de desades, que «Per a després» continua ací.
 * Cap notícia inventada (Purga de Mocks, 261016), cap llista escrita a mà ni
 * cap classe pròpia: EstatBuit i Boto de Pedra Seca i les classes globals.
 */
import { CloudOff } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import { Boto, EstatBuit } from '../../../components/PedraSeca/index.js';
import { textosLector } from '../i18nLector.js';
import { DESPRES } from '../nucli/index.js';
import { useVistaLector } from './context.js';
import { NOTICIES } from './navegacio.js';

/* Quan no n'ha respost cap. */
export const TEXT_MOTIU = textosLector('ca').motius;

/* 261024 (Lector) · Quan és una sola font, la triada a l'arbre. */
export const TEXT_MOTIU_D_UNA = Object.freeze({
  ...TEXT_MOTIU,
  ...textosLector('ca').motiusUna
});

/** El text d'un motiu (`una`: d'una sola font); un de desconegut, el del servei. */
export function textDelMotiu(motiu, { una = false, idioma = 'ca' } = {}) {
  const tx = textosLector(idioma);
  const textos = una ? { ...tx.motius, ...tx.motiusUna } : tx.motius;
  return Object.hasOwn(textos, motiu ?? '') ? textos[motiu] : textos.servidor;
}

/* `ancora`: el ref d'on EspaiNoticies troba la closca (el mateix <span> sense classe del buit). */
export function FontsSenseResposta({ motiu, onTornaAProvar, ancora = null }) {
  const { lector, ruta, idioma = 'ca' } = useVistaLector();
  const tx = textosLector(idioma);
  const desades = lector.estat.despres.length > 0;
  return (
    <EstatBuit icona={CloudOff} titol={tx.noArribenNoticiesTitol}
      accio={<Boto varietat="secundari" onClick={onTornaAProvar}>{tx.tornaHoAProvar}</Boto>}>
      <p><span ref={ancora}>{textDelMotiu(motiu, { idioma })}</span></p>
      <p>{tx.mentrestantPoble}</p>
      <p>
        <Link className="sdp-boto sdp-boto--secundari" to="/mur">{tx.passaPelMur}</Link>
        {' '}
        <Link className="sdp-boto sdp-boto--secundari" to="/calendari">{tx.miraLAgenda}</Link>
        {' '}
        <Link className="sdp-boto sdp-boto--secundari" to="/mercat">{tx.voltaPelMercat}</Link>
        {' '}
        <Link className="sdp-boto sdp-boto--secundari" to="/pobles">{tx.coneixElsPobles}</Link>
      </p>
      {desades ? (
        <p>
          {tx.desadesContinuen}
          {' '}
          <Link to={ruta(NOTICIES, DESPRES)}>{tx.obriles}</Link>
        </p>
      ) : null}
    </EstatBuit>
  );
}
