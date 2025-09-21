// Application State
let currentUser = null;
let events = [];
let favoriteEvents = [];
let currentSlide = { current: 0, upcoming: 0 };
let featuredEvents = [];
let currentHeroSlide = 0;

// API Configuration
const API_BASE_URL = '/api';

// API Helper Functions
async function fetchEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();
        if (data.success) {
            return data.events;
        }
        return [];
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

async function fetchPromos() {
    try {
        const response = await fetch(`${API_BASE_URL}/promos`);
        const data = await response.json();
        if (data.success) {
            return data.promos;
        }
        return [];
    } catch (error) {
        console.error('Error fetching promos:', error);
        return [];
    }
}

// Sample Event Data
const sampleEvents = {
    current: [
        {
            id: 1,
            title: "Jakarta Jazz Festival",
            description: "The biggest jazz festival in Southeast Asia featuring international and local artists.",
            date: "2024-03-15",
            endDate: "2024-03-17",
            location: "JIExpo Kemayoran",
            price: "750000",
            image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            badge: "Live Now",
            isFavorite: false
        },
        {
            id: 2,
            title: "Food Truck Festival",
            description: "A culinary adventure with the best food trucks from around the city.",
            date: "2024-03-20",
            endDate: "2024-03-22",
            location: "Senayan Park",
            price: "150000",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            badge: "Live Now",
            isFavorite: false
        },
        {
            id: 3,
            title: "Digital Art Exhibition",
            description: "Explore the future of art through immersive digital experiences.",
            date: "2024-03-18",
            endDate: "2024-03-30",
            location: "Museum Nasional",
            price: "100000",
            image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            badge: "Popular",
            isFavorite: false
        }
    ],
    upcoming: [
        {
            id: 4,
            title: "Summer Music Festival",
            description: "Experience the ultimate summer music festival with world-class artists.",
            date: "2024-06-15",
            endDate: "2024-06-17",
            location: "Central Park, Jakarta",
            price: "500000",
            image: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            badge: "Early Bird",
            isFavorite: false
        },
        {
            id: 5,
            title: "Tech Conference 2024",
            description: "Join industry leaders for the biggest tech conference of the year.",
            date: "2024-08-10",
            endDate: "2024-08-12",
            location: "Jakarta Convention Center",
            price: "1200000",
            image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            badge: "Limited",
            isFavorite: false
        },
        {
            id: 6,
            title: "Yoga Retreat Weekend",
            description: "Find your inner peace in this relaxing yoga retreat by the beach.",
            date: "2024-05-25",
            endDate: "2024-05-27",
            location: "Bali, Indonesia",
            price: "850000",
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            badge: "Wellness",
            isFavorite: false
        }
    ]
};

// Promo Data for QR Scanner
const promos = {
    "IKOOT2024": {
        title: "Welcome Discount",
        description: "Get 20% off your first event ticket!",
        discount: 20,
        type: "discount"
    },
    "JAZZ50": {
        title: "Jazz Festival Special",
        description: "50% off for Jazz Festival tickets!",
        discount: 50,
        type: "discount"
    },
    "FREEGIFT": {
        title: "Free Event T-Shirt",
        description: "Get a free Ikoot event t-shirt with your next purchase!",
        discount: 0,
        type: "gift"
    }
};

// DOM Elements
const elements = {
    hamburgerBtn: document.getElementById('hamburgerBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    loginModal: document.getElementById('loginModal'),
    signupModal: document.getElementById('signupModal'),
    qrModal: document.getElementById('qrModal'),
    loading: document.getElementById('loading'),
    bottomNavItems: document.querySelectorAll('.bottom-nav-item'),
    currentEventsCarousel: document.getElementById('currentEventsCarousel'),
    upcomingEventsCarousel: document.getElementById('upcomingEventsCarousel')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadEvents();
    updateFeaturedEvent();
});

function initializeApp() {
    // Load user data from localStorage
    const savedUser = localStorage.getItem('ikoot_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        console.log('Found saved user:', currentUser);
        
        // Load fresh user profile from backend
        loadUserProfile();
    }
    
    // Update auth state (this will handle hamburger visibility)
    updateAuthState();

    // Load favorite events
    const savedFavorites = localStorage.getItem('ikoot_favorites');
    if (savedFavorites) {
        favoriteEvents = JSON.parse(savedFavorites);
    }

    // Load events data
    events = { ...sampleEvents };
}

function setupEventListeners() {
    // Mobile menu toggle
    elements.hamburgerBtn?.addEventListener('click', toggleMobileMenu);

    // Auth buttons
    elements.loginBtn?.addEventListener('click', () => openModal('loginModal'));
    elements.signupBtn?.addEventListener('click', () => openModal('signupModal'));
    
    // Mobile auth buttons
    document.querySelector('.mobile-login')?.addEventListener('click', () => {
        closeMobileMenu();
        openModal('loginModal');
    });
    
    document.querySelector('.mobile-signup')?.addEventListener('click', () => {
        closeMobileMenu();
        openModal('signupModal');
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Modal background click to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Auth form switching
    document.getElementById('switchToSignup')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('signupModal');
    });

    document.getElementById('switchToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('signupModal');
        openModal('loginModal');
    });

    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);

    // Bottom navigation
    elements.bottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => handleBottomNavClick(e));
    });

    // Carousel navigation
    setupCarouselNavigation();
    
    // Hero carousel navigation will be set up when featured events are loaded
}

function toggleMobileMenu() {
    elements.hamburgerBtn.classList.toggle('active');
    elements.mobileMenu.classList.toggle('active');
}

function closeMobileMenu() {
    elements.hamburgerBtn.classList.remove('active');
    elements.mobileMenu.classList.remove('active');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showLoading() {
    elements.loading.classList.add('active');
}

function hideLoading() {
    elements.loading.classList.remove('active');
}

async function handleLogin(e) {
    e.preventDefault();
    showLoading();

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            currentUser.token = data.token;
            
            localStorage.setItem('ikoot_user', JSON.stringify(currentUser));
            updateAuthState();
            closeModal('loginModal');
            showToast('Login successful!', 'success');
            
            // Load user's current points
            await loadUserProfile();
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    }
    
    hideLoading();
}

