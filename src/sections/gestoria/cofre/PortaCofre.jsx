/**
 * PortaCofre.jsx — la porta del cofre xifrat de la Gestoria: crear, obrir,
 * recuperar amb el codi i bloquejar; i, amb el cofre obert, la còpia
 * xifrada, el canvi de frase, un codi nou i l'exportació en clar.
 *
 * Onada 6, ordre del Mestre (261009): «la privacitat és innegociable».
 * Qui la munta hi posa el contingut com a funció, `children(cofre)`, que
 * només es pinta amb el cofre obert (i el codi ja confirmat) i desapareix en
 * bloquejar-se. Integració (261009): l'endolla l'Històric (Historic.jsx). La
 * porta torna tres blocs germans, perquè el contingut no quede dins de la
 * targeta del cofre: (1) la targeta «Cofre xifrat», amb l'estat, el
 * formulari que toque i, obert, «Bloqueja»; (2) el contingut; (3) obert, la
 * targeta «Còpies i claus del cofre» (la còpia xifrada, la frase, el codi
 * nou i l'exportació en clar), al final, fora del camí de cada dia. Els
 * textos no diuen QUÈ guarda el cofre: ho diu qui l'endolla.
 * Cap peça nova de disseny: Boto, Alerta, Insignia, Camp, CampText, Casella i
 * ControlContrasenya de Pedra Seca, amb el seu marcatge (etiqueta pròpia amb
 * htmlFor per a la contrasenya, com a l'espècimen de Camp). Les classes
 * sdp-gestoria-cofre* tenen el seu bloc a modules.css.
 * El codi de recuperació es mostra una sola vegada, sense botó de copiar: el
 * porta-retalls el veuen altres programes i, de vegades, altres dispositius.
 * Les frases viuen només en l'estat de cada formulari, que es buida en enviar
 * bé i desapareix quan el cofre canvia d'estat.
 */
import { useEffect, useId, useState } from 'react';
import { KeyRound, Lock, LockOpen } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { ControlContrasenya } from '../../../components/PedraSeca/atoms/ControlContrasenya.jsx';
import { Carregant } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { Camp, CampText, Casella } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { CONFIRMACIO_EN_CLAR } from './cofre.js';
import { avaluaFrase } from './nucli/cripto.js';
import { useCofre } from './useCofre.js';

const INSIGNIES = Object.freeze({
  carregant: { to: 'neutre', text: 'Comprovant' },
  insegur: { to: 'error', text: 'No disponible' },
  'sense-magatzem': { to: 'error', text: 'No disponible' },
  absent: { to: 'neutre', text: 'Sense crear' },
  bloquejat: { to: 'info', text: 'Bloquejat' },
  obert: { to: 'exit', text: 'Obert' }
});

const ROBUSTESA = Object.freeze({
  buida: { to: 'neutre', text: 'Sense frase' },
  curta: { to: 'error', text: 'Massa curta' },
  repetida: { to: 'error', text: 'Massa repetida' },
  previsible: { to: 'error', text: 'Massa previsible' },
  llarga: { to: 'error', text: 'Massa llarga' },
  justa: { to: 'avis', text: 'Justa' },
  bona: { to: 'info', text: 'Bona' },
  'molt-bona': { to: 'exit', text: 'Molt bona' }
});

const AJUDA_FRASE = 'Almenys 12 caràcters o 4 paraules. Quatre o cinc paraules sense relació entre elles són més fàcils de recordar i més fortes que una contrasenya curta i rara.';

/** Un camp de frase de pas: etiqueta pròpia, ull, ajuda i error lligats per id. */
function CampFrase({ etiqueta, valor, onCanvi, autoComplete, ajuda = null, error = null, etiquetaUll = 'Mostra la frase de pas', desactivat = false }) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const idError = `${id}-error`;
  const descrit = [ajuda ? idAjuda : null, error ? idError : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="sdp-camp">
      <label className="sdp-camp__etiqueta" htmlFor={id}>{etiqueta}</label>
      {ajuda ? <p id={idAjuda} className="sdp-camp__ajuda">{ajuda}</p> : null}
      <ControlContrasenya id={id} value={valor} onChange={(event) => onCanvi(event.target.value)} autoComplete={autoComplete}
        etiquetaUll={etiquetaUll} aria-describedby={descrit} aria-invalid={error ? 'true' : undefined} disabled={desactivat} />
      {error ? <p id={idError} className="sdp-camp__error">{error}</p> : null}
    </div>
  );
}

