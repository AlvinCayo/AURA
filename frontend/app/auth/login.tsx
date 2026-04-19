import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();

  const { 0: email, 1: setEmail } = useState<string>('');
  const { 0: password, 1: setPassword } = useState<string>('');
  const { 0: showPassword, 1: setShowPassword } = useState<boolean>(false);

  const mostrarAlerta = (titulo: string, mensaje: string) => {
    if (Platform.OS === 'web') {
      window.alert(titulo + ' - ' + mensaje);
    } else {
      Alert.alert(titulo, mensaje);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      mostrarAlerta('Aviso', 'Por favor ingresa tus datos completos');
      return;
    }

    const payload = { email, password };
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    try {
      const response = await fetch('https://aura-ukzs.onrender.com/api/auth/login', requestOptions);
      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('userId', data.user.id);
        await AsyncStorage.setItem('userRole', data.user.role);
        router.replace('/dashboard' as never);
      } else {
        mostrarAlerta('Error', 'Los datos ingresados no son correctos');
      }
    } catch (error) {
      mostrarAlerta('Error', 'Revisa tu conexion a internet');
    }
  };

  const navigateToRegister = () => {
    router.push('/auth/register' as never);
  };

  const navigateToForgot = () => {
    router.push('/auth/forgot-password' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={40} color={AuraColors.primary} />
        <Text style={styles.title}>AURA</Text>
        <Text style={styles.subtitle}>Gestor de Belleza y Estilo</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput
            style={styles.input}
            onChangeText={setEmail}
            value={email}
            placeholder="ejemplo arroba correo punto com"
            placeholderTextColor={AuraColors.gold}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color={AuraColors.primary} style={styles.icon} />
          <TextInput
            style={styles.input}
            onChangeText={setPassword}
            value={password}
            placeholder="Tu clave de seguridad"
            secureTextEntry={!showPassword}
            placeholderTextColor={AuraColors.gold}
          />
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={AuraColors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.forgotContainer} onPress={navigateToForgot}>
          <Text style={styles.forgotText}>Recuperar mi acceso</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Ingresar al sistema</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Aun no tienes una cuenta registrada?</Text>
        <TouchableOpacity onPress={navigateToRegister}>
          <Text style={styles.registerText}>Registrate aqui</Text>
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
    marginBottom: 50
  },
  title: {
    fontSize: 32,
    color: AuraColors.primary,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 2
  },
  subtitle: {
    fontSize: 14,
    color: AuraColors.accent,
    marginTop: 5,
    fontWeight: '500'
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
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 30
  },
  forgotText: {
    color: AuraColors.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  button: {
    backgroundColor: AuraColors.primary,
    borderRadius: 12,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40
  },
  footerText: {
    color: AuraColors.accent,
    fontSize: 14
  },
  registerText: {
    color: AuraColors.secondary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5
  }
});