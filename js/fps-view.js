/* Vue première personne — raycasting + billboards */
const FPSView = (() => {
  const FOV = Math.PI / 2.35;
  const MAX_DIST = 520;
  const STEP = 3;
  const EYE_Y = 20;
  const WALL_H = 72;

  const ROOM_COL = {
    home: "#ece4d4", shop: "#c8a870", cafe: "#ece4d4", cabaret: "#5a2848",
    hotel: "#f0f4fc", airport: "#b0b8c8", mosque: "#fcfcfc", synagogue: "#f4f8ff",
    fort: "#d4a85c", museum: "#ece4d4", menzel: "#e8dcc8", kiln: "#c87848",
    mill: "#c8a060", cistern: "#a88858", cemetery: "#d8d0c0", graffiti: "#f8f0ff",
    oven: "#c87848", workshop: "#c8a870",
  };

  const PROP_COL = { palm: "#2a8a28", bush: "#3cbc3c", rock: "#808890" };
  const PROP_R = { palm: 14, bush: 10, rock: 12 };

  function eye(p) {
    return { x: p.x + 16, y: p.y + EYE_Y };
  }

  function hitBuilding(x, y) {
    const buildings = Places.BUILDINGS;
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (x < b.x || x > b.x + b.w || y < b.y || y > b.y + b.h) continue;
      const door = Places.doorRect(b);
      if (x >= door.x && x < door.x + door.w && y >= door.y && y < door.y + door.h) continue;
      return { room: b.room || "home", title: b.title };
    }
    return null;
  }

  function hitProp(x, y) {
    const props = Island.props();
    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      const r = PROP_R[p.kind] || 10;
      const px = p.x + 8;
      const py = p.y + (p.kind === "palm" ? 20 : 10);
      if (Math.hypot(x - px, y - py) < r) return p;
    }
    return null;
  }

  function floorCol(tile) {
    const C = Atlas.C;
    if (tile === 0) return "#1a6bb5";
    if (tile === 1 || tile === 3) return C.sandB || "#f0cc84";
    if (tile === 2) return C.green || "#3cbc3c";
    if (tile === 4 || tile === 5) return C.cobbleA || "#c4a878";
    if (tile === 6) return C.road || "#3a3c48";
    if (tile === 8) return C.stone || "#808890";
    if (tile === 7) return C.sandC || "#d4a85c";
    return C.sandB || "#e8c878";
  }

  function castRay(ox, oy, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    for (let d = STEP; d < MAX_DIST; d += STEP) {
      const x = ox + cos * d;
      const y = oy + sin * d;
      const b = hitBuilding(x, y);
      if (b) {
        return { dist: d, kind: "wall", color: ROOM_COL[b.room] || "#ece4d4" };
      }
      const pr = hitProp(x, y);
      if (pr) {
        return { dist: d, kind: "prop", color: PROP_COL[pr.kind] || "#3cbc3c" };
      }
      if (!Island.contains(x, y)) {
        return { dist: d, kind: "sea", color: "#1a6bb5" };
      }
    }
    return { dist: MAX_DIST, kind: "open", color: null };
  }

  function collectSprites(world, player, px, py) {
    const list = [];
    const range = 360;
    const push = (x, y, w, h, kind, ref) => {
      const dx = x - px;
      const dy = y - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 6 || dist > range) return;
      list.push({ x, y, w, h, kind, ref, dist, ang: Math.atan2(dy, dx) });
    };

    for (const tr of World.living(world)) push(tr.x + 8, tr.y + 10, 16, 16, "trash", tr);
    for (const r of World.livingRares(world)) push(r.x + 8, r.y + 10, 16, 16, "rare", r);
    for (const b of world.bins || [world.bin]) {
      if (b) push(b.x + 8, b.y + 8, 20, 24, "bin", b);
    }
    for (const n of world.npcs || []) {
      if (n.dead) continue;
      if (!world.inside && n.indoor) continue;
      if (world.inside && !n.indoor) continue;
      push(n.x + 16, n.y + 20, 32, 40, "npc", n);
    }
    if (!world.inside) {
      for (const car of world.cars || []) push(car.x + 20, car.y + 14, 40, 24, "car", car);
    }
    return list.sort((a, b) => b.dist - a.dist);
  }

  function drawBillboard(ctx, sp, player, cw, ch, t) {
    let rel = sp.ang - player.angle;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    if (Math.abs(rel) > FOV * 0.62) return;

    const dist = sp.dist * Math.cos(rel);
    if (dist < 4) return;
    const sx = (rel / (FOV * 0.5)) * (cw * 0.5) + cw * 0.5;
    const scale = Math.min(3.2, 2400 / dist);
    const pitch = player.pitch || 0;
    const sy = ch * 0.52 + pitch * ch * 0.35 + scale * 0.12;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale / 32, scale / 32);

    if (sp.kind === "trash" || sp.kind === "rare") {
      const tr = sp.ref;
      const col = tr.kind === "can" ? "#c8c8c8" : tr.kind === "bag" ? "#8a6840" : "#4a9ae8";
      ctx.fillStyle = col;
      ctx.fillRect(-6, -8, 12, 14);
      ctx.fillStyle = "#fff";
      ctx.fillRect(-2, -6, 4, 4);
    } else if (sp.kind === "bin") {
      ctx.fillStyle = "#2a8a3a";
      ctx.fillRect(-8, -10, 16, 18);
      ctx.fillStyle = "#1a5a28";
      ctx.fillRect(-6, -12, 12, 4);
    } else if (sp.kind === "npc") {
      const n = sp.ref;
      const face = (n.facing || 1) >= 0 ? 1 : -1;
      ctx.fillStyle = "#f0c8a0";
      ctx.fillRect(-5, -18, 10, 10);
      ctx.fillStyle = n.job === "fish" ? "#4a7ab8" : "#c83848";
      ctx.fillRect(-7, -8, 14, 14);
      ctx.fillStyle = "#303030";
      ctx.fillRect(-4 * face, -16, 2, 2);
      if (n.qRole && typeof Quests !== "undefined" && Quests.mark(n)) {
        ctx.fillStyle = "#fcbc14";
        ctx.fillRect(-2, -26 + Math.sin(t * 6) * 2, 4, 6);
      }
    } else if (sp.kind === "car") {
      ctx.fillStyle = "#d03030";
      ctx.fillRect(-14, -6, 28, 12);
      ctx.fillStyle = "#88c8f8";
      ctx.fillRect(-8, -8, 10, 4);
    }
    ctx.restore();
  }

  function drawHands(ctx, cw, ch, tool, attacking, t) {
    const bob = attacking ? Math.sin(t * 24) * 4 : Math.sin(t * 10) * 2;
    const baseY = ch - 4;
    ctx.save();
    ctx.globalAlpha = 1;
    if (tool === "balai") {
      ctx.fillStyle = "#6a5030";
      ctx.fillRect(cw * 0.55, baseY - 92 + bob, 10, 92);
      ctx.fillStyle = "#d8c8a0";
      ctx.fillRect(cw * 0.48, baseY - 100 + bob, 28, 14);
      ctx.fillStyle = "#f0c8a0";
      ctx.fillRect(cw * 0.38, baseY - 30 + bob, 22, 30);
    } else {
      ctx.fillStyle = "#f0c8a0";
      ctx.fillRect(cw * 0.30, baseY - 36 + bob, 26, 36);
      ctx.fillStyle = "#e0b890";
      ctx.fillRect(cw * 0.26, baseY - 22 + bob, 14, 22);
      ctx.fillStyle = "#c83848";
      ctx.fillRect(cw * 0.46, baseY - 52 + bob, 40, 16);
      ctx.fillStyle = "#888";
      ctx.fillRect(cw * 0.66, baseY - 56 + bob, 30, 7);
      ctx.fillStyle = "#aaa";
      ctx.fillRect(cw * 0.82, baseY - 68 + bob, 7, 20);
      ctx.fillRect(cw * 0.89, baseY - 62 + bob, 7, 14);
    }
    ctx.restore();
  }

  function drawCrosshair(ctx, cw, ch) {
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    const cx = cw * 0.5;
    const cy = ch * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();
  }

  function renderOutdoor(ctx, player, world, t, cw, ch, tool) {
    const e = eye(player);
    const pitch = player.pitch || 0;
    const horizon = ch * 0.5 + pitch * ch * 0.28;
    const halfFov = FOV * 0.5;
    const numRays = Math.min(cw, 240);
    const rayStep = cw / numRays;
    const zbuf = new Float32Array(numRays);

    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, "#3a8ad8");
    sky.addColorStop(1, "#b8e0ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, cw, horizon + 1);

    ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < numRays; i++) {
      const rayAng = player.angle - halfFov + (i / numRays) * FOV;
      const hit = castRay(e.x, e.y, rayAng);
      const dist = hit.dist * Math.cos(rayAng - player.angle);
      zbuf[i] = dist;
      const wallH = Math.min(ch * 1.5, (WALL_H * ch) / Math.max(dist, 8));
      const x = i * rayStep;
      const y0 = horizon - wallH * 0.5;
      const y1 = horizon + wallH * 0.5;

      if (hit.kind === "open") {
        continue;
      }

      const shade = Math.max(0.32, 1 - dist / MAX_DIST);
      const col = hit.color || "#888";
      const r = parseInt(col.slice(1, 3), 16) * shade | 0;
      const g = parseInt(col.slice(3, 5), 16) * shade | 0;
      const b = parseInt(col.slice(5, 7), 16) * shade | 0;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y0, rayStep + 1, y1 - y0);
    }

    const posZ = 0.5 * ch;
    for (let row = horizon + 1; row < ch; row += 2) {
      const p = row - horizon;
      if (p <= 0) continue;
      for (let i = 0; i < numRays; i++) {
        const rayAng = player.angle - halfFov + (i / numRays) * FOV;
        const rowDist = (posZ * 0.85) / p;
        if (rowDist >= zbuf[i]) continue;
        const wx = e.x + Math.cos(rayAng) * rowDist;
        const wy = e.y + Math.sin(rayAng) * rowDist;
        const tile = Island.tileAt(wx, wy);
        const col = floorCol(tile);
        const shade = Math.max(0.45, 1 - rowDist / MAX_DIST);
        const r = parseInt(col.slice(1, 3), 16) * shade | 0;
        const g = parseInt(col.slice(3, 5), 16) * shade | 0;
        const b = parseInt(col.slice(5, 7), 16) * shade | 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(i * rayStep, row, rayStep + 1, 2);
      }
    }

    const sprites = collectSprites(world, player, e.x, e.y);
    for (const sp of sprites) drawBillboard(ctx, sp, player, cw, ch, t);

    if (player.swim) {
      ctx.fillStyle = "rgba(26,107,181,0.3)";
      ctx.fillRect(0, ch * 0.5, cw, ch * 0.5);
    }

    drawHands(ctx, cw, ch, tool, player.attacking, t);
    drawCrosshair(ctx, cw, ch);
  }

  function renderInterior(ctx, player, world, t, cw, ch, tool) {
    const inside = world.inside;
    const w = inside.w;
    const h = inside.h;
    const pitch = player.pitch || 0;
    const horizon = ch * 0.48 + pitch * ch * 0.32;
    const wallCol = ROOM_COL[inside.room] || "#ece4d4";
    const floorCol2 = inside.room === "shop" ? "#a88858" : "#c4a878";
    const halfFov = FOV * 0.5;
    const numRays = Math.min(cw, 200);
    const rayStep = cw / numRays;
    const px = player.x + 16;
    const py = player.y + EYE_Y;

    ctx.fillStyle = "#4a9ae8";
    ctx.fillRect(0, 0, cw, horizon);
    ctx.fillStyle = floorCol2;
    ctx.fillRect(0, horizon, cw, ch - horizon);

    for (let i = 0; i < numRays; i++) {
      const rayAng = player.angle - halfFov + (i / numRays) * FOV;
      const cos = Math.cos(rayAng);
      const sin = Math.sin(rayAng);
      let dist = MAX_DIST;
      for (let d = 4; d < 400; d += 4) {
        const x = px + cos * d;
        const y = py + sin * d;
        if (x < 8 || x > w - 8 || y < 40 || y > h - 8) {
          dist = d;
          break;
        }
      }
      const corr = dist * Math.cos(rayAng - player.angle);
      const wallH = Math.min(ch * 1.4, (WALL_H * ch) / Math.max(corr, 8));
      const x = i * rayStep;
      const y0 = horizon - wallH * 0.5;
      const shade = Math.max(0.4, 1 - corr / 400);
      const r = parseInt(wallCol.slice(1, 3), 16) * shade | 0;
      const g = parseInt(wallCol.slice(3, 5), 16) * shade | 0;
      const b = parseInt(wallCol.slice(5, 7), 16) * shade | 0;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y0, rayStep + 1, ch - y0);
    }

    const sprites = collectSprites(world, player, px, py);
    for (const sp of sprites) drawBillboard(ctx, sp, player, cw, ch, t);

    drawHands(ctx, cw, ch, tool, player.attacking, t);
    drawCrosshair(ctx, cw, ch);
  }

  function render(ctx, player, world, t, cw, ch, tool) {
    if (world.inside) renderInterior(ctx, player, world, t, cw, ch, tool);
    else renderOutdoor(ctx, player, world, t, cw, ch, tool);
  }

  return { render, eye, FOV };
})();
