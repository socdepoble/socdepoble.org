/**
 * PublicacionsDeLaFitxa.jsx · P1-11 (pla 261024_2230, T5B-02; Llibre Mestre
 * P1-11, ordre del Mestre 261024 18:21) · Al peu de la fitxa pública d'una
 * persona, una empresa, una entitat o un grup, el seu aparador: el que ha
 * publicat al Mur, al Mercat (l'aparador KM 0 d'un comerç) i a l'Agenda (les
 * convocatòries d'un col·lectiu), en tres pestanyes.
 *
 * Cap peça nova: les Pestanyes de Pedra Seca (les de la pàgina del poble) i,
 * dins de cada una, la vista de l'històric (VistaPublicacionsDeLActor:
 * GraellaTargetes amb TargetaDelMur o TargetaDelMercat, Carregant,
 * EstatErrorDades i el buit amb role=status). Les dades,
 * usePublicacionsDeLaFitxa (el Mur pel port, amb els àlies de la fitxa). Si
 * una targeta remota malformada peta, la barrera de l'històric
 * (SlotErrorBoundary amb FalladaDeLHistoric) ho diu i la fitxa continua.
 *
 * Doctrina del Connectar · Cap botó de seguir: la relació amb la fitxa passa
 * per «Connectar» de la barra (onConnect → /connectar), com sempre.
 *
 * La pestanya oberta d'entrada és la primera que té publicacions (un comerç
 * que només ven obri pel Mercat); quan la persona en tria una, mana la seua.
 */
import { useState } from 'react';
import { Pestanyes } from '../../components/PedraSeca/organismes/Pestanyes.jsx';
import { SlotErrorBoundary } from '../../components/universal/workspace/SlotErrorBoundary.jsx';
import { omple } from '../../config/moderacio.js';
import { useMur } from '../mur/MurContext';
import { FalladaDeLHistoric, VistaPublicacionsDeLActor } from '../mur/PublicacionsDeLActor.jsx';
import { SECCIONS_DE_LA_FITXA, teAparador, usePublicacionsDeLaFitxa } from './usePublicacionsDeLaFitxa.js';

const senseTraduccio = (_clau, reserva) => reserva;

/* Les etiquetes de les pestanyes i el buit de cada una, com a parells [clau, reserva]. */
/* Revisió adversarial 261024 · El buit diu «recent» i «d'este poble»: les
   dades són la finestra del Mur del poble actiu (50 per secció), no
   l'historial; i el títol no porta «de» davant del nom (cap «de Anna»). */
const TEXTOS = Object.freeze({
  mur: {
    etiqueta: ['section.perfil.public.aparador.mur', 'Mur'],
    buit: ['section.perfil.public.aparador.mur.buit', '{nom} no té cap publicació recent al Mur d’este poble.']
  },
  mercat: {
    etiqueta: ['section.perfil.public.aparador.mercat', 'Mercat'],
    buit: ['section.perfil.public.aparador.mercat.buit', '{nom} no té res recent a l’aparador del Mercat d’este poble.']
  },
  events: {
    etiqueta: ['section.perfil.public.aparador.agenda', 'Agenda'],
    buit: ['section.perfil.public.aparador.agenda.buit', '{nom} no té cap acte recent a l’Agenda d’este poble.']
  }
});

/** Els textos de l'aparador d'una fitxa amb el nom `nom` (pur). */
export function textosDeLAparador(nom, t = senseTraduccio) {
  const tradueix = typeof t === 'function' ? t : senseTraduccio;
  const ambNom = (parell) => omple(tradueix(...parell), { nom });
  const comuns = {
    titol: '',
    carregant: tradueix('section.notes.historic.carregant', 'Carregant les publicacions…'),
    error: tradueix('section.notes.historic.error', 'No s’han pogut carregar les publicacions')
  };
  return {
    regio: omple(tradueix('section.perfil.public.aparador.titol', 'El que publica {nom}'), { nom }),
    seccions: Object.fromEntries(SECCIONS_DE_LA_FITXA.map((seccio) => [seccio, {
      etiqueta: tradueix(...TEXTOS[seccio].etiqueta),
      vista: { ...comuns, buit: ambNom(TEXTOS[seccio].buit) }
    }])),
    // La barrera de l'històric (FalladaDeLHistoric) només en llig el títol i l'error.
    fallada: { ...comuns, titol: '' }
  };
}

function AparadorAmbDades({ perfil, textos }) {
  const fonts = usePublicacionsDeLaFitxa(perfil);
  const [triada, setTriada] = useState(null);
  const ambPublicacions = SECCIONS_DE_LA_FITXA.find((seccio) => fonts[seccio].elements.length > 0);
  const activa = triada ?? ambPublicacions ?? SECCIONS_DE_LA_FITXA[0];
  return (
    <Pestanyes
      centrades
      etiqueta={textos.regio}
      activa={activa}
      onCanvi={setTriada}
      pestanyes={SECCIONS_DE_LA_FITXA.map((seccio) => ({
        id: seccio,
        etiqueta: textos.seccions[seccio].etiqueta,
        contingut: (
          <VistaPublicacionsDeLActor seccio={seccio} {...fonts[seccio]} nivell="h3" textos={textos.seccions[seccio].vista} />
        )
      }))}
    />
  );
}

/* Si la fitxa viu dins del Mur de l'App (MurProvider, App.jsx: tota l'App).
   Una peça muntada sola (una prova, el catàleg) rep la reserva de useMur, en
   'loading' per sempre i sense `refresh`: llavors cap aparador, com
   usePaginesDelSistema amb el contingut core (usePublicacionsDeLActor.js). */
export const useHiHaMur = () => typeof useMur()?.refresh === 'function';

/**
 * L'aparador de la fitxa pública `perfil` (el DTO de loadPerfilPublic), o res
 * si la fitxa no en porta (una IA) o no hi ha el Mur de l'App.
 * Revisió adversarial 261024 (lent UI, mitjana) · Va a la ranura
 * `peuDePagina` de PageFrame (FitxaPublica), FORA de l'article: l'Índex, la
 * traducció i el Lector no recullen els títols de les targetes, també les de
 * les pestanyes amagades. La regió amb nom (section.sdp-pagina-peu,
 * etiquetaPeuDePagina) és la del peu; ací només el títol (h2, com el peu de
 * PublicacioDetall) i les pestanyes. Qui munta el peu pregunta abans amb
 * useHiHaMur i teAparador: sense aparador, cap regió buida.
 */
export function PublicacionsDeLaFitxa({ perfil, t = senseTraduccio }) {
  const hiHaMur = useHiHaMur();
  if (!hiHaMur || !teAparador(perfil)) return null;
  const textos = textosDeLAparador(perfil.nom || '', t);
  return (
    <>
      <h2>{textos.regio}</h2>
      <SlotErrorBoundary
        resetKey={`${perfil.tipus}:${perfil.id}`}
        fallback={({ reinicia }) => <FalladaDeLHistoric t={t} textos={textos.fallada} reinicia={reinicia} nivell="h3" />}
      >
        <AparadorAmbDades perfil={perfil} textos={textos} />
      </SlotErrorBoundary>
    </>
  );
}

export default PublicacionsDeLaFitxa;
