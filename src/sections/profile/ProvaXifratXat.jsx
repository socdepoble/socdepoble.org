/** FEDI-07 · Laboratori opt-in: primitives reals, identitats de mostra i
 * estat efímer. No importa el servei del backend ni canvia la bandera E2EE. */
import { useEffect, useRef, useState } from 'react';
import { Alerta, Boto, Camp, CampText } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../config/moderacio.js';
import { creaProvaXifratXat } from '../../data/xifratXatLaboratori.js';
import { BlocPerfil } from './BlocPerfil.jsx';
import CosPersonesConfianca from './CosPersonesConfianca.jsx';

const text = (clau, reserva) => Object.freeze([`section.perfil.privacitat.provaXifrat.${clau}`, reserva]);
export const TEXTOS_PROVA_XIFRAT = Object.freeze({
  titol: text('titol', 'Prova local de xifratge'),
  explica: text('explica', 'Este laboratori crea quatre identitats de mostra en este navegador i prova el protocol sdp-xat-v1 amb claus noves. Tot s’oblida en tancar la prova.'),
  limit: text('limit', 'Els contactes i els missatges són de mostra. La prova no envia res a ningú, no activa el xifratge dels xats i no recupera converses reals.'),
  inicia: text('inicia', 'Inicia la prova local'),
  tanca: text('tanca', 'Tanca i oblida la mostra'),
  comparacio: text('comparacio', 'Compara els dos codis de cada contacte de mostra i confirma la coincidència. En una verificació real es compararien per veu o en persona, en aparells diferents.'),
  contacte: text('contacte', 'Contacte de mostra {n}'),
  codis: text('codis', 'Este aparell: {propi} · Contacte: {contacte}'),
  missatge: text('missatge', 'Text de la mostra'),
  textInicial: text('textInicial', 'Missatge de prova local'),
  xifra: text('xifra', 'Xifra i obri la mostra'),
  rota: text('rota', 'Prova la rotació d’una clau'),
  xifrat: text('xifrat', 'Fragment del text xifrat'),
  obert: text('obert', 'Text obert localment'),
  controls: text('controls', 'El text alterat i la repetició del missatge han sigut rebutjats pel protocol.'),
  rotacio: text('rotacio', 'La continuïtat de la clau nova s’ha verificat i el retorn a la clau antiga ha sigut rebutjat.'),
  error: text('error', 'La prova no s’ha pogut completar. Tanca-la i torna a començar en un navegador amb WebCrypto disponible.'),
  mostraRecompte: text('mostraRecompte', 'Codis SAS de mostra confirmats: {n} de 3.'),
  mostraDisputa: text('mostraDisputa', 'La prova local s’ha aturat per una disputa entre les identitats de mostra.'),
  mostraAccioDisputa: text('mostraAccioDisputa', 'Aturar la mostra per disputa'),
  mostraLlista: text('mostraLlista', 'Codis SAS dels contactes de mostra'),
  mostraPendent: text('mostraPendent', 'Compara els dos codis del contacte de mostra abans de confirmar la coincidència.'),
  mostraVerificat: text('mostraVerificat', 'Els dos codis de mostra coincidixen; la comprovació només val per a esta prova local.'),
  mostraDetallDisputa: text('mostraDetallDisputa', 'La comprovació d’esta mostra s’ha aturat.')
});

const TEXTOS_COS_MOSTRA = Object.freeze({
  recompte: TEXTOS_PROVA_XIFRAT.mostraRecompte,
  alertaDisputa: TEXTOS_PROVA_XIFRAT.mostraDisputa,
  accioDisputa: TEXTOS_PROVA_XIFRAT.mostraAccioDisputa,
  llista: TEXTOS_PROVA_XIFRAT.mostraLlista,
  detall: Object.freeze({ pendent: TEXTOS_PROVA_XIFRAT.mostraPendent, verificat_sas: TEXTOS_PROVA_XIFRAT.mostraVerificat, disputa: TEXTOS_PROVA_XIFRAT.mostraDetallDisputa })
});

