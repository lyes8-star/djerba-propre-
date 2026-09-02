/* Personnages 3D articulés — pas de bonhommes bâton */
const Characters3D = (() => {
  const SKIN = 0xf0c8a0;
  const SKIN_D = 0xd49868;

  const STYLES = {
    player: { shirt: 0x48b868, pants: 0x2a4a8a, shoes: 0x303030, hair: 0x2a2018 },
    merchM: { shirt: 0xd87848, pants: 0x4a3828, shoes: 0x282018, hair: 0x181008 },
    merchF: { shirt: 0xe878a8, pants: 0x584838, shoes: 0x302820, hair: 0x281810 },
    localM: { shirt: 0x48a8e8, pants: 0x384858, shoes: 0x282830, hair: 0x201810 },
    localF: { shirt: 0xa878d8, pants: 0x484050, shoes: 0x302828, hair: 0x181008 },
    tourM: { shirt: 0xf0a848, pants: 0x586878, shoes: 0x383840, hair: 0x302818 },
    tourF: { shirt: 0xe878a8, pants: 0x506070, shoes: 0x383038, hair: 0xd8a060 },
    fisher: { shirt: 0x3898c8, pants: 0x2a3848, shoes: 0x202028, hair: 0x181008 },
    elder: { shirt: 0xf0d848, pants: 0x484038, shoes: 0x282018, hair: 0x908070 },
    kidM: { shirt: 0xf0a848, pants: 0x4868a8, shoes: 0x303030, hair: 0x201008 },
    cafe: { shirt: 0xd87848, pants: 0x383028, shoes: 0x282018, hair: 0x181008 },
    default: { shirt: 0x88a8c8, pants: 0x404858, shoes: 0x282830, hair: 0x201810 },
  };

  function part(geo, mat, x, y, z, rx, ry, rz) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    if (rx) m.rotation.x = rx;
    if (ry) m.rotation.y = ry;
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    return m;
  }

  function stdMat(color, opts) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: opts && opts.rough ? 0.88 : 0.72,
      metalness: 0.02,
      flatShading: false,
    });
  }

  function build(styleKey, opts) {
    const st = STYLES[styleKey] || STYLES.default;
    const g = new THREE.Group();
    g.userData.bones = {};

    const skinM = stdMat(SKIN);
    const skinDM = stdMat(SKIN_D);
    const shirtM = stdMat(st.shirt);
    const pantsM = stdMat(st.pants);
    const shoeM = stdMat(st.shoes, { rough: true });
    const hairM = stdMat(st.hair);

    const pelvis = part(new THREE.BoxGeometry(10, 5, 7), pantsM, 0, 9, 0);
    g.add(pelvis);
    g.userData.bones.pelvis = pelvis;

    const torso = part(new THREE.BoxGeometry(11, 10, 6.5), shirtM, 0, 17, 0);
    g.add(torso);
    g.userData.bones.torso = torso;

    const head = part(new THREE.SphereGeometry(4.8, 10, 8), skinM, 0, 26, 0);
    g.add(head);
    g.userData.bones.head = head;

    const hair = part(new THREE.BoxGeometry(10, 3, 9), hairM, 0, 29.5, 0);
    g.add(hair);

    const armGeo = new THREE.BoxGeometry(3.2, 9, 3.2);
    const legGeo = new THREE.BoxGeometry(4.2, 10, 4.2);
    const foreGeo = new THREE.BoxGeometry(2.8, 8, 2.8);
    const handGeo = new THREE.SphereGeometry(2.2, 6, 5);

    const lUpper = part(armGeo, shirtM, -7.5, 18, 0);
    const lFore = part(foreGeo, skinM, -7.5, 10, 0);
    const lHand = part(handGeo, skinDM, -7.5, 5.5, 0);
    const rUpper = part(armGeo, shirtM, 7.5, 18, 0);
    const rFore = part(foreGeo, skinM, 7.5, 10, 0);
    const rHand = part(handGeo, skinDM, 7.5, 5.5, 0);
    g.add(lUpper, lFore, lHand, rUpper, rFore, rHand);
    g.userData.bones.lUpper = lUpper;
    g.userData.bones.lFore = lFore;
    g.userData.bones.rUpper = rUpper;
    g.userData.bones.rFore = rFore;
    g.userData.bones.rHand = rHand;

    const lThigh = part(legGeo, pantsM, -3.2, 4, 0);
    const lShin = part(legGeo, pantsM, -3.2, -5, 0);
    const lFoot = part(new THREE.BoxGeometry(4.5, 2.5, 7), shoeM, -3.2, -11, 1.5);
    const rThigh = part(legGeo, pantsM, 3.2, 4, 0);
    const rShin = part(legGeo, pantsM, 3.2, -5, 0);
    const rFoot = part(new THREE.BoxGeometry(4.5, 2.5, 7), shoeM, 3.2, -11, 1.5);
    g.add(lThigh, lShin, lFoot, rThigh, rShin, rFoot);
    g.userData.bones.lThigh = lThigh;
    g.userData.bones.lShin = lShin;
    g.userData.bones.rThigh = rThigh;
    g.userData.bones.rShin = rShin;

    if (opts && opts.hat) {
      const hat = part(new THREE.BoxGeometry(10, 2, 10), stdMat(opts.gold ? 0xffd24a : 0x2db84a), 0, 31, 0);
      hat.name = "hat";
      g.add(hat);
    }

    if (opts && opts.tool) {
      const tool = part(new THREE.BoxGeometry(1.5, 12, 1.5), stdMat(0x888888), 9, 14, 4);
      tool.name = "tool";
      g.add(tool);
      g.userData.bones.tool = tool;
    }

    if (opts && opts.quest) {
      const mark = part(new THREE.SphereGeometry(2.8, 6, 5), stdMat(0xffd24a, { emissive: true }), 0, 33, 0);
      mark.name = "questMark";
      mark.material.emissive = new THREE.Color(0xffd24a);
      mark.material.emissiveIntensity = 0.4;
      g.add(mark);
    }

    g.userData.anim = { phase: 0, state: "idle" };
    return g;
  }

  function animate(g, state, phase, facing, attacking) {
    if (!g || !g.userData.bones) return;
    const b = g.userData.bones;
    const s = Math.sin(phase);
    const c = Math.cos(phase);
    g.rotation.y = facing < 0 ? Math.PI : 0;

    if (state === "swim") {
      if (b.torso) b.torso.rotation.x = 0.9;
      if (b.lUpper) { b.lUpper.rotation.x = s * 0.8; b.lUpper.rotation.z = -0.4; }
      if (b.rUpper) { b.rUpper.rotation.x = -s * 0.8; b.rUpper.rotation.z = 0.4; }
      if (b.lFore) b.lFore.rotation.x = 0.3;
      if (b.rFore) b.rFore.rotation.x = 0.3;
      if (b.lThigh) b.lThigh.rotation.x = s * 0.35;
      if (b.rThigh) b.rThigh.rotation.x = -s * 0.35;
      return;
    }

    if (b.torso) b.torso.rotation.x = attacking ? -0.15 : s * 0.04;
    const walk = state === "walk" ? 1 : 0;
    if (b.lThigh) b.lThigh.rotation.x = s * 0.55 * walk;
    if (b.rThigh) b.rThigh.rotation.x = -s * 0.55 * walk;
    if (b.lShin) b.lShin.rotation.x = Math.max(0, -s) * 0.45 * walk;
    if (b.rShin) b.rShin.rotation.x = Math.max(0, s) * 0.45 * walk;
    if (b.lUpper) b.lUpper.rotation.x = -s * 0.35 * walk;
    if (b.rUpper) b.rUpper.rotation.x = s * 0.35 * walk;
    if (b.lFore) b.lFore.rotation.x = -0.2 - Math.max(0, c) * 0.2 * walk;
    if (b.rFore) b.rFore.rotation.x = -0.2 - Math.max(0, -c) * 0.2 * walk;

    if (attacking && b.rUpper && b.rFore) {
      b.rUpper.rotation.x = -1.1;
      b.rFore.rotation.x = -0.6;
      if (b.tool) {
        b.tool.rotation.x = -0.8;
        b.tool.visible = true;
      }
    } else if (b.tool) {
      b.tool.visible = false;
    }
  }

  function npcStyle(n) {
    if (!n) return "default";
    if (n.style) return n.style;
    return "localM";
  }

  return { build, animate, npcStyle, STYLES };
})();
