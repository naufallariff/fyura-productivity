import { Header } from "./header";

export function PageShell({
  title,
  email,
  children,
}: {
  title: string;
  email: string | null;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header title={title} email={email} />
      <div className="mx-auto w-full max-w-350 px-4 py-6 sm:px-6 lg:py-8">{children}</div>
    </>
  );
}
