import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import {streamSSE } from 'hono/streaming';
const supabaseUrl = "https://bacqiesjoqdkxvluwdel.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJhY3FpZXNqb3Fka3h2bHV3ZGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI0Njc1MzcsImV4cCI6MjAzODA0MzUzN30.Ysb8cmpJKKnQv_W6g4MvYUaLxrUvGCZTqmBwsBzjoLw";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get('/sse', async (c) => {
  let id = 0;
  return streamSSE(c, async (stream) => {
    let ended = false;
    while (true) {
      stream.onAbort(() => {
        if (!ended) {
          ended = true
          console.log('Stream aborted')
        }
      })
      const message = `It is ${new Date().toISOString()}`
      await stream.writeSSE({
        data: String(id++)
      })
      await stream.sleep(100)
    }
  })
})



app.get("/api/hello", (c) => {
  return c.json({
    ok: true,
    message: "Hello Hono!",
  });
});

app.get("/api/sync/initial", (c) => {
  return c.json({
    ok: true,
    message: "Hello Hono!",
  });
});

app.get("/api/sync/reconnect", async (c) => {
  const querySyncedAt = c.req.query("synced_at");
  const from = Number(c.req.query("offset")) || 0;
  const to = from + 10;

  const res = await supabase
    .from("employees")
    .select("*", { count: "exact" })
    .or(
      [
        `created_at.gte.${querySyncedAt}`,
        `deleted_at.gte.${querySyncedAt}`,
        `updated_at.gte.${querySyncedAt}`,
      ].join(",")
    )
    .range(from, to);

  return c.json(res);
});

export default app;
