(async function updateRelease() {
    const source = 'https://wasender.me/download/';
    const cacheKey = 'wasender-release-v1';
    const button = document.querySelector('.download-button');
    function render(data, cached) {
        for (const field of ['version', 'updated', 'size', 'fileName']) {
            document.querySelectorAll('[data-release="' + field + '"]').forEach(node => {
                node.textContent = data[field];
            });
        }
        document.title = 'Download WASender v' + data.version;
        const rows = data.requirements.map(({ label, value }) => {
            const row = document.createElement('div');
            row.className = 'requirement-item';
            for (const [className, text] of [['requirement-label', label], ['requirement-value', value]]) {
                const span = document.createElement('span');
                span.className = className;
                span.textContent = text;
                row.append(span);
            }
            return row;
        });
        if (rows.length) document.querySelector('.requirements-list').replaceChildren(...rows);
        button.href = cached ? source : data.downloadUrl;
        document.querySelector('#download-label').textContent = cached ? 'Open publisher download page' : 'Download WASender for Windows';
        document.querySelector('#release-status').textContent = cached ? 'Showing the last available release.' : '';
    }
    try {
        const response = await fetch('/api/release');
        if (!response.ok) throw new Error();
        const data = await response.json();
        render(data, false);
        try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
    } catch {
        try {
            const cached = JSON.parse(localStorage.getItem(cacheKey));
            if (cached) render(cached, true);
        } catch {}
    }
})();
