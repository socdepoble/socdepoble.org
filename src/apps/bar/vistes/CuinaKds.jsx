/**
 * El Bar · vistes/CuinaKds.jsx — Pantalla de Cuina (KDS local · Onada v1.2.25 · Lot G2).
 *
 * Carregada diferida amb `lazyRoute` des de `rutesBar.js`. Mostra les comandes obertes
 * del torn en temps real, sincronitza l'estat de preparació (`pendent` → `en-marxa` → `llest`)
 * entre pestanyes del mateix dispositiu via `BroadcastChannel` (sense xarxa ni backend)
 * i degradació neta en memòria si `BroadcastChannel` no existix.
 *
 * 100 % primitives de Pedra Seca, zero xarxa, zero emmagatzematge directe, 5 llengües.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, ChefHat, Clock, Flame, RotateCcw } from 'lucide-react';
import {
  Accions, Alerta, Boto, EstatBuit, GrupCamps, Insignia, PillToggle, Pila
} from '../../../components/PedraSeca/index.js';
import { useApp, useInterruptorsApp } from '../../plataforma/index.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { Columna, Preparat } from './comu.jsx';
import { horaCurta, nomOrigen } from './vestits.js';

const CANAL_KDS = 'sdp-bar-kds-v1';

const TEXTOS_KDS = Object.freeze({
  ca: Object.freeze({
    titol: 'Cuina (KDS)',
    apagadaTitol: 'La pantalla de cuina està apagada',
    apagadaText: 'Pots activar-la quan vulgues als Ajustos del Bar.',
    tornaTpv: 'Torna al TPV',
    filtre: 'Estat de les comandes',
    totes: 'Totes',
    pendents: 'Pendents',
    enMarxa: 'En marxa',
    llestes: 'Llestes',
    buitTitol: 'Cap comanda pendent a cuina',
    buitText: 'Quan òbrigues comandes al TPV o a la Caixa, apareixeran ací a l’instant.',
    estatPendent: 'Pendent',
    estatEnMarxa: 'En marxa',
    estatLlest: 'Llest per servir',
    passaEnMarxa: 'Posa en marxa',
    marcaLlest: 'Marca llest',
    tornaPendent: 'Torna a pendent',
    sincronitzat: 'Sincronització local entre pestanyes activa (sense servidor).',
    senseCanal: 'Mode local en esta pestanya (sense sincronització entre pestanyes).',
    oberta: (hora) => `Oberta a les ${hora}`,
    nota: (txt) => `Nota: ${txt}`
  }),
  es: Object.freeze({
    titol: 'Cocina (KDS)',
    apagadaTitol: 'La pantalla de cocina está apagada',
    apagadaText: 'Puedes activarla cuando quieras en los Ajustes del Bar.',
    tornaTpv: 'Volver al TPV',
    filtre: 'Estado de las comandas',
    totes: 'Todas',
    pendents: 'Pendientes',
    enMarxa: 'En marcha',
    llestes: 'Listas',
    buitTitol: 'Ninguna comanda pendiente en cocina',
    buitText: 'Cuando abras comandas en el TPV o en la Caja, aparecerán aquí al instante.',
    estatPendent: 'Pendiente',
    estatEnMarxa: 'En marcha',
    estatLlest: 'Listo para servir',
    passaEnMarxa: 'Poner en marcha',
    marcaLlest: 'Marcar listo',
    tornaPendent: 'Volver a pendiente',
    sincronitzat: 'Sincronización local entre pestañas activa (sin servidor).',
    senseCanal: 'Modo local en esta pestaña (sin sincronización entre pestañas).',
    oberta: (hora) => `Abierta a las ${hora}`,
    nota: (txt) => `Nota: ${txt}`
  }),
  en: Object.freeze({
    titol: 'Kitchen (KDS)',
    apagadaTitol: 'Kitchen display is turned off',
    apagadaText: 'You can turn it on at any time in Bar Settings.',
    tornaTpv: 'Back to POS',
    filtre: 'Order status',
    totes: 'All',
    pendents: 'Pending',
    enMarxa: 'In progress',
    llestes: 'Ready',
    buitTitol: 'No pending orders in kitchen',
    buitText: 'Orders opened in the POS or Register appear here immediately.',
    estatPendent: 'Pending',
    estatEnMarxa: 'In progress',
    estatLlest: 'Ready to serve',
    passaEnMarxa: 'Start preparing',
    marcaLlest: 'Mark ready',
    tornaPendent: 'Reset to pending',
    sincronitzat: 'Local multi-tab sync active (offline, no server).',
    senseCanal: 'Single-tab local mode (BroadcastChannel unavailable).',
    oberta: (hora) => `Opened at ${hora}`,
    nota: (txt) => `Note: ${txt}`
  }),
  eu: Object.freeze({
    titol: 'Sukaldea (KDS)',
    apagadaTitol: 'Sukaldeko pantaila itzalita dago',
    apagadaText: 'Nahi duzunean aktibatu dezakezu Tabernako ezarpenetan.',
    tornaTpv: 'Itzuli STGra',
    filtre: 'Eskaeren egoera',
    totes: 'Guztiak',
    pendents: 'Zain',
    enMarxa: 'Martxan',
    llestes: 'Prest',
    buitTitol: 'Ez dago eskaerarik sukaldean',
    buitText: 'STGn edo Kutxan eskaerak irekitzean, berehala agertuko dira hemen.',
    estatPendent: 'Zain',
    estatEnMarxa: 'Martxan',
    estatLlest: 'Zerbitzatzeko prest',
    passaEnMarxa: 'Jarri martxan',
    marcaLlest: 'Markatu prest',
    tornaPendent: 'Itzuli zain egoerara',
    sincronitzat: 'Fitxen arteko tokiko sinkronizazioa aktibo (zerbitzaririk gabe).',
    senseCanal: 'Fitxa bakarreko tokiko modua.',
    oberta: (hora) => `${hora}(e)tan irekia`,
    nota: (txt) => `Oharra: ${txt}`
  }),
  gl: Object.freeze({
    titol: 'Cociña (KDS)',
    apagadaTitol: 'A pantalla de cociña está apagada',
    apagadaText: 'Podes activala cando queiras nos Axustes do Bar.',
    tornaTpv: 'Volver ao TPV',
    filtre: 'Estado das comandas',
    totes: 'Todas',
    pendents: 'Pendentes',
    enMarxa: 'En marcha',
    llestes: 'Listas',
    buitTitol: 'Ningunha comanda pendente na cociña',
    buitText: 'Cando abras comandas no TPV ou na Caixa, aparecerán aquí ao instante.',
    estatPendent: 'Pendente',
    estatEnMarxa: 'En marcha',
    estatLlest: 'Listo para servir',
    passaEnMarxa: 'Poñer en marcha',
    marcaLlest: 'Marcar listo',
    tornaPendent: 'Volver a pendente',
    sincronitzat: 'Sincronización local entre lapelas activa (sen servidor).',
    senseCanal: 'Modo local nesta lapela (sen sincronización entre lapelas).',
    oberta: (hora) => `Aberta ás ${hora}`,
    nota: (txt) => `Nota: ${txt}`
  })
});

function textosKds(idioma = 'ca') {
  const codi = String(idioma || 'ca').toLowerCase().slice(0, 2);
  return Object.hasOwn(TEXTOS_KDS, codi) ? TEXTOS_KDS[codi] : TEXTOS_KDS.ca;
}

function toEstat(estat) {
  if (estat === 'llest') return 'exit';
  if (estat === 'en-marxa') return 'avis';
  return 'info';
}

export function CuinaKdsCos({ idioma = 'ca' }) {
  const tx = textosKds(idioma);
  const { comandes = [], sala } = useBar();
  const [estats, setEstats] = useState({});
  const [filtre, setFiltre] = useState('totes');
  const canalRef = useRef(null);
  const [teCanal, setTeCanal] = useState(false);

  useEffect(() => {
    if (typeof globalThis.BroadcastChannel !== 'function') {
      setTeCanal(false);
      return undefined;
    }
    let canal;
    try {
      canal = new globalThis.BroadcastChannel(CANAL_KDS);
    } catch {
      setTeCanal(false);
      return undefined;
    }
    canalRef.current = canal;
    setTeCanal(true);
    canal.onmessage = (event) => {
      const dada = event?.data;
      if (dada?.tipus === 'estat' && typeof dada.id === 'string' && typeof dada.estat === 'string') {
        setEstats((prev) => ({ ...prev, [dada.id]: dada.estat }));
      }
    };
    return () => {
      canalRef.current = null;
      canal.close();
    };
  }, []);

  const canviaEstat = (comandaId, nouEstat) => {
    setEstats((prev) => ({ ...prev, [comandaId]: nouEstat }));
    try {
      canalRef.current?.postMessage({ tipus: 'estat', id: comandaId, estat: nouEstat });
    } catch {
      /* canal tancat */
    }
  };

  const actives = useMemo(() => (
    comandes
      .filter((c) => Array.isArray(c.linies) && c.linies.some((l) => l.estat !== 'anullada'))
      .map((c) => ({
        ...c,
        estatKds: estats[c.id] || 'pendent',
        liniesVives: c.linies.filter((l) => l.estat !== 'anullada')
      }))
  ), [comandes, estats]);

  const filtrades = useMemo(() => (
    filtre === 'totes' ? actives : actives.filter((c) => c.estatKds === filtre)
  ), [actives, filtre]);

  return (
    <Columna titol={tx.titol} torna={{ etiqueta: tx.tornaTpv, trams: ['tpv'] }}>
      <Alerta to="info" viva={false}>
        {teCanal ? tx.sincronitzat : tx.senseCanal}
      </Alerta>
      <PillToggle
        etiqueta={tx.filtre}
        valor={filtre}
        onCanvi={setFiltre}
        opcions={[
          { valor: 'totes', text: `${tx.totes} (${actives.length})` },
          { valor: 'pendent', text: tx.pendents },
          { valor: 'en-marxa', text: tx.enMarxa },
          { valor: 'llest', text: tx.llestes }
        ]}
      />
      {filtrades.length === 0 ? (
        <EstatBuit icona={ChefHat} titol={tx.buitTitol}>
          {tx.buitText}
        </EstatBuit>
      ) : (
        <Pila gap={4}>
          {filtrades.map((comanda) => {
            const nom = nomOrigen(comanda.origen, sala, idioma);
            const etiquetaEstat = comanda.estatKds === 'llest'
              ? tx.estatLlest
              : comanda.estatKds === 'en-marxa'
                ? tx.estatEnMarxa
                : tx.estatPendent;
            return (
              <GrupCamps key={comanda.id} llegenda={nom}>
                <Pila gap={2}>
                  <p>
                    <Insignia to={toEstat(comanda.estatKds)}>{etiquetaEstat}</Insignia>
                    {comanda.obertaA ? (
                      <>
                        {' '}
                        <Clock size={14} aria-hidden="true" focusable="false" />{' '}
                        {tx.oberta(horaCurta(comanda.obertaA))}
                      </>
                    ) : null}
                  </p>
                  <Pila gap={1}>
                    {comanda.liniesVives.map((linia) => (
                      <p key={linia.id}>
                        <strong>{`${linia.quantitat}× ${linia.nomCongelat || linia.nom || linia.producteId}`}</strong>
                        {linia.nota ? ` — ${tx.nota(linia.nota)}` : ''}
                      </p>
                    ))}
                  </Pila>
                  <Accions>
                    {comanda.estatKds === 'pendent' ? (
                      <Boto varietat="primari" icona={Flame} onClick={() => canviaEstat(comanda.id, 'en-marxa')}>
                        {tx.passaEnMarxa}
                      </Boto>
                    ) : null}
                    {comanda.estatKds !== 'llest' ? (
                      <Boto varietat={comanda.estatKds === 'en-marxa' ? 'primari' : 'secundari'} icona={CheckCircle2} onClick={() => canviaEstat(comanda.id, 'llest')}>
                        {tx.marcaLlest}
                      </Boto>
                    ) : (
                      <Boto varietat="secundari" icona={RotateCcw} onClick={() => canviaEstat(comanda.id, 'pendent')}>
                        {tx.tornaPendent}
                      </Boto>
                    )}
                  </Accions>
                </Pila>
              </GrupCamps>
            );
          })}
        </Pila>
      )}
    </Columna>
  );
}

export default function CuinaKds() {
  const { idioma = 'ca' } = useApp();
  const tx = textosKds(idioma);
  const cuinaActiva = useInterruptorsApp().actiu('cuina');
  return (
    <Preparat titol={tx.titol}>
      {cuinaActiva ? (
        <CuinaKdsCos idioma={idioma} />
      ) : (
        <Columna titol={tx.titol} torna={{ etiqueta: tx.tornaTpv, trams: ['tpv'] }}>
          <EstatBuit icona={ChefHat} titol={tx.apagadaTitol}>{tx.apagadaText}</EstatBuit>
        </Columna>
      )}
    </Preparat>
  );
}
