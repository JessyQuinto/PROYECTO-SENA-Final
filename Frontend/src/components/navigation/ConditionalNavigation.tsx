import React from 'react';
import { Link } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/auth/AuthContext';
import Icon from '@/components/ui/Icon';

export const ConditionalNavigation: React.FC = () => {
  const { user, signOut } = useAuth();
  const {
    isAuthenticated,
    isAdmin,
    isVendor,
    isBuyer,
    isVendorApproved,
    isVendorPending,
    isVendorRejected,
  } = usePermissions();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <Link
          to="/login"
          className="text-gray-700 hover:text-primary transition-colors"
        >
          Iniciar sesión
        </Link>
        <Link
          to="/register"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Registrarse
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Navegación para compradores */}
      {isBuyer && (
        <>
          <Link
            to="/productos"
            className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2"
          >
            <Icon
              category="Catálogo y producto"
              name="LineMdSearch"
              className="w-4 h-4"
            />
            Productos
          </Link>
          <Link
            to="/mis-pedidos"
            className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2"
          >
            <Icon
              category="Pedidos"
              name="MaterialSymbolsOrdersOutlineRounded"
              className="w-4 h-4"
            />
            Mis pedidos
          </Link>
        </>
      )}

      {/* Navegación para vendedores */}
      {isVendor && (
        <>
          {isVendorApproved && (
            <>
              <Link
                to="/vendedor"
                className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Icon
                  category="Catálogo y producto"
                  name="MdiStore"
                  className="w-4 h-4"
                />
                Panel vendedor
              </Link>
              <Link
                to="/vendedor/productos"
                className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2"
              >
                <Icon
                  category="Catálogo y producto"
                  name="LucideTags"
                  className="w-4 h-4"
                />
                Mis productos
              </Link>
            </>
          )}
          {isVendorPending && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <Icon
                category="Estados y Feedback"
                name="TypcnInfoLarge"
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Cuenta en revisión</span>
            </div>
          )}
          {isVendorRejected && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <Icon
                category="Estados y Feedback"
                name="TypcnInfoLarge"
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Cuenta rechazada</span>
            </div>
          )}
        </>
      )}

      {/* Navegación para administradores */}
      {isAdmin && (
        <>
          <Link
            to="/admin"
            className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2"
          >
            <Icon
              category="Administrador"
              name="MdiShieldCheck"
              className="w-4 h-4"
            />
            Panel admin
          </Link>
          <Link
            to="/admin/usuarios"
            className="text-gray-700 hover:text-primary transition-colors flex items-center gap-2"
          >
            <Icon
              category="Administrador"
              name="TablerUsers"
              className="w-4 h-4"
            />
            Usuarios
          </Link>
        </>
      )}

      {/* Perfil del usuario */}
      <div className="relative group">
        <button className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
          <Icon
            category="Usuario"
            name="MdiAccountCircle"
            className="w-6 h-6"
          />
          <span className="hidden sm:inline">
            {user?.nombre || user?.email?.split('@')[0] || 'Usuario'}
          </span>
          <Icon
            category="Navegación principal"
            name="MdiChevronDown"
            className="w-4 h-4"
          />
        </button>
        
        {/* Dropdown del perfil */}
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="py-2">
            <Link
              to="/perfil"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Mi perfil
            </Link>
            <button
              onClick={() => signOut()}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionalNavigation;
