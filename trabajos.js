// ==============================
// CONFIGURACIÓN SUPABASE
// ==============================
const supabaseUrl = "https://ajdfvmopmihwohbofnjy.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqZGZ2bW9wbWlod29oYm9mbmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2MTM2ODksImV4cCI6MjA3OTE4OTY4OX0.RqRiewthFu7p_n_kIU1uWVQJmW6C_vOfB3gFoMaUQ20";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ==============================
// REFERENCIAS HTML
// ==============================
const uploadWorkBtn = document.getElementById("uploadWorkBtn");
const workFile = document.getElementById("workFile");
const addWorkForm = document.getElementById("addWorkForm");
const closeWorkForm = document.getElementById("closeWorkForm");
const saveWorkBtn = document.getElementById("saveWork");

const workName = document.getElementById("workName");
const workPrice = document.getElementById("workPrice");
const workDescription = document.getElementById("workDescription");
const thumbnailFile = document.getElementById("thumbnailFile");
const chooseThumbnailBtn = document.getElementById("chooseThumbnailBtn");
const thumbnailPreview = document.getElementById("thumbnailPreview");

const searchWorkInput = document.getElementById("searchWorkInput");
const workGallery = document.getElementById("workGallery");

// ==============================
// FLUJO SUBIR ARCHIVO
// ==============================
uploadWorkBtn.addEventListener("click", () => workFile.click());
workFile.addEventListener("change", () => {
    if (workFile.files.length > 0) addWorkForm.classList.remove("hidden");
});
closeWorkForm.addEventListener("click", () => {
    addWorkForm.classList.add("hidden");
    workFile.value = "";
    resetForm();
});
chooseThumbnailBtn.addEventListener("click", () => thumbnailFile.click());
thumbnailFile.addEventListener("change", () => {
    const file = thumbnailFile.files[0];
    if (file) {
        thumbnailPreview.src = URL.createObjectURL(file);
        thumbnailPreview.classList.remove("hidden");
    }
});

// ==============================
// GUARDAR TRABAJO
// ==============================
saveWorkBtn.addEventListener("click", async () => {
    if (!workFile.files[0]) return alert("Selecciona un archivo primero.");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Debes iniciar sesión para subir trabajos.");

    const file = workFile.files[0];
    const thumbnail = thumbnailFile.files[0];
    const fileId = crypto.randomUUID();
    const filePath = `files/${fileId}-${file.name}`;

    // SUBIR ARCHIVO AL BUCKET GCV
    const { error: uploadError } = await supabase.storage.from("GCV").upload(filePath, file);
    if (uploadError) return alert("Error al subir archivo al almacenamiento: " + uploadError.message);
    const { data: fileURL } = supabase.storage.from("GCV").getPublicUrl(filePath);

    // SUBIR MINIATURA
    let thumbPath = null;
    let thumbURL = null;
    if (thumbnail) {
        const tPath = `thumbnails/${fileId}-${thumbnail.name}`;
        const { error: tError } = await supabase.storage.from("GCV").upload(tPath, thumbnail);
        if (!tError) {
            thumbPath = tPath;
            // Asegurarse de obtener la URL pública de la miniatura
            thumbURL = supabase.storage.from("GCV").getPublicUrl(tPath).data.publicUrl;
        } else {
            console.error("Error al subir miniatura:", tError);
        }
    }

    // INSERTAR EN BD (cumpliendo RLS)
    const { error: insertError } = await supabase.from("files_meta").insert([{
        id: fileId,
        file_name: workName.value,
        storage_path: filePath,
        download_url: fileURL.publicUrl,
        thumbnail_path: thumbPath,
        thumbnail_url: thumbURL,
        owner: user.id, // auth.uid() UUID
        price: workPrice.value,
        description: workDescription.value,
        file_type: file.type
    }]);

    if (insertError) return alert("Error al guardar en la base de datos: " + insertError.message);

    alert("Archivo subido con éxito.");
    addWorkForm.classList.add("hidden");
    resetForm();
    cargarArchivos();
});

