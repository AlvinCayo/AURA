import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { AuraColors } from '../../constants/Colors';

type ServicioAura = { id: string; name: string; description: string; price: string; duration_minutes: number; image_url: string; };
type CitaAura = { 
  id: string; client_name: string; client_last_name: string; service_name: string; 
  appointment_date: string; status: string; total_price: string; reservation_fee: string; paid_amount: string; 
};

export default function BusinessDashboard() {
  const [vista, setVista] = useState<string>('inicio');
  const [modoPerfil, setModoPerfil] = useState<'vista' | 'edicion'>('vista');
  
  const [nombre, setNombre] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [precio, setPrecio] = useState<string>('');
  const [duracion, setDuracion] = useState<string>('');
  const [imagenUri, setImagenUri] = useState<string>('');
  const [idEdicion, setIdEdicion] = useState<string | null>(null);
  
  const [catalogo, setCatalogo] = useState<Record<string, ServicioAura>>({});
  const [agenda, setAgenda] = useState<Record<string, CitaAura>>({});

  const [businessName, setBusinessName] = useState('');
  const [perfilFoto, setPerfilFoto] = useState<string>('');
  const [repName, setRepName] = useState('');
  const [repLastName, setRepLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('');
  const [street, setStreet] = useState('');
  const [num, setNum] = useState('');
  const [cat, setCat] = useState('Barbería');
  const [addressNotes, setAddressNotes] = useState('');
  const [licenseUrl, setLicenseUrl] = useState('');
  
  const [lat, setLat] = useState('-16.5000');
  const [lng, setLng] = useState('-68.1500');
  const [shopPhotos, setShopPhotos] = useState<string[]>([]);

  const [horaApertura, setHoraApertura] = useState<string>('');
  const [horaCierre, setHoraCierre] = useState<string>('');
  const [diasTrabajo, setDiasTrabajo] = useState<string>('');

  const urlBase = 'https://aura-ukzs.onrender.com/api';

  useEffect(() => {
    if (vista === 'catalogo') cargarCatalogo();
    if (vista === 'agenda') cargarAgenda();
    if (vista === 'horarios' || vista === 'perfil_negocio') cargarPerfilNegocio();
  }, [vista]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleWebMessage = (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.lat && data.lng) {
            setLat(data.lat.toString());
            setLng(data.lng.toString());
          }
        } catch (e) {}
      };
      window.addEventListener('message', handleWebMessage);
      return () => window.removeEventListener('message', handleWebMessage);
    }
  }, []);

  const cargarPerfilNegocio = async () => {
    const businessId = await AsyncStorage.getItem('userId');
    const rol = await AsyncStorage.getItem('userRole');
    try {
      const res = await fetch(urlBase + '/users/profile/' + businessId + '/' + rol);
      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        setBusinessName(p.business_name || '');
        setHoraApertura(p.opening_time || '09:00');
        setHoraCierre(p.closing_time || '20:00');
        setDiasTrabajo(p.working_days || 'Lunes a Sabado');
        setPerfilFoto(p.profile_picture || '');
        setRepName(p.representative_name || '');
        setRepLastName(p.representative_last_name || '');
        setPhone(p.phone || '');
        setZone(p.zone || '');
        setStreet(p.street || '');
        setNum(p.building_number || '');
        if (p.business_category) setCat(p.business_category);
        setAddressNotes(p.address_notes || '');
        setLicenseUrl(p.license_pdf_url || '');
        setLat(p.latitude?.toString() || '-16.5000');
        setLng(p.longitude?.toString() || '-68.1500');
        setShopPhotos(p.shop_photos || []);
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar el perfil');
    }
  };

  // --- NUEVA FUNCIÓN: Transforma archivo local en URL Web Real ---
  const subirArchivoALaNube = async (uri: string, isPdf: boolean = false) => {
    const fd = new FormData();
    const extension = uri.split('.').pop() || 'jpg';
    const type = isPdf ? 'application/pdf' : `image/${extension}`;
    const name = isPdf ? `documento.${extension}` : `foto.${extension}`;
    
    if (Platform.OS === 'web') {
      const resImg = await fetch(uri);
      const blob = await resImg.blob();
      fd.append('file', blob, name);
    } else {
      fd.append('file', { uri, name, type } as any);
    }
    
    const res = await fetch(`${urlBase}/users/upload-file`, {
      method: 'POST',
      body: fd,
      headers: { 'Accept': 'application/json' }
    });
    const data = await res.json();
    if (!data.success) throw new Error('Fallo la subida');
    return data.url; // Retorna enlace oficial de Cloudinary
  };

  const cambiarLogo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!res.canceled && res.assets) {
      Alert.alert('Subiendo...', 'Enviando el logo a Cloudinary');
      try {
        const urlReal = await subirArchivoALaNube(res.assets[0].uri, false);
        setPerfilFoto(urlReal); 
        Alert.alert('AURA', 'Logo cargado. Recuerda Guardar Todos los Cambios al final.');
      } catch (error) {
        Alert.alert('Error', 'No se pudo subir la imagen a la nube');
      }
    }
  };

  const seleccionarLicencia = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        Alert.alert('Subiendo...', 'Cargando el documento a la nube');
        const uri = res.assets[0].uri;
        const isPdf = uri.toLowerCase().endsWith('.pdf');
        
        const urlReal = await subirArchivoALaNube(uri, isPdf);
        setLicenseUrl(urlReal);
        Alert.alert('AURA', 'Licencia asegurada en la nube.');
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo procesar el archivo.');
    }
  };

  const agregarFotoLocal = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets) {
      Alert.alert('Subiendo...', 'Añadiendo a la galería de Cloudinary');
      try {
        const urlReal = await subirArchivoALaNube(res.assets[0].uri, false);
        setShopPhotos([...shopPhotos, urlReal]);
        Alert.alert('Éxito', 'Foto subida correctamente');
      } catch (error) {
        Alert.alert('Error', 'Fallo al subir foto a la nube');
      }
    }
  };

  const eliminarFotoLocal = (index: number) => {
    const nuevas = [...shopPhotos];
    nuevas.splice(index, 1);
    setShopPhotos(nuevas);
  };

  const guardarPerfilCompleto = async () => {
    const businessId = await AsyncStorage.getItem('userId');
    try {
      const res = await fetch(`${urlBase}/users/profile/update/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'business',
          businessName: businessName,
          firstName: repName,
          lastName: repLastName,
          phone: phone,
          zone: zone,
          street: street,
          building_number: num,
          business_category: cat,
          address_notes: addressNotes,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          shopPhotos: shopPhotos,
          licenseUrl: licenseUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Éxito', 'Tu perfil de establecimiento se ha actualizado correctamente');
        setModoPerfil('vista');
      }
    } catch {
      Alert.alert('Error', 'No se pudo guardar el perfil');
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
      Alert.alert('Error', 'Fallo al guardar horarios');
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
    if (!res.canceled && res.assets) setImagenUri(res.assets[0].uri);
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
        if ((await res.json()).success) cargarCatalogo();
    } catch { Alert.alert('Error', 'Fallo al borrar'); }
  };

  const getMapHtml = (draggable: boolean) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>body { padding: 0; margin: 0; } #map { height: 100vh; width: 100vw; }</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map', { dragging: ${draggable} }).setView([${lat}, ${lng}], 16);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
          var marker = L.marker([${lat}, ${lng}], {draggable: ${draggable}}).addTo(map);
          
          if (${draggable}) {
            function enviarPosicion(lat, lng) {
              var data = JSON.stringify({ lat: lat, lng: lng });
              if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(data);
              else window.parent.postMessage(data, '*');
            }
            marker.on('dragend', function() {
              var pos = marker.getLatLng(); enviarPosicion(pos.lat, pos.lng);
            });
            map.on('click', function(e) {
              marker.setLatLng(e.latlng); enviarPosicion(e.latlng.lat, e.latlng.lng);
            });
          }
        </script>
      </body>
    </html>
  `;

  const renderizarLicencia = (url: string) => {
    if (!url) return <Text style={styles.textoGris}>No se ha registrado ninguna licencia vigente.</Text>;
    if (url.toLowerCase().endsWith('.pdf')) {
      return (
        <TouchableOpacity style={styles.btnPdf} onPress={() => Linking.openURL(url)}>
          <Ionicons name="document-text" size={40} color={AuraColors.primary} />
          <Text style={styles.txtPdf}>Abrir Documento PDF Oficial</Text>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={() => Linking.openURL(url)}>
         <Image source={{ uri: url }} style={styles.licenciaImg} />
      </TouchableOpacity>
    );
  };

  if (vista === 'perfil_negocio') {
    if (modoPerfil === 'vista') {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f0f2f5' }}>
          <View style={styles.portadaContainer}>
            <Image 
              source={{ uri: shopPhotos.length > 0 ? shopPhotos[0] : 'https://via.placeholder.com/600x200?text=Sin+Portada' }} 
              style={styles.portadaImg} 
            />
            <View style={styles.logoOverlayContainer}>
              <Image source={{ uri: perfilFoto || 'https://via.placeholder.com/150' }} style={styles.logoOverlay} />
            </View>
          </View>

          <View style={styles.infoCentral}>
            <Text style={styles.tituloPerfil}>{businessName || 'Nombre del Establecimiento'}</Text>
            <Text style={styles.textoCategoria}>{cat.toUpperCase()}</Text>
            <Text style={styles.textoRepresentante}>Dirigido por: {repName} {repLastName}</Text>

            <TouchableOpacity style={styles.btnEditarPerfil} onPress={() => setModoPerfil('edicion')}>
              <Ionicons name="pencil" size={16} color="white" />
              <Text style={{color: 'white', fontWeight: 'bold', marginLeft: 8}}>Editar Perfil de Empresa</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.seccionCard}>
            <Text style={styles.labelTitulo}>🕒 Horario de Atención</Text>
            <Text style={styles.textoGris}><Ionicons name="calendar"/> Días: {diasTrabajo || 'No especificado'}</Text>
            <Text style={styles.textoGris}><Ionicons name="time"/> Horas: {horaApertura} - {horaCierre}</Text>
          </View>

          <View style={styles.seccionCard}>
            <Text style={styles.labelTitulo}>📍 Ubicación del Local</Text>
            <Text style={styles.textoGris}>{zone}, {street} #{num}</Text>
            <Text style={styles.textoGris}>{addressNotes || 'Sin referencias extras'}</Text>
            <View style={[styles.mapContainer, {height: 200, pointerEvents: 'none'}]}>
              {Platform.OS === 'web' ? (
                <iframe srcDoc={getMapHtml(false)} style={{ width: '100%', height: '100%', border: 'none' }} />
              ) : (
                <WebView originWhitelist={['*']} source={{ html: getMapHtml(false) }} scrollEnabled={false} />
              )}
            </View>
          </View>

          <View style={styles.seccionCard}>
            <Text style={styles.labelTitulo}>📸 Galería del Establecimiento</Text>
            {shopPhotos.length === 0 ? (
              <Text style={styles.textoGris}>Aún no has subido fotos de tu local.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 10 }}>
                {shopPhotos.map((uri, i) => (
                  <View key={i} style={styles.fotoGaleriaContainer}>
                    <Image source={{ uri }} style={styles.fotoGaleriaMejorada} />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.seccionCard}>
            <Text style={styles.labelTitulo}>📄 Licencia de Funcionamiento</Text>
            {renderizarLicencia(licenseUrl)}
          </View>

          <TouchableOpacity style={styles.btnC} onPress={() => setVista('inicio')}><Text style={styles.btnTextC}>Volver al Menú Principal</Text></TouchableOpacity>
        </ScrollView>
      );
    } else {
      const opcionesCategoria = ['Barbería', 'Salón de Belleza', 'Unisex'];

      return (
        <ScrollView style={styles.scroll}>
          <Text style={styles.sub}>Editar Perfil Público</Text>

          <Text style={styles.label}>Logo del Negocio</Text>
          <View style={styles.centroAvatar}>
            <Image source={{ uri: perfilFoto || 'https://via.placeholder.com/150' }} style={styles.logoEmpresa} />
            <TouchableOpacity style={styles.btnSec} onPress={cambiarLogo}>
              <Text style={styles.btnTextOscuro}>Subir Nuevo Logo</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>Identidad del Negocio</Text>
          <TextInput style={styles.input} placeholder="Nombre Oficial del Establecimiento" value={businessName} onChangeText={setBusinessName} />
          
          <Text style={styles.label}>Categoría del Negocio</Text>
          <View style={styles.selectorCategoria}>
            {opcionesCategoria.map(opcion => (
              <TouchableOpacity 
                key={opcion} 
                style={[styles.btnCategoria, cat === opcion && styles.btnCategoriaActiva]}
                onPress={() => setCat(opcion)}
              >
                <Text style={cat === opcion ? styles.txtCategoriaActiva : styles.txtCategoria}>{opcion}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>Datos del Representante</Text>
          <TextInput style={styles.input} placeholder="Nombre del Representante" value={repName} onChangeText={setRepName} />
          <TextInput style={styles.input} placeholder="Apellidos" value={repLastName} onChangeText={setRepLastName} />
          <TextInput style={styles.input} placeholder="WhatsApp Comercial" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          
          <Text style={styles.label}>Dirección Exacta</Text>
          <TextInput style={styles.input} placeholder="Zona (Ej. Miraflores)" value={zone} onChangeText={setZone} />
          <TextInput style={styles.input} placeholder="Calle / Avenida" value={street} onChangeText={setStreet} />
          <TextInput style={styles.input} placeholder="Número de Puerta" value={num} onChangeText={setNum} />
          <TextInput style={styles.input} placeholder="Referencias para llegar" value={addressNotes} onChangeText={setAddressNotes} />

          <Text style={styles.label}>Ubicación en Mapa: Arrastra el marcador rojo</Text>
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              <iframe srcDoc={getMapHtml(true)} style={{ width: '100%', height: '100%', border: 'none' }} />
            ) : (
              <WebView 
                originWhitelist={['*']} 
                source={{ html: getMapHtml(true) }} 
                onMessage={(e) => { const data = JSON.parse(e.nativeEvent.data); setLat(data.lat.toString()); setLng(data.lng.toString()); }}
                scrollEnabled={false}
              />
            )}
          </View>

          <Text style={styles.label}>Galería Visual (Instalaciones)</Text>
          <TouchableOpacity style={styles.btnSec} onPress={agregarFotoLocal}>
            <Ionicons name="images" size={20} color={AuraColors.primary} />
            <Text style={[styles.btnTextOscuro, {marginLeft: 10}]}>Agregar Foto a Galería</Text>
          </TouchableOpacity>
          
          <ScrollView horizontal style={{marginVertical: 10}}>
            {shopPhotos.map((uri, index) => (
              <View key={index} style={{marginRight: 15, position: 'relative'}}>
                <Image source={{ uri }} style={{width: 120, height: 120, borderRadius: 10}} />
                <TouchableOpacity style={styles.btnEliminarFoto} onPress={() => eliminarFotoLocal(index)}>
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.label}>Legal y Documentación</Text>
          <TouchableOpacity style={styles.btnSec} onPress={seleccionarLicencia}>
            <Ionicons name="document-text" size={20} color={AuraColors.primary} />
            <Text style={[styles.btnTextOscuro, {marginLeft: 10}]}>Actualizar Foto o PDF de Licencia</Text>
          </TouchableOpacity>
          {licenseUrl !== '' && <Text style={{color: 'green', marginBottom: 10}}>✓ Documento listo en la nube</Text>}

          <TouchableOpacity style={styles.btnPri} onPress={guardarPerfilCompleto}>
            <Text style={styles.btnText}>Guardar Todos los Cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnC} onPress={() => setModoPerfil('vista')}><Text style={styles.btnTextC}>Cancelar y Volver</Text></TouchableOpacity>
        </ScrollView>
      );
    }
  }

  // --- LAS OTRAS VISTAS (Horarios, Agenda, Formulario, Catalogo) SE MANTIENEN IGUAL ---
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

  if (vista === 'formulario') {
    return (
      <ScrollView style={styles.scroll}>
        <Text style={styles.sub}>{idEdicion ? 'Actualizar Servicio' : 'Nuevo Servicio'}</Text>
        <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
        <TextInput style={styles.input} placeholder="Descripcion" value={descripcion} onChangeText={setDescripcion} />
        <TextInput style={styles.input} placeholder="Precio Bs" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
        <TextInput style={styles.input} placeholder="Minutos" keyboardType="numeric" value={duracion} onChangeText={setDuracion} />
        <TouchableOpacity style={styles.btnSec} onPress={seleccionarImagen}><Text style={styles.btnTextOscuro}>Elegir Foto</Text></TouchableOpacity>
        {imagenUri !== '' && <Image source={{ uri: imagenUri }} style={styles.imgPre} />}
        <TouchableOpacity style={styles.btnPri} onPress={procesarServicio}><Text style={styles.btnText}>Guardar</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnC} onPress={() => setVista('inicio')}><Text style={styles.btnTextC}>Cancelar</Text></TouchableOpacity>
      </ScrollView>
    );
  }

  if (vista === 'catalogo') {
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
      <TouchableOpacity style={styles.menuItem} onPress={() => { setModoPerfil('vista'); setVista('perfil_negocio'); }}>
        <Ionicons name="storefront" size={30} color={AuraColors.primary} />
        <Text style={styles.menuText}>Mi Establecimiento Público</Text>
      </TouchableOpacity>
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
  scroll: { flex: 1, padding: 10, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: AuraColors.primary, padding: 30, borderRadius: 20, marginBottom: 20 },
  headerT: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 20 },
  sub: { fontSize: 22, fontWeight: 'bold', color: AuraColors.primary, marginBottom: 20, textAlign: 'center' },
  
  // Estilos de Vista Perfil (FB Style Premium)
  portadaContainer: { height: 180, backgroundColor: '#ddd', marginBottom: 60, position: 'relative' },
  portadaImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  logoOverlayContainer: { position: 'absolute', bottom: -50, alignSelf: 'center', zIndex: 10, elevation: 5 },
  logoOverlay: { width: 110, height: 110, borderRadius: 55, borderWidth: 4, borderColor: 'white', backgroundColor: '#fff' },
  infoCentral: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  tituloPerfil: { fontSize: 26, fontWeight: 'bold', color: '#1c1e21', textAlign: 'center' },
  textoCategoria: { fontSize: 14, color: AuraColors.gold, fontWeight: 'bold', marginVertical: 3 },
  textoRepresentante: { fontSize: 14, color: '#65676b', textAlign: 'center', marginBottom: 15, fontStyle: 'italic' },
  textoGris: { fontSize: 15, color: '#65676b', marginBottom: 8 },
  btnEditarPerfil: { flexDirection: 'row', backgroundColor: AuraColors.primary, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 30, alignItems: 'center', elevation: 2 },
  seccionCard: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4 },
  labelTitulo: { fontSize: 18, fontWeight: 'bold', color: '#1c1e21', marginBottom: 15 },
  
  // Selectores de Categoría
  selectorCategoria: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  btnCategoria: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: AuraColors.primary, borderRadius: 8, alignItems: 'center', marginHorizontal: 2 },
  btnCategoriaActiva: { backgroundColor: AuraColors.primary },
  txtCategoria: { color: AuraColors.primary, fontWeight: 'bold', fontSize: 12 },
  txtCategoriaActiva: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  // Documentos
  btnPdf: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  txtPdf: { marginLeft: 15, color: AuraColors.primary, fontWeight: 'bold' },
  
  // Galería
  fotoGaleriaContainer: { shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, marginRight: 15, backgroundColor: 'white', borderRadius: 12 },
  fotoGaleriaMejorada: { width: 260, height: 160, borderRadius: 12, resizeMode: 'cover' },
  licenciaImg: { width: '100%', height: 220, resizeMode: 'contain', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  
  // Estilos de Formularios
  label: { fontWeight: 'bold', marginTop: 15, marginBottom: 5, color: '#444' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  btnPri: { backgroundColor: AuraColors.primary, padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  btnSec: { flexDirection: 'row', backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, marginBottom: 15, alignItems: 'center', justifyContent: 'center' },
  btnC: { padding: 20, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnTextOscuro: { color: AuraColors.primary, fontWeight: 'bold' },
  btnTextC: { color: AuraColors.primary, fontWeight: 'bold' },
  btnEliminarFoto: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,0,0,0.7)', borderRadius: 15, padding: 5 },
  centroAvatar: { alignItems: 'center', marginBottom: 10, marginTop: 10 },
  logoEmpresa: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: AuraColors.gold, marginBottom: 15 },
  
  // Otros
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
  boxCotizacion: { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: '#ddd' },
  mapContainer: { height: 250, borderRadius: 15, overflow: 'hidden', marginVertical: 10, borderWidth: 1, borderColor: '#ccc', zIndex: 1 }
});