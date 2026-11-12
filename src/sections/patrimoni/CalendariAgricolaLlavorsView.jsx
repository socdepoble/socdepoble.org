import { useMemo, useState } from 'react';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import {
  FONTS_BANC_LLAVORS,
  entradesDelCataleg
} from '../../data/patrimoni/bancLlavors.js';
import {
  FASES_CALENDARI,
  NOMS_MESOS_CA,
  barra12MesosDe,
  binomiDe
} from './fitxaDidactica.js';

const GRUPS_CULTIU = Object.freeze([
  { id: 'tots', etiqueta: '🌾 Tots els cultius amb calendari' },
  { id: 'tomaques', etiqueta: '🍅 Tomaques tradicionals' },
  { id: 'fruit-estiu', etiqueta: '🍆 Solanàcies, cucurbitàcies i fruit' },
  { id: 'horta-fulla-bulb', etiqueta: '🥬 Fulles, bulbs, arrels i llegums' }
]);

const ETIQUETA_FASE = Object.freeze({
  sembra: '🌱 Sembra / Sembra directa',
  plantacio: '🌿 Trasplantament',
  collita: '🧺 Recol·lecció',
  maduracioLlavors: '🌾 Maduració llavors'
});

const BINOMIS_TOMACA = new Set(['solanum lycopersicum', 'lycopersicon esculentum']);
const BINOMIS_FRUIT_ESTIU = new Set([
  'solanum melongena',
  'capsicum annuum',
  'cucumis melo',
  'citrullus lanatus',
  'cucurbita moschata',
  'cucurbita maxima',
  'cucurbita pepo',
  'arachis hypogaea'
]);

function grupDeVarietat(entrada) {
  const binomi = binomiDe(entrada?.nomCientific);
  if (BINOMIS_TOMACA.has(binomi)) return 'tomaques';
  if (BINOMIS_FRUIT_ESTIU.has(binomi)) return 'fruit-estiu';
  return 'horta-fulla-bulb';
}

