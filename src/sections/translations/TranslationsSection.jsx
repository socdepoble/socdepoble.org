import { Fragment, useRef } from 'react';
import { Languages } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  ActionControl,
  CommentIcon,
  IconButton,
  ShareIcon,
  TranslateIcon,
  UniversalCard
} from '../../components/PedraSeca';
import { BarraBlava } from '../../components/universal/barres/BarraBlava.jsx';
import { MenuTraduir } from '../../components/universal/traduccio/MenuTraduir.jsx';
import { SUPPORTED_LANGUAGES } from '../../config/i18n';
import { useFullDiferit } from '../../config/fullDiferit.js';
import { useUIState, useUIActions } from '../../app/contexts/UIContext';
import { traduccioDePaginesDisponible } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';
import { LLENGUES_TRADUCCIO } from '../../data/traductor.js';
import cssEspecimens from '../../css/diferit-especimens.css?inline';
import { obteContingutDidacticTraduccions } from './contingutDidacticTraduccions.jsx';

/* /traduccions amb jerarquia i comunicació didàctica Pedra Seca (ordre del
   Mestre, 261118):
     · H1 al bloc blanc → un sol H2 (subtítol) → entradilla (lead) just davall
       del primer H2 → H3 per a les 3 seccions principals.
     · Només els cinc idiomes són ActionCards clicables (amb headingLevel="h4").
     · El Traductor per a Pàgines i la Traducció Dinàmica de Targetes combinen
       prosa escanejable (negretes a salts de vista + enllaços vius a les fonts
       oficials Apertium, MyMemory, Translated, WordPress i rutes internes) amb
       mostres visuals reals de la Barra Blava i del peu blau de la Targeta
       Universal (inertes per al teclat i lector de pantalla). */

/* La llengua pròpia és un fet cultural, no una preferència: no depén de
   DEFAULT_LANGUAGE, que un desplegament podria canviar. */
const LLENGUA_PROPIA = 'ca';

/* Valencià primer; la resta conserva l'ordre de la configuració. */
const LLENGUES = [
  ...SUPPORTED_LANGUAGES.filter((llengua) => llengua.code === LLENGUA_PROPIA),
  ...SUPPORTED_LANGUAGES.filter((llengua) => llengua.code !== LLENGUA_PROPIA)
];

const res = () => {};

const MOSTRA_BARRA_BLAVA = {
  onBack: res,
  onForward: res,
  onIndex: res,
  traduirVisible: true,
  comentarVisible: true,
  compartirVisible: true,
  connectarVisible: true,
  onTranslate: res,
  onComment: res,
  onShare: res,
  onConnect: res,
  comentarXat: 'comu'
};

