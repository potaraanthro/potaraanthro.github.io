/* =====================================================================
   ROOM 3D: the large meeting room from Potara's "Rooms fit for purpose"
   journey, reused for the room consultation. Needs three.js r128.
   ===================================================================== */
let ROOM_ON=false;
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const easeBack = t => { const c1=1.70158, c3=c1+1; return 1 + c3*Math.pow(t-1,3) + c1*Math.pow(t-1,2); };
/* ================================================================ 3D WORLD */
const HAS3D = !!window.THREE && (()=>{ try{ const c=document.createElement('canvas'); return !!(c.getContext('webgl')||c.getContext('experimental-webgl')); }catch(e){ return false; } })();
let R, SC, C, G={}, TW=[], PULSES=[], LBL=[], SCREENS={}, CAB=[], FLOOR, FLOORMAT, WALLS=[], xray=false;
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const cam={tgt:null, r:11, th:1.1, ph:1.02}, camGoal={}; let camTween=null, lastDrag=0, autoSpin=false;

function mat(color,o={}){
  const m=new THREE.MeshStandardMaterial({color, emissive:o.em??0x000000, emissiveIntensity:o.ei??1, roughness:o.rough??.7, metalness:o.metal??.05, transparent:true, opacity:o.op??1, side:o.side??THREE.FrontSide, depthWrite:o.dw??true});
  m.userData.base=o.op??1; return m;
}
function basic(color,op=1,add=false){ const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:op,depthWrite:!add,blending:add?THREE.AdditiveBlending:THREE.NormalBlending,side:THREE.DoubleSide}); m.userData.base=op; return m; }
function edge(mesh,color=0x22d3ee,op=.55){ const l=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,20), new THREE.LineBasicMaterial({color,transparent:true,opacity:op})); l.material.userData.base=op; mesh.add(l); return mesh; }
function box(w,h,d,color,o){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color,o)); }
function at(o,x,y,z){ o.position.set(x,y,z); return o; }
function grp(name,a=0){ const g=new THREE.Group(); g.userData.a=a; g.userData.goal=a; SC.add(g); G[name]=g; return g; }

/* ---- labels anchored in 3D ---- */
function label(html,pos,group,color){
  const el=document.createElement('div'); el.className='lb'; el.innerHTML=html; if(color) el.style.setProperty('--c',color);
  $('#labels').appendChild(el); const L={el,pos,group,on:false}; LBL.push(L); return L;
}

/* ---- screen textures ---- */
function screen(kind){
  const c=document.createElement('canvas'); c.width=512; c.height=288; const x=c.getContext('2d');
  const t=new THREE.CanvasTexture(c);
  const draw=k=>{
    x.fillStyle='#050510'; x.fillRect(0,0,512,288);
    if(k==='gallery'){
      const cols=['#4c1d95','#0e7490','#9d174d','#1e3a8a','#065f46','#7c2d12'];
      for(let i=0;i<6;i++){ const gx=8+(i%3)*168, gy=8+(i/3|0)*140; const g=x.createLinearGradient(gx,gy,gx,gy+132); g.addColorStop(0,cols[i]); g.addColorStop(1,'#0a0a1f'); x.fillStyle=g; x.fillRect(gx,gy,160,132);
        x.fillStyle='rgba(255,220,200,.85)'; x.beginPath(); x.arc(gx+80,gy+58,22,0,7); x.fill(); x.fillStyle='rgba(255,255,255,.25)'; x.fillRect(gx+40,gy+88,80,44); }
      x.strokeStyle='#22d3ee'; x.lineWidth=4; x.strokeRect(10,10,156,128);
    } else if(k==='content'){
      x.fillStyle='#0b1030'; x.fillRect(0,0,512,288); x.fillStyle='#fff'; x.font='bold 26px sans-serif'; x.fillText('Q3 Review',28,50);
      const v=[.45,.6,.52,.78,.7,.92]; v.forEach((h,i)=>{ x.fillStyle=i===5?'#f472b6':'#22d3ee'; x.fillRect(40+i*72,250-h*170,44,h*170); });
    } else if(k==='join'){
      x.fillStyle='#0b1030'; x.fillRect(0,0,512,288); x.fillStyle='#fff'; x.font='bold 30px sans-serif'; x.fillText('Meeting Room 3.02',28,64);
      x.font='20px sans-serif'; x.fillStyle='#a9a4d0'; x.fillText('Next: Design review  14:00',28,100);
      x.fillStyle='#6d28d9'; x.fillRect(28,190,180,56); x.fillStyle='#fff'; x.font='bold 22px sans-serif'; x.fillText('Join',88,226);
    } else if(k==='bars'){
      ['#fff','#fde047','#22d3ee','#4ade80','#f472b6','#ef4444','#3b82f6'].forEach((c,i)=>{ x.fillStyle=c; x.fillRect(i*73.2,0,74,200); });
      x.fillStyle='#111'; x.fillRect(0,200,512,88); x.fillStyle='#4ade80'; x.font='bold 22px monospace'; x.fillText('SIGNAL OK  3840x2160',100,252);
    } else if(k==='slide'){
      x.fillStyle='#d9d5c6'; x.fillRect(0,0,512,288); x.fillStyle='rgba(60,60,60,.35)'; x.font='bold 30px sans-serif'; x.fillText('Q3 Review',40,70);
      for(let i=0;i<4;i++){ x.fillRect(40,110+i*38,300-i*40,12); }
    }
    t.needsUpdate=true;
  };
  draw(kind); return {tex:t, draw};
}

