/**
 * La Cuca Bonita - Customer Management Mobile Web App
 * Core Application Logic & Data Management (Multi-Order & History Support)
 */

// Initial Sample Data for La Cuca Bonita with Multi-Orders History
const SAMPLE_CLIENTS = [
  {
    id: "c-1710000000001",
    nombre: "María Elena García",
    direccion: "Calle Mayor 14, 2ºB, Madrid",
    telefono: "+34 612 345 678",
    email: "maria.garcia@email.com",
    instagram: "@maria_elena_g",
    fechaCreacion: "2026-07-20T10:30:00.000Z",
    pedidos: [
      {
        id: "p-1710000000001-1",
        descripcion: "1x Vestido Floral Rosa (Talla M), 1x Bolso Artesanal Cuero",
        monto: 85.00,
        estado: "en_proceso",
        fecha: "2026-07-20T10:30:00.000Z",
        notas: "Entregar preferiblemente por las tardes"
      },
      {
        id: "p-1710000000001-2",
        descripcion: "2x Pendientes Dorados Sol",
        monto: 24.50,
        estado: "entregado",
        fecha: "2026-07-05T14:20:00.000Z",
        notas: "Pagado por Bizum"
      }
    ]
  },
  {
    id: "c-1710000000002",
    nombre: "Lucía Fernández",
    direccion: "Avenida de la Constitución 45, Sevilla",
    telefono: "+34 689 112 233",
    email: "lucia.fer@gmail.com",
    instagram: "@lucia_fdz",
    fechaCreacion: "2026-07-22T15:45:00.000Z",
    pedidos: [
      {
        id: "p-1710000000002-1",
        descripcion: "2x Pendientes Dorados Sol, 1x Collar Perlas Dulces",
        monto: 49.90,
        estado: "pendiente",
        fecha: "2026-07-22T15:45:00.000Z",
        notas: "Empaquetar para regalo de cumpleaños"
      }
    ]
  },
  {
    id: "c-1710000000003",
    nombre: "Carmen Ortiz",
    direccion: "Paseo de Gracia 88, Barcelona",
    telefono: "+34 655 987 654",
    email: "carmen.ortiz@hotmail.com",
    instagram: "@carmen_ortiz_mode",
    fechaCreacion: "2026-07-15T09:15:00.000Z",
    pedidos: [
      {
        id: "p-1710000000003-1",
        descripcion: "1x Blusa Seda Blanca, 1x Sombrero Verano Cuca",
        monto: 110.00,
        estado: "entregado",
        fecha: "2026-07-15T09:15:00.000Z",
        notas: "Cliente VIP"
      }
    ]
  }
];

class AppManager {
  constructor() {
    this.clients = [];
    this.currentFilter = "todos";
    this.searchQuery = "";
    this.editingClientId = null;
    this.viewingClientId = null;

    this.init();
  }

  init() {
    this.loadClients();
    this.loadThemePreference();
    this.bindEvents();
    this.render();
  }

  // Backward compatibility migration helper
  normalizeClient(client) {
    if (!client) return client;
    if (!client.pedidos || !Array.isArray(client.pedidos)) {
      client.pedidos = [];
      if (client.pedido || client.estado) {
        client.pedidos.push({
          id: "p-" + (client.id || Date.now()) + "-1",
          descripcion: client.pedido || "Pedido inicial",
          monto: null,
          estado: client.estado || "pendiente",
          fecha: client.fechaCreacion || new Date().toISOString(),
          notas: ""
        });
      }
    }
    return client;
  }

