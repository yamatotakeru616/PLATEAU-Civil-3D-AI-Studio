import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AlignmentProject, AgentProposal, PlateauFeature } from '../types/civil';
import { Eye, Box, Compass, Layers, AlertCircle } from 'lucide-react';

interface Viewport3DProps {
  project: AlignmentProject;
  proposals: AgentProposal[];
  selectedIpId: string | null;
  onSelectIp: (id: string) => void;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  project,
  proposals,
  selectedIpId,
  onSelectIp,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [showPlateau, setShowPlateau] = useState(true);
  const [showRedlines, setShowRedlines] = useState(true);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0d); // Dark CAD Background
    scene.fog = new THREE.FogExp2(0x0a0a0d, 0.0008);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 3000);
    camera.position.set(500, 350, 650);
    camera.lookAt(500, 20, 250);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(400, 600, 300);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(2000, 50, 0x00a2ed, 0x222228);
    gridHelper.position.set(500, 0, 250);
    scene.add(gridHelper);

    // 5. Terrain DEM Mesh
    const terrainGeo = new THREE.PlaneGeometry(1400, 900, 60, 40);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = Math.sin(x / 120) * 8 + Math.cos(z / 90) * 12 + 10;
      pos.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      wireframe: wireframeMode,
      roughness: 0.9,
      metalness: 0.1,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.set(500, 0, 250);
    scene.add(terrainMesh);

    // 6. PLATEAU 3D Multi-Layer Features (bldg, tran, wtr, rwy)
    if (showPlateau) {
      const features = project.plateauFeatures && project.plateauFeatures.length > 0
        ? project.plateauFeatures
        : project.plateauBuildings.map((b): PlateauFeature => ({
            id: b.id,
            name: b.name,
            category: 'bldg',
            categoryLabel: '建物 (bldg)',
            lod: 'LOD2',
            x: b.x,
            y: b.y,
            z: 0,
            width: b.width,
            length: b.length,
            height: b.height,
            severity: b.severity,
            clashDetected: b.clashDetected,
          }));

      features.forEach((ft) => {
        const isCritical = ft.severity === 'critical';
        const isMajor = ft.severity === 'major';
        const zPos = ft.z || 0;

        if (ft.category === 'bldg') {
          // Building (bldg) LOD1/LOD2
          const bldGeo = new THREE.BoxGeometry(ft.width, ft.height, ft.length);
          const bldMat = new THREE.MeshStandardMaterial({
            color: isCritical ? 0xef4444 : isMajor ? 0xf59e0b : 0x3b82f6,
            transparent: true,
            opacity: 0.75,
            wireframe: wireframeMode,
          });
          const bldMesh = new THREE.Mesh(bldGeo, bldMat);
          bldMesh.position.set(ft.x, ft.height / 2 + zPos, ft.y);
          bldMesh.castShadow = true;
          scene.add(bldMesh);

          // Wireframe Edge Outlines
          const edges = new THREE.EdgesGeometry(bldGeo);
          const lineMat = new THREE.LineBasicMaterial({
            color: isCritical ? 0xff0055 : 0x00a2ed,
          });
          const line = new THREE.LineSegments(edges, lineMat);
          line.position.copy(bldMesh.position);
          scene.add(line);
        } else if (ft.category === 'tran') {
          // Road Infrastructure (tran)
          const tranGeo = new THREE.BoxGeometry(ft.width, ft.height, ft.length);
          const tranMat = new THREE.MeshStandardMaterial({
            color: ft.color ? parseInt(ft.color.replace('#', '0x')) : 0x64748b,
            roughness: 0.6,
            transparent: ft.z !== undefined && ft.z < 0,
            opacity: ft.z !== undefined && ft.z < 0 ? 0.6 : 0.9,
            wireframe: wireframeMode,
          });
          const tranMesh = new THREE.Mesh(tranGeo, tranMat);
          tranMesh.position.set(ft.x, ft.height / 2 + zPos, ft.y);
          scene.add(tranMesh);
        } else if (ft.category === 'wtr') {
          // Waterway (wtr) - Transparent Blue Water Body
          const wtrGeo = new THREE.BoxGeometry(ft.width, ft.height, ft.length);
          const wtrMat = new THREE.MeshStandardMaterial({
            color: 0x0284c7,
            roughness: 0.1,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8,
            wireframe: wireframeMode,
          });
          const wtrMesh = new THREE.Mesh(wtrGeo, wtrMat);
          wtrMesh.position.set(ft.x, ft.height / 2 + zPos, ft.y);
          scene.add(wtrMesh);
        } else if (ft.category === 'rwy') {
          // Railway & Subway (rwy) - Infra Tunnel or Elevated Viaduct
          const rwyGeo = new THREE.BoxGeometry(ft.width, ft.height, ft.length);
          const rwyMat = new THREE.MeshStandardMaterial({
            color: ft.color ? parseInt(ft.color.replace('#', '0x')) : 0x06b6d4,
            transparent: true,
            opacity: 0.8,
            wireframe: true, // Subway/Railway wireframe structure
          });
          const rwyMesh = new THREE.Mesh(rwyGeo, rwyMat);
          rwyMesh.position.set(ft.x, ft.height / 2 + zPos, ft.y);
          scene.add(rwyMesh);
        }
      });
    }

    // 7. 3D Road Alignment Corridor Ribbon
    const curvePoints: THREE.Vector3[] = project.ipPoints.map(
      (ip) => new THREE.Vector3(ip.x, ip.elevation + 2, ip.y)
    );
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 100, 8, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x00a2ed,
      roughness: 0.3,
      metalness: 0.7,
      wireframe: wireframeMode,
    });
    const roadMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(roadMesh);

    // IP Point Spheres
    project.ipPoints.forEach((ip) => {
      const isSelected = ip.id === selectedIpId;
      const sphereGeo = new THREE.SphereGeometry(isSelected ? 10 : 6, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xffea00 : 0x00a2ed,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.set(ip.x, ip.elevation + 4, ip.y);
      scene.add(sphere);
    });

    // 8. Dashed Vermillion Redline Overlays from AI Agents
    if (showRedlines) {
      proposals.forEach((prop) => {
        if (prop.dashedAnnotation) {
          const { coordinates, color } = prop.dashedAnnotation;
          coordinates.forEach((coord) => {
            // Create pulsing dashed ring overlay
            const ringGeo = new THREE.RingGeometry(20, 24, 32);
            ringGeo.rotateX(-Math.PI / 2);
            const ringMat = new THREE.MeshBasicMaterial({
              color: color || 0xff0033,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.8,
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.set(coord.x, (coord.z || 15) + 1, coord.y);
            scene.add(ringMesh);
          });
        }
      });
    }

    // Orbit & Pan Controls Simulation
    let isDragging = false;
    let dragMode: 'orbit' | 'pan' = 'orbit';
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      dragMode = e.button === 1 || e.button === 2 ? 'pan' : 'orbit';
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      if (dragMode === 'pan') {
        // Pan parallel to view plane
        camera.position.x -= deltaX * 0.6;
        camera.position.y += deltaY * 0.6;
      } else {
        // Orbit rotation
        camera.position.x -= deltaX * 0.8;
        camera.position.z += deltaY * 0.8;
      }
      camera.lookAt(500, 20, 250);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
      camera.position.x = 500 + (camera.position.x - 500) * zoomFactor;
      camera.position.y = 20 + (camera.position.y - 20) * zoomFactor;
      camera.position.z = 250 + (camera.position.z - 250) * zoomFactor;
      camera.lookAt(500, 20, 250);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', handleMouseDown);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [project, proposals, wireframeMode, showPlateau, showRedlines, selectedIpId]);

  return (
    <div className="relative w-full h-full bg-[#0a0a0d] overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Right ViewCube Widget */}
      <div className="absolute top-4 right-4 w-24 h-24 border border-[#444] bg-[#1a1c1e]/85 backdrop-blur flex flex-col items-center justify-center rounded shadow-lg z-10 text-gray-300 pointer-events-none">
        <div className="text-[10px] text-center font-mono">
          <div className="font-bold border-b border-[#444] pb-1 mb-1 text-[#00a2ed]">3D VIEW</div>
          <div className="opacity-70 uppercase text-[9px]">Perspective</div>
          <div className="text-[8px] text-emerald-400 mt-0.5">LOD2 Render</div>
        </div>
      </div>

      {/* Viewport Control Buttons */}
      <div className="absolute top-4 left-4 flex gap-2 z-10 font-mono text-xs">
        <button
          onClick={() => setWireframeMode(!wireframeMode)}
          className={`px-2.5 py-1.5 rounded border text-[11px] flex items-center gap-1.5 backdrop-blur transition-all ${
            wireframeMode
              ? 'bg-[#007acc] border-[#00a2ed] text-white font-bold'
              : 'bg-[#1a1c1e]/80 border-[#444] text-gray-300 hover:text-white'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          <span>{wireframeMode ? 'Wireframe' : 'Shaded'}</span>
        </button>

        <button
          onClick={() => setShowPlateau(!showPlateau)}
          className={`px-2.5 py-1.5 rounded border text-[11px] flex items-center gap-1.5 backdrop-blur transition-all ${
            showPlateau
              ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 font-bold'
              : 'bg-[#1a1c1e]/80 border-[#444] text-gray-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>PLATEAU 3D</span>
        </button>

        <button
          onClick={() => setShowRedlines(!showRedlines)}
          className={`px-2.5 py-1.5 rounded border text-[11px] flex items-center gap-1.5 backdrop-blur transition-all ${
            showRedlines
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 font-bold'
              : 'bg-[#1a1c1e]/80 border-[#444] text-gray-400'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>赤入れ Vermillion</span>
        </button>
      </div>

      {/* Coordinates overlay at bottom left */}
      <div className="absolute bottom-4 left-4 flex gap-2 font-mono text-[10px] z-10">
        <div className="px-2 py-1 bg-[#252526]/90 border border-[#444] text-gray-300 rounded shadow">
          X: 520,124.88 m
        </div>
        <div className="px-2 py-1 bg-[#252526]/90 border border-[#444] text-gray-300 rounded shadow">
          Y: 240,910.12 m
        </div>
        <div className="px-2 py-1 bg-[#252526]/90 border border-[#444] text-emerald-400 rounded shadow font-bold">
          Z: 18.20 m (DEM)
        </div>
      </div>
    </div>
  );
};
