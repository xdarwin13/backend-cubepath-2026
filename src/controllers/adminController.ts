import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { User, Course, Enrollment } from '../models';
import { UserRole } from '../models/User';
import { CourseStatus } from '../models/Course';
import sequelize from '../config/database';
import { fn, col, literal } from 'sequelize';

export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.count();
    const totalTeachers = await User.count({ where: { role: UserRole.TEACHER } });
    const totalStudents = await User.count({ where: { role: UserRole.STUDENT } });
    const totalCourses = await Course.count();
    const publishedCourses = await Course.count({ where: { status: CourseStatus.PUBLISHED } });
    const totalEnrollments = await Enrollment.count();

    res.json({
      stats: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalCourses,
        publishedCourses,
        totalEnrollments,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener estadisticas' });
  }
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const where: any = {};
    if (role) where.role = role;

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

export const getAllCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const courses = await Course.findAll({
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

export const getChartData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Registrations per day (last 30 days)
    const registrationsPerDay = await User.findAll({
      attributes: [
        [fn('DATE', col('created_at')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: {
        createdAt: {
          [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      group: [fn('DATE', col('created_at'))],
      order: [[fn('DATE', col('created_at')), 'ASC']],
      raw: true,
    });

    // Courses by category
    const coursesByCategory = await Course.findAll({
      attributes: [
        'category',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['category'],
      raw: true,
    });

    // Role distribution
    const roleDistribution = await User.findAll({
      attributes: [
        'role',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['role'],
      raw: true,
    });

    // Top teachers (by course count)
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

    res.json({
      charts: {
        registrationsPerDay,
        coursesByCategory,
        roleDistribution,
        topTeachers,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener datos de graficas' });
  }
};
