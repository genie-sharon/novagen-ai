import Link from "next/link";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <Link href="/">
        <h1 className="text-5xl font-display font-bold tracking-tight text-pink-500">
          NovaGen
        </h1>
      </Link>
      <AuthForm mode="signup" />
      <p className="text-sm text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-pink-500 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
