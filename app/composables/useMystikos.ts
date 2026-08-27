export type Locale = 'en' | 'zh'
export type Theme = 'dark' | 'light'

type Companion = {
  name: string
  role: string
  game: string
  rating: string
  rate: string
  image: string
  color: string
}

type Product = {
  id: string
  name: string
  category: string
  price: string
  description: string
  image: string
  companion: string
}

const copy: Record<Locale, Record<string, string>> = {
  en: {
    'profile.regionSearch': 'Search country or region…', 'profile.regionEmpty': 'No matching place found.', 'profile.regionToggle': 'Expand or collapse region',
    'nav.home': 'Home', 'nav.shop': 'Curio shop', 'nav.membership': 'Membership', 'nav.language': '中文',
    'nav.theme': 'Change colour theme', 'nav.menu': 'Open navigation', 'nav.close': 'Close navigation',
    'hero.eyebrow': 'A GUILD FOR THE GAMES YOU REMEMBER', 'hero.title': 'Find the company that makes every match matter.',
    'hero.body': 'Mystikos brings together skilled companions, thoughtful rituals and objects worth keeping.',
    'hero.primary': 'Meet the guild', 'hero.secondary': 'Explore the shop', 'hero.cardTitle': 'Tonight’s constellation',
    'hero.cardText': 'Three companions are ready to make a little more room for wonder.', 'hero.online': 'online now',
    'social.label': 'A quieter kind of guild', 'social.value': '12,400+ shared nights',
    'companions.eyebrow': 'HANDPICKED COMPANIONS', 'companions.title': 'Good games deserve good company.',
    'companions.all': 'View all companions', 'companions.book': 'Reserve a session',
    'ranking.eyebrow': 'THIS WEEK IN THE GUILD', 'ranking.title': 'The people who keep the constellation bright.',
    'ranking.companions': 'Companion ranking', 'ranking.bosses': 'Guardian ranking', 'ranking.score': 'glow points',
    'ranking.guardianScore': 'guardian points', 'ranking.change': 'vs. last week', 'ranking.private': 'Private by design',
    'ranking.privateText': 'Guardian names are display names only. Full ranking controls arrive with accounts.',
    'membership.eyebrow': 'YOUR PLACE AT THE TABLE', 'membership.title': 'A membership that grows with your stories.',
    'membership.body': 'Five quietly meaningful levels. Benefits are designed around care, not competition.',
    'membership.level': 'Level', 'membership.current': 'Your current path', 'membership.progress': 'toward the next keepsake',
    'intimacy.eyebrow': 'RELATIONSHIPS, NOT METRICS', 'intimacy.title': 'Small rituals become a shared history.',
    'intimacy.body': 'Your affinity is unique to each companion and built through time together, returning conversations and gifts.',
    'intimacy.stage': 'Close companion', 'intimacy.next': '2 more evenings to your next story', 'intimacy.gifts': 'Keepsakes unlocked',
    'shop.eyebrow': 'THE CURIO SHOP', 'shop.title': 'Objects for the world just outside the game.',
    'shop.body': 'Small-batch pieces chosen by the guild, with notes from the companions who love them.',
    'shop.visit': 'Visit the curio shop', 'shop.filter': 'Browse', 'shop.wishlist': 'Save to wishlist',
    'shop.saved': 'Saved', 'shop.details': 'View details', 'shop.recommended': 'Recommended by',
    'shop.back': 'Back to all objects', 'shop.all': 'All objects', 'shop.fragrance': 'Fragrance',
    'shop.accessories': 'Accessories', 'shop.apparel': 'Apparel', 'shop.stationery': 'Stationery & gifts',
    'shop.empty': 'No objects in this collection yet.', 'shop.note': 'A demo collection — no checkout or payment is enabled.',
    'footer.tagline': 'Find your people. Make every match matter.', 'footer.legal': 'A guild made for better nights.', 'footer.guild': 'Guild', 'footer.companions': 'Companion picks', 'footer.ranking': 'Rankings', 'footer.membership': 'Membership', 'footer.shop': 'Curio shop', 'footer.fragrance': 'Fragrance', 'footer.accessories': 'Accessories', 'footer.apparel': 'Apparel', 'footer.contact': 'Contact', 'footer.hours': 'Weekdays 10:00–22:00', 'footer.privacy': 'Privacy', 'footer.terms': 'Terms',
    'modal.close': 'Close product details', 'modal.added': 'Added to your wishlist', 'modal.remove': 'Remove from wishlist',
    'auth.login': 'Log in', 'auth.register': 'Create account', 'auth.guild': '— Mystikos Guild —',
    'auth.welcome': 'Welcome back to the constellation.',
    'auth.join': 'Find your place among kindred players.', 'auth.loginBody': 'Choose the way that feels most like you. Your stories are waiting.',
    'auth.registerBody': 'A quiet beginning for new friends of the guild.', 'auth.password': 'Account & password', 'auth.email': 'Email code',
    'auth.discord': 'Continue with Discord', 'auth.accountLabel': 'Account name or email', 'auth.accountPlaceholder': 'moonlit.finch',
    'auth.passwordLabel': 'Password', 'auth.passwordPlaceholder': 'At least 8 characters', 'auth.emailLabel': 'Email address',
    'auth.emailPlaceholder': 'you@example.com', 'auth.codeLabel': 'Verification code', 'auth.codePlaceholder': '6-digit code',
    'auth.sendCode': 'Send code', 'auth.sending': 'Sending…', 'auth.resendIn': 'Resend in {seconds}s', 'auth.codeSent': 'A code is on its way to your inbox.',
    'auth.remember': 'Remember me on this device', 'auth.forgot': 'Forgot password?', 'auth.submitLogin': 'Enter Mystikos',
    'auth.submitRegister': 'Begin your story', 'auth.or': 'or continue with', 'auth.discordNote': 'Discord opens a secure authorization window in production.',
    'auth.nameLabel': 'Display name', 'auth.namePlaceholder': 'How should the guild call you?', 'auth.confirmLabel': 'Confirm password',
    'auth.terms': 'I agree to the community guidelines and privacy notice.', 'auth.member': 'Already a member?',
    'auth.newHere': 'New to Mystikos?', 'auth.switchLogin': 'Log in instead', 'auth.switchRegister': 'Create an account',
    'auth.demo': 'Authentication is connected to the Mystikos API.', 'auth.successLogin': 'The guild doors are open. Welcome back.',
    'auth.successRegister': 'Your place in the constellation is ready.', 'auth.logout': 'Log out', 'auth.required': 'Please complete this field.', 'auth.discordConfig': 'Discord authorization is not configured yet.',
    'auth.passwordLength': 'Use at least 8 characters.', 'auth.match': 'Passwords do not match.', 'auth.identifierFormat': 'Use an email address or mobile number to sign in.',
    'auth.cancel': 'Keep me signed in', 'auth.confirmLogout': 'Log out', 'auth.logoutConfirmTitle': 'Leave the constellation?', 'auth.logoutConfirmBody': 'Your session will end on this device. You can always return when you are ready.', 'auth.discordState': 'The Discord sign-in request expired or could not be verified. Please try again.',
    'profile.title': 'My profile', 'profile.eyebrow': 'YOUR MYSTIKOS ARCHIVE', 'profile.greeting': 'Good evening', 'profile.subtitle': 'A small record of the games, people and rituals that have become yours.', 'profile.membership': 'Constellation member',
    'profile.gamesEyebrow': 'PLAYED TOGETHER', 'profile.games': 'Your games', 'profile.totalTime': 'Time together', 'profile.walletEyebrow': 'DIGITAL WALLET', 'profile.wallet': 'Your balance', 'profile.available': 'Available to use', 'profile.topup': 'Add funds', 'profile.withdraw': 'Withdraw earnings', 'profile.topupNotice': 'Top-up will be available when payments are connected.', 'profile.withdrawNotice': 'Withdrawal will be available after your payout account is connected.',
    'profile.achievementsEyebrow': 'GIFTS & AFFINITY', 'profile.achievements': 'Shared milestones', 'profile.achievementsBody': 'The little things you have gathered across the constellation.', 'profile.intimacy': 'Affinity with Mika Sol', 'profile.intimacyNext': '320 glow to the next story', 'profile.ordersEyebrow': 'SESSION ARCHIVE', 'profile.orders': 'Order history', 'profile.ordersHint': 'Boss and companion sessions', 'profile.order': 'Order', 'profile.session': 'Session', 'profile.duration': 'Duration', 'profile.total': 'Total', 'profile.status': 'Status',
    'profile.identityEyebrow': 'YOUR CALLING CARD', 'profile.identity': 'Personal details', 'profile.edit': 'Edit profile', 'profile.loading': 'Reading your archive…', 'profile.nickname': 'Display name', 'profile.displayName': 'Known in the guild as', 'profile.gender': 'Gender', 'profile.genderUndisclosed': 'Prefer not to say', 'profile.genderFemale': 'Female', 'profile.genderMale': 'Male', 'profile.birthDate': 'Birthday', 'profile.region': 'Region', 'profile.bio': 'A few words about you', 'profile.bioPlaceholder': 'Games you love, how you like to play, or what makes a good night…', 'profile.tags': 'Games & interests', 'profile.anonymous': 'Appear anonymously in rankings', 'profile.anonymousHint': 'Your display name will be hidden on public leaderboards.', 'profile.changeAvatar': 'Change portrait', 'profile.uploading': 'Uploading…', 'profile.avatarHint': 'JPG, PNG or WebP · up to 5 MB', 'profile.avatarError': 'Choose a JPG, PNG or WebP image under 5 MB.', 'profile.save': 'Save changes', 'profile.saving': 'Saving…', 'profile.cancel': 'Cancel', 'profile.saved': 'Your personal details have been saved.', 'profile.loadError': 'Your profile could not be loaded. Try again.', 'profile.notSet': 'Not set', 'profile.bioEmpty': 'Add a few words so companions know what kind of games you enjoy.', 'profile.noTags': 'No interests selected', 'profile.account': 'Account', 'profile.rankingPrivacy': 'Leaderboard name', 'profile.anonymousOn': 'Anonymous', 'profile.anonymousOff': 'Display name visible'
  },
  zh: {
    'profile.regionSearch': '搜索国家或地区…', 'profile.regionEmpty': '没有找到匹配的地区', 'profile.regionToggle': '展开或收起地区',
    'nav.home': '首页', 'nav.shop': '奇物商店', 'nav.membership': '会员体系', 'nav.language': 'EN',
    'nav.theme': '切换色彩主题', 'nav.menu': '打开导航', 'nav.close': '关闭导航',
    'hero.eyebrow': '为值得铭记的游戏而设的公会', 'hero.title': '找到让每一次对局都更有意义的陪伴',
    'hero.body': 'Mystikos 汇聚专业陪玩、温柔仪式感，以及值得珍藏的品牌小物。',
    'hero.primary': '认识公会伙伴', 'hero.secondary': '探索商店', 'hero.cardTitle': '今夜星群',
    'hero.cardText': '三位陪玩已就位，准备与你分享一点不一样的游戏时光。', 'hero.online': '正在在线',
    'social.label': '一种更安静的公会氛围', 'social.value': '12,400+ 个共度夜晚',
    'companions.eyebrow': '精选陪玩', 'companions.title': '好游戏值得好陪伴',
    'companions.all': '查看全部陪玩', 'companions.book': '预约一局',
    'ranking.eyebrow': '本周公会', 'ranking.title': '让星群持续闪耀的人',
    'ranking.companions': '陪玩榜', 'ranking.bosses': '守护榜', 'ranking.score': '魅力值',
    'ranking.guardianScore': '守护值', 'ranking.change': '较上周', 'ranking.private': '隐私优先',
    'ranking.privateText': '守护榜仅展示平台昵称；完整隐私设置将在账号体系上线后提供。',
    'membership.eyebrow': '你在公会的位置', 'membership.title': '让共同故事慢慢成长的会员体系',
    'membership.body': '五个有意义的等级，围绕关怀而非攀比而设计。',
    'membership.level': '等级', 'membership.current': '你的当前旅程', 'membership.progress': '距离下一件纪念礼物',
    'intimacy.eyebrow': '关系，而非数字', 'intimacy.title': '小小仪式会成为共同的回忆',
    'intimacy.body': '你和每一位陪玩的亲密度都独一无二，由共同游戏、回归互动与礼物慢慢累积。',
    'intimacy.stage': '专属伙伴', 'intimacy.next': '再相聚 2 个夜晚即可解锁下一个故事', 'intimacy.gifts': '已解锁纪念物',
    'shop.eyebrow': '奇物商店', 'shop.title': '献给游戏之外世界的小物',
    'shop.body': '由公会精选的小批量物件，附有喜欢它的陪玩的真诚推荐。',
    'shop.visit': '进入奇物商店', 'shop.filter': '浏览', 'shop.wishlist': '加入心愿单',
    'shop.saved': '已收藏', 'shop.details': '查看详情', 'shop.recommended': '推荐人',
    'shop.back': '返回全部物件', 'shop.all': '全部物件', 'shop.fragrance': '香氛',
    'shop.accessories': '配饰', 'shop.apparel': '服饰', 'shop.stationery': '文具与礼盒',
    'shop.empty': '这个系列暂时还没有物件。', 'shop.note': '这是演示商品集，暂未开放下单或支付。',
    'footer.tagline': '找搭子，先找对公会。公会原型站。', 'footer.legal': '为更好的游戏之夜而设。', 'footer.guild': '公会', 'footer.companions': '陪玩推荐', 'footer.ranking': '排行榜', 'footer.membership': '等级体系', 'footer.shop': '商城', 'footer.fragrance': '香氛系列', 'footer.accessories': '配饰', 'footer.apparel': '服饰', 'footer.contact': '联系', 'footer.hours': '工作日 10:00–22:00', 'footer.privacy': '隐私政策', 'footer.terms': '服务条款',
    'modal.close': '关闭商品详情', 'modal.added': '已加入心愿单', 'modal.remove': '从心愿单移除',
    'auth.login': '登录', 'auth.register': '创建账户', 'auth.guild': '— Mystikos 公会 —',
    'auth.welcome': '欢迎回到星群',
    'auth.join': '在志趣相投的玩家中找到你的位置', 'auth.loginBody': '选择最适合你的登录方式，属于你的故事正在等你',
    'auth.registerBody': '献给每一位初次走进公会的新朋友。', 'auth.password': '账号与密码', 'auth.email': '邮箱验证码',
    'auth.discord': '使用 Discord 继续', 'auth.accountLabel': '账号名或邮箱', 'auth.accountPlaceholder': 'moonlit.finch',
    'auth.passwordLabel': '密码', 'auth.passwordPlaceholder': '至少 8 个字符', 'auth.emailLabel': '邮箱地址',
    'auth.emailPlaceholder': 'you@example.com', 'auth.codeLabel': '验证码', 'auth.codePlaceholder': '6 位验证码',
    'auth.sendCode': '发送验证码', 'auth.sending': '发送中…', 'auth.resendIn': '{seconds} 秒后可重发', 'auth.codeSent': '验证码已发送到你的邮箱。',
    'auth.remember': '在此设备上记住我', 'auth.forgot': '忘记密码？', 'auth.submitLogin': '进入 Mystikos',
    'auth.submitRegister': '开始你的故事', 'auth.or': '或使用以下方式继续', 'auth.discordNote': '正式环境中将跳转至 Discord 安全授权页面。',
    'auth.nameLabel': '展示昵称', 'auth.namePlaceholder': '希望公会如何称呼你？', 'auth.confirmLabel': '确认密码',
    'auth.terms': '我同意社区守则与隐私声明。', 'auth.member': '已经是成员？',
    'auth.newHere': '初次来到 Mystikos？', 'auth.switchLogin': '前往登录', 'auth.switchRegister': '创建账户',
    'auth.demo': '认证已连接 Mystikos API。', 'auth.successLogin': '公会之门已为你打开，欢迎回来。',
    'auth.successRegister': '你的星群位置已准备就绪。', 'auth.logout': '退出登录', 'auth.required': '请填写此项。', 'auth.discordConfig': '尚未配置 Discord 授权。',
    'auth.passwordLength': '请使用至少 8 个字符。', 'auth.match': '两次密码不一致。', 'auth.identifierFormat': '请使用邮箱地址或手机号登录。',
    'auth.cancel': '暂不退出', 'auth.confirmLogout': '确认退出', 'auth.logoutConfirmTitle': '要离开星群吗？', 'auth.logoutConfirmBody': '这台设备上的登录状态将结束，随时欢迎你回来。', 'auth.discordState': 'Discord 登录请求已失效或无法校验，请重新尝试。',
    'profile.title': '个人中心', 'profile.eyebrow': '你的 MYSTIKOS 档案', 'profile.greeting': '晚上好', 'profile.subtitle': '记录那些成为你故事一部分的游戏、伙伴与仪式。', 'profile.membership': '星群成员',
    'profile.gamesEyebrow': '共同游玩', 'profile.games': '我的游戏', 'profile.totalTime': '共同游戏时长', 'profile.walletEyebrow': '数字钱包', 'profile.wallet': '账户余额', 'profile.available': '可用余额', 'profile.topup': '充值', 'profile.withdraw': '提现收益', 'profile.topupNotice': '接入支付后即可充值。', 'profile.withdrawNotice': '绑定收款账户后即可提现。',
    'profile.achievementsEyebrow': '礼物与亲密度', 'profile.achievements': '共同达成', 'profile.achievementsBody': '在星群旅程中收集的每一个小小印记。', 'profile.intimacy': '与 Mika Sol 的亲密度', 'profile.intimacyNext': '再获得 320 点光芒即可解锁下一段故事', 'profile.ordersEyebrow': '订单档案', 'profile.orders': '历史订单', 'profile.ordersHint': '老板与陪玩服务记录', 'profile.order': '订单', 'profile.session': '服务', 'profile.duration': '时长', 'profile.total': '金额', 'profile.status': '状态',
    'profile.identityEyebrow': '你的身份名片', 'profile.identity': '个人资料', 'profile.edit': '修改资料', 'profile.loading': '正在读取你的档案…', 'profile.nickname': '昵称', 'profile.displayName': '星群中的名字', 'profile.gender': '性别', 'profile.genderUndisclosed': '不愿透露', 'profile.genderFemale': '女', 'profile.genderMale': '男', 'profile.birthDate': '生日', 'profile.region': '所在地区', 'profile.bio': '个性签名', 'profile.bioPlaceholder': '喜欢的游戏、游玩习惯，或你心中美好的游戏之夜…', 'profile.tags': '游戏与兴趣', 'profile.anonymous': '匿名参与排行榜', 'profile.anonymousHint': '公开排行榜中不会显示你的昵称。', 'profile.changeAvatar': '更换头像', 'profile.uploading': '上传中…', 'profile.avatarHint': '支持 JPG、PNG 或 WebP，最大 5 MB', 'profile.avatarError': '请选择小于 5 MB 的 JPG、PNG 或 WebP 图片。', 'profile.save': '保存更改', 'profile.saving': '保存中…', 'profile.cancel': '取消', 'profile.saved': '个人资料已保存。', 'profile.loadError': '暂时无法读取个人资料，请稍后重试。', 'profile.notSet': '暂未设置', 'profile.bioEmpty': '写几句话，让伙伴了解你喜欢怎样的游戏时光。', 'profile.noTags': '暂未选择兴趣', 'profile.account': '账号', 'profile.rankingPrivacy': '排行榜昵称', 'profile.anonymousOn': '匿名显示', 'profile.anonymousOff': '显示昵称'
  }
}

