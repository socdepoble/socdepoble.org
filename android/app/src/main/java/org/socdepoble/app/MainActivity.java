package org.socdepoble.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

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
        // Gauntlet 261026_1615 (Codex C1615-05) · Abans que cap connector llija els extres.
        setIntent(senseExtresIllegibles(getIntent()));
        // Revisió 261026 · Restaurada després que Android matara el procés, la
        // tasca torna a lliurar l'intent amb què va nàixer (el SEND o el toc
        // d'un avís): ja es va atendre, i no ha de tornar a obrir res.
        if (savedInstanceState != null && getIntent() != null) {
            getIntent().putExtra(CompartirNatiuPlugin.MARCA_CONSUMIT, true);
            getIntent().removeExtra("LocalNotificationId");
        }
        super.onCreate(savedInstanceState);
    }
}
