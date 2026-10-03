/**
 * Ajustos.jsx — persona, còpia i esborrat, i l'avís.
 *
 *   /persona   l'àlies, les hores habituals i què voleu apuntar (interruptors)
 *   /copia     on són les dades, còpia de seguretat (JSON), importar i esborrar-ho tot,
 *              i l'enllaç a importar un full de càlcul (/copia/full, ImportarFull.jsx)
 *   /avis      l'avís: s'ha d'acceptar la primera vegada i sempre es pot rellegir
 */
import { useEffect, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useLocation } from '../../../app/contexts/RouterContext';
import {
  Alerta, Boto, Camp, CampText, DialegConfirmacio, GrupCamps, GrupOpcions, Interruptor, LlistaArticles, Pila
} from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import { MODES_IMPORTACIO, llegixCopia, nomCopia } from '../nucli/copia.js';
import { CAMPS_PERSONA, llegixDecimes, validaPersona } from '../nucli/diccionari.js';
import { dataCurta, dataLocalDe } from '../nucli/hores.js';
import { AVIS_SALUT, textError } from '../textos.js';
import { useSalut } from '../useSalut.jsx';
import { ControlCamp, Enllac112, EnllacBoto, MarcSalut, useInterruptorsSalut, useNavegaSalut } from './comunes.jsx';
import { descarregaFitxer } from './descarrega.js';

const MENU = Object.freeze([
  { id: 'persona', nom: 'Persona', secundari: 'Àlies, hores i què voleu apuntar' },
  { id: 'copia', nom: 'Còpia i esborrat', secundari: 'On són les dades i com no perdre-les' },
  { id: 'avis', nom: 'Avís i privacitat', secundari: 'Què és, què no és i on van les dades' }
]);
const INTERRUPTORS = Object.freeze([
  { id: 'agitacio', etiqueta: 'Agitació i conducta' },
  { id: 'medicacio', etiqueta: 'Medicació' },
  { id: 'deposicions', etiqueta: 'Deposicions' }
]);

export function MenuAjustos() {
  const navega = useNavegaSalut();
  /* /app/salut/<entrada>: l'entrada és l'ajust obert. */
  const actual = useLocation().pathname.split('/')[3];
  const articles = MENU.map((opcio) => ({ ...opcio, categoriaId: 'ajustos', estat: actual === opcio.id ? 'en-colleccio' : 'normal' }));
  return (
    <MarcSalut titol="Ajustos" columna="mig">
      <LlistaArticles articles={articles} etiqueta="Ajustos" textos={{ 'en-colleccio': 'Obert' }} onTria={(article) => navega([article.id])} />
    </MarcSalut>
  );
}

/* Els valors del formulari de persona com a persona (els nombres escrits passen a nombre). */
function aPersona(valors) {
  const persona = {};
  for (const c of CAMPS_PERSONA) {
    let valor = valors[c.clau];
    if (typeof valor === 'string') valor = valor.trim();
    if (valor === '') continue;
    if (c.tipus === 'enter' && typeof valor === 'string') valor = Number(valor);
    if (c.tipus === 'decimes' && typeof valor === 'string') valor = llegixDecimes(valor) ?? valor;
    persona[c.clau] = valor;
  }
  return persona;
}

