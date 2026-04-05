document.getElementById('connectBtn').addEventListener('click', async () => {
    const statusEl = document.getElementById('status');
    const connectBtn = document.getElementById('connectBtn');

    statusEl.style.display = 'block';
    connectBtn.style.opacity = '0.5';
    connectBtn.disabled = true;

    try {
        if (!window.ethereum) {
            alert("MetaMask not found in this browser!");
            statusEl.style.display = 'none';
            connectBtn.disabled = false;
            connectBtn.style.opacity = '1';
            return;
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const addr = accounts[0];

        if (addr) {
            // Save to extension storage
            chrome.storage.local.set({ truthlens_wallet: addr }, () => {
                console.log("Wallet Synced:", addr);
                statusEl.innerText = "LINKED SUCCESS — CLOSING...";
                setTimeout(() => window.close(), 1000);
            });
        }
    } catch (err) {
        console.error(err);
        alert("Connection rejected or failed. Try again.");
        connectBtn.disabled = false;
        connectBtn.style.opacity = '1';
        statusEl.style.display = 'none';
    }
});
