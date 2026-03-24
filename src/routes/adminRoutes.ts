import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getStats, getUsers, updateUserRole, deleteUser,
  getAllCourses, toggleCourseStatus, deleteCourse,
  getEnrollments, getCertificates, getChartData,
} from '../controllers/adminController';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/stats/charts', getChartData);

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);

router.get('/courses', getAllCourses);
router.put('/courses/:id/status', toggleCourseStatus);
router.delete('/courses/:id', deleteCourse);

router.get('/enrollments', getEnrollments);
router.get('/certificates', getCertificates);

export default router;
