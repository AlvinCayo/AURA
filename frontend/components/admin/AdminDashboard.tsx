import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, ScrollView, Dimensions, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { AuraColors } from '../../constants/Colors';

export default function AdminDashboard() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  const [loading, setLoading] = useState<boolean>(true);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adminTab, setAdminTab] = useState<string>('stats');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const mostrarAlerta = (titulo: string, mensaje: string) => {
    if (Platform.OS === 'web') {
      window.alert(titulo + ' - ' + mensaje);
    } else {
      Alert.alert(titulo, mensaje);
    }
  };

  const confirmarAccion = (titulo: string, mensaje: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      const confirmacionWeb = window.confirm(titulo + ' - ' + mensaje);
      if (confirmacionWeb) {
        onConfirm();
      }
    } else {
      Alert.alert(
        titulo,
        mensaje,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: onConfirm }
        ]
      );
    }
  };

  const loadData = async () => {
    try {
      const resUsers = await fetch('https://aura-ukzs.onrender.com/api/admin/users');
      const dataUsers = await resUsers.json();
      if (dataUsers.success) setSystemUsers(dataUsers.users);
      
      const resLogs = await fetch('https://aura-ukzs.onrender.com/api/admin/logs');
      const dataLogs = await resLogs.json();
      if (dataLogs.success) setSystemLogs(dataLogs.logs);

      const resStats = await fetch('https://aura-ukzs.onrender.com/api/admin/stats');
      const dataStats = await resStats.json();
      if (dataStats.success) setStats(dataStats);
    } catch (error) {
      mostrarAlerta('Error', 'Fallo de red al cargar informacion');
    } finally {
      setLoading(false);
    }
  };

  const getRoleChartData = () => {
    const pieData = [];
    if (stats && stats.roles) {
      for (let i = 0; i < stats.roles.length; i++) {
        const item = stats.roles[i];
        pieData.push({
          name: item.name,
          population: Number(item.count),
          color: i === 0 ? AuraColors.primary : i === 1 ? AuraColors.secondary : AuraColors.gold,
          legendFontColor: AuraColors.primary,
          legendFontSize: 12
        });
      }
    }
    return pieData;
  };

  const getGenderChartData = () => {
    const pieData = [];
    if (stats && stats.genders) {
      for (let i = 0; i < stats.genders.length; i++) {
        const item = stats.genders[i];
        pieData.push({
          name: item.name,
          population: Number(item.count),
          color: i === 0 ? '#4A90E2' : i === 1 ? '#E91E63' : '#9E9E9E',
          legendFontColor: AuraColors.primary,
          legendFontSize: 12
        });
      }
    }
    return pieData;
  };

  const getPendingRequests = () => {
    const pending = [];
    for (let i = 0; i < systemUsers.length; i++) {
      const user = systemUsers[i];
      if (user.role === 'centro' && user.is_approved === false) {
        pending.push(user);
      }
    }
    return pending;
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const requestOptions = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus })
    };
    try {
      const response = await fetch('https://aura-ukzs.onrender.com/api/admin/status/' + userId, requestOptions);
      const data = await response.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      mostrarAlerta('Error', 'No se pudo cambiar el estado');
    }
  };

  const confirmToggleUserStatus = (userId: string, currentStatus: boolean) => {
    const accion = currentStatus ? 'DESHABILITAR' : 'HABILITAR';
    confirmarAccion(
      'Confirmacion de Seguridad',
      '¿Seguro que deseas ' + accion + ' a este usuario?',
      () => toggleUserStatus(userId, currentStatus)
    );
  };

  const approveBusinessAccount = async (userId: string) => {
    const requestOptions = { method: 'PUT' };
    try {
      const response = await fetch('https://aura-ukzs.onrender.com/api/admin/approve/' + userId, requestOptions);
      const data = await response.json();
      if (data.success) {
        mostrarAlerta('Exito', 'Centro aprobado correctamente');
        loadData();
        setSelectedUser(null);
      }
    } catch (error) {
      mostrarAlerta('Error', 'No se pudo aprobar la cuenta');
    }
  };

  const rejectBusinessAccount = async (userId: string) => {
    const requestOptions = { method: 'PUT' };
    try {
      const response = await fetch('https://aura-ukzs.onrender.com/api/admin/reject/' + userId, requestOptions);
      const data = await response.json();
      if (data.success) {
        mostrarAlerta('Exito', 'Solicitud rechazada');
        loadData();
        setSelectedUser(null);
      }
    } catch (error) {
      mostrarAlerta('Error', 'No se pudo rechazar la cuenta');
    }
  };

  const confirmApproveBusiness = (userId: string) => {
    confirmarAccion(
      'Aprobacion de Negocio',
      '¿Confirmas que la licencia es valida?',
      () => approveBusinessAccount(userId)
    );
  };

  const confirmRejectBusiness = (userId: string) => {
    confirmarAccion(
      'Rechazo de Licencia',
      '¿Deseas rechazar la solicitud y eliminar el documento?',
      () => rejectBusinessAccount(userId)
    );
  };

  const openLicensePdf = async (url: string) => {
    if (!url) {
      mostrarAlerta('Error', 'Sin documento valido');
      return;
    }
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    }
  };

  const selectUserForDetails = (userObject: any) => setSelectedUser(userObject);
  const closeUserDetails = () => setSelectedUser(null);
  
  const selectTabStats = () => { setAdminTab('stats'); setSelectedUser(null); };
  const selectTabRequests = () => { setAdminTab('requests'); setSelectedUser(null); };
  const selectTabUsers = () => { setAdminTab('users'); setSelectedUser(null); };

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace('/auth/login' as never);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={AuraColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.adminTopHeader}>
        <Text style={styles.adminTitle}>Inteligencia AURA</Text>
        <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={26} color={AuraColors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={adminTab === 'stats' ? styles.tabActive : styles.tabInactive} onPress={selectTabStats}>
          <Text style={adminTab === 'stats' ? styles.tabTextActive : styles.tabTextInactive}>Metricas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={adminTab === 'requests' ? styles.tabActive : styles.tabInactive} onPress={selectTabRequests}>
          <Text style={adminTab === 'requests' ? styles.tabTextActive : styles.tabTextInactive}>Solicitudes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={adminTab === 'users' ? styles.tabActive : styles.tabInactive} onPress={selectTabUsers}>
          <Text style={adminTab === 'users' ? styles.tabTextActive : styles.tabTextInactive}>Gestion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {adminTab === 'stats' && stats && (
          <View>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="people" size={28} color={AuraColors.primary} />
                <Text style={styles.statNumber}>{systemUsers.length}</Text>
                <Text style={styles.statLabel}>Usuarios Totales</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="calendar" size={28} color={AuraColors.primary} />
                <Text style={styles.statNumber}>{stats.avgAge}</Text>
                <Text style={styles.statLabel}>Edad Promedio</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Distribucion de Roles</Text>
              <PieChart
                data={getRoleChartData()}
                width={screenWidth - 80}
                height={160}
                chartConfig={{ color: () => '#000' }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="10"
                absolute
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Distribucion de Genero</Text>
              <PieChart
                data={getGenderChartData()}
                width={screenWidth - 80}
                height={160}
                chartConfig={{ color: () => '#000' }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="10"
                absolute
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Presencia por Zonas</Text>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>Zona</Text>
                <Text style={styles.tableCol2}>Negocios</Text>
              </View>
              {stats.zones.map((z: any, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.tableCol1Data}>{z.name}</Text>
                  <Text style={styles.tableCol2Data}>{z.count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {adminTab === 'requests' && (
          <View>
            {selectedUser ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.sectionTitle}>Validacion de Centro</Text>
                  <TouchableOpacity onPress={closeUserDetails}>
                    <Ionicons name="close-circle" size={28} color={AuraColors.accent} />
                  </TouchableOpacity>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={AuraColors.primary} />
                  <Text style={styles.infoText}>{selectedUser.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={AuraColors.primary} />
                  <Text style={styles.infoText}>{selectedUser.first_name} {selectedUser.last_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={AuraColors.primary} />
                  <Text style={styles.infoText}>{selectedUser.phone}</Text>
                </View>

                <TouchableOpacity style={styles.pdfButton} onPress={() => openLicensePdf(selectedUser.license_pdf_url)}>
                  <Ionicons name="document-text-outline" size={20} color={AuraColors.white} />
                  <Text style={styles.pdfButtonText}>Ver Documento PDF</Text>
                </TouchableOpacity>

                <View style={styles.actionRowContainer}>
                  <TouchableOpacity style={styles.approveActionBtn} onPress={() => confirmApproveBusiness(selectedUser.id)}>
                    <Ionicons name="checkmark-circle-outline" size={20} color={AuraColors.white} />
                    <Text style={styles.actionBtnText}>Aprobar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.rejectActionBtn} onPress={() => confirmRejectBusiness(selectedUser.id)}>
                    <Ionicons name="close-circle-outline" size={20} color={AuraColors.white} />
                    <Text style={styles.actionBtnText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Centros Pendientes</Text>
                {getPendingRequests().length === 0 ? (
                  <Text style={styles.emptyText}>No hay solicitudes pendientes</Text>
                ) : (
                  getPendingRequests().map((u: any) => (
                    <View key={u.id} style={styles.userRow}>
                      <TouchableOpacity onPress={() => selectUserForDetails(u)} style={styles.userDataArea}>
                        <Text style={styles.userEmailText}>{u.email}</Text>
                        <Text style={styles.userRoleBadge}>Esperando Aprobacion</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton} onPress={() => selectUserForDetails(u)}>
                        <Text style={styles.actionText}>Revisar</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {adminTab === 'users' && (
          <View>
            {selectedUser ? (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.sectionTitle}>Detalles de Cuenta</Text>
                  <TouchableOpacity onPress={closeUserDetails}>
                    <Ionicons name="close-circle" size={28} color={AuraColors.accent} />
                  </TouchableOpacity>
                </View>

                <View style={styles.detailHeader}>
                   {selectedUser.profile_picture ? (
                     <Image source={{ uri: selectedUser.profile_picture }} style={styles.avatarDetail} />
                   ) : (
                     <View style={styles.placeholderAvatarDetail}>
                       <Ionicons name="person" size={35} color={AuraColors.gold} />
                     </View>
                   )}
                </View>
                
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={AuraColors.primary} />
                  <Text style={styles.infoText}>{selectedUser.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={AuraColors.primary} />
                  <Text style={styles.infoText}>{selectedUser.first_name} {selectedUser.last_name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={AuraColors.primary} />
                  <Text style={styles.infoText}>{selectedUser.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={AuraColors.primary} />
                  <Text style={styles.infoText}>{selectedUser.role}</Text>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Directorio de Usuarios</Text>
                  {systemUsers.map((u: any) => (
                    <View key={u.id} style={styles.userRow}>
                      <TouchableOpacity onPress={() => selectUserForDetails(u)} style={styles.userDataArea}>
                        <Text style={styles.userEmailText}>{u.email}</Text>
                        <Text style={styles.userRoleBadge}>{u.role}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={u.is_active ? styles.statusButtonActive : styles.statusButtonInactive} 
                        onPress={() => confirmToggleUserStatus(u.id, u.is_active)}
                      >
                        <Text style={u.is_active ? styles.statusTextActive : styles.statusTextInactive}>
                          {u.is_active ? 'Activo' : 'Suspendido'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Registro de Eventos</Text>
                  {systemLogs.map((log: any, index: number) => (
                    <View key={index} style={styles.logRow}>
                      <View style={styles.logIconContainer}>
                        <Ionicons name="time-outline" size={18} color={AuraColors.gold} />
                      </View>
                      <View style={styles.logData}>
                        <Text style={styles.logEmail}>{log.email}</Text>
                        <Text style={styles.logActionText}>{log.action}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, backgroundColor: AuraColors.background },
  scrollContent: { padding: 20, paddingTop: 15, paddingBottom: 50 },
  adminTopHeader: { backgroundColor: AuraColors.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminTitle: { fontSize: 24, color: AuraColors.white, fontWeight: '800', letterSpacing: 1 },
  logoutIconBtn: { padding: 5 },
  tabContainer: { flexDirection: 'row', backgroundColor: AuraColors.white, elevation: 3 },
  tabActive: { flex: 1, paddingVertical: 15, borderBottomWidth: 3, borderBottomColor: AuraColors.primary, alignItems: 'center' },
  tabInactive: { flex: 1, paddingVertical: 15, borderBottomWidth: 3, borderBottomColor: 'transparent', alignItems: 'center' },
  tabTextActive: { color: AuraColors.primary, fontWeight: 'bold', fontSize: 13 },
  tabTextInactive: { color: AuraColors.accent, fontWeight: 'bold', fontSize: 13 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: AuraColors.white, width: '48%', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: AuraColors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  statNumber: { fontSize: 26, fontWeight: '900', color: AuraColors.primary, marginVertical: 8 },
  statLabel: { fontSize: 12, color: AuraColors.accent, fontWeight: '600' },
  card: { backgroundColor: AuraColors.white, borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: AuraColors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, color: AuraColors.primary, fontWeight: 'bold', marginBottom: 15 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: AuraColors.gold, paddingBottom: 10, marginBottom: 10 },
  tableCol1: { flex: 2, fontWeight: 'bold', color: AuraColors.primary },
  tableCol2: { flex: 1, fontWeight: 'bold', color: AuraColors.primary, textAlign: 'right' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tableCol1Data: { flex: 2, color: AuraColors.primary },
  tableCol2Data: { flex: 1, color: AuraColors.primary, textAlign: 'right', fontWeight: 'bold' },
  detailHeader: { alignItems: 'center', marginBottom: 25 },
  avatarDetail: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: AuraColors.gold },
  placeholderAvatarDetail: { width: 100, height: 100, borderRadius: 50, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: AuraColors.gold, borderStyle: 'dashed' },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  userDataArea: { flex: 1 },
  userEmailText: { fontSize: 15, color: AuraColors.primary, fontWeight: '600', marginBottom: 4 },
  userRoleBadge: { fontSize: 11, color: AuraColors.accent, textTransform: 'uppercase' },
  statusButtonActive: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusButtonInactive: { backgroundColor: '#FFEBEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusTextActive: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold' },
  statusTextInactive: { color: '#C62828', fontSize: 11, fontWeight: 'bold' },
  actionButton: { backgroundColor: AuraColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionText: { color: AuraColors.white, fontSize: 11, fontWeight: 'bold' },
  emptyText: { color: AuraColors.accent, textAlign: 'center', marginVertical: 20 },
  pdfButton: { backgroundColor: AuraColors.secondary, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  pdfButtonText: { color: AuraColors.white, fontWeight: 'bold', marginLeft: 10 },
  actionRowContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  approveActionBtn: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, marginRight: 5 },
  rejectActionBtn: { backgroundColor: '#C62828', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1, marginLeft: 5 },
  actionBtnText: { color: AuraColors.white, fontWeight: 'bold', marginLeft: 10 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  logIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logData: { flex: 1 },
  logEmail: { fontSize: 14, color: AuraColors.primary, fontWeight: 'bold', marginBottom: 3 },
  logActionText: { fontSize: 12, color: AuraColors.accent },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10 },
  infoText: { fontSize: 15, color: AuraColors.primary, marginLeft: 15, fontWeight: '500' },
  mainWrapper: { flex: 1, backgroundColor: AuraColors.background }
});