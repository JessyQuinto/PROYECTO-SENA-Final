
```markdown
# 📏 reglas_negocio.md

## 🎯 Objetivo del sistema

Crear un marketplace funcional para la compra y venta de productos artesanales, donde compradores puedan adquirir productos, vendedores gestionen sus ofertas, y un administrador supervise y regule el funcionamiento general del sistema.

---

## 👥 Roles y responsabilidades

| Rol          | Funciones principales |
|--------------|------------------------|
| **Administrador** | Aprobar vendedores, gestionar usuarios, categorías y productos reportados |
| **Vendedor**      | Publicar productos, gestionar inventario, atender pedidos |
| **Comprador**     | Navegar productos, realizar compras, calificar |

---

## 📌 Reglas de negocio por rol

### 🧑‍💼 Administrador

- Puede aprobar o rechazar vendedores registrados.
- Puede bloquear productos o usuarios (vendedores o compradores).
- Puede crear, editar y eliminar categorías artesanales.
- Puede ver métricas globales del sistema.
- Puede ver todos los pedidos, productos y usuarios.
- No puede realizar compras ni publicar productos.

---

### 🧑‍🎨 Vendedor

- Puede registrarse, pero debe ser aprobado por un administrador para empezar a publicar productos.
- Solo puede ver y editar sus propios productos y pedidos.
- Puede subir imágenes de sus productos (vía Cloudinary).
- Cada producto debe tener: nombre, precio, descripción, categoría, stock e imagen.
- No puede crear categorías.
- No puede modificar pedidos una vez confirmados por el comprador.
- No puede eliminar productos si tienen pedidos asociados.

---

### 🛒 Comprador

- Puede navegar por todos los productos disponibles.
- Puede filtrar por categoría, nombre, ubicación, precio.
- Puede agregar productos al carrito y simular un proceso de compra.
- Solo puede comprar productos con stock disponible.
- Puede ver su historial de pedidos.
- Puede dejar calificaciones (una por producto comprado).
- No puede editar ni eliminar productos ni pedidos.
- No puede ver datos de contacto del vendedor (por ahora).

---

## 🔁 Flujos de interacción por rol

### 1. Registro y autenticación
```

\[Usuario (elige rol)] → \[Formulario de registro] → \[Supabase Auth crea cuenta]
→

* Si comprador → acceso inmediato
* Si vendedor → estado = "pendiente"

```

---

### 2. Aprobación de vendedores
```

\[Admin] → \[Panel de aprobación] → \[Ver perfil de vendedor pendiente]
→
\[Aprueba o rechaza]
→

* Si aprobado → puede acceder a su panel y publicar
* Si rechazado → recibe notificación por correo

```

---

### 3. Publicación de productos
```

\[Vendedor] → \[Formulario de producto] → \[Valida campos + sube imagen a Cloudinary]
→
\[Producto se guarda en Supabase con estado = "activo"]
→
Disponible para compradores

```

---

### 4. Compra de productos
```

\[Comprador] → \[Agrega al carrito] → \[Confirma compra]
→
\[Se crea pedido en Supabase con estado = "pendiente"]
→
\[Email al vendedor con el pedido]
→
\[Vendedor marca como "enviado" manualmente por ahora]

```

---

### 5. Calificación de productos
```

\[Comprador] → \[Ver historial de pedidos] → \[Dejar calificación]
→
\[Se guarda una evaluación por pedido + producto]
→
\[No se puede editar ni eliminar]

```

---

## 📦 Estados de entidades clave

### Vendedores
| Estado               | Descripción                        |
|----------------------|------------------------------------|
| `pendiente` | Registrado, esperando revisión    |
| `aprobado`            | Puede operar como vendedor         |
| `rechazado`           | No puede acceder a funcionalidades |

---

### Productos
| Estado     | Descripción                                      |
|------------|--------------------------------------------------|
| `activo`   | Visible para compradores, disponible para venta |
| `inactivo` | Oculto temporalmente (manual o por admin)       |
| `bloqueado`| Reportado o removido por el admin               |

---

### Pedidos (orders)
| Estado        | Descripción |
|---------------|-------------|
| `pendiente`   | Pedido creado; validando pago simulado / reserva |
| `procesando`  | Confirmado tras simulación de pago |
| `enviado`     | Todos los ítems marcados como enviados |
| `entregado`   | Confirmado por comprador (recepción) |
| `cancelado`   | Cancelado antes de envío / error |

---

### Evaluaciones
- Cada comprador solo puede dejar una evaluación por producto comprado.
- Las evaluaciones no son editables ni eliminables.
- Las evaluaciones se muestran como promedio en cada producto.

---

## ⚠️ Validaciones generales

- Todos los campos obligatorios deben ser validados en frontend y backend.
- No se puede registrar con un correo ya existente.
- Un producto no puede tener precio negativo ni stock menor a cero.
- Un vendedor no puede eliminar productos que ya tienen ítems de pedidos.
- Evaluación solo disponible si el pedido (o ítem) está en `enviado` o `entregado`.
- Los administradores no pueden ser eliminados desde el frontend.
- La autenticación y las rutas están protegidas por rol.

---

## 🚧 Reglas futuras (a validar o implementar más adelante)

- Política de devoluciones.
- Suspensión automática por reportes.
- Cálculo de comisión por venta.
- Visualización de métricas (ventas por día, mes, etc.)
- Funcionalidad de favoritos para compradores.

```
