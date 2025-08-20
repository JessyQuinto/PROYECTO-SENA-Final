import React from 'react';

interface IconProps {
  category: string; // Carpeta dentro de /public (p.ej. "Carrito y checkout")
  name: string; // Nombre de archivo sin .svg
  className?: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
}

export const Icon: React.FC<IconProps> = ({ category, name, className, alt, width, height }) => {
  // Aliases para mapear nombres lógicos a archivos reales en /public
  const ICON_ALIASES: Record<string, Record<string, string>> = {
    'Administrador': {
      // Navegación/Secciones
      'Users': 'TablerUsers',
      'Gavel': 'FluentGavel32Filled',
      'BarChart3': 'SimpleIconsGoogleanalytics',
      'History': 'LucideFileClock',
    },
  };

  const normalizedCategory = category;
  const categoryAliases = ICON_ALIASES[normalizedCategory] || {};
  const resolvedName = categoryAliases[name] || name;

  // Codificar cada segmento por si contiene espacios o caracteres especiales
  const src = `/${encodeURIComponent(normalizedCategory)}/${encodeURIComponent(resolvedName)}.svg`;

  return (
    <img
      src={src}
      alt={alt || name}
      className={className}
      width={width}
      height={height}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        if (target.src.endsWith('.svg')) {
          target.src = '/favicon.svg';
        }
      }}
    />
  );
};

export default Icon;


