const parejasHtml = [
    ["html", ["<html>", "</html>"], "<html>", "Documento HTML", "Es la etiqueta principal que envuelve todo el documento. Indica al navegador dónde empieza y termina la página web."],
    ["head", ["<head>", "</head>"], "<head>", "Configuración interna", "Es la sección de configuración interna. Guarda información necesaria para la página que no se muestra directamente en la pantalla."],
    ["title", ["<title>", "</title>"], "<title>", "Nombre de la página", "Define el nombre de la página web, que es el texto que aparece en la pestaña del navegador."],
    ["body", ["<body>", "</body>"], "<body>", "Parte visible", "Es la parte visible de la página. Aquí se coloca todo lo que el usuario puede ver, como textos, imágenes y enlaces."],
    ["h1", ["<h1>", "</h1>"], "<h1>", "Título principal", "Se usa para escribir el título principal del contenido, destacándolo con el tamaño de texto más grande."],
    ["p", ["<p>", "</p>"], "<p>", "Párrafos", "Se utiliza para escribir bloques de texto normal o párrafos."],
    ["a", ["<a>", "</a>"], "<a>", "Enlace", "Crea un enlace que te redirige a otra página web o archivo al hacer clic sobre él."],
    ["img", ["<img>", "<img>"], "<img>", "Imagen", "Sirve para insertar y mostrar una imagen o foto en la pantalla."]
].map(([id, cartas, etiqueta, titulo, texto]) => ({ id, cartas, etiqueta, titulo, texto }));

const preguntasHtml = [
    ["El texto escrito dentro de la etiqueta <title> se muestra dentro del contenido visible de la página web, junto a los párrafos e imágenes.", false, "¡Correcto! El título se ubica exclusivamente en la pestaña del navegador y en los resultados de búsqueda.", "Incorrecto. El texto dentro de <title> no aparece en la pantalla de la página web, sino en la pestaña superior del navegador."],
    ["La etiqueta <img> es una etiqueta de cierre automático (vacía), por lo que no requiere una etiqueta de cierre como </img>.", true, "¡Correcto! La etiqueta <img> solo necesita atributos como src para funcionar y no encierra texto, por lo que no lleva etiqueta de cierre.", "Incorrecto. <img> es una etiqueta especial que se cierra sobre sí misma y no utiliza la sintaxis </img>."],
    ["Todo el contenido con el que los usuarios interactúan en una página web (como textos, botones e imágenes) debe colocarse dentro de la etiqueta <body>.", true, "¡Correcto! La etiqueta <body> representa el cuerpo visible de la página y contiene todos sus elementos interactivos y visuales.", "Incorrecto. Los elementos visibles colocados fuera de <body> no se estructuran correctamente en el navegador."],
    ["La etiqueta <head> se utiliza para guardar configuraciones e información del sitio que el navegador necesita, pero que no se muestran directamente en la pantalla.", true, "¡Correcto! El <head> almacena metadatos, títulos, enlaces a hojas de estilo e instrucciones técnicas.", "Incorrecto. La función del <head> es almacenar la metainformación técnica y no el contenido visible."],
    ["Un documento HTML puede incluir múltiples etiquetas <html> para separar distintas secciones de una misma página.", false, "¡Correcto! Solo existe una etiqueta <html> por archivo HTML para definir el inicio y fin del documento.", "Incorrecto. Un documento solo puede tener una única etiqueta raíz <html> que envuelve a todo el código."],
    ["El atributo href dentro de la etiqueta <a> es el encargado de especificar la dirección web a la cual debe llevar el enlace al hacer clic.", true, "¡Correcto! Sin el atributo href, la etiqueta <a> no sabría hacia qué enlace o ruta redirigir al usuario.", "Incorrecto. El atributo href es imprescindible para definir el destino del hipervínculo."]
].map(([texto, correcta, feedbackCorrecto, feedbackIncorrecto]) => ({ texto, correcta, feedbackCorrecto, feedbackIncorrecto }));

const pantallas = Object.fromEntries(["inicio", "memoria", "reglas-test", "test", "resultado"].map((nombre) => [nombre, document.getElementById(nombre === "inicio" ? "pantalla-inicio-html" : `pantalla-${nombre}`)]));
const tablero = document.getElementById("tablero-memoria");
const pilaDefiniciones = document.getElementById("pila-definiciones");
const definicionActual = document.getElementById("definicion-actual");
const botonIniciar = document.getElementById("boton-iniciar-html");
const botonAvanzar = document.getElementById("boton-avanzar-test");
let primeraCarta, bloqueo, paresEncontrados, indicePregunta, puntajeTest, testRespondido, segundosTest = 45;
let intervaloTest, temporizadorPenalizacion, temporizadorAvisoPenalizacion, temporizadorFinalizacionPenalizacion, temporizadorTransicionMemoria, finalizacionPendienteTrasPenalizacion;

