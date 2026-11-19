const express = require('express');
const path = require('path');
const taskController = require('../Controladores/taskController');

const router = express.Router();

// Frontend entry file route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Task API routes
router.get('/api/tasks', taskController.getAllTasks);
router.post('/api/tasks', taskController.createTask);
router.put('/api/tasks/:id', taskController.updateTask);
router.patch('/api/tasks/:id/status', taskController.updateTaskStatus);
router.delete('/api/tasks/:id', taskController.deleteTask);

module.exports = router;