class BOVBookingApp {
  constructor() {
    this.currentUser = null;
    this.bookings = [];
    this.vehicles = [];
    this.queue = [];
    this.init();
  }

  init() {
    this.loadFromStorage();
    this.setupEventListeners();
    this.initializeMockData();
    this.checkAuthentication();
  }

  setupEventListeners() {
    // Landing page
    document.getElementById('btn-traveler')?.addEventListener('click', () => this.navigateTo('login', { role: 'traveler' }));
    document.getElementById('btn-driver')?.addEventListener('click', () => this.navigateTo('login', { role: 'driver' }));

    // Login form
    document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('back-to-role')?.addEventListener('click', () => this.showLoginStep(1));

    // Demo accounts
    document.querySelectorAll('.demo-account-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleDemoLogin(e.target.dataset.email));
    });

    // Traveler form
    document.getElementById('booking-form')?.addEventListener('submit', (e) => this.handleBooking(e));
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.selectPlatform(e.target.dataset.platform));
    });

    // Driver actions
    document.querySelectorAll('.btn-accept')?.forEach(btn => {
      btn.addEventListener('click', (e) => this.acceptBooking(e.target.dataset.bookingId));
    });

    document.querySelectorAll('.btn-start')?.forEach(btn => {
      btn.addEventListener('click', (e) => this.startRide(e.target.dataset.bookingId));
    });

    document.querySelectorAll('.btn-complete')?.forEach(btn => {
      btn.addEventListener('click', (e) => this.completeRide(e.target.dataset.bookingId));
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => this.logout());

    // Modal
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => this.closeModal(e.target.dataset.closeModal));
    });
  }

  initializeMockData() {
    if (!localStorage.getItem('vehicles_initialized')) {
      this.vehicles = [
        { id: 'bov001', plate: 'KA-01-AB-1234', capacity: 4, available: true, status: 'active' },
        { id: 'bov002', plate: 'KA-01-AB-1235', capacity: 4, available: true, status: 'active' },
        { id: 'bov003', plate: 'KA-01-AB-1236', capacity: 4, available: true, status: 'active' },
        { id: 'bov004', plate: 'KA-01-AB-1237', capacity: 4, available: true, status: 'active' },
        { id: 'bov005', plate: 'KA-01-AB-1238', capacity: 4, available: true, status: 'active' },
        { id: 'bov006', plate: 'KA-01-AB-1239', capacity: 4, available: true, status: 'inactive' },
        { id: 'bov007', plate: 'KA-01-AB-1240', capacity: 4, available: false, status: 'active' },
      ];
      
      this.saveToStorage();
      localStorage.setItem('vehicles_initialized', 'true');
    }
  }

  checkAuthentication() {
    this.currentUser = JSON.parse(sessionStorage.getItem('current_user'));
    
    const currentPage = this.getCurrentPage();
    
    if (!this.currentUser && currentPage !== 'landing' && currentPage !== 'login') {
      this.navigateTo('landing');
    } else if (this.currentUser) {
      this.displayHeader();
      if (currentPage === 'landing' || currentPage === 'login') {
        this.navigateTo(this.currentUser.role === 'traveler' ? 'traveler-dashboard' : 'driver-dashboard');
      }
    }
  }

  getCurrentPage() {
    const pages = document.querySelectorAll('.page');
    for (let page of pages) {
      if (page.classList.contains('active')) {
        return page.id.replace('-page', '');
      }
    }
    return 'landing';
  }

  navigateTo(page, params = {}) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
      
      if (page === 'login') {
        this.showLoginStep(1);
        this.currentRole = params.role || 'traveler';
        document.querySelector('.login-header p').textContent = 
          this.currentRole === 'traveler' ? 'Book Your Battery-Operated Vehicle' : 'Driver Portal';
        this.updateStepIndicator(1);
      } else if (page === 'traveler-dashboard') {
        this.renderTravelerDashboard();
      } else if (page === 'driver-dashboard') {
        this.renderDriverDashboard();
      }
    }
  }

  displayHeader() {
    const header = document.getElementById('header');
    if (header && this.currentUser) {
      header.style.display = 'flex';
      const userInfo = header.querySelector('.user-info');
      userInfo.innerHTML = `
        <span>${this.currentUser.name} (${this.currentUser.role === 'traveler' ? 'Traveler' : 'Driver'})</span>
        ${this.currentUser.isDisabled ? '<span class="pwd-badge">⭐ PWD</span>' : ''}
      `;
    }
  }

  showLoginStep(step) {
    document.querySelectorAll('[id^="login-step-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById(`login-step-${step}`).classList.remove('hidden');
    this.updateStepIndicator(step);
  }

  updateStepIndicator(step) {
    document.querySelectorAll('.step').forEach(s => {
      s.classList.remove('active', 'completed');
      const stepNum = parseInt(s.textContent);
      if (stepNum < step) s.classList.add('completed');
      if (stepNum === step) s.classList.add('active');
    });
  }

  validatePNRUTS(value) {
    return /^\d{10}$|^[A-Z]{2}\d{8}$/.test(value);
  }

  handleLogin(e) {
    e.preventDefault();
    
    const step1Form = document.getElementById('login-step-1');
    if (step1Form.classList.contains('hidden') === false) {
      // Step 1: PNR/UTS validation
      const pnrUts = document.getElementById('pnr-uts').value;
      const travelType = document.getElementById('travel-type').value;
      
      if (!this.validatePNRUTS(pnrUts)) {
        this.showAlert('Invalid PNR/UTS number. Use 10 digits or format like AB12345678', 'error');
        return;
      }
      
      this.showLoginStep(2);
    } else {
      // Step 2: Account details
      const email = document.getElementById('email').value;
      const name = document.getElementById('name').value;
      const phone = document.getElementById('phone').value;
      const isDisabled = document.getElementById('is-disabled').checked;
      
      if (!email || !name || !phone) {
        this.showAlert('Please fill all fields', 'error');
        return;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.showAlert('Invalid email address', 'error');
        return;
      }
      
      if (!/^[6-9]\d{9}$/.test(phone)) {
        this.showAlert('Invalid Indian phone number', 'error');
        return;
      }
      
      this.createUser(email, name, phone, isDisabled);
    }
  }

  createUser(email, name, phone, isDisabled) {
    const user = {
      id: 'user_' + Date.now(),
      email,
      name,
      phone,
      isDisabled,
      role: this.currentRole,
      createdAt: new Date().toISOString()
    };
    
    sessionStorage.setItem('current_user', JSON.stringify(user));
    this.currentUser = user;
    this.displayHeader();
    
    this.showAlert(`Welcome ${name}! Redirecting...`, 'success');
    setTimeout(() => {
      this.navigateTo(this.currentRole === 'traveler' ? 'traveler-dashboard' : 'driver-dashboard');
    }, 1000);
  }

  handleDemoLogin(email) {
    const demoUsers = {
      'traveler1@demo.com': { name: 'Rajesh Kumar', phone: '9876543210', isDisabled: true },
      'traveler2@demo.com': { name: 'Priya Singh', phone: '9876543211', isDisabled: false },
      'driver1@demo.com': { name: 'Suresh Kumar', phone: '9876543212', isDisabled: false },
      'driver2@demo.com': { name: 'Vijaykumar', phone: '9876543213', isDisabled: false }
    };
    
    const userData = demoUsers[email];
    if (userData) {
      const user = {
        id: 'user_' + Date.now(),
        email,
        ...userData,
        role: email.includes('driver') ? 'driver' : 'traveler',
        createdAt: new Date().toISOString()
      };
      
      sessionStorage.setItem('current_user', JSON.stringify(user));
      this.currentUser = user;
      this.displayUser();
      
      this.showAlert(`Welcome ${userData.name}!`, 'success');
      setTimeout(() => {
        this.navigateTo(user.role === 'traveler' ? 'traveler-dashboard' : 'driver-dashboard');
      }, 500);
    }
  }

  selectPlatform(platform) {
    document.querySelectorAll('.platform-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelector(`[data-platform="${platform}"]`).classList.add('selected');
    this.selectedFromPlatform = platform;
    this.selectedToPlatform = null;
  }

  selectToPlatform(platform) {
    if (platform === this.selectedFromPlatform) {
      this.showAlert('Destination platform must be different from current platform', 'warning');
      return;
    }
    this.selectedToPlatform = platform;
  }

  handleBooking(e) {
    e.preventDefault();
    
    if (!this.selectedFromPlatform) {
      this.showAlert('Please select your current platform', 'error');
      return;
    }
    
    if (!this.selectedToPlatform) {
      this.showAlert('Please select destination platform', 'error');
      return;
    }

    const availableBovs = this.vehicles.filter(v => v.available);
    
    if (availableBovs.length === 0) {
      this.showAlert('No BOVs available at the moment', 'warning');
      return;
    }

    const booking = {
      id: 'booking_' + Date.now(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      phone: this.currentUser.phone,
      isDisabled: this.currentUser.isDisabled,
      fromPlatform: this.selectedFromPlatform,
      toPlatform: this.selectedToPlatform,
      status: 'confirmed',
      bovId: availableBovs[0].id,
      bovPlate: availableBovs[0].plate,
      createdAt: new Date(),
      driverAcceptedAt: null,
      startedAt: null,
      completedAt: null
    };

    this.bookings.push(booking);
    this.saveToStorage();
    
    // Mark BOV as unavailable
    const bov = this.vehicles.find(v => v.id === booking.bovId);
    if (bov) bov.available = false;

    this.showBookingConfirmation(booking);
    this.renderTravelerDashboard();
  }

  showBookingConfirmation(booking) {
    const modal = document.getElementById('confirmation-modal');
    const content = document.getElementById('confirmation-content');
    
    content.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 48px; margin-bottom: 15px;">✓</div>
        <h2>Booking Confirmed!</h2>
        <p style="margin: 20px 0; font-size: 16px;">
          Your BOV booking from <strong>Platform ${booking.fromPlatform}</strong> to <strong>Platform ${booking.toPlatform}</strong> is confirmed.
        </p>
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
          <p><strong>BOV Details:</strong> ${booking.bovPlate}</p>
          <p><strong>Status:</strong> Waiting for driver to accept</p>
          <p><strong>Booking ID:</strong> ${booking.id}</p>
        </div>
        <p style="color: #666; font-size: 14px;">The driver will reach you soon at Platform ${booking.fromPlatform}</p>
      </div>
    `;
    
    modal.classList.add('active');
  }

  renderTravelerDashboard() {
    const bookingList = document.getElementById('booking-list');
    const userBookings = this.bookings.filter(b => b.userId === this.currentUser.id);
    
    if (userBookings.length === 0) {
      bookingList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>No bookings yet. Create your first booking!</p>
        </div>
      `;
      return;
    }

    bookingList.innerHTML = userBookings.map(booking => `
      <div class="booking-item">
        <div class="booking-details">
          <h4>
            Platform ${booking.fromPlatform} → Platform ${booking.toPlatform}
            ${booking.isDisabled ? '<span class="pwd-badge">⭐ PWD</span>' : ''}
          </h4>
          <p>BOV: ${booking.bovPlate}</p>
          <p>Booking ID: ${booking.id}</p>
          <p>${new Date(booking.createdAt).toLocaleString()}</p>
        </div>
        <span class="booking-status status-${booking.status}">${booking.status.toUpperCase()}</span>
      </div>
    `).join('');
  }

  renderDriverDashboard() {
    const vehicleCard = document.getElementById('vehicle-card');
    const queueList = document.getElementById('queue-list');
    
    // Display assigned vehicle
    const assignedVehicle = this.vehicles[0]; // Simplified: assume first BOV
    vehicleCard.innerHTML = `
      <div style="margin-bottom: 15px;">
        <h3 style="color: white; margin-bottom: 5px;">Assigned Vehicle</h3>
        <p style="opacity: 0.9;">Ready for bookings</p>
      </div>
      <div class="vehicle-info">
        <div class="vehicle-info-item">
          <div class="vehicle-info-label">License Plate</div>
          <div class="vehicle-info-value">${assignedVehicle.plate}</div>
        </div>
        <div class="vehicle-info-item">
          <div class="vehicle-info-label">Capacity</div>
          <div class="vehicle-info-value">${assignedVehicle.capacity} Passengers</div>
        </div>
        <div class="vehicle-info-item">
          <div class="vehicle-info-label">Status</div>
          <div class="vehicle-info-value">${assignedVehicle.available ? 'Available' : 'In Use'}</div>
        </div>
        <div class="vehicle-info-item">
          <div class="vehicle-info-label">Total Rides</div>
          <div class="vehicle-info-value">${this.bookings.filter(b => b.bovId === assignedVehicle.id).length}</div>
        </div>
      </div>
    `;

    // Sort bookings: PWD first, then by creation time
    const pendingBookings = this.bookings
      .filter(b => b.status === 'confirmed' && !b.driverAcceptedAt)
      .sort((a, b) => (b.isDisabled ? 1 : -1) - (a.isDisabled ? 1 : -1) || new Date(a.createdAt) - new Date(b.createdAt));

    const acceptedBookings = this.bookings
      .filter(b => b.driverAcceptedAt && !b.completedAt)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    if (pendingBookings.length === 0 && acceptedBookings.length === 0) {
      queueList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✨</div>
          <p>No pending bookings. You're all caught up!</p>
        </div>
      `;
      return;
    }

    let html = '';

    if (acceptedBookings.length > 0) {
      html += `<div class="queue-section">
        <div class="queue-title">Active Rides (${acceptedBookings.length})</div>
        ${acceptedBookings.map(booking => this.renderQueueItem(booking, 'active')).join('')}
      </div>`;
    }

    if (pendingBookings.length > 0) {
      html += `<div class="queue-section">
        <div class="queue-title">Pending Bookings (${pendingBookings.length})</div>
        ${pendingBookings.map(booking => this.renderQueueItem(booking, 'pending')).join('')}
      </div>`;
    }

    queueList.innerHTML = html;
    this.setupEventListeners();
  }

  renderQueueItem(booking, section) {
    const isPWD = booking.isDisabled;
    const isActive = section === 'active';

    return `
      <div class="queue-item ${isPWD ? 'priority' : ''}">
        <div class="queue-item-header">
          <div class="queue-item-name">${booking.userName}</div>
          ${isPWD ? '<div class="queue-item-priority-badge">⭐ PWD Priority</div>' : ''}
        </div>
        <div class="queue-item-details">
          <div class="queue-item-detail">
            <span>📍</span>
            <span>Platform ${booking.fromPlatform} → ${booking.toPlatform}</span>
          </div>
          <div class="queue-item-detail">
            <span>📞</span>
            <span>${booking.phone}</span>
          </div>
          <div class="queue-item-detail">
            <span>🚗</span>
            <span>${booking.bovPlate}</span>
          </div>
          <div class="queue-item-detail">
            <span>⏰</span>
            <span>${new Date(booking.createdAt).toLocaleTimeString()}</span>
          </div>
        </div>
        <div class="queue-item-actions">
          ${!isActive ? `<button class="btn btn-primary btn-small btn-accept" data-booking-id="${booking.id}">Accept</button>` : ''}
          ${isActive && !booking.startedAt ? `<button class="btn btn-accent btn-small btn-start" data-booking-id="${booking.id}">Start Ride</button>` : ''}
          ${isActive && booking.startedAt ? `<button class="btn btn-success btn-small btn-complete" data-booking-id="${booking.id}">Complete</button>` : ''}
        </div>
      </div>
    `;
  }

  acceptBooking(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.driverAcceptedAt = new Date();
      booking.status = 'accepted';
      this.saveToStorage();
      this.showAlert(`Ride accepted for ${booking.userName}!`, 'success');
      this.renderDriverDashboard();
    }
  }

  startRide(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.startedAt = new Date();
      booking.status = 'in_progress';
      this.saveToStorage();
      this.showAlert('Ride started!', 'success');
      this.renderDriverDashboard();
    }
  }

  completeRide(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.completedAt = new Date();
      booking.status = 'completed';
      
      // Mark BOV as available again
      const bov = this.vehicles.find(v => v.id === booking.bovId);
      if (bov) bov.available = true;
      
      this.saveToStorage();
      this.showAlert(`Ride completed! Total time: ${this.calculateDuration(booking.createdAt, booking.completedAt)}`, 'success');
      this.renderDriverDashboard();
    }
  }

  calculateDuration(start, end) {
    const diff = new Date(end) - new Date(start);
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  }

  showAlert(message, type = 'info') {
    const alertId = 'alert_' + Date.now();
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.id = alertId;
    
    const icons = { success: '✓', error: '✕', warning: '!', info: 'ℹ' };
    alert.innerHTML = `
      <div class="alert-icon">${icons[type]}</div>
      <div>${message}</div>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => {
      alert.remove();
    }, 4000);
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  logout() {
    sessionStorage.removeItem('current_user');
    this.currentUser = null;
    this.navigateTo('landing');
    this.showAlert('Logged out successfully', 'success');
  }

  saveToStorage() {
    localStorage.setItem('bookings', JSON.stringify(this.bookings));
    localStorage.setItem('vehicles', JSON.stringify(this.vehicles));
  }

  loadFromStorage() {
    this.bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    this.vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BOVBookingApp();
});
