/**
 * PanellSimulacio.jsx — les simulacions de la vista «Històric i IA»: el 303 i
 * el 130 de cada trimestre, el 390, la renda orientativa, els escenaris i
 * els paràmetres i suposicions que la persona pot canviar.
 *
 * Onada 6, ordre del Mestre (261009): «fer simulacions», «simular la renda».
 * Tot el càlcul és d'impostos/nucli/simulacio.js i de nucli/operacions.js;
 * ací només es pinta i es reben els canvis. Les xifres de resultat (també
 * els recomptes de moviments) van amagades amb l'ull de la boina (Xifra del
 * Tauler); els paràmetres (tipus, escales, mínims) no són dades de ningú i es
 * veuen sempre, amb la seua font i l'etiqueta [NO VERIFICAT]. TOTS són
 * editables per any: els escalars, en un camp; les escales i la minoració
 * del 130, tram a tram (EditorTrams), validats sencers en aplicar-los.
 */
import { useId, useState } from 'react';
import { EyeOff, Plus, Trash2 } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { AccordionItem } from '../../../components/PedraSeca/organismes/Accordion.jsx';
import { Camp, CampText, Casella, GrupCamps } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { CAMPS_PARAMETRES, ETIQUETA_NO_VERIFICAT, totalDeLAny } from '../impostos/nucli/simulacio.js';
import { formatData } from '../nucli/dates.js';
import { Xifra } from '../tauler/Tauler.jsx';
import { CAMPS_SUPOSITS } from './nucli/operacions.js';
import { TEXT_COBERTURA } from './nucli/targetesHistoric.js';

/** Una xifra d'import en euros per a Xifra, o null si no se sap. */
export const importDe = (valor) => (Number.isSafeInteger(valor) ? { tipus: 'import', valor, moneda: 'EUR' } : null);
/** Un recompte (de moviments, de files) per a Xifra: també s'amaga amb l'ull tancat. */
export const recompteDe = (valor) => (Number.isSafeInteger(valor) ? { tipus: 'recompte', valor } : null);

/** Un percentatge, amagat amb l'ull tancat i «Sense dades» si no se sap. */
export function Percentatge({ valor, visible = false }) {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) return <span>Sense dades</span>;
  if (!visible) {
    return (
      <span className="sdp-gestoria-tauler__amagat">
        <EyeOff size={20} aria-hidden="true" focusable="false" />
        <span>Xifra amagada</span>
      </span>
    );
  }
  return <span>{`${String(valor).replace('.', ',')} %`}</span>;
}

/* Un valor de paràmetre, en text per a la pantalla. */
function textValor(valor, unitat) {
  if (unitat === 'percentatge') return `${String(valor / 100).replace('.', ',')} %`;
  if (unitat === 'import') return `${String(valor / 100).replace('.', ',')} €`;
  if (unitat === 'boolea') return valor ? 'Sí' : 'No';
  if (unitat === 'escala') return valor.map((t) => `${t.fins === null ? 'la resta' : `fins a ${t.fins / 100} €`}: ${String(t.tipus / 100).replace('.', ',')} %`).join(' · ');
  return valor.map((t) => `fins a ${t.fins / 100} €: ${t.import / 100} €`).join(' · ');
}

/* Un nombre escrit per la persona («21», «5.550,50» o «5550.5») en centèsimes, o null. */
function centesimes(text) {
  const net = String(text ?? '').trim().replace(/\s/g, '');
  if (!/^-?\d+(?:[.,]\d{1,2})?$/.test(net)) return null;
  return Math.round(Number(net.replace(',', '.')) * 100);
}

const unics = (avisos) => [...new Map(avisos.map((a) => [a.codi, a])).values()];

