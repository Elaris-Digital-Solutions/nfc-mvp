import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4 py-10 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_0%,_rgba(16,34,63,0.45),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_85%_85%,_rgba(19,43,79,0.35),_transparent_60%)]" />
        <div className="absolute inset-0 opacity-60 bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:52px_52px]" />
      </div>

      <SignupForm />
    </div>
  )
}
