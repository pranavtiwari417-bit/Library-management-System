
const books = [
  {id:1, title:"The Alchemist", author:"Paulo Coelho", category:"Fiction", price:299, color:"#356454", text:"#fff4d9", bg:"#e5eee5"},
  {id:2, title:"Atomic Habits", author:"James Clear", category:"Self-help", price:399, color:"#d6e3c8", text:"#304832", bg:"#edf1e8"},
  {id:3, title:"Clean Code", author:"Robert C. Martin", category:"Technology", price:599, color:"#34445b", text:"#ffffff", bg:"#e2e7ee"},
  {id:4, title:"Rich Dad Poor Dad", author:"Robert Kiyosaki", category:"Education", price:349, color:"#c18b48", text:"#fff8e7", bg:"#f0e5d4"},
  {id:5, title:"Ikigai", author:"Hector Garcia", category:"Self-help", price:249, color:"#bc7759", text:"#fff8e9", bg:"#f0e2d8"},
  {id:6, title:"The Great Gatsby", author:"F. Scott Fitzgerald", category:"Fiction", price:199, color:"#806c8d", text:"#ffffff", bg:"#e9e1ed"},
  {id:7, title:"JavaScript Guide", author:"David Flanagan", category:"Technology", price:499, color:"#dfc44b", text:"#30382c", bg:"#f4efce"},
  {id:8, title:"Think and Grow Rich", author:"Napoleon Hill", category:"Education", price:279, color:"#416c63", text:"#ffffff", bg:"#e0ebe5"}
];

const $ = id => document.getElementById(id);

let category = "All";
let searchText = "";
let cart = readStorage("libraryCart", []);
let users = readStorage("libraryUsers", []);
let currentUser = readStorage("libraryCurrentUser", null);
let authMode = "login";

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[ch]);
}

function money(value) {
  return "₹" + value.toLocaleString("en-IN");
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

// Display books
function renderBooks() {
  let list = books.filter(book => {
    const matchesCategory =
      category === "All" || book.category === category;

    const matchesSearch =
      `${book.title} ${book.author} ${book.category}`
        .toLowerCase()
        .includes(searchText.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  $("bookGrid").innerHTML = list.map(book => `
    <article class="book-card">
      <div class="book-cover"
           style="--book-bg:${book.bg}">
        <div class="cover-design"
             style="--book-color:${book.color};
                    --book-text:${book.text}">
          <span>${escapeHTML(book.title)}</span>
          <small>${escapeHTML(book.author)}</small>
        </div>
      </div>

      <div class="book-info">
        <h3>${escapeHTML(book.title)}</h3>
        <p>By ${escapeHTML(book.author)}</p>
        <p>${escapeHTML(book.category)}</p>

        <div class="book-actions">
          <span class="book-price">${money(book.price)}</span>
          <button class="add-btn" data-add="${book.id}">
            + Add to Cart
          </button>
        </div>
      </div>
    </article>
  `).join("");

  $("emptyMessage").classList.toggle("hidden", list.length !== 0);
}

// Category filters
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    category = button.dataset.category;

    document.querySelectorAll(".filter").forEach(btn => {
      btn.classList.toggle("active", btn === button);
    });

    renderBooks();
  });
});

// Search
$("search").addEventListener("input", event => {
  searchText = event.target.value;
  renderBooks();
});

// Add books to cart
$("bookGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  const id = Number(button.dataset.add);
  const item = cart.find(item => item.id === id);

  if (item) {
    item.quantity++;
  } else {
    cart.push({id, quantity:1});
  }

  saveStorage("libraryCart", cart);
  renderCart();
  showToast("Book added to cart!");
});

// Render cart
function renderCart() {
  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  const totalPrice = cart.reduce((sum, item) => {
    const book = books.find(book => book.id === item.id);
    return sum + book.price * item.quantity;
  }, 0);

  $("cartCount").textContent = totalItems;
  $("subtotal").textContent = money(totalPrice);

  if (cart.length === 0) {
    $("cartItems").innerHTML = `
      <div class="cart-empty">
        <h3>Your cart is empty!</h3>
        <p>Explore the collection and add a book.</p>
      </div>`;
    return;
  }

  $("cartItems").innerHTML = cart.map(item => {
    const book = books.find(book => book.id === item.id);

    return `
      <div class="cart-row">
        <div>
          <h3>${escapeHTML(book.title)}</h3>
          <p>${money(book.price)} each</p>

          <div class="qty-controls">
            <button data-change="${book.id}" data-delta="-1">−</button>
            <span>${item.quantity}</span>
            <button data-change="${book.id}" data-delta="1">+</button>
          </div>

          <button class="remove-btn" data-remove="${book.id}">
            Remove
          </button>
        </div>

        <strong>${money(book.price * item.quantity)}</strong>
      </div>`;
  }).join("");
}

