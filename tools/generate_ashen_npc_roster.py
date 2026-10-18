#!/usr/bin/env python3
"""Build a single compact GLB containing 56 distinct, PBR-textured NPC models."""
from __future__ import annotations
import json, math, struct
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MODEL_ROOT=ROOT/"Assets"/"Models"
TEXTURE_ROOT=MODEL_ROOT/"Textures"
OUTPUT=MODEL_ROOT/"NPC"/"AshenNPCRoster.glb"
TEXTURES=("AshenShared_BaseColor.png","AshenShared_Normal.png","AshenShared_MetallicRoughness.png","AshenShared_Emissive.png")

# id, archetype, cloth, armor, trim, skin, hair, glow, headwear, weapon, scale
ROSTER=[
("kael-varric","heavy",0x191e28,0x343944,0xb9a17d,0xc5b1a0,0xc7c6c4,0xf07838,"broken-crown","greatsword",1.05),
("seraphine","robe",0xeee2cd,0xd0c7b8,0xb99a65,0xe0c6b0,0xe6dfd7,0x8acde0,"halo","staff",.98),
("darius","reaper",0x301b22,0x1f2228,0x9e3037,0xb99283,0x1c1c24,0xd33c3c,"hood","scythe",1.03),
("lyria-archer","light",0x182d43,0x2e4866,0xb5cfe8,0xe2c4b3,0x91b9df,0x8fd3ec,"none","bow",.96),
("borin","heavy",0x292b2e,0x4a4b4a,0xbca47c,0xb9957b,0x49372c,0xf2a451,"helmet","shield",1.12),
("elara","assassin",0x271938,0x322342,0x8157b2,0xd7b4ad,0x4a2e61,0xa86dff,"mask","dual",.94),
("thorne","heavy",0x182730,0x273b48,0x658b96,0xc4b9b4,0xaeb4ba,0x41b4d1,"hood","greatsword",1.06),
("sister-maris","nun",0x17191d,0x202125,0xd3bd8a,0xe0c9ad,0xf0e8d9,0xd9c79a,"veil","scepter",.98),
("riven","hunter",0x493a2d,0x5b594b,0x8f7659,0xc7a58a,0xb6a68f,0x93b987,"antler","spear",1.04),
("nyx","witch",0x24162f,0x32223f,0x8b59c8,0xd6b7bc,0xe3dce4,0xb86bff,"hood","orb",.95),
("garrick","smith",0x514031,0x393535,0x9b7045,0xb78b6d,0x3b302b,0xff8d4d,"none","hammer",1.07),
("isolde","royal",0x5d202a,0x9b3c47,0xe2c79b,0xe8c9b4,0xd7ae83,0xff7878,"crown","scepter",1),
("veyra","nature",0x274b3a,0x4c775b,0xd7d4a7,0xd9cdb0,0x6c9f74,0x7ef0ae,"antler","staff",1.02),
("kaelthar","heavy",0x201a1f,0x3a3037,0xa07d54,0xb89c8d,0x96929b,0xd96e4d,"crown","greatsword",1.15),
("the-wraith","ghost",0x102631,0x1a3441,0x355e71,0x5c7f8a,0x101c27,0x58cee8,"hood","none",1.07),
("malric","witch",0x1a2835,0x23394a,0x5b9baa,0xbcaea2,0x9da9b3,0x56d3e4,"hood","staff",1),
("selene","robe",0xd9dbdc,0xadb8c1,0xdac39a,0xe5c9b6,0xc5cdd9,0x8cdaf0,"halo","scepter",.97),
("voran","bulky",0x3c2722,0x514038,0xa75d42,0xb38a70,0x3b2b24,0xe57c4b,"none","axe",1.11),
("vesper","witch",0x461a28,0x61212c,0xe3ac72,0xd7b29d,0x9c393f,0xff654b,"hat","staff",.98),
("rook","light",0x2b3234,0x47494a,0x8b795e,0xb99c83,0x433b35,0xd19b65,"mask","sword",1.03),
("faelar","nature",0x285043,0x426f61,0xc3b88c,0xd9c7ad,0x9ab88c,0x72e9b2,"antler","bow",.97),
("zarek","duelist",0x273347,0x485b70,0xb3c8df,0xc7a58e,0x2e333e,0x6da9ff,"none","dual",1),
("mira","witch",0x591f29,0x73303a,0xe1b176,0xe0baa4,0x8f3b3e,0xff6b4a,"hood","orb",.96),
("solan","paladin",0xd8d5c9,0xb7b8b2,0xd8af5d,0xdcc2ab,0xe5dbca,0xffd48b,"halo","sword",1.04),
("brakk","bulky",0x51352a,0x4a3a31,0xb87f50,0xb68a70,0x332722,0xff7846,"horns","axe",1.15),
("astrid","hunter",0x28394b,0x4d6274,0xaac8d9,0xe1c7b3,0xc4d4e0,0x88d8ff,"none","bow",.98),
("kade","witch",0x211e32,0x313045,0x715ab5,0xc1a5a4,0x292632,0x9b75ff,"hood","orb",1.01),
("lyra-dreamweaver","robe",0x5b3b67,0x84639a,0xe1b6ce,0xebcbd0,0xdca9c8,0xffa9df,"halo","staff",.96),
("garin","heavy",0x3a252b,0x4e393e,0xb19b8b,0xb68e77,0x2b2628,0xc74c51,"helmet","sword",1.12),
("sable","light",0x382e29,0x51413a,0xb1875c,0xc5a58a,0x51403b,0xe5b16f,"hood","dagger",.99),
("eira","witch",0x1f3446,0x38566b,0x9bc5de,0xe1cabc,0xd2e2ec,0x7cdfff,"hood","staff",.97),
("valen","paladin",0x55472e,0x8a7851,0xe2c99a,0xcdb39d,0x7b7060,0xffd27e,"crown","shield",1.08),
("talia-moonblade","duelist",0x2e2c49,0x45496b,0xb7a7dd,0xe2c6bd,0x9f9cd5,0xbba0ff,"none","dual",.97),
("fenric-hollow","heavy",0x2b292f,0x42414b,0x8b819b,0xb29e92,0x5a5466,0x9279da,"hood","spear",1.09),
("mirelle-nightveil","assassin",0x201928,0x33273e,0x76508f,0xd9b7bd,0x4a2d56,0xae72df,"mask","dual",.95),
("cassian-emberhand","heavy",0x482921,0x6d3727,0xd99a58,0xc69f85,0x3a2722,0xff8b42,"broken-crown","greatsword",1.06),
("elys-mourning","robe",0x322632,0x524355,0xc6a7ad,0xe4c9c7,0xc2b6c4,0xc18ee7,"veil","scepter",.97),
("draven-blackthorn","reaper",0x2b201e,0x46302a,0x936044,0xb9907d,0x27201d,0xe35b37,"horns","axe",1.08),
("ysolde-frostveil","robe",0xd7e1e8,0x9bb5c9,0xdbeafa,0xe9d1c2,0xbacfe0,0xa2e9ff,"veil","staff",.98),
("rowan-greycloak","hunter",0x31383d,0x495159,0x9c927e,0xc5a58a,0x787a7d,0xc0a77d,"hood","bow",1.02),
("aster-vale","robe",0x243d4b,0x3b6270,0xd0d5c3,0xd7c0ae,0xc4d8dc,0x77dbe8,"halo","orb",.98),
("hadrik-stoneborn","bulky",0x493a2f,0x5c5c5b,0xb59b78,0xb78d72,0x4c3a30,0xf0a85e,"helmet","hammer",1.16),
("zaria-duskwind","light",0x35263e,0x514064,0xb58fc9,0xd8b7ab,0x5e426f,0xb994ff,"none","bow",.96),
("elion-starfall","paladin",0x293245,0x465979,0xd2c39d,0xcbb09b,0xc0c7d7,0x8acbff,"crown","spear",1.06),
("morwen-ash","witch",0x292327,0x41333d,0xb7a0aa,0xd8bfb4,0xa7a0ab,0xe6a4cf,"hood","staff",.97),
("cedric-dreadmoor","heavy",0x2e2426,0x4c3738,0xb18c64,0xb58d75,0x38302e,0xce5c4d,"helmet","sword",1.1),
("anwen-briar","nature",0x274534,0x42684a,0xb5b98a,0xe1c7b0,0x76935c,0x7ce49d,"antler","staff",.98),
("selka-rune","witch",0x283c49,0x456372,0xc1a7db,0xdac1b1,0xa6b7c4,0x7bbcff,"hood","orb",.96),
("theron-wolf","hunter",0x4a3a2b,0x66523b,0xc3a16b,0xc19a7a,0x4b382e,0xe7b25c,"antler","spear",1.07),
("ilyra-veil","assassin",0x2d213d,0x4b345e,0xc8a8d8,0xe1c4c2,0x7f5d9a,0xb58bff,"veil","dual",.95),
("maelis-thorn","nature",0x314637,0x4a6652,0xb7c39b,0xdac5b0,0x6d8560,0x8ee3b1,"antler","staff",.98),
("ebon-knight","heavy",0x13171e,0x292e3a,0x6f7481,0xb6a29b,0x28252a,0x977bff,"helmet","greatsword",1.1),
("rhae-stormborn","duelist",0x263c4b,0x3f6174,0xb8ccd5,0xd6b9a2,0x9ea9b0,0x72d1ff,"none","spear",1.02),
("orin-duskpriest","nun",0x211d2c,0x383247,0x9683aa,0xb99e93,0x554961,0xb49aff,"hood","scepter",1),
("velka-bloodmoon","hunter",0x401c29,0x612d3b,0xc5a07e,0xd9b5a0,0x722d43,0xff596d,"mask","bow",.98),
("osric-flameward","heavy",0x402a23,0x694331,0xe1ac6c,0xbf977e,0x3b2a24,0xff8a4a,"helmet","sword",1.1),
("elspeth-silver","robe",0xd7dbe0,0x9ea6b3,0xe1c38f,0xe4ccbc,0xb8bdc9,0xa8e2f2,"halo","scepter",.99),
("nerys-blackwater","light",0x23303a,0x3f535b,0xa8bfc0,0xc8a28d,0x32343a,0x6bc7d2,"bandana","sword",1),
("corva-ashen","assassin",0x272430,0x3a3542,0x8d7d9a,0xd5b8b0,0x3c2f46,0x9f83d7,"hood","dual",.95),
("dren-morrow","bulky",0x4a3029,0x55413a,0xb07c54,0xb58a70,0x2c2422,0xff7546,"horns","axe",1.14),
("sylvi-mist","robe",0x385263,0x567484,0xc5dbe1,0xe4cabc,0xb9d4de,0x9ce7f5,"veil","staff",.96),
("bastian-ironroot","hunter",0x374338,0x5a6652,0xb4ac82,0xc2a284,0x4a4334,0x9bd58c,"antler","hammer",1.08),
]

