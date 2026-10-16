import { useMemo } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataDeFila } from '../../components/universal/editorial.js';
import DocumentPrintPreview from '../../components/universal/DocumentPrintPreview.jsx';
import { AVISOS_TARGETA_VIVA, TargetaViva } from '../../components/universal/TargetaViva.jsx';
import { useAutodesament } from '../../data/autodesament/useAutodesament.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { usePerfil } from './PerfilContext.jsx';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import { documentDeFitxa, menaDeFitxa } from './perfilCamps.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import {
  avatarDeLaBarraDeFitxa, avatarDeLaFitxa, esFitxaDelPilot, etiquetesDeFitxa, pobleDeFitxa, potEditarFitxa, rutaDeFitxaPublica,
} from './fitxaDePerfil.js';

/* ═══════════════════════════════════════════════════════════════════
   LES VISTES · la fitxa fora de l'editor

   Ordre del Mestre (261008) · «Vista A4 / PDF», «Crear portada» i «Vista
   targeta» ixen de l'espai d'edició central i fan un apartat més de la
   segona columna, com «El compte» (el mateix esquelet: UniversalPage de
   context i un BlocPerfil per vista).
     · «Vista A4 / PDF»: DocumentPrintPreview, els dos botons de sempre.
     · «Vista targeta»: la targeta viva en línia, amb l'avís del Perfil.

   L'editor ja no està muntat (documentViu es buida en desmuntar-se): el
   document es refà ací amb documentDeFitxa, a partir de la fitxa del
   servidor i de l'esborrany que la cua d'autodesament encara guarda
   (useAutodesament, la mateixa clau que l'editor). Així el paper i la
   targeta diuen el que la persona ha escrit, encara que el servidor no ho
   haja confirmat. Ni desa ni toca la cua: només la llig.
   ═══════════════════════════════════════════════════════════════════ */

export function DetallVistes({ identitat }) {
  const { autodesament, identitats } = usePerfil() || {};
  const mena = menaDeFitxa(identitat);
  const potEditar = potEditarFitxa(identitat);
  const id = identitat?.id;

  /* La clau de la cua, com la de PerfilEditor: sense àmbit o en lectura, cap. */
  const ref = useMemo(() => (autodesament && potEditar && id != null ? {
    ambit: autodesament.ambit, context: autodesament.context, entitat: ENTITATS_FITXA[mena], id,
  } : null), [autodesament, potEditar, mena, id]);
  const desament = useAutodesament(ref);
  const esborrany = desament?.camps;
  const fitxa = useMemo(
    () => (identitat ? documentDeFitxa(identitat, esborrany || {}) : null),
    [identitat, esborrany],
  );

  /* T35 · Una foto pujada és una referència opaca (sdp-media://) que la barra
     no resol: es resol pel port, com a l'editor. La resta, tal qual.
     Gauntlet 261016 (F1) · La regla de font única de l'editor (Bloc 3.5.4,
     PerfilEditor.jsx: imatgeDeLaFitxa i ambEsborranyDImatge), sobre la
     mateixa fitxa refeta amb l'esborrany de la cua. Abans es llegia
     identitat.avatar, el del servidor: després d'un avatar rebutjat (403),
     «Les vistes» ensenyaven la foto vella mentre l'editor, la barra taronja
     i la targeta viva ensenyaven la nova. Ara, la imatge de la fitxa tal qual
     mentre la cua en guarda un esborrany (pendent o rebutjat, també el buit
     de «Llevar l'avatar»); si no, la de la fitxa o, sense cap, la reserva de
     la identitat. Les proves del 403 de DetallVistes.test.jsx en fixen la
     conducta, la que PerfilEditor.imatges.test.jsx fixa a l'editor.
     Gauntlet 261016 (encàrrec D) · Derogada la còpia: la regla viu a
     fitxaDePerfil.js (avatarDeLaFitxa), la mateixa de l'editor, d'«El compte»
     i de la fitxa compacta de la llista central. */
  const avatarDesat = avatarDeLaFitxa(fitxa, esborrany, identitat);
  /* Prompt 261014_0400 (ordre del Mestre, tasca 4) · La fitxa del pilot, el
     PNG verd oficial a la barra i a la «Vista targeta», com a l'editor: la
     regla viu a fitxaDePerfil.js (avatarDeLaBarraDeFitxa). La resta, tal qual.
     Revisió del prompt 261014_0400 · El logo de la fila del pilot no es pinta:
     no es demana al port (esFitxaDelPilot), com a la fitxa pública. */
  const avatarResolt = useResolvedAsset(esFitxaDelPilot(identitat) ? '' : avatarDesat);
  const avatarBarra = avatarDeLaBarraDeFitxa(identitat, avatarDesat.startsWith('sdp-media://') ? avatarResolt : avatarDesat);
  const poble = pobleDeFitxa(identitat, identitats);
  const nom = identitat?.nom || '';
  /* Onada 8 (261009) · La boina de la targeta porta on la barra taronja: la fitxa pública. */
  const rutaFitxa = identitat ? rutaDeFitxaPublica(identitat) : null;
  const autor = useMemo(() => ({ nom, avatar: avatarBarra, poble, ruta: rutaFitxa }), [nom, avatarBarra, poble, rutaFitxa]);
  const etiquetes = useMemo(() => etiquetesDeFitxa(identitat), [identitat]);

  if (!identitat || !fitxa) return null;

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title="Les vistes"
      lead={`Com es veu la fitxa de ${nom} fora de l’editor: en paper A4 o PDF, i en format targeta.`}
      /* T51 · la data real de la fitxa: creació o última modificació de la fila. */
      {...dataDeFila(identitat.dades)}
      topBarData={{
        authorName: nom,
        authorAvatar: avatarBarra,
        authorLocation: poble,
        /* Ordre del Mestre (261007) · la barra taronja porta a la fitxa pública. */
        authorHref: rutaFitxa,
      }}
    >
      <div className="perfil-compte perfil-vistes">
        <Bloc titol="Vista A4 / PDF">
          <p className="perfil-compte__text">
            La fitxa es prepara al teu dispositiu per a imprimir-la o desar-la com a PDF: sense portada o amb portada.
          </p>
          <div className="perfil-vistes__botons">
            <DocumentPrintPreview document={fitxa} author={nom} />
          </div>
        </Bloc>
        <Bloc titol="Vista targeta">
          <p className="perfil-compte__text">{AVISOS_TARGETA_VIVA.perfil.vista}</p>
          <div className="perfil-vistes__targeta">
            <TargetaViva document={fitxa} autor={autor} etiquetes={etiquetes} avis={AVISOS_TARGETA_VIVA.perfil} />
          </div>
        </Bloc>
      </div>
    </UniversalPage>
  );
}

export default DetallVistes;