Object.assign(copy.en, {
  'nav.companions': 'Companions', 'nav.profileHome': 'Profile home', 'nav.profileHomeHint': 'Account, profile and security', 'nav.companionCard': 'Companion card', 'nav.companionCardHint': 'Edit your public card',
  'directory.eyebrow': 'COMPANION DIRECTORY · PUBLIC CARDS', 'directory.title': 'Who will you queue with tonight?', 'directory.open': 'Open to every Mystikos member', 'directory.intro': 'Explore games, play styles and availability. Choose a card to open the full public profile.', 'directory.search': 'Search name, game or play style', 'directory.filterLabel': 'Companion filters', 'directory.all': 'All', 'directory.heading': 'Guild companions', 'directory.count': '{count} companions', 'directory.verified': 'Verified companion', 'directory.sessions': '{count} sessions', 'directory.save': 'Save {name}', 'directory.unsave': 'Remove {name} from saved', 'directory.empty': 'No matching companions', 'directory.emptyHint': 'Try another name, game, or play style.', 'directory.loading': 'Loading companions…', 'directory.loadError': 'Could not load companions', 'directory.retry': 'Try again', 'directory.available': 'Available', 'directory.noTagline': 'Open the card to learn more', 'directory.viewCard': 'View card', 'directory.pagination': 'Companion pages', 'directory.previous': 'Previous', 'directory.next': 'Next', 'directory.page': 'Page {page} of {pages}',
  'public.back': 'Back to companions', 'public.verified': 'Verified companion', 'public.rating': 'Member rating', 'public.sessions': 'Sessions together', 'public.response': 'Response rate', 'public.invite': 'Invite this companion', 'public.invited': 'Invitation sent · awaiting response', 'public.highlights': 'HIGHLIGHTS', 'public.highlightsTitle': 'See how we play together.', 'public.highlight': 'Highlight', 'public.defaultHighlight': 'A calm comeback in the final round', 'public.voice': 'Voice note', 'public.voiceTitle': 'Hear my voice', 'public.previousPhoto': 'Previous photo', 'public.nextPhoto': 'Next photo', 'public.viewPhoto': 'View photo {count}', 'public.photoAlt': '{name} photo {count}'
})
Object.assign(copy.zh, {
  'nav.companions': '陪玩清单', 'nav.profileHome': '个人资料主页', 'nav.profileHomeHint': '账号、资料与安全', 'nav.companionCard': '陪玩名片', 'nav.companionCardHint': '编辑公开在线卡片',
  'directory.eyebrow': '陪玩清单 · 公开名片', 'directory.title': '今晚想和谁并肩', 'directory.open': '向所有 Mystikos 会员开放', 'directory.intro': '查看陪玩的擅长游戏、陪伴风格与当前状态。选择一张名片，进入完整公开主页。', 'directory.search': '搜索名称、游戏或陪伴风格', 'directory.filterLabel': '陪玩筛选', 'directory.all': '全部', 'directory.heading': '公会陪玩', 'directory.count': '共 {count} 位陪玩', 'directory.verified': '已认证陪玩', 'directory.sessions': '{count} 次同行', 'directory.save': '收藏 {name}', 'directory.unsave': '取消收藏 {name}', 'directory.empty': '没有找到匹配的陪玩', 'directory.emptyHint': '试试其他名称、游戏或陪伴风格。', 'directory.loading': '正在加载陪玩…', 'directory.loadError': '陪玩列表加载失败', 'directory.retry': '重新加载', 'directory.available': '当前可约', 'directory.noTagline': '进入名片了解更多', 'directory.viewCard': '查看名片', 'directory.pagination': '陪玩列表分页', 'directory.previous': '上一页', 'directory.next': '下一页', 'directory.page': '第 {page} / {pages} 页',
  'public.back': '返回陪玩清单', 'public.verified': '已认证陪玩', 'public.rating': '会员评分', 'public.sessions': '共同对局', 'public.response': '回应率', 'public.invite': '向这位陪玩发起邀请', 'public.invited': '邀请已发送 · 等待回应', 'public.highlights': '精彩操作', 'public.highlightsTitle': '先看看我们的默契。', 'public.highlight': '精彩操作', 'public.defaultHighlight': '残局中的冷静反攻', 'public.voice': '语音片段', 'public.voiceTitle': '听听我的声音', 'public.previousPhoto': '上一张', 'public.nextPhoto': '下一张', 'public.viewPhoto': '查看第 {count} 张照片', 'public.photoAlt': '{name} 的照片 {count}'
})

