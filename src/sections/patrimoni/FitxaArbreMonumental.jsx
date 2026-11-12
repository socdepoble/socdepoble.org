import { useId, useMemo, useState } from 'react';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { SquareBadge } from '../../components/PedraSeca/organismes/SquareBadge.jsx';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useNotes } from '../notes/NotesContext';
import { paramsDeLaNota } from '../notes/modeDesa.js';
import FitxaDadesDoctoralsArbre from './FitxaDadesDoctoralsArbre.jsx';
import {
  AUTORIA_RENTONAR,
  obteCoordenadesArbreSingular
} from '../../data/importacio/catalegArbresRentonarWp.js';
import { AUTOR_ESTUDI_ARBRES } from '../text/pageContent.dretsPatrimoni.js';
import {
  FONT_XYLELLA_CIPRERET_2024,
  LLICENCIA_CATALEG_ARBRES,
  ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE
} from '../../data/patrimoni/arbresMonumentals2020.js';
import {
  ESCALA_AFECTACIO_CIEF,
  INTERVALS_REVISIO_ANYS,
  INTERVAL_REVISIO_PER_DEFECTE,
  calculaDeltaLongitudinalArbre,
  construeixPlantillaNotaArbre,
  projectaFitxaCiefV232,
  revisionsDeLArbre
} from '../../data/patrimoni/revisionsArbresCief.js';

const PESTANYES_FITXA = Object.freeze([
  { id: 'viva', emoji: '📸', etiqueta: 'Fitxa viva i comparador 2007 ↔ 2020' },
  { id: 'revisions', emoji: '📅', etiqueta: 'Revisions periòdiques i evolució (Δ)' },
  { id: 'cief', emoji: '📋', etiqueta: 'Fitxa Oficial CIEF v232 (24 camps)' },
  { id: 'doctorat', emoji: '🔬', etiqueta: 'Dades, campanyes i intercanvi' },
  { id: 'ordenanca', emoji: '⚖️', etiqueta: 'Ordenança Municipal (07/09/2007)' }
]);

const ETIQUETA_ESTAT_CALENDARI = Object.freeze({
  AL_DIA: 'Al dia segons interval actiu',
  PROPERA: 'Revisió pròxima (≤ 1 any)',
  VENCUDA: 'Revisió periòdica pendent',
  ALERTA_FITOSANITARIA: 'Avís fitosanitari documentat. Actualització de camp pendent'
});

/* Arbitratge R17.3 (P1) · Un camp descriptiu sense cita de pàgina del PDF queda a null: es diu, no s'inventa. */
const SENSE_DADA_VERIFICADA = 'sense dada verificada';

function cotaVisible(valor, sufix = '') {
  if (valor === null || valor === undefined || valor === '') {
    return 'Pendent («?»)';
  }
  return `${valor}${sufix}`;
}

export default function FitxaArbreMonumental(props) {
  if (!props.arbre) return null;
  const idFont = props.fontDoctoral?.id;
  if (idFont && idFont !== 'la-torre-de-les-macanes-2007-2020') {
    return (
      <div className="sdp-arbre-fitxa">
        {!props.amagaTitol && <h3>{`#${props.arbre.ordre} · ${props.arbre.nom}`}</h3>}
        {props.onTanca && <Boto onClick={props.onTanca}>{props.etiquetaTornada || '← Tancar fitxa'}</Boto>}
        <FitxaDadesDoctoralsArbre arbre={props.arbre} font={props.fontDoctoral} />
      </div>
    );
  }
  return <FitxaArbreArxiuLaTorre {...props} />;
}

