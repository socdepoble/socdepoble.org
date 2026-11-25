/**
 * Ajustos.jsx — persona, còpia i esborrat, i l'avís.
 *
 *   /persona   l'àlies, les hores habituals i què voleu apuntar (interruptors)
 *   /copia     on són les dades, còpia de seguretat (JSON), importar i esborrar-ho tot,
 *              i l'enllaç a importar un full de càlcul (/copia/full, ImportarFull.jsx)
 *   /avis      l'avís: s'ha d'acceptar la primera vegada i sempre es pot rellegir
 */
import { useEffect, useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useLocation } from '../../../app/contexts/RouterContext';
import {
  Accions, Alerta, Boto, Camp, CampText, DialegConfirmacio, GrupCamps, GrupOpcions, Interruptor, LlistaArticles, Pila
} from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import { avisSalutTraduit, textErrorSalut, tradueixErrorsPersonaSalut } from '../i18nSalut.js';
import { MAX_BYTES_COPIA, MODES_IMPORTACIO, llegixCopia, nomCopia } from '../nucli/copia.js';
import { CAMPS_PERSONA, llegixDecimes, validaPersona } from '../nucli/diccionari.js';
import { dataCurta, dataLocalDe } from '../nucli/hores.js';
import { useSalut } from '../useSalut.jsx';
import { ControlCamp, Enllac112, EnllacBoto, MarcSalut, useInterruptorsSalut, useNavegaSalut, useTextosSalut } from './comunes.jsx';
import { descarregaFitxer } from './descarrega.js';

