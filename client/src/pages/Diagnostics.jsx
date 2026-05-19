import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Diagnostics.css';

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
    </div>
  );
};

export default Diagnostics;
