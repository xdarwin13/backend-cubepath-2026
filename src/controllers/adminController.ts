import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { User, Course, Enrollment, Certificate, Module, Lesson } from '../models';
import { UserRole } from '../models/User';
import { CourseStatus } from '../models/Course';
import sequelize from '../config/database';
import { fn, col, Op } from 'sequelize';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.count();
    const totalTeachers = await User.count({ where: { role: UserRole.TEACHER } });
    const totalStudents = await User.count({ where: { role: UserRole.STUDENT } });
    const totalCourses = await Course.count();
    const publishedCourses = await Course.count({ where: { status: CourseStatus.PUBLISHED } });
    const totalEnrollments = await Enrollment.count();
    const totalCertificates = await Certificate.count();
    const completedEnrollments = await Enrollment.count({ where: { completedAt: { [Op.ne]: null } } });

    res.json({
      stats: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalCertificates,
        completedEnrollments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener estadisticas' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, search } = req.query;
    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'avatar', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener usuarios' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({ error: 'Rol invalido' });
      return;
    }

    if (id === req.user.id) {
      res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
      return;
    }

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await user.update({ role });
    res.json({ message: 'Rol actualizado', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar rol' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (id === req.user.id) {
      res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
      return;
    }

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await Enrollment.destroy({ where: { studentId: id } });
    await Certificate.destroy({ where: { studentId: id } });

    const teacherCourses = await Course.findAll({ where: { teacherId: id } });
    for (const course of teacherCourses) {
      await Enrollment.destroy({ where: { courseId: course.id } });
      await Certificate.destroy({ where: { courseId: course.id } });
      const modules = await Module.findAll({ where: { courseId: course.id } });
      for (const mod of modules) {
        await Lesson.destroy({ where: { moduleId: mod.id } });
      }
      await Module.destroy({ where: { courseId: course.id } });
    }
    await Course.destroy({ where: { teacherId: id } });

    await user.destroy();
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar usuario' });
  }
};

export const getAllCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, category } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const courses = await Course.findAll({
      where,
      include: [
        { model: User, as: 'teacher', attributes: ['id', 'name'] },
        { model: Enrollment, as: 'enrollments', attributes: ['id'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ courses });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener cursos' });
  }
};

export const toggleCourseStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const course = await Course.findByPk(id);
    if (!course) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }

    const newStatus = course.status === CourseStatus.PUBLISHED ? CourseStatus.DRAFT : CourseStatus.PUBLISHED;
    await course.update({ status: newStatus });
    res.json({ message: `Curso ${newStatus === CourseStatus.PUBLISHED ? 'publicado' : 'despublicado'}`, course });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al cambiar estado del curso' });
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const course = await Course.findByPk(id);
    if (!course) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }

    await Certificate.destroy({ where: { courseId: id } });
    await Enrollment.destroy({ where: { courseId: id } });
    const modules = await Module.findAll({ where: { courseId: id } });
    for (const mod of modules) {
      await Lesson.destroy({ where: { moduleId: mod.id } });
    }
    await Module.destroy({ where: { courseId: id } });
    await course.destroy();

    res.json({ message: 'Curso eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar curso' });
  }
};

export const getEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    const include: any[] = [
      { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
      {
        model: Course, as: 'course', attributes: ['id', 'title', 'category'],
        include: [{ model: User, as: 'teacher', attributes: ['id', 'name'] }],
      },
    ];

    let where: any = {};
    if (search) {
      where = {
        [Op.or]: [
          { '$student.name$': { [Op.iLike]: `%${search}%` } },
          { '$course.title$': { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const enrollments = await Enrollment.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
      subQuery: false,
    });

    res.json({ enrollments });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener inscripciones' });
  }
};

export const getCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search } = req.query;

    const include: any[] = [
      { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
      {
        model: Course, as: 'course', attributes: ['id', 'title', 'category'],
        include: [{ model: User, as: 'teacher', attributes: ['id', 'name'] }],
      },
    ];

    let where: any = {};
    if (search) {
      where = {
        [Op.or]: [
          { '$student.name$': { [Op.iLike]: `%${search}%` } },
          { '$course.title$': { [Op.iLike]: `%${search}%` } },
          { verificationCode: { [Op.iLike]: `%${search}%` } },
        ],
      };
    }

    const certificates = await Certificate.findAll({
      where,
      include,
      order: [['issuedAt', 'DESC']],
      subQuery: false,
    });

    res.json({ certificates });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener certificados' });
  }
};

export const getChartData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const registrationsPerDay = await User.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    const coursesByCategory = await Course.findAll({
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['category'],
      raw: true,
    });

    const roleDistribution = await User.findAll({
      attributes: [
        'role',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['role'],
      raw: true,
    });

    const topTeachers = await Course.findAll({
      attributes: [
        'teacherId',
        [fn('COUNT', col('Course.id')), 'courseCount'],
      ],
      include: [
        { model: User, as: 'teacher', attributes: ['name'] },
      ],
      group: ['Course.teacher_id', 'teacher.id'],
      order: [[fn('COUNT', col('Course.id')), 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });

    const enrollmentsPerDay = await Enrollment.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    res.json({
      charts: {
        registrationsPerDay,
        coursesByCategory,
        roleDistribution,
        topTeachers,
        enrollmentsPerDay,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener datos de graficas' });
  }
};
