import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login page by default
  // Once auth is implemented, this will check auth state
  // and redirect to /employees if authenticated
  redirect("/login");
}
