# Testes visuais

Os scripts desta pasta usam um Chrome aberto com depuração remota na porta `9222`.

- `smoke-test.mjs`: abre a URL informada e verifica erros locais de carregamento, exceções JavaScript e imagens quebradas.
- `capture.mjs`: gera uma captura da área de projetos/GitHub no tamanho informado.
- `snapshots/`: guarda imagens de referência produzidas durante as revisões.

Exemplos:

```powershell
node .\tests\visual\smoke-test.mjs http://127.0.0.1:5501/
node .\tests\visual\capture.mjs .\tests\visual\snapshots\qa-github-desktop.png 1440 900
```

Defina `CHROME_DEBUG_URL` caso o Chrome use outro endereço de depuração.
