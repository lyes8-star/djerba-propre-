/* Moteur eau — vagues Gerstner, hauteur dynamique */
const WaterEngine = (() => {
  const WAVES = [
    { dir: [1, 0.3], amp: 1.8, len: 42, spd: 1.1 },
    { dir: [0.6, 1], amp: 1.2, len: 28, spd: 1.6 },
    { dir: [-0.4, 0.8], amp: 0.9, len: 18, spd: 2.2 },
  ];

  function gerstner(x, y, t) {
    let h = -5.5;
    let nx = 0;
    let ny = 0;
    for (const w of WAVES) {
      const k = (Math.PI * 2) / w.len;
      const dot = x * w.dir[0] + y * w.dir[1];
      const phase = k * dot + t * w.spd;
      const s = Math.sin(phase);
      h += w.amp * s;
      nx -= w.dir[0] * k * w.amp * Math.cos(phase);
      ny -= w.dir[1] * k * w.amp * Math.cos(phase);
    }
    return { height: h, nx, ny };
  }

  function sample(wx, wy, t) {
    return gerstner(wx, wy, t || 0);
  }

  function vertexShader() {
    return [
      "uniform float uTime;",
      "varying vec3 vWorldPos;",
      "varying vec3 vNormal;",
      "varying float vFoam;",
      "void main() {",
      "  vec3 pos = position;",
      "  float wx = pos.x; float wz = pos.z;",
      "  float h = 0.0; vec3 n = vec3(0.0, 1.0, 0.0);",
      "  float k1=0.15,a1=1.8,s1=sin(k1*(wx+wz*0.3)+uTime*1.1);",
      "  float k2=0.22,a2=1.1,s2=sin(k2*(wx*0.6+wz)+uTime*1.6);",
      "  float k3=0.35,a3=0.7,s3=sin(k3*(wx*-0.4+wz*0.8)+uTime*2.2);",
      "  h=a1*s1+a2*s2+a3*s3;",
      "  float dx=a1*k1*cos(k1*(wx+wz*0.3)+uTime*1.1)+a2*k2*cos(k2*(wx*0.6+wz)+uTime*1.6)*0.6;",
      "  float dz=a1*k1*cos(k1*(wx+wz*0.3)+uTime*1.1)*0.3+a2*k2*cos(k2*(wx*0.6+wz)+uTime*1.6);",
      "  n=normalize(vec3(-dx,1.0,-dz)); pos.y+=h;",
      "  vWorldPos=(modelMatrix*vec4(pos,1.0)).xyz;",
      "  vNormal=normalize(normalMatrix*n); vFoam=smoothstep(0.2,1.6,h+0.4);",
      "  gl_Position=projectionMatrix*modelViewMatrix*vec4(pos,1.0);",
      "}",
    ].join("\n");
  }

  function fragmentShader() {
    return [
      "uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFoam;",
      "uniform vec3 uSunDir; uniform float uDay;",
      "varying vec3 vWorldPos; varying vec3 vNormal; varying float vFoam;",
      "void main() {",
      "  vec3 viewDir=normalize(cameraPosition-vWorldPos);",
      "  vec3 n=normalize(vNormal);",
      "  float fresnel=pow(1.0-max(dot(viewDir,n),0.0),2.2);",
      "  vec3 base=mix(uShallow,uDeep,0.35+fresnel*0.45);",
      "  float spec=pow(max(dot(reflect(-uSunDir,n),viewDir),0.0),48.0);",
      "  vec3 col=base+vec3(spec)*(0.35+uDay*0.4);",
      "  col=mix(col,uFoam,vFoam*0.35); col*=0.75+uDay*0.35;",
      "  gl_FragColor=vec4(col,0.86);",
      "}",
    ].join("\n");
  }

  function createMaterial(sunDir, dayFactor) {
    if (typeof THREE === "undefined") return null;
    const uniforms = {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x0a5a9a) },
      uShallow: { value: new THREE.Color(0x2ab0e8) },
      uFoam: { value: new THREE.Color(0xe8f8ff) },
      uSunDir: { value: sunDir || new THREE.Vector3(0.4, 0.8, 0.3) },
      uDay: { value: dayFactor != null ? dayFactor : 1 },
    };
    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertexShader(),
      fragmentShader: fragmentShader(),
      transparent: true,
      side: THREE.DoubleSide,
    });
  }

  function tick(material, t, sunDir, dayFactor) {
    if (!material || !material.uniforms) return;
    material.uniforms.uTime.value = t;
    if (sunDir) material.uniforms.uSunDir.value.copy(sunDir);
    if (dayFactor != null) material.uniforms.uDay.value = dayFactor;
  }

  return { sample, createMaterial, tick, gerstner };
})();
