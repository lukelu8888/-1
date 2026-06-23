import type { LanguageCode } from '../contexts/LanguageContext';

type PromotionLabelKey =
  | 'specialBuy'
  | 'endsIn'
  | 'products'
  | 'noActiveDealsTitle'
  | 'noActiveDealsDescription'
  | 'selectCampaignProducts'
  | 'dealsEyebrow'
  | 'dealsPageTitle'
  | 'inquiryList'
  | 'loadingCatalog'
  | 'catalogUnavailable'
  | 'noDiscountedProducts'
  | 'noDiscountedProductsDescription'
  | 'product'
  | 'catalogInfo'
  | 'price'
  | 'quantity'
  | 'action'
  | 'shopDeals';

export const promotionLabels: Record<LanguageCode, Record<PromotionLabelKey, string>> = {
  en: {
    specialBuy: 'Special Buy',
    endsIn: 'Ends in',
    products: 'products',
    noActiveDealsTitle: 'No active discounted products',
    noActiveDealsDescription: 'Add discount fields to real products to show them in Deals of the Week.',
    selectCampaignProducts: 'Select products for this campaign to feature them here.',
    dealsEyebrow: 'Deals & Offers',
    dealsPageTitle: 'Discounted products ready for inquiry.',
    inquiryList: 'Inquiry List',
    loadingCatalog: 'Loading product catalog...',
    catalogUnavailable: 'Product catalog unavailable',
    noDiscountedProducts: 'No discounted products available',
    noDiscountedProductsDescription: 'Mark products with a discount, sale flag, or original price above current price to show them here.',
    product: 'Product',
    catalogInfo: 'Catalog Info',
    price: 'Price',
    quantity: 'Quantity',
    action: 'Action',
    shopDeals: 'Shop Deals',
  },
  es: {
    specialBuy: 'Oferta especial',
    endsIn: 'Termina en',
    products: 'productos',
    noActiveDealsTitle: 'No hay productos con descuento activos',
    noActiveDealsDescription: 'Agregue campos de descuento a productos reales para mostrarlos en las ofertas de la semana.',
    selectCampaignProducts: 'Seleccione productos para esta campaña y muéstrelos aquí.',
    dealsEyebrow: 'Ofertas y promociones',
    dealsPageTitle: 'Productos con descuento listos para consulta.',
    inquiryList: 'Lista de consulta',
    loadingCatalog: 'Cargando catálogo de productos...',
    catalogUnavailable: 'Catálogo de productos no disponible',
    noDiscountedProducts: 'No hay productos con descuento disponibles',
    noDiscountedProductsDescription: 'Marque productos con descuento, etiqueta de oferta o precio original superior al precio actual para mostrarlos aquí.',
    product: 'Producto',
    catalogInfo: 'Información del catálogo',
    price: 'Precio',
    quantity: 'Cantidad',
    action: 'Acción',
    shopDeals: 'Ver ofertas',
  },
  pt: {
    specialBuy: 'Oferta especial',
    endsIn: 'Termina em',
    products: 'produtos',
    noActiveDealsTitle: 'Nenhum produto com desconto ativo',
    noActiveDealsDescription: 'Adicione campos de desconto a produtos reais para exibi-los nas ofertas da semana.',
    selectCampaignProducts: 'Selecione produtos para esta campanha para destacá-los aqui.',
    dealsEyebrow: 'Ofertas e promoções',
    dealsPageTitle: 'Produtos com desconto prontos para consulta.',
    inquiryList: 'Lista de consulta',
    loadingCatalog: 'Carregando catálogo de produtos...',
    catalogUnavailable: 'Catálogo de produtos indisponível',
    noDiscountedProducts: 'Nenhum produto com desconto disponível',
    noDiscountedProductsDescription: 'Marque produtos com desconto, etiqueta promocional ou preço original acima do preço atual para exibi-los aqui.',
    product: 'Produto',
    catalogInfo: 'Informações do catálogo',
    price: 'Preço',
    quantity: 'Quantidade',
    action: 'Ação',
    shopDeals: 'Ver ofertas',
  },
  fr: {
    specialBuy: 'Offre spéciale',
    endsIn: 'Se termine dans',
    products: 'produits',
    noActiveDealsTitle: 'Aucun produit remisé actif',
    noActiveDealsDescription: 'Ajoutez des champs de remise aux produits réels pour les afficher dans les offres de la semaine.',
    selectCampaignProducts: 'Sélectionnez des produits pour cette campagne afin de les présenter ici.',
    dealsEyebrow: 'Offres et promotions',
    dealsPageTitle: 'Produits remisés prêts pour demande.',
    inquiryList: 'Liste de demande',
    loadingCatalog: 'Chargement du catalogue produits...',
    catalogUnavailable: 'Catalogue produits indisponible',
    noDiscountedProducts: 'Aucun produit remisé disponible',
    noDiscountedProductsDescription: 'Marquez les produits avec une remise, une étiquette promotionnelle ou un ancien prix supérieur au prix actuel pour les afficher ici.',
    product: 'Produit',
    catalogInfo: 'Infos catalogue',
    price: 'Prix',
    quantity: 'Quantité',
    action: 'Action',
    shopDeals: 'Voir les offres',
  },
  ru: {
    specialBuy: 'Спецпредложение',
    endsIn: 'До окончания',
    products: 'товаров',
    noActiveDealsTitle: 'Нет активных товаров со скидкой',
    noActiveDealsDescription: 'Добавьте поля скидки к реальным товарам, чтобы показать их в предложениях недели.',
    selectCampaignProducts: 'Выберите товары для этой кампании, чтобы показать их здесь.',
    dealsEyebrow: 'Предложения и акции',
    dealsPageTitle: 'Товары со скидкой готовы к запросу.',
    inquiryList: 'Список запросов',
    loadingCatalog: 'Загрузка каталога товаров...',
    catalogUnavailable: 'Каталог товаров недоступен',
    noDiscountedProducts: 'Нет доступных товаров со скидкой',
    noDiscountedProductsDescription: 'Отметьте товары скидкой, меткой распродажи или старой ценой выше текущей, чтобы показать их здесь.',
    product: 'Товар',
    catalogInfo: 'Информация каталога',
    price: 'Цена',
    quantity: 'Количество',
    action: 'Действие',
    shopDeals: 'Смотреть предложения',
  },
  ar: {
    specialBuy: 'عرض خاص',
    endsIn: 'ينتهي خلال',
    products: 'منتجات',
    noActiveDealsTitle: 'لا توجد منتجات مخفضة نشطة',
    noActiveDealsDescription: 'أضف حقول الخصم إلى المنتجات الحقيقية لعرضها في عروض الأسبوع.',
    selectCampaignProducts: 'اختر منتجات لهذه الحملة لعرضها هنا.',
    dealsEyebrow: 'العروض والتخفيضات',
    dealsPageTitle: 'منتجات مخفضة جاهزة للاستعلام.',
    inquiryList: 'قائمة الاستعلام',
    loadingCatalog: 'جار تحميل كتالوج المنتجات...',
    catalogUnavailable: 'كتالوج المنتجات غير متاح',
    noDiscountedProducts: 'لا توجد منتجات مخفضة متاحة',
    noDiscountedProductsDescription: 'ضع علامة خصم أو عرض أو سعر أصلي أعلى من السعر الحالي لعرض المنتجات هنا.',
    product: 'المنتج',
    catalogInfo: 'معلومات الكتالوج',
    price: 'السعر',
    quantity: 'الكمية',
    action: 'الإجراء',
    shopDeals: 'عرض العروض',
  },
};

