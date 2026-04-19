import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';

export default function ClientDashboard() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, new Array());

  const loadProfile = async () => {
    const id = await AsyncStorage.getItem('userId');
    const role = await AsyncStorage.getItem('userRole');
    if (id && role) {
      const response = await fetch('https://aura-ukzs.onrender.com/api/users/profile/' + id + '/' + role);
      const data = await response.json();
      if (data.success) {
        setUserName(data.profile.first_name);
        setUserPhoto(data.profile.profile_picture || '');
      }
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/auth/login' as never);
  };

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.curvedHeader}>
        <Text style={styles.appName}>AURA CLIENTE</Text>
      </View>

      <ScrollView style={styles.profileContainer}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {userPhoto && userPhoto.length > 5 ? (
              <Image source={{ uri: userPhoto }} style={styles.mainAvatar} />
            ) : (
              <View style={styles.placeholderMainAvatar}>
                <Ionicons name="person" size={40} color={AuraColors.gold} />
              </View>
            )}
          </View>
          <Text style={styles.userNameText}>Hola {userName}</Text>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="search-outline" size={24} color={AuraColors.primary} />
            <Text style={styles.menuItemText}>Buscar y Agendar Cita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="calendar-outline" size={24} color={AuraColors.primary} />
            <Text style={styles.menuItemText}>Mis Reservas Activas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="time-outline" size={24} color={AuraColors.primary} />
            <Text style={styles.menuItemText}>Historial de Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="scan-outline" size={24} color={AuraColors.primary} />
            <Text style={styles.menuItemText}>Analisis Biometrico Facial</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutAction} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={AuraColors.white} />
          <Text style={styles.logoutActionText}>Cerrar Sesion</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: AuraColors.background },
  curvedHeader: { backgroundColor: AuraColors.primary, height: 150, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', paddingTop: 60 },
  appName: { fontSize: 24, color: AuraColors.white, fontWeight: '900', letterSpacing: 2 },
  profileContainer: { flex: 1, marginTop: -40, paddingHorizontal: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarContainer: { marginBottom: 15 },
  mainAvatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: AuraColors.white },
  placeholderMainAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: AuraColors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: AuraColors.gold },
  userNameText: { fontSize: 22, color: AuraColors.primary, fontWeight: 'bold' },
  menuCard: { backgroundColor: AuraColors.white, borderRadius: 20, padding: 10, elevation: 3, marginBottom: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuItemText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '600', color: AuraColors.primary },
  logoutAction: { flexDirection: 'row', backgroundColor: AuraColors.secondary, padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoutActionText: { color: AuraColors.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 }
});