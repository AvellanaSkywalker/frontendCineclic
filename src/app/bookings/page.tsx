"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface Booking {
  id: number;
  folio: string;
  screening: {
    movie: {
      title: string;
    };
    startTime: string;
    room: {
      name: string;
    };
  };
  seats: { row: string; column: string }[];
  status: "ACTIVA" | "CANCELADA";
}

export default function BookingsPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const initialLoad = useRef(true);

  // autenticacion
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Invitado");

  // parareservas
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchFolio, setSearchFolio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // para int
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // 
  useEffect(() => {
    setIsClient(true);
    const savedToken = localStorage.getItem("token");
    const savedName = localStorage.getItem("userName");
    
    if (savedToken) setToken(savedToken);
    if (savedName) setUserName(savedName);

    // carga historial de reservas buscadas
    if(!savedToken) {
    const savedSearchedBookings = sessionStorage.getItem("searchedBookings");
    if (savedSearchedBookings) {
      try {
        const bookings = JSON.parse(savedSearchedBookings);
        setBookings(bookings);
        setHasSearched(bookings.length > 0);
      } catch (e) {
        console.error("Error parsing searched bookings", e);
      }
    }}
  }, []);

  // para mantener reservas buscadas
  useEffect(() => {
    if (isClient && bookings.length > 0) {
      sessionStorage.setItem("searchedBookings", JSON.stringify(bookings));
    }
  }, [bookings, isClient]);

  // // maneja cambio de usuario
  // useEffect(() => {
  //   if (initialLoad.current) {
  //     initialLoad.current = false;
  //     return;
  //   }
    
  //   if (token) {
  //     // limpia reserevas
  //     setBookings([]);
  //     sessionStorage.removeItem("searchedBookings");
  //     setHasSearched(false);
  //   }
  // }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    sessionStorage.removeItem("searchedBookings");
    setBookings([]);
    setHasSearched(false);
    router.push("/login");
  };

  // obtiene reservas
  const fetchBookings = useCallback(
    async (folio?: string) => {
      if (!token) return;
      
      setLoading(true);
      setError(null);
      try {
        const url = folio && folio.trim() !== ""
          ? `http://localhost:4000/api/bookings/folio/${folio}`
          : "http://localhost:4000/api/bookings/user";

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Error al obtener reservaciones");

        const data = await response.json();
        let bookingsArray: Booking[] = [];
        
        if (Array.isArray(data.bookings)) {
          bookingsArray = data.bookings;
        } else if (data.booking) {
          bookingsArray = [data.booking];
        }

        // cctualiza estado de reservas
        setBookings(prev => {
          // crea mapa para evitar duplicados 
          const bookingMap = new Map<number, Booking>();
          
          // reservas existentes
          prev.forEach(booking => bookingMap.set(booking.id, booking));
          
          // agrega las nuevas
          bookingsArray.forEach(booking => bookingMap.set(booking.id, booking));
          
          return Array.from(bookingMap.values());
        });

        setHasSearched(true);

      } catch (error) {
        setError("No se pudieron obtener las reservaciones.");
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
        setSearchFolio("");  
      }
    },
    [token]
  );

  // busqueda con validacion
  const handleSearch = () => {
    const folioRegex = /^\d{4}-\d{4}$/; 
    
    if (!searchFolio.trim()) {
      setError("Por favor ingrese un folio de reserva");
      return;
    }

    if (!folioRegex.test(searchFolio)) {
      setError("Formato de folio inválido. Use: 1666-1089");
      return;
    }

    setError(null);
    fetchBookings(searchFolio);
  };

  // cancelacion de reserva con actualizacion de estado
  const confirmCancelBooking = async () => {
    if (!selectedBooking || !token || isCancelling) return;

    setIsCancelling(true);
    
    try {
      const response = await fetch(
        `http://localhost:4000/api/bookings/${selectedBooking.id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ confirm: true})
        }
      );

      const data = await response.json();

      if (!response.ok) {
        
        if (data.error === "La reserva ya está cancelada.") {
          // Actualiza estado local
          setBookings(prev => 
            prev.map(booking =>
              booking.id === selectedBooking.id
                ? { ...booking, status: "CANCELADA" }
                : booking
            )
          );
          alert("Esta reserva ya estaba cancelada.");
        } else {
          throw new Error(data.error || "Error al cancelar la reserva");
        }
      } else {
        // actualiza estado local
        setBookings(prev => 
          prev.map(booking =>
            booking.id === selectedBooking.id
              ? { ...booking, status: "CANCELADA" }
              : booking
          )
        );
        alert("Reserva cancelada exitosamente.");
      }
    } catch (error) {
      console.error("Error canceling booking:", error);
      alert("No se pudo cancelar la reserva.");
    } finally {
      setShowCancelModal(false);
      setSelectedBooking(null);
      setIsCancelling(false);
    }
  };

  // 
  const handleOpenCancelModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  // 
  const handleCloseModal = () => {
    setShowCancelModal(false);
    setSelectedBooking(null);
    setIsCancelling(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-gray-100 text-gray-900">
      {/* principal */}
      <header className="bg-purple-700 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-black text-3xl text-white pl-2">CineClic</h1>
        </div>
      </header>

      {/* barra de navegacion */}
      <div className="w-full flex justify-between px-10 mt-6">
        <button
          onClick={() => router.push("/")}
          className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm hover:bg-violet-400 transition-colors"
        >
          Inicio
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm flex items-center gap-2 hover:bg-violet-400 transition-colors"
          >
            <span>{userName}</span>
            <svg className="w-5 h-5" fill="white" viewBox="0 0 20 20">
              <path d="M5 7l5 5 5-5H5z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white text-black rounded-lg shadow-lg w-48 z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-200 rounded-lg"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* descripcion  */}
      <div className="px-10 mt-6 ">
        <h1 className="text-xl font-bold text-gray-900 pl-8">
          Consulta y cancelación de reserva
        </h1>
        <p className="mt-2 text-gray-700 pl-8">
          Consulta la información y el estado de tu reserva. Si lo deseas, 
          puedes realizar su cancelación.
        </p>
      </div>

      {/* area de busqueda */}
      <div className="p-4">
        <div className="flex flex-col items-center">
          <div className="flex mb-2 w-full md:w-1/2">
            <input
              type="text"
              value={searchFolio}
              onChange={(e) => {
                setSearchFolio(e.target.value);
                setError(null);
              }}
              placeholder="Ejemplo: 5236-4321"
              className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-pink-500 text-white rounded-r hover:bg-violet-600 transition-colors"
            >
              BUSCAR
            </button>
          </div>
          {error ? (
            <div className="w-full md:w-1/2">
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          ) : (
            <div className="w-full md:w-1/2">
              <p className="text-gray-500 text-sm mt-1">
                Formato: 4 dígitos, guión, 4 dígitos (ej: 5236-4321)
              </p>
            </div>
          )}
        </div>

        {/* listado de reservaciones */}
        {(hasSearched || bookings.length > 0) && (
          <>
            {loading && (
              <div className="text-center my-4">
                <p className="text-gray-600">Cargando reservaciones...</p>
              </div>
            )}
            {error && (
              <div className="text-center my-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            <div className="flex flex-col gap-4 mt-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="mx-auto w-full md:w-1/2 p-4 bg-white border border-gray-200 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <p><strong>Folio:</strong> {booking.folio}</p>
                    <p><strong>Película:</strong> {booking.screening?.movie?.title ?? ""}</p>
                    <p>
                      <strong>Horario:</strong> {booking.screening?.startTime
                      ? new Date(booking.screening.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                      : "No disponible"}
                    </p>
                    <p>
                      <strong>Sala:</strong> {booking.screening?.room?.name ?? ""}
                    </p>
                    <p>
                      <strong>Asientos:</strong>{" "}
                      {booking.seats.map(s => `${s.row}${s.column}`).join(", ")}
                    </p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      <span className={`font-bold ${
                        booking.status === "ACTIVA" ? "text-green-600" : "text-red-600"
                      }`}>
                        {booking.status}
                      </span>
                    </p>
                  </div>
                  
                  {booking.status === "ACTIVA" && (
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => handleOpenCancelModal(booking)}
                        className="px-4 py-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
                      >
                        CANCELAR RESERVA
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {bookings.length === 0 && !loading && (
                <div className="text-center my-4">
                  <p className="text-gray-600">No se encontraron reservaciones</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* confirmacion */}
        {showCancelModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Confirmar Cancelación</h2>
              
              <p className="mb-4">
                ¿Estás seguro de cancelar la reserva con folio: 
                <span className="font-semibold"> {selectedBooking.folio}</span>?
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                  disabled={isCancelling}
                >
                  Cancelar
                </button>
                
                <button
                  onClick={confirmCancelBooking}
                  className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ${
                    isCancelling ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelando..." : "Sí, cancelar"}
                </button>
              </div>
            </div>
          </div>
        )}
        
    </div>

    
  );
}