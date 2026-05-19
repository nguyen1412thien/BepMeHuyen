import React from 'react';
import './style.css';

const AlertModal = ({ isOpen, message, type = 'info', onClose, onConfirm }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fa-solid fa-circle-check alert-modal-icon icon-success"></i>;
      case 'error':
        return <i className="fa-solid fa-circle-xmark alert-modal-icon icon-error"></i>;
      case 'warning':
        return <i className="fa-solid fa-circle-exclamation alert-modal-icon icon-warning"></i>;
      default:
        return <i className="fa-solid fa-circle-info alert-modal-icon icon-info"></i>;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Thành Công';
      case 'error':
        return 'Lỗi';
      case 'warning':
        return 'Cảnh Báo';
      default:
        return 'Thông Báo';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="alert-modal-overlay">
      <div className={`alert-modal-card ${type}-card`}>
        <div className="alert-modal-content">
          {getIcon()}
          <h3>{getTitle()}</h3>
          <p>{message}</p>
        </div>
        <div className="alert-modal-footer">
          {onConfirm && (
            <button className="btn btn-secondary flex-1" onClick={onClose}>
              Hủy bỏ
            </button>
          )}
          <button className={`btn btn-alert-confirm btn-${type} flex-1`} onClick={handleConfirm}>
            Xác Nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
