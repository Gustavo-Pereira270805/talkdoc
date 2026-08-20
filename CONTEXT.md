# TalkDoc

Aplicação web onde o usuário envia um PDF e conversa com o conteúdo via RAG (retrieval-augmented generation). As respostas são fundamentadas no documento enviado e apontam os trechos/páginas utilizados.

## Language

**Documento**:
Um arquivo PDF enviado pelo usuário, fonte exclusiva de fundamentação das respostas.
_Avoid_: Arquivo, PDF genérico

**Processamento**:
O pipeline que transforma um documento em um índice pesquisável: extração de texto, chunking, geração de embeddings e indexação.
_Avoid_: Ingestão, parsing, indexação isolada

**Chunk**:
Unidade de texto resultante do chunking, a granularidade de recuperação no índice.
_Avoid_: Trecho, pedaço, segmento (na linguagem de pipeline)

**Índice**:
A coleção de vetores no vector store, agrupada por documento, usada na recuperação top-k.
_Avoid_: Vector store genérico, banco vetorial

**Recuperação**:
A busca top-k de chunks relevantes no índice a partir da pergunta do usuário.
_Avoid_: Retrieval, busca

**Referência**:
O trecho e a página de origem que fundamentam uma resposta, exibidos junto dela.
_Avoid_: Citação, fonte, source

**Conversa**:
A sequência de mensagens entre usuário e modelo sobre um conjunto de documentos.
_Avoid_: Chat, thread, sessão (quando se referir ao histórico)

**Resposta fundamentada**:
Resposta gerada pelo modelo ancorada exclusivamente nas referências recuperadas.
_Avoid_: Resposta grounded, resposta contextual