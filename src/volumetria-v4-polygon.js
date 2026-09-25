(function(g){
'use strict';
const rawPC=typeof module!=='undefined'?require('./polygon-clipping-0.15.7.js'):g.polygonClipping;
// Quantize at 0.01 micrometre to remove accumulated coincident-edge roundoff.
const snap=x=>Array.isArray(x)?x.map(snap):Math.round(x*1e8)/1e8;
const PC=Object.fromEntries(['intersection','difference','union'].map(k=>[k,(...args)=>snap(rawPC[k](...args.map(snap)))]));
const signed=r=>r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;
const area=ps=>ps.reduce((s,p)=>s+Math.abs(signed(p[0]))-p.slice(1).reduce((a,r)=>a+Math.abs(signed(r)),0),0);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function validate(r){
 if(!Array.isArray(r)||r.length<3||r.length>30)return 'Use de 3 a 30 vértices.';
 if(r.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>!Number.isFinite(x)||Math.abs(x)>10000)))return 'Informe coordenadas finitas em metros, até 10.000 m.';
 const on=(a,b,p)=>Math.abs(cross(a,b,p))<1e-8&&p[0]>=Math.min(a[0],b[0])-1e-8&&p[0]<=Math.max(a[0],b[0])+1e-8&&p[1]>=Math.min(a[1],b[1])-1e-8&&p[1]<=Math.max(a[1],b[1])+1e-8;
 for(let i=0;i<r.length;i++){const a=r[i],b=r[(i+1)%r.length];if(Math.hypot(a[0]-b[0],a[1]-b[1])<.1)return 'Cada lado precisa medir pelo menos 10 cm.';
 for(let j=i+1;j<r.length;j++){if(j===i+1||(i===0&&j===r.length-1))continue;const c=r[j],d=r[(j+1)%r.length];if((cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))return 'Há lados cruzados ou encostados. Revise o contorno.';}}
 if(Math.abs(signed(r))<1)return 'A área do lote precisa ser maior que 1 m².';
 const b=bounds(r);if(b.w>500||b.d>500)return 'Nesta versão, use um lote de até 500 m em cada direção.';
 return '';
}
function bounds(r){const xs=r.map(p=>p[0]),zs=r.map(p=>p[1]),x=Math.min(...xs),z=Math.min(...zs);return{x,z,w:Math.max(...xs)-x,d:Math.max(...zs)-z};}
const rect=b=>[[[[b.x,b.z],[b.x+b.w,b.z],[b.x+b.w,b.z+b.d],[b.x,b.z+b.d],[b.x,b.z]]]];
function distance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
// Subtract finite-edge strips and conservative circumscribed endpoint buffers.
// This preserves concave/disconnected components rather than intersecting infinite half-planes.
function inset(r,distances){let out=[[r.concat([r[0]])]];const cutters=[];
 r.forEach((a,i)=>{const d=distances[i];if(d<=0)return;const b=r[(i+1)%r.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/len*d,nz=(b[0]-a[0])/len*d;
 cutters.push([[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz],[a[0]+nx,a[1]+nz]]]);
 for(const p of [a,b]){const R=d/Math.cos(Math.PI/32),ring=Array.from({length:32},(_,j)=>[p[0]+R*Math.cos(j*Math.PI/16),p[1]+R*Math.sin(j*Math.PI/16)]);ring.push(ring[0]);cutters.push([ring]);}});
 if(cutters.length)out=PC.difference(out,...cutters);return out;
}
function install(V){
 const oldNormalize=V.normalize,oldCalculate=V.calculate;
 V.normalize=function(input){const p=oldNormalize(input);p.lotMode=input?.lotMode==='polygon'?'polygon':'rectangle';p.vertices=Array.isArray(input?.vertices)?JSON.parse(JSON.stringify(input.vertices)):[];p.edges=p.vertices.map((_,i)=>{const e=input?.edges?.[i]||{};const min=Math.max(6,Math.min(60,+e.min||8)),max=Math.max(min,Math.min(60,+e.max||36));return{frontage:!!e.frontage,aligned:e.aligned!==false,min,max,width:Math.max(min,Math.min(max,+e.width||16))};});if(p.lotMode==='polygon'&&!validate(p.vertices)){const b=bounds(p.vertices);p.w=b.w;p.d=b.d;}return p;};
 V.calculate=function(input){const p=V.normalize(input);if(p.lotMode!=='polygon')return Object.assign(oldCalculate(p),{lotArea:p.w*p.d});
 const error=validate(p.vertices),m=oldCalculate(p);m.p=p;m.lotArea=error?0:Math.abs(signed(p.vertices));m.boxes=[];m.envelope=[];m.floorAreas=[];m.area=0;m.projection=0;m.volume=0;m.occupation=0;m.assessedTO=0;m.valid=!error;m.warnings=[];
 if(error){m.valid=false;m.warnings.push(error);}else{
 const b=bounds(p.vertices),cx=b.x+b.w/2,cz=b.z+b.d/2,r=p.vertices.map(q=>[q[0]-cx,q[1]-cz]);m.lotRing=r;
 const cache=new Map();function shape(top,isBase){const ds=p.edges.map(e=>e.frontage?(e.aligned?(top>15+1e-8?5:0):5):(top>15+1e-8?Math.max(3,m.H/10):isBase&&p.mode!=='open'?0:1.5));const key=ds.join(',');if(!cache.has(key))cache.set(key,inset(r,ds));return cache.get(key);}
 const cuts=[...new Set([0,m.baseHeight,15,Math.min(m.H,p.heightLimit)].filter(y=>y>=0&&y<=Math.min(m.H,p.heightLimit)))].sort((a,b)=>a-b);
 for(let i=1;i<cuts.length;i++){const polys=shape(cuts[i],cuts[i]<=m.baseHeight);if(area(polys)>1e-7)m.envelope.push({x:-p.w/2,z:-p.d/2,w:p.w,d:p.d,y:cuts[i-1],h:cuts[i]-cuts[i-1],type:'envelope',polys});}
 let below=[];let fragmented=false;
 for(let f=0;f<p.floors;f++){const base=f<m.baseFloors,allowed=shape(m.levels[f+1],base),bay=(p.w-m.gap*(p.n-1))/p.n;let floor=0,current=[];
 for(let t=0;t<(base?1:p.n);t++){const factor=Math.sqrt(p.baseCoverage/100),w=base?p.w*factor:bay*p.fill/100,d=base?p.d*factor:p.d*p.depth/100,x=base?-w/2:-p.w/2+t*(bay+m.gap)+(bay-w)/2; if(w<=0||d<=0){m.valid=false;continue;}
 let polys=allowed.length?PC.intersection(allowed,rect({x,z:-d/2,w,d})):[];
 if(f>0)polys=polys.length&&below.length?PC.intersection(polys,PC.union(...below)):[];
 const a=area(polys);if(a<.01){m.valid=false;continue;}if(polys.length>1)fragmented=true;floor+=a;current.push(polys);m.boxes.push({x,z:-d/2,w,d,y:m.levels[f],h:m.levels[f+1]-m.levels[f],type:base?'base':'tower',floor:f+1,t,polys});}
 m.floorAreas.push(floor);below=current;}
 if(p.crown>0&&m.valid){const allowed=shape(m.H+p.crown,false);for(const b of m.boxes.filter(b=>b.floor===p.floors)){const polys=allowed.length?PC.intersection(b.polys,allowed,rect({x:b.x+b.w*.18,z:b.z+b.d*.18,w:b.w*.64,d:b.d*.64})):[];if(area(polys)>.01)m.boxes.push({...b,polys,y:m.H,h:p.crown,type:'crown',floor:0});}}
 if(fragmented)m.warnings.push('Uma implantação foi dividida em partes pelo contorno. São fragmentos de estudo, não torres independentes validadas.');
 if(!p.edges.some(e=>e.frontage)){m.valid=false;m.warnings.push('Marque pelo menos um lado com rua no editor do lote.');}
 if(m.valid){m.area=m.floorAreas.reduce((a,b)=>a+b,0);m.projection=m.floorAreas[0]||0;m.volume=m.boxes.filter(b=>b.type!=='crown').reduce((s,b)=>s+area(b.polys)*b.h,0);m.occupation=100*m.projection/m.lotArea;const assessed=m.floorAreas.filter((_,i)=>!(m.exemption&&i<m.baseFloors));m.assessedTO=100*Math.max(0,...assessed)/m.lotArea;}else{m.boxes=[];m.warnings.push('A proposta não cabe por inteiro. Reduza torres, altura ou ajuste as proporções.');}
 m.fragmented=fragmented;m.upperPolys=shape(Math.max(m.H+p.crown,15.0001),false);
 }
 m.checks[0]={id:'geometry',ok:m.valid&&!m.fragmented,label:'Implantação e afastamentos',detail:m.valid?(m.fragmented?'Há fragmentos separados: reveja a implantação.':'Volumes contidos no contorno e nos afastamentos modelados.'):'Revise o lote e as dimensões da proposta.'};m.checks[2].ok=m.assessedTO<=m.limitTO+1e-7;m.checks[2].detail=`${m.assessedTO.toFixed(1)}% computados / ${m.limitTO}% de referência.`;m.within=m.checks.every(c=>c.ok);return m;
 };
 const oldFit=V.fit;V.fit=function(input){if(input.lotMode!=='polygon')return oldFit(input);let p=V.normalize(input);p.floors=Math.min(p.floors,V.calculate(p).maxFloors);for(let i=0;i<95;i++){const m=V.calculate(p);if(m.within)return{state:p,ok:true};if(!m.valid||m.fragmented)break;p.baseCoverage=Math.max(10,p.baseCoverage-1);p.fill=Math.max(30,p.fill-1);p.depth=Math.max(30,p.depth-1);}return{state:V.normalize(input),ok:false};};
}
const api={signed,area,bounds,rect,validate,inset,distance,install};if(typeof module!=='undefined')module.exports=api;else{g.LotGeometry=api;install(g.Volumetry);}
})(typeof window!=='undefined'?window:globalThis);
