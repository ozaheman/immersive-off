// js/quotes.js

/**
 * COMPREHENSIVE CONSTRUCTION MESSAGES SYSTEM
 * Includes: Greetings, Famous Architect Quotes, "Did You Know?" Facts,
 * Money Magnets, and Dubai Construction Information
 */

// ============================================================================
// SECTION 1: DAILY GREETINGS BY PROFESSION
// ============================================================================

const professionalGreetings = {
    // CLIENTS
    client: [
        "Good morning! Your vision is our mission - let's build something extraordinary today.",
        "Hello valued client! Your project's success is our shared victory.",
        "Good day! We're committed to transparency, quality, and exceeding your expectations.",
        "Welcome! Your satisfaction is the blueprint for our daily operations.",
        "Greetings! Together we're creating spaces that will inspire for generations.",
        "Hello there! Communication is our foundation - we're always available for you.",
        "Good morning! Each milestone brings us closer to realizing your dream.",
        "Welcome back! We're excited to share today's progress with you.",
        "Greetings! Investing in quality today saves tomorrow's maintenance costs.",
        "Good day! Your trust in us is the cornerstone of this project's success."
    ],

    // MEP ENGINEERS
    mepEngineer: [
        "Good morning, systems expert! Making buildings breathe, move, and function.",
        "Hello MEP maestro! Your coordination prevents tomorrow's headaches.",
        "Good day! HVAC, plumbing, electrical - you're the building's life support.",
        "Morning! Calculating loads with precision, ensuring efficiency with wisdom.",
        "Greetings! Your designs make buildings smart, sustainable, and functional.",
        "Hello engineer! Today's challenge: Energy efficiency meets comfort optimization.",
        "Good morning! Where would we be without your electrical genius? In the dark!",
        "Welcome! Your BIM coordination saves thousands in field clashes.",
        "Greetings! Making complex systems work in harmony - that's your superpower.",
        "Good day! Your work flows behind every wall, under every floor - essential!"
    ],

    // SITE ENGINEERS
    siteEngineer: [
        "Good morning, field commander! Turning plans into reality, safely and precisely.",
        "Hello! Boots on the ground, eyes on quality, heart in safety.",
        "Good day! Your watchful eye prevents costly mistakes and ensures quality.",
        "Morning! The crucial link between office plans and field execution.",
        "Greetings! Safety first, quality always - your daily commitment.",
        "Hello engineer! Today: Build it right, build it safe, build it strong.",
        "Good morning! Your problem-solving keeps the project moving forward.",
        "Welcome! Every inspection, every measurement, every check matters.",
        "Greetings! You're building more than structures - you're building legacies.",
        "Good day! Field excellence starts with your leadership and attention."
    ],

    // ARCHITECTS
    architect: [
        "Good morning, visionary! Your designs shape human experiences.",
        "Hello! Balancing aesthetics, function, and sustainability - your daily art.",
        "Good day! From concept sketches to built reality - your creativity flows.",
        "Morning! Where form meets function, you create poetry in space.",
        "Greetings! Your blueprints are dreams translated into buildable reality.",
        "Hello architect! Today: Design solutions that will stand the test of time.",
        "Good morning! Every line you draw has purpose, poetry, and possibility.",
        "Welcome! Your vision guides every tradesperson on site.",
        "Greetings! Sustainable, beautiful, functional - the architect's holy trinity.",
        "Good day! Creating spaces that tell stories and elevate human experience."
    ],

    // DRAFTSMEN
    draftsman: [
        "Good morning, precision artist! Your accuracy builds our reality.",
        "Hello! From rough sketches to detailed drawings - your clarity is key.",
        "Good day! Every millimeter matters in your capable, detailed hands.",
        "Morning! The unsung hero translating vision into executable instructions.",
        "Greetings! Your drawings are the construction team's daily guide.",
        "Hello draftsman! Today: Detail with precision, draw with purpose.",
        "Good morning! Your attention to detail prevents field confusion and errors.",
        "Welcome! Clear drawings = smooth construction = successful projects.",
        "Greetings! Making complex designs constructible - that's your gift.",
        "Good day! Every successful build starts with your accurate documentation."
    ],

    // ADMINISTRATORS
    admin: [
        "Good morning, organizational master! You keep the project machine humming.",
        "Hello! The glue holding teams, schedules, and documents together.",
        "Good day! From paperwork wizardry to people coordination - you do it all.",
        "Morning! Your efficiency makes everyone else's excellence possible.",
        "Greetings! Master of schedules, budgets, communications, and solutions.",
        "Hello admin! Today: Organize, coordinate, facilitate, succeed!",
        "Good morning! The backbone supporting every project's success.",
        "Welcome! Keeping chaos at bay with systems, smiles, and solutions.",
        "Greetings! Your multitasking skills keep multiple projects on track.",
        "Good day! Every document managed, every call handled - project superhero."
    ],

    // CONTRACTORS
    contractor: [
        "Good morning, builder! Your leadership turns plans into completed projects.",
        "Hello! Orchestrating trades, managing timelines, delivering quality.",
        "Good day! From groundbreaking to ribbon cutting - you make it happen.",
        "Morning! Balancing budgets, schedules, safety, and quality daily.",
        "Greetings! The captain steering the construction ship to successful shores.",
        "Hello contractor! Today: Build with integrity, lead with vision, deliver with pride.",
        "Good morning! Your problem-solving keeps projects moving and profitable.",
        "Welcome! Managing resources efficiently for maximum productivity.",
        "Greetings! Safety, quality, schedule, budget - your daily balancing act.",
        "Good day! Your reputation is built one successful, satisfied client at a time."
    ],

    // ALL TEAMS
    allTeams: [
        "Good morning, team! Together we transform visions into realities.",
        "Hello everyone! Communication × Collaboration = Construction Success.",
        "Good day team! Safety first, quality always, teamwork forever.",
        "Morning all! Each role matters, each contribution builds excellence.",
        "Greetings team! One project, one team, one shared goal of excellence.",
        "Hello team! Today: Work safe, build strong, support each other.",
        "Good morning team! Our collective expertise creates extraordinary results.",
        "Welcome everyone! Different skills, shared purpose, united success.",
        "Greetings team! Problems become solutions when we collaborate.",
        "Good day team! Celebrate small wins on the journey to big achievements."
    ]
};

