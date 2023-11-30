import eel
import time
import json
from dronekit import connect, VehicleMode, LocationGlobalRelative, Command, LocationGlobal
from pymavlink import mavutil

vehicle = None
gnd_speed = 0.5

eel.init('view')

eel.mensajePython('Conexion con python')

@eel.expose
def avanzar():
	global vehicle
	set_velocity_body(vehicle, gnd_speed, 0, 0)

@eel.expose
def retroceder():
	global vehicle
	set_velocity_body(vehicle, 0, 0, 0)

@eel.expose
def girarIzquierda():
	global vehicle
	set_velocity_body(vehicle, 0, -gnd_speed, 0)

@eel.expose
def girarDerecha():
	global vehicle
	set_velocity_body(vehicle, 0, gnd_speed, 0)

@eel.expose
def coordenadasActual():
	return json.dumps({
		'coordenadas': {
			'lat': vehicle.location.global_relative_frame.lat,
			'lng': vehicle.location.global_relative_frame.lon,
			'alt': vehicle.location.global_relative_frame.alt
		}
		})

@eel.expose
def modoManual():
	vehicle.mode = VehicleMode("MANUAL")
	return 'Modo MANUAL'

@eel.expose
def modoGuiado():
	vehicle.mode = VehicleMode("GUIDED")
	return 'Modo GUIADO'

@eel.expose
def modoHold():
	vehicle.mode = VehicleMode("HOLD")
	return 'Modo HOLD'

@eel.expose
def modoAutomatico():
	vehicle.mode = VehicleMode("AUTO")
	return 'Modo AUTO'

@eel.expose
def cambiarVelocidad(velocidad):
	global gnd_speed
	gnd_speed = float(velocidad)
	return 'Velocidad cambiada a %s' % velocidad

@eel.expose
def estadoActualRover():
	return json.dumps({
		'msg': 'Estado del rover',
		'coordenadas': {
			'lat': vehicle.location.global_relative_frame.lat,
			'lng': vehicle.location.global_relative_frame.lon,
			'alt': vehicle.location.global_relative_frame.alt
		},
		'posicion': {
			'pitch': vehicle.attitude.pitch,
			'yaw': vehicle.attitude.yaw,
			'roll': vehicle.attitude.roll,
		},
		'bateria': {
			'voltage': vehicle.battery.voltage,
			'current': vehicle.battery.current,
			'level': vehicle.battery.level,
		},
		'velocidad': vehicle.groundspeed,
		'modo': vehicle.mode.name,
		'armado': vehicle.armed,
		'grado': vehicle.heading
		})

@eel.expose
def conectarRover(connection_string):
	global vehicle
	print('conectando con el vehiculo...')
	vehicle = connect(connection_string)
	print(" Global Location: %s" % vehicle.location.global_frame)
	print(" Global Location (relative altitude): %s" % vehicle.location.global_relative_frame)
	print(" Local Location: %s" % vehicle.location.local_frame)
	print(" Velocity: %s" % vehicle.velocity)
	print(" Gimbal status: %s" % vehicle.gimbal)
	print(" Heading: %s" % vehicle.heading)
	print(" Attitude: %s" % vehicle.attitude)
	print(" GPS: %s" % vehicle.gps_0)
	print(" Battery: %s" % vehicle.battery)
	print(" Groundspeed: %s" % vehicle.groundspeed)    # settable
	print(" Mode: %s" % vehicle.mode.name)    # settable
	print(" Armed: %s" % vehicle.armed)    # settable

	return json.dumps({
		'msg': 'Vehiculo CONECTADO correctamente',
		'coordenadas': {
			'lat': vehicle.location.global_relative_frame.lat,
			'lng': vehicle.location.global_relative_frame.lon,
			'alt': vehicle.location.global_relative_frame.alt
		},
		'posicion': {
			'pitch': vehicle.attitude.pitch,
			'yaw': vehicle.attitude.yaw,
			'roll': vehicle.attitude.roll,
		},
		'bateria': {
			'voltage': vehicle.battery.voltage,
			'current': vehicle.battery.current,
			'level': vehicle.battery.level,
		},
		'velocidad': vehicle.groundspeed,
		'modo': vehicle.mode.name,
		'armado': vehicle.armed,
		'grado': vehicle.heading
		})


def set_velocity_body(vehicle, vx, vy, vz):
    msg = vehicle.message_factory.set_position_target_local_ned_encode(
            0,
            0, 0,
            mavutil.mavlink.MAV_FRAME_BODY_NED,
            0b0000111111000111, #-- BITMASK -> Consider only the velocities
            0, 0, 0,        #-- POSITION
            vx, vy, vz,     #-- VELOCITY
            0, 0, 0,        #-- ACCELERATIONS
            0, 0)
    vehicle.send_mavlink(msg)
    vehicle.flush()

@eel.expose
def armarVehiculo():
   global vehicle
   # while not vehicle.is_armable:
   #    print("Esperando que el vehiculo este armado")
   #    time.sleep(1)

   print("Armando motores")
   # vehicle.mode = VehicleMode("MANUAL")
   vehicle.armed = True

   while not vehicle.armed: time.sleep(1)

   return json.dumps({
   		'msg': 'Vehiculo ARMADO',
   		'modo': vehicle.mode.name
   	})

   # print("Taking Off")
   # vehicle.simple_takeoff(altitude)

   # while True:
   #    v_alt = vehicle.location.global_relative_frame.alt
   #    print(">> Altitude = %.1f m"%v_alt)
   #    if v_alt >= altitude - 1.0:
   #        print("Target altitude reached")
   #        break
   #    time.sleep(1)

@eel.expose
def desarmarVehiculo():
	global vehicle
	# vehicle.mode = VehicleMode("MANUAL")
	vehicle.armed = False

	return json.dumps({
   		'msg': 'Vehiculo DESARMADO',
   		'modo': vehicle.mode.name
   	})

@eel.expose
def clear_mission(vehicle):
    cmds = vehicle.commands
    vehicle.commands.clear()
    vehicle.flush()

    cmds = vehicle.commands
    cmds.download()
    cmds.wait_ready()

@eel.expose
def asignarMision(puntos):
    lista = json.loads(puntos)
    clear_mission(vehicle)
    cmds = vehicle.commands
    cmds.download()
    cmds.wait_ready()
    cmds.clear()
    missionlist=[]

    for wp in lista:
        wpLastObject = Command( 0, 0, 0, mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT, mavutil.mavlink.MAV_CMD_NAV_WAYPOINT, 0, 0, 0, 0, 0, 0, 
	                               float(wp['lat']), float(wp['lng']), 0)        
        missionlist.append(wpLastObject)

    for cmd in missionlist:
        cmds.add(cmd)
    cmds.upload()

    return 'Mision cargada, lista para iniciar'


@eel.expose
def deconectarVehiculo():
	print("Cerrando la conexion")
	vehicle.close()
	return 'Vehiculo DESCONECTADO'


eel.start('index.html', mode='chrome', port=8500)