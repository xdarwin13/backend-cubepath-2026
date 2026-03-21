import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ModuleAttributes {
  id: string;
  title: string;
  description: string;
  order: number;
  courseId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ModuleCreationAttributes extends Optional<ModuleAttributes, 'id' | 'description'> {}

class Module extends Model<ModuleAttributes, ModuleCreationAttributes> implements ModuleAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public order!: number;
  public courseId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Module.init(
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
      allowNull: true,
      defaultValue: '',
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'course_id',
    },
  },
  {
    sequelize,
    tableName: 'modules',
    modelName: 'Module',
  }
);

export default Module;
