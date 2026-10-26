// ============================================================
// Catálogo de carreras y materias de Sereno — para TODAS las áreas,
// no solo Ingeniería. Se usa en onboarding, plan de estudio, parcial
// abierto, quizzes, etc., para sugerir materias relevantes a cada quien.
// ============================================================

export type CareerArea = {
  key: string;
  // Materias/temas típicos del área (sugerencias, el usuario puede escribir otras).
  subjects: string[];
};

// Áreas amplias que cubren la mayoría de carreras universitarias.
// Las etiquetas visibles se traducen con i18n (areaLabels); aquí viven las
// materias en un español neutro que la IA entiende en cualquier idioma.
export const CAREER_AREAS: CareerArea[] = [
  {
    key: "design",
    subjects: [
      "Teoría del color",
      "Tipografía",
      "Composición y diseño",
      "Diseño gráfico",
      "Historia del diseño",
      "Diseño UX/UI",
      "Branding e identidad",
      "Ilustración",
      "Diseño editorial",
      "Semiótica",
    ],
  },
  {
    key: "arts",
    subjects: [
      "Historia del arte",
      "Dibujo",
      "Pintura",
      "Escultura",
      "Fotografía",
      "Teoría del arte",
      "Arte contemporáneo",
      "Estética",
    ],
  },
  {
    key: "architecture",
    subjects: [
      "Teoría de la arquitectura",
      "Diseño arquitectónico",
      "Historia de la arquitectura",
      "Estructuras",
      "Urbanismo",
      "Representación y planos",
      "Materiales de construcción",
    ],
  },
  {
    key: "music",
    subjects: ["Teoría musical", "Armonía", "Historia de la música", "Solfeo", "Composición", "Contrapunto"],
  },
  {
    key: "law",
    subjects: [
      "Derecho civil",
      "Derecho penal",
      "Derecho constitucional",
      "Derecho administrativo",
      "Teoría del derecho",
      "Derecho comercial",
      "Derecho internacional",
      "Procedimiento civil",
    ],
  },
  {
    key: "medicine",
    subjects: [
      "Anatomía",
      "Fisiología",
      "Bioquímica",
      "Histología",
      "Farmacología",
      "Patología",
      "Microbiología",
      "Semiología",
    ],
  },
  {
    key: "health",
    subjects: ["Enfermería", "Nutrición", "Fisioterapia", "Salud pública", "Primeros auxilios", "Psicología de la salud"],
  },
  {
    key: "psychology",
    subjects: [
      "Psicología general",
      "Psicología del desarrollo",
      "Psicología social",
      "Neuropsicología",
      "Psicología clínica",
      "Estadística para psicología",
      "Teorías de la personalidad",
    ],
  },
  {
    key: "business",
    subjects: [
      "Contabilidad",
      "Finanzas",
      "Marketing",
      "Administración",
      "Microeconomía",
      "Macroeconomía",
      "Estadística",
      "Gestión de proyectos",
      "Recursos humanos",
    ],
  },
  {
    key: "economics",
    subjects: ["Microeconomía", "Macroeconomía", "Econometría", "Estadística", "Finanzas", "Historia económica", "Teoría de juegos"],
  },
  {
    key: "communication",
    subjects: [
      "Teoría de la comunicación",
      "Periodismo",
      "Redacción",
      "Publicidad",
      "Comunicación digital",
      "Semiótica",
      "Producción audiovisual",
    ],
  },
  {
    key: "socialsciences",
    subjects: [
      "Sociología",
      "Antropología",
      "Ciencia política",
      "Filosofía",
      "Historia",
      "Relaciones internacionales",
      "Metodología de la investigación",
    ],
  },
  {
    key: "languages",
    subjects: ["Gramática", "Literatura", "Lingüística", "Redacción", "Inglés", "Francés", "Comprensión lectora"],
  },
  {
    key: "lifesciences",
    subjects: ["Biología", "Química", "Química orgánica", "Genética", "Ecología", "Bioquímica", "Botánica"],
  },
  {
    key: "engineering",
    subjects: [
      "Programación (Python)",
      "Cálculo",
      "Cálculo diferencial",
      "Física",
      "Álgebra lineal",
      "Estructuras de datos",
      "Redes y subnetting (IP)",
      "Bases de datos",
      "Ecuaciones diferenciales",
      "Estadística",
    ],
  },
];

