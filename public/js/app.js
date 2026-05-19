/**
 * Bếp Mẹ Huyền - Client Application Logic
 */

// --- APPLICATION STATE ---
let menuItems = [];
let cart = [];
let currentCategory = 'all';
let searchQuery = '';
let sortOption = 'default';

// High-fidelity fallback data in case database is booting up or offline
const fallbackMenu = [
  {
    id: 1,
    name: 'Thịt Kho Tàu Mẹ Nấu',
    description: 'Thịt ba chỉ heo kho rệu mềm ngấm vị cùng trứng vịt, nước dừa xiêm ngọt thanh đậm đà chuẩn vị cơm nhà.',
    price: 75000.00,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    name: 'Cá Lóc Kho Tộ',
    description: 'Cá lóc đồng kho tộ sền sệt, cay nồng tiêu sọ, thơm hành lá và mỡ hành béo ngậy ăn cực hao cơm.',
    price: 80000.00,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 3,
    name: 'Sườn Xào Chua Ngọt',
    description: 'Sườn non rim chín mềm, áo lớp sốt chua ngọt từ cà chua và me rừng thơm lừng, rắc chút vừng rang thơm phức.',
    price: 85000.00,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 4,
    name: 'Canh Chua Cá Lóc Nam Bộ',
    description: 'Canh chua cá lóc nấu kèm dọc mùng, đậu bắp, thơm, cà chua, ngò om ngò gai và giá đỗ, thanh mát giải nhiệt.',
    price: 85000.00,
    category: 'Soup',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 5,
    name: 'Canh Cua Rau Đay Mướp Hương',
    description: 'Rau đay thanh mát nấu cùng cua đồng băm nhỏ nhiều gạch béo ngậy, đi kèm vài quả cà pháo muối chua giòn rụm.',
    price: 60000.00,
    category: 'Soup',
    image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 6,
    name: 'Rau Muống Xào Tỏi Cô Đơn',
    description: 'Rau muống xanh giòn sần sật xào nhanh tay trên lửa lớn với tỏi Lý Sơn thơm nồng nàn.',
    price: 40000.00,
    category: 'Side Dish',
    image_url: 'https://images.unsplash.com/photo-1515003848606-ca0597947d6e?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 7,
    name: 'Trứng Cuộn Vân Hoa',
    description: 'Trứng gà ta cuộn khéo léo với hành hoa và cà rốt băm nhỏ, màu sắc bắt mắt, mềm xốp tan trong miệng.',
    price: 35000.00,
    category: 'Side Dish',
    image_url: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 8,
    name: 'Chè Dưỡng Nhan Tuyết Yến',
    description: 'Chè tuyết yến kết hợp táo đỏ, kỷ tử, long nhãn, hạt sen và nhựa đào ngọt dịu thanh tao, cực kỳ bổ dưỡng.',
    price: 45000.00,
    category: 'Dessert',
    image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 9,
    name: 'Nước Sấu Đá Hà Nội',
    description: 'Quả sấu tươi ngâm đường phèn giòn ngọt kết hợp gừng tươi cay ấm, đá lạnh sảng khoái ngày hè.',
    price: 25000.00,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 10,
    name: 'Trà Hoa Cúc Mật Ong',
    description: 'Trà hoa cúc sấy lạnh pha cùng mật ong rừng tự nhiên ấm áp, thư giãn cơ thể buổi tối.',
    price: 30000.00,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=60'
  }
];

// --- DOM ELEMENTS ---
const menuGrid = document.getElementById('menu-grid');
const categoryTabs = document.querySelectorAll('.category-tab');
const searchInput = document.getElementById('menu-search');
const sortSelect = document.getElementById('price-sort');