/* Els impostos estimats d'un any: els trimestres, el 390 i la renda. */
function ImpostosDeLAny({ any, visible }) {
  const avisos = unics([...any.avisos, ...any.trimestres.flatMap((tr) => [...tr.iva.avisos, ...tr.irpf.avisos])]);
  const r = any.renda;
  return (
    <div className="sdp-gestoria-historic__any">
      <h3 className="sdp-gestoria-historic__subtitol">{`Els impostos de ${any.any}`}</h3>
      <Taula titol={`Estimació trimestral de ${any.any}`} densa>
        <thead>
          <tr>
            <th scope="col">Trimestre</th><th scope="col">Extractes</th><th scope="col">IVA (303) a ingressar</th><th scope="col">IVA a compensar</th>
            <th scope="col">IRPF (130)</th><th scope="col">Total</th><th scope="col">Termini</th>
          </tr>
        </thead>
        <tbody>
          {any.trimestres.map((tr) => (
            <tr key={tr.t}>
              <th scope="row">{`${tr.t}T ${any.any}`}</th>
              <td>{TEXT_COBERTURA[tr.cobertura] ?? '—'}</td>
              <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(tr.iva.aIngressar)} visible={visible} /></td>
              <td className="sdp-gestoria-historic__xifra"><Xifra xifra={tr.iva.motiu ? null : importDe(tr.iva.aCompensar)} visible={visible} /></td>
              <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(tr.irpf.resultat)} visible={visible} /></td>
              <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(tr.total)} visible={visible} /></td>
              <td>{tr.iva.termini ? `Fins al ${formatData(tr.iva.termini.fi, 'dd/mm/aaaa')}` : '—'}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{any.model390.parcial ? 'Any (390, parcial)' : 'Any (390)'}</th>
            <td>—</td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(any.model390.aIngressar)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(any.model390.motiu ? null : any.compensacioFinal)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(r.pagaments130)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(totalDeLAny(any))} visible={visible} /></td>
            <td>—</td>
          </tr>
        </tfoot>
      </Taula>
      <Taula titol={`Renda orientativa (model 100) de ${any.any}`} densa>
        <tbody>
          {[
            ['Rendiment net de l’activitat', r.rendiment], ['Despeses de difícil justificació', r.dificil], ['Base liquidable general', r.base],
            ['Quota íntegra estatal', r.quotaEstatal], ['Quota íntegra autonòmica', r.quotaAutonomica], ['Retencions de les factures', r.retencions],
            ['Pagaments del 130', r.pagaments130], ['Resultat (positiu, a pagar; negatiu, a tornar)', r.resultat]
          ].map(([concepte, valor]) => (
            <tr key={concepte}>
              <th scope="row">{concepte}</th>
              <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(valor)} visible={visible} /></td>
            </tr>
          ))}
          <tr>
            <th scope="row">Tipus mitjà</th>
            <td className="sdp-gestoria-historic__xifra"><Percentatge valor={r.tipusMitja} visible={visible} /></td>
          </tr>
        </tbody>
      </Taula>
      {avisos.length ? (
        <ul className="sdp-gestoria-historic__avisos" aria-label={`Avisos de ${any.any}`}>
          {avisos.map((a) => <li key={a.codi}>{a.missatge}</li>)}
        </ul>
      ) : null}
    </div>
  );
}

/* Els escenaris: dos percentatges i el que canvien els impostos. */
function Escenaris({ h, visible }) {
  const { facturacio, despesaIa } = h.configuracio.escenari;
  const [errors, setErrors] = useState({});
  const canvia = (clau) => (event) => {
    const valor = centesimes(event.target.value);
    const bo = valor !== null && h.canviaEscenari(clau, valor / 100);
    setErrors((previ) => ({ ...previ, [clau]: bo || event.target.value === '' ? '' : 'Escriu un percentatge entre -100 i 1000.' }));
  };
  return (
    <div className="sdp-gestoria-historic__any">
      <h3 className="sdp-gestoria-historic__subtitol">Escenaris</h3>
      <div className="sdp-gestoria-historic__graella">
        <Camp etiqueta="Facturació (% de canvi)" ajuda="10 vol dir facturar un 10 % més; -20, un 20 % menys." error={errors.facturacio || undefined}>
          <CampText tipus="number" step="1" min="-100" max="1000" defaultValue={facturacio} onChange={canvia('facturacio')} />
        </Camp>
        <Camp etiqueta="Despesa en IA (% de canvi)" ajuda="-30 vol dir gastar un 30 % menys en IA." error={errors.despesaIa || undefined}>
          <CampText tipus="number" step="1" min="-100" max="1000" defaultValue={despesaIa} onChange={canvia('despesaIa')} />
        </Camp>
      </div>
      {h.comparacio ? (
        <Taula titol="El que canvia amb l’escenari" densa>
          <thead>
            <tr>
              <th scope="col">Any</th><th scope="col">IVA (303)</th><th scope="col">IRPF (130)</th><th scope="col">Renda</th>
              <th scope="col">Impostos en total</th><th scope="col">Rendiment</th>
            </tr>
          </thead>
          <tbody>
            {h.comparacio.map((c) => (
              <tr key={c.any}>
                <th scope="row">{c.any}</th>
                <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(c.iva)} visible={visible} /></td>
                <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(c.irpf130)} visible={visible} /></td>
                <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(c.renda)} visible={visible} /></td>
                <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(c.total)} visible={visible} /></td>
                <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(c.rendiment)} visible={visible} /></td>
              </tr>
            ))}
          </tbody>
        </Taula>
      ) : <p className="sdp-gestoria-historic__nota">Escriu un canvi per a veure què passaria amb els impostos.</p>}
    </div>
  );
}