// ============================================================================
// SECTION 2: FAMOUS ARCHITECT QUOTES
// ============================================================================

const architectQuotes = [
    // Frank Lloyd Wright
    {
        quote: "The mother art is architecture. Without an architecture of our own we have no soul of our own civilization.",
        architect: "Frank Lloyd Wright",
        category: "Philosophy"
    },
    {
        quote: "Form follows function - that has been misunderstood. Form and function should be one, joined in a spiritual union.",
        architect: "Frank Lloyd Wright",
        category: "Design"
    },
    {
        quote: "Study nature, love nature, stay close to nature. It will never fail you.",
        architect: "Frank Lloyd Wright",
        category: "Nature"
    },

    // Zaha Hadid
    {
        quote: "There are 360 degrees, so why stick to one?",
        architect: "Zaha Hadid",
        category: "Innovation"
    },
    {
        quote: "I don't think that architecture is only about shelter, is only about a very simple enclosure. It should be able to excite you, to calm you, to make you think.",
        architect: "Zaha Hadid",
        category: "Experience"
    },

    // Mies van der Rohe
    {
        quote: "Less is more.",
        architect: "Ludwig Mies van der Rohe",
        category: "Minimalism"
    },
    {
        quote: "God is in the details.",
        architect: "Ludwig Mies van der Rohe",
        category: "Detail"
    },

    // Le Corbusier
    {
        quote: "A house is a machine for living in.",
        architect: "Le Corbusier",
        category: "Function"
    },
    {
        quote: "Space and light and order. Those are the things that men need just as much as they need bread or a place to sleep.",
        architect: "Le Corbusier",
        category: "Essentials"
    },

    // Norman Foster
    {
        quote: "As an architect, you design for the present, with an awareness of the past, for a future which is essentially unknown.",
        architect: "Norman Foster",
        category: "Time"
    },

    // Santiago Calatrava
    {
        quote: "Architecture is the art of reconciliation between ourselves and the world, and this mediation takes place through the senses.",
        architect: "Santiago Calatrava",
        category: "Sensory"
    },

    // Renzo Piano
    {
        quote: "Architecture is a service. As an architect, you serve the people, the city, the community.",
        architect: "Renzo Piano",
        category: "Service"
    },

    // Tadao Ando
    {
        quote: "I believe that the way people live can be directed a little by architecture.",
        architect: "Tadao Ando",
        category: "Influence"
    },

    // Rem Koolhaas
    {
        quote: "Architecture is a dangerous mix of power and impotence.",
        architect: "Rem Koolhaas",
        category: "Power"
    },

    // Louis Kahn
    {
        quote: "A room is not a room without natural light.",
        architect: "Louis Kahn",
        category: "Light"
    },
    {
        quote: "Even a brick wants to be something.",
        architect: "Louis Kahn",
        category: "Material"
    },

    // Oscar Niemeyer
    {
        quote: "Architecture is invention. I look for surprises in a building. When you look at it, it must be different.",
        architect: "Oscar Niemeyer",
        category: "Surprise"
    },

    // Bjarke Ingels
    {
        quote: "Architecture is the art and science of making sure that our cities and buildings actually fit with the way we want to live our lives.",
        architect: "Bjarke Ingels",
        category: "Life"
    },

    // Jean Nouvel
    {
        quote: "Each new situation requires a new architecture.",
        architect: "Jean Nouvel",
        category: "Context"
    },

    // Antoni Gaudí
    {
        quote: "Anything created by human beings is already in the great book of nature.",
        architect: "Antoni Gaudí",
        category: "Nature"
    },

    // Peter Zumthor
    {
        quote: "Architecture is not about form, but about many other things. It's about emotion, atmosphere, and the essence of a place.",
        architect: "Peter Zumthor",
        category: "Essence"
    },

    // Daniel Libeskind
    {
        quote: "Architecture is the only art form that you can actually live inside. It's the art of hope.",
        architect: "Daniel Libeskind",
        category: "Hope"
    },

    // Shigeru Ban
    {
        quote: "I'm not afraid of using any material. The important thing is the idea, not the material itself.",
        architect: "Shigeru Ban",
        category: "Materials"
    },

    // Balkrishna Doshi
    {
        quote: "Design is nothing but a humble understanding of materials, a natural instinct for solutions, and respect for nature.",
        architect: "Balkrishna Doshi",
        category: "Humility"
    },

    // IM Pei
    {
        quote: "Architecture is the very mirror of life. You only have to cast your eyes on buildings to feel the presence of the past, the spirit of a place.",
        architect: "I. M. Pei",
        category: "Reflection"
    },

    // Dubai-based Architects
    {
        quote: "In Dubai, we don't just build structures; we build dreams that touch the clouds.",
        architect: "Local Dubai Architect",
        category: "Dubai"
    },
    {
        quote: "The desert teaches us that limitations are only in the mind. In Dubai, we create oases of possibility.",
        architect: "UAE Architectural Visionary",
        category: "Desert"
    }
];

