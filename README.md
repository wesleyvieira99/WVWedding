# Wesley & Vinícius · WVWedding

Site do casamento de Wesley e Vinícius, em português, para os dias **14 e 15 de novembro de 2026**, em Sarapuí. O encontro começa às **15h do dia 14**. Feito em HTML, CSS e JavaScript sem framework, sem instalação de dependências e com caminhos relativos compatíveis com hospedagem estática.

Domínio definido: **https://casalvw.com/**

Hospedagem escolhida: **GoDaddy**. Repositório de origem: [wesleyvieira99/WVWedding](https://github.com/wesleyvieira99/WVWedding). A preparação do código e do pacote não confirma que o domínio já está publicado.

## Executar localmente

Na pasta do repositório:

```sh
python3 -m http.server 4173
```

Acesse `http://localhost:4173`. Não abra por `file://`: envio de formulário e recursos do navegador precisam de uma origem HTTP/HTTPS.

## Arquivos e ajustes

- `index.html`: textos, estrutura, links de rota, metadados e acessibilidade.
- `styles.css`: identidade visual, estados de foco, mobile, impressão e movimento reduzido.
- `script.js`: menu, contagem de dias no fuso de São Paulo, galeria, cópia de endereço e envio de recados.
- `config.js`: domínio público, data, endereço, destinatário de e-mail e link do convite.
- `assets/`: fotografias, fontes locais com suas licenças, favicon e arquivo de calendário.

O campo `invitationUrl` começa vazio. O botão do convite fica oculto até existir uma versão final. Para liberá-lo, coloque o PDF em `assets/convite-wv.pdf` e defina `invitationUrl: 'assets/convite-wv.pdf'`, ou use o link público final do Canva. Links externos abrem em outra aba; PDFs locais podem ser baixados.

O arquivo `assets/wesley-e-vinicius.ics` marca o início da comemoração às 15h de Brasília (18h UTC), sem inventar um horário de encerramento. A contagem de dias segue o calendário de São Paulo, inclusive para visitantes em outros fusos.

## Recados por e-mail

O formulário usa o serviço externo [FormSubmit](https://formsubmit.co/ajax-documentation), enviando para **wesleysv11@gmail.com**, configurado em `config.js`. Não há chaves secretas no site.

**Ativação necessária:** na primeira solicitação, o FormSubmit pode enviar um e-mail de confirmação ao destinatário. Abra o e-mail e confirme a ativação. Faça depois um envio de teste a partir da URL publicada e confirme o recebimento na caixa de entrada, incluindo spam. A interface só mostra sucesso após resposta HTTP válida e `success: true` do serviço; respostas que indicam ativação pendente não são tratadas como envio concluído. A aceitação pelo serviço não substitui a verificação de chegada ao e-mail.

Se o FormSubmit fornecer um identificador protegido, ele pode ser colocado em `formSubmitId`, no lugar de usar o endereço na URL da API. O destinatário atual também aparece no fallback para aplicativos de e-mail. E-mails e conteúdo de um site estático são públicos; não coloque credenciais no repositório.

O formulário inclui nome, e-mail opcional e recado, com limites de tamanho, validação, campo antispam, bloqueio de envios duplicados enquanto aguarda, timeout de 25 segundos e mensagens acessíveis de estado. Em falhas, mantém o texto e oferece uma alternativa pelo aplicativo de e-mail. Não salva recados em banco de dados, no navegador ou no próprio site. O processamento e a entrega dependem do FormSubmit. Não envia confirmação automática ao convidado.

## Publicar na GoDaddy

O domínio escolhido é **https://casalvw.com/**. O GitHub mantém o código-fonte; o destino de hospedagem é a GoDaddy. Não é necessário build, Node.js, banco de dados ou servidor de aplicação para esta página.

O pacote de entrega `WVWedding-site.zip` contém uma pasta `site/` com os arquivos públicos e um `LEIA-ME-PUBLICACAO.txt` fora dela. Depois de identificar o serviço de hospedagem associado ao domínio na GoDaddy, publique **o conteúdo de `site/`** no diretório que serve a raiz desse domínio. O método e o diretório exatos dependem do plano contratado e devem ser confirmados no painel. O arquivo `index.html` deve responder na raiz de `https://casalvw.com/`, com `assets/` ao lado. Não publique a pasta `.git`, documentos de reserva, arquivos de trabalho ou instruções internas.

Os metadados canonical/Open Graph e o calendário usam o domínio definido. Todos os recursos locais mantêm caminhos relativos. Ao mudar o domínio, atualize `publicUrl` em `config.js`, canonical/Open Graph em `index.html` e a URL no calendário.

A configuração de DNS, vinculação do domínio, validações de propriedade e certificado HTTPS são etapas do provedor; este repositório não cria registros DNS nem contém códigos TXT de validação. Antes de compartilhar, confirme HTTPS, imagens, calendário, links de rota e um envio real de recado a partir do domínio. O FormSubmit pode exigir confirmação para a nova origem.

## Fotografias, fontes e informações

As três fotografias do casal foram fornecidas pelos noivos. As cópias publicadas preservam todos os pixels originais e tiveram metadados pessoais (incluindo EXIF/GPS) removidos sem recompressão; os arquivos de origem permanecem intactos. O site aplica somente enquadramento e um filtro CSS leve, sem modificar rostos ou gerar fotografias do casal por IA.

As imagens da propriedade são do [anúncio da chácara no Airbnb](https://www.airbnb.com.br/rooms/1361560195328864319), usado como referência do local escolhido. O site não publica documentos da reserva, identificadores de reserva, instruções privadas de acesso ou dados do anfitrião. O hero permite transitar entre a foto diurna original e uma interpretação artística da luz do entardecer sobre essa mesma imagem. O tratamento é identificado na legenda sempre que estiver visível, sem apresentá-lo como registro fotográfico real do pôr do sol no local. O arquivo `assets/venue-sunset.png` é a cópia integral do tratamento fornecido para essa direção visual. O pôr do sol nas fotografias do casal é real.

A estimativa **2h a 2h30 de São Paulo** é deliberadamente aproximada. Referências consultadas: [Distância Entre](https://www.distanciaentre.com.br/sao-paulo/sarapui) e [Rota Mapas](https://www.rotamapas.com.br/distancia-entre-sao-paulo-e-sarapui). O ponto de partida e o trânsito alteram o percurso; os botões Google Maps e Waze abrem a rota atual para o endereço da comemoração.

Fontes Cormorant Garamond e Manrope, obtidas do Google Fonts e servidas localmente. Licenças SIL Open Font License incluídas em `assets/fonts/`. Não há requisições a Google Fonts, cookies próprios, mapas incorporados nem scripts próprios de publicidade. O Spotify só é carregado quando o visitante abre o painel musical; o player externo tem sua própria política de privacidade e comportamento de sessão.

O site usa `noindex, nofollow` para desencorajar indexação por buscadores. Isso não cria uma barreira de acesso: quem tiver a URL pode abrir a página pública.

## Verificação

Sintaxe JavaScript:

```sh
node --check script.js
node --check config.js
```

Pontos de revisão antes de compartilhar: visual em desktop e celular; navegação por teclado; menu mobile; abertura/fechamento de fotos; calendário; Google Maps/Waze; abertura do convite final; envio real e recebimento de recados. A ativação e a entrega no e-mail precisam de confirmação do destinatário. No teste inicial de integração, o FormSubmit retornou ativação pendente (`success: false`) e enviou a solicitação de confirmação ao destinatário; nenhum resultado de entrega foi presumido. O botão de envio nasce desabilitado no HTML e só é habilitado após a instalação do handler JavaScript. O formulário declara `method="post"`, para evitar dados pessoais em query strings se o JavaScript não carregar.

## Trilha e interação

O seletor no hero varia de **Dia** a **Pôr do sol** com mouse, toque ou setas do teclado. O estado inicial mostra 88% do tratamento de entardecer e a legenda explica sua natureza artística. O conteúdo e os nomes mantêm o mesmo contraste em todas as posições.

O botão **Dar play no amor** abre um painel com embeds oficiais do Spotify para [ANAVITÓRIA](https://open.spotify.com/album/6KD10xly79MXn1PT0dns6D) e a opção **MPB leve**, que usa a seleção oficial [This Is TIAGO IORC](https://open.spotify.com/playlist/37i9dQZF1DZ06evO2w94yY). O visitante escolhe e inicia a reprodução no player. Não há autoplay, download de músicas ou falsa indicação de reprodução. O Spotify pode limitar a duração da prévia ou pedir login, conforme sua sessão e disponibilidade.

**Recolher painel** conserva o iframe para a trilha acompanhar a navegação; **Parar e fechar**, o X e Escape removem o iframe e encerram a reprodução. Ao trocar de seleção, o player anterior é removido. O painel recolhe ao clicar fora; o dock se reduz na seção de recados e se oculta enquanto o visitante digita em campos, evitando interferir no formulário. As mensagens do formulário não são repassadas ao Spotify.

A página adiciona entradas graduais, pequenos pontos de luz e um brilho sutil de entardecer, além de reflexo suave sobre o vidro em dispositivos com mouse. Todos os movimentos e enfeites contínuos são desativados por `prefers-reduced-motion: reduce`; o conteúdo e os controles continuam funcionando.
