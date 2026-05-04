import type { CoffeeItem, CoffeeCategory } from "@shared/schema";

// Coffee image mapping function - each drink gets its unique image
const getCoffeeImage = (coffeeId: string): string => {
 const imageMap: Record<string, string> = {
 "espresso-single": "/images/espresso-single.png",
 "espresso-double": "/images/espresso-double.png", 
 "americano": "/images/americano.png",
 "ristretto": "/images/ristretto.png",
 "turkish-coffee": "/attached_assets/Screenshot 2025-10-05 003822_1759666311817.png",
 "cafe-latte": "/images/cafe-latte.png",
 "cappuccino": "/images/cappuccino.png",
 "vanilla-latte": "/images/vanilla-latte.png",
 "mocha": "/images/mocha.png",
 "con-panna": "/images/con-panna.png",
 "french-press": "/attached_assets/Screenshot 2025-10-05 003844_1759666320914.png",
 "coffee-day-hot": "/images/golden-latte.png",
 "hot-tea": "/attached_assets/Screenshot 2025-09-19 161654_1758288116712.png",
 "ice-tea": "/attached_assets/Screenshot 2025-09-19 161645_1758288659656.png",
 "iced-matcha-latte": "/attached_assets/Screenshot 2025-09-19 161627_1758288688792.png",
 "hot-matcha-latte": "/attached_assets/Screenshot 2025-09-19 161637_1758288723420.png",
 "iced-latte": "/images/iced-latte.png",
 "iced-mocha": "/images/iced-mocha-drink.png",
 "iced-cappuccino": "/images/iced-cappuccino.png",
 "iced-condensed": "/images/iced-chocolate.png",
 "vanilla-cold-brew": "/images/vanilla-cold-brew.png",
 "cold-brew": "/images/signature-qahwa.png",
 "coffee-day-cold": "/images/signature-qahwa.png",
 "coffee-dessert-cup": "/attached_assets/Screenshot 2025-10-05 012338_1759666320915.png"
 };
 
 return imageMap[coffeeId] || "/images/default-coffee.png";
};

// Coffee categories configuration
export const coffeeCategories = [
 {
 id: "basic" as CoffeeCategory,
 nameAr: "سناكس أساسية",
 nameEn: "Main Snacks",
 description: "مجموعة من السناكس الأساسية المحضرة بعناية",
 icon: "coffee"
 },
 {
 id: "hot" as CoffeeCategory,
 nameAr: "وجبات ساخنة",
 nameEn: "Hot Snacks",
 description: "تشكيلة من الأطباق الساخنة اللذيذة",
 icon: "fire"
 },
 {
 id: "cold" as CoffeeCategory,
 nameAr: "مشروبات باردة",
 nameEn: "Cold Drinks",
 description: "مشروبات باردة منعشة ومثلجة",
 icon: "snowflake"
 },
 {
 id: "specialty" as CoffeeCategory,
 nameAr: "الأطباق الإضافية ",
 nameEn: "Specialty Items",
 description: "تشكيلة استثنائية من الأطباق المميزة والفريدة",
 icon: "star"
 },
 {
 id: "desserts" as CoffeeCategory,
 nameAr: "الحلويات",
 nameEn: "Desserts",
 description: "حلويات شهية ولذيذة تكمل تجربة الطعام",
 icon: "cake"
 }
];

