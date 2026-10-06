#!/usr/bin/env python3
"""Deterministically generate the Ashen Crown rigged GLB characters and shared PBR maps.

Uses only Python, NumPy and Pillow. Geometry is authored procedurally so the source
asset remains reproducible and redistributable with the repository.
"""
from __future__ import annotations

import json
import math
import struct
import zlib
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MODEL_ROOT = ROOT / "Assets" / "Models"
TEXTURE_ROOT = MODEL_ROOT / "Textures"

MATERIALS = ["ObsidianSteel", "AshenCloth", "AntiqueBrass", "Emberglass", "EmberCore"]
MAT_INDEX = {name: i for i, name in enumerate(MATERIALS)}
JOINT_NAMES = [
    "Hips", "Spine", "Chest", "Neck", "Head",
    "LeftShoulder", "LeftUpperArm", "LeftLowerArm", "LeftHand",
    "RightShoulder", "RightUpperArm", "RightLowerArm", "RightHand",
    "LeftUpperLeg", "LeftLowerLeg", "LeftFoot",
    "RightUpperLeg", "RightLowerLeg", "RightFoot",
]
JOINT_INDEX = {name: i for i, name in enumerate(JOINT_NAMES)}


def make_textures() -> list[Path]:
    TEXTURE_ROOT.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(28051)
    size = 1024
    y, x = np.mgrid[0:size, 0:size].astype(np.float32)
    noise = rng.normal(0, 1, (size, size)).astype(np.float32)
    coarse = Image.fromarray(np.uint8(rng.integers(0, 256, (128, 128)))).resize((size, size), Image.Resampling.BICUBIC)
    coarse_np = np.asarray(coarse, dtype=np.float32) / 255.0 - 0.5
    grain = noise * 2.7 + coarse_np * 22 + 4 * np.sin(x * 0.04 + np.sin(y * 0.012))
    scratches = np.zeros((size, size), dtype=np.float32)
    for _ in range(260):
        sx = int(rng.integers(0, size)); sy = int(rng.integers(0, size))
        length = int(rng.integers(5, 48)); width = int(rng.integers(1, 3))
        ex = min(size - 1, sx + length)
        scratches[sy:min(size, sy + width), sx:ex] -= float(rng.uniform(12, 48))
    height = np.clip(176 + grain + scratches, 0, 255).astype(np.uint8)
    h = height.astype(np.float32) / 255.0
    dx = np.gradient(h, axis=1) * 7.0
    dy = np.gradient(h, axis=0) * 7.0
    normals = np.stack((-dx, -dy, np.ones_like(dx)), axis=2)
    normals /= np.maximum(np.linalg.norm(normals, axis=2, keepdims=True), 1e-6)
    normal_png = np.uint8(np.clip((normals * 0.5 + 0.5) * 255, 0, 255))
    base = np.stack((height, height, height), axis=2)
    mr = np.zeros((size, size, 3), dtype=np.uint8)
    mr[:, :, 0] = np.uint8(np.clip(218 + grain * 0.25, 0, 255))  # ambient occlusion
    mr[:, :, 1] = np.uint8(np.clip(164 + grain * 0.45, 0, 255))  # roughness
    mr[:, :, 2] = np.uint8(np.clip(205 + grain * 0.30, 0, 255))  # metallic
    emissive = np.zeros((size, size, 3), dtype=np.uint8)
    # Fine, branching ember fissures used by the emissive glass material.
    crack = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(crack)
    for _ in range(70):
        px = int(rng.integers(0, size)); py = int(rng.integers(0, size))
        points = [(px, py)]
        for _step in range(int(rng.integers(4, 12))):
            px += int(rng.integers(-12, 13)); py += int(rng.integers(5, 18))
            points.append((max(0, min(size, px)), max(0, min(size, py))))
        draw.line(points, fill=int(rng.integers(120, 256)), width=int(rng.integers(1, 3)))
    crack = crack.filter(ImageFilter.GaussianBlur(0.35))
    glow = np.asarray(crack, dtype=np.float32) / 255.0
    emissive[:, :, 0] = np.uint8(np.clip(glow * 255, 0, 255))
    emissive[:, :, 1] = np.uint8(np.clip(glow * 74, 0, 255))
    emissive[:, :, 2] = np.uint8(np.clip(glow * 9, 0, 255))
    outputs = [
        ("AshenShared_BaseColor.png", base),
        ("AshenShared_Normal.png", normal_png),
        ("AshenShared_MetallicRoughness.png", mr),
        ("AshenShared_Emissive.png", emissive),
    ]
    paths = []
    for name, pixels in outputs:
        path = TEXTURE_ROOT / name
        Image.fromarray(pixels, "RGB").save(path, format="PNG", optimize=True)
        paths.append(path)
    return paths


