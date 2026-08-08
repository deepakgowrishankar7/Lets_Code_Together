/**
 * Let's Code Together — Minimal & Professional Custom Modal Dialog Engine
 * Replaces native browser alert() and confirm() dialogs with a sleek dark modal.
 */

(function () {
    'use strict';

    let activeOverlay = null;
    let resolvePromise = null;

    function createOverlayHTML(title, message, isConfirm = false, okText = 'OK', cancelText = 'Cancel') {
        const overlay = document.createElement('div');
        overlay.className = 'custom-popup-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        const box = document.createElement('div');
        box.className = 'custom-popup-box';

        const titleEl = document.createElement('h3');
        titleEl.className = 'custom-popup-title';
        titleEl.textContent = title || "Notification";

        const messageEl = document.createElement('div');
        messageEl.className = 'custom-popup-message';
        messageEl.textContent = message || '';

        const actionsEl = document.createElement('div');
        actionsEl.className = 'custom-popup-actions';

        if (isConfirm) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'custom-popup-btn custom-popup-btn-secondary';
            cancelBtn.textContent = cancelText;
            cancelBtn.id = 'custom-popup-cancel-btn';
            actionsEl.appendChild(cancelBtn);
        }

        const okBtn = document.createElement('button');
        okBtn.className = 'custom-popup-btn custom-popup-btn-primary';
        okBtn.textContent = okText;
        okBtn.id = 'custom-popup-ok-btn';
        actionsEl.appendChild(okBtn);

        box.appendChild(titleEl);
        box.appendChild(messageEl);
        box.appendChild(actionsEl);
        overlay.appendChild(box);

        return { overlay, okBtn, cancelBtn: actionsEl.querySelector('#custom-popup-cancel-btn') };
    }

    function closePopup(result) {
        if (!activeOverlay) return;
        const currentOverlay = activeOverlay;
        const currentResolve = resolvePromise;
        activeOverlay = null;
        resolvePromise = null;

        currentOverlay.classList.remove('active');
        setTimeout(() => {
            if (currentOverlay.parentNode) {
                currentOverlay.parentNode.removeChild(currentOverlay);
            }
        }, 200);

        if (currentResolve) {
            currentResolve(result);
        }
    }

    function showPopup(message, title, isConfirm = false, okText = 'OK', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            // Dismiss any existing active popup
            if (activeOverlay) {
                closePopup(false);
            }

            resolvePromise = resolve;
            const { overlay, okBtn, cancelBtn } = createOverlayHTML(
                title || "Let's Code Together",
                message,
                isConfirm,
                okText,
                cancelText
            );

            activeOverlay = overlay;
            document.body.appendChild(overlay);

            // Trigger animation frame
            requestAnimationFrame(() => {
                overlay.classList.add('active');
                if (okBtn) okBtn.focus();
            });

            if (okBtn) {
                okBtn.onclick = () => closePopup(true);
            }

            if (cancelBtn) {
                cancelBtn.onclick = () => closePopup(false);
            }

            // Backdrop click closes confirm as false, alert as true
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    closePopup(isConfirm ? false : true);
                }
            };

            // Keyboard navigation (Enter / Escape)
            const handleKeyDown = (e) => {
                if (!activeOverlay || activeOverlay !== overlay) {
                    document.removeEventListener('keydown', handleKeyDown);
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    document.removeEventListener('keydown', handleKeyDown);
                    closePopup(isConfirm ? false : true);
                } else if (e.key === 'Enter' && e.target !== cancelBtn) {
                    e.preventDefault();
                    document.removeEventListener('keydown', handleKeyDown);
                    closePopup(true);
                }
            };

            document.addEventListener('keydown', handleKeyDown);
        });
    }

    // Global Public Functions
    window.customAlert = function (message, title) {
        return showPopup(String(message ?? ''), title || "Let's Code Together", false);
    };

    window.customConfirm = function (message, title) {
        return showPopup(String(message ?? ''), title || "Confirmation Required", true);
    };

    // Override Browser Native Dialogs
    window.alert = function (message) {
        window.customAlert(message);
    };

    window.confirm = function (message) {
        // Native confirm replacement
        window.customConfirm(message);
        return true; // Soft fallback for legacy synchronous checks
    };

})();
