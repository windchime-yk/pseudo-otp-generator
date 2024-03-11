/** @jsx h */
import { h } from "preact";
export const Header = () => {
  return (
    <header class="bg-white border-gray-200 dark:bg-gray-900">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <h1 class="text-2xl font-semibold whitespace-nowrap dark:text-white">
          Pseudo OTP Checker
        </h1>
      </div>
    </header>
  );
};
