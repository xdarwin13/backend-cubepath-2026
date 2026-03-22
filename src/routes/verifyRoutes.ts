import { Router } from 'express';
import { verifyCertificate } from '../controllers/verifyController';

const router = Router();

router.get('/:code', verifyCertificate);

export default router;
