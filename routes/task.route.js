const express = require('express');
const router = express.Router();
const { getTasks, createTask, getTask, updateTask, deleteTask } = require('../controllers/task.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../validators/task.validator');

router.get('/', auth, getTasks);
router.post('/', auth, validate(createTaskSchema), createTask);
router.get('/:id', auth, getTask);
router.put('/:id', auth, validate(updateTaskSchema), updateTask);
router.delete('/:id', auth, deleteTask);

module.exports = router;
