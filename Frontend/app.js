document.addEventListener('DOMContentLoaded', () => {
    const addTaskForm = document.getElementById('add-task-form');
    const titleInput = document.getElementById('task-title-input');
    const descInput = document.getElementById('task-desc-input');
    const subjectSelect = document.getElementById('subject-select');
    const prioritySelect = document.getElementById('priority-select');
    const addButton = document.getElementById('btn-add');

    const lists = {
        pending: document.getElementById('list-pending'),
        'in-progress': document.getElementById('list-in-progress'),
        completed: document.getElementById('list-completed'),
    };

    const counts = {
        pending: document.getElementById('count-pending'),
        'in-progress': document.getElementById('count-in-progress'),
        completed: document.getElementById('count-completed'),
    };

    const detailContent = document.getElementById('task-detail-content');
    const detailTitleInput = document.getElementById('detail-title-input');
    const detailDescriptionInput = document.getElementById('detail-description-input');

    const DELETE_ICON_URL = 'https://cdn-icons-png.flaticon.com/512/6861/6861362.png';

    let tasks = [];
    let selectedTaskId = null;
    let autoSaveTimer = null;

    // Load existing tasks from the database on page load
    async function loadTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) {
                throw new Error('Failed to fetch tasks.');
            }
            tasks = await response.json();
            renderTasks();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    // Render all tasks into their respective status sections
    function renderTasks() {
        Object.values(lists).forEach((list) => {
            list.innerHTML = '';
        });

        const sectionCounts = {
            pending: 0,
            'in-progress': 0,
            completed: 0,
        };

        tasks.forEach((task) => {
            const status = lists[task.status] ? task.status : 'pending';
            const taskElement = createTaskElement(task);
            lists[status].appendChild(taskElement);
            sectionCounts[status]++;
        });

        counts.pending.textContent = sectionCounts.pending;
        counts['in-progress'].textContent = sectionCounts['in-progress'];
        counts.completed.textContent = sectionCounts.completed;
    }

    // Build a single task list item element
    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority}`;
        li.dataset.taskId = task.id;
        if (task.id === selectedTaskId) {
            li.classList.add('selected');
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'task-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'task-name';
        nameSpan.textContent = task.title;

        const subjectSpan = document.createElement('span');
        subjectSpan.className = 'task-subject';
        subjectSpan.textContent = task.subject_name;

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(subjectSpan);

        // Right-side controls: status dropdown + delete button
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const statusSelect = document.createElement('select');
        statusSelect.className = 'status-select';
        statusSelect.setAttribute('aria-label', 'Task status');

        const statusOptions = [
            { value: 'pending', label: 'Pending' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
        ];

        statusOptions.forEach((opt) => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.label;
            if (task.status === opt.value) {
                optionEl.selected = true;
            }
            statusSelect.appendChild(optionEl);
        });

        // Prevent row selection when clicking the status dropdown
        statusSelect.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Instantly move task to the new section and save to DB
        statusSelect.addEventListener('change', (e) => {
            updateTaskStatus(task.id, e.target.value);
        });

        // Delete button with trash icon
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-delete';
        deleteBtn.setAttribute('aria-label', 'Delete task');
        deleteBtn.title = 'Delete task';

        const deleteImg = document.createElement('img');
        deleteImg.src = DELETE_ICON_URL;
        deleteImg.alt = 'Delete';
        deleteBtn.appendChild(deleteImg);

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        actionsDiv.appendChild(statusSelect);
        actionsDiv.appendChild(deleteBtn);

        // Show editable title and description in the right pane when clicked
        li.addEventListener('click', () => {
            selectTask(task.id);
        });

        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);

        return li;
    }

    // Submit new task via URL query parameters
    addTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        const subject = subjectSelect.value;
        const priority = prioritySelect.value;

        if (!title || !subject || !priority) {
            return;
        }

        addButton.disabled = true;

        try {
            const params = new URLSearchParams({
                title,
                description,
                subject,
                priority,
            });

            const response = await fetch(`/api/tasks?${params.toString()}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || 'Could not add task.');
                return;
            }

            tasks.push(data);
            renderTasks();
            addTaskForm.reset();
        } catch (error) {
            console.error('Error adding task:', error);
            alert('Network error while adding task.');
        } finally {
            addButton.disabled = false;
        }
    });

    // Delete task from database and remove from UI
    async function deleteTask(taskId) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.error || 'Could not delete task.');
                return;
            }

            tasks = tasks.filter((t) => t.id !== taskId);

            // Clear right pane if the deleted task was currently showcased
            if (selectedTaskId === taskId) {
                clearTimeout(autoSaveTimer);
                selectedTaskId = null;
                detailTitleInput.value = '';
                detailDescriptionInput.value = '';
                detailContent.classList.add('hidden');
            }

            renderTasks();
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('Network error while deleting task.');
        }
    }

    // Update task status via URL query parameters
    async function updateTaskStatus(taskId, newStatus) {
        try {
            const params = new URLSearchParams({ status: newStatus });

            const response = await fetch(`/api/tasks/${taskId}/status?${params.toString()}`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                throw new Error('Failed to update task status.');
            }

            const task = tasks.find((t) => t.id === taskId);
            if (task) {
                task.status = newStatus;
                renderTasks();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            renderTasks();
        }
    }

    // Show selected task details in the editable right pane
    function selectTask(taskId) {
        // Flush any pending auto-save for the previous task before switching
        if (selectedTaskId !== null && selectedTaskId !== taskId) {
            clearTimeout(autoSaveTimer);
            saveTaskEdits(selectedTaskId);
        }

        selectedTaskId = taskId;
        const task = tasks.find((t) => t.id === taskId);

        if (!task) return;

        detailTitleInput.value = task.title;
        detailDescriptionInput.value = task.description || '';
        detailContent.classList.remove('hidden');

        renderTasks();
    }

    // Persist title and description edits automatically to the database
    async function saveTaskEdits(taskId) {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;

        const newTitle = detailTitleInput.value.trim();
        const newDescription = detailDescriptionInput.value;

        // Prevent saving an empty title; revert to last saved title if cleared
        if (!newTitle) {
            detailTitleInput.value = task.title;
            return;
        }

        // Skip network call if nothing actually changed
        if (task.title === newTitle && (task.description || '') === newDescription) {
            return;
        }

        try {
            const params = new URLSearchParams({
                title: newTitle,
                description: newDescription,
            });

            const response = await fetch(`/api/tasks/${taskId}?${params.toString()}`, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Failed to save task edits.');
            }

            const updatedTask = await response.json();
            task.title = updatedTask.title;
            task.description = updatedTask.description;

            // Keep the left-side task row title synced
            const rowNameEl = document.querySelector(`.task-item[data-task-id="${taskId}"] .task-name`);
            if (rowNameEl) {
                rowNameEl.textContent = task.title;
            }
        } catch (error) {
            console.error('Error auto-saving task:', error);
        }
    }

    // Debounced auto-save while typing in the right panel
    function scheduleAutoSave() {
        if (selectedTaskId === null) return;

        const currentId = selectedTaskId;
        const liveTitle = detailTitleInput.value.trim();

        // Update the left-hand list title immediately as you type
        if (liveTitle) {
            const rowNameEl = document.querySelector(`.task-item[data-task-id="${currentId}"] .task-name`);
            if (rowNameEl) {
                rowNameEl.textContent = liveTitle;
            }
        }

        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(() => {
            saveTaskEdits(currentId);
        }, 500);
    }

    detailTitleInput.addEventListener('input', scheduleAutoSave);
    detailDescriptionInput.addEventListener('input', scheduleAutoSave);

    // Also save immediately if the user clicks outside the input/textarea
    detailTitleInput.addEventListener('blur', () => {
        clearTimeout(autoSaveTimer);
        if (selectedTaskId !== null) saveTaskEdits(selectedTaskId);
    });

    detailDescriptionInput.addEventListener('blur', () => {
        clearTimeout(autoSaveTimer);
        if (selectedTaskId !== null) saveTaskEdits(selectedTaskId);
    });

    loadTasks();
});