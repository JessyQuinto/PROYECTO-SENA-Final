# 🧪 Testing del Sistema de Login - Tesoros Chocó

## 🔑 Usuarios de Prueba Disponibles

### 👑 Super Administrador (Único)
- **Email**: `admin@tesoros-choco.com`
- **Contraseña**: `admin123`
- **Rol**: `admin`
- **Estado**: `vendedor_estado = NULL` (no aplica para admins)
- **Privilegios**: Acceso completo, puede modificar otros admins

### 🔐 Administrador Regular
- **Email**: `admin@demo.com`
- **Contraseña**: `admin123`
- **Rol**: `admin`
- **Estado**: `vendedor_estado = NULL` (no aplica para admins)
- **Privilegios**: Gestión de usuarios, pero NO puede modificar otros admins

### 🏪 Vendedor Aprobado
- **Email**: `vendedor@demo.com`
- **Contraseña**: `vendedor123`
- **Rol**: `vendedor`
- **Estado**: `vendedor_estado = 'aprobado'`
- **Privilegios**: Puede publicar productos y gestionar pedidos

### 🛒 Comprador
- **Email**: `comprador@demo.com`
- **Contraseña**: `comprador123`
- **Rol**: `comprador`
- **Estado**: `vendedor_estado = NULL` (no aplica para compradores)
- **Privilegios**: Navegar, comprar y calificar productos

## 🚀 Proceso de Testing

### 1. Testing del Super Administrador
```bash
# Login como super-admin
Email: admin@tesoros-choco.com
Password: admin123

# Verificar funcionalidades:
✅ Acceso al panel de administración
✅ Gestión completa de usuarios
✅ Puede modificar otros administradores
✅ Puede eliminar otros administradores
✅ Cambio de roles de usuarios
```

### 2. Testing del Administrador Regular
```bash
# Login como admin regular
Email: admin@demo.com
Password: admin123

# Verificar funcionalidades:
✅ Acceso al panel de administración
✅ Gestión de usuarios (vendedores y compradores)
❌ NO puede modificar otros administradores
❌ NO puede eliminar otros administradores
✅ Cambio de roles (solo vendedor ↔ comprador)
```

### 3. Testing del Vendedor
```bash
# Login como vendedor
Email: vendedor@demo.com
Password: vendedor123

# Verificar funcionalidades:
✅ Acceso al panel de vendedor
✅ Publicar productos
✅ Gestionar pedidos
❌ NO puede acceder a funciones administrativas
```

### 4. Testing del Comprador
```bash
# Login como comprador
Email: comprador@demo.com
Password: comprador123

# Verificar funcionalidades:
✅ Navegar productos
✅ Realizar compras
✅ Gestionar perfil
❌ NO puede publicar productos
❌ NO puede acceder a funciones administrativas
```

## 🔍 Verificación del Sistema de Roles

### Panel de Administración → Gestión de Usuarios

#### Para Super Admin (admin@tesoros-choco.com):
- ✅ Ve todos los usuarios
- ✅ Puede cambiar roles de vendedores y compradores
- ✅ Puede modificar otros administradores
- ✅ Puede eliminar cualquier usuario
- ✅ Ve indicador "👑 Super Administrador"

#### Para Admin Regular (admin@demo.com):
- ✅ Ve todos los usuarios
- ✅ Puede cambiar roles de vendedores y compradores
- ❌ NO puede modificar otros administradores
- ❌ NO puede eliminar otros administradores
- ❌ Ve indicador "🔒 Solo super-admin puede modificar" para otros admins

### Cambio de Roles

#### Roles Permitidos:
- **Comprador ↔ Vendedor**: Cualquier admin puede cambiar
- **Vendedor → Admin**: Solo el super-admin puede promover
- **Admin → Otro rol**: Solo el super-admin puede degradar

#### Restricciones:
- Los vendedores con productos no pueden cambiar de rol
- Los administradores no pueden ser degradados por otros admins
- Solo el super-admin puede modificar roles de administradores

## 🐛 Troubleshooting

### Problema: "Invalid login credentials"
**Solución**: Verificar que las credenciales sean exactas
```bash
# Credenciales correctas del super-admin
Email: admin@tesoros-choco.com (exacto, incluyendo el guión)
Password: admin123
```

### Problema: "No se puede cambiar rol"
**Causa**: El vendedor tiene productos en su inventario
**Solución**: Primero eliminar todos los productos del vendedor

### Problema: "Solo super-admin puede modificar"
**Causa**: Intentando modificar un administrador sin ser super-admin
**Solución**: Usar la cuenta del super-admin (admin@tesoros-choco.com)

### Problema: Superposición en la navegación al cerrar sesión
**Causa**: Estado no se limpia correctamente
**Solución**: Ya corregido en AuthContext.tsx - limpia estado inmediatamente

## 📋 Checklist de Testing

### Funcionalidades Básicas
- [ ] Login exitoso con todas las cuentas
- [ ] Redirección correcta según rol
- [ ] Cierre de sesión limpio
- [ ] No hay superposición en la navegación

### Sistema de Roles
- [ ] Super-admin puede modificar otros admins
- [ ] Admin regular NO puede modificar otros admins
- [ ] Cambio de roles funciona correctamente
- [ ] Restricciones de roles se aplican

### Seguridad
- [ ] RLS funciona correctamente
- [ ] Usuarios solo ven sus datos
- [ ] Admins ven datos de todos los usuarios
- [ ] JWT claims se sincronizan correctamente

### UI/UX
- [ ] Login se ve profesional
- [ ] Mensajes de error son claros
- [ ] Indicadores de rol son visibles
- [ ] Navegación es intuitiva

## 🎯 Casos de Prueba Críticos

### Caso 1: Promoción de Usuario
1. Login como super-admin
2. Ir a Gestión de Usuarios
3. Cambiar rol de comprador a vendedor
4. Verificar que estado se establece como 'pendiente'
5. Aprobar vendedor
6. Verificar que puede acceder al panel de vendedor

### Caso 2: Degradación de Admin
1. Login como super-admin
2. Ir a Gestión de Usuarios
3. Intentar degradar admin regular a comprador
4. Verificar confirmación doble
5. Confirmar degradación
6. Verificar que perdió privilegios administrativos

### Caso 3: Restricciones de Admin Regular
1. Login como admin regular
2. Ir a Gestión de Usuarios
3. Intentar modificar otro admin
4. Verificar que se muestra mensaje de restricción
5. Verificar que botones están deshabilitados

## 📞 Soporte

Si encuentras problemas durante el testing:

1. **Verificar credenciales**: Asegúrate de usar las credenciales exactas
2. **Revisar consola**: Busca errores en la consola del navegador
3. **Verificar base de datos**: Confirmar que los usuarios existen en Supabase
4. **Contactar super-admin**: admin@tesoros-choco.com

## 🔄 Actualizaciones del Sistema

### Cambios Implementados:
- ✅ Sistema de super-admin único
- ✅ Restricción de roles solo a vendedor/comprador
- ✅ UI de login profesional
- ✅ Corrección del bug de navegación
- ✅ Documentación completa del sistema

### Estado Actual:
- **Sistema de roles**: ✅ Funcionando correctamente
- **Seguridad**: ✅ RLS y JWT implementados
- **UI/UX**: ✅ Login profesional y navegación limpia
- **Documentación**: ✅ Completa y actualizada
