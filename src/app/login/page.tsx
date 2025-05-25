"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

    export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
    try {
        const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        console.log("Respuesta del servidor:", data);

        if (!data.token) throw new Error("Login fallido");

        localStorage.setItem("token", data.token); //  Guarda el token
        localStorage.setItem("userName", data.user.name); //  Guarda el nombre
        console.log("nombre guardado:", localStorage.getItem("userName"));
        
        toast.success("Inicio de sesión exitoso ");
        
        router.push("/"); // Redirige al home
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : "Error inesperado";
        toast.error(errorMessage);
    }
    };


  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-purple-700 py-9"></header>

      {/* Ttulo fuera del header */}
      <div className="max-w-5xl mx-auto flex justify-start pl-2 mt-6">
        <h1 className="font-black text-3xl text-black">CineClic</h1>
      </div>

      <div className="max-w-5xl mx-auto mt-20 pl-2">
        <h2 className="text-4xl font-bold text-gray-900">Iniciar Sesión</h2>
      </div>

      {/* Contenedor del login */}
      <main className="flex-grow flex items-center justify-center">
        <div className="p-8 rounded-lg w-full max-w-md text-left">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-md text-gray-800">Correo Electrónico</label>
              <input
                type="email"
                placeholder="Ingresa tu correo"
                className="w-full border-b border-gray-400 p-2 focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-md text-gray-800">Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                className="w-full border-b border-gray-400 p-2 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
                type="button"
                className="bg-purple-700 hover:bg-purple-600 w-full p-2 rounded-xl text-white font-bold text-lg"
                onClick={handleLogin}
                >
              Iniciar Sesión
            </button>
          </form>

          {/* Hipervnculos */}
          <nav className="mt-6 flex flex-col space-y-5 text-sm text-center">
            <Link href="/register" className="text-purple-700 hover:underline">
              ¿No tienes cuenta? Regístrate aquí
            </Link>
            <Link href="/forgotPassword" className="text-gray-500 hover:underline">
              ¿Olvidaste tu contraseña? Recuperarla
            </Link>
          </nav>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 mt-auto text-right text-sm">
        <p>Soporte técnico: <span className="font-bold">soporte@cineclic.com</span></p>
      </footer>
    </div>
  );
}
