'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
// import { Socket } from 'dgram'
import io from 'socket.io-client'


type LayoutType = {
  rows: string[]
  columns: number[]
  seats: Record<string, Record<string, string | { state: string }>>
}

type SeatUpdatePayload = {
  seat: { row: string; column: number }
  state: string
}

export default function SeatMap() {
  // Parámetros de URL
  const searchParams = useSearchParams()
  const screeningId = searchParams.get('screeningId') || ''
  const roomId   = searchParams.get('roomId')      || ''
  const movieName = searchParams.get('movieName')
  const schedule  = searchParams.get('schedule')
  const imageUrl = searchParams.get('imageUrl')
  const price  = Number(searchParams.get('price')) || 0
  const tickets= parseInt(searchParams.get('tickets') || '1', 10)
  const roomName = searchParams.get('roomName') || '';

  const router = useRouter()

  // Estado
  const [layout, setLayout]           = useState<LayoutType | null>(null)
  const [selectedSeats, setSelected]  = useState<string[]>([])
  const [timer, setTimer]             = useState(300)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Ref para socket
  const socketRef = useRef<ReturnType<typeof io> | null>(null)

  // 1. Fetch inicial del layout
  useEffect(() => {
    const fetchLayout = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token') || ''
        const res = await fetch(`http://localhost:4000/api/rooms/${roomId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':  'application/json'
          }
        })
        if (!res.ok) throw new Error(`Status ${res.status}`)
        const { room } = await res.json()
        if (!room.layout?.seats) throw new Error('Layout inválido')
        setLayout({
          rows:    room.layout.rows,
          columns: room.layout.columns.slice(0, 11),
          seats:   room.layout.seats
        })
      } catch (err: any) {
        console.error(err)
        setError('No se pudo cargar el layout')
      } finally {
        setLoading(false)
      }
    }

    if (roomId) fetchLayout()
  }, [roomId])

  // 2. Iniciar socket y listeners
  useEffect(() => {
    if (!screeningId) return

    const socket = io('http://localhost:4000', { transports: ['websocket'] })
    socketRef.current = socket

    // Handler de actualizaciones de asientos
    const onSeatUpdate = (update: SeatUpdatePayload) => {
      setLayout(prev => {
        if (!prev) return prev
        // deep clone mínimo
        const newSeats = { ...prev.seats }
        const { row, column } = update.seat

        if (
          newSeats[row] &&
          Object.prototype.hasOwnProperty.call(newSeats[row], column.toString())
        ) {
          // actualiza estado puntual
          newSeats[row] = {
            ...newSeats[row],
            [column]: update.state === 'available'
              ? 'available'
              : { state: update.state }
          }
        }

        return { ...prev, seats: newSeats }
      })
    }

    socket.on(`seat:update:${screeningId}`, onSeatUpdate)

    return () => {
      socket.off(`seat:update:${screeningId}`, onSeatUpdate)
      socket.disconnect()
    }
  }, [screeningId])

  // 3. Timer de selección
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (timer === 0) {
      alert('Tiempo agotado, redirigiendo…')
      router.push('/')
    }
  }, [timer, router])

  // 4. Helpers de estado de asiento
  const getSeatStatus = (row: string, col: number): string => {
    if (!layout) return 'available'
    const cell = layout.seats[row]?.[col.toString()]
    // Override si ya lo seleccioné
    if (selectedSeats.includes(`${row}${col}`)) return 'selected'
    if (typeof cell === 'object' && 'state' in cell) return cell.state
    return (cell as string) || 'available'
  }

  // 5. Seleccionar / deseleccionar
  const handleSelectSeat = (row: string, col: number) => {
    const id = `${row}${col}`
    const status = getSeatStatus(row, col)
    const sock = socketRef.current
    if (!sock) return

    if (status === 'available' && selectedSeats.length < tickets) {
      sock.emit('seat:select', { screeningId, seat: { row, column: col } })
      setSelected(prev => [...prev, id])
    } else if (status === 'selected') {
      sock.emit('seat:deselect', { screeningId, seat: { row, column: col } })
      setSelected(prev => prev.filter(x => x !== id))
    }
  }

  // 6. Confirmar reserva
  const handleConfirmSelection = async () => {
    const sock = socketRef.current
    const token = localStorage.getItem('token') || ''
    const formatted = selectedSeats.map(id => ({
      row:    id.charAt(0),
      column: Number(id.slice(1))
    }))

    const bookingData = {
      screeningId,
      roomId,
      seats: formatted,
      pricePerSeat: price || 100,
      totalPrice: formatted.length * (price || 100)
    }

    try {
      const res = await fetch('http://localhost:4000/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)
      alert('¡Reserva confirmada!')
      // notificar despeje de asientos
      formatted.forEach(({ row, column }) =>
        sock?.emit('seat:deselect', { screeningId, seat: { row, column } })
      )
      router.push('/')
    } catch (err) {
      console.error(err)
      alert('Error al crear la reserva.')
    }
  }

  const getSeatClasses = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-200 hover:bg-green-300 text-black font-bold rounded p-2";
      case "selected":
        return "bg-blue-400 text-white font-bold rounded p-2";
      case "occupied":
        return "bg-gray-400 text-white font-bold rounded p-2 cursor-not-allowed";
      case "reserved":
        return "bg-red-400 text-white font-bold rounded p-2 cursor-not-allowed";
      default:
        return "bg-gray-200 text-black rounded p-2";
    }
  };

  // --- Rendering simplificado ---
  if (loading) return <p>Cargando...</p>
  if (error)   return <p className="text-red-500">{error}</p>

  return (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-purple-700 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-8">
          <h1 className="font-black text-3xl text-white">CineClic</h1>
        </div>
      </header>

      {/* Botón de inicio */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <button
          onClick={() => router.push("/")}
          className="bg-pink-500 text-white px-5 py-2 rounded-full text-sm transition-colors hover:bg-violet-400 shadow-md"
        >
          INICIO
        </button>
      </div>

      {/* Timer */}
      <div className="my-6 text-center">
        <div className="inline-block bg-white px-6 py-2 rounded-full shadow-md">
          <span className="text-3xl font-mono font-bold text-purple-700">
            {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
          </span>
          <span className="ml-2 text-sm text-gray-600">Tiempo restante</span>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto px-8 pb-16 space-y-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mapa de asientos */}
          <div className="flex-1 bg-white p-8 rounded-2xl shadow-lg">
            {/* Pantalla */}
            <div className="mb-12 text-center">
              <div className="w-full bg-gradient-to-r from-purple-400 to-pink-400 py-4 rounded-lg shadow-inner">
                <span className="text-xl font-bold text-white tracking-wider">PANTALLA</span>
              </div>
            </div>

            {loading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="text-red-500 font-medium">{error}</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && layout && (
              <div className="flex flex-col">
                {/* Grid de asientos */}
                {layout.rows.map((row) => (
                  <div key={row} className="flex items-center gap-4 mb-4">
                    <div className="text-sm font-bold text-gray-700 w-6 text-center">{row}</div>
                    <div className="grid grid-cols-11 gap-2">
                      {layout.columns.map((col) => {
                        const seatId = `${row}${col}`;
                        const status = getSeatStatus(row, col);
                        
                        return (
                          <button
                            key={seatId}
                            className={getSeatClasses(status)}
                            onClick={() => handleSelectSeat(row, col)}
                            disabled={status === "occupied" || status === "reserved"}
                            title={`Asiento ${row}${col}`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Etiquetas de columnas */}
                <div className="flex justify-center gap-2 mt-4 pl-6">
                  {layout.columns.map((col) => (
                    <div key={col} className="w-10 text-center text-xs font-bold text-gray-600">
                      {col}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leyenda de estados */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              {[
                { color: "bg-red-500", label: "Ocupado" },
                { color: "bg-white border border-gray-300", label: "Disponible" },
                { color: "bg-blue-500", label: "Seleccionado" },
                { color: "bg-gray-400", label: "Reservado" }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-center gap-2">
                  <div className={`w-5 h-5 rounded ${item.color}`}></div>
                  <span className="text-gray-700 text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Información de la película */}
          <div className="w-full lg:w-[400px]">
            <div className="bg-white p-6 rounded-2xl shadow-lg sticky top-6">
              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Image
                      src={imageUrl || "/default-movie.png"}
                      alt={movieName || "Poster de la película"}
                      width={120}
                      height={180}
                      className="rounded-lg shadow-md"
                      onError={(e) => {
                        e.currentTarget.src = "/default-movie.png";
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-gray-800 line-clamp-2">{movieName}</h2>
                    <p className="text-gray-600">
                      <span className="font-medium">Horario:</span>{" "}
                      {schedule ? new Date(schedule).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : "N/A"}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Sala:</span> {roomName}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Precio:</span> ${price} por asiento
                    </p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="mb-4">
                    <div className="font-semibold text-gray-700 mb-1">Asientos seleccionados:</div>
                    <div className="min-h-[40px] p-2 bg-gray-50 rounded">
                      {selectedSeats.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedSeats.map(seat => (
                            <span key={seat} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              {seat}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Seleccione sus asientos</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="font-semibold text-gray-700 mb-1">Monto total:</div>
                    <div className="text-2xl font-bold text-purple-700">
                      ${selectedSeats.length * price}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({selectedSeats.length} asientos × ${price})
                    </div>
                  </div>
                  
                  <button
                    className={`w-full py-3 rounded-full text-base font-medium transition-colors shadow-md ${
                      selectedSeats.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                    }`}
                    onClick={handleConfirmSelection}
                    disabled={selectedSeats.length === 0}
                  >
                    Confirmar selección
                  </button>
                  
                  <div className="mt-4 text-center text-sm text-gray-500">
                    {selectedSeats.length} de {tickets} asientos seleccionados
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

