import { signIn } from "@/lib/auth/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <section className="elevated rounded-card border-line bg-surface w-full max-w-95 border p-8 sm:p-10">
        <div className="bg-accent mx-auto grid size-14 place-items-center rounded-[18px] text-xl font-semibold text-white">
          F
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Fyura Productivity</h1>
          <p className="text-muted mt-2 text-sm leading-relaxed">
            Sign in with your approved Google account to continue.
          </p>
        </div>

        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="rounded-control bg-text text-bg ease-spring focus-visible:outline-accent flex w-full items-center justify-center py-3.5 text-[15px] font-medium transition-transform duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-muted mt-6 text-center text-xs">
          Access is limited to approved accounts.
        </p>
      </section>
    </main>
  );
}
