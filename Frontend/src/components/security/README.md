# Componentes de Seguridad y Control de Acceso

Este directorio contiene componentes para implementar control de acceso basado en roles (RBAC) en la aplicación Tesoros Chocó.

## Componentes Disponibles

### 1. Route Guards

#### `AdminRouteGuard`
- **Propósito**: Protege rutas que solo pueden acceder administradores
- **Uso**: Envuelve componentes que requieren permisos de administrador
- **Comportamiento**: Redirige a usuarios no autorizados

```tsx
import { AdminRouteGuard } from '@/components/security';

<AdminRouteGuard>
  <AdminDashboard />
</AdminRouteGuard>
```

#### `VendorRouteGuard`
- **Propósito**: Protege rutas de vendedores
- **Props**:
  - `requireApproval`: Si es `true`, solo vendedores aprobados pueden acceder
  - `children`: Componentes a proteger
- **Comportamiento**: 
  - Muestra estado de cuenta si está pendiente/rechazada
  - Redirige si no es vendedor
  - Permite acceso solo si está aprobado (cuando `requireApproval=true`)

```tsx
import { VendorRouteGuard } from '@/components/security';

// Solo vendedores aprobados
<VendorRouteGuard requireApproval={true}>
  <VendorDashboard />
</VendorRouteGuard>

// Cualquier vendedor (para mostrar estado)
<VendorRouteGuard requireApproval={false}>
  <VendorStatus />
</VendorRouteGuard>
```

#### `BuyerRouteGuard`
- **Propósito**: Protege rutas de compradores
- **Comportamiento**: Solo permite acceso a usuarios con rol 'comprador'

```tsx
import { BuyerRouteGuard } from '@/components/security';

<BuyerRouteGuard>
  <BuyerDashboard />
</BuyerRouteGuard>
```

### 2. Componentes de UI

#### `VendorStatusBanner`
- **Propósito**: Muestra el estado actual de la cuenta de vendedor
- **Estados**:
  - ✅ **Aprobado**: Verde, indica que puede usar todas las funciones
  - ⏳ **Pendiente**: Ámbar, indica que está en revisión
  - ❌ **Rechazado**: Rojo, indica que no fue aprobado
- **Uso**: Colocar en páginas de vendedor para mostrar estado

```tsx
import { VendorStatusBanner } from '@/components/vendor';

<VendorStatusBanner />
```

#### `ConditionalNavigation`
- **Propósito**: Muestra navegación condicional según el rol del usuario
- **Comportamiento**:
  - Usuarios no autenticados: Login/Registro
  - Compradores: Productos, Mis pedidos
  - Vendedores aprobados: Panel vendedor, Mis productos
  - Vendedores pendientes: Indicador de estado
  - Administradores: Panel admin, Usuarios
- **Uso**: En el header/navegación principal

```tsx
import { ConditionalNavigation } from '@/components/security';

<ConditionalNavigation />
```

## Hook de Permisos

### `usePermissions`
- **Propósito**: Hook personalizado para verificar permisos del usuario
- **Retorna**:
  - Estados de autenticación
  - Roles del usuario
  - Estados del vendedor
  - Permisos específicos
  - Funcionalidades accesibles

```tsx
import { usePermissions } from '@/hooks/usePermissions';

const {
  isAuthenticated,
  isAdmin,
  isVendor,
  isBuyer,
  isVendorApproved,
  isVendorPending,
  isVendorRejected,
  canManageProducts,
  canViewAdminPanel,
  canViewVendorPanel,
  canViewBuyerPanel,
} = usePermissions();
```

## Flujo de Autenticación

### 1. Registro
1. Usuario selecciona rol (comprador/vendedor)
2. Se envía rol en `user_metadata.role`
3. Trigger `on_auth_user_created` ejecuta `handle_user_registration()`
4. Función crea perfil con rol correcto y estado apropiado

### 2. Inicio de Sesión
1. Usuario inicia sesión
2. `AuthContext` carga perfil desde tabla `users`
3. Se establecen claims JWT con rol y estado
4. UI se actualiza según permisos

### 3. Control de Acceso
1. Route Guards verifican permisos antes de renderizar
2. Componentes condicionales muestran/ocultan según rol
3. Navegación se adapta a permisos del usuario

## Estados del Vendedor

- **`pendiente`**: Cuenta creada, en espera de aprobación
- **`aprobado`**: Cuenta activa, puede usar todas las funciones
- **`rechazado`**: Cuenta no aprobada, acceso limitado

## Seguridad

- **RLS**: Todas las tablas tienen políticas Row Level Security
- **JWT Claims**: Roles y estados se incluyen en tokens JWT
- **Validación**: Frontend y backend validan permisos
- **Auditoría**: Cambios críticos se registran en `audit_log`

## Uso Recomendado

1. **Siempre usar Route Guards** para rutas protegidas
2. **Usar `usePermissions`** en lugar de verificar `user.role` directamente
3. **Mostrar estado del vendedor** claramente en la UI
4. **Implementar fallbacks** para usuarios sin permisos
5. **Validar permisos** tanto en frontend como backend

## Ejemplo Completo

```tsx
import React from 'react';
import { VendorRouteGuard, VendorStatusBanner } from '@/components/security';
import { usePermissions } from '@/hooks/usePermissions';

const VendorPage: React.FC = () => {
  const { isVendorApproved, canManageProducts } = usePermissions();

  return (
    <VendorRouteGuard requireApproval={true}>
      <div>
        <VendorStatusBanner />
        
        {isVendorApproved && (
          <div>
            <h1>Panel de Vendedor</h1>
            {canManageProducts && <ProductManager />}
          </div>
        )}
      </div>
    </VendorRouteGuard>
  );
};
```

