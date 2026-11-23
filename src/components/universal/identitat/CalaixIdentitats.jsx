/**
 * CalaixIdentitats.jsx — «Amb qui actues?» (T43, ordre del Mestre, 260928).
 *
 * Calaix a la dreta (Dialeg de Pedra Seca) amb les identitats amb què la
 * persona pot actuar: ella mateixa i les organitzacions que administra. La
 * identitat activa porta aria-current i la insígnia «Activa». Triar-ne una
 * crida onTria(tipus, id); el pare tanca el calaix i el Dialeg torna el
 * focus al botó de la barra.
 *
 * S'ha de pintar GERMÀ de <header class="bar-black">, mai a dins: el header
 * porta color-scheme fosc i el focus del crom, i un <dialog> els heretaria.
 *
 * Presentacional: tot li arriba per props (es pot pintar al catàleg).
 * `avisEixida` i `errorEixida` són nodes ja pintats (les Alertes
 * d'EixidaSegura.jsx que munta useIdentitatDeLaBarra): v1.2.6, el calaix és de
 * l'arrencada i no importa Alerta, que viatja amb el tros diferit de l'eixida.
 *
 * v1.2.23 · L5-02 (Gauntlet R1) · El títol, la descripció, el nom de la llista,
 * la insígnia i el rol de cada identitat també arriben per props, amb el
 * valencià de sempre per defecte (el catàleg no en passa).
 * El Xat els passa en la llengua de la interfície (ClosCaXat.jsx, amb
 * textosCalaixIdentitats.js); `etiquetaRol(identitat)` torna el text del rol.
 * v1.2.23 · R2E-04 (Gauntlet R2) · La barra negra també (useIdentitatDeLaBarra.js):
 * en valencià deixa els textos fixos en undefined i s'apliquen estos per defecte.
 */
import { Globe, LogOut } from 'lucide-react';
import { Boto, Dialeg, Insignia } from '../../PedraSeca/index.js';
import { AvatarResolt } from './AvatarResolt.jsx';
import { etiquetaDeRol } from './rols.js';

export const ETIQUETA_IDIOMA_CALAIX = 'Idioma del sistema';
export const ETIQUETA_EIXIR_CALAIX = 'Eixir de Sóc de Poble';

export function CalaixIdentitats({
  obert = false,
  onTanca,
  identitats = [],
  onTria,
  onIdioma,
  onEixir,
  eixint = false,
  avisEixida = null,
  errorEixida = null,
  etiquetaIdioma = ETIQUETA_IDIOMA_CALAIX,
  etiquetaEixir = ETIQUETA_EIXIR_CALAIX,
  etiquetaTitol = 'Amb qui actues?',
  etiquetaDescripcio = 'Tria amb quina identitat vols publicar i editar. Pots canviar quan vullgues.',
  etiquetaLlista = 'Identitats',
  etiquetaActiva = 'Activa',
  etiquetaRol = null,
}) {
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={etiquetaTitol}
      descripcio={etiquetaDescripcio}
      costat="dreta"
      accions={(
        <>
          <Boto varietat="secundari" icona={Globe} onClick={onIdioma}>{etiquetaIdioma}</Boto>
          <Boto varietat="perill" icona={LogOut} onClick={onEixir} carregant={eixint}>{etiquetaEixir}</Boto>
        </>
      )}
    >
      <ul className="sdp-calaix-identitats" aria-label={etiquetaLlista}>
        {identitats.map((identitat) => {
          const entitat = identitat.tipus === 'entitat';
          const rol = etiquetaRol ? etiquetaRol(identitat) : entitat ? etiquetaDeRol(identitat.rol) || 'Organització' : 'Persona';
          return (
            <li key={`${identitat.tipus}:${identitat.id}`}>
              <button
                type="button"
                className="sdp-calaix-identitats__item"
                aria-current={identitat.activa ? 'true' : undefined}
                onClick={() => onTria?.(identitat.tipus, identitat.id)}
              >
                <AvatarResolt nom={identitat.nom} src={identitat.avatar} mida="md" llavor={identitat.id} alt="" />
                <span className="sdp-calaix-identitats__text">
                  <span className="sdp-calaix-identitats__nom">{identitat.nom}</span>
                  <span className="sdp-calaix-identitats__rol">{rol}</span>
                </span>
                {identitat.activa ? <Insignia to="exit">{etiquetaActiva}</Insignia> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {avisEixida}
      {errorEixida}
    </Dialeg>
  );
}

export default CalaixIdentitats;
