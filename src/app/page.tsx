"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./globals.css";

export default function Home() {
  const [movies, setMovies] = useState<{ id: number; title: string; poster: string }[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Invitado");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedName = localStorage.getItem("userName");
    const savedRole = localStorage.getItem("userRole");

    if (!savedToken) {
      console.error("Error: No se encontró un token en localStorage.");
      router.push("/login");
      
      return;
    }

    setToken(savedToken);

    if (savedRole === "admin" && !location.pathname.startsWith("/admin")) {
      router.push("/admin");
      return;
    }

    if (savedRole !== "admin" && location.pathname.startsWith("/admin")) {
    router.push("/");
    return;
    }
    
    setUserName(savedName || "Usuario");
  }, [router]);

  // carga peiculas
  useEffect(() => {
    if (!token) return;

    setLoading(true);

    fetch("http://localhost:4000/api/movies", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const validatedMovies = (data?.movies || []).map((movie: MovieApiResponse) => ({
          id: movie.id,
          title: movie.title,
          poster: movie.posterurl
        }));
        setMovies(validatedMovies);
      })
      .catch((err) => {
        console.error("Error cargando películas:", err);
        setMovies([]);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole")
    router.push("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Header  */}
      <header className="bg-purple-700 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-black text-3xl text-white pl-2">CineClic</h1>
        </div>
      </header>

      {/* Botones */}
      <div className="w-full flex justify-between px-10 py-4 sticky top-16 bg-white z-10">
        <button
          onClick={() => router.push(`/bookings`)}
          className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm hover:bg-violet-400 transition-colors duration-200"
        >
          Consulta
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm flex items-center gap-2 hover:bg-violet-400 transition-colors duration-200"
          >
            <span>{userName}</span>
            <svg className="w-5 h-5" fill="white" viewBox="0 0 20 20">
              <path d="M5 7l5 5 5-5H5z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white text-black rounded-lg shadow-lg w-48">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contenedor principal para pel */}
      <div className="flex-grow overflow-y-auto pb-20">
        <main className="max-w-5xl mx-auto p-5">
          <div className="flex flex-col gap-4 w-full pl-2"> {/*  */}
            {loading ? (
              <p className="text-center text-gray-500">Cargando películas...</p>
            ) : (
              movies.map((movie) => (
                <button
                  key={movie.id}
                  onClick={() => router.push(`/movieDetail/${movie.id}`)}
                  className="bg-white text-gray-900 p-8 rounded-lg flex items-center gap-8 w-full hover:bg-pink-100 transition-colors"
                >
                  {movie.poster ? (
                    <Image 
                      src={movie.poster} 
                      alt={movie.title} 
                      width={128} 
                      height={192}
                      quality={80}
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-32 h-48 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-400">Sin imagen</span>
                    </div>
                  )}
                  <h2 className="font-bold">{movie.title}</h2>
                </button>
              ))
            )}
          </div>
        </main>
      </div>
      {/* Footer */}
        <footer className="bg-gray-900 text-white py-5 sticky bottom-0 z-10">
          <div className="max-w-5xl mx-auto text-right text-sm">
            <p>
              Soporte técnico:{" "}
              <a 
                href="mailto:soporte@cineclic.com" 
                className="font-bold underline hover:text-pink-300 transition-colors"
              >
                cinceclic.official@gmail.com
              </a>
            </p>
          </div>
        </footer>
    </div>
  );
}


type MovieApiResponse = {
  id: string;
  title: string;
  posterurl: string;
};