const taskModel = require('../Modelos/taskModel');

const taskController = {
    // Maneja GET /api/tasks: solicita todas las tareas al modelo y las devuelve en formato JSON.
    async getAllTasks(req, res) {
        try {
            const tasks = await taskModel.getAllTasks();
            res.status(200).json(tasks);
        } catch (error) {
            console.error('Error al obtener tareas:', error);
            res.status(500).json({ error: 'Error al obtener tareas.' });
        }
    },

    // Maneja POST /api/tasks: lee los parámetros de la URL, valida que no falten campos obligatorios y crea la tarea.
    async createTask(req, res) {
        try {
            const { title, description, subject, priority } = req.query;

            if (!title || !title.trim() || !subject || !priority) {
                return res.status(400).json({ error: 'Faltan campos obligatorios.' });
            }

            const insertId = await taskModel.createTask(
                title.trim(),
                description ? description.trim() : '',
                subject,
                priority
            );

            res.status(201).json({ id: insertId });
        } catch (error) {
            console.error('Error al crear tarea:', error);
            res.status(500).json({ error: 'Error al crear tarea.' });
        }
    },

    // Maneja POST /api/tasks/:id: ruta unificada de actualización.
    // Si recibe el parámetro 'status', actualiza solo el estado; de lo contrario, actualiza título y descripción.
    async updateTask(req, res) {
        try {
            const id = req.params.id;
            const { title, description, status } = req.query;

            if (status) {
                const updated = await taskModel.updateStatus(id, status);
                if (!updated) return res.status(404).json({ error: 'Tarea no encontrada.' });
                return res.status(200).json({ message: 'Estado actualizado.' });
            }

            if (!title || !title.trim()) {
                return res.status(400).json({ error: 'El título es obligatorio.' });
            }

            const updated = await taskModel.updateDetails(id, title.trim(), description || '');
            if (!updated) return res.status(404).json({ error: 'Tarea no encontrada.' });

            res.status(200).json({ message: 'Tarea actualizada.' });
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            res.status(500).json({ error: 'Error al actualizar tarea.' });
        }
    },

    // Maneja POST /api/tasks/:id/delete: elimina la tarea indicada por el ID de la ruta.
    async deleteTask(req, res) {
        try {
            const deleted = await taskModel.deleteTask(req.params.id);
            if (!deleted) return res.status(404).json({ error: 'Tarea no encontrada.' });

            res.status(200).json({ message: 'Tarea eliminada.' });
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            res.status(500).json({ error: 'Error al eliminar tarea.' });
        }
    },
};

module.exports = taskController;