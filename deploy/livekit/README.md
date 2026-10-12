# Медиасервер LiveKit

Видеоконференции занятий работают через открытый медиасервер LiveKit (SFU) со встроенным TURN.
Он разворачивается на отдельном VDS: через него проходит весь аудио- и видеотрафик
(при 40 конференциях по 5 участников — порядка 300 Мбит/с входящего и до 800 Мбит/с исходящего),
поэтому нужен канал 1 Гбит/с.

## Установка

1. Направить домен (например, `livekit.твой-домен.ru`) на IP сервера.
2. Сгенерировать пару ключей API, например:
   `docker run --rm livekit/livekit-server:v1.13.7 generate-keys`
3. `cp .env.example .env` и заполнить `LIVEKIT_DOMAIN` и `LIVEKIT_KEYS`.
4. В `livekit.yaml` заменить `livekit.example.ru` на свой домен, `REPLACE_WITH_API_KEY` — на ключ API,
   адрес веб-хука — на адрес портала.
5. Открыть порты: 443/tcp, 80/tcp (выпуск сертификата), 7881/tcp, 50000–60000/udp, 3478/udp, 5349/tcp.
6. `docker compose up -d`

## Сервер приложений

В `.env` портала указать:

```
LIVEKIT_URL=wss://livekit.твой-домен.ru
LIVEKIT_API_KEY=<ключ>
LIVEKIT_API_SECRET=<секрет>
```

Портал выдаёт участникам токены доступа к комнате `lesson-<id>` и принимает веб-хуки
`participant_joined` / `participant_left` / `room_finished` на `/api/conference/livekit/webhook`
(подпись веб-хука проверяется ключом API).