const mezclar = (lista) => [...lista].sort(() => Math.random() - .5);
const mostrarPantalla = (nombre) => {
    document.body.dataset.fase = nombre === "test" ? "test" : nombre === "reglas-test" ? "reglas-test" : "normal";
    Object.entries(pantallas).forEach(([clave, pantalla]) => { pantalla.hidden = clave !== nombre; });
};
const restaurarPantallaInicio = () => {
    const elementos = pantallas.inicio.querySelectorAll(".html-paso, h2, p:not(.html-paso), .html-reglas");
    if (window.gsap) {
        gsap.set(elementos, { clearProps: "opacity,visibility,transform" });
        return;
    }
    elementos.forEach((elemento) => {
        elemento.style.opacity = "";
        elemento.style.visibility = "";
        elemento.style.transform = "";
    });
};
const actualizarMemoria = () => {
    document.getElementById("progreso-memoria").textContent = `${paresEncontrados} / ${parejasHtml.length} pares`;
    document.getElementById("estado-juego").textContent = `${paresEncontrados} de ${parejasHtml.length} parejas`;
};

function prepararMemoria() {
    primeraCarta = null; bloqueo = false; paresEncontrados = 0;
    tablero.replaceChildren(); pilaDefiniciones.replaceChildren(); botonAvanzar.hidden = true;
    definicionActual.innerHTML = "<p>Uní una apertura con su cierre para descubrir qué función cumple esa etiqueta.</p>";
    actualizarMemoria();
    mezclar(parejasHtml.flatMap((pareja) => pareja.cartas.map((texto) => ({ ...pareja, texto })))).forEach((carta, indice) => {
        const boton = document.createElement("button");
        boton.type = "button"; boton.className = "memoria-carta"; boton.style.setProperty("--orden-entrada", indice);
        boton.dataset.par = carta.id; boton.textContent = carta.texto; boton.setAttribute("aria-label", "Carta oculta");
        boton.addEventListener("click", () => revelarCarta(boton, carta));
        tablero.appendChild(boton);
    });
}

function revelarCarta(boton, carta) {
    if (bloqueo || boton.classList.contains("revelada") || boton.classList.contains("acertada")) return;
    boton.classList.add("revelada"); boton.setAttribute("aria-label", carta.texto);
    if (!primeraCarta) { primeraCarta = { boton, carta }; return; }
    bloqueo = true;
    const segundaCarta = { boton, carta };
    if (primeraCarta.carta.id === segundaCarta.carta.id) {
        primeraCarta.boton.classList.replace("revelada", "acertada");
        segundaCarta.boton.classList.replace("revelada", "acertada");
        paresEncontrados += 1; actualizarMemoria(); guardarDefinicion(carta);
        window.setTimeout(continuarTrasPareja, 520);
        return;
    }
    window.setTimeout(() => {
        primeraCarta.boton.classList.remove("revelada"); segundaCarta.boton.classList.remove("revelada");
        primeraCarta = null; bloqueo = false;
    }, 800);
}

function guardarDefinicion(carta) {
    pilaDefiniciones.querySelectorAll(".tarjeta-definicion").forEach((tarjeta) => {
        tarjeta.classList.remove("tarjeta-definicion--desplaza");
        void tarjeta.offsetWidth;
        tarjeta.classList.add("tarjeta-definicion--desplaza");
    });
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-definicion tarjeta-definicion--entra";
    const etiqueta = document.createElement("code"); etiqueta.textContent = carta.etiqueta;
    const titulo = document.createElement("strong"); titulo.textContent = carta.titulo;
    const texto = document.createElement("p"); texto.textContent = carta.texto;
    tarjeta.append(etiqueta, titulo, texto);
    pilaDefiniciones.prepend(tarjeta);
    const resumen = document.createElement("p");
    resumen.textContent = `Definición encontrada: ${carta.etiqueta}. Leela en la pila de la derecha.`;
    definicionActual.replaceChildren(resumen);
    definicionActual.classList.remove("definicion-entra");
    window.requestAnimationFrame(() => definicionActual.classList.add("definicion-entra"));
}

