document.addEventListener('DOMContentLoaded', () => {
    // URLs de los íconos externos para editar (lápiz) y eliminar (papelera) cada tarea.
    const EDIT_ICON = 'https://www.freeiconspng.com/uploads/edit-editor-pen-pencil-write-icon--4.png';
    const DELETE_ICON = 'https://cdn-icons-png.flaticon.com/512/6861/6861362.png';

    // Referencias a los elementos del panel derecho y al botón azul de guardar cambios.
    const detailBox = document.getElementById('task-detail-content');
    const detailTitle = document.getElementById('detail-title-input');
    const detailDesc = document.getElementById('detail-description-input');
    const saveBtn = document.getElementById('btn-save-changes');

    // Guarda únicamente el ID de la tarea seleccionada actualmente en el panel derecho.
    let selectedId = null;

    // Consulta todas las tareas directamente desde MySQL (GET /api/tasks), limpia las tres listas
    // del panel izquierdo, vuelve a dibujar cada fila y actualiza los contadores de cada sección.
    async function cargarTareas() {
        try {
            const response = await fetch('/api/tasks');
            const tasks = await response.json();

            const listPending = document.getElementById('list-pending');
            const listInProgress = document.getElementById('list-in-progress');
            const listCompleted = document.getElementById('list-completed');

            listPending.innerHTML = '';
            listInProgress.innerHTML = '';
            listCompleted.innerHTML = '';

            tasks.forEach((task) => {
                const li = crearElementoTarea(task);

                if (task.status === 'in-progress') {
                    listInProgress.appendChild(li);
                } else if (task.status === 'completed') {
                    listCompleted.appendChild(li);
                } else {
                    listPending.appendChild(li);
                }
            });

            document.getElementById('count-pending').textContent = listPending.children.length;
            document.getElementById('count-in-progress').textContent = listInProgress.children.length;
            document.getElementById('count-completed').textContent = listCompleted.children.length;
        } catch (error) {
            console.error('Error al cargar tareas:', error);
        }
    }

    // Construye el elemento HTML <li> de una tarea individual con su borde de prioridad,
    // selector de estado, botón de editar (lápiz) y botón de eliminar (papelera).
    function crearElementoTarea(task) {
        const li = document.createElement('li');
        li.className = `task-item priority-${task.priority}`;
        if (task.id === selectedId) li.classList.add('selected');

        // Contenedor izquierdo con el título de la tarea y la etiqueta de su materia.
        const infoDiv = document.createElement('div');
        infoDiv.className = 'task-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'task-name';
        nameSpan.textContent = task.title;

        const subjectSpan = document.createElement('span');
        subjectSpan.className = 'task-subject';
        subjectSpan.textContent = task.subject;

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(subjectSpan);

        // Contenedor derecho con el selector de estado y los íconos de editar y eliminar.
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';

        const select = document.createElement('select');
        select.className = 'status-select';
        select.innerHTML = `
      <option value="pending">Pending</option>
      <option value="in-progress">In Progress</option>
      <option value="completed">Completed</option>
    `;
        select.value = task.status;

        // Evita que al abrir el menú desplegable se dispare el clic de toda la fila
        // y envía el cambio de estado mediante POST /api/tasks/:id?status=...
        select.addEventListener('click', (e) => e.stopPropagation());
        select.addEventListener('change', async (e) => {
            const params = new URLSearchParams({ status: e.target.value });
            await fetch(`/api/tasks/${task.id}?${params}`, { method: 'POST' });
            cargarTareas();
        });

        // Botón de edición (lápiz): abre la tarea en el panel derecho con campos editables y muestra el botón azul.
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-edit';
        editBtn.innerHTML = `<img src="${EDIT_ICON}" alt="Edit">`;
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarTarea(task, true);
        });

        // Botón de eliminación (papelera): borra la tarea en MySQL mediante POST /api/tasks/:id/delete
        // y recarga la lista desde la base de datos.
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = `<img src="${DELETE_ICON}" alt="Delete">`;
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await fetch(`/api/tasks/${task.id}/delete`, { method: 'POST' });

            if (selectedId === task.id) {
                selectedId = null;
                detailBox.classList.add('hidden');
            }
            cargarTareas();
        });

        actionsDiv.appendChild(select);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        // Al hacer clic en cualquier otra parte de la fila, muestra la tarea en modo solo lectura a la derecha.
        li.addEventListener('click', () => mostrarTarea(task, false));

        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);
        return li;
    }

    // Muestra los datos de la tarea seleccionada en el panel derecho.
    // Si 'editando' es true, habilita la edición de título y descripción y muestra el botón "Save Changes".
    function mostrarTarea(task, editando) {
        selectedId = task.id;
        detailTitle.value = task.title;
        detailDesc.value = task.description || '';
        detailTitle.readOnly = !editando;
        detailDesc.readOnly = !editando;

        detailBox.classList.remove('hidden');
        if (editando) {
            saveBtn.classList.remove('hidden');
            detailTitle.focus();
        } else {
            saveBtn.classList.add('hidden');
        }

        cargarTareas();
    }

    // Maneja el envío del formulario superior para crear una nueva tarea en MySQL (POST /api/tasks)
    // y vuelve a consultar la base de datos para mostrarla en la lista.
    document.getElementById('add-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('task-title-input').value.trim();
        const description = document.getElementById('task-desc-input').value.trim();
        const subject = document.getElementById('subject-select').value;
        const priority = document.getElementById('priority-select').value;

        if (!title || !subject || !priority) return;

        const params = new URLSearchParams({ title, description, subject, priority });
        const response = await fetch(`/api/tasks?${params}`, { method: 'POST' });

        if (response.ok) {
            e.target.reset();
            cargarTareas();
        }
    });

    // Guarda los cambios editados en el panel derecho enviando POST /api/tasks/:id?title=...&description=...,
    // oculta el botón azul, bloquea los campos y actualiza la lista desde MySQL.
    saveBtn.addEventListener('click', async () => {
        const title = detailTitle.value.trim();
        const description = detailDesc.value;

        if (!selectedId || !title) {
            detailTitle.focus();
            return;
        }

        const params = new URLSearchParams({ title, description });
        const response = await fetch(`/api/tasks/${selectedId}?${params}`, { method: 'POST' });

        if (response.ok) {
            detailTitle.readOnly = true;
            detailDesc.readOnly = true;
            saveBtn.classList.add('hidden');
            cargarTareas();
        }
    });

    // Carga inicial de las tareas al abrir la página.
    cargarTareas();
});