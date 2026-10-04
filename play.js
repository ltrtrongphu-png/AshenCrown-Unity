import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js';

const $=id=>document.getElementById(id);
const canvas=$('game'), scene=new THREE.Scene();
scene.background=new THREE.Color(0x080a0d); scene.fog=new THREE.Fog(0x14100d,32,180);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const camera=new THREE.PerspectiveCamera(55,1,.1,260); camera.position.set(0,4,8);
scene.add(new THREE.HemisphereLight(0xcbb29e,0x090706,1.5));
const sun=new THREE.DirectionalLight(0xffc39d,2.2); sun.position.set(-18,22,12); sun.castShadow=true; sun.shadow.mapSize.set(1536,1536); sun.shadow.camera.left=-100; sun.shadow.camera.right=100; sun.shadow.camera.top=100; sun.shadow.camera.bottom=-100; sun.shadow.camera.far=260; scene.add(sun);
const world=new THREE.Group(), characters=new THREE.Group(), props=new THREE.Group(), effects=new THREE.Group(); scene.add(world);
world.add(characters,props,effects);

const state={day:1,xp:0,level:1,hp:100,stamina:100,coins:40,shards:0,echoes:0,quest:0,chapter:1,rep:{lyra:0,orren:0,seer:0},flags:{gate:false,truth:false},inventory:[],equipment:{core:null,charm:null,armor:null,relic:null},stats:{vitality:0,focus:0,ward:0},meta:{renown:0,mastery:0,legacy:0,points:0,contracts:0},tutorial:true,log:['You wake beneath the sanctuary with an ember glowing in your palm.']};
const keys={}; let yaw=0,pitch=.28,drag=false,lx=0,ly=0,time=0,toastTimer=0,encounter=null;
const player=new THREE.Group(); player.position.set(0,0,7); characters.add(player);

const mat=(c,r=.75,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const orb=(r,c,glow=false)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat(c,.4,.1));if(glow)m.material.emissive=new THREE.Color(c).multiplyScalar(1.5);return m};
const box=(x,y,z,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),mat(c));m.castShadow=true;return m};
function actor(c,a){const g=new THREE.Group(),body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,1,6,12),mat(c,.65,.15));body.position.y=1;body.castShadow=true;g.add(body);const head=orb(.34,0xd0b9a5);head.position.y=1.9;g.add(head);const hood=new THREE.Mesh(new THREE.ConeGeometry(.42,.55,8),mat(a));hood.position.y=2.15;g.add(hood);const core=orb(.13,0xff8245,true);core.position.set(0,1.1,.35);g.add(core);return g}
player.add(actor(0x29221d,0x613724)); const cape=box(.75,.9,.12,0x151213);cape.position.set(0,1,-.38);cape.castShadow=true;player.add(cape);

const groundMat=mat(0x17140f,.98);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(240,240,48,48),groundMat);
ground.rotation.x=-Math.PI/2;
world.add(ground);

const grid=new THREE.GridHelper(120,60,0x332a24,0x1b1714);
grid.material.opacity=.10;
grid.material.transparent=true;
world.add(grid);

const paths=new THREE.Group();
world.add(paths);

function path(x,z,w,d,rot=0,color=0x2a201a){
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(color,.995));
  p.rotation.x=-Math.PI/2;
  p.rotation.z=rot;
  p.position.set(x,.018,z);
  paths.add(p);
}

path(0,0,7,92);
path(0,-24,62,4);
path(12,-8,4,76,Math.PI/2);
path(-22,14,4,70,Math.PI/2);
path(42,38,58,4,-.42,0x32271f);
path(-56,-34,48,4,.28,0x29221c);

const worldMats=new Map();
function wmat(key,color,roughness=.78,metalness=0,emission=0){
  const cached=worldMats.get(key);
  if(cached)return cached;
  const m=mat(color,roughness,metalness);
  if(emission>0){
    m.emissive=new THREE.Color(color);
    m.emissiveIntensity=emission;
  }
  worldMats.set(key,m);
  return m;
}
function wbox(x,y,z,color,key,emission=0){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),wmat(key,color,.78,0,emission));
  mesh.castShadow=true;
  mesh.receiveShadow=true;
  return mesh;
}
function tree(x,z,s=1,variant=0){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  g.scale.setScalar(s);
  const trunk=wbox(.36,2.2,.36,0x3b2920,'trunk');
  trunk.position.y=1.1;
  g.add(trunk);

  const crownColor=variant%3===0?0x25362b:variant%3===1?0x30422d:0x1d3028;
  const lower=orb(.95,crownColor);
  lower.material=wmat('leaf'+(variant%3),crownColor,.92);
  lower.position.set(0,2.15,0);
  lower.scale.set(1.1,.92,1.1);
  lower.castShadow=true;
  g.add(lower);

  const upper=orb(.62,crownColor);
  upper.material=wmat('leaf'+(variant%3),crownColor,.92);
  upper.position.set(.12,2.9,-.03);
  upper.castShadow=true;
  g.add(upper);

  props.add(g);
  return g;
}

const treeSpots=[];
for(let i=0;i<118;i++){
  const a=i*2.399;
  const rx=28+(i%11)*6.3;
  const rz=24+(i%9)*6.8;
  const x=Math.sin(a*1.21)*rx+(i%3-1)*6;
  const z=Math.cos(a*.93)*rz+(i%4-1.5)*7;
  if(Math.abs(x)<12&&Math.abs(z)<15)continue;
  treeSpots.push(tree(x,z,.72+(i%5)*.09,i));
}

