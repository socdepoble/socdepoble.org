/* ═══════════════════════════════════════════════════════════════════
   T47 (correcció de la revisió C01, 260928) · EIXIR SENSE PERDRE RES EN SILENCI

   «Totes les dades s'han de desar automàticament sense pèrdues de dades.»
   Eixir esborra d'este dispositiu els esborranys d'esta persona (un
   ordinador compartit del poble). Abans, el text que el servidor no havia
   confirmat (una entradilla massa llarga, un camp sense columna, sense
   xarxa) s'esborrava sense cap avís.

   Ara «Confirmar eixida» i «Eixir del poble» pregunten primer a la sessió
   (preparaEixida: l'intent final i el que queda). Si queda res, ho diuen
   amb una Alerta de Pedra Seca i dos botons: «No eixir encara» i «Eixir
   igualment». Només el segon tanca la sessió i oblida.
   ═══════════════════════════════════════════════════════════════════ */
import { useCallback, useState } from 'react';
import { Alerta, Boto } from '../PedraSeca/index.js';
import { useSession } from '../../app/contexts/SessionContext.jsx';

/* Els camps de la fitxa (perfilCamps.js), com els diu la persona. */
const NOMS_CAMPS = Object.freeze({
  title: 'el nom',
  subtitle: 'el subtítol',
  lead: 'l’entradilla',
  content: 'la presentació',
  logoImage: 'l’avatar',
  heroImage: 'la capçalera',
  copyright: 'els drets d’autor',
});

export const ERROR_EIXIDA = 'No s’ha pogut tancar la sessió.';

/* Gauntlet R32.6 (PERFIL-01 i I18N-02) · El calaix «Amb qui actues?» i
   l'apartat Eixir del Perfil diuen l'avís en la llengua de la interfície: és
   el que explica QUÈ s'esborrarà. Taules locals i no claus del diccionari: el
   diccionari ca compta en el sostre de pes d'arrencada del connector WordPress.
   Sense llengua, el valencià de sempre, lletra per lletra: FullAjustos,
   ControlSection i DetallAjust no en passen cap i pinten el mateix. */
const NOMS_CAMPS_PER_LLENGUA = Object.freeze({
  ca: NOMS_CAMPS,
  es: Object.freeze({
    title: 'el nombre', subtitle: 'el subtítulo', lead: 'la entradilla', content: 'la presentación',
    logoImage: 'el avatar', heroImage: 'la cabecera', copyright: 'los derechos de autor',
  }),
  en: Object.freeze({
    title: 'the name', subtitle: 'the subtitle', lead: 'the standfirst', content: 'the introduction',
    logoImage: 'the avatar', heroImage: 'the header', copyright: 'the copyright',
  }),
  eu: Object.freeze({
    title: 'izena', subtitle: 'azpititulua', lead: 'sarrera', content: 'aurkezpena',
    logoImage: 'avatarra', heroImage: 'goiburua', copyright: 'egile-eskubideak',
  }),
  gl: Object.freeze({
    title: 'o nome', subtitle: 'o subtítulo', lead: 'a entradiña', content: 'a presentación',
    logoImage: 'o avatar', heroImage: 'a cabeceira', copyright: 'os dereitos de autor',
  }),
});

/* On són els canvis (`fitxa`, `notes`) i la frase sencera (`frase`), amb el
   plural de cada llengua. `on` ja porta el parèntesi, o és buit. */
