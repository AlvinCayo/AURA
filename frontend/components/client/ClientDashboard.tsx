import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';

type ServicioAura = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
  image_url: string;
};

type MiReserva = {
  id: string;
  service_name: string;
  business_name: string;
  appointment_date: string;
  status: string;
};

export default function ClientDashboard() {
  const enrutador = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [fotoUsuario, setFotoUsuario] = useState<string>('');
  const [vistaActual, setVistaActual] = useState<string>('inicio');
  const [catalogoGlobal, setCatalogoGlobal] = useState<Record<string, ServicioAura>>({});
  const [misReservas, setMisReservas] = useState<Record<string, MiReserva>>({});

  const urlBase = 'https://aura-ukzs.onrender.com/api';

  useEffect(() => {
    cargarPerfil();
  }, new Array());

  useEffect(() => {
    if (vistaActual === 'explorar') cargarTodosLosServicios();
    if (vistaActual === 'reservas') cargarMisReservas();
  }, Array.of(vistaActual));

  const cargarPerfil = async () => {
    const id = await AsyncStorage.getItem('userId');
    const rol = await AsyncStorage.getItem('userRole');
    if (id && rol) {
      try {
        const respuesta = await fetch(urlBase + '/users/profile/' + id + '/' + rol);
        const datos = await respuesta.json();
        if (datos.success) {
          setNombreUsuario(datos.profile.first_name);
          setFotoUsuario(datos.profile.profile_picture || '');
        }
      } catch {
        Alert.alert('Error', 'Fallo al cargar perfil');
      }
    }
  };

  const cargarTodosLosServicios = async () => {
    try {
      const respuesta = await fetch(urlBase + '/services/all');
      const datos = await respuesta.json();
      if (datos.success) setCatalogoGlobal(datos.data);
    } catch {
      Alert.alert('Error', 'Fallo al descargar los catalogos');
    }
  };

  const cargarMisReservas = async () => {
    const idUsuario = await AsyncStorage.getItem('userId');
    if (!idUsuario) return;
    try {
      const respuesta = await fetch(urlBase + '/appointments/client/' + idUsuario);
      const datos = await respuesta.json();
      if (datos.success) setMisReservas(datos.data);
    } catch {
      Alert.alert('Error', 'Fallo al obtener tus reservas');
    }
  };

  const agendarCita = async (servicio: ServicioAura) => {
    const idCliente = await AsyncStorage.getItem('userId');
    if (!idCliente) return;
    const fechaTurno = new Date();
    fechaTurno.setDate(fechaTurno.getDate() + 1);
    const cargaUtil = {
      client_id: idCliente,
      business_id: servicio.business_id,
      service_id: servicio.id,
      appointment_date: fechaTurno.toISOString()
    };
    try {
      const respuesta = await fetch(urlBase + '/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cargaUtil)
      });
      const datos = await respuesta.json();
      if (datos.success) {
        Alert.alert('AURA', 'Reserva solicitada correctamente');
        setVistaActual('inicio');
      }
    } catch {
      Alert.alert('Error', 'Fallo de comunicacion con el servidor');
    }
  };

  const cerrarSesion = async () => {
    await AsyncStorage.clear();
    enrutador.replace('/auth/login' as never);
  };

  if (vistaActual === 'explorar') {
    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraCurvaMenor}>
          <Text style={estilos.nombreApp}>CATALOGO LA PAZ</Text>
        </View>
        <ScrollView style={estilos.contenedorCatalogo}>
          {Object.values(catalogoGlobal).map((servicio) => (
            <View key={servicio.id} style={estilos.tarjetaServicio}>
              {servicio.image_url ? (
                <Image source={{ uri: servicio.image_url }} style={estilos.imagenServicio} />
              ) : (
                <View style={estilos.reemplazoImagen}>
                  <Ionicons name="image-outline" size={30} color="#ccc" />
                </View>
              )}
              <View style={estilos.infoServicio}>
                <Text style={estilos.tituloServicio}>{servicio.name}</Text>
                <Text style={estilos.detalleServicio}>{servicio.description}</Text>
                <Text style={estilos.precioServicio}>{servicio.price} Bs</Text>
                <TouchableOpacity style={estilos.botonReservar} onPress={() => agendarCita(servicio)}>
                  <Text style={estilos.textoBotonBlanco}>Agendar Cita</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={estilos.botonVolver} onPress={() => setVistaActual('inicio')}>
            <Text style={estilos.textoBotonPrimario}>Volver al menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (vistaActual === 'reservas') {
    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraCurvaMenor}>
          <Text style={estilos.nombreApp}>MIS CITAS</Text>
        </View>
        <ScrollView style={estilos.contenedorCatalogo}>
          {Object.values(misReservas).map((reserva) => (
            <View key={reserva.id} style={estilos.tarjetaInfo}>
              <View style={estilos.infoServicio}>
                <Text style={estilos.tituloServicio}>{reserva.service_name}</Text>
                <Text style={estilos.detalleTexto}>Centro Estetico {reserva.business_name}</Text>
                <Text style={estilos.detalleTexto}>Fecha {new Date(reserva.appointment_date).toLocaleString()}</Text>
                <Text style={{ fontWeight: 'bold', color: reserva.status === 'confirmada' ? 'green' : reserva.status === 'pendiente' ? 'orange' : 'red', marginTop: 10 }}>Estado {reserva.status.toUpperCase()}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={estilos.botonVolver} onPress={() => setVistaActual('inicio')}>
            <Text style={estilos.textoBotonPrimario}>Volver al menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={estilos.contenedorPrincipal}>
      <View style={estilos.cabeceraCurva}>
        <Text style={estilos.nombreApp}>AURA CLIENTE</Text>
      </View>
      <ScrollView style={estilos.contenedorPerfil}>
        <View style={estilos.seccionAvatar}>
          <View style={estilos.contenedorAvatar}>
            {fotoUsuario && fotoUsuario.length > 5 ? (
              <Image source={{ uri: fotoUsuario }} style={estilos.avatarPrincipal} />
            ) : (
              <View style={estilos.reemplazoAvatar}>
                <Ionicons name="person" size={40} color={AuraColors.gold} />
              </View>
            )}
          </View>
          <Text style={estilos.textoNombreUsuario}>Bienvenido {nombreUsuario}</Text>
        </View>
        <View style={estilos.tarjetaMenu}>
          <TouchableOpacity style={estilos.itemMenu} onPress={() => setVistaActual('explorar')}>
            <Ionicons name="search-outline" size={24} color={AuraColors.primary} />
            <Text style={estilos.textoItemMenu}>Buscar y Agendar Cita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.itemMenu} onPress={() => setVistaActual('reservas')}>
            <Ionicons name="calendar-outline" size={24} color={AuraColors.primary} />
            <Text style={estilos.textoItemMenu}>Mis Reservas Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.itemMenu}>
            <Ionicons name="time-outline" size={24} color={AuraColors.primary} />
            <Text style={estilos.textoItemMenu}>Historial de Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.itemMenu}>
            <Ionicons name="scan-outline" size={24} color={AuraColors.primary} />
            <Text style={estilos.textoItemMenu}>Analisis Biometrico Facial</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={estilos.accionSalir} onPress={cerrarSesion}>
          <Ionicons name="log-out-outline" size={22} color={AuraColors.white} />
          <Text style={estilos.textoAccionSalir}>Cerrar Sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: AuraColors.background },
  cabeceraCurva: { backgroundColor: AuraColors.primary, height: 150, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', paddingTop: 60 },
  cabeceraCurvaMenor: { backgroundColor: AuraColors.primary, height: 120, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', paddingTop: 50, marginBottom: 20 },
  nombreApp: { fontSize: 24, color: AuraColors.white, fontWeight: '900', letterSpacing: 2 },
  contenedorPerfil: { flex: 1, marginTop: -40, paddingHorizontal: 20 },
  contenedorCatalogo: { flex: 1, paddingHorizontal: 20 },
  seccionAvatar: { alignItems: 'center', marginBottom: 20 },
  contenedorAvatar: { marginBottom: 15 },
  avatarPrincipal: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: AuraColors.white },
  reemplazoAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: AuraColors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: AuraColors.gold },
  textoNombreUsuario: { fontSize: 22, color: AuraColors.primary, fontWeight: 'bold' },
  tarjetaMenu: { backgroundColor: AuraColors.white, borderRadius: 20, padding: 10, elevation: 3, marginBottom: 25 },
  itemMenu: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  textoItemMenu: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '600', color: AuraColors.primary },
  accionSalir: { flexDirection: 'row', backgroundColor: AuraColors.secondary, padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  textoAccionSalir: { color: AuraColors.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  tarjetaServicio: { backgroundColor: AuraColors.white, borderRadius: 15, overflow: 'hidden', marginBottom: 20, elevation: 3 },
  tarjetaInfo: { backgroundColor: AuraColors.white, borderRadius: 15, padding: 10, marginBottom: 20, elevation: 3 },
  imagenServicio: { width: '100%', height: 160 },
  reemplazoImagen: { width: '100%', height: 160, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  infoServicio: { padding: 15 },
  tituloServicio: { fontSize: 18, fontWeight: 'bold', color: AuraColors.primary, marginBottom: 5 },
  detalleServicio: { color: '#666', marginBottom: 10 },
  detalleTexto: { color: '#444', marginTop: 5 },
  precioServicio: { fontSize: 18, fontWeight: 'bold', color: AuraColors.gold, marginBottom: 15 },
  botonReservar: { backgroundColor: AuraColors.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  textoBotonBlanco: { color: AuraColors.white, fontWeight: 'bold', fontSize: 16 },
  botonVolver: { padding: 15, alignItems: 'center', marginBottom: 30 },
  textoBotonPrimario: { color: AuraColors.primary, fontWeight: 'bold', fontSize: 16 }
});