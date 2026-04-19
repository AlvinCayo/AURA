import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { 0: email, 1: setEmail } = useState<string>('');
  const { 0: phone, 1: setPhone } = useState<string>('');
  const { 0: newPassword, 1: setNewPassword } = useState<string>('');
  const { 0: showPassword, 1: setShowPassword } = useState<boolean>(false);

  const mostrarAlerta = (titulo: string, mensaje: string) => {
    if (Platform.OS === 'web') {
      window.alert(titulo + ' - ' + mensaje);
    } else {
      Alert.alert(titulo, mensaje);
    }
  };

  const handleReset = async () => {
    if (!email || !phone || !newPassword) {
      mostrarAlerta('Aviso', 'Completa todos los campos');
      return;
    }

    const payload = { email, phone, newPassword };
    try {
      const response = await fetch('http://192.168.1.213:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        mostrarAlerta('Exito', 'Contraseña actualizada de forma segura');
        router.replace('/auth/login' as never);
      } else {
        mostrarAlerta('Error', 'Los datos no coinciden con nuestros registros');
      }
    } catch (error) {
      mostrarAlerta('Error', 'Fallo de comunicacion con el servidor');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="key-outline" size={45} color={AuraColors.primary} />
        </View>
        <Text style={styles.title}>Recuperar Acceso</Text>
        <Text style={styles.subtitle}>Verifica tu identidad para crear una nueva clave</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput 
            style={styles.input} 
            placeholder="Correo Electronico" 
            onChangeText={setEmail} 
            value={email} 
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={AuraColors.gold} 
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput 
            style={styles.input} 
            placeholder="Telefono Registrado" 
            onChangeText={setPhone} 
            value={phone} 
            keyboardType="phone-pad"
            placeholderTextColor={AuraColors.gold} 
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput 
            style={styles.input} 
            placeholder="Nueva Contraseña" 
            onChangeText={setNewPassword} 
            value={newPassword} 
            secureTextEntry={!showPassword} 
            placeholderTextColor={AuraColors.gold} 
          />
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={AuraColors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>ACTUALIZAR CLAVE</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Cancelar y Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: AuraColors.background, 
    justifyContent: 'center', 
    paddingHorizontal: 30 
  },
  header: {
    alignItems: 'center',
    marginBottom: 40
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: AuraColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: AuraColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  title: { 
    fontSize: 28, 
    color: AuraColors.primary, 
    fontWeight: '800',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 14,
    color: AuraColors.accent,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20
  },
  form: { 
    width: '100%' 
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
  button: { 
    backgroundColor: AuraColors.primary, 
    height: 55, 
    borderRadius: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: AuraColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5 
  },
  buttonText: { 
    color: AuraColors.white, 
    fontSize: 16, 
    fontWeight: 'bold',
    letterSpacing: 1
  },
  backButton: {
    marginTop: 25,
    alignItems: 'center'
  },
  backButtonText: {
    color: AuraColors.accent,
    fontSize: 15,
    fontWeight: '600'
  }
});