function rock(x,z,s=1){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  g.rotation.y=(x*0.17+z*0.09);
  const r=new THREE.Mesh(new THREE.DodecahedronGeometry(.75,1),wmat('rock',0x45413b,.94));
  r.scale.set(1.3*s,.72*s,.95*s);
  r.position.y=.48*s;
  r.castShadow=true;
  r.receiveShadow=true;
  g.add(r);
  props.add(g);
  return g;
}

function bush(x,z,s=1,c=0x33452f){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  const a=orb(.52*s,c); a.material=wmat('bush'+c.toString(16),c,.96); a.position.set(-.3*s,.46*s,0); g.add(a);
  const b=orb(.6*s,c); b.material=a.material; b.position.set(.24*s,.52*s,.08); g.add(b);
  props.add(g);
  return g;
}

for(let i=0;i<76;i++){
  const a=i*1.71;
  const r=20+(i%8)*9;
  rock(Math.sin(a*1.31)*r,Math.cos(a*.82)*r,.55+(i%4)*.14);
}
for(let i=0;i<54;i++){
  const a=i*2.13;
  const r=18+(i%6)*10;
  bush(Math.cos(a*1.2)*r,Math.sin(a*.77)*r,.65+(i%3)*.14);
}

function lantern(x,z,tall=1){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  const p=wbox(.10,2.2*tall,.10,0x29231f,'lanternPole');
  p.position.y=1.1*tall;
  g.add(p);
  const cap=wbox(.26,.12,.26,0x4a3527,'lanternCap');
  cap.position.y=2.22*tall;
  g.add(cap);
  const l=orb(.18,0xff9a58,true);
  l.material=wmat('lanternGlow',0xff8b4c,.24,.04,3.2);
  l.position.y=2.08*tall;
  l.castShadow=false;
  g.add(l);
  const glow=new THREE.PointLight(0xff8a4d,1.1,7*tall);
  glow.position.set(0,2.05*tall,0);
  g.add(glow);
  props.add(g);
}
[[-7,-4,1],[7,-4,1],[-8,7,.8],[8,7,.8],[0,-13,1],[-17,-20,.8],[18,-22,.8],[36,-7,.9],[-36,8,.9]].forEach(p=>lantern(...p));

function house(x,z,s=1,rot=0,variant=0,name='House'){
  const g=new THREE.Group();
  g.name=name;
  g.position.set(x,0,z);
  g.rotation.y=rot;
  g.scale.setScalar(s);

  const foundation=wbox(6.0,.45,5.0,0x42372f,'foundation');
  foundation.position.y=.23;
  g.add(foundation);

  const wallColor=variant%3===0?0x665247:variant%3===1?0x5b4c42:0x6d5c4d;
  const walls=wbox(5.5,3.5,4.55,wallColor,'houseWall'+variant);
  walls.position.y=1.95;
  g.add(walls);

  const roof=new THREE.Mesh(
    new THREE.ConeGeometry(3.85,2.65,4),
    wmat('roof'+(variant%3),variant%3===0?0x2d2521:variant%3===1?0x3a2a27:0x252b30,.9)
  );
  roof.position.y=4.95;
  roof.rotation.y=Math.PI/4;
  roof.castShadow=true;
  g.add(roof);

  const door=wbox(1.0,1.95,.16,0x2c211b,'door');
  door.position.set(0,1.25,-2.31);
  g.add(door);

  const step=wbox(1.35,.18,.65,0x51443a,'step');
  step.position.set(0,.32,-2.65);
  g.add(step);

  for(const sx of [-1.72,1.72]){
    const beam=wbox(.18,3.65,.22,0x382a22,'beam');
    beam.position.set(sx,2.0,-2.33);
    g.add(beam);
  }

  for(const sx of [-1.65,1.65]){
    const window=wbox(.9,.8,.12,0x8f6b4f,'window',variant>0?0.35:0.15);
    window.position.set(sx,2.25,-2.34);
    g.add(window);
  }

  const chimney=new THREE.Mesh(new THREE.CylinderGeometry(.36,.42,1.35,8),wmat('chimney',0x4e3d34,.96));
  chimney.position.set(1.4,5.2,.8);
  chimney.castShadow=true;
  g.add(chimney);

  const sign=wbox(.9,.5,.08,0x2e261f,'houseSign');
  sign.position.set(-2.0,2.55,-2.38);
  g.add(sign);

  props.add(g);
  return g;
}

function well(x,z,s=1){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.55*s,1.75*s,.75*s,14),wmat('wellStone',0x59514a,.94));
  base.position.y=.38*s;
  base.castShadow=true;
  g.add(base);
  const water=new THREE.Mesh(new THREE.CircleGeometry(1.18*s,32),wmat('wellWater',0x274c56,.25,.05));
  water.rotation.x=-Math.PI/2;
  water.position.y=.78*s;
  g.add(water);
  for(const sx of [-1,1]){
    const post=wbox(.18*s,2.4*s,.18*s,0x3f2b23,'wellWood');
    post.position.set(sx*1.2*s,1.55*s,0);
    g.add(post);
  }
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1.7*s,.65*s,4),wmat('wellRoof',0x352620,.9));
  roof.position.y=2.55*s;
  roof.rotation.y=Math.PI/4;
  g.add(roof);
  props.add(g);
}

function fence(x,z,len=8,rot=0){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  g.rotation.y=rot;
  for(let i=0;i<=len;i++){
    const post=wbox(.14,1.25,.14,0x4a3528,'fencePost');
    post.position.set(i-len/2,.62,0);
    g.add(post);
    if(i<len){
      const rail=wbox(1.05,.12,.10,0x4a3528,'fenceRail');
      rail.position.set(i-len/2+.5,.92,0);
      g.add(rail);
      const rail2=rail.clone();
      rail2.position.y=.45;
      g.add(rail2);
    }
  }
  props.add(g);
}

