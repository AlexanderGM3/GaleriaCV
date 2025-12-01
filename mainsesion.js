import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
    const userMenu = document.querySelector(".user-menu");
    const userIcon = userMenu?.querySelector("i");
    const loginDropdown = userMenu?.querySelector(".login-dropdown");
    const cartIcon = document.querySelector(".cart-icon");
    const cartDropdown = document.querySelector(".cart-dropdown");
    const loginForm = document.getElementById("loginForm");
    const googleLoginBtn = document.getElementById("googleLoginBtn");

    /* ==============================
       MANEJO DE DROPDOWNS
    ===============================*/
    if (userIcon && loginDropdown) {
        userIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            loginDropdown.style.display =
                loginDropdown.style.display === "block" ? "none" : "block";
            if (cartDropdown) cartDropdown.style.display = "none";
        });

        loginDropdown.addEventListener("click", (e) => e.stopPropagation());
    }

    if (cartIcon && cartDropdown) {
        cartIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            cartDropdown.style.display =
                cartDropdown.style.display === "block" ? "none" : "block";
            if (loginDropdown) loginDropdown.style.display = "none";
        });

        cartDropdown.addEventListener("click", (e) => e.stopPropagation());
    }

    document.addEventListener("click", () => {
        if (loginDropdown) loginDropdown.style.display = "none";
        if (cartDropdown) cartDropdown.style.display = "none";
    });

    /* ==============================
       LOGIN NORMAL
    ===============================*/
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                alert("Error al iniciar sesión: " + error.message);
                return;
            }

            window.location.href = "index.html";
        });
    }

    /* ==============================
       LOGIN CON GOOGLE
    ===============================*/
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener("click", async () => {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: window.location.origin + "/index.html"
                }
            });

            if (error) alert("Error con Google: " + error.message);
        });
    }

    /* ==============================
       DETECTAR SESIÓN INICIAL
    ===============================*/
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;

    if (user) setupUserUI(user);

    /* ==============================
       ESCUCHAR CAMBIOS DE SESIÓN
    ===============================*/
    supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) setupUserUI(session.user);
    });

    /* ==============================
       INTERFAZ DE USUARIO
    ===============================*/
    function setupUserUI(user) {
        if (!userMenu) return;

        // ⭐ ELIMINAR BOTONES DUPLICADOS DE SESIONES ANTERIORES
        const oldBtn = userMenu.querySelector(".user-name-btn");
        if (oldBtn) oldBtn.remove();

        const oldMini = userMenu.querySelector(".mini-menu");
        if (oldMini) oldMini.remove();

        // Ocultar icono de usuario y login
        if (userIcon) userIcon.style.display = "none";
        if (loginDropdown) loginDropdown.style.display = "none";

        // ⭐ Botón con nombre o correo
        let userNameBtn = document.createElement("button");
        userNameBtn.textContent = user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email;
        userNameBtn.classList.add("user-name-btn");
        userMenu.prepend(userNameBtn);

        // ⭐ Mini menú
        const miniMenu = document.createElement("div");
        miniMenu.classList.add("login-dropdown", "mini-menu");
        miniMenu.style.display = "none";
        miniMenu.innerHTML = `
            <p><a href="perfil.html">Configuración de perfil</a></p>
            <p><a href="#" id="logoutBtn">Cerrar sesión</a></p>
        `;
        userMenu.appendChild(miniMenu);

        userNameBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            miniMenu.style.display =
                miniMenu.style.display === "block" ? "none" : "block";
            if (cartDropdown) cartDropdown.style.display = "none";
        });

        miniMenu.addEventListener("click", (e) => e.stopPropagation());

        document.getElementById("logoutBtn").addEventListener("click", async (e) => {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.href = "index.html";
        });
    }
});
