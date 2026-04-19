import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';
import { UserRole } from '../../src/types/user';

export default function RegisterScreen() {
  const router = useRouter();

  const { 0: role, 1: setRole } = useState<UserRole>('usuario');
  
  const { 0: email, 1: setEmail } = useState<string>('');
  const { 0: password, 1: setPassword } = useState<string>('');
  const { 0: firstName, 1: setFirstName } = useState<string>('');
  const { 0: lastName, 1: setLastName } = useState<string>('');
  const { 0: phone, 1: setPhone } = useState<string>('');
  
  const { 0: birthDate, 1: setBirthDate } = useState<string>('');
  const { 0: dateObj, 1: setDateObj } = useState<Date>(new Date());
  const { 0: showDatePicker, 1: setShowDatePicker } = useState<boolean>(false);

  const { 0: gender, 1: setGender } = useState<string>('');
  
  const { 0: licenseUrl, 1: setLicenseUrl } = useState<string>('');
  const { 0: licenseName, 1: setLicenseName } = useState<string>('');
  const { 0: zone, 1: setZone } = useState<string>('');
  const { 0: street, 1: setStreet } = useState<string>('');
  const { 0: buildingNumber, 1: setBuildingNumber } = useState<string>('');
  const { 0: businessCategory, 1: setBusinessCategory } = useState<string>('');

  const mostrarAlerta = (titulo: string, mensaje: string) => {
    if (Platform.OS === 'web') {
      window.alert(titulo + ' - ' + mensaje);
    } else {
      Alert.alert(titulo, mensaje);
    }
  };

  const selectUserRole = () => setRole('usuario');
  const selectBusinessRole = () => setRole('centro');

  const selectMasculino = () => setGender('masculino');
  const selectFemenino = () => setGender('femenino');
  const selectOtro = () => setGender('otro');

  const selectSalon = () => setBusinessCategory('salon');
  const selectBarberia = () => setBusinessCategory('barberia');
  const selectUnisex = () => setBusinessCategory('unisex');

  const displayDatePicker = () => setShowDatePicker(true);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear().toString();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      
      const formattedDate = year + '-' + month + '-' + day;
      setBirthDate(formattedDate);
      setDateObj(selectedDate);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled) {
        const { assets } = result;
        const { 0: firstFile } = assets;
        setLicenseUrl(firstFile.uri);
        setLicenseName(firstFile.name);
      }
    } catch (error) {
      mostrarAlerta('Error', 'No se pudo seleccionar el documento');
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !firstName || !lastName || !birthDate || !gender || !phone) {
      mostrarAlerta('Aviso', 'Completa los campos obligatorios');
      return;
    }

    const isBusiness = role === 'centro';
    const endpoint = isBusiness ? 'http://localhost:3000/api/auth/register/business' : 'http://localhost:3000/api/auth/register/client';

    const basePayload = {
      email,
      password,
      birthDate,
      gender,
      phone
    };

    const clientPayload = {
      ...basePayload,
      firstName,
      lastName
    };

    const businessPayload = {
      ...basePayload,
      repName: firstName,
      repLastName: lastName,
      licenseUrl,
      zone,
      street,
      buildingNumber,
      businessCategory
    };

    const finalPayload = isBusiness ? businessPayload : clientPayload;

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload)
    };

    try {
      const response = await fetch(endpoint, requestOptions);
      const data = await response.json();

      if (data.success) {
        mostrarAlerta('Exito', 'Cuenta creada correctamente');
        router.replace('/auth/login' as never);
      } else {
        mostrarAlerta('Error', 'No se pudo crear la cuenta');
      }
    } catch (error) {
      mostrarAlerta('Error', 'Fallo de comunicacion con el servidor');
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login' as never);
  };

  const isWeb = Platform.OS === 'web';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Crea tu Perfil</Text>
        <Text style={styles.subtitle}>Unete a la comunidad de AURA</Text>
      </View>

      <View style={styles.roleContainer}>
        <TouchableOpacity 
          style={role === 'usuario' ? styles.roleButtonActive : styles.roleButton} 
          onPress={selectUserRole}
        >
          <Ionicons name="person-outline" size={20} color={role === 'usuario' ? AuraColors.white : AuraColors.primary} />
          <Text style={role === 'usuario' ? styles.roleTextActive : styles.roleText}>Cliente</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={role === 'centro' ? styles.roleButtonActive : styles.roleButton} 
          onPress={selectBusinessRole}
        >
          <Ionicons name="business-outline" size={20} color={role === 'centro' ? AuraColors.white : AuraColors.primary} />
          <Text style={role === 'centro' ? styles.roleTextActive : styles.roleText}>Negocio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Datos de Acceso</Text>
        
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput 
            style={styles.input} 
            onChangeText={setEmail} 
            value={email} 
            autoCapitalize="none" 
            keyboardType="email-address" 
            placeholder="Correo Electronico"
            placeholderTextColor={AuraColors.gold}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput 
            style={styles.input} 
            onChangeText={setPassword} 
            value={password} 
            secureTextEntry 
            placeholder="Contraseña segura"
            placeholderTextColor={AuraColors.gold}
          />
        </View>

        <Text style={styles.label}>Informacion Personal</Text>

        <View style={styles.inputContainer}>
          <Ionicons name="person-circle-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput 
            style={styles.input} 
            onChangeText={setFirstName} 
            value={firstName} 
            placeholder="Tus Nombres"
            placeholderTextColor={AuraColors.gold}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="person-circle-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput 
            style={styles.input} 
            onChangeText={setLastName} 
            value={lastName} 
            placeholder="Tus Apellidos"
            placeholderTextColor={AuraColors.gold}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput 
            style={styles.input} 
            onChangeText={setPhone} 
            value={phone} 
            keyboardType="phone-pad" 
            placeholder="Celular"
            placeholderTextColor={AuraColors.gold}
          />
        </View>

        <Text style={styles.labelSection}>Fecha de Nacimiento</Text>
        {isWeb ? (
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color={AuraColors.primary} style={styles.icon} />
            <TextInput 
              style={styles.input} 
              onChangeText={setBirthDate} 
              value={birthDate} 
              placeholder="AAAA-MM-DD" 
              placeholderTextColor={AuraColors.gold} 
            />
          </View>
        ) : (
          <View>
            <TouchableOpacity style={styles.inputContainer} onPress={displayDatePicker}>
              <Ionicons name="calendar-outline" size={20} color={AuraColors.primary} style={styles.icon} />
              <Text style={birthDate ? styles.inputText : styles.placeholderText}>
                {birthDate ? birthDate : 'Toca para seleccionar tu fecha'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}
          </View>
        )}

        <Text style={styles.labelSection}>Genero</Text>
        <View style={styles.selectionRow}>
          <TouchableOpacity style={gender === 'masculino' ? styles.selectionActive : styles.selectionInactive} onPress={selectMasculino}>
             <Text style={gender === 'masculino' ? styles.selectionTextActive : styles.selectionTextInactive}>Masculino</Text>
          </TouchableOpacity>
          <TouchableOpacity style={gender === 'femenino' ? styles.selectionActive : styles.selectionInactive} onPress={selectFemenino}>
             <Text style={gender === 'femenino' ? styles.selectionTextActive : styles.selectionTextInactive}>Femenino</Text>
          </TouchableOpacity>
          <TouchableOpacity style={gender === 'otro' ? styles.selectionActive : styles.selectionInactive} onPress={selectOtro}>
             <Text style={gender === 'otro' ? styles.selectionTextActive : styles.selectionTextInactive}>Otro</Text>
          </TouchableOpacity>
        </View>

        {role === 'centro' && (
          <View style={styles.businessSection}>
            <Text style={styles.label}>Datos del Negocio</Text>
            
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Ionicons name="document-text-outline" size={24} color={AuraColors.primary} style={styles.icon} />
              <Text style={styles.uploadButtonText}>
                {licenseName ? licenseName : 'Cargar PDF de Licencia'}
              </Text>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Ionicons name="location-outline" size={20} color={AuraColors.primary} style={styles.icon} />
              <TextInput style={styles.input} onChangeText={setZone} value={zone} placeholder="Zona" placeholderTextColor={AuraColors.gold} />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="navigate-outline" size={20} color={AuraColors.primary} style={styles.icon} />
              <TextInput style={styles.input} onChangeText={setStreet} value={street} placeholder="Calle o Avenida" placeholderTextColor={AuraColors.gold} />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="home-outline" size={20} color={AuraColors.primary} style={styles.icon} />
              <TextInput style={styles.input} onChangeText={setBuildingNumber} value={buildingNumber} placeholder="Numero de Local" placeholderTextColor={AuraColors.gold} />
            </View>

            <Text style={styles.labelSection}>Categoria</Text>
            <View style={styles.selectionRow}>
              <TouchableOpacity style={businessCategory === 'salon' ? styles.selectionActive : styles.selectionInactive} onPress={selectSalon}>
                 <Text style={businessCategory === 'salon' ? styles.selectionTextActive : styles.selectionTextInactive}>Salon</Text>
              </TouchableOpacity>
              <TouchableOpacity style={businessCategory === 'barberia' ? styles.selectionActive : styles.selectionInactive} onPress={selectBarberia}>
                 <Text style={businessCategory === 'barberia' ? styles.selectionTextActive : styles.selectionTextInactive}>Barberia</Text>
              </TouchableOpacity>
              <TouchableOpacity style={businessCategory === 'unisex' ? styles.selectionActive : styles.selectionInactive} onPress={selectUnisex}>
                 <Text style={businessCategory === 'unisex' ? styles.selectionTextActive : styles.selectionTextInactive}>Unisex</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>CREAR CUENTA</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={navigateToLogin}>
          <Text style={styles.secondaryButtonText}>Volver al inicio de sesion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: AuraColors.background
  },
  content: {
    padding: 30,
    paddingTop: 50,
    paddingBottom: 50
  },
  header: {
    marginBottom: 30,
    alignItems: 'center'
  },
  title: { 
    fontSize: 32, 
    color: AuraColors.primary, 
    fontWeight: '800',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 14,
    color: AuraColors.accent,
    marginTop: 8,
    fontWeight: '500'
  },
  roleContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 25 
  },
  roleButton: { 
    flex: 1, 
    flexDirection: 'row',
    padding: 15, 
    borderWidth: 1, 
    borderColor: AuraColors.gold, 
    borderRadius: 12, 
    marginHorizontal: 5, 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AuraColors.white,
    shadowColor: AuraColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  roleButtonActive: { 
    flex: 1, 
    flexDirection: 'row',
    padding: 15, 
    backgroundColor: AuraColors.primary, 
    borderRadius: 12, 
    marginHorizontal: 5, 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AuraColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  roleText: { 
    color: AuraColors.primary, 
    fontWeight: 'bold',
    marginLeft: 8
  },
  roleTextActive: { 
    color: AuraColors.white, 
    fontWeight: 'bold',
    marginLeft: 8
  },
  form: { 
    width: '100%'
  },
  label: { 
    color: AuraColors.primary, 
    fontSize: 18, 
    fontWeight: '800', 
    marginBottom: 15,
    marginTop: 10
  },
  labelSection: {
    color: AuraColors.primary, 
    fontSize: 14, 
    fontWeight: 'bold', 
    marginBottom: 10,
    marginLeft: 4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AuraColors.white,
    borderWidth: 1,
    borderColor: AuraColors.gold,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 55,
    shadowColor: AuraColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2
  },
  icon: {
    marginRight: 10
  },
  input: { 
    flex: 1,
    color: AuraColors.primary,
    fontSize: 16,
    height: '100%'
  },
  inputText: {
    flex: 1,
    color: AuraColors.primary,
    fontSize: 16
  },
  placeholderText: {
    flex: 1,
    color: AuraColors.gold,
    fontSize: 16
  },
  selectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25
  },
  selectionInactive: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: AuraColors.gold,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: AuraColors.white
  },
  selectionActive: {
    flex: 1,
    padding: 12,
    backgroundColor: AuraColors.accent,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: 'center'
  },
  selectionTextInactive: {
    color: AuraColors.primary,
    fontSize: 13,
    fontWeight: 'bold'
  },
  selectionTextActive: {
    color: AuraColors.white,
    fontSize: 13,
    fontWeight: 'bold'
  },
  businessSection: {
    marginTop: 10,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: AuraColors.gold
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: AuraColors.white,
    borderWidth: 1,
    borderColor: AuraColors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  uploadButtonText: {
    color: AuraColors.primary,
    fontWeight: 'bold',
    fontSize: 15
  },
  button: { 
    backgroundColor: AuraColors.primary, 
    height: 55, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: AuraColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  buttonText: { 
    color: AuraColors.white, 
    fontSize: 18, 
    fontWeight: 'bold',
    letterSpacing: 1
  },
  secondaryButton: { 
    marginTop: 25, 
    alignItems: 'center' 
  },
  secondaryButtonText: { 
    color: AuraColors.accent, 
    fontSize: 15, 
    fontWeight: '600' 
  }
});