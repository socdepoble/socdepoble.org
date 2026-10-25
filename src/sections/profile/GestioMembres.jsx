import { useEffect, useMemo, useRef, useState } from 'react';
import { Boto, Camp, CampText, Casella, DialegConfirmacio, GrupCamps, Selector, Taula } from '../../components/PedraSeca';
import { AvatarResolt } from '../../components/universal/identitat/AvatarResolt.jsx';
import { etiquetaDeRol } from '../../components/universal/identitat/rols.js';
import { useUIActionsOpcional } from '../../app/contexts/UIContext';
import { omple } from '../../config/moderacio.js';
/* IDEA-22, punt 2 (pla 261025_0200) · La tria de la propietària (capacitat 'consentimentTitular'). */
import { estatTitularPublic, marcaTitularPublic, teCapacitat } from '../../data/backendPort.js';
import { ETIQUETES_TIPUS, MINIM_CERCA, accionsSobre, clauDeMembre, ordenaMembres } from './membresModel.js';
import { QuiSegueixOrganitzacio } from './Seguidors.jsx';

/* ═══════════════════════════════════════════════════════════════════
   Ordre del Mestre (261008, grup C) · GESTIÓ DELS MEMBRES

   La pinta «El compte» d'una organització (DetallAjust, acció 'membres')
   per a qui l'administra: la llista de membres (persones i organitzacions),
   l'alta directa (sense invitació), el canvi de rol i la baixa. Només peces
   de Pedra Seca. Què s'oferix ho decidix membresModel.js; el que es pot fer
   de veres, el port (el servidor torna a dir-ho).

   `accions` ve del context del Perfil: { usuariId, llistaMembres,
   desaMembre, llevaMembre, cercaCandidats }.
   ═══════════════════════════════════════════════════════════════════ */

/* La cerca de candidats espera que la persona pare d'escriure. */
export const ESPERA_CERCA = 300;

const ROLS_D_ALTA = Object.freeze([
  { valor: 'member', etiqueta: 'Membre' },
  { valor: 'admin', etiqueta: 'Administra' },
]);

/* Un error del port ja ve en valencià i amb `code`; sense text, el genèric. */
const textDError = (error, generic) => (typeof error?.message === 'string' && error.message.trim() ? error.message : generic);
const esCancel = (error) => error?.name === 'AbortError';

/* ═══════════════════════════════════════════════════════════════════
   IDEA-22, punt 2 (Directiva del Mestre, àudios 01:14-01:16; pla
   261025_0200) · MOSTRAR-SE COM A TITULAR A CONNECTAR

   Qui connecta amb una entitat a /connectar pot connectar també amb la seua
   persona titular, però NOMÉS si ella ho ha triat: el servidor no diu mai
   qui administra una entitat, i un perfil públic no és cap permís. La
   casella només la veu la propietària (rol 'owner'; el servidor ho torna a
   dir, SDP-TIT-001), i cap administradora no la pot marcar per ella. Diu
   abans del clic que cal el perfil públic. Sense la capacitat
   'consentimentTitular', o amb un servidor sense la migració 2610250300
   (NO-DISPONIBLE), no pinta res. Els textos, per t() (cinc diccionaris):
   fora de l'App (les proves soltes), la reserva valenciana.
   ═══════════════════════════════════════════════════════════════════ */
const teConsentimentTitular = () => {
  try { return teCapacitat('consentimentTitular') === true; } catch { return false; }
};
const traduccioDeReserva = (_clau, reserva) => reserva;
/* Un servidor que no la sap fer, o que diu que no n'ets la propietària: la casella no hi és. */
const SENSE_CASELLA = new Set(['NO-DISPONIBLE', 'SDP-TIT-001']);