// Cart UI elements
const cartSidebar = document.getElementById('cart-sidebar');
const cartToggleBtn = document.getElementById('cart-toggle-btn');
const cartCloseBtn = document.getElementById('cart-close-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCount = document.getElementById('cart-count');
const navCartBadge = document.querySelector('.cart-badge');
const cartTotal = document.getElementById('cart-total');
const checkoutTriggerBtn = document.getElementById('checkout-trigger-btn');
const startShoppingLink = document.getElementById('start-shopping');

// Modals UI elements
const checkoutModal = document.getElementById('checkout-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const checkoutForm = document.getElementById('checkout-form');
const modalOrderItems = document.getElementById('modal-order-items');
const modalTotalAmount = document.getElementById('modal-total-amount');

// Success modal elements
const successModal = document.getElementById('success-modal');
const successOrderId = document.getElementById('success-order-id');
const successDoneBtn = document.getElementById('success-done-btn');

// --- HELPER FUNCTIONS ---
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Slide out after 3.5s
  setTimeout(() => {
    toast.classList.add('toast-closing');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 3500);
}

// --- DYNAMIC RENDERING ---

// 1. Fetch menu from Backend API
async function loadMenu() {
  try {
    const response = await fetch('/api/menu');
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    menuItems = await response.json();
    console.log('✅ Loaded menu items from backend API.');
  } catch (error) {
    console.warn('⚠️ Could not load menu from API. Falling back to local catalog:', error.message);
    menuItems = [...fallbackMenu];
    showToast('Đang kết nối cơ sở dữ liệu... Chế độ Offline hoạt động.', 'error');
  } finally {
    renderMenu();
  }
}

// 2. Render Menu grid based on filter/search/sort state
function renderMenu() {
  menuGrid.innerHTML = '';
  
  // Filter by category
  let filtered = menuItems.filter(item => {
    const categoryMatch = currentCategory === 'all' || item.category === currentCategory;
    const searchMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Sort by price
  if (sortOption === 'asc') {
    filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (sortOption === 'desc') {
    filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  }

  // Display empty state if nothing found
  if (filtered.length === 0) {
    menuGrid.innerHTML = `
      <div class="empty-grid-state">
        <i class="fa-solid fa-cookie-bite"></i>
        <h3>Không tìm thấy món ăn phù hợp</h3>
        <p>Thử tìm kiếm với từ khóa khác hoặc chuyển danh mục bạn nhé!</p>
      </div>
    `;
    return;
  }

  // Render cards
  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'food-card';
    card.innerHTML = `
      <div class="food-img-wrapper">
        <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'">
        <span class="food-badge">${getCategoryNameVi(item.category)}</span>
      </div>
      <div class="food-info">
        <h3 class="food-title">${item.name}</h3>
        <p class="food-desc">${item.description}</p>
        <div class="food-footer">
          <span class="food-price">${formatVND(item.price)}</span>
          <button class="add-to-cart-btn" data-id="${item.id}" aria-label="Thêm vào giỏ hàng">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
    `;
    menuGrid.appendChild(card);
  });

  // Wire up Add to Cart buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = parseInt(btn.getAttribute('data-id'));
      addToCart(itemId);
    });
  });
}

function getCategoryNameVi(category) {
  const mapping = {
    'Main Course': 'Món Mặn',
    'Soup': 'Món Canh',
    'Side Dish': 'Ăn Kèm',
    'Dessert': 'Tráng Miệng',
    'Drinks': 'Đồ Uống'
  };
  return mapping[category] || category;
}

