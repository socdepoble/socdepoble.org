package org.socdepoble.app;

import android.content.ClipData;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.CancellationSignal;
import android.provider.OpenableColumns;
import androidx.core.content.IntentCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.channels.Channels;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicLong;
import org.json.JSONObject;

/**
 * Receptor del menú «Compartir» d'Android (SEND i SEND_MULTIPLE).
 *
 * BridgeActivity crida onNewIntent(getIntent()) al final del seu onCreate i
 * reenvia cada onNewIntent als connectors, de manera que handleOnNewIntent rep
 * l'arrencada en fred i l'app que ja estava oberta. Les URIs content:// només
 * es poden llegir mentre dura el permís temporal de l'intent: es copien al
 * moment a la memòria cau privada (cacheDir/compartits) i el WebView les llig
 * per l'URL local de Capacitor (/_capacitor_file_). L'esdeveniment es reté fins
 * que el web s'hi subscriu, perquè en fred el JS encara no ha carregat.
 *
 * Gauntlet 261026_1615 (Codex C1615-03/04, Gemini G1615-03):
 *  · la còpia només s'esborra quan el web ho demana (allibera: enviada o
 *    descartada); en arrencar, les que hi queden es tornen a anunciar;
 *  · un proveïdor encallat no bloqueja res: cada compartició té el seu fil (com
 *    a molt tres alhora), cada lectura té termini i interrupció, i hi ha sostres
 *    d'URIs examinades i de text acumulat;
 *  · en destruir el connector, els fils es tanquen.
 *
 * Pla 261028_1526 (Bloc D, P1-31/P1-33):
 *  · cada compartició porta l'hora de l'intent (rebutMs): si la sessió del web
 *    ha canviat després, el web la descarta i n'allibera les còpies;
 *  · un sostre de bytes per compartició, a més del de cada fitxer;
 *  · destruït el connector, la compartició en curs ja no llig res ni avisa, i
 *    cap lectura no es fa sense termini;
 *  · la sessió també té època a esta banda (tallaSessio, que el web crida en
 *    canviar de sessió), desada perquè sobreviu al procés: cada còpia porta la
 *    del seu intent al nom, la compartició que la veu canviar esborra les seues
 *    i plega, i en arrencar no torna cap resta d'una altra època.
 *
 * QA-04 (Codex 261028_1611, residu C28-07): getType i la consulta del nom són
 * crides Binder al proveïdor que la interrupció del vigilant no talla. Van en
 * un fil a banda (consultor, com a molt MAX_CONSULTES_ALHORA) amb termini,
 * CONSULTA_MS: passat, el copiador continua amb el tipus de l'intent i el nom
 * genèric. Cap crida al proveïdor no es fa sense termini.
 */
@CapacitorPlugin(name = "CompartirNatiu")
public class CompartirNatiuPlugin extends Plugin {

    static final String ESDEVENIMENT = "compartit";
    static final String MARCA_CONSUMIT = "org.socdepoble.app.COMPARTIT_CONSUMIT";
    private static final String CARPETA = "compartits";
    private static final int MAX_FITXERS = 10;
    // El sostre del bucket xat_adjunts i de l'adaptador web (natiu/compartirNatiu.js).
    private static final long MAX_BYTES_FITXER = 20L * 1024 * 1024;
    // Tota una compartició: 60 MiB, tres fitxers plens. El valor és decisió pendent del Mestre (P1-33).
    private static final long MAX_BYTES_COMPARTICIO = 60L * 1024 * 1024;
    private static final int MAX_CARACTERS_TEXT = 10000;
    private static final int MAX_URIS_EXAMINADES = 32;
    private static final int MAX_COMPARTICIONS_ALHORA = 3;
    private static final long LECTURA_MS = 20_000;
    private static final long COMPARTICIO_MS = 60_000;
    // QA-04 · getType i query: fils propis i termini (5 + 20 + 5 s per fitxer, dins de COMPARTICIO_MS).
    // Més que els 3 s que ContentResolver.getType ja espera un proveïdor connectat: a un de viu no li talla res.
    private static final int MAX_CONSULTES_ALHORA = 3;
    private static final long CONSULTA_MS = 5_000;
    // Una compartició sense enviar es conserva una setmana (també si l'App es tanca).
    private static final long CADUCITAT_MS = 7L * 24 * 60 * 60 * 1000;
    private static final String PREFERENCIES = "CompartirNatiu";
    private static final String CLAU_SESSIO = "sessio";