/** L'indicador senzill de robustesa d'una frase nova. */
function Robustesa({ frase }) {
  const avaluacio = avaluaFrase(frase);
  const marca = ROBUSTESA[avaluacio.nivell];
  return (
    <p className="sdp-gestoria-cofre__robustesa" aria-live="polite">
      <span>Robustesa:</span>
      <Insignia to={marca.to}>{marca.text}</Insignia>
      {avaluacio.valida ? <span>{avaluacio.motiu}</span> : null}
    </p>
  );
}

/** L'avís de l'última acció, només a la seua zona. */
function AvisCofre({ avis, zona, onTanca }) {
  if (!avis || avis.zona !== zona) return null;
  return (
    <Alerta to={avis.to} onTanca={onTanca}>
      <p>{avis.text}</p>
    </Alerta>
  );
}

/** Una subsecció del cofre obert, amb el seu títol. */
function Seccio({ titol, children }) {
  const id = useId();
  return (
    <section className="sdp-gestoria-cofre__seccio" aria-labelledby={id}>
      <h3 id={id} className="sdp-gestoria-cofre__subtitol">{titol}</h3>
      {children}
    </section>
  );
}

/* Valida una frase nova i la seua repetició: { camp, text } de l'error, o null. */
function errorDeFraseNova(frase, repeticio) {
  const avaluacio = avaluaFrase(frase);
  if (!avaluacio.valida) return { camp: 'frase', text: avaluacio.motiu };
  if (frase !== repeticio) return { camp: 'repeticio', text: 'Les dues frases no coincidixen.' };
  return null;
}

/** Les frases nova i repetida, amb l'indicador; l'error va al camp que el té. */
function FrasesNoves({ frase, setFrase, repeticio, setRepeticio, error, desactivat }) {
  return (
    <>
      <CampFrase etiqueta="Frase de pas nova" valor={frase} onCanvi={setFrase} autoComplete="new-password" ajuda={AJUDA_FRASE}
        error={error?.camp === 'frase' ? error.text : null} desactivat={desactivat} />
      <Robustesa frase={frase} />
      <CampFrase etiqueta="Repetix la frase de pas" valor={repeticio} onCanvi={setRepeticio} autoComplete="new-password"
        etiquetaUll="Mostra la repetició de la frase" error={error?.camp === 'repeticio' ? error.text : null} desactivat={desactivat} />
    </>
  );
}

function FormulariCrea({ c }) {
  const [frase, setFrase] = useState('');
  const [repeticio, setRepeticio] = useState('');
  const [error, setError] = useState(null);
  async function envia(event) {
    event.preventDefault();
    const problema = errorDeFraseNova(frase, repeticio);
    setError(problema);
    if (problema) return;
    if (await c.crea(frase)) {
      setFrase('');
      setRepeticio('');
    }
  }
  return (
    <form className="sdp-gestoria-cofre__formulari" onSubmit={envia} noValidate>
      <p>
        El que guardes en este cofre es desa xifrat en este navegador. Només la teua frase de pas o el codi de recuperació
        l’obrin: ningú més, tampoc Sóc de Poble, ho pot recuperar si perds totes dues coses.
      </p>
      <FrasesNoves frase={frase} setFrase={setFrase} repeticio={repeticio} setRepeticio={setRepeticio} error={error} desactivat={Boolean(c.ocupat)} />
      <div className="sdp-gestoria-cofre__accions">
        <Boto tipus="submit" varietat="primari" icona={Lock} carregant={c.ocupat === 'creant'} disabled={Boolean(c.ocupat)}>Crea el cofre</Boto>
      </div>
    </form>
  );
}

