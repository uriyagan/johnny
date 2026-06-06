import { redirect } from "next/navigation";

/** Entry point — route users into the app (or to login if signed out). */
export default function RootPage() {
  redirect("/dashboard");
}
