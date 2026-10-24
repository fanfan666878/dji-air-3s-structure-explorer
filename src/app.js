import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ============================================================
   DJI Air 3S — Structure Explorer
   Every mesh in this scene is generated procedurally.
   ============================================================ */

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const isCompact = () => window.innerWidth <= 900;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ------------------------------------------------------------
   Icons
   ------------------------------------------------------------ */
const ICONS = {
  body: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.1"/><path d="M9.8 10.3 6.2 8M14.2 10.3 17.8 8M9.8 13.7 6.2 16M14.2 13.7 17.8 16"/><circle cx="5.2" cy="7.3" r="2"/><circle cx="18.8" cy="7.3" r="2"/><circle cx="5.2" cy="16.7" r="2"/><circle cx="18.8" cy="16.7" r="2"/></svg>`,
  gimbal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><rect x="3.7" y="5.2" width="16.6" height="10.6" rx="3"/><circle cx="9" cy="10.5" r="2.25"/><circle cx="15" cy="10.5" r="2.25"/><path d="M12 5.2V2.9M8.4 20h7.2M12 15.8V20"/></svg>`,
  vision: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 12s3.5-5.6 9.2-5.6 9.2 5.6 9.2 5.6-3.5 5.6-9.2 5.6S2.8 12 2.8 12Z"/><circle cx="12" cy="12" r="2.6"/><path d="M12 2.8v1.4M12 19.8v1.4M3.6 5.2l1 1M19.4 17.8l1 1M20.4 5.2l-1 1M4.6 17.8l-1 1"/></svg>`,
  battery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="15.6" height="10" rx="2.4"/><path d="M18.6 10.2h1.6a1.2 1.2 0 0 1 1.2 1.2v1.2a1.2 1.2 0 0 1-1.2 1.2h-1.6"/><path d="m11.3 9.3-2 3.3h2.9l-1.7 3.1"/><path d="M6.4 7V4.9M14.2 7V4.9"/></svg>`,
  frontArm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><circle cx="4.5" cy="19.5" r="2.2"/><path d="m6.2 18 5.1-5.1M11.3 12.9l3.2-3.2"/><circle cx="18.2" cy="6.5" r="3.2"/><path d="m17 2.7 1.2 2.2M21.3 5.2l-2.2 1.2"/><path d="M11 13.4 7.5 17"/></svg>`,
  rearArm: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><circle cx="4.5" cy="4.5" r="2.2"/><path d="m6.2 6 5.1 5.1M11.3 11.1l3.2 3.2"/><circle cx="18.2" cy="17.5" r="3.2"/><path d="m17 21.3 1.2-2.2M21.3 18.8l-2.2-1.2"/></svg>`,
  motor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6.6"/><circle cx="12" cy="12" r="2.5"/><path d="M12 5.4v2M12 16.6v2M5.4 12h2M16.6 12h2M7.3 7.3l1.4 1.4M15.3 15.3l1.4 1.4M16.7 7.3l-1.4 1.4M8.7 15.3l-1.4 1.4"/></svg>`,
  prop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.7"/><path d="M12 10.3c1.5-4 4.5-5.7 7.3-4.9 2.8.9 2.5 4.3-.5 6-2.5 1.4-5.1 1.2-6.8.6"/><path d="M10.7 13.1c-3.7 2.3-4.7 5.5-3.3 7.9 1.4 2.5 4.7 1.6 5.7-1.7.8-2.7 0-5.2-.9-6.7"/><path d="m19.3 5.4-2.1 2.1M7.2 17.7l2-2.1"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h16"/><path d="M7 4.5 5.6 15.3M17 4.5l1.4 10.8"/><path d="M3.4 18.8c0-1.9 1.2-3.5 2.8-3.5h.9c1.6 0 2.8 1.6 2.8 3.5"/><path d="M14.1 18.8c0-1.9 1.2-3.5 2.8-3.5h.9c1.6 0 2.8 1.6 2.8 3.5"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4"/></svg>`,
  collapse: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3 3 8l5 5M16 3l5 5-5 5M3 8h18M3 21h18"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.2h.01"/></svg>`,
};

/* ------------------------------------------------------------
   Component data
   ------------------------------------------------------------ */
const PART_DEFS = [
  {
    id: 'body',
    index: '01',
    group: 'structure',
    name: '一体化机身',
    en: 'Aerospace Fuselage',
    tagSpec: '724 g · 复合机身',
    icon: 'body',
    color: '#b9d3d8',
    desc: '轻量化承载式机身，以高强度复合材料与金属骨架构成。内部集成飞控、图传、天线与散热风道，外部曲面经过空气动力学优化，在 724 g 的整机重量下保持结构刚性。',
    specs: [
      ['结构材质', '镁铝合金骨架 + 复合纤维'],
      ['整机重量', '724 g'],
      ['折叠尺寸', '214.2 × 100.6 × 89.2 mm'],
      ['散热结构', '贯穿式导流风道'],
    ],
    tags: ['承载结构', '空气动力学', '模块化'],
    labelOffset: [0.0, 0.86, 0.0],
    explodeOffset: [0, 0, 0],
  },
  {
    id: 'gimbal',
    index: '02',
    group: 'imaging',
    name: '双摄云台',
    en: 'Dual-Camera Gimbal',
    tagSpec: '24 mm + 70 mm 双摄',
    icon: 'gimbal',
    color: '#5df2d6',
    desc: '三轴机械增稳云台同时搭载 1 英寸广角主摄与 1/1.3 英寸中长焦相机。双摄共享同一稳定平台，在 24 mm 与 70 mm 两个焦段之间无缝切换，并支持全像素相位对焦。',
    specs: [
      ['广角主摄', '1 英寸 CMOS · 24 mm · f/1.8'],
      ['中长焦', '1/1.3 英寸 · 70 mm · f/2.8'],
      ['稳定系统', '三轴机械增稳'],
      ['视频规格', '4K/60 HDR · 4K/120'],
      ['照片像素', '50 MP / 48 MP'],
    ],
    tags: ['三轴增稳', '双摄系统', 'HDR'],
    labelOffset: [0.0, 0.62, 0.24],
    explodeOffset: [0, -0.62, 2.28],
  },
  {
    id: 'vision',
    index: '03',
    group: 'imaging',
    name: '视觉感知阵列',
    en: 'Vision & LiDAR Array',
    tagSpec: '全向视觉 + LiDAR',
    icon: 'vision',
    color: '#4da8ff',
    desc: '全向视觉感知系统与前向激光雷达协同工作，在低光与夜间环境中构建环境深度图。配合下视与后视双目相机，实现全向障碍物感知、精准悬停与安全返航。',
    specs: [
      ['感知方案', '全向视觉 + 前向 LiDAR'],
      ['有效距离', '前向 0.5—200 m'],
      ['低光能力', '夜景级全向避障'],
      ['辅助系统', '下视双目 · 3D 红外'],
    ],
    tags: ['全向避障', 'LiDAR', '夜景感知'],
    labelOffset: [-0.68, 0.46, 0.95],
    explodeOffset: [0, 0.94, 1.42],
  },
  {
    id: 'battery',
    index: '04',
    group: 'power',
    name: '智能飞行电池',
    en: 'Intelligent Flight Battery',
    tagSpec: '4276 mAh · 45 min',
    icon: 'battery',
    color: '#ffb36b',
    desc: '高能量密度锂离子电池组构成机身上盖，内置智能电池管理系统，实时监控电芯温度、电压与健康状态。支持 65 W 快充与低温自加热，是整机 45 分钟续航的能量核心。',
    specs: [
      ['电池容量', '4276 mAh'],
      ['电池能量', '46.8 Wh'],
      ['最长飞行', '45 分钟'],
      ['充电功率', '65 W 快充'],
      ['管理芯片', '智能 BMS · 自放电保护'],
    ],
    tags: ['高密度电芯', '智能 BMS', '快充'],
    labelOffset: [0.0, 0.42, 0.0],
    explodeOffset: [0, 2.05, -0.24],
  },
  {
    id: 'frontArm',
    index: '05',
    group: 'propulsion',
    name: '前机臂',
    en: 'Forward Arm Assembly',
    tagSpec: '碳纤维 · 折叠结构',
    icon: 'frontArm',
    color: '#f0b878',
    desc: '前机臂由碳纤维复合管与金属关节组成，沿对角线向外延伸并集成电机安装座。折叠关节具备预紧锁定机构，展开后为桨叶提供稳定的气动布局。',
    specs: [
      ['结构材质', '碳纤维复合管'],
      ['折叠方式', '水平对折 · 预紧锁定'],
      ['功能', '电机承载 / 线束通道'],
      ['数量', '2 组'],
    ],
    tags: ['碳纤维', '折叠结构', '轻量化'],
    labelOffset: [1.18, 0.3, 0.0],
    explodeOffset: [0, 0, 0],
  },
  {
    id: 'rearArm',
    index: '06',
    group: 'propulsion',
    name: '后机臂',
    en: 'Aft Arm Assembly',
    tagSpec: '碳纤维 · 折叠结构',
    icon: 'rearArm',
    color: '#d9c18a',
    desc: '后机臂与前机臂形成对称的四旋翼布局，内部走线连接无刷电机与 ESC。结构在保证刚性的同时针对高频振动进行了阻尼优化，提升航拍画面的稳定性。',
    specs: [
      ['结构材质', '碳纤维复合管'],
      ['折叠方式', '水平对折 · 预紧锁定'],
      ['功能', '电机承载 / 振动阻尼'],
      ['数量', '2 组'],
    ],
    tags: ['对称布局', '振动阻尼', '线束内置'],
    labelOffset: [0.52, 0.3, 0.0],
    explodeOffset: [0, 0, 0],
  },
  {
    id: 'motor',
    index: '07',
    group: 'propulsion',
    name: '无刷电机',
    en: 'Brushless Motor',
    tagSpec: '无刷 ×4 · FOC',
    icon: 'motor',
    color: '#8ed4ff',
    desc: '四枚高效率无刷电机采用外转子结构，配合 FOC 磁场定向控制精确调节转速。低阻力轴承与优化磁路在提供充足推力的同时抑制高频噪声，实现敏捷的飞行姿态响应。',
    specs: [
      ['电机类型', '无刷外转子'],
      ['控制方式', 'FOC 磁场定向控制'],
      ['数量', '4 枚'],
      ['轴承', '低阻力双滚珠'],
    ],
    tags: ['外转子', 'FOC 控制', '低噪声'],
    labelOffset: [0.34, 0.16, 0.0],
    explodeOffset: [0, 0, 0],
  },
  {
    id: 'prop',
    index: '08',
    group: 'propulsion',
    name: '降噪螺旋桨',
    en: 'Low-Noise Propellers',
    tagSpec: '三叶 ×4 · 低噪声',
    icon: 'prop',
    color: '#a9f0e7',
    desc: '新一代低噪声折叠螺旋桨采用三叶后掠翼型，通过优化弦长分布与桨尖形状降低气动噪声。快拆结构允许免工具更换，并在飞行中保持稳定的气动平衡。',
    specs: [
      ['桨叶结构', '三叶 · 后掠翼型'],
      ['安装方式', '快拆式'],
      ['数量', '4 组'],
      ['特性', '低噪声 / 高气动效率'],
    ],
    tags: ['三叶桨', '后掠翼型', '快拆'],
    labelOffset: [0.2, 0.28, 0.0],
    explodeOffset: [0, 0, 0],
  },
  {
    id: 'gear',
    index: '09',
    group: 'structure',
    name: '起落减震组件',
    en: 'Landing Gear',
    tagSpec: '减震支腿 ×2',
    icon: 'gear',
    color: '#a4b6bf',
    desc: '固定式起落支架为云台与机身提供离地间隙，末端减震脚垫可吸收起降冲击。支腿与下壳体一体化连接，在收纳与运输时保持紧凑。',
    specs: [
      ['结构形式', '固定式支腿'],
      ['减震方式', '弹性脚垫'],
      ['离地间隙', '约 42 mm'],
      ['数量', '2 组'],
    ],
    tags: ['起降缓冲', '一体化连接', '轻量'],
    labelOffset: [0.35, -0.3, 0.15],
    explodeOffset: [0, -1.05, 0],
  },
];

const PART_GROUPS = [
  { id: 'structure', cn: '结构与起落', en: 'AIRFRAME', parts: ['body', 'gear'] },
  { id: 'imaging', cn: '影像与感知', en: 'IMAGING', parts: ['gimbal', 'vision'] },
  { id: 'propulsion', cn: '动力总成', en: 'PROPULSION', parts: ['frontArm', 'rearArm', 'motor', 'prop'] },
  { id: 'power', cn: '能源系统', en: 'ENERGY', parts: ['battery'] },
];

const parts = new Map(PART_DEFS.map((def) => [def.id, {
  ...def,
  amount: 0,
  target: 0,
  holdUntil: 0,
  roots: [],
  el: null,
}]));

/* ------------------------------------------------------------
   DOM
   ------------------------------------------------------------ */
const canvas = $('#scene');
const partsListEl = $('#partsList');
const detailBody = $('#detailBody');
const labelsLayer = $('#labelsLayer');
const leftPanel = $('#leftPanel');
const rightPanel = $('#rightPanel');
const toastEl = $('#toast');
const loader = $('#loader');
const loaderFill = $('#loaderFill');
const loaderPercent = $('#loaderPercent');
const loaderStatus = $('#loaderStatus');
const statusMode = $('#statusMode');
const btnAuto = $('#btnAuto');
const btnLabels = $('#btnLabels');
const btnExplode = $('#btnExplode');
const btnExplodeText = $('#btnExplodeText');
const guideModal = $('#guideModal');
const btnTour = $('#btnTour');
const tourHud = $('#tourHud');
const tourChapter = $('#tourChapter');
const tourName = $('#tourName');
const tourSpec = $('#tourSpec');
const tourState = $('#tourState');
const tourFill = $('#tourFill');
const tourPause = $('#tourPause');
const selectionFrame = $('#selectionFrame');
const selectionLabel = $('#selectionLabel');

const state = {
  mode: 'assembled',
  selected: null,
  hovered: null,
  labels: true,
  autoRotate: !prefersReduced,
  cameraAnim: null,
  booted: false,
  dragging: false,
};

const TOUR_SEQUENCE = ['body', 'gimbal', 'vision', 'battery', 'frontArm', 'rearArm', 'motor', 'prop', 'gear'];
const TOUR_DWELL = 6.4;
const tour = {
  active: false,
  paused: false,
  index: 0,
  elapsed: 0,
  savedAutoRotate: state.autoRotate,
};
const TOUR_ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5h3v14H8zM14 5h3v14h-3z"/></svg>';
const TOUR_ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7V5Z"/></svg>';

// Fail gracefully when WebGL 2 is unavailable.
try {
  const probe = document.createElement('canvas');
  const gl = probe.getContext('webgl2');
  if (!gl) throw new Error('WebGL 2 unavailable');
  gl.getExtension('WEBGL_lose_context')?.loseContext();
} catch (error) {
  loader.innerHTML = `
    <div style="max-width:420px;padding:28px;text-align:center;font-family:'Segoe UI','Microsoft YaHei',sans-serif;color:#dcecef">
      <div style="font-family:Consolas,monospace;font-size:9px;letter-spacing:.22em;color:#ffb36b;margin-bottom:14px">RENDERER OFFLINE</div>
      <div style="font-size:22px;font-weight:600;letter-spacing:.04em;margin-bottom:10px">需要 WebGL 2.0 支持</div>
      <p style="font-size:12px;line-height:1.8;color:#8296a0;margin:0">当前浏览器或显卡驱动无法创建 WebGL 2.0 上下文。请使用最新版 Chrome / Edge / Firefox，并确认硬件加速已开启。</p>
    </div>`;
  throw error;
}

/* ------------------------------------------------------------
   Renderer / scene
   ------------------------------------------------------------ */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompact() ? 1.65 : 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060b10, 0.028);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 120);
const desktopCamera = new THREE.Vector3(7.15, 4.85, 8.55);
const compactCamera = new THREE.Vector3(9.9, 7.1, 12.35);
camera.position.copy(isCompact() ? compactCamera : desktopCamera);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.38, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.065;
controls.enablePan = false;
controls.minDistance = 5.2;
controls.maxDistance = 20;
controls.minPolarAngle = 0.22;
controls.maxPolarAngle = Math.PI * 0.485;
controls.autoRotate = state.autoRotate;
controls.autoRotateSpeed = 0.55;
controls.zoomSpeed = 0.85;
controls.rotateSpeed = 0.72;

/* Exterior fill lights */
const hemi = new THREE.HemisphereLight(0xa6dcff, 0x05080c, 0.62);
scene.add(hemi);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.85);
keyLight.position.set(5.8, 9.2, 6.2);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -7;
keyLight.shadow.camera.right = 7;
keyLight.shadow.camera.top = 7;
keyLight.shadow.camera.bottom = -7;
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 26;
keyLight.shadow.bias = -0.0007;
keyLight.shadow.normalBias = 0.025;
scene.add(keyLight);
scene.add(keyLight.target);

const fillLight = new THREE.DirectionalLight(0x3f9cff, 1.5);
fillLight.position.set(-7.2, 3.2, -5.4);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0x48f1d6, 18, 16, 2);
rimLight.position.set(-2.4, 4.1, -5.3);
scene.add(rimLight);

const warmLight = new THREE.PointLight(0xff9a5c, 9, 13, 2);
warmLight.position.set(4.3, 0.9, 4.4);
scene.add(warmLight);

const underLight = new THREE.PointLight(0x3e7cff, 5.5, 9, 2);
underLight.position.set(0, -1.8, 1.4);
scene.add(underLight);

/* Environment IBL */
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const envRT = pmrem.fromScene(new RoomEnvironment(), 0.035);
scene.environment = envRT.texture;
scene.environmentIntensity = 0.58;

/* ------------------------------------------------------------
   Procedural texture helpers
   ------------------------------------------------------------ */
function createRadialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, 'rgba(255,255,255,.34)');
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createTextTexture(text, options = {}) {
  const {
    width = 1024,
    height = 256,
    font = '600 92px "Segoe UI", Arial, sans-serif',
    color = '#e8f2f3',
    letterSpacing = 10,
    alpha = 1,
    align = 'center',
  } = options;
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${letterSpacing}px`;
  const x = align === 'center' ? width / 2 : align === 'right' ? width - 28 : 28;
  ctx.fillText(text, x, height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

const glowTexture = createRadialTexture('rgba(125,255,235,.95)', 'rgba(40,200,190,0)');
const softShadowTexture = createRadialTexture('rgba(0,0,0,.82)', 'rgba(0,0,0,0)');

/* ------------------------------------------------------------
   Materials (each part owns its material instances so it can
   be independently highlighted / ghosted)
   ------------------------------------------------------------ */
const shell = (color = 0x929ba3) => new THREE.MeshPhysicalMaterial({
  color,
  metalness: 0.62,
  roughness: 0.32,
  clearcoat: 0.6,
  clearcoatRoughness: 0.28,
  envMapIntensity: 1.05,
});

const shellLight = (color = 0xacb3b9) => new THREE.MeshPhysicalMaterial({
  color,
  metalness: 0.48,
  roughness: 0.4,
  clearcoat: 0.45,
  clearcoatRoughness: 0.35,
  envMapIntensity: 1.0,
});

const dark = (color = 0x161b20) => new THREE.MeshPhysicalMaterial({
  color,
  metalness: 0.72,
  roughness: 0.34,
  clearcoat: 0.28,
  clearcoatRoughness: 0.36,
  envMapIntensity: 1.15,
});

const matte = (color = 0x0a0d10) => new THREE.MeshStandardMaterial({
  color,
  metalness: 0.35,
  roughness: 0.7,
  envMapIntensity: 0.7,
});

const rubber = (color = 0x090c0f) => new THREE.MeshStandardMaterial({
  color,
  metalness: 0.12,
  roughness: 0.9,
  envMapIntensity: 0.55,
});

const propMat = () => new THREE.MeshPhysicalMaterial({
  color: 0x171b1f,
  metalness: 0.35,
  roughness: 0.48,
  clearcoat: 0.22,
  clearcoatRoughness: 0.5,
  side: THREE.DoubleSide,
  envMapIntensity: 0.9,
});

const metal = (color = 0xbec5ca) => new THREE.MeshPhysicalMaterial({
  color,
  metalness: 0.96,
  roughness: 0.2,
  envMapIntensity: 1.4,
});

const glassMat = () => new THREE.MeshPhysicalMaterial({
  color: 0x07151d,
  metalness: 0.2,
  roughness: 0.055,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  iridescence: 0.48,
  iridescenceIOR: 1.35,
  envMapIntensity: 2.1,
});

const accentMat = (color = 0x5df2d6, intensity = 2.4) => new THREE.MeshStandardMaterial({
  color,
  emissive: color,
  emissiveIntensity: intensity,
  metalness: 0.2,
  roughness: 0.35,
  toneMapped: false,
});

function decalMaterial(texture, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

/* ------------------------------------------------------------
   Geometry helpers
   ------------------------------------------------------------ */
function rounded(w, h, d, radius = 0.03, segments = 4) {
  const r = Math.min(radius, Math.min(w, h, d) / 2 - 0.001);
  return new RoundedBoxGeometry(w, h, d, segments, r);
}

function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], options = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, radialSegments, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  return addMesh(parent, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments), material, position, rotation);
}

