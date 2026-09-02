/* Moteur 3D low-poly — Three.js, île Djerba */
const Engine3D = (() => {
  const TILE = {
    WATER: 0, SAND: 1, GRASS: 2, BEACH: 3, COBBLE: 4, PLAZA: 5,
    ROAD: 6, DIRT: 7, STONE: 8, SHORE: 9,
  };

  const COL = {
    [TILE.WATER]: new THREE.Color(0x1a7fd4),
    [TILE.SAND]: new THREE.Color(0xe8c878),
    [TILE.GRASS]: new THREE.Color(0x2f9640),
    [TILE.BEACH]: new THREE.Color(0xf8e8b8),
    [TILE.COBBLE]: new THREE.Color(0xc8bca8),
    [TILE.PLAZA]: new THREE.Color(0xd8d0c4),
    [TILE.ROAD]: new THREE.Color(0x5a5a62),
    [TILE.DIRT]: new THREE.Color(0xc9a060),
    [TILE.STONE]: new THREE.Color(0x9a9a9a),
    [TILE.SHORE]: new THREE.Color(0xfff4d0),
  };

  const HGT = {
    [TILE.WATER]: -6,
    [TILE.SAND]: 9,
    [TILE.GRASS]: 16,
    [TILE.BEACH]: 11,
    [TILE.COBBLE]: 13,
    [TILE.PLAZA]: 12,
    [TILE.ROAD]: 13,
    [TILE.DIRT]: 10,
    [TILE.STONE]: 15,
    [TILE.SHORE]: 9,
  };

  const WATER_LEVEL = -16;
  const BUILD_SCALE = 1.55;
  const CAR_SCALE = 1.35;
  const NPC_SCALE = 0.86;
  const PROP_SCALE = 0.78;
  const EYE_H = 22;

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
  let roadRoot = null;
  let grassRoot = null;
  let lifeRoot = null;
  let active = false;
  let built = false;
  let titleMode = false;
  let titleCamAngle = 0;
  let titleLastTs = 0;
  let camPos = new THREE.Vector3();
  let camTarget = new THREE.Vector3();
  let camYaw = Math.PI * 0.22;
  let camHands = null;
  const FPS_FOV = 74;
  let waterNormalPhase = 0;
  let shakeT = 0;
  let shakeAmp = 0;
  let plasterMat = null;
  let roofMat = null;
  let woodMat = null;
  let barkMat = null;
  let leavesMat = null;
  let rockMat = null;
  let roadMat = null;
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
    return sampleHeight(wx, wy);
  }

  function sampleHeight(wx, wz) {
    if (typeof Island === "undefined") return 0;
    if (!Island.contains(wx, wz)) return WATER_LEVEL - 10;
    const t = Island.tileAt(wx, wz);
    if (t === TILE.WATER) return WATER_LEVEL - 8;
    let h = HGT[t] != null ? HGT[t] : 9;
    const n1 = Math.sin(wx * 0.0075) * Math.cos(wz * 0.0068);
    const n2 = Math.sin(wx * 0.017 + 0.8) * Math.cos(wz * 0.014 + 0.5);
    const n3 = Math.sin(wx * 0.032 + wz * 0.021) * 0.4;
    if (t === TILE.GRASS || t === TILE.DIRT) {
      h += n1 * 4 + n2 * 2.5 + n3 * 2;
    } else if (t === TILE.SAND || t === TILE.BEACH || t === TILE.SHORE) {
      h += n1 * 1.5 + n2 * 0.8;
    } else if (t === TILE.STONE || t === TILE.COBBLE || t === TILE.PLAZA) {
      h += n1 * 1.2 + n2 * 0.8;
    }
    let nearCoast = false;
    for (let a = 0; a < 8; a++) {
      const ang = a * Math.PI / 4;
      const nx = wx + Math.cos(ang) * 40;
      const nz = wz + Math.sin(ang) * 40;
      if (!Island.contains(nx, nz) || Island.tileAt(nx, nz) === TILE.WATER) {
        nearCoast = true;
        break;
      }
    }
    if (nearCoast && (t === TILE.BEACH || t === TILE.SHORE || t === TILE.SAND)) {
      h = Math.max(h, WATER_LEVEL + 12);
    }
    return Math.max(h, WATER_LEVEL + 7);
  }

  function surfaceY(wx, wz, opts) {
    const gy = sampleHeight(wx, wz);
    if (!opts) return gy;
    const t = Island.tileAt(wx, wz);
    if (opts.road && t === TILE.ROAD) return gy + 1.5;
    if (opts.car) return gy + (t === TILE.ROAD ? 1.6 : 0.4);
    return gy;
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
    roadMat = Textures.surfaceMaterial("road", 8);
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
    const segX = 128;
    const segZ = 96;
    const geo = new THREE.PlaneGeometry(W, H, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + W / 2;
      const z = pos.getZ(i) + H / 2;
      const t = Island.tileAt(x, z);
      const h = sampleHeight(x, z);
      pos.setY(i, h);
      let c = (COL[t] || COL[TILE.SAND]).clone();
      if (t === TILE.GRASS) {
        c.offsetHSL(0, 0.04, Math.sin(x * 0.02 + z * 0.015) * 0.05);
      } else if (t === TILE.BEACH || t === TILE.SHORE) {
        c.offsetHSL(0, -0.02, 0.04);
      } else if (t === TILE.ROAD) {
        c.multiplyScalar(0.85);
      } else if (t === TILE.COBBLE || t === TILE.PLAZA) {
        c.offsetHSL(0, -0.03, 0.02);
      } else {
        c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.03);
      }
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      vertexColors: true, flatShading: false, roughness: 0.92, metalness: 0,
    }));
    terrain.receiveShadow = true;
    islandOx = W / 2;
    islandOz = H / 2;
    terrain.position.set(islandOx, 0, islandOz);
    root.add(terrain);

    const wGeo = new THREE.PlaneGeometry(W + 400, H + 400, 48, 36);
    wGeo.rotateX(-Math.PI / 2);
    if (typeof WaterEngine !== "undefined") {
      waterShader = WaterEngine.createMaterial(sunDir, 1);
      water = new THREE.Mesh(wGeo, waterShader);
    } else {
      water = new THREE.Mesh(wGeo, mat(0x1a7fd4, { transparent: true, opacity: 0.72, roughness: 0.1 }));
    }
    water.position.set(islandOx, WATER_LEVEL, islandOz);
    root.add(water);
  }

  function buildHouse(b) {
    const g = new THREE.Group();
    const cx = b.x + b.w / 2;
    const cz = b.y + b.h / 2;
    const gy = groundY(cx, cz);
    const wall = plasterMat || mat(0xf5efe0, { texKey: "plaster", smooth: true });
    const roof = roofMat || mat(0xc85838, { texKey: "roof", smooth: true });
    const wood = woodMat || mat(0x6a5030, { texKey: "wood", repeat: 2 });
    const h = Math.max(28, b.h * 0.72 * BUILD_SCALE);
    const w = b.w * 0.95;
    const d = b.h * 0.92;
    g.add(box(w, h, d, wall, 0, gy + h / 2, 0));
    g.add(box(w * 1.08, h * 0.2, d * 1.08, roof, 0, gy + h + h * 0.1, 0));
    const doorW = (b.doorW || 20) * 1.1;
    const doorH = (b.doorH || 22) * BUILD_SCALE * 0.55;
    const doorLocalX = (b.doorX || 28) + (b.doorW || 20) / 2 - b.w / 2;
    const doorZ = d * 0.48;
    g.add(box(doorW, doorH, 2.5, wood, doorLocalX, gy + doorH / 2 + 1, doorZ));
    g.add(box(doorW * 0.85, doorH * 0.92, 1.2, mat(0x1a1410), doorLocalX, gy + doorH / 2 + 1, doorZ + 1.8));
    if (b.room === "cafe") {
      const aw = box(w * 0.35, 3, d * 0.5, 0xe04040, 0, gy + h + 6, d * 0.28);
      g.add(aw);
    }
    if (b.room === "hotel" || b.room === "airport") {
      g.add(box(w * 0.15, h * 0.65, d * 0.12, mat(0x88c8e8, { transparent: true, opacity: 0.55 }), 0, gy + h * 0.45, d * 0.44));
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
    const S = BUILD_SCALE;
    if (sprite === "mosque") {
      const baseCol = plasterMat || mat(0xf0ece4, { texKey: "plaster", smooth: true });
      const bh = Math.max(24, b.h * 0.55 * S);
      const base = box(b.w * 1.05, bh, b.h * 1.05, baseCol, 0, gy + bh / 2, 0);
      g.add(base);
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(b.w * 0.38, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        plasterMat || mat(0xf8f4ec, { texKey: "plaster", smooth: true })
      );
      dome.position.set(0, gy + bh, 0);
      g.add(dome);
      g.add(box(8, 52 * S * 0.35, 8, plasterMat || mat(0xf0ece4, { texKey: "plaster" }), b.w * 0.3, gy + bh + 26 * S * 0.35, 0));
      const minTop = new THREE.Mesh(new THREE.ConeGeometry(7, 14, 4), mat(0x48a8d8));
      minTop.position.set(b.w * 0.3, gy + bh + 52 * S * 0.35, 0);
      g.add(minTop);
    } else if (sprite === "fort") {
      const stoneM = rockMat || mat(0xd8d0c0, { texKey: "stone", smooth: true });
      g.add(box(b.w * 1.1, b.h * 0.6 * S, b.h * 1.1, stoneM, 0, gy + b.h * 0.3 * S, 0));
      g.add(box(b.w * 0.75, b.h * 0.4 * S, b.h * 0.75, stoneM, 0, gy + b.h * 0.78 * S, 0));
    } else if (sprite === "synagogue") {
      g.add(box(b.w * 1.05, 28 * S * 0.35, b.h * 1.05, plasterMat || mat(0xf8f0e0, { texKey: "plaster" }), 0, gy + 14 * S * 0.35, 0));
      g.add(box(b.w * 0.5, 18 * S * 0.35, b.h * 0.5, mat(0x48a8d8), 0, gy + 32 * S * 0.35, 0));
    } else {
      const sh = Math.max(28, b.h * 0.65 * S);
      g.add(box(b.w * 1.02, sh, b.h * 1.02, plasterMat || mat(0xe8e0d0, { texKey: "plaster" }), 0, gy + sh / 2, 0));
      if (b.doorW) {
        g.add(box(b.doorW * 1.1, b.doorH * S * 0.5, 2, mat(0x2a2018), 0, gy + b.doorH * S * 0.25, b.h * 0.48));
      }
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
      if (n++ > 900) break;
      if (p.kind === "palm") decoRoot.add(buildPalm(p.x, p.y, p.seed || 0));
      else if (p.kind === "rock") decoRoot.add(buildRock(p.x, p.y, p.seed || 0));
      else if (p.kind === "bush") decoRoot.add(buildBush(p.x, p.y));
    }
    root.add(decoRoot);
  }

  function rebuildTexturedWorld() {
    applyTexturePack();
    buildBuildings();
    buildRoads();
    buildGrass();
    buildDeco();
    buildAmbientLife();
  }

  function buildAmbientLife() {
    if (lifeRoot) {
      root.remove(lifeRoot);
      disposeGroup(lifeRoot);
      lifeRoot = null;
    }
    lifeRoot = new THREE.Group();
    const anchors = ["sidi", "houmt", "ajim", "midoun", "portHoumt"];
    anchors.forEach((name, i) => {
      const p = Island.xy(name);
      for (let b = 0; b < 3; b++) {
        const bird = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 5, 4),
          new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.9 })
        );
        bird.userData.orbit = {
          cx: p.x + b * 30,
          cz: p.y + b * 18,
          r: 50 + b * 22 + i * 8,
          sp: 0.15 + b * 0.04,
          phase: i * 2 + b,
          alt: 28 + b * 6,
        };
        lifeRoot.add(bird);
      }
    });
    const ports = [Island.xy("ajim"), Island.xy("portHoumt")];
    ports.forEach((p, i) => {
      const boat = new THREE.Group();
      const hull = box(18, 4, 8, 0x8a5030, 0, 0, 0);
      const mast = box(1.5, 14, 1.5, 0xf0ece0, 0, 8, 0);
      boat.add(hull, mast);
      boat.userData.boat = {
        cx: p.x + 40 + i * 30,
        cz: p.y + 60,
        sp: 0.08 + i * 0.02,
        phase: i * 1.7,
      };
      lifeRoot.add(boat);
    });
    root.add(lifeRoot);
  }

  function tickAmbientLife(t) {
    if (!lifeRoot) return;
    for (const obj of lifeRoot.children) {
      if (obj.userData.orbit) {
        const o = obj.userData.orbit;
        const a = t * o.sp + o.phase;
        const wx = o.cx + Math.cos(a) * o.r;
        const wz = o.cz + Math.sin(a) * o.r * 0.55;
        obj.position.set(gx(wx), sampleHeight(wx, wz) + o.alt + Math.sin(t * 3 + o.phase) * 2, gz(wz));
      } else if (obj.userData.boat) {
        const b = obj.userData.boat;
        const a = t * b.sp + b.phase;
        const wx = b.cx + Math.sin(a) * 12;
        const wz = b.cz + Math.cos(a) * 8;
        obj.position.set(gx(wx), WATER_LEVEL + 1.2 + Math.sin(t * 1.2 + b.phase) * 0.4, gz(wz));
        obj.rotation.y = a;
      }
    }
  }

  function disposeGroup(grp) {
    if (!grp) return;
    grp.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }

  function buildRoads() {
    if (roadRoot) {
      root.remove(roadRoot);
      disposeGroup(roadRoot);
      roadRoot = null;
    }
    roadRoot = new THREE.Group();
    const asphalt = roadMat || mat(0x2a2a32, { texKey: "road", repeat: 6 });
    const roads = Island.roads();
    const rw = 46;
    const rh = 1.6;
    for (let ri = 0; ri < roads.length; ri++) {
      const [x1, y1, x2, y2] = roads[ri];
      const len = Math.hypot(x2 - x1, y2 - y1);
      const steps = Math.max(1, Math.ceil(len / 28));
      const dx = (x2 - x1) / steps;
      const dy = (y2 - y1) / steps;
      for (let i = 0; i <= steps; i++) {
        const wx = x1 + dx * i;
        const wy = y1 + dy * i;
        const gy = surfaceY(wx, wy, { road: true });
        const seg = new THREE.Mesh(new THREE.BoxGeometry(rw, rh, rw), asphalt);
        seg.position.set(gx(wx), gy + rh * 0.45, gz(wy));
        seg.receiveShadow = true;
        roadRoot.add(seg);
        if (i % 4 === 2) {
          const mark = new THREE.Mesh(
            new THREE.BoxGeometry(rw * 0.12, 0.25, rw * 0.35),
            mat(0xf0e040)
          );
          mark.position.set(gx(wx), gy + rh + 0.15, gz(wy));
          roadRoot.add(mark);
        }
      }
    }
    root.add(roadRoot);
  }

  function buildGrass() {
    if (grassRoot) {
      root.remove(grassRoot);
      disposeGroup(grassRoot);
      grassRoot = null;
    }
    grassRoot = new THREE.Group();
    const tuftM = leavesMat || mat(0x3a9a48, { texKey: "grass", repeat: 2 });
    const TS = Island.TS || 16;
    const tw = (Island.W / TS) | 0;
    const th = (Island.H / TS) | 0;
    let count = 0;
    for (let ty = 2; ty < th - 2; ty++) {
      for (let tx = 2; tx < tw - 2; tx++) {
        const wx = tx * TS + ((tx * 7 + ty * 11) % 9);
        const wy = ty * TS + ((tx * 13 + ty * 5) % 9);
        if (Island.tileAt(wx, wy) !== TILE.GRASS) continue;
        const roll = (tx * 17 + ty * 31) % 11;
        if (roll > 4) continue;
        const gy = sampleHeight(wx, wy);
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(3.2, 9, 4), tuftM);
        tuft.position.set(gx(wx), gy + 4.5, gz(wy));
        tuft.rotation.y = (tx + ty) * 0.4;
        grassRoot.add(tuft);
        if (roll <= 1) {
          const tuft2 = tuft.clone();
          tuft2.position.x += 6;
          tuft2.position.z += 4;
          grassRoot.add(tuft2);
        }
        if (++count > 720) break;
      }
      if (count > 720) break;
    }
    root.add(grassRoot);
  }

  function buildPalm(x, y, seed) {
    const S = PROP_SCALE;
    const g = new THREE.Group();
    const gy = groundY(x, y);
    const trunkH = 32 * S;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2 * S, 3.4 * S, trunkH, 8),
      barkMat || mat(0x8a6030, { texKey: "bark", repeat: 2 })
    );
    trunk.position.set(0, gy + trunkH / 2, 0);
    trunk.castShadow = true;
    g.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(9 * S, 20 * S, 6),
        leavesMat || mat(0x2d9a40, { texKey: "leaves", repeat: 2 })
      );
      const a = (i / 6) * Math.PI * 2 + seed * 0.01;
      leaf.position.set(Math.cos(a) * 5 * S, gy + trunkH + 8 * S, Math.sin(a) * 5 * S);
      leaf.rotation.z = Math.cos(a) * 0.55;
      leaf.rotation.x = Math.sin(a) * 0.55;
      g.add(leaf);
    }
    g.position.set(gx(x), 0, gz(y));
    return g;
  }

  function buildRock(x, y, seed) {
    const gy = groundY(x, y);
    const S = PROP_SCALE;
    const m = new THREE.Mesh(
      new THREE.DodecahedronGeometry((4 + (seed % 3)) * S, 0),
      rockMat || mat(0x9a9088, { texKey: "rock", repeat: 2 })
    );
    m.position.set(gx(x), gy + 2.5 * S, gz(y));
    m.scale.set(1.3, 0.8, 1.1);
    m.castShadow = true;
    return m;
  }

  function buildBush(x, y) {
    const gy = groundY(x, y);
    const S = PROP_SCALE;
    const m = new THREE.Mesh(new THREE.SphereGeometry(5.5 * S, 10, 8), leavesMat || mat(0x3a9048, { texKey: "leaves", repeat: 2 }));
    m.position.set(gx(x), gy + 3 * S, gz(y));
    m.scale.y = 0.75;
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

  function buildFpsHands() {
    const g = new THREE.Group();
    g.name = "fpsHands";
    const skin = new THREE.MeshStandardMaterial({ color: 0xf0c8a0, roughness: 0.72 });
    const shirt = new THREE.MeshStandardMaterial({ color: 0x48b868, roughness: 0.78 });
    const toolM = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.35 });
    const lArm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 10, 3.5), shirt);
    lArm.position.set(-5.5, -7, -11);
    lArm.rotation.x = -0.35;
    const lHand = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 3.2), skin);
    lHand.position.set(-5.5, -12.5, -11);
    const rArm = new THREE.Mesh(new THREE.BoxGeometry(3.5, 10, 3.5), shirt);
    rArm.position.set(5.5, -8, -12);
    rArm.rotation.x = -0.55;
    rArm.rotation.z = -0.12;
    const rHand = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 3.2), skin);
    rHand.position.set(6.5, -13.5, -11.5);
    const tool = new THREE.Mesh(new THREE.BoxGeometry(1.4, 14, 1.4), toolM);
    tool.name = "fpsTool";
    tool.position.set(8.5, -12, -10);
    tool.rotation.x = -0.85;
    tool.rotation.z = 0.25;
    g.add(lArm, lHand, rArm, rHand, tool);
    g.frustumCulled = false;
    return g;
  }

  function attachFpsHands() {
    if (!camera || camHands) return;
    camHands = buildFpsHands();
    camHands.scale.setScalar(0.88);
    camera.add(camHands);
    scene.add(camera);
  }

  function updateFpsHands(player, t) {
    if (!camHands) return;
    const bob = Math.sin(t * 10) * 0.35;
    const atk = player.attacking ? Math.sin(t * 24) * 2.5 : 0;
    camHands.position.y = bob - atk * 0.4;
    camHands.position.x = atk * 0.15;
    const tool = camHands.getObjectByName("fpsTool");
    if (tool) tool.visible = !player.swim;
  }

  function makeNpcMesh(n) {
    if (typeof Characters3D !== "undefined") {
      return Characters3D.build(Characters3D.npcStyle(n), { quest: !!n.qRole });
    }
    const g = new THREE.Group();
    return g;
  }

  function makeCarMesh(car) {
    const S = CAR_SCALE;
    const g = new THREE.Group();
    const bodyCol = car && car.taxi ? 0xf0c020 : 0xe84838;
    g.add(box(22 * S, 9 * S, 13 * S, bodyCol, 0, 7 * S, 0));
    g.add(box(13 * S, 7 * S, 11 * S, 0x88c8e8, 0, 14 * S, -1.5 * S));
    for (const sx of [-7, 7]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(3 * S, 3 * S, 2 * S, 10), mat(0x202020));
      w.rotation.z = Math.PI / 2;
      w.position.set(sx * S, 3 * S, 0);
      g.add(w);
    }
    if (car && car.taxi) {
      g.add(box(4 * S, 2 * S, 4 * S, 0xfff46c, 0, 16 * S, 0));
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
    scene.fog = new THREE.Fog(0xb8e0f8, 1200, 4800);
    clock = new THREE.Clock();
    root = new THREE.Group();
    scene.add(root);

    camera = new THREE.PerspectiveCamera(FPS_FOV, 1, 1, 8000);
    buildSky();
    buildLights();
    buildTerrain();
    if (typeof Textures !== "undefined") {
      Textures.loadAll().then(() => {
        rebuildTexturedWorld();
      }).catch((err) => {
        console.warn("Textures:", err);
        buildBuildings();
        buildRoads();
        buildGrass();
        buildDeco();
        buildAmbientLife();
      });
    } else {
      buildBuildings();
      buildRoads();
      buildGrass();
      buildDeco();
      buildAmbientLife();
    }

    playerGrp = makePlayerMesh();
    playerGrp.visible = false;
    root.add(playerGrp);
    attachFpsHands();

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
          buildRoads();
          buildGrass();
          buildDeco();
        });
      } else {
        buildBuildings();
        buildRoads();
        buildGrass();
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
      water.position.y = WATER_LEVEL + Math.sin(t * 0.5) * 0.35;
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
        m.scale.setScalar(NPC_SCALE);
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
      let cx = c.px != null ? c.px : c.x + 24;
      let cy = c.py != null ? c.py : c.y + 12;
      if (typeof Island.snapRoad === "function") {
        const snap = Island.snapRoad(cx, cy);
        cx = snap.x;
        cy = snap.y;
      }
      const gy = surfaceY(cx, cy, { car: true });
      m.position.set(gx(cx), gy, gz(cy));
      let rotY = c.facing < 0 ? Math.PI : 0;
      const path = c.path;
      if (path && path.length > 1 && c.pi != null) {
        const tgt = path[c.pi];
        if (tgt) {
          const dx = tgt.x - cx;
          const dz = tgt.y - cy;
          if (Math.hypot(dx, dz) > 3) rotY = Math.atan2(dx, dz);
        }
      }
      m.rotation.y = rotY;
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
    playerGrp.visible = false;

    if (player.angle != null) {
      camYaw = player.angle;
    } else if (Math.hypot(player.vx, player.vy) > 4) {
      camYaw = Math.atan2(player.vy, player.vx);
    } else if (player.facing != null) {
      camYaw = player.facing < 0 ? Math.PI : 0;
    }

    if (typeof Characters3D !== "undefined") {
      Characters3D.animate(playerGrp, state, phase, player.facing || 1, player.attacking);
      const hat = playerGrp.getObjectByName("hat");
      if (hat && hat.material) {
        hat.material.color.setHex(gold ? 0xffd24a : 0x2db84a);
      }
    }
    updateFpsHands(player, t);
  }

  function updateCamera(player, dt) {
    const px = player.x + 16;
    const pz = player.y + 20;
    const gy = groundY(px, pz);
    const yaw = player.angle != null ? player.angle : camYaw;
    const pitch = player.pitch || 0;
    const moving = Math.hypot(player.vx || 0, player.vy || 0) > 8;
    const headBob = moving ? Math.sin(performance.now() * 0.012) * 0.55 : 0;
    const swimBob = player.swim ? Math.sin(performance.now() * 0.008) * 1.2 : 0;

    const desired = new THREE.Vector3(
      gx(px),
      gy + EYE_H + headBob + swimBob,
      gz(pz)
    );
    camPos.lerp(desired, 1 - Math.pow(0.00008, dt));
    if (shakeT > 0) {
      shakeT -= dt;
      camPos.x += (Math.random() - 0.5) * shakeAmp;
      camPos.y += (Math.random() - 0.5) * shakeAmp * 0.5;
      camPos.z += (Math.random() - 0.5) * shakeAmp;
    }
    camera.position.copy(camPos);

    const cp = Math.cos(pitch);
    const lookX = Math.cos(yaw) * cp;
    const lookY = Math.sin(pitch);
    const lookZ = Math.sin(yaw) * cp;
    camTarget.set(
      camPos.x + lookX * 120,
      camPos.y + lookY * 120,
      camPos.z + lookZ * 120
    );
    camera.lookAt(camTarget);
    if (camera.fov !== FPS_FOV) {
      camera.fov = FPS_FOV;
      camera.updateProjectionMatrix();
    }

    const sunFocus = new THREE.Vector3(
      camPos.x + lookX * 80,
      gy + 8,
      camPos.z + lookZ * 80
    );
    sun.position.set(sunFocus.x + 600, sunFocus.y + 1200, sunFocus.z + 400);
    sun.target.position.copy(sunFocus);
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
    tickAmbientLife(t);
    if (water) {
      water.position.x = islandOx;
      water.position.z = islandOz;
      water.position.y = WATER_LEVEL + Math.sin(t * 0.6) * 0.35;
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
      if (camera && scene) scene.remove(camera);
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer = null;
    }
    scene = null;
    camera = null;
    camHands = null;
    root = null;
    playerGrp = null;
  }

  return {
    init, initTitle, buildWorld, render, renderTitle, resize, dispose, hitShake,
    applyWorldSim, active: () => active, titleActive: () => titleMode,
  };
})();
