# 0004: Chat em SSE streaming com referências em evento inicial

A resposta do chat chega por SSE: primeiro um evento `references` com o JSON das referências recuperadas, depois eventos `token` com o texto. Entregar as referências antes dos tokens evita parsear o texto gerado, garante que o card de referência sempre apareça (mesmo se o stream cair) e deixa o modelo livre para responder sem formatação especial — ele nem "sabe" que as referências são exibidas separadamente.

## Considered Options

- Modelo formata `[S1]` inline e o front parseia: frágil, dependente de o modelo seguir formato exato.
- JSON estruturado no fim do stream: refs ficam reféns do stream terminar.

## Consequences

- Protocolo simples e determinístico; refs persistidas junto da mensagem no SQLite.