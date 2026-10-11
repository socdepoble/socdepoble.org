/**
 * La Nevera de Casa · RECEPTES amb el que tens, sobre l'esquelet comú.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 6: «que l'estructura del Rebost
 * siga capaç de fer recomanacions de receptes basades en els ingredients
 * existents») · Cap pàgina ni component a mida: les mateixes dues columnes que
 * «A casa», amb una altra intel·ligència de dades (nucli/recomanador.js).
 *   ColumnaReceptes       el receptari de llavor en targetes, en tres seccions
 *                         («Ho tens tot», «Et falta poc», «Et falta més») i en
 *                         l'ordre del recomanador. Cada targeta diu què és el
 *                         plat i per què va on va («Tens 5 de 6 ingredients.
 *                         Falta: cebes.»). Tocar-ne una obri el detall: els
 *                         ingredients amb la quantitat aproximada i, si falta
 *                         res, «Afig el que falta a «<llista>»»
 *   ColumnaCalPerACuinar  el que falta per a les receptes que són a un o dos
 *                         ingredients i no és a la llista del camí: «+» ho
 *                         afig; «Afig-ho tot», tot d'una (com «Cal comprar»)
 * El que el Rebost sap és el que la persona ha marcat a «A casa»: sense res
 * marcat, la columna ho diu i porta allà. Cap rellotge: el Rebost no guarda
 * dates (vistes/perReceptes.js).
 * Afegir un ingredient posa l'article de la Nevera que ja el representa (el
 * de base o un de propi); si no n'hi ha cap, el crea com a propi amb el nom de
 * l'ingredient (afigPerNom, com «Necessite…»).
 * El detall no porta quantitat ni nota: «D’acord» només tanca.
 */
import { ChefHat, CircleDashed, Plus, Refrigerator, ShoppingBasket } from 'lucide-react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Alerta, Boto } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio } from '../../comu/esquelet/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { receptaPerId } from '../nucli/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { autoriaDArticle } from './autoria.js';
import { CASA, RECEPTES_VISTA } from './constants.js';
import { textArticles, useVistaNevera } from './context.js';
import {
  existenciesDeCasa, faltaDeRecepta, liniesQueFalten, receptesVestides, recomanacionsDeCasa, seccionsDeReceptes, textosDeRecepta
} from './perReceptes.js';

/* Cap color per secció: la icona i el nom la distingixen. */
const ICONES = Object.freeze({ 'a-punt': ChefHat, quasi: ShoppingBasket, lluny: CircleDashed });
const ambIcona = (seccio) => ({ ...seccio, icona: ICONES[seccio.id] });
const textReceptes = (n) => `${n} ${n === 1 ? 'recepta' : 'receptes'}`;
const TEXTOS_BUIT = Object.freeze({ buit: 'Cap recepta en esta secció', buitText: 'Tria «Totes» per a vore tot el receptari.' });

/* Posa a la llista l'ingredient d'una línia: l'article que ja el representa o, si no n'hi ha, un de propi. */
function afigIngredient(accions, llistaId, linia) {
  return linia.articleId ? accions.afig(llistaId, linia.articleId) : accions.afigPerNom(llistaId, linia.nom);
}

/* L'avís de dalt: sense res marcat a «A casa», el recomanador no pot saber res. */
function AvisSenseRebost({ llista }) {
  const { ruta } = useVistaNevera();
  const navigate = useNavigate();
  return (
    <Alerta to="info" titol="Encara no has marcat res a «A casa»" viva={false}
      accions={<Boto icona={Refrigerator} onClick={() => navigate(ruta(CASA.entrada, llista.id))}>Ves a «A casa»</Boto>}>
      Les receptes es trien amb el que marques allà com a «N’hi ha» o «Se n’acaba». Mentrestant, tot el receptari ix com si faltara tot.
    </Alerta>
  );
}