// Perfectly matched restaurant menu data with تسالي كرومش images
export const defaultCoffeeMenu: any[] = [
 // Main Snacks
 {
 id: "espresso-single",
 nameAr: "تسالي كلاسيك (صغير)",
 nameEn: "Tasali Classic (Small)",
 description: "تسالي مقرمشة بنكهة كلاسيكية لا تُقاوم",
 price: 4.00,
 oldPrice: 5.00,
 category: "basic",
 imageUrl: getCoffeeImage("espresso-single"),
 isAvailable: 1,
 coffeeStrength: "strong",
 strengthLevel: 10
 },
 {
 id: "espresso-double",
 nameAr: "إسبريسو (دبل شوت)",
 nameEn: "Tasali Classic (Large)",
 description: "حصة كبيرة من تسالي كرومش للذواقة",
 price: 5.00,
 oldPrice: 6.00,
 category: "basic",
 imageUrl: getCoffeeImage("espresso-double"),
 isAvailable: 1,
 coffeeStrength: "strong",
 strengthLevel: 12
 },
 {
 id: "americano",
 nameAr: "بطاطس مقلية",
 nameEn: "French Fries",
 description: "إسبريسو مخفف بالماء الساخن لطعم معتدل",
 price: 5.00,
 oldPrice: 6.00,
 category: "basic",
 imageUrl: getCoffeeImage("americano"),
 isAvailable: 1,
 coffeeStrength: "mild",
 strengthLevel: 3
 },
 {
 id: "ristretto",
 nameAr: "أصابع موزاريلا",
 nameEn: "Mozzarella Sticks",
 description: "إسبريسو مركز بنصف كمية الماء لطعم أقوى",
 price: 5.00,
 oldPrice: 6.00,
 category: "basic",
 imageUrl: getCoffeeImage("ristretto"),
 isAvailable: 1,
 coffeeStrength: "strong",
 strengthLevel: 11
 },
 {
 id: "turkish-coffee",
 nameAr: "زنجر برجر",
 nameEn: "Zinger Burger",
 description: "برجر دجاج زنجر حار بنكهة لا تُنسى",
 price: 5.00,
 oldPrice: undefined,
 category: "basic",
 imageUrl: getCoffeeImage("turkish-coffee"),
 isAvailable: 1,
 coffeeStrength: "medium",
 strengthLevel: 6
 },
 
 // Hot Snacks
 {
 id: "cafe-latte",
 nameAr: "ساندويتش دجاج كرومش",
 nameEn: "Crunchy Chicken Sandwich",
 description: "إسبريسو مع حليب مخفوق كريمي ورغوة ناعمة",
 price: 5.00,
 oldPrice: 6.00,
 category: "hot",
 imageUrl: getCoffeeImage("cafe-latte"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "cappuccino",
 nameAr: "وجبة دجاج مقرمش",
 nameEn: "Crunchy Chicken Meal",
 description: "مزيج متوازن من الإسبريسو والحليب والرغوة ",
 price: 5.00,
 oldPrice: 6.00,
 category: "hot",
 imageUrl: getCoffeeImage("cappuccino"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "vanilla-latte",
 nameAr: "ناجتس دجاج",
 nameEn: "Chicken Nuggets",
 description: "لاتيه كلاسيكي مع نكهةالفانيلا الطبيعية",
 price: 6.00,
 oldPrice: 7.00,
 category: "hot",
 imageUrl: getCoffeeImage("vanilla-latte"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "mocha",
 nameAr: "أجنحة دجاج حارة",
 nameEn: "Spicy Chicken Wings",
 description: "أجنحة دجاج حارة مقرمشة بصلصة BBQ",
 price: 7.00,
 oldPrice: 8.00,
 category: "hot",
 imageUrl: getCoffeeImage("mocha"),
 isAvailable: 1,
 coffeeStrength: "medium",
 strengthLevel: 6
 },
 {
 id: "con-panna",
 nameAr: "صدور دجاج مشوية",
 nameEn: "Cafe Con Panna",
 description: "إسبريسو مع كريمة مخفوقة طازجة",
 price: 5.00,
 oldPrice: 6.00,
 category: "hot",
 imageUrl: getCoffeeImage("con-panna"),
 isAvailable: 1,
 coffeeStrength: "medium",
 strengthLevel: 7
 },
 {
 id: "coffee-day-hot",
 nameAr: "وجبة اليوم (ساخنة)",
 nameEn: "Coffee of the Day Hot",
 description: "تشكيلة مختارةيومياً من أفضل مكونات الطعام ",
 price: 4.95,
 oldPrice: 5.50,
 category: "hot",
 imageUrl: getCoffeeImage("coffee-day-hot"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "french-press",
 nameAr: "بطاطس بالجبنة",
 nameEn: "French Press Coffee",
 description: "بطاطس مقلية مغطاة بجبنة الشيدر الذائبة",
 price: 6.00,
 oldPrice: undefined,
 category: "hot",
 imageUrl: getCoffeeImage("french-press"),
 isAvailable: 1,
 coffeeStrength: "medium",
 strengthLevel: 6
 },
 {
 id: "hot-tea",
 nameAr: "شاي حار",
 nameEn: "Hot Tea",
 description: "شاي طبيعي مُحضر بعناية من أوراق الشاي المختارة، يُقدم ساخناً ومنعشاً لبدايةيوم مثالية",
 price: 2.00,
 oldPrice: undefined,
 category: "specialty",
 imageUrl: getCoffeeImage("hot-tea"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "ice-tea",
 nameAr: "آيس تي",
 nameEn: "Ice Tea",
 description: "انتعاش لا يُقاوم مع مزيج مثالي من الشاي المنقوع ببرودةوالطعم المميز، رحلة منعشة في كل رشفةتجدد طاقتك وتمنحك لحظات من الصفاء",
 price: 3.00,
 oldPrice: undefined,
 category: "specialty",
 imageUrl: getCoffeeImage("ice-tea"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "matcha-latte",
 nameAr: "لاتيه ماتشا",
 nameEn: "Matcha Latte",
 description: "إبداع ياباني ساحر يجمع بين نعومة الحليب وسحر الماتشا الأخضر النقي، تجربة بصرية وذوقية استثنائية تأخذك في رحلة إلى عالم من الهدوء والتميز",
 price: 10.00,
 oldPrice: undefined,
 category: "specialty",
 imageUrl: getCoffeeImage("iced-matcha-latte"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined,
 availableSizes: [
   { nameAr: "بارد", nameEn: "Iced", price: 10.00, imageUrl: getCoffeeImage("iced-matcha-latte") },
   { nameAr: "حار", nameEn: "Hot", price: 11.00, imageUrl: getCoffeeImage("hot-matcha-latte") }
 ]
 },
 
 // Cold Drinks
 {
 id: "iced-latte",
 nameAr: "آيسد لاتيه",
 nameEn: "Cold Pepsi",
 description: "لاتيه منعش مع الثلج والحليب البارد",
 price: 6.00,
 oldPrice: 7.00,
 category: "cold",
 imageUrl: getCoffeeImage("iced-latte"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "iced-mocha",
 nameAr: "آيسد موكا",
 nameEn: "Mirinda Orange",
 description: "موكا باردة مع الشوكولاتةوالكريمة المخفوقة",
 price: 7.00,
 oldPrice: 8.00,
 category: "cold",
 imageUrl: getCoffeeImage("iced-mocha"),
 isAvailable: 1,
 coffeeStrength: "medium",
 strengthLevel: 5
 },
 {
 id: "iced-cappuccino",
 nameAr: "آيسد كابتشينو",
 nameEn: "7UP",
 description: "كابتشينو بارد مع رغوة الحليب المثلجة",
 price: 6.00,
 oldPrice: 7.00,
 category: "cold",
 imageUrl: getCoffeeImage("iced-cappuccino"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "iced-condensed",
 nameAr: "موهيتو منعش",
 nameEn: "Cold Drinks with Condensed Milk",
 description: "موهيتو منعش بالنعناع والليمون",
 price: 5.00,
 oldPrice: 6.00,
 category: "cold",
 imageUrl: getCoffeeImage("iced-condensed"),
 isAvailable: 1,
 coffeeStrength: "medium",
 strengthLevel: 5
 },
 {
 id: "vanilla-cold-brew",
 nameAr: "فانيلا كولد برو",
 nameEn: "Strawberry Juice",
 description: "عصير فراولة طازج 100%",
 price: 6.00,
 oldPrice: 7.00,
 category: "cold",
 imageUrl: getCoffeeImage("vanilla-cold-brew"),
 isAvailable: 1,
 coffeeStrength: "mild",
 strengthLevel: 2
 },
 {
 id: "cold-brew",
 nameAr: "عصير مانجو",
 nameEn: "Mango Juice",
 description: "عصير مانجو طبيعي بدون إضافات",
 price: 4.95,
 oldPrice: 5.50,
 category: "cold",
 imageUrl: getCoffeeImage("cold-brew"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 {
 id: "coffee-day-cold",
 nameAr: "مشروب اليوم (بارد)",
 nameEn: "Coffee of the Day Cold",
 description: "مشروب اليوم البارد المنعش",
 price: 4.95,
 oldPrice: 5.50,
 category: "cold",
 imageUrl: getCoffeeImage("coffee-day-cold"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 },
 
 // Desserts
 {
 id: "coffee-dessert-cup",
 nameAr: "حلى تسالي كرومش",
 nameEn: "Kunafa Cup with Nutella",
 description: "كاسة كنافة فاخرة بالنوتيلا والقشطة، تجربة حلوة لا تُنسى",
 price: 8.00,
 oldPrice: undefined,
 category: "desserts",
 imageUrl: getCoffeeImage("coffee-dessert-cup"),
 isAvailable: 1,
 coffeeStrength: "classic",
 strengthLevel: undefined
 }
];

// Helper functions
export const getCoffeeItemsByCategory = (items: CoffeeItem[], category: CoffeeCategory): CoffeeItem[] => {
 return items.filter(item => item.category === category && item.isAvailable === 1);
};

export const calculateDiscount = (price: string, oldPrice?: string): number => {
 if (!oldPrice) return 0;
 const current = parseFloat(price);
 const old = parseFloat(oldPrice);
 return Math.round(((old - current) / old) * 100);
};

export const formatPrice = (price: string): string => {
 return `${parseFloat(price).toFixed(2)} ريال`;
};

export const getCategoryIcon = (category: CoffeeCategory): string => {
 const categoryInfo = coffeeCategories.find(cat => cat.id === category);
 return categoryInfo?.icon || "coffee";
};

export const getCategoryName = (category: CoffeeCategory): string => {
 const categoryInfo = coffeeCategories.find(cat => cat.id === category);
 return categoryInfo?.nameAr || category;
};