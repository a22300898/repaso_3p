const taskModel = require('../Modelos/taskModel');

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['pending', 'in-progress', 'completed'];

const taskController = {
    // GET /api/tasks
    async getAllTasks(req, res) {
        try {
            const tasks = await taskModel.getAllTasks();
            return res.status(200).json(tasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return res.status(500).json({ error: 'Internal server error while fetching tasks.' });
        }
    },

    // POST /api/tasks?title=...&description=...&subject=...&priority=...
    async createTask(req, res) {
        try {
            const { title, description, subject, priority } = req.query;

            if (!title || typeof title !== 'string' || title.trim().length === 0) {
                return res.status(400).json({ error: 'Task title is required.' });
            }

            if (title.trim().length > 255) {
                return res.status(400).json({ error: 'Task title must be 255 characters or fewer.' });
            }

            if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
                return res.status(400).json({ error: 'Subject is required.' });
            }

            if (!priority || !VALID_PRIORITIES.includes(priority)) {
                return res.status(400).json({
                    error: `Invalid priority. Allowed values: ${VALID_PRIORITIES.join(', ')}.`,
                });
            }

            const newTask = await taskModel.createTask({
                title: title.trim(),
                description: description ? description.trim() : '',
                subjectSlug: subject.trim(),
                priority,
            });

            if (!newTask) {
                return res.status(400).json({ error: 'Selected subject does not exist.' });
            }

            return res.status(201).json(newTask);
        } catch (error) {
            console.error('Error creating task:', error);
            return res.status(500).json({ error: 'Internal server error while creating task.' });
        }
    },

    // PUT /api/tasks/:id?title=...&description=...
    async updateTask(req, res) {
        try {
            const taskId = Number(req.params.id);
            const { title, description } = req.query;

            if (!Number.isInteger(taskId) || taskId <= 0) {
                return res.status(400).json({ error: 'Invalid task ID.' });
            }

            if (!title || typeof title !== 'string' || title.trim().length === 0) {
                return res.status(400).json({ error: 'Task title is required.' });
            }

            if (title.trim().length > 255) {
                return res.status(400).json({ error: 'Task title must be 255 characters or fewer.' });
            }

            const updatedTask = await taskModel.updateTask(taskId, {
                title: title.trim(),
                description: description !== undefined ? description : '',
            });

            if (!updatedTask) {
                return res.status(404).json({ error: 'Task not found.' });
            }

            return res.status(200).json(updatedTask);
        } catch (error) {
            console.error('Error updating task:', error);
            return res.status(500).json({ error: 'Internal server error while updating task.' });
        }
    },

    // PATCH /api/tasks/:id/status?status=...
    async updateTaskStatus(req, res) {
        try {
            const taskId = Number(req.params.id);
            const { status } = req.query;

            if (!Number.isInteger(taskId) || taskId <= 0) {
                return res.status(400).json({ error: 'Invalid task ID.' });
            }

            if (!status || !VALID_STATUSES.includes(status)) {
                return res.status(400).json({
                    error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}.`,
                });
            }

            const updated = await taskModel.updateTaskStatus(taskId, status);

            if (!updated) {
                return res.status(404).json({ error: 'Task not found.' });
            }

            return res.status(200).json({ id: taskId, status });
        } catch (error) {
            console.error('Error updating task status:', error);
            return res.status(500).json({ error: 'Internal server error while updating status.' });
        }
    },

    // DELETE /api/tasks/:id
    async deleteTask(req, res) {
        try {
            const taskId = Number(req.params.id);

            if (!Number.isInteger(taskId) || taskId <= 0) {
                return res.status(400).json({ error: 'Invalid task ID.' });
            }

            const deleted = await taskModel.deleteTask(taskId);

            if (!deleted) {
                return res.status(404).json({ error: 'Task not found.' });
            }

            return res.status(200).json({ id: taskId, deleted: true });
        } catch (error) {
            console.error('Error deleting task:', error);
            return res.status(500).json({ error: 'Internal server error while deleting task.' });
        }
    },
};

module.exports = taskController;