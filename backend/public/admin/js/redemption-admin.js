// Redemption Admin Management
let currentRedemptionTab = 'items';
let redemptionItems = [];
let redemptionOrders = [];
let currentEditingItemId = null;
let currentEditingOrderId = null;

// Initialize redemption management
function initRedemptionManagement() {
    if (typeof showRedemptionTab !== 'function') {
        window.showRedemptionTab = showRedemptionTab;
    }
    if (typeof showCreateRedemptionItemModal !== 'function') {
        window.showCreateRedemptionItemModal = showCreateRedemptionItemModal;
    }
    
    loadRedemptionItems();
    loadRedemptionOrders();
}

// Tab switching
function showRedemptionTab(tab) {
    currentRedemptionTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide tab content
    const itemsTab = document.getElementById('redemption-items-tab');
    const ordersTab = document.getElementById('redemption-orders-tab');
    
    if (tab === 'items') {
        itemsTab.style.display = 'block';
        ordersTab.style.display = 'none';
        loadRedemptionItems();
    } else if (tab === 'orders') {
        itemsTab.style.display = 'none';
        ordersTab.style.display = 'block';
        loadRedemptionOrders();
    }
}

// Load redemption items
async function loadRedemptionItems() {
    try {
        showLoading();
        const response = await fetch('/api/redemptions/items?admin=true');
        const data = await response.json();
        
        if (data.success) {
            redemptionItems = data.items;
            displayRedemptionItems();
        } else {
            showToast('Error loading redemption items', 'error');
        }
    } catch (error) {
        console.error('Error loading redemption items:', error);
        showToast('Error loading redemption items', 'error');
    } finally {
        hideLoading();
    }
}

// Display redemption items
function displayRedemptionItems() {
    const tableBody = document.getElementById('redemptionItemsTableBody');
    const mobileContainer = document.getElementById('redemptionItemsMobileContainer');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    mobileContainer.innerHTML = '';
    
    redemptionItems.forEach(item => {
        // Desktop table row
        const row = document.createElement('tr');
        
        const deliveryOptions = [];
        if (item.delivery_available) deliveryOptions.push('Delivery');
        if (item.pickup_available) deliveryOptions.push('Pickup');
        
        const stock = item.stock_quantity === -1 ? 'Unlimited' : item.stock_quantity;
        const status = item.is_active ? 'Active' : 'Inactive';
        const statusClass = item.is_active ? 'status-active' : 'status-inactive';
        
        row.innerHTML = `
            <td>
                <img src=\"${item.image_url}\" alt=\"${item.name}\" 
                     class=\"table-image\" loading=\"lazy\"
                     onerror=\"this.src='https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'\">
            </td>
            <td>
                <div class=\"item-info\">
                    <div class=\"item-name\">${item.name}</div>
                    <div class=\"item-description\">${item.description ? item.description.substring(0, 100) + '...' : ''}</div>
                </div>
            </td>
            <td><span class=\"category-tag\">${item.category}</span></td>
            <td><span class=\"points-badge\">${item.points_required} pts</span></td>
            <td>${stock}</td>
            <td>${deliveryOptions.join(', ') || 'None'}</td>
            <td><span class=\"status ${statusClass}\">${status}</span></td>
            <td>
                <div class=\"action-buttons\">
                    <button class=\"btn-icon\" onclick=\"editRedemptionItem(${item.id})\" title=\"Edit\">
                        <i class=\"fas fa-edit\"></i>
                    </button>
                    <button class=\"btn-icon btn-danger\" onclick=\"deleteRedemptionItem(${item.id})\" title=\"Delete\">
                        <i class=\"fas fa-trash\"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
        
        // Mobile card
        const mobileCard = document.createElement('div');
        mobileCard.className = 'mobile-card';
        mobileCard.innerHTML = `
            <div class=\"mobile-card-header\">
                <img src=\"${item.image_url}\" alt=\"${item.name}\" 
                     class=\"mobile-card-image\" loading=\"lazy\"
                     onerror=\"this.src='https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80'\">
                <div class=\"mobile-card-info\">
                    <h4>${item.name}</h4>
                    <span class=\"category-tag\">${item.category}</span>
                </div>
                <span class=\"status ${statusClass}\">${status}</span>
            </div>
            <div class=\"mobile-card-body\">
                <div class=\"mobile-card-row\">
                    <span class=\"label\">Points Required:</span>
                    <span class=\"points-badge\">${item.points_required} pts</span>
                </div>
                <div class=\"mobile-card-row\">
                    <span class=\"label\">Stock:</span>
                    <span>${stock}</span>
                </div>
                <div class=\"mobile-card-row\">
                    <span class=\"label\">Delivery Options:</span>
                    <span>${deliveryOptions.join(', ') || 'None'}</span>
                </div>
                <div class=\"mobile-card-actions\">
                    <button class=\"btn btn-outline btn-small\" onclick=\"editRedemptionItem(${item.id})\">
                        <i class=\"fas fa-edit\"></i> Edit
                    </button>
                    <button class=\"btn btn-danger btn-small\" onclick=\"deleteRedemptionItem(${item.id})\">
                        <i class=\"fas fa-trash\"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        mobileContainer.appendChild(mobileCard);
    });
}

