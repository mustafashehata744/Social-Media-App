import type { AppNotification, Conversation, FriendRequest, Post, Story, User, UserSettings } from '@/types'
import avatar1 from '@/img/demo-avatar-1.jpg'
import avatar2 from '@/img/demo-avatar-2.jpg'
import avatar3 from '@/img/demo-avatar-3.jpg'
import avatar4 from '@/img/demo-avatar-4.jpg'
import avatar5 from '@/img/demo-avatar-5.jpg'
import avatar6 from '@/img/demo-avatar-6.jpg'
import avatar7 from '@/img/demo-avatar-7.jpg'
import avatar8 from '@/img/demo-avatar-8.jpg'
import postPhoto1 from '@/img/demo-post-1.jpg'
import postPhoto2 from '@/img/demo-post-2.jpg'

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const uploadedAvatars = [
  avatar1,
  avatar2,
  avatar3,
  avatar4,
  avatar5,
  avatar6,
  avatar7,
  avatar8,
]

export const seedUsers: User[] = [
  {
    id: 'u1', name: 'أحمد محمد', email: 'ahmed@tawasol.com',
    avatar: uploadedAvatars[0], bio: 'مهندس برمجيات، أحب القراءة والقهوة ☕', location: 'القاهرة، مصر',
    work: 'مهندس في شركة ناشئة', cover: 'from-sky-500 via-blue-500 to-indigo-600', joinedAt: ago(60 * 24 * 400),
  },
  {
    id: 'u2', name: 'سارة عبدالله', email: 'sara@tawasol.com', verified: true, lastSeen: ago(2),
    avatar: uploadedAvatars[1], bio: 'مصمّمة تجربة مستخدم، أؤمن بالتفاصيل الصغيرة ✨', location: 'الرياض، السعودية',
    work: 'UX Designer', cover: 'from-rose-400 via-pink-500 to-fuchsia-600', joinedAt: ago(60 * 24 * 320),
  },
  {
    id: 'u3', name: 'خالد العتيبي', email: 'khaled@tawasol.com', verified: true, lastSeen: ago(40),
    avatar: uploadedAvatars[2], bio: 'مصوّر هاوي، ألتقط اللحظات اللي بتخلّد 🎞️', location: 'الكويت',
    work: 'مصوّر freelance', cover: 'from-amber-400 via-orange-500 to-red-500', joinedAt: ago(60 * 24 * 280),
  },
  {
    id: 'u4', name: 'منى حسن', email: 'mona@tawasol.com',
    avatar: uploadedAvatars[3], bio: 'مدرّسة لغة عربية، وعاشقة للكتب 📖', location: 'عمّان، الأردن',
    work: 'مدرّسة', cover: 'from-emerald-400 via-teal-500 to-cyan-600', joinedAt: ago(60 * 24 * 210),
  },
  {
    id: 'u5', name: 'يوسف القحطاني', email: 'yousef@tawasol.com',
    avatar: uploadedAvatars[4], bio: 'شغوف بالرياضة والتقنية معًا', location: 'جدة، السعودية',
    work: 'محلل بيانات', cover: 'from-violet-500 via-purple-500 to-indigo-700', joinedAt: ago(60 * 24 * 150),
  },
  {
    id: 'u6', name: 'ليلى ناصر', email: 'layla@tawasol.com',
    avatar: uploadedAvatars[5], bio: 'أحب الطبيعة والسفر، كل رحلة حكاية 🌍', location: 'الدار البيضاء، المغرب',
    work: 'كاتبة محتوى', cover: 'from-lime-400 via-green-500 to-emerald-700', joinedAt: ago(60 * 24 * 90),
  },
  { id: 'u7', name: 'نور علي', email: 'nour@tawasol.com', avatar: uploadedAvatars[6], bio: 'أصنع أشياء جميلة من أفكار بسيطة ✨', location: 'بيروت، لبنان', work: 'مصممة جرافيك', cover: 'from-fuchsia-400 via-pink-500 to-rose-600', joinedAt: ago(60 * 24 * 75) },
  { id: 'u8', name: 'عمر سامي', email: 'omar@tawasol.com', avatar: uploadedAvatars[7], bio: 'أتعلم شيئًا جديدًا كل يوم', location: 'الإسكندرية، مصر', work: 'طالب هندسة', cover: 'from-cyan-400 via-sky-500 to-blue-700', joinedAt: ago(60 * 24 * 68) },
  { id: 'u9', name: 'ريم فهد', email: 'reem@tawasol.com', avatar: uploadedAvatars[0], bio: 'أحب القهوة والكتب والبحر ☕📚', location: 'الدمام، السعودية', work: 'كاتبة', cover: 'from-orange-400 via-amber-500 to-yellow-600', joinedAt: ago(60 * 24 * 60) },
  { id: 'u10', name: 'زياد منصور', email: 'ziad@tawasol.com', verified: true, avatar: uploadedAvatars[1], bio: 'مطور ويب ومهتم بالتقنية', location: 'دبي، الإمارات', work: 'مطور واجهات', cover: 'from-indigo-500 via-blue-600 to-cyan-500', joinedAt: ago(60 * 24 * 54) },
  { id: 'u11', name: 'هند محمود', email: 'hend@tawasol.com', avatar: uploadedAvatars[2], bio: 'أشارككم تفاصيل يومي وأفكاري 🌷', location: 'الخرطوم، السودان', work: 'طبيبة', cover: 'from-rose-400 via-red-500 to-orange-500', joinedAt: ago(60 * 24 * 48) },
  { id: 'u12', name: 'كريم عادل', email: 'karim@tawasol.com', avatar: uploadedAvatars[3], bio: 'رياضة، سفر، وتجارب جديدة', location: 'تونس، تونس', work: 'مدرب رياضي', cover: 'from-green-400 via-emerald-500 to-teal-700', joinedAt: ago(60 * 24 * 42) },
  { id: 'u13', name: 'مريم يوسف', email: 'mariam@tawasol.com', avatar: uploadedAvatars[4], bio: 'أتعلم التصوير وأحفظ اللحظات الجميلة 📷', location: 'المنامة، البحرين', work: 'مصورة', cover: 'from-violet-500 via-purple-500 to-fuchsia-600', joinedAt: ago(60 * 24 * 35) },
  { id: 'u14', name: 'آدم رامي', email: 'adam@tawasol.com', avatar: uploadedAvatars[5], bio: 'موسيقى هادئة وأفكار كبيرة 🎧', location: 'مسقط، عُمان', work: 'موسيقي', cover: 'from-slate-500 via-gray-600 to-zinc-800', joinedAt: ago(60 * 24 * 28) },
]

