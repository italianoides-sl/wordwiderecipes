import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { runContentPipeline } from '@/lib/content/pipeline';
import { content, db, type ContentType, type Locale } from '@/lib/db/schema';

type ViralTopic = { topic: string; contentType: ContentType; locale: Locale };

const VIRAL_TOPICS: ViralTopic[] = [
  // RECETAS - Postres
  { topic: "Cheesecake japonés de dos ingredientes sin horno", contentType: "recipe", locale: "es-mx" },
  { topic: "Cheesecake de yogur con topping de frambuesa", contentType: "recipe", locale: "es" },
  { topic: "Cheesecake de yogur y Biscoff", contentType: "recipe", locale: "es-mx" },
  { topic: "Cheesecake japonés alto en proteína versión fit", contentType: "recipe", locale: "es" },
  { topic: "Tarta fría de yogur y galletas estilo japonés", contentType: "recipe", locale: "es-mx" },
  { topic: "Cheesecake estilo San Sebastián versión casera", contentType: "recipe", locale: "es" },
  { topic: "Postre viral de café cremoso sin horno", contentType: "recipe", locale: "es-mx" },
  { topic: "Flan de caramelo y café versión viral", contentType: "recipe", locale: "es" },
  { topic: "Mousse de café ligera para nevera", contentType: "recipe", locale: "es-mx" },
  { topic: "Postre de café bajo en calorías en vasitos", contentType: "recipe", locale: "es" },

  // RECETAS - Carnes y pollo
  { topic: "Kebab saludable de pollo al horno sin aceite", contentType: "recipe", locale: "es-mx" },
  { topic: "Doner kebab casero de res con salsa de yogur", contentType: "recipe", locale: "es" },
  { topic: "Shawarma de carne picada en papel de horno", contentType: "recipe", locale: "es-mx" },
  { topic: "Chicken César bites proteicos para meal prep", contentType: "recipe", locale: "es" },
  { topic: "Wrap viral de pollo César en 15 minutos", contentType: "recipe", locale: "es-mx" },
  { topic: "Tamal de cárcel receta auténtica mexicana", contentType: "recipe", locale: "es-mx" },
  { topic: "Hamburguesa casera jugosa estilo viral", contentType: "recipe", locale: "es" },
  { topic: "Sopita de pollo para congelar y reutilizar", contentType: "recipe", locale: "es-mx" },
  { topic: "Albóndigas de pollo para táper o bowl semanal", contentType: "recipe", locale: "es" },
  { topic: "Pollo jugoso en sartén con mantequilla y limón", contentType: "recipe", locale: "es-mx" },
  { topic: "Pollo asado reciclado en arroz de entre semana", contentType: "recipe", locale: "es" },
  { topic: "Kebab de pollo para meal prep en una sola hornada", contentType: "recipe", locale: "es-mx" },

  // RECETAS - Pescados y mariscos
  { topic: "Pescado frito casero estilo bar de barrio", contentType: "recipe", locale: "es" },
  { topic: "Tacos dorados de camarón con pico de gallo", contentType: "recipe", locale: "es-mx" },
  { topic: "Merluza al vapor con soja limón y jengibre", contentType: "recipe", locale: "es" },
  { topic: "Cachopo de pescado versión casera", contentType: "recipe", locale: "es" },
  { topic: "Filetes de pescado en salsa cremosa de limón y ajo", contentType: "recipe", locale: "es-mx" },
  { topic: "Cazuela de mariscos con sofrito intenso", contentType: "recipe", locale: "es" },
  { topic: "Sopa de marisco con latas y fondo cremoso", contentType: "recipe", locale: "es-mx" },
  { topic: "Crema de pescado rápida para cenas ligeras", contentType: "recipe", locale: "es" },
  { topic: "Caldereta de pescado y marisco de fin de semana", contentType: "recipe", locale: "es" },
  { topic: "Pescado afro con sazón caribeño", contentType: "recipe", locale: "es-mx" },

  // RECETAS - Verduras
  { topic: "Verduras listas en 15 minutos con robot de cocina", contentType: "recipe", locale: "es-mx" },
  { topic: "Tres recetas con verduras de mayo sin repetir", contentType: "recipe", locale: "es" },
  { topic: "Pisto de verduras asadas para toda la semana", contentType: "recipe", locale: "es" },
  { topic: "Zanahorias con salmón ahumado como plato principal", contentType: "recipe", locale: "es-mx" },
  { topic: "Ensalada de brócoli fresca para verano", contentType: "recipe", locale: "es" },
  { topic: "Verduras asadas para batch cooking semanal", contentType: "recipe", locale: "es-mx" },
  { topic: "Bowl de verduras de mayo con vinagreta de mostaza", contentType: "recipe", locale: "es" },
  { topic: "Ensalada de temporada con pollo y vinagreta ligera", contentType: "recipe", locale: "es-mx" },
  { topic: "Pisto exprés con verduras de mayo y huevo", contentType: "recipe", locale: "es" },
  { topic: "Calabacín pimiento y brócoli en una sola bandeja", contentType: "recipe", locale: "es-mx" },

  // RECETAS - Bebidas
  { topic: "Mocktail de sandía y albahaca sin alcohol", contentType: "recipe", locale: "es-mx" },
  { topic: "Bebida de sandía con jamaica y hielo", contentType: "recipe", locale: "es-mx" },
  { topic: "Sangría casera con fruta y especias de verano", contentType: "recipe", locale: "es" },
  { topic: "Té helado casero estilo cafetería", contentType: "recipe", locale: "es-mx" },
  { topic: "Smoothie de fresa y yogur griego proteico", contentType: "recipe", locale: "es" },
  { topic: "Smoothie de papaya y cúrcuma antiinflamatorio", contentType: "recipe", locale: "es-mx" },
  { topic: "Latte con miel batida estilo home café", contentType: "recipe", locale: "es" },
  { topic: "Frappé al flan bebida postre viral de verano", contentType: "recipe", locale: "es-mx" },
  { topic: "Smoothie bowl de verano con toppings crujientes", contentType: "recipe", locale: "es" },
  { topic: "Batido indulgente estilo milkshake de chocolate", contentType: "recipe", locale: "es-mx" },

  // TÉCNICAS - Verduras
  { topic: "Cómo cortar cebolla en ciselado perfecto para sofritos", contentType: "technique", locale: "es" },
  { topic: "Corte pluma de cebolla para fajitas y salteados", contentType: "technique", locale: "es-mx" },
  { topic: "Juliana de cebolla bien hecha para que la textura cambie", contentType: "technique", locale: "es" },
  { topic: "Brunoise en verduras cuándo usarlo y cuándo no", contentType: "technique", locale: "es-mx" },
  { topic: "Bastones de zanahoria perfectos para horno y freidora", contentType: "technique", locale: "es" },
  { topic: "Cómo cortar cebolla sin llorar técnica definitiva", contentType: "technique", locale: "es-mx" },
  { topic: "Cómo usar el robot de cocina sin convertir verduras en puré", contentType: "technique", locale: "es" },
  { topic: "Cortes de verduras para ensalada salteado u horno", contentType: "technique", locale: "es-mx" },
  { topic: "Cómo elegir y afilar el cuchillo correcto para cocinar", contentType: "technique", locale: "es" },
  { topic: "Mise en place vegetal para empezar el meal prep sin estrés", contentType: "technique", locale: "es-mx" },

  // TÉCNICAS - Carnes
  { topic: "Despiece de pollo paso a paso para ahorrar dinero", contentType: "technique", locale: "es-mx" },
  { topic: "Temperaturas correctas del pollo y la res sin termómetro", contentType: "technique", locale: "es" },
  { topic: "Regla del pollo jugoso al horno 25 minutos por kilo", contentType: "technique", locale: "es-mx" },
  { topic: "Cómo sellar carne correctamente para costra y jugosidad", contentType: "technique", locale: "es" },
  { topic: "Cómo formar un kebab casero que no se rompa al cortar", contentType: "technique", locale: "es-mx" },
  { topic: "Cómo marinar pollo para máximo sabor y jugosidad", contentType: "technique", locale: "es" },
  { topic: "Cómo reaprovechar pollo asado con método y sin desperdiciar", contentType: "technique", locale: "es-mx" },
  { topic: "Técnica de sartén para pechuga de pollo jugosa sin secar", contentType: "technique", locale: "es" },
  { topic: "Cómo usar la freidora de aire para pollo crujiente", contentType: "technique", locale: "es-mx" },
  { topic: "Sellado reposo y sazón la tríada mínima para carne perfecta", contentType: "technique", locale: "es" },

  // TÉCNICAS - Pescados
  { topic: "Cómo cocinar pescado a la plancha sin que se rompa ni pegue", contentType: "technique", locale: "es-mx" },
  { topic: "La técnica de secado y sartén caliente para pescado perfecto", contentType: "technique", locale: "es" },
  { topic: "Atún salmón y bacalao no se cocinan igual guía de tiempos", contentType: "technique", locale: "es-mx" },
  { topic: "Merluza al vapor con textura jugosa y sabor limpio", contentType: "technique", locale: "es" },
  { topic: "Salsas cortas para pescado blanco que parecen de restaurante", contentType: "technique", locale: "es-mx" },
  { topic: "La base de sofrito para cazuelas y sopas de marisco", contentType: "technique", locale: "es" },
  { topic: "Cómo freír pescado con crujiente perfecto sin resecar", contentType: "technique", locale: "es-mx" },
  { topic: "Cómo evitar que el pescado se pegue a la sartén", contentType: "technique", locale: "es" },
  { topic: "Cocina marina para freidora de aire tiempos y temperaturas", contentType: "technique", locale: "es-mx" },
  { topic: "Cómo limpiar y preparar marisco fresco en casa", contentType: "technique", locale: "es" },

  // GUÍAS - Meal prep
  { topic: "Batch cooking vs meal prep diferencias y cuándo usar cada uno", contentType: "guide", locale: "es-mx" },
  { topic: "Guía completa de meal prep por proteínas verduras y carbohidratos", contentType: "guide", locale: "es" },
  { topic: "Ocho preparaciones en dos horas la plantilla semanal definitiva", contentType: "guide", locale: "es-mx" },
  { topic: "Cómo cocinar para toda la semana en dos horas sin aburrirse", contentType: "guide", locale: "es" },
  { topic: "Cómo armar cuatro bases de menú y dejar de improvisar", contentType: "guide", locale: "es-mx" },
  { topic: "El método de cocinar una vez y comer cinco días", contentType: "guide", locale: "es" },
  { topic: "Cómo hacer meal prep que no sepa a sobras tristes", contentType: "guide", locale: "es-mx" },
  { topic: "Planificación semanal empezando por proteínas no por platos", contentType: "guide", locale: "es" },

  // GUÍAS - Menús y temporada
  { topic: "Frutas y verduras de mayo guía de compra y cocina", contentType: "guide", locale: "es" },
  { topic: "Menú semanal de mayo para dejar de improvisar cada día", contentType: "guide", locale: "es-mx" },
  { topic: "Qué comprar en mayo para comer mejor gastando menos", contentType: "guide", locale: "es" },
  { topic: "Cómo convertir verduras de mayo en desayunos comidas y cenas", contentType: "guide", locale: "es-mx" },
  { topic: "El menú que nace de un pisto verduras asadas y dos proteínas", contentType: "guide", locale: "es" },
  { topic: "Guía de temporada para primavera tardía ingredientes y recetas", contentType: "guide", locale: "es-mx" },
  { topic: "Menús de temporada para junio con enfoque saludable", contentType: "guide", locale: "es" },
  { topic: "Calendario de producto de temporada primavera verano España y México", contentType: "guide", locale: "es-mx" },

  // GUÍAS - Planificación y salud
  { topic: "Cómo usar el método del plato sin obsesionarse con macros", contentType: "guide", locale: "es" },
  { topic: "Cómo planificar la semana para ahorrar dinero y reducir estrés", contentType: "guide", locale: "es-mx" },
  { topic: "Cómo pasar de ver recetas a tener un sistema de alimentación", contentType: "guide", locale: "es" },
  { topic: "La cocina de mayo en una guía verduras pescado postre y bebida", contentType: "guide", locale: "es-mx" },
  { topic: "Las cinco tendencias culinarias más claras para junio 2026", contentType: "guide", locale: "es" },
  { topic: "Cómo aprovechar la ola de bebidas frías sin descuidar el evergreen", contentType: "guide", locale: "es-mx" },
  { topic: "Guía para detectar cuándo una moda de TikTok ya es oportunidad SEO", contentType: "guide", locale: "es" },
  { topic: "Manual para convertir señales sociales en artículos que posicionen", contentType: "guide", locale: "es-mx" },
];

