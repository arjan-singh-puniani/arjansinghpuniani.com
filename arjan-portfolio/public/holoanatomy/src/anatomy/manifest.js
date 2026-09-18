export const BODY_PARTS_LICENSE = {
  name: 'Creative Commons Attribution 4.0 International',
  short: 'CC BY 4.0',
  url: 'https://creativecommons.org/licenses/by/4.0/',
  officialLicenseUrl: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
  attribution: 'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International'
};

export const OFFICIAL_SOURCE = 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/';
export const OFFICIAL_ARCHIVE = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_BP3D_4.0_obj_99.zip';
export const MIRROR_COMMIT = 'be67a977abe25a36f59793fda86a506618fd4d27';
export const MIRROR_BASE = `https://raw.githubusercontent.com/jixiangying/anatomy/${MIRROR_COMMIT}/isa_BP3D_4.0_obj_99`;


export const MODULES = {
  'head-neck': {
    label: 'Head + Neck Neuro',
    shortLabel: 'Head + Neck',
    subtitle: 'Skull, brain, cranial/orbital nerves, cervical vessels and neck musculature'
  },
  'shoulder': {
    label: 'Rotator Cuff + Shoulder',
    shortLabel: 'Shoulder',
    subtitle: 'Right shoulder girdle, rotator cuff, deltoid, biceps and regional vasculature'
  },
  'heart': {
    label: 'Heart + Coronary Circulation',
    shortLabel: 'Heart',
    subtitle: 'Cardiac chambers, valves, coronary circulation and great vessels'
  }
};

export const LAYERS = {
  skeleton: { label: 'Skeleton', material: 'bone', initial: 'visible', explode: [0, 0, 0.10] },
  brain: { label: 'Brain', material: 'brain', initial: 'visible', explode: [0, 0.12, -0.16] },
  arteries: { label: 'Arteries', material: 'artery', initial: 'visible', explode: [0.17, 0, 0] },
  veins: { label: 'Veins', material: 'vein', initial: 'visible', explode: [-0.17, 0, 0] },
  nerves: { label: 'Nerves', material: 'nerve', initial: 'visible', explode: [0, 0.10, 0.16] },
  muscles: { label: 'Muscles', material: 'muscle', initial: 'ghost', explode: [0, -0.14, 0.13] },
  myocardium: { label: 'Heart wall', material: 'myocardium', initial: 'visible', explode: [0, 0, 0] },
  chambers: { label: 'Chambers', material: 'chamber', initial: 'ghost', explode: [0, 0.08, 0] },
  valves: { label: 'Valves', material: 'valve', initial: 'visible', explode: [0, 0.12, 0.08] }
};

export const MATERIALS = {
  bone:   { color: '#d8cab0', roughness: 0.70, specular: 18, rim: 0.15 },
  brain:  { color: '#ad7774', roughness: 0.82, specular: 12, rim: 0.12 },
  artery: { color: '#8e302d', roughness: 0.48, specular: 34, rim: 0.18 },
  vein:   { color: '#443d5d', roughness: 0.55, specular: 28, rim: 0.15 },
  nerve:  { color: '#cdbf88', roughness: 0.65, specular: 20, rim: 0.18 },
  muscle: { color: '#713632', roughness: 0.78, specular: 16, rim: 0.10 },
  myocardium: { color: '#8f4742', roughness: 0.72, specular: 20, rim: 0.12 },
  chamber: { color: '#7b4045', roughness: 0.68, specular: 16, rim: 0.10 },
  valve: { color: '#c7a99a', roughness: 0.62, specular: 22, rim: 0.15 }
};

function part(file, name, fma, layer, { component = null, initial = true, module = 'head-neck' } = {}) {
  return {
    id: file,
    file: `${file}.obj`,
    name,
    fma,
    component,
    layer,
    module,
    selectable: true,
    initial,
    localUrl: `/anatomy/${file}.obj`,
    remoteUrl: `${MIRROR_BASE}/${file}.obj`,
    source: 'BodyParts3D / ISA Release 4.0',
    sourceUrl: OFFICIAL_SOURCE,
    license: BODY_PARTS_LICENSE.short
  };
}

