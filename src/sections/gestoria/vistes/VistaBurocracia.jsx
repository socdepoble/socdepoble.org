/**
 * VistaBurocracia.jsx — Pantalla operativa de Burocràcia de la Gestoria de Poble
 * (Onada v1.2.25 · Lot G2 / G9).
 *
 * Connecta els motors purs existents:
 *   · obligacions.js (`calendariObligacions`)
 *   · avisos.js (`avisosDe`)
 *   · icsTerminis.js (`icsDeTerminis`, privat i sense noms ni imports)
 *   · documents/plaNeteja.js (`dataMinimaEsborrat`, `PAPERERA`) i `catalegTipus.js`
 *
 * Viu fora de `burocracia/` (a `vistes/`) per preservar 100 % la frontera dels models purs.
 * 100 % local, zero xarxa, zero emmagatzematge directe, 5 llengües (`ca/es/en/eu/gl`).
 */
import { useMemo, useState } from 'react';
import { Calendar, Download, ShieldAlert } from 'lucide-react';
import {
  Accions, Alerta, Boto, Camp, CampText, GrupCamps, Insignia, Pila, Selector, Taula
} from '../../../components/PedraSeca/index.js';
import { ESTIMACIONS_IRPF, REGIMS_IVA, calendariObligacions } from '../burocracia/nucli/obligacions.js';
import { avisosDe } from '../burocracia/nucli/avisos.js';
import { icsDeTerminis } from '../burocracia/nucli/icsTerminis.js';
import { creaTitular, nouIdOpac } from '../identitat/nucli/titular.js';
import { CATALEG_TIPUS } from '../documents/catalegTipus.js';
import { PAPERERA, dataMinimaEsborrat } from '../documents/plaNeteja.js';
import { formatData } from '../nucli/dates.js';
import { textGestoriaV1225 } from '../i18nGestoriaV1225.js';

const AMBITS = Object.freeze(['ACTIVITAT', 'LLAR', 'ENTITAT']);
const ID_LLAR_LOCAL = nouIdOpac('tit', new Uint8Array(16).fill(1));
const ID_ACTIVITAT_LOCAL = nouIdOpac('tit', new Uint8Array(16).fill(2));
const ID_ENTITAT_LOCAL = nouIdOpac('tit', new Uint8Array(16).fill(3));

const TITULARS_LOCAL = Object.freeze({
  LLAR: creaTitular({ id: ID_LLAR_LOCAL, tipus: 'persona', ambit: 'LLAR', alies: 'Llar local' }),
  ACTIVITAT: creaTitular({ id: ID_ACTIVITAT_LOCAL, tipus: 'persona', ambit: 'ACTIVITAT', alies: 'Activitat local', persona: ID_LLAR_LOCAL }),
  ENTITAT: creaTitular({ id: ID_ENTITAT_LOCAL, tipus: 'entitat', ambit: 'ENTITAT', alies: 'Entitat local', formaJuridica: 'associacio', representants: [ID_LLAR_LOCAL] })
});

