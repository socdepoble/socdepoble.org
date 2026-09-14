---
tipus: document
estat: esborrany
description: 1. src/sections/realitat/RealitatSection.jsx
---
Hola Perplexity,

Tens tota la raó respecte a la seguretat dels components, però els arxius que demanes (Mur, Devices i Onboarding) ja han estat refactoritzats per Gemini i Claude mentre discutíem!

No obstant això, **ens queda l'última bossa de resistència** de l'herència Tailwind. Si obrim el fitxer `utilities.css`, encara queden 5 xicotets components (Realitat, Cerca, Traduccions, i Controls) que tenen classes absolutament innecessàries (com `realitat-btn`, `search-wrapper`, `trans-container`, `xatctrl-container`, `ctl-main-container`).

La teua missió és **agafar aquests 5 components restants i netejar-los completament**, substituint aquestes "utilitats" per la pura arquitectura semàntica de *Pedra Seca* (ex: `sdp-camp`, `sdp-buit`, `sdp-boto`, `content-wrapper`, `sdp-accions`). 

A continuació et pose el codi font JSX sencer dels 5 components afectats perquè els pugues processar amb total seguretat. Retorna'm exclusivament els blocs de codi JSX refactoritzats. Zero Yapping.

---

### 1. `src/sections/realitat/RealitatSection.jsx`
```jsx
import React, { useEffect, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { AGENTS } from '../profile/agentsSeed';
import { resolveAsset } from '../../config/assetResolver';
import { getVal, setVal } from '../../config/storage.js';
import { useUIActions } from '../../app/contexts/UIContext';

export default function RealitatSection() {
  const { t } = useUIActions();
  const [level, setLevel] = useState(() => {
    return parseInt(getVal('socdepoble-iaia-level', '1'), 10);
  });
  
  const [selectedCompanions, setSelectedCompanions] = useState(() => {
    return getVal('socdepoble-iaia-companions', []);
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setVal('socdepoble-iaia-level', level.toString());
      setVal('socdepoble-iaia-companions', selectedCompanions);
    }
  }, [level, selectedCompanions]);

  const toggleCompanion = (id) => {
    setSelectedCompanions(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const aiAgents = AGENTS.filter(a => a.type === 'AI' || a.type === 'MASTER');

  return (
    <UniversalPage
      title={t('section.realitat.title', 'Selector de Realitat')}
      subtitle={t('section.realitat.subtitle', "Configura el teu nivell d'interacció amb la IAIA MarIA i els Acompanyants.")}
      chrome="system"
      showLogos={false}
    >
      <div className="stack-grid realitat-container">
        {[
          { id: 0, label: 'Apagada', desc: 'Sense intervenció de la intel·ligència artificial.' },
          { id: 1, label: 'Passiva', desc: 'Només recomanacions i accions a petició teua.' },
          { id: 2, label: 'Interactiva (Selecció)', desc: 'Conversa activa amb acompanyants específics.' },
          { id: 3, label: 'Connexió Total', desc: 'Connexió total amb tots els agents de la Masia.' }
        ].map((lvl) => (
          <div key={lvl.id} className="-col">
            <button
              onClick={() => setLevel(lvl.id)}
              className={`card realitat-btn ${level === lvl.id ? 'card--accent' : 'card--hover'}`}
            >
              <div className="card__body">
                <h3 className="card__title">
                  Nivell {lvl.id}: {lvl.label}
                </h3>
                <p className="card__text">
                  {lvl.desc}
                </p>
              </div>
            </button>
            
            {level === 2 && lvl.id === 2 && (
              <div className="card card--soft ">
                <div className="card__body">
                  <h4 className="section-title">
                    Tria els teus acompanyants:
                  </h4>
                  <div className="stack-grid">
                  {aiAgents.map(agent => {
                    const isSelected = selectedCompanions.includes(agent.id);
                    return (
                      <label key={agent.id} className="realitat-agent-label">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleCompanion(agent.id)}
                          className="realitat-agent-checkbox"
                        />
                        <img 
                          src={resolveAsset(agent.avatar_url)} 
                          alt={agent.name}
                          className="realitat-agent-avatar"
                        />
                        <div className="-col">
                          <strong className="realitat-agent-name">{agent.name}</strong>
                          <span className="realitat-agent-role">{agent.role}</span>
                        </div>
                      </label>
                    );
                  })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </UniversalPage>
  );
}
```

