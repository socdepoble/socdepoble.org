/**
 * CapcaleraConversa.jsx — la capçalera de la conversa oberta (UX-A06, UX-D03,
 * UX-D04, XAT-M01): fletxa d'arrere només en mode estret, avatar, nom i la
 * línia dels altres membres. Cap botó de trucada ni cap promesa que no es
 * complisca: el menú «⋯» només du «Seleccionar missatges».
 *
 * Lògica d'Usuari (T4): fora dels grups, avatar i nom enllacen al perfil
 * públic de l'altra part (persona, entitat o la IAIA). La línia secundària
 * diu quan s'actua en nom d'una entitat (canal compartit) o quan l'altra part
 * és una intel·ligència artificial.
 *
 * En mode de selecció es convertix en la barra de la tria (eixir + recompte).
 *
 * Xat de pàgina (T63.2, onada 3): un fil amb `subjecte` porta la línia
 * «Sobre: <títol>» i el recompte de participants («{n} participants») en
 * lloc de la llista de noms. No enllaça a cap perfil (el fil no és de
 * ningú): avatar, nom i línia fan l'enllaç a la Pàgina Universal
 * (subjecte.ruta), amb la mateixa zona tàctil que l'enllaç al perfil
 * (--sdp-touch, Pedra Seca §6) en lloc d'un text de 14px.
 *
 * Un canal («Avisos») porta el megàfon i un grup sense imatge, la icona de
 * grup, com a la llista (AvatarFil).
 */
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, MoreVertical, X } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import { rutaDePerfil } from '../../../config/navigation.js';
import { AvatarFil } from './FilaConversa.jsx';

/* «{n} participants» (o «1 participant»); res si el backend no ho diu. */
function participantsDe(n, t) {
  const quants = Number(n);
  if (n == null || !Number.isFinite(quants) || quants < 0) return '';
  if (quants === 1) return t('section.xat.pagina.participant', '1 participant');
  return t('section.xat.pagina.participants', '{n} participants').replace('{n}', String(quants));
}

/* Només les rutes internes de l'aplicació: mai un enllaç a fora des d'ací. */
const esRutaInterna = (ruta) => typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//');

