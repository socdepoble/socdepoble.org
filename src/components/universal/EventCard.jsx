import { UniversalCard } from './../PedraSeca';
import { resolveAsset } from '../../config/assetResolver';
import { COPYRIGHT_SDP, RUTA_CALENDARI, dataDElement, dataHoraDeBarra, rutaCalendariDeLaData } from './editorial.js';
import { DEFAULT_AUTHOR } from './UniversalUtils.js';
import { esRutaInterna } from '../../config/objecteConnectable.js';
import { fontImatgePropia, fontVideoPropia } from '../../utils/sanitize.js';

/**
 * T5 (ordre del Mestre, 260930) · Les fonts de la pastilla d'un acte del
 * model d'esdeveniment (utils/esdeveniment.js), per als lectors
 * d'editorial.js (dataHoraDeBarra, dataDeDocument): el seu inici, un dia sol o
 * un dia amb hora. El Mur ordena les targetes pel mateix instant (MurSection).
 */
export const fontsDeLActe = ({ inici, totElDia }) => ({ publicat: totElDia ? inici.data : inici.dataHora });

/* Llei del Píxel · Una hora escrita al costat del dia que el model no sap
   llegir («19h», «10:00:00», «A les 19:00») es pinta tal qual, com abans: no
   s'inventa cap hora, però tampoc no se'n perd cap d'escrita. Per al calendari
   l'acte continua sent de tot el dia. Amb un `inici` al payload, mana el model. */
function horaEscrita(esdeveniment, item) {
  if (!esdeveniment.totElDia || item.inici != null || typeof item.time !== 'string') return '';
  return item.time.trim();
}

/* La pastilla d'un acte: el dia (i l'hora) del model, llegits en hora local
   amb el lector únic del Mur (editorial.js). Un dia sol no porta hora. Sense
   acte vàlid, la regla T51 de qualsevol element (dataDElement): la de
   publicació, mai com a dia de l'acte. Cap toISOString ni new
   Date('AAAA-MM-DD'), que es lligen en UTC. */
function dataDeLActe(esdeveniment, item) {
  if (!esdeveniment || item?.boinaDataPublicacio === true) return dataDElement(item);
  const data = dataHoraDeBarra(fontsDeLActe(esdeveniment));
  return { ...data, time: data.time || horaEscrita(esdeveniment, item) };
}

/* seguretat-01 (261104) · El text d'una peça de `calendar_badge`: una cadena,
   tal qual; un número finit, el seu text (com abans, amb String()); una peça
   buida (0, ''), cap; qualsevol altra cosa (un objecte, una llista, un booleà),
   cap, i la insígnia hi posa la reserva de quan falta. */
const pecaDeLaInsignia = (valor) => (valor && (typeof valor === 'string' || Number.isFinite(valor)) ? String(valor) : '');

/* La insígnia només diu el dia en què passa l'acte: sense acte, cap. El dia
   és el de la pastilla (el seu dateTime local) i el nom del mes, el d'eixe dia
   al calendari local. Quan l'acte és multi-dia i porta `calendar_badge` o
   quan la boina mostra la data de publicació (`boinaDataPublicacio`), el
   quadrat negre reflectix el rang de dates del curs o l'inici de l'acte.
   seguretat-01 (261104) · Defensa en profunditat: el traductor d'entrada
   (mapejadorSeccions.js) ja neteja la insígnia d'una publicació d'un veí, però
   la llavor i app_content no hi passen. Cada peça es llig amb pecaDeLaInsignia
   i mai es fa String() d'un objecte: un {"toString":0} dins de `dia` tombava
   la targeta i, amb ella, el Mur i el Calendari sencers. */
function insigniaDeCalendari(esdeveniment, dateTime, item = null) {
  if (!esdeveniment && !item?.calendar_badge) return null;
  const iniciClau = (esdeveniment?.inici?.data || esdeveniment?.inici?.dataHora || dateTime || '').slice(0, 10);
  if (item?.calendar_badge && typeof item.calendar_badge === 'object') {
    const cb = item.calendar_badge;
    const label = pecaDeLaInsignia(cb.label);
    return {
      dia: pecaDeLaInsignia(cb.dia),
      mes: pecaDeLaInsignia(cb.mes),
      any: pecaDeLaInsignia(cb.any) || iniciClau.slice(0, 4),
      dateTime: pecaDeLaInsignia(cb.dateTime) || iniciClau,
      ...(label ? { label } : {})
    };
  }
  if (!esdeveniment || !dateTime) return null;
  const clau = item?.boinaDataPublicacio ? iniciClau : dateTime.slice(0, 10);
  const [any, mes, dia] = clau.split('-').map(Number);
  return {
    dia: String(dia),
    mes: new Date(any, mes - 1, dia).toLocaleDateString('ca-ES', { month: 'long' }).toUpperCase(),
    any: String(any),
    dateTime: clau
  };
}