function FormulariObre({ c, onOblidada }) {
  const [frase, setFrase] = useState('');
  async function envia(event) {
    event.preventDefault();
    if (await c.obre(frase)) setFrase('');
  }
  return (
    <form className="sdp-gestoria-cofre__formulari" onSubmit={envia} noValidate>
      <CampFrase etiqueta="Frase de pas" valor={frase} onCanvi={setFrase} autoComplete="current-password" desactivat={Boolean(c.ocupat)} />
      <div className="sdp-gestoria-cofre__accions">
        <Boto tipus="submit" varietat="primari" icona={LockOpen} carregant={c.ocupat === 'obrint'} disabled={Boolean(c.ocupat) || !frase}>Obri el cofre</Boto>
        <Boto varietat="fantasma" disabled={Boolean(c.ocupat)} onClick={onOblidada}>He oblidat la frase de pas</Boto>
      </div>
    </form>
  );
}

function FormulariRecupera({ c, onTorna }) {
  const [codi, setCodi] = useState('');
  const [frase, setFrase] = useState('');
  const [repeticio, setRepeticio] = useState('');
  const [error, setError] = useState(null);
  async function envia(event) {
    event.preventDefault();
    const problema = errorDeFraseNova(frase, repeticio);
    setError(problema);
    if (problema) return;
    if (await c.recupera(codi, frase)) {
      setCodi('');
      setFrase('');
      setRepeticio('');
    }
  }
  return (
    <form className="sdp-gestoria-cofre__formulari" onSubmit={envia} noValidate>
      <p>
        Amb el codi de recuperació obris el cofre i hi poses una frase de pas nova. Es renova la clau de les dades i se’n crea
        un codi nou: el codi usat i la frase d’abans ja no obrin res del que hi ha ara. Les còpies xifrades fetes abans
        continuen obrint-se amb els secrets d’aleshores.
      </p>
      <Camp etiqueta="Codi de recuperació" ajuda="Les 26 lletres i xifres que vas apuntar en crear el cofre (ABCD-EFGH-…).">
        <CampText value={codi} onChange={(event) => setCodi(event.target.value)} autoComplete="off" autoCapitalize="characters"
          spellCheck={false} disabled={Boolean(c.ocupat)} />
      </Camp>
      <FrasesNoves frase={frase} setFrase={setFrase} repeticio={repeticio} setRepeticio={setRepeticio} error={error} desactivat={Boolean(c.ocupat)} />
      <div className="sdp-gestoria-cofre__accions">
        <Boto tipus="submit" varietat="primari" icona={KeyRound} carregant={c.ocupat === 'recuperant'} disabled={Boolean(c.ocupat) || !codi}>
          Recupera el cofre
        </Boto>
        <Boto varietat="fantasma" disabled={Boolean(c.ocupat)} onClick={onTorna}>Torna a la frase de pas</Boto>
      </div>
    </form>
  );
}

function PanellCodi({ codi, onApuntat }) {
  const [apuntat, setApuntat] = useState(false);
  return (
    <div className="sdp-gestoria-cofre__formulari">
      <Alerta to="avis" viva={false} titol="Apunta ara el codi de recuperació">
        <p>
          Només es mostra esta vegada. Escriu-lo en paper i guarda’l lluny de l’ordinador. No el copies, no li faces
          fotos i no el deixes en cap altre programa. Sense la frase i sense este codi, el cofre no es pot obrir.
        </p>
        <p>
          Si el cofre es bloqueja abans que el confirmes (10 minuts sense activitat, 5 amb la pestanya amagada o en eixir
          de la pàgina), este codi es perd i n’hauràs de fer un altre.
        </p>
      </Alerta>
      <p className="sdp-gestoria-cofre__codi">
        <code translate="no">{codi}</code>
      </p>
      <Casella etiqueta="L’he apuntat en paper i el guarde en un lloc segur" checked={apuntat} onChange={(event) => setApuntat(event.target.checked)} />
      <div className="sdp-gestoria-cofre__accions">
        <Boto varietat="primari" disabled={!apuntat} onClick={onApuntat}>Continua</Boto>
      </div>
    </div>
  );
}

