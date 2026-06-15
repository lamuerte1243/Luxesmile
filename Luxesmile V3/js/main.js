/**
 * Luxesmile Dental Clinic — Main JavaScript
 * Hident-style interactions: preloader, navbar, scroll-reveal,
 * counters, before/after slider, cart, FAQ accordion, forms
 */

'use strict';

/* ──────────────────────────────────────────
   1. PRELOADER
────────────────────────────────────────── */
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('hidden');
    }, 1500);
  }
});

/* ──────────────────────────────────────────
   2. NAVBAR — sticky scroll shadow + mobile toggle
────────────────────────────────────────── */
const navbar = document.querySelector('.navbar');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navOverlay = document.createElement('div');

if (navbar) {
  navOverlay.className = 'cart-overlay';
  document.body.appendChild(navOverlay);

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navOverlay.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  navOverlay.addEventListener('click', closeNav);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

  // Mobile dropdown toggles
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.nav-dropdown');
    if (dropdown && link) {
      link.addEventListener('click', (e) => {
        if (window.innerWidth < 768) {
          e.preventDefault();
          item.classList.toggle('open');
        }
      });
    }
  });
}

function closeNav() {
  navMenu?.classList.remove('open');
  navToggle?.classList.remove('open');
  navOverlay?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ──────────────────────────────────────────
   3. SCROLL REVEAL (IntersectionObserver)
────────────────────────────────────────── */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}
initScrollReveal();

/* ──────────────────────────────────────────
   4. ANIMATED COUNTERS
────────────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const update = () => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString();
    if (current < target) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const counters = document.querySelectorAll('.counter-num');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}
initCounters();

/* ──────────────────────────────────────────
   5. BEFORE / AFTER SLIDER
────────────────────────────────────────── */
function initBeforeAfterSlider() {
  const sliders = document.querySelectorAll('.ba-slider-wrap');
  
  sliders.forEach(wrapper => {
    const beforeImg = wrapper.querySelector('.ba-before-img');
    const divider = wrapper.querySelector('.ba-divider');
    const handle = wrapper.querySelector('.ba-handle');
    
    if (!beforeImg || !divider || !handle) return;

    let isDragging = false;

    function setPosition(x) {
      const rect = wrapper.getBoundingClientRect();
      let pct = ((x - rect.left) / rect.width) * 100;
      pct = Math.min(Math.max(pct, 2), 98);
      beforeImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      divider.style.left = pct + '%';
      handle.style.left = pct + '%';
    }

    handle.addEventListener('mousedown', (e) => { isDragging = true; e.preventDefault(); });
    document.addEventListener('mouseup', () => { isDragging = false; });
    document.addEventListener('mousemove', (e) => { if (isDragging) setPosition(e.clientX); });

    // Touch support
    handle.addEventListener('touchstart', (e) => { isDragging = true; e.preventDefault(); }, { passive: false });
    document.addEventListener('touchend', () => { isDragging = false; });
    document.addEventListener('touchmove', (e) => {
      if (isDragging) setPosition(e.touches[0].clientX);
    }, { passive: true });

    // Click anywhere on wrapper
    wrapper.addEventListener('click', (e) => { setPosition(e.clientX); });
  });
}
initBeforeAfterSlider();

/* ──────────────────────────────────────────
   6. FAQ ACCORDION
────────────────────────────────────────── */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-answer').style.maxHeight = '0';
      });

      // Open clicked if not already open
      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}
initFAQ();

/* ──────────────────────────────────────────
   7. TOAST NOTIFICATIONS
────────────────────────────────────────── */
let toastContainer = document.getElementById('toast-container');
if (!toastContainer) {
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  document.body.appendChild(toastContainer);
}

function showToast(message, type = 'info', icon = 'fa-check-circle') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ──────────────────────────────────────────
   8. CART (localStorage-based)
────────────────────────────────────────── */
let cart = JSON.parse(localStorage.getItem('luxesmile_cart') || '[]');

function saveCart() {
  localStorage.setItem('luxesmile_cart', JSON.stringify(cart));
  renderCart();
  updateCartBadge();
}

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart();
  showToast(`${product.name} added to cart`, 'success', 'fa-shopping-bag');
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else saveCart();
  }
}

function getCartTotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function renderCart() {
  const cartBody = document.querySelector('.cart-body');
  const cartTotalEl = document.querySelector('.cart-total-price');
  if (!cartBody) return;

  if (cart.length === 0) {
    cartBody.innerHTML = `<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Your cart is empty</p></div>`;
  } else {
    cartBody.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-img">
          <img src="${item.image || ''}" alt="${item.name}" loading="lazy">
        </div>
        <div class="cart-item-info">
          <h5>${item.name}</h5>
          <p class="cart-item-price">KES ${(item.price * item.qty).toLocaleString()}</p>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="changeQty('${item.id}', -1)"><i class="fas fa-minus"></i></button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty('${item.id}', 1)"><i class="fas fa-plus"></i></button>
          </div>
        </div>
        <span class="cart-item-remove" onclick="removeFromCart('${item.id}')"><i class="fas fa-times"></i></span>
      </div>
    `).join('');
  }
  if (cartTotalEl) cartTotalEl.textContent = `KES ${getCartTotal().toLocaleString()}`;
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = total;
    b.style.display = total > 0 ? 'flex' : 'none';
  });
}

function openCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  sidebar?.classList.add('open');
  overlay?.classList.add('open');
}

function closeCart() {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  sidebar?.classList.remove('open');
  overlay?.classList.remove('open');
}

// Init cart on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  updateCartBadge();

  document.querySelector('.cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
  document.querySelector('[data-cart-toggle]')?.addEventListener('click', openCart);
});

/* ──────────────────────────────────────────
   9. WISHLIST (localStorage)
────────────────────────────────────────── */
let wishlist = JSON.parse(localStorage.getItem('luxesmile_wishlist') || '[]');

function toggleWishlist(id, name) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    showToast(`${name} removed from wishlist`, 'info', 'fa-heart');
  } else {
    wishlist.push(id);
    showToast(`${name} added to wishlist`, 'success', 'fa-heart');
  }
  localStorage.setItem('luxesmile_wishlist', JSON.stringify(wishlist));
  updateWishlistBtns();
}

function updateWishlistBtns() {
  document.querySelectorAll('[data-wishlist]').forEach(btn => {
    const id = btn.dataset.wishlist;
    btn.classList.toggle('active', wishlist.includes(id));
    const icon = btn.querySelector('i');
    if (icon) icon.className = wishlist.includes(id) ? 'fas fa-heart' : 'far fa-heart';
  });
}

/* ──────────────────────────────────────────
   10. APPOINTMENT / CONTACT FORMS
────────────────────────────────────────── */
function initForms() {
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = form.dataset.form;
      const btn = form.querySelector('button[type="submit"]');
      
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText || 'Submit';
        form.reset();
        
        const messages = {
          appointment: 'Appointment request sent! We\'ll confirm within 2 hours.',
          contact: 'Message sent! We\'ll get back to you soon.',
          careers: 'Application submitted! We\'ll review and contact you.',
          newsletter: 'Subscribed! Welcome to the Luxesmile community.',
        };
        showToast(messages[type] || 'Form submitted successfully!', 'success', 'fa-check-circle');
      }, 1800);
    });

    // Store original button text
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.dataset.originalText = btn.textContent.trim();
  });
}
initForms();

/* ──────────────────────────────────────────
   11. BLOG SEARCH & FILTER
────────────────────────────────────────── */
function initBlogFilter() {
  const searchInput = document.getElementById('blog-search');
  const cards = document.querySelectorAll('.blog-card[data-category]');
  const filterBtns = document.querySelectorAll('[data-filter]');

  let activeCategory = 'all';
  let searchQuery = '';

  function filterCards() {
    cards.forEach(card => {
      const cat = card.dataset.category || '';
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      const matchCat = activeCategory === 'all' || cat === activeCategory;
      const matchSearch = !searchQuery || title.includes(searchQuery);
      card.style.display = matchCat && matchSearch ? '' : 'none';
    });
  }

  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    filterCards();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.filter;
      filterCards();
    });
  });
}
initBlogFilter();

/* ──────────────────────────────────────────
   12. SHOP FILTERS & SORT
────────────────────────────────────────── */
function initShopFilters() {
  const filterBtns = document.querySelectorAll('[data-shop-filter]');
  const sortSelect = document.getElementById('shop-sort');
  const productCards = document.querySelectorAll('.product-card');
  let activeFilter = 'all';

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.shopFilter;
      productCards.forEach(card => {
        const cat = card.dataset.category || '';
        card.style.display = activeFilter === 'all' || cat === activeFilter ? '' : 'none';
      });
    });
  });

  sortSelect?.addEventListener('change', () => {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.product-card')];
    const val = sortSelect.value;
    cards.sort((a, b) => {
      const ap = parseFloat(a.dataset.price || 0);
      const bp = parseFloat(b.dataset.price || 0);
      if (val === 'price-low') return ap - bp;
      if (val === 'price-high') return bp - ap;
      return 0;
    });
    cards.forEach(c => grid.appendChild(c));
  });
}
initShopFilters();

/* ──────────────────────────────────────────
   13. SMOOTH SCROLL FOR ANCHOR LINKS
────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      closeNav();
      const offset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ──────────────────────────────────────────
   14. ACTIVE NAV LINK
────────────────────────────────────────── */
(function markActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === path || (path === '' && href === 'index.html') || (path === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

/* ──────────────────────────────────────────
   15. BACK TO TOP BUTTON
────────────────────────────────────────── */
(function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'back-to-top';
  btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
  btn.setAttribute('aria-label', 'Back to top');
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '30px',
    left: '30px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'var(--primary)',
    color: 'var(--navy)',
    border: 'none',
    cursor: 'pointer',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9rem',
    fontWeight: '700',
    boxShadow: '0 4px 16px rgba(212,175,55,0.4)',
    zIndex: '999',
    transition: 'all 0.25s ease',
  });
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
  }, { passive: true });

  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ──────────────────────────────────────────
   16. CAREERS — JOB APPLY
────────────────────────────────────────── */
document.querySelectorAll('[data-apply-job]').forEach(btn => {
  btn.addEventListener('click', () => {
    const jobTitle = btn.dataset.applyJob;
    const positionSelect = document.getElementById('career-position');
    if (positionSelect) {
      positionSelect.value = jobTitle;
      document.querySelector('#career-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ──────────────────────────────────────────
   17. PROCESS STEPS — animate on scroll
────────────────────────────────────────── */
(function initProcessSteps() {
  const steps = document.querySelectorAll('.process-step');
  if (!steps.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('active'), i * 120);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  steps.forEach(s => obs.observe(s));
})();

/* ──────────────────────────────────────────
   18. BEFORE/AFTER TABS (switch cases)
────────────────────────────────────────── */
document.querySelectorAll('.ba-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.ba-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    // Could switch slider images based on tab — extensible
  });
});
