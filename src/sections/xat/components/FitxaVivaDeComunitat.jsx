/**
 * FitxaVivaDeComunitat.jsx — Pla 261027_0845 (Guarda Nocturna), P1-55 ·
 * «Pàgina viva de comunitat» (Llibre Mestre, Fita 19).
 *
 * Amb una comunitat oberta (/xat?comunitat=<id>) i cap conversa, la columna
 * dreta del Xat pinta la pàgina viva del subjecte de la comunitat en lloc
 * del document genèric d'«El Xat» (ColumnaDretaBuida):
 *   · una entitat (subjecte.tipus 'entitat'), la seua fitxa pública:
 *     FitxaPublica amb chrome 'context' i la càrrega de la ruta
 *     (usePerfilPublic: terminis, reserva local i clau de qui mira);
 *   · un poble (subjecte.tipus 'poble'), la seua pàgina de /pobles/<id>
 *     (VistaDelPoble). El poble es troba amb fitxaDelSubjecte, la regla del
 *     Xat per a la comunitat d'un poble, també en remot (l'UUID del servidor
 *     o la ruta /pobles/<slug>).
 * Cap de les dues registra SEO ni llig la ruta: el títol de la pestanya i el
 * canònic continuen sent els del Xat. Cap botó de xat dins de la pàgina
 * («Escriu-li al xat», «Parlar amb la Gent de …», ni «Comentar» de la barra
 * blava, que tornava a la mateixa comunitat): ja s'és al Xat (decisió per
 * defecte del pla, pendent del Mestre). Les targetes del feed de
 * publicacions (també «El Xat» i «Descàrregues», pàgines del sistema) són
 * les de la pàgina de sempre: no es filtren (decisió pendent del Mestre).
 * El scroll (revisió adversarial P1-55): la columna dreta no en fa
 * (overflow: hidden, AppGridShell.css). La fitxa d'una entitat és de layout
 * 'contained' i el seu contenidor ja fa scroll (utilities.css); la pàgina
 * d'un poble és de layout 'page' (flex: none) i viu dins de .sdp-xat-buit,
 * el contenidor amb scroll del document destacat (precedent: DocumentDestacat,
 * XatSection.jsx). Només la pàgina: l'espera i `senseFitxa` porten el seu.
 * Si la comunitat no es pot resoldre (un altre tipus, una fitxa que no hi
 * és, una entitat privada o sense resposta), `senseFitxa`: al Xat, la
 * columna buida de sempre. Mai el poble ni l'entitat pilot de reserva.
 * Mentre es carrega, el mateix buit que l'espera del tros diferit.
 *
 * XatSection.jsx la demana en diferit (lazyRoute) i només en ample o mitjà:
 * en mòbil no es munta i /xat no baixa la fitxa pública ni la del poble
 * (XatSection.pes.test.js).
 */
import { useCoreContent } from '../../../app/contexts/CoreContentContext';
import { fitxaDelSubjecte } from '../../pobles/xatDelPoble.js';
import { FitxaPublica, usePerfilPublic } from '../../profile/PerfilPublicSection.jsx';
import { VistaDelPoble } from '../../detail/ItemDetailSection.jsx';

/* L'espera: el mateix buit que el Suspense de la columna (XatSection). */
const Espera = () => <div className="sdp-xat-buit" aria-busy="true" />;

const textDe = (valor) => (typeof valor === 'string' || typeof valor === 'number' ? String(valor).trim() : '');

/* Només una organització és la pàgina d'una comunitat d'entitat: una clau
   que resolguera una persona o una IA (un àlies del paquet) no hi entra. */
const esOrganitzacio = (perfil) => perfil?.tipus === 'entitat' || perfil?.tipus === 'grup';

function PaginaDeLEntitat({ clau, senseFitxa }) {
  const { perfil, carregant } = usePerfilPublic(clau);
  if (carregant) return <Espera />;
  if (!esOrganitzacio(perfil)) return senseFitxa;
  return <FitxaPublica perfil={perfil} chrome="context" ambXat={false} />;
}

function PaginaDelPoble({ subjecte, senseFitxa }) {
  const { towns, status } = useCoreContent();
  const fitxa = fitxaDelSubjecte(subjecte, towns);
  if (!fitxa) return status === 'loading' ? <Espera /> : senseFitxa;
  return <VistaDelPoble pobleId={textDe(fitxa.id) || textDe(fitxa.slug)} chrome="context" contenidor="sdp-xat-buit" carregant={<Espera />} senseFitxa={senseFitxa} />;
}

export default function FitxaVivaDeComunitat({ comunitat, senseFitxa = null }) {
  const subjecte = comunitat?.fil?.subjecte;
  const id = textDe(subjecte?.id);
  if (subjecte?.tipus === 'entitat' && id) return <PaginaDeLEntitat clau={id} senseFitxa={senseFitxa} />;
  if (subjecte?.tipus === 'poble') return <PaginaDelPoble subjecte={subjecte} senseFitxa={senseFitxa} />;
  return senseFitxa;
}
