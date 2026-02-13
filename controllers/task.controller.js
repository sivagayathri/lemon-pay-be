const Task = require('../models/task');
const redisClient = require('../config/redis');

const TASK_CACHE_TTL = 300; // 5 minutes

const getTasks = async (req, res) => {
    try {
        const cacheKey = `tasks:${req.userId}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const tasks = await Task.find({ userId: req.userId });
        await redisClient.setEx(cacheKey, TASK_CACHE_TTL, JSON.stringify(tasks));
        return res.status(200).json(tasks);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, description, status } = req.body;

        const task = await Task.create({
            title,
            description,
            status,
            userId: req.userId
        });

        await redisClient.del(`tasks:${req.userId}`);
        return res.status(201).json(task);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getTask = async (req, res) => {
    try {
        const cacheKey = `task:${req.params.id}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.status(200).json(JSON.parse(cached));
        }

        const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        await redisClient.setEx(cacheKey, TASK_CACHE_TTL, JSON.stringify(task));
        return res.status(200).json(task);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        await redisClient.del(`tasks:${req.userId}`, `task:${req.params.id}`);
        return res.status(200).json(task);
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        await redisClient.del(`tasks:${req.userId}`, `task:${req.params.id}`);
        return res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const clearCache = async (req, res) => {
    try {
        const keys = await redisClient.keys(`task:*`);
        const userListKey = `tasks:${req.userId}`;

        const userTaskIds = await Task.find({ userId: req.userId }).select('_id');
        const taskKeys = userTaskIds.map((t) => `task:${t._id}`);

        const keysToDelete = [userListKey, ...taskKeys];
        if (keysToDelete.length > 0) {
            await redisClient.del(keysToDelete);
        }

        return res.status(200).json({ message: 'Cache cleared successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getTasks, createTask, getTask, updateTask, deleteTask, clearCache };