function ImportaCopia({ c, zona }) {
  const [copia, setCopia] = useState(null);
  const [frase, setFrase] = useState('');
  const [errorFitxer, setErrorFitxer] = useState(null);
  async function tria(event) {
    const fitxer = event.target.files?.[0];
    setCopia(null);
    setErrorFitxer(null);
    if (!fitxer) return;
    try {
      setCopia(await fitxer.text());
    } catch {
      setErrorFitxer('No s’ha pogut llegir el fitxer.');
    }
  }
  async function envia(event) {
    event.preventDefault();
    if (await c.importa(copia, frase, zona)) {
      setFrase('');
      setCopia(null);
    }
  }
  return (
    <form className="sdp-gestoria-cofre__formulari" onSubmit={envia} noValidate>
      <Camp etiqueta={zona === 'porta' ? 'Restaura una còpia xifrada' : 'Importa una còpia xifrada'} error={errorFitxer}
        ajuda="Un fitxer .json fet amb «Descarrega la còpia xifrada». Abans de tocar res es comprova sencer; en un cofre obert només s’hi afig el que falta.">
        <CampText tipus="file" accept=".json,application/json" textBoto="Tria la còpia" disabled={Boolean(c.ocupat)} onChange={tria} />
      </Camp>
      <CampFrase etiqueta="Frase de pas de la còpia" valor={frase} onCanvi={setFrase} autoComplete="off"
        etiquetaUll="Mostra la frase de la còpia" desactivat={Boolean(c.ocupat)} />
      <div className="sdp-gestoria-cofre__accions">
        <Boto tipus="submit" varietat="secundari" carregant={c.ocupat === 'important'} disabled={Boolean(c.ocupat) || !copia || !frase}>
          {zona === 'porta' ? 'Restaura la còpia' : 'Importa la còpia'}
        </Boto>
      </div>
    </form>
  );
}

function FormulariCanvia({ c }) {
  const [actual, setActual] = useState('');
  const [frase, setFrase] = useState('');
  const [repeticio, setRepeticio] = useState('');
  const [rota, setRota] = useState(false);
  const [error, setError] = useState(null);
  async function envia(event) {
    event.preventDefault();
    const problema = errorDeFraseNova(frase, repeticio);
    setError(problema);
    if (problema) return;
    if (await c.canvia(actual, frase, rota)) {
      setActual('');
      setFrase('');
      setRepeticio('');
      setRota(false);
    }
  }
  return (
    <form className="sdp-gestoria-cofre__formulari" onSubmit={envia} noValidate>
      <p className="sdp-gestoria-cofre__nota">
        Canviar la frase no toca les dades: el codi de recuperació continua valent i les còpies xifrades fetes abans
        s’obrin amb la frase vella. Si creus que algú coneix la frase o el codi, marca la casella.
      </p>
      <CampFrase etiqueta="Frase de pas actual" valor={actual} onCanvi={setActual} autoComplete="current-password"
        etiquetaUll="Mostra la frase actual" desactivat={Boolean(c.ocupat)} />
      <FrasesNoves frase={frase} setFrase={setFrase} repeticio={repeticio} setRepeticio={setRepeticio} error={error} desactivat={Boolean(c.ocupat)} />
      <Casella etiqueta="Algú pot conéixer la frase o el codi: renova també la clau de les dades i el codi de recuperació"
        checked={rota} onChange={(event) => setRota(event.target.checked)} disabled={Boolean(c.ocupat)} />
      <div className="sdp-gestoria-cofre__accions">
        <Boto tipus="submit" varietat="secundari" carregant={c.ocupat === 'canviant'} disabled={Boolean(c.ocupat) || !actual}>Canvia la frase de pas</Boto>
      </div>
    </form>
  );
}

