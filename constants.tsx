import { Service, Professional, ShopConfig, VipPlan } from './types';

export const CORES = {
  primaria: '#D4AF37',
  secundaria: '#C5A059',
  fundo: '#050505',
  cartao: '#0F0F0F',
  texto: '#FDFDFD',
  acento: '#E5C76B',
};

export const MOCK_VIP_PLANS: VipPlan[] = [
  {
    id: 'vip_1',
    name: 'Plano Essencial',
    price: 150,
    duration: 'MENSAL',
    benefits: [
      '2 cortes mensais',
      '15% de desconto em outros serviços',
      'Agendamento prioritário',
      'Café premium durante o atendimento'
    ],
    discount: 15,
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800',
    active: true
  },
  {
    id: 'vip_2',
    name: 'Plano Premium',
    price: 1500,
    duration: 'ANUAL',
    benefits: [
      'Cortes ilimitados',
      '30% de desconto em todos os serviços',
      'Agendamento VIP exclusivo',
      'Produto de finalização premium',
      'Acesso a eventos exclusivos'
    ],
    discount: 30,
    image: 'https://images.unsplash.com/photo-1599351431247-f13b283253c9?q=80&w=800',
    active: true
  }
];

export const CONFIG_LOJA: ShopConfig = {
  name: "SR. JOSÉ BARBER PUB",
  description: "Referência em São Gonçalo. Onde a tradição encontra o seu estilo.",
  aboutTitle: "Nossa História Signature",
  aboutText: "O Sr. José começou com um sonho de trazer a verdadeira experiência da barbearia clássica para São Gonçalo. Unimos a tradição do atendimento 'old-school' com as técnicas mais modernas de visagismo masculino.",
  address: "Rua Feliciano Sodré, 123",
  city: "São Gonçalo",
  state: "RJ",
  whatsapp: "5521964340031",
  instagram: "https://www.instagram.com/srjosebarberpub/",
  logo: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=200",
  coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200",
  loginBackground: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1200",
  aboutImage: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800",
  vipPlans: MOCK_VIP_PLANS
};
