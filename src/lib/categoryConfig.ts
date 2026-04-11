/**
 * Shared category config — no React imports, safe for server components too.
 * Import this in PostCard, CreatePostScreen, and anywhere else you need categories.
 */
export const categoryConfig: Record<string, { emoji: string; badgeClass: string; labelKey: string; secondEmoji?: string }> = {
  'help-x-help': { emoji: '🤝', badgeClass: 'bg-blue-100 text-blue-700', labelKey: 'create.help-x-help', secondEmoji: '🤝' },
  'cheer-x-cheer': { emoji: '🎉', badgeClass: 'bg-purple-100 text-purple-700', labelKey: 'create.cheer-x-cheer', secondEmoji: '🎉' },
  'help-and-cheer': { emoji: '🤝', badgeClass: 'bg-orange-100 text-orange-700', labelKey: 'create.help-and-cheer', secondEmoji: '🎉' },
  'flower-x-help': { emoji: '🌻', badgeClass: 'bg-yellow-100 text-yellow-700', labelKey: 'create.flower-x-help', secondEmoji: '🤝' },
}