// ==============================
// FUNCIONES AUXILIARES
// ==============================
function resetForm() {
    workFile.value = "";
    workName.value = "";
    workPrice.value = "";
    workDescription.value = "";
    thumbnailFile.value = "";
    thumbnailPreview.src = "";
    thumbnailPreview.classList.add("hidden");
}

function descargarArchivo(url) {
    if (url) {
        window.open(url, '_blank');
    } else {
        alert("URL de descarga no disponible.");
    }
}

// ==============================
// CARGAR ARCHIVOS
// ==============================
async function cargarArchivos() {
    // RLS: 'allow_all_read' permite a todos seleccionar.
    const { data, error } = await supabase.from("files_meta").select("*").order("created_at", { ascending: false });
    if (error) return console.error("Error al cargar archivos:", error);

    workGallery.innerHTML = "";
    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "file-card";
        // Nota: Se corrigió la sintaxis de la plantilla de cadena (`).
        div.innerHTML = `
            <div class="thumb">
                <img src="${item.thumbnail_url || 'sin-miniatura.png'}" alt="thumb">
            </div>
            <h3>${item.file_name}</h3>
            <p>${item.description}</p>
            <p><strong>Precio:</strong> S/ ${item.price}</p>
            <button onclick="abrirDetalles('${item.id}')">Ver detalles</button>
        `;
        workGallery.appendChild(div);
    });
}
cargarArchivos();

// ==============================
// BUSCADOR
// ==============================
searchWorkInput.addEventListener("input", async () => {
    const q = searchWorkInput.value.toLowerCase();
    // RLS: La búsqueda también está cubierta por 'allow_all_read'
    const { data, error } = await supabase.from("files_meta").select("*").ilike("file_name", `%${q}%`);
    if (error) return console.error("Error en la búsqueda:", error);

    workGallery.innerHTML = "";
    data.forEach(item => {
        const div = document.createElement("div");
        div.className = "file-card";
        div.innerHTML = `
            <div class="thumb">
                <img src="${item.thumbnail_url || 'sin-miniatura.png'}" alt="thumb">
            </div>
            <h3>${item.file_name}</h3>
            <button onclick="abrirDetalles('${item.id}')">Ver detalles</button>
        `;
        workGallery.appendChild(div);
    });
});

// ==============================
// DETALLES Y COMENTARIOS
// ==============================
async function abrirDetalles(id) {
    const { data: fileData, error: fetchError } = await supabase.from("files_meta").select("*").eq("id", id).single();
    if (fetchError) return console.error("Error al obtener detalles del archivo:", fetchError);

    const { data: { user } } = await supabase.auth.getUser();

    const modalContent = document.getElementById("workCommentModal").querySelector(".modal-content");

    // Rellenar datos del modal
    modalContent.querySelector("#modalWorkImage").src = fileData.thumbnail_url || "sin-miniatura.png";
    modalContent.querySelector("#modalWorkName").textContent = fileData.file_name;
    modalContent.querySelector("#modalWorkDescription").textContent = fileData.description;

    // 1. Configurar botón de DESCARGA (siempre visible)
    const downloadBtn = document.getElementById("descargarArchivoBtn");
    if (downloadBtn) {
        // Asignar la función de descarga con la URL del archivo
        downloadBtn.onclick = () => descargarArchivo(fileData.download_url);
    }

    // 2. Configurar botón de BORRAR (solo visible para el propietario)
    let borrarBtn = document.getElementById("borrarArchivoBtn");

    if (user && user.id === fileData.owner) {
        // Es el dueño, mostrar el botón o crearlo si no existe
        if (!borrarBtn) {
            borrarBtn = document.createElement("button");
            borrarBtn.id = "borrarArchivoBtn";
            borrarBtn.className = "delete-file-btn"; // Clase CSS para estilo
            borrarBtn.textContent = "Borrar archivo";
            borrarBtn.addEventListener("click", () => borrarArchivo(fileData.id, fileData.storage_path, fileData.thumbnail_path));
            // Insertar después del botón de descargar
            document.getElementById("workCommentModal").querySelector(".modal-content").appendChild(borrarBtn);
        }
        borrarBtn.classList.remove("hidden");
    } else if (borrarBtn) {
        // No es el dueño, ocultar el botón
        borrarBtn.classList.add("hidden");
    }

    // Mostrar el modal
    document.getElementById("workCommentModal").classList.remove("hidden");

    // Cerrar el modal
    document.getElementById("modalWorkClose").onclick = () => {
        document.getElementById("workCommentModal").classList.add("hidden");
    };

    cargarComentarios(fileData.id);
}

