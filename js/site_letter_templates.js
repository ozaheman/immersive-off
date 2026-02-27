// Site Index Letter Templates
// Used in site_index.html (Site Management)

window.SiteLetterTemplates = {
    LIST: {
        'daily-report': {
            id: 'daily-report',
            category: 'Site',
            name: 'Daily Progress Report',
            description: 'Daily site progress report to client/consultant',
            subject: 'Daily Progress Report - [Date]',
            body: `Dear Sir/Madam,

RE: DAILY PROGRESS REPORT - [DATE]

Project: [Project Name]
Report Date: [Date]
Weather: [Weather Condition]

**Work Progress Today:**
1. [Activity 1]
2. [Activity 2]
3. [Activity 3]

**Manpower on Site:**
- Skilled: [Number]
- Unskilled: [Number]
- Total: [Total]

**Materials Delivered:**
- [Material 1]: [Quantity]
- [Material 2]: [Quantity]

**Issues/Concerns:**
[List any issues or concerns]

**Plan for Tomorrow:**
[Tomorrow's planned activities]

Best regards,
Site Engineer`
        },
        'material-request': {
            id: 'material-request',
            category: 'Site',
            name: 'Material Request Letter',
            description: 'Request for material delivery to site',
            subject: 'Material Request - [Material Name]',
            body: `Dear [Supplier Name],

RE: MATERIAL REQUEST

Project: [Project Name]
Site Location: [Location]
Request Date: [Date]

We require the following materials to be delivered to the above site:

**Materials Required:**
1. [Material 1] - Quantity: [Qty] - Specification: [Spec]
2. [Material 2] - Quantity: [Qty] - Specification: [Spec]
3. [Material 3] - Quantity: [Qty] - Specification: [Spec]

**Required Delivery Date:** [Date]

**Delivery Instructions:**
- Contact person: [Name]
- Contact number: [Phone]
- Delivery time: [Time]

Please confirm availability and delivery schedule.

Best regards,
Site Engineer`
        },
        'snag-notification': {
            id: 'snag-notification',
            category: 'Site',
            name: 'Snag Notification',
            description: 'Notification of snags/defects to contractor',
            subject: 'Snag Notification - [Location]',
            body: `Dear [Contractor Name],

RE: SNAG NOTIFICATION

Project: [Project Name]
Location: [Specific Location]
Date: [Date]

During our inspection, the following snags/defects were observed:

**Snag List:**
1. [Snag 1 - Description]
   Location: [Location]
   Severity: [High/Medium/Low]

2. [Snag 2 - Description]
   Location: [Location]
   Severity: [High/Medium/Low]

3. [Snag 3 - Description]
   Location: [Location]
   Severity: [High/Medium/Low]

**Required Action:**
Please rectify the above snags within [Number] days from the date of this letter.

**Re-inspection Date:** [Date]

Photographic evidence is attached for your reference.

Best regards,
Site Engineer`
        },
        'safety-violation': {
            id: 'safety-violation',
            category: 'Site',
            name: 'Safety Violation Notice',
            description: 'Notice for safety violations on site',
            subject: 'Safety Violation Notice',
            body: `Dear [Contractor Name],

RE: SAFETY VIOLATION NOTICE

Project: [Project Name]
Date: [Date]
Violation Reference: [Reference Number]

**Violation Observed:**
[Detailed description of safety violation]

**Location:** [Specific location on site]

**Severity:** ☐ Critical  ☐ Major  ☐ Minor

**Immediate Action Required:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Corrective Measures:**
[Required corrective measures]

**Deadline for Compliance:** [Date]

Failure to comply may result in work stoppage and penalties as per contract terms.

Please acknowledge receipt and confirm corrective actions taken.

Best regards,
Site Safety Officer`
        },
        'work-completion': {
            id: 'work-completion',
            category: 'Site',
            name: 'Work Completion Certificate',
            description: 'Certificate of work completion',
            subject: 'Work Completion Certificate - [Work Description]',
            body: `Dear [Client Name],

RE: WORK COMPLETION CERTIFICATE

Project: [Project Name]
Work Package: [Work Description]
Completion Date: [Date]

This is to certify that the following work has been completed as per approved drawings and specifications:

**Completed Work:**
- [Work Item 1]
- [Work Item 2]
- [Work Item 3]

**Quality Standards:**
All work has been executed in accordance with:
- Approved drawings
- Technical specifications
- Relevant building codes
- Quality standards

**Inspection Details:**
Inspected by: [Inspector Name]
Inspection Date: [Date]
Status: ☐ Approved  ☐ Approved with minor snags

**Attachments:**
- Completion photographs
- Test certificates (if applicable)
- As-built drawings

The work is now ready for the next phase.

Best regards,
Site Engineer`
        },
        'delay-notification': {
            id: 'delay-notification',
            category: 'Site',
            name: 'Delay Notification',
            description: 'Notification of project delays',
            subject: 'Delay Notification - [Reason]',
            body: `Dear [Client Name],

RE: DELAY NOTIFICATION

Project: [Project Name]
Date: [Date]

We regret to inform you of a delay in the project schedule due to the following reason(s):

**Reason for Delay:**
[Detailed explanation of delay cause]

**Impact on Schedule:**
- Original completion date: [Date]
- Revised completion date: [Date]
- Delay duration: [Number] days

**Affected Activities:**
1. [Activity 1]
2. [Activity 2]
3. [Activity 3]

**Mitigation Measures:**
To minimize the impact, we are implementing the following measures:
1. [Measure 1]
2. [Measure 2]
3. [Measure 3]

**Recovery Plan:**
[Description of recovery plan]

We apologize for any inconvenience caused and assure you of our commitment to minimize delays.

Best regards,
Project Manager`
        },
        'inspection-request': {
            id: 'inspection-request',
            category: 'Site',
            name: 'Inspection Request',
            description: 'Request for site inspection',
            subject: 'Inspection Request - [Work Type]',
            body: `Dear [Inspector Name],

RE: INSPECTION REQUEST

Project: [Project Name]
Work Type: [Type of Work]
Request Date: [Date]

We request your kind presence for inspection of the following completed work:

**Work Details:**
- Description: [Work description]
- Location: [Specific location]
- Completion Date: [Date]

**Inspection Items:**
1. [Item 1]
2. [Item 2]
3. [Item 3]

**Proposed Inspection Date:** [Date]
**Proposed Time:** [Time]

**Contact Person:**
Name: [Name]
Mobile: [Phone Number]

Please confirm your availability or suggest an alternative date/time.

All relevant documents and test certificates will be available during inspection.

Best regards,
Site Engineer`
        }
    }
};