    // L'època de la sessió (P1-31): la llig load() i només la puja tallaSessio.
    private final AtomicLong sessio = new AtomicLong();

    private final ExecutorService copiador = new ThreadPoolExecutor(
        0, MAX_COMPARTICIONS_ALHORA, 30, TimeUnit.SECONDS, new SynchronousQueue<>(), CompartirNatiuPlugin::filDeFons);
    private final ScheduledExecutorService vigilant = Executors.newSingleThreadScheduledExecutor(CompartirNatiuPlugin::filDeFons);
    // Fitat i sense cua, com el copiador: tres consultes encallades i la quarta ni es fa.
    private final ExecutorService consultor = new ThreadPoolExecutor(
        0, MAX_CONSULTES_ALHORA, 30, TimeUnit.SECONDS, new SynchronousQueue<>(), CompartirNatiuPlugin::filDeFons);

    private static Thread filDeFons(Runnable tasca) {
        Thread fil = new Thread(tasca, "CompartirNatiu");
        fil.setDaemon(true);
        return fil;
    }

    @Override
    public void load() {
        super.load();
        // L'època desada, abans de cap anunci ni intent.
        sessio.set(preferencies().getLong(CLAU_SESSIO, 0));
        // Abans de cap intent (BridgeActivity el passa després del load): el que
        // es va compartir i encara no s'ha enviat torna a «Envia a…».
        netejaCaducats();
        anunciaPendents();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        copiador.shutdownNow();
        vigilant.shutdownNow();
        consultor.shutdownNow();
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent == null) return;
        String accio = intent.getAction();
        if (!Intent.ACTION_SEND.equals(accio) && !Intent.ACTION_SEND_MULTIPLE.equals(accio)) return;
        // Des de «Recents» Android torna a lliurar l'últim intent: no el repetim.
        if ((intent.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) return;
        final List<Uri> uris;
        final String text;
        final String assumpte;
        final String tipus;
        try {
            // Llegir els extres desempaqueta el Bundle: un extra desconegut d'una
            // app hostil hi llança (BadParcelableException) i tombaria l'App.
            if (intent.getBooleanExtra(MARCA_CONSUMIT, false)) return;
            intent.putExtra(MARCA_CONSUMIT, true);
            uris = recullUris(intent);
            // CharSequence: un text amb estil (enllaços, negretes) no és cap String.
            text = retalla(textDe(intent.getCharSequenceExtra(Intent.EXTRA_TEXT)));
            assumpte = retalla(textDe(intent.getCharSequenceExtra(Intent.EXTRA_SUBJECT)));
            tipus = intent.getType();
        } catch (RuntimeException e) {
            Logger.error("CompartirNatiu", "Intent de compartir il·legible", e);
            return;
        }
        // L'hora de l'intent, abans de copiar res: el web la compara amb l'últim canvi de sessió.
        final long rebutMs = System.currentTimeMillis();
        // I l'època: si tallaSessio la puja mentre es copia, la compartició plega.
        final long sessioAlRebre = sessio.get();
        // Còpia fora del fil principal: una foto gran no ha de bloquejar l'app.
        try {
            copiador.execute(() -> {
                try {
                    processa(uris, text, assumpte, tipus, rebutMs, sessioAlRebre);
                } catch (RuntimeException e) {
                    // Una excepció en este fil tombaria l'App sencera.
                    Logger.error("CompartirNatiu", "No s'ha pogut processar el contingut compartit", e);
                }
            });
        } catch (RejectedExecutionException e) {
            // Tres comparticions encallades (o el connector ja tancat): esta no entra.
            Logger.warn("CompartirNatiu", "Massa comparticions alhora; es descarta esta");
        }
    }

