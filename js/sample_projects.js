//--- START OF FILE js/sample_projects.js ---
const SAMPLE_PROJECT_TEMPLATES = {
    "Villa": {
        "projectStatus": "In Progress",
        "clientName": "Mr. Sample Client",
        "clientMobile": "+971 50 123 4567",
        "clientEmail": "sample.client@example.com",
        "clientPOBox": "12345, Dubai",
        "clientTrn": "100123456789012",
        "scopeOfWorkTypes": {
            "Architectural": true,
            "Structural": true,
            "MEP": true,
            "Supervision": true
        },
        "authority": "DM",
        "projectType": "Villa",
        "projectDescription": "G+1 Sample Villa Project",
        "plotNo": "SMPL-001",
        "area": "Al Barsha South",
        "builtUpArea": 7500,
        "remunerationType": "percentage",
        "constructionCostRate": 320,
        "consultancyFeePercentage": 4.5,
        "designFeeSplit": 60,
        "designDuration": 5,
        "constructionDuration": 16,
        "extendedSupervisionFee": 8000,
        "vatRate": 5,
        "feeMilestones": [
            { "id": "1.1", "text": "Upon Signing the Agreement.", "percentage": 10 },
            { "id": "2.1", "text": "Upon Submission of Concept Design.", "percentage": 15 },
            { "id": "3.1", "text": "Upon Submission of Preliminary Design to authorities.", "percentage": 25 },
            { "id": "4.1", "text": "Upon getting Building Permit.", "percentage": 30 },
            { "id": "4.2", "text": "Upon Submission of Final Design (Tender documents).", "percentage": 10 },
            { "id": "4.3", "text": "Upon Submission of Interior Design.", "percentage": 10 }
        ],
        "scope": {
            "1": { "1.1": true, "1.2": true, "1.3": true },
            "2": { "2.1": true, "2.2": true, "2.3": true, "2.4": true, "2.5": true },
            "3": { "3.1": true, "3.2": true, "3.3": true, "3.4": true },
            "3.2": { "3.2.1": true, "3.2.2": true, "3.2.3": true, "3.2.4": true, "3.2.5": true },
            "5": { "5.1": true, "5.2": true, "5.3": true }
        },
        "invoices": [
            {
                "no": "UA-SAMPLE-01",
                "date": "2023-10-01",
                "type": "Tax Invoice",
                "status": "Paid",
                "items": [
                    { "type": "milestone", "milestoneId": "1.1", "description": "1st payment on Design fees: Upon Signing the Agreement.", "amount": 15187.5 }
                ],
                "subtotal": 15187.5, "vat": 759.38, "total": 15946.88,
                "paymentDetails": { "method": "Bank Transfer", "amountPaid": 15946.88, "date": "2023-10-05" }
            },
            {
                "no": "UA-SAMPLE-02",
                "date": "2023-10-25",
                "type": "Tax Invoice",
                "status": "Raised",
                "items": [
                    { "type": "milestone", "milestoneId": "2.1", "description": "2nd payment on Design fees: Upon Submission of Concept Design.", "amount": 22781.25 }
                ],
                "subtotal": 22781.25, "vat": 1139.06, "total": 23920.31
            }
        ],
        "scrumTasks": [
            { "id": "arch_01", "name": "Concept Design & Mood Board", "department": "ARCH", "duration": 5, "status": "Done", "assigneeId": "some_id", "dueDate": "2023-10-20", "completedDate": "2023-10-19" },
            { "id": "arch_02", "name": "Schematic Design and 3D Views", "department": "ARCH", "duration": 8, "status": "In Progress", "assigneeId": "some_id", "dueDate": "2023-11-15" },
            { "id": "str_01", "name": "Concept Structural System", "department": "STR", "duration": 3, "status": "Up Next", "assigneeId": null, "dueDate": "2023-11-20" }
        ]
    }
};