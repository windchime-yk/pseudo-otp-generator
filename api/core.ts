import { difference } from "@std/datetime";

export const CONSTANTS = {
  ENV_KEY: "PSEUDO_OTP_API_KEY",
} as const;

export type OtpInfo = {
  /** 一時パスワード */
  otp: number;
  /** 作成日時 */
  created_at: Date;
  /** 作成日からの有効期限（秒） */
  expired_seconds: number;
};

/**
 * 設定されるべきAPIキーと合致しているか
 * @param key APIキー
 * @returns 合致しているかの真偽値
 */
export const isAuth = (key: string | null): boolean =>
  Deno.env.get(CONSTANTS.ENV_KEY) === key;

/**
 * OTPとして使われる整数を生成
 * @returns 10桁の整数
 */
const generateOtp = (): number => {
  const randomValueList = crypto.getRandomValues(new Uint32Array(10));
  const raudomIndex = Math.floor(Math.random() * 10);
  const otp = randomValueList[raudomIndex];

  // 生成したOTPが10桁ではない場合は再生成
  if (otp.toString().length !== 10) return generateOtp();

  return otp;
};

/**
 * OTPが有効期限切れか判定する
 * @param createdAt OTPの作成日時
 * @param expiredSeconds OTPの有効期限間隔
 * @returns 判定結果
 */
const checkOtpExpired = (
  createdAt: Date,
  expiredSeconds: number,
): boolean => {
  const { seconds } = difference(createdAt, new Date());
  return seconds !== undefined && seconds > expiredSeconds;
};

/**
 * 生成されたOTPをもとにOTP情報群を取得する
 * @param kv Deno KV
 * @param key KVのキー情報
 * @param expiredSeconds OTPの有効期限間隔
 * @returns OTP情報群
 */
export const getOtpInfo = async (
  kv: Deno.Kv,
  key: string,
  expiredSeconds: number,
): Promise<OtpInfo> => {
  const beforeOtp = await kv.get<OtpInfo>(["otp", key]);
  const otp = generateOtp();

  // 以前のOTPが保存されていないか有効期限切れであれば、新規のOTP情報群を返却
  if (
    beforeOtp.value === null ||
    checkOtpExpired(beforeOtp.value.created_at, beforeOtp.value.expired_seconds)
  ) {
    const otpInfo: OtpInfo = {
      otp,
      created_at: new Date(),
      expired_seconds: expiredSeconds,
    };

    // OTP自体の有効期限の1秒後に失効するようKVに保存
    await kv.set(["otp", key], otpInfo, {
      expireIn: expiredSeconds * 1000 + 1000,
    });

    return otpInfo;
  }

  // OTPが以前のものと同じであればOTP情報群を再取得
  if (otp === beforeOtp.value.otp) {
    return getOtpInfo(kv, key, expiredSeconds);
  }

  // いずれにもあたらなければ以前のOTP情報群を返却
  return beforeOtp.value;
};
