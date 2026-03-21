import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Course, Module, Lesson } from '../models';
import * as groqService from '../services/groqService';
import * as pexelsService from '../services/pexelsService';
import { CourseStatus } from '../models/Course';
import path from 'path';
import fs from 'fs';

export const generateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'El prompt es obligatorio' });
      return;
    }

    // 1. Generate course outline with AI
    const outline = await groqService.generateCourseOutline(prompt);

    // 2. Get cover image from Pexels
    const coverImage = await pexelsService.getRandomImage(outline.title + ' ' + outline.category);

    // 3. Create course in DB
    const course = await Course.create({
      title: outline.title,
      description: outline.description,
      category: outline.category,
      coverImage,
      status: CourseStatus.DRAFT,
      teacherId: req.user.id,
    });

    // 4. Create modules and lessons
    for (let i = 0; i < outline.modules.length; i++) {
      const mod = outline.modules[i];
      const module = await Module.create({
        title: mod.title,
        description: mod.description,
        order: i,
        courseId: course.id,
      });

      for (let j = 0; j < mod.lessons.length; j++) {
        const les = mod.lessons[j];
        // Get an image for the lesson
        const lessonImage = await pexelsService.getRandomImage(les.title);

        await Lesson.create({
          title: les.title,
          content: les.summary, // Brief content initially
          imageUrl: lessonImage,
          order: j,
          moduleId: module.id,
        });
      }
    }

    // Return the full course
    const fullCourse = await Course.findByPk(course.id, {
      include: [
        {
          model: Module,
          as: 'modules',
          include: [{ model: Lesson, as: 'lessons' }],
        },
      ],
      order: [
        [{ model: Module, as: 'modules' }, 'order', 'ASC'],
        [{ model: Module, as: 'modules' }, { model: Lesson, as: 'lessons' }, 'order', 'ASC'],
      ],
    });

    res.status(201).json({ course: fullCourse });
  } catch (error: any) {
    console.error('Error generating course:', error);
    res.status(500).json({ error: error.message || 'Error al generar curso con IA' });
  }
};

export const generateLessonContent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findByPk(lessonId as string, {
      include: [
        {
          model: Module,
          as: 'module',
          include: [{ model: Course, as: 'course' }],
        },
      ],
    });

    if (!lesson) {
      res.status(404).json({ error: 'Leccion no encontrada' });
      return;
    }

    const module = (lesson as any).module;
    const course = module.course;

    const content = await groqService.generateLessonContent(
      lesson.title,
      module.title,
      course.title
    );

    await lesson.update({ content });

    res.json({ lesson });
  } catch (error: any) {
    console.error('Error generating lesson content:', error);
    res.status(500).json({ error: error.message || 'Error al generar contenido de leccion' });
  }
};

export const generateAudio = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findByPk(lessonId as string);
    if (!lesson) {
      res.status(404).json({ error: 'Leccion no encontrada' });
      return;
    }

    if (!lesson.content || lesson.content.length < 10) {
      res.status(400).json({ error: 'La leccion debe tener contenido antes de generar audio' });
      return;
    }

    // Strip markdown for cleaner TTS
    const plainText = lesson.content
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/-\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();

    const audioBuffer = await groqService.generateAudioFromText(plainText);

    // Save audio file
    const uploadsDir = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `lesson_${lesson.id}_${Date.now()}.wav`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, audioBuffer);

    const audioUrl = `/uploads/audio/${filename}`;
    await lesson.update({ audioUrl });

    res.json({ lesson, audioUrl });
  } catch (error: any) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: error.message || 'Error al generar audio' });
  }
};

export const searchImages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query } = req.query;
    if (!query) {
      res.status(400).json({ error: 'El query de busqueda es obligatorio' });
      return;
    }

    const photos = await pexelsService.searchImages(query as string, 10);
    res.json({ photos });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al buscar imagenes' });
  }
};
