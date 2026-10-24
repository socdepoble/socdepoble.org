import { useMemo } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataDeFila } from '../../components/universal/editorial.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { ajustosPersona, ajustosOrganitzacio, usePerfilOpcional } from './PerfilContext.jsx';
import DetallAjust from './DetallAjust.jsx';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import { rutaDAutoria, rutaDePerfil } from '../../config/navigation.js';
import { useAutodesament } from '../../data/autodesament/useAutodesament.js';
import { documentDeFitxa, menaDeFitxa } from './perfilCamps.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import { avatarDeLaBarraDeFitxa, avatarDeLaFitxa, deNom, pobleDeFitxa, potEditarFitxa } from './fitxaDePerfil.js';

/* ═══════════════════════════════════════════════════════════════════
   EL COMPTE · el que no és la fitxa pública

   Només els ajustos del catàleg amb `lloc: 'compte'`: correu,
   contrasenya, sessió, estat del perfil i, des del pla 261016 (Bloc 3.1;
   ordre del Mestre), els drets de sèrie de les seues notes per a la
   persona; correu, identificador, membres i eixida per a una organització.
   Els drets de la persona (les meues dades, consentiment i baixa) tenen
   pàgina pròpia a l'espai de treball: DetallPrivacitat, «Privacitat i dades».

   T43 (ordre del Mestre, 260928) · `contacte` és el correu opcional de
   l'organització tal com l'ha llegit PerfilContext (només per a qui
   l'administra). Sense ell, els ajustos del correu es pinten tancats.

   Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de
   portar a la pàgina de l'autor que l'ha creada». La barra taronja d'esta
   pàgina privada porta a la fitxa pública pròpia: la persona, per l'id de
   la seua fila (dades.id, no 'jo'); una organització, per rutaDAutoria
   (l'entitat pilot, al seu perfil, /empresa/socdepoble: Onada 8, 261009;
   abans, /projecte); un agent IA, /perfil/:id.
   Revisió del prompt 261014_0400 (ordre del Mestre) · rutaDeLaFitxa NO és
   la tria de rutaDeFitxaPublica (fitxaDePerfil.js): no llig el slug, i el
   pilot només el reconeix rutaDAutoria pels ids que coneix. El paràgraf
   següent en diu el deute, que es queda així fins que el Mestre decidisca
   l'enllaç. Derogat el motiu de no importar-la: vivia a PerfilEditor, que
   les proves del Perfil substituïxen sencer, i des de la Línia I2 viu a
   fitxaDePerfil.js.

   Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com a
   Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
   oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · El
   compte del pilot porta a la barra taronja el PNG verd oficial, com
   l'editor i «Les vistes»: l'avatar ve d'avatarDeLaBarraDeFitxa
   (fitxaDePerfil.js, que cap prova substituïx). La resta, l'avatar de la
   fila, com abans. Ni el nom, ni el poble, ni rutaDeLaFitxa no canvien: el
   pilot pel slug amb un UUID encara sense registrar continua portant a
   /empresa/:uuid, i no al seu perfil com l'editor (deute conegut, fora de
   l'abast del prompt).

   Ordre del Mestre (261008, grup C) · Una organització tria el seu POBLE
   (els pobles del contingut core, useCoreContent, que sense proveïdor torna
   una llista buida) i, si el port en sap (`ambMembres`, CONTRACTE-4, i el
   context del Perfil present), gestiona els MEMBRES i deixa «Eixir».

   Onada 11 (261010; prompt 261010_1730, tasca 2) · El superadmin (la sessió,
   useSessioOpcional: sense proveïdor, com a les proves, no ho és) té dos
   ajustos més al compte: el segon factor i l'entrada al Tauler. La resta de
   la gent veu el compte d'abans, fila a fila.
   ═══════════════════════════════════════════════════════════════════ */

function rutaDeLaFitxa(identitat) {
  if (identitat.mena === 'persona') return rutaDePerfil('persona', identitat.dades?.id);
  if (identitat.mena === 'agent') return rutaDePerfil('ia', identitat.id);
  return rutaDAutoria({ tipus: identitat.mena === 'grup' ? 'grup' : 'entitat', id: identitat.id });
}

/* P1-11 (pla 261024_2230, T5B-03; G2230-04 de Gemini i reserva de Codex
   1945) · `lloc` tria quins ajustos del catàleg pinta: 'compte' (el de
   sempre) o 'membres', la vista «Membres i connexions» d'una organització
   (perfilModel.js · itemsDePerfil). La mateixa peça per a totes dues (les
   accions de membres, la barra taronja, la data): cap còpia. «Eixir» es queda
   al compte i continua usant les accions de membres. */
