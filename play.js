import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';

const $=id=>document.getElementById(id);
const canvas=$('game'), scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a0b0e); scene.fog=new THREE.Fog(0x151311,58,245);
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
let maxDpr=Math.min(window.devicePixelRatio||1,1.25);
renderer.setPixelRatio(maxDpr); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=false; renderer.shadowMap.autoUpdate=false;
const camera=new THREE.PerspectiveCamera(55,1,.1,260); camera.position.set(0,4,8);
scene.add(new THREE.HemisphereLight(0xcbd3d8,0x24201c,1.25));
const sun=new THREE.DirectionalLight(0xffd0a4,1.05); sun.position.set(-18,22,12); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); sun.shadow.camera.left=-100; sun.shadow.camera.right=100; sun.shadow.camera.top=100; sun.shadow.camera.bottom=-100; sun.shadow.camera.far=260; scene.add(sun);
const world=new THREE.Group(), characters=new THREE.Group(), props=new THREE.Group(), effects=new THREE.Group(); scene.add(world);
const sanctuaryBuild=new THREE.Group();world.add(sanctuaryBuild);
world.add(characters,props,effects);

const COLLISION_RADIUS=.38;
let activeMapId='sanctuary';
const staticColliders=[];
const mapColliders={};
function addCircleCollider(x,z,r,tag='obstacle'){staticColliders.push({kind:'circle',x,z,r,tag})}
function addBoxCollider(x,z,hx,hz,rot=0,tag='obstacle'){staticColliders.push({kind:'box',x,z,hx,hz,rot,cos:Math.cos(rot),sin:Math.sin(rot),tag})}
function addSegmentCollider(x1,z1,x2,z2,r=.10,tag='obstacle'){staticColliders.push({kind:'segment',x1,z1,x2,z2,r,tag})}
function addTreeCollider(x,z,s=1){addCircleCollider(x,z,.62*s,'tree')}
function addRockCollider(x,z,s=1){addCircleCollider(x,z,.78*s,'rock')}
function resolveCollisions(x,z){
  let px=x,pz=z;
  const colliders=activeMapId==='sanctuary'?staticColliders:mapColliders[activeMapId]||[];
  if(activeMapId!=='sanctuary'){px=THREE.MathUtils.clamp(px,-54,54);pz=THREE.MathUtils.clamp(pz,-54,54)}
  for(let pass=0;pass<2;pass++){
    for(const c of colliders){
      if(c.kind==='circle'){
        let dx=px-c.x,dz=pz-c.z,d2=dx*dx+dz*dz;
        const min=c.r+COLLISION_RADIUS;
        if(d2<min*min){
          if(d2<1e-8){dx=1;dz=0;d2=1}
          const d=Math.sqrt(d2),push=min-d;
          px+=dx/d*push;pz+=dz/d*push;
        }
      }else if(c.kind==='segment'){
        const vx=c.x2-c.x1,vz=c.z2-c.z1,wx=px-c.x1,wz=pz-c.z1,den=vx*vx+vz*vz||1;
        const t=THREE.MathUtils.clamp((wx*vx+wz*vz)/den,0,1),qx=c.x1+vx*t,qz=c.z1+vz*t;
        let dx=px-qx,dz=pz-qz,d2=dx*dx+dz*dz;
        const min=c.r+COLLISION_RADIUS;
        if(d2<min*min){
          if(d2<1e-8){dx=-vz;dz=vx;d2=dx*dx+dz*dz||1}
          const d=Math.sqrt(d2),push=min-d;
          px+=dx/d*push;pz+=dz/d*push;
        }
      }else{
        const dx=px-c.x,dz=pz-c.z,lx=dx*c.cos+dz*c.sin,lz=-dx*c.sin+dz*c.cos;
        const qx=THREE.MathUtils.clamp(lx,-c.hx,c.hx),qz=THREE.MathUtils.clamp(lz,-c.hz,c.hz);
        const ox=lx-qx,oz=lz-qz,d2=ox*ox+oz*oz;
        if(d2<COLLISION_RADIUS*COLLISION_RADIUS){
          let nx=ox,nz=oz,push;
          if(d2<1e-8){
            const ex=c.hx-Math.abs(lx),ez=c.hz-Math.abs(lz);
            if(ex<ez){nx=lx<0?-1:1;nz=0;push=COLLISION_RADIUS+ex}
            else{nx=0;nz=lz<0?-1:1;push=COLLISION_RADIUS+ez}
          }else{
            const d=Math.sqrt(d2);push=COLLISION_RADIUS-d;nx/=d;nz/=d;
          }
          const wx=nx*c.cos-nz*c.sin,wz=nx*c.sin+nz*c.cos;
          px+=wx*push;pz+=wz*push;
        }
      }
    }
  }
  return {x:px,z:pz};
}


const DAY_LENGTH=210;
const ATMOSPHERE_OFFSET=DAY_LENGTH*.22;
const clouds=[];
const cloudObjects=[];
const villagers=[];
const birds=[];
const waterSurfaces=[];
const grassField=[];

const skyUniforms={
  uSunDir:{value:new THREE.Vector3(.2,.8,.35).normalize()},
  uZenith:{value:new THREE.Color(0x3f78b8)},
  uHorizon:{value:new THREE.Color(0xf2c89d)},
  uNight:{value:new THREE.Color(0x08111d)},
  uSunColor:{value:new THREE.Color(0xffdf9e)},
  uDay:{value:1}
};
const skyNoonColor=new THREE.Color(0x4c8dca);
const skySunriseColor=new THREE.Color(0xe8a26c);
const skyNightColor=new THREE.Color(0x07111f);
const skyHorizonColor=new THREE.Color(0xf2c99d);
const skyWarmColor=new THREE.Color(0xcf7d60);
const skySunColor=new THREE.Color(0xffcf8f);
const fogNightColor=new THREE.Color(0x14100d);
const fogDayColor=new THREE.Color(0xc0aa98);
const sunWarmColor=new THREE.Color(0xffc88b);
const sunCoolColor=new THREE.Color(0x9db8ff);
const sunPosition=new THREE.Vector3();
const skyMaterial=new THREE.ShaderMaterial({
  uniforms:skyUniforms,
  vertexShader:`
    varying vec3 vWorldDir;
    void main(){
      vec4 wp=modelMatrix*vec4(position,1.0);
      vWorldDir=normalize(wp.xyz-cameraPosition);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
    }
  `,
  fragmentShader:`
    uniform vec3 uSunDir;
    uniform vec3 uZenith;
    uniform vec3 uHorizon;
    uniform vec3 uNight;
    uniform vec3 uSunColor;
    uniform float uDay;
    varying vec3 vWorldDir;
    void main(){
      vec3 dir=normalize(vWorldDir);
      float h=smoothstep(-.08,.92,dir.y);
      vec3 daySky=mix(uHorizon,uZenith,h);
      float horizonBand=1.0-smoothstep(-.05,.22,abs(dir.y));
      daySky=mix(daySky,mix(uHorizon,vec3(1.0,.88,.76),.35),horizonBand*.18);
      vec3 sky=mix(uNight,daySky,uDay);
      float sunDot=max(dot(dir,normalize(uSunDir)),0.0);
      float glow=pow(sunDot,44.0)*uDay;
      float disk=smoothstep(.9975,.9997,sunDot)*uDay;
      sky+=uSunColor*(glow*.32+disk*2.4);
      gl_FragColor=vec4(sky,1.0);
    }
  `,
  side:THREE.BackSide,
  depthWrite:false,
  depthTest:false
});
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(240,48,24),skyMaterial);
skyDome.frustumCulled=false;
skyDome.renderOrder=-100;
scene.add(skyDome);

const sunDiscCanvas=document.createElement('canvas');
sunDiscCanvas.width=96; sunDiscCanvas.height=96;
const sunDiscCtx=sunDiscCanvas.getContext('2d');
const sunGradient=sunDiscCtx.createRadialGradient(48,48,4,48,48,44);
sunGradient.addColorStop(0,'rgba(255,248,218,1)');
sunGradient.addColorStop(.36,'rgba(255,219,148,.92)');
sunGradient.addColorStop(1,'rgba(255,173,90,0)');
sunDiscCtx.fillStyle=sunGradient;
sunDiscCtx.fillRect(0,0,96,96);
const sunDiscTexture=new THREE.CanvasTexture(sunDiscCanvas);
const sunDisc=new THREE.Sprite(new THREE.SpriteMaterial({map:sunDiscTexture,transparent:true,depthWrite:false}));
sunDisc.scale.set(13,13,1);
sunDisc.renderOrder=-90;
scene.add(sunDisc);

const sunHalo=new THREE.Sprite(new THREE.SpriteMaterial({
  map:sunDiscTexture,
  transparent:true,
  opacity:.24,
  depthWrite:false,
  blending:THREE.AdditiveBlending
}));
sunHalo.scale.set(31,31,1);
sunHalo.renderOrder=-89;
scene.add(sunHalo);

const cloudMaterial=new THREE.MeshBasicMaterial({color:0xf5f1e8,transparent:true,opacity:.48,depthWrite:false});
function createCloud(x,y,z,s=1){
  const g=new THREE.Group();
  g.position.set(x,y,z);
  g.scale.setScalar(s);
  for(let i=0;i<5;i++){
    const puff=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),cloudMaterial);
    puff.scale.set(.95+(i%2)*.28,.42+(i%3)*.08,.62+(i%2)*.16);
    puff.position.set((i-2)*.72,.16*Math.sin(i),Math.sin(i*1.7)*.45);
    g.add(puff);
  }
  g.userData.speed=.55+.15*(cloudObjects.length%4);
  cloudObjects.push(g);
  scene.add(g);
  return g;
}
[
  [-54,33,-34,4.6],[-18,29,-62,3.8],[20,37,-48,5.0],[58,31,-18,4.2],
  [74,42,38,5.5],[-72,35,45,4.2],[8,34,72,4.0],[-42,39,78,5.2]
].forEach(p=>createCloud(...p));

const birdMaterial=new THREE.MeshBasicMaterial({color:0x302c27,side:THREE.DoubleSide});
function spawnBird(x,y,z,scale=1){
  const g=new THREE.Group();
  g.position.set(x,y,z);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.10,8,6),birdMaterial);
  body.scale.set(1.6,.75,.7); g.add(body);
  const left=new THREE.Mesh(new THREE.PlaneGeometry(.34,.15),birdMaterial);
  const right=left.clone();
  left.position.set(-.19,.01,0); right.position.set(.19,.01,0);
  left.rotation.z=.22; right.rotation.z=-.22;
  g.add(left,right);
  g.scale.setScalar(scale);
  g.userData={speed:1.7+Math.random()*.7,phase:Math.random()*Math.PI*2,radius:7+Math.random()*8,height:y,center:new THREE.Vector3(x,y,z)};
  birds.push(g); scene.add(g);
}
for(let i=0;i<4;i++)spawnBird(-45+i*16,15+(i%3)*4,-28+(i%4)*22,.8+(i%3)*.12);

function updateSky(){
  const absoluteCycle=(time+ATMOSPHERE_OFFSET)/DAY_LENGTH;
  state.day=1+Math.floor(absoluteCycle);
  const cycle=absoluteCycle-Math.floor(absoluteCycle);
  const angle=cycle*Math.PI*2-Math.PI/2;
  const sunY=Math.sin(angle);
  const sunX=Math.cos(angle);
  const sunZ=Math.sin(angle*.67);
  sunPosition.set(sunX*115,sunY*115,sunZ*55);
  const sunDir=skyUniforms.uSunDir.value.copy(sunPosition).normalize();
  const day=Math.max(0,Math.min(1,(sunY+.16)/.34));

  sun.position.copy(sunPosition);
  sun.intensity=.55+1.05*day;
  sun.color.copy(sunCoolColor).lerp(sunWarmColor,Math.max(.08,day));
  skyUniforms.uSunDir.value.copy(sunDir);
  skyUniforms.uDay.value=day;

  const duskAmount=Math.max(0,(.24-Math.abs(sunY))/.24)*day;
  const warm=Math.max(duskAmount,.72*(1-day));

  skyUniforms.uZenith.value.copy(skyNoonColor).lerp(skySunriseColor,Math.min(1,warm*.72));
  skyUniforms.uHorizon.value.copy(skyHorizonColor).lerp(skyWarmColor,Math.min(1,warm*.6));
  skyUniforms.uNight.value.copy(skyNightColor);
  skyUniforms.uSunColor.value.copy(skySunColor);

  sunDisc.position.copy(sunPosition);
  sunHalo.position.copy(sunPosition);
  sunDisc.material.opacity=Math.max(.05,day);
  sunHalo.material.opacity=.13+.18*day;

  const mapFog=MAPS?.[activeMapId]?.fog??0x151311;
  scene.fog.color.setHex(mapFog).lerp(fogDayColor,.12+.12*day);
  scene.fog.near=activeMapId==='sanctuary'?58:30;
  scene.fog.far=activeMapId==='sanctuary'?245:105;
}


const ROLE_DEFS={
  ashbreaker:{name:'Ashbreaker',style:'Heavy blade · close burst damage',colors:[0x723b2c,0xc27742],skills:[['Cinder Cleave',34,5.2,7],['Rift Charge',48,6.5,10],['Crownfall',72,9,16]]},
  glassblade:{name:'Glassblade',style:'Twin edge · fast single-target damage',colors:[0x31505a,0x65b6ae],skills:[['Quickdraw',28,4.6,5],['Afterimage',48,6,9],['Shatterstep',68,7,14]]},
  cinderweaver:{name:'Cinderweaver',style:'Ember arts · ranged burst damage',colors:[0x583c67,0xd99855],skills:[['Cinder Lance',38,10,7],['Starburst',46,6,10],['Ashfall',76,11,17]]},
  briarshot:{name:'Briarshot',style:'Longbow · piercing and area damage',colors:[0x3d5736,0xa5a654],skills:[['Thornbolt',32,12,5],['Briar Volley',48,10,9],['Huntmark',66,14,14]]}
};const state={day:1,role:'ashbreaker',appearance:'default',skillPoints:0,skillRanks:[0,0,0],weaponRank:0,currentMap:'sanctuary',hunt:{kills:0},chapterGathered:0,settings:{quality:'auto',sensitivity:1,reducedMotion:false,sound:true,volume:.35,animations:true,visualEffects:true,uiScale:1,cameraFov:55},xp:0,level:1,hp:100,maxHp:100,stamina:100,coins:40,shards:0,echoes:0,quest:0,chapter:1,rep:{lyra:0,orren:0,seer:0},flags:{gate:false,truth:false},inventory:[],equipment:{core:null,charm:null,armor:null,relic:null},stats:{vitality:0,focus:0,ward:0},meta:{renown:0,mastery:0,legacy:0,points:0,contracts:0,developmentDay:0,hubLevel:0,chaptersComplete:0},collectedNodes:[],tutorial:true,log:['You wake beneath the sanctuary with an ember glowing in your palm.']};
const keys={}; let yaw=0,pitch=.28,drag=false,dragPointerId=null,lx=0,ly=0,time=0,toastTimer=0,encounter=null,saveTimer=0,saveWarningShown=false,attackCooldown=0,dodgeIFrames=0,legacyMapSave=false;
const player=new THREE.Group(); player.position.set(0,0,7); characters.add(player);

const mat=(c,r=.75,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const orb=(r,c,glow=false)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat(c,.82,.02));if(glow)m.material.emissive=new THREE.Color(c).multiplyScalar(.55);return m};
const box=(x,y,z,c)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x,y,z),mat(c));m.castShadow=true;return m};
function actor(c,a){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.75,8,12),mat(c,.9,.025));
  body.position.y=.98; body.castShadow=true; g.add(body);

  const belt=box(.60,.11,.42,0x3d2c24);
  belt.position.y=.78; belt.castShadow=true; g.add(belt);

  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,12,10),mat(0xd0b9a5,.94,0));
  head.position.y=1.80; head.castShadow=true; g.add(head);

  const hair=new THREE.Mesh(new THREE.SphereGeometry(.33,12,8),mat(a,.88,0));
  hair.position.set(0,1.92,-.02); hair.scale.set(1,.65,1.02); hair.castShadow=true; g.add(hair);

  const hood=new THREE.Mesh(new THREE.ConeGeometry(.40,.48,10),mat(a,.82,0));
  hood.position.y=2.18; hood.castShadow=true; g.add(hood);

  for(const sx of [-.46,.46]){
    const arm=box(.17,.62,.18,c);
    arm.position.set(sx,.98,0); arm.rotation.z=sx*.12; arm.castShadow=true; g.add(arm);
  }
  for(const sx of [-.18,.18]){
    const leg=box(.18,.72,.21,0x26262a);
    leg.position.set(sx,.34,0); leg.castShadow=true; g.add(leg);
  }

  const scarf=box(.54,.08,.44,a);
  scarf.position.y=1.43; scarf.castShadow=true; g.add(scarf);

  const core=orb(.115,0xff8245,true);
  core.position.set(0,1.1,.34); g.add(core);
  return g;
}
const playerVisual=actor(0x29221d,0x613724);player.add(playerVisual);
let productionPlayerScene=null,productionBossScene=null,productionBossAnimations=[],productionPlayerMixer=null,productionBossMixer=null,productionPlayerActions={},activePlayerAction='',playerActionUntil=0,fullPackLoaderPromise=null;
const armorMat=new THREE.MeshStandardMaterial({color:0x302a29,roughness:.84,metalness:.18});
const brassMat=new THREE.MeshStandardMaterial({color:0x9d6b42,roughness:.78,metalness:.28});
const chestplate=new THREE.Mesh(new THREE.OctahedronGeometry(.43,0),armorMat);chestplate.scale.set(.88,1.18,.52);chestplate.position.set(0,1.08,.27);chestplate.castShadow=true;playerVisual.add(chestplate);
const crest=orb(.12,0xff8245,true);crest.position.set(0,1.12,.51);playerVisual.add(crest);
for(const side of [-1,1]){
  const pauldron=new THREE.Mesh(new THREE.DodecahedronGeometry(.27,0),armorMat);pauldron.scale.set(1.15,.72,1);pauldron.position.set(side*.43,1.37,.02);pauldron.castShadow=true;playerVisual.add(pauldron);
  const trim=new THREE.Mesh(new THREE.TorusGeometry(.19,.025,6,10),brassMat);trim.position.set(side*.43,1.37,.12);trim.scale.set(1.15,.7,1);playerVisual.add(trim);
}
const crownMat=brassMat;
for(let i=-1;i<=1;i++){
  const point=new THREE.Mesh(new THREE.ConeGeometry(.07,.31,5),crownMat);point.position.set(i*.15,2.38-Math.abs(i)*.07,.01);point.rotation.z=i*-.14;playerVisual.add(point);
}
const swordGrip=box(.09,.36,.09,0x4b2d21);swordGrip.position.set(.56,.73,.12);swordGrip.rotation.z=-.16;playerVisual.add(swordGrip);
const swordGuard=box(.34,.07,.11,0xa36b42);swordGuard.position.set(.57,.91,.12);playerVisual.add(swordGuard);
const swordBlade=new THREE.Mesh(new THREE.BoxGeometry(.10,1.0,.12),new THREE.MeshStandardMaterial({color:0xaaa9a1,roughness:.58,metalness:.48,emissive:0x100b07}));swordBlade.position.set(.59,1.42,.12);swordBlade.rotation.z=-.08;swordBlade.castShadow=true;playerVisual.add(swordBlade);
const twinBlade=swordBlade.clone();twinBlade.position.x=-.58;twinBlade.rotation.z=.08;playerVisual.add(twinBlade);
const roleStaff=new THREE.Group(),staffRod=box(.11,1.65,.11,0x4d3028),staffGem=orb(.17,0xd99855,true);staffRod.position.set(-.48,1.1,-.08);staffGem.position.set(-.48,2.03,-.08);roleStaff.add(staffRod,staffGem);playerVisual.add(roleStaff);
const roleBow=new THREE.Group(),bowArc=new THREE.Mesh(new THREE.TorusGeometry(.48,.045,7,24,Math.PI),mat(0x77543a,.7,.25));bowArc.position.set(-.5,1.18,-.12);bowArc.rotation.z=Math.PI/2;roleBow.add(bowArc);playerVisual.add(roleBow);
const cape=new THREE.Mesh(new THREE.ConeGeometry(.48,1.1,5),mat(0x171317,.94,.03));cape.position.set(0,.91,-.38);cape.rotation.x=Math.PI;cape.castShadow=true;playerVisual.add(cape);

