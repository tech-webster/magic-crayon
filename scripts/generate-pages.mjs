import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const INK = '#2D3436';

function circle(id, cx, cy, r) { return { shape: 'circle', id, cx, cy, r }; }
function ellipse(id, cx, cy, rx, ry) { return { shape: 'ellipse', id, cx, cy, rx, ry }; }
function rect(id, x, y, w, h, rx = 0) { return { shape: 'rect', id, x, y, width: w, height: h, rx }; }
function path(id, d) { return { shape: 'path', id, d }; }

function page(id, title, category, difficulty, regions, outlines = []) {
  return { id, title, category, difficulty, viewBox: '0 0 200 200', stroke: INK, strokeWidth: 3, regions, outlines };
}

const pages = [];

// ---------- Animals ----------
const animals = [
  { id: 'cat', title: 'Cute Cat', regions: [
    ellipse('head',100,90,42,38), circle('earL',70,58,14), circle('earR',130,58,14),
    ellipse('body',100,150,46,34), circle('eyeL',84,86,6), circle('eyeR',116,86,6),
    ellipse('nose',100,98,5,4), circle('pawL',70,178,9), circle('pawR',130,178,9),
    path('tail','M146 150 Q170 130 160 100'),
  ] },
  { id: 'dog', title: 'Happy Dog', regions: [
    ellipse('head',100,88,44,40), ellipse('earL',62,70,16,26), ellipse('earR',138,70,16,26),
    ellipse('body',100,150,48,36), circle('eyeL',84,84,6), circle('eyeR',116,84,6),
    ellipse('nose',100,96,7,5), circle('pawL',68,178,10), circle('pawR',132,178,10),
  ] },
  { id: 'rabbit', title: 'Bunny', regions: [
    ellipse('head',100,100,40,36), ellipse('earL',78,52,12,34), ellipse('earR',122,52,12,34),
    ellipse('body',100,155,44,32), circle('eyeL',86,96,5), circle('eyeR',114,96,5),
    ellipse('nose',100,106,4,3), circle('pawL',76,180,8), circle('pawR',124,180,8),
  ] },
  { id: 'cat2', title: 'Sleeping Cat', regions: [
    ellipse('body',100,120,52,34), circle('head',60,105,26), ellipse('earL',46,84,9,12), ellipse('earR',74,84,9,12),
    circle('eye',52,102,4), path('tail','M152 120 Q175 100 165 80'),
  ] },
  { id: 'puppy', title: 'Puppy', regions: [
    circle('head',100,80,34), ellipse('body',100,140,40,30),
    ellipse('earL',70,60,12,22), ellipse('earR',130,60,12,22),
    circle('eyeL',88,76,5), circle('eyeR',112,76,5), ellipse('nose',100,88,6,4),
    circle('pawL',78,165,8), circle('pawR',122,165,8),
  ] },
  { id: 'bear', title: 'Teddy Bear', regions: [
    circle('head',100,78,36), circle('earL',72,52,14), circle('earR',128,52,14),
    ellipse('body',100,140,44,40), circle('eyeL',88,74,5), circle('eyeR',112,74,5),
    ellipse('nose',100,86,6,4), circle('pawL',68,170,10), circle('pawR',132,170,10),
  ] },
  { id: 'elephant', title: 'Elephant', regions: [
    ellipse('head',100,90,46,40), ellipse('earL',52,90,24,34), ellipse('earR',148,90,24,34),
    ellipse('trunk',100,135,12,30), ellipse('body',100,160,50,30),
    circle('eyeL',84,84,5), circle('eyeR',116,84,5),
  ] },
  { id: 'giraffe', title: 'Giraffe', regions: [
    ellipse('head',100,40,22,18), rect('neck',90,55,20,55,4),
    ellipse('body',100,145,44,36), circle('spot1',88,135,6), circle('spot2',116,150,7),
    circle('eyeL',92,38,4), circle('eyeR',108,38,4), ellipse('hornL',92,22,3,6), ellipse('hornR',108,22,3,6),
  ] },
  { id: 'monkey', title: 'Monkey', regions: [
    circle('head',100,70,34), ellipse('earL',62,70,12,14), ellipse('earR',138,70,12,14),
    ellipse('body',100,135,38,34), circle('eyeL',88,66,5), circle('eyeR',112,66,5),
    ellipse('mouth',100,82,12,8), circle('pawL',68,150,9), circle('pawR',132,150,9),
  ] },
  { id: 'lion', title: 'Lion', regions: [
    circle('mane',100,80,46), circle('face',100,80,30),
    circle('eyeL',90,74,4), circle('eyeR',110,74,4), ellipse('nose',100,86,5,4),
    ellipse('body',100,150,46,36),
  ] },
];
for (const a of animals) pages.push(page(a.id, a.title, 'Animals', (pages.length % 3) + 1, a.regions, a.outlines));

