/**
 * TruthLens Content Script
 * Extracts main content, headline, and prominent images from the news page.
 */

const getAbsoluteUrl = (url) => {
    try {
        return new URL(url, document.baseURI).href;
    } catch {
        return url;
    }
};

const getVisualHeadline = () => {
    // 1. Meta takes precedence (most accurate for canonical titles)
    const metaTitle = 
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
    if (metaTitle && metaTitle.length > 10) return metaTitle;

    // 2. Scan for the visually largest header
    const headers = Array.from(document.querySelectorAll('h1, h2, h3, [class*="headline"], [class*="title"]'));
    let bestHeader = null;
    let maxScore = 0;

    headers.forEach(h => {
        const text = h.innerText.trim();
        // Lowered threshold to 10 chars to capture short news (e.g. "War Erupts")
        if (text.length < 10 || text.length > 200) return;

        const rect = h.getBoundingClientRect();
        // Relaxed: Capture anything in the top 3000px of the document, even if scrolled past
        if (rect.bottom < -500 || rect.top > 3000) return; 

        const style = window.getComputedStyle(h);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = parseFloat(style.fontWeight) || 400;
        const isH1 = h.tagName.toLowerCase() === 'h1';
        
        // Human-eye Score: Size * Weight / y-position
        // Added 1.5x multiplier for H1 tags.
        let score = (fontSize * (fontWeight / 400)) / (Math.abs(rect.top) + 100);
        if (isH1) score *= 1.5;
        
        if (score > maxScore) {
            maxScore = score;
            bestHeader = text;
        }
    });

    return bestHeader || document.title || "Unknown Headline";
};

