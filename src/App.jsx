import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

// Icono del marcador
const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Punto inicial
const defaultPosition = [-32.48, -58.23];

function App() {
  const [position, setPosition] = useState(null);
  const [path, setPath] = useState([]); // 🔵 historial del recorrido

  useEffect(() => {
    const starCountRef = ref(db, "vehiculo1");

    onValue(starCountRef, (snapshot) => {
      const data = snapshot.val();

      if (data && data.lat && data.lng) {
        const newPos = [data.lat, data.lng];

        setPosition(newPos);

        // Agregar al recorrido
        setPath((prevPath) => [...prevPath, newPos]);
      }
    });
  }, []);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <MapContainer
        center={position || defaultPosition}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 🔵 DIBUJO DEL RECORRIDO */}
        {path.length > 1 && (
          <Polyline positions={path} />
        )}

        {/* 🔴 MARCADOR */}
        {position && (
          <Marker position={position} icon={markerIcon}>
            <Popup>
              Última ubicación<br />
              Lat: {position[0]} <br />
              Lng: {position[1]}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default App;
