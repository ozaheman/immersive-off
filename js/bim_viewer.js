
/* START OF FILE js/bim_viewer.js */

const BIMViewer = (() => {
    let scene, camera, renderer, controls;
    let container;
    let buildingElements = {};
    let currentFilter = 'all';
    let animationId = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let tooltipEl;
    // --- TEXTURE LOADER ---
    // --- MATERIALS ---

    const textureLoader = new THREE.TextureLoader();
    function loadPBR(path) {
        return {
            map: textureLoader.load(`${path}/albedo.jpg`),
            normalMap: textureLoader.load(`${path}/normal.jpg`),
            roughnessMap: textureLoader.load(`${path}/roughness.jpg`),
            metalnessMap: textureLoader.load(`${path}/metalness.jpg`)
        };
    }
    const MATS = {
        // Existing
        ghost: new THREE.MeshBasicMaterial({
            color: 0x888888,
            wireframe: true,
            opacity: 0.1,
            transparent: true,
            side: THREE.DoubleSide
        }),

        air: new THREE.MeshPhongMaterial({
            color: 0x888888,
            opacity: 0.0,
            transparent: true,
            side: THREE.DoubleSide
        }),

        active: new THREE.MeshLambertMaterial({
            color: 0xf39c12,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        }),

        concrete: new THREE.MeshLambertMaterial({
            color: 0x95a5a6,
            side: THREE.DoubleSide
        }),

        block: new THREE.MeshLambertMaterial({
            color: 0xc0392b,
            side: THREE.DoubleSide
        }),

        plaster: new THREE.MeshLambertMaterial({
            color: 0xecf0f1,
            side: THREE.DoubleSide
        }),

        paint: new THREE.MeshLambertMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        }),

        glass: new THREE.MeshPhongMaterial({
            color: 0x3498db,
            opacity: 0.6,
            transparent: true,
            side: THREE.DoubleSide
        }),

        ground: new THREE.MeshLambertMaterial({
            color: 0x8d6e63,
            side: THREE.DoubleSide
        }),

        mep: new THREE.MeshStandardMaterial({
            color: 0x2980b9,
            metalness: 0.5,
            roughness: 0.4,
            side: THREE.DoubleSide
        }),

        steel: new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.2,
            side: THREE.DoubleSide
        }),

        aluminium: new THREE.MeshStandardMaterial({
            color: 0xb0b0b0,
            metalness: 0.8,
            roughness: 0.25,
            side: THREE.DoubleSide
        }),

        water: new THREE.MeshPhongMaterial({
            color: 0x00aaff,
            opacity: 0.6,
            transparent: true,
            side: THREE.DoubleSide
        }),

        paving: new THREE.MeshLambertMaterial({
            color: 0xa1887f,
            side: THREE.DoubleSide
        }),

        // --- NEW ARCHITECTURAL MATERIALS ---
        brick: new THREE.MeshLambertMaterial({
            color: 0xb55239,
            side: THREE.DoubleSide
        }),

        gypsumBoard: new THREE.MeshLambertMaterial({
            color: 0xf5f5f5,
            side: THREE.DoubleSide
        }),

        insulation: new THREE.MeshLambertMaterial({
            color: 0xf1c40f,
            opacity: 0.9,
            transparent: true,
            side: THREE.DoubleSide
        }),

        asphalt: new THREE.MeshStandardMaterial({
            color: 0x2c2c2c,
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        rubber: new THREE.MeshStandardMaterial({
            color: 0x111111,
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        wood: new THREE.MeshStandardMaterial({
            color: 0x8e5a2a,
            roughness: 0.6,
            metalness: 0.05,
            side: THREE.DoubleSide
        }),

        ceilingTile: new THREE.MeshLambertMaterial({
            color: 0xeaeaea,
            side: THREE.DoubleSide
        }),

        // --- PHYSICAL MATERIALS WITH BITMAPS ---
        aluminium_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/aluminium'),
            metalness: 1.0,
            roughness: 0.25,
            clearcoat: 0.4,
            side: THREE.DoubleSide
        }),

        asphalt_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/asphalt'),
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        bitumen_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/bitumen'),
            roughness: 0.95,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        cladding_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/cladding'),
            roughness: 0.6,
            metalness: 0.2,
            side: THREE.DoubleSide
        }),

        concrete_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/concrete'),
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        glass_pbr: new THREE.MeshPhysicalMaterial({
            transmission: 1.0,
            roughness: 0.05,
            metalness: 0.0,
            ior: 1.5,
            transparent: true,
            side: THREE.DoubleSide
        }),

        granite_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/granite'),
            roughness: 0.6,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        ground_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/ground'),
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        gypsum_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/gypsum'),
            roughness: 0.9,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        marble_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/marble'),
            roughness: 0.35,
            metalness: 0.0,
            clearcoat: 0.3,
            side: THREE.DoubleSide
        }),

        masonary_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/masonary'),
            roughness: 0.8,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        mesh_pbr: new THREE.MeshPhysicalMaterial({
            color: 0x666666,
            wireframe: true,
            side: THREE.DoubleSide
        }),

        metal_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/metal'),
            metalness: 1.0,
            roughness: 0.35,
            side: THREE.DoubleSide
        }),

        paver_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/paver'),
            roughness: 0.75,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        plastic_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/plastic'),
            roughness: 0.4,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        sand_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/sand'),
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        screed_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/screed'),
            roughness: 0.85,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),

        tile_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/tile'),
            roughness: 0.45,
            metalness: 0.0,
            clearcoat: 0.2,
            side: THREE.DoubleSide
        }),

        water_pbr: new THREE.MeshPhysicalMaterial({
            transmission: 0.9,
            roughness: 0.1,
            ior: 1.33,
            transparent: true,
            side: THREE.DoubleSide
        }),

        wood_pbr: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/wood'),
            roughness: 0.65,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),
        logoua: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/logoua'),
            roughness: 0.65,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),
        logoua1: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/logoua1'),
            roughness: 0.65,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),
        logo1: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/logo1'),
            roughness: 0.65,
            metalness: 0.0,
            side: THREE.DoubleSide
        }),
        logo2: new THREE.MeshPhysicalMaterial({
            ...loadPBR('/js/textures/logo2'),
            roughness: 0.65,
            metalness: 0.0,
            side: THREE.DoubleSide
        })
    };

    const _defaultGenerateStructure = () => {
        buildingElements = {};
        // Full structure generation code from your file should be here.
        // Omitted for brevity, but it's the same as before.
        // --- 1. MOBILIZATION & ENABLING ---// 1. Mobilization Works (Site Fencing)
        const fenceGeo = new THREE.BoxGeometry(0.1, 2, 30);
        addPart(1, fenceGeo, 15, 1, 0, 1, 1, 1, 0, 0, 0, 'sub', 'steel_pbr'); // East
        addPart(1, fenceGeo, -15, 1, 0, 1, 1, 1, 0, 0, 0, 'sub', 'steel_pbr'); // West
        // North/South fences (Rotated 90 deg Y-axis)
        addPart(1, fenceGeo, 0, 1, 15, 1, 1, 1, 0, Math.PI / 2, 0, 'sub', 'steel_pbr'); // North
        addPart(1, fenceGeo, 0, 1, -15, 1, 1, 1, 0, Math.PI / 2, 0, 'sub', 'steel_pbr'); // South

        // 2. Signboard
        addPart(2, new THREE.BoxGeometry(1.5, 3, 0.1), 11, 4, 15, 1, 1, 1, 0, -Math.PI / 4, 0, 'sub', 'paint');

        // 3. Demolishing (Ground clearing)
        addPart(3, new THREE.PlaneGeometry(28, 28), 0, 0.1, 0, 1, 1, 1, -Math.PI / 2, 0, 0, 'sub', 'ground');

        // --- 2. SHORING & EARTHWORKS ---
        // 6. Shoring Works (Piles)
        const pileGeo = new THREE.CylinderGeometry(0.2, 0.2, 6);
        for (let i = -12; i <= 12; i += 3) {
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
        [[-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(p => {
            addPart(21, colGeo, p[0], -2.0, p[1], 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr');
        });
        // Retaining Walls
        const wallLong = new THREE.BoxGeometry(16, 3.5, 0.3);
        addPart(21, wallLong, 0, -2.0, 7.85, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr'); // Front
        addPart(21, wallLong, 0, -2.0, -7.85, 1, 1, 1, 0, 0, 0, 'sub', 'concrete_pbr'); // Back
        addPart(21, wallLong, 7.85, -2.0, 0, 1, 1, 1, 0, Math.PI / 2, 0, 'sub', 'concrete_pbr'); // Right (Rotated)
        addPart(21, wallLong, -7.85, -2.0, 0, 1, 1, 1, 0, Math.PI / 2, 0, 'sub', 'concrete_pbr'); // Left (Rotated)

        // 49. Waterproofing Vertical
        addPart(49, new THREE.BoxGeometry(16.2, 3.5, 0.05), 0, -2.0, 8.05, 1, 1, 1, 0, 0, 0, 'sub', 'steel_pbr');
        // 17. Backfilling
        addPart(17, new THREE.BoxGeometry(30, 4, 30), 0, -2, 0, 1, 1, 1, 0, 0, 0, 'sub', 'ground_pbr');

        // --- 4. SUPERSTRUCTURE - GF ---
        addPart(26, new THREE.BoxGeometry(16.5, 0.3, 16.5), 0, 0, 0, 1, 1, 1, 0, 0, 0, 'gf', 'concrete_pbr'); // Slab
        [[-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(p => addPart(27, colGeo, p[0], 1.9, p[1], 1, 1, 1, 0, 0, 0, 'gf', 'concrete_pbr')); // Cols

        // 39. GF Blockwork
        const blockWall = new THREE.BoxGeometry(16, 3.5, 0.2);
        addPart(39, blockWall, 0, 1.9, 7.5, 1, 1, 1, 0, 0, 0, 'gf', 'block'); // Front
        addPart(39, blockWall, 0, 1.9, -7.5, 1, 1, 1, 0, 0, 0, 'gf', 'block'); // Back
        addPart(39, blockWall, 7.5, 1.9, 0, 1, 1, 1, 0, Math.PI / 2, 0, 'gf', 'block'); // Right
        addPart(39, blockWall, -7.5, 1.9, 0, 1, 1, 1, 0, Math.PI / 2, 0, 'gf', 'block'); // Left

        // --- 5. SUPERSTRUCTURE - FF ---
        addPart(28, new THREE.BoxGeometry(17, 0.3, 17), 0, 3.8, 0, 1, 1, 1, 0, 0, 0, '1', 'concrete_pbr'); // Slab
        [[-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(p => addPart(29, colGeo, p[0], 5.7, p[1], 1, 1, 1, 0, 0, 0, '1', 'concrete_pbr')); // Cols
        // 40. FF Blockwork
        addPart(40, blockWall, 0, 5.7, 7.5, 1, 1, 1, 0, 0, 0, '1', 'block');
        addPart(40, blockWall, 0, 5.7, -7.5, 1, 1, 1, 0, 0, 0, '1', 'block');
        addPart(40, blockWall, 7.5, 5.7, 0, 1, 1, 1, 0, Math.PI / 2, 0, '1', 'block');
        addPart(40, blockWall, -7.5, 5.7, 0, 1, 1, 1, 0, Math.PI / 2, 0, '1', 'block');

        // --- 6. SUPERSTRUCTURE - ROOF ---
        addPart(30, new THREE.BoxGeometry(17, 0.3, 17), 0, 7.6, 0, 1, 1, 1, 0, 0, 0, 'roof', 'concrete_pbr'); // Slab
        const parapet = new THREE.BoxGeometry(17, 1, 0.2);
        addPart(33, parapet, 0, 8.2, 8.4, 1, 1, 1, 0, 0, 0, 'roof', 'concrete_pbr');
        addPart(33, parapet, 0, 8.2, -8.4, 1, 1, 1, 0, 0, 0, 'roof', 'concrete_pbr');
        addPart(33, parapet, 8.4, 8.2, 0.0, 1, 1, 1, 0, Math.PI / 2, 0, 'roof', 'concrete_pbr');
        addPart(33, parapet, -8.4, 8.2, 0.0, 1, 1, 1, 0, Math.PI / 2, 0, 'roof', 'concrete_pbr');
        addPart(41, new THREE.BoxGeometry(4, 3, 4), 5, 9.1, 5, 1, 1, 1, 0, 0, 0, 'roof', 'block'); // Service room

        // --- 7. UPPER ROOF ---
        addPart(31, new THREE.BoxGeometry(0.4, 3, 0.4), 5, 9.1, 5, 1, 1, 1, 0, 0, 0, 'upper_roof', 'concrete_pbr');
        addPart(32, new THREE.BoxGeometry(4.5, 0.2, 4.5), 5, 10.7, 5, 1, 1, 1, 0, 0, 0, 'upper_roof', 'concrete_pbr');
        addPart(34, new THREE.BoxGeometry(4.500, 0.800, 0.100), 5, 11.200, 7.200, 1, 1, 1, 0, 0, 0, 'upper_roof', 'concrete_pbr');
        addPart(34, new THREE.BoxGeometry(4.500, 0.800, 0.100), 5, 11.200, 2.750, 1, 1, 1, 0, 0, 0, 'upper_roof', 'concrete_pbr');
        addPart(34, new THREE.BoxGeometry(4.500, 0.800, 0.100), 2.800, 11.200, 5, 1, 1, 1, 0, Math.PI / 2, 0, 'upper_roof', 'concrete_pbr');
        addPart(34, new THREE.BoxGeometry(4.500, 0.800, 0.100), 7.2, 11.200, 5, 1, 1, 1, 0, Math.PI / 2, 0, 'upper_roof', 'concrete_pbr');

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
        addPart(135, bWall, 19.85, 1, 0, 1, 1, 1, 0, Math.PI / 2, 0, 'ext', 'block'); // Rotated Side
        addPart(135, bWall, -19.85, 1, 0, 1, 1, 1, 0, Math.PI / 2, 0, 'ext', 'block'); // Rotated Side
        // 138. Pool
        addPart(138, new THREE.BoxGeometry(4, 1.500, 6), 12, 0.500, 0, 1, 1, 1, 0, 0, 0, 'ext', 'water');
        // 140. Paving
        addPart(140, new THREE.BoxGeometry(35, 0.1, 35), 0, 0.1, 0, 1, 1, 1, 0, 0, 0, 'ext', 'paving_pbr');

        // --- 12. MEP ---
        addPart(156, new THREE.BoxGeometry(1, 1, 2), 5, 8.6, -5, 1, 1, 1, 0, 0, 0, 'roof', 'mep');
        const acUnit = new THREE.BoxGeometry(1, 1, 0.5);
        addPart(193, acUnit, 2, 8.1, 8, 1, 1, 1, 0, 0, 0, 'roof', 'mep');
        addPart(193, acUnit, -2, 8.1, 8, 1, 1, 1, 0, 0, 0, 'roof', 'mep');
    };
























    const addPart = (taskId, geo, x, y, z, sx = 1, sy = 1, sz = 1, rotX = 0, rotY = 0, rotZ = 0, floor = 'all', matOverride = null) => {
        const mesh = new THREE.Mesh(geo, MATS.ghost);
        mesh.position.set(x, y, z);
        mesh.scale.set(sx, sy, sz);
        mesh.rotation.set(rotX, rotY, rotZ);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.userData = {
            taskId: String(taskId), floor,
            currentState: 'ghost', matOverride
        };

        scene.add(mesh);

        const key = String(taskId);
        if (!buildingElements[key]) buildingElements[key] = [];
        buildingElements[key].push(mesh);
    };





    // --- INITIALIZATION ---
    const init = async (domId) => {
        //const init = (domId, true) => {
        container = document.getElementById(domId);
        if (!container) return;

        const existingTooltip = document.getElementById('bim-tooltip');
        const existingLoading = document.getElementById('bim-loading');
        container.innerHTML = '';
        if (existingLoading) container.appendChild(existingLoading);
        if (existingTooltip) container.appendChild(existingTooltip);
        tooltipEl = existingTooltip;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x222222);

        const gridHelper = new THREE.GridHelper(60, 60, 0x555555, 0x333333);
        scene.add(gridHelper);

        const width = container.clientWidth || 600;
        const height = container.clientHeight || 400;
        camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.set(40, 30, 40);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        // FIX [7]: Add listeners for both mouse and touch events
        renderer.domElement.addEventListener('click', onCanvasClick, false);
        renderer.domElement.addEventListener('touchend', onCanvasTouch, false);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(20, 50, 20);
        dirLight.castShadow = true;
        scene.add(dirLight);
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        new THREE.RGBELoader()
            .setDataType(THREE.UnsignedByteType)
            .load('./js/textures/hdr/environment.hdr', (texture) => {
                const envMap = pmremGenerator.fromEquirectangular(texture).texture;
                scene.background = envMap;
                scene.environment = envMap;
                texture.dispose();
                pmremGenerator.dispose();
            }, undefined, (err) => {
                console.error('An error occurred loading the HDR environment.', err);
                scene.background = new THREE.Color(0x222222); // Fallback color
            });
        // --- END: HDR Environment Loading --
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(0, 5, 0);

        // --- DYNAMIC STRUCTURE LOADING ---
        buildingElements = {}; // Clear previous elements
        let bimCode = null;

        if (window.AppState && window.AppState.currentJobNo && window.DB) {
            const siteData = await window.DB.getSiteData(window.AppState.currentJobNo);
            bimCode = siteData?.bimCode;
        }

        try {
            if (bimCode) {
                console.log("Loading structure from custom BIM code.");
                const customGenerator = new Function('addPart', 'THREE', 'buildingElements', bimCode);
                customGenerator(addPart, THREE, buildingElements);
            } else {
                console.log("No custom BIM code found, loading default structure.");
                _defaultGenerateStructure();
            }
        } catch (e) {
            console.error("Error executing BIM code. Loading default structure as fallback.", e);
            alert(`There was an error in the custom BIM code: ${e.message}\nLoading the default model instead.`);
            _defaultGenerateStructure();
        }

        if (animationId) cancelAnimationFrame(animationId);
        animate();

        setTimeout(onWindowResize, 100);
        window.addEventListener('resize', onWindowResize, false);
    };

    const onCanvasClick = (event) => {
        event.preventDefault();
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        performRaycast();
    };

    // FIX [7]: Handler for touch events on tablets/phones
    const onCanvasTouch = (event) => {
        event.preventDefault();
        if (event.changedTouches.length > 0) {
            const touch = event.changedTouches[0];
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
            performRaycast();
        }
    };

    const performRaycast = () => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData && object.userData.taskId) {
                showTooltip(object.userData);

                const oldMat = object.material;
                object.material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                setTimeout(() => { object.material = oldMat; }, 500);
            }
        } else {
            if (tooltipEl) tooltipEl.style.display = 'none';
        }
    };

    const showTooltip = async (data) => {
        if (!tooltipEl || !window.DOMElements) return;

        const task = window.currentScheduleData ? window.currentScheduleData.find(t => String(t.id) === data.taskId) : null;
        const taskName = task ? task.name : `Task ID: ${data.taskId}`;

        let progress = '0%';
        let workDoneValue = 0;
        let progressPercent = 0;

        const siteData = await window.DB.getSiteData(window.AppState.currentJobNo);
        const boqItem = siteData?.boq?.find(item => String(item.id) === String(data.taskId));

        if (boqItem) {
            progressPercent = (boqItem.prev_perc || 0) + (boqItem.curr_perc || 0);
            progress = `${progressPercent.toFixed(0)}%`;
            const amount = (boqItem.qty || 0) * (boqItem.rate || 0);
            workDoneValue = amount * (progressPercent / 100);
        } else if (task) {
            const now = new Date().getTime();
            const start = new Date(task.start).getTime();
            const end = new Date(task.end).getTime();
            if (now >= end) {
                progress = '100%';
            } else if (now > start) {
                progress = `${Math.round(((now - start) / (end - start)) * 100)}%`;
            }
        }

        // FIX [7]: Correctly reference cached DOM elements
        if (window.DOMElements.bimItemName && window.DOMElements.bimItemStatus && window.DOMElements.bimItemProgress) {
            window.DOMElements.bimItemName.textContent = taskName;
            window.DOMElements.bimItemStatus.textContent = data.currentState.toUpperCase();
            window.DOMElements.bimItemProgress.innerHTML = `
                ${progress} 
                <small>(${workDoneValue > 0 ? workDoneValue.toLocaleString('en-AE', { style: 'currency', currency: 'AED' }) : 'N/A'})</small>
            `;
            tooltipEl.style.display = 'block';
        }
    };

    const onWindowResize = () => {
        if (!camera || !renderer || !container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        if (width === 0 || height === 0) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    };

    const animate = () => {
        animationId = requestAnimationFrame(animate);
        if (controls) controls.update();
        if (renderer && scene && camera) renderer.render(scene, camera);
    };



    const updateSimulation = async (currentDate) => {
        if (!currentDate || isNaN(new Date(currentDate).getTime())) return;
        const curMs = new Date(currentDate).getTime();
        //alert('ok1');
        if (!window.currentScheduleData || !window.AppState.currentJobNo) return;

        // --- NEW: Fetch project progress for material override ---
        const siteData = await window.DB.getSiteData(window.AppState.currentJobNo);
        const projectProgress = siteData?.progress || 0;
        const activeTasksList = document.getElementById('active-tasks-list');
        let activeTasksHTML = '<h5>Current Activities</h5><ul>';
        let hasActive = false;

        for (const [taskIdStr, meshes] of Object.entries(buildingElements)) {
            const task = window.currentScheduleData.find(t => String(t.id) === taskIdStr);

            let state = 'ghost';
            let progress = 0;
            // --- NEW: Check for 95% completion override ---
            if (projectProgress >= 95 && (taskIdStr === '1' || taskIdStr === '2')) {
                state = 'air'; // Make fence and signboard invisible
            } else if (task && task.start && task.end) {
                const startMs = new Date(task.start).getTime();
                const endMs = new Date(task.end).getTime();

                if (curMs >= endMs) {
                    state = 'done';
                    progress = 1;


                } else if (curMs >= startMs) {
                    state = 'active';
                    const duration = endMs - startMs;
                    progress = duration > 0 ? (curMs - startMs) / duration : 0;
                    activeTasksHTML += `<li>${task.name} <span class="progress">${Math.round(progress * 100)}%</span></li>`;
                    hasActive = true;
                }
            }

            meshes.forEach(mesh => {
                if (currentFilter !== 'all' && mesh.userData.floor !== currentFilter) {
                    mesh.visible = false;
                } else {
                    updateMeshState(mesh, state, progress, mesh.userData.matOverride);
                }
            });
        }

        if (!hasActive) activeTasksHTML += '<li style="color:#999;">No active tasks...</li>';
        activeTasksHTML += '</ul>';
        if (activeTasksList) activeTasksList.innerHTML = activeTasksHTML;
    };

    const updateMeshState = (mesh, state, progress, matOverride) => {
        if (mesh.userData.currentState === state && state !== 'active') {
            if (mesh.visible === (currentFilter === 'all' || mesh.userData.floor === currentFilter)) return;
        }

        mesh.visible = (currentFilter === 'all' || mesh.userData.floor === currentFilter);
        mesh.userData.currentState = state;

        if (state === 'ghost') {
            mesh.material = MATS.ghost;
        } else if (state === 'active') {
            mesh.material = MATS.active.clone();
            mesh.material.opacity = 0.3 + (progress * 0.7);
        } else if (state === 'done') {
            mesh.material = matOverride ? (MATS[matOverride] || MATS.concrete) : MATS.concrete;
        } else if (state === 'air') { // --- NEW: Handle invisible state ---
            mesh.material = MATS.air;
        }
    };

    const setFilter = (floorId) => {
        currentFilter = floorId;
        const slider = document.getElementById('simulation-slider');
        const slider1 = document.getElementById('simulation-slider1');
        if (slider) {
            const dateDisplay = document.getElementById('simulation-date-display');
            const dateDisplay1 = document.getElementById('simulation-date-display1');
            const date = new Date(dateDisplay.textContent);
            updateSimulation(date);
        }
    };

    return { init, updateSimulation, setFilter };
})();