import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.get("/hello", (c) => {
  return c.json({
    message: "Hello Next.js!",
  });
});
app.get("/hello/:name/:surname", (c) => {
    const {name, surname} = c.req.param();
    return c.json({
        message: `Hello ${name} ${surname}!`,
    });
});
    

export const GET = handle(app);

