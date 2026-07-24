# QuickReview — Guia para Frontend

## Conceito

Avaliação rápida de álbum ou música com nota 0-5, sentimento textual (com pré-opções), foto opcional, faixa favorita e considerações. Coexiste com a Review completa.

## Fluxo Principal

1. Usuário entra em um álbum ou música
2. Clica em "Avaliação Rápida"
3. Preenche: nota (0-5 estrelas), sentimento (digita ou escolhe badge), foto (upload separado), faixa favorita (só álbum), considerações
4. Confirma → POST `/reviews/quick`
5. Aparece na listagem do álbum/música com curtidas e comentários

## Endpoints

### Review

| Método | Path | Corpo | Resposta |
|---|---|---|---|
| POST | `/reviews/quick` | `CreateQuickReviewRequest` | `201` + `QuickReviewDTO` |
| PUT | `/reviews/quick/{id}` | `UpdateQuickReviewRequest` | `200` + `QuickReviewDTO` |
| DELETE | `/reviews/quick/{id}` | — | `204` |
| GET | `/reviews/quick/{id}` | — | `200` + `FullQuickReviewDTO` |
| GET | `/reviews/quick/album/{albumId}` | — | `200` + `List<QuickReviewDTO>` |
| GET | `/reviews/quick/music/{musicId}` | — | `200` + `List<QuickReviewDTO>` |

### Likes

| Método | Path | Resposta |
|---|---|---|
| POST | `/reviews/quick/{id}/like` | `200` |
| DELETE | `/reviews/quick/{id}/like` | `204` |
| GET | `/reviews/quick/{id}/likes/me` | `200` + `boolean` |

### Comentários

| Método | Path | Corpo | Resposta |
|---|---|---|---|
| POST | `/reviews/quick/{id}/comments` | `{ "content": "..." }` | `201` + `QuickReviewCommentDTO` |
| DELETE | `/reviews/quick/comments/{commentId}` | — | `204` |
| GET | `/reviews/quick/{id}/comments` | — | `200` + `List<QuickReviewCommentDTO>` |

### Utilitários

| Método | Path | Resposta |
|---|---|---|
| GET | `/reviews/quick/feelings` | `200` + `List<{ value, label, category }>` |

## DTOs

### CreateQuickReviewRequest

```json
{
  "targetType": "ALBUM" | "MUSIC",
  "albumId": 1,           // obrigatório se ALBUM
  "musicId": null,         // obrigatório se MUSIC
  "score": 4,              // 0-5, obrigatório
  "sentiment": "Energético", // max 255, obrigatório
  "photoUrl": null,        // opcional, URL após upload
  "favoriteTrackId": 3,    // opcional, só ALBUM
  "favoriteTrackComment": null, // opcional, max 500
  "considerations": null   // opcional
}
```

### UpdateQuickReviewRequest

```json
{
  "score": 3,
  "sentiment": "Relaxante",
  "photoUrl": null,
  "favoriteTrackId": null,
  "favoriteTrackComment": null,
  "considerations": "Mudou minha opinião depois de ouvir de novo"
}
```

### QuickReviewDTO (resposta)

```json
{
  "id": 1,
  "user": { "id": 1, "username": "joao", "name": "João", "imageUrl": "..." },
  "targetType": "ALBUM",
  "albumId": 1,
  "musicId": null,
  "score": 4,
  "sentiment": "Energético",
  "photoUrl": null,
  "favoriteTrackId": 3,
  "favoriteTrackComment": null,
  "considerations": null,
  "createdAt": "2026-07-23T14:00:00Z",
  "updatedAt": null
}
```

### FullQuickReviewDTO (GET por ID)

```json
{
  "quickReview": { /* QuickReviewDTO */ },
  "likeCount": 5,
  "likedByCurrentUser": true,
  "commentCount": 2
}
```

### QuickReviewCommentDTO

```json
{
  "id": 1,
  "user": { "id": 1, "username": "joao", "name": "João", "imageUrl": "..." },
  "content": "Concordo!",
  "createdAt": "2026-07-23T14:30:00Z"
}
```

## Pré-opções de Sentimento

`GET /reviews/quick/feelings` retorna:

```json
[
  { "value": "RELAXANTE", "label": "Relaxante", "category": "Vibes" },
  { "value": "ENERGETICO", "label": "Energético", "category": "Vibes" },
  { "value": "MELANCOLICO", "label": "Melancólico", "category": "Vibes" },
  { "value": "ANIMADO", "label": "Animado", "category": "Vibes" },
  { "value": "VIAGEM_SONORA", "label": "Viagem sonora", "category": "Experiência" },
  { "value": "OBRA_PRIMA", "label": "Obra-prima", "category": "Experiência" },
  { "value": "FAVORITO_DO_ANO", "label": "Favorito do ano", "category": "Experiência" },
  { "value": "CRESCE_A_CADA_PLAY", "label": "Cresce a cada play", "category": "Experiência" },
  { "value": "NO_VINIL", "label": "No vinil", "category": "Formato" },
  { "value": "NO_CD", "label": "No CD", "category": "Formato" },
  { "value": "NO_STREAMING", "label": "No streaming", "category": "Formato" },
  { "value": "NO_FONE", "label": "No fone", "category": "Formato" },
  { "value": "SURPREENDENTE", "label": "Surpreendente", "category": "Outros" },
  { "value": "SESSAO_NOSTALGIA", "label": "Sessão nostalgia", "category": "Outros" },
  { "value": "DESCOBRI_HOJE", "label": "Descobri hoje", "category": "Outros" }
]
```

O usuário pode escolher uma opção OU digitar livremente. Se digitar, o frontend envia o texto diretamente no campo `sentiment`.

## Upload de Foto

Fluxo separado (mesmo padrão existente no `AlbumController`):
1. Frontend faz upload para o endpoint de upload de imagens
2. Recebe a URL de volta
3. Envia a URL no campo `photoUrl` do JSON ao criar a QuickReview

## Regras de Negócio

- **Unicidade:** 1 QuickReview por usuário por álbum (ou por música). Se tentar criar outra, retorna `409 Conflict`.
- **Nota:** O `score` (0-5) é convertido para 0-100 no re-cálculo do `Album.rate` (multiplicado por 20).
- **Faixa favorita:** Só válida quando `targetType = ALBUM`. É opcional.
- **Autoria:** Só o dono pode editar/deletar a QuickReview.
- **Curtidas duplicadas:** Retorna `IllegalStateException` (tratado como `409` no controller).

## Tratamento de Erros

| HTTP | Quando |
|---|---|
| 400 | Score fora de 0-5, targetType sem FK, validação de campos |
| 403 | Tentativa de editar/deletar review de outro usuário |
| 404 | Review, álbum, música ou comentário não encontrado |
| 409 | Review duplicada ou curtida duplicada |

## Sugestões de UI

- Exibir as pré-opções de sentimento como badges/chips coloridos por categoria
- Input de texto livre para sentimento ao lado dos badges
- Seletor de estrelas para a nota (0-5)
- Seletor de faixa favorita (dropdown das músicas do álbum)
- Campo de texto opcional para considerações
- Botão de upload de foto (câmera/galeria)
- Listagem das QuickReviews abaixo da review completa (ordem cronológica)
