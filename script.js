// POS simple con inventario en localStorage
const initialInventory = [
  { id: 'b1', name: 'Hamburguesa', price: 5.50, stock: 20 },
  { id: 'b2', name: 'Papas Fritas', price: 2.50, stock: 30 },
  { id: 'b3', name: 'Refresco', price: 1.75, stock: 40 },
  { id: 'b4', name: 'Combo Niño', price: 6.50, stock: 10 }
];

const storageKey = 'pos_inventory';
const salesKey = 'pos_sales';

function loadInventory() {
  const raw = localStorage.getItem(storageKey);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(storageKey, JSON.stringify(initialInventory));
  return JSON.parse(localStorage.getItem(storageKey));
}

function saveInventory(inv) {
  localStorage.setItem(storageKey, JSON.stringify(inv));
}

function saveSale(sale) {
  const sales = JSON.parse(localStorage.getItem(salesKey) || '[]');
  sales.push(sale);
  localStorage.setItem(salesKey, JSON.stringify(sales));
}

let inventory = loadInventory();
let cart = [];

const menuEl = document.getElementById('menu');
const cartList = document.getElementById('cartList');
const totalEl = document.getElementById('total');
const customerInput = document.getElementById('customerName');
const subtotalElNode = document.getElementById('subtotalVal');
const ivaElNode = document.getElementById('ivaVal');
const tipElNode = document.getElementById('tipVal');
const totalValNode = document.getElementById('totalVal');
const tpl = document.getElementById('itemTpl');

function format(n){ return n.toFixed(2); }

function renderMenu() {
  menuEl.innerHTML = '';
  inventory.forEach(it => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.name').textContent = it.name;
    node.querySelector('.price').textContent = '$' + format(it.price);
    node.querySelector('.stockVal').textContent = it.stock;
    const qty = node.querySelector('.qty');
    const addBtn = node.querySelector('.add');
    if (it.stock <= 0) addBtn.disabled = true;
    addBtn.addEventListener('click', () => {
      const q = Math.max(1, parseInt(qty.value||1,10));
      addToCart(it.id, q);
    });
    menuEl.appendChild(node);
  });
}

function addToCart(id, qty) {
  const item = inventory.find(i=>i.id===id);
  if (!item) return;
  const existing = cart.find(c=>c.id===id);
  const want = (existing? existing.qty + qty : qty);
  if (want > item.stock) {
    alert('Stock insuficiente para ' + item.name);
    return;
  }
  if (existing) existing.qty += qty;
  else cart.push({ id: item.id, name: item.name, price: item.price, qty });
  renderCart();
}

function renderCart() {
  cartList.innerHTML = '';
  let subtotal = 0;
  cart.forEach(ci => {
    subtotal += ci.price * ci.qty;
    const li = document.createElement('li');
    li.innerHTML = `<span>${ci.name} x${ci.qty}</span><span>$${format(ci.price*ci.qty)}</span>`;
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '−';
    removeBtn.style.marginLeft = '8px';
    removeBtn.addEventListener('click', () => {
      removeFromCart(ci.id);
    });
    li.appendChild(removeBtn);
    cartList.appendChild(li);
  });
  // update breakdown (subtotal, IVA, tip, total) whenever cart changes
  updateBreakdown();
}

// compute breakdown and update UI
function updateBreakdown(){
  const subtotal = cart.reduce((s,c)=> s + c.price * c.qty, 0);
  const iva = +(subtotal * 0.19);
  const tip = +(subtotal * 0.10);
  const total = +(subtotal + iva + tip);
  if (subtotalElNode) subtotalElNode.textContent = format(subtotal);
  if (ivaElNode) ivaElNode.textContent = format(iva);
  if (tipElNode) tipElNode.textContent = format(tip);
  if (totalValNode) totalValNode.textContent = format(total);
  if (totalEl) totalEl.textContent = format(total);
  return { subtotal, iva, tip, total };
}

