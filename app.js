class BOVBookingApp {
  constructor() {
    this.currentRole = null;
    this.currentUser = null;
    this.currentBooking = null;
    this.vehicles = this.initializeVehicles();
    this.bookings = [];
    this.driverDutyActive = false;
    
    this.initializeEventListeners();
    this.loadFromStorage();
  }

  // Initialize vehicles for the station
  initializeVehicles() {
    const vehicles = [];
    for (let i = 1; i <= 7; i++) {
      vehicles.push({
        id: `BOV-${String(i).padStart(3, '0')}`,
        status: 'available',
        capacity: 4,
        currentPlatform: Math.floor(Math.random() * 8) + 1,
        driver: null,
        bookings: []
      });
    }
    return vehicles;
  }

  // Initialize event listeners
  initializeEventListeners() {
    document.getElementById('btn-logout').addEventListener('click', () => this.logout());
  }

  // Select user role
  selectRole(role) {
    this.currentRole = role;
    this.navigateTo('login');
  }

  // Validate PNR/UTS and proceed
  validatePNRAndProceed() {
    const pnrUts = document.getElementById('pnr-uts').value;
    const travelType = document.getElementById('travel-type').value;
    const fromPlatform = document.getElementById('from-platform').value;
    const pwdCategory = document.getElementById('pwd-category').value;

    if (!pnrUts || pnrUts.length !== 10) {
      this.showAlert('Please enter a valid 10-digit number', 'error');
      return;
    }

    if (!travelType || !fromPlatform || !pwdCategory) {
      this.showAlert('Please fill all required fields', 'error');
      return;
    }

    this.validationData = { pnrUts, travelType, fromPlatform, pwdCategory };
    document.getElementById('login-step-1').style.display = 'none';
    document.getElementById('login-step-2').style.display = 'block';
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('active');
  }

  // Back to step 1
  backToStep1() {
    document.getElementById('login-step-2').style.display = 'none';
    document.getElementById('login-step-1').style.display = 'block';
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.remove('completed');
    document.getElementById('step1').classList.add('active');
  }

  // Complete registration
  completeRegistration() {
    const fullName = document.getElementById('full-name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const destinationPlatform = document.getElementById('destination-platform').value;

    if (!fullName || !phone || !email || !destinationPlatform) {
      this.showAlert('Please fill all required fields', 'error');
      return;
    }

    if (phone.length !== 10 || isNaN(phone)) {
      this.showAlert('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    if (!this.validateEmail(email)) {
      this.showAlert('Please enter a valid email address', 'error');
      return;
    }

    this.currentUser = {
      id: this.generateId(),
      role: this.currentRole,
      fullName,
      phone,
      email,
      pnrUts: this.validationData.pnrUts,
      travelType: this.validationData.travelType,
      fromPlatform: this.validationData.fromPlatform,
      destinationPlatform,
      pwdCategory: this.validationData.pwdCategory,
      isPWD: this.validationData.pwdCategory !== 'none',
      createdAt: new Date().toISOString()
    };

    this.saveToStorage();
    this.showAlert(`Welcome, ${fullName}!`, 'success');

    if (this.currentRole === 'traveler') {
      setTimeout(() => this.navigateTo('traveler-dashboard'), 500);
    } else {
      setTimeout(() => this.navigateTo('driver-dashboard'), 500);
    }
  }

  // Start new booking
  startNewBooking() {
    const content = `
      <div style="display: grid; gap: var(--space-20);">
        <div>
          <label style="display: block; margin-bottom: var(--space-8); font-weight: 600;">From Platform</label>
          <select id="booking-from-platform" style="width: 100%; padding: var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-md);">
            <option value="">Select...</option>
            <option value="1">Platform 1</option>
            <option value="2">Platform 2</option>
            <option value="3">Platform 3</option>
            <option value="4">Platform 4</option>
            <option value="5">Platform 5</option>
            <option value="6">Platform 6</option>
            <option value="7">Platform 7</option>
            <option value="8">Platform 8</option>
          </select>
        </div>
        <div>
          <label style="display: block; margin-bottom: var(--space-8); font-weight: 600;">To Platform</label>
          <select id="booking-to-platform" style="width: 100%; padding: var(--space-12); border: 1px solid var(--color-gray-300); border-radius: var(--radius-md);">
            <option value="">Select...</option>
            <option value="1">Platform 1</option>
            <option value="2">Platform 2</option>
            <option value="3">Platform 3</option>
            <option value="4">Platform 4</option>
            <option value="5">Platform 5</option>
            <option value="6">Platform 6</option>
            <option value="7">Platform 7</option>
            <option value="8">Platform 8</option>
          </select>
        </div>
        <p class="text-xs" style="color: var(--color-gray-500); margin: 0;">
          ${this.currentUser.isPWD ? '<strong>Your booking will be prioritized as a PWD passenger.</strong>' : ''}
        </p>
      </div>
    `;

    document.getElementById('booking-modal-content').innerHTML = content;

    const modal = document.getElementById('booking-modal');
    modal.classList.add('active');

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="app.confirmNewBooking()">Confirm Booking</button>
    `;

    const existingFooter = modal.querySelector('.modal-footer');
    if (existingFooter) existingFooter.remove();
    modal.appendChild(footer);
  }

  // Confirm new booking
  confirmNewBooking() {
    const fromPlatform = document.getElementById('booking-from-platform').value;
    const toPlatform = document.getElementById('booking-to-platform').value;

    if (!fromPlatform || !toPlatform) {
      this.showAlert('Please select both platforms', 'error');
      return;
    }

    if (fromPlatform === toPlatform) {
      this.showAlert('Source and destination platforms must be different', 'error');
      return;
    }

    const availableVehicle = this.vehicles.find(v => v.status === 'available');
    
    if (!availableVehicle) {
      this.showAlert('No vehicles available at the moment. Please try again later.', 'warning');
      return;
    }

    const booking = {
      id: this.generateId(),
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      vehicleId: availableVehicle.id,
      fromPlatform,
      toPlatform,
      status: 'active',
      isPWD: this.currentUser.isPWD,
      pwdCategory: this.currentUser.pwdCategory,
      createdAt: new Date().toISOString(),
      completedAt: null,
      queuePosition: null
    };

    this.currentBooking = booking;
    this.bookings.push(booking);
    availableVehicle.status = 'assigned';
    availableVehicle.currentBooking = booking;

    this.saveToStorage();
    this.closeModal();
    this.showAlert('Booking confirmed! Vehicle assigned.', 'success');
    this.refreshTravelerDashboard();
  }

  // Complete active booking
  completeActiveBooking() {
    if (!this.currentBooking) return;

    const vehicle = this.vehicles.find(v => v.id === this.currentBooking.vehicleId);
    if (vehicle) {
      vehicle.status = 'available';
      vehicle.currentBooking = null;
    }

    this.currentBooking.status = 'completed';
    this.currentBooking.completedAt = new Date().toISOString();

    this.saveToStorage();
    this.showAlert('Booking completed successfully', 'success');
    this.refreshTravelerDashboard();
  }

  // Cancel active booking
  cancelActiveBooking() {
    if (!this.currentBooking) return;

    if (confirm('Are you sure you want to cancel this booking?')) {
      const vehicle = this.vehicles.find(v => v.id === this.currentBooking.vehicleId);
      if (vehicle) {
        vehicle.status = 'available';
        vehicle.currentBooking = null;
      }

      this.currentBooking.status = 'cancelled';
      this.currentBooking = null;

      this.saveToStorage();
      this.showAlert('Booking cancelled', 'warning');
      this.refreshTravelerDashboard();
    }
  }

  // Toggle driver duty status
  toggleDutyStatus() {
    const btn = document.getElementById('duty-status-btn');
    this.driverDutyActive = !this.driverDutyActive;

    if (this.driverDutyActive) {
      btn.textContent = 'End Duty';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-danger');
      this.showAlert('Duty started', 'success');
    } else {
      btn.textContent = 'Start Duty';
      btn.classList.remove('btn-danger');
      btn.classList.add('btn-primary');
      this.showAlert('Duty ended', 'info');
    }

    this.refreshDriverDashboard();
  }

  // Get sorted queue (PWD priority)
  getSortedQueue() {
    return this.bookings
      .filter(b => b.status === 'active' && !b.userId.startsWith('driver'))
      .sort((a, b) => {
        if (a.isPWD && !b.isPWD) return -1;
        if (!a.isPWD && b.isPWD) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  // Refresh traveler dashboard
  refreshTravelerDashboard() {
    document.getElementById('traveler-name').textContent = `PNR/UTS: ${this.currentUser.pnrUts}`;

    const activeBooking = this.currentBooking || this.bookings.find(b => b.userId === this.currentUser.id && b.status === 'active');

    if (activeBooking) {
      document.getElementById('active-booking-section').style.display = 'block';
      document.getElementById('active-booking-from').textContent = `Platform ${activeBooking.fromPlatform}`;
      document.getElementById('active-booking-to').textContent = `Platform ${activeBooking.toPlatform}`;
      document.getElementById('active-booking-vehicle').textContent = activeBooking.vehicleId;
      this.currentBooking = activeBooking;
    } else {
      document.getElementById('active-booking-section').style.display = 'none';
    }

    const userBookings = this.bookings.filter(b => b.userId === this.currentUser.id);
    const historyTable = document.getElementById('booking-history');
    
    if (userBookings.length === 0) {
      historyTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-gray-500);">No booking history yet</td></tr>';
    } else {
      historyTable.innerHTML = userBookings.map(b => `
        <tr>
          <td><strong>${b.id}</strong></td>
          <td>${new Date(b.createdAt).toLocaleDateString()} ${new Date(b.createdAt).toLocaleTimeString()}</td>
          <td>Platform ${b.fromPlatform}</td>
          <td>Platform ${b.toPlatform}</td>
          <td><span class="badge ${b.status === 'completed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : 'badge-info'}">${b.status}</span></td>
          <td>${b.completedAt ? this.calculateDuration(b.createdAt, b.completedAt) : '-'}</td>
        </tr>
      `).join('');
    }
  }

  // Refresh driver dashboard
  refreshDriverDashboard() {
    document.getElementById('driver-name').textContent = `Driver: ${this.currentUser.fullName}`;
    document.getElementById('vehicle-id').textContent = `BOV-001`;

    const queue = this.getSortedQueue();

    document.getElementById('stat-active').textContent = queue.length;
    document.getElementById('stat-pwd').textContent = queue.filter(b => b.isPWD).length;
    const completed = this.bookings.filter(b => b.status === 'completed' && new Date(b.completedAt).toDateString() === new Date().toDateString()).length;
    document.getElementById('stat-completed').textContent = completed;

    const queueContainer = document.getElementById('booking-queue');
    
    if (queue.length === 0) {
      queueContainer.innerHTML = '<div style="text-align: center; padding: var(--space-48);"><p class="text-muted">No active bookings in queue</p></div>';
    } else {
      queueContainer.innerHTML = queue.map((b, index) => `
        <div class="queue-item ${b.isPWD ? 'priority' : ''}">
          <div class="queue-item-header">
            <div class="queue-item-title">
              <h3>Queue Position #${index + 1}</h3>
              ${b.isPWD ? `<span class="badge badge-pwd">PWD Priority</span>` : ''}
            </div>
            <span class="status-badge status-pending">Waiting</span>
          </div>
          <div class="queue-item-details">
            <div class="queue-item-detail">
              <label>Passenger Name</label>
              <value>${b.userName}</value>
            </div>
            <div class="queue-item-detail">
              <label>From Platform</label>
              <value>Platform ${b.fromPlatform}</value>
            </div>
            <div class="queue-item-detail">
              <label>To Platform</label>
              <value>Platform ${b.toPlatform}</value>
            </div>
            <div class="queue-item-detail">
              <label>Request Time</label>
              <value>${new Date(b.createdAt).toLocaleTimeString()}</value>
            </div>
          </div>
          <div class="queue-item-actions">
            <button class="btn btn-sm btn-success" onclick="app.acceptBooking('${b.id}')">Accept</button>
            <button class="btn btn-sm btn-danger" onclick="app.rejectBooking('${b.id}')">Reject</button>
          </div>
        </div>
      `).join('');
    }
  }

  // Accept booking
  acceptBooking(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'in-progress';
      this.saveToStorage();
      this.showAlert(`Booking ${bookingId} accepted. Heading to Platform ${booking.fromPlatform}`, 'success');
      this.refreshDriverDashboard();
    }
  }

  // Reject booking
  rejectBooking(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'rejected';
      const vehicle = this.vehicles.find(v => v.id === booking.vehicleId);
      if (vehicle) {
        vehicle.status = 'available';
      }
      this.saveToStorage();
      this.showAlert('Booking rejected', 'warning');
      this.refreshDriverDashboard();
    }
  }

  // Navigate to page
  navigateTo(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');

    const header = document.getElementById('header');
    if (pageId === 'landing-page') {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }

    if (pageId === 'traveler-dashboard') {
      this.refreshTravelerDashboard();
    } else if (pageId === 'driver-dashboard') {
      this.refreshDriverDashboard();
    }

    if (pageId === 'login-page') {
      document.getElementById('login-step-1').style.display = 'block';
      document.getElementById('login-step-2').style.display = 'none';
      document.getElementById('step1').classList.add('active');
      document.getElementById('step1').classList.remove('completed');
      document.getElementById('step2').classList.remove('active');
      document.getElementById('login-form-step1').reset();
      document.getElementById('login-form-step2').reset();
    }
  }

  // Logout
  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.currentUser = null;
      this.currentBooking = null;
      this.driverDutyActive = false;
      this.currentRole = null;
      sessionStorage.clear();
      this.navigateTo('landing-page');
      this.showAlert('Logged out successfully', 'info');
    }
  }

  // Close modal
  closeModal() {
    document.getElementById('booking-modal').classList.remove('active');
  }

  // Show alert
  showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = 'var(--space-20)';
    alertDiv.style.right = 'var(--space-20)';
    alertDiv.style.maxWidth = '400px';
    alertDiv.style.zIndex = '2000';
    alertDiv.innerHTML = `
      <div class="alert-content">
        <p>${message}</p>
      </div>
    `;

    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 4000);
  }

  // Validate email
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Generate ID
  generateId() {
    return 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  // Calculate duration
  calculateDuration(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = Math.floor((end - start) / 1000 / 60);
    return `${diff} min`;
  }

  // Save to storage
  saveToStorage() {
    sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    sessionStorage.setItem('bookings', JSON.stringify(this.bookings));
    sessionStorage.setItem('vehicles', JSON.stringify(this.vehicles));
  }

  // Load from storage
  loadFromStorage() {
    const user = sessionStorage.getItem('currentUser');
    const bookings = sessionStorage.getItem('bookings');
    const vehicles = sessionStorage.getItem('vehicles');

    if (user) this.currentUser = JSON.parse(user);
    if (bookings) this.bookings = JSON.parse(bookings);
    if (vehicles) this.vehicles = JSON.parse(vehicles);
  }
}

const app = new BOVBookingApp();

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
