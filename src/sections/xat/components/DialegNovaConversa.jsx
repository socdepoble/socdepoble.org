/**
 * DialegNovaConversa.jsx — el diàleg «Nova conversa» (captura 19.12.49 de
 * WhatsApp Desktop, onada 3). Substituïx el padró en línia de la llista.
 *
 * Sobre el Dialeg de Pedra Seca (<dialog> natiu: capa superior, trampa de
 * focus, Escape i retorn del focus al «+» que l'ha obert). De dalt a baix:
 *   · el cercador, amb el focus posat, i el ⊗ que l'esborra;
 *   · la targeta «Nou grup» · «Nova comunitat»: cap RPC en crea cap, i per
 *     això obrin, DINS del diàleg, un panell honest que diu d'on naixen (una
 *     Pàgina Universal i «Comentar») amb el camí al Mur i a Pobles;
 *   · sense cerca, només «Sóc de Poble» i «IAIA MarIA» (la IAIA, no, amb
 *     `senseIAIA`: el nivell d'IA a 0, Onada 6);
 *   · amb cerca, freqüents, un mateix i padró en seccions alfabètiques.
 * Els contactes d'ajuda sense destinatari connectat es mostren inactius.
 * El cercador filtra totes les seccions amb el plegat de /cerca (indexCerca):
 * «jose» troba «José». El padró es demana al servidor en obrir (fins a 100)
 * i, amb un terme, també amb el terme; les dues respostes es fusionen.
 *
 * Escriure't a tu mateix: cap backend no obri encara el fil 'personal'
 * (localXat ho rebutja i cap RPC el crea). Si ja n'hi ha un a la llista,
 * s'obri; si no, la fila ho diu en lloc de fallar.
 *
 * Mentre el servidor no ha respost per al terme escrit, es diu que carrega i
 * no «Cap contacte»: el padró local només en porta 100 i la persona pot ser
 * al servidor. Si obrir la conversa falla (`errorObrir`), l'avís es pinta ACÍ
 * DINS: un toast quedaria davall del <dialog> modal, inert i tapat pel vel.
 *
 * Sense sessió, «Entrar» porta a l'entrada amb rutaDEntrada (T4): `tornar` és
 * la ruta del Xat (amb la consulta) on es torna després d'entrar.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleX, Search, Users, UsersRound } from 'lucide-react';
import { Dialeg } from '../../../components/PedraSeca/index.js';
import { Avatar } from '../../../components/PedraSeca/index.js';
import { rutaDEntrada } from '../../../config/rutaEntrada.js';
import { fitxes as fitxesDeConsulta, plega } from '../../search/indexCerca.js';
import FilaPersona from './FilaPersona.jsx';
import { contactesDAjuda, senseContacteDeLaIAIA } from '../contactesAjuda.js';

const CAP = Object.freeze([]);
const idDe = (membre) => String(membre?.usuari_id ?? membre?.usuariId ?? '');

/* La lletra de la secció: la inicial plegada («Àngels» va a la A). */
function lletraDe(nom) {
  const inicial = plega(nom).trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(inicial) ? inicial : '#';
}

function casa(nom, llistaFitxes) {
  if (!llistaFitxes.length) return true;
  const plegat = plega(nom);
  return llistaFitxes.every((fitxa) => plegat.includes(fitxa));
}

function Seccio({ titol, children }) {
  return (
    <section className="sdp-xat-seccio">
      <h3 className="sdp-xat-seccio__titol">{titol}</h3>
      {children}
    </section>
  );
}

export default function DialegNovaConversa(props) {
  const { obert, onTanca, t } = props;
  const campRef = useRef(null);
  /* El focus al cercador, no a la creu. Els efectes del pare corren després
     dels del fill: quan arriba este, el Dialeg ja ha cridat showModal() i el
     camp ja es pot enfocar (abans, dins d'un <dialog> tancat, no). */
  useEffect(() => { if (obert) campRef.current?.focus(); }, [obert]);
  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={t('section.xat.nou.titol', 'Nova conversa')}
      mida="s"
      className="sdp-xat-dialeg"
    >
      {obert ? <Contingut {...props} campRef={campRef} /> : null}
    </Dialeg>
  );
}