function bridge(x,z,len=14,rot=0){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  g.rotation.y=rot;
  for(let i=0;i<len;i++){
    const plank=wbox(1.0,.18,2.1,0x5a4131,'bridgePlank');
    plank.position.set(i-len/2+.5,.28,0);
    g.add(plank);
  }
  for(const sz of [-1,1]){
    const rail=wbox(len,.18,.16,0x4a3326,'bridgeRail');
    rail.position.set(0,1.15,sz*1.05);
    g.add(rail);
  }
  props.add(g);
}

function pond(x,z,rx,rz){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  const shore=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.20,64),wmat('shore',0x423b33,.98));
  shore.scale.set(rx,1,rz);
  shore.position.y=.09;
  g.add(shore);
  const water=new THREE.Mesh(new THREE.CircleGeometry(1,64),wmat('pondWater',0x2d5559,.16,.12));
  water.rotation.x=-Math.PI/2;
  water.scale.set(rx*.9,rz*.9,1);
  water.position.y=.13;
  g.add(water);
  props.add(g);
}

function ruin(x,z,s=1){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  g.rotation.y=(x+z)*.03;
  for(const p of [[-2,1,0],[2,1,.2],[-1.2,1,1.8],[1.4,1,1.7]]){
    const wall=wbox(1.0,2.0,1.0,0x4d4843,'ruinStone');
    wall.position.set(p[0]*s,p[1]*s,p[2]*s);
    wall.rotation.y=.15;
    g.add(wall);
  }
  const broken=new THREE.Mesh(new THREE.TetrahedronGeometry(1.1*s,0),wmat('ruinTop',0x5a534c,.97));
  broken.position.set(0,2.5*s,.4*s);
  broken.rotation.set(.2,.4,.15);
  g.add(broken);
  props.add(g);
}

[
  [-13,17,1.0,.1],[-5,20,.9,-.2],[4,19,.95,.18],[13,17,.88,-.08]
].forEach((p,i)=>house(p[0],p[1],p[2],p[3],i%3,'Sanctuary House '+(i+1)));
well(0,15,1.05);
fence(-13,14,10,.04); fence(13,14,10,.04);

[
  [-20,-28,1.15,.25],[0,-31,1.05,-.18],[19,-28,1.1,.1],[38,34,1.25,-.2],[55,38,1.05,.25]
].forEach((p,i)=>house(p[0],p[1],p[2],p[3],(i+1)%3,'Roadside House '+(i+1)));
well(0,-26,.95);
fence(-21,-23,9,.1); fence(21,-24,9,-.06);

pond(-38,-28,11,7);
pond(57,-35,13,9);
bridge(-38,-28,12,.18);
bridge(55,-35,14,-.22);

[
  [52,-2,1.2],[65,3,1.0],[61,17,1.3],[42,10,.9],[73,-11,1.15],[35,-18,1.25]
].forEach(p=>ruin(p[0],p[1],p[2]));

function campfire(x,z){
  const g=new THREE.Group();
  g.position.set(x,0,z);
  for(let i=0;i<6;i++){
    const log=wbox(.22,1.2,.22,0x503226,'fireLog');
    log.position.set(Math.cos(i*Math.PI/3)*.42,.18,Math.sin(i*Math.PI/3)*.42);
    log.rotation.z=Math.PI/2;
    log.rotation.y=i*Math.PI/3;
    g.add(log);
  }
  const flame=orb(.24,0xff7442,true);
  flame.material=wmat('fire',0xff733e,.3,.02,4);
  flame.position.y=.72;
  g.add(flame);
  const light=new THREE.PointLight(0xff7542,1.7,9);
  light.position.y=.75;
  g.add(light);
  props.add(g);
}
[[-1,-1],[17,12],[-17,-30],[37,-6],[49,39],[-49,-14]].forEach(p=>campfire(...p));

const npcs=[
 {id:'lyra',name:'Lyra',role:'Sanctuary Keeper',pos:[-5,-3],c:0x70432f,a:0xb8784d},
 {id:'orren',name:'Orren',role:'Wayfinder',pos:[7,-1],c:0x384456,a:0x6f86a5},
 {id:'seer',name:'The Seer',role:'Keeper of Echoes',pos:[13,-8],c:0x493b63,a:0x9272c4}
].map(n=>{const g=new THREE.Group();g.position.set(n.pos[0],0,n.pos[1]);g.add(actor(n.c,n.a));characters.add(g);return {...n,root:g}});

const nodes=[];
function node(type,x,z,c,label){const g=new THREE.Group();g.position.set(x,0,z);const o=orb(.32,c,true);o.position.y=.5;g.add(o);const r=new THREE.Mesh(new THREE.TorusGeometry(.55,.035,8,24),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.5}));r.rotation.x=Math.PI/2;g.add(r);props.add(g);nodes.push({type,x,z,label,root:g,collected:false})}
node('ember',-10,-6,0xff7040,'Emberleaf');node('ember',-14,2,0xff7040,'Emberleaf');node('echo',10,4,0x9b78dc,'Memory Echo');node('echo',15,2,0x9b78dc,'Memory Echo');node('relic',3,-13,0xd7b36a,'Ancient Relic');

const gates=[['Ashen Gate',0,-16,0],['Hollow Ruins',58,-8,2],['Starless Path',-58,13,4],['Veil Lake',-38,-28,5],['Crown Road',48,38,6],['Moonlit Hamlet',-4,20,1],['Riverlands',-38,-28,2],['Glass Observatory',72,24,7]].map(([name,x,z,unlock])=>{const g=new THREE.Group();g.position.set(x,0,z);const r=new THREE.Mesh(new THREE.TorusGeometry(2,.17,10,32),new THREE.MeshStandardMaterial({color:0x5d3b2d,emissive:0x281008}));r.rotation.x=Math.PI/2;g.add(r);props.add(g);return{name,x,z,unlock,root:g}});