const HEAD_NECK_BASE = [
  // Skull and cervical spine — verified FMA labels mapped to BodyParts3D FJ meshes.
  part('FJ3200', 'Frontal bone', 'FMA52734', 'skeleton'),
  part('FJ3309', 'Occipital bone', 'FMA52735', 'skeleton'),
  part('FJ3394', 'Sphenoid bone', 'FMA52736', 'skeleton'),
  part('FJ3386', 'Right temporal bone', 'FMA52738', 'skeleton'),
  part('FJ3281', 'Left temporal bone', 'FMA52739', 'skeleton'),
  part('FJ3199', 'Ethmoid', 'FMA52740', 'skeleton'),
  part('FJ3380', 'Right parietal bone', 'FMA52788', 'skeleton'),
  part('FJ3274', 'Left parietal bone', 'FMA52789', 'skeleton'),
  part('FJ3375', 'Right maxilla', 'FMA53649', 'skeleton'),
  part('FJ3269', 'Left maxilla', 'FMA53650', 'skeleton'),
  part('FJ3392', 'Right zygomatic bone', 'FMA52892', 'skeleton'),
  part('FJ3287', 'Left zygomatic bone', 'FMA52893', 'skeleton'),
  part('FJ3289', 'Mandible', 'FMA52748', 'skeleton'),
  part('FJ3176', 'Atlas (C1)', 'FMA12519', 'skeleton'),
  part('FJ3177', 'Axis (C2)', 'FMA12520', 'skeleton'),
  part('FJ3161', 'Third cervical vertebra (C3)', 'FMA12521', 'skeleton'),
  part('FJ3164', 'Fourth cervical vertebra (C4)', 'FMA12522', 'skeleton'),
  part('FJ3167', 'Fifth cervical vertebra (C5)', 'FMA12523', 'skeleton'),
  part('FJ3170', 'Sixth cervical vertebra (C6)', 'FMA12524', 'skeleton'),
  part('FJ3172', 'Seventh cervical vertebra (C7)', 'FMA12525', 'skeleton'),

  // Cortical and hindbrain structures. Paired FJ meshes retain the source's unsided label when ISA does not specify laterality.
  part('FJ1833', 'Superior frontal gyrus', 'FMA61857', 'brain', { component: 'A' }),
  part('FJ1834', 'Superior frontal gyrus', 'FMA61857', 'brain', { component: 'B' }),
  part('FJ1787', 'Middle frontal gyrus', 'FMA61859', 'brain', { component: 'A' }),
  part('FJ1788', 'Middle frontal gyrus', 'FMA61859', 'brain', { component: 'B' }),
  part('FJ1744', 'Inferior frontal gyrus', 'FMA61860', 'brain', { component: 'A' }),
  part('FJ1745', 'Inferior frontal gyrus', 'FMA61860', 'brain', { component: 'B' }),
  part('FJ1800', 'Precentral gyrus', 'FMA61894', 'brain', { component: 'A' }),
  part('FJ1801', 'Precentral gyrus', 'FMA61894', 'brain', { component: 'B' }),
  part('FJ1797', 'Postcentral gyrus', 'FMA61896', 'brain', { component: 'A' }),
  part('FJ1798', 'Postcentral gyrus', 'FMA61896', 'brain', { component: 'B' }),
  part('FJ1841', 'Supramarginal gyrus', 'FMA61897', 'brain', { component: 'A' }),
  part('FJ1842', 'Supramarginal gyrus', 'FMA61897', 'brain', { component: 'B' }),
  part('FJ1732', 'Angular gyrus', 'FMA61898', 'brain', { component: 'A' }),
  part('FJ1733', 'Angular gyrus', 'FMA61898', 'brain', { component: 'B' }),
  part('FJ1835', 'Superior parietal lobule', 'FMA61899', 'brain', { component: 'A' }),
  part('FJ1836', 'Superior parietal lobule', 'FMA61899', 'brain', { component: 'B' }),
  part('FJ1789', 'Middle temporal gyrus', 'FMA61906', 'brain', { component: 'A' }),
  part('FJ1790', 'Middle temporal gyrus', 'FMA61906', 'brain', { component: 'B' }),
  part('FJ1746', 'Inferior temporal gyrus', 'FMA61907', 'brain', { component: 'A' }),
  part('FJ1747', 'Inferior temporal gyrus', 'FMA61907', 'brain', { component: 'B' }),
  part('FJ1792', 'Right occipital lobe', 'FMA72975', 'brain'),
  part('FJ1791', 'Left occipital lobe', 'FMA72976', 'brain'),
  part('FJ1781', 'Cerebellum', 'FMA67944', 'brain', { component: 'A' }),
  part('FJ1830', 'Cerebellum', 'FMA67944', 'brain', { component: 'B' }),
  part('FJ1775', 'Pons', 'FMA67943', 'brain', { component: 'A' }),
  part('FJ1822', 'Pons', 'FMA67943', 'brain', { component: 'B' }),
  part('FJ1769', 'Medulla oblongata', 'FMA62004', 'brain', { component: 'A' }),
  part('FJ1831', 'Medulla oblongata', 'FMA62004', 'brain', { component: 'B' }),
  part('FJ1782', 'Thalamus', 'FMA62007', 'brain', { component: 'A' }),
  part('FJ1827', 'Thalamus', 'FMA62007', 'brain', { component: 'B' }),

  // Major head/neck circulation.
  part('FJ3564', 'Right common carotid artery', 'FMA3941', 'arteries'),
  part('FJ3483', 'Left common carotid artery', 'FMA4058', 'arteries'),
  part('FJ1682', 'Right internal carotid artery', 'FMA3949', 'arteries'),
  part('FJ1682M', 'Left internal carotid artery', 'FMA4062', 'arteries'),
  part('FJ1725', 'Right vertebral artery', 'FMA3958', 'arteries'),
  part('FJ1725M', 'Left vertebral artery', 'FMA4066', 'arteries'),
  part('FJ3585', 'Right internal jugular vein', 'FMA4754', 'veins'),
  part('FJ3485', 'Left internal jugular vein', 'FMA4762', 'veins'),

  // Verified cranial neural structures.
  part('FJ1820', 'Right optic tract', 'FMA62382', 'nerves'),
  part('FJ1773', 'Left optic tract', 'FMA67936', 'nerves'),
  part('FJ1363', 'Right ophthalmic nerve', 'FMA52622', 'nerves'),
  part('FJ1312', 'Left ophthalmic nerve', 'FMA52623', 'nerves'),

  // Neck musculature.
  part('FJ1595', 'Right sternocleidomastoid', 'FMA13408', 'muscles'),
  part('FJ1573', 'Left sternocleidomastoid', 'FMA13409', 'muscles')

];

