/**
 * Inversa UTM sobre GRS80 i aproximació EPSG:1149 d'ETRS89 a WGS84.
 * La incertesa de la presa de dades es conserva a banda de la projecció.
 * Referències: PROJ tmerc i EPSG:1149, publicat a la base de dades de PROJ.
 * https://proj.org/en/stable/operations/projections/tmerc.html
 * https://github.com/OSGeo/PROJ/blob/master/data/sql/helmert_transformation.sql
 */
export function puntWgs84DesDUtmEtrs89(utm) {
  if (utm === null) return null;
  const { fus, x, y } = utm;
  if (!Number.isInteger(fus) || fus < 28 || fus > 38
    || !Number.isFinite(x) || x < 100000 || x > 900000
    || !Number.isFinite(y) || y < 0 || y > 9329005) {
    throw new TypeError('Coordenades ETRS89 UTM invàlides.');
  }
  const semieix = 6378137;
  const aplanament = 1 / 298.257222101;
  const excentricitat2 = aplanament * (2 - aplanament);
  const segonaExcentricitat2 = excentricitat2 / (1 - excentricitat2);
  const escala = 0.9996;
  const arc = y / escala;
  const mu = arc / (semieix * (1 - excentricitat2 / 4
    - 3 * excentricitat2 ** 2 / 64 - 5 * excentricitat2 ** 3 / 256));
  const arrel = Math.sqrt(1 - excentricitat2);
  const e1 = (1 - arrel) / (1 + arrel);
  const peu = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu)
    + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu)
    + 151 * e1 ** 3 / 96 * Math.sin(6 * mu)
    + 1097 * e1 ** 4 / 512 * Math.sin(8 * mu);
  const sinus = Math.sin(peu);
  const cosinus = Math.cos(peu);
  const tangent = Math.tan(peu);
  const normal = semieix / Math.sqrt(1 - excentricitat2 * sinus ** 2);
  const radi = semieix * (1 - excentricitat2) / (1 - excentricitat2 * sinus ** 2) ** 1.5;
  const t = tangent ** 2;
  const c = segonaExcentricitat2 * cosinus ** 2;
  const d = (x - 500000) / (normal * escala);
  const latitud = peu - normal * tangent / radi * (
    d ** 2 / 2 - (5 + 3 * t + 10 * c - 4 * c ** 2 - 9 * segonaExcentricitat2) * d ** 4 / 24
    + (61 + 90 * t + 298 * c + 45 * t ** 2 - 252 * segonaExcentricitat2 - 3 * c ** 2) * d ** 6 / 720
  );
  const longitud = (fus * 6 - 183) + 180 / Math.PI / cosinus * (
    d - (1 + 2 * t + c) * d ** 3 / 6
    + (5 - 2 * c + 28 * t - 3 * c ** 2 + 8 * segonaExcentricitat2 + 24 * t ** 2) * d ** 5 / 120
  );
  const grausLatitud = latitud * 180 / Math.PI;
  if (!Number.isFinite(longitud) || !Number.isFinite(grausLatitud)
    || longitud < -180 || longitud > 180 || grausLatitud < 0 || grausLatitud > 84) {
    throw new TypeError('La projecció ETRS89 queda fora de l’àmbit UTM nord.');
  }
  return Object.freeze([Number(longitud.toFixed(6)), Number(grausLatitud.toFixed(6))]);
}
