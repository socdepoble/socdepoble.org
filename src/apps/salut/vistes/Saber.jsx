/**
 * Saber.jsx — el diccionari i la guia.
 *
 *   /diccionari(/:entitat)   mig: les entitats · detall: els seus camps (la taula del diccionari.js)
 *   /guia(/:apartat)         mig: els apartats · detall: el text
 * El diccionari de la pantalla és el mateix que va a la fulla «Diccionari» de l'XLSX.
 */
import { LlistaArticles, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { ENTITATS } from '../nucli/diccionari.js';
import { textValorsAdmesos } from '../nucli/full.js';
import { APARTATS_GUIA, FINALITAT } from '../textos.js';
import { MarcSalut, useNavegaSalut } from './comunes.jsx';

export function Entitats({ params }) {
  const navega = useNavegaSalut();
  const articles = ENTITATS.map((entitat) => ({
    id: entitat.id, nom: entitat.nom, secundari: entitat.definicio, categoriaId: 'diccionari', estat: params?.entitat === entitat.id ? 'en-colleccio' : 'normal'
  }));
  return (
    <MarcSalut titol="Diccionari" columna="mig">
      <LlistaArticles articles={articles} etiqueta="Què s’apunta" textos={{ 'en-colleccio': 'Obert' }} onTria={(article) => navega(['diccionari', article.id])} />
    </MarcSalut>
  );
}

export function CampsEntitat({ params }) {
  const entitat = ENTITATS.find((candidata) => candidata.id === params?.entitat);
  if (!entitat) {
    return (
      <MarcSalut titol="Diccionari">
        <Pila gap={4}>
          <p>Cada cosa que s’apunta té una definició planera i el perquè. És el mateix que trobarà el metge a la fulla «Diccionari» del full.</p>
          <p>{FINALITAT}</p>
        </Pila>
      </MarcSalut>
    );
  }
  return (
    <MarcSalut titol={entitat.nom}>
      <Pila gap={4}>
        <p>{entitat.definicio}</p>
        <Taula titol={`Camps de ${entitat.nom}`}>
          <thead>
            <tr><th scope="col">Camp</th><th scope="col">Valors</th><th scope="col">Què és</th><th scope="col">Per què importa</th></tr>
          </thead>
          <tbody>
            {entitat.camps.map((camp) => (
              <tr key={camp.clau}>
                <th scope="row">{camp.etiqueta}</th>
                <td>{textValorsAdmesos(camp) || '—'}</td>
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
  const articles = APARTATS_GUIA.map((apartat) => ({
    id: apartat.id, nom: apartat.titol, categoriaId: 'guia', estat: params?.apartat === apartat.id ? 'en-colleccio' : 'normal'
  }));
  return (
    <MarcSalut titol="Guia" columna="mig">
      <LlistaArticles articles={articles} etiqueta="Apartats de la guia" textos={{ 'en-colleccio': 'Obert' }} onTria={(article) => navega(['guia', article.id])} />
    </MarcSalut>
  );
}

export function TextGuia({ params }) {
  const apartat = APARTATS_GUIA.find((candidat) => candidat.id === params?.apartat) || APARTATS_GUIA[0];
  return (
    <MarcSalut titol={apartat.titol}>
      <Pila gap={4}>
        {apartat.paragrafs.map((paragraf) => <p key={paragraf}>{paragraf}</p>)}
      </Pila>
    </MarcSalut>
  );
}