// Expanded neurostructures available in BodyParts3D Release 4.0. The source archive
// contains detailed orbital/optic nerves but does not contain complete CN I-XII or
// spinal nerve roots; those are deliberately not fabricated.
const HEAD_NECK_NEURO = [
  ...HEAD_NECK_BASE,
  part('FJ1283', 'Left anterior ethmoidal nerve', 'FMA52677', 'nerves', { module: 'head-neck' }),
  part('FJ1288', 'Left ciliary ganglion', 'FMA53550', 'nerves', { module: 'head-neck' }),
  part('FJ1290', 'Left frontal nerve', 'FMA52640', 'nerves', { module: 'head-neck' }),
  part('FJ1293', 'Inferior branch of left oculomotor nerve', 'FMA52577', 'nerves', { module: 'head-neck' }),
  part('FJ1296', 'Left infratrochlear nerve', 'FMA52699', 'nerves', { module: 'head-neck' }),
  part('FJ1300', 'Left lacrimal nerve', 'FMA52630', 'nerves', { module: 'head-neck' }),
  part('FJ1310', 'Left nasociliary nerve', 'FMA52670', 'nerves', { module: 'head-neck' }),
  part('FJ1311', 'Communicating branch of left nasociliary nerve with left ciliary ganglion', 'FMA52674', 'nerves', { module: 'head-neck' }),
  part('FJ1313', 'Left optic nerve', 'FMA50878', 'nerves', { module: 'head-neck' }),
  part('FJ1315', 'Left posterior ethmoidal nerve', 'FMA52716', 'nerves', { module: 'head-neck' }),
  part('FJ1318', 'Left long ciliary nerve', 'FMA82735', 'nerves', { module: 'head-neck' }),
  part('FJ1319', 'Short ciliary nerve', 'FMA7041', 'nerves', { module: 'head-neck' }),
  part('FJ1321', 'Superior branch of left oculomotor nerve', 'FMA52575', 'nerves', { module: 'head-neck' }),
  part('FJ1325', 'Left supra-orbital nerve', 'FMA52657', 'nerves', { module: 'head-neck' }),
  part('FJ1326', 'Left supratrochlear nerve', 'FMA52644', 'nerves', { module: 'head-neck' }),
  part('FJ1330', 'Left trochlear nerve', 'FMA50882', 'nerves', { module: 'head-neck' }),
  part('FJ1333', 'Right anterior ethmoidal nerve', 'FMA52676', 'nerves', { module: 'head-neck' }),
  part('FJ1339', 'Right ciliary ganglion', 'FMA53549', 'nerves', { module: 'head-neck' }),
  part('FJ1341', 'Right frontal nerve', 'FMA52639', 'nerves', { module: 'head-neck' }),
  part('FJ1344', 'Inferior branch of right oculomotor nerve', 'FMA52576', 'nerves', { module: 'head-neck' }),
  part('FJ1347', 'Right infratrochlear nerve', 'FMA52698', 'nerves', { module: 'head-neck' }),
  part('FJ1351', 'Right lacrimal nerve', 'FMA52629', 'nerves', { module: 'head-neck' }),
  part('FJ1361', 'Right nasociliary nerve', 'FMA52669', 'nerves', { module: 'head-neck' }),
  part('FJ1362', 'Communicating branch of right nasociliary nerve with right ciliary ganglion', 'FMA52673', 'nerves', { module: 'head-neck' }),
  part('FJ1364', 'Right optic nerve', 'FMA50875', 'nerves', { module: 'head-neck' }),
  part('FJ1366', 'Right posterior ethmoidal nerve', 'FMA52715', 'nerves', { module: 'head-neck' }),
  part('FJ1369', 'Right long ciliary nerve', 'FMA82734', 'nerves', { module: 'head-neck' }),
  part('FJ1370', 'Short ciliary nerve', 'FMA7041', 'nerves', { module: 'head-neck' }),
  part('FJ1372', 'Superior branch of right oculomotor nerve', 'FMA52574', 'nerves', { module: 'head-neck' }),
  part('FJ1376', 'Right supra-orbital nerve', 'FMA52656', 'nerves', { module: 'head-neck' }),
  part('FJ1377', 'Right supratrochlear nerve', 'FMA52643', 'nerves', { module: 'head-neck' }),
  part('FJ1381', 'Right trochlear nerve', 'FMA50881', 'nerves', { module: 'head-neck' }),
  part('FJ1772', 'Left optic nerve', 'FMA50878', 'nerves', { module: 'head-neck' }),
  part('FJ1819', 'Right optic nerve', 'FMA50875', 'nerves', { module: 'head-neck' })
];

