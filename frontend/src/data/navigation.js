import {
  Home, Inbox, Megaphone, FileText, ContactRound, Magnet, Bot, MoreHorizontal,
  Workflow, Braces, Store, CreditCard, UserCog, Settings, ReceiptText, Boxes,
  BookOpen, ShoppingBag, Landmark, BarChart3, ScrollText, Webhook, Link2,
  Layers3, Globe2, QrCode, MessageSquareMore
} from 'lucide-react'

export const quickLinks = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Inbox', path: '/inbox', icon: Inbox },
  {
    label: 'Campaign', icon: Megaphone,
    children: [
      { label: 'Broadcast', path: '/campaign/broadcast' },
      { label: 'Drip Campaign', path: '/campaign/drip' },
    ],
  },
  { label: 'Templates', path: '/templates', icon: FileText },
  { label: 'Contacts', path: '/contacts', icon: ContactRound, dividerBefore: true },
  {
    label: 'Lead Magnets', icon: Magnet,
    children: [
      { label: 'All Lead Magnets', path: '/lead-magnets' },
      { label: 'Website Widget', path: '/lead-magnets/website-widget' },
      { label: 'QR Code', path: '/lead-magnets/qr-code' },
    ],
  },
  { label: 'Chat Bot', path: '/chat-bot', icon: Bot },
]

export const moreLinks = [
  { label: 'Flows', path: '/flows', icon: Workflow },
  { label: 'Integrations', path: '/integrations', icon: Braces },
  {
    label: 'E-Commerce', icon: Store,
    children: [
      { label: 'Catalog Setting', path: '/e-commerce/catalog-setting' },
      { label: 'Catalog Management', path: '/e-commerce/catalog-management' },
      { label: 'Order', path: '/e-commerce/order' },
      { label: 'Payment Setup', path: '/e-commerce/payment-setup' },
    ],
  },
  {
    label: 'Payments', icon: CreditCard,
    children: [
      { label: 'History', path: '/payments/history' },
      { label: 'Setup', path: '/payments/setup' },
    ],
  },
]

export const accountLinks = [
  { label: 'Setup', path: '/account/setup', icon: Settings },
  { label: 'Billing', path: '/account/billing', icon: ReceiptText },
  { label: 'Message Analytics', path: '/account/message-analytics', icon: BarChart3 },
  { label: 'Api Logs', path: '/account/api-logs', icon: ScrollText },
  { label: 'Webhooks', path: '/account/webhooks', icon: Webhook },
  { label: 'Meta Direct APIs', path: '/account/meta-direct-apis', icon: Link2 },
  { label: 'Foundation', path: '/account/foundation', icon: Layers3 },
  { label: 'Settings', path: '/account/settings', icon: UserCog },
]

export const allRouteItems = [
  ...quickLinks.flatMap(i => i.path ? [i] : (i.children || [])),
  ...moreLinks.flatMap(i => i.path ? [i] : (i.children || [])),
  ...accountLinks,
]

export const pageMeta = {
  '/templates': ['WhatsApp Templates', 'Create and manage reusable WhatsApp message templates.'],
  '/templates/create': ['Create Template', 'Create a reusable WhatsApp template.'],
  '/contacts': ['Contacts', 'Manage people, phone numbers and customer profiles.'],
  '/chat-bot': ['Chat Bot', 'Build automated WhatsApp conversations and routing.'],
  '/flows': ['WhatsApp Flows', 'Create rich interactive WhatsApp experiences.'],
  '/integrations': ['Integrations', 'Connect your WhatsApp workspace to your business tools.'],
  '/campaign/broadcast': ['Broadcast Report', 'Create and manage one-time broadcasts.'],
  '/campaign/broadcast/create': ['WhatsApp Create Broadcast', 'Create a new WhatsApp broadcast.'],
  '/campaign/drip': ['Drip Campaign', 'Automate multi-step campaign sequences.'],
  '/lead-magnets/website-widget': ['Website Widget', 'Capture leads from your website.'],
  '/lead-magnets/qr-code': ['QR Code', 'Create QR codes for WhatsApp conversations.'],
  '/e-commerce/catalog-setting': ['Catalog Setting', 'Configure your commerce catalog.'],
  '/e-commerce/catalog-management': ['Catalog Management', 'Manage products and availability.'],
  '/e-commerce/order': ['Orders', 'Track WhatsApp commerce orders.'],
  '/e-commerce/payment-setup': ['Payment Setup', 'Configure payment options for commerce.'],
  '/payments/history': ['Payments History', 'Review transaction history and payment activity.'],
  '/payments/setup': ['Payments Setup', 'Connect and configure your payment provider.'],
  '/account/setup': ['Account Setup', 'Configure your organization profile.'],
  '/account/billing': ['Billing', 'Manage billing information and subscription.'],
  '/account/message-analytics': ['Message Analytics', 'Review message performance and delivery data.'],
  '/account/api-logs': ['API Logs', 'Inspect API request and response history.'],
  '/account/webhooks': ['Webhooks', 'Configure event destinations.'],
  '/account/meta-direct-apis': ['Meta Direct APIs', 'Manage direct Meta API access.'],
  '/account/foundation': ['Foundation', 'Configure workspace foundation settings.'],
  '/account/settings': ['Settings', 'Manage organization preferences.'],
}