### 2. `src/sections/search/SearchSection.jsx`
```jsx
import { useDeferredValue, useMemo, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard } from '../../components/universal/UniversalElements';
import { UniversalSearch } from '../../components/ui/UniversalSearch.jsx';
import { resolveItemPath } from '../../config/navigation';
import { useUIActions } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useMur } from '../mur/MurContext';
import { useXat } from '../xat/XatContext';

export default function SearchSection() {
  const { normalizeSearchText, t } = useUIActions();
  const core = useCoreContent();
  const mur = useMur();
  const xat = useXat();
  
  const globalSearchItems = useMemo(() => [
    ...(core.agents || []),
    ...(xat.chatThreads || []),
    ...(mur.feedPosts || []),
    ...(mur.marketItems || []),
    ...(mur.events || []),
    ...(core.towns || [])
  ], [core.agents, xat.chatThreads, mur.feedPosts, mur.marketItems, mur.events, core.towns]);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const term = normalizeSearchText(deferredQuery);
    if (!term) {
      return [];
    }
    return globalSearchItems.filter((item) => item.searchText.includes(term)).slice(0, 24);
  }, [deferredQuery, globalSearchItems, normalizeSearchText]);

  return (
    <UniversalPage
      title={t('section.search.title', 'Cercador Universal')}
      subtitle={t('section.search.subtitle', 'Busca persones, pobles, publicacions i pàgines en un sol lloc')}
      chrome="system"
      showLogos={true}
    >
      <div className="search-wrapper">
        <UniversalSearch
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('section.search.searchPlaceholder', 'Cerca persones, pobles, posts...')}
          ariaLabel={t('section.search.searchPlaceholder', 'Cerca persones, pobles, posts...')}
        />
      </div>

      <div className="search-results">
        {results.map((item) => {
          const path = resolveItemPath(item);
          const content = item.role || item.post_subtitle || item.content || item.message;
          const sectionId = item.sectionId || t('section.search.resultLabel', 'Resultat');
          
          return (
            <UniversalCard
              key={`${sectionId}-${item.id}`}
              title={item.name || item.title}
              subtitle={content?.substring(0, 100) + (content?.length > 100 ? '...' : '')}
              labels={[{ text: sectionId.toUpperCase() }]}
              mainHref={path}
              connectLabel={t('common.readMore', 'Veure Més')}
            />
          );
        })}
        {query && results.length === 0 && (
          <div className="search-empty">
            {t('section.search.noResults', 'Cap resultat.')}
          </div>
        )}
      </div>
    </UniversalPage>
  );
}
```

