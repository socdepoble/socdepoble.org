import { UniversalPage } from '../../components/universal/UniversalPage';
import { useUIActions } from '../../app/contexts/UIContext';

export default function XatControlSection() {
  const { t } = useUIActions();

  return (
    <UniversalPage
      title={t('section.xatcontrol.title', 'Opcions del Xat')}
      subtitle={t(
        'section.xatcontrol.subtitle',
        'Ajustos, missatges temporals i organització de converses.'
      )}
      chrome="system"
      showLogos
    >
      <div className="content-wrapper">
        <p>
          Aquesta pàgina s&apos;anirà emplenant amb les idees i opcions
          d&apos;organització (Cerca al xat, Missatges temporals, Fons de
          pantalla, etc.) sense necessitat d&apos;embrutar la interfície amb
          menús desplegables sobreposats.
        </p>

        <div className="stack-grid">
          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">
                Multimèdia, enllaços i documents
              </h3>
              <p>Revisa tot el que s&apos;ha enviat al xat.</p>
            </div>
          </section>

          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">Missatges Temporals</h3>
              <p>
                Activa l&apos;autodestrucció de missatges per a converses
                sensibles.
              </p>
            </div>
          </section>

          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">Privacitat i Seguretat</h3>
              <p>
                Silenciar notificacions, bloquejar, xifratge extrem a extrem.
              </p>
            </div>
          </section>
        </div>
      </div>
    </UniversalPage>
  );
}
