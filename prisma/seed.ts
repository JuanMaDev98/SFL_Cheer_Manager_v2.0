import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CATEGORIES = ['cleaning', 'cooking', 'monument', 'fruit'] as const
const AVATARS = 6

const SAMPLE_NICKNAMES = [
  'SunflowerJoe', 'FarmerMax', 'GoldenSeed', 'CropQueen', 'HarvestKing',
  'PumpkinPete', 'DaisyDuke', 'CornLord', 'WheatWiz', 'RadishRex',
  'BarnBessie', 'PlowMaster', 'GardenGuru', 'TractorTom', 'BeanstalkBen',
  'MelonMia', 'PepperPatty', 'OnionOscar', 'LettuceLiz', 'CarrotCarl'
]

const FARM_NAMES = [
  'Sunflower Paradise', 'Golden Acres', 'Green Valley Farm', 'Harvest Moon Ranch',
  'Blooming Fields', 'Pixel Farm #42', 'Bumpkin Barn', 'Cozy Crop Land',
  'Happy Harvest', 'Seed & Soil Station', 'Farm Frenzy Central', 'Girly Farm Club',
  'Crypto Crops', 'NFT Nursery', 'Web3 Wheat Works', 'Degen Farms',
  'Alpha Acres', 'Diamond Dirt', 'Emerald Estate', 'Platinum Pasture'
]

const TITLES = {
  cleaning: [
    '¡Ayuda limpiando mi farm!',
    'Necesito helpers para limpieza 🧹',
    'Maleza y basura por limpiar',
    'Limpiemos juntos mi granja',
    'Basura invadió mi farm 😱'
  ],
  cooking: [
    '¡Cooking Pot Expert lista!',
    'Helpers para rifa Food Box 🍲',
    'Mi olla necesita más helpers',
    'Rifa Silver Food Box abierta',
    'Pot Master necesita apoyo culinario'
  ],
  monument: [
    'Monumento necesita buffs ⚡',
    '¿Me ayudas con el monumento?',
    'Buff social activo - únete',
    'Monumento comunitario en progreso',
    'Fortalezcamos el monumento juntos'
  ],
  fruit: [
    'Fruta Gigante lista para charms 💚',
    'Love Charms en mi fruta enorme',
    '¿Quieres帮我 con Giant Fruit?',
    'Super Fruit necesita tu ayuda',
    'Love Charm Rally - Fruta Gigante'
  ]
}

const MESSAGES = {
  cleaning: [
    'Necesito ayuda limpiando basura, maleza y estiércol. ¡Reciprocidad garantizada con mis cheers diarios!',
    'Mi farm está llena de obstáculos. ¿Me ayudas a limpiar? Te devuelvo el favor mañana.',
    '¡Urgente! Necesito 3 cheers más para tener mi farm impecable. Te ayudo con la tuya.',
    'Limpieza express: basura y maleza bloqueando mis cultivos. ¡Helpers wanted!',
    'Soy nuevo, necesito helpers experimentados para limpiar mi granja completa.'
  ],
  cooking: [
    'Mi Cooking Pot Expert está lista. Necesito helpers para rifa Silver Food Box. ¡Grandes premios!',
    'Olla de cocina activa, falta poco para completar helpers. ¡Únete que casi llenamos!',
    'Food Box rifa en curso. Los que ayuden hoy, les ayudaré mañana sin falta.',
    'Pot nivel Expert - necesitamos más manos para la rifa. ¡No te lo pierdas!',
    'Cocinando algo especial y necesito helpers para acelerar. ¿Te animas?'
  ],
  monument: [
    'Buff social del monumento activo. ¡Únete para potenciarlo y recibir recompensas!',
    'Necesito helpers para completar el monumento. Cuanto más helpers, mejor buff para todos.',
    'Monumento comunitario a punto de completarse. ¡Faltan los últimos helpers!',
    'Ayuda al monumento de la comunidad y gana buffs exclusivos para tu farm.',
    '¡Únete al monumento! Necesitamos más builders para el buff máximo.'
  ],
  fruit: [
    'Mi Fruta Gigante está lista para Love Charms. ¡Únete y gana recompensas!',
    'Giant Fruit needs your Love Charms. ¡Te doy likes y cheers a cambio!',
    'La fruta más grande de la comunidad necesita tu ayuda. ¡Vamos juntos!',
    'Love Charm Rally activo en mi Giant Fruit. ¡Cada charm cuenta!',
    'Super harvest en camino. ¿Me ayudas con Love Charms en mi fruta?'
  ]
}

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.chatMessage.deleteMany()
  await prisma.helperJoin.deleteMany()
  await prisma.farmPost.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const users = []
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        telegramId: `tg_${i + 100}`,
        nickname: SAMPLE_NICKNAMES[i],
        playerId: i < 5 ? `0x${Math.random().toString(16).slice(2, 10)}` : `#${1000 + i}`,
        avatarIndex: i % AVATARS,
        helpersGiven: Math.floor(Math.random() * 50),
        helpersReceived: Math.floor(Math.random() * 50),
      }
    })
    users.push(user)
  }
  console.log(`✅ Created ${users.length} users`)

  // Create posts
  const posts = []
  for (let i = 0; i < 25; i++) {
    const cat = CATEGORIES[i % 4]
    const titleList = TITLES[cat]
    const msgList = MESSAGES[cat]
    const helpersNeeded = [5, 8, 10, 12, 15, 20][Math.floor(Math.random() * 6)]
    const helpersCount = Math.floor(Math.random() * helpersNeeded)
    const owner = users[i % users.length]

    const post = await prisma.farmPost.create({
      data: {
        title: titleList[i % titleList.length],
        message: msgList[i % msgList.length],
        farmId: `${100 + i}`,
        category: cat,
        helpersNeeded,
        helpersCount,
        isActive: helpersCount < helpersNeeded,
        ownerId: owner.id,
      }
    })
    posts.push(post)

    // Add helper joins
    const shuffled = [...users].sort(() => Math.random() - 0.5)
    for (let j = 0; j < helpersCount && j < shuffled.length; j++) {
      if (shuffled[j].id !== owner.id) {
        await prisma.helperJoin.create({
          data: {
            postId: post.id,
            userId: shuffled[j].id,
            status: Math.random() > 0.3 ? 'confirmed' : 'joined',
          }
        })
      }
    }

    // Add some chat messages
    const msgCount = Math.floor(Math.random() * 5)
    for (let m = 0; m < msgCount; m++) {
      const chatUser = shuffled[m % shuffled.length]
      await prisma.chatMessage.create({
        data: {
          postId: post.id,
          userId: chatUser.id,
          nickname: chatUser.nickname,
          content: [
            '¡Listo! Ya eché mi cheer 🎉',
            '¿Cuántos helpers faltan?',
            'Acabo de limpiar la maleza 🧹',
            '¡Excelente! Gracias por la ayuda',
            'Yo ayudo con tu farm mañana 💪',
            'Primera vez ayudando, ¿cómo funciona?',
            '¡Confetti! 🎊 Llenamos el contador',
            'Necesito reciprocidad mañana, ¿va?',
          ][m % 8],
        }
      })
    }

    // Update helper stats
    await prisma.user.update({
      where: { id: owner.id },
      data: { helpersReceived: { increment: helpersCount } },
    })
  }
  console.log(`✅ Created ${posts.length} posts with helpers and chat messages`)
  console.log('🌻 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
