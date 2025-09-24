// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentUser = null;
        this.baseURL = '/api';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuth();
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.showPage(page);
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    this.closeSidebar();
                }
            });
        });

        // Sidebar toggle for mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
        }
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const sidebarToggle = document.getElementById('sidebarToggle');
            const isClickInsideSidebar = sidebar && sidebar.contains(e.target);
            const isClickOnToggle = sidebarToggle && sidebarToggle.contains(e.target);
            
            if (!isClickInsideSidebar && !isClickOnToggle && window.innerWidth <= 768) {
                this.closeSidebar();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeSidebar();
            }
        });

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Modal close handlers
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        // Event form
        const eventForm = document.getElementById('eventForm');
        if (eventForm) {
            eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
        }

        // Promo form
        const promoForm = document.getElementById('promoForm');
        if (promoForm) {
            promoForm.addEventListener('submit', (e) => this.handlePromoSubmit(e));
        }

        // User form
        const userForm = document.getElementById('userForm');
        if (userForm) {
            userForm.addEventListener('submit', (e) => this.handleUserSubmit(e));
        }
        
        // Point adjustment form
        const pointAdjustmentForm = document.getElementById('pointAdjustmentForm');
        if (pointAdjustmentForm) {
            pointAdjustmentForm.addEventListener('submit', (e) => this.handlePointAdjustmentSubmit(e));
        }
    }

    async checkAuth() {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            this.showLoginModal();
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success && data.user.role === 'admin') {
                this.currentUser = data.user;
                this.hideLoginModal();
                this.updateAdminInfo();
                this.loadDashboardData();
            } else {
                this.showLoginModal();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showLoginModal();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        this.showLoading();

        const formData = new FormData(e.target);
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (data.success && data.user.role === 'admin') {
                localStorage.setItem('admin_token', data.token);
                this.currentUser = data.user;
                this.hideLoginModal();
                this.updateAdminInfo();
                this.showToast('Login successful!', 'success');
                this.loadDashboardData();
            } else {
                this.showToast('Invalid credentials or insufficient permissions', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Login failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    logout() {
        localStorage.removeItem('admin_token');
        this.currentUser = null;
        this.showLoginModal();
        this.showToast('Logged out successfully', 'info');
    }

    updateAdminInfo() {
        const adminName = document.getElementById('adminName');
        const adminEmail = document.getElementById('adminEmail');
        
        if (adminName) adminName.textContent = this.currentUser.name;
        if (adminEmail) adminEmail.textContent = this.currentUser.email;
    }

    showPage(pageName) {
        // Update active navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

        // Show page content
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        document.getElementById(`${pageName}-page`).style.display = 'block';

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.capitalizeFirst(pageName);
        }

        // Load page-specific data
        this.loadPageData(pageName);
    }

    async loadPageData(pageName) {
        switch (pageName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'events':
                await this.loadEventsData();
                break;
            case 'users':
                await this.loadUsersData();
                break;
            case 'bookings':
                await this.loadBookingsData();
                break;
            case 'promos':
                await this.loadPromosData();
                break;
            case 'redemptions':
                // Initialize redemption management when page is loaded
                if (typeof initRedemptionManagement === 'function') {
                    initRedemptionManagement();
                }
                break;
        }
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`${this.baseURL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                this.updateDashboardStats(data.stats);
                this.updateRecentEvents(data.recentEvents);
                this.updateRecentBookings(data.recentBookings);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    updateDashboardStats(stats) {
        document.getElementById('totalEvents').textContent = stats.totalEvents;
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalBookings').textContent = stats.totalBookings;
        document.getElementById('totalRevenue').textContent = `Rp ${this.formatPrice(stats.totalRevenue)}`;
    }

    updateRecentEvents(events) {
        const container = document.getElementById('recentEventsList');
        if (!container) return;

        container.innerHTML = events.map(event => `
            <div class="event-item">
                <div class="event-info">
                    <h4>${event.title}</h4>
                    <p>${event.location}</p>
                    <small>${this.formatDate(event.start_date)}</small>
                </div>
                <span class="status-badge ${event.status}">${event.status}</span>
            </div>
        `).join('');
    }

    updateRecentBookings(bookings) {
        const container = document.getElementById('recentBookingsList');
        if (!container) return;

        container.innerHTML = bookings.length > 0 ? bookings.map(booking => `
            <div class="booking-item">
                <div class="booking-info">
                    <h4>${booking.user_name || 'Unknown User'}</h4>
                    <p>${booking.event_title || 'Unknown Event'}</p>
                    <small>Rp ${this.formatPrice(booking.total_price)}</small>
                </div>
                <span class="status-badge ${booking.booking_status}">${booking.booking_status}</span>
            </div>
        `).join('') : '<p style="text-align: center; color: #666;">No recent bookings</p>';
    }

    async loadEventsData() {
        try {
            const response = await fetch(`${this.baseURL}/events`);
            const data = await response.json();

            if (data.success) {
                this.updateEventsTable(data.events);
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    updateEventsTable(events) {
        const tbody = document.getElementById('eventsTableBody');
        if (!tbody) return;

        tbody.innerHTML = events.map(event => `
            <tr>
                <td>
                    <img src="${event.image_url}" alt="${event.title}" class="event-image-small">
                </td>
                <td>${event.title}</td>
                <td>${this.formatDate(event.start_date)}</td>
                <td>${event.location}</td>
                <td>Rp ${this.formatPrice(event.price)}</td>
                <td><span class="status-badge ${event.status}">${event.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="adminPanel.viewEventQRCode(${event.id})" class="btn-action btn-qr" title="View Event QR Code">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button class="btn btn-small btn-outline" onclick="adminPanel.editEvent(${event.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="adminPanel.deleteEvent(${event.id})" class="btn-action btn-delete" title="Delete Event">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update mobile cards
        this.updateEventsMobileCards(events);
    }
    
    updateEventsMobileCards(events) {
        const container = document.getElementById('eventsMobileContainer');
        if (!container) return;

        if (!events || events.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-calendar-alt" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No events found.
                </div>
            `;
            return;
        }

        container.innerHTML = events.map(event => `
            <div class="mobile-card">
                <div class="mobile-card-header">
                    <div>
                        <div class="mobile-card-title">${event.title}</div>
                        <div class="mobile-card-subtitle">${event.location}</div>
                    </div>
                    <img src="${event.image_url}" alt="${event.title}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
                </div>
                <div class="mobile-card-content">
                    <div class="mobile-card-field">
                        <label>Date</label>
                        <span>${this.formatDate(event.start_date)}</span>
                    </div>
                    <div class="mobile-card-field">
                        <label>Price</label>
                        <span>Rp ${this.formatPrice(event.price)}</span>
                    </div>
                    <div class="mobile-card-field">
                        <label>Status</label>
                        <span class="status-badge ${event.status}">${event.status}</span>
                    </div>
                </div>
                <div class="mobile-card-actions">
                    <button onclick="adminPanel.viewEventQRCode(${event.id})" class="btn-action btn-qr" title="View Event QR Code">
                        <i class="fas fa-qrcode"></i>
                    </button>
                    <button class="btn-action" onclick="adminPanel.editEvent(${event.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="adminPanel.deleteEvent(${event.id})" class="btn-action btn-delete" title="Delete Event">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadUsersData() {
        try {
            const response = await fetch(`${this.baseURL}/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                this.updateUsersTable(data.users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    updateUsersTable(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.3;"></i><br>
                        No users found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const isMainAdmin = user.email === 'admin@ikoot.com';
            const statusClass = user.status === 'active' ? 'active' : 'inactive';
            const roleClass = user.role === 'admin' ? 'active' : 'inactive';
            
            return `
                <tr>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="status-badge ${roleClass}">${user.role === 'admin' ? 'Admin' : 'Member'}</span></td>
                    <td><span class="status-badge ${statusClass}">${user.status || 'active'}</span></td>
                    <td><strong>${user.points || 0}</strong></td>
                    <td>${user.total_check_ins || 0}</td>
                    <td>${this.formatDate(user.created_at)}</td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="adminPanel.showPointAdjustmentModal(${user.id}, '${user.name}', ${user.points || 0})" class="btn-action btn-adjust-points" title="Adjust Points">
                                <i class="fas fa-coins"></i>
                            </button>
                            <button onclick="adminPanel.showPointHistoryModal(${user.id}, '${user.name}')" class="btn-action btn-point-history" title="Point History">
                                <i class="fas fa-history"></i>
                            </button>
                            <button onclick="adminPanel.editUser(${user.id})" class="btn-action btn-edit" title="Edit User">
                                <i class="fas fa-edit"></i>
                            </button>
                            ${!isMainAdmin ? `
                                <button onclick="adminPanel.toggleUserStatus(${user.id})" class="btn-action ${user.status === 'active' ? 'btn-delete' : 'btn-qr'}" title="${user.status === 'active' ? 'Deactivate' : 'Activate'} User">
                                    <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                                </button>
                                <button onclick="adminPanel.deleteUser(${user.id})" class="btn-action btn-delete" title="Delete User">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Update mobile cards
        this.updateUsersMobileCards(users);
    }
    
    updateUsersMobileCards(users) {
        const container = document.getElementById('usersMobileContainer');
        if (!container) return;

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No users found.
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(user => {
            const isMainAdmin = user.email === 'admin@ikoot.com';
            const statusClass = user.status === 'active' ? 'active' : 'inactive';
            const roleClass = user.role === 'admin' ? 'active' : 'inactive';
            
            return `
                <div class="mobile-card">
                    <div class="mobile-card-header">
                        <div>
                            <div class="mobile-card-title">${user.name}</div>
                            <div class="mobile-card-subtitle">${user.email}</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="status-badge ${roleClass}" style="font-size: 0.7rem;">${user.role === 'admin' ? 'Admin' : 'Member'}</span>
                            <span class="status-badge ${statusClass}" style="font-size: 0.7rem;">${user.status || 'active'}</span>
                        </div>
                    </div>
                    <div class="mobile-card-content">
                        <div class="mobile-card-field">
                            <label>Points</label>
                            <span><strong>${user.points || 0}</strong></span>
                        </div>
                        <div class="mobile-card-field">
                            <label>Check-ins</label>
                            <span>${user.total_check_ins || 0}</span>
                        </div>
                        <div class="mobile-card-field" style="grid-column: 1 / -1;">
                            <label>Joined</label>
                            <span>${this.formatDate(user.created_at)}</span>
                        </div>
                    </div>
                    <div class="mobile-card-actions">
                        <button onclick="adminPanel.showPointAdjustmentModal(${user.id}, '${user.name}', ${user.points || 0})" class="btn-action btn-adjust-points" title="Adjust Points">
                            <i class="fas fa-coins"></i> Points
                        </button>
                        <button onclick="adminPanel.showPointHistoryModal(${user.id}, '${user.name}')" class="btn-action btn-point-history" title="Point History">
                            <i class="fas fa-history"></i> History
                        </button>
                        <button onclick="adminPanel.editUser(${user.id})" class="btn-action btn-edit" title="Edit User">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${!isMainAdmin ? `
                            <button onclick="adminPanel.toggleUserStatus(${user.id})" class="btn-action ${user.status === 'active' ? 'btn-delete' : 'btn-qr'}" title="${user.status === 'active' ? 'Deactivate' : 'Activate'} User">
                                <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                            </button>
                            <button onclick="adminPanel.deleteUser(${user.id})" class="btn-action btn-delete" title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async loadBookingsData() {
        // Placeholder for bookings data
        const tbody = document.getElementById('bookingsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666;">No bookings found</td></tr>';
        
        // Update mobile cards
        this.updateBookingsMobileCards([]);
    }
    
    updateBookingsMobileCards(bookings) {
        const container = document.getElementById('bookingsMobileContainer');
        if (!container) return;

        if (!bookings || bookings.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-ticket-alt" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No bookings found.
                </div>
            `;
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="mobile-card">
                <div class="mobile-card-header">
                    <div>
                        <div class="mobile-card-title">${booking.reference || 'N/A'}</div>
                        <div class="mobile-card-subtitle">${booking.user_name || 'Unknown User'}</div>
                    </div>
                </div>
                <div class="mobile-card-content">
                    <div class="mobile-card-field">
                        <label>Event</label>
                        <span>${booking.event_title || 'Unknown Event'}</span>
                    </div>
                    <div class="mobile-card-field">
                        <label>Quantity</label>
                        <span>${booking.quantity || 1}</span>
                    </div>
                    <div class="mobile-card-field">
                        <label>Total Price</label>
                        <span>Rp ${this.formatPrice(booking.total_price || 0)}</span>
                    </div>
                    <div class="mobile-card-field">
                        <label>Status</label>
                        <span class="status-badge ${booking.status || 'pending'}">${booking.status || 'pending'}</span>
                    </div>
                    <div class="mobile-card-field" style="grid-column: 1 / -1;">
                        <label>Date</label>
                        <span>${this.formatDate(booking.created_at)}</span>
                    </div>
                </div>
                <div class="mobile-card-actions">
                    <button class="btn-action btn-edit" title="View Details">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadPromosData() {
        try {
            const response = await fetch(`${this.baseURL}/promos`);
            const data = await response.json();

            if (data.success) {
                this.updatePromosTable(data.promos);
            } else {
                console.error('Failed to load promos:', data.message);
            }
        } catch (error) {
            console.error('Error loading promos:', error);
        }
    }

    updatePromosTable(promos) {
        const tbody = document.getElementById('promosTableBody');
        if (!tbody) return;

        if (!promos || promos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #666;">
                        <i class="fas fa-tags" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.3;"></i><br>
                        No promos found. Create your first promo!
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = promos.map(promo => {
            const promoValue = this.getPromoValueDisplay(promo);
            const statusClass = promo.status === 'active' ? 'active' : 'inactive';
            const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
            const statusText = isExpired ? 'Expired' : promo.status;
            
            return `
                <tr>
                    <td><code style="background: #f8f9fa; padding: 2px 6px; border-radius: 4px;">${promo.code}</code></td>
                    <td>${promo.title}</td>
                    <td><span class="promo-type promo-type-${promo.promo_type || 'discount'}">${(promo.promo_type || 'discount').replace('_', ' ')}</span></td>
                    <td>${promoValue}</td>
                    <td>${promo.current_usage || 0}${promo.max_usage ? ' / ' + promo.max_usage : ''}</td>
                    <td>${promo.valid_until ? this.formatDate(promo.valid_until) : 'No expiry'}</td>
                    <td><span class="status-badge status-${statusClass}">${statusText}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="adminPanel.viewQRCode(${promo.id})" class="btn-action btn-qr" title="View QR Code">
                                <i class="fas fa-qrcode"></i>
                            </button>
                            <button onclick="adminPanel.editPromo(${promo.id})" class="btn-action btn-edit" title="Edit Promo">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="adminPanel.deletePromo(${promo.id})" class="btn-action btn-delete" title="Delete Promo">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Update mobile cards
        this.updatePromosMobileCards(promos);
    }
    
    updatePromosMobileCards(promos) {
        const container = document.getElementById('promosMobileContainer');
        if (!container) return;

        if (!promos || promos.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-tags" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.3;"></i><br>
                    No promos found. Create your first promo!
                </div>
            `;
            return;
        }

        container.innerHTML = promos.map(promo => {
            const promoValue = this.getPromoValueDisplay(promo);
            const statusClass = promo.status === 'active' ? 'active' : 'inactive';
            const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date();
            const statusText = isExpired ? 'Expired' : promo.status;
            
            return `
                <div class="mobile-card">
                    <div class="mobile-card-header">
                        <div>
                            <div class="mobile-card-title">${promo.title}</div>
                            <div class="mobile-card-subtitle"><code style="background: #f8f9fa; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">${promo.code}</code></div>
                        </div>
                    </div>
                    <div class="mobile-card-content">
                        <div class="mobile-card-field">
                            <label>Type</label>
                            <span class="promo-type promo-type-${promo.promo_type || 'discount'}">${(promo.promo_type || 'discount').replace('_', ' ')}</span>
                        </div>
                        <div class="mobile-card-field">
                            <label>Value</label>
                            <span>${promoValue}</span>
                        </div>
                        <div class="mobile-card-field">
                            <label>Usage</label>
                            <span>${promo.current_usage || 0}${promo.max_usage ? ' / ' + promo.max_usage : ''}</span>
                        </div>
                        <div class="mobile-card-field">
                            <label>Valid Until</label>
                            <span>${promo.valid_until ? this.formatDate(promo.valid_until) : 'No expiry'}</span>
                        </div>
                        <div class="mobile-card-field">
                            <label>Status</label>
                            <span class="status-badge status-${statusClass}">${statusText}</span>
                        </div>
                    </div>
                    <div class="mobile-card-actions">
                        <button onclick="adminPanel.viewQRCode(${promo.id})" class="btn-action btn-qr" title="View QR Code">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button onclick="adminPanel.editPromo(${promo.id})" class="btn-action btn-edit" title="Edit Promo">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button onclick="adminPanel.deletePromo(${promo.id})" class="btn-action btn-delete" title="Delete Promo">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getPromoValueDisplay(promo) {
        // Default to 'discount' if promo_type is not set (backward compatibility)
        const promoType = promo.promo_type || 'discount';
        
        switch (promoType) {
            case 'discount':
                if (promo.discount_type === 'percentage') {
                    return `${promo.discount_value}%`;
                } else {
                    return `Rp ${this.formatPrice(promo.discount_value)}`;
                }
            case 'free_entry':
                return 'Free Entry';
            case 'custom':
                return promo.custom_value || 'Custom';
            default:
                return '-';
        }
    }

    // Modal functions
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showLoginModal() {
        this.showModal('loginModal');
    }

    hideLoginModal() {
        this.closeModal('loginModal');
    }

    // Event management
    showCreateEventModal() {
        document.getElementById('eventModalTitle').textContent = 'Create Event';
        document.getElementById('eventForm').reset();
        this.currentEditingEventId = null;
        this.setDefaultDateTime();
        this.showModal('eventModal');
    }

    async editEvent(eventId) {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/events/${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            const data = await response.json();

            if (data.success) {
                document.getElementById('eventModalTitle').textContent = 'Edit Event';
                this.currentEditingEventId = eventId;
                this.populateEventForm(data.event);
                this.setEventDates(data.event.start_date, data.event.end_date);
                this.showModal('eventModal');
            } else {
                this.showToast('Failed to load event data', 'error');
            }
        } catch (error) {
            console.error('Edit event error:', error);
            this.showToast('Failed to load event data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.\n\nAll event data including check-ins and bookings will be permanently lost.')) {
            return;
        }
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/events/admin/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.loadEventsData(); // Reload the table
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            this.showToast('Error deleting event', 'error');
        } finally {
            this.hideLoading();
        }
    }

    populateEventForm(event) {
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventCategory').value = event.category || 'Other';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventPrice').value = event.price || '';
        document.getElementById('eventCapacity').value = event.max_capacity || '';
        document.getElementById('eventStatus').value = event.status || 'upcoming';
        document.getElementById('eventShortDescription').value = event.short_description || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventVenueDetails').value = event.venue_details || '';
        document.getElementById('eventFeatured').checked = event.featured || false;
    }

    setDefaultDateTime() {
        // Set default start time to next hour
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
        
        // Set default end time to 3 hours after start
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 3);
        
        // Format for datetime-local input
        document.getElementById('eventStartDate').value = this.formatDateTimeLocal(startDate);
        document.getElementById('eventEndDate').value = this.formatDateTimeLocal(endDate);
    }

    setEventDates(startDateISO, endDateISO) {
        const startDate = new Date(startDateISO);
        const endDate = new Date(endDateISO);
        
        document.getElementById('eventStartDate').value = this.formatDateTimeLocal(startDate);
        document.getElementById('eventEndDate').value = this.formatDateTimeLocal(endDate);
    }

    formatDateTimeLocal(date) {
        // Convert to local time and format for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    getEventDatesFromInputs() {
        const startInput = document.getElementById('eventStartDate').value;
        const endInput = document.getElementById('eventEndDate').value;
        
        if (!startInput || !endInput) {
            return { startDate: null, endDate: null };
        }
        
        return {
            startDate: new Date(startInput).toISOString(),
            endDate: new Date(endInput).toISOString()
        };
    }

    async handleEventSubmit(e) {
        e.preventDefault();
        this.showLoading();

        try {
            // Get date/time from inputs
            const { startDate, endDate } = this.getEventDatesFromInputs();

            if (!startDate || !endDate) {
                this.showToast('Please fill in all date and time fields', 'error');
                this.hideLoading();
                return;
            }

            // Validate that end date is after start date
            if (new Date(endDate) <= new Date(startDate)) {
                this.showToast('End date must be after start date', 'error');
                this.hideLoading();
                return;
            }

            const formData = new FormData(e.target);
            const eventData = {
                title: formData.get('title'),
                category: formData.get('category'),
                location: formData.get('location'),
                price: formData.get('price'),
                max_capacity: formData.get('max_capacity'),
                status: formData.get('status'),
                short_description: formData.get('short_description'),
                description: formData.get('description'),
                venue_details: formData.get('venue_details'),
                featured: document.getElementById('eventFeatured').checked,
                start_date: startDate,
                end_date: endDate,
                image_url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
            };

            const isEdit = this.currentEditingEventId !== null;
            const url = isEdit 
                ? `${this.baseURL}/events/admin/${this.currentEditingEventId}`
                : `${this.baseURL}/events/admin`;
            
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify(eventData)
            });

            const data = await response.json();

            if (data.success) {
                this.showToast(isEdit ? 'Event updated successfully!' : 'Event created successfully!', 'success');
                this.closeModal('eventModal');
                // Reload events data
                await this.loadEventsData();
            } else {
                this.showToast(data.message || 'Failed to save event', 'error');
            }
        } catch (error) {
            console.error('Event submit error:', error);
            this.showToast('Failed to save event', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Promo management - integrated into main admin panel
    showCreatePromoModal() {
        this.currentEditingPromoId = null;
        document.getElementById('promoModalTitle').innerHTML = '<i class="fas fa-plus"></i> Create New Promo';
        document.getElementById('promoForm').reset();
        this.handlePromoTypeChange(); // Reset form sections
        
        // Set default valid until date (1 month from now)
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 1);
        document.getElementById('validUntil').value = defaultDate.toISOString().slice(0, 16);
        
        this.showModal('promoModal');
    }

    async editPromo(promoId) {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/promos`);
            const data = await response.json();
            
            if (data.success) {
                const promo = data.promos.find(p => p.id === promoId);
                if (promo) {
                    this.currentEditingPromoId = promoId;
                    this.populatePromoForm(promo);
                    this.showModal('promoModal');
                } else {
                    this.showToast('Promo not found', 'error');
                }
            }
        } catch (error) {
            console.error('Error loading promo:', error);
            this.showToast('Error loading promo data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    populatePromoForm(promo) {
        document.getElementById('promoModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Promo';
        document.getElementById('promoForm').reset();
        
        document.getElementById('promoCode').value = promo.code;
        document.getElementById('promoTitle').value = promo.title;
        document.getElementById('promoDescription').value = promo.description;
        document.getElementById('promoType').value = promo.promo_type;
        
        if (promo.discount_type) {
            document.getElementById('discountType').value = promo.discount_type;
        }
        if (promo.discount_value !== undefined && promo.discount_value !== null) {
            document.getElementById('discountValue').value = promo.discount_value;
        }
        if (promo.custom_value) {
            document.getElementById('customValue').value = promo.custom_value;
        }
        if (promo.max_usage) {
            document.getElementById('maxUsage').value = promo.max_usage;
        }
        
        // Convert ISO datetime to local datetime-local format
        const validUntil = new Date(promo.valid_until);
        validUntil.setMinutes(validUntil.getMinutes() - validUntil.getTimezoneOffset());
        document.getElementById('validUntil').value = validUntil.toISOString().slice(0, 16);
        
        this.handlePromoTypeChange();
    }

    handlePromoTypeChange() {
        const promoType = document.getElementById('promoType').value;
        const discountOptions = document.getElementById('discountOptions');
        const customOptions = document.getElementById('customOptions');
        
        // Hide all sections first
        discountOptions.style.display = 'none';
        customOptions.style.display = 'none';
        
        // Show relevant section based on type
        if (promoType === 'discount') {
            discountOptions.style.display = 'block';
        } else if (promoType === 'custom') {
            customOptions.style.display = 'block';
        }
    }

    async handlePromoSubmit(e) {
        e.preventDefault();
        this.showLoading();

        try {
            const formData = new FormData(e.target);
            const promoData = Object.fromEntries(formData.entries());
            
            // Validate based on promo type
            if (promoData.promo_type === 'discount' && !promoData.discount_value) {
                this.showToast('Please enter discount value', 'error');
                this.hideLoading();
                return;
            }
            
            if (promoData.promo_type === 'custom' && !promoData.custom_value) {
                this.showToast('Please enter custom value', 'error');
                this.hideLoading();
                return;
            }
            
            const isEdit = this.currentEditingPromoId !== null;
            const url = isEdit ? 
                `/api/admin/promos/${this.currentEditingPromoId}` : 
                '/api/admin/promos';
            
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify(promoData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeModal('promoModal');
                this.loadPromosData(); // Reload the table
            } else {
                this.showToast(result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error saving promo:', error);
            this.showToast('Error saving promo', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async viewQRCode(promoId) {
        try {
            console.log('Loading QR code for promo ID:', promoId);
            
            // Show the modal first with loading state
            const debugInfo = document.getElementById('qrDebugInfo');
            const qrImage = document.getElementById('qrCodeImage');
            debugInfo.textContent = 'Loading QR code...';
            qrImage.src = '';
            this.showModal('qrModal');
            
            // Fetch promo data
            const response = await fetch(`${this.baseURL}/promos`);
            const data = await response.json();
            
            if (data.success) {
                const promo = data.promos.find(p => p.id === promoId);
                if (promo) {
                    console.log('Found promo:', promo.title, 'QR code length:', promo.qr_code?.length || 'undefined');
                    
                    document.getElementById('qrCodeTitle').textContent = promo.title;
                    document.getElementById('qrCodeDescription').textContent = promo.description;
                    
                    // Store current promo for download/print
                    window.currentQRPromo = promo;
                    window.currentQRType = 'promo';
                    
                    // Now try to fetch the QR code directly from the endpoint
                    const qrUrl = `${this.baseURL}/promos/${promoId}/qr`;
                    console.log('Fetching QR code from:', qrUrl);
                    
                    try {
                        const qrResponse = await fetch(qrUrl);
                        
                        if (!qrResponse.ok) {
                            throw new Error(`HTTP ${qrResponse.status}: ${qrResponse.statusText}`);
                        }
                        
                        const contentType = qrResponse.headers.get('content-type');
                        const contentLength = qrResponse.headers.get('content-length');
                        
                        console.log('QR Response - Type:', contentType, 'Length:', contentLength);
                        debugInfo.textContent = `Type: ${contentType}, Size: ${contentLength} bytes`;
                        
                        const qrBlob = await qrResponse.blob();
                        const objectUrl = URL.createObjectURL(qrBlob);
                        
                        qrImage.onload = () => {
                            console.log('QR code image loaded successfully');
                            debugInfo.textContent += ' - Loaded successfully';
                            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                        };
                        
                        qrImage.onerror = () => {
                            console.error('QR code image failed to display');
                            debugInfo.textContent += ' - Failed to display';
                            this.showFallbackQR(promo.code);
                        };
                        
                        qrImage.src = objectUrl;
                        
                    } catch (qrError) {
                        console.error('QR fetch error:', qrError);
                        debugInfo.textContent = `Error: ${qrError.message}`;
                        this.showFallbackQR(promo.code);
                    }
                    
                } else {
                    debugInfo.textContent = 'Promo not found';
                    this.showToast('Promo not found', 'error');
                }
            } else {
                debugInfo.textContent = 'Failed to load promos';
                this.showToast('Failed to load promos', 'error');
            }
        } catch (error) {
            console.error('Error loading QR code:', error);
            const debugInfo = document.getElementById('qrDebugInfo');
            if (debugInfo) debugInfo.textContent = `Error: ${error.message}`;
            this.showToast('Error loading QR code', 'error');
        }
    }

    async viewEventQRCode(eventId) {
        try {
            console.log('Loading QR code for event ID:', eventId);
            
            // Show the modal first with loading state
            const debugInfo = document.getElementById('qrDebugInfo');
            const qrImage = document.getElementById('qrCodeImage');
            debugInfo.textContent = 'Loading event QR code...';
            qrImage.src = '';
            this.showModal('qrModal');
            
            // Fetch event data
            const response = await fetch(`${this.baseURL}/events`);
            const data = await response.json();
            
            if (data.success) {
                const event = data.events.find(e => e.id === eventId);
                if (event) {
                    console.log('Found event:', event.title, 'ID:', event.id);
                    
                    document.getElementById('qrCodeTitle').textContent = `${event.title} - Check-in QR`;
                    document.getElementById('qrCodeDescription').textContent = `Scan this QR code to check-in to ${event.title} and earn 5 loyalty points`;
                    
                    // Store current event for download/print
                    window.currentQREvent = event;
                    window.currentQRType = 'event';
                    
                    // Now try to fetch the QR code directly from the endpoint
                    const qrUrl = `${this.baseURL}/events/${eventId}/qr`;
                    console.log('Fetching event QR code from:', qrUrl);
                    
                    try {
                        const qrResponse = await fetch(qrUrl);
                        
                        if (!qrResponse.ok) {
                            throw new Error(`HTTP ${qrResponse.status}: ${qrResponse.statusText}`);
                        }
                        
                        const contentType = qrResponse.headers.get('content-type');
                        const contentLength = qrResponse.headers.get('content-length');
                        
                        console.log('Event QR Response - Type:', contentType, 'Length:', contentLength);
                        debugInfo.textContent = `Type: ${contentType}, Size: ${contentLength} bytes - Event Check-in QR`;
                        
                        const qrBlob = await qrResponse.blob();
                        const objectUrl = URL.createObjectURL(qrBlob);
                        
                        qrImage.onload = () => {
                            console.log('Event QR code image loaded successfully');
                            debugInfo.textContent += ' - Loaded successfully';
                            setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
                        };
                        
                        qrImage.onerror = () => {
                            console.error('Event QR code image failed to display');
                            debugInfo.textContent += ' - Failed to display';
                            this.showFallbackEventQR(event.id, event.title);
                        };
                        
                        qrImage.src = objectUrl;
                        
                    } catch (qrError) {
                        console.error('Event QR fetch error:', qrError);
                        debugInfo.textContent = `Error: ${qrError.message}`;
                        this.showFallbackEventQR(event.id, event.title);
                    }
                    
                } else {
                    debugInfo.textContent = 'Event not found';
                    this.showToast('Event not found', 'error');
                }
            } else {
                debugInfo.textContent = 'Failed to load events';
                this.showToast('Failed to load events', 'error');
            }
        } catch (error) {
            console.error('Error loading event QR code:', error);
            const debugInfo = document.getElementById('qrDebugInfo');
            if (debugInfo) debugInfo.textContent = `Error: ${error.message}`;
            this.showToast('Error loading event QR code', 'error');
        }
    }
    
    showFallbackQR(code) {
        const qrImage = document.getElementById('qrCodeImage');
        const fallbackSvg = `
            <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg" style="background: white;">
                <rect width="300" height="300" fill="white" stroke="#ddd" stroke-width="2"/>
                <text x="150" y="120" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">QR Code Placeholder</text>
                <text x="150" y="150" text-anchor="middle" font-family="monospace" font-size="14" fill="#666">${code}</text>
                <text x="150" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">Scan to claim promo</text>
                <!-- Simple QR-like pattern -->
                <rect x="50" y="200" width="20" height="20" fill="#000"/>
                <rect x="80" y="200" width="20" height="20" fill="#000"/>
                <rect x="140" y="200" width="20" height="20" fill="#000"/>
                <rect x="170" y="200" width="20" height="20" fill="#000"/>
                <rect x="230" y="200" width="20" height="20" fill="#000"/>
                <rect x="50" y="230" width="20" height="20" fill="#000"/>
                <rect x="110" y="230" width="20" height="20" fill="#000"/>
                <rect x="200" y="230" width="20" height="20" fill="#000"/>
                <rect x="230" y="230" width="20" height="20" fill="#000"/>
                <rect x="80" y="260" width="20" height="20" fill="#000"/>
                <rect x="140" y="260" width="20" height="20" fill="#000"/>
                <rect x="170" y="260" width="20" height="20" fill="#000"/>
            </svg>
        `;
        
        qrImage.src = 'data:image/svg+xml;base64,' + btoa(fallbackSvg);
    }

    showFallbackEventQR(eventId, eventTitle) {
        const qrImage = document.getElementById('qrCodeImage');
        const fallbackSvg = `
            <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg" style="background: white;">
                <rect width="300" height="300" fill="white" stroke="#1976D2" stroke-width="2"/>
                <text x="150" y="100" text-anchor="middle" font-family="Arial" font-size="14" fill="#333">Event Check-in QR</text>
                <text x="150" y="130" text-anchor="middle" font-family="Arial" font-size="12" fill="#666">${eventTitle}</text>
                <text x="150" y="150" text-anchor="middle" font-family="monospace" font-size="14" fill="#1976D2">EVENT ID: ${eventId}</text>
                <text x="150" y="180" text-anchor="middle" font-family="Arial" font-size="11" fill="#999">Scan to check-in & earn 5 points</text>
                <!-- Event QR-like pattern with event theme -->
                <rect x="50" y="200" width="20" height="20" fill="#1976D2"/>
                <rect x="80" y="200" width="20" height="20" fill="#1976D2"/>
                <rect x="140" y="200" width="20" height="20" fill="#000"/>
                <rect x="170" y="200" width="20" height="20" fill="#1976D2"/>
                <rect x="230" y="200" width="20" height="20" fill="#000"/>
                <rect x="50" y="230" width="20" height="20" fill="#000"/>
                <rect x="110" y="230" width="20" height="20" fill="#1976D2"/>
                <rect x="200" y="230" width="20" height="20" fill="#1976D2"/>
                <rect x="230" y="230" width="20" height="20" fill="#000"/>
                <rect x="80" y="260" width="20" height="20" fill="#1976D2"/>
                <rect x="140" y="260" width="20" height="20" fill="#000"/>
                <rect x="170" y="260" width="20" height="20" fill="#1976D2"/>
            </svg>
        `;
        
        qrImage.src = 'data:image/svg+xml;base64,' + btoa(fallbackSvg);
    }

    async deletePromo(promoId) {
        if (!confirm('Are you sure you want to delete this promo? This action cannot be undone.')) {
            return;
        }
        
        try {
            this.showLoading();
            const response = await fetch(`/api/admin/promos/${promoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.loadPromosData(); // Reload the table
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting promo:', error);
            this.showToast('Error deleting promo', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // User Management Functions
    async editUser(userId) {
        try {
            this.showLoading();
            
            // Load user data first
            const userResponse = await fetch(`${this.baseURL}/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            const userData = await userResponse.json();
            
            // Try to load user check-ins (fallback if endpoint doesn't exist)
            let checkinsData = { success: false, checkins: [] };
            try {
                const checkinsResponse = await fetch(`${this.baseURL}/users/admin/${userId}/checkins`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                    }
                });
                if (checkinsResponse.ok) {
                    checkinsData = await checkinsResponse.json();
                }
            } catch (error) {
                console.log('Check-ins endpoint not available, using fallback data');
                // Use existing check_ins data from user object if available
                if (userData.user && userData.user.check_ins) {
                    checkinsData = {
                        success: true,
                        checkins: userData.user.check_ins
                    };
                }
            }

            if (userData.success) {
                document.getElementById('userModalTitle').textContent = 'Edit User';
                this.currentEditingUserId = userId;
                
                // Include check-ins data with user data
                const userWithCheckins = {
                    ...userData.user,
                    event_checkins: checkinsData.success ? checkinsData.checkins : []
                };
                
                this.populateUserForm(userWithCheckins);
                this.showModal('userModal');
            } else {
                this.showToast('Failed to load user data', 'error');
            }
        } catch (error) {
            console.error('Edit user error:', error);
            this.showToast('Failed to load user data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    populateUserForm(user) {
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRole').value = user.role || 'user';
        document.getElementById('userStatus').value = user.status || 'active';
        
        // Show user stats if user has activity
        const hasActivity = (user.points > 0 || user.total_check_ins > 0 || (user.event_checkins && user.event_checkins.length > 0));
        
        if (hasActivity) {
            const statsContainer = document.getElementById('userStatsContainer');
            statsContainer.style.display = 'block';
            
            document.getElementById('userPoints').textContent = user.points || 0;
            document.getElementById('userCheckins').textContent = user.total_check_ins || 0;
            
            // Show event check-ins
            this.displayUserEventCheckins(user.event_checkins || []);
        } else {
            document.getElementById('userStatsContainer').style.display = 'none';
        }
    }
    
    displayUserEventCheckins(checkins) {
        const container = document.getElementById('userEventCheckinsContent');
        
        if (!checkins || checkins.length === 0) {
            container.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #666;">
                    <i class="fas fa-calendar-alt" style="font-size: 2rem; opacity: 0.3; margin-bottom: 10px; display: block;"></i>
                    <p style="margin: 0; font-size: 0.9rem;">No event check-ins yet</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.8rem; opacity: 0.7;">User hasn't scanned any QR codes</p>
                </div>
            `;
            return;
        }
        
        // Sort check-ins by date (most recent first)
        const sortedCheckins = [...checkins].sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));
        
        container.innerHTML = sortedCheckins.map(checkin => {
            const checkinDate = new Date(checkin.checked_in_at);
            const formattedDate = checkinDate.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const formattedTime = checkinDate.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div style="padding: 12px 15px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #4CAF50, #45a049); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas fa-qrcode" style="color: white; font-size: 1.1rem;"></i>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 2px; line-height: 1.3;">
                            ${checkin.event_title || 'Unknown Event'}
                        </div>
                        <div style="font-size: 0.85rem; color: #666; line-height: 1.2;">
                            <i class="fas fa-calendar" style="margin-right: 4px;"></i>
                            ${formattedDate} at ${formattedTime}
                        </div>
                        ${checkin.location ? `
                            <div style="font-size: 0.8rem; color: #888; margin-top: 2px;">
                                <i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i>
                                ${checkin.location}
                            </div>
                        ` : ''}
                    </div>
                    <div style="text-align: right; flex-shrink: 0;">
                        <div style="background: #E8F5E8; color: #2E7D32; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                            +${checkin.points_earned || 5} pts
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add summary footer if there are multiple check-ins
        if (sortedCheckins.length > 0) {
            const totalPoints = sortedCheckins.reduce((sum, checkin) => sum + (checkin.points_earned || 5), 0);
            const uniqueEvents = new Set(sortedCheckins.map(c => c.event_id)).size;
            
            container.innerHTML += `
                <div style="padding: 12px 15px; background: #f8f9fa; border-top: 2px solid #e9ecef; text-align: center;">
                    <div style="display: flex; justify-content: space-around; text-align: center;">
                        <div>
                            <div style="font-weight: bold; color: #1976D2; font-size: 1.1rem;">${sortedCheckins.length}</div>
                            <div style="font-size: 0.8rem; color: #666;">Total Check-ins</div>
                        </div>
                        <div>
                            <div style="font-weight: bold; color: #4CAF50; font-size: 1.1rem;">${uniqueEvents}</div>
                            <div style="font-size: 0.8rem; color: #666;">Unique Events</div>
                        </div>
                        <div>
                            <div style="font-weight: bold; color: #FF9800; font-size: 1.1rem;">${totalPoints}</div>
                            <div style="font-size: 0.8rem; color: #666;">Points Earned</div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async handleUserSubmit(e) {
        e.preventDefault();
        this.showLoading();

        try {
            const formData = new FormData(e.target);
            const userData = {
                name: formData.get('name'),
                email: formData.get('email'),
                role: formData.get('role'),
                status: formData.get('status')
            };

            const userId = this.currentEditingUserId;
            const response = await fetch(`${this.baseURL}/users/admin/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                this.showToast('User updated successfully!', 'success');
                this.closeModal('userModal');
                // Reload users data
                await this.loadUsersData();
            } else {
                this.showToast(result.message || 'Failed to update user', 'error');
            }
        } catch (error) {
            console.error('User submit error:', error);
            this.showToast('Failed to update user', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async toggleUserStatus(userId) {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/users/admin/${userId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.loadUsersData(); // Reload the table
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            this.showToast('Error updating user status', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.\n\nAll user data including points and check-ins will be permanently lost.')) {
            return;
        }
        
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/users/admin/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.loadUsersData(); // Reload the table
            } else {
                this.showToast(result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showToast('Error deleting user', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // Point Adjustment functions
    showPointAdjustmentModal(userId, userName, currentPoints) {
        this.currentEditingUserId = userId;
        
        // Update modal title and user info
        document.getElementById('pointAdjustmentModalTitle').textContent = 'Adjust User Points';
        
        const userInfoHtml = `
            <h4>${userName}</h4>
            <p>User ID: ${userId}</p>
            <p class="current-points">Current Points: ${currentPoints}</p>
        `;
        document.getElementById('pointAdjustmentUserInfo').innerHTML = userInfoHtml;
        
        // Reset form
        document.getElementById('pointAdjustmentForm').reset();
        
        this.showModal('pointAdjustmentModal');
    }
    
    async showPointHistoryModal(userId, userName) {
        this.showLoading();
        
        try {
            const response = await fetch(`${this.baseURL}/users/admin/${userId}/point-history`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('pointHistoryModalTitle').textContent = `Point Adjustment History - ${userName}`;
                
                const userInfoHtml = `
                    <h4>${userName}</h4>
                    <p>User ID: ${userId}</p>
                `;
                document.getElementById('pointHistoryUserInfo').innerHTML = userInfoHtml;
                
                this.displayPointHistory(data.adjustments);
                this.showModal('pointHistoryModal');
            } else {
                this.showToast('Failed to load point history', 'error');
            }
        } catch (error) {
            console.error('Error loading point history:', error);
            this.showToast('Failed to load point history', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    displayPointHistory(adjustments) {
        const container = document.getElementById('pointHistoryContainer');
        
        if (!adjustments || adjustments.length === 0) {
            container.innerHTML = `
                <div class="no-history">
                    <i class="fas fa-history"></i>
                    <h4>No Point Adjustments</h4>
                    <p>This user hasn't had any manual point adjustments yet.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = adjustments.map(adj => {
            const adjustmentClass = adj.adjustment_amount > 0 ? 'positive' : 'negative';
            const adjustmentSymbol = adj.adjustment_amount > 0 ? '+' : '';
            const adjustmentDate = new Date(adj.created_at).toLocaleString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="point-history-item">
                    <div class="point-history-details">
                        <div class="point-history-reason">${adj.reason}</div>
                        <div class="point-history-meta">
                            Adjusted by: ${adj.admin_email} • ${adjustmentDate}
                        </div>
                        <div class="point-history-before-after">
                            ${adj.points_before} → ${adj.points_after} points
                        </div>
                    </div>
                    <div class="point-history-amount ${adjustmentClass}">
                        ${adjustmentSymbol}${adj.adjustment_amount}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    async handlePointAdjustmentSubmit(e) {
        e.preventDefault();
        this.showLoading();
        
        try {
            const formData = new FormData(e.target);
            const adjustment = parseInt(formData.get('adjustment'));
            const reason = formData.get('reason').trim();
            
            if (!adjustment || adjustment === 0) {
                this.showToast('Please enter a valid point adjustment amount', 'error');
                return;
            }
            
            if (!reason) {
                this.showToast('Please provide a reason for this adjustment', 'error');
                return;
            }
            
            const response = await fetch(`${this.baseURL}/users/admin/${this.currentEditingUserId}/adjust-points`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({
                    adjustment: adjustment,
                    reason: reason,
                    admin_email: 'admin@ikoot.com'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.message, 'success');
                this.closeModal('pointAdjustmentModal');
                await this.loadUsersData(); // Refresh users table
            } else {
                this.showToast(result.message || 'Failed to adjust points', 'error');
            }
        } catch (error) {
            console.error('Point adjustment error:', error);
            this.showToast('Failed to adjust points', 'error');
        } finally {
            this.hideLoading();
        }
    }

    // UI Helper functions
    showLoading() {
        document.getElementById('loading').classList.add('active');
    }

    hideLoading() {
        document.getElementById('loading').classList.remove('active');
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-info-circle';

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('mobile-open');
        
        // Add overlay when sidebar is open on mobile
        this.toggleSidebarOverlay();
    }
    
    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('mobile-open');
        this.removeSidebarOverlay();
    }
    
    toggleSidebarOverlay() {
        const existingOverlay = document.querySelector('.sidebar-overlay');
        const sidebar = document.getElementById('sidebar');
        
        if (sidebar.classList.contains('mobile-open') && !existingOverlay) {
            const overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.addEventListener('click', () => this.closeSidebar());
            document.body.appendChild(overlay);
        } else if (!sidebar.classList.contains('mobile-open') && existingOverlay) {
            existingOverlay.remove();
        }
    }
    
    removeSidebarOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    // Utility functions
    formatPrice(price) {
        return new Intl.NumberFormat('id-ID').format(price || 0);
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Global functions for onclick handlers
window.showPage = function(page) {
    adminPanel.showPage(page);
};

window.showCreateEventModal = function() {
    adminPanel.showCreateEventModal();
};

window.showCreatePromoModal = function() {
    adminPanel.showCreatePromoModal();
};

window.closeModal = function(modalId) {
    adminPanel.closeModal(modalId);
};

// Global functions for promo type change handling
window.handlePromoTypeChange = function() {
    adminPanel.handlePromoTypeChange();
};

// Global utility functions
window.showLoading = function() {
    document.getElementById('loading').classList.add('active');
};

window.hideLoading = function() {
    document.getElementById('loading').classList.remove('active');
};

window.showToast = function(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                'fa-info-circle';

    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
};

window.showModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
};

// QR Code functionality
window.downloadQR = function() {
    if (window.currentQRType === 'event' && window.currentQREvent) {
        const event = window.currentQREvent;
        const link = document.createElement('a');
        link.href = `/api/events/${event.id}/qr`;
        link.download = `qr-event-${event.id}-${event.title.toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else if (window.currentQRType === 'promo' && window.currentQRPromo) {
        const promo = window.currentQRPromo;
        const link = document.createElement('a');
        link.href = `/api/promos/${promo.id}/qr`;
        link.download = `qr-promo-${promo.code.toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

window.printQR = function() {
    if (window.currentQRType === 'event' && window.currentQREvent) {
        const event = window.currentQREvent;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Event Check-in QR Code - ${event.title}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    .qr-container {
                        border: 2px solid #1976D2;
                        border-radius: 10px;
                        padding: 30px;
                        margin: 20px auto;
                        max-width: 400px;
                    }
                    .qr-title {
                        color: #1976D2;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .qr-description {
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .qr-code {
                        max-width: 300px;
                        max-height: 300px;
                        border: 1px solid #ddd;
                    }
                    .qr-code-text {
                        font-size: 18px;
                        font-weight: bold;
                        color: #333;
                        margin-top: 15px;
                    }
                    .qr-info {
                        font-size: 14px;
                        color: #4CAF50;
                        margin-top: 10px;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <div class="qr-title">${event.title}</div>
                    <div class="qr-description">Event Check-in QR Code</div>
                    <img class="qr-code" src="/api/events/${event.id}/qr" alt="Event QR Code">
                    <div class="qr-code-text">Event ID: ${event.id}</div>
                    <div class="qr-info">📍 ${event.location}</div>
                    <div class="qr-info">🎯 Scan to check-in and earn 5 loyalty points!</div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    } else if (window.currentQRType === 'promo' && window.currentQRPromo) {
        const promo = window.currentQRPromo;
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Promo QR Code - ${promo.code}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    .qr-container {
                        border: 2px solid #F39C12;
                        border-radius: 10px;
                        padding: 30px;
                        margin: 20px auto;
                        max-width: 400px;
                    }
                    .qr-title {
                        color: #F39C12;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .qr-description {
                        color: #666;
                        margin-bottom: 20px;
                    }
                    .qr-code {
                        max-width: 300px;
                        max-height: 300px;
                    }
                    .qr-code-text {
                        font-size: 18px;
                        font-weight: bold;
                        color: #333;
                        margin-top: 15px;
                    }
                </style>
            </head>
            <body>
                <div class="qr-container">
                    <div class="qr-title">${promo.title}</div>
                    <div class="qr-description">${promo.description}</div>
                    <img class="qr-code" src="/api/promos/${promo.id}/qr" alt="Promo QR Code">
                    <div class="qr-code-text">${promo.code}</div>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }
};

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});