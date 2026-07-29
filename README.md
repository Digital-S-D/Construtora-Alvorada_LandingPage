Landing page da Construtora Alvorada

## O que é

Um único arquivo HTML (`construtora-alvorada-landing-page.html`), sem frameworks, sem build, sem dependências de pacote. CSS e JS estão embutidos no próprio arquivo. Basta abrir no navegador ou subir para qualquer hospedagem.

## Stack

HTML5 + CSS3 + JavaScript puro (vanilla). Única dependência externa: fontes do Google Fonts (Zilla Slab, Inter, IBM Plex Mono), com fallback automático se o carregamento falhar.

## Estrutura da página

Header fixo → Hero → Estatísticas → Diferenciais → Plantas → Tour Virtual → Localização → Comparação → Depoimentos → FAQ → Oferta final (formulário) → Rodapé, com WhatsApp flutuante e barra de CTA fixa no mobile.

## Como visualizar localmente

```bash
python3 -m http.server 8000
# ou
npx serve .
```

## Personalização

Cores, tipografia e espaçamentos ficam centralizados no bloco `:root` do CSS — mudar ali reflete na página inteira automaticamente.
