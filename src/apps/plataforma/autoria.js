/**
 * Plataforma d'Apps Enxufables · l'autoria de les targetes d'una app.
 *
 * Ordre del Mestre, 261004 (REGLA D'OR 1) · Tota UniversalCard porta la seua
 * boina taronja amb l'autor real, enllaçat a la seua pàgina. Una app no pot
 * llegir config/ ni data/ (fronteres.test.js): la plataforma li dona la boina
 * d'una identitat resolta per IDENTIFICADOR, amb rutaDAutoria de
 * config/navigation.js (la mateixa font de les targetes, de les pàgines i del
 * detall: l'entitat pilot porta al seu perfil, /empresa/socdepoble, des de
 * l'Onada 8, 261009; abans, a la pàgina del projecte), mai pel nom que es
 * veu.
 *
 *   ENTITAT_PROJECTE   { tipus: 'entitat', id }: l'entitat Sóc de Poble, que
 *                      publica el catàleg que porten les apps internes
 *   autoriaDe(autor)   la boina { nom, poble, avatar, href } d'una identitat
 *                      { tipus, id } que la plataforma coneix, o null
 *
 * Avui la plataforma només coneix l'entitat del projecte (el padró pilot,
 * identitatsSeed.js). La identitat de la persona (nom, avatar i perfil) no
 * arriba a les apps: cap sessió ni perfil travessa la frontera, i un autor
 * que no es coneix no s'inventa (null). Derogat EN PART per l'ordre del
 * Mestre del 13-10-2026 (pla 261013_1405, front B: la boina de la Gestoria
 * porta el titular de la sessió): una app interna que declara
 * permisos.titular 'sessio' al manifest rep pel pont de sessió
 * (useSessioApp().titular) el nom, l'avatar i el poble de la persona que ha
 * entrat, filtrats (titularNet, sessioApp.js), i mai el seu id ni el seu
 * perfil. La resta d'apps continua sense rebre res de la persona, i esta
 * funció continua sense resoldre cap persona.
 * La forma és la de l'autoria de PaginaApp ({ nom, avatar, href, poble }).
 * L'avatar és el camí propi del paquet: UniversalCard el resol amb la base de
 * recursos en pintar-lo (resolRecursPropi), no ací.
 */
import { rutaDAutoria } from '../../config/navigation.js';
import { ENTITAT_PILOT_ID, entitatSeed } from '../../data/identitatsSeed.js';

export const ENTITAT_PROJECTE = Object.freeze({ tipus: 'entitat', id: ENTITAT_PILOT_ID });

/** La boina d'una identitat coneguda ({ tipus, id }), resolta per identificador; null si no se sap qui és. */
export function autoriaDe(autor) {
  if (autor?.tipus !== 'entitat' || autor.id == null) return null;
  const entitat = entitatSeed(autor.id);
  const href = entitat ? rutaDAutoria({ tipus: 'entitat', id: entitat.id }) : null;
  if (!entitat || !href) return null;
  return Object.freeze({ nom: entitat.name, poble: entitat.town_name || '', avatar: entitat.logo_url || '', href });
}
