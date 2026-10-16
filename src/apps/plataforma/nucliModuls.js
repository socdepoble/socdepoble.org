/**
 * Plataforma d'Apps Enxufables · el nucli dels mòduls (SocDePoble.nucli,
 * contracte sdp.modul.v1 i ADR-2026-12).
 *
 * L'objecte congelat que el cos d'un mòdul fa servir en lloc de portar el
 * seu React, la seua plataforma, la seua Pedra Seca i el seu espai de
 * treball (1.2.0): les instàncies de la
 * pàgina, les úniques amb què els hooks i els contexts funcionen. Les
 * portes i els noms són els de contracteNucli.js (nucliModuls.test.js els
 * contrasta).
 *
 * Este fitxer NO és al tros d'entrada: carregaModul.js el demana amb
 * import() la primera vegada que un mòdul el necessita. Fins llavors el
 * paquet no paga res per ell, i SocDePoble.nucli val null.
 *
 * Cap port del backend, cap SessionContext ni IdentitatContext
 * (fronteres.test.js en vigila la clausura).
 */
import * as ReactDelNucli from 'react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import {
  Link, NavLink, Navigate, Route, Routes, matchPath, useLocation, useNavigate, useParams, useRouter, useSearchParams
} from '../../app/contexts/RouterContext';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { ControlContrasenya } from '../../components/PedraSeca/atoms/ControlContrasenya.jsx';
import { ActionControl, DateTimeControl, IconButton } from '../../components/PedraSeca/atoms/controls.jsx';
import { Carregant, EstatBuit, Esquelet, Progres } from '../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { Fila, Pila } from '../../components/PedraSeca/composicio/index.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { PillToggle } from '../../components/PedraSeca/molecules/PillToggle.jsx';
import { Accordion, AccordionItem } from '../../components/PedraSeca/organismes/Accordion.jsx';
import { AfegitRapid } from '../../components/PedraSeca/organismes/AfegitRapid.jsx';
import { ESTATS_ARTICLE, TEXTOS_ESTAT_LINIA, estatLinia, mouCategoria } from '../../components/PedraSeca/organismes/articles.js';
import { BarraResum } from '../../components/PedraSeca/organismes/BarraResum.jsx';
import { DetallArticle } from '../../components/PedraSeca/organismes/DetallArticle.jsx';
import { Dialeg, DialegConfirmacio } from '../../components/PedraSeca/organismes/Dialeg.jsx';
import {
  AreaText, Camp, CampFitxer, CampText, Casella, GrupCamps, GrupOpcions, Interruptor, Selector
} from '../../components/PedraSeca/organismes/formulari.jsx';
import { GraellaArticles } from '../../components/PedraSeca/organismes/GraellaArticles.jsx';
import { GraellaTargetes } from '../../components/PedraSeca/organismes/GraellaTargetes.jsx';
import { Histograma, nivellHistograma } from '../../components/PedraSeca/organismes/Histograma.jsx';
import { LiniaDelTemps } from '../../components/PedraSeca/organismes/LiniaDelTemps.jsx';
import { LiniesColleccio } from '../../components/PedraSeca/organismes/LiniesColleccio.jsx';
import { LlistaArticles } from '../../components/PedraSeca/organismes/LlistaArticles.jsx';
import { MarcColumna } from '../../components/PedraSeca/organismes/MarcColumna.jsx';
import { NavegacioPeriode } from '../../components/PedraSeca/organismes/NavegacioPeriode.jsx';
import { PaginaApp } from '../../components/PedraSeca/organismes/PaginaApp.jsx';
import { Pestanyes } from '../../components/PedraSeca/organismes/Pestanyes.jsx';
import { OrdenaCategories, SelectorCategoria } from '../../components/PedraSeca/organismes/SeccionsCategoria.jsx';
import { TargetesColleccions } from '../../components/PedraSeca/organismes/TargetesColleccions.jsx';
import { Taula } from '../../components/PedraSeca/organismes/Taula.jsx';
import { TeclatNumeric } from '../../components/PedraSeca/organismes/TeclatNumeric.jsx';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';
import { UniversalTPV } from '../../components/PedraSeca/organismes/UniversalTPV.jsx';
/* Nucli 1.2.0 (261016): l'espai de treball, per la seua façana (la font única de la porta). */
import { DefaultItemCard, UniversalWorkspace } from '../../components/universal/workspace/index.js';
import * as plataformaDelNucli from './index.js';
import { VERSIO_NUCLI } from './contracteNucli.js';

/* Un espai de noms d'un mòdul ES no es pot congelar (les seues propietats
   són enllaços vius): se'n fa una còpia plana i congelada. */
const copiaCongelada = (espai) => Object.freeze({ ...espai });

export const NUCLI = Object.freeze({
  versio: VERSIO_NUCLI,
  React: copiaCongelada(ReactDelNucli),
  jsxRuntime: Object.freeze({ Fragment, jsx, jsxs }),
  router: Object.freeze({
    Link, NavLink, Navigate, Route, Routes, matchPath, useLocation, useNavigate, useParams, useRouter, useSearchParams
  }),
  plataforma: copiaCongelada(plataformaDelNucli),
  pedraSeca: Object.freeze({
    Accordion, AccordionItem, ActionControl, AfegitRapid, Alerta, AreaText, BarraResum, Boto, Camp, CampFitxer, CampText, Carregant,
    Casella, ControlContrasenya, DateTimeControl, DetallArticle, Dialeg, DialegConfirmacio, ESTATS_ARTICLE, EstatBuit, Esquelet,
    Fila, GraellaArticles, GraellaTargetes, GrupCamps, GrupOpcions, Histograma, IconButton, Insignia, Interruptor, LiniaDelTemps,
    LiniesColleccio, LlistaArticles, MarcColumna, NavegacioPeriode, OrdenaCategories, PaginaApp, Pestanyes, Pila, PillToggle,
    Progres, Selector, SelectorCategoria, TEXTOS_ESTAT_LINIA, TargetesColleccions, Taula, TeclatNumeric, UniversalCard,
    UniversalTPV, estatLinia, mouCategoria, nivellHistograma
  }),
  workspace: Object.freeze({ DefaultItemCard, UniversalWorkspace })
});