// ============================================================================
// SECTION 3: "DID YOU KNOW?" FACTS BY PROFESSION
// ============================================================================

const didYouKnowFacts = {
    client: [
        "Did you know? Projects with weekly client updates are 40% more likely to finish on budget and timeline.",
        "Did you know? Clear scope definition at project start saves an average of 15-20% in change orders.",
        "Did you know? Value engineering decisions made during design phase can reduce costs by 10-30% without sacrificing quality.",
        "Did you know? Regular site visits increase client satisfaction by 60% and reduce misunderstandings.",
        "Did you know? Projects with engaged clients have 50% fewer disputes and legal issues.",
        "Did you know? Digital project management tools allow clients real-time access to progress, documents, and budgets.",
        "Did you know? Early selection of finishes and fixtures can prevent 3-4 weeks of project delays.",
        "Did you know? Sustainable buildings command 7-10% higher rental rates and 5-10% higher property values.",
        "Did you know? Proper maintenance planning during design can reduce lifetime building costs by 25%.",
        "Did you know? Projects with clear milestone sign-offs have 90% fewer payment disputes."
    ],

    mepEngineer: [
        "Did you know? Proper MEP coordination using BIM reduces construction clashes by 90% and saves 15% project time.",
        "Did you know? Smart building systems can reduce energy consumption by 30-50% and increase property value by 25%.",
        "Did you know? LED lighting with smart controls can reduce energy consumption by 75% compared to traditional lighting.",
        "Did you know? Greywater recycling systems can reduce building water consumption by 30-50%.",
        "Did you know? District cooling in Dubai is 40% more energy efficient than individual building cooling systems.",
        "Did you know? Proper HVAC design considering Dubai's climate can reduce cooling costs by 25-35%.",
        "Did you know? Fire protection systems designed with BIM have 95% fewer installation errors.",
        "Did you know? Electrical load calculations done accurately prevent 80% of power-related building failures.",
        "Did you know? Solar-ready MEP design increases Dubai property values by 10-15%.",
        "Did you know? Proper plumbing design prevents 95% of water damage and mold issues in buildings."
    ],

    siteEngineer: [
        "Did you know? Daily site inspections reduce construction defects by 70% and rework costs by 50%.",
        "Did you know? Proper concrete testing during pours prevents 95% of structural issues and saves millions in repairs.",
        "Did you know? Digital daily reports using tablets save 2 hours daily in paperwork and provide real-time progress tracking.",
        "Did you know? GPS surveying reduces measurement errors by 99% compared to traditional methods.",
        "Did you know? Safety programs with daily toolbox talks reduce accidents by 85% and insurance premiums by 40%.",
        "Did you know? Material testing and verification prevent 90% of quality issues and supplier disputes.",
        "Did you know? Proper shoring and excavation design prevents 100% of excavation-related accidents.",
        "Did you know? Photographic documentation prevents 80% of disputes and provides legal protection.",
        "Did you know? Just-in-time material delivery reduces storage costs by 60% and material damage by 75%.",
        "Did you know? Site engineers who communicate daily with all trades reduce project delays by 40%."
    ],

    architect: [
        "Did you know? Early architect-contractor collaboration reduces change orders by 60% and saves 10-15% project cost.",
        "Did you know? Biophilic design (integrating nature) increases office productivity by 15% and retail sales by 20%.",
        "Did you know? Proper building orientation in Dubai can reduce cooling costs by 25% through passive design.",
        "Did you know? BIM adoption increases architectural productivity by 30% and reduces coordination errors by 70%.",
        "Did you know? Natural lighting design reduces energy consumption by 40% and improves occupant wellbeing by 60%.",
        "Did you know? Accessible design increases property value by 30% and expands potential tenant/owner base.",
        "Did you know? Green roofs reduce building cooling loads by 25% and manage 70% of stormwater runoff.",
        "Did you know? Passive design strategies (shading, insulation, ventilation) reduce HVAC loads by up to 80%.",
        "Did you know? Architects using virtual reality for client presentations increase client satisfaction by 50%.",
        "Did you know? Historical preservation projects increase surrounding property values by 20-35%."
    ],

    draftsman: [
        "Did you know? Accurate shop drawings reduce field installation errors by 85% and rework costs by 60%.",
        "Did you know? Standardized drawing templates increase drafting productivity by 40% and consistency by 90%.",
        "Did you know? 3D modeling reduces coordination issues by 70% and construction conflicts by 80%.",
        "Did you know? Proper layer management in CAD saves 2-3 hours per drawing during revisions.",
        "Did you know? Detail libraries and blocks speed up drawing production by 50% and ensure consistency.",
        "Did you know? Digital takeoff from drawings reduces material waste by 25% and purchasing errors by 40%.",
        "Did you know? Clear annotation and notes prevent 90% of RFIs (Requests for Information) from contractors.",
        "Did you know? Automated dimensioning reduces measurement errors by 95% and saves 30% drawing time.",
        "Did you know? Drawing revision control systems prevent 100% of build errors from outdated documents.",
        "Did you know? Draftsmen collaborating with field teams reduce construction questions by 70%."
    ],

    admin: [
        "Did you know? Organized document management systems save 15-20 hours weekly in search and retrieval time.",
        "Did you know? Digital workflows reduce document processing time by 80% and errors by 70%.",
        "Did you know? Clear meeting agendas increase meeting productivity by 40% and reduce meeting time by 30%.",
        "Did you know? Automated reminders reduce missed deadlines by 95% and improve schedule adherence.",
        "Did you know? Standardized templates reduce administrative errors by 70% and training time by 50%.",
        "Did you know? Cloud-based document systems allow 24/7 access, reducing project delays by 25%.",
        "Did you know? Proper file naming conventions save 30 minutes daily per team member in document retrieval.",
        "Did you know? Digital signatures save 3-5 days per approval cycle and reduce paper costs by 90%.",
        "Did you know? Project management software reduces meeting time by 50% through real-time updates.",
        "Did you know? Centralized communication systems reduce email overload by 60% and improve response times."
    ],

    contractor: [
        "Did you know? Early contractor involvement in design reduces project costs by 10-15% through constructability input.",
        "Did you know? Lean construction methods reduce material waste by 50% and improve productivity by 25%.",
        "Did you know? Daily 15-minute team huddles improve productivity by 25% and safety compliance by 40%.",
        "Did you know? Proper schedule float management prevents 80% of delay claims and client disputes.",
        "Did you know? Subcontractor pre-qualification reduces quality issues by 70% and safety incidents by 60%.",
        "Did you know? Digital daily reports and photos provide legal protection in 95% of dispute cases.",
        "Did you know? Comprehensive safety programs reduce insurance premiums by 40% and accident costs by 85%.",
        "Did you know? Just-in-time delivery reduces material storage costs by 60% and theft/loss by 80%.",
        "Did you know? Quality control programs reduce warranty claims by 90% and increase client referrals.",
        "Did you know? Contractor-led value engineering saves clients 15-25% without compromising quality."
    ],

    allTeams: [
        "Did you know? Construction teams communicating daily complete projects 20% faster with 15% lower costs.",
        "Did you know? Cross-functional collaboration reduces errors by 75% and improves innovation by 50%.",
        "Did you know? Regular team-building increases productivity by 30% and reduces turnover by 40%.",
        "Did you know? Shared digital platforms reduce information gaps by 90% and miscommunication by 70%.",
        "Did you know? Teams celebrating milestones have 40% higher morale and 25% better quality outcomes.",
        "Did you know? Clear role definitions prevent 85% of conflicts and improve accountability by 60%.",
        "Did you know? Continuous learning teams adapt to changes 50% faster and implement innovations 40% better.",
        "Did you know? Diverse teams (experience, background, skills) solve problems 60% more effectively.",
        "Did you know? Psychological safety in teams increases innovation by 45% and error reporting by 70%.",
        "Did you know? Regular feedback loops improve team performance by 35% and client satisfaction by 50%."
    ]
};

