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
  screenings?: Screening[]; 
}

interface Screening {
  id: number;
  movieId: number;
  roomId: number;
  startTime: string;
  endTime: string;
  date?: string; 
  price: string | number;
}

export default function MovieDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string; 

  const [rating, setRating] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState("Usuario");
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

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
        // extrae ascreenings 
        setScreenings(movieData.movie.screenings || []);

        // obtiene calificacin del usuario
        const ratingRes = await fetch(`http://localhost:4000/api/movies/${id}/rating`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (ratingRes.ok) {
          const ratingData = await ratingRes.json();
          setUserRating(ratingData.rating);
        } else {
          setUserRating(null);
        }

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [token, id]);


    const saveRating = (rating: number) => {
      setUserRating(rating);
      localStorage.setItem(`movie_rating_${id}`, rating.toString());
    };

    useEffect(() => {
      const localRating = localStorage.getItem(`movie_rating_${id}`);
      if (localRating) {
        setUserRating(Number(localRating));
      }
    }, [id]);


  // para estrellas 
  const handleMouseOver = (rating: number) => {
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    setHoverRating(null);
  };

  const handleClick = (rating: number) => {
    saveRating(rating);
  };

  const renderStars = () => {
    return (
      <div className="flex" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => {
          const displayRating = hoverRating ?? userRating ?? 0;
          const isFilled = star <= displayRating;
          const isHalf = displayRating > star - 1 && displayRating <star;
          
            return (
              <div 
                key={star}
                className="relative w-8 h-8 cursor-pointer"
                onMouseOver={() => handleMouseOver(star)}
                onClick={() => handleClick(star)}
              >
                {/* estrella vacia de fondo */}
                <div className="absolute text-gray-300 text-3xl">★</div>
                
                {/* */}
                {isHalf && (
                  <div className="absolute text-yellow-400 text-3xl" style={{ clipPath: 'inset(0 50% 0 0)' }}>
                    ★
                  </div>
                )}
                
                {/* estrella completa  */}
                {isFilled && !isHalf && (
                  <div className="absolute text-yellow-400 text-3xl">★</div>
                )}
              </div>
            );
            })}
      </div>
    );
  };

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

  // filtra screenings por dia 
  const getScreeningsForDay = (isoDate: string) => {
    const filtered = screenings.filter(screening => {
      // rxtrae la parte de fecha de startTime
      const screeningDate = screening.startTime.split('T')[0];
      console.log("Comparando:", screeningDate, "con", isoDate);
      return screeningDate === isoDate;
    });
    console.log("Screenings filtrados para", isoDate, ":", filtered);
    return filtered;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/login");
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-gray-100">
      {/* header */}
      <header className="bg-purple-700 py-5">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="font-black text-3xl text-white">CineClic</h1>
        </div>
      </header>

      {/* boton inicio y menu  usuario  */}
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center gap-10">
        <button
          onClick={() => router.push("/")}
          className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-violet-400 transition-200"
        >
          INICIO
        </button>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm flex items-center gap-2 hover:bg-violet-400 transition-200"
          >
            <span>{userName}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isMenuOpen ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* detalles de  pelicula */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Img de pelicula */}
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

          {/* info de  peli */}
          <div className="w-full md:w-2/3 lg:w-3/4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {movie.title}
            </h1>
            <p className="text-gray-900 mb-4">
              {formatDuration(movie.duration)} • Rating: {movie.rating}/5
            </p>

            <div className="bg-white p-6 rounded-lg shadow mb-8 text-gray-900">
              <h2 className="text-xl font-semibold mb-3">Sinopsis</h2>
              <p className="text-gray-600">{movie.description}</p>
            </div>

            {/* horarios por dia */}
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Selecciona un horario</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4 mb-8 text-violet-600">
              {getWeekDays().map((day, index) => {
                const dayScreenings = getScreeningsForDay(day.isoDate);
                return (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg shadow text-center "
                  >
                    <h3 className="font-medium mb-3">
                      {index === 0 ? "HOY" : day.formattedDate.split(",")[0].toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      {day.formattedDate.split(",")[1]}
                    </p>
                    <div className="space-y-2">
                      {dayScreenings.length > 0 ? (
                        dayScreenings.map((screening, i) => {
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
                                  `/seat-selection?screeningId=${screening.id}&roomId=${screening.roomId}&movieName=${encodeURIComponent(
                                    movie.title
                                  )}&schedule=${screening.startTime}&imageUrl=${encodeURIComponent(
                                    movie.posterurl
                                  )}&price=${screening.price}`
                                )
                              }
                              className="w-full bg-purple-100 hover:bg-purple-200 text-purple-800 py-1 px-2 rounded text-sm transition"
                            >
                              {formattedTime}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-gray-700 text-xs">Sin funciones</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* sistema de calificaccion */}
            <div className="bg-white p-6 rounded-lg shadow ">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                CALIFICA LA PELÍCULA !!
              </h2>

              {renderStars()}
              <p className="mt-2 text-gray-600">
                {userRating !== null
                  ? `Gracias por tu calificación: ${userRating} estrellas`
                  : "Selecciona tu calificación"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
