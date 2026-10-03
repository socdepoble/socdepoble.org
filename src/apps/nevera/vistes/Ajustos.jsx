/**
 * La Nevera de Casa · AJUSTOS. No són catàleg ni col·lecció: són dues
 * columnes de formulari fetes amb el marc de l'esquelet (MarcColumna +
 * AppGridColumn) i peces de Pedra Seca. Cap classe pròpia.
 *   ColumnaAjustosLlista  el nom de la llista activa, l'ordre i la
 *                         visibilitat de les seues seccions (OrdenaCategories)
 *                         i esborrar-la
 *   ColumnaDades          on viuen les dades, la còpia (descarregar i
 *                         recuperar, sdp.nevera.copia.v1) i començar de nou
 * En pantalla estreta es veu una sola: /ajustos/<id> ↔ /ajustos/<id>/dades (push).
 */
import { useState } from 'react';
import { ArrowLeft, Database, Download, RotateCcw, Trash2 } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Boto, Camp, CampText, GrupCamps, MarcColumna, OrdenaCategories } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { LIMITS, llegixCopia, serialitzaCopia } from '../nucli/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { AJUSTOS } from './constants.js';
import { useVistaNevera } from './context.js';
import { seccionsDe } from './vestits.js';

/* El botó de la capçalera que porta a l'altra columna, només en pantalla estreta. */
function useAccioEstreta(accio) {
  const { mida } = useClosaAplicacio();
  return mida === 'estret' ? [accio] : [];
}

function FormulariNom({ llista, onCanvia }) {
  const [nom, setNom] = useState(llista.nom);
  const [error, setError] = useState(null);
  const envia = (event) => {
    event.preventDefault();
    if (!nom.trim()) {
      setError('Escriu un nom per a la llista.');
      return;
    }
    setError(null);
    onCanvia(nom);
  };
  return (
    <form onSubmit={envia} noValidate>
      <Camp etiqueta="Nom de la llista" error={error}>
        <CampText value={nom} maxLength={LIMITS.nom} autoComplete="off" onChange={(event) => setNom(event.target.value)} />
      </Camp>
      <Boto tipus="submit" varietat="primari" disabled={nom.trim() === llista.nom}>Canvia el nom</Boto>
    </form>
  );
}

export function ColumnaAjustosLlista({ params }) {
  const { estat, accions, llistaVigent, ruta, demanaConfirmacio } = useVistaNevera();
  const navigate = useNavigate();
  const llista = llistaVigent(params);
  const unica = estat.llistes.length < 2;
  const startActions = useAccioEstreta({
    id: 'dades', icona: Database, etiqueta: 'Dades i còpia', onAcciona: () => navigate(ruta(AJUSTOS.entrada, llista.id, AJUSTOS.tramDades))
  });
  const titol = `Ajustos de «${llista.nom}»`;
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} startActions={startActions} />} etiqueta={titol}>
      <GrupCamps llegenda="La llista">
        <FormulariNom key={llista.id} llista={llista} onCanvia={(nom) => accions.reanomenaLlista(llista.id, nom)} />
      </GrupCamps>
      <GrupCamps llegenda="Seccions">
        <OrdenaCategories
          categories={seccionsDe(estat, llista.id)}
          etiqueta={`Ordre de les seccions de «${llista.nom}»`}
          onMou={(id, direccio) => accions.mouSeccio(llista.id, id, direccio)}
          onVisibilitat={(id, visible) => accions.amagaSeccio(llista.id, id, !visible)}
        />
        <Boto icona={RotateCcw} onClick={() => accions.restableixSeccions(llista.id)}>Torna a l’ordre de sempre</Boto>
      </GrupCamps>
      <GrupCamps llegenda="Esborrar">
        {unica ? <p>És l’única llista: crea’n una altra abans d’esborrar esta.</p> : null}
        <Boto varietat="perill" icona={Trash2} disabled={unica} onClick={() => demanaConfirmacio({
          titol: `Vols esborrar «${llista.nom}»?`,
          descripcio: 'S’esborrarà la llista amb tot el que hi falta i els seus recents.',
          etiquetaConfirma: 'Esborra la llista',
          accio: () => accions.esborraLlista(llista.id)
        })}>Esborra esta llista</Boto>
      </GrupCamps>
    </MarcColumna>
  );
}

/* La data d'avui (AAAA-MM-DD) en l'hora local per al nom del fitxer de la
   còpia: toISOString és en UTC i, a mitjanit, diria el dia d'abans. */
const dosXifres = (n) => String(n).padStart(2, '0');
const avui = () => {
  const ara = new Date();
  return `${ara.getFullYear()}-${dosXifres(ara.getMonth() + 1)}-${dosXifres(ara.getDate())}`;
};

export function ColumnaDades({ params }) {
  const { estat, accions, llistaVigent, ruta, demanaConfirmacio, descarrega } = useVistaNevera();
  const navigate = useNavigate();
  const [errorCopia, setErrorCopia] = useState(null);
  const llista = llistaVigent(params);
  const startActions = useAccioEstreta({
    id: 'torna', icona: ArrowLeft, etiqueta: 'Torna als ajustos', onAcciona: () => navigate(ruta(AJUSTOS.entrada, llista.id))
  });

  const exporta = () => descarrega({
    nom: `nevera-de-casa-${avui()}.json`,
    tipus: 'application/json',
    dades: serialitzaCopia(estat, { creada: new Date().toISOString() })
  });

  const recupera = (event) => {
    const fitxer = event.target.files?.[0];
    event.target.value = '';
    if (!fitxer) return;
    fitxer.text().then((text) => {
      const resultat = llegixCopia(text);
      if (!resultat.ok) {
        setErrorCopia(resultat.error);
        return;
      }
      setErrorCopia(null);
      const { llistes, articles } = resultat.resum;
      demanaConfirmacio({
        titol: 'Vols recuperar esta còpia?',
        descripcio: `Porta ${llistes} ${llistes === 1 ? 'llista' : 'llistes'} i ${articles} ${articles === 1 ? 'article' : 'articles'} per comprar. Substituirà tot el que hi ha ara en este dispositiu.`,
        etiquetaConfirma: 'Recupera la còpia',
        accio: () => accions.importa(resultat.estat)
      });
    }, () => setErrorCopia('No s’ha pogut llegir el fitxer.'));
  };

  return (
    <MarcColumna capcalera={<AppGridColumn titol="Dades i còpia" startActions={startActions} />} etiqueta="Dades i còpia">
      <AvisNevera sempre />
      <GrupCamps llegenda="Còpia de seguretat">
        <Boto icona={Download} onClick={exporta}>Descarrega una còpia</Boto>
        <Camp etiqueta="Recupera una còpia" ajuda="Un fitxer .json descarregat d’ací. Substituïx totes les dades d’este dispositiu." error={errorCopia}>
          <CampText tipus="file" accept=".json,application/json" onChange={recupera} />
        </Camp>
      </GrupCamps>
      <GrupCamps llegenda="Començar de nou">
        <Boto varietat="perill" icona={Trash2} onClick={() => demanaConfirmacio({
          titol: 'Vols esborrar-ho tot?',
          descripcio: 'S’esborraran totes les llistes, els articles propis i el que hi ha a casa. Si en vols guardar alguna cosa, descarrega abans una còpia.',
          etiquetaConfirma: 'Esborra-ho tot',
          accio: () => accions.esborraTot()
        })}>Esborra-ho tot</Boto>
      </GrupCamps>
    </MarcColumna>
  );
}