// ============================================================================
// SECTION 4: MONEY MAGNETS - FINANCIAL SUCCESS TIPS
// ============================================================================

const moneyMagnets = {
    constructionFinance: [
        "💰 MONEY MAGNET: Early value engineering saves 20% costs without quality compromise. Review designs before construction starts.",
        "💰 MONEY MAGNET: Digital quantity takeoff reduces material waste by 15-25%. Measure twice, purchase once.",
        "💰 MONEY MAGNET: Just-in-time delivery saves 40% storage costs. Coordinate suppliers with construction schedule.",
        "💰 MONEY MAGNET: BIM clash detection prevents 3-5% project cost in rework. Invest in coordination.",
        "💰 MONEY MAGNET: Energy-efficient designs save 30% operational costs. Green buildings attract premium tenants.",
        "💰 MONEY MAGNET: Preventive maintenance plans reduce lifetime building costs by 25%. Plan during design phase.",
        "💰 MONEY MAGNET: Digital project management reduces administrative costs by 20%. Automate where possible.",
        "💰 MONEY MAGNET: Bulk material purchasing saves 10-15%. Consolidate orders across projects.",
        "💰 MONEY MAGNET: Proper insurance coverage prevents catastrophic losses. Review policies quarterly.",
        "💰 MONEY MAGNET: Retainage management improves cash flow. Clear milestone definitions ensure timely payments."
    ],

    dubaiSpecific: [
        "💰 DUBAI MAGNET: Freezone company setup offers 100% foreign ownership, 0% corporate/personal tax for 50 years.",
        "💰 DUBAI MAGNET: Renewable energy projects qualify for 40% government subsidies. Solar pays back in 3-5 years.",
        "💰 DUBAI MAGNET: Sustainable buildings (LEED/Estidama) get 10% higher rental yields and faster occupancy.",
        "💰 DUBAI MAGNET: Dubai Industrial Strategy 2030 offers incentives for manufacturing and logistics facilities.",
        "💰 DUBAI MAGNET: Smart building technologies increase property value by 15-25% in Dubai's premium market.",
        "💰 DUBAI MAGNET: Tourism projects qualify for 5-year tax holidays and reduced licensing fees.",
        "💰 DUBAI MAGNET: Warehouse and logistics facilities in Dubai South/DWC offer 30% lower operating costs.",
        "💰 DUBAI MAGNET: Affordable housing projects receive land allocation at 50% discounted rates.",
        "💰 DUBAI MAGNET: Technology/innovation projects in Dubai Internet/Science Park get 100% repatriation of profits.",
        "💰 DUBAI MAGNET: Healthcare/education projects receive 20-year land leases at nominal rates."
    ],

    investmentTips: [
        "💰 INVESTMENT MAGNET: Commercial properties in Dubai Marina/DIFC appreciate 7-10% annually.",
        "💰 INVESTMENT MAGNET: Residential properties near metro stations command 15-20% rental premium.",
        "💰 INVESTMENT MAGNET: Warehouse/logistics near Dubai airports yield 8-12% ROI with 95% occupancy.",
        "💰 INVESTMENT MAGNET: Student housing near universities achieves 10-15% yields with guaranteed demand.",
        "💰 INVESTMENT MAGNET: Co-working spaces generate 30-40% higher returns per square foot vs traditional offices.",
        "💰 INVESTMENT MAGNET: Medical facilities in healthcare clusters appreciate 15% annually with 90% occupancy.",
        "💰 INVESTMENT MAGNET: Sustainable buildings achieve 5-10% higher resale value and faster transactions.",
        "💰 INVESTMENT MAGNET: Mixed-use developments generate 25% higher returns through diversified income streams.",
        "💰 INVESTMENT MAGNET: Short-term rental properties yield 2-3x traditional rental income in tourist areas.",
        "💰 INVESTMENT MAGNET: Land banking in growth corridors (Dubai South, Meydan) offers 20-30% annual appreciation."
    ]
};