const worldMats=new Map();
const textureCache=new Map();
const lightSources=[];
const bellLandmarks=[];
const groundMat=wmat('groundSurface',0x17140f,.98);
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



function texturePattern(kind){
  if(textureCache.has(kind))return textureCache.get(kind);

  const canvas=document.createElement('canvas');
  canvas.width=192; canvas.height=192;
  const ctx=canvas.getContext('2d');
  const palette={
    ground:['#29251f','#332e26','#24221d'],
    wall:['#746051','#806c59','#625247'],
    wood:['#5b402f','#765238','#412f24'],
    roof:['#332923','#46332a','#292528'],
    stone:['#5d5750','#6c665d','#4b4742'],
    cloth:['#454b58','#586170','#353b47']
  }[kind]||['#555','#666','#444'];

  ctx.fillStyle=palette[0]; ctx.fillRect(0,0,192,192);
  const hash=(x,y)=>{
    let n=(x*374761393+y*668265263)|0;
    n=(n^(n>>13))*1274126177;
    return ((n^(n>>16))>>>0)/4294967295;
  };

  if(kind==='wood'){
    for(let y=0;y<192;y+=24){
      ctx.fillStyle=palette[1];
      ctx.fillRect(0,y,192,20);
      ctx.fillStyle=palette[2];
      for(let x=0;x<192;x+=36){
        ctx.fillRect(x+(y%31)*.2,y,2,20);
        if(hash(x,y)>.72)ctx.fillRect(x+12,y+5,18,2);
      }
    }
  }else if(kind==='roof'){
    ctx.fillStyle=palette[1]; ctx.fillRect(0,0,192,192);
    ctx.strokeStyle=palette[2]; ctx.lineWidth=5;
    for(let y=-20;y<212;y+=18){
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(192,y+35);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,y+8);ctx.lineTo(192,y+43);ctx.stroke();
    }
  }else if(kind==='stone'){
    for(let i=0;i<45;i++){
      const x=Math.floor(hash(i,7)*192),y=Math.floor(hash(i,17)*192);
      const w=8+hash(i,27)*28,h=7+hash(i,31)*18;
      ctx.fillStyle=palette[i%3];
      ctx.fillRect(x,y,w,h);
    }
  }else if(kind==='wall'){
    for(let i=0;i<80;i++){
      const x=Math.floor(hash(i,3)*192),y=Math.floor(hash(i,9)*192);
      const a=.08+hash(i,11)*.16;
      ctx.fillStyle='rgba(255,235,210,'+a.toFixed(3)+')';
      ctx.fillRect(x,y,3+hash(i,15)*8,3+hash(i,19)*6);
    }
    ctx.strokeStyle=palette[2];ctx.globalAlpha=.3;ctx.lineWidth=1;
    for(let y=18;y<192;y+=42){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(192,y);ctx.stroke();}
    ctx.globalAlpha=1;
  }else if(kind==='ground'){
    for(let i=0;i<1400;i++){
      const x=Math.floor(hash(i,41)*192),y=Math.floor(hash(i,59)*192);
      const c=i%5===0?palette[1]:palette[2];
      ctx.fillStyle=c;
      ctx.globalAlpha=.16+hash(i,71)*.22;
      ctx.fillRect(x,y,1+hash(i,79)*2,1+hash(i,83)*2);
    }
    ctx.globalAlpha=1;
  }else if(kind==='cloth'){
    ctx.fillStyle=palette[1];ctx.fillRect(0,0,192,192);
    ctx.strokeStyle=palette[2];ctx.globalAlpha=.22;ctx.lineWidth=2;
    for(let i=-192;i<192;i+=14){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+192,192);ctx.stroke();}
    ctx.globalAlpha=1;
  }

  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=THREE.RepeatWrapping;
  tex.wrapT=THREE.RepeatWrapping;
  tex.anisotropy=4;
  tex.needsUpdate=true;
  textureCache.set(kind,tex);
  return tex;
}

function wmat(key,color,roughness=.78,metalness=0,emission=0){
  const cached=worldMats.get(key);
  if(cached)return cached;
  const m=mat(color,roughness,metalness);

  if(key.toLowerCase().includes('ground')) {
    m.map=texturePattern('ground');
    m.bumpMap=texturePattern('ground');
    m.bumpScale=.045;
    m.color.set(0xffffff);
    m.roughness=.98;
  }else if(key.toLowerCase().includes('wood')||key.toLowerCase().includes('beam')||key.toLowerCase().includes('door')||key.toLowerCase().includes('cart')){
    m.map=texturePattern('wood');
    m.bumpMap=texturePattern('wood');
    m.bumpScale=.035;
    m.color.set(0xffffff);
  }else if(key.toLowerCase().includes('roof')){
    m.map=texturePattern('roof');
    m.bumpMap=texturePattern('roof');
    m.bumpScale=.055;
    m.color.set(0xffffff);
  }else if(key.toLowerCase().includes('stone')||key.toLowerCase().includes('foundation')||key.toLowerCase().includes('shore')||key.toLowerCase().includes('wall')){
    m.map=texturePattern(key.toLowerCase().includes('wall')?'wall':'stone');
    m.bumpMap=m.map;
    m.bumpScale=.045;
    m.color.set(0xffffff);
  }else if(key.toLowerCase().includes('cloth')){
    m.map=texturePattern('cloth');
    m.color.set(0xffffff);
  }

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

  const trunk=wbox(.32,2.4,.32,0x3b2920,'trunk');
  trunk.position.y=1.2; g.add(trunk);

  const branchMat=wmat('branch',0x4a3225,.94);
  for(const side of [-1,1]){
    const branch=wbox(.13,1.0,.13,0x4a3225,'branch');
    branch.position.set(side*.27,1.62,0);
    branch.rotation.z=side*.68;
    branch.material=branchMat;
    g.add(branch);
  }

  const c1=variant%3===0?0x26392c:variant%3===1?0x30452f:0x1f352c;
  const clumps=[
    [0,2.20,0,.88],[-.42,2.42,.05,.62],[.42,2.42,-.06,.64],[0,2.92,-.12,.56]
  ];
  clumps.forEach((p,i)=>{
    const crown=orb(p[3],c1);
    crown.material=wmat('leaf'+(variant%3),c1,.92);
    crown.position.set(p[0],p[1],p[2]);
    crown.castShadow=true;
    g.add(crown);
  });

  props.add(g);
  return g;
}

const treeSpots=[];
for(let i=0;i<48;i++){
  const a=i*2.399;
  const rx=28+(i%11)*6.3;
  const rz=24+(i%9)*6.8;
  const x=Math.sin(a*1.21)*rx+(i%3-1)*6;
  const z=Math.cos(a*.93)*rz+(i%4-1.5)*7;
  if(Math.abs(x)<12&&Math.abs(z)<15)continue;
  const ts=.72+(i%5)*.09;
  treeSpots.push(tree(x,z,ts,i));
  addTreeCollider(x,z,ts);
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

for(let i=0;i<38;i++){
  const a=i*1.71;
  const r=20+(i%8)*9;
  const rx=Math.sin(a*1.31)*r,rz=Math.cos(a*.82)*r,rs=.55+(i%4)*.14;
  rock(rx,rz,rs); addRockCollider(rx,rz,rs);
}
for(let i=0;i<30;i++){
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
  glow.userData.baseIntensity=glow.intensity;
  lightSources.push(glow);
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
  addBoxCollider(x,z,2.95*s,2.45*s,rot,'house');
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
  addCircleCollider(x,z,1.35*s,'well');
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
  const half=(len-.5)/2,co=Math.cos(rot),si=Math.sin(rot);
  addSegmentCollider(x-half*co,z-half*si,x+half*co,z+half*si,.12,'fence');
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
  shore.receiveShadow=true;
  g.add(shore);

  const water=new THREE.Mesh(new THREE.CircleGeometry(1,64),wmat('pondWater',0x315f67,.13,.16));
  water.rotation.x=-Math.PI/2;
  water.scale.set(rx*.9,rz*.9,1);
  water.position.y=.13;
  g.add(water);

  const rippleMat=new THREE.MeshBasicMaterial({color:0x86cbd1,transparent:true,opacity:.25,depthWrite:false});
  const ripple=new THREE.Mesh(new THREE.RingGeometry(.18,.27,32),rippleMat);
  ripple.rotation.x=-Math.PI/2; ripple.position.y=.145;
  g.add(ripple);

  const ripple2=ripple.clone();
  ripple2.scale.setScalar(2.2); ripple2.material=rippleMat.clone(); ripple2.material.opacity=.12;
  g.add(ripple2);

  water.userData={ripple,ripple2,phase:Math.random()*Math.PI*2,rx,rz};
  waterSurfaces.push(water);
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

function hollowBell(x,z){
  const frame=new THREE.Group();frame.position.set(x,0,z);
  const stone=mat(0x453a34,.92,.08),bronze=new THREE.MeshStandardMaterial({color:0x80603f,roughness:.32,metalness:.76,emissive:0x180b05});
  for(const side of [-1,1]){
    const post=new THREE.Mesh(new THREE.BoxGeometry(.32,5.6,.32),stone);post.position.set(side*1.65,2.8,0);post.castShadow=true;frame.add(post);
    addBoxCollider(x+side*1.65,z,.2,.2,0,'bell-pillar');
  }
  const beam=new THREE.Mesh(new THREE.BoxGeometry(3.9,.42,.46),stone);beam.position.y=5.35;beam.castShadow=true;frame.add(beam);
  const brace=new THREE.Mesh(new THREE.BoxGeometry(2.2,.22,.25),stone);brace.position.set(0,4.68,0);brace.rotation.z=Math.PI/8;frame.add(brace);
  const clapper=new THREE.Group();clapper.position.y=4.95;
  const points=[[.12,0],[.38,.05],[.58,.27],[.54,.62],[.36,.82],[.29,.94],[.29,1.05]].map(p=>new THREE.Vector2(...p));
  const shell=new THREE.Mesh(new THREE.LatheGeometry(points,16),bronze);shell.castShadow=true;clapper.add(shell);
  const lip=new THREE.Mesh(new THREE.TorusGeometry(.43,.065,8,18),bronze);lip.rotation.x=Math.PI/2;lip.position.y=.06;clapper.add(lip);
  const clapperBall=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),mat(0xb17b4d,.4,.65));clapperBall.position.y=-.09;clapper.add(clapperBall);
  frame.add(clapper);
  const floorRune=new THREE.Mesh(new THREE.TorusGeometry(1.35,.035,6,32),new THREE.MeshBasicMaterial({color:0xc27650,transparent:true,opacity:.14}));floorRune.rotation.x=Math.PI/2;floorRune.position.y=.04;frame.add(floorRune);
  const glow=new THREE.PointLight(0xd27649,.12,13);glow.position.set(0,3.6,1.2);frame.add(glow);
  props.add(frame);addCircleCollider(x,z,.78,'bell');bellLandmarks.push({clapper,floorRune,glow});
}
hollowBell(56,-12);

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
  light.userData.baseIntensity=light.intensity;
  lightSources.push(light);
  g.add(light);
  props.add(g);
}
[[-1,-1],[17,12],[-17,-30],[37,-6],[49,39],[-49,-14]].forEach(p=>campfire(...p));

function stall(x,z,rot=0,variant=0){
  const g=new THREE.Group();
  g.position.set(x,0,z); g.rotation.y=rot;
  const wood=wmat('stallWood',0x4b3428,.92);
  const roof=wmat('stallRoof'+variant,variant%2?0x6c3b31:0x45525f,.94);
  for(const sx of [-1,1]){
    const post=wbox(.16,2.25,.16,0x4b3428,'stallPost'); post.position.set(sx*1.45,1.12,0); post.material=wood; g.add(post);
  }
  const counter=wbox(3.25,.28,1.25,0x5b4130,'stallCounter'); counter.position.y=1.0; g.add(counter);
  const awning=new THREE.Mesh(new THREE.BoxGeometry(3.45,.16,1.4),roof); awning.position.y=2.28; awning.rotation.x=-.10; awning.castShadow=true; g.add(awning);
  const crates=wbox(.72,.62,.7,0x70503a,'stallCrates'); crates.position.set(-.78,.47,0); g.add(crates);
  for(let i=0;i<3;i++){
    const goods=orb(.12,variant%2?0x95c46a:0xd0a35f);
    goods.position.set(.15+i*.34,1.22,.12*Math.sin(i)); g.add(goods);
  }
  props.add(g);
  addBoxCollider(x,z,1.78,0.78,rot,'stall');
}

function barrel(x,z,s=1){
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.45*s,.48*s,.9*s,12),wmat('barrel',0x624431,.92));
  b.position.set(x,.45*s,z); b.rotation.z=Math.PI/2; b.castShadow=true; b.receiveShadow=true; props.add(b);
  addCircleCollider(x,z,.49*s,'barrel');
  return b;
}
function crate(x,z,s=1){
  const c=wbox(.72*s,.72*s,.72*s,0x715137,'crate'); c.position.set(x,.36*s,z); props.add(c); addBoxCollider(x,z,.40*s,.40*s,0,'crate'); return c;
}
function cart(x,z,rot=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;
  const bed=wbox(2.1,.35,1.15,0x5b3f2d,'cartBed');bed.position.y=.72;g.add(bed);
  for(const sx of [-.75,.75]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.16,18),wmat('wheel',0x33251e,.98));
    wheel.rotation.z=Math.PI/2;wheel.position.set(sx,.48,0);g.add(wheel);
  }
  const handle=wbox(1.15,.13,.13,0x5b3f2d,'cartHandle');handle.position.set(1.35,.65,0);handle.rotation.z=.18;g.add(handle);
  props.add(g);
  addBoxCollider(x,z,1.12,.68,rot,'cart');
  const handleX=x+1.82*Math.cos(rot),handleZ=z-1.82*Math.sin(rot);
  addBoxCollider(handleX,handleZ,.62,.16,rot,'cart-handle');
}
stall(-5,13,.08,0); stall(7,13,-.12,1); stall(-19,-23,.18,0);
[-8,9,15,-17,24,34].forEach((z,i)=>barrel(i%2?-10:10,z,.8+(i%3)*.08));
crate(-7,14,.9); crate(9,14,.8); crate(-16,-22,.9); crate(-2,-27,1);
cart(1,13,.04); cart(-15,-25,.22);

function forge(x,z){
  const g=new THREE.Group();g.position.set(x,0,z);
  const base=wbox(2.5,.55,2.0,0x49423d,'forgeBase');base.position.y=.28;g.add(base);
  const roof=new THREE.Mesh(new THREE.ConeGeometry(1.9,1.35,4),wmat('forgeRoof',0x313136,.92));
  roof.position.y=2.35;roof.rotation.y=Math.PI/4;roof.castShadow=true;g.add(roof);
  const chimney=new THREE.Mesh(new THREE.CylinderGeometry(.30,.36,1.7,10),wmat('forgeChimney',0x3f3633,.98));
  chimney.position.set(.6,2.5,.2);chimney.castShadow=true;g.add(chimney);
  const fire=orb(.22,0xff7f42,true);fire.material=wmat('forgeFire',0xff713d,.3,.02,4);fire.position.y=.92;g.add(fire);
  const light=new THREE.PointLight(0xff7d43,1.2,7);
  light.position.y=1;
  light.userData.baseIntensity=light.intensity;
  lightSources.push(light);
  g.add(light);
  props.add(g);
}
forge(14,18);

const npcs=[
 {id:'lyra',name:'Lyra',role:'Sanctuary Keeper',pos:[-5,-3],c:0x70432f,a:0xb8784d},
 {id:'orren',name:'Orren',role:'Wayfinder',pos:[7,-1],c:0x384456,a:0x6f86a5},
 {id:'seer',name:'The Seer',role:'Keeper of Echoes',pos:[13,-8],c:0x493b63,a:0x9272c4}
].map(n=>{const g=new THREE.Group();g.position.set(n.pos[0],0,n.pos[1]);g.add(actor(n.c,n.a));characters.add(g);return {...n,homePosition:[...n.pos],root:g}});

