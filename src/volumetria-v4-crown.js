(function(g){'use strict';
function install(V,G,PC){const norm=V.normalize,calc=V.calculate;
V.normalize=function(input){const p=norm(input);for(const[k,lo,hi,def]of [['crownWidth',1,40,8],['crownDepth',1,40,8],['crownX',-100,100,0],['crownZ',-100,100,0]])p[k]=Number.isFinite(input?.[k])?Math.round(Math.max(lo,Math.min(hi,input[k]))*10)/10:def;p.crownPlacement=input?.crownPlacement==='manual'?'manual':'auto';return p;};
const inside=(pt,poly)=>{function ring(r){let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>pt[1])!==(b[1]>pt[1])&&pt[0]<(b[0]-a[0])*(pt[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;}return ring(poly[0])&&!poly.slice(1).some(ring);};
V.calculate=function(input){const p=V.normalize(input),m=calc(p);m.p=p;m.boxes=m.boxes.filter(b=>b.type!=='crown');m.warnings=m.warnings.filter(x=>!x.startsWith('Coroamento não cabe'));m.crownResults=[];
if(p.crown>0&&m.valid){let allowed;if(p.lotMode==='polygon'){const top=m.H+p.crown;allowed=G.inset(m.lotRing,p.edges.map(e=>e.frontage?(e.aligned?(top>15+1e-8?5:0):5):top>15+1e-8?Math.max(3,m.H/10):1.5));}else{const top=m.H+p.crown,side=top>15?Math.max(3,m.H/10):1.5,s={};for(const k of ['front','back','left','right'])s[k]=(k==='front'||p.roads[k].frontage)?(p.roads[k].aligned?(top>15?5:0):5):side;allowed=G.rect({x:-p.w/2+s.left,z:-p.d/2+s.front,w:Math.max(0,p.w-s.left-s.right),d:Math.max(0,p.d-s.front-s.back)});}
for(const roof of m.boxes.filter(b=>b.floor===p.floors)){const polys=roof.polys||G.rect(roof),b=G.bounds(polys.flat(2)),w=p.crownWidth,d=p.crownDepth;
const target={x:b.x+(b.w-w)*(p.crownX+100)/200,z:b.z+(b.d-d)*(p.crownZ+100)/200},candidates=[target];
if(p.crownPlacement==='auto'&&b.w>=w&&b.d>=d){const rest=[];for(let i=0;i<=12;i++)for(let j=0;j<=12;j++)rest.push({x:b.x+(b.w-w)*i/12,z:b.z+(b.d-d)*j/12});rest.sort((a,b)=>(a.x-target.x)**2+(a.z-target.z)**2-((b.x-target.x)**2+(b.z-target.z)**2));candidates.push(...rest);}
let placed=null;if(b.w>=w&&b.d>=d&&allowed.length)for(const c of candidates){const shape=G.rect({...c,w,d});if(!shape[0][0].slice(0,4).every(q=>polys.some(poly=>inside(q,poly)||poly[0].some((v,i)=>G.distance(q,v,poly[0][(i+1)%poly[0].length])<1e-7))))continue;
try{if(G.area(PC.difference(shape,polys))>1e-6||G.area(PC.difference(shape,allowed))>1e-6)continue;}catch(e){continue;}placed={...c,w,d,y:m.H,h:p.crown,type:'crown',floor:0,t:roof.t,...(roof.polys?{polys:shape}:{})};break;}
const index=m.crownResults.length+1;m.crownResults.push({tower:index,ok:!!placed,x:placed?.x,z:placed?.z,width:w,depth:d});if(placed)m.boxes.push(placed);else m.warnings.push(`Coroamento ${index}: o bloco de ${w} × ${d} m não coube ${p.crownPlacement==='manual'?'na posição escolhida':'nas posições pesquisadas'}. Reduza as medidas ou reposicione; ele não foi desenhado nem recortado.`);
}}
const ok=m.crownResults.every(r=>r.ok);m.checks.push({id:'crown',ok,label:'Implantação do coroamento',detail:p.crown===0?'Sem coroamento neste estudo.':!m.valid?'Depende de uma proposta habitável válida.':ok?'Blocos inteiros, apoiados na cobertura e dentro dos recuos modelados.':'Há bloco técnico sem posição válida. Ajuste o coroamento.'});m.within=m.checks.every(c=>c.ok);return m;};
const priorFit=V.fit;V.fit=function(input){const result=priorFit(input),p=V.normalize(input);for(const k of ['crownWidth','crownDepth','crownX','crownZ','crownPlacement'])result.state[k]=p[k];return result;};
}
if(typeof module!=='undefined')module.exports={install};else install(g.Volumetry,g.LotGeometry,g.polygonClipping);
})(typeof window!=='undefined'?window:globalThis);
