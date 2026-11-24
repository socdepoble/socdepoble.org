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
import { Alerta, Boto, GrupCamps, IconesAlergens } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio } from '../../comu/esquelet/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { textosBuitNevera, textosVistaNevera } from '../i18nNevera.js';
import { nomLlistaVisible } from '../mercadona.js';
import { receptaPerId } from '../nucli/index.js';
import { llistaNomsAlergens, resumAlergensRecepta } from './alergensVistaRecepta.js';
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

/* Posa a la llista l'ingredient d'una línia: l'article que ja el representa o, si no n'hi ha, un de propi. */
function afigIngredient(accions, llistaId, linia) {
  return linia.articleId ? accions.afig(llistaId, linia.articleId) : accions.afigPerNom(llistaId, linia.nom);
}

/* L'avís de dalt: sense res marcat a «A casa», el recomanador no pot saber res. */
function AvisSenseRebost({ llista, tx }) {
  const { ruta } = useVistaNevera();
  const navigate = useNavigate();
  return (
    <Alerta to="info" titol={tx.senseRebostTitol} viva={false}
      accions={<Boto icona={Refrigerator} onClick={() => navigate(ruta(CASA.entrada, llista.id))}>{tx.vesAACasa}</Boto>}>
      {tx.senseRebostText}
    </Alerta>
  );
}

/** «Receptes amb el que tens»: el detall de l'entrada Receptes. */
export function ColumnaReceptes({ params }) {
  const { estat, accions, llistaVigent, mode, llegit, error, persistent } = useVistaNevera();
  const { mida, idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const llista = llistaVigent(params);
  /* v1.2.19 · Gauntlet R1 (L3-02) · El nom de la llista, pintat en la llengua de la interfície (la de botiga es desa amb el nom canònic). */
  const nomLlista = nomLlistaVisible(llista.nom, idioma);
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
      ometDataNoIndicada
      titol={tx.receptesAmbElQueTens}
      categories={seccionsDeReceptes().map(ambIcona)}
      articles={articles}
      textArticles={tx.textReceptes}
      onTria={(article, { obriDetall }) => obriDetall()}
      detall={{
        ambQuantitat: false,
        ambNota: false,
        textAccepta: tx.dAcord,
        contingutDe: (article) => {
          const recepta = receptaPerId(article.id);
          const textos = textosDeRecepta(recepta);
          const alergens = resumAlergensRecepta(recepta);
          return textos ? (
            <>
              <AvisNevera />
              <p>{textos.ingredients}</p>
              {textos.opcionals ? <p>{textos.opcionals}</p> : null}
              {alergens ? (
                <GrupCamps llegenda={tx.alergensReceptaTitol}>
                  {alergens.obligatoris.length > 0 ? (
                    <p>
                      <strong>{tx.alergensConteLabel}</strong>{' '}
                      {llistaNomsAlergens(alergens.obligatoris, tx)}
                    </p>
                  ) : null}
                  {alergens.obligatoris.length > 0 ? (
                    <IconesAlergens alergens={alergens.obligatoris} mida="mitjana" etiqueta={tx.alergensIconesConte} />
                  ) : null}
                  {alergens.opcionalsOTraces.length > 0 ? (
                    <p>
                      <strong>{tx.alergensOpcionalLabel}</strong>{' '}
                      {llistaNomsAlergens(alergens.opcionalsOTraces, tx)}
                    </p>
                  ) : null}
                  {alergens.opcionalsOTraces.length > 0 ? (
                    <IconesAlergens alergens={alergens.opcionalsOTraces} mida="xicoteta" etiqueta={tx.alergensIconesOpcional} />
                  ) : null}
                  {alergens.obligatoris.length === 0 && alergens.opcionalsOTraces.length === 0 ? (
                    <p>{tx.alergensCapDirecte}</p>
                  ) : null}
                  {alergens.teLlentilla ? <p>{tx.alergensNotaLlentilla}</p> : null}
                  {alergens.tePinyo ? <p>{tx.alergensNotaPinyo}</p> : null}
                  {alergens.teElaborats ? <p>{tx.alergensNotaElaborats}</p> : null}
                  <p>{tx.alergensAvisEtiqueta}</p>
                </GrupCamps>
              ) : null}
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
            }}>{tx.afigElQueFalta(nomLlista)}</Boto>
          ) : null;
        }
      }}
      resum={{ etiqueta: tx.calComprarPerACuinar, comptador: perComprar.length, textComptador: idioma === 'ca' ? textArticles : tx.textArticlesCount }}
      avis={avisDelDisc || senseRebost ? (
        <>
          {avisDelDisc ? <AvisNevera /> : null}
          {senseRebost ? <AvisSenseRebost llista={llista} tx={tx} /> : null}
        </>
      ) : null}
      primer={RECEPTES_VISTA.primer}
      tram={RECEPTES_VISTA.tram}
      textos={{ buit: txBuit.receptesBuit, buitText: txBuit.receptesBuitText }}
    />
  );
}

/** «Cal comprar per a cuinar»: el mig de l'entrada Receptes. */
export function ColumnaCalPerACuinar({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const llista = llistaVigent(params);
  /* v1.2.19 · Gauntlet R1 (L3-02) · El nom de la llista, pintat en la llengua de la interfície (la de botiga es desa amb el nom canònic). */
  const nomLlista = nomLlistaVisible(llista.nom, idioma);
  const linies = liniesQueFalten(estat, llista.id, recomanacionsDeCasa(estat));
  return (
    <ColumnaColleccio
      titol={tx.calComprarPerACuinar}
      linies={linies}
      resum={{
        etiqueta: tx.perALlistaNom(nomLlista),
        comptador: linies.length,
        textComptador: idioma === 'ca' ? textArticles : tx.textArticlesCount,
        accio: {
          text: tx.afigHoTot,
          onClick: () => linies.forEach((linia) => afigIngredient(accions, llista.id, linia)),
          desactivada: linies.length === 0
        }
      }}
      onSuma={(linia) => afigIngredient(accions, llista.id, linia)}
      textosLinies={{ suma: (nom) => tx.afigItemALlistaNom(nom, nomLlista) }}
      textos={{
        buit: txBuit.cuinarBuit,
        buitText: txBuit.cuinarBuitText,
        tornaCataleg: txBuit.cuinarTornaCataleg
      }}
      peu={<AvisNevera />}
      primer={RECEPTES_VISTA.primer}
      tram={RECEPTES_VISTA.tram}
    />
  );
}
