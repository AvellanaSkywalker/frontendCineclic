"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SeatSelection() {
  const [selectedTickets, setSelectedTickets] = useState(1);
  const router = useRouter();

  const handleConfirm = () => {
    // para redirigir los datos redirigir a seatmap
    router.push(`/booking?tickets=${selectedTickets}`);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-black-100">
      {/* boton de cierre */}
      <button 
        className="absolute top-4 right-4 bg-black-300 rounded-full w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-400 transition"
        onClick={() => router.back()} // Vuelve a la pantalla anterior
      >
        ✖
      </button>

      {/* texto principal */}
      <h2 className="text-xl font-semibold text-center mb-4 bg-black ">SELECCIONA TUS BOLETOS</h2>

      {/* dropdown */}
      <select 
        className="p-2 border rounded text-center bg-purple-800" 
        value={selectedTickets} 
        onChange={(e) => setSelectedTickets(Number(e.target.value))}
      >
        {[1, 2, 3, 4, 5].map(num => (
          <option key={num} value={num}>{num}</option>
        ))}
      </select>

      {/* boton  continuar */}
      <button 
        className="mt-4 bg-purple-800 text-white px-6 py-2 rounded hover:bg-purple-900 transition"
        onClick={handleConfirm} 
      >
        CONTINUAR
      </button>
    </div>
  );
}