SEMANTICS=("cloth","armor","trim","skin","hair","leather","glow")
MAT_FACTORS={"cloth":(0,.88),"armor":(.72,.40),"trim":(.82,.30),"skin":(0,.92),"hair":(0,.94),"leather":(.04,.82),"glow":(.20,.22)}

def norm(v):
    length=math.sqrt(sum(x*x for x in v)) or 1
    return [x/length for x in v]

class Model:
    def __init__(self,spec,mi):
        self.id,self.arch,self.cloth,self.armor,self.trim,self.skin,self.hair,self.glow,self.headwear,self.weapon,self.scale=spec
        self.mi=mi
        self.b={k:{"p":[],"n":[],"uv":[],"ix":[]} for k in SEMANTICS}
    def put(self,key,p,n,uv,ix):
        b=self.b[key]; off=len(b["p"]); b["p"].extend(p); b["n"].extend(n); b["uv"].extend(uv); b["ix"].extend(i+off for i in ix)
    def ellipsoid(self,k,c,r,seg=9,rings=6):
        x,y,z=c;rx,ry,rz=r;p=[];n=[];uv=[];ix=[]
        for j in range(rings+1):
            t=math.pi*j/rings
            for i in range(seg+1):
                a=math.tau*i/seg;nx=math.sin(t)*math.cos(a);ny=math.cos(t);nz=math.sin(t)*math.sin(a)
                p.append([x+rx*nx,y+ry*ny,z+rz*nz]);n.append(norm([nx/max(rx,1e-5),ny/max(ry,1e-5),nz/max(rz,1e-5)]));uv.append([i/seg,1-j/rings])
        for j in range(rings):
            for i in range(seg):
                a=j*(seg+1)+i;d=a+seg+1;ix.extend((a,d,a+1,d,d+1,a+1))
        self.put(k,p,n,uv,ix)
    def box(self,k,c,s,rz=0,ry=0):
        sx,sy,sz=[v/2 for v in s]; corners=[(-sx,-sy,-sz),(sx,-sy,-sz),(sx,sy,-sz),(-sx,sy,-sz),(-sx,-sy,sz),(sx,-sy,sz),(sx,sy,sz),(-sx,sy,sz)]
        faces=[((0,3,2,1),(0,0,-1)),((4,5,6,7),(0,0,1)),((0,4,7,3),(-1,0,0)),((1,2,6,5),(1,0,0)),((0,1,5,4),(0,-1,0)),((3,7,6,2),(0,1,0))]
        p=[];n=[];uv=[];ix=[]
        for face,normal in faces:
            st=len(p)
            for j in face:
                x,y,z=corners[j];zrot=(x*math.sin(rz)+y*math.cos(rz));xrot=x*math.cos(rz)-y*math.sin(rz);x,y=xrot,zrot
                xx=x*math.cos(ry)+z*math.sin(ry);zz=-x*math.sin(ry)+z*math.cos(ry)
                p.append([xx+c[0],y+c[1],zz+c[2]])
                nx,ny,nz=normal; nx,ny=nx*math.cos(rz)-ny*math.sin(rz),nx*math.sin(rz)+ny*math.cos(rz)
                n.append(norm([nx*math.cos(ry)+nz*math.sin(ry),ny,-nx*math.sin(ry)+nz*math.cos(ry)]))
                uv.append([(corners[j][0]/max(sx,1e-5)+1)/2,(corners[j][1]/max(sy,1e-5)+1)/2])
            ix.extend((st,st+1,st+2,st,st+2,st+3))
        self.put(k,p,n,uv,ix)
    def plate(self,k,pts,z,depth=.025):
        z1=z+depth/2;z0=z-depth/2;x0=min(x for x,y in pts);x1=max(x for x,y in pts);y0=min(y for x,y in pts);y1=max(y for x,y in pts)
        p=[];n=[];uv=[];ix=[];N=len(pts)
        for zz,nz in ((z1,1),(z0,-1)):
            st=len(p)
            for x,y in pts:p.append([x,y,zz]);n.append([0,0,nz]);uv.append([(x-x0)/max(x1-x0,1e-5),(y-y0)/max(y1-y0,1e-5)])
            for i in range(1,N-1):ix.extend((st,st+i,st+i+1) if nz>0 else (st,st+i+1,st+i))
        for i,a in enumerate(pts):
            d=pts[(i+1)%N];st=len(p);p.extend(([a[0],a[1],z1],[d[0],d[1],z1],[d[0],d[1],z0],[a[0],a[1],z0]));nn=norm([d[1]-a[1],a[0]-d[0],0]);n.extend((nn,nn,nn,nn));uv.extend(([0,0],[1,0],[1,1],[0,1]));ix.extend((st,st+1,st+2,st,st+2,st+3))
        self.put(k,p,n,uv,ix)
    def cone(self,k,base,h,r,seg=7,down=False):
        x,y,z=base;p=[];n=[];uv=[];ix=[]
        for i in range(seg+1):
            a=math.tau*i/seg;dx,dz=math.cos(a),math.sin(a);tip=[x,y+(-h if down else h),z]
            for pos in ([x+r*dx,y,z+ r*dz],tip):
                p.append(pos);n.append(norm([dx,r/max(h,.01),dz]));uv.append([i/seg,0 if pos[1]==y else 1])
        for i in range(seg):j=i*2;ix.extend((j,j+2,j+1,j+1,j+2,j+3))
        self.put(k,p,n,uv,ix)
    def build(self):
        arch=self.arch;heavy=arch in {"heavy","paladin","bulky"};robe=arch in {"robe","nun","witch","royal","ghost","nature"}
        w={"bulky":.36,"heavy":.32,"assassin":.235,"duelist":.255,"light":.25,"hunter":.27,"ghost":.26}.get(arch,.285)
        if self.id=="borin":w=.35
        shoulder=w*(1.42 if heavy else 1.08 if arch in {"hunter","duelist","reaper"} else .98)
        # Distinct silhouettes start with different shoulder/waist proportions, then layer class-specific forms.
        self.ellipsoid("cloth",(0,1.04,0),(w,.34,.19 if not heavy else .22),11,7)
        self.ellipsoid("leather",(0,.87,.01),(w*.92,.19,.20),9,6)
        self.ellipsoid("skin",(0,1.65,.03),(.145,.185,.145),10,7)
        self.ellipsoid("hair",(0,1.84,-.015),(.16,.10,.16),9,6)
        self.ellipsoid("armor",(0,1.34,.04),(w*1.02,.25,.20),10,6)
        self.plate("trim",[(-w*.34,1.52),(-w*.20,1.60),(0,1.62),(w*.20,1.60),(w*.34,1.52),(0,1.28)],.242,.012)
        self.ellipsoid("glow",(0,1.30,.235),(.034,.05,.018),7,5)
        if robe:
            self.plate("cloth",[(-w,1.18),(-w*.92,.77),(-w*.72,.16),(0,.08),(w*.72,.16),(w*.92,.77),(w,1.18)],.135,.045)
            self.plate("cloth",[(-w*.80,1.05),(-w*.70,.72),(-w*.50,.20),(0,.13),(w*.50,.20),(w*.70,.72),(w*.80,1.05)],-.20,.035)
            self.plate("trim",[(-w*.65,1.03),(-w*.59,.72),(-w*.40,.21),(-w*.35,.18)],.166,.01)
            self.plate("trim",[(w*.65,1.03),(w*.59,.72),(w*.40,.21),(w*.35,.18)],.166,.01)
        else:
            self.plate("armor",[(-w*.70,1.48),(-w*.5,1.61),(0,1.66),(w*.5,1.61),(w*.70,1.48),(w*.48,1.20),(0,1.13),(-w*.48,1.20)],.214,.04)
            for x in (-1,1):
                self.ellipsoid("armor",(x*shoulder*.59,1.46,.02),(.16 if heavy else .12,.145,.16),9,6)
                self.plate("trim",[(x*shoulder*.45,1.54),(x*shoulder*.60,1.66),(x*shoulder*.85,1.56),(x*shoulder*.78,1.40),(x*shoulder*.48,1.39)],.207,.018)
        # Arms, bracers, gloves, greaves and boots.
        for side in (-1,1):
            self.ellipsoid("cloth",(side*shoulder*.70,1.34,0),(.105,.22,.11),8,5)
            self.ellipsoid("skin",(side*shoulder*.81,1.10,.015),(.065,.16,.07),8,5)
            self.box("armor",(side*shoulder*.81,1.03,.03),(.13,.15,.13),rz=-side*.12)
            self.box("armor",(side*.14,.48,.02),(.155,.32,.16))
            self.box("trim",(side*.14,.22,.06),(.18,.12,.28))
            self.box("leather",(side*.14,.10,.07),(.21,.12,.31))
            if heavy:self.plate("armor",[(side*.05,.68),(side*.25,.68),(side*.24,.41),(side*.14,.34),(side*.05,.42)],.126,.025)
        self.box("leather",(0,.99,.05),(w*1.9,.085,.29))
        self.box("trim",(0,1.00,.204),(w*.55,.055,.025))
        if not robe:
            for cx in (-w*.48,0,w*.48):
                self.plate("cloth",[(cx-w*.22,1.00),(cx+w*.22,1.00),(cx+w*.18,.77),(cx,.60),(cx-w*.18,.77)],.17,.03)
        # Back mantle/hood makes robes and shadow silhouettes visibly different from soldiers.
        if self.scale>1.02 or arch in {"reaper","witch","ghost","royal","assassin","nature"}:
            length=1.05 if arch in {"ghost","reaper"} else .82;cw=.36 if arch!="bulky" else .43
            self.plate("cloth",[(-cw,1.56),(-cw*1.12,.62),(-cw,.16),(0,.06),(cw,.16),(cw*1.12,.62),(cw,1.56)],-.22,.035)
            self.plate("trim",[(-.025,1.42),(0,1.44),(.025,1.42),(.015,.15),(0,.12),(-.015,.15)],-.245,.008)
        # Headgear and class markers.
        if self.headwear not in {"none","bandana"}:
            self.plate("cloth",[(-.16,1.84),(-.15,2.00),(0,2.10),(.15,2.00),(.16,1.84),(0,1.78)],-.005,.05)
        if self.headwear in {"crown","broken-crown","helmet"}:
            self.box("armor",(0,1.98,.01),(.32,.055,.30))
            for i in range(5):self.cone("trim",((i-2)*.07,2.00,.02),.17 if i%2==0 else .11,.032,5)
            if self.headwear=="helmet":self.plate("armor",[(-.16,1.94),(-.14,1.76),(0,1.71),(.14,1.76),(.16,1.94)],.16,.03)
        elif self.headwear=="halo":
            self.ellipsoid("trim",(0,2.02,-.03),(.20,.022,.035),10,5)
        elif self.headwear in {"hood","veil","mask","bandana"}:
            self.ellipsoid("cloth",(0,1.86,-.045),(.175,.16,.17),9,5)
            if self.headwear in {"hood","veil"}:self.plate("cloth",[(-.15,1.88),(-.19,1.68),(-.21,1.15),(0,1.08),(.21,1.15),(.19,1.68),(.15,1.88)],-.11,.035)
            else:self.plate("armor",[(-.14,1.72),(-.12,1.62),(0,1.59),(.12,1.62),(.14,1.72)],.18,.02)
        elif self.headwear in {"antler","horns"}:
            for side in (-1,1):
                self.cone("trim",(side*.10,1.90,-.01),.31,.034,6,down=side<0)
                self.cone("armor",(side*.12,2.08,-.01),.18,.025,5,down=side<0)
        elif self.headwear=="hat":
            self.ellipsoid("leather",(0,1.97,0),(.22,.04,.20),9,5);self.cone("cloth",(0,1.99,0),.32,.15,8)
        if self.headwear not in {"hood","veil","mask","helmet"}:
            for side in (-1,1):self.ellipsoid("hair",(side*.125,1.69,-.02),(.052,.18,.06),7,5)
        if arch in {"robe","royal","nature","nun"}:
            for side in (-1,1):self.plate("hair",[(side*.10,1.82),(side*.14,1.55),(side*.12,1.18),(side*.07,1.12)],-.08,.02)
        if arch=="nature":
            for side in (-1,1):self.plate("trim",[(side*.12,1.45),(side*.25,1.65),(side*.33,1.50),(side*.18,1.32)],.20,.018)
        if arch=="ghost":self.plate("glow",[(-.17,1.68),(-.12,1.43),(-.07,1.20),(0,1.08),(.07,1.20),(.12,1.43),(.17,1.68)],.19,.01)
        self.weapon_geometry()
    def weapon_geometry(self):
        w=self.weapon
        if w=="none":return
        if w=="bow":
            self.plate("trim",[(.46,.54),(.60,.75),(.67,1.05),(.60,1.32),(.48,1.42),(.53,1.17),(.56,.91),(.50,.68)],-.08,.03)
            self.box("glow",(.54,.98,-.08),(.012,.72,.012));return
        if w=="orb":
            self.box("leather",(.48,.91,0),(.04,.8,.04))
            self.ellipsoid("glow",(.48,1.46,0),(.095,.11,.095),8,5)
            self.ellipsoid("trim",(.48,1.46,0),(.13,.025,.13),9,5);return
        if w in {"staff","scepter"}:
            self.box("leather",(.48,.91,.01),(.04,1.0,.04),rz=-.03)
            self.ellipsoid("glow",(.48,1.46,.01),(.08,.10,.08),8,5)
            self.plate("trim",[(.40,1.46),(.48,1.60),(.56,1.46),(.48,1.32)],.045,.018);return
        if w=="hammer":
            self.box("leather",(.49,.9,.01),(.065,.93,.06),rz=-.07);self.box("armor",(.49,1.40,.01),(.25,.18,.17));self.box("trim",(.49,1.40,.10),(.11,.1,.025));return
        if w=="axe":
            self.box("leather",(.49,.90,.01),(.055,.90,.055),rz=-.08)
            self.plate("armor",[(.51,1.44),(.67,1.54),(.77,1.40),(.72,1.24),(.57,1.31)],.04,.035);return
        if w=="scythe":
            self.box("leather",(.48,.91,.01),(.05,1.22,.05),rz=-.05)
            self.plate("armor",[(.47,1.43),(.63,1.60),(.83,1.68),(.72,1.53),(.58,1.48)],.025,.03)
            self.plate("glow",[(.61,1.57),(.77,1.65),(.68,1.55)],.05,.012);return
        if w=="shield":
            self.box("leather",(.48,1.0,-.02),(.06,.42,.06))
            self.plate("armor",[(.42,1.41),(.57,1.47),(.69,1.30),(.57,1.09),(.42,1.20)],.09,.045)
            self.plate("trim",[(.47,1.35),(.57,1.39),(.63,1.29),(.57,1.16),(.47,1.22)],.125,.012);return
        if w=="spear":
            self.box("leather",(.49,.91,0),(.035,1.25,.035),rz=-.03)
            self.plate("trim",[(.45,1.61),(.49,1.77),(.53,1.61)],.02,.015);return
        if w in {"dual","dagger"}:
            for side in (-1,1):
                self.box("leather",(side*.46,.98,.02),(.03,.25,.03),rz=side*.14)
                self.plate("armor",[(side*.45,.83),(side*.50,.83),(side*.61,.64),(side*.59,.59)],.035,.015)
            return
        if w in {"sword","greatsword"}:
            self.box("leather",(.49,.95,.02),(.04,.27,.04),rz=-.04);self.box("trim",(.49,.80,.02),(.18,.035,.06))
            self.plate("armor",[(.45,.78),(.53,.78),(.55,.33),(.49,.20),(.44,.33)],.045,.02)
            if w=="greatsword":self.plate("trim",[(.47,.70),(.51,.70),(.52,.34),(.49,.25),(.46,.34)],.07,.01)


