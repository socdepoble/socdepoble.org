import React, { useState, useEffect, useLayoutEffect } from 'react';
import { User, Building2, ServerCog, ArrowLeft } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import AppGridShell, { useAppGrid } from '../../components/layout/AppGridShell';
import AppGridColumn from '../../components/layout/AppGridColumn';
import { adminListUsers, adminListOrganizations } from '../../data/backendPort.js';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';
import { IndicadorsAdmin } from './IndicadorsAdmin.jsx';

/* MD (revisió) · La fletxa ← de la llista d'Usuaris i d'Entitats en estret. */
const TORNAR_AL_TAULER = 'Tornar al Tauler';


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

/* MD (ordre del Mestre, 261003) · El detall d'Usuaris i d'Entitats no és una
   Pàgina Universal (no porta barra blava): en mòbil, la seua capçalera porta
   la fletxa ← que torna a la llista. Només existix quan la closca oferix la
   tornada (estret, amb el detall a la vista): en mitja i en ample, res. */
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

function AdminUsersManager({ onBack }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    adminListUsers()
      .then(setUsers)
      .catch(err => {
        console.error(err);
        setError("Error de permisos o de xarxa en carregar usuaris.");
      });
  }, []);

  if (error) {
    return <div className="sdp-alerta sdp-alerta--error" role="alert">{error}</div>;
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
      renderDetail={({ item }) => (
         <aside className="perfil-detall">
           <AppGridColumn titol="Detall de l'Usuari" esquerra={<TornaALaLlista />} />
           <div className="perfil-detall-buit">
             <h2>{item.data.email}</h2>
             <p className="sdp-camp__ajuda">ID: {item.data.id}</p>
             <p>Alta: {item.data.created_at}</p>
             <p>Últim accés: {item.data.last_sign_in_at}</p>
           </div>
         </aside>
      )}
    />
  );
}

function AdminCompaniesManager({ onBack }) {
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    adminListOrganizations()
      .then(setCompanies)
      .catch(err => {
        console.error(err);
        setError("Error de permisos o de xarxa en carregar entitats.");
      });
  }, []);

  if (error) {
    return <div className="sdp-alerta sdp-alerta--error" role="alert">{error}</div>;
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
      renderDetail={({ item }) => (
         <aside className="perfil-detall">
           <AppGridColumn titol="Detall de l'Entitat" esquerra={<TornaALaLlista />} />
           <div className="perfil-detall-buit">
             <h2>{item.data.name}</h2>
             <p className="sdp-camp__ajuda">ID: {item.data.id} / Slug: {item.data.slug}</p>
             <p>Alta: {item.data.created_at}</p>
             <p>{item.data.description}</p>
           </div>
         </aside>
      )}
    />
  );
}

export default function AdminSection() {
  const [activeTab, setActiveTab] = useState('dashboard');
  /* MD (revisió) · La tornada de la closca del Tauler per a la seua barra
     blava (PontDeTornada); null fora d'estret. */
  const [tornada, setTornada] = useState(null);

  if (activeTab === 'usuaris') return <AdminUsersManager onBack={() => setActiveTab('dashboard')} />;
  if (activeTab === 'entitats') return <AdminCompaniesManager onBack={() => setActiveTab('dashboard')} />;

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