// ---------- Flowers ----------
const flowers = [];
for (let i = 0; i < 14; i++) {
  const petals = 5 + (i % 4);
  const r = [];
  r.push(ellipse('stem', 100, 150, 4, 40));
  r.push(ellipse('leaf', 78, 145, 14, 8));
  r.push(circle('center', 100, 80, 16));
  for (let p = 0; p < petals; p++) {
    const ang = (p / petals) * Math.PI * 2;
    const cx = 100 + Math.cos(ang) * 30;
    const cy = 80 + Math.sin(ang) * 30;
    r.push(ellipse(`petal${p}`, cx, cy, 14, 10));
  }
  flowers.push({ id: `flower${i+1}`, title: `Flower ${i+1}`, regions: r });
}
for (const f of flowers) pages.push(page(f.id, f.title, 'Flowers', 2, f.regions));

// ---------- Birds ----------
const birds = [
  { id: 'owl', title: 'Owl', regions: [
    ellipse('body',100,110,40,55), circle('head',100,60,34),
    circle('eyeL',88,56,11), circle('eyeR',112,56,11), circle('pupilL',88,56,5), circle('pupilR',112,56,5),
    path('beak','M95 68 L100 78 L105 68 Z'), ellipse('wingL',62,115,14,30), ellipse('wingR',138,115,14,30),
    path('feet','M88 162 L80 172 M112 162 L120 172'),
  ] },
  { id: 'parrot', title: 'Parrot', regions: [
    ellipse('body',100,115,34,48), circle('head',100,62,26),
    ellipse('beak',100,72,12,8), circle('eye',92,58,4),
    path('tail','M100 160 L90 190 L110 190 Z'), ellipse('wing',72,115,12,28),
  ] },
  { id: 'penguin', title: 'Penguin', regions: [
    ellipse('body',100,110,38,60), ellipse('belly',100,118,24,40),
    circle('head',100,52,26), circle('eyeL',90,48,4), circle('eyeR',110,48,4),
    path('beak','M96 58 L100 66 L104 58 Z'), ellipse('footL',84,168,12,6), ellipse('footR',116,168,12,6),
  ] },
  { id: 'duck', title: 'Duck', regions: [
    ellipse('body',100,120,46,34), circle('head',72,80,24),
    ellipse('beak',52,80,14,8), circle('eye',66,76,4),
    path('wing','M80 105 Q100 95 120 105'),
    ellipse('footL',88,150,10,6), ellipse('footR',112,150,10,6),
  ] },
  { id: 'bird', title: 'Little Bird', regions: [
    circle('body',100,110,34), circle('head',100,72,22),
    path('beak','M100 82 L95 90 L105 90 Z'), circle('eye',94,70,4),
    path('wing','M72 105 Q100 90 128 105'), path('tail','M100 144 L90 165 L110 165 Z'),
    ellipse('footL',92,144,6,4), ellipse('footR',108,144,6,4),
  ] },
  { id: 'peacock', title: 'Peacock', regions: [
    circle('body',100,120,26), circle('head',100,78,18),
    ellipse('tail',100,165,55,25), circle('eye',94,76,3),
    circle('feather1',55,160,8), circle('feather2',75,172,8), circle('feather3',100,178,8),
    circle('feather4',125,172,8), circle('feather5',145,160,8),
  ] },
];
for (const b of birds) pages.push(page(b.id, b.title, 'Birds', 2, b.regions, b.outlines));

