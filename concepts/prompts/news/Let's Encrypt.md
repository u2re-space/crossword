Отличная идея — многим сервисам действительно нужен “единый PEM” с ключом и цепочкой в одном файле. Ниже — что именно объединять, в каком порядке и как автоматизировать после обновления сертификата.

Что выдаёт Let’s Encrypt (certbot)
- privkey.pem — приватный ключ
- cert.pem — сертификат домена
- chain.pem — промежуточный сертификат(ы)
- fullchain.pem — cert.pem + chain.pem

Где нужен один файл
- HAProxy, Envoy, некоторые Go/CLI-сервисы — один .pem: сертификат(+цепочка) и ключ в одном файле.
- Java/Tomcat/IIS — обычно нужен PKCS#12 (.p12/.pfx), тоже “всё-в-одном”, но в другом формате.
- Nginx/Apache/Postfix/Dovecot — как правило, отдельные пути к fullchain.pem и privkey.pem, объединять не требуется.

Как собрать один PEM из “трёх”
Чаще всего нужен порядок “сертификаты, затем ключ”:
- Для HAProxy/Envoy и большинства ожидающих PEM-файл:
  `cat /etc/letsencrypt/live/your.domain/fullchain.pem /etc/letsencrypt/live/your.domain/privkey.pem > /etc/letsencrypt/live/your.domain/combined.pem`

Иногда (редко, у устаревших/специфичных сервисов) требуется “ключ, затем сертификаты”:
- Альтернативный порядок:
  `cat /etc/letsencrypt/live/your.domain/privkey.pem /etc/letsencrypt/live/your.domain/cert.pem /etc/letsencrypt/live/your.domain/chain.pem > /etc/letsencrypt/live/your.domain/combined.pem`

Рекомендации по безопасности
- combined.pem содержит приватный ключ — права минимум 640 (или 600), правильная группа процесса (например, haproxy).
  `chown root:haproxy /etc/letsencrypt/live/your.domain/combined.pem`
  `chmod 640 /etc/letsencrypt/live/your.domain/combined.pem`

Автоматизация при обновлении (certbot)
Положите deploy‑hook, который соберёт файл после каждого renew.

- Создайте файл `/etc/letsencrypt/renewal-hooks/deploy/10-make-combined.sh`:
```
  #!/bin/sh
  set -e
  COMBINED="$RENEWED_LINEAGE/combined.pem"
  cat "$RENEWED_LINEAGE/fullchain.pem" "$RENEWED_LINEAGE/privkey.pem" > "$COMBINED"
  chown root:haproxy "$COMBINED"
  chmod 640 "$COMBINED"
  # Перезапуск/перечтение нужного сервиса:
  systemctl reload haproxy || true
```

- Сделайте его исполняемым:
  `chmod +x /etc/letsencrypt/renewal-hooks/deploy/10-make-combined.sh`

Пример конфигурации для популярных сервисов
- HAProxy:
  `bind :443 ssl crt /etc/letsencrypt/live/your.domain/combined.pem`

- Nginx:
  `ssl_certificate     /etc/letsencrypt/live/your.domain/fullchain.pem;`
  `ssl_certificate_key /etc/letsencrypt/live/your.domain/privkey.pem;`

- Apache (современные версии):
  `SSLCertificateFile      /etc/letsencrypt/live/your.domain/fullchain.pem`
  `SSLCertificateKeyFile   /etc/letsencrypt/live/your.domain/privkey.pem`

PKCS#12 (для Java, IIS и т. п.)
- Собрать .pfx/.p12 из ключа и цепочки:
```
  openssl pkcs12 -export \
    -inkey /etc/letsencrypt/live/your.domain/privkey.pem \
    -in    /etc/letsencrypt/live/your.domain/cert.pem \
    -certfile /etc/letsencrypt/live/your.domain/chain.pem \
    -out   /etc/ssl/private/your.domain.pfx
```
- Задайте пароль экспорта (его же потребуется в импорте).
- Для Tomcat (через PKCS12 как keystore) или для IIS импортируйте этот файл.

Проверка после настройки
- Убедиться, что цепочка и key совпадают:
  `openssl x509 -noout -modulus -in /path/to/combined.pem | openssl md5`
  `openssl rsa  -noout -modulus -in /path/to/combined.pem | openssl md5`
  # Хэши должны совпасть
- Проверить выдачу с сервера:
  `openssl s_client -connect your.domain:443 -servername your.domain -showcerts </dev/null`

Если подскажете конкретный сервис (HAProxy, Envoy, Node.js, Java/Tomcat, IIS, Postfix/Dovecot и т. д.) — дам точный порядок склеивания и пример конфигурации.

---

Отлично, для Fastify/Nest/Vite есть несколько рабочих вариантов: классические PEM (fullchain + privkey), единый PEM (combined), либо один файл PKCS#12 (.pfx). Ниже — готовые примеры и нюансы.