class Character:
    def __init__(self, name: str, boss: bool):
        self.name, self.boss = name, boss
        self.parts: dict[int, list[tuple[list, list, list, list, list]]] = {i: [] for i in range(len(MATERIALS))}
        self.scale = 1.12 if boss else 1.0
        self.shoulder = 1.0 if not boss else 1.18

    def add(self, material: str, joint: str, positions: list, normals: list, uv: list, indices: list):
        j = JOINT_INDEX[joint]
        self.parts[MAT_INDEX[material]].append((positions, normals, uv, indices, [j] * len(positions)))

    def ellipsoid(self, material: str, joint: str, center, radii, seg=20, rings=12):
        cx, cy, cz = (v * self.scale for v in center)
        rx, ry, rz = (v * self.scale for v in radii)
        p, n, uv, ix = [], [], [], []
        for lat in range(rings + 1):
            t = math.pi * lat / rings
            st, ct = math.sin(t), math.cos(t)
            for lon in range(seg + 1):
                a = 2 * math.pi * lon / seg
                nx, ny, nz = ct * math.cos(a), st, ct * math.sin(a)
                p.append([cx + rx * nx, cy + ry * ny, cz + rz * nz])
                normal = [nx / max(rx, 1e-6), ny / max(ry, 1e-6), nz / max(rz, 1e-6)]
                norm = math.sqrt(sum(q*q for q in normal))
                n.append([q / norm for q in normal]); uv.append([lon / seg, 1 - lat / rings])
        for lat in range(rings):
            for lon in range(seg):
                a = lat * (seg + 1) + lon; b = a + seg + 1
                ix.extend((a, b, a + 1, b, b + 1, a + 1))
        self.add(material, joint, p, n, uv, ix)

    def torso_profile(self, material: str, joint: str, profile, segments=20):
        """Build a tapered, faceted ribcage/waist shell from elliptical cross-sections."""
        p=[]; n=[]; uv=[]; ix=[]
        profile=[(y*self.scale,rx*self.scale,rz*self.scale) for y,rx,rz in profile]
        for row,(y,rx,rz) in enumerate(profile):
            prev=profile[max(0,row-1)]; nxt=profile[min(len(profile)-1,row+1)]
            dy=max(nxt[0]-prev[0],1e-6); drx=(nxt[1]-prev[1])/dy
            for col in range(segments+1):
                u=col/segments; a=u*math.tau; ca,sa=math.cos(a),math.sin(a)
                p.append([rx*ca,y,rz*sa]); nn=[ca,-drx,sa]; ll=math.sqrt(sum(v*v for v in nn)); n.append([v/ll for v in nn]); uv.append([u,row/(len(profile)-1)])
        for row in range(len(profile)-1):
            for col in range(segments):
                a=row*(segments+1)+col; b=a+segments+1; ix.extend((a,b,a+1,a+1,b,b+1))
        self.add(material,joint,p,n,uv,ix)

    def box(self, material: str, joint: str, center, size, bevel=False):
        cx, cy, cz = (v * self.scale for v in center); sx, sy, sz = (v * self.scale / 2 for v in size)
        corners = [(-sx,-sy,-sz),(sx,-sy,-sz),(sx,sy,-sz),(-sx,sy,-sz),(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)]
        faces = [((0,3,2,1),(0,0,-1)),((4,5,6,7),(0,0,1)),((0,4,7,3),(-1,0,0)),((1,2,6,5),(1,0,0)),((0,1,5,4),(0,-1,0)),((3,7,6,2),(0,1,0))]
        p=[]; n=[]; uv=[]; ix=[]
        for face, normal in faces:
            start = len(p)
            for k in face:
                px,py,pz=corners[k]; p.append([cx+px,cy+py,cz+pz]); n.append(list(normal)); uv.append([(px/sx+1)/2,(py/sy+1)/2])
            ix.extend((start,start+1,start+2,start,start+2,start+3))
        self.add(material,joint,p,n,uv,ix)

    def torus(self, material: str, joint: str, center, radius, tube, axis="y", seg=24, sides=8):
        cx,cy,cz=(v*self.scale for v in center); radius*=self.scale; tube*=self.scale
        p=[]; n=[]; uv=[]; ix=[]
        for i in range(seg+1):
            u=i/seg*math.tau
            for j in range(sides+1):
                v=j/sides*math.tau
                radial=radius+tube*math.cos(v); out=tube*math.sin(v)
                if axis=="y": px,pz=radial*math.cos(u),radial*math.sin(u); py=out; nn=[math.cos(v)*math.cos(u),math.sin(v),math.cos(v)*math.sin(u)]
                elif axis=="x": py,pz=radial*math.cos(u),radial*math.sin(u); px=out; nn=[math.sin(v),math.cos(v)*math.cos(u),math.cos(v)*math.sin(u)]
                else: px,py=radial*math.cos(u),radial*math.sin(u); pz=out; nn=[math.cos(v)*math.cos(u),math.cos(v)*math.sin(u),math.sin(v)]
                p.append([cx+px,cy+py,cz+pz]); n.append(nn); uv.append([i/seg,j/sides])
        for i in range(seg):
            for j in range(sides):
                a=i*(sides+1)+j; b=a+sides+1; ix.extend((a,a+1,b,a+1,b+1,b))
        self.add(material,joint,p,n,uv,ix)

    def cone(self, material: str, joint: str, base, height, radius, segments=8, direction=1):
        bx,by,bz=(v*self.scale for v in base); h=height*self.scale; r=radius*self.scale
        p=[]; n=[]; uv=[]; ix=[]
        for i in range(segments+1):
            a=math.tau*i/segments; x,z=math.cos(a),math.sin(a)
            p.extend(([bx+r*x,by,bz+r*z],[bx,by+direction*h,bz]));
            nn=[x, radius/max(height,0.01), z]; ll=math.sqrt(sum(q*q for q in nn)); nn=[q/ll for q in nn]
            n.extend((nn,nn)); uv.extend(([i/segments,0],[i/segments,1]))
        for i in range(segments):
            a=i*2; ix.extend((a,a+2,a+1,a+1,a+2,a+3))
        self.add(material,joint,p,n,uv,ix)

    def plate(self, material: str, joint: str, points, center_z, depth):
        """Extrude an authored XY silhouette into a beveled-looking, UV-mapped plate."""
        zf=(center_z+depth/2)*self.scale; zb=(center_z-depth/2)*self.scale
        xy=[(x*self.scale,y*self.scale) for x,y in points]
        xmin=min(x for x,_ in xy); xmax=max(x for x,_ in xy); ymin=min(y for _,y in xy); ymax=max(y for _,y in xy)
        p=[]; n=[]; uv=[]; ix=[]; count=len(xy)
        for z,nz in ((zf,1),(zb,-1)):
            start=len(p)
            for x,y in xy:
                p.append([x,y,z]); n.append([0,0,nz]); uv.append([(x-xmin)/max(xmax-xmin,1e-6),(y-ymin)/max(ymax-ymin,1e-6)])
            for i in range(1,count-1):
                if nz>0: ix.extend((start,start+i,start+i+1))
                else: ix.extend((start,start+i+1,start+i))
        for i in range(count):
            a=xy[i]; b=xy[(i+1)%count]; start=len(p)
            p.extend(([a[0],a[1],zf],[b[0],b[1],zf],[b[0],b[1],zb],[a[0],a[1],zb]))
            ex=b[0]-a[0]; ey=b[1]-a[1]; ll=math.sqrt(ex*ex+ey*ey) or 1
            normal=[ey/ll,-ex/ll,0]
            n.extend((normal,normal,normal,normal)); uv.extend(([0,0],[1,0],[1,1],[0,1]))
            ix.extend((start,start+1,start+2,start,start+2,start+3))
        self.add(material,joint,p,n,uv,ix)

    def cape(self):
        cols, rows = 8, 10; p=[]; n=[]; uv=[]; ix=[]
        width=0.40*(1.22 if self.boss else 1.0)
        length=1.24 if self.boss else 0.88
        for r in range(rows+1):
            v=r/rows; y=(1.72-v*length)*self.scale
            w=width*(0.72+0.28*v)
            for c in range(cols+1):
                u=c/cols; x=(u*2-1)*w
                z=(-0.28-0.08*math.sin(v*math.pi)+0.025*abs(u-.5))*self.scale
                p.append([x,y,z]); n.append([0,0,1]); uv.append([u,v])
        for r in range(rows):
            for c in range(cols):
                a=r*(cols+1)+c; b=a+cols+1; ix.extend((a,b,a+1,a+1,b,b+1))
        self.add("AshenCloth","Chest",p,n,uv,ix)

    def build(self):
        s=self.shoulder
        # Silhouette: layered gambeson, articulated plate, greaves and over-shoulder mantle.
        self.ellipsoid("AshenCloth","Hips",(0,1.03,0),(.29,.22,.22),24,14)
        self.torso_profile("ObsidianSteel","Spine",[(.98,.24,.17),(1.08,.29,.21),(1.22,.25,.18),(1.36,.29,.20),(1.51,.37,.24),(1.64,.36,.23),(1.75,.29,.19),(1.83,.18,.14)])
        self.ellipsoid("ObsidianSteel","Head",(0,1.99,.015),(.19,.245,.18),24,16)
        self.ellipsoid("ObsidianSteel","Neck",(0,1.78,0),(.13,.17,.13),16,10)
        self.plate("ObsidianSteel","Head",[(-.15,2.065),(-.13,1.97),(-.085,1.89),(0,1.855),(.085,1.89),(.13,1.97),(.15,2.065)],.215,.025)
        for side in (-1,1):
            self.ellipsoid("EmberCore","Head",(side*.055,2.015,.245),(.042,.016,.018),12,8)
        # Breastplate and inset ember heart.
        self.plate("ObsidianSteel","Chest",[(-.27,1.54),(-.20,1.72),(0,1.80),(.20,1.72),(.27,1.54),(.17,1.38),(0,1.31),(-.17,1.38)],.247,.035)
        self.plate("AntiqueBrass","Chest",[(-.17,1.55),(-.12,1.66),(0,1.71),(.12,1.66),(.17,1.55),(0,1.40)],.275,.012)
        self.ellipsoid("Emberglass","Chest",(0,1.54,.307),(.055,.083,.027),18,12)
        for side in (-1,1):
            self.ellipsoid("Emberglass","Head",(side*.065,2.01,.23),(.043,.019,.018),12,8)
        self.ellipsoid("ObsidianSteel","Head",(0,1.87,.14),(.13,.095,.08),16,10)
        self.torus("AntiqueBrass","Hips",(0,1.10,0),.27,.025)
        self.torus("AntiqueBrass","Neck",(0,1.80,0),.13,.018)
        for center_x,width in ((-.18,.19),(0,.21),(.18,.19)):
            self.plate("AshenCloth","Hips",[(center_x-width/2,1.02),(center_x+width/2,1.02),(center_x+width*.40,.80),(center_x,.68),(center_x-width*.40,.80)],.255,.05)
            self.plate("AntiqueBrass","Hips",[(center_x-.012,.96),(center_x+.012,.96),(center_x+.008,.77),(center_x,.72),(center_x-.008,.77)],.286,.012)
        # Shoulder pauldrons, articulated arms and riveted cuffs.
        for side, label in [(-1,"Left"),(1,"Right")]:
            shoulder_joint=label+"Shoulder"; upper=label+"UpperArm"; lower=label+"LowerArm"; hand=label+"Hand"
            x=side*.36*s
            self.ellipsoid("ObsidianSteel",shoulder_joint,(x,1.76,0),(.22*s,.16,.25),20,12)
            self.ellipsoid("AntiqueBrass",shoulder_joint,(x,1.80,.18),(.17*s,.075,.035),18,10)
            self.ellipsoid("ObsidianSteel",upper,(side*.51,1.48,0),(.155,.30,.16),18,12)
            self.ellipsoid("ObsidianSteel",lower,(side*.70,1.20,.015),(.145,.27,.15),18,12)
            self.ellipsoid("AntiqueBrass",lower,(side*.70,1.22,.135),(.135,.16,.035),16,10)
            self.torus("AntiqueBrass",lower,(side*.70,1.01,0),.13,.018,axis="x")
            self.ellipsoid("ObsidianSteel",hand,(side*.79,.99,.015),(.13,.14,.13),16,10)
            self.ellipsoid("AshenCloth",upper,(side*.50,1.48,-.01),(.11,.24,.12),16,10)
        # Skirt panels and legs.
        for side, label in [(-1,"Left"),(1,"Right")]:
            upper=label+"UpperLeg"; lower=label+"LowerLeg"; foot=label+"Foot"; x=side*.16
            self.ellipsoid("AshenCloth",upper,(x,.84,-.015),(.17,.30,.18),18,12)
            self.ellipsoid("ObsidianSteel",upper,(x,.88,.13),(.16,.20,.055),16,10)
            self.ellipsoid("AntiqueBrass",upper,(x,.83,.185),(.11,.12,.025),14,8)
            self.ellipsoid("ObsidianSteel",lower,(x,.47,0),(.14,.27,.145),18,12)
            self.ellipsoid("AntiqueBrass",lower,(x,.55,.12),(.145,.115,.045),16,10)
            self.ellipsoid("ObsidianSteel",lower,(x,.34,.115),(.12,.16,.045),14,8)
            self.ellipsoid("ObsidianSteel",foot,(x,.15,.075),(.17,.16,.26),18,10)
            self.box("AntiqueBrass",foot,(x,.055,.12),(.34,.06,.48))
        # Crown silhouette, boss antlers or knight's broken diadem.
        self.torus("AntiqueBrass","Head",(0,2.16,0),.17,.025)
        points=7 if self.boss else 5
        for i in range(points):
            a=math.tau*i/points+math.pi/2
            bx=.17*math.cos(a); bz=.17*math.sin(a)
            ht=(.35 if i%2==0 else .24)*(1.25 if self.boss else .82)
            self.cone("AntiqueBrass","Head",(bx,2.16,bz),ht,.045,7)
            self.cone("Emberglass","Head",(bx,2.16+ht*.55,bz),ht*.48,.018,6)
        # Forehead crest and carved armor inlays.
        self.box("AntiqueBrass","Head",(0,2.13,.255),(.075,.04,.025))
        for side in (-1,1):
            self.cone("Emberglass","Chest",(side*.10,1.75,.19),.25,.035,7)
        if self.boss:
            self.cape()
        # A long, beveled greatsword rides on the right hand and follows its rig.
        self.box("AshenCloth","RightHand",(.91,1.17,.045),(.055,.22,.055))
        self.box("AntiqueBrass","RightHand",(.91,1.045,.045),(.24,.055,.10))
        self.plate("ObsidianSteel","RightHand",[(.84,.99),(.85,.72),(.88,.46),(.91,.31),(.94,.46),(.97,.72),(.98,.99)],.055,.045)
        self.plate("AntiqueBrass","RightHand",[(.89,.96),(.90,.62),(.91,.40),(.92,.62),(.93,.96)],.082,.014)
        self.plate("Emberglass","RightHand",[(.902,.94),(.907,.60),(.91,.46),(.914,.60),(.918,.94)],.092,.012)
        # Distinctive boss mantle and ash-flame shoulder crests.
        if self.boss:
            for side in (-1,1):
                self.cone("Emberglass","Chest",(side*.47,1.82,-.01),.44,.12,9)
                self.ellipsoid("AntiqueBrass","Chest",(side*.38,1.73,-.11),(.12,.16,.12),16,10)