function FormulariRenova({ c }) {
  const [frase, setFrase] = useState('');
  async function envia(event) {
    event.preventDefault();
    if (await c.renovaCodi(frase)) setFrase('');
  }
  return (
    <form className="sdp-gestoria-cofre__formulari" onSubmit={envia} noValidate>
      <p>
        Si has perdut el codi o creus que algú l’ha vist, fes-ne un de nou. També es renova la clau de les dades: el codi
        anterior ja no obri res del que hi ha ara ni del que hi guardes després, encara que algú tinga una còpia vella.
        Les còpies xifrades fetes abans continuen obrint-se amb el codi i la frase d’aleshores.
      </p>
      <CampFrase etiqueta="Frase de pas actual" valor={frase} onCanvi={setFrase} autoComplete="current-password"
        etiquetaUll="Mostra la frase per al codi nou" desactivat={Boolean(c.ocupat)} />
      <div className="sdp-gestoria-cofre__accions">
        <Boto tipus="submit" varietat="secundari" carregant={c.ocupat === 'renovant'} disabled={Boolean(c.ocupat) || !frase}>Fes un codi nou</Boto>
      </div>
    </form>
  );
}

function FormulariClar({ c }) {
  const [entes, setEntes] = useState(false);
  const [frase, setFrase] = useState('');
  async function envia(event) {
    event.preventDefault();
    if (await c.exportaEnClar(frase, entes ? CONFIRMACIO_EN_CLAR : null)) {
      setFrase('');
      setEntes(false);
    }
  }
  return (
    <form className="sdp-gestoria-cofre__formulari" onSubmit={envia} noValidate>
      <Alerta to="avis" viva={false} titol="El fitxer eixirà sense xifrar">
        <p>
          Qualsevol persona o programa que el tinga podrà llegir-ho tot. Fes-ho només per a passar les dades a un altre
          programa, i esborra el fitxer quan acabes.
        </p>
      </Alerta>
      <Casella etiqueta={CONFIRMACIO_EN_CLAR} checked={entes} onChange={(event) => setEntes(event.target.checked)} disabled={Boolean(c.ocupat)} />
      <CampFrase etiqueta="Frase de pas actual" valor={frase} onCanvi={setFrase} autoComplete="current-password"
        etiquetaUll="Mostra la frase per a exportar" desactivat={Boolean(c.ocupat)} />
      <div className="sdp-gestoria-cofre__accions">
        <Boto tipus="submit" varietat="perill" carregant={c.ocupat === 'exportant-clar'} disabled={Boolean(c.ocupat) || !entes || !frase}>
          Descarrega sense xifrar
        </Boto>
      </div>
    </form>
  );
}

/* L'estat obert, dins de la targeta «Cofre xifrat»: l'avís, el codi pendent i «Bloqueja». */
function EstatObert({ c }) {
  return (
    <>
      <Alerta to="exit" viva={false} titol="El cofre és obert">
        <p>Es bloqueja sol després de 10 minuts sense activitat, si la pestanya està amagada més de 5 minuts o si ixes de la pàgina.</p>
      </Alerta>
      {c.codiSenseConfirmar ? (
        <Alerta to="avis" viva={false} titol="Falta un codi de recuperació apuntat">
          <p>
            L’últim codi que es va mostrar no es va confirmar abans que el cofre es bloquejara. Fes-ne un de nou a «Codi de
            recuperació nou»: sense la frase i sense codi, el cofre no es pot obrir.
          </p>
        </Alerta>
      ) : null}
      <div className="sdp-gestoria-cofre__accions">
        <Boto varietat="primari" icona={Lock} onClick={c.bloqueja}>Bloqueja</Boto>
      </div>
    </>
  );
}

