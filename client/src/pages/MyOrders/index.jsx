import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './style.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getMyOrders();
        setOrders(data);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-pending';
      case 'confirmed': return 'badge-confirmed';
      case 'preparing': return 'badge-preparing';
      case 'shipping': return 'badge-shipping';
      case 'completed': return 'badge-completed';
      case 'cancelled': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt';
      case 'confirmed': return 'Đã nhận đơn';
      case 'preparing': return 'Đang nấu';
      case 'shipping': return 'Đang giao';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chờ duyệt';
    }
  };

  if (loading) {
    return (
      <div className="orders-page container text-center">
        <div className="loader-container" style={{ marginTop: '100px' }}>
          <i className="fa-solid fa-spinner spinner loader-icon"></i>
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page container">
      <div className="orders-header">
        <h1>Đơn Hàng Của Tôi</h1>
        <p>Theo dõi trạng thái đơn hàng của bạn từ Bếp Mẹ Huyền</p>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <i className="fa-solid fa-receipt"></i>
          <p>Bạn chưa đặt đơn hàng nào.</p>
          <a href="/" className="btn btn-primary">Khám phá thực đơn ngay</a>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div>
                  <span className="order-id">Đơn hàng #{order.id}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <span className={`order-badge ${getStatusBadgeClass(order.order_status)}`}>
                  {getStatusText(order.order_status)}
                </span>
              </div>

              <div className="order-items">
                {order.items?.map(item => (
                  <div key={item.id} className="order-item-row">
                    <div className="item-info">
                      <span className="item-qty">x{item.quantity}</span>
                      <span>{item.name}</span>
                    </div>
                    <span className="item-price">
                      {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <div className="order-details-grid">
                  <div>📍 <strong>Giao tới:</strong> {order.delivery_address}</div>
                  <div>👤 <strong>Người nhận:</strong> {order.receiver_name} - {order.receiver_phone}</div>
                  {order.shipping_fee > 0 && (
                    <div>🚚 <strong>Phí giao hàng:</strong> {parseFloat(order.shipping_fee).toLocaleString('vi-VN')} đ</div>
                  )}
                  {order.note && (
                    <div>📝 <strong>Ghi chú:</strong> {order.note}</div>
                  )}
                </div>

                <div className="order-total">
                  Tổng thanh toán: <span>{parseFloat(order.total_amount).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
