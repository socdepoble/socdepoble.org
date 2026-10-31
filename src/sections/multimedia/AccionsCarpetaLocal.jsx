/**
 * AccionsCarpetaLocal.jsx — «Accions de carpeta» del Gestor d'arxius locals
 * (IDEA-55 A.3 · Onada 261029_1605): «Nova carpeta» i «Nou fitxer .md» dins
 * de la carpeta activa, i «Eliminar esta carpeta buida» (sense `recursive`:
 * el motor la refusa si té res, també fitxers ocults). Només es pinta si la
 * font sap escriure.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { FilePlus, FolderPlus, Trash2 } from 'lucide-react';
import { Boto, DialegConfirmacio } from '../../components/PedraSeca/index.js';
import { creaFitxerMarkdownLocal, esRutaEscrivibleLocal, nomFitxerDe, nomSegurDeFitxerLocal } from './motorMultimediaLocal.js';
import { FormulariNomLocal } from './FormulariNomLocal.jsx';
import { nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, missatgeDErrorLocal, tradueix } from './textosGestorLocal.js';

const CANCELA = ['common.cancela', 'Cancel·lar'];

/* Gauntlet 261029 (cicle 1) · Una carpeta amb caràcters invisibles al nom
   (esRutaEscrivibleLocal fals) es pot llegir però el Mas no hi crea res ni
   l'esborra: cap acció. L'arrel ('') sempre en té. */
export function AccionsCarpetaLocal(props) {
  const carpeta = props.carpeta ?? '';
  return carpeta === '' || esRutaEscrivibleLocal(carpeta) ? <AccionsDeLaCarpeta {...props} /> : null;
}

function AccionsDeLaCarpeta({ t, font, carpeta = '', nomVolum = '', buida = false, bloquejat = false, onFet, onNouFitxer }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const id = useId();
  const viu = useRef(true);
  const caixa = useRef(null);
  const [obert, setObert] = useState(null);
  const [confirma, setConfirma] = useState(false);
  const [eliminant, setEliminant] = useState(false);

  useEffect(() => {
    viu.current = true;
    return () => {
      viu.current = false;
    };
  }, []);

  /* En canviar de carpeta, els formularis oberts es tanquen (diuen on es crea). */
  useEffect(() => {
    setObert(null);
    setConfirma(false);
  }, [carpeta]);

  const onCarpeta = nomVisibleLocal(carpeta || nomVolum);

  const creaCarpeta = async (nom) => {
    const net = String(nom ?? '').trim();
    if (!net || /[\\/]/.test(net)) return missatgeDErrorLocal(t, { codi: 'NOM_INVALID' });
    try {
      const creada = await font.creaCarpeta(carpeta ? `${carpeta}/${net}` : net);
      if (viu.current) setObert(null);
      onFet?.({ missatge: { to: 'exit', parell: T['ops.carpetaCreada'], valors: { ruta: creada.ruta } }, carpeta: creada.ruta });
      return null;
    } catch (error) {
      return missatgeDErrorLocal(t, error);
    }
  };

  const creaMarkdown = async (nom) => {
    try {
      const creat = await creaFitxerMarkdownLocal(font, { carpeta, nom });
      if (viu.current) setObert(null);
      onNouFitxer?.(creat.ruta);
      return null;
    } catch (error) {
      if (error?.codi === 'FITXER_JA_EXISTEIX') return tr(T['text.existeix'], { nom: nomSegurDeFitxerLocal(nom, { extensio: 'md' }) });
      return missatgeDErrorLocal(t, error);
    }
  };

  const eliminaCarpeta = async () => {
    if (!carpeta || eliminant) return;
    setEliminant(true);
    try {
      const fet = await font.elimina(carpeta);
      if (viu.current) setConfirma(false);
      const mare = fet.ruta.includes('/') ? fet.ruta.slice(0, fet.ruta.lastIndexOf('/')) : '';
      onFet?.({ missatge: { to: 'exit', parell: T['ops.carpetaEliminada'], valors: { ruta: fet.ruta } }, carpeta: mare });
    } catch (error) {
      if (viu.current) setConfirma(false);
      onFet?.({ error });
    } finally {
      if (viu.current) setEliminant(false);
    }
  };

  return (
    <section ref={caixa} className="sdp-arxiu-local__panell" aria-labelledby={`${id}-titol`}>
      <h3 id={`${id}-titol`}>{tr(T['ops.accionsCarpeta'])}</h3>
      <p className="sdp-arxiu-local__ajuda">{tr(T['permis.escriptura'], { nom: nomVisibleLocal(nomVolum) })}</p>
      <div className="sdp-arxiu-local__fila">
        <Boto
          icona={FolderPlus}
          aria-expanded={obert === 'carpeta' ? 'true' : 'false'}
          disabled={bloquejat}
          onClick={() => setObert((ara) => (ara === 'carpeta' ? null : 'carpeta'))}
        >
          {tr(T['ops.novaCarpeta'])}
        </Boto>
        <Boto
          icona={FilePlus}
          aria-expanded={obert === 'md' ? 'true' : 'false'}
          disabled={bloquejat}
          onClick={() => setObert((ara) => (ara === 'md' ? null : 'md'))}
        >
          {tr(T['text.nou'])}
        </Boto>
        {carpeta && buida ? (
          <Boto varietat="perill" icona={Trash2} disabled={bloquejat || eliminant} onClick={() => setConfirma(true)} data-accio="elimina-carpeta">
            {tr(T['ops.eliminaCarpeta'])}
          </Boto>
        ) : null}
      </div>
      {obert === 'carpeta' ? (
        <FormulariNomLocal
          enfocaEnObrir
          etiqueta={tr(T['ops.nomCarpeta'])}
          ajuda={tr(T['ops.ajudaCarpeta'], { carpeta: onCarpeta })}
          textBoto={tr(T['ops.creaCarpeta'])}
          textCancela={tr(CANCELA)}
          onEnvia={creaCarpeta}
          onCancela={() => setObert(null)}
        />
      ) : null}
      {obert === 'md' ? (
        <FormulariNomLocal
          enfocaEnObrir
          etiqueta={tr(T['text.nomNou'])}
          ajuda={tr(T['text.ajudaNom'], { carpeta: onCarpeta })}
          textBoto={tr(T['text.crea'])}
          textCancela={tr(CANCELA)}
          onEnvia={creaMarkdown}
          onCancela={() => setObert(null)}
        />
      ) : null}
      {confirma ? (
        <DialegConfirmacio
          obert
          destructiu
          carregant={eliminant}
          titol={tr(T['ops.confirmaEliminaCarpeta'], { nom: nomFitxerDe(carpeta) })}
          descripcio={tr(T['ops.confirmaEliminaText'])}
          etiquetaConfirma={tr(T['ops.eliminaDefinitiu'])}
          etiquetaCancela={tr(CANCELA)}
          onTanca={() => {
            if (eliminant) return;
            setConfirma(false);
            caixa.current?.querySelector('[data-accio="elimina-carpeta"]')?.focus();
          }}
          onConfirma={eliminaCarpeta}
        />
      ) : null}
    </section>
  );
}