/* La gestió del cofre obert, en una targeta pròpia després del contingut: còpies, frase, codi i exportació en clar. */
function GestioCofre({ c }) {
  const id = useId();
  return (
    <section className="sdp-gestoria-cofre" aria-labelledby={id}>
      <div className="sdp-gestoria-cofre__cap">
        <h2 id={id} className="sdp-gestoria-cofre__titol">Còpies i claus del cofre</h2>
      </div>
      <Seccio titol="Còpia de seguretat xifrada">
        <p className="sdp-gestoria-cofre__nota">
          El cofre viu en este navegador, que el pot esborrar. La còpia ix xifrada: sense la frase de pas no es pot llegir.
        </p>
        <div className="sdp-gestoria-cofre__accions">
          <Boto varietat="secundari" carregant={c.ocupat === 'exportant'} disabled={Boolean(c.ocupat)} onClick={c.exporta}>
            Descarrega la còpia xifrada
          </Boto>
        </div>
        <AvisCofre avis={c.avis} zona="copia" onTanca={c.tancaAvis} />
        <ImportaCopia c={c} zona="copia" />
      </Seccio>
      <Seccio titol="Canvia la frase de pas">
        <FormulariCanvia c={c} />
        <AvisCofre avis={c.avis} zona="frase" onTanca={c.tancaAvis} />
      </Seccio>
      <Seccio titol="Codi de recuperació nou">
        <FormulariRenova c={c} />
        <AvisCofre avis={c.avis} zona="codi" onTanca={c.tancaAvis} />
      </Seccio>
      <Seccio titol="Exporta sense xifrar">
        <FormulariClar c={c} />
        <AvisCofre avis={c.avis} zona="clar" onTanca={c.tancaAvis} />
      </Seccio>
    </section>
  );
}

/**
 * @param {{ cofre?: object, descarrega?: Function, rellotge?: () => number,
 *   children?: (cofre: object) => import('react').ReactNode }} props
 */
export default function PortaCofre({ cofre, descarrega, rellotge, children }) {
  const c = useCofre({ cofre, descarrega, rellotge });
  const [oblidada, setOblidada] = useState(false);
  const idTitol = useId();
  // Obert el cofre, el pròxim bloqueig torna a demanar la frase, no el codi.
  useEffect(() => {
    if (c.estat === 'obert') setOblidada(false);
  }, [c.estat]);
  const marca = INSIGNIES[c.estat] ?? INSIGNIES.carregant;

  let cos;
  let obert = false;
  if (c.codiRecuperacio) cos = <PanellCodi codi={c.codiRecuperacio} onApuntat={c.codiApuntat} />;
  else if (c.estat === 'carregant') cos = <Carregant etiqueta="Comprovant el cofre…" />;
  else if (c.estat === 'insegur') {
    cos = (
      <Alerta to="error" viva={false} titol="El cofre no s’obri en esta adreça">
        <p>
          El xifratge del navegador només funciona en un context segur: https o localhost. Si has obert l’app des d’una
          altra màquina de la xarxa local per http, obri-la en este ordinador amb localhost. Així cap dada no viatja per la xarxa.
        </p>
      </Alerta>
    );
  } else if (c.estat === 'sense-magatzem') {
    cos = (
      <Alerta to="error" viva={false} titol="Este navegador no deixa desar el cofre">
        <p>Cal IndexedDB, que la navegació privada d’alguns navegadors desactiva. Obri l’app en una finestra normal.</p>
      </Alerta>
    );
  } else if (c.estat === 'absent') {
    cos = (
      <>
        <FormulariCrea c={c} />
        <ImportaCopia c={c} zona="porta" />
      </>
    );
  } else if (c.estat === 'bloquejat') {
    cos = oblidada
      ? <FormulariRecupera c={c} onTorna={() => setOblidada(false)} />
      : <FormulariObre c={c} onOblidada={() => setOblidada(true)} />;
  } else {
    obert = true;
    cos = <EstatObert c={c} />;
  }

  /* Tres blocs germans: la targeta del cofre, el contingut (només obert) i la gestió (només obert). */
  return (
    <>
      <section className="sdp-gestoria-cofre" aria-labelledby={idTitol}>
        <div className="sdp-gestoria-cofre__cap">
          <h2 id={idTitol} className="sdp-gestoria-cofre__titol">Cofre xifrat</h2>
          <Insignia to={marca.to}>{marca.text}</Insignia>
        </div>
        <AvisCofre avis={c.avis} zona="porta" onTanca={c.tancaAvis} />
        {cos}
      </section>
      {obert && typeof children === 'function' ? children(c.cofre) : null}
      {obert ? <GestioCofre c={c} /> : null}
    </>
  );
}
