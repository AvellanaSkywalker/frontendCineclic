"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();

  useEffect(() => {
    setTimeout(() => {
      router.push("/login"); // redirig a la pgna principal despues de 5 segundos 
    }, 5000);
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white text-gray-900">
      <h1 className="text-4xl font-bold text-purple-700">¡Bienvenido a CineClic!</h1>
      <p className="text-gray-600 text-lg mt-4">Ya puedes cerrar esta pantalla e iniciar sesion con tu nueva contraseña</p>
    </div>
  );
}
