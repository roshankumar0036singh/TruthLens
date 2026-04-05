/**
 * TruthLens Social Overlay
 * Injects "Truth Pills" directly into X (Twitter) and Reddit feeds.
 * Uses Shadow DOM for style isolation and MutationObserver for dynamic loads.
 */

const TRUTH_LEVELS = {
    VERIFIED: { color: '#A3E635', icon: '✓', label: 'VERIFIED' },
    FAKE: { color: '#EF4444', icon: '!', label: 'DEBUNKED' },
    SUSPICIOUS: { color: '#F59E0B', icon: '?', label: 'SUSPICIOUS' },
    UNKNOWN: { color: '#6B7280', icon: '•', label: 'NEUTRAL' }
};

const createTruthPill = (status = 'UNKNOWN', reason = '') => {
    const config = TRUTH_LEVELS[status] || TRUTH_LEVELS.UNKNOWN;
    
    const host = document.createElement('div');
    host.className = 'truthlens-pill-host';
    host.style.display = 'inline-flex';
    host.style.marginLeft = '8px';
    host.style.verticalAlign = 'middle';

    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
        .pill {
            display: flex;
            align-items: center;
            gap: 4px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid ${config.color};
            border-radius: 100px;
            padding: 2px 10px;
            font-family: 'Inter', sans-serif;
            font-size: 10px;
            font-weight: 900;
            color: ${config.color};
            text-transform: uppercase;
            cursor: pointer;
            backdrop-filter: blur(8px);
            box-shadow: 0 0 15px ${config.color}33;
        }
        .reason {
            display: none;
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: black;
            color: white;
            padding: 8px;
            border-radius: 8px;
            width: 200px;
            font-size: 10px;
            margin-bottom: 10px;
            border: 1px solid ${config.color};
            z-index: 1000;
        }
        .pill:hover .reason { display: block; }
    `;
    shadow.appendChild(style);

    const pill = document.createElement('div');
    pill.className = 'pill';
    pill.innerHTML = `<span class="icon">${config.icon}</span> <span>${config.label}</span>
                     ${reason ? `<div class="reason">${reason}</div>` : ''}`;
    
    shadow.appendChild(pill);
    return host;
};

// --- News Highlighting Logic ---
const highlightNews = () => {
    const isSocial = window.location.hostname.includes('twitter.com') || 
                     window.location.hostname.includes('x.com') ||
                     window.location.hostname.includes('reddit.com');
    
    if (isSocial) return;

    // Target Headlines and Lead Paragraphs
    const targets = document.querySelectorAll('h1, h2, article p:first-of-type');
    
    targets.forEach(el => {
        if (el.dataset.truthlensChecked || el.innerText.length < 40) return;
        el.dataset.truthlensChecked = 'true';

        chrome.runtime.sendMessage({ 
            type: "HEADLESS_CHECK", 
            text: el.innerText 
        }, (response) => {
            if (response && response.verdict === 'FALSE') {
                el.style.borderLeft = '4px solid #EF4444';
                el.style.paddingLeft = '15px';
                el.style.backgroundColor = 'rgba(239, 68, 68, 0.05)';
                el.style.position = 'relative';
                
                const pill = createTruthPill('FAKE', response.short_reason);
                el.prepend(pill);
            }
        });
    });
};

// --- Platform Specific Selectors ---
const PLATFORMS = {
    TWITTER: {
        target: 'article[data-testid="tweet"]',
        anchor: '[data-testid="User-Names"]'
    },
    REDDIT: {
        target: 'shreddit-post',
        anchor: 'span[slot="authorName"]'
    }
};

const injectOverlays = () => {
    const isTwitter = window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com');
    const isReddit = window.location.hostname.includes('reddit.com');
    
    if (!isTwitter && !isReddit) {
        highlightNews();
        return;
    }

    const platform = isTwitter ? PLATFORMS.TWITTER : PLATFORMS.REDDIT;

    document.querySelectorAll(platform.target).forEach(post => {
        if (post.dataset.truthlensProcessed) return;
        
        const anchor = post.querySelector(platform.anchor);
        if (anchor) {
            const mockStatus = Math.random() > 0.8 ? (Math.random() > 0.5 ? 'VERIFIED' : 'FAKE') : 'UNKNOWN';
            const pill = createTruthPill(mockStatus);
            anchor.appendChild(pill);
            post.dataset.truthlensProcessed = 'true';
        }
    });
};

// --- Mutation Observer ---
const observer = new MutationObserver((mutations) => {
    injectOverlays();
});

observer.observe(document.body, { childList: true, subtree: true });
injectOverlays(); // Initial run
