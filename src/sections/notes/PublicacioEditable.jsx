/**
 * PublicacioEditable.jsx — P0-25 / IDEA-96 + R32.44 / R32.45 (IDEA-324 v3 i
 * edició completa per a Beta Testers) · Una publicació pròpia del Mur, del
 * Mercat, dels Esdeveniments/Calendari, de les verticals o una pàgina de
 * Sistema oberta al Bloc de Notes s'edita viva a NotesEditor, amb confirmació
 * de retorn d'identitat d'1 clic («Vols tornar a ser Javi?») quan s'ha commutat
 * automàticament de perfil per entrar a editar.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { escriuSeleccio } from '../../components/universal/workspace/seleccioUrl.js';
import { esRutaInterna } from '../../config/navigation.js';
import { useNotes, ValorDeNotes } from './NotesContext.jsx';
import NotesEditor from './NotesEditor.jsx';
import { HistorialRevisionsBar } from './HistorialRevisionsBar.jsx';
import { bgSaveManager } from './GlobalSaveManager.js';
import { CLAUS_BLOC } from './modeDesa.js';
import { nouIdDeNota } from './notaPreparada.js';
import { ErrorPublicacio } from './visibilitatNota.js';
import { ErrorIdentitatDeLectura } from '../../app/contexts/identitatDeReserva.js';
import {
  avisDeLaRevisioEditorial,
  desaRevisioEditorialAmbServidor,
  rebutjadaPelServidor,
  revisaElement
} from '../../data/revisionsEditorials.js';
import {
  llegixCanviIdentitatEdicio,
  netejaCanviIdentitatEdicio
} from '../../data/retornIdentitatEdicio.js';
import { useIdentitatOReserva } from '../../app/contexts/useIdentitatOReserva.js';
import { useSuperadminEstable } from '../../hooks/useSuperadminEstable.js';
import {
  avisRevisioDesada,
  campsDeLAdopcio,
  campsDeLaRevisio,
  esFilaActualitzable,
  esRevisioEditorial,
  motiuNoActualitzable,
  motiuPublicacioDAltri,
  notaDeLaPublicacio
} from './publicacioEditable.js';

const MODES_LOCALS = new Set(['seed', 'local']);

function useSetActorSegur() {
  try {
    return useIdentitatOpcional()?.setActor ?? null;
  } catch {
    return null;
  }
}

function useIdiomaUISegur() {
  try {
    const ui = useUIStateOpcional();
    return ui?.llenguaDelText || ui?.language || 'ca';
  } catch {
    return 'ca';
  }
}

export function PublicacioEditable({ item }) {
  const base = useNotes();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();
  const { actor } = useIdentitatOReserva();
  const setActor = useSetActorSegur();
  const idioma = useIdiomaUISegur();
  const { esSuperadmin } = useSuperadminEstable();
  const inicial = useMemo(() => notaDeLaPublicacio(item), [item]);

  const [estat, setEstat] = useState(() => ({ clau: inicial.id, nota: inicial, alMur: inicial, versioEditor: 0 }));
  if (estat.clau !== inicial.id) setEstat({ clau: inicial.id, nota: inicial, alMur: inicial, versioEditor: 0 });
  const nota = estat.clau === inicial.id ? estat.nota : inicial;
  const versioEditor = estat.clau === inicial.id ? estat.versioEditor : 0;
  const alDia = estat.clau === inicial.id ? estat.nota === estat.alMur : true;
  const viva = useRef(nota);
  viva.current = nota;
  const adoptades = useRef(new Map());

  const retornCru = params?.get?.('retorn') || '';
  const retornValid = retornCru && esRutaInterna(retornCru) ? retornCru : '';
  const canviIdentitat = useMemo(
    () => (retornValid ? llegixCanviIdentitatEdicio({ retorn: retornValid, notaId: inicial.id }) : null),
    [retornValid, inicial.id]
  );
  const [confirmantRetorn, setConfirmantRetorn] = useState(false);

  const surtARetorn = useCallback((restauraAnterior) => {
    if (restauraAnterior && canviIdentitat?.anterior && typeof setActor === 'function') {
      if (canviIdentitat.anterior.tipus === 'persona') {
        setActor('persona');
      } else if (canviIdentitat.anterior.id) {
        setActor('entitat', canviIdentitat.anterior.id);
      }
    }
    netejaCanviIdentitatEdicio();
    setConfirmantRetorn(false);
    if (retornValid) {
      navigate(retornValid);
    }
  }, [canviIdentitat, setActor, retornValid, navigate]);

  const demanaTornar = useCallback(() => {
    if (!retornValid) return;
    if (canviIdentitat?.anterior) {
      setConfirmantRetorn(true);
      return;
    }
    navigate(retornValid);
  }, [retornValid, canviIdentitat, navigate]);

  const escriu = useCallback((id, camp, valor) => {
    if (String(id) !== viva.current.id) return;
    if (Object.is(viva.current[camp], valor)) return;
    const nova = { ...viva.current, [camp]: valor, ...(camp === 'heroImage' ? { coverImage: valor || undefined } : null) };
    viva.current = nova;
    setEstat((previ) => (previ.clau === nova.id ? { ...previ, nota: nova } : previ));
  }, []);

  const restauraDesDeHistorial = useCallback(() => {
    const { seccio, item: publicacio, baseCanonica } = item?.data || {};
    const fontBase = baseCanonica || publicacio;
    if (!seccio || !fontBase) return;
    const actualitzat = revisaElement(seccio, fontBase);
    const notaRestaurada = notaDeLaPublicacio({
      ...item,
      data: { ...item.data, item: actualitzat }
    });
    viva.current = notaRestaurada;
    setEstat((previ) => ({
      clau: notaRestaurada.id,
      nota: notaRestaurada,
      alMur: notaRestaurada,
      versioEditor: (previ.versioEditor || 0) + 1
    }));
  }, [item]);

  const publica = useCallback(async (doc, opcions) => {
    const actual = doc && String(doc.id) === viva.current.id ? { ...viva.current, ...doc } : viva.current;
    if (base?.nomesLectura) throw new ErrorIdentitatDeLectura();
    if (esRevisioEditorial(item)) {
      const rebuig = base?.rebuigDePublicacio?.(actual, { seccio: false, esSuperadmin });
      if (rebuig) throw rebuig;
      const motiuAlie = motiuPublicacioDAltri(item, { actor, config: base?.config, esSuperadmin, t: base?.t });
      if (motiuAlie) {
        showToast(motiuAlie, 'info');
        throw new ErrorPublicacio(motiuAlie);
      }
      const { seccio, item: publicacio } = item.data;
      const camps = campsDeLaRevisio(inicial, actual);
      const autorNom = actor?.nom || publicacio?.author_name || 'Sóc de Poble';
      const resultat = Object.keys(camps).length
        ? await desaRevisioEditorialAmbServidor(seccio, publicacio, camps, { esSuperadmin, config: base?.config, autorNom })
        : null;
      if (resultat && !resultat.desada) {
        const motiu = motiuNoActualitzable(item, base?.t);
        showToast(motiu, 'info');
        throw new ErrorPublicacio(motiu);
      }
      showToast(
        resultat?.desti === 'servidor' || rebutjadaPelServidor(resultat)
          ? avisDeLaRevisioEditorial(resultat, base?.t)
          : avisRevisioDesada(base?.t, seccio, idioma),
        rebutjadaPelServidor(resultat) ? 'info' : 'success'
      );
      return true;
    }
    if (MODES_LOCALS.has(base?.config?.dataMode)) {
      return opcions?.poble ? base.publishNote(actual, opcions) : base.publishNote(actual);
    }
    if (!esFilaActualitzable(item)) {
      const motiu = motiuNoActualitzable(item, base?.t);
      showToast(motiu, 'info');
      throw new ErrorPublicacio(motiu);
    }
    if (typeof base?.creaNota !== 'function' || typeof base?.updateNote !== 'function') return false;
    /* Les guardes de publishNote abans d'adoptar: un rebuig no deixa cap nota lligada. */
    const rebuig = typeof base?.rebuigDePublicacio === 'function'
      ? base.rebuigDePublicacio(actual)
      : (() => {
        const motiuAlieFila = motiuPublicacioDAltri(item, { actor, config: base?.config, esSuperadmin: false, t: base?.t });
        if (!motiuAlieFila) return null;
        showToast(motiuAlieFila, 'info');
        return new ErrorPublicacio(motiuAlieFila);
      })();
    if (rebuig) throw rebuig;
    const { creacio, lligam } = campsDeLAdopcio(actual);
    const clauAdopcio = inicial.id;
    let adoptada = adoptades.current.get(clauAdopcio) ?? null;
    if (!adoptada) {
      const creada = await base.creaNota({ ...creacio, id: nouIdDeNota() });
      adoptada = { id: String(creada.id), revision: creada.revision ?? 0, lligada: false };
      adoptades.current.set(clauAdopcio, adoptada);
    }
    if (!adoptada.lligada) {
      const { id, revision } = adoptada;
      const desada = await base.updateNote(id, lligam, revision);
      adoptada = { id, revision: desada?.revision ?? revision + 1, lligada: true };
      adoptades.current.set(clauAdopcio, adoptada);
      if (base.scopeKey) bgSaveManager.setRevision(base.scopeKey, id, adoptada.revision);
    }
    const { id, revision } = adoptada;
    setParams(escriuSeleccio(params, { item: id }, CLAUS_BLOC), { replace: true });
    const payloadNota = { ...actual, id, revision, publishedSubmissionId: actual.publishedSubmissionId, isPublished: true };
    return opcions?.poble ? base.publishNote(payloadNota, opcions) : base.publishNote(payloadNota);
  }, [actor, base, esSuperadmin, idioma, inicial, item, params, setParams, showToast]);

  const publicaIMarca = useCallback(async (doc, opcions) => {
    const enviada = viva.current;
    const resultat = opcions?.poble ? await publica(doc, opcions) : await publica(doc);
    if (resultat) {
      setEstat((previ) => (previ.clau === enviada.id ? { ...previ, alMur: enviada } : previ));
      if (retornValid) {
        if (canviIdentitat?.anterior) {
          setConfirmantRetorn(true);
        } else {
          navigate(retornValid);
        }
      }
    }
    return resultat;
  }, [publica, retornValid, canviIdentitat, navigate]);

  const motiuModeTraduccio = useMemo(
    () => motiuPublicacioDAltri(item, { actor, config: base?.config, esSuperadmin, t: base?.t }),
    [item, actor, base?.config, base?.t, esSuperadmin]
  );
  const modeTraduccioNomesLocal = esRevisioEditorial(item);
  const edicioDirecta = params?.get?.('plegades') === '1' || Boolean(retornValid);

  const retornIdentitat = useMemo(() => {
    if (!canviIdentitat?.anterior) return null;
    return {
      anteriorNom: canviIdentitat.anterior.nom,
      actualNom: actor?.nom || canviIdentitat.desti?.nom || 'Sóc de Poble',
      confirmant: confirmantRetorn,
      onDemanaTornar: retornValid ? demanaTornar : null,
      onTornaAAnterior: () => surtARetorn(true),
      onQuedatComActual: () => surtARetorn(false)
    };
  }, [canviIdentitat, actor?.nom, confirmantRetorn, retornValid, demanaTornar, surtARetorn]);

  const valor = useMemo(() => (base ? {
    ...base,
    motiuModeTraduccio,
    modeTraduccioNomesLocal,
    edicioDirecta,
    setLocalNoteField: escriu,
    saveNoteField: (id, camp, nou) => {
      escriu(id, camp, nou);
      return Promise.resolve(true);
    },
    desatEnMemoria: true,
    publishNote: publicaIMarca,
    versioAlMur: (doc) => (doc?.id != null && String(doc.id) === nota.id ? alDia : null),
    compartirNota: null,
    canviaEstatPublicacio: undefined,
    mouNota: undefined,
    esborraNota: undefined,
    potEsborrar: false,
    retiraDelMur: undefined,
    retiradaPendentDeNota: undefined
  } : null), [base, escriu, publicaIMarca, motiuModeTraduccio, modeTraduccioNomesLocal, edicioDirecta, nota.id, alDia]);

  if (!valor) return null;
  const { seccio, item: publicacio } = item?.data || {};
  const clauEditor = versioEditor > 0 ? `${nota.id}:${versioEditor}` : nota.id;
  return (
    <HistorialRevisionsBar
      actiu={modeTraduccioNomesLocal}
      seccio={seccio}
      itemId={publicacio?.id != null ? String(publicacio.id) : ''}
      autorNom={actor?.nom || null}
      onRestaura={restauraDesDeHistorial}
      retornIdentitat={retornIdentitat}
    >
      <ValorDeNotes value={valor}>
        <NotesEditor key={clauEditor} activeNote={nota} />
      </ValorDeNotes>
    </HistorialRevisionsBar>
  );
}

export default PublicacioEditable;
