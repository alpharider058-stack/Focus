import http from "node:http";

const port = Number(process.env.PORT || 8787);
const apiKey = process.env.OPENROUTER_API_KEY;

function send(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.APP_ORIGIN || "*",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") return send(response, 204, {});
  if (request.method !== "POST" || request.url !== "/api/coach") {
    return send(response, 404, { error: "Not found" });
  }
  if (!apiKey || apiKey.startsWith("replace-with"))
    return send(response, 500, {
      error: "OPENROUTER_API_KEY is not configured",
    });

  try {
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const input = JSON.parse(raw);
    const exerciseCount = Math.min(
      Math.max(Number.parseInt(input.exerciseCount, 10) || 5, 1),
      8,
    );
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const upstream = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        signal: controller.signal,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost:8081",
          "X-Title": "Pulse Gym Coach",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 1800,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `Eres un entrenador responsable. Devuelve solo JSON válido con las claves routine y plan. routine contiene name y exercises. Debes devolver exactamente ${exerciseCount} ejercicios en routine.exercises; cada exercise tiene name, muscle, equipment, sets, reps, weight y rest. plan es un objeto con claves 0-6 y valores true o false; marca como true exactamente los días solicitados por el usuario. No diagnostiques ni prometas resultados. Si hay dolor o lesión, recomienda consultar a un profesional.`,
            },
            { role: "user", content: JSON.stringify(input) },
          ],
        }),
      },
    );
    clearTimeout(timeout);
    const data = await upstream.json();
    if (!upstream.ok)
      return send(response, upstream.status, {
        error: data?.error?.message || "OpenRouter request failed",
      });
    const content = data?.choices?.[0]?.message?.content;
    return send(response, 200, JSON.parse(content));
  } catch (error) {
    return send(response, error?.name === "AbortError" ? 504 : 400, {
      error:
        error?.name === "AbortError"
          ? "OpenRouter ha tardado demasiado en responder"
          : error instanceof Error
            ? error.message
            : "Invalid request",
    });
  }
});

server.listen(port, "0.0.0.0", () =>
  console.log(`Pulse AI proxy listening on port ${port}`),
);
