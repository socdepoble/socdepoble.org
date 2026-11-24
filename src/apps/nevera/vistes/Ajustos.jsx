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
import { useRef, useState } from 'react';
import { ArrowLeft, Database, Download, RotateCcw, Trash2 } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Accions, Boto, Camp, CampText, GrupCamps, MarcColumna, OrdenaCategories } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { textosVistaNevera } from '../i18nNevera.js';
import { nomLlistaVisible } from '../mercadona.js';
import { LIMITS, MAX_COPIA, llegixCopia, serialitzaCopia } from '../nucli/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { AJUSTOS } from './constants.js';
import { useVistaNevera } from './context.js';
import { seccionsDe } from './vestits.js';

/* El botó de la capçalera que porta a l'altra columna, només en pantalla estreta. */
function useAccioEstreta(accio) {
  const { mida } = useClosaAplicacio();
  return mida === 'estret' ? [accio] : [];
}

function FormulariNom({ llista, onCanvia, tx }) {
  const [nom, setNom] = useState(llista.nom);
  const [error, setError] = useState(null);
  const envia = (event) => {
    event.preventDefault();
    if (!nom.trim()) {
      setError(tx.escriuNomLlista);
      return;
    }
    setError(null);
    onCanvia(nom);
  };
  return (
    <form onSubmit={envia} noValidate>
      <Camp etiqueta={tx.nomDeLaLlista} error={error}>
        <CampText value={nom} maxLength={LIMITS.nom} autoComplete="off" onChange={(event) => {
          setNom(event.target.value);
          if (error) setError(null);
        }} />
      </Camp>
      <Accions>
        <Boto tipus="submit" varietat="primari" disabled={nom.trim() === llista.nom}>{tx.canviaElNom}</Boto>
      </Accions>
    </form>
  );
}

export function ColumnaAjustosLlista({ params }) {
  const { estat, accions, llistaVigent, ruta, demanaConfirmacio } = useVistaNevera();
  const { idioma = 'ca' } = useClosaAplicacio();
  const tx = textosVistaNevera(idioma);
  const navigate = useNavigate();
  const llista = llistaVigent(params);
  /* v1.2.19 · Gauntlet R1 (L3-02) · El nom de la llista, pintat en la llengua de la interfície (la de botiga es desa amb el nom canònic). */
  const nomLlista = nomLlistaVisible(llista.nom, idioma);
  const unica = estat.llistes.length < 2;
  const startActions = useAccioEstreta({
    id: 'dades', icona: Database, etiqueta: tx.dadesICopia, onAcciona: () => navigate(ruta(AJUSTOS.entrada, llista.id, AJUSTOS.tramDades))
  });
  const titol = tx.ajustosDe(nomLlista);
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} startActions={startActions} />} etiqueta={titol}>
      <GrupCamps llegenda={tx.laLlista}>
        <FormulariNom key={llista.id} llista={llista} onCanvia={(nom) => accions.reanomenaLlista(llista.id, nom)} tx={tx} />
      </GrupCamps>
      <GrupCamps llegenda={tx.seccions}>
        <OrdenaCategories
          categories={seccionsDe(estat, llista.id)}
          etiqueta={tx.ordreSeccions(nomLlista)}
          onMou={(id, direccio) => accions.mouSeccio(llista.id, id, direccio)}
          onVisibilitat={(id, visible) => accions.amagaSeccio(llista.id, id, !visible)}
        />
        <Accions>
          <Boto icona={RotateCcw} onClick={() => accions.restableixSeccions(llista.id)}>{tx.tornaOrdreSempre}</Boto>
        </Accions>
      </GrupCamps>
      <GrupCamps llegenda={tx.esborrar}>
        {unica ? <p>{tx.unicaLlistaAvis}</p> : null}
        <Accions>
          <Boto varietat="perill" icona={Trash2} disabled={unica} onClick={() => demanaConfirmacio({
            titol: tx.volsEsborrarLlista(nomLlista),
            descripcio: tx.esborrarLlistaDesc,
            etiquetaConfirma: tx.esborraLaLlista,
            accio: () => accions.esborraLlista(llista.id)
          })}>{tx.esborraEstaLlista}</Boto>
        </Accions>
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
  const { idioma = 'ca' } = useClosaAplicacio();
  const tx = textosVistaNevera(idioma);
  const navigate = useNavigate();
  const [errorCopia, setErrorCopia] = useState(null);
  const rondaCopia = useRef(0);
  const llista = llistaVigent(params);
  const startActions = useAccioEstreta({
    id: 'torna', icona: ArrowLeft, etiqueta: tx.tornaAlsAjustos, onAcciona: () => navigate(ruta(AJUSTOS.entrada, llista.id))
  });

  const exporta = async () => {
    setErrorCopia(null);
    const nom = `nevera-de-casa-${avui()}.json`;
    const creada = new Date().toISOString();
    try {
      const desat = await accions.copia();
      descarrega({
        nom,
        tipus: 'application/json',
        dades: serialitzaCopia(desat, { creada })
      });
    } catch {
      setErrorCopia(tx.errorLlegirDesades);
    }
  };

  const recupera = (event) => {
    const fitxer = event.target.files?.[0];
    event.target.value = '';
    if (!fitxer) return;
    const ronda = ++rondaCopia.current;
    if (fitxer.size > 4 * MAX_COPIA) {
      setErrorCopia(tx.copiaMassaGran);
      return;
    }
    fitxer.text().then((text) => {
      if (ronda !== rondaCopia.current) return;
      const resultat = llegixCopia(text);
      if (!resultat.ok) {
        setErrorCopia(resultat.error);
        return;
      }
      setErrorCopia(null);
      const { llistes, articles } = resultat.resum;
      demanaConfirmacio({
        titol: tx.volsRecuperarCopia,
        descripcio: tx.recuperarCopiaDesc(llistes, articles),
        etiquetaConfirma: tx.recuperaLaCopia,
        accio: () => accions.importa(resultat.estat, estat)
      });
    }, () => {
      if (ronda === rondaCopia.current) setErrorCopia(tx.errorLlegirFitxer);
    });
  };

  return (
    <MarcColumna capcalera={<AppGridColumn titol={tx.dadesICopia} startActions={startActions} />} etiqueta={tx.dadesICopia}>
      <AvisNevera sempre />
      <GrupCamps llegenda={tx.copiaSeguretat}>
        <Accions>
          <Boto icona={Download} onClick={exporta}>{tx.descarregaUnaCopia}</Boto>
        </Accions>
        <Camp etiqueta={tx.recuperaUnaCopia} ajuda={tx.ajudaRecuperaCopia} error={errorCopia}>
          <CampText tipus="file" accept=".json,application/json" onChange={recupera} />
        </Camp>
      </GrupCamps>
      <GrupCamps llegenda={tx.comencarDeNou}>
        <Accions>
          <Boto varietat="perill" icona={Trash2} onClick={() => demanaConfirmacio({
            titol: tx.volsEsborrarTot,
            descripcio: tx.esborrarTotDesc,
            etiquetaConfirma: tx.esborraHoTot,
            accio: () => accions.esborraTot()
          })}>{tx.esborraHoTot}</Boto>
        </Accions>
      </GrupCamps>
    </MarcColumna>
  );
}
