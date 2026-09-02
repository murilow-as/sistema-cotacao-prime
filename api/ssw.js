export default async function handler(req, res) {
    const { cnpj, nf } = req.query;

    if (!cnpj || !nf) {
        return res.status(400).json({ error: "Faltam parâmetros CNPJ ou NF." });
    }

    const url = `https://ssw.inf.br/app/tracking/${cnpj}/${nf}`;

    try {
        // Faz a requisição simulando ser um navegador real para não ser bloqueado
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });

        if (!response.ok) {
            throw new Error(`SSW bloqueou ou falhou. Status: ${response.status}`);
        }

        const html = await response.text();
        
        // Devolve o HTML puro do SSW para o nosso sistema ler
        res.status(200).send(html);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
