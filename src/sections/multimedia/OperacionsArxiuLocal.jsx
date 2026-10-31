/**
 * OperacionsArxiuLocal.jsx — Operacions físiques al disc sobre el fitxer
 * obert (IDEA-55 A.3 · Onada 261029_1605), com en Obsidian o el Finder:
 * «Moure» a una altra carpeta, «Reanomenar» i «Eliminar del disc».
 *
 *   · Només es pinten si la font sap escriure (fontDesDeHandle): la font de
 *     només lectura (webkitdirectory) no en té cap.
 *   · El motor fa la feina segura: còpia per trossos, verificació (mida i
 *     SHA-256), recomprovació de l'origen, mai sobreescriure, cap `recursive`,
 *     i el permís readwrite com a primera espera del gest.
 *   · Amb canvis sense desar a l'editor, tot queda bloquejat.
 *   · Eliminar passa per un DialegConfirmacio destructiu: «S'esborrarà del
 *     disc i no anirà a la Paperera».
 *   · Les fallades que poden haver canviat el disc (CONFLICTE_DISC amb la
 *     còpia conservada, MOVIMENT_INCOMPLET) tornen a llegir la carpeta.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { FolderInput, Trash2 } from 'lucide-react';
import { Boto, Camp, DialegConfirmacio, Selector } from '../../components/PedraSeca/index.js';
import { esRutaEscrivibleLocal, nomFitxerDe, rutaDestiDeMoviment } from './motorMultimediaLocal.js';
import { FormulariNomLocal } from './FormulariNomLocal.jsx';
import { TEXTOS_VERIFICACIO_LOCAL, canviaElDisc, nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, missatgeDErrorLocal, tradueix } from './textosGestorLocal.js';

const CANCELA = ['common.cancela', 'Cancel·lar'];

/* Gauntlet 261029 (cicle 1) · TEXTOS_VERIFICACIO_LOCAL i canviaElDisc viuen a
   suportGestorLocal.js (este fitxer només exporta components: Fast Refresh).
   Un nom amb caràcters invisibles (esRutaEscrivibleLocal fals) es pot obrir
   però el Mas no el mou, ni el reanomena ni l'esborra: no se n'oferix cap
   operació. Una operació que acaba quan la persona ja és en una altra vista
   (o amb el component desmuntat) no hi demana cap selecció: porta l'`origen`. */
export function OperacionsArxiuLocal(props) {
  return esRutaEscrivibleLocal(props.el?.ruta) ? <OperacionsDelFitxer {...props} /> : null;
}

