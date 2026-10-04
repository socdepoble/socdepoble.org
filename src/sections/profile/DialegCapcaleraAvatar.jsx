import { useEffect, useRef, useState } from 'react';
import { Dialeg, Boto, GrupOpcions } from '../../components/PedraSeca';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';
import { PES_MAXIM_FOTO_AVATAR, useEnquadramentAvatar } from './useEnquadramentAvatar.jsx';

/* On va la imatge. `camps` són els de la fitxa (perfilCamps.CAMPS_FITXA):
   heroImage → hero_url; logoImage → avatar_url (persona, agent) o logo_url. */
export const DESTINS_IMATGE = Object.freeze([
  Object.freeze({ valor: 'capcalera', etiqueta: 'Només la capçalera', camps: Object.freeze(['heroImage']) }),
  Object.freeze({ valor: 'avatar', etiqueta: 'Només l’avatar', camps: Object.freeze(['logoImage']) }),
  Object.freeze({ valor: 'les-dues', etiqueta: 'La mateixa per a les dues', camps: Object.freeze(['heroImage', 'logoImage']) }),
]);

/* handleFileChange buida `target.value`: amb el mateix event, el segon destí
   ja no trobaria el fitxer. Cada destí rep el seu. */
const ambFitxer = (fitxer) => ({ target: { files: [fitxer], value: '' } });

/* Un pas que falla sense missatge propi (no hauria de passar: el hook l'avisa). */
const ERROR_DESAT = 'No s’ha pogut desar la imatge.';

/* Onada 4 · revisió adversarial (K2) · A «les dues», la capçalera puja la
   foto ORIGINAL, que el retallador ja ha acceptat amb el seu límit d'entrada
   (25 MB): validar-la ara amb els 5 MB la rebutjaria després d'haver
   enquadrat l'avatar. La compressió de sempre la deixa en 1.200 px. El retall
   de l'avatar i «Només la capçalera» continuen amb el límit de sempre. */
const ORIGINAL_ACCEPTADA = Object.freeze({ pesMaxim: PES_MAXIM_FOTO_AVATAR });

/**
 * DialegCapcaleraAvatar — T35 (ordre del Mestre, 260928). Cas ÚNIC del Perfil:
 * a la resta de seccions l'avatar només s'informa a la barra taronja.
 *
 * Una imatge va a la capçalera, a l'avatar o a les dues. Cada destí passa per
 * useHeroImageHandler, el mateix camí que la closca (només imatges; 1200 px la
 * capçalera, 600 l'avatar; pujada per `onImageUpload`, l'adaptador del Perfil)
 * i es desa amb `onDesaCamp(camp, valor)`, que s'espera abans del destí
 * següent. Sense cap error, tanca amb el motiu 'desat'; amb error, l'avís ix
 * per `onError` i el diàleg continua obert. `ambAvatar` mostra «Llevar
 * l’avatar»: sense el logotip damunt del nom, és l'únic lloc de la fitxa on
 * es pot buidar.
 *
 * Onada 4 · T3 (RETALLADOR.txt §3, AV.txt §8) · L'avatar s'enquadra abans de
 * pujar: «Triar la imatge» → selector → el retallador en quadrat
 * (useEnquadramentAvatar) → la mateixa pujada, amb UN sol fitxer, el retallat.
 * A «La mateixa per a les dues» només es retalla l'avatar: la capçalera puja
 * la foto sencera, com sempre. Cancel·lar el retallador no puja res (tampoc
 * la capçalera), l'avatar d'abans queda com estava i el focus torna a
 * «Triar la imatge».
 */
