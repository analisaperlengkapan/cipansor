import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { createSocialServiceOrderSchema, assignTeamSchema, addMaterialSchema } from './schema';
import { socialService } from './service';
import httpStatus from 'http-status';

const router = Router();

router.get('/', async (req, res) => {
  const orders = await socialService.findAll(req.query.unitId as string);
  res.send(orders);
});

router.post('/', validate(createSocialServiceOrderSchema), async (req, res) => {
  const order = await socialService.createOrder(req.body);
  res.status(httpStatus.CREATED).send(order);
});

router.post('/assign', validate(assignTeamSchema), async (req, res) => {
  const assignment = await socialService.assignTeam(req.body);
  res.status(httpStatus.CREATED).send(assignment);
});

router.post('/materials', validate(addMaterialSchema), async (req, res) => {
  const material = await socialService.useMaterial(req.body);
  res.status(httpStatus.CREATED).send(material);
});

router.patch('/:id/complete', async (req, res) => {
  const order = await socialService.completeOrder(req.params.id);
  res.send(order);
});

export default router;
