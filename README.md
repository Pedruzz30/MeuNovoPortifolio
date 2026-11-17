# Portfólio — Pedro Pimenta

Site estático de portfólio, organizado por responsabilidade para facilitar manutenção e revisões visuais.

## Estrutura

```text
.
├── index.html                  # Conteúdo e estrutura semântica da página
├── assets/
│   ├── README.md               # Catálogo dos arquivos visuais
│   └── images/                 # Imagens usadas pelo site
├── css/
│   ├── main.css                # Tokens, reset, navegação e hero
│   ├── selected-work.css       # Projetos selecionados e GitHub
│   └── portfolio-sections.css  # Sobre, stacks, notas e contato
├── js/
│   ├── hero-effects.js         # Interações do hero
│   ├── selected-work.js        # Interações e previews dos projetos
│   └── portfolio-sections.js   # Reveals, acordeão e menu mobile
└── tests/visual/
    ├── capture.mjs             # Utilitário de captura via Chrome DevTools
    ├── smoke-test.mjs          # Verificação de recursos e erros no navegador
    └── snapshots/              # Imagens de referência de QA
```

## Como revisar localmente

O projeto não possui etapa de build. Abra-o com um servidor estático para que todos os recursos sejam carregados com o mesmo comportamento de produção.

No VS Code, a configuração do Live Server usa a porta `5501`. Depois de iniciar o servidor, acesse `http://127.0.0.1:5501/`.

## Convenções de manutenção

- Preserve a ordem dos CSS declarada em `index.html`: estilos gerais primeiro, estilos de seções depois.
- Mantenha seletores, scripts e marcação da mesma seção nos arquivos correspondentes.
- Coloque novas imagens em `assets/images/` e registre o propósito delas em `assets/README.md`.
- Coloque artefatos de teste visual em `tests/visual/snapshots/`, não na raiz.
- Ao criar uma nova seção, use um `id` único, um título associado com `aria-labelledby` e comentários de separação coerentes com os existentes.
- Respeite `prefers-reduced-motion` em qualquer nova animação.

## Versão de produção (GitHub Pages)

O código-fonte continua funcionando como site estático via Live Server,
sem instalar dependências. O deploy usa uma etapa de otimização independente.

```bash
python -m pip install Pillow==11.3.0
python scripts/build.py
python scripts/check_build.py
python -m http.server 5501 --directory dist
```

- `scripts/build.py` cria `dist/`, converte os PNG do projeto para WebP
  (qualidade 88), ajusta referências do HTML/CSS e gera `robots.txt`,
  `sitemap.xml` e `.nojekyll`.
- As imagens PNG de origem são preservadas no repositório e continuam
  disponíveis para desenvolvimento sem build; **não edite `dist/`**.
- `.github/workflows/portfolio.yml` valida HTML, scripts, responsividade
  e interações com um Chrome real no GitHub Actions.
- Push na `main` publica a pasta `dist/` pelo GitHub Pages **apenas se
  os testes passarem**. Em `Settings > Pages > Build and deployment`,
  selecione **Source: GitHub Actions**. Se o repositório estiver configurado
  para publicação a partir de branch, será necessário mudar essa opção.
- URL planejada:
  https://pedruzz30.github.io/MeuNovoPortifolio/

## Teste no navegador

Na integração contínua, os scripts executam com servidor estático e Chrome
com depuração remota na porta `9222`:

```bash
node tests/visual/smoke-test.mjs http://127.0.0.1:5501/
node tests/visual/responsive-test.mjs http://127.0.0.1:5501/
```

O teste cobre tamanhos de 320, 360, 390, 768 e 1440 px, menu mobile,
movimento reduzido, estudos de caso e ausência de rolagem horizontal.
Uma aprovação automatizada não substitui revisão humana de tipografia,
composição e direitos das imagens de terceiros.

## Conteúdo dos cases

- **StockOS** é apresentado como sistema em desenvolvimento, sem alegar
  uso externo em produção.
- **Yunk Vino** é um estudo de design **não oficial**, sem afiliação
  ao artista. Verifique as licenças de imagens antes de publicá-las.
- A seção Contato encaminha à Space Underground e seu formulário.