// Load redemption orders
async function loadRedemptionOrders() {
    try {
        showLoading();
        const response = await fetch('/api/redemptions/admin/redemptions');
        const data = await response.json();
        
        if (data.success) {
            redemptionOrders = data.redemptions;
            displayRedemptionOrders();
        } else {
            showToast('Error loading redemption orders', 'error');
        }
    } catch (error) {
        console.error('Error loading redemption orders:', error);
        showToast('Error loading redemption orders', 'error');
    } finally {
        hideLoading();
    }
}

// Display redemption orders
function displayRedemptionOrders() {
    const tableBody = document.getElementById('redemptionOrdersTableBody');
    const mobileContainer = document.getElementById('redemptionOrdersMobileContainer');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    mobileContainer.innerHTML = '';
    
    redemptionOrders.forEach(order => {
        // Desktop table row
        const row = document.createElement('tr');
        
        const statusClass = `status-${order.status}`;
        const deliveryMethod = order.delivery_method === 'pickup' ? 
            `Pickup at ${order.event_title || 'Event'}` : 
            `Delivery to ${order.delivery_address}`;
        
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>
                <div class=\"user-info\">
                    <div class=\"user-name\">${order.user_name}</div>
                    <div class=\"user-email\">${order.user_email}</div>
                </div>
            </td>
            <td>
                <div class=\"item-info\">
                    <div class=\"item-name\">${order.item_name}</div>
                    <div class=\"item-description\">${order.description ? order.description.substring(0, 50) + '...' : ''}</div>
                </div>
            </td>
            <td><span class=\"points-badge\">${order.points_used} pts</span></td>
            <td>
                <div class=\"delivery-info\">
                    <div class=\"delivery-method\">${deliveryMethod}</div>
                    ${order.delivery_phone ? `<div class=\"delivery-phone\">${order.delivery_phone}</div>` : ''}
                </div>
            </td>
            <td><span class=\"status ${statusClass}\">${order.status}</span></td>
            <td>${formatDate(order.redeemed_at)}</td>
            <td>
                <div class=\"action-buttons\">
                    <button class=\"btn-icon\" onclick=\"editRedemptionOrder(${order.id})\" title=\"Update Status\">
                        <i class=\"fas fa-edit\"></i>
                    </button>
                    <button class=\"btn-icon\" onclick=\"viewOrderDetails(${order.id})\" title=\"View Details\">
                        <i class=\"fas fa-eye\"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
        
        // Mobile card
        const mobileCard = document.createElement('div');
        mobileCard.className = 'mobile-card';
        mobileCard.innerHTML = `
            <div class=\"mobile-card-header\">
                <div class=\"mobile-card-info\">
                    <h4>#${order.id} - ${order.item_name}</h4>
                    <span class=\"user-name\">${order.user_name}</span>
                </div>
                <span class=\"status ${statusClass}\">${order.status}</span>
            </div>
            <div class=\"mobile-card-body\">
                <div class=\"mobile-card-row\">
                    <span class=\"label\">Points Used:</span>
                    <span class=\"points-badge\">${order.points_used} pts</span>
                </div>
                <div class=\"mobile-card-row\">
                    <span class=\"label\">Delivery:</span>
                    <span>${deliveryMethod}</span>
                </div>
                <div class=\"mobile-card-row\">
                    <span class=\"label\">Date:</span>
                    <span>${formatDate(order.redeemed_at)}</span>
                </div>
                <div class=\"mobile-card-actions\">
                    <button class=\"btn btn-outline btn-small\" onclick=\"editRedemptionOrder(${order.id})\">
                        <i class=\"fas fa-edit\"></i> Update
                    </button>
                    <button class=\"btn btn-primary btn-small\" onclick=\"viewOrderDetails(${order.id})\">
                        <i class=\"fas fa-eye\"></i> Details
                    </button>
                </div>
            </div>
        `;
        
        mobileContainer.appendChild(mobileCard);
    });
}

