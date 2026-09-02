/* Vue première personne — échelle alignée sur le monde 2D (32×40 perso, bâtiments Places) */
const FPSView = (() => {
  const FOV = Math.PI / 2.45;
  const MAX_DIST = 560;
  const EYE_OFF = 18;
  const FEET_OFF = 36;
  const CAM_H = 14;
  const PROP_H = { palm: 52, bush: 22, rock: 16 };

  function eye(p) {
    return { x: p.x + 16, y: p.y + EYE_OFF };
  }

  function raySegHit(ox, oy, cos, sin, seg) {
    const rdx = cos;
    const rdy = sin;
    const sdx = seg.bx - seg.ax;
    const sdy = seg.by - seg.ay;
    const denom = rdx * sdy - rdy * sdx;
    if (Math.abs(denom) < 1e-8) return null;
    const t = ((seg.ax - ox) * sdy - (seg.ay - oy) * sdx) / denom;
    const u = ((seg.ax - ox) * rdy - (seg.ay - oy) * rdx) / denom;
    if (t > 0.8 && t < MAX_DIST && u >= 0 && u <= 1) {
      return { dist: t, h: seg.h, color: seg.color, kind: seg.kind || "wall" };
    }
    return null;
  }

  function castRay(ox, oy, ang, segs) {
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    let best = null;
    for (let i = 0; i < segs.length; i++) {
      const hit = raySegHit(ox, oy, cos, sin, segs[i]);
      if (hit && (!best || hit.dist < best.dist)) best = hit;
    }
    for (let d = 6; d < MAX_DIST; d += 5) {
      const x = ox + cos * d;
      const y = oy + sin * d;
      const onLand = Island.contains(x, y);
      if (!onLand) {
        break;
      }
      const props = Island.props();
      for (let i = 0; i < props.length; i++) {
        const pr = props[i];
        const px = pr.x + 8;
        const py = pr.y + (pr.kind === "palm" ? 24 : 12);
        const r = pr.kind === "palm" ? 7 : pr.kind === "bush" ? 9 : 8;
        if (Math.hypot(x - px, y - py) < r) {
          const hit = {
            dist: d,
            h: PROP_H[pr.kind] || 20,
            color: pr.kind === "palm" ? "#2a8a28" : pr.kind === "bush" ? "#3cbc3c" : "#808890",
            kind: "prop",
          };
          if (!best || hit.dist < best.dist) best = hit;
          break;
        }
      }
    }
    return best || { dist: MAX_DIST, h: 0, color: null, kind: "open" };
  }

  function floorCol(tile, wx, wy) {
    const C = Atlas.C;
    if (tile === 0) return "#1a6bb5";
    if (tile === 6) {
      const stripe = (((wx / 10) | 0) + ((wy / 10) | 0)) % 2;
      if (stripe === 0) return C.road || "#3a3c48";
      const center = Math.abs(((wx + wy) / 14) % 2 - 1) < 0.15;
      return center ? (C.roadY || "#fcbc14") : (C.roadD || "#24262e");
    }
    if (tile === 1 || tile === 3) return C.sandB || "#f0cc84";
    if (tile === 2) return C.green || "#3cbc3c";
    if (tile === 4 || tile === 5) return C.cobbleA || "#c4a878";
    if (tile === 8) return C.stone || "#808890";
    if (tile === 7) return C.sandC || "#d4a85c";
    if (tile === 9) return C.sandA || "#ffe8b0";
    return C.sandB || "#e8c878";
  }

  function shadeRgb(hex, shade) {
    const r = parseInt(hex.slice(1, 3), 16) * shade | 0;
    const g = parseInt(hex.slice(3, 5), 16) * shade | 0;
    const b = parseInt(hex.slice(5, 7), 16) * shade | 0;
    return `rgb(${r},${g},${b})`;
  }

  function projectH(worldH, dist, ch) {
    const d = Math.max(dist, 36);
    return Math.min(ch * 0.68, (worldH * ch * 0.48) / d);
  }

  function collectSprites(world, player, px, py) {
    const list = [];
    const range = 300;
    const push = (x, y, w, h, kind, ref) => {
      const dx = x - px;
      const dy = y - py;
      const dist = Math.hypot(dx, dy);
      if (dist < 5 || dist > range) return;
      list.push({ x, y, w, h, kind, ref, dist, ang: Math.atan2(dy, dx) });
    };

    for (const tr of World.living(world)) push(tr.x + 8, tr.y + 14, 16, 16, "trash", tr);
    for (const r of World.livingRares(world)) push(r.x + 8, r.y + 14, 16, 16, "rare", r);
    for (const b of world.bins || [world.bin]) {
      if (b) push(b.x + 10, b.y + 18, 20, 28, "bin", b);
    }
    for (const n of world.npcs || []) {
      if (n.dead) continue;
      if (!world.inside && n.indoor) continue;
      if (world.inside && !n.indoor) continue;
      push(n.x + 16, n.y + 36, 32, 40, "npc", n);
    }
    if (!world.inside) {
      for (const car of world.cars || []) push(car.px, car.py + 8, 48, 24, "car", car);
    }
    return list.sort((a, b) => b.dist - a.dist);
  }

  function drawBillboard(ctx, sp, player, cw, ch, horizon, t) {
    let rel = sp.ang - player.angle;
    while (rel > Math.PI) rel -= Math.PI * 2;
    while (rel < -Math.PI) rel += Math.PI * 2;
    if (Math.abs(rel) > FOV * 0.58) return;

    const dist = Math.max(sp.dist * Math.cos(rel), 10);
    const sx = (rel / (FOV * 0.5)) * (cw * 0.5) + cw * 0.5;
    const sh = projectH(sp.h, dist, ch);
    const sw = projectH(sp.w, dist, ch);
    const sy = horizon;

    ctx.save();
    ctx.translate(sx, sy);
    const sc = sw / Math.max(sp.w, 1);
    ctx.scale(sc, sc);

    if (sp.kind === "trash" || sp.kind === "rare") {
      const tr = sp.ref;
      const col = tr.kind === "can" ? "#c8c8c8" : tr.kind === "bag" ? "#8a6840" : "#4a9ae8";
      ctx.fillStyle = col;
      ctx.fillRect(-sp.w * 0.5, -sp.h, sp.w, sp.h);
    } else if (sp.kind === "bin") {
      ctx.fillStyle = "#2a8a3a";
      ctx.fillRect(-10, -28, 20, 28);
      ctx.fillStyle = "#1a5a28";
      ctx.fillRect(-8, -32, 16, 6);
    } else if (sp.kind === "npc") {
      const n = sp.ref;
      const face = (n.facing || 1) >= 0 ? 1 : -1;
      ctx.fillStyle = "#f0c8a0";
      ctx.fillRect(-5, -38, 10, 10);
      ctx.fillStyle = n.job === "fish" ? "#4a7ab8" : "#c83848";
      ctx.fillRect(-8, -28, 16, 16);
      ctx.fillStyle = "#303030";
      ctx.fillRect(-3 * face, -36, 2, 2);
      if (n.qRole && typeof Quests !== "undefined" && Quests.mark(n)) {
        ctx.fillStyle = "#fcbc14";
        ctx.fillRect(-2, -46 + Math.sin(t * 6) * 2, 4, 6);
      }
    } else if (sp.kind === "car") {
      const car = sp.ref;
      const img = Atlas.frames[car.sprite] || Atlas.frames.carTaxi || Atlas.frames.carBlue;
      if (img) {
        const flip = (car.facing || 1) < 0;
        if (flip) {
          ctx.scale(-1, 1);
          ctx.drawImage(img, -24, -24, 48, 24);
        } else {
          ctx.drawImage(img, -24, -24, 48, 24);
        }
      } else {
        ctx.fillStyle = car.taxi ? "#f0c020" : "#d03030";
        ctx.fillRect(-24, -24, 48, 24);
      }
      if (car.taxi && Math.sin(t * 9) > 0) {
        ctx.fillStyle = "#fff46c";
        ctx.fillRect(-3, -28, 6, 3);
      }
    }
    ctx.restore();
  }

  function drawHands(ctx, cw, ch, tool, attacking, t) {
    const bob = attacking ? Math.sin(t * 24) * 3 : Math.sin(t * 10) * 1.5;
    const baseY = ch - 2;
    ctx.save();
    if (tool === "balai") {
      ctx.fillStyle = "#6a5030";
      ctx.fillRect(cw * 0.56, baseY - 88 + bob, 8, 88);
      ctx.fillStyle = "#d8c8a0";
      ctx.fillRect(cw * 0.50, baseY - 96 + bob, 22, 12);
      ctx.fillStyle = "#f0c8a0";
      ctx.fillRect(cw * 0.40, baseY - 28 + bob, 20, 28);
    } else {
      ctx.fillStyle = "#f0c8a0";
      ctx.fillRect(cw * 0.30, baseY - 34 + bob, 24, 34);
      ctx.fillStyle = "#c83848";
      ctx.fillRect(cw * 0.48, baseY - 50 + bob, 38, 14);
      ctx.fillStyle = "#888";
      ctx.fillRect(cw * 0.66, baseY - 54 + bob, 28, 6);
      ctx.fillStyle = "#aaa";
      ctx.fillRect(cw * 0.82, baseY - 66 + bob, 6, 18);
      ctx.fillRect(cw * 0.89, baseY - 60 + bob, 6, 12);
    }
    ctx.restore();
  }

  function drawScene(ctx, player, world, t, cw, ch, tool, segs) {
    const e = eye(player);
    const pitch = player.pitch || 0;
    const horizon = ch * 0.46 + pitch * ch * 0.18;
    const halfFov = FOV * 0.5;
    const numRays = Math.min(cw | 0, 280);
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
      const hit = castRay(e.x, e.y, rayAng, segs);
      const dist = Math.max(hit.dist * Math.cos(rayAng - player.angle), 8);
      zbuf[i] = dist;
      if (hit.kind === "open") continue;

      const wallH = projectH(hit.h || 40, dist, ch);
      const x = i * rayStep;
      const yTop = horizon - wallH;
      const shade = Math.max(0.3, 1 - dist / MAX_DIST);
      ctx.fillStyle = shadeRgb(hit.color || "#888888", shade);
      ctx.fillRect(x, yTop, rayStep + 1, wallH + 1);
    }

    const floorMul = (CAM_H * ch * 0.92) / FOV;
    for (let row = (horizon + 1) | 0; row < ch; row += 2) {
      const p = row - horizon;
      if (p < 1) continue;
      const rowDist = floorMul / p;
      for (let i = 0; i < numRays; i++) {
        if (rowDist >= zbuf[i]) continue;
        const rayAng = player.angle - halfFov + (i / numRays) * FOV;
        const wx = e.x + Math.cos(rayAng) * rowDist;
        const wy = e.y + Math.sin(rayAng) * rowDist;
        const tile = Island.tileAt(wx, wy);
        const shade = Math.max(0.42, 1 - rowDist / MAX_DIST);
        ctx.fillStyle = shadeRgb(floorCol(tile, wx, wy), shade);
        ctx.fillRect(i * rayStep, row, rayStep + 1, 2);
      }
    }

    const sprites = collectSprites(world, player, e.x, e.y);
    for (const sp of sprites) drawBillboard(ctx, sp, player, cw, ch, horizon, t);

    if (player.swim) {
      ctx.fillStyle = "rgba(26,107,181,0.28)";
      ctx.fillRect(0, horizon, cw, ch - horizon);
    }

    drawHands(ctx, cw, ch, tool, player.attacking, t);

    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 1;
    const cx = cw * 0.5;
    const cy = ch * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();
  }

  function render(ctx, player, world, t, cw, ch, tool) {
    if (world.inside) {
      const inside = world.inside;
      drawScene(ctx, player, world, t, cw, ch, tool, Places.interiorWallSegments(inside.w, inside.h, inside.room));
    } else {
      drawScene(ctx, player, world, t, cw, ch, tool, Places.wallSegments());
    }
  }

  return { render, eye, FOV, EYE_OFF, FEET_OFF, CAM_H };
})();