// ============================================================================
// SECTION 5: DUBAI CONSTRUCTION INFORMATION
// ============================================================================

const dubaiInfo = {
    regulations: [
        "🏗️ DUBAI REGULATION: All buildings over 20 floors require emergency helicopter landing pad approval from Dubai Civil Aviation.",
        "🏗️ DUBAI REGULATION: Construction permits through Dubai Municipality's 'Building Permits System' now take 5-10 working days with complete documents.",
        "🏗️ DUBAI REGULATION: Green Building Regulations (Al Sa'fat) mandatory for all new buildings - Silver rating minimum required.",
        "🏗️ DUBAI REGULATION: All construction sites must have dedicated sustainability officer monitoring water/energy/material waste.",
        "🏗️ DUBAI REGULATION: 30% of construction workforce must be Emirati nationals for government projects (Emiratization policy).",
        "🏗️ DUBAI REGULATION: Smart building systems mandatory for buildings over 50,000 sq ft - IoT integration required.",
        "🏗️ DUBAI REGULATION: Construction waste recycling mandatory - minimum 75% of waste must be recycled or reused.",
        "🏗️ DUBAI REGULATION: All facade designs require wind tunnel testing certification for buildings over 150 meters.",
        "🏗️ DUBAI REGULATION: Fire safety systems must comply with UAE Fire and Life Safety Code - annual certification required.",
        "🏗️ DUBAI REGULATION: District cooling connection mandatory for developments over 500,000 sq ft in designated areas."
    ],

    marketInsights: [
        "📊 DUBAI MARKET: Construction sector growth projected at 4.5% annually through 2025 - $25 billion project pipeline.",
        "📊 DUBAI MARKET: Sustainable construction market growing at 15% annually - LEED/Estidama certified projects increasing.",
        "📊 DUBAI MARKET: Infrastructure spending for Expo 2020 legacy projects continues at $8 billion annually.",
        "📊 DUBAI MARKET: Dubai 2040 Urban Master Plan driving $30 billion in new development across 5 urban centers.",
        "📊 DUBAI MARKET: Affordable housing demand growing 20% annually - 50,000 units needed by 2025.",
        "📊 DUBAI MARKET: Logistics/warehouse construction booming - 15 million sq ft new space annually until 2027.",
        "📊 DUBAI MARKET: Tourism projects accelerating - 25 new hotels annually, 40,000 new rooms by 2030.",
        "📊 DUBAI MARKET: Technology integration in construction growing 40% annually - BIM adoption at 85% for major projects.",
        "📊 DUBAI MARKET: Maintenance/refurbishment market worth $3 billion annually - aging building stock requiring upgrades.",
        "📊 DUBAI MARKET: Public-private partnerships (PPP) increasing - $15 billion in infrastructure projects via PPP model."
    ],

    projectsAndInnovations: [
        "🌇 DUBAI PROJECTS: Mohammed Bin Rashid Al Maktoum Solar Park - world's largest single-site solar project at 5GW capacity.",
        "🌇 DUBAI PROJECTS: Dubai Creek Tower - set to be world's tallest tower at 1300+ meters, completion 2025.",
        "🌇 DUBAI PROJECTS: Palm Jebel Ali - twice the size of Palm Jumeirah, adding 110km of coastline.",
        "🌇 DUBAI PROJECTS: Dubai Urban Tech District - dedicated zone for construction technology startups.",
        "🌇 DUBAI PROJECTS: The Dubai Mall expansion - adding 240 new stores and 120 food/beverage outlets.",
        "🌇 DUBAI PROJECTS: Al Maktoum International Airport expansion - capacity for 260 million passengers annually.",
        "🌇 DUBAI PROJECTS: Dubai Metro Blue Line - 30km extension connecting 14 new areas, completion 2026.",
        "🌇 DUBAI PROJECTS: Dubai Rain Project - climate modification technology to increase rainfall by 30%.",
        "🌇 DUBAI PROJECTS: 3D printed buildings initiative - target of 25% of new buildings using 3D printing by 2030.",
        "🌇 DUBAI PROJECTS: Hyperloop connection Abu Dhabi-Dubai - reducing travel time to 12 minutes."
    ],

    sustainabilityInitiatives: [
        "🌿 DUBAI GREEN: Dubai Clean Energy Strategy 2050 - 75% of energy from clean sources by 2050.",
        "🌿 DUBAI GREEN: Dubai Integrated Energy Strategy 2030 - 30% reduction in energy demand through efficiency.",
        "🌿 DUBAI GREEN: Green Building Code - mandatory for all new buildings, voluntary retrofits for existing.",
        "🌿 DUBAI GREEN: District cooling mandatory in new developments - 50% more efficient than individual systems.",
        "🌿 DUBAI GREEN: Solar rooftop mandate - all buildings must have solar readiness, government buildings require installation.",
        "🌿 DUBAI GREEN: Water conservation regulations - mandatory greywater recycling for buildings over 20,000 sq ft.",
        "🌿 DUBAI GREEN: Electric vehicle infrastructure - 10% of parking must have EV charging, increasing to 30% by 2030.",
        "🌿 DUBAI GREEN: Construction waste management - 75% recycling target, fees for landfill disposal.",
        "🌿 DUBAI GREEN: Urban farming integration - 20% of new developments must include food production areas.",
        "🌿 DUBAI GREEN: Carbon neutrality commitment - Dubai to be carbon neutral by 2050."
    ]
};