function villagerModel(outfit,skin,hair,role){
  const g=new THREE.Group();
  const bodyMat=wmat('villagerOutfit'+outfit,outfit,.78,.03);
  const skinMat=wmat('villagerSkin'+skin,skin,.9,0);
  const hairMat=wmat('villagerHair'+hair,hair,.94,0);

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.30,.62,6,10),bodyMat);
  torso.position.y=.95; torso.castShadow=true; g.add(torso);

  const head=new THREE.Mesh(new THREE.SphereGeometry(.28,12,10),skinMat);
  head.position.y=1.68; head.castShadow=true; g.add(head);

  const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.29,12,8),hairMat);
  hairCap.position.set(0,1.80,-.02);hairCap.scale.set(1,.62,1);hairCap.castShadow=true;g.add(hairCap);

  for(const side of [-1,1]){
    const arm=new THREE.Mesh(new THREE.BoxGeometry(.15,.55,.15),bodyMat);
    arm.position.set(side*.39,1.0,0);arm.rotation.z=side*.08;arm.castShadow=true;g.add(arm);
    const leg=new THREE.Mesh(new THREE.BoxGeometry(.16,.62,.17),wmat('villagerPants',0x30333a,.9));
    leg.position.set(side*.15,.32,0);leg.castShadow=true;g.add(leg);
  }

  const accessory=new THREE.Group();
  accessory.position.y=1.1;
  if(role==='farmer'){
    const hat=new THREE.Mesh(new THREE.CylinderGeometry(.33,.42,.12,10),wmat('farmerHat',0xb9894e,.92));
    hat.position.y=1.0;accessory.add(hat);
  }else if(role==='merchant'){
    const scarf=new THREE.Mesh(new THREE.BoxGeometry(.46,.10,.42),wmat('merchantScarf',0x7a4f5c,.86));
    scarf.position.y=.36;accessory.add(scarf);
  }else if(role==='guard'){
    const badge=new THREE.Mesh(new THREE.BoxGeometry(.10,.30,.03),wmat('guardBadge',0xd6b469,.34,.45));
    badge.position.set(.0,.0,.31);accessory.add(badge);
  }else{
    const satchel=new THREE.Mesh(new THREE.SphereGeometry(.20,8,6),wmat('villagerBag',0x725039,.94));
    satchel.position.set(-.30,-.12,-.22);accessory.add(satchel);
  }
  g.add(accessory);

  return g;
}

function spawnVillager(id,name,role,x,z,outfit,skin=0xd0b9a5,hair=0x2e231c){
  const g=new THREE.Group();
  g.name=id; g.position.set(x,0,z);
  g.add(villagerModel(outfit,skin,hair,role));
  characters.add(g);
  villagers.push({
    id,name,role,root:g,home:new THREE.Vector3(x,0,z),
    target:new THREE.Vector3(x,0,z),
    wait:.5+Math.random()*3,
    speed:.55+Math.random()*.25,
    phase:Math.random()*Math.PI*2
  });
}

[
  ['farmer_01','Mira','farmer',-10,22,0x7b5d46,0xd3af8d,0x5a3b28],
  ['farmer_02','Tomas','farmer',10,22,0x4c634f,0xd0ab86,0x3d2c22],
  ['merchant_01','Elen','merchant',-2,26,0x59647b,0xe0bd99,0x6b4632],
  ['merchant_02','Corin','merchant',5,26,0x744d59,0xc99a79,0x2e272d],
  ['guard_01','Hale','guard',-18,13,0x454f63,0xcaa37f,0x343030],
  ['guard_02','Nora','guard',18,13,0x556073,0xe0bd99,0x453329],
  ['villager_01','Jory','villager',-14,18,0x72523f,0xd6ae8f,0x2b211e],
  ['villager_02','Sella','villager',14,19,0x6d5367,0xdfc09f,0x49382d],
  ['villager_03','Perrin','villager',-7,9,0x425b65,0xb98468,0x171719],
  ['villager_04','Ava','villager',7,9,0x8a624c,0xe4c5a1,0x5b3c2e]
].forEach(v=>spawnVillager(...v));
for(let i=6;i<villagers.length;i++)villagers[i].root.visible=false;
const nameplateLayer=document.createElement('div');nameplateLayer.className='npc-nameplates';nameplateLayer.setAttribute('aria-hidden','true');document.querySelector('.stage').appendChild(nameplateLayer);
const nameplateEntries=[...npcs,...villagers].map(person=>{const el=document.createElement('div');el.className='npc-nameplate';el.innerHTML='<b></b><small></small>';el.firstElementChild.textContent=person.name;el.lastElementChild.textContent=person.role.replaceAll('_',' ');nameplateLayer.appendChild(el);return{person,el}});
let nameplateAccumulator=0;
function updateNpcNameplates(){const stageRect=nameplateLayer.parentElement.getBoundingClientRect(),canvasRect=canvas.getBoundingClientRect(),p=new THREE.Vector3();for(const {person,el} of nameplateEntries){if(!person.root.visible||person.root.position.distanceTo(player.position)>28){el.classList.remove('visible');continue}p.copy(person.root.position);p.y+=person.name==='The Seer'?3.25:2.65;p.project(camera);if(p.z<-1||p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1){el.classList.remove('visible');continue}el.style.left=(canvasRect.left-stageRect.left+(p.x*.5+.5)*canvasRect.width)+'px';el.style.top=(canvasRect.top-stageRect.top+(-p.y*.5+.5)*canvasRect.height)+'px';el.classList.add('visible')}}

function updateVillagers(dt){
  for(const v of villagers){
    if(!v.root.visible)continue;
    v.wait-=dt;
    const dx=v.target.x-v.root.position.x;
    const dz=v.target.z-v.root.position.z;
    const d=Math.hypot(dx,dz);
    if(d>.35){
      const inv=1/Math.max(.001,d);
      v.root.position.x+=dx*inv*v.speed*dt;
      v.root.position.z+=dz*inv*v.speed*dt;
      v.root.rotation.y=Math.atan2(dx,dz);
      v.root.position.y=Math.sin(time*4+v.phase)*.012;
    }else if(v.wait<=0){
      const a=Math.random()*Math.PI*2;
      const r=2.5+Math.random()*8;
      v.target.set(
        THREE.MathUtils.clamp(v.home.x+Math.cos(a)*r,-22,22),
        0,
        THREE.MathUtils.clamp(v.home.z+Math.sin(a)*r,7,30)
      );
      v.wait=1.5+Math.random()*5;
    }
  }
}

const grassGeometry=new THREE.ConeGeometry(.055,.42,4);
const grassMaterial=new THREE.MeshBasicMaterial({color:0x506d3e,transparent:true,opacity:.72});
const grassMesh=new THREE.InstancedMesh(grassGeometry,grassMaterial,420);
const grassMatrix=new THREE.Matrix4();
let grassPlaced=0,grassSeed=0;
while(grassPlaced<420){
  const a=grassSeed*2.399;
  const r=8+(grassSeed%17)*5.2;
  const x=Math.sin(a*1.37)*r;
  const z=Math.cos(a*.91)*r;
  grassSeed++;
  if(Math.abs(x)<10&&Math.abs(z)<13)continue;
  const s=.7+(grassSeed%5)*.14;
  grassMatrix.makeRotationY((grassSeed%7)*.32);
  grassMatrix.setPosition(x,.21,z);
  grassMatrix.scale(new THREE.Vector3(s,1,s));
  grassMesh.setMatrixAt(grassPlaced,grassMatrix);
  grassPlaced++;
}
grassMesh.instanceMatrix.needsUpdate=true;
grassMesh.castShadow=false;
grassMesh.receiveShadow=false;
props.add(grassMesh);

function terrainMound(x,z,s=1,color=0x25261f){
  const g=new THREE.Mesh(new THREE.ConeGeometry(5,2.3,12),wmat('mound'+color.toString(16),color,.98));
  g.position.set(x,1.05,z);
  g.scale.set(1.5*s,.55*s,1.05*s);
  g.rotation.y=(x+z)*.03;
  g.receiveShadow=true;
  props.add(g);
}
[
  [-82,-68,1.8],[-60,70,1.5],[-5,84,1.9],[74,74,1.7],
  [86,-62,1.8],[-90,8,1.4],[83,4,1.4]
].forEach(p=>terrainMound(...p));

function addFlower(x,z,c){
  const g=new THREE.Group();g.position.set(x,0,z);
  const stem=wbox(.025,.30,.025,0x3f5934,'flowerStem');stem.position.y=.15;g.add(stem);
  const bloom=orb(.08,c,true);bloom.position.y=.33;g.add(bloom);
  props.add(g);
  return g;
}
for(let i=0;i<16;i++){
  const a=i*2.77,r=15+(i%7)*6;
  addFlower(Math.sin(a)*r,Math.cos(a*1.21)*r,i%3===0?0xe69fb1:i%3===1?0xf0c86f:0x9bc5e0);
}

const nodes=[];function node(type,x,z,c,label,parent=props,mapId='sanctuary'){const g=new THREE.Group();g.position.set(x,0,z);const o=orb(.32,c,true);o.position.y=.5;g.add(o);const r=new THREE.Mesh(new THREE.TorusGeometry(.55,.035,8,24),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.5}));r.rotation.x=Math.PI/2;g.add(r);parent.add(g);nodes.push({type,x,z,label,root:g,collected:false,mapId})}
node('ember',-10,-6,0xff7040,'Emberleaf');node('ember',-14,2,0xff7040,'Emberleaf');node('echo',48,-18,0x9b78dc,'Memory Echo');node('echo',65,-18,0x9b78dc,'Memory Echo');node('relic',3,-13,0xd7b36a,'Ancient Relic');

const MAPS={
  sanctuary:{name:'Sanctuary',hint:'The home that opens and closes every road.',chapters:[1,10],fog:0xc0aa98,ground:0x30281e,stone:0x665340,accent:0xd88b55,sky:0x4c8dca},
  hollow:{name:'Hollow Reach',hint:'A drowned archive where the old names still answer.',chapters:[2,3],fog:0x74828b,ground:0x252e33,stone:0x59656a,accent:0x7ec9c0,sky:0x46768a},
  crownlands:{name:'Crownlands',hint:'A broken capital stitched together by rival districts.',chapters:[4,5],fog:0xb08a68,ground:0x49352a,stone:0x806247,accent:0xe3ad68,sky:0x9a765c},
  choir:{name:'Choir of Ash',hint:'Black roots wind through a cathedral that remembers songs.',chapters:[6,7],fog:0x80708a,ground:0x302631,stone:0x554552,accent:0xc28cbb,sky:0x706082},
  glass:{name:'Glass Expanse',hint:'The observatory and starless depths share one fractured horizon.',chapters:[8,9],fog:0x7588a7,ground:0x26313e,stone:0x536780,accent:0x8ad7e4,sky:0x52749c}
};
const mapGroups={};
function mapIdForChapter(ch){if(ch===1||ch===10)return 'sanctuary';if(ch<=3)return 'hollow';if(ch<=5)return 'crownlands';if(ch<=7)return 'choir';return 'glass'}
function makeExpeditionMap(id){
  const def=MAPS[id],g=new THREE.Group(),colliders=mapColliders[id]=[];g.name='map-'+id;g.visible=false;world.add(g);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(128,128),mat(def.ground,.98));ground.rotation.x=-Math.PI/2;ground.position.y=-.08;g.add(ground);
  const pathMat=mat(def.stone,.96),path=new THREE.Mesh(new THREE.PlaneGeometry(9,90),pathMat);path.rotation.x=-Math.PI/2;path.position.y=.01;g.add(path);
  const detailMat=mat(def.accent,.83,.12),stoneMat=mat(def.stone,.95,.04);
  const seed=id.length*71;
  for(let i=0;i<26;i++){
    const a=i*2.399+seed,r=24+(i%5)*6,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const h=1.5+(i%4)*.8,rad=.7+(i%3)*.35;
    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(rad,0),i%4===0?detailMat:stoneMat);
    rock.position.set(x,h*.45,z);rock.scale.set(.8,h,1.1);rock.rotation.set(i*.23,i*.71,i*.17);g.add(rock);
    colliders.push({kind:'circle',x,z,r:rad*.72,tag:'region-rock'});
  }
  // A landmark makes each paired chapter region immediately recognizable.
  const landmark=new THREE.Group();landmark.position.set(0,0,-27);g.add(landmark);
  for(let side=-1;side<=1;side+=2){const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.7,.95,7,7),stoneMat);pillar.position.set(side*4,3.5,0);pillar.rotation.z=side*.06;landmark.add(pillar);colliders.push({kind:'circle',x:side*4,z:-27,r:1.05,tag:'landmark-pillar'})}
  const lintel=new THREE.Mesh(new THREE.BoxGeometry(10,.85,1.1),detailMat);lintel.position.y=7;landmark.add(lintel);
  const sigil=new THREE.Mesh(new THREE.TorusGeometry(1.55,.12,8,24),new THREE.MeshStandardMaterial({color:def.accent,emissive:def.accent,emissiveIntensity:.28,roughness:.75,metalness:.1}));sigil.position.set(0,4.3,.68);landmark.add(sigil);
  if(id==='hollow'){
    const pool=new THREE.Mesh(new THREE.CircleGeometry(5,32),new THREE.MeshStandardMaterial({color:0x477b83,roughness:.25,metalness:.18,transparent:true,opacity:.62}));pool.rotation.x=-Math.PI/2;pool.position.set(0,.04,8);g.add(pool);
    for(let i=0;i<4;i++){const slab=new THREE.Mesh(new THREE.BoxGeometry(2.4,.28,1.2),stoneMat);slab.position.set((i-1.5)*2,.22,8+(i%2)*1.3);slab.rotation.y=(i%2)*.2;g.add(slab)}
  }else if(id==='crownlands'){
    for(let i=0;i<5;i++){const x=(i-2)*5,z=-5-(i%2)*2,wall=new THREE.Mesh(new THREE.BoxGeometry(3.4,4.5,2.6),stoneMat);wall.position.set(x,2.25,z);g.add(wall);colliders.push({kind:'box',x,z,hx:1.8,hz:1.4,rot:0,cos:1,sin:0,tag:'city-ruin'});const roof=new THREE.Mesh(new THREE.ConeGeometry(2.5,1.5,4),detailMat);roof.position.set(x,5.1,z);roof.rotation.y=Math.PI/4;g.add(roof);const window=new THREE.Mesh(new THREE.PlaneGeometry(.48,.9),new THREE.MeshBasicMaterial({color:0xf0bc76}));window.position.set(x,2.3,z+1.34);g.add(window)}
  }else if(id==='choir'){
    const bell=new THREE.Mesh(new THREE.CylinderGeometry(.55,1.25,2.1,9),detailMat);bell.position.set(0,3.1,0);landmark.add(bell);
    const clapper=new THREE.Mesh(new THREE.SphereGeometry(.22,10,8),stoneMat);clapper.position.set(0,1.85,0);landmark.add(clapper);
    for(let i=0;i<3;i++){const rib=new THREE.Mesh(new THREE.TorusGeometry(5+i*1.6,.08,6,48),detailMat);rib.rotation.x=Math.PI/2;rib.position.y=.15;g.add(rib)}
  }else if(id==='glass'){
    for(let i=0;i<9;i++){const x=(i%3-1)*3.2,z=-7-Math.floor(i/3)*3.2,crystal=new THREE.Mesh(new THREE.OctahedronGeometry(1.35+(i%2)*.5,0),detailMat);crystal.scale.set(.65,2.3,.75);crystal.position.set(x,2.8,z);crystal.rotation.z=(i%3-1)*.18;g.add(crystal);colliders.push({kind:'circle',x,z,r:.85,tag:'crystal'})}
    const astrolabe=new THREE.Mesh(new THREE.TorusGeometry(5,.12,8,48),detailMat);astrolabe.rotation.x=Math.PI/2;astrolabe.position.set(0,.3,-12);g.add(astrolabe);
  }
  for(let i=0;i<10;i++){
    const x=(i%2?1:-1)*(12+Math.floor(i/2)*2.2),z=14-Math.floor(i/2)*9;
    const marker=new THREE.Mesh(new THREE.CylinderGeometry(.055,.08,1.3,5),detailMat);marker.position.set(x,.65,z);marker.rotation.z=(i%3-1)*.15;g.add(marker);
    const tip=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),detailMat);tip.position.set(x,1.35,z);g.add(tip);
  }
  // Compact resource loops keep chapter objectives close while optional materials sit farther out.
  node('ember',-8,2,def.accent,'Wild Ember',g,id);node('ember',8,2,def.accent,'Wild Ember',g,id);
  node('echo',-8,-12,0xa8a5ed,'Lost Trace',g,id);node('echo',8,-12,0xa8a5ed,'Lost Trace',g,id);
  node('relic',0,29,0xf0cf83,'Buried Cache',g,id);
  mapGroups[id]=g;return g;
}
for(const id of Object.keys(MAPS))if(id!=='sanctuary')makeExpeditionMap(id);
const persistentWorldRoots=world.children.filter(o=>![characters,props,effects,...Object.values(mapGroups)].includes(o));
function setActiveMap(id,teleport=true){
  activeMapId=MAPS[id]?id:'sanctuary';
  state.currentMap=activeMapId;
  for(const root of persistentWorldRoots)root.visible=activeMapId==='sanctuary';
  props.visible=activeMapId==='sanctuary';sanctuaryBuild.visible=activeMapId==='sanctuary';
  for(const [key,group] of Object.entries(mapGroups))group.visible=key===activeMapId;
  const home=activeMapId==='sanctuary';
  villagers.forEach(v=>v.root.visible=home);
  npcs.forEach((n,i)=>{const p=home?n.homePosition:[[0,12],[5,9],[-5,9]][i];n.root.position.set(p[0],0,p[1]);n.root.visible=true});
  for(const n of nodes)n.root.visible=n.mapId===activeMapId&&!n.collected;
  wildlife.forEach(w=>w.root.visible=home);
  if(teleport)player.position.set(0,0,home?7:14);
  const def=MAPS[activeMapId];scene.fog.color.setHex(def.fog);scene.fog.near=activeMapId==='sanctuary'?58:30;scene.fog.far=activeMapId==='sanctuary'?245:105;
  $('locationName').textContent=def.name.toUpperCase();$('locationHint').textContent=def.hint;
  nearbyTarget=null;nearbyRefresh=0;
}
function canFastTravel(){return state.chapter>=10&&state.quest>=5&&(state.meta.chaptersComplete>=10||state.flags.legacyHome)}
function fastTravel(id){if(!canFastTravel()||!MAPS[id])return;encounter?.root.removeFromParent();encounter=null;enemies=[];setEncounterHud(null);setActiveMap(id,true);player.position.set(0,0,id==='sanctuary'?7:14);state.hp=state.maxHp;state.stamina=100;saveState();$('systemMenu').classList.remove('show');toastMsg('Travelled to '+MAPS[id].name)}

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
  if(wildlife.length>=14)return;
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
  for(let i=0;i<count&&wildlife.length<14;i++){
    const z=zones[i%zones.length];
    const ang=Math.random()*Math.PI*2, r=5+Math.random()*18;
    createWildlife(z[0]+Math.cos(ang)*r,z[1]+Math.sin(ang)*r,Math.floor(z[2]+i));
  }
}

