import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from './LogoutButton';

export default function Navbar({
  profile,
  isLoggedIn,
  isAdmin,
}: {
  profile: { username: string; avatar_url: string | null } | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  return (
    <header className="bg-usopen-navy text-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/matches" className="text-lg font-bold tracking-tight">
          🎾 US Open Typer
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/matches" className="hover:text-usopen-yellow">
            Mecze
          </Link>
          <Link href="/ranking" className="hover:text-usopen-yellow">
            Ranking
          </Link>
          {isLoggedIn && (
            <Link href="/profile" className="hover:text-usopen-yellow">
              Profil
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className="font-semibold text-usopen-yellow hover:opacity-80">
              Admin
            </Link>
          )}
          {isLoggedIn && profile ? (
            <div className="flex items-center gap-2">
              {profile.avatar_url && (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              )}
              <span className="hidden sm:inline">{profile.username}</span>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded bg-[#5865F2] px-3 py-1.5 font-medium hover:opacity-90"
            >
              Zaloguj przez Discord
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