/* Onada 6 · La classe de l'etiqueta que porta a una pàgina: la píndola fa
   24px i l'enllaç de dins l'ompli i allarga la diana fins a --sdp-touch
   (components.css). Només la porten les etiquetes «Agenda» d'un acte (ací i
   al detall, elementDeSeccio.js): les etiquetes enllaçades d'altres targetes
   no canvien de píxels. */
const CLASSE_ETIQUETA_ENLLACADA = 'sp-card-label--enllac';

/**
 * Onada 6 (prompt 261009_0230, punt 1; pla de l'Onada 5, tasca 16: «El botó
 * "Agenda" de la targeta portarà a la data específica del Calendari») ·
 * L'etiqueta «Agenda» d'un acte porta al Calendari en el dia de l'acte (el de
 * la seua insígnia, `dia` 'AAAA-MM-DD'): la vista Mes amb el dia triat i les
 * seues targetes davall (editorial.js · rutaCalendariDeLaData). Sense dia (cap
 * acte vàlid), l'etiqueta de sempre, sense enllaç. La pastilla de data
 * continua portant al mes (ordre del Mestre, 261001, carril A).
 */
export function etiquetaAgendaDelDia(dia) {
  const ruta = rutaCalendariDeLaData(dia);
  return ruta !== RUTA_CALENDARI
    ? { text: 'Agenda', className: `sdp-badge-category ${CLASSE_ETIQUETA_ENLLACADA}`, href: ruta }
    : { text: 'Agenda', className: 'sdp-badge-category' };
}

/**
 * T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · On porta la boina
 * d'un acte: la pàgina de qui signa (`deQuiSigna`, la ruta que en fa qui
 * pinta la targeta) o, si no se sap qui és, el sistema i la reserva «Sóc de
 * Poble» (sense nom propi) van al perfil de Sóc de Poble (DEFAULT_AUTHOR.href,
 * RUTA_PERFIL_PROJECTE de config/navigation.js; Onada 8, 261009: abans, la
 * pàgina del projecte). Un nom sense identitat coneguda no s'endevina: sense
 * enllaç.
 */
export function rutaDeLaBoinaDeLActe(item, deQuiSigna) {
  if (deQuiSigna) return deQuiSigna;
  const ambNomPropi = Boolean(item?.author_name || item?.author);
  return item?.isSystem || !ambNomPropi ? DEFAULT_AUTHOR.href : undefined;
}

/* T43 (ordre del Mestre, 260928) · `onConnect`: qui pinta la targeta hi passa
   el Connectar amb el descriptor de l'esdeveniment. Sense ell, el genèric.
   T63.2 · `objecte`: el mateix descriptor tipat ('esdeveniment'); Comentar
   obri el xat comú de l'acte (useAccions). Sense ell, el de la 'pagina'.
   T5 · `esdeveniment`: el model de l'acte (acteAEsdeveniment), que fa qui
   pinta la targeta (MurSection): components/ no importa de sections/.
   T6 · `authorHref`: la pàgina de qui signa (rutaDePerfilDAutor), que fa qui
   pinta la targeta pel mateix motiu: navigation.js arrossega la llavor.
   Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
   PROHIBIDES (PRIVACITAT).» La imatge i l'avatar d'un acte, com els d'una
   publicació (TargetaDelMur): el mode estricte (fontImatgePropia de
   utils/sanitize.js, cap servidor de tercers, tampoc els avatars OAuth) i
   sense referent (`imatgePrivada`). Una de fora no es demana: cap portada, i
   la silueta de sempre en lloc de l'avatar.
   Gauntlet 261016 (Bloc -1; ordre del Mestre: l'avatar de la persona pilot
   és «sempre» la seua foto, mai el logotip verd) · `authorName` i
   `authorAvatar`, opcionals: el nom i l'avatar de qui signa ja resolts per
   qui pinta la targeta (TargetaDelMur, amb signaturaDeQuiSigna de la llavor),
   pel mateix motiu que `authorHref`. Hi passen davant de les dades de
   l'acte. Sense elles, el DOM de sempre (Llei del Píxel).
   Revisió del Gauntlet 261017 (ID1, actes) · `authorAvatar` null, a
   propòsit: signa una persona i no té foto. Cap logotip de reserva al costat
   del seu nom (vegeu avatarUrl). components/ no llig qui signa (autorDe és de
   navigation.js): ho diu qui pinta la targeta (TargetaDelMur).
   Fase D (261020, tasca 2) · `ambModeracio` (false), explícita: «Més
   opcions» a la caputxa (UniversalCard). Sense, el DOM de sempre. */
