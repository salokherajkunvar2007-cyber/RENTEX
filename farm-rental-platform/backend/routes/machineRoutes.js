const express = require('express');
const {
  createMachine,
  getMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
  getMyMachines,
} = require('../controllers/machineController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getMachines);
router.get('/mine/list', protect, authorize('owner'), getMyMachines);
router.get('/:id', getMachineById);

router.post('/', protect, authorize('owner'), upload.array('photos', 6), createMachine);
router.put('/:id', protect, authorize('owner'), upload.array('photos', 6), updateMachine);
router.delete('/:id', protect, authorize('owner'), deleteMachine);

module.exports = router;