const getHeroImage = () => {
    // 1. Meta takes precedence (canonical)
    const metaImage = 
      document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
    if (metaImage) return getAbsoluteUrl(metaImage);

    // 2. Scan for largest image in top 2000px
    const images = Array.from(document.querySelectorAll('img, [style*="background-image"]'));
    let bestImg = null;
    let maxArea = 0;

    images.forEach(img => {
        const rect = img.getBoundingClientRect();
        // Relaxed: Capture images even if scrolled past
        if (rect.bottom < -200 || rect.top > 2000) return;
        
        const area = rect.width * rect.height;
        // At least 200x200 area, favoring large content images
        if (area > maxArea && area > 40000) { 
            maxArea = area;
            const src = img.currentSrc || img.getAttribute('data-src') || img.src || 
                        window.getComputedStyle(img).backgroundImage.replace(/url\(['"]?(.*?)['"]?\)/, '$1');
            if (src && src !== 'none') bestImg = getAbsoluteUrl(src);
        }
    });

    return bestImg;
};

const extractPageData = () => {
    const headline = getVisualHeadline();
    const mainImage = getHeroImage();
  
    // Clean body extraction: avoid sidebar/footer noise
    const mainContent = document.querySelector('article, main, .post-content, .article-body') || document.body;
    const bodyText = Array.from(mainContent.querySelectorAll('p'))
      .slice(0, 40)
      .map(p => p.innerText)
      .filter(t => t.trim().length > 50 && !t.includes('Trending') && !t.includes('Most Read'))
      .join('\n\n');
  
    return {
      url: window.location.href,
      headline,
      image: mainImage,
      text: bodyText || "..."
    };
};
  
  // Listen for messages from the sidepanel
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PAGE_DATA") {
      sendResponse(extractPageData());
    }

    if (request.action === "SYNC_WALLET") {
       // Main World Bridge Injection
       const script = document.createElement('script');
       script.textContent = `
         (async () => {
           try {
             if (window.ethereum) {
               const accounts = await window.ethereum.request({ method: 'eth_accounts' });
               window.postMessage({ type: 'TRUTHLENS_WALLET_SYNC', address: accounts[0] }, '*');
             } else {
               window.postMessage({ type: 'TRUTHLENS_WALLET_SYNC', address: null }, '*');
             }
           } catch (e) {
             window.postMessage({ type: 'TRUTHLENS_WALLET_SYNC', address: null }, '*');
           }
         })();
       `;
       document.documentElement.appendChild(script);
       script.remove();

       // Setup one-time listener for the response from the injected script
       const onMessage = (event) => {
         if (event.data?.type === 'TRUTHLENS_WALLET_SYNC') {
           window.removeEventListener('message', onMessage);
           sendResponse({ address: event.data.address });
         }
       };
       window.addEventListener('message', onMessage);
       return true; // Keep channel open for async response
    }
    
    if (request.action === "TOGGLE_SHIELD") {
      const shieldId = "truthlens-shield-style";
      if (request.active) {
        // Inject shield CSS if not already present
        let style = document.getElementById(shieldId);
        if (!style) {
          style = document.createElement('style');
          style.id = shieldId;
          style.textContent = `
            .truthlens-shielded {
              filter: blur(12px) grayscale(0.8) !important;
              transition: filter 0.6s ease;
              pointer-events: none;
              user-select: none;
              position: relative;
            }
            .truthlens-shielded::after {
              content: "⛨ TRUTHLENS SHIELD — Content obscured pending verification";
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              background: rgba(0, 0, 0, 0.85);
              color: #a3e635;
              font-family: 'Inter', monospace;
              font-weight: 900;
              padding: 20px 32px;
              border: 1px solid rgba(163, 230, 53, 0.3);
              backdrop-filter: blur(40px);
              z-index: 2147483647;
              pointer-events: auto;
              border-radius: 16px;
              font-size: 12px;
              text-align: center;
              letter-spacing: 0.15em;
              text-transform: uppercase;
              white-space: nowrap;
            }
          `;
          document.head.appendChild(style);
        }

        // Target only the article/main content, NOT the entire body
        const target = document.querySelector('article') 
                    || document.querySelector('[role="main"]')
                    || document.querySelector('main')
                    || document.querySelector('.post-content, .article-body, .entry-content, .story-body')
                    || document.querySelector('#content, #main-content');
        
        if (target) {
          target.classList.add('truthlens-shielded');
        }
      } else {
        // Remove shield from all shielded elements
        document.querySelectorAll('.truthlens-shielded').forEach(el => {
          el.classList.remove('truthlens-shielded');
        });
      }
      sendResponse({ status: "ok" });
    }
    
    if (request.action === "INJECT_NOTES") {
      const { finalResult } = request;
      if (!finalResult || !finalResult.raw || !finalResult.raw.CitationFinder) return;
      
      const reports = finalResult.raw.CitationFinder.citation_report || [];
      if (reports.length === 0) return;
      
      const paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3'));
      
      // Inject CSS for the floating TruthLens Badges
      if (!document.getElementById('truthlens-notes-style')) {
         const style = document.createElement('style');
         style.id = 'truthlens-notes-style';
         style.textContent = `
           .truthlens-community-note {
             margin: 16px 0;
             padding: 16px;
             border-radius: 12px;
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
             font-size: 14px;
             line-height: 1.5;
             box-shadow: 0 4px 20px rgba(0,0,0,0.15);
             border-left: 4px solid #ef4444;
             background-color: #fffaf0;
             color: #1f2937;
             position: relative;
             clear: both;
             z-index: 2147483647;
           }
           .truthlens-community-note.verified {
             border-left-color: #84cc16;
             background-color: #f7fee7;
           }
           .truthlens-community-note-header {
             display: flex;
             align-items: center;
             gap: 8px;
             font-weight: 700;
             margin-bottom: 8px;
             font-size: 11px;
             text-transform: uppercase;
             letter-spacing: 0.05em;
           }
           .truthlens-community-note-header svg {
             width: 14px;
             height: 14px;
           }
           .truthlens-source-link {
             display: inline-block;
             margin-top: 8px;
             font-weight: 600;
             color: #2563eb;
             text-decoration: none;
             font-size: 12px;
           }
           .truthlens-source-link:hover { text-decoration: underline; }
         `;
         document.head.appendChild(style);
      }

      // Try to find matching paragraphs to attach notes to
      reports.forEach(report => {
         const claim = report.claim.toLowerCase();
         // Find a paragraph that contains significant words from the claim
         const activeWords = claim.split(' ').filter(w => w.length > 5);
         
         const targetNode = paragraphs.find(p => {
             const t = p.innerText.toLowerCase();
             let matchCount = 0;
             activeWords.forEach(w => { if (t.includes(w)) matchCount++; });
             return activeWords.length > 0 && (matchCount / activeWords.length) > 0.4; // 40% keyword match
         });

         if (targetNode && report.evidence && report.evidence.length > 0) {
             // Create Community Note node
             const noteDiv = document.createElement('div');
             const isVerified = finalResult.verdict === 'VERIFIED';
             noteDiv.className = `truthlens-community-note ${isVerified ? 'verified' : 'flagged'}`;
             
             // Extract first strong evidence
             const ev = report.evidence[0];
             const headerColor = isVerified ? '#84cc16' : '#ef4444';
             const iconSvg = isVerified ? 
               '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>' : 
               '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

             noteDiv.innerHTML = `
               <div class="truthlens-community-note-header" style="color: ${headerColor};">
                 ${iconSvg} 
                 TruthLens Community Notes
               </div>
               <div style="font-weight: 500;">Readers added context they thought people might want to know:</div>
               <div style="margin-top: 4px; color: #4b5563;">${ev.reasoning}</div>
               ${ev.url ? `<a href="${ev.url}" target="_blank" class="truthlens-source-link">Read more at ${ev.source || 'Source'} →</a>` : ''}
             `;

             // Insert right after the matching paragraph
             if (targetNode.nextSibling) {
                 targetNode.parentNode.insertBefore(noteDiv, targetNode.nextSibling);
             } else {
                 targetNode.parentNode.appendChild(noteDiv);
             }
         }
      });
      
      sendResponse({ status: "injected" });
    }
    return true;
  });

