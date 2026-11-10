import { useEffect, useRef, useState } from 'react';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import { Alerta, AreaText, Boto, Camp, CampText, Casella } from '../../components/PedraSeca/index.js';
import * as port from '../../data/backendPort.js';
import { esRebuigDeNormes } from '../../data/errorsBackend.js';
import { codiDErrorResumSessions } from '../../data/resumSessionsDispositius.js';
/* SEG-R15b-02 i PRODNM-03 (revisió R15b) · Cap nom de persona real i cap promesa d'un servei no
   desplegat: la revisió la fa una persona amb rol de curadoria verificat al servidor, i aprovar
   no publica ni incorpora res enlloc. 5 llengües, com la resta de pàgines públiques (D-16).
   PRODNM-07 · Sense la capacitat 'curadoriaCultural' (l'adaptador només l'anuncia quan el build
   sap que la migració 2611091500 és aplicada) la pàgina ho diu, no fa cap petició i no recull res. */
const TEXTOS = {
  ca: {
    seccio: 'Aportacions i curadoria de Nodrir la IAIA',
    avisEstat: 'La revisió la fa una persona amb rol de curadoria verificat al servidor. Aprovar una aportació no la publica ni la incorpora al coneixement de la IAIA.',
    senseCapacitat: 'Este servidor encara no té activa la curadoria cultural. Esta pàgina no recull cap aportació fins que s’active.',
    titol: 'Comparteix cultura de poble',
    intro: 'Pots aportar receptes, memòria oral o lèxic amb autoria i poble. El text queda privat: el veuen qui l’ha enviat i la curadoria autoritzada. Este formulari només admet text; per a arxius o àudio, indica un enllaç.',
    rol: 'La revisió requerix un compte amb rol de curadoria verificat. El nom o el correu no concedixen permisos.',
    iniciaSessio: 'Inicia sessió per enviar una aportació i consultar les teues aportacions.',
    comprovant: 'Comprovant el servidor i els permisos…',
    camps: { titol: 'Títol de l’aportació', autoria: 'Autoria o informant', poble: 'Poble o comarca', contingut: 'Text cultural o enllaç documentat', permisos: 'Declare que tinc els permisos necessaris per aportar este contingut' },
    envia: 'Envia a revisió',
    safataCuradoria: 'Safata de curadoria autoritzada', propies: 'Les teues aportacions', safata: 'Safata cultural privada',
    info: 'Últimes aportacions accessibles al teu compte, amb un màxim de 200 en esta consulta.',
    rolConfirmat: 'El servidor ha confirmat el rol de curadoria.', rolReservat: 'La revisió està reservada a comptes amb rol de curadoria i segon factor.',
    buida: 'Encara no hi ha aportacions visibles.', nota: 'Nota de curadoria: ', notaPer: 'Nota de curadoria per a {titol}',
    accions: { aprovat: 'Aprova', correccio: 'Demana correcció', descartat: 'Descarta' },
    estats: { pendent_revisio: 'Pendent de revisió', aprovat: 'Aprovat per la curadoria', correccio: 'Cal una correcció', descartat: 'Descartat' },
    desat: 'Aportació desada al servidor, pendent de revisió. No s’ha publicat ni forma part del coneixement de la IAIA.',
    revisat: 'Revisió desada al servidor. Aprovar una aportació no la publica ni la incorpora al coneixement de la IAIA.',
    errors: {
      'sense-servidor': 'Este node encara no té el servidor de curadoria configurat. Cap aportació s’ha enviat.',
      'sense-migracio': 'El servidor encara no té la migració de curadoria 2611091500 aplicada. Cap aportació s’ha enviat ni revisat.',
      'sense-permis': 'El servidor ha refusat l’operació. Cal sessió per aportar i rol de curadoria amb segon factor per revisar.',
      normes: 'Cal acceptar les normes de convivència abans d’enviar una aportació.',
      propia: 'Una aportació teua l’ha de revisar una altra persona amb rol de curadoria.',
      error: 'No s’ha pogut completar l’operació. El servidor no ha confirmat cap canvi.'
    }
  },
  es: {
    seccio: 'Aportaciones y curaduría de Alimentar a la IAIA',
    avisEstat: 'La revisión la hace una persona con rol de curaduría verificado en el servidor. Aprobar una aportación no la publica ni la incorpora al conocimiento de la IAIA.',
    senseCapacitat: 'Este servidor aún no tiene activa la curaduría cultural. Esta página no recoge ninguna aportación hasta que se active.',
    titol: 'Comparte cultura de pueblo',
    intro: 'Puedes aportar recetas, memoria oral o léxico con autoría y pueblo. El texto queda privado: lo ven quien lo ha enviado y la curaduría autorizada. Este formulario solo admite texto; para archivos o audio, indica un enlace.',
    rol: 'La revisión requiere una cuenta con rol de curaduría verificado. El nombre o el correo no conceden permisos.',
    iniciaSessio: 'Inicia sesión para enviar una aportación y consultar tus aportaciones.',
    comprovant: 'Comprobando el servidor y los permisos…',
    camps: { titol: 'Título de la aportación', autoria: 'Autoría o informante', poble: 'Pueblo o comarca', contingut: 'Texto cultural o enlace documentado', permisos: 'Declaro que tengo los permisos necesarios para aportar este contenido' },
    envia: 'Enviar a revisión',
    safataCuradoria: 'Bandeja de curaduría autorizada', propies: 'Tus aportaciones', safata: 'Bandeja cultural privada',
    info: 'Últimas aportaciones accesibles para tu cuenta, con un máximo de 200 en esta consulta.',
    rolConfirmat: 'El servidor ha confirmado el rol de curaduría.', rolReservat: 'La revisión está reservada a cuentas con rol de curaduría y segundo factor.',
    buida: 'Todavía no hay aportaciones visibles.', nota: 'Nota de curaduría: ', notaPer: 'Nota de curaduría para {titol}',
    accions: { aprovat: 'Aprobar', correccio: 'Pedir corrección', descartat: 'Descartar' },
    estats: { pendent_revisio: 'Pendiente de revisión', aprovat: 'Aprobada por la curaduría', correccio: 'Necesita una corrección', descartat: 'Descartada' },
    desat: 'Aportación guardada en el servidor, pendiente de revisión. No se ha publicado ni forma parte del conocimiento de la IAIA.',
    revisat: 'Revisión guardada en el servidor. Aprobar una aportación no la publica ni la incorpora al conocimiento de la IAIA.',
    errors: {
      'sense-servidor': 'Este nodo aún no tiene configurado el servidor de curaduría. No se ha enviado ninguna aportación.',
      'sense-migracio': 'El servidor aún no tiene aplicada la migración de curaduría 2611091500. No se ha enviado ni revisado ninguna aportación.',
      'sense-permis': 'El servidor ha rechazado la operación. Hace falta sesión para aportar y rol de curaduría con segundo factor para revisar.',
      normes: 'Debes aceptar las normas de convivencia antes de enviar una aportación.',
      propia: 'Una aportación tuya debe revisarla otra persona con rol de curaduría.',
      error: 'No se ha podido completar la operación. El servidor no ha confirmado ningún cambio.'
    }
  },
  en: {
    seccio: 'Contributions and curation for Feed IAIA',
    avisEstat: 'Review is done by a person with a curator role verified on the server. Approving a contribution does not publish it or add it to IAIA’s knowledge.',
    senseCapacitat: 'This server does not have cultural curation enabled yet. This page does not collect any contributions until it is enabled.',
    titol: 'Share village culture',
    intro: 'You can contribute recipes, oral history or vocabulary with attribution and village. The text stays private: only the sender and authorised curators can see it. This form accepts text only; for files or audio, add a link.',
    rol: 'Reviewing requires an account with a verified curator role. A name or email address does not grant permissions.',
    iniciaSessio: 'Sign in to send a contribution and see your contributions.',
    comprovant: 'Checking the server and permissions…',
    camps: { titol: 'Contribution title', autoria: 'Author or informant', poble: 'Village or district', contingut: 'Cultural text or documented link', permisos: 'I declare that I have the permissions needed to contribute this content' },
    envia: 'Send for review',
    safataCuradoria: 'Authorised curation queue', propies: 'Your contributions', safata: 'Private cultural queue',
    info: 'Latest contributions available to your account, up to 200 in this query.',
    rolConfirmat: 'The server has confirmed the curator role.', rolReservat: 'Review is reserved for accounts with a curator role and a second factor.',
    buida: 'No contributions to show yet.', nota: 'Curator note: ', notaPer: 'Curator note for {titol}',
    accions: { aprovat: 'Approve', correccio: 'Request a correction', descartat: 'Discard' },
    estats: { pendent_revisio: 'Awaiting review', aprovat: 'Approved by the curators', correccio: 'Needs a correction', descartat: 'Discarded' },
    desat: 'Contribution saved on the server and awaiting review. It has not been published and is not part of IAIA’s knowledge.',
    revisat: 'Review saved on the server. Approving a contribution does not publish it or add it to IAIA’s knowledge.',
    errors: {
      'sense-servidor': 'This node does not have the curation server configured yet. No contribution has been sent.',
      'sense-migracio': 'The server does not have curation migration 2611091500 applied yet. No contribution has been sent or reviewed.',
      'sense-permis': 'The server refused the operation. You need to be signed in to contribute, and a curator role with a second factor to review.',
      normes: 'You need to accept the community rules before sending a contribution.',
      propia: 'Your own contribution must be reviewed by another person with a curator role.',
      error: 'The operation could not be completed. The server has not confirmed any change.'
    }
  },
  eu: {
    seccio: 'IAIA elikatu: ekarpenak eta berrikuspena',
    avisEstat: 'Berrikuspena zerbitzarian egiaztatutako kultura-arduradun rola duen pertsona batek egiten du. Ekarpen bat onartzeak ez du argitaratzen, ezta IAIAren jakintzara gehitzen ere.',
    senseCapacitat: 'Zerbitzari honek ez du oraindik kultura-berrikuspena aktibatuta. Orri honek ez du ekarpenik jasotzen aktibatu arte.',
    titol: 'Partekatu herriko kultura',
    intro: 'Errezetak, ahozko memoria edo hiztegia ekar ditzakezu, egiletza eta herria adierazita. Testua pribatua da: bidali duenak eta baimendutako arduradunek bakarrik ikusten dute. Inprimaki honek testua bakarrik onartzen du; fitxategi edo audioetarako, gehitu esteka bat.',
    rol: 'Berrikusteko, egiaztatutako kultura-arduradun rola duen kontu bat behar da. Izenak edo helbide elektronikoak ez dute baimenik ematen.',
    iniciaSessio: 'Hasi saioa ekarpen bat bidaltzeko eta zure ekarpenak kontsultatzeko.',
    comprovant: 'Zerbitzaria eta baimenak egiaztatzen…',
    camps: { titol: 'Ekarpenaren izenburua', autoria: 'Egilea edo berri-emailea', poble: 'Herria edo eskualdea', contingut: 'Kultura-testua edo esteka dokumentatua', permisos: 'Adierazten dut eduki hau ekartzeko behar diren baimenak ditudala' },
    envia: 'Bidali berrikustera',
    safataCuradoria: 'Baimendutako berrikuspen-ilara', propies: 'Zure ekarpenak', safata: 'Kultura-ilara pribatua',
    info: 'Zure kontuak eskura dituen azken ekarpenak, gehienez 200 kontsulta honetan.',
    rolConfirmat: 'Zerbitzariak kultura-arduradun rola baieztatu du.', rolReservat: 'Berrikuspena kultura-arduradun rola eta bigarren faktorea dituzten kontuentzat dago gordeta.',
    buida: 'Oraindik ez dago ekarpen ikusgairik.', nota: 'Arduradunaren oharra: ', notaPer: 'Arduradunaren oharra: {titol}',
    accions: { aprovat: 'Onartu', correccio: 'Eskatu zuzenketa', descartat: 'Baztertu' },
    estats: { pendent_revisio: 'Berrikusteko zain', aprovat: 'Arduradunek onartua', correccio: 'Zuzenketa behar du', descartat: 'Baztertua' },
    desat: 'Ekarpena zerbitzarian gorde da, berrikusteko zain. Ez da argitaratu, eta ez dago IAIAren jakintzan.',
    revisat: 'Berrikuspena zerbitzarian gorde da. Ekarpen bat onartzeak ez du argitaratzen, ezta IAIAren jakintzara gehitzen ere.',
    errors: {
      'sense-servidor': 'Nodo honek ez du oraindik berrikuspen-zerbitzaria konfiguratuta. Ez da ekarpenik bidali.',
      'sense-migracio': 'Zerbitzariak ez du oraindik 2611091500 berrikuspen-migrazioa aplikatuta. Ez da ekarpenik bidali ez berrikusi.',
      'sense-permis': 'Zerbitzariak eragiketa ukatu du. Saioa behar da ekarpenak egiteko, eta kultura-arduradun rola bigarren faktorearekin berrikusteko.',
      normes: 'Bizikidetza-arauak onartu behar dituzu ekarpen bat bidali aurretik.',
      propia: 'Zure ekarpen bat kultura-arduradun rola duen beste pertsona batek berrikusi behar du.',
      error: 'Ezin izan da eragiketa osatu. Zerbitzariak ez du aldaketarik baieztatu.'
    }
  },
  gl: {
    seccio: 'Achegas e curadoría de Nutrir a IAIA',
    avisEstat: 'A revisión faina unha persoa con rol de curadoría verificado no servidor. Aprobar unha achega non a publica nin a incorpora ao coñecemento da IAIA.',
    senseCapacitat: 'Este servidor aínda non ten activa a curadoría cultural. Esta páxina non recolle ningunha achega ata que se active.',
    titol: 'Comparte cultura de aldea',
    intro: 'Podes achegar receitas, memoria oral ou léxico con autoría e lugar. O texto queda privado: só o ven quen o enviou e a curadoría autorizada. Este formulario só admite texto; para arquivos ou audio, indica unha ligazón.',
    rol: 'A revisión require unha conta con rol de curadoría verificado. O nome ou o correo non conceden permisos.',
    iniciaSessio: 'Inicia sesión para enviar unha achega e consultar as túas achegas.',
    comprovant: 'Comprobando o servidor e os permisos…',
    camps: { titol: 'Título da achega', autoria: 'Autoría ou informante', poble: 'Aldea ou comarca', contingut: 'Texto cultural ou ligazón documentada', permisos: 'Declaro que teño os permisos necesarios para achegar este contido' },
    envia: 'Enviar a revisión',
    safataCuradoria: 'Bandexa de curadoría autorizada', propies: 'As túas achegas', safata: 'Bandexa cultural privada',
    info: 'Últimas achegas accesibles para a túa conta, cun máximo de 200 nesta consulta.',
    rolConfirmat: 'O servidor confirmou o rol de curadoría.', rolReservat: 'A revisión está reservada a contas con rol de curadoría e segundo factor.',
    buida: 'Aínda non hai achegas visibles.', nota: 'Nota de curadoría: ', notaPer: 'Nota de curadoría para {titol}',
    accions: { aprovat: 'Aprobar', correccio: 'Pedir corrección', descartat: 'Descartar' },
    estats: { pendent_revisio: 'Pendente de revisión', aprovat: 'Aprobada pola curadoría', correccio: 'Precisa unha corrección', descartat: 'Descartada' },
    desat: 'Achega gardada no servidor, pendente de revisión. Non se publicou nin forma parte do coñecemento da IAIA.',
    revisat: 'Revisión gardada no servidor. Aprobar unha achega non a publica nin a incorpora ao coñecemento da IAIA.',
    errors: {
      'sense-servidor': 'Este nodo aínda non ten configurado o servidor de curadoría. Non se enviou ningunha achega.',
      'sense-migracio': 'O servidor aínda non ten aplicada a migración de curadoría 2611091500. Non se enviou nin revisou ningunha achega.',
      'sense-permis': 'O servidor rexeitou a operación. Cómpre ter sesión para achegar e rol de curadoría con segundo factor para revisar.',
      normes: 'Tes que aceptar as normas de convivencia antes de enviar unha achega.',
      propia: 'Unha achega túa debe revisala outra persoa con rol de curadoría.',
      error: 'Non se puido completar a operación. O servidor non confirmou ningún cambio.'
    }
  }
};
const CAPACITAT = 'curadoriaCultural';
const ACCIONS = ['aprovat', 'correccio', 'descartat'];
const FORM_BUIT = { titol: '', autoria: '', poble: '', contingut: '', permisos: false };
/** Codi estable de l'error: el text es tria en pintar, en la llengua del moment. */
function codiError(e) {
  if (esRebuigDeNormes(e)) return 'normes';
  if (/SDP-CULTURA-PROPIA/.test(`${e?.message ?? ''} ${e?.cause?.message ?? ''}`)) return 'propia';
  return codiDErrorResumSessions(e);
}
/** Contingut de TextSection: el rol no es pot injectar amb props ni amb l'emmagatzematge del navegador. */
export default function NodrirLaIaiaSection() {
  const sessio = useSessioOpcional();
  const ui = useUIActionsOpcional();
  const t = TEXTOS[ui?.language] ?? TEXTOS.ca;
  const textError = codi => t.errors[codi] ?? t.errors.error;
  const actor = sessio?.currentUser?.id ?? null;
  const ambCapacitat = port.teCapacitat(CAPACITAT);
  const [estat, setEstat] = useState({ actor: null, fase: 'inicial' });
  const [form, setForm] = useState(FORM_BUIT);
  const [notes, setNotes] = useState({});
  const [avis, setAvis] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const generacio = useRef(0);
  const control = useRef(null);
  const disponible = ambCapacitat && estat.actor === actor && estat.fase === 'dades' && estat.rol?.autenticat === true;
  const potCurar = disponible && estat.rol?.potCurar === true;
  const canvia = k => e => setForm(f => ({ ...f, [k]: k === 'permisos' ? e.target.checked : e.target.value }));
  useEffect(() => {
    const numero = ++generacio.current;
    control.current?.abort(); const avorta = new AbortController(); control.current = avorta;
    setAvis(null); setNotes({}); setForm(FORM_BUIT); setOcupat(false);
    if (!ambCapacitat || !actor) { setEstat({ actor, fase: ambCapacitat ? 'fora' : 'sense-capacitat' }); return () => { generacio.current += 1; avorta.abort(); }; }
    setEstat({ actor, fase: 'carregant' });
    Promise.resolve().then(async () => {
      const rol = await port.estatCuradoriaCultural({ signal: avorta.signal });
      const files = await port.llistaAportacionsCulturals({ signal: avorta.signal });
      if (numero === generacio.current) setEstat({ actor, fase: 'dades', rol, files });
    }).catch(e => { if (numero === generacio.current && e.name !== 'AbortError') setEstat({ actor, fase: 'error', codi: codiError(e) }); });
    return () => { generacio.current += 1; avorta.abort(); };
  }, [actor, ambCapacitat]);
  const desa = async (e) => {
    e.preventDefault(); if (!disponible || ocupat) return;
    const numero = generacio.current; setOcupat(true); setAvis(null);
    try {
      const fila = await port.enviaAportacioCultural(form, { signal: control.current.signal });
      if (numero === generacio.current) {
        setEstat(s => ({ ...s, files: [fila, ...s.files].slice(0,200) }));
        setForm(FORM_BUIT);
        setAvis({ clau: 'desat' });
      }
    } catch (error) { if (numero === generacio.current && error.name !== 'AbortError') setAvis({ clau: 'error', codi: codiError(error) }); }
    finally { if (numero === generacio.current) setOcupat(false); }
  };
  const revisa = async (fila, nouEstat) => {
    if (!potCurar || ocupat) return;
    const numero = generacio.current; setOcupat(true); setAvis(null);
    try {
      const actual = await port.revisaAportacioCultural({ id: fila.id, estat: nouEstat, nota: notes[fila.id] ?? fila.nota }, { signal: control.current.signal });
      if (numero === generacio.current) {
        setEstat(s => ({ ...s, files: s.files.map(f => f.id === actual.id ? actual : f) }));
        setAvis({ clau: 'revisat' });
      }
    } catch (error) { if (numero === generacio.current && error.name !== 'AbortError') setAvis({ clau: 'error', codi: codiError(error) }); }
    finally { if (numero === generacio.current) setOcupat(false); }
  };
  /* PRODUCCIO-02 (revisió R15b) · Sense la capacitat no es pinta cap formulari: tampoc la invitació a aportar
     (titol, intro, rol) ni la revisió en present (avisEstat). Només l'estat honest; el cos de la pàgina
     (PAGE_COPY) ja diu què serà. Amb la capacitat, tot com abans. */
  if (!ambCapacitat) return <section aria-label={t.seccio}>
    <Alerta to="avis" viva={false}><p>{t.senseCapacitat}</p></Alerta>
  </section>;
  return <section aria-label={t.seccio}>
    <Alerta to="avis" viva={false}><p>{t.avisEstat}</p></Alerta>
    <h3>{t.titol}</h3>
    <p>{t.intro}</p>
    <p>{t.rol}</p>
    {!actor ? <p>{t.iniciaSessio}</p> : null}
    {estat.actor === actor && estat.fase === 'carregant' ? <p role="status">{t.comprovant}</p> : null}
    {estat.actor === actor && estat.fase === 'error' ? <Alerta to="avis">{textError(estat.codi)}</Alerta> : null}
    {avis ? <p role="status">{avis.clau === 'error' ? textError(avis.codi) : t[avis.clau]}</p> : null}
    <form onSubmit={desa}>
      <Camp etiqueta={t.camps.titol}><CampText required maxLength={200} value={form.titol} onChange={canvia('titol')} disabled={!disponible || ocupat} /></Camp>
      <Camp etiqueta={t.camps.autoria}><CampText required maxLength={200} value={form.autoria} onChange={canvia('autoria')} disabled={!disponible || ocupat} /></Camp>
      <Camp etiqueta={t.camps.poble}><CampText required maxLength={200} value={form.poble} onChange={canvia('poble')} disabled={!disponible || ocupat} /></Camp>
      <Camp etiqueta={t.camps.contingut}><AreaText required maxLength={20000} value={form.contingut} onChange={canvia('contingut')} disabled={!disponible || ocupat} /></Camp>
      <Casella etiqueta={t.camps.permisos} checked={form.permisos} onChange={canvia('permisos')} disabled={!disponible || ocupat} />
      <div className="sdp-admin-actions-inline"><Boto type="submit" disabled={!disponible || !form.permisos || ocupat}>{t.envia}</Boto></div>
    </form>
    {disponible ? <section aria-label={t.safata}><h3>{potCurar ? t.safataCuradoria : t.propies}</h3>
      <p>{t.info} {potCurar ? t.rolConfirmat : t.rolReservat}</p>
      {!estat.files.length ? <p>{t.buida}</p> : null}
      {estat.files.map(f => <article key={f.id}><h4>{f.titol}</h4><p><strong>{t.estats[f.estat]}</strong></p><p>{f.autoria} · {f.poble}</p><p>{f.contingut}</p>{f.nota ? <p>{t.nota}{f.nota}</p> : null}
        {potCurar ? <><Camp etiqueta={t.notaPer.replace('{titol}', () => f.titol)}><AreaText maxLength={4000} value={notes[f.id] ?? f.nota} onChange={e => setNotes(n => ({ ...n, [f.id]: e.target.value }))} disabled={ocupat} /></Camp>
          <div className="sdp-admin-actions-inline">{ACCIONS.map(id => <Boto key={id} disabled={ocupat} onClick={() => revisa(f,id)}>{t.accions[id]}</Boto>)}</div></> : null}
      </article>)}
    </section> : null}
  </section>;
}