const companions: Companion[] = [
  { name: 'Ari Vale', role: 'The tactician', game: 'Valorant · Apex', rating: '4.96', rate: '$18 / hr', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=680&q=84', color: '#d5a7ff' },
  { name: 'Mika Sol', role: 'The storyteller', game: 'League · Cozy co-op', rating: '4.99', rate: '$16 / hr', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=680&q=84', color: '#f5c06f' },
  { name: 'Noah Ryn', role: 'The steady hand', game: 'Overwatch · FPS', rating: '4.92', rate: '$20 / hr', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=680&q=84', color: '#8bcad1' }
]

const rankings = {
  companions: [
    { place: '01', name: 'Mika Sol', note: 'League of Legends', score: '14,820', change: '+3' },
    { place: '02', name: 'Ari Vale', note: 'Valorant', score: '13,406', change: '+1' },
    { place: '03', name: 'Noah Ryn', note: 'Overwatch', score: '11,792', change: '—' },
    { place: '04', name: 'Jun Mora', note: 'Stardew Valley', score: '10,148', change: '+5' }
  ],
  bosses: [
    { place: '01', name: 'Moonlit Finch', note: 'Anonymous guardian', score: '28,600', change: '+2' },
    { place: '02', name: 'C. North', note: 'Guardian since spring', score: '21,940', change: '—' },
    { place: '03', name: 'Velvet Atlas', note: 'Anonymous guardian', score: '18,500', change: '+6' },
    { place: '04', name: 'Wren', note: 'Guardian since summer', score: '15,720', change: '+1' }
  ]
}

const products: Product[] = [
  { id: 'amber-candle', name: 'Ember Hour Candle', category: 'fragrance', price: '$28', description: 'Smoked cedar, amber resin and a soft trace of fig. Poured for the moment after a very good game.', image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=84', companion: 'Mika Sol' },
  { id: 'luna-earrings', name: 'Luna Thread Earrings', category: 'accessories', price: '$42', description: 'A pair of sculptural silver-finish earrings inspired by an orbit that almost closes.', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=84', companion: 'Ari Vale' },
  { id: 'night-tee', name: 'Night Shift Tee', category: 'apparel', price: '$36', description: 'A weighty cotton tee with a small constellation printed over the heart.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=84', companion: 'Noah Ryn' },
  { id: 'letters-set', name: 'After-Match Letters', category: 'stationery', price: '$18', description: 'Twelve illustrated note cards for the friends you mean to play with again.', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=84', companion: 'Mika Sol' },
  { id: 'oracle-keychain', name: 'Oracle Keychain', category: 'accessories', price: '$16', description: 'A tiny silver token, tactile enough to find at the bottom of any bag.', image: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=84', companion: 'Ari Vale' },
  { id: 'violet-mist', name: 'Violet Mist Room Spray', category: 'fragrance', price: '$24', description: 'Violet leaf, black tea and a rain-on-stone accord for slow evenings at home.', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=84', companion: 'Noah Ryn' }
]

export function useMystikos() {
  const locale = useState<Locale>('mystikos-locale', () => 'zh')
  const theme = useState<Theme>('mystikos-theme', () => 'dark')
  const wishlist = useState<string[]>('mystikos-wishlist', () => [])

  const t = (key: string, params: Record<string, string | number> = {}) => {
    const template = copy[locale.value][key] || copy.en[key] || key
    return Object.entries(params).reduce((value, [name, replacement]) => value.replaceAll(`{${name}}`, String(replacement)), template)
  }
  const setLocale = (value: Locale) => { locale.value = value }
  const toggleLocale = () => setLocale(locale.value === 'en' ? 'zh' : 'en')
  const applyTheme = () => {
    const saved = window.localStorage.getItem('mystikos-theme') as Theme | null
    if (saved === 'dark' || saved === 'light') theme.value = saved
    document.documentElement.dataset.theme = theme.value
  }
  const toggleTheme = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    if (import.meta.client) {
      window.localStorage.setItem('mystikos-theme', theme.value)
      document.documentElement.dataset.theme = theme.value
    }
  }
  const toggleWishlist = (id: string) => {
    wishlist.value = wishlist.value.includes(id)
      ? wishlist.value.filter(item => item !== id)
      : [...wishlist.value, id]
  }

  return { locale, theme, wishlist, t, toggleLocale, toggleTheme, applyTheme, toggleWishlist, companions, rankings, products }
}