const BATCH_SIZE = 5;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  const headerSecret = request.headers.get('x-cron-secret');
  return Boolean(secret && (authorization === `Bearer ${secret}` || headerSecret === secret));
}

function inferCategory(contentType: ContentType): string {
  if (contentType === 'technique') return 'tecnicas';
  if (contentType === 'guide') return 'guias';
  return 'recetas';
}

async function getPublishedTitles() {
  const existing = await db
    .select({ title: content.title })
    .from(content)
    .where(eq(content.status, 'published'));

  return new Set(existing.map((row) => row.title.toLowerCase()));
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const publishedTitles = await getPublishedTitles();

    const pending = VIRAL_TOPICS.filter((t) => !publishedTitles.has(t.topic.toLowerCase()));

    const batch = pending.slice(0, BATCH_SIZE);

    if (batch.length === 0) {
      return Response.json({
        success: true,
        message: 'All viral topics published',
        total: VIRAL_TOPICS.length,
        remaining: 0,
      });
    }

    const jobs: Array<Record<string, unknown>> = [];
    let generated = 0;

    for (const item of batch) {
      const result = await runContentPipeline({
        topic: item.topic,
        contentType: item.contentType,
        locale: item.locale,
        jobType: 'bootstrap',
        promptVersion: process.env.CONTENT_PROMPT_VERSION ?? 'v1.0',
        contentCategory: inferCategory(item.contentType),
      });

      jobs.push({ topic: item.topic, ...result });
      if (result.success) generated += 1;
    }

    const remaining = pending.length - batch.length;

    console.log(
      `Bootstrap batch: ${generated}/${batch.length} published. ${remaining} topics remaining.`,
    );

    return Response.json({
      success: true,
      generated,
      attempted: batch.length,
      remaining,
      total: VIRAL_TOPICS.length,
      next_batch: remaining > 0 ? '/api/cron/bootstrap' : null,
      jobs,
    });
  } catch (err) {
    console.error('Bootstrap cron error:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export const GET = POST;
