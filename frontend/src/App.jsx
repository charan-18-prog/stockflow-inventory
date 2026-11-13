
import { useState, useEffect } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [page, setPage] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    name: "",
    sku: "",
    description: "",
    quantity: 0,
    cost_price: "",
    selling_price: "",
    low_stock_threshold: 5,
  };

  const [form, setForm] = useState(emptyForm);

  // API request helper
  const apiRequest = async (url, options = {}) => {
    const response = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Request failed");
    }

    return data;
  };

  // Load dashboard
  const loadDashboard = async () => {
    const data = await apiRequest("/dashboard/summary");
    setDashboard(data);
  };

  // Load products
  const loadProducts = async (searchValue = "") => {
    const query = searchValue
      ? `?search=${encodeURIComponent(searchValue)}`
      : "";

    const data = await apiRequest(`/products/${query}`);
    setProducts(data);
  };

  // Load data after login and when page changes
  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        if (page === "dashboard") {
          await loadDashboard();
        } else {
          await loadProducts(search);
        }
      } catch (error) {
        setProductMessage(error.message);

        if (
          error.message.includes("token") ||
          error.message.includes("authenticated")
        ) {
          handleLogout();
        }
      }
    };

    loadData();
  }, [token, page]);

  // Login and signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const endpoint = isLogin ? "login" : "signup";

    const body = isLogin
      ? { email, password }
      : {
          email,
          password,
          organization_name: organizationName,
        };

    try {
      const response = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Something went wrong");
      }

      localStorage.setItem("access_token", data.access_token);
      setToken(data.access_token);
      setPage("dashboard");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setDashboard(null);
    setProducts([]);
    setPage("dashboard");
  };

  // Form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // Add or update product
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductMessage("");

    const productData = {
      ...form,
      quantity: Number(form.quantity),
      cost_price: form.cost_price === "" ? null : Number(form.cost_price),
      selling_price:
        form.selling_price === "" ? null : Number(form.selling_price),
      low_stock_threshold:
        form.low_stock_threshold === ""
          ? null
          : Number(form.low_stock_threshold),
    };

    try {
      if (editingId) {
        await apiRequest(`/products/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(productData),
        });

        setProductMessage("Product updated successfully!");
      } else {
        await apiRequest("/products/", {
          method: "POST",
          body: JSON.stringify(productData),
        });

        setProductMessage("Product added successfully!");
      }

      setForm(emptyForm);
      setEditingId(null);

      await loadProducts(search);
      await loadDashboard();
    } catch (error) {
      setProductMessage(error.message);
    }
  };

  // Edit product
  const handleEdit = (product) => {
    setForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      quantity: product.quantity,
      cost_price: product.cost_price ?? "",
      selling_price: product.selling_price ?? "",
      low_stock_threshold: product.low_stock_threshold ?? "",
    });

    setEditingId(product.id);
    setProductMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete product
  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      await apiRequest(`/products/${productId}`, {
        method: "DELETE",
      });

      setProductMessage("Product deleted successfully!");
      await loadProducts(search);
      await loadDashboard();
    } catch (error) {
      setProductMessage(error.message);
    }
  };

  // Login / Signup screen
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>StockFlow</h1>
          <p className="subtitle">Inventory Management System</p>

          <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>Organization Name</label>
                <input
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                minLength={8}
                required
              />
            </div>

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login"
                : "Create Account"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}

          <p className="toggle-text">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}

            <span onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
            }}>
              {isLogin ? " Sign Up" : " Login"}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // Main application
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>StockFlow</h1>

        <nav className="nav-links">
          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => {
              setPage("dashboard");
              setProductMessage("");
            }}
          >
            Dashboard
          </button>

          <button
            className={page === "products" ? "active" : ""}
            onClick={() => {
              setPage("products");
              setProductMessage("");
            }}
          >
            Products
          </button>
        </nav>

        <button onClick={handleLogout}>Logout</button>
      </header>

      <main className="dashboard-content">
        {page === "dashboard" ? (
          <>
            <h2>Dashboard</h2>
            <p className="dashboard-subtitle">Inventory overview</p>

            {dashboard && (
              <>
                <div className="summary-cards">
                  <div className="summary-card">
                    <h3>Total Products</h3>
                    <p>{dashboard.total_products}</p>
                  </div>

                  <div className="summary-card">
                    <h3>Total Quantity</h3>
                    <p>{dashboard.total_quantity}</p>
                  </div>

                  <div className="summary-card">
                    <h3>Low Stock Items</h3>
                    <p>{dashboard.low_stock_count}</p>
                  </div>
                </div>

                <section className="low-stock-section">
                  <h2>Low Stock Products</h2>

                  {dashboard.low_stock_products.length === 0 ? (
                    <p>No low stock products.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>SKU</th>
                          <th>Quantity</th>
                          <th>Threshold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboard.low_stock_products.map((product) => (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.sku}</td>
                            <td>{product.quantity}</td>
                            <td>{product.low_stock_threshold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
              </>
            )}
          </>
        ) : (
          <>
            <h2>Products</h2>
            <p className="dashboard-subtitle">
              Manage your inventory products
            </p>

            <section className="product-form-section">
              <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>

              <form onSubmit={handleProductSubmit}>
                <div className="product-form-grid">
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>SKU *</label>
                    <input
                      name="sku"
                      value={form.sku}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      min="0"
                      value={form.quantity}
                      onChange={handleFormChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Cost Price</label>
                    <input
                      type="number"
                      name="cost_price"
                      min="0"
                      step="0.01"
                      value={form.cost_price}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Selling Price</label>
                    <input
                      type="number"
                      name="selling_price"
                      min="0"
                      step="0.01"
                      value={form.selling_price}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Low Stock Threshold</label>
                    <input
                      type="number"
                      name="low_stock_threshold"
                      min="0"
                      value={form.low_stock_threshold}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  <button type="submit">
                    {editingId ? "Update Product" : "Add Product"}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyForm);
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            {productMessage && (
              <p className="product-message">{productMessage}</p>
            )}

            <section className="products-list-section">
              <div className="products-list-header">
                <h3>Product List</h3>

                <input
                  type="text"
                  placeholder="Search by name or SKU"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadProducts(search);
                  }}
                />

                <button onClick={() => loadProducts(search)}>
                  Search
                </button>

                <button
                  className="cancel-button"
                  onClick={() => {
                    setSearch("");
                    loadProducts("");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Low Stock</th>
                      <th>Selling Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>{product.quantity}</td>
                        <td>
                          {product.low_stock_threshold !== null &&
                          product.quantity <= product.low_stock_threshold
                            ? "Low Stock"
                            : "Normal"}
                        </td>
                        <td>
                          {product.selling_price === null
                            ? "-"
                            : `₹${product.selling_price}`}
                        </td>
                        <td>
                          <button
                            className="edit-button"
                            onClick={() => handleEdit(product)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() => handleDelete(product.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    {products.length === 0 && (
                      <tr>
                        <td colSpan="6">No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
