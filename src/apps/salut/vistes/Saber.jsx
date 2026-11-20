/**
 * Saber.jsx — el diccionari i la guia.
 *
 *   /diccionari(/:entitat)   mig: les entitats · detall: els seus camps (la taula del diccionari.js)
 *   /guia(/:apartat)         mig: els apartats · detall: el text
 * El diccionari de la pantalla és el mateix que va a la fulla «Diccionari» de l'XLSX.
 */
import { LlistaArticles, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import { apartatsGuiaSalut, entitatsSalutTraduites, finalitatSalut, textValorsAdmesosSalut } from '../i18nSalut.js';
import { MarcSalut, useNavegaSalut, useTextosSalut } from './comunes.jsx';

export function Entitats({ params }) {
  const navega = useNavegaSalut();
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const entitats = entitatsSalutTraduites(idioma);
  const articles = entitats.map((entitat) => ({
    id: entitat.id, nom: entitat.nom, secundari: entitat.definicio, categoriaId: 'diccionari', estat: params?.entitat === entitat.id ? 'en-colleccio' : 'normal'
  }));
  return (
    <MarcSalut titol={tx.diccionari} columna="mig">
      <LlistaArticles articles={articles} etiqueta={tx.queSApunta} textos={{ 'en-colleccio': tx.obert }} onTria={(article) => navega(['diccionari', article.id])} />
    </MarcSalut>
  );
}

export function CampsEntitat({ params }) {
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const entitat = entitatsSalutTraduites(idioma).find((candidata) => candidata.id === params?.entitat);
  if (!entitat) {
    return (
      <MarcSalut titol={tx.diccionari}>
        <Pila gap={4}>
          <p>{tx.diccionariIntro}</p>
          <p>{finalitatSalut(idioma)}</p>
        </Pila>
      </MarcSalut>
    );
  }
  return (
    <MarcSalut titol={entitat.nom}>
      <Pila gap={4}>
        <p>{entitat.definicio}</p>
        <Taula titol={tx.campsDe(entitat.nom)}>
          <thead>
            <tr><th scope="col">{tx.camp}</th><th scope="col">{tx.valors}</th><th scope="col">{tx.queEs}</th><th scope="col">{tx.perQueImporta}</th></tr>
          </thead>
          <tbody>
            {entitat.camps.map((camp) => (
              <tr key={camp.clau}>
                <th scope="row">{camp.etiqueta}</th>
                <td>{textValorsAdmesosSalut(camp, idioma) || '—'}</td>
                <td>{camp.definicio}</td>
                <td>{camp.perQueImporta}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
      </Pila>
    </MarcSalut>
  );
}

export function ApartatsGuia({ params }) {
  const navega = useNavegaSalut();
  const { idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const apartats = apartatsGuiaSalut(idioma);
  const articles = apartats.map((apartat) => ({
    id: apartat.id, nom: apartat.titol, categoriaId: 'guia', estat: params?.apartat === apartat.id ? 'en-colleccio' : 'normal'
  }));
  return (
    <MarcSalut titol={tx.guia} columna="mig">
      <LlistaArticles articles={articles} etiqueta={tx.apartatsGuia} textos={{ 'en-colleccio': tx.obert }} onTria={(article) => navega(['guia', article.id])} />
    </MarcSalut>
  );
}

export function TextGuia({ params }) {
  const { idioma = 'ca' } = useApp();
  const apartats = apartatsGuiaSalut(idioma);
  const apartat = apartats.find((candidat) => candidat.id === params?.apartat) || apartats[0];
  return (
    <MarcSalut titol={apartat.titol}>
      <Pila gap={4}>
        {apartat.paragrafs.map((paragraf) => <p key={paragraf}>{paragraf}</p>)}
      </Pila>
    </MarcSalut>
  );
}
