# 0002: Pipeline RAG próprio com abstração de provider (sem LangChain/LlamaIndex/Agno)

Construímos o pipeline RAG diretamente (extração → chunking → embeddings → índice → recuperação → prompt), com interfaces `LLMClient` e `EmbedderClient` isolando os provedores. Frameworks escondem o pipeline e dificultam explicar tradeoffs na entrevista; o pipeline próprio demonstra domínio do conceito e mantém o código pequeno e auditável. A troca de provedor não toca o pipeline.

## Considered Options

- LangChain/LlamaIndex: aceleram o início, mas acoplam ao framework e obscurecem o comportamento.
- Agno: moderno, porém mesma lógica de acoplamento.

## Consequences

- Mais código de nossa autoria para manter e explicar; comportamento 100% visível nos testes.
- Troca de LLM/embeddings é config, não refactor.