/* ---- cable routes ---- */
function route(pts,color,radius=.017,group='cables',tag){
  const path=new THREE.CurvePath(); for(let i=1;i<pts.length;i++) path.add(new THREE.LineCurve3(V(...pts[i-1]),V(...pts[i])));
  const geo=new THREE.TubeGeometry(path, pts.length*24, radius, 6, false);
  const m=new THREE.Mesh(geo, mat(color,{em:color,ei:.9,rough:.4})); G[group].add(m);
  const c={mesh:m, path, color}; CAB.push(c);
  for(let k=0;k<2;k++){ const p=new THREE.Mesh(new THREE.SphereGeometry(radius*2.3,8,8), basic(0xffffff,.95,true)); G[group].add(p); PULSES.push({m:p, path, t:k*.5, sp:.12+Math.random()*.05}); }
  return c;
}

function build3D(){
  const cv=$('#gl');
  R=new THREE.WebGLRenderer({canvas:cv, antialias:true});
  R.setPixelRatio(Math.min(devicePixelRatio,2)); R.setSize(cv.clientWidth||800,cv.clientHeight||500,false);
  SC=new THREE.Scene(); SC.background=new THREE.Color(0x07071a); SC.fog=new THREE.Fog(0x07071a,16,34);
  C=new THREE.PerspectiveCamera(38,(cv.clientWidth||800)/(cv.clientHeight||500),.1,120); cam.tgt=V(0,1,0);

  const hemi=new THREE.HemisphereLight(0xb8c0ff,0x2a1446,.9); SC.add(hemi);
  const key=new THREE.DirectionalLight(0xffffff,.6); key.position.set(4,8,5); SC.add(key);
  const sun=new THREE.DirectionalLight(0xcfe8ff,.0); sun.position.set(0,3,9); SC.add(sun); G.sun=sun;
  const warm=new THREE.PointLight(0xfff1dc,0,9,1.6); warm.position.set(0,2.5,0); SC.add(warm); G.warm=warm;

  /* world: grid + stars */
  const grid=new THREE.GridHelper(60,60,0x6d28d9,0x1e1b4b); grid.position.y=-.02; grid.material.transparent=true; grid.material.opacity=.45; SC.add(grid);
  const sg=new THREE.BufferGeometry(), sp=[]; for(let i=0;i<900;i++){ const r=40+Math.random()*20, a=Math.random()*6.28, b=Math.random()*1.4; sp.push(Math.cos(a)*Math.cos(b)*r, Math.sin(b)*r*.8+2, Math.sin(a)*Math.cos(b)*r); }
  sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); SC.add(new THREE.Points(sg,new THREE.PointsMaterial({color:0xb7c4ff,size:.12,transparent:true,opacity:.8})));

  /* ---------------- shell (always) ---------------- */
  const shell=grp('shell',1);
  FLOORMAT=mat(0x3b4152,{rough:.22,metal:.25}); FLOOR=new THREE.Mesh(new THREE.PlaneGeometry(6,4.2),FLOORMAT); FLOOR.rotation.x=-Math.PI/2; shell.add(FLOOR);
  const wallMat=()=>mat(0x1b1a3a,{rough:.95});
  const wall=(w,h,x,y,z,ry)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),wallMat()); m.position.set(x,y,z); m.rotation.y=ry; shell.add(m); WALLS.push(m); return m; };
  wall(4.2,2.7,-3,1.35,0,Math.PI/2); wall(4.2,2.7,3,1.35,0,-Math.PI/2); wall(6,2.7,0,1.35,-2.1,0); wall(6,2.7,0,1.35,2.1,Math.PI);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(6,4.2),mat(0x23224a,{rough:1})); ceil.rotation.x=Math.PI/2; ceil.position.y=2.7; shell.add(ceil); WALLS.push(ceil);
  const frame=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6,2.7,4.2)), new THREE.LineBasicMaterial({color:0x22d3ee,transparent:true,opacity:.7})); frame.material.userData.base=.7; frame.position.y=1.35; shell.add(frame);
  // window (glass wall at z=+2.1)
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(4,1.5), mat(0x9fd8ff,{em:0x7cc4ff,ei:.55,op:.55,rough:.1})); glass.position.set(.5,1.65,2.08); glass.rotation.y=Math.PI; shell.add(glass); G.glass=glass;
  const mull=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(4,1.5)), new THREE.LineBasicMaterial({color:0xcfe8ff,transparent:true,opacity:.6})); mull.material.userData.base=.6; mull.position.copy(glass.position); mull.rotation.y=Math.PI; shell.add(mull);
  // door (back wall)
  const door=box(.05,2.1,1,0x3b2a5a); at(door,2.97,1.05,-1.35); edge(door,0xa855f7,.6); shell.add(door);
  // chairs
  const seats=[]; [-1.0,-.2,.6,1.4,2.2].forEach(x=>[-1,1].forEach(s=>seats.push([x,s])));
  seats.forEach(([x,s])=>{ const c=new THREE.Group(); const seat=box(.48,.07,.46,0x2d2a55); at(seat,0,.46,0); const back=box(.48,.5,.06,0x2d2a55); at(back,0,.74,s*.22);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.42,8),mat(0x777799,{metal:.6,rough:.3})); stem.position.y=.22; const base=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.03,12),mat(0x444466,{metal:.5})); base.position.y=.02;
    c.add(seat,back,stem,base); c.position.set(x,0,s*1.02); shell.add(c); });
  G.seats=seats;

  /* ---------------- legacy ---------------- */
  const leg=grp('legacy',1);
  const lt=box(3.8,.06,1.2,0x6b5a45,{rough:.5}); at(lt,.4,.74,0); edge(lt,0xa8906e,.4); leg.add(lt);
  [[-1.3,-.45],[-1.3,.45],[2.1,-.45],[2.1,.45]].forEach(([x,z])=>leg.add(at(box(.06,.72,.06,0x4a3f31),x,.36,z)));
  const proj=box(.4,.16,.34,0xdddddd); at(proj,.6,2.3,0); leg.add(proj); leg.add(at(box(.04,.36,.04,0x999999),.6,2.52,0));
  leg.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.02,16),mat(0x333333)),.39,2.3,0)).children;
  const beam=new THREE.Mesh(new THREE.ConeGeometry(.9,3.3,4,1,true), basic(0xfff6c8,.06,true)); beam.rotation.z=-Math.PI/2; beam.rotation.x=Math.PI/4; beam.position.set(-1.1,1.95,0); leg.add(beam);
  const slide=screen('slide'); SCREENS.slide=slide;
  const scr=new THREE.Mesh(new THREE.PlaneGeometry(1.9,1.07), new THREE.MeshBasicMaterial({map:slide.tex,transparent:true})); scr.material.userData.base=1; scr.position.set(-2.96,1.65,0); scr.rotation.y=Math.PI/2; leg.add(scr);
  leg.add(at(box(.1,.1,2.1,0xeeeeee),-2.94,2.25,0));
  const phone=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.05,3),mat(0x222222,{rough:.4})); phone.position.set(.4,.8,0); leg.add(phone);
  const fl=(x)=>{ const f=box(1.2,.05,.2,0xf2fff2,{em:0xe8ffe8,ei:.6}); at(f,x,2.67,0); leg.add(f); }; fl(-1); fl(1.4);
  [[[.4,.8,0],[.6,.78,.3],[.9,.78,.2],[1.1,.77,.5],[1.2,.3,.6],[1.3,.02,.7],[2.2,.02,1.2],[2.9,.02,1.4],[2.97,.3,1.5]],[[.2,.78,-.2],[-.5,.78,-.4],[-.9,.4,-.5],[-1,.02,-.4],[-2.2,.02,-.9],[-2.97,.3,-1]]].forEach(p=>{
    const path=new THREE.CatmullRomCurve3(p.map(a=>V(...a))); leg.add(new THREE.Mesh(new THREE.TubeGeometry(path,60,.012,6,false),mat(0x151515,{rough:.6}))); });

  /* ---------------- survey ---------------- */
  const sv=grp('survey',0);
  const scanP=new THREE.Mesh(new THREE.PlaneGeometry(4.2,2.7), basic(0x22d3ee,.18,true)); scanP.rotation.y=Math.PI/2; scanP.position.set(3,1.35,0); sv.add(scanP); G.scanP=scanP;
  const scanE=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(4.2,2.7)), new THREE.LineBasicMaterial({color:0x22d3ee,transparent:true,opacity:1})); scanE.material.userData.base=1; scanP.add(scanE);
  const pts=[]; const rnd=(a,b)=>a+Math.random()*(b-a);
  for(let i=0;i<5200;i++){ const f=Math.random(); let p;
    if(f<.3) p=[rnd(-3,3),0,rnd(-2.1,2.1)]; else if(f<.42) p=[-3,rnd(0,2.7),rnd(-2.1,2.1)]; else if(f<.54) p=[3,rnd(0,2.7),rnd(-2.1,2.1)];
    else if(f<.7) p=[rnd(-3,3),rnd(0,2.7),-2.1]; else if(f<.82) p=[rnd(-3,3),rnd(0,2.7),2.1]; else if(f<.92) p=[rnd(-1.5,2.3),.77,rnd(-.6,.6)]; else p=[rnd(-3,3),2.7,rnd(-2.1,2.1)];
    pts.push(...p); }
  // sort by x descending so the draw range reveals in scan direction
  const arr=[]; for(let i=0;i<pts.length;i+=3) arr.push(pts.slice(i,i+3)); arr.sort((a,b)=>b[0]-a[0]);
  const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.Float32BufferAttribute(arr.flat(),3)); pg.setDrawRange(0,0);
  const cloud=new THREE.Points(pg,new THREE.PointsMaterial({color:0xa5f3fc,size:.045,transparent:true,opacity:.9})); cloud.material.userData.base=.9; sv.add(cloud); G.cloud=cloud; G.cloudN=arr.length;
  // dimension lines
  const dim=(a,b,col=0xf472b6)=>{ const g=new THREE.BufferGeometry().setFromPoints([V(...a),V(...b)]); const l=new THREE.Line(g,new THREE.LineDashedMaterial({color:col,dashSize:.12,gapSize:.07,transparent:true,opacity:1})); l.material.userData.base=1; l.computeLineDistances(); sv.add(l); };
  dim([-3,.02,2.3],[3,.02,2.3]); dim([3.2,.02,-2.1],[3.2,.02,2.1]); dim([3.2,0,2.3],[3.2,2.7,2.3]);
  label('<b>6.00 m</b> length',V(0,.1,2.35),'survey','#f472b6');
  label('<b>4.20 m</b> width',V(3.25,.1,0),'survey','#f472b6');
  label('<b>2.70 m</b> to ceiling, 450 mm void',V(3.25,2.75,2.35),'survey','#f472b6');
  label('Reverb <b>1.1 s</b>',V(.4,1.9,-.6),'survey','#fb7185');
  label('Faces <b>180 lux</b>',V(2.2,1.25,-1.0),'survey','#fb7185');
  label('Window glare <b>backlit seats</b>',V(1.2,2.2,2.05),'survey','#fb7185');
  label('Noise <b>44 dBA</b> (HVAC)',V(-1.4,2.6,1.2),'survey','#fb7185');
  label('Data <b>2 × Cat5e</b>',V(-2.9,.35,-1.0),'survey','#fbbf24');

  /* ---------------- new table ---------------- */
  const nt=grp('newtable',0);
  const sh=new THREE.Shape(); sh.moveTo(-1.5,-.42); sh.lineTo(2.3,-.72); sh.quadraticCurveTo(2.55,0,2.3,.72); sh.lineTo(-1.5,.42); sh.quadraticCurveTo(-1.62,0,-1.5,-.42);
  const tg=new THREE.ExtrudeGeometry(sh,{depth:.05,bevelEnabled:true,bevelThickness:.01,bevelSize:.01,bevelSegments:2}); tg.rotateX(-Math.PI/2);
  const tbl=new THREE.Mesh(tg,mat(0xe8e2d6,{rough:.35})); tbl.position.y=.72; edge(tbl,0x22d3ee,.5); nt.add(tbl);
  nt.add(at(box(.5,.7,.4,0x2e2a4a),-.6,.36,0)); nt.add(at(box(.6,.7,.5,0x2e2a4a),1.5,.36,0));
  const tb=box(.22,.04,.14,0x111122,{em:0x22d3ee,ei:.35}); at(tb,.4,.79,0); nt.add(tb);
  const console_=box(.24,.04,.16,0x0f0f1f,{em:0x6d28d9,ei:.6}); at(console_,-1.1,.8,0); console_.rotation.z=.25; nt.add(console_);
  const fbox=box(.3,.02,.3,0x444466,{em:0xf472b6,ei:.4}); at(fbox,.4,.01,0); nt.add(fbox);

  /* ---------------- AV ---------------- */
  const av=grp('av',0);
  SCREENS.L=screen('gallery'); SCREENS.R=screen('content');
  [[-.88,'L'],[.88,'R']].forEach(([z,k])=>{
    const d=box(.06,.95,1.68,0x0a0a12,{metal:.5,rough:.3}); at(d,-2.95,1.62,z); edge(d,0x22d3ee,.5); av.add(d);
    const face=new THREE.Mesh(new THREE.PlaneGeometry(1.64,.92),new THREE.MeshBasicMaterial({map:SCREENS[k].tex,transparent:true})); face.material.userData.base=1; face.position.set(-2.915,1.62,z); face.rotation.y=Math.PI/2; av.add(face);
  });
  const bar=box(.08,.08,.9,0x1a1a22,{metal:.4}); at(bar,-2.9,1.08,0); edge(bar,0xf472b6,.6); av.add(bar);
  const lens=new THREE.Mesh(new THREE.CircleGeometry(.025,16),basic(0x22d3ee,1,true)); lens.position.set(-2.855,1.08,0); lens.rotation.y=Math.PI/2; av.add(lens);
  av.add(at(box(.18,.04,.25,0x222233),-2.93,1.3,-.15));
  const mic=box(.6,.03,.6,0xe5e7eb); at(mic,.3,2.68,0); av.add(mic);
  const ring=new THREE.Mesh(new THREE.RingGeometry(.2,.24,32),basic(0x22d3ee,.9,true)); ring.rotation.x=Math.PI/2; ring.position.set(.3,2.66,0); av.add(ring); G.micRing=ring;

  /* ---------------- acoustics ---------------- */
  const acg=grp('acoustic',0);
  const felt=()=>mat(0x5b3fa0,{rough:1,em:0x2a1060,ei:.3});
  [-1.8,-.6,.6,1.8].forEach(x=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(1.0,1.2,.05),felt()); p.position.set(x,1.55,-2.07); edge(p,0xa855f7,.5); acg.add(p); });
  [.2,1.4].forEach(z=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(.05,1.2,1.0),felt()); p.position.set(2.97,1.55,z); edge(p,0xa855f7,.5); acg.add(p); });

  /* ---------------- lighting ---------------- */
  const lg=grp('lighting',0);
  [-1.2,.3,1.8].forEach(x=>[-.8,.8].forEach(z=>{ const p=new THREE.Mesh(new THREE.PlaneGeometry(.6,.6),mat(0xfff7e8,{em:0xfff1dc,ei:1})); p.rotation.x=Math.PI/2; at(p,x,2.68,z); lg.add(p); }));
  const blind=box(4,1.5,.03,0x2a2a4a,{rough:.9,op:.92}); at(blind,.5,1.65,2.05); blind.scale.y=.02; blind.position.y=2.4; blind.userData.nopop=true; lg.add(blind); G.blind=blind;
  lg.add(at(box(4.1,.08,.08,0x555577),.5,2.44,2.04));

  /* ---------------- design overlays ---------------- */
  const ds=grp('sight',0);
  const sl=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(2.4,1.2,0),V(-2.9,1.62,0)]),new THREE.LineDashedMaterial({color:0xfbbf24,dashSize:.14,gapSize:.08,transparent:true})); sl.computeLineDistances(); sl.material.userData.base=1; ds.add(sl);
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.06,12,12),basic(0xfbbf24,1,true)); eye.position.set(2.4,1.2,0); ds.add(eye);
  const hline=new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(-2.88,1.145,-1.85),V(-2.88,2.095,-1.85)]),new THREE.LineBasicMaterial({color:0xfbbf24,transparent:true})); hline.material.userData.base=1; ds.add(hline);
  // camera frustum
  const o=V(-2.85,1.08,0), fr=[V(2.8,2.3,-2.05),V(2.8,2.3,2.05),V(2.8,.2,2.05),V(2.8,.2,-2.05)];
  const fg=new THREE.BufferGeometry(); const fp=[]; for(let i=0;i<4;i++){ const a=fr[i], b=fr[(i+1)%4]; fp.push(o.x,o.y,o.z,a.x,a.y,a.z,b.x,b.y,b.z); }
  fg.setAttribute('position',new THREE.Float32BufferAttribute(fp,3)); fg.computeVertexNormals();
  const fm=new THREE.Mesh(fg,basic(0x22d3ee,.07,true)); ds.add(fm); G.frustum=fm;
  const fe=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(fr.flatMap(p=>[o,p])),new THREE.LineBasicMaterial({color:0x22d3ee,transparent:true,opacity:.7})); fe.material.userData.base=.7; ds.add(fe);
  // mic lobes
  const mo=V(.3,2.66,0);
  seats.forEach(([x,s])=>{ const tgt=V(x,1.15,s*.95); const dir=tgt.clone().sub(mo); const len=dir.length();
    const cone=new THREE.Mesh(new THREE.ConeGeometry(.2,len,16,1,true),basic(0xf472b6,.07,true)); cone.position.copy(mo.clone().add(tgt).multiplyScalar(.5));
    cone.quaternion.setFromUnitVectors(V(0,-1,0),dir.clone().normalize()); ds.add(cone); });
  label('Farthest viewer <b>5.4 m</b>',V(1.2,1.5,0),'sight','#fbbf24');
  label('Image height <b>0.93 m</b>',V(-2.88,2.25,-1.85),'sight','#fbbf24');
  label('Camera lens <b>1.08 m</b>, all seats framed',V(-2.8,.8,0),'sight','#22d3ee');
  label('Ceiling mic array <b>10 zones</b>',V(.3,2.95,0),'sight','#f472b6');

  /* ---------------- containment + cables ---------------- */
  grp('containment',0); grp('cables',0); grp('revb',0);
  const tray=new THREE.Group();
  const trayM=box(6.2,.06,.3,0x94a3b8,{metal:.7,rough:.3,op:.9}); trayM.position.set(0,0,0); edge(trayM,0xe2e8f0,.9); tray.add(trayM);
  for(let i=-3;i<=3;i+=.25){ tray.add(at(box(.015,.08,.3,0xcbd5e1,{metal:.8}),i,.02,0)); }
  tray.position.set(.1,2.95,-1.82); G.containment.add(tray);
  const dado=box(.05,.12,3.6,0x78716c,{op:.9}); at(dado,-2.94,.35,-.3); edge(dado,0xfbbf24,.6); G.containment.add(dado);
  const CY=0x22d3ee, PK=0xf472b6, AM=0xfbbf24, yT=2.95;
  route([[3.3,yT,-1.9],[-2.86,yT,-1.9],[-2.86,yT,-.88],[-2.9,yT,-.88],[-2.9,2.12,-.88]],CY);
  route([[3.3,yT,-1.86],[-2.82,yT,-1.86],[-2.82,yT,.88],[-2.9,yT,.88],[-2.9,2.12,.88]],CY);
  route([[3.3,yT,-1.82],[-2.78,yT,-1.82],[-2.78,yT,.02],[-2.92,yT,.02],[-2.92,1.14,.02]],CY);
  route([[3.3,yT,-1.78],[.3,yT,-1.78],[.3,yT,0],[.3,2.7,0]],CY);
  route([[3.3,yT,-1.74],[2.95,yT,-1.74],[2.95,.06,-1.74],[2.95,-.06,-1.74],[.45,-.06,-1.74],[.45,-.06,0],[.45,.02,0]],CY);
  route([[.35,.02,0],[.35,-.08,0],[-2.9,-.08,.15],[-2.9,1.3,.15]],PK,.02);
  route([[.4,.02,0],[.4,.77,0]],PK,.02);
  route([[-2.95,.35,-2.1],[-2.95,.35,.9],[-2.95,1.35,.9]],AM,.019);
  route([[-2.95,.35,-1.6],[-2.95,.35,-1.2],[-2.95,1.35,-1.2]],AM,.019);
  route([[-2.95,.3,-.3],[-2.95,-.12,-.3],[.3,-.12,-.3],[.3,.02,-.1]],AM,.019);
  G.revCable=route([[3.3,yT,-1.7],[2.97,yT,-1.7],[2.97,yT,-.7],[2.97,1.45,-.7]],CY,.017,'revb');
  label('<b>Cat6A U/FTP</b> LSZH, PoE',V(-.8,3.05,-1.85),'cables','#22d3ee');
  label('Cable basket in <b>ceiling void</b>',V(2.2,3.15,-1.82),'containment','#e2e8f0');
  label('To comms room <b>38 m</b> (≤ 90 m)',V(3.35,3.05,-1.8),'cables','#22d3ee');
  label('<b>HDMI / USB-C</b> table to display',V(-1.3,.12,.15),'cables','#f472b6');
  label('<b>Mains</b>, segregated from data',V(-2.95,.55,-1.9),'cables','#fbbf24');
  label('Floor box',V(.4,.25,0),'cables','#f472b6');

  /* ---------------- Rev B additions ---------------- */
  const panel=box(.03,.16,.24,0x0f0f1f,{em:0x4ade80,ei:.8}); at(panel,2.95,1.45,-.7); edge(panel,0x4ade80,.8); G.revb.add(panel);
  const puck=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.03,20),mat(0x111122,{em:0xfbbf24,ei:.6})); puck.position.set(.9,.79,.2); G.revb.add(puck);
  label('<b>Rev B</b> booking panel',V(2.95,1.7,-.7),'revb','#fbbf24');

  /* input */
  let drag=null;
  cv.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY}; cv.setPointerCapture(e.pointerId); camTween=null; lastDrag=performance.now(); });
  cv.addEventListener('pointermove',e=>{ if(!drag) return; cam.th-=(e.clientX-drag.x)*.006; cam.ph=Math.min(1.5,Math.max(.22,cam.ph-(e.clientY-drag.y)*.005)); drag={x:e.clientX,y:e.clientY}; lastDrag=performance.now(); });
  cv.addEventListener('pointerup',()=>{ drag=null; });
  cv.addEventListener('wheel',e=>{ e.preventDefault(); cam.r=Math.min(20,Math.max(4.5,cam.r*(1+e.deltaY*.001))); lastDrag=performance.now(); },{passive:false});
  new ResizeObserver(()=>{ const w=cv.clientWidth,h=cv.clientHeight; if(!w||!h) return; R.setSize(w,h,false); C.aspect=w/h; C.updateProjectionMatrix(); }).observe(cv);

  requestAnimationFrame(loop);
}

