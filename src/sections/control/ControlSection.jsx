import {
  Calendar,
  Car,
  FileText,
  LogOut,
  MapPin,
  MessageCircle,
  MessageSquare,
  PawPrint,
  Receipt,
  Store,
  Book,
  Power,
  Briefcase,
  Home
} from 'lucide-react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { logout } from '../../data/backendPort';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  UniversalButton,
  UniversalCard,
} from '../../components/universal/UniversalElements';
import { useUIActions } from '../../app/contexts/UIContext';

export default function ControlSection() {
  const navigate = useNavigate();
  const { t } = useUIActions();

  const handleNavGestoria = (event) => {
    event?.stopPropagation();
    navigate('/gestoria');
  };

  const primaryActions = [
    { icon: <FileText size={40} strokeWidth={1.5} />,      title: 'Publicar al Mur',          subtitle: 'Compartir novetats',            desti: '/jo/mur' },
    { icon: <Store size={40} strokeWidth={1.5} />,         title: 'Publicar al Mercat',       subtitle: 'Vendre productes',              desti: '/jo/mercat' },
    { icon: <Calendar size={40} strokeWidth={1.5} />,      title: 'Publicar Esdeveniments',   subtitle: 'Crear agenda',                  desti: '/jo/mur' },
    { icon: <MessageCircle size={40} strokeWidth={1.5} />, title: 'Publicar al Xat',          subtitle: 'Crear anunci per a grups',      desti: '/jo/xat' },
    { icon: <FileText size={40} strokeWidth={1.5} />,      title: 'Editor de Notes',          subtitle: 'Escriure i publicar al mur',    desti: '/jo/notes' },
    /* Sense secció encara. Es declara, no es dissimula amb un fallback. */
    { icon: <MapPin size={40} strokeWidth={1.5} />,        title: 'Publicar al Mapa',         subtitle: 'Pendent de secció',             desti: null },
    { icon: <Car size={40} strokeWidth={1.5} />,           title: 'Compartir vehicle',        subtitle: 'Pendent de secció',             desti: null },
    { icon: <PawPrint size={40} strokeWidth={1.5} />,      title: 'Animalets',                subtitle: 'Pendent de secció',             desti: null },
    { icon: <Briefcase size={40} strokeWidth={1.5} />,     title: 'Ocupació',                 subtitle: 'Oferta i demanda',              desti: null },
    { icon: <Home size={40} strokeWidth={1.5} />,          title: 'Habitatge',                subtitle: 'Lloguer i venda',               desti: null },
  ];

  return (
    <UniversalPage
      title={t('section.control.title', 'Panell de Control')}
      subtitle={t(
        'section.control.subtitle',
        "Node principal i accés a les eines d'administració i gestió"
      )}
      lead={t(
        'section.control.lead',
        "Tria on vols publicar i crea nous continguts des de l'editor universal."
      )}
      chrome="system"
    >
      <div className="content-wrapper">
        <section>
          <div className="sdp-card-grid">
            {primaryActions.map((action) => (
              <UniversalCard
                key={action.title}
                variant="action"
                icon={action.icon}
                title={action.title}
                subtitle={action.subtitle}
                {...(action.desti
                  ? { onMainClick: () => navigate(action.desti) }
                  : { labels: [{ text: 'EN OBRES', className: 'sdp-badge-tag' }] })}
              />
            ))}
          </div>
        </section>

        <section>
          <h2>Utilitats i Connectors (Plugins)</h2>

          <p className="lead">
            El sistema s'anirà enriquint amb aquest tipus d'utilitats (o plugins) que es poden activar si es necessiten.
            Són independents del sistema base, cosa que permet endollar funcionalitats a mesura només per als usuaris o clients que les demanen.
          </p>

          <div className="sdp-card-grid">
            <UniversalCard
              variant="action"
              icon={<Receipt size={40} strokeWidth={1.5} />}
              title="Gestoria de Poble"
              subtitle="Comptabilitat i facturació trimestral"
              onMainClick={handleNavGestoria}
              labels={[{ text: 'ACTIU', className: 'sdp-badge-system' }]}
              className="sp-card"
            />
          </div>
        </section>

        <div className="sdp-control-actions">
          <UniversalButton
            onClick={() => navigate('/xat/0001')}
            variant="primary"
            icon={<MessageSquare size={18} />}
            className="sdp-btn-ample"
          >
            Missatges per a dubtes
          </UniversalButton>

          <UniversalButton
            variant="ghost"
            icon={<LogOut size={18} />}
            onClick={() => logout().then(() => navigate('/registre'))}
            className="sdp-btn-ample"
          >
            Eixir del poble
          </UniversalButton>
        </div>
      </div>
    </UniversalPage>
  );
}
