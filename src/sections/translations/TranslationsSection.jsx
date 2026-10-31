import { Info, Languages, MousePointerClick } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard } from '../../components/PedraSeca';
import { SUPPORTED_LANGUAGES } from '../../config/i18n';
import { useUIState, useUIActions } from '../../app/contexts/UIContext';
import { traduccioDePaginesDisponible } from '../../components/PedraSeca/hooks/useTraduccioPagina.js';

/* /traduccions amb les mateixes targetes que el Panell i la Consola (pla
   260924_1850 §4). Abans hi havia dos fantasmes fets a mà:
     · un botó amb una classe de targeta que cap full definia: el navegador
       hi posava el gris natiu del botó (les «targetes grises antigues»).
     · <TranslateIcon /> sense classe ni mida dins d'un <li>: un SVG amb
       viewBox i sense width s'estira fins a l'ample de la línia (l'«SVG gegant»).
   Les llengües són ActionCards: tota la targeta tria, com al Panell. La
   traducció de targetes és informativa i va en targetes de tauler, com la
   Consola, perquè una targeta que no fa res no ha de semblar un botó. */

/* La llengua pròpia és un fet cultural, no una preferència: no depén de
   DEFAULT_LANGUAGE, que un desplegament podria canviar. */
const LLENGUA_PROPIA = 'ca';

/* Valencià primer; la resta conserva l'ordre de la configuració. */
const LLENGUES = [
  ...SUPPORTED_LANGUAGES.filter((llengua) => llengua.code === LLENGUA_PROPIA),
  ...SUPPORTED_LANGUAGES.filter((llengua) => llengua.code !== LLENGUA_PROPIA)
];