const SHOULDER_MANIFEST = [
  part('FJ3384', 'Right scapula', 'FMA13395', 'skeleton', { module: 'shoulder' }),
  part('FJ3362', 'Right clavicle', 'FMA13322', 'skeleton', { module: 'shoulder' }),
  part('FJ3368', 'Right humerus', 'FMA23130', 'skeleton', { module: 'shoulder' }),
  part('FJ1506', 'Right supraspinatus', 'FMA32544', 'muscles', { module: 'shoulder' }),
  part('FJ1500', 'Right infraspinatus muscle', 'FMA32547', 'muscles', { module: 'shoulder' }),
  part('FJ1504', 'Right subscapularis', 'FMA13414', 'muscles', { module: 'shoulder' }),
  part('FJ1508', 'Right teres minor', 'FMA32553', 'muscles', { module: 'shoulder' }),
  part('FJ1467', 'Acromial part of right deltoid', 'FMA34682', 'muscles', { module: 'shoulder' }),
  part('FJ1468', 'Clavicular part of right deltoid', 'FMA34680', 'muscles', { module: 'shoulder' }),
  part('FJ1513', 'Spinal part of right deltoid', 'FMA34684', 'muscles', { module: 'shoulder' }),
  part('FJ1478', 'Long head of right biceps brachii', 'FMA37686', 'muscles', { module: 'shoulder' }),
  part('FJ3579', 'Right subclavian artery', 'FMA3953', 'arteries', { module: 'shoulder' }),
  part('FJ2268', 'Right axillary artery', 'FMA22655', 'arteries', { module: 'shoulder' }),
  part('FJ2303', 'Right suprascapular artery', 'FMA10698', 'arteries', { module: 'shoulder' }),
  part('FJ2298', 'Right subscapular artery', 'FMA22678', 'arteries', { module: 'shoulder' }),
  part('FJ2273', 'Right circumflex scapular artery', 'FMA23180', 'arteries', { module: 'shoulder' }),
  part('FJ2269', 'Right axillary vein', 'FMA13330', 'veins', { module: 'shoulder' }),
  part('FJ2302', 'Right suprascapular vein', 'FMA50859', 'veins', { module: 'shoulder' }),
  part('FJ2299', 'Right subscapular vein', 'FMA23114', 'veins', { module: 'shoulder' }),
  part('FJ2274', 'Right circumflex scapular vein', 'FMA77949', 'veins', { module: 'shoulder' })
];

