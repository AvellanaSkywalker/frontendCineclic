"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Ima useSearchParam
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return(
    <Suspense fallback={<div>Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams(); // 
  const token = searchParams.get("token"); // Captura el token de la URL
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/auth/resetPassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        
        body: JSON.stringify({ token, newPassword: password, confirmPassword }), // Se enva el token 
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al actualizar la contraseña");
      }

      toast.success("Contraseña actualizada correctamente!");
      router.push("/confirmation"); // Redirig a la pantalla de bienvenida

    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Error inesperado.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-purple-700 py-9"></header>

      {/* Tulo fuera del header */}
      <div className="max-w-5xl mx-auto flex justify-start pl-2 mt-6">
        <h1 className="font-black text-3xl text-black">CineClic</h1>
      </div>

      <div className="max-w-5xl mx-auto mt-20 pl-2">
        <h2 className="text-4xl font-bold text-gray-900">Restablecer Contraseña</h2>
      </div>

      {/* Formulario de restablecimiento */}
      <main className="flex-grow flex items-center justify-center">
        <div className="p-8 rounded-lg w-full max-w-md text-left">
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-md text-gray-800">Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu nueva contraseña"
                className="w-full border-b border-gray-400 p-2 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-md text-gray-800">Confirmar Contraseña</label>
              <input
                type="password"
                placeholder="Confirma tu nueva contraseña"
                className="w-full border-b border-gray-400 p-2 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button className="bg-purple-700 hover:bg-purple-600 w-full p-2 rounded-xl text-white font-bold text-lg">
              Actualizar Contraseña
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