Быстрые выводы
- Надёжнее всего для Node: использовать fullchain.pem как cert и privkey.pem как key.
- Если хотите “один файл” — используйте .pfx (PKCS#12) и передавайте его как pfx + passphrase.
- Единый PEM тоже можно: тот же файл передать и в key, и в cert (Node извлечёт нужные блоки).

Fastify
1) Отдельные файлы от Let’s Encrypt (рекомендуется)
```ts
import fs from 'fs';
import Fastify from 'fastify';

const fastify = Fastify({
  https: {
    key:  fs.readFileSync('/etc/letsencrypt/live/example.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/example.com/fullchain.pem'),
  },
  // http2: true, // при желании
});

await fastify.listen({ port: 443, host: '0.0.0.0' });
```

2) Один PEM (combined.pem)
```ts
const pem = fs.readFileSync('/etc/letsencrypt/live/example.com/combined.pem');
const fastify = Fastify({
  https: {
    key: pem,
    cert: pem, // можно передать один и тот же файл
  },
});
```

3) Один .pfx
```ts
const pfx = fs.readFileSync('/etc/ssl/private/example.com.pfx');
const fastify = Fastify({
  https: {
    pfx,
    passphrase: process.env.PFX_PASS, // если задавали при экспорте
  },
});
```

NestJS
1) Через httpsOptions (Express по умолчанию)
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key:  fs.readFileSync('/etc/letsencrypt/live/example.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/example.com/fullchain.pem'),
      // или pfx: fs.readFileSync('/etc/ssl/private/example.com.pfx'), passphrase: process.env.PFX_PASS
    },
  });

  await app.listen(443, '0.0.0.0');
}
bootstrap();
```

2) Если используете FastifyAdapter в Nest — те же httpsOptions, как в примерах для Fastify.

Vite (dev/preview)
Важно: Let’s Encrypt для локалки обычно не подходит. Для dev лучше mkcert/самоподписанный. Vite в проде как терминирующий TLS не рекомендуется, лучше проксировать через Nginx/HAProxy/Caddy. Но если нужно:

vite.config.ts с PEM:
```ts
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  server: {
    https: {
      key:  fs.readFileSync('/etc/letsencrypt/live/example.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/example.com/fullchain.pem'),
      // либо pfx: fs.readFileSync('/etc/ssl/private/example.com.pfx'), passphrase: '...'
    },
    host: '0.0.0.0',
    // порт лучше оставить >1024 (например 5173) и проксировать 443 снаружи
  },
  preview: {
    https: {
      key:  fs.readFileSync('/etc/letsencrypt/live/example.com/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/example.com/fullchain.pem'),
    },
  },
});
```

Как сделать “один файл”
- Единый PEM:
  `cat /etc/letsencrypt/live/example.com/fullchain.pem /etc/letsencrypt/live/example.com/privkey.pem > /etc/letsencrypt/live/example.com/combined.pem`

- PKCS#12 (.pfx — предпочтительно для “одного файла” в Node):
```
  openssl pkcs12 -export \
    -inkey   /etc/letsencrypt/live/example.com/privkey.pem \
    -in      /etc/letsencrypt/live/example.com/cert.pem \
    -certfile /etc/letsencrypt/live/example.com/chain.pem \
    -out     /etc/ssl/private/example.com.pfx
  # Вас попросят ввести пароль (passphrase). Его потом указываем в Node.
```

Права и доступ
- Файлы в `/etc/letsencrypt/live` обычно доступны только root. Ноде лучше не давать читать их напрямую.
- Создайте копию для приложения с нужными правами через deploy‑hook certbot’а:
  - Для combined.pem: `/etc/letsencrypt/renewal-hooks/deploy/20-node-combined.sh`
```
    #!/bin/sh
    set -e
    OUT="/etc/ssl/private/example.com-combined.pem"
    cat "$RENEWED_LINEAGE/fullchain.pem" "$RENEWED_LINEAGE/privkey.pem" > "$OUT"
    chown root:node "$OUT"
    chmod 640 "$OUT"
    systemctl restart my-node.service || true
```
  - Для .pfx аналогично, только с `openssl pkcs12 -export` (см. выше), затем рестарт сервиса.

Горячее обновление сертификата без рестарта (опционально)
- В Node у https/tls-сервера есть server.setSecureContext(). Можно вотчить файл и обновлять контекст:
```ts
import fs from 'fs';
import path from 'path';

function readCreds() {
  return {
    key:  fs.readFileSync('/etc/ssl/private/example.com-combined.pem'),
    cert: fs.readFileSync('/etc/ssl/private/example.com-combined.pem'),
  };
}

const fastify = Fastify({ https: readCreds() });
await fastify.listen({ port: 443 });

const target = '/etc/ssl/private/example.com-combined.pem';
fs.watchFile(target, { interval: 60_000 }, () => {
  try {
    const creds = readCreds();
    // @ts-ignore: метод есть у tls/https server
    fastify.server.setSecureContext(creds);
    fastify.log.info('TLS context reloaded');
  } catch (e) {
    fastify.log.error(e, 'TLS reload failed');
  }
});
```
- Проще и надёжнее — просто перезапускать сервис из deploy‑hook.

Рекомендации
- В проде чаще всего выгоднее терминировать TLS в Nginx/HAProxy/Caddy и отдать Node только HTTP — проще с правами, SNI, ALPN/HTTP3 и автопродлением.
- Если всё же шифруете прямо в Node — используйте fullchain.pem + privkey.pem или .pfx. Единый PEM тоже работает (передавайте его и в key, и в cert).
