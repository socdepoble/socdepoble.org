/**
 * ControlSection.jsx — el Panell de Control (/control i l'àlies /utilitats).
 *
 * D3 (ordre del Mestre, 260930): cap targeta porta a una ruta que no existix.
 * «Gestoria de Poble» no té secció i diu «EN OBRES» sense clic, com les
 * altres; «Missatges per a dubtes» obri el Xat (/xat). D16: «Novetats» s'ha
 * amagat del rail del Xat i la targeta «Ajustos del xat» és ara l'entrada al
 * Control del xat (/control-xat). Porta el mateix dibuix que la capçalera
 * d'eixa pàgina (CircleDashed): el que toques és el que s'obri.
 *
 * CU (Onada 3, 261003) · Les Utilitats guanyen el Snippet, l'única amb fitxa
 * de detall. La fitxa s'obri amb una consulta sobre la mateixa ruta
 * (/control?fitxa=snippet, o /utilitats?fitxa=snippet): les rutes de Control
 * són exactes i no se n'afig cap (destiSnippet.js).
 * Correcció de la revisió · Com que el camí no canvia, App no recoloca res:
 * quan ?fitxa canvia, la fitxa s'obri des de dalt i el Panell torna on era en
 * prémer la targeta, amb el focus a <main> com en una ruta nova
 * (vistaDeLaFitxa.js).
 */
import {
  Calendar,
  CircleDashed,
  FileText,
  LogOut,
  MessageSquare,
  Receipt,
  Store,
  Activity,
  Rss,
  Network,
  Scissors
} from 'lucide-react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { useEixidaSegura } from '../../components/universal/EixidaSegura.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalButton, UniversalCard } from '../../components/universal/../PedraSeca';
import { useUIActions } from '../../app/contexts/UIContext';
import { FitxaSnippet } from './FitxaSnippet.jsx';
import { CLAU_FITXA, FITXA_SNIPPET, rutaDeLaFitxa } from './destiSnippet.js';
import { posicioDeLaVista, recolocaLaVista } from './vistaDeLaFitxa.js';

export default function ControlSection() {
  const [params] = useSearchParams();
  const esFitxa = params.get(CLAU_FITXA) === FITXA_SNIPPET;
  /* El cos de la vista pintada (el .content-wrapper del Panell o de la fitxa). */
  const vistaRef = useRef(null);
  /* On era el Panell quan es va prémer la targeta del Snippet. */
  const posicioDelPanell = useRef(0);
  /* La vista que ja s'ha col·locat: en muntar no es toca res (App ja ho fa). */
  const vistaColocada = useRef(esFitxa);
  useLayoutEffect(() => {
    if (vistaColocada.current === esFitxa) return;
    vistaColocada.current = esFitxa;
    recolocaLaVista(vistaRef.current, esFitxa ? 0 : posicioDelPanell.current);
  }, [esFitxa]);
  const recordaLaPosicio = useCallback(() => {
    posicioDelPanell.current = posicioDeLaVista(vistaRef.current);
  }, []);
  return esFitxa
    ? <FitxaSnippet vistaRef={vistaRef} />
    : <PanellControl vistaRef={vistaRef} abansDeLaFitxa={recordaLaPosicio} />;
}