const wildlife=[];
const wildlifeTypes=[
  {type:'deer',color:0x8b5f3e,scale:1.0,speed:1.25},
  {type:'rabbit',color:0x8f8275,scale:.55,speed:1.55},
  {type:'boar',color:0x3f332c,scale:.82,speed:1.05},
  {type:'fox',color:0xa55432,scale:.72,speed:1.35}
];

function animalPart(type){
  if(type==='deer'){
    const g=new THREE.Group();
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(.38,.85,6,10),wmat('deerBody',0x8b5f3e,.9));
    body.rotation.z=Math.PI/2; body.position.y=.8; g.add(body);
    const head=orb(.24,0x8b5f3e); head.material=body.material; head.position.set(.55,1.16,0); g.add(head);
    for(const sx of [-.27,.27])for(const z of [-.21,.21]){
      const leg=wbox(.12,.75,.12,0x67452f,'deerLeg');leg.position.set(sx,.38,z);g.add(leg);
    }
    const antlerMat=wmat('antler',0x5c4638,.97);
    for(const sx of [-.10,.10]){
      const ant=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,.42,6),antlerMat);
      ant.position.set(.67,1.45,sx); ant.rotation.z=sx>0?.28:-.28; g.add(ant);
    }
    return g;
  }
  if(type==='rabbit'){
    const g=new THREE.Group();
    const body=orb(.28,0x8f8275);body.position.y=.42;g.add(body);
    const head=orb(.22,0x9c9085);head.position.set(.22,.62,0);g.add(head);
    for(const z of [-.10,.10]){
      const ear=wbox(.08,.34,.06,0xb1a89e,'rabbitEar');ear.position.set(.24,.9,z);g.add(ear);
    }
    const tail=orb(.11,0xc6beb3);tail.position.set(-.25,.51,0);g.add(tail);
    return g;
  }
  if(type==='boar'){
    const g=new THREE.Group();
    const body=orb(.48,0x3f332c);body.scale.set(1.25,.72,.82);body.position.y=.62;g.add(body);
    const head=orb(.33,0x4b3a31);head.position.set(.53,.72,0);g.add(head);
    for(const z of [-.27,.27]){
      const leg=wbox(.14,.48,.14,0x30251f,'boarLeg');leg.position.set(-.12,.28,z);g.add(leg);
    }
    return g;
  }
  const g=new THREE.Group();
  const body=orb(.36,0xa55432);body.scale.set(1.05,.72,.65);body.position.y=.58;g.add(body);
  const head=orb(.28,0xb25b34);head.position.set(.43,.78,0);g.add(head);
  const tailTip=orb(.12,0xa55432);tailTip.position.set(-.65,.96,.06);g.add(tailTip);
  return g;
}

function createWildlife(x,z,typeIndex){
  if(wildlife.length>=28)return;
  const spec=wildlifeTypes[typeIndex%wildlifeTypes.length];
  const g=animalPart(spec.type);
  g.scale.setScalar(spec.scale);
  g.position.set(x,0,z);
  characters.add(g);
  wildlife.push({
    root:g,type:spec.type,speed:spec.speed,
    dir:new THREE.Vector3(Math.random()-.5,0,Math.random()-.5).normalize(),
    turnTimer:1.5+Math.random()*4,
    phase:Math.random()*Math.PI*2,
    home:g.position.clone()
  });
}

function spawnWildlifeBurst(count=18){
  const zones=[
    [-45,22,1.0],[-8,-36,0.0],[28,-42,2.0],[66,-2,3.0],[-68,-18,1.0],[48,54,3.0]
  ];
  for(let i=0;i<count&&wildlife.length<28;i++){
    const z=zones[i%zones.length];
    const ang=Math.random()*Math.PI*2, r=5+Math.random()*18;
    createWildlife(z[0]+Math.cos(ang)*r,z[1]+Math.sin(ang)*r,Math.floor(z[2]+i));
  }
}

function updateWildlife(dt){
  for(const a of wildlife){
    if(!a.root.parent)continue;
    const toPlayer=a.root.position.clone().sub(player.position); toPlayer.y=0;
    const distance=toPlayer.length();

    if(distance<7){
      a.dir.copy(toPlayer.normalize());
      a.dir.add(new THREE.Vector3(Math.random()-.5,0,Math.random()-.5).multiplyScalar(.35)).normalize();
      a.turnTimer=.8+Math.random()*1.2;
    }else{
      a.turnTimer-=dt;
      if(a.turnTimer<=0){
        a.dir.applyAxisAngle(new THREE.Vector3(0,1,0),(Math.random()-.5)*1.2).normalize();
        a.turnTimer=2+Math.random()*5;
      }
    }

    a.root.position.addScaledVector(a.dir,a.speed*dt);
    const homeOffset=a.root.position.clone().sub(a.home); homeOffset.y=0;
    if(homeOffset.length()>18){
      a.dir.copy(homeOffset.normalize()).multiplyScalar(-1);
    }

    const edge=Math.max(Math.abs(a.root.position.x),Math.abs(a.root.position.z));
    if(edge>104){
      a.root.position.x=THREE.MathUtils.clamp(a.root.position.x,-102,102);
      a.root.position.z=THREE.MathUtils.clamp(a.root.position.z,-102,102);
    }

    a.root.rotation.y=Math.atan2(a.dir.x,a.dir.z);
    const bob=Math.sin(time*3.5+a.phase)*.025;
    if(a.type==='rabbit')a.root.position.y=Math.max(0,bob*2);
    else if(a.type==='deer')a.root.position.y=Math.max(0,bob*.7);
  }
}

