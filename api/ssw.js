export default async function handler(req, res) {
    const { cnpj, nf } = req.query;

    if (!cnpj || !nf) {
        return res.status(400).json({ error: "Faltam parâmetros CNPJ ou NF." });
    }

    // A MÁGICA: Bater no endpoint clássico (que tem a tabela real) em vez do /app/tracking
    const urlClassic = `https://ssw.inf.br/2/rastreamento_nfe?cnpj=${cnpj}&nfe=${nf}`;

    try {
        let response = await fetch(urlClassic, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`O SSW respondeu com erro: ${response.status}`);
        }

        let html = await response.text();

        // O SSW esconde a tabela dentro de um iframe. A Vercel resolve isso automaticamente no backend!
        const frameMatch = html.match(/<i?frame[^>]+src=["']([^"']+)["']/i);
        if (frameMatch && !html.toLowerCase().includes('situação')) {
            let fPath = frameMatch[1];
            // Monta o link do frame
            let fUrl = fPath.startsWith('http') ? fPath : `https://ssw.inf.br/2/${fPath.replace(/^\.\//, '')}`;
            
            let frameResponse = await fetch(fUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            
            if (frameResponse.ok) {
                html = await frameResponse.text();
            }
        }

        // Permite que o seu portal leia isto sem ser bloqueado por CORS
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.status(200).send(html);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
