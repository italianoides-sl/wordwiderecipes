import type { ContentType } from '@/lib/db/schema';

export type ContentPlanCategory = {
  category:
    | 'marinadas'
    | 'recetas'
    | 'historia'
    | 'tecnicas'
    | 'salsas'
    | 'ingredientes'
    | 'herramientas'
    | 'guias'
    | 'especias';
  quota: number;
  type: ContentType;
  prompt_focus: string;
};

export type HighPriorityGuideTopic = {
  topic: string;
  contentType: 'guide';
  locale: 'es';
  unique_angle: string;
  target_words: number;
};

export const CONTENT_PLAN: ContentPlanCategory[] = [
  {
    category: 'marinadas',
    quota: 100,
    type: 'recipe',
    prompt_focus: `Marinades for every protein and vegetable.
      Each must be unique: different protein, cuisine, flavor profile.
      Korean BBQ, Peruvian anticuchos, Moroccan chermoula, 
      Mexican achiote, Japanese teriyaki, Indian tandoori,
      Greek lemon-herb, Argentinian chimichurri base,
      Caribbean jerk, Thai lemongrass...
      Include: exact ratios, marinating times, chemistry explanation,
      what happens to the protein, 3 variations.`,
  },
  {
    category: 'recetas',
    quota: 700,
    type: 'recipe',
    prompt_focus: `Complete recipes from ALL world cuisines.
      Mix: starters, mains, desserts, breakfasts, street food,
      fine dining, vegetarian, vegan, meat, fish, pasta, rice,
      soups, stews, grilled, baked, fried, raw.
      Cuisines: Mexican, Spanish, Japanese, Italian, French,
      Indian, Thai, Peruvian, Moroccan, Greek, Lebanese, Korean,
      Vietnamese, Chinese, Brazilian, Ethiopian, German, Turkish,
      Argentinian, Colombian, Cuban, Filipino, Indonesian.
      Each recipe must be THE definitive version of that dish.`,
  },
  {
    category: 'historia',
    quota: 70,
    type: 'guide',
    prompt_focus: `Food history and culinary anthropology articles.
      Origin of pasta, spice trade routes, chocolate in Europe,
      history of fermentation, origin of sushi, Silk Road food,
      how coffee conquered the world, origin of street food,
      history of bread, wine in ancient civilizations,
      how refrigeration changed food, history of salt,
      origin of cheese, evolution of Mexican cuisine,
      history of spices in colonial era...
      Must include: real dates, historical figures, trade routes,
      cultural exchanges, surprising facts. Min 1200 words.`,
  },
  {
    category: 'tecnicas',
    quota: 100,
    type: 'technique',
    prompt_focus: `Professional cooking techniques for ambitious home cooks.
      Knife cuts: julienne, brunoise, chiffonade, tournée, paysanne.
      Cooking methods: confit, sous vide, smoking, fermentation,
      braising, poaching, steaming, roasting, sautéing, deep frying.
      Pastry: lamination, tempering chocolate, choux pastry,
      caramelization, meringue types, emulsification.
      Sauce foundations: roux, velouté, béchamel, espagnole,
      hollandaise, mayonnaise, vinaigrette technique.
      Each must include: science behind it, common mistakes,
      how to practice at home, which dishes unlock after mastering.`,
  },
  {
    category: 'salsas',
    quota: 50,
    type: 'recipe',
    prompt_focus: `Sauces, dressings and vinaigrettes.
      Caesar, green goddess, tahini lemon, miso ginger,
      romesco, salsa verde italiana, chimichurri, beurre blanc,
      peanut satay, pomegranate molasses, XO sauce,
      harissa, gochujang glaze, mole negro, salsa macha,
      aioli variations, French vinaigrettes, Asian dressings.
      Include: origin, exact ratios, emulsification technique,
      how to fix if broken, 10 dishes it pairs with,
      storage time, 3 creative variations.`,
  },
  {
    category: 'ingredientes',
    quota: 100,
    type: 'ingredient',
    prompt_focus: `Deep guides on individual ingredients.
      Spices: saffron, cardamom, sumac, za'atar, ras el hanout,
      achiote, epazote, hoja santa, dried chiles.
      Vegetables: heirloom tomatoes, different onion types,
      root vegetables, exotic mushrooms, seaweeds.
      Proteins: wagyu beef, heritage pork, different fish species,
      tofu types, tempeh, legumes.
      Pantry: different vinegars, oils, fermented pastes,
      miso types, soy sauce varieties, fish sauce.
      Each must include: origin, how to buy, how to store,
      flavor profile, 5 recipes that use it,
      substitutes, nutritional value, cultural significance.`,
  },
  {
    category: 'herramientas',
    quota: 50,
    type: 'guide',
    prompt_focus: `Kitchen tools and equipment guides.
      Knives: chef knife, santoku, nakiri, boning knife,
      bread knife, paring knife — how to choose, use, sharpen.
      Cookware: cast iron, carbon steel, stainless, non-stick,
      copper — which to buy, how to season, care.
      Small appliances: immersion blender, stand mixer,
      food processor, mandoline, mortar and pestle.
      Specialized: Japanese mandoline, chinois, tamis,
      blowtorch, thermometers (instant read vs probe),
      Dutch oven, tagine, wok.
      Each guide: what it does, why you need it,
      how to choose quality, how to use correctly,
      how to maintain, best brands by budget.`,
  },
  {
    category: 'guias',
    quota: 80,
    type: 'guide',
    prompt_focus: `Comprehensive culinary guides answering real questions.
      How to build a spice collection from scratch.
      Guide to world cheeses by region.
      Complete guide to cooking oils and smoke points.
      How to season cast iron properly.
      Guide to salt types and when to use each.
      How to stock a Mexican pantry.
      Guide to Japanese pantry essentials.
      How to make restaurant-quality pasta at home.
      Guide to wine and food pairing basics.
      How to set up a home butchery station.
      Understanding umami and how to add it.
      Guide to fermentation at home.
      Complete guide to chiles of Mexico.
      How to read a recipe like a professional chef.
      Guide to knife sharpening for home cooks.
      Each guide: practical, specific, actionable. Min 1000 words.`,
  },
  {
    category: 'especias',
    quota: 50,
    type: 'spice',
    prompt_focus: `Individual spice deep dives.
      Each spice gets its own definitive guide:
      origin country and history, flavor compounds,
      how to buy (whole vs ground, quality indicators),
      how to store, when to add during cooking,
      classic dishes that use it, regional variations,
      health properties, how to blend with other spices,
      substitute if unavailable.
      Cover: black pepper varieties, cinnamon types,
      cumin, coriander, turmeric, ginger, cloves, star anise,
      vanilla, paprika types, sumac, za'atar, caraway,
      fenugreek, mustard seeds, cardamom varieties,
      dried chiles as spices, annatto, epazote...`,
  },
];

