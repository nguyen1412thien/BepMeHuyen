import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Home.css';

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

  // Dịch mã danh mục tiếng Anh sang tiếng Việt hiển thị
  const getCategoryTranslation = (categoryKey) => {
    const found = categories.find(cat => cat.id === categoryKey);
    return found ? found.name : categoryKey;
  };

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
                    <span className="food-category-badge">{getCategoryTranslation(item.category)}</span>
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
    </div>
  );
};

export default Home;
