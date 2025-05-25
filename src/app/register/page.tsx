"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:4000/api/auth/createAccount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error en el registro");
      }

      toast.success("Cuenta creada correctamente!");
      router.push("/login"); // Redirigir al login

    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Error al registrarse");
      } else {
        toast.error("Ocurrió un error inesperado.");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-purple-700 py-9"></header>

      {/* Título fuera del header */}
      <div className="max-w-5xl mx-auto flex justify-start pl-2 mt-6">
        <h1 className="font-black text-3xl text-black">CineClic</h1>
      </div>

      <div className="max-w-5xl mx-auto mt-20 pl-2">
        <h2 className="text-4xl font-bold text-gray-900">Crear Cuenta</h2>
      </div>

      {/* Contenedor del registro */}
      <main className="flex-grow flex items-center justify-center">
        <div className="p-8 rounded-lg w-full max-w-md text-left">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-md text-gray-800">Nombre</label>
              <input
                type="text"
                placeholder="Ingresa tu nombre"
                className="w-full border-b border-gray-400 p-2 focus:outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

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
                placeholder="Crea tu contraseña"
                className="w-full border-b border-gray-400 p-2 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="bg-purple-700 hover:bg-purple-600 w-full p-2 rounded-xl text-white font-bold text-lg">
              Crear Cuenta
            </button>
          </form>

          {/* Hipervínculo para iniciar sesión */}
          <nav className="mt-6 flex flex-col space-y-5 text-sm text-center">
            <Link href="/login" className="text-purple-700 hover:underline">
              ¿Ya tienes cuenta? Inicia sesión aquí
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
