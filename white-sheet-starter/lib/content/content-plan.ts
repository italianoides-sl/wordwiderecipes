import type { ContentType } from './types';

export type PlannedTopic = {
  topic: string;
  type: ContentType;
  category: string;
  cluster: string;
  uniqueAngle: string;
};

export const STARTER_TOPICS: PlannedTopic[] = [
  {
    topic: 'Cómo elegir la mejor herramienta para empezar en tu nicho',
    type: 'guide',
    category: 'fundamentos',
    cluster: 'inicio',
    uniqueAngle: 'guía de decisión para principiantes con criterio editorial real',
  },
  {
    topic: 'Errores comunes que frenan resultados en este nicho',
    type: 'article',
    category: 'fundamentos',
    cluster: 'errores-comunes',
    uniqueAngle: 'enfoque práctico con soluciones aplicables hoy mismo',
  },
  {
    topic: 'Comparativa definitiva entre dos enfoques populares del nicho',
    type: 'comparison',
    category: 'comparativas',
    cluster: 'decision',
    uniqueAngle: 'comparación con casos de uso y tradeoffs claros',
  },
];