// ---------- Vehicles ----------
const vehicles = [
  { id: 'car', title: 'Car', regions: [
    rect('body',40,90,120,45,8), rect('roof',60,60,80,35,8),
    circle('wheelL',65,140,14), circle('wheelR',135,140,14),
    rect('windowL',68,66,30,22,4), rect('windowR',102,66,30,22,4),
  ] },
  { id: 'bus', title: 'Bus', regions: [
    rect('body',30,70,140,70,8), rect('stripe',30,100,140,10,0),
    rect('w1',45,82,22,18,3), rect('w2',75,82,22,18,3), rect('w3',105,82,22,18,3), rect('w4',135,82,22,18,3),
    circle('wheelL',60,145,14), circle('wheelR',140,145,14),
  ] },
  { id: 'train', title: 'Train', regions: [
    rect('engine',40,80,70,60,6), rect('carriage',115,90,55,50,6),
    circle('wheel1',55,145,12), circle('wheel2',95,145,12), circle('wheel3',130,145,12), circle('wheel4',155,145,12),
    rect('chimney',55,55,18,25,3), circle('smoke',64,40,10),
    rect('window',55,92,30,20,3),
  ] },
  { id: 'plane', title: 'Airplane', regions: [
    ellipse('body',100,100,60,18), path('wing','M60 100 L30 135 L60 120 Z'), path('wing2','M60 100 L30 65 L60 80 Z'),
    path('tail','M155 100 L180 80 L180 120 Z'), circle('window1',80,100,4), circle('window2',95,100,4), circle('window3',110,100,4),
  ] },
  { id: 'boat', title: 'Boat', regions: [
    path('hull','M30 130 L170 130 L150 160 L50 160 Z'),
    rect('cabin',70,95,60,35,4), path('sail','M100 40 L100 95 L145 95 Z'),
    path('mast','M98 40 L102 40 L102 95 L98 95 Z'),
  ] },
  { id: 'rocket', title: 'Rocket', regions: [
    path('body','M85 40 L115 40 L125 120 L75 120 Z'), path('nose','M85 40 L100 15 L115 40 Z'),
    path('finL','M75 120 L55 150 L75 140 Z'), path('finR','M125 120 L145 150 L125 140 Z'),
    ellipse('window',100,75,12,12), path('flame','M85 120 L100 155 L115 120 Z'),
  ] },
  { id: 'bicycle', title: 'Bicycle', regions: [
    circle('wheelL',60,140,28), circle('wheelR',140,140,28),
    path('frame','M60 140 L100 90 L140 140 L100 110 Z'),
    rect('seat',92,82,16,6,2), rect('handle',132,78,20,6,2),
  ] },
];
for (const v of vehicles) pages.push(page(v.id, v.title, 'Vehicles', 2, v.regions, v.outlines));

// ---------- Fruits ----------
const fruits = [
  { id: 'apple', title: 'Apple', regions: [
    circle('body',100,115,50), rect('stem',96,55,8,14,2),
    path('leaf','M104 58 Q120 48 128 60 Q112 62 104 58'),
  ] },
  { id: 'banana', title: 'Banana', regions: [
    path('body','M50 120 Q100 40 150 120 Q120 150 100 145 Q80 150 50 120 Z'),
    path('tip','M148 118 L160 110 L155 125 Z'),
  ] },
  { id: 'orange', title: 'Orange', regions: [
    circle('body',100,110,48), circle('shine',85,95,6),
    rect('leaf',96,52,8,12,2), path('stem','M100 62 L100 52'),
  ] },
  { id: 'strawberry', title: 'Strawberry', regions: [
    path('body','M60 80 L140 80 L125 170 L75 170 Z'),
    path('leaf1','M70 80 L85 55 L100 80 Z'), path('leaf2','M100 80 L115 55 L130 80 Z'),
    circle('seed1',90,105,3), circle('seed2',110,115,3), circle('seed3',95,135,3), circle('seed4',115,145,3),
  ] },
  { id: 'grapes', title: 'Grapes', regions: [
    circle('g1',80,90,16), circle('g2',120,90,16), circle('g3',100,115,16),
    circle('g4',75,125,16), circle('g5',125,125,16), circle('g6',100,150,16),
    path('stem','M100 70 L100 50'), path('leaf','M100 55 Q120 45 130 60'),
  ] },
  { id: 'watermelon', title: 'Watermelon', regions: [
    path('body','M30 100 A70 70 0 0 1 170 100 L170 130 L30 130 Z'),
    path('rind','M30 130 L170 130 L170 145 L30 145 Z'),
    circle('seed1',60,115,3), circle('seed2',90,120,3), circle('seed3',120,118,3), circle('seed4',150,115,3),
  ] },
  { id: 'cherry', title: 'Cherry', regions: [
    circle('c1',70,120,24), circle('c2',130,120,24),
    path('stem1','M70 96 L95 60'), path('stem2','M130 96 L105 60'),
    path('leaf','M95 60 Q100 45 115 55'),
  ] },
  { id: 'pineapple', title: 'Pineapple', regions: [
    ellipse('body',100,125,40,55),
    path('leaf1','M80 70 L90 40 L100 70 Z'), path('leaf2','M100 70 L110 38 L120 70 Z'), path('leaf3','M90 72 L100 45 L110 72 Z'),
    path('d1','M75 100 L85 100'), path('d2','M115 100 L125 100'),
  ] },
];
for (const f of fruits) pages.push(page(f.id, f.title, 'Fruits', 2, f.regions, f.outlines));

