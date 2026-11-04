/* Fixture històrica de VinculacioEntitat: conserva el formulari FEDI23 substituït a /connectar per a les seues regressions; no és una entrada de producció. */
import { useEffect, useId, useRef, useState } from 'react';
import { Boto, Camp, Selector } from '../../src/components/PedraSeca/index.js';
import * as port from '../../src/data/backendPort.js';
import { abastDe } from '../../src/sections/pobles/useEntitatsDelPoble.js';
import { textDeRol } from '../../src/sections/profile/ConnexionsPubliques.jsx';
import { entradaSessio } from '../../src/data/identitat.js';

const reserva = (_clau, text) => text;
const disponible = () => { try { return port.teCapacitat('connexionsPubliques') === true; } catch { return false; } };
const rols = ['administrador', 'treballador', 'usuari'];

export function VinculacioEntitat({ contacte, identitats = [], usuariId, config = {}, visor = null, t = reserva }) {
  if (!disponible() || !usuariId || !contacte || contacte.propia || !['persona', 'entitat', 'grup'].includes(contacte.tipus)) return null;
  const llista = Array.isArray(identitats) ? identitats : [];
  const organitzacions = llista.filter(org => org?.tipus === 'entitat' && org.id && org.nom && ['owner', 'admin'].includes(org.rol));
  const orgId = contacte.seguiment?.id;
  if (!orgId || (contacte.tipus === 'persona' && !organitzacions.length)) return null;
  if (contacte.tipus !== 'persona' && llista.some(org => org?.tipus === 'entitat' && String(org.id) === String(orgId))) return null;
  // ConnectarSection està subscrit a SessionContext; una nova entrada encara
  // amb el mateix usuari remunta el formulari i invalida el resultat anterior.
  const clau = JSON.stringify([usuariId, entradaSessio(), visor, contacte.tipus, orgId, abastDe(config), organitzacions.map(org => [org.id, org.rol])]);
  return <FormulariVinculacio key={clau} contacte={contacte} organitzacions={organitzacions} usuariId={usuariId} config={config} t={t} />;
}

function FormulariVinculacio({ contacte, organitzacions, usuariId, config, t }) {
  const id = useId();
  const persona = contacte.tipus === 'persona';
  const [orgId, setOrgId] = useState(String(organitzacions[0]?.id || ''));
  const [rol, setRol] = useState('usuari');
  const [estat, setEstat] = useState('llest');
  const muntat = useRef(true);
  const ocupat = useRef(false);
  useEffect(() => { muntat.current = true; return () => { muntat.current = false; }; }, []);
  const org = organitzacions.find(item => String(item.id) === orgId);
  const envia = async () => {
    if (ocupat.current || (persona && !org)) return;
    ocupat.current = true; setEstat('desant');
    try {
      const resposta = persona
        ? await port.inclouPersonaEnEntitat({ orgId, personaId: String(contacte.seguiment.id), rol }, config)
        : await port.solicitaUnirSeAEntitat({ orgId: String(contacte.seguiment.id), rol }, config);
      if (!resposta || resposta.rol !== rol || String(resposta.orgId) !== (persona ? orgId : String(contacte.seguiment.id))
        || (persona ? String(resposta.personaId) !== String(contacte.seguiment.id)
          : resposta.estat !== 'pendent' || String(resposta.personaId) !== String(usuariId))) throw new Error('Resposta no vàlida');
      if (muntat.current) setEstat('fet');
    } catch { if (muntat.current) setEstat('error'); }
    finally { ocupat.current = false; }
  };
  return (
    <section aria-labelledby={id} className="sdp-connectar__seccio">
      <h3 id={id}>{persona
        ? t('section.perfil.connexions.vincula', 'Vincular esta persona a una entitat')
        : t('section.perfil.connexions.demana', 'Demanar formar part de l’entitat')}</h3>
      {persona ? <Camp etiqueta={t('section.perfil.connexions.entitat', 'Entitat que administres')}>
        <Selector value={orgId} disabled={estat === 'desant'} onChange={event => { setOrgId(event.target.value); setRol('usuari'); setEstat('llest'); }}
          opcions={organitzacions.map(item => ({ valor: String(item.id), etiqueta: item.nom }))} />
      </Camp> : null}
      <Camp etiqueta={t('section.perfil.connexions.rol', 'Rol en l’entitat')}>
        <Selector value={rol} disabled={estat === 'desant'} onChange={event => { setRol(event.target.value); setEstat('llest'); }}
          opcions={rols.map(valor => ({ valor, etiqueta: textDeRol(valor, t), desactivat: persona && valor === 'administrador' && org?.rol !== 'owner' }))} />
      </Camp>
      {!persona ? <p>{t('section.perfil.connexions.pendentAjuda', 'La sol·licitud queda pendent: no et dona cap rol ni permís fins que l’entitat l’aprove.')}</p> : null}
      <Boto varietat="secundari" onClick={envia} carregant={estat === 'desant'} disabled={estat === 'desant' || estat === 'fet'}>
        {persona ? t('section.perfil.connexions.inclou', 'Vincular a l’entitat') : t('section.perfil.connexions.envia', 'Enviar la sol·licitud')}
      </Boto>
      <p role="status" aria-live="polite">{estat === 'fet' ? persona
        ? t('section.perfil.connexions.vinculat', 'Persona vinculada a l’entitat amb el rol triat.')
        : t('section.perfil.connexions.pendent', 'Sol·licitud guardada, pendent de revisió per l’entitat.')
        : estat === 'error' ? t('section.perfil.connexions.errorVincle', 'No s’ha pogut guardar el vincle. Comprova els teus permisos i torna-ho a provar.') : ''}</p>
    </section>
  );
}
