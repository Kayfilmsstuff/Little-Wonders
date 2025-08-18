fetch('data/items.json', {cache:'no-store'})
  .then(r => r.json())
  .then(db => {
    const code = inputCode.toUpperCase();

    // find an item whose prefix matches this code
    const item = (db.items || []).find(x => code.startsWith((x.prefix || '').toUpperCase()));
    if(!item){
      el.innerHTML = `<p class="badge bad">Not found</p><p>Code “${escapeHtml(code)}” isn’t in our records.</p>`;
      return;
    }

    // extract edition number from the code
    const numMatch = code.replace(item.prefix.toUpperCase(), '');
    const editionNum = parseInt(numMatch, 10);
    const editionText = (!isNaN(editionNum) && item.total)
      ? `${editionNum}/${item.total}`
      : null;

    const img = item.image;
    const ig  = item.instagram || 'https://instagram.com/';
    const igUser = (ig.replace(/\\/$/,'').split('/').pop()||'').replace('@','');
    const igDeep = `instagram://user?username=${encodeURIComponent(igUser)}`;
    const caption = item.caption || `I found a Little Wonder! Code ${code}`;

    el.innerHTML = `
      <div class="result">
        <div><img src="${escapeAttr(img)}" alt="${escapeAttr(item.title||'Found piece')}" /></div>
        <div class="meta">
          <h2>${escapeHtml(item.title || 'Little Wonder')}</h2>
          <div><span class="badge ok">Authentic</span></div>

          <dl class="kv">
            <dt>Code</dt><dd>${escapeHtml(code)}</dd>
            ${editionText ? `<dt>Edition</dt><dd>${editionText}</dd>` : ''}
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
