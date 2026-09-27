const inputImagem = document.getElementById("imagem");
const larguraInput = document.getElementById("largura");
const alturaInput = document.getElementById("altura");
const botaoGerar = document.getElementById("gerar");
const resultado = document.getElementById("resultado");

let imagemSelecionada = null;

// Mostra a prévia da imagem
inputImagem.addEventListener("change", function () {

    const arquivo = inputImagem.files[0];

    if (!arquivo) {
        return;
    }

    const leitor = new FileReader();

    leitor.onload = function (evento) {

        imagemSelecionada = new Image();

        imagemSelecionada.onload = function () {
            mostrarPrevia();
        };

        imagemSelecionada.src = evento.target.result;
    };

    leitor.readAsDataURL(arquivo);
});


// Mostra a prévia
function mostrarPrevia() {

    resultado.innerHTML = "";

    const titulo = document.createElement("h3");
    titulo.textContent = "Prévia do pôster";
    titulo.style.marginTop = "25px";

    const imagem = document.createElement("img");

    imagem.src = imagemSelecionada.src;

    imagem.style.width = "100%";
    imagem.style.maxHeight = "400px";
    imagem.style.objectFit = "contain";
    imagem.style.marginTop = "15px";
    imagem.style.borderRadius = "10px";

    resultado.appendChild(titulo);
    resultado.appendChild(imagem);
}


// Gera o PDF
botaoGerar.addEventListener("click", function () {

    if (!imagemSelecionada) {
        alert("Primeiro escolha uma imagem.");
        return;
    }

    const larguraCm = Number(larguraInput.value);
    const alturaCm = Number(alturaInput.value);

    if (larguraCm <= 0 || alturaCm <= 0) {
        alert("Digite uma largura e uma altura válidas.");
        return;
    }

    gerarPDF(larguraCm, alturaCm);
});


