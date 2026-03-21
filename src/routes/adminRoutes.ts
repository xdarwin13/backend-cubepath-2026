import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { getStats, getUsers, getAllCourses, getChartData } from '../controllers/adminController';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/courses', getAllCourses);
router.get('/stats/charts', getChartData);

export default router;