    @PluginMethod
    public void allibera(PluginCall call) {
        JSArray rutes = call.getArray("rutes", new JSArray());
        File carpeta = carpeta();
        String base;
        try {
            base = carpeta.getCanonicalPath() + File.separator;
        } catch (IOException e) {
            call.reject("No s'ha pogut resoldre la carpeta de compartits");
            return;
        }
        int esborrats = 0;
        for (int i = 0; i < rutes.length(); i++) {
            String ruta = rutes.optString(i, "");
            if (ruta.isEmpty()) continue;
            try {
                File fitxer = new File(ruta);
                // Només els fitxers de la nostra carpeta: res fora de compartits/.
                if (fitxer.getCanonicalPath().startsWith(base) && fitxer.delete()) esborrats++;
            } catch (IOException ignorat) {
                // Ruta il·legible: no és nostra.
            }
        }
        JSObject resposta = new JSObject();
        resposta.put("esborrats", esborrats);
        call.resolve(resposta);
    }

    /**
     * Pla 261028_1526 (P1-31) · La sessió del web ha canviat (ix la persona,
     * n'entra una altra, canvia el backend). Puja l'època i la desa amb commit,
     * no apply: si el procés mor just després, l'època nova ja és al disc. Tot
     * el que hi ha a compartits/ d'una altra època s'esborra, i la compartició
     * que encara copiava ho veu i plega. Capacitor crida els mètodes d'un
     * connector d'un en un: no hi ha dos talls alhora.
     */
    @PluginMethod
    public void tallaSessio(PluginCall call) {
        long nova = sessio.incrementAndGet();
        //noinspection ApplySharedPref
        preferencies().edit().putLong(CLAU_SESSIO, nova).commit();
        String prefix = prefixDe(nova);
        int esborrats = 0;
        File[] restes = carpeta().listFiles();
        if (restes != null) {
            for (File resta : restes) {
                if (resta.isFile() && !resta.getName().startsWith(prefix) && resta.delete()) esborrats++;
            }
        }
        JSObject resposta = new JSObject();
        resposta.put("esborrats", esborrats);
        call.resolve(resposta);
    }

    private List<Uri> recullUris(Intent intent) {
        Set<Uri> uris = new LinkedHashSet<>();
        if (Intent.ACTION_SEND.equals(intent.getAction())) {
            Uri uri = IntentCompat.getParcelableExtra(intent, Intent.EXTRA_STREAM, Uri.class);
            if (uri != null) uris.add(uri);
        } else {
            ArrayList<Uri> llista = IntentCompat.getParcelableArrayListExtra(intent, Intent.EXTRA_STREAM, Uri.class);
            if (llista != null) uris.addAll(llista);
        }
        // Android 10+ porta el permís de lectura a ClipData.
        ClipData clip = intent.getClipData();
        if (clip != null) {
            for (int i = 0; i < clip.getItemCount(); i++) {
                Uri uri = clip.getItemAt(i).getUri();
                if (uri != null) uris.add(uri);
            }
        }
        return new ArrayList<>(uris);
    }

    private void processa(List<Uri> uris, String text, String assumpte, String tipus, long rebutMs, long sessioAlRebre) {
        JSArray fitxers = new JSArray();
        StringBuilder textDeFitxers = new StringBuilder();
        int rebutjats = 0;
        int acceptats = 0;
        int examinades = 0;
        long bytesCopiats = 0;
        long finestra = System.currentTimeMillis() + COMPARTICIO_MS;
        for (Uri uri : uris) {
            // Connector destruït: res més no es llig (les còpies fetes tornaran en arrencar).
            if (copiador.isShutdown()) return;
            // La sessió ha canviat (tallaSessio): ni una còpia més, i les fetes, fora.
            if (sessio.get() != sessioAlRebre) {
                esborra(fitxers);
                return;
            }
            // Sostres: fitxers acceptats, URIs examinades, bytes copiats i temps total de la compartició.
            if (acceptats >= MAX_FITXERS || examinades >= MAX_URIS_EXAMINADES || bytesCopiats >= MAX_BYTES_COMPARTICIO
                || System.currentTimeMillis() > finestra) {
                rebutjats++;
                continue;
            }
            examinades++;
            if (!esUriAcceptable(uri)) {
                rebutjats++;
                continue;
            }
            String mime = mimeDe(uri, tipus);
            if (mime.startsWith("text/plain")) {
                // El text acumulat ja és ple: no se'n llig més.
                if (textDeFitxers.length() >= MAX_CARACTERS_TEXT) continue;
                String contingut = llegixText(uri);
                if (contingut == null) {
                    rebutjats++;
                } else if (!contingut.isEmpty()) {
                    if (textDeFitxers.length() > 0) textDeFitxers.append("\n\n");
                    textDeFitxers.append(contingut);
                }
                continue;
            }
            String extensio = extensioImatge(mime);
            if (extensio == null) {
                rebutjats++;
                continue;
            }
            JSObject fitxer = copia(uri, mime, extensio, MAX_BYTES_COMPARTICIO - bytesCopiats, sessioAlRebre);
            if (fitxer == null) {
                rebutjats++;
                continue;
            }
            fitxers.put(fitxer);
            acceptats++;
            bytesCopiats += fitxer.optLong("mida");
        }

        String textFinal = uneix(text, textDeFitxers.toString());
        if (fitxers.length() == 0 && textFinal.isEmpty() && assumpte.isEmpty()) {
            Logger.warn("CompartirNatiu", "Contingut compartit sense res aprofitable (rebutjats: " + rebutjats + ")");
            if (rebutjats == 0) return;
        }

        JSObject dades = new JSObject();
        dades.put("fitxers", fitxers);
        dades.put("text", textFinal);
        dades.put("assumpte", assumpte);
        dades.put("rebutjats", rebutjats);
        dades.put("rebutMs", rebutMs);
        // Destruït mentre es copiava: cap avís a un pont mort (les còpies tornaran en arrencar).
        if (copiador.isShutdown()) return;
        // Tallada mentre es copiava: el lot ja no és de ningú.
        if (sessio.get() != sessioAlRebre) {
            esborra(fitxers);
            return;
        }
        // Al fil dels connectors, on també corre addListener: els mapes de
        // Plugin no estan sincronitzats.
        getBridge().execute(() -> notifyListeners(ESDEVENIMENT, dades, true));
    }

