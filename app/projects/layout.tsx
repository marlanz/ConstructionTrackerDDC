import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";

async function ProjectNavbar() {
  const user = await getCurrentUser();
  return (
    <Navbar
      user={
        user
          ? { name: user.name, email: user.email, role: user.role }
          : null
      }
    />
  );
}

export default function ProjectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full flex flex-col">
      <Suspense fallback={<Navbar user={null} />}>
        <ProjectNavbar />
      </Suspense>
      {children}
    </div>
  );
}