/** Devuelve las materias sugeridas para un área (o una mezcla general). */
export function subjectsForArea(areaKey?: string): string[] {
  if (areaKey) {
    const area = CAREER_AREAS.find((a) => a.key === areaKey);
    if (area) return area.subjects;
  }
  // Sin área: una selección variada y transversal.
  return [
    "Redacción",
    "Estadística",
    "Historia",
    "Metodología de la investigación",
    "Inglés",
    "Filosofía",
  ];
}

/**
 * Heurística para adivinar el área a partir del texto de carrera que escribió
 * el estudiante (ej. "Diseño gráfico" -> design). Devuelve undefined si no es claro.
 */
export function guessArea(career?: string): string | undefined {
  if (!career) return undefined;
  const c = career
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const rules: [RegExp, string][] = [
    [/dise|grafic|\bux\b|\bui\b|moda|textil|tipograf|composic|\bcolor\b|branding|maqueta/, "design"],
    [/arte|artes|plastic|bellas|ilustr/, "arts"],
    [/arquitect/, "architecture"],
    [/music/, "music"],
    [/derecho|juridic|leyes|abog/, "law"],
    [/medic|cirug/, "medicine"],
    [/enfermer|nutric|fisioterap|odontolog|salud/, "health"],
    [/psicolog/, "psychology"],
    [/administr|negoci|empresa|contad|contabil|mercad|marketing|gerenc/, "business"],
    [/econom/, "economics"],
    [/comunicac|periodis|publicidad|audiovisual/, "communication"],
    [/sociolog|antropolog|politic|filosof|historia|internacional|humanidad/, "socialsciences"],
    [/lenguas|idiomas|linguist|literatura|filolog|lengua/, "languages"],
    [/biolog|quimic|genetic|ambiental|microbiolog/, "lifesciences"],
    [/ingenier|sistemas|software|computac|electron|mecanic|civil|industrial/, "engineering"],
  ];
  for (const [re, key] of rules) if (re.test(c)) return key;
  return undefined;
}

/** Materias sugeridas a partir de la carrera escrita (atajo). */
export function subjectsForCareer(career?: string): string[] {
  return subjectsForArea(guessArea(career));
}

// ============================================================
// "Lentes" por disciplina: guían a la IA para generar y evaluar con el
// vocabulario, criterios y errores comunes propios de cada área. Así la
// retroalimentación de quizzes/parciales es ESPECIALIZADA y detallada.
// ============================================================

export type DisciplineLens = {
  focus: string;       // en qué debe centrarse la evaluación
  criteria: string;    // criterios/dimensiones propias del área
  mistakes: string;    // errores comunes que la IA debe vigilar
};

