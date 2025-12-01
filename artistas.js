const searchInput = document.getElementById("searchArtist");
const infoBox = document.getElementById("artistInfoBox");
const imgBox = document.getElementById("artistImage");
const nameBox = document.getElementById("artistName");
const bioBox = document.getElementById("artistBio");
const destacadosGrid = document.getElementById("destacadosGrid");

let artistaActual = "";

async function buscarArtista(nombre) {
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nombre)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.title === "Not found.") {
            nameBox.textContent = "Artista no encontrado";
            imgBox.src = "";
            bioBox.textContent = "";
            infoBox.style.display = "block";
            return;
        }

        artistaActual = nombre;

        imgBox.src = data.thumbnail ? data.thumbnail.source : "";
        nameBox.textContent = data.title;
        bioBox.textContent = data.extract;
        infoBox.style.display = "block";

    } catch (error) {
        console.log("Error buscando artista:", error);
    }
}

searchInput.addEventListener("change", () => {
    const nombre = searchInput.value.trim();
    if (!nombre) return;

    if (nombre.toLowerCase() === artistaActual.toLowerCase()) {
        infoBox.style.display = "none";
        artistaActual = "";
        return;
    }

    buscarArtista(nombre);
});

const destacados = [
    "Vincent van Gogh",
    "Pablo Picasso",
    "Leonardo da Vinci",
    "Claude Monet",
    "Salvador Dalí",
    "Frida Kahlo",
    "Michelangelo",
    "Edvard Munch",
    "Caravaggio",
    "Andy Warhol"
];

async function cargarImagen(nombre) {
    try {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nombre)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data.thumbnail ? data.thumbnail.source : "";
    } catch {
        return "";
    }
}

async function cargarDestacados() {
    destacadosGrid.innerHTML = "";

    for (let artista of destacados) {
        const img = await cargarImagen(artista);

        const card = document.createElement("div");
        card.classList.add("artista-card");

        card.innerHTML = `
            <img src="${img}" alt="${artista}">
            <p>${artista}</p>
        `;

        card.addEventListener("click", () => {
            if (artistaActual.toLowerCase() === artista.toLowerCase()) {
                infoBox.style.display = "none";
                artistaActual = "";
                return;
            }

            buscarArtista(artista);
        });

        destacadosGrid.appendChild(card);
    }
}

document.getElementById("btnBuscarArtista").addEventListener("click", () => {
    const nombre = searchInput.value.trim();
    if (!nombre) return;

    if (nombre.toLowerCase() === artistaActual.toLowerCase()) {
        infoBox.style.display = "none";
        artistaActual = "";
        return;
    }

    buscarArtista(nombre);
});

cargarDestacados();
