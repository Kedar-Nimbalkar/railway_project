class BOVBookingApp {
  constructor() {
    this.currentRole = null;
    this.currentUser = null;
    this.currentBooking = null;
    this.vehicles = [];
    this.bookings = [];
    this.driverDutyActive = false;
    this.validationData = null;
    
    // Demo driver credentials
    this.demoDrivers = {
      'driver1': 'pass123',
      'driver2': 'pass123'
    };
    
    this.initializeVehicles();
    this.loadFromStorage();
  }

  // Initialize vehicles
  initializeVehicles() {
    this.vehicles = [
      { id: 'BOV-001', status: 'available', capacity: 4, platform: 1 },
      { id: 'BOV-002', status: 'available', capacity: 4, platform: 2 },
      { id: 'BOV-003', status: 'available', capacity: 4, platform: 3 },
      { id: 'BOV-004', status: 'available', capacity: 4, platform: 4 },
      { id: 'BOV-005', status: 'available', capacity: 4, platform: 5 },
      { id: 'BOV-006', status: 'available', capacity: 4, platform: 6 },
      { id: 'BOV-007', status: 'available', capacity: 4, platform: 7 }
    ];
  }

  // Select user role
  selectRole(role) {
    this.currentRole = role;
    this.showLoginForm(role);
  }

  // Show login form based on role
  showLoginForm(role) {
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('login-page').classList.add('active');
    document.getElementById('header').classList.remove('hidden');
    document.getElementById('btn-back').style.display = 'block';

    if (role === 'traveler') {
      document.getElementById('login-title').textContent = 'Traveler Registration';
      document.getElementById('login-subtitle').textContent = 'Please provide your PNR/UTS details';
      document.getElementById('step-indicator').style.display = 'flex';
      document.getElementById('traveler-step-1').style.display = 'block';
      document.getElementById('traveler-step-2').style.display = 'none';
      document.getElementById('driver-login').style.display = 'none';
    } else {
      document.getElementById('login-title').textContent = 'Driver Login';
      document.getElementById('login-subtitle').textContent = 'Enter your credentials to access the driver portal';
      document.getElementById('step-indicator').style.display = 'none';
      document.getElementById('traveler-step-1').style.display = 'none';
      document.getElementById('traveler-step-2').style.display = 'none';
      document.getElementById('driver-login').style.display = 'block';
    }
  }

  // Handle traveler step 1
  handleTravelerStep1(event) {
    event.preventDefault();

    const pnrUts = document.getElementById('pnr-uts').value.trim();
    const travelType = document.getElementById('travel-type').value;
    const fromPlatform = document.getElementById('from-platform').value;
    const pwdCategory = document.getElementById('pwd-category').value;

    if (!pnrUts || pnrUts.length !== 10) {
      this.showAlert('Please enter a valid 10-digit PNR/UTS number', 'error');
      return;
    }

    if (!this.isValidPNRUTS(pnrUts)) {
      this.showAlert('PNR/UTS must contain only digits', 'error');
      return;
    }

    if (!travelType || !fromPlatform || !pwdCategory) {
      this.showAlert('Please fill all required fields', 'error');
      return;
    }

    this.validationData = { pnrUts, travelType, fromPlatform, pwdCategory };
    
    document.getElementById('traveler-step-1').style.display = 'none';
    document.getElementById('traveler-step-2').style.display = 'block';
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('active');
  }

  // Handle traveler step 2
  handleTravelerStep2(event) {
    event.preventDefault();

    const fullName = document.getElementById('full-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const destinationPlatform = document.getElementById('destination-platform').value;

    if (!fullName || !phone || !email || !destinationPlatform) {
      this.showAlert('Please fill all required fields', 'error');
      return;
    }

    if (!this.isValidPhone(phone)) {
      this.showAlert('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showAlert('Please enter a valid email address', 'error');
      return;
    }

    if (this.validationData.fromPlatform === destinationPlatform) {
      this.showAlert('Destination platform must be different from current platform', 'error');
      return;
    }

    this.currentUser = {
      id: this.generateId(),
      role: 'traveler',
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
    this.showAlert('Welcome! Redirecting to your dashboard...', 'success');
    this.updateHeader();
    
    setTimeout(() => {
      document.getElementById('login-page').classList.remove('active');
      document.getElementById('traveler-dashboard').classList.add('active');
      this.refreshTravelerDashboard();
    }, 1000);
  }

  // Handle driver login
  handleDriverLogin(event) {
    event.preventDefault();

    const username = document.getElementById('driver-username').value.trim();
    const password = document.getElementById('driver-password').value;

    if (!username || !password) {
      this.showAlert('Please enter username and password', 'error');
      return;
    }

    if (!this.demoDrivers[username] || this.demoDrivers[username] !== password) {
      this.showAlert('Invalid driver credentials', 'error');
      return;
    }

    this.currentUser = {
      id: this.generateId(),
      role: 'driver',
      driverId: username,
      fullName: username.charAt(0).toUpperCase() + username.slice(1),
      createdAt: new Date().toISOString()
    };

    this.saveToStorage();
    this.showAlert('Welcome Driver! Redirecting to portal...', 'success');
    this.updateHeader();

    setTimeout(() => {
      document.getElementById('login-page').classList.remove('active');
      document.getElementById('driver-dashboard').classList.add('active');
      this.refreshDriverDashboard();
    }, 1000);
  }

  // Back to traveler step 1
  backToTravelerStep1() {
    document.getElementById('traveler-step-2').style.display = 'none';
    document.getElementById('traveler-step-1').style.display = 'block';
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.remove('completed');
    document.getElementById('step1').classList.add('active');
  }

  // Back to landing
  backToLanding() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('landing-page').classList.add('active');
    document.getElementById('header').classList.add('hidden');
    document.getElementById('btn-back').style.display = 'none';
    document.getElementById('traveler-step-1').style.display = 'block';
    document.getElementById('traveler-step-2').style.display = 'none';
    document.getElementById('driver-login').style.display = 'none';
    
    document.getElementById('login-form-step1').reset();
    document.getElementById('login-form-step2').reset();
    
    this.validationData = null;
    this.currentRole = null;
  }

  // Start new booking
  startNewBooking() {
    if (this.currentBooking) {
      this.showAlert('You already have an active booking', 'warning');
      return;
    }

    document.getElementById('booking-modal').style.display = 'flex';
    document.getElementById('booking-from').value = this.currentUser.fromPlatform;
  }

  // Confirm booking
  confirmBooking(event) {
    event.preventDefault();

    const bookingFrom = document.getElementById('booking-from').value;
    const bookingTo = document.getElementById('booking-to').value;

    if (!bookingFrom || !bookingTo) {
      this.showAlert('Please select both platforms', 'error');
      return;
    }

    if (bookingFrom === bookingTo) {
      this.showAlert('Source and destination must be different', 'error');
      return;
    }

    const availableVehicle = this.vehicles.find(v => v.status === 'available');
    if (!availableVehicle) {
      this.showAlert('No vehicles available. Please try later', 'warning');
      return;
    }

    const booking = {
      id: this.generateId(),
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      phone: this.currentUser.phone,
      vehicleId: availableVehicle.id,
      fromPlatform: bookingFrom,
      toPlatform: bookingTo,
      status: 'active',
      isPWD: this.currentUser.isPWD,
      pwdCategory: this.currentUser.pwdCategory,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.currentBooking = booking;
    this.bookings.push(booking);
    availableVehicle.status = 'assigned';

    this.saveToStorage();
    this.closeModal();
    this.showAlert('Booking confirmed! Vehicle has been assigned', 'success');
    this.refreshTravelerDashboard();
  }

  // Complete booking
  completeBooking() {
    if (!this.currentBooking) {
      this.showAlert('No active booking', 'error');
      return;
    }

    const vehicle = this.vehicles.find(v => v.id === this.currentBooking.vehicleId);
    if (vehicle) {
      vehicle.status = 'available';
    }

    this.currentBooking.status = 'completed';
    this.currentBooking.completedAt = new Date().toISOString();

    this.saveToStorage();
    this.currentBooking = null;
    this.showAlert('Booking completed successfully', 'success');
    this.refreshTravelerDashboard();
  }

  // Cancel booking
  cancelBooking() {
    if (!this.currentBooking) {
      this.showAlert('No active booking', 'error');
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    const vehicle = this.vehicles.find(v => v.id === this.currentBooking.vehicleId);
    if (vehicle) {
      vehicle.status = 'available';
    }

    this.currentBooking.status = 'cancelled';
    this.currentBooking = null;

    this.saveToStorage();
    this.showAlert('Booking cancelled', 'warning');
    this.refreshTravelerDashboard();
  }

  // Toggle duty status
  toggleDutyStatus() {
    this.driverDutyActive = !this.driverDutyActive;
    const btn = document.getElementById('duty-btn');

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
      .filter(b => b.status === 'active')
      .sort((a, b) => {
        if (a.isPWD && !b.isPWD) return -1;
        if (!a.isPWD && b.isPWD) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  // Accept booking
  acceptBooking(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'in-progress';
      this.saveToStorage();
      this.showAlert(`Booking accepted. Heading to Platform ${booking.fromPlatform}`, 'success');
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

  // Refresh traveler dashboard
  refreshTravelerDashboard() {
    document.getElementById('traveler-info').textContent = `PNR: ${this.currentUser.pnrUts} | Platform: ${this.currentUser.fromPlatform}`;

    const activeSection = document.getElementById('active-booking-section');
    if (this.currentBooking && this.currentBooking.status === 'active') {
      activeSection.style.display = 'block';
      document.getElementById('active-from-platform').textContent = `Platform ${this.currentBooking.fromPlatform}`;
      document.getElementById('active-to-platform').textContent = `Platform ${this.currentBooking.toPlatform}`;
      document.getElementById('active-vehicle-id').textContent = this.currentBooking.vehicleId;
    } else {
      activeSection.style.display = 'none';
    }

    const userBookings = this.bookings.filter(b => b.userId === this.currentUser.id);
    const historyTable = document.getElementById('booking-history');

    if (userBookings.length === 0) {
      historyTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-gray-500); padding: var(--space-24);">No booking history</td></tr>';
    } else {
      historyTable.innerHTML = userBookings.map(b => `
        <tr>
          <td>${b.id}</td>
          <td>${new Date(b.createdAt).toLocaleDateString()} ${new Date(b.createdAt).toLocaleTimeString()}</td>
          <td>P ${b.fromPlatform}</td>
          <td>P ${b.toPlatform}</td>
          <td><span class="status-badge status-${b.status}">${b.status}</span></td>
          <td>${b.completedAt ? this.calculateDuration(b.createdAt, b.completedAt) : '-'}</td>
        </tr>
      `).join('');
    }
  }

  // Refresh driver dashboard
  refreshDriverDashboard() {
    document.getElementById('driver-info').textContent = `Driver: ${this.currentUser.fullName}`;

    const queue = this.getSortedQueue();

    document.getElementById('stat-active').textContent = queue.length;
    document.getElementById('stat-pwd').textContent = queue.filter(b => b.isPWD).length;
    const completed = this.bookings.filter(b => b.status === 'completed').length;
    document.getElementById('stat-completed').textContent = completed;

    const queueContainer = document.getElementById('booking-queue');

    if (queue.length === 0) {
      queueContainer.innerHTML = '<div style="text-align: center; padding: var(--space-48); color: var(--color-gray-500);"><p>No active bookings in queue</p></div>';
    } else {
      queueContainer.innerHTML = queue.map((b, index) => `
        <div class="card" style="margin-bottom: var(--space-16); border-left: 4px solid ${b.isPWD ? 'var(--color-warning)' : 'var(--color-info)'};">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-16);">
            <h3>Queue Position #${index + 1}</h3>
            ${b.isPWD ? '<span class="badge" style="background: var(--color-warning); color: white;">PWD Priority</span>' : '<span class="badge" style="background: var(--color-info); color: white;">Standard</span>'}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-16); margin-bottom: var(--space-20);">
            <div>
              <p class="text-xs" style="color: var(--color-gray-500); margin-bottom: var(--space-4);">Passenger</p>
              <p style="font-weight: 600;">${b.userName}</p>
            </div>
            <div>
              <p class="text-xs" style="color: var(--color-gray-500); margin-bottom: var(--space-4);">Phone</p>
              <p style="font-weight: 600;">${b.phone}</p>
            </div>
            <div>
              <p class="text-xs" style="color: var(--color-gray-500); margin-bottom: var(--space-4);">Route</p>
              <p style="font-weight: 600;">Platform ${b.fromPlatform} to ${b.toPlatform}</p>
            </div>
            <div>
              <p class="text-xs" style="color: var(--color-gray-500); margin-bottom: var(--space-4);">Requested</p>
              <p style="font-weight: 600;">${new Date(b.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
          <div style="display: flex; gap: var(--space-12);">
            <button class="btn btn-success" style="flex: 1;" onclick="app.acceptBooking('${b.id}')">Accept</button>
            <button class="btn btn-danger" style="flex: 1;" onclick="app.rejectBooking('${b.id}')">Reject</button>
          </div>
        </div>
      `).join('');
    }
  }

  // Close modal
  closeModal(event) {
    if (event) event.preventDefault();
    document.getElementById('booking-modal').style.display = 'none';
    document.getElementById('booking-from').reset();
    document.getElementById('booking-to').value = '';
  }

  // Update header
  updateHeader() {
    const userInfo = document.getElementById('user-info');
    if (this.currentUser) {
      const role = this.currentUser.role === 'traveler' ? 'Traveler' : 'Driver';
      const name = this.currentUser.fullName;
      const pwdBadge = this.currentUser.isPWD ? ' (PWD)' : '';
      userInfo.innerHTML = `${name} - ${role}${pwdBadge}`;
    }
  }

  // Logout
  logout() {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }

    this.currentUser = null;
    this.currentBooking = null;
    this.driverDutyActive = false;
    this.currentRole = null;
    this.validationData = null;

    sessionStorage.clear();

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('landing-page').classList.add('active');
    document.getElementById('header').classList.add('hidden');
    document.getElementById('btn-back').style.display = 'none';

    this.showAlert('Logged out successfully', 'info');
  }

  // Show alert
  showAlert(message, type = 'info') {
    const container = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
      padding: var(--space-16);
      margin-bottom: var(--space-12);
      border-radius: var(--radius-md);
      animation: slideIn 0.3s ease;
    `;

    container.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
  }

  // Validation helpers
  isValidPNRUTS(value) {
    return /^\d{10}$/.test(value);
  }

  isValidPhone(value) {
    return /^\d{10}$/.test(value);
  }

  isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Generate ID
  generateId() {
    return 'ID-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // Calculate duration
  calculateDuration(start, end) {
    const diff = Math.floor((new Date(end) - new Date(start)) / 1000 / 60);
    return diff + ' min';
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

    if (this.currentUser) {
      this.updateHeader();
      if (this.currentUser.role === 'traveler') {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('traveler-dashboard').classList.add('active');
        document.getElementById('header').classList.remove('hidden');
        this.refreshTravelerDashboard();
      } else {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('driver-dashboard').classList.add('active');
        document.getElementById('header').classList.remove('hidden');
        this.refreshDriverDashboard();
      }
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new BOVBookingApp();
});
class BOVBookingApp {
  constructor() {
    this.currentRole = null;
    this.currentUser = null;
    this.currentBooking = null;
    this.vehicles = [];
    this.bookings = [];
    this.driverDutyActive = false;
    this.validationData = null;
    
    // Demo driver credentials
    this.demoDrivers = {
      'driver1': 'pass123',
      'driver2': 'pass123'
    };
    
    this.initializeVehicles();
    this.loadFromStorage();
  }

  // Initialize vehicles
  initializeVehicles() {
    this.vehicles = [
      { id: 'BOV-001', status: 'available', capacity: 4, platform: 1 },
      { id: 'BOV-002', status: 'available', capacity: 4, platform: 2 },
      { id: 'BOV-003', status: 'available', capacity: 4, platform: 3 },
      { id: 'BOV-004', status: 'available', capacity: 4, platform: 4 },
      { id: 'BOV-005', status: 'available', capacity: 4, platform: 5 },
      { id: 'BOV-006', status: 'available', capacity: 4, platform: 6 },
      { id: 'BOV-007', status: 'available', capacity: 4, platform: 7 }
    ];
  }

  // Select user role
  selectRole(role) {
    this.currentRole = role;
    this.showLoginForm(role);
  }

  // Show login form based on role
  showLoginForm(role) {
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('login-page').classList.add('active');
    document.getElementById('header').classList.remove('hidden');
    document.getElementById('btn-back').style.display = 'block';

    if (role === 'traveler') {
      document.getElementById('login-title').textContent = 'Traveler Registration';
      document.getElementById('login-subtitle').textContent = 'Please provide your PNR/UTS details';
      document.getElementById('step-indicator').style.display = 'flex';
      document.getElementById('traveler-step-1').style.display = 'block';
      document.getElementById('traveler-step-2').style.display = 'none';
      document.getElementById('driver-login').style.display = 'none';
    } else {
      document.getElementById('login-title').textContent = 'Driver Login';
      document.getElementById('login-subtitle').textContent = 'Enter your credentials to access the driver portal';
      document.getElementById('step-indicator').style.display = 'none';
      document.getElementById('traveler-step-1').style.display = 'none';
      document.getElementById('traveler-step-2').style.display = 'none';
      document.getElementById('driver-login').style.display = 'block';
    }
  }

  // Handle traveler step 1
  handleTravelerStep1(event) {
    event.preventDefault();

    const pnrUts = document.getElementById('pnr-uts').value.trim();
    const travelType = document.getElementById('travel-type').value;
    const fromPlatform = document.getElementById('from-platform').value;
    const pwdCategory = document.getElementById('pwd-category').value;

    if (!pnrUts || pnrUts.length !== 10) {
      this.showAlert('Please enter a valid 10-digit PNR/UTS number', 'error');
      return;
    }

    if (!this.isValidPNRUTS(pnrUts)) {
      this.showAlert('PNR/UTS must contain only digits', 'error');
      return;
    }

    if (!travelType || !fromPlatform || !pwdCategory) {
      this.showAlert('Please fill all required fields', 'error');
      return;
    }

    this.validationData = { pnrUts, travelType, fromPlatform, pwdCategory };
    
    document.getElementById('traveler-step-1').style.display = 'none';
    document.getElementById('traveler-step-2').style.display = 'block';
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step1').classList.add('completed');
    document.getElementById('step2').classList.add('active');
  }

  // Handle traveler step 2
  handleTravelerStep2(event) {
    event.preventDefault();

    const fullName = document.getElementById('full-name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const destinationPlatform = document.getElementById('destination-platform').value;

    if (!fullName || !phone || !email || !destinationPlatform) {
      this.showAlert('Please fill all required fields', 'error');
      return;
    }

    if (!this.isValidPhone(phone)) {
      this.showAlert('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showAlert('Please enter a valid email address', 'error');
      return;
    }

    if (this.validationData.fromPlatform === destinationPlatform) {
      this.showAlert('Destination platform must be different from current platform', 'error');
      return;
    }

    this.currentUser = {
      id: this.generateId(),
      role: 'traveler',
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
    this.showAlert('Welcome! Redirecting to your dashboard...', 'success');
    this.updateHeader();
    
    setTimeout(() => {
      document.getElementById('login-page').classList.remove('active');
      document.getElementById('traveler-dashboard').classList.add('active');
      this.refreshTravelerDashboard();
    }, 1000);
  }

  // Handle driver login
  handleDriverLogin(event) {
    event.preventDefault();

    const username = document.getElementById('driver-username').value.trim();
    const password = document.getElementById('driver-password').value;

    if (!username || !password) {
      this.showAlert('Please enter username and password', 'error');
      return;
    }

    if (!this.demoDrivers[username] || this.demoDrivers[username] !== password) {
      this.showAlert('Invalid driver credentials', 'error');
      return;
    }

    this.currentUser = {
      id: this.generateId(),
      role: 'driver',
      driverId: username,
      fullName: username.charAt(0).toUpperCase() + username.slice(1),
      createdAt: new Date().toISOString()
    };

    this.saveToStorage();
    this.showAlert('Welcome Driver! Redirecting to portal...', 'success');
    this.updateHeader();

    setTimeout(() => {
      document.getElementById('login-page').classList.remove('active');
      document.getElementById('driver-dashboard').classList.add('active');
      this.refreshDriverDashboard();
    }, 1000);
  }

  // Back to traveler step 1
  backToTravelerStep1() {
    document.getElementById('traveler-step-2').style.display = 'none';
    document.getElementById('traveler-step-1').style.display = 'block';
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.remove('completed');
    document.getElementById('step1').classList.add('active');
  }

  // Back to landing
  backToLanding() {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('landing-page').classList.add('active');
    document.getElementById('header').classList.add('hidden');
    document.getElementById('btn-back').style.display = 'none';
    document.getElementById('traveler-step-1').style.display = 'block';
    document.getElementById('traveler-step-2').style.display = 'none';
    document.getElementById('driver-login').style.display = 'none';
    
    document.getElementById('login-form-step1').reset();
    document.getElementById('login-form-step2').reset();
    
    this.validationData = null;
    this.currentRole = null;
  }

  // Start new booking
  startNewBooking() {
    if (this.currentBooking) {
      this.showAlert('You already have an active booking', 'warning');
      return;
    }

    document.getElementById('booking-modal').style.display = 'flex';
    document.getElementById('booking-from').value = this.currentUser.fromPlatform;
  }

  // Confirm booking
  confirmBooking(event) {
    event.preventDefault();

    const bookingFrom = document.getElementById('booking-from').value;
    const bookingTo = document.getElementById('booking-to').value;

    if (!bookingFrom || !bookingTo) {
      this.showAlert('Please select both platforms', 'error');
      return;
    }

    if (bookingFrom === bookingTo) {
      this.showAlert('Source and destination must be different', 'error');
      return;
    }

    const availableVehicle = this.vehicles.find(v => v.status === 'available');
    if (!availableVehicle) {
      this.showAlert('No vehicles available. Please try later', 'warning');
      return;
    }

    const booking = {
      id: this.generateId(),
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      phone: this.currentUser.phone,
      vehicleId: availableVehicle.id,
      fromPlatform: bookingFrom,
      toPlatform: bookingTo,
      status: 'active',
      isPWD: this.currentUser.isPWD,
      pwdCategory: this.currentUser.pwdCategory,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.currentBooking = booking;
    this.bookings.push(booking);
    availableVehicle.status = 'assigned';

    this.saveToStorage();
    this.closeModal();
    this.showAlert('Booking confirmed! Vehicle has been assigned', 'success');
    this.refreshTravelerDashboard();
  }

  // Complete booking
  completeBooking() {
    if (!this.currentBooking) {
      this.showAlert('No active booking', 'error');
      return;
    }

    const vehicle = this.vehicles.find(v => v.id === this.currentBooking.vehicleId);
    if (vehicle) {
      vehicle.status = 'available';
    }

    this.currentBooking.status = 'completed';
    this.currentBooking.completedAt = new Date().toISOString();

    this.saveToStorage();
    this.currentBooking = null;
    this.showAlert('Booking completed successfully', 'success');
    this.refreshTravelerDashboard();
  }

  // Cancel booking
  cancelBooking() {
    if (!this.currentBooking) {
      this.showAlert('No active booking', 'error');
      return;
    }

    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    const vehicle = this.vehicles.find(v => v.id === this.currentBooking.vehicleId);
    if (vehicle) {
      vehicle.status = 'available';
    }

    this.currentBooking.status = 'cancelled';
    this.currentBooking = null;

    this.saveToStorage();
    this.showAlert('Booking cancelled', 'warning');
    this.refreshTravelerDashboard();
  }

  // Toggle duty status
  toggleDutyStatus() {
    this.driverDutyActive = !this.driverDutyActive;
    const btn = document.getElementById('duty-btn');

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
      .filter(b => b.status === 'active')
      .sort((a, b) => {
        if (a.isPWD && !b.isPWD) return -1;
        if (!a.isPWD && b.isPWD) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  // Accept booking
  acceptBooking(bookingId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'in-progress';
      this.saveToStorage();
      this.showAlert(`Booking accepted. Heading to Platform ${booking.fromPlatform}`, 'success');
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

  // Refresh traveler dashboard
  refreshTravelerDashboard() {
    document.getElementById('traveler-info').textContent = `PNR: ${this.currentUser.pnrUts} | Platform: ${this.currentUser.fromPlatform}`;

    const activeSection = document.getElementById('active-booking-section');
    if (this.currentBooking && this.currentBooking.status === 'active') {
      activeSection.style.display = 'block';
      document.getElementById('active-from-platform').textContent = `Platform ${this.currentBooking.fromPlatform}`;
      document.getElementById('active-to-platform').textContent = `Platform ${this.currentBooking.toPlatform}`;
      document.getElementById('active-vehicle-id').textContent = this.currentBooking.vehicleId;
    } else {
      activeSection.style.display = 'none';
    }

    const userBookings = this.bookings.filter(b => b.userId === this.currentUser.id);
    const historyTable = document.getElementById('booking-history');

    if (userBookings.length === 0) {
      historyTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-gray-500); padding: var(--space-24);">No booking history</td></tr>';
    } else {
      historyTable.innerHTML = userBookings.map(b => `
        <tr>
          <td>${b.id}</td>
          <td>${new Date(b.createdAt).toLocaleDateString()} ${new Date(b.createdAt).toLocaleTimeString()}</td>
          <td>P ${b.fromPlatform}</td>
          <td>P ${b.toPlatform}</td>
          <td><span class="status-badge status-${b.status}">${b.status}</span></td>
          <td>${b.completedAt ? this.calculateDuration(b.createdAt, b.completedAt) : '-'}</td>
        </tr>
      `).join('');
    }
  }

  // Refresh driver dashboard
  refreshDriverDashboard() {
    document.getElementById('driver-info').textContent = `Driver: ${this.currentUser.fullName}`;

    const queue = this.getSortedQueue();

    document.getElementById('stat-active').textContent = queue.length;
    document.getElementById('stat-pwd').textContent = queue.filter(b => b.isPWD).length;
    const completed = this.bookings.filter(b => b.status === 'completed').length;
    document.getElementById('stat-completed').textContent = completed;

    const queueContainer = document.getElementById('booking-queue');

    if (queue.length === 0) {
      queueContainer.innerHTML = '<div style="text-align: center; padding: var(--space-48); color: var(--color-gray-500);"><p>No active bookings in queue</p></div>';
    } else {
      queueContainer.innerHTML = queue.map((b, index) => `
        <div class="card" style="margin-bottom: var(--space-16); border-left: 4px solid ${b.isPWD ? 'var(--color-warning)' : 'var(--color-info)'};">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-16);">
            <h3>Queue Position #${index + 1}</h3>
            ${b.isPWD ? '<span class="badge" style="background: var(--color-warning); color: white;">PWD Priority</span>' : '<span class="badge" style="background: var(--color-info); color: white;">Standard</span>'}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-16); margin-bottom: var(--space-20);">
            <div>
              <p class="text-xs" style="color: var(--color-gray-500); margin-bottom: var(--space-4);">Passenger</p>
              <p style="font-weight: 600;">${b.userName}</p>
            </div>
            <div>
              <p class="text-xs" style="color: var(--color-gray-500); margin-bottom: var(--space-4);">Phone</p>
              <p style="font-weight: 600;">${b.phone}</p>
            </div>
            <div>
              <p class="text-xs" style="color: var(--color-gray-500); margin-bottom: var(--space-4);">Route</p>
              <p style="font-weight: 600;">Platform ${b.fromPlatform} to ${b.toPlatform}</p>
            </div>
            <div>
              <p class="text-xs" style="color: var(--color-gray-500); margin-bottom: var(--space-4);">Requested</p>
              <p style="font-weight: 600;">${new Date(b.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>
          <div style="display: flex; gap: var(--space-12);">
            <button class="btn btn-success" style="flex: 1;" onclick="app.acceptBooking('${b.id}')">Accept</button>
            <button class="btn btn-danger" style="flex: 1;" onclick="app.rejectBooking('${b.id}')">Reject</button>
          </div>
        </div>
      `).join('');
    }
  }

  // Close modal
  closeModal(event) {
    if (event) event.preventDefault();
    document.getElementById('booking-modal').style.display = 'none';
    document.getElementById('booking-from').reset();
    document.getElementById('booking-to').value = '';
  }

  // Update header
  updateHeader() {
    const userInfo = document.getElementById('user-info');
    if (this.currentUser) {
      const role = this.currentUser.role === 'traveler' ? 'Traveler' : 'Driver';
      const name = this.currentUser.fullName;
      const pwdBadge = this.currentUser.isPWD ? ' (PWD)' : '';
      userInfo.innerHTML = `${name} - ${role}${pwdBadge}`;
    }
  }

  // Logout
  logout() {
    if (!confirm('Are you sure you want to logout?')) {
      return;
    }

    this.currentUser = null;
    this.currentBooking = null;
    this.driverDutyActive = false;
    this.currentRole = null;
    this.validationData = null;

    sessionStorage.clear();

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('landing-page').classList.add('active');
    document.getElementById('header').classList.add('hidden');
    document.getElementById('btn-back').style.display = 'none';

    this.showAlert('Logged out successfully', 'info');
  }

  // Show alert
  showAlert(message, type = 'info') {
    const container = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
      padding: var(--space-16);
      margin-bottom: var(--space-12);
      border-radius: var(--radius-md);
      animation: slideIn 0.3s ease;
    `;

    container.appendChild(alert);
    setTimeout(() => alert.remove(), 4000);
  }

  // Validation helpers
  isValidPNRUTS(value) {
    return /^\d{10}$/.test(value);
  }

  isValidPhone(value) {
    return /^\d{10}$/.test(value);
  }

  isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  // Generate ID
  generateId() {
    return 'ID-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  // Calculate duration
  calculateDuration(start, end) {
    const diff = Math.floor((new Date(end) - new Date(start)) / 1000 / 60);
    return diff + ' min';
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

    if (this.currentUser) {
      this.updateHeader();
      if (this.currentUser.role === 'traveler') {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('traveler-dashboard').classList.add('active');
        document.getElementById('header').classList.remove('hidden');
        this.refreshTravelerDashboard();
      } else {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('driver-dashboard').classList.add('active');
        document.getElementById('header').classList.remove('hidden');
        this.refreshDriverDashboard();
      }
    }
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new BOVBookingApp();
});
