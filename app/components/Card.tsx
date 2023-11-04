import dayjs from "dayjs";
import { type CardItems } from "~/app/worker.tsx";

export const Card = ({ path, otp, created_at, expired_seconds }: CardItems) => {
  return (
    <section class="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      <h2 class="text-3xl font-semibold tracking-tight">
        {path}
      </h2>

      <dl class="flex">
        <dt>expired</dt>
        <dd class="ml-3">
          {dayjs(created_at).add(expired_seconds, "seconds").locale("ja")
            .format("YYYY/MM/DD HH:mm:ss")}
        </dd>
      </dl>

      <p class="mt-5 text-2xl text-right">
        {otp}
      </p>

      {/* TODO: Add copy and regenerate button */}
    </section>
  );
};
