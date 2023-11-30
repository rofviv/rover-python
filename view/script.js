var map = L.map('mapid').setView([-17.783319, -63.182102], 13);
var polyline = L.polyline([
    [-17.783319, -63.182102]
], { color: 'red' }).addTo(map);
var vehiculoConectado = false;
var vehiculoArmado = false;
var guiadoActivado = false;
var intentarConectar = false;
var arrayRuta = [];
// var refresh_handler = null;
// var time_refresh = 5;
var iniciandoRuta = false;

$(function() {
    // console.log("Doc Listo")
    $('#estadoVehiculoID').text('DESCONECTADO');
    $('#estadoVehiculoID').css("color", "#dc3545");

    function go() {
        if (vehiculoConectado) {
            // console.log("Consultando Datos")
            consultarEstadoActualRover()
        }
        setTimeout(go, 1000);
    }
    go();
});

window.addEventListener("keydown", function(event) {
    detectarTeclas(event)
}, false);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var iconoBase = L.Icon.extend({
    options: {
        iconSize: [20, 30],
        iconAnchor: [10, 10],
    }
});

iconoAzul = new iconoBase({ iconUrl: './marker.png' });

// roverMarcador = L.marker(map.getCenter(), {icon: iconoAzul}).addTo(map);
var roverMarcador = L.marker([0, 0], {
    rotationAngle: 0,
    draggable: false,
    icon: iconoAzul
}).addTo(map);

function detectarTeclas(event) {
    switch (event.key) {
        case "ArrowUp":
            avanzar();
            break;
        case 'ArrowDown':
            retroceder();
            break;
        case "ArrowLeft":
            girarIzquierda();
            break;
        case "ArrowRight":
            girarDerecha()
            break;
        case "m":
            modoManual()
            break;
        case "M":
            modoManual()
            break;
        case "g":
            modoGuiado()
            break;
        case "G":
            modoGuiado()
            break;
        case "e":
            armarDesarmar()
            break;
        case "E":
            armarDesarmar()
            break;
        case "d":
            cerrarConexionVehiculo()
            break;
        case "D":
            cerrarConexionVehiculo()
            break;
        case "h":
            modoHold()
            break;
        case "H":
            modoHold()
            break;
        case "a":
            modoAutomatico()
            break;
        case "A":
            modoAutomatico()
            break;
        case "p":
            guardarPunto()
            break;
        case "P":
            guardarPunto()
            break;
    }
}

eel.expose(mensajePython);

function mensajePython(m) {
    console.log(m);
}

async function armarDesarmar() {
    if (vehiculoConectado) {
        if (vehiculoArmado) {
            historial('[CMD] Desarmar Vehiculo')
            let res = await eel.desarmarVehiculo()()
            jsonRes = JSON.parse(res);
            historial('[MSJ] ' + jsonRes.msg)
            actualizarArmadoDesarmado(false)
            actualizarModo(jsonRes.modo)
        } else {
            historial('[CMD] Armar Vehiculo')
            let res = await eel.armarVehiculo()()
            jsonRes = JSON.parse(res);
            historial('[MSJ] ' + jsonRes.msg)
            actualizarArmadoDesarmado(true)
            actualizarModo(jsonRes.modo)
        }
    } else {
        alert("No hay conexion con el vehiculo")
    }
}

async function consultarEstadoActualRover() {
    let res = await eel.estadoActualRover()()
    jsonRes = JSON.parse(res);
    actualizarModo(jsonRes.modo);
    actualizarArmadoDesarmado(jsonRes.armado);
    actualizarCoordenadas(jsonRes.coordenadas.lat, jsonRes.coordenadas.lng, jsonRes.coordenadas.alt, jsonRes.grado);
    actualizarEstadoBateria(jsonRes.bateria.level, jsonRes.bateria.voltage, jsonRes.bateria.current);
    actualizarVelocidad(jsonRes.velocidad);

    // console.log(jsonRes.posicion)
}

async function conectarRover() {
    if (!intentarConectar) {
        if (!vehiculoConectado) {
            let conexion = document.querySelector("#txtConexion").value.trim()
            if (conexion != "") {
                historial('[MSJ] Conectando... Espera un momento')
                intentarConectar = true;

                let res = await eel.conectarRover(conexion)()
                jsonRes = JSON.parse(res);
                historial('[MSJ] ' + jsonRes.msg)
                vehiculoConectado = true;
                intentarConectar = false;

                $('#estadoVehiculoID').text('CONECTADO');
                $('#estadoVehiculoID').css("color", "#28a745");

                actualizarModo(jsonRes.modo);
                actualizarArmadoDesarmado(jsonRes.armado);
                actualizarCoordenadas(jsonRes.coordenadas.lat, jsonRes.coordenadas.lng, jsonRes.coordenadas.alt, jsonRes.grado);
                actualizarEstadoBateria(jsonRes.bateria.level, jsonRes.bateria.voltage, jsonRes.bateria.current);
                actualizarVelocidad(jsonRes.velocidad);
            } else {
                alert("Especifica la conexion")
            }
        } else {
            alert('El vehiculo ya esta CONECTADO')
        }
    } else {
        alert('El vehiculo esta intentado conectar, espera un momento')
    }
}

