App.ProjectTabs.Schedule = (() => {
    let keynotesData = [];
    const DOM = {};

    // MODIFICATION: HTML for the tab is now stored here for self-containment.
    const TAB_HTML = `
        <h3>Manage Schedule Tasks</h3>
        <p>Add tasks from the standard keynote list or create custom tasks. These will appear on the Gantt Chart preview.</p>
         <button id="generate-from-scope-btn" class="secondary-button" style="margin-right: 10px;">Generate from Scope</button>
        <button id="add-schedule-task-btn" class="primary-button">Add New Task</button>
        <div class="table-container" style="margin-top: 15px;">
            <table class="output-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Task Name</th>
                        <th>Duration</th>
                        <th>Start Date</th>
                        <th>Dependencies</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="schedule-tasks-list-body"></tbody>
            </table>
        </div>
    `;

    function cacheDOM() {
        DOM.container = document.getElementById('schedule-tab');
        DOM.generateBtn = document.getElementById('generate-from-scope-btn'); // Cache new button
        DOM.addBtn = document.getElementById('add-schedule-task-btn');
        DOM.taskListBody = document.getElementById('schedule-tasks-list-body');
        
        // Modal elements
        DOM.modal = document.getElementById('schedule-task-modal');
        DOM.modalCloseBtn = document.getElementById('schedule-task-modal-close-btn');
        DOM.modalTitle = document.getElementById('schedule-task-modal-title');
        DOM.saveBtn = document.getElementById('save-schedule-task-btn');
        
        // Form fields
        DOM.editId = document.getElementById('edit-task-id');
        DOM.keynoteSearch = document.getElementById('new-task-keynote-search'); // MODIFICATION: Cache search input
        DOM.keynoteSelect = document.getElementById('new-task-keynote-select');
        DOM.taskCode = document.getElementById('new-task-code');
        DOM.taskName = document.getElementById('new-task-name');
        DOM.taskDuration = document.getElementById('new-task-duration');
        DOM.taskStartDate = document.getElementById('new-task-start-date');
        DOM.dependencySelect = document.getElementById('new-task-dependency-select');
    }

    async function loadKeynotes() {
        if (keynotesData.length > 0) return;
        try {
            const response = await fetch('js/keynotes.txt');
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            
            const divisions = {};
            let mainDivisions = {};

            lines.forEach(line => {
                const parts = line.split('\t').map(p => p.trim());
                if(parts.length >= 2 && parts[0].endsWith('000')) {
                    mainDivisions[parts[0]] = parts[1];
                }
            });

            lines.forEach(line => {
                const parts = line.split('\t').map(p => p.trim());
                if (parts.length >= 3) {
                    const [code, desc, parentCode] = parts;
                     // Find the main division for this parent code. e.g., for 01500, find 01000
                    const mainDivCode = Object.keys(mainDivisions).find(div => parentCode >= div && parentCode < String(parseInt(div) + 1000));
                    if(mainDivCode) {
                        if (!divisions[mainDivCode]) {
                            divisions[mainDivCode] = { name: mainDivisions[mainDivCode], items: [] };
                        }
                        divisions[mainDivCode].items.push({ code, desc });
                    }
                }
            });

            // Populate select
            DOM.keynoteSelect.innerHTML = '<option value="">-- Select a Standard Task or Type Custom --</option>';
            const sortedDivCodes = Object.keys(divisions).sort();

            for (const divCode of sortedDivCodes) {
                const division = divisions[divCode];
                if (division.items.length > 0) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = `${division.name}`;
                    division.items.sort((a,b) => a.code.localeCompare(b.code)).forEach(item => {
                        const option = document.createElement('option');
                        option.value = item.code;
                        option.textContent = `${item.code} - ${item.desc}`;
                        option.dataset.name = item.desc;
                        optgroup.appendChild(option);
                    });
                    DOM.keynoteSelect.appendChild(optgroup);
                }
            }

        } catch (error) {
            console.error("Failed to load keynotes.txt", error);
            DOM.keynoteSelect.innerHTML = '<option value="">-- Error loading tasks --</option>';
        }
    }
    // MODIFICATION START: New function to filter keynote select options
    function filterKeynoteSelect() {
        const searchTerm = DOM.keynoteSearch.value.toLowerCase();
        const optgroups = DOM.keynoteSelect.getElementsByTagName('optgroup');

        for (let i = 0; i < optgroups.length; i++) {
            const optgroup = optgroups[i];
            const options = optgroup.getElementsByTagName('option');
            let hasVisibleOption = false;

            for (let j = 0; j < options.length; j++) {
                const option = options[j];
                const optionText = option.textContent.toLowerCase();

                if (optionText.includes(searchTerm)) {
                    option.style.display = '';
                    hasVisibleOption = true;
                } else {
                    option.style.display = 'none';
                }
            }

            if (hasVisibleOption) {
                optgroup.style.display = '';
            } else {
                optgroup.style.display = 'none';
            }
        }
    }
    // MODIFICATION END
    function bindEvents() {
        DOM.addBtn.addEventListener('click', () => showTaskModal());
        DOM.generateBtn.addEventListener('click', handleGenerateFromScope); // Add listener for new button
        DOM.modalCloseBtn.addEventListener('click', () => DOM.modal.style.display = 'none');
        DOM.saveBtn.addEventListener('click', saveTask);
        DOM.taskListBody.addEventListener('click', handleListClick);
         DOM.keynoteSearch.addEventListener('input', filterKeynoteSelect); // MODIFICATION: Add listener
        DOM.keynoteSelect.addEventListener('change', () => {
            const selectedOption = DOM.keynoteSelect.options[DOM.keynoteSelect.selectedIndex];
            if (selectedOption && selectedOption.value) {
                DOM.taskCode.value = selectedOption.value;
                DOM.taskName.value = selectedOption.dataset.name;
            }
        });
    }
    
    async function handleListClick(e) {
        const target = e.target;
        const project = await DB.getProject(App.currentProjectJobNo);
        if (!project) return;

        if (target.classList.contains('edit-task-btn')) {
            const taskId = target.dataset.id;
            const task = (project.scheduleTasks || []).find(t => t.id === taskId);
            if (task) showTaskModal(task);
        } else if (target.classList.contains('delete-task-btn')) {
            const taskId = target.dataset.id;
            if (confirm('Are you sure you want to delete this task?')) {
                deleteTask(taskId);
            }
        }
    }
async function handleGenerateFromScope() {
        const project = await DB.getProject(App.currentProjectJobNo);
        if (!project) {
            alert("Please save the project first.");
            return;
        }

        if (!confirm("This will overwrite the current schedule with tasks generated from the project's scope and productivity rates. Continue?")) {
            return;
        }

        const newTasks = SiteProductivity.generateScheduleFromScope(project);
        if (!newTasks || newTasks.length === 0) {
            alert("Could not generate schedule. Ensure project has a Built-Up Area defined.");
            return;
        }

        project.scheduleTasks = newTasks;
        await DB.putProject(project);
        render(project);
        App.refreshCurrentPreview();
        alert(`Generated ${newTasks.length} tasks based on project scope.`);
    }
    async function deleteTask(taskId) {
        const project = await DB.getProject(App.currentProjectJobNo);
        if (!project) return;
        
        project.scheduleTasks = (project.scheduleTasks || []).filter(t => t.id !== taskId);
        // Also remove this task from any dependencies
        project.scheduleTasks.forEach(task => {
            if(task.dependencies && Array.isArray(task.dependencies)){
                task.dependencies = task.dependencies.filter(depId => depId !== taskId);
            }
        });
        await DB.putProject(project);
        render(project);
        App.refreshCurrentPreview();
    }

    async function showTaskModal(task = null) {
        const project = await DB.getProject(App.currentProjectJobNo);
        if (!project) return;

        // Reset form
        DOM.editId.value = '';
         DOM.keynoteSearch.value = '';
        filterKeynoteSelect(); // Reset filter view
        DOM.keynoteSelect.value = '';
        DOM.taskCode.value = '';
        DOM.taskName.value = '';
        DOM.taskDuration.value = '1';
        DOM.taskStartDate.value = new Date().toISOString().split('T')[0];
        
        // Populate dependencies
        DOM.dependencySelect.innerHTML = '<option value="">-- No Dependency --</option>';
        const tasks = project.scheduleTasks || [];
        tasks.sort((a, b) => new Date(a.start) - new Date(b.start)).forEach(t => {
            if (!task || t.id !== task.id) { // Don't allow self-dependency
                const option = document.createElement('option');
                option.value = t.id;
                option.textContent = `${t.id} - ${t.name}`;
                DOM.dependencySelect.appendChild(option);
            }
        });

        if (task) {
            DOM.modalTitle.textContent = 'Edit Schedule Task';
            DOM.editId.value = task.id;
            DOM.taskCode.value = task.tenderCode || '';
            DOM.taskName.value = task.name;
            DOM.taskDuration.value = task.duration;
            DOM.taskStartDate.value = task.start;
            DOM.dependencySelect.value = (task.dependencies && task.dependencies[0]) ? task.dependencies[0] : '';
        } else {
            DOM.modalTitle.textContent = 'Add New Schedule Task';
        }
        
        DOM.modal.style.display = 'flex';
    }

    async function saveTask() {
        const id = DOM.editId.value;
        const name = DOM.taskName.value.trim();
        const duration = parseInt(DOM.taskDuration.value, 10);
        const startDateStr = DOM.taskStartDate.value;
        
        if (!name || isNaN(duration) || duration <= 0 || !startDateStr) {
            alert('Please fill in a valid Task Name, Duration, and Start Date.');
            return;
        }

        const startDate = new Date(`${startDateStr}T00:00:00`);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + duration - 1);

        const taskData = {
            id: id || `T-${Date.now()}`,
            tenderCode: DOM.taskCode.value,
            name: name,
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
            duration: duration,
            dependencies: DOM.dependencySelect.value ? [DOM.dependencySelect.value] : []
        };
        
        const project = await DB.getProject(App.currentProjectJobNo);
        if (!project) return;
        project.scheduleTasks = project.scheduleTasks || [];
        
        if (id) {
            // Update
            const index = project.scheduleTasks.findIndex(t => t.id === id);
            if (index > -1) {
                project.scheduleTasks[index] = { ...project.scheduleTasks[index], ...taskData };
            }
        } else {
            // Add new
            project.scheduleTasks.push(taskData);
        }
        
        await DB.putProject(project);
        DOM.modal.style.display = 'none';
        render(project); // Pass the updated project to render
        App.refreshCurrentPreview();
    }

    function render(project) {
        if (!project) project = {}; // Handle initial case where project might not be loaded
        const tasks = project.scheduleTasks || [];
        tasks.sort((a,b) => new Date(a.start) - new Date(b.start));
        if (DOM.taskListBody) {
             DOM.taskListBody.innerHTML = tasks.map(task => `
                <tr>
                    <td>${task.id}</td>
                    <td>${task.name}</td>
                    <td>${task.duration} days</td>
                    <td>${task.start}</td>
                    <td>${(task.dependencies || []).join(', ')}</td>
                    <td>
                        <button class="edit-task-btn secondary-button small-btn" data-id="${task.id}">Edit</button>
                        <button class="delete-task-btn danger-button small-btn" data-id="${task.id}">Del</button>
                    </td>
                </tr>
            `).join('');
        }
    }

    function init() {
        const container = document.getElementById('schedule-tab');
        if (!container) return;
        
        container.innerHTML = TAB_HTML;

        cacheDOM();
        bindEvents();
        loadKeynotes();
    }
    
    // This is the function called by app.js to render the Gantt chart preview
    async function schrenderPreview(fullData) {
        if (fullData.projectType !== 'Villa') {
            const previewEl = document.getElementById('villa-schedule-preview1');
            if (previewEl) {
                previewEl.innerHTML = '<p>Schedule preview is only available for "Villa" project types.</p>';
            }
            return;
        }

        // The callback for when a user interacts with the Gantt chart (drag/drop/resize)
        const handleGanttUpdate = async (updatedTask) => {
            if (!App.currentProjectJobNo) return;
            const project = await DB.getProject(App.currentProjectJobNo);
            if (!project) return;
            
            project.scheduleTasks = project.scheduleTasks || [];
            const taskIndex = project.scheduleTasks.findIndex(t => t.id === updatedTask.id);

            if (taskIndex > -1) {
                const start = new Date(`${updatedTask.start}T00:00:00`);
                const end = new Date(`${updatedTask.end}T00:00:00`);
                const duration = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
                
                project.scheduleTasks[taskIndex].start = updatedTask.start;
                project.scheduleTasks[taskIndex].end = updatedTask.end;
                project.scheduleTasks[taskIndex].duration = duration;
                
                await DB.putProject(project);
                
                // Re-render the list in the tab and then refresh the Gantt chart preview
                render(project); 
                App.refreshCurrentPreview();
            }
        };

        const baseSchedule = UrbanAxisSchedule.calculateDynamicSchedule(fullData, CONTENT.VILLA_SCHEDULE_TEMPLATE, []);
        const userTasks = fullData.scheduleTasks || [];
        
        const taskMap = new Map(baseSchedule.map(t => [t.id, t]));
        userTasks.forEach(userTask => taskMap.set(userTask.id, userTask));
        
        const finalScheduleData = Array.from(taskMap.values());
        finalScheduleData.sort((a, b) => new Date(a.start) - new Date(b.start));

        UrbanAxisSchedule.render(finalScheduleData, handleGanttUpdate, 'villa-schedule-preview1');
    }

    // FIX: Export the schrenderPreview function so app.js can call it.
    return { init, render, schrenderPreview };
})();