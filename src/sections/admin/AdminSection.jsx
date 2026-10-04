import React, { useState, useEffect, useLayoutEffect } from 'react';
import { User, Building2, ServerCog, ArrowLeft } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import AppGridShell, { useAppGrid } from '../../components/layout/AppGridShell';
import AppGridColumn from '../../components/layout/AppGridColumn';
import { adminListUsers, adminListOrganizations, teCapacitat } from '../../data/backendPort.js';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { Boto, EstatBuit } from '../../components/PedraSeca/index.js';
import { IndicadorsAdmin } from './IndicadorsAdmin.jsx';

/* MD (revisió) · La fletxa ← de la llista d'Usuaris i d'Entitats en estret. */
const TORNAR_AL_TAULER = 'Tornar al Tauler';

/* Higiene d'amfitrió (ordre del Mestre, 261004, front «amfitrio-admin») ·
   Sense la capacitat 'admin' (un node que no l'oferix), cap crida al port:
   l'estat és 'sense-capacitat', com el dels Indicadors (IndicadorsAdmin.jsx).
   Un port que no és a punt i llança també val com a «sense». */
function ambCapacitatAdmin() {
  try {
    return teCapacitat('admin') === true;
  } catch {
    return false;
  }
}

/* Higiene d'amfitrió (261004) · El que es veu quan el node no oferix les
   dades d'administració: un estat buit honest i el camí de tornada al Tauler
   (el menú no és a la vista en esta vista). */
function SenseCapacitat({ icona, que, onBack }) {
  return (
    <EstatBuit icona={icona} titol="Este node no oferix les dades d’administració"
      accio={<Boto varietat="secundari" onClick={onBack}>{TORNAR_AL_TAULER}</Boto>}>
      {`No hi ha cap llista ${que} per mostrar.`}
    </EstatBuit>
  );
}

/* Higiene d'amfitrió (261004) · La crida al port, només amb la capacitat i
   dins de la promesa: una excepció síncrona del port també acaba al .catch.
   Res no s'escriu quan la vista ja s'ha desmuntat. */
function useLlistaAdmin(carrega, textError) {
  const [fase] = useState(() => (ambCapacitatAdmin() ? 'llista' : 'sense-capacitat'));
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (fase === 'sense-capacitat') return undefined;
    let viva = true;
    Promise.resolve()
      .then(() => carrega())
      .then((resultat) => { if (viva) setFiles(resultat); })
      .catch((err) => {
        console.error(err);
        if (viva) setError(textError);
      });
    return () => { viva = false; };
  }, [fase, carrega, textError]);
  return { fase, files, error };
}


function AdminSidebar({ activeTab, setActiveTab }) {
  /* MD (revisió) · En estret el menú és la primera vista del Tauler: «Panell
     General» porta als Indicadors (el detall). En mitja i en ample ja són a
     la vista i no canvia res. */
  const { mida, tancaPanells } = useAppGrid();
  return (
    <aside className="notes-column">
      <AppGridColumn titol="Administració" />
      <div className="notes-list-header univ-manager-toolbar">
        <strong className="sdp-alerta__titol">Mode Administrador</strong>
      </div>

      <div className="notes-column__body no-padding sdp-scrollable" role="navigation" aria-label="Menú d'administració">
        <button
          className={`univ-manager-facet-item ${activeTab === 'dashboard' ? 'univ-manager-facet-item--active' : ''}`}
          onClick={() => {
            setActiveTab('dashboard');
            if (mida === 'estret') tancaPanells();
          }}
        >
          <ServerCog size={18} aria-hidden="true" />
          <span>Panell General</span>
        </button>
        <button 
          className={`univ-manager-facet-item ${activeTab === 'usuaris' ? 'univ-manager-facet-item--active' : ''}`}
          onClick={() => setActiveTab('usuaris')}
        >
          <User size={18} aria-hidden="true" />
          <span>Usuaris</span>
        </button>
        <button 
          className={`univ-manager-facet-item ${activeTab === 'entitats' ? 'univ-manager-facet-item--active' : ''}`}
          onClick={() => setActiveTab('entitats')}
        >
          <Building2 size={18} aria-hidden="true" />
          <span>Entitats</span>
        </button>
      </div>
    </aside>
  );
}

function AdminDashboard() {
  return (
    <div className="sdp-buit">
      <AppGridColumn titol="Tauler" />
      <div className="sdp-buit__text">
        <p>Benvingut a l'administració de Sóc de Poble.</p>
        <div className="sdp-alerta sdp-alerta--info" role="status">
          <p>Nota: Aquesta àrea està restringida a Superadmins. Si no tens permisos a la base de dades, les crides fallaran amb 42501.</p>
        </div>
      </div>
    </div>
  );
}

