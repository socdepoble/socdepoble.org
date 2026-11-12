import { useMemo, useState } from 'react';
import { AreaText, Boto, Camp, CampText } from '../../components/PedraSeca/index.js';
import { creaFitxaDoctoralArbre, calculaDeltaBiometricArbre, slugRevisionsDoctoralsArbre,
  LIMITS_MESURES_DOCTORALS, esMesuraDendrometricaValida } from '../../data/patrimoni/esquemaDoctoralArbres.js';
import EinesDadesArbres from './EinesDadesArbres.jsx';
import { useRevisionsArbre } from './useRevisionsArbre.js';

const COTES = Object.freeze([
  { clau: 'alcadaM', etiqueta: 'Alçària total (m)' },
  { clau: 'diametreCapcadaM', etiqueta: 'Diàmetre major de capçada (m)' },
  { clau: 'perimetreNormalCm', etiqueta: 'Perímetre de tronc a 1,30 m (cm)' },
  { clau: 'perimetreBasalCm', etiqueta: 'Perímetre basal (cm)' }
]);
const buit = () => ({ campanyaAny: String(new Date().getFullYear()), estatConservacio: '', observacions: '',
  alcadaM: '', diametreCapcadaM: '', perimetreNormalCm: '', perimetreBasalCm: '' });

function FormulariCampanya({ servei }) {
  const [entrada, setEntrada] = useState(buit);
  const [original, setOriginal] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const [missatge, setMissatge] = useState('');
  const [error, setError] = useState('');
  const [confirmaBaixa, setConfirmaBaixa] = useState(false);
  const canvia = (clau, value) => setEntrada(previ => ({ ...previ, [clau]: value }));
  const edita = fila => {
    setOriginal(fila);
    setEntrada({ campanyaAny: String(fila.campanyaAny), estatConservacio: fila.estatConservacio,
      observacions: fila.observacions, ...Object.fromEntries(COTES.map(({ clau }) => [clau, String(fila.mesures[clau] ?? '')])) });
    setConfirmaBaixa(false);
    setError('');
    setMissatge('');
  };
  const reinicia = () => { setOriginal(null); setEntrada(buit()); setConfirmaBaixa(false); };

  async function desa(event) {
    event.preventDefault();
    setOcupat(true); setError(''); setMissatge('');
    try {
      const mesures = { ...original?.mesures };
      for (const { clau } of COTES) {
        if (entrada[clau] === '') delete mesures[clau];
        else {
          const valor = Number(entrada[clau]);
          if (!esMesuraDendrometricaValida(clau, valor)) throw new Error('La cota queda fora de l’interval admés pel perfil de dades.');
          mesures[clau] = valor;
        }
      }
      await servei.desa({ campanyaAny: Number(entrada.campanyaAny), estatConservacio: entrada.estatConservacio,
        observacions: entrada.observacions, mesures, versio: original?.versio ?? 0,
        ...(original ? { id: original.id } : {}) });
      reinicia();
      setMissatge(['seed', 'local'].includes(servei.mode) ? 'Campanya desada en la memòria d’esta instància.' : 'Campanya desada al node.');
    } catch (cause) {
      if (cause?.name !== 'AbortError') setError(cause.message || 'La campanya no s’ha pogut desar.');
    } finally { setOcupat(false); }
  }

  async function esborra() {
    if (!original || !confirmaBaixa) return;
    setOcupat(true); setError(''); setMissatge('');
    try {
      await servei.esborra({ id: original.id, versio: original.versio, campanyaAny: original.campanyaAny });
      reinicia(); setMissatge('Campanya esborrada.');
    } catch (cause) {
      if (cause?.name !== 'AbortError') setError(cause.message || 'La campanya no s’ha pogut esborrar.');
    } finally { setOcupat(false); }
  }

  return (
    <>
      {servei.files.length > 0 && (
        <ul>{servei.files.map(fila => (
          <li key={fila.id}>
            <strong>{fila.campanyaAny}</strong> · {fila.estatConservacio}
            {servei.autoritzat && <Boto disabled={ocupat} onClick={() => edita(fila)}>Editar campanya {fila.campanyaAny}</Boto>}
          </li>
        ))}</ul>
      )}
      {servei.autoritzat && servei.disponible ? (
        <form onSubmit={desa}>
          <fieldset disabled={ocupat || servei.fase === 'carregant' || servei.fase === 'carregant-mes'}>
            <legend>{original ? 'Editar campanya' : 'Nova campanya de camp'}</legend>
            <Camp etiqueta="Any de campanya" obligatori>
              <CampText tipus="number" min="1" max="9999" required disabled={Boolean(original)} value={entrada.campanyaAny}
                onChange={event => canvia('campanyaAny', event.target.value)} />
            </Camp>
            <Camp etiqueta="Estat de conservació observat" obligatori>
              <CampText required maxLength={80} value={entrada.estatConservacio}
                onChange={event => canvia('estatConservacio', event.target.value)} />
            </Camp>
            {COTES.map(({ clau, etiqueta }) => (
              <Camp key={clau} etiqueta={etiqueta}>
                <CampText tipus="number" min="0" max={LIMITS_MESURES_DOCTORALS[clau].maxim} step="any" value={entrada[clau]}
                  onChange={event => canvia(clau, event.target.value)} />
              </Camp>
            ))}
            <Camp etiqueta="Observacions i mètode de mesura">
              <AreaText maxLength={4000} value={entrada.observacions}
                onChange={event => canvia('observacions', event.target.value)} />
            </Camp>
            <Boto tipus="submit" varietat="primari">Desa campanya</Boto>
            {original && <Boto onClick={reinicia}>Nova campanya</Boto>}
            {original && <Boto varietat="perill" onClick={() => setConfirmaBaixa(true)}>Esborra campanya</Boto>}
            {confirmaBaixa && (
              <div role="group" aria-label="Confirmació de baixa de campanya">
                <p>Esborrar la campanya {original.campanyaAny}?</p>
                <Boto varietat="perill" onClick={esborra}>Confirma l’esborrat</Boto>
                <Boto onClick={() => setConfirmaBaixa(false)}>Conserva la campanya</Boto>
              </div>
            )}
          </fieldset>
        </form>
      ) : <p>Inicia sessió en un node amb revisions de patrimoni per a desar una campanya.</p>}
      {missatge && <p role="status">{missatge}</p>}
      {error && <p role="alert">{error}</p>}
    </>
  );
}

