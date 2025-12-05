import { useEffect, useState } from "react";
import { db } from "./firebase";
import { ref, onValue } from "firebase/database";

// MUI
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

export default function Historial({ onSelectDate }) {
  const [fechas, setFechas] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const histRef = ref(db, "historial/vehiculo1");

    onValue(histRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const keys = Object.keys(data);
        setFechas(keys);
      } else {
        setFechas([]);
      }
    });
  }, []);

  // Convierte "2024-12-04" → dayjs
  const fechasValidas = fechas.map((f) => dayjs(f));

  const handleChange = (newValue) => {
    setSelected(newValue);

    if (!newValue) return;

    const fechaFormateada = newValue.format("YYYY-MM-DD");

    // Solo ejecutar si la fecha existe en Firebase
    if (fechas.includes(fechaFormateada)) {
      onSelectDate(fechaFormateada);
    }
  };

  return (
    <div style={{ padding: "1rem", background: "#f5f5f5" }}>
      <h3 style={{ marginBottom: "1rem" }}>Seleccioná una fecha</h3>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Historial del vehículo"
          value={selected}
          onChange={handleChange}
          format="YYYY-MM-DD"
          // Bloquea días sin historial
          shouldDisableDate={(date) => {
            return !fechasValidas.some((f) => f.isSame(date, "day"));
          }}
          slotProps={{
            textField: {
              fullWidth: true,
            },
          }}
        />
      </LocalizationProvider>

      {fechas.length === 0 && (
        <p style={{ marginTop: "1rem" }}>No hay historial guardado</p>
      )}
    </div>
  );
}
