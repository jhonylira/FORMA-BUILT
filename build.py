from pathlib import Path
import runpy,shutil
p=Path(__file__).parent
for v in [4,5,6]:runpy.run_path(str(p/'src'/f'build-v{v}.py'))
shutil.copyfile(p/'src'/'Simulador-volumetrico-v06.html',p/'index.html')
print('FORMA 06: index.html atualizado')
