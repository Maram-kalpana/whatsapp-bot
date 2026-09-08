export const initialTemplates = [
  { id: 1, name: '02sep Anniversary', category: 'Marketing', type: 'Default', media: 'Image', status: 'Approved', icon: 'megaphone', body: "Queen's collection wishes you very *Happy Anniversary*🎊 in advance to make your special day more special and memorable.", footer: '', buttons: ['Shop now'], accent: 'red' },
  { id: 2, name: '02sep Bday', category: 'Marketing', type: 'Default', media: 'Image', status: 'Approved', icon: 'megaphone', body: "Queen's collection wishes you very *Happy Birthday*🎊 in advance to make your special day more special and memorable.", footer: '', buttons: ['Shop now'], accent: 'red' },
  { id: 3, name: 'Bwishes', category: 'Marketing', type: 'Default', media: 'Image', status: 'Approved', icon: 'megaphone', body: "Dear Customer, Queen’s wishes you a very Happy Birthday! May your special day be filled with happiness, love, and wonderful memories.", footer: '', buttons: [], accent: 'red' },
  { id: 4, name: 'Feedback New', category: 'Marketing', type: 'Flows', media: 'Image', status: 'Approved', icon: 'bell', body: 'Thank you for your recent purchase from Queen Collection. We are collecting customer feedback and would love to hear from you.', footer: '', buttons: ['Share feedback'], accent: 'red' },
  { id: 5, name: 'Customer Feedback', category: 'Utility', type: 'Flows', media: 'Text', status: 'Approved', icon: 'bell', body: 'Thank you for your recent purchase from Queen Collection. We are collecting customer feedback.', footer: '', buttons: ['Share feedback'], accent: 'blue' },
  { id: 6, name: '31aug Anniversary', category: 'Marketing', type: 'Default', media: 'Image', status: 'Approved', icon: 'megaphone', body: "Queen's collection wishes you very *Happy Anniversary*🎊 in advance to make your special day more special.", footer: '', buttons: [], accent: 'red' },
  { id: 7, name: '31aug Birthday', category: 'Marketing', type: 'Default', media: 'Image', status: 'Approved', icon: 'megaphone', body: "Queen's collection wishes you very *Happy Birthday*🎊 in advance to make your special day more special.", footer: '', buttons: [], accent: 'red' },
  { id: 8, name: 'Happy Birthday', category: 'Marketing', type: 'Default', media: 'Text', status: 'Approved', icon: 'megaphone', body: 'Wishing you a day filled with joy, laughter, and beautiful moments. May this year bring you happiness and success.', footer: '', buttons: [], accent: 'blue' },
]

export const setupOptions = {
  Marketing: [
    { key: 'Default', title: 'Default', description: 'Send promotions or announcements to increase awareness and engagement.', goodFor: 'Welcome messages, promotions, offers, coupons, newsletters, announcements', customizable: 'Media, header, body, footer, button' },
    { key: 'Catalogue', title: 'Catalogue', description: 'Send messages about your entire catalogue or multiple products from it.', goodFor: 'Product/service discovery, sales, offers, targeted marketing, personalised shopping', customizable: 'Connect a catalog, body' },
    { key: 'Flows', title: 'Flows', description: 'Send a form to capture customer interests, appointment requests or run surveys.', goodFor: 'Sign ups, promotions, surveys, appointments', customizable: 'Form, body, button' },
    { key: 'Order Details', title: 'Order Details', description: 'Send messages through which customers can pay you.', goodFor: 'Payments, invoices, cart recovery, offers', customizable: 'Media, header, body, footer, button' },
    { key: 'Carousel', title: 'Carousel', description: 'Showcase multiple products or services in a scrollable card format with images, titles, and buttons.', goodFor: 'Product discovery, catalog highlights, cart abandonment', customizable: 'Header, body, footer' },
  ],
  Utility: [
    { key: 'Default', title: 'Default', description: 'Send messages about an existing order or account.', goodFor: 'Order confirmations, account updates, receipts, appointment reminders, billing', customizable: 'Media, header, body, footer, button' },
    { key: 'Flows', title: 'Flows', description: 'Send a form to collect feedback, send reminders or manage orders.', goodFor: 'Customer support, surveys', customizable: 'Form, body, button' },
    { key: 'Order Status', title: 'Order Status', description: 'Send messages to tell customers about the progress of their orders.', goodFor: 'Shipping updates and order tracking', customizable: 'Header, body, button' },
    { key: 'Order Details', title: 'Order Details', description: 'Send messages through which customers can pay you.', goodFor: 'Payment/invoice reminders, billing information, product availability, cart abandonment', customizable: 'Header, body, footer' },
  ],
  Authentication: [
    { key: 'One-time password', title: 'One-time password', description: 'Send a secure verification code to authenticate a customer.', goodFor: 'Login verification, account recovery, OTP verification', customizable: 'Body, security recommendation, copy-code button' },
  ],
}

export const languages = ['English', 'Afrikaans', 'Akan', 'Amharic', 'Aragonese', 'Arabic', 'Assamese', 'Avaric', 'Azerbaijani', 'Basque', 'Bengali', 'Bulgarian', 'Catalan', 'Chinese', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Finnish', 'French', 'German', 'Greek', 'Gujarati', 'Hebrew', 'Hindi', 'Hungarian', 'Indonesian', 'Italian', 'Japanese', 'Kannada', 'Korean', 'Malayalam', 'Marathi', 'Nepali', 'Norwegian', 'Odia', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Spanish', 'Swedish', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese']
