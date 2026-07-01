import prisma from '@/lib/prisma';

const DEFAULT_BRANDING = {
  nombre_negocio: 'Mi Licorería',
  logo_url: '',
  color_tema: '#8B6914',
};

export async function getBrandingConfig() {
  try {
    const rows = await prisma.configuracion.findMany({
      where: { clave: { in: ['nombre_negocio', 'logo_url', 'color_tema'] } },
    });
    const map = Object.fromEntries(rows.map((row) => [row.clave, row.valor]));

    return {
      nombre_negocio: map.nombre_negocio?.trim() || DEFAULT_BRANDING.nombre_negocio,
      logo_url: map.logo_url?.trim() || '',
      color_tema: map.color_tema?.trim() || DEFAULT_BRANDING.color_tema,
    };
  } catch {
    return { ...DEFAULT_BRANDING };
  }
}

export function getBrandTitle(nombreNegocio) {
  const name = nombreNegocio?.trim() || DEFAULT_BRANDING.nombre_negocio;
  return `${name} - Sistema de Gestión`;
}

export function getBrandIconHref(logoUrl) {
  const url = logoUrl?.trim();
  return url || '/api/branding/icon';
}

export function buildBrandIconSvg({ nombre_negocio, color_tema }) {
  const letter = (nombre_negocio?.trim() || 'L').charAt(0).toUpperCase();
  const color = color_tema?.trim() || DEFAULT_BRANDING.color_tema;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="${nombre_negocio || 'Logo'}">
  <rect width="32" height="32" rx="8" fill="${color}"/>
  <text x="16" y="21" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="700" fill="#fff">${letter}</text>
</svg>`;
}