// ==========================================================
// Double-Click URL → "Analyze with TruthLens" Popup
// ==========================================================
document.addEventListener('dblclick', (e) => {
  // Find if double-click was on or inside a link
  const anchor = e.target.closest('a[href]');
  if (!anchor) return;
  
  const url = anchor.href;
  if (!url || !url.startsWith('http')) return;

  // Remove any existing popup
  const existing = document.getElementById('truthlens-dblclick-popup');
  if (existing) existing.remove();

  // Create the popup
  const popup = document.createElement('div');
  popup.id = 'truthlens-dblclick-popup';
  popup.style.cssText = `
    position: fixed;
    top: ${Math.min(e.clientY - 10, window.innerHeight - 60)}px;
    left: ${Math.min(e.clientX + 10, window.innerWidth - 220)}px;
    z-index: 2147483647;
    background: linear-gradient(135deg, #111 0%, #1a1a2e 100%);
    border: 1px solid rgba(163, 230, 53, 0.4);
    border-radius: 12px;
    padding: 10px 16px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(163,230,53,0.15);
    display: flex;
    align-items: center;
    gap: 8px;
    animation: truthlens-popup-in 0.2s ease-out;
  `;
  popup.innerHTML = `
    <div style="width:8px;height:8px;border-radius:50%;background:#a3e635;animation:pulse 1.5s infinite"></div>
    <span style="color:#a3e635;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;">Analyze with TruthLens</span>
  `;

  // Add animation keyframes
  if (!document.getElementById('truthlens-popup-anim')) {
    const animStyle = document.createElement('style');
    animStyle.id = 'truthlens-popup-anim';
    animStyle.textContent = `
      @keyframes truthlens-popup-in {
        from { opacity: 0; transform: scale(0.8) translateY(5px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
    `;
    document.head.appendChild(animStyle);
  }

  popup.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    // Send the URL to the extension for analysis
    chrome.runtime.sendMessage({
      type: "START_CONTEXT_ANALYSIS",
      text: url,
      url: url
    });
    popup.remove();
  });

  document.body.appendChild(popup);

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    if (popup.parentNode) popup.remove();
  }, 4000);

  // Also dismiss on click anywhere else
  const dismiss = (ev) => {
    if (!popup.contains(ev.target)) {
      popup.remove();
      document.removeEventListener('click', dismiss);
    }
  };
  setTimeout(() => document.addEventListener('click', dismiss), 100);
});
// ==========================================================
// Proactive "Trust Score" Badge
// ==========================================================
const initProactiveBadge = () => {
  const supportedDomains = ['twitter.com', 'x.com', 'bbc.com', 'cnn.com', 'reuters.com', 'nytimes.com'];
  const host = window.location.hostname;
  
  const isSupported = supportedDomains.some(d => host.includes(d));
  if (!isSupported) return;

  // Extract initial claim
  const data = extractPageData();
  if (!data.headline || data.headline === "Unknown Headline") return;

  // 1. Inject Style
  if (!document.getElementById('truthlens-proactive-style')) {
    const style = document.createElement('style');
    style.id = 'truthlens-proactive-style';
    style.textContent = `
      #truthlens-proactive-badge {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 2147483646;
        padding: 12px 20px;
        background: rgba(10, 10, 10, 0.8);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(163, 230, 53, 0.2);
        border-radius: 20px;
        color: white;
        font-family: 'Inter', system-ui, sans-serif;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateY(100px);
        opacity: 0;
      }
      #truthlens-proactive-badge.visible {
        transform: translateY(0);
        opacity: 1;
      }
      #truthlens-proactive-badge:hover {
        border-color: rgba(163, 230, 53, 0.5);
        background: rgba(20, 20, 20, 0.9);
        transform: translateY(-2px);
      }
      .tl-pulse-ring {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #a3e635;
        position: relative;
      }
      .tl-pulse-ring::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 50%;
        border: 2px solid #a3e635;
        animation: tl-pulse 2s infinite;
      }
      @keyframes tl-pulse {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(3); opacity: 0; }
      }
      .tl-badge-text {
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .tl-status-score {
        font-size: 14px;
        font-weight: 900;
        font-italic: italic;
      }
      .tl-tooltip {
        position: absolute;
        bottom: calc(100% + 15px);
        right: 0;
        width: 240px;
        background: #111;
        border: 1px solid rgba(255,255,255,0.1);
        padding: 15px;
        border-radius: 16px;
        font-size: 11px;
        color: #9ca3af;
        line-height: 1.5;
        pointer-events: none;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      }
      #truthlens-proactive-badge:hover .tl-tooltip {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  // 2. Create Badge Element
  const badge = document.createElement('div');
  badge.id = 'truthlens-proactive-badge';
  badge.innerHTML = `
    <div class="tl-pulse-ring"></div>
    <div class="flex flex-col">
      <span class="tl-badge-text text-gray-500">Scanning Signal...</span>
      <span class="tl-status-score text-lime-400">ANALYZING</span>
    </div>
    <div class="tl-tooltip">Analyzing context in the background using TruthLens Swarm...</div>
  `;
  document.body.appendChild(badge);

  // Trigger reveal animation
  setTimeout(() => badge.classList.add('visible'), 1000);

  // 3. Request Headless Check
  chrome.runtime.sendMessage({
    type: "HEADLESS_CHECK",
    text: data.headline
  }, (response) => {
    if (response && response.verdict) {
      const isFake = response.verdict === 'FALSE';
      const isVerified = response.verdict === 'VERIFIED';
      const color = isFake ? '#ef4444' : (isVerified ? '#a3e635' : '#fbbf24');
      const score = Math.round(response.confidence * 100);
      
      badge.querySelector('.tl-pulse-ring').style.background = color;
      badge.querySelector('.tl-pulse-ring').style.setProperty('--pulse-color', color);
      badge.querySelector('.tl-badge-text').innerText = `Consensus Score`;
      badge.querySelector('.tl-status-score').innerText = `${score}% ${response.verdict}`;
      badge.querySelector('.tl-status-score').style.color = color;
      badge.querySelector('.tl-tooltip').innerText = response.short_reason;
      badge.style.borderColor = `${color}44`;
    } else {
      badge.querySelector('.tl-status-score').innerText = "UNCERTAIN";
      badge.querySelector('.tl-status-score').style.color = "#6b7280";
    }
  });

  badge.onclick = () => {
    chrome.runtime.sendMessage({
      type: "START_CONTEXT_ANALYSIS",
      text: data.headline,
      url: window.location.href
    });
  };
};

// ==========================================================
// Deepfake Audio Scan Overlay (YouTube & X)
// ==========================================================
const initAudioOverlay = () => {
    const host = window.location.hostname;
    const isX = host.includes('twitter.com') || host.includes('x.com');
    const isYT = host.includes('youtube.com');

    if (!isX && !isYT) return;

    const injectButton = (container, videoUrl) => {
        if (container.querySelector('.tl-audio-scan-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'tl-audio-scan-btn';
        btn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="M12 1v22M17 5v14M22 9v6M7 5v14M2 9v6"></path>
            </svg>
            <span>Scan Audio</span>
        `;
        
        btn.style.cssText = `
            position: absolute;
            top: 15px;
            right: 15px;
            z-index: 2147483647;
            background: rgba(163, 230, 53, 0.9);
            color: black;
            border: none;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(163, 230, 53, 0.3);
            transition: all 0.2s ease;
        `;

        btn.onmouseover = () => btn.style.background = '#bef264';
        btn.onmouseout = () => btn.style.background = 'rgba(163, 230, 53, 0.9)';
        
        btn.onclick = (e) => {
            e.stopPropagation();
            chrome.runtime.sendMessage({
                type: "START_FORENSIC_ANALYSIS",
                text: "Deepfake Audio Scan of Video",
                url: window.location.href,
                video_url: videoUrl
            });
            btn.innerHTML = 'Scanning...';
            btn.style.opacity = '0.7';
            btn.disabled = true;
        };

        container.appendChild(btn);
    };

    // Watch for video elements
    const observer = new MutationObserver(() => {
        if (isX) {
            // X (Twitter) video containers
            document.querySelectorAll('[data-testid="videoComponent"]').forEach(container => {
                injectButton(container, window.location.href);
            });
        }
        if (isYT) {
            // YouTube player
            const player = document.getElementById('movie_player');
            if (player) injectButton(player, window.location.href);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
};

// Initialize everything
if (document.readyState === 'complete') {
  initProactiveBadge();
  initAudioOverlay();
} else {
  window.addEventListener('load', () => {
    initProactiveBadge();
    initAudioOverlay();
  });
}
