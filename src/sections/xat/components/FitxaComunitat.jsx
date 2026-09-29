/**
 * FitxaComunitat.jsx — la fitxa d'una comunitat a la COLUMNA DE LLISTA (T67,
 * captures 19.42.54 i 19.43.00 de WhatsApp Desktop). S'obri amb
 * /xat?comunitat=<id> perquè el rail també la puga obrir.
 *
 * De dalt a baix: la capçalera (avatar quadrat, nom i «Comunitat»), la fila
 * «Avisos», l'encapçalament «Grups als quals pertanys» amb les files dels
 * grups, el text d'estat buit al peu i el botó en píndola a tota l'amplària
 * «+ Afegir grup». Una comunitat no té missatges: clicar Avisos o un grup
 * obri la seua conversa.
 *
 * «Afegir grup» no promet res que no es puga fer: els grups naixen d'una
 * Pàgina Universal («Comentar»), i el botó ho diu (`onAfegirGrup`).
 */
import { Plus } from 'lucide-react';
import FilaConversa, { AvatarComunitat } from './FilaConversa.jsx';

export default function FitxaComunitat({ comunitat, filActiuId = null, onObriFil, onAfegirGrup, locale, t, joId = null }) {
  const { fil, fills = [] } = comunitat;
  const nom = fil.name || fil.title || t('section.xat.conversaSenseNom', 'Conversa');
  const canals = fills.filter((f) => f.tipus === 'canal');
  const grups = fills.filter((f) => f.tipus !== 'canal');
  const fila = (f) => (
    <li key={f.id}>
      <FilaConversa
        fil={f}
        activa={filActiuId != null && String(f.id) === String(filActiuId)}
        onSelect={onObriFil}
        locale={locale}
        t={t}
        joId={joId}
      />
    </li>
  );

  return (
    <section className="sdp-xat-fitxa-comunitat" aria-label={nom}>
      <header className="sdp-xat-fitxa-comunitat__cap">
        <AvatarComunitat fil={fil} nom={nom} />
        <div className="sdp-xat-fitxa-comunitat__identitat">
          <strong className="sdp-xat-fitxa-comunitat__nom">{nom}</strong>
          <span className="sdp-xat-fitxa-comunitat__tipus">{t('section.xat.comunitat.etiqueta', 'Comunitat')}</span>
        </div>
      </header>
      <div className="sdp-xat-fitxa-comunitat__cos">
        {canals.length ? <ul className="sdp-xat-llista">{canals.map(fila)}</ul> : null}
        <h3 className="sdp-xat-seccio__titol">{t('section.xat.comunitat.grups', 'Grups als quals pertanys')}</h3>
        {grups.length ? <ul className="sdp-xat-llista">{grups.map(fila)}</ul> : null}
        <p className="sdp-xat-fitxa-comunitat__buit">
          {t('section.xat.comunitat.buit', "Els grups que s'afegisquen a la comunitat apareixeran ací. Els membres de la comunitat s'hi podran unir.")}
        </p>
      </div>
      <div className="sdp-xat-fitxa-comunitat__peu">
        <button type="button" className="sdp-xat-pindola" onClick={onAfegirGrup}>
          <Plus size={20} aria-hidden="true" focusable="false" />
          <span>{t('section.xat.comunitat.afegirGrup', 'Afegir grup')}</span>
        </button>
      </div>
    </section>
  );
}