// Show create redemption item modal
function showCreateRedemptionItemModal() {
    currentEditingItemId = null;
    document.getElementById('redemptionItemModalTitle').textContent = 'Create Redemption Item';
    document.getElementById('redemptionItemForm').reset();
    document.getElementById('itemImagePreview').innerHTML = '';
    showModal('redemptionItemModal');
}

// Edit redemption item
function editRedemptionItem(itemId) {
    const item = redemptionItems.find(p => p.id === itemId);
    if (!item) return;
    
    currentEditingItemId = itemId;
    document.getElementById('redemptionItemModalTitle').textContent = 'Edit Redemption Item';
    
    // Populate form
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemPointsRequired').value = item.points_required || '';
    document.getElementById('itemCategory').value = item.category || '';
    document.getElementById('itemImageUrl').value = item.image_url || '';
    document.getElementById('itemStock').value = item.stock_quantity === -1 ? '' : item.stock_quantity;
    document.getElementById('itemDelivery').checked = item.delivery_available;
    document.getElementById('itemPickup').checked = item.pickup_available;
    document.getElementById('itemActive').checked = item.is_active;
    
    // Show image preview
    if (item.image_url) {
        document.getElementById('itemImagePreview').innerHTML = 
            `<img src=\"${item.image_url}\" alt=\"Preview\" style=\"max-width: 200px; max-height: 200px;\">`;
    }
    
    showModal('redemptionItemModal');
}

// Delete redemption item
async function deleteRedemptionItem(itemId) {
    const item = redemptionItems.find(p => p.id === itemId);
    if (!item) return;
    
    if (!confirm(`Are you sure you want to delete \"${item.name}\"?`)) return;
    
    try {
        showLoading();
        const response = await fetch(`/api/redemptions/admin/items/${itemId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Redemption item deleted successfully', 'success');
            loadRedemptionItems();
        } else {
            showToast(data.message || 'Error deleting redemption item', 'error');
        }
    } catch (error) {
        console.error('Error deleting redemption item:', error);
        showToast('Error deleting redemption item', 'error');
    } finally {
        hideLoading();
    }
}

// Edit redemption order
function editRedemptionOrder(orderId) {
    const order = redemptionOrders.find(o => o.id === orderId);
    if (!order) return;
    
    currentEditingOrderId = orderId;
    
    // Populate form
    document.getElementById('orderStatus').value = order.status || '';
    document.getElementById('adminNotes').value = order.admin_notes || '';
    
    showModal('redemptionOrderModal');
}

// View order details
function viewOrderDetails(orderId) {
    const order = redemptionOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // Create detailed view - you could enhance this with a proper modal
    let details = `Order Details:\\n\\n`;
    details += `Order ID: #${order.id}\\n`;
    details += `User: ${order.user_name} (${order.user_email})\\n`;
    details += `Item: ${order.item_name}\\n`;
    details += `Points Used: ${order.points_used}\\n`;
    details += `Status: ${order.status}\\n`;
    details += `Delivery Method: ${order.delivery_method}\\n`;
    
    if (order.delivery_method === 'delivery') {
        details += `Delivery Address: ${order.delivery_address || 'N/A'}\\n`;
        details += `Phone: ${order.delivery_phone || 'N/A'}\\n`;
    } else if (order.delivery_method === 'pickup') {
        details += `Pickup Event: ${order.event_title || 'N/A'}\\n`;
        details += `Pickup Location: ${order.event_location || 'N/A'}\\n`;
    }
    
    if (order.delivery_notes) {
        details += `Notes: ${order.delivery_notes}\\n`;
    }
    
    if (order.admin_notes) {
        details += `Admin Notes: ${order.admin_notes}\\n`;
    }
    
    details += `Redeemed At: ${formatDate(order.redeemed_at)}\\n`;
    
    alert(details);
}

// Handle redemption item form submission
document.addEventListener('DOMContentLoaded', function() {
    const redemptionItemForm = document.getElementById('redemptionItemForm');
    if (redemptionItemForm) {
        redemptionItemForm.addEventListener('submit', handleRedemptionItemSubmit);
    }
    
    const redemptionOrderForm = document.getElementById('redemptionOrderForm');
    if (redemptionOrderForm) {
        redemptionOrderForm.addEventListener('submit', handleRedemptionOrderSubmit);
    }
    
    // Image preview
    const imageUrlInput = document.getElementById('itemImageUrl');
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', function() {
            const preview = document.getElementById('itemImagePreview');
            if (this.value) {
                preview.innerHTML = `<img src=\"${this.value}\" alt=\"Preview\" style=\"max-width: 200px; max-height: 200px;\" 
                    onerror=\"this.style.display='none'\">`;
            } else {
                preview.innerHTML = '';
            }
        });
    }
});

