/** @jsx h */
import { h } from "preact";
import { renderToString } from "preact-render-to-string";
import { extract, install } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";
import { type OtpInfo } from "~/api/core.ts";
import { Header } from "~/app/components/Header.tsx";
import { Card } from "~/app/components/Card.tsx";
import { load } from "std/dotenv/mod.ts";

if (Deno.env.get("DEV_MODE") === "DEV") {
  load({ export: true })
}

install({
  darkMode: "media",
  presets: [presetTailwind()],
});

export type CardItems = OtpInfo & { path: Deno.KvKeyPart };

const Layout = ({ otpList }: { otpList: CardItems[] }) => (
  <html lang="ja">
    <head>
      <meta charSet="UTF-8" />
    </head>
    <body class="text-gray-900 dark:text-white bg-white dark:bg-gray-700">
      <Header />
      <main class="max-w-screen-xl mx-auto py-8 px-4">
        {otpList.length === 0
          ? <p>No OTP</p>
          : (
            <ul class="grid grid-cols-3 gap-3">
              {otpList.map((otpItem) => {
                return (
                  <li>
                    <Card
                      path={otpItem.path}
                      otp={otpItem.otp}
                      created_at={otpItem.created_at}
                      expired_seconds={otpItem.expired_seconds}
                    />
                  </li>
                );
              })}
            </ul>
          )}
      </main>
    </body>
  </html>
);

const handler: Deno.ServeHandler = async () => {
  /**
   * @see https://docs.deno.com/kv/manual/on_deploy#connect-to-managed-databases-from-outside-of-deno-deploy
   */
  const kv = await Deno.openKv(Deno.env.get("PSEUDO_OTP_DB_URL"));

  const kvDataList = kv.list<OtpInfo>({ prefix: ["otp"] });
  const otpList: CardItems[] = [];
  for await (const kvData of kvDataList) {
    otpList.push({
      path: kvData.key[1],
      ...kvData.value,
    });
  }

  const renderedHtml = renderToString(<Layout otpList={otpList} />);
  const { html, css } = extract(renderedHtml);
  return new Response(
    html.replace("</head>", `<style data-twind>${css}</style></head>`),
    {
      headers: {
        "Content-Type": "text/html",
      },
    },
  );
};

Deno.serve({ port: 8081 }, handler);
