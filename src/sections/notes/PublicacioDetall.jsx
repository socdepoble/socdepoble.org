/**
 * PublicacioDetall.jsx — una publicació pròpia (Mur, Mercat, agenda o
 * Multimèdia) vista des del MAS (T1): fitxa al llistat i lectura a la columna
 * dreta. No és cap nota i no s'edita ací: el botó porta a la publicació de
 * veres.
 *
 * Esmena 3 del pla 261007_1645 (ordre del Mestre, 261007: «El component
 * original renderitzava el carrusel de fotos i les variacions sense perdre
 * la localització de l'element; això s'ha de recuperar») · Un producte del
 * Mercat es llig com la seua pàgina (/mercat/:id, ItemDetailSection), amb la
 * mateixa maquinària de detail/: la portada (la primera foto o, amb més d'una,
 * el carrusel, portadaDElement), l'entradilla de l'element (no el subtítol
 * repetit) i, davall de «Obri al Mercat», el cos de la secció (descripció i
 * variacions, renderBody). Abans pintava de portada l'imageSrc, que per a la
 * Samarreta és el logotip quadrat de qui ven, i cap foto més.
 * Es conserven com eren, fins que el Mestre decidisca si s'igualen a la
 * pàgina de la ruta: l'etiqueta («Mercat», no «Producte» i l'id), els drets
 * de reserva («© Sóc de Poble») i la boina (l'autoria de la barra taronja,
 * T6, amb seller i la reserva «Sóc de Poble»). El Mur i l'agenda pinten com
 * abans, fora de les imatges de tercers (Decisió 3 del Mestre, 261007, més
 * avall); la Multimèdia, com abans del tot.
 * Per a totes les seccions, Compartir envia l'enllaç de la publicació (la
 * seua ruta), mai el del Bloc (/notes?…), com el lector de connexions
 * (ConnexioDetall); i el logotip que la persona va pujar damunt de l'H1
 * (logo_image, ordre E del 261007) es pinta com a la pàgina publicada.
 * Grup E de l'Onada 4 (261008) · Una pàgina del sistema que el Mur signa com
 * a «Sóc de Poble» (isSystem) es llig com la seua ruta (LectorDePaginaDelSistema);
 * el cos, només si la ruta és una pàgina de text.
 */
import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ItemMedia } from '../../components/universal/workspace/ItemMedia.jsx';
import { Boto } from '../../components/PedraSeca/index.js';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { compartix, urlPerCompartir, useUbicacioApp } from '../../components/PedraSeca/hooks/useAccions.js';
import { renderRichText } from '../detail/detailRichText.jsx';
import {
  avatarAutorDElement, buildMercatDetailSectionMeta, cosAmbImatgesPropies, esSeccioDelMur, imatgePropiaDelDetall, portadaDElement
} from '../detail/detailSectionMeta.jsx';
import { paginaDElement, useLogoEntitatDElement } from '../detail/elementDeSeccio.js';
import { dataDElement } from '../../components/universal/editorial.js';
import { objecteDe, objecteDePagina, RUTA_PERFIL_PROJECTE, rutaDePerfilDAutor } from '../../config/navigation.js';
import { accioDeLaPagina } from '../../config/systemPages.js';
import { useEntitatDelProjecte } from '../../hooks/useEntitatDelProjecte.js';
import { pageKeyDeRuta, propsDePaginaDeText } from '../text/paginaDeText.js';
import { CosDeLaPagina } from '../text/TextSection.jsx';
import { ETIQUETA_SECCIO } from './masDeLUsuari.js';
/* Esmena 2 del pla 261007_1645 · el que l'actor ja té publicat, al peu. */
import { PublicacionsDeLActor } from '../mur/PublicacionsDeLActor.jsx';
import { titolDeLHistoric, useVeuHistoric } from '../mur/usePublicacionsDeLActor.js';

/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · On porta la barra
 * taronja d'una publicació: la pàgina de qui la signa (rutaDePerfilDAutor,
 * que porta l'entitat pilot al seu perfil); sense nom propi, la reserva «Sóc
 * de Poble» va al perfil de Sóc de Poble (RUTA_PERFIL_PROJECTE; Onada 8,
 * 261009: abans, al projecte). Un nom sense identitat coneguda no
 * s'endevina: sense enllaç, com a la targeta del Mur.
 */
