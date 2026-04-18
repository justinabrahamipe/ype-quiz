import { auth } from "@/lib/auth";
import { Header } from "@/components/header";
import { HomeContent } from "@/components/home-content";
import { BottomNav } from "@/components/bottom-nav";

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HomeContent isLoggedIn={isLoggedIn} />
      {isLoggedIn && <BottomNav />}
    </div>
  );
}
