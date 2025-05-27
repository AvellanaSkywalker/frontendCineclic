'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';


/**
 * Higher-Order Component para proteger rutas
 * @param WrappedComponent - componente a proteger
 * @param allowedRoles - roles permitidos 
 * @param redirectUnauthenticated - ruta para redirigir si no esta autenticado default: /login
 * @param redirectUnauthorized - ruta para redirigir si no tiene permisos default: '/'
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

      // si no hay token redirige a login
      if (!token) {
        router.push(defaultOptions.redirectUnauthenticated);
        return;
      }

      // si la ruta requiere roles especificos y el usuario no tiene permiso
      if (
        defaultOptions.allowedRoles.length > 0 &&
        !defaultOptions.allowedRoles.includes(role || '')
      ) {
        router.push(defaultOptions.redirectUnauthorized);
        return;
      }

      // si pasa todas las validaciones
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