const TITOLS = Object.freeze({ compte: 'El compte', membres: 'Membres i connexions' });

export function DetallCompte({ identitat, guardarAjust, pujaMitja, contacte = null, ambMembres = false, lloc = 'compte' }) {
  const persona = identitat?.mena === 'persona';
  /* Una persona no té vista de membres: sempre el seu compte. */
  const llocDelDetall = !persona && lloc === 'membres' ? 'membres' : 'compte';
  const dades = identitat?.dades;
  const { towns } = useCoreContent();
  const perfil = usePerfilOpcional();
  const superadmin = Boolean(useSessioOpcional()?.esSuperadmin);

  /* Les accions de membres, només per a una organització i amb el port que en sap. */
  const usuariId = perfil?.usuari?.id ?? null;
  const llistaMembres = perfil?.llistaMembres;
  const desaMembre = perfil?.desaMembre;
  const llevaMembre = perfil?.llevaMembre;
  const cercaCandidats = perfil?.cercaCandidats;
  const membres = useMemo(() => (
    !persona && ambMembres && perfil?.ambMembres && llistaMembres && desaMembre && llevaMembre && cercaCandidats
      ? { usuariId, llistaMembres, desaMembre, llevaMembre, cercaCandidats }
      : null
  ), [persona, ambMembres, perfil?.ambMembres, usuariId, llistaMembres, desaMembre, llevaMembre, cercaCandidats]);

  /* Gauntlet 261016 (encàrrec D; pla, Onada 1.1.4: «han de beure exactament
     de la mateixa instància de dades») · L'avatar de la barra taronja és la
     imatge de la fitxa amb l'esborrany de la cua (avatarDeLaFitxa,
     fitxaDePerfil.js), el mateix que l'editor, «Les vistes» i la fitxa
     compacta de la llista central. Abans, identitat.avatar, el del servidor:
     després d'un avatar rebutjat (403), «El compte» tornava a la foto vella.
     La clau de la cua és la de l'editor: sense àmbit o en lectura, cap. Ni
     desa ni toca la cua: només la llig. La referència opaca (sdp-media://) la
     resol la barra (BarraTaronja), com abans. */
  const autodesament = perfil?.autodesament;
  const potEditar = potEditarFitxa(identitat);
  const mena = menaDeFitxa(identitat);
  const id = identitat?.id;
  const ref = useMemo(() => (autodesament && potEditar && id != null ? {
    ambit: autodesament.ambit, context: autodesament.context, entitat: ENTITATS_FITXA[mena], id,
  } : null), [autodesament, potEditar, mena, id]);
  const esborrany = useAutodesament(ref).camps;
  const avatarDeLaFila = useMemo(
    () => (identitat ? avatarDeLaFitxa(documentDeFitxa(identitat, esborrany), esborrany, identitat) : ''),
    [identitat, esborrany],
  );

  const ajustos = useMemo(() => {
    const cataleg = persona
      ? ajustosPersona(dades || {}, { superadmin, pobles: towns })
      : ajustosOrganitzacio(dades || {}, contacte, { pobles: towns, ambMembres: Boolean(membres) });
    return cataleg.filter((ajust) => ajust.lloc === llocDelDetall);
  }, [persona, dades, contacte, towns, membres, superadmin, llocDelDetall]);

  if (!identitat) return null;

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title={TITOLS[llocDelDetall]}
      lead={persona
        ? 'Les dades d’accés (correu, contrasenya, sessió i estat del perfil) i els drets de sèrie de les teues notes.'
        : llocDelDetall === 'membres'
          ? `Qui forma part ${deNom(identitat.nom)} i el veïnat connectat amb l’entitat.`
          : `Poble, correu, identificador i eixida de ${identitat.nom}.`}
      /* T51 · la data real del compte: creació o última modificació de la
         fila (profiles o l'organització). */
      {...dataDeFila(dades)}
      topBarData={{
        authorName: identitat.nom,
        authorAvatar: avatarDeLaBarraDeFitxa(identitat, avatarDeLaFila),
        authorLocation: pobleDeFitxa(identitat, perfil?.identitats),
        authorHref: rutaDeLaFitxa(identitat),
      }}
    >
      <div className="perfil-compte">
        {ajustos.map((ajust) => (
          <Bloc key={ajust.id} titol={ajust.titol}>
            <DetallAjust ajust={ajust} identitat={identitat} guardarAjust={guardarAjust} pujaMitja={pujaMitja} membres={membres} />
          </Bloc>
        ))}
      </div>
    </UniversalPage>
  );
}

export default DetallCompte;
