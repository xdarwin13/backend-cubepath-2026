import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Course, Module, Lesson, Enrollment, User, Certificate } from '../models';
import { CourseStatus } from '../models/Course';
import { generateQuiz } from '../services/groqService';

export const getPublishedCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    const where: any = { status: CourseStatus.PUBLISHED };

    if (category) where.category = category;

    const courses = await Course.findAll({
      where,
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'name', 'avatar'] },
        { model: Module, as: 'modules', attributes: ['id'] },
        { model: Enrollment, as: 'enrollments', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    let result = courses;
    if (search) {
      const s = (search as string).toLowerCase();
      result = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(s) ||
          c.description.toLowerCase().includes(s)
      );
    }

    res.json({ courses: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener cursos' });
  }
};

export const getCourseDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, status: CourseStatus.PUBLISHED },
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'name', 'avatar'] },
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

    // Check if the student is enrolled
    let enrollment = null;
    if (req.user) {
      enrollment = await Enrollment.findOne({
        where: { studentId: req.user.id, courseId: course.id },
      });
    }

    res.json({ course, enrollment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener curso' });
  }
};

export const enrollInCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const course = await Course.findOne({
      where: { id: req.params.id, status: CourseStatus.PUBLISHED },
    });

    if (!course) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }

    const existing = await Enrollment.findOne({
      where: { studentId: req.user.id, courseId: course.id },
    });

    if (existing) {
      res.status(400).json({ error: 'Ya estas inscrito en este curso' });
      return;
    }

    const enrollment = await Enrollment.create({
      studentId: req.user.id,
      courseId: course.id,
    });

    res.status(201).json({ enrollment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al inscribirse' });
  }
};

export const getMyCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { studentId: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            { model: User, as: 'teacher', attributes: ['id', 'name', 'avatar'] },
            { model: Module, as: 'modules', attributes: ['id'] },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener mis cursos' });
  }
};

export const updateProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollment = await Enrollment.findOne({
      where: { id: req.params.enrollmentId, studentId: req.user.id },
    });

    if (!enrollment) {
      res.status(404).json({ error: 'Inscripcion no encontrada' });
      return;
    }

    const { progress, lastLessonId } = req.body;
    const updateData: any = {
      progress,
      completedAt: progress >= 100 ? new Date() : null,
    };
    if (lastLessonId) {
      updateData.lastLessonId = lastLessonId;
    }
    await enrollment.update(updateData);

    res.json({ enrollment });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar progreso' });
  }
};

export const getCertificateData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const enrollment = await Enrollment.findOne({
      where: { id: req.params.enrollmentId, studentId: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            { model: User, as: 'teacher', attributes: ['id', 'name'] },
            { model: Module, as: 'modules', attributes: ['id'] },
          ],
        },
      ],
    });

    if (!enrollment) {
      res.status(404).json({ error: 'Inscripcion no encontrada' });
      return;
    }

    if (enrollment.progress < 100 || !enrollment.completedAt) {
      res.status(400).json({ error: 'El curso aun no ha sido completado' });
      return;
    }

    const student = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email'],
    });

    let certificate = await Certificate.findOne({
      where: { enrollmentId: enrollment.id },
    });

    if (!certificate) {
      certificate = await Certificate.create({
        enrollmentId: enrollment.id,
        studentId: req.user.id,
        courseId: enrollment.courseId,
        verificationCode: Certificate.generateVerificationCode(),
        issuedAt: enrollment.completedAt || new Date(),
      });
    }

    res.json({
      certificate: {
        id: enrollment.id,
        verificationCode: certificate.verificationCode,
        studentName: student?.name || 'Estudiante',
        studentEmail: student?.email,
        courseTitle: (enrollment as any).course?.title,
        teacherName: (enrollment as any).course?.teacher?.name,
        totalModules: (enrollment as any).course?.modules?.length || 0,
        completedAt: enrollment.completedAt,
        enrolledAt: enrollment.createdAt,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener certificado' });
  }
};

export const generateLessonQuiz = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lesson = await Lesson.findByPk(req.params.lessonId as string);
    if (!lesson) {
      res.status(404).json({ error: 'Leccion no encontrada' });
      return;
    }

    if (!lesson.content || lesson.content.length < 20) {
      res.status(400).json({ error: 'La leccion no tiene suficiente contenido para generar un quiz' });
      return;
    }

    const questions = await generateQuiz(lesson.content, lesson.title);
    res.json({ questions });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: error.message || 'Error al generar quiz' });
  }
};
