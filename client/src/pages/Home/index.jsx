import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import AddressSelector from '../../components/AddressSelector';
import AlertModal from '../../components/AlertModal';
import './style.css';

const Home = ({ user }) => {
  // Custom Alert State
  const [alertState, setAlertState] = useState({
    isOpen: false,
    message: '',
    type: 'info',
    onConfirm: null
  });

  const showAlert = (message, type = 'info', onConfirm = null) => {
    setAlertState({ isOpen: true, message, type, onConfirm });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  // Menu and Kitchen states
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kitchens, setKitchens] = useState([]);
  const [selectedKitchenId, setSelectedKitchenId] = useState('');
  const [selectedKitchen, setSelectedKitchen] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Address and Shipping states
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [calculatingShip, setCalculatingShip] = useState(false);

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

  // 1. Khởi tạo danh sách chi nhánh bếp và thông tin cá nhân
  useEffect(() => {
    const initKitchens = async () => {
      try {
        const kits = await api.getKitchens();
        setKitchens(kits);
        
        // Mặc định chọn bếp đầu tiên hoặc bếp Trần Thị Huyền
        const defaultKit = kits.find(k => k.name.includes('Huyền')) || kits[0];
        if (defaultKit) {
          setSelectedKitchenId(defaultKit.id);
          setSelectedKitchen(defaultKit);
        }
      } catch (err) {
        console.error('Error fetching kitchens:', err);
      }
    };

    initKitchens();

    // Điền sẵn thông tin nếu user đã đăng nhập
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.full_name || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  // 2. Tải thực đơn của bếp đã chọn
  useEffect(() => {
    const fetchMenuForKitchen = async () => {
      if (!selectedKitchenId) return;
      setLoading(true);
      try {
        const data = await api.getMenu(selectedKitchenId);
        setMenu(data);
      } catch (err) {
        console.error('Error fetching kitchen menu:', err);
        setMenu([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuForKitchen();
  }, [selectedKitchenId]);

  // 3. Tính toán phí vận chuyển khi bếp hoặc địa chỉ thay đổi
  useEffect(() => {
    const computeShipping = async () => {
      if (selectedAddress) {
        setCalculatingShip(true);
        try {
          const payload = {
            full_address: selectedAddress.full_address,
            kitchen_id: selectedKitchenId || null
          };

          const result = await api.calculateShipping(payload);
          setShippingFee(result.shipping_fee);
          
          // Điền địa chỉ vào form giao hàng
          setForm(prev => ({
            ...prev,
            address: selectedAddress.full_address
          }));
        } catch (err) {
          console.warn('Error calculating shipping:', err);
        } finally {
          setCalculatingShip(false);
        }
      } else if (form.address.trim()) {
        setCalculatingShip(true);
        try {
          const payload = {
            full_address: form.address,
            kitchen_id: selectedKitchenId || null
          };
          const result = await api.calculateShipping(payload);
          setShippingFee(result.shipping_fee);
        } catch (err) {
          console.warn('Error calculating shipping:', err);
        } finally {
          setCalculatingShip(false);
        }
      } else {
        setShippingFee(0);
      }
    };

    computeShipping();
  }, [selectedAddress, selectedKitchenId, form.address]);

  // Lọc món ăn theo danh mục
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

  const getCategoryTranslation = (categoryKey) => {
    const found = categories.find(cat => cat.id === categoryKey);
    return found ? found.name : categoryKey;
  };

  // Cart operations
  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  // Totals
  const foodTotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const totalAmount = foodTotal + shippingFee;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      showAlert('Vui lòng điền đầy đủ thông tin nhận hàng.', 'warning');
      return;
    }
    if (cart.length === 0) {
      showAlert('Giỏ hàng trống!', 'warning');
      return;
    }

    setSubmittingOrder(true);
    try {
      const orderPayload = {
        customer_name: form.name,
        customer_phone: form.phone,
        customer_address: form.address,
        address_id: selectedAddress ? selectedAddress.id : null,
        kitchen_id: selectedKitchenId ? parseInt(selectedKitchenId) : null,
        shipping_fee: shippingFee,
        total_amount: totalAmount,
        notes: form.notes,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const result = await api.placeOrder(orderPayload);
      
      // Lưu lại thông tin đơn hàng trên thiết bị (cho khách vãng lai tra cứu)
      const guestOrderIds = JSON.parse(localStorage.getItem('guest_order_ids') || '[]');
      if (result?.data?.id) {
        guestOrderIds.push(result.data.id);
        localStorage.setItem('guest_order_ids', JSON.stringify(guestOrderIds));
      }
      if (form.phone) {
        localStorage.setItem('guest_phone', form.phone);
      }

      setOrderSuccess(result);
      setCart([]); // Xóa giỏ hàng
      setForm({ name: '', phone: '', address: '', notes: '' }); // Reset form
      setSelectedAddress(null);
      setShippingFee(0);
    } catch (err) {
      showAlert(`Không thể đặt hàng: ${err.message}`, 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleKitchenSelect = (kitId) => {
    if (selectedKitchenId == kitId) return;
    
    const kit = kitchens.find(k => k.id == kitId);
    
    // Xóa giỏ khi đổi bếp để tránh đặt lộn món của các chi nhánh khác nhau
    if (cart.length > 0) {
      showAlert(
        'Đổi chi nhánh bếp sẽ làm trống giỏ hàng hiện tại của bạn. Bạn có muốn tiếp tục?',
        'warning',
        () => {
          setCart([]);
          setSelectedKitchenId(kitId);
          setSelectedKitchen(kit);
        }
      );
    } else {
      setSelectedKitchenId(kitId);
      setSelectedKitchen(kit);
    }
  };

  return (
    <div className="home-page container">
      <header className="hero-section">
        <h1>Bếp Mẹ Huyền</h1>
        <p>Thực đơn cơm nhà ấm nóng, đậm đà tình quê. Chuẩn vị mẹ nấu từ nguyên liệu tươi ngon nhất mỗi ngày!</p>
      </header>

      {/* BỘ CHỌN CHI NHÁNH BẾP CAO CẤP */}
      <div className="kitchen-selection-wrapper">
        <h3 className="kitchen-section-title">
          <i className="fa-solid fa-store" style={{ color: 'var(--primary)' }}></i> Chọn Chi Nhánh Bếp Gần Bạn Nhất
        </h3>
        <div className="kitchen-cards-container">
          {kitchens.map(k => {
            const isSelected = selectedKitchenId == k.id;
            return (
              <div 
                key={k.id} 
                className={`kitchen-branch-card ${isSelected ? 'active' : ''}`}
                onClick={() => handleKitchenSelect(k.id)}
              >
                <div className="branch-card-header">
                  <span className="branch-status-dot"></span>
                  <span className="branch-name">{k.name}</span>
                  {isSelected && <span className="selected-check">✓ Đang Chọn</span>}
                </div>
                <p className="branch-address">📍 {k.address}</p>
                {k.staff_name && (
                  <div className="branch-meta-owner">
                    <i className="fa-solid fa-fire-burner"></i> Đầu bếp phụ trách: <strong>{k.staff_name}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
          ) : filteredMenu.length === 0 ? (
            <p className="text-center py-5 text-secondary">Chi nhánh này hiện chưa mở bán hoặc hết món. Vui lòng chọn chi nhánh bếp khác!</p>
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
              <form onSubmit={handleCheckout} className="cart-form-container">
                <div className="cart-scroll-body">
                  <div className="cart-items-list">
                    {cart.map(item => (
                      <div key={item.id} className="cart-item">
                        <div className="cart-item-details">
                          <h4>{item.name}</h4>
                          <span>{parseFloat(item.price).toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="cart-item-actions">
                          <div className="qty-controls">
                            <button type="button" onClick={() => updateQuantity(item.id, -1)} className="qty-btn">-</button>
                            <span className="qty-value">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, 1)} className="qty-btn">+</button>
                          </div>
                          <button type="button" onClick={() => removeFromCart(item.id)} className="cart-remove-btn">
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sổ chọn địa chỉ cố định của thành viên */}
                  <AddressSelector 
                    user={user} 
                    onAddressSelect={setSelectedAddress}
                    selectedAddressId={selectedAddress?.id}
                  />

                  <div className="cart-summary">
                    <div className="summary-row">
                      <span>Cơm nhà ({cart.reduce((s, i) => s + i.quantity, 0)} món):</span>
                      <strong>{foodTotal.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    
                    <div className="summary-row">
                      <span>Phí giao hàng:</span>
                      <strong>
                        {calculatingShip ? (
                          <i className="fa-solid fa-spinner spinner"></i>
                        ) : shippingFee > 0 ? (
                          `${shippingFee.toLocaleString('vi-VN')} đ`
                        ) : (
                          'Miễn phí'
                        )}
                      </strong>
                    </div>

                    <div className="summary-row total-row">
                      <span>Tổng cộng:</span>
                      <strong>{totalAmount.toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>

                  <div className="checkout-fields">
                    <h3>Thông Tin Nhận Hàng</h3>
                    <div className="form-group">
                      <input 
                        type="text" 
                        name="name" 
                        placeholder="Họ và tên người nhận" 
                        value={form.name} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <input 
                        type="tel" 
                        name="phone" 
                        placeholder="Số điện thoại người nhận" 
                        value={form.phone} 
                        onChange={handleInputChange} 
                        required 
                      />
                    </div>
                    
                    {/* Nếu chưa chọn từ sổ địa chỉ, cho phép gõ địa chỉ vãng lai */}
                    {!selectedAddress && (
                      <div className="form-group">
                        <input 
                          type="text"
                          name="address" 
                          placeholder="Nhập địa chỉ giao cơm tận nơi..." 
                          value={form.address} 
                          onChange={handleInputChange} 
                          required 
                        />
                      </div>
                    )}

                    {selectedAddress && (
                      <div className="form-group" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        📍 <strong>Giao tới địa chỉ đã chọn:</strong> {selectedAddress.full_address}
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0 4px', textDecoration: 'underline' }}
                          onClick={() => setSelectedAddress(null)}
                        >
                          Thay đổi
                        </button>
                      </div>
                    )}

                    <div className="form-group">
                      <input 
                        type="text" 
                        name="notes" 
                        placeholder="Ghi chú thêm (Ví dụ: ít cay, ít cơm...)" 
                        value={form.notes} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>
                </div>

                <div className="cart-sticky-action">
                  <button type="submit" disabled={submittingOrder || calculatingShip} className="btn btn-primary btn-checkout w-100">
                    {submittingOrder ? (
                      <><i className="fa-solid fa-rotate spinner"></i> Đang chuẩn bị đơn...</>
                    ) : (
                      <><i className="fa-solid fa-motorcycle"></i> Xác nhận đặt cơm</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Floating Button */}
      {cart.length > 0 && (
        <button 
          onClick={() => {
            const cartElement = document.getElementById('cart-section');
            if (cartElement) {
              cartElement.scrollIntoView({ behavior: 'smooth' });
            }
          }} 
          className="mobile-floating-cart-btn"
          title="Xem giỏ hàng"
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
            <p className="modal-message">{orderSuccess.message || 'Cảm ơn bạn đã lựa chọn Bếp Mẹ Huyền!'}</p>
            <div className="order-details-card">
              <div>Mã Đơn Hàng: <strong>#{orderSuccess.data?.id || orderSuccess.orderId}</strong></div>
              <div style={{ marginTop: '8px' }}>
                Đơn hàng của bạn đang được chuẩn bị tại chi nhánh <strong>{selectedKitchen?.name}</strong>.
                Hệ thống sẽ giao cơm nóng hổi đến cho bạn trong thời gian sớm nhất!
              </div>
            </div>
            <button onClick={() => setOrderSuccess(null)} className="btn btn-primary w-100">
              Tuyệt vời, cảm ơn Mẹ!
            </button>
          </div>
        </div>
      )}
      <AlertModal 
        isOpen={alertState.isOpen} 
        message={alertState.message} 
        type={alertState.type} 
        onClose={closeAlert} 
        onConfirm={alertState.onConfirm}
      />
    </div>
  );
};

export default Home;