export const HIGH_PRIORITY_KITCHEN_THEORY_GUIDES: HighPriorityGuideTopic[] = [
  {
    topic: 'Qué es la mise en place y por qué lo cambia todo en cocina',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Chef profesional explica por qué la mise en place es la diferencia entre un cocinero amateur y uno profesional',
    target_words: 2000,
  },
  {
    topic: 'Cómo comportarse en una cocina profesional: reglas no escritas',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Las reglas de comportamiento que nadie te enseña en la escuela de cocina pero que determinan tu carrera',
    target_words: 2000,
  },
  {
    topic: 'Orden y limpieza en cocina profesional: HACCP explicado',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Por qué el orden y la limpieza no son opcionales en cocina y cómo implementar HACCP sin morir en el intento',
    target_words: 2000,
  },
  {
    topic: 'La prep list diaria: cómo organizarla para no volverse loco',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'El sistema real que usan los chefs profesionales para organizar su día antes del servicio',
    target_words: 2000,
  },
  {
    topic: 'El checklist de apertura y cierre de cocina profesional',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Los checklists exactos que se usan en cocinas de restaurantes reales para no olvidar nada',
    target_words: 2000,
  },
  {
    topic: 'Cómo no tomarse nada personal en la cocina profesional',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'La mentalidad que separa a los cocineros que aguantan de los que se van al mes',
    target_words: 2000,
  },
  {
    topic: 'Comunicación en brigada de cocina: el lenguaje del servicio',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Por qué se grita OUI CHEF y todo lo que necesitas saber sobre comunicación en cocina',
    target_words: 2000,
  },
  {
    topic: 'Gestión del estrés durante el servicio en cocina',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Técnicas reales que usan los chefs para mantener la cabeza fría cuando todo va mal en el pase',
    target_words: 2000,
  },
  {
    topic: 'Cómo leer una receta como un chef profesional',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Lo que un chef ve en una receta que un cocinero amateur no ve — y cómo entrenar esa mirada',
    target_words: 2000,
  },
  {
    topic: 'Temperaturas de seguridad alimentaria que todo cocinero debe memorizar',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Las temperaturas críticas que marcan la diferencia entre cocina segura y un problema de salud pública',
    target_words: 2000,
  },
  {
    topic: 'Cómo organizar tu nevera como un chef profesional',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'El sistema FIFO y la organización de frío que usan los restaurantes aplicada a la cocina de casa',
    target_words: 2000,
  },
  {
    topic: 'El cuchillo de cocina: herramienta, extensión y responsabilidad del chef',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Por qué el cuchillo es la extensión del chef y cómo elegir, cuidar y usar el tuyo correctamente',
    target_words: 2000,
  },
  {
    topic: 'Cómo calcular raciones y escandallos en cocina profesional',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'El escandallo explicado de forma simple para cocineros que quieren entender los números de su cocina',
    target_words: 2000,
  },
  {
    topic: 'El servicio en cocina: ritmo, timing y comunicación con sala',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'Cómo funciona el servicio desde dentro — lo que nunca ves cuando comes en un restaurante',
    target_words: 2000,
  },
  {
    topic: 'Brigada de cocina: jerarquía, roles y responsabilidades',
    contentType: 'guide',
    locale: 'es',
    unique_angle: 'De commis a chef ejecutivo — todos los roles de la brigada clásica y moderna explicados',
    target_words: 2000,
  },
];

export const CONTENT_PLAN_TOTAL = CONTENT_PLAN.reduce(
  (sum, cat) => sum + cat.quota, 0
);

export function getContentPlanCategory(category: string | null) {
  if (!category) return undefined;
  return CONTENT_PLAN.find((item) => item.category === category);
}
