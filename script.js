(function() {
    "use strict";

    // DOM refs
    const senhaInput = document.getElementById('senha');
    const tamanhoSlider = document.getElementById('tamanho');
    const tamanhoLabel = document.getElementById('tamanhoLabel');
    const chkMaiusculas = document.getElementById('chkMaiusculas');
    const chkMinusculas = document.getElementById('chkMinusculas');
    const chkNumeros = document.getElementById('chkNumeros');
    const chkSimbolos = document.getElementById('chkSimbolos');
    const forcaBar = document.getElementById('forcaBar');
    const forcaTexto = document.getElementById('forcaTexto');
    const entropiaBits = document.getElementById('entropiaBits');
    const gerarBtn = document.getElementById('gerarBtn');
    const copiarBtn = document.getElementById('copiarBtn');

    // conjuntos
    const MAIUSCULAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const MINUSCULAS = 'abcdefghijklmnopqrstuvwxyz';
    const NUMEROS = '0123456789';
    const SIMBOLOS = '!@#$%^*';

    let timeoutClipboard = null;

    // ----- função principal de geração com crypto.getRandomValues -----
    function gerarSenha() {
        const length = parseInt(tamanhoSlider.value, 10);
        let chars = '';
        if (chkMaiusculas.checked) chars += MAIUSCULAS;
        if (chkMinusculas.checked) chars += MINUSCULAS;
        if (chkNumeros.checked) chars += NUMEROS;
        if (chkSimbolos.checked) chars += SIMBOLOS;

        if (chars.length === 0) {
            // fallback: pelo menos minúsculas
            chars = MINUSCULAS;
            chkMinusculas.checked = true;
        }

        const charArray = chars.split('');
        const charsetLen = charArray.length;
        // gerar array com tamanho 'length' usando Uint32Array (crypto)
        const randomBytes = new Uint32Array(length);
        window.crypto.getRandomValues(randomBytes);

        let senha = '';
        for (let i = 0; i < length; i++) {
            // Usa o valor aleatório para indexar no conjunto
            const idx = randomBytes[i] % charsetLen;
            senha += charArray[idx];
        }
        return senha;
    }

    // ----- calcular entropia e atualizar barra -----
    function atualizarForca(senha) {
        const length = senha.length;
        let poolSize = 0;
        if (chkMaiusculas.checked) poolSize += 26;
        if (chkMinusculas.checked) poolSize += 26;
        if (chkNumeros.checked) poolSize += 10;
        if (chkSimbolos.checked) poolSize += 8; // !@#$%^*

        if (poolSize === 0) poolSize = 26; // segurança

        // entropia = comprimento * log2(poolSize)
        const entropy = length * Math.log2(poolSize);
        const bits = entropy.toFixed(1);
        entropiaBits.textContent = `${bits} bits`;

        let width = 0;
        let color = '#d32f2f';
        let label = 'Fraca';

        if (entropy < 40) {
            width = 25;
            color = '#d32f2f'; // vermelho
            label = 'Fraca';
        } else if (entropy < 60) {
            width = 55;
            color = '#f5b342'; // amarelo
            label = 'Média';
        } else if (entropy < 80) {
            width = 80;
            color = '#f5b342'; // amarelo
            label = 'Boa';
        } else {
            width = 100;
            color = '#4caf50'; // verde
            label = 'Forte';
        }

        forcaBar.style.width = width + '%';
        forcaBar.style.background = color;
        forcaTexto.textContent = label;
    }

    // ----- atualizar UI (gerar + medidor) -----
    function atualizarSenha() {
        const novaSenha = gerarSenha();
        senhaInput.value = novaSenha;
        atualizarForca(novaSenha);
        // limpar timeout de clipboard
        if (timeoutClipboard) {
            clearTimeout(timeoutClipboard);
            timeoutClipboard = null;
        }
    }

    // ----- copiar com limpeza após 30s -----
    function copiarSenha() {
        const senha = senhaInput.value;
        if (!senha || senha.length === 0) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(senha).then(() => {
                // feedback visual
                copiarBtn.textContent = '✅ Copiado!';
                setTimeout(() => { copiarBtn.textContent = '📋 Copiar'; }, 1500);

                // agenda limpeza após 30s
                if (timeoutClipboard) clearTimeout(timeoutClipboard);
                timeoutClipboard = setTimeout(() => {
                    // limpa área de transferência (escreve string vazia)
                    navigator.clipboard.writeText('').catch(() => {});
                    timeoutClipboard = null;
                }, 30000);
            }).catch(() => {
                // fallback: selecionar e copiar com execCommand (mas sem limpeza)
                senhaInput.select();
                document.execCommand('copy');
                copiarBtn.textContent = '✅ Copiado!';
                setTimeout(() => { copiarBtn.textContent = '📋 Copiar'; }, 1500);
            });
        } else {
            // fallback
            senhaInput.select();
            document.execCommand('copy');
            copiarBtn.textContent = '✅ Copiado!';
            setTimeout(() => { copiarBtn.textContent = '📋 Copiar'; }, 1500);
        }
    }

    // ----- eventos -----
    tamanhoSlider.addEventListener('input', function() {
        tamanhoLabel.textContent = this.value;
        atualizarSenha();
    });

    document.querySelectorAll('.checkboxes input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
            atualizarSenha();
        });
    });

    gerarBtn.addEventListener('click', atualizarSenha);
    copiarBtn.addEventListener('click', copiarSenha);

    // inicializa
    (function init() {
        tamanhoSlider.value = 16;
        tamanhoLabel.textContent = '16';
        chkMaiusculas.checked = true;
        chkMinusculas.checked = true;
        chkNumeros.checked = true;
        chkSimbolos.checked = true;
        atualizarSenha();
    })();

})();