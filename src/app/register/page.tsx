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
  
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();


    setNameError("");
    setEmailError("");
    setPasswordError("");

    let valid = true;

    // valida para Nombre 
    const nameRegex = /^[A-Za-z]{1,20}$/;
    if (!nameRegex.test(name)) {
      setNameError("campos invalidos");
      valid = false;
    }

    // valida para email
    const emailRegex = /^[A-Za-z0-9@._-]+$/;
    if (!email || /\s/.test(email) || !emailRegex.test(email)) {
      setEmailError("campos invalidos");
      valid = false;
    }

    // valida para contrasenia 
    const passwordRegex = /^[A-Za-z0-9]{8,}$/;
    if (!passwordRegex.test(password)) {
      setPasswordError("campos invalidos");
      valid = false;
    }

    if (!valid) return;

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
      router.push("/login");
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
    {/* header */}
    <header className="bg-purple-700 py-9"></header>

    {/* titulo */}
    <div className="max-w-5xl mx-auto flex justify-start pl-2 mt-6">
      <h1 className="font-black text-3xl text-black">CineClic</h1>
    </div>

    <div className="max-w-5xl mx-auto mt-20 pl-2">
      <h2 className="text-4xl font-bold text-gray-900">Crear Cuenta</h2>
    </div>

    {/* contenedor del registro */}
    <main className="flex-grow flex items-center justify-center">
      <div className="p-8 rounded-lg w-full max-w-md text-left">
        <form className="space-y-6" onSubmit={handleRegister}>
          {/* campo Nombre */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-md text-gray-800">Nombre</label>
            <input
              type="text"
              placeholder="Ingresa tu nombre"
              className="w-full border-b border-gray-400 p-2 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            
            <p className="text-gray-500 text-xs mt-1">
              Máximo 20 letras (a-z, A-Z)
            </p>
            {nameError && (
              <p className="text-red-500 text-xs italic">{nameError}</p>
            )}
          </div>

          {/* Campo Email */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-md text-gray-800">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="Ingresa tu correo"
              className="w-full border-b border-gray-400 p-2 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
        
            <p className="text-gray-500 text-xs mt-1">
              Letras, números y símbolos (@, ., _, -). Sin espacios.
            </p>
            {emailError && (
              <p className="text-red-500 text-xs italic">{emailError}</p>
            )}
          </div>

          {/* Campo Contrasenia */}
          <div className="flex flex-col gap-1">
            <label className="font-bold text-md text-gray-800">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="Crea tu contraseña"
              className="w-full border-b border-gray-400 p-2 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <p className="text-gray-500 text-xs mt-1">
              Mínimo 8 caracteres alfanuméricos. Sin espacios.
            </p>
            {passwordError && (
              <p className="text-red-500 text-xs italic">{passwordError}</p>
            )}
          </div>

            <button
              type="submit"
              className="bg-purple-700 hover:bg-purple-600 w-full p-2 rounded-xl text-white font-bold text-lg"
            >
              Crear Cuenta
            </button>
          </form>

          {/* hipervinculo para iniciar sesion */}
          <nav className="mt-6 flex flex-col space-y-5 text-sm text-center">
            <Link href="/login" className="text-purple-700 hover:underline">
              ¿Ya tienes cuenta? Inicia sesión aquí
            </Link>
          </nav>
        </div>
      </main>

      {/* Footer */}
        <footer className="bg-gray-900 text-white py-5">
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