export function EventCard({ item, esdeveniment = null, onConnect, objecte, authorHref, authorName, authorAvatar, ambModeracio = false, enquadramentTargeta = null }) {
  const data = dataDeLActe(esdeveniment, item);
  const insignia = insigniaDeCalendari(esdeveniment, data.dateTime, item);

  // Use entradilla if available, then lead, then description (unless omitted for protagonist video cards)
  const bodyContent = item.ometEntradillaTargeta === true
    ? null
    : (item.entradilla || item.lead || (item.description ? <p className="sp-card-text">{item.description}</p> : null));

  // Custom badges for event
  /* Onada 6 · «Agenda» porta al dia de l'acte al Calendari (el de la insígnia). */
  const labels = item.labels || [
    etiquetaAgendaDelDia(insignia?.dateTime),
    item.id === 'aplec-2023' || item?.title?.toLowerCase().includes('aplec') ? { text: 'Aplec', className: 'sdp-badge-category' } : null
  ].filter(Boolean);

  return (
    <UniversalCard
      title={item.title || item.name}
      subtitle={item.subtitle}
      body={bodyContent}
      imageUrl={fontImatgePropia(resolveAsset((typeof item.image_url === 'string' ? item.image_url : null) || (typeof item.image === 'string' ? item.image : null) || ''))}
      imageAlt={item.imageAlt || item.title || item.name || ''}
      videoUrl={typeof item.video_url === 'string' && item.video_url.trim() ? fontVideoPropia(resolveAsset(item.video_url)) : undefined}
      imatgePrivada
      /* IDEA-42 (B7h, marató 261101_2143) · La targeta 16:9 amb el punt focal
         de l’autor: l’enquadrament ja net que passa TargetaDelMur
         (mapejadorSeccions · portadaDeLaPublicacio; components/ no el llig).
         Sense, la targeta de sempre. */
      formaMitja={enquadramentTargeta?.format}
      posicioMitja={enquadramentTargeta ?? undefined}
      author={authorName || item.author_name || item.author || "Sóc de Poble"}
      /* T6 · Derogat per l'ordre del Mestre del 261004 (prompt 261004_0515):
         el sistema ja no porta a /pobles, i qui signa ja té enllaç. */
      authorHref={rutaDeLaBoinaDeLActe(item, authorHref)}
      /* Onada 8 (261009) · La reserva és l'avatar de Sóc de Poble (el PNG),
         no un literal: ja ve resolt i resolveAsset no el torna a tocar.
         Revisió del Gauntlet 261017 (ID1, actes) · `authorAvatar={null}` (qui
         pinta la targeta sap que signa una persona sense foto): cap reserva de
         la marca, la silueta, com al detall de l'acte. Sense la prop, com
         sempre. */
      avatarUrl={fontImatgePropia(resolveAsset((typeof authorAvatar === 'string' ? authorAvatar : null) || (typeof item.author_avatar === 'string' ? item.author_avatar : null) || (authorAvatar === null ? '' : DEFAULT_AUTHOR.avatarUrl)))}
      location={item.author_location || item.location || item.population || "La Torre de les Maçanes"}
      date={data.date}
      time={data.time}
      dateTime={data.dateTime}
      copyright={item.copyright || COPYRIGHT_SDP}
      calendarBadge={insignia}
      labels={labels}
      /* Auditoria 261007 (B) · Defensa en profunditat: l'enllaç de tota la
         targeta només és una ruta de l'app (esRutaInterna). Un mainHref de
         fora (un payload escrit per PostgREST) navegava la pestanya de
         l'amfitrió; el de les pàgines de sistema ja és intern. */
      mainHref={esRutaInterna(item.mainHref) ? item.mainHref : `/events/${item.id}`}
      showPin={item.isAvis || false}
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
      onConnect={onConnect}
      objecte={objecte}
      ambModeracio={ambModeracio}
    />
  );
}
