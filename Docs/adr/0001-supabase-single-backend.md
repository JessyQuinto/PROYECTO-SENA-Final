# ADR 0001: Unificación en Supabase como Backend Único

Fecha: 2024-01-01
Estado: Aprobado

## Contexto
Existía diseño previo con Postgres dedicado + servicios externos (Encore, Cloudinary). Generaba duplicidad de configuración, mayor superficie de seguridad y complejidad operativa.

## Decisión
Adoptar un único backend gestionado por Supabase (Auth, Postgres, Storage, Edge Functions) eliminando Encore y Cloudinary.

## Consecuencias
Positivas:
- Simplificación de despliegue y costos.
- RLS nativo + Policies uniformes.
- Menor latencia intrínseca entre servicios.
Negativas:
- Dependencia concentrada en un proveedor.
- Límite de cuotas gratis puede requerir upgrade antes.

## Alternativas Consideradas
1. Postgres propio + librerías: + control; − esfuerzo devops.
2. Backend framework (Encore) + DB: + scaffolding; − duplicidad Auth/Storage.

## Métricas de Validación
- Time-to-first-feature backend < 1 día.
- Reducción scripts infra > 70%.

## Revisión Futura
Reevaluar si: concurrencia sostenida > X req/s o necesidad de servicios especializados (ML, búsqueda avanzada fuera de Postgres).