function dataIsoHui(avui) {
  const d = typeof avui === 'function' ? avui() : (avui instanceof Date ? avui : new Date());
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function descarregaTextLocal({ nom, tipus, dades }) {
  const url = URL.createObjectURL(new Blob([dades], { type: tipus }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.rel = 'noopener';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function nivellTo(nivell) {
  if (nivell === 'vencut' || nivell === 'hui' || nivell === 'urgent') return 'error';
  if (nivell === 'proper') return 'avis';
  return 'info';
}

export default function VistaBurocracia({ avui = null, descarrega = null, idioma = 'ca' }) {
  const huiIso = useMemo(() => dataIsoHui(avui), [avui]);
  const anyActual = Number(huiIso.slice(0, 4)) || 2026;
  const [any, setAny] = useState(anyActual);
  const [ambit, setAmbit] = useState('ACTIVITAT');
  const [regimIva, setRegimIva] = useState('general');
  const [irpf, setIrpf] = useState('directa');
  const [estatIcs, setEstatIcs] = useState('');
  const [tipusDoc, setTipusDoc] = useState(CATALEG_TIPUS[0]?.id || 'factura-rebudes');
  const [dataDoc, setDataDoc] = useState(huiIso);

  const tx = (clau, valors) => textGestoriaV1225(idioma, clau, valors);

  const perfil = useMemo(() => ({
    titular: TITULARS_LOCAL[ambit] || TITULARS_LOCAL.ACTIVITAT,
    regimIva: ambit === 'LLAR' ? 'exempt' : regimIva,
    estimacioIrpf: ambit === 'ACTIVITAT' ? irpf : null,
    reta: ambit === 'ACTIVITAT'
  }), [ambit, regimIva, irpf]);

  const calendari = useMemo(() => {
    try {
      return calendariObligacions(any, perfil);
    } catch {
      return { any, ocurrencies: [], descartades: [] };
    }
  }, [any, perfil]);

  const avisosPropers = useMemo(() => {
    try {
      return avisosDe(calendari.ocurrencies, huiIso, { diesVencuts: 7 });
    } catch {
      return [];
    }
  }, [calendari.ocurrencies, huiIso]);

  const resultatNeteja = useMemo(() => {
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(dataDoc);
    if (!valid) return { text: textGestoriaV1225(idioma, 'buro.netejaFaltaData') };
    /* G2-04 · plaNeteja.dataMinimaEsborrat llig `dates.data` en 29 tipus del catàleg. */
    const r = dataMinimaEsborrat(tipusDoc, { dates: { data: dataDoc, emissio: dataDoc, exercici: dataDoc, signatura: dataDoc, fi: dataDoc } });
    if (r.regla === 'mai') return { text: textGestoriaV1225(idioma, 'buro.netejaResultatMai') };
    if (r.regla === 'arxiu') return { text: textGestoriaV1225(idioma, 'buro.netejaResultatArxiu') };
    if (r.regla === 'persona') return { text: textGestoriaV1225(idioma, 'buro.netejaResultatPersona') };
    if (r.data) return { text: textGestoriaV1225(idioma, 'buro.netejaResultatData', { data: formatData(r.data) }) };
    return { text: textGestoriaV1225(idioma, 'buro.netejaFaltaData') };
  }, [tipusDoc, dataDoc, idioma]);

  const baixaIcs = () => {
    const textIcs = icsDeTerminis(calendari.ocurrencies);
    const fn = typeof descarrega === 'function' ? descarrega : descarregaTextLocal;
    fn({ nom: `gestoria-terminis-${any}.ics`, tipus: 'text/calendar;charset=utf-8', dades: textIcs });
    setEstatIcs(tx('buro.icsDescarregat'));
  };

  const anysOpcions = [anyActual - 1, anyActual, anyActual + 1].map((a) => ({ valor: String(a), etiqueta: String(a) }));

  return (
    <Pila gap={5}>
      <Alerta to="info" viva={false} titol={tx('buro.avisoVerificarTitol')}>
        {tx('buro.avisoVerificarCos')}
      </Alerta>

      <GrupCamps llegenda={tx('buro.perfilLlegenda')}>
        <Camp etiqueta={tx('buro.any')}>
          <Selector value={String(any)} onChange={(e) => setAny(Number(e.target.value))} opcions={anysOpcions} />
        </Camp>
        <Camp etiqueta={tx('buro.ambit')}>
          <Selector
            value={ambit}
            onChange={(e) => setAmbit(e.target.value)}
            opcions={AMBITS.map((a) => ({ valor: a, etiqueta: tx(`buro.ambit.${a}`) }))}
          />
        </Camp>
        {ambit !== 'LLAR' ? (
          <Camp etiqueta={tx('buro.regimIva')}>
            <Selector
              value={regimIva}
              onChange={(e) => setRegimIva(e.target.value)}
              opcions={REGIMS_IVA.map((r) => ({ valor: r, etiqueta: tx(`buro.iva.${r}`) }))}
            />
          </Camp>
        ) : null}
        {ambit === 'ACTIVITAT' ? (
          <Camp etiqueta={tx('buro.irpf')}>
            <Selector
              value={irpf}
              onChange={(e) => setIrpf(e.target.value)}
              opcions={ESTIMACIONS_IRPF.map((e) => ({ valor: e, etiqueta: tx(`buro.irpf.${e}`) }))}
            />
          </Camp>
        ) : null}
        <Accions>
          <Boto varietat="primari" icona={Download} onClick={baixaIcs}>
            {tx('buro.descarregaIcs')}
          </Boto>
        </Accions>
        {estatIcs ? <p role="status">{estatIcs}</p> : null}
      </GrupCamps>

      <GrupCamps llegenda={tx('buro.avisosPropersTitol')}>
        {avisosPropers.length === 0 ? (
          <p>{tx('buro.senseAvisos')}</p>
        ) : (
          <Pila gap={2}>
            {avisosPropers.map((av) => (
              <Alerta
                key={av.id}
                to={nivellTo(av.nivell)}
                viva={false}
                titol={
                  av.diesRestants === 0
                    ? tx('buro.vencHui')
                    : av.diesRestants > 0
                      ? tx('buro.diesRestants', { n: av.diesRestants })
                      : tx('buro.vencutFa', { n: Math.abs(av.diesRestants) })
                }
              >
                {`${av.venciment} · ${av.missatge}`}
              </Alerta>
            ))}
          </Pila>
        )}
      </GrupCamps>

      <Taula titol={tx('buro.taulaTitol', { any })} densa>
        <thead>
          <tr>
            <th scope="col">{tx('buro.col.venciment')}</th>
            <th scope="col">{tx('buro.col.obligacio')}</th>
            <th scope="col">{tx('buro.col.organisme')}</th>
            <th scope="col">{tx('buro.col.presenta')}</th>
            <th scope="col">{tx('buro.col.estat')}</th>
          </tr>
        </thead>
        <tbody>
          {calendari.ocurrencies.map((oc) => (
            <tr key={oc.id}>
              <th scope="row">
                <Calendar size={14} aria-hidden="true" focusable="false" />{' '}
                {oc.venciment || tx('buro.pendentData')}
              </th>
              <td>
                <strong>{oc.model ? `${oc.model} · ${oc.nom}` : oc.nom}</strong>
                {oc.periode ? ` (${oc.periode})` : ''}
              </td>
              <td>{oc.organisme}</td>
              <td>{tx(`buro.presenta.${oc.presenta}`)}</td>
              <td>
                <Insignia to={oc.aplica === 'si' ? 'exit' : 'avis'}>
                  {tx(`buro.aplica.${oc.aplica}`)}
                </Insignia>
              </td>
            </tr>
          ))}
        </tbody>
      </Taula>

      <GrupCamps llegenda={tx('buro.netejaTitol')}>
        <p>{tx('buro.netejaIntro', { paperera: PAPERERA })}</p>
        <Camp etiqueta={tx('buro.netejaTipus')}>
          <Selector
            value={tipusDoc}
            onChange={(e) => setTipusDoc(e.target.value)}
            opcions={CATALEG_TIPUS.map((tDoc) => ({ valor: tDoc.id, etiqueta: tDoc.nom }))}
          />
        </Camp>
        <Camp etiqueta={tx('buro.netejaData')}>
          <CampText tipus="date" value={dataDoc} onChange={(e) => setDataDoc(e.target.value)} />
        </Camp>
        <Alerta to="info" viva={false}>
          <ShieldAlert size={16} aria-hidden="true" focusable="false" /> {resultatNeteja.text}
        </Alerta>
      </GrupCamps>
    </Pila>
  );
}
