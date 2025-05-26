'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
; // Opcional: componente de carga

/**
 * Higher-Order Component para proteger rutas
 * @param WrappedComponent - Componente a proteger
 * @param allowedRoles - Roles permitidos (opcional)
 * @param redirectUnauthenticated - Ruta para redirigir si no está autenticado (default: '/login')
 * @param redirectUnauthorized - Ruta para redirigir si no tiene permisos (default: '/')
 */
export const withAuth = (
  WrappedComponent: React.ComponentType,
  options?: {
    allowedRoles?: string[];
    redirectUnauthenticated?: string;
    redirectUnauthorized?: string;
    loadingComponent?: React.ReactNode;
  }
) => {
  const defaultOptions = {
    allowedRoles: [],
    redirectUnauthenticated: '/login',
    redirectUnauthorized: '/',
    
    ...options,
  };

  return function WithAuthWrapper(props: React.ComponentProps<typeof WrappedComponent>) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');

      // Si no hay token, redirige a login
      if (!token) {
        router.push(defaultOptions.redirectUnauthenticated);
        return;
      }

      // Si la ruta requiere roles específicos y el usuario no tiene permiso
      if (
        defaultOptions.allowedRoles.length > 0 &&
        !defaultOptions.allowedRoles.includes(role || '')
      ) {
        router.push(defaultOptions.redirectUnauthorized);
        return;
      }

      // Si pasa todas las validaciones
      setIsAuthorized(true);
    }, [router]);

    if (isAuthorized === null) {
      return defaultOptions.loadingComponent;
    }

    if (!isAuthorized) {
      return null; // O un componente de "No autorizado"
    }

    return <WrappedComponent {...props} />;
  };
};