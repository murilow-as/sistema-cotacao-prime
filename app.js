/*
    COMPONENTS:
    1. Config / Secrets
    2. App state
    3. Firebase sync
    4. Auth and login
    5. Password recovery
    6. UI helpers (toasts / dialogs)
    7. Item builder and validation
    8. Quote text generation
    9. History synchronization
    10. PDF reader
    11. Transport recommendation engine
    12. Utility helpers
*/
(function () {
    'use strict';

    // -----------------------------------------------------------------
    // 1. CONFIG / SECRETS (encoded to reduce exposure in HTML sources)
    // -----------------------------------------------------------------
    const FIREBASE_CONFIG_B64 = 'eyJhcGlLZXkiOiJBSXphU3lEaHJxRDNLOUJkSVpDTHVpMjgyaWdNTGZ2NGdjZ1F2NkkiLCJhdXRoRG9tYWluIjoicHJpbWUtYjJiLTJhNzFiLmZpcmViYXNlcWFwcC5jb20iLCJkYXRhYmFzZVVSTCI6Imh0dHBzOi8vcHJpbWUtYjJiLTI3MWItZGVmYXVsdC1ydGRiLmZpcmViYXNlaW8uY29tIiwicHJvamVjdElkIjoicHJpbWUtYjJiLTJhNzFiIiwic3RvcmFnZUJ1Y2tldCI6InByaW1lLWIyYi0yYTcxYi5maXJlYmFzZXN0b3JhZ2UuYXBwIiwibWVzc2FnaW5nU2VuZGVySWQiOiI5MzYyNjQ3NzIxOTgiLCJhcHBJZCI6IjE6OTM2MjY0NzcyMTk4OndlYjpmOThjYTI5YWZiZTY1MmM5YTNkYmE3In0=';
    const EMAILJS_PUBLIC_KEY_B64 = 'Q1RnOEFfR3d3a0t2U3NOZmc=';
    const EMAILJS_SERVICE_ID_B64 = 'c2VydmljZV9jdXAwZG5u';
    const EMAILJS_TEMPLATE_ID_B64 = 'dGVtcGxhdGVfcWljajFqNw==';
    const USUARIOS_INICIAIS_B64 = 'eyJhZG1pbiI6eyJzZW5oYSI6InByaW1lMjAyNiIsInByaW1laXJvQWNlc3NvIjpmYWxzZSwiZW1haWwiOiJhZG1pbkBncnVwb3ByaW1lYjJiLmNvbS5iciJ9LCJNdXJpbG9BZ3VpYXIiOnsic2VuaGEiOiJwcmltZTIwMjYiLCJwcmltZWlyb0FjZXNzbyI6dHJ1ZSwiZW1haWwiOiJtdXJpbG8uYWd1aWFyQGdtYWlsLmNvbSJ9LCJNYXJjb3NGZXJuYW5kZXMiOnsic2VuaGEiOiJwcmltZTIwMjYiLCJwcmltZWlyb0FjZXNzbyI6dHJ1ZSwiZW1haWwiOiJtYXJjb3MuZmVybmFuZGVzQGdtYWlsLmNvbSJ9fQ==';

    const decodeBase64 = (b64) => {
        try {
            return decodeURIComponent(escape(window.atob(b64)));
        } catch (err) {
            return window.atob(b64);
        }
    };

    const firebaseConfig = JSON.parse(decodeBase64(FIREBASE_CONFIG_B64));
    const EMAILJS_PUBLIC_KEY = decodeBase64(EMAILJS_PUBLIC_KEY_B64);
    const EMAILJS_SERVICE_ID = decodeBase64(EMAILJS_SERVICE_ID_B64);
    const EMAILJS_TEMPLATE_ID = decodeBase64(EMAILJS_TEMPLATE_ID_B64);
    const USUARIOS_INICIAIS = JSON.parse(decodeBase64(USUARIOS_INICIAIS_B64));

    const SENHA_PADRAO = 'prime2026';
    const catalogoProdutos = {};

    const dadosRemetentes = {
        P: {
            nome: 'PRIME2P SOLUCOES EM TI E REPRESENTACAO COMERCIAL LTDA',
            cnpj: '11.259.196/00001-50',
            cep: '03511-050',
            cidade: 'São Paulo / SP'
        },
        XD: {
            nome: 'PRIMEXD COMERCIO DE EQUIPAMENTOS E INFORMATICA LTDA',
            cnpj: '43.391.624/0001-90',
            cep: '03511-050',
            cidade: 'São Paulo / SP'
        },
        XC: {
            nome: 'PRIMEXCORP COMERCIO DE SUPRIMENTOS LTDA',
            cnpj: '49.123.568/0001-99',
            cep: '03511-050',
            cidade: 'SÃO PAULO / SP'
        }
    };

    const transportadorasMap = [
        { nome: 'BRASSPRESS', ufs: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'] },
        { nome: 'FORMATO', ufs: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
        { nome: 'IDEALE CARGAS', ufs: ['SP', 'RJ', 'ES'] },
        { nome: 'MANDALÁ', ufs: ['SP', 'DF', 'GO', 'MT', 'MS', 'TO', 'MG', 'AC', 'PA', 'RO'] },
        { nome: 'MIRIN DO SUL', ufs: ['SP', 'PR', 'SC', 'RS'] },
        { nome: 'PÁSSARO TRANSPORTES', ufs: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
        { nome: 'RANA EXPRESS', ufs: ['PR'] },
        { nome: 'RÁPIDO FIGUEIREDO', ufs: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'] },
        { nome: 'RODOCARGAS', ufs: ['MA', 'PI'] },
        { nome: 'RODONAVES', ufs: ['AC','AP','AM','DF','ES','GO','MT','MS','MG','PA','PR','RJ','RS','RO','RR','SC','SP','TO'] },
        { nome: 'TADEX', ufs: ['SP', 'RJ', 'ES'] },
        { nome: 'TODO BRASIL', ufs: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'] },
        { nome: 'TRANSWELLS', ufs: ['SP', 'RJ'] }
    ];

    let contadorItens = 0;
    let idCotacaoSessao = null;
    let historicoNuvem = [];
    let perfilSelecionado = null;
    let codigoRecuperacaoAtual = null;
    let callbackConfirmDialog = null;

    // -----------------------------------------------------------------
    // FIREBASE / EMAILJS INITIALIZATION
    // -----------------------------------------------------------------
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY) {
        emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    async function conectarFirebase() {
        try {
            const snapUsuarios = await database.ref('usuarios').once('value');
            if (!snapUsuarios.exists()) {
                await database.ref('usuarios').set(USUARIOS_INICIAIS);
            } else {
                const dbUsers = snapUsuarios.val();
                let atualizou = false;

                if (!dbUsers.admin) {
                    dbUsers.admin = USUARIOS_INICIAIS.admin;
                    atualizou = true;
                }

                for (const key in USUARIOS_INICIAIS) {
                    if (dbUsers[key] && !dbUsers[key].email) {
                        dbUsers[key].email = USUARIOS_INICIAIS[key].email;
                        atualizou = true;
                    }
                }

                if (atualizou) {
                    await database.ref('usuarios').set(dbUsers);
                }
            }

            const snapContadores = await database.ref('contadores').once('value');
            if (!snapContadores.exists()) {
                await database.ref('contadores').set({ P: 0, XD: 0, XC: 0 });
            }

            database.ref('historico').on('value', (snapshot) => {
                const dados = snapshot.val() || {};
                historicoNuvem = Object.values(dados).sort((a, b) => b.timestamp - a.timestamp);

                if (document.getElementById('modalHistorico').classList.contains('active')) {
                    renderizarListaHistorico();
                }
            });

            setTimeout(() => {
                const loader = document.getElementById('telaCarregamento');
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 300);
            }, 800);

        } catch (err) {
            console.error('Erro ao conectar ao Firebase:', err);
            showToast('Erro de conexão. Verifique a internet.', 'error');
        }
    }

    function habilitarAdmin() {
        const select = document.getElementById('usuarioLogin');
        if (!select.querySelector('option[value="admin"]')) {
            const option = document.createElement('option');
            option.value = 'admin';
            option.text = 'Administrador (Admin)';
            select.appendChild(option);
            select.value = 'admin';
            showDialog('Modo de Administração liberado no seletor.', 'alert');
        }
    }

    function checarEstadoLogin() {
        const logado = localStorage.getItem('primeLogado');
        const usuarioAtual = localStorage.getItem('primeUsuarioAtual');

        if (logado === 'true' && usuarioAtual) {
            document.getElementById('telaLogin').style.display = 'none';
            document.getElementById('telaTrocaSenha').style.display = 'none';
            document.getElementById('senhaLogin').value = '';

            const badge = document.getElementById('nomeUsuarioLogado');
            badge.innerText = `Logado: ${usuarioAtual}`;
            badge.classList.remove('hidden');

            if (usuarioAtual === 'admin') {
                document.getElementById('avisoAdmin').classList.remove('hidden');
            } else {
                document.getElementById('avisoAdmin').classList.add('hidden');
            }

            validarBotaoCopiar();
        } else {
            document.getElementById('telaLogin').style.display = 'flex';
            document.getElementById('telaTrocaSenha').style.display = 'none';
            document.getElementById('senhaLogin').value = '';
            document.getElementById('senhaLogin').focus();
            document.getElementById('nomeUsuarioLogado').classList.add('hidden');
            document.getElementById('avisoAdmin').classList.add('hidden');
        }
    }

    async function entrarSistema() {
        const user = document.getElementById('usuarioLogin').value;
        const pass = document.getElementById('senhaLogin').value;
        const btn = document.getElementById('btnLogin');
        const originalText = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> VALIDANDO...';
        btn.disabled = true;

        try {
            const snap = await database.ref(`usuarios/${user}`).once('value');
            const dadosUsuario = snap.val();

            if (dadosUsuario && dadosUsuario.senha === pass) {
                document.getElementById('msgErroLogin').classList.add('hidden');

                if (dadosUsuario.primeiroAcesso) {
                    perfilSelecionado = user;
                    document.getElementById('telaLogin').style.display = 'none';
                    document.getElementById('telaTrocaSenha').style.display = 'flex';
                    document.getElementById('novaSenha').focus();
                } else {
                    efetuarLogin(user);
                }
            } else {
                document.getElementById('msgErroLogin').classList.remove('hidden');
                document.getElementById('senhaLogin').focus();
            }
        } catch (err) {
            showToast('Erro ao comunicar com o servidor.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async function salvarNovaSenha() {
        const nova = document.getElementById('novaSenha').value;
        const conf = document.getElementById('confirmaSenha').value;

        if (nova === '' || nova !== conf) {
            document.getElementById('msgErroSenha').classList.remove('hidden');
            return;
        }

        const btn = document.getElementById('btnSalvarSenha');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> SALVANDO...';
        btn.disabled = true;

        try {
            await database.ref(`usuarios/${perfilSelecionado}/senha`).set(nova);
            await database.ref(`usuarios/${perfilSelecionado}/primeiroAcesso`).set(false);

            document.getElementById('msgErroSenha').classList.add('hidden');
            document.getElementById('novaSenha').value = '';
            document.getElementById('confirmaSenha').value = '';

            efetuarLogin(perfilSelecionado);
            showDialog('Senha cadastrada com sucesso na Nuvem! Bem-vindo(a).', 'alert');
        } catch (err) {
            showToast('Erro ao salvar a senha.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    function efetuarLogin(user) {
        localStorage.setItem('primeLogado', 'true');
        localStorage.setItem('primeUsuarioAtual', user);
        checarEstadoLogin();
    }

    function verificarEnter(event) {
        if (event.key === 'Enter' && document.getElementById('telaLogin').style.display !== 'none') {
            entrarSistema();
        }
    }

    function sairSistema() {
        showDialog('Tem certeza que deseja desconectar do sistema?', 'confirm', () => {
            localStorage.removeItem('primeLogado');
            localStorage.removeItem('primeUsuarioAtual');
            checarEstadoLogin();
        });
    }

    function showToast(mensagem, tipo = 'success') {
        const toast = document.getElementById('toastNotification');
        const msg = document.getElementById('toastMessage');
        const icon = document.getElementById('toastIcon');

        msg.innerText = mensagem;
        toast.className = 'fixed top-5 right-5 z-[200] transform transition-all duration-300 flex items-center px-4 py-3 rounded-lg shadow-xl text-white font-bold text-sm pointer-events-none';

        toast.classList.remove('bg-green-600', 'bg-red-600', 'bg-blue-600');

        if (tipo === 'success') {
            toast.classList.add('bg-green-600');
            icon.className = 'fa-solid fa-circle-check mr-2';
        } else if (tipo === 'error') {
            toast.classList.add('bg-red-600');
            icon.className = 'fa-solid fa-triangle-exclamation mr-2';
        } else {
            toast.classList.add('bg-blue-600');
            icon.className = 'fa-solid fa-circle-info mr-2';
        }

        setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 10);
        setTimeout(() => toast.classList.add('translate-x-full', 'opacity-0'), 4000);
    }

    function abrirRecuperacao() {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('telaRecuperacao').style.display = 'flex';

        document.getElementById('passo1Recuperacao').classList.remove('hidden');
        document.getElementById('passo2Recuperacao').classList.add('hidden');

        document.getElementById('emailRecuperacao').value = '';
        document.getElementById('codigoRecuperacao').value = '';
        document.getElementById('novaSenhaRecuperacao').value = '';
        document.getElementById('confirmaSenhaRecuperacao').value = '';
        document.getElementById('msgErroRecuperacao').classList.add('hidden');
    }

    function enviarCodigoRecuperacao() {
        const emailDigitado = document.getElementById('emailRecuperacao').value.trim();

        if (!emailDigitado || !emailDigitado.includes('@')) {
            showToast('Por favor, introduza um e-mail válido.', 'error');
            return;
        }

        const btn = document.getElementById('btnReceberCodigo');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> A ENVIAR...';
        btn.disabled = true;

        codigoRecuperacaoAtual = Math.floor(100000 + Math.random() * 900000).toString();

        if (typeof emailjs === 'undefined') {
            showToast('O sistema de e-mail não está disponível no momento.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: emailDigitado,
            to_name: document.getElementById('usuarioLogin').value,
            codigo: codigoRecuperacaoAtual
        }).then(() => {
            avancarParaPasso2(emailDigitado);
            showToast('E-mail enviado! Verifique a sua caixa de entrada e Spam.', 'success');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch((error) => {
            showToast('Erro EmailJS: ' + (error.text || 'Verifique as chaves no código.'), 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    }

    function avancarParaPasso2(emailDigitado) {
        document.getElementById('passo1Recuperacao').classList.add('hidden');
        document.getElementById('passo2Recuperacao').classList.remove('hidden');

        const partesEmail = emailDigitado.split('@');
        const prefixo = partesEmail[0].length > 3 ? partesEmail[0].substring(0, 3) : partesEmail[0];
        const emailMascarado = `${prefixo}****@${partesEmail[1]}`;
        document.getElementById('textoEmailRecuperacao').innerText = `Enviámos um código de 6 dígitos para:\n${emailMascarado}`;
    }

    function cancelarRecuperacao() {
        document.getElementById('telaRecuperacao').style.display = 'none';
        document.getElementById('telaLogin').style.display = 'flex';
        codigoRecuperacaoAtual = null;
    }

    async function confirmarRecuperacao() {
        const codigoDigitado = document.getElementById('codigoRecuperacao').value.trim();
        const nova = document.getElementById('novaSenhaRecuperacao').value;
        const conf = document.getElementById('confirmaSenhaRecuperacao').value;
        const msgErro = document.getElementById('msgErroRecuperacao');

        if (codigoDigitado !== codigoRecuperacaoAtual) {
            msgErro.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Código inválido!';
            msgErro.classList.remove('hidden');
            return;
        }

        if (nova === '' || nova !== conf) {
            msgErro.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> As senhas não coincidem ou estão vazias!';
            msgErro.classList.remove('hidden');
            return;
        }

        const btn = document.getElementById('btnConfirmaRecup');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> SALVANDO...';
        btn.disabled = true;

        try {
            const user = document.getElementById('usuarioLogin').value;
            await database.ref(`usuarios/${user}/senha`).set(nova);
            await database.ref(`usuarios/${user}/primeiroAcesso`).set(false);

            codigoRecuperacaoAtual = null;
            document.getElementById('telaRecuperacao').style.display = 'none';
            document.getElementById('telaLogin').style.display = 'flex';
            showDialog('Senha alterada com sucesso! Já pode acessar com a nova senha.', 'alert');
        } catch (err) {
            showToast('Erro ao alterar senha na nuvem.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    function showDialog(mensagem, tipo = 'alert', callback = null) {
        const dialog = document.getElementById('customDialog');
        const btnCancel = document.getElementById('dialogBtnCancel');
        const title = document.getElementById('dialogTitle');
        const titleIcon = document.createElement('i');

        titleIcon.className = 'fa-solid fa-circle-info text-blue-500 mr-2';
        title.innerText = '';

        if (tipo === 'confirm') {
            btnCancel.classList.remove('hidden');
            titleIcon.className = 'fa-solid fa-triangle-exclamation text-yellow-500 mr-2';
            title.innerHTML = titleIcon.outerHTML + ' Confirmação';
            callbackConfirmDialog = callback;
        } else {
            btnCancel.classList.add('hidden');
            titleIcon.className = 'fa-solid fa-circle-info text-blue-500 mr-2';
            title.innerHTML = titleIcon.outerHTML + ' Aviso';
            callbackConfirmDialog = null;
        }

        document.getElementById('dialogMessage').innerText = mensagem;
        dialog.classList.add('active');
    }

    function closeDialog() {
        document.getElementById('customDialog').classList.remove('active');
    }

    document.getElementById('dialogBtnConfirm').addEventListener('click', () => {
        closeDialog();
        if (callbackConfirmDialog) {
            callbackConfirmDialog();
        }
    });

    // -----------------------------------------------------------------
    // ITEM MANAGEMENT
    // -----------------------------------------------------------------
    function dadosAlterados() {
        idCotacaoSessao = null;
        document.getElementById('badgeCodigo').classList.add('hidden');
        calcularTotais();
        gerarPreviaTexto();
        validarBotaoCopiar();
    }

    function calcularTotais() {
        let totalVolumes = 0;
        let totalPeso = 0;
        document.querySelectorAll('.item-row').forEach((row) => {
            const inputs = row.querySelectorAll('input');
            const vol = parseInt(inputs[0].value.trim(), 10) || 0;
            const pesoUn = parseFloat(inputs[5].value.replace(',', '.').trim()) || 0;
            totalVolumes += vol;
            totalPeso += vol * pesoUn;
        });

        document.getElementById('qtdVolumes').value = totalVolumes > 0 ? totalVolumes : '';
        document.getElementById('pesoTotal').value = totalPeso > 0 ? totalPeso.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 3 }) : '';
    }

    function validarBotaoCopiar() {
        const btn = document.getElementById('btnCopiar');
        const usuarioAtual = localStorage.getItem('primeUsuarioAtual');

        if (usuarioAtual === 'admin') {
            btn.innerHTML = '<i class="fa-solid fa-ban mr-2"></i> MODO ADMIN - CÓPIA BLOQUEADA';
            btn.className = 'mt-4 w-full py-3 bg-red-600 text-white font-bold rounded-lg shadow-md flex items-center justify-center text-lg opacity-60 cursor-not-allowed';
            btn.disabled = true;
            return false;
        }

        const pedido = document.getElementById('pedido').value.trim();
        const valorNf = document.getElementById('valorNf').value.trim();
        const remetente = document.getElementById('empresaRemetente').value;
        const destCnpj = document.getElementById('destCnpj').value.trim();
        const destNome = document.getElementById('destNome').value.trim();
        const destCep = document.getElementById('destCep').value.trim();
        const destCidade = document.getElementById('destCidade').value.trim();

        if (!pedido || !valorNf) {
            btn.innerHTML = '<i class="fa-solid fa-lock mr-2"></i> PREENCHA O PEDIDO E VALOR DA NF';
            btn.className = 'mt-4 w-full py-3 bg-red-500 text-white font-bold rounded-lg shadow-md flex items-center justify-center text-lg opacity-60 cursor-not-allowed';
            btn.disabled = true;
            return false;
        }

        if (!remetente) {
            btn.innerHTML = '<i class="fa-solid fa-lock mr-2"></i> SELECIONE O CNPJ REMETENTE';
            btn.className = 'mt-4 w-full py-3 bg-red-500 text-white font-bold rounded-lg shadow-md flex items-center justify-center text-lg opacity-60 cursor-not-allowed';
            btn.disabled = true;
            return false;
        }

        if (!destCnpj || !destNome || !destCep || !destCidade) {
            btn.innerHTML = '<i class="fa-solid fa-lock mr-2"></i> PREENCHA O DESTINATÁRIO COMPLETO';
            btn.className = 'mt-4 w-full py-3 bg-orange-500 text-white font-bold rounded-lg shadow-md flex items-center justify-center text-lg opacity-90 cursor-not-allowed';
            btn.disabled = true;
            return false;
        }

        let itensCompletos = true;
        const rows = document.querySelectorAll('.item-row');

        if (rows.length === 0) {
            itensCompletos = false;
        }

        rows.forEach((row) => {
            row.querySelectorAll('input').forEach((input) => {
                if (input.value.trim() === '') {
                    itensCompletos = false;
                }
            });
        });

        if (!itensCompletos) {
            btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-2"></i> PREENCHA TODOS OS DADOS DOS ITENS';
            btn.className = 'mt-4 w-full py-3 bg-orange-500 text-white font-bold rounded-lg shadow-md flex items-center justify-center text-lg opacity-90 cursor-not-allowed';
            btn.disabled = true;
            return false;
        }

        btn.innerHTML = '<i class="fa-regular fa-copy mr-2"></i> GERAR CÓDIGO E COPIAR';
        btn.className = 'mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition duration-200 flex items-center justify-center text-lg cursor-pointer';
        btn.disabled = false;
        return true;
    }

    function adicionarItem() {
        contadorItens += 1;
        const div = document.createElement('div');
        div.className = 'grid grid-cols-[50px_minmax(200px,1fr)_60px_60px_60px_70px_75px] gap-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg border border-gray-200 dark:border-gray-600 items-center item-row';
        div.id = `item-${contadorItens}`;
        div.innerHTML = `
            <input type="text" class="input-field m-0 py-1.5 px-2 text-center font-bold" placeholder="0" oninput="dadosAlterados()">
            <input type="text" class="input-field m-0 py-1.5 px-2" placeholder="Ex: Caixa de Parafusos..." oninput="dadosAlterados()" title="Nome do Produto">
            <input type="text" class="input-field m-0 py-1.5 px-2 text-center" placeholder="cm" oninput="dadosAlterados()">
            <input type="text" class="input-field m-0 py-1.5 px-2 text-center" placeholder="cm" oninput="dadosAlterados()">
            <input type="text" class="input-field m-0 py-1.5 px-2 text-center" placeholder="cm" oninput="dadosAlterados()">
            <input type="text" class="input-field m-0 py-1.5 px-2 text-center" placeholder="kg" oninput="dadosAlterados()">
            <div class="btn-container flex justify-center gap-1"></div>
        `;

        document.getElementById('containerItens').appendChild(div);
        atualizarBotoesItens();
        dadosAlterados();
    }

    function atualizarBotoesItens() {
        const rows = document.querySelectorAll('.item-row');
        rows.forEach((row, index) => {
            const btnContainer = row.querySelector('.btn-container');
            const rowId = row.id;
            let buttons = '';

            if (rows.length > 1) {
                buttons += `
                    <button onclick="removerItem('${rowId}')" class="bg-red-100 hover:bg-red-200 text-red-600 rounded w-8 h-8 flex items-center justify-center font-bold shadow-sm transition border border-red-200 shrink-0" title="Remover Linha">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                `;
            }

            if (index === rows.length - 1) {
                buttons += `
                    <button onclick="adicionarItem()" class="bg-purple-600 hover:bg-purple-700 text-white rounded w-8 h-8 flex items-center justify-center font-bold shadow transition shrink-0" title="Adicionar Nova Linha">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                `;
            }

            btnContainer.innerHTML = buttons;
        });
    }

    function removerItem(id) {
        const rows = document.querySelectorAll('.item-row');
        if (rows.length > 1) {
            document.getElementById(id).remove();
            atualizarBotoesItens();
            dadosAlterados();
        }
    }

    function gerarPreviaTexto(codigoFinal = null) {
        const val = (id) => {
            const element = document.getElementById(id);
            return element ? element.value.trim() : '';
        };

        let texto = '';
        if (codigoFinal) {
            texto += `[ CÓDIGO DA COTAÇÃO: ${codigoFinal} ]\n`;
            texto += '------------------------------------------\n\n';
        }

        texto += `PEDIDO ${val('pedido')}.\n\n`;
        texto += 'COTAÇÃO DE FRETE - GRUPO PRIME B2B\n';
        texto += `MODALIDADE DE FRETE: ${val('modalidade')}\n\n`;
        texto += 'INFORMAÇÕES DO REMETENTE:\n\n';

        const remetenteKey = val('empresaRemetente');
        if (remetenteKey && dadosRemetentes[remetenteKey]) {
            const rem = dadosRemetentes[remetenteKey];
            texto += `NOME: ${rem.nome}.\n`;
            texto += `CNPJ: ${rem.cnpj}.\n`;
            texto += `CEP REMETENTE: ${rem.cep} - ${rem.cidade}\n`;
        } else {
            texto += 'NOME: \n';
            texto += 'CNPJ: \n';
            texto += 'CEP REMETENTE: \n';
        }

        texto += '\nINFORMAÇÕES DO DESTINATÁRIO:\n\n';
        texto += `NOME: ${val('destNome')}.\n`;
        texto += `CNPJ: ${val('destCnpj')}.\n`;
        const cidDest = val('destCidade') ? ` - ${val('destCidade')}` : '';
        texto += `CEP DESTINATÁRIO: ${val('destCep')}${cidDest}\n\n`;
        texto += `VALOR DA NOTA FISCAL: R$ ${val('valorNf')}.\n`;
        texto += `QUANTIDADE DE VOLUME(S): ${val('qtdVolumes')}.\n`;
        texto += `PESO TOTAL: ${val('pesoTotal')} Kg.\n\n`;
        texto += 'VOLUME(S) E PESO(S) DO(S) ITEM(NS):\n\n';

        document.querySelectorAll('.item-row').forEach((row) => {
            const inputs = row.querySelectorAll('input');
            const vol = inputs[0].value.trim();
            const desc = inputs[1].value.trim();
            const comp = inputs[2].value.trim();
            const larg = inputs[3].value.trim();
            const alt = inputs[4].value.trim();
            const pesoUn = inputs[5].value.trim();

            if (vol !== '' && desc !== '') {
                texto += `${vol} vol. - ${desc} | ${comp}cm x ${larg}cm x ${alt}cm - ${pesoUn}kg un.\n`;
            }
        });

        texto += '\nAguardamos o valor do frete e número da cotação para análise.';
        document.getElementById('textoFinal').value = texto;
        return texto;
    }

    async function processarECopiar() {
        if (document.getElementById('btnCopiar').disabled) {
            return;
        }

        const prefixo = document.getElementById('empresaRemetente').value;
        const btn = document.getElementById('btnCopiar');
        const textarea = document.getElementById('textoFinal');
        const destinatarioFinal = document.getElementById('destNome').value;
        const destCidade = document.getElementById('destCidade').value.trim();

        if (!idCotacaoSessao) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> GERANDO CÓDIGO NA NUVEM...';
            btn.disabled = true;

            try {
                const snapContador = await database.ref(`contadores/${prefixo}`).once('value');
                const atual = snapContador.val() || 0;
                const novoNumero = atual + 1;
                await database.ref(`contadores/${prefixo}`).set(novoNumero);

                const numFormatado = novoNumero.toString().padStart(4, '0');
                idCotacaoSessao = `${prefixo}-${numFormatado}`;
                const badge = document.getElementById('badgeCodigo');
                badge.innerText = `Cód: ${idCotacaoSessao}`;
                badge.classList.remove('hidden');

                const textoComId = gerarPreviaTexto(idCotacaoSessao);
                const ufDestino = destCidade.includes('/') ? destCidade.split('/')[1].trim() : '';
                const primarias = getTransportadorasPrimariasPorUF(ufDestino);

                await database.ref(`historico/${idCotacaoSessao}`).set({
                    id: idCotacaoSessao,
                    data: new Date().toLocaleString('pt-BR'),
                    timestamp: Date.now(),
                    destinatario: destinatarioFinal || 'Sem Destinatário',
                    texto: textoComId,
                    uf: ufDestino,
                    primarias,
                    cotacoes: {}
                });

                textarea.value = textoComId;
                textarea.removeAttribute('readonly');
                textarea.select();
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
                textarea.setAttribute('readonly', 'true');

                btn.innerHTML = `<i class="fa-solid fa-check mr-2"></i> COPIADO (CÓD: ${idCotacaoSessao})`;
                btn.classList.replace('bg-green-600', 'bg-blue-600');
                btn.classList.replace('hover:bg-green-700', 'hover:bg-blue-700');

                setTimeout(() => validarBotaoCopiar(), 3000);
            } catch (err) {
                console.error('Erro Nuvem:', err);
                showToast('Erro ao processar no servidor. Tente novamente.', 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } else {
            textarea.removeAttribute('readonly');
            textarea.select();
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            textarea.setAttribute('readonly', 'true');
            showToast(`Cotação ${idCotacaoSessao} copiada!`, 'success');
        }
    }

    function abrirHistorico() {
        document.getElementById('inputBuscaHistorico').value = '';
        renderizarListaHistorico();
        document.getElementById('modalHistorico').classList.add('active');
    }

    function fecharHistorico() {
        document.getElementById('modalHistorico').classList.remove('active');
    }

    function renderizarListaHistorico() {
        const openItems = [];
        document.querySelectorAll('[id^="previa-"]').forEach((el) => {
            if (!el.classList.contains('hidden')) {
                openItems.push(el.id.replace('previa-', ''));
            }
        });

        const lista = document.getElementById('listaHistorico');
        const termoBusca = document.getElementById('inputBuscaHistorico').value.toLowerCase();
        lista.innerHTML = '';

        let historicoFiltrado = historicoNuvem;
        if (termoBusca) {
            historicoFiltrado = historicoFiltrado.filter((item) =>
                (item.id && item.id.toLowerCase().includes(termoBusca)) ||
                (item.destinatario && item.destinatario.toLowerCase().includes(termoBusca)) ||
                (item.data && item.data.toLowerCase().includes(termoBusca)) ||
                (item.texto && item.texto.toLowerCase().includes(termoBusca))
            );
        }

        if (!historicoFiltrado.length) {
            lista.innerHTML = '<p class="text-center text-gray-500 py-10">Nenhuma cotação encontrada no servidor.</p>';
            return;
        }

        historicoFiltrado.forEach((item) => {
            let primarias = item.primarias || [];
            if (!primarias.length && item.texto) {
                const match = item.texto.match(/CEP DESTINATÁRIO:.*\/ ([A-Z]{2})/);
                if (match) primarias = getTransportadorasPrimariasPorUF(match[1]);
            }

            let formHtml = `
                <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center mb-3">
                        <i class="fa-solid fa-money-check-dollar text-green-600 dark:text-green-400 mr-2"></i>
                        <h4 class="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Retorno das Transportadoras</h4>
                    </div>
            `;

            if (primarias.length > 0) {
                primarias.forEach((t, idx) => {
                    const c = (item.cotacoes && item.cotacoes[t]) ? item.cotacoes[t] : { valor: '', prazo: '', codigo: '' };
                    formHtml += `
                        <div class="grid grid-cols-1 sm:grid-cols-[1fr_100px_80px_120px] gap-2 mb-2 items-center bg-white dark:bg-gray-800 p-2 rounded shadow-sm border border-gray-100 dark:border-gray-600">
                            <div class="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 truncate" title="${t}">${t}</div>
                            <div>
                                <label class="text-[8px] font-bold text-gray-400 uppercase block mb-0.5 sm:hidden">Valor (R$)</label>
                                <input type="text" id="val_${item.id}_${idx}" class="input-field m-0 py-1.5 px-2 text-[11px] font-bold text-gray-700 text-center w-full" placeholder="R$ Valor" value="${c.valor}" oninput="this.value=mascaraMoeda(this.value)">
                            </div>
                            <div>
                                <label class="text-[8px] font-bold text-gray-400 uppercase block mb-0.5 sm:hidden">Prazo</label>
                                <input type="text" id="prazo_${item.id}_${idx}" class="input-field m-0 py-1.5 px-2 text-[11px] text-center w-full" placeholder="Dias" value="${c.prazo}">
                            </div>
                            <div>
                                <label class="text-[8px] font-bold text-gray-400 uppercase block mb-0.5 sm:hidden">Cód. Cotação</label>
                                <input type="text" id="cod_${item.id}_${idx}" class="input-field m-0 py-1.5 px-2 text-[11px] text-center w-full" placeholder="Cód/Nº" value="${c.codigo}">
                            </div>
                        </div>
                    `;
                });
            } else {
                formHtml += '<div class="mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px] text-gray-500 text-center"><i class="fa-solid fa-circle-info mr-1"></i> Nenhuma transportadora primária sugerida para o destino desta cotação.</div>';
            }

            const fc = (item.cotacoes && item.cotacoes.FreteClick) ? item.cotacoes.FreteClick : { nome: '', valor: '', prazo: '', codigo: '' };
            formHtml += `
                <div class="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div class="flex items-center mb-2">
                        <i class="fa-solid fa-computer-mouse text-orange-500 dark:text-orange-400 mr-2 text-[11px]"></i>
                        <h4 class="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">FreteClick (Opção Manual)</h4>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-[1fr_100px_80px_120px] gap-2 mb-2 items-center bg-orange-50 dark:bg-orange-900/20 p-2 rounded shadow-sm border border-orange-200 dark:border-orange-800/50">
                        <div>
                            <label class="text-[8px] font-bold text-gray-400 uppercase block mb-0.5 sm:hidden">Transportadora</label>
                            <input type="text" id="fc_nome_${item.id}" class="input-field m-0 py-1.5 px-2 text-[11px] font-bold text-gray-700 text-left w-full" placeholder="Nome da Transportadora" value="${fc.nome}">
                        </div>
                        <div>
                            <label class="text-[8px] font-bold text-gray-400 uppercase block mb-0.5 sm:hidden">Valor (R$)</label>
                            <input type="text" id="fc_val_${item.id}" class="input-field m-0 py-1.5 px-2 text-[11px] font-bold text-gray-700 text-center w-full" placeholder="R$ Valor" value="${fc.valor}" oninput="this.value=mascaraMoeda(this.value)">
                        </div>
                        <div>
                            <label class="text-[8px] font-bold text-gray-400 uppercase block mb-0.5 sm:hidden">Prazo</label>
                            <input type="text" id="fc_prazo_${item.id}" class="input-field m-0 py-1.5 px-2 text-[11px] text-center w-full" placeholder="Dias" value="${fc.prazo}">
                        </div>
                        <div>
                            <label class="text-[8px] font-bold text-gray-400 uppercase block mb-0.5 sm:hidden">Cód. Cotação</label>
                            <input type="text" id="fc_cod_${item.id}" class="input-field m-0 py-1.5 px-2 text-[11px] text-center w-full" placeholder="Cód/Nº" value="${fc.codigo}">
                        </div>
                    </div>
                </div>
            `;

            formHtml += `<button id="btnSalvarCot_${item.id}" onclick="salvarCotacoesHistorico('${item.id}')" class="mt-2 w-full bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold py-2 rounded shadow transition"><i class="fa-solid fa-floppy-disk mr-1"></i> SALVAR VALORES</button></div>`;

            lista.innerHTML += `
                <div class="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm flex flex-col overflow-hidden transition-all">
                    <div class="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <div class="flex-grow w-full cursor-pointer select-none" onclick="togglePrevia('${item.id}')">
                            <div class="flex items-center">
                                <i id="icone-${item.id}" class="fa-solid fa-chevron-right text-gray-400 mr-3 w-3 text-center transition-transform duration-200"></i>
                                <span class="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded border border-yellow-200">${item.id}</span>
                                <span class="text-xs text-gray-500 dark:text-gray-400 ml-3"><i class="fa-regular fa-calendar mr-1"></i> ${item.data}</span>
                            </div>
                            <p class="text-sm font-bold text-gray-700 dark:text-gray-200 mt-2 ml-6"><i class="fa-regular fa-user mr-1"></i> Dest.: ${item.destinatario}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="apagarCotacaoHistorico('${item.id}')" class="bg-red-50 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-800 text-red-500 dark:text-red-300 px-3 py-2 rounded font-bold transition shadow-sm" title="Apagar Cotação">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                            <button onclick="copiarDoHistorico('${item.id}')" class="bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-4 py-2 rounded font-bold transition whitespace-nowrap shadow-sm">
                                <i class="fa-regular fa-copy mr-1"></i> Copiar
                            </button>
                        </div>
                    </div>
                    <div id="previa-${item.id}" class="hidden bg-gray-100 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-600">
                        <div class="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">${item.texto}</div>
                        ${formHtml}
                    </div>
                </div>
            `;
        });

        openItems.forEach((id) => {
            const previa = document.getElementById(`previa-${id}`);
            const icone = document.getElementById(`icone-${id}`);
            if (previa && icone) {
                previa.classList.remove('hidden');
                icone.classList.replace('fa-chevron-right', 'fa-chevron-down');
            }
        });
    }

    async function salvarCotacoesHistorico(idCotacao) {
        const btn = document.getElementById(`btnSalvarCot_${idCotacao}`);
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> SALVANDO...';
        btn.disabled = true;

        try {
            const item = historicoNuvem.find((i) => i.id === idCotacao);
            if (!item) {
                throw new Error('Cotação não encontrada');
            }

            let primarias = item.primarias || [];
            if (!primarias.length && item.texto) {
                const match = item.texto.match(/CEP DESTINATÁRIO:.*\/ ([A-Z]{2})/);
                if (match) primarias = getTransportadorasPrimariasPorUF(match[1]);
            }

            const cotacoesParaSalvar = {};
            primarias.forEach((t, idx) => {
                const valInput = document.getElementById(`val_${idCotacao}_${idx}`);
                const prazoInput = document.getElementById(`prazo_${idCotacao}_${idx}`);
                const codInput = document.getElementById(`cod_${idCotacao}_${idx}`);
                if (valInput && prazoInput && codInput) {
                    const valor = valInput.value.trim();
                    const prazo = prazoInput.value.trim();
                    const codigo = codInput.value.trim();
                    if (valor || prazo || codigo) {
                        cotacoesParaSalvar[t] = { valor, prazo, codigo };
                    }
                }
            });

            const fcNomeInput = document.getElementById(`fc_nome_${idCotacao}`);
            const fcValInput = document.getElementById(`fc_val_${idCotacao}`);
            const fcPrazoInput = document.getElementById(`fc_prazo_${idCotacao}`);
            const fcCodInput = document.getElementById(`fc_cod_${idCotacao}`);

            if (fcNomeInput && fcValInput && fcPrazoInput && fcCodInput) {
                const nome = fcNomeInput.value.trim();
                const valor = fcValInput.value.trim();
                const prazo = fcPrazoInput.value.trim();
                const codigo = fcCodInput.value.trim();
                if (nome || valor || prazo || codigo) {
                    cotacoesParaSalvar.FreteClick = { nome, valor, prazo, codigo };
                }
            }

            await database.ref(`historico/${idCotacao}/cotacoes`).set(cotacoesParaSalvar);
            showToast('Valores de frete registrados com sucesso!', 'success');
        } catch (err) {
            console.error(err);
            showToast('Erro ao salvar retornos.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    function togglePrevia(id) {
        const previa = document.getElementById(`previa-${id}`);
        const icone = document.getElementById(`icone-${id}`);
        if (previa.classList.contains('hidden')) {
            previa.classList.remove('hidden');
            icone.classList.replace('fa-chevron-right', 'fa-chevron-down');
        } else {
            previa.classList.add('hidden');
            icone.classList.replace('fa-chevron-down', 'fa-chevron-right');
        }
    }

    function apagarCotacaoHistorico(id) {
        showDialog(`Tem certeza que deseja apagar a cotação ${id} do servidor?`, 'confirm', async () => {
            try {
                await database.ref(`historico/${id}`).remove();
                showToast('Cotação apagada da nuvem.', 'success');
            } catch (err) {
                showToast('Erro ao apagar cotação.', 'error');
            }
        });
    }

    function copiarDoHistorico(id) {
        const item = historicoNuvem.find((i) => i.id === id);
        if (item) {
            const temp = document.createElement('textarea');
            temp.value = item.texto;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            showToast(`Cotação ${id} copiada!`, 'success');
        }
    }

    function mascaraMoeda(v) {
        v = v.replace(/\D/g, '');
        v = (v / 100).toFixed(2) + '';
        v = v.replace('.', ',');
        return v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    }

    function mascaraCNPJ(v) {
        v = v.replace(/\D/g, '');
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        v = v.replace(/(\d{4})(\d)/, '$1-$2');
        return v.substring(0, 18);
    }

    function mascaraCEP(v) {
        v = v.replace(/\D/g, '');
        v = v.replace(/^(\d{5})(\d)/, '$1-$2');
        return v.substring(0, 9);
    }

    function buscarCNPJ(cnpj, nomeId, loadingId) {
        const cnpjLimpo = cnpj.replace(/\D/g, '');
        if (cnpjLimpo.length !== 14) {
            return;
        }

        document.getElementById(loadingId).classList.remove('hidden');
        fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`)
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then((data) => {
                document.getElementById(nomeId).value = data.nome_fantasia || data.razao_social || '';
                dadosAlterados();
            })
            .catch(() => {})
            .finally(() => {
                document.getElementById(loadingId).classList.add('hidden');
            });
    }

    function buscarCEP(cep, cidadeId, loadingId) {
        const cepLimpo = cep.replace(/\D/g, '');
        if (cepLimpo.length !== 8) {
            return;
        }

        document.getElementById(loadingId).classList.remove('hidden');
        fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
            .then((response) => response.ok ? response.json() : Promise.reject())
            .then((data) => {
                if (!data.erro) {
                    document.getElementById(cidadeId).value = `${data.localidade} / ${data.uf}`;
                    sugerirTransportadora(data.uf);
                    dadosAlterados();
                }
            })
            .catch(() => {})
            .finally(() => {
                document.getElementById(loadingId).classList.add('hidden');
            });
    }

    function toggleDarkMode() {
        const body = document.body;
        const icone = document.getElementById('iconeTema');
        body.classList.toggle('dark');

        if (body.classList.contains('dark')) {
            icone.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('primeTema', 'dark');
        } else {
            icone.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('primeTema', 'light');
        }
    }

    function getTransportadorasPrimariasPorUF(uf) {
        if (!uf) {
            return [];
        }
        const recomendadas = transportadorasMap.filter((t) => t.ufs.includes(uf.toUpperCase()));
        const secundariasNomes = ['BRASSPRESS', 'TODO BRASIL', 'RODONAVES'];
        return recomendadas
            .filter((t) => !secundariasNomes.includes(t.nome))
            .map((t) => t.nome);
    }

    function sugerirTransportadora(uf) {
        const box = document.getElementById('boxRecomendacao');
        const lista = document.getElementById('listaRecomendadas');
        const texto = document.getElementById('textoRecomendacao');

        if (!uf) {
            box.classList.add('hidden');
            return;
        }

        const recomendadas = transportadorasMap.filter((t) => t.ufs.includes(uf.toUpperCase()));
        const secundariasNomes = ['BRASSPRESS', 'TODO BRASIL', 'RODONAVES'];
        const primarias = recomendadas.filter((t) => !secundariasNomes.includes(t.nome));
        const secundarias = recomendadas.filter((t) => secundariasNomes.includes(t.nome));

        texto.innerHTML = `Com base no destino (<strong>Estado: ${uf.toUpperCase()}</strong>), indicamos as seguintes parceiras:`;
        lista.innerHTML = '';

        let htmlPrimarias = '<div class="w-full flex flex-wrap gap-2">';
        if (!primarias.length) {
            htmlPrimarias += '<span class="bg-white border border-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm">Nenhuma parceira regional primária mapeada.</span>';
        } else {
            primarias.forEach((t) => {
                const nota = t.nome === 'MIRIN DO SUL' && uf.toUpperCase() === 'PR' ? ' (Londrina/Curitiba)' : '';
                htmlPrimarias += `<span class="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold shadow transition cursor-default flex items-center"><i class="fa-solid fa-star text-yellow-300 mr-1.5"></i> ${t.nome}${nota}</span>`;
            });
        }
        htmlPrimarias += '</div>';

        let htmlSecundarias = '<div class="w-full flex flex-wrap gap-2 items-center border-t border-indigo-200 dark:border-indigo-700/50 pt-2 mt-1">';
        htmlSecundarias += '<span class="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase mr-1">Secundárias:</span>';
        secundarias.forEach((t) => {
            htmlSecundarias += `<span class="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-600 text-[11px] px-2 py-1 rounded-lg font-bold shadow-sm cursor-default">${t.nome}</span>`;
        });
        htmlSecundarias += `<span class="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700 text-[11px] px-2 py-1 rounded-lg font-bold shadow-sm cursor-help flex items-center ml-auto" title="Cotar manualmente / Fora do catálogo"><i class="fa-solid fa-computer-mouse mr-1"></i> FreteClick</span>`;
        htmlSecundarias += '</div>';

        lista.innerHTML = htmlPrimarias + htmlSecundarias;
        box.classList.remove('hidden');
    }

    function analisarTextoPDF(texto) {
        const upper = texto.toUpperCase();
        if (upper.includes('PRIME2P') || upper.includes('PRIME 2P')) {
            document.getElementById('empresaRemetente').value = 'P';
        } else if (upper.includes('PRIMEXD') || upper.includes('PRIME XD')) {
            document.getElementById('empresaRemetente').value = 'XD';
        } else if (upper.includes('PRIMEXCORP') || upper.includes('PRIME XCORP')) {
            document.getElementById('empresaRemetente').value = 'XC';
        }

        const matchPedido = texto.match(/pedido\s+(\d+)/i) || texto.match(/PEDIDO\s*-\s*OP\s*(\d+)/i) || texto.match(/(\d+)-/);
        if (matchPedido) {
            const p = matchPedido[1];
            if (p.length >= 4 && p.length <= 8) {
                document.getElementById('pedido').value = p;
            }
        }

        const matchValor = texto.match(/R\$\s*([\d\.,]+)/i);
        if (matchValor) {
            document.getElementById('valorNf').value = mascaraMoeda(matchValor[1]);
        }

        const cnpjs = texto.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|\b\d{14}\b/g);
        if (cnpjs) {
            const valores = cnpjs.map((c) => c.replace(/\D/g, ''));
            const cnpjsPrime = ['11259196000150', '43391624000190', '49123568000199'];
            const cnpjCliente = valores.find((c) => !cnpjsPrime.includes(c));
            if (cnpjCliente) {
                const el = document.getElementById('destCnpj');
                el.value = mascaraCNPJ(cnpjCliente);
                buscarCNPJ(el.value, 'destNome', 'loadDestCnpj');
            }
        }

        const ceps = texto.match(/CEP\s*[:]?	?\s*(\d{5}-?\d{3})|\b\d{8}\b/gi);
        if (ceps) {
            const valores = ceps.map((c) => c.replace(/\D/g, ''));
            const cepCliente = valores.find((c) => c !== '03511050');
            if (cepCliente) {
                const el = document.getElementById('destCep');
                el.value = mascaraCEP(cepCliente);
                buscarCEP(el.value, 'destCidade', 'loadDestCep');
            }
        }

        const inicioItens = upper.indexOf('SUBTOTAL');
        const fimItens = upper.indexOf('TOTAL', inicioItens + 8);
        if (inicioItens !== -1 && fimItens !== -1) {
            const blocoItens = texto.substring(inicioItens + 8, fimItens).trim();
            const regexItem = /\b\d+\s+([A-Za-zÀ-ÿ0-9\s\-\.,\(\)\/]+?)\s+(\d+)\s+R\$/gi;
            let matchItem;
            let encontrou = false;
            const backupHTML = document.getElementById('containerItens').innerHTML;

            while ((matchItem = regexItem.exec(blocoItens)) !== null) {
                if (!encontrou) {
                    document.getElementById('containerItens').innerHTML = '';
                    contadorItens = 0;
                }
                encontrou = true;
                const descProduto = matchItem[1].trim();
                const qtdProduto = matchItem[2] ? matchItem[2].trim() : '1';
                adicionarItem();
                const rows = document.querySelectorAll('.item-row');
                const inputs = rows[rows.length - 1].querySelectorAll('input');
                inputs[0].value = qtdProduto;
                inputs[1].value = descProduto;
                try {
                    verificarMemoriaProduto(inputs[1]);
                } catch (err) {
                    console.warn('Aviso na memória do produto:', err);
                }
            }

            if (!encontrou) {
                document.getElementById('containerItens').innerHTML = backupHTML;
            }
        }

        dadosAlterados();
        showToast('Dados e itens extraídos com sucesso!', 'success');
    }

    function verificarMemoriaProduto(inputDesc) {
        const row = inputDesc.closest('.item-row');
        if (!row) return;
        const inputs = row.querySelectorAll('input');
        const desc = inputDesc.value.trim().toUpperCase();
        let produtoEncontrado = null;

        for (const key in catalogoProdutos) {
            const prod = catalogoProdutos[key];
            if (prod && prod.desc && prod.desc.toUpperCase() === desc) {
                produtoEncontrado = prod;
                break;
            }
        }

        if (produtoEncontrado) {
            let parts = produtoEncontrado.parts || [{
                comp: produtoEncontrado.comp,
                larg: produtoEncontrado.larg,
                alt: produtoEncontrado.alt,
                peso: produtoEncontrado.peso
            }];

            inputs[2].value = parts[0].comp || '';
            inputs[3].value = parts[0].larg || '';
            inputs[4].value = parts[0].alt || '';
            inputs[5].value = parts[0].peso || '';
            inputDesc.classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');

            if (parts.length > 1 && !inputDesc.dataset.spawned) {
                inputDesc.dataset.spawned = 'true';
                for (let i = 1; i < parts.length; i += 1) {
                    adicionarItem();
                    const allRows = document.querySelectorAll('.item-row');
                    const newRow = allRows[allRows.length - 1];
                    const newInputs = newRow.querySelectorAll('input');
                    newInputs[0].value = parts[i].vol || '1';
                    newInputs[1].value = produtoEncontrado.desc;
                    newInputs[2].value = parts[i].comp || '';
                    newInputs[3].value = parts[i].larg || '';
                    newInputs[4].value = parts[i].alt || '';
                    newInputs[5].value = parts[i].peso || '';
                    newInputs[1].classList.add('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
                    newInputs[1].dataset.spawned = 'true';
                }
                showToast(`Produto Multi-Volume! ${parts.length} partes adicionadas.`, 'info');
            }
        } else {
            inputDesc.classList.remove('bg-green-100', 'dark:bg-green-900', 'text-green-800', 'dark:text-green-200');
            delete inputDesc.dataset.spawned;
        }
    }

    window.onload = async () => {
        document.getElementById('telaCarregamento').style.display = 'flex';
        await conectarFirebase();
        checarEstadoLogin();
        adicionarItem();
        gerarPreviaTexto();

        if (localStorage.getItem('primeTema') === 'dark') {
            toggleDarkMode();
        }
    };

    Object.assign(window, {
        habilitarAdmin,
        verificarEnter,
        entrarSistema,
        salvarNovaSenha,
        abrirRecuperacao,
        enviarCodigoRecuperacao,
        cancelarRecuperacao,
        confirmarRecuperacao,
        toggleDarkMode,
        abrirHistorico,
        sairSistema,
        processarECopiar,
        apagarCotacaoHistorico,
        copiarDoHistorico,
        adicionarItem,
        removerItem,
        buscarCNPJ,
        buscarCEP,
        salvarCotacoesHistorico,
        togglePrevia,
        verificarMemoriaProduto,
        mascaraMoeda,
        mascaraCNPJ,
        mascaraCEP
    });
})();
