import React, { useState } from 'react';
import { api } from '../services/api';

const Diagnostics = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const handleDiagnose = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getDiagnostics();
      setData(response);
      if (!response.success) {
        setError(response.error || 'Kiểm tra thất bại.');
      }
    } catch (err) {
      setError(err.message || 'Không thể kết nối đến máy chủ Backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="diagnostics-page container">
      <header className="hero-section">
        <h1>Chẩn Đoán Cơ Sở Dữ Liệu</h1>
        <p>Bảng điều khiển đo lường độ trễ truy vấn CSDL, kiểm tra cấu hình mạng và quét danh sách bảng hiện hữu trong thời gian thực.</p>
      </header>

      <div className="diagnostics-card">
        {/* Connection Status Panel */}
        <div className="status-panel">
          <div className="status-left">
            <span className="status-label">Trạng Thái Kết Nối:</span>
            {!data && !error ? (
              <span className="status-badge">Chưa Kiểm Tra</span>
            ) : error ? (
              <span className="status-badge status-error">Lỗi Kết Nối</span>
            ) : (
              <span className="status-badge status-active">Kết Nối Tốt</span>
            )}
          </div>
          
          <button 
            onClick={handleDiagnose} 
            disabled={loading} 
            className="btn btn-primary diagnose-btn"
          >
            {loading ? (
              <><i className="fa-solid fa-rotate spinner"></i> Đang chạy...</>
            ) : (
              <><i className="fa-solid fa-heart-pulse"></i> Chạy Thử Nghiệm</>
            )}
          </button>
        </div>

        {/* Error Detail Display */}
        {error && (
          <div className="error-box">
            <strong>❌ LỖI KẾT NỐI HỆ THỐNG:</strong>
            <pre>{error}</pre>
            <div className="error-tip">
              💡 <strong>Gợi ý khắc phục:</strong> Vui lòng đảm bảo rằng máy chủ Backend Node.js đã được bật (`node src/server.js`) và thông số kết nối của máy chủ CSDL ở file `.env` hoàn toàn chính xác!
            </div>
          </div>
        )}

        {/* Dynamic Diagnostics Grid */}
        <div className="grid">
          <div className="info-card">
            <h3><i className="fa-solid fa-server"></i> Máy Chủ CSDL</h3>
            <div className="value">{data?.config?.host || 'Chưa rõ'}</div>
            <div className="sub-value">Cổng kết nối: {data?.config?.port || 3306}</div>
          </div>

          <div className="info-card">
            <h3><i className="fa-solid fa-database"></i> Tên Database</h3>
            <div className="value">{data?.config?.database || 'Chưa rõ'}</div>
            <div className="sub-value">Mã hóa: utf8mb4</div>
          </div>

          <div className="info-card">
            <h3><i className="fa-solid fa-bolt"></i> Tốc Độ Phản Hồi</h3>
            <div className="value" style={{ color: data?.success ? 'var(--success)' : 'inherit' }}>
              {data?.success ? `${data.duration} ms` : '--'}
            </div>
            <div className="sub-value">Độ trễ truy vấn (ping latency)</div>
          </div>

          <div className="info-card">
            <h3><i className="fa-solid fa-clock"></i> Giờ Máy Chủ DB</h3>
            <div className="value" style={{ fontSize: '1rem', fontWeight: 600 }}>
              {data?.dbTime ? new Date(data.dbTime).toLocaleString('vi-VN') : '--'}
            </div>
            <div className="sub-value">Thời gian thực tế trên MySQL</div>
          </div>
        </div>

        {/* Tables Scan List */}
        <div className="tables-box">
          <h3>
            <i className="fa-solid fa-table-list"></i> Các Bảng Hiện Hữu ({data?.tables?.length || 0})
          </h3>
          <div className="tables-list">
            {!data ? (
              <span className="text-muted">Chưa chạy kiểm tra quét bảng.</span>
            ) : data.tables?.length === 0 ? (
              <span className="text-warning">⚠️ Database rỗng (Không tìm thấy bảng nào).</span>
            ) : (
              data.tables.map((tableName, index) => (
                <span key={index} className="table-badge">
                  <i className="fa-solid fa-table"></i> {tableName}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .diagnostics-page {
          padding-top: 20px;
          padding-bottom: 80px;
        }

        .diagnostics-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: 28px;
          padding: 30px;
          box-shadow: 0 10px 40px var(--glass-shadow);
          margin-top: 30px;
        }

        .status-panel {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 16px 24px;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .status-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-label {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .status-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-badge.status-active {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
          color: var(--success);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
        }

        .status-badge.status-error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: var(--danger);
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.15);
        }

        .diagnose-btn {
          font-size: 0.9rem;
          padding: 10px 20px;
        }

        /* Error Box */
        .error-box {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FFA3A3;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
          font-size: 0.9rem;
        }

        .error-box pre {
          font-family: monospace;
          background: rgba(0, 0, 0, 0.2);
          padding: 12px;
          border-radius: 8px;
          margin-top: 8px;
          white-space: pre-wrap;
          overflow-x: auto;
        }

        .error-tip {
          margin-top: 14px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          border-top: 1px solid rgba(239, 68, 68, 0.15);
          padding-top: 10px;
        }

        /* Grid Cards */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .info-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 20px;
          transition: var(--transition-smooth);
        }

        .info-card:hover {
          border-color: var(--border-glow);
          background: rgba(255, 255, 255, 0.04);
        }

        .info-card h3 {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .info-card h3 i {
          color: var(--primary);
        }

        .info-card .value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 4px;
          word-break: break-all;
        }

        .info-card .sub-value {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* Tables Box */
        .tables-box {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          padding: 24px;
        }

        .tables-box h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tables-box h3 i {
          color: var(--primary);
        }

        .tables-list {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .table-badge {
          background: rgba(255, 107, 53, 0.06);
          border: 1px solid rgba(255, 107, 53, 0.15);
          color: var(--primary);
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-smooth);
        }

        .table-badge:hover {
          background: rgba(255, 107, 53, 0.1);
          transform: translateY(-1px);
        }

        .text-muted {
          color: var(--text-muted);
          font-style: italic;
        }

        .text-warning {
          color: var(--warning);
          font-weight: 500;
        }
      ` }} />
    </div>
  );
};

export default Diagnostics;
