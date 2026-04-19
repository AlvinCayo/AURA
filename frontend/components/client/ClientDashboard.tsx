import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';

type CentroAura = { id: string; first_name: string; profile_picture: string; opening_time: string; closing_time: string; working_days: string; };
type ServicioAura = { id: string; business_id: string; name: string; description: string; price: string; duration_minutes: number; image_url: string; };
type MiReserva = { id: string; service_name: string; business_name: string; appointment_date: string; status: string; total_price: string; reservation_fee: string; };

export default function ClientDashboard() {
  const enrutador = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [vistaActual, setVistaActual] = useState<string>('inicio');
  const [listaCentros, setListaCentros] = useState<Record<string, CentroAura>>({});
  const [serviciosCentro, setServiciosCentro] = useState<Record<string, ServicioAura>>({});
  const [centroSeleccionado, setCentroSeleccionado] = useState<CentroAura | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioAura | null>(null);
  const [misReservas, setMisReservas] = useState<Record<string, MiReserva>>({});
  
  // Datos para agendar
  const [fechaElegida, setFechaElegida] = useState<string>('');
  const [horaElegida, setHoraElegida] = useState<string>('');

  const urlBase = 'https://aura-ukzs.onrender.com/api';

  useEffect(() => { cargarPerfil(); }, new Array());

  const cargarPerfil = async () => {
    const id = await AsyncStorage.getItem('userId');
    const rol = await AsyncStorage.getItem('userRole');
    if (id && rol) {
      try {
        const res = await fetch(urlBase + '/users/profile/' + id + '/' + rol);
        const datos = await res.json();
        if (datos.success) setNombreUsuario(datos.profile.first_name);
      } catch { /* error silencioso */ }
    }
  };

  const cargarCentros = async () => {
    try {
      const res = await fetch(urlBase + '/users/businesses');
      const datos = await res.json();
      if (datos.success) { setListaCentros(datos.data); setVistaActual('centros'); }
    } catch { Alert.alert('Error', 'Fallo al cargar las barberías'); }
  };

  const verServiciosDelCentro = async (centro: CentroAura) => {
    setCentroSeleccionado(centro);
    try {
      const res = await fetch(urlBase + '/services/business/' + centro.id);
      const datos = await res.json();
      if (datos.success) { setServiciosCentro(datos.data); setVistaActual('servicios_centro'); }
    } catch { Alert.alert('Error', 'Fallo al cargar el catálogo'); }
  };

  const prepararAgenda = (servicio: ServicioAura) => {
    setServicioSeleccionado(servicio);
    setFechaElegida(''); setHoraElegida('');
    setVistaActual('agendar');
  };

  const solicitarCita = async () => {
    if (!fechaElegida || !horaElegida) { Alert.alert('Aviso', 'Ingresa la fecha y hora'); return; }
    const idCliente = await AsyncStorage.getItem('userId');
    
    // Formato simple para combinar fecha y hora
    const fechaTurno = new Date(`${fechaElegida}T${horaElegida}:00`).toISOString();

    const cargaUtil = {
      client_id: idCliente,
      business_id: servicioSeleccionado?.business_id,
      service_id: servicioSeleccionado?.id,
      appointment_date: fechaTurno,
      price: servicioSeleccionado?.price
    };

    try {
      const res = await fetch(urlBase + '/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cargaUtil)
      });
      const datos = await res.json();
      if (datos.success) {
        Alert.alert('AURA', 'Solicitud enviada al centro estético');
        cargarMisReservas();
      }
    } catch { Alert.alert('Error', 'Fallo de conexión'); }
  };

  const cargarMisReservas = async () => {
    const id = await AsyncStorage.getItem('userId');
    try {
      const res = await fetch(urlBase + '/appointments/client/' + id);
      const datos = await res.json();
      if (datos.success) { setMisReservas(datos.data); setVistaActual('reservas'); }
    } catch { Alert.alert('Error', 'Fallo al cargar reservas'); }
  };

  const pagarReserva = async (idCita: string, monto: string) => {
    try {
      const res = await fetch(urlBase + '/appointments/pay/' + idCita, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_paid: monto })
      });
      const datos = await res.json();
      if (datos.success) {
        Alert.alert('Pago Exitoso', 'Tu cita está 100% confirmada');
        cargarMisReservas();
      }
    } catch { Alert.alert('Error', 'Fallo en la pasarela de pago'); }
  };

  // Componente Visual de Cadena (AliExpress Style)
  const RastroEstado = ({ estado }: { estado: string }) => {
    const pasos = [
      { id: 'solicitada', icono: 'time', titulo: 'Solicitada' },
      { id: 'aceptada', icono: 'wallet', titulo: 'Pago Pendiente' },
      { id: 'confirmada', icono: 'checkmark-circle', titulo: 'Confirmada' }
    ];

    let nivel = 0;
    if (estado === 'aceptada') nivel = 1;
    if (estado === 'confirmada') nivel = 2;

    return (
      <View style={estilos.rastroContenedor}>
        {pasos.map((paso, index) => (
          <View key={paso.id} style={estilos.rastroPaso}>
            <View style={[estilos.rastroCirculo, index <= nivel ? estilos.rastroActivo : estilos.rastroInactivo]}>
              <Ionicons name={paso.icono as any} size={20} color="white" />
            </View>
            <Text style={estilos.rastroTexto}>{paso.titulo}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (vistaActual === 'centros') {
    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraCurvaMenor}><Text style={estilos.nombreApp}>BARBERÍAS Y SALONES</Text></View>
        <ScrollView style={estilos.scrollPadding}>
          {Object.values(listaCentros).map((c) => (
            <TouchableOpacity key={c.id} style={estilos.tarjetaCentro} onPress={() => verServiciosDelCentro(c)}>
              {c.profile_picture ? <Image source={{ uri: c.profile_picture }} style={estilos.imagenCentro} /> : <View style={estilos.imagenCentro}><Ionicons name="storefront" size={40} color="#ccc" /></View>}
              <View style={estilos.infoServicio}>
                <Text style={estilos.tituloServicio}>{c.first_name}</Text>
                <Text style={estilos.detalleServicio}><Ionicons name="calendar" /> {c.working_days}</Text>
                <Text style={estilos.detalleServicio}><Ionicons name="time" /> {c.opening_time} - {c.closing_time}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={estilos.botonVolver} onPress={() => setVistaActual('inicio')}><Text style={estilos.textoBotonPrimario}>Volver</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (vistaActual === 'servicios_centro') {
    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraCurvaMenor}><Text style={estilos.nombreApp}>{centroSeleccionado?.first_name.toUpperCase()}</Text></View>
        <ScrollView style={estilos.scrollPadding}>
          {Object.values(serviciosCentro).map((s) => (
            <View key={s.id} style={estilos.tarjetaCentro}>
              {s.image_url ? <Image source={{ uri: s.image_url }} style={estilos.imgCatalogo} /> : null}
              <View style={estilos.infoServicio}>
                <Text style={estilos.tituloServicio}>{s.name}</Text>
                <Text style={estilos.detalleServicio}>{s.description}</Text>
                <Text style={estilos.precioServicio}>{s.price} Bs</Text>
                <TouchableOpacity style={estilos.botonReservar} onPress={() => prepararAgenda(s)}>
                  <Text style={estilos.textoBotonBlanco}>Seleccionar y Agendar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={estilos.botonVolver} onPress={() => setVistaActual('centros')}><Text style={estilos.textoBotonPrimario}>Atrás</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (vistaActual === 'agendar') {
    return (
      <ScrollView style={[estilos.contenedorPrincipal, estilos.scrollPadding]}>
        <Text style={[estilos.nombreApp, {color: AuraColors.primary, marginTop: 40, textAlign: 'center'}]}>AGENDAR CITA</Text>
        <View style={estilos.tarjetaCentro}>
          <View style={estilos.infoServicio}>
            <Text style={estilos.tituloServicio}>{servicioSeleccionado?.name}</Text>
            <Text style={estilos.detalleServicio}>Centro: {centroSeleccionado?.first_name}</Text>
            <Text style={estilos.detalleServicio}>Horario de atención: {centroSeleccionado?.opening_time} a {centroSeleccionado?.closing_time}</Text>
            
            <Text style={{marginTop: 20, fontWeight: 'bold'}}>Fecha (YYYY-MM-DD):</Text>
            <TextInput style={estilos.inputBox} placeholder="Ej. 2026-05-20" value={fechaElegida} onChangeText={setFechaElegida} />
            
            <Text style={{fontWeight: 'bold'}}>Hora (HH:MM):</Text>
            <TextInput style={estilos.inputBox} placeholder="Ej. 14:30" value={horaElegida} onChangeText={setHoraElegida} />

            <View style={estilos.boxCotizacion}>
              <Text>Costo Servicio: {servicioSeleccionado?.price} Bs</Text>
              <Text>Reserva AURA (10%): {(parseFloat(servicioSeleccionado?.price || '0') * 0.10).toFixed(2)} Bs</Text>
              <Text style={estilos.precioServicio}>Total Final: {(parseFloat(servicioSeleccionado?.price || '0') * 1.10).toFixed(2)} Bs</Text>
            </View>

            <TouchableOpacity style={estilos.botonReservar} onPress={solicitarCita}>
              <Text style={estilos.textoBotonBlanco}>Enviar Solicitud al Barbero</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={estilos.botonVolver} onPress={() => setVistaActual('servicios_centro')}><Text style={estilos.textoBotonPrimario}>Cancelar</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  if (vistaActual === 'reservas') {
    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraCurvaMenor}><Text style={estilos.nombreApp}>MIS CITAS</Text></View>
        <ScrollView style={estilos.scrollPadding}>
          {Object.values(misReservas).map((res) => (
            <View key={res.id} style={estilos.tarjetaCentro}>
              <View style={estilos.infoServicio}>
                <Text style={estilos.tituloServicio}>{res.service_name}</Text>
                <Text>En: {res.business_name} | {new Date(res.appointment_date).toLocaleString()}</Text>
                
                <RastroEstado estado={res.status} />

                {res.status === 'aceptada' && (
                  <View style={estilos.boxPagos}>
                    <Text style={{marginBottom: 10, textAlign: 'center', fontWeight: 'bold'}}>El centro aceptó. Paga para confirmar:</Text>
                    <TouchableOpacity style={[estilos.botonReservar, {backgroundColor: AuraColors.gold, marginBottom: 10}]} onPress={() => pagarReserva(res.id, res.reservation_fee)}>
                      <Text style={estilos.textoBotonBlanco}>Pagar solo Reserva ({res.reservation_fee} Bs)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={estilos.botonReservar} onPress={() => pagarReserva(res.id, res.total_price)}>
                      <Text style={estilos.textoBotonBlanco}>Pagar Completo ({res.total_price} Bs)</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {res.status === 'rechazada' && <Text style={{color: 'red', fontWeight: 'bold', marginTop: 10}}>El centro rechazó la solicitud por falta de disponibilidad.</Text>}
              </View>
            </View>
          ))}
          <TouchableOpacity style={estilos.botonVolver} onPress={() => setVistaActual('inicio')}><Text style={estilos.textoBotonPrimario}>Volver</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={estilos.contenedorPrincipal}>
      <View style={estilos.cabeceraCurva}><Text style={estilos.nombreApp}>AURA CLIENTE</Text></View>
      <ScrollView style={{ paddingHorizontal: 20, marginTop: -20 }}>
        <Text style={{fontSize: 22, fontWeight: 'bold', marginBottom: 20}}>Hola, {nombreUsuario}</Text>
        <View style={estilos.tarjetaMenu}>
          <TouchableOpacity style={estilos.itemMenu} onPress={cargarCentros}>
            <Ionicons name="search" size={24} color={AuraColors.primary} />
            <Text style={estilos.textoItemMenu}>Buscar Estéticas y Agendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.itemMenu} onPress={cargarMisReservas}>
            <Ionicons name="calendar" size={24} color={AuraColors.primary} />
            <Text style={estilos.textoItemMenu}>Seguimiento de Mis Citas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: AuraColors.background },
  cabeceraCurva: { backgroundColor: AuraColors.primary, height: 150, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', paddingTop: 60 },
  cabeceraCurvaMenor: { backgroundColor: AuraColors.primary, height: 120, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', paddingTop: 50, marginBottom: 20 },
  nombreApp: { fontSize: 24, color: AuraColors.white, fontWeight: '900', letterSpacing: 2 },
  scrollPadding: { paddingHorizontal: 15 },
  tarjetaMenu: { backgroundColor: AuraColors.white, borderRadius: 20, padding: 10, elevation: 3 },
  itemMenu: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  textoItemMenu: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '600', color: AuraColors.primary },
  tarjetaCentro: { backgroundColor: AuraColors.white, borderRadius: 15, overflow: 'hidden', marginBottom: 20, elevation: 3 },
  imagenCentro: { width: 100, height: 100, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 15, borderRadius: 50 },
  imgCatalogo: { width: '100%', height: 150 },
  infoServicio: { padding: 15 },
  tituloServicio: { fontSize: 18, fontWeight: 'bold', color: AuraColors.primary, marginBottom: 5 },
  detalleServicio: { color: '#666', marginBottom: 5 },
  precioServicio: { fontSize: 18, fontWeight: 'bold', color: AuraColors.gold, marginVertical: 10 },
  botonReservar: { backgroundColor: AuraColors.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
  textoBotonBlanco: { color: AuraColors.white, fontWeight: 'bold', fontSize: 16 },
  botonVolver: { padding: 15, alignItems: 'center', marginBottom: 30 },
  textoBotonPrimario: { color: AuraColors.primary, fontWeight: 'bold', fontSize: 16 },
  inputBox: { backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  boxCotizacion: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: AuraColors.gold },
  boxPagos: { marginTop: 15, padding: 15, backgroundColor: '#f0f8ff', borderRadius: 10, borderWidth: 1, borderColor: AuraColors.primary },
  
  // Estilos del Rastreo AliExpress
  rastroContenedor: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20, paddingHorizontal: 10 },
  rastroPaso: { alignItems: 'center', flex: 1 },
  rastroCirculo: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  rastroActivo: { backgroundColor: AuraColors.primary },
  rastroInactivo: { backgroundColor: '#ccc' },
  rastroTexto: { fontSize: 11, marginTop: 5, textAlign: 'center', fontWeight: 'bold', color: '#555' }
});