### 3. `src/sections/translations/TranslationsSection.jsx`
```jsx
import React from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { TranslateIcon } from '../../components/universal/UniversalElements';
import { SUPPORTED_LANGUAGES } from '../../config/i18n';
import { useUIState } from '../../app/contexts/UIContext';
import { useUIActions } from '../../app/contexts/UIContext';

export default function TranslationsSection() {
  const { language } = useUIState();
  const { setLanguage, t } = useUIActions();

  return (
    <UniversalPage
      title={t('section.translations.title', 'Traduccions i llengua')}
      subtitle={t('section.translations.subtitle', 'Gestió d\'idiomes del sistema i contingut')}
      chrome="system"
      showLogos={true}
    >
      <div className="trans-container">
        <h2>1. Idioma del Sistema</h2>
        <p className="lead">Aquest ajust canvia l'idioma de tots els menús, botons i interfícies de l'aplicació. El nostre sistema suporta de forma nativa aquests {SUPPORTED_LANGUAGES.length} idiomes.</p>

        <div className="sdp-card-grid" style={{ marginTop: '2rem', marginBottom: '4rem' }}>
          {SUPPORTED_LANGUAGES.map((item) => {
            const isActive = item.code === language;
            return (
              <button
                key={item.code}
                onClick={() => setLanguage(item.code)}
                className={`card ${isActive ? 'card--accent' : 'card--hover'}`}
              >
                <div className="card__body">
                  <h3 className="card__title">{item.name}</h3>
                  <p className="card__text">{item.code.toUpperCase()}</p>
                </div>
                <span className={`pill ${isActive ? 'pill--accent' : ''}`}>
                  {isActive ? t('section.translations.status.active', 'Actiu') : t('section.translations.status.available', 'Disponible')}
                </span>
              </button>
            );
          })}
        </div>

        <hr className="trans-divider" />

        <h2>2. Traducció Dinàmica de Targetes</h2>
        <p className="lead">Com funciona la traducció del contingut creat pels usuaris en altres pobles.</p>
        
        <div className="trans-body">
          <h3>Motor de Traducció Integrat</h3>
          <p>
            A part de l'idioma base de la interfície, les Targetes (Mur, Xats, Mercat i Esdeveniments) compten amb un motor de traducció automàtic recolzat per <strong>Google Translator</strong>. 
            Això et permet llegir a l'instant el que escriuen usuaris d'altres pobles de l'estat (per exemple, si algú publica en Euskara o en Gallec) traduint-ho a la teua llengua de preferència.
          </p>

          <h3>Com utilitzar-ho</h3>
          <ul className="trans-list">
            <li>Busca la icona de traducció <span className="trans-icon-wrap"><TranslateIcon /></span> dins de les publicacions de les targetes.</li>
            <li>Fes clic sobre el botó per traduir només aquell missatge o publicació específica.</li>
            <li><strong>Nota:</strong> Les traduccions automàtiques de Google poden contindre xicotets errors d'interpretació quan es tracta d'expressions molt locals o frases fetes de cada territori.</li>
          </ul>
        </div>
      </div>
    </UniversalPage>
  );
}
```

### 4. `src/sections/xat/XatControlSection.jsx`
```jsx
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useUIActions } from '../../app/contexts/UIContext';

export default function XatControlSection() {
  const { t } = useUIActions();

  return (
    <UniversalPage
      title={t('section.xatcontrol.title', 'Opcions del Xat')}
      subtitle={t('section.xatcontrol.subtitle', 'Ajustos, missatges temporals i organització de converses.')}
      chrome="system"
      showLogos={true}
    >
      <div className="xatctrl-container">
        <p>Aquesta pàgina s'anirà emplenant amb les idees i opcions d'organització (Cerca al xat, Missatges temporals, Fons de pantalla, etc.) sense necessitat d'embrutar la interfície amb menús desplegables sobreposats.</p>
        
        <div className="stack-grid ">
          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">Multimèdia, enllaços i documents</h3>
              <p>Revisa tot el que s'ha enviat al xat.</p>
            </div>
          </section>
          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">Missatges Temporals</h3>
              <p>Activa l'autodestrucció de missatges per a converses sensibles.</p>
            </div>
          </section>
          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">Privacitat i Seguretat</h3>
              <p>Silenciar notificacions, bloquejar, xifratge extrem a extrem.</p>
            </div>
          </section>
        </div>
      </div>
    </UniversalPage>
  );
}
```

### 5. `src/sections/admin/ControlSection.jsx`
```jsx
```
import React from 'react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { User, Cpu, Network, Receipt, FileText, Store, Calendar, MapPin, MessageSquare, Shield, LogOut, Car, PawPrint, MessageCircle } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard, UniversalIndicatorCard, UniversalButton } from '../../components/universal/UniversalElements';
import { resolveAsset } from '../../config/assetResolver';
import { useUIActions } from '../../app/contexts/UIContext';

