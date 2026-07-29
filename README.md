# Alvorada Jardins — Landing Page

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

## Antes de publicar — troque os placeholders

- [ ] Preços e metragens das plantas
- [ ] Número de WhatsApp (`href` do botão flutuante)
- [ ] CRECI, CNPJ e matrícula de incorporação (rodapé)
- [ ] Telefone e região no JSON-LD (`<script type="application/ld+json">`)
- [ ] Depoimentos (hoje são ilustrativos)
- [ ] Conectar o formulário a um CRM real (RD Station, HubSpot, etc.) — hoje ele só simula o envio
- [ ] Adicionar o container do GTM (`GTM-XXXXXXX`) para ativar o rastreamento

## Personalização

Cores, tipografia e espaçamentos ficam centralizados no bloco `:root` do CSS — mudar ali reflete na página inteira automaticamente.