  // Load clients from localStorage or initialize sample data
  loadClients() {
    const stored = localStorage.getItem("lacucabonita_clients");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.clients = parsed.map(c => this.normalizeClient(c));
        } else {
          this.clients = SAMPLE_CLIENTS.map(c => this.normalizeClient(c));
        }
      } catch (e) {
        console.error("Error parsing stored clients, initializing sample data", e);
        this.clients = SAMPLE_CLIENTS.map(c => this.normalizeClient(c));
      }
    } else {
      this.clients = SAMPLE_CLIENTS.map(c => this.normalizeClient(c));
    }
    this.saveClients();
  }

  saveClients() {
    localStorage.setItem("lacucabonita_clients", JSON.stringify(this.clients));
    this.updateStats();
  }

  // Theme Management
  loadThemePreference() {
    const savedTheme = localStorage.getItem("lacucabonita_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("lacucabonita_theme", newTheme);
    this.updateThemeIcon(newTheme);
    this.showToast(`Modo ${newTheme === "dark" ? "Oscuro" : "Claro"} activado`);
  }

  updateThemeIcon(theme) {
    const icon = document.getElementById("themeToggleIcon");
    if (icon) {
      icon.className = theme === "dark" ? "ri-sun-line" : "ri-moon-line";
    }
  }

  // Helpers
  cleanPhone(phone) {
    if (!phone) return "";
    return phone.replace(/[^\d+]/g, "");
  }

  cleanInstagram(handle) {
    if (!handle) return "";
    let clean = handle.trim();
    if (clean.startsWith("@")) clean = clean.substring(1);
    if (clean.includes("instagram.com/")) {
      clean = clean.split("instagram.com/")[1].replace(/\//g, "");
    }
    return clean;
  }

  getInitials(name) {
    if (!name) return "CB";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  getStatusBadge(status) {
    const labelMap = {
      pendiente: "Pendiente",
      en_proceso: "En Proceso",
      entregado: "Entregado",
      cancelado: "Cancelado"
    };
    const label = labelMap[status] || "Pendiente";
    return `<span class="badge badge-${status}">${label}</span>`;
  }

  formatDate(isoString) {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return isoString;
    }
  }

  formatCurrency(amount) {
    if (amount === null || amount === undefined || amount === "") return "";
    const num = parseFloat(amount);
    if (isNaN(num)) return "";
    return num.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
  }

  getClientOverallStatus(client) {
    if (!client.pedidos || client.pedidos.length === 0) return "sin_pedidos";
    // Check priority: pendiente > en_proceso > entregado > cancelado
    if (client.pedidos.some(p => p.estado === "pendiente")) return "pendiente";
    if (client.pedidos.some(p => p.estado === "en_proceso")) return "en_proceso";
    if (client.pedidos.some(p => p.estado === "entregado")) return "entregado";
    return "cancelado";
  }

  // Event Listeners
  bindEvents() {
    // Search input
    const searchInput = document.getElementById("searchInput");
    const clearSearchBtn = document.getElementById("clearSearchBtn");
    
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle("visible", this.searchQuery.length > 0);
        }
        this.render();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        this.searchQuery = "";
        clearSearchBtn.classList.remove("visible");
        this.render();
      });
    }

    // Filter Chips
    const chips = document.querySelectorAll(".chip");
    chips.forEach(chip => {
      chip.addEventListener("click", (e) => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        this.currentFilter = chip.dataset.filter;
        this.render();
      });
    });

    // Theme Toggle
    const themeBtn = document.getElementById("themeToggleBtn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => this.toggleTheme());
    }

    // Modal Trigger Buttons
    const addBtn = document.getElementById("addClientBtn");
    const navAddBtn = document.getElementById("navAddBtn");
    if (addBtn) addBtn.addEventListener("click", () => this.openFormModal());
    if (navAddBtn) navAddBtn.addEventListener("click", () => this.openFormModal());

    const backupBtn = document.getElementById("backupBtn");
    const navBackupBtn = document.getElementById("navBackupBtn");
    if (backupBtn) backupBtn.addEventListener("click", () => this.openBackupModal());
    if (navBackupBtn) navBackupBtn.addEventListener("click", () => this.openBackupModal());

    // Client Form Submission
    const clientForm = document.getElementById("clientForm");
    if (clientForm) {
      clientForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveClientFromForm();
      });
    }

    // Order Form Submission
    const orderForm = document.getElementById("orderForm");
    if (orderForm) {
      orderForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveOrderFromForm();
      });
    }

    // Close Modals
    document.querySelectorAll(".modal-close-btn, .modal-cancel-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal-backdrop");
        if (modal) this.closeModal(modal);
      });
    });

    // Backup actions
    const exportJsonBtn = document.getElementById("exportJsonBtn");
    const exportCsvBtn = document.getElementById("exportCsvBtn");
    const importFileInput = document.getElementById("importFileInput");
    const cloudSyncSaveBtn = document.getElementById("cloudSyncSaveBtn");

    if (exportJsonBtn) exportJsonBtn.addEventListener("click", () => this.exportJSON());
    if (exportCsvBtn) exportCsvBtn.addEventListener("click", () => this.exportCSV());
    if (importFileInput) {
      importFileInput.addEventListener("change", (e) => this.importJSON(e));
    }
    if (cloudSyncSaveBtn) {
      cloudSyncSaveBtn.addEventListener("click", () => this.handleCloudSync());
    }

    // Modal backdrop click
    document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          this.closeModal(backdrop);
        }
      });
    });
  }

  // Filtered Clients List
  getFilteredClients() {
    return this.clients.filter(client => {
      // Filter by status: client matches if at least one of their orders matches the filter
      if (this.currentFilter !== "todos") {
        if (!client.pedidos || !client.pedidos.some(p => p.estado === this.currentFilter)) {
          return false;
        }
      }

      // Search query: search client info AND order descriptions/notes
      if (this.searchQuery) {
        const q = this.searchQuery;
        const matchName = client.nombre.toLowerCase().includes(q);
        const matchAddress = (client.direccion || "").toLowerCase().includes(q);
        const matchPhone = (client.telefono || "").toLowerCase().includes(q);
        const matchEmail = (client.email || "").toLowerCase().includes(q);
        const matchIg = (client.instagram || "").toLowerCase().includes(q);
        const matchOrders = client.pedidos && client.pedidos.some(p => 
          (p.descripcion || "").toLowerCase().includes(q) || 
          (p.notas || "").toLowerCase().includes(q)
        );

        return matchName || matchAddress || matchPhone || matchEmail || matchIg || matchOrders;
      }
      return true;
    });
  }

  // Render main client grid
  render() {
    const grid = document.getElementById("customerGrid");
    if (!grid) return;

    const filtered = this.getFilteredClients();
    this.updateStats();

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="ri-user-search-line"></i></div>
          <h3 class="empty-title">No se encontraron clientes</h3>
          <p class="empty-desc">Intenta ajustar tu búsqueda o añade un nuevo cliente.</p>
          <button class="btn btn-primary" onclick="app.openFormModal()">
            <i class="ri-user-add-line"></i> Añadir Cliente
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(client => {
      const cleanPhoneNum = this.cleanPhone(client.telefono);
      const cleanIg = this.cleanInstagram(client.instagram);
      const initials = this.getInitials(client.nombre);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.direccion || '')}`;
      const waUrl = cleanPhoneNum ? `https://wa.me/${cleanPhoneNum.replace('+', '')}` : '#';

      const ordersCount = client.pedidos ? client.pedidos.length : 0;
      const latestOrder = ordersCount > 0 ? client.pedidos[0] : null;
      const overallStatus = this.getClientOverallStatus(client);

      return `
        <div class="customer-card">
          <div class="card-header">
            <div class="avatar-info">
              <div class="avatar">${initials}</div>
              <div class="customer-name-box">
                <span class="customer-name">${this.escapeHtml(client.nombre)}</span>
                ${cleanIg ? `
                  <a href="https://instagram.com/${cleanIg}" target="_blank" class="customer-instagram">
                    <i class="ri-instagram-line"></i> @${cleanIg}
                  </a>
                ` : ''}
              </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
              ${this.getStatusBadge(overallStatus)}
              <span class="orders-count-pill"><i class="ri-shopping-bag-3-line"></i> ${ordersCount} ${ordersCount === 1 ? 'pedido' : 'pedidos'}</span>
            </div>
          </div>

          <div class="card-details">
            ${client.telefono ? `
              <div class="detail-row">
                <i class="ri-phone-line"></i>
                <span class="detail-text">${this.escapeHtml(client.telefono)}</span>
              </div>
            ` : ''}

            ${client.direccion ? `
              <div class="detail-row">
                <i class="ri-map-pin-line"></i>
                <span class="detail-text">${this.escapeHtml(client.direccion)}</span>
              </div>
            ` : ''}

            ${latestOrder ? `
              <div class="orders-summary-box">
                <div class="orders-summary-top">
                  <span class="orders-tag-count">Último Pedido</span>
                  ${latestOrder.monto ? `<span class="order-item-amount">${this.formatCurrency(latestOrder.monto)}</span>` : ''}
                </div>
                <div style="font-size: 0.85rem; font-weight: 500;">${this.escapeHtml(latestOrder.descripcion)}</div>
              </div>
            ` : `
              <div class="orders-summary-box" style="border-left-color: var(--border-color); color: var(--text-muted); font-style: italic;">
                Sin pedidos registrados aún
              </div>
            `}
          </div>

          <div class="card-actions">
            ${cleanPhoneNum ? `
              <a href="${waUrl}" target="_blank" class="action-btn whatsapp" title="WhatsApp">
                <i class="ri-whatsapp-line"></i>
              </a>
              <a href="tel:${cleanPhoneNum}" class="action-btn call" title="Llamar">
                <i class="ri-phone-fill"></i>
              </a>
            ` : ''}
            
            ${client.direccion ? `
              <a href="${mapsUrl}" target="_blank" class="action-btn maps" title="Ver en Mapa">
                <i class="ri-map-pin-2-fill"></i>
              </a>
            ` : ''}

            <button class="action-btn details" onclick="app.openDetailModal('${client.id}')">
              <i class="ri-history-line"></i> Ficha e Historial
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  updateStats() {
    const totalEl = document.getElementById("statTotal");
    const activeEl = document.getElementById("statActive");
    const completedEl = document.getElementById("statCompleted");

    if (totalEl) totalEl.textContent = this.clients.length;
    
    let activeOrders = 0;
    let completedOrders = 0;

    this.clients.forEach(c => {
      if (c.pedidos) {
        c.pedidos.forEach(p => {
          if (p.estado === 'pendiente' || p.estado === 'en_proceso') activeOrders++;
          if (p.estado === 'entregado') completedOrders++;
        });
      }
    });

    if (activeEl) activeEl.textContent = activeOrders;
    if (completedEl) completedEl.textContent = completedOrders;
  }

  // Modals Management
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.remove("active");
      const activeModals = document.querySelectorAll(".modal-backdrop.active");
      if (activeModals.length === 0) {
        document.body.style.overflow = "";
      }
    }
  }

  openFormModal(clientId = null) {
    this.editingClientId = clientId;
    const form = document.getElementById("clientForm");
    const titleEl = document.getElementById("formModalTitle");

    const initialOrderGroup = document.getElementById("initialOrderGroup");
    const initialOrderMontoGroup = document.getElementById("initialOrderMontoGroup");
    const initialOrderEstadoGroup = document.getElementById("initialOrderEstadoGroup");

    if (!form) return;
    form.reset();

    if (clientId) {
      // Editing existing client profile
      const client = this.clients.find(c => c.id === clientId);
      if (client) {
        titleEl.innerHTML = `<i class="ri-edit-line"></i> Editar Cliente`;
        document.getElementById("inputNombre").value = client.nombre || "";
        document.getElementById("inputDireccion").value = client.direccion || "";
        document.getElementById("inputTelefono").value = client.telefono || "";
        document.getElementById("inputEmail").value = client.email || "";
        document.getElementById("inputInstagram").value = client.instagram || "";
      }
      // Hide initial order creation when editing client profile (orders managed in history view)
      if (initialOrderGroup) initialOrderGroup.style.display = "none";
      if (initialOrderMontoGroup) initialOrderMontoGroup.style.display = "none";
      if (initialOrderEstadoGroup) initialOrderEstadoGroup.style.display = "none";
    } else {
      // Adding new client
      titleEl.innerHTML = `<i class="ri-user-add-line"></i> Nuevo Cliente`;
      if (initialOrderGroup) initialOrderGroup.style.display = "block";
      if (initialOrderMontoGroup) initialOrderMontoGroup.style.display = "block";
      if (initialOrderEstadoGroup) initialOrderEstadoGroup.style.display = "block";
    }

    this.openModal("formModal");
  }

  saveClientFromForm() {
    const nombre = document.getElementById("inputNombre").value.trim();
    const direccion = document.getElementById("inputDireccion").value.trim();
    const telefono = document.getElementById("inputTelefono").value.trim();
    const email = document.getElementById("inputEmail").value.trim();
    const instagram = document.getElementById("inputInstagram").value.trim();

    if (!nombre) {
      this.showToast("El Nombre Completo es obligatorio");
      return;
    }

    if (this.editingClientId) {
      // Edit existing client info
      const index = this.clients.findIndex(c => c.id === this.editingClientId);
      if (index !== -1) {
        this.clients[index] = {
          ...this.clients[index],
          nombre,
          direccion,
          telefono,
          email,
          instagram,
          fechaActualizacion: new Date().toISOString()
        };
        this.showToast("Cliente actualizado correctamente");
      }
    } else {
      // Add new client
      const initialPedidoText = document.getElementById("inputPedido") ? document.getElementById("inputPedido").value.trim() : "";
      const initialMonto = document.getElementById("inputMonto") ? document.getElementById("inputMonto").value : "";
      const initialEstado = document.getElementById("inputEstado") ? document.getElementById("inputEstado").value : "pendiente";

      const newClientId = "c-" + Date.now();
      const initialPedidos = [];

      if (initialPedidoText) {
        initialPedidos.push({
          id: "p-" + Date.now() + "-1",
          descripcion: initialPedidoText,
          monto: initialMonto ? parseFloat(initialMonto) : null,
          estado: initialEstado,
          fecha: new Date().toISOString(),
          notas: ""
        });
      }

      const newClient = {
        id: newClientId,
        nombre,
        direccion,
        telefono,
        email,
        instagram,
        fechaCreacion: new Date().toISOString(),
        pedidos: initialPedidos
      };

      this.clients.unshift(newClient);
      this.showToast("Cliente añadido con éxito");
    }

    this.saveClients();
    this.closeModal(document.getElementById("formModal"));
    this.render();
  }

  // Detail Modal (Ficha del Cliente & Historial de Pedidos)
  openDetailModal(clientId) {
    this.viewingClientId = clientId;
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

    this.normalizeClient(client);

    const detailContainer = document.getElementById("detailModalContent");
    const cleanPhoneNum = this.cleanPhone(client.telefono);
    const cleanIg = this.cleanInstagram(client.instagram);
    const initials = this.getInitials(client.nombre);

    const waUrl = cleanPhoneNum ? `https://wa.me/${cleanPhoneNum.replace('+', '')}` : '#';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.direccion || '')}`;
    const mailUrl = client.email ? `mailto:${client.email}` : '#';
    const igUrl = cleanIg ? `https://instagram.com/${cleanIg}` : '#';

    const overallStatus = this.getClientOverallStatus(client);
    const ordersCount = client.pedidos ? client.pedidos.length : 0;

    // Render Order Timeline HTML
    let ordersHtml = "";
    if (ordersCount === 0) {
      ordersHtml = `
        <div style="text-align: center; padding: 20px 10px; color: var(--text-muted); font-size: 0.9rem;">
          <i class="ri-shopping-bag-line" style="font-size: 28px; color: var(--primary-color); display: block; margin-bottom: 6px;"></i>
          No hay pedidos registrados en el historial de este cliente.
        </div>
      `;
    } else {
      ordersHtml = client.pedidos.map(p => {
        return `
          <div class="order-item-card">
            <div class="order-item-header">
              <span class="order-date-badge">
                <i class="ri-calendar-event-line"></i> ${this.formatDate(p.fecha)}
              </span>
              ${p.monto ? `<span class="order-item-amount">${this.formatCurrency(p.monto)}</span>` : ''}
            </div>

            <div class="order-item-desc">${this.escapeHtml(p.descripcion)}</div>

            ${p.notas ? `<div class="order-item-notes"><i class="ri-sticky-note-line"></i> ${this.escapeHtml(p.notas)}</div>` : ''}

            <div class="order-item-footer">
              <select class="order-status-select" onchange="app.updateOrderStatusInline('${client.id}', '${p.id}', this.value)">
                <option value="pendiente" ${p.estado === 'pendiente' ? 'selected' : ''}>🟡 Pendiente</option>
                <option value="en_proceso" ${p.estado === 'en_proceso' ? 'selected' : ''}>🔵 En Proceso</option>
                <option value="entregado" ${p.estado === 'entregado' ? 'selected' : ''}>🟢 Entregado</option>
                <option value="cancelado" ${p.estado === 'cancelado' ? 'selected' : ''}>⚪ Cancelado</option>
              </select>

              <div class="order-item-actions">
                <button class="btn-icon-sm" onclick="app.openOrderForm('${client.id}', '${p.id}')" title="Editar Pedido">
                  <i class="ri-edit-line"></i>
                </button>
                <button class="btn-icon-sm delete" onclick="app.deleteOrder('${client.id}', '${p.id}')" title="Eliminar Pedido">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }

    detailContainer.innerHTML = `
      <div class="detail-header-card">
        <div class="detail-avatar">${initials}</div>
        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">${this.escapeHtml(client.nombre)}</h2>
        <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;">
          ${this.getStatusBadge(overallStatus)}
          <span class="orders-count-pill">${ordersCount} ${ordersCount === 1 ? 'pedido' : 'pedidos'}</span>
        </div>
      </div>

      <div class="detail-actions-grid">
        ${cleanPhoneNum ? `
          <a href="${waUrl}" target="_blank" class="action-card-btn wa">
            <i class="ri-whatsapp-line"></i> WhatsApp
          </a>
          <a href="tel:${cleanPhoneNum}" class="action-card-btn call">
            <i class="ri-phone-fill"></i> Llamar
          </a>
        ` : ''}
        ${cleanIg ? `
          <a href="${igUrl}" target="_blank" class="action-card-btn ig">
            <i class="ri-instagram-line"></i> Instagram
          </a>
        ` : ''}
        ${client.direccion ? `
          <a href="${mapsUrl}" target="_blank" class="action-card-btn map">
            <i class="ri-map-pin-2-fill"></i> Ubicación
          </a>
        ` : ''}
      </div>

      <div class="card-details" style="font-size: 0.95rem; gap: 12px; padding-top: 0; border: none;">
        ${client.telefono ? `
          <div class="detail-row">
            <i class="ri-phone-line" style="font-size: 18px;"></i>
            <div>
              <div class="order-label">Teléfono</div>
              <div class="detail-text">${this.escapeHtml(client.telefono)}</div>
            </div>
          </div>
        ` : ''}

        ${client.email ? `
          <div class="detail-row">
            <i class="ri-mail-line" style="font-size: 18px;"></i>
            <div>
              <div class="order-label">Email</div>
              <a href="${mailUrl}" class="detail-text" style="color: var(--primary-color);">${this.escapeHtml(client.email)}</a>
            </div>
          </div>
        ` : ''}

        ${client.instagram ? `
          <div class="detail-row">
            <i class="ri-instagram-line" style="font-size: 18px;"></i>
            <div>
              <div class="order-label">Instagram</div>
              <a href="${igUrl}" target="_blank" class="detail-text" style="color: #e1306c;">${this.escapeHtml(client.instagram)}</a>
            </div>
          </div>
        ` : ''}

        ${client.direccion ? `
          <div class="detail-row">
            <i class="ri-map-pin-line" style="font-size: 18px;"></i>
            <div>
              <div class="order-label">Dirección Completa</div>
              <div class="detail-text">${this.escapeHtml(client.direccion)}</div>
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Historial de Pedidos Timeline Section -->
      <div class="orders-history-section">
        <div class="orders-history-header">
          <div class="orders-history-title">
            <i class="ri-history-line" style="color: var(--primary-color);"></i>
            Historial de Pedidos
          </div>
          <button class="btn btn-primary" onclick="app.openOrderForm('${client.id}')" style="padding: 6px 14px; font-size: 0.82rem;">
            <i class="ri-add-line"></i> Nuevo Pedido
          </button>
        </div>

        <div class="orders-timeline">
          ${ordersHtml}
        </div>
      </div>

      <div class="form-actions" style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
        <button class="btn btn-danger" onclick="app.deleteClient('${client.id}')">
          <i class="ri-delete-bin-line"></i> Eliminar
        </button>
        <button class="btn btn-secondary" onclick="app.closeModal(document.getElementById('detailModal'))">Cerrar</button>
        <button class="btn btn-primary" onclick="app.openFormFromDetail('${client.id}')">
          <i class="ri-edit-line"></i> Editar Datos
        </button>
      </div>
    `;

    this.openModal("detailModal");
  }

  // Individual Order Form Management (Add / Edit Order)
  openOrderForm(clientId, orderId = null) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

    document.getElementById("orderClientId").value = clientId;
    document.getElementById("orderId").value = orderId || "";

    const titleEl = document.getElementById("orderModalTitle");
    const descInput = document.getElementById("inputOrderDescripcion");
    const montoInput = document.getElementById("inputOrderMonto");
    const estadoSelect = document.getElementById("inputOrderEstado");
    const notasInput = document.getElementById("inputOrderNotas");

    if (orderId) {
      titleEl.innerHTML = `<i class="ri-edit-line"></i> Editar Pedido`;
      const order = client.pedidos ? client.pedidos.find(p => p.id === orderId) : null;
      if (order) {
        descInput.value = order.descripcion || "";
        montoInput.value = order.monto !== null && order.monto !== undefined ? order.monto : "";
        estadoSelect.value = order.estado || "pendiente";
        notasInput.value = order.notas || "";
      }
    } else {
      titleEl.innerHTML = `<i class="ri-shopping-bag-3-line"></i> Nuevo Pedido para ${this.escapeHtml(client.nombre)}`;
      descInput.value = "";
      montoInput.value = "";
      estadoSelect.value = "pendiente";
      notasInput.value = "";
    }

    this.openModal("orderModal");
  }

  saveOrderFromForm() {
    const clientId = document.getElementById("orderClientId").value;
    const orderId = document.getElementById("orderId").value;

    const descripcion = document.getElementById("inputOrderDescripcion").value.trim();
    const montoVal = document.getElementById("inputOrderMonto").value;
    const estado = document.getElementById("inputOrderEstado").value;
    const notas = document.getElementById("inputOrderNotas").value.trim();

    if (!descripcion) {
      this.showToast("La Descripción del pedido es obligatoria");
      return;
    }

    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

    if (!client.pedidos) client.pedidos = [];

    const monto = montoVal !== "" ? parseFloat(montoVal) : null;

    if (orderId) {
      // Edit existing order
      const orderIndex = client.pedidos.findIndex(p => p.id === orderId);
      if (orderIndex !== -1) {
        client.pedidos[orderIndex] = {
          ...client.pedidos[orderIndex],
          descripcion,
          monto,
          estado,
          notas
        };
        this.showToast("Pedido actualizado con éxito");
      }
    } else {
      // Add new order at top of history
      const newOrder = {
        id: "p-" + Date.now() + "-" + (client.pedidos.length + 1),
        descripcion,
        monto,
        estado,
        fecha: new Date().toISOString(),
        notas
      };
      client.pedidos.unshift(newOrder);
      this.showToast("Nuevo pedido registrado correctamente");
    }

    this.saveClients();
    this.closeModal(document.getElementById("orderModal"));
    
    // Refresh detail modal if open
    if (this.viewingClientId === clientId) {
      this.openDetailModal(clientId);
    }
    this.render();
  }

  updateOrderStatusInline(clientId, orderId, newStatus) {
    const client = this.clients.find(c => c.id === clientId);
    if (!client || !client.pedidos) return;

    const order = client.pedidos.find(p => p.id === orderId);
    if (order) {
      order.estado = newStatus;
      this.saveClients();
      this.showToast("Estado del pedido actualizado");
      this.render();
      if (this.viewingClientId === clientId) {
        this.openDetailModal(clientId);
      }
    }
  }

  deleteOrder(clientId, orderId) {
    if (confirm("¿Estás seguro de que deseas eliminar este pedido del historial?")) {
      const client = this.clients.find(c => c.id === clientId);
      if (!client || !client.pedidos) return;

      client.pedidos = client.pedidos.filter(p => p.id !== orderId);
      this.saveClients();
      this.showToast("Pedido eliminado");
      this.render();
      if (this.viewingClientId === clientId) {
        this.openDetailModal(clientId);
      }
    }
  }

  openFormFromDetail(clientId) {
    this.closeModal(document.getElementById("detailModal"));
    setTimeout(() => this.openFormModal(clientId), 150);
  }

  deleteClient(clientId) {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente y todo su historial de pedidos?")) {
      this.clients = this.clients.filter(c => c.id !== clientId);
      this.saveClients();
      this.closeModal(document.getElementById("detailModal"));
      this.render();
      this.showToast("Cliente eliminado");
    }
  }

  // Backup & Export/Import
  openBackupModal() {
    this.openModal("backupModal");
  }

  exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.clients, null, 2));
    const downloadAnchor = document.createElement("a");
    const fileName = `Clientes_LaCucaBonita_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast("Copia de seguridad en JSON descargada");
  }

  exportCSV() {
    if (this.clients.length === 0) {
      this.showToast("No hay clientes para exportar");
      return;
    }

    const headers = ["ID Cliente", "Nombre Completo", "Dirección", "Teléfono", "Email", "Instagram", "Total Pedidos", "ID Pedido", "Fecha Pedido", "Descripción Pedido", "Importe (€)", "Estado Pedido", "Notas Pedido"];
    
    const rows = [];

    this.clients.forEach(c => {
      if (c.pedidos && c.pedidos.length > 0) {
        c.pedidos.forEach(p => {
          rows.push([
            `"${(c.id || '').replace(/"/g, '""')}"`,
            `"${(c.nombre || '').replace(/"/g, '""')}"`,
            `"${(c.direccion || '').replace(/"/g, '""')}"`,
            `"${(c.telefono || '').replace(/"/g, '""')}"`,
            `"${(c.email || '').replace(/"/g, '""')}"`,
            `"${(c.instagram || '').replace(/"/g, '""')}"`,
            `"${c.pedidos.length}"`,
            `"${(p.id || '').replace(/"/g, '""')}"`,
            `"${(p.fecha || '').replace(/"/g, '""')}"`,
            `"${(p.descripcion || '').replace(/"/g, '""')}"`,
            `"${p.monto !== null && p.monto !== undefined ? p.monto : ''}"`,
            `"${(p.estado || '').replace(/"/g, '""')}"`,
            `"${(p.notas || '').replace(/"/g, '""')}"`
          ]);
        });
      } else {
        rows.push([
          `"${(c.id || '').replace(/"/g, '""')}"`,
          `"${(c.nombre || '').replace(/"/g, '""')}"`,
          `"${(c.direccion || '').replace(/"/g, '""')}"`,
          `"${(c.telefono || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          `"${(c.instagram || '').replace(/"/g, '""')}"`,
          `"0"`,
          `""`, `""`, `""`, `""`, `""`, `""`
        ]);
      }
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    const fileName = `Clientes_LaCucaBonita_Historial_${new Date().toISOString().slice(0, 10)}.csv`;

    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast("Excel/CSV con historial exportado");
  }

  importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          this.clients = imported.map(c => this.normalizeClient(c));
          this.saveClients();
          this.render();
          this.closeModal(document.getElementById("backupModal"));
          this.showToast(`¡${imported.length} clientes importados con éxito!`);
        } else {
          this.showToast("El archivo JSON no tiene un formato válido");
        }
      } catch (err) {
        console.error("Error importing JSON", err);
        this.showToast("Error al leer el archivo JSON");
      }
    };
    reader.readAsText(file);
  }

  handleCloudSync() {
    const keyInput = document.getElementById("cloudSyncKey");
    const syncKey = keyInput ? keyInput.value.trim() : "";
    if (!syncKey) {
      this.showToast("Introduce una clave para la sincronización");
      return;
    }
    localStorage.setItem("lacucabonita_synckey", syncKey);
    this.showToast(`Sincronización activada con la clave "${syncKey}"`);
  }

  // Toast Notification
  showToast(message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="ri-checkbox-circle-fill" style="color: var(--success-color);"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Global App Instance
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new AppManager();
});
