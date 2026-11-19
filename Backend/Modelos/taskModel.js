const db = require('../Config/database');

const taskModel = {
    // Consulta todas las filas de la tabla 'tasks' ordenadas por su ID de forma ascendente.
    async getAllTasks() {
        const [rows] = await db.query('SELECT * FROM tasks ORDER BY id ASC');
        return rows;
    },

    // Inserta una nueva tarea directamente en la tabla 'tasks'
    async createTask(title, description, subject, priority) {
        const [result] = await db.query(
            'INSERT INTO tasks (title, description, subject, priority) VALUES (?, ?, ?, ?)',
            [title, description || null, subject, priority]
        );
        return result.insertId;
    },

    // Actualiza únicamente la columna 'status' cuando se cambia el selector de estado en la lista.
    async updateStatus(id, status) {
        const [result] = await db.query(
            'UPDATE tasks SET status = ? WHERE id = ?',
            [status, id]
        );
        return result.affectedRows > 0;
    },

    // Actualiza el título y la descripción cuando se guardan cambios desde el panel derecho.
    async updateDetails(id, title, description) {
        const [result] = await db.query(
            'UPDATE tasks SET title = ?, description = ? WHERE id = ?',
            [title, description || null, id]
        );
        return result.affectedRows > 0;
    },

    // Elimina una fila de la tabla 'tasks' según su ID.
    async deleteTask(id) {
        const [result] = await db.query('DELETE FROM tasks WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },
};

module.exports = taskModel;