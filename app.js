// --- Initial State Configuration ---
let state = {
    balance: 100.00,
    netWorth: 100.00,
    globalVolume: 1482904.00,
    activeTraders: 14204,
    activeFlips: []
};

// --- Mock Marketplace Food Items ---
const foodItems = [
    { id: 1, name: "Arbitrage Apple", price: 8.50, emoji: "🍎", yield: "15% markup", desc: "A perfectly standard fruit designed strictly for retail flipping." },
    { id: 2, name: "Speculative Burger", price: 18.00, emoji: "🍔", yield: "15% markup", desc: "Crafted on a digital sesame bun. Highly volatile starch." },
    { id: 3, name: "Derivative Pizza", price: 32.00, emoji: "🍕", yield: "15% markup", desc: "Divided into individual tranches for secondary market trades." },
    { id: 4, name: "Leveraged Fries", price: 45.00, emoji: "🍟", yield: "15% markup", desc: "Salted with high leverage. Guaranteed hot until the next transaction." },
    { id: 5, name: "Infinite Yield Taco", price: 85.00, emoji: "🌮", yield: "15% markup", desc: "Spiced with recursive value mechanisms that self-relist." },
    { id: 6, name: "Dragon Ball Statue", price: 150.00, emoji: "🐉", yield: "20% markup", desc: "Ultra-rare alternative store of value. Not technically food, but trades like it." }
];

// --- Simulated Discord Usernames for live environment feel ---
const mockUsers = ["ZëNxTrïX", "CODE", "Larry_the_Goat", "YieldFarmer99", "BullishSalad", "Speculator_Sam", "GigaFoodie", "MarketMakerMax"];

// --- DOM References ---
const walletBalanceEl = document.getElementById("wallet-balance");
const userNetWorthEl = document.getElementById("user-net-worth");
const globalVolumeEl = document.getElementById("global-volume");
const activeTradersEl = document.getElementById("active-traders");
const marketGridEl = document.getElementById("market-items-container");
const flipsListEl = document.getElementById("active-flips-list");
const feedListEl = document.getElementById("transaction-feed");
const toastContainer = document.getElementById("toast-container");

// --- Render Marketplace Cards ---
function renderMarket() {
    marketGridEl.innerHTML = "";
    foodItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "market-card";
        card.innerHTML = `
            <div class="card-header">
                <span class="card-icon">${item.emoji}</span>
                <span class="card-badge">${item.yield}</span>
            </div>
            <div class="card-body">
                <h3>${item.name}</h3>
                <p class="card-desc">${item.desc}</p>
            </div>
            <div class="card-footer">
                <div class="price-box">
                    <span class="price-label">Price</span>
                    <span class="price-value">$${item.price.toFixed(2)}</span>
                </div>
                <button class="btn-buy" onclick="buyAndFlip(${item.id})">Buy & Flip</button>
            </div>
        `;
        marketGridEl.appendChild(card);
    });
}

