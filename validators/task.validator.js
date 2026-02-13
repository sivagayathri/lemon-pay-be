const Joi = require('joi');

const createTaskSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    status: Joi.string().valid('pending', 'in-progress', 'completed')
});

const updateTaskSchema = Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    status: Joi.string().valid('pending', 'in-progress', 'completed')
}).min(1);

module.exports = { createTaskSchema, updateTaskSchema };