export function rutaDeLaBarraDeLaPublicacio(publicacio) {
  const deQuiSigna = rutaDePerfilDAutor(publicacio);
  if (deQuiSigna) return deQuiSigna;
  return publicacio?.author_name || publicacio?.seller ? undefined : RUTA_PERFIL_PROJECTE;
}

/** La fitxa del llistat: la mateixa forma que qualsevol fitxa del gestor.
 *  Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
 *  PROHIBIDES (PRIVACITAT)») · La miniatura d'una publicació del Mur, del
 *  Mercat o de l'agenda passa pel mateix mode estricte que el seu lector
 *  (imatgePropiaDelDetall): una de fora no es demana i la fitxa porta el glif
 *  de sempre (ItemMedia sense imatge). La pròpia, i Multimèdia, com abans. */
export function PublicacioFitxa({ item, active, onSelect }) {
  const imatge = imatgePropiaDelDetall(item?.data?.seccio, item?.image);
  const fitxa = imatge === item?.image ? item : { ...item, image: '' };
  return (
    <button
      type="button"
      className="sdp-gestor-fitxa"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <ItemMedia item={fitxa} titleFallback="Publicació" />
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-gestor-fitxa__titol">{item.title}</span>
        {item.subtitle ? <span className="sdp-gestor-fitxa__subtitol">{item.subtitle}</span> : null}
      </span>
    </button>
  );
}

/* Esmena 2 del pla 261007_1645 · El peu (el que l'actor ja té publicat en la
   mateixa secció, sense la publicació oberta), o null: les props de PageFrame
   per a les dues lectures, la d'una publicació i la d'una pàgina del sistema. */
function peuDeLaPublicacio({ veuHistoric, seccio, id, t }) {
  return veuHistoric ? {
    peuDePagina: <PublicacionsDeLActor seccio={seccio} exclouId={id} />,
    etiquetaPeuDePagina: titolDeLHistoric(seccio, t)
  } : null;
}

/**
 * Grup E de l'Onada 4 (prompt 261008_1201, tasca 2; decisió del Mestre del
 * 261008) · Una pàgina del sistema (isSystem: /projecte, /page/xat…) vista des
 * del MAS de l'entitat pilot. Es llig com la seua ruta: les props de
 * TextSection (propsDePaginaDeText, com el lector de connexions) i el seu cos
 * pel mateix camí (CosDeLaPagina). La data és la del copy, que
 * targetesDeSistema passa a created_at. Només lectura:
 *  · «Obri la pàgina» porta a la seua ruta (mainHref), i Compartir envia eixe
 *    enllaç, mai el del Bloc (/notes?…);
 *  · Comentar, el xat comú de la pàgina (objecteDePagina, com la seua targeta
 *    del Mur);
 *  · l'acció gran de la pàgina, si en té (El Xat: «Anar al xat»), davall de
 *    l'H1: la mateixa porta de la targeta i de /page/xat (PortaDePagina);
 *  · al peu, el que l'entitat ja té publicat al Mur, sense esta pàgina.
 * Sense autor propi, com a la ruta i com ConnexioDetall: la barra taronja
 * signa amb el de sèrie.
 * Revisió del grup E (troballa 2) · El cos només quan la ruta és la pàgina de
 * text d'esta mateixa clau (pageKeyDeRuta, la regla del lector de
 * connexions). /disseny munta DesignSection, /notes el Bloc i /wikidepoble la
 * Wiki: el seu copy no és el que pinta la ruta, i el lector es queda amb la
 * capçalera de la targeta del Mur i «Obri la pàgina».
 */
function LectorDePaginaDelSistema({ pagina, ruta, t, onObri, onShare, peu }) {
  const clau = String(pagina.id);
  const ambCos = pageKeyDeRuta(pagina.mainHref) === clau;
  const porta = accioDeLaPagina(clau, t);
  const objecte = objecteDePagina({ titol: pagina.title || pagina.name, ruta: pagina.mainHref, id: pagina.id });
  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      {...propsDePaginaDeText({ ...pagina, date: pagina.created_at }, clau, t)}
      onConnect={false}
      onShare={onShare}
      objecte={objecte}
      {...(porta ? { accioPrincipal: <PortaDePagina porta={porta} /> } : null)}
      {...peu}
    >
      {ruta ? (
        <div className="sdp-alerta__accions">
          <Boto varietat="secundari" icona={ExternalLink} onClick={onObri}>Obri la pàgina</Boto>
        </div>
      ) : null}
      {ambCos ? <CosDeLaPagina html={pagina.html} /> : null}
    </UniversalPage>
  );
}

