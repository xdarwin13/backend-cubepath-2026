import Groq from 'groq-sdk';
import { env } from '../config/env';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

const TEXT_MODEL = 'llama-3.3-70b-versatile';

export interface CourseOutline {
  title: string;
  description: string;
  category: string;
  coverImageQuery: string;
  modules: {
    title: string;
    description: string;
    lessons: {
      title: string;
      summary: string;
      imageQuery: string;
    }[];
  }[];
}

export const generateCourseOutline = async (prompt: string): Promise<CourseOutline> => {
  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Eres un experto disenador de cursos educativos. Genera la estructura completa de un curso basado en el prompt del usuario. 
Responde SOLO con un JSON valido (sin markdown, sin backticks) con esta estructura exacta:
{
  "title": "Titulo del curso",
  "description": "Descripcion detallada del curso (2-3 oraciones)",
  "category": "Categoria del curso (ej: programacion, matematicas, ciencias, idiomas, arte, negocios, tecnologia)",
  "coverImageQuery": "2-4 keywords EN INGLES para buscar una foto de portada relevante en un banco de imagenes (ej: 'machine learning technology computer', 'personal finance money investment', 'digital art painting creative')",
  "modules": [
    {
      "title": "Titulo del modulo",
      "description": "Descripcion breve del modulo",
      "lessons": [
        { "title": "Titulo de la leccion", "summary": "Resumen breve de la leccion", "imageQuery": "2-3 keywords EN INGLES para buscar una imagen relevante para esta leccion" }
      ]
    }
  ]
}
Genera entre 3 y 6 modulos, cada uno con 2 a 4 lecciones. El contenido debe ser educativo, bien estructurado y progresivo.
IMPORTANTE: Los campos "coverImageQuery" e "imageQuery" deben ser palabras clave descriptivas y visuales EN INGLES que representen bien el tema para encontrar fotos relevantes en un banco de imagenes. Piensa en que tipo de foto representaria visualmente el concepto.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content || '{}';
  // Clean potential markdown formatting
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as CourseOutline;
};

export const generateLessonContent = async (
  lessonTitle: string,
  moduleTitle: string,
  courseTitle: string
): Promise<string> => {
  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Eres un profesor experto. Genera el contenido completo de una leccion educativa en formato Markdown.
El contenido debe ser:
- Detallado y educativo (minimo 500 palabras)
- Bien estructurado con titulos, subtitulos, listas y ejemplos
- Con explicaciones claras y progresivas
- Incluir ejemplos practicos cuando sea relevante
- NO incluir el titulo de la leccion como encabezado principal (ya se muestra por separado)
Responde SOLO con el contenido en Markdown.`,
      },
      {
        role: 'user',
        content: `Curso: "${courseTitle}"\nModulo: "${moduleTitle}"\nLeccion: "${lessonTitle}"\n\nGenera el contenido completo de esta leccion.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response.choices[0]?.message?.content || '';
};

export const generateAudioFromText = async (text: string): Promise<Buffer> => {
  // Truncate text to avoid exceeding TTS limits
  // Free tier limit: 1200 TPM - truncate to stay within limits
  const truncated = text.substring(0, 1000);

  const response = await groq.audio.speech.create({
    model: 'canopylabs/orpheus-v1-english',
    input: truncated,
    voice: 'diana',
    response_format: 'wav',
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const generateQuiz = async (
  lessonContent: string,
  lessonTitle: string
): Promise<any[]> => {
  const response = await groq.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'system',
        content: `Genera 5 preguntas de evaluacion basadas en el contenido de la leccion.
Responde SOLO con un JSON valido (sin markdown, sin backticks) con esta estructura:
[
  {
    "question": "Pregunta",
    "options": ["Opcion A", "Opcion B", "Opcion C", "Opcion D"],
    "correctIndex": 0
  }
]`,
      },
      {
        role: 'user',
        content: `Leccion: "${lessonTitle}"\n\nContenido:\n${lessonContent.substring(0, 3000)}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content || '[]';
  const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};
