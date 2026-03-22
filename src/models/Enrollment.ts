import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface EnrollmentAttributes {
  id: string;
  studentId: string;
  courseId: string;
  progress: number;
  lastLessonId: string | null;
  completedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EnrollmentCreationAttributes extends Optional<EnrollmentAttributes, 'id' | 'progress' | 'lastLessonId' | 'completedAt'> {}

class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes> implements EnrollmentAttributes {
  public id!: string;
  public studentId!: string;
  public courseId!: string;
  public progress!: number;
  public lastLessonId!: string | null;
  public completedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Enrollment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'student_id',
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'course_id',
    },
    progress: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      validate: { min: 0, max: 100 },
    },
    lastLessonId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'last_lesson_id',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
    },
  },
  {
    sequelize,
    tableName: 'enrollments',
    modelName: 'Enrollment',
  }
);

export default Enrollment;