// ---------- Vegetables ----------
const veggies = [
  { id: 'carrot', title: 'Carrot', regions: [
    path('body','M90 60 L110 60 L118 170 L82 170 Z'),
    path('leaf1','M92 60 L85 35 L98 55 Z'), path('leaf2','M100 58 L100 30 L108 55 Z'), path('leaf3','M108 60 L115 35 L102 55 Z'),
  ] },
  { id: 'tomato', title: 'Tomato', regions: [
    circle('body',100,115,46), path('stem','M96 69 L104 69 L104 58 L96 58 Z'),
    path('leaf1','M96 62 L88 50 L100 58 Z'), path('leaf2','M104 62 L112 50 L100 58 Z'),
  ] },
  { id: 'broccoli', title: 'Broccoli', regions: [
    circle('top1',80,70,22), circle('top2',120,70,22), circle('top3',100,55,22),
    rect('stem',92,88,16,70,4),
  ] },
  { id: 'corn', title: 'Corn', regions: [
    ellipse('body',100,110,26,55),
    path('huskL','M74 90 L60 120 L74 150'), path('huskR','M126 90 L140 120 L126 150'),
    path('silk','M92 55 L88 40'), path('silk2','M100 55 L100 38'), path('silk3','M108 55 L112 40'),
  ] },
  { id: 'pepper', title: 'Bell Pepper', regions: [
    path('body','M60 90 Q55 130 75 160 Q100 175 125 160 Q145 130 140 90 Q100 70 60 90 Z'),
    rect('stem',94,60,12,22,3), path('leaf','M94 68 Q80 55 90 50'),
  ] },
  { id: 'eggplant', title: 'Eggplant', regions: [
    path('body','M70 90 Q60 140 90 170 Q100 175 110 170 Q140 140 130 90 Q100 75 70 90 Z'),
    rect('stem',94,62,12,18,3), path('cap','M88 62 Q100 50 112 62'),
  ] },
];
for (const v of veggies) pages.push(page(v.id, v.title, 'Vegetables', 2, v.regions, v.outlines));

// ---------- Sea creatures ----------
const sea = [
  { id: 'octopus', title: 'Octopus', regions: [
    ellipse('head',100,75,44,40),
    circle('eyeL',84,70,6), circle('eyeR',116,70,6),
    path('t1','M60 105 Q40 135 55 165'), path('t2','M75 110 Q60 145 75 175'),
    path('t3','M90 115 Q85 150 95 180'), path('t4','M110 115 Q115 150 105 180'),
    path('t5','M125 110 Q140 145 125 175'), path('t6','M140 105 Q160 135 145 165'),
  ] },
  { id: 'crab', title: 'Crab', regions: [
    ellipse('body',100,100,46,30),
    circle('eyeL',80,88,6), circle('eyeR',120,88,6),
    path('clawL','M54 95 L30 80 L40 105 Z'), path('clawR','M146 95 L170 80 L160 105 Z'),
    path('legL1','M60 125 L40 140'), path('legL2','M65 130 L45 148'),
    path('legR1','M140 125 L160 140'), path('legR2','M135 130 L155 148'),
  ] },
  { id: 'whale', title: 'Whale', regions: [
    ellipse('body',95,110,60,38), path('tail','M155 110 L185 85 L185 135 Z'),
    circle('eye',60,100,5), path('fin','M80 135 L60 155 L90 145 Z'),
    path('spout','M70 72 L65 55'), path('spout2','M78 70 L75 50'),
  ] },
  { id: 'dolphin', title: 'Dolphin', regions: [
    path('body','M40 110 Q80 70 130 95 Q160 110 145 130 Q100 150 40 130 Z'),
    path('fin','M95 125 L85 150 L105 140 Z'), path('tail','M145 115 L175 95 L175 135 Z'),
    circle('eye',60,100,4),
  ] },
  { id: 'jellyfish', title: 'Jellyfish', regions: [
    path('bell','M40 90 Q100 30 160 90 L160 105 L40 105 Z'),
    path('t1','M55 105 Q50 145 60 180'), path('t2','M75 105 Q70 150 80 185'),
    path('t3','M100 105 Q95 155 105 190'), path('t4','M125 105 Q130 150 120 185'),
    path('t5','M145 105 Q150 145 140 180'),
  ] },
  { id: 'seahorse', title: 'Seahorse', regions: [
    circle('head',95,55,20), path('body','M95 75 Q80 110 85 150 Q90 175 100 185'),
    path('tail','M100 185 Q120 175 115 160'), ellipse('fin',78,95,10,6),
    circle('eye',88,52,3),
  ] },
  { id: 'starfish', title: 'Starfish', regions: [
    path('arm1','M100 100 L100 50 L115 85 Z'), path('arm2','M100 100 L145 75 L125 100 Z'),
    path('arm3','M100 100 L140 135 L110 120 Z'), path('arm4','M100 100 L80 145 L90 115 Z'),
    path('arm5','M100 100 L55 105 L85 95 Z'), circle('center',100,100,14),
  ] },
];
for (const s of sea) pages.push(page(s.id, s.title, 'Sea Creatures', 2, s.regions, s.outlines));

