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
    [/dise|grafic|ux|ui|moda|textil|industrial/, "design"],
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
