import { Hono, HTTPException } from "hono";
import { Status } from "std/http/http_status.ts";
import { CONSTANTS, getOtpInfo, isAuth } from "~/api/core.ts";
import { load } from "std/dotenv/mod.ts";

if (Deno.env.get("DEV_MODE") === "DEV") {
  load({ export: true })
}

const app = new Hono();

app.all("*", (ctx, next) => {
  if (!isAuth(ctx.req.raw.headers.get(CONSTANTS.ENV_KEY))) {
    throw new HTTPException(Status.Unauthorized, {
      message: "認証できるAPIキーを用意してください",
    });
  }
  return next();
});

app.get("/otp/:service{.+}", async (ctx) => {
  const service = ctx.req.param("service");
  const { expired } = ctx.req.query();
  const kv = await Deno.openKv();
  const otpInfo = await getOtpInfo(
    kv,
    service,
    expired ? Number(expired) : 86_400,
  );

  return ctx.json(otpInfo);
});

app.all("*", (ctx) => {
  return ctx.json({
    status: Status.NotFound,
    message: "お探しのものは存在しません",
  }, Status.NotFound);
});

app.onError((err, ctx) => {
  if (err instanceof HTTPException) {
    return ctx.json({
      status: err.status,
      message: err.message,
    }, err.status);
  }
  return ctx.json({
    status: Status.ServiceUnavailable,
    message: "何らかのエラーが発生しているようです",
    err,
  }, Status.ServiceUnavailable);
});

Deno.serve(app.fetch);
