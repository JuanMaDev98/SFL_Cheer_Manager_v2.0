export type Lang = 'es' | 'en'

const translations: Record<Lang, Record<string, string>> = {
  es: {
    // Link Telegram
    'link.title': '¡Bienvenido a Sunflower Helpers!',
    'link.subtitle': 'Conecta tu cuenta de Telegram para chatear seguro y coordinar ayuda real.',
    'link.button': 'Vincular Telegram',
    'link.skip': 'Continuar sin vincular',
    'link.loading': 'Vinculando...',
    'link.error': 'No se pudo vincular. Intenta de nuevo.',
    'link.success': '¡Cuenta vinculada!',

    // Login (antes Register)
    'login.title': 'Iniciar Sesión',
    'login.subtitle': 'Ingresa tu Farm ID de Sunflower Land para verificar tu identidad.',
    'login.farmId': 'Farm ID',
    'login.farmId.placeholder': 'Ej: 1234',
    'login.farmId.error': 'Ingresa un Farm ID válido (solo números)',
    'login.loading': 'Buscando granja...',
    'login.button': 'Verificar ID',
    'login.confirm.title': '¿Son estos tus datos?',
    'login.confirm.subtitle': 'Verifica que la información es correcta antes de continuar.',
    'login.confirm.username': 'Nombre en el Juego',
    'login.confirm.button': 'Confirmar y Entrar',
    'login.confirm.button.loading': 'Entrando...',
    'login.confirm.back': 'No, corregir',
    'login.error.notFound': 'Granja no encontrada. Verifica tu Farm ID.',

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
    'create.post-title': 'Título del Post',
    'create.message': 'Mensaje / Descripción',
    'create.category': 'Categoría',
    'create.helpers-needed': 'Helpers necesarios',
    'create.submit': 'Publicar Post',
    'create.help-x-help': 'Help X Help',
    'create.cheer-x-cheer': 'Cheer X Cheer',
    'create.help-and-cheer': 'Help & Cheer',
    'create.flower-x-help': 'Flower X Help',

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
    'link.subtitle': 'Connect your Telegram account for secure chat and real coordination.',
    'link.button': 'Link Telegram',
    'link.skip': 'Continue without linking',
    'link.loading': 'Linking...',
    'link.error': 'Could not link. Try again.',
    'link.success': 'Account linked!',

    // Login (formerly Register)
    'login.title': 'Login',
    'login.subtitle': 'Enter your Sunflower Land Farm ID to verify your identity.',
    'login.farmId': 'Farm ID',
    'login.farmId.placeholder': 'e.g. 1234',
    'login.farmId.error': 'Enter a valid Farm ID (numbers only)',
    'login.loading': 'Searching farm...',
    'login.button': 'Verify ID',
    'login.confirm.title': 'Are these your details?',
    'login.confirm.subtitle': 'Verify the information is correct before continuing.',
    'login.confirm.username': 'In-Game Name',
    'login.confirm.button': 'Confirm & Enter',
    'login.confirm.button.loading': 'Entering...',
    'login.confirm.back': 'No, go back',
    'login.error.notFound': 'Farm not found. Check your Farm ID.',

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
    'create.post-title': 'Post Title',
    'create.message': 'Message / Description',
    'create.category': 'Category',
    'create.helpers-needed': 'Helpers needed',
    'create.submit': 'Publish Post',
    'create.help-x-help': 'Help X Help',
    'create.cheer-x-cheer': 'Cheer X Cheer',
    'create.help-and-cheer': 'Help & Cheer',
    'create.flower-x-help': 'Flower X Help',

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