export default function FitxaDadesDoctoralsArbre({ arbre, font }) {
  const servei = useRevisionsArbre(slugRevisionsDoctoralsArbre(arbre.id, font?.id));
  const fitxa = useMemo(() => creaFitxaDoctoralArbre(arbre, { revisions: servei.files, font }), [arbre, font, servei.files]);
  const deltes = useMemo(() => calculaDeltaBiometricArbre(fitxa), [fitxa]);
  return (
    <div>
      <h4>Dades científiques i procedència</h4>
      <p>{fitxa.font.titol} · {fitxa.font.municipi}</p>
      <dl>
        <dt>Taxonomia APG IV, POWO i Flora Iberica</dt>
        <dd><em lang="la">{fitxa.taxonomia.nomCientific}</em>. Contrast amb les autoritats taxonòmiques pendent.</dd>
        <dt>Georeferenciació ETRS89 i bioclimatologia</dt>
        <dd>
          {fitxa.georeferenciacio.paratge}
          {fitxa.georeferenciacio.utmEtrs89
            ? ` · UTM ETRS89 fus ${fitxa.georeferenciacio.utmEtrs89.fus} · ${fitxa.georeferenciacio.utmEtrs89.x} / ${fitxa.georeferenciacio.utmEtrs89.y}`
            : ' · Coordenades pendents de campanya.'}
          {' Classificació bioclimàtica Rivas-Martínez pendent de campanya.'}
        </dd>
        <dt>Biometria CIEF i valoració Norma Granada</dt>
        <dd>Data de presa de dades · {fitxa.biometria.base.data || 'Pendent de campanya'}. La valoració econòmica Norma Granada està pendent d’avaluació.</dd>
        {COTES.map(({ clau, etiqueta }) => (
          <div key={clau}><dt>{etiqueta}</dt><dd>{fitxa.biometria.base.dimensions[clau] ?? 'Pendent de campanya'}</dd></div>
        ))}
        <dt>Avaluació visual VTA i sanitat vegetal</dt>
        <dd>{fitxa.avaluacio.descripcio} {fitxa.avaluacio.estatSalut} La diagnosi actual requerix una campanya documentada.</dd>
        <dt>Protecció jurídica</dt>
        <dd>Categoria declarada en el catàleg. Identificador registral i vigència de les mesures pendents de contrast amb l’administració competent.</dd>
        <dt>Etnobotànica i memòria oral</dt>
        <dd>{fitxa.memoria.valorCulturalHistoric || 'Pendent de documentació.'}</dd>
      </dl>
      <details>
        <summary>Referències del paquet de dades</summary>
        <p>{fitxa.avaluacio.observacions}</p>
        <ul>{fitxa.proteccio.marcNormatiu.map((norma, index) => <li key={index}>{norma}</li>)}</ul>
        <p>{fitxa.font.llicencia}</p>
        {fitxa.documentacio.urlOriginal && <p><a href={fitxa.documentacio.urlOriginal} target="_blank" rel="noopener noreferrer">Font documental original</a></p>}
      </details>
      {deltes.length > 0 && (
        <>
          <h4>Variació entre campanyes mesurades</h4>
          <ul>{deltes.map(delta => (
            <li key={`${delta.camp}-${delta.anyInicial}-${delta.anyFinal}`}>
              {delta.camp} · {delta.anyInicial} → {delta.anyFinal} · Δ {delta.delta} {delta.unitat}
            </li>
          ))}</ul>
        </>
      )}
      <h4>Campanyes anuals del node</h4>
      {servei.files.length > 0 && <p>{servei.files.length} campanyes carregades per a esta fitxa.</p>}
      {['seed', 'local'].includes(servei.mode) && <p>Les campanyes d’este mode es conserven en la memòria de la instància.</p>}
      {servei.fase === 'carregant' && <p role="status">Carregant campanyes…</p>}
      {servei.fase === 'no-disponible' && <p>Este node té les revisions de patrimoni pendents d’activació.</p>}
      {servei.error && <p role="alert">{servei.error.message || 'Les campanyes no s’han pogut carregar.'}</p>}
      <FormulariCampanya key={servei.key} servei={servei} />
      {servei.mes && <Boto disabled={servei.fase === 'carregant-mes'} onClick={servei.anteriors}>Carrega campanyes anteriors</Boto>}
      <EinesDadesArbres arbres={[arbre]} font={font} revisionsPerArbre={{ [arbre.id]: servei.files }} />
    </div>
  );
}
