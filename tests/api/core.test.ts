import { assertEquals } from "std/assert/mod.ts";
import { CONSTANTS, getOtpInfo, isAuth, type OtpInfo } from "~/api/core.ts";

Deno.test("APIキーの認証", () => {
  try {
    Deno.env.set(CONSTANTS.ENV_KEY, "test");
    assertEquals(isAuth("test"), true);
  } finally {
    Deno.env.delete(CONSTANTS.ENV_KEY);
  }
});

Deno.test("OTP情報群の試験", async (t) => {
  await t.step("以前のOTPがない場合", async () => {
    const kv = await Deno.openKv();
    const KV_KEY = "examples/generate_otp";
    const otpInfo = await getOtpInfo(kv, KV_KEY, 604_800);

    assertEquals(otpInfo.otp.toString().length, 10);
    assertEquals(otpInfo.expired_seconds, 604_800);

    kv.delete([KV_KEY]);
    kv.close();
  });

  await t.step("以前のOTPがある場合", async () => {
    const kv = await Deno.openKv();
    const KV_KEY = "examples/generate_otp";
    const beforeOtpInfo: OtpInfo = {
      otp: 1234567890,
      created_at: new Date(),
      expired_seconds: 86_400,
    };
    kv.set([KV_KEY], beforeOtpInfo);
    const otpInfo = await getOtpInfo(kv, KV_KEY, 604_800);

    assertEquals(otpInfo.otp, beforeOtpInfo.otp);
    assertEquals(otpInfo.created_at, beforeOtpInfo.created_at);
    assertEquals(otpInfo.expired_seconds, beforeOtpInfo.expired_seconds);

    kv.delete([KV_KEY]);
    kv.close();
  });

  await t.step("以前のOTPが有効期限切れだった場合", async () => {
    const kv = await Deno.openKv();
    const KV_KEY = "examples/generate_otp";
    const beforeOtpInfo: OtpInfo = {
      otp: 1234567890,
      created_at: new Date("1997/04/19"),
      expired_seconds: 86_400,
    };
    kv.set([KV_KEY], beforeOtpInfo);
    const otpInfo = await getOtpInfo(kv, KV_KEY, 604_800);

    assertEquals(otpInfo.otp.toString().length, 10);
    assertEquals(otpInfo.expired_seconds, 604_800);

    kv.delete([KV_KEY]);
    kv.close();
  });
});