function updateWildlife(dt){
  for(const a of wildlife){
    if(!a.root.parent)continue;
    const dx=a.root.position.x-player.position.x,dz=a.root.position.z-player.position.z,distance=Math.hypot(dx,dz);
    if(distance<7){
      const inv=1/Math.max(.001,distance),dirx=dx*inv,dirz=dz*inv;
      const jx=(Math.random()-.5)*.35,jz=(Math.random()-.5)*.35,jl=Math.hypot(dirx+jx,dirz+jz)||1;
      a.dir.x=(dirx+jx)/jl;a.dir.y=0;a.dir.z=(dirz+jz)/jl;a.turnTimer=.8+Math.random()*1.2;
    }else{
      a.turnTimer-=dt;
      if(a.turnTimer<=0){
        const turn=(Math.random()-.5)*1.2,ct=Math.cos(turn),st=Math.sin(turn);
        const ndx=a.dir.x*ct-a.dir.z*st,ndz=a.dir.x*st+a.dir.z*ct;
        a.dir.x=ndx;a.dir.z=ndz;a.turnTimer=2+Math.random()*5;
      }
    }
    const runBoost=distance<3.5?1.7:1;
    a.root.position.x+=a.dir.x*a.speed*runBoost*dt;a.root.position.z+=a.dir.z*a.speed*runBoost*dt;
    const hx=a.root.position.x-a.home.x,hz=a.root.position.z-a.home.z;
    if(hx*hx+hz*hz>324){const inv=1/Math.max(.001,Math.hypot(hx,hz));a.dir.x=-hx*inv;a.dir.z=-hz*inv}
    const edge=Math.max(Math.abs(a.root.position.x),Math.abs(a.root.position.z));
    if(edge>104){a.root.position.x=THREE.MathUtils.clamp(a.root.position.x,-102,102);a.root.position.z=THREE.MathUtils.clamp(a.root.position.z,-102,102)}
    a.root.rotation.y=Math.atan2(a.dir.x,a.dir.z);
    const bob=Math.sin(time*3.5+a.phase)*.025,stride=Math.sin(time*10+a.phase)*.035;
    if(a.type==='rabbit')a.root.position.y=Math.max(0,bob*2);else if(a.type==='deer')a.root.position.y=Math.max(0,bob*.7);
    if(a.type==='deer')a.root.rotation.z=Math.sin(time*10+a.phase)*.02;
    if(a.type==='rabbit')a.root.rotation.z=stride*.7;
    if(a.type==='fox'||a.type==='boar')a.root.position.y=Math.max(0,bob*.4);
  }

  for(const b of birds){
    const u=b.userData,t=time*.55+u.phase;
    b.position.x=u.center.x+Math.cos(t*u.speed)*u.radius;
    b.position.z=u.center.z+Math.sin(t*u.speed*.82)*u.radius;
    b.position.y=u.height+Math.sin(t*1.9)*1.2;
    b.rotation.y=Math.atan2(Math.cos(t*u.speed*.82),-Math.sin(t*u.speed));
    b.children[1].rotation.z=.25+Math.sin(t*7)*.25;
    b.children[2].rotation.z=-.25-Math.sin(t*7)*.25;
  }
  for(const cl of cloudObjects){cl.position.x+=cl.userData.speed*dt;if(cl.position.x>125)cl.position.x=-125}
  for(const water of waterSurfaces){
    const u=water.userData;
    if(!u)continue;
    const rippleScale=.78+Math.sin(time*.65+u.phase)*.13;
    u.ripple.scale.setScalar(rippleScale);
    u.ripple2.scale.setScalar(1.6+Math.sin(time*.52+u.phase)*.22);
    u.ripple.material.opacity=.15+.06*(Math.sin(time*.8+u.phase)+1);
  }
  updateVillagers(dt);
}

let encounterHud;
function setEncounterHud(enemy){
  if(!encounterHud){encounterHud=document.createElement('div');encounterHud.className='encounter-hud';encounterHud.innerHTML='<span>WANDERING SHADE</span><b>45 / 45</b><i><em></em></i>';document.querySelector('.stage').appendChild(encounterHud)}
  encounterHud.classList.toggle('visible',!!enemy);
  if(enemy){encounterHud.querySelector('span').textContent=enemy.isBoss?(state.chapter===1?'THE BELL WARDEN':'CHAPTER '+String(state.chapter).padStart(2,'0')+' WARDEN · SKILL '+(enemy.attackSkill||1)):'WANDERING SHADE';encounterHud.querySelector('b').textContent=Math.ceil(enemy.hp)+' / '+enemy.maxHp;encounterHud.querySelector('em').style.width=Math.max(0,enemy.hp/enemy.maxHp*100)+'%';encounterHud.classList.toggle('warning',enemy.state==='windup')}
}
let enemies=[];
let worldSimAccumulator=0;
let fpsAccumulator=0;
let fpsFrames=0;
let encounterHudAccumulator=0;
let adaptiveDpr=1;
function spawnEnemy(){
  if(enemies.length)return;
  if(activeMapId==='sanctuary'&&Math.hypot(player.position.x,player.position.z-7)<28)return;
  const isBoss=state.quest===3&&state.echoes>=2&&!state.flags.bellWardenDefeated;
  const angle=Math.random()*Math.PI*2;
  const radius=isBoss?10+Math.random()*3:12+Math.random()*15;
  const mapBound=activeMapId==='sanctuary'?92:50;
  const spawn=new THREE.Vector3(
    THREE.MathUtils.clamp(player.position.x+Math.cos(angle)*radius,-mapBound,mapBound),
    0,
    THREE.MathUtils.clamp(player.position.z+Math.sin(angle)*radius,-mapBound,mapBound)
  );
  const g=new THREE.Group();
  g.position.copy(spawn);
  const bodyColor=isBoss?0x3f211f:state.quest>=3?0x613b31:0x684a79;
  const b=new THREE.Mesh(new THREE.IcosahedronGeometry(isBoss?.68:.48,isBoss?1:0),mat(bodyColor,.38,.28));
  b.material.emissive=new THREE.Color(isBoss?0xb23e22:bodyColor).multiplyScalar(isBoss?1.1:.9);
  b.position.y=1;
  g.add(b);
  if(isBoss){
    const crownMat=mat(0x8c5939,.3,.72);
    for(let i=-1;i<=1;i++){
      const crown=new THREE.Mesh(new THREE.ConeGeometry(.13,.65,5),crownMat);
      crown.position.set(i*.3,1.77-Math.abs(i)*.11,0);
      crown.rotation.z=i*-.18;
      g.add(crown);
    }
    const seal=new THREE.Mesh(new THREE.TorusGeometry(.87,.075,8,20),new THREE.MeshStandardMaterial({color:0xa9472d,emissive:0x5a170e,metalness:.35,roughness:.42}));
    seal.position.y=1.05;
    g.add(seal);
    const mantle=new THREE.Mesh(new THREE.ConeGeometry(.82,.9,7),mat(0x211616,.9,.05));
    mantle.position.set(0,.48,-.06);
    mantle.rotation.x=Math.PI;
    g.add(mantle);
  }else{
    const horn=wbox(.18,.7,.18,0x352a2b,'enemyHorn');
    horn.position.set(0,1.55,0);
    horn.rotation.z=.25;
    g.add(horn);
  }
  const e1=orb(.06,0xffc48b,true),e2=e1.clone();
  e1.position.set(-.13,1.08,.35); e2.position.set(.13,1.08,.35);
  g.add(e1,e2);
  characters.add(g);
  const maxHp=Math.round((isBoss?150:state.quest>=3?90:45)*(1+(state.chapter-1)*.18)+Math.max(0,state.level-1)*4);
  encounter={root:g,hp:maxHp,maxHp,state:'approach',cooldown:1.1+Math.random(),windup:0,attackDamage:(isBoss?17:state.quest>=3?14:9)+Math.floor((state.chapter-1)*1.2),attackSkill:0,body:b,isBoss};
  enemies=[encounter];
  if(isBoss)attachProductionBoss(encounter);
  setEncounterHud(encounter);
  toastMsg(isBoss?'The bell answers. The Warden has found you.':'A wandering shade has entered the wilds.');
}
function dodge(){
  if(anyOverlayOpen()||dodgeCooldown>0||state.stamina<18)return;
  dodgeCooldown=.72;dodgeIFrames=.34;state.stamina-=18;
  const next=resolveCollisions(
    THREE.MathUtils.clamp(player.position.x-Math.sin(yaw)*2.6,activeMapId==='sanctuary'?-106:-54,activeMapId==='sanctuary'?106:54),
    THREE.MathUtils.clamp(player.position.z-Math.cos(yaw)*2.6,activeMapId==='sanctuary'?-106:-54,activeMapId==='sanctuary'?106:54)
  );
  player.position.x=next.x;player.position.z=next.z;
}
let dodgeCooldown=0;
function recalculateEquipmentStats(){const next={vitality:0,focus:0,ward:0};for(const gear of Object.values(state.equipment)){if(!gear)continue;const s=gear.stats||{};next.vitality+=Number(s.vitality||0);next.focus+=Number(s.focus||0);next.ward+=Number(s.ward||0)}state.stats=next;state.maxHp=100+next.vitality*12+(state.meta.hubLevel||0)*4;state.hp=Math.min(state.hp,state.maxHp)}
function xp(n){state.meta.mastery+=Math.max(1,Math.floor(n/5));state.meta.points+=Math.max(1,Math.floor(n/20));state.xp+=n;let need=100+state.level*55;while(state.xp>=need){state.xp-=need;state.level++;state.skillPoints++;recalculateEquipmentStats();state.hp=state.maxHp;toastMsg('Level up — Lv '+state.level+' · 1 skill point earned');need=100+state.level*55}refreshSkillHud();scheduleSave()}
function activeRole(){return ROLE_DEFS[state.role]||ROLE_DEFS.ashbreaker}
function updateSanctuaryBuild(){for(const old of sanctuaryBuild.children){old.geometry?.dispose();if(Array.isArray(old.material))old.material.forEach(m=>m.dispose());else old.material?.dispose()}sanctuaryBuild.clear();const x=-7,z=7,level=Math.max(0,Number(state.meta.hubLevel)||0),platform=new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.35,.22,12),mat(0x514031,.9,.12));platform.position.set(x,.12,z);platform.receiveShadow=false;platform.castShadow=false;sanctuaryBuild.add(platform);const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.38,.52,.46,10),mat(0x76503a,.62,.32));bowl.position.set(x,.43,z);sanctuaryBuild.add(bowl);const flame=orb(.22,0xff8245,true);flame.position.set(x,.86,z);sanctuaryBuild.add(flame);if(level>=1){for(const dx of [-1.5,1.5])for(const dz of [-1.3,1.3]){const post=box(.16,2,.16,0x513829);post.position.set(x+dx,1.12,z+dz);post.castShadow=false;sanctuaryBuild.add(post)}}if(level>=2){const beam=box(3.3,.18,2.9,0x39271f);beam.position.set(x,2.16,z);beam.castShadow=false;sanctuaryBuild.add(beam)}if(level>=3){const roof=new THREE.Mesh(new THREE.ConeGeometry(2.55,.85,4),mat(0x28211e,.85,.12));roof.position.set(x,2.65,z);roof.rotation.y=Math.PI/4;roof.castShadow=false;sanctuaryBuild.add(roof)}const records=Math.min(10,Math.max(Number(state.meta.chaptersComplete)||0,state.flags.legacyHome?10:0));for(let i=0;i<records;i++){const a=-Math.PI*.82+i/(Math.max(1,records-1))*Math.PI*.64,r=3.1,stone=box(.24,.55+(i%3)*.12,.18,i%2?0x8c684c:0xa17b59);stone.position.set(x+Math.cos(a)*r,.36,z+Math.sin(a)*r);stone.rotation.y=-a;stone.castShadow=false;sanctuaryBuild.add(stone)}}
function applyRoleLook(){const role=activeRole(),palette={default:role.colors,ember:[0x302a29,0x9d6b42],moon:[0x303b48,0x83a7bd],moss:[0x394335,0x9ca66b]}[state.appearance]||role.colors;armorMat.color.setHex(palette[0]);brassMat.color.setHex(palette[1]);if(playerVisual.children[0]?.material)playerVisual.children[0].material.color.setHex(role.colors[0]);if(playerVisual.children[8]?.material)playerVisual.children[8].material.color.setHex(role.colors[1]);const capes=playerVisual.children.filter(o=>o.geometry?.type==='ConeGeometry');if(capes.length)capes[capes.length-1].material.color.setHex(role.colors[0]);swordBlade.visible=state.role==='ashbreaker';twinBlade.visible=state.role==='glassblade';roleStaff.visible=state.role==='cinderweaver';roleBow.visible=state.role==='briarshot';const roleButton=$('roleButton');if(roleButton)roleButton.textContent=role.name.toUpperCase();refreshSkillHud()}
function refreshSkillHud(){const hotbar=$( 'skillHotbar' );if(!hotbar)return;const role=activeRole();hotbar.querySelectorAll('[data-skill]').forEach((button,i)=>{const skill=role.skills[i],rank=state.skillRanks[i]||0,remaining=skillCooldowns[i]||0;button.querySelector('span').textContent=remaining>0?remaining.toFixed(1)+'s':skill[0].toUpperCase();button.title=skill[0]+' · Rank '+(rank+1)+' · press '+(i+1);button.dataset.rank=rank;button.classList.toggle('cooling',remaining>0);button.querySelector('i').style.transform='scaleY('+Math.min(1,remaining/(skill[2]*(1-rank*.07)))+')'})}
function calcPlayerDamage(base,rank=0,isSkill=false){const levelBonus=Math.max(0,state.level-1)*(isSkill?1.5:1.35),focusBonus=Math.max(0,state.stats.focus)*(isSkill?1.5:1.2),skillScale=isSkill ? .84*(1+rank*.14):1,weaponScale=1+Math.min(12,Math.max(0,state.weaponRank||0))*.02;return Math.round((base*skillScale+levelBonus+focusBonus)*weaponScale)}
function useSkill(index){if(anyOverlayOpen()||!encounter||!activeRole().skills[index])return;const rank=state.skillRanks[index]||0,skill=activeRole().skills[index],cd=skill[2]*(1-rank*.07);skillCooldowns[index]=skillCooldowns[index]||0;if(skillCooldowns[index]>0||state.stamina<skill[3])return;const to=encounter.root.position.clone().sub(player.position);to.y=0;const distance=to.length(),range=['cinderweaver','briarshot'].includes(state.role)?14:5;if(distance>range){toastMsg('Out of range — '+skill[0]);return}skillCooldowns[index]=cd;state.stamina-=skill[3];player.rotation.y=Math.atan2(to.x,to.z);encounter.hp-=calcPlayerDamage(skill[1],rank,true);playGameSound('skill');playPlayerAnimation('Heavy',620);if(state.settings.visualEffects!==false){const color=activeRole().colors[1],ring=new THREE.Mesh(new THREE.TorusGeometry(Math.min(2.5,1.25+index*.4),.07,6,24),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9}));ring.rotation.x=Math.PI/2;ring.position.copy(player.position);ring.position.y=.18;effects.add(ring);setTimeout(()=>ring.removeFromParent(),360)}if(encounter.hp<=0)finishEncounter();else{setEncounterHud(encounter);encounter.cooldown=Math.max(encounter.cooldown,.6)}refreshSkillHud()}
const skillCooldowns=[0,0,0];let nearbyTarget=null,nearbyRefresh=0,nodeSpinAccumulator=0,skillHudAccumulator=0;
function openSystemMenu(page){const modal=$('systemMenu'),title=$('systemTitle'),content=$('systemContent');if(!modal||!title||!content)return;modal.dataset.page=page;modal.classList.add('show');if(page==='role'){title.textContent='CHOOSE YOUR ATTACKING ROLE';content.innerHTML='<p class="system-intro">Every role is built to deal damage. Change roles whenever you return to the Sanctuary.</p><div class="role-grid">'+Object.entries(ROLE_DEFS).map(([id,r])=>'<button class="role-choice '+(state.role===id?'selected':'')+'" data-role="'+id+'"><b>'+r.name+'</b><span>'+r.style+'</span><small>'+r.skills.map((x,i)=>(i+1)+' '+x[0]).join(' · ')+'</small></button>').join('')+'</div><div class="system-row"><span>LOOK</span>'+[['default','Ash'],['moon','Moon'],['moss','Moss']].map(([id,label])=>'<button data-appearance="'+id+'" class="mini-choice '+(state.appearance===id?'selected':'')+'">'+label+'</button>').join('')+'</div>'}
else if(page==='skills'){title.textContent='COMBAT SKILLS · '+state.skillPoints+' POINTS';content.innerHTML='<p class="system-intro">Spend one point to improve a role skill. Each rank raises damage and shortens its cooldown.</p><div class="skill-upgrades">'+activeRole().skills.map((sk,i)=>'<article><div><b>'+i+1+' · '+sk[0]+'</b><small>Rank '+((state.skillRanks[i]||0)+1)+' / 4 · '+calcPlayerDamage(sk[1],state.skillRanks[i]||0,true)+' damage · '+(sk[2]*(1-(state.skillRanks[i]||0)*.07)).toFixed(1)+'s cooldown</small></div><button data-upgrade="'+i+'" '+(!state.skillPoints||state.skillRanks[i]>=3?'disabled':'')+'>UPGRADE</button></article>').join('')+'</div>'}
else if(page==='settings'){title.textContent='SETTINGS';content.innerHTML='<p class="system-intro">Tune sound, animation, controls and image quality. Changes apply immediately and save in this browser.</p><h3 class="setting-section-title">SOUND</h3><label class="setting-row">Game sound effects <input id="soundSetting" type="checkbox" '+(state.settings.sound!==false?'checked':'')+'></label><label class="setting-row">Sound volume <input id="volumeSetting" type="range" min="0" max="1" step="0.05" value="'+Number(state.settings.volume??.35)+'"><b id="volumeValue">'+Math.round(Number(state.settings.volume??.35)*100)+'%</b></label><h3 class="setting-section-title">WORLD & DISPLAY</h3><label class="setting-row">World and character animations <input id="animationsSetting" type="checkbox" '+(state.settings.animations!==false?'checked':'')+'></label><label class="setting-row">Combat visual effects <input id="effectsSetting" type="checkbox" '+(state.settings.visualEffects!==false?'checked':'')+'></label><label class="setting-row">Graphics quality<select id="qualitySetting"><option value="auto">Adaptive</option><option value="performance">Performance</option><option value="high">High</option></select></label><label class="setting-row">Reduce camera motion <input id="motionSetting" type="checkbox" '+(state.settings.reducedMotion?'checked':'')+'></label><h3 class="setting-section-title">CONTROLS & INTERFACE</h3><label class="setting-row">Interface size <input id="uiScaleSetting" type="range" min="0.8" max="1.2" step="0.05" value="'+Number(state.settings.uiScale||1)+'"><b id="uiScaleValue">'+Math.round((state.settings.uiScale||1)*100)+'%</b></label><label class="setting-row">Camera field of view <input id="cameraFovSetting" type="range" min="42" max="68" step="1" value="'+Number(state.settings.cameraFov||55)+'"><b id="cameraFovValue">'+Math.round(state.settings.cameraFov||55)+'°</b></label><label class="setting-row">Camera sensitivity <input id="sensitivitySetting" type="range" min="0.5" max="2" step="0.1" value="'+state.settings.sensitivity+'"><b>'+Number(state.settings.sensitivity).toFixed(1)+'×</b></label><div class="system-row"><span>CHARACTER LOOK</span><button data-open="role">CHANGE ROLE & LOOK</button></div><h3 class="setting-section-title">OPTIONAL FULL RESOURCE PACK</h3><div class="resource-pack-card"><div class="resource-pack-copy"><b>Production models</b><small id="resourcePackStatus" aria-live="polite">Checking local storage…</small><progress id="resourcePackProgress" value="0" max="100"></progress></div><div class="resource-pack-actions"><button id="downloadResourcePack" type="button">DOWNLOAD FULL PACK</button><button id="removeResourcePack" type="button" hidden>REMOVE PACK</button></div></div><div class="setting-note">Full pack is optional and saved in this browser for later visits. Sound effects are synthesized; this build has no music tracks.</div>';const q=$('qualitySetting');q.value=state.settings.quality||'auto';refreshResourcePackUi()}
  else{const atSanctuary=activeMapId==='sanctuary';if(atSanctuary){state.hp=state.maxHp;state.stamina=100;scheduleSave()}title.textContent=state.chapter>=10&&state.quest>=5?'SANCTUARY · LEGACY HOME':atSanctuary?'SANCTUARY · CAMP & FORGE':'FIELD CAMP · '+MAPS[activeMapId].name.toUpperCase();const cost=80+state.meta.hubLevel*60,forgeCost=90+(state.weaponRank||0)*75,claimable=Math.floor((state.hunt?.kills||0)/5);content.innerHTML='<p class="system-intro">Build the hearth, improve your weapon, claim hunt contracts, and prepare for the next road.</p><div class="sanctuary-stats"><div><b>CHAPTER</b><span>'+state.chapter+' / 10</span></div><div><b>HEARTH</b><span>LEVEL '+(state.meta.hubLevel+1)+'</span></div><div><b>COMPLETED</b><span>'+state.meta.chaptersComplete+' / 10</span></div><div><b>ASHEN</b><span>'+state.coins+'</span></div></div><div class="system-row"><span>HEARTH UPGRADE · COST '+cost+' ASHEN</span><button data-build="1" '+(state.coins<cost||!atSanctuary?'disabled':'')+'>BUILD</button></div><div class="system-row"><span>WEAPON REINFORCEMENT · +2% DAMAGE · RANK '+(state.weaponRank||0)+' / 12 · SHARDS '+state.shards+'</span><button data-forge="1" '+(state.coins<forgeCost||!state.shards||!atSanctuary||(state.weaponRank||0)>=12?'disabled':'')+'>REINFORCE · '+forgeCost+' ASHEN + 1 SHARD</button></div><div class="system-row"><span>HUNT CONTRACT · '+((state.hunt?.kills||0)%5)+' / 5 DEFEATED</span><button data-claim="1" '+(!claimable?'disabled':'')+'>CLAIM '+(claimable?'· '+(100+state.level*15)+' ASHEN + XP':'REWARD')+'</button></div><div class="system-row"><span>SKILL TRAINING</span><button data-open="skills">OPEN SKILLS</button></div><div class="system-row"><span>EXPEDITION · '+(MAPS[mapIdForChapter(Math.min(10,state.chapter+1))]?.name||'Sanctuary')+'</span><button data-expedition="1" '+(state.quest<5||state.chapter>=10||!atSanctuary?'disabled':'')+'>'+(state.quest<5?'FINISH CHAPTER '+String(state.chapter).padStart(2,'0'):state.chapter>=10?'ALL CHAPTERS COMPLETE':!atSanctuary?'RETURN TO SANCTUARY':'BEGIN CHAPTER '+String(state.chapter+1).padStart(2,'0'))+'</button></div>'+(canFastTravel()?'<h3 class="travel-heading">THE FIVE ROADS · FREE TRAVEL</h3><p class="system-intro">Ten chapters complete. Choose any region to explore its creatures and landmarks; story progress stays complete.</p><div class="travel-grid">'+Object.entries(MAPS).map(([id,map])=>'<button class="travel-choice '+(id===activeMapId?'selected':'')+'" data-travel="'+id+'" '+(id===activeMapId?'disabled':'')+'><b>'+map.name+'</b><small>'+map.hint+'</small></button>').join('')+'</div>':'')+'</div>'}}
