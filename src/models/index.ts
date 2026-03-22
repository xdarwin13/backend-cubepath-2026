import User from './User';
import Course from './Course';
import Module from './Module';
import Lesson from './Lesson';
import Enrollment from './Enrollment';
import Certificate from './Certificate';

// User <-> Course (Teacher has many courses)
User.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

// Course <-> Module
Course.hasMany(Module, { foreignKey: 'courseId', as: 'modules' });
Module.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Module <-> Lesson
Module.hasMany(Lesson, { foreignKey: 'moduleId', as: 'lessons' });
Lesson.belongsTo(Module, { foreignKey: 'moduleId', as: 'module' });

// User <-> Enrollment (Student enrollments)
User.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
Enrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Course <-> Enrollment
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Enrollment <-> Certificate
Enrollment.hasOne(Certificate, { foreignKey: 'enrollmentId', as: 'certificate' });
Certificate.belongsTo(Enrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });

// User <-> Certificate
User.hasMany(Certificate, { foreignKey: 'studentId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Course <-> Certificate
Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

export { User, Course, Module, Lesson, Enrollment, Certificate };
