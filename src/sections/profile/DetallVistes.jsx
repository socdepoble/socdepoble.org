import { useMemo } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataDeFila } from '../../components/universal/editorial.js';
import DocumentPrintPreview from '../../components/universal/DocumentPrintPreview.jsx';
import { AVISOS_TARGETA_VIVA, TargetaViva } from '../../components/universal/TargetaViva.jsx';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../config/moderacio.js';
import { useAutodesament } from '../../data/autodesament/useAutodesament.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { usePerfil } from './PerfilContext.jsx';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import { documentDeFitxa, menaDeFitxa } from './perfilCamps.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import {
  avatarDeLaBarraDeFitxa, avatarDeLaFitxa, esFitxaDelPilot, etiquetesDeFitxa, pobleDeFitxa, potEditarFitxa, rutaDeFitxaPublica,
} from './fitxaDePerfil.js';

const p = (nom, reserva) => Object.freeze([`section.perfil.vistes.${nom}`, reserva]);
export const TEXTOS_DETALL_VISTES = Object.freeze({
  titol: p('titol', 'Les vistes'),
  lead: p('lead', 'Com es veu la fitxa de {nom} fora de l’editor: en paper A4 o PDF, i en format targeta.'),
  a4Titol: p('a4Titol', 'Vista A4 / PDF'),
  a4Text: p('a4Text', 'La fitxa es prepara al teu dispositiu per a imprimir-la o desar-la com a PDF: sense portada o amb portada.'),
  targetaTitol: p('targetaTitol', 'Vista targeta'),
});

export function DetallVistes({ identitat }) {
  const t = useTraductorOpcional();
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

  const avatarDesat = avatarDeLaFitxa(fitxa, esborrany, identitat);
  const avatarResolt = useResolvedAsset(esFitxaDelPilot(identitat) ? '' : avatarDesat);
  const avatarBarra = avatarDeLaBarraDeFitxa(identitat, avatarDesat.startsWith('sdp-media://') ? avatarResolt : avatarDesat);
  const poble = pobleDeFitxa(identitat, identitats);
  const nom = identitat?.nom || '';
  /* Onada 8 (261009) · La boina de la targeta porta on la barra taronja: la fitxa pública. */
  const rutaFitxa = identitat ? rutaDeFitxaPublica(identitat) : null;
  const autor = useMemo(() => ({ nom, avatar: avatarBarra, poble, ruta: rutaFitxa }), [nom, avatarBarra, poble, rutaFitxa]);
  const etiquetes = useMemo(() => etiquetesDeFitxa(identitat, t), [identitat, t]);

  if (!identitat || !fitxa) return null;

  return (
    <UniversalPage
      /* Decisions 261030 §7 · La fitxa de la persona, des del seu espai: Traduir no envia res fora. */
      traduccio={false}
      chrome="context"
      layout="contained"
      title={tradueix(t, TEXTOS_DETALL_VISTES.titol)}
      lead={omple(tradueix(t, TEXTOS_DETALL_VISTES.lead), { nom })}
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
        <Bloc titol={tradueix(t, TEXTOS_DETALL_VISTES.a4Titol)}>
          <p className="perfil-compte__text">
            {tradueix(t, TEXTOS_DETALL_VISTES.a4Text)}
          </p>
          <div className="perfil-vistes__botons">
            <DocumentPrintPreview document={fitxa} author={nom} />
          </div>
        </Bloc>
        <Bloc titol={tradueix(t, TEXTOS_DETALL_VISTES.targetaTitol)}>
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
