/**
 * /sign-up route — self-service registration is disabled by design.
 *
 * The backend sets `disableSignUp: true` and no social provider (Google) is
 * configured, so the previous registration form could never succeed (audit
 * §4/§14). Accounts are provisioned by an admin (employee invitation flow),
 * so this route now redirects to the login page instead of presenting a
 * broken form.
 */
import { redirect } from "next/navigation";

export default function SignUpPage() {
  redirect("/login");
}
