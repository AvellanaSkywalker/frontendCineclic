"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Importa para la redirecci
import "./globals.css";

export default function Home() {
  const [movies, setMovies] = useState<{ id: number; title: string; poster: string }[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Invitado"); // Etado para el nombre del usuario
  const [menuOpen, setMenuOpen] = useState(false); // Controla la visibilidad del men
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedName = localStorage.getItem("userName"); // Obtiene el nombr
    const savedRole = localStorage.getItem("userRole"); // Obtiene el rol del usuario

    console.log("nombre em home:", savedName)

    if (!savedToken) {
      console.error("Error: No se encontró un token en localStorage.");
      setLoading(false);
      return;
    }

    setToken(savedToken);

    if(savedRole === "admin" && location.pathname !== "/admin"){
      router.push("/admin"); // Redirige al home si no es admin
    }
    
    if (savedName) {
      setUserName(savedName); // Asigna el nombre al bot
    } else {
      setUserName("Usuario");
    }
  }, [router]);

  // Cargar pelul
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
      .then((res) => res.json())
      .then((data) => setMovies(data?.movies || []))
      .catch((err) => console.error("Error cargando películas:", err))
      .finally(() => setLoading(false));
  }, [token]);

  // Funci para cerrar sesi
  const handleLogout = () => {
    localStorage.removeItem("token"); // Borra el token
    router.push("/login"); // Redirige al login
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-purple-700 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-black text-3xl text-white pl-2">CineClic</h1>
        </div>
      </header>

        <div className="w-full flex justify-between px-10 mt-6">
          {/* Bot de Consulta Izquierda */}
          <button className="bg-pink-500 text-white px-6 py-3 rounded-full text-sm">
            Consulta
          </button>

          {/* Bot de Usuario con men desplegable Derecha */}
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

      {/* Contenido principal */}
      <main className="max-w-5xl mx-auto p-5 flex-grow">
        <div className="flex flex-col gap-4 w-full max-w-md">
          {loading ? (
            <p className="text-center text-gray-500">Cargando películas...</p>
          ) : (
            movies.map((movie) => (
              <button
                key={movie.id}
                className="bg-gray-800 text-white p-4 rounded-lg flex items-center gap-5 text-md w-full hover:bg-gray-700 transition-colors"
              >
                <Image src={movie.poster} alt={movie.title} width={64} height={96} className="object-cover rounded-md" />
                <h2 className="font-bold">{movie.title}</h2>
              </button>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
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
