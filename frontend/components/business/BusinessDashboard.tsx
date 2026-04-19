import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';

type ServicioAura = { id: string; name: string; description: string; price: string; duration_minutes: number; image_url: string; };
type CitaAura = { 
  id: string; 
  client_name: string; 
  client_last_name: string; 
  service_name: string; 
  appointment_date: string; 
  status: string; 
  total_price: string; 
  reservation_fee: string; 
  paid_amount: string; // <--- Agrega esta línea
};

export default function BusinessDashboard() {
  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [precio, setPrecio] = useState<string>('');
  const [duracion, setDuracion] = useState<string>('');
  const [imagenUri, setImagenUri] = useState<string>('');
  const [idEdicion, setIdEdicion] = useState<string | null>(null);
  const [vista, setVista] = useState<string>('inicio');
  
  const [catalogo, setCatalogo] = useState<Record<string, ServicioAura>>({});
  const [agenda, setAgenda] = useState<Record<string, CitaAura>>({});

  // Estados para horarios
  const [horaApertura, setHoraApertura] = useState<string>('');
  const [horaCierre, setHoraCierre] = useState<string>('');
  const [diasTrabajo, setDiasTrabajo] = useState<string>('');

  const urlBase = 'https://aura-ukzs.onrender.com/api';

  useEffect(() => {
    if (vista === 'catalogo') cargarCatalogo();
    if (vista === 'agenda') cargarAgenda();
    if (vista === 'horarios') cargarPerfilNegocio();
  }, Array.of(vista));

  const cargarPerfilNegocio = async () => {
    const businessId = await AsyncStorage.getItem('userId');
    const rol = await AsyncStorage.getItem('userRole');
    try {
      const res = await fetch(urlBase + '/users/profile/' + businessId + '/' + rol);
      const data = await res.json();
      if (data.success && data.profile) {
        setHoraApertura(data.profile.opening_time || '09:00');
        setHoraCierre(data.profile.closing_time || '20:00');
        setDiasTrabajo(data.profile.working_days || 'Lunes a Sabado');
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar tus horarios actuales');
    }
  };

  const guardarHorarios = async () => {
    const businessId = await AsyncStorage.getItem('userId');
    try {
      const res = await fetch(urlBase + '/users/profile/' + businessId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opening_time: horaApertura, closing_time: horaCierre, working_days: diasTrabajo })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Exito', 'Tus horarios de atención fueron actualizados');
        setVista('inicio');
      }
    } catch {
      Alert.alert('Error', 'Fallo al guardar la configuración de horarios');
    }
  };

  const cargarCatalogo = async () => {
    const businessId = await AsyncStorage.getItem('userId');
    try {
      const res = await fetch(urlBase + '/services/business/' + businessId);
      const data = await res.json();
      if (data.success) setCatalogo(data.data);
    } catch { Alert.alert('Error', 'Fallo al cargar el catalogo'); }
  };

  const cargarAgenda = async () => {
    const businessId = await AsyncStorage.getItem('userId');
    try {
      const res = await fetch(urlBase + '/appointments/business/' + businessId);
      const data = await res.json();
      if (data.success) setAgenda(data.data);
    } catch { Alert.alert('Error', 'Fallo al cargar la agenda'); }
  };

  const cambiarEstadoCita = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch(urlBase + '/appointments/status/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nuevoEstado })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('AURA', 'El cliente ha sido notificado del cambio de estado');
        cargarAgenda();
      }
    } catch { Alert.alert('Error', 'Fallo al procesar el estado de la cita'); }
  };

  const seleccionarImagen = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 1 });
    if (!res.canceled && res.assets) {
      const primeraImagen = res.assets.shift();
      if (primeraImagen) setImagenUri(primeraImagen.uri);
    }
  };

  const procesarServicio = async () => {
    const vPrecio = parseFloat(precio);
    if (vPrecio < 20) { Alert.alert('Aviso', 'El precio minimo es 20 Bs'); return; }
    const businessId = await AsyncStorage.getItem('userId');
    const fd = new FormData();
    fd.append('business_id', businessId || ''); fd.append('name', nombre); fd.append('description', descripcion); fd.append('price', precio); fd.append('duration_minutes', duracion);

    if (imagenUri && !imagenUri.startsWith('http')) {
      if (Platform.OS === 'web') {
        const resImg = await fetch(imagenUri); const blob = await resImg.blob(); fd.append('image', blob, 'foto.jpg');
      } else {
        const extension = imagenUri.split('.').pop() || 'jpg';
        fd.append('image', { uri: imagenUri, name: 'servicio.' + extension, type: 'image/' + extension } as any);
      }
    }
    const url = idEdicion ? urlBase + '/services/update/' + idEdicion : urlBase + '/services/create';
    const method = idEdicion ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method: method, body: fd, headers: { 'Accept': 'application/json' } });
      const data = await res.json();
      if (data.success) { Alert.alert('Exito', 'Servicio guardado'); setVista('inicio'); setIdEdicion(null); }
    } catch { Alert.alert('Error', 'Fallo al procesar con el servidor'); }
  };

  const eliminarServicio = async (id: string) => {
    try {
        const res = await fetch(urlBase + '/services/delete/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) cargarCatalogo();
    } catch { Alert.alert('Error', 'Fallo al borrar'); }
  };

  if (vista === 'horarios') {
    return (
      <ScrollView style={styles.scroll}>
        <Text style={styles.sub}>Configurar Mis Horarios</Text>
        <Text style={{marginBottom: 5, fontWeight: 'bold'}}>Hora de Apertura (ej. 09:00)</Text>
        <TextInput style={styles.input} value={horaApertura} onChangeText={setHoraApertura} />
        
        <Text style={{marginBottom: 5, fontWeight: 'bold'}}>Hora de Cierre (ej. 20:00)</Text>
        <TextInput style={styles.input} value={horaCierre} onChangeText={setHoraCierre} />
        
        <Text style={{marginBottom: 5, fontWeight: 'bold'}}>Días de Atención (ej. Lunes a Sábado)</Text>
        <TextInput style={styles.input} value={diasTrabajo} onChangeText={setDiasTrabajo} />

        <TouchableOpacity style={styles.btnPri} onPress={guardarHorarios}><Text style={styles.btnText}>Guardar Horarios</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnC} onPress={() => setVista('inicio')}><Text style={styles.btnTextC}>Cancelar</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  if (vista === 'agenda') {
    return (
      <ScrollView style={styles.scroll}>
        <Text style={styles.sub}>Solicitudes y Agenda</Text>
        {Object.values(agenda).map((cita) => (
          <View key={cita.id} style={styles.cardInfoAgenda}>
            <Text style={styles.cardTitle}>{cita.client_name} {cita.client_last_name}</Text>
            <Text>Servicio: {cita.service_name}</Text>
            <Text>Día y Hora: {new Date(cita.appointment_date).toLocaleString()}</Text>
            <View style={styles.boxCotizacion}>
              <Text>Total Servicio: {cita.total_price} Bs</Text>
              <Text>Monto Pagado: {cita.paid_amount || 0} Bs</Text>
            </View>
            <Text style={{ fontWeight: 'bold', color: cita.status === 'solicitada' ? 'orange' : cita.status === 'confirmada' ? 'green' : 'blue', marginTop: 10 }}>Estado Actual: {cita.status.toUpperCase()}</Text>
            
            {cita.status === 'solicitada' && (
              <View style={styles.row}>
                <TouchableOpacity style={styles.actBtn} onPress={() => cambiarEstadoCita(cita.id, 'aceptada')}>
                  <Text style={styles.btnText}>Aceptar Cita</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => cambiarEstadoCita(cita.id, 'rechazada')}>
                  <Text style={styles.btnText}>Rechazar (Lleno)</Text>
                </TouchableOpacity>
              </View>
            )}
            {cita.status === 'aceptada' && (
              <Text style={{marginTop: 10, color: '#666'}}>Esperando que el cliente pague la reserva (10%).</Text>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.btnC} onPress={() => setVista('inicio')}><Text style={styles.btnTextC}>Volver al inicio</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  // ... (Las vistas de 'formulario' y 'catalogo' se mantienen igual, al final retornamos el menú principal)
  if (vista === 'formulario') {
    // Retorno de formulario anterior
    return (
      <ScrollView style={styles.scroll}>
        <Text style={styles.sub}>{idEdicion ? 'Actualizar Servicio' : 'Nuevo Servicio'}</Text>
        <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
        <TextInput style={styles.input} placeholder="Descripcion" value={descripcion} onChangeText={setDescripcion} />
        <TextInput style={styles.input} placeholder="Precio Bs" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
        <TextInput style={styles.input} placeholder="Minutos" keyboardType="numeric" value={duracion} onChangeText={setDuracion} />
        <TouchableOpacity style={styles.btnSec} onPress={seleccionarImagen}><Text style={styles.btnText}>Elegir Foto</Text></TouchableOpacity>
        {imagenUri !== '' && <Image source={{ uri: imagenUri }} style={styles.imgPre} />}
        <TouchableOpacity style={styles.btnPri} onPress={procesarServicio}><Text style={styles.btnText}>Guardar</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnC} onPress={() => setVista('inicio')}><Text style={styles.btnTextC}>Cancelar</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  if (vista === 'catalogo') {
    // Retorno del catálogo anterior
    return (
      <ScrollView style={styles.scroll}>
        <Text style={styles.sub}>Mis Servicios Publicados</Text>
        {Object.values(catalogo).map((ser) => (
          <View key={ser.id} style={styles.card}>
            {ser.image_url ? <Image source={{ uri: ser.image_url }} style={styles.cardImg} /> : <View style={styles.imgReemplazo}><Ionicons name="image-outline" size={30} color="#ccc" /></View>}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{ser.name}</Text>
              <Text style={styles.cardPrice}>{ser.price} Bs</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.actBtn} onPress={() => {setIdEdicion(ser.id); setNombre(ser.name); setDescripcion(ser.description); setPrecio(ser.price); setDuracion(ser.duration_minutes.toString()); setImagenUri(ser.image_url); setVista('formulario');}}><Ionicons name="pencil" size={20} color="white" /></TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => eliminarServicio(ser.id)}><Ionicons name="trash" size={20} color="white" /></TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.btnC} onPress={() => setVista('inicio')}><Text style={styles.btnTextC}>Volver</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerT}>AURA BUSINESS</Text></View>
      <TouchableOpacity style={styles.menuItem} onPress={() => setVista('horarios')}>
        <Ionicons name="time" size={30} color={AuraColors.primary} />
        <Text style={styles.menuText}>Configurar Horarios</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => { setIdEdicion(null); setVista('formulario'); }}>
        <Ionicons name="add-circle" size={30} color={AuraColors.primary} />
        <Text style={styles.menuText}>Registrar Servicio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => setVista('catalogo')}>
        <Ionicons name="list" size={30} color={AuraColors.primary} />
        <Text style={styles.menuText}>Ver Mi Catalogo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => setVista('agenda')}>
        <Ionicons name="calendar" size={30} color={AuraColors.primary} />
        <Text style={styles.menuText}>Gestionar Solicitudes y Agenda</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background, padding: 20 },
  scroll: { flex: 1, padding: 10 },
  header: { backgroundColor: AuraColors.primary, padding: 30, borderRadius: 20, marginBottom: 20 },
  headerT: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 20 },
  sub: { fontSize: 22, fontWeight: 'bold', color: AuraColors.primary, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  btnPri: { backgroundColor: AuraColors.primary, padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnSec: { backgroundColor: AuraColors.secondary, padding: 12, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
  btnC: { padding: 15, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnTextC: { color: AuraColors.primary, fontWeight: 'bold' },
  imgPre: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
  menuItem: { backgroundColor: 'white', padding: 25, borderRadius: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  menuText: { marginLeft: 15, fontWeight: 'bold', color: AuraColors.primary },
  card: { backgroundColor: 'white', borderRadius: 15, marginBottom: 15, overflow: 'hidden', flexDirection: 'row', elevation: 3 },
  cardInfoAgenda: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 3 },
  cardImg: { width: 100, height: 100 },
  imgReemplazo: { width: 100, height: 100, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTitle: { fontWeight: 'bold', color: AuraColors.primary, fontSize: 16 },
  cardPrice: { color: AuraColors.gold, fontWeight: 'bold' },
  row: { flexDirection: 'row', marginTop: 10 },
  actBtn: { backgroundColor: AuraColors.primary, padding: 12, borderRadius: 8, marginRight: 10, flex: 1, alignItems: 'center' },
  delBtn: { backgroundColor: '#ff4444', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center' },
  boxCotizacion: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#ddd' }
});