async function handleRedemptionItemSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        if (key === 'delivery_available' || key === 'pickup_available' || key === 'is_active') {
            data[key] = true; // Checkbox is checked if present
        } else {
            data[key] = value;
        }
    }
    
    // Set unchecked checkboxes to false
    if (!formData.has('delivery_available')) data.delivery_available = false;
    if (!formData.has('pickup_available')) data.pickup_available = false;
    if (!formData.has('is_active')) data.is_active = false;
    
    // Handle stock quantity
    if (data.stock_quantity === '' || data.stock_quantity == null) {
        data.stock_quantity = -1;
    } else {
        data.stock_quantity = parseInt(data.stock_quantity);
    }
    
    // Convert points to integer
    data.points_required = parseInt(data.points_required);
    
    try {
        showLoading();
        
        const url = currentEditingItemId ? 
            `/api/redemptions/admin/items/${currentEditingItemId}` : 
            '/api/redemptions/admin/items';
        
        const method = currentEditingItemId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(currentEditingItemId ? 'Item updated successfully' : 'Item created successfully', 'success');
            closeModal('redemptionItemModal');
            loadRedemptionItems();
        } else {
            showToast(result.message || 'Error saving item', 'error');
        }
    } catch (error) {
        console.error('Error saving redemption item:', error);
        showToast('Error saving item', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRedemptionOrderSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {};
    
    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    try {
        showLoading();
        
        const response = await fetch(`/api/redemptions/admin/redemptions/${currentEditingOrderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Order status updated successfully', 'success');
            closeModal('redemptionOrderModal');
            loadRedemptionOrders();
        } else {
            showToast(result.message || 'Error updating order', 'error');
        }
    } catch (error) {
        console.error('Error updating redemption order:', error);
        showToast('Error updating order', 'error');
    } finally {
        hideLoading();
    }
}

// Utility function to format date
function formatDate(dateString) {
    try {
        return new Date(dateString).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

// Export functions to global scope
if (typeof window !== 'undefined') {
    window.showRedemptionTab = showRedemptionTab;
    window.showCreateRedemptionItemModal = showCreateRedemptionItemModal;
    window.editRedemptionItem = editRedemptionItem;
    window.deleteRedemptionItem = deleteRedemptionItem;
    window.editRedemptionOrder = editRedemptionOrder;
    window.viewOrderDetails = viewOrderDetails;
    window.initRedemptionManagement = initRedemptionManagement;
}