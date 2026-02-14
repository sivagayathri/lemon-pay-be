require('dotenv').config();
const express = require('express');
const connectDB = require('./config/mongodb');
const redisClient = require('./config/redis');
const authRoutes = require('./routes/auth.route');
const taskRoutes = require('./routes/task.route');
const cacheRoutes = require('./routes/cache.route');

const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clear-cache', cacheRoutes);

app.listen( process.env.PORT, () => {
    console.log(`Server listening on port: ${ process.env.PORT}`);
});