export function DialegCapcaleraAvatar({ obert, onTanca, onDesaCamp, onImageUpload = null, onError, ambAvatar = false }) {
  const [desti, setDesti] = useState('capcalera');
  const [treballant, setTreballant] = useState(false);
  const input = useRef(null);
  const fallada = useRef(false);
  /* L'últim error, per a ensenyar-lo també dins del retallador: el modal tapa el toast. */
  const darrerError = useRef(null);
  /* La promesa del desat: el destí següent i el tancament l'esperen
     (saveRemote no rebutja: els seus errors ja ixen en toast). */
  const desat = useRef(null);
  /* La foto triada mentre el retallador és obert, amb els destins que ja han
     arribat al servidor: si l'avatar falla després de la capçalera, tornar a
     desar només puja el que falta. */
  const enCurs = useRef(null);
  const comu = {
    onSaveField: (camp, valor) => { desat.current = Promise.resolve(onDesaCamp?.(camp, valor)); },
    onImageUpload,
    onError: (missatge) => { fallada.current = true; darrerError.current = missatge; onError?.(missatge); },
  };
  const capcalera = useHeroImageHandler({ ...comu, fieldName: 'heroImage' });
  const avatar = useHeroImageHandler({ ...comu, fieldName: 'logoImage' });

  /* Esc s'accepta sempre: el navegador (CloseWatcher) pot tancar el <dialog>
     pel seu compte i, si ací el descartàrem, `obert` quedaria a true amb el
     diàleg tancat. La pujada continua i, si acaba bé, avisa amb 'desat'. */
  const tanca = (motiu) => { if (!treballant || motiu === 'esc') onTanca?.(motiu); };

  /* Tancar el selector de fitxers sense triar dispara `cancel` a l'input, i
     puja fins al <dialog>: Dialeg el prendria per un Esc i tancaria el
     diàleg sencer. Es para ací, a l'input (React només escolta `cancel` al
     <dialog>). L'input està sempre muntat: Dialeg pinta els fills tancat. */
  useEffect(() => {
    const el = input.current;
    if (!el) return undefined;
    const para = (e) => e.stopPropagation();
    el.addEventListener('cancel', para);
    return () => el.removeEventListener('cancel', para);
  }, []);

  /* Cada pas és [camp, fitxer, opcions?]. En sèrie, no en paral·lel: el desat
     de la capçalera acaba abans que comence la pujada de l'avatar, i un error
     para la resta. Torna true si tots han arribat. */
  const desaPassos = async (passos, fets = null) => {
    fallada.current = false;
    darrerError.current = null;
    setTreballant(true);
    try {
      for (const [camp, fitxer, opcions] of passos) {
        desat.current = null;
        await (camp === 'heroImage' ? capcalera : avatar).handleFileChange(ambFitxer(fitxer), opcions);
        if (fallada.current) break;
        await desat.current;
        fets?.add(camp);
      }
    } finally {
      setTreballant(false);
    }
    return !fallada.current;
  };

  const enquadrament = useEnquadramentAvatar({
    onError,
    /* L'avatar ja retallat i, a «les dues», la capçalera amb la foto sencera.
       Si falla, llança: el missatge ix dins del retallador, que continua obert. */
    onEnquadrat: async (retallat) => {
      if (!enCurs.current) throw new Error(ERROR_DESAT);
      const { original, camps, fets } = enCurs.current;
      const passos = camps.filter((camp) => !fets.has(camp))
        .map((camp) => (camp === 'logoImage' ? [camp, retallat] : [camp, original, ORIGINAL_ACCEPTADA]));
      if (!(await desaPassos(passos, fets))) throw new Error(darrerError.current || ERROR_DESAT);
      enCurs.current = null;
      onTanca?.('desat');
    },
  });

  const enTria = async (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    if (!fitxer) return;
    const camps = DESTINS_IMATGE.find((d) => d.valor === desti)?.camps || [];
    if (camps.includes('logoImage')) {
      enCurs.current = { original: fitxer, camps, fets: new Set() };
      if (!enquadrament.obri(fitxer)) enCurs.current = null;
      return;
    }
    if (await desaPassos(camps.map((camp) => [camp, fitxer]))) onTanca?.('desat');
  };

  const llevaAvatar = async () => {
    setTreballant(true);
    try {
      await onDesaCamp?.('logoImage', '');
    } finally {
      setTreballant(false);
    }
    onTanca?.('desat');
  };

  return (
    <>
      <Dialeg
        obert={obert}
        onTanca={tanca}
        titol="Capçalera i avatar"
        descripcio="Tria on va la imatge. L’avatar és la foto que acompanya el nom a la barra taronja; abans de desar-lo, l’enquadraràs en un quadrat."
        mida="s"
        accions={(
          <>
            <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={treballant}>Cancel·lar</Boto>
            {ambAvatar ? <Boto varietat="perill" onClick={llevaAvatar} disabled={treballant}>Llevar l’avatar</Boto> : null}
            <Boto varietat="primari" carregant={treballant} onClick={() => input.current?.click()}>Triar la imatge</Boto>
          </>
        )}
      >
        <GrupOpcions llegenda="On va la imatge" opcions={DESTINS_IMATGE} valor={desti} onCanvi={setDesti} disabled={treballant} />
        <input ref={input} type="file" accept="image/*" onChange={enTria} className="sdp-nomes-lector" tabIndex={-1} aria-hidden="true" />
      </Dialeg>
      {/* Germà i no fill: un altre <dialog> modal damunt d'este (la pila de
          Dialeg també ho resol en un encastament). */}
      {enquadrament.dialeg}
    </>
  );
}

export default DialegCapcaleraAvatar;
