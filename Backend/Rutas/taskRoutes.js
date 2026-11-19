const express = require('express');
const taskController = require('../Controladores/taskController');
const router = express.Router();

// GET /api/tasks -> Obtiene todas las tareas almacenadas en la base de datos.
router.get('/api/tasks', taskController.getAllTasks);

// POST /api/tasks -> Inserta una nueva tarea con los datos recibidos por parámetros URL.
router.post('/api/tasks', taskController.createTask);

// POST /api/tasks/:id -> Ruta unificada que actualiza tanto el estado como el título/descripción de una tarea.
router.post('/api/tasks/:id', taskController.updateTask);

// POST /api/tasks/:id/delete -> Elimina permanentemente una tarea según su ID.
router.post('/api/tasks/:id/delete', taskController.deleteTask);

module.exports = router;