    /** Només content:// d'altres apps. Mai file:// ni el nostre FileProvider. */
    private boolean esUriAcceptable(Uri uri) {
        if (uri == null || !ContentResolver.SCHEME_CONTENT.equals(uri.getScheme())) return false;
        String autoritat = uri.getAuthority();
        if (autoritat == null) return false;
        // «0@org.socdepoble.app.fileprovider» també és el nostre (usuari davant).
        // I sense distingir majúscules, com resol Android les autoritats.
        autoritat = autoritat.substring(autoritat.lastIndexOf('@') + 1).toLowerCase(Locale.ROOT);
        String propi = getContext().getPackageName().toLowerCase(Locale.ROOT);
        // Una app hostil podria apuntar a fitxers privats nostres via el nostre
        // propi proveïdor, que llegim sense cap permís: el rebutgem sencer.
        return !autoritat.equals(propi) && !autoritat.startsWith(propi + ".");
    }

    private String mimeDe(Uri uri, String tipusIntent) {
        ContentResolver resolver = getContext().getContentResolver();
        // Sense resposta a temps, el de l'intent: un tipus genèric d'imatge continua rebutjat (llista blanca).
        String mime = consulta(() -> resolver.getType(uri), null);
        if (mime == null || mime.isEmpty()) mime = tipusIntent;
        return mime == null ? "" : mime.toLowerCase(Locale.ROOT);
    }

    /** Llista blanca: el xat només sap pujar i mostrar estos formats. */
    private static String extensioImatge(String mime) {
        switch (mime) {
            case "image/jpeg":
            case "image/jpg":
                return "jpg";
            case "image/png":
                return "png";
            case "image/webp":
                return "webp";
            case "image/gif":
                return "gif";
            default:
                return null;
        }
    }

