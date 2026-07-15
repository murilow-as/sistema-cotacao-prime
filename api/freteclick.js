export default async function handler(req, res) {
    // Apenas aceita pedidos POST do nosso sistema
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = req.body;
    
    // A sua chave oficial da FreteClick
    const API_TOKEN = process.env.FRETECLICK_API_TOKEN || "2890dd69a254368092a7120828e4a712";

    try {
        // O servidor comunica-se com a FreteClick por baixo dos panos (sem bloqueio de CORS)
        const response = await fetch('https://api.freteclick.com.br/quotes', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'api-token': API_TOKEN
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        // Devolve os preços encontrados para a nossa tela
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