function actualizarCoordenadas(lat, lng, alt, grado) {
    roverMarcador.setLatLng([lat, lng])
    roverMarcador.setRotationAngle(grado)
    map.setView([lat, lng], 20);
}

function actualizarVelocidad(velocidad) {
    $('#velocidadID').text(parseFloat(velocidad).toFixed(1) + ' m/s');
}

function actualizarEstadoBateria(level, voltage, current) {
    $('#bateriaID').text(level + '% ' + '(Voltage: ' + voltage + ' Current: ' + current + ')');
}

function actualizarModo(modo) {
    if (modo == "MANUAL") {
        $('#modoActual').text('MANUAL');
        $('#modoActual').css("color", "#ffc107");
        guiadoActivado = false;
    } else if (modo == "GUIDED") {
        $('#modoActual').text('GUIADO');
        $('#modoActual').css("color", "#28a745");
        guiadoActivado = true;
    } else {
        $('#modoActual').text(modo);
        $('#modoActual').css("color", "#007bff");
        guiadoActivado = false;
    }
}

function actualizarArmadoDesarmado(armado) {
    if (armado == true) {
        $('#armDisarmId').text('ARMADO');
        $('#armDisarmId').css("color", "#28a745");
        vehiculoArmado = true;
    } else {
        $('#armDisarmId').text('DESARMADO');
        $('#armDisarmId').css("color", "#dc3545");
        vehiculoArmado = false
    }
}

function avanzar() {
    if (vehiculoConectado && guiadoActivado && vehiculoArmado) {
        historial('[CMD] AVANZAR')
        eel.avanzar()
    } else {
        alert('Error de comando: asegurate que estes CONECTADO, en modo GUIADO y el vehiculo ARMADO')
    }
}

function retroceder() {
    if (vehiculoConectado && guiadoActivado && vehiculoArmado) {
        historial('[CMD] RETROCEDER')
        eel.retroceder()
    } else {
        alert('Error de comando: asegurate que estes CONECTADO, en modo GUIADO y el vehiculo ARMADO')
    }
}

function girarIzquierda() {
    if (vehiculoConectado && guiadoActivado && vehiculoArmado) {
        historial('[CMD] Girar a la IZQUIERDA')
        eel.girarIzquierda()
    } else {
        alert('Error de comando: asegurate que estes CONECTADO, en modo GUIADO y el vehiculo ARMADO')
    }
}

function girarDerecha() {
    if (vehiculoConectado && guiadoActivado && vehiculoArmado) {
        historial('[CMD] Girar a la DERECHA')
        eel.girarDerecha()
    } else {
        alert('Error de comando: asegurate que estes CONECTADO, en modo GUIADO y el vehiculo ARMADO')
    }

}

async function modoManual() {
    if (vehiculoConectado) {
        historial('[CMD] Cambiar a modo MANUAL')
        let res = await eel.modoManual()()
        actualizarModo('MANUAL');
        historial('[MSJ] ' + res)

    } else {
        alert("No hay conexion con el vehiculo")
    }
}

async function modoGuiado() {
    if (vehiculoConectado) {
        historial('[CMD] Cambiar a modo GUIADO')
        let res = await eel.modoGuiado()()
        actualizarModo('GUIDED');
        historial('[MSJ] ' + res)
    } else {
        alert("No hay conexion con el vehiculo")
    }
}

async function modoHold() {
    if (vehiculoConectado) {
        historial('[CMD] Cambiar a modo HOLD')
        let res = await eel.modoHold()()
        actualizarModo('HOLD');
        historial('[MSJ] ' + res)
    } else {
        alert("No hay conexion con el vehiculo")
    }
}

async function modoAutomatico() {
    if (vehiculoConectado) {
        historial('[CMD] Cambiar a modo AUTOMATICO')
        let res = await eel.modoAutomatico()()
        actualizarModo('AUTOMATICO');
        historial('[MSJ] ' + res)

    } else {
        alert("No hay conexion con el vehiculo")
    }
}

function historial(text) {
    $('#txtHistorial').val($('#txtHistorial').val() + text + '\n');
    $('#txtHistorial').scrollTop(document.getElementById("txtHistorial").scrollHeight);
}

