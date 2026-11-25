/**
 * VistaContactes.jsx — Llibreta local de clients i proveïdors de la Gestoria de Poble
 * (Onada v1.2.25 · Lot G2).
 *
 * Combina el registre après del Full trimestral (`aprenProveidors`), el catàleg
 * integrat de proveïdors (`CATALEG_PROVEIDORS`) i les altes locals d'esta sessió
 * validant NIF/CIF amb `validaNif` i `paisDelNif`. 100 % local, zero xarxa, 5 llengües.
 */
import { useMemo, useState } from 'react';
import { Download, Plus, Trash2, Users } from 'lucide-react';
import {
  Accions, Alerta, Boto, Camp, CampText, EstatBuit, GrupCamps, Insignia, PillToggle, Pila, Selector, Taula
} from '../../../components/PedraSeca/index.js';
import { aprenProveidors, paisDelNif } from '../nucli/proveidors.js';
import { normalitzaNif, validaNif } from '../nucli/nif.js';
import { textGestoriaV1225 } from '../i18nGestoriaV1225.js';

function escapaCsv(valor) {
  const s = String(valor ?? '');
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function descarregaCsvLocal({ nom, dades }) {
  const url = URL.createObjectURL(new Blob([dades], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.rel = 'noopener';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function VistaContactes({ full = null, descarrega = null, idioma = 'ca' }) {
  const [locals, setLocals] = useState([]);
  const [cerca, setCerca] = useState('');
  const [filtre, setFiltre] = useState('tots');
  const [nom, setNom] = useState('');
  const [nif, setNif] = useState('');
  const [paper, setPaper] = useState('client');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [estat, setEstat] = useState('');

  const tx = (clau, valors) => textGestoriaV1225(idioma, clau, valors);

  const proveidorsBase = useMemo(() => {
    const historial = full ? [...(full.factures || []), ...(full.historial || [])] : [];
    const apresos = aprenProveidors(historial);
    return apresos.map((p) => ({
      id: `prov:${p.clau || p.nif || p.nom}`,
      nom: p.nom,
      nif: p.nif || '',
      pais: p.pais || paisDelNif(p.nif) || '',
      paper: 'proveidor',
      origen: (p.mesosVistos?.length || 0) > 0 ? 'full' : 'cataleg',
      cadencia: p.cadencia || null,
      editable: false
    }));
  }, [full]);

  const tots = useMemo(() => [...locals, ...proveidorsBase], [locals, proveidorsBase]);

  const filtrats = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return tots.filter((c) => {
      if (filtre !== 'tots' && c.paper !== filtre) return false;
      if (!q) return true;
      return `${c.nom} ${c.nif} ${c.pais} ${c.nota || ''}`.toLowerCase().includes(q);
    });
  }, [tots, filtre, cerca]);

  const afigContacte = (e) => {
    e.preventDefault();
    const nomNet = nom.trim();
    const nifNet = normalitzaNif(nif);
    if (!nomNet) {
      setError(tx('cont.errorNom'));
      return;
    }
    const validacio = nifNet ? validaNif(nifNet) : null;
    if (validacio && !validacio.valid) {
      setError(tx('cont.errorNif'));
      return;
    }
    setError('');
    setLocals((prev) => [
      {
        id: `local:${Date.now()}-${prev.length + 1}`,
        nom: nomNet,
        nif: nifNet,
        pais: paisDelNif(nifNet) || '',
        paper,
        nota: nota.trim(),
        origen: 'local',
        editable: true
      },
      ...prev
    ]);
    setNom('');
    setNif('');
    setNota('');
    setEstat(tx('cont.afegit'));
  };

  const exportaCsv = () => {
    const cap = ['nom', 'paper', 'nif', 'pais', 'origen', 'nota'].join(';');
    const files = filtrats.map((c) => [c.nom, c.paper, c.nif, c.pais, c.origen, c.nota || ''].map(escapaCsv).join(';'));
    const dades = `${[cap, ...files].join('\n')}\n`;
    const fn = typeof descarrega === 'function' ? descarrega : descarregaCsvLocal;
    fn({ nom: 'gestoria-contactes.csv', tipus: 'text/csv;charset=utf-8', dades });
    setEstat(tx('cont.csvDescarregat'));
  };

  return (
    <Pila gap={5}>
      <GrupCamps llegenda={tx('cont.nouTitol')}>
        <form onSubmit={afigContacte}>
          <Pila gap={3}>
            <Camp etiqueta={tx('cont.nom')} obligatori>
              <CampText value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="organization" />
            </Camp>
            <Camp etiqueta={tx('cont.nif')}>
              <CampText value={nif} onChange={(e) => setNif(e.target.value)} autoComplete="off" />
            </Camp>
            <Camp etiqueta={tx('cont.tipus')}>
              <Selector
                value={paper}
                onChange={(e) => setPaper(e.target.value)}
                opcions={[
                  { valor: 'client', etiqueta: tx('cont.filtre.client') },
                  { valor: 'proveidor', etiqueta: tx('cont.filtre.proveidor') }
                ]}
              />
            </Camp>
            <Camp etiqueta={tx('cont.email')}>
              <CampText value={nota} onChange={(e) => setNota(e.target.value)} autoComplete="off" />
            </Camp>
            {error ? <Alerta to="error" viva={false}>{error}</Alerta> : null}
            <Accions>
              <Boto varietat="primari" tipus="submit" icona={Plus}>{tx('cont.afig')}</Boto>
              <Boto varietat="secundari" icona={Download} disabled={filtrats.length === 0} onClick={exportaCsv}>
                {tx('cont.exportaCsv')}
              </Boto>
            </Accions>
          </Pila>
        </form>
        {estat ? <p role="status">{estat}</p> : null}
      </GrupCamps>

      <Pila gap={3}>
        <PillToggle
          etiqueta={tx('cont.tipus')}
          valor={filtre}
          onCanvi={setFiltre}
          opcions={[
            { valor: 'tots', text: tx('cont.filtre.tots') },
            { valor: 'client', text: tx('cont.filtre.client') },
            { valor: 'proveidor', text: tx('cont.filtre.proveidor') }
          ]}
        />
        <Camp etiqueta={tx('cont.cerca')}>
          <CampText tipus="search" value={cerca} onChange={(e) => setCerca(e.target.value)} autoComplete="off" />
        </Camp>
      </Pila>

      {filtrats.length === 0 ? (
        <EstatBuit icona={Users} titol={tx('cont.buitTitol')}>
          {tx('cont.buitText')}
        </EstatBuit>
      ) : (
        <Taula titol={`${tx('cont.filtre.tots')} (${filtrats.length})`} densa>
          <thead>
            <tr>
              <th scope="col">{tx('cont.col.nom')}</th>
              <th scope="col">{tx('cont.col.paper')}</th>
              <th scope="col">{tx('cont.col.nif')}</th>
              <th scope="col">{tx('cont.col.origen')}</th>
            </tr>
          </thead>
          <tbody>
            {filtrats.map((c) => (
              <tr key={c.id}>
                <th scope="row">
                  <strong>{c.nom}</strong>
                  {c.nota ? ` · ${c.nota}` : ''}
                </th>
                <td>
                  <Insignia to={c.paper === 'client' ? 'info' : 'neutre'}>
                    {tx(c.paper === 'client' ? 'cont.filtre.client' : 'cont.filtre.proveidor')}
                  </Insignia>
                </td>
                <td>{[c.nif, c.pais].filter(Boolean).join(' · ') || '—'}</td>
                <td>
                  {tx(`cont.origen.${c.origen}`)}
                  {c.cadencia ? ` · ${c.cadencia}` : ''}
                  {c.editable ? (
                    <>
                      {' '}
                      <Boto
                        varietat="fantasma"
                        icona={Trash2}
                        aria-label={`${tx('cont.elimina')} ${c.nom}`}
                        onClick={() => setLocals((prev) => prev.filter((item) => item.id !== c.id))}
                      >
                        {tx('cont.elimina')}
                      </Boto>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </Taula>
      )}
    </Pila>
  );
}