export default function TranslationsSection() {
  const arrelMostresRef = useRef(null);
  useFullDiferit(arrelMostresRef, 'especimens', cssEspecimens);

  const { language, locale, externalConfig } = useUIState();
  const { setLanguage, t } = useUIActions();
  /* Gauntlet 261030 (cicle 2, traduccions-actiu-a-app-nativa) · A l'app nativa
     (cap servei ni transport lliure) s'indica explícitament que la traducció de
     pàgines continua en obres i encara no traduïx. */
  const traductorDisponible = traduccioDePaginesDisponible(externalConfig?.traductorUrl);

  /* v1.2.26 · «Llengua pròpia» i «Actiu» són estats, no taxonomia (D3 de l'integrador sobre IDEA-365,
     Llibre Mestre, línia 3825): inertes, sense l'enllaç que rutaDePindola.js posaria a una píndola. */
  const etiqueta = (text, className) => ({ text: text.toLocaleUpperCase(locale), className, inerta: true });
  const activa = SUPPORTED_LANGUAGES.find((llengua) => llengua.code === language);
  const didactic = obteContingutDidacticTraduccions(language);

  const subtitols = {
    ca: t('section.translations.option.ca', 'Idioma per defecte de l’aplicació'),
    es: t('section.translations.option.es', 'Interfície en castellà'),
    en: t('section.translations.option.en', 'Interfície en anglés'),
    eu: t('section.translations.option.eu', 'Interfície en basc'),
    gl: t('section.translations.option.gl', 'Interfície en gallec')
  };

  const etiquetaConnectar = t('section.connectar.kicker', 'Connectar');

  const informacioTargetes = [
    {
      id: 'motor',
      titol: t('section.translations.engine.title', 'Motor de Traducció Integrat'),
      cos: didactic.motorCos
    },
    {
      id: 'us',
      titol: t('section.translations.howto.title', 'Com utilitzar-ho'),
      cos: didactic.usCos
    },
    {
      id: 'nota',
      titol: t('section.translations.note.title', 'Nota'),
      cos: didactic.notaCos
    }
  ];

  return (
    <UniversalPage
      title={t('section.translations.title', 'Traduccions i llengua')}
      subtitle={t('section.translations.subtitle', 'Gestió d’idiomes del sistema i contingut')}
      lead={t(
        'section.translations.system.lead',
        'Aquest ajust canvia l’idioma de tots els menús, botons i interfícies de l’aplicació. La preferència es guarda en aquest navegador.'
      )}
      chrome="system"
    >
      <h3 id="sdp-idiomes-sistema">
        {t('section.translations.system.title', 'Idioma del Sistema')}
      </h3>

      {/* La targeta no admet aria-pressed a la seua capa clicable: l'estat es
          diu ací i s'anuncia quan canvia. L'etiqueta ACTIU el mostra. */}
      <p className="sdp-nomes-lector" role="status">
        {`${t('section.translations.current', 'Idioma actual')}: ${activa?.name ?? language}`}
      </p>

      <div className="sdp-card-grid">
        {LLENGUES.map((llengua) => (
          <UniversalCard
            key={llengua.code}
            variant="action"
            headingLevel="h4"
            icon={<Languages size={40} strokeWidth={1.5} aria-hidden="true" />}
            title={llengua.name}
            subtitle={subtitols[llengua.code]}
            onMainClick={() => setLanguage(llengua.code)}
            labels={[
              llengua.code === LLENGUA_PROPIA
                && etiqueta(t('section.translations.badge.own', 'Llengua pròpia'), 'sdp-badge-accent'),
              llengua.code === language
                && etiqueta(t('section.translations.status.active', 'Actiu'), 'sdp-badge-system')
            ]}
          />
        ))}
      </div>

      <h3 id="sdp-traductor-pagines">
        {t('section.translations.pages.title', 'Traductor per a Pàgines')}
      </h3>

      <p>{didactic.paginesIntro}</p>

      <h4>
        {t('section.translations.pages.card.title', 'Botó Traduir de la Barra Blava')}
      </h4>

      <figure ref={arrelMostresRef} className="sdp-especimen__figura">
        <figcaption>{didactic.peuFiguraBarraBlava}</figcaption>
        <div className="sdp-especimen__viu" inert="" aria-hidden="true" data-testid="mostra-barra-blava">
          <div className="sdp-especimen__barres sdp-especimen__barres--contenidor">
            <BarraBlava {...MOSTRA_BARRA_BLAVA} connectLabel={etiquetaConnectar} />
          </div>
          <div className="sdp-especimen__fila">
            <MenuTraduir opcions={LLENGUES_TRADUCCIO} actual="ES" onTria={res} onTanca={res} mostra />
          </div>
        </div>
      </figure>

      {!traductorDisponible && (
        <p>
          <strong>{`${t('section.translations.status.pending', 'En obres')}: `}</strong>
          {t(
            'section.translations.pages.card.natiu',
            'A l’aplicació nativa, de moment, el botó encara no fa cap traducció: si el prems, t’ho diu.'
          )}
        </p>
      )}

      <p>{didactic.paginesBarraComportament}</p>
      <p>{didactic.paginesMotors}</p>
      <p>{didactic.paginesPrivacitat}</p>

      <h3 id="sdp-idiomes-targetes">
        {t('section.translations.dynamic.title', 'Traducció Dinàmica de Targetes')}
      </h3>

      <p>{didactic.targetesIntro}</p>

      <figure className="sdp-especimen__figura">
        <figcaption>{didactic.peuFiguraTargeta}</figcaption>
        <div className="sdp-especimen__viu" inert="" aria-hidden="true" data-testid="mostra-peu-targeta">
          <div className="sdp-especimen__fila">
            <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta sdp-especimen__barres">
              <footer className="sp-card-footer">
                <div className="sp-card-actions">
                  <IconButton label={t('section.traduir.menu', 'Traduir la pàgina')} onClick={res}>
                    <TranslateIcon className="icon" />
                  </IconButton>
                  <IconButton label="Comentar" onClick={res}>
                    <CommentIcon className="icon" />
                  </IconButton>
                  <IconButton label="Compartir" onClick={res}>
                    <ShareIcon className="icon" />
                  </IconButton>
                </div>
                <ActionControl className="btn-connectar sp-card-connect" label={etiquetaConnectar} onClick={res}>
                  <span className="sp-card-connect-text">{etiquetaConnectar}</span>
                  <span className="sp-card-connect-plus" aria-hidden="true">+</span>
                </ActionControl>
              </footer>
            </div>
          </div>
        </div>
      </figure>

      {informacioTargetes.map(({ id, titol, cos }) => (
        <Fragment key={id}>
          <h4>{titol}</h4>
          <p>{cos}</p>
        </Fragment>
      ))}
    </UniversalPage>
  );
}
