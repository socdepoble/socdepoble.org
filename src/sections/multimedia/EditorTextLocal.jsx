/**
 * EditorTextLocal.jsx — Visor i editor de text local del Gestor d'arxius
 * locals (IDEA-55 · Onada 261029_1605): md, markdown, txt, json, csv, tsv,
 * yml, yaml i canvas. Tres accions: «Desar canvis al fitxer local»
 * (també ⌘S / Ctrl+S), «Enviar al Bloc de Notes» i «Nou fitxer .md».
 *
 * Integritat (decisions.md i critic.md):
 *   · UTF-8 estricte (llegixTextLocal): un fitxer que no ho és no s'edita.
 *   · El <textarea> normalitza CRLF a LF: en desar, escriuTextLocal torna a
 *     posar els salts i el BOM de l'original.
 *   · El permís readwrite és la PRIMERA espera del desat (clic o ⌘S).
 *   · Abans d'escriure es comprova que ningú l'ha canviat des de fora
 *     (`modificatEsperat`): si ha canviat, «Sobreescriure igualment» o
 *     «Tornar a llegir».
 *   · Un .json o un .canvas que no és JSON vàlid no es desa sense confirmar-ho.
 *   · Els canvis sense desar es comuniquen amunt (`onCanvisPendents`): el
 *     Gestor bloqueja moure, reanomenar i eliminar, i demana confirmació per a
 *     canviar de fitxer.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { FilePlus, NotebookPen, Save } from 'lucide-react';
import { Alerta, AreaText, Boto, Camp, Carregant, Dialeg } from '../../components/PedraSeca/index.js';
import {
  creaFitxerMarkdownLocal, escriuTextLocal, formatKb, llegixTextLocal, nomSegurDeFitxerLocal, verificaPermisCarpetaLocal
} from './motorMultimediaLocal.js';
import { MAX_TEXT_NOTA_BYTES, bytesDeText, notaDelFitxerLocal } from './notaDelFitxerLocal.js';
import { FormulariNomLocal } from './FormulariNomLocal.jsx';
import { nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, missatgeDErrorLocal, tradueix } from './textosGestorLocal.js';
import { useLocaleOpcional } from './useLocaleOpcional.js';

const CANCELA = ['common.cancela', 'Cancel·lar'];
const EXTENSIONS_JSON = new Set(['json', 'canvas']);
const normalitza = (text) => String(text ?? '').replace(/\r\n?/g, '\n');

export function EditorTextLocal({
  t,
  font,
  el,
  potEscriure = false,
  blocDeNotes = null,
  nomCarpeta = '',
  onCanvisPendents,
  onDesat,
  onNouFitxer
}) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const locale = useLocaleOpcional();
  const id = useId();
  const ruta = el.ruta;
  const caixa = useRef(null);
  const viu = useRef(true);
  const [versio, setVersio] = useState(0);
  const [lectura, setLectura] = useState(null);
  const [estat, setEstat] = useState('carregant');
  const [error, setError] = useState(null);
  const [valor, setValor] = useState('');
  const [avis, setAvis] = useState(null);
  const [desant, setDesant] = useState(false);
  const [jsonInvalid, setJsonInvalid] = useState(false);
  const [conflicte, setConflicte] = useState(false);
  const [enviant, setEnviant] = useState(false);
  const [nouObert, setNouObert] = useState(false);

  useEffect(() => {
    viu.current = true;
    return () => {
      viu.current = false;
    };
  }, []);

  useEffect(() => {
    let actiu = true;
    setEstat('carregant');
    setError(null);
    setAvis(null);
    setJsonInvalid(false);
    llegixTextLocal(font, ruta).then(
      (llegit) => {
        if (!actiu) return;
        const base = normalitza(llegit.text);
        setLectura({ ...llegit, base });
        setValor(base);
        setEstat('llest');
      },
      (errada) => {
        if (!actiu) return;
        setError(errada);
        setEstat('error');
      }
    );
    return () => {
      actiu = false;
    };
  }, [font, ruta, versio]);

  const editable = estat === 'llest' && Boolean(lectura?.editable) && potEscriure;
  const pendents = estat === 'llest' && lectura !== null && valor !== lectura.base;

  useEffect(() => {
    onCanvisPendents?.(pendents);
  }, [pendents, onCanvisPendents]);
  useEffect(() => () => onCanvisPendents?.(false), [onCanvisPendents]);

  const enfocaText = () => caixa.current?.querySelector('textarea')?.focus();

  const desa = async ({ forcaJson = false, forcaConflicte = false } = {}) => {
    if (!editable || desant) return;
    if (!forcaJson && EXTENSIONS_JSON.has(el.ext)) {
      try {
        JSON.parse(valor);
      } catch {
        setJsonInvalid(true);
        return;
      }
    }
    const text = valor;
    setJsonInvalid(false);
    setConflicte(false);
    setAvis(null);
    setDesant(true);
    try {
      /* La primera espera del clic o de ⌘S: si no, el navegador no mostra la petició. */
      const permis = await verificaPermisCarpetaLocal(font.handle, { mode: 'readwrite', demana: true });
      if (permis !== 'granted') {
        if (viu.current) {
          setAvis({ to: 'avis', text: permis === 'prompt' ? tr(T['permis.gestCaducat']) : missatgeDErrorLocal(t, { codi: 'ESCRIPTURA_DENEGADA' }) });
        }
        return;
      }
      const desat = await escriuTextLocal(font, ruta, text, {
        sobreescriu: true,
        ambBom: lectura.ambBom,
        salts: lectura.salts === 'crlf' ? 'crlf' : 'lf',
        /* QA-A03 (Gauntlet 261029, cicle 1) · La data i també la mida de la
           versió oberta: un canvi de fora amb la mateixa data (un sistema de
           fitxers de resolució grossa, una còpia que la conserva) també és un
           conflicte. «Sobreescriure igualment» no en comprova cap. */
        modificatEsperat: forcaConflicte ? null : lectura.modificat,
        midaEsperada: forcaConflicte ? null : lectura.mida
      });
      if (!viu.current) return;
      setLectura((abans) => ({
        ...abans,
        text,
        base: text,
        mida: desat.mida,
        modificat: desat.modificat,
        salts: abans.salts === 'mixt' ? 'lf' : abans.salts
      }));
      setAvis({ to: 'exit', text: tr(T['text.desat'], { ruta: desat.ruta }) });
      onDesat?.(desat.ruta);
    } catch (errada) {
      if (!viu.current) return;
      if (errada?.codi === 'CONFLICTE_DISC') setConflicte(true);
      else setAvis({ to: 'error', text: missatgeDErrorLocal(t, errada) });
    } finally {
      if (viu.current) setDesant(false);
    }
  };

  const enTecla = (event) => {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && String(event.key).toLowerCase() === 's') {
      event.preventDefault();
      desa();
    }
  };

  const envia = async () => {
    if (!blocDeNotes?.potCrear || enviant || estat !== 'llest') return;
    const bytes = bytesDeText(valor);
    if (bytes > MAX_TEXT_NOTA_BYTES) {
      setAvis({ to: 'avis', text: tr(T['text.massaLlarg'], { pes: formatKb(bytes, locale), max: formatKb(MAX_TEXT_NOTA_BYTES, locale) }) });
      return;
    }
    const entrada = notaDelFitxerLocal({ nom: el.nom, text: valor });
    if (!entrada) return;
    setAvis(null);
    setEnviant(true);
    try {
      const nota = await blocDeNotes.crea(entrada);
      if (nota?.id === undefined || nota?.id === null) throw new Error('Nota sense identificador.');
      blocDeNotes.obri?.(nota.id);
    } catch {
      if (viu.current) setAvis({ to: 'error', text: tr(T['text.errorNota']) });
    } finally {
      if (viu.current) setEnviant(false);
    }
  };

  const creaNou = async (nom) => {
    try {
      const creat = await creaFitxerMarkdownLocal(font, { carpeta: el.carpeta, nom });
      if (viu.current) setNouObert(false);
      onNouFitxer?.(creat.ruta);
      return null;
    } catch (errada) {
      if (errada?.codi === 'FITXER_JA_EXISTEIX') return tr(T['text.existeix'], { nom: nomSegurDeFitxerLocal(nom, { extensio: 'md' }) });
      return missatgeDErrorLocal(t, errada);
    }
  };

  if (estat === 'carregant') return <Carregant etiqueta={tr(T['detall.carregant'], { nom: nomVisibleLocal(el.nom) })} />;
  if (estat === 'error') {
    const text = error?.codi === 'FITXER_MASSA_GRAN'
      ? tr(T['detall.massaGran'], { pes: formatKb(el.mida, locale) })
      : missatgeDErrorLocal(t, error);
    return <Alerta to="avis">{text}</Alerta>;
  }

  const ajuda = !editable
    ? tr(T['text.nomesLectura'])
    : (lectura.salts === 'mixt' ? tr(T['text.saltsMixtos']) : null);

  return (
    <div ref={caixa} className="sdp-arxiu-local__editor-caixa">
      <Camp etiqueta={tr(T['text.etiqueta'], { nom: nomVisibleLocal(el.nom) })} ajuda={ajuda}>
        <AreaText
          files={18}
          className="sdp-arxiu-local__editor"
          spellCheck={false}
          value={valor}
          readOnly={!editable}
          onChange={(event) => setValor(event.target.value)}
          onKeyDown={enTecla}
        />
      </Camp>
      <p id={`${id}-estat`} role="status" className="sdp-arxiu-local__ajuda">
        {editable ? tr(pendents ? T['text.pendents'] : T['text.senseCanvis']) : ''}
      </p>
      {jsonInvalid ? (
        <Alerta to="avis" accions={<Boto onClick={() => desa({ forcaJson: true })}>{tr(T['text.desaIgualment'])}</Boto>}>
          {tr(T['text.jsonInvalid'])}
        </Alerta>
      ) : null}
      {avis ? <Alerta to={avis.to} onTanca={() => setAvis(null)}>{avis.text}</Alerta> : null}
      <div className="sdp-arxiu-local__fila">
        {editable ? (
          <Boto varietat="primari" icona={Save} carregant={desant} disabled={!pendents} onClick={() => desa()}>
            {tr(T['text.desa'])}
          </Boto>
        ) : null}
        <Boto icona={NotebookPen} carregant={enviant} disabled={!blocDeNotes?.potCrear} onClick={envia}>
          {tr(T['text.envia'])}
        </Boto>
        {potEscriure ? (
          <Boto icona={FilePlus} aria-expanded={nouObert ? 'true' : 'false'} onClick={() => setNouObert((obert) => !obert)}>
            {tr(T['text.nou'])}
          </Boto>
        ) : null}
      </div>
      <p className="sdp-arxiu-local__ajuda">{tr(T['text.enviaAjuda'])}</p>
      {!blocDeNotes?.potCrear ? <p className="sdp-arxiu-local__ajuda">{tr(T['text.calEntrar'])}</p> : null}
      {nouObert && potEscriure ? (
        <FormulariNomLocal
          enfocaEnObrir
          etiqueta={tr(T['text.nomNou'])}
          ajuda={tr(T['text.ajudaNom'], { carpeta: el.carpeta || nomCarpeta })}
          textBoto={tr(T['text.crea'])}
          textCancela={tr(CANCELA)}
          onEnvia={creaNou}
          onCancela={() => setNouObert(false)}
        />
      ) : null}
      {conflicte ? (
        <Dialeg
          obert
          mida="s"
          titol={tr(T['text.conflicteTitol'])}
          descripcio={tr(T['text.canviExtern'])}
          onTanca={() => {
            setConflicte(false);
            enfocaText();
          }}
          accions={(
            <>
              <Boto onClick={() => { setConflicte(false); enfocaText(); }}>{tr(CANCELA)}</Boto>
              <Boto onClick={() => { setConflicte(false); setVersio((v) => v + 1); }}>{tr(T.relleig)}</Boto>
              <Boto
                varietat="perill"
                onClick={() => {
                  enfocaText();
                  desa({ forcaJson: true, forcaConflicte: true });
                }}
              >
                {tr(T['text.sobreescriu'])}
              </Boto>
            </>
          )}
        />
      ) : null}
    </div>
  );
}
