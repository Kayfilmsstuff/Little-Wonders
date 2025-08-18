(function () {
  const el = document.getElementById('result');
  const out = (html) => el.innerHTML = html;
  const pre = (obj) => `<pre style="white-space:pre-wrap;background:#111;padding:12px;border-radius:8px;border:1px solid #333">${esc(typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2))}</pre>`;
  const esc = s => (s+'').replace(/[&<>\"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('code') || '').trim().toUpperCase();
    if (!code) return out(`<p class="badge bad">No code</p>`);

    fetch('data/items.json', { cache: 'no-store' })
      .then(r => r.json())
      .then(db => {
        // --- DEBUG: show what we loaded ---
        let dbg = `Code in URL: ${code}\n\nLoaded items.json:\n`;
        dbg += JSON.stringify(db, null, 2);

        const items = Array.isArray(db.items) ? db.items : [];
        let item = items.find(x => (x.code || '').toUpperCase() === code);
        let edition = null;

        if (!item) {
          const match = items.find(x =>
            typeof x.prefix === 'string' &&
            code.startsWith((x.prefix || '').toUpperCase())
          );
          if (match) {
            item = match;
            const pref = (match.prefix || '').toUpperCase();
            const num = parseInt(code.slice(pref.length).replace(/[^0-9]/g,''), 10);
            if (!isNaN(num) && match.total) edition = `${num}/${match.total}`;
          }
        } else if (item.edition) {
          edition = String(item.edition);
        }

        dbg += `\n\nMatched item: ${JSON.stringify(item, null, 2)}\nEdition: ${edition || '(none)'}`;

        if (!item) {
          return out(`<p class="badge bad">Not found</p>${pre(dbg)}`);
        }

        const img = item.image || '';
        const ig = item.instagram || 'https://instagram.com/';
        const captionBase = item.caption || `I found a Little Wonder! Code ${code}`;
        const caption = edition ? `${captionBase} — Edition ${edition}` : captionBase;

        out(`
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
          <h3 style="margin-top:24px">DEBUG</h3>
          ${pre(dbg)}
        `);

        document.getElementById('copyBtn')?.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(document.getElementById('cap').value);
            const b = document.getElementById('copyBtn');
            b.textContent = 'Copied!'; setTimeout(()=>b.textContent='Copy caption',1200);
          } catch {}
        });
      })
      .catch(err => out(`<p class="badge bad">Error</p>${pre(err.messag