function OperacionsDelFitxer({ t, font, el, carpetes = [], nomVolum = '', bloquejat = false, onFet }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const id = useId();
  const viu = useRef(true);
  const caixa = useRef(null);
  const [desti, setDesti] = useState(null);
  const [mouent, setMouent] = useState(false);
  const [confirmaElimina, setConfirmaElimina] = useState(false);
  const [eliminant, setEliminant] = useState(false);

  useEffect(() => {
    viu.current = true;
    return () => {
      viu.current = false;
    };
  }, []);

  const destins = ['', ...carpetes].filter((carpeta) => carpeta !== el.carpeta && (carpeta === '' || esRutaEscrivibleLocal(carpeta)));
  const valorDesti = destins.includes(desti) ? desti : (destins[0] ?? '');
  const ocupat = mouent || eliminant;

  const mou = async (event) => {
    event.preventDefault();
    if (bloquejat || ocupat || destins.length === 0) return;
    setMouent(true);
    try {
      const mogut = await font.mou(el.ruta, rutaDestiDeMoviment(el.ruta, valorDesti));
      const verificacio = TEXTOS_VERIFICACIO_LOCAL[mogut.verificacio] || TEXTOS_VERIFICACIO_LOCAL.mida;
      onFet?.({
        missatge: { to: 'exit', parell: T['ops.mogut'], valors: { ruta: mogut.ruta, verificacio: tr(verificacio) } },
        seleccio: viu.current ? mogut.ruta : undefined,
        origen: { ruta: el.ruta }
      });
    } catch (error) {
      onFet?.({
        error,
        refresca: canviaElDisc(error),
        seleccio: viu.current && typeof error?.detall?.copiaConservada === 'string' ? error.detall.copiaConservada : undefined,
        origen: { ruta: el.ruta }
      });
    } finally {
      if (viu.current) setMouent(false);
    }
  };

  const reanomena = async (nouNom) => {
    if (bloquejat) return tr(T['ops.bloquejat']);
    try {
      const fet = await font.reanomena(el.ruta, nouNom);
      onFet?.({
        missatge: { to: 'exit', parell: T['ops.reanomenat'], valors: { nom: nomFitxerDe(fet.ruta) } },
        seleccio: viu.current ? fet.ruta : undefined,
        origen: { ruta: el.ruta }
      });
      return null;
    } catch (error) {
      if (canviaElDisc(error)) {
        onFet?.({ error, refresca: true });
        return null;
      }
      return missatgeDErrorLocal(t, error);
    }
  };

  const elimina = async () => {
    if (bloquejat || ocupat) return;
    setEliminant(true);
    try {
      const fet = await font.elimina(el.ruta);
      if (viu.current) setConfirmaElimina(false);
      onFet?.({ missatge: { to: 'exit', parell: T['ops.eliminat'], valors: { ruta: fet.ruta } }, seleccio: null, origen: { ruta: el.ruta } });
    } catch (error) {
      if (viu.current) setConfirmaElimina(false);
      onFet?.({ error });
    } finally {
      if (viu.current) setEliminant(false);
    }
  };

  return (
    <section ref={caixa} className="sdp-arxiu-local__operacions" aria-labelledby={`${id}-titol`}>
      <h4 id={`${id}-titol`}>{tr(T['ops.titol'])}</h4>
      {bloquejat ? <p className="sdp-arxiu-local__ajuda">{tr(T['ops.bloquejat'])}</p> : null}

      <form className="sdp-arxiu-local__formulari" onSubmit={mou}>
        <Camp etiqueta={tr(T['ops.desti'])} ajuda={destins.length === 0 ? tr(T['ops.senseDesti']) : null}>
          <Selector
            opcions={destins.map((carpeta) => ({
              valor: carpeta,
              etiqueta: carpeta === '' ? tr(T['ops.arrel'], { nom: nomVisibleLocal(nomVolum) }) : nomVisibleLocal(carpeta)
            }))}
            value={valorDesti}
            disabled={bloquejat || ocupat || destins.length === 0}
            onChange={(event) => setDesti(event.target.value)}
          />
        </Camp>
        <div className="sdp-arxiu-local__fila">
          <Boto tipus="submit" icona={FolderInput} carregant={mouent} disabled={bloquejat || eliminant || destins.length === 0}>
            {tr(T['ops.mou'])}
          </Boto>
        </div>
      </form>

      <FormulariNomLocal
        etiqueta={tr(T['ops.nouNom'])}
        ajuda={el.ext ? tr(T['ops.ajudaNom'], { ext: el.ext }) : null}
        textBoto={tr(T['ops.reanomena'])}
        valorInicial={el.nom}
        disabled={bloquejat || ocupat}
        onEnvia={reanomena}
      />

      <div className="sdp-arxiu-local__fila">
        <Boto varietat="perill" icona={Trash2} disabled={bloquejat || ocupat} onClick={() => setConfirmaElimina(true)} data-accio="elimina">
          {tr(T['ops.elimina'])}
        </Boto>
      </div>

      {confirmaElimina ? (
        <DialegConfirmacio
          obert
          destructiu
          carregant={eliminant}
          titol={tr(T['ops.confirmaElimina'], { nom: el.nom })}
          descripcio={tr(T['ops.confirmaEliminaText'])}
          etiquetaConfirma={tr(T['ops.eliminaDefinitiu'])}
          etiquetaCancela={tr(CANCELA)}
          onTanca={() => {
            if (eliminant) return;
            setConfirmaElimina(false);
            caixa.current?.querySelector('[data-accio="elimina"]')?.focus();
          }}
          onConfirma={elimina}
        />
      ) : null}
    </section>
  );
}
