# Validação da versão 06 — 25/09/2026

Executada em Windows com Microsoft Edge via Playwright 1.62.1. Esta é uma validação do comportamento implementado; não é homologação legal ou aprovação de projeto.

| Verificação | Resultado |
| --- | --- |
| 432 combinações de geometria, fachada, quantidade, profundidade e equilíbrio | 352 aceitas; 80 bloqueadas pelo gerador |
| Retângulo, trapézio, planta em L e orientação invertida | Sem sobreposição e sem setores externos nas propostas aceitas |
| Rotação e translação da planta | Áreas equivalentes, distribuição válida |
| Soma das áreas e área não distribuída | Conservada nas 352 propostas aceitas |
| Núcleo que não cabe, redução de quantidade e área-alvo | Bloqueio ou aviso conforme cenário |
| Prévia, sliders, aceitação e abertura do editor manual | Aprovado |
| Recarregar o estudo e os parâmetros salvos | Aprovado |
| Tela pequena, 390 × 844 | Modal cabe na largura disponível |
| Regressão de pavimentos e setores | 20 verificações e 36 cenários de divisão aprovados |
| Regressão de edição e cópia | 5 verificações aprovadas |
| Malha e magnetismo | 28 verificações aprovadas |
| JavaScript e renderizador nos fluxos testados | Sem erros observados |
| Reconstrução a partir dos fontes | HTML idêntico ao artefato validado |

Foi corrigida uma falha em que a confirmação de um campo numérico ao perder foco podia impedir o primeiro clique no botão de aplicar a distribuição.

Os testes não demonstram que toda geometria possível produzirá uma solução, nem que uma distribuição é uma planta habitacional executável. O algoritmo procura uma única faixa por fachada e pode recusar plantas que admitiriam outras soluções arquitetônicas. A revisão manual continua necessária.
