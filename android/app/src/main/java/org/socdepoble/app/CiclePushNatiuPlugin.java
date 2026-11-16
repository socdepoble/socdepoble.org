package org.socdepoble.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.tasks.Task;
import com.google.firebase.messaging.FirebaseMessaging;
import java.util.concurrent.CompletableFuture;

/** R31: serialitza les Tasks reals de Firebase, també entre instàncies del pont.
 * PushNotifications8.1.3 resol unregister abans d'acabar deleteToken. Ací no
 * s'allibera la cua quan JS expira o abandona una crida: només quan la Task
 * confirma èxit, error o cancel·lació. Cap token ni excepció del proveïdor es
 * registra en logs. El connector oficial conserva permisos, avisos i toc. */
@CapacitorPlugin(name = "CiclePushNatiu")
public class CiclePushNatiuPlugin extends Plugin {
    private static final Object PANY = new Object();
    private static CompletableFuture<Void> cua = CompletableFuture.completedFuture(null);

    @PluginMethod
    public void register(PluginCall call) {
        executa(call, true);
    }

    @PluginMethod
    public void unregister(PluginCall call) {
        executa(call, false);
    }

    private void executa(PluginCall call, boolean alta) {
        final CompletableFuture<Void> acaba = new CompletableFuture<>();
        final CompletableFuture<Void> anterior;
        synchronized (PANY) {
            anterior = cua;
            // Reservar abans d'arrancar evita que una completion síncrona
            // o una altra instància puga avançar a la Task que acaba d'entrar.
            cua = acaba;
        }
        anterior.whenComplete((ignorat, errorAnterior) -> {
            final Task<?> feina;
            try {
                FirebaseMessaging firebase = FirebaseMessaging.getInstance();
                firebase.setAutoInitEnabled(alta);
                feina = alta ? firebase.getToken() : firebase.deleteToken();
            } catch (RuntimeException error) {
                call.reject("No s'ha pogut iniciar el cicle Push natiu.", "SDP_PUSH_TASK_START");
                acaba.complete(null);
                return;
            }
            try {
                feina.addOnCompleteListener(Runnable::run, resultat -> {
                    try {
                        if (!resultat.isSuccessful()) {
                            call.reject("La Task Push nativa no s'ha completat correctament.", "SDP_PUSH_TASK_FAILED");
                        } else if (alta) {
                            Object token = resultat.getResult();
                            if (!(token instanceof String) || ((String) token).isEmpty()) {
                                call.reject("La Task Push no ha tornat cap testimoni.", "SDP_PUSH_TOKEN_EMPTY");
                            } else {
                                JSObject resposta = new JSObject();
                                resposta.put("value", token);
                                call.resolve(resposta);
                            }
                        } else {
                            call.resolve();
                        }
                    } finally {
                        acaba.complete(null);
                    }
                });
            } catch (RuntimeException error) {
                // Una Task ja iniciada sense receptor fiable és incerta.
                // No alliberar la cua ni permetre un getToken nou damunt seu.
                call.reject("No es pot observar la completion Push nativa.", "SDP_PUSH_TASK_OBSERVER");
            }
        });
    }
}