function gerarPDF(larguraCm, alturaCm) {

    const { jsPDF } = window.jspdf;

    // Converte centímetros para milímetros
    const larguraPoster = larguraCm * 10;
    const alturaPoster = alturaCm * 10;

    const A4_RETRATO = {
        largura: 210,
        altura: 297
    };

    const A4_PAISAGEM = {
        largura: 297,
        altura: 210
    };

    // Calcula quantas folhas seriam necessárias
    // em cada orientação.
    const colunasRetrato = Math.ceil(larguraPoster / A4_RETRATO.largura);
    const linhasRetrato = Math.ceil(alturaPoster / A4_RETRATO.altura);

    const folhasRetrato = colunasRetrato * linhasRetrato;

    const colunasPaisagem = Math.ceil(larguraPoster / A4_PAISAGEM.largura);
    const linhasPaisagem = Math.ceil(alturaPoster / A4_PAISAGEM.altura);

    const folhasPaisagem = colunasPaisagem * linhasPaisagem;

    // Escolhe automaticamente a orientação
    // que usa menos folhas.
    let pagina;

    if (folhasPaisagem <= folhasRetrato) {

        pagina = {
            largura: 297,
            altura: 210,
            colunas: colunasPaisagem,
            linhas: linhasPaisagem,
            total: folhasPaisagem,
            orientacao: "l"
        };

    } else {

        pagina = {
            largura: 210,
            altura: 297,
            colunas: colunasRetrato,
            linhas: linhasRetrato,
            total: folhasRetrato,
            orientacao: "p"
        };
    }

    // Cria o PDF
    const pdf = new jsPDF({
        orientation: pagina.orientacao,
        unit: "mm",
        format: "a4"
    });

    // Cria um canvas para o pôster inteiro.
    // Usamos uma escala proporcional à imagem original.
    const escala = Math.min(
        imagemSelecionada.naturalWidth / larguraPoster,
        imagemSelecionada.naturalHeight / alturaPoster
    );

    const larguraCanvas = Math.max(
        1000,
        Math.round(larguraPoster * escala)
    );

    const alturaCanvas = Math.max(
        1000,
        Math.round(alturaPoster * escala)
    );

    const canvasPoster = document.createElement("canvas");

    canvasPoster.width = larguraCanvas;
    canvasPoster.height = alturaCanvas;

    const contexto = canvasPoster.getContext("2d");

    contexto.fillStyle = "white";
    contexto.fillRect(
        0,
        0,
        larguraCanvas,
        alturaCanvas
    );

    // Mantém a proporção original da imagem.
    const escalaImagem = Math.min(
        larguraCanvas / imagemSelecionada.naturalWidth,
        alturaCanvas / imagemSelecionada.naturalHeight
    );

    const larguraImagem =
        imagemSelecionada.naturalWidth * escalaImagem;

    const alturaImagem =
        imagemSelecionada.naturalHeight * escalaImagem;

    const x =
        (larguraCanvas - larguraImagem) / 2;

    const y =
        (alturaCanvas - alturaImagem) / 2;

    contexto.drawImage(
        imagemSelecionada,
        x,
        y,
        larguraImagem,
        alturaImagem
    );

    // Quantidade de pixels por milímetro
    const pixelsPorMm =
        larguraCanvas / larguraPoster;

    let numeroPagina = 0;

    // Percorre as linhas
    for (let linha = 0; linha < pagina.linhas; linha++) {

        // Percorre as colunas
        for (let coluna = 0; coluna < pagina.colunas; coluna++) {

            numeroPagina++;

            if (numeroPagina > 1) {
                pdf.addPage(
                    "a4",
                    pagina.orientacao
                );
            }

            // Área da folha dentro do pôster
            const inicioX =
                coluna * pagina.largura;

            const inicioY =
                linha * pagina.altura;

            const larguraRestante =
                larguraPoster - inicioX;

            const alturaRestante =
                alturaPoster - inicioY;

            const larguraRecorte =
                Math.min(
                    pagina.largura,
                    larguraRestante
                );

            const alturaRecorte =
                Math.min(
                    pagina.altura,
                    alturaRestante
                );

            // Canvas individual da folha
            const canvasFolha =
                document.createElement("canvas");

            canvasFolha.width =
                Math.round(
                    larguraRecorte * pixelsPorMm
                );

            canvasFolha.height =
                Math.round(
                    alturaRecorte * pixelsPorMm
                );

            const contextoFolha =
                canvasFolha.getContext("2d");

            contextoFolha.fillStyle = "white";

            contextoFolha.fillRect(
                0,
                0,
                canvasFolha.width,
                canvasFolha.height
            );

            // Recorta a parte correspondente
            contextoFolha.drawImage(
                canvasPoster,
                Math.round(
                    inicioX * pixelsPorMm
                ),
                Math.round(
                    inicioY * pixelsPorMm
                ),
                canvasFolha.width,
                canvasFolha.height,

                0,
                0,
                canvasFolha.width,
                canvasFolha.height
            );

            const imagemFolha =
                canvasFolha.toDataURL(
                    "image/jpeg",
                    0.92
                );

            // Coloca a imagem na folha A4
            pdf.addImage(
                imagemFolha,
                "JPEG",
                0,
                0,
                pagina.largura,
                pagina.altura
            );

            // Número da folha
            pdf.setFontSize(8);

            pdf.setTextColor(80, 80, 80);

            pdf.text(
                `Folha ${numeroPagina} de ${pagina.total}`,
                5,
                pagina.altura - 5
            );
        }
    }

    // Nome do arquivo
    const nomeArquivo =
        `poster-gigante-${larguraCm}x${alturaCm}cm.pdf`;

    pdf.save(nomeArquivo);

    resultado.innerHTML = `
        <div style="
            margin-top:25px;
            padding:20px;
            background:#eff6ff;
            border-radius:12px;
            text-align:center;
        ">
            <h3>✅ Pôster gerado!</h3>

            <p style="margin-top:10px;">
                Tamanho: <strong>${larguraCm} × ${alturaCm} cm</strong>
            </p>

            <p style="margin-top:5px;">
                Serão utilizadas <strong>${pagina.total} folhas A4</strong>.
            </p>

            <p style="margin-top:10px;">
                O PDF foi baixado para o seu computador.
            </p>
        </div>
    `;
}