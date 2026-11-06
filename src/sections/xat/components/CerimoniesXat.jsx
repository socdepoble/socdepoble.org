/** F2a/F7: consumidor lazy del controlador intern, darrere de la bandera E2EE.
 * No persistix frases ni alliberaments. F7 només accepta material del proveïdor
 * verificat del controlador; no hi ha un formulari per a fabricar aprovacions.
 */
import { useEffect, useRef, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/index.js';
import { indexsDeText, paraulesDeFrase } from '../../../data/xifratXatAlta.js';

const T_RESERVA = (_clau, reserva) => reserva;
const POSICIONS = [0, 2, 5];
const normalitza = text => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();

export default function CerimoniesXat({ control, filId, t = T_RESERVA }) {
  const [ocupat, setOcupat] = useState(false);
  const [paraules, setParaules] = useState(null);
  const [comprovacio, setComprovacio] = useState(['', '', '']);
  const [frase, setFrase] = useState('');
  const [avis, setAvis] = useState('');
  const pendent = useRef(null);
  const viu = useRef(false);
  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; pendent.current?.(false); pendent.current = null; };
  }, []);
  const resol = confirmat => {
    const continua = pendent.current;
    pendent.current = null;
    setParaules(null); setComprovacio(['', '', '']);
    continua?.(confirmat);
  };
  const executa = async accio => {
    if (ocupat) return;
    setOcupat(true); setAvis('');
    try {
      await accio();
      if (viu.current) setAvis(t('section.xat.cerimonia.fet', 'Operació comprovada.'));
    } catch {
      if (viu.current) setAvis(t('section.xat.cerimonia.error', 'No s’ha pogut completar. Cap activació nova ha estat confirmada.'));
    } finally { if (viu.current) { setFrase(''); setOcupat(false); } }
  };
  const alta = () => executa(() => control.alta(async indexs => {
    const visibles = await paraulesDeFrase(indexs);
    if (!viu.current) return false;
    setParaules(visibles);
    return new Promise(resolve => { pendent.current = resolve; });
  }));
  const restaura = () => executa(async () => {
    const indexs = await indexsDeText(frase);
    setFrase('');
    try { await control.restauraFrase(indexs); } finally { indexs.fill(0); }
  });
  const correcte = paraules && POSICIONS.every((p, i) => normalitza(comprovacio[i]) === normalitza(paraules[p]));
  return <section data-sdp-e2ee="true" translate="no">
    <h3>{t('section.xat.cerimonia.titol', 'Claus i recuperació del xat')}</h3>
    <p>{t('perfil.confianca.targeta.subtitol', 'La frase té 6 paraules. La recuperació social necessita 3 persones de confiança.')}</p>
    <Boto disabled={ocupat} onClick={alta}>{t('section.xat.cerimonia.alta', 'Crea les claus i guarda la frase')}</Boto>
    {paraules && <>
      <p>{t('section.xat.cerimonia.comprova', 'Guarda les 6 paraules en ordre. Comprova les paraules 1, 3 i 6 abans de continuar.')}</p>
      <ol>{paraules.map((p, i) => <li key={i}>{p}</li>)}</ol>
      {POSICIONS.map((p, i) => <label className="sdp-camp" key={p}>
        <span className="sdp-camp__etiqueta">{t('section.xat.cerimonia.paraula', 'Paraula')} {p + 1}</span>
        <input className="sdp-control" type="password" autoComplete="off" spellCheck={false} value={comprovacio[i]}
          onChange={e => setComprovacio(anteriors => anteriors.map((v, j) => j === i ? e.target.value : v))} />
      </label>)}
      <Boto disabled={!correcte} onClick={() => resol(true)}>{t('common.confirma', 'Confirmar')}</Boto>
      <Boto onClick={() => resol(false)}>{t('common.cancela', 'Cancel·lar')}</Boto>
    </>}
    <label className="sdp-camp">
      <span className="sdp-camp__etiqueta">{t('section.xat.cerimonia.frase', 'Les 6 paraules de recuperació')}</span>
      <input className="sdp-control" type="password" autoComplete="off" spellCheck={false} value={frase} disabled={ocupat} onChange={e => setFrase(e.target.value)} />
    </label>
    <Boto disabled={ocupat || !frase.trim()} onClick={restaura}>{t('section.xat.cerimonia.restaura', 'Recupera amb la frase')}</Boto>
    <Boto disabled={ocupat || !control.potRecuperarSocial} onClick={() => executa(() => control.recuperaAmbAmics())}>{t('section.xat.cerimonia.amics', 'Recupera amb 3 persones')}</Boto>
    {!control.potRecuperarSocial && <p>{t('section.xat.cerimonia.socialPendent', 'La recuperació social necessita un repartiment verificat vigent.')}</p>}
    {filId && <>
      <Boto disabled={ocupat} onClick={() => executa(() => control.activaFil(filId))}>{t('section.xat.cerimonia.activa', 'Activa la preferència local d’este xat')}</Boto>
      <Boto disabled={ocupat} onClick={() => executa(() => control.revocaFil(filId))}>{t('section.xat.cerimonia.revoca', 'Revoca la preferència local d’este xat')}</Boto>
    </>}
    <p role="status">{avis}</p>
  </section>;
}