// ---------- Nature / Space / Cartoon / Festivals ----------
const nature = [
  { id: 'tree', title: 'Tree', regions: [
    rect('trunk',88,120,24,60,4),
    circle('c1',100,80,40), circle('c2',70,95,30), circle('c3',130,95,30),
  ] },
  { id: 'leaf', title: 'Leaf', regions: [
    path('body','M100 40 Q160 100 100 170 Q40 100 100 40 Z'),
    path('vein','M100 45 L100 165'),
  ] },
  { id: 'mountain', title: 'Mountain', regions: [
    path('m1','M20 170 L90 60 L160 170 Z'), path('snow','M90 60 L75 85 L105 85 Z'),
    circle('sun',165,50,16),
  ] },
  { id: 'flower2', title: 'Sunflower', regions: [
    circle('center',100,90,22),
    ...Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2;return ellipse(`p${i}`,100+Math.cos(a)*38,90+Math.sin(a)*38,14,22);}),
    rect('stem',96,112,8,60,2),
  ] },
  { id: 'rainbow', title: 'Rainbow', regions: [
    path('r1','M30 150 A70 70 0 0 1 170 150'), path('r2','M45 150 A55 55 0 0 1 155 150'),
    path('r3','M60 150 A40 40 0 0 1 140 150'), path('r4','M75 150 A25 25 0 0 1 125 150'),
    path('cloudL','M30 150 L20 165 L45 160 Z'), path('cloudR','M170 150 L180 165 L155 160 Z'),
  ] },
];
for (const n of nature) pages.push(page(n.id, n.title, 'Nature', 2, n.regions, n.outlines));

const cartoon = [
  { id: 'smiley', title: 'Smiley Face', regions: [
    circle('face',100,100,55), circle('eyeL',80,85,8), circle('eyeR',120,85,8),
    path('mouth','M70 115 Q100 145 130 115'),
  ] },
  { id: 'robot', title: 'Robot', regions: [
    rect('head',60,40,80,60,8), rect('body',55,105,90,60,8),
    circle('eyeL',82,62,8), circle('eyeR',118,62,8),
    rect('mouth',75,78,50,10,3),
    rect('armL',30,115,25,12,4), rect('armR',145,115,25,12,4),
    rect('legL',70,165,20,25,4), rect('legR',110,165,20,25,4),
  ] },
  { id: 'ghost', title: 'Ghost', regions: [
    path('body','M60 70 Q100 30 140 70 L140 160 Q120 175 100 160 Q80 175 60 160 Z'),
    circle('eyeL',85,85,8), circle('eyeR',115,85,8), path('mouth','M90 110 Q100 120 110 110'),
  ] },
  { id: 'monster', title: 'Cute Monster', regions: [
    ellipse('body',100,110,50,60), circle('eyeL',80,90,12), circle('eyeR',120,90,12),
    circle('pupilL',80,90,5), circle('pupilR',120,90,5),
    path('mouth','M85 130 Q100 145 115 130'),
    path('hornL','M60 70 L70 45 L80 70 Z'), path('hornR','M120 70 L130 45 L140 70 Z'),
  ] },
  { id: 'cattoon', title: 'Cartoon Cat', regions: [
    circle('head',100,80,40), path('earL','M65 60 L75 35 L85 60 Z'), path('earR','M115 60 L125 35 L135 60 Z'),
    circle('eyeL',88,76,7), circle('eyeR',112,76,7),
    ellipse('nose',100,90,5,4), path('mouth','M95 98 Q100 104 105 98'),
    ellipse('body',100,150,42,38),
  ] },
];
for (const c of cartoon) pages.push(page(c.id, c.title, 'Cartoon', 2, c.regions, c.outlines));

