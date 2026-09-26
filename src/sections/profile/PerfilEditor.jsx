import { useCallback, useMemo, useRef, useState } from 'react';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { usePerfil } from './PerfilContext.jsx';
import { SelectorIdentitat } from './SelectorIdentitat.jsx';
import { documentDeFitxa, fitxaDeLectura, menaDeFitxa, valorPerDesar } from './perfilCamps.js';

/* Qui pot editar la fitxa d'una organització (la RLS ho torna a dir al servidor). */
const ROLS_QUE_EDITEN = new Set(['owner', 'admin']);

/* PostgREST diu PGRST204 quan una columna no és a la memòria d'esquema i
   Postgres, 42703. Passa mentre la migració de la F1 no s'ha aplicat. */
const SENSE_COLUMNA = /PGRST204|42703|Could not find the '.+' column/i;

export const AVIS_SENSE_COLUMNA = 'Este camp encara no té columna al servidor: el canvi es queda en esta pantalla fins que s’aplique la migració.';

/**
 * La fitxa de la persona o de l'organització, amb l'Editor Universal
 * (D2 i D13): H1 = nom, H2 = bio / descripció, entradilla = lema, cos =
 * presentació. Qui només n'és membre la veu en lectura.
 */
export function PerfilEditor({ identitat }) {
  const { guardarCampPerfil, pujaMitja, recarrega, identitats } = usePerfil();
  const { showToast } = useToast();
  const mena = menaDeFitxa(identitat);
  const dades = identitat?.dades || {};
  /* Amb una baixa en curs el servidor té el perfil congelat (política
     restrictiva «profiles sense baixa»): cap desat arribaria. La fitxa es veu
     en lectura i es desfà cancel·lant la baixa des de «El compte». */
  const enBaixa = mena === 'persona' && Boolean(dades.baixa_demanada_at);
  /* La lectura de profiles ha fallat i getProfile ha tornat la fila de reserva
     (només nom i foto de la sessió): editar-la trepitjaria la bio, el lema i la
     presentació de veres amb camps buits. En lectura fins que es torne a llegir. */
  const deReserva = mena === 'persona' && dades.reserva === true;
  const potEditar = !enBaixa && !deReserva && (mena === 'persona' || ROLS_QUE_EDITEN.has(dades.role));
  /* list_my_organizations no porta el poble: el d'una entitat és el de la persona. */
  const poble = dades.town_name
    || (identitats || []).find((i) => i?.mena === 'persona')?.dades?.town_name
    || '';

  const [local, setLocal] = useState({});
  const fitxa = useMemo(() => documentDeFitxa(identitat, local), [identitat, local]);
  /* El que diu el servidor, sense el que s'està escrivint: un blur sense canvis no desa. */
  const original = useMemo(() => documentDeFitxa(identitat), [identitat]);

  /* Una columna que falta avisa una vegada, no a cada pausa de l'escriptura. */
  const columnesAbsents = useRef(new Set());

  const updateLocal = useCallback((_id, camp, valor) => {
    setLocal((previ) => (previ[camp] === valor ? previ : { ...previ, [camp]: valor }));
  }, []);

  const saveRemote = useCallback(async (_id, camp, valor) => {
    let desat;
    try {
      desat = valorPerDesar(mena, camp, valor);
    } catch (e) {
      showToast(e.message, 'error');
      return;
    }
    /* L'editor desa a cada blur, també sense haver tocat res. Comparat amb el
       valor del servidor passat pel mateix camí, un blur així no envia res: ni
       aplana una descripció de diversos paràgrafs ni fa un PUT i un PATCH. */
    let igual = false;
    try { igual = valorPerDesar(mena, camp, original[camp]).valor === desat.valor; } catch { igual = false; }
    if (igual) return;
    if (columnesAbsents.current.has(desat.columna)) return;
    try {
      await guardarCampPerfil(desat.columna, desat.valor, identitat.id);
    } catch (e) {
      if (e?.name === 'AbortError') return;
      if (SENSE_COLUMNA.test(String(e?.message || ''))) {
        columnesAbsents.current.add(desat.columna);
        showToast(AVIS_SENSE_COLUMNA, 'error');
        return;
      }
      showToast(e?.message || 'No s’ha pogut desar el canvi.', 'error');
    }
  }, [mena, original, guardarCampPerfil, identitat.id, showToast]);

  /* PUBLICAR commuta i ho diu: persona → is_public; organització → visibility. */
  const publish = useCallback(async () => {
    const publica = !fitxa.isPublished;
    try {
      if (mena === 'persona') await guardarCampPerfil('is_public', publica, identitat.id);
      else await guardarCampPerfil('visibility', publica ? 'public' : 'members', identitat.id);
      showToast(publica ? 'La fitxa ara és pública.' : 'La fitxa ara és privada.', 'success');
    } catch (e) {
      if (e?.name !== 'AbortError') showToast(e?.message || 'No s’ha pogut canviar la visibilitat.', 'error');
    }
  }, [fitxa.isPublished, mena, guardarCampPerfil, identitat.id, showToast]);

  const uploadMedia = useCallback(
    (fitxer) => pujaMitja(fitxer, mena === 'persona' ? 'avatars' : 'organitzacions'),
    [pujaMitja, mena],
  );

  const adapter = useMemo(() => {
    const etiquetes = enBaixa ? [{ text: identitat.rol }, { text: 'Baixa en curs' }]
      : deReserva ? [{ text: identitat.rol }, { text: 'Sense connexió' }]
        : [{ text: identitat.rol }];
    return {
      document: potEditar ? fitxa : null,
      emptyDocument: potEditar ? undefined : { ...fitxaDeLectura(identitat), labels: etiquetes },
      updateLocal,
      saveRemote,
      publish,
      uploadMedia,
      labels: etiquetes,
      identityActions: <SelectorIdentitat />,
      /* D13: les eines baixen davall de l'entradilla. La fitxa no porta
         llavor, i ho diu: sense la clau, DocumentEditor hi posa la de Notes. */
      posicioEines: 'davall-entradilla',
      seedContent: null,
      barAuthorAvatar: identitat.avatar || '',
      barAuthorName: identitat.nom,
      barAuthorLocation: poble,
      previewTitle: 'Fitxa pública',
      previewHelp: fitxa.isPublished
        ? 'La gent del poble pot vore esta fitxa.'
        : 'Només tu la veus. Publica-la des de la barra d’eines.',
    };
  }, [enBaixa, deReserva, potEditar, fitxa, identitat, poble, updateLocal, saveRemote, publish, uploadMedia]);

  if (deReserva) {
    return (
      <>
        <div className="sdp-alerta sdp-alerta--error" role="alert">
          <p>No s’ha pogut llegir la fitxa del servidor. Es mostra en lectura perquè cap canvi trepitge el que ja hi ha.</p>
          <div className="sdp-alerta__accions">
            <button type="button" className="sdp-boto sdp-boto--secundari" onClick={recarrega}>Tornar a provar</button>
          </div>
        </div>
        <DocumentEditor adapter={adapter} onToast={showToast} />
      </>
    );
  }

  return <DocumentEditor adapter={adapter} onToast={showToast} />;
}

export default PerfilEditor;