export default function TranslationsSection() {
  const { language, locale, externalConfig } = useUIState();
  const { setLanguage, t } = useUIActions();
  /* Gauntlet 261030 (cicle 2, traduccions-actiu-a-app-nativa) · «Actiu» només
     on Traduir traduïx de veritat. A l'app nativa (cap servei ni transport
     lliure) la targeta diu «En obres» i, primer, el que diu la pàgina legal. */
  const traductorDisponible = traduccioDePaginesDisponible(externalConfig?.traductorUrl);

  const etiqueta = (text, className) => ({ text: text.toLocaleUpperCase(locale), className });
  const activa = SUPPORTED_LANGUAGES.find((llengua) => llengua.code === language);

  const subtitols = {
    ca: t('section.translations.option.ca', 'Idioma per defecte de l’aplicació'),
    es: t('section.translations.option.es', 'Interfície en castellà'),
    en: t('section.translations.option.en', 'Interfície en anglés'),
    eu: t('section.translations.option.eu', 'Interfície en basc'),
    gl: t('section.translations.option.gl', 'Interfície en gallec')
  };

  /* La traducció de cada targeta solta encara no existix: on una pàgina no té
     el Traductor Sobirà, el botó Traduir només navega ací (useAccions.js). Es
     diu, no s'amaga. El de pàgines sí que funciona (la secció de dalt). */
  const informacio = [
    {
      id: 'motor',
      Icona: Languages,
      titol: t('section.translations.engine.title', 'Motor de Traducció Integrat'),
      cos: t(
        'section.translations.engine.body',
        'A part de l’idioma base de la interfície, les Targetes (Mur, Xats, Mercat i Esdeveniments) comptaran amb un motor de traducció automàtica. Et permetrà llegir a l’instant el que escriuen usuaris d’altres pobles de l’estat (per exemple, si algú publica en euskara o en gallec) traduint-ho a la teua llengua de preferència.'
      ),
      pendent: true
    },
    {
      id: 'us',
      Icona: MousePointerClick,
      titol: t('section.translations.howto.title', 'Com utilitzar-ho'),
      cos: t(
        'section.translations.howto.body',
        'Busca la icona de traducció dins de les publicacions de les targetes: servirà per a traduir només aquell missatge o publicació específica. Mentre la traducció de targetes no estiga connectada, el botó porta a aquesta pàgina.'
      )
    },
    {
      id: 'nota',
      Icona: Info,
      titol: t('section.translations.note.title', 'Nota'),
      cos: t(
        'section.translations.note.body',
        'Les traduccions automàtiques poden contindre xicotets errors d’interpretació quan es tracta d’expressions molt locals o frases fetes de cada territori.'
      )
    }
  ];

  return (
    <UniversalPage
      title={t('section.translations.title', 'Traduccions i llengua')}
      subtitle={t('section.translations.subtitle', 'Gestió d’idiomes del sistema i contingut')}
      chrome="system"
    >
      <div className="content-wrapper">
        <section aria-labelledby="sdp-idiomes-sistema">
          <h2 id="sdp-idiomes-sistema">
            {t('section.translations.system.title', 'Idioma del Sistema')}
          </h2>

          <p className="lead">
            {t(
              'section.translations.system.lead',
              'Aquest ajust canvia l’idioma de tots els menús, botons i interfícies de l’aplicació. La preferència es guarda en aquest navegador.'
            )}
          </p>

          {/* La targeta no admet aria-pressed a la seua capa clicable: l'estat
              es diu ací i s'anuncia quan canvia. L'etiqueta ACTIU el mostra. */}
          <p className="sdp-nomes-lector" role="status">
            {`${t('section.translations.current', 'Idioma actual')}: ${activa?.name ?? language}`}
          </p>

          <div className="sdp-card-grid">
            {LLENGUES.map((llengua) => (
              <UniversalCard
                key={llengua.code}
                variant="action"
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
        </section>

        {/* IDEA-31 (C0545-S2) · El Traductor Sobirà de pàgines ja funciona: el botó
            Traduir de la Barra Blava (useTraduccioPagina.js) amb un proveïdor lliure,
            al servidor o, a socdepoble.org estàtic, des del navegador
            (data/traductorLliure.js): Apertium per al castellà, el gallec, l'anglés i
            el francés, i MyMemory per al basc i l'alemany (decisions 261030 §6: el
            text públic diu la veritat, sense prometre res de Google que no es puga
            demostrar). Es diu on va el text.
            La traducció de targetes soltes continua en obres, a la secció següent. */}
        <section aria-labelledby="sdp-traductor-pagines">
          <h2 id="sdp-traductor-pagines">
            {t('section.translations.pages.title', 'Traductor Sobirà de Pàgines')}
          </h2>

          <p className="lead">
            {t('section.translations.pages.lead', 'Traduïx la pàgina que llegixes sense eixir-ne: amb Apertium, programari lliure, i, per al basc i l’alemany, amb MyMemory.')}
          </p>

          <div className="sdp-card-grid">
            <UniversalCard
              icon={<Languages aria-hidden="true" />}
              title={t('section.translations.pages.card.title', 'Botó Traduir de la Barra Blava')}
              body={[
                traductorDisponible ? null : t('section.translations.pages.card.natiu', 'A l’aplicació nativa, de moment, el botó encara no fa cap traducció: si el prems, t’ho diu.'),
                t(
                  'section.translations.pages.card.body',
                  'El botó Traduir de la Barra Blava traduïx la pàgina al castellà, al gallec, al basc, a l’anglés, al francés i a l’alemany. Per al castellà, el gallec, l’anglés i el francés ho fa amb Apertium, un traductor de programari lliure. Per al basc i l’alemany, que Apertium no oferix des del valencià, ho fa amb MyMemory, el servei de l’empresa italiana Translated, que no diu quin motor automàtic fa servir. Només quan tries una llengua, el text de la pàgina ix cap al traductor: a socdepoble.org, des del teu navegador directament al servei, que veu la teua adreça IP; en un lloc amb servidor propi, com WordPress, a través d’eixe servidor, que pot tindre configurat un altre proveïdor. MyMemory pot guardar els textos que rep i registrar l’adreça IP, i el basc i l’alemany tenen un límit diari de traduccions. Per això només es traduïx el text de les pàgines públiques, mai els teus missatges ni les teues notes. On no hi ha traducció, el botó ho diu.'
                )
              ].filter(Boolean).join(' ')}
              hasFooter={false}
              labels={[traductorDisponible
                ? etiqueta(t('section.translations.status.active', 'Actiu'), 'sdp-badge-system')
                : etiqueta(t('section.translations.status.pending', 'En obres'), 'sdp-badge-tag')]}
            />
          </div>
        </section>

        <section aria-labelledby="sdp-idiomes-targetes">
          <h2 id="sdp-idiomes-targetes">
            {t('section.translations.dynamic.title', 'Traducció Dinàmica de Targetes')}
          </h2>

          <p className="lead">
            {t(
              'section.translations.dynamic.lead',
              'Com funciona la traducció del contingut creat pels usuaris en altres pobles.'
            )}
          </p>

          <div className="sdp-card-grid">
            {informacio.map(({ id, Icona, titol, cos, pendent }) => (
              <UniversalCard
                key={id}
                icon={<Icona aria-hidden="true" />}
                title={titol}
                body={cos}
                hasFooter={false}
                labels={pendent
                  ? [etiqueta(t('section.translations.status.pending', 'En obres'), 'sdp-badge-tag')]
                  : []}
              />
            ))}
          </div>
        </section>
      </div>
    </UniversalPage>
  );
}
