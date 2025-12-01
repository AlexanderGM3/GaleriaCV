emailjs.init("GsS-u2xftxQY-i4em");

document.getElementById("contactForm").addEventListener("submit", function (e) {
    e.preventDefault();

    emailjs.sendForm("service_icw9zwu", "template_w4fsm4b", this)
        .then(() => {
            document.getElementById("statusMsg").textContent = "Mensaje enviado correctamente!";
            this.reset();
        })
        .catch(() => {
            document.getElementById("statusMsg").textContent = "Error al enviar el mensaje.";
        });
});
