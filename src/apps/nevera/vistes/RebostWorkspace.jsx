import { useMemo } from 'react';
import { Link } from '../../../app/contexts/RouterContext';
import { Boto, Fila } from '../../../components/PedraSeca/index.js';
import { CatalegWorkspace, DetallCataleg } from '../../../components/universal/workspace/index.js';
import { autoriaDArticle } from './autoria.js';
import { AvisNevera } from './AvisNevera.jsx';
import { useVistaNevera } from './context.js';
import { TEXTOS_CASA } from './vestits.js';
import { modelRebostWorkspace } from './modelRebostWorkspace.js';

export function RebostWorkspace({ params = {} }) {
  const { estat, accions, llistaVigent, ruta, llegit, mode } = useVistaNevera();
  const model = useMemo(() => modelRebostWorkspace(estat), [estat]);
  const llista = llistaVigent(params);
  const potEscriure = llegit && mode !== 'lectora';
  const renderDetail = ({ item }) => {
    const article = item?.dades;
    const aCasa = article ? estat.casa.find(entrada => entrada.articleId === article.id) : null;
    const aLaLlista = article ? llista.linies.some(linia => linia.articleId === article.id) : false;
    return <DetallCataleg title={item?.title || 'Rebost'} subtitle={item?.subtitle || 'La Nevera de Casa'}
      lead={item?.lead || 'El catàleg, el que tens a casa i la compra comparteixen el mateix espai.'}
      author={article ? autoriaDArticle(article) : null} rellotgeViu showShare={false} showConnect={false} showComment={false}>
      <p><Link to={ruta('llista', llista.id)}>{`Obri la compra · ${llista.nom}`}</Link>{' · '}
        <Link to={ruta('casa', llista.id)}>Què tinc a casa?</Link></p>
      <AvisNevera sempre />
      {article ? <>
        <h3>El teu rebost</h3>
        <p>{aCasa ? TEXTOS_CASA[aCasa.estat] : 'Este article encara no està marcat a casa.'}</p>
        <Fila justify="center">
          {Object.entries(TEXTOS_CASA).map(([valor, etiqueta]) => <Boto key={valor} disabled={!potEscriure}
            aria-pressed={aCasa?.estat === valor} onClick={() => accions.marcaACasa(article.id, valor)}>{etiqueta}</Boto>)}
          {aCasa && <Boto disabled={!potEscriure} onClick={() => accions.marcaACasa(article.id, null)}>Deixa de seguir-lo</Boto>}
          <Boto disabled={!potEscriure || aLaLlista} onClick={() => accions.afig(llista.id, article.id)}>
            {aLaLlista ? `Ja és a «${llista.nom}»` : `Afig a «${llista.nom}»`}
          </Boto>
        </Fila>
        <h3>Informació del producte</h3>
        <p>Els al·lèrgens i les traces són desconeguts sense l’etiqueta actual del producte. El nom comercial no acredita la composició.</p>
      </> : <><h3>Catàleg i carpetes</h3><p>Tria una categoria o un article per a consultar-lo ací, marcar què en tens i afegir-lo a la compra.</p></>}
    </DetallCataleg>;
  };
  return <CatalegWorkspace font="nevera" destiPublicacio="rebost" id="nevera-rebost-p069" model={model} ruta={ruta('rebost')} privateItems
    labels={{ categories: 'Categories del rebost', items: 'Rebost', all: 'Tot el catàleg', search: 'Busca al rebost…', empty: 'Encara no hi ha articles', noResults: 'No hi ha coincidències' }}
    renderDetail={renderDetail} />;
}