async function cambiarVelocidad() {
    if (vehiculoConectado) {
        let valor = document.querySelector("#txtVelocidad").value.trim()
        if (valor != "") {
            historial("[CMD] Cambiar velocidad")
            let res = await eel.cambiarVelocidad(parseFloat(valor))()
            historial("[MSG] " + res)
        } else {
            alert("El campo no velocidad no puede estar vacio")
        }
    } else {
        alert('El vehiculo no esta CONECTADO')
    }
}

async function cerrarConexionVehiculo() {
    if (vehiculoConectado) {
        let r = confirm("Deseas desconectar el vehiculo?")
        if (r) {
            historial("[CMD] Desconectar el vehiculo")
            vehiculoConectado = false;
            let res = await eel.deconectarVehiculo()()
            historial("[MSG] " + res)

            $('#estadoVehiculoID').text('DESCONECTADO');
            $('#estadoVehiculoID').css("color", "#dc3545");

            $('#armDisarmId').text('');
            $('#bateriaID').text('');
            $('#modoActual').text('');
            $('#velocidadID').text('');
        }
    } else {
        alert('El vehiculo ya esta DESCONECTADO')
    }
}


function cargarMisionesDisponibles() {
    for (var i = 1; i < 50; i++) {
        $("#selectIdRuta").append('<option value=' + i + '>' + i + '</option>');
    }
}

async function asignarMision() {
    if (vehiculoConectado) {
        let idRuta = document.getElementById('selectIdRuta').value;

        historial("[INF] Obteniendo las coordenadas de la mision");
        const URI = "https://patioserviceonline.com/api/v1/?route=rover&type=obtener_ruta_id&id_ruta=" + idRuta;
        let response = await fetch(URI, {
            method: 'GET'
        })
        let res = await response.json();
        if (res.length > 0) {
            historial("[INF] Cargando mision al Rover, espera por favor...");
            let m = await eel.asignarMision(res[0].puntos)()
            historial('[MSJ] ' + m)

            let jsonPuntos = JSON.parse(res[0].puntos);
            let coords = [];
            jsonPuntos.forEach(p => {
                coords.push([p.lat, p.lng])
            })
            polyline.setLatLngs(coords)
            map.fitBounds(polyline.getBounds());
        } else {
            alert("No es encontro la ruta de esta mision");
            historial("[ERR] No se pudo cargar la mision");
        }
    } else {
        alert('El vehiculo esta DESCONECTADO')
    }
}

function empezarRuta() {
    if (!iniciandoRuta) {
        iniciandoRuta = true;
        let r = confirm("Presiona la tecla 'P' para guargar el punto GPS");
        if (r) {
            arrayRuta = [];
            // reset_timer();
            $('#msjRutaID').text('Presiona la tecla "P" para guardar el punto');
        }
    } else {
        alert('Ya se esta guardando la ruta')
    }
}

// function reset_timer() {
//     clearTimeout(refresh_handler);
//     refresh_handler = setTimeout(() => {
//         timerAcumulandoPuntosRuta();
//         historial("[INF] Guardando coordenadas");
//     }, this.time_refresh * 1000);
// }

// function timerAcumulandoPuntosRuta() {
//     arrayRuta.push({
//         'lat': roverMarcador.getLatLng().lat,
//         'lng': roverMarcador.getLatLng().lng,
//         'observacion': ''
//     })
//     // reset_timer();
// }

function guardarPunto() {
    if (iniciandoRuta) {
        var observacion = prompt("Observacion del punto marcado (opcional)", "");
        arrayRuta.push({
            'lat': roverMarcador.getLatLng().lat,
            'lng': roverMarcador.getLatLng().lng,
            'observacion': observacion
        });
        historial("[INF] Punto de coordenadas guardado");
    } else {
        alert("Debes iniciar la ruta primero")
    }
}

async function guardarRuta() {
    // clearTimeout(refresh_handler);
    // refresh_handler = null;
    // console.log(arrayRuta);
    var rutaNombre = prompt("Nombre de la ruta", "Nueva Ruta");

    historial("[INF] Obteniendo ruta acumulada y guardando, espera un momento...");
    const URI = "https://patioserviceonline.com/api/v1/?route=rover&type=registrar_ruta";
    let data = {
        "ciudad": "Santa Cruz",
        "descripcion": rutaNombre,
        "lat_origen": arrayRuta[0].lat,
        "lng_origen": arrayRuta[0].lng,
        "lat_destino": arrayRuta[arrayRuta.length - 1].lat,
        "lng_destino": arrayRuta[arrayRuta.length - 1].lng,
        "puntos": JSON.stringify(arrayRuta)
    }
    let response = await fetch(URI, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(data)
    })
    console.log(await response.json())
    historial("[OK] Ruta guardada en la BD...");
    iniciandoRuta = false
    $('#msjRutaID').text('');
}

window.onbeforeunload = function() {
    return "Estas seguro de actualizar?";
};


cargarMisionesDisponibles()