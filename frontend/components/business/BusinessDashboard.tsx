import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';

type ServicioAura = {
  id: string;
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
  image_url: string;
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

  useEffect(() => {
    if (vista === 'catalogo') {
      cargarCatalogo();
    }
  }, [vista]);

  const cargarCatalogo = async () => {
    const businessId = await AsyncStorage.getItem('userId');
    if (!businessId) return;

    try {
      const res = await fetch('https://aura-ukzs.onrender.com/api/services/business/' + businessId);
      const data = await res.json();
      if (data.success) {
        setCatalogo(data.data);
      }
    } catch (err) {
      Alert.alert('Error de Red', 'No se pudo conectar con Render para cargar el catalogo');
    }
  };

  const seleccionarImagen = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1
    });
    if (!res.canceled) {
      setImagenUri(res.assets[0].uri);
    }
  };

  const prepararEdicion = (servicio: ServicioAura) => {
    setIdEdicion(servicio.id);
    setNombre(servicio.name);
    setDescripcion(servicio.description);
    setPrecio(servicio.price.toString());
    setDuracion(servicio.duration_minutes.toString());
    setImagenUri(servicio.image_url);
    setVista('formulario');
  };

  const procesarServicio = async () => {
    const vPrecio = parseFloat(precio);
    if (vPrecio < 20) {
      Alert.alert('Regla de Negocio', 'El precio minimo es 20 Bs');
      return;
    }

    const businessId = await AsyncStorage.getItem('userId');
    const fd = new FormData();
    fd.append('business_id', businessId || '');
    fd.append('name', nombre);
    fd.append('description', descripcion);
    fd.append('price', precio);
    fd.append('duration_minutes', duracion);

    if (imagenUri && !imagenUri.startsWith('http')) {
      const extension = imagenUri.split('.').pop() || 'jpg';
      fd.append('image', {
        uri: imagenUri,
        name: `servicio.${extension}`,
        type: `image/${extension}`
      } as any);
    }

    const urlBase = idEdicion 
      ? `https://aura-ukzs.onrender.com/api/services/update/${idEdicion}`
      : `https://aura-ukzs.onrender.com/api/services/create`;
    
    const metodoHttp = idEdicion ? 'PUT' : 'POST';

    try {
      const response = await fetch(urlBase, {
        method: metodoHttp,
        body: fd,
        headers: { 'Accept': 'application/json' }
      });

      const resData = await response.json();
      if (resData.success) {
        Alert.alert('Éxito', 'Servicio guardado correctamente en AURA');
        limpiarYVolver();
      } else {
        Alert.alert('Error del Servidor', resData.error || 'Fallo interno al procesar');
      }
    } catch (error) {
      Alert.alert('Error de Red', 'No se pudo contactar al servidor de Render');
    }
  };

  const eliminarServicio = async (id: string) => {
    Alert.alert('AURA', '¿Eliminar este servicio?', [
      { text: 'Cancelar' },
      { text: 'Eliminar', onPress: async () => {
          try {
            const res = await fetch(`https://aura-ukzs.onrender.com/api/services/delete/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) cargarCatalogo();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar el servicio');
          }
      }}
    ]);
  };

  const limpiarYVolver = () => {
    setNombre(''); setDescripcion(''); setPrecio(''); setDuracion('');
    setImagenUri(''); setIdEdicion(null); setVista('inicio');
  };

  if (vista === 'formulario') {
    return (
      <ScrollView style={styles.scroll}>
        <Text style={styles.sub}>{idEdicion ? 'Editar Servicio' : 'Nuevo Servicio'}</Text>
        <TextInput style={styles.input} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
        <TextInput style={styles.input} placeholder="Descripcion" value={descripcion} onChangeText={setDescripcion} multiline />
        <TextInput style={styles.input} placeholder="Precio Bs" keyboardType="numeric" value={precio} onChangeText={setPrecio} />
        <TextInput style={styles.input} placeholder="Minutos" keyboardType="numeric" value={duracion} onChangeText={setDuracion} />
        
        <TouchableOpacity style={styles.btnSec} onPress={seleccionarImagen}>
          <Text style={styles.btnText}>Elegir Foto</Text>
        </TouchableOpacity>

        {imagenUri !== '' && <Image source={{ uri: imagenUri }} style={styles.imgPre} />}

        <TouchableOpacity style={styles.btnPri} onPress={procesarServicio}>
          <Text style={styles.btnText}>Guardar Cambios</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.btnC} onPress={limpiarYVolver}>
          <Text style={styles.btnTextC}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (vista === 'catalogo') {
    return (
      <ScrollView style={styles.scroll}>
        <Text style={styles.sub}>Mis Servicios Publicados</Text>
        {Object.values(catalogo).map((ser) => (
          <View key={ser.id} style={styles.card}>
            {ser.image_url ? (
              <Image source={{ uri: ser.image_url }} style={styles.cardImg} />
            ) : (
              <View style={[styles.cardImg, { backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={30} color="#ccc" />
              </View>
            )}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{ser.name}</Text>
              <Text style={styles.cardPrice}>{ser.price} Bs</Text>
              <View style={styles.row}>
                <TouchableOpacity style={styles.actBtn} onPress={() => prepararEdicion(ser)}>
                  <Ionicons name="pencil" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => eliminarServicio(ser.id)}>
                  <Ionicons name="trash" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.btnC} onPress={() => setVista('inicio')}>
          <Text style={styles.btnTextC}>Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerT}>AURA BUSINESS</Text></View>
      <TouchableOpacity style={styles.menuItem} onPress={() => setVista('formulario')}>
        <Ionicons name="add-circle" size={30} color={AuraColors.primary} />
        <Text style={styles.menuText}>Registrar Servicio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuItem} onPress={() => setVista('catalogo')}>
        <Ionicons name="list" size={30} color={AuraColors.primary} />
        <Text style={styles.menuText}>Gestionar mi Catalogo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuraColors.background, padding: 20 },
  scroll: { flex: 1, padding: 5 },
  header: { backgroundColor: AuraColors.primary, padding: 30, borderRadius: 20, marginBottom: 20 },
  headerT: { color: 'white', fontWeight: 'bold', textAlign: 'center', fontSize: 20 },
  sub: { fontSize: 22, fontWeight: 'bold', color: AuraColors.primary, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  btnPri: { backgroundColor: AuraColors.primary, padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnSec: { backgroundColor: AuraColors.secondary, padding: 12, borderRadius: 10, marginBottom: 15, alignItems: 'center' },
  btnC: { padding: 15, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  btnTextC: { color: AuraColors.primary, fontWeight: 'bold' },
  imgPre: { width: '100%', height: 200, borderRadius: 10, marginBottom: 15 },
  menuItem: { backgroundColor: 'white', padding: 25, borderRadius: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  menuText: { marginLeft: 15, fontWeight: 'bold', color: AuraColors.primary },
  card: { backgroundColor: 'white', borderRadius: 15, marginBottom: 15, overflow: 'hidden', flexDirection: 'row', elevation: 3 },
  cardImg: { width: 100, height: 100 },
  cardInfo: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardTitle: { fontWeight: 'bold', color: AuraColors.primary },
  cardPrice: { color: AuraColors.gold, fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  actBtn: { backgroundColor: AuraColors.primary, padding: 8, borderRadius: 5, marginRight: 10 },
  delBtn: { backgroundColor: '#ff4444', padding: 8, borderRadius: 5 }
});