function addTorus(parent, radius, tube, material, position = [0, 0, 0], rotation = [0, 0, 0], radialSegments = 48, tubularSegments = 8) {
  return addMesh(parent, new THREE.TorusGeometry(radius, tube, tubularSegments, radialSegments), material, position, rotation);
}

/* Superellipse loft — the aerodynamic shell of the Air 3S */
function createHullGeometry(sections, segments = 34, exponent = 2.9) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const power = 2 / exponent;
  const rings = sections.length;

  for (let r = 0; r < rings; r++) {
    const s = sections[r];
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * TAU;
      const cx = Math.cos(theta);
      const cy = Math.sin(theta);
      const x = s.w * Math.sign(cx) * Math.pow(Math.abs(cx), power);
      const y = s.h * Math.sign(cy) * Math.pow(Math.abs(cy), power) + (s.y || 0);
      positions.push(x, y, s.z);
      uvs.push(i / segments, r / (rings - 1));
    }
  }

  for (let r = 0; r < rings - 1; r++) {
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = r * segments + i;
      const b = r * segments + next;
      const c = (r + 1) * segments + next;
      const d = (r + 1) * segments + i;
      indices.push(a, b, c, a, c, d);
    }
  }

  // Closed nose and tail caps
  const first = sections[0];
  const last = sections[rings - 1];
  const rearCenter = positions.length / 3;
  positions.push(0, first.y || 0, first.z);
  uvs.push(0.5, 0.5);
  const frontCenter = positions.length / 3;
  positions.push(0, last.y || 0, last.z);
  uvs.push(0.5, 0.5);
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    indices.push(rearCenter, next, i);
    const a = (rings - 1) * segments + i;
    const b = (rings - 1) * segments + next;
    indices.push(frontCenter, a, b);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/* Ring seam line around the hull */
