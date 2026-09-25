(function(global){
'use strict';
function createRenderer(canvas,labels){
const gl=canvas.getContext('webgl',{antialias:true,alpha:false,preserveDrawingBuffer:true});if(!gl)throw Error('A visualização 3D precisa de WebGL. Ative a aceleração gráfica do navegador.');
const vertex=`attribute vec3 pos;attribute vec3 normal;attribute vec3 tint;uniform vec4 camera;uniform vec2 origin;uniform vec2 viewport;varying vec3 color;varying vec3 world;void main(){float cy=cos(camera.x),sy=sin(camera.x),cp=cos(camera.y),sp=sin(camera.y);float u=pos.x*cy-pos.z*sy;float v=pos.x*sy+pos.z*cy;float x=origin.x+u*camera.z;float y=origin.y+(v*sp-pos.y*cp)*camera.z;gl_Position=vec4(x/viewport.x*2.0-1.0,1.0-y/viewport.y*2.0,-(v*cp+pos.y*sp)/3000.0,1.0);float light=length(normal)<0.5?1.0:0.76+0.24*max(0.0,dot(normal,normalize(vec3(-0.6,1.0,-0.4))));color=tint*light;world=pos;}`;
const fragment=`precision mediump float;varying vec3 color;varying vec3 world;uniform vec3 background;uniform float fade;uniform float opacity;void main(){float fog=fade*clamp((length(world.xz)-65.0)/160.0,0.0,1.0);gl_FragColor=vec4(mix(color,background,fog),opacity);}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);for(const [i,name]of ['pos','normal','tint'].entries()){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,i*12);}
const U={};for(const n of ['camera','origin','viewport','background','fade','opacity'])U[n]=gl.getUniformLocation(program,n);
const text=labels.getContext('2d');let project,latest,colors,W,H,vertices=[];
const rgb=hex=>hex.match(/[a-f0-9]{2}/gi).map(h=>parseInt(h,16)/255);
function quad(points,c,normal=[0,0,0]){for(const i of [0,1,2,0,2,3])vertices.push(...points[i],...normal,...c);}
function plane(x,z,w,d,y,c){quad([[x,y,z],[x+w,y,z],[x+w,y,z+d],[x,y,z+d]],c);}
function box(b,c){const{x,z,w,d,y,h}=b;quad([[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z]],c,[0,0,-1]);quad([[x+w,y,z],[x+w,y,z+d],[x+w,y+h,z+d],[x+w,y+h,z]],c,[1,0,0]);quad([[x+w,y,z+d],[x,y,z+d],[x,y+h,z+d],[x+w,y+h,z+d]],c,[0,0,1]);quad([[x,y,z+d],[x,y,z],[x,y+h,z],[x,y+h,z+d]],c,[-1,0,0]);quad([[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+d],[x,y+h,z+d]],c,[0,1,0]);}
function flush(fade){gl.uniform1f(U.opacity,1);gl.uniform1f(U.fade,fade);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);vertices=[];}
function draw(model){latest=model;const p=model.p,dark=p.theme==='dark';colors=dark?{bg:'191c20',grid:'24292f',road:'31373e',walk:'414850',lot:'37473c',tower:'a7b6c3',base:'929a9d',crown:'5a6771',slab:'c3cbd2',mark:'78838d',ink:'f5f6f7',sub:'acb4bd'}:{bg:'f5f5f7',grid:'e7e8ea',road:'d4d8de',walk:'e8e9e9',lot:'e5ebe1',tower:'b7c9d5',base:'e7e4dc',crown:'8a9aa6',slab:'f9fafb',mark:'fafbfc',ink:'20252a',sub:'64707b'};
W=canvas.clientWidth;H=canvas.clientHeight;if(W<=0||H<=0)return;const dpr=Math.min(devicePixelRatio||1,2);for(const c of [canvas,labels]){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);}text.setTransform(dpr,0,0,dpr,0,0);text.clearRect(0,0,W,H);
const yaw=p.yaw*Math.PI/180,pitch=p.pitch*Math.PI/180,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);const raw=(x,y,z)=>[x*cy-z*sy,(x*sy+z*cy)*sp-y*cp];
const padding=8,xlo=-p.w/2-(p.roads.left.enabled?p.roads.left.width:padding),xhi=p.w/2+(p.roads.right.enabled?p.roads.right.width:padding),zlo=-p.d/2-(p.roads.front.enabled?p.roads.front.width:padding),zhi=p.d/2+(p.roads.back.enabled?p.roads.back.width:padding);let pts=[];for(const x of [xlo,xhi])for(const z of [zlo,zhi])pts.push(raw(x,0,z));for(const b of [...model.boxes,...(p.viewMode!=='building'?model.envelope:[])])for(const x of [b.x,b.x+b.w])for(const z of [b.z,b.z+b.d])pts.push(raw(x,b.y+b.h,z));
if(p.viewMode!=='building'){pts.push(raw(-p.w/2,p.heightLimit,-p.d/2),raw(p.w/2,p.heightLimit,p.d/2));}
let minX=Math.min(...pts.map(p=>p[0])),maxX=Math.max(...pts.map(p=>p[0])),minY=Math.min(...pts.map(p=>p[1])),maxY=Math.max(...pts.map(p=>p[1]));let scale=Math.min((W-76)/(maxX-minX),(H-215)/Math.max(1,maxY-minY))*p.zoom/100,ox=W/2-(minX+maxX)/2*scale,oy=H/2-(minY+maxY)/2*scale+30;
project=([x,y,z])=>{const r=raw(x,y,z);return[ox+r[0]*scale,oy+r[1]*scale];};
gl.viewport(0,0,canvas.width,canvas.height);const bg=rgb(colors.bg);gl.clearColor(...bg,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.uniform4f(U.camera,yaw,pitch,scale,0);gl.uniform2f(U.origin,ox,oy);gl.uniform2f(U.viewport,W,H);gl.uniform3f(U.background,...bg);
plane(-1800,-1800,3600,3600,-.2,bg);
if(p.grid)for(let i=-400;i<=400;i+=5){plane(i,-400,.022,800,-.19,rgb(colors.grid));plane(-400,i,800,.022,-.19,rgb(colors.grid));}flush(1);
// Streets use total right-of-way width: two sidewalks plus a carriageway.
for(const [key,r]of Object.entries(p.roads)){if(!r.enabled)continue;const len=500,walk=r.walk,c=rgb(colors.road),sw=rgb(colors.walk),mark=rgb(colors.mark);if(key==='front'||key==='back'){const z=key==='front'?-p.d/2-r.width:p.d/2;plane(-len/2,z,len,r.width,-.12,c);plane(-len/2,z,len,walk,-.11,sw);plane(-len/2,z+r.width-walk,len,walk,-.11,sw);for(let x=-len/2;x<len/2;x+=6)plane(x,z+r.width/2,3,.10,-.1,mark);}else{const x=key==='left'?-p.w/2-r.width:p.w/2;plane(x,-len/2,r.width,len,-.12,c);plane(x,-len/2,walk,len,-.11,sw);plane(x+r.width-walk,-len/2,walk,len,-.11,sw);for(let z=-len/2;z<len/2;z+=6)plane(x+r.width/2,z,.10,3,-.1,mark);}}flush(1);
// Clear crossing sidewalks and lane markings inside each intersection.
for(const horizontal of ['front','back'])for(const vertical of ['left','right']){const hr=p.roads[horizontal],vr=p.roads[vertical];if(hr.enabled&&vr.enabled){plane(vertical==='left'?-p.w/2-vr.width:p.w/2,horizontal==='front'?-p.d/2-hr.width:p.d/2,vr.width,hr.width,-.09,rgb(colors.road));}}
plane(-p.w/2,-p.d/2,p.w,p.d,-.08,rgb(colors.lot));
// A soft contact shadow anchors the study on the infinite ground.
for(let j=8;j>=1;j--){const pad=j*.20;const base=model.boxes.filter(b=>b.y===0);for(const b of base){const bc=rgb(colors.lot),factor=1-(9-j)*.007;plane(b.x-pad,b.z-pad,b.w+pad*2,b.d+pad*2,-.07+(9-j)*.001,bc.map(v=>v*factor));}}
flush(0);
for(const b of (p.viewMode==='envelope'?[]:model.boxes)){box(b,rgb(b.type!=='crown'&&b.y+b.h>p.heightLimit+1e-8?'cd8b79':colors[b.type]));if(b.type!=='crown'){box({...b,y:b.y+b.h-.10,h:.10},rgb(colors.slab));plane(b.x,b.z,b.w,b.d,b.y+b.h+.001,rgb(b.type==='base'?(dark?'9da39f':'e1dfd8'):(dark?'b9c9d4':'dce7ef')));}}flush(0);
if(p.viewMode!=='building'){
 const c=rgb(dark?'76d8c7':'268b82');gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
 for(const b of model.envelope)box(b,c);gl.uniform1f(U.opacity,.075);gl.uniform1f(U.fade,0);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,vertices.length/9);vertices=[];
 gl.disable(gl.DEPTH_TEST);gl.uniform1f(U.opacity,.7);
 function wire(b){const{x,y,z,w,d,h}=b,ps=[[x,y,z],[x+w,y,z],[x+w,y,z+d],[x,y,z+d],[x,y+h,z],[x+w,y+h,z],[x+w,y+h,z+d],[x,y+h,z+d]];for(const [i,j] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])vertices.push(...ps[i],0,0,0,...c,...ps[j],0,0,0,...c);}
 for(const b of model.envelope)wire(b);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);gl.drawArrays(gl.LINES,0,vertices.length/9);vertices=[];
 gl.depthMask(true);gl.disable(gl.BLEND);gl.enable(gl.DEPTH_TEST);gl.uniform1f(U.opacity,1);
 // The adopted height ceiling is independent of the proposed building height.
 const a=project([-p.w/2,p.heightLimit,0]),b=project([p.w/2,p.heightLimit,0]);text.strokeStyle=dark?'#76d8c7':'#268b82';text.setLineDash([5,5]);text.beginPath();text.moveTo(...a);text.lineTo(...b);text.stroke();text.setLineDash([]);text.font='12px -apple-system, Segoe UI, sans-serif';text.fillStyle=dark?'#76d8c7':'#23756f';const title='Limite adotado: '+p.heightLimit+' m';text.fillText(title,Math.max(10,Math.min(W-text.measureText(title).width-10,b[0]+8)),Math.max(116,b[1]-8));
}
if(p.dimensions){const ink='#'+colors.ink,sub='#'+colors.sub;const rect=[[-p.w/2,0,-p.d/2],[p.w/2,0,-p.d/2],[p.w/2,0,p.d/2],[-p.w/2,0,p.d/2]];const anchor=rect.slice().sort((a,b)=>project(a)[0]-project(b)[0])[0];const axis=[anchor[0]+Math.sign(anchor[0])*4,0,anchor[2]+Math.sign(anchor[2])*4];
const used=[];function label(str,point,dx=0,dy=0){let [x,y]=project(point);x+=dx;y+=dy;text.font='12px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';let w=text.measureText(str).width+16;x=Math.max(5,Math.min(W-w-5,x));y=Math.max(42,Math.min(H-25,y));for(const r of used)if(x<r.x+r.w&&x+w>r.x&&Math.abs(y-r.y)<27)y=r.y+28;if(y>H-24)return;used.push({x,y,w});text.fillStyle='#'+colors.bg;text.globalAlpha=.94;text.beginPath();text.roundRect(x,y-12,w,24,7);text.fill();text.globalAlpha=1;text.fillStyle=ink;text.fillText(str,x+8,y+4);}
function line(a,b){a=project(a);b=project(b);text.strokeStyle=sub;text.lineWidth=.8;text.beginPath();text.moveTo(...a);text.lineTo(...b);text.stroke();}
if(p.pitch<85){line(axis,[axis[0],model.H,axis[2]]);label('H '+model.H.toLocaleString('pt-BR')+' m',[axis[0],model.H,axis[2]],-18,-12);if(model.H>18&&W>500)label('15 m',[axis[0],15,axis[2]],-20,0);}
label(p.w+' m · frente',[0,0,-p.d/2],-35,15);if(W>500)label(p.d+' m',[p.w/2,0,0],8,5);
for(const [key,r]of Object.entries(p.roads)){if(!r.enabled)continue;const point=key==='front'?[0,0,-p.d/2-r.width/2]:key==='back'?[0,0,p.d/2+r.width/2]:key==='left'?[-p.w/2-r.width/2,0,0]:[p.w/2+r.width/2,0,0];label('Via '+r.width.toLocaleString('pt-BR')+' m',point,0,20);}}
return {triangles:gl.getParameter(gl.CURRENT_PROGRAM)?true:false,error:gl.getError()};
}
return{draw,exportImage(){if(!latest)return;draw(latest);const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height+110;const t=c.getContext('2d');t.fillStyle='#'+colors.bg;t.fillRect(0,0,c.width,c.height);t.drawImage(canvas,0,0);t.drawImage(labels,0,0);t.fillStyle='#'+colors.ink;t.font='24px -apple-system, Segoe UI, sans-serif';t.fillText(`FORMA · ${latest.p.floors} pavimentos · H ${latest.H.toLocaleString('pt-BR')} m`,28,c.height-66);t.font='16px -apple-system, Segoe UI, sans-serif';t.fillText('Estudo volumétrico · índices da zona e larguras viárias a confirmar',28,c.height-30);return c.toDataURL('image/png');},get error(){return gl.getError();}};
}
global.createVolumetryRenderer=createRenderer;
})(window);
