# Sistema de Roles - Tesoros Chocó

## Visión General

El sistema de Tesoros Chocó implementa un modelo de roles jerárquico y seguro que garantiza la separación de responsabilidades y el control de acceso apropiado.

## Estructura de Roles

### 👑 Super Administrador
- **Email**: `admin@tesoros-choco.com`
- **Contraseña**: `admin123`
- **Privilegios**: 
  - Acceso completo a todas las funcionalidades del sistema
  - Único que puede modificar otros administradores
  - Único que puede eliminar otros administradores
  - Gestión completa de usuarios, productos y configuraciones
- **Restricciones**: Ninguna

### 🔐 Administradores
- **Privilegios**:
  - Gestión de usuarios (vendedores y compradores)
  - Aprobación/rechazo de vendedores
  - Bloqueo/desbloqueo de usuarios
  - Acceso al panel de administración
- **Restricciones**:
  - No pueden modificar otros administradores
  - No pueden eliminar otros administradores
  - Solo el super-admin puede degradarlos

### 🏪 Vendedores
- **Privilegios**:
  - Publicar y gestionar productos
  - Gestionar pedidos de sus productos
  - Acceso al panel de vendedor
- **Restricciones**:
  - Requieren aprobación del administrador
  - Solo pueden gestionar sus propios productos
  - No pueden acceder a funciones administrativas

### 🛒 Compradores
- **Privilegios**:
  - Navegar y comprar productos
  - Gestionar su perfil y pedidos
  - Calificar productos comprados
- **Restricciones**:
  - No pueden publicar productos
  - No pueden acceder a funciones administrativas

## Flujo de Creación de Usuarios

### Registro Público
1. **Compradores**: Registro directo, acceso inmediato
2. **Vendedores**: Registro directo, pero requieren aprobación del administrador

### Creación por Administradores
1. **Compradores**: Cualquier admin puede crear
2. **Vendedores**: Cualquier admin puede crear (estado: pendiente)
3. **Administradores**: Solo el super-admin puede crear

## Gestión de Roles

### Cambio de Roles
- **Comprador ↔ Vendedor**: Cualquier admin puede cambiar
- **Vendedor → Admin**: Solo el super-admin puede promover
- **Admin → Otro rol**: Solo el super-admin puede degradar

### Restricciones de Cambio
- Los vendedores con productos no pueden cambiar de rol
- Los administradores no pueden ser degradados por otros admins
- Solo el super-admin puede modificar roles de administradores

## Seguridad

### Row Level Security (RLS)
- Cada usuario solo ve sus propios datos
- Los administradores ven datos de todos los usuarios
- Los vendedores solo ven sus propios productos y pedidos

### JWT Claims
- Los roles se almacenan en `auth.users.raw_app_meta_data.role`
- Se sincronizan automáticamente con la tabla `public.users`
- Se validan en cada operación sensible

### Auditoría
- Todas las acciones administrativas se registran
- Cambios de rol se auditan automáticamente
- Bloqueos y suspensiones se registran

## Casos de Uso

### Escenario 1: Nuevo Vendedor
1. Usuario se registra como vendedor
2. Estado inicial: `pendiente`
3. Administrador revisa y aprueba/rechaza
4. Si es aprobado, puede publicar productos

### Escenario 2: Promoción de Usuario
1. Administrador cambia rol de comprador a vendedor
2. Estado automáticamente se establece como `pendiente`
3. Requiere aprobación antes de poder vender

### Escenario 3: Degradación de Admin
1. Solo el super-admin puede degradar administradores
2. Se requiere confirmación doble
3. Se registra en auditoría
4. El usuario pierde todos los privilegios administrativos

## Configuración

### Variables de Entorno
```bash
# Super admin por defecto
SUPER_ADMIN_EMAIL=admin@tesoros-choco.com
SUPER_ADMIN_PASSWORD=admin123
```

### Base de Datos
```sql
-- Tabla de usuarios con roles
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('admin', 'vendedor', 'comprador')),
  vendedor_estado TEXT CHECK (vendedor_estado IN ('pendiente', 'aprobado', 'rechazado')),
  bloqueado BOOLEAN DEFAULT FALSE,
  nombre_completo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas RLS para seguridad
-- ... (ver archivo rls_policies.md)
```

## Mantenimiento

### Crear Nuevo Super Admin
```sql
-- Solo ejecutar en emergencias
INSERT INTO users (id, email, role, vendedor_estado, nombre_completo)
VALUES (
  'uuid-del-usuario',
  'nuevo-super-admin@email.com',
  'admin',
  NULL,
  'Nuevo Super Admin'
);
```

### Backup de Roles
```sql
-- Exportar configuración actual
SELECT email, role, vendedor_estado, bloqueado 
FROM users 
ORDER BY role, email;
```

## Notas Importantes

1. **Nunca** crear administradores desde el registro público
2. **Siempre** verificar permisos antes de operaciones sensibles
3. **Mantener** el super-admin como único punto de control
4. **Auditar** regularmente los cambios de roles
5. **Documentar** cualquier cambio en la estructura de roles

## Contacto

Para cambios en el sistema de roles o emergencias, contactar al super-administrador:
- **Email**: admin@tesoros-choco.com
- **Sistema**: Panel de administración → Gestión de Usuarios
