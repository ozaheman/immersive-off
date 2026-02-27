/**
 * @module LetterTemplates
 * Shared letter templates for HR and Project Management.
 * Includes standardized content placeholders.
 */

window.LetterTemplates = {
    // Shared Categories
    CATEGORIES: {
        HR: 'HR Letters',
        PROJECT: 'Project Letters',
        GENERAL: 'General Official'
    },

    // Templates keyed by ID
    LIST: {
        'official-comm': {
            id: 'official-comm',
            category: 'GENERAL',
            name: 'Official Communication',
            description: 'Standard template for official communication',
            subject: 'Official Communication regarding [Topic]',
            body: `Dear [Name],

This letter is to formally communicate regarding [Topic]. We would like to bring to your attention that [Detailed Description].

We appreciate your cooperation in this matter. Should you have any questions, please do not hesitate to contact us.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'project-proposal': {
            id: 'project-proposal',
            category: 'PROJECT',
            name: 'Project Proposal',
            description: 'Standard template for project proposal',
            subject: 'Proposal for [Project Name] - [Project Location]',
            body: `Dear [Client Name],

Following our recent discussion, we are pleased to submit our professional proposal for the [Project Description] located at [Location].

Our services included in this proposal are:
1. Architectural Design & Planning
2. Structural Engineering
3. MEP Coordination
4. Authority Approvals

We look forward to the possibility of working together on this landmark project.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'agreement-letter': {
            id: 'agreement-letter',
            category: 'PROJECT',
            name: 'Agreement Letter',
            description: 'Standard template for agreement letter',
            subject: 'Letter of Agreement - [Project Name]',
            body: `Dear [Name],

This Letter of Agreement sets forth the terms and conditions under which IMMERSIVE ENGINEERING CONSULTANTS L.L.C will perform services for [Project Name].

1. Scope of Work: [Details]
2. Professional Fees: [Amount]
3. Timeline: [Duration]

Please sign and return a copy of this letter to signify your acceptance of these terms.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'quotation-request': {
            id: 'quotation-request',
            category: 'PROJECT',
            name: 'Quotation Request',
            description: 'Standard template for quotation request',
            subject: 'Request for Quotation: [Item/Service Name]',
            body: `Dear [Vendor Name],

We are currently working on a project in [Location] and would like to request a formal quotation for the following:

[Item 1 Description] - [Quantity]
[Item 2 Description] - [Quantity]

Please include the delivery timeline and payment terms in your quote. We look forward to receiving your proposal by [Date].

Sincerely,
Procurement Department
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'project-completion': {
            id: 'project-completion',
            category: 'PROJECT',
            name: 'Project Completion',
            description: 'Standard template for project completion',
            subject: 'Certificate of Completion: [Project Name]',
            body: `Dear [Client Name],

We are pleased to formally notify you that the [Project Description] at [Location] has been successfully completed as of [Date].

All works have been executed in accordance with the approved drawings and authority regulations. We have also obtained the necessary final clearances from [Authorities].

It has been a pleasure serving you on this project.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'follow-up': {
            id: 'follow-up',
            category: 'GENERAL',
            name: 'Follow-up Letter',
            description: 'Standard template for follow-up letter',
            subject: 'Follow-up on [Previous Topic/Meeting Date]',
            body: `Dear [Name],

We are following up on our [Meeting/Email] dated [Date] regarding [Topic].

We would appreciate an update on the status of [Specific Action Item]. Please let us know if you require any further information from our side to proceed.

Thank you for your time and consideration.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'notice-circular': {
            id: 'notice-circular',
            category: 'GENERAL',
            name: 'Notice/Circular',
            description: 'Standard template for notice/circular',
            subject: 'Notice: [Announcement Subject]',
            body: `To All Concerned / Staff members,

Please be advised that [Announcement Detail/Policy Change]. This change is effective from [Effective Date].

All parties are requested to comply with the above instructions.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        // HR Specific (from existing formats)
        'appreciation': {
            id: 'appreciation',
            category: 'HR',
            name: 'Letter of Appreciation',
            description: 'Acknowledge outstanding performance',
            subject: 'Letter of Appreciation for Outstanding Performance',
            body: `Dear [Employee Name],

We are writing to formally express our sincere appreciation for your outstanding contribution regarding [Specific Project/Achievement]. Your dedication and hard work have been invaluable to the success of our team.

We are proud to have you as a member of Urban Axis.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'warning': {
            id: 'warning',
            category: 'HR',
            name: 'Warning Letter',
            description: 'Formal warning for policy breach',
            subject: 'Formal Warning Regarding [Policy/Conduct]',
            body: `Dear [Employee Name],

This letter serves as a formal warning regarding [Description of Violation/Conduct Issue].

We expect to see immediate and sustained improvement in this area. Failure to comply with company standards and policies moving forward may result in further disciplinary action, up to and including termination.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'termination': {
            id: 'termination',
            category: 'HR',
            name: 'Termination Letter',
            description: 'Formal termination of employment',
            subject: 'Letter of Termination',
            body: `Dear [Employee Name],

This letter confirms the termination of your employment with Urban Axis, effective [Date].

This decision is based on [Reason]. We wish you the best in your future endeavors.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'salary-certificate': {
            id: 'salary-certificate',
            category: 'HR',
            name: 'Salary Certificate',
            description: 'Standard salary certificate for banks/authorities',
            subject: 'Salary Certificate',
            body: `TO WHOM IT MAY CONCERN

This is to certify that Mr. / Ms. [Employee Name], holder of Passport No. [Passport No.], has been employed with IMMERSIVE ENGINEERING CONSULTANTS L.L.C since [Join Date].

Currently, he/she is designated as [Role] and his/her monthly salary is as follows:

Basic Salary : AED [Amount]
Allowances   : AED [Amount]
Total Salary : AED [Total]

This certificate is issued upon the request of the employee for whatever legal purpose it may serve.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'experience-certificate': {
            id: 'experience-certificate',
            category: 'HR',
            name: 'Experience Certificate',
            description: 'Proof of employment and experience',
            subject: 'Experience Certificate',
            body: `TO WHOM IT MAY CONCERN

This is to certify that Mr. / Ms. [Employee Name] was employed with IMMERSIVE ENGINEERING CONSULTANTS L.L.C from [Start Date] to [End Date].

During his/her employment with us, he/she was designated as [Role].

His/her conduct during the tenure was satisfactory. We wish him/her all the best in his/her future endeavors.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'authority-letter': {
            id: 'authority-letter',
            category: 'GENERAL',
            name: 'Authority Letter',
            description: 'Authorize staff to represent company',
            subject: 'Letter of Authority',
            body: `TO WHOM IT MAY CONCERN

This letter is to authorize the bearer, Mr. / Ms. [Staff Name], holding Emirates ID No. [EID], to represent IMMERSIVE ENGINEERING CONSULTANTS L.L.C for the purpose of [Reason].

Any assistance extended to him/her in this regard would be highly appreciated.

Sincerely,
Management
IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'consultant-appointment': {
            id: 'consultant-appointment',
            category: 'PROJECT',
            name: 'Consultant Appointment',
            description: 'Appointment letter for Authorities (Emaar, DM, DDA, etc.)',
            subject: 'Consultant appointment letter.',
            body: `M/s [Authority Name: Emaar/DM/DDA/Nakheel]
Planning Department
Dubai, U.A.E

Attention : Head of the Planning Department

Project: [Project Name / Description]
Subject: Consultant appointment letter.
Plot number: [Plot Number], DUBAI- UAE

Dear Sir,

With reference to the above mentioned project we would like to bring to your kind attention that we have appointed Urban Axis Architectural and Consulting Engineers as the main consultant to do the designs / drawings submissions to Authorities and obtain all essential NOC to satisfy the concerned regulations.

Henceforth, Urban Axis will be coordinating with yourself for drawings submissions/approvals etc.

Yours faithfully,

[Client Name]`
        },
        'scope-of-work': {
            id: 'scope-of-work',
            category: 'PROJECT',
            name: 'Scope of Works',
            description: 'Scope of work for existing and proposed projects',
            subject: 'Scope of works for existing and proposed.',
            body: `M/s [Authority Name: Emaar/DM/DDA/Nakheel]
Planning Department
Dubai, U.A.E

Attention : Head of the Planning Department

Project: [Project Name / Description]
Subject: Scope of works for existing and proposed.

Dear Sir,

With reference to the above mentioned project we would like to submit our scope of work for existing and proposed.

Proposed scope of works for [Extension of Villa/Project Type]:
- [Scope Item 1: e.g. Painting]
- [Scope Item 2: e.g. Tiling Removal]
- [Scope Item 3: e.g. Tiling Refixing]
- [Scope Item 4: e.g. Landscaping]

This is for your information and records.

Yours faithfully,

For IMMERSIVE ENGINEERING CONSULTANTS L.L.C`
        },
        'payslip': {
            id: 'payslip',
            category: 'HR',
            name: 'Monthly Payslip',
            description: 'Standard monthly payslip for employees',
            subject: 'Payslip for [Month Year]',
            body: `PAYSLIP FOR THE MONTH OF [MONTH YEAR]

Employee Name : [Name]
Designation   : [Role]
Employee ID   : UA-[ID]
Join Date     : [Join Date]

Earnings:
Basic Salary  : [Amount]
Allowances    : [Amount]
Total Earnings: [Amount]

Deductions:
Staff Loan      : [Amount]
Other Deductions: [Amount]
Total Deductions: [Amount]

Net Salary Payable: [Amount]

This is a computer-generated document and does not require a signature.`
        }
    }
};