def create_glb():
    texture_paths=[TEXTURE_ROOT/n for n in TEXTURES]
    missing=[str(p) for p in texture_paths if not p.is_file()]
    if missing:raise FileNotFoundError("Missing shared PBR maps; run tools/generate_ashen_production_assets.py first: "+", ".join(missing))
    mats=[];mi={}
    for row in ROSTER:
        cid,arch,cloth,armor,trim,skin,hair,glow,head,weapon,scale=row
        colors={"cloth":cloth,"armor":armor,"trim":trim,"skin":skin,"hair":hair,
                "leather":((cloth>>16)&255)//2<<16 | (((cloth>>8)&255)//2)<<8 | ((cloth&255)//2),"glow":glow}
        for sem in SEMANTICS:
            metal,rough=MAT_FACTORS[sem];c=colors[sem];rgba=[((c>>16)&255)/255,((c>>8)&255)/255,(c&255)/255,.80 if arch=="ghost" and sem=="cloth" else 1]
            mat={"name":f"NPC_{cid}_{sem}","pbrMetallicRoughness":{"baseColorFactor":rgba,"baseColorTexture":{"index":0},"metallicFactor":metal,"roughnessFactor":rough,"metallicRoughnessTexture":{"index":2}},
                 "normalTexture":{"index":1,"scale":.6},"occlusionTexture":{"index":2,"strength":.62},"doubleSided":sem=="cloth"}
            if sem=="glow":mat["emissiveFactor"]=[rgba[i] for i in range(3)];mat["emissiveTexture"]={"index":3}
            if arch=="ghost" and sem=="cloth":mat["alphaMode"]="BLEND"
            mi[(cid,sem)]=len(mats);mats.append(mat)
    models=[Model(row,mi) for row in ROSTER]
    for model in models:model.build()

    binary=bytearray();views=[];accessors=[];meshes=[]
    def align():
        while len(binary)%4:binary.append(0)
    def view(blob,target=None):
        align();off=len(binary);binary.extend(blob);entry={"buffer":0,"byteOffset":off,"byteLength":len(blob)}
        if target is not None:entry["target"]=target
        views.append(entry);return len(views)-1
    def acc(blob,comp,count,typ,target=None,minimum=None,maximum=None):
        item={"bufferView":view(blob,target),"componentType":comp,"count":count,"type":typ}
        if minimum is not None:item["min"]=minimum
        if maximum is not None:item["max"]=maximum
        accessors.append(item);return len(accessors)-1
    def pack(rows):return struct.pack("<"+"f"*(len(rows)*len(rows[0])),*(v for row in rows for v in row))
    nodes=[{"name":"AshenNPCRosterRoot","children":[]}]
    rootnodes={}
    for model in models:
        rootnodes[model.id]=len(nodes);nodes.append({"name":"NPCMODEL_"+model.id,"scale":[model.scale]*3,"children":[]});nodes[0]["children"].append(rootnodes[model.id])
    for model in models:
        for sem in SEMANTICS:
            b=model.b[sem]
            if not b["p"] or not b["ix"]:continue
            cols=list(zip(*b["p"]));minimum=[min(x) for x in cols];maximum=[max(x) for x in cols]
            attrs={"POSITION":acc(pack(b["p"]),5126,len(b["p"]),"VEC3",34962,minimum,maximum),
                   "NORMAL":acc(pack(b["n"]),5126,len(b["n"]),"VEC3",34962),
                   "TEXCOORD_0":acc(pack(b["uv"]),5126,len(b["uv"]),"VEC2",34962)}
            idx=b["ix"];ia=acc(struct.pack("<"+"I"*len(idx),*idx),5125,len(idx),"SCALAR",34963,[min(idx)],[max(idx)])
            mesh_id=len(meshes);meshes.append({"name":f"NPC_{model.id}_{sem}","primitives":[{"attributes":attrs,"indices":ia,"material":mi[(model.id,sem)],"mode":4}]})
            node_id=len(nodes);nodes.append({"name":f"NPC_{model.id}_{sem}_mesh","mesh":mesh_id});nodes[rootnodes[model.id]]["children"].append(node_id)
    images=[]
    for p in texture_paths:images.append({"bufferView":view(p.read_bytes()),"mimeType":"image/png","name":p.stem})
    doc={"asset":{"version":"2.0","generator":"Ashen Crown NPC roster generator"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":nodes,"meshes":meshes,"materials":mats,
         "textures":[{"sampler":0,"source":i} for i in range(4)],"images":images,"samplers":[{"magFilter":9729,"minFilter":9987,"wrapS":10497,"wrapT":10497}],
         "accessors":accessors,"bufferViews":views,"buffers":[{"byteLength":len(binary)}]}
    js=json.dumps(doc,separators=(",",":"),ensure_ascii=False).encode()
    while len(js)%4:js+=b" "
    align();total=12+8+len(js)+8+len(binary)
    glb=struct.pack("<4sII",b"glTF",2,total)+struct.pack("<II",len(js),0x4E4F534A)+js+struct.pack("<II",len(binary),0x004E4942)+binary
    OUTPUT.parent.mkdir(parents=True,exist_ok=True);OUTPUT.write_bytes(glb)
    print(f"Generated {OUTPUT.relative_to(ROOT)}: {len(ROSTER)} characters, {len(meshes)} material batches, {len(glb):,} bytes")

if __name__=="__main__":create_glb()
