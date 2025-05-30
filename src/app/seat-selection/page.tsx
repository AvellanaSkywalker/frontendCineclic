"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SeatSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extrae los paramet dinamicos de la URL
  const screeningId = searchParams.get("screeningId");
  const roomId = searchParams.get("roomId");
  const movieName = searchParams.get("movieName");
  const imageUrl = searchParams.get("imageUrl");
  const schedule = searchParams.get("schedule");
  const price = searchParams.get("price")

  const [selectedTickets, setSelectedTickets] = useState(1);

  const handleConfirm = () => {
    // Verifica que se hayan recibido los parms necesarios
    if (!screeningId || !roomId || !movieName || !imageUrl || !schedule) {
      alert("Información incompleta: falta el screening o la sala.");
      return;
    }
    // Redirige a la pantalla del seatmap con los param din
    router.push(`/seatmap?screeningId=${screeningId}&roomId=${roomId}&movieName=${encodeURIComponent(movieName!)}&schedule=${schedule}&imageUrl=${encodeURIComponent(imageUrl)}&price=${price}&tickets=${selectedTickets}`);

  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gray-100">
      {/* Bot de cierre */}
      <button
        className="absolute top-4 right-4 bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-gray-900 hover:bg-gray-400 transition"
        onClick={() => router.back()}
      >
        ✖
      </button>

      {/* Text principal */}
      <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">
        SELECCIONA TUS BOLETOS
      </h2>

      {/* Dropdown para la cantidad */}
      <select
        className="p-2 border rounded text-center bg-purple-700 text-gray-900"
        value={selectedTickets}
        onChange={(e) => setSelectedTickets(Number(e.target.value))}
      >
        {[1, 2, 3, 4, 5].map((num) => (
          <option key={num} value={num}>
            {num}
          </option>
        ))}
      </select>

      {/* Bot continuar */}
      <button
        className="mt-4 bg-purple-700 text-white px-6 py-2 rounded hover:bg-purple-900 transition"
        onClick={handleConfirm}
      >
        CONTINUAR
      </button>
    </div>
  );
}
