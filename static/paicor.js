
// ==========================================
// VARIABLE DONDE SE GUARDAN LOS MENÚS
// ==========================================

let menus = [];


// ==========================================
// VERIFICAR SERVICIO PAICOR
// ==========================================

function verificarServicio() {

    fetch("/estado_paicor")

        .then(res => res.json())

        .then(datos => {

            if (datos.servicio == false) {

                alert(datos.mensaje);

            }

        })

        .catch(error => {

            console.log("Error Python:", error);

        });

}


// ==========================================
// NORMALIZAR FECHA
// ==========================================

function normalizarFecha(fecha) {

    if (!fecha) {
        return "";
    }

    // Si MySQL devuelve:
    // 2026-08-28 00:00:00
    // nos quedamos solamente con:
    // 2026-08-28

    return String(fecha).substring(0, 10);

}


// ==========================================
// MOSTRAR MENÚ DE HOY
// ==========================================

function mostrarMenuHoy() {

    const hoy = new Date();

    const fechaHoy =
        `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;

    console.log("Fecha de hoy:", fechaHoy);


    const menu = menus.find(m => {

        return normalizarFecha(m.fecha) === fechaHoy;

    });


    if (menu) {

        document.getElementById("plato-dia").innerHTML =
            "🍽 Plato: " + menu.plato;

        document.getElementById("postre-dia").innerHTML =
            "🍮 Postre: " + menu.postre;

    } else {

        document.getElementById("plato-dia").innerHTML =
            "No hay menú cargado para hoy";

        document.getElementById("postre-dia").innerHTML =
            "";

    }

}


// ==========================================
// MESES
// ==========================================

const meses = {

    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12

};


// ==========================================
// CARGAR MENÚS
// ==========================================

window.onload = () => {

    verificarServicio();


    fetch("/obtener_menus")

        .then(res => {

            if (!res.ok) {

                throw new Error(
                    "Error HTTP: " + res.status
                );

            }

            return res.json();

        })

        .then(data => {

            menus = data;

            console.log("MENÚS RECIBIDOS DESDE PHP:");
            console.log(menus);


            // Mostrar menú del día
            mostrarMenuHoy();


            // Mostrar agosto automáticamente
            generarCalendario("agosto");

            console.log(menus);

        })

        .catch(error => {

            console.error(
                "ERROR AL OBTENER LOS MENÚS:",
                error
            );

        });

};


// ==========================================
// CAMBIAR MES
// ==========================================

function mostrarMes(mes, boton) {

    document.querySelectorAll(".mes").forEach(btn => {

        btn.classList.remove("activo");

    });


    boton.classList.add("activo");


    generarCalendario(mes);

}


// ==========================================
// GENERAR CALENDARIO
// ==========================================

function generarCalendario(mes) {

    const contenedor =
        document.getElementById("contenedorCalendario");


    const numeroMes =
        meses[mes];


    let html = `

        <div class="calendario visible">

            <h2>${mes.toUpperCase()} 2026</h2>

            <div class="calendario-grid">

    `;


    // ==========================================
    // ENCABEZADOS
    // ==========================================

    const diasSemana = [

        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes"

    ];


    diasSemana.forEach(dia => {

        html += `

            <div class="encabezado">
                ${dia}
            </div>

        `;

    });


    // ==========================================
    // PRIMER DÍA DEL MES
    // ==========================================

    const primerDia =
        new Date(2026, numeroMes - 1, 1);


    let diaInicio =
        primerDia.getDay();


    /*
        JavaScript:

        Domingo = 0
        Lunes = 1
        Martes = 2
        Miércoles = 3
        Jueves = 4
        Viernes = 5
        Sábado = 6
    */


    // Si el mes comienza sábado o domingo,
    // empezamos directamente desde el lunes.

    if (diaInicio === 0 || diaInicio === 6) {

        diaInicio = 1;

    }


    // ==========================================
    // ESPACIOS ANTES DEL PRIMER DÍA
    // ==========================================

    const espacios =
        diaInicio - 1;


    for (let i = 0; i < espacios; i++) {

        html += `
            <div class="vacio"></div>
        `;

    }


    // ==========================================
    // CANTIDAD DE DÍAS
    // ==========================================

    const cantidadDias =
        new Date(2026, numeroMes, 0).getDate();


    // ==========================================
    // CREAR DÍAS
    // ==========================================

    for (
        let dia = 1;
        dia <= cantidadDias;
        dia++
    ) {

        const fechaActual =
            new Date(2026, numeroMes - 1, dia);


        const diaSemana =
            fechaActual.getDay();


        // No mostramos sábado ni domingo

        if (
            diaSemana === 0 ||
            diaSemana === 6
        ) {

            continue;

        }


        // ==========================================
        // FECHA COMPLETA
        // ==========================================

        const fechaCompleta =
            `2026-${String(numeroMes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;


        // ==========================================
        // BUSCAR MENÚ
        // ==========================================

        const tieneMenu =
            menus.some(m => {

                return normalizarFecha(m.fecha) === fechaCompleta;

            });


        console.log(
            fechaCompleta,
            "Tiene menú:",
            tieneMenu
        );


        // ==========================================
        // CREAR DÍA
        // ==========================================

        html += `

            <div
                class="dia ${tieneMenu ? "con-menu" : ""}"
                onclick="abrirMenu('${fechaCompleta}')"
            >

                ${dia}

            </div>

        `;

    }


    html += `

            </div>

        </div>

    `;


    contenedor.innerHTML = html;

}


// ==========================================
// ABRIR MENÚ
// ==========================================

function abrirMenu(fecha) {

    console.log("Buscando menú para:", fecha);


    const menu =
        menus.find(m => {

            return normalizarFecha(m.fecha) === fecha;

        });


    console.log("Menú encontrado:", menu);


    const contenido =
        document.getElementById("contenidoMenu");


    if (menu) {

        contenido.innerHTML = `

            <h2>${fecha}</h2>

            <h3>🍽 Plato</h3>

            <p>${menu.plato}</p>

            <h3>🍮 Postre</h3>

            <p>${menu.postre}</p>

        `;

    } else {

        contenido.innerHTML = `

            <h2>${fecha}</h2>

            <p>No hay menú cargado.</p>

        `;

    }


    document.getElementById("modal").style.display = "flex";

}


// ==========================================
// CERRAR MENÚ
// ==========================================

function cerrarMenu() {

    document.getElementById("modal").style.display = "none";

}