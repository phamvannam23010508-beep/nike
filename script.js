/* === Utility storage helpers === */
function load(key, fallback){ try{ const s=localStorage.getItem(key); return s?JSON.parse(s):fallback }catch(e){return fallback}}
function save(key,val){ localStorage.setItem(key,JSON.stringify(val)) }

/* === Initial default products === */
const DEFAULT_PRODUCTS = [
  {
    id: 'nike-metcon-10-white-brown',
    name: 'Giày Nike Metcon 10 Nam - Trắng Nâu',
    image: 'https://myshoes.vn/image/cache/catalog/2025/nike/nike10/giay-nike-metcon-10-nam-trang-nau-01-1600x1600.jpg',
    price: 3490000,
    stock: 8,
    link: 'https://myshoes.vn/giay-nike/giay-nike-metcon-10-nam-cam-xanh.html'
  },
  {
    id: 'nike-metcon-10-cam-xanh',
    name: 'Giày Nike Metcon 10 Nam - Cam Xanh',
    image: 'https://via.placeholder.com/800x800.png?text=Metcon+10+Cam+Xanh',
    price: 3590000,
    stock: 5,
    link: 'https://myshoes.vn/giay-nike/giay-nike-metcon-10-nam-cam-xanh.html'
  }
];

let products = load('nike_products', DEFAULT_PRODUCTS);
let users = load('nike_users', [
  // admin is not stored in users list; we handle admin credential as hard-coded check
]);
let orders = load('nike_orders', []);
let sessions = load('nike_session', {}); // optional

/* Hard-coded admin credentials (as requested) */
const ADMIN_USERNAME = 'phamnam';
const ADMIN_PASSWORD = '123456789';

/* Helper: current user (object) */
function currentUser(){ return load('nike_currentUser', null) }

/* Page detection */
const page = document.body.dataset.page || '';

/* ------------------ LOGIN PAGE ------------------ */
if(page === 'login'){
  // Tabs
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  tabLogin.onclick = ()=>{ tabLogin.classList.add('active'); tabRegister.classList.remove('active'); loginForm.style.display='flex'; registerForm.style.display='none'}
  tabRegister.onclick = ()=>{ tabRegister.classList.add('active'); tabLogin.classList.remove('active'); loginForm.style.display='none'; registerForm.style.display='flex'}

  // Quick nav (for demo)
  document.getElementById('loginToIndex').onclick = ()=>{ location.href = 'index.html' }

  // Register
  registerForm.addEventListener('submit', e=>{
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const address = document.getElementById('regAddress').value.trim();

    if(!username || !password || !phone || !email || !address) return alert('Vui lòng nhập đầy đủ các trường.');

    // Prevent duplicate username OR admin reserved
    if(username === ADMIN_USERNAME) return alert('Username đã được bảo lưu (admin). Vui lòng chọn tên khác.');
    if(users.find(u=>u.username===username)) return alert('Username đã tồn tại.');

    const user = { username, password, phone, email, address, createdAt: Date.now() };
    users.push(user); save('nike_users', users);

    // login user
    save('nike_currentUser', user);
    alert('Đăng ký thành công. Bạn đã được đăng nhập.');
    location.href = 'index.html';
  });

  // Login
  loginForm.addEventListener('submit', e=>{
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if(!username || !password) return alert('Nhập username và password.');

    // Admin login
    if(username === ADMIN_USERNAME && password === ADMIN_PASSWORD){
      save('nike_currentUser', { username: ADMIN_USERNAME, isAdmin:true });
      alert('Đăng nhập admin thành công.');
      location.href = 'admin.html';
      return;
    }

    // Normal user login
    const user = users.find(u=>u.username===username && u.password===password);
    if(!user) return alert('Sai tài khoản hoặc mật khẩu.');
    save('nike_currentUser', user);
    alert('Đăng nhập thành công.');
    location.href = 'index.html';
  });
}

