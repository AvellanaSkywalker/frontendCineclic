"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SeatSelection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // extrae los param dinamicos de la URL
  const screeningId = searchParams.get("screeningId");
  const roomId = searchParams.get("roomId");
  const movieName = searchParams.get("movieName");
  const imageUrl = searchParams.get("imageUrl");
  const schedule = searchParams.get("schedule");
  const savedToken = localStorage.getItem("token");
  const savedName = localStorage.getItem("userName");
  const savedRole = localStorage.getItem("userRole");
  const price = searchParams.get("price")

  const [selectedTickets, setSelectedTickets] = useState(1);

  const handleConfirm = () => {
    // verifica que se hayan recibido los parms necesarios
    if (!screeningId || !roomId || !movieName || !imageUrl || !schedule) {
      alert("Información incompleta: falta el screening o la sala.");
      return;
    }

    // redirige a la pantalla del seatmap con los param din
    router.push(`/seatmap?screeningId=${screeningId}&roomId=${roomId}&movieName=${encodeURIComponent(movieName!)}&schedule=${schedule}&imageUrl=${encodeURIComponent(imageUrl)}&price=${price}&tickets=${selectedTickets}`);

  };
  
  if (savedRole === "guest") {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    alert("Debes iniciar sesión para continuar");
    router.push("/login");
      return;
    }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-gray-100 p-8">
      {/* boton de cierre */}
      <button
        className="absolute top-8 right-8 bg-pink-400 rounded-full w-12 h-12 flex items-center justify-center text-gray-900 hover:bg-violet-400 transition text-2xl shadow-md"
        onClick={() => router.back()}
      >
        ✖
      </button>

      {/* contenedor principal  */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 space-y-8">

        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
          SELECCIONA TUS BOLETOS
        </h2>

        {/* selector de tickets  */}
        <div className="space-y-4">
          <label className="block text-xl font-medium text-gray-700 text-center">
            Cantidad de boletos:
          </label>
          <select
            className="w-full p-4 border-2 border-purple-400 rounded-lg text-center bg-purple-100 text-gray-900 text-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            value={selectedTickets}
            onChange={(e) => setSelectedTickets(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'Boleto' : 'Boletos'}
              </option>
            ))}
          </select>
        </div>

        {/* botoncontinuar  */}
        <button
          className="w-full bg-pink-500 text-white px-8 py-4 rounded-xl hover:bg-purple-700 transition text-xl font-bold shadow-md hover:shadow-lg transform hover:scale-105 duration-200"
          onClick={handleConfirm}
        >
          CONTINUAR
        </button>
      </div>
    </div>
  );
}
