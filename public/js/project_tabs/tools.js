

App.ProjectTabs.Tools = (() => {

    // Default Credentials Configuration (Global Fallback)
    const DEFAULT_CREDENTIALS = {
        site: { user: 'Site Engineer@urban-axis.com', pass: 'site_eng@12345', label: 'Site Engineer' },
        arch: { user: 'Architect@urban-axis.com', pass: 'arch@12345', label: 'Architect (Arch)' },
        str: { user: 'Structural@urban-axis.com', pass: 'str@12345', label: 'Structural (STR)' },
        mep: { user: 'MEP@urban-axis.com', pass: 'mep@12345', label: 'MEP Engineer' },
        pm: { user: 'Manager@urban-axis.com', pass: 'pm@12345', label: 'Project Manager' },
        contractor: { user: 'Contractor@urban-axis.com', pass: 'contractor@12345', label: 'Contractor' },
        client: { user: 'Client@urban-axis.com', pass: 'client@12345', label: 'Client' },
        viewer: { user: 'Viewer@urban-axis.com', pass: 'viewer@12345', label: 'Viewer / Guest' },
        admin: { user: 'Admin@urban-axis.com', pass: 'admin@12345', label: 'System Admin' }
    };

    function init() {
        const container = document.getElementById('tools-tab');
        if (!container) return;

        // Helper to generate input rows for GLOBAL defaults
        const generateGlobalCredentialInputs = () => {
            return Object.keys(DEFAULT_CREDENTIALS).map(key => `
                <div style="display: contents;">
                    <label style="align-self: center; font-weight: 500;">${DEFAULT_CREDENTIALS[key].label}</label>
                    <input type="text" id="global-user-${key}" placeholder="Default User" style="width: 100%;">
                    <input type="text" id="global-pwd-${key}" placeholder="Default Pass" style="width: 100%;">
                </div>
            `).join('');
        };

        // Helper for PROJECT-SPECIFIC inputs
        const generateProjectCredentialInputs = () => {
            const roles = ['site', 'contractor', 'client', 'pm', 'mep', 'str', 'arch'];
            return roles.map(key => `
                <div style="display: contents;">
                    <label style="align-self: center; font-weight: 500;">${DEFAULT_CREDENTIALS[key].label}</label>
                    <input type="text" id="proj-user-${key}" class="proj-cred-input" placeholder="Project Specific User" style="width: 100%;">
                    <input type="text" id="proj-pwd-${key}" class="proj-cred-input" placeholder="Project Specific Pass" style="width: 100%;">
                </div>
            `).join('');
        };

        // Render the Tools UI
        container.innerHTML = `
            <!-- SECTION 1: PROJECT SPECIFIC ACCESS (Saved to Project Data) -->
            <div class="document-category" style="border-left: 4px solid #28a745; margin-bottom: 20px;">
                <h4>Project-Specific Access Control</h4>
                <p>Set unique login credentials for <strong>this specific project</strong> (${App.currentProjectJobNo || 'No Project Selected'}). These override global defaults.</p>
                
                <div class="input-group-grid" style="grid-template-columns: 1.5fr 2fr 1.5fr; gap: 10px 15px; align-items: center; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #666; border-bottom: 1px solid #eee;">Role</div>
                    <div style="font-weight: bold; color: #666; border-bottom: 1px solid #eee;">Username</div>
                    <div style="font-weight: bold; color: #666; border-bottom: 1px solid #eee;">Password</div>
                    ${generateProjectCredentialInputs()}
                </div>
                <button id="saveProjectCredsBtn" class="primary-button" style="width: auto;">Save Project Credentials</button>
            </div>
<!-- MODIFICATION START: New Site Tab Visibility Control -->
            <div class="document-category" style="border-left: 4px solid #ffc107;">
                <h4>Site Tab Visibility Control</h4>
                <p>Configure which tabs are visible for each user role on the Site Management page.</p>
                <div id="site-tab-visibility-grid-container" style="max-height: 400px; overflow: auto; border: 1px solid #ddd; padding: 10px; border-radius: 6px;">
                    <div id="site-tab-visibility-grid">
                        <!-- Grid will be populated by JS -->
                        <p>Loading settings...</p>
                    </div>
                </div>   
                <!-- MODIFICATION: Added Reset button -->
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button id="saveTabVisibilityBtn" class="primary-button" style="width: auto;">Save Visibility Settings</button>
                    <button id="resetTabVisibilityBtn" class="secondary-button" style="width: auto;">Reset to Defaults</button>
                </div>
            </div>
            <!-- SECTION 2: GLOBAL SYSTEM ACCESS (Saved to Settings) -->
            <div class="document-category" style="border-left: 4px solid var(--primary-color);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>Global System Access Defaults</h4>
                    <button id="resetDefaultsBtn" class="secondary-button small-button">Reset Defaults</button>
                </div>
                <p>Manage default login credentials for the entire system. Used if no project-specific credentials are set.</p>
                
                <div class="input-group-grid" style="grid-template-columns: 1.5fr 2fr 1.5fr; gap: 10px 15px; align-items: center; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #666; border-bottom: 1px solid #eee;">Role</div>
                    <div style="font-weight: bold; color: #666; border-bottom: 1px solid #eee;">Default Username</div>
                    <div style="font-weight: bold; color: #666; border-bottom: 1px solid #eee;">Default Password</div>
                    ${generateGlobalCredentialInputs()}
                </div>
                
                <button id="saveGlobalPasswordsBtn" class="primary-button" style="width: auto;">Save Global Defaults</button>
            </div>

            <!-- Existing Tools Sections -->
            <div class="document-category">
                <h4>Scrum Task Scheduler</h4>
                <p>Calculates and sets due dates for all default design tasks based on the project's start date and design duration.</p>
                <button id="scheduleScrumTasksBtn" class="primary-button" style="width:100%;">Add & Schedule Default Tasks</button>
                <div id="scrumScheduleOutput" style="margin-top:10px; font-size:0.9em;"></div>
            </div>
            
            <div class="document-category">
                <h4>Resource Prediction</h4>
                <p>Calculate the estimated resources required for this project type based on historical data.</p>
                <button id="calculateResourcesBtn">Calculate Resources</button>
                <div id="resourcePredictionOutput" style="margin-top: 15px; font-family: monospace;"></div>
            </div>
            
            <div class="document-category">
                <h4>Project Report Generator</h4>
                <p>Generate a comprehensive report for the current project. Select the sections to include below.</p>
                <button id="toggle-report-options-btn" class="secondary-button">Configure Report Sections</button>
                <div id="report-options-container" style="display: none; margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 6px;">
                    <h4>Include in Report:</h4>
                    <div class="checkbox-group">
                        <label><input type="checkbox" name="reportSection" value="clientDetails" checked> Client Details</label>
                        <label><input type="checkbox" name="reportSection" value="projectInfo" checked> Project Info</label>
                        <label><input type="checkbox" name="reportSection" value="financials" checked> Financial Summary</label>
                        <label><input type="checkbox" name="reportSection" value="schedule" checked> Schedule & Status</label>
                        <label><input type="checkbox" name="reportSection" value="scrumAnalysis" checked> Design Analysis</label>
                    </div>
                    <button id="generate-report-preview-btn" class="primary-button" style="width: 100%; margin-top: 15px;">Generate Report Preview</button>
                </div>
            </div>
            
            <div class="document-category">
                <h4>QR Code Generator</h4>
                <p>Generate a QR code for this project's information.</p>
                <button id="generateQrCodeBtn" class="secondary-button">Generate Project QR Code</button>
                <div id="qr-code" style="margin-top: 10px; width: 128px; height: 128px; border: 1px solid #ccc; padding: 5px;"></div>
            </div>
            
            <div class="document-category">
                <h4>Download Documents</h4>
                <p>Package all uploaded project documents into a single ZIP file.</p>
                <button id="downloadAllDocsBtn" disabled>Download All as ZIP</button>
                <small id="download-doc-count" style="margin-left: 10px; color: #666;"></small>
            </div>

            <!-- MODIFICATION START: New Project Actions Section -->
            <div class="document-category">
                <h4>Project Actions</h4>
                <p>Perform administrative actions on this project. These actions are irreversible and require a password.</p>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button id="copy-project-btn" class="secondary-button" style="flex: 1;">Copy Project</button>
                    <button id="delete-project-btn" class="danger-button" style="flex: 1;">Delete Project</button>
                </div>
            </div>
            <!-- MODIFICATION END -->
        `;

        // Cache DOM Elements
        Object.assign(App.DOMElements, {
            saveGlobalPasswordsBtn: document.getElementById('saveGlobalPasswordsBtn'),
            saveProjectCredsBtn: document.getElementById('saveProjectCredsBtn'),
            resetDefaultsBtn: document.getElementById('resetDefaultsBtn'),
            scheduleScrumTasksBtn: document.getElementById('scheduleScrumTasksBtn'),
            scrumScheduleOutput: document.getElementById('scrumScheduleOutput'),
            calculateResourcesBtn: document.getElementById('calculateResourcesBtn'),
            resourcePredictionOutput: document.getElementById('resourcePredictionOutput'),
            generateQrCodeBtn: document.getElementById('generateQrCodeBtn'),
            qrCode: document.getElementById('qr-code'),
            downloadAllDocsBtn: document.getElementById('downloadAllDocsBtn'),
            downloadDocCount: document.getElementById('download-doc-count'),
            toggleReportOptionsBtn: document.getElementById('toggle-report-options-btn'),
            reportOptionsContainer: document.getElementById('report-options-container'),
            generateReportPreviewBtn: document.getElementById('generate-report-preview-btn'),
            copyProjectBtn: document.getElementById('copy-project-btn'),
            deleteProjectBtn: document.getElementById('delete-project-btn'),
            // MODIFICATION: Cache new elements
            siteTabVisibilityGrid: document.getElementById('site-tab-visibility-grid'),
            saveTabVisibilityBtn: document.getElementById('saveTabVisibilityBtn'),
            resetTabVisibilityBtn: document.getElementById('resetTabVisibilityBtn') // MODIFICATION: Cache reset button
        });

        setupEventListeners();
        loadGlobalAccessSettings();
        renderTabVisibilityUI(); // Render the new UI
    }

    function setupEventListeners() {
        App.DOMElements.saveGlobalPasswordsBtn?.addEventListener('click', saveGlobalAccessSettings);
        App.DOMElements.saveProjectCredsBtn?.addEventListener('click', saveProjectCredentials);
        App.DOMElements.resetDefaultsBtn?.addEventListener('click', fillDefaultGlobalCredentials);

        App.DOMElements.scheduleScrumTasksBtn?.addEventListener('click', scheduleScrumTasks);
        App.DOMElements.calculateResourcesBtn?.addEventListener('click', predictResources);
        App.DOMElements.generateQrCodeBtn?.addEventListener('click', generateQRCode);
        App.DOMElements.downloadAllDocsBtn?.addEventListener('click', handleDownloadAllDocs);

        App.DOMElements.toggleReportOptionsBtn?.addEventListener('click', () => {
            const container = App.DOMElements.reportOptionsContainer;
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
        });

        App.DOMElements.generateReportPreviewBtn?.addEventListener('click', () => {
            const reportTabButton = document.querySelector('.preview-tabs .tab-button[data-tab="project-report"]');
            reportTabButton?.click();
        });

        // MODIFICATION START: Event listeners for new buttons
        App.DOMElements.copyProjectBtn?.addEventListener('click', handleCopyProject);
        App.DOMElements.deleteProjectBtn?.addEventListener('click', handleDeleteProject);
        // MODIFICATION END
        // MODIFICATION: Add listener for new button
        App.DOMElements.saveTabVisibilityBtn?.addEventListener('click', saveTabVisibilitySettings);
        App.DOMElements.resetTabVisibilityBtn?.addEventListener('click', resetTabVisibilitySettings); // MODIFICATION: Add listener
    }
    // --- SITE TAB VISIBILITY ---
    const SITE_ROLES = ['admin', 'manager', 'engineer', 'contractor', 'site', 'client', 'designer', 'guest'];
    const SITE_TABS = ['client-info', 'contractor-info', 'status', 'schedule', 'boq', 'rfi', 'materials', 'mom', 'bulletins', 'noc-tracker', 'subcontractors', 'vendor-management', 'long-lead-items', 'tools', 'photos', 'documents', 'uploads', 'forms', 'letter-management', 'snags', 'payments', 'inventory', 'budget', 'bim-designer', 'calendar'];

    async function renderTabVisibilityUI() {
        const grid = App.DOMElements.siteTabVisibilityGrid;
        if (!grid) return;

        // Swapping Columns (Tabs) and Rows (Roles)
        // Set headers as Tab Names
        const tabsHeader = SITE_TABS.map(tab => `<div class="grid-header" title="${tab}">${tab}</div>`).join('');

        // Define grid structure: 1st column for Role Name (120px), others for Tabs (60px each)
        grid.style.gridTemplateColumns = `120px repeat(${SITE_TABS.length}, 60px)`;
        grid.innerHTML = `<div class="grid-header tab-name">Role Name</div>${tabsHeader}`;

        // Populate rows for each Role
        SITE_ROLES.forEach(role => {
            // First cell: Role Name (Label)
            grid.innerHTML += `<div class="grid-cell tab-name">${role}</div>`;

            // Following cells: Checkboxes for each Tab
            SITE_TABS.forEach(tab => {
                grid.innerHTML += `<div class="grid-cell">
                    <input type="checkbox" id="vis-check-${role}-${tab}" data-role="${role}" data-tab="${tab}">
                </div>`;
            });
        });
        await loadTabVisibilitySettings();
    }

    async function loadTabVisibilitySettings() {
        const settings = await DB.getSetting('site_tab_visibility');
        const roleTabsConfig = settings ? settings.config : null;

        SITE_TABS.forEach(tab => {
            SITE_ROLES.forEach(role => {
                const checkbox = document.getElementById(`vis-check-${role}-${tab}`);
                if (checkbox) {
                    if (roleTabsConfig) {
                        checkbox.checked = roleTabsConfig[role]?.includes(tab) || false;
                    } else {
                        // Use the default config imported from site_index via the global App object
                        checkbox.checked = (App.DEFAULT_SITE_ROLE_TABS && App.DEFAULT_SITE_ROLE_TABS[role]?.includes(tab)) || false;
                    }
                }
            });
        });
    }

    async function saveTabVisibilitySettings() {
        const newRoleTabsConfig = {};
        SITE_ROLES.forEach(role => {
            newRoleTabsConfig[role] = [];
        });

        const checkboxes = App.DOMElements.siteTabVisibilityGrid.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            if (cb.checked) {
                newRoleTabsConfig[cb.dataset.role].push(cb.dataset.tab);
            }
        });

        await DB.putSetting({ id: 'site_tab_visibility', config: newRoleTabsConfig });
        alert('Site tab visibility settings have been saved.');
        App.Bulletin.log('Settings Updated', 'Site application tab visibility was reconfigured.');
    }

    // MODIFICATION END
    // Runtime attachment of deleteProject to the DB object since database.js is not provided for modification.
    // This makes the feature work without needing to edit the original file.

    async function resetTabVisibilitySettings() {
        if (confirm("Are you sure you want to reset all site tab visibility settings to their original defaults?")) {
            await DB.deleteSetting('site_tab_visibility');
            await loadTabVisibilitySettings(); // Reload to show the defaults
            alert("Settings have been reset to default.");
            App.Bulletin.log('Settings Reset', 'Site tab visibility was reset to defaults.');
        }
    }

    async function verifyActionPasswordxx() {
        const password = prompt("Please enter the Admin or Project Manager password to proceed:");
        if (!password) return false;

        try {
            const settings = await DB.getSetting('access_control');
            const adminPass = settings?.credentials?.admin?.pass;
            const pmPass = settings?.credentials?.pm?.pass;
            console.log('pm');
            console.log(adminPass);
            console.log(pmPass);
            if (password === adminPass || password === pmPass) {
                return true;
            } else {
                alert("Incorrect password.");
                return false;
            }
        } catch (e) {
            alert("Could not verify password. Please set admin/pm passwords in Global System Access section.");
            return false;
        }
    }




    // MODIFICATION END

    // --- PROJECT SPECIFIC CREDENTIALS ---
    // Called when a project is loaded via populateTabData
    async function populateTabData(project) {
        if (!App.currentProjectJobNo) return;
        //document.querySelector('#project-specific-access p strong').textContent = `this specific project (${project.jobNo})`;
        const projSpecificAccessHeader = document.querySelector('#tools-tab .document-category h4');
        if (projSpecificAccessHeader) {
            projSpecificAccessHeader.nextElementSibling.innerHTML = `Set unique login credentials for <strong>this specific project (${project.jobNo})</strong>. These override global defaults.`;
        }
        // Load Docs info
        const masterFiles = await DB.getFiles(App.currentProjectJobNo, 'master');
        const siteFiles = await DB.getFiles(App.currentProjectJobNo, 'site');
        const fileCount = masterFiles.length + siteFiles.length;
        App.DOMElements.downloadDocCount.textContent = `(${fileCount} files found)`;
        App.DOMElements.downloadAllDocsBtn.disabled = fileCount === 0;

        // Load Project Credentials
        // Clear inputs first
        const roles = ['site', 'contractor', 'client', 'pm', 'mep', 'arch', 'str'];
        roles.forEach(role => {
            const userInput = document.getElementById(`proj-user-${role}`);
            const passInput = document.getElementById(`proj-pwd-${role}`);
            if (userInput) userInput.value = '';
            if (passInput) passInput.value = '';
        });

        // Fill if present
        const projectCreds = project.accessCredentials || {};
        roles.forEach(role => {
            const userInput = document.getElementById(`proj-user-${role}`);
            const passInput = document.getElementById(`proj-pwd-${role}`);
            if (projectCreds[role]) {
                if (userInput) userInput.value = projectCreds[role].user || '';
                if (passInput) passInput.value = projectCreds[role].pass || '';
            }
        });

        // Clear outputs
        App.DOMElements.resourcePredictionOutput.innerHTML = '';
        App.DOMElements.qrCode.innerHTML = '';
        App.DOMElements.scrumScheduleOutput.innerHTML = '';
    }

    async function saveProjectCredentials() {
        if (!App.currentProjectJobNo) {
            alert("Please select/save a project first.");
            return;
        }

        // Fetch current project state from DB to avoid overwriting other fields
        const project = await DB.getProject(App.currentProjectJobNo);
        if (!project) {
            alert("Error: Project not found in database.");
            return;
        }

        const roles = ['site', 'contractor', 'client', 'pm', 'mep', 'str', 'arch'];
        const newCreds = {};

        roles.forEach(role => {
            const user = document.getElementById(`proj-user-${role}`).value.trim();
            const pass = document.getElementById(`proj-pwd-${role}`).value.trim();
            if (user && pass) {

                newCreds[role] = { user, pass };

            }
        });

        // Update the specific property
        project.accessCredentials = newCreds;

        // await DB.putSetting(newCreds);
        // Save back to PROJECTS store, NOT settings
        await DB.putProject(project);
        alert(`Access credentials for Project ${App.currentProjectJobNo} saved successfully.`);

        alert('user:' + 'saved');
    }

    // --- GLOBAL CREDENTIALS MANAGEMENT ---

    function fillDefaultGlobalCredentials() {
        Object.keys(DEFAULT_CREDENTIALS).forEach(key => {
            const userInput = document.getElementById(`global-user-${key}`);
            const passInput = document.getElementById(`global-pwd-${key}`);
            if (userInput) userInput.value = DEFAULT_CREDENTIALS[key].user;
            if (passInput) passInput.value = DEFAULT_CREDENTIALS[key].pass;
        });
    }

    async function loadGlobalAccessSettings() {
        try {
            const settings = await DB.getSetting('access_control');
            if (settings && settings.credentials) {
                // Load from DB
                Object.keys(DEFAULT_CREDENTIALS).forEach(key => {
                    const saved = settings.credentials[key] || {};
                    const userInput = document.getElementById(`global-user-${key}`);
                    const passInput = document.getElementById(`global-pwd-${key}`);
                    if (userInput) userInput.value = saved.user || '';
                    if (passInput) passInput.value = saved.pass || '';
                });
            } else {
                // If no settings exist in DB, fill with Defaults
                console.log("No saved credentials found. Loading defaults.");
                fillDefaultGlobalCredentials();
            }
        } catch (e) {
            console.warn("Could not load access settings", e);
            fillDefaultGlobalCredentials(); // Fallback
        }
    }

    async function saveGlobalAccessSettings() {
        const credentials = {};

        Object.keys(DEFAULT_CREDENTIALS).forEach(key => {
            credentials[key] = {
                user: document.getElementById(`global-user-${key}`).value,
                pass: document.getElementById(`global-pwd-${key}`).value
            };
        });

        // Flatten passwords for backward compatibility with simple verifyPassword helper if needed
        const passwords = {};
        Object.keys(credentials).forEach(key => passwords[key] = credentials[key].pass);

        try {
            // Save both the full credentials object (for logins) and the password map (for approvals)
            await DB.putSetting({ id: 'access_control', credentials, passwords });
            alert("Global system credentials saved successfully.");
        } catch (e) {
            console.error("Error saving settings", e);
            alert("Failed to save settings.");
        }
    }

    // --- Existing Tab Logic (Scrum, Resources, Reports, etc.) ---
    // MODIFICATION START: New functions for Copy/Delete actions
    // MODIFICATION START: Fortified verifyActionPassword function
    async function verifyActionPassword() {
        const password = prompt("Please enter the Admin or Project Manager password to proceed:");
        //alert(password);
        if (!password) return false;

        // --- MASTER PASSWORD ---
        // This is a hardcoded fallback password. 
        // It's useful for recovery if database settings are lost or forgotten.
        // Change this value to something secure and memorable for your organization.
        const MASTER_PASSWORD = 'master_override@2024';

        if (password === MASTER_PASSWORD) {
            console.warn("Master password used for verification.");
            return true;
        }

        try {
            const settings = await DB.getSetting('access_control');
            const adminPass = settings?.credentials?.admin?.pass;
            const pmPass = settings?.credentials?.pm?.pass;

            if (password === adminPass || password === pmPass) {
                return true;
            } else {
                alert("Incorrect password.");
                return false;
            }
        } catch (e) {
            console.error("Database error during password verification:", e);
            // The catch block now primarily informs the user of a system issue,
            // as the master password check already happened.
            alert("Could not verify password due to a system error. Please check the console. The master password can still be used.");
            return false;
        }
    }
    if (window.DB && !DB.deleteProject) {
        DB.deleteProject = async function (jobNo) {
            if (!jobNo) return;
            const db = await this.getDb();
            const stores = ['projects', 'files', 'scrum', 'site_data', 'payment_certs'];
            const tx = db.transaction(stores, 'readwrite');

            const promises = [];
            // Delete from stores where jobNo is the primary key
            promises.push(tx.objectStore('projects').delete(jobNo));
            promises.push(tx.objectStore('scrum').delete(jobNo));
            promises.push(tx.objectStore('site_data').delete(jobNo));

            // Helper to delete from stores where jobNo is an index
            async function deleteFromIndex(store, indexName, key) {
                const index = store.index(indexName);
                let cursor = await index.openCursor(key);
                while (cursor) {
                    store.delete(cursor.primaryKey); // No need to await this inside the loop
                    cursor = await cursor.continue();
                }
            }

            await Promise.all([
                deleteFromIndex(tx.objectStore('files'), 'jobNo', jobNo),
                deleteFromIndex(tx.objectStore('payment_certs'), 'jobNo', jobNo)
            ]);

            await tx.done;
        }
    }
    async function handleDeleteProject() {
        if (!App.currentProjectJobNo) return;

        const isVerified = await verifyActionPassword();

        if (!isVerified) return;

        if (confirm(`ARE YOU ABSOLUTELY SURE?\n\nThis will permanently delete project ${App.currentProjectJobNo} and all its associated data (invoices, files, scrum tasks, etc.).\n\nThis action cannot be undone.`)) {
            try {
                await DB.deleteProject(App.currentProjectJobNo);
                alert(`Project ${App.currentProjectJobNo} has been deleted successfully.`);
                App.Bulletin.log('Project Deleted', `Project <strong>${App.currentProjectJobNo}</strong> was permanently deleted.`);
                App.showDashboard();
            } catch (error) {
                console.error("Error deleting project:", error);
                alert("An error occurred while deleting the project. Check the console for details.");
            }
        }
    }
    async function handleCopyProject() {
        if (!App.currentProjectJobNo) return;

        const isVerified = await verifyActionPassword();
        if (!isVerified) return;

        try {
            const originalJobNo = App.currentProjectJobNo;

            const allProjects = await DB.getAllProjects();
            const nextId = allProjects.length > 0 ? Math.max(...(allProjects.map(p => parseInt(p.jobNo.split('/').pop(), 10) || 0))) + 1 : 1;
            const newJobNo = `RRC/${new Date().getFullYear()}/${String(nextId).padStart(3, '0')}`;

            const originalProject = await DB.getProject(originalJobNo);
            const originalFiles = await DB.getFiles(originalJobNo);
            const originalScrum = await DB.getScrumData(originalJobNo);

            const newProject = JSON.parse(JSON.stringify(originalProject));
            newProject.jobNo = newJobNo;
            newProject.agreementDate = new Date().toISOString().split('T')[0];
            newProject.clientName = `[COPY] ${originalProject.clientName}`;
            newProject.projectStatus = 'Pending';
            newProject.invoices = []; // Do not copy invoices

            await DB.putProject(newProject);

            if (originalScrum && originalScrum.tasks) {
                const newScrum = JSON.parse(JSON.stringify(originalScrum));
                newScrum.jobNo = newJobNo;
                await DB.putScrumData(newScrum);
            }

            for (const file of originalFiles) {
                const newFile = { ...file };
                delete newFile.id;
                newFile.jobNo = newJobNo;
                await DB.putFile(newFile);
            }

            alert(`Project copied successfully. New Job No: ${newJobNo}`);
            App.Bulletin.log('Project Copied', `Project <strong>${originalJobNo}</strong> was copied to <strong>${newJobNo}</strong>.`);

            App.handleEditProject(newJobNo);

        } catch (error) {
            console.error("Error copying project:", error);
            alert("An error occurred while copying the project. Check console for details.");
        }
    }
    async function scheduleScrumTasks() {
        if (!App.currentProjectJobNo) {
            alert("Please save the project first.");
            return;
        }

        const project = await DB.getProject(App.currentProjectJobNo);
        const designMonths = project.designDuration;
        const startDate = new Date(project.agreementDate + 'T00:00:00');

        if (!designMonths || designMonths <= 0 || isNaN(startDate.getTime())) {
            alert("Please set a valid Agreement Date (in Main tab) and Design Duration (in Fees tab) greater than 0.");
            return;
        }

        if (!confirm(`This will add any missing default tasks and overwrite existing due dates for all default scrum tasks for project ${App.currentProjectJobNo}. Custom tasks will not be affected. Do you want to continue?`)) {
            return;
        }

        const outputDiv = App.DOMElements.scrumScheduleOutput;
        outputDiv.innerHTML = "Processing and scheduling tasks...";

        try {
            let scrumData = await DB.getScrumData(App.currentProjectJobNo);
            if (!scrumData) {
                scrumData = { jobNo: App.currentProjectJobNo, tasks: [] };
            }

            const totalWorkDays = designMonths * 22; // Approximate work days in a month (excluding weekends)
            const defaultTasksTemplate = DESIGN_SCRUM_TEMPLATE || [];
            const totalDurationUnits = defaultTasksTemplate.reduce((sum, task) => sum + task.duration, 0);

            if (totalDurationUnits === 0) {
                outputDiv.innerHTML = "<p style='color:red;'>Error: No task durations defined in the template.</p>";
                return;
            }

            let currentDayOffset = 0;
            let scheduledCount = 0;
            let addedCount = 0;

            defaultTasksTemplate.forEach(templateTask => {
                const taskWorkDays = (templateTask.duration / totalDurationUnits) * totalWorkDays;
                currentDayOffset += taskWorkDays;

                let dueDate = new Date(startDate);
                let addedDays = 0;
                while (addedDays < Math.round(currentDayOffset)) {
                    dueDate.setDate(dueDate.getDate() + 1);
                    if (dueDate.getDay() !== 6 && dueDate.getDay() !== 0) {
                        addedDays++;
                    }
                }
                const calculatedDueDate = dueDate.toISOString().split('T')[0];

                let existingTask = scrumData.tasks.find(t => t.id === templateTask.id);

                if (existingTask) {
                    existingTask.dueDate = calculatedDueDate;
                    // Also update the planned duration in case template changed
                    existingTask.plannedDuration = templateTask.duration;
                } else {
                    const newTask = {
                        ...templateTask,
                        status: 'Up Next',
                        assigneeId: null,
                        dueDate: calculatedDueDate,
                        startDate: null,
                        completedDate: null,
                        plannedDuration: templateTask.duration,
                        dateAdded: new Date().toISOString().split('T')[0]
                    };
                    scrumData.tasks.push(newTask);
                    addedCount++;
                }
                scheduledCount++;
            });

            await DB.putScrumData(scrumData);

            outputDiv.innerHTML = `<p style='color:green;'>Successfully scheduled ${scheduledCount} default tasks. Added ${addedCount} new tasks. All tasks are scheduled over ${designMonths} months.</p>`;
            App.Bulletin.log('Scrum Tasks Scheduled', `Default design tasks for project <strong>${App.currentProjectJobNo}</strong> have been scheduled.`);

            if (typeof App.refreshDesignStudioSelector === 'function') {
                await App.refreshDesignStudioSelector();
            }

        } catch (error) {
            console.error("Error scheduling scrum tasks:", error);
            outputDiv.innerHTML = "<p style='color:red;'>An error occurred during scheduling. Check the console.</p>";
        }
    }

    async function predictResources() {
        const outputDiv = App.DOMElements.resourcePredictionOutput;
        outputDiv.innerHTML = 'Calculating...';

        const project = await DB.getProject(App.currentProjectJobNo);
        const scrumData = await DB.getScrumData(App.currentProjectJobNo);
        const allStaff = await DB.getAllHRData();

        if (!project || !scrumData || !scrumData.tasks || scrumData.tasks.length === 0) {
            outputDiv.innerHTML = 'No scrum tasks found for this project. Please add tasks first.';
            return;
        }

        // 1. Calculate Project Overhead Cost based on actual task timeline
        const taskDates = scrumData.tasks.map(t => new Date(t.dueDate)).filter(d => !isNaN(d.getTime()));
        if (taskDates.length === 0) {
            outputDiv.innerHTML = 'Cannot calculate cost. No tasks have due dates set.';
            return;
        }
        const minDate = new Date(Math.min.apply(null, taskDates));
        const maxDate = new Date(Math.max.apply(null, taskDates));

        // Calculate total months spanned by the tasks, rounding up
        const totalDaysSpanned = (maxDate - minDate) / (1000 * 60 * 60 * 24);
        const projectDurationMonths = Math.max(1, Math.ceil(totalDaysSpanned / 30));

        const totalYearlyExpense = (typeof YEARLY_FIXED_EXPENSES !== 'undefined') ? YEARLY_FIXED_EXPENSES.reduce((sum, item) => sum + item.amount, 0) : 0;
        const totalMonthlyExpense = (typeof MONTHLY_OFFICE_EXPENSES !== 'undefined') ? MONTHLY_OFFICE_EXPENSES.reduce((sum, item) => sum + item.amount, 0) : 0;
        const monthlyOverhead = (totalYearlyExpense / 12) + totalMonthlyExpense;
        const projectOverheadCost = monthlyOverhead * projectDurationMonths;


        // 2. Calculate Direct Labor costs and man-days per department
        const staffSalaryMap = new Map(allStaff.map(s => [s.id, s.grossSalary]));
        const directCostsByDept = {};
        let totalDirectLaborCost = 0;
        let totalDays = 0;

        for (const task of scrumData.tasks) {
            const department = task.department || 'Default';
            const duration = task.plannedDuration || 1;

            let salary = 0;
            if (task.assigneeId && staffSalaryMap.has(task.assigneeId)) {
                salary = staffSalaryMap.get(task.assigneeId);
            } else {
                salary = DEFAULT_DEPARTMENT_SALARIES[department] || DEFAULT_DEPARTMENT_SALARIES['Default'];
            }

            const dailyRate = salary / 22; // Assuming 22 working days per month
            const taskCost = dailyRate * duration;

            if (!directCostsByDept[department]) {
                directCostsByDept[department] = { totalCost: 0, totalDays: 0 };
            }
            directCostsByDept[department].totalCost += taskCost;
            directCostsByDept[department].totalDays += duration;

            totalDirectLaborCost += taskCost;
            totalDays += duration;
        }

        // 3. Allocate overhead and build the results table
        let tableHtml = `<table class="output-table"><tr><th>Department</th><th>Est. Man-Days</th><th>Est. Total Cost (AED)</th></tr>`;
        for (const dept in directCostsByDept) {
            const directCost = directCostsByDept[dept].totalCost;
            const days = directCostsByDept[dept].totalDays;

            const workShare = totalDays > 0 ? (days / totalDays) : 0;
            const overheadShare = projectOverheadCost * workShare;
            const totalDeptCost = directCost + overheadShare;

            tableHtml += `<tr>
                <td>${dept}</td>
                <td>${days.toFixed(1)}</td>
                <td title="Direct Labor: ${App.formatCurrency(directCost)} | Allocated Overhead: ${App.formatCurrency(overheadShare)}">${App.formatCurrency(totalDeptCost)}</td>
            </tr>`;
        }

        const grandTotalCost = totalDirectLaborCost + projectOverheadCost;
        tableHtml += `<tfoot><tr><td><b>Total</b></td><td><b>${totalDays.toFixed(1)}</b></td><td><b>${App.formatCurrency(grandTotalCost)}</b></td></tr></tfoot></table>`;

        // 4. Build the final summary HTML
        const totalFee = App.ProjectTabs.Fees.getFeeDistribution(project).totalConsultancyFee;
        const profit = totalFee - grandTotalCost;
        const profitPercentage = totalFee > 0 ? ((profit / totalFee) * 100).toFixed(1) : 0;

        outputDiv.innerHTML = `
            <div class="financial-summary"><h4>Cost vs. Fee Summary (Estimated over ${projectDurationMonths} months)</h4>
                <div class="summary-line"><span>Total Consultancy Fee (A)</span><span>${App.formatCurrency(totalFee)}</span></div>
                <div class="summary-line"><span>Total Estimated Project Cost (B)</span><span>${App.formatCurrency(grandTotalCost)}</span></div>
                <div style="padding-left: 15px; font-size: 0.9em; color: #555;">
                    <div class="summary-line"><span>- Direct Labor Cost</span><span>${App.formatCurrency(totalDirectLaborCost)}</span></div>
                    <div class="summary-line"><span>- Project Overhead Cost</span><span>${App.formatCurrency(projectOverheadCost)}</span></div>
                </div>
                <div class="summary-line" style="border-top: 1px solid #ccc; margin-top: 4px; padding-top: 4px;">
                    <span><strong>Estimated Margin (A-B)</strong></span>
                    <span><strong style="color: ${profit < 0 ? '#dc3545' : 'green'};">${App.formatCurrency(profit)} (${profitPercentage}%)</strong></span>
                </div>
            </div>${tableHtml}`;
    }

    async function generateQRCode() {
        const project = await DB.getProject(App.currentProjectJobNo);
        if (!project) {
            alert("Please save the project first.");
            return;
        }
        const feeData = App.ProjectTabs.Fees.getFeeDistribution(project).totalConsultancyFee;
        const qrData = `Client:${project.clientName},Plot:${project.plotNo},Fee:${Math.round(feeData)}`;

        const qrContainer = App.DOMElements.qrCode;
        qrContainer.innerHTML = "";
        try {
            new QRCode(qrContainer, { text: qrData, width: 128, height: 128 });
        } catch (error) {
            console.error("QR Code generation failed:", error);
            qrContainer.innerHTML = "Data too long for QR Code.";
        }
    }

    async function handleDownloadAllDocs() {
        if (!App.currentProjectJobNo) return;

        const btn = App.DOMElements.downloadAllDocsBtn;
        btn.disabled = true;
        btn.textContent = 'Preparing ZIP...';

        try {
            const masterFiles = await DB.getFiles(App.currentProjectJobNo, 'master');
            const siteFiles = await DB.getFiles(App.currentProjectJobNo, 'site');
            const allFiles = [...masterFiles, ...siteFiles];

            if (allFiles.length === 0) {
                alert('No documents have been uploaded for this project.');
                return;
            }

            const zip = new JSZip();

            for (const file of allFiles) {
                const base64Data = file.dataUrl.substring(file.dataUrl.indexOf(',') + 1);
                zip.file(file.name, base64Data, { base64: true });
            }

            const content = await zip.generateAsync({ type: "blob" });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = `Project_${App.currentProjectJobNo.replace(/\//g, '-')}_Documents.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error("Error generating ZIP file:", error);
            alert("An error occurred while creating the ZIP file. Please check the console for details.");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Download All as ZIP';
            populateTabData(); // Refresh file count
        }
    }

    async function renderPreview() {
        const container = App.DOMElements['project-report-preview'];
        container.innerHTML = '<h3>Generating Report... Please Wait</h3>';

        if (!App.currentProjectJobNo) {
            container.innerHTML = '<p>Please save the project first.</p>';
            return;
        }

        const selectedSections = Array.from(document.querySelectorAll('input[name="reportSection"]:checked')).map(cb => cb.value);

        // Gather all data
        const project = await DB.getProject(App.currentProjectJobNo);
        const siteData = await DB.getSiteData(App.currentProjectJobNo);
        const scrumData = await DB.getScrumData(App.currentProjectJobNo);
        const allStaff = await DB.getAllHRData();

        // Combine DB data with current UI data for accuracy
        const fullProjectData = {
            ...project,
            ...App.ProjectTabs.Main.getTabData(),
            ...App.ProjectTabs.Fees.getTabData()
        };
        const feeDistribution = App.ProjectTabs.Fees.getFeeDistribution(fullProjectData);

        // Pass all collected data to the template generator
        const reportHtml = PROJECT_DOCUMENT_TEMPLATES.projectReport({
            project: fullProjectData,
            siteData,
            scrumData,
            allStaff,
            feeDistribution,
            selectedSections
        });

        container.innerHTML = reportHtml;
    }

    return { init, populateTabData, renderPreview };

})();
