# DODO — мост към GitHub Issues

Формата „Съобщи проблем" на сайта праща сигнала тук, а този Worker го
записва като **issue** в `gpsn0w/DODO`. Хората пишат **без акаунт**;
тайният ключ живее в Cloudflare, не в сайта.

## Настройка (еднократно, ~10 минути)

### 1. Ключ от GitHub (fine-grained token)
1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. **Repository access:** Only select repositories → `gpsn0w/DODO`
3. **Permissions → Repository → Issues:** *Read and write*
4. Копирай ключа (`github_pat_...`) — показва се само веднъж.

### 2. Пусни Worker-а
От тази папка (`issue-worker/`):

```bash
npx wrangler login
npx wrangler secret put GITHUB_TOKEN   # постави ключа от стъпка 1
npx wrangler deploy
```

`deploy` ще изпише адрес, напр. `https://dodo-issue-bridge.ТВОЙ-АКАУНТ.workers.dev`.

### 3. Вържи сайта
В `../site.js` намери реда `var ENDPOINT =` и сложи там адреса на Worker-а.
После качи сайта (git push към GitHub Pages).

### 4. (по избор) Заключи CORS
В `wrangler.toml` смени `ORIGIN = "*"` с точния адрес на сайта
(напр. `https://gpsn0w.github.io`) и пусни пак `npx wrangler deploy`.

## Проверка
Отвори сайта → секция **Сигнали** → прати тест. Трябва да се появи
нов issue в https://github.com/gpsn0w/DODO/issues с етикет `сайт`.

## Етикети
Worker слага `сайт` на всеки, плюс `bug` / `идея` / `въпрос` според вида.
Създай ги предварително в Issues → Labels (иначе GitHub ги прескача тихо).