    /**
     * `restant`: el que queda del sostre de la compartició (MAX_BYTES_COMPARTICIO).
     * `sessioAlRebre`: l'època de l'intent, al principi del nom de la còpia.
     */
    private JSObject copia(Uri uri, String mime, String extensio, long restant, long sessioAlRebre) {
        File carpeta = carpeta();
        if (!carpeta.isDirectory() && !carpeta.mkdirs()) return null;
        File desti = new File(carpeta, prefixDe(sessioAlRebre) + UUID.randomUUID().toString() + "." + extensio);
        long total = 0;
        // Ni més de 20 MB per fitxer ni més del que queda de la compartició.
        long sostre = Math.min(MAX_BYTES_FITXER, restant);
        ScheduledFuture<?> termini = ambTermini();
        // Sense vigilant (connector tancat) no hi ha termini: no es llig res.
        if (termini == null) return null;
        try (InputStream entrada = interrompible(getContext().getContentResolver().openInputStream(uri));
             OutputStream eixida = new FileOutputStream(desti)) {
            if (entrada == null) throw new IOException("sense flux");
            byte[] tampo = new byte[64 * 1024];
            int llegits;
            while ((llegits = entrada.read(tampo)) != -1) {
                total += llegits;
                if (total > sostre) throw new IOException("massa gran");
                eixida.write(tampo, 0, llegits);
            }
        } catch (IOException | RuntimeException e) {
            // RuntimeException: el proveïdor d'una altra app pot llançar-ne de qualsevol mena.
            Logger.warn("CompartirNatiu", "No s'ha pogut copiar un fitxer compartit: " + e.getMessage());
            //noinspection ResultOfMethodCallIgnored
            desti.delete();
            return null;
        } finally {
            senseTermini(termini);
        }
        if (total == 0) {
            //noinspection ResultOfMethodCallIgnored
            desti.delete();
            return null;
        }
        JSObject fitxer = new JSObject();
        fitxer.put("ruta", desti.getAbsolutePath());
        fitxer.put("mime", "image/jpg".equals(mime) ? "image/jpeg" : mime);
        fitxer.put("mida", total);
        fitxer.put("nom", nomVisible(uri, extensio));
        return fitxer;
    }