let enemies=[];
function spawnEnemy(){
  if(enemies.length)return;
  const angle=Math.random()*Math.PI*2;
  const radius=12+Math.random()*15;
  const spawn=new THREE.Vector3(
    THREE.MathUtils.clamp(player.position.x+Math.cos(angle)*radius,-92,92),
    0,
    THREE.MathUtils.clamp(player.position.z+Math.sin(angle)*radius,-92,92)
  );
  const g=new THREE.Group();
  g.position.copy(spawn);
  const b=orb(.48,state.quest>=3?0x613b31:0x684a79,true);
  b.position.y=1;
  g.add(b);
  const horn=wbox(.18,.7,.18,0x352a2b,'enemyHorn');
  horn.position.set(0,1.55,0);
  horn.rotation.z=.25;
  g.add(horn);
  const e1=orb(.06,0xffc48b,true),e2=e1.clone();
  e1.position.set(-.13,1.08,.35); e2.position.set(.13,1.08,.35);
  g.add(e1,e2);
  characters.add(g);
  encounter={root:g,hp:state.quest>=3?90:45};
  enemies=[encounter];
  toastMsg('A wandering shade has entered the wilds.');
}
function dodge(){if(dodgeCooldown>0||state.stamina<18)return;dodgeCooldown=.65;state.stamina-=18;player.position.add(new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw)).multiplyScalar(-2.6));} let dodgeCooldown=0;
function xp(n){state.meta.mastery+=Math.max(1,Math.floor(n/5));state.meta.points+=Math.max(1,Math.floor(n/20));state.xp+=n;const need=100+state.level*55;if(state.xp>=need){state.xp-=need;state.level++;state.hp=100;toastMsg('Level up — Emberbound Lv '+state.level)}}
function item(name,type,rarity,attrs){state.meta.renown+=rarity==='Legendary'?4:rarity==='Epic'?3:2;state.meta.points+=1;state.inventory.push({name,type,rarity,attrs});state.log.unshift('Collected '+name+'.')}
function toastMsg(t){$('toast').textContent=t;$('toast').classList.add('show');toastTimer=3}
function setQuest(){const q=state.quest, title=$('questTitle'),desc=$('questDesc'),obj=$('objective'),count=$('questCount');if(q===0){title.textContent='A Stranger at the Gate';desc.textContent='Meet Lyra and choose what kind of traveler you will become.';obj.textContent='◈ Talk to Lyra';count.textContent='1 / 1'}else if(q===1){title.textContent='Embers in the Grove';desc.textContent='Gather living embers beyond the sanctuary.';obj.textContent='◈ Collect Emberleaf';count.textContent=state.shards+' / 2'}else if(q===2){title.textContent='The Road Opens';desc.textContent='Orren knows how to cross the old gate.';obj.textContent='◈ Speak with Orren';count.textContent='1 / 1'}else if(q===3){title.textContent='Echoes of Hollow';desc.textContent='Recover memory echoes from the eastern ruins.';obj.textContent='◈ Recover Memory Echoes';count.textContent=state.echoes+' / 2'}else if(q===4){title.textContent='A Choice in the Ash';desc.textContent='Return to Lyra. Your next decision will alter the road.';obj.textContent='◈ Return to Lyra';count.textContent='1 / 1'}else{title.textContent='The Road Continues';desc.textContent='Your first chapter has changed the world.';obj.textContent='◈ Explore';count.textContent='COMPLETE'}$('regionLabel').textContent=region().toUpperCase()}
function region(){
  const p=player.position;
  if(p.x>38&&p.z>22)return 'Crown Road';
  if(p.x>40&&p.z>-25&&p.z<=22)return 'Hollow Ruins';
  if(p.x<-35&&p.z<5)return 'Starless Path';
  if(p.z<-18&&p.x>-25&&p.x<28)return 'Ember Grove';
  if(p.x<-28&&p.z<-18)return 'Veil Lake';
  if(p.x<18&&p.z>12)return 'Sanctuary Hamlet';
  if(Math.abs(p.x)<42&&Math.abs(p.z)<38)return 'Sanctuary';
  return 'Outer Wilds';
}
function nearby(){let best=null,d=3;for(const n of npcs){const x=n.root.position.distanceTo(player.position);if(x<d){d=x;best={k:'npc',n}}}for(const n of nodes)if(!n.collected){const x=n.root.position.distanceTo(player.position);if(x<d){d=x;best={k:'node',n}}}for(const g of gates){const x=g.root.position.distanceTo(player.position);if(x<d){d=x;best={k:'gate',n:g}}}if(encounter){const x=encounter.root.position.distanceTo(player.position);if(x<d)best={k:'enemy',n:encounter}}return best}
function dialogue(n,text,opts){$('dialogue').classList.add('show');$('speakerName').textContent=n.name.toUpperCase();$('speakerRole').textContent=n.role.toUpperCase();$('dialogueText').textContent=text;const c=$('choices');c.innerHTML='';opts.forEach(o=>{const b=document.createElement('button');b.textContent=o.label;b.onclick=()=>{o.fn();$('dialogue').classList.remove('show')};c.appendChild(b)})}
function interact(){const a=nearby();if(!a)return;if(a.k==='npc'){const n=a.n;if(n.id==='lyra'&&state.quest===0)dialogue(n,'You carry the last ember. I can open the sanctuary road, but I need to know your intent.',[{label:'Protect the sanctuary',fn:()=>{state.rep.lyra++;state.quest=1;xp(25);item('Sanctuary Sigil','Relic','Rare',['Ward','Story Bound']);toastMsg('Quest started: gather Emberleaf');setQuest()}},{label:'Ask for the truth',fn:()=>{state.rep.lyra+=2;state.flags.truth=true;state.quest=1;xp(30);item('Emberleaf Charm','Trinket','Epic',['Lore','Luck']);toastMsg('Lyra respects your questions');setQuest()}}]);else if(n.id==='orren'&&state.quest===2)dialogue(n,'The old gate is unstable. I can show you the safe route, but the road beyond it is yours to discover.',[{label:'Trust Orren',fn:()=>{state.rep.orren+=2;state.quest=3;state.flags.gate=true;xp(35);toastMsg('Ashen Gate opened');setQuest()}},{label:'Study his map',fn:()=>{state.rep.orren++;state.quest=3;state.flags.gate=true;item('Tideglass Compass','Relic','Rare',['Discovery']);toastMsg('You found a hidden route');setQuest()}}]);else if(n.id==='lyra'&&state.quest===4)dialogue(n,'The road is open. What should the sanctuary become?',[{label:'Open it to everyone',fn:()=>{state.quest=5;state.rep.lyra++;xp(70);item('Crownless Signet','Quest Item','Legendary',['Legacy']);toastMsg('Your choice changed the sanctuary');setQuest()}},{label:'Keep it hidden',fn:()=>{state.quest=5;state.rep.lyra+=2;xp(70);item('Hearth Memory','Relic','Legendary',['Reputation']);toastMsg('The sanctuary remains hidden');setQuest()}}]);else toastMsg(n.name+': The road remembers every choice.')}
else if(a.k==='node'){const n=a.n;n.collected=true;n.root.visible=false;if(n.type==='ember'){state.shards++;xp(18);item(n.label,'Material',state.shards>=2?'Rare':'Uncommon',['Crafting','Ember']);toastMsg('Emberleaf collected');if(state.quest===1&&state.shards>=2)state.quest=2}else if(n.type==='echo'){state.echoes++;xp(22);item(n.label,'Quest Item','Epic',['Memory','Lore']);toastMsg('Memory Echo recovered');if(state.quest===3&&state.echoes>=2)state.quest=4}else{state.coins+=35;xp(30);item('Ancient Relic','Relic','Legendary',['Collection','Value']);toastMsg('Hidden relic discovered')}setQuest()}
else if(a.k==='gate'){if(state.quest<a.n.unlock){toastMsg(a.n.name+' is sealed by the story.');return}toastMsg(a.n.name+' discovered — '+region())}
else if(a.k==='enemy')pulse()}
function pulse(){if(!encounter||state.stamina<15)return;state.stamina-=15;encounter.hp-=18+state.level*2;const g=new THREE.Group();g.position.copy(player.position);for(let i=0;i<8;i++){const o=orb(.05,0xff8a4d,true),a=i*Math.PI/4;o.position.set(Math.cos(a),.8,Math.sin(a));g.add(o)}effects.add(g);setTimeout(()=>g.removeFromParent(),280);if(encounter.hp<=0){encounter.root.removeFromParent();enemies=[];state.coins+=25;xp(35);item('Ashen Wisp Fragment','Relic','Rare',['Encounter Drop']);encounter=null;toastMsg('Encounter cleared — loot recovered')}}
function move(dt){if(dodgeCooldown>0)dodgeCooldown-=dt;let x=(keys.KeyD?1:0)-(keys.KeyA?1:0),z=(keys.KeyS?1:0)-(keys.KeyW?1:0);const l=Math.hypot(x,z);if(!l){state.stamina=Math.min(100,state.stamina+22*dt);return}x/=l;z/=l;const d=new THREE.Vector3(x,0,z).applyAxisAngle(new THREE.Vector3(0,1,0),yaw),run=keys.ShiftLeft||keys.ShiftRight,s=run?7.2:4.7;player.position.addScaledVector(d,s*dt);player.rotation.y=Math.atan2(d.x,d.z);state.stamina=Math.max(0,state.stamina+(run?-9:16)*dt);player.position.x=THREE.MathUtils.clamp(player.position.x,-106,106);player.position.z=THREE.MathUtils.clamp(player.position.z,-106,106)}
function updateCamera(dt){const target=player.position.clone().add(new THREE.Vector3(0,1.15,0)),back=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));const pos=target.clone().addScaledVector(back,7.2).add(new THREE.Vector3(0,3.2+pitch*2,0));camera.position.lerp(pos,1-Math.pow(.001,dt));camera.lookAt(target)}
function tick(dt){
  time+=dt;
  move(dt);
  updateCamera(dt);
  updateWildlife(dt);

  for(const n of nodes)if(!n.collected)n.root.rotation.y+=dt;
  for(const e of enemies){
    if(!e||!e.root)continue;
    e.root.rotation.y+=dt;
    e.root.position.y=.15+Math.sin(time*2+e.root.id)*.12;
    if(e.root.position.distanceTo(player.position)<2.3)state.hp=Math.max(0,state.hp-5*dt);
  }

  // Subtle environmental motion keeps the world alive without adding many draw calls.
  props.children.forEach((obj,i)=>{
    if(i%17===0&&obj.userData && obj.userData.sway)
      obj.rotation.z=Math.sin(time*.7+i)*.025;
  });

  if(state.hp<=0){
    state.hp=100;
    player.position.set(0,0,7);
    toastMsg('You returned to the sanctuary');
  }

  $('playerHp').style.width=state.hp+'%';
  $('stamina').style.width=state.stamina+'%';
  $('level').textContent='LV '+state.level;
  $('coins').textContent=state.coins+' ASHEN';
  $('status').textContent=enemies.length?'ENCOUNTER':(keys.ShiftLeft||keys.ShiftRight?'SPRINTING':'EXPLORING');
  $('locationName').textContent=region().toUpperCase();
  $('locationHint').textContent=
    region()==='Sanctuary'?'A safe place beneath the last light.':
    region()==='Sanctuary Hamlet'?'Warm windows and small homes surround the sanctuary road.':
    region()==='Ember Grove'?'Living embers grow beneath an old forest canopy.':
    region()==='Hollow Ruins'?'Forgotten stone, broken towers and memory echoes.':
    region()==='Veil Lake'?'Still water, old bridges and mist between the trees.':
    region()==='Crown Road'?'A wider road toward the old crownlands.':
    region()==='Starless Path'?'A colder road where the trees grow sparse.':
    'Untamed land beyond the mapped roads.';

  const a=nearby();
  $('interaction').classList.toggle('show',!!a);
  if(a)$('interaction').querySelector('span').textContent=
    a.k==='npc'?'Talk':a.k==='node'?'Gather':a.k==='gate'?'Enter':'Pulse';

  $('dayLabel').textContent='DAY '+state.day+' · '+(time%30<10?'DAWN':time%30<20?'DAY':'DUSK');
}
function renderJournal(tab='story'){if(tab==='story')$('journalBody').innerHTML=state.log.slice(0,12).map(x=>'<div class="journal-line">◈ '+x+'</div>').join('');if(tab==='people')$('journalBody').innerHTML=npcs.map(n=>'<div class="journal-line"><b>'+n.name+' · '+n.role+'</b>Reputation: '+state.rep[n.id]+'</div>').join('');if(tab==='world')$('journalBody').innerHTML=gates.map(g=>'<div class="journal-line"><b>'+g.name+'</b> '+(state.quest>=g.unlock?'Accessible':'Sealed by story')+'</div>').join('');if(tab==='campaign')$('journalBody').innerHTML='<div class="campaign-grid">'+(window.ASHEN_CAMPAIGN||[]).map(ch=>'<article class="chapter-card '+(ch.id===state.chapter?'active':'')+'"><div class="num">CHAPTER '+String(ch.id).padStart(2,'0')+' · '+ch.theme.toUpperCase()+'</div><h3>'+ch.title+'</h3><p>'+ch.summary+'</p><div class="chapter-meta"><span>'+ch.region+'</span><span>'+ch.activities.length+' activities</span><span>'+ch.items.length+' unique items</span></div><div class="story-items">'+ch.items.map(i=>'<span>'+i+'</span>').join('')+'</div></article>').join('')+'</div>'}
function archive(){const m=$('metaMenu');m.classList.add('show');const next=100+state.level*40,rank=state.meta.renown>=40?'CROWNBOUND':state.meta.renown>=20?'PATHFINDER':state.meta.renown>=8?'WAYFARER':'EMBERBOUND';$('metaContent').innerHTML='<div class="meta-dashboard"><div class="meta-hero"><span>LEGACY RANK</span><strong>'+rank+'</strong><small>Permanent progression · '+state.meta.legacy+' Legacy</small></div><div class="meta-stats"><div><b>'+state.meta.mastery+'</b><span>Mastery XP</span></div><div><b>'+state.meta.renown+'</b><span>Renown</span></div><div><b>'+state.meta.points+'</b><span>Growth Points</span></div><div><b>'+state.inventory.length+'</b><span>Discoveries</span></div></div><div class="meta-progress"><div><span>LEVEL '+state.level+'</span><b>'+state.xp+' / '+next+' XP</b></div><i style="width:'+Math.min(100,state.xp/next*100)+'%"></i></div><div class="meta-goals"><article><span>WEEKLY PATH</span><b>Discover 5 locations</b><small>'+Math.min(5,state.inventory.length)+' / 5 · Reward: +3 Renown</small></article><article><span>MASTER STUDY</span><b>Collect 3 story items</b><small>'+Math.min(3,state.inventory.length)+' / 3 · Reward: +2 Growth Points</small></article><article><span>LEGACY</span><b>Complete Chapter 01</b><small>'+(state.quest>=5?'Complete · Legacy unlocked':'In progress · finish the current story')+'</small></article></div><div class="meta-list"><div class="journal-line"><b>REPUTATION</b> Lyra '+state.rep.lyra+' · Orren '+state.rep.orren+' · Seer '+state.rep.seer+'</div><div class="journal-line"><b>EQUIPMENT</b> '+Object.values(state.equipment).filter(Boolean).length+' / 4 slots equipped · Ward '+state.stats.ward+' · Focus '+state.stats.focus+'</div><div class="journal-line"><b>WORLD</b> '+gates.filter(g=>state.quest>=g.unlock).length+' / '+gates.length+' routes available</div></div></div>'}
function loadState(){try{const raw=localStorage.getItem('ashen-crown-3d');if(raw){const saved=JSON.parse(raw);Object.assign(state,saved);state.equipment=Object.assign({core:null,charm:null,armor:null,relic:null},saved.equipment||{});state.stats=Object.assign({vitality:0,focus:0,ward:0},saved.stats||{});state.meta=Object.assign({renown:0,mastery:0,legacy:0,points:0,contracts:0},saved.meta||{});state.tutorial=false}}catch{}} 
function saveState(){try{localStorage.setItem('ashen-crown-3d',JSON.stringify(state))}catch{}}
function refreshEquipment(){document.querySelectorAll('.equip-slot').forEach(b=>{const x=state.equipment[b.dataset.slot];b.innerHTML=b.dataset.slot.toUpperCase()+'<span>'+(x?x.name:'Empty')+'</span>'});}
function openInventory(){refreshEquipment();const grid=$('inventoryGrid');grid.innerHTML=state.inventory.length?state.inventory.slice().reverse().map((i,idx)=>'<div class="inventory-item"><b>'+i.name+'</b><small>'+i.type+' · '+i.rarity+'</small><em>'+i.attrs.join(' · ')+'</em><button data-item="'+(state.inventory.length-1-idx)+'">EQUIP</button></div>').join(''):'<div class="inventory-item"><b>Your pack is empty</b><small>Explore the world and discover story items.</small></div>';$('inventoryMenu').classList.add('show');grid.querySelectorAll('button[data-item]').forEach(b=>b.onclick=()=>equipItem(Number(b.dataset.item)))}
function equipItem(index){const i=state.inventory[index];if(!i)return;const slot=i.type==='Armor'?'armor':i.type==='Trinket'?'charm':i.type==='Relic'?'relic':'core';state.equipment[slot]=i;if(i.attrs.includes('+Ward')||i.attrs.includes('Ward'))state.stats.ward=1;if(i.attrs.includes('+Vitality'))state.stats.vitality=1;if(i.attrs.includes('+Focus'))state.stats.focus=1;toastMsg(i.name+' equipped as '+slot);refreshEquipment();saveState()}
function renderWorldMap(){const el=$('mapWorld');el.innerHTML='';const points=[['Sanctuary',12,50,0,true],['Sanctuary Hamlet',28,35,1,true],['Ember Grove',42,26,1,true],['Hollow Ruins',70,22,2,state.quest>=2],['Riverlands',58,52,2,true],['Starfall Meadow',52,68,3,state.quest>=3],['Veil Lake',20,78,5,state.quest>=5],['Crown Road',82,58,6,state.quest>=6],['Glass Observatory',86,30,7,state.quest>=7],['Starless Path',12,20,4,state.quest>=4],['Starless Wilds',72,82,9,state.quest>=9]];points.forEach(p=>{const d=document.createElement('div');d.className='map-node '+(p[4]?'open':'')+(p[0]===region()?' quest':'');d.style.left=p[1]+'%';d.style.top=p[2]+'%';d.innerHTML='<i></i><b>'+p[0]+'</b><small>'+(p[4]?'DISCOVERED':'LOCKED')+'</small>';el.appendChild(d)})}
function openMap(){renderWorldMap();$('worldMap').classList.add('show')}
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);window.addEventListener('keydown',e=>{if(e.repeat&&['Space','KeyE','KeyF','KeyI','KeyJ','KeyK','KeyM'].includes(e.code))return;keys[e.code]=true;if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyE')interact();if(e.code==='KeyF')pulse();if(e.code==='Space')dodge();if(e.code==='KeyI')openInventory();if(e.code==='KeyM')openMap();if(e.code==='KeyI')openInventory();if(e.code==='KeyM')openMap();if(e.code==='Slash'||e.code==='F1')$('tutorial').classList.add('show');if(e.code==='KeyJ'){$('journal').classList.toggle('show');renderJournal('story')}if(e.code==='KeyK')archive();if(e.code==='Escape'){$('pause').classList.toggle('show');state.paused=!state.paused}});window.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);drag=false});
canvas.addEventListener('mousedown',e=>{if(e.button===0)pulse();drag=true;lx=e.clientX;ly=e.clientY});window.addEventListener('mouseup',()=>drag=false);window.addEventListener('mousemove',e=>{if(!drag)return;yaw-=(e.clientX-lx)*.005;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-ly)*.003,-.1,.8);lx=e.clientX;ly=e.clientY});canvas.addEventListener('wheel',e=>{camera.fov=THREE.MathUtils.clamp(camera.fov+e.deltaY*.025,42,68);camera.updateProjectionMatrix()},{passive:true});
document.querySelectorAll('.journal-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.journal-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderJournal(b.dataset.tab)});
$('closeMeta').onclick=()=>$('metaMenu').classList.remove('show');$('closeInventory').onclick=()=>$('inventoryMenu').classList.remove('show');$('closeMap').onclick=()=>$('worldMap').classList.remove('show');$('tutorialStart').onclick=()=>{$('tutorial').classList.remove('show');state.tutorial=false;saveState()};$('helpButton').onclick=()=>$('tutorial').classList.add('show');$('closeDialogue').onclick=()=>$('dialogue').classList.remove('show');$('resume').onclick=()=>{$('pause').classList.remove('show');state.paused=false};
window.addEventListener('beforeunload',saveState);
loadState();setQuest();renderJournal('story');refreshEquipment();resize();
if(state.tutorial!==false)$('tutorial').classList.add('show');
spawnWildlifeBurst(20);
toastMsg('World expanded — explore villages, ruins, lakes and wildlife.');
setInterval(()=>{
  if(!state.paused&&!document.hidden&&Math.random()<.55)spawnEnemy();
  if(!state.paused&&!document.hidden&&wildlife.length<20)spawnWildlifeBurst(4);
},9000);
let last=performance.now();function frame(t){const dt=Math.min(.033,(t-last)/1000);last=t;if(!state.paused&&!$('dialogue').classList.contains('show')&&!$('tutorial').classList.contains('show')&&!$('inventoryMenu').classList.contains('show')&&!$('worldMap').classList.contains('show'))tick(dt);renderer.render(scene,camera);if(toastTimer>0&&(toastTimer-=dt)<=0)$('toast').classList.remove('show');requestAnimationFrame(frame)}requestAnimationFrame(frame);