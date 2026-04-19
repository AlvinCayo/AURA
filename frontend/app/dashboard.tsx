import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform, ScrollView, TextInput, Alert, Dimensions, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { AuraColors } from '../constants/Colors';

export default function DashboardScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  const { 0: userName, 1: setUserName } = useState<string>('');
  const { 0: userLastName, 1: setUserLastName } = useState<string>('');
  const { 0: userPhone, 1: setUserPhone } = useState<string>('');
  const { 0: userPhoto, 1: setUserPhoto } = useState<string>('');
  const { 0: userRole, 1: setUserRole } = useState<string>('');
  
  const { 0: isApproved, 1: setIsApproved } = useState<boolean>(true);
  const { 0: userLicenseUrl, 1: setUserLicenseUrl } = useState<string>('');
  
  const { 0: loading, 1: setLoading } = useState<boolean>(true);
  const { 0: isEditing, 1: setIsEditing } = useState<boolean>(false);
  
  const { 0: systemUsers, 1: setSystemUsers } = useState<any>(new Array());
  const { 0: systemLogs, 1: setSystemLogs } = useState<any>(new Array());
  const { 0: selectedUser, 1: setSelectedUser } = useState<any>(null);
  const { 0: adminTab, 1: setAdminTab } = useState<string>('stats');
  const { 0: stats, 1: setStats } = useState<any>(null);

  useEffect(() => {
    loadData();
  }, new Array());

  const mostrarAlerta = (titulo: string, mensaje: string) => {
    if (Platform.OS === 'web') {
      window.alert(titulo + ' - ' + mensaje);
    } else {
      Alert.alert(titulo, mensaje);
    }
  };

  const confirmarAccion = (titulo: string, mensaje: string, onConfirm: () => void) => {
    if (Platform.OS === 'web') {
      const confirmacionWeb = window.confirm(titulo + ' - ' + mensaje + '\n\n¿Deseas continuar?');
      if (confirmacionWeb) {
        onConfirm();
      }
    } else {
      Alert.alert(
        titulo,
        mensaje,
        new Array(
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar Accion', onPress: onConfirm }
        )
      );
    }
  };

  const loadData = async () => {
    try {
      const id = await AsyncStorage.getItem('userId');
      const role = await AsyncStorage.getItem('userRole');
      if (id && role) {
        setUserRole(role);
        
        if (role === 'administrador') {
          const resUsers = await fetch('http://localhost:3000/api/admin/users');
          const dataUsers = await resUsers.json();
          if (dataUsers.success) setSystemUsers(dataUsers.users);
          
          const resLogs = await fetch('http://localhost:3000/api/admin/logs');
          const dataLogs = await resLogs.json();
          if (dataLogs.success) setSystemLogs(dataLogs.logs);

          const resStats = await fetch('http://localhost:3000/api/admin/stats');
          const dataStats = await resStats.json();
          if (dataStats.success) setStats(dataStats);

        } else {
          const response = await fetch('http://localhost:3000/api/users/profile/' + id + '/' + role);
          const data = await response.json();
          if (data.success) {
            const { profile } = data;
            const isBusiness = role === 'centro';
            setUserName(isBusiness ? profile.representative_name : profile.first_name);
            setUserLastName(isBusiness ? profile.representative_last_name : profile.last_name);
            setUserPhone(profile.phone);
            if (profile.profile_picture) {
              setUserPhoto(profile.profile_picture);
            }
            if (isBusiness) {
              setIsApproved(profile.is_approved);
              setUserLicenseUrl(profile.license_pdf_url);
            }
          }
        }
      }
    } catch (error) {
      mostrarAlerta('Error', 'Fallo de red al cargar informacion');
    } finally {
      setLoading(false);
    }
  };

  const getRoleChartData = () => {
    const pieData = new Array();
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
    const pieData = new Array();
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
    const pending = new Array();
    for (let i = 0; i < systemUsers.length; i++) {
      const user = systemUsers[i];
      if (user.role === 'centro' && user.is_approved === false) {
        pending.push(user);
      }
    }
    return pending;
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.1,
      aspect: new Array(1, 1) as any,
      allowsEditing: true
    });

    if (!result.canceled) {
      const { assets } = result;
      const { 0: image } = assets;
      const id = await AsyncStorage.getItem('userId');
      const role = await AsyncStorage.getItem('userRole');

      const uploadToDatabase = async (photoData: string) => {
        const payload = { role, photoUrl: photoData };
        const requestOptions = {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        };
        try {
          const response = await fetch('http://localhost:3000/api/users/profile/photo/' + id, requestOptions);
          const data = await response.json();
          if (data.success) {
            setUserPhoto(photoData);
          }
        } catch (error) {
          mostrarAlerta('Error', 'Fallo al subir imagen');
        }
      };

      if (Platform.OS === 'web') {
        const localResponse = await fetch(image.uri);
        const blob = await localResponse.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const resultText = reader.result as string;
          uploadToDatabase(resultText);
        };
        reader.readAsDataURL(blob);
      } else {
        const base64Data = 'data:image/jpeg;base64,' + image.base64;
        uploadToDatabase(base64Data);
      }
    }
  };

  const pickNewLicense = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (!result.canceled) {
        const { assets } = result;
        const { 0: firstFile } = assets;
        
        const id = await AsyncStorage.getItem('userId');
        const payload = { licenseUrl: firstFile.uri };
        const requestOptions = {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        };

        const response = await fetch('http://localhost:3000/api/users/profile/license/' + id, requestOptions);
        const data = await response.json();
        
        if (data.success) {
          mostrarAlerta('Exito', 'El documento se envio al administrador para su revision');
          loadData();
        }
      }
    } catch (error) {
      mostrarAlerta('Error', 'No se pudo seleccionar o enviar el documento');
    }
  };

  const handleUpdate = async () => {
    const id = await AsyncStorage.getItem('userId');
    const payload = { role: userRole, firstName: userName, lastName: userLastName, phone: userPhone };
    const requestOptions = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    };

    try {
      const response = await fetch('http://localhost:3000/api/users/profile/update/' + id, requestOptions);
      const data = await response.json();

      if (data.success) {
        mostrarAlerta('Exito', 'Perfil actualizado exitosamente');
        setIsEditing(false);
      }
    } catch (error) {
      mostrarAlerta('Error', 'Fallo de comunicacion');
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const requestOptions = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentStatus })
    };
    try {
      const response = await fetch('http://localhost:3000/api/admin/status/' + userId, requestOptions);
      const data = await response.json();
      if (data.success) {
        loadData();
      }
    } catch (error) {
      mostrarAlerta('Error', 'No se pudo cambiar el estado del usuario');
    }
  };

  const confirmToggleUserStatus = (userId: string, currentStatus: boolean) => {
    const accion = currentStatus ? 'DESHABILITAR' : 'HABILITAR';
    confirmarAccion(
      'Confirmacion de Seguridad',
      '¿Estas completamente seguro de ' + accion + ' a este usuario en el sistema?',
      () => toggleUserStatus(userId, currentStatus)
    );
  };

  const approveBusinessAccount = async (userId: string) => {
    const requestOptions = { method: 'PUT' };
    try {
      const response = await fetch('http://localhost:3000/api/admin/approve/' + userId, requestOptions);
      const data = await response.json();
      if (data.success) {
        mostrarAlerta('Exito', 'Centro de estetica aprobado correctamente');
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
      const response = await fetch('http://localhost:3000/api/admin/reject/' + userId, requestOptions);
      const data = await response.json();
      if (data.success) {
        mostrarAlerta('Exito', 'Se rechazo la solicitud de este centro de estetica');
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
      'Al aprobar este negocio tendra acceso total a la plataforma AURA. ¿Confirmas que su licencia es veridica?',
      () => approveBusinessAccount(userId)
    );
  };

  const confirmRejectBusiness = (userId: string) => {
    confirmarAccion(
      'Rechazo de Licencia',
      'El documento presentado se eliminara y el usuario debera cargar uno nuevo. ¿Deseas rechazar la solicitud?',
      () => rejectBusinessAccount(userId)
    );
  };

  const openLicensePdf = async (url: string) => {
    if (!url) {
      mostrarAlerta('Error', 'El usuario no proporciono un documento valido');
      return;
    }
    if (Platform.OS === 'web') {
      try {
        const win = window.open();
        if (win) {
          const iframeHtml = '<iframe src="' + url + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>';
          win.document.write(iframeHtml);
        } else {
          window.open(url, '_blank');
        }
      } catch (error) {
        mostrarAlerta('Error', 'Tu navegador bloqueo la apertura del documento de licencia');
      }
    } else {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        mostrarAlerta('Error', 'No tienes una aplicacion compatible instalada para leer este documento');
      }
    }
  };

  const toggleEditing = () => setIsEditing(!isEditing);
  const selectUserForDetails = (userObject: any) => setSelectedUser(userObject);
  const closeUserDetails = () => setSelectedUser(null);
  
  const selectTabStats = () => {
    setAdminTab('stats');
    setSelectedUser(null);
  };
  const selectTabRequests = () => {
    setAdminTab('requests');
    setSelectedUser(null);
  };
  const selectTabUsers = () => {
    setAdminTab('users');
    setSelectedUser(null);
  };

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

  if (userRole === 'administrador') {
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
                  <Text style={styles.tableCol1}>Zona de Operacion</Text>
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
                    <Text style={styles.pdfButtonText}>Ver Documento PDF Completo</Text>
                  </TouchableOpacity>

                  <View style={styles.actionRowContainer}>
                    <TouchableOpacity style={styles.approveActionBtn} onPress={() => confirmApproveBusiness(selectedUser.id)}>
                      <Ionicons name="checkmark-circle-outline" size={20} color={AuraColors.white} />
                      <Text style={styles.approveActionText}>Aprobar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.rejectActionBtn} onPress={() => confirmRejectBusiness(selectedUser.id)}>
                      <Ionicons name="close-circle-outline" size={20} color={AuraColors.white} />
                      <Text style={styles.approveActionText}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Centros Pendientes</Text>
                  {getPendingRequests().length === 0 ? (
                    <Text style={styles.emptyText}>No hay solicitudes pendientes en este momento</Text>
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

  if (userRole === 'centro' && isApproved === false) {
    return (
      <View style={styles.mainWrapper}>
        <View style={styles.curvedHeader}>
          <Text style={styles.appName}>AURA</Text>
        </View>
        <ScrollView style={styles.profileContainer} contentContainerStyle={styles.profileContent}>
          <View style={styles.restrictedCard}>
            <Ionicons name="lock-closed" size={60} color={AuraColors.gold} style={styles.lockIcon} />
            <Text style={styles.restrictedTitle}>Acceso Restringido</Text>
            
            {userLicenseUrl ? (
              <View>
                <Text style={styles.restrictedText}>Tu cuenta se encuentra en proceso de validacion. El equipo de administracion esta revisando tu licencia de funcionamiento.</Text>
                <Text style={styles.restrictedSubText}>Te habilitaremos el acceso total pronto.</Text>
              </View>
            ) : (
              <View>
                <Text style={styles.restrictedText}>Tu licencia de funcionamiento fue rechazada o no se subio correctamente durante el registro.</Text>
                <Text style={styles.restrictedSubText}>Debes cargar un documento PDF valido para solicitar la aprobacion.</Text>
                <TouchableOpacity style={styles.uploadNewBtn} onPress={pickNewLicense}>
                  <Ionicons name="cloud-upload-outline" size={20} color={AuraColors.white} />
                  <Text style={styles.uploadNewText}>Subir Nueva Licencia</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.logoutAction} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={AuraColors.white} />
              <Text style={styles.logoutActionText}>Salir del Sistema</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.mainWrapper}>
      <View style={styles.curvedHeader}>
        <Text style={styles.appName}>AURA</Text>
      </View>

      <ScrollView style={styles.profileContainer} contentContainerStyle={styles.profileContent}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {userPhoto ? (
              <Image source={{ uri: userPhoto }} style={styles.mainAvatar} />
            ) : (
              <View style={styles.placeholderMainAvatar}>
                <Ionicons name="camera-outline" size={40} color={AuraColors.gold} />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="pencil" size={16} color={AuraColors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userNameText}>{userName} {userLastName}</Text>
          <Text style={styles.userRoleText}>{userRole}</Text>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={toggleEditing}>
            <View style={styles.menuIconBg}>
              <Ionicons name="person-outline" size={20} color={AuraColors.primary} />
            </View>
            <Text style={styles.menuItemText}>{isEditing ? 'Cancelar Edicion' : 'Editar Datos Personales'}</Text>
            <Ionicons name={isEditing ? 'close' : 'chevron-forward'} size={20} color={AuraColors.gold} />
          </TouchableOpacity>

          {isEditing && (
            <View style={styles.editFormContainer}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-circle-outline" size={20} color={AuraColors.primary} style={styles.icon} />
                <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Nombres" />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="person-circle-outline" size={20} color={AuraColors.primary} style={styles.icon} />
                <TextInput style={styles.input} value={userLastName} onChangeText={setUserLastName} placeholder="Apellidos" />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={AuraColors.primary} style={styles.icon} />
                <TextInput style={styles.input} value={userPhone} onChangeText={setUserPhone} placeholder="Telefono" keyboardType="phone-pad" />
              </View>
              
              <TouchableOpacity style={styles.saveAction} onPress={handleUpdate}>
                <Text style={styles.saveActionText}>GUARDAR INFORMACION</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isEditing && (
            <View style={styles.contactInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={AuraColors.primary} />
                <Text style={styles.infoText}>{userPhone}</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutAction} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={AuraColors.white} />
          <Text style={styles.logoutActionText}>Cerrar Sesion Segura</Text>
        </TouchableOpacity>
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
  approveActionText: { color: AuraColors.white, fontWeight: 'bold', marginLeft: 10 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  logIconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  logData: { flex: 1 },
  logEmail: { fontSize: 14, color: AuraColors.primary, fontWeight: 'bold', marginBottom: 3 },
  logActionText: { fontSize: 12, color: AuraColors.accent },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, paddingHorizontal: 10 },
  infoText: { fontSize: 15, color: AuraColors.primary, marginLeft: 15, fontWeight: '500' },
  mainWrapper: { flex: 1, backgroundColor: AuraColors.background },
  curvedHeader: { backgroundColor: AuraColors.primary, height: 180, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, alignItems: 'center', paddingTop: 60 },
  appName: { fontSize: 24, color: AuraColors.white, fontWeight: '900', letterSpacing: 2 },
  profileContainer: { flex: 1, marginTop: -60 },
  profileContent: { paddingHorizontal: 25, paddingBottom: 50 },
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  mainAvatar: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, borderColor: AuraColors.white },
  placeholderMainAvatar: { width: 130, height: 130, borderRadius: 65, backgroundColor: AuraColors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: AuraColors.gold },
  editIconBadge: { position: 'absolute', bottom: 0, right: 10, backgroundColor: AuraColors.secondary, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: AuraColors.white },
  userNameText: { fontSize: 24, color: AuraColors.primary, fontWeight: 'bold' },
  userRoleText: { fontSize: 13, color: AuraColors.accent, textTransform: 'uppercase', marginTop: 5, letterSpacing: 1 },
  menuCard: { backgroundColor: AuraColors.white, borderRadius: 20, padding: 10, shadowColor: AuraColors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginBottom: 25 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  menuIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: AuraColors.background, justifyContent: 'center', alignItems: 'center' },
  menuItemText: { flex: 1, marginLeft: 15, fontSize: 15, fontWeight: '600', color: AuraColors.primary },
  editFormContainer: { padding: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: AuraColors.background, borderWidth: 1, borderColor: AuraColors.gold, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 50 },
  icon: { marginRight: 10 },
  input: { flex: 1, color: AuraColors.primary, fontSize: 15 },
  saveAction: { backgroundColor: AuraColors.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveActionText: { color: AuraColors.white, fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  contactInfo: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  logoutAction: { flexDirection: 'row', backgroundColor: AuraColors.secondary, padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: AuraColors.secondary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginTop: 15 },
  logoutActionText: { color: AuraColors.white, fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  restrictedCard: { backgroundColor: AuraColors.white, borderRadius: 20, padding: 30, alignItems: 'center', shadowColor: AuraColors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginTop: 20 },
  lockIcon: { marginBottom: 20 },
  restrictedTitle: { fontSize: 22, color: AuraColors.primary, fontWeight: 'bold', marginBottom: 15 },
  restrictedText: { fontSize: 15, color: AuraColors.primary, textAlign: 'center', lineHeight: 22, marginBottom: 10 },
  restrictedSubText: { fontSize: 14, color: AuraColors.accent, textAlign: 'center', fontWeight: 'bold', marginBottom: 25 },
  uploadNewBtn: { backgroundColor: AuraColors.primary, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 20 },
  uploadNewText: { color: AuraColors.white, fontSize: 15, fontWeight: 'bold', marginLeft: 10 }
});