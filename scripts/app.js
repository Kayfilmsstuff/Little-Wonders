(function(){
  const el = document.getElementById('result');
  const params = new URLSearchParams(window.location.search);
  const inputCode = (params.get('code') || '').trim();

  if(!inputCode){
    el.innerHTML = `<p class="badge bad">No code</p><p>Open this from the NFC tag or enter a code on the home page.</p>`;
    return;
  }

  fetch('data/items.json', {cache:'no-store'})
    .then(r => r.json())
    .then(db => {
      const code = inputCode.toUpperCase();
      const item = (db.items || []).find(x => (x.code || '').toUpperCase() === code);
      if(!item){
        el.innerHTML = `<p class="badge bad">Not found</p><p>Code “${escapeHtml(code)}” isn’t in our records.</p>`;
        return;
      }

      const img = item.image || `images/${item.id}.jpg`;
      const ig  = item.instagram || 'https://instagram.com/';
      const igUser = (ig.replace(/\/$/,'').split('/').pop()||'').replace('@','');
      const igDeep = `instagram://user?username=${encodeURIComponent(igUser)}`;
      const caption = item.caption || `I found this tiny art! Code ${code}`;

      el.innerHTML = `
        <div class="result">
          <div><img src="${escapeAttr(img)}" alt="${escapeAttr(item.title||'Found piece')}" /></div>
          <div class="meta">
            <h2>${escapeHtml(item.title || 'Found Art Drop')}</h2>
            <div><span class="badge ok">Authentic</span></div>

            <dl class="kv">
              <dt>Code</dt><dd>${escapeHtml(code)}</dd>
              <dt>Item ID</dt><dd>${escapeHtml(item.id || '—')}</dd>
            </dl>

            <div style="margin-top:14px">
              <p><strong>Share it:</strong></p>
              <textarea id="cap" rows="3">${escapeHtml(caption)}</textarea>
              <div style="display:flex;gap:10px;margin-top:10px;flex-wrap:wrap">
                <button id="copyBtn">Copy caption</button>
                <a id="igBtn" class="buttonlike" href="${escapeAttr(igDeep)}">Open Instagram</a>
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
          setTimeout(()=>copyBtn.textContent='Copy caption',1200);
        } catch { alert('Copy failed—select and copy manually.'); }
      });
    })
    .catch(() => {
      el.innerHTML = `<p class="badge bad">Error</p><p>Couldn’t load verification data. Try again.</p>`;
    });

  function escapeHtml(s){return (s+'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function escapeAttr(s){return escapeHtml(s).replace(/"/g,'&quot;')}
})();