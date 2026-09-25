# FORMA BUILT · versão 06

Simulador de lote, camisa volumétrica e potencial construtivo, com distribuição paramétrica de apartamentos por fachada. Interface em português; funciona localmente, sem conta e sem conexão.

## Abrir e experimentar

Baixe o repositório (Code → Download ZIP), extraia os arquivos e abra **index.html** em um navegador com WebGL. O HTML inclui as bibliotecas necessárias.

1. Informe as dimensões ou desenhe um lote poligonal; marque as divisas voltadas para ruas.
2. Ajuste altura, andares, implantação, recuos e índices do cenário. A camisa representa os afastamentos modelados; a proposta pode ocupar menos espaço.
3. Escolha um pavimento e clique em **Distribuir apartamentos**.
4. Selecione uma fachada na planta ou na lista. Escolha quantidade desejada ou área-alvo e ajuste os controles.
5. Ajuste profundidade, frente e área mínimas, largura da circulação, tamanho e posição do núcleo.
6. Clique em **Usar distribuição e editar**. Refine os setores manualmente ou copie para pavimentos compatíveis.

A prévia não altera o estudo até ser aceita. A distribuição substitui os setores do pavimento selecionado; **Desfazer** permite recuperar o estado anterior. As alternativas e o estudo podem ser exportados em JSON. Exporte antes de limpar os dados do navegador ou trocar de computador: o salvamento local não é sincronizado com o GitHub.

## O que a V6 faz

- Divide uma faixa de apartamentos voltada à fachada selecionada, equilibrando áreas ou frentes.
- Reserva circulação atrás da faixa e um núcleo vertical retangular conectado.
- Confere contenção no pavimento, sobreposições, área mínima, frente, contato com a circulação e continuidade da faixa de circulação.
- Reduz a quantidade quando necessário e informa o resultado; bloqueia a aplicação de propostas inviáveis geometricamente.
- Preserva áreas não distribuídas para estudo manual. Em plantas em L, estuda apenas a ala alcançada pela faixa escolhida.
- Mantém lotes irregulares, coroamento posicionável, edição de pavimentos, malha ajustável, indicadores de TO/IA e estimativas de unidades e VGV do simulador anterior.

## Escopo urbanístico

Estudo preliminar baseado nas regras modeladas a partir da Lei Municipal 8.343/2020 de Jaraguá do Sul e nos parâmetros informados pelo usuário. Não identifica automaticamente o zoneamento, a via ou os índices dos anexos. Confirme a legislação vigente e os parâmetros aplicáveis ao lote antes de decisões de projeto.

Na regra modelada acima de 15 m, o afastamento lateral/posterior considera a altura máxima H do edifício, com mínimo de 3 m e relação H/10. Não se trata de recuar cada andar progressivamente por sua própria altura. Condições de alinhamento, uso e paredes cegas devem ser conferidas no cenário. A largura da rua é uma dimensão de representação e não determina automaticamente os recuos.

As áreas dos apartamentos são áreas geométricas de setores, sem espessura de paredes; não correspondem a áreas privativas legais. Frente, profundidade, circulação, núcleo e contato de 0,80 m são hipóteses de projeto do gerador, **não mínimos legais comprovados**. Não dimensiona portas, escadas, elevadores, instalações, ventilação, acessibilidade, saídas de emergência ou estrutura. A fachada escolhida deve poder receber aberturas. O núcleo é uma reserva de espaço. VGV é uma estimativa bruta, não lucro nem avaliação de mercado.

## Recriar o HTML

Requer Python 3:

```sh
python build.py
```

Os fontes em `src/` mantêm a evolução dos motores V3 a V6. A montagem gera um único `index.html`; os arquivos intermediários são ignorados pelo Git.

## Testes

Requer Node.js e Python 3 para reconstrução. As dependências abaixo servem somente aos testes; o app não depende delas para abrir.

```sh
npm install
npx playwright install chromium
python build.py
npm test
```

Para testar com Edge instalado, defina `BROWSER_CHANNEL=msedge` no ambiente antes de executar os testes. Consulte [VALIDACAO.md](VALIDACAO.md) para resultados e limites da validação desta versão.

## Bibliotecas de terceiros

Inclui polygon-clipping 0.15.7 e earcut 2.2.4. Os avisos e licenças estão em `src/polygon-clipping-LICENSE.md`, `src/earcut-LICENSE.txt` e no HTML gerado.