export function TriaTitular({ orgId, nomOrg }) {
  const t = useUIActionsOpcional()?.t || traduccioDeReserva;
  const disponible = teConsentimentTitular() && Boolean(orgId);
  const [estat, setEstat] = useState({ orgId: null, carregant: true, valor: false, error: null });
  const [desant, setDesant] = useState(false);
  /* El valor que s'està desant: la casella el mostra de seguida (si no, la
     controlada tornaria a l'anterior fins que contestara el servidor). */
  const [pendent, setPendent] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const viu = useRef(true);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);
  /* P1-15 del Llibre (auditoria Port Neutral 261025, PN-03) · El component no
     es remunta en canviar d'entitat (no porta key), i la resposta tardana
     d'una tria d'A s'escrivia a l'estat de B: la casella de B es desmarcava,
     deia «Ja no et mostrem com a titular d'A» i es quedava «desant».
     Consens Gauntlet 2120 (C2120-01) · Descartar eixa resposta no bastava:
     A→B→A amb l'escriptura d'A encara en vol deixava la casella d'A al revés
     del servidor (la lectura en tornar arribava abans que l'escriptura, i la
     confirmació ja no escrivia). Ara les escriptures en vol es guarden per
     entitat, una com a molt per a cadascuna: en tornar a A, A continua
     «desant» amb el valor que s'està desant, i la confirmació la reconcilia
     amb el valor del servidor. Només escriu l'entitat que es veu: mai B. */
  const orgVisible = useRef(null);
  const enVol = useRef(new Map());
  // Escriptures confirmades per entitat: una lectura que va començar abans no les desfà.
  const confirmades = useRef(new Map());

  useEffect(() => {
    if (!disponible) return undefined;
    const control = new AbortController();
    orgVisible.current = orgId;
    const enCurs = enVol.current.get(orgId);
    const confirmadesEnLlegir = confirmades.current.get(orgId) ?? 0;
    setEstat({ orgId, carregant: true, valor: false, error: null });
    setMissatge(enCurs ? enCurs.missatge : null);
    setDesant(Boolean(enCurs));
    setPendent(enCurs ? enCurs.valor : null);
    Promise.resolve()
      .then(() => estatTitularPublic(orgId, { signal: control.signal }))
      .then((resposta) => {
        if (control.signal.aborted) return;
        const valor = resposta?.titularPublic === true;
        setEstat((previ) => {
          if (previ.orgId !== orgId) return previ;
          // Una escriptura d'esta entitat ha confirmat després de començar la lectura: mana ella.
          if ((confirmades.current.get(orgId) ?? 0) !== confirmadesEnLlegir) return { ...previ, carregant: false };
          return { orgId, carregant: false, valor, error: null };
        });
      })
      .catch((error) => {
        if (control.signal.aborted || esCancel(error)) return;
        setEstat((previ) => {
          if (previ.orgId !== orgId) return previ;
          // Com en l'èxit: si una escriptura d'esta entitat ha confirmat mentrestant, mana ella.
          if ((confirmades.current.get(orgId) ?? 0) !== confirmadesEnLlegir) return { ...previ, carregant: false };
          return { orgId, carregant: false, valor: false, error: { code: error?.code ?? null } };
        });
      });
    return () => control.abort();
  }, [disponible, orgId]);

  if (!disponible || estat.orgId !== orgId || SENSE_CASELLA.has(estat.error?.code)) return null;

  async function canvia(e) {
    const nou = e.target.checked === true;
    const orgDeLaTria = orgId;
    if (desant || enVol.current.has(orgDeLaTria)) return;
    const operacio = { valor: nou, missatge: { tipus: 'desant', text: t('section.perfil.titular.desant', 'Desant la tria…') } };
    enVol.current.set(orgDeLaTria, operacio);
    // Només pinta qui encara es veu i és l'entitat d'esta tria (en tornar-hi, també).
    const visible = () => viu.current && orgVisible.current === orgDeLaTria;
    setDesant(true);
    setPendent(nou);
    setMissatge(operacio.missatge);
    try {
      const resposta = await marcaTitularPublic(orgDeLaTria, nou, {});
      const valor = resposta?.titularPublic === true;
      confirmades.current.set(orgDeLaTria, (confirmades.current.get(orgDeLaTria) ?? 0) + 1);
      if (!visible()) return;
      setEstat((previ) => (previ.orgId === orgDeLaTria ? { ...previ, valor, error: null } : previ));
      setMissatge({
        tipus: 'exit',
        text: omple(valor
          ? t('section.perfil.titular.desat', 'Desat: et mostrarem com a titular de {nom} a Connectar mentre el teu perfil i l’entitat siguen públics.')
          : t('section.perfil.titular.llevat', 'Ja no et mostrem com a titular de {nom}.'), { nom: nomOrg })
      });
    } catch (error) {
      if (visible() && !esCancel(error)) setMissatge({ tipus: 'error', text: t('section.perfil.titular.error', 'No s’ha pogut desar la tria. Torna-ho a provar.') });
    } finally {
      if (enVol.current.get(orgDeLaTria) === operacio) enVol.current.delete(orgDeLaTria);
      if (visible()) {
        setDesant(false);
        setPendent(null);
      }
    }
  }

  /* Revisió del torn 261025_0200 · La casella no es desactiva mentre desa:
     la que té el focus el perdria. canvia() ja ignora un segon toc, i com
     que és controlada, el valor torna al que diu el servidor. */
  return (
    <div aria-busy={desant || undefined}>
      <Casella
        etiqueta={omple(t('section.perfil.titular.etiqueta', 'Mostra’m com a titular de {nom} a Connectar'), { nom: nomOrg })}
        ajuda={omple(t('section.perfil.titular.ajuda', 'Qui connecte amb {nom} també podrà connectar amb tu, a la mateixa pantalla. Només es veu mentre el teu perfil i l’entitat siguen públics; ho pots llevar quan vulgues, i ningú més no ho pot triar per tu.'), { nom: nomOrg })}
        checked={desant && pendent !== null ? pendent : estat.valor} disabled={estat.carregant || Boolean(estat.error)} onChange={canvia} />
      {estat.error ? (
        <p className="sdp-camp__error" role="alert">{t('section.perfil.titular.errorLectura', 'No s’ha pogut llegir si et mostrem com a titular.')}</p>
      ) : null}
      {missatge ? (
        <p className={{ exit: 'sdp-text-exit', desant: 'sdp-camp__ajuda' }[missatge.tipus] ?? 'sdp-camp__error'} role={missatge.tipus === 'error' ? 'alert' : 'status'}>
          {missatge.text}
        </p>
      ) : null}
    </div>
  );
}

