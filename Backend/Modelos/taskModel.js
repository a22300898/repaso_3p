const db = require('../Config/database');

const taskModel = {
    // Fetch all tasks with their corresponding subject info
    async getAllTasks() {
        const query = `
            SELECT
                t.id,
                t.title,
                t.description,
                t.priority,
                t.status,
                s.slug AS subject_slug,
                s.name AS subject_name
            FROM tasks t
                     INNER JOIN subjects s ON t.subject_id = s.id
            ORDER BY t.id ASC
        `;
        const [rows] = await db.query(query);
        return rows;
    },

    // Fetch a single task by ID
    async getTaskById(id) {
        const query = `
            SELECT
                t.id,
                t.title,
                t.description,
                t.priority,
                t.status,
                s.slug AS subject_slug,
                s.name AS subject_name
            FROM tasks t
                     INNER JOIN subjects s ON t.subject_id = s.id
            WHERE t.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0] || null;
    },

    // Insert a new task using the subject slug from the frontend dropdown
    async createTask({ title, description, subjectSlug, priority }) {
        const [subjects] = await db.query(
            'SELECT id FROM subjects WHERE slug = ?',
            [subjectSlug]
        );

        if (subjects.length === 0) {
            return null;
        }

        const subjectId = subjects[0].id;
        const insertQuery = `
            INSERT INTO tasks (title, description, subject_id, priority, status)
            VALUES (?, ?, ?, ?, 'pending')
        `;

        const [result] = await db.query(insertQuery, [
            title,
            description || null,
            subjectId,
            priority,
        ]);

        return this.getTaskById(result.insertId);
    },

    // Update a task's title and description
    async updateTask(id, { title, description }) {
        const query = 'UPDATE tasks SET title = ?, description = ? WHERE id = ?';
        const [result] = await db.query(query, [title, description || null, id]);

        if (result.affectedRows === 0) {
            return null;
        }

        return this.getTaskById(id);
    },

    // Update a task's status (pending, in-progress, completed)
    async updateTaskStatus(id, status) {
        const query = 'UPDATE tasks SET status = ? WHERE id = ?';
        const [result] = await db.query(query, [status, id]);
        return result.affectedRows > 0;
    },

    // Delete a task by ID
    async deleteTask(id) {
        const query = 'DELETE FROM tasks WHERE id = ?';
        const [result] = await db.query(query, [id]);
        return result.affectedRows > 0;
    },
};

module.exports = taskModel;