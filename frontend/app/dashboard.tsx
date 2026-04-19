import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AdminDashboard from '../components/admin/AdminDashboard';
import ClientDashboard from '../components/client/ClientDashboard';
import BusinessDashboard from '../components/business/BusinessDashboard';
import { AuraColors } from '../constants/Colors';

export default function DashboardScreen() {
  const { 0: userRole, 1: setUserRole } = useState<string>('');
  const { 0: loading, 1: setLoading } = useState<boolean>(true);

  useEffect(() => {
    loadRole();
  }, new Array());

  const loadRole = async () => {
    const role = await AsyncStorage.getItem('userRole');
    if (role) {
      setUserRole(role);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </View>
    );
  }

  if (userRole === 'administrador') {
    return <AdminDashboard />;
  }

  if (userRole === 'centro') {
    return <BusinessDashboard />;
  }

  return <ClientDashboard />;
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center' }
});