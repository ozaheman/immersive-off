//--- START OF FILE bim_designer_module.js ---

export const BimDesignerModule = {
    // This is the default script from the prompt
    DEFAULT_SCRIPT: `const _defaultGenerateStructure = () => {
        buildingElements = {};
        // Full structure generation code from your file should be here.
        // Omitted for brevity, but it's the same as before.
        // --- 1. MOBILIZATION & ENABLING ---// 1. Mobilization Works (Site Fencing)
        const fenceGeo = new THREE.BoxGeometry(0.1, 2, 30);
        addPart(1, fenceGeo, 15, 1, 0, 1, 1, 1, 0, 0, 0, 'sub', 'steel_pbr'); // East
        addPart(1, fenceGeo, -15, 1, 0, 1, 1, 1, 0, 0, 0, 'sub', 'steel_pbr'); // West
        // North/South fences (Rotated 90 deg Y-axis)
        addPart(1, fenceGeo, 0, 1, 15, 1, 1, 1, 0, Math.PI/2, 0, 'sub', 'steel_pbr'); // North
        addPart(1, fenceGeo, 0, 1, -15, 1, 1, 1, 0, Math.PI/2, 0, 'sub', 'steel_pbr'); // South
        
        // 2. Signboard
        addPart(2, new THREE.BoxGeometry(1.5, 3, 0.1), 11, 4, 15, 1, 1, 1, 0, -Math.PI/4, 0, 'sub', 'paint');
        
        // 3. Demolishing (Ground clearing)
        addPart(3, new THREE.PlaneGeometry(28, 28), 0, 0.1, 0, 1, 1, 1, -Math.PI/2, 0, 0, 'sub', 'ground');

        // --- 2. SHORING & EARTHWORKS ---
        // 6. Shoring Works (Piles)
        const pileGeo = new THREE.CylinderGeometry(0.2, 0.2, 6);
        for(let i=-12; i<=12; i+=3) {
            addPart(6, pileGeo, 14, -3, i, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr');
            addPart(6, pileGeo, -14, -3, i, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr');
            addPart(6, pileGeo, i, -3, 14, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr');
            addPart(6, pileGeo, i, -3, -14, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr');
        }
        // 8. Shoring I-Beams
        const beamGeo = new THREE.BoxGeometry(28, 0.3, 0.3);
        addPart(8, beamGeo, 0, -1, 13.8, 1, 1, 1, 0, 0, 0, 'sub', 'steel_pbr');
        addPart(8, beamGeo, 0, -3, 13.8, 1, 1, 1, 0, 0, 0, 'sub', 'steel_pbr');
        
        // 9, 13. Excavation
        addPart(9, new THREE.BoxGeometry(28, 0.1, 28), 0, -4.6, 0, 1, 1, 1, 0, 0, 0, 'sub', 'ground_pbr');
        addPart(13, new THREE.BoxGeometry(18, 0.1, 18), 0, -4.8, 0, 1, 1, 1, 0, 0, 0, 'sub', 'ground_pbr');
        // 14. Road Base
        addPart(14, new THREE.BoxGeometry(18, 0.2, 18), 0, -4.7, 0, 1, 1, 1, 0, 0, 0, 'sub', 'ground_pbr');

        // --- 3. SUBSTRUCTURE ---
        // 19. PCC
        addPart(19, new THREE.BoxGeometry(17, 0.1, 17), 0, -4.6, 0, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr');
        // 48. Waterproofing
        addPart(48, new THREE.BoxGeometry(17, 0.05, 17), 0, -4.55, 0, 1, 1, 1, 0, 0, 0, 'sub', 'steel');
        // 20. Raft
        addPart(20, new THREE.BoxGeometry(16, 0.8, 16), 0, -4.1, 0, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr');
        
        // 21. Basement Cols & Walls
        const colGeo = new THREE.BoxGeometry(0.6, 3.5, 0.6);
        [[-7,-7], [7,-7], [-7,7], [7,7]].forEach(p => {
            addPart(21, colGeo, p[0], -2.0, p[1], 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr');
        });
        // Retaining Walls
        const wallLong = new THREE.BoxGeometry(16, 3.5, 0.3);
        addPart(21, wallLong, 0, -2.0, 7.85, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr'); // Front
        addPart(21, wallLong, 0, -2.0, -7.85, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr'); // Back
        addPart(21, wallLong, 7.85, -2.0, 0, 1, 1, 1, 0, Math.PI/2, 0, 'sub', 'concrete_pbr'); // Right (Rotated)
        addPart(21, wallLong, -7.85, -2.0, 0, 1, 1, 1, 0, Math.PI/2, 0, 'sub', 'concrete_pbr'); // Left (Rotated)
        
        // 49. Waterproofing Vertical
        addPart(49, new THREE.BoxGeometry(16.2, 3.5, 0.05), 0, -2.0, 8.05, 1, 1, 1, 0, 0, 0, 'sub', 'steel_pbr');
        // 17. Backfilling
        addPart(17, new THREE.BoxGeometry(30, 4, 30), 0, -2, 0, 1, 1, 1, 0, 0, 0, 'sub', 'ground_pbr');

        // --- 4. SUPERSTRUCTURE - GF ---
        addPart(26, new THREE.BoxGeometry(16.5, 0.3, 16.5), 0, 0, 0, 1, 1, 1, 0, 0, 0, 'gf', 'concrete_pbr'); // Slab
        [[-7,-7], [7,-7], [-7,7], [7,7]].forEach(p => addPart(27, colGeo, p[0], 1.9, p[1], 1, 1, 1, 0, 0, 0, 'gf', 'concrete_pbr')); // Cols
        
        // 39. GF Blockwork
        const blockWall = new THREE.BoxGeometry(16, 3.5, 0.2);
        addPart(39, blockWall, 0, 1.9, 7.5, 1, 1, 1, 0, 0, 0, 'gf', 'block'); // Front
        addPart(39, blockWall, 0, 1.9, -7.5, 1, 1, 1, 0, 0, 0, 'gf', 'block'); // Back
        addPart(39, blockWall, 7.5, 1.9, 0, 1, 1, 1, 0, Math.PI/2, 0, 'gf', 'block'); // Right
        addPart(39, blockWall, -7.5, 1.9, 0, 1, 1, 1, 0, Math.PI/2, 0, 'gf', 'block'); // Left

        // --- 5. SUPERSTRUCTURE - FF ---
        addPart(28, new THREE.BoxGeometry(17, 0.3, 17), 0, 3.8, 0, 1, 1, 1, 0, 0, 0, '1', 'concrete_pbr'); // Slab
        [[-7,-7], [7,-7], [-7,7], [7,7]].forEach(p => addPart(29, colGeo, p[0], 5.7, p[1], 1, 1, 1, 0, 0, 0, '1', 'concrete_pbr')); // Cols
        // 40. FF Blockwork
        addPart(40, blockWall, 0, 5.7, 7.5, 1, 1, 1, 0, 0, 0, '1', 'block');
        addPart(40, blockWall, 0, 5.7, -7.5, 1, 1, 1, 0, 0, 0, '1', 'block');
        addPart(40, blockWall, 7.5, 5.7, 0, 1, 1, 1, 0, Math.PI/2, 0, '1', 'block');
        addPart(40, blockWall, -7.5, 5.7, 0, 1, 1, 1, 0, Math.PI/2, 0, '1', 'block');

        // --- 6. SUPERSTRUCTURE - ROOF ---
        addPart(30, new THREE.BoxGeometry(17, 0.3, 17), 0, 7.6, 0, 1, 1, 1, 0, 0, 0, 'roof', 'concrete_pbr'); // Slab
        const parapet = new THREE.BoxGeometry(17, 1, 0.2);
        addPart(33, parapet, 0, 8.2, 8.4, 1, 1, 1, 0, 0, 0, 'roof', 'concrete_pbr');
        addPart(33, parapet, 0, 8.2, -8.4, 1, 1, 1, 0, 0, 0, 'roof', 'concrete_pbr');
        addPart(33, parapet, 8.4, 8.2, 0.0, 1, 1, 1, 0, Math.PI/2, 0, 'roof', 'concrete_pbr');
         addPart(33, parapet, -8.4, 8.2, 0.0, 1, 1, 1, 0, Math.PI/2, 0, 'roof', 'concrete_pbr');
        addPart(41, new THREE.BoxGeometry(4, 3, 4), 5, 9.1, 5, 1, 1, 1, 0, 0, 0, 'roof', 'block'); // Service room

        // --- 7. UPPER ROOF ---
        addPart(31, new THREE.BoxGeometry(0.4, 3, 0.4), 5, 9.1, 5, 1, 1, 1, 0, 0, 0, 'upper_roof', 'concrete_pbr');
        addPart(32, new THREE.BoxGeometry(4.5, 0.2, 4.5), 5, 10.7, 5, 1, 1, 1, 0, 0, 0, 'upper_roof', 'concrete_pbr');
        addPart(34, new THREE.BoxGeometry(4.500, 0.800, 0.100), 5, 11.200, 7.200, 1, 1, 1, 0, 0, 0, 'upper_roof', 'concrete_pbr');
    addPart(34, new THREE.BoxGeometry(4.500, 0.800, 0.100), 5, 11.200, 2.750, 1, 1, 1, 0, 0, 0, 'upper_roof', 'concrete_pbr');
    addPart(34, new THREE.BoxGeometry(4.500, 0.800, 0.100), 2.800, 11.200, 5, 1, 1, 1, 0, Math.PI/2, 0, 'upper_roof', 'concrete_pbr');
    addPart(34, new THREE.BoxGeometry(4.500, 0.800, 0.100), 7.2, 11.200, 5, 1, 1, 1, 0, Math.PI/2, 0, 'upper_roof', 'concrete_pbr');

        // --- 8, 9, 10. FINISHES ---
        // Plaster (Inner Skins)
        const plasterGeo = new THREE.BoxGeometry(15.8, 3.4, 0.05);
        addPart(43, plasterGeo, 0, -2.0, 7.7, 1, 1, 1, 0, 0, 0, 'sub', 'plaster');
        addPart(44, plasterGeo, 0, 1.9, 7.3, 1, 1, 1, 0, 0, 0, 'gf', 'plaster');
        addPart(45, plasterGeo, 0, 5.7, 7.3, 1, 1, 1, 0, 0, 0, '1', 'plaster');
        // Tiles
        addPart(64, new THREE.BoxGeometry(15, 0.05, 15), 0, -3.65, 0, 1, 1, 1, 0, 0, 0, 'sub', 'tile_pbr');
        addPart(65, new THREE.BoxGeometry(16, 0.05, 16), 0, 0.2, 0, 1, 1, 1, 0, 0, 0, 'gf', 'tile_pbr');
        addPart(66, new THREE.BoxGeometry(16, 0.05, 16), 0, 4.0, 0, 1, 1, 1, 0, 0, 0, '1', 'tile_pbr');

        // --- 11. EXTERNAL ---
        // 81. External Paint
        addPart(81, new THREE.BoxGeometry(16.4, 7.6, 16.4), 0, 3.8, 0, 1, 1, 1, 0, 0, 0, 'ext', 'paint');
        // 135. Boundary Wall
        const bWall = new THREE.BoxGeometry(40, 2, 0.3);
        addPart(135, bWall, 0, 1, 19, 1, 1, 1, 0, 0, 0, 'ext', 'block');
        addPart(135, bWall, 0, 1, -19, 1, 1, 1, 0, 0, 0, 'ext', 'block');
        addPart(135, bWall, 19.85, 1, 0, 1, 1, 1, 0, Math.PI/2, 0, 'ext', 'block'); // Rotated Side
        addPart(135, bWall, -19.85, 1, 0, 1, 1, 1, 0, Math.PI/2, 0, 'ext', 'block'); // Rotated Side
        // 138. Pool
        addPart(138, new THREE.BoxGeometry(4, 1.500, 6), 12, 0.500, 0, 1, 1, 1, 0, 0, 0, 'ext', 'water');
        // 140. Paving
        addPart(140, new THREE.BoxGeometry(35, 0.1, 35), 0, 0.1, 0, 1, 1, 1, 0, 0, 0, 'ext', 'paving_pbr');

        // --- 12. MEP ---
        addPart(156, new THREE.BoxGeometry(1, 1, 2), 5, 8.6, -5, 1, 1, 1, 0, 0, 0, 'roof', 'mep');
        const acUnit = new THREE.BoxGeometry(1, 1, 0.5);
        addPart(193, acUnit, 2, 8.1, 8, 1, 1, 1, 0, 0, 0, 'roof', 'mep');
        addPart(193, acUnit, -2, 8.1, 8, 1, 1, 1, 0, 0, 0, 'roof', 'mep');
    }`,

    init: (context) => {
        document.getElementById('save-bim-code-btn')?.addEventListener('click', () => BimDesignerModule.handleSave(context));
        document.getElementById('load-default-bim-btn')?.addEventListener('click', () => BimDesignerModule.handleLoadDefault());
    },

    render: async (jobNo) => {
        const textArea = document.getElementById('bim-code-area');
        if (!jobNo || !textArea) return;

        const siteData = await window.DB.getSiteData(jobNo);
        
        // Extract just the inner code from the default script for display
        const defaultContent = BimDesignerModule.DEFAULT_SCRIPT.substring(
            BimDesignerModule.DEFAULT_SCRIPT.indexOf("{") + 1,
            BimDesignerModule.DEFAULT_SCRIPT.lastIndexOf("}")
        ).trim();

        // Load saved code if it exists, otherwise show the default
        textArea.value = siteData?.bimCode || defaultContent;
    },

    handleSave: async (context) => {
        const { currentJobNo } = context.getState();
        if (!currentJobNo) return alert("Select a project first.");

        const code = document.getElementById('bim-code-area').value;
        
        const siteData = await window.DB.getSiteData(currentJobNo);
        siteData.bimCode = code; // Save just the inner code
        await window.DB.putSiteData(siteData);
        alert("BIM code saved. The BIM viewer will use this new code on the next schedule load.");
        
        // Trigger re-render of schedule tab which re-initializes BIM viewer
        document.querySelector('button[data-tab="schedule"]').click();
        
        
        
        
        
        
        
   },

    handleLoadDefault: () => {
        const codeArea = document.getElementById('bim-code-area');
        if (!codeArea) return;

        const defaultContent = BimDesignerModule.DEFAULT_SCRIPT.substring(
            BimDesignerModule.DEFAULT_SCRIPT.indexOf("{") + 1,
            BimDesignerModule.DEFAULT_SCRIPT.lastIndexOf("}")
        ).trim();

        codeArea.value = defaultContent;
        alert('Default script has been loaded into the editor. Remember to "Save & Apply" to use it.');
    },
};