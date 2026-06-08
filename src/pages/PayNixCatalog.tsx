import React, { useState, useEffect } from 'react';

interface InstallmentOptions {
  allow: boolean;
  downPayment: number;
  m24: number;
  m36: number;
}

interface Product {
  id: number;
  productIndex: number;
  title: string;
  category: string;
  categoryId: string;
  brand: string;
  price: number;
  currency: string;
  stock: number;
  image: string;
  description: string;
  installment: InstallmentOptions;
}

export default function QastlyCatalog() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const itemsPerPage = 24;

  useEffect(() => {
    // استدعاء الـ Fake API المحلي الذي أنشأناه في مجلد public
    fetch('/products.json')
      .then((res) => res.json())
      .then((baseProducts: unknown[]) => {
        const expandedProducts: Product[] = [];
        let globalId = 1;
        const itemsPerCategory = 2000; // توليد 2,000 منتج بناءً على الـ API لكل قسم

        baseProducts.forEach((baseProduct) => {
          for (let i = 1; i <= itemsPerCategory; i++) {
            const priceModifier = 0.7 + ((i * 3) % 100) * 0.01;
            const price = Math.round((baseProduct.price * priceModifier) / 50) * 50;
            const allowInstallment = price > 2000;
            const minDownPayment = allowInstallment ? Math.round((price * 0.1) / 10) * 10 : price;
            const remaining = price - minDownPayment;

            expandedProducts.push({
              id: globalId,
              productIndex: i,
              title: `${baseProduct.title.split(' - ')[0]} - موديل الفئة ${i}`,
              category: baseProduct.category,
              categoryId: baseProduct.categoryId,
              brand: baseProduct.brand,
              price: price,
              currency: baseProduct.currency,
              stock: (i % 15) + 1,
              image: baseProduct.image,
              description: `منتج جُلب عبر الـ Fake API الخاص بـ Qastly ومطابق للمواصفات التمويلية.`,

              installment: {
                allow: allowInstallment,
                downPayment: minDownPayment,
                m24: allowInstallment ? Math.round((remaining * 1.35) / 24) : 0,
                m36: allowInstallment ? Math.round((remaining * 1.50) / 36) : 0,
              },
            });
            globalId++;
          }
        });

        setAllProducts(expandedProducts);
        setLoading(false);
      })
      .catch((err) => {
        console.error("خطأ في جلب الـ API:", err);
        setLoading(false);
      });
  }, []);

  const filteredProducts = selectedCategory === 'all'
    ? allProducts
    : allProducts.filter((p) => p.categoryId === selectedCategory);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px', fontSize: '20px', direction: 'rtl' }}>جاري استدعاء الـ Fake API لـ Qastly والتحقق من الـ 22,000 منتج...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, Tahoma', direction: 'rtl', backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0f172a', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#0f172a', margin: 0, fontSize: '26px', fontWeight: '800' }}>كتالوج متصل بالـ Fake API</h1>
          <p style={{ color: '#64748b', margin: '5px 0 0 0' }}>تم جلب الأقسام من المجلد العام وتوسيعها لـ {allProducts.length.toLocaleString()} منتج</p>
        </div>
        <div style={{ background: '#e67e22', color: '#fff', padding: '8px 18px', borderRadius: '8px', fontWeight: 'bold' }}>
          المتاح هنا: {filteredProducts.length.toLocaleString()} منتج
        </div>
      </div>

      {/* شريط الـ 11 قسم المسترجع من الـ API */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '25px' }}>
        <button onClick={() => { setSelectedCategory('all'); setCurrentPage(1); }} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: selectedCategory === 'all' ? '#0f172a' : '#fff', color: selectedCategory === 'all' ? '#fff' : '#334155', cursor: 'pointer', fontWeight: 'bold' }}>
          كل المعروض ({allProducts.length.toLocaleString()})
        </button>
        {Array.from(new Set(allProducts.map(p => JSON.stringify({id: p.categoryId, name: p.category})))).map(str => {
          const cat = JSON.parse(str);
          return (
            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setCurrentPage(1); }} style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: selectedCategory === cat.id ? '#0f172a' : '#fff', color: selectedCategory === cat.id ? '#fff' : '#334155', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
              {cat.name} (2,000)
            </button>
          );
        })}
      </div>

      {/* شبكة عرض المنتجات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {currentProducts.map(product => (
          <div key={product.id} style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '15px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#0f172a', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>{product.category}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>#{product.productIndex}</span>
              </div>
              <img src={product.image} alt={product.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', marginTop: '10px' }} />
              <h3 style={{ fontSize: '15px', color: '#1e293b', margin: '12px 0 4px 0', height: '40px', overflow: 'hidden', fontWeight: 'bold' }}>{product.title}</h3>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '12px' }}>{product.price.toLocaleString()} {product.currency}</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px' }}>
              {product.installment.allow ? (
                <>
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>✓ تمويل استهلاكي فوري</div>
                  <div style={{ fontSize: '12px', color: '#475569' }}>المقدم: {product.installment.downPayment.toLocaleString()} ج.م</div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>قسط 24 شهر: {product.installment.m24.toLocaleString()} ج.م</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>قسط 36 شهر: {product.installment.m36.toLocaleString()} ج.م</div>
                </>
              ) : (
                <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>✕ كاش فقط</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* أزرار التنقل السفلي */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '35px' }}>
        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>السابق</button>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>صفحة {currentPage} من {totalPages.toLocaleString()}</span>
        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>التالي</button>
      </div>
    </div>
  );
}