async function handleSignup(e) {
    e.preventDefault();
    showLoading();

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        hideLoading();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            currentUser.token = data.token;
            
            localStorage.setItem('ikoot_user', JSON.stringify(currentUser));
            updateAuthState();
            closeModal('signupModal');
            showToast('Account created successfully!', 'success');
            
            // Load user's current points
            await loadUserProfile();
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Registration failed. Please try again.', 'error');
    }
    
    hideLoading();
}

// Load user profile with current points from backend
async function loadUserProfile() {
    if (!currentUser || !currentUser.email) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/user/profile`, {
            headers: {
                'x-user-email': currentUser.email
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.user) {
            // Update current user with latest points
            currentUser.points = data.user.points;
            localStorage.setItem('ikoot_user', JSON.stringify(currentUser));
            
            // Update UI elements
            updatePointsDisplay();
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Update points display in UI
function updatePointsDisplay() {
    if (currentUser && currentUser.points !== undefined) {
        const pointsElements = document.querySelectorAll('.user-points, [data-user-points]');
        pointsElements.forEach(element => {
            element.textContent = `${currentUser.points} points`;
        });
    }
}

function updateAuthState() {
    // Update UI based on authentication state
    const hamburgerBtn = elements.hamburgerBtn;
    const userGreeting = document.getElementById('userGreeting');
    const desktopAuthButtons = document.getElementById('desktopAuthButtons');
    const mobileAuth = document.querySelector('.mobile-auth');
    const userName = document.getElementById('userName');
    
    console.log('UpdateAuthState called, currentUser:', currentUser); // Debug log
    
    if (currentUser) {
        console.log('User is logged in, hiding auth buttons'); // Debug log
        
        // Show user greeting
        if (userGreeting && userName) {
            userName.textContent = currentUser.name;
            userGreeting.classList.add('visible');
            userGreeting.style.display = 'flex';
        }
        
        // Hide auth buttons using CSS classes
        if (desktopAuthButtons) {
            desktopAuthButtons.classList.add('hidden');
        }
        if (mobileAuth) {
            mobileAuth.classList.add('hidden');
        }
        
        // Show hamburger menu for logged-in users
        if (hamburgerBtn) {
            hamburgerBtn.style.display = 'flex';
        }
        
        // Update mobile menu logout handler
        const logoutItem = document.querySelector('.logout-item');
        if (logoutItem) {
            logoutItem.removeEventListener('click', logout); // Remove existing listener
            logoutItem.addEventListener('click', logout);
        }
    } else {
        console.log('User is not logged in, showing auth buttons'); // Debug log
        
        // Hide user greeting
        if (userGreeting) {
            userGreeting.classList.remove('visible');
            userGreeting.style.display = 'none';
        }
        
        // Show auth buttons using CSS classes
        if (desktopAuthButtons) {
            desktopAuthButtons.classList.remove('hidden');
        }
        if (mobileAuth) {
            mobileAuth.classList.remove('hidden');
        }
        
        // Hide hamburger menu for non-logged-in users
        if (hamburgerBtn) {
            hamburgerBtn.style.display = 'none';
        }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('ikoot_user');
    localStorage.removeItem('ikoot_favorites');
    favoriteEvents = [];
    
    // Reset UI using CSS classes
    const desktopAuthButtons = document.getElementById('desktopAuthButtons');
    const mobileAuth = document.querySelector('.mobile-auth');
    const userGreeting = document.getElementById('userGreeting');
    
    if (desktopAuthButtons) {
        desktopAuthButtons.classList.remove('hidden');
    }
    if (mobileAuth) {
        mobileAuth.classList.remove('hidden');
    }
    if (userGreeting) {
        userGreeting.classList.remove('visible');
    }
    
    closeMobileMenu();
    showToast('Logged out successfully', 'success');
    
    // Call updateAuthState to ensure proper state
    updateAuthState();
}

// Show My Points modal
function showMyPoints() {
    if (!currentUser) {
        showToast('Please login to view your points', 'error');
        openModal('loginModal');
        return;
    }
    
    closeMobileMenu();
    openModal('myPointsModal');
    loadUserPoints();
}

// Load user points and check-in history
async function loadUserPoints() {
    try {
        const pointsContent = document.getElementById('myPointsContent');
        
        // Show loading state
        pointsContent.innerHTML = `
            <div class="loading-spinner" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #1976D2;"></i>
                <p>Loading your points...</p>
            </div>
        `;
        
        // Fetch user points from backend
        const response = await fetch(`${API_BASE_URL}/users/${currentUser.id}/points`);
        const data = await response.json();
        
        if (data.success) {
            displayUserPoints(data.user);
        } else {
            throw new Error(data.message || 'Failed to load points');
        }
        
    } catch (error) {
        console.error('Error loading user points:', error);
        
        const pointsContent = document.getElementById('myPointsContent');
        pointsContent.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 40px; color: #f44336;">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <p>Failed to load your points</p>
                <p style="font-size: 0.9rem; opacity: 0.8;">${error.message}</p>
                <button class="btn btn-primary" onclick="loadUserPoints()" style="margin-top: 15px;">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Display user points and check-in history
function displayUserPoints(user) {
    const pointsContent = document.getElementById('myPointsContent');
    
    const recentCheckIns = user.check_ins.slice(0, 5); // Show last 5 check-ins
    
    pointsContent.innerHTML = `
        <div class="points-summary">
            <div class="points-card">
                <div class="points-header">
                    <i class="fas fa-star" style="color: #FFD700; font-size: 2.5rem;"></i>
                    <div class="points-info">
                        <h3>${user.points}</h3>
                        <p>Total Points</p>
                    </div>
                </div>
                <div class="points-stats">
                    <div class="stat-item">
                        <strong>${user.total_check_ins}</strong>
                        <span>Events Attended</span>
                    </div>
                    <div class="stat-item">
                        <strong>${user.points}</strong>
                        <span>Points Earned</span>
                    </div>
                </div>
            </div>
        </div>
        
        ${recentCheckIns.length > 0 ? `
            <div class="checkin-history">
                <h3><i class="fas fa-history"></i> Recent Check-ins</h3>
                <div class="checkin-list">
                    ${recentCheckIns.map(checkin => `
                        <div class="checkin-item">
                            <div class="checkin-info">
                                <h4>${checkin.event_title}</h4>
                                <p class="checkin-date">
                                    <i class="fas fa-calendar"></i> 
                                    ${new Date(checkin.checked_in_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div class="points-badge">
                                +${checkin.points_earned}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${user.check_ins.length > 5 ? `
                    <p style="text-align: center; margin-top: 15px; opacity: 0.7;">
                        Showing ${recentCheckIns.length} of ${user.check_ins.length} check-ins
                    </p>
                ` : ''}
            </div>
        ` : `
            <div class="no-checkins" style="text-align: center; padding: 40px; opacity: 0.7;">
                <i class="fas fa-calendar-plus" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <p>No check-ins yet!</p>
                <p style="font-size: 0.9rem;">Scan event QR codes to earn points</p>
            </div>
        `}
        
        <div class="points-info-card">
            <h4><i class="fas fa-info-circle"></i> How to Earn Points</h4>
            <ul>
                <li><strong>+5 points</strong> for each event check-in</li>
                <li>Scan QR codes at events to check in</li>
                <li>Points are awarded instantly</li>
            </ul>
        </div>
    `;
}

function handleBottomNavClick(e) {
    const clickedItem = e.currentTarget;
    const page = clickedItem.dataset.page;

    // Update active state
    elements.bottomNavItems.forEach(item => item.classList.remove('active'));
    clickedItem.classList.add('active');

    // Handle navigation
    switch (page) {
        case 'home':
            // Already on home page
            break;
        case 'qr-scanner':
            if (currentUser) {
                openQRScanner();
            } else {
                showToast('Please login to use QR Scanner', 'error');
                openModal('loginModal');
            }
            break;
        case 'my-events':
            if (currentUser) {
                showMyEvents();
            } else {
                showToast('Please login to view your events', 'error');
                openModal('loginModal');
            }
            break;
        case 'profile':
            if (currentUser) {
                showProfile();
            } else {
                showToast('Please login to view profile', 'error');
                openModal('loginModal');
            }
            break;
    }
}

async function loadEvents() {
    try {
        showLoading();
        console.log('Starting to load events...');
        
        // Load all events from backend
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();
        console.log('Events data from backend:', data);
        
        if (data.success && data.events) {
            const allEvents = data.events;
            
            // Categorize events by status
            const currentEvents = allEvents.filter(event => 
                event.status === 'live' || event.status === 'active'
            );
            const upcomingEvents = allEvents.filter(event => 
                event.status === 'upcoming'
            );
            const featuredEventsData = allEvents.filter(event => 
                event.featured === true || event.featured === 'true' || event.featured === 1 || event.featured === '1'
            );
            
            console.log('All events from API:', allEvents.map(e => ({ id: e.id, title: e.title, featured: e.featured, type: typeof e.featured })));
            console.log('Featured events filter result:', featuredEventsData);
            
            // Update events object
            events.current = currentEvents;
            events.upcoming = upcomingEvents;
            featuredEvents = featuredEventsData;
            
            console.log('Current events:', currentEvents.length);
            console.log('Upcoming events:', upcomingEvents.length);
            console.log('Featured events:', featuredEventsData.length);
            
            // Render carousels
            renderEventCarousel('current', currentEvents);
            renderEventCarousel('upcoming', upcomingEvents);
            
            // Update featured banner
            if (featuredEventsData.length > 0) {
                updateFeaturedEventsBanner(featuredEventsData);
            } else {
                // Use first few events as featured if no explicitly featured events
                const fallbackFeatured = allEvents.slice(0, 3);
                updateFeaturedEventsBanner(fallbackFeatured);
            }
            
        } else {
            console.log('Backend API failed or returned no events, using sample data');
            // Fallback to sample data
            events = { ...sampleEvents };
            renderEventCarousel('current', events.current);
            renderEventCarousel('upcoming', events.upcoming);
            updateFeaturedEvent();
        }
        
    } catch (error) {
        console.error('Error loading events:', error);
        // Fallback to sample data
        events = { ...sampleEvents };
        console.log('Using fallback sample events data');
        renderEventCarousel('current', events.current);
        renderEventCarousel('upcoming', events.upcoming);
        updateFeaturedEvent();
    } finally {
        hideLoading();
    }
}

function updateFeaturedEventsBanner(events) {
    console.log('updateFeaturedEventsBanner called with events:', events);
    
    if (!events || events.length === 0) {
        console.log('No events provided to updateFeaturedEventsBanner');
        return;
    }
    
    const heroCarousel = document.getElementById('heroCarousel');
    const heroIndicators = document.getElementById('heroIndicators');
    
    console.log('Hero elements found:', { heroCarousel: !!heroCarousel, heroIndicators: !!heroIndicators });
    
    if (!heroCarousel || !heroIndicators) {
        console.error('Hero carousel elements not found');
        return;
    }
    
    // Create slides for each featured event
    heroCarousel.innerHTML = events.map((event, index) => {
        const imageUrl = event.image_url || event.image || 'images/default-event.svg';
        const eventDate = event.start_date || event.date;
        const endDate = event.end_date || event.endDate;
        const description = event.short_description || event.description;
        
        return `
            <div class="hero-slide" data-event-id="${event.id}">
                <div class="hero-text">
                    <h2>Featured Event</h2>
                    <h1>${event.title}</h1>
                    <p>${description}</p>
                    <div class="hero-event-info">
                        <div class="event-date">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(eventDate)}${endDate ? ' - ' + formatDate(endDate) : ''}</span>
                        </div>
                        <div class="event-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location}</span>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-large" onclick="showEventDetails(${event.id})">View Details</button>
                </div>
            </div>
        `;
    }).join('');
    
    // Create indicators
    heroIndicators.innerHTML = events.map((_, index) => 
        `<div class="hero-indicator ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`
    ).join('');
    
    // Set background image of first event
    const heroBanner = document.querySelector('.hero-banner');
    const firstEvent = events[0];
    const firstImageUrl = firstEvent.image_url || firstEvent.image || 'images/default-event.svg';
    if (firstImageUrl) {
        heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${firstImageUrl}'), url('images/default-event.svg')`;
    }
    
    // Set up event listeners for the hero carousel
    setupHeroCarouselNavigation();
    
    // Reset to first slide
    currentHeroSlide = 0;
    
    console.log('Featured events banner updated with', events.length, 'events');
}

function renderEventCarousel(type, eventList) {
    console.log('Rendering', type, 'carousel with', eventList.length, 'events');
    const carousel = type === 'current' 
        ? elements.currentEventsCarousel 
        : elements.upcomingEventsCarousel;
    
    if (!carousel) {
        console.error('Carousel element not found for type:', type);
        return;
    }
    
    console.log('Carousel element found:', carousel);

    // Add badge logic
    const addBadge = (event) => {
        if (event.featured) return 'Featured';
        if (event.status === 'live') return 'Live Now';
        if (event.status === 'upcoming') return 'Coming Soon';
        return event.category || 'Event';
    };

    carousel.innerHTML = eventList.map(event => {
        // Handle both API data format and sample data format
        const imageUrl = event.image_url || event.image || 'images/default-event.svg';
        const eventDate = event.start_date || event.date;
        const description = event.short_description || event.description;
        const price = typeof event.price === 'string' ? event.price : event.price.toString();
        
        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-image" style="background-image: url('${imageUrl}'), url('images/default-event.svg'); background-size: cover; background-position: center;">
                    <div class="event-badge">${addBadge(event)}</div>
                </div>
                <div class="event-details">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-meta">
                        <div class="event-date-small">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(eventDate)}${event.end_date || event.endDate ? ' - ' + formatDate(event.end_date || event.endDate) : ''}</span>
                        </div>
                        <div class="event-location-small">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location}</span>
                        </div>
                    </div>
                    <p class="event-description">${description}</p>
                </div>
            </div>
        `;
    }).join('');

    // Add click handlers for favorite toggle
    carousel.querySelectorAll('.event-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn')) {
                const eventId = parseInt(card.dataset.eventId);
                showEventDetails(eventId);
            }
        });
    });

    // Reset carousel position
    carousel.style.transform = 'translateX(0px)';
    currentSlide[type] = 0;
    
    // Add touch support for mobile
    addCarouselTouchSupport(carousel, type);
    
    console.log('Carousel rendering completed for', type, '- HTML length:', carousel.innerHTML.length);
}

function setupCarouselNavigation() {
    console.log('Setting up carousel navigation...');
    
    // Current events carousel
    const currentEventsPrev = document.getElementById('currentEventsPrev');
    const currentEventsNext = document.getElementById('currentEventsNext');
    
    console.log('Current events buttons found:', {
        prev: !!currentEventsPrev,
        next: !!currentEventsNext
    });
    
    currentEventsPrev?.addEventListener('click', () => {
        console.log('Current events prev clicked');
        slideCarousel('current', -1);
    });
    
    currentEventsNext?.addEventListener('click', () => {
        console.log('Current events next clicked');
        slideCarousel('current', 1);
    });

    // Upcoming events carousel
    const upcomingEventsPrev = document.getElementById('upcomingEventsPrev');
    const upcomingEventsNext = document.getElementById('upcomingEventsNext');
    
    console.log('Upcoming events buttons found:', {
        prev: !!upcomingEventsPrev,
        next: !!upcomingEventsNext
    });
    
    upcomingEventsPrev?.addEventListener('click', () => {
        console.log('Upcoming events prev clicked');
        slideCarousel('upcoming', -1);
    });
    
    upcomingEventsNext?.addEventListener('click', () => {
        console.log('Upcoming events next clicked');
        slideCarousel('upcoming', 1);
    });
    
    console.log('Carousel navigation setup completed');
}

function slideCarousel(type, direction) {
    console.log('slideCarousel called:', { type, direction, currentSlide: currentSlide[type] });
    
    const carousel = type === 'current' 
        ? elements.currentEventsCarousel 
        : elements.upcomingEventsCarousel;
    
    if (!carousel) {
        console.error('Carousel element not found for type:', type);
        return;
    }
    
    const eventList = events[type];
    if (!eventList || eventList.length === 0) {
        console.log('No events found for type:', type);
        return;
    }
    
    console.log('Event list length:', eventList.length);
    
    const maxSlides = Math.max(0, eventList.length - 3);
    const newSlide = Math.max(0, Math.min(maxSlides, currentSlide[type] + direction));
    
    console.log('Slide calculation:', { maxSlides, currentSlide: currentSlide[type], newSlide });
    
    // Check if there's actually a change needed
    if (newSlide === currentSlide[type]) {
        console.log('No slide change needed');
        return;
    }
    
    currentSlide[type] = newSlide;
    
    // Dynamically calculate card width and gap from CSS
    const eventCard = carousel.querySelector('.event-card');
    let cardWidth = 320; // Default fallback
    
    if (eventCard) {
        const cardRect = eventCard.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(carousel);
        const gap = parseInt(computedStyle.gap) || 20;
        
        // Use computed width if available and greater than 0, otherwise fallback
        if (cardRect.width > 0) {
            cardWidth = cardRect.width + gap;
            console.log('Dynamic calculation - Card width:', cardRect.width, 'Gap:', gap, 'Total:', cardWidth);
        } else {
            // Try getting width from CSS if getBoundingClientRect returns 0
            const cardStyle = window.getComputedStyle(eventCard);
            const cssWidth = parseInt(cardStyle.width) || 300;
            cardWidth = cssWidth + gap;
            console.log('Using CSS width fallback - Card width:', cssWidth, 'Gap:', gap, 'Total:', cardWidth);
        }
    } else {
        console.log('Using default fallback card width:', cardWidth);
    }
    
    const translateX = -currentSlide[type] * cardWidth;
    console.log('Applying transform:', `translateX(${translateX}px)`);
    
    carousel.style.transition = 'transform 0.3s ease';
    carousel.style.transform = `translateX(${translateX}px)`;
}


function addCarouselTouchSupport(carousel, type) {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    // Helper function to get card width
    function getCardWidth() {
        const eventCard = carousel.querySelector('.event-card');
        if (eventCard) {
            const cardRect = eventCard.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(carousel);
            const gap = parseInt(computedStyle.gap) || 20;
            
            // Use computed width if available and greater than 0, otherwise fallback
            if (cardRect.width > 0) {
                return cardRect.width + gap;
            } else {
                // Try getting width from CSS if getBoundingClientRect returns 0
                const cardStyle = window.getComputedStyle(eventCard);
                const cssWidth = parseInt(cardStyle.width) || 300;
                return cssWidth + gap;
            }
        }
        return 320; // Default fallback
    }
    
    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        carousel.style.transition = 'none';
    });
    
    carousel.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        const cardWidth = getCardWidth();
        const currentTransform = -currentSlide[type] * cardWidth;
        carousel.style.transform = `translateX(${currentTransform + diffX}px)`;
    });
    
    carousel.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        
        const diffX = currentX - startX;
        const threshold = 100;
        
        carousel.style.transition = 'transform 0.3s ease';
        
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) {
                // Swipe right - previous
                slideCarousel(type, -1);
            } else {
                // Swipe left - next
                slideCarousel(type, 1);
            }
        } else {
            // Snap back to current position
            const cardWidth = getCardWidth();
            const translateX = -currentSlide[type] * cardWidth;
            carousel.style.transform = `translateX(${translateX}px)`;
        }
    });
}

function setupHeroCarouselNavigation() {
    // Hero carousel previous button
    document.getElementById('heroPrev')?.addEventListener('click', () => {
        slideHeroCarousel(-1);
    });
    
    // Hero carousel next button
    document.getElementById('heroNext')?.addEventListener('click', () => {
        slideHeroCarousel(1);
    });
    
    // Hero carousel indicators
    document.querySelectorAll('.hero-indicator').forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            const slideIndex = parseInt(e.target.dataset.slide);
            goToHeroSlide(slideIndex);
        });
    });
}

function slideHeroCarousel(direction) {
    if (!featuredEvents || featuredEvents.length <= 1) return;
    
    const maxSlide = featuredEvents.length - 1;
    currentHeroSlide += direction;
    
    // Loop around
    if (currentHeroSlide > maxSlide) {
        currentHeroSlide = 0;
    } else if (currentHeroSlide < 0) {
        currentHeroSlide = maxSlide;
    }
    
    updateHeroSlide();
}

function goToHeroSlide(slideIndex) {
    if (!featuredEvents || slideIndex >= featuredEvents.length || slideIndex < 0) return;
    
    currentHeroSlide = slideIndex;
    updateHeroSlide();
}

function updateHeroSlide() {
    const heroCarousel = document.getElementById('heroCarousel');
    const indicators = document.querySelectorAll('.hero-indicator');
    const heroBanner = document.querySelector('.hero-banner');
    
    if (!heroCarousel || !featuredEvents || featuredEvents.length === 0) return;
    
    // Move carousel
    const translateX = -currentHeroSlide * 100;
    heroCarousel.style.transform = `translateX(${translateX}%)`;
    
    // Update indicators
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentHeroSlide);
    });
    
    // Update background image
    const currentEvent = featuredEvents[currentHeroSlide];
    const imageUrl = currentEvent.image_url || currentEvent.image;
    if (imageUrl && heroBanner) {
        heroBanner.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageUrl}')`;
    }
    
    console.log('Hero slide updated to index:', currentHeroSlide);
}

function updateFeaturedEvent() {
    const featuredEvent = events.upcoming[0]; // Use first upcoming event as featured
    if (!featuredEvent) return;

    document.getElementById('heroEventTitle').textContent = featuredEvent.title;
    document.getElementById('heroEventDescription').textContent = featuredEvent.description;
    document.getElementById('heroEventDate').textContent = `${formatDate(featuredEvent.date)} - ${formatDate(featuredEvent.endDate)}`;
    document.getElementById('heroEventLocation').textContent = featuredEvent.location;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatPrice(price) {
    return new Intl.NumberFormat('id-ID').format(price);
}

function bookEvent(eventId) {
    if (!currentUser) {
        showToast('Please login to book events', 'error');
        openModal('loginModal');
        return;
    }

    showLoading();
    
    // Simulate booking process
    setTimeout(() => {
        hideLoading();
        showToast('Event booked successfully!', 'success');
    }, 2000);
}

function showEventDetails(eventId) {
    const event = [...events.current, ...events.upcoming, ...featuredEvents].find(e => e.id === eventId);
    if (!event) return;

    // Handle different data formats from API vs sample data
    const imageUrl = event.image_url || event.image;
    const eventStartDate = event.start_date || event.date;
    const eventEndDate = event.end_date || event.endDate;
    const description = event.description || '';
    const shortDescription = event.short_description || '';
    const venueDetails = event.venue_details || '';
    const category = event.category || 'Event';
    const status = event.status || 'upcoming';
    
    // Format time from ISO date
    const formatDateTime = (dateStr) => {
        const date = new Date(dateStr);
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return {
            date: date.toLocaleDateString('id-ID', dateOptions),
            time: date.toLocaleTimeString('id-ID', timeOptions)
        };
    };
    
    const startDateTime = formatDateTime(eventStartDate);
    const endDateTime = eventEndDate ? formatDateTime(eventEndDate) : null;

    // Create and show event details modal
    const modalHTML = `
        <div class="modal active" id="eventDetailsModal">
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>${event.title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div style="padding: 25px;">
                    <!-- Event Image -->
                    <img src="${imageUrl}" alt="${event.title}" 
                         style="width: 100%; height: 300px; object-fit: cover; border-radius: 15px; margin-bottom: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                    
                    <!-- Event Status Badge -->
                    <div style="margin-bottom: 20px;">
                        <span class="event-badge" style="display: inline-block; background: ${status === 'live' ? '#4CAF50' : status === 'upcoming' ? '#2196F3' : '#FF9800'}; 
                              color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: 500;">
                            ${status === 'live' ? '🔴 Live Now' : status === 'upcoming' ? '📅 Upcoming' : '✅ ' + status}
                        </span>
                        <span style="margin-left: 10px; background: #f0f0f0; color: #666; padding: 8px 16px; border-radius: 20px; font-size: 0.9rem;">
                            ${category}
                        </span>
                    </div>
                    
                    <!-- Event Dates & Time -->
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #1976D2;">
                        <h3 style="margin: 0 0 15px 0; color: #1976D2; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-calendar-alt"></i> Event Schedule
                        </h3>
                        <div style="display: grid; grid-template-columns: ${endDateTime ? '1fr 1fr' : '1fr'}; gap: 20px;">
                            <div>
                                <h4 style="margin: 0 0 5px 0; color: #4CAF50; font-size: 1rem;">📅 Start Date</h4>
                                <p style="margin: 0; font-weight: 600;">${startDateTime.date}</p>
                                <p style="margin: 5px 0 0 0; color: #666;">🕐 ${startDateTime.time} WIB</p>
                            </div>
                            ${endDateTime ? `
                                <div>
                                    <h4 style="margin: 0 0 5px 0; color: #FF5722; font-size: 1rem;">🏁 End Date</h4>
                                    <p style="margin: 0; font-weight: 600;">${endDateTime.date}</p>
                                    <p style="margin: 5px 0 0 0; color: #666;">🕐 ${endDateTime.time} WIB</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Location Information -->
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #4CAF50;">
                        <h3 style="margin: 0 0 15px 0; color: #4CAF50; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-map-marker-alt"></i> Location & Venue
                        </h3>
                        <div>
                            <h4 style="margin: 0 0 8px 0; font-size: 1.1rem; color: #333;">📍 ${event.location}</h4>
                            ${venueDetails ? `
                                <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
                                    <h5 style="margin: 0 0 8px 0; color: #666; font-size: 0.9rem;">🏢 Venue Details:</h5>
                                    <p style="margin: 0; line-height: 1.5; color: #333;">${venueDetails}</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Event Description -->
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px; border-left: 4px solid #FF9800;">
                        <h3 style="margin: 0 0 15px 0; color: #FF9800; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-info-circle"></i> Event Description
                        </h3>
                        ${shortDescription ? `
                            <div style="background: linear-gradient(135deg, #FF9800, #FFA726); color: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0; font-weight: 500; font-size: 1.1rem;">✨ ${shortDescription}</p>
                            </div>
                        ` : ''}
                        <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #e0e0e0;">
                            <p style="margin: 0; line-height: 1.6; color: #333; white-space: pre-wrap;">${description}</p>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 10px; justify-content: flex-end; padding-top: 20px; border-top: 1px solid #eee;">
                        <button class="btn btn-outline" onclick="toggleFavorite(${event.id})" style="flex: 1;">
                            <i class="fas fa-heart ${event.isFavorite ? '' : 'far'}"></i> 
                            ${event.isFavorite ? 'Remove from' : 'Add to'} Favorites
                        </button>
                        <button class="btn btn-primary" onclick="shareEvent(${event.id})" style="flex: 1;">
                            <i class="fas fa-share"></i> Share Event
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('eventDetailsModal');
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function toggleFavorite(eventId) {
    if (!currentUser) {
        showToast('Please login to add favorites', 'error');
        return;
    }

    const eventIndex = favoriteEvents.indexOf(eventId);
    if (eventIndex > -1) {
        favoriteEvents.splice(eventIndex, 1);
        showToast('Removed from favorites', 'success');
    } else {
        favoriteEvents.push(eventId);
        showToast('Added to favorites', 'success');
    }

    localStorage.setItem('ikoot_favorites', JSON.stringify(favoriteEvents));
    
    // Update event object
    [...events.current, ...events.upcoming].forEach(event => {
        if (event.id === eventId) {
            event.isFavorite = favoriteEvents.includes(eventId);
        }
    });

    // Close modal and reload events
    document.getElementById('eventDetailsModal')?.remove();
    loadEvents();
}

function openQRScanner() {
    openModal('qrModal');
    // Use the enhanced QR scanner from qr-scanner.js
    if (typeof startQRScanner === 'function') {
        startQRScanner();
    }
}

function showMyEvents() {
    if (!currentUser) {
        showToast('Please login to view your events', 'error');
        openModal('loginModal');
        return;
    }
    
    closeMobileMenu(); // Close mobile menu when opening My Events
    
    const favoriteEventsList = [...events.current, ...events.upcoming]
        .filter(event => favoriteEvents.includes(event.id));

    const modalHTML = `
        <div class="modal active" id="myEventsModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-heart" style="color: #e91e63; margin-right: 10px;"></i>My Favorite Events</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div style="padding: 25px;">
                    ${favoriteEventsList.length > 0 ? 
                        favoriteEventsList.map(event => {
                            // Handle both API data format and sample data format
                            const imageUrl = event.image_url || event.image || 'images/default-event.svg';
                            const eventStartDate = event.start_date || event.date;
                            const eventEndDate = event.end_date || event.endDate;
                            const description = event.short_description || event.description || 'No description available';
                            const badge = event.badge || (event.status === 'live' ? 'Live Now' : event.status === 'upcoming' ? 'Upcoming' : event.category || 'Event');
                            
                            return `
                                <div class="event-card" style="margin-bottom: 20px; cursor: pointer; border: 1px solid #e0e0e0; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: transform 0.2s ease;" 
                                     onclick="showEventDetails(${event.id})" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                                    <div class="event-image" style="background-image: url('${imageUrl}'), url('images/default-event.svg'); background-size: cover; background-position: center; height: 200px; position: relative;">
                                        <div class="event-badge" style="position: absolute; top: 15px; left: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">${badge}</div>
                                        <div style="position: absolute; top: 15px; right: 15px; background: rgba(233, 30, 99, 0.9); color: white; padding: 6px 8px; border-radius: 50%; font-size: 0.9rem;">
                                            <i class="fas fa-heart"></i>
                                        </div>
                                    </div>
                                    <div class="event-details" style="padding: 20px;">
                                        <h3 class="event-title" style="margin: 0 0 15px 0; color: #333; font-size: 1.3rem; font-weight: 600;">${event.title}</h3>
                                        <p style="color: #666; margin: 0 0 15px 0; line-height: 1.4; font-size: 0.9rem;">${description.substring(0, 120)}${description.length > 120 ? '...' : ''}</p>
                                        <div class="event-meta" style="display: flex; flex-direction: column; gap: 8px;">
                                            <div class="event-date-small" style="display: flex; align-items: center; gap: 8px; color: #4CAF50; font-size: 0.9rem;">
                                                <i class="fas fa-calendar"></i>
                                                <span>${formatDate(eventStartDate)}${eventEndDate ? ' - ' + formatDate(eventEndDate) : ''}</span>
                                            </div>
                                            <div class="event-location-small" style="display: flex; align-items: center; gap: 8px; color: #2196F3; font-size: 0.9rem;">
                                                <i class="fas fa-map-marker-alt"></i>
                                                <span>${event.location}</span>
                                            </div>
                                        </div>
                                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                                            <button class="btn btn-outline" onclick="event.stopPropagation(); toggleFavorite(${event.id}); document.getElementById('myEventsModal').remove();" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                                <i class="fas fa-heart-broken"></i> Remove from Favorites
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') :
                        `<div style="text-align: center; padding: 60px 20px; color: #666;">
                            <i class="fas fa-heart-broken" style="font-size: 4rem; margin-bottom: 20px; color: #ddd;"></i>
                            <h3 style="margin: 0 0 10px 0; color: #999;">No Favorite Events Yet</h3>
                            <p style="margin: 0; font-size: 0.9rem; line-height: 1.5;">Browse events and click the heart icon to add them to your favorites!</p>
                            <button class="btn btn-primary" onclick="document.getElementById('myEventsModal').remove(); document.querySelector('.bottom-nav-item[data-page=\"home\"]').click();" style="margin-top: 20px;">
                                <i class="fas fa-search"></i> Browse Events
                            </button>
                        </div>`
                    }
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('myEventsModal');
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function showProfile() {
    const modalHTML = `
        <div class="modal active" id="profileModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Profile</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div style="padding: 25px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem; font-weight: bold;">
                            ${currentUser.name.charAt(0).toUpperCase()}
                        </div>
                        <h3>${currentUser.name}</h3>
                        <p style="color: #666;">${currentUser.email}</p>
                    </div>
                    
                    <div style="border-top: 1px solid #eee; padding-top: 20px;">
                        <button class="btn btn-outline btn-full" style="margin-bottom: 10px;" onclick="editProfile()">Edit Profile</button>
                        <button class="btn btn-primary btn-full" onclick="logout()">Logout</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('profileModal');
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });
}

function editProfile() {
    showToast('Edit profile feature coming soon!', 'info');
}

function shareEvent(eventId) {
    const event = [...events.current, ...events.upcoming, ...featuredEvents].find(e => e.id === eventId);
    if (!event) return;
    
    const shareText = `Check out this amazing event: ${event.title} at ${event.location}!`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
        // Use native sharing if available
        navigator.share({
            title: event.title,
            text: shareText,
            url: shareUrl
        }).then(() => {
            showToast('Event shared successfully!', 'success');
        }).catch(() => {
            // Fallback to copy to clipboard
            copyToClipboard(shareText + ' ' + shareUrl);
        });
    } else {
        // Fallback to copy to clipboard
        copyToClipboard(shareText + ' ' + shareUrl);
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Event details copied to clipboard!', 'success');
        }).catch(() => {
            showToast('Failed to copy to clipboard', 'error');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Event details copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy to clipboard', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function showToast(message, type = 'info') {
    const toastHTML = `
        <div class="toast toast-${type}" id="toast">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add toast styles if not present
    if (!document.querySelector('#toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                z-index: 4000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideIn 0.3s ease;
                max-width: 300px;
            }
            .toast-success { border-left: 4px solid #4CAF50; }
            .toast-error { border-left: 4px solid #f44336; }
            .toast-info { border-left: 4px solid #2196F3; }
            .toast i { color: inherit; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    // Remove existing toast
    const existingToast = document.getElementById('toast');
    if (existingToast) {
        existingToast.remove();
    }

    document.body.insertAdjacentHTML('beforeend', toastHTML);
    
    setTimeout(() => {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// Close QR modal when closing
document.addEventListener('click', (e) => {
    if (e.target.id === 'qrModalClose') {
        stopQRScanner();
    }
});

// =============================================================================
// LOYALTY POINTS FUNCTIONALITY
// =============================================================================

// Global user points
let userPoints = 0;

// Function to initialize user points on page load
function initializeUserPoints() {
    console.log('initializeUserPoints called for user:', currentUser);
    if (!currentUser) {
        console.log('No currentUser, skipping points initialization');
        return;
    }
    
    console.log('Fetching user points...');
    fetchUserPoints();
    updatePointsDisplay();
}

// Function to fetch user points from backend
async function fetchUserPoints() {
    if (!currentUser || !currentUser.email) {
        console.log('fetchUserPoints: No currentUser or email');
        return;
    }
    
    console.log('fetchUserPoints: Fetching points for', currentUser.email);
    
    try {
        const response = await fetch('/api/user/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Email': currentUser.email
            }
        });
        
        console.log('fetchUserPoints: Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('fetchUserPoints: Response data:', data);
            
            if (data.success && data.user) {
                // Try both 'points' and 'loyalty_points' fields
                userPoints = data.user.points || data.user.loyalty_points || 0;
                console.log('fetchUserPoints: Updated userPoints to:', userPoints);
                updatePointsDisplay();
            } else {
                console.error('fetchUserPoints: API returned error:', data);
            }
        } else {
            console.error('fetchUserPoints: HTTP error:', response.status);
        }
    } catch (error) {
        console.error('fetchUserPoints: Network error:', error);
    }
}

// Function to update points display in header and hamburger menu
function updatePointsDisplay() {
    console.log('updatePointsDisplay called with userPoints:', userPoints);
    
    // Update points badge in header (if exists)
    const pointsBadge = document.querySelector('.points-badge');
    if (pointsBadge) {
        console.log('Found header points badge, updating');
        pointsBadge.textContent = userPoints;
    } else {
        console.log('No header points badge found');
    }
    
    // Update hamburger menu points item
    console.log('Updating hamburger menu points...');
    updateHamburgerMenuPoints();
}

// Function to update hamburger menu with points
function updateHamburgerMenuPoints() {
    // Look for both potential hamburger menu structures
    const hamburgerNav = document.querySelector('.hamburger-nav');
    const mobileNav = document.querySelector('.mobile-nav');
    
    // Update in hamburger-nav structure (old)
    if (hamburgerNav) {
        updatePointsInMenu(hamburgerNav);
    }
    
    // Update in mobile-nav structure (new)
    if (mobileNav) {
        updatePointsInMenu(mobileNav);
    }
}

// Helper function to update points in a specific menu container
function updatePointsInMenu(menuContainer) {
    if (!menuContainer || !currentUser) {
        console.log('Cannot update points in menu - missing container or user');
        return;
    }
    
    console.log('Updating points in menu container:', menuContainer.className);
    
    // Find existing points item by text content
    const menuItems = menuContainer.querySelectorAll('a, .mobile-nav-item, .hamburger-nav-item');
    let pointsItem = null;
    
    menuItems.forEach(item => {
        const text = item.textContent || item.innerText || '';
        if (text.includes('My Points') || text.includes('Points')) {
            pointsItem = item;
        }
    });
    
    if (pointsItem) {
        console.log('Found points item, updating with', userPoints, 'points');
        // Update the item with the badge
        pointsItem.innerHTML = `My Points <span class="points-badge" style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-left: 8px;">${userPoints}</span>`;
        
        // Ensure the onclick handler is still there
        pointsItem.onclick = showMyPoints;
        pointsItem.style.cursor = 'pointer';
    } else {
        console.log('Points menu item not found in', menuContainer.className, '- available items:', menuItems.length);
        
        // If no points item exists, create one (fallback)
        if (menuContainer.classList.contains('mobile-nav')) {
            const newPointsItem = document.createElement('a');
            newPointsItem.href = '#';
            newPointsItem.className = 'mobile-nav-item';
            newPointsItem.innerHTML = `My Points <span class="points-badge" style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-left: 8px;">${userPoints}</span>`;
            newPointsItem.onclick = showMyPoints;
            
            // Insert as first item
            menuContainer.insertBefore(newPointsItem, menuContainer.firstChild);
            console.log('Created new points item in mobile nav');
        }
    }
}

// Function to show My Points modal
function showMyPoints() {
    if (!currentUser) {
        showToast('Please login to view your points', 'error');
        openModal('loginModal');
        return;
    }
    
    // Fetch latest points before showing
    fetchUserPoints().then(() => {
        const pointsContent = document.getElementById('myPointsContent');
        if (pointsContent) {
            pointsContent.innerHTML = `
                <div class="points-summary">
                    <div class="points-total">
                        <i class="fas fa-star" style="color: gold; font-size: 2rem;"></i>
                        <h2>${userPoints} Points</h2>
                        <p>Total Loyalty Points Earned</p>
                    </div>
                    <div class="points-info">
                        <h3>How to Earn Points:</h3>
                        <ul>
                            <li>✅ Scan QR codes at events: <strong>10-50 points</strong></li>
                            <li>⭐ Write event reviews: <strong>25 points</strong></li>
                            <li>🎫 Book event tickets through app: <strong>15 points per booking</strong></li>
                        </ul>
                        
                        <h3>Redeem Your Points:</h3>
                        <p>Coming soon! Use your points for exclusive discounts and rewards.</p>
                    </div>
                </div>
            `;
        }
        openModal('myPointsModal');
    });
}

// Function to award points (called after QR code scan)
function awardPoints(points, reason) {
    if (!currentUser || !points) return;
    
    userPoints += points;
    updatePointsDisplay();
    
    // Show success message
    showToast(`+${points} points! ${reason}`, 'success');
    
    console.log(`Awarded ${points} points for: ${reason}. Total: ${userPoints}`);
}

// Store original updateAuthState function
const originalUpdateAuthState = window.updateAuthState || updateAuthState;

// Override updateAuthState to include points initialization  
window.updateAuthState = updateAuthState = function() {
    console.log('UpdateAuthState called with currentUser:', currentUser);
    
    // Call original function first
    if (originalUpdateAuthState && typeof originalUpdateAuthState === 'function') {
        originalUpdateAuthState.call(this);
    } else {
        // Fallback: basic auth state update
        const hamburgerBtn = elements.hamburgerBtn;
        const userGreeting = document.getElementById('userGreeting');
        const desktopAuthButtons = document.getElementById('desktopAuthButtons');
        const mobileAuth = document.querySelector('.mobile-auth');
        const userName = document.getElementById('userName');
        
        if (currentUser) {
            // Show user greeting
            if (userGreeting && userName) {
                userName.textContent = currentUser.name;
                userGreeting.classList.add('visible');
                userGreeting.style.display = 'flex';
            }
            
            // Hide auth buttons
            if (desktopAuthButtons) desktopAuthButtons.classList.add('hidden');
            if (mobileAuth) mobileAuth.classList.add('hidden');
            
            // Show hamburger menu
            if (hamburgerBtn) hamburgerBtn.style.display = 'flex';
        } else {
            // Hide user greeting
            if (userGreeting) {
                userGreeting.classList.remove('visible');
                userGreeting.style.display = 'none';
            }
            
            // Show auth buttons
            if (desktopAuthButtons) desktopAuthButtons.classList.remove('hidden');
            if (mobileAuth) mobileAuth.classList.remove('hidden');
            
            // Hide hamburger menu
            if (hamburgerBtn) hamburgerBtn.style.display = 'none';
        }
    }
    
    // Initialize points if user is logged in
    if (currentUser) {
        console.log('Initializing user points for:', currentUser.email);
        
        // If we already have points in currentUser, display them immediately
        if (currentUser.points) {
            userPoints = currentUser.points;
            console.log('Using cached points:', userPoints);
            updatePointsDisplay();
        }
        
        // Then fetch fresh points from server
        setTimeout(() => {
            initializeUserPoints();
        }, 1000); // Delay to ensure UI is ready
    } else {
        userPoints = 0;
        updatePointsDisplay();
    }
};

// Override the existing handleLogin function to include points sync
const originalHandleLogin = handleLogin;
handleLogin = async function(e) {
    e.preventDefault();
    showLoading();

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            currentUser = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                points: data.user.points || 0
            };
            
            // Also set the global userPoints variable immediately
            userPoints = data.user.points || 0;
            console.log('Login successful: Set userPoints to', userPoints);
            
            localStorage.setItem('ikoot_user', JSON.stringify(currentUser));
            updateAuthState();
            closeModal('loginModal');
            showToast('Login successful!', 'success');
            
            // Initialize points after successful login
            setTimeout(() => {
                initializeUserPoints();
            }, 1000);
        } else {
            showToast(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Network error during login', 'error');
    }
    
    hideLoading();
};

// Override the existing handleSignup function to include points sync
const originalHandleSignup = handleSignup;
handleSignup = async function(e) {
    e.preventDefault();
    showLoading();

    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        hideLoading();
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            currentUser = {
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                points: data.user.points || 0
            };
            
            // Also set the global userPoints variable immediately
            userPoints = data.user.points || 0;
            console.log('Signup successful: Set userPoints to', userPoints);
            
            localStorage.setItem('ikoot_user', JSON.stringify(currentUser));
            updateAuthState();
            closeModal('signupModal');
            showToast('Account created successfully!', 'success');
            
            // Initialize points after successful signup
            setTimeout(() => {
                initializeUserPoints();
            }, 1000);
        } else {
            showToast(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showToast('Network error during registration', 'error');
    }
    
    hideLoading();
};

// Initialize points on page load if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) {
        setTimeout(() => {
            initializeUserPoints();
        }, 2000); // Delay to ensure everything is loaded
    }
});
