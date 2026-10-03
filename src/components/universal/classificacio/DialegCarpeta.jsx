/**
 * DialegCarpeta — tria la carpeta d'un document. Sempre n'hi ha una i només
 * una (ràdios): la regla d'orfandat es complix per construcció.
 *
 * Crear, reanomenar i esborrar carpetes no tenen contracte de dades al port
 * (backendPort.js, AGENTS §8). T7 (P8) · El diàleg ja no pinta els tres
 * botons desactivats sense funció: només l'avís que passa qui el munta.
 *
 * T7 (P5) · Contracte amb el Workspace: les opcions són { id, nom, parentId }.
 * Si alguna penja d'una altra, es pinta l'arbre (buildWorkspaceFolderForest,
 * el mateix del Workspace) en profunditat i amb sagnat; el nom accessible de
 * cada ràdio porta el camí («TIC › Foto › Antigravity»). Sense parentId, la
 * llista plana de sempre (GrupOpcions), píxel a píxel.
 */
import { useId, useMemo, useState } from 'react';
import { Dialeg, Boto, GrupOpcions } from '../../PedraSeca/index.js';
import { buildWorkspaceFolderForest } from '../workspace/workspaceFolderForest.js';

const CAP = Object.freeze([]);
/* El sagnat creix fins al tercer nivell (el màxim del Workspace, P5). */
const NIVELL_MAXIM_SAGNAT = 2;

/**
 * Les carpetes en l'ordre de l'arbre (profunditat primer), cadascuna amb el
 * seu nivell (0 = arrel) i el camí de noms dels avantpassats. Un pare
 * desconegut o un cicle la tornen arrel (buildWorkspaceFolderForest).
 */
export function carpetesEnArbre(opcions = CAP) {
  const { roots } = buildWorkspaceFolderForest(opcions);
  // L'arbre normalitza l'id a text: la fila torna l'id tal com va arribar.
  const originals = new Map(opcions.filter((o) => o?.id != null).map((o) => [String(o.id), o.id]));
  const files = [];
  const visita = (node, nivell, cami) => {
    files.push({ id: originals.get(node.id) ?? node.id, clau: node.id, nom: node.nom, nivell, cami });
    for (const fill of node.children) visita(fill, nivell + 1, [...cami, node.nom]);
  };
  for (const arrel of roots) visita(arrel, 0, CAP);
  return files;
}

const classeDeNivell = (nivell) => (nivell > 0
  ? `sdp-casella sdp-classificacio-carpeta--nivell-${Math.min(nivell, NIVELL_MAXIM_SAGNAT)}`
  : 'sdp-casella');

/* Les mateixes classes que GrupOpcions (fieldset, casella, control i
   etiqueta): l'única diferència és el sagnat de cada fila. */
function ArbreCarpetes({ files, valor, onCanvi }) {
  const id = useId();
  return (
    <fieldset className="sdp-grup">
      <legend className="sdp-grup__llegenda">Carpetes</legend>
      {files.map((fila) => {
        const idOpcio = `${id}-${fila.clau}`;
        return (
          <div className={classeDeNivell(fila.nivell)} key={fila.clau}>
            <input type="radio" id={idOpcio} name={id} value={fila.clau}
              className="sdp-casella__control"
              checked={valor === fila.id}
              onChange={() => onCanvi(fila.id)} />
            <label htmlFor={idOpcio} className="sdp-casella__etiqueta">
              {/* L'espai va fora del text amagat: un espai final dins d'ell es
                  perdria en calcular el nom accessible («TIC ›Foto»). A l'inici
                  de la línia visible, el navegador el descarta. */}
              <span>
                {fila.cami.length ? <><span className="sdp-nomes-lector">{`${fila.cami.join(' › ')} ›`}</span>{' '}</> : null}
                {fila.nom}
              </span>
            </label>
          </div>
        );
      })}
    </fieldset>
  );
}

export function DialegCarpeta({ obert, onTanca, opcions = CAP, seleccionada, onDesa, avis }) {
  const [triada, setTriada] = useState(seleccionada);
  const valida = opcions.some((o) => o.id === triada);
  const files = useMemo(() => carpetesEnArbre(opcions), [opcions]);
  const arbre = files.some((fila) => fila.nivell > 0);
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol="Carpeta del document"
      descripcio="Cada document viu en una carpeta, i només en una."
      mida="s"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>Cancel·lar</Boto>
          <Boto varietat="primari" disabled={!valida} onClick={() => onDesa?.(triada)}>Desar</Boto>
        </>
      )}
    >
      {arbre ? (
        <ArbreCarpetes files={files} valor={triada} onCanvi={setTriada} />
      ) : (
        <GrupOpcions
          llegenda="Carpetes"
          opcions={opcions.map((o) => ({ valor: o.id, etiqueta: o.nom }))}
          valor={triada}
          onCanvi={setTriada}
        />
      )}
      {avis ? (
        <div className="sdp-classificacio-dialeg__reservat">
          <p className="sdp-classificacio-dialeg__avis">{avis}</p>
        </div>
      ) : null}
    </Dialeg>
  );
}

export default DialegCarpeta;
