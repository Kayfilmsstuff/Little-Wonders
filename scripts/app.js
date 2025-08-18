(function () {
  const el = document.getElementById('result');
  const show = (html) => (el.innerHTML = html);
  const esc = (s) => (s + '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const params = new URLSearchParams(window.location.search);
  const code = (params.get('code') || '').trim().toUpperCase();

  if (!code) {
    show('<p class="badge bad">No code</p><p>Open this from the NFC tag or enter a code on the home page.</p>');
    return;
  }

  fetch('data/items.json', { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('items.json HTTP ' + r.status); return r.json(); })
    .then(db => {
      const items = Array.isArray(db.items) ? db.items : [];

      // 1) exact match (legacy)
      let item = items.find(x => (x.code || '').toUpperCase() === code);
      let edition = null;

      // 2) dynamic prefix with RANGE CHECK (1..total)
      if (!item) {
        const cand = items.find(x =>
          typeof x.prefix === 'string' &&
          code.startsWith((x.prefix || '').toUpperCase())
        );

        if (cand) {
          const pref = (cand.prefix || '').toUpperCase();
          const suffix = code.slice(pref.length);               // e.g. "01", "2", "05A" (we'll parse digits only)
          const m = suffix.match(/\d+/);                        // first number sequence
          const num = m ? parseInt(m[0], 10) : NaN;

          // must be a number, >=1, and <= total
          if (!Number.isFinite(num) || num < 1 || (cand.total && num > cand.total)) {
            show(`<p class="badge bad">Not found</p><p>Code “${esc(code)}” isn’t registered for this series.</p>`);
            return;
          }

          item = cand;
          edition = `${num}/${cand.total}`;
        }
      } else if (item.edition) {
        edition = String(item.edition);
      }

      if (!item) {
        show(`<p class="badge bad">Not found</p><p>Code “${esc(code)}” isn’t in our records.</p>`);
        return;
      }

      const img = item.image || '';
      const ig  = item.instagram || 'https://instagram.com/';
      const igUser = (ig.replace(/\/$/,'').split('/').pop() || '').replace('@','');
      const igDeep = `instagram://user?username=${encodeURIComponent(igUser)}`;
      const baseCap = item.caption || `I found a Little Wonder! Code ${code}`;
      const caption = edition ? `${baseCap} — Edition ${edition}` : baseCap;

      show(`
        <div class="result">
          ${img ? `<div><img src="${esc(img)}" alt="${esc(item.title || 'Found piece')}" /></div>` : ''}
          <div class="meta">
            <h2>${esc(item.title || 'Little Wonder')}</h2>
            <div>
              <span class="badge ok">Authentic</span>
              ${edition ? ` <span class="badge ok">Edition ${esc(edition)}</span>` : ''}
            </div>
            <dl class="kv">
              <dt>Code</dt><dd>${esc(code)}</dd>
            </dl>
            <div style="margin-top:14px">
              <p><strong>Share it:</strong></p>
              <textarea id="cap" rows="3">${esc(caption)}</textarea>
              <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
                <button id="copyBtn">Copy caption</button>
                <a class="buttonlike" href="${esc(igDeep)}">Open Instagram</a>
                <a class="buttonlike" href="${esc(ig)}" target="_blank" rel="noopener">Instagram (web)</a>
              </div>
            </div>
            ${item.note ? `<p class="hint" style="margin-top:10px">${esc(item.note)}</p>` : ''}
          </div>
        </div>
      `);

      document.getElementById('copyBtn')?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(document.getElementById('cap').value);
          const b = document.getElementById('copyBtn'); b.textContent = 'Copied!'; setTimeout(()=>b.textContent='Copy caption',1200);
        } catch {}
      });
    })
    .catch(err => {
      show(`<p class="badge bad">Error</p><p style="white-space:pre-wrap">${esc(err.message || String(err))}</p>`);
    });
})();