function FitxaArbreArxiuLaTorre({
  arbre,
  fontDoctoral,
  onTanca = null,
  etiquetaTornada = '← Tancar fitxa',
  amagaTitol = false,
  intervalInicial = INTERVAL_REVISIO_PER_DEFECTE
}) {
  const baseId = useId();
  const navigate = useNavigate();
  const notesCtx = useNotes();
  const [pestanya, setPestanya] = useState('viva');
  const [intervalAnys, setIntervalAnys] = useState(() => (
    INTERVALS_REVISIO_ANYS.includes(Number(intervalInicial))
      ? Number(intervalInicial)
      : INTERVAL_REVISIO_PER_DEFECTE
  ));
  const [creantNota, setCreantNota] = useState(false);

  const revisions = useMemo(() => revisionsDeLArbre(arbre), [arbre]);
  const [idRevisioCief, setIdRevisioCief] = useState(() => (
    revisions[revisions.length - 1]?.idRevisio || ''
  ));

  const delta = useMemo(
    () => calculaDeltaLongitudinalArbre(arbre, intervalAnys, 2026),
    [arbre, intervalAnys]
  );

  const revisioCiefActiva = useMemo(
    () => revisions.find((r) => r.idRevisio === idRevisioCief) || revisions[revisions.length - 1] || null,
    [revisions, idRevisioCief]
  );

  const campsCief = useMemo(
    () => projectaFitxaCiefV232(arbre, revisioCiefActiva),
    [arbre, revisioCiefActiva]
  );

  if (!arbre) return null;

  const obriPlantillaAlBloc = async () => {
    if (creantNota) return;
    const plantilla = construeixPlantillaNotaArbre(arbre, intervalAnys);
    const potCrearDirectament = typeof notesCtx?.creaNota === 'function'
      && notesCtx.canCreate !== false
      && !notesCtx.nomesLectura;

    if (potCrearDirectament) {
      setCreantNota(true);
      try {
        const creada = await notesCtx.creaNota(plantilla);
        const idNota = creada?.id ? String(creada.id) : null;
        const params = paramsDeLaNota({ carpeta: 'f-pobles', nota: idNota });
        navigate(`/notes?${params.toString()}`);
        return;
      } catch {
        // Si la creació directa falla, caiem netament al Snippet Curador per URL.
      } finally {
        setCreantNota(false);
      }
    }

    const paramsFallback = new URLSearchParams({
      mode: 'desa',
      url: arbre.enllacOriginal2007,
      titol: plantilla.title,
      subtitol: plantilla.subtitle,
      entradilla: plantilla.lead,
      carpeta: 'f-pobles',
      emoticona: '🌳'
    });
    navigate(`/notes?${paramsFallback.toString()}`);
  };

  const dims = arbre.dimensions2007;
  const teAlertaXylella = arbre.id === 'arbre-02-alborc-del-xipreret';
  const coordsWgs84 = obteCoordenadesArbreSingular(arbre);

  return (
    <div className="sdp-arbre-fitxa">
      <div className="sdp-herbari-fitxa__capcalera">
        <div>
          {!amagaTitol && <h3 lang="ca">{`#${arbre.ordre} · ${arbre.nom}`}</h3>}
          <p>
            <em lang="la">{arbre.especieCientifica}</em>
            {` (${arbre.nomComu}) · Categoria: `}
            <strong>{arbre.categoria}</strong>
            {arbre.monumental ? ' · Protecció genèrica Llei 4/2006 (Art. 4)' : ' · Protecció municipal (Ple 07/09/2007)'}
          </p>
          <p className="sdp-muted">
            Autoria i custòdia: <strong>{AUTORIA_RENTONAR}</strong> · Estudi tècnic i catalogació base:{' '}
            <strong>{AUTOR_ESTUDI_ARBRES}</strong>
          </p>
        </div>
        <div className="sdp-arbre-fitxa__accions">
          {coordsWgs84 ? (
            <SquareBadge
              badge={{
                type: 'geo',
                lat: coordsWgs84.lat,
                lng: coordsWgs84.lng,
                zoom: 18,
                id: arbre.id,
                nom: arbre.nom
              }}
            />
          ) : null}
          <Boto
            varietat="primari"
            onClick={obriPlantillaAlBloc}
            disabled={creantNota}
          >
            {creantNota ? 'Obrint plantilla…' : '+ Crear fitxa d’arbre al Bloc de Notes'}
          </Boto>
          {typeof onTanca === 'function' ? (
            <Boto varietat="secundari" onClick={onTanca}>
              {etiquetaTornada}
            </Boto>
          ) : null}
        </div>
      </div>

      {/* Arbitratge R17.3 (P1) · Només el que diu la crònica, amb la seua font, i l'avís a Sanitat Vegetal: cap norma
          ni tractament que la font no diga. */}
      {teAlertaXylella ? (
        <Alerta to="avis" viva={false} titol="Avís fitosanitari documentat (22/09/2024 · Xylella fastidiosa)">
          El Rentonar va comunicar el 22 de setembre de 2024 que este exemplar s’ha contagiat de{' '}
          <em lang="la">Xylella fastidiosa</em>, igual que diversos arbres del voltant, que s’estan eliminant. Font:{' '}
          <a href={FONT_XYLELLA_CIPRERET_2024}>crònica d’El Rentonar</a>. La fitxa conserva la data de la notícia.
          L’avaluació actual queda pendent de campanya. Si observes símptomes en altres plantes, avisa el
          Servei de Sanitat Vegetal de la Generalitat.
        </Alerta>
      ) : null}

      {arbre.utmEtrs89?.notaEdicio2020 ? (
        <Alerta to="info" viva={false} titol="Esmena cartogràfica verificada (2007 vs. 2020)">
          {arbre.utmEtrs89.notaEdicio2020}
        </Alerta>
      ) : null}

      <div className="sdp-arbre-cotes" role="group" aria-label="Cotes dendromètriques i estat longitudinal">
        <div className="sdp-arbre-cota">
          <span className="sdp-arbre-cota__etiqueta">Alçària total (2007)</span>
          <span className="sdp-arbre-cota__valor">{cotaVisible(dims.alcadaM, ' m')}</span>
        </div>
        <div className="sdp-arbre-cota">
          <span className="sdp-arbre-cota__etiqueta">Capçada major (2007)</span>
          <span className="sdp-arbre-cota__valor">{cotaVisible(dims.diametreCapcadaM, ' m')}</span>
        </div>
        <div className="sdp-arbre-cota">
          <span className="sdp-arbre-cota__etiqueta">Perímetre a 1,30 m</span>
          <span className="sdp-arbre-cota__valor">{cotaVisible(dims.perimetreNormalCm, ' cm')}</span>
        </div>
        <div className="sdp-arbre-cota">
          <span className="sdp-arbre-cota__etiqueta">UTM ETRS89 (Fus 30)</span>
          <span className="sdp-arbre-cota__valor">{`${arbre.utmEtrs89.x} / ${arbre.utmEtrs89.y}`}</span>
        </div>
        <div className="sdp-arbre-cota">
          <span className="sdp-arbre-cota__etiqueta">Altitud i edat</span>
          <span className="sdp-arbre-cota__valor">{`${cotaVisible(arbre.utmEtrs89.altitudM, ' m')} · ${dims.edatEstimada}`}</span>
        </div>
        <div className="sdp-arbre-cota">
          <span className="sdp-arbre-cota__etiqueta">{`Pròxima revisió (${intervalAnys}a)`}</span>
          <span className="sdp-arbre-cota__valor">{`${delta.anyProximaRevisio} (${delta.nivellActual || 'Pendent de campanya'})`}</span>
        </div>
      </div>

      <div
        className="sdp-arbre-fitxa__pestanyes"
        role="tablist"
        aria-label="Seccions de la fitxa d’arbre singular"
      >
        {PESTANYES_FITXA.map((item) => {
          const activa = pestanya === item.id;
          return (
            <button
              key={item.id}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={activa}
              aria-controls={`${baseId}-panel-${item.id}`}
              className="sdp-workspace-llibres__tab"
              onClick={() => setPestanya(item.id)}
            >
              <span className="sdp-fitxa-emoji-xl" aria-hidden="true">{item.emoji}</span>
              <span>{item.etiqueta}</span>
            </button>
          );
        })}
      </div>

      {pestanya === 'viva' ? (
        <section
          id={`${baseId}-panel-viva`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-viva`}
          className="sdp-arbre-revisions"
        >
          <h4>Comparador visual i cartogràfic (2007 ↔ 2020)</h4>
          <div className="sdp-arbre-comparador">
            <figure className="sdp-arbre-comparador__marc">
              <img
                src={arbre.fotos.foto2007}
                alt={`${arbre.nom} — catalogació base 19/05/2007`}
                className="sdp-arbre-comparador__imatge"
                loading="lazy"
              />
              <figcaption className="sdp-arbre-comparador__peu">
                <strong> maig 2007 · Catalogació base:</strong> {arbre.nom} ({AUTOR_ESTUDI_ARBRES} · Associació El Rentonar).
              </figcaption>
            </figure>

            {arbre.fotos.foto2020 ? (
              <figure className="sdp-arbre-comparador__marc">
                <img
                  src={arbre.fotos.foto2020}
                  alt={`${arbre.nom} — seguiment de camp ${arbre.fotos.dataFoto2020}`}
                  className="sdp-arbre-comparador__imatge"
                  loading="lazy"
                />
                <figcaption className="sdp-arbre-comparador__peu">
                  <strong>{`${arbre.fotos.dataFoto2020} · Seguiment 2020:`}</strong> comparativa visual directa tretze anys després de la protecció plenària.
                </figcaption>
              </figure>
            ) : (
              <figure className="sdp-arbre-comparador__marc">
                <img
                  src={arbre.fotos.fotoDetall2007}
                  alt={`Detall estructural de soca i brancatge de ${arbre.nom} (2007)`}
                  className="sdp-arbre-comparador__imatge"
                  loading="lazy"
                />
                <figcaption className="sdp-arbre-comparador__peu">
                  <strong>Detall dendromètric 2007:</strong> sense nova fotografia datada el 2020 a l’arxiu; pendent de captura comparativa en la pròxima campanya CIEF.
                </figcaption>
              </figure>
            )}

            {arbre.fotos.mapa ? (
              <figure className="sdp-arbre-comparador__marc">
                <img
                  src={arbre.fotos.mapa}
                  alt={`Mapa topogràfic de localització de ${arbre.nom}`}
                  className="sdp-arbre-comparador__imatge"
                  loading="lazy"
                />
                <figcaption className="sdp-arbre-comparador__peu">
                  <strong>Plànol topogràfic UTM ETRS89:</strong> {`X ${arbre.utmEtrs89.x} · Y ${arbre.utmEtrs89.y} · ${arbre.paratge}`}.
                </figcaption>
              </figure>
            ) : <p>Mapa pendent d’acreditar.</p>}
          </div>

          <h4>Descripció morfològica, ecologia i patrimoni cultural</h4>
          <dl>
            <dt>Descripció de l’exemplar / conjunt</dt>
            <dd>{arbre.descripcio}</dd>
            {dims.notaDendrometrica ? (
              <>
                <dt>Precisió dendromètrica</dt>
                <dd>{dims.notaDendrometrica}</dd>
              </>
            ) : null}
            <dt>Valor cultural, històric i paisatgístic</dt>
            <dd>{arbre.valorCulturalHistoric}</dd>
            <dt>Accés i titularitat</dt>
            <dd>{`${arbre.acces} (${arbre.titularitatCief} · Accés lliure: ${arbre.accesLliure ? 'Sí' : 'No'}).`}</dd>
            <dt>Ecologia, sòl i pendent</dt>
            <dd>{`Orientació: ${arbre.orientacio} · Pendent: ${arbre.pendent} · Sòl: ${arbre.sol ?? 'Pendent de campanya'} · Comunitat vegetal: ${arbre.comunitatVegetal ?? 'Pendent de campanya'}`}</dd>
            <dt>Observacions del catàleg</dt>
            <dd>{arbre.observacions}</dd>
          </dl>
        </section>
      ) : null}

      {pestanya === 'revisions' ? (
        <section
          id={`${baseId}-panel-revisions`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-revisions`}
          className="sdp-arbre-revisions"
        >
          <h4>Calendari configurable de revisions periòdiques de salut (5 · 10 · 15 · 25 anys)</h4>
          <p>
            Selecciona la cadència tècnica d’inspecció per calcular la pròxima revisió programada i l’evolució longitudinal (Δ) des de la línia base del 19 de maig de 2007:
          </p>
          <div className="sdp-arbre-revisions__intervals" role="group" aria-label="Interval de revisió periòdica en anys">
            {INTERVALS_REVISIO_ANYS.map((anys) => (
              <Boto
                key={anys}
                varietat={intervalAnys === anys ? 'primari' : 'secundari'}
                aria-pressed={intervalAnys === anys}
                onClick={() => setIntervalAnys(anys)}
              >
                {`Cada ${anys} anys`}
              </Boto>
            ))}
          </div>

          <div className="sdp-arbre-delta">
            <div className="sdp-arbre-delta__item">
              <strong>Horitzó temporal acumulat (2007 → 2026)</strong>
              <span>{`${delta.anysTranscorregutsBase} anys de custòdia catalogada (${delta.fitesAnys.join(' → ')})`}</span>
            </div>
            <div className="sdp-arbre-delta__item">
              <strong>Estat del cicle de revisió</strong>
              <span>{`${ETIQUETA_ESTAT_CALENDARI[delta.estatCalendari]} · Última fita: ${delta.anyUltimaRevisio} · Pròxima fita (${intervalAnys}a): ${delta.anyProximaRevisio}`}</span>
            </div>
            <div className="sdp-arbre-delta__item">
              <strong>Evolució d’afectació CIEF (Δ)</strong>
              <span>{delta.tendeciaText}</span>
            </div>
          </div>

          <h4>Historial longitudinal d’inspeccions documentades</h4>
          <ol>
            {revisions.map((rev) => (
              <li key={rev.idRevisio}>
                <p>
                  <strong>{`${rev.data} · ${rev.tipus}`}</strong>
                  {` — Observador: ${rev.observador}`}
                </p>
                <p>
                  {`Escala CIEF (${ESCALA_AFECTACIO_CIEF.join(' | ')}): Vitalitat `}
                  <strong>{rev.afectacio?.vitalitat || 'Pendent'}</strong>
                  {' · Sanitat '}
                  <strong>{rev.afectacio?.sanitat || 'Pendent'}</strong>
                  {' · Estructura '}
                  <strong>{rev.afectacio?.estructura || 'Pendent'}</strong>
                </p>
                <p>{rev.resum}</p>
                <p>
                  <strong>Amenaces:</strong> {rev.amenaces ?? SENSE_DADA_VERIFICADA} · <strong>Mesures:</strong> {rev.mesures ?? SENSE_DADA_VERIFICADA}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {pestanya === 'cief' ? (
        <section
          id={`${baseId}-panel-cief`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-cief`}
          className="sdp-arbre-cief"
        >
          <h4>Fitxa d’Inventari i Inspecció d’Arbres Monumentals (CIEF · Versió 232)</h4>
          <p>
            Projecció estructurada dels 24 camps de la fitxa d’inventari i inspecció del CIEF (versió 232), amb la Llei 4/2006 de Patrimoni Arbori Monumental de la Comunitat Valenciana com a marc (* camps obligatoris d’inspecció):
          </p>
          {revisions.length > 1 ? (
            <div className="sdp-arbre-revisions__intervals" role="group" aria-label="Fita temporal projectada a la fitxa CIEF">
              {revisions.map((rev) => (
                <Boto
                  key={rev.idRevisio}
                  varietat={revisioCiefActiva?.idRevisio === rev.idRevisio ? 'primari' : 'secundari'}
                  aria-pressed={revisioCiefActiva?.idRevisio === rev.idRevisio}
                  onClick={() => setIdRevisioCief(rev.idRevisio)}
                >
                  {`Fita ${rev.any} (${rev.data})`}
                </Boto>
              ))}
            </div>
          ) : null}
          <dl>
            {campsCief.map((camp) => (
              <div key={camp.numero}>
                <dt><strong>{camp.titol}</strong></dt>
                <dd>{camp.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {pestanya === 'doctorat' ? (
        <section id={`${baseId}-panel-doctorat`} role="tabpanel" aria-labelledby={`${baseId}-tab-doctorat`}>
          <FitxaDadesDoctoralsArbre arbre={arbre} font={fontDoctoral} />
        </section>
      ) : null}

      {pestanya === 'ordenanca' ? (
        <section
          id={`${baseId}-panel-ordenanca`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-ordenanca`}
          className="sdp-arbre-ordenanca"
        >
          <h4>{ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.titol}</h4>
          <p>
            <strong>Acord Plenari d’inclusió:</strong> Ple de l’Ajuntament de La Torre de les Maçanes del{' '}
            <strong>07/09/2007</strong> (comunicació d’Alcaldia amb Registre d’Eixida núm.{' '}
            <strong>{ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.acordPlenariInclusio.registreEixida}</strong> del 13/09/2007, aprovat per{' '}
            {ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.acordPlenariInclusio.votacio.toLowerCase()}).
          </p>
          <p>{ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.acordPlenariInclusio.resumAcord}</p>
          {ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.capitols.length ? (
            <dl>
              {ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.capitols.map((capitol) => (
                <div key={capitol.id}>
                  <dt><strong>{capitol.titol}</strong></dt>
                  <dd>{capitol.resum}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="sdp-muted">{`${ORDENANCA_MUNICIPAL_ARBRES_LA_TORRE.notaFont}.`}</p>
          )}
          <p>
            <strong>Atribució i llicència documental:</strong> {LLICENCIA_CATALEG_ARBRES}.
          </p>
        </section>
      ) : null}
    </div>
  );
}