function continuarTrasPareja() {
    primeraCarta = null; bloqueo = false;
    if (paresEncontrados === parejasHtml.length) {
        botonAvanzar.hidden = false;
        botonAvanzar.focus();
        document.getElementById("estado-juego").textContent = "Memoria completada";
    }
}

function actualizarCronometro() {
    document.getElementById("cronometro-test").textContent = `00:${String(Math.max(segundosTest, 0)).padStart(2, "0")}`;
    document.getElementById("contenedor-cronometro").classList.toggle("urgente", segundosTest <= 10);
}

function iniciarTransicionMemoriaTest() {
    const transicion = document.getElementById("transicion-memoria-test");
    const reduccionMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    clearTimeout(temporizadorTransicionMemoria);
    botonAvanzar.disabled = true;
    botonAvanzar.setAttribute("aria-busy", "true");
    document.body.dataset.fase = "memoria-test-intro";
    transicion.hidden = false;
    transicion.setAttribute("aria-hidden", "false");
    transicion.classList.remove("activa");
    window.requestAnimationFrame(() => transicion.classList.add("activa"));
    temporizadorTransicionMemoria = window.setTimeout(() => {
        transicion.hidden = true;
        transicion.setAttribute("aria-hidden", "true");
        transicion.classList.remove("activa");
        botonAvanzar.disabled = false;
        botonAvanzar.removeAttribute("aria-busy");
        mostrarPantalla("reglas-test");
        document.getElementById("estado-juego").textContent = "Test HTML listo";
        document.getElementById("boton-comenzar-test").focus();
    }, reduccionMovimiento ? 0 : 2700);
}

function aplicarPenalizacion() {
    const contenedor = document.getElementById("contenedor-cronometro");
    const aviso = document.getElementById("penalizacion-cronometro");
    clearTimeout(temporizadorPenalizacion);
    clearTimeout(temporizadorAvisoPenalizacion);
    clearTimeout(temporizadorFinalizacionPenalizacion);
    contenedor.classList.remove("cronometro-penalizado");
    aviso.hidden = false;
    window.requestAnimationFrame(() => contenedor.classList.add("cronometro-penalizado"));
    temporizadorPenalizacion = window.setTimeout(() => {
        temporizadorPenalizacion = undefined;
        segundosTest = Math.max(0, segundosTest - 3);
        actualizarCronometro();
        if (finalizacionPendienteTrasPenalizacion || segundosTest <= 0) {
            finalizacionPendienteTrasPenalizacion = false;
            temporizadorFinalizacionPenalizacion = window.setTimeout(() => finalizarTest(segundosTest <= 0), 450);
        } else {
            document.getElementById("boton-siguiente-test").disabled = false;
        }
    }, 280);
    temporizadorAvisoPenalizacion = window.setTimeout(() => {
        temporizadorAvisoPenalizacion = undefined;
        contenedor.classList.remove("cronometro-penalizado");
        aviso.hidden = true;
    }, 980);
}

function cancelarPenalizacion() {
    clearTimeout(temporizadorPenalizacion);
    clearTimeout(temporizadorAvisoPenalizacion);
    clearTimeout(temporizadorFinalizacionPenalizacion);
    temporizadorPenalizacion = temporizadorAvisoPenalizacion = temporizadorFinalizacionPenalizacion = undefined;
    finalizacionPendienteTrasPenalizacion = false;
    document.getElementById("contenedor-cronometro").classList.remove("cronometro-penalizado");
    document.getElementById("penalizacion-cronometro").hidden = true;
}

function iniciarTransicionVirus() {
    const transicion = document.getElementById("transicion-virus");
    const reduccionMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.body.dataset.fase = "virus-intro"; document.body.classList.add("virus-infectando");
    transicion.hidden = false; transicion.classList.remove("activa");
    window.requestAnimationFrame(() => transicion.classList.add("activa"));
    window.setTimeout(() => {
        transicion.hidden = true; transicion.classList.remove("activa");
        document.body.classList.remove("virus-infectando");
        mostrarPantalla("test");
        document.getElementById("estado-juego").textContent = `Test final · ${preguntasHtml.length} preguntas`;
        indicePregunta = 0; puntajeTest = 0; segundosTest = 45; actualizarCronometro(); renderizarPregunta();
        clearInterval(intervaloTest);
        intervaloTest = window.setInterval(() => {
            segundosTest -= 1; actualizarCronometro();
            if (segundosTest <= 0) {
                if (temporizadorPenalizacion) finalizacionPendienteTrasPenalizacion = true;
                else finalizarTest(true);
            }
        }, 1000);
    }, reduccionMovimiento ? 0 : 5000);
}

