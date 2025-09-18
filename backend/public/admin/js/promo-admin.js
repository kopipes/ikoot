// Promo Management JavaScript
let currentEditingPromo = null;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    loadPromos();
});

// Load all promos
async function loadPromos() {
    try {
        showLoading();
        
        const response = await fetch('/api/promos');
        const data = await response.json();
        
        if (data.success) {
            renderPromosTable(data.promos);
            updatePromoStats(data.promos);
        } else {
            showToast('Failed to load promos', 'error');
        }
        
    } catch (error) {
        console.error('Error loading promos:', error);
        showToast('Error loading promos', 'error');
    } finally {
        hideLoading();
    }
}

// Render promos table
function renderPromosTable(promos) {
    const tbody = document.getElementById('promosTableBody');
    
    if (!promos || promos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-tags" style="font-size: 3rem; color: #ddd; margin-bottom: 10px;"></i>
                    <p style="color: #666;">No promos found. Create your first promo!</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = promos.map(promo => {
        const promoValue = getPromoValueDisplay(promo);
        const statusClass = promo.status === 'active' ? 'status-active' : 'status-inactive';
        const isExpired = new Date(promo.valid_until) < new Date();
        const statusText = isExpired ? 'Expired' : promo.status;
        
        return `
            <tr>
                <td>
                    <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 4px;">
                        ${promo.code}
                    </code>
                </td>
                <td>${promo.title}</td>
                <td>
                    <span class="promo-type promo-type-${promo.promo_type}">
                        ${promo.promo_type.replace('_', ' ')}
                    </span>
                </td>
                <td>${promoValue}</td>
                <td>
                    <span style="color: #666;">
                        ${promo.current_usage}${promo.max_usage ? ` / ${promo.max_usage}` : ''}
                    </span>
                </td>
                <td>
                    <span class="status ${statusClass}">
                        ${statusText}
                    </span>
                </td>
                <td>${formatDateTime(promo.valid_until)}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewQRCode(${promo.id})" class="btn-action btn-qr" 
                                title="View QR Code">
                            <i class="fas fa-qrcode"></i>
                        </button>
                        <button onclick="editPromo(${promo.id})" class="btn-action btn-edit" 
                                title="Edit Promo">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deletePromo(${promo.id})" class="btn-action btn-delete" 
                                title="Delete Promo">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Update promo statistics
function updatePromoStats(promos) {
    const totalPromos = promos.length;
    const activePromos = promos.filter(p => p.status === 'active' && new Date(p.valid_until) >= new Date()).length;
    const totalUsage = promos.reduce((sum, p) => sum + p.current_usage, 0);
    
    document.getElementById('totalPromos').textContent = totalPromos;
    document.getElementById('activePromos').textContent = activePromos;
    document.getElementById('totalUsage').textContent = totalUsage;
}

// Get promo value display text
function getPromoValueDisplay(promo) {
    switch (promo.promo_type) {
        case 'discount':
            if (promo.discount_type === 'percentage') {
                return `${promo.discount_value}%`;
            } else {
                return `Rp ${formatPrice(promo.discount_value)}`;
            }
        case 'free_entry':
            return 'Free Entry';
        case 'custom':
            return promo.custom_value || 'Custom';
        default:
            return '-';
    }
}

// Open create promo modal
function openCreatePromoModal() {
    currentEditingPromo = null;
    document.getElementById('promoModalTitle').innerHTML = '<i class="fas fa-plus"></i> Create New Promo';
    document.getElementById('promoForm').reset();
    handlePromoTypeChange(); // Reset form sections
    
    // Set default valid until date (1 month from now)
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 1);
    document.getElementById('validUntil').value = defaultDate.toISOString().slice(0, 16);
    
    // Reset button text and modal styling
    const submitButton = document.querySelector('#promoForm button[type="submit"]');
    submitButton.innerHTML = '<i class="fas fa-plus"></i> Create Promo';
    
    const modal = document.getElementById('promoModal');
    modal.classList.remove('edit-mode');
    modal.classList.add('active');
}

// Handle promo type change
function handlePromoTypeChange() {
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

// Handle promo form submission
document.getElementById('promoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    try {
        showLoading();
        
        const formData = new FormData(this);
        const promoData = Object.fromEntries(formData.entries());
        
        // Validate based on promo type
        if (promoData.promo_type === 'discount' && !promoData.discount_value) {
            showToast('Please enter discount value', 'error');
            return;
        }
        
        if (promoData.promo_type === 'custom' && !promoData.custom_value) {
            showToast('Please enter custom value', 'error');
            return;
        }
        
        const url = currentEditingPromo ? 
            `/api/admin/promos/${currentEditingPromo}` : 
            '/api/admin/promos';
        
        const method = currentEditingPromo ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(promoData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            closePromoModal();
            loadPromos(); // Reload the table
        } else {
            showToast(result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error saving promo:', error);
        showToast('Error saving promo', 'error');
    } finally {
        hideLoading();
    }
});

// Edit promo
async function editPromo(promoId) {
    try {
        const promos = await getPromos();
        const promo = promos.find(p => p.id === promoId);
        
        if (!promo) {
            showToast('Promo not found', 'error');
            return;
        }
        
        currentEditingPromo = promoId;
        document.getElementById('promoModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Promo';
        
        // Reset form first
        document.getElementById('promoForm').reset();
        
        // Fill form with promo data
        document.getElementById('promoCode').value = promo.code;
        document.getElementById('promoTitle').value = promo.title;
        document.getElementById('promoDescription').value = promo.description;
        document.getElementById('promoType').value = promo.promo_type;
        
        // Handle type-specific fields
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
        
        // Show relevant form sections based on promo type
        handlePromoTypeChange();
        
        // Change button text for editing
        const submitButton = document.querySelector('#promoForm button[type="submit"]');
        submitButton.innerHTML = '<i class="fas fa-save"></i> Update Promo';
        
        // Add visual indicator for edit mode
        const modal = document.getElementById('promoModal');
        modal.classList.add('edit-mode');
        
        document.getElementById('promoModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading promo:', error);
        showToast('Error loading promo data', 'error');
    }
}

// Delete promo
function deletePromo(promoId) {
    if (!confirm('Are you sure you want to delete this promo? This action cannot be undone.')) {
        return;
    }
    
    showLoading();
    
    fetch(`/api/admin/promos/${promoId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showToast(result.message, 'success');
            loadPromos(); // Reload the table
        } else {
            showToast(result.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting promo:', error);
        showToast('Error deleting promo', 'error');
    })
    .finally(() => {
        hideLoading();
    });
}

// View QR Code
async function viewQRCode(promoId) {
    try {
        const promos = await getPromos();
        const promo = promos.find(p => p.id === promoId);
        
        if (!promo) {
            showToast('Promo not found', 'error');
            return;
        }
        
        document.getElementById('qrCodeImage').src = promo.qr_code;
        document.getElementById('qrCodeTitle').textContent = promo.title;
        document.getElementById('qrCodeDescription').textContent = promo.description;
        
        // Store current promo for download/print
        window.currentQRPromo = promo;
        
        document.getElementById('qrModal').classList.add('active');
        
    } catch (error) {
        console.error('Error loading QR code:', error);
        showToast('Error loading QR code', 'error');
    }
}

// Get promos data
async function getPromos() {
    const response = await fetch('/api/promos');
    const data = await response.json();
    return data.success ? data.promos : [];
}

// Close promo modal
function closePromoModal() {
    const modal = document.getElementById('promoModal');
    modal.classList.remove('active', 'edit-mode');
    currentEditingPromo = null;
    
    // Reset button text
    const submitButton = document.querySelector('#promoForm button[type="submit"]');
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-plus"></i> Create Promo';
    }
}

// Close QR modal
function closeQRModal() {
    document.getElementById('qrModal').classList.remove('active');
    window.currentQRPromo = null;
}

// Download QR code
function downloadQR() {
    if (!window.currentQRPromo) return;
    
    const promo = window.currentQRPromo;
    const link = document.createElement('a');
    link.href = promo.qr_code;
    link.download = `qr-${promo.code.toLowerCase()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Print QR code
function printQR() {
    if (!window.currentQRPromo) return;
    
    const promo = window.currentQRPromo;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>QR Code - ${promo.code}</title>
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
                <img class="qr-code" src="${promo.qr_code}" alt="QR Code">
                <div class="qr-code-text">${promo.code}</div>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('id-ID').format(price);
}

// Format datetime
function formatDateTime(datetime) {
    return new Date(datetime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add toast styles if not present
    if (!document.querySelector('#toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                animation: slideInRight 0.3s ease;
                min-width: 300px;
            }
            .toast-success { border-left: 4px solid #4CAF50; color: #4CAF50; }
            .toast-error { border-left: 4px solid #f44336; color: #f44336; }
            .toast-info { border-left: 4px solid #2196F3; color: #2196F3; }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Show/hide loading
function showLoading() {
    document.getElementById('loading').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('active');
}

// Logout function for sidebar
window.logout = function() {
    localStorage.removeItem('admin_token');
    showToast('Logged out successfully', 'info');
    window.location.href = 'index.html';
};
