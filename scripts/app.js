(function () {
  const el = document.getElementById('result');
  function show(html){ el.innerHTML = html; }
  function esc(s){ return (s+'').replace(/[&<>\"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

  try {
    const params = new URLSearchParams(window.location.search);
    const codeRaw = (params.get('code') || '').trim();
    const code = codeRaw.toUpperCase();
    if (!code) { show(`<p class="badge bad">No code</p><p>Open this from the NFC tag or enter a code on the home page.</p>`); return; }

    fetch('data/items.json', { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error(`items.json HTTP ${r.status} (path/case?)`);
        return r.json();
      })
      .then(db => {
        const items = Array.isArray(db.items) ? db.items : [];
        // Try exact
        let item = items.find(x => (x.code || '').toUpperCase() === code);
        let edition = null;

        // Try prefix
        if (!item) {
          const cand = items.find(x => typeof x.prefix === 'string' && code.startsWith((x.prefix || '').toUpperCase()));
          if (cand) {
            item = cand;
            const pref = (cand.prefix || '').toUpperCase();
            const num = parseInt(code.slice(pref.length).replace(/[^0-9]/g,''), 10);
            if (!isNaN(num) && cand.total) edition = `${num}/${cand.total}`;
          }
        } else if (item.edition) {
          edition = String(item.edition);
        }

        if (!item) {
          show(`<p class="badge bad">Not found</p><p>Code “${esc(code)}” isn’t in our records.</p>`);
          return;
        }

        const img = item.image || '';
        const ig = item.instagram || 'https://instagram.com/';
        const captionBase = item.caption || `I found a Little Wonder! Code ${code}`;
        const caption = edition ? `${captionBase} — Edition ${edition}` : captionBase;

        show(`
          <div class="result">
            ${img ? `<div><img src="${esc(img)}" alt="${esc(item.title||'Found piece')}" /></div>` : ''}
            <div class="meta">
              <h2>${esc(item.title || 'Little Wonder')}</h2>
              <div><span class="badge ok">Authentic</span>${edition ? ` <span class="badge ok">Edition ${esc(edition)}</span>`:''}</div>
              <dl class="kv">
                <dt>Code</dt><dd>${esc(code)}</dd>
              </dl>
              <div style="margin-top:14px">
                <p><strong>Share it:</strong></p>
                <textarea id="cap" rows="3">${esc(caption)}</textarea>
                <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
                  <button id="copyBtn">Copy caption</button>
                  <a class="buttonlike" href="instagram://user?username=${esc((ig.replace(/\/$/,'').split('/').pop()||'').replace('@',''))}">Open Instagram</a>
                  <a class="buttonlike" href="${esc(ig)}" target="_blank" rel="noopener">Instagram (web)</a>
                </div>
              </div>
              ${item.note ? `<p class="hint" style="margin-top:10px">${esc(item.note)}</p>` : ''}
            </div>
          </div>
        `);

        const btn = document.getElementById('copyBtn');
        btn?.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(document.getElementById('cap').value);
            btn.textContent = 'Copied!'; setTimeout(()=>btn.textContent='Copy caption',1200);
          } catch {}
        });
      })
      .catch(err => {
        show(`<p class="badge bad">Error</p><p style="white-space:pre-wrap">${esc(err.message||String(err))}</p>`);
      });
  } catch (e) {
    show(`<p class="badge bad">Error</p><p style="white-space:pre-wrap">${esc(e.message||String(e))}</p>`);
  }
})();
