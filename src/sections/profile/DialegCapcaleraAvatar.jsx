import { useEffect, useRef, useState } from 'react';
import { Dialeg, Boto, GrupOpcions } from '../../components/PedraSeca';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';

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
 */
export function DialegCapcaleraAvatar({ obert, onTanca, onDesaCamp, onImageUpload = null, onError, ambAvatar = false }) {
  const [desti, setDesti] = useState('capcalera');
  const [treballant, setTreballant] = useState(false);
  const input = useRef(null);
  const fallada = useRef(false);
  /* La promesa del desat: el destí següent i el tancament l'esperen
     (saveRemote no rebutja: els seus errors ja ixen en toast). */
  const desat = useRef(null);
  const comu = {
    onSaveField: (camp, valor) => { desat.current = Promise.resolve(onDesaCamp?.(camp, valor)); },
    onImageUpload,
    onError: (missatge) => { fallada.current = true; onError?.(missatge); },
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

  const enTria = async (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    if (!fitxer) return;
    const camps = DESTINS_IMATGE.find((d) => d.valor === desti)?.camps || [];
    fallada.current = false;
    setTreballant(true);
    try {
      /* En sèrie, no en paral·lel: el desat de la capçalera acaba abans que
         comence la pujada de l'avatar, i un error para la resta. */
      for (const camp of camps) {
        desat.current = null;
        await (camp === 'heroImage' ? capcalera : avatar).handleFileChange(ambFitxer(fitxer));
        if (fallada.current) break;
        await desat.current;
      }
    } finally {
      setTreballant(false);
    }
    if (!fallada.current) onTanca?.('desat');
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
    <Dialeg
      obert={obert}
      onTanca={tanca}
      titol="Capçalera i avatar"
      descripcio="Tria on va la imatge. L’avatar és la foto que acompanya el nom a la barra taronja."
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
  );
}

export default DialegCapcaleraAvatar;
