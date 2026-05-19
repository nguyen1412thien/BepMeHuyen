import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import AlertModal from '../../components/AlertModal';
import AccountsManager from '../../components/AccountsManager';
import './style.css';

const StaffDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const [loading, setLoading] = useState(true);

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

  // States for Orders
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');

  // States for Menu Items
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([
    { slug: 'Main Course', name: 'Món Chính' },
    { slug: 'Soup', name: 'Món Canh' },
    { slug: 'Side Dish', name: 'Món Phụ' },
    { slug: 'Drink', name: 'Đồ Uống' },
    { slug: 'Dessert', name: 'Tráng Miệng' }
  ]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Main Course',
    image_url: '',
    is_available: true,
    kitchen_id: ''
  });

  const [imageSourceType, setImageSourceType] = useState('url');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 640, height: 480 }
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.error('Không thể mở camera:', err);
      showAlert('Không thể mở camera. Vui lòng cấp quyền camera cho trình duyệt hoặc dán link/tải file!', 'warning');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const result = await api.uploadMenuItemImage(formData);
      if (result.success) {
        setItemForm(prev => ({ ...prev, image_url: result.imageUrl }));
        showAlert('Tải ảnh lên thành công!', 'success');
      } else {
        showAlert(result.error || 'Tải ảnh thất bại!', 'error');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      showAlert('Lỗi khi tải ảnh lên: ' + err.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showAlert('Không thể chụp được ảnh!', 'error');
          return;
        }
        
        setUploadingImage(true);
        try {
          const file = new File([blob], `dish-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const formData = new FormData();
          formData.append('image', file);
          
          const result = await api.uploadMenuItemImage(formData);
          if (result.success) {
            setItemForm(prev => ({ ...prev, image_url: result.imageUrl }));
            showAlert('Đã chụp và tải ảnh món lên thành công!', 'success');
            stopCamera();
            setImageSourceType('url'); // Switch to preview
          } else {
            showAlert(result.error || 'Không thể upload ảnh chụp!', 'error');
          }
        } catch (err) {
          console.error('Error uploading captured photo:', err);
          showAlert('Lỗi khi upload ảnh chụp: ' + err.message, 'error');
        } finally {
          setUploadingImage(false);
        }
      }, 'image/jpeg', 0.85);
    } catch (err) {
      console.error('Error capturing photo:', err);
      showAlert('Không thể chụp ảnh: ' + err.message, 'error');
    }
  };

  // States for Kitchens
  const [kitchens, setKitchens] = useState([]);
  const [showKitchenModal, setShowKitchenModal] = useState(false);
  const [selectedKitchen, setSelectedKitchen] = useState(null);
  const [kitchenForm, setKitchenForm] = useState({
    name: '',
    address: '',
    is_active: true
  });
  const [selectedManageKitchen, setSelectedManageKitchen] = useState(null);

  // Load initial dashboard data
  useEffect(() => {
    fetchData();
  }, [activeTab, orderFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders') {
        const filterStatus = orderFilter === 'all' ? null : orderFilter;
        const data = await api.getAllOrders(filterStatus);
        setOrders(data);
      } else if (activeTab === 'menu') {
        const data = await api.getMenu(); // gets all items (since user is staff)
        const kits = await api.getKitchens(true);
        setMenuItems(data);
        setKitchens(kits);
      } else if (activeTab === 'kitchens') {
        const kits = await api.getKitchens(true);
        setKitchens(kits);
        const data = await api.getMenu();
        setMenuItems(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Order Operations ---
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showAlert(`Đã chuyển đơn hàng sang trạng thái: ${getOrderStatusText(newStatus)}`, 'success');
      // Refresh orders
      fetchData();
    } catch (err) {
      showAlert(`Lỗi cập nhật trạng thái đơn hàng: ${err.message}`, 'error');
    }
  };

  const handleCancelOrder = async (orderId) => {
    const reason = prompt("Nhập lý do hủy đơn hàng này:");
    if (reason === null) return;
    if (!reason.trim()) {
      showAlert("Bạn phải nhập lý do hủy đơn!", "warning");
      return;
    }
    
    try {
      await api.updateOrderStatus(orderId, 'cancelled', reason.trim());
      showAlert("Đã hủy đơn hàng thành công!", "success");
      fetchData();
    } catch (err) {
      showAlert(`Lỗi hủy đơn hàng: ${err.message}`, 'error');
    }
  };

  // --- Menu Operations ---
  const closeItemModal = () => {
    stopCamera();
    setShowItemModal(false);
  };

  const openAddItemModal = () => {
    setSelectedItem(null);
    setImageSourceType('url');
    setItemForm({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      image_url: '',
      is_available: true,
      kitchen_id: kitchens[0]?.id || ''
    });
    setShowItemModal(true);
  };

  const openAddItemForKitchen = (kitchenId) => {
    setSelectedItem(null);
    setImageSourceType('url');
    setItemForm({
      name: '',
      description: '',
      price: '',
      category: 'Main Course',
      image_url: '',
      is_available: true,
      kitchen_id: kitchenId
    });
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setSelectedItem(item);
    setImageSourceType('url');
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: Math.round(item.price),
      category: item.category || 'Main Course',
      image_url: item.image_url || '',
      is_available: !!item.is_available,
      kitchen_id: item.kitchen_id || ''
    });
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        is_available: itemForm.is_available ? 1 : 0,
        kitchen_id: itemForm.kitchen_id ? parseInt(itemForm.kitchen_id) : null
      };

      if (selectedItem) {
        await api.updateMenuItem(selectedItem.id, payload);
        showAlert('Cập nhật món ăn thành công!', 'success');
      } else {
        await api.createMenuItem(payload);
        showAlert('Thêm món ăn thành công!', 'success');
      }
      closeItemModal();
      fetchData();
    } catch (err) {
      showAlert(`Lỗi lưu món ăn: ${err.message}`, 'error');
    }
  };

  const handleDeleteItem = (id) => {
    showAlert(
      'Bạn có chắc chắn muốn xóa món ăn này khỏi thực đơn không?',
      'warning',
      async () => {
        try {
          await api.deleteMenuItem(id);
          showAlert('Đã xóa món ăn thành công.', 'success');
          fetchData();
        } catch (err) {
          showAlert(`Lỗi xóa món ăn: ${err.message}`, 'error');
        }
      }
    );
  };

  // --- Kitchen Operations ---
  const openAddKitchenModal = () => {
    setSelectedKitchen(null);
    setKitchenForm({
      name: '',
      address: '',
      is_active: true
    });
    setShowKitchenModal(true);
  };

  const openEditKitchenModal = (kitchen) => {
    setSelectedKitchen(kitchen);
    setKitchenForm({
      name: kitchen.name,
      address: kitchen.address,
      is_active: !!kitchen.is_active
    });
    setShowKitchenModal(true);
  };

  const handleKitchenSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: kitchenForm.name,
        address: kitchenForm.address,
        is_active: kitchenForm.is_active ? 1 : 0
      };

      if (selectedKitchen) {
        const result = await api.updateKitchen(selectedKitchen.id, payload);
        if (result.success && selectedManageKitchen && selectedManageKitchen.id === selectedKitchen.id) {
          // Merge newly saved details
          setSelectedManageKitchen({
            ...selectedManageKitchen,
            name: payload.name,
            address: payload.address,
            is_active: payload.is_active
          });
        }
        showAlert('Cập nhật chi nhánh bếp thành công!', 'success');
      } else {
        await api.createKitchen(payload);
        showAlert('Thêm chi nhánh bếp thành công!', 'success');
      }
      setShowKitchenModal(false);
      fetchData();
    } catch (err) {
      showAlert(`Lỗi lưu chi nhánh: ${err.message}`, 'error');
    }
  };

  const handleDeleteKitchen = (id) => {
    showAlert(
      'Bạn có chắc chắn muốn xóa chi nhánh này? Mọi món ăn thuộc chi nhánh này sẽ không còn hiển thị.',
      'warning',
      async () => {
        try {
          await api.deleteKitchen(id);
          showAlert('Đã xóa chi nhánh bếp thành công.', 'success');
          setSelectedManageKitchen(null);
          fetchData();
        } catch (err) {
          showAlert(`Lỗi xóa chi nhánh: ${err.message}`, 'error');
        }
      }
    );
  };

  const getOrderStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'confirmed': return 'Đã nhận đơn';
      case 'preparing': return 'Đang nấu';
      case 'shipping': return 'Đang giao';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getCategoryName = (slug) => {
    const found = categories.find(cat => cat.slug === slug);
    return found ? found.name : slug;
  };

  return (
    <div className="dashboard-page container">
      <div className="orders-header">
        <h1>Bảng Quản Lý Nghiệp Vụ</h1>
        <p>Quản lý đơn hàng, điều phối bếp và cập nhật thực đơn tức thời</p>
      </div>

      <div className="dashboard-container">
        {/* Left Tabs Sidebar */}
        <aside className="dashboard-sidebar">
          <button 
            className={`dashboard-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setOrderFilter('all'); }}
          >
            <i className="fa-solid fa-receipt"></i> Quản Lý Đơn Hàng
          </button>

          {user?.role === 'admin' ? (
            <>
              <button
                className={`dashboard-tab-btn ${activeTab === 'kitchens' ? 'active' : ''}`}
                onClick={() => { setActiveTab('kitchens'); setSelectedManageKitchen(null); }}
              >
                <i className="fa-solid fa-store"></i> Quản Lý Chi Nhánh & Thực Đơn
              </button>
              <button
                className={`dashboard-tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
                onClick={() => setActiveTab('accounts')}
              >
                <i className="fa-solid fa-users"></i> Quản Lý Tài Khoản
              </button>
            </>
          ) : (            <>
              <button 
                className={`dashboard-tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveTab('menu')}
              >
                <i className="fa-solid fa-utensils"></i> Quản Lý Thực Đơn
              </button>
              <button 
                className={`dashboard-tab-btn ${activeTab === 'kitchens' ? 'active' : ''}`}
                onClick={() => { setActiveTab('kitchens'); setSelectedManageKitchen(null); }}
              >
                <i className="fa-solid fa-store"></i> Quản Lý Chi Nhánh Bếp
              </button>
            </>
          )}
        </aside>

        {/* Right Content Panel */}
        <main className="dashboard-content">
          
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              <div className="panel-header">
                <h2>Danh Sách Đơn Hàng</h2>
                <div className="status-filters">
                  {['all', 'pending', 'confirmed', 'shipping', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      className={`filter-btn ${orderFilter === status ? 'active' : ''}`}
                      onClick={() => setOrderFilter(status)}
                    >
                      {status === 'all' ? 'Tất cả' : getOrderStatusText(status)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <i className="fa-solid fa-spinner spinner loader-icon"></i>
                  <p>Đang tải danh sách đơn hàng...</p>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-center py-5">Không tìm thấy đơn hàng nào ở trạng thái này.</p>
              ) : (
                <div className="items-grid">
                  {orders.map(order => (
                    <div key={order.id} className="dashboard-item-card order-panel-card">
                      <div className="order-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div className="order-id" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Mã Đơn: <strong>#{order.id}</strong></div>
                        <span className={`order-badge badge-${order.order_status}`}>
                          {getOrderStatusText(order.order_status)}
                        </span>
                      </div>
                      <div className="item-card-details">
                        <h4>{order.receiver_name}</h4>
                        <p>{order.receiver_phone}</p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="item-card-meta">
                          <span>Giao tới:</span>
                          <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{order.delivery_address}</strong>
                        </div>
                        {order.shipping_fee > 0 && (
                          <div className="item-card-meta mt-1">
                            <span>Phí ship:</span>
                            <strong>{parseFloat(order.shipping_fee).toLocaleString('vi-VN')} đ</strong>
                          </div>
                        )}
                        <div className="item-card-meta mt-1">
                          <span>Bếp phục vụ:</span>
                          <strong className="text-primary">{order.kitchen_name || 'Bếp trung tâm'}</strong>
                        </div>
                        <div className="order-items-summary mt-3" style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          {order.items?.map(it => (
                            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                              <span style={{ color: 'var(--text-primary)' }}>{it.quantity}x {it.name}</span>
                            </div>
                          ))}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', paddingTop: '8px' }}>
                            <strong style={{ color: 'var(--text-secondary)' }}>Tổng cộng:</strong>
                            <strong className="text-primary">{parseFloat(order.total_amount).toLocaleString('vi-VN')} đ</strong>
                          </div>
                        </div>
                      </div>
                      <div className="item-card-actions mt-3">
                        {order.order_status === 'pending' && (
                          <>
                            <button className="btn btn-success btn-sm flex-1" onClick={() => handleStatusChange(order.id, 'confirmed')}><i className="fa-solid fa-check"></i> Nhận đơn</button>
                            <button className="btn btn-danger-outline btn-sm flex-1" onClick={() => handleCancelOrder(order.id)}><i className="fa-solid fa-xmark"></i> Hủy</button>
                          </>
                        )}
                        {order.order_status === 'confirmed' && (
                          <>
                            <button className="btn btn-warning btn-sm flex-1" onClick={() => handleStatusChange(order.id, 'shipping')} style={{color:'#fff'}}><i className="fa-solid fa-truck"></i> Giao hàng</button>
                            <button className="btn btn-danger-outline btn-sm flex-1" onClick={() => handleCancelOrder(order.id)}><i className="fa-solid fa-xmark"></i> Hủy</button>
                          </>
                        )}
                        {order.order_status === 'shipping' && (
                          <>
                            <button className="btn btn-success btn-sm flex-1" onClick={() => handleStatusChange(order.id, 'completed')}><i className="fa-solid fa-circle-check"></i> Hoàn thành</button>
                            <button className="btn btn-danger-outline btn-sm flex-1" onClick={() => handleCancelOrder(order.id)}><i className="fa-solid fa-xmark"></i> Hủy</button>
                          </>
                        )}
                        {order.order_status === 'cancelled' && order.cancel_reason && (
                          <div className="cancel-reason-text" style={{ fontSize: '0.8rem', color: '#ff7675', width: '100%', textAlign: 'center', background: 'rgba(231,76,60,0.1)', padding: '6px', borderRadius: '6px' }}>
                            Lý do hủy: {order.cancel_reason}
                          </div>
                        )}
                        {order.order_status === 'completed' && (
                          <div style={{ width: '100%', textAlign: 'center', color: 'var(--success)' }}>
                            <i className="fa-solid fa-check-double"></i> Giao hàng thành công
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MENU ITEMS */}
          {activeTab === 'menu' && (
            <div>
              <div className="panel-header">
                <h2>Quản Lý Thực Đơn</h2>
                <button className="btn btn-primary" onClick={openAddItemModal}>
                  <i className="fa-solid fa-plus"></i> Thêm Món Mới
                </button>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <i className="fa-solid fa-spinner spinner loader-icon"></i>
                  <p>Đang tải thực đơn...</p>
                </div>
              ) : (
                <div className="items-grid">
                  {menuItems.map(item => (
                    <div key={item.id} className="dashboard-item-card">
                      <div className="item-card-details">
                        <h4>{item.name}</h4>
                        <p>{item.description || 'Không có mô tả.'}</p>
                      </div>
                      <div>
                        <div className="item-card-meta">
                          <span>Phân loại:</span>
                          <strong>{getCategoryName(item.category)}</strong>
                        </div>
                        <div className="item-card-meta">
                          <span>Bếp phục vụ:</span>
                          <strong>{item.kitchen_name || 'Bếp mặc định'}</strong>
                        </div>
                        <div className="item-card-meta mt-1">
                          <span>Giá bán:</span>
                          <span className="item-price-tag">{parseFloat(item.price).toLocaleString('vi-VN')} đ</span>
                        </div>
                        <div className="item-card-meta mt-1">
                          <span>Trạng thái:</span>
                          <span className={`order-badge ${item.is_available ? 'badge-completed' : 'badge-cancelled'}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                            {item.is_available ? 'Còn món' : 'Hết món'}
                          </span>
                        </div>
                      </div>
                      <div className="item-card-actions">
                        <button className="btn btn-primary btn-sm flex-1" onClick={() => openEditItemModal(item)}>
                          Sửa
                        </button>
                        <button className="btn btn-danger-outline btn-sm" onClick={() => handleDeleteItem(item.id)}>
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KITCHENS & MENU */}
          {activeTab === 'kitchens' && (
            <div>
              {selectedManageKitchen ? (
                <div>
                  <button className="btn btn-secondary btn-sm mb-4" onClick={() => setSelectedManageKitchen(null)}>
                    <i className="fa-solid fa-arrow-left"></i> Quay lại danh sách chi nhánh
                  </button>
                  
                  <div className="selected-kitchen-header-card">
                    <div className="kitchen-info-main">
                      <h2><i className="fa-solid fa-store"></i> {selectedManageKitchen.name}</h2>
                      <p className="kitchen-address">📍 {selectedManageKitchen.address}</p>
                      <div className="kitchen-badges-row">
                        <span className={`order-badge ${selectedManageKitchen.is_active ? 'badge-completed' : 'badge-cancelled'}`}>
                          {selectedManageKitchen.is_active ? 'Hoạt động' : 'Tạm đóng'}
                        </span>
                        <span className="staff-badge">
                          <i className="fa-solid fa-user-tie"></i> Phụ trách: <strong>{selectedManageKitchen.staff_name}</strong>
                        </span>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <button className="btn btn-primary-outline btn-sm" onClick={() => openEditKitchenModal(selectedManageKitchen)}>
                        <i className="fa-solid fa-pen-to-square"></i> Sửa Chi Nhánh
                      </button>
                    )}
                  </div>

                  <div className="panel-header mt-5">
                    <h3>Thực Đơn Của Chi Nhánh</h3>
                    <button className="btn btn-primary" onClick={() => openAddItemForKitchen(selectedManageKitchen.id)}>
                      <i className="fa-solid fa-plus"></i> Thêm Món Mới Vào Bếp
                    </button>
                  </div>

                  {/* List of Menu Items for this Kitchen */}
                  {menuItems.filter(item => item.kitchen_id === selectedManageKitchen.id).length === 0 ? (
                    <div className="text-center py-5 no-menu-items">
                      <i className="fa-solid fa-bowl-food" style={{ fontSize: '3rem', opacity: 0.3, marginBottom: '16px', display: 'block', margin: '0 auto' }}></i>
                      <p>Chi nhánh này chưa có món ăn nào trong thực đơn.</p>
                      <button className="btn btn-primary btn-sm mt-3" onClick={() => openAddItemForKitchen(selectedManageKitchen.id)}>
                        Thêm món ăn đầu tiên
                      </button>
                    </div>
                  ) : (
                    <div className="items-grid">
                      {menuItems.filter(item => item.kitchen_id === selectedManageKitchen.id).map(item => (
                        <div key={item.id} className="dashboard-item-card">
                          <div className="item-image-preview-card">
                            <img 
                              src={item.image_url ? (item.image_url.startsWith('/uploads') ? `http://localhost:3000${item.image_url}` : item.image_url) : 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=60'} 
                              alt={item.name} 
                              style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }}
                            />
                          </div>
                          <div className="item-card-details">
                            <h4>{item.name}</h4>
                            <p>{item.description || 'Không có mô tả.'}</p>
                          </div>
                          <div>
                            <div className="item-card-meta">
                              <span>Phân loại:</span>
                              <strong>{getCategoryName(item.category)}</strong>
                            </div>
                            <div className="item-card-meta mt-1">
                              <span>Giá bán:</span>
                              <span className="item-price-tag">{parseFloat(item.price).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="item-card-meta mt-1">
                              <span>Trạng thái:</span>
                              <span className={`order-badge ${item.is_available ? 'badge-completed' : 'badge-cancelled'}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                                {item.is_available ? 'Còn món' : 'Hết món'}
                              </span>
                            </div>
                          </div>
                          <div className="item-card-actions">
                            <button className="btn btn-primary btn-sm flex-1" onClick={() => openEditItemModal(item)}>
                              Sửa Món
                            </button>
                            <button className="btn btn-danger-outline btn-sm" onClick={() => handleDeleteItem(item.id)}>
                              Xóa Món
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="panel-header">
                    <h2>Danh Sách Chi Nhánh Bếp</h2>
                    {user?.role === 'admin' && (
                      <button className="btn btn-primary" onClick={openAddKitchenModal}>
                        <i className="fa-solid fa-plus"></i> Thêm Chi Nhánh
                      </button>
                    )}
                  </div>

                  {loading ? (
                    <div className="text-center py-5">
                      <i className="fa-solid fa-spinner spinner loader-icon"></i>
                      <p>Đang tải chi nhánh bếp...</p>
                    </div>
                  ) : (
                    <div className="items-grid">
                      {kitchens.map(kitchen => {
                        const canEdit = user?.role === 'admin' || kitchen.staff_id === user?.id;
                        const canDelete = user?.role === 'admin';
                        
                        return (
                          <div 
                            key={kitchen.id} 
                            className="dashboard-item-card clickable-card"
                            onClick={(e) => {
                              if (e.target.closest('.btn')) return;
                              setSelectedManageKitchen(kitchen);
                            }}
                            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                          >
                            <div className="item-card-details">
                              <h4>{kitchen.name}</h4>
                              <p style={{ webkitLineClamp: 3 }}>📍 {kitchen.address}</p>
                            </div>
                            <div>
                              <div className="item-card-meta">
                                <span>Chủ bếp (Staff):</span>
                                <strong>{kitchen.staff_name}</strong>
                              </div>
                              <div className="item-card-meta mt-1">
                                <span>Trạng thái:</span>
                                <span className={`order-badge ${kitchen.is_active ? 'badge-completed' : 'badge-cancelled'}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                                  {kitchen.is_active ? 'Hoạt động' : 'Tạm đóng'}
                                </span>
                              </div>
                            </div>
                            <div className="item-card-actions">
                              <button className="btn btn-secondary btn-sm flex-1" onClick={() => setSelectedManageKitchen(kitchen)}>
                                <i className="fa-solid fa-utensils"></i> Xem Thực Đơn
                              </button>
                              {canEdit && (
                                <button className="btn btn-primary btn-sm" onClick={() => openEditKitchenModal(kitchen)}>
                                  Sửa
                                </button>
                              )}
                              {canDelete && (
                                <button className="btn btn-danger-outline btn-sm" onClick={() => handleDeleteKitchen(kitchen.id)}>
                                  Xóa
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ACCOUNTS (ADMIN ONLY) */}
          {activeTab === 'accounts' && user?.role === 'admin' && (
            <AccountsManager showAlert={showAlert} />
          )}

        </main>
      </div>

      {/* --- ADD/EDIT ITEM MODAL --- */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal">
            <div className="modal-header-accent">
              <i className="fa-solid fa-pizza-slice header-icon"></i>
              <h3>{selectedItem ? 'Cập Nhật Món Ăn' : 'Thêm Món Ăn Mới'}</h3>
            </div>
            <form onSubmit={handleItemSubmit} className="premium-form">
              <div className="premium-form-body">
                <div className="form-group">
                  <label><i className="fa-solid fa-utensils"></i> Tên món ăn*</label>
                  <input 
                    type="text" 
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="Ví dụ: Cơm sườn bì chả, Canh chua..."
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fa-solid fa-tag"></i> Giá bán (VNĐ)*</label>
                    <input 
                      type="number" 
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      placeholder="35000"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label><i className="fa-solid fa-list"></i> Danh mục</label>
                    <select 
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label><i className="fa-solid fa-comment-dots"></i> Mô tả món ăn</label>
                  <textarea 
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Mô tả hương vị, nguyên liệu..."
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label><i className="fa-solid fa-image"></i> Hình ảnh món ăn*</label>
                  
                  {/* image-tabs selection */}
                  <div className="image-tabs-container">
                    <button 
                      type="button" 
                      className={`image-tab-btn ${imageSourceType === 'url' ? 'active' : ''}`}
                      onClick={() => { stopCamera(); setImageSourceType('url'); }}
                    >
                      <i className="fa-solid fa-link"></i> Dán Link
                    </button>
                    <button 
                      type="button" 
                      className={`image-tab-btn ${imageSourceType === 'upload' ? 'active' : ''}`}
                      onClick={() => { stopCamera(); setImageSourceType('upload'); }}
                    >
                      <i className="fa-solid fa-cloud-arrow-up"></i> Tải ảnh lên
                    </button>
                    <button 
                      type="button" 
                      className={`image-tab-btn ${imageSourceType === 'camera' ? 'active' : ''}`}
                      onClick={() => {
                        setImageSourceType('camera');
                        startCamera();
                      }}
                    >
                      <i className="fa-solid fa-camera"></i> Chụp ảnh
                    </button>
                  </div>

                  {imageSourceType === 'url' && (
                    <input 
                      type="url" 
                      value={itemForm.image_url}
                      onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                    />
                  )}

                  {imageSourceType === 'upload' && (
                    <div className="file-upload-wrapper">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        id="menu-item-file-input"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="menu-item-file-input" className="file-upload-trigger">
                        {uploadingImage ? (
                          <>
                            <i className="fa-solid fa-spinner spinner"></i>
                            <span>Đang tải ảnh lên...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-file-arrow-up"></i>
                            <span>Chọn file hình ảnh từ thiết bị</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}

                  {imageSourceType === 'camera' && (
                    <div className="camera-capture-wrapper">
                      {cameraStream ? (
                        <div className="camera-video-container">
                          <video ref={videoRef} autoPlay playsInline className="camera-video-element"></video>
                          <button type="button" onClick={capturePhoto} className="btn btn-primary btn-sm capture-photo-btn">
                            <i className="fa-solid fa-camera"></i> {uploadingImage ? 'Đang tải ảnh...' : 'Nhấp để chụp và lưu'}
                          </button>
                        </div>
                      ) : (
                        <div className="camera-init-container">
                          <i className="fa-solid fa-spinner spinner"></i>
                          <p>Đang chuẩn bị camera hoặc chờ cấp quyền...</p>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={startCamera}>Kích hoạt lại</button>
                        </div>
                      )}
                    </div>
                  )}

                  {itemForm.image_url && (
                    <div className="image-preview-wrapper">
                      <span>Xem trước hình ảnh:</span>
                      <img 
                        src={itemForm.image_url.startsWith('/uploads') ? `http://localhost:3000${itemForm.image_url}` : itemForm.image_url} 
                        alt="Xem trước món ăn" 
                        className="image-preview-img"
                        onError={(e) => { e.target.style.display = 'none'; }} 
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label><i className="fa-solid fa-store"></i> Thuộc Chi Nhánh Bếp*</label>
                  <select
                    value={itemForm.kitchen_id}
                    onChange={(e) => setItemForm({ ...itemForm, kitchen_id: e.target.value })}
                    required
                    disabled={!!selectedManageKitchen}
                  >
                    <option value="">Chọn chi nhánh bếp</option>
                    {kitchens.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>

                <label className="checkbox-label premium-checkbox">
                  <input 
                    type="checkbox" 
                    checked={itemForm.is_available}
                    onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
                  />
                  <span className="checkbox-custom-text">Hiện món ăn này trong thực đơn (Còn món)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeItemModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary btn-accent">
                  {selectedItem ? 'Cập Nhật Món' : 'Thêm Món Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD/EDIT KITCHEN MODAL --- */}
      {showKitchenModal && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal">
            <div className="modal-header-accent kitchen-accent">
              <i className="fa-solid fa-map-location-dot header-icon"></i>
              <h3>{selectedKitchen ? 'Cập Nhật Chi Nhánh Bếp' : 'Thêm Chi Nhánh Bếp Mới'}</h3>
            </div>
            <form onSubmit={handleKitchenSubmit} className="premium-form">
              <div className="premium-form-body">
                <div className="form-group">
                  <label><i className="fa-solid fa-store"></i> Tên chi nhánh bếp*</label>
                  <input 
                    type="text" 
                    value={kitchenForm.name}
                    onChange={(e) => setKitchenForm({ ...kitchenForm, name: e.target.value })}
                    placeholder="Bếp Quận 1, Bếp Trần Thị Huyền..."
                    required 
                  />
                </div>

                 <div className="form-group">
                   <label><i className="fa-solid fa-location-dot"></i> Địa chỉ đầy đủ*</label>
                   <input 
                     type="text" 
                     value={kitchenForm.address}
                     onChange={(e) => setKitchenForm({ ...kitchenForm, address: e.target.value })}
                     placeholder="Nhập địa chỉ của chi nhánh bếp..."
                     required 
                   />
                 </div>

                 <label className="checkbox-label premium-checkbox">
                   <input 
                     type="checkbox" 
                     checked={kitchenForm.is_active}
                     onChange={(e) => setKitchenForm({ ...kitchenForm, is_active: e.target.checked })}
                   />
                   <span className="checkbox-custom-text">Chi nhánh hoạt động phục vụ (Còn mở cửa)</span>
                 </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowKitchenModal(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className="btn btn-primary btn-accent">
                  {selectedKitchen ? 'Cập Nhật Bếp' : 'Thêm Bếp Mới'}
                </button>
              </div>
            </form>
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

export default StaffDashboard;