export default function CalendariAgricolaLlavorsView({ onObrirVarietat = null }) {
  const [grupActiu, setGrupActiu] = useState('tots');
  const [faseActiva, setFaseActiva] = useState('totes');
  const [mesActiu, setMesActiu] = useState(0);

  const fontValenciana = FONTS_BANC_LLAVORS[0];
  const varietatsAmbCalendari = useMemo(() => {
    const entrades = entradesDelCataleg('cataleg-valencia');
    return entrades
      .map((entrada) => {
        const calendari = entrada?.dada?.calendari ?? entrada?.calendari ?? null;
        return {
          entrada,
          calendari,
          grup: grupDeVarietat(entrada),
          barra: barra12MesosDe(calendari)
        };
      })
      .filter(({ barra }) => barra.some((m) => m.actiu));
  }, []);

  const filtrades = useMemo(() => varietatsAmbCalendari.filter(({ grup, barra }) => {
    if (grupActiu !== 'tots' && grup !== grupActiu) return false;
    if (mesActiu >= 1 && mesActiu <= 12) {
      const celMes = barra[mesActiu - 1];
      if (!celMes?.actiu) return false;
      if (faseActiva !== 'totes' && !celMes.fases.includes(faseActiva)) return false;
      return true;
    }
    if (faseActiva !== 'totes') {
      return barra.some((m) => m.fases.includes(faseActiva));
    }
    return true;
  }), [varietatsAmbCalendari, grupActiu, faseActiva, mesActiu]);

  return (
    <section
      className="sdp-calendari-agricola"
      aria-label="Calendari agrícola anual de varietats tradicionals i tomaques"
    >
      <div>
        <h3>Calendari agrícola de cultius i tomaques tradicionals</h3>
        <p>
          Planificació mensual extreta literalment dels gràfics vectorials de 12 mesos del{' '}
          <strong>{fontValenciana?.titol}</strong> ({varietatsAmbCalendari.length} varietats amb cicle verificat: sembra, trasplantament, recol·lecció i maduració de llavors).
        </p>
      </div>

      <Alerta to="info" viva={false} titol="Traçabilitat agronòmica sense invenció">
        Només s’hi mostren els mesos documentats oficialment al Catàleg valencià de varietats tradicionals d’interés agrari. Les entrades d’AVL Mallorca i de l’Atles català no inclouen diagrama mensual a la font i es consulten al llibre principal del catàleg.
      </Alerta>

      <div className="sdp-calendari-agricola__filtres" role="group" aria-label="Filtre per família de cultiu">
        {GRUPS_CULTIU.map((grup) => (
          <Boto
            key={grup.id}
            varietat={grupActiu === grup.id ? 'primari' : 'secundari'}
            aria-pressed={grupActiu === grup.id}
            onClick={() => setGrupActiu(grup.id)}
          >
            {grup.etiqueta}
          </Boto>
        ))}
      </div>

      <div className="sdp-calendari-agricola__filtres" role="group" aria-label="Filtre per fase agronòmica">
        <Boto
          varietat={faseActiva === 'totes' ? 'primari' : 'secundari'}
          aria-pressed={faseActiva === 'totes'}
          onClick={() => setFaseActiva('totes')}
        >
          Totes les fases
        </Boto>
        {FASES_CALENDARI.map((fase) => (
          <Boto
            key={fase.id}
            varietat={faseActiva === fase.id ? 'primari' : 'secundari'}
            aria-pressed={faseActiva === fase.id}
            onClick={() => setFaseActiva(fase.id)}
          >
            {ETIQUETA_FASE[fase.id]}
          </Boto>
        ))}
      </div>

      <div className="sdp-calendari-agricola__mesos" role="group" aria-label="Filtre per mes de l’any">
        <Boto
          varietat={mesActiu === 0 ? 'primari' : 'secundari'}
          aria-pressed={mesActiu === 0}
          onClick={() => setMesActiu(0)}
        >
          Tot l’any (12 mesos)
        </Boto>
        {NOMS_MESOS_CA.map((nomMes, idx) => {
          const numeroMes = idx + 1;
          return (
            <Boto
              key={nomMes}
              varietat={mesActiu === numeroMes ? 'primari' : 'secundari'}
              aria-pressed={mesActiu === numeroMes}
              onClick={() => setMesActiu(numeroMes)}
            >
              {nomMes}
            </Boto>
          );
        })}
      </div>

      <p role="status">
        <strong>{`${filtrades.length} de ${varietatsAmbCalendari.length}`}</strong>
        {' varietats tradicionals actives amb els filtres seleccionats.'}
      </p>

      {filtrades.length === 0 ? (
        <p>Cap varietat tradicional té activitat registrada amb esta combinació de mes i fase.</p>
      ) : (
        <div className="sdp-calendari-agricola__llista">
          {filtrades.map(({ entrada, calendari, barra }) => {
            const mesosResum = FASES_CALENDARI.map((fase) => {
              const mesosFase = barra
                .filter((m) => m.fases.includes(fase.id))
                .map((m) => m.nomMes);
              if (!mesosFase.length) return null;
              const nomFase = fase.id === 'sembra' && calendari?.sembraDirecta
                ? '🌱 Sembra directa'
                : ETIQUETA_FASE[fase.id];
              return { id: fase.id, nomFase, text: mesosFase.join(', ') };
            }).filter(Boolean);

            return (
              <article key={entrada.id} className="sdp-calendari-agricola__item" aria-label={entrada.nom}>
                <div className="sdp-calendari-agricola__cap">
                  <div>
                    <h4 lang="ca">{entrada.nom}</h4>
                    <p>
                      <em lang="la">{entrada.nomCientific}</em>
                      {` · Pàgina ${entrada.pagina} del PDF`}
                    </p>
                  </div>
                  {typeof onObrirVarietat === 'function' ? (
                    <Boto varietat="secundari" onClick={() => onObrirVarietat(entrada.id)}>
                      Obrir fitxa de varietat
                    </Boto>
                  ) : null}
                </div>
                <ul>
                  {mesosResum.map((linia) => (
                    <li key={linia.id}>
                      <strong>{`${linia.nomFase}:`}</strong> {linia.text}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
