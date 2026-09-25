const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const G=require('../src/volumetria-v4-polygon.js'),F=require('../src/volumetria-v5-floors.js'),P=require('../src/volumetria-v6-layout.js');
const poly=points=>[[[...points,points[0]]]],rect=G.rect({x:0,z:0,w:40,d:30});
const shapes=[rect,poly([[0,0],[40,0],[32,30],[5,30]]),poly([[0,0],[40,0],[40,20],[20,20],[20,40],[0,40]]),poly([[0,0],[0,30],[40,30],[40,0]])];
assert.deepEqual(P.normalize(null),P.defaults);assert.equal(P.generate([],null).ok,false);
let cases=0,accepted=0;
for(const shape of shapes)for(let edge=0;edge<P.facades(shape).length;edge++)for(const count of [1,4,8,20])for(const depth of [5,12,25])for(const balance of ['area','front']){
 const r=P.generate(shape,{edge,count,depth,balance});cases++;assert.equal(typeof r.ok,'boolean');
 if(r.ok){accepted++;assert.ok(r.actual<=count);assert.equal(r.actual,r.units.length);assert.deepEqual(F.sectorAudit(shape,r.sectors).errors,[]);assert.ok(Math.abs(r.sectors.reduce((s,x)=>s+G.area(x.polys),0)+r.unassigned-G.area(shape))<.001);for(const u of r.units){assert.ok(u.front>=4-1e-5);assert.ok(u.area>=35-1e-5);assert.equal(u.polys.length,1);}}
 else assert.ok(r.errors.length);
}
assert.ok(accepted>100);assert.equal(P.generate(rect,{count:4}).actual,4);assert.equal(P.generate(rect,{depth:25,coreDepth:12}).ok,false);
assert.ok(P.generate(rect,{mode:'area',targetArea:70}).warnings.some(x=>x.includes('Área-alvo')));
assert.ok(P.generate(rect,{count:20}).warnings.some(x=>x.includes('reduziram')));
const rotated=rect.map(p=>p.map(r=>r.map(([x,y])=>[x*Math.cos(.71)-y*Math.sin(.71)+13,x*Math.sin(.71)+y*Math.cos(.71)-21])));
assert.ok(P.generate(rotated,{count:4}).ok);assert.deepEqual(P.generate(rect,{count:4}).units.map(u=>Math.round(u.area)),P.generate(rotated,{count:4}).units.map(u=>Math.round(u.area)));
(async()=>{const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const b=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})}),page=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);await page.waitForFunction(()=>window.forma?.renderer);
await page.evaluate(()=>forma.setState({...Volumetry.defaults,w:60,d:60,n:1,floors:8,crown:0,fill:100,depth:100,floorFocus:'6:0',floorEdits:{}}));
const before=await page.evaluate(()=>JSON.stringify(forma.getState().floorEdits));await page.locator('#generate-layout').click();await page.locator('#layout-editor').waitFor({state:'visible'});assert.ok(await page.locator('#layout-accept').isEnabled());
await page.locator('#layout-value-count').fill('6');await page.locator('#layout-value-count').dispatchEvent('change');await page.waitForFunction(()=>!document.querySelector('#layout-accept').disabled);assert.equal(await page.evaluate(()=>JSON.stringify(forma.getState().floorEdits)),before);
await page.screenshot({path:path.join(__dirname,'forma-v06-parametrico.png'),fullPage:true});await page.locator('#layout-accept').click();await page.locator('#floor-editor').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>forma.getModel().floorCatalog.find(f=>f.key==='6:0').sectors.filter(s=>s.use==='apartment').length),6);
await page.getByRole('button',{name:'Fechar pavimento sem aplicar'}).click();await page.reload();await page.waitForFunction(()=>window.forma?.renderer);assert.equal(await page.evaluate(()=>forma.getState().layoutParams['6:0'].count),6);await page.locator('#generate-layout').click();assert.equal(await page.locator('#layout-value-count').inputValue(),'6');await page.getByRole('button',{name:'Fechar distribuição sem substituir'}).click();
await page.setViewportSize({width:390,height:844});await page.locator('#generate-layout').click();assert.ok(await page.locator('#layout-accept').isEnabled());assert.ok(await page.evaluate(()=>document.querySelector('#layout-editor').getBoundingClientRect().width<=window.innerWidth));await page.screenshot({path:path.join(__dirname,'forma-v06-layout-mobile.png'),fullPage:true});assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>forma.renderer.error),0);await b.close();
fs.writeFileSync(path.join(__dirname,'validacao-volumetria-v06.json'),JSON.stringify({geometryCases:cases,acceptedCases:accepted,browserChecks:['preview independent','slider regenerates','accept and manual editor','persistent units and parameters','mobile modal fits','no JS or renderer errors'],errors},null,2));console.log(`PASS ${cases} geometric cases (${accepted} accepted) and browser workflow`);
})().catch(e=>{console.error(e);process.exit(1)});
