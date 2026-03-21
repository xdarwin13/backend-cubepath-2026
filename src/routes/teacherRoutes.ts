import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getMyCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  addLesson,
  updateLesson,
  deleteModule,
  deleteLesson,
} from '../controllers/teacherController';

const router = Router();

router.use(authenticate, authorize('teacher'));

router.get('/courses', getMyCourses);
router.get('/courses/:id', getCourse);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

router.post('/courses/:courseId/modules', addModule);
router.delete('/modules/:moduleId', deleteModule);

router.post('/modules/:moduleId/lessons', addLesson);
router.put('/lessons/:lessonId', updateLesson);
router.delete('/lessons/:lessonId', deleteLesson);

export default router;