function removeFromCart(id) {
  cart = cart.filter(c=>c.id!==id);
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function checkout() {
  if (cart.length===0){ alert('Carrito vacío'); return; }
  // validar stock
  for (const c of cart) {
    const it = inventory.find(i=>i.id===c.id);
    if (!it || c.qty > it.stock) { alert('Stock insuficiente para: ' + c.name); return; }
  }
  // aplicar venta
  for (const c of cart) {
    const it = inventory.find(i=>i.id===c.id);
    it.stock -= c.qty;
  }
  saveInventory(inventory);
  // calcular desglose
  const breakdown = updateBreakdown();
  const customer = (customerInput && customerInput.value.trim()) || 'Cliente';
  // guardar una copia de los items
  const itemsCopy = cart.map(it => ({ id: it.id, name: it.name, price: it.price, qty: it.qty }));
  saveSale({ date: new Date().toISOString(), customer, items: itemsCopy, subtotal: breakdown.subtotal, iva: breakdown.iva, tip: breakdown.tip, total: breakdown.total });
  alert('Venta registrada:\nCliente: ' + customer + '\nTotal: $' + format(breakdown.total));
  clearCart();
  renderMenu();
}

document.getElementById('clearBtn').addEventListener('click', () => {
  clearCart();
});

document.getElementById('checkoutBtn').addEventListener('click', () => {
  checkout();
});

// init
// --- Autenticación (login admin/admin) ---
const loginOverlay = document.getElementById('loginOverlay');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginBtn = document.getElementById('loginBtn');
const userArea = document.getElementById('userArea');
const usernameEl = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const menuCards = document.getElementById('menuCards');
const inventoryAdminList = document.getElementById('inventoryAdminList');
const dashboardContent = document.getElementById('dashboardContent');
const salesView = document.getElementById('salesView');
const inventoryView = document.getElementById('inventoryView');
const dashboardView = document.getElementById('dashboardView');
const addProductForm = document.getElementById('addProductForm');
const addNameInput = document.getElementById('addName');
const addPriceInput = document.getElementById('addPrice');
const addStockInput = document.getElementById('addStock');
const addProductBtn = document.getElementById('addProductBtn');

function isLogged(){ return !!sessionStorage.getItem('pos_user'); }
function setUser(user){ sessionStorage.setItem('pos_user', JSON.stringify(user)); }
function clearUser(){ sessionStorage.removeItem('pos_user'); }

function showOverlay(){ if(loginOverlay) loginOverlay.style.display = 'flex'; }
function hideOverlay(){ if(loginOverlay) loginOverlay.style.display = 'none'; }

function applyAuthUI(){
  const raw = sessionStorage.getItem('pos_user');
  if (raw){
    const u = JSON.parse(raw);
    if (userArea) userArea.style.display = 'flex';
    if (usernameEl) usernameEl.textContent = u.username;
    hideOverlay();
    if (menuCards) menuCards.style.display = 'flex';
    // default view
    showView('sales');
  } else {
    if (userArea) userArea.style.display = 'none';
    if (menuCards) menuCards.style.display = 'none';
    showOverlay();
  }
}

function doLogin(){
  const u = (loginUser && loginUser.value || '').trim();
  const p = (loginPass && loginPass.value || '').trim();
  if (u === 'admin' && p === 'admin'){
    setUser({ username: 'admin' });
    applyAuthUI();
    if (loginPass) loginPass.value = '';
  } else {
    alert('Credenciales incorrectas');
    if (loginPass) { loginPass.value = ''; loginPass.focus(); }
  }
}

if (loginBtn) loginBtn.addEventListener('click', doLogin);
if (loginPass) loginPass.addEventListener('keyup', (e)=>{ if (e.key === 'Enter') doLogin(); });
if (loginUser) loginUser.addEventListener('keyup', (e)=>{ if (e.key === 'Enter') { if (loginPass) loginPass.focus(); } });
if (logoutBtn) logoutBtn.addEventListener('click', ()=>{ clearUser(); applyAuthUI(); });

// inicializar UI respetando sesión
// View control
function clearActiveMenu(){
  // remove .active from any menu-card
  document.querySelectorAll('.menu-card').forEach(c=>c.classList.remove('active'));
}

function showView(name){
  // hide all
  if (salesView) salesView.classList.toggle('hidden', name !== 'sales');
  if (inventoryView) inventoryView.classList.toggle('hidden', name !== 'inventory');
  if (dashboardView) dashboardView.classList.toggle('hidden', name !== 'dashboard');
  clearActiveMenu();
  // highlight corresponding card
  const card = document.querySelector(`.menu-card[data-key="${name === 'sales' ? 'sales' : name === 'inventory' ? 'inventory' : name === 'dashboard' ? 'dashboard' : ''}"]`);
  if (card) card.classList.add('active');
  // render specific
  if (name === 'sales'){
    renderMenu(); renderCart();
  } else if (name === 'inventory'){
    renderInventoryAdmin();
  } else if (name === 'dashboard'){
    renderDashboard();
  }
}
// card interactions: toggle options and actions
if (menuCards){
  menuCards.addEventListener('click', (e)=>{
    const card = e.target.closest('.menu-card');
    if (!card) return;
    // if clicked a card option button, handle action
    const opt = e.target.closest('.card-opt');
    if (opt){
      const action = opt.getAttribute('data-action');
      handleCardAction(card.getAttribute('data-key'), action);
      // close options after action
      card.classList.remove('open');
      return;
    }
    // toggle open state when clicking the card head
    card.classList.toggle('open');
    // close other cards
    document.querySelectorAll('.menu-card').forEach(c=>{ if (c !== card) c.classList.remove('open'); });
  });
}

function handleCardAction(key, action){
  if (key === 'sales'){
    if (action === 'new-sale') showView('sales');
    else if (action === 'history'){
      const sales = JSON.parse(localStorage.getItem(salesKey) || '[]');
      if (sales.length===0) return alert('No hay ventas registradas');
      // show more detailed history (date, customer, total)
      alert(sales.slice(-10).reverse().map(s=>`${new Date(s.date).toLocaleString()} — ${s.customer || 'Cliente'} — $${format(s.total)}`).join('\n'));
    }
  } else if (key === 'inventory'){
    if (action === 'view-edit') showView('inventory');
    else if (action === 'add-product'){
      showView('inventory');
      // focus the add form
      if (addNameInput) { addNameInput.focus(); }
    }
  } else if (key === 'dashboard'){
    if (action === 'summary') showView('dashboard');
    else if (action === 'export'){
      const sales = localStorage.getItem(salesKey) || '[]';
      const blob = new Blob([sales], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'ventas.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }
  }
}

function renderInventoryAdmin(){
  if (!inventoryAdminList) return;
  inventoryAdminList.innerHTML = '';
  inventory.forEach(it => {
    const wrap = document.createElement('div');
    wrap.className = 'inventory-admin-item';
    wrap.innerHTML = `
      <div class="field"><label>Nombre<br><input type="text" data-id="${it.id}" class="name-input" value="${escapeHtml(it.name)}" /></label></div>
      <div class="field"><label>Precio<br><input type="number" step="0.01" data-id="${it.id}" class="price-input" value="${format(it.price)}" /></label></div>
      <div class="field"><label>Stock<br><input type="number" min="0" data-id="${it.id}" class="stock-input" value="${it.stock}" /></label></div>
      <div style="margin-top:8px;"><button class="btn-save" data-id="${it.id}">Guardar</button><button class="btn-delete" data-id="${it.id}">Eliminar</button></div>
    `;
    inventoryAdminList.appendChild(wrap);
  });
  // attach handlers
  inventoryAdminList.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const id = btn.getAttribute('data-id');
      const nameInput = inventoryAdminList.querySelector(`.name-input[data-id="${id}"]`);
      const priceInput = inventoryAdminList.querySelector(`.price-input[data-id="${id}"]`);
      const stockInput = inventoryAdminList.querySelector(`.stock-input[data-id="${id}"]`);
      const item = inventory.find(i=>i.id===id);
      if (item){
        item.name = (nameInput.value || item.name).trim() || item.name;
        item.price = parseFloat(priceInput.value || item.price) || item.price;
        item.stock = Math.max(0, parseInt(stockInput.value||0,10) || 0);
        saveInventory(inventory);
        renderInventoryAdmin();
      }
    });
  });
  inventoryAdminList.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e)=>{
      const id = btn.getAttribute('data-id');
      const item = inventory.find(i=>i.id===id);
      if (!item) return;
      if (!confirm(`Eliminar producto "${item.name}"?`)) return;
      inventory = inventory.filter(i=>i.id!==id);
      saveInventory(inventory);
      renderInventoryAdmin();
    });
  });
}

