
// --- START OF FILE js/site_modules/client_info_module.js ---

const ClientInfoModule = (() => {
    let elements = {};
    let currentData = {};

    const cacheElements = () => {
        elements = {
            name: document.getElementById('client-info-name'),
            contactPerson: document.getElementById('client-info-contact-person'),
            mobile: document.getElementById('client-info-mobile'),
            phone1: document.getElementById('client-info-phone1'),
            phone2: document.getElementById('client-info-phone2'),
            email1: document.getElementById('client-info-email1'),
            email2: document.getElementById('client-info-email2'),
            fax: document.getElementById('client-info-fax'),
            website: document.getElementById('client-info-website'),
            map: document.getElementById('client-info-map'),
            address: document.getElementById('client-info-address'),
            logo1Input: document.getElementById('client-info-logo1-input'),
            logo1Preview: document.getElementById('client-info-logo1-preview'),
            logo2Input: document.getElementById('client-info-logo2-input'),
            logo2Preview: document.getElementById('client-info-logo2-preview'),
            saveBtn: document.getElementById('save-client-info-btn'),
        };
    };

    const handleLogoUpload = (input, preview, key) => {
        const file = input.files[0];
        if (!file) {
            return; // User cancelled file selection
        }

        if (!file.type.match('image.*')) {
            alert('Please select a valid image file (e.g., JPG, PNG, GIF).');
            input.value = ''; // Reset the file input
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            currentData[key] = e.target.result;
        };
         reader.onerror = (error) => {
            console.error('Error reading logo file:', error);
            alert('An error occurred while reading the logo file.');
        };
        
        reader.readAsDataURL(file);
    };

    const init = (context) => {
        cacheElements();
        elements.logo1Input.addEventListener('change', () => handleLogoUpload(elements.logo1Input, elements.logo1Preview, 'logo1'));
        elements.logo2Input.addEventListener('change', () => handleLogoUpload(elements.logo2Input, elements.logo2Preview, 'logo2'));
        elements.saveBtn.addEventListener('click', () => handleSave(context));
    };

    const render = (project) => {
        currentData = project.clientInfo || {};
        for (const key in elements) {
            console.log('key:' + key);// **THE FIX IS HERE**: Check that the input is not a file input before setting its value.
            if ((elements[key].tagName === 'INPUT' || elements[key].tagName === 'TEXTAREA') && elements[key].type !== 'file') {
                
               // const dataKey = key.replace(/([A-Z])/g, '-$1').toLowerCase(); // camelCase to kebab-case-ish
                //console.log('dataKey:' + dataKey);
                elements[key].value = currentData[key] || '';
                console.log('dataKey1:' );
            }
        }
        elements.logo1Preview.src = currentData.logo1 || '';
        elements.logo2Preview.src = currentData.logo2 || '';
    };

    const handleSave = async (context) => {
        const jobNo = context.getState().currentJobNo;
        if (!jobNo) return;

        const project = await window.DB.getProject(jobNo);
        
        let clientInfo = project.clientInfo || {};
        for (const key in elements) {
              if ((elements[key].tagName === 'INPUT' || elements[key].tagName === 'TEXTAREA') && elements[key].type !== 'file') {
                clientInfo[key] = elements[key].value;
            }
        }
        // Logos are saved via the change handler into currentData
        clientInfo.logo1 = currentData.logo1;
        clientInfo.logo2 = currentData.logo2;

        project.clientInfo = clientInfo;
        await window.DB.putProject(project);

        alert('Client information saved successfully!');
    };

    return { init, render };
})();

export { ClientInfoModule };