/* ---- tweens ---- */
function tween(dur,fn,done){ TW.push({t0:performance.now(),dur:RM?1:dur,fn,done}); }
function fade(name,to,dur=900){ const g=G[name]; if(!g) return; g.userData.goal=to; const from=g.userData.a; tween(dur,k=>{ g.userData.a=from+(to-from)*ease(k); }); }
function popIn(name,stagger=70){ const g=G[name]; if(!g) return; g.userData.a=1; g.userData.goal=1;
  g.children.forEach((c,i)=>{ if(c.userData.nopop) return; const s=c.userData.s0||(c.userData.s0=c.scale.clone()); c.scale.setScalar(.001); setTimeout(()=>{ tween(600,k=>c.scale.set(s.x*Math.max(.001,easeBack(k)),s.y*Math.max(.001,easeBack(k)),s.z*Math.max(.001,easeBack(k)))); if(i%3===0) sfx.pop(); }, i*stagger); }); }
const PRESET={
  hero:{t:[0,1,0],r:12,th:1.05,ph:1.0}, front:{t:[-1.6,1.3,0],r:8.6,th:1.38,ph:1.12}, top:{t:[0,1.2,0],r:12,th:1.2,ph:.5},
  side:{t:[0,1.2,0],r:10.5,th:.22,ph:1.12}, back:{t:[0,1.3,0],r:9.5,th:1.57,ph:1.2}, ceiling:{t:[0,2.2,-.4],r:11,th:.75,ph:.62},
  window:{t:[.4,1.3,0],r:10,th:2.7,ph:1.1}, low:{t:[0,.6,0],r:10,th:.9,ph:.78}, table:{t:[-.6,1.1,0],r:9,th:1.2,ph:1.0},
};
function camTo(k,dur=1900){ const p=PRESET[k]; if(!p||!HAS3D) return; const s={x:cam.tgt.x,y:cam.tgt.y,z:cam.tgt.z,r:cam.r,th:cam.th,ph:cam.ph};
  let dth=p.th-s.th; dth=((dth+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;
  camTween={t0:performance.now(),dur:RM?1:dur,s,e:{x:p.t[0],y:p.t[1],z:p.t[2],r:p.r,th:s.th+dth,ph:p.ph}}; }

let scanOn=false, scanT=0;
function loop(now){
  requestAnimationFrame(loop);
  if(!ROOM_ON) return;
  // tweens
  for(let i=TW.length-1;i>=0;i--){ const w=TW[i]; const k=Math.min(1,(now-w.t0)/w.dur); w.fn(k); if(k>=1){ TW.splice(i,1); w.done&&w.done(); } }
  // camera
  if(camTween){ const k=Math.min(1,(now-camTween.t0)/camTween.dur), e=ease(k), a=camTween.s, b=camTween.e;
    cam.tgt.set(a.x+(b.x-a.x)*e,a.y+(b.y-a.y)*e,a.z+(b.z-a.z)*e); cam.r=a.r+(b.r-a.r)*e; cam.th=a.th+(b.th-a.th)*e; cam.ph=a.ph+(b.ph-a.ph)*e; if(k>=1) camTween=null; }
  else if(!RM && now-lastDrag>5000){ cam.th+=autoSpin?.0022:.00035; }
  const rr=cam.r*(C.aspect<1?1.55:C.aspect<1.3?1.2:1);
  C.position.set(cam.tgt.x+rr*Math.sin(cam.ph)*Math.sin(cam.th), cam.tgt.y+rr*Math.cos(cam.ph), cam.tgt.z+rr*Math.sin(cam.ph)*Math.cos(cam.th)); C.lookAt(cam.tgt);
  // group opacity
  for(const k in G){ const g=G[k]; if(!(g instanceof THREE.Group)) continue; const a=g.userData.a;
    g.visible=a>.005; if(!g.visible) continue;
    g.traverse(o=>{ if(o.material&&o.material.userData.base!==undefined){ o.material.opacity=o.material.userData.base*a*(o.material.userData.mul??1); } }); }
  // walls x-ray
  WALLS.forEach(w=>{ const m=w.material.userData.mul??1; w.material.userData.mul = m + ((xray?.18:1)-m)*.08; });
  FLOORMAT.userData.mul=(FLOORMAT.userData.mul??1)+(((xray?.35:1))-(FLOORMAT.userData.mul??1))*.08;
  // pulses
  PULSES.forEach(p=>{ p.t=(p.t+p.sp*.016)%1; p.m.position.copy(p.path.getPointAt(p.t)); });
  // scan
  if(scanOn){ scanT+=.006; const x=3-((scanT%1)*6.2); G.scanP.position.x=x; const n=Math.min(G.cloudN, Math.floor(G.cloudN*Math.min(1,scanT/1.0))); G.cloud.geometry.setDrawRange(0,n); }
  if(G.micRing) G.micRing.material.userData.mul=.6+.4*Math.sin(now/300);
  R.render(SC,C);
  // labels
  const w=R.domElement.clientWidth, h=R.domElement.clientHeight;
  LBL.forEach(L=>{ const g=G[L.group]; const on=L.on && g && g.userData.a>.5; if(!on){ if(L.el.classList.contains('on')) L.el.classList.remove('on'); return; }
    const v=L.pos.clone().project(C); if(v.z>1){ L.el.classList.remove('on'); return; }
    L.el.style.transform=`translate(${((v.x+1)/2*w).toFixed(1)}px,${((1-v.y)/2*h).toFixed(1)}px) translate(-50%,calc(-100% - 10px))`; L.el.classList.add('on'); });
}
function labelsFor(groups){ LBL.forEach(L=>L.on=groups.includes(L.group)); }

/* ================================================================ STATES */
let floorCarpet=false;
function floor(carpet){ if(!HAS3D||carpet===floorCarpet) return; floorCarpet=carpet; const a=new THREE.Color(FLOORMAT.color.getHex()), b=new THREE.Color(carpet?0x2c2450:0x3b4152), r0=FLOORMAT.roughness, r1=carpet?1:.22;
  tween(900,k=>{ FLOORMAT.color.copy(a).lerp(b,k); FLOORMAT.roughness=r0+(r1-r0)*k; FLOORMAT.metalness=carpet?.0:.25; }); }
function lightsWarm(on){ if(!HAS3D) return; const a=G.warm.intensity, b=on?1.3:0, s0=G.sun.intensity, s1=on?0:.9; tween(900,k=>{ G.warm.intensity=a+(b-a)*k; G.sun.intensity=s0+(s1-s0)*k; });
  const bl=G.blind, y0=bl.scale.y, y1=on?.72:.02; tween(1200,k=>{ bl.scale.y=y0+(y1-y0)*ease(k); bl.position.y=2.4-(1.5*bl.scale.y)/2; }); }
function screens(k){ if(!HAS3D) return; if(k==='bars'){ SCREENS.L.draw('bars'); SCREENS.R.draw('bars'); } else if(k==='join'){ SCREENS.L.draw('join'); SCREENS.R.draw('content'); } else { SCREENS.L.draw('gallery'); SCREENS.R.draw('content'); } }
let revB=false;
const STATE={
  legacy(){ ['survey','newtable','av','acoustic','lighting','sight','containment','cables','revb'].forEach(g=>fade(g,0)); fade('legacy',1); floor(false); lightsWarm(false); labelsFor([]); scanOn=false; },
  survey(){ fade('legacy',1); fade('survey',1); ['newtable','av','acoustic','lighting','sight','containment','cables','revb'].forEach(g=>fade(g,0)); floor(false); lightsWarm(false); scanT=0; scanOn=true; sfx.scan(); labelsFor(['survey']); },
  design(){ scanOn=false; fade('survey',0); fade('legacy',.12); ['newtable','av','acoustic','lighting'].forEach(g=>fade(g,.5)); fade('sight',1); fade('containment',0); fade('cables',0); fade('revb',revB?.5:0); floor(false); lightsWarm(false); labelsFor(['sight']); screens('gallery'); },
  cabling(){ scanOn=false; fade('survey',0); fade('legacy',0); ['newtable','av','acoustic','lighting'].forEach(g=>fade(g,.22)); fade('sight',0); fade('containment',1); fade('cables',1); fade('revb',revB?1:0); floor(false); lightsWarm(false); labelsFor(['cables','containment']); },
  proposal(){ scanOn=false; fade('survey',0); fade('legacy',0); ['newtable','av','acoustic','lighting'].forEach(g=>fade(g,.6)); fade('sight',.35); fade('containment',.35); fade('cables',.35); fade('revb',revB?.8:0); floor(true); lightsWarm(true); labelsFor(revB?['revb']:[]); },
  bom(){ STATE.proposal(); labelsFor([]); },
  install1(){ scanOn=false; ['survey','sight','av','acoustic','lighting','newtable','legacy'].forEach(g=>fade(g,0,600)); floor(false); lightsWarm(false); setTimeout(()=>{ popIn('containment',40); popIn('cables',25); if(revB) popIn('revb'); },500); labelsFor(['containment']); },
  install2(){ fade('containment',.5); fade('cables',.5); popIn('newtable',90); setTimeout(()=>popIn('av',80),500); setTimeout(()=>popIn('acoustic',120),1200); setTimeout(()=>{ popIn('lighting',80); floor(true); lightsWarm(true); },1800); labelsFor([]); },
  install3(){ ['newtable','av','acoustic','lighting'].forEach(g=>fade(g,1)); fade('containment',.1,1400); fade('cables',.1,1400); fade('revb',revB?1:0); floor(true); lightsWarm(true); labelsFor([]); },
  test(){ ['newtable','av','acoustic','lighting'].forEach(g=>fade(g,1)); fade('cables',.9); fade('containment',.2); fade('sight',.45); fade('legacy',0); fade('survey',0); fade('revb',revB?1:0); floor(true); lightsWarm(true); screens('bars'); labelsFor([]); certify(); },
  live(){ ['newtable','av','acoustic','lighting'].forEach(g=>fade(g,1)); ['cables','containment','sight','legacy','survey'].forEach(g=>fade(g,0)); fade('revb',revB?1:0); floor(true); lightsWarm(true); screens('join'); labelsFor(revB?['revb']:[]); },
  final(){ STATE.live(); screens('gallery'); },
};
function certify(){ if(!HAS3D) return; CAB.forEach((c,i)=>{ setTimeout(()=>{ const m=c.mesh.material; m.emissive.setHex(0x4ade80); m.color.setHex(0x4ade80); sfx.tick(); setTimeout(()=>{ m.emissive.setHex(c.color); m.color.setHex(c.color); },1400); }, 300+i*260); }); }


window.Room = {
  ready:false,
  init(){ if(this.ready||!HAS3D) return this.ready; try{ build3D(); this.ready=true; }catch(e){ console.error(e); } return this.ready; },
  on(v){ ROOM_ON=v; },
  state(k){ if(this.ready && STATE[k]) STATE[k](); },
  cam(k){ if(this.ready) camTo(k); },
  spin(v){ autoSpin=v; },
  xray(v){ if(this.ready) setXray(v); },
  snapshot(){ if(!this.ready) return ''; R.render(SC,C); return R.domElement.toDataURL('image/jpeg',.88); },
};
function setXray(v){ xray=v; }