export function MenuAjustos() {
  const navega = useNavegaSalut();
  const tx = useTextosSalut();
  /* /app/salut/<entrada>: l'entrada és l'ajust obert. */
  const actual = useLocation().pathname.split('/')[3];
  const articles = tx.menuAjustos.map((opcio) => ({ ...opcio, categoriaId: 'ajustos', estat: actual === opcio.id ? 'en-colleccio' : 'normal' }));
  return (
    <MarcSalut titol={tx.ajustos} columna="mig">
      <LlistaArticles articles={articles} etiqueta={tx.ajustos} textos={{ 'en-colleccio': tx.obert }} onTria={(article) => navega([article.id])} />
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
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const { actiu, apaga } = useInterruptorsSalut();
  const [valors, setValors] = useState(null);
  const [errors, setErrors] = useState({});
  const [missatge, setMissatge] = useState(null);
  const [errorInterruptor, setErrorInterruptor] = useState(null);
  const [desant, setDesant] = useState(false);
  const desantRef = useRef(false);
  if (!salut.carregat) return null;
  const commuta = (id, encés) => apaga(id, !encés).then(() => setErrorInterruptor(null), (error) => setErrorInterruptor(textErrorSalut(error, idioma)));
  const actuals = valors || salut.persona;
  const desa = async (event) => {
    event.preventDefault();
    if (desantRef.current) return;
    const { ok, errors: nous, persona } = validaPersona(aPersona(actuals));
    setErrors(tradueixErrorsPersonaSalut(nous, CAMPS_PERSONA, idioma));
    if (!ok) return;
    desantRef.current = true;
    setDesant(true);
    try {
      await salut.desaPersona(persona);
      setValors(null);
      setMissatge({ to: 'exit', text: tx.desat });
    } catch (error) {
      setMissatge({ to: 'error', text: textErrorSalut(error, idioma) });
    } finally {
      desantRef.current = false;
      setDesant(false);
    }
  };
  return (
    <MarcSalut titol={tx.persona}>
      <Pila gap={6}>
        <form onSubmit={desa} noValidate aria-label={tx.persona}>
          <Pila gap={4}>
            <p>{tx.aliesProuText}</p>
            {CAMPS_PERSONA.map((c) => (
              <ControlCamp key={c.clau} definicio={c} valor={actuals[c.clau]} error={errors[c.clau]}
                onCanvi={(valor) => {
                  setValors({ ...actuals, [c.clau]: valor });
                  if (errors[c.clau]) setErrors((prev) => ({ ...prev, [c.clau]: undefined }));
                  if (missatge) setMissatge(null);
                }} />
            ))}
            {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
            <Accions>
              <Boto varietat="primari" tipus="submit" carregant={desant} disabled={desant || salut.nomesLectura}>{tx.desa}</Boto>
            </Accions>
          </Pila>
        </form>
        <GrupCamps llegenda={tx.queVoleuApuntar}>
          {tx.interruptorsSalut.map((interruptor) => (
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
  const { ruta, idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const [estat, setEstat] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const [llegida, setLlegida] = useState(null);
  const [mode, setMode] = useState('afegir');
  const [confirmaImportacio, setConfirmaImportacio] = useState(false);
  const [important, setImportant] = useState(false);
  const [demanant, setDemanant] = useState(false);
  const [copiant, setCopiant] = useState(false);
  const [esborrantEnVol, setEsborrantEnVol] = useState(false);
  const operacioRef = useRef(false);
  const rondaCopia = useRef(0);
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
    if (operacioRef.current) return;
    operacioRef.current = true;
    setDemanant(true);
    try {
      const resultat = await salut.demanaPersistencia();
      if (resultat === true) informa('exit', tx.navegadorPromes);
      else if (resultat === false) informa('avis', tx.navegadorNoPromes);
      else informa('info', tx.navegadorNoPermetDemanar);
      setEstat(await salut.estatPersistencia());
    } catch (error) {
      informa('error', textErrorSalut(error, idioma));
    } finally {
      operacioRef.current = false;
      setDemanant(false);
    }
  };
  const copia = async () => {
    if (operacioRef.current) return;
    operacioRef.current = true;
    setCopiant(true);
    try {
      const text = await salut.copia();
      if (descarregaFitxer({ nom: nomCopia(salut.avui), tipus: 'application/json', dades: text })) informa('exit', tx.copiaDescarregada);
      else informa('avis', tx.navegadorNoDescarrega);
    } catch (error) {
      informa('error', textErrorSalut(error, idioma));
    } finally {
      operacioRef.current = false;
      setCopiant(false);
    }
  };
  const tria = async (event) => {
    const [fitxer] = event.target.files || [];
    event.target.value = '';
    if (!fitxer) return;
    const ronda = ++rondaCopia.current;
    setLlegida(null);
    setConfirmaImportacio(false);
    if (fitxer.size > MAX_BYTES_COPIA) {
      informa('error', tx.fitxerMassaGranSalut);
      return;
    }
    try {
      const resultat = llegixCopia(await fitxer.text());
      if (ronda !== rondaCopia.current) return;
      setLlegida(resultat.ok ? resultat : null);
      if (!resultat.ok) informa('error', idioma === 'ca' ? resultat.error : tx.errorLlegirFitxerCopia);
      else informa('info', tx.copiaPortaApunts(resultat.dades.apunts.length, resultat.descartats));
    } catch {
      if (ronda === rondaCopia.current) informa('error', tx.errorLlegirFitxerCopia);
    }
  };
  const importa = async () => {
    if (!llegida || important || salut.nomesLectura) return;
    setImportant(true);
    try {
      const informe = await salut.importa(llegida.dades, mode);
      setLlegida(null);
      informa('exit', informe.substituits ? tx.fetSubstituits(informe.afegits) : tx.fetAfegits(informe.afegits, informe.duplicats));
    } catch (error) {
      informa('error', textErrorSalut(error, idioma));
    } finally {
      setImportant(false);
      setConfirmaImportacio(false);
    }
  };
  const alias = salut.persona.alias || 'el pare';
  const esborra = async () => {
    if (operacioRef.current) return;
    if (confirmacio.trim() !== alias) {
      informa('error', tx.escriuAliasExacte(alias));
      setEsborrant(false);
      return;
    }
    operacioRef.current = true;
    setEsborrantEnVol(true);
    try {
      await salut.esborraTot();
      informa('exit', tx.totEsborrat);
    } catch (error) {
      informa('error', textErrorSalut(error, idioma));
    } finally {
      operacioRef.current = false;
      setEsborrantEnVol(false);
      setConfirmacio('');
      setEsborrant(false);
    }
  };

  return (
    <MarcSalut titol={tx.copiaIEsborrat}>
      <Pila gap={6}>
        <Pila gap={2}>
          <p>{salut.persistent ? tx.dadesEnNavegador : tx.dadesEnMemoria}</p>
          {estat?.duradora === true ? <p>{tx.navegadorPromes}</p> : null}
          {estat?.duradora === false ? <p>{tx.safari7Dies}</p> : null}
          {Number.isFinite(estat?.usat) ? <p>{tx.ocupenMegues(megues(estat.usat))}</p> : null}
          <Accions>
            <Boto varietat="secundari" carregant={demanant} disabled={demanant} onClick={demana}>{tx.demanaNoEsborre}</Boto>
          </Accions>
        </Pila>
        <Pila gap={2}>
          <p>{salut.ultimaCopia ? tx.ultimaCopiaDel(dataCurta(dataLocalDe(salut.ultimaCopia))) : tx.encaraCapCopia}</p>
          <Accions>
            <Boto varietat="primari" icona={Download} carregant={copiant} disabled={copiant} onClick={copia}>{tx.descarregaUnaCopia}</Boto>
          </Accions>
        </Pila>
        <GrupCamps llegenda={tx.importarUnaCopia}>
          <Camp etiqueta={tx.fitxerDeCopiaJson}>
            <CampText tipus="file" accept="application/json,.json" onChange={tria} disabled={salut.nomesLectura || important} />
          </Camp>
          {llegida ? (
            <>
              <GrupOpcions llegenda={tx.com} valor={mode} onCanvi={setMode} opcions={[
                { valor: MODES_IMPORTACIO[0], etiqueta: tx.afegirElQueNoHiHa, ajuda: tx.ajudaAfegirCopia },
                { valor: MODES_IMPORTACIO[1], etiqueta: tx.substituirHoTot, ajuda: tx.ajudaSubstituirCopia }
              ]} />
              <Accions>
                <Boto varietat="primari" icona={Upload} carregant={important}
                  disabled={important || salut.nomesLectura || (mode === 'substituir' && llegida.descartats > 0)}
                  onClick={() => mode === 'substituir' ? setConfirmaImportacio(true) : importa()}>{tx.importa}</Boto>
              </Accions>
              {mode === 'substituir' && llegida.descartats > 0
                ? <p>{tx.registresValidsPerSubstituir}</p> : null}
            </>
          ) : null}
        </GrupCamps>
        <Accions>
          <EnllacBoto a={ruta('copia', 'full')}>{tx.importarFullCalcul}</EnllacBoto>
        </Accions>
        {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
        <Pila gap={2}>
          <p>{tx.esborrarNoEsPotDesfer}</p>
          <Accions>
            <Boto varietat="perill" disabled={salut.nomesLectura || esborrantEnVol} onClick={() => setEsborrant(true)}>{tx.esborraHoTot}</Boto>
          </Accions>
        </Pila>
      </Pila>
      <DialegConfirmacio obert={confirmaImportacio} destructiu carregant={important} titol={tx.substituirDiariTitol}
        descripcio={tx.substituirDiariDesc}
        etiquetaConfirma={tx.substituixElDiari} etiquetaCancela={tx.cancella}
        onTanca={() => setConfirmaImportacio(false)} onConfirma={importa} />
      <DialegConfirmacio obert={esborrant} destructiu carregant={esborrantEnVol} titol={tx.esborrarTotTitol} etiquetaConfirma={tx.esborraHoTot} etiquetaCancela={tx.noEsborresRes}
        descripcio={tx.esborrarTotDesc}
        onTanca={() => { setConfirmacio(''); setEsborrant(false); }} onConfirma={esborra}>
        <Camp etiqueta={tx.perAConfirmarEscriu(alias)}>
          <CampText autoComplete="off" value={confirmacio} onChange={(event) => setConfirmacio(event.target.value)} />
        </Camp>
      </DialegConfirmacio>
    </MarcSalut>
  );
}

export function AvisSalut() {
  const salut = useSalut();
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const navega = useNavegaSalut();
  const [error, setError] = useState(null);
  const [acceptant, setAcceptant] = useState(false);
  const acceptantRef = useRef(false);
  if (!salut.carregat) return null;
  const apartats = avisSalutTraduit(idioma);
  const accepta = () => {
    if (acceptantRef.current) return;
    acceptantRef.current = true;
    setAcceptant(true);
    salut.acceptaAvis()
      .then(() => navega(['diari'], { replace: true }), (e) => setError(textErrorSalut(e, idioma)))
      .finally(() => {
        acceptantRef.current = false;
        setAcceptant(false);
      });
  };
  return (
    <MarcSalut titol={tx.avisIPrivacitat}>
      <Pila gap={6}>
        {apartats.map((apartat) => (
          <Pila key={apartat.titol} gap={2}>
            <p><strong>{apartat.titol}</strong></p>
            {apartat.paragrafs.map((paragraf) => <p key={paragraf}>{paragraf}</p>)}
          </Pila>
        ))}
        <Enllac112 />
        {error ? <Alerta to="error">{error}</Alerta> : null}
        {salut.avisAcceptat ? (
          <p>{tx.avisAcceptatEl(dataCurta(dataLocalDe(salut.avis.acceptatA)))}</p>
        ) : (
          <>
            {salut.nomesLectura ? <Alerta to="avis" titol={tx.nomesMirarTitol}>{tx.nomesMirarPanell}</Alerta> : null}
            <Accions>
              <Boto varietat="primari" mida="gran" carregant={acceptant} disabled={acceptant || salut.nomesLectura} onClick={accepta}>{tx.hoHeEntes}</Boto>
            </Accions>
          </>
        )}
      </Pila>
    </MarcSalut>
  );
}
