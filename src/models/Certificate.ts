import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import crypto from 'crypto';

interface CertificateAttributes {
  id: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  verificationCode: string;
  issuedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CertificateCreationAttributes extends Optional<CertificateAttributes, 'id' | 'verificationCode' | 'issuedAt'> {}

class Certificate extends Model<CertificateAttributes, CertificateCreationAttributes> implements CertificateAttributes {
  public id!: string;
  public enrollmentId!: string;
  public studentId!: string;
  public courseId!: string;
  public verificationCode!: string;
  public issuedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  static generateVerificationCode(): string {
    return `EC-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  }
}

Certificate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    enrollmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'enrollment_id',
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
    verificationCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'verification_code',
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'issued_at',
    },
  },
  {
    sequelize,
    tableName: 'certificates',
    modelName: 'Certificate',
  }
);

export default Certificate;
