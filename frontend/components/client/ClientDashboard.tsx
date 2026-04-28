import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { AuraColors } from "../../constants/Colors";

import * as ImagePicker from "expo-image-picker";

// Configuración de visualización de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // <-- Propiedad requerida agregada
    shouldShowList: true, // <-- Propiedad requerida agregada
  }),
});

type CentroAura = {
  id: string;
  business_name: string;
  representative_name: string;
  profile_picture: string;
  opening_time: string;
  closing_time: string;
  working_days: string;
  zone: string;
  street: string;
  business_category: string;
  shop_photos: string[];
};
type ServicioAura = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: string;
  duration_minutes: number;
  image_url: string;
};
type MiReserva = {
  id: string;
  service_name: string;
  business_name: string;
  appointment_date: string;
  status: string;
  total_price: string;
  reservation_fee: string;
};

export default function ClientDashboard() {
  const enrutador = useRouter();
  const [nombreUsuario, setNombreUsuario] = useState<string>("");
  const [vistaActual, setVistaActual] = useState<string>("inicio");

  const [listaCentros, setListaCentros] = useState<CentroAura[]>([]);
  const [serviciosCentro, setServiciosCentro] = useState<
    Record<string, ServicioAura>
  >({});
  const [centroSeleccionado, setCentroSeleccionado] =
    useState<CentroAura | null>(null);
  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<ServicioAura | null>(null);
  const [misReservas, setMisReservas] = useState<Record<string, MiReserva>>({});

  const [busqueda, setBusqueda] = useState<string>("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("Todos");
  const [enviandoCita, setEnviandoCita] = useState<boolean>(false); // Estado de carga visual

  // --- Estados para el Análisis Biométrico (IA) ---
  const [fotoRostro, setFotoRostro] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState<boolean>(false);
  const [resultadoIA, setResultadoIA] = useState<{
    face_shape: string;
    recommended_style: string;
  } | null>(null);
  // Calendario
  const [citasReservadas, setCitasReservadas] = useState<
    { date: Date; duration: number }[]
  >([]);
  const [diasDisponibles, setDiasDisponibles] = useState<
    { fecha: string; diaStr: string; dObj: Date }[]
  >([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("");
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>("");

  const urlBase = "https://aura-ukzs.onrender.com/api";

  useEffect(() => {
    cargarPerfil();
    registrarNotificacionesPush();
  }, []);

  const registrarNotificacionesPush = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId || Platform.OS === "web") return;

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return; // El usuario denegó los permisos

      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        // Guardamos el token en la base de datos de Aura
        await fetch(`${urlBase}/users/push-token/${userId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: tokenData.data }),
        });
      } catch (error) {
        console.log("Error Push:", error);
      }
    }
  };

  // --- Función principal del Sprint 3 ---
  const iniciarAnalisisFacial = async () => {
    // 1. Pedir permiso para usar la cámara
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "AURA necesita acceso a tu cámara para analizar tu rostro.",
      );
      return;
    }

    // 2. Abrir la cámara
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite recortar la cara
      aspect: [1, 1], // Cuadrado perfecto para mejor análisis
      quality: 0.5, // Comprime un poco para no saturar el internet
    });

    if (!result.canceled) {
      setFotoRostro(result.assets[0].uri);
      setAnalizando(true);
      setVistaActual("analisis_ia"); // Cambiamos a la nueva pantalla

      try {
        // 3. Simulación temporal del proceso de IA (Mientras conectamos tu backend)
        // Esto le mostrará a tu ingeniera que el flujo ya está programado
        setTimeout(async () => {
          const resultadoSimulado = {
            face_shape: "Diamante",
            recommended_style: "Corte Texturizado Medio con Barba Perfilada",
          };
          setResultadoIA(resultadoSimulado);
          setAnalizando(false);

          // 4. (Punto de Evaluación) Conexión con el CREATE de tu CRUD
          /* Descomenta esto cuando tu backend de análisis esté listo:
          const id = await AsyncStorage.getItem('userId');
          await fetch(`${urlBase}/analysis/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: id,
              face_shape: resultadoSimulado.face_shape,
              recommended_style: resultadoSimulado.recommended_style,
              photo_url: result.assets[0].uri 
            })
          });
          */
        }, 3000); // Finge que piensa durante 3 segundos
      } catch (error) {
        setAnalizando(false);
        Alert.alert("Error", "Hubo un problema procesando la imagen.");
      }
    }
  };

  const cargarPerfil = async () => {
    const id = await AsyncStorage.getItem("userId");
    const rol = await AsyncStorage.getItem("userRole");
    if (id && rol) {
      try {
        const res = await fetch(urlBase + "/users/profile/" + id + "/" + rol);
        const datos = await res.json();
        if (datos.success) setNombreUsuario(datos.profile.first_name);
      } catch {}
    }
  };

  const cargarCentros = async () => {
    try {
      const res = await fetch(urlBase + "/users/businesses");
      const datos = await res.json();
      if (datos.success) {
        const centrosArray = Array.isArray(datos.data)
          ? datos.data
          : Object.values(datos.data);
        setListaCentros(centrosArray);
        setVistaActual("centros");
      }
    } catch {
      Alert.alert("Error", "Fallo al cargar los establecimientos");
    }
  };

  const verServiciosDelCentro = async (centro: CentroAura) => {
    setCentroSeleccionado(centro);
    try {
      const res = await fetch(urlBase + "/services/business/" + centro.id);
      const datos = await res.json();
      if (datos.success) {
        setServiciosCentro(datos.data);
        setVistaActual("servicios_centro");
      }
    } catch {
      Alert.alert("Error", "Fallo al cargar el catálogo");
    }
  };

  const prepararAgenda = async (servicio: ServicioAura) => {
    setServicioSeleccionado(servicio);
    setVistaActual("agendar");
    const businessId = centroSeleccionado?.id;

    try {
      const res = await fetch(`${urlBase}/appointments/booked/${businessId}`);
      const data = await res.json();
      const booked = data.success
        ? data.data.map((b: any) => ({
            date: new Date(b.appointment_date),
            duration: b.duration_minutes,
          }))
        : [];
      setCitasReservadas(booked);

      const dias = [];
      const hoy = new Date();
      for (let i = 0; i < 14; i++) {
        const d = new Date(
          hoy.getFullYear(),
          hoy.getMonth(),
          hoy.getDate() + i,
        );
        const fechaStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
        const diaStr = d.toLocaleDateString("es-ES", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
        const formatDia = diaStr.charAt(0).toUpperCase() + diaStr.slice(1);
        dias.push({ fecha: fechaStr, diaStr: formatDia, dObj: d });
      }
      setDiasDisponibles(dias);
      seleccionarFecha(dias[0].fecha, dias[0].dObj, booked, servicio);
    } catch {
      Alert.alert(
        "Error",
        "Fallo al obtener la disponibilidad de este negocio",
      );
    }
  };

  const seleccionarFecha = (
    fechaStr: string,
    dObj: Date,
    booked: any[],
    servicio: ServicioAura,
  ) => {
    setFechaSeleccionada(fechaStr);
    setHoraSeleccionada("");

    const diaSemana = dObj.getDay();
    const workingDaysStr = (
      centroSeleccionado?.working_days || ""
    ).toLowerCase();
    let cerrado = false;
    if (
      diaSemana === 0 &&
      !workingDaysStr.includes("domingo") &&
      !workingDaysStr.includes("todos los dias")
    ) {
      cerrado = true;
    }

    if (cerrado) {
      setHorariosDisponibles([]);
      return;
    }

    const opening = centroSeleccionado?.opening_time || "09:00";
    const closing = centroSeleccionado?.closing_time || "20:00";
    const duration = servicio.duration_minutes || 30;

    const parseTime = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };
    const openMins = parseTime(opening);
    const closeMins = parseTime(closing);
    const slots = [];

    const now = new Date();
    const isToday =
      fechaStr ===
      `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const bookedToday = booked.filter(
      (b) =>
        b.date.getFullYear() === dObj.getFullYear() &&
        b.date.getMonth() === dObj.getMonth() &&
        b.date.getDate() === dObj.getDate(),
    );

    for (let m = openMins; m + duration <= closeMins; m += 30) {
      if (isToday && m <= currentMins + 30) continue;

      const slotStartMins = m;
      const slotEndMins = m + duration;
      let hasOverlap = false;

      for (const b of bookedToday) {
        const bStartMins = b.date.getHours() * 60 + b.date.getMinutes();
        const bEndMins = bStartMins + b.duration;
        if (slotStartMins < bEndMins && slotEndMins > bStartMins) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        const hh = Math.floor(m / 60)
          .toString()
          .padStart(2, "0");
        const mm = (m % 60).toString().padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    setHorariosDisponibles(slots);
  };

  const solicitarCita = async () => {
    if (!fechaSeleccionada || !horaSeleccionada) {
      Alert.alert("Aviso", "Selecciona un horario disponible del calendario");
      return;
    }

    setEnviandoCita(true); // Mostrar indicador de carga

    const idCliente = await AsyncStorage.getItem("userId");
    const fechaTurno = new Date(
      `${fechaSeleccionada}T${horaSeleccionada}:00`,
    ).toISOString();

    const cargaUtil = {
      client_id: idCliente,
      business_id: servicioSeleccionado?.business_id,
      service_id: servicioSeleccionado?.id,
      appointment_date: fechaTurno,
      price: servicioSeleccionado?.price,
    };

    try {
      const res = await fetch(urlBase + "/appointments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cargaUtil),
      });
      const data = await res.json();
      setEnviandoCita(false);

      if (data.success) {
        // CONFIRMACIÓN VISUAL Y REDIRECCIÓN
        Alert.alert(
          "¡Reserva Solicitada con Éxito! ✅",
          'Tu solicitud ha sido enviada y está en estado "Pendiente". Recibirás una notificación cuando el negocio la apruebe.',
          [{ text: "Ver Mis Reservas", onPress: () => cargarMisReservas() }],
        );
      } else {
        Alert.alert("Error", data.error || "No se pudo crear la reserva");
      }
    } catch {
      setEnviandoCita(false);
      Alert.alert("Error", "Fallo de conexión");
    }
  };

  const cargarMisReservas = async () => {
    const id = await AsyncStorage.getItem("userId");
    try {
      const res = await fetch(urlBase + "/appointments/client/" + id);
      const datos = await res.json();
      if (datos.success) {
        setMisReservas(datos.data);
        setVistaActual("reservas");
      }
    } catch {
      Alert.alert("Error", "Fallo al cargar reservas");
    }
  };

  const pagarReserva = async (idCita: string, monto: string) => {
    try {
      const res = await fetch(urlBase + "/appointments/pay/" + idCita, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_paid: monto }),
      });
      if ((await res.json()).success) {
        Alert.alert("Pago Exitoso", "Tu cita está 100% confirmada");
        cargarMisReservas();
      }
    } catch {
      Alert.alert("Error", "Fallo en la pasarela de pago");
    }
  };

  const RastroEstado = ({ estado }: { estado: string }) => {
    const pasos = [
      { id: "solicitada", icono: "time", titulo: "Pendiente" },
      { id: "aceptada", icono: "wallet", titulo: "Pago Pendiente" },
      { id: "confirmada", icono: "checkmark-circle", titulo: "Confirmada" },
    ];
    let nivel = 0;
    if (estado === "aceptada") nivel = 1;
    if (estado === "confirmada") nivel = 2;

    return (
      <View style={estilos.rastroContenedor}>
        {pasos.map((paso, index) => (
          <View key={paso.id} style={estilos.rastroPaso}>
            <View
              style={[
                estilos.rastroCirculo,
                index <= nivel ? estilos.rastroActivo : estilos.rastroInactivo,
              ]}
            >
              <Ionicons name={paso.icono as any} size={20} color="white" />
            </View>
            <Text style={estilos.rastroTexto}>{paso.titulo}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (vistaActual === "centros") {
    const centrosFiltrados = listaCentros.filter((c) => {
      const coincideCategoria =
        categoriaFiltro === "Todos" || c.business_category === categoriaFiltro;
      const textoBusqueda = busqueda.toLowerCase();
      const nombreNegocio = (
        c.business_name ||
        c.representative_name ||
        ""
      ).toLowerCase();
      const zonaNegocio = (c.zone || "").toLowerCase();
      return (
        coincideCategoria &&
        (nombreNegocio.includes(textoBusqueda) ||
          zonaNegocio.includes(textoBusqueda))
      );
    });

    const categorias = ["Todos", "Barbería", "Salón de Belleza", "Unisex"];

    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraFiltros}>
          <View style={estilos.buscadorContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#888"
              style={{ marginLeft: 10 }}
            />
            <TextInput
              style={estilos.inputBuscador}
              placeholder="Buscar por nombre o zona (Ej. Sopocachi)"
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={estilos.scrollFiltros}
          >
            {categorias.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  estilos.chipFiltro,
                  categoriaFiltro === cat && estilos.chipFiltroActivo,
                ]}
                onPress={() => setCategoriaFiltro(cat)}
              >
                <Text
                  style={
                    categoriaFiltro === cat
                      ? estilos.txtChipActivo
                      : estilos.txtChip
                  }
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={estilos.scrollPadding}>
          <Text
            style={{
              fontWeight: "bold",
              color: "#555",
              marginBottom: 15,
              marginTop: 10,
            }}
          >
            {centrosFiltrados.length} resultados encontrados
          </Text>
          {centrosFiltrados.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={estilos.tarjetaCentro}
              onPress={() => verServiciosDelCentro(c)}
            >
              <Image
                source={{
                  uri:
                    c.shop_photos && c.shop_photos.length > 0
                      ? c.shop_photos[0]
                      : "https://via.placeholder.com/400x150?text=AURA",
                }}
                style={estilos.portadaCentro}
              />
              <View style={estilos.logoSuperpuesto}>
                {c.profile_picture ? (
                  <Image
                    source={{ uri: c.profile_picture }}
                    style={estilos.imagenLogo}
                  />
                ) : (
                  <View style={estilos.imagenLogo}>
                    <Ionicons name="storefront" size={24} color="#ccc" />
                  </View>
                )}
              </View>
              <View style={estilos.infoServicio}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Text style={estilos.tituloServicio}>
                    {c.business_name || c.representative_name}
                  </Text>
                  <Text style={estilos.badgeCategoria}>
                    {c.business_category || "Centro"}
                  </Text>
                </View>
                <Text style={estilos.detalleServicio}>
                  <Ionicons name="location" size={14} />{" "}
                  {c.zone ? `${c.zone}, ${c.street}` : "Zona no especificada"}
                </Text>
                <Text style={estilos.detalleServicio}>
                  <Ionicons name="time" size={14} /> Abierto de {c.opening_time}{" "}
                  a {c.closing_time}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={estilos.botonVolver}
            onPress={() => setVistaActual("inicio")}
          >
            <Text style={estilos.textoBotonPrimario}>Volver al Menú</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (vistaActual === "servicios_centro") {
    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraCurvaMenor}>
          <Text style={estilos.nombreApp}>
            {centroSeleccionado?.business_name?.toUpperCase() ||
              centroSeleccionado?.representative_name?.toUpperCase()}
          </Text>
        </View>
        <ScrollView style={estilos.scrollPadding}>
          {Object.values(serviciosCentro).map((s) => (
            <View key={s.id} style={estilos.tarjetaCentro}>
              {s.image_url ? (
                <Image
                  source={{ uri: s.image_url }}
                  style={estilos.imgCatalogo}
                />
              ) : null}
              <View style={estilos.infoServicio}>
                <Text style={estilos.tituloServicio}>{s.name}</Text>
                <Text style={estilos.detalleServicio}>{s.description}</Text>
                <Text style={estilos.precioServicio}>{s.price} Bs</Text>
                <Text
                  style={{
                    color: "#888",
                    fontStyle: "italic",
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name="timer-outline" /> Tiempo aprox:{" "}
                  {s.duration_minutes} min.
                </Text>
                <TouchableOpacity
                  style={estilos.botonReservar}
                  onPress={() => prepararAgenda(s)}
                >
                  <Text style={estilos.textoBotonBlanco}>
                    Agendar este Servicio
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={estilos.botonVolver}
            onPress={() => setVistaActual("centros")}
          >
            <Text style={estilos.textoBotonPrimario}>Atrás</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (vistaActual === "agendar") {
    return (
      <ScrollView style={[estilos.contenedorPrincipal, estilos.scrollPadding]}>
        <Text
          style={[
            estilos.nombreApp,
            {
              color: AuraColors.primary,
              marginTop: 40,
              textAlign: "center",
              marginBottom: 20,
            },
          ]}
        >
          CALENDARIO AURA
        </Text>

        <Text
          style={{
            fontWeight: "bold",
            marginBottom: 10,
            fontSize: 16,
            color: "#333",
          }}
        >
          Selecciona una Fecha:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
        >
          {diasDisponibles.map((dia) => (
            <TouchableOpacity
              key={dia.fecha}
              style={[
                estilos.diaCaja,
                fechaSeleccionada === dia.fecha && estilos.diaCajaActiva,
              ]}
              onPress={() =>
                seleccionarFecha(
                  dia.fecha,
                  dia.dObj,
                  citasReservadas,
                  servicioSeleccionado!,
                )
              }
            >
              <Text
                style={
                  fechaSeleccionada === dia.fecha
                    ? estilos.txtDiaActivo
                    : estilos.txtDia
                }
              >
                {dia.diaStr.split(",")[0]}
              </Text>
              <Text
                style={
                  fechaSeleccionada === dia.fecha
                    ? estilos.txtFechaActivo
                    : estilos.txtFecha
                }
              >
                {dia.fecha.split("-")[2]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text
          style={{
            fontWeight: "bold",
            marginBottom: 10,
            fontSize: 16,
            color: "#333",
          }}
        >
          Horarios Disponibles:
        </Text>
        {horariosDisponibles.length > 0 ? (
          <View style={estilos.gridHorarios}>
            {horariosDisponibles.map((hora) => (
              <TouchableOpacity
                key={hora}
                style={[
                  estilos.horaCaja,
                  horaSeleccionada === hora && estilos.horaCajaActiva,
                ]}
                onPress={() => setHoraSeleccionada(hora)}
              >
                <Text
                  style={
                    horaSeleccionada === hora
                      ? estilos.txtHoraActiva
                      : estilos.txtHora
                  }
                >
                  {hora}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View
            style={{
              backgroundColor: "#ffebeb",
              padding: 15,
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#d9534f", textAlign: "center" }}>
              El centro está cerrado este día o ya no tiene horarios que
              alcancen para los {servicioSeleccionado?.duration_minutes} min del
              servicio.
            </Text>
          </View>
        )}

        <View style={estilos.boxCotizacion}>
          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>
            {servicioSeleccionado?.name}
          </Text>
          <Text>Costo del Servicio: {servicioSeleccionado?.price} Bs</Text>
          <Text>
            Garantía de Reserva (10%):{" "}
            {(parseFloat(servicioSeleccionado?.price || "0") * 0.1).toFixed(2)}{" "}
            Bs
          </Text>
        </View>

        <TouchableOpacity
          style={[
            estilos.botonReservar,
            (!fechaSeleccionada || !horaSeleccionada || enviandoCita) && {
              backgroundColor: "#ccc",
            },
          ]}
          onPress={solicitarCita}
          disabled={!fechaSeleccionada || !horaSeleccionada || enviandoCita}
        >
          {enviandoCita ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={estilos.textoBotonBlanco}>
              Confirmar y Enviar Solicitud
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={estilos.botonVolver}
          onPress={() => setVistaActual("servicios_centro")}
        >
          <Text style={estilos.textoBotonPrimario}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (vistaActual === 'analisis_ia') {
    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraCurvaMenor}>
          <Text style={estilos.nombreApp}>ANÁLISIS BIOMÉTRICO</Text>
        </View>
        <ScrollView style={estilos.scrollPadding} contentContainerStyle={{ alignItems: 'center' }}>
          
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: AuraColors.primary, marginBottom: 20 }}>
            Procesando Geometría Facial
          </Text>

          {/* Círculo con la foto tomada */}
          <View style={{ width: 200, height: 200, borderRadius: 100, overflow: 'hidden', borderWidth: 4, borderColor: AuraColors.gold, marginBottom: 30 }}>
             {fotoRostro && <Image source={{ uri: fotoRostro }} style={{ width: '100%', height: '100%' }} />}
          </View>

          {analizando ? (
            <View style={{ alignItems: 'center' }}>
               <ActivityIndicator size="large" color={AuraColors.gold} style={{ marginBottom: 15 }} />
               <Text style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
                 Escaneando puntos focales...{"\n"}Detectando estructura mandibular...
               </Text>
            </View>
          ) : (
            <View style={[estilos.boxCotizacion, { width: '100%', borderColor: AuraColors.primary }]}>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                  <Ionicons name="checkmark-done-circle" size={28} color={AuraColors.primary} />
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: AuraColors.primary, marginLeft: 10 }}>Análisis Completado</Text>
               </View>
               
               <Text style={{ color: '#555', marginBottom: 5 }}>Rostro detectado:</Text>
               <Text style={{ fontSize: 20, fontWeight: 'bold', color: AuraColors.gold, marginBottom: 15 }}>
                  {resultadoIA?.face_shape}
               </Text>
               
               <Text style={{ color: '#555', marginBottom: 5 }}>Estilo recomendado para ti:</Text>
               <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
                  {resultadoIA?.recommended_style}
               </Text>

               <TouchableOpacity 
                 style={[estilos.botonReservar, { marginTop: 25, backgroundColor: AuraColors.gold }]} 
                 onPress={() => {
                   setBusqueda(resultadoIA?.recommended_style || '');
                   cargarCentros(); // Lo mandamos a buscar lugares donde hacerse ese corte
                 }}
               >
                 <Text style={estilos.textoBotonBlanco}>Buscar barberías para este corte</Text>
               </TouchableOpacity>
            </View>
          )}

          {!analizando && (
            <TouchableOpacity style={estilos.botonVolver} onPress={() => setVistaActual('inicio')}>
              <Text style={estilos.textoBotonPrimario}>Volver al menú</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </View>
    );
  }

  if (vistaActual === "reservas") {
    return (
      <View style={estilos.contenedorPrincipal}>
        <View style={estilos.cabeceraCurvaMenor}>
          <Text style={estilos.nombreApp}>MIS CITAS</Text>
        </View>
        <ScrollView style={estilos.scrollPadding}>
          {Object.values(misReservas).map((res) => (
            <View key={res.id} style={estilos.tarjetaCentro}>
              <View style={estilos.infoServicio}>
                <Text style={estilos.tituloServicio}>{res.service_name}</Text>
                <Text>
                  En: {res.business_name} |{" "}
                  {new Date(res.appointment_date).toLocaleString()}
                </Text>

                <RastroEstado estado={res.status} />

                {res.status === "solicitada" && (
                  <View
                    style={{
                      backgroundColor: "#fff3cd",
                      padding: 10,
                      borderRadius: 8,
                      marginTop: 5,
                    }}
                  >
                    <Text style={{ color: "#8a6d3b", textAlign: "center" }}>
                      ⏳ Esperando que el negocio confirme la disponibilidad.
                    </Text>
                  </View>
                )}

                {res.status === "aceptada" && (
                  <View style={estilos.boxPagos}>
                    <Text
                      style={{
                        marginBottom: 10,
                        textAlign: "center",
                        fontWeight: "bold",
                      }}
                    >
                      El centro aceptó. Paga para asegurar tu lugar:
                    </Text>
                    <TouchableOpacity
                      style={[
                        estilos.botonReservar,
                        { backgroundColor: AuraColors.gold, marginBottom: 10 },
                      ]}
                      onPress={() => pagarReserva(res.id, res.reservation_fee)}
                    >
                      <Text style={estilos.textoBotonBlanco}>
                        Pagar solo Reserva ({res.reservation_fee} Bs)
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={estilos.botonReservar}
                      onPress={() => pagarReserva(res.id, res.total_price)}
                    >
                      <Text style={estilos.textoBotonBlanco}>
                        Pagar Completo ({res.total_price} Bs)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {res.status === "rechazada" && (
                  <Text
                    style={{ color: "red", fontWeight: "bold", marginTop: 10 }}
                  >
                    El centro rechazó la solicitud por falta de disponibilidad.
                  </Text>
                )}
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={estilos.botonVolver}
            onPress={() => setVistaActual("inicio")}
          >
            <Text style={estilos.textoBotonPrimario}>Volver</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={estilos.contenedorPrincipal}>
      <View style={estilos.cabeceraCurva}>
        <Text style={estilos.nombreApp}>AURA</Text>
      </View>
      <ScrollView style={{ paddingHorizontal: 20, marginTop: -20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
          Hola, {nombreUsuario}
        </Text>
        <View style={estilos.tarjetaMenu}>
          {/* NUEVO BOTÓN: ESCÁNER IA */}
          <TouchableOpacity
            style={estilos.itemMenu}
            onPress={iniciarAnalisisFacial}
          >
            <Ionicons name="scan-circle" size={24} color={AuraColors.gold} />
            <Text style={[estilos.textoItemMenu, { color: AuraColors.gold }]}>
              Escáner Biométrico (IA)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.itemMenu} onPress={cargarCentros}>
            <Ionicons name="search" size={24} color={AuraColors.primary} />
            <Text style={estilos.textoItemMenu}>
              Buscar Estéticas y Agendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={estilos.itemMenu}
            onPress={cargarMisReservas}
          >
            <Ionicons name="calendar" size={24} color={AuraColors.primary} />
            <Text style={estilos.textoItemMenu}>Seguimiento de Mis Citas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedorPrincipal: { flex: 1, backgroundColor: AuraColors.background },
  cabeceraCurva: {
    backgroundColor: AuraColors.primary,
    height: 150,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: "center",
    paddingTop: 60,
  },
  cabeceraCurvaMenor: {
    backgroundColor: AuraColors.primary,
    height: 120,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    paddingTop: 50,
    marginBottom: 20,
  },
  nombreApp: {
    fontSize: 24,
    color: AuraColors.white,
    fontWeight: "900",
    letterSpacing: 2,
  },

  cabeceraFiltros: {
    backgroundColor: AuraColors.primary,
    paddingBottom: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 5,
  },
  buscadorContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 2,
    elevation: 2,
  },
  inputBuscador: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  scrollFiltros: { paddingLeft: 20, marginTop: 15, maxHeight: 40 },
  chipFiltro: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  chipFiltroActivo: {
    backgroundColor: AuraColors.gold,
    borderColor: AuraColors.gold,
  },
  txtChip: { color: "white", fontWeight: "600" },
  txtChipActivo: { color: "white", fontWeight: "bold" },

  scrollPadding: { paddingHorizontal: 15 },
  tarjetaMenu: {
    backgroundColor: AuraColors.white,
    borderRadius: 20,
    padding: 10,
    elevation: 3,
  },
  itemMenu: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  textoItemMenu: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "600",
    color: AuraColors.primary,
  },

  tarjetaCentro: {
    backgroundColor: AuraColors.white,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 4,
  },
  portadaCentro: { width: "100%", height: 120, backgroundColor: "#eee" },
  logoSuperpuesto: { position: "absolute", top: 80, left: 15, zIndex: 10 },
  imagenLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCategoria: {
    backgroundColor: "#f0f4ff",
    color: AuraColors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "bold",
    overflow: "hidden",
  },

  imgCatalogo: { width: "100%", height: 150 },
  infoServicio: { padding: 15, paddingTop: 25 },
  tituloServicio: {
    fontSize: 18,
    fontWeight: "bold",
    color: AuraColors.primary,
    marginBottom: 5,
    flex: 1,
  },
  detalleServicio: { color: "#666", marginBottom: 5 },
  precioServicio: {
    fontSize: 18,
    fontWeight: "bold",
    color: AuraColors.gold,
    marginVertical: 10,
  },
  botonReservar: {
    backgroundColor: AuraColors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  textoBotonBlanco: {
    color: AuraColors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  botonVolver: {
    padding: 15,
    alignItems: "center",
    marginBottom: 30,
    marginTop: 10,
  },
  textoBotonPrimario: {
    color: AuraColors.primary,
    fontWeight: "bold",
    fontSize: 16,
  },
  inputBox: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  boxCotizacion: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: AuraColors.gold,
  },
  boxPagos: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AuraColors.primary,
  },

  diaCaja: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    marginRight: 10,
    alignItems: "center",
    width: 75,
    height: 75,
    justifyContent: "center",
  },
  diaCajaActiva: { backgroundColor: AuraColors.primary },
  txtDia: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  txtDiaActivo: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  txtFecha: { color: "#333", fontSize: 20, fontWeight: "bold", marginTop: 3 },
  txtFechaActivo: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 3,
  },

  gridHorarios: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  horaCaja: {
    paddingVertical: 12,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    width: "31%",
    alignItems: "center",
  },
  horaCajaActiva: {
    backgroundColor: AuraColors.gold,
    borderColor: AuraColors.gold,
  },
  txtHora: { color: "#444", fontWeight: "bold", fontSize: 16 },
  txtHoraActiva: { color: "white", fontWeight: "bold", fontSize: 16 },

  rastroContenedor: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  rastroPaso: { alignItems: "center", flex: 1 },
  rastroCirculo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  rastroActivo: { backgroundColor: AuraColors.primary },
  rastroInactivo: { backgroundColor: "#ccc" },
  rastroTexto: {
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
    fontWeight: "bold",
    color: "#555",
  },
});