export default function ControlSection() {
  const navigate = useNavigate();
  const { t } = useUIActions();


  const handleNavIA = (e) => {
    e?.stopPropagation();
    navigate('/ia');
  };
  const handleNavTermo = (e) => {
    e?.stopPropagation();
    console.warn('Accés a consola termodinàmica bloquejat per seguretat del host.');
  };
  const handleNavGestoria = (e) => {
    e?.stopPropagation();
    navigate('/gestoria');
  };
  const handleNavConnectar = (e) => {
    e?.stopPropagation();
    navigate('/connectar');
  };

  return (
    <UniversalPage
      title={t('section.control.title', 'Panell de Control')}
      subtitle={t('section.control.subtitle', 'Node principal i accés a les eines d\'administració i gestió')}
      lead={t('section.control.lead', 'Tria on vols publicar i crea nous continguts des de l\'editor universal.')}
      chrome="system"
    >
      <div className="ctl-main-container">
        
        {/* Accions Principals - Quadres de Comandament */}
        <section>
          
            <div className="sdp-card-grid">
              <UniversalCard 
                variant="action"
                icon={<FileText size={40} strokeWidth={1.5} />}
                title="Publicar al Mur"
                subtitle="Compartir novetats"
                onMainClick={() => navigate('/notes')}
              />
              <UniversalCard 
                variant="action"
                icon={<Store size={40} strokeWidth={1.5} />}
                title="Publicar al Mercat"
                subtitle="Vendre productes"
                onMainClick={() => navigate('/notes')}
              />
              <UniversalCard 
                variant="action"
                icon={<Calendar size={40} strokeWidth={1.5} />}
                title="Publicar Esdeveniments"
                subtitle="Crear agenda"
                onMainClick={() => navigate('/notes')}
              />
              <UniversalCard 
                variant="action"
                icon={<MapPin size={40} strokeWidth={1.5} />}
                title="Publicar al Mapa"
                subtitle="Veure rutes"
                onMainClick={() => navigate('/notes')}
              />
              <UniversalCard 
                variant="action"
                icon={<Car size={40} strokeWidth={1.5} />}
                title="Compartir vehicle"
                subtitle="Oferir o demanar viatge"
                onMainClick={() => navigate('/notes')}
              />
              <UniversalCard 
                variant="action"
                icon={<PawPrint size={40} strokeWidth={1.5} />}
                title="Animalets"
                subtitle="Cercar propietaris o adoptar"
                onMainClick={() => navigate('/notes')}
              />
              <UniversalCard 
                variant="action"
                icon={<MessageCircle size={40} strokeWidth={1.5} />}
                title="Publicar al Xat"
                subtitle="Crear anunci per a grups"
                onMainClick={() => navigate('/notes')}
              />
            </div>
        </section>

        {/* Secció Utilitats Socials */}
        <section className="ctl-section-utilitats">
          <h2 className="ctl-section-title">Utilitats</h2>
          <p className="lead ctl-section-lead">
            Eines pràctiques d'utilitat social pensades per a facilitar la vida quotidiana al poble: gestió comptable autònoma, lectura de carpetes i suport a la comunitat.
          </p>
          <div className="sdp-card-grid">
            <UniversalCard 
              variant="action"
              icon={<Receipt size={40} strokeWidth={1.5} />}
              title="Gestoria de Poble"
              subtitle="Comptabilitat i facturació trimestral"
              onMainClick={handleNavGestoria}
            />
          </div>
        </section>

        {/* Eines i Recursos (Opcions secundàries) */}
        <section className="ctl-secondary-tools">
          <UniversalButton onClick={() => navigate('/xat/0001')} variant="primary" icon={<MessageSquare size={18} />}>
            Missatges per a dubtes
          </UniversalButton>

          <UniversalButton variant="ghost" icon={<LogOut size={18} />}>
            Eixir del poble
          </UniversalButton>
        </section>

      </div>
    </UniversalPage>
  );
}
```