const HEART_MANIFEST = [
  part('FJ2417', 'Left anterior cusp of pulmonary valve', 'FMA7247', 'valves', { module: 'heart' }),
  part('FJ2418', 'Anterolateral head of lateral papillary muscle of left ventricle', 'FMA7265', 'valves', { module: 'heart' }),
  part('FJ2419', 'Anterior papillary muscle of right ventricle', 'FMA7260', 'valves', { module: 'heart' }),
  part('FJ2420', 'Anterior leaflet of mitral valve', 'FMA7242', 'valves', { module: 'heart' }),
  part('FJ2421', 'Anterior leaflet of tricuspid valve', 'FMA7238', 'valves', { module: 'heart' }),
  part('FJ2422', 'Cavity of left ventricle', 'FMA9466', 'chambers', { module: 'heart' }),
  part('FJ2423', 'Cavity of right ventricle', 'FMA9291', 'chambers', { module: 'heart' }),
  part('FJ2424', 'Cavity of right atrium', 'FMA11359', 'chambers', { module: 'heart' }),
  part('FJ2425', 'Cavity of left atrium', 'FMA9465', 'chambers', { module: 'heart' }),
  part('FJ2426', 'Left posterior cusp of aortic valve', 'FMA7254', 'valves', { module: 'heart' }),
  part('FJ2427', 'Posterior cusp of pulmonary valve', 'FMA7250', 'valves', { module: 'heart' }),
  part('FJ2428', 'Wall of ventricle', 'FMA13884', 'myocardium', { module: 'heart' }),
  part('FJ2429', 'Lateral papillary muscle of left ventricle', 'FMA7264', 'valves', { module: 'heart' }),
  part('FJ2430', 'Posterior papillary muscle of right ventricle', 'FMA7261', 'valves', { module: 'heart' }),
  part('FJ2431', 'Right posterior cusp of aortic valve', 'FMA7252', 'valves', { module: 'heart' }),
  part('FJ2432', 'Posterior leaflet of mitral valve', 'FMA7243', 'valves', { module: 'heart' }),
  part('FJ2433', 'Posterior leaflet of tricuspid valve', 'FMA7239', 'valves', { module: 'heart' }),
  part('FJ2434', 'Right anterior cusp of pulmonary valve', 'FMA7249', 'valves', { module: 'heart' }),
  part('FJ2435', 'Anterior cusp of aortic valve', 'FMA7253', 'valves', { module: 'heart' }),
  part('FJ2436', 'Septal leaflet of tricuspid valve', 'FMA7240', 'valves', { module: 'heart' }),
  part('FJ2437', 'Septal papillary muscle of right ventricle', 'FMA7262', 'valves', { module: 'heart' }),
  part('FJ2438', 'Wall of left atrium', 'FMA9531', 'myocardium', { module: 'heart' }),
  part('FJ2439', 'Wall of right atrium', 'FMA9457', 'myocardium', { module: 'heart' }),
  part('FJ2631', 'Trunk of anterior interventricular branch of left coronary artery', 'FMA74912', 'arteries', { module: 'heart' }),
  part('FJ2632', 'First right anterior branch of anterior interventricular branch of left coronary artery', 'FMA3872', 'arteries', { module: 'heart' }),
  part('FJ2633', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2634', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2635', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2636', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2637', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2638', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2639', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2640', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2641', 'Third right anterior branch of anterior interventricular branch of left coronary artery', 'FMA3876', 'arteries', { module: 'heart' }),
  part('FJ2642', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2643', 'Conus branch of anterior interventricular branch of left coronary artery', 'FMA3868', 'arteries', { module: 'heart' }),
  part('FJ2644', 'Conus branch of anterior interventricular branch of left coronary artery', 'FMA3868', 'arteries', { module: 'heart' }),
  part('FJ2645', 'First right anterior branch of anterior interventricular branch of left coronary artery', 'FMA3872', 'arteries', { module: 'heart' }),
  part('FJ2646', 'Second right anterior branch of anterior interventricular branch of left coronary artery', 'FMA3874', 'arteries', { module: 'heart' }),
  part('FJ2647', 'Third right anterior branch of anterior interventricular branch of left coronary artery', 'FMA3876', 'arteries', { module: 'heart' }),
  part('FJ2648', 'Diagonal branch of anterior descending branch of left coronary artery', 'FMA3860', 'arteries', { module: 'heart' }),
  part('FJ2649', 'Circumflex branch of left coronary artery', 'FMA3895', 'arteries', { module: 'heart' }),
  part('FJ2650', 'Circumflex branch of left coronary artery', 'FMA3895', 'arteries', { module: 'heart' }),
  part('FJ2651', 'Circumflex branch of left coronary artery', 'FMA3895', 'arteries', { module: 'heart' }),
  part('FJ2652', 'Circumflex branch of left coronary artery', 'FMA3895', 'arteries', { module: 'heart' }),
  part('FJ2653', 'Circumflex branch of left coronary artery', 'FMA3895', 'arteries', { module: 'heart' }),
  part('FJ2654', 'Circumflex branch of left coronary artery', 'FMA3895', 'arteries', { module: 'heart' }),
  part('FJ2655', 'Coronary sinus', 'FMA4706', 'veins', { module: 'heart' }),
  part('FJ2656', 'Great cardiac vein', 'FMA4707', 'veins', { module: 'heart' }),
  part('FJ2657', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2658', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2659', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2660', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2661', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2662', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2663', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2664', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2665', 'Anterior interventricular vein', 'FMA66403', 'veins', { module: 'heart' }),
  part('FJ2667', 'Marginal branch of right coronary artery', 'FMA3818', 'arteries', { module: 'heart' }),
  part('FJ2668', 'Marginal branch of right coronary artery', 'FMA3818', 'arteries', { module: 'heart' }),
  part('FJ2670', 'Right conus artery', 'FMA3807', 'arteries', { module: 'heart' }),
  part('FJ2671', 'First anterior ventricular branch of right coronary artery', 'FMA3815', 'arteries', { module: 'heart' }),
  part('FJ2672', 'Marginal branch of right coronary artery', 'FMA3818', 'arteries', { module: 'heart' }),
  part('FJ2673', 'First anterior ventricular branch of right coronary artery', 'FMA3815', 'arteries', { module: 'heart' }),
  part('FJ2674', 'Marginal branch of right coronary artery', 'FMA3818', 'arteries', { module: 'heart' }),
  part('FJ2675', 'Marginal branch of right coronary artery', 'FMA3818', 'arteries', { module: 'heart' }),
  part('FJ2676', 'Right conus artery', 'FMA3807', 'arteries', { module: 'heart' }),
  part('FJ2677', 'First anterior ventricular branch of right coronary artery', 'FMA3815', 'arteries', { module: 'heart' }),
  part('FJ2678', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2679', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2680', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2681', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2682', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2683', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2684', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2685', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2686', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2687', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2688', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2689', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2690', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2691', 'Middle cardiac vein', 'FMA4713', 'veins', { module: 'heart' }),
  part('FJ2692', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2693', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2694', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2695', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2696', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2697', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2698', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2699', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2700', 'Posterior interventricular branch of right coronary artery', 'FMA3840', 'arteries', { module: 'heart' }),
  part('FJ2701', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2702', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2703', 'Left marginal vein', 'FMA4708', 'veins', { module: 'heart' }),
  part('FJ2704', 'Left marginal vein', 'FMA4708', 'veins', { module: 'heart' }),
  part('FJ2705', 'Left marginal vein', 'FMA4708', 'veins', { module: 'heart' }),
  part('FJ2706', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2707', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2708', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2709', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2710', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2711', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2712', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2713', 'Posterior vein of left ventricle', 'FMA4712', 'veins', { module: 'heart' }),
  part('FJ2714', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2715', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2716', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2717', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2718', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2719', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2720', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2721', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2722', 'First posterior ventricular branch of right coronary artery', 'FMA3837', 'arteries', { module: 'heart' }),
  part('FJ2723', 'Trunk of right coronary artery', 'FMA3802', 'arteries', { module: 'heart' }),
  part('FJ2724', 'Small cardiac vein', 'FMA4714', 'veins', { module: 'heart' }),
  part('FJ2725', 'Anterior cardiac vein', 'FMA76767', 'veins', { module: 'heart' }),
  part('FJ2727', 'Right marginal vein', 'FMA4716', 'veins', { module: 'heart' }),
  part('FJ2728', 'Right marginal vein', 'FMA4716', 'veins', { module: 'heart' }),
  part('FJ2729', 'Right marginal vein', 'FMA4716', 'veins', { module: 'heart' }),
  part('FJ2730', 'Anterior cardiac vein', 'FMA76767', 'veins', { module: 'heart' }),
  part('FJ2731', 'Small cardiac vein', 'FMA4714', 'veins', { module: 'heart' }),
  part('FJ2732', 'Septal branch of anterior interventricular artery', 'FMA3892', 'arteries', { module: 'heart' }),
  part('FJ2733', 'Septal branch of anterior interventricular artery', 'FMA3892', 'arteries', { module: 'heart' }),
  part('FJ2734', 'Septal branch of anterior interventricular artery', 'FMA3892', 'arteries', { module: 'heart' }),
  part('FJ2735', 'First septal branch of right posterior interventricular artery', 'FMA3847', 'arteries', { module: 'heart' }),
  part('FJ2736', 'Second septal branch of right posterior interventricular artery', 'FMA3848', 'arteries', { module: 'heart' }),
  part('FJ2737', 'Trunk of left coronary artery', 'FMA3855', 'arteries', { module: 'heart' }),
  part('FJ3413', 'Ascending aorta', 'FMA3736', 'arteries', { module: 'heart' }),
  part('FJ3411', 'Arch of aorta', 'FMA3768', 'arteries', { module: 'heart' }),
  part('FJ1931', 'Descending thoracic aorta', 'FMA87217', 'arteries', { module: 'heart' }),
  part('FJ2966', 'Pulmonary trunk', 'FMA8612', 'arteries', { module: 'heart' }),
  part('FJ2924', 'Left pulmonary artery', 'FMA50873', 'arteries', { module: 'heart' }),
  part('FJ3019', 'Right pulmonary artery', 'FMA50872', 'arteries', { module: 'heart' }),
  part('FJ2925', 'Left superior pulmonary vein', 'FMA49916', 'veins', { module: 'heart' }),
  part('FJ2944', 'Left inferior pulmonary vein', 'FMA49913', 'veins', { module: 'heart' }),
  part('FJ3020', 'Right superior pulmonary vein', 'FMA49914', 'veins', { module: 'heart' }),
  part('FJ3040', 'Right inferior pulmonary vein', 'FMA49911', 'veins', { module: 'heart' }),
  part('FJ3645', 'Superior vena cava', 'FMA4720', 'veins', { module: 'heart' }),
  part('FJ3441', 'Inferior vena cava', 'FMA10951', 'veins', { module: 'heart' }),
  part('FJ3417', 'Brachiocephalic artery', 'FMA3932', 'arteries', { module: 'heart' }),
  part('FJ3482', 'Left brachiocephalic vein', 'FMA4761', 'veins', { module: 'heart' }),
  part('FJ3583', 'Right brachiocephalic vein', 'FMA4751', 'veins', { module: 'heart' }),
  part('FJ3479', 'Left subclavian artery', 'FMA4694', 'arteries', { module: 'heart' }),
];

export const MODULE_MANIFESTS = {
  'head-neck': HEAD_NECK_NEURO,
  'shoulder': SHOULDER_MANIFEST,
  'heart': HEART_MANIFEST
};

export const ANATOMY_MANIFEST = Object.values(MODULE_MANIFESTS).flat();

export function validateManifest(manifest = ANATOMY_MANIFEST) {
  const ids = new Set();
  const errors = [];
  for (const item of manifest) {
    if (!item.id || !item.file || !item.name || !item.fma || !item.layer) errors.push(`Incomplete manifest entry: ${JSON.stringify(item)}`);
    if (!LAYERS[item.layer]) errors.push(`Unknown layer ${item.layer} for ${item.id}`);
    if (ids.has(item.id)) errors.push(`Duplicate mesh id: ${item.id}`);
    ids.add(item.id);
  }
  return errors;
}