/* MD (ordre del Mestre, 261003) · El detall d'Usuaris i d'Entitats no porta
   barra blava: en mòbil, la seua capçalera porta la fletxa ← que torna a la
   llista. Només existix quan la closca oferix la tornada (estret, amb el
   detall a la vista): en mitja i en ample, res. Des de la regla del Mestre
   del 261004 (barra taronja a tota pàgina), davall d'esta capçalera va una
   Pàgina Universal sense barra blava (PaginaDelDetall). */
function TornaALaLlista() {
  const { tornaDelDetall } = useAppGrid();
  if (!tornaDelDetall) return null;
  return (
    <button type="button" className="app-grid-col-header__accio-icon" onClick={tornaDelDetall}
      aria-label="Tornar a la llista" title="Tornar a la llista">
      <ArrowLeft size={24} aria-hidden="true" focusable="false" />
    </button>
  );
}

/* sdp-universal-page §5 i regla del Mestre (261004: tota pàgina, també les
   de sistema, porta la barra taronja amb l'autor) · La pàgina d'Usuaris i
   d'Entitats és el detall, la columna dreta: la Pàgina Universal es construïx
   ací dins, mai al voltant del Workspace. Sense barra blava (chrome 'page',
   ordre del Mestre 261003): la capçalera de la columna, amb la fletxa ← en
   estret, és la d'abans, i davall la barra taronja signa Sóc de Poble
   (DEFAULT_AUTHOR de PageFrame, enllaçat a /projecte). El logotip de qui
   signa (norma del Mestre, 261004) queda així dins del detall, en el flux de
   la columna: cap graella absoluta el tapa. */
function PaginaDelDetall({ titol, children }) {
  return (
    <aside className="perfil-detall">
      <AppGridColumn titol={titol} esquerra={<TornaALaLlista />} />
      <UniversalPage>{children}</UniversalPage>
    </aside>
  );
}

/* Higiene d'amfitrió (261004) · UniversalWorkspace crida renderDetail amb
   item null quan no hi ha cap element triat (la llista encara és buida o
   carrega): el detall ho diu, amb la seua capçalera, i no peta. */
function DetallBuit({ titol }) {
  return (
    <PaginaDelDetall titol={titol}>
      <EstatBuit titol="Tria un element" />
    </PaginaDelDetall>
  );
}

/* MD (revisió) · La barra blava del Tauler és la de la UniversalPage que
   embolcalla la closca, fora del seu context. Este pont, fill de la closca,
   li porta la tornada: en estret, amb els Indicadors a la vista, la fletxa ←
   torna al menú. Fora d'això, null: la fletxa de sempre (l'historial). */
function PontDeTornada({ onCanvi }) {
  const { tornaDelDetall } = useAppGrid();
  useLayoutEffect(() => {
    onCanvi(() => tornaDelDetall);
    return () => onCanvi(null);
  }, [onCanvi, tornaDelDetall]);
  return null;
}

/* Regla del Mestre (261004) · Els estats sense Workspace (sense la capacitat,
   l'error) són una pàgina sencera sense graella: porten la seua Pàgina
   Universal, amb la barra taronja. Ací no hi ha cap Workspace que embolcallar
   (sdp-universal-page §5). */
function PaginaDEstat({ children }) {
  return <UniversalPage>{children}</UniversalPage>;
}

function AdminUsersManager({ onBack }) {
  const { fase, files: users, error } = useLlistaAdmin(adminListUsers, 'Error de permisos o de xarxa en carregar usuaris.');

  if (fase === 'sense-capacitat') {
    return <PaginaDEstat><SenseCapacitat icona={User} que="d’usuaris" onBack={onBack} /></PaginaDEstat>;
  }

  if (error) {
    return <PaginaDEstat><div className="sdp-alerta sdp-alerta--error" role="alert">{error}</div></PaginaDEstat>;
  }

  const model = {
    status: 'ready',
    navigationGroups: [],
    items: users.map(u => ({
      id: String(u.id),
      categoryIds: [],
      kind: 'user',
      title: u.email,
      subtitle: `ID: ${u.id}`,
      searchText: `${u.email} ${u.id}`,
      data: u
    }))
  };

  return (
    <UniversalWorkspace
      model={model}
      initialSelection={{}}
      /* MD · En mòbil, primer la llista (no hi ha filtres de navegació), i la
         seua fletxa ← torna al Tauler (revisió: abans s'hi quedava tancada). */
      mestreDetall="navegacio"
      tornaDeLaLlista={onBack}
      labels={{ categories: 'FILTRES', items: 'Administració: Usuaris', back: TORNAR_AL_TAULER }}
      renderDetail={({ item }) => (item ? (
         <PaginaDelDetall titol="Detall de l'Usuari">
           <div className="perfil-detall-buit">
             <h2>{item.data.email}</h2>
             <p className="sdp-camp__ajuda">ID: {item.data.id}</p>
             <p>Alta: {item.data.created_at}</p>
             <p>Últim accés: {item.data.last_sign_in_at}</p>
           </div>
         </PaginaDelDetall>
      ) : <DetallBuit titol="Detall de l'Usuari" />)}
    />
  );
}

