/**
 * PerfilPublicSection.jsx — la pàgina pública d'una persona, una entitat o
 * un agent IA (Lògica d'Usuari, T4).
 *
 *   · Rutes: /gent/:id, /empresa/:id, /grup/:id, /ajuntament/:id i
 *     /perfil/:id. El prefix és orientatiu; qui mana és l'identificador (id o
 *     slug), que es resol amb la capacitat 'directori' del port
 *     (loadPerfilPublic). Sense la capacitat, cau al catàleg d'agents del
 *     contingut base.
 *   · Mateixa anatomia que la fitxa editable (perfilCamps): H1 = nom, H2 =
 *     bio o descripció o rol, entradilla = lema, cos = presentació.
 *   · Una IA es diu: etiqueta i avís visibles, sempre.
 *   · Accions honestes: «Escriu-li» obri el xat amb eixa identitat (?amb=id)
 *     i «Edita la fitxa» només si la fitxa és de qui mira.
 *   · T43 (ordre del Mestre, 260928) · Una organització que la persona
 *     administra (pertinença owner/admin d'IdentitatContext) també porta
 *     «Edita la fitxa» (obri el Perfil a la seua fitxa, sense canviar
 *     d'identitat) i, si no és l'actor actiu, «Actua com a {Org}». El correu
 *     de l'organització només ix si l'ha fet públic, amb un mailto validat.
 */
import { useEffect, useState } from 'react';
import { Bot, MessageCircle, PencilLine, UserCheck } from 'lucide-react';
import { useNavigate, useParams } from '../../app/contexts/RouterContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { esRolQueMana } from '../../components/universal/identitat/rols.js';
import { enllacMailto } from './contacteOrganitzacio.js';
import { rutaFitxaOrganitzacio } from './perfilModel.js';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { useSEO } from '../../hooks/useSEO';
import { loadPerfilPublic, teCapacitat } from '../../data/backendPort.js';
import { renderRichText } from '../detail/detailRichText.jsx';
import { tipusDAgent } from './ProfileSection.jsx';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
/* T43 (ordre del Mestre, 260928) · Connectar una fitxa pública porta el seu
   descriptor i, per a una entitat o un grup, `organitzacio=ID`. La funció viu
   a config/navigation.js: el directori (ProfileSection) fa el mateix camí. */
import { objecteDePerfil, rutaConnectarPerfil } from '../../config/navigation.js';

const ETIQUETA = Object.freeze({ persona: 'Persona', entitat: 'Entitat', grup: 'Grup', ia: 'Intel·ligència artificial' });

/** El mateix DTO que loadPerfilPublic, però des del catàleg d'agents del paquet. */
export function perfilDelCataleg(agent) {
  if (!agent) return null;
  const tipus = tipusDAgent(agent);
  return {
    tipus, id: agent.id, slug: null, nom: agent.name, avatar: agent.avatar_url || '', hero: '', lema: agent.lema || '',
    bio: agent.role || '', presentacioHtml: agent.short_bio || '', poble: agent.town_name || '', esIA: tipus === 'ia',
    publicat: true, propietari: false, copyright: '', emoticona: ''
  };
}

let hostPromise;
function hostReady() {
  hostPromise ||= import('../../host.js').catch((error) => { hostPromise = null; throw error; });
  return hostPromise.then((host) => host.quanLlest());
}

/* Valor per defecte estable: un `[]` nou a cada render entraria als deps de
   l'efecte de càrrega i el faria girar sense parar (troballa de la refutació). */
const AGENTS_BUITS = Object.freeze([]);

