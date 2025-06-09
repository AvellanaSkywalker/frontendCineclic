"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    let valid = true;

    if (email.trim() === "") {
      setEmailError("campo invalido");
      valid = false;
    }

    if (password.trim() === "") {
      setPasswordError("campo invalido");
      valid = false;
    }

    if (!valid) return;

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400) {
          if (data.errors) {
            data.errors.forEach((err: any) => {
              if (err.path === "email") setEmailError(err.msg);
              if (err.path === "password") setPasswordError(err.msg);
            });
          } else {
            throw new Error(data.message || "error en el inicio de sesion");
          }
          return;
        } else if (res.status === 401) {
          setGeneralError(data.message || "Credenciales incorrectas");
          return;
        } else {
          throw new Error(data.message || "error en el inicio de sesion");
        }
      }
      console.log("Respuesta del servidor:", data);

      if (!data.token) throw new Error("Login fallido");

      localStorage.setItem("token", data.token); // guarda token
      localStorage.setItem("userName", data.user.name); // guarda  nombre
      localStorage.setItem("userRole", data.user.role);
      console.log("Rol guardado:", localStorage.getItem("userRole"));

      toast.success("Inicio de sesión exitoso");

      if (data.user.role === "admin") {
        console.log("dirige a admin");
        router.push("/admin"); // dirige al panel de administrador
      } else {
        router.push("/"); // dirige a home
      }

      console.log("nombre guardado:", localStorage.getItem("userName"));
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Error inesperado";
      toast.error(errorMessage);
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
        <h2 className="text-4xl font-bold text-gray-900">Iniciar Sesión</h2>
      </div>

      {/* contenedor de login */}
      <main className="flex-grow flex items-center justify-center">
        <div className="p-8 rounded-lg w-full max-w-md text-left">
          <form className="space-y-6" onSubmit={handleLogin}>
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
              {generalError && (
                <p className="text-red-500 text-center py-2 font-medium">
                  {generalError}
                </p>
              )}
              {emailError && (
                <p className="text-red-500 text-xs italic">{emailError}</p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-md text-gray-800">
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                className="w-full border-b border-gray-400 p-2 focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && (
                <p className="text-red-500 text-xs italic">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="bg-purple-700 hover:bg-purple-600 w-full p-2 rounded-xl text-white font-bold text-lg"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* hipervnculos */}
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
