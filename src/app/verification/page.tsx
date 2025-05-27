"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex flex-col min-h-screen items-center justify-center bg-white text-gray-900">
      <h1 className="text-4xl font-bold text-purple-700">Autenticando...</h1>
      <p className="text-gray-600 text-lg mt-4">Validando tu acceso, espera un momento...</p>
    </div>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token"); // tura el token de la URL
  const router = useRouter();
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    
    if (!token) {
      router.push("/"); // si no hay token redirige a la pgina principal
      return;
    }

    // validael token con el backend
    const validateToken = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/auth/confirm/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Token inválido");
        }

        setValidating(false);

        setTimeout(() => {
            router.push("/login"); // redirige al resetpassword con el token
        }, 5000);
        // redirige al resetpassword con el token
      } catch (error) {
        console.error(error);
        router.push("/"); // si falla redirige al inicio
      }
    };

    validateToken();
  }, [token, router]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white text-gray-900">
      <h1 className="text-4xl font-bold text-purple-700">Autenticando...</h1>
      {validating ? (
        <p className="text-gray-600 text-lg mt-4">Validando tu acceso, espera un momento...</p>
      ) : (
        <p className="text-gray-600 text-lg mt-4">Redirigiendo a la página de inicio</p>
      )}
    </div>
  );
}