export default function PerfilPublicSection({ agents = AGENTS_BUITS }) {
  const { agentId } = useParams();
  const { t } = useUIActions();
  const { externalConfig } = useUIState();
  const navigate = useNavigate();
  const { memberships = [], actor, setActor } = useIdentitat();
  const [estat, setEstat] = useState({ id: null, status: 'loading', perfil: null });

  useEffect(() => {
    let viu = true;
    const clau = String(agentId || '');
    setEstat({ id: clau, status: 'loading', perfil: null });
    (async () => {
      let perfil = null;
      if (teCapacitat('directori')) {
        try {
          await hostReady();
          perfil = await loadPerfilPublic(clau, externalConfig || {});
        } catch (error) {
          if (error?.name !== 'AbortError') console.warn('[PerfilPublic] No s’ha pogut llegir el perfil:', error?.message);
        }
      }
      // Una resposta buida del servidor és autoritativa. El catàleg només
      // suplix un node demostratiu que no implementa el port de directori.
      if (!teCapacitat('directori') && normalizeBackendConfig(externalConfig).dataMode !== 'remote') {
        perfil = perfilDelCataleg(agents.find((agent) => String(agent.id) === clau));
      }
      if (viu) setEstat({ id: clau, status: 'ready', perfil });
    })();
    return () => { viu = false; };
  }, [agentId, agents, externalConfig]);

  const perfil = estat.status === 'ready' ? estat.perfil : null;
  const carregant = estat.status !== 'ready';

  useSEO({
    title: perfil ? perfil.nom : t('section.perfil.public.noTrobat', 'Perfil no trobat'),
    description: perfil ? (perfil.lema || perfil.bio || '') : '',
    image: perfil?.avatar || null,
    type: perfil?.tipus === 'persona' ? 'Person' : 'Organization',
    index: Boolean(perfil?.publicat)
  });

  /* T63.2 · Mentre carrega o si no el troba, encara no sabem qui és (el prefix
     de la ruta és orientatiu i l'id pot ser un slug): cap xat, ni el comú de la
     ruta. Comentar es queda i el clic avisa (objecte={null}, useAccions). */
  if (carregant) {
    return (
      <UniversalPage chrome="system" showLogos={true} title={t('section.perfil.public.carregant', 'Carregant el perfil…')} objecte={null}>
        <p className="sdp-buit" role="status" aria-live="polite">{t('section.perfil.public.carregant', 'Carregant el perfil…')}</p>
      </UniversalPage>
    );
  }

  if (!perfil) {
    /* Poliment T45 · En remot la fitxa d'una altra persona encara no es pot
       llegir (falta la RPC perfil_public, supabase/perfils.js): dir només
       «és privada» seria fals per a qui la té pública. */
    const remot = normalizeBackendConfig(externalConfig).dataMode === 'remote';
    return (
      <UniversalPage
        chrome="system"
        showLogos={true}
        title={t('section.perfil.public.noTrobat', 'Perfil no trobat')}
        lead={remot
          ? t('section.perfil.public.noTrobatTextRemot', 'Ningú del poble té este identificador, o la seua fitxa és privada. Les fitxes d’altres persones encara no es poden obrir en este servidor.')
          : t('section.perfil.public.noTrobatText', 'Ningú del poble té este identificador, o la seua fitxa és privada.')}
        labels={[{ text: 'Error', className: 'sdp-badge-system' }]}
        objecte={null}
      >
        <div className="sdp-alerta__accions">
          <Boto varietat="secundari" onClick={() => navigate('/perfil')}>{t('section.perfil.public.directori', 'Torna al directori')}</Boto>
        </div>
      </UniversalPage>
    );
  }

  const etiquetes = [
    { text: ETIQUETA[perfil.tipus] || ETIQUETA.persona, className: perfil.esIA ? 'sdp-badge-accent' : 'sdp-badge-system' },
    ...(perfil.poble ? [{ text: perfil.poble, className: 'sdp-badge-category' }] : []),
    ...(perfil.propietari ? [{ text: t('section.perfil.public.teua', 'La teua fitxa'), className: 'sdp-badge-tag' }] : [])
  ];

  /* T43 · La pertinença de qui mira (per id o per slug). En remot, el
     directori no diu `propietari` per a una organització: la pertinença sí. */
  const esOrganitzacio = perfil.tipus === 'entitat' || perfil.tipus === 'grup';
  const membership = esOrganitzacio
    ? memberships.find((m) => String(m.id) === String(perfil.id) || (perfil.slug && m.slug === perfil.slug)) || null
    : null;
  const administra = Boolean(membership) && esRolQueMana(membership.role);
  const actuaComEsta = administra && actor?.tipus === 'entitat' && String(actor.id) === String(membership.id);
  const rutaEdita = administra ? rutaFitxaOrganitzacio(membership.id) : '/el-meu-perfil';
  const correuPublic = esOrganitzacio ? String(perfil.correu || '').trim() : '';
  const mailto = correuPublic ? enllacMailto(correuPublic) : null;

  return (
    <UniversalPage
      chrome="full"
      layout="contained"
      title={perfil.nom}
      subtitle={perfil.bio || undefined}
      lead={perfil.lema || undefined}
      heroImage={perfil.hero || undefined}
      heroAlt={perfil.hero ? perfil.nom : ''}
      showLogos={false}
      labels={etiquetes}
      copyright={perfil.copyright || `© ${perfil.nom}`}
      /* T51 · la data real de la fitxa: `creat` i `modificat` del PerfilPublic
         (created_at i updated_at de la fila, que supabase/perfils.js i
         localPerfils.js ja passen). Sense ells no hi ha pastilla: mai la d'ara. */
      {...dataHoraDeBarra({ creat: perfil.creat, modificat: perfil.modificat })}
      /* T66 · L'espai central de la barra taronja, en lectura: l'emoticona
         triada (DTO PerfilPublic.emoticona) o la cel·la buida. Mai la ploma. */
      topBarData={{ authorName: perfil.nom, authorAvatar: perfil.avatar || '', authorLocation: perfil.poble || '', emoticona: perfil.emoticona || '' }}
      onConnect={rutaConnectarPerfil(perfil) ? () => navigate(rutaConnectarPerfil(perfil)) : false}
      /* T63.2 (doctrina del Mestre, 260928) · Comentar d'una persona o d'una IA
         és el missatge directe de sempre (/xat?amb=); d'una entitat o d'un
         grup, el xat comú de la seua pàgina (la Comunitat). «Escriu-li al xat»
         continua sent el directe per a tothom. */
      objecte={objecteDePerfil(perfil)}
    >
      {perfil.esIA ? (
        <Alerta to="avis" titol={t('section.perfil.public.iaTitol', 'Este perfil és una intel·ligència artificial')}>
          {t('section.perfil.public.iaText', 'La IAIA MarIA és una màquina de Sóc de Poble, en proves. Respon amb frases fetes i no substituïx cap persona del poble.')}
        </Alerta>
      ) : null}
      <div className="sdp-alerta__accions">
        <Boto varietat="primari" icona={perfil.esIA ? Bot : MessageCircle} onClick={() => navigate(`/xat?amb=${encodeURIComponent(perfil.id)}`)}>
          {perfil.esIA ? t('section.perfil.public.parlaIA', 'Parla amb la IAIA') : t('section.perfil.public.escriu', 'Escriu-li al xat')}
        </Boto>
        {perfil.propietari || administra ? (
          <Boto varietat="secundari" icona={PencilLine} onClick={() => navigate(rutaEdita)}>
            {t('section.perfil.public.edita', 'Edita la fitxa')}
          </Boto>
        ) : null}
        {administra && !actuaComEsta ? (
          <Boto varietat="secundari" icona={UserCheck} onClick={() => setActor?.('entitat', membership.id)}>
            {`Actua com a ${perfil.nom}`}
          </Boto>
        ) : null}
      </div>
      {actuaComEsta ? <p role="status">{`Ara actues com a ${perfil.nom}.`}</p> : null}
      {mailto ? (
        <p>
          {'Correu: '}
          <a href={mailto}>{correuPublic}</a>
        </p>
      ) : null}
      {perfil.presentacioHtml ? renderRichText(perfil.presentacioHtml) : null}
    </UniversalPage>
  );
}