/* ------------------ INDEX (user) PAGE ------------------ */
if(page === 'index'){
  // Protect route: require logged-in user who is not admin
  const me = currentUser();
  if(!me || me.isAdmin){
    alert('Bạn phải đăng nhập tài khoản người dùng để truy cập trang này.');
    location.href = 'login.html';
  } else {
    document.getElementById('welcomeUser').textContent = 'Xin chào, ' + me.username;
  }

  // Logout
  document.getElementById('btn-logout').addEventListener('click', ()=>{
    localStorage.removeItem('nike_currentUser');
    alert('Đã đăng xuất.');
    location.href = 'login.html';
  });

  /* Cart & render products */
  let cart = load('nike_cart', {}); // {productId: qty}
  function cartCount(){ return Object.values(cart).reduce((s,v)=>s+v,0) }
  const pc = document.getElementById('cartCount');
  function updateCartUI(){ pc.textContent = cartCount(); save('nike_cart', cart); renderCart() }

  function renderProducts(){
    const grid = document.getElementById('productGrid'); grid.innerHTML = '';
    products.forEach(p=>{
      const el = document.createElement('div'); el.className='card';
      el.innerHTML = `
        <img src="${p.image}" alt="${p.name}" />
        <h4>${p.name}</h4>
        <p class="muted-small">${p.stock} có sẵn • ${p.price.toLocaleString()} VND</p>
        <div class="row" style="margin-top:8px">
          <button class="small-btn" data-id="${p.id}">Thêm vào giỏ</button>
          <a class="ghost" href="${p.link || '#'}" target="_blank">Chi tiết</a>
        </div>
      `;
      grid.appendChild(el);
    });

    // attach handlers
    document.querySelectorAll('.small-btn').forEach(b=>{
      b.onclick = ()=> {
        const id = b.dataset.id;
        const prod = products.find(x=>x.id===id);
        if(!prod) return alert('Sản phẩm không tồn tại.');
        if(prod.stock <= (cart[id]||0)) return alert('Hết hàng trong kho.');
        cart[id] = (cart[id]||0) + 1;
        updateCartUI();
        alert('Đã thêm vào giỏ: ' + prod.name);
      }
    });
  }

  function renderCart(){
    const box = document.getElementById('cartBox'); box.innerHTML = '';
    const items = Object.entries(cart);
    if(!items.length){ box.innerHTML = '<div class="muted-small">Giỏ hàng trống</div>'; return }
    let total = 0;
    items.forEach(([id,q])=>{
      const p = products.find(x=>x.id===id);
      if(!p) return;
      total += p.price * q;
      const row = document.createElement('div'); row.className='row';
      row.style.justifyContent='space-between';
      row.style.marginBottom='6px';
      row.innerHTML = `<div>${p.name} x ${q}</div><div>${(p.price*q).toLocaleString()} VND <button class="ghost" data-remove="${id}">-</button></div>`;
      box.appendChild(row);
    });
    const tot = document.createElement('div'); tot.style.marginTop='8px'; tot.innerHTML = `<strong>Tổng: ${total.toLocaleString()} VND</strong>`; box.appendChild(tot);

    // remove handlers
    box.querySelectorAll('[data-remove]').forEach(btn=>{
      btn.onclick = ()=> {
        const id = btn.dataset.remove;
        if(!cart[id]) return;
        cart[id]--; if(cart[id] <=0) delete cart[id];
        updateCartUI();
      }
    });
  }

  document.getElementById('btnClearCart').onclick = ()=> { cart = {}; save('nike_cart',cart); updateCartUI(); }
  document.getElementById('btnCheckout').onclick = ()=>{
    const items = Object.entries(cart);
    if(!items.length) return alert('Giỏ hàng rỗng.');
    // Build order items
    let total = 0; const orderItems = [];
    for(const [id,q] of items){
      const p = products.find(x=>x.id===id);
      if(!p) continue;
      if(p.stock < q) return alert(`Sản phẩm ${p.name} không đủ trong kho.`);
      total += p.price * q;
      orderItems.push({ id:p.id, name:p.name, price:p.price, qty:q });
    }
    // deduct stock
    products = products.map(p => {
      const found = orderItems.find(o=>o.id===p.id);
      if(found) p.stock = (p.stock - found.qty);
      return p;
    });
    save('nike_products', products);

    const me = currentUser();
    const order = {
      id: 'ORD' + Date.now(),
      user: me.username,
      items: orderItems,
      total,
      status: 'pending',
      createdAt: Date.now(),
      contact: { phone: me.phone, email: me.email, address: me.address }
    };
    orders.push(order); save('nike_orders', orders);
    cart = {}; save('nike_cart', cart); updateCartUI();
    alert('Đặt hàng thành công. Mã đơn: ' + order.id);
    renderProducts(); renderMyOrders();
  }

  function renderMyOrders(){
    const el = document.getElementById('myOrders'); el.innerHTML = '';
    const me = currentUser();
    const mine = orders.filter(o=>o.user === me.username).slice().reverse();
    if(!mine.length) return el.innerHTML = '<div class="muted-small">Bạn chưa có đơn hàng</div>';
    mine.forEach(o=>{
      const c = document.createElement('div'); c.className='card'; c.style.marginBottom='8px';
      c.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${o.id}</strong><div class="muted-small">${new Date(o.createdAt).toLocaleString()}</div></div><div>${o.status}</div></div>
      <div style="margin-top:8px">${o.items.map(it=>`<div>${it.name} x ${it.qty}</div>`).join('')}</div>
      <div style="margin-top:8px"><strong>Tổng: ${o.total.toLocaleString()} VND</strong></div>`;
      // allow cancel if pending
      if(o.status === 'pending'){
        const btn = document.createElement('button'); btn.textContent = 'Hủy đơn'; btn.style.marginTop='8px';
        btn.onclick = ()=>{
          if(!confirm('Bạn có muốn hủy đơn?')) return;
          o.status = 'cancelled';
          // return stock
          o.items.forEach(it => {
            products = products.map(p => p.id===it.id ? {...p, stock: p.stock + it.qty} : p);
          });
          save('nike_products', products);
          save('nike_orders', orders);
          renderMyOrders(); renderProducts();
          alert('Đã hủy đơn.');
        };
        c.appendChild(btn);
      }
      el.appendChild(c);
    });
  }

  // init
  renderProducts(); renderCart(); renderMyOrders();
}

/* ------------------ ADMIN PAGE ------------------ */
if(page === 'admin'){
  const me = currentUser();
  if(!me || !me.isAdmin){
    alert('Bạn cần đăng nhập tài khoản admin để truy cập trang này.');
    location.href = 'login.html';
  } else {
    document.getElementById('adminWelcome').textContent = me.username;
  }

  document.getElementById('adminLogout').onclick = ()=>{
    localStorage.removeItem('nike_currentUser');
    alert('Đã đăng xuất admin.');
    location.href = 'login.html';
  }

  const admName = document.getElementById('admName');
  const admImage = document.getElementById('admImage');
  const admPrice = document.getElementById('admPrice');
  const admStock = document.getElementById('admStock');
  const admAdd = document.getElementById('admAdd');
  const admProductsEl = document.getElementById('admProducts');
  const admOrdersEl = document.getElementById('admOrders');

  let editingId = null;

  function renderAdmProducts(){
    admProductsEl.innerHTML = '';
    products.forEach(p=>{
      const card = document.createElement('div'); card.className='card'; card.style.marginBottom='8px';
      card.innerHTML = `<div style="display:flex;gap:12px;align-items:center"><img src="${p.image}" width="90" height="90" style="object-fit:cover;border-radius:8px"/>
        <div><strong>${p.name}</strong><div class="muted-small">${p.stock} • ${p.price.toLocaleString()} VND</div></div></div>
        <div style="margin-top:8px" class="row">
          <button data-edit="${p.id}">Sửa</button>
          <button data-del="${p.id}" class="ghost">Xóa</button>
        </div>`;
      admProductsEl.appendChild(card);
    });
    // handlers
    admProductsEl.querySelectorAll('[data-edit]').forEach(b=> b.onclick = ()=>{
      const id = b.dataset.edit; const p = products.find(x=>x.id===id);
      if(!p) return;
      editingId = id;
      admName.value = p.name; admImage.value = p.image; admPrice.value = p.price; admStock.value = p.stock;
      admAdd.textContent = 'Cập nhật';
    });
    admProductsEl.querySelectorAll('[data-del]').forEach(b=> b.onclick = ()=>{
      const id = b.dataset.del;
      if(!confirm('Xóa sản phẩm này?')) return;
      products = products.filter(x=>x.id!==id); save('nike_products', products); renderAdmProducts();
    });
  }

  admAdd.onclick = ()=>{
    const name = admName.value.trim(); const image = admImage.value.trim(); const price = parseInt(admPrice.value)||0; const stock = parseInt(admStock.value)||0;
    if(!name || !image || !price) return alert('Vui lòng nhập đủ thông tin tên, ảnh, giá.');
    if(editingId){
      products = products.map(p => p.id===editingId ? {...p, name, image, price, stock} : p);
      editingId = null; admAdd.textContent = 'Thêm/Cập nhật';
    } else {
      const id = 'p' + Date.now();
      products.push({ id, name, image, price, stock });
    }
    save('nike_products', products); admName.value=''; admImage.value=''; admPrice.value=''; admStock.value='';
    renderAdmProducts(); renderAdmOrders();
  }

  function renderAdmOrders(){
    admOrdersEl.innerHTML = '';
    if(!orders.length) return admOrdersEl.innerHTML = '<div class="muted-small">Chưa có đơn hàng</div>';
    orders.slice().reverse().forEach(o=>{
      const c = document.createElement('div'); c.className='card'; c.style.marginBottom='8px';
      c.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${o.id}</strong><div class="muted-small">${new Date(o.createdAt).toLocaleString()}</div></div><div>${o.status}</div></div>
      <div style="margin-top:8px">${o.items.map(it=>`<div>${it.name} x ${it.qty}</div>`).join('')}</div>
      <div style="margin-top:8px"><strong>Tổng: ${o.total.toLocaleString()} VND</strong></div>
      <div style="margin-top:8px" class="row">
        <button data-confirm="${o.id}">Xác nhận</button>
        <button data-ship="${o.id}" class="ghost">Đang giao</button>
        <button data-cancel="${o.id}" class="ghost">Hủy</button>
      </div>`;
      admOrdersEl.appendChild(c);
    });

    admOrdersEl.querySelectorAll('[data-confirm]').forEach(b=> b.onclick = ()=>{
      const id = b.dataset.confirm; const o = orders.find(x=>x.id===id); if(!o) return;
      o.status = 'confirmed'; save('nike_orders', orders); renderAdmOrders();
    });
    admOrdersEl.querySelectorAll('[data-ship]').forEach(b=> b.onclick = ()=>{
      const id = b.dataset.ship; const o = orders.find(x=>x.id===id); if(!o) return;
      o.status = 'shipped'; save('nike_orders', orders); renderAdmOrders();
    });
    admOrdersEl.querySelectorAll('[data-cancel]').forEach(b=> b.onclick = ()=>{
      const id = b.dataset.cancel; const o = orders.find(x=>x.id===id); if(!o) return;
      if(!confirm('Bạn muốn hủy đơn này?')) return;
      o.status = 'cancelled';
      // return stock to inventory
      o.items.forEach(it => {
        products = products.map(p => p.id===it.id ? {...p, stock: p.stock + it.qty} : p);
      });
      save('nike_products', products); save('nike_orders', orders);
      renderAdmOrders(); renderAdmProducts();
    });
  }

  // init
  renderAdmProducts(); renderAdmOrders();
}

/* ------------------ End of script.js ------------------ */