// --- Dynamic Balance Updates ---
function updateUI() {
    walletBalanceEl.textContent = `$${state.balance.toFixed(2)}`;
    
    // Estimate net worth: Balance + current value of all active flips (at expected payout)
    const activeValue = state.activeFlips.reduce((acc, curr) => acc + curr.listedPrice, 0);
    state.netWorth = state.balance + activeValue;
    userNetWorthEl.textContent = `$${state.netWorth.toFixed(2)}`;
    
    // Global dynamic metrics
    globalVolumeEl.textContent = `$${state.globalVolume.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    activeTradersEl.textContent = state.activeTraders.toLocaleString();

    // Active portfolio section
    if (state.activeFlips.length === 0) {
        flipsListEl.innerHTML = `<div class="empty-state">No active flips. Buy an item from the market to auto-list it!</div>`;
    } else {
        flipsListEl.innerHTML = "";
        state.activeFlips.forEach(flip => {
            const flipEl = document.createElement("div");
            flipEl.className = "active-flip-item";
            flipEl.innerHTML = `
                <div class="flip-info">
                    <h5>${flip.emoji} ${flip.name}</h5>
                    <span class="flip-status flip-status-active">⏳ Auto-listed, waiting for buyer...</span>
                </div>
                <div class="flip-pricing">
                    <div class="expected-payout">$${flip.listedPrice.toFixed(2)}</div>
                    <span class="markup-pct">+${(flip.markup * 100).toFixed(0)}% Profit</span>
                </div>
            `;
            flipsListEl.appendChild(flipEl);
        });
    }
}

// --- Buy and Auto-Flip Interaction ---
window.buyAndFlip = function(itemId) {
    const item = foodItems.find(i => i.id === itemId);
    if (!item) return;

    if (state.balance < item.price) {
        showToast("Transaction Failed", `Insufficient funds in your wallet to purchase ${item.name}.`, true);
        return;
    }

    // Deduct cash and calculate auto-markup values
    state.balance -= item.price;
    const markupPct = item.id === 6 ? 0.20 : 0.15; // 20% markup on the Dragon Ball statue, 15% on normal food items
    const listedPrice = item.price * (1 + markupPct);
    const profit = listedPrice - item.price;

    const flipId = Date.now() + Math.random().toString(36).substr(2, 5);
    const newFlip = {
        id: flipId,
        name: item.name,
        emoji: item.emoji,
        buyPrice: item.price,
        listedPrice: listedPrice,
        profit: profit,
        markup: markupPct
    };

    state.activeFlips.push(newFlip);
    state.globalVolume += item.price;
    updateUI();

    showToast("Purchased & Auto-Listed", `${item.name} purchased for $${item.price.toFixed(2)}. Re-listed for $${listedPrice.toFixed(2)}!`);
    addFeedItem("You", `purchased and auto-listed ${item.emoji} ${item.name} for $${listedPrice.toFixed(2)}`);

    // Simulate another user purchasing the item from you after a short randomized delay (3 to 6 seconds)
    const delay = Math.floor(Math.random() * 3000) + 3000;
    setTimeout(() => {
        resolveFlip(flipId);
    }, delay);
};

// --- Resolve Flip (Simulate Buyer Matching) ---
function resolveFlip(flipId) {
    const flipIndex = state.activeFlips.findIndex(f => f.id === flipId);
    if (flipIndex === -1) return;

    const flip = state.activeFlips[flipIndex];
    state.activeFlips.splice(flipIndex, 1); // remove from portfolio

    // Return listed funds back to balance (with the markup profit)
    state.balance += flip.listedPrice;
    state.globalVolume += flip.listedPrice;
    updateUI();

    const randomBuyer = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    showToast("Listing Sold!", `${randomBuyer} bought your ${flip.name} for $${flip.listedPrice.toFixed(2)}! Net profit: +$${flip.profit.toFixed(2)}`, false);
    addFeedItem(randomBuyer, `bought ${flip.emoji} ${flip.name} from you for $${flip.listedPrice.toFixed(2)}`);
}

// --- Add To Realtime Feed ---
function addFeedItem(user, action) {
    const feedItem = document.createElement("div");
    feedItem.className = "feed-item";
    feedItem.innerHTML = `<span>${user}</span> ${action}`;
    
    feedListEl.insertBefore(feedItem, feedListEl.firstChild);

    // Limit log size
    if (feedListEl.children.length > 5) {
        feedListEl.removeChild(feedListEl.lastChild);
    }
}

// --- Helper: Dynamic User Interface Toasts ---
function showToast(title, msg, isError = false) {
    const toast = document.createElement("div");
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `
        <span class="toast-title">${title}</span>
        <span class="toast-msg">${msg}</span>
    `;
    toastContainer.appendChild(toast);

    // Fade and delete toast
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// --- Simulate Global Market Activity (Populate the Background) ---
function simulateGlobalActivity() {
    const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const randomItem = foodItems[Math.floor(Math.random() * foodItems.length)];
    const nextMarkupPrice = randomItem.price * 1.15;

    addFeedItem(randomUser, `listed ${randomItem.emoji} ${randomItem.name} at $${nextMarkupPrice.toFixed(2)}`);
    
    // Add minor stats fluctuations
    state.globalVolume += randomItem.price;
    state.activeTraders += Math.floor(Math.random() * 3) - 1; // Fluctuates +/- 1 trader
    updateUI();
}

// --- Initialize Event Listeners & Layout ---
window.addEventListener("DOMContentLoaded", () => {
    renderMarket();
    updateUI();

    // Generate startup transaction seed logs
    for (let i = 0; i < 4; i++) {
        simulateGlobalActivity();
    }

    // Keep dynamic activity streaming every few seconds
    setInterval(simulateGlobalActivity, 4500);
});
