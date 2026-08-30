export function getAdminDiscordIds(): string[] {
  return (process.env.ADMIN_DISCORD_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdminDiscordId(discordId: string | null | undefined): boolean {
  if (!discordId) return false;
  return getAdminDiscordIds().includes(discordId);
}
