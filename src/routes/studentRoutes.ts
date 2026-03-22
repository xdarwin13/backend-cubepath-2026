import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  getPublishedCourses,
  getCourseDetail,
  enrollInCourse,
  getMyCourses,
  updateProgress,
  getCertificateData,
  generateLessonQuiz,
} from '../controllers/studentController';

const router = Router();

router.use(authenticate, authorize('student'));

router.get('/courses', getPublishedCourses);
router.get('/courses/:id', getCourseDetail);
router.post('/courses/:id/enroll', enrollInCourse);
router.get('/my-courses', getMyCourses);
router.put('/progress/:enrollmentId', updateProgress);
router.get('/certificate/:enrollmentId', getCertificateData);
router.post('/quiz/lesson/:lessonId', generateLessonQuiz);

export default router;
