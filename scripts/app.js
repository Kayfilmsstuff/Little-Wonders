(function () {
  const el = document.getElementById('result');
  function showError(msg){ el.innerHTML = `<p class="badge bad">Error</p><p style="white-space:pre-wrap">${escapeHtml(msg)}</p>`; }
  try {
    const params = new URLSearchParams(window.location.search);
    const inputCodeRaw = (params.get('code') || '').trim();
    const inputCode = inputCodeRaw.toUpperCase();
    if (!inputCode) return el.innerHTML = `<p class="badge bad">No code</p><p>Open this from the NFC tag or enter a code on the home page.</p>`;

    fetch('data/items.json', { cache: 'no-store' })
      .then(r => r.json())
      .then(db => {
        try {
          const items = Array.isArray(db.items) ? db.items : [];
          let item = items.find(x => (x.code || '').toUpperCase() === inputCode);
          let editionText = null;

          if (!item) {
            const cand = items.find(x =>
              typeof x.prefix === 'string' &&
              inputCode.startsWith((x.prefix || '').toUpperCase())
            );
            if (cand) {
              item = cand;
              const pref = (cand.prefix || '').toUpperCase();
              const suffix = inputCode.slice(pref.length);
              const num = parseInt(suffix.replace(/[^0-9]/g, ''), 10);
              if (!isNaN(num) && cand.total) editionText = `${num}/${cand.total}`;
            }
          } else if (item.edition) {
            editionText = String(item.edition);
          }

          if (!item) return el.innerHTML = `<p class="badge bad">Not found</p><p>Code “${escapeHtml(inputCode)}” isn’t in our records.</p>`;

          const img = item.image || '';
          const ig = item.instagram || 'https://instagram.com/';
          const igUser = (ig.replace(/\/$/, '').split('/').pop() || '').replace('@', '');
          const igDeep = `instagram://user?username=${encodeURIComponent(igUser)}`;
          const captionDefault = item.caption || `I found a Little Wonder! Code ${inputCode}`;
          const caption = editionText ? `${captionDefault} — Edition ${editionText}` : captionDefault;

          el.innerHTML = `
            <div class="result">
              ${img ? `<div><img src="${escapeAttr(img)}" alt="${escapeAttr(item.title || 'Found piece')}" /></div>` : ''}
              <div class="meta">
                <h2>${escapeHtml(item.title || 'Little Wonder')}</h2>
                <div>
                  <span class="badge ok">Authentic</span>
                  ${editionText ? ` <span class="badge ok">Edition ${escapeHtml(editionText)}</span>` : ''}
                </div>

                <dl class="kv">
                  <dt>Code</dt><dd>${escapeHtml(inputCode)}</dd>
                  ${item.id ? `<dt>Item ID</dt><dd>${escapeHtml(item.id)}</dd>` : ''}
                </dl>

                <div style="margin-top:14px">
                  <p><strong>Share it:</strong></p>
                  <textarea id="cap" rows="3">${escapeHtml(caption)}</textarea>
                  <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
                    <button id="copyBtn">Copy caption</button>
                    <a class="buttonlike" href="${escapeAttr(igDeep)}">Open Instagram</a>
                    <a class="buttonlike" href="${escapeAttr(ig)}" target="_blank" rel="noopener">Instagram (web)</a>
                  </div>
                </div>

                ${item.note ? `<p class="hint" style="margin-top:10px">${escapeHtml(item.note)}</p>` : ''}
              </div>
            </div>
          `;

          const copyBtn = document.getElementById('copyBtn');
          copyBtn?.addEventListener('click', async () => {
            const txt = document.getElementById('cap').value;
            try {
              await navigator.clipboard.writeText(txt);
              copyBtn.textContent = 'Copied!';
              setTimeout(() => (copyBtn.textContent = 'Copy caption'), 1200);
            } catch { alert('Copy failed—select and copy manually.'); }
          });
        } catch (innerErr) { showError(innerErr.message || String(innerErr)); }
      })
      .catch(err => showError(err.message || String(err)));
  } catch (e) { showError(e.message || String(e)); }

  function escapeHtml(s) {
    return (s + '').replace(/[&<>\"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, '&quot;'); }
})();
