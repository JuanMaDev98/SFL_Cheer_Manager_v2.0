export type Lang = 'es' | 'en'

const translations: Record<Lang, Record<string, string>> = {
  es: {
    // Link Telegram
    'link.title': '¡Bienvenido a Sunflower Helpers!',
    'link.subtitle': 'Primero, vincula tu Telegram para chatear seguro y verificar identidad. Esto asegura helpers reales de Sunflower Land.',
    'link.button': 'Vincular mi Cuenta de Telegram',
    'link.skip': 'Continuar sin vincular',
    'link.loading': 'Vinculando...',
    'link.error': 'No se pudo vincular. Intenta de nuevo.',
    'link.success': '¡Cuenta vinculada!',

    // Register
    'reg.title': 'Ingresa tus datos',
    'reg.subtitle': 'Registra tu nick e ID para que farms te identifiquen y coordinen cheers diarios (limpiar farm, cheer ollas/monumentos/frutas).',
    'reg.nickname': 'Tu Nickname en Sunflower Land',
    'reg.nickname.placeholder': 'Ej: FarmerJoe',
    'reg.playerId': 'Tu ID de Jugador',
    'reg.playerId.placeholder': 'Ej: 0xabc123... o #1234',
    'reg.button': 'Guardar y Continuar',
    'reg.nickname.error': 'Solo letras, números y guiones bajos (3-20 chars)',
    'reg.playerId.error': 'Ingresa un ID válido',
    'reg.success': '¡Registro exitoso!',

    // Feed
    'feed.title': 'Sunflower Helpers',
    'feed.subtitle': 'Encuentra farms que necesitan ayuda y gana reciprocidad',
    'feed.create': 'Crear Post',
    'feed.all': 'Todos',
    'feed.urgent': 'Más Urgentes',
    'feed.almost-full': 'Casi Llenos',
    'feed.cooking': 'Con Pots Activas',
    'feed.helpers': 'Helpers',
    'feed.no-posts': 'No hay posts activos. ¡Sé el primero!',
    'feed.refresh': 'Actualizar',
    'feed.join': 'Entrar al Chat',

    // Post Detail
    'detail.helpers-remaining': 'Helpers restantes',
    'detail.join-btn': 'Unirme como Helper',
    'detail.joined': '¡Ya eres Helper!',
    'detail.cheer-btn': 'Enviar Cheer Confirm',
    'detail.remove': 'Eliminar Post',
    'detail.update': 'Actualizar Helpers',
    'detail.edit-msg': 'Editar Mensaje',
    'detail.send': 'Enviar',
    'detail.type-msg': 'Escribe un mensaje...',
    'detail.back': 'Volver',
    'detail.full': '¡Completo! Todos los helpers unidos 🎉',
    'detail.urgent': '¡Urgente! Pocos helpers restantes',
    'detail.owner-badge': '👑 Dueño',

    // Create Post
    'create.title': 'Crear Post de Ayuda',
    'create.farm-id': 'ID de tu Granja',
    'create.post-title': 'Título del Post',
    'create.message': 'Mensaje / Descripción',
    'create.category': 'Categoría',
    'create.helpers-needed': 'Helpers necesarios',
    'create.submit': 'Publicar Post',
    'create.cleaning': '🧹 Limpieza de Farm',
    'create.cooking': '🍲 Cooking Pot / Rifa',
    'create.monument': '⚡ Monumento / Buff',
    'create.fruit': '💚 Fruta Gigante / Love Charms',

    // My Posts
    'myposts.title': 'Mis Posts',
    'myposts.empty': 'Aún no has creado posts',
    'myposts.active': 'Activos',
    'myposts.completed': 'Completados',

    // Profile
    'profile.title': 'Mi Perfil',
    'profile.helpers-given': 'Helpers Dados',
    'profile.helpers-received': 'Helpers Recibidos',
    'profile.joined-chats': 'Chats Unidos',
    'profile.edit': 'Editar Perfil',
    'profile.logout': 'Cerrar Sesión',

    // Bottom Nav
    'nav.home': 'Inicio',
    'nav.my-posts': 'Mis Posts',
    'nav.profile': 'Perfil',
    'nav.lang': 'EN',

    // Notifications
    'notif.new-helper': '¡Nuevo helper joined!',
    'notif.joined': '¡Te uniste como helper!',
    'notif.confirmed': '¡Cheer confirmado!',
    'notif.post-deleted': 'Post eliminado',
    'notif.post-created': '¡Post creado exitosamente!',

    // General
    'general.loading': 'Cargando...',
    'general.error': 'Algo salió mal',
    'general.retry': 'Reintentar',
    'general.cancel': 'Cancelar',
    'general.save': 'Guardar',
    'general.close': 'Cerrar',
    'general.of': 'de',
    'general.farm': 'Farm',
  },
  en: {
    // Link Telegram
    'link.title': 'Welcome to Sunflower Helpers!',
    'link.subtitle': 'First, link your Telegram for secure chat and identity verification. This ensures real Sunflower Land helpers.',
    'link.button': 'Link my Telegram Account',
    'link.skip': 'Continue without linking',
    'link.loading': 'Linking...',
    'link.error': 'Could not link. Try again.',
    'link.success': 'Account linked!',

    // Register
    'reg.title': 'Enter your details',
    'reg.subtitle': 'Register your nick and ID so farms can identify you and coordinate daily cheers (clean farm, cheer pots/monuments/fruits).',
    'reg.nickname': 'Your Sunflower Land Nickname',
    'reg.nickname.placeholder': 'e.g. FarmerJoe',
    'reg.playerId': 'Your Player ID',
    'reg.playerId.placeholder': 'e.g. 0xabc123... or #1234',
    'reg.button': 'Save and Continue',
    'reg.nickname.error': 'Only letters, numbers and underscores (3-20 chars)',
    'reg.playerId.error': 'Enter a valid ID',
    'reg.success': 'Registration successful!',

    // Feed
    'feed.title': 'Sunflower Helpers',
    'feed.subtitle': 'Find farms needing help and earn reciprocity',
    'feed.create': 'Create Post',
    'feed.all': 'All',
    'feed.urgent': 'Most Urgent',
    'feed.almost-full': 'Almost Full',
    'feed.cooking': 'Active Pots',
    'feed.helpers': 'Helpers',
    'feed.no-posts': 'No active posts. Be the first!',
    'feed.refresh': 'Refresh',
    'feed.join': 'Join Chat',

    // Post Detail
    'detail.helpers-remaining': 'Helpers remaining',
    'detail.join-btn': 'Join as Helper',
    'detail.joined': "You're already a Helper!",
    'detail.cheer-btn': 'Send Cheer Confirm',
    'detail.remove': 'Delete Post',
    'detail.update': 'Update Helpers',
    'detail.edit-msg': 'Edit Message',
    'detail.send': 'Send',
    'detail.type-msg': 'Type a message...',
    'detail.back': 'Back',
    'detail.full': 'Full! All helpers joined 🎉',
    'detail.urgent': 'Urgent! Few helpers remaining',
    'detail.owner-badge': '👑 Owner',

    // Create Post
    'create.title': 'Create Help Post',
    'create.farm-id': 'Your Farm ID',
    'create.post-title': 'Post Title',
    'create.message': 'Message / Description',
    'create.category': 'Category',
    'create.helpers-needed': 'Helpers needed',
    'create.submit': 'Publish Post',
    'create.cleaning': '🧹 Farm Cleaning',
    'create.cooking': '🍲 Cooking Pot / Raffle',
    'create.monument': '⚡ Monument / Buff',
    'create.fruit': '💚 Giant Fruit / Love Charms',

    // My Posts
    'myposts.title': 'My Posts',
    'myposts.empty': "You haven't created posts yet",
    'myposts.active': 'Active',
    'myposts.completed': 'Completed',

    // Profile
    'profile.title': 'My Profile',
    'profile.helpers-given': 'Helpers Given',
    'profile.helpers-received': 'Helpers Received',
    'profile.joined-chats': 'Chats Joined',
    'profile.edit': 'Edit Profile',
    'profile.logout': 'Log Out',

    // Bottom Nav
    'nav.home': 'Home',
    'nav.my-posts': 'My Posts',
    'nav.profile': 'Profile',
    'nav.lang': 'ES',

    // Notifications
    'notif.new-helper': 'New helper joined!',
    'notif.joined': 'You joined as a helper!',
    'notif.confirmed': 'Cheer confirmed!',
    'notif.post-deleted': 'Post deleted',
    'notif.post-created': 'Post created successfully!',

    // General
    'general.loading': 'Loading...',
    'general.error': 'Something went wrong',
    'general.retry': 'Retry',
    'general.cancel': 'Cancel',
    'general.save': 'Save',
    'general.close': 'Close',
    'general.of': 'of',
    'general.farm': 'Farm',
  },
}

export function t(key: string, lang: Lang = 'es'): string {
  return translations[lang]?.[key] || translations.es[key] || key
}

export default translations
