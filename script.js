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
const customerNITInput = document.getElementById('customerNIT');
const customerAddressInput = document.getElementById('customerAddress');
const customerPhoneInput = document.getElementById('customerPhone');
const clientSelectEl = document.getElementById('clientSelect');
const paymentMethodInput = document.getElementById('paymentMethod');
const subtotalElNode = document.getElementById('subtotalVal');
const ivaElNode = document.getElementById('ivaVal');
const tipElNode = document.getElementById('tipVal');
const totalValNode = document.getElementById('totalVal');
const tpl = document.getElementById('itemTpl');
const checkoutBtn = document.getElementById('checkoutBtn');
const configView = document.getElementById('configView');
const clientsView = document.getElementById('clientsView');
const suppliersView = document.getElementById('suppliersView');
// client form elements
const clientNameInput = document.getElementById('clientName');
const clientNITInput = document.getElementById('clientNIT');
const clientAddressInput = document.getElementById('clientAddress');
const clientPhoneInput = document.getElementById('clientPhone');
const addClientBtnEl = document.getElementById('addClientBtn');
const clientsListEl = document.getElementById('clientsList');
// supplier form elements
const supplierNameInput = document.getElementById('supplierName');
const supplierNITInput = document.getElementById('supplierNIT');
const supplierAddressInput = document.getElementById('supplierAddress');
const supplierPhoneInput = document.getElementById('supplierPhone');
const addSupplierBtnEl = document.getElementById('addSupplierBtn');
const suppliersListEl = document.getElementById('suppliersList');
const cfgCompanyName = document.getElementById('cfgCompanyName');
const cfgCompanyNIT = document.getElementById('cfgCompanyNIT');
const cfgCompanyAddress = document.getElementById('cfgCompanyAddress');
const cfgCompanyPhone = document.getElementById('cfgCompanyPhone');
const cfgFooterNote = document.getElementById('cfgFooterNote');
const saveConfigBtn = document.getElementById('saveConfigBtn');

// render menu of products into #menu using template
function renderMenu(){
  if (!menuEl) return;
  menuEl.innerHTML = '';
  if (!inventory || inventory.length === 0) {
    menuEl.innerHTML = '<div style="padding:16px;color:#e05a3c">No hay productos en inventario.<br>Agrega productos en la sección Inventario.</div>';
    return;
  }
  inventory.forEach(it => {
    const node = tpl.content.cloneNode(true);
    const nameEl = node.querySelector('.name');
    const priceEl = node.querySelector('.price');
    const stockVal = node.querySelector('.stockVal');
    const qty = node.querySelector('.qty');
    const addBtn = node.querySelector('.add');
    if (nameEl) nameEl.textContent = it.name;
    if (priceEl) priceEl.textContent = '$' + format(it.price);
    if (stockVal) stockVal.textContent = it.stock;
    if (it.stock <= 0 && addBtn) addBtn.disabled = true;
    if (addBtn) addBtn.addEventListener('click', ()=>{
      const q = Math.max(1, parseInt(qty.value||1,10));
      addToCart(it.id, q);
    });
    menuEl.appendChild(node);
  });
}

// populate client select in sales view
function populateClientSelect(){
  if (!clientSelectEl) return;
  const clients = loadClients();
  clientSelectEl.innerHTML = '';
  const opt0 = document.createElement('option'); opt0.value = ''; opt0.textContent = '-- Nuevo cliente --';
  clientSelectEl.appendChild(opt0);
  clients.forEach(c => {
    const o = document.createElement('option');
    o.value = c.id;
    o.textContent = c.name + (c.nit ? (' — ' + c.nit) : '');
    clientSelectEl.appendChild(o);
  });
}

// when an existing client is selected, autofill the sale fields
if (clientSelectEl) clientSelectEl.addEventListener('change', ()=>{
  const id = clientSelectEl.value;
  if (!id){
    if (customerInput) customerInput.value = '';
    if (customerNITInput) customerNITInput.value = '';
    if (customerAddressInput) customerAddressInput.value = '';
    if (customerPhoneInput) customerPhoneInput.value = '';
    return;
  }
  const clients = loadClients();
  const c = clients.find(x=>x.id===id);
  if (!c) return;
  if (customerInput) customerInput.value = c.name || '';
  if (customerNITInput) customerNITInput.value = c.nit || '';
  if (customerAddressInput) customerAddressInput.value = c.address || '';
  if (customerPhoneInput) customerPhoneInput.value = c.phone || '';
});