export function PublicacioDetall({ item }) {
  const navigate = useNavigate();
  /* Compartir · on està l'app (el router, no la barra d'adreces, que dins
     d'un amfitrió és la seua) i el toast del porta-retalls, com ConnexioDetall. */
  const router = useUbicacioApp();
  const { showToast } = useToast();
  const { t } = useUIActions();
  /* T6 en remot · l'id de servidor de l'entitat pilot: quan arriba, la barra
     de les seues publicacions torna a pintar-se i porta al seu perfil. */
  useEntitatDelProjecte();
  const { seccio, item: publicacio, ruta } = item?.data || {};
  /* Esmena 3 (261007_1645) · La secció del Mercat de detail/, només per a
     llegir-ne les regles (portada, fotos, cos): l'element ja ve a data.item.
     Sense useElementDeSeccio: el lector no parpelleja quan la font recarrega. */
  const seccioMercat = useMemo(() => buildMercatDetailSectionMeta({ t }), [t]);
  /* Ordre E (261007) · El logotip propi (logo_image), també el que resol el
     port. Els hooks, abans del retorn anticipat. `logoEnCami`: el port encara
     el resol (revisió adversarial del 261007). */
  const { logo: logoPropi, carregant: logoEnCami } = useLogoEntitatDElement(publicacio);
  /* Esmena 2 (261007_1645) · Si l'actor actiu veu l'històric d'esta secció
     (la mateixa regla que PublicacionsDeLActor; el Foraster, no). */
  const veuHistoric = useVeuHistoric(seccio);
  if (!publicacio) return null;
  /* Grup E (261008) · Una pàgina del sistema: la seua lectura, després dels hooks. */
  if (publicacio.isSystem) {
    return (
      <LectorDePaginaDelSistema
        pagina={publicacio}
        ruta={ruta}
        t={t}
        onObri={() => navigate(ruta)}
        onShare={ruta ? () => compartix(item.title, urlPerCompartir(ruta, router), showToast) : undefined}
        peu={peuDeLaPublicacio({ veuHistoric, seccio, id: publicacio.id, t })}
      />
    );
  }
  const etiqueta = ETIQUETA_SECCIO[seccio] || seccio || 'Publicació';
  /* Norma del Mestre, 261004 (prompt 261004_1108, línies 66-69 i T2) · Si la
     signa una persona (o la IA), reconeguda per identificador, la capçalera
     porta el seu avatar redó davant de l'H1, el mateix de la boina; l'entitat
     del projecte porta el seu logotip per la boina (el seu perfil, PageFrame).
     La regla, una per als dos lectors: avatarAutorDElement (detailSectionMeta).
     Decisió 3 del Mestre (261007, confirmada: «Imatges externes al Mur:
     PROHIBIDES (PRIVACITAT)») · Relleu 261007 (peça «imatges-detall») · El
     lector porta el mode estricte de la pàgina de la ruta per a les seccions
     del Mur ('mur', 'mercat', 'events'; imatgePropiaDelDetall): l'avatar redó,
     el de la barra taronja i la portada. Multimèdia, com abans. */
  const nomAutor = publicacio.author_name || publicacio.seller || '';
  const avatarAutor = avatarAutorDElement(publicacio, nomAutor, seccio);
  /* T6 · L'autoria de la barra taronja, la de sempre (també per al Mercat).
     Decisió 3 (261007) · Un avatar de fora passa a '' i no a null: la barra
     pinta la silueta de sempre (BarraTaronja), i un null deixaria que PageFrame
     hi posara l'avatar de sèrie (la marca de Sóc de Poble signaria la
     publicació d'un veí). */
  const autoriaDeLaBarra = {
    authorName: publicacio.author_name || publicacio.seller || 'Sóc de Poble',
    authorAvatar: imatgePropiaDelDetall(seccio, publicacio.author_avatar || publicacio.avatar_url || '') || '',
    authorLocation: publicacio.author_location || publicacio.population || publicacio.town_name || '',
    authorHref: rutaDeLaBarraDeLaPublicacio(publicacio)
  };
  /* Esmena 3 (261007_1645) · Un producte, com la seua pàgina: de paginaDElement
     només la portada (heroImage i heroAlt) i l'entradilla; el carrusel
     (portadaDElement) entra per topBarData.heroComponent i no xafa l'autoria. */
  const esProducte = seccio === 'mercat';
  /* Decisió 3 (261007) · Relleu 261007 (peça «imatges-detall», punt g) · El
     cos d'una publicació o d'un acte del Mur passa pel mode estricte del
     sanejador, com a la seua pàgina (cosAmbImatgesPropies): cap <img> de
     tercers. El d'un producte ja hi passa a renderBody. Multimèdia, com abans. */
  const cos = publicacio.content || publicacio.description || '';
  const cosDelLector = !esProducte && esSeccioDelMur(seccio) ? cosAmbImatgesPropies(cos) : cos;
  const pagina = esProducte ? paginaDElement(seccioMercat, publicacio) : null;
  const portada = esProducte ? portadaDElement(seccioMercat, publicacio, pagina, t) : null;
  /* Compartir · l'enllaç de la publicació, mai /notes?… (només l'obri qui la
     té). Sense ruta, el de sèrie de la UniversalPage. */
  const onShare = ruta ? () => compartix(item.title, urlPerCompartir(ruta, router), showToast) : undefined;
  /* Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de
     llistar elements de la categoria per a l'avatar actiu ha d'estar
     disponible per tot el sistema») · A Notes > Mercat, el que s'obri primer
     és la publicació (la Samarreta), no una nota: davall d'ella, el que l'actor
     ja té publicat en la mateixa secció, sense ella mateixa. Per la ranura
     `peuDePagina` de PageFrame, fora de l'article. Multimèdia no en té
     (pregunta oberta): cap prop nova.
     Decisió per defecte del Mestre (261007) · el Foraster no veu cap
     històric. Revisió adversarial del 261007 · Sense la guarda d'actor,
     PageFrame pintava la regió (amb nom i coixí) encara que el component no
     pintara res: ara, sense actor o amb el convidat, cap prop nova. */
  const peu = peuDeLaPublicacio({ veuHistoric, seccio, id: publicacio.id, t });
  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title={item.title}
      subtitle={publicacio.subtitle || undefined}
      lead={(esProducte ? pagina.lead : item.excerpt) || undefined}
      /* Decisió 3 (261007) · La portada d'un producte ja ve filtrada
         (paginaDElement); la de la fitxa, pel mateix mode estricte. */
      heroImage={(esProducte ? pagina.heroImage : imatgePropiaDelDetall(seccio, item.image)) || undefined}
      heroAlt={esProducte ? pagina.heroAlt : item.title}
      labels={item.labels || []}
      copyright={publicacio.copyright || '© Sóc de Poble'}
      /* T51 · la data real de la publicació, la mateixa que el seu detall al
         Mur (editorial.js · dataDElement): la de publicació o creació, o la
         d'edició (updated_at) si és posterior. */
      {...dataDElement(publicacio)}
      topBarData={{ ...autoriaDeLaBarra, ...(portada?.topBarData || {}) }}
      /* Revisió adversarial del 261007 · Mentre el port resol el logotip, cap
         avatar, com a la pàgina de la ruta (ItemDetailSection). */
      avatarAutor={logoEnCami ? null : avatarAutor}
      /* Ordre E (261007) · el logotip propi passa davant de la marca de sèrie
         i de l'avatar (PageFrame, via c); sense, cap prop nova. */
      {...(logoPropi ? { logoEntitat: logoPropi } : null)}
      onConnect={false}
      onShare={onShare}
      /* T63.2 · Comentar obri el xat comú de la publicació (Mur, Mercat o
         agenda), el mateix que la seua targeta: mai un de la vista del MAS. */
      objecte={objecteDe(publicacio, seccio)}
      {...peu}
    >
      <div className="sdp-alerta__accions">
        <Boto varietat="secundari" icona={ExternalLink} onClick={() => navigate(ruta)}>
          {`Obri al ${etiqueta}`}
        </Boto>
      </div>
      {/* Esmena 3 (261007_1645) · Un producte, el cos de la seua pàgina
          (descripció i variacions); la resta, el text com abans.
          Decisió 3 (261007) · El cos, sense cap <img> de tercers (cosDelLector). */}
      {esProducte ? seccioMercat.renderBody(publicacio) : renderRichText(cosDelLector)}
    </UniversalPage>
  );
}

export default PublicacioDetall;
