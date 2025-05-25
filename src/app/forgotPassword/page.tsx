"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "react-toastify/dist/ReactToastify.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:4000/api/auth/forgotPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error en la solicitud");
      }

      toast.success("Correo de recuperación enviado!");
      router.push("/login"); // Redirig al login desp de enviar la solicitud

    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Error al solicitar recuperación");
      } else {
        toast.error("Ocurrió un error inesperado.");
      }
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
        <h2 className="text-4xl font-bold text-gray-900">Recuperar Contraseña</h2>
        <p className="text-left text-gray-600 mt-2 max-w-md">
            Ingresa tu correo electrónico y te enviaremos un enlace para que 
            puedas restablecer tu contraseña de forma segura. Si no recibes el 
            correo en unos minutos, revisa tu bandeja de spam o intenta nuevamente.
        </p>

      </div>

      {/* Formulario de recuperaci */}
      <main className="flex-grow flex items-center justify-center">
        <div className="p-8 rounded-lg w-full max-w-md text-left">
          <form className="space-y-6" onSubmit={handleResetPassword}>
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

            <button className="bg-purple-700 hover:bg-purple-600 w-full p-2 rounded-xl text-white font-bold text-lg">
              Recuperar Contraseña
            </button>
          </form>

          {/* Hipervculo para regresar al login */}
          <nav className="mt-6 text-sm text-center">
            <Link href="/login" className="text-purple-700 hover:underline">
              Volver al inicio de sesión
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
