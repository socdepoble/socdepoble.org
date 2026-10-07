/**
 * PortesTargeta.jsx — les portes d'UniversalCard: la targeta de doble acció.
 *
 * P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció»,
 * aprovat pel Mestre el 261003). Peça germana d'UniversalCard: l'índex de
 * PedraSeca no l'exporta; la targeta la munta al final del cos quan rep la
 * prop `portes`. ESMENA 261003 22:34 (directrius 2234 i 2245): la targeta
 * amb portes és la UniversalCard estàndard, ja no una variant compacta.
 *
 *  · Com a màxim DUES portes, en l'ordre del DOM, que és el de la vista i el
 *    del focus. En DEV, avisa de les que sobren i no les pinta.
 *  · Porta amb destí: un enllaç de veres (Link del RouterContext: router en
 *    memòria a WordPress i de navegador a l'app, mai window.location) amb la
 *    pell de Boto. Només rutes de l'app (esRutaDeLaPorta, W4-07): una porta
 *    no trau ningú de la pàgina de l'amfitrió. Un clic modificat (pestanya
 *    nova, botó del mig) es queda amb el navegador i l'href, com a tot Link i
 *    a l'interceptor d'enllaços (app/enllacosInterns.js).
 *  · Porta sense destí (o amb un destí que no és una ruta de l'app): INERTA.
 *    Un <button aria-disabled="true">, enfocable i llegible, que en prémer-lo
 *    diu amb un toast que encara està en obres i no navega mai (patró de
 *    VistaEnConstruccio). Cap control fa com si.
 *  · Nom accessible: el text visible és el verb curt («Publicar») i la resta
 *    del nom («al Mur») va en .sdp-sr-only, sense aria-label: el lector, el
 *    traductor del navegador i el control per veu lligen el mateix text i el
 *    nom conté el text visible (WCAG 2.5.3). Una porta inerta hi afig
 *    «(en obres)».
 *
 * Una porta: { id, verb, nom, desti, varietat, avis?, enObres? }
 *   id       'publicar' | 'saber' (o un altre identificador estable)
 *   verb     text visible
 *   nom      nom accessible sencer, que conté el verb («Publicar al Mur»,
 *            «Publicar: Vehicle Compartit»). Si no continua el verb amb un
 *            espai, el verb visible s'amaga al lector i el nom es llig sencer
 *   desti    ruta de l'app o null
 *   varietat 'primari' | 'secundari' (una porta inerta sempre és secundària)
 *   avis     el text del toast (per a traduir-lo); per defecte,
 *            «“{nom}” encara està en obres.»
 *   enObres  el complement del nom d'una porta inerta; per defecte «(en obres)»
 */
import { useCallback } from 'react';
import { Construction } from 'lucide-react';
import { Link, useNavigate } from '../../../app/contexts/RouterContext';
import { resolRuta } from '../../../app/contexts/politicaRouter.js';
import { esRutaInterna } from '../../../config/objecteConnectable.js';
import { useToast } from '../../universal/NotificationContext.jsx';
import { MAX_PORTES } from './limitsPortes.js';

const EN_OBRES = '(en obres)';
const VARIETATS = new Set(['primari', 'secundari']);
const avisPerDefecte = (nom) => `“${nom}” encara està en obres.`;
const text = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/**
 * W4-07 (auditoria de Codex 261003_1950) · Una ruta de l'app, siga quin siga
 * el protocol de la finestra. Abans es passava per isSafeUrl, que resol
 * contra window.location.origin i només admet http(s): a l'app nativa
 * (capacitor://localhost) la porta /mur quedava inerta. Ara són dues regles
 * que ja existien, sense cap política nova:
 *   · esRutaInterna (config/objecteConnectable.js), el contracte de ruta
 *     interna de Connectar i de Comentar: comença per una sola barra, cap
 *     contrabarra, cap caràcter de control C0 ni DEL, cap espai i 300
 *     caràcters com a molt. Una porta porta una ruta de la taula de l'app;
 *     el límit no hi toca.
 *   · resolRuta (app/contexts/politicaRouter.js), la del router: el camí es
 *     resol sobre una base interna fixa i només val si l'origen no canvia.
 * isSafeUrl no es toca: continua sent la regla de les adreces externes.
 */
export const esRutaDeLaPorta = (desti) => esRutaInterna(desti) && resolRuta(desti) !== null;

