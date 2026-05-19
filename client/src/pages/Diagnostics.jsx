import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const Diagnostics = () => {
  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState(null);
  const [erdData, setErdData] = useState({ columns: [], relations: [] });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', isSuccess: true });
  
  // States for CRUD Editor
  const [selectedTable, setSelectedTable] = useState('');
  const [tableRows, setTableRows] = useState([]);
  const [editingCell, setEditingCell] = useState({ id: null, field: null, value: '' });

  // --- AUTOMATIC STARTUP DIAGNOSTICS ---
  useEffect(() => {
    runAutoCheck();
  }, []);

  const showNotification = (message, isSuccess = true) => {
    setToast({ show: true, message, isSuccess });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const runAutoCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Run basic connection diagnostics
      const diagResponse = await api.getDiagnostics();
      setDbInfo(diagResponse);
      
      if (!diagResponse.success) {
        throw new Error(diagResponse.error || 'Kiểm tra thất bại.');
      }

      // 2. Fetch ERD structure and relationships
      const erdResponse = await api.getERD();
      if (erdResponse.success) {
        setErdData(erdResponse);
        // Pre-select first table if available
        if (erdResponse.columns.length > 0) {
          const uniqueTables = [...new Set(erdResponse.columns.map(c => c.tableName))];
          if (uniqueTables.length > 0) {
            handleSelectTable(uniqueTables[0]);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi chẩn đoán:', err);
      setError(err.message || 'Không thể kết nối mạng tới API máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  // --- DATABASE ADMIN OPERATIONS ---
  const handleCreateTables = async () => {
    if (!window.confirm('CẢNH BÁO: Hành động này sẽ tạo mới các cấu trúc bảng nếu chưa tồn tại. Bạn chắc chắn muốn tiến hành chứ?')) return;
    setLoading(true);
    try {
      const res = await api.createTables();
      if (res.success) {
        showNotification('Khởi tạo cấu trúc các bảng CSDL gốc thành công!', true);
        await runAutoCheck();
      } else {
        throw new Error(res.error || 'Không thể tạo bảng.');
      }
    } catch (err) {
      showNotification(`Lỗi khởi tạo: ${err.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertSampleData = async () => {
    if (!window.confirm('Bạn muốn nạp toàn bộ thực đơn món ăn và dữ liệu mẫu khởi tạo vào CSDL chứ?')) return;
    setLoading(true);
    try {
      const res = await api.insertSampleData();
      if (res.success) {
        showNotification('Nạp dữ liệu món ăn và danh mục mẫu thành công!', true);
        await runAutoCheck();
        if (selectedTable) {
          await fetchTableData(selectedTable);
        }
      } else {
        throw new Error(res.error || 'Không thể nạp dữ liệu mẫu.');
      }
    } catch (err) {
      showNotification(`Lỗi nạp dữ liệu: ${err.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD DATA MANAGEMENT ---
  const handleSelectTable = async (tableName) => {
    setSelectedTable(tableName);
    await fetchTableData(tableName);
  };

  const fetchTableData = async (tableName) => {
    try {
      const res = await api.getTableRows(tableName);
      if (res.success) {
        setTableRows(res.rows);
      } else {
        setTableRows([]);
        showNotification(`Không thể đọc bảng ${tableName}: ${res.error}`, false);
      }
    } catch (err) {
      setTableRows([]);
      showNotification(`Lỗi tải dữ liệu bảng: ${err.message}`, false);
    }
  };

  const handleStartEdit = (id, field, value) => {
    setEditingCell({ id, field, value: value === null ? '' : String(value) });
  };

  const handleSaveEdit = async (id, field) => {
    if (editingCell.id !== id || editingCell.field !== field) return;
    try {
      const res = await api.updateCell(selectedTable, id, field, editingCell.value);
      if (res.success) {
        showNotification(`Đã cập nhật thành công ô [ID ${id} - Cột ${field}]!`, true);
        setEditingCell({ id: null, field: null, value: '' });
        await fetchTableData(selectedTable);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      showNotification(`Lỗi cập nhật: ${err.message}`, false);
    }
  };

  const handleDeleteRow = async (id) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi ID: ${id} khỏi bảng ${selectedTable}?`)) return;
    try {
      const res = await api.deleteRow(selectedTable, id);
      if (res.success) {
        showNotification(`Đã xóa bản ghi ID: ${id} thành công!`, true);
        await fetchTableData(selectedTable);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      showNotification(`Lỗi xóa bản ghi: ${err.message}`, false);
    }
  };

  // Group columns by table for schema rendering
  const tablesMap = {};
  erdData.columns.forEach(col => {
    if (!tablesMap[col.tableName]) {
      tablesMap[col.tableName] = [];
    }
    tablesMap[col.tableName].push({
      name: col.columnName,
      type: col.dataType
    });
  });
  const uniqueTableNames = Object.keys(tablesMap);

  return (
    <div className="diagnostics-page container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.isSuccess ? 'toast-success' : 'toast-error'}`}>
          <i className={toast.isSuccess ? "fa-solid fa-circle-check" : "fa-solid fa-circle-xmark"}></i>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Hero Header */}
      <header className="hero-section text-center">
        <h1>Chẩn Đoán Cơ Sở Dữ Liệu</h1>
        <p className="subtitle">
          Quản trị CSDL trực quan, kiểm tra độ trễ mạng trong thời gian thực và quản lý dữ liệu an toàn dưới cấu trúc Component-Based SPA.
        </p>
      </header>

      {/* Main Diagnostics Info Cards */}
      <div className="diagnostics-dashboard">
        <div className="status-banner">
          <div className="status-details">
            <span className="label">Tình Trạng Kết Nối:</span>
            {loading ? (
              <span className="status-badge">Đang kết nối...</span>
            ) : error ? (
              <span className="status-badge status-error">Lỗi Kết Nối</span>
            ) : (
              <span className="status-badge status-active">Kết Nối Tốt</span>
            )}
          </div>
          <button onClick={runAutoCheck} disabled={loading} className="btn btn-secondary check-btn">
            {loading ? <i className="fa-solid fa-rotate spinner"></i> : <i className="fa-solid fa-sync"></i>} Tải Lại
          </button>
        </div>

        {error && (
          <div className="error-panel animate-fadeIn">
            <strong>❌ LỖI HỆ THỐNG:</strong> {error}
            <div className="error-hint">
              💡 <strong>Gợi ý:</strong> Hãy cấu hình liên kết <strong>Cloud SQL Connection Name</strong> (Unix socket) trên Google Cloud Run Console để máy chủ tự động kết nối và bỏ qua mọi tường lửa!
            </div>
          </div>
        )}

        <div className="metrics-grid">
          <div className="metric-card">
            <h3><i className="fa-solid fa-server"></i> Máy Chủ CSDL</h3>
            <div className="val">{dbInfo?.config?.host || 'Cloud SQL (Local Socket)'}</div>
            <div className="sub">Giao thức: {dbInfo?.config?.host === '136.110.9.77' ? 'TCP' : 'Unix Socket'}</div>
          </div>

          <div className="metric-card">
            <h3><i className="fa-solid fa-database"></i> Tên Cơ Sở Dữ Liệu</h3>
            <div className="val">{dbInfo?.config?.database || 'bepmehuyen'}</div>
            <div className="sub">Cổng mặc định: {dbInfo?.config?.port || 3306}</div>
          </div>

          <div className="metric-card">
            <h3><i className="fa-solid fa-bolt"></i> Độ Trễ Phản Hồi</h3>
            <div className="val latency-val" style={{ color: dbInfo?.success ? 'var(--success)' : 'var(--text-muted)' }}>
              {dbInfo?.success ? `${dbInfo.duration} ms` : '--'}
            </div>
            <div className="sub">Thời gian truy vấn ping thực tế</div>
          </div>

          <div className="metric-card">
            <h3><i className="fa-solid fa-clock"></i> Giờ Hệ Thống DB</h3>
            <div className="val time-val">
              {dbInfo?.dbTime ? new Date(dbInfo.dbTime).toLocaleTimeString('vi-VN') : '--'}
            </div>
            <div className="sub">Thời gian thực của MySQL Server</div>
          </div>
        </div>
      </div>

      {/* Advanced SQL Operations Panel */}
      <div className="admin-operations-box">
        <h3><i className="fa-solid fa-toolbox"></i> Thao Tác Hệ Thống CSDL Nhanh</h3>
        <div className="operations-grid">
          <button onClick={handleCreateTables} disabled={loading} className="btn-op btn-op-init">
            <i className="fa-solid fa-hammer"></i>
            <div>
              <h4>Khởi Tạo Cấu Trúc Bảng</h4>
              <p>Tạo mới các bảng dữ liệu chuẩn (users, categories, products, orders...)</p>
            </div>
          </button>

          <button onClick={handleInsertSampleData} disabled={loading} className="btn-op btn-op-seed">
            <i className="fa-solid fa-folder-plus"></i>
            <div>
              <h4>Nạp Thực Đơn & Dữ Liệu Mẫu</h4>
              <p>Ghi thêm thực đơn món ăn mặc định và danh mục để test hệ thống bán hàng</p>
            </div>
          </button>
        </div>
      </div>

      {/* Database Schema Section */}
      <div className="schema-section">
        <h3>
          <i className="fa-solid fa-diagram-project"></i> Sơ Đồ Thiết Kế Hệ Thống Bảng ({uniqueTableNames.length})
        </h3>
        <div className="schema-grid">
          {uniqueTableNames.map(tbl => {
            // Find foreign keys originating from this table
            const originatingFks = erdData.relations.filter(r => r.tableName === tbl);
            return (
              <div key={tbl} className="table-card animate-fadeIn" id={`table-node-${tbl}`}>
                <div className="table-header">
                  <span className="table-icon"><i className="fa-solid fa-table"></i></span>
                  <h4>{tbl}</h4>
                </div>
                <div className="table-columns">
                  {tablesMap[tbl].map(c => {
                    const isPk = c.name === 'id';
                    // Check if this column is a foreign key
                    const fkRel = originatingFks.find(r => r.columnName === c.name);
                    return (
                      <div 
                        key={c.name} 
                        className={`column-row ${fkRel ? 'has-relation' : ''}`}
                        onMouseEnter={() => {
                          if (fkRel) {
                            const parentCard = document.getElementById(`table-node-${fkRel.referencedTableName}`);
                            if (parentCard) parentCard.classList.add('highlight-relation-parent');
                          }
                        }}
                        onMouseLeave={() => {
                          if (fkRel) {
                            const parentCard = document.getElementById(`table-node-${fkRel.referencedTableName}`);
                            if (parentCard) parentCard.classList.remove('highlight-relation-parent');
                          }
                        }}
                      >
                        <span className="col-name">
                          {isPk && <span className="pk-key">🔑</span>}
                          {c.name}
                        </span>
                        <span className="col-meta">
                          <span className="col-type">{c.type.split(' ')[0]}</span>
                          {fkRel && (
                            <span className="fk-badge" title={`Liên kết tới bảng ${fkRel.referencedTableName}`}>
                              ➡️ {fkRel.referencedTableName}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supabase-style Table CRUD Editor */}
      <div className="crud-editor-box">
        <div className="crud-header">
          <h3><i className="fa-solid fa-table-cells"></i> Trình Quản Lý Bảng Dữ Liệu</h3>
          <div className="table-selector-group">
            <span className="label">Chọn Bảng:</span>
            <div className="badges-list">
              {uniqueTableNames.map(tbl => (
                <button
                  key={tbl}
                  onClick={() => handleSelectTable(tbl)}
                  className={`table-select-badge ${selectedTable === tbl ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-table"></i> {tbl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="crud-body">
          {selectedTable ? (
            <div className="table-responsive">
              <div className="table-helper-text">
                💡 <em>Mẹo: <strong>Nhấp đúp chuột</strong> vào bất kỳ ô dữ liệu nào để chỉnh sửa trực tiếp, nhấn <strong>Enter</strong> để lưu lại!</em>
              </div>
              <table className="crud-grid">
                <thead>
                  <tr>
                    {tablesMap[selectedTable]?.map(c => (
                      <th key={c.name}>{c.name}</th>
                    ))}
                    <th className="actions-header">Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length > 0 ? (
                    tableRows.map(row => (
                      <tr key={row.id}>
                        {tablesMap[selectedTable]?.map(c => {
                          const isEditing = editingCell.id === row.id && editingCell.field === c.name;
                          return (
                            <td 
                              key={c.name}
                              onDoubleClick={() => handleStartEdit(row.id, c.name, row[c.name])}
                              className={isEditing ? 'editing-cell-td' : ''}
                            >
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell(prev => ({ ...prev, value: e.target.value }))}
                                  onBlur={() => handleSaveEdit(row.id, c.name)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(row.id, c.name);
                                    if (e.key === 'Escape') setEditingCell({ id: null, field: null, value: '' });
                                  }}
                                  autoFocus
                                  className="grid-cell-input"
                                />
                              ) : (
                                <span className={row[c.name] === null ? 'null-value' : 'cell-value'}>
                                  {row[c.name] === null ? 'NULL' : String(row[c.name])}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="actions-cell">
                          <button 
                            onClick={() => handleDeleteRow(row.id)} 
                            className="btn-delete-row"
                            title="Xóa dòng này"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={(tablesMap[selectedTable]?.length || 0) + 1} className="text-center text-muted">
                        Bảng hiện tại chưa chứa bản ghi nào. Hãy nhấn nạp thực đơn mẫu để chèn dữ liệu!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-crud text-center text-muted">
              Vui lòng nhấp vào các nút tên bảng ở trên để bắt đầu chỉnh sửa dữ liệu trực tuyến.
            </div>
          )}
        </div>
      </div>

      {/* Premium Glassmorphic Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        .diagnostics-page {
          padding-top: 30px;
          padding-bottom: 100px;
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #E2E8F0;
        }

        .hero-section {
          margin-bottom: 40px;
        }

        .hero-section h1 {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(135deg, #FF6B35 0%, #FFA856 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
          letter-spacing: -0.5px;
        }

        .hero-section .subtitle {
          font-size: 1rem;
          color: #94A3B8;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* Status Banner */
        .status-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 16px 28px;
          margin-bottom: 30px;
        }

        .status-details {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-details .label {
          font-weight: 600;
          color: #94A3B8;
          font-size: 0.95rem;
        }

        .status-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94A3B8;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-badge.status-active {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
          color: #10B981;
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
        }

        .status-badge.status-error {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.2);
          color: #EF4444;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.15);
        }

        .check-btn {
          font-size: 0.85rem;
          padding: 8px 16px;
        }

        /* Error Panel */
        .error-panel {
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FFA3A3;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 30px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .error-panel .error-hint {
          margin-top: 12px;
          font-size: 0.85rem;
          color: #94A3B8;
          border-top: 1px solid rgba(239, 68, 68, 0.15);
          padding-top: 10px;
        }

        /* Metrics Dashboard */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 24px;
          padding: 24px;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 107, 53, 0.3);
          background: rgba(255, 255, 255, 0.03);
        }

        .metric-card h3 {
          font-size: 0.8rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .metric-card h3 i {
          color: #FF6B35;
        }

        .metric-card .val {
          font-size: 1.25rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 4px;
          word-break: break-all;
        }

        .metric-card .sub {
          font-size: 0.75rem;
          color: #64748B;
        }

        /* Operations Panel */
        .admin-operations-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 28px;
          padding: 28px;
          margin-bottom: 40px;
        }

        .admin-operations-box h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .admin-operations-box h3 i {
          color: #FF6B35;
        }

        .operations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .btn-op {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .btn-op i {
          font-size: 1.8rem;
          transition: transform 0.3s ease;
        }

        .btn-op h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 4px;
        }

        .btn-op p {
          font-size: 0.75rem;
          color: #94A3B8;
          line-height: 1.4;
        }

        .btn-op-init:hover {
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.05);
        }
        .btn-op-init:hover i {
          color: #EF4444;
          transform: rotate(-10deg) scale(1.1);
        }

        .btn-op-seed:hover {
          border-color: rgba(16, 185, 129, 0.3);
          background: rgba(16, 185, 129, 0.05);
        }
        .btn-op-seed:hover i {
          color: #10B981;
          transform: translateY(-2px) scale(1.1);
        }

        /* Schema / ERD Map */
        .schema-section {
          margin-bottom: 40px;
        }

        .schema-section h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .schema-section h3 i {
          color: #FF6B35;
        }

        .schema-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }

        .table-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .table-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 107, 53, 0.25);
          box-shadow: 0 10px 25px rgba(255, 107, 53, 0.05);
        }

        .table-card.highlight-relation-parent {
          border-color: #FF6B35;
          box-shadow: 0 0 25px rgba(255, 107, 53, 0.3);
          background: rgba(255, 107, 53, 0.04);
          transform: scale(1.03) translateY(-4px);
        }

        .table-header {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding: 14px 18px;
        }

        .table-icon {
          color: #FF6B35;
          font-size: 0.95rem;
        }

        .table-header h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFF;
        }

        .table-columns {
          padding: 10px 0;
        }

        .column-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.01);
          font-size: 0.8rem;
          transition: background 0.2s ease;
        }

        .column-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .column-row.has-relation {
          cursor: help;
        }

        .column-row.has-relation:hover {
          background: rgba(255, 107, 53, 0.05);
        }

        .col-name {
          font-weight: 500;
          color: #E2E8F0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pk-key {
          font-size: 0.7rem;
        }

        .col-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .col-type {
          font-family: monospace;
          color: #64748B;
        }

        .fk-badge {
          font-size: 0.65rem;
          font-weight: 700;
          background: rgba(255, 107, 53, 0.1);
          border: 1px solid rgba(255, 107, 53, 0.15);
          color: #FF6B35;
          padding: 2px 6px;
          border-radius: 6px;
        }

        /* CRUD Manager */
        .crud-editor-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 28px;
          padding: 28px;
          overflow: hidden;
        }

        .crud-header {
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 24px;
          margin-bottom: 24px;
        }

        .crud-header h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFF;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .crud-header h3 i {
          color: #FF6B35;
        }

        .table-selector-group {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .table-selector-group .label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #94A3B8;
        }

        .badges-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .table-select-badge {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #94A3B8;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .table-select-badge:hover {
          border-color: rgba(255, 107, 53, 0.3);
          color: #FF6B35;
          background: rgba(255, 107, 53, 0.03);
        }

        .table-select-badge.active {
          background: rgba(255, 107, 53, 0.1);
          border-color: #FF6B35;
          color: #FF6B35;
          box-shadow: 0 0 12px rgba(255, 107, 53, 0.1);
        }

        .table-helper-text {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-bottom: 14px;
        }

        /* Grid Table Styling */
        .table-responsive {
          overflow-x: auto;
          max-height: 500px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.15);
        }

        .crud-grid {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.8rem;
        }

        .crud-grid th {
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 14px 18px;
          font-weight: 700;
          color: #FFF;
          font-family: monospace;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .crud-grid td {
          padding: 12px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          color: #CBD5E1;
          transition: background 0.15s ease;
          position: relative;
        }

        .crud-grid tr:hover td {
          background: rgba(255, 255, 255, 0.015);
        }

        .null-value {
          color: #64748B;
          font-weight: 500;
          font-size: 0.75rem;
          font-family: monospace;
        }

        .cell-value {
          word-break: break-all;
        }

        .editing-cell-td {
          padding: 4px !important;
          background: rgba(255, 107, 53, 0.05) !important;
        }

        .grid-cell-input {
          width: 100%;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid #FF6B35;
          border-radius: 8px;
          padding: 8px 10px;
          color: #FFF;
          font-size: 0.8rem;
          font-family: inherit;
        }

        .grid-cell-input:focus {
          outline: none;
          box-shadow: 0 0 8px rgba(255, 107, 53, 0.2);
        }

        .actions-header {
          text-align: center !important;
          width: 80px;
        }

        .actions-cell {
          text-align: center;
        }

        .btn-delete-row {
          background: none;
          border: none;
          color: #64748B;
          cursor: pointer;
          font-size: 0.9rem;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .btn-delete-row:hover {
          color: #EF4444;
          background: rgba(239, 68, 68, 0.1);
        }

        .empty-crud {
          padding: 50px 0;
          font-size: 0.85rem;
        }

        /* Toast Notifications */
        .toast-notification {
          position: fixed;
          top: 30px;
          right: 30px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          border-radius: 16px;
          font-size: 0.85rem;
          font-weight: 600;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .toast-success {
          background: rgba(16, 185, 129, 0.95);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #FFF;
        }

        .toast-error {
          background: rgba(239, 68, 68, 0.95);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #FFF;
        }

        /* KEYFRAMES & ANIMATIONS */
        @keyframes slideIn {
          from {
            transform: translateX(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease forwards;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      ` }} />
    </div>
  );
};

export default Diagnostics;