export default function ProvaXifratXat({ cripto } = {}) {
  const t = useTraductorOpcional();
  const tr = (parell, valors = {}) => omple(tradueix(t, parell), valors);
  const sessio = useRef(null);
  const generacio = useRef(0);
  const muntat = useRef(false);
  const [foto, setFoto] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const [error, setError] = useState(false);
  const [disputa, setDisputa] = useState(false);
  const [missatge, setMissatge] = useState(() => tr(TEXTOS_PROVA_XIFRAT.textInicial));
  const [resultat, setResultat] = useState(null);
  const [rotacio, setRotacio] = useState(false);
  useEffect(() => {
    muntat.current = true;
    return () => { muntat.current = false; generacio.current += 1; sessio.current?.tanca(); sessio.current = null; };
  }, []);
  const tanca = () => {
    generacio.current += 1;
    sessio.current?.tanca(); sessio.current = null;
    setFoto(null); setResultat(null); setRotacio(false); setDisputa(false); setError(false); setOcupat(false);
    setMissatge(tr(TEXTOS_PROVA_XIFRAT.textInicial));
  };
  const inicia = async () => {
    tanca();
    const torn = generacio.current;
    setOcupat(true);
    try {
      const nova = await creaProvaXifratXat({ cripto });
      if (!muntat.current || torn !== generacio.current) { nova.tanca(); return; }
      sessio.current = nova;
      setFoto(nova.fotografia());
    } catch { if (muntat.current && torn === generacio.current) setError(true); }
    finally { if (muntat.current && torn === generacio.current) setOcupat(false); }
  };
  const executa = async (operacio, mostra) => {
    const torn = generacio.current;
    setOcupat(true); setError(false);
    try {
      const valor = await operacio();
      if (muntat.current && torn === generacio.current) mostra(valor);
    } catch { if (muntat.current && torn === generacio.current) setError(true); }
    finally { if (muntat.current && torn === generacio.current) setOcupat(false); }
  };
  const ranures = foto?.ranures.map((r, index) => ({
    id: r.id, nom: tr(TEXTOS_PROVA_XIFRAT.contacte, { n: String(index + 1) }),
    sas: tr(TEXTOS_PROVA_XIFRAT.codis, r), estat: disputa ? (index === 0 ? 'disputa' : 'pendent') : r.estat,
    desactivat: ocupat || r.estat === 'verificat_sas',
    onAccio: () => { try { setFoto(sessio.current.confirmaSas(index, r.contacte)); } catch { setError(true); } }
  }));
  return (
    <BlocPerfil titol={tr(TEXTOS_PROVA_XIFRAT.titol)}>
      <p className="perfil-compte__text">{tr(TEXTOS_PROVA_XIFRAT.explica)}</p>
      <p className="perfil-compte__text">{tr(TEXTOS_PROVA_XIFRAT.limit)}</p>
      {error ? <Alerta to="error">{tr(TEXTOS_PROVA_XIFRAT.error)}</Alerta> : null}
      <div className="sdp-alerta__accions perfil-compte__accions">
        {!foto ? <Boto mida="gran" carregant={ocupat} onClick={inicia}>{tr(TEXTOS_PROVA_XIFRAT.inicia)}</Boto> : null}
        {foto ? <Boto mida="gran" varietat="secundari" onClick={tanca}>{tr(TEXTOS_PROVA_XIFRAT.tanca)}</Boto> : null}
      </div>
      {foto ? <>
        <p className="perfil-compte__text">{tr(TEXTOS_PROVA_XIFRAT.comparacio)}</p>
        <CosPersonesConfianca textosMostra={TEXTOS_COS_MOSTRA} verificats={disputa ? 0 : foto.verificats} ranures={ranures} onDisputa={() => { sessio.current.declaraDisputa(); setDisputa(true); setResultat(null); setRotacio(false); }} />
        <Camp etiqueta={tr(TEXTOS_PROVA_XIFRAT.missatge)}>
          <CampText value={missatge} maxLength={4096} disabled={ocupat || disputa} onChange={(e) => setMissatge(e.target.value)} />
        </Camp>
        <div className="sdp-alerta__accions perfil-compte__accions">
          <Boto mida="gran" disabled={ocupat || disputa || foto.verificats !== 3 || !missatge.trim()} onClick={() => executa(() => sessio.current.provaMissatge(missatge), setResultat)}>{tr(TEXTOS_PROVA_XIFRAT.xifra)}</Boto>
          <Boto mida="gran" varietat="secundari" disabled={ocupat || disputa} onClick={() => executa(() => sessio.current.provaRotacio(), (v) => setRotacio(v.continuitat && v.retornAnticRebutjat))}>{tr(TEXTOS_PROVA_XIFRAT.rota)}</Boto>
        </div>
        {resultat ? <div role="status">
          <p className="perfil-compte__text"><strong>{tr(TEXTOS_PROVA_XIFRAT.xifrat)}: </strong><code>{resultat.xifrat.slice(0, 32)}…</code></p>
          <p className="perfil-compte__text"><strong>{tr(TEXTOS_PROVA_XIFRAT.obert)}: </strong>{resultat.obert}</p>
          <p className="perfil-compte__text">{tr(TEXTOS_PROVA_XIFRAT.controls)}</p>
        </div> : null}
        {rotacio ? <p className="perfil-compte__text" role="status">{tr(TEXTOS_PROVA_XIFRAT.rotacio)}</p> : null}
      </> : null}
    </BlocPerfil>
  );
}
