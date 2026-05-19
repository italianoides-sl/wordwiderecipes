export const affiliateProducts = {
  tortillaPress: ['prensa para tortillas', 'tortilla press', 'masa harina'],
  chefKnife: ['cuchillo de chef', 'tabla de cortar', 'afilador'],
  spiceGrinder: ['molinillo de especias', 'mortero', 'comino', 'pimienta'],
  paellaPan: ['paellera', 'arroz bomba', 'azafran'],
  thermometer: ['termometro de cocina', 'freidora', 'horno'],
} as const;

export type AffiliateProductKey = keyof typeof affiliateProducts;