// ==============================
// COMENTARIOS
// ==============================
let estrellasSeleccionadas = 5;
function setStars(n) {
    estrellasSeleccionadas = n;
    // Nota: Necesitarías un manejo visual de las estrellas aquí.
}

async function cargarComentarios(id) {
    const { data } = await supabase.from("files_meta").select("comments").eq("id", id).single();
    const lista = document.getElementById("workCommentsList");
    lista.innerHTML = "";

    (data.comments || []).forEach(c => {
        const div = document.createElement("div");
        div.className = "comentario";
        div.innerHTML = `<strong>${"★".repeat(c.stars)}</strong> <p>${c.comment}</p>`;
        lista.appendChild(div);
    });
}

// Nota: Se necesita conectar esta función al botón 'addWorkCommentBtn' del HTML.
// Se añade el listener aquí, asumiendo que el ID del archivo se pasa de alguna manera, 
// o se usa un patrón diferente (como almacenar el ID en el modal).
// Por simplicidad, adaptaremos el botón 'addWorkCommentBtn' para llamar a esta función:
document.getElementById("addWorkCommentBtn").addEventListener("click", () => {
    // Se requiere obtener el ID del archivo actual, que se perdió al salir de abrirDetalles.
    // Una solución rápida es almacenar el ID en un atributo del modal.
    const modal = document.getElementById("workCommentModal");
    const currentWorkId = modal.dataset.currentWorkId;
    if (currentWorkId) {
        enviarComentario(currentWorkId);
    }
});


async function enviarComentario(id) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Debes iniciar sesión para comentar.");

    const texto = document.getElementById("workCommentInput").value;
    const rating = document.getElementById("workRatingInput").value;

    if (!texto || !rating || rating < 1 || rating > 5) return alert("Completa el comentario y la calificación (1-5).");

    // Obtener los comentarios existentes
    const { data: fileData, error: fetchError } = await supabase.from("files_meta").select("comments").eq("id", id).single();
    if (fetchError) return console.error("Error al obtener comentarios existentes:", fetchError);

    const nuevos = fileData.comments || [];
    nuevos.push({ user: user.id, comment: texto, stars: parseInt(rating), date: new Date().toISOString() });

    // Actualizar la fila
    const { error: updateError } = await supabase.from("files_meta").update({ comments: nuevos }).eq("id", id);

    if (updateError) return alert("Error al enviar comentario: " + updateError.message);

    // Limpiar y recargar
    document.getElementById("workCommentInput").value = "";
    document.getElementById("workRatingInput").value = "";
    cargarComentarios(id);
    alert("Comentario enviado.");
}

// ==============================
// BORRAR ARCHIVO
// ==============================
async function borrarArchivo(id, path, thumbPath) {
    if (!confirm("¿Seguro que deseas borrar este archivo? Esta acción es irreversible.")) return;

    // RLS: 'owner_can_delete_files' lo protege.
    await supabase.storage.from("GCV").remove([path]);
    if (thumbPath) await supabase.storage.from("GCV").remove([thumbPath]);

    const { error: deleteError } = await supabase.from("files_meta").delete().eq("id", id);

    if (deleteError) return alert("Error al eliminar de la base de datos: " + deleteError.message);


    alert("Archivo eliminado.");
    document.getElementById("workCommentModal").classList.add("hidden");
    cargarArchivos();
}

// ==============================
// PASARELA DE PAGO (simulada)
// ==============================
function comprar(id) {
    alert("Aquí puedes integrar Culqi, MercadoPago o Stripe para pagar.");
}