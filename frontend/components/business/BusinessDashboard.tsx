import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuraColors } from '../../constants/Colors';

export default function BusinessDashboard() {
  const router = useRouter();
  const [isApproved, setIsApproved] = useState<boolean>(true);

  useEffect(() => {
    verifyStatus();
  }, []);

  const verifyStatus = async () => {
    const id = await AsyncStorage.getItem('userId');
    const role = await AsyncStorage.getItem('userRole');
    if (id && role) {
      const response = await fetch('http://192.168.1.213:3000/api/users/profile/' + id + '/' + role);
      const data = await response.json();
      if (data.success) {
        setIsApproved(data.profile.is_approved);
      }
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/auth/login' as never);
  };

  if (isApproved === false) {
    return (
      <View style={styles.mainWrapper}>
        <View style={styles.curvedHeader}>
          <Text style={styles.appName}>AURA NEGOCIOS</Text>
        </View>
        <View style={styles.restrictedCard}>
          <Ionicons name="lock-closed" size={60} color={AuraColors.gold} />
          <Text style={styles.restrictedTitle}>Acceso Restringido</Text>
          <Text style={styles.restrictedText}>Tu cuenta esta en proceso de validacion administrativa</Text>
          <TouchableOpacity style={styles.logoutAction} onPress={handleLogout}>
            <Text style={styles.logoutActionText}>Salir del Sistema</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.curvedHeader}>
        <Text style={styles.appName}>AURA NEGOCIOS</Text>
      </View>

      <ScrollView style={styles.profileContainer}>
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="calendar-outline" size={24} color={AuraColors.primary} />
            <Text style={styles.menuItemText}>Gestionar Agenda de Citas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="list-outline" size={24} color={AuraColors.primary} />
            <Text style={styles.menuItemText}>Catalogo de Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="qr-code-outline" size={24} color={AuraColors.primary} />
            <Text style={styles.menuItemText}>Escanear QR de Cliente</Text>
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
  profileContainer: { flex: 1, marginTop: -20, paddingHorizontal: 20 },
  menuCard: { backgroundColor: AuraColors.white, borderRadius: 20, padding: 10, elevation: 3, marginBottom: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuItemText: { flex: 1, marginLeft: 15, fontSize: 16, fontWeight: '600', color: AuraColors.primary },
  logoutAction: { flexDirection: 'row', backgroundColor: AuraColors.secondary, padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoutActionText: { color: AuraColors.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  restrictedCard: { backgroundColor: AuraColors.white, borderRadius: 20, padding: 30, alignItems: 'center', margin: 20, elevation: 3 },
  restrictedTitle: { fontSize: 22, color: AuraColors.primary, fontWeight: 'bold', marginVertical: 15 },
  restrictedText: { fontSize: 15, color: AuraColors.primary, textAlign: 'center', marginBottom: 20 }
});