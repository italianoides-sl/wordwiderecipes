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

export const CONTENT_PLAN_TOTAL = CONTENT_PLAN.reduce(
  (sum, cat) => sum + cat.quota, 0
);

export function getContentPlanCategory(category: string | null) {
  if (!category) return undefined;
  return CONTENT_PLAN.find((item) => item.category === category);
}