const festivals = [
  { id: 'pumpkin', title: 'Pumpkin', regions: [
    ellipse('body',100,118,58,46), rect('stem',92,58,16,24,4),
    ellipse('leaf',124,66,18,9), circle('eyeL',78,108,7), circle('eyeR',122,108,7),
    ellipse('mouth',100,138,22,8),
  ] },
  { id: 'snowman', title: 'Snowman', regions: [
    circle('bottom',100,150,42), circle('middle',100,95,30), circle('head',100,48,22),
    rect('hat',78,18,44,18,4), rect('brim',70,34,60,8,4),
    circle('eyeL',90,44,3), circle('eyeR',110,44,3), circle('btn1',100,90,4), circle('btn2',100,105,4),
  ], outlines: [{ d: 'M96 52 L104 52 L100 60 Z' }] },
  { id: 'christmastree', title: 'Christmas Tree', regions: [
    path('t1','M100 40 L60 90 L140 90 Z'), path('t2','M100 75 L50 125 L150 125 Z'),
    path('t3','M100 110 L40 165 L160 165 Z'), rect('trunk',90,165,20,20,3),
    circle('star',100,32,8), circle('orn1',85,95,5), circle('orn2',115,100,5), circle('orn3',75,135,5), circle('orn4',125,140,5),
  ] },
  { id: 'diya', title: 'Diya Lamp', regions: [
    path('lamp','M50 120 Q100 150 150 120 L140 145 L60 145 Z'),
    path('flame','M95 95 L100 70 L105 95 Z'), path('wick','M98 95 L102 95 L102 105 L98 105 Z'),
  ] },
  { id: 'fireworks', title: 'Fireworks', regions: [
    circle('burst1',60,60,14), circle('burst2',140,55,12), circle('burst3',100,140,16),
    path('ray1','M60 46 L60 30'), path('ray2','M46 60 L30 60'), path('ray3','M74 60 L90 60'),
    path('ray4','M60 74 L60 90'), path('ray5','M140 43 L140 27'), path('ray6','M128 55 L112 55'),
  ] },
];
for (const f of festivals) pages.push(page(f.id, f.title, 'Festivals', 2, f.regions, f.outlines));

const space = [
  { id: 'planet', title: 'Planet', regions: [
    circle('planet',100,100,45), ellipse('ring',100,100,75,18),
    circle('moon',165,60,10), circle('star1',40,50,3), circle('star2',170,130,3), circle('star3',30,140,3),
  ] },
  { id: 'astronaut', title: 'Astronaut', regions: [
    circle('helmet',100,70,34), rect('suit',66,100,68,60,10),
    circle('visor',100,70,22), rect('armL',40,110,26,12,4), rect('armR',134,110,26,12,4),
    rect('legL',78,160,18,30,4), rect('legR',104,160,18,30,4),
  ] },
  { id: 'ufo', title: 'UFO', regions: [
    ellipse('dome',100,80,30,22), path('base','M40 105 L160 105 L145 125 L55 125 Z'),
    circle('light1',70,115,5), circle('light2',100,115,5), circle('light3',130,115,5),
    path('beam','M70 125 L50 170 L150 170 L130 125 Z'),
  ] },
  { id: 'saturn', title: 'Saturn', regions: [
    circle('planet',100,100,38), ellipse('ring',100,100,70,20),
    circle('moon',160,55,8),
  ] },
  { id: 'comet', title: 'Comet', regions: [
    circle('head',60,80,18), path('tail','M78 80 L170 60 L160 95 L78 95 Z'),
    circle('star1',175,50,3), circle('star2',150,120,3), circle('star3',180,110,3),
  ] },
];
for (const s of space) pages.push(page(s.id, s.title, 'Space', 2, s.regions, s.outlines));

