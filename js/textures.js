/* Pack de textures PBR réalistes — Poly Haven + AmbientCG (CC0) */
const Textures = (() => {
  const BASE = "textures";
  const TILE = {
    WATER: 0, SAND: 1, GRASS: 2, BEACH: 3, COBBLE: 4, PLAZA: 5,
    ROAD: 6, DIRT: 7, STONE: 8, SHORE: 9,
  };

  const TERRAIN_KEYS = {
    [TILE.SAND]: "sand",
    [TILE.GRASS]: "grass",
    [TILE.BEACH]: "sand",
    [TILE.COBBLE]: "cobble",
    [TILE.PLAZA]: "cobble",
    [TILE.ROAD]: "road",
    [TILE.DIRT]: "dirt",
    [TILE.STONE]: "stone",
    [TILE.SHORE]: "sand",
  };

  const pack = {
    terrain: {},
    buildings: {},
    props: {},
    water: {},
  };
  let ready = false;
  let loading = null;
  let terrainAtlas = null;
  let terrainNormalAtlas = null;
  let waterNormal = null;
  let tileCache = {};

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Texture: ${url}`));
      img.src = url;
    });
  }

  async function loadSet(folder, name) {
    const diff = await loadImage(`${BASE}/${folder}/${name}_diff.jpg`).catch(() => null);
    const nor = await loadImage(`${BASE}/${folder}/${name}_nor.jpg`).catch(() => null);
    const rough = await loadImage(`${BASE}/${folder}/${name}_rough.jpg`).catch(() => null);
    return { diff, nor, rough, name };
  }

  function makeWaterNormal(size = 512) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const img = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = Math.sin(x * 0.08) * 0.35 + Math.sin(y * 0.06 + x * 0.02) * 0.25;
        const ny = Math.cos(y * 0.09) * 0.35 + Math.cos(x * 0.05 + y * 0.03) * 0.25;
        const i = (y * size + x) * 4;
        img.data[i] = ((nx + 1) * 0.5) * 255;
        img.data[i + 1] = ((ny + 1) * 0.5) * 255;
        img.data[i + 2] = 240;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function bakeTerrainAtlases() {
    if (!ready || typeof Island === "undefined") return;
    Island.bake();
    const TS = Island.TS || 16;
    const tw = (Island.W / TS) | 0;
    const th = (Island.H / TS) | 0;
    const px = 4;
    const W = tw * px;
    const H = th * px;

    terrainAtlas = document.createElement("canvas");
    terrainAtlas.width = W;
    terrainAtlas.height = H;
    terrainNormalAtlas = document.createElement("canvas");
    terrainNormalAtlas.width = W;
    terrainNormalAtlas.height = H;
    const ctx = terrainAtlas.getContext("2d");
    const nctx = terrainNormalAtlas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    nctx.imageSmoothingEnabled = true;

    for (let ty = 0; ty < th; ty++) {
      for (let tx = 0; tx < tw; tx++) {
        const wx = tx * TS + TS / 2;
        const wy = ty * TS + TS / 2;
        const kind = Island.tileAt(wx, wy);
        if (kind === TILE.WATER) continue;
        const key = TERRAIN_KEYS[kind] || "sand";
        const set = pack.terrain[key];
        if (!set || !set.diff) continue;
        const ox = ((tx * 17 + ty * 31) % 128);
        const oy = ((tx * 23 + ty * 13) % 128);
        const sw = Math.min(set.diff.width - ox, 256);
        const sh = Math.min(set.diff.height - oy, 256);
        ctx.drawImage(set.diff, ox, oy, sw, sh, tx * px, ty * px, px, px);
        if (set.nor) {
          nctx.drawImage(set.nor, ox, oy, sw, sh, tx * px, ty * px, px, px);
        } else {
          nctx.fillStyle = "#8080f0";
          nctx.fillRect(tx * px, ty * px, px, px);
        }
      }
    }
    tileCache = {};
  }

  function tileFor(key, variant) {
    if (!ready) return null;
    const cacheKey = `${key}_${variant || 0}`;
    if (tileCache[cacheKey]) return tileCache[cacheKey];
    const set = pack.terrain[key];
    if (!set || !set.diff) return null;
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    const ox = ((variant || 0) * 97 + key.length * 41) % 200;
    const oy = ((variant || 0) * 53 + key.length * 19) % 200;
    ctx.drawImage(set.diff, ox, oy, 128, 128, 0, 0, 16, 16);
    tileCache[cacheKey] = c;
    return c;
  }

  function injectAtlasTiles() {
    if (!ready || typeof Atlas === "undefined" || !Atlas.tiles) return;
    const t = Atlas.tiles;
    const map = {
      sand0: ["sand", 0], sand1: ["sand", 1], sand2: ["sand", 2], sand3: ["sand", 3],
      sandCap: ["sand", 1], beach0: ["sand", 0], beach1: ["sand", 2],
      grass: ["grass", 0], grass2: ["grass", 1],
      cobble0: ["cobble", 0], cobble1: ["cobble", 1],
      plaza: ["cobble", 0], stone: ["stone", 0],
      road: ["road", 0], roadH: ["road", 0], roadV: ["road", 1], roadX: ["road", 2],
      path: ["road", 0], pathH: ["road", 0], pathV: ["road", 1], pathX: ["road", 2],
    };
    for (const [id, [key, v]] of Object.entries(map)) {
      const img = tileFor(key, v);
      if (img) t[id] = img;
    }
  }

  async function loadAll() {
    if (ready) return pack;
    if (loading) return loading;
    loading = (async () => {
      const terrainNames = ["sand", "grass", "cobble", "road", "stone", "dirt"];
      const results = await Promise.all(terrainNames.map((n) => loadSet("terrain", n)));
      terrainNames.forEach((n, i) => { pack.terrain[n] = results[i]; });

      const buildNames = ["plaster", "roof", "wood"];
      const bRes = await Promise.all(buildNames.map((n) => loadSet("buildings", n)));
      buildNames.forEach((n, i) => { pack.buildings[n] = bRes[i]; });

      const propNames = ["bark", "leaves", "rock"];
      const pRes = await Promise.all(propNames.map((n) => loadSet("props", n)));
      propNames.forEach((n, i) => { pack.props[n] = pRes[i]; });

      pack.water.normalCanvas = makeWaterNormal(512);
      ready = true;
      bakeTerrainAtlases();
      injectAtlasTiles();
      return pack;
    })();
    return loading;
  }

  function configure(tex, repeatX, repeatY) {
    if (!tex || typeof THREE === "undefined") return tex;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX || 4, repeatY || 4);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function threeFromImage(img, repeatX, repeatY) {
    if (!img || typeof THREE === "undefined") return null;
    const tex = new THREE.Texture(img);
    tex.needsUpdate = true;
    return configure(tex, repeatX, repeatY);
  }

  function threeFromCanvas(c, repeatX, repeatY) {
    if (!c || typeof THREE === "undefined") return null;
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return configure(tex, repeatX, repeatY);
  }

  function terrainMaterial() {
    if (!ready || !terrainAtlas || typeof THREE === "undefined") return null;
    const map = threeFromCanvas(terrainAtlas, 1, 1);
    const normalMap = terrainNormalAtlas ? threeFromCanvas(terrainNormalAtlas, 1, 1) : null;
    if (normalMap) normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.88,
      metalness: 0.02,
      flatShading: false,
    });
  }

  function waterMaterial() {
    if (typeof THREE === "undefined") return null;
    const normalMap = pack.water.normalCanvas
      ? threeFromCanvas(pack.water.normalCanvas, 6, 6)
      : null;
    if (normalMap) normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    return new THREE.MeshPhysicalMaterial({
      color: 0x1a8fd8,
      transparent: true,
      opacity: 0.82,
      roughness: 0.08,
      metalness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
    });
  }

  function surfaceMaterial(key, repeat) {
    const set = pack.buildings[key] || pack.terrain[key] || pack.props[key];
    if (!set || !set.diff || typeof THREE === "undefined") return null;
    const r = repeat || 3;
    const map = threeFromImage(set.diff, r, r);
    const normalMap = set.nor ? threeFromImage(set.nor, r, r) : null;
    const roughnessMap = set.rough ? threeFromImage(set.rough, r, r) : null;
    if (normalMap) normalMap.colorSpace = THREE.LinearSRGBColorSpace;
    if (roughnessMap) roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
    return new THREE.MeshStandardMaterial({
      map,
      normalMap,
      roughnessMap,
      roughness: roughnessMap ? 1 : 0.85,
      metalness: 0.02,
    });
  }

  function animateWater(t) {
    if (!pack.water.normalCanvas) return;
    const c = pack.water.normalCanvas;
    const ctx = c.getContext("2d");
    const size = c.width;
    const img = ctx.createImageData(size, size);
    const phase = t * 1.4;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = Math.sin(x * 0.07 + phase) * 0.3 + Math.sin(y * 0.05 + phase * 0.7) * 0.28;
        const ny = Math.cos(y * 0.08 + phase * 0.9) * 0.3 + Math.cos(x * 0.06 + phase * 0.5) * 0.25;
        const i = (y * size + x) * 4;
        img.data[i] = ((nx + 1) * 0.5) * 255;
        img.data[i + 1] = ((ny + 1) * 0.5) * 255;
        img.data[i + 2] = 240;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    if (pack.water.threeNormal) pack.water.threeNormal.needsUpdate = true;
  }

  function bindWaterNormal(tex) {
    pack.water.threeNormal = tex;
  }

  return {
    loadAll,
    isReady: () => ready,
    terrainMaterial,
    waterMaterial,
    surfaceMaterial,
    animateWater,
    bindWaterNormal,
    tileFor,
    injectAtlasTiles,
    bakeTerrainAtlases,
    pack,
  };
})();
