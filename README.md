# TelepromptFlow 🎬

Um sistema de teleprompter web profissional, moderno, responsivo e inteligente, projetado para ajudar oradores, podcasters, YouTubers e narradores a lerem em um ritmo claro, fluido e bem articulado.

Desenvolvido inteiramente em **Vanilla HTML, CSS e JavaScript**, garantindo carregamento instantâneo, rolagem fluida de alta performance a 60 FPS e compatibilidade sem dependências externas.

---

## ✨ Funcionalidades Principais

- **📝 Importação Simplificada**: Cole seu texto diretamente na área de transferência ou simplesmente arraste e solte (`drag and drop`) arquivos nos formatos `.txt` ou `.md`.
- **🎙️ Rolagem Guiada por Voz (Speech-to-Scroll)**: Um recurso avançado baseado na *Web Speech API* que ouve a narração em tempo real e rola o texto de forma inteligente à medida que as palavras são pronunciadas.
- **🛡️ Rolagem de Segurança**: Se o orador parar de falar ou se desviar do roteiro, a rolagem inteligente entra automaticamente em um ritmo lento de segurança após 6 segundos.
- **🔄 Modo Espelhado (Flip Horizontal)**: Permite espelhar o texto de maneira rápida, ideal para uso em hardware de teleprompters físicos com espelhos refletores.
- **⚡ Motor de Rolagem Ultra Suave**: Construído com `requestAnimationFrame` para uma rolagem em pixels lisa a 60 frames por segundo, evitando travamentos visuais.
- **⚙️ Configuração Personalizada**:
  - Ajuste de velocidade baseado em WPM (Palavras por Minuto).
  - Tamanho da fonte e largura de exibição de texto dinâmica (Estreito, Médio, Largo).
  - Guia visual de leitura (linhas pontilhadas e setas indicadoras).
  - Atalhos de teclado para controle completo durante as gravações.
- **🎨 Design Premium**: Interface moderna com tema escuro imersivo, efeito *glassmorphism* nos controles flutuantes e animações fluidas de contagem regressiva.

---

## ⌨️ Atalhos de Teclado (Durante a Leitura)

| Tecla | Ação |
| :--- | :--- |
| <kbd>Espaço</kbd> | Iniciar / Pausar a rolagem |
| <kbd>⇅ Setas Cima / Baixo</kbd> | Aumentar / Diminuir velocidade da rolagem (WPM) |
| <kbd>⇄ Setas Esquerda / Direita</kbd> | Diminuir / Aumentar tamanho da fonte |
| <kbd>Esc</kbd> | Sair do modo teleprompter e voltar ao painel de edição |

---

## 🚀 Como Executar

Por ser uma aplicação baseada em tecnologias web puras, não é necessária nenhuma instalação ou compilação.

1. Clone o repositório ou baixe os arquivos.
2. Abra o arquivo `index.html` diretamente em seu navegador.
3. *Recomendado*: Use navegadores baseados em Chromium (como Google Chrome, Microsoft Edge ou Opera) para habilitar o suporte completo ao recurso de **Rolagem por Voz (Speech-to-Scroll)**.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5**: Estrutura semântica e acessível.
- **CSS3**: Layouts responsivos (Grid/Flexbox), variáveis CSS, transições e efeitos de glassmorphism.
- **JavaScript (ES6+)**: Controle de animação a 60 FPS, manipulador de arquivos nativo (`FileReader API`) e processamento de áudio/voz (`Web Speech API`).
