import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Home = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Shopping Cart state
  const [cart, setCart] = useState([]);
  
  // Order Form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  });
  
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const data = await api.getMenu();
        setMenu(data);
      } catch (err) {
        console.error('Error fetching menu:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // Filter menu items by category
  const filteredMenu = selectedCategory === 'All' 
    ? menu 
    : menu.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'All', name: 'Tất Cả' },
    { id: 'Main Course', name: 'Món Chính' },
    { id: 'Soup', name: 'Món Canh' },
    { id: 'Side Dish', name: 'Món Phụ' },
    { id: 'Drink', name: 'Đồ Uống' },
    { id: 'Dessert', name: 'Tráng Miệng' }
  ];

  // Cart operations
  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem => 
          cartItem.id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 } 
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, amount) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + amount;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const totalAmount = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit Order
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      alert('Vui lòng điền đầy đủ Tên, Số điện thoại và Địa chỉ giao hàng!');
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderPayload = {
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        notes: form.notes,
        items: cart,
        total_amount: totalAmount
      };

      const result = await api.placeOrder(orderPayload);
      setOrderSuccess(result);
      setCart([]); // Clear cart
      setForm({ name: '', phone: '', address: '', notes: '' }); // Reset form
    } catch (err) {
      alert(`Không thể đặt hàng: ${err.message}`);
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="home-page container">
      <header className="hero-section">
        <h1>Bếp Mẹ Huyền</h1>
        <p>Thực đơn cơm nhà ấm nóng, đậm đà tình quê. Chuẩn vị mẹ nấu từ nguyên liệu tươi ngon nhất mỗi ngày!</p>
      </header>

      <div className="layout-grid">
        {/* Left Side: Category Filters & Food Menu */}
        <main className="menu-container">
          <div className="categories-bar">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id)}
                className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loader-container">
              <i className="fa-solid fa-utensils spinner loader-icon"></i>
              <p>Đang chuẩn bị thực đơn...</p>
            </div>
          ) : (
            <div className="food-grid">
              {filteredMenu.map(item => (
                <div key={item.id} className="food-card">
                  <div className="food-image-wrapper">
                    <img src={item.image_url} alt={item.name} className="food-image" />
                    <span className="food-category-badge">{item.category}</span>
                  </div>
                  <div className="food-info">
                    <h3 className="food-name">{item.name}</h3>
                    <p className="food-desc">{item.description}</p>
                    <div className="food-footer">
                      <span className="food-price">{parseFloat(item.price).toLocaleString('vi-VN')} đ</span>
                      <button onClick={() => addToCart(item)} className="btn btn-primary add-to-cart-btn">
                        <i className="fa-solid fa-plus"></i> Thêm món
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Right Side: Floating Shopping Cart */}
        <aside className="cart-sidebar" id="cart-section">
          <div className="cart-card">
            <h2><i className="fa-solid fa-cart-shopping"></i> Giỏ Món Ăn</h2>
            
            {cart.length === 0 ? (
              <div className="empty-cart">
                <i className="fa-solid fa-basket-shopping"></i>
                <p>Giỏ hàng rỗng. Hãy chọn vài món ăn thơm ngon tiếp năng lượng nhé!</p>
              </div>
            ) : (
              <>
                <div className="cart-items-list">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <span>{parseFloat(item.price).toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="cart-item-actions">
                        <div className="qty-controls">
                          <button onClick={() => updateQuantity(item.id, -1)} className="qty-btn">-</button>
                          <span className="qty-value">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="qty-btn">+</button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="cart-remove-btn">
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-row">
                    <span>Tổng số lượng:</span>
                    <strong>{cart.reduce((s, i) => s + i.quantity, 0)} món</strong>
                  </div>
                  <div className="summary-row total-row">
                    <span>Thành tiền:</span>
                    <strong>{totalAmount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="checkout-form">
                  <h3>Thông Tin Giao Hàng</h3>
                  <div className="form-group">
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="Họ và tên của bạn" 
                      value={form.name} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="tel" 
                      name="phone" 
                      placeholder="Số điện thoại liên hệ" 
                      value={form.phone} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <textarea 
                      name="address" 
                      placeholder="Địa chỉ giao cơm tận nơi" 
                      value={form.address} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      name="notes" 
                      placeholder="Ghi chú (Ví dụ: ít cay, ít cơm...)" 
                      value={form.notes} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <button type="submit" disabled={submittingOrder} className="btn btn-primary btn-checkout w-100">
                    {submittingOrder ? (
                      <><i className="fa-solid fa-rotate spinner"></i> Đang chuẩn bị cơm...</>
                    ) : (
                      <><i className="fa-solid fa-motorcycle"></i> Đặt Mua Giao Ngay</>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Nút Giỏ Hàng Nổi Trên Di Động (Floating Mobile Cart Button) */}
      {cart.length > 0 && (
        <button 
          onClick={() => {
            const cartElement = document.getElementById('cart-section');
            if (cartElement) {
              cartElement.scrollIntoView({ behavior: 'smooth' });
            }
          }} 
          className="mobile-floating-cart-btn"
          title="Xem giỏ hàng của bạn"
        >
          <span className="cart-icon-badge">
            <i className="fa-solid fa-cart-shopping"></i>
            <span className="count">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
          </span>
          <span className="cart-price">{totalAmount.toLocaleString('vi-VN')} đ</span>
        </button>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="success-icon">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h2>Đặt Cơm Thành Công!</h2>
            <p className="modal-message">{orderSuccess.message}</p>
            <div className="order-details-card">
              <div>Mã Đơn Hàng: <strong>#{orderSuccess.orderId}</strong></div>
              <div style={{ marginTop: '8px' }}>Nhà bếp đã nhận được đơn đặt hàng của bạn và đang chuẩn bị chế biến ngay. Đơn hàng sẽ được giao trong vòng 30 phút!</div>
            </div>
            <button onClick={() => setOrderSuccess(null)} className="btn btn-primary w-100">
              Tuyệt vời, cảm ơn Mẹ!
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .home-page {
          padding-top: 20px;
          padding-bottom: 80px;
        }

        .layout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
          margin-top: 30px;
        }

        @media (max-width: 992px) {
          .layout-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Categories Bar */
        .categories-bar {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 24px;
          scrollbar-width: thin;
        }

        .category-btn {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          padding: 8px 18px;
          border-radius: 12px;
          font-family: var(--font-main);
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          white-space: nowrap;
          transition: var(--transition-smooth);
        }

        .category-btn:hover {
          color: var(--text-primary);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .category-btn.active {
          background: var(--primary);
          color: #FFF;
          border-color: var(--primary);
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.25);
        }

        /* Loader */
        .loader-container {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-secondary);
        }

        .loader-icon {
          font-size: 2.5rem;
          color: var(--primary);
          margin-bottom: 16px;
        }

        /* Food Grid & Cards */
        .food-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .food-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          overflow: hidden;
          transition: var(--transition-smooth);
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px var(--glass-shadow);
        }

        .food-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-glow);
          box-shadow: 0 10px 30px rgba(255, 107, 53, 0.08);
        }

        .food-image-wrapper {
          position: relative;
          height: 180px;
          overflow: hidden;
        }

        .food-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition-smooth);
        }

        .food-card:hover .food-image {
          transform: scale(1.08);
        }

        .food-category-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(11, 15, 25, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--secondary);
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .food-info {
          padding: 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .food-name {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #FFF;
        }

        .food-desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 20px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .food-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .food-price {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--secondary);
        }

        .add-to-cart-btn {
          padding: 6px 12px;
          font-size: 0.85rem;
          border-radius: 8px;
        }

        /* Cart Sidebar */
        .cart-sidebar {
          position: sticky;
          top: 90px;
          height: fit-content;
        }

        .cart-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 10px 30px var(--glass-shadow);
        }

        .cart-card h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 12px;
          color: #FFF;
        }

        .cart-card h2 i {
          color: var(--primary);
        }

        .empty-cart {
          text-align: center;
          padding: 40px 10px;
          color: var(--text-muted);
        }

        .empty-cart i {
          font-size: 3rem;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-cart p {
          font-size: 0.9rem;
        }

        /* Cart Items */
        .cart-items-list {
          max-height: 240px;
          overflow-y: auto;
          margin-bottom: 20px;
          padding-right: 4px;
        }

        .cart-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        .cart-item-details h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #FFF;
          margin-bottom: 2px;
        }

        .cart-item-details span {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .qty-controls {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }

        .qty-btn {
          background: none;
          border: none;
          color: var(--text-primary);
          width: 24px;
          height: 24px;
          font-weight: bold;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .qty-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--primary);
        }

        .qty-value {
          width: 24px;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .cart-remove-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.95rem;
          transition: var(--transition-smooth);
        }

        .cart-remove-btn:hover {
          color: var(--danger);
        }

        /* Cart Summary */
        .cart-summary {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }

        .summary-row:last-child {
          margin-bottom: 0;
        }

        .total-row {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 8px;
          margin-top: 8px;
          font-size: 1.05rem;
          color: #FFF;
        }

        .total-row strong {
          color: var(--secondary);
        }

        /* Checkout Form */
        .checkout-form {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 18px;
        }

        .checkout-form h3 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 12px;
        }

        .form-group {
          margin-bottom: 10px;
        }

        .form-group input, .form-group textarea {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 14px;
          color: var(--text-primary);
          font-family: var(--font-main);
          font-size: 0.85rem;
          transition: var(--transition-smooth);
        }

        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.12);
        }

        .form-group textarea {
          height: 60px;
          resize: none;
        }

        .btn-checkout {
          margin-top: 10px;
          font-size: 0.9rem;
          padding: 12px;
          border-radius: 12px;
        }

        .w-100 {
          width: 100%;
        }

        /* Modal Overlay */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .modal-content {
          background: var(--surface-dark);
          border: 1px solid var(--border-glow);
          border-radius: 28px;
          padding: 36px;
          width: 100%;
          max-width: 440px;
          text-align: center;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .success-icon {
          width: 70px;
          height: 70px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .success-icon i {
          font-size: 3rem;
          color: var(--success);
        }

        .modal-content h2 {
          font-size: 1.6rem;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 8px;
        }

        .modal-message {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-bottom: 24px;
        }

        .order-details-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          text-align: left;
          margin-bottom: 28px;
        }

        .order-details-card strong {
          color: var(--secondary);
          font-size: 1rem;
        }

        /* Responsive Mobile Layouts & Premium Interactions */
        .mobile-floating-cart-btn {
          display: none;
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: linear-gradient(135deg, var(--primary) 0%, #FF8F6B 100%);
          border: none;
          border-radius: 50px;
          padding: 14px 24px;
          color: #FFF;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 25px rgba(255, 107, 53, 0.4);
          z-index: 9999;
          font-family: var(--font-main);
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: var(--transition-smooth);
          animation: pulseGlow 2s infinite ease-in-out;
        }

        .mobile-floating-cart-btn:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 12px 30px rgba(255, 107, 53, 0.55);
        }

        .cart-icon-badge {
          position: relative;
          display: flex;
          align-items: center;
          font-size: 1.25rem;
        }

        .cart-icon-badge .count {
          position: absolute;
          top: -8px;
          right: -10px;
          background: var(--bg-dark);
          color: var(--secondary);
          font-size: 0.7rem;
          font-weight: 800;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--secondary);
        }

        @keyframes pulseGlow {
          0% {
            box-shadow: 0 10px 25px rgba(255, 107, 53, 0.4);
          }
          50% {
            box-shadow: 0 10px 35px rgba(255, 107, 53, 0.7);
          }
          100% {
            box-shadow: 0 10px 25px rgba(255, 107, 53, 0.4);
          }
        }

        @media (max-width: 992px) {
          .layout-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .cart-sidebar {
            position: relative;
            top: 0;
            margin-top: 20px;
          }
          .mobile-floating-cart-btn {
            display: flex;
          }
        }

        @media (max-width: 600px) {
          .hero-section {
            padding: 30px 16px 20px;
          }
          .hero-section h1 {
            font-size: 2.1rem;
          }
          .hero-section p {
            font-size: 0.9rem;
          }
          .categories-bar {
            gap: 8px;
            margin-bottom: 16px;
          }
          .category-btn {
            padding: 6px 14px;
            font-size: 0.8rem;
          }
          .food-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 16px;
          }
          .food-card {
            border-radius: 16px;
          }
          .food-image-wrapper {
            height: 150px;
          }
          .food-info {
            padding: 16px;
          }
          .food-name {
            font-size: 1.05rem;
            margin-bottom: 6px;
          }
          .food-desc {
            font-size: 0.8rem;
            margin-bottom: 12px;
          }
          .food-price {
            font-size: 1.1rem;
          }
          .add-to-cart-btn {
            padding: 6px 10px;
            font-size: 0.8rem;
          }
          .cart-card {
            padding: 16px;
            border-radius: 16px;
          }
          .modal-content {
            padding: 24px;
            border-radius: 20px;
            margin: 16px;
          }
        }
      ` }} />
    </div>
  );
};

export default Home;
