import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
}

interface CourseAttributes {
  id: string;
  title: string;
  description: string;
  coverImage: string | null;
  category: string;
  status: CourseStatus;
  teacherId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'coverImage' | 'status'> {}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public coverImage!: string | null;
  public category!: string;
  public status!: CourseStatus;
  public teacherId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    coverImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CourseStatus)),
      allowNull: false,
      defaultValue: CourseStatus.DRAFT,
    },
    teacherId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'teacher_id',
    },
  },
  {
    sequelize,
    tableName: 'courses',
    modelName: 'Course',
  }
);

export default Course;