// ---------- Birds (own category? reuse Animals? add as Nature? keep Animals) ----------
// Add some bird pages under Animals
const birdPages = [
  { id: 'owl2', title: 'Owl', regions: [
    ellipse('body',100,115,40,55), circle('head',100,62,34),
    circle('eyeL',88,58,11), circle('eyeR',112,58,11), circle('pupilL',88,58,5), circle('pupilR',112,58,5),
    path('beak','M95 70 L100 80 L105 70 Z'), ellipse('wingL',62,120,14,30), ellipse('wingR',138,120,14,30),
  ] },
  { id: 'parrot2', title: 'Parrot', regions: [
    ellipse('body',100,120,34,48), circle('head',100,68,26),
    ellipse('beak',100,78,12,8), circle('eye',92,64,4),
    path('tail','M100 165 L90 192 L110 192 Z'), ellipse('wing',72,120,12,28),
  ] },
  { id: 'penguin2', title: 'Penguin', regions: [
    ellipse('body',100,115,38,60), ellipse('belly',100,123,24,40),
    circle('head',100,57,26), circle('eyeL',90,53,4), circle('eyeR',110,53,4),
    path('beak','M96 63 L100 71 L104 63 Z'), ellipse('footL',84,173,12,6), ellipse('footR',116,173,12,6),
  ] },
];
for (const b of birdPages) pages.push(page(b.id, b.title, 'Birds', 2, b.regions, b.outlines));

// ---------- Flowers (Nature) extra ----------
const extraFlowers = [];
for (let i = 0; i < 10; i++) {
  const petals = 6 + (i % 3);
  const r = [];
  r.push(rect('stem', 96, 110, 8, 60, 2));
  r.push(ellipse('leaf', 78, 140, 14, 8));
  r.push(circle('center', 100, 75, 14));
  for (let p = 0; p < petals; p++) {
    const ang = (p / petals) * Math.PI * 2;
    const cx = 100 + Math.cos(ang) * 28;
    const cy = 75 + Math.sin(ang) * 28;
    r.push(ellipse(`petal${p}`, cx, cy, 12, 9));
  }
  extraFlowers.push({ id: `bloom${i+1}`, title: `Bloom ${i+1}`, regions: r });
}
for (const f of extraFlowers) pages.push(page(f.id, f.title, 'Flowers', 2, f.regions));

// ---------- Extra pages to reach 100+ ----------
const extra = [];
for (let i = 0; i < 5; i++) {
  // butterflies
  extra.push(page(`butterfly${i+2}`, `Butterfly ${i+2}`, 'Animals', 2, [
    ellipse('wingUL', 60, 72, 40, 32), ellipse('wingUR', 140, 72, 40, 32),
    ellipse('wingLL', 66, 134, 30, 26), ellipse('wingLR', 134, 134, 30, 26),
    ellipse('body', 100, 104, 9, 42), circle('head', 100, 58, 11),
  ]));
}
for (let i = 0; i < 5; i++) {
  extra.push(page(`fish${i+2}`, `Fish ${i+2}`, 'Sea Creatures', 2, [
    ellipse('body', 88, 100, 50, 34),
    path('tail', 'M135 100 L172 72 L172 128 Z'),
    path('topFin', 'M78 68 Q92 46 108 68 Z'),
    circle('eye', 58, 90, 6),
  ]));
}
for (let i = 0; i < 5; i++) {
  extra.push(page(`star${i+2}`, `Star ${i+2}`, 'Space', 1, [
    path('star', 'M100 30 L118.8 74.2 L166.6 78.4 L130.4 108.6 L141.2 155.8 L100 130 L58.8 155.8 L69.6 108.6 L33.4 78.4 L81.2 74.2 Z'),
    circle('eyeL', 88, 95, 4), circle('eyeR', 112, 95, 4),
  ]));
}
for (let i = 0; i < 5; i++) {
  extra.push(page(`heart${i+1}`, `Heart ${i+1}`, 'Nature', 1, [
    path('heart', 'M100 160 C60 120 40 90 60 70 C75 55 90 65 100 80 C110 65 125 55 140 70 C160 90 140 120 100 160 Z'),
  ]));
}
for (const e of extra) pages.push(e);

writeFileSync(join(root, 'src', 'data', 'generatedPages.ts'),
`import type { ColoringPage } from '@/types/coloring';\n\nexport const GENERATED_PAGES: ColoringPage[] = ${JSON.stringify(pages, null, 2)};\n`);
console.log('generated', pages.length, 'pages');


