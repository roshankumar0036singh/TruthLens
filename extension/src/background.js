// TruthLens Background Agent (Auto-Pilot & Context Analysis)

// 0. Enable Side Panel on click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// 1. Initialize Context Menus
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "analyze-truthlens",
      title: "Verify with TruthLens: '%s'",
      contexts: ["selection"]
    });

    chrome.contextMenus.create({
      id: "forensic-truthlens-image",
      title: "Verify Media Authenticity",
      contexts: ["image"]
    });

    chrome.contextMenus.create({
      id: "forensic-truthlens-video",
      title: "Run Deepfake Audio Scan",
      contexts: ["video"]
    });
  });
  
  // 2. Handle Messages (Context Menu & Headless)
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "START_CONTEXT_ANALYSIS" || request.type === "START_FORENSIC_ANALYSIS") {
        // Ensure side panel is open, then re-send once ready
        chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => {
           // Small delay to let the sidepanel load and register its listener
           setTimeout(() => {
              chrome.runtime.sendMessage(request);
           }, 800);
        });
        return true;
    }

    if (request.type === "HEADLESS_CHECK") {
        fetch('http://localhost:8000/api/v1/headless/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: request.text, url: sender.tab?.url })
        })
        .then(resp => resp.json())
        .then(data => sendResponse(data))
        .catch(err => sendResponse({ status: "failed", error: err.message }));
        return true; // Keep channel open for async response
    }
  });

  // 3. Handle Context Menu Clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "analyze-truthlens" && info.selectionText) {
      triggerAnalysis(tab, {
         type: "START_CONTEXT_ANALYSIS",
         text: info.selectionText,
         url: tab.url
      });
    }

    if (info.menuItemId === "forensic-truthlens-image" && info.srcUrl) {
      triggerAnalysis(tab, {
         type: "START_FORENSIC_ANALYSIS",
         text: "Forensic Analysis of Image",
         url: tab.url,
         image: info.srcUrl
      });
    }

    if (info.menuItemId === "forensic-truthlens-video" && info.srcUrl) {
       triggerAnalysis(tab, {
          type: "START_FORENSIC_ANALYSIS",
          text: "Deepfake Audio Scan of Video",
          url: tab.url,
          video_url: info.srcUrl
       });
    }
  });

  function triggerAnalysis(tab, payload) {
    if (chrome.sidePanel?.open) {
      chrome.sidePanel.open({ tabId: tab.id }).then(() => {
         setTimeout(() => {
            chrome.runtime.sendMessage(payload);
         }, 800);
      });
    }
  }

  // 4. Auto-Pilot: Status Icon Logic
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
     if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
        try {
           const response = await fetch(`http://localhost:8000/api/v1/community/check-url?url=${encodeURIComponent(tab.url)}`);
           const data = await response.json();
           
           if (data && data.status) {
              const color = data.status === 'VERIFIED' ? '#A3E635' : (data.status === 'FAKE' ? '#EF4444' : '#6B7280');
              updateIcon(tabId, color, data.status === 'VERIFIED' ? '✓' : '!');
           } else {
              resetIcon(tabId);
           }
        } catch (e) {
           console.debug("Silent check failed (backend offline)");
        }
     }
  });
  
  function updateIcon(tabId, color, badge) {
     chrome.action.setBadgeBackgroundColor({ tabId, color });
     chrome.action.setBadgeText({ tabId, text: badge });
  }
  
  function resetIcon(tabId) {
     chrome.action.setBadgeText({ tabId, text: '' });
  }

  // 5. Handle External Wallet Sync (from Localhost Bridge)
  chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    if (request.type === 'TRUTHLENS_SYNC' && request.address) {
       chrome.storage.local.set({ truthlens_wallet: request.address }, () => {
          console.log("External Sync Successful:", request.address);
          // Broadcast to Sidepanel immediately
          chrome.runtime.sendMessage({ 
            type: 'TRUTHLENS_WALLET_SYNCED', 
            address: request.address 
          });
          sendResponse({ status: "synced" });
       });
       return true; 
    }
  });
