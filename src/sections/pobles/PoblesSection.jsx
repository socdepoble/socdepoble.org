import React from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { UniversalCard } from '../../components/universal/../PedraSeca';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { getSectionItemPath, objecteDe, rutaConnectarObjecte, rutaXatDePagina } from '../../config/navigation';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useSEO } from '../../hooks/useSEO';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useMur } from '../mur/MurContext';
import { COPYRIGHT_VIQUIPEDIA, dataDElement, momentDElement } from '../../components/universal/editorial.js';
import { nomDeLaGent } from './nomsDelPoble.js';
import { poblesAmbNaixement } from './clauDelPoble.js';
import { objecteDelPobleXat } from './xatDelPoble.js';

export default function PoblesSection() {
  const { sortedTowns, status, error } = useCoreContent();
  const { feedPosts, marketItems, events } = useMur();
  const { t } = useUIActions();
  const navigate = useNavigate();

  /* T2 (prompt 1140, 261001) · La pastilla i l'ordre ixen de la mateixa data
     (editorial.js · dataDElement / momentDElement, la regla de Pedra Seca
     §10): la de creació del poble, o la de l'última versió si és posterior.
     Abans es llegien `dynamic_time` i `dynamic_date`, que no escriu cap codi:
     la targeta quedava sense pastilla i l'ordre, a mercé d'un text.
     Onada 6 (requisit 15 de l'Onada 5: «En crear un poble per primera vegada,
     s'hi assignarà la data i hora d'aquella primera publicació de naixement
     del poble») · La data de creació és el NAIXEMENT del poble: la més antiga
     entre la de la fitxa i el created_at de la primera publicació que el
     DECLARA (poble_id; clauDelPoble.js · poblesAmbNaixement, sobre les dades
     del Mur). Les publicacions casades només pel text del lloc no el daten
     (vegeu-ne el perquè a clauDelPoble.js): amb la llavor, també la de
     supabase/seed.sql, cap fitxa canvia. La mateixa regla la llig la seua
     pàgina (buildPoblesDetailSectionMeta): pastilla, ordre i barra taronja
     diuen la mateixa data (T51). Sense cap publicació declarada anterior a
     la fitxa, la de la fitxa, com abans.
     DEUTE CONEGUT (revisió de T2, 261001) · La pastilla porta al Calendari
     d'eixe mes, però el Calendari encara no rep els pobles
     (CalendariSection · entradesDelCalendari; type 'town', no 'poble'): el
     poble no hi ix. Pendent de decisió del Mestre. */
  const pobles = React.useMemo(
    () => poblesAmbNaixement(sortedTowns, { feedPosts, marketItems, events }),
    [sortedTowns, feedPosts, marketItems, events]
  );
  const sortedAndActiveTowns = React.useMemo(() => {
    return [...pobles].sort((a, b) => {
      const dateA = momentDElement(a);
      const dateB = momentDElement(b);
      if (dateA === null && dateB === null) return 0;
      if (dateA === null) return 1;
      if (dateB === null) return -1;
      return dateB - dateA;
    });
  }, [pobles]);

  useSEO({
    title: t('section.pobles.kicker', 'Pobles'),
    description: t('section.pobles.subtitle', 'Explora els pobles i el seu context territorial.')
  });

  /*
   * =========================================================================
   * REGLA DE DISSENY (Pobles)
   * =========================================================================
   * Aquesta pàgina és diferent de la resta (no s'edita manualment).
   * Funciona exclusivament mostrant de forma automàtica la targeta
   * de l'últim publicador al Mur. Quan un poble publica una notícia,
   * automàticament puja a dalt de tot en aquesta llista.
   * La resta de pobles apareixen aleatòriament per ara.
   * =========================================================================
   * Onada 6 (estat real, no aplicada encara) · La pastilla diu el NAIXEMENT
   * del poble (requisit 15 i decisió 3 de la nit del 261009) i T51 mana que
   * l'ordre llija la mateixa data que la pastilla: la llista s'ordena pel
   * naixement, del més recent al més antic. Fer pujar dalt el poble que
   * publica obligaria la pastilla a dir l'última activitat (o una excepció
   * a T51): pregunta oberta al Mestre a l'informe de l'Onada 6. Mentre el Mur
   * carrega, l'ordre és el de les fitxes; si una publicació declarada és
   * anterior a una fitxa, eixe poble canvia de lloc quan arriba el Mur.
   */

  return (
    <UniversalPage
      title={t('section.pobles.kicker', 'Pobles')}
      subtitle={t('section.pobles.title', 'Nodes i territori')}
      lead={t('section.pobles.subtitle', 'Explora els pobles i el seu context territorial.')}
      chrome="system"
      showLogos={true}
    >
      <div className="sdp-card-grid">
        {status === 'loading' && (
          <div>
            <p>{t('section.pobles.loading', 'Carregant els pobles...')}</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <p>{t('section.pobles.error', 'Hi ha hagut un problema carregant els pobles.')}</p>
            <pre>{error?.message || String(error)}</pre>
          </div>
        )}
        {status === 'ready' && sortedAndActiveTowns.length === 0 && (
          <div>
            {t('section.pobles.noResults', 'Cap poble trobat.')}
          </div>
        )}
        {status === 'ready' && sortedAndActiveTowns.map((town) => {
          /* T63.2 · el descriptor del poble ('poble', id i ruta): Connectar se
             l'emporta, com sempre. */
          const poble = objecteDe(town, 'pobles');
          /* Onada 5 (ordre del Mestre, 261008) · La caputxa és l'entitat
             («Gent de la Torre») i el seu poble, no la comarca, i porta al xat
             comú del poble: el mateix subjecte poble:<id> que «Comentar · En
             públic» i la pàgina de detall (T63.2). El cos i la foto continuen
             portant a la pàgina del poble (mainHref).
             Onada 6 (pla 261009_0245, ítem 4) · La caputxa i «Comentar» obrin el
             xat amb el nom de la gent (objecteDelPobleXat, el mateix de la
             pàgina del poble): el fil es diu «Gent de la Torre».
             Onada 8 (261009; requeriments, punt 4: «Zero excepcions») ·
             Derogada la caputxa cap al xat: la boina porta a la fitxa del
             poble (la ruta del seu descriptor, `poble`: /pobles/<id>), com el
             cos de la targeta. Al xat de la gent s'hi entra pel botó gran «Anar al
             xat» de dins de la targeta (la ranura `accio` d'UniversalCard, el
             mateix botó de la targeta d'El Xat) i per «Comentar · En públic».
             El requeriment diu «afegir»: amb etiquetesAmbAccio, la targeta
             conserva les seues etiquetes (la província, la comarca i la
             Viquipèdia, Onada 5) i el botó va just després (Llei del Píxel). */
          const xatDelPobleObjecte = objecteDelPobleXat(town);
          const xatDelPoble = rutaXatDePagina(xatDelPobleObjecte);
          const portaDelXat = xatDelPoble
            ? { id: 'xat-del-poble', verb: t('section.xat.anarAlXat', 'Anar al xat'), desti: xatDelPoble, varietat: 'primari' }
            : null;
          const data = dataDElement(town);
          /* Onada 5 (F5, fase 3) · Les dades manen: l'`author` de la fitxa
             (la llavor porta el nom curt «Gent de la Torre») i, si no en porta,
             la regla única de nomsDelPoble.js, la mateixa de l'H1 i de la barra
             taronja de la seua pàgina. Igual amb l'article de la Viquipèdia i
             els drets: els de la fitxa, si en porta; si no, el títol del poble
             i el copyright de la Viquipèdia d'editorial.js.
             Onada 6 (prompt 261009_0230, punt 6: cap poble escrit al codi) · Les
             desambiguacions de Sella i Relleu ja són dades (wikipedia_title de
             townsSeed.js i de supabase/seed.sql): ací només queda la regla
             general. */
          const articleDeViquipedia = encodeURIComponent(String(town.wikipedia_title || town.title || town.name || '').replace(/ /g, '_'));

          return (
            <UniversalCard
              key={town.id}
              author={town.author || nomDeLaGent(town.title || town.name)}
              authorHref={poble?.ruta || undefined}
              accio={portaDelXat ? <PortaDePagina porta={portaDelXat} /> : null}
              etiquetesAmbAccio
              avatarUrl={town.avatar_url || town.image_url || town.imageSrc}
              location={town.title || town.name}
              time={data.time}
              date={data.date}
              dateTime={data.dateTime}
              imageUrl={town.imageSrc || town.image_url}
              imageAlt={town.title}
              title={town.title}
              subtitle={town.comarca}
              /* Onada 8 (261009) · Sense el <div> del mig: CardBody ja
                 l'embolcalla amb div.sp-card-text, i els marges es fusionen
                 igual. El <p> es queda: amb body={town.content}, un poble sense
                 text perdria el paràgraf i el seu marge. */
              body={<p className="sp-card-text">{town.content}</p>}
              /* Onada 5 · Categorització de la targeta (skill sdp-universal-page
                 §4): la província és la categoria i la comarca, l'etiqueta. */
              labels={[
                { text: t('section.pobles.kicker', 'Pobles'), className: 'sdp-badge-system', href: '/pobles' },
                ...(town.provincia ? [{ text: town.provincia, className: 'sdp-badge-category' }] : []),
                ...(town.comarca ? [{ text: town.comarca, className: 'sdp-badge-tag' }] : []),
                ...(town.population ? [{ text: town.population, className: 'sdp-badge-accent', href: '/poblacio' }] : []),
                { 
                  text: t('section.pobles.wikipedia_link', "Publicat a la Viquipèdia"), 
                  className: 'sdp-badge-neutral', 
                  href: `https://ca.wikipedia.org/wiki/${articleDeViquipedia}`
                }
              ]}
              copyright={town.copyright || COPYRIGHT_VIQUIPEDIA}
              mainHref={getSectionItemPath('pobles', town.id)}
              hasFooter={true}
              showTranslate={true}
              showComment={true}
              showShare={true}
              showConnect={true}
              /* T43 (ordre del Mestre, 260928) · es connecta el poble (objecte
                 'poble', id i ruta), no un títol solt.
                 Onada 6 · L'objecte de la targeta diu on porta «Comentar · En
                 públic»: el xat de la gent (el mateix subjecte poble:<id>).
                 Connectar continua amb el descriptor de sempre (onConnect). */
              objecte={xatDelPobleObjecte}
              onConnect={() => navigate(rutaConnectarObjecte(poble))}
            />
          );
        })}
      </div>
    </UniversalPage>
  );
}
