/* ==========================================================================
   three-bg.js
   A subtle animated "constellation" of connected nodes drifting slowly in
   3D space, rendered with Three.js on a fixed full-screen canvas that sits
   behind all page content. Mouse movement gently parallaxes the camera.
   Colors are driven by the site's blue/purple gradient theme.
   ========================================================================== */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  let width = window.innerWidth;
  let height = window.innerHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
  camera.position.z = 60;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  /* ---- Nodes ---- */
  const NODE_COUNT = window.innerWidth < 768 ? 45 : 90;
  const SPREAD = 90;
  const nodes = [];

  const nodeGeometry = new THREE.SphereGeometry(0.45, 8, 8);
  const nodeMaterialBlue = new THREE.MeshBasicMaterial({ color: 0x4f7cff, transparent: true, opacity: 0.85 });
  const nodeMaterialPurple = new THREE.MeshBasicMaterial({ color: 0x9b5cff, transparent: true, opacity: 0.85 });

  const nodeGroup = new THREE.Group();
  scene.add(nodeGroup);

  for (let i = 0; i < NODE_COUNT; i++) {
    const mat = i % 2 === 0 ? nodeMaterialBlue : nodeMaterialPurple;
    const mesh = new THREE.Mesh(nodeGeometry, mat);
    mesh.position.set(
      (Math.random() - 0.5) * SPREAD * 2,
      (Math.random() - 0.5) * SPREAD * 1.2,
      (Math.random() - 0.5) * SPREAD
    );
    mesh.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    );
    nodeGroup.add(mesh);
    nodes.push(mesh);
  }

  /* ---- Connections between nearby nodes ---- */
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x6f8cff, transparent: true, opacity: 0.15 });
  const MAX_DIST = 22;
  let lineSegments;

  function buildLines() {
    if (lineSegments) {
      nodeGroup.remove(lineSegments);
      lineSegments.geometry.dispose();
    }
    const positions = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].position.distanceTo(nodes[j].position);
        if (d < MAX_DIST) {
          positions.push(nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
          positions.push(nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    lineSegments = new THREE.LineSegments(geometry, lineMaterial);
    nodeGroup.add(lineSegments);
  }

  buildLines();
  let frameCount = 0;

  /* ---- Mouse parallax ---- */
  let mouseX = 0, mouseY = 0;
  let targetRotX = 0, targetRotY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / width) * 2 - 1;
    mouseY = (e.clientY / height) * 2 - 1;
  });

  /* ---- Resize ---- */
  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });

  /* ---- Animate ---- */
  function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    nodes.forEach((mesh) => {
      mesh.position.add(mesh.userData.velocity);
      // Bounce within bounds
      if (Math.abs(mesh.position.x) > SPREAD) mesh.userData.velocity.x *= -1;
      if (Math.abs(mesh.position.y) > SPREAD * 0.7) mesh.userData.velocity.y *= -1;
      if (Math.abs(mesh.position.z) > SPREAD) mesh.userData.velocity.z *= -1;
    });

    // Rebuild connecting lines periodically (perf-friendly)
    if (frameCount % 4 === 0) buildLines();

    targetRotY += (mouseX * 0.15 - targetRotY) * 0.03;
    targetRotX += (mouseY * 0.1 - targetRotX) * 0.03;
    nodeGroup.rotation.y = targetRotY + Math.sin(frameCount * 0.0015) * 0.1;
    nodeGroup.rotation.x = targetRotX;

    renderer.render(scene, camera);
  }

  animate();
})();
