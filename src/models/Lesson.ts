import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LessonAttributes {
  id: string;
  title: string;
  content: string;
  audioUrl: string | null;
  imageUrl: string | null;
  order: number;
  moduleId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface LessonCreationAttributes extends Optional<LessonAttributes, 'id' | 'audioUrl' | 'imageUrl'> {}

class Lesson extends Model<LessonAttributes, LessonCreationAttributes> implements LessonAttributes {
  public id!: string;
  public title!: string;
  public content!: string;
  public audioUrl!: string | null;
  public imageUrl!: string | null;
  public order!: number;
  public moduleId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Lesson.init(
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
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    audioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'audio_url',
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'image_url',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    moduleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'module_id',
    },
  },
  {
    sequelize,
    tableName: 'lessons',
    modelName: 'Lesson',
  }
);

export default Lesson;
