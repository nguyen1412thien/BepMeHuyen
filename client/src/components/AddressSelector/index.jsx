import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import AlertModal from '../AlertModal';
import './style.css';

const AddressSelector = ({ user, onAddressSelect, selectedAddressId }) => {
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

  const [addresses, setAddresses] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    label: 'Nhà',
    full_address: '',
    is_default: false
  });

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const data = await api.getAddresses();
      setAddresses(data);
      
      // Nếu có địa chỉ mặc định, tự động chọn nó lên form đặt hàng
      const defaultAddr = data.find(addr => addr.is_default);
      if (defaultAddr && !selectedAddressId) {
        onAddressSelect(defaultAddr);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!form.full_address.trim()) {
      showAlert('Vui lòng nhập địa chỉ giao cơm!', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        label: form.label,
        full_address: form.full_address,
        lat: 0,
        lng: 0,
        is_default: form.is_default ? 1 : 0
      };

      const res = await api.createAddress(payload);
      showAlert('Đã lưu địa chỉ mới!', 'success');
      setShowAddForm(false);
      setForm({ label: 'Nhà', full_address: '', is_default: false });
      
      // Load lại danh sách và chọn địa chỉ mới tạo
      await fetchAddresses();
      onAddressSelect(res.data || res);
    } catch (err) {
      showAlert(`Lỗi lưu địa chỉ: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    showAlert(
      'Bạn có muốn xóa địa chỉ giao hàng này không?',
      'warning',
      async () => {
        try {
          await api.deleteAddress(id);
          fetchAddresses();
        } catch (err) {
          showAlert(`Lỗi khi xóa: ${err.message}`, 'error');
        }
      }
    );
  };

  const handleSetDefault = async (id, e) => {
    e.stopPropagation();
    try {
      await api.setDefaultAddress(id);
      fetchAddresses();
    } catch (err) {
      showAlert(`Lỗi đặt mặc định: ${err.message}`, 'error');
    }
  };

  if (!user) {
    return (
      <div className="address-selector-container">
        <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>
          💡 Đăng nhập để lưu địa chỉ cố định, giúp đặt hàng nhanh hơn và tính phí ship chuẩn xác.
        </p>
      </div>
    );
  }

  return (
    <div className="address-selector-container">
      <div className="address-selector-header">
        <h4><i className="fa-solid fa-map-pin" style={{ color: 'var(--primary)' }}></i> Sổ Địa Chỉ Giao Hàng</h4>
        {!showAddForm && (
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddForm(true)}
          >
            + Thêm mới
          </button>
        )}
      </div>

      {!showAddForm ? (
        <div className="address-list">
          {addresses.length === 0 ? (
            <p className="text-secondary" style={{ fontSize: '0.85rem', margin: '10px 0' }}>Chưa có địa chỉ nào được lưu.</p>
          ) : (
            addresses.map(addr => (
              <div 
                key={addr.id} 
                className={`address-item ${selectedAddressId === addr.id ? 'selected' : ''}`}
                onClick={() => onAddressSelect(addr)}
              >
                <input 
                  type="radio" 
                  name="selected_address"
                  className="address-radio"
                  checked={selectedAddressId === addr.id}
                  onChange={() => onAddressSelect(addr)}
                />
                <div className="address-details">
                  <div className="address-label">
                    {addr.label} 
                    {addr.is_default === 1 && <span className="address-default-badge">Mặc định</span>}
                  </div>
                  <div className="address-text">{addr.full_address}</div>
                </div>
                <div className="address-actions">
                  {addr.is_default !== 1 && (
                    <button 
                      type="button" 
                      className="addr-action-btn default" 
                      title="Đặt làm mặc định"
                      onClick={(e) => handleSetDefault(addr.id, e)}
                    >
                      ★
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="addr-action-btn" 
                    title="Xóa địa chỉ"
                    onClick={(e) => handleDelete(addr.id, e)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleAddAddress} className="new-address-form">
          <h5>Địa Chỉ Giao Hàng Mới</h5>
          
          <div className="form-group">
            <label>Nhãn địa chỉ</label>
            <select 
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            >
              <option value="Nhà">Nhà riêng</option>
              <option value="Cơ quan">Cơ quan / Văn phòng</option>
              <option value="Trường học">Trường học</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div className="form-group">
            <label>Địa chỉ đầy đủ*</label>
            <input 
              type="text" 
              value={form.full_address}
              onChange={(e) => setForm({ ...form, full_address: e.target.value })}
              placeholder="Nhập địa chỉ giao cơm của bạn..."
              required 
            />
          </div>

          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: '10px 0' }}>
            <input 
              type="checkbox" 
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            Đặt địa chỉ này làm mặc định giao hàng
          </label>

          <div className="modal-actions" style={{ marginTop: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAddForm(false)}
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="btn btn-primary btn-sm"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
          </div>
        </form>
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

export default AddressSelector;