const LENSES: Record<string, DisciplineLens> = {
  design: {
    focus:
      "principios de diseño: jerarquía visual, composición, retícula, teoría del color, tipografía, contraste, espacio y coherencia con el concepto/brief.",
    criteria:
      "evalúa decisiones de diseño y su justificación (por qué funcionan), uso del color y la tipografía, legibilidad, equilibrio compositivo, intención comunicativa y originalidad.",
    mistakes:
      "contraste insuficiente, jerarquía confusa, mal interletraje/interlineado, paleta sin razón, decoración sin función, ignorar el público/objetivo.",
  },
  arts: {
    focus: "lenguaje plástico y visual, técnica, contexto histórico-artístico y expresión conceptual.",
    criteria: "dominio técnico, uso de elementos visuales, coherencia conceptual, referentes y contexto, lectura crítica de la obra.",
    mistakes: "describir sin interpretar, ignorar el contexto, confundir corrientes/autores, juicios sin fundamentar.",
  },
  architecture: {
    focus: "relación forma-función, espacio, escala, estructura, contexto urbano y habitabilidad.",
    criteria: "lógica espacial, viabilidad estructural, representación (plantas/cortes), contexto y partido arquitectónico, sostenibilidad.",
    mistakes: "ignorar escala/circulaciones, estructura inviable, no justificar el partido, olvidar normativa o contexto.",
  },
  music: {
    focus: "teoría, armonía, ritmo, forma y lectura/escritura musical.",
    criteria: "análisis armónico, conducción de voces, estructura formal, precisión de notación y contexto estilístico.",
    mistakes: "quintas/octavas paralelas, errores de cifrado, confundir tonalidades o compases, análisis superficial.",
  },
  law: {
    focus: "razonamiento jurídico: identificación del problema, norma aplicable, subsunción de los hechos y conclusión argumentada.",
    criteria: "cita de la norma/jurisprudencia correcta, lógica de la argumentación, estructura (hechos→derecho→conclusión), precisión conceptual.",
    mistakes: "confundir figuras jurídicas, afirmar sin fundamentar, no aplicar la norma a los hechos, conclusiones sin sustento.",
  },
  medicine: {
    focus: "razonamiento clínico, fisiopatología y correlación entre signos, síntomas y mecanismos.",
    criteria: "precisión de conceptos, razonamiento diagnóstico, relación causa-efecto fisiológica, seguridad y pertinencia.",
    mistakes: "confundir mecanismos, saltar al diagnóstico sin justificar, imprecisión terminológica, olvidar diagnósticos diferenciales.",
  },
  health: {
    focus: "fundamentos de salud, procesos del cuerpo y aplicación al cuidado del paciente.",
    criteria: "precisión conceptual, aplicación práctica, seguridad y evidencia.",
    mistakes: "generalizar sin matiz, confundir procesos, recomendaciones sin sustento.",
  },
  psychology: {
    focus: "teorías psicológicas, metodología y uso correcto de conceptos y evidencia.",
    criteria: "dominio teórico, rigor metodológico, aplicación a casos, pensamiento crítico y ética.",
    mistakes: "confundir corrientes/autores, sobregeneralizar, confundir correlación con causa, lenguaje coloquial impreciso.",
  },
  business: {
    focus: "conceptos de gestión/finanzas/marketing y su aplicación a decisiones reales.",
    criteria: "dominio conceptual, aplicación a casos, uso correcto de fórmulas/indicadores, justificación de decisiones.",
    mistakes: "errores de cálculo financiero, confundir conceptos, recomendaciones sin datos, ignorar supuestos.",
  },
  economics: {
    focus: "modelos económicos, gráficas, interpretación de resultados y supuestos.",
    criteria: "rigor del modelo, interpretación de gráficas, uso de datos, claridad de supuestos.",
    mistakes: "confundir movimientos vs. desplazamientos de curva, mala interpretación, ignorar ceteris paribus.",
  },
  communication: {
    focus: "mensaje, audiencia, medio, claridad y teorías de la comunicación.",
    criteria: "claridad y estructura del mensaje, adecuación a la audiencia, uso de recursos, marco teórico.",
    mistakes: "mensaje confuso, ignorar la audiencia, afirmaciones sin respaldo, mezclar registros.",
  },
  socialsciences: {
    focus: "teorías, argumentación crítica, evidencia y contexto histórico-social.",
    criteria: "solidez del argumento, uso de autores/teorías, evidencia, pensamiento crítico y estructura.",
    mistakes: "opinión sin fundamento, confundir autores/teorías, generalizar, falta de estructura.",
  },
  languages: {
    focus: "gramática, léxico, comprensión y expresión escrita.",
    criteria: "corrección gramatical, riqueza léxica, coherencia y cohesión, comprensión del texto.",
    mistakes: "errores de concordancia, falsos amigos, mala puntuación, ideas inconexas.",
  },
  lifesciences: {
    focus: "conceptos biológicos/químicos, procesos y relación estructura-función.",
    criteria: "precisión conceptual, comprensión de procesos, notación/ecuaciones correctas, relación causa-efecto.",
    mistakes: "confundir procesos, ecuaciones mal balanceadas, imprecisión terminológica.",
  },
  engineering: {
    focus: "resolución rigurosa paso a paso, notación correcta y verificación del resultado.",
    criteria: "procedimiento, exactitud del resultado, notación (LaTeX), eficiencia/complejidad cuando aplique.",
    mistakes: "errores de signo/álgebra, saltar pasos, notación incorrecta, no verificar el resultado.",
  },
};

/** Devuelve la "lente" de evaluación para una materia/carrera. */
export function lensFor(subjectOrCareer?: string): DisciplineLens {
  const area = guessArea(subjectOrCareer);
  return (area && LENSES[area]) || LENSES.socialsciences;
}

/** Texto listo para inyectar en un prompt, con la guía de evaluación del área. */
export function lensPromptBlock(subjectOrCareer?: string): string {
  const l = lensFor(subjectOrCareer);
  return `\nENFOQUE DE LA MATERIA: céntrate en ${l.focus}\nCRITERIOS DE EVALUACIÓN: ${l.criteria}\nERRORES COMUNES A VIGILAR: ${l.mistakes}`;
}
