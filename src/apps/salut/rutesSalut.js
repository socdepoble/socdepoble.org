/**
 * rutesSalut.js — la taula de rutes de Salut per a ClosaAplicacio (l'esquelet
 * comú de la plataforma). Una sola taula alimenta les tres columnes:
 *   esquerra  PanellEstat, igual a totes (el dia, on són les dades, el 112)
 *   mig       la llista o la línia del temps
 *   detall    el que s'ha triat
 * Paths relatius a /app/salut; el primer tram és una entrada del manifest.
 * Els paràmetres només són dates, UUID i slugs coneguts: mai valors, noms ni notes.
 * `estret`: quina columna es veu primer en un mòbil.
 *
 * En un mòbil, una ruta que obri el mig no ensenya mai el detall. Per això
 * cada detall amb controls o mesures té també la seua ruta «detall»
 * (dies/periodes, dies/:data/resum, resum/mesures, agitacio/patrons), amb les
 * mateixes columnes; el mig hi enllaça només en estret (EnllacDetall). En
 * ample i en mitja les dos rutes es veuen igual.
 */
import { esData, esUuid } from '../plataforma/index.js';
import { IDS_ENTITATS } from './nucli/diccionari.js';
import { dillunsDe } from './nucli/hores.js';
import { IDS_APARTATS } from './textos.js';
import { PanellEstat } from './vistes/comunes.jsx';
import { Apuntar, EditorApunt, LiniaAvui, LiniaJornada, LlistaDies, Periodes, ResumJornada } from './vistes/Diari.jsx';
import { FullMetge, ResumDies } from './vistes/Full.jsx';
import { Alertes, Mesures } from './vistes/Resum.jsx';
import { EpisodiDetall, Episodis, Patrons, ValoracioSetmanal, Valoracions } from './vistes/Agitacio.jsx';
import { ApartatsGuia, CampsEntitat, Entitats, TextGuia } from './vistes/Saber.jsx';
import { AjustosPersona, AvisSalut, CopiaIEsborrat, MenuAjustos } from './vistes/Ajustos.jsx';

/* Els validadors de paràmetres: només el que existix. */
export const esEntitat = (valor) => IDS_ENTITATS.includes(valor);
export const esApartat = (valor) => IDS_APARTATS.includes(valor);
export const esDilluns = (valor) => esData(valor) && dillunsDe(valor) === valor;

const E = PanellEstat;

export const RUTES_SALUT = Object.freeze([
  { path: 'diari', Esquerra: E, Mig: LiniaAvui, Detall: Apuntar, estret: 'detall' },
  { path: 'dies', Esquerra: E, Mig: LlistaDies, Detall: Periodes },
  { path: 'dies/periodes', Esquerra: E, Mig: LlistaDies, Detall: Periodes, estret: 'detall' },
  { path: 'dies/:data', params: { data: esData }, Esquerra: E, Mig: LiniaJornada, Detall: ResumJornada },
  { path: 'dies/:data/resum', params: { data: esData }, Esquerra: E, Mig: LiniaJornada, Detall: ResumJornada, estret: 'detall' },
  { path: 'dies/:data/:apunt', params: { data: esData, apunt: esUuid }, Esquerra: E, Mig: LiniaJornada, Detall: EditorApunt, estret: 'detall' },
  { path: 'full', Esquerra: E, Mig: ResumDies, Detall: FullMetge, estret: 'detall' },
  { path: 'resum', Esquerra: E, Mig: Alertes, Detall: Mesures },
  { path: 'resum/mesures', Esquerra: E, Mig: Alertes, Detall: Mesures, estret: 'detall' },
  { path: 'agitacio', Esquerra: E, Mig: Episodis, Detall: Patrons },
  { path: 'agitacio/patrons', Esquerra: E, Mig: Episodis, Detall: Patrons, estret: 'detall' },
  { path: 'agitacio/setmanal', Esquerra: E, Mig: Valoracions, Detall: ValoracioSetmanal, estret: 'detall' },
  { path: 'agitacio/setmanal/:setmana', params: { setmana: esDilluns }, Esquerra: E, Mig: Valoracions, Detall: ValoracioSetmanal, estret: 'detall' },
  { path: 'agitacio/:apunt', params: { apunt: esUuid }, Esquerra: E, Mig: Episodis, Detall: EpisodiDetall, estret: 'detall' },
  { path: 'guia', Esquerra: E, Mig: ApartatsGuia, Detall: TextGuia, estret: 'detall' },
  { path: 'guia/:apartat', params: { apartat: esApartat }, Esquerra: E, Mig: ApartatsGuia, Detall: TextGuia, estret: 'detall' },
  { path: 'diccionari', Esquerra: E, Mig: Entitats, Detall: CampsEntitat },
  { path: 'diccionari/:entitat', params: { entitat: esEntitat }, Esquerra: E, Mig: Entitats, Detall: CampsEntitat, estret: 'detall' },
  { path: 'persona', Esquerra: E, Mig: MenuAjustos, Detall: AjustosPersona, estret: 'detall' },
  { path: 'copia', Esquerra: E, Mig: MenuAjustos, Detall: CopiaIEsborrat, estret: 'detall' },
  { path: 'avis', Esquerra: E, Mig: MenuAjustos, Detall: AvisSalut, estret: 'detall' }
]);
