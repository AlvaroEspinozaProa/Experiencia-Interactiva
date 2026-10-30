//Infraestructuras

let botoncancha = document.getElementById("mostrarcancha");
let texto = document.getElementById("textocancha");

botoncancha.addEventListener("click", function () {
    if (textocancha.innerHTML === "") {
        textocancha.innerHTML = `
            Un amplio espacio destinado a actividades deportivas, recreativas y clases de Educación Física.
            A su alrededor se encuentra un patio verde que fomenta el contacto con la naturaleza.
        `;
        botoncancha.textContent = "Ocultar";
    } else {
        textocancha.innerHTML = "";
        botoncancha.textContent = "Ver más";
    }
});

let botoncomedor = document.getElementById("mostrarcomedor");
let textocomedor = document.getElementById("textocomedor");

botoncomedor.addEventListener("click", function () {
    if (textocomedor.innerHTML === "") {
        textocomedor.innerHTML = `
            Un ambiente cómodo donde los estudiantes disfrutan diariamente del servicio PAICOR.
        `;
        botoncomedor.textContent = "Ocultar";
    } else {
        textocomedor.innerHTML = "";
        botoncomedor.textContent = "Ver más";
    }
});

let botonpreceptoria = document.getElementById("mostrarpreceptoria");
let textopreceptoria = document.getElementById("textopreceptoria");

botonpreceptoria.addEventListener("click", function () {
    if (textopreceptoria.innerHTML === "") {
        textopreceptoria.innerHTML = `
            Espacios de acompañamiento y orientación que brindan apoyo permanente a los estudiantes en su trayectoria escolar.
        `;
        botonpreceptoria.textContent = "Ocultar";
    } else {
        textopreceptoria.innerHTML = "";
        botonpreceptoria.textContent = "Ver más";
    }
});

let botonbaños = document.getElementById("mostrarbaños");
let textobaños = document.getElementById("textobaños");

botonbaños.addEventListener("click", function () {
    if (textobaños.innerHTML === "") {
        textobaños.innerHTML = `
            Sanitarios distribuidos estratégicamente dentro de la institución, brindando comodidad e higiene para toda la comunidad educativa.
        `;
        botonbaños.textContent = "Ocultar";
    } else {
        textobaños.innerHTML = "";
        botonbaños.textContent = "Ver más";
    }
});

let botonbici = document.getElementById("mostrarbici");
let textobici = document.getElementById("textobici");

botonbici.addEventListener("click", function () {
    if (textobici.innerHTML === "") {
        textobici.innerHTML = `
           Sector seguro destinado al estacionamiento de bicicletas, promoviendo el uso de medios de transporte saludables y sustentables.
        `;
        botonbici.textContent = "Ocultar";
    } else {
        textobici.innerHTML = "";
        botonbici.textContent = "Ver más";
    }
});

let botonmastil = document.getElementById("mostrarmastil");
let textomastil = document.getElementById("textomastil");

botonmastil.addEventListener("click", function () {
    if (textomastil.innerHTML === "") {
        textomastil.innerHTML = `
           Un lugar representativo donde se realizan actos escolares y ceremonias que fortalecen los valores patrios y el sentido de pertenencia.
        `;
        botonmastil.textContent = "Ocultar";
    } else {
        textomastil.innerHTML = "";
        botonmastil.textContent = "Ver más";
    }
});

let botonaula = document.getElementById("mostraraula");
let textoaula = document.getElementById("textoaula");

botonaula.addEventListener("click", function () {
    if (textoaula.innerHTML === "") {
        textoaula.innerHTML = `
          La institución cuenta con aulas amplias, cómodas y climatizadas, diseñadas para brindar un ambiente de aprendizaje moderno. Entre ellas se encuentran el <strong>Laboratorio de Informática</strong>, equipado con computadoras para programación y desarrollo de software; el <strong>Laboratorio de Ciencias</strong>, destinado a la realización de experiencias y prácticas experimentales; y el <strong>Laboratorio de Artes</strong>, un espacio pensado para fomentar la creatividad, el diseño y la expresión artística.
       
        `;
        botonaula.textContent = "Ocultar";
    } else {
        textoaula.innerHTML = "";
        botonaula.textContent = "Ver más";
    }
});

let botonbibloteca = document.getElementById("mostrarbibloteca");
let textobibloteca = document.getElementById("textobibloteca");

botonbibloteca.addEventListener("click", function () {
    if (textobibloteca.innerHTML === "") {
        textobibloteca.innerHTML = `
          La biblioteca ofrece un ambiente tranquilo para la lectura, el estudio y la investigación, con material de consulta disponible para los estudiantes. Además, cuenta con un espacio recreativo donde los alumnos pueden disfrutar de juegos de mesa, partidas de ping pong y metegol, promoviendo la integración, la convivencia y el descanso durante los recreos.
       
        `;
        botonbibloteca.textContent = "Ocultar";
    } else {
        textobibloteca.innerHTML = "";
        botonbibloteca.textContent = "Ver más";
    }
});
// =====================================================
// PLANO INTERACTIVO
// =====================================================

const zonasPlano = document.querySelectorAll(".zona-plano");