/* Les suposicions de les operacions del banc. */
function Suposits({ h }) {
  return (
    <GrupCamps llegenda="Suposicions sobre els moviments del banc">
      {CAMPS_SUPOSITS.map(({ clau, nom, unitat }) => (unitat === 'boolea' ? (
        <Casella key={clau} etiqueta={nom} checked={Boolean(h.suposits[clau])} onChange={(event) => h.canviaSuposit(clau, event.target.checked)} />
      ) : (
        <Camp key={clau} etiqueta={`${nom} (%)`}>
          <CampText tipus="number" step="0.01" min="0" max="100" defaultValue={h.suposits[clau] / 100}
            onChange={(event) => {
              const valor = centesimes(event.target.value);
              if (valor !== null) h.canviaSuposit(clau, valor);
            }} />
        </Camp>
      )))}
    </GrupCamps>
  );
}

const textCentesimes = (n) => String(n / 100).replace('.', ',');
/* Les files de l'editor d'una escala: el «fins a» en euros (buit: la resta) i el tipus en % o la minoració en euros.
   Cada fila porta una clau estable (no la posició): llevar-ne una no mou el que s'ha escrit a les altres. */
let filaNova = 0;
const fila = (fins = '', valor = '') => {
  filaNova += 1;
  return { id: `tram-${filaNova}`, fins, valor };
};
const filesDe = (trams, unitat) => trams.map((t) => fila(
  t.fins === null ? '' : textCentesimes(t.fins), textCentesimes(unitat === 'escala' ? t.tipus : t.import)
));
const ERROR_TRAMS = Object.freeze({
  escala: 'Cada tram necessita un «fins a» més alt que el de l’anterior (el darrer, buit: la resta de la base) i un tipus entre 0 i 100 %.',
  minoracio: 'Cada tram necessita un «fins a» més alt que el de l’anterior i una minoració en euros.'
});

/*
 * L'editor dels trams d'una escala (o de la minoració del 130) d'un any. Els
 * camps són text lliure fins que s'aplica: aleshores l'escala sencera es
 * valida (validaParametres, via canviaParametre) i, si no és bona, no canvia res.
 */
function EditorTrams({ h, any, clau, nom, unitat, trams }) {
  const escala = unitat === 'escala';
  const [files, setFiles] = useState(() => filesDe(trams, unitat));
  const [error, setError] = useState('');
  const [fet, setFet] = useState('');
  const canvia = (i, camp) => (event) => {
    const text = event.target.value;
    setFiles((previ) => previ.map((f, j) => (j === i ? { ...f, [camp]: text } : f)));
    setFet('');
  };
  const afig = () => {
    setFiles((previ) => (escala && previ.length ? [...previ.slice(0, -1), fila(), previ[previ.length - 1]] : [...previ, fila()]));
    setFet('');
  };
  const lleva = (i) => {
    setFiles((previ) => (previ.length > 1 ? previ.filter((_, j) => j !== i) : previ));
    setFet('');
  };
  const aplica = (event) => {
    event.preventDefault();
    const llegits = files.map((f, i) => {
      const obert = escala && i === files.length - 1 && f.fins.trim() === '';
      const fins = obert ? null : centesimes(f.fins);
      const valor = centesimes(f.valor);
      return { bo: (obert || fins !== null) && valor !== null && valor >= 0, tram: escala ? { fins, tipus: valor } : { fins, import: valor } };
    });
    const bo = llegits.length > 0 && llegits.every((x) => x.bo) && h.canviaParametre(any, clau, llegits.map((x) => x.tram));
    setError(bo ? '' : ERROR_TRAMS[unitat]);
    setFet(bo ? `Aplicada: ${nom} de ${any}.` : '');
  };
  const etiquetaValor = escala ? 'tipus (%)' : 'minoració (€)';
  return (
    <form className="sdp-gestoria-historic__trams" onSubmit={aplica} aria-label={`Trams: ${nom} de ${any}`}>
      {files.map((f, i) => (
        <div className="sdp-gestoria-historic__tram" key={f.id}>
          <Camp etiqueta={`Tram ${i + 1}: fins a (€)`} ajuda={escala && i === files.length - 1 ? 'Buit: la resta de la base.' : undefined}>
            <CampText inputMode="decimal" value={f.fins} onChange={canvia(i, 'fins')} />
          </Camp>
          <Camp etiqueta={`Tram ${i + 1}: ${etiquetaValor}`}>
            <CampText inputMode="decimal" value={f.valor} onChange={canvia(i, 'valor')} />
          </Camp>
          <Boto varietat="fantasma" icona={Trash2} onClick={() => lleva(i)} disabled={files.length < 2}
            aria-label={`Lleva el tram ${i + 1}`}>Lleva</Boto>
        </div>
      ))}
      {error ? <p className="sdp-camp__error" role="alert">{error}</p> : null}
      <p role="status" className="sdp-gestoria-historic__nota">{fet}</p>
      <div className="sdp-gestoria-historic__accions">
        <Boto varietat="secundari" icona={Plus} onClick={afig}>Afig un tram</Boto>
        <Boto tipus="submit" varietat="primari">{`Aplica els trams de ${any}`}</Boto>
      </div>
    </form>
  );
}