const localizedCampaignText: Partial<Record<LanguageCode, Record<string, string>>> = {
  es: {
    'Pro Supply Savings Week': 'Semana de ahorro para suministro profesional',
    'Bulk Buy Event': 'Evento de compra por volumen',
    'Contractor Deal Days': 'Días de ofertas para contratistas',
    'Jobsite Essentials Sale': 'Venta de esenciales para obra',
    'Volume Purchase Savings': 'Ahorros por compra de volumen',
    'Pro Replenishment Week': 'Semana de reposición profesional',
    'Project Supply Event': 'Evento de suministro para proyectos',
    'Wholesale Value Week': 'Semana de valor mayorista',
    'Trade Partner Specials': 'Especiales para socios comerciales',
    'Container Load Savings': 'Ahorros por carga de contenedor',
    'Pro-Grade Supply Deals for Repeat Buyers': 'Ofertas de suministro profesional para compradores recurrentes',
    'Selected SKUs support recurring purchasing needs with better pricing for active B2B accounts.': 'SKU seleccionados apoyan compras recurrentes con mejores precios para cuentas B2B activas.',
    'Shop Deals': 'Ver ofertas',
  },
  pt: {
    'Pro Supply Savings Week': 'Semana de economia para suprimentos profissionais',
    'Bulk Buy Event': 'Evento de compra em volume',
    'Contractor Deal Days': 'Dias de ofertas para empreiteiros',
    'Jobsite Essentials Sale': 'Promoção de essenciais para obra',
    'Volume Purchase Savings': 'Economia por compra em volume',
    'Pro Replenishment Week': 'Semana de reposição profissional',
    'Project Supply Event': 'Evento de suprimentos para projetos',
    'Wholesale Value Week': 'Semana de valor atacadista',
    'Trade Partner Specials': 'Especiais para parceiros comerciais',
    'Container Load Savings': 'Economia por carga de contêiner',
    'Pro-Grade Supply Deals for Repeat Buyers': 'Ofertas profissionais para compradores recorrentes',
    'Selected SKUs support recurring purchasing needs with better pricing for active B2B accounts.': 'SKUs selecionados apoiam compras recorrentes com melhores preços para contas B2B ativas.',
    'Shop Deals': 'Ver ofertas',
  },
  fr: {
    'Pro Supply Savings Week': 'Semaine économies approvisionnement pro',
    'Bulk Buy Event': 'Événement achat en volume',
    'Contractor Deal Days': 'Jours d’offres entrepreneurs',
    'Jobsite Essentials Sale': 'Offres essentiels chantier',
    'Volume Purchase Savings': 'Économies achat volume',
    'Pro Replenishment Week': 'Semaine réapprovisionnement pro',
    'Project Supply Event': 'Événement fournitures projet',
    'Wholesale Value Week': 'Semaine valeur grossiste',
    'Trade Partner Specials': 'Offres partenaires commerciaux',
    'Container Load Savings': 'Économies chargement conteneur',
    'Pro-Grade Supply Deals for Repeat Buyers': 'Offres d’approvisionnement pro pour acheteurs récurrents',
    'Selected SKUs support recurring purchasing needs with better pricing for active B2B accounts.': 'Des SKU sélectionnés soutiennent les achats récurrents avec de meilleurs prix pour les comptes B2B actifs.',
    'Shop Deals': 'Voir les offres',
  },
  ru: {
    'Pro Supply Savings Week': 'Неделя экономии для профснабжения',
    'Bulk Buy Event': 'Акция для оптовых закупок',
    'Contractor Deal Days': 'Дни предложений для подрядчиков',
    'Jobsite Essentials Sale': 'Скидки на товары для объекта',
    'Volume Purchase Savings': 'Экономия при объемной закупке',
    'Pro Replenishment Week': 'Неделя пополнения запасов',
    'Project Supply Event': 'Акция для проектного снабжения',
    'Wholesale Value Week': 'Неделя оптовой выгоды',
    'Trade Partner Specials': 'Спецпредложения для торговых партнеров',
    'Container Load Savings': 'Экономия на контейнерной загрузке',
    'Pro-Grade Supply Deals for Repeat Buyers': 'Профессиональные предложения для повторных покупателей',
    'Selected SKUs support recurring purchasing needs with better pricing for active B2B accounts.': 'Выбранные SKU поддерживают регулярные закупки с лучшими ценами для активных B2B-аккаунтов.',
    'Shop Deals': 'Смотреть предложения',
  },
  ar: {
    'Pro Supply Savings Week': 'أسبوع توفير مستلزمات المحترفين',
    'Bulk Buy Event': 'فعالية الشراء بالكميات',
    'Contractor Deal Days': 'أيام عروض المقاولين',
    'Jobsite Essentials Sale': 'تخفيضات أساسيات موقع العمل',
    'Volume Purchase Savings': 'توفير الشراء بالكميات',
    'Pro Replenishment Week': 'أسبوع إعادة التوريد للمحترفين',
    'Project Supply Event': 'فعالية توريد المشاريع',
    'Wholesale Value Week': 'أسبوع قيمة الجملة',
    'Trade Partner Specials': 'عروض خاصة لشركاء التجارة',
    'Container Load Savings': 'توفير شحن الحاويات',
    'Pro-Grade Supply Deals for Repeat Buyers': 'عروض توريد احترافية للمشترين المتكررين',
    'Selected SKUs support recurring purchasing needs with better pricing for active B2B accounts.': 'تدعم المنتجات المختارة احتياجات الشراء المتكررة بأسعار أفضل لحسابات B2B النشطة.',
    'Shop Deals': 'عرض العروض',
  },
};

export function translatePromotionText(value: string | null | undefined, language: LanguageCode): string {
  const text = String(value || '').trim();
  if (!text) return text;
  if (text === '立即查看') return promotionLabels[language].shopDeals;
  if (language === 'en') return text;
  return localizedCampaignText[language]?.[text] || text;
}

export function formatPromotionRemaining(
  remaining: { days: number; hours: number; minutes: number } | null,
  labels: Pick<Record<PromotionLabelKey, string>, 'endsIn'>,
) {
  return `${labels.endsIn} ${remaining?.days ? `${remaining.days}d ` : ''}${remaining?.hours ?? 0}h ${remaining?.minutes ?? 0}m`;
}
