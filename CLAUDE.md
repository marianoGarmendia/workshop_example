# Brief del Proyecto: Claude Code Agent

Construir una API HTTP simple que envuelva un agente LangGraph especializado en responder preguntas sobre Claude Code.

## Objetivo

Crear un proyecto Node.js + TypeScript que exponga un único endpoint POST. El agente debe usar LangGraph, llamar a una herramienta para buscar información y devolver una respuesta en texto plano.

No agregar funcionalidades extra más allá de lo descrito aquí. Mantenerlo simple.

## Stack

- **Runtime**: Node.js con TypeScript (ES2022, módulos NodeNext)
- **Agente**: LangGraph (`@langchain/langgraph`) con `@langchain/anthropic`
- **Servidor**: Express
- **Modelo**: `claude-sonnet-4-6`, temperatura 0
- **Validación**: Zod

## Estructura del Proyecto

Organizar los archivos fuente bajo `src/`:

```
src/
  index.ts          — Punto de entrada del servidor Express
  agent/
    graph.ts        — Definición del grafo LangGraph y función runAgent()
    tools.ts        — Definición de herramientas
    prompts.ts      — Constante del system prompt
  routes/
    agent.ts        — Handler de la ruta del agente
```

> Ignorar la carpeta `script_example/` — no forma parte de este proyecto.

## Diseño del Agente

Usar un `StateGraph` con `MessagesAnnotation`. El grafo debe tener dos nodos: `llm` y `tools`, con un edge condicional que enruta a `tools` cuando hay tool calls presentes, y termina en caso contrario.

```
__start__ → llm → (¿tool calls?) → tools → llm → ... → __end__
```

Exponer una función `runAgent(question: string): Promise<string>` que invoque el grafo con un `HumanMessage` y retorne el contenido del último mensaje como string.

## Herramienta

Implementar una única herramienta: `search_claude_code_docs`. Recibe un string `topic` y busca en una base de conocimiento en memoria que cubre: `overview`, `installation`, `slash_commands`, `tools_available`, `memory`, `claude_md`, `models`, `hooks`, `permissions`, `settings`, `mcp`.

Usar `tool()` de `@langchain/core/tools` y definir el schema con Zod.

## API

**POST** `/api/agent`

Cuerpo del request:
```json
{ "question": "¿Cómo instalo Claude Code?" }
```

Respuesta:
```json
{ "answer": "..." }
```

Retornar 400 si `question` está ausente o no es un string no vacío. Retornar 500 ante errores del agente.

**GET** `/health` — retorna `{ "status": "ok", "service": "claude-code-agent" }`.

## Variables de Entorno

Leer `ANTHROPIC_API_KEY` del entorno. Soportar `.env` via `dotenv/config` importado en el punto de entrada. Puerto por defecto: `3000`, sobreescribible con la variable de entorno `PORT`.

## TypeScript

- Modo estricto: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`
- Salida: `dist/`, raíz del código fuente: `src/`
- Usar siempre extensiones `.js` en los imports (requerido por la resolución NodeNext)

## Scripts de npm

```json
"dev":   "tsx watch src/index.ts",
"build": "tsc",
"start": "node dist/index.js"
```