def pack_glb(character: Character, texture_paths: list[Path], target: Path):
    binary=bytearray(); views=[]; accessors=[]
    def align():
        while len(binary)%4: binary.append(0)
    def view(blob: bytes, target_hint=None):
        align(); start=len(binary); binary.extend(blob); row={"buffer":0,"byteOffset":start,"byteLength":len(blob)}
        if target_hint: row["target"]=target_hint
        views.append(row); return len(views)-1
    def accessor(blob: bytes, component, count, typ, target_hint=None, minimum=None, maximum=None):
        vi=view(blob,target_hint); item={"bufferView":vi,"componentType":component,"count":count,"type":typ}
        if minimum is not None: item["min"]=minimum
        if maximum is not None: item["max"]=maximum
        accessors.append(item); return len(accessors)-1
    def floats(values, typ):
        flat=[q for row in values for q in row] if isinstance(values[0],(list,tuple)) else values
        code={"SCALAR":"f","VEC2":"f","VEC3":"f","VEC4":"f"}[typ]
        return struct.pack("<"+code*len(flat),*flat)
    # Rigid armor pieces are parented directly to humanoid joints. This keeps the
    # segmented plate silhouette crisp while allowing the animation clips to move it.
    positions={"Hips":(0,1.0,0),"Spine":(0,1.30,0),"Chest":(0,1.58,0),"Neck":(0,1.83,0),"Head":(0,2.0,0),
      "LeftShoulder":(-.25,1.75,0),"LeftUpperArm":(-.43,1.74,0),"LeftLowerArm":(-.69,1.44,0),"LeftHand":(-.79,1.17,0),
      "RightShoulder":(.25,1.75,0),"RightUpperArm":(.43,1.74,0),"RightLowerArm":(.69,1.44,0),"RightHand":(.79,1.17,0),
      "LeftUpperLeg":(-.16,.96,0),"LeftLowerLeg":(-.16,.55,0),"LeftFoot":(-.16,.15,0),
      "RightUpperLeg":(.16,.96,0),"RightLowerLeg":(.16,.55,0),"RightFoot":(.16,.15,0)}
    parents={"Spine":"Hips","Chest":"Spine","Neck":"Chest","Head":"Neck",
      "LeftShoulder":"Chest","LeftUpperArm":"LeftShoulder","LeftLowerArm":"LeftUpperArm","LeftHand":"LeftLowerArm",
      "RightShoulder":"Chest","RightUpperArm":"RightShoulder","RightLowerArm":"RightUpperArm","RightHand":"RightLowerArm",
      "LeftUpperLeg":"Hips","LeftLowerLeg":"LeftUpperLeg","LeftFoot":"LeftLowerLeg",
      "RightUpperLeg":"Hips","RightLowerLeg":"RightUpperLeg","RightFoot":"RightLowerLeg"}
    node_index={name:i+1 for i,name in enumerate(JOINT_NAMES)}
    meshes=[]; render_nodes=[]
    for mi,chunks in character.parts.items():
        by_joint={}
        for chunk in chunks: by_joint.setdefault(chunk[4][0],[]).append(chunk)
        for joint_id, joint_chunks in by_joint.items():
            bone=JOINT_NAMES[joint_id]; origin=[v*character.scale for v in positions[bone]]
            pos=[]; norms=[]; uvs=[]; indices=[]
            for p,n,uv,ix,_boneids in joint_chunks:
                offset=len(pos); pos.extend([[v[k]-origin[k] for k in range(3)] for v in p]); norms.extend(n); uvs.extend(uv)
                indices.extend([v+offset for v in ix])
            pa=np.asarray(pos,dtype=np.float32); mins=pa.min(axis=0).tolist(); maxs=pa.max(axis=0).tolist()
            attrs={"POSITION":accessor(floats(pos,"VEC3"),5126,len(pos),"VEC3",34962,mins,maxs),
                   "NORMAL":accessor(floats(norms,"VEC3"),5126,len(norms),"VEC3",34962),
                   "TEXCOORD_0":accessor(floats(uvs,"VEC2"),5126,len(uvs),"VEC2",34962)}
            idxacc=accessor(struct.pack("<"+"I"*len(indices),*indices),5125,len(indices),"SCALAR",34963,[min(indices)],[max(indices)])
            mesh_id=len(meshes); meshes.append({"name":character.name+"_"+bone+"_"+MATERIALS[mi],"primitives":[{"attributes":attrs,"indices":idxacc,"material":mi,"mode":4}]})
            render_nodes.append((bone,mesh_id))
    # Embedded texture payloads keep each character a portable, self-contained GLB.
    images=[]
    for path in texture_paths:
        vi=view(path.read_bytes()); images.append({"bufferView":vi,"mimeType":"image/png","name":path.stem})
    texture_rows=[{"sampler":0,"source":i} for i in range(len(images))]
    pbr_base={"index":0}; pbr_normal={"index":1}; pbr_mr={"index":2}; pbr_em={"index":3}
    materials=[]
    factors=[([.58,.64,.72,1],.82,.34,[0,0,0]),([.48,.075,.09,1],.03,.82,[0,0,0]),([.80,.58,.25,1],.70,.31,[0,0,0]),([1,.34,.045,1],.32,.24,[1.0,.20,.025]),([1,.36,.04,1],.08,.28,[2.0,.34,.025])]
    for i,(color,metal,rough,emissive) in enumerate(factors):
        mat={"name":MATERIALS[i],"pbrMetallicRoughness":{"baseColorFactor":color,"baseColorTexture":pbr_base,
                "metallicFactor":metal,"roughnessFactor":rough,"metallicRoughnessTexture":pbr_mr},
             "normalTexture":{"index":1,"scale":.7},"occlusionTexture":{"index":2,"strength":.72},
             "doubleSided": i==1}
        if i==3: mat["emissiveFactor"]=emissive; mat["emissiveTexture"]={"index":3}
        if i==4: mat["emissiveFactor"]=emissive
        materials.append(mat)
    child_map={n:[] for n in ["ROOT"]+JOINT_NAMES}
    for name,parent in parents.items(): child_map[parent].append(node_index[name])
    first_render_node=len(JOINT_NAMES)+1
    for i,(bone,_mesh_id) in enumerate(render_nodes): child_map[bone].append(first_render_node+i)
    nodes=[{"name":character.name,"children":[node_index["Hips"]]}]
    joint_scale=character.scale
    for name in JOINT_NAMES:
        absolute=positions[name]
        parent=parents.get(name)
        local=absolute if not parent else tuple(absolute[k]-positions[parent][k] for k in range(3))
        local=tuple(v*joint_scale for v in local)
        entry={"name":name,"translation":list(local)}
        children=child_map[name]
        if children: entry["children"]=children
        nodes.append(entry)
    for bone,mesh_id in render_nodes:
        nodes.append({"name":character.name+"_"+bone+"_Visual","mesh":mesh_id})
    # Reproducible skeletal motion clips. Gameplay can bind these names to Animator states.
    animations=[]
    def quat(axis, degrees):
        a=math.radians(degrees)/2; s=math.sin(a); x,y,z=axis
        return [x*s,y*s,z*s,math.cos(a)]
    def add_clip(name, duration, tracks):
        times=[0.0,duration*.25,duration*.5,duration*.75,duration]
        time_acc=accessor(floats(times,"SCALAR"),5126,len(times),"SCALAR",34962,[0],[duration])
        samplers=[]; channels=[]
        for bone, axis, angles in tracks:
            out=[quat(axis,a) for a in angles]
            out_acc=accessor(floats(out,"VEC4"),5126,len(out),"VEC4",34962)
            samplers.append({"input":time_acc,"output":out_acc,"interpolation":"LINEAR"})
            channels.append({"sampler":len(samplers)-1,"target":{"node":node_index[bone],"path":"rotation"}})
        animations.append({"name":name,"samplers":samplers,"channels":channels})
    add_clip("Idle",2.2,[("Spine",(0,0,1),[0,1.2,0,-1.2,0]),("Head",(0,1,0),[-1,2,0,-2,-1]),("LeftUpperArm",(1,0,0),[0,1,0,-1,0])])
    add_clip("Walk",1.0,[("LeftUpperArm",(1,0,0),[24,-24,24,-24,24]),("RightUpperArm",(1,0,0),[-24,24,-24,24,-24]),("LeftUpperLeg",(1,0,0),[-27,27,-27,27,-27]),("RightUpperLeg",(1,0,0),[27,-27,27,-27,27]),("Chest",(1,0,0),[0,2,0,-2,0])])
    add_clip("Run",.66,[("LeftUpperArm",(1,0,0),[42,-42,42,-42,42]),("RightUpperArm",(1,0,0),[-42,42,-42,42,-42]),("LeftUpperLeg",(1,0,0),[-42,42,-42,42,-42]),("RightUpperLeg",(1,0,0),[42,-42,42,-42,42]),("Chest",(1,0,0),[-8,-4,-8,-4,-8])])
    add_clip("Light1",.72,[("RightUpperArm",(0,0,1),[0,-38,-92,-30,0]),("RightLowerArm",(0,0,1),[0,32,72,20,0]),("Chest",(0,1,0),[0,12,42,8,0])])
    add_clip("Heavy",1.15,[("RightUpperArm",(0,0,1),[0,40,-125,-70,0]),("RightLowerArm",(0,0,1),[0,-35,48,28,0]),("Chest",(0,1,0),[0,-14,50,18,0]),("LeftUpperArm",(0,0,1),[0,14,30,6,0])])
    add_clip("Enrage",1.4,[("Chest",(1,0,0),[0,-18,4,-10,0]),("LeftUpperArm",(0,0,1),[0,-55,-85,-26,0]),("RightUpperArm",(0,0,1),[0,55,85,26,0]),("Head",(1,0,0),[0,-16,-28,-10,0])])
    doc={"asset":{"version":"2.0","generator":"Ashen Crown procedural production art pipeline"},
      "scene":0,"scenes":[{"nodes":[0]}],"nodes":nodes,"meshes":meshes,
      "animations":animations,"materials":materials,
      "textures":texture_rows,"images":images,"samplers":[{"magFilter":9729,"minFilter":9987,"wrapS":10497,"wrapT":10497}],
      "accessors":accessors,"bufferViews":views,"buffers":[{"byteLength":len(binary)}]}
    json_bytes=json.dumps(doc,separators=(",",":"),ensure_ascii=False).encode("utf-8")
    while len(json_bytes)%4: json_bytes+=b" "
    align(); total=12+8+len(json_bytes)+8+len(binary)
    glb=struct.pack("<4sII",b"glTF",2,total)+struct.pack("<II",len(json_bytes),0x4E4F534A)+json_bytes+struct.pack("<II",len(binary),0x004E4942)+binary
    target.parent.mkdir(parents=True,exist_ok=True); target.write_bytes(glb)


if __name__=="__main__":
    # Each GLB embeds the same shared source textures for independent import.
    maps=make_textures()
    for name,boss in (("AshenSentinel",False),("AshenRegent",True)):
        actor=Character(name,boss); actor.build()
        pack_glb(actor,maps,MODEL_ROOT/("Bosses" if boss else "Characters")/(name+".glb"))
