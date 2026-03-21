import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  generateCourse,
  generateLessonContent,
  generateAudio,
  searchImages,
} from '../controllers/aiController';

const router = Router();

router.use(authenticate, authorize('teacher'));

router.post('/generate-course', generateCourse);
router.post('/generate-lesson/:lessonId', generateLessonContent);
router.post('/generate-audio/:lessonId', generateAudio);
router.get('/search-image', searchImages);

export default router;
