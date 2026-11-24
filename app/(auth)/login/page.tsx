import { BrandLogo } from "@/components/brand/brand-logo";
import { signIn } from "@/server/auth/auth";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <section className="w-full max-w-95 rounded-2xl border border-(--border-subtle) bg-(--bg-surface) p-8 shadow-(--shadow-card) sm:p-10">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            <BrandLogo className="flex-col gap-4 [&>svg]:size-14 [&>svg]:rounded-xl [&>svg]:p-2.5" />
          </h1>
          <p className="text-ink-muted mt-2 text-sm leading-relaxed">
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
            className="bg-text text-bg ease-spring focus-visible:outline-accent flex w-full items-center justify-center rounded-lg py-4 text-[15px] font-medium transition-transform duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-ink-muted mt-6 text-center text-xs">
          Access is limited to approved accounts.
        </p>
      </section>
    </main>
  );
}
