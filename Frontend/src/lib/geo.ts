export type Departamento = string;
export type Ciudad = string;

// Catálogo básico Colombia (enfocado en Chocó + algunos deptos comunes)
const CO_DEPARTAMENTOS: Record<Departamento, Ciudad[]> = {
  Chocó: [
    'Quibdó',
    'Istmina',
    'Tadó',
    'Condoto',
    'Acandí',
    'Bahía Solano',
    'Nuquí',
    'Riosucio',
    'Unguía',
    'Lloró',
  ],
  Antioquia: ['Medellín', 'Envigado', 'Bello', 'Itagüí', 'Rionegro'],
  Cundinamarca: ['Soacha', 'Chía', 'Zipaquirá', 'Facatativá', 'Mosquera'],
  'Valle del Cauca': ['Cali', 'Palmira', 'Yumbo', 'Tuluá', 'Buga'],
  'Bogotá D.C.': ['Bogotá'],
};

export function getDepartamentos(): Departamento[] {
  return Object.keys(CO_DEPARTAMENTOS);
}

export function getCiudades(departamento: Departamento | undefined): Ciudad[] {
  if (!departamento) return [];
  return CO_DEPARTAMENTOS[departamento] ?? [];
}
