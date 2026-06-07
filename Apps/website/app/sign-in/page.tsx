/**
 * Legacy /sign-in route — redirects to the new /login page.
 * Kept for backward compatibility (e.g. old better-auth redirects).
 */
import { redirect } from "next/navigation"

export default function SignInPage() {
  redirect("/login")
}
