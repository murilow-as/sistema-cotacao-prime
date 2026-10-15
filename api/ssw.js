export default async function handler(req, res) {
    // Cabeçalhos CORS para permitir que o seu Portal de Rastreio leia os dados
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { cnpj, nf } = req.query;

    if (!cnpj || !nf) {
        return res.status(400).json({ sucesso: false, erro: "Faltam parâmetros CNPJ ou NF." });
    }

    // Higienização de entrada (Exatamente como na spec)
    const cnpj_limpo = String(cnpj).replace(/\D/g, "");
    const nf_limpa = String(nf).replace(/\D/g, "");
    
    // URL alvo do Web Scraping
    const url = `https://ssw.inf.br/app/tracking/${cnpj_limpo}/${nf_limpa}`;

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9"
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const html = await response.text();
        
        // Remove tags HTML para simular o comportamento do BeautifulSoup (get_text)
        const texto_pagina = html.replace(/<[^>]+>/g, ' ');

        // 1. Busca por Previsão de Entrega
        const regexPrevisao = /Previs[aã]o de entrega:\s*(\d{2}\/\d{2}\/\d{2,4})/i;
        const previsaoMatch = texto_pagina.match(regexPrevisao);
        const previsao = previsaoMatch ? previsaoMatch[1] : null;

        // 2. Busca por Data Efetiva de Entrega
        const regexEntrega1 = /ENTREGUE\s+EM\s+(\d{2}\/\d{2}\/\d{2,4})/i;
        const regexEntrega2 = /MERCADORIA ENTREGUE.*?(\d{2}\/\d{2}\/\d{2,4})/i;
        const entregaMatch = texto_pagina.match(regexEntrega1) || texto_pagina.match(regexEntrega2);
        const data_entrega = entregaMatch ? entregaMatch[1] : null;

        // 3. Definição do status
        let status = "NAO_ENCONTRADO_OU_SEM_DADOS";
        if (data_entrega) {
            status = "ENTREGUE";
        } else if (previsao) {
            status = "EM TRÂNSITO / PENDENTE";
        }

        // Retorna o Payload JSON
        return res.status(200).json({
            sucesso: true,
            cnpj: cnpj_limpo,
            nf: nf_limpa,
            previsao_entrega: previsao,
            data_entrega: data_entrega,
            status: status,
            erro: null
        });

    } catch (error) {
        return res.status(500).json({
            sucesso: false,
            cnpj: cnpj_limpo,
            nf: nf_limpa,
            previsao_entrega: null,
            data_entrega: null,
            status: "ERRO_CONEXAO",
            erro: error.message
        });
    }
}
