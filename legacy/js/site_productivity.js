//--- START OF FILE js/site_productivity.js ---

/**
 * @module SiteProductivity
 * Generates a preliminary construction schedule based on project scope quantities
 * and standard productivity rates from PRODUCTIVITY_RATES data.
 */
const SiteProductivity = (() => {

    /**
     * Calculates estimated quantities for various construction tasks based on project data.
     * These are simplified estimations for demonstration.
     * @param {object} project - The project data object.
     * @returns {object} An object with calculated quantities.
     */
    function calculateQuantities(project) {
        const bua = parseFloat(project.builtUpArea) || 0;
        const plotArea = parseFloat(project.area) || bua; // Use plot area if available, else BUA.

        return {
            plotArea: plotArea,
            builtUpArea: bua,
            // Simple estimations based on Built-Up Area (BUA)
            excavationVolume: bua * 0.5, // Assuming 0.5m average excavation depth
            foundationVolume: bua * 0.2, // Assuming 20% of BUA volume is foundation concrete
            slabVolume: bua * 0.15,      // Assuming 15cm thick slabs
            formworkArea: bua * 3.0,     // Walls + Slabs formwork
            wallArea: bua * 2.5,         // Internal and external wall area
            rebarWeight: (bua * 0.2 + bua * 0.15) * 0.1, // Approx. 100kg/m³ of concrete -> Tonnes
            tilingArea: bua * 0.4,       // Assuming 40% of BUA is tiled (bathrooms, kitchen)
            fixedDuration: 1 // A placeholder for tasks with fixed durations
        };
    }

    /**
     * Generates a list of schedule tasks with calculated durations.
     * @param {object} project - The project data object.
     * @returns {Array} An array of task objects.
     */
    function generateScheduleFromScope(project) {
        if (!project) return [];

        const quantities = calculateQuantities(project);
        let generatedTasks = [];

        // Iterate through all categories and tasks in the productivity data
        for (const category in PRODUCTIVITY_RATES) {
            PRODUCTIVITY_RATES[category].forEach(rateInfo => {
                const quantity = quantities[rateInfo.quantitySource] || 0;
                let rate = rateInfo.rate;
                let duration = 1;

                if (rateInfo.unit.endsWith('/hr')) {
                    rate = rate * 8; // Convert hourly rate to daily rate (assuming 8-hour day)
                }

                if (rateInfo.unit === 'days') {
                    duration = Math.ceil(rate); // For fixed duration tasks
                } else if (quantity > 0 && rate > 0) {
                    duration = Math.ceil(quantity / rate);
                }

                generatedTasks.push({
                    id: rateInfo.id,
                    name: rateInfo.description,
                    duration: duration,
                    dependencies: [],
                    sequence: rateInfo.sequence
                });
            });
        }
        
        // Sort tasks by sequence to create a logical linear schedule
        generatedTasks.sort((a, b) => a.sequence - b.sequence);

        // Calculate start/end dates and set simple finish-to-start dependencies
        let lastEndDate = new Date((project.agreementDate || new Date().toISOString().split('T')[0]) + 'T00:00:00');

        for (let i = 0; i < generatedTasks.length; i++) {
            const task = generatedTasks[i];
            
            const startDate = new Date(lastEndDate);
            startDate.setDate(startDate.getDate() + 1); // Start the day after the previous task ends

            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + task.duration - 1);
            
            task.start = startDate.toISOString().split('T')[0];
            task.end = endDate.toISOString().split('T')[0];

            if (i > 0) {
                task.dependencies.push(generatedTasks[i - 1].id);
            }
            
            lastEndDate = endDate;
            delete task.sequence; // Clean up helper property
        }

        return generatedTasks;
    }

    return { generateScheduleFromScope };

})();