/* Moteur 3D low-poly — Three.js, île Djerba */
const Engine3D = (() => {
  const TILE = {
    WATER: 0, SAND: 1, GRASS: 2, BEACH: 3, COBBLE: 4, PLAZA: 5,
    ROAD: 6, DIRT: 7, STONE: 8, SHORE: 9,
  };

  const COL = {
    [TILE.WATER]: new THREE.Color(0x1a7fd4),
    [TILE.SAND]: new THREE.Color(0xe8c872),
    [TILE.GRASS]: new THREE.Color(0x3fa84f),
    [TILE.BEACH]: new THREE.Color(0xf2dc9a),
    [TILE.COBBLE]: new THREE.Color(0xb8a898),
    [TILE.PLAZA]: new THREE.Color(0xd8c8b0),
    [TILE.ROAD]: new THREE.Color(0xc8b090),
    [TILE.DIRT]: new THREE.Color(0xc9a060),
    [TILE.STONE]: new THREE.Color(0x9a9a9a),
    [TILE.SHORE]: new THREE.Color(0xf5e4b0),
  };

  const HGT = {
    [TILE.WATER]: -6,
    [TILE.SAND]: 0.4,
    [TILE.GRASS]: 1.8,
    [TILE.BEACH]: 0.2,
    [TILE.COBBLE]: 0.8,
    [TILE.PLAZA]: 0.6,
    [TILE.ROAD]: 0.5,
    [TILE.DIRT]: 0.3,
    [TILE.STONE]: 1.2,
    [TILE.SHORE]: 0.1,
  };

  const TRASH_COL = {
    can: 0xc84830, bottle: 0x48b8e8, bag: 0x303030, butt: 0xd8a060,
    cup: 0xf0f0f0, paper: 0xf8f0d8, peel: 0xf0c848,
  };

  let renderer = null;
  let scene = null;
  let camera = null;
  let clock = null;
  let root = null;
  let terrain = null;
  let water = null;
  let sun = null;
  let playerGrp = null;
  let trashRoot = null;
  let npcRoot = null;
  let carRoot = null;
  let binRoot = null;
  let buildingRoot = null;
  let decoRoot = null;
  let active = false;
  let built = false;
  let titleMode = false;
  let titleCamAngle = 0;
  let titleLastTs = 0;
  let camPos = new THREE.Vector3();
  let camTarget = new THREE.Vector3();
  let camYaw = Math.PI * 0.22;
  let waterNormalPhase = 0;
  let shakeT = 0;
  let shakeAmp = 0;
  let plasterMat = null;
  let roofMat = null;
  let woodMat = null;
  let barkMat = null;
  let leavesMat = null;
  let rockMat = null;
  let skyDome = null;
  let hemiLight = null;
  let ambLight = null;
  let rainSystem = null;
  let waterShader = null;
  const sunDir = new THREE.Vector3(0.4, 0.8, 0.3);
  let islandOx = 0;
  let islandOz = 0;
  const trashMesh = new Map();
  const npcMesh = new Map();
  const carMesh = new Map();
  const binMesh = [];

  function gx(x) { return x; }
  function gz(y) { return y; }

  function groundY(wx, wy) {
    const t = Island.tileAt(wx, wy);
    return HGT[t] != null ? HGT[t] : 0;
  }

  function mat(color, opts = {}) {
    if (opts.texKey && typeof Textures !== "undefined" && Textures.isReady()) {
      const tm = Textures.surfaceMaterial(opts.texKey, opts.repeat || 3);
      if (tm) return tm;
    }
    return new THREE.MeshStandardMaterial({
      color,
      flatShading: !opts.smooth,
      roughness: opts.roughness != null ? opts.roughness : 0.82,
      metalness: opts.metal || 0,
      emissive: opts.emissive || 0x000000,
      emissiveIntensity: opts.emissiveI || 0,
      transparent: !!opts.transparent,
      opacity: opts.opacity != null ? opts.opacity : 1,
    });
  }

  function applyTexturePack() {
    if (typeof Textures === "undefined" || !Textures.isReady()) return;
    plasterMat = Textures.surfaceMaterial("plaster", 4);
    roofMat = Textures.surfaceMaterial("roof", 3);
    woodMat = Textures.surfaceMaterial("wood", 2);
    barkMat = Textures.surfaceMaterial("bark", 2);
    leavesMat = Textures.surfaceMaterial("leaves", 2);
    rockMat = Textures.surfaceMaterial("rock", 2);
    if (terrain) {
      const tm = Textures.terrainMaterial();
      if (tm) terrain.material = tm;
    }
    if (water) {
      const wm = Textures.waterMaterial();
      if (wm && !waterShader) {
        water.material = wm;
        if (wm.normalMap) Textures.bindWaterNormal(wm.normalMap);
      }
    }
  }

  function applyWorldSim(sim, dt) {
    if (!sim || !scene) return;
    if (scene.fog) {
      scene.fog.color.setHex(sim.sky.fog);
      scene.fog.near = 700 + sim.cloudCover * 180;
    }
    if (sun) {
      sun.intensity = sim.sky.sun;
      sun.position.set(sim.sun.x * 2800 + 400, sim.sun.y * 2600 + 300, sim.sun.z * 2200);
      sunDir.set(sim.sun.x, Math.max(0.05, sim.sun.y), sim.sun.z).normalize();
    }
    if (hemiLight) hemiLight.intensity = sim.sky.ambient;
    if (ambLight) ambLight.intensity = 0.08 + sim.dayFactor * 0.2;
    updateSky(sim);
    updateRain(sim, dt || 0.016);
    if (waterShader && typeof WaterEngine !== "undefined") {
      WaterEngine.tick(waterShader, performance.now() / 1000, sunDir, sim.dayFactor);
    }
    if (rainSystem && rainSystem.visible && window.__player) {
      const p = window.__player;
      rainSystem.position.set(p.x + 16, 0, p.y + 20);
    }
  }

  function box(w, h, d, colorOrMat, x, y, z) {
    const material = (colorOrMat && colorOrMat.isMaterial)
      ? colorOrMat
      : mat(colorOrMat);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function buildSky() {
    const geo = new THREE.SphereGeometry(4200, 32, 16);
    const colors = [];
    const cTop = new THREE.Color(0x5eb8ff);
    const cHor = new THREE.Color(0xb8e8ff);
    const cLow = new THREE.Color(0xfff0c8);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.smoothstep(y, -200, 800);
      const c = cLow.clone().lerp(cHor, t * 0.6).lerp(cTop, t);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      vertexColors: true, side: THREE.BackSide, fog: false,
    }));
    skyDome = dome;
    islandOx = (typeof Island !== "undefined" ? Island.W : 5120) / 2;
    islandOz = (typeof Island !== "undefined" ? Island.H : 3840) / 2;
    dome.position.set(islandOx, 0, islandOz);
    scene.add(dome);
  }

  function updateSky(sim) {
    if (!skyDome || !sim) return;
    const geo = skyDome.geometry;
    const pos = geo.attributes.position;
    const colors = [];
    const cTop = new THREE.Color(sim.sky.top);
    const cMid = new THREE.Color(sim.sky.mid);
    const cHor = new THREE.Color(sim.sky.horizon);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.smoothstep(y, -200, 800);
      const c = cHor.clone().lerp(cMid, t * 0.55).lerp(cTop, t);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.attributes.color.needsUpdate = true;
  }

  function updateRain(sim, dt) {
    if (!scene) return;
    const intensity = (sim.rainIntensity || 0) + (sim.sandIntensity || 0) * 0.5;
    if (intensity < 0.08) {
      if (rainSystem) rainSystem.visible = false;
      return;
    }
    if (!rainSystem) {
      const n = 1200;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 2000;
        pos[i * 3 + 1] = Math.random() * 400 + 80;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      rainSystem = new THREE.Points(geo, new THREE.PointsMaterial({
        color: sim.sandIntensity > 0.3 ? 0xd8c090 : 0xa8d8ff,
        size: sim.sandIntensity > 0.3 ? 2.2 : 1.4,
        transparent: true,
        opacity: 0.55,
      }));
      rainSystem.userData.vel = [];
      for (let i = 0; i < n; i++) rainSystem.userData.vel.push(80 + Math.random() * 60);
      scene.add(rainSystem);
    }
    rainSystem.visible = true;
    rainSystem.material.opacity = Math.min(0.7, intensity);
    rainSystem.material.color.setHex(sim.sandIntensity > 0.3 ? 0xd8c090 : 0xa8d8ff);
    const pos = rainSystem.geometry.attributes.position;
    const vel = rainSystem.userData.vel;
    for (let i = 0; i < vel.length; i++) {
      let y = pos.getY(i) - vel[i] * dt;
      if (y < 20) y = 280 + Math.random() * 120;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  }

  function buildLights() {
    hemiLight = new THREE.HemisphereLight(0x9ad8ff, 0xf0d090, 0.55);
    scene.add(hemiLight);
    sun = new THREE.DirectionalLight(0xfff4d8, 1.15);
    sun.position.set(1800, 2400, 1200);
    sun.castShadow = true;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
    sun.shadow.camera.near = 200;
    sun.shadow.camera.far = 6000;
    const sc = 2200;
    sun.shadow.camera.left = -sc;
    sun.shadow.camera.right = sc;
    sun.shadow.camera.top = sc;
    sun.shadow.camera.bottom = -sc;
    sun.shadow.bias = -0.0004;
    scene.add(sun);
    scene.add(sun.target);
    ambLight = new THREE.AmbientLight(0x6080a0, 0.22);
    scene.add(ambLight);
  }

  function buildTerrain() {
    const W = Island.W;
    const H = Island.H;
    const segX = 96;
    const segZ = 72;
    const geo = new THREE.PlaneGeometry(W, H, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + W / 2;
      const z = pos.getZ(i) + H / 2;
      const t = Island.tileAt(x, z);
      const h = HGT[t] != null ? HGT[t] : 0;
      const n = (Math.sin(x * 0.018) + Math.cos(z * 0.015)) * (t === TILE.GRASS ? 0.8 : 0.2);
      pos.setY(i, h + n);
      const c = (COL[t] || COL[TILE.SAND]).clone();
      c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.04);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, flatShading: true, roughness: 0.9, metalness: 0,
    }));
    terrain.receiveShadow = true;
    islandOx = W / 2;
    islandOz = H / 2;
    terrain.position.set(islandOx, 0, islandOz);
    root.add(terrain);

    const wGeo = new THREE.PlaneGeometry(W + 800, H + 800, 64, 48);
    wGeo.rotateX(-Math.PI / 2);
    if (typeof WaterEngine !== "undefined") {
      waterShader = WaterEngine.createMaterial(sunDir, 1);
      water = new THREE.Mesh(wGeo, waterShader);
    } else {
      water = new THREE.Mesh(wGeo, mat(0x1a7fd4, { transparent: true, opacity: 0.78, roughness: 0.1 }));
    }
    water.position.set(islandOx, -5.5, islandOz);
    root.add(water);
  }

  function buildHouse(b) {
    const g = new THREE.Group();
    const cx = b.x + b.w / 2;
    const cz = b.y + b.h / 2;
    const gy = groundY(cx, cz);
    const wall = plasterMat || mat(0xf5efe0, { texKey: "plaster", smooth: true });
    const roof = roofMat || mat(0xc85838, { texKey: "roof", smooth: true });
    const h = Math.max(14, b.h * 0.42);
    const w = b.w * 0.92;
    const d = b.h * 0.88;
    g.add(box(w, h, d, wall, 0, gy + h / 2, 0));
    g.add(box(w * 1.06, h * 0.22, d * 1.06, roof, 0, gy + h + h * 0.08, 0));
    if (b.room === "cafe") {
      const aw = box(w * 0.35, 2, d * 0.5, 0xe04040, 0, gy + h + 4, d * 0.28);
      g.add(aw);
    }
    g.position.set(gx(cx), 0, gz(cz));
    g.castShadow = true;
    return g;
  }

  function buildSite(b) {
    const g = new THREE.Group();
    const cx = b.x + b.w / 2;
    const cz = b.y + b.h / 2;
    const gy = groundY(cx, cz);
    const sprite = b.sprite || "shop";
    if (sprite === "mosque") {
      const baseCol = plasterMat || mat(0xf0ece4, { texKey: "plaster", smooth: true });
      const base = box(b.w, 10, b.h, baseCol, 0, gy + 5, 0);
      g.add(base);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(b.w * 0.35, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        plasterMat || mat(0xf8f4ec, { texKey: "plaster", smooth: true })
      );
      dome.position.set(0, gy + 10, 0);
      g.add(dome);
      g.add(box(6, 28, 6, plasterMat || mat(0xf0ece4, { texKey: "plaster" }), b.w * 0.3, gy + 14, 0));
      const minTop = new THREE.Mesh(new THREE.ConeGeometry(5, 8, 4), mat(0x48a8d8));
      minTop.position.set(b.w * 0.3, gy + 32, 0);
      g.add(minTop);
    } else if (sprite === "fort") {
      const stoneM = rockMat || mat(0xd8d0c0, { texKey: "stone", smooth: true });
      g.add(box(b.w, b.h * 0.55, b.h, stoneM, 0, gy + b.h * 0.28, 0));
      g.add(box(b.w * 0.7, b.h * 0.35, b.h * 0.7, stoneM, 0, gy + b.h * 0.72, 0));
    } else if (sprite === "synagogue") {
      g.add(box(b.w, 12, b.h, plasterMat || mat(0xf8f0e0, { texKey: "plaster" }), 0, gy + 6, 0));
      g.add(box(b.w * 0.5, 8, b.h * 0.5, mat(0x48a8d8), 0, gy + 16, 0));
    } else {
      g.add(box(b.w, Math.max(12, b.h * 0.5), b.h, plasterMat || mat(0xe8e0d0, { texKey: "plaster" }), 0, gy + b.h * 0.25, 0));
    }
    g.position.set(gx(cx), 0, gz(cz));
    return g;
  }

  function buildBuildings() {
    if (buildingRoot) {
      root.remove(buildingRoot);
      buildingRoot.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    buildingRoot = new THREE.Group();
    for (const b of Places.BUILDINGS) {
      const isSite = b.sprite && b.sprite !== "shop";
      const m = (b.w >= 70 && !isSite) ? buildHouse(b) : buildSite(b);
      buildingRoot.add(m);
    }
    root.add(buildingRoot);
  }

  function buildDeco() {
    if (decoRoot) {
      root.remove(decoRoot);
      decoRoot.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
          else o.material.dispose();
        }
      });
    }
    decoRoot = new THREE.Group();
    const props = Island.props();
    let n = 0;
    for (const p of props) {
      if (n++ > 420) break;
      if (p.kind === "palm") decoRoot.add(buildPalm(p.x, p.y, p.seed || 0));
      else if (p.kind === "rock") decoRoot.add(buildRock(p.x, p.y, p.seed || 0));
      else if (p.kind === "bush") decoRoot.add(buildBush(p.x, p.y));
    }
    root.add(decoRoot);
  }

  function rebuildTexturedWorld() {
    applyTexturePack();
    buildBuildings();
    buildDeco();
  }

  function buildPalm(x, y, seed) {
    const g = new THREE.Group();
    const gy = groundY(x, y);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.8, 14, 6),
      barkMat || mat(0x8a6030, { texKey: "bark", repeat: 1 })
    );
    trunk.position.set(0, gy + 7, 0);
    trunk.castShadow = true;
    g.add(trunk);
    for (let i = 0; i < 5; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(5, 12, 5),
        leavesMat || mat(0x2d9a40, { texKey: "leaves", repeat: 1 })
      );
      const a = (i / 5) * Math.PI * 2 + seed * 0.01;
      leaf.position.set(Math.cos(a) * 3, gy + 16, Math.sin(a) * 3);
      leaf.rotation.z = Math.cos(a) * 0.5;
      leaf.rotation.x = Math.sin(a) * 0.5;
      g.add(leaf);
    }
    g.position.set(gx(x), 0, gz(y));
    return g;
  }

  function buildRock(x, y, seed) {
    const gy = groundY(x, y);
    const m = new THREE.Mesh(
      new THREE.DodecahedronGeometry(3 + (seed % 3), 0),
      rockMat || mat(0x9a9088, { texKey: "rock", repeat: 1 })
    );
    m.position.set(gx(x), gy + 2, gz(y));
    m.scale.set(1.2, 0.7, 1.1);
    m.castShadow = true;
    return m;
  }

  function buildBush(x, y) {
    const gy = groundY(x, y);
    const m = new THREE.Mesh(new THREE.SphereGeometry(3.5, 8, 6), leavesMat || mat(0x3a9048, { texKey: "leaves" }));
    m.position.set(gx(x), gy + 2, gz(y));
    m.scale.y = 0.7;
    return m;
  }

  function buildBins(world) {
    binRoot = new THREE.Group();
    for (const b of world.bins || [world.bin]) {
      if (!b) continue;
      const gy = groundY(b.x + 6, b.y + 8);
      const g = new THREE.Group();
      g.add(box(10, 14, 8, 0x2d8a40, 0, gy + 7, 0));
      g.add(box(12, 2, 10, 0x1a5a28, 0, gy + 15, 0));
      g.position.set(gx(b.x), 0, gz(b.y));
      binRoot.add(g);
      binMesh.push(g);
    }
    root.add(binRoot);
  }

  function makePlayerMesh() {
    if (typeof Characters3D !== "undefined") {
      const g = Characters3D.build("player", { hat: true, tool: true });
      g.name = "player";
      return g;
    }
    const g = new THREE.Group();
    g.name = "player";
    return g;
  }

  function makeNpcMesh(n) {
    if (typeof Characters3D !== "undefined") {
      return Characters3D.build(Characters3D.npcStyle(n), { quest: !!n.qRole });
    }
    const g = new THREE.Group();
    return g;
  }

  function makeCarMesh(car) {
    const g = new THREE.Group();
    const bodyCol = car && car.taxi ? 0xf0c020 : 0xe84838;
    g.add(box(22, 8, 12, bodyCol, 0, 6, 0));
    g.add(box(12, 6, 10, 0x88c8e8, 0, 12, -1));
    for (const sx of [-7, 7]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 1.5, 8), mat(0x202020));
      w.rotation.z = Math.PI / 2;
      w.position.set(sx, 2.5, 0);
      g.add(w);
    }
    return g;
  }

  function makeTrashMesh(type) {
    const col = TRASH_COL[type] || 0xaaaaaa;
    let geo;
    if (type === "bottle") geo = new THREE.CylinderGeometry(1.2, 1.2, 5, 6);
    else if (type === "can") geo = new THREE.CylinderGeometry(1.5, 1.5, 3, 8);
    else if (type === "bag") geo = new THREE.BoxGeometry(4, 3, 2);
    else geo = new THREE.BoxGeometry(2.5, 2, 2.5);
    const m = new THREE.Mesh(geo, mat(col));
    m.castShadow = true;
    return m;
  }

  function init(mount) {
    if (typeof THREE === "undefined") {
      console.error("Engine3D: Three.js manquant");
      return false;
    }
    try {
      if (renderer) dispose();
      Island.bake();
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.id = "game-gl";
    renderer.domElement.className = "game-gl";
    mount.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x5eb8ff);
    scene.fog = new THREE.Fog(0xb8e0f8, 900, 3400);
    clock = new THREE.Clock();
    root = new THREE.Group();
    scene.add(root);

    camera = new THREE.PerspectiveCamera(48, 1, 1, 8000);
    buildSky();
    buildLights();
    buildTerrain();
    if (typeof Textures !== "undefined") {
      Textures.loadAll().then(() => {
        rebuildTexturedWorld();
      }).catch((err) => {
        console.warn("Textures:", err);
        buildBuildings();
        buildDeco();
      });
    } else {
      buildBuildings();
      buildDeco();
    }

    playerGrp = makePlayerMesh();
    root.add(playerGrp);

    trashRoot = new THREE.Group();
    npcRoot = new THREE.Group();
    carRoot = new THREE.Group();
    root.add(trashRoot, npcRoot, carRoot);

    active = true;
    built = false;
    titleMode = false;
    resize();
    window.addEventListener("resize", resize);
    return true;
    } catch (err) {
      console.error("Engine3D init:", err);
      dispose();
      return false;
    }
  }

  function initTitle(mount) {
    if (typeof THREE === "undefined") return false;
    try {
      if (renderer) dispose();
      Island.bake();
      titleMode = true;
      titleCamAngle = Math.PI * 0.35;
      titleLastTs = performance.now();

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      renderer.domElement.id = "title-gl";
      renderer.domElement.className = "game-gl";
      mount.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd4a574);
      scene.fog = new THREE.Fog(0xd4a574, 700, 3200);
      clock = new THREE.Clock();
      root = new THREE.Group();
      scene.add(root);

      camera = new THREE.PerspectiveCamera(42, 1, 1, 8000);
      buildSky();
      buildLights();
      if (sun) {
        sun.intensity = 1.35;
        sun.color.set(0xffd090);
      }
      buildTerrain();
      if (typeof Textures !== "undefined") {
        Textures.loadAll().then(() => rebuildTexturedWorld()).catch(() => {
          buildBuildings();
          buildDeco();
        });
      } else {
        buildBuildings();
        buildDeco();
      }

      playerGrp = makePlayerMesh();
      playerGrp.visible = false;
      root.add(playerGrp);

      trashRoot = new THREE.Group();
      npcRoot = new THREE.Group();
      carRoot = new THREE.Group();
      root.add(trashRoot, npcRoot, carRoot);

      active = true;
      built = false;
      resize();
      window.addEventListener("resize", resize);
      return true;
    } catch (err) {
      console.error("Engine3D title:", err);
      dispose();
      return false;
    }
  }

  function renderTitle(t, dt) {
    if (!active || !renderer || !titleMode) return;
    titleCamAngle += (dt || 0.016) * 0.1;
    const p = Island.xy("houmt");
    const cx = p.x + 16;
    const cz = p.y + 20;
    const gy = groundY(cx, cz);
    const dist = 240;
    const height = 95;
    camera.position.set(
      cx + Math.sin(titleCamAngle) * dist,
      gy + height,
      cz + Math.cos(titleCamAngle) * dist * 0.85
    );
    camera.lookAt(cx, gy + 18, cz);
    if (sun) {
      sun.position.set(cx + 500, gy + 900, cz + 300);
      sun.target.position.set(cx, gy + 10, cz);
      sun.target.updateMatrixWorld();
    }
    if (water) {
      water.position.x = islandOx;
      water.position.z = islandOz;
      water.position.y = -5.5 + Math.sin(t * 0.5) * 0.3;
    }
    if (typeof Textures !== "undefined" && Textures.isReady()) Textures.animateWater(t);
    renderer.render(scene, camera);
  }

  function buildWorld(world) {
    if (!root) return;
    if (binRoot) {
      root.remove(binRoot);
      binRoot = null;
      binMesh.length = 0;
    }
    buildBins(world);
    trashMesh.forEach((m) => trashRoot.remove(m));
    trashMesh.clear();
    built = true;
  }

  function syncTrash(world, t) {
    const living = World.living(world).concat(World.livingRares(world));
    const alive = new Set();
    for (const item of living) {
      alive.add(item.id);
      let m = trashMesh.get(item.id);
      if (!m) {
        m = makeTrashMesh(item.type);
        m.scale.setScalar(item.rare ? 1.8 : 1);
        trashRoot.add(m);
        trashMesh.set(item.id, m);
      }
      const gy = groundY(item.x + 8, item.y + 10);
      const bob = item.rare ? Math.sin(t * 4 + item.y) * 1.5 : 0;
      m.position.set(gx(item.x + 8), gy + 2 + bob, gz(item.y + 10));
      if (item.rare) m.rotation.y = t * 0.8;
    }
    for (const [id, m] of trashMesh) {
      if (!alive.has(id)) {
        trashRoot.remove(m);
        trashMesh.delete(id);
      }
    }
  }

  function syncNpcs(world, t) {
    const outdoor = (world.npcs || []).filter((n) => !n.indoor);
    const alive = new Set();
    for (const n of outdoor) {
      alive.add(n.id);
      let m = npcMesh.get(n.id);
      if (!m) {
        m = makeNpcMesh(n);
        npcRoot.add(m);
        npcMesh.set(n.id, m);
      }
      const gy = groundY(n.x + 16, n.y + 20);
      m.position.set(gx(n.x + 16), gy, gz(n.y + 20));
      const moving = Math.hypot(n.vx || 0, n.vy || 0) > 6;
      const phase = (n.x + n.y) * 0.01 + t * (moving ? 9 : 1);
      if (typeof Characters3D !== "undefined") {
        Characters3D.animate(m, moving ? "walk" : "idle", phase, n.facing || 1, false);
      } else {
        m.rotation.y = n.facing < 0 ? Math.PI : 0;
      }
      const qm = m.getObjectByName("questMark");
      if (qm && typeof Quests !== "undefined") {
        qm.visible = !!Quests.mark(n);
        qm.position.y = 28 + Math.sin(t * 3) * 1.5;
      }
    }
    for (const [id, m] of npcMesh) {
      if (!alive.has(id)) {
        npcRoot.remove(m);
        npcMesh.delete(id);
      }
    }
  }

  function syncCars(world) {
    const cars = world.cars || [];
    const alive = new Set();
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      const id = c._meshId || `car_${i}`;
      c._meshId = id;
      alive.add(id);
      let m = carMesh.get(id);
      if (!m) {
        m = makeCarMesh(c);
        carRoot.add(m);
        carMesh.set(id, m);
      }
      const gy = groundY(c.x, c.y);
      m.position.set(gx(c.x), gy, gz(c.y));
      m.rotation.y = c.facing < 0 ? Math.PI : 0;
    }
    for (const [id, m] of carMesh) {
      if (!alive.has(id)) {
        carRoot.remove(m);
        carMesh.delete(id);
      }
    }
  }

  function syncPlayer(player, t, gold) {
    const px = player.x + 16;
    const pz = player.y + 20;
    const gy = groundY(px, pz);
    const phase = (player.phys && player.phys.walkPhase) || t * 8;
    const state = player.animState || (player.swim ? "swim" : (Math.hypot(player.vx, player.vy) > 8 ? "walk" : "idle"));
    const bob = state === "walk" ? Math.sin(t * 12) * 0.4 : 0;
    playerGrp.position.set(gx(px), gy + bob, gz(pz));

    if (Math.hypot(player.vx, player.vy) > 4) {
      camYaw = Math.atan2(player.vx, player.vy);
    } else if (player.facing != null) {
      camYaw = player.facing < 0 ? Math.PI : 0;
    }

    if (typeof Characters3D !== "undefined") {
      Characters3D.animate(playerGrp, state, phase, player.facing || 1, player.attacking);
      const hat = playerGrp.getObjectByName("hat");
      if (hat && hat.material) {
        hat.visible = true;
        hat.material.color.setHex(gold ? 0xffd24a : 0x2db84a);
      }
    } else {
      playerGrp.rotation.y = camYaw;
    }
  }

  function updateCamera(player, dt) {
    const px = player.x + 16;
    const pz = player.y + 20;
    const py = groundY(px, pz) + 14;
    camTarget.set(gx(px), py, gz(pz));

    const dist = 88;
    const height = 52;
    const desired = new THREE.Vector3(
      camTarget.x + Math.sin(camYaw) * dist * 0.55,
      camTarget.y + height,
      camTarget.z + Math.cos(camYaw) * dist
    );
    camPos.lerp(desired, 1 - Math.pow(0.001, dt));
    if (shakeT > 0) {
      shakeT -= dt;
      camPos.x += (Math.random() - 0.5) * shakeAmp;
      camPos.y += (Math.random() - 0.5) * shakeAmp * 0.5;
      camPos.z += (Math.random() - 0.5) * shakeAmp;
    }
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    sun.position.set(camTarget.x + 600, camTarget.y + 1200, camTarget.z + 400);
    sun.target.position.copy(camTarget);
    sun.target.updateMatrixWorld();
  }

  function resize() {
    if (!renderer || !camera) return;
    const el = renderer.domElement.parentElement;
    const w = el ? el.clientWidth : window.innerWidth;
    const h = el ? el.clientHeight : window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  function render(world, player, t, dt) {
    if (!active || !renderer) return;
    if (!built) buildWorld(world);
    const gold = Progress.get().cosmetics.hat_gold;
    if (typeof WorldSim !== "undefined") applyWorldSim(WorldSim.state(), dt || 0.016);
    syncTrash(world, t);
    syncNpcs(world, t);
    syncCars(world);
    syncPlayer(player, t, gold);
    updateCamera(player, dt || 0.016);
    if (water) {
      water.position.x = islandOx;
      water.position.z = islandOz;
      water.position.y = -5.5 + Math.sin(t * 0.6) * 0.25;
    }
    if (typeof Textures !== "undefined" && Textures.isReady()) Textures.animateWater(t);
    renderer.render(scene, camera);
  }

  function hitShake(amp) {
    shakeAmp = amp * 18;
    shakeT = 0.22;
  }

  function dispose() {
    active = false;
    built = false;
    titleMode = false;
    window.removeEventListener("resize", resize);
    trashMesh.clear();
    npcMesh.clear();
    carMesh.clear();
    binMesh.length = 0;
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    scene = null;
    camera = null;
    root = null;
    playerGrp = null;
  }

  return {
    init, initTitle, buildWorld, render, renderTitle, resize, dispose, hitShake,
    applyWorldSim, active: () => active, titleActive: () => titleMode,
  };
})();