    private String llegixText(Uri uri) {
        ScheduledFuture<?> termini = ambTermini();
        // Sense vigilant (connector tancat) no hi ha termini: no es llig res.
        if (termini == null) return null;
        try (InputStream entrada = interrompible(getContext().getContentResolver().openInputStream(uri))) {
            if (entrada == null) return null;
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] tampo = new byte[8 * 1024];
            int llegits;
            int limit = MAX_CARACTERS_TEXT * 4;
            while ((llegits = entrada.read(tampo)) != -1 && bytes.size() < limit) {
                bytes.write(tampo, 0, Math.min(llegits, limit - bytes.size()));
            }
            return retalla(new String(bytes.toByteArray(), StandardCharsets.UTF_8));
        } catch (IOException | RuntimeException e) {
            return null;
        } finally {
            senseTermini(termini);
        }
    }

    /* Un proveïdor pot tornar un tub que no acaba mai: passat el termini, el fil
       que llig rep una interrupció. Llegint pel canal del descriptor (que és
       interrompible), la lectura bloquejada s'acaba amb una excepció. */
    private ScheduledFuture<?> ambTermini() {
        Thread fil = Thread.currentThread();
        try {
            return vigilant.schedule(fil::interrupt, LECTURA_MS, TimeUnit.MILLISECONDS);
        } catch (RejectedExecutionException e) {
            return null;
        }
    }

    /* QA-04 · Una crida Binder (getType, query) al consultor, amb termini: un
       proveïdor encallat ja no ocupa el copiador. Plens els fils (o el connector
       tancat), null sense cridar res. Passat CONSULTA_MS, el senyal (si n'hi ha)
       i el futur es cancel·len: el fil queda lliure quan el proveïdor torna. */
    private <T> T consulta(Callable<T> crida, CancellationSignal senyal) {
        Future<T> futur;
        try {
            futur = consultor.submit(crida);
        } catch (RejectedExecutionException e) {
            return null;
        }
        try {
            return futur.get(CONSULTA_MS, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            if (senyal != null) senyal.cancel();
            futur.cancel(true);
            return null;
        } catch (InterruptedException e) {
            futur.cancel(true);
            // El copiador s'està tancant (shutdownNow): la interrupció continua per a processa.
            Thread.currentThread().interrupt();
            return null;
        } catch (ExecutionException | CancellationException e) {
            // RuntimeException del proveïdor: alguns no responen a query().
            return null;
        }
    }

    private static void senseTermini(ScheduledFuture<?> termini) {
        if (termini != null) termini.cancel(false);
        // La interrupció del termini no ha de passar a la lectura següent.
        //noinspection ResultOfMethodCallIgnored
        Thread.interrupted();
    }

    private static InputStream interrompible(InputStream entrada) {
        return entrada instanceof FileInputStream ? Channels.newInputStream(((FileInputStream) entrada).getChannel()) : entrada;
    }

    /* Les còpies que encara són a compartits/ (cap enviament ni descart les ha
       alliberades) tornen al web com un lot, en el mateix ordre que el natiu. */
    private void anunciaPendents() {
        File[] restes = carpeta().listFiles();
        if (restes == null || restes.length == 0) return;
        java.util.Arrays.sort(restes, (a, b) -> Long.compare(a.lastModified(), b.lastModified()));
        // P1-31 · Una resta d'una altra època (o sense, d'abans d'haver-ne) no és de la sessió d'ara: fora.
        String prefix = prefixDe(sessio.get());
        JSArray fitxers = new JSArray();
        for (File resta : restes) {
            String nom = resta.getName();
            String extensio = nom.substring(nom.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
            String mime = mimeDeLExtensio(extensio);
            if (!resta.isFile() || mime == null || !nom.startsWith(prefix) || fitxers.length() >= MAX_FITXERS) {
                //noinspection ResultOfMethodCallIgnored
                resta.delete();
                continue;
            }
            JSObject fitxer = new JSObject();
            fitxer.put("ruta", resta.getAbsolutePath());
            fitxer.put("mime", mime);
            fitxer.put("mida", resta.length());
            fitxer.put("nom", "captura." + extensio);
            fitxers.put(fitxer);
        }
        if (fitxers.length() == 0) return;
        JSObject dades = new JSObject();
        dades.put("fitxers", fitxers);
        dades.put("text", "");
        dades.put("assumpte", "");
        dades.put("rebutjats", 0);
        getBridge().execute(() -> notifyListeners(ESDEVENIMENT, dades, true));
    }

    private static String mimeDeLExtensio(String extensio) {
        switch (extensio) {
            case "jpg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "webp":
                return "image/webp";
            case "gif":
                return "image/gif";
            default:
                return null;
        }
    }

    /** El nom original només es mostra; mai fa de ruta. */
    private String nomVisible(Uri uri, String extensio) {
        ContentResolver resolver = getContext().getContentResolver();
        CancellationSignal senyal = new CancellationSignal();
        // Sense resposta a temps (o si el proveïdor llança), un nom genèric.
        String nom = consulta(() -> {
            try (Cursor cursor = resolver.query(uri, new String[] { OpenableColumns.DISPLAY_NAME }, null, null, null, senyal)) {
                return cursor != null && cursor.moveToFirst() ? cursor.getString(0) : null;
            }
        }, senyal);
        if (nom == null || nom.trim().isEmpty()) nom = "captura." + extensio;
        nom = nom.replaceAll("[\\\\/\\p{Cntrl}]", "_").trim();
        return nom.length() > 120 ? nom.substring(0, 120) : nom;
    }

    private File carpeta() {
        return new File(getContext().getCacheDir(), CARPETA);
    }

    private SharedPreferences preferencies() {
        return getContext().getSharedPreferences(PREFERENCIES, Context.MODE_PRIVATE);
    }

    /* El principi del nom de cada còpia: l'època de la sessió que la va rebre. */
    private static String prefixDe(long sessio) {
        return sessio + "-";
    }

    /* Les còpies d'una compartició que ja no arribarà a ningú. */
    private static void esborra(JSArray fitxers) {
        for (int i = 0; i < fitxers.length(); i++) {
            JSONObject fitxer = fitxers.optJSONObject(i);
            //noinspection ResultOfMethodCallIgnored
            if (fitxer != null) new File(fitxer.optString("ruta", "")).delete();
        }
    }

    private void netejaCaducats() {
        File[] fitxers = carpeta().listFiles();
        if (fitxers == null) return;
        long limit = System.currentTimeMillis() - CADUCITAT_MS;
        for (File fitxer : fitxers) {
            //noinspection ResultOfMethodCallIgnored
            if (fitxer.isFile() && fitxer.lastModified() < limit) fitxer.delete();
        }
    }

    private static String textDe(CharSequence text) {
        return text == null ? null : text.toString();
    }

    private static String retalla(String text) {
        if (text == null) return "";
        String net = text.trim();
        return net.length() > MAX_CARACTERS_TEXT ? net.substring(0, MAX_CARACTERS_TEXT) : net;
    }

    private static String uneix(String a, String b) {
        if (a.isEmpty()) return retalla(b);
        if (b.isEmpty()) return a;
        return retalla(a + "\n\n" + b);
    }
}
