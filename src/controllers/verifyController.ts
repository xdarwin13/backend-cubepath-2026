import { Request, Response } from 'express';
import { Certificate, User, Course, Module, Enrollment } from '../models';

export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    const certificate = await Certificate.findOne({
      where: { verificationCode: code },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name'] },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'category'],
          include: [
            { model: User, as: 'teacher', attributes: ['id', 'name'] },
            { model: Module, as: 'modules', attributes: ['id'] },
          ],
        },
        { model: Enrollment, as: 'enrollment', attributes: ['id', 'completedAt', 'createdAt'] },
      ],
    });

    if (!certificate) {
      res.status(404).json({ valid: false, error: 'Certificado no encontrado' });
      return;
    }

    res.json({
      valid: true,
      certificate: {
        verificationCode: certificate.verificationCode,
        studentName: (certificate as any).student?.name,
        courseTitle: (certificate as any).course?.title,
        courseCategory: (certificate as any).course?.category,
        teacherName: (certificate as any).course?.teacher?.name,
        totalModules: (certificate as any).course?.modules?.length || 0,
        completedAt: (certificate as any).enrollment?.completedAt,
        enrolledAt: (certificate as any).enrollment?.createdAt,
        issuedAt: certificate.issuedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message || 'Error al verificar certificado' });
  }
};
