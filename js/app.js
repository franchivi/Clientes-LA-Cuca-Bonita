/**
 * La Cuca Bonita - Customer Management Mobile Web App
 * Core Application Logic & Data Management
 */

// Initial Sample Data for La Cuca Bonita
const SAMPLE_CLIENTS = [
  {
    id: "c-1710000000001",
    nombre: "María Elena García",
    direccion: "Calle Mayor 14, 2ºB, Madrid",
    telefono: "+34 612 345 678",
    email: "maria.garcia@email.com",
    instagram: "@maria_elena_g",
    pedido: "1x Vestido Floral Rosa (Talla M), 1x Bolso Artesanal Cuero",
    estado: "en_proceso",
    fechaCreacion: "2026-07-20T10:30:00.000Z"
  },
  {
    id: "c-1710000000002",
    nombre: "Lucía Fernández",
    direccion: "Avenida de la Constitución 45, Sevilla",
    telefono: "+34 689 112 233",
    email: "lucia.fer@gmail.com",
    instagram: "@lucia_fdz",
    pedido: "2x Pendientes Dorados Sol, 1x Collar Perlas Dulces",
    estado: "pendiente",
    fechaCreacion: "2026-07-22T15:45:00.000Z"
  },
  {
    id: "c-1710000000003",
    nombre: "Carmen Ortiz",
    direccion: "Paseo de Gracia 88, Barcelona",
    telefono: "+34 655 987 654",
    email: "carmen.ortiz@hotmail.com",
    instagram: "@carmen_ortiz_mode",
    pedido: "1x Blusa Seda Blanca, 1x Sombrero Verano Cuca",
    estado: "entregado",
    fechaCreacion: "2026-07-15T09:15:00.000Z"
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

  // Load clients from localStorage or insert sample data
  loadClients() {
    const stored = localStorage.getItem("lacucabonita_clients");
    if (stored) {
      try {
        this.clients = JSON.parse(stored);
      } catch (e) {
        console.error("Error parsing stored clients, initializing sample data", e);
        this.clients = [...SAMPLE_CLIENTS];
        this.saveClients();
      }
    } else {
      this.clients = [...SAMPLE_CLIENTS];
      this.saveClients();
    }
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

  // Formatting and Helpers
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

    // Form Submission
    const clientForm = document.getElementById("clientForm");
    if (clientForm) {
      clientForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveClientFromForm();
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
      // Filter by status
      if (this.currentFilter !== "todos" && client.estado !== this.currentFilter) {
        return false;
      }
      // Search query
      if (this.searchQuery) {
        const q = this.searchQuery;
        const matchName = client.nombre.toLowerCase().includes(q);
        const matchAddress = (client.direccion || "").toLowerCase().includes(q);
        const matchPhone = (client.telefono || "").toLowerCase().includes(q);
        const matchEmail = (client.email || "").toLowerCase().includes(q);
        const matchIg = (client.instagram || "").toLowerCase().includes(q);
        const matchOrder = (client.pedido || "").toLowerCase().includes(q);

        return matchName || matchAddress || matchPhone || matchEmail || matchIg || matchOrder;
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
            ${this.getStatusBadge(client.estado)}
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

            ${client.pedido ? `
              <div class="order-box">
                <div class="order-label"><i class="ri-shopping-bag-3-line"></i> Pedido:</div>
                <div>${this.escapeHtml(client.pedido)}</div>
              </div>
            ` : ''}
          </div>

          <div class="card-actions">
            ${cleanPhoneNum ? `
              <a href="${waUrl}" target="_blank" class="action-btn whatsapp" title="WhatsApp">
                <i class="ri-whatsapp-line"></i> WhatsApp
              </a>
              <a href="tel:${cleanPhoneNum}" class="action-btn call" title="Llamar">
                <i class="ri-phone-fill"></i> Llamar
              </a>
            ` : ''}
            
            ${client.direccion ? `
              <a href="${mapsUrl}" target="_blank" class="action-btn maps" title="Ver en Mapa">
                <i class="ri-map-pin-2-fill"></i> Mapa
              </a>
            ` : ''}

            <button class="action-btn details" onclick="app.openDetailModal('${client.id}')">
              <i class="ri-more-fill"></i> Ver
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
    if (activeEl) {
      const activeCount = this.clients.filter(c => c.estado === 'pendiente' || c.estado === 'en_proceso').length;
      activeEl.textContent = activeCount;
    }
    if (completedEl) {
      const completedCount = this.clients.filter(c => c.estado === 'entregado').length;
      completedEl.textContent = completedCount;
    }
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
      document.body.style.overflow = "";
    }
  }

  openFormModal(clientId = null) {
    this.editingClientId = clientId;
    const form = document.getElementById("clientForm");
    const titleEl = document.getElementById("formModalTitle");

    if (!form) return;
    form.reset();

    if (clientId) {
      const client = this.clients.find(c => c.id === clientId);
      if (client) {
        titleEl.innerHTML = `<i class="ri-edit-line"></i> Editar Cliente`;
        document.getElementById("inputNombre").value = client.nombre || "";
        document.getElementById("inputDireccion").value = client.direccion || "";
        document.getElementById("inputTelefono").value = client.telefono || "";
        document.getElementById("inputEmail").value = client.email || "";
        document.getElementById("inputInstagram").value = client.instagram || "";
        document.getElementById("inputPedido").value = client.pedido || "";
        document.getElementById("inputEstado").value = client.estado || "pendiente";
      }
    } else {
      titleEl.innerHTML = `<i class="ri-user-add-line"></i> Nuevo Cliente`;
    }

    this.openModal("formModal");
  }

  saveClientFromForm() {
    const nombre = document.getElementById("inputNombre").value.trim();
    const direccion = document.getElementById("inputDireccion").value.trim();
    const telefono = document.getElementById("inputTelefono").value.trim();
    const email = document.getElementById("inputEmail").value.trim();
    const instagram = document.getElementById("inputInstagram").value.trim();
    const pedido = document.getElementById("inputPedido").value.trim();
    const estado = document.getElementById("inputEstado").value;

    if (!nombre) {
      this.showToast("El Nombre Completo es obligatorio");
      return;
    }

    if (this.editingClientId) {
      // Edit existing
      const index = this.clients.findIndex(c => c.id === this.editingClientId);
      if (index !== -1) {
        this.clients[index] = {
          ...this.clients[index],
          nombre,
          direccion,
          telefono,
          email,
          instagram,
          pedido,
          estado,
          fechaActualizacion: new Date().toISOString()
        };
        this.showToast("Cliente actualizado correctamente");
      }
    } else {
      // Add new
      const newClient = {
        id: "c-" + Date.now(),
        nombre,
        direccion,
        telefono,
        email,
        instagram,
        pedido,
        estado,
        fechaCreacion: new Date().toISOString()
      };
      this.clients.unshift(newClient);
      this.showToast("Cliente añadido con éxito");
    }

    this.saveClients();
    this.closeModal(document.getElementById("formModal"));
    this.render();
  }

  openDetailModal(clientId) {
    this.viewingClientId = clientId;
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return;

    const detailContainer = document.getElementById("detailModalContent");
    const cleanPhoneNum = this.cleanPhone(client.telefono);
    const cleanIg = this.cleanInstagram(client.instagram);
    const initials = this.getInitials(client.nombre);

    const waUrl = cleanPhoneNum ? `https://wa.me/${cleanPhoneNum.replace('+', '')}` : '#';
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.direccion || '')}`;
    const mailUrl = client.email ? `mailto:${client.email}` : '#';
    const igUrl = cleanIg ? `https://instagram.com/${cleanIg}` : '#';

    detailContainer.innerHTML = `
      <div class="detail-header-card">
        <div class="detail-avatar">${initials}</div>
        <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 4px;">${this.escapeHtml(client.nombre)}</h2>
        <div style="margin-bottom: 12px;">${this.getStatusBadge(client.estado)}</div>
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

      <div class="card-details" style="font-size: 0.95rem; gap: 14px; padding-top: 0; border: none;">
        <div class="detail-row">
          <i class="ri-user-3-line" style="font-size: 18px;"></i>
          <div>
            <div class="order-label">Nombre Completo</div>
            <div class="detail-text">${this.escapeHtml(client.nombre)}</div>
          </div>
        </div>

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

        ${client.pedido ? `
          <div class="order-box" style="margin-top: 6px; padding: 14px;">
            <div class="order-label" style="font-size: 0.8rem;"><i class="ri-shopping-bag-3-line"></i> Detalles del Pedido</div>
            <div style="white-space: pre-line; margin-top: 6px; font-weight: 500;">${this.escapeHtml(client.pedido)}</div>
          </div>
        ` : ''}
      </div>

      <div class="form-actions" style="margin-top: 24px; border-top: 1px solid var(--border-color); padding-top: 16px;">
        <button class="btn btn-danger" onclick="app.deleteClient('${client.id}')">
          <i class="ri-delete-bin-line"></i> Eliminar
        </button>
        <button class="btn btn-secondary" onclick="app.closeModal(document.getElementById('detailModal'))">Cerrar</button>
        <button class="btn btn-primary" onclick="app.openFormFromDetail('${client.id}')">
          <i class="ri-edit-line"></i> Editar
        </button>
      </div>
    `;

    this.openModal("detailModal");
  }

  openFormFromDetail(clientId) {
    this.closeModal(document.getElementById("detailModal"));
    setTimeout(() => this.openFormModal(clientId), 150);
  }

  deleteClient(clientId) {
    if (confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
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

    const headers = ["Nombre Completo", "Dirección", "Teléfono", "Email", "Instagram", "Pedido", "Estado", "Fecha Creación"];
    const rows = this.clients.map(c => [
      `"${(c.nombre || '').replace(/"/g, '""')}"`,
      `"${(c.direccion || '').replace(/"/g, '""')}"`,
      `"${(c.telefono || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.instagram || '').replace(/"/g, '""')}"`,
      `"${(c.pedido || '').replace(/"/g, '""')}"`,
      `"${(c.estado || '').replace(/"/g, '""')}"`,
      `"${c.fechaCreacion || ''}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    const fileName = `Clientes_LaCucaBonita_${new Date().toISOString().slice(0, 10)}.csv`;

    downloadAnchor.setAttribute("href", url);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast("Excel/CSV exportado correctamente");
  }

  importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          this.clients = imported;
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
