"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

type Seat = {
  id: string;
  row: string;
  number: number;
  status: "available" | "selected" | "reserved" | "occupied";
};

interface Movie {
  id: number;
  title: string;
  posterurl: string;
  description: string;
  duration: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  screenings?: Screening[];
}

type Screening = {
  id: number;
  movieId: number;
  roomId: number;
  startTime: string;
  price: number;
};

type LayoutType = {
  rows: string[];
  columns: number[];
  seats: Record<string, Record<string, string>>;
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

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirige cuando el timer llega a 0
  useEffect(() => {
    if (timer === 0) {
      router.push(`/`);
    }
  }, [timer, router, movieId]);

  const handleSelectSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else if (selectedSeats.length < tickets) {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const formattedSeats = selectedSeats.map(seat => {
  return { 
    row: seat.charAt(0), 
    column: seat.slice(1) 
  };
});

const bookingData = {
  screeningId,
  roomId,
  seats: formattedSeats,  // envia como [{ row: "G", column: "8" }, { row: "F", column: "8" }]
  pricePerSeat: price > 0 ? price : 100,
  totalPrice: formattedSeats.length * (price > 0 ? price : 100),
};

console.log("Datos enviados al backend:", bookingData);


  const handleConfirmSelection = async () => {
    const token = localStorage.getItem("token");
    try {
      const bookingData = {
        screeningId,
        roomId,
        seats: selectedSeats.filter((seat) => seat),
        pricePerSeat: price,
        totalPrice: selectedSeats.length * price,
      };

      console.log("Datos de la reserva que se envían:", bookingData);


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

      // Reserva exitosa redirige a home
      router.push("/");
    } catch (error) {
      console.error("Error al crear la reserva", error);
      alert("Error al crear la reserva, intente nuevamente.");
    }
  };

  const getSeatClasses = (status: string, seatId: string): string => {
    let classes = "w-10 h-10 flex items-center justify-center text-sm rounded cursor-pointer border font-bold ";
    if (status === "occupied") {
      classes += "bg-red-500 text-white";
    } else if (status === "reserved") {
      classes += "bg-gray-400 text-white";
    } else if (selectedSeats.includes(seatId)) {
      classes += "bg-blue-500 text-white";
    } else {
      classes += "bg-white text-black";
    }
    return classes;
  };

  return (
    <>
      {/* Timer arriba */}
      <div className="w-full text-center text-3xl font-mono font-bold text-purple-700 mb-4">
        {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
      </div>
      <div className="p-4 bg-gray-100 min-h-screen">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 bg-white p-4 border rounded shadow">
            <h3 className="text-xl font-semibold text-center mb-4 text-black">
              Mapa de Asientos
            </h3>
            {loading && <p className="text-black">Cargando asientos...</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading &&
              layout &&
              layout.rows.map((row) => (
                <div
                  key={row}
                  className="grid grid-cols-11 gap-2 justify-center mb-2"
                >
                  {layout.columns.map((col) => {
                    const seatId = `${row?.toString()}${col?.toString()}`;
                    const seatStatus =
                      layout.seats[row]?.[col.toString()] || "available";
                    return (
                      <button
                        key={seatId}
                        className={getSeatClasses(seatStatus, seatId)}
                        onClick={() => handleSelectSeat(seatId)}
                        disabled={
                          seatStatus === "occupied" || seatStatus === "reserved"
                        }
                      >
                        <span className="text-black">{row}{col}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            {/* leyenda de colores */}
            <div className="mt-4 flex justify-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-red-500 rounded"></div>
                <span className="text-black">Ocupado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-white border border-black rounded"></div>
                <span className="text-black">Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span className="text-black">Seleccionado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <span className="text-black">En proceso</span>
              </div>
            </div>
            {/* seats seleccionados y monto total */}
            <div className="mt-6 text-center text-black">
              <div>
                <span className="font-semibold">Asientos seleccionados:</span>{" "}
                {selectedSeats.length > 0 ? selectedSeats.join(", ") : "Ninguno"}
              </div>
              <div className="mt-2">
                <span className="font-semibold">Monto total: </span>
                ${selectedSeats.length * price}
              </div>
            </div>
            <button
              className="btn btn-primary mt-6"
              onClick={handleConfirmSelection}
              disabled={selectedSeats.length === 0}
            >
              Confirmar selección
            </button>
          </div>
          <div className="w-full md:w-1/3 flex flex-row items-center gap-4">
            <Image
              src={imageUrl ?? ""}
              alt={movieName ?? "Poster"}
              width={200}
              height={300}
              className="rounded"
            />
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-black">{movieName}</h2>
              <p className="text-lg text-black">Horario: {schedule}</p>
              <p className="text-lg text-black">Sala: {roomName}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
