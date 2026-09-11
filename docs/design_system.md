# Design System

Este documento descreve as diretrizes visuais base da aplicação Aprova Fisco, estabelecidas para garantir elegância, consistência e alta usabilidade ao longo do desenvolvimento.

## 1. Tipografia
- **Família de Fonte Principal:** `Plus Jakarta Sans` (Google Fonts).
  - *Motivo:* É uma fonte geométrica humanista muito limpa, com excelente legibilidade para dados (números) e textos longos, conferindo um ar moderno e sério, ideal para o contexto de estudos.
- **Hierarquia:**
  - Títulos usam `font-bold` e `tracking-tight` para presença forte e concisa.
  - Textos de corpo e legendas usam tons de cinza mais suaves com `leading-relaxed` (maior espaçamento entre linhas) para não cansar a leitura.

## 2. Paleta de Cores
A paleta prioriza a neutralidade e o foco. Evita cores gritantes.

- **Base/Fundo:** `gray-50` (modo claro) e `gray-950` (modo escuro).
- **Superfícies (Cards/Inputs):** Brancas (`white`) no modo claro, `gray-900` no modo escuro.
- **Texto Primário:** `gray-900` e `white`.
- **Texto Secundário (Legendas/Apoio):** `gray-500` e `gray-400`.
- **Cor de Destaque (Primary Action):** Tons de `indigo` (especificamente `indigo-600` / `#4F46E5`).
  - *Motivo:* O índigo é uma cor que transmite foco, seriedade e confiabilidade, se adequando perfeitamente ao tema de aprovação e concurso público sem ser agressiva como um azul puro ou vermelho. 
  - Usada em botões principais, links ativos e ícones em destaque.

## 3. Espaçamento (Whitespace)
- Priorizamos respiro visual. Interfaces densas geram ansiedade cognitiva.
- Paddings internos de formulários e cards costumam usar `p-6`, `p-8` ou `p-10`.
- Margens e gaps usam escalas maiores para separar agrupamentos de informações (ex: `space-y-6`, `gap-8`).

## 4. Bordas e Sombras (Shape & Elevation)
- A estética foge do material design clássico pesado. Optamos por interfaces "flat" com sutis contornos:
- **Bordas (Radius):** 
  - `rounded-2xl` (16px) para blocos grandes e cards estruturais.
  - `rounded-lg` (8px) para componentes interativos internos (botões, inputs, abas).
- **Sombras:** Quase inexistentes. Usamos `shadow-sm` combinado com bordas de contorno (`border-gray-200`) para separar planos, em vez de sombras pesadas ou "flutuantes".

## 5. Modos de Tema
- Toda a aplicação está estruturalmente preparada para **Dark Mode** via as classes utilitárias `dark:` do Tailwind CSS, mantendo as diretrizes de contraste adequadas. A alternância oficial pode ser adicionada em versões futuras.