zonasPlano.forEach(zona => {

    zona.addEventListener("click", function () {

        const sector = this.dataset.sector;

        // Todas las tarjetas
        const tarjetas = document.querySelectorAll(".espacio");

        // Sacamos la selección anterior
        tarjetas.forEach(tarjeta => {
            tarjeta.classList.remove("tarjeta-activa");
        });


        // Buscamos la tarjeta correspondiente
        const tarjeta = document.getElementById("card-" + sector);


        if (tarjeta) {

            // Activamos la tarjeta
            tarjeta.classList.add("tarjeta-activa");


            // Bajamos hasta la tarjeta
            tarjeta.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });


            // Quitamos el resaltado después de unos segundos
            setTimeout(() => {
                tarjeta.classList.remove("tarjeta-activa");
            }, 4000);

        }

    });

});

//MATERIAS TABLA
function crearDesplegable(idBoton, idContenido, contenidoHTML){

    const boton = document.getElementById(idBoton);
    const contenido = document.getElementById(idContenido);

    boton.addEventListener("click", function(){

        if(contenido.innerHTML==""){
            contenido.innerHTML = contenidoHTML;
            boton.textContent="Ocultar";
        }else{
            contenido.innerHTML="";
            boton.textContent="Ver más";
        }

    });

}
//1 AÑO
crearDesplegable("mostrar1","contenido1",`
<table>
<tr><th>Materia</th><th>Descripción</th></tr>

<tr>
<td>Sistemas Operativos</td>
<td>Aprende el funcionamiento de la computadora, los sistemas operativos y las aplicaciones.</td>
</tr>

<tr>
<td>Entornos Digitales</td>
<td>Introduce el pensamiento computacional y la programación con Pilas Bloques y mBlock.</td>
</tr>


</table>
`);


//2 AÑO
crearDesplegable("mostrar2","contenido2",`
<table>
<tr><th>Materia</th><th>Descripción</th></tr>

<tr>
<td>Algoritmos y Programación</td>
<td>Aprende programación con PSeInt, utilizando funciones y resolución de problemas.</td>
</tr>

<tr>
<td>Estructura y Almacenamiento de Datos</td>
<td>Introducción a MySQL para crear y organizar bases de datos.</td>
</tr>

<tr>
<td>Club de Ciencias</td>
<td>Programación de placas Arduino con mBlock para desarrollar proyectos tecnológicos.</td>
</tr>

</table>
`);


//3 AÑO
crearDesplegable("mostrar3","contenido3",`
<table>
<tr><th>Materia</th><th>Descripción</th></tr>

<tr>
<td>Estructura y Almacenamiento de Datos II</td>
<td>Diseño y administración de bases de datos utilizando MySQL.</td>
</tr>

<tr>
<td>Taller de Inglés Aplicado</td>
<td>Uso del inglés en tecnología mediante proyectos y presentaciones.</td>
</tr>

<tr>
<td>Programación I</td>
<td>Introducción a Python: variables, funciones, ciclos, archivos y lógica de programación.</td>
</tr>

<tr>
<td>Club de Ciencias</td>
<td>Desarrollo de proyectos con Arduino, sensores y componentes electrónicos.</td>
</tr>

</table>
`);


//4 AÑO
crearDesplegable("mostrar4","contenido4",`
<table>
<tr><th>Materia</th><th>Descripción</th></tr>

<tr>
<td>Programación II</td>
<td>Programación en Python y desarrollo de proyectos prácticos.</td>
</tr>

<tr>
<td>Estructura y Almacenamiento de Datos III</td>
<td>Creación y administración de bases de datos con MySQL.</td>
</tr>

<tr>
<td>Diseño de Interfaces Graficas</td>
<td>Diseño de páginas web atractivas, funcionales y fáciles de usar.</td>
</tr>

</table>
`);


//5 AÑO
crearDesplegable("mostrar5","contenido5",`
<table>
<tr><th>Materia</th><th>Descripción</th></tr>

<tr>
<td>Robótica</td>
<td>Diseño y programación de robots con Arduino, mBlock y Tinkercad.</td>
</tr>

<tr>
<td>Programación III</td>
<td>Desarrollo de páginas web y aplicaciones utilizando Visual Studio Code.</td>
</tr>

<tr>
<td>Taller de Inglés Aplicado</td>
<td>Aprendizaje del vocabulario técnico e informático en inglés.</td>
</tr>

<tr>
<td>Club de Ciencias</td>
<td>Diseño e impresión de modelos 3D para proyectos tecnológicos.</td>
</tr>

</table>
`);


//6 AÑO
crearDesplegable("mostrar6","contenido6",`
<table>
<tr><th>Materia</th><th>Descripción</th></tr>

<tr>
<td>Desarrollo de Aplicaciones Web</td>
<td>Creación de aplicaciones web utilizando arquitectura de microservicios.</td>
</tr>

<tr>
<td>Programacion IIII</td>
<td>Uso de la tecnologia y desarrollo de páginas web y aplicaciones utilizando Visual Studio Code con diferentes programas.</td>
</tr>

<tr>
<td>Testing Digital</td>
<td>Pruebas y control de calidad para garantizar el correcto funcionamiento del software.</td>
</tr>

<tr>
<td>Taller de Inglés Aplicado</td>
<td>Uso del inglés en tecnología mediante proyectos y presentaciones.</td>
</tr>


</table>
`);