// Update quantity and remove books
$("cartItems").addEventListener("click", event => {
  const change = event.target.closest("[data-change]");
  const remove = event.target.closest("[data-remove]");

  if (change) {
    const id = Number(change.dataset.change);
    const delta = Number(change.dataset.delta);
    const item = cart.find(item => item.id === id);

    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) {
        cart = cart.filter(item => item.id !== id);
      }
    }
  }

  if (remove) {
    const id = Number(remove.dataset.remove);
    cart = cart.filter(item => item.id !== id);
  }

  saveStorage("libraryCart", cart);
  renderCart();
});

// Cart drawer
function openCart() {
  $("overlay").classList.remove("hidden");
  $("cartPanel").classList.add("open");
}

function closeCart() {
  $("cartPanel").classList.remove("open");

  if ($("authModal").classList.contains("hidden")) {
    $("overlay").classList.add("hidden");
  }
}

$("cartBtn").addEventListener("click", openCart);
$("closeCart").addEventListener("click", closeCart);
$("continueBtn").addEventListener("click", closeCart);

// Login / registration modal
function openAuth(mode) {
  closeCart();
  authMode = mode;

  const isRegister = mode === "register";

  $("authTitle").textContent =
    isRegister ? "Create Account" : "Login";

  $("authDescription").textContent =
    isRegister
      ? "Join PageTurner and explore your next read."
      : "Welcome back to PageTurner.";

  $("nameField").classList.toggle("hidden", !isRegister);
  $("fullName").required = isRegister;

  $("authSubmit").textContent =
    isRegister ? "Register" : "Login";

  $("switchText").textContent =
    isRegister ? "Already registered?" : "New here?";

  $("switchAuth").textContent =
    isRegister ? "Login" : "Create account";

  $("authMessage").textContent = "";

  $("overlay").classList.remove("hidden");
  $("authModal").classList.remove("hidden");
}

function closeAuth() {
  $("authModal").classList.add("hidden");

  if (!$("cartPanel").classList.contains("open")) {
    $("overlay").classList.add("hidden");
  }
}

$("loginBtn").addEventListener("click", () => {
  if (currentUser) {
    showToast("Logged in as " + currentUser.name);
  } else {
    openAuth("login");
  }
});

$("registerBtn").addEventListener("click", () => {
  if (currentUser) {
    currentUser = null;
    saveStorage("libraryCurrentUser", null);
    updateHeader();
    showToast("Logged out successfully.");
  } else {
    openAuth("register");
  }
});

$("closeAuth").addEventListener("click", closeAuth);

$("overlay").addEventListener("click", () => {
  closeCart();
  closeAuth();
});

$("switchAuth").addEventListener("click", () => {
  openAuth(authMode === "login" ? "register" : "login");
});

// Register or login
$("authForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("fullName").value.trim();
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const message = $("authMessage");

  message.textContent = "";

  if (authMode === "register") {
    if (name.length < 2) {
      message.textContent = "Please enter your full name.";
      return;
    }

    if (password.length < 6) {
      message.textContent = "Password must be at least 6 characters.";
      return;
    }

    if (users.some(user => user.email === email)) {
      message.textContent = "Email already registered. Please login.";
      return;
    }

    users.push({name, email, password});
    saveStorage("libraryUsers", users);

    currentUser = {name, email};
  } else {
    const user = users.find(
      user => user.email === email && user.password === password
    );

    if (!user) {
      message.textContent =
        "Incorrect details. Register first if you are a new user.";
      return;
    }

    currentUser = {name:user.name, email:user.email};
  }

  saveStorage("libraryCurrentUser", currentUser);
  updateHeader();
  closeAuth();
  $("authForm").reset();

  showToast(
    authMode === "register"
      ? "Registration successful!"
      : "Login successful!"
  );
});

function updateHeader() {
  if (currentUser) {
    $("loginBtn").textContent =
      "Hi, " + currentUser.name.split(" ")[0];

    $("registerBtn").textContent = "Logout";
  } else {
    $("loginBtn").textContent = "Login";
    $("registerBtn").textContent = "Register";
  }
}

// Checkout demo
$("checkoutBtn").addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("Your cart is empty.");
    return;
  }

  if (!currentUser) {
    closeCart();
    openAuth("login");
    $("authMessage").textContent =
      "Please login before proceeding to checkout.";
    return;
  }

  const total = cart.reduce((sum, item) => {
    const book = books.find(book => book.id === item.id);
    return sum + book.price * item.quantity;
  }, 0);

  alert(
    "Order Summary\n\n" +
    "Customer: " + currentUser.name + "\n" +
    "Total: " + money(total) +
    "\n\nDemo checkout only. No payment was processed."
  );
});

// Keyboard support
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeCart();
    closeAuth();
  }
});

$("year").textContent = new Date().getFullYear();

renderBooks();
renderCart();
updateHeader();
