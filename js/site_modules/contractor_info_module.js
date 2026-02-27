// --- START OF FILE js/site_modules/contractor_info_module.js ---

const ContractorInfoModule = (() => {
    let elements = {};
    let currentData = {};

    const cacheElements = () => {
        elements = {
            name: document.getElementById('contractor-info-name'),
            contactPerson: document.getElementById('contractor-info-contact-person'),
            mobile: document.getElementById('contractor-info-mobile'),
            phone1: document.getElementById('contractor-info-phone1'),
            phone2: document.getElementById('contractor-info-phone2'),
            email1: document.getElementById('contractor-info-email1'),
            email2: document.getElementById('contractor-info-email2'),
            fax: document.getElementById('contractor-info-fax'),
            website: document.getElementById('contractor-info-website'),
            map: document.getElementById('contractor-info-map'),
            address: document.getElementById('contractor-info-address'),
            logo1Input: document.getElementById('contractor-info-logo1-input'),
            logo1Preview: document.getElementById('contractor-info-logo1-preview'),
            logo2Input: document.getElementById('contractor-info-logo2-input'),
            logo2Preview: document.getElementById('contractor-info-logo2-preview'),
            saveBtn: document.getElementById('save-contractor-info-btn'),
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
        currentData = project.contractorInfo || {};
        for (const key in elements) { // **THE FIX IS HERE**: Check that the input is not a file input before setting its value.
            if ((elements[key].tagName === 'INPUT' || elements[key].tagName === 'TEXTAREA') && elements[key].type !== 'file') {
                elements[key].value = currentData[key] || '';
            }
        }
        elements.logo1Preview.src = currentData.logo1 || '';
        elements.logo2Preview.src = currentData.logo2 || '';
    };

    const handleSave = async (context) => {
        const jobNo = context.getState().currentJobNo;
        if (!jobNo) return;

        const project = await window.DB.getProject(jobNo);
        
        let contractorInfo = project.contractorInfo || {};
        for (const key in elements) {
            if ((elements[key].tagName === 'INPUT' || elements[key].tagName === 'TEXTAREA') && elements[key].type !== 'file') {
                contractorInfo[key] = elements[key].value;
            }
        }
        contractorInfo.logo1 = currentData.logo1;
        contractorInfo.logo2 = currentData.logo2;

        project.contractorInfo = contractorInfo;
        await window.DB.putProject(project);

        alert('Contractor information saved successfully!');
    };

    return { init, render };
})();

export { ContractorInfoModule };