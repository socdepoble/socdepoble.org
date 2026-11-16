package org.socdepoble.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /* Onada R29 · Els extres amb què els connectors tornen a obrir un avís tocat:
       el local (NOTIFICATION_INTENT_KEY) i el push de FCM. */
    static final String EXTRA_AVIS_LOCAL = "LocalNotificationId";
    static final String EXTRA_AVIS_PUSH = "google.message_id";

    /* Onada R29 · L'intent de l'arrencada ja es va atendre si l'activitat es
       restaura (Android va matar el procés) o si s'obri des de «Recents»: en
       Android 7-11 l'Arrere a l'arrel acaba l'activitat, i Recents torna a
       lliurar l'intent amb què va nàixer la tasca. */
    static boolean intentJaAtes(Intent intent, Bundle savedInstanceState) {
        if (intent == null) return false;
        return savedInstanceState != null
            || (intent.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0;
    }

    /* L'activitat és exportada: un intent amb un Parcelable desconegut fa petar el
       desempaquetat del Bundle quan el primer connector en llig un extra
       (Android 7-12). Si no es pot llegir, l'intent continua sense extres. */
    static Intent senseExtresIllegibles(Intent intent) {
        if (intent == null) return null;
        try {
            Bundle extres = intent.getExtras();
            if (extres != null) extres.size();
            return intent;
        } catch (RuntimeException e) {
            Intent net = new Intent(intent);
            net.replaceExtras((Bundle) null);
            return net;
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(senseExtresIllegibles(intent));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Menú «Compartir» del sistema (ordre del Mestre, 261026). El connector
        // es registra abans del pont: BridgeActivity li passa l'intent de
        // l'arrencada (onNewIntent(getIntent()) al final del seu onCreate) i
        // cada onNewIntent de l'app ja oberta (launchMode singleTask).
        registerPlugin(CompartirNatiuPlugin.class);
        // P0-24 (G2120-07) · El botó Arrere: tanca la capa de dalt de la pàgina
        // abans de tornar arrere, i deixa el gest predictiu al sistema quan no
        // hi ha res a fer (EnrereNatiuPlugin.java n'és l'únic amo).
        registerPlugin(EnrereNatiuPlugin.class);
        // R31: getToken/deleteToken han d'acabar abans de resoldre el pont.
        // PushNotifications continua atenent permisos, canals, avisos i toc.
        registerPlugin(CiclePushNatiuPlugin.class);
        // Gauntlet 261026_1615 (Codex C1615-05) · Abans que cap connector llija els extres.
        setIntent(senseExtresIllegibles(getIntent()));
        // Revisió 261026 · Restaurada després que Android matara el procés, la
        // tasca torna a lliurar l'intent amb què va nàixer (el SEND o el toc
        // d'un avís): ja es va atendre, i no ha de tornar a obrir res.
        // Onada R29 · També reoberta des de «Recents», i també el toc d'un push.
        if (intentJaAtes(getIntent(), savedInstanceState)) {
            getIntent().putExtra(CompartirNatiuPlugin.MARCA_CONSUMIT, true);
            getIntent().removeExtra(EXTRA_AVIS_LOCAL);
            getIntent().removeExtra(EXTRA_AVIS_PUSH);
        }
        super.onCreate(savedInstanceState);
    }
}
