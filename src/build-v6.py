from pathlib import Path
p=Path(__file__).parent
def read(name):return (p/name).read_text(encoding='utf-8-sig')
h=read('Simulador-volumetrico-v05.html')
needle='<script>'+read('volumetria-v4-crown.js')+'</script>'
assert needle in h
h=h.replace(needle,needle+'<script>'+read('volumetria-v6-layout.js')+'</script>',1)
h=h.replace("key='forma.volumetria.v5'","key='forma.volumetria.v6'").replace("localStorage.getItem('forma.volumetria.v4')","localStorage.getItem('forma.volumetria.v5')||localStorage.getItem('forma.volumetria.v4')",1)
h=h.replace('forma.options.v5','forma.options.v6').replace("localStorage.getItem('forma.options.v4')","localStorage.getItem('forma.options.v5')||localStorage.getItem('forma.options.v4')",1)
h=h.replace("version:'05'","version:'06'").replace('Forma-v05-estudo.json','Forma-v06-estudo.json').replace('Forma 05','Forma 06').replace('FORMA 05','FORMA 06').replace('class="version">05','class="version">06')
h=h.replace('<button id="edit-floor">','<button id="generate-layout" class="primary">Distribuir apartamentos</button><button id="edit-floor">',1)
h=h.replace('</style>','''.layout-guide{font-size:12px;color:var(--sub);padding:4px 0 12px}.layout-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;background:var(--surface);padding:15px;border:1px solid var(--line);border-radius:12px}.layout-metrics small{display:block;font-size:11px;color:var(--sub)}.layout-metrics strong{font-size:21px;font-weight:500}#layout-alert{font-size:12px}#layout-plan [data-facade]{cursor:pointer}#layout-editor .editor-inspector{max-height:68vh}#layout-editor .field{margin-top:18px}#layout-editor .editor-bottom p{color:var(--sub)}#layout-editor .editor-plan{overflow:auto;max-height:68vh}@media(max-width:760px){#layout-editor .editor-inspector,#layout-editor .editor-plan{max-height:none}.layout-metrics strong{font-size:17px}.layout-metrics{padding:12px;gap:8px}}\n</style>''',1)
h=h.replace('</body>',read('volumetria-v6-layout.html')+'<script>'+read('volumetria-v6-layout-ui.js')+'</script></body>')
(p/'Simulador-volumetrico-v06.html').write_text(h,encoding='utf-8')