export function AjustosPersona() {
  const salut = useSalut();
  const { actiu, apaga } = useInterruptorsSalut();
  const [valors, setValors] = useState(null);
  const [errors, setErrors] = useState({});
  const [missatge, setMissatge] = useState(null);
  const [errorInterruptor, setErrorInterruptor] = useState(null);
  if (!salut.carregat) return null;
  const commuta = (id, encés) => apaga(id, !encés).then(() => setErrorInterruptor(null), (error) => setErrorInterruptor(textError(error)));
  const actuals = valors || salut.persona;
  const desa = async (event) => {
    event.preventDefault();
    const { ok, errors: nous, persona } = validaPersona(aPersona(actuals));
    setErrors(nous);
    if (!ok) return;
    try {
      await salut.desaPersona(persona);
      setValors(null);
      setMissatge({ to: 'exit', text: 'Desat.' });
    } catch (error) {
      setMissatge({ to: 'error', text: textError(error) });
    }
  };
  return (
    <MarcSalut titol="Persona">
      <Pila gap={6}>
        <form onSubmit={desa} noValidate aria-label="Persona">
          <Pila gap={4}>
            <p>Només es veu en este dispositiu. No cal el nom: un àlies és prou.</p>
            {CAMPS_PERSONA.map((c) => (
              <ControlCamp key={c.clau} definicio={c} valor={actuals[c.clau]} error={errors[c.clau]}
                onCanvi={(valor) => setValors({ ...actuals, [c.clau]: valor })} />
            ))}
            {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
            <Boto varietat="primari" tipus="submit" disabled={salut.nomesLectura}>Desa</Boto>
          </Pila>
        </form>
        <GrupCamps llegenda="Què voleu apuntar">
          {INTERRUPTORS.map((interruptor) => (
            <Interruptor key={interruptor.id} etiqueta={interruptor.etiqueta} actiu={actiu(interruptor.id)}
              desactivat={salut.nomesLectura} onCanvi={(encés) => commuta(interruptor.id, encés)} />
          ))}
          {errorInterruptor ? <Alerta to="error">{errorInterruptor}</Alerta> : null}
        </GrupCamps>
      </Pila>
    </MarcSalut>
  );
}

const megues = (bytes) => `${String(Math.round((bytes / 1048576) * 10) / 10).replace('.', ',')} MB`;

export function CopiaIEsborrat() {
  const salut = useSalut();
  const { ruta } = useApp();
  const [estat, setEstat] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const [llegida, setLlegida] = useState(null);
  const [mode, setMode] = useState('afegir');
  const [esborrant, setEsborrant] = useState(false);
  const [confirmacio, setConfirmacio] = useState('');
  const { estatPersistencia } = salut;
  useEffect(() => {
    let viu = true;
    estatPersistencia().then((nou) => { if (viu) setEstat(nou); }, () => {});
    return () => { viu = false; };
  }, [estatPersistencia]);
  if (!salut.carregat) return null;

  const informa = (to, text) => setMissatge({ to, text });
  const demana = async () => {
    const resultat = await salut.demanaPersistencia();
    if (resultat === true) informa('exit', 'El navegador ha promés no esborrar-les per falta d’espai.');
    else if (resultat === false) informa('avis', 'El navegador no ho ha promés. Fes còpies sovint.');
    else informa('info', 'Este navegador no permet demanar-ho. Fes còpies sovint.');
    setEstat(await salut.estatPersistencia());
  };
  const copia = async () => {
    try {
      const text = await salut.copia();
      if (descarregaFitxer({ nom: nomCopia(salut.avui), tipus: 'application/json', dades: text })) informa('exit', 'Còpia descarregada. Guarda-la en un lloc segur.');
      else informa('avis', 'Este navegador no pot descarregar fitxers.');
    } catch (error) {
      informa('error', textError(error));
    }
  };
  const tria = async (event) => {
    const [fitxer] = event.target.files || [];
    if (!fitxer) return;
    const resultat = llegixCopia(await fitxer.text());
    setLlegida(resultat.ok ? resultat : null);
    if (!resultat.ok) informa('error', resultat.error);
    else informa('info', `La còpia porta ${resultat.dades.apunts.length} apunts${resultat.descartats ? ` (i ${resultat.descartats} registres no vàlids que no entraran)` : ''}.`);
  };
  const importa = async () => {
    try {
      const informe = await salut.importa(llegida.dades, mode);
      setLlegida(null);
      informa('exit', informe.substituits ? `Fet: ara hi ha les dades de la còpia (${informe.afegits} registres).`
        : `Fet: ${informe.afegits} registres nous; ${informe.duplicats} ja hi eren.`);
    } catch (error) {
      informa('error', textError(error));
    }
  };
  const alias = salut.persona.alias || 'el pare';
  const esborra = async () => {
    if (confirmacio.trim() !== alias) {
      informa('error', `Per a esborrar-ho tot, escriu «${alias}» exactament.`);
      setEsborrant(false);
      return;
    }
    try {
      await salut.esborraTot();
      informa('exit', 'Tot esborrat.');
    } catch (error) {
      informa('error', textError(error));
    }
    setConfirmacio('');
    setEsborrant(false);
  };

  return (
    <MarcSalut titol="Còpia i esborrat">
      <Pila gap={6}>
        <Pila gap={2}>
          <p>{salut.persistent ? 'Les dades es guarden en este navegador, en este dispositiu. No s’envien enlloc.' : 'Ara mateix les dades només són en la memòria: es perdran en tancar la pestanya.'}</p>
          {estat?.duradora === true ? <p>El navegador ha promés no esborrar-les per falta d’espai.</p> : null}
          {estat?.duradora === false ? <p>El navegador les podria esborrar si li falta espai o si fa dies que no s’obri (Safari ho fa després de 7 dies).</p> : null}
          {Number.isFinite(estat?.usat) ? <p>{`Ocupen uns ${megues(estat.usat)}.`}</p> : null}
          <Boto varietat="secundari" onClick={demana}>Demana que no les esborre</Boto>
        </Pila>
        <Pila gap={2}>
          <p>{salut.ultimaCopia ? `L’última còpia és del ${dataCurta(dataLocalDe(salut.ultimaCopia))}.` : 'Encara no has fet cap còpia.'}</p>
          <Boto varietat="primari" icona={Download} onClick={copia}>Descarrega una còpia</Boto>
        </Pila>
        <GrupCamps llegenda="Importar una còpia">
          <Camp etiqueta="Fitxer de còpia (.json)">
            <CampText tipus="file" accept="application/json,.json" onChange={tria} disabled={salut.nomesLectura} />
          </Camp>
          {llegida ? (
            <>
              <GrupOpcions llegenda="Com" valor={mode} onCanvi={setMode} opcions={[
                { valor: MODES_IMPORTACIO[0], etiqueta: 'Afegir el que no hi ha', ajuda: 'El que ja hi ha es queda; no es duplica res.' },
                { valor: MODES_IMPORTACIO[1], etiqueta: 'Substituir-ho tot', ajuda: 'El que hi ha ara s’esborra i es posa el de la còpia.' }
              ]} />
              <Boto varietat="primari" icona={Upload} onClick={importa}>Importa</Boto>
            </>
          ) : null}
        </GrupCamps>
        <EnllacBoto a={ruta('copia', 'full')}>Importar un full de càlcul</EnllacBoto>
        {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
        <Pila gap={2}>
          <p>Esborrar-ho tot no es pot desfer. Fes una còpia abans.</p>
          <Boto varietat="perill" disabled={salut.nomesLectura} onClick={() => setEsborrant(true)}>Esborra-ho tot</Boto>
        </Pila>
      </Pila>
      <DialegConfirmacio obert={esborrant} destructiu titol="Esborrar-ho tot" etiquetaConfirma="Esborra-ho tot" etiquetaCancela="No esborres res"
        descripcio="S’esborraran tots els apunts, els dies, els períodes i els ajustos d’este dispositiu."
        onTanca={() => { setConfirmacio(''); setEsborrant(false); }} onConfirma={esborra}>
        <Camp etiqueta={`Per a confirmar-ho, escriu «${alias}»`}>
          <CampText autoComplete="off" value={confirmacio} onChange={(event) => setConfirmacio(event.target.value)} />
        </Camp>
      </DialegConfirmacio>
    </MarcSalut>
  );
}

export function AvisSalut() {
  const salut = useSalut();
  const navega = useNavegaSalut();
  const [error, setError] = useState(null);
  if (!salut.carregat) return null;
  const accepta = () => salut.acceptaAvis().then(() => navega(['diari'], { replace: true }), (e) => setError(textError(e)));
  return (
    <MarcSalut titol="Avís i privacitat">
      <Pila gap={6}>
        {AVIS_SALUT.map((apartat) => (
          <Pila key={apartat.titol} gap={2}>
            <p><strong>{apartat.titol}</strong></p>
            {apartat.paragrafs.map((paragraf) => <p key={paragraf}>{paragraf}</p>)}
          </Pila>
        ))}
        <Enllac112 />
        {error ? <Alerta to="error">{error}</Alerta> : null}
        {salut.avisAcceptat ? (
          <p>{`Avís acceptat el ${dataCurta(dataLocalDe(salut.avis.acceptatA))}.`}</p>
        ) : (
          <Boto varietat="primari" mida="gran" disabled={salut.nomesLectura} onClick={accepta}>Ho he entés</Boto>
        )}
      </Pila>
    </MarcSalut>
  );
}