function renderizarPregunta() {
    testRespondido = false;
    const pregunta = preguntasHtml[indicePregunta];
    document.body.dataset.virusNivel = String(Math.min(indicePregunta + 1, 5));
    document.body.classList.remove("virus-impulso");
    window.requestAnimationFrame(() => document.body.classList.add("virus-impulso"));
    document.getElementById("indice-test").textContent = `PREGUNTA ${indicePregunta + 1} DE ${preguntasHtml.length}`;
    document.getElementById("pregunta-test").textContent = pregunta.texto;
    const opciones = document.getElementById("opciones-test"); opciones.replaceChildren();
    document.getElementById("feedback-test").hidden = true;
    document.getElementById("boton-siguiente-test").hidden = true;
    document.getElementById("boton-siguiente-test").disabled = false;
    [[true, "VERDADERO"], [false, "FALSO"]].forEach(([valor, texto]) => {
        const boton = document.createElement("button");
        boton.type = "button"; boton.className = "opcion-vf"; boton.textContent = texto;
        boton.addEventListener("click", () => responderTest(valor)); opciones.appendChild(boton);
    });
}

function responderTest(respuesta) {
    if (testRespondido || segundosTest <= 0) return;
    testRespondido = true;
    const pregunta = preguntasHtml[indicePregunta]; const acerto = respuesta === pregunta.correcta;
    if (acerto) puntajeTest += 1;
    else {
        finalizacionPendienteTrasPenalizacion = indicePregunta === preguntasHtml.length - 1;
        aplicarPenalizacion();
    }
    document.querySelectorAll(".opcion-vf").forEach((boton) => {
        boton.disabled = true;
        const valor = boton.textContent === "VERDADERO";
        boton.classList.toggle("correcta", valor === pregunta.correcta);
        boton.classList.toggle("incorrecta", !acerto && valor === respuesta);
    });
    const feedback = document.getElementById("feedback-test");
    feedback.hidden = false; feedback.className = `feedback-test ${acerto ? "correcto" : "incorrecto"}`;
    document.getElementById("feedback-test-titulo").textContent = acerto ? "¡Correcto!" : "Respuesta incorrecta: -3 segundos.";
    document.getElementById("feedback-test-texto").textContent = acerto ? pregunta.feedbackCorrecto : pregunta.feedbackIncorrecto;
    const botonSiguiente = document.getElementById("boton-siguiente-test");
    botonSiguiente.hidden = false;
    botonSiguiente.disabled = !acerto;
    if (acerto && segundosTest <= 0) window.setTimeout(() => finalizarTest(true), 450);
}

function finalizarTest(agotado) {
    clearInterval(intervaloTest);
    if (pantallas.resultado.hidden === false) return;
    const kicker = document.getElementById("resultado-kicker");
    const titulo = document.getElementById("resultado-titulo-html");
    const superado = !agotado && puntajeTest >= Math.ceil(preguntasHtml.length * .7);
    document.body.classList.toggle("resultado-no-superado", !superado);
    document.getElementById("resultado-puntaje-html").textContent = `${puntajeTest} de ${preguntasHtml.length} respuestas correctas.`;
    if (agotado) {
        document.getElementById("estado-juego").textContent = "Tiempo agotado";
        kicker.textContent = "TIEMPO AGOTADO"; titulo.innerHTML = "Desafío <span>no superado</span>";
        document.getElementById("resultado-mensaje-html").textContent = "El virus llegó antes. Volvé a intentarlo: cada respuesta te acerca a superar el desafío.";
    } else if (superado) {
        document.getElementById("estado-juego").textContent = "Desafío completado";
        kicker.textContent = "MISIÓN COMPLETADA"; titulo.innerHTML = "¡Desafío <span>superado!</span>";
        document.getElementById("resultado-mensaje-html").textContent = puntajeTest === preguntasHtml.length ? "¡Excelente! Reconociste todas las ideas del desafío." : "¡Muy bien! Superaste el desafío con una base sólida de HTML.";
    } else {
        document.getElementById("estado-juego").textContent = "Desafío no superado";
        kicker.textContent = "ARCHIVO INESTABLE"; titulo.innerHTML = "Desafío <span>no superado</span>";
        document.getElementById("resultado-mensaje-html").textContent = "Estuviste cerca. Volvé a intentarlo y encontrá las respuestas que faltan.";
    }
    mostrarPantalla("resultado");
}

