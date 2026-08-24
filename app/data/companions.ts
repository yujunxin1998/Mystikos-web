export type PublicCompanion = {
  slug: string
  name: string
  initial: string
  games: string[]
  tagline: string
  bio: string
  rating: string
  sessions: number
  responseRate: string
  status: string
  accent: string
  gameKeys: string[]
  gamesEn: string[]
  taglineEn: string
  bioEn: string
  statusEn: string
}

const baseCompanions: Omit<PublicCompanion, 'gameKeys' | 'gamesEn' | 'taglineEn' | 'bioEn' | 'statusEn'>[] = [
  { slug: 'ari-vale', name: 'Ari Vale', initial: 'A', games: ['Valorant', 'Apex 英雄'], tagline: '战术指挥 · 温柔沟通 · 不压力队友', bio: '擅长高压对局中的节奏判断，也享受轻松闲聊的深夜局。无论你想上分、复盘，还是只想找一个靠谱队友，我都会认真陪你打好这一场。', rating: '4.9', sessions: 68, responseRate: '98%', status: '今晚可约', accent: '#bcaeff' },
  { slug: 'mika-sol', name: 'Mika Sol', initial: 'M', games: ['英雄联盟', 'Valorant'], tagline: '节奏判断 · 复盘清晰 · 深夜电台', bio: '主打清晰沟通和耐心复盘。会根据你的习惯调整节奏，让每一局既有目标，也保留轻松聊天的空间。', rating: '5.0', sessions: 126, responseRate: '99%', status: '在线', accent: '#e6ae63' },
  { slug: 'noah-lin', name: 'Noah Lin', initial: 'N', games: ['Apex 英雄', '永劫无间'], tagline: '快速支援 · 氛围轻松 · 决策果断', bio: '喜欢快速而清楚的团队决策，也擅长在紧张残局中稳定气氛。想练配合或快乐上分都可以。', rating: '4.8', sessions: 91, responseRate: '96%', status: '今晚可约', accent: '#9bbcec' },
  { slug: 'lumi', name: 'Lumi', initial: 'L', games: ['英雄联盟', '永劫无间'], tagline: '耐心教学 · 新手友好 · 沟通细致', bio: '对新手足够耐心，会把复杂机制拆成容易执行的小步骤。输赢之外，更在意你是否真正玩得舒服。', rating: '4.9', sessions: 74, responseRate: '98%', status: '明晚可约', accent: '#d6a9cf' },
  { slug: 'rin-kaze', name: 'Rin Kaze', initial: 'R', games: ['Valorant', '永劫无间'], tagline: '枪法训练 · 排位协作 · 目标明确', bio: '专注训练和实战反馈，适合希望提升枪法、站位与临场判断的玩家。', rating: '4.7', sessions: 57, responseRate: '95%', status: '在线', accent: '#83c1b5' },
  { slug: 'yue-mori', name: 'Yue Mori', initial: 'Y', games: ['Apex 英雄', '英雄联盟'], tagline: '轻松闲聊 · 情绪稳定 · 团队优先', bio: '不急不躁的团队型玩家，擅长照顾队伍节奏，也愿意陪你聊聊游戏之外的日常。', rating: '4.9', sessions: 103, responseRate: '99%', status: '今晚可约', accent: '#e0b57a' },
  { slug: 'caro', name: 'Caro', initial: 'C', games: ['Valorant', '英雄联盟'], tagline: '战术复盘 · 英雄池指导 · 不傲慢', bio: '用直接但友好的方式给出建议，适合需要系统复盘或扩展英雄池的玩家。', rating: '4.8', sessions: 62, responseRate: '97%', status: '明晚可约', accent: '#a9a0df' },
  { slug: 'sena', name: 'Sena', initial: 'S', games: ['Apex 英雄', '永劫无间'], tagline: '高压残局 · 清晰报点 · 快乐上分', bio: '享受高压残局，也重视每一次有效报点。目标是一起赢，同时不让过程变得紧绷。', rating: '4.9', sessions: 88, responseRate: '98%', status: '在线', accent: '#d88f9d' }
]

const english = [
  { tagline: 'Tactical calls · Kind comms · No-pressure teammate', bio: 'I read the pace of high-pressure rounds and enjoy relaxed late-night queues. Whether you want to climb, review, or simply find a reliable teammate, I will take every match seriously.' },
  { tagline: 'Tempo reads · Clear reviews · Late-night radio', bio: 'Clear communication and patient reviews, with a pace that adapts to you and leaves room for relaxed conversation.' },
  { tagline: 'Fast support · Easy atmosphere · Decisive calls', bio: 'Quick, clear team decisions and a steady atmosphere when the final fight gets tense.' },
  { tagline: 'Patient coaching · Beginner-friendly · Thoughtful comms', bio: 'Complex mechanics become small, practical steps. Winning matters, but feeling comfortable matters more.' },
  { tagline: 'Aim training · Ranked teamwork · Clear goals', bio: 'Focused practice and direct feedback for aim, positioning, and in-the-moment decisions.' },
  { tagline: 'Easy conversation · Steady energy · Team first', bio: 'A calm team player who looks after the pace of the group and is happy to talk beyond the game.' },
  { tagline: 'Tactical reviews · Champion pool guidance · No ego', bio: 'Direct, friendly advice for systematic reviews and building a wider champion pool.' },
  { tagline: 'Clutch rounds · Clear callouts · Joyful climbing', bio: 'I love high-pressure finishes and precise callouts. We play to win without making the journey tense.' }
]
const gameNames: Record<string, { key: string; en: string }> = { 'Valorant': { key: 'valorant', en: 'Valorant' }, 'Apex 英雄': { key: 'apex', en: 'Apex Legends' }, '英雄联盟': { key: 'lol', en: 'League of Legends' }, '永劫无间': { key: 'naraka', en: 'Naraka: Bladepoint' } }

export const publicCompanions: PublicCompanion[] = baseCompanions.map((person, index) => ({
  ...person,
  gameKeys: person.games.map(game => gameNames[game].key),
  gamesEn: person.games.map(game => gameNames[game].en),
  taglineEn: english[index].tagline,
  bioEn: english[index].bio,
  statusEn: person.status === '在线' ? 'Online' : person.status === '明晚可约' ? 'Available tomorrow' : 'Available tonight'
}))
