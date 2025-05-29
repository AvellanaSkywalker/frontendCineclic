"use client";

import { useState, useEffect } from "react";

type Seat = {
  id: string;
  row: string;
  number: number;
  status: "available" | "selected" | "reserved" | "occupied";
};

export default function SeatSelection() {

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [timer, setTimer] = useState(300); // 5 minutos en segundos

  useEffect(() => {

    const fetchSeatsData = async () => {
        setLoading(true);
        try{  
    // Simulación de carga de asientos desde API
            const initialSeats = await fetch (`http://localhost:4000/api/bookings`);
            setSeats(initialSeats);

    // Temporizador de reserva
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else if (selectedSeats.length < 5) {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleConfirmSelection = () => {
    // Aquí iría la lógica para generar la reserva y enviar correo de confirmación
    console.log("Asientos confirmados:", selectedSeats);
  };

  return (
    <div className="seat-selection">
      <h2>Selecciona tus asientos</h2>
      <div className="timer">Tiempo restante: {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}</div>
      <div className="seats-grid">
        {seats.map((seat) => (
          <button
            key={seat.id}
            className={`seat ${seat.status} ${selectedSeats.includes(seat.id) ? "selected" : ""}`}
            onClick={() => handleSelectSeat(seat.id)}
            disabled={seat.status === "occupied"}
          >
            {seat.row}{seat.number}
          </button>
        ))}
      </div>
      <div className="summary">
        <p>Asientos seleccionados: {selectedSeats.join(", ")}</p>
        <p>Total a pagar: ${selectedSeats.length * 100}</p>
        <button onClick={handleConfirmSelection} disabled={selectedSeats.length === 0}>Confirmar</button>
      </div>
    </div>
  );
};

// Simula la generación de asientos
const generateSeats = (): Seat[] => {
  const rows = ["A", "B", "C", "D", "E", "F", "G"];
  const seats = [];

  rows.forEach((row) => {
    for (let i = 1; i <= 13; i++) {
      seats.push({
        id: `${row}${i}`,
        row,
        number: i,
        status: Math.random() > 0.8 ? "occupied" : "available",
      });
    }
  });

  return seats;

}