function abrirArchivo() {
    if (botonIniciar.disabled) return;
    const reduccionMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { left, top, width, height } = botonIniciar.getBoundingClientRect();
    const pantallaInicio = pantallas.inicio;
    const pantallaMemoria = pantallas.memoria;
    const elementosSalida = Array.from(pantallaInicio.querySelectorAll(".html-paso, h2, p:not(.html-paso), .html-reglas"));

    botonIniciar.disabled = true;
    botonIniciar.setAttribute("aria-busy", "true");
    if (reduccionMovimiento || !window.gsap) {
        prepararMemoria();
        mostrarPantalla("memoria");
        botonIniciar.disabled = false;
        botonIniciar.removeAttribute("aria-busy");
        document.querySelector(".memoria-carta")?.focus();
        return;
    }

    const viajero = botonIniciar.cloneNode(true);
    viajero.classList.add("boton-viajero");
    viajero.removeAttribute("id");
    viajero.setAttribute("aria-hidden", "true");
    document.body.appendChild(viajero);
    const textoViajero = viajero.querySelector(".html-boton-texto");
    const iconoViajero = viajero.querySelector(".html-boton-icono");
    prepararMemoria();
    const cartasMemoria = Array.from(pantallaMemoria.querySelectorAll(".memoria-carta"));
    const anchoInicio = pantallaInicio.getBoundingClientRect().width;
    let altoMemoria = 0;

    gsap.set(viajero, { left, top, width, height, x: 0, y: 0, transformOrigin: "center center" });
    const linea = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: () => {
            viajero.remove();
            botonIniciar.disabled = false;
            botonIniciar.removeAttribute("aria-busy");
            document.querySelector(".memoria-carta")?.focus();
        }
    });

    linea
        .to(viajero, { width: anchoInicio, x: -left + pantallaInicio.getBoundingClientRect().left, borderRadius: 0, duration: .42, ease: "power3.inOut" })
        .to([textoViajero, iconoViajero], { autoAlpha: 0, y: -14, duration: .16, ease: "power2.in" }, "<.12")
        .to(elementosSalida, { autoAlpha: 0, y: -44, duration: .28, stagger: .035, ease: "power2.in" }, "<.03")
        .to(viajero, { y: -top - height - 24, duration: .52, ease: "power4.in" }, "<.04")
        .call(() => {
            mostrarPantalla("memoria");
            const rectMemoria = pantallaMemoria.getBoundingClientRect();
            gsap.set(pantallaMemoria, { autoAlpha: 0, y: 42, scale: .985 });
            gsap.set(cartasMemoria, { autoAlpha: 0, y: 24, scale: .94 });
            altoMemoria = rectMemoria.height;
            gsap.set(viajero, {
                left: rectMemoria.left,
                top: rectMemoria.top,
                width: rectMemoria.width,
                height,
                x: 0,
                y: -height,
                autoAlpha: 1,
                borderRadius: 0
            });
        })
        .to(viajero, { y: () => altoMemoria, duration: .66, ease: "power2.inOut", onComplete: () => viajero.remove() })
        .to(pantallaMemoria, { autoAlpha: 1, y: 0, scale: 1, duration: .46, ease: "power3.out" }, "<.06")
        .to(cartasMemoria, { autoAlpha: 1, y: 0, scale: 1, duration: .35, stagger: .035, ease: "back.out(1.35)" }, "<.1");
}

botonIniciar.addEventListener("click", abrirArchivo);
botonAvanzar.addEventListener("click", iniciarTransicionMemoriaTest);
document.getElementById("boton-comenzar-test").addEventListener("click", iniciarTransicionVirus);
document.getElementById("boton-siguiente-test").addEventListener("click", () => {
    if (!testRespondido || temporizadorPenalizacion) return;
    indicePregunta += 1;
    if (indicePregunta < preguntasHtml.length) return renderizarPregunta();
    if (temporizadorPenalizacion) {
        finalizacionPendienteTrasPenalizacion = true;
        return;
    }
    finalizarTest(segundosTest <= 0);
});
document.getElementById("boton-reiniciar-html").addEventListener("click", () => { clearInterval(intervaloTest); cancelarPenalizacion(); document.body.classList.remove("resultado-no-superado"); prepararMemoria(); restaurarPantallaInicio(); mostrarPantalla("inicio"); document.getElementById("estado-juego").textContent = "8 parejas por encontrar"; botonIniciar.focus(); });
