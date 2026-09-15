import React, { useState, useEffect } from 'react';
import { User, Building2, ServerCog, ArrowLeft } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import AppGridShell from '../../components/layout/AppGridShell';
import AppGridColumn from '../../components/layout/AppGridColumn';
import { adminListUsers, adminListOrganizations } from '../../data/backendPort.js';
import { UniversalWorkspace } from '../../components/universal/workspace/UniversalWorkspace.jsx';

const usersManagerConfig = {
  facets: [],
  getItemId: (u) => u.id,
  getItemSearchText: (u) => `${u.email} ${u.id}`,
  getItemCard: (u) => ({ title: u.email, subtitle: `ID: ${u.id}`, meta: u.created_at })
};

const companiesManagerConfig = {
  facets: [],
  getItemId: (c) => c.id,
  getItemSearchText: (c) => `${c.name} ${c.slug}`,
  getItemCard: (c) => ({ title: c.name, subtitle: c.slug, description: c.description })
};

function AdminSidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="notes-column">
      <AppGridColumn titol="Administració" />
      <div className="notes-list-header univ-manager-toolbar">
        <strong className="sdp-alerta__titol">Mode Administrador</strong>
      </div>
      
      <div className="notes-column__body no-padding sdp-scrollable" role="navigation" aria-label="Menú d'administració">
        <button 
          className={`univ-manager-facet-item ${activeTab === 'dashboard' ? 'univ-manager-facet-item--active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
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

  return (
    <UniversalWorkspace
      pageTitle="Administració: Usuaris"
      items={users}
      facets={usersManagerConfig.facets}
      getItemId={usersManagerConfig.getItemId}
      getItemSearchText={usersManagerConfig.getItemSearchText}
      getItemCard={usersManagerConfig.getItemCard}
      renderEditor={(item) => (
         <aside className="perfil-detall">
           <AppGridColumn titol="Detall de l'Usuari" />
           <div className="perfil-detall-buit">
             <h2>{item.email}</h2>
             <p className="sdp-camp__ajuda">ID: {item.id}</p>
             <p>Alta: {item.created_at}</p>
             <p>Últim accés: {item.last_sign_in_at}</p>
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

  return (
    <UniversalWorkspace
      pageTitle="Administració: Entitats"
      items={companies}
      facets={companiesManagerConfig.facets}
      getItemId={companiesManagerConfig.getItemId}
      getItemSearchText={companiesManagerConfig.getItemSearchText}
      getItemCard={companiesManagerConfig.getItemCard}
      renderEditor={(item) => (
         <aside className="perfil-detall">
           <AppGridColumn titol="Detall de l'Entitat" />
           <div className="perfil-detall-buit">
             <h2>{item.name}</h2>
             <p className="sdp-camp__ajuda">ID: {item.id} / Slug: {item.slug}</p>
             <p>Alta: {item.created_at}</p>
             <p>{item.description}</p>
           </div>
         </aside>
      )}
    />
  );
}

export default function AdminSection() {
  const [activeTab, setActiveTab] = useState('dashboard');

  if (activeTab === 'usuaris') return <AdminUsersManager onBack={() => setActiveTab('dashboard')} />;
  if (activeTab === 'entitats') return <AdminCompaniesManager onBack={() => setActiveTab('dashboard')} />;

  return (
    <UniversalPage>
      <AppGridShell
        leftColumn={<AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
        middleColumn={<AdminDashboard />}
        rightColumn={null}
      />
    </UniversalPage>
  );
}