/* Els paràmetres fiscals d'un any: els escalars, en un camp; les escales i la minoració, tram a tram (desplegable). */
function ParametresDeLAny({ h, any }) {
  const p = h.parametresDeLAny(any);
  const [versio, setVersio] = useState(0);
  return (
    <GrupCamps llegenda={`Paràmetres fiscals de ${any}${p.origen === 'propis' ? ' (canviats per tu)' : ''}`}>
      <p className="sdp-gestoria-historic__nota">{`${ETIQUETA_NO_VERIFICAT}. Cada valor diu d’on ix: comprova’l amb la gestoria.`}</p>
      <div className="sdp-gestoria-historic__graella" key={versio}>
        {CAMPS_PARAMETRES.map(({ clau, nom, unitat, font }) => {
          if (unitat === 'boolea') {
            return (
              <Casella key={clau} etiqueta={nom} ajuda={font} checked={Boolean(p[clau])}
                onChange={(event) => h.canviaParametre(any, clau, event.target.checked)} />
            );
          }
          if (unitat === 'percentatge' || unitat === 'import') {
            return (
              <Camp key={clau} etiqueta={`${nom} (${unitat === 'percentatge' ? '%' : '€'})`} ajuda={font}>
                <CampText tipus="number" step="0.01" min="0" defaultValue={p[clau] / 100}
                  onChange={(event) => {
                    const valor = centesimes(event.target.value);
                    if (valor !== null) h.canviaParametre(any, clau, valor);
                  }} />
              </Camp>
            );
          }
          return (
            <div key={clau} className="sdp-gestoria-historic__escala">
              <p className="sdp-gestoria-historic__escala-nom">{nom}</p>
              <p>{textValor(p[clau], unitat)}</p>
              <p className="sdp-gestoria-historic__nota">{font}</p>
              <AccordionItem title={`Edita els trams (${nom.toLowerCase()}, ${any})`}>
                <EditorTrams h={h} any={any} clau={clau} nom={nom} unitat={unitat} trams={p[clau]} />
              </AccordionItem>
            </div>
          );
        })}
      </div>
      {p.origen === 'propis' ? (
        <Boto varietat="secundari" onClick={() => { h.restauraParametres(any); setVersio((v) => v + 1); }}>
          {`Torna als paràmetres per defecte de ${any}`}
        </Boto>
      ) : null}
    </GrupCamps>
  );
}

/**
 * Les simulacions.
 * @param {{ h: object, visible: boolean }} p `h`: el de useHistoric
 */
export function PanellSimulacio({ h, visible }) {
  const id = useId();
  const banc = h.banc;
  return (
    <section className="sdp-gestoria-historic__seccio" aria-labelledby={id}>
      <h2 id={id} className="sdp-gestoria-historic__titol">Simulacions d’impostos</h2>
      <Alerta to="avis" titol={ETIQUETA_NO_VERIFICAT} viva={false}>
        Calculat amb els moviments del banc i les suposicions de baix: cada despesa necessita la seua factura per a deduir-se, les entrades
        sense un altre origen conegut compten com a cobraments de clients (per prudència, l’estimació en pot eixir alta) i la renda només
        compta l’activitat econòmica, sense altres rendes, reduccions ni deduccions. No és cap declaració.
      </Alerta>
      {banc && (banc.senseTractament || banc.noDeduibles) ? (
        /* Els recomptes també són xifres de la persona: amb l'ull tancat, amagats. */
        <p className="sdp-gestoria-historic__nota">
          {'Despeses sense proveïdor conegut, que van sense IVA deduïble: '}
          <Xifra xifra={recompteDe(banc.senseTractament)} visible={visible} />
          {'. Eixides que no compten com a despesa (transferències, altres o per revisar): '}
          <Xifra xifra={recompteDe(banc.noDeduibles)} visible={visible} />
          {'.'}
        </p>
      ) : null}
      {(h.simulacio?.anys ?? []).map((any) => <ImpostosDeLAny key={any.any} any={any} visible={visible} />)}
      {/* La clau `carregada` torna a pintar els camps quan arriba la configuració desada. */}
      <Escenaris key={`escenari-${h.carregada}`} h={h} visible={visible} />
      <div className="sdp-gestoria-historic__any">
        <h3 className="sdp-gestoria-historic__subtitol">Paràmetres i suposicions</h3>
        <Suposits key={`suposits-${h.carregada}`} h={h} />
        {(h.simulacio?.anys ?? []).map((any) => <ParametresDeLAny key={`${any.any}-${h.carregada}`} h={h} any={any.any} />)}
      </div>
    </section>
  );
}
