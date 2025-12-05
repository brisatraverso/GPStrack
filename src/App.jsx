import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";
import Historial from "./Historial";

// Material UI
import { Card, CardContent, Typography, Grid } from "@mui/material";

// ==== ICONO ====
const markerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const defaultPosition = [-32.48, -58.23];

// ==== RECALCULO DE DISTANCIA ====
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p = Math.PI / 180;

  const a =
    0.5 -
    Math.cos((lat2 - lat1) * p) / 2 +
    (Math.cos(lat1 * p) *
      Math.cos(lat2 * p) *
      (1 - Math.cos((lon2 - lon1) * p))) /
      2;

  return R * 2 * Math.asin(Math.sqrt(a)); // metros
}

// ==== FIX PARA CENTRAR ====
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center);
  }, [center]);
  return null;
}

function App() {
  const [tab, setTab] = useState("live"); // live | history
  const [position, setPosition] = useState(null);
  const [path, setPath] = useState([]);

  // Historial
  const [histPath, setHistPath] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  // Estadísticas
  const [totalDist, setTotalDist] = useState(0);
  const [velMax, setVelMax] = useState(0);
  const [velProm, setVelProm] = useState(0);

  // ========== MAPA EN VIVO ==========
  useEffect(() => {
    if (tab !== "live") return;

    const starCountRef = ref(db, "vehiculo1");

    onValue(starCountRef, (snapshot) => {
      const data = snapshot.val();

      if (data && data.lat && data.lng) {
        const newPos = [data.lat, data.lng];
        setPosition(newPos);
        setPath((prev) => [...prev, newPos]);
      }
    });
  }, [tab]);

  // ========== CARGAR HISTORIAL ==========
  const loadHistory = (fecha) => {
    setSelectedDate(fecha);
    setTab("history");

    const refFecha = ref(db, `historial/vehiculo1/${fecha}`);

    onValue(refFecha, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const puntos = Object.values(data);

      // Convertimos puntos en array [lat, lng]
      const coords = puntos.map((p) => [p.lat, p.lng]);
      setHistPath(coords);

      // ==== CALCULAR ESTADÍSTICAS ====
      let distancia = 0;
      let velocidades = [];

      for (let i = 1; i < puntos.length; i++) {
        const p1 = puntos[i - 1];
        const p2 = puntos[i];

        const d = haversine(p1.lat, p1.lng, p2.lat, p2.lng); // metros
        distancia += d;

        if (p1.timestamp && p2.timestamp) {
          const dt = (p2.timestamp - p1.timestamp) / 1000; // segundos
          if (dt > 0) velocidades.push((d / dt) * 3.6); // km/h
        }
      }

      setTotalDist(distancia / 1000); // km
      setVelMax(velocidades.length ? Math.max(...velocidades) : 0);
      setVelProm(
        velocidades.length
          ? velocidades.reduce((a, b) => a + b, 0) / velocidades.length
          : 0
      );
    });
  };

  return (
    <div style={{ height: "100vh", width: "100%", maxWidth: "100vw" }}>
      {/* PESTAÑAS */}
      <div style={{ display: "flex", background: "#154cb3ff", padding: 10 }}>
        <button onClick={() => setTab("live")}>En vivo</button>
        <button onClick={() => setTab("historial")}>Historial</button>
      </div>

      {/* === HISTORIAL (calendario) === */}
      {tab === "historial" && <Historial onSelectDate={loadHistory} />}

      {/* === DASHBOARD === */}
      {tab === "history" && (
        <Grid container spacing={2} style={{ padding: "1rem" }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Distancia total</Typography>
                <Typography variant="h4">{totalDist.toFixed(2)} km</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Velocidad máxima</Typography>
                <Typography variant="h4">
                  {velMax.toFixed(1)} km/h
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Velocidad promedio</Typography>
                <Typography variant="h4">
                  {velProm.toFixed(1)} km/h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* === MAPA === */}
      <MapContainer
        center={defaultPosition}
        zoom={15}
        style={{ height: "70%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* En vivo */}
        {tab === "live" && position && (
          <>
            <ChangeView center={position} />
            <Marker position={position} icon={markerIcon}>
              <Popup>En vivo</Popup>
            </Marker>

            {path.length > 1 && <Polyline positions={path} />}
          </>
        )}

        {/* Historial */}
        {tab === "history" && histPath.length > 1 && (
          <>
            <Polyline positions={histPath} />
            <Marker position={histPath[0]} icon={markerIcon}>
              <Popup>Inicio ({selectedDate})</Popup>
            </Marker>
          </>
        )}
      </MapContainer>
    </div>
  );
}

export default App;