function Contingut({
  t, cercaMembres, contactesFrequents = CAP, joId = null, joNom = null, filPersonal = null,
  onTriaMembre, obrintAmb = null, onObriFil, onVes, campRef, errorObrir = null, senseSessio = false, tornar,
  senseIAIA = false
}) {
  const [terme, setTerme] = useState('');
  const [perId, setPerId] = useState(() => new Map());
  /* L'últim terme (net) per al qual el servidor ja ha respost: fins llavors,
     carrega. Null: encara no ha respost res. */
  const [resolt, setResolt] = useState(null);
  const [error, setError] = useState(null);
  const [panell, setPanell] = useState(null);
  const [avisPersonal, setAvisPersonal] = useState(false);
  const panellRef = useRef(null);

  /* En obrir el panell honest, el focus hi entra; en tornar, al cercador. */
  useEffect(() => {
    if (panell) panellRef.current?.focus();
    else campRef.current?.focus();
  }, [panell, campRef]);

  /* El padró: tot en obrir i, amb un terme, també el que torna el servidor
     per a eixe terme (un poble de més de 100 persones). Es fusiona per id. */
  useEffect(() => {
    let viu = true;
    const net = terme.trim();
    const temporitzador = setTimeout(() => {
      setError(null);
      Promise.resolve()
        .then(() => cercaMembres(net || null))
        .then((llista) => {
          if (!viu) return;
          setPerId((previ) => {
            const nou = new Map(previ);
            for (const membre of Array.isArray(llista) ? llista : []) {
              const id = idDe(membre);
              if (id) nou.set(id, membre);
            }
            return nou;
          });
        })
        .catch((e) => { if (viu) setError(e?.message || t('section.xat.padro.error', "No s'ha pogut obrir el padró")); })
        .finally(() => { if (viu) setResolt(net); });
    }, net ? 250 : 0);
    return () => { viu = false; clearTimeout(temporitzador); };
  }, [terme, cercaMembres, t]);

  const carregant = resolt !== terme.trim();
  const llistaFitxes = useMemo(() => fitxesDeConsulta(terme), [terme]);
  const cercant = llistaFitxes.length > 0;
  const jo = joId == null ? '' : String(joId);

  const frequents = useMemo(
    () => (cercant && Array.isArray(contactesFrequents) ? contactesFrequents : CAP)
      .filter((m) => idDe(m) !== jo && casa(m.nom, llistaFitxes)),
    [contactesFrequents, jo, llistaFitxes, cercant]
  );

  /* Onada 6 (tasca 12) · Amb el nivell d'IA a 0, la IAIA no és enlloc: ni
     entre els contactes d'ajuda ni en el padró que es cerca. */
  const seccions = useMemo(() => {
    const padro = senseIAIA ? senseContacteDeLaIAIA([...perId.values()]) : [...perId.values()];
    const candidates = cercant ? padro : contactesDAjuda(padro, { senseIAIA });
    const persones = candidates
      .filter((m) => idDe(m) !== jo && typeof m.nom === 'string' && m.nom.trim() && casa(m.nom, llistaFitxes))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'ca'));
    const perLletra = new Map();
    for (const membre of persones) {
      const lletra = lletraDe(membre.nom);
      if (!perLletra.has(lletra)) perLletra.set(lletra, []);
      perLletra.get(lletra).push(membre);
    }
    return [...perLletra.entries()];
  }, [perId, jo, llistaFitxes, cercant, senseIAIA]);

  const nomJo = joNom || t('section.xat.nou.jo', 'Jo');
  const etiquetaTu = t('section.xat.nou.tu', '{nom} (Tu)').replace('{nom}', nomJo);
  const joCasa = Boolean(jo) && cercant && casa(`${nomJo} ${t('section.xat.nou.jo', 'Jo')}`, llistaFitxes);
  const hiHaPadro = seccions.length > 0;

  const triaJo = () => {
    if (filPersonal != null) onObriFil(filPersonal);
    else setAvisPersonal(true);
  };

  if (panell) {
    return (
      <div className="sdp-xat-dialeg__panell" ref={panellRef} tabIndex={-1}>
        <p>{t('section.xat.nou.pagina', "Els grups i les comunitats naixen d'una Pàgina Universal. Obri la pàgina d'un element, d'una entitat o d'un poble i prem «Comentar».")}</p>
        <div className="sdp-xat-dialeg__accions">
          <button type="button" className="sdp-xat-pindola" onClick={() => onVes('/mur')}>
            {t('section.xat.nou.anarMur', 'Anar al Mur')}
          </button>
          <button type="button" className="sdp-xat-pindola" onClick={() => onVes('/pobles')}>
            {t('section.xat.nou.anarPobles', 'Anar a Pobles')}
          </button>
          <button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria" onClick={() => setPanell(null)}>
            {t('section.xat.nou.tornar', 'Tornar')}
          </button>
        </div>
      </div>
    );
  }

  const etiquetaCerca = t('section.xat.nou.cerca', 'Nom del contacte');

  return (
    <div className="sdp-xat-dialeg__cos">
      <div className="sdp-xat-cerca__camp sdp-xat-dialeg__cerca">
        <label className="sdp-xat-cerca__etiqueta">
          <span className="sdp-nomes-lector">{etiquetaCerca}</span>
          <Search size={20} aria-hidden="true" focusable="false" />
          <input
            ref={campRef}
            type="search"
            name="xatNouContacte"
            autoComplete="off"
            value={terme}
            placeholder={etiquetaCerca}
            onChange={(e) => setTerme(e.target.value)}
            onKeyDown={(e) => {
              /* Amb text, Escape esborra; buit, el deixa passar i tanca el diàleg. */
              if (e.key === 'Escape' && terme) { e.preventDefault(); e.stopPropagation(); setTerme(''); }
            }}
          />
        </label>
        {terme ? (
          <button
            type="button"
            className="sdp-xat-icona"
            aria-label={t('section.xat.nou.esborra', 'Esborra la cerca')}
            onClick={() => { setTerme(''); campRef.current?.focus(); }}
          >
            <CircleX size={20} aria-hidden="true" focusable="false" />
          </button>
        ) : null}
      </div>

      {errorObrir ? <p className="sdp-xat-avis" role="alert">{errorObrir}</p> : null}
      {senseSessio ? <p className="sdp-xat-avis" role="status">
        {t('section.xat.sessio.calEntrar', 'Entra per buscar persones i enviar missatges.')}
        {' '}<button type="button" className="sdp-xat-pindola" onClick={() => onVes(rutaDEntrada({ tornar }))}>
          {t('section.xat.sessio.entrar', 'Entrar')}
        </button>
      </p> : null}

      {!cercant ? (
        <ul className="sdp-xat-llista sdp-xat-targeta">
          <li>
            <button type="button" className="sdp-xat-opcio-accio" onClick={() => setPanell('grup')}>
              <Users size={24} aria-hidden="true" focusable="false" />
              <span>{t('section.xat.nou.grup', 'Nou grup')}</span>
            </button>
          </li>
          <li>
            <button type="button" className="sdp-xat-opcio-accio" onClick={() => setPanell('comunitat')}>
              <UsersRound size={24} aria-hidden="true" focusable="false" />
              <span>{t('section.xat.nou.comunitat', 'Nova comunitat')}</span>
            </button>
          </li>
        </ul>
      ) : null}

      {frequents.length ? (
        <Seccio titol={t('section.xat.nou.frequents', 'Contactes freqüents')}>
          <ul className="sdp-xat-llista sdp-xat-targeta">
            {frequents.map((membre) => (
              <li key={`f-${idDe(membre)}`}>
                <FilaPersona membre={membre} obrint={obrintAmb === membre.usuari_id} onSelect={onTriaMembre} t={t} />
              </li>
            ))}
          </ul>
        </Seccio>
      ) : null}

      {joCasa || hiHaPadro ? (
        <Seccio titol={t('section.xat.nou.contactes', 'Contactes a Sóc de Poble')}>
          {joCasa ? (
            <div className="sdp-xat-targeta">
              <button type="button" className="sdp-xat-fila" onClick={triaJo} aria-describedby={avisPersonal ? 'xat-nou-avis-personal' : undefined}>
                <Avatar nom={nomJo} mida="md" llavor={joId} alt="" />
                <span className="sdp-xat-fila__cos">
                  <span className="sdp-xat-fila__cap">
                    <span className="sdp-xat-fila__nom">{etiquetaTu}</span>
                  </span>
                  <span className="sdp-xat-fila__peu">
                    <span className="sdp-xat-fila__previa">{t('section.xat.nou.tuMateix', "Envia't missatges a tu mateix")}</span>
                  </span>
                </span>
              </button>
              {avisPersonal ? (
                <p id="xat-nou-avis-personal" className="sdp-xat-avis" role="status">
                  {t('section.xat.nou.personalNo', "Encara no pots escriure't a tu mateix: este poble no obri el xat personal.")}
                </p>
              ) : null}
            </div>
          ) : null}
          {seccions.map(([lletra, membres]) => (
            <section key={lletra} className="sdp-xat-seccio">
              <h4 className="sdp-xat-seccio__titol">{lletra}</h4>
              <ul className="sdp-xat-llista sdp-xat-targeta">
                {membres.map((membre) => (
                  <li key={idDe(membre)}>
                    <FilaPersona membre={membre} obrint={obrintAmb === membre.usuari_id} onSelect={onTriaMembre} t={t} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </Seccio>
      ) : null}

      {carregant && (!cercant || !hiHaPadro) ? (
        <p className="sdp-workspace-state" role="status" aria-live="polite">{t('section.xat.padro.carregant', 'Carregant la gent del poble…')}</p>
      ) : null}
      {error ? (
        <div className="sdp-workspace-state" role="alert">
          <strong>{t('section.xat.padro.error', "No s'ha pogut obrir el padró")}</strong>
          <p>{error}</p>
        </div>
      ) : null}
      {!carregant && !error && cercant && !hiHaPadro && !frequents.length && !joCasa ? (
        <p className="sdp-workspace-state" role="status">{t('section.xat.nou.capContacte', 'Cap contacte amb eixe nom.')}</p>
      ) : null}
      {!carregant && !error && !cercant && !hiHaPadro ? (
        <p className="sdp-workspace-state" role="status">{t('section.xat.padro.buit', 'Encara no hi ha ningú més al poble amb qui parlar.')}</p>
      ) : null}
    </div>
  );
}