/** Les portes netes i com a màxim MAX_PORTES. Idempotent. */
export function normalitzaPortes(portes) {
  if (!Array.isArray(portes)) return [];
  const valides = portes.filter((porta) => porta && text(porta.verb));
  if (valides.length > MAX_PORTES && import.meta.env.DEV) {
    console.warn(`[UniversalCard] Una targeta porta com a màxim ${MAX_PORTES} portes: ${valides.length - MAX_PORTES} no es pinten.`);
  }
  return valides.slice(0, MAX_PORTES).map((porta) => {
    const verb = text(porta.verb);
    const nom = text(porta.nom) || verb;
    return {
      id: text(String(porta.id ?? '')) || verb,
      verb,
      nom,
      desti: esRutaDeLaPorta(porta.desti) ? porta.desti : null,
      varietat: VARIETATS.has(porta.varietat) ? porta.varietat : 'secundari',
      avis: text(porta.avis) || avisPerDefecte(nom),
      enObres: text(porta.enObres) || EN_OBRES
    };
  });
}

/** Obri una porta: navega amb el router de l'app o, si és inerta, ho diu. */
export function useObriPorta() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  return useCallback((porta) => {
    if (!porta) return;
    if (porta.desti) navigate(porta.desti);
    else showToast(porta.avis);
  }, [navigate, showToast]);
}

/* L'espai entre el verb i la resta és un node de text propi: un espai al
   començament del .sdp-sr-only es perd en calcular el nom («Publicaral
   Mur»). Dins de la porta (inline-flex) no es pinta. Les portes són flex i
   el .sdp-sr-only és un bloc (position: absolute): Chrome hi posa un espai,
   i amb «: Compartir vehicle» el nom seria «Publicar : …». Per això, si la
   resta no comença per un espai, el verb visible s'amaga al lector i el nom
   va sencer. */
function TextDeLaPorta({ porta, inerta }) {
  const sufix = inerta ? ` ${porta.enObres}` : '';
  const resta = porta.nom.startsWith(porta.verb) ? porta.nom.slice(porta.verb.length) : null;
  if (resta !== null && (resta === '' || /^\s/.test(resta))) {
    const complement = `${resta}${sufix}`.trim();
    return (
      <>
        <span>{porta.verb}</span>
        {complement ? <>{' '}<span className="sdp-sr-only">{complement}</span></> : null}
      </>
    );
  }
  return (
    <>
      <span aria-hidden="true">{porta.verb}</span>
      <span className="sdp-sr-only">{`${porta.nom}${sufix}`}</span>
    </>
  );
}

function Porta({ porta, obri }) {
  if (porta.desti) {
    return (
      <Link to={porta.desti} className={`sdp-boto sdp-boto--${porta.varietat} sp-card-porta`}>
        <TextDeLaPorta porta={porta} />
      </Link>
    );
  }
  return (
    <button type="button" className="sdp-boto sdp-boto--secundari sp-card-porta" aria-disabled="true" onClick={() => obri(porta)}>
      <TextDeLaPorta porta={porta} inerta />
      <Construction size={18} aria-hidden="true" focusable="false" />
    </button>
  );
}

export function PortesTargeta({ portes }) {
  const obri = useObriPorta();
  const netes = normalitzaPortes(portes);
  if (netes.length === 0) return null;
  return (
    <div className="sp-card-portes">
      {netes.map((porta, index) => <Porta key={`${porta.id}-${index}`} porta={porta} obri={obri} />)}
    </div>
  );
}

/* P6 · Directriu 2325, confirmació 4 · El gran botó d'acció d'una
   UniversalPage, al final del text: la mateixa porta (normalitzaPortes, la
   mateixa frontera de rutes i el mateix nom accessible), a l'ample sencer i a
   la mida gran de Boto (sdp-boto--gran, sdp-boto--ple), en blau. Oberta, un
   Link del router (amb la base de l'amfitrió); inerta, el button
   aria-disabled que avisa amb el toast i no navega. A diferència de la
   targeta, la inerta també és blava: és l'acció de la pàgina i ho diu la
   icona d'obres i el nom («(en obres)»), no el color. */
const CLASSE_DE_PAGINA = 'sdp-boto sdp-boto--primari sdp-boto--gran sdp-boto--ple';

export function PortaDePagina({ porta }) {
  const obri = useObriPorta();
  const [neta] = normalitzaPortes(porta ? [porta] : []);
  if (!neta) return null;
  if (neta.desti) {
    return (
      <Link to={neta.desti} className={CLASSE_DE_PAGINA}>
        <TextDeLaPorta porta={neta} />
      </Link>
    );
  }
  return (
    <button type="button" className={CLASSE_DE_PAGINA} aria-disabled="true" onClick={() => obri(neta)}>
      <TextDeLaPorta porta={neta} inerta />
      <Construction size={20} aria-hidden="true" focusable="false" />
    </button>
  );
}
