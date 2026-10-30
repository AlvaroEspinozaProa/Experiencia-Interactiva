function guardarMenu() {

    let fecha = document.getElementById("fecha").value;
    let plato = document.getElementById("plato").value;
    let postre = document.getElementById("postre").value;

    let datos = new FormData();

    datos.append("guardar", 1);
    datos.append("fecha", fecha);
    datos.append("plato", plato);
    datos.append("postre", postre);

      fetch("/guardar_menu", {
        method: "POST",
        body: datos
    })
    .then(respuesta => respuesta.text())
    .then(mensaje => {
        alert(mensaje);
    })
    .catch(error => {
        console.error("Error:", error);
        alert("No se pudo guardar el menú.");
    });
}