function AdminCompaniesManager({ onBack }) {
  const { fase, files: companies, error } = useLlistaAdmin(adminListOrganizations, 'Error de permisos o de xarxa en carregar entitats.');

  if (fase === 'sense-capacitat') {
    return <PaginaDEstat><SenseCapacitat icona={Building2} que="d’entitats" onBack={onBack} /></PaginaDEstat>;
  }

  if (error) {
    return <PaginaDEstat><div className="sdp-alerta sdp-alerta--error" role="alert">{error}</div></PaginaDEstat>;
  }

  const model = {
    status: 'ready',
    navigationGroups: [],
    items: companies.map(c => ({
      id: String(c.id),
      categoryIds: [],
      kind: 'company',
      title: c.name,
      subtitle: c.slug,
      searchText: `${c.name} ${c.slug}`,
      data: c
    }))
  };

  return (
    <UniversalWorkspace
      model={model}
      initialSelection={{}}
      mestreDetall="navegacio"
      tornaDeLaLlista={onBack}
      labels={{ categories: 'FILTRES', items: 'Administració: Entitats', back: TORNAR_AL_TAULER }}
      renderDetail={({ item }) => (item ? (
         <PaginaDelDetall titol="Detall de l'Entitat">
           <div className="perfil-detall-buit">
             <h2>{item.data.name}</h2>
             <p className="sdp-camp__ajuda">ID: {item.data.id} / Slug: {item.data.slug}</p>
             <p>Alta: {item.data.created_at}</p>
             <p>{item.data.description}</p>
           </div>
         </PaginaDelDetall>
      ) : <DetallBuit titol="Detall de l'Entitat" />)}
    />
  );
}

export default function AdminSection() {
  const [activeTab, setActiveTab] = useState('dashboard');
  /* MD (revisió) · La tornada de la closca del Tauler per a la seua barra
     blava (PontDeTornada); null fora d'estret. */
  const [tornada, setTornada] = useState(null);

  /* Regla del Mestre (261004: tota pàgina, també les de sistema, porta la
     barra taronja amb l'autor) · Usuaris i Entitats la porten dins del detall
     (PaginaDelDetall) i als estats sense graella (PaginaDEstat). Derogat
     (sdp-universal-page §5 i norma de logotips, ordre del Mestre, 261004):
     l'embolcall d'ací amb una UniversalPage al voltant del Workspace. Contra
     §5, i el logotip que PageFrame hi posa damunt del contingut quedava davall
     de la graella absoluta. L'arrel torna el Workspace directament. El chrome
     del Tauler no canvia. */
  if (activeTab === 'usuaris') {
    return <AdminUsersManager onBack={() => setActiveTab('dashboard')} />;
  }
  if (activeTab === 'entitats') {
    return <AdminCompaniesManager onBack={() => setActiveTab('dashboard')} />;
  }

  /* El benvingut del Tauler no canvia. Els Indicadors (decisió del Mestre
     261003, «Graphfy») ocupen la columna del detall, que abans era buida.
     MD (revisió) · En estret, la primera vista és el menú (la navegació del
     mòdul), i del detall s'hi torna amb la fletxa blava. En mitja i en ample,
     res no canvia. */
  return (
    <UniversalPage onBack={tornada || undefined}>
      <AppGridShell
        panellEstret="left"
        tornaEstret="left"
        leftColumn={<AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
        middleColumn={<AdminDashboard />}
        rightColumn={<IndicadorsAdmin />}
      >
        <PontDeTornada onCanvi={setTornada} />
      </AppGridShell>
    </UniversalPage>
  );
}