const FRASES_PENDENTS = Object.freeze({
  ca: Object.freeze({
    fitxa: (noms) => `a la fitxa: ${noms}`,
    notes: (n) => `a Notes: ${n === 1 ? '1 nota' : `${n} notes`}`,
    frase: (total, on) => `Tens ${total === 1 ? '1 canvi' : `${total} canvis`} que el servidor encara no té${on}. Si ixes ara, s’esborraran d’este dispositiu.`,
  }),
  es: Object.freeze({
    fitxa: (noms) => `en la ficha: ${noms}`,
    notes: (n) => `en Notas: ${n === 1 ? '1 nota' : `${n} notas`}`,
    frase: (total, on) => `Tienes ${total === 1 ? '1 cambio' : `${total} cambios`} que el servidor todavía no tiene${on}. Si sales ahora, ${total === 1 ? 'se borrará' : 'se borrarán'} de este dispositivo.`,
  }),
  en: Object.freeze({
    fitxa: (noms) => `in the profile: ${noms}`,
    notes: (n) => `in Notes: ${n === 1 ? '1 note' : `${n} notes`}`,
    frase: (total, on) => `You have ${total === 1 ? '1 change' : `${total} changes`} that the server does not have yet${on}. If you sign out now, ${total === 1 ? 'it' : 'they'} will be deleted from this device.`,
  }),
  eu: Object.freeze({
    fitxa: (noms) => `fitxan: ${noms}`,
    notes: (n) => `Oharretan: ${n === 1 ? 'ohar 1' : `${n} ohar`}`,
    frase: (total, on) => (total === 1
      ? `Zerbitzariak oraindik ez duen aldaketa 1 duzu${on}. Orain irteten bazara, gailu honetatik ezabatuko da.`
      : `Zerbitzariak oraindik ez dituen ${total} aldaketa dituzu${on}. Orain irteten bazara, gailu honetatik ezabatuko dira.`),
  }),
  gl: Object.freeze({
    fitxa: (noms) => `na ficha: ${noms}`,
    notes: (n) => `en Notas: ${n === 1 ? '1 nota' : `${n} notas`}`,
    frase: (total, on) => `Tes ${total === 1 ? '1 cambio' : `${total} cambios`} que o servidor aínda non ten${on}. Se saes agora, ${total === 1 ? 'borrarase' : 'borraranse'} deste dispositivo.`,
  }),
});

/** El títol, els dos botons i l'error de l'avís, per llengua (els de DetallEixir). */
export const TEXTOS_AVIS_EIXIDA = Object.freeze({
  ca: Object.freeze({ titol: 'Encara hi ha canvis sense desar', noEixir: 'No eixir encara', eixirIgualment: 'Eixir igualment', error: ERROR_EIXIDA }),
  es: Object.freeze({ titol: 'Todavía hay cambios sin guardar', noEixir: 'No salir todavía', eixirIgualment: 'Salir igualmente', error: 'No se ha podido cerrar la sesión.' }),
  en: Object.freeze({ titol: 'You still have unsaved changes', noEixir: 'Stay signed in', eixirIgualment: 'Sign out anyway', error: 'Could not sign out.' }),
  eu: Object.freeze({ titol: 'Oraindik gorde gabeko aldaketak daude', noEixir: 'Ez irten oraindik', eixirIgualment: 'Irten hala ere', error: 'Ezin izan da saioa itxi.' }),
  gl: Object.freeze({ titol: 'Aínda hai cambios sen gardar', noEixir: 'Non saír aínda', eixirIgualment: 'Saír igualmente', error: 'Non se puido pechar a sesión.' }),
});

/* Una llengua que no és de les cinc (o cap) és el valencià. */
const codiConegut = (llengua) => (Object.hasOwn(TEXTOS_AVIS_EIXIDA, llengua) ? llengua : 'ca');

/** Els textos de l'avís en `llengua` (ca, es, en, eu o gl; si no, ca). */
export function textosAvisEixida(llengua = 'ca') {
  return TEXTOS_AVIS_EIXIDA[codiConegut(llengua)];
}