function PanellControl({ vistaRef, abansDeLaFitxa }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useUIActions();
  /* T47 (correcció de la revisió, 260928) · «Eixir del poble» és la mateixa
     eixida que «Tancar sessió»: la de SessionContext, que primer envia el
     pendent i després oblida els esborranys d'este dispositiu. C01 · Si
     queda res que el servidor no té, ho diu abans i la persona decidix.
     Ordre del Mestre 260930 (P2) · Sense recàrrega: a WordPress,
     window.location.reload() recarregava la pàgina sencera de l'amfitrió.
     Tancar la sessió ja mou la generació del servei i els proveïdors de la
     persona es buiden per àmbit (el mateix que «Tanca la sessió» dels
     Ajustos del Xat, FullAjustos.jsx). */
  const despresDEixir = useCallback(() => {
    navigate('/registre', { replace: true });
  }, [navigate]);
  const eixida = useEixidaSegura({ despres: despresDEixir });

  const primaryActions = [
    { icon: <FileText size={40} strokeWidth={1.5} />,      title: 'Publicar al Mur',          subtitle: 'Comparteix notícies i idees amb tot el poble',            desti: '/mur' },
    { icon: <Store size={40} strokeWidth={1.5} />,         title: 'Publicar al Mercat',       subtitle: 'Ofereix productes o serveis de segona mà',              desti: '/mercat' },
    { icon: <Calendar size={40} strokeWidth={1.5} />,      title: 'Publicar a l\'Agenda',   subtitle: 'Combina actes públics i notes personals', desti: '/mur' },
    { icon: <FileText size={40} strokeWidth={1.5} />,      title: 'Editor de Notes',          subtitle: 'Escriu apunts personals i organitza les teues idees',    desti: '/notes' },
    /* D16 · L'entrada al Control del xat, ara que «Novetats» és amagada del rail.
       És l'única porta a una pàgina traduïda: el nom de la porta també ho és. */
    { icon: <CircleDashed size={40} strokeWidth={1.5} />,  title: t('section.control.ajustosXat.titol', 'Ajustos del xat'), subtitle: t('section.control.ajustosXat.subtitol', 'Amplària de les columnes i preferències del xat'), desti: '/control-xat' },
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
      <div ref={vistaRef} className="content-wrapper">
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
            {/* D3 · Sense secció: «EN OBRES» i sense clic, com les targetes pendents. */}
            <UniversalCard
              variant="action"
              icon={<Receipt size={40} strokeWidth={1.5} />}
              title="Gestoria de Poble"
              subtitle="Comptabilitat i facturació trimestral"
              labels={[{ text: 'EN OBRES', className: 'sdp-badge-tag' }]}
              className="sp-card"
            />
            
            <UniversalCard
              variant="action"
              icon={<Activity size={40} strokeWidth={1.5} />}
              title="Consola de Mètriques"
              subtitle="Monitorització i auditoria de la IA"
              labels={[{ text: 'IDEA', className: 'sdp-badge-tag' }]}
              className="sp-card"
            />
            
            <UniversalCard
              variant="action"
              icon={<Rss size={40} strokeWidth={1.5} />}
              title="Curation AI (Lector RSS)"
              subtitle="Agregador de notícies i resums intel·ligents"
              labels={[{ text: 'IDEA', className: 'sdp-badge-tag' }]}
              className="sp-card"
            />
            
            <UniversalCard
              variant="action"
              icon={<Network size={40} strokeWidth={1.5} />}
              title="Cervell (Node Graph)"
              subtitle="Mapa visual de relacions i categories"
              labels={[{ text: 'IDEA', className: 'sdp-badge-tag' }]}
              className="sp-card"
            />

            {/* CU · L'única Utilitat amb fitxa: navega, com les accions de dalt,
                i el Panell recorda on era per a tornar-hi. */}
            <UniversalCard
              variant="action"
              icon={<Scissors size={40} strokeWidth={1.5} />}
              title="Snippet"
              subtitle="Extensió de Chrome per a desar webs al Bloc"
              onMainClick={() => {
                abansDeLaFitxa?.();
                navigate(rutaDeLaFitxa(pathname));
              }}
              className="sp-card"
            />
          </div>
        </section>

        <div className="sdp-control-actions">
          {/* D3 · El fil '0001' no existix (els id són UUID): obri el Xat. */}
          <UniversalButton
            onClick={() => navigate('/xat')}
            variant="primary"
            icon={<MessageSquare size={18} />}
            className="sdp-btn-ample"
          >
            Missatges per a dubtes
          </UniversalButton>

          <UniversalButton
            variant="ghost"
            icon={<LogOut size={18} />}
            onClick={eixida.demana}
            disabled={eixida.ocupat || Boolean(eixida.avis)}
            className="sdp-btn-ample"
          >
            Eixir del poble
          </UniversalButton>
        </div>
        {eixida.avis}
        {eixida.error ? <p className="sdp-camp__error" role="alert">{eixida.error}</p> : null}
      </div>
    </UniversalPage>
  );
}