/** «Receptes amb el que tens»: el detall de l'entrada Receptes. */
export function ColumnaReceptes({ params }) {
  const { estat, accions, llistaVigent, mode, llegit, error, persistent } = useVistaNevera();
  const { mida } = useClosaAplicacio();
  const llista = llistaVigent(params);
  /* Correcció del refutador (261011, R3) · En mode `lectora` (una altra pestanya escriu), o si el
     disc no s'ha pogut llegir, les accions tornen false en silenci: «Afig el que falta» es
     desactiva i el diàleg diu per què (AvisNevera). L'avís de la columna el porta «Cal comprar
     per a cuinar» al peu, com les veïnes; en estret només es veu esta columna, i el porta ella. */
  const potEscriure = llegit && mode !== 'lectora';
  const avisDelDisc = mida === 'estret' && (Boolean(error) || mode === 'lectora' || !persistent);
  const senseRebost = existenciesDeCasa(estat).length === 0;
  const recomanacions = recomanacionsDeCasa(estat);
  const perId = new Map(recomanacions.map((recomanacio) => [recomanacio.receptaId, recomanacio]));
  /* REGLA D'OR 1 (261004) · El receptari el publica el projecte: la seua boina (autoria.js). */
  const articles = receptesVestides(recomanacions).map((article) => ({ ...article, autoria: autoriaDArticle(null) }));
  const perComprar = liniesQueFalten(estat, llista.id, recomanacions);
  return (
    <ColumnaCataleg
      forma="targetes"
      titol="Receptes amb el que tens"
      categories={seccionsDeReceptes().map(ambIcona)}
      articles={articles}
      textArticles={textReceptes}
      onTria={(article, { obriDetall }) => obriDetall()}
      detall={{
        ambQuantitat: false,
        ambNota: false,
        textAccepta: 'D’acord',
        contingutDe: (article) => {
          const textos = textosDeRecepta(receptaPerId(article.id));
          return textos ? (
            <>
              <AvisNevera />
              <p>{textos.ingredients}</p>
              {textos.opcionals ? <p>{textos.opcionals}</p> : null}
              <p>{textos.nota}</p>
            </>
          ) : null;
        },
        accionsDe: (article, tanca) => {
          const falta = faltaDeRecepta(estat, llista.id, perId.get(article.id));
          return falta.length ? (
            <Boto icona={Plus} disabled={!potEscriure} onClick={() => {
              falta.forEach((linia) => afigIngredient(accions, llista.id, linia));
              tanca();
            }}>{`Afig el que falta a «${llista.nom}»`}</Boto>
          ) : null;
        }
      }}
      resum={{ etiqueta: 'Cal comprar per a cuinar', comptador: perComprar.length, textComptador: textArticles }}
      avis={avisDelDisc || senseRebost ? (
        <>
          {avisDelDisc ? <AvisNevera /> : null}
          {senseRebost ? <AvisSenseRebost llista={llista} /> : null}
        </>
      ) : null}
      primer={RECEPTES_VISTA.primer}
      tram={RECEPTES_VISTA.tram}
      textos={TEXTOS_BUIT}
    />
  );
}

/** «Cal comprar per a cuinar»: el mig de l'entrada Receptes. */
export function ColumnaCalPerACuinar({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const llista = llistaVigent(params);
  const linies = liniesQueFalten(estat, llista.id, recomanacionsDeCasa(estat));
  return (
    <ColumnaColleccio
      titol="Cal comprar per a cuinar"
      linies={linies}
      resum={{
        etiqueta: `Per a «${llista.nom}»`,
        comptador: linies.length,
        textComptador: textArticles,
        accio: {
          text: 'Afig-ho tot',
          onClick: () => linies.forEach((linia) => afigIngredient(accions, llista.id, linia)),
          desactivada: linies.length === 0
        }
      }}
      onSuma={(linia) => afigIngredient(accions, llista.id, linia)}
      textosLinies={{ suma: (nom) => `Afig ${nom} a «${llista.nom}»` }}
      textos={{
        buit: 'No cal comprar res per a cuinar',
        buitText: 'Quan a una recepta li falten un o dos ingredients, apareixeran ací.',
        tornaCataleg: 'Torna a les receptes'
      }}
      peu={<AvisNevera />}
      primer={RECEPTES_VISTA.primer}
      tram={RECEPTES_VISTA.tram}
    />
  );
}
