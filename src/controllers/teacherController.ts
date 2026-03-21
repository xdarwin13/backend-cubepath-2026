import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Course, Module, Lesson, Enrollment } from '../models';
import { CourseStatus } from '../models/Course';

export const getMyCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await Course.findAll({
      where: { teacherId: req.user.id },
      include: [
        {
          model: Module,
          as: 'modules',
          include: [{ model: Lesson, as: 'lessons' }],
        },
        { model: Enrollment, as: 'enrollments' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener cursos' });
  }
};

export const getCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, teacherId: req.user.id },
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

    if (!course) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }

    res.json({ course });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener curso' });
  }
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, coverImage, status } = req.body;

    const course = await Course.create({
      title,
      description,
      category,
      coverImage,
      status: status || CourseStatus.DRAFT,
      teacherId: req.user.id,
    });

    res.status(201).json({ course });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al crear curso' });
  }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, teacherId: req.user.id },
    });

    if (!course) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }

    await course.update(req.body);
    res.json({ course });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar curso' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, teacherId: req.user.id },
    });

    if (!course) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }

    // Delete all related data
    const modules = await Module.findAll({ where: { courseId: course.id } });
    for (const mod of modules) {
      await Lesson.destroy({ where: { moduleId: mod.id } });
    }
    await Module.destroy({ where: { courseId: course.id } });
    await Enrollment.destroy({ where: { courseId: course.id } });
    await course.destroy();

    res.json({ message: 'Curso eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar curso' });
  }
};

export const addModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.courseId, teacherId: req.user.id },
    });

    if (!course) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }

    const moduleCount = await Module.count({ where: { courseId: course.id } });
    const module = await Module.create({
      title: req.body.title,
      description: req.body.description || '',
      order: req.body.order ?? moduleCount,
      courseId: course.id,
    });

    res.status(201).json({ module });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al agregar modulo' });
  }
};

export const addLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const module = await Module.findByPk(req.params.moduleId as string, {
      include: [{ model: Course, as: 'course' }],
    });

    if (!module) {
      res.status(404).json({ error: 'Modulo no encontrado' });
      return;
    }

    const lessonCount = await Lesson.count({ where: { moduleId: module.id } });
    const lesson = await Lesson.create({
      title: req.body.title,
      content: req.body.content || '',
      audioUrl: req.body.audioUrl,
      imageUrl: req.body.imageUrl,
      order: req.body.order ?? lessonCount,
      moduleId: module.id,
    });

    res.status(201).json({ lesson });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al agregar leccion' });
  }
};

export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lesson = await Lesson.findByPk(req.params.lessonId as string);
    if (!lesson) {
      res.status(404).json({ error: 'Leccion no encontrada' });
      return;
    }

    await lesson.update(req.body);
    res.json({ lesson });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar leccion' });
  }
};

export const deleteModule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const module = await Module.findByPk(req.params.moduleId as string);
    if (!module) {
      res.status(404).json({ error: 'Modulo no encontrado' });
      return;
    }

    await Lesson.destroy({ where: { moduleId: module.id } });
    await module.destroy();
    res.json({ message: 'Modulo eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar modulo' });
  }
};

export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lesson = await Lesson.findByPk(req.params.lessonId as string);
    if (!lesson) {
      res.status(404).json({ error: 'Leccion no encontrada' });
      return;
    }

    await lesson.destroy();
    res.json({ message: 'Leccion eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar leccion' });
  }
};
