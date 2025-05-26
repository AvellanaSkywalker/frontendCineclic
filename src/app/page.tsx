"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./globals.css";

// Función para validar URLs de Cloudinary
// const validatePosterUrl = (url: string | undefined): string => {
//   if (!url) return '';
  
//   // Asegurar que la URL sea válida
//   try {
//     new URL(url);
//     return url;
//   } catch {
//     return '';
//   }
// };

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
      //setLoading(false);
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

  // Cargar películas
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
      <header className="bg-purple-700 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-black text-3xl text-white pl-2">CineClic</h1>
        </div>
      </header>

      <div className="w-full flex justify-between px-10 mt-6">
        <button className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm">
          Consulta
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm flex items-center gap-2"
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

      <main className="max-w-5xl mx-auto p-5 flex-grow">
        <div className="flex flex-col gap-4 w-full max-w-md">
          {loading ? (
            <p className="text-center text-gray-500">Cargando películas...</p>
          ) : (
            movies.map((movie) => (
              <button
                key={movie.id}
                className="bg-gray-800 text-white p-4 rounded-lg flex items-center gap-5 text-md w-full hover:bg-gray-500 transition-colors"
              >
                {movie.poster ? (
                  <Image 
                    src={movie.poster} 
                    alt={movie.title} 
                    width={64} 
                    height={96}
                    quality={80}
                    className="object-cover rounded-md"
                    unoptimized={false}
                    onError={(e) => {
                      console.error("Error cargando la imagen:", movie.poster);
                      // No establecemos src alternativo para mantener limpio el diseño
                      e.currentTarget.src = "data:image/svg+xml;base64,...";
                    }}
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-600 rounded-md flex items-center justify-center">
                    <span className="text-xs text-gray-300">Sin imagen</span>
                  </div>
                )}
                <h2 className="font-bold">{movie.title}</h2>
              </button>
            ))
          )}
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-5 mt-auto">
        <div className="max-w-5xl mx-auto text-right text-sm">
          <p>
            Soporte técnico contactarse a{" "}
            <span className="font-bold">soporte@cineclic.com</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Define a type for the movie object
type MovieApiResponse = {
  id: string;
  title: string;
  posterurl: string;
};