export function GestioMembres({ organitzacio, accions }) {
  const orgId = organitzacio?.id;
  const nomOrg = organitzacio?.nom || '';
  const rolMeu = organitzacio?.dades?.role;
  const propietaria = rolMeu === 'owner';
  const { usuariId = null, llistaMembres, desaMembre, llevaMembre, cercaCandidats } = accions || {};

  const [estat, setEstat] = useState({ carregant: true, membres: [], error: null });
  const [missatge, setMissatge] = useState(null);
  const [ocupat, setOcupat] = useState(null);
  const [text, setText] = useState('');
  const [cerca, setCerca] = useState({ cercant: false, candidats: [] });
  const [triat, setTriat] = useState('');
  const [rolNou, setRolNou] = useState('member');
  const [aLlevar, setALlevar] = useState(null);

  /* Guarda de doble enviament (síncrona: dos clics al mateix tic) i de
     desmuntatge (una resposta tardana no escriu en un component mort). */
  const ocupatRef = useRef(false);
  const viu = useRef(true);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);
  const membresRef = useRef(estat.membres);
  membresRef.current = estat.membres;

  /* Correcció 261008 · DESPRÉS DE TANCAR LA CONFIRMACIÓ de «Llevar».
     Dialeg tanca el <dialog> modal en el seu efecte (el del fill), i este, el
     del pare, s'executa després en el mateix commit. Per això:
     · el missatge (èxit o error) es pinta quan la pàgina ja no és inert: dins
       del mateix commit naixeria en una regió inert i el lector no l'anunciaria;
     · després d'una baixa, el botó que obria la confirmació se n'ha anat amb la
       fila i el <dialog> no hi pot tornar el focus: va a la llista (la regió de
       Taula, enfocable). Si ha fallat, el <dialog> el torna al botó de la fila. */
  const arrel = useRef(null);
  const despresDeTancar = useRef(null);
  useEffect(() => {
    const pendent = despresDeTancar.current;
    if (!pendent || aLlevar) return;
    despresDeTancar.current = null;
    if (pendent.missatge) setMissatge(pendent.missatge);
    if (pendent.focusALaLlista) {
      const desti = arrel.current?.querySelector('[role="region"]') || arrel.current?.querySelector('input[type="search"]');
      desti?.focus?.();
    }
  }, [aLlevar]);

  /* ── La llista: es llig en obrir-se i quan canvia l'organització ── */
  useEffect(() => {
    const control = new AbortController();
    setEstat({ carregant: true, membres: [], error: null });
    /* Una altra organització: res de l'alta ni dels avisos de l'anterior es queda. */
    setText('');
    setTriat('');
    setRolNou('member');
    setMissatge(null);
    Promise.resolve()
      .then(() => llistaMembres(orgId, { signal: control.signal }))
      .then((llista) => {
        if (!control.signal.aborted) setEstat({ carregant: false, membres: ordenaMembres(llista), error: null });
      })
      .catch((error) => {
        if (control.signal.aborted || esCancel(error)) return;
        setEstat({ carregant: false, membres: [], error: textDError(error, 'No s’ha pogut llegir la llista de membres.') });
      });
    return () => control.abort();
  }, [orgId, llistaMembres]);

  /* ── La cerca de candidats, amb espera ── */
  const consulta = text.trim();
  useEffect(() => {
    if (consulta.length < MINIM_CERCA) {
      setCerca({ cercant: false, candidats: [] });
      return undefined;
    }
    const control = new AbortController();
    setCerca((previ) => ({ ...previ, cercant: true }));
    const rellotge = setTimeout(() => {
      Promise.resolve()
        .then(() => cercaCandidats(orgId, consulta, { signal: control.signal, membres: membresRef.current }))
        .then((candidats) => {
          if (!control.signal.aborted) setCerca({ cercant: false, candidats: Array.isArray(candidats) ? candidats : [] });
        })
        .catch((error) => {
          if (control.signal.aborted || esCancel(error)) return;
          setCerca({ cercant: false, candidats: [] });
          setMissatge({ tipus: 'error', text: textDError(error, 'No s’ha pogut cercar a la gent del poble.') });
        });
    }, ESPERA_CERCA);
    return () => { clearTimeout(rellotge); control.abort(); };
  }, [consulta, orgId, cercaCandidats]);

  /* Qui ja és membre no s'oferix (tampoc el que s'acaba d'afegir). */
  const candidats = useMemo(() => {
    const ja = new Set(estat.membres.map(clauDeMembre));
    return cerca.candidats.filter((candidat) => !ja.has(clauDeMembre(candidat)));
  }, [cerca.candidats, estat.membres]);
  const candidat = candidats.find((c) => clauDeMembre(c) === triat) || null;
  /* Només la propietària nomena administradores, i una organització sempre és membre. */
  const potTriarRol = propietaria && candidat?.tipus !== 'organitzacio';

  const opcionsCandidat = [
    {
      valor: '',
      etiqueta: consulta.length < MINIM_CERCA ? 'Primer escriu un nom…'
        : cerca.cercant ? 'Cercant…'
          : candidats.length ? 'Tria un resultat…' : 'Cap resultat',
    },
    ...candidats.map((c) => ({ valor: clauDeMembre(c), etiqueta: `${c.nom || 'Sense nom'} · ${ETIQUETES_TIPUS[c.tipus]}` })),
  ];

  /* Una operació a la vegada: la guarda, el missatge i el «Treballant…». */
  async function opera(clau, feina, textError) {
    if (ocupatRef.current) return;
    ocupatRef.current = true;
    setOcupat(clau);
    setMissatge(null);
    try {
      const exit = await feina();
      if (viu.current && exit) setMissatge({ tipus: 'exit', text: exit });
    } catch (error) {
      if (viu.current && !esCancel(error)) setMissatge({ tipus: 'error', text: textDError(error, textError) });
    } finally {
      ocupatRef.current = false;
      if (viu.current) setOcupat(null);
    }
  }

  const posaMembre = (desat) => setEstat((previ) => ({
    ...previ,
    membres: ordenaMembres([...previ.membres.filter((m) => clauDeMembre(m) !== clauDeMembre(desat)), desat]),
  }));

  function afegeix(e) {
    e?.preventDefault?.();
    if (!candidat) return undefined;
    const dades = { tipus: candidat.tipus, id: candidat.id, rol: potTriarRol ? rolNou : 'member' };
    return opera('afegeix', async () => {
      const desat = await desaMembre(orgId, dades);
      if (!viu.current) return null;
      posaMembre(desat);
      setTriat('');
      setText('');
      setRolNou('member');
      return `${desat?.nom || candidat.nom} ja és membre de ${nomOrg}.`;
    }, 'No s’ha pogut afegir el membre.');
  }

  function canviaRol(membre, rol) {
    return opera(`rol:${clauDeMembre(membre)}`, async () => {
      const desat = await desaMembre(orgId, { tipus: membre.tipus, id: membre.id, rol });
      if (!viu.current) return null;
      posaMembre(desat);
      return rol === 'admin' ? `${membre.nom} ja administra ${nomOrg}.` : `${membre.nom} ja no administra ${nomOrg}.`;
    }, 'No s’ha pogut canviar el rol.');
  }

  /* Correcció 261008 · La confirmació es tanca sempre, també si falla (com
     «Eixir» a DetallAjust): el missatge es pinta fora del <dialog> modal, i
     amb ell obert l'error quedaria inert i amagat darrere. El missatge i el
     focus els posa l'efecte «després de tancar» (dalt), no opera(). */
  function confirmaLleva() {
    const membre = aLlevar;
    if (!membre) return undefined;
    return opera('lleva', async () => {
      try {
        await llevaMembre(orgId, { tipus: membre.tipus, id: membre.id });
        if (!viu.current) return null;
        setEstat((previ) => ({ ...previ, membres: previ.membres.filter((m) => clauDeMembre(m) !== clauDeMembre(membre)) }));
        despresDeTancar.current = {
          missatge: { tipus: 'exit', text: `${membre.nom} ja no és membre de ${nomOrg}.` },
          focusALaLlista: true,
        };
      } catch (error) {
        if (esCancel(error)) throw error;
        despresDeTancar.current = { missatge: { tipus: 'error', text: textDError(error, 'No s’ha pogut llevar el membre.') } };
      } finally {
        if (viu.current) setALlevar(null);
      }
      return null;
    }, 'No s’ha pogut llevar el membre.');
  }

  const tancaLleva = () => { if (!ocupatRef.current) setALlevar(null); };

  /* Correcció 261008 · L'alta només s'oferix amb la llista llegida: si el
     servidor ja ha dit que no (NO-DISPONIBLE, SDP-ORGMEM-002…), el formulari
     prometria el que fallarà; i mentre es llig, la cerca no sabria qui ja hi és. */
  const llistaLlegida = !estat.carregant && !estat.error;

  return (
    <div ref={arrel}>
      {missatge ? (
        <p className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'} role={missatge.tipus === 'exit' ? 'status' : 'alert'}>
          {missatge.text}
        </p>
      ) : null}

      {estat.carregant ? (
        <p className="sdp-buit" role="status">Carregant els membres…</p>
      ) : estat.error ? (
        <p className="sdp-camp__error" role="alert">{estat.error}</p>
      ) : estat.membres.length ? (
        <Taula titol={`Membres de ${nomOrg}`}>
          <thead>
            <tr>
              <th scope="col">Membre</th>
              <th scope="col">Tipus</th>
              <th scope="col">Rol</th>
              <th scope="col">Accions</th>
            </tr>
          </thead>
          <tbody>
            {estat.membres.map((membre) => {
              const clau = clauDeMembre(membre);
              const sobre = accionsSobre(membre, { rolMeu, jo: usuariId });
              const esJo = membre.tipus === 'persona' && usuariId != null && String(membre.id) === String(usuariId);
              return (
                <tr key={clau}>
                  <td>
                    <AvatarResolt nom={membre.nom} src={membre.avatar || null} mida="sm" llavor={membre.id} alt="" titol="" />
                    {' '}{membre.nom || 'Sense nom'}{esJo ? ' (tu)' : ''}
                  </td>
                  <td>{ETIQUETES_TIPUS[membre.tipus] || ''}</td>
                  <td>{etiquetaDeRol(membre.rol) || 'Membre'}</td>
                  <td>
                    {sobre.rol || sobre.lleva ? (
                      <div className="sdp-alerta__accions">
                        {sobre.rol ? (
                          <Boto varietat="secundari" onClick={() => canviaRol(membre, sobre.rol)}
                            disabled={Boolean(ocupat)} carregant={ocupat === `rol:${clau}`}
                            aria-label={`${sobre.rol === 'admin' ? 'Nomenar administradora' : 'Tornar a membre'}: ${membre.nom}`}>
                            {sobre.rol === 'admin' ? 'Nomenar administradora' : 'Tornar a membre'}
                          </Boto>
                        ) : null}
                        {sobre.lleva ? (
                          <Boto varietat="perill" onClick={() => setALlevar(membre)} disabled={Boolean(ocupat)}
                            aria-label={`Llevar: ${membre.nom}`}>
                            Llevar
                          </Boto>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Taula>
      ) : (
        <p className="sdp-buit">Encara no hi ha cap membre.</p>
      )}

      {llistaLlegida ? (
        <form onSubmit={afegeix} noValidate>
          <GrupCamps llegenda="Afegir un membre">
            <Camp etiqueta="Cerca"
              ajuda={`Persones del poble o organitzacions que també administres. Escriu almenys ${MINIM_CERCA} lletres.`}>
              <CampText tipus="search" value={text} onChange={(e) => { setText(e.target.value); setTriat(''); }}
                autoComplete="off" maxLength={80} />
            </Camp>
            <Camp etiqueta="Qui vols afegir">
              <Selector value={triat} onChange={(e) => setTriat(e.target.value)} opcions={opcionsCandidat}
                disabled={!candidats.length} />
            </Camp>
            {potTriarRol ? (
              <Camp etiqueta="Rol">
                <Selector value={rolNou} onChange={(e) => setRolNou(e.target.value)} opcions={ROLS_D_ALTA} />
              </Camp>
            ) : null}
            <div className="sdp-alerta__accions">
              <Boto varietat="primari" tipus="submit" disabled={!candidat || Boolean(ocupat)} carregant={ocupat === 'afegeix'}>
                Afegir
              </Boto>
            </div>
          </GrupCamps>
        </form>
      ) : null}

      {/* IDEA-22, punt 2 · Només la propietària tria si es mostra com a titular a Connectar. */}
      {propietaria ? <TriaTitular orgId={orgId} nomOrg={nomOrg} /> : null}

      {/* T6b (IDEA-14; decisió del Mestre, 261024) · El veïnat connectat amb l'organització (P1-11, abans «Qui seguix»):
          la constància per a qui l'administra. Sense la capacitat
          'seguiments', res. */}
      <QuiSegueixOrganitzacio orgId={orgId} nom={nomOrg} />

      <DialegConfirmacio
        obert={Boolean(aLlevar)}
        onTanca={tancaLleva}
        onConfirma={confirmaLleva}
        titol={aLlevar ? `Llevar ${aLlevar.nom || 'este membre'} de ${nomOrg}?` : 'Llevar un membre'}
        descripcio="Deixarà de ser-ne membre. Es pot tornar a afegir quan calga."
        etiquetaConfirma="Llevar"
        destructiu
        carregant={ocupat === 'lleva'}
      />
    </div>
  );
}

export default GestioMembres;
