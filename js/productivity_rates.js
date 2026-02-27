//--- START OF FILE js/productivity_rates.js ---

/**
 * @file productivity_rates.js
 * Contains a structured dataset of construction task productivity rates.
 * This data is derived from standard "Rule of Thumb" metrics.
 *
 * Structure of each rate object:
 * - id: A unique identifier for the task.
 * - description: The name of the task.
 * - rate: The average productivity rate (e.g., m²/day).
 * - unit: The unit of measurement for the rate.
 * - quantitySource: A key that maps to a property in the project object (e.g., 'builtUpArea')
 *                   to determine the total quantity of work. Can also be a formula key.
 * - sequence: An order number to establish a simple linear dependency chain.
 * - remarks: (Optional) Any notes about the task.
 */
const PRODUCTIVITY_RATES = {
    SITE_PREP: [
        { id: 'SITE_CLEAR', description: 'Site Clearance', rate: 500, unit: 'm²/day', quantitySource: 'plotArea', sequence: 10, remarks: 'Assumes general clearance of a plot.' },
        { id: 'BULK_EXCAV', description: 'Bulk Excavation', rate: 50, unit: 'm³/day', quantitySource: 'excavationVolume', sequence: 20 },
    ],
    FOUNDATIONS: [
        { id: 'FORMWORK', description: 'Formwork Fixing', rate: 12, unit: 'm²/day', quantitySource: 'formworkArea', sequence: 30 },
        { id: 'REBAR', description: 'Reinforcement Fixing', rate: 0.7, unit: 'Tonnes/day', quantitySource: 'rebarWeight', sequence: 40 },
        { id: 'CONCRETE_POUR_F', description: 'Concrete Placement - Foundations', rate: 16, unit: 'm³/day', quantitySource: 'foundationVolume', sequence: 50 },
    ],
    STRUCTURE: [
        { id: 'BLOCKWORK', description: 'Blockwork Laying (Superstructure)', rate: 10, unit: 'm²/day', quantitySource: 'wallArea', sequence: 60, remarks: 'Average of 7-12 from data.' },
        { id: 'CONCRETE_POUR_S', description: 'Concrete Placement - Slabs', rate: 16, unit: 'm³/day', quantitySource: 'slabVolume', sequence: 70 },
    ],
    FINISHES: [
        { id: 'PLASTER', description: 'Plastering and Rendering', rate: 12, unit: 'm²/day', quantitySource: 'wallArea', sequence: 80 },
        { id: 'FLOOR_SCREED', description: 'Floor Screeding', rate: 60, unit: 'm²/day', quantitySource: 'builtUpArea', sequence: 90 },
        { id: 'PAINTING', description: 'Internal Walls - 2 coats emulsion', rate: 8.0, unit: 'm²/hr', quantitySource: 'wallArea', sequence: 100, remarks: 'Rate converted to m²/day assuming 8hr day.'},
        { id: 'TILING', description: 'Ceramic Wall Tiling', rate: 1.5, unit: 'm²/hr', quantitySource: 'tilingArea', sequence: 110, remarks: 'Rate converted to m²/day assuming 8hr day.' },
    ],
    MEP: [
        { id: 'PLUMBING_FF', description: 'Plumbing First Fix', rate: 10, unit: 'days', quantitySource: 'fixedDuration', sequence: 65, remarks: 'Fixed duration, not unit-based.' },
        { id: 'ELECTRICAL_FF', description: 'Electrical First Fix', rate: 12, unit: 'days', quantitySource: 'fixedDuration', sequence: 66, remarks: 'Fixed duration, not unit-based.' },
        { id: 'PLUMBING_SF', description: 'Plumbing Second Fix', rate: 8, unit: 'days', quantitySource: 'fixedDuration', sequence: 120, remarks: 'Fixed duration, not unit-based.' },
        { id: 'ELECTRICAL_SF', description: 'Electrical Second Fix', rate: 8, unit: 'days', quantitySource: 'fixedDuration', sequence: 121, remarks: 'Fixed duration, not unit-based.' },
    ]
};