/**
 * usePublicacionsDeLaFitxa.js · P1-11 (pla 261024_2230, T5B-02; Llibre
 * Mestre P1-11, ordre del Mestre 261024 18:21) · El que una persona, una
 * empresa, una entitat o un grup ha publicat al Mur, al Mercat i a l'Agenda,
 * per al peu de la seua fitxa pública (PerfilPublicSection · FitxaPublica):
 * l'aparador KM 0 d'un comerç i les convocatòries d'un col·lectiu.
 *
 * Cap petició nova i cap DTO nou (reserva de Codex 1945): les dades són les
 * del Mur (useMur, pel port) i la forma, la de l'històric de l'actor
 * (usePublicacionsDelsAlies → publicacionsDeLaSeccio: { id, item,
 * esdeveniment }), la que pinta VistaPublicacionsDeLActor. Contingut públic:
 * també el veu el Foraster.
 *
 * De qui és cada publicació ho diuen els àlies de la FITXA (aliesDeLaFitxa),
 * no els de l'actor actiu: el seu id i, per a una de les tres identitats del
 * Mestre reconeguda pel seu id o per l'id remot declarat (identitatsSeed.js ·
 * fundacionalDeLaClau i clauFundacional), els àlies que declara la llavor. Mai
 * pel slug ni pel nom, que qualsevol organització d'un altre poble podria
 * registrar (auditoria de seguretat 261019, F6): una empresa amb el slug
 * «socdepoble» no s'emporta les publicacions del projecte. A més, només el que
 * signa una identitat del mateix tipus (tipusAutor): una persona i una entitat
 * amb el mateix id no es barregen. Una IA no publica: cap àlies.
 *
 * Límit conegut (el de l'històric de l'actor) · En remot el port porta les
 * 50 darreres publicacions de cada secció del poble: l'aparador és una
 * finestra, no l'historial sencer.
 */
import { useMemo, useSyncExternalStore } from 'react';
import { esEntitatDelProjecte, subscriuEntitatDelProjecte, versioEntitatDelProjecte } from '../../config/navigation.js';
import {
  ENTITAT_PILOT_ID, ENTITAT_PILOT_SLUG, PERSONA_PILOT, clauFundacional, entitatSeed, fundacionalDeLaClau
} from '../../data/identitatsSeed.js';
import { usePublicacionsDelsAlies } from '../mur/usePublicacionsDeLActor.js';

const CAP_ALIES = Object.freeze(new Set());
const textNet = (valor) => (valor == null ? '' : String(valor).trim());

/** Les seccions de l'aparador, en l'ordre de les pestanyes. */
export const SECCIONS_DE_LA_FITXA = Object.freeze(['mur', 'mercat', 'events']);

/** Si la fitxa `perfil` porta aparador: una persona, una entitat o un grup (mai una IA). */
export const teAparador = (perfil) => ['persona', 'entitat', 'grup'].includes(perfil?.tipus) && !perfil?.esIA
  && textNet(perfil?.id) !== '';

/** El tipus d'autoria (autorDe) que signa amb la fitxa: 'persona' o 'entitat'; null per a una IA. */
export const tipusAutorDeLaFitxa = (perfil) => (perfil?.tipus === 'persona' ? 'persona'
  : perfil?.tipus === 'entitat' || perfil?.tipus === 'grup' ? 'entitat' : null);

/**
 * Els identificadors amb què signa la fitxa pública `perfil` ({ tipus, id }).
 * Pura. Un Set nou, o el buit congelat si la fitxa no publica.
 */
export function aliesDeLaFitxa(perfil) {
  const id = textNet(perfil?.id);
  if (!id || !teAparador(perfil)) return CAP_ALIES;
  const alies = new Set([id]);
  if (perfil.tipus === 'persona') {
    /* Només per l'id (o l'id remot declarat), mai pel slug. */
    if (fundacionalDeLaClau(id) === PERSONA_PILOT.slug) PERSONA_PILOT.alies.forEach((a) => alies.add(String(a)));
    return alies;
  }
  const fundacional = clauFundacional({ tipus: perfil.tipus, id });
  /* Revisió adversarial 261024 · En remot, l'id del projecte és el del
     servidor (un UUID): el reconeix el registre de l'entitat del projecte
     (registraEntitatDelProjecte, pel slug i dins del poble actiu, F6), el
     mateix en què ja confien esElProjecte i rutaDAutoria. Mai el slug de la fila. */
  const delProjecte = perfil.tipus === 'entitat' && esEntitatDelProjecte({ tipus: 'entitat', id });
  const llavor = entitatSeed(id)
    || (fundacional && fundacional !== PERSONA_PILOT.slug ? entitatSeed(fundacional) : null)
    || (delProjecte ? entitatSeed(ENTITAT_PILOT_ID) : null);
  if (llavor) {
    alies.add(String(llavor.id));
    if (llavor.slug === ENTITAT_PILOT_SLUG) alies.add(ENTITAT_PILOT_SLUG);
    (llavor.alies || []).forEach((a) => alies.add(String(a)));
  }
  return alies;
}

/**
 * Les publicacions de la fitxa `perfil` per secció: { mur, mercat, events },
 * cadascuna { elements, estat, error, refresh } (la font de
 * VistaPublicacionsDeLActor). Sense aparador, res es calcula.
 */
export function usePublicacionsDeLaFitxa(perfil) {
  const actiu = teAparador(perfil);
  const id = textNet(perfil?.id);
  const tipus = perfil?.tipus;
  const esIA = Boolean(perfil?.esIA);
  /* L'id remot del projecte pot arribar després (useEntitatDelProjecte): es torna a calcular. */
  const versioDelProjecte = useSyncExternalStore(subscriuEntitatDelProjecte, versioEntitatDelProjecte, versioEntitatDelProjecte);
  /* Per la identitat de la fitxa (tipus, id), no per l'objecte: la fitxa
     arriba com un objecte nou a cada càrrega. */
  const alies = useMemo(
    () => aliesDeLaFitxa({ tipus, id, esIA }),
    [tipus, id, esIA, versioDelProjecte] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const tipusAutor = tipusAutorDeLaFitxa({ tipus });
  const opcions = { actiu, tipusAutor };
  const mur = usePublicacionsDelsAlies('mur', alies, opcions);
  const mercat = usePublicacionsDelsAlies('mercat', alies, opcions);
  const events = usePublicacionsDelsAlies('events', alies, opcions);
  return useMemo(() => ({ mur, mercat, events }), [mur, mercat, events]);
}