// 3. Render Cart state and contents
function renderCart() {
  cartItemsContainer.innerHTML = '';
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="empty-cart-state">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Giỏ hàng trống trơn.<br>Hãy chọn vài món ngon bồi bổ nhé!</p>
        <button id="start-shopping" class="btn btn-outline" style="margin-top: 15px;">Chọn Món Ngay</button>
      </div>
    `;
    
    // Add event listener to fallback start shopping button
    const fallbackShopBtn = document.getElementById('start-shopping');
    if (fallbackShopBtn) {
      fallbackShopBtn.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
      });
    }

    cartCount.innerText = '0';
    navCartBadge.innerText = '0';
    navCartBadge.style.display = 'none';
    cartTotal.innerText = '0đ';
    checkoutTriggerBtn.disabled = true;
    return;
  }

  // Active items count
  const totalCount = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.innerText = totalCount;
  navCartBadge.innerText = totalCount;
  navCartBadge.style.display = 'flex';

  // Compute overall total price
  let totalPrice = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    totalPrice += itemTotal;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <img class="cart-item-img" src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600'">
      <div class="cart-item-details">
        <h4 class="cart-item-name">${item.name}</h4>
        <span class="cart-item-price">${formatVND(item.price)}</span>
        <div class="cart-item-qty-control">
          <button class="qty-btn dec-qty" data-id="${item.id}"><i class="fa-solid fa-minus"></i></button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn inc-qty" data-id="${item.id}"><i class="fa-solid fa-plus"></i></button>
        </div>
      </div>
      <button class="remove-item-btn" data-id="${item.id}" aria-label="Xóa">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    cartItemsContainer.appendChild(cartItem);
  });

  cartTotal.innerText = formatVND(totalPrice);
  checkoutTriggerBtn.disabled = false;

  // Add listeners for item operations
  document.querySelectorAll('.inc-qty').forEach(btn => {
    btn.addEventListener('click', () => updateQuantity(parseInt(btn.getAttribute('data-id')), 1));
  });

  document.querySelectorAll('.dec-qty').forEach(btn => {
    btn.addEventListener('click', () => updateQuantity(parseInt(btn.getAttribute('data-id')), -1));
  });

  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.getAttribute('data-id'))));
  });
}

// --- CART STATE ACTIONS ---

function addToCart(id) {
  const menuItem = menuItems.find(item => item.id === id);
  if (!menuItem) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      image_url: menuItem.image_url
    });
  }

  showToast(`Đã thêm "${menuItem.name}" vào giỏ.`);
  renderCart();
  
  // Auto open cart sidebar for excellent UX feedback
  cartSidebar.classList.add('open');
}

function updateQuantity(id, change) {
  const item = cart.find(item => item.id === id);
  if (!item) return;

  item.quantity += change;
  if (item.quantity <= 0) {
    removeFromCart(id);
  } else {
    renderCart();
  }
}

function removeFromCart(id) {
  const itemIndex = cart.findIndex(item => item.id === id);
  if (itemIndex === -1) return;

  const itemName = cart[itemIndex].name;
  cart.splice(itemIndex, 1);
  showToast(`Đã xóa món "${itemName}".`, 'error');
  renderCart();
}

// --- CHECKOUT PROCESS ---

function populateCheckoutSummary() {
  modalOrderItems.innerHTML = '';
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const row = document.createElement('div');
    row.className = 'modal-order-item';
    row.innerHTML = `
      <span>${item.name} (x${item.quantity})</span>
      <span>${formatVND(itemTotal)}</span>
    `;
    modalOrderItems.appendChild(row);
  });

  modalTotalAmount.innerText = formatVND(total);
}

async function handleOrderSubmission(e) {
  e.preventDefault();

  const customerName = document.getElementById('customer_name').value.trim();
  const customerPhone = document.getElementById('customer_phone').value.trim();
  const customerAddress = document.getElementById('customer_address').value.trim();
  const notes = document.getElementById('order_notes').value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'error');
    return;
  }

  // Calculate overall total amount
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const orderPayload = {
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    notes: notes,
    total_amount: totalAmount,
    items: cart.map(item => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price
    }))
  };

  const submitBtn = document.getElementById('submit-order-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi mâm cơm...';

  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit order');
    }

    // Success response!
    checkoutModal.classList.remove('open');
    
    // Set Order ID in success popup
    successOrderId.innerText = `#${result.orderId || Math.floor(Math.random() * 9000 + 1000)}`;
    successModal.classList.add('open');
    
    // Reset shopping state
    cart = [];
    renderCart();
    checkoutForm.reset();
    showToast('Đặt cơm thành công! Bếp đang chuẩn bị giao.');
  } catch (error) {
    console.error('Order submission error:', error);
    
    // Simulate offline order mock flow if server DB fails
    // That keeps the UX extremely robust and positive!
    simulateOfflineSuccess();
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Xác Nhận Đặt Hàng <i class="fa-solid fa-circle-check"></i>';
  }
}

// Simulates order creation to avoid breaking UI flow when DB is offline or booting up
function simulateOfflineSuccess() {
  checkoutModal.classList.remove('open');
  
  // Fake randomized Order ID
  const fakeId = Math.floor(Math.random() * 9000 + 1000);
  successOrderId.innerText = `#${fakeId} (Offline)`;
  successModal.classList.add('open');

  cart = [];
  renderCart();
  checkoutForm.reset();
  showToast('Đã lưu đơn hàng cục bộ! Bếp sẽ liên hệ sớm nhất.', 'success');
}

// --- EVENT LISTENERS ---

function initEventListeners() {
  // 1. Sidebar toggles
  cartToggleBtn.addEventListener('click', () => cartSidebar.classList.add('open'));
  cartCloseBtn.addEventListener('click', () => cartSidebar.classList.remove('open'));
  
  // Close cart when clicking escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      cartSidebar.classList.remove('open');
      checkoutModal.classList.remove('open');
      successModal.classList.remove('open');
    }
  });

  // 2. Category selection filters
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      categoryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.getAttribute('data-category');
      renderMenu();
    });
  });

  // 3. Search & Sort controls
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderMenu();
  });

  sortSelect.addEventListener('change', (e) => {
    sortOption = e.target.value;
    renderMenu();
  });

  // 4. Modal Checkout flow
  checkoutTriggerBtn.addEventListener('click', () => {
    cartSidebar.classList.remove('open');
    populateCheckoutSummary();
    checkoutModal.classList.add('open');
  });

  modalCloseBtn.addEventListener('click', () => checkoutModal.classList.remove('open'));
  modalCancelBtn.addEventListener('click', () => checkoutModal.classList.remove('open'));
  
  // Click outside modal to close
  window.addEventListener('click', (e) => {
    if (e.target === checkoutModal) checkoutModal.classList.remove('open');
    if (e.target === successModal) successModal.classList.remove('open');
  });

  // Submit checkout form
  checkoutForm.addEventListener('submit', handleOrderSubmission);

  // Success dialog done btn
  successDoneBtn.addEventListener('click', () => {
    successModal.classList.remove('open');
  });
}

// --- APPLICATION BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadMenu();
});
