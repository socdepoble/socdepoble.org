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
import { DESPRES } from '../nucli/index.js';
import { useVistaLector } from './context.js';
import { NOTICIES } from './navegacio.js';

const PERSONALS_APAGADES = 'Les fonts teues queden guardades en este dispositiu. El servei de notícies encara no les llig: '
  + 'les llegirà quan el servei les active.';

/* Quan no n'ha respost cap. */
export const TEXT_MOTIU = Object.freeze({
  'sense-connexio': 'Sembla que este dispositiu no té connexió. Quan torne, les notícies arribaran soles.',
  temps: 'Les fonts han tardat massa a contestar. Pot ser la cobertura o que la seua web va carregada.',
  servidor: 'El servei de notícies no respon. Pot ser cosa d’un moment.',
  font: 'Les fonts han enviat una cosa que no sabem llegir com a notícies.',
  limit: 'Hem demanat les notícies massa vegades seguides. Espera un moment i torna-ho a provar.',
  adreca: 'El servei de notícies no llig estes adreces (no són públiques o no són segures), i no ha demanat res a cap web.',
  'personals-off': PERSONALS_APAGADES
});

/* 261024 (Lector) · Quan és una sola font, la triada a l'arbre. */
export const TEXT_MOTIU_D_UNA = Object.freeze({
  ...TEXT_MOTIU,
  temps: 'La font ha tardat massa a contestar. Pot ser la cobertura o que la seua web va carregada.',
  font: 'La font ha enviat una cosa que no sabem llegir com a notícies.',
  adreca: 'El servei de notícies no llig esta adreça (no és pública o no és segura), i no ha demanat res a la web.'
});

/** El text d'un motiu (`una`: d'una sola font); un de desconegut, el del servei. */
export function textDelMotiu(motiu, { una = false } = {}) {
  const textos = una ? TEXT_MOTIU_D_UNA : TEXT_MOTIU;
  return Object.hasOwn(textos, motiu ?? '') ? textos[motiu] : textos.servidor;
}

/* `ancora`: el ref d'on EspaiNoticies troba la closca (el mateix <span> sense classe del buit). */
export function FontsSenseResposta({ motiu, onTornaAProvar, ancora = null }) {
  const { lector, ruta } = useVistaLector();
  const desades = lector.estat.despres.length > 0;
  return (
    <EstatBuit icona={CloudOff} titol="Ara mateix no arriben les notícies"
      accio={<Boto varietat="secundari" onClick={onTornaAProvar}>Torna-ho a provar</Boto>}>
      <p><span ref={ancora}>{textDelMotiu(motiu)}</span></p>
      <p>Mentrestant, el poble no s’atura:</p>
      <p>
        <Link className="sdp-boto sdp-boto--secundari" to="/mur">Passa pel Mur</Link>
        {' '}
        <Link className="sdp-boto sdp-boto--secundari" to="/calendari">Mira l’Agenda</Link>
        {' '}
        <Link className="sdp-boto sdp-boto--secundari" to="/mercat">Fes una volta pel Mercat</Link>
        {' '}
        <Link className="sdp-boto sdp-boto--secundari" to="/pobles">Coneix els pobles</Link>
      </p>
      {desades ? (
        <p>
          Les notícies que has desat per a després continuen ací.
          {' '}
          <Link to={ruta(NOTICIES, DESPRES)}>Obri-les</Link>
        </p>
      ) : null}
    </EstatBuit>
  );
}