export default function CapcaleraConversa({ fil, onTorna, onSeleccionar, seleccio = null, t }) {
  const [menuObert, setMenuObert] = useState(false);
  const menuRef = useRef(null);
  const idSub = useId();

  /* El menú es tanca en clicar fora o amb Escape, sense tocar document.body.
     L'Escape que el tanca queda consumit (preventDefault): la selecció de
     xats de la llista, que també l'escolta, no l'ha de rebre dos vegades. */
  useEffect(() => {
    if (!menuObert) return undefined;
    const node = menuRef.current;
    const arrel = node?.getRootNode?.() || document;
    const tancaFora = (e) => { if (node && !node.contains(e.target)) setMenuObert(false); };
    const tancaEsc = (e) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      setMenuObert(false);
    };
    arrel.addEventListener('pointerdown', tancaFora);
    arrel.addEventListener('keydown', tancaEsc);
    return () => {
      arrel.removeEventListener('pointerdown', tancaFora);
      arrel.removeEventListener('keydown', tancaEsc);
    };
  }, [menuObert]);

  if (seleccio) {
    const { quants, onEixir } = seleccio;
    const recompte = quants === 0
      ? t('section.xat.seleccio.tria', 'Tria els missatges')
      : quants === 1
        ? t('section.xat.seleccio.triat', '1 triat')
        : t('section.xat.seleccio.triats', '{n} triats').replace('{n}', String(quants));
    return (
      <header className="sdp-xat-capcalera sdp-xat-capcalera--seleccio">
        <button type="button" className="sdp-xat-icona" onClick={onEixir} aria-label={t('section.xat.seleccio.eixir', 'Eixir de la selecció')}>
          <X size={24} aria-hidden="true" focusable="false" />
        </button>
        <strong className="sdp-xat-capcalera__info" aria-live="polite">{recompte}</strong>
      </header>
    );
  }

  const nom = fil?.name || fil?.title || t('section.xat.conversaSenseNom', 'Conversa');
  const altres = Array.isArray(fil?.altresNoms) ? fil.altresNoms : [];
  const esGrup = fil?.tipus === 'grup';
  const subjecte = fil?.subjecte || null;
  let linia = '';
  if (subjecte) linia = participantsDe(fil?.participants, t);
  else if (esGrup || altres.length > 1) linia = altres.join(', ');
  else if (fil?.comEntitat && fil?.entitatNom) linia = t('section.xat.entitat.canal', 'Canal de {nom}').replace('{nom}', fil.entitatNom);
  else if (fil?.esIA) linia = t('section.xat.ia.avis', 'Intel·ligència artificial en proves');

  /* L'altra part, amb id i tipus: només llavors hi ha perfil on anar. Un fil
     de pàgina no és de ningú: el seu enllaç va a la pàgina. */
  const contrapart = !esGrup && !subjecte && Array.isArray(fil?.altres) && fil.altres.length === 1 ? fil.altres[0] : null;
  const rutaPerfil = contrapart ? rutaDePerfil(contrapart.tipus, contrapart.id) : null;

  const titolSubjecte = subjecte ? subjecte.titol || nom : '';
  const rutaSubjecte = subjecte && esRutaInterna(subjecte.ruta) ? subjecte.ruta : null;
  const sobre = subjecte ? (
    <span className="sdp-xat-capcalera__sobre">{t('section.xat.pagina.sobre', 'Sobre: {titol}').replace('{titol}', titolSubjecte)}</span>
  ) : null;

  const identitat = (
    <>
      <AvatarFil fil={fil} nom={nom} mida="sm" />
      <div className="sdp-xat-capcalera__info">
        <strong className="sdp-xat-capcalera__nom">{nom}</strong>
        {sobre || linia ? (
          <span className="sdp-xat-capcalera__sub" id={idSub}>
            {sobre}
            {sobre && linia ? ' · ' : null}
            {linia}
          </span>
        ) : null}
      </div>
    </>
  );

  let capIdentitat = identitat;
  if (rutaPerfil) {
    capIdentitat = (
      <Link
        className="sdp-xat-capcalera__enllac"
        to={rutaPerfil}
        aria-label={t('section.xat.perfil.obri', 'Obri el perfil de {nom}').replace('{nom}', nom)}
      >
        {identitat}
      </Link>
    );
  } else if (rutaSubjecte) {
    /* El nom accessible diu on porta; «Sobre: …» i els participants en són
       la descripció, perquè el lector no els perda. */
    capIdentitat = (
      <Link
        className="sdp-xat-capcalera__enllac"
        to={rutaSubjecte}
        aria-label={t('section.xat.pagina.obri', 'Obri la pàgina {titol}').replace('{titol}', titolSubjecte)}
        aria-describedby={idSub}
      >
        {identitat}
      </Link>
    );
  }

  return (
    <header className="sdp-xat-capcalera">
      <button type="button" className="sdp-xat-icona d-mobile-only" onClick={onTorna} aria-label={t('section.xat.conversa.torna', 'Torna a la llista')}>
        <ArrowLeft size={24} aria-hidden="true" focusable="false" />
      </button>
      {capIdentitat}
      <div className="sdp-xat-capcalera__menu" ref={menuRef}>
        <button
          type="button"
          className="sdp-xat-icona"
          aria-label={t('section.xat.conversa.opcions', 'Opcions de la conversa')}
          aria-haspopup="menu"
          aria-expanded={menuObert}
          onClick={() => setMenuObert((obert) => !obert)}
        >
          <MoreVertical size={24} aria-hidden="true" focusable="false" />
        </button>
        {menuObert ? (
          <div className="sdp-xat-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              className="sdp-xat-menu__item"
              onClick={() => { setMenuObert(false); onSeleccionar?.(); }}
            >
              {t('section.xat.conversa.seleccionar', 'Seleccionar missatges')}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