const sunsetDemo = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fb7185"/><stop offset="0.5" stop-color="#f59e0b"/><stop offset="1" stop-color="#4f46e5"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e1b4b" stop-opacity="0"/><stop offset="1" stop-color="#1e1b4b" stop-opacity="0.55"/></linearGradient></defs><rect width="900" height="600" fill="url(#g)"/><circle cx="690" cy="190" r="72" fill="#fff" opacity="0.8"/><path d="M0 430 L180 300 L320 410 L470 260 L650 430 L900 320 L900 600 L0 600 Z" fill="url(#s)"/></svg>',
)}`

export const seedPosts: Post[] = [
  {
    id: 'p1', authorId: 'u2',
    content: 'خلصت اليوم أول نسخة من تصميم تطبيق تواصل 🎉\nالحقيقة إني متحمسة جدًا للنتيجة، أفكار كتير اتحولت من ورقة لشاشة حقيقية.\nقولوا لي رأيكم في التعقيبات 👇',
    feeling: 'متحمسة', createdAt: ago(48), likes: ['u1', 'u3', 'u4', 'u5'],
    comments: [
      { id: 'c1', postId: 'p1', authorId: 'u1', content: 'تصميم تحفة! الألوان مريحة جدًا 👏', createdAt: ago(40), likes: ['u2'] },
      { id: 'c2', postId: 'p1', authorId: 'u3', content: 'الخط العربي واضح وجميل، عمل رائع سارة', createdAt: ago(25), likes: [] },
    ],
    shares: 3,
  },
  {
    id: 'p2', authorId: 'u3',
    content: 'غروب الأمس من فوق الجبل… أحيانًا المشهد الواحد بيغني عن ألف كلمة 🌅',
    images: [sunsetDemo],
    createdAt: ago(180), likes: ['u1', 'u2', 'u4', 'u5', 'u6'],
    comments: [
      { id: 'c3', postId: 'p2', authorId: 'u6', content: 'يا سلام! وين هذا المكان؟', createdAt: ago(150), likes: ['u3'] },
    ],
    shares: 7,
  },
  {
    id: 'p3', authorId: 'u1',
    content: 'سؤال للجميع: إيه أكتر حاجة بتخليك تكمّل مشروعك لما الإحباط يجي؟\nأنا بحاول أقسّم الشغل لقطع صغيرة، والإنجاز الصغير بيحرّكني 💪',
    createdAt: ago(420), likes: ['u2', 'u5'],
    comments: [
      { id: 'c4', postId: 'p3', authorId: 'u4', content: 'أنا أبدأ بخمس دقائق بس، وبعدها البيت يكبر 😊', createdAt: ago(400), likes: ['u1', 'u2'] },
      { id: 'c5', postId: 'p3', authorId: 'u5', content: 'أذكّر نفسي ليه بدأت أصلًا', createdAt: ago(360), likes: [] },
    ],
    shares: 1,
    poll: {
      question: 'إيه اللي بيحرّكك أكتر في الشغل؟',
      options: [
        { id: 'po1', text: 'الإنجاز الصغير', votes: ['u2', 'u4'] },
        { id: 'po2', text: 'تشجيع الناس', votes: ['u1', 'u5'] },
        { id: 'po3', text: 'فضول المعرفة', votes: [] },
      ],
    },
  },
  {
    id: 'p4', authorId: 'u4',
    content: 'نصيحة للطلبة: أساس قوي في اللغة العربية يفتح لك أبواب كتير، مش بس في الأدب، لكن في البرمجة والتصميم كمان.\nاللغة اللي بنفكّر بيها بتشكّل طريقة تفكيرنا ✍️',
    createdAt: ago(60 * 20), likes: ['u1', 'u2', 'u3', 'u6'],
    comments: [
      { id: 'c6', postId: 'p4', authorId: 'u2', content: 'كلام مهم جدًا، اللغة فعلًا أساس التعبير والتفكير 👏', createdAt: ago(60 * 18), likes: ['u4'] },
      { id: 'c7', postId: 'p4', authorId: 'u8', content: 'بدأت أتعلم العربية بشكل أعمق، والنصيحة دي شجعتني ✍️', createdAt: ago(60 * 16), likes: [] },
    ], shares: 12,
  },
  { id: 'p5', authorId: 'u7', content: 'تفاصيل بسيطة من مشروع الهوية البصرية اللي اشتغلت عليه الأسبوع ده. بحب أشوف الفكرة وهي بتاخد شكلها النهائي 🎨', createdAt: ago(60 * 25), likes: ['u1', 'u2', 'u9', 'u13'], comments: [{ id: 'c8', postId: 'p5', authorId: 'u2', content: 'الألوان متناسقة جدًا والشغل مميز يا نور ✨', createdAt: ago(60 * 23), likes: ['u7'] }], shares: 2 },
  { id: 'p6', authorId: 'u8', content: 'يوم جميل على البحر في إسكندرية 🌊 أحيانًا محتاجين نفصل شوية ونرجع بطاقة أحسن.', images: [sunsetDemo], createdAt: ago(60 * 30), likes: ['u3', 'u6', 'u12'], comments: [{ id: 'c9', postId: 'p6', authorId: 'u12', content: 'أحلى مكان للراحة فعلًا!', createdAt: ago(60 * 28), likes: [] }], shares: 1 },
  { id: 'p7', authorId: 'u9', content: 'أنهيت رواية رائعة هذا الأسبوع. القراءة مش بس هواية، دي فرصة نعيش حيوات وتجارب مختلفة 📚', createdAt: ago(60 * 38), likes: ['u4', 'u6', 'u11'], comments: [{ id: 'c10', postId: 'p7', authorId: 'u4', content: 'رشحيها لنا! أحب اكتشاف كتب جديدة 😊', createdAt: ago(60 * 36), likes: ['u9'] }], shares: 4 },
  { id: 'p8', authorId: 'u10', content: 'خلصت أول نسخة من موقعي الجديد باستخدام React. ممتن لكل شخص ساعدني بمعلومة أو تشجيع 💻', createdAt: ago(60 * 45), likes: ['u1', 'u5', 'u8', 'u14'], comments: [{ id: 'c11', postId: 'p8', authorId: 'u1', content: 'مبروك يا زياد! البداية دي أهم خطوة 👏', createdAt: ago(60 * 42), likes: ['u10'] }], shares: 2 },
  { id: 'p9', authorId: 'u11', content: 'رسالة صغيرة: خذوا وقتكم في الراحة والاهتمام بأنفسكم. الإنجاز مهم، لكن صحتكم أهم 💚', createdAt: ago(60 * 53), likes: ['u2', 'u4', 'u6', 'u9'], comments: [{ id: 'c12', postId: 'p9', authorId: 'u6', content: 'كلام يذكّرنا بالأولويات، شكرًا يا هند 💚', createdAt: ago(60 * 50), likes: ['u11'] }], shares: 5 },
  { id: 'p10', authorId: 'u12', content: 'تمرين الصباح خلص، وأحلى إحساس إنك تبدأ يومك بنشاط 💪 مين بيحب يتمرن بدري؟', createdAt: ago(60 * 65), likes: ['u5', 'u8', 'u10'], comments: [{ id: 'c13', postId: 'p10', authorId: 'u5', content: 'أفضل وقت للتمرين قبل ما اليوم يزحم! ⚽', createdAt: ago(60 * 62), likes: [] }], shares: 0 },
  { id: 'p11', authorId: 'u13', content: 'جربت أصور وقت الغروب لأول مرة، والنتيجة فاقت توقعاتي 🌅📷', images: [sunsetDemo], createdAt: ago(60 * 78), likes: ['u3', 'u7', 'u9'], comments: [{ id: 'c14', postId: 'p11', authorId: 'u3', content: 'لقطة جميلة جدًا! استمري 👏', createdAt: ago(60 * 75), likes: ['u13'] }], shares: 1 },
  { id: 'p12', authorId: 'u14', content: 'شاركت في جلسة موسيقية صغيرة مع أصدقاء جدد. لحظات بسيطة بس بتفضل في الذاكرة 🎶', createdAt: ago(60 * 92), likes: ['u1', 'u6', 'u11'], comments: [{ id: 'c15', postId: 'p12', authorId: 'u7', content: 'يا سلام! نفسي أسمع تسجيل منها 🎵', createdAt: ago(60 * 90), likes: [] }], shares: 2 },
  { id: 'p13', authorId: 'u5', content: 'مباراة قوية ومليانة حماس اليوم! الرياضة بتجمع الناس مهما اختلفت اهتماماتهم ⚽', createdAt: ago(60 * 110), likes: ['u1', 'u3', 'u12'], comments: [{ id: 'c16', postId: 'p13', authorId: 'u12', content: 'كانت مباراة ممتعة فعلًا 🔥', createdAt: ago(60 * 105), likes: ['u5'] }], shares: 3 },
  { id: 'p14', authorId: 'u6', content: 'كل رحلة بتعلمني حاجة جديدة عن العالم وعن نفسي. ممتنة لكل طريق وكل حكاية 🌍', createdAt: ago(60 * 130), likes: ['u2', 'u4', 'u9', 'u13'], comments: [{ id: 'c17', postId: 'p14', authorId: 'u9', content: 'وكل صورة من رحلاتك بتحكي حكاية جميلة 💚', createdAt: ago(60 * 127), likes: ['u6'] }], shares: 6 },
  { id: 'p15', authorId: 'u3', content: 'لقطة من رحلتنا اليوم. الضوء الطبيعي خلّى اللحظة أحلى من كل المخططات 📸', images: [postPhoto1], createdAt: ago(60 * 145), likes: ['u1', 'u2', 'u13'], comments: [], shares: 2 },
  { id: 'p16', authorId: 'u7', content: 'تفاصيل من مكان هادي جمعتنا السعي والإلهام. شاركوني رأيكم في التكوين 🎨', images: [postPhoto2], createdAt: ago(60 * 160), likes: ['u4', 'u9', 'u10'], comments: [], shares: 1 },
  { id: 'p17', authorId: 'u13', content: 'تجربة تصوير جديدة: أبسط زاوية ممكن تحكي حكاية كبيرة!', images: [postPhoto1, postPhoto2], createdAt: ago(60 * 180), likes: ['u3', 'u6', 'u11'], comments: [], shares: 3 },
  { id: 'p18', authorId: 'u8', content: 'خدنا استراحة من الشاشات وشوفنا العالم حوالينا للراحة قبل الرجوع للشغل 🌿', createdAt: ago(60 * 205), likes: ['u1', 'u5', 'u12'], comments: [], shares: 0 },
  { id: 'p19', authorId: 'u10', content: 'صور من جلسة العمل الجماعي، الحماس الحقيقي بيبان في الأخر يا جماعة 👨‍💻', images: [postPhoto2], createdAt: ago(60 * 230), likes: ['u1', 'u8', 'u14'], comments: [], shares: 4 },
  { id: 'p20', authorId: 'u14', content: 'ذكرى صغيرة من يوم طويل مليان ضحك ومناقشات حلوة. شاركوا ذكرى مشابهة 🎶', images: [postPhoto1], createdAt: ago(60 * 260), likes: ['u7', 'u9', 'u11'], comments: [], shares: 2 },
]

export const seedFriendRequests: FriendRequest[] = [
  { id: 'fr1', fromId: 'u5', toId: 'u1', status: 'pending', createdAt: ago(30) },
  { id: 'fr2', fromId: 'u6', toId: 'u1', status: 'pending', createdAt: ago(60 * 5) },
  { id: 'fr3', fromId: 'u1', toId: 'u3', status: 'accepted', createdAt: ago(60 * 24 * 10) },
  { id: 'fr4', fromId: 'u2', toId: 'u1', status: 'accepted', createdAt: ago(60 * 24 * 20) },
  { id: 'fr5', fromId: 'u4', toId: 'u1', status: 'accepted', createdAt: ago(60 * 24 * 40) },
  { id: 'fr6', fromId: 'u1', toId: 'u5', status: 'rejected', createdAt: ago(60 * 24 * 60) },
  ...[
    ['u1', 'u7'], ['u1', 'u8'], ['u1', 'u9'], ['u1', 'u10'], ['u1', 'u11'], ['u1', 'u12'], ['u1', 'u13'], ['u1', 'u14'],
    ['u2', 'u7'], ['u2', 'u9'], ['u3', 'u8'], ['u3', 'u13'], ['u4', 'u11'], ['u5', 'u12'], ['u6', 'u9'],
    ['u7', 'u13'], ['u8', 'u10'], ['u9', 'u11'], ['u10', 'u14'], ['u12', 'u14'],
  ].map(([fromId, toId], index) => ({
    id: `fr_seed_${index}`, fromId, toId, status: 'accepted' as const, createdAt: ago(60 * 24 * (index + 2)),
  })),
]

export const seedStories: Story[] = [
  { id: 's1', authorId: 'u2', content: 'صباح مليء بالأفكار الجديدة ✨', image: sunsetDemo, createdAt: ago(45), expiresAt: ago(-60 * 23), viewedBy: ['u1', 'u3'], replies: [{ id: 'sr1', authorId: 'u1', text: 'صباح النور! قصصة ملهمة 🌞', createdAt: ago(30) }], highlight: true },
  { id: 's2', authorId: 'u3', content: 'لحظة هدوء بعد يوم طويل 🌅', image: sunsetDemo, createdAt: ago(90), expiresAt: ago(-60 * 22) },
  { id: 's3', authorId: 'u6', content: 'الطبيعة دائمًا أفضل مكان لإعادة الشحن 🌿', createdAt: ago(150), expiresAt: ago(-60 * 21) },
  { id: 's4', authorId: 'u7', content: 'بدأت مشروعًا جديدًا اليوم! 🎨', createdAt: ago(200), expiresAt: ago(-60 * 20) },
  { id: 's5', authorId: 'u9', content: 'استراحة قهوة وكتاب ☕', createdAt: ago(300), expiresAt: ago(-60 * 19) },
]

export const seedConversations: Conversation[] = [
  {
    id: 'conv1', participantIds: ['u1', 'u2'], updatedAt: ago(12),
    messages: [
      { id: 'm1', senderId: 'u2', text: 'صباح الخير أحمد! شفت رسالتك بخصوص التصميم؟', createdAt: ago(50), read: true },
      { id: 'm2', senderId: 'u1', text: 'صباح النور سارة، أيوة وصلتني والملاحظات مفيدة جدًا 🙌', createdAt: ago(44), read: true },
      { id: 'm3', senderId: 'u2', text: 'تمام! ممكن نراجع التفاصيل بكرة على مكالمة؟', createdAt: ago(12), read: false },
    ],
  },
  {
    id: 'conv2', participantIds: ['u1', 'u3'], updatedAt: ago(60 * 3),
    messages: [
      { id: 'm4', senderId: 'u3', text: 'الصور اللي بعتها لك طلعت حلوة والله 🎞️', createdAt: ago(60 * 4), read: true },
      { id: 'm5', senderId: 'u1', text: 'أكيد! هختار أفضلهم وأحطهم في البروفايل', createdAt: ago(60 * 3), read: true },
    ],
  },
  {
    id: 'conv3', participantIds: ['u1', 'u4'], updatedAt: ago(60 * 26),
    messages: [
      { id: 'm6', senderId: 'u4', text: 'شكرًا على مشاركة المقال، القيمة فيه كبيرة 📚', createdAt: ago(60 * 26), read: true },
    ],
  },
]

export const seedNotifications: AppNotification[] = [
  { id: 'n1', userId: 'u1', type: 'friend', actorId: 'u5', text: 'أرسل لك طلب صداقة', createdAt: ago(30), read: false, href: '/friends' },
  { id: 'n2', userId: 'u1', type: 'like', actorId: 'u3', text: 'أعجب بمنشورك', createdAt: ago(120), read: false, href: '/feed' },
  { id: 'n3', userId: 'u1', type: 'comment', actorId: 'u4', text: 'علّقت على منشورك: «أنا أبدأ بخمس دقائق بس»', createdAt: ago(400), read: true, href: '/feed' },
  { id: 'n4', userId: 'u1', type: 'message', actorId: 'u2', text: 'أرسلت لك رسالة جديدة', createdAt: ago(12), read: false, href: '/messages' },
  { id: 'n5', userId: 'u1', type: 'system', text: 'مرحبًا بك في تواصل! استكشف الأصدقاء وابدأ المشاركة 🎉', createdAt: ago(60 * 24 * 30), read: true, href: '/feed' },
]

export const defaultSettings = (userId: string): UserSettings => ({
  userId, theme: 'system', background: 'default', language: 'ar', notifyLikes: true, notifyComments: true,
  notifyFriends: true, notifyMessages: true, privateAccount: false, showEmail: false,
  pushNotifications: false, themeSchedule: false, scheduleStart: '22:00', scheduleEnd: '06:00',
})