function upgradeSkill(index){if(!state.skillPoints||!Number.isInteger(index)||index<0||index>2||(state.skillRanks[index]||0)>=3)return;state.skillPoints--;state.skillRanks[index]=(state.skillRanks[index]||0)+1;openSystemMenu('skills');saveState();toastMsg(activeRole().skills[index][0]+' upgraded')}
function recordHuntKill(boss){state.hunt=state.hunt||{kills:0};state.hunt.kills++;state.shards+=boss?3:1;if(state.hunt.kills%5===0)toastMsg('Hunt contract ready · claim it at the Sanctuary');}
function finishEncounter(){const defeated=encounter;if(!defeated)return;const bellWaiting=!defeated.isBoss&&state.quest===3&&state.echoes>=2&&!state.flags.bellWardenDefeated;defeated.root.removeFromParent();enemies=[];recordHuntKill(defeated.isBoss);state.coins+=defeated.isBoss?90:25;xp(defeated.isBoss?90:35);if(defeated.isBoss){const ch=window.ASHEN_CAMPAIGN[state.chapter-1]||window.ASHEN_CAMPAIGN[0];state.flags.bellWardenDefeated=true;state.quest=4;if(state.chapter===1){item('Eda Vey’s Name','Quest Relic','Legendary',['Memory','Identity'],{focus:2});state.log.unshift('The Bell Warden was Eda Vey, the keeper who refused to let the Crown erase her village.');toastMsg('The Bell Warden falls — Eda Vey is remembered.')}else{item(ch.items[ch.items.length-1]||ch.title,'Chapter Relic','Legendary',['Chapter '+state.chapter,'Boss Drop'],{focus:2});state.log.unshift('The chapter warden fell. '+ch.title+' can no longer keep its record hidden.');toastMsg(ch.title+' warden defeated · chapter relic recovered')}setQuest()}else{item('Ashen Wisp Fragment','Relic','Rare',['Encounter Drop'],{focus:1});if(!bellWaiting)toastMsg('Encounter cleared · +1 forge shard')}encounter=null;setEncounterHud(null);if(bellWaiting){toastMsg('The bell answers. The Warden has found you.');spawnEnemy()}saveState()}
function advanceChapter(){if(state.quest<5||state.chapter>=10)return;state.meta.chaptersComplete=Math.max(state.meta.chaptersComplete,state.chapter);updateSanctuaryBuild();state.chapter++;state.quest=0;state.chapterGathered=0;state.echoes=0;state.flags.bellAwakened=false;state.flags.bellWardenDefeated=false;state.flags.gate=false;state.flags.truth=false;state.flags.sanctuaryOpen=false;state.flags.protectedSanctuary=false;state.collectedNodes=[];restoreCollectedNodes();state.hp=state.maxHp;state.stamina=100;setActiveMap(mapIdForChapter(state.chapter));const chapter=window.ASHEN_CAMPAIGN?.[state.chapter-1];state.log.unshift('Expedition '+state.chapter+' begins: '+(chapter?.title||'The next road')+'.');saveState();$('systemMenu').classList.remove('show');setQuest();showChapterTitle(chapter?.title||'NEW EXPEDITION','Explore '+MAPS[activeMapId].name+' · gather · hunt · shape this chapter');toastMsg('Chapter '+String(state.chapter).padStart(2,'0')+' · '+MAPS[activeMapId].name)}
function applySettings(){const settings=state.settings,native=window.devicePixelRatio||1,r=canvas.getBoundingClientRect(),pixelBudget=Math.sqrt(3600000/Math.max(1,r.width*r.height)),qualityCap=settings.quality==='performance'?1:settings.quality==='high'?2:1.6;maxDpr=Math.max(.85,Math.min(native,qualityCap,pixelBudget));adaptiveDpr=settings.quality==='high'?maxDpr:Math.min(maxDpr,Math.max(.95,adaptiveDpr));renderer.setPixelRatio(adaptiveDpr);document.documentElement.classList.toggle('animations-off',settings.animations===false);document.documentElement.style.setProperty('--game-ui-scale',String(settings.uiScale||1));camera.fov=THREE.MathUtils.clamp(Number(settings.cameraFov)||55,42,68);camera.updateProjectionMatrix();effects.visible=settings.visualEffects!==false;lastWidth=0;resize();saveState()}function item(name,type,rarity,attrs,stats={}){state.meta.renown+=rarity==='Legendary'?4:rarity==='Epic'?3:2;state.meta.points+=1;const inferred={...stats};if(attrs.includes('Ward')&&!inferred.ward)inferred.ward=1;if(attrs.includes('Vitality')&&!inferred.vitality)inferred.vitality=1;if(attrs.includes('Focus')&&!inferred.focus)inferred.focus=1;state.inventory.push({name,type,rarity,attrs,stats:inferred});state.log.unshift('Collected '+name+'.');scheduleSave()}
function toastMsg(t){$('toast').textContent=t;$('toast').classList.add('show');toastTimer=3}
let gameAudio=null;
function playGameSound(kind='ui'){if(!state.settings.sound)return;const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)return;try{gameAudio??=new AudioCtor();if(gameAudio.state==='suspended')gameAudio.resume().catch(()=>{});const presets={ui:[360,.055,'sine'],attack:[145,.075,'triangle'],skill:[520,.13,'sawtooth'],collect:[740,.16,'sine'],hurt:[92,.18,'triangle'],success:[620,.22,'sine']},[frequency,duration,wave]=presets[kind]||presets.ui,osc=gameAudio.createOscillator(),gain=gameAudio.createGain(),now=gameAudio.currentTime,volume=Math.max(0,Math.min(1,Number(state.settings.volume)||0));if(!volume)return;osc.type=wave;osc.frequency.setValueAtTime(frequency,now);if(kind==='skill'||kind==='success')osc.frequency.exponentialRampToValueAtTime(frequency*1.5,now+duration);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume*.12,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain);gain.connect(gameAudio.destination);osc.start(now);osc.stop(now+duration+.015)}catch{}}
const RESOURCE_CACHE_PREFIX='ashen-resource-pack-';
let resourcePackLoading=false;
function resourceBytes(bytes){return bytes>=1048576?(bytes/1048576).toFixed(1)+' MB':Math.ceil(bytes/1024)+' KB'}
function packProgress(percent,label){const bar=$('resourcePackProgress'),status=$('resourcePackStatus');if(bar)bar.value=percent;if(status)status.textContent=label}
async function readResourceManifest(){const response=await fetch('./resource-pack.json',{cache:'no-store'});if(!response.ok)throw new Error('Resource pack manifest is unavailable.');return response.json()}
async function refreshResourcePackUi(){const status=$('resourcePackStatus'),download=$('downloadResourcePack'),remove=$('removeResourcePack');if(!status||!download||!remove)return;try{const manifest=await readResourceManifest(),cache=await caches.open(RESOURCE_CACHE_PREFIX+manifest.version),total=manifest.files.reduce((sum,file)=>sum+file.size,0),installed=await Promise.all(manifest.files.map(file=>cache.match(new URL(file.url,location.origin))));const complete=installed.every(Boolean);status.textContent=complete?'Installed · the production models are ready from local storage.':'Optional full pack · '+resourceBytes(total)+' downloaded once and reused from this browser.';download.disabled=complete||resourcePackLoading;download.textContent=complete?'FULL PACK INSTALLED':resourcePackLoading?'DOWNLOADING…':'DOWNLOAD FULL PACK';remove.disabled=!complete||resourcePackLoading;remove.hidden=!complete;if($('resourcePackProgress'))$('resourcePackProgress').value=complete?100:0}catch{status.textContent='Resource pack status is unavailable while offline.';download.disabled=true}}
async function installResourcePack(){if(resourcePackLoading)return;resourcePackLoading=true;const button=$('downloadResourcePack'),remove=$('removeResourcePack');if(button)button.disabled=true;if(remove)remove.disabled=true;try{const manifest=await readResourceManifest(),cache=await caches.open(RESOURCE_CACHE_PREFIX+manifest.version),total=manifest.files.reduce((sum,file)=>sum+file.size,0);let finished=0;for(let index=0;index<manifest.files.length;index++){const file=manifest.files[index],url=new URL(file.url,location.origin),cached=await cache.match(url);if(cached){finished+=file.size;packProgress(Math.round(finished/total*100),'Already saved · '+(index+1)+' / '+manifest.files.length);continue}packProgress(Math.round(finished/total*100),'Downloading model '+(index+1)+' / '+manifest.files.length+'…');const response=await fetch(url,{cache:'force-cache'});if(!response.ok)throw new Error('Could not download '+url.pathname);const bytes=await response.arrayBuffer();if(file.size&&bytes.byteLength!==file.size)throw new Error('The downloaded model was incomplete. Please retry.');await cache.put(url,new Response(bytes,{headers:response.headers}));finished+=bytes.byteLength;packProgress(Math.round(finished/total*100),'Saved '+(index+1)+' / '+manifest.files.length+' models')};try{await navigator.storage?.persist?.()}catch{};await loadFullResourceModels(manifest,cache);state.settings.resourcePackVersion=manifest.version;saveState();packProgress(100,'Full pack installed · future visits use the saved models.')}catch(error){packProgress(0,(error&&error.message)||'Download failed. You can retry when online.')}finally{resourcePackLoading=false;await refreshResourcePackUi()}}
async function removeResourcePack(){const manifest=await readResourceManifest();await caches.delete(RESOURCE_CACHE_PREFIX+manifest.version);state.settings.resourcePackVersion='';saveState();location.reload()}
function playPlayerAnimation(name,hold=0){const action=productionPlayerActions[name];if(!action||!productionPlayerMixer||state.settings.animations===false)return;if(activePlayerAction!==name){const previous=productionPlayerActions[activePlayerAction];if(previous)previous.fadeOut(.08);action.reset().fadeIn(.08).play();activePlayerAction=name}if(hold>0)playerActionUntil=performance.now()+hold}
function updatePlayerAnimation(dt,moving,sprinting){if(!productionPlayerMixer||state.settings.animations===false)return;if(performance.now()>=playerActionUntil)playPlayerAnimation(moving?(sprinting?'Run':'Walk'):'Idle');productionPlayerMixer.update(dt)}
async function loadFullResourceModels(manifest,cache){if(fullPackLoaderPromise)return fullPackLoaderPromise;fullPackLoaderPromise=(async()=>{try{const loaderModule=await import('https://esm.sh/three@0.186.1/examples/jsm/loaders/GLTFLoader.js'),loader=new loaderModule.GLTFLoader(),files=await Promise.all(manifest.files.map(async file=>{const response=await cache.match(new URL(file.url,location.origin));if(!response)throw new Error('Full pack is incomplete.');const buffer=await response.arrayBuffer();return new Promise((resolve,reject)=>loader.parse(buffer,'',resolve,reject))})),sentinel=files.find((_,i)=>manifest.files[i].url.includes('AshenSentinel')),regent=files.find((_,i)=>manifest.files[i].url.includes('AshenRegent'));if(!sentinel||!regent)throw new Error('The production models are missing from the pack.');productionPlayerScene=sentinel.scene;productionPlayerScene.name='production-player-model';productionPlayerScene.scale.setScalar(.98);player.add(productionPlayerScene);playerVisual.visible=false;productionPlayerMixer=new THREE.AnimationMixer(productionPlayerScene);productionPlayerActions=Object.fromEntries(sentinel.animations.map(clip=>[clip.name,productionPlayerMixer.clipAction(clip)]));activePlayerAction='';playPlayerAnimation('Idle');productionBossScene=regent.scene;productionBossAnimations=regent.animations;productionBossScene.name='production-boss-model';productionBossScene.scale.setScalar(.82);if(encounter?.isBoss)attachProductionBoss(encounter);return true}catch(error){fullPackLoaderPromise=null;throw error}})();return fullPackLoaderPromise}
function attachProductionBoss(enemy){if(!productionBossScene||!enemy?.isBoss)return;enemy.body.visible=false;enemy.root.add(productionBossScene);productionBossScene.position.set(0,0,0);const idleClip=productionBossAnimations.find(clip=>clip.name==='Idle');productionBossMixer=null;if(idleClip){productionBossMixer=new THREE.AnimationMixer(productionBossScene);productionBossMixer.clipAction(idleClip).play()}}
async function loadCachedResourcePack(){if(!('caches'in window))return;try{const manifest=await readResourceManifest(),cache=await caches.open(RESOURCE_CACHE_PREFIX+manifest.version);if((await Promise.all(manifest.files.map(file=>cache.match(new URL(file.url,location.origin))))).every(Boolean))await loadFullResourceModels(manifest,cache)}catch{}}
function showChapterTitle(title,subtitle){const el=$('message');el.querySelector('strong').textContent=title;el.querySelector('span').textContent=subtitle;el.classList.remove('dismissed');clearTimeout(el._dismissTimer);el._dismissTimer=setTimeout(()=>el.classList.add('dismissed'),4600)}
const SHOP_STOCK={merchant_01:[{name:'Hearthguard Coat',type:'Armor',rarity:'Rare',price:55,level:1,attrs:['+Vitality','+Ward'],stats:{vitality:2,ward:2},desc:'A reinforced coat for long roads.'},{name:'Ember Focus Ring',type:'Trinket',rarity:'Rare',price:70,level:2,attrs:['+Focus'],stats:{focus:2},desc:'Sharpens the ember pulse.'},{name:'Wayfarer Core',type:'Core',rarity:'Epic',price:110,level:3,attrs:['+Vitality','+Focus'],stats:{vitality:2,focus:2},desc:'A balanced core for explorers.'}],merchant_02:[{name:'Roadwarden Mantle',type:'Armor',rarity:'Epic',price:120,level:3,attrs:['+Ward','+Vitality'],stats:{ward:3,vitality:2},desc:'Built for guards beyond the old gate.'},{name:'Glassheart Relic',type:'Relic',rarity:'Epic',price:135,level:4,attrs:['+Focus','+Ward'],stats:{focus:2,ward:2},desc:'Stores a second pulse of ember light.'},{name:'Crownroad Sigil',type:'Relic',rarity:'Legendary',price:220,level:5,attrs:['+Vitality','+Focus','+Ward'],stats:{vitality:3,focus:3,ward:3},desc:'A rare mark from the old crownlands.'}]};
let shopMenu=null;
function ensureShopMenu(){if(shopMenu)return shopMenu;shopMenu=document.createElement('section');shopMenu.id='shopMenu';shopMenu.innerHTML='<div class="shop-panel"><button class="shop-close">×</button><div class="shop-kicker">SANCTUARY HAMLET · MERCHANT</div><h2 id="shopTitle">Merchant</h2><p>Trade Ashen for equipment that changes your build.</p><div class="shop-wallet">ASHEN <b id="shopCoins">0</b></div><div id="shopGrid" class="shop-grid"></div></div>';document.body.appendChild(shopMenu);const style=document.createElement('style');style.textContent='#shopMenu{position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;background:rgba(5,4,4,.78);backdrop-filter:blur(7px)}#shopMenu.show{display:flex}.shop-panel{position:relative;width:min(920px,92vw);max-height:82vh;overflow:auto;padding:30px;background:linear-gradient(145deg,#17120f,#0c0a09);border:1px solid #5b3c2d;box-shadow:0 25px 80px rgba(0,0,0,.55);color:#eadfd4}.shop-close{position:absolute;right:18px;top:14px;background:none;border:0;color:#b99a86;font-size:28px;cursor:pointer}.shop-kicker{font-size:10px;letter-spacing:3px;color:#a87555}.shop-panel h2{margin:8px 0 4px;font:32px Georgia,serif}.shop-panel p{margin:0 0 18px;color:#9c8c80}.shop-wallet{display:inline-block;padding:8px 12px;border:1px solid #3f3027;font-size:11px;letter-spacing:1px}.shop-wallet b{color:#e49a61}.shop-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:12px;margin-top:18px}.shop-card{padding:16px;border:1px solid #30241e;background:#100d0b}.shop-card h3{margin:0 0 5px;font:20px Georgia,serif}.shop-card small{display:block;color:#9c806d;margin-bottom:8px}.shop-card p{font-size:12px;line-height:1.5;min-height:38px}.shop-card .stats{color:#d9a77f;font-size:12px;margin-bottom:12px}.shop-buy{width:100%;padding:10px;border:1px solid #6b4732;background:#24160f;color:#eed7c4;cursor:pointer}.shop-buy:disabled{opacity:.38;cursor:not-allowed}';document.head.appendChild(style);shopMenu.querySelector('.shop-close').onclick=()=>shopMenu.classList.remove('show');return shopMenu}
function openShop(n){const menu=ensureShopMenu(),stock=SHOP_STOCK[n.id]||SHOP_STOCK.merchant_01;menu.querySelector('#shopTitle').textContent=n.name+' · '+n.role;menu.querySelector('#shopCoins').textContent=state.coins;const grid=menu.querySelector('#shopGrid');grid.innerHTML=stock.map((g,i)=>{const locked=state.level<g.level,poor=state.coins<g.price,statText=Object.entries(g.stats).map(([k,v])=>'+'+v+' '+k[0].toUpperCase()+k.slice(1)).join(' · ');return '<article class="shop-card"><h3>'+g.name+'</h3><small>'+g.rarity+' · '+g.type+' · Lv '+g.level+'</small><p>'+g.desc+'</p><div class="stats">'+statText+'</div><button class="shop-buy" data-buy="'+i+'" '+((locked||poor)?'disabled':'')+'>'+ (locked?'Requires Lv '+g.level:poor?'Need '+g.price+' Ashen':'Buy · '+g.price+' Ashen')+'</button></article>'}).join('');grid.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyShopItem(n.id,Number(b.dataset.buy)));menu.classList.add('show')}
function buyShopItem(merchantId,index){const stock=SHOP_STOCK[merchantId]||SHOP_STOCK.merchant_01,g=stock[index];if(!g||state.level<g.level||state.coins<g.price)return;state.coins-=g.price;state.meta.renown+=g.rarity==='Legendary'?5:g.rarity==='Epic'?3:2;state.inventory.push({name:g.name,type:g.type,rarity:g.rarity,attrs:[...g.attrs],stats:{...g.stats},source:'merchant',price:g.price});state.log.unshift('Purchased '+g.name+'.');saveState();openShop(npcs.find(x=>x.id===merchantId)||{id:merchantId,name:'Merchant',role:'merchant'});toastMsg(g.name+' added to your inventory')}
function setQuest(){
  const q=state.quest,title=$('questTitle'),desc=$('questDesc'),obj=$('objective'),count=$('questCount'),chapter=window.ASHEN_CAMPAIGN?.[state.chapter-1]||window.ASHEN_CAMPAIGN?.[0];
  $('chapterNumber').textContent='CHAPTER '+String(state.chapter).padStart(2,'0');$('chapterTitle').textContent=(chapter?.title||'THE LAST EMBER').toUpperCase();
  if(q===0){title.textContent=chapter?.title||'A Stranger at the Gate';desc.textContent=state.chapter===1?'Meet Lyra. The ember carries the last unburned name of a village erased by the Crown.':(chapter?.summary||'A new road opens from the Sanctuary.');obj.textContent='◈ Speak with Lyra';count.textContent='01'}
  else if(q===1){title.textContent=state.chapter===1?'Embers in the Grove':chapter.title;desc.textContent=state.chapter===1?'Find two living embers before the bell beneath Hollow can be heard.':chapter.activities[0]+'. Search the wilds and bring back two traces.';obj.textContent='◈ Gather chapter traces';count.textContent=state.chapterGathered+' / 2'}
  else if(q===2){title.textContent=state.chapter===1?'Orren’s Unfinished Map':chapter.title;desc.textContent=state.chapter===1?'Ask the gatekeeper why one road on his map has been cut away.':chapter.activities[1]+'. Orren has a lead for you.';obj.textContent='◈ Speak with Orren';count.textContent='02'}
  else if(q===3&&state.echoes<2){title.textContent=state.chapter===1?'The Bell Beneath Hollow':chapter.title;desc.textContent=state.chapter===1?'Recover the two memories the Crown tried to erase.':chapter.activities[2]+'. Recover two traces to draw out the chapter warden.';obj.textContent='◈ Recover memory traces';count.textContent=state.echoes+' / 2'}
  else if(q===3){title.textContent=state.chapter===1?'The Bell Beneath Hollow':chapter.title;desc.textContent=state.chapter===1?'The name inside the bell has a guardian. Silence the Bell Warden.':'The chapter warden is drawn to the traces. Read its tell, dodge its three skills, then strike.';obj.textContent='◈ Defeat the chapter warden';count.textContent=encounter?'WARDEN PRESENT':'WARDEN APPROACHING'}
  else if(q===4){title.textContent=state.chapter===1?'A Choice in the Ash':chapter.title;desc.textContent=state.chapter===1?'Return the stolen name to Lyra. Decide what the sanctuary is for.':chapter.summary+' Return to Lyra and make the chapter choice.';obj.textContent='◈ Return to Lyra';count.textContent='03'}
  else{title.textContent=chapter?.title||'The Hearthbound Vow';desc.textContent=state.chapter===10?'All ten roads lead home. Found your legacy at the Sanctuary.':state.chapter>1?'The choice in '+chapter.title+' is remembered. Return to the Sanctuary and prepare for the next expedition.':state.flags.sanctuaryOpen?'The lost village has a name again. Its people can begin to return.':'One name remains to guard the last refuge; the others are free.';obj.textContent=state.chapter===10?'◈ Return to Lyra · Found your home':'◈ Chapter '+String(state.chapter).padStart(2,'0')+' complete · Return to Sanctuary';count.textContent='COMPLETE'}
  $('regionLabel').textContent=region().toUpperCase();
}
function region(){
  if(activeMapId!=='sanctuary')return MAPS[activeMapId]?.name||'Sanctuary';
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
function findNearby(){let best=null,d=3;for(const n of npcs){if(!n.root.visible)continue;const x=n.root.position.distanceTo(player.position);if(x<d){d=x;best={k:'npc',n}}}for(const n of nodes)if(n.mapId===activeMapId&&!n.collected){const x=n.root.position.distanceTo(player.position);if(x<d){d=x;best={k:'node',n}}}if(activeMapId==='sanctuary')for(const g of gates){const x=g.root.position.distanceTo(player.position);if(x<d)best={k:'gate',n:g}}if(encounter){const x=encounter.root.position.distanceTo(player.position);if(x<d)best={k:'enemy',n:encounter}}return best}
function nearby(){return nearbyTarget}
function dialogue(n,text,opts){$('dialogue').classList.add('show');$('speakerName').textContent=n.name.toUpperCase();$('speakerRole').textContent=n.role.toUpperCase();$('dialogueText').textContent=text;const c=$('choices');c.innerHTML='';opts.forEach(o=>{const b=document.createElement('button');b.textContent=o.label;b.onclick=()=>{o.fn();$('dialogue').classList.remove('show')};c.appendChild(b)})}
function anyOverlayOpen(){return state.paused||['dialogue','tutorial','inventoryMenu','worldMap','metaMenu','systemMenu'].some(id=>$(id)?.classList.contains('show'))||shopMenu?.classList.contains('show')}
function interact(){
  if(anyOverlayOpen())return;
  const a=nearby();if(!a)return;
  playGameSound(a.k==='node'?'collect':'ui');
  if(a.k==='npc'){
    const n=a.n;
    if(n.role==='merchant'){openShop(n)}
    else if(n.id==='lyra'&&state.quest===0&&state.chapter>1){const ch=window.ASHEN_CAMPAIGN[state.chapter-1];dialogue(n,ch.summary+' The Sanctuary will keep your place while you investigate. What matters most on this road?',[
      {label:'Follow the people affected by this chapter',fn:()=>{state.rep.lyra++;state.quest=1;xp(30);item(ch.items[0],'Chapter Relic','Epic',['Chapter '+state.chapter,'Story']);state.log.unshift('Lyra asked you to listen before choosing a side in '+ch.title+'.');setQuest();saveState()}},
      {label:'Search for the hidden record first',fn:()=>{state.rep.seer++;state.flags.truth=true;state.quest=1;xp(35);item(ch.items[1]||ch.items[0],'Chapter Record','Rare',['Discovery','Story']);state.log.unshift('You chose investigation before allegiance in '+ch.title+'.');setQuest();saveState()}}
    ]);}
    else if(n.id==='lyra'&&state.quest===0)dialogue(n,'That flame is the last unburned name of a village the Crown erased. The gate can keep it buried, or you can learn whose name it is. Wake the bell, and its keeper will wake too.',[
      {label:'Seal it until the hamlet is safe',fn:()=>{state.rep.lyra++;state.flags.protectedSanctuary=true;state.quest=1;xp(25);item('Sanctuary Sigil','Relic','Rare',['Ward','Story Bound']);state.log.unshift('You promised to keep the sanctuary safe before seeking the truth.');toastMsg('Lyra trusts your promise');setQuest();saveState()}},
      {label:'Tell me whose name they erased',fn:()=>{state.rep.lyra+=2;state.flags.truth=true;state.quest=1;xp(30);item('Emberleaf Charm','Trinket','Epic',['Lore','Luck']);state.log.unshift('You chose the truth: the ember carries a village erased from the Crown’s record.');toastMsg('A name stirs inside the ember');setQuest();saveState()}}
    ]);
    else if(n.id==='orren'&&state.quest===2)dialogue(n,state.flags.truth?'The cut road leads to the bell chamber. The Crown erased its village, then built a gate over the names.':'I cut the road from my map because every traveler who follows it hears a bell that has no tower.',[
      {label:'Follow Orren’s marked path',fn:()=>{state.rep.orren+=2;state.quest=3;state.flags.gate=true;xp(35);state.log.unshift('Orren marked the safe path to Hollow.');toastMsg('The Ashen Gate opens');setQuest();saveState()}},
      {label:'Take the map and choose my own way',fn:()=>{state.rep.orren++;state.quest=3;state.flags.gate=true;item('Tideglass Compass','Relic','Rare',['Discovery']);state.log.unshift('You kept Orren’s map but chose your own route.');toastMsg('A hidden route is marked');setQuest();saveState()}}
    ]);
    else if(n.id==='lyra'&&state.quest===5&&state.chapter<10)dialogue(n,'Chapter '+String(state.chapter).padStart(2,'0')+' is carried home with you. The Sanctuary can grow stronger before the next road opens.',[{label:'Prepare and begin Chapter '+String(state.chapter+1).padStart(2,'0'),fn:advanceChapter},{label:'Stay at the Sanctuary for now',fn:()=>{openSystemMenu('base')}}]);
    else if(n.id==='lyra'&&state.quest===5&&state.chapter===10)dialogue(n,'Ten roads return to this hearth. The Sanctuary is no longer only a refuge; it is the home you built from every name and choice you carried back.',[{label:'Found the new home',fn:()=>{state.meta.chaptersComplete=10;if(!state.flags.legacyHome)state.meta.legacy++;state.flags.legacyHome=true;updateSanctuaryBuild();state.log.unshift('After ten chapters, you founded a lasting home at the Sanctuary.');saveState();toastMsg('The Sanctuary is your home · 10 chapters complete');openSystemMenu('base')}}]);
    else if(n.id==='lyra'&&state.quest===4&&state.chapter>1){const ch=window.ASHEN_CAMPAIGN[state.chapter-1],options=ch.choice.split(' / ');dialogue(n,ch.summary+' Both paths cost something. Which answer will you carry home?',[
      {label:options[0],fn:()=>{state.quest=5;state.flags['chapter'+state.chapter+'Choice']='first';state.rep.lyra++;xp(70);item(ch.items[ch.items.length-1],'Chapter Relic','Legendary',['Legacy','Chapter '+state.chapter]);state.log.unshift('You chose to '+options[0].toLowerCase()+'.');if(state.chapter<10){setActiveMap('sanctuary');player.position.set(-5,0,-1)}setQuest();saveState()}},
      {label:options[1]||'Choose another path',fn:()=>{state.quest=5;state.flags['chapter'+state.chapter+'Choice']='second';state.rep.seer++;xp(70);item(ch.items[ch.items.length-2]||ch.items[0],'Chapter Relic','Legendary',['Legacy','Chapter '+state.chapter]);state.log.unshift('You chose to '+(options[1]||'take another path').toLowerCase()+'.');if(state.chapter<10){setActiveMap('sanctuary');player.position.set(-5,0,-1)}setQuest();saveState()}}
    ]);}
    else if(n.id==='lyra'&&state.quest===4)dialogue(n,state.flags.truth?'The Warden kept one name alive inside the bell. Now the truth is yours. Will you return the names to the hamlet, or keep one to guard this refuge?':'The bell is silent, but the hamlet still does not know what was taken from it. What should the sanctuary protect now?',[
      {label:'Return the names to the living',fn:()=>{state.quest=5;state.flags.sanctuaryOpen=true;state.rep.lyra++;xp(70);item('Open Hand Seal','Quest Relic','Legendary',['Legacy','Community']);state.log.unshift('You returned the lost names to the hamlet and opened the sanctuary road.');if(state.chapter<10){setActiveMap('sanctuary');player.position.set(-5,0,-1)}toastMsg('The hamlet lights its first lantern');setQuest();saveState()}},
      {label:'Keep one name to guard the last refuge',fn:()=>{state.quest=5;state.flags.sanctuaryOpen=false;state.rep.lyra+=2;xp(70);item('Hearthbound Vow','Relic','Legendary',['Legacy','Ward']);state.log.unshift('You kept one name bound to the sanctuary as its final guardian.');if(state.chapter<10){setActiveMap('sanctuary');player.position.set(-5,0,-1)}toastMsg('One ember remains to guard the refuge');setQuest();saveState()}}
    ]);
    else toastMsg(n.name+': The road remembers every choice.');
  }else if(a.k==='node'){
    const n=a.n;n.collected=true;n.root.visible=false;state.collectedNodes.push(nodeKey(n));
    if(n.type==='ember'){state.shards++;state.chapterGathered++;xp(18);item(n.label,'Material',state.shards>=2?'Rare':'Uncommon',['Crafting','Ember']);toastMsg('Emberleaf collected · +1 forge shard');if(state.quest===1&&state.chapterGathered>=2)state.quest=2}
    else if(n.type==='echo'){state.echoes++;xp(22);item(n.label,'Quest Item','Epic',['Memory','Lore']);toastMsg('A name returns to the bell');if(state.quest===3&&state.echoes>=2){state.flags.bellAwakened=true;state.log.unshift('The second memory rang out. Something answered from beneath Hollow.');spawnEnemy()}}
    else{state.coins+=35;xp(30);item('Ancient Relic','Relic','Legendary',['Collection','Value']);toastMsg('Hidden relic discovered')}
    setQuest();saveState();
  }else if(a.k==='gate'){if(state.quest<a.n.unlock){toastMsg(a.n.name+' is sealed by the story.');return}toastMsg(a.n.name+' discovered — '+region())}
  else if(a.k==='enemy')pulse();
}
function pulse(){
  if(anyOverlayOpen()||!encounter||attackCooldown>0||state.stamina<15)return;
  const toEnemy=encounter.root.position.clone().sub(player.position);toEnemy.y=0;
  const distance=toEnemy.length();
  if(distance>4.6){toastMsg('Too far away — close the distance.');return}
  player.rotation.y=Math.PI+yaw;
  const facing=new THREE.Vector3(Math.sin(player.rotation.y),0,Math.cos(player.rotation.y));
  if(distance>1.35&&facing.dot(toEnemy.normalize())<.12){toastMsg('Turn toward the shade before striking.');return}
  attackCooldown=.48;state.stamina-=12;encounter.hp-=calcPlayerDamage(18);playGameSound('attack');playPlayerAnimation('Light1',420);
  if(state.settings.visualEffects!==false){const g=new THREE.Group();g.position.copy(player.position);for(let i=0;i<8;i++){const o=orb(.05,0xff8a4d,true),a=i*Math.PI/4;o.position.set(Math.cos(a),.8,Math.sin(a));g.add(o)}effects.add(g);setTimeout(()=>g.removeFromParent(),280)}
  if(encounter.hp<=0)finishEncounter();else{setEncounterHud(encounter);encounter.cooldown=Math.max(encounter.cooldown,.55)}
}
function move(dt){
  if(dodgeCooldown>0)dodgeCooldown-=dt;
  let x=(keys.KeyD?1:0)-(keys.KeyA?1:0),z=(keys.KeyS?1:0)-(keys.KeyW?1:0);
  const l=Math.hypot(x,z);
  if(state.settings.animations!==false){playerVisual.position.y=l ? .025+Math.abs(Math.sin(time*10))*.035 : Math.sin(time*1.8)*.012;playerVisual.rotation.z=l ? Math.sin(time*9)*.018 : 0}else{playerVisual.position.y=0;playerVisual.rotation.z=0}
  if(!l){updatePlayerAnimation(dt,false,false);state.stamina=Math.min(100,state.stamina+22*dt);return}
  x/=l;z/=l;
  const cs=Math.cos(yaw),sn=Math.sin(yaw),dx=x*cs+z*sn,dz=-x*sn+z*cs;
  const run=keys.ShiftLeft||keys.ShiftRight,speed=run?7.2:4.7;updatePlayerAnimation(dt,true,run);
  const next=resolveCollisions(
    THREE.MathUtils.clamp(player.position.x+dx*speed*dt,activeMapId==='sanctuary'?-106:-54,activeMapId==='sanctuary'?106:54),
    THREE.MathUtils.clamp(player.position.z+dz*speed*dt,activeMapId==='sanctuary'?-106:-54,activeMapId==='sanctuary'?106:54)
  );
  player.position.x=next.x;player.position.z=next.z;
  player.rotation.y=Math.atan2(dx,dz);
  state.stamina=Math.max(0,state.stamina+(run?-9:16)*dt);
}

function updateCamera(dt){const target=player.position.clone().add(new THREE.Vector3(0,1.15,0)),back=new THREE.Vector3(Math.sin(yaw),0,Math.cos(yaw));const pos=target.clone().addScaledVector(back,7.2).add(new THREE.Vector3(0,3.2+pitch*2,0)),damping=state.settings.reducedMotion ? .02 : .001;camera.position.lerp(pos,1-Math.pow(damping,dt));camera.lookAt(target)}
function tick(dt){
  time+=dt;
  if(Math.floor(time/12)!==Math.floor((time-dt)/12))saveState();
  move(dt);
  updateCamera(dt);
  if(state.settings.animations!==false)updateSky();
  nameplateAccumulator+=dt;if(nameplateAccumulator>=.08){nameplateAccumulator=0;updateNpcNameplates()}
  worldSimAccumulator+=dt;
  if(state.settings.animations!==false&&worldSimAccumulator>=.05){
    const simDt=Math.min(worldSimAccumulator,.10);
    worldSimAccumulator=0;
    if(activeMapId==='sanctuary')updateWildlife(simDt);
  }else if(state.settings.animations===false)worldSimAccumulator=0;

  if(state.settings.animations!==false){nodeSpinAccumulator+=dt;if(nodeSpinAccumulator>=.05){const spin=nodeSpinAccumulator;nodeSpinAccumulator=0;for(const n of nodes)if(n.mapId===activeMapId&&!n.collected)n.root.rotation.y+=spin}}else nodeSpinAccumulator=0;
  if(state.settings.animations!==false)for(const landmark of bellLandmarks){const awakened=!!state.flags.bellAwakened;landmark.clapper.rotation.z=awakened?Math.sin(time*3.4)*.12:Math.sin(time*.35)*.008;landmark.floorRune.material.opacity=awakened ? .34 : .12;landmark.glow.intensity=awakened?1.2+.45*Math.sin(time*5):.12}
  attackCooldown=Math.max(0,attackCooldown-dt);dodgeIFrames=Math.max(0,dodgeIFrames-dt);for(let i=0;i<3;i++)skillCooldowns[i]=Math.max(0,(skillCooldowns[i]||0)-dt);skillHudAccumulator+=dt;if(skillHudAccumulator>=.1){skillHudAccumulator=0;refreshSkillHud()}nearbyRefresh-=dt;if(nearbyRefresh<=0){nearbyTarget=findNearby();nearbyRefresh=.1}
  for(const e of enemies){
    if(!e||!e.root)continue;
    const dx=player.position.x-e.root.position.x,dz=player.position.z-e.root.position.z,distance=Math.hypot(dx,dz)||1;
    e.root.rotation.y=Math.atan2(dx,dz);
    if(state.settings.animations!==false)e.root.position.y=.15+Math.sin(time*2+(e.root.id||0))*.12;
    if(e.state==='windup'){
      e.windup-=dt;e.body.material.emissive.setHex(e.isBoss&&e.attackSkill===2?0xffbd52:e.isBoss&&e.attackSkill===3?0xd267fc:0xff321c);if(state.settings.animations!==false)e.root.scale.setScalar(1.08+.07*Math.sin(time*28));
      if(e.windup<=0){e.state='approach';e.cooldown=1.25+Math.random()*.45;e.root.scale.setScalar(1);e.body.material.emissive.setHex(0x684a79);const reach=e.isBoss?(e.attackSkill===2?4.4:e.attackSkill===3?3.6:2.75):2.75;if(distance<reach&&dodgeIFrames<=0){const mitigation=Math.min(.55,state.stats.ward*.055),moveScale=e.isBoss&&e.attackSkill===3?1.45:e.isBoss&&e.attackSkill===2?1.2:1;state.hp=Math.max(0,state.hp-e.attackDamage*moveScale*(1-mitigation));playGameSound('hurt');toastMsg(e.isBoss?'Warden skill '+e.attackSkill+' hit · dodge the next tell':'The shade struck you — dodge when its glow flares.')}}
    }else{e.cooldown-=dt;if(distance<2.15&&e.cooldown<=0){e.state='windup';e.windup=e.isBoss ? .82 : .68;if(e.isBoss){e.attackSkill=e.attackSkill%3+1;toastMsg('Warden telegraphs Skill '+e.attackSkill+' · dodge now')}e.body.material.emissive.setHex(e.isBoss&&e.attackSkill===2?0xffbd52:0xff321c)}else if(distance>1.65){const step=Math.min(distance-1.65,2.15*dt);const next=resolveCollisions(e.root.position.x+dx/distance*step,e.root.position.z+dz/distance*step);e.root.position.x=next.x;e.root.position.z=next.z}}
  }
  if(state.settings.animations!==false)productionBossMixer?.update(dt);
  encounterHudAccumulator+=dt;if(encounterHudAccumulator>=.12){encounterHudAccumulator=0;setEncounterHud(encounter)}

  // Warm lantern/fire flicker is kept subtle so the scene still reads naturally in daylight.
  if(Math.floor(time*30)%8===0)renderer.shadowMap.needsUpdate=true;
  const nightFactor=Math.max(0,(0.28-skyUniforms.uDay.value)/0.28);
  for(let i=0;i<lightSources.length;i++){
    const light=lightSources[i];
    if(!light)continue;
    light.visible=nightFactor>.12;
    const base=light.userData.baseIntensity||1;
    light.intensity=base*(.25+.75*nightFactor)*(state.settings.animations===false?1:(0.9+Math.sin(time*7+i)*.045));
  }

  if(state.hp<=0){
    state.hp=state.maxHp;state.stamina=100;player.position.set(0,0,activeMapId==='sanctuary'?7:14);dodgeIFrames=0;
    if(encounter){encounter.root.removeFromParent();encounter=null;enemies=[];setEncounterHud(null)}
    toastMsg('You fell in battle and woke at the sanctuary.');saveState();
  }

  $('playerHp').style.width=Math.max(0,Math.min(100,state.hp/state.maxHp*100))+'%';
  const xpNeed=100+state.level*55;$('playerXp').style.width=Math.min(100,state.xp/xpNeed*100)+'%';$('xpLabel').textContent=state.xp+' / '+xpNeed+' XP';$('huntLabel').textContent='HUNT · '+((state.hunt?.kills||0)%5)+' / 5';
  $('stamina').style.width=state.stamina+'%';
  $('level').textContent='LV '+state.level;
  $('coins').textContent=state.coins+' ASHEN';
  $('status').textContent=enemies.length?'ENCOUNTER':(keys.ShiftLeft||keys.ShiftRight?'SPRINTING':'EXPLORING');
  $('locationName').textContent=region().toUpperCase();
  $('locationHint').textContent=activeMapId!=='sanctuary'?MAPS[activeMapId].hint:
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
    a.k==='npc'?(a.n.role==='merchant'?'Shop':'Talk'):a.k==='node'?'Gather':a.k==='gate'?'Enter':'Pulse';

  const phase=((time+ATMOSPHERE_OFFSET)%DAY_LENGTH)/DAY_LENGTH;
  const period=phase<.26?'NIGHT':phase<.40?'MORNING':phase<.68?'NOON':phase<.84?'DUSK':'NIGHT';
  $('dayLabel').textContent='DAY '+state.day+' · '+period;
}
function renderJournal(tab='story'){if(tab==='story')$('journalBody').innerHTML=state.log.slice(0,12).map(x=>'<div class="journal-line">◈ '+x+'</div>').join('');if(tab==='people')$('journalBody').innerHTML=npcs.map(n=>'<div class="journal-line"><b>'+n.name+' · '+n.role+'</b>Reputation: '+state.rep[n.id]+'</div>').join('');if(tab==='world')$('journalBody').innerHTML=gates.map(g=>'<div class="journal-line"><b>'+g.name+'</b> '+(state.quest>=g.unlock?'Accessible':'Sealed by story')+'</div>').join('');if(tab==='campaign')$('journalBody').innerHTML='<div class="campaign-grid">'+(window.ASHEN_CAMPAIGN||[]).map(ch=>'<article class="chapter-card '+(ch.id===state.chapter?'active':'')+'"><div class="num">CHAPTER '+String(ch.id).padStart(2,'0')+' · '+ch.theme.toUpperCase()+'</div><h3>'+ch.title+'</h3><p>'+ch.summary+'</p><div class="chapter-meta"><span>'+ch.region+'</span><span>'+ch.activities.length+' activities</span><span>'+ch.items.length+' unique items</span></div><div class="story-items">'+ch.items.map(i=>'<span>'+i+'</span>').join('')+'</div></article>').join('')+'</div>'}
function archive(){const m=$('metaMenu');m.classList.add('show');const next=100+state.level*40,rank=state.meta.renown>=40?'CROWNBOUND':state.meta.renown>=20?'PATHFINDER':state.meta.renown>=8?'WAYFARER':'EMBERBOUND';$('metaContent').innerHTML='<div class="meta-dashboard"><div class="meta-hero"><span>LEGACY RANK</span><strong>'+rank+'</strong><small>Permanent progression · '+state.meta.legacy+' Legacy</small></div><div class="meta-stats"><div><b>'+state.meta.mastery+'</b><span>Mastery XP</span></div><div><b>'+state.meta.renown+'</b><span>Renown</span></div><div><b>'+state.meta.points+'</b><span>Growth Points</span></div><div><b>'+state.inventory.length+'</b><span>Discoveries</span></div></div><div class="meta-progress"><div><span>LEVEL '+state.level+'</span><b>'+state.xp+' / '+next+' XP</b></div><i style="width:'+Math.min(100,state.xp/next*100)+'%"></i></div><div class="meta-goals"><article><span>WEEKLY PATH</span><b>Discover 5 locations</b><small>'+Math.min(5,state.inventory.length)+' / 5 · Reward: +3 Renown</small></article><article><span>MASTER STUDY</span><b>Collect 3 story items</b><small>'+Math.min(3,state.inventory.length)+' / 3 · Reward: +2 Growth Points</small></article><article><span>LEGACY</span><b>Complete Chapter 01</b><small>'+(state.quest>=5?'Complete · Legacy unlocked':'In progress · finish the current story')+'</small></article></div><div class="meta-list"><div class="journal-line"><b>REPUTATION</b> Lyra '+state.rep.lyra+' · Orren '+state.rep.orren+' · Seer '+state.rep.seer+'</div><div class="journal-line"><b>EQUIPMENT</b> '+Object.values(state.equipment).filter(Boolean).length+' / 4 slots equipped · Ward '+state.stats.ward+' · Focus '+state.stats.focus+'</div><div class="journal-line"><b>WORLD</b> '+gates.filter(g=>state.quest>=g.unlock).length+' / '+gates.length+' routes available</div></div></div>'}
function loadState(){
  try{
    const raw=localStorage.getItem('ashen-crown-3d');
    if(raw){
      const saved=JSON.parse(raw);
      if(saved&&typeof saved==='object'&&!Array.isArray(saved)){legacyMapSave=saved.mapVersion!==1;
        const numeric=['xp','level','hp','stamina','coins','shards','echoes','quest','chapter','day','chapterGathered','weaponRank'];
        for(const key of numeric)if(Number.isFinite(Number(saved[key])))state[key]=Number(saved[key]);
        state.xp=Math.max(0,state.xp);state.level=Math.max(1,state.level);state.quest=THREE.MathUtils.clamp(state.quest,0,5);state.hp=Math.max(0,state.hp);state.stamina=THREE.MathUtils.clamp(state.stamina,0,100);state.coins=Math.max(0,state.coins);state.shards=Math.max(0,state.shards);state.echoes=Math.max(0,state.echoes);
        state.role=ROLE_DEFS[saved.role]?saved.role:'ashbreaker';state.appearance=['default','moon','moss'].includes(saved.appearance)?saved.appearance:'default';state.skillPoints=Math.max(0,Number(saved.skillPoints)||0);state.skillRanks=Array.isArray(saved.skillRanks)?saved.skillRanks.slice(0,3).map(v=>THREE.MathUtils.clamp(Math.floor(Number(v)||0),0,3)):[0,0,0];state.skillPoints=Math.max(state.skillPoints,Math.max(0,state.level-1-state.skillRanks.reduce((sum,v)=>sum+v,0)));state.settings=Object.assign(state.settings,saved.settings&&typeof saved.settings==='object'?saved.settings:{});if(!['auto','performance','high'].includes(state.settings.quality))state.settings.quality='auto';state.settings.sensitivity=THREE.MathUtils.clamp(Number(state.settings.sensitivity)||1,.5,2);state.settings.volume=THREE.MathUtils.clamp(Number(state.settings.volume??.35),0,1);state.settings.uiScale=THREE.MathUtils.clamp(Number(state.settings.uiScale)||1,.8,1.2);state.settings.cameraFov=THREE.MathUtils.clamp(Number(state.settings.cameraFov)||55,42,68);for(const key of ['sound','animations','visualEffects','reducedMotion'])if(typeof state.settings[key]!=='boolean')state.settings[key]=true;state.rep=Object.assign(state.rep,saved.rep&&typeof saved.rep==='object'?saved.rep:{});
        state.flags=Object.assign(state.flags,saved.flags&&typeof saved.flags==='object'?saved.flags:{});state.currentMap=MAPS[saved.currentMap]?saved.currentMap:'sanctuary';
        if(state.flags.bellWardenDefeated&&state.quest===3)state.quest=4;
        state.meta=Object.assign(state.meta,saved.meta&&typeof saved.meta==='object'?saved.meta:{});state.chapter=THREE.MathUtils.clamp(state.chapter,1,10);
        state.equipment=Object.assign(state.equipment,saved.equipment&&typeof saved.equipment==='object'?saved.equipment:{});
        state.inventory=Array.isArray(saved.inventory)?saved.inventory.filter(i=>i&&typeof i.name==='string').map(i=>({...i,attrs:Array.isArray(i.attrs)?i.attrs:[],stats:i.stats&&typeof i.stats==='object'?i.stats:{}})):[];
        state.collectedNodes=Array.isArray(saved.collectedNodes)?saved.collectedNodes.filter(x=>typeof x==='string'):[];
        state.hunt={kills:Math.max(0,Math.floor(Number(saved.hunt?.kills)||0))};if(!Number.isFinite(Number(saved.chapterGathered)))state.chapterGathered=state.quest===1?Math.min(2,state.shards):0;if(state.quest===1&&state.chapterGathered>=2)state.quest=2;state.weaponRank=THREE.MathUtils.clamp(Math.floor(state.weaponRank||0),0,12);state.chapterGathered=Math.max(0,Math.floor(state.chapterGathered||0));state.log=Array.isArray(saved.log)?saved.log.filter(x=>typeof x==='string').slice(0,80):state.log;
        state.tutorial=saved.tutorial===true;
        if(saved.playerPosition&&Number.isFinite(saved.playerPosition.x)&&Number.isFinite(saved.playerPosition.z)){player.position.x=THREE.MathUtils.clamp(saved.playerPosition.x,-106,106);player.position.z=THREE.MathUtils.clamp(saved.playerPosition.z,-106,106)}
      }
    }
  }catch{toastMsg('Save data could not be read; a fresh journey has started.')}
  recalculateEquipmentStats();state.hp=THREE.MathUtils.clamp(state.hp,0,state.maxHp);restoreCollectedNodes();updateSanctuaryBuild();applyRoleLook();applySettings();
}
function nodeKey(n){return n.type+':'+n.x+':'+n.z}
function restoreCollectedNodes(){const collected=new Set(Array.isArray(state.collectedNodes)?state.collectedNodes:[]);for(const n of nodes){n.collected=collected.has(nodeKey(n));n.root.visible=!n.collected}}
function saveState(){try{state.saveVersion=4;state.mapVersion=1;state.currentMap=activeMapId;state.playerPosition={x:player.position.x,z:player.position.z};localStorage.setItem('ashen-crown-3d',JSON.stringify(state));const status=$('saveStatus');if(status){status.textContent='SAVED LOCALLY';status.dataset.state='saved'}}catch{const status=$('saveStatus');if(status){status.textContent='SAVE UNAVAILABLE';status.dataset.state='error'}if(!saveWarningShown){saveWarningShown=true;toastMsg('Unable to save: browser storage is unavailable.')}}}
function scheduleSave(){clearTimeout(saveTimer);saveTimer=setTimeout(saveState,180)}
function refreshEquipment(){
  document.querySelectorAll('.equip-slot').forEach(button=>{
    const equipped=state.equipment[button.dataset.slot];
    const label=equipped?equipped.name:'Empty';
    button.innerHTML=button.dataset.slot.toUpperCase()+'<span>'+label+'</span>';
  });
}
function openInventory(){refreshEquipment();const grid=$('inventoryGrid');grid.innerHTML=state.inventory.length?state.inventory.slice().reverse().map((i,idx)=>{const stats=Object.entries(i.stats||{}).map(([k,v])=>'+'+v+' '+k[0].toUpperCase()+k.slice(1)).join(' · ');return '<div class="inventory-item"><b>'+i.name+'</b><small>'+i.type+' · '+i.rarity+'</small><em>'+i.attrs.join(' · ')+(stats?' · '+stats:'')+'</em><button data-item="'+(state.inventory.length-1-idx)+'">EQUIP</button></div>'}).join(''):'<div class="inventory-item"><b>Your pack is empty</b><small>Explore the world and discover story items.</small></div>';$('inventoryMenu').classList.add('show');grid.querySelectorAll('button[data-item]').forEach(b=>b.onclick=()=>equipItem(Number(b.dataset.item)))}
function equipItem(index){const i=state.inventory[index];if(!i)return;const slot=i.type==='Armor'?'armor':i.type==='Trinket'?'charm':i.type==='Relic'?'relic':'core';state.equipment[slot]=i;recalculateEquipmentStats();toastMsg(i.name+' equipped as '+slot);refreshEquipment();saveState()}
function renderWorldMap(){const el=$('mapWorld');el.innerHTML='';const points=[['Sanctuary · chapters 01 & 10',15,51,0,true,'sanctuary'],['Hollow Reach · chapters 02–03',37,27,2,state.meta.chaptersComplete>=2||state.chapter>=2,'hollow'],['Crownlands · chapters 04–05',60,42,4,state.meta.chaptersComplete>=4||state.chapter>=4,'crownlands'],['Choir of Ash · chapters 06–07',43,70,6,state.meta.chaptersComplete>=6||state.chapter>=6,'choir'],['Glass Expanse · chapters 08–09',80,65,8,state.meta.chaptersComplete>=8||state.chapter>=8,'glass']];points.forEach(p=>{const d=document.createElement('div');d.className='map-node '+(p[4]?'open':'')+(p[5]===activeMapId?' quest':'');d.style.left=p[1]+'%';d.style.top=p[2]+'%';d.innerHTML='<i></i><b>'+p[0]+'</b><small>'+(p[4]?'DISCOVERED':'LOCKED')+'</small>';el.appendChild(d)})}
function openMap(){renderWorldMap();$('worldMap').classList.add('show')}
let lastWidth=0,lastHeight=0;
function resize(){const r=canvas.getBoundingClientRect(),w=Math.max(1,Math.round(r.width)),h=Math.max(1,Math.round(r.height));if(w===lastWidth&&h===lastHeight)return;lastWidth=w;lastHeight=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
window.addEventListener('resize',resize);window.addEventListener('keydown',e=>{
  if(e.repeat&&['Space','KeyE','KeyF','KeyI','KeyJ','KeyK','KeyM','Escape','Digit1','Digit2','Digit3'].includes(e.code))return;
  if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space'].includes(e.code))e.preventDefault();
  if(e.code==='Escape'){
    if(shopMenu?.classList.contains('show'))shopMenu.classList.remove('show');
    else if($('systemMenu').classList.contains('show'))$('systemMenu').classList.remove('show');
    else if($('dialogue').classList.contains('show'))$('dialogue').classList.remove('show');
    else if($('inventoryMenu').classList.contains('show'))$('inventoryMenu').classList.remove('show');
    else if($('worldMap').classList.contains('show'))$('worldMap').classList.remove('show');
    else if($('metaMenu').classList.contains('show'))$('metaMenu').classList.remove('show');
    else if($('tutorial').classList.contains('show')){$('tutorial').classList.remove('show');state.tutorial=false;saveState()}
    else{$('pause').classList.toggle('show');state.paused=$('pause').classList.contains('show')}
    Object.keys(keys).forEach(k=>keys[k]=false);return;
  }
  if(anyOverlayOpen())return;
  keys[e.code]=true;
  if(e.code==='KeyE')interact();if(e.code==='KeyF')pulse();if(e.code==='Digit1')useSkill(0);if(e.code==='Digit2')useSkill(1);if(e.code==='Digit3')useSkill(2);if(e.code==='Space')dodge();if(e.code==='KeyC')openSystemMenu('role');if(e.code==='KeyO')openSystemMenu('settings');if(e.code==='KeyB')openSystemMenu('base');if(e.code==='KeyI')openInventory();if(e.code==='KeyM')openMap();if(e.code==='Slash'||e.code==='F1')$('tutorial').classList.add('show');if(e.code==='KeyJ'){$('journal').classList.toggle('show');renderJournal('story')}if(e.code==='KeyK')archive();
});window.addEventListener('keyup',e=>keys[e.code]=false);window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);drag=false;dragPointerId=null});
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0)pulse();drag=true;dragPointerId=e.pointerId;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==dragPointerId)return;yaw-=(e.clientX-lx)*.005*state.settings.sensitivity;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-ly)*.003*state.settings.sensitivity,-.1,.8);lx=e.clientX;ly=e.clientY});
const endCameraDrag=e=>{if(e.pointerId!==dragPointerId)return;drag=false;dragPointerId=null};canvas.addEventListener('pointerup',endCameraDrag);canvas.addEventListener('pointercancel',endCameraDrag);canvas.addEventListener('lostpointercapture',()=>{drag=false;dragPointerId=null});canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',e=>{camera.fov=THREE.MathUtils.clamp(camera.fov+e.deltaY*.025,42,68);camera.updateProjectionMatrix()},{passive:true});
document.querySelectorAll('.journal-tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.journal-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderJournal(b.dataset.tab)});
$('closeMeta').onclick=()=>$('metaMenu').classList.remove('show');$('closeInventory').onclick=()=>$('inventoryMenu').classList.remove('show');$('closeMap').onclick=()=>$('worldMap').classList.remove('show');$('tutorialStart').onclick=()=>{$('tutorial').classList.remove('show');state.tutorial=false;saveState()};$('helpButton').onclick=()=>$('tutorial').classList.add('show');$('closeDialogue').onclick=()=>$('dialogue').classList.remove('show');$('resume').onclick=()=>{$('pause').classList.remove('show');state.paused=false};
$('baseButton').onclick=()=>openSystemMenu('base');$('roleButton').onclick=()=>openSystemMenu('role');$('settingsButton').onclick=()=>openSystemMenu('settings');$('systemClose').onclick=()=>$('systemMenu').classList.remove('show');
$('systemContent').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='downloadResourcePack'){void installResourcePack();return}if(b.id==='removeResourcePack'){void removeResourcePack();return}if(b.dataset.travel){fastTravel(b.dataset.travel);return}if(b.dataset.role){state.role=b.dataset.role;applyRoleLook();saveState();openSystemMenu('role')}if(b.dataset.appearance){state.appearance=b.dataset.appearance;applyRoleLook();saveState();openSystemMenu('role')}if(b.dataset.upgrade!==undefined)upgradeSkill(Number(b.dataset.upgrade));if(b.dataset.forge!==undefined&&activeMapId==="sanctuary"&&state.shards>0&&(state.weaponRank||0)<12){const cost=90+(state.weaponRank||0)*75;if(state.coins>=cost){state.coins-=cost;state.shards--;state.weaponRank++;saveState();openSystemMenu("base");toastMsg("Weapon reinforced · +2% damage")}}if(b.dataset.claim!==undefined&&Math.floor((state.hunt?.kills||0)/5)>0){state.hunt.kills-=5;state.coins+=100+state.level*15;state.shards++;state.meta.contracts++;xp(65);saveState();openSystemMenu("base");toastMsg("Hunt contract claimed · coins, XP and a forge shard")};if(b.dataset.open)openSystemMenu(b.dataset.open);if(b.dataset.build&&activeMapId==="sanctuary"){const cost=80+state.meta.hubLevel*60;if(state.coins>=cost){state.coins-=cost;state.meta.hubLevel++;state.meta.points+=2;recalculateEquipmentStats();state.hp=state.maxHp;updateSanctuaryBuild();state.log.unshift('You strengthened the Sanctuary hearth to level '+(state.meta.hubLevel+1)+'.');saveState();openSystemMenu('base');toastMsg('Hearth upgraded · +2 growth points')}}if(b.dataset.expedition)advanceChapter()});
$('systemContent').addEventListener('input',e=>{if(e.target.id==='sensitivitySetting'){state.settings.sensitivity=Number(e.target.value);e.target.nextElementSibling.textContent=state.settings.sensitivity.toFixed(1)+'×';scheduleSave()}if(e.target.id==='volumeSetting'){state.settings.volume=Number(e.target.value);$('volumeValue').textContent=Math.round(state.settings.volume*100)+'%';scheduleSave()}if(e.target.id==='uiScaleSetting'){state.settings.uiScale=Number(e.target.value);$('uiScaleValue').textContent=Math.round(state.settings.uiScale*100)+'%';document.documentElement.style.setProperty('--game-ui-scale',String(state.settings.uiScale));scheduleSave()}if(e.target.id==='cameraFovSetting'){state.settings.cameraFov=Number(e.target.value);$('cameraFovValue').textContent=Math.round(state.settings.cameraFov)+'°';camera.fov=state.settings.cameraFov;camera.updateProjectionMatrix();scheduleSave()}});
$('systemContent').addEventListener('change',e=>{if(e.target.id==='qualitySetting'){state.settings.quality=e.target.value;applySettings()}if(e.target.id==='motionSetting'){state.settings.reducedMotion=e.target.checked;saveState()}if(e.target.id==='soundSetting'){state.settings.sound=e.target.checked;saveState();if(state.settings.sound)playGameSound('success')}if(e.target.id==='animationsSetting'){state.settings.animations=e.target.checked;applySettings()}if(e.target.id==='effectsSetting'){state.settings.visualEffects=e.target.checked;applySettings()}});
$('skillHotbar').addEventListener('click',e=>{const b=e.target.closest('[data-skill]');if(b)useSkill(Number(b.dataset.skill))});
window.addEventListener('beforeunload',saveState);
props.traverse(o=>{if(o.isMesh)o.castShadow=false;});
treeSpots.forEach(g=>g.traverse(o=>{if(o.isMesh)o.castShadow=true;}));
function setupTouchControls(){
  const controls=document.createElement('div');controls.className='touch-controls';controls.innerHTML='<div class="touch-stick" aria-label="Movement joystick"><i></i></div><div class="touch-actions"><button data-action="interact">USE</button><button data-action="attack">HIT</button><button data-action="dodge">ROLL</button><button data-action="inventory">BAG</button><button data-action="skill" data-skill="0">1</button><button data-action="skill" data-skill="1">2</button><button data-action="skill" data-skill="2">3</button></div>';document.querySelector('.stage').appendChild(controls);
  const stick=controls.querySelector('.touch-stick'),knob=stick.querySelector('i');let pointerId=null;
  const clearStick=()=>{pointerId=null;keys.KeyW=keys.KeyA=keys.KeyS=keys.KeyD=false;knob.style.transform='translate(0,0)'};
  stick.addEventListener('pointerdown',e=>{e.preventDefault();pointerId=e.pointerId;stick.setPointerCapture(pointerId);moveStick(e)});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===pointerId)moveStick(e)});
  stick.addEventListener('pointerup',e=>{if(e.pointerId===pointerId)clearStick()});stick.addEventListener('pointercancel',clearStick);
  function moveStick(e){const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.max(1,Math.hypot(dx,dy)),scale=Math.min(1,42/len),nx=dx*scale,ny=dy*scale;knob.style.transform='translate('+nx+'px,'+ny+'px)';keys.KeyD=nx>17;keys.KeyA=nx< -17;keys.KeyS=ny>17;keys.KeyW=ny< -17}
  controls.querySelectorAll('button[data-action]').forEach(button=>button.addEventListener('pointerdown',e=>{e.preventDefault();if(anyOverlayOpen())return;const action=button.dataset.action;if(action==='interact')interact();else if(action==='attack')pulse();else if(action==='dodge')dodge();else if(action==='inventory')openInventory();else if(action==='skill')useSkill(Number(button.dataset.skill))}));
}
loadState();const completedTravel=canFastTravel(),savedMap=completedTravel&&MAPS[state.currentMap]?state.currentMap:state.quest>=5&&state.chapter<10?'sanctuary':mapIdForChapter(state.chapter);setActiveMap(savedMap,!completedTravel);if(state.quest<5&&activeMapId!=='sanctuary'){npcs.forEach((n,i)=>{const p=[[0,12],[5,9],[-5,9]][i];n.root.position.set(p[0],0,p[1])})};if(state.quest>=5&&state.chapter<10)player.position.set(-5,0,-1);setupTouchControls();setQuest();renderJournal('story');refreshEquipment();resize();void loadCachedResourcePack();if('serviceWorker'in navigator)navigator.serviceWorker.register(new URL('./sw.js',location.href)).catch(()=>{});
if(state.tutorial!==false)$('tutorial').classList.add('show');
time=DAY_LENGTH*.30;
showChapterTitle((window.ASHEN_CAMPAIGN?.[state.chapter-1]?.title)||'THE LAST EMBER','Explore · meet people · make choices · shape the world');
if(activeMapId==='sanctuary')spawnWildlifeBurst(10);
updateSky();
const DEVELOPMENT_DAY=9;state.meta.developmentDay=Math.max(Number(state.meta.developmentDay||0),DEVELOPMENT_DAY);toastMsg('Development Day '+state.meta.developmentDay+' — the world wakes, villages stir, and the morning sun rises.');
setInterval(()=>{
  if(!anyOverlayOpen()&&!document.hidden&&Math.random()<.55&&!(state.quest===3&&state.echoes>=2&&!state.flags.bellWardenDefeated))spawnEnemy();
  if(activeMapId==='sanctuary'&&!anyOverlayOpen()&&!document.hidden&&wildlife.length<10)spawnWildlifeBurst(4);
},9000);
setInterval(()=>{if(!document.hidden)saveState()},15000);
window.addEventListener('pagehide',saveState);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveState()});
let last=performance.now();
function frame(t){
  const rawDt=Math.min(.05,(t-last)/1000);last=t;
  fpsAccumulator+=rawDt;fpsFrames++;
  if(fpsAccumulator>=1){
    const avgFrame=fpsAccumulator/Math.max(1,fpsFrames);
    const previousDpr=adaptiveDpr;
    if(state.settings.quality==='auto'&&avgFrame>.024)adaptiveDpr=Math.max(.85,adaptiveDpr-.05);
    else if((state.settings.quality==='auto'||state.settings.quality==='high')&&avgFrame<.017)adaptiveDpr=Math.min(maxDpr,adaptiveDpr+.04);
    if(Math.abs(adaptiveDpr-previousDpr)>.04){renderer.setPixelRatio(adaptiveDpr);lastWidth=0;resize()}
    fpsAccumulator=0;fpsFrames=0;
  }
  const dt=Math.min(.033,rawDt);
  if(!anyOverlayOpen()){tick(dt);renderer.render(scene,camera)}
  if(toastTimer>0&&(toastTimer-=dt)<=0)$('toast').classList.remove('show');
  if(!document.hidden)requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){Object.keys(keys).forEach(k=>keys[k]=false);saveState()}
  else{last=performance.now();requestAnimationFrame(frame)}
});
requestAnimationFrame(frame);
