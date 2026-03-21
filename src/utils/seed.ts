import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import sequelize from '../config/database';
import '../models';
import User, { UserRole } from '../models/User';

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('Database synced (force)');

    // Create admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Admin EduCubeIA',
      email: 'admin@educubeia.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    });

    // Create sample teacher
    const teacherPassword = await bcrypt.hash('teacher123', 10);
    await User.create({
      name: 'Profesor Demo',
      email: 'profesor@educubeia.com',
      password: teacherPassword,
      role: UserRole.TEACHER,
    });

    // Create sample student
    const studentPassword = await bcrypt.hash('student123', 10);
    await User.create({
      name: 'Estudiante Demo',
      email: 'estudiante@educubeia.com',
      password: studentPassword,
      role: UserRole.STUDENT,
    });

    console.log('Seed completed successfully!');
    console.log('Admin: admin@educubeia.com / admin123');
    console.log('Teacher: profesor@educubeia.com / teacher123');
    console.log('Student: estudiante@educubeia.com / student123');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
