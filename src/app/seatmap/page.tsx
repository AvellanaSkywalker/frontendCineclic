"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

type LayoutType = {
  rows: string[];
  columns: number[];
  seats: Record<string, Record<string, string | { state: string }>>; 
};

export default function SeatMap() {
  const searchParams = useSearchParams();
  const screeningId = searchParams.get("screeningId") ?? "0";
  const roomId = searchParams.get("roomId") ?? "0";
  const movieName = searchParams.get("movieName");
  const schedule = searchParams.get("schedule");
  const imageUrl = searchParams.get("imageUrl");
  const price = Number(searchParams.get("price")) || 0;
  const tickets = parseInt(searchParams.get("tickets") ?? "1");
  const movieId = searchParams.get("movieId");

  const roomName = `Sala ${roomId}`;
  const [layout, setLayout] = useState<LayoutType | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [timer, setTimer] = useState<number>(300);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // carga layout de la sala
  useEffect(() => {
    const fetchLayout = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `http://localhost:4000/api/rooms/${roomId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        if (!data.room.layout || !data.room.layout.seats) {
          throw new Error("El layout de la sala no tiene la estructura esperada.");
        }
        const layoutData: LayoutType = {
          rows: data.room.layout.rows,
          columns: data.room.layout.columns.slice(0, 11),
          seats: data.room.layout.seats,
        };
        setLayout(layoutData);
      } catch (err) {
        console.error("Error fetching layout:", err);
        setError("No se pudo cargar el layout de la sala.");
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [roomId, screeningId]);

  // timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (timer === 0) {
      router.push(`/`);
    }
  }, [timer, router, movieId]);

  // func para normalizar el asiento
  const getSeatStatus = (seatValue: string | { state: string } | undefined): string => {
    if (seatValue && typeof seatValue === "object" && "state" in seatValue) {
      return seatValue.state;
    }
    return (seatValue as string) || "available";
  };

  // manejo de seleccion de asientos
  const handleSelectSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else if (selectedSeats.length < tickets) {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Confirma selecc 
  const handleConfirmSelection = async () => {
    const token = localStorage.getItem("token");
    const formattedSeats = selectedSeats.map((seat) => ({
      row: seat.charAt(0),
      column: seat.slice(1),
    }));
    const bookingData = {
      screeningId,
      roomId,
      seats: formattedSeats,
      pricePerSeat: price > 0 ? price : 100,
      totalPrice: formattedSeats.length * (price > 0 ? price : 100),
    };
    console.log("Datos de la reserva que se envían:", bookingData);
    try {
      const response = await fetch("http://localhost:4000/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });
      if (!response.ok) {
        throw new Error(`Booking error: ${response.status}`);
      }
      router.push("/");
    } catch (error) {
      console.error("Error al crear la reserva", error);
      alert("Error al crear la reserva, intente nuevamente.");
    }
  };

  // para los asientos 
  const getSeatClasses = (status: string, seatId: string): string => {
    let classes =
      "w-10 h-10 border rounded cursor-pointer transition-colors "; 
    if (status === "occupied") {
      classes += "bg-red-500 ";
    } else if (status === "selected") {
      classes += "bg-red-500 ";
    } else if (status === "reserved") {
      classes += "bg-gray-400 ";
    } else if (selectedSeats.includes(seatId)) {
      classes += "bg-blue-500 ";
    } else {
      classes += "bg-white ";
    }
    return classes;
  };

return (
  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-gray-100">
    {/* Header  */}
    <header className="bg-purple-700 py-4">
      <div className="max-w-7xl mx-auto px-8">
        <h1 className="font-black text-3xl text-white">CineClic</h1>
      </div>
    </header>

    {/* boton INICIO  */}
    <div className="max-w-7xl mx-auto px-8 py-4">
      <button
        onClick={() => router.push("/")}
        className="bg-pink-500 text-white px-5 py-2 rounded-full text-sm transition-colors hover:bg-violet-400"
      >
        INICIO
      </button>
    </div>

    {/* Timer centrado */}
    <div className="my-6 text-center text-3xl font-mono font-bold text-purple-700">
      {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
    </div>

    {/* Contenedor principl */}
    <div className="max-w-7xl mx-auto px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-gray-100 min-h-screen space-y-16">
      <div className="flex flex-col lg:flex-row gap-20">
        
        {/* Mapa de Asientos */}
        <div className="flex-1 bg-white p-8 border rounded-4xl shadow ">
          {/* PANTALLA */}
          <div className="mb-12 text-center">
            <div className="w-full border-b-2 border-gray-300  bg-violet-200 pb-3 text-2xl font-semibold text-black">
              PANTALLA
            </div>
          </div>

          {!loading && layout && (
            <div className="flex flex-col ">
              {/* grid de asientos con etiquetas a la derecha */}
              {layout.rows.map((row) => (
                <div key={row} className="flex items-center gap-6 mb-4">
                  <div className="grid grid-cols-11 gap-6">
                    {layout.columns.map((col) => {
                      const seatId = `${row}${col}`;
                      const rawSeat = layout.seats[row]?.[col.toString()];
                      const seatStatus = getSeatStatus(rawSeat);
                      return (
                        <button
                          key={seatId}
                          className={`${getSeatClasses(seatStatus, seatId)} w-10 h-10 mx-auto`}
                          onClick={() => handleSelectSeat(seatId)}
                          disabled={seatStatus === "occupied" || seatStatus === "reserved"}
                        />
                      );
                    })}
                  </div>
                  {/* fila alineada a la derecha */}
                  <div className="w-6 text-center text-sm font-bold text-black">{row}</div>
                </div>
              ))}
              
              {/* etiqueta de columnas alineadas debajo de los asientos */}
              <div className="flex justify-center gap-6 mt-4">
                {layout.columns.map((col) => (
                  <div key={col} className="w-10 text-center text-xs font-bold text-black">
                    {col}
                  </div>
                ))}
              </div>
            </div>
          )}

      
          <div className="mt-16 grid grid-cols-4 gap-6"> 
            {[
              { color: "bg-red-500", label: "Ocupado" },
              { color: "bg-white border border-black", label: "Disponible" },
              { color: "bg-blue-500", label: "Seleccionado" },
              { color: "bg-gray-400", label: "En proceso" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-center gap-3">
                <div className={`w-6 h-6 rounded ${item.color}`}></div>
                <span className="text-black text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* contenedor de info pelicula */}
        <div className="w-full lg:w-[400px] flex flex-col gap-10">
          <div className="bg-white p-8 border rounded-4xl shadow-md h-full">
            <div className="flex flex-col gap-8">
              <div className="flex gap-6">
                <Image
                  src={imageUrl ?? ""}
                  alt={movieName ?? "Poster"}
                  width={160}
                  height={240}
                  className="rounded-lg flex-shrink-0"
                />
                <div className="flex flex-col gap-3">
                  <h2 className="text-2xl font-bold text-black break-words">{movieName}</h2>
                  <p className="text-lg text-black">Horario: {new Date(schedule ?? "").toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                  <p className="text-lg text-black">Sala: {roomName}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-8">
                <div className="mb-8">
                  <div className="text-lg font-semibold text-black mb-2">Asientos seleccionados:</div>
                  <div className="text-base text-purple-700">
                    {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Ninguno"}
                  </div>
                </div>
                <div className="mb-8">
                  <div className="text-lg font-semibold text-black mb-2">Monto total:</div>
                  <div className="text-2xl font-bold text-purple-700">
                    ${selectedSeats.length * price}
                  </div>
                </div>
                <button
                  className="w-full bg-pink-500 text-white py-3 rounded-full text-base font-medium transition-colors hover:bg-purple-400"
                  onClick={handleConfirmSelection}
                  disabled={selectedSeats.length === 0}
                >
                  Confirmar selección
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {error && (
      <div className="text-red-600 text-center my-4">
        {error}
      </div>
    )}
  </div>
);

}