/** El text honest de l'avís: quants canvis, on són i què passarà si s'ix. */
export function textPendentsEixida(pendents = [], llengua = 'ca') {
  const codi = codiConegut(llengua);
  const frases = FRASES_PENDENTS[codi];
  const nomsCamps = NOMS_CAMPS_PER_LLENGUA[codi];
  const llista = Array.isArray(pendents) ? pendents : [];
  const total = llista.reduce((suma, pendent) => suma + (pendent?.camps?.length || 0), 0);
  const notes = llista.filter((pendent) => pendent?.entitat === 'nota');
  const fitxa = llista.filter((pendent) => pendent?.entitat !== 'nota');
  const on = [];
  if (fitxa.length) {
    const noms = [...new Set(fitxa.flatMap((pendent) => pendent.camps || []).map((camp) => (Object.hasOwn(nomsCamps, camp) ? nomsCamps[camp] : camp)))];
    on.push(frases.fitxa(noms.join(', ')));
  }
  if (notes.length) on.push(frases.notes(notes.length));
  return frases.frase(total, on.length ? ` (${on.join('; ')})` : '');
}

/* v1.2.6 (trinquet de l'arrencada del connector WordPress) · L'avís i l'error
   de l'eixida del calaix «Amb qui actues?». useIdentitatDeLaBarra, que és de
   l'arrencada, no importa este mòdul: el demana amb import(), precarregat
   després del primer pintat amb sessió i esperat abans de pintar cap avís.
   Així ni les taules de les cinc llengües ni Alerta i les seues icones no
   viatgen a l'arrencada estàtica. El DOM és el que pintava el hook: l'Alerta
   d'avís amb els dos botons dins d'un div.sdp-alerta__accions, i l'Alerta
   d'error amb el text sol (abans, a CalaixIdentitats). */
export function AvisEixidaDelCalaix({ pendents, llengua, eixint = false, onNoEixir, onEixir }) {
  const textos = textosAvisEixida(llengua);
  return (
    <Alerta
      to="avis"
      titol={textos.titol}
      accions={(
        <div className="sdp-alerta__accions">
          <Boto varietat="secundari" onClick={onNoEixir} autoFocus>{textos.noEixir}</Boto>
          <Boto varietat="perill" onClick={onEixir} carregant={eixint}>{textos.eixirIgualment}</Boto>
        </div>
      )}
    >
      <p>{textPendentsEixida(pendents, llengua)}</p>
    </Alerta>
  );
}

/** L'error del logout al calaix, en `llengua`. */
export function ErrorEixidaDelCalaix({ llengua }) {
  return <Alerta to="error">{textosAvisEixida(llengua).error}</Alerta>;
}

/**
 * `despres`: què fer quan la sessió s'ha tancat (navegar i recarregar).
 * Torna { demana, avis, error, ocupat }: `demana` és l'onClick del botó
 * d'eixir; `avis`, l'Alerta (o null) que el component pinta on vulga.
 */
export function useEixidaSegura({ despres } = {}) {
  const { logout, preparaEixida } = useSession();
  const [pendents, setPendents] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const [error, setError] = useState(null);

  const eix = useCallback(async () => {
    setError(null);
    setOcupat(true);
    try {
      await logout();
    } catch {
      setOcupat(false);
      setError(ERROR_EIXIDA);
      return;
    }
    setPendents(null);
    despres?.();
  }, [logout, despres]);

  const demana = useCallback(async () => {
    if (ocupat) return;
    setError(null);
    setOcupat(true);
    let queden = [];
    if (typeof preparaEixida === 'function') {
      try { queden = await preparaEixida(); } catch { queden = []; }
    }
    if (Array.isArray(queden) && queden.length) {
      setPendents(queden);
      setOcupat(false);
      return;
    }
    await eix();
  }, [ocupat, preparaEixida, eix]);

  const textos = TEXTOS_AVIS_EIXIDA.ca;
  const avis = pendents ? (
    <Alerta
      to="avis"
      titol={textos.titol}
      accions={(
        <>
          {/* El focus va al botó que no esborra res (Llei de la Por Orgànica). */}
          <Boto varietat="secundari" onClick={() => setPendents(null)} autoFocus>{textos.noEixir}</Boto>
          <Boto varietat="perill" onClick={eix} carregant={ocupat}>{textos.eixirIgualment}</Boto>
        </>
      )}
    >
      <p>{textPendentsEixida(pendents)}</p>
    </Alerta>
  ) : null;

  return { demana, avis, error, ocupat };
}
