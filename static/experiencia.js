const preguntasDemo = [
    {
        pregunta: "¿Qué significa PROA?",
        opciones: ["Programa de Robótica y Aprendizaje", "Programa Avanzado de Educación Secundaria", "Programa de Educación Avanzada", "Proyecto Regional de Orientación Académica"],
        correcta: 1,
        explicacion: "PROA es un programa educativo orientado a fortalecer la formación de los estudiantes, especialmente en áreas vinculadas con la tecnología."
    },
    {
        pregunta: "¿Qué área tiene una importancia especial dentro de PROA?",
        opciones: ["Tecnología", "Gastronomía", "Turismo", "Medicina"],
        correcta: 0,
        explicacion: "La tecnología y la informática tienen un papel importante dentro de la propuesta educativa PROA."
    },
    {
        pregunta: "¿Qué habilidad es importante para trabajar en proyectos?",
        opciones: ["Trabajo en equipo", "Trabajar siempre solo", "Memorizar todo", "No compartir ideas"],
        correcta: 0,
        explicacion: "Los proyectos suelen requerir organización, comunicación y colaboración entre compañeros."
    },
    {
        pregunta: "¿Qué significa HTML?",
        opciones: ["HyperText Markup Language", "High Technology Machine Language", "Hyperlink Text Management Language", "Home Tool Markup Language"],
        correcta: 0,
        explicacion: "HTML se utiliza para estructurar el contenido de una página web."
    },
    {
        pregunta: "¿Cuál es la orientación de PROA Despeñaderos?",
        opciones: ["Desarrollo de Software", "Gastronomía", "Turismo", "Medicina"],
        correcta: 0,
        explicacion: "La especialidad en Desarrollo de Software incluye programación, robótica, diseño de aplicaciones y nuevas tecnologías."
    }
];

const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaPregunta = document.getElementById("pantalla-pregunta");
const pantallaFinal = document.getElementById("pantalla-final");
const botonComenzar = document.getElementById("boton-comenzar");
const botonSiguiente = document.getElementById("boton-siguiente");
const botonReiniciar = document.getElementById("boton-reiniciar");
const opciones = document.getElementById("opciones");
const puntos = Array.from(document.querySelectorAll(".progreso-puntos i"));

let indiceActual = 0;
let puntaje = 0;
let respondida = false;
let transicionActiva = false;

function mostrarPantalla(pantalla) {
    [pantallaInicio, pantallaPregunta, pantallaFinal].forEach((elemento) => {
        const activa = elemento === pantalla;
        elemento.hidden = !activa;
        elemento.classList.toggle("pantalla-activa", activa);
    });
}

function actualizarProgreso() {
    const progresoTexto = document.getElementById("progreso-texto");
    progresoTexto.textContent = indiceActual === 0 ? "5 rondas" : `Ronda ${Math.min(indiceActual + 1, preguntasDemo.length)} de ${preguntasDemo.length}`;
    puntos.forEach((punto, indice) => punto.classList.toggle("completo", indice < indiceActual));
}

function mezclarOpciones(pregunta) {
    const opcionesMezcladas = pregunta.opciones.map((texto, indice) => ({ texto, correcta: indice === pregunta.correcta }));

    for (let indice = opcionesMezcladas.length - 1; indice > 0; indice -= 1) {
        const destino = Math.floor(Math.random() * (indice + 1));
        [opcionesMezcladas[indice], opcionesMezcladas[destino]] = [opcionesMezcladas[destino], opcionesMezcladas[indice]];
    }

    return opcionesMezcladas;
}

function mostrarPregunta() {
    const actual = preguntasDemo[indiceActual];
    const opcionesMezcladas = mezclarOpciones(actual);
    respondida = false;
    pantallaPregunta.classList.remove("entrada-cinematica", "salida-cinematica", "respuesta-correcta", "respuesta-incorrecta");
    document.getElementById("pregunta-indice").textContent = `RONDA ${String(indiceActual + 1).padStart(2, "0")} DE ${preguntasDemo.length}`;
    document.getElementById("pregunta-texto").textContent = actual.pregunta;
    const feedback = document.getElementById("feedback");
    feedback.hidden = true;
    feedback.className = "feedback";
    botonSiguiente.hidden = true;
    botonSiguiente.disabled = false;
    opciones.innerHTML = "";

    opcionesMezcladas.forEach(({ texto, correcta }, indice) => {
        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "opcion";
        boton.dataset.correcta = String(correcta);
        boton.style.setProperty("--opcion-delay", `${indice * 70}ms`);
        boton.innerHTML = `<span>${String.fromCharCode(65 + indice)}</span>${texto}`;
        boton.addEventListener("click", () => responder(indice));
        opciones.appendChild(boton);
    });

    actualizarProgreso();
    mostrarPantalla(pantallaPregunta);
    requestAnimationFrame(() => pantallaPregunta.classList.add("entrada-cinematica"));
}

function responder(indiceElegido) {
    if (respondida) return;
    respondida = true;
    const actual = preguntasDemo[indiceActual];
    const botones = Array.from(opciones.querySelectorAll("button"));
    botones.forEach((boton, indice) => {
        boton.disabled = true;
        if (boton.dataset.correcta === "true") boton.classList.add("correcta");
        if (indice === indiceElegido && boton.dataset.correcta !== "true") boton.classList.add("incorrecta");
    });

    const acerto = botones[indiceElegido].dataset.correcta === "true";
    if (acerto) puntaje += 1;
    pantallaPregunta.classList.add(acerto ? "respuesta-correcta" : "respuesta-incorrecta");
    const feedback = document.getElementById("feedback");
    feedback.hidden = false;
    feedback.classList.add(acerto ? "feedback-correcto" : "feedback-incorrecto");
    document.getElementById("feedback-titulo").textContent = acerto ? "¡Muy bien!" : "Casi, seguí intentando.";
    document.getElementById("feedback-texto").textContent = actual.explicacion;
    botonSiguiente.hidden = false;
    botonSiguiente.focus();
}

function siguientePregunta() {
    if (!respondida || transicionActiva) return;
    transicionActiva = true;
    botonSiguiente.disabled = true;
    pantallaPregunta.classList.add("salida-cinematica");

    window.setTimeout(() => {
        indiceActual += 1;
        transicionActiva = false;
        if (indiceActual < preguntasDemo.length) {
            mostrarPregunta();
            return;
        }
        puntos.forEach((punto) => punto.classList.add("completo"));
        document.getElementById("progreso-texto").textContent = "Desafío completado";
        document.getElementById("resultado-puntaje").textContent = `Obtuviste ${puntaje} de ${preguntasDemo.length} respuestas correctas.`;
        pantallaFinal.classList.remove("resultado-cinematico");
        mostrarPantalla(pantallaFinal);
        requestAnimationFrame(() => pantallaFinal.classList.add("resultado-cinematico"));
    }, 280);
}

function reiniciar() {
    indiceActual = 0;
    puntaje = 0;
    transicionActiva = false;
    pantallaFinal.classList.remove("resultado-cinematico");
    actualizarProgreso();
    mostrarPantalla(pantallaInicio);
}

botonComenzar.addEventListener("click", mostrarPregunta);
botonSiguiente.addEventListener("click", siguientePregunta);
botonReiniciar.addEventListener("click", reiniciar);