// ============================================================================
// SECTION 6: MAIN ENGINE - COMPLETE MESSAGE GENERATOR
// ============================================================================

const ConstructionMessageGenerator = {
    
    // Current configuration
    currentProfession: 'allTeams',
    
    /**
     * Set the current profession for personalized messages
     * @param {string} profession - Profession key
     */
    setProfession: function(profession) {
        const validProfessions = ['client', 'mepEngineer', 'siteEngineer', 'architect', 
                                 'draftsman', 'admin', 'contractor', 'allTeams'];
        if (validProfessions.includes(profession)) {
            this.currentProfession = profession;
        } else {
            this.currentProfession = 'allTeams';
        }
    },
    
    /**
     * Get a random greeting for current profession
     * @returns {string} Personalized greeting
     */
    getGreeting: function() {
        const greetings = professionalGreetings[this.currentProfession] || professionalGreetings.allTeams;
        return greetings[Math.floor(Math.random() * greetings.length)];
    },
    
    /**
     * Get a random architect quote
     * @param {string} category - Optional category filter
     * @returns {object} Quote with details
     */
    getArchitectQuote: function(category = null) {
        let filteredQuotes = architectQuotes;
        
        if (category) {
            filteredQuotes = architectQuotes.filter(q => 
                q.category.toLowerCase() === category.toLowerCase()
            );
            if (filteredQuotes.length === 0) {
                filteredQuotes = architectQuotes;
            }
        }
        
        const quote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
        return {
            text: `"${quote.quote}"`,
            author: `— ${quote.architect}`,
            category: quote.category,
            full: `"${quote.quote}" — ${quote.architect} (${quote.category})`
        };
    },
    
    /**
     * Get a random "Did You Know?" fact for current profession
     * @returns {string} Interesting fact
     */
    getDidYouKnow: function() {
        const facts = didYouKnowFacts[this.currentProfession] || didYouKnowFacts.allTeams;
        return facts[Math.floor(Math.random() * facts.length)];
    },
    
    /**
     * Get money magnet tip
     * @param {string} category - finance, dubai, or investment
     * @returns {string} Financial tip
     */
    getMoneyMagnet: function(category = 'random') {
        let magnets = [];
        
        if (category === 'finance') {
            magnets = moneyMagnets.constructionFinance;
        } else if (category === 'dubai') {
            magnets = moneyMagnets.dubaiSpecific;
        } else if (category === 'investment') {
            magnets = moneyMagnets.investmentTips;
        } else {
            // Combine all and pick random
            magnets = [
                ...moneyMagnets.constructionFinance,
                ...moneyMagnets.dubaiSpecific,
                ...moneyMagnets.investmentTips
            ];
        }
        
        return magnets[Math.floor(Math.random() * magnets.length)];
    },
    
    /**
     * Get Dubai construction information
     * @param {string} type - regulations, market, projects, or sustainability
     * @returns {string} Dubai-specific information
     */
    getDubaiInfo: function(type = 'random') {
        let info = [];
        
        if (type === 'regulations') {
            info = dubaiInfo.regulations;
        } else if (type === 'market') {
            info = dubaiInfo.marketInsights;
        } else if (type === 'projects') {
            info = dubaiInfo.projectsAndInnovations;
        } else if (type === 'sustainability') {
            info = dubaiInfo.sustainabilityInitiatives;
        } else {
            // Combine all and pick random
            info = [
                ...dubaiInfo.regulations,
                ...dubaiInfo.marketInsights,
                ...dubaiInfo.projectsAndInnovations,
                ...dubaiInfo.sustainabilityInitiatives
            ];
        }
        
        return info[Math.floor(Math.random() * info.length)];
    },
    
    /**
     * Get complete daily briefing with all three outputs
     * @returns {object} Complete briefing object
     */
    getDailyBriefing: function() {
        const today = new Date();
        
        return {
            date: today.toDateString(),
            day: today.toLocaleDateString('en-US', { weekday: 'long' }),
            profession: this.currentProfession,
            greeting: this.getGreeting(),
            architectQuote: this.getArchitectQuote(),
            didYouKnow: this.getDidYouKnow(),
            moneyMagnet: this.getMoneyMagnet(),
            dubaiInfo: this.getDubaiInfo(),
            timestamp: today.toISOString()
        };
    }
};