// helper to prevent injecting raw HTML
function escapeHtml(str){ return String(str).replace(/[&<>"]/g, function(s){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[s]; }); }

// Add product handler (form in inventory view)
if (addProductBtn){
  addProductBtn.addEventListener('click', ()=>{
    const name = (addNameInput && addNameInput.value || '').trim();
    const price = parseFloat(addPriceInput && addPriceInput.value || 0) || 0;
    const stock = parseInt(addStockInput && addStockInput.value || 0, 10) || 0;
    if (!name){ alert('Ingrese un nombre para el producto'); if (addNameInput) addNameInput.focus(); return; }
    const id = 'p' + Date.now();
    inventory.push({ id, name, price, stock });
    saveInventory(inventory);
    // clear form
    if (addNameInput) addNameInput.value = '';
    if (addPriceInput) addPriceInput.value = '';
    if (addStockInput) addStockInput.value = '';
    renderInventoryAdmin();
  });
}

function renderDashboard(){
  if (!dashboardContent) return;
  const sales = JSON.parse(localStorage.getItem(salesKey) || '[]');
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((s, r) => s + (r.total || 0), 0);
  // build detailed sales list
  const salesHtml = sales.slice().reverse().map(s => {
    const itemsHtml = (s.items||[]).map(it => `<li>${it.name} x${it.qty} — $${format(it.price * it.qty)}</li>`).join('');
    return `
      <div class="dashboard-metric">
        <div><strong>Fecha:</strong> ${new Date(s.date).toLocaleString()}</div>
        <div><strong>Cliente:</strong> ${s.customer || 'Cliente'}</div>
        <div><strong>Total venta:</strong> $${format(s.total)}</div>
        <div><strong>Subtotal:</strong> $${format(s.subtotal || 0)} &nbsp; <strong>IVA:</strong> $${format(s.iva || 0)} &nbsp; <strong>Propina:</strong> $${format(s.tip || 0)}</div>
        <div><strong>Productos:</strong><ul>${itemsHtml}</ul></div>
      </div>
    `;
  }).join('');

  dashboardContent.innerHTML = `
    <div class="dashboard-metric"><strong>Total ventas:</strong> ${totalSales}</div>
    <div class="dashboard-metric"><strong>Ingresos:</strong> $${format(totalRevenue)}</div>
    <div style="margin-top:12px"><strong>Ventas detalladas:</strong></div>
    ${salesHtml || '<div class="dashboard-metric">No hay ventas registradas</div>'}
  `;
}

applyAuthUI();