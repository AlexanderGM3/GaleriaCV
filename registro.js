import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Inicializar Supabase
const supabase = createClient(
    "https://ajdfvmopmihwohbofnjy.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZGZ2bW9wbWlod29oYm9mbmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTM2ODksImV4cCI6MjA3OTE4OTY4OX0.RqRiewthFu7p_n_kIU1uWVQJmW6C_vOfB3gFoMaUQ20"
);

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    const googleRegisterBtn = document.getElementById("googleRegisterBtn");

    /* ============================================================
       REGISTRO NORMAL (EMAIL + CONTRASEÑA)
    ============================================================ */
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nickname = document.getElementById("nickname").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                alert("Las contraseñas no coinciden.");
                return;
            }

            // Registrar usuario
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { nickname } // Se guarda en user_metadata
                }
            });

            if (error) {
                alert("Error al registrarte: " + error.message);
                return;
            }

            alert(`Cuenta creada correctamente.\nRevisa tu correo para verificar tu cuenta.`);
        });
    }

    /* ============================================================
       REGISTRO / LOGIN CON GOOGLE
    ============================================================ */
    if (googleRegisterBtn) {
        googleRegisterBtn.addEventListener("click", async () => {

            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin + "/index.html"
                }
            });

            if (error) {
                alert("Error al registrarte con Google: " + error.message);
            }

        });
    }
});
