import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Especimen } from './Especimen.jsx';
import { Camp, CampText, AreaText, Selector, Casella, GrupOpcions, GrupCamps, Interruptor, Boto, Alerta, PillToggle, UniversalSearch } from '../../../components/PedraSeca/index.js';

const COMARQUES = [
  { valor: '', etiqueta: 'Tria una comarca…' },
  { valor: 'alcoia', etiqueta: "L'Alcoià" },
  { valor: 'comtat', etiqueta: 'El Comtat' },
  { valor: 'marina', etiqueta: 'La Marina Alta' },
];

/** Formulari complex de referència: validació en enviar, resum d'errors amb focus. */
function FormulariAlta() {
  const [dades, setDades] = useState({ nom: '', correu: '', comarca: '', contacte: 'correu', missatge: '', accepta: false });
  const [errors, setErrors] = useState({});
  const [enviat, setEnviat] = useState(false);
  const posa = (k) => (e) => setDades((d) => ({ ...d, [k]: e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e }));

  const valida = () => {
    const e = {};
    if (!dades.nom.trim()) e.nom = 'Escriu el teu nom. El farem servir per a saludar-te.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(dades.correu)) e.correu = 'El correu ha de tindre la forma nom@domini.cat.';
    if (!dades.comarca) e.comarca = 'Tria la comarca on vius.';
    if (!dades.accepta) e.accepta = 'Cal acceptar la política de privacitat per a continuar.';
    return e;
  };

  const envia = (ev) => {
    ev.preventDefault();
    const e = valida();
    setErrors(e);
    setEnviat(Object.keys(e).length === 0);
  };

  const nErrors = Object.keys(errors).length;
  return (
    <form noValidate onSubmit={envia} aria-label="Alta de veí o veïna (exemple)">
      {nErrors ? (
        <Alerta to="error" titol={`Hi ha ${nErrors} ${nErrors === 1 ? 'camp' : 'camps'} per revisar`}>
          <ul>{Object.values(errors).map((m) => <li key={m}>{m}</li>)}</ul>
        </Alerta>
      ) : null}
      {enviat ? <Alerta to="exit" titol="Alta rebuda">Gràcies. T'escriurem prompte.</Alerta> : null}
      <GrupCamps llegenda="Qui eres">
        <Camp etiqueta="Nom i cognoms" obligatori error={errors.nom}>
          <CampText value={dades.nom} onChange={posa('nom')} autoComplete="name" />
        </Camp>
        <Camp etiqueta="Correu electrònic" obligatori ajuda="No el publicarem mai." error={errors.correu}>
          <CampText tipus="email" value={dades.correu} onChange={posa('correu')} autoComplete="email" inputMode="email" />
        </Camp>
        <Camp etiqueta="Comarca" obligatori error={errors.comarca}>
          <Selector opcions={COMARQUES} value={dades.comarca} onChange={posa('comarca')} />
        </Camp>
      </GrupCamps>
      <GrupOpcions llegenda="Com vols que et contactem?" valor={dades.contacte} onCanvi={posa('contacte')}
        opcions={[{ valor: 'correu', etiqueta: 'Per correu' }, { valor: 'telefon', etiqueta: 'Per telèfon', ajuda: 'Et cridarem en horari de matí.' }]} />
      <Camp etiqueta="Vols dir-nos alguna cosa?" ajuda="Opcional.">
        <AreaText value={dades.missatge} onChange={posa('missatge')} />
      </Camp>
      <Casella etiqueta="He llegit i accepte la política de privacitat" checked={dades.accepta} onChange={posa('accepta')} />
      {errors.accepta ? <p className="sdp-camp__error">{errors.accepta}</p> : null}
      <div className="sdp-especimen__fila">
        <Boto tipus="submit" varietat="primari" icona={Send}>Enviar l'alta</Boto>
        <Boto tipus="reset" varietat="fantasma" onClick={() => { setErrors({}); setEnviat(false); }}>Esborrar</Boto>
      </div>
    </form>
  );
}

export default function PaginaFormularis() {
  const [avisos, setAvisos] = useState(true);
  const [vista, setVista] = useState('cards');
  const [cerca, setCerca] = useState('');
  return (
    <>
      <h2>Formularis i botons</h2>
      <p>Tot control viu dins d'un <code>&lt;Camp&gt;</code>: etiqueta visible, ajuda i error connectats per id. Els controls són natius; no reinventem el que el navegador ja fa accessible.</p>

      <Especimen id="boto" nom="Boto" fitxer="src/components/PedraSeca/Boto.jsx"
        descripcio="L'única manera de fer un botó. Canonitza sdp-boto, que la Gestoria ja usava sense cap estil."
        contracte={[
          ['varietat', "'primari'|'secundari'|'accent'|'perill'|'fantasma'", "'secundari'", 'Pes visual. Un sol primari per vista.'],
          ['mida', "'normal'|'gran'", "'normal'", '44px o 56px (accions de bancal).'],
          ['icona', 'Component lucide', 'null', 'Icona decorativa a l’esquerra.'],
          ['carregant', 'boolean', 'false', 'Desactiva i escriu «Treballant…».'],
          ['ple', 'boolean', 'false', 'Ocupa tota l’amplada.'],
          ['tipus', "'button'|'submit'|'reset'", "'button'", 'Mai submit per accident dins d’un form.'],
        ]}
        a11y={['<button> natiu: Intro i Espai sense JS.', 'aria-busy mentre carrega.', 'Focus visible de 3px amb --sdp-focus.']}
        fes={['Verb + objecte: «Enviar l’alta», «Publicar la nota».', 'Accent (taronja) només per a publicar o accions d’identitat.']}
        noFacis={['Botons només amb icona sense aria-label.', 'Dos primaris l’un al costat de l’altre.', 'Usar <div onClick> o <a> sense href com a botó.']}>
        <div className="sdp-especimen__fila">
          <Boto varietat="primari">Primari</Boto>
          <Boto>Secundari</Boto>
          <Boto varietat="accent">Publicar</Boto>
          <Boto varietat="perill" icona={Trash2}>Esborrar</Boto>
          <Boto varietat="fantasma">Fantasma</Boto>
          <Boto varietat="primari" carregant>Desant</Boto>
          <Boto disabled>Desactivat</Boto>
        </div>
        <div className="sdp-especimen__fila"><Boto varietat="primari" mida="gran">Gran (56px)</Boto></div>
      </Especimen>

      <Especimen id="camp" nom="Camp · CampText · AreaText · Selector" fitxer="src/components/PedraSeca/formulari.jsx"
        descripcio="Contenidor de camp amb etiqueta, ajuda i error. El control de dins hereta id, aria-describedby, aria-invalid i required."
        contracte={[
          ['etiqueta', 'node', '—', 'Obligatòria i sempre visible.'],
          ['ajuda', 'node', 'null', 'Instrucció curta abans del control.'],
          ['error', 'string', 'null', 'Què passa i com arreglar-ho. Activa aria-invalid.'],
          ['obligatori', 'boolean', 'false', 'Escriu «(obligatori)» en text, no només un asterisc.'],
          ['CampText.tipus', "'text'|'email'|'tel'|'number'|'search'|'password'|'date'", "'text'", 'Tipus natiu: el mòbil mostra el teclat bo.'],
          ['Selector.opcions', '{ valor, etiqueta, desactivat? }[]', '[]', 'Opcions del <select> natiu.'],
        ]}
        a11y={['label[for] ↔ input[id] garantit per construcció.', 'L’error s’anuncia per aria-describedby; porta icona i text, no només roig.', 'Un control fora de <Camp> llança un error en desenvolupament.']}
        fes={['Validar en enviar, no a cada tecla.', 'Usar autoComplete i inputMode.']}
        noFacis={['Placeholder com a etiqueta.', 'Errors genèrics («Camp invàlid»).']}>
        <Camp etiqueta="Nom del poble" ajuda="Tal com l’escriu l’Ajuntament."><CampText placeholder="La Torre de les Maçanes" /></Camp>
        <Camp etiqueta="Telèfon" error="Falta un dígit: han de ser 9."><CampText tipus="tel" defaultValue="96 555 12" /></Camp>
        <Camp etiqueta="Província" obligatori><Selector opcions={[{ valor: 'a', etiqueta: 'Alacant' }, { valor: 'v', etiqueta: 'València' }, { valor: 'c', etiqueta: 'Castelló' }]} /></Camp>
        <Camp etiqueta="Descripció"><AreaText placeholder="Una breu descripció…" /></Camp>
        <Camp etiqueta="Camp desactivat"><CampText defaultValue="No editable" disabled /></Camp>
      </Especimen>

      <Especimen id="opcions" nom="Casella · GrupOpcions · Interruptor · GrupCamps" fitxer="src/components/PedraSeca/formulari.jsx"
        descripcio="Casella: decisió que es confirma després. Interruptor: efecte immediat. Ràdios sempre dins d’un fieldset amb llegenda."
        contracte={[
          ['Casella.etiqueta / ajuda', 'node', '—', 'Tota la fila és clicable.'],
          ['GrupOpcions.opcions', '{ valor, etiqueta, ajuda? }[]', '[]', 'Ràdios natius; fletxes per teclat.'],
          ['GrupOpcions.valor / onCanvi', 'string / (valor) => void', '—', 'Controlat.'],
          ['Interruptor.actiu / onCanvi', 'boolean / (bool) => void', 'false', 'role="switch", estat en text Sí/No.'],
        ]}
        a11y={['fieldset + legend: el lector llig la pregunta abans de cada opció.', 'Zona tàctil de 44px per fila.', 'L’interruptor diu «Sí/No» en text.']}
        fes={['Interruptor per a ajustos que s’apliquen al moment.']}
        noFacis={['Un interruptor dins d’un formulari amb botó «Desar».', 'Ràdios solts sense fieldset.']}>
        <Casella etiqueta="Vull rebre el butlletí del poble" ajuda="Un correu al mes, com a molt." />
        <GrupOpcions llegenda="Mida de la lletra" valor="gran" onCanvi={() => {}} opcions={[{ valor: 'normal', etiqueta: 'Normal' }, { valor: 'gran', etiqueta: 'Gran' }, { valor: 'molt', etiqueta: 'Molt gran' }]} />
        <Interruptor etiqueta="Avisos del mercat" actiu={avisos} onCanvi={setAvisos} />
      </Especimen>

      <Especimen id="pindola" nom="PillToggle" fitxer="src/components/PedraSeca/PillToggle.jsx"
        descripcio="Selector de píndola: N opcions, una activa. Per a canviar la VISTA d’un contingut, no per a filtrar dades."
        contracte={[['opcions', '{ valor, etiqueta }[]', '[]', 'Opcions.'], ['valor / onCanvi', 'string / fn', '—', 'Controlat; onCanvi també sobre l’opció activa.'], ['etiqueta', 'string', '—', 'Nom del grup.']]}
        a11y={['role="group" + aria-pressed; l’estat actiu es pinta des de l’ARIA.']}
        fes={['2–4 opcions curtes.']} noFacis={['Usar-lo com a pestanyes (no hi ha tabpanel).']}>
        <PillToggle etiqueta="Vista" valor={vista} onCanvi={setVista} opcions={[{ valor: 'cards', etiqueta: 'Targetes' }, { valor: 'llista', etiqueta: 'Llista' }]} />
      </Especimen>

      <Especimen id="cerca" nom="UniversalSearch" fitxer="src/components/PedraSeca/organismes/UniversalSearch.jsx"
        descripcio="Cercador de llista. DEUTE: no admet etiqueta visible ni Camp; es manté per compatibilitat."
        a11y={['aria-label per defecte «Cercador universal». Cal passar ariaLabel concret.']}
        fes={['En formularis, usar <Camp><CampText tipus="search" /></Camp>.']} noFacis={['Crear un tercer cercador.']}>
        <UniversalSearch value={cerca} onChange={(e) => setCerca(e.target.value)} ariaLabel="Cerca al catàleg" />
      </Especimen>

      <Especimen id="formulari-complex" nom="Composició: formulari complex"
        descripcio="Referència de validació: en enviar, resum d’errors a dalt (role=alert) i error al costat de cada camp.">
        <FormulariAlta />
      </Especimen>
    </>
  );
}
