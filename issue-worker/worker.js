// DODO — мост между формата на сайта и GitHub Issues.
//
// Формата на сайта не може сама да пише в GitHub (иска таен ключ, а той не
// бива да стои в сайта — всеки би го откраднал от кода). Затова стои тук:
// приема сигнала от сайта и създава issue в репото с ключ, който живее
// САМО в този Worker (като Cloudflare secret), не в сайта.
//
// Настройка (еднократно) — виж README.md в тази папка.

const MAX = 5000; // таван на дължината на съобщението

export default {
    async fetch(request, env) {
        const origin = env.ORIGIN || "*";
        const cors = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Vary": "Origin"
        };

        if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
        if (request.method !== "POST") return json({ error: "само POST" }, 405, cors);

        let body;
        try { body = await request.json(); }
        catch (_) { return json({ error: "лош JSON" }, 400, cors); }

        // Капан за ботове: скритото поле е попълнено само от автомат.
        // Правим се, че сме приели, без да създаваме issue.
        if (body._honey) return json({ success: "true" }, 200, cors);

        const message = String(body["Съобщение"] || "").trim();
        if (!message) return json({ error: "празно съобщение" }, 400, cors);

        const kind    = String(body["Вид"] || "Сигнал").slice(0, 40);
        const system  = String(body["Система"] || "").slice(0, 40);
        const version = String(body["Версия"] || "").slice(0, 40);
        const email   = String(body["Имейл"] || "").slice(0, 120);

        const firstLine = message.split("\n")[0].slice(0, 70);
        const title = `${kind} · ${firstLine}`;

        const md = [
            `**Вид:** ${kind}`,
            system ? `**Система:** ${system}` : "",
            version ? `**Версия:** ${version}` : "",
            email ? `**Имейл за отговор:** ${email}` : "",
            "",
            "---",
            "",
            message.slice(0, MAX)
        ].filter(Boolean).join("\n");

        const labels = ["сайт"];
        if (/проблем|bug/i.test(kind)) labels.push("bug");
        else if (/идея/i.test(kind)) labels.push("идея");
        else if (/въпрос/i.test(kind)) labels.push("въпрос");

        const repo = env.REPO || "gpsn0w/DODO";
        const gh = await fetch(`https://api.github.com/repos/${repo}/issues`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
                "Accept": "application/vnd.github+json",
                "User-Agent": "dodo-issue-bridge",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, body: md, labels })
        });

        if (!gh.ok) {
            const detail = (await gh.text()).slice(0, 200);
            return json({ error: "GitHub отказа", detail }, 502, cors);
        }

        const issue = await gh.json();
        return json({ success: "true", url: issue.html_url, number: issue.number }, 200, cors);
    }
};

function json(obj, status, cors) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { "Content-Type": "application/json; charset=utf-8", ...cors }
    });
}