// add product to cart (respect stock)
function addToCart(id, qty){
  const it = inventory.find(i=>i.id===id);
  if (!it){ alert('Producto no encontrado'); return; }
  qty = Math.max(1, parseInt(qty||1,10));
  const existing = cart.find(c=>c.id===id);
  const currentInCart = existing ? existing.qty : 0;
  if (qty + currentInCart > it.stock){ alert('Stock insuficiente para: ' + it.name); return; }
  if (existing) existing.qty += qty;
  else cart.push({ id: it.id, name: it.name, price: it.price, qty });
  renderCart();
}

// render cart UI
function renderCart(){
  if (!cartList) return;
  cartList.innerHTML = '';
  if (!cart || cart.length === 0){
    cartList.innerHTML = '<li style="color:#666">Carrito vacío</li>';
    updateBreakdown();
    return;
  }
  cart.forEach(c=>{
    const li = document.createElement('li');
    li.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><div><strong>${escapeHtml(c.name)}</strong> x${c.qty}<br/><small>$${format(c.price)} c/u</small></div><div><span style="margin-right:8px">$${format(c.price * c.qty)}</span><button class="btn-small remove" data-id="${c.id}">Quitar</button></div></div>`;
    cartList.appendChild(li);
  });
  // attach remove handlers
  cartList.querySelectorAll('.remove').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-id');
      removeFromCart(id);
    });
  });
  updateBreakdown();
}

function format(n){ return Number(n||0).toFixed(2); }

function printTicket(sale){
  if (!sale) return;
  const win = window.open('', 'Ticket', 'width=360,height=800');
  if (!win) return;
  // determine document number from stored sales
  const sales = JSON.parse(localStorage.getItem(salesKey) || '[]');
  const idx = sales.findIndex(s => s.date === sale.date);
  const docNo = idx >= 0 ? (idx + 1) : (sales.length + 1);
  const sellerRaw = sessionStorage.getItem('pos_user');
  const seller = sellerRaw ? (JSON.parse(sellerRaw).username || '') : '';
  const items = sale.items || [];
  const itemsRows = items.map((it, i) => {
    return `<tr><td style="width:8%">${i+1}</td><td style="width:12%">${it.qty}</td><td style="width:30%">${escapeHtml(it.name)}</td><td style="width:50%" class="right">$${format(it.price * it.qty)}</td></tr>`;
  }).join('');
  const totalItems = items.reduce((s,it)=> s + (it.qty||0), 0);
  const qrData = `Venta: ${sale.date}\nCliente: ${sale.customer}\nTotal: $${format(sale.total)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;
  // load config for header
  const cfg = loadConfig();
  win.document.write(`
    <html><head><title>Ticket</title>
    <meta charset="utf-8" />
    <style>
      @page { size: 70mm auto; margin: 3mm; }
      body{font-family:monospace, monospace, Arial, sans-serif; padding:6px; margin:0; width:70mm; box-sizing:border-box; font-size:11px}
      .center{text-align:center}
      .small{font-size:10px}
      .dashed{border-top:1px dashed #000;margin:6px 0}
      table{width:100%; border-collapse:collapse; font-size:11px}
      td{padding:2px 0; vertical-align:top}
      .right{text-align:right}
      .bold{font-weight:700}
      .qr{display:block;margin:6px auto;width:72px;height:72px}
    </style></head><body>
    <div class="center bold">${escapeHtml(cfg.companyName || 'Empresa')}</div>
    <div class="center small">NIT: ${escapeHtml(cfg.companyNIT || '')}</div>
    <div class="center small">Dir.: ${escapeHtml(cfg.companyAddress || '')}</div>
    <div class="center small">${escapeHtml(cfg.companyPhone || '')}</div>
    <div class="dashed"></div>
    <div class="center">Documento de ingreso</div>
    <div class="center">No. ${docNo}</div>
    <div class="dashed"></div>
    <div class="small">Fecha de elaboración: ${new Date(sale.date).toLocaleString()}</div>
    <div class="small">${escapeHtml(cfg.legalNote || 'Este documento no reemplaza la factura de venta ni el documento equivalente, es un soporte de uso contable.')}</div>
    <div class="dashed"></div>
    <div><strong>Cliente:</strong> ${escapeHtml(sale.customer || 'Consumidor Final')}</div>
    <div><strong>C.C / NIT:</strong> ${escapeHtml(sale.customerNIT || '')}</div>
    <div><strong>Dirección:</strong> ${escapeHtml(sale.customerAddress || '')}</div>
    <div><strong>Vendedor:</strong> ${escapeHtml(seller)}</div>
    <div class="dashed"></div>
    <table>
      <tr>
        <td class="small">Ít.</td>
        <td class="small">Cant.</td>
        <td class="small">Vr. Unit</td>
        <td class="small right">Valor</td>
      </tr>
      ${itemsRows}
    </table>
    <div class="dashed"></div>
    <div>Total ítems: ${totalItems}</div>
    <div>Total bruto: $${format(sale.subtotal)}</div>
    <div>Descuentos: $0.00</div>
    <div>Subtotal: $${format(sale.subtotal)}</div>
    <div>IVA 19%: $${format(sale.iva)}</div>
    ${sale.tip ? `<div>Propina: $${format(sale.tip)}</div>` : ''}
    <div class="bold">Total a pagar: $${format(sale.total)}</div>
    <div class="dashed"></div>
    <div><strong>Método de pago:</strong> ${escapeHtml(sale.paymentMethod || 'Efectivo')}</div>
    <img src="${qrUrl}" class="qr" alt="QR" />
    <div class="center small">${escapeHtml(cfg.footerNote || '¡Gracias por su compra!')}</div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

// Configuration persistence for invoice/company
const configKey = 'pos_config';
function loadConfig(){
  try{
    const raw = localStorage.getItem(configKey);
    if (raw) return JSON.parse(raw);
  }catch(e){}
  return {
    companyName: 'Empresa Capacitación',
    companyNIT: '830048143-3',
    companyAddress: 'Cra. 18 #79A - 42',
    companyPhone: 'Bogotá - tel.3168476623',
    footerNote: '¡Gracias por su compra!',
    legalNote: 'Este documento no reemplaza la factura de venta ni el documento equivalente, es un soporte de uso contable.'
  };
}
function saveConfig(cfg){
  try{ localStorage.setItem(configKey, JSON.stringify(cfg)); return true;}catch(e){ return false; }
}

function renderConfig(){
  const cfg = loadConfig();
  if (cfgCompanyName) cfgCompanyName.value = cfg.companyName || '';
  if (cfgCompanyNIT) cfgCompanyNIT.value = cfg.companyNIT || '';
  if (cfgCompanyAddress) cfgCompanyAddress.value = cfg.companyAddress || '';
  if (cfgCompanyPhone) cfgCompanyPhone.value = cfg.companyPhone || '';
  if (cfgFooterNote) cfgFooterNote.value = cfg.footerNote || cfg.legalNote || '';
}

if (saveConfigBtn) saveConfigBtn.addEventListener('click', ()=>{
  const cfg = {
    companyName: (cfgCompanyName && cfgCompanyName.value.trim()) || 'Empresa Capacitación',
    companyNIT: (cfgCompanyNIT && cfgCompanyNIT.value.trim()) || '',
    companyAddress: (cfgCompanyAddress && cfgCompanyAddress.value.trim()) || '',
    companyPhone: (cfgCompanyPhone && cfgCompanyPhone.value.trim()) || '',
    footerNote: (cfgFooterNote && cfgFooterNote.value.trim()) || '¡Gracias por su compra!',
    legalNote: (cfgFooterNote && cfgFooterNote.value.trim()) || 'Este documento no reemplaza la factura de venta ni el documento equivalente, es un soporte de uso contable.'
  };
  saveConfig(cfg);
  alert('Configuración guardada');
  // re-render header if currently in config or sales
  renderConfig();
  renderMenu();
});

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

let lastSaleTicket = null;
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
  const customerNIT = (customerNITInput && customerNITInput.value.trim()) || '';
  const customerAddress = (customerAddressInput && customerAddressInput.value.trim()) || '';
  const customerPhone = (customerPhoneInput && customerPhoneInput.value.trim()) || '';
  const paymentMethod = (paymentMethodInput && paymentMethodInput.value) || 'Efectivo';
  // guardar una copia de los items
  const itemsCopy = cart.map(it => ({ id: it.id, name: it.name, price: it.price, qty: it.qty }));
  const saleObj = {
    date: new Date().toISOString(),
    customer,
    customerNIT,
    customerAddress,
    customerPhone,
    paymentMethod,
    items: itemsCopy,
    subtotal: breakdown.subtotal,
    iva: breakdown.iva,
    tip: breakdown.tip,
    total: breakdown.total
  };
  saveSale(saleObj);
  lastSaleTicket = saleObj;
  alert('Venta registrada:\nCliente: ' + customer + '\nTotal: $' + format(breakdown.total));
  if (printBtn) printBtn.style.display = 'inline-block';
  clearCart();
  renderMenu();
}

const printBtn = document.getElementById('printBtn');
const clearBtn = document.getElementById('clearBtn');
if (clearBtn) clearBtn.addEventListener('click', () => {
  clearCart();
  if (printBtn) printBtn.style.display = 'none';
});
if (printBtn) printBtn.addEventListener('click', () => {
  printTicket(lastSaleTicket);
});
if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
  checkout();
});

function printTicket(sale){
  if (!sale) return;
  const win = window.open('', 'Ticket', 'width=360,height=800');
  if (!win) return;
  const sales = JSON.parse(localStorage.getItem(salesKey) || '[]');
  const idx = sales.findIndex(s => s.date === sale.date);
  const docNo = idx >= 0 ? (idx + 1) : (sales.length + 1);
  const sellerRaw = sessionStorage.getItem('pos_user');
  const seller = sellerRaw ? (JSON.parse(sellerRaw).username || '') : '';
  const items = sale.items || [];
  const itemsRows = items.map((it, i) => {
    return `<tr><td style="width:8%">${i+1}</td><td style="width:12%">${it.qty}</td><td style="width:30%">${escapeHtml(it.name)}</td><td style="width:50%" class="right">$${format(it.price * it.qty)}</td></tr>`;
  }).join('');
  const totalItems = items.reduce((s,it)=> s + (it.qty||0), 0);
  const qrData = `Venta: ${sale.date}\nCliente: ${sale.customer}\nTotal: $${format(sale.total)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;
  win.document.write(`
    <html><head><title>Ticket</title>
    <meta charset="utf-8" />
    <style>
      @page { size: 70mm auto; margin: 3mm; }
      body{font-family:monospace, monospace, Arial, sans-serif; padding:6px; margin:0; width:70mm; box-sizing:border-box; font-size:11px}
      .center{text-align:center}
      .small{font-size:10px}
      .dashed{border-top:1px dashed #000;margin:6px 0}
      table{width:100%; border-collapse:collapse; font-size:11px}
      td{padding:2px 0; vertical-align:top}
      .right{text-align:right}
      .bold{font-weight:700}
      .qr{display:block;margin:6px auto;width:72px;height:72px}
    </style></head><body>
    <div class="center bold">Empresa Capacitación</div>
    <div class="center small">NIT: 830048143-3</div>
    <div class="center small">Dir.: Cra. 18 #79A - 42</div>
    <div class="center small">Bogotá - tel.3168476623</div>
    <div class="dashed"></div>
    <div class="center">Documento de ingreso</div>
    <div class="center">No. ${docNo}</div>
    <div class="dashed"></div>
    <div class="small">Fecha de elaboración: ${new Date(sale.date).toLocaleString()}</div>
    <div class="small">Este documento no reemplaza la factura de venta ni el documento equivalente, es un soporte de uso contable.</div>
    <div class="dashed"></div>
    <div><strong>Cliente:</strong> ${escapeHtml(sale.customer || 'Consumidor Final')}</div>
    <div><strong>C.C / NIT:</strong> ${escapeHtml(sale.customerNIT || '')}</div>
    <div><strong>Dirección:</strong> ${escapeHtml(sale.customerAddress || '')}</div>
    <div><strong>Vendedor:</strong> ${escapeHtml(seller)}</div>
    <div class="dashed"></div>
    <table>
      <tr>
        <td class="small">Ít.</td>
        <td class="small">Cant.</td>
        <td class="small">Vr. Unit</td>
        <td class="small right">Valor</td>
      </tr>
      ${itemsRows}
    </table>
    <div class="dashed"></div>
    <div>Total ítems: ${totalItems}</div>
    <div>Total bruto: $${format(sale.subtotal)}</div>
    <div>Descuentos: $0.00</div>
    <div>Subtotal: $${format(sale.subtotal)}</div>
    <div>IVA 19%: $${format(sale.iva)}</div>
    ${sale.tip ? `<div>Propina: $${format(sale.tip)}</div>` : ''}
    <div class="bold">Total a pagar: $${format(sale.total)}</div>
    <div class="dashed"></div>
    <div><strong>Método de pago:</strong> ${escapeHtml(sale.paymentMethod || 'Efectivo')}</div>
    <img src="${qrUrl}" class="qr" alt="QR" />
    <div class="center small">¡Gracias por su compra!</div>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

// init
// --- Autenticación (login admin/admin) ---
const loginOverlay = document.getElementById('loginOverlay');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const loginBtn = document.getElementById('loginBtn');

// Robust login initialization
const loginError = document.getElementById('loginError');
function showLoginError(msg){
  if (loginError) { loginError.textContent = msg; loginError.style.display = 'block'; }
}
function hideLoginError(){
  if (loginError) { loginError.textContent = ''; loginError.style.display = 'none'; }
}
function tryLoginInit() {
  if (!loginBtn || !loginUser || !loginPass) return;
  loginBtn.onclick = doLogin;
  loginPass.onkeyup = function(e){ if (e.key === 'Enter') doLogin(); hideLoginError(); };
  loginUser.onkeyup = function(e){ if (e.key === 'Enter') loginPass.focus(); hideLoginError(); };
  loginUser.oninput = hideLoginError;
  loginPass.oninput = hideLoginError;
}
tryLoginInit();
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
    if (loginPass) loginPass.value = '';
    if (loginUser) loginUser.value = '';
    hideLoginError();
    applyAuthUI();
    hideOverlay();
  } else {
    showLoginError('Usuario o contraseña incorrectos');
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
  if (salesView) salesView.classList.add('hidden');
  if (inventoryView) inventoryView.classList.add('hidden');
  if (dashboardView) dashboardView.classList.add('hidden');
  if (configView) configView.classList.add('hidden');
  if (clientsView) clientsView.classList.add('hidden');
  if (suppliersView) suppliersView.classList.add('hidden');
  clearActiveMenu();
  // highlight corresponding card
  const keyName = name === 'sales' ? 'sales' : name === 'inventory' ? 'inventory' : name === 'dashboard' ? 'dashboard' : name === 'config' ? 'config' : name === 'clients' ? 'clients' : name === 'suppliers' ? 'suppliers' : '';
  const card = document.querySelector(`.menu-card[data-key="${keyName}"]`);
  if (card) card.classList.add('active');
  // render specific
  if (name === 'sales'){
    if (salesView) salesView.classList.remove('hidden');
    if (menuEl) menuEl.innerHTML = '';
    if (inventory && inventory.length > 0) {
      renderMenu();
    } else {
      menuEl.innerHTML = '<div style="padding:16px;color:#e05a3c">No hay productos en inventario</div>';
    }
    renderCart();
    populateClientSelect();
  } else if (name === 'inventory'){
    if (inventoryView) inventoryView.classList.remove('hidden');
    renderInventoryAdmin();
  } else if (name === 'dashboard'){
    if (dashboardView) dashboardView.classList.remove('hidden');
    renderDashboard();
  } else if (name === 'config'){
    if (configView) configView.classList.remove('hidden');
    renderConfig();
  } else if (name === 'clients'){
    if (clientsView) clientsView.classList.remove('hidden');
    renderClients();
  } else if (name === 'suppliers'){
    if (suppliersView) suppliersView.classList.remove('hidden');
    renderSuppliers();
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
      // Refuerzo: si es nueva venta, limpiar carrito y mostrar vista
      if (card.getAttribute('data-key') === 'sales' && action === 'new-sale') {
        clearCart();
        showView('sales');
      } else {
        handleCardAction(card.getAttribute('data-key'), action);
      }
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
  } else if (key === 'config'){
    if (action === 'open-config') showView('config');
  } else if (key === 'clients'){
    if (action === 'view-clients') showView('clients');
    else if (action === 'add-client') { showView('clients'); if (clientNameInput) clientNameInput.focus(); }
  } else if (key === 'suppliers'){
    if (action === 'view-suppliers') showView('suppliers');
    else if (action === 'add-supplier') { showView('suppliers'); if (supplierNameInput) supplierNameInput.focus(); }
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

// Clients & Suppliers storage
const clientsKey = 'pos_clients';
const suppliersKey = 'pos_suppliers';

function loadClients(){ return JSON.parse(localStorage.getItem(clientsKey) || '[]'); }
function saveClients(list){ localStorage.setItem(clientsKey, JSON.stringify(list)); }
function loadSuppliers(){ return JSON.parse(localStorage.getItem(suppliersKey) || '[]'); }
function saveSuppliers(list){ localStorage.setItem(suppliersKey, JSON.stringify(list)); }

function renderClients(){
  if (!clientsListEl) return;
  const clients = loadClients();
  clientsListEl.innerHTML = '';
  if (clients.length === 0) { clientsListEl.innerHTML = '<div class="inventory-admin-item">No hay clientes</div>'; return; }
  clients.forEach(c => {
    const wrap = document.createElement('div'); wrap.className = 'inventory-admin-item';
    wrap.innerHTML = `
      <div class="field"><label>Nombre<br><input type="text" data-id="${c.id}" class="client-name" value="${escapeHtml(c.name)}" /></label></div>
      <div class="field"><label>NIT<br><input type="text" data-id="${c.id}" class="client-nit" value="${escapeHtml(c.nit||'')}" /></label></div>
      <div class="field"><label>Dirección<br><input type="text" data-id="${c.id}" class="client-address" value="${escapeHtml(c.address||'')}" /></label></div>
      <div class="field"><label>Teléfono<br><input type="text" data-id="${c.id}" class="client-phone" value="${escapeHtml(c.phone||'')}" /></label></div>
      <div style="margin-top:8px;"><button class="btn-save-client" data-id="${c.id}">Guardar</button> <button class="btn-delete-client" data-id="${c.id}">Eliminar</button></div>
    `;
    clientsListEl.appendChild(wrap);
  });
  // handlers
  clientsListEl.querySelectorAll('.btn-save-client').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-id');
      const item = loadClients().find(x=>x.id===id);
      const parent = btn.closest('.inventory-admin-item');
      if (!item || !parent) return;
      const name = parent.querySelector('.client-name').value.trim();
      const nit = parent.querySelector('.client-nit').value.trim();
      const address = parent.querySelector('.client-address').value.trim();
      const phone = parent.querySelector('.client-phone').value.trim();
      const list = loadClients().map(x => x.id===id ? Object.assign({}, x, { name, nit, address, phone }) : x);
      saveClients(list); renderClients();
      // update client select in sales view
      populateClientSelect();
    });
  });
  clientsListEl.querySelectorAll('.btn-delete-client').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-id');
      if (!confirm('Eliminar cliente?')) return;
      const list = loadClients().filter(x=>x.id!==id);
      saveClients(list); renderClients();
      populateClientSelect();
    });
  });
}

function renderSuppliers(){
  if (!suppliersListEl) return;
  const suppliers = loadSuppliers();
  suppliersListEl.innerHTML = '';
  if (suppliers.length === 0) { suppliersListEl.innerHTML = '<div class="inventory-admin-item">No hay proveedores</div>'; return; }
  suppliers.forEach(s => {
    const wrap = document.createElement('div'); wrap.className = 'inventory-admin-item';
    wrap.innerHTML = `
      <div class="field"><label>Nombre<br><input type="text" data-id="${s.id}" class="supplier-name" value="${escapeHtml(s.name)}" /></label></div>
      <div class="field"><label>NIT<br><input type="text" data-id="${s.id}" class="supplier-nit" value="${escapeHtml(s.nit||'')}" /></label></div>
      <div class="field"><label>Dirección<br><input type="text" data-id="${s.id}" class="supplier-address" value="${escapeHtml(s.address||'')}" /></label></div>
      <div class="field"><label>Teléfono<br><input type="text" data-id="${s.id}" class="supplier-phone" value="${escapeHtml(s.phone||'')}" /></label></div>
      <div style="margin-top:8px;"><button class="btn-save-supplier" data-id="${s.id}">Guardar</button> <button class="btn-delete-supplier" data-id="${s.id}">Eliminar</button></div>
    `;
    suppliersListEl.appendChild(wrap);
  });
  suppliersListEl.querySelectorAll('.btn-save-supplier').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-id');
      const parent = btn.closest('.inventory-admin-item');
      if (!parent) return;
      const name = parent.querySelector('.supplier-name').value.trim();
      const nit = parent.querySelector('.supplier-nit').value.trim();
      const address = parent.querySelector('.supplier-address').value.trim();
      const phone = parent.querySelector('.supplier-phone').value.trim();
      const list = loadSuppliers().map(x => x.id===id ? Object.assign({}, x, { name, nit, address, phone }) : x);
      saveSuppliers(list); renderSuppliers();
    });
  });
  suppliersListEl.querySelectorAll('.btn-delete-supplier').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-id');
      if (!confirm('Eliminar proveedor?')) return;
      const list = loadSuppliers().filter(x=>x.id!==id);
      saveSuppliers(list); renderSuppliers();
    });
  });
}

// add handlers for add buttons
if (addClientBtnEl) addClientBtnEl.addEventListener('click', ()=>{
  const name = (clientNameInput && clientNameInput.value.trim()) || '';
  if (!name) { alert('Ingrese nombre del cliente'); if (clientNameInput) clientNameInput.focus(); return; }
  const list = loadClients();
  const id = 'c' + Date.now();
  list.push({ id, name, nit: (clientNITInput&&clientNITInput.value.trim())||'', address: (clientAddressInput&&clientAddressInput.value.trim())||'', phone: (clientPhoneInput&&clientPhoneInput.value.trim())||'' });
  saveClients(list); renderClients();
  populateClientSelect();
  if (clientNameInput) clientNameInput.value = '';
  if (clientNITInput) clientNITInput.value = '';
  if (clientAddressInput) clientAddressInput.value = '';
  if (clientPhoneInput) clientPhoneInput.value = '';
});

if (addSupplierBtnEl) addSupplierBtnEl.addEventListener('click', ()=>{
  const name = (supplierNameInput && supplierNameInput.value.trim()) || '';
  if (!name) { alert('Ingrese nombre del proveedor'); if (supplierNameInput) supplierNameInput.focus(); return; }
  const list = loadSuppliers();
  const id = 's' + Date.now();
  list.push({ id, name, nit: (supplierNITInput&&supplierNITInput.value.trim())||'', address: (supplierAddressInput&&supplierAddressInput.value.trim())||'', phone: (supplierPhoneInput&&supplierPhoneInput.value.trim())||'' });
  saveSuppliers(list); renderSuppliers();
  if (supplierNameInput) supplierNameInput.value = '';
  if (supplierNITInput) supplierNITInput.value = '';
  if (supplierAddressInput) supplierAddressInput.value = '';
  if (supplierPhoneInput) supplierPhoneInput.value = '';
});

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
    const itemsHtml = (s.items||[]).map(it => `<li>${escapeHtml(it.name)} x${it.qty} — $${format(it.price * it.qty)}</li>`).join('');
    return `
      <div class="dashboard-metric">
        <div><strong>Fecha:</strong> ${new Date(s.date).toLocaleString()}</div>
        <div><strong>Cliente:</strong> ${escapeHtml(s.customer || 'Cliente')}</div>
        <div><strong>Método de pago:</strong> ${escapeHtml(s.paymentMethod || 'Efectivo')}</div>
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
