"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";

interface Movie {
  id: number;
  title: string;
  posterurl: string;
  description: string;
  duration: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  screenings?: Screening[]; // screenings viene dentro de movie
}

interface Screening {
  id: number;
  movieId: number;
  roomId: number;
  startTime: string;
  endTime: string;
  date?: string; // opcional
  price: string | number;
}

export default function MovieDetail() {
  const router = useRouter();
  const { id } = useParams();

  const [rating, setRating] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("Usuario");
  const [loading, setLoading] = useState(true);

  // Aut y permisos
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedName = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("userRole");

    if (!savedToken) {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setUserName(savedName || "Usuario");

    if (savedRole === "admin" && !location.pathname.startsWith("/admin")) {
      router.push("/admin");
      return;
    }

    if (savedRole !== "admin" && location.pathname.startsWith("/admin")) {
      router.push("/");
      return;
    }
  }, [router]);

  // obtene detalles de la peli
  useEffect(() => {
    if (!token || !id) return;

    const fetchMovieData = async () => {
      setLoading(true);
      try {
        const movieRes = await fetch(`http://localhost:4000/api/movies/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        if (!movieRes.ok) throw new Error("Error al obtener la película");
        const movieData = await movieRes.json();
        console.log("Movie Data:", movieData);

        
        setMovie(movieData.movie);
        // extrae ascreenings desde movieData.movie
        setScreenings(movieData.movie.screenings || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [token, id]);

  // formatea duraciion
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // generar dia de la semana a partir de hoy + 6 dias sig
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        dateObj: date,
        formattedDate: date.toLocaleDateString('es-ES', options),
        isoDate: date.toISOString().split('T')[0]
      });
    }
    return days;
  };

  // filtra screenings por dia usando el startTime
  const getScreeningsForDay = (isoDate: string) => {
    const filtered = screenings.filter(screening => {
      // Extraer la parte de fecha de startTime.
      const screeningDate = screening.startTime.split('T')[0];
      console.log("Comparando:", screeningDate, "con", isoDate);
      return screeningDate === isoDate;
    });
    console.log("Screenings filtrados para", isoDate, ":", filtered);
    return filtered;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Película no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-700 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-black text-3xl text-white pl-2">CineClic</h1>
        </div>
      </header>

      {/* bton de Ini */}
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        
        <button 
          onClick={() => router.push("/")}
          className="bg-pink-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-pink-700 transition"
        >
          INICIO
        </button>

        {/* bot del usuario fuera del header */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <span>{userName}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <button 
                onClick={() => {
                  localStorage.removeItem("token");
                  router.push("/login");
                }}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detalles de la peli*/}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Imagen de la película */}
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
              {movie.posterurl ? (
                <Image
                  src={movie.posterurl}
                  alt={movie.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-200">
                  <span className="text-gray-500">No disponible</span>
                </div>
              )}
            </div>
          </div>

          {/* info de la peli */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{movie.title}</h1>
            <p className="text-gray-600 mb-4">
              {formatDuration(movie.duration)} • Rating: {movie.rating}/5
            </p>
            
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h2 className="text-xl font-semibold mb-3">Sinopsis</h2>
              <p className="text-gray-700">{movie.description}</p>
            </div>

            {/* hoarios per dia */}
            <h2 className="text-xl font-semibold mb-4">Selecciona un horario</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4 mb-8">
              {getWeekDays().map((day, index) => {
                const dayScreenings = getScreeningsForDay(day.isoDate);
                
                return (
                  <div key={index} className="bg-white p-3 rounded-lg shadow">
                    <h3 className="font-medium text-center mb-3">
                      {index === 0 ? 'HOY' : day.formattedDate.split(',')[0].toUpperCase()}
                    </h3>
                    <p className="text-sm text-center text-gray-500 mb-2">
                      {day.formattedDate.split(',')[1]}
                    </p>
                    <div className="space-y-2">
                      {dayScreenings.length > 0 ? (
                        dayScreenings.map((screening, i) => {
                          // Extrae la hora formateada 2 difit para hour y minute
                          const formattedTime = new Date(screening.startTime).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          });
                          return (
                            <button
                              key={i}
                              onClick={() =>
                                router.push(
                                  `/booking?time=${encodeURIComponent(formattedTime)}&date=${screening.startTime.split('T')[0]}&movieId=${id}`
                                )
                              }
                              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 py-1 px-2 rounded text-sm transition"
                            >
                              {formattedTime}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 text-xs">Sin funciones</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* sistema de califica */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">CALIFICA LA PELÍCULA !!</h2>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="text-3xl focus:outline-none"
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-gray-600">
                {rating > 0 ? `Gracias por tu calificación: ${rating} estrellas` : "Selecciona tu calificación"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
