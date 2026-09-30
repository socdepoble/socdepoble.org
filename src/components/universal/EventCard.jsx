import React from 'react';
import { UniversalCard } from './../PedraSeca';
import { resolveAsset } from '../../config/assetResolver';
import { dataDElement, dataHoraDeBarra } from './editorial.js';

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
  if (!esdeveniment) return dataDElement(item);
  const data = dataHoraDeBarra(fontsDeLActe(esdeveniment));
  return { ...data, time: data.time || horaEscrita(esdeveniment, item) };
}

/* La insígnia només diu el dia en què passa l'acte: sense acte, cap. El dia
   és el de la pastilla (el seu dateTime local) i el nom del mes, el d'eixe dia
   al calendari local. */
function insigniaDeCalendari(esdeveniment, dateTime) {
  if (!esdeveniment || !dateTime) return null;
  const clau = dateTime.slice(0, 10);
  const [any, mes, dia] = clau.split('-').map(Number);
  return {
    dia: String(dia),
    mes: new Date(any, mes - 1, dia).toLocaleDateString('ca-ES', { month: 'long' }).toUpperCase(),
    any: String(any),
    dateTime: clau
  };
}

/* T43 (ordre del Mestre, 260928) · `onConnect`: qui pinta la targeta hi passa
   el Connectar amb el descriptor de l'esdeveniment. Sense ell, el genèric.
   T63.2 · `objecte`: el mateix descriptor tipat ('esdeveniment'); Comentar
   obri el xat comú de l'acte (useAccions). Sense ell, el de la 'pagina'.
   T5 · `esdeveniment`: el model de l'acte (acteAEsdeveniment), que fa qui
   pinta la targeta (MurSection): components/ no importa de sections/. */
export function EventCard({ item, esdeveniment = null, onConnect, objecte }) {
  const data = dataDeLActe(esdeveniment, item);

  // Use entradilla if available, then lead, then description
  const bodyContent = item.entradilla || item.lead || (item.description ? <p className="sp-card-text">{item.description}</p> : null);
  
  // Custom badges for event
  const labels = item.labels || [
    { text: 'Agenda', className: 'sdp-badge-category' },
    item.id === 'aplec-2023' || item?.title?.toLowerCase().includes('aplec') ? { text: 'Aplec', className: 'sdp-badge-category' } : null
  ].filter(Boolean);

  return (
    <UniversalCard
      title={item.title || item.name}
      subtitle={item.subtitle}
      body={bodyContent}
      imageUrl={resolveAsset((typeof item.image_url === 'string' ? item.image_url : null) || (typeof item.image === 'string' ? item.image : null) || '')}
      imageAlt={item.imageAlt || item.title || item.name || ''}
      author={item.author_name || item.author || "Sóc de Poble"}
      authorHref={item.isSystem ? "/pobles" : undefined}
      avatarUrl={resolveAsset((typeof item.author_avatar === 'string' ? item.author_avatar : null) || '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg')}
      location={item.author_location || item.location || item.population || "La Torre de les Maçanes"}
      date={data.date}
      time={data.time}
      dateTime={data.dateTime}
      copyright={item.copyright || "© Sóc de Poble / Fet per la IAIA i Nano Banana"}
      calendarBadge={insigniaDeCalendari(esdeveniment, data.dateTime)}
      labels={labels}
      mainHref={item.mainHref || `/events/${item.id}`}
      showPin={item.isAvis || false}
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
      onConnect={onConnect}
      objecte={objecte}
    />
  );
}
