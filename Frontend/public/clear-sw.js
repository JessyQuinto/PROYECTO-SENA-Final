// Script de emergencia para limpiar service workers
// Ejecutar en la consola del navegador para detener el bucle infinito

console.log('🚨 Emergency service worker cleanup...');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister();
      console.log('🗑️ Unregistered service worker:', registration);
    }
  });

  // También limpiar caches
  caches.keys().then(function (names) {
    for (let name of names) {
      caches.delete(name);
      console.log('🗑️ Deleted cache:', name);
    }
  });
}

console.log('✅ Service worker cleanup completed. Please refresh the page.');
