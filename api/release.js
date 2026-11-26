const { parseDocument } = require('htmlparser2');
const { selectOne, selectAll } = require('css-select');
const { textContent } = require('domutils');

const source = 'https://wasender.me/download/';

function readRelease(html) {
    const document = parseDocument(html);
    function field(selector, parent = document) {
        const element = selectOne(selector, parent);
        return element ? textContent(element).trim() : '';
    }

    const version = /^v([\d]+(?:\.[\d]+)+)$/i.exec(field('.version-pill strong'))?.[1];
    const updated = /^Updated\s+(.+)$/i.exec(field('.version-pill span'))?.[1];
    const file = /^(.+?\.exe)\s*·\s*(\d+(?:[.,]\d+)?\s*(?:KB|MB|GB))$/i.exec(field('.file-meta'));
    const href = selectOne('#downloadBtn', document)?.attribs.href;
    if (!version || !updated || !file || !href) throw new Error('Incomplete release');
    const url = new URL(href, source);
    if (url.protocol !== 'https:') throw new Error('Invalid installer URL');

    const requirements = selectAll('.reqs li', document).map(row => ({
        label: field('span', row),
        value: field('strong', row)
    })).filter(row => row.label && row.value);
    return { version, updated, fileName: file[1], size: file[2], downloadUrl: url.href, requirements };
}

module.exports = async function release(req, res) {
    try {
        const response = await fetch(source, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error('Upstream unavailable');
        const data = readRelease(await response.text());
        res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-if-error=86400');
        res.status(200).json(data);
    } catch {
        res.setHeader('Cache-Control', 'no-store');
        res.status(503).json({ error: 'Release information unavailable' });
    }
};