function createHullLoop(section, segments = 48) {
  const pts = [];
  const power = 2 / 2.9;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * TAU;
    const cx = Math.cos(theta);
    const cy = Math.sin(theta);
    const x = section.w * Math.sign(cx) * Math.pow(Math.abs(cx), power);
    const y = section.h * Math.sign(cy) * Math.pow(Math.abs(cy), power) + (section.y || 0);
    pts.push(new THREE.Vector3(x, y, section.z));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}

/* ------------------------------------------------------------
   Scene dressing: ground grid, rings, particles
   ------------------------------------------------------------ */
const drone = new THREE.Group();
drone.position.y = 0.38;
scene.add(drone);

const gridUniforms = {
  uTime: { value: 0 },
  uColorA: { value: new THREE.Color(0x1d6a84) },
  uColorB: { value: new THREE.Color(0x39d9c2) },
};

const gridMaterial = new THREE.ShaderMaterial({
  uniforms: gridUniforms,
  vertexShader: `
    varying vec3 vWorld;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying vec3 vWorld;
    void main() {
      vec2 coord = vWorld.xz * 0.92;
      vec2 derivative = fwidth(coord);
      vec2 grid = abs(fract(coord - 0.5) - 0.5) / max(derivative, vec2(0.0001));
      float line = 1.0 - min(min(grid.x, grid.y), 1.0);
      float dist = length(vWorld.xz);
      float fade = smoothstep(12.0, 1.4, dist) * 0.5 + 0.08;
      float wave = smoothstep(0.86, 1.0, sin(dist * 1.5 - uTime * 0.8) * 0.5 + 0.5);
      float radial = smoothstep(8.0, 0.0, abs(dist - 3.15));
      vec3 color = mix(uColorA, uColorB, radial * 0.8 + wave * 0.15);
      float alpha = (line * fade * 0.26 + wave * radial * 0.05) * smoothstep(13.0, 2.0, dist);
      if (alpha < 0.003) discard;
      gl_FragColor = vec4(color, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
});

const gridPlane = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), gridMaterial);
gridPlane.rotation.x = -Math.PI / 2;
gridPlane.position.y = -2.36;
scene.add(gridPlane);

const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(7.4, 7.4),
  new THREE.MeshBasicMaterial({
    map: softShadowTexture,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    blending: THREE.NormalBlending,
    color: 0x000000,
  }),
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -2.33;
scene.add(shadowPlane);

const ringGroup = new THREE.Group();
ringGroup.position.y = -2.34;
scene.add(ringGroup);

function makeRing(radius, opacity = 0.35, color = 0x48d7ce) {
  const pts = [];
  for (let i = 0; i <= 180; i++) {
    const a = (i / 180) * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Line(geo, mat);
}

const outerRing = makeRing(3.48, 0.18);
const innerRing = makeRing(3.03, 0.26, 0x2cb3ba);
ringGroup.add(outerRing, innerRing);

const arcMaterial = new THREE.LineBasicMaterial({
  color: 0x6af6df,
  transparent: true,
  opacity: 0.55,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

function makeArc(radius, start, length, opacity = 0.5) {
  const pts = [];
  const count = 40;
  for (let i = 0; i <= count; i++) {
    const a = start + (i / count) * length;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const mat = arcMaterial.clone();
  mat.opacity = opacity;
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
}

const arc1 = makeArc(3.48, 0, 0.65, 0.5);
const arc2 = makeArc(3.03, Math.PI * 0.88, 0.46, 0.36);
const arc3 = makeArc(3.48, Math.PI * 1.35, 0.28, 0.28);
ringGroup.add(arc1, arc2, arc3);

/* Particle field */
const particleCount = isCompact() ? 280 : 520;
const particlePositions = new Float32Array(particleCount * 3);
const particleSeeds = [];
for (let i = 0; i < particleCount; i++) {
  const radius = 3.2 + Math.random() * 9.5;
  const angle = Math.random() * TAU;
  const y = -1.6 + Math.random() * 8.5;
  particlePositions[i * 3] = Math.cos(angle) * radius * (0.55 + Math.random() * 0.45);
  particlePositions[i * 3 + 1] = y;
  particlePositions[i * 3 + 2] = Math.sin(angle) * radius * (0.55 + Math.random() * 0.45);
  particleSeeds.push(Math.random() * TAU);
}
const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0x66ded5,
  size: 0.026,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

/* Selection halo */
const halo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture,
  color: 0x63f6df,
  transparent: true,
  opacity: 0,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
}));
halo.scale.set(1.05, 1.05, 1);
halo.visible = false;
scene.add(halo);

/* Small floating dust glow around the drone */
const dustTexture = createRadialTexture('rgba(142,255,239,.9)', 'rgba(50,200,190,0)');
const dustSprites = [];
for (let i = 0; i < 9; i++) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: dustTexture,
    color: 0x59d8d0,
    transparent: true,
    opacity: 0.18 + Math.random() * 0.12,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  }));
  const angle = (i / 9) * TAU + Math.random() * 0.4;
  const radius = 2.7 + Math.random() * 2.2;
  sprite.position.set(Math.cos(angle) * radius, -1.3 + Math.random() * 3.4, Math.sin(angle) * radius);
  sprite.scale.setScalar(0.18 + Math.random() * 0.35);
  scene.add(sprite);
  dustSprites.push({ sprite, angle, radius, speed: 0.035 + Math.random() * 0.05, y: sprite.position.y });
}

/* ------------------------------------------------------------
   Part runtime helpers
   ------------------------------------------------------------ */
const pickables = [];
const meshStates = [];
const GLOW_COLOR = new THREE.Color(0x46f4dc);

function addPartRoot(partId, position = [0, 0, 0], rotationY = 0, explodeOffset = [0, 0, 0]) {
  const g = new THREE.Group();
  g.position.set(...position);
  g.rotation.y = rotationY;
  drone.add(g);
  parts.get(partId).roots.push({
    group: g,
    basePosition: new THREE.Vector3(...position),
    baseRotationY: rotationY,
    explodeOffset: new THREE.Vector3(...explodeOffset),
    spin: 0,
    spinSpeed: 0,
  });
  return g;
}

function prepareMaterial(mesh) {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  const entries = mats.map((material) => ({
    material,
    baseOpacity: material.opacity,
    baseTransparent: material.transparent,
    baseDepthWrite: material.depthWrite,
    baseEmissive: material.emissive ? material.emissive.clone() : null,
    baseEmissiveIntensity: material.emissiveIntensity || 0,
    baseColor: material.color ? material.color.clone() : null,
    skipGlow: Boolean(material.map) || material.toneMapped === false,
  }));

  meshStates.push({
    mesh,
    entries,
    dim: 0,
    targetDim: 0,
    glow: 0,
    targetGlow: 0,
  });
}

function tagPart(root, partId) {
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    if (obj.userData.partId) return;
    obj.userData.partId = partId;
    obj.castShadow = true;
    obj.receiveShadow = true;
    pickables.push(obj);
    prepareMaterial(obj);
  });
}

function getPartLabelWorld(part) {
  const root = part.roots[0]?.group;
  if (!root) return new THREE.Vector3();
  root.updateWorldMatrix(true, false);
  const offset = new THREE.Vector3(...part.labelOffset);
  return root.localToWorld(offset);
}

/* ------------------------------------------------------------
   Build: body
   ------------------------------------------------------------ */
function buildBody() {
  const root = addPartRoot('body', [0, 0, 0], 0, [0, 0, 0]);

  const hullSections = [
    { z: -1.42, w: 0.13, h: 0.065, y: 0.02 },
    { z: -1.34, w: 0.31, h: 0.11, y: 0.015 },
    { z: -1.15, w: 0.52, h: 0.18, y: 0.01 },
    { z: -0.86, w: 0.64, h: 0.235, y: 0.0 },
    { z: -0.38, w: 0.69, h: 0.275, y: 0.0 },
    { z: 0.26, w: 0.69, h: 0.285, y: 0.0 },
    { z: 0.72, w: 0.61, h: 0.265, y: 0.005 },
    { z: 1.04, w: 0.47, h: 0.215, y: 0.01 },
    { z: 1.28, w: 0.31, h: 0.145, y: 0.02 },
    { z: 1.4, w: 0.14, h: 0.07, y: 0.02 },
  ];

  const hullMat = shell(0x8f989f);
  addMesh(root, createHullGeometry(hullSections), hullMat);

  // Dark belly pan
  addMesh(root, rounded(1.16, 0.13, 2.28, 0.07), dark(0x11151a), [0, -0.235, 0.015]);

  // Front upper deck (between battery and nose)
  addMesh(root, rounded(0.82, 0.11, 0.62, 0.035), shellLight(0xa6adb3), [0, 0.22, 0.84]);

  // A-pillar / spine seams
  addMesh(root, rounded(0.038, 0.022, 1.7, 0.008), matte(0x0a0d10), [-0.34, 0.305, -0.02], [0, 0, 0], { castShadow: false });
  addMesh(root, rounded(0.038, 0.022, 1.7, 0.008), matte(0x0a0d10), [0.34, 0.305, -0.02], [0, 0, 0], { castShadow: false });

  // Side intake vents
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      addMesh(root, rounded(0.035, 0.06, 0.2, 0.012), matte(0x080b0e), [side * 0.665, -0.06, -0.46 - i * 0.13], [0, 0, 0], { castShadow: false });
    }
  }

  // Rear exhaust grille
  addMesh(root, rounded(0.34, 0.2, 0.06, 0.025), dark(0x0c1013), [0, 0.0, -1.38]);
  for (let i = 0; i < 5; i++) {
    addMesh(root, rounded(0.3, 0.012, 0.018, 0.005), matte(0x030506), [0, 0.055 - i * 0.033, -1.415], [0, 0, 0], { castShadow: false });
  }

  // Underbody rails
  for (const side of [-1, 1]) {
    addMesh(root, rounded(0.1, 0.065, 1.1, 0.03), dark(0x1b2025), [side * 0.42, -0.31, 0.22]);
  }

  // Tiny underside screws
  for (const side of [-1, 1]) {
    addCylinder(root, 0.027, 0.027, 0.012, 16, metal(0x9ca4aa), [side * 0.46, -0.308, 0.58]);
  }

  // Antenna seams / rear top edges
  for (const side of [-1, 1]) {
    addMesh(root, rounded(0.07, 0.025, 0.36, 0.012), matte(0x0a0d10), [side * 0.48, 0.29, -1.08], [0, 0, 0], { castShadow: false });
  }

  // Seam ring
  const seamGeo = createHullLoop({ z: 0.65, w: 0.615, h: 0.267, y: 0.005 }, 72);
  const seam = new THREE.Line(seamGeo, new THREE.LineBasicMaterial({
    color: 0x05080a,
    transparent: true,
    opacity: 0.9,
  }));
  root.add(seam);

  // Front "DJI" mark under the nose lip
  const djiLogo = createTextTexture('DJI', { width: 512, height: 256, font: '700 150px "Segoe UI", Arial, sans-serif', color: '#d6dfe1', letterSpacing: 6 });
  const logoPlane = addMesh(root, new THREE.PlaneGeometry(0.2, 0.1), decalMaterial(djiLogo, 0.72), [0, 0.095, 1.403], [0, 0, 0], { castShadow: false, receiveShadow: false });

  // Front status LED
  addMesh(root, new THREE.SphereGeometry(0.018, 12, 8), accentMat(0x66ffe3, 2.6), [-0.205, 0.115, 1.39], [0, 0, 0], { castShadow: false });
  addMesh(root, new THREE.SphereGeometry(0.012, 12, 8), accentMat(0xff8a62, 1.9), [0.205, 0.115, 1.39], [0, 0, 0], { castShadow: false });

  tagPart(root, 'body');
}

/* ------------------------------------------------------------
   Build: battery
   ------------------------------------------------------------ */
function buildBattery() {
  const root = addPartRoot('battery', [0, 0.252, -0.34], 0, [0, 2.05, -0.24]);

  // Main battery block
  addMesh(root, rounded(1.19, 0.265, 1.48, 0.075, 5), shell(0xa5adb3), [0, 0, 0]);
  // Slightly lighter top plate
  addMesh(root, rounded(1.03, 0.045, 1.29, 0.035, 4), shellLight(0xb6bdc2), [0, 0.137, 0.01]);
  // Dark perimeter seam
  addMesh(root, rounded(1.2, 0.022, 1.48, 0.012, 3), matte(0x070a0c), [0, -0.02, 0]);

  // Rear battery latch
  addMesh(root, rounded(0.32, 0.12, 0.09, 0.03), dark(0x161b1f), [0, 0.015, -0.745]);
  addMesh(root, rounded(0.16, 0.05, 0.02, 0.01), matte(0x07090b), [0, 0.02, -0.79], [0, 0, 0], { castShadow: false });

  // Side vent slots
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      addMesh(root, rounded(0.03, 0.07, 0.22, 0.01), matte(0x090c0e), [side * 0.598, -0.01, -0.3 + i * 0.14], [0, 0, 0], { castShadow: false });
    }
  }

  // Top decal
  const topDecal = createTextTexture('AIR 3S', {
    width: 1024,
    height: 256,
    font: '600 96px "Segoe UI", Arial, sans-serif',
    color: '#d6dee1',
    letterSpacing: 20,
  });
  const decal = addMesh(root, new THREE.PlaneGeometry(0.58, 0.145), decalMaterial(topDecal, 0.82), [0.0, 0.161, 0.2], [-Math.PI / 2, 0, 0], { castShadow: false, receiveShadow: false });

  const djiTop = createTextTexture('DJI', {
    width: 512,
    height: 256,
    font: '700 130px "Segoe UI", Arial, sans-serif',
    color: '#cfd7da',
    letterSpacing: 4,
  });
  addMesh(root, new THREE.PlaneGeometry(0.17, 0.085), decalMaterial(djiTop, 0.7), [-0.4, 0.161, 0.46], [-Math.PI / 2, 0, 0], { castShadow: false, receiveShadow: false });

  // Battery health LEDs
  for (let i = 0; i < 4; i++) {
    addMesh(root, new THREE.SphereGeometry(0.013, 12, 8), accentMat(i < 3 ? 0x6dffc8 : 0x4ccfff, 2.4), [-0.12 + i * 0.08, 0.145, -0.55], [0, 0, 0], { castShadow: false });
  }

  // Small top ribs
  for (const z of [-0.34, -0.12, 0.1, 0.32]) {
    addMesh(root, rounded(0.88, 0.012, 0.018, 0.005), matte(0x888f94), [0, 0.163, z], [0, 0, 0], { castShadow: false });
  }

  tagPart(root, 'battery');
}

/* ------------------------------------------------------------
   Build: dual-camera gimbal
   ------------------------------------------------------------ */
function buildGimbal() {
  const root = addPartRoot('gimbal', [0, -0.18, 1.05], 0, [0, -0.62, 2.28]);
  root.rotation.x = -0.035;

  // Vibration dampers connecting to the body
  for (const x of [-0.21, 0.21]) {
    addCylinder(root, 0.055, 0.055, 0.13, 20, dark(0x111519), [x, 0.235, -0.06], [Math.PI / 2, 0, 0]);
    addTorus(root, 0.058, 0.012, rubber(0x050709), [x, 0.235, -0.12], [0, 0, 0], 28, 8);
    addTorus(root, 0.058, 0.012, rubber(0x050709), [x, 0.235, 0.14], [0, 0, 0], 28, 8);
  }

  // Gimbal upper bracket
  addMesh(root, rounded(0.54, 0.075, 0.18, 0.03), dark(0x171c21), [0, 0.18, 0.02]);
  addMesh(root, rounded(0.14, 0.24, 0.13, 0.04), dark(0x1a2025), [0, 0.04, 0.02]);
  addCylinder(root, 0.065, 0.065, 0.13, 24, metal(0x878e93), [0, 0.04, 0.1], [0, 0, Math.PI / 2]);

  // Gimbal motor / side hub
  addCylinder(root, 0.11, 0.11, 0.07, 28, dark(0x171c20), [0.34, -0.06, 0.17], [0, 0, Math.PI / 2]);
  addTorus(root, 0.105, 0.009, metal(0x8d969c), [0.377, -0.06, 0.17], [0, Math.PI / 2, 0], 36, 8);

  // Camera body
  addMesh(root, rounded(0.66, 0.35, 0.38, 0.075, 5), dark(0x11161a), [0, -0.1, 0.28]);
  // Front face plate
  addMesh(root, rounded(0.68, 0.33, 0.07, 0.045, 4), dark(0x090c0e), [0, -0.1, 0.487]);
  // Subtle top crown
  addMesh(root, rounded(0.52, 0.065, 0.18, 0.028), dark(0x1d2429), [0, 0.085, 0.3]);

  // Dual lens assemblies
  const lensData = [
    { x: -0.166, label: '24 MM', accent: 0x58e8dc },
    { x: 0.166, label: '70 MM', accent: 0x4ea8ff },
  ];

  for (const lens of lensData) {
    // Barrel base and rings
    addCylinder(root, 0.122, 0.122, 0.16, 40, dark(0x0a0e11), [lens.x, -0.1, 0.56], [Math.PI / 2, 0, 0]);
    addTorus(root, 0.12, 0.013, metal(0x7d858b), [lens.x, -0.1, 0.64], [0, 0, 0], 44, 8);
    addCylinder(root, 0.105, 0.105, 0.018, 40, matte(0x020405), [lens.x, -0.1, 0.65], [Math.PI / 2, 0, 0]);
    // Glass
    addCylinder(root, 0.088, 0.088, 0.014, 40, glassMat(), [lens.x, -0.1, 0.663], [Math.PI / 2, 0, 0]);
    // Inner optic
    addCylinder(root, 0.045, 0.045, 0.006, 32, new THREE.MeshStandardMaterial({
      color: 0x071521,
      emissive: lens.accent,
      emissiveIntensity: 0.12,
      metalness: 0.55,
      roughness: 0.08,
      envMapIntensity: 2,
    }), [lens.x, -0.1, 0.672], [Math.PI / 2, 0, 0]);
    // Glint ring
    addTorus(root, 0.091, 0.0045, accentMat(lens.accent, 1.6), [lens.x, -0.1, 0.671], [0, 0, 0], 44, 6);

    // Lens engraving
    const lensText = createTextTexture(lens.label, {
      width: 512,
      height: 128,
      font: '600 42px "Segoe UI", Arial, sans-serif',
      color: '#a7b3b8',
      letterSpacing: 8,
    });
    addMesh(root, new THREE.PlaneGeometry(0.145, 0.036), decalMaterial(lensText, 0.9), [lens.x, -0.1, 0.678], [0, 0, 0], { castShadow: false, receiveShadow: false });
  }

  // Gimbal front logo
  const djiDecal = createTextTexture('DJI', {
    width: 384,
    height: 192,
    font: '700 100px "Segoe UI", Arial, sans-serif',
    color: '#b9c3c7',
    letterSpacing: 4,
  });
  addMesh(root, new THREE.PlaneGeometry(0.12, 0.06), decalMaterial(djiDecal, 0.7), [0, 0.046, 0.523], [0, 0, 0], { castShadow: false, receiveShadow: false });

  // Heat sink fins on the bottom
  for (let i = 0; i < 5; i++) {
    addMesh(root, rounded(0.36, 0.018, 0.035, 0.006), matte(0x080b0d), [0, -0.285, 0.16 + i * 0.055], [0, 0, 0], { castShadow: false });
  }

  tagPart(root, 'gimbal');
}

/* ------------------------------------------------------------
   Build: vision / LiDAR array
   ------------------------------------------------------------ */
function buildVision() {
  const root = addPartRoot('vision', [0, 0, 0], 0, [0, 0.94, 1.42]);

  // Front sensor bar
  addMesh(root, rounded(0.5, 0.105, 0.075, 0.025), dark(0x070b0e), [0, 0.075, 1.415]);
  addMesh(root, rounded(0.43, 0.055, 0.018, 0.012), matte(0x010203), [0, 0.075, 1.456], [0, 0, 0], { castShadow: false });

  for (const x of [-0.145, 0.145]) {
    addCylinder(root, 0.032, 0.032, 0.012, 24, glassMat(), [x, 0.075, 1.468], [Math.PI / 2, 0, 0]);
    addTorus(root, 0.038, 0.003, metal(0x7d858a), [x, 0.075, 1.474], [0, 0, 0], 24, 6);
  }

  // LiDAR window
  addMesh(root, rounded(0.155, 0.06, 0.012, 0.012), new THREE.MeshPhysicalMaterial({
    color: 0x07111a,
    metalness: 0.35,
    roughness: 0.08,
    clearcoat: 1,
    emissive: 0x17344a,
    emissiveIntensity: 0.25,
    envMapIntensity: 2,
  }), [0, 0.073, 1.469]);

  // Rear sensor pair
  for (const x of [-0.17, 0.17]) {
    addCylinder(root, 0.027, 0.027, 0.012, 20, glassMat(), [x, 0.04, -1.413], [Math.PI / 2, 0, 0]);
  }

  // Downward vision bump
  addMesh(root, rounded(0.25, 0.055, 0.2, 0.025), dark(0x0b0f13), [0, -0.315, 0.62]);
  for (const x of [-0.07, 0.07]) {
    addCylinder(root, 0.022, 0.022, 0.01, 18, glassMat(), [x, -0.345, 0.63], [Math.PI / 2, 0, 0]);
  }

  // Small illuminated indicator
  addMesh(root, rounded(0.055, 0.012, 0.018, 0.005), accentMat(0x4da8ff, 1.8), [0.185, 0.126, 1.43], [0, 0, 0], { castShadow: false });

  tagPart(root, 'vision');
}

/* ------------------------------------------------------------
   Build: arms / motors / propellers
   ------------------------------------------------------------ */
const ARM_CONFIG = [
  { front: true, side: 1, part: 'frontArm', angle: 35 * DEG, pivot: [0.39, -0.015, 0.61] },
  { front: true, side: -1, part: 'frontArm', angle: 145 * DEG, pivot: [-0.39, -0.015, 0.61] },
  { front: false, side: 1, part: 'rearArm', angle: -35 * DEG, pivot: [0.39, -0.015, -0.7] },
  { front: false, side: -1, part: 'rearArm', angle: -145 * DEG, pivot: [-0.39, -0.015, -0.7] },
];

const propAnchors = [];

function createBladeGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.16, -0.075);
  shape.bezierCurveTo(0.4, -0.185, 0.72, -0.17, 0.965, -0.055);
  shape.quadraticCurveTo(1.012, -0.02, 0.99, 0.018);
  shape.bezierCurveTo(0.74, 0.13, 0.42, 0.115, 0.16, 0.055);
  shape.quadraticCurveTo(0.13, 0.0, 0.16, -0.075);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.018,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.006,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

const bladeGeo = createBladeGeometry();

function buildArm(config) {
  const dirX = Math.cos(config.angle);
  const dirZ = Math.sin(config.angle);
  const rotationY = -config.angle;
  const pivot = new THREE.Vector3(...config.pivot);

  const outward = new THREE.Vector3(dirX, 0, dirZ);
  const armExplode = outward.clone().multiplyScalar(0.92).add(new THREE.Vector3(0, 0.62, 0));
  const armRoot = addPartRoot(config.part, pivot.toArray(), rotationY, armExplode.toArray());

  // Structural joint at the fuselage
  addMesh(armRoot, rounded(0.46, 0.17, 0.43, 0.065, 4), shell(0x8b949b), [0.1, 0.0, 0]);
  addMesh(armRoot, rounded(0.3, 0.055, 0.36, 0.025), dark(0x1b2025), [0.0, -0.09, 0]);
  addCylinder(armRoot, 0.115, 0.115, 0.16, 28, dark(0x14191d), [0.08, 0.02, 0], [0, 0, Math.PI / 2]);

  // Main arm — slim rounded beam
  addMesh(armRoot, rounded(1.45, 0.105, 0.215, 0.052, 4), shell(config.front ? 0x969fa6 : 0x8e979e), [0.89, 0.01, 0]);
  addMesh(armRoot, rounded(1.36, 0.028, 0.115, 0.014, 3), shellLight(0xb0b7bc), [0.88, 0.073, 0.005]);
  addMesh(armRoot, rounded(1.3, 0.06, 0.13, 0.026), dark(0x171c20), [0.9, -0.058, 0]);

  // Arm belly seam and end motor mount
  addMesh(armRoot, rounded(0.03, 0.016, 0.18, 0.008), matte(0x07090b), [0.9, 0.03, 0.107], [0, 0, 0], { castShadow: false });
  addMesh(armRoot, rounded(0.23, 0.1, 0.29, 0.05, 4), shell(0x9ca4aa), [1.64, 0.012, 0]);
  addCylinder(armRoot, 0.205, 0.205, 0.075, 36, dark(0x14191e), [1.64, -0.025, 0], [0, 0, Math.PI / 2]);
  const shoulderCap = addCylinder(armRoot, 0.115, 0.115, 0.035, 28, metal(0x70787e), [1.64, -0.025, 0], [0, 0, Math.PI / 2]);

  // Tiny hinge pin
  addCylinder(armRoot, 0.045, 0.045, 0.18, 20, metal(0x7d858b), [0.1, 0.01, 0], [0, 0, Math.PI / 2]);

  tagPart(armRoot, config.part);

  // Motor (independent module, global position at the arm tip)
  const motorBase = pivot.clone().add(outward.clone().multiplyScalar(1.64));
  const motorRoot = new THREE.Group();
  motorRoot.position.copy(motorBase);
  drone.add(motorRoot);
  parts.get('motor').roots.push({
    group: motorRoot,
    basePosition: motorBase.clone(),
    baseRotationY: 0,
    explodeOffset: outward.clone().multiplyScalar(0.34).add(new THREE.Vector3(0, 1.28, 0)),
    spin: 0,
    spinSpeed: 0,
  });

  addCylinder(motorRoot, 0.235, 0.235, 0.098, 40, dark(0x151a1f), [0, 0, 0]);
  addCylinder(motorRoot, 0.255, 0.23, 0.15, 40, dark(0x1a2025), [0, 0.1, 0]);
  addCylinder(motorRoot, 0.218, 0.218, 0.026, 40, metal(0x555d63), [0, 0.183, 0]);
  addCylinder(motorRoot, 0.145, 0.145, 0.036, 32, dark(0x0c1013), [0, 0.204, 0]);
  addTorus(motorRoot, 0.208, 0.012, new THREE.MeshStandardMaterial({
    color: 0xb87333,
    metalness: 1,
    roughness: 0.28,
    emissive: 0x3b1b06,
    emissiveIntensity: 0.2,
  }), [0, 0.155, 0], [0, 0, 0], 44, 8);
  addTorus(motorRoot, 0.226, 0.008, metal(0x868e93), [0, 0.025, 0], [0, 0, 0], 44, 8);

  // Motor vents
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    addMesh(motorRoot, rounded(0.035, 0.045, 0.014, 0.005), matte(0x050709), [Math.cos(a) * 0.22, 0.05, Math.sin(a) * 0.22], [0, -a, 0], { castShadow: false });
  }

  // Stator glow visible through the bell
  addCylinder(motorRoot, 0.09, 0.09, 0.01, 24, accentMat(0x2e8f8c, 0.45), [0, 0.224, 0], [0, 0, 0]);

  tagPart(motorRoot, 'motor');

  // Propeller (independent module, sits above the motor)
  const propBase = motorBase.clone().add(new THREE.Vector3(0, 0.26, 0));
  const propRoot = new THREE.Group();
  propRoot.position.copy(propBase);
  propRoot.rotation.y = Math.random() * Math.PI;
  drone.add(propRoot);
  const propRootData = {
    group: propRoot,
    basePosition: propBase.clone(),
    baseRotationY: propRoot.rotation.y,
    explodeOffset: outward.clone().multiplyScalar(0.16).add(new THREE.Vector3(0, 2.08, 0)),
    spin: 0,
    spinSpeed: (config.side * (config.front ? 1 : -1)) * 5.4,
  };
  parts.get('prop').roots.push(propRootData);

  addCylinder(propRoot, 0.108, 0.108, 0.08, 26, dark(0x0c1013), [0, 0.01, 0]);
  addCylinder(propRoot, 0.048, 0.072, 0.045, 22, metal(0xa8b0b5), [0, 0.072, 0]);
  addTorus(propRoot, 0.098, 0.007, metal(0x9ba4a9), [0, 0.05, 0], [0, 0, 0], 32, 6);

  for (let b = 0; b < 3; b++) {
    const blade = new THREE.Mesh(bladeGeo, propMat());
    blade.rotation.y = (b / 3) * TAU;
    blade.rotation.z = 0.025;
    blade.position.y = 0.035 + b * 0.001;
    blade.castShadow = true;
    blade.receiveShadow = true;
    propRoot.add(blade);
  }

  // Blade tip markers
  for (let b = 0; b < 3; b++) {
    const a = (b / 3) * TAU;
    const tip = addMesh(propRoot, rounded(0.14, 0.009, 0.07, 0.004), new THREE.MeshStandardMaterial({
      color: 0x30373d,
      metalness: 0.4,
      roughness: 0.5,
    }), [Math.cos(a) * 0.9, 0.043, -Math.sin(a) * 0.9], [0, a, 0], { castShadow: false });
  }

  tagPart(propRoot, 'prop');
  propAnchors.push({ root: propRoot, config });
}

function buildArms() {
  for (const config of ARM_CONFIG) buildArm(config);
}

/* ------------------------------------------------------------
   Build: landing gear
   ------------------------------------------------------------ */
function buildGear() {
  const root = addPartRoot('gear', [0, 0, 0], 0, [0, -1.05, 0]);

  for (const side of [-1, 1]) {
    // Angled leg
    addMesh(root, rounded(0.08, 0.42, 0.09, 0.025), dark(0x171c21), [side * 0.33, -0.43, 0.52], [0, 0, side * 10 * DEG]);
    // Foot pad
    addMesh(root, rounded(0.18, 0.06, 0.38, 0.025), matte(0x090c0e), [side * 0.36, -0.65, 0.52]);
    // Rubber sole
    addMesh(root, rounded(0.16, 0.022, 0.34, 0.01), rubber(0x030405), [side * 0.36, -0.683, 0.52], [0, 0, 0], { castShadow: false });
    // Upper mount
    addMesh(root, rounded(0.13, 0.09, 0.16, 0.03), shell(0x828b92), [side * 0.31, -0.25, 0.52]);
    // Rear bumper
    addMesh(root, rounded(0.07, 0.16, 0.2, 0.025), dark(0x14191d), [side * 0.44, -0.34, -0.88], [0, 0, -side * 8 * DEG]);
  }

  tagPart(root, 'gear');
}

/* ------------------------------------------------------------
   Compose model
   ------------------------------------------------------------ */
buildBody();
buildBattery();
buildGimbal();
buildVision();
buildArms();
buildGear();

// Dashed / faint assembly guide lines reveal each module's travel axis
const assemblyGuides = [];
for (const part of parts.values()) {
  if (part.id === 'body') continue;
  for (const root of part.roots) {
    if (root.explodeOffset.lengthSq() < 0.01) continue;
    const positions = new Float32Array(6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(part.color),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    line.renderOrder = 1;
    line.visible = false;
    drone.add(line);
    assemblyGuides.push({ part, root, line, positions, attribute: geometry.attributes.position });
  }
}

/* ------------------------------------------------------------
   UI: parts list
   ------------------------------------------------------------ */
function buildPartsList() {
  partsListEl.innerHTML = '';
  for (const group of PART_GROUPS) {
    const groupEl = document.createElement('div');
    groupEl.className = 'part-group';
    groupEl.innerHTML = `<div class="group-label"><span>${group.en}</span><em>${group.cn}</em></div>`;
    for (const id of group.parts) {
      const part = parts.get(id);
      const btn = document.createElement('button');
      btn.className = 'part-item';
      btn.dataset.id = id;
      btn.type = 'button';
      btn.setAttribute('aria-label', `${part.name} ${part.en}`);
      btn.innerHTML = `
        <span class="part-idx">${part.index}</span>
        <span class="part-icon">${ICONS[part.icon]}</span>
        <span class="part-copy"><strong>${part.name}</strong><small>${part.en}</small></span>
        <span class="part-dot"></span>
        <span class="part-state">ISOLATED</span>
      `;
      btn.addEventListener('click', () => {
        selectPart(id);
        if (isCompact()) leftPanel.classList.remove('open');
      });
      btn.addEventListener('pointerenter', () => {
        if (state.mode === 'assembled') {
          state.hovered = id;
          refreshVisualTargets();
        }
      });
      btn.addEventListener('pointerleave', () => {
        if (state.hovered === id) {
          state.hovered = null;
          refreshVisualTargets();
        }
      });
      groupEl.appendChild(btn);
    }
    partsListEl.appendChild(groupEl);
  }
}

/* ------------------------------------------------------------
   UI: labels
   ------------------------------------------------------------ */
function buildLabels() {
  for (const part of parts.values()) {
    const el = document.createElement('div');
    el.className = 'part-tag';
    el.style.setProperty('--tag-accent', part.color);
    el.innerHTML = `
      <span class="tag-dot"></span>
      <span class="tag-line"></span>
      <div class="tag-body">
        <b>${part.name}</b>
        <small>${part.tagSpec}</small>
      </div>
    `;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `查看${part.name}详情`);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectPart(part.id);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPart(part.id);
      }
    });
    labelsLayer.appendChild(el);
    part.el = el;
  }
}

/* ------------------------------------------------------------
   Hover tooltip
   ------------------------------------------------------------ */
const hoverTip = document.createElement('div');
hoverTip.className = 'hover-tip';
hoverTip.innerHTML = '<b></b><span>点击拆解</span>';
labelsLayer.appendChild(hoverTip);

/* ------------------------------------------------------------
   Detail panel
   ------------------------------------------------------------ */
function setDetail(html) {
  detailBody.innerHTML = html;
  detailBody.classList.remove('detail-swap');
  void detailBody.offsetWidth;
  detailBody.classList.add('detail-swap');
  rightPanel.querySelector('.detail-scroll').scrollTop = 0;
}

function renderOverview() {
  const exploded = state.mode === 'exploded';
  const pct = exploded ? 100 : 0;
  setDetail(`
    <div class="overview-hero">
      <div class="overview-kicker">${exploded ? 'EXPLODED OVERVIEW / 全机拆解' : 'DJI AIR 3S / DUAL-CAMERA FLAGSHIP'}</div>
      <h3>AIR <span>3S</span></h3>
      <p>STRUCTURE EXPLORER · 09 MODULES</p>
    </div>
    <div class="overview-stats">
      <div class="overview-stat"><b>724<small>g</small></b><span>Takeoff Weight</span></div>
      <div class="overview-stat"><b>45<small>min</small></b><span>Max Flight Time</span></div>
      <div class="overview-stat"><b>50<small>MP</small></b><span>Wide Camera</span></div>
      <div class="overview-stat"><b>20<small>km</small></b><span>O4 Transmission</span></div>
    </div>
    <p class="overview-desc">${exploded
      ? '九个核心模块正沿各自结构轴向展开。旋转视角，观察双摄云台、无刷动力系统与智能电池之间的空间关系。'
      : '双摄旗舰航拍无人机。1 英寸广角主摄与 70 mm 中长焦共享三轴云台，结合全向视觉感知与 45 分钟续航，构建轻量而完整的空中影像系统。'}</p>
    <div class="explode-meter">
      <div class="meter-head"><span>EXPLODE DEPTH</span><b>${pct}%</b></div>
      <div class="meter-track"><div class="meter-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="detail-actions">
      <button class="action-btn primary" data-action="${exploded ? 'assemble' : 'explode'}">
        ${exploded ? ICONS.collapse + '组件归位' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>拆解整机'}
      </button>
      <button class="action-btn" data-action="resetView">${ICONS.target}重置视角</button>
    </div>
    <div class="overview-note" style="margin-top:16px">
      ${ICONS.info}
      <div><b>开始探索</b> · 点击三维模型上的任意部件，或从左侧 COMPONENT INDEX 选择模块，即可触发独立拆解动画并查看工程参数。</div>
    </div>
  `);
}

function renderPart(part) {
  const specs = part.specs.map(([label, value]) => `<div class="spec-row"><span>${label}</span><b>${value}</b></div>`).join('');
  const tags = part.tags.map((tag) => `<span class="tag">${tag}</span>`).join('');
  setDetail(`
    <div class="detail-topline">
      <span class="module-code">MODULE <b>${part.index}</b> / 09</span>
      <span class="state-badge">ISOLATED</span>
    </div>
    <div class="detail-title">
      <div><h3>${part.name}</h3><p class="en">${part.en}</p></div>
      <div class="detail-glyph" style="color:${part.color}">${ICONS[part.icon]}</div>
    </div>
    <p class="detail-desc">${part.desc}</p>
    <div class="spec-list">${specs}</div>
    <div class="tag-row">${tags}</div>
    <div class="explode-meter">
      <div class="meter-head"><span>EXPLODE DEPTH</span><b>100%</b></div>
      <div class="meter-track"><div class="meter-fill" style="width:100%"></div></div>
    </div>
    <div class="detail-actions">
      <button class="action-btn primary" data-action="focus">${ICONS.target}定位部件</button>
      <button class="action-btn" data-action="assemble">${ICONS.collapse}收起拆解</button>
    </div>
  `);
}

detailBody.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'explode') explodeAll();
  else if (action === 'assemble') assembleAll();
  else if (action === 'resetView') resetView();
  else if (action === 'focus' && state.selected) focusOnPart(parts.get(state.selected));
});

/* ------------------------------------------------------------
   State transitions
   ------------------------------------------------------------ */
function refreshVisualTargets() {
  for (const part of parts.values()) {
    part.target = state.mode === 'exploded' ? 1 : state.mode === 'focus' && state.selected === part.id ? 1 : 0;
  }
  for (const ms of meshStates) {
    const pid = ms.mesh.userData.partId;
    const selected = state.selected === pid;
    const hovered = state.hovered === pid;
    ms.targetGlow = selected ? 1 : hovered ? 0.42 : 0;
    ms.targetDim = state.mode === 'focus' && !selected ? 1 : 0;
    ms.mesh.renderOrder = selected ? 2 : 0;
  }
}

function syncUI(updateDetail = true) {
  for (const part of parts.values()) {
    part.el.classList.toggle('selected', state.selected === part.id);
    part.el.classList.toggle('dim', state.mode === 'focus' && state.selected !== part.id);
  }
  $$('.part-item').forEach((el) => {
    el.classList.toggle('active', state.selected === el.dataset.id);
  });
  const modeLabel = state.mode === 'exploded' ? 'EXPLODED' : state.mode === 'focus' ? `FOCUS · ${state.selected ? parts.get(state.selected).index : ''}` : 'ASSEMBLED';
  statusMode.textContent = modeLabel;
  $$('.view-btn').forEach((el) => {
    el.classList.toggle('active', el.dataset.view === state.mode);
  });
  btnExplodeText.textContent = state.mode === 'exploded' ? '全部组装' : '全部拆解';
  btnExplode.querySelector('svg').style.transform = state.mode === 'exploded' ? 'rotate(45deg)' : '';
  btnExplode.querySelector('svg').style.transition = 'transform .3s ease';
  btnAuto.classList.toggle('active', state.autoRotate);
  btnLabels.classList.toggle('active', state.labels);
  btnLabels.setAttribute('aria-pressed', String(state.labels));
  btnTour.classList.toggle('tour-on', tour.active);
  btnTour.setAttribute('aria-pressed', String(tour.active));

  if (updateDetail) {
    if (state.mode === 'focus' && state.selected) {
      renderPart(parts.get(state.selected));
      if (isCompact()) rightPanel.classList.add('mobile-open');
    } else {
      renderOverview();
      if (isCompact()) rightPanel.classList.remove('mobile-open');
    }
  }
}

function selectPart(id, options = {}) {
  if (!parts.has(id)) return;
  if (tour.active && !options.internalTour) {
    const tourIndex = TOUR_SEQUENCE.indexOf(id);
    pauseTour(true, true);
    if (tourIndex >= 0) {
      tour.index = tourIndex;
      tour.elapsed = 0;
      tourFill.style.width = '0%';
      updateTourHud();
    }
  }
  if (state.selected === id && state.mode === 'focus' && options.toggle !== false) {
    assembleAll();
    return;
  }
  state.selected = id;
  state.mode = 'focus';
  state.hovered = null;
  for (const part of parts.values()) part.holdUntil = 0;
  refreshVisualTargets();
  syncUI();
  const part = parts.get(id);
  if (!options.silent) showToast(`${part.index} / ${part.name} · 已展开`);
  if (options.focusCamera) focusOnPart(part, options.silent);
}

function explodeAll(options = {}) {
  if (tour.active && !options.internalTour) endTour(true, true);
  state.mode = 'exploded';
  state.selected = null;
  state.hovered = null;
  const now = performance.now();
  let i = 0;
  for (const part of parts.values()) {
    part.holdUntil = now + i * 48;
    part.target = 1;
    i++;
  }
  refreshVisualTargets();
  syncUI();
  if (!options.silent) showToast('全机拆解 · 9 个模块已展开');
  if (!options.noCamera) {
    animateCamera(homePosition().multiplyScalar(1.1), HOME_TARGET, 1100);
  }
}

function assembleAll(options = {}) {
  if (tour.active) endTour(true, true);
  state.mode = 'assembled';
  state.selected = null;
  state.hovered = null;
  for (const part of parts.values()) {
    part.target = 0;
    part.holdUntil = 0;
  }
  refreshVisualTargets();
  syncUI();
  if (!options.silent) showToast('组件归位 · 已恢复组装状态');
}

function toggleAutoRotate(force) {
  if (tour.active) endTour(false, true);
  state.autoRotate = typeof force === 'boolean' ? force : !state.autoRotate;
  controls.autoRotate = state.autoRotate;
  syncUI(false);
  showToast(state.autoRotate ? '自动环绕已开启' : '自动环绕已暂停');
}

function toggleLabels(force) {
  state.labels = typeof force === 'boolean' ? force : !state.labels;
  if (!state.labels) {
    for (const part of parts.values()) part.el.classList.remove('visible');
    hoverTip.classList.remove('visible');
  }
  syncUI(false);
  showToast(state.labels ? '部件标注已显示' : '部件标注已隐藏');
}

/* ------------------------------------------------------------
   Camera
   ------------------------------------------------------------ */
const HOME_TARGET = new THREE.Vector3(0, 0.38, 0);
const homePosition = () => (isCompact() ? compactCamera.clone() : desktopCamera.clone());

function animateCamera(toPosition, toTarget, duration = 900) {
  const fromPosition = camera.position.clone();
  const fromTarget = controls.target.clone();
  let start = performance.now();
  controls.autoRotate = false;
  state.cameraAnim = {
    fromPosition,
    toPosition: toPosition.clone(),
    fromTarget,
    toTarget: toTarget.clone(),
    start,
    duration,
  };
}

function updateCameraAnim(now) {
  if (!state.cameraAnim) return;
  const a = state.cameraAnim;
  const t = Math.min(1, (now - a.start) / a.duration);
  const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  camera.position.lerpVectors(a.fromPosition, a.toPosition, e);
  controls.target.lerpVectors(a.fromTarget, a.toTarget, e);
  if (t >= 1) {
    state.cameraAnim = null;
    controls.autoRotate = state.autoRotate;
  }
}

function resetView() {
  animateCamera(homePosition(), HOME_TARGET, 950);
  showToast('视角已重置');
}

function focusOnPart(part, silent = false) {
  if (!part) return;
  const root = part.roots[0]?.group;
  if (!root) return;
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  const direction = camera.position.clone().sub(controls.target).normalize();
  const distance = THREE.MathUtils.clamp(size * 1.65 + 2.8, 4.8, 10.6) * (isCompact() ? 1.34 : 1);
  const toPos = center.clone().add(direction.multiplyScalar(distance));
  if (toPos.y < 1.35) toPos.y = 1.35;
  animateCamera(toPos, center, 900);
  if (!silent) showToast(`定位至 ${part.name}`);
}

/* ------------------------------------------------------------
   Guided tour
   ------------------------------------------------------------ */
function updateTourHud() {
  const part = parts.get(TOUR_SEQUENCE[tour.index]);
  if (!part) return;
  tourChapter.textContent = `${String(tour.index + 1).padStart(2, '0')} / ${String(TOUR_SEQUENCE.length).padStart(2, '0')}`;
  tourName.textContent = part.name;
  tourSpec.textContent = part.tagSpec;
  tourState.textContent = tour.paused ? 'PAUSED / 交互暂停' : 'AUTO ADVANCE';
  tourHud.style.setProperty('--tour-color', part.color);
  tourHud.classList.toggle('paused', tour.paused);
  tourPause.innerHTML = tour.paused ? TOUR_ICON_PLAY : TOUR_ICON_PAUSE;
  tourPause.setAttribute('aria-label', tour.paused ? '继续导览' : '暂停导览');
}

function setTourStep(index) {
  if (!tour.active) return;
  tour.index = THREE.MathUtils.clamp(index, 0, TOUR_SEQUENCE.length - 1);
  tour.elapsed = 0;
  tourFill.style.width = '0%';
  const part = parts.get(TOUR_SEQUENCE[tour.index]);
  selectPart(part.id, { internalTour: true, silent: true, toggle: false, focusCamera: true });
  updateTourHud();
}

function startTour() {
  if (tour.active) {
    endTour(true, true);
    showToast('自动导览已结束');
    return;
  }
  tour.active = true;
  tour.paused = false;
  tour.index = 0;
  tour.elapsed = 0;
  tour.savedAutoRotate = state.autoRotate;
  state.autoRotate = false;
  controls.autoRotate = false;
  tourHud.classList.add('open');
  document.body.classList.add('tour-active');
  syncUI(false);
  setTourStep(0);
  showToast('自动导览 · 9 个模块');
}

function pauseTour(force, silent = false) {
  if (!tour.active) return;
  tour.paused = typeof force === 'boolean' ? force : !tour.paused;
  updateTourHud();
  syncUI(false);
  if (!silent) showToast(tour.paused ? '自动导览已暂停' : '自动导览继续');
}

function nextTourStep() {
  if (!tour.active) return;
  if (tour.index >= TOUR_SEQUENCE.length - 1) {
    finishTour();
    return;
  }
  setTourStep(tour.index + 1);
}

function prevTourStep() {
  if (!tour.active) return;
  setTourStep(tour.index <= 0 ? 0 : tour.index - 1);
}

function endTour(restoreAutoRotate = true, silent = true) {
  if (!tour.active) return;
  tour.active = false;
  tour.paused = false;
  tourFill.style.width = '0%';
  tourHud.classList.remove('open', 'paused');
  document.body.classList.remove('tour-active');
  if (restoreAutoRotate) {
    state.autoRotate = tour.savedAutoRotate;
    if (!state.cameraAnim) controls.autoRotate = state.autoRotate;
  }
  syncUI(false);
  if (!silent) showToast('自动导览已结束');
}

function finishTour() {
  if (!tour.active) return;
  const restore = tour.savedAutoRotate;
  endTour(false, true);
  state.autoRotate = restore;
  explodeAll({ internalTour: true, silent: true });
  showToast('导览完成 · 9 个模块已展开');
}

/* ------------------------------------------------------------
   Toast
   ------------------------------------------------------------ */
let toastTimer = null;
function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2100);
}

/* ------------------------------------------------------------
   Raycasting / pointer interactions
   ------------------------------------------------------------ */
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const pointer = { x: 0, y: 0, downX: 0, downY: 0, downTime: 0 };
let lastHoverCheck = 0;

function setPointerFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  pointer.x = event.clientX;
  pointer.y = event.clientY;
}

function pickPartFromEvent(event) {
  setPointerFromEvent(event);
  raycaster.setFromCamera(pointerNdc, camera);
  const hits = raycaster.intersectObjects(pickables, false);
  for (const hit of hits) {
    let obj = hit.object;
    while (obj) {
      if (obj.userData.partId) return obj.userData.partId;
      obj = obj.parent;
    }
  }
  return null;
}

canvas.addEventListener('pointerdown', (event) => {
  pointer.downX = event.clientX;
  pointer.downY = event.clientY;
  pointer.downTime = performance.now();
  state.dragging = true;
  hoverTip.classList.remove('visible');
  if (state.cameraAnim) {
    state.cameraAnim = null;
    controls.autoRotate = false;
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (event.buttons !== 0 || state.dragging) return;
  const now = performance.now();
  if (now - lastHoverCheck < 45) {
    if (state.hovered) {
      hoverTip.style.transform = `translate3d(${event.clientX + 16}px, ${event.clientY + 18}px, 0)`;
    }
    return;
  }
  lastHoverCheck = now;
  const id = pickPartFromEvent(event);
  if (id !== state.hovered) {
    state.hovered = id;
    refreshVisualTargets();
    canvas.style.cursor = id ? 'pointer' : 'grab';
  }
  if (id) {
    const part = parts.get(id);
    hoverTip.querySelector('b').textContent = `${part.index} · ${part.name}`;
    hoverTip.style.transform = `translate3d(${event.clientX + 16}px, ${event.clientY + 18}px, 0)`;
    hoverTip.classList.add('visible');
  } else {
    hoverTip.classList.remove('visible');
  }
});

canvas.addEventListener('pointerup', (event) => {
  state.dragging = false;
  const dist = Math.hypot(event.clientX - pointer.downX, event.clientY - pointer.downY);
  if (dist > 7) return;
  const id = pickPartFromEvent(event);
  if (id) selectPart(id);
  else if (state.mode !== 'assembled') assembleAll();
});

canvas.addEventListener('pointerleave', () => {
  state.dragging = false;
  state.hovered = null;
  hoverTip.classList.remove('visible');
  refreshVisualTargets();
  canvas.style.cursor = 'grab';
});

controls.addEventListener('start', () => {
  if (state.cameraAnim) state.cameraAnim = null;
  if (tour.active) pauseTour(true, true);
  hoverTip.classList.remove('visible');
  document.body.classList.add('is-dragging');
});
controls.addEventListener('end', () => {
  document.body.classList.remove('is-dragging');
  if (state.autoRotate && !state.cameraAnim) controls.autoRotate = true;
});

/* ------------------------------------------------------------
   Buttons / keyboard
   ------------------------------------------------------------ */
$('#btnAuto').addEventListener('click', () => toggleAutoRotate());
$('#btnTour').addEventListener('click', startTour);
$('#tourPrev').addEventListener('click', prevTourStep);
$('#tourNext').addEventListener('click', nextTourStep);
$('#tourPause').addEventListener('click', () => pauseTour());
$('#tourClose').addEventListener('click', () => endTour(true, false));
$('#btnLabels').addEventListener('click', () => toggleLabels());
$('#btnLabelsDock').addEventListener('click', () => toggleLabels());
$('#btnExplode').addEventListener('click', () => (state.mode === 'exploded' ? assembleAll() : explodeAll()));
$('#btnCameraReset').addEventListener('click', resetView);
$('#btnCloseDetail').addEventListener('click', () => assembleAll());
$('#btnResetTop').addEventListener('click', resetView);
$('#btnGuide').addEventListener('click', () => openGuide(true));
$('#btnGuideFab').addEventListener('click', () => openGuide(true));
$('#btnCloseGuide').addEventListener('click', () => openGuide(false));
guideModal.addEventListener('click', (event) => {
  if (event.target === guideModal) openGuide(false);
});
$('#btnPanelToggle').addEventListener('click', () => {
  const open = leftPanel.classList.toggle('open');
  $('#btnPanelToggle').setAttribute('aria-expanded', String(open));
});

$$('.view-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'assembled') assembleAll();
    else explodeAll();
  });
});

function openGuide(open) {
  if (open && tour.active && !tour.paused) pauseTour(true, true);
  guideModal.classList.toggle('open', open);
  document.body.classList.toggle('modal-open', open);
}

window.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea')) return;
  const key = event.key.toLowerCase();
  if (guideModal.classList.contains('open') && key !== 'escape') return;
  if (key === 'escape') {
    if (guideModal.classList.contains('open')) openGuide(false);
    else if (tour.active) endTour(true, false);
    else if (state.mode !== 'assembled') assembleAll();
  } else if (key === 'e') {
    if (state.mode === 'exploded') assembleAll();
    else explodeAll();
  } else if (key === 'r') {
    resetView();
  } else if (key === 'l') {
    toggleLabels();
  } else if (key === 'g') {
    startTour();
  } else if (key === 'arrowright' && tour.active) {
    event.preventDefault();
    nextTourStep();
  } else if (key === 'arrowleft' && tour.active) {
    event.preventDefault();
    prevTourStep();
  } else if (key === ' ') {
    event.preventDefault();
    toggleAutoRotate();
  } else if (/^[1-9]$/.test(key)) {
    const part = PART_DEFS[Number(key) - 1];
    if (part) selectPart(part.id);
  }
});

/* ------------------------------------------------------------
   Post processing
   ------------------------------------------------------------ */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  isCompact() ? 0.32 : 0.42,
  0.62,
  0.79,
);
composer.addPass(bloomPass);
const outputPass = new OutputPass();
composer.addPass(outputPass);

/* ------------------------------------------------------------
   Responsive
   ------------------------------------------------------------ */
function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.fov = isCompact() ? 41 : 35;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCompact() ? 1.65 : 2));
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloomPass.resolution.set(w, h);
  if (!state.booted && isCompact()) camera.position.copy(compactCamera);
}

window.addEventListener('resize', onResize);
onResize();

/* ------------------------------------------------------------
   Label / tag update
   ------------------------------------------------------------ */
const projected = new THREE.Vector3();

function updateLabels() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const showAll = state.mode === 'exploded';
  for (const part of parts.values()) {
    const shouldShow = state.labels
      && (showAll || state.selected === part.id)
      && (part.amount > 0.09 || state.selected === part.id);
    if (!shouldShow) {
      part.el.classList.remove('visible');
      continue;
    }
    projected.copy(getPartLabelWorld(part));
    projected.project(camera);
    if (projected.z > 1) {
      part.el.classList.remove('visible');
      continue;
    }
    const sx = (projected.x * 0.5 + 0.5) * width;
    const sy = (-projected.y * 0.5 + 0.5) * height;
    if (sx < -80 || sx > width + 80 || sy < -40 || sy > height + 40) {
      part.el.classList.remove('visible');
      continue;
    }
    part.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translateY(-50%)`;
    part.el.classList.add('visible');
  }

  if (state.hovered && state.mode === 'assembled' && state.labels) {
    // tooltip is positioned by pointermove
  }
}

/* ------------------------------------------------------------
   Selection tracking frame
   ------------------------------------------------------------ */
const selectionCorner = new THREE.Vector3();

function updateSelectionFrame() {
  const part = state.selected ? parts.get(state.selected) : null;
  const root = part?.roots[0]?.group;
  if (!part || !root) {
    selectionFrame.classList.remove('active');
    return;
  }

  root.updateWorldMatrix(true, false);
  const box = new THREE.Box3().setFromObject(root);
  const { min, max } = box;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let hasPoint = false;

  for (const x of [min.x, max.x]) {
    for (const y of [min.y, max.y]) {
      for (const z of [min.z, max.z]) {
        selectionCorner.set(x, y, z).project(camera);
        if (selectionCorner.z > 1) continue;
        const sx = (selectionCorner.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-selectionCorner.y * 0.5 + 0.5) * window.innerHeight;
        minX = Math.min(minX, sx);
        maxX = Math.max(maxX, sx);
        minY = Math.min(minY, sy);
        maxY = Math.max(maxY, sy);
        hasPoint = true;
      }
    }
  }

  if (!hasPoint || maxX < 0 || minX > window.innerWidth || maxY < 0 || minY > window.innerHeight) {
    selectionFrame.classList.remove('active');
    return;
  }

  const pad = 11;
  const x = minX - pad;
  const y = minY - pad;
  const w = Math.max(46, maxX - minX + pad * 2);
  const h = Math.max(46, maxY - minY + pad * 2);
  selectionFrame.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  selectionFrame.style.width = `${w.toFixed(1)}px`;
  selectionFrame.style.height = `${h.toFixed(1)}px`;
  selectionFrame.style.setProperty('--sel-color', part.color);
  selectionLabel.textContent = `TRACKING / ${part.index} · ${part.en.toUpperCase()}`;
  selectionFrame.classList.add('active');
}

/* ------------------------------------------------------------
   Animation loop
   ------------------------------------------------------------ */
const clock = new THREE.Clock();
let elapsed = 0;

function updateMaterials(dt) {
  const damp = 1 - Math.exp(-dt * 9);
  for (const ms of meshStates) {
    ms.dim += (ms.targetDim - ms.dim) * damp;
    ms.glow += (ms.targetGlow - ms.glow) * (1 - Math.exp(-dt * 12));
    const dim = ms.dim < 0.005 ? 0 : ms.dim;
    const glow = ms.glow < 0.003 ? 0 : ms.glow;
    for (const entry of ms.entries) {
      const m = entry.material;
      const wantTransparent = entry.baseTransparent || dim > 0.01;
      if (m.transparent !== wantTransparent) {
        m.transparent = wantTransparent;
        m.needsUpdate = true;
      }
      m.opacity = entry.baseOpacity * (1 - 0.79 * dim);
      m.depthWrite = wantTransparent ? false : entry.baseDepthWrite;
      if (entry.baseEmissive && !entry.skipGlow) {
        m.emissive.copy(entry.baseEmissive).lerp(GLOW_COLOR, glow * 0.92);
        m.emissiveIntensity = entry.baseEmissiveIntensity + glow * 1.12;
      } else if (entry.baseColor && !entry.skipGlow && !entry.material.emissive) {
        m.color.copy(entry.baseColor).lerp(GLOW_COLOR, glow * 0.34);
      }
    }
  }
}

function updateParts(dt, now) {
  for (const part of parts.values()) {
    const isHeld = now < part.holdUntil;
    const desired = isHeld ? 0 : part.target;
    part.amount += (desired - part.amount) * (1 - Math.exp(-dt * (desired ? 5.6 : 6.8)));
    if (Math.abs(part.amount - desired) < 0.0015) part.amount = desired;
    const eased = part.amount < 0.5
      ? 4 * part.amount * part.amount * part.amount
      : 1 - Math.pow(-2 * part.amount + 2, 3) / 2;

    for (const root of part.roots) {
      root.group.position.copy(root.basePosition).addScaledVector(root.explodeOffset, eased);
      if (part.id === 'prop') {
        root.spin += dt * root.spinSpeed * (0.06 + part.amount * 1.8);
        root.group.rotation.y = root.baseRotationY + root.spin;
      } else {
        root.group.rotation.y = root.baseRotationY;
      }
    }
  }

  for (const guide of assemblyGuides) {
    const amount = guide.part.amount;
    const visible = amount > 0.02;
    guide.line.visible = visible;
    if (!visible) continue;
    const { basePosition } = guide.root;
    const pos = guide.root.group.position;
    guide.positions[0] = basePosition.x;
    guide.positions[1] = basePosition.y;
    guide.positions[2] = basePosition.z;
    guide.positions[3] = pos.x;
    guide.positions[4] = pos.y;
    guide.positions[5] = pos.z;
    guide.attribute.needsUpdate = true;
    guide.line.material.opacity = amount * 0.26;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  const now = performance.now();

  updateCameraAnim(now);
  controls.update();
  updateParts(dt, now);
  updateMaterials(dt);
  updateLabels();
  updateSelectionFrame();

  if (tour.active && !tour.paused) {
    tour.elapsed += dt;
    tourFill.style.width = `${Math.min(100, (tour.elapsed / TOUR_DWELL) * 100).toFixed(1)}%`;
    if (tour.elapsed >= TOUR_DWELL) nextTourStep();
  }

  // Float and breathe
  drone.position.y = 0.38 + Math.sin(elapsed * 0.72) * 0.035;
  drone.rotation.z = Math.sin(elapsed * 0.33) * 0.0025;
  drone.rotation.x = Math.cos(elapsed * 0.42) * 0.0018;

  // Ground rings
  gridUniforms.uTime.value = elapsed;
  ringGroup.rotation.y = elapsed * 0.035;
  arc1.rotation.y = elapsed * 0.18;
  arc2.rotation.y = -elapsed * 0.12;
  arc3.rotation.y = elapsed * 0.24;
  innerRing.material.opacity = 0.22 + Math.sin(elapsed * 1.4) * 0.05;

  // Particles drift
  particles.rotation.y = elapsed * 0.008;
  const positions = particleGeo.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 1] += Math.sin(elapsed * 0.45 + particleSeeds[i]) * 0.00022;
  }
  particleGeo.attributes.position.needsUpdate = true;

  // Ambient dust sprites orbit
  for (const d of dustSprites) {
    d.angle += dt * d.speed;
    d.sprite.position.x = Math.cos(d.angle) * d.radius;
    d.sprite.position.z = Math.sin(d.angle) * d.radius;
    d.sprite.position.y = d.y + Math.sin(elapsed * 0.5 + d.angle) * 0.15;
  }

  // Selection halo
  if (state.selected) {
    const part = parts.get(state.selected);
    const anchor = getPartLabelWorld(part);
    halo.position.copy(anchor);
    halo.visible = true;
    const pulse = 1 + Math.sin(elapsed * 2.3) * 0.06;
    const size = 0.82 + part.amount * 0.3;
    halo.scale.setScalar(size * pulse);
    halo.material.opacity = 0.08 + part.amount * 0.08;
  } else {
    halo.visible = false;
  }

  keyLight.position.x = 5.8 + Math.sin(elapsed * 0.2) * 0.4;
  rimLight.intensity = 17 + Math.sin(elapsed * 1.1) * 2;

  composer.render();
}

