/**
 * BarraVolumsLocals.jsx — «Volums i carpetes locals» del Gestor d'arxius
 * locals (IDEA-54 · Onada 261029_1605): una pastilla d'1 clic per carpeta
 * recordada (i les d'esta sessió), «Vincular carpeta local», el bàner de
 * reconnexió d'1 clic i els avisos de permís denegat o carpeta desapareguda.
 *
 * Presentacional: els gestors (permís, selector, biblioteca) són de
 * GestorMultimediaLocal, que fa del permís la PRIMERA espera de cada clic.
 * Els noms dels volums, amb nomVisibleLocal (Gauntlet 261029, cicle 1).
 */
import { useId } from 'react';
import { FolderOpen, FolderPlus, RefreshCw, Unplug, X } from 'lucide-react';
import { Alerta, Boto, Insignia } from '../../components/PedraSeca/index.js';
import { nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, tradueix } from './textosGestorLocal.js';

export function BarraVolumsLocals({
  t,
  volums = [],
  volumActiu = null,
  estatVolum = 'cap',
  potTriar = true,
  potEscriure = false,
  ocupat = false,
  gestCaducat = false,
  contenidorRef = null,
  onVincula,
  onTria,
  onReconnecta,
  onOblida,
  onDesconnecta,
  onRelleig
}) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const id = useId();
  const idTitol = `${id}-titol`;
  const actiu = volums.find((v) => v.id === volumActiu) || null;
  const obert = estatVolum === 'obert' && Boolean(actiu);

  return (
    <section ref={contenidorRef} className="sdp-arxiu-local__panell" aria-labelledby={idTitol}>
      <h3 id={idTitol}>{tr(T.volums)}</h3>
      {volums.length > 0 ? (
        <div role="group" aria-labelledby={idTitol} className="sdp-arxiu-local__fila">
          {volums.map((v) => (
            <button
              key={v.id}
              type="button"
              className={v.id === volumActiu ? 'pill pill--primary' : 'pill'}
              aria-pressed={v.id === volumActiu ? 'true' : 'false'}
              disabled={ocupat}
              onClick={() => onTria?.(v)}
            >
              <FolderOpen size={18} aria-hidden="true" focusable="false" />
              <span>{nomVisibleLocal(v.nom)}</span>
              {v.efimer ? <span className="sdp-nomes-lector">{` · ${tr(T.sessio)}`}</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="sdp-arxiu-local__fila">
        <Boto varietat="primari" icona={FolderPlus} onClick={onVincula} disabled={ocupat} data-accio="vincula">
          {tr(T.vincula)}
        </Boto>
        {obert ? (
          <>
            <Boto icona={RefreshCw} onClick={onRelleig} disabled={ocupat}>{tr(T.relleig)}</Boto>
            <Boto icona={Unplug} onClick={onDesconnecta} disabled={ocupat}>{tr(T.desconnecta)}</Boto>
            <Boto icona={X} onClick={() => onOblida?.(actiu)} disabled={ocupat}>{tr(T.oblida)}</Boto>
          </>
        ) : null}
      </div>

      {obert && (actiu.efimer || !potEscriure) ? (
        <div className="sdp-arxiu-local__fila">
          {actiu.efimer ? <Insignia to="avis">{tr(T.sessio)}</Insignia> : null}
          {!potEscriure ? <Insignia to="info">{tr(T.nomesLectura)}</Insignia> : null}
        </div>
      ) : null}

      {estatVolum === 'cal-permis' && actiu ? (
        <Alerta
          to="info"
          viva={false}
          titol={tr(T.recordada, { nom: nomVisibleLocal(actiu.nom) })}
          accions={(
            <>
              <Boto varietat="primari" onClick={() => onReconnecta?.(actiu)}>{tr(T.reconnecta)}</Boto>
              <Boto onClick={() => onOblida?.(actiu)}>{tr(T.oblida)}</Boto>
            </>
          )}
        >
          <p>{tr(T.reconnectaAjuda)}</p>
          {gestCaducat ? <p>{tr(T.gestCaducat)}</p> : null}
        </Alerta>
      ) : null}

      {(estatVolum === 'denegat' || estatVolum === 'desaparegut') && actiu ? (
        <Alerta
          to="avis"
          accions={<Boto onClick={() => onOblida?.(actiu)}>{tr(T.oblida)}</Boto>}
        >
          {tr(estatVolum === 'denegat' ? T.denegat : T.desapareguda, { nom: nomVisibleLocal(actiu.nom) })}
        </Alerta>
      ) : null}

      {!potTriar ? <p className="sdp-arxiu-local__ajuda">{tr(T.senseSelector)}</p> : null}
      <p className="sdp-arxiu-local__ajuda">{tr(T.privadesa)}</p>
    </section>
  );
}
