import fs from 'fs';
import path from 'path';
import https from 'https';

const TOWNS = [
    "Penàguila", "Benifallim", "La Torre de les Maçanes", 
    "Sella", "Orxeta", "Relleu", "Alcoleja", "Xixona", "Tibi"
];

// Noms exactes dels articles a la Viquipèdia (en català)
const WIKI_ARTICLES = {
    "La Torre de les Maçanes": "La Torre de les Maçanes",
    "Xixona": "Xixona",
    "Alcoleja": "Alcoleja",
    "Orxeta": "Orxeta",
    "Benifallim": "Benifallim",
    "Penàguila": "Penàguila",
    "Sella": "Sella (Marina Baixa)", // Corregit per a desambiguació si n'hi haguera
    "Relleu": "Relleu",
    "Tibi": "Tibi"
};

const BASE_DIR = path.join(process.cwd(), 'public/assets/towns');

if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR, { recursive: true });
}

const isBadImage = (url) => {
    if (!url) return true;
    const lurl = decodeURIComponent(url).toLowerCase();
    return lurl.includes('.svg') || lurl.includes('.gif') || lurl.includes('escut') || lurl.includes('escudo') || 
           lurl.includes('mapa') || lurl.includes('map') || lurl.includes('bandera') || 
           lurl.includes('flag') || lurl.includes('locator') || lurl.includes('location') ||
           lurl.includes('localitzaci') || lurl.includes('situaci') ||
           lurl.includes('grafic') || lurl.includes('graph') || lurl.includes('poblacio') ||
           lurl.includes('plan') || lurl.includes('logo') || lurl.includes('icon');
};

const sanitizeSlug = (name) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^\w-]/g, '');
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));

const downloadImage = async (url, destPath) => {
    await wait(500); 
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'SocDePoble/2.0 AgentFetcher (bot@socdepoble.org)' } }, (res) => {
            if (res.statusCode !== 200) {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
                }
                return reject(new Error(`Failed to GET ${url} (${res.statusCode})`));
            }
            const file = fs.createWriteStream(destPath);
            res.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', reject);
    });
};

const apiCall = async (apiUrl) => {
    await wait(1000); 
    return new Promise((resolve, reject) => {
        https.get(apiUrl, { headers: { 'User-Agent': 'SocDePoble/2.0 AgentFetcher (bot@socdepoble.org)' } }, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch {
                    reject(new Error(`Invalid JSON from API: ${data.substring(0, 50)}...`));
                }
            });
        }).on('error', reject);
    });
};

const fetchTownImages = async (townName) => {
    const slug = sanitizeSlug(townName);
    const townDir = path.join(BASE_DIR, slug);
    if (!fs.existsSync(townDir)) {
        fs.mkdirSync(townDir, { recursive: true });
    }

    const articleTitle = WIKI_ARTICLES[townName] || townName;

    // 1. Cercar primer a la pàgina de la Viquipèdia (en valencià/català)
    console.log(`[*] Cercant imatges a l'article de la Viquipèdia per a: ${articleTitle}...`);
    const wikiUrl = `https://ca.wikipedia.org/w/api.php?action=query&prop=imageinfo&generator=images&gimlimit=50&redirects=1&titles=${encodeURIComponent(articleTitle)}&iiprop=url&iiurlwidth=1200&format=json&origin=*`;
    
    let images = [];
    try {
        const parsed = await apiCall(wikiUrl);
        const pages = parsed.query?.pages;
        if (pages) {
            images = Object.values(pages)
                .map(p => {
                    const info = p.imageinfo?.[0];
                    return info?.thumburl || info?.url;
                })
                .filter(url => url && !isBadImage(url));
        }
    } catch (e) {
        console.warn(`[!] Error cercant a Viquipèdia: ${e.message}`);
    }

    // 2. Si falten imatges, busquem a Wikimedia Commons de manera segura (sense ORs solts)
    if (images.length < 2) {
        console.log(`[!] Només s'han trobat ${images.length} imatges a l'article. Ampliant cerca a Commons...`);
        const queryTerm = `intitle:"${townName}"`;
        const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrlimit=50&gsrsearch=${encodeURIComponent(queryTerm)}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;
        try {
            const parsed = await apiCall(commonsUrl);
            const pages = parsed.query?.pages;
            if (pages) {
                const commonsImages = Object.values(pages)
                    .map(p => {
                        const info = p.imageinfo?.[0];
                        return info?.thumburl || info?.url;
                    })
                    .filter(url => url && !isBadImage(url) && !images.includes(url));
                images = [...images, ...commonsImages];
            }
        } catch (e) {
            console.warn(`[!] Error cercant a Commons: ${e.message}`);
        }
    }

    // 3. Fallback super extrem (sense intitle)
    if (images.length < 2) {
        console.log(`[!] Encara falten imatges per a ${townName}. Cerca extrema a Commons...`);
        const superUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrlimit=50&gsrsearch=${encodeURIComponent(townName)}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*`;
        try {
            const parsed = await apiCall(superUrl);
            const pages = parsed.query?.pages;
            if (pages) {
                const superImages = Object.values(pages)
                    .map(p => {
                        const info = p.imageinfo?.[0];
                        return info?.thumburl || info?.url;
                    })
                    .filter(url => url && !isBadImage(url) && !images.includes(url));
                images = [...images, ...superImages];
            }
        } catch (e) {
            console.warn(`[!] Error cercant extrema: ${e.message}`);
        }
    }

    if (images.length === 0) {
        console.error(`[-] No s'han trobat imatges de cap tipus per a ${townName}.`);
        return;
    }

    // Descarregar les 2 primeres imatges
    const max = Math.min(2, images.length);
    for (let i = 0; i < max; i++) {
        const imgUrl = images[i];
        const dest = path.join(townDir, `${i + 1}.jpg`);
        console.log(`[+] Descarregant ${townName} - Imatge ${i+1}: ${imgUrl}`);
        await downloadImage(imgUrl, dest);
    }
    
    // Si només hem trobat 1 imatge (estrany), duplicar-la per evitar errors
    if (images.length === 1) {
        console.log(`[WARN] Només 1 imatge per a ${townName}. Duplicant per a complir amb avatar i hero.`);
        fs.copyFileSync(path.join(townDir, '1.jpg'), path.join(townDir, '2.jpg'));
    }
};

const run = async () => {
    for (const town of TOWNS) {
        try {
            await fetchTownImages(town);
        } catch (e) {
            console.error(`[-] Error processant ${town}:`, e.message);
        }
    }
    console.log("Fi de la descàrrega d'imatges!");
};

run();
