# 🔍 SCRIPT DE DIAGNÓSTICO - PROBLEMA DE LOGIN

## Ejecuta este script en la consola del navegador (F12)

```javascript
// Script de diagnóstico completo
console.log('🔍 === DIAGNÓSTICO DE LOGIN ===');

// 1. Verificar si Supabase está disponible
console.log('1. Verificando Supabase...');
if (typeof window !== 'undefined' && window.supabase) {
  console.log('✅ Supabase client disponible');
  console.log('URL:', window.supabase.supabaseUrl);
  console.log('Anon Key configurado:', !!window.supabase.supabaseKey);
} else {
  console.error('❌ Supabase client NO disponible');
}

// 2. Verificar variables de entorno
console.log('2. Verificando variables de entorno...');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'NO configurado');

// 3. Verificar AuthContext
console.log('3. Verificando AuthContext...');
if (window.useAuth) {
  console.log('✅ useAuth hook disponible');
} else {
  console.log('❌ useAuth hook NO disponible');
}

// 4. Verificar formularios
console.log('4. Verificando formularios...');
const loginForm = document.querySelector('form');
if (loginForm) {
  console.log('✅ Formulario de login encontrado');
  console.log('Action:', loginForm.action);
  console.log('Method:', loginForm.method);
} else {
  console.error('❌ Formulario de login NO encontrado');
}

// 5. Verificar botón de login
console.log('5. Verificando botón de login...');
const loginButton = document.querySelector('button[type="submit"]');
if (loginButton) {
  console.log('✅ Botón de login encontrado');
  console.log('Disabled:', loginButton.disabled);
  console.log('Text:', loginButton.textContent);
} else {
  console.error('❌ Botón de login NO encontrado');
}

// 6. Test de conexión a Supabase
console.log('6. Test de conexión a Supabase...');
if (window.supabase) {
  window.supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Error al obtener sesión:', error);
    } else {
      console.log('✅ Conexión a Supabase exitosa');
      console.log('Sesión actual:', data.session ? 'Activa' : 'No hay sesión');
    }
  });
}

// 7. Verificar errores en la consola
console.log('7. Verificando errores...');
const errors = [];
window.addEventListener('error', (e) => {
  errors.push(e.error);
  console.error('❌ Error capturado:', e.error);
});

setTimeout(() => {
  console.log('Total errores capturados:', errors.length);
}, 2000);

console.log('🔍 === FIN DEL DIAGNÓSTICO ===');
```

## Instrucciones:

1. **Abre la consola del navegador** (F12)
2. **Copia y pega el script completo** arriba
3. **Presiona Enter** para ejecutarlo
4. **Revisa los resultados** y compártelos

## Qué buscar:

- ✅ **Verdes**: Todo está bien configurado
- ❌ **Rojos**: Problemas identificados
- 🔍 **Azules**: Información de diagnóstico

## Si hay errores:

1. **Supabase no configurado**: Revisa el archivo `.env.local`
2. **Formulario no encontrado**: Problema con el componente React
3. **Errores de red**: Problema de conectividad
4. **Errores de JavaScript**: Problema en el código

## Después del diagnóstico:

Ejecuta este test de login manual:

```javascript
// Test manual de login
const testLogin = async () => {
  console.log('🔍 Probando login manual...');
  
  if (!window.supabase) {
    console.error('❌ Supabase no disponible');
    return;
  }
  
  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: 'admin@tesoros-choco.com',
      password: 'TesChoco2024!'
    });
    
    if (error) {
      console.error('❌ Error de login:', error);
    } else {
      console.log('✅ Login exitoso:', data);
    }
  } catch (e) {
    console.error('❌ Error inesperado:', e);
  }
};

testLogin();
```