/* ------------------------------------------------------------
   Boot sequence
   ------------------------------------------------------------ */
buildPartsList();
buildLabels();

// Initial default: overview detail panel
syncUI();
canvas.style.cursor = 'grab';

// Warm up shaders
try {
  renderer.compile(scene, camera);
} catch (err) {
  console.warn('Shader warm-up skipped', err);
}

const bootSteps = [
  [8, 'SCANNING AIRFRAME GEOMETRY'],
  [23, 'GENERATING COMPOSITE SHELL'],
  [41, 'MOUNTING DUAL-CAMERA GIMBAL'],
  [59, 'ASSEMBLING PROPULSION MODULES'],
  [74, 'CALIBRATING MATERIAL RESPONSE'],
  [89, 'BUILDING ENVIRONMENT MAP'],
  [100, 'SYSTEM READY'],
];

let bootIndex = 0;
const bootTimer = setInterval(() => {
  if (bootIndex >= bootSteps.length) {
    clearInterval(bootTimer);
    return;
  }
  const [pct, label] = bootSteps[bootIndex++];
  loaderFill.style.width = `${pct}%`;
  loaderPercent.textContent = `${pct}%`;
  loaderStatus.textContent = label;
}, prefersReduced ? 40 : 155);

function finishBoot() {
  state.booted = true;
  loader.classList.add('hidden');
  if (!prefersReduced) {
    animateCamera(new THREE.Vector3(7.9, 5.6, 9.4), new THREE.Vector3(0, 0.38, 0), 1800);
  }
  setTimeout(() => {
    if (!prefersReduced) showToast('拖拽旋转 · 点击任意部件开始拆解');
  }, 1450);
}

setTimeout(finishBoot, prefersReduced ? 380 : 1680);
animate();

/* Debug / inspection hooks for local verification */
window.__AIR3S = {
  THREE,
  scene,
  camera,
  controls,
  renderer,
  composer,
  parts,
  pickables,
  state,
  selectPart,
  explodeAll,
  assembleAll,
  resetView,
  getPartLabelWorld,
  isCompact,
  tour,
  startTour,
  endTour,
  nextTourStep,
  prevTourStep,
};
