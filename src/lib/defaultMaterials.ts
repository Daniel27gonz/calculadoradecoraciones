export interface MaterialCategory {
  id: string;
  name: string;
  icon: string;
  materials: string[];
}

export const defaultMaterialCategories: MaterialCategory[] = [
  {
    id: 'globos',
    name: 'Globos',
    icon: '🎈',
    materials: [
      'Globos de látex 5"',
      'Globos de látex 9"',
      'Globos de látex 10"',
      'Globos de látex 12"',
      'Globos de látex 18"',
      'Globos cromados',
      'Globos metalizados (foil)',
      'Globos transparentes (burbujas)',
      'Globos impresos',
      'Globos con confeti',
      'Globos largos 260 (para figuras)',
      'Globos largos 360 (para figuras)',
      'Globos gigantes 24"',
      'Globos gigantes 36"',
    ],
  },
  {
    id: 'herramientas-sujecion',
    name: 'Herramientas y Sujeción',
    icon: '🧵',
    materials: [
      'Cinta para globos (tira armadora)',
      'Puntos de silicona (glue dots)',
      'Hilo nylon / tanza',
      'Cinta doble cara',
      'Ligas / elásticos',
      'Grapas plásticas',
      'Alambre galvanizado delgado',
    ],
  },
  {
    id: 'estructuras-bases',
    name: 'Estructuras y Bases',
    icon: '🪛',
    materials: [
      'Arcos metálicos',
      'Arcos orgánicos (estructura flexible)',
      'Columnas para globos',
      'Bases plásticas con agua o arena',
      'Tubos de PVC',
      'Marcos circulares',
      'Marcos hexagonales',
      'Marcos cuadrados',
      'Soportes para globos individuales',
    ],
  },
  {
    id: 'inflado',
    name: 'Inflado',
    icon: '💨',
    materials: [
      'Bomba manual',
      'Inflador eléctrico',
      'Compresor',
      'Tanque de helio',
    ],
  },
  {
    id: 'herramientas-basicas',
    name: 'Herramientas Básicas',
    icon: '✂️',
    materials: [
      'Tijeras',
      'Cortador / cúter',
      'Pinzas',
      'Regla o cinta métrica',
    ],
  },
  {
    id: 'decoracion-complementaria',
    name: 'Decoración Complementaria',
    icon: '🎨',
    materials: [
      'Flores artificiales',
      'Flores naturales',
      'Follaje artificial',
      'Telas (tul)',
      'Telas (organza)',
      'Telas (lycra)',
      'Letras 3D',
      'Números 3D',
      'Luces LED',
      'Backings (fondos decorativos)',
      'Carteles personalizados',
      'Stickers o viniles decorativos',
    ],
  },
  {
    id: 'proteccion-acabado',
    name: 'Protección y Acabado',
    icon: '🧴',
    materials: [
      'Gel sellador para globos (Hi-Float)',
      'Spray abrillantador',
      'Paños de limpieza',
    ],
  },
  {
    id: 'organizacion-transporte',
    name: 'Organización y Transporte',
    icon: '📦',
    materials: [
      'Bolsas para globos',
      'Cajas de transporte',
      'Maletas organizadoras',
      'Pesas para globos',
    ],
  },
  {
    id: 'opcional-negocio',
    name: 'Opcional para Negocio',
    icon: '🧠',
    materials: [
      'Paleta de colores',
      'Catálogo de diseños',
      'Kit de reparación',
      'Extensión eléctrica',
    ],
  },
];
