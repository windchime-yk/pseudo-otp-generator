import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { STATUS_CODE } from "@std/http/status";
import { CONSTANTS, getOtpInfo, isAuth } from "~/api/core.ts";
import "@std/dotenv/load";

const app = new Hono();

app.all("*", (ctx, next) => {
  if (!isAuth(ctx.req.raw.headers.get(CONSTANTS.ENV_KEY))) {
    throw new HTTPException(STATUS_CODE.Unauthorized, {
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
    status: STATUS_CODE.NotFound,
    message: "お探しのものは存在しません",
  }, STATUS_CODE.NotFound);
});

app.onError((err, ctx) => {
  if (err instanceof HTTPException) {
    return ctx.json({
      status: err.status,
      message: err.message,
    }, err.status);
  }
  return ctx.json({
    status: STATUS_CODE.ServiceUnavailable,
    message: "何らかのエラーが発生しているようです",
    err,
  }, STATUS_CODE.ServiceUnavailable);
});

Deno.serve(app.fetch);
