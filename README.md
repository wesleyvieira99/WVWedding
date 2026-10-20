# Wesley & Vinícius · WVWedding

Site do casamento de Wesley e Vinícius, em português, para os dias **14 e 15 de novembro de 2026**, em Sarapuí. O encontro começa às **15h do dia 14**. Feito em HTML, CSS e JavaScript sem framework, sem instalação de dependências e com caminhos relativos compatíveis com hospedagem estática.

Domínio definido: **https://casalvw.com/**

Hospedagem: **GoDaddy**. Repositório de origem: [wesleyvieira99/WVWedding](https://github.com/wesleyvieira99/WVWedding). HTTPS validado para `casalvw.com` e `www.casalvw.com`. Os arquivos foram publicados, os redirecionamentos foram verificados e o envio do formulário pela origem HTTPS teve recebimento confirmado no Gmail.

## Executar localmente

Na pasta do repositório:

```sh
python3 -m http.server 4173
```

Acesse `http://localhost:4173`. Não abra por `file://`: envio de formulário e recursos do navegador precisam de uma origem HTTP/HTTPS.

## Arquivos e ajustes

- `index.html`: textos, estrutura, links de rota, metadados e acessibilidade.
- `styles.css`: identidade visual, estados de foco, mobile, impressão e movimento reduzido.
- `script.js`: menu, controle de movimento, contagem de dias no fuso de São Paulo, galeria, cópia de endereço e envio de recados.
- `portal.css` e `portal.js`: abertura de até cinco segundos com monograma animado e fechamento imediato ao iniciar uma interação.
- `nature.css` e `nature.js`: flores nas margens e folhagens com movimento leve ligado à rolagem.
- `music-tracks.js`: catálogo das nove faixas fornecidas pelo casal, com título, artista e caminho relativo do MP3.
- `music.js`: player próprio com áudio HTML nativo, controles de reprodução, volume e transições suaves.
- `music.css`: barra musical fixa, estados dos controles, progresso, apresentação mobile e movimento reduzido.
- `config.js`: domínio público, data, endereço, destinatário de e-mail e link do convite.
- `.htaccess`: redirecionamento para HTTPS e domínio canônico na hospedagem Apache/cPanel, preservando a rota de renovação do certificado.
- `assets/`: fotografias, fontes locais com suas licenças, favicon e arquivo de calendário; `assets/audio/` contém os nove MP3 da trilha.

O convite final foi fornecido e aprovado pelo casal. A arte está em `assets/convite-wesley-vinicius.png`, no formato PNG, com dimensões de **1080 × 1920 px**. O arquivo foi copiado integralmente, sem edição visual ou recompressão. `invitationUrl` aponta para essa imagem, e o link **Guarde o nosso convite** permite baixá-la como `Convite-Wesley-e-Vinicius-FINAL.png`, inclusive sem JavaScript. O convite é uma peça gráfica; as fotografias originais do casal usadas no site continuam separadas.

O arquivo `assets/wesley-e-vinicius.ics` marca o início da comemoração às 15h de Brasília (18h UTC), sem inventar um horário de encerramento. A contagem de dias segue o calendário de São Paulo, inclusive para visitantes em outros fusos.

## Recados por e-mail

O formulário usa o serviço externo [FormSubmit](https://formsubmit.co/ajax-documentation), enviando para **wesleysv11@gmail.com**, configurado em `config.js`. Não há chaves secretas no site.

**Ativado e entrega confirmada por HTTPS:** após ativar a origem `https://casalvw.com/`, um recado enviado pelo formulário no navegador chegou ao Gmail do destinatário em **20/10/2026 às 03:34:12 UTC**. O envio por HTTP já havia sido confirmado anteriormente. A interface só mostra sucesso após resposta HTTP válida e `success: true` do serviço; respostas que indiquem uma nova ativação pendente continuam sendo tratadas como envio não concluído.

`formSubmitId` já contém o identificador público fornecido pelo FormSubmit, usado no lugar do endereço na URL da API. Ele não é uma chave secreta. O destinatário permanece configurado para o fallback em aplicativos de e-mail. E-mails e conteúdo de um site estático são públicos; não coloque credenciais no repositório.

O formulário inclui nome, e-mail opcional e recado, com limites de tamanho, validação, campo antispam, bloqueio de envios duplicados enquanto aguarda, timeout de 25 segundos e mensagens acessíveis de estado. Em falhas, mantém o texto e oferece uma alternativa pelo aplicativo de e-mail. Não salva recados em banco de dados, no navegador ou no próprio site. O processamento e a entrega dependem do FormSubmit. Não envia confirmação automática ao convidado.

## Publicar na GoDaddy

O domínio escolhido é **https://casalvw.com/**. O GitHub mantém o código-fonte; o destino de hospedagem é a GoDaddy. Não é necessário build, Node.js, banco de dados ou servidor de aplicação para esta página.

O pacote de entrega `WVWedding-site.zip` contém uma pasta `site/` com os arquivos públicos e um `LEIA-ME-PUBLICACAO.txt` fora dela. Depois de identificar o serviço de hospedagem associado ao domínio na GoDaddy, publique **o conteúdo de `site/`** no diretório que serve a raiz desse domínio. O método e o diretório exatos dependem do plano contratado e devem ser confirmados no painel. O arquivo `index.html` deve responder na raiz de `https://casalvw.com/`, com `assets/` ao lado. Não publique a pasta `.git`, documentos de reserva, arquivos de trabalho ou instruções internas.

Inclua o arquivo oculto `.htaccess` na raiz pública. Ele redireciona HTTP e `www` com status 301 para `https://casalvw.com/`, preservando caminho e parâmetros de consulta. A rota `/.well-known/acme-challenge/` fica fora desse redirecionamento para renovação manual HTTP-01. Não há HSTS. Na criação desse arquivo, não havia `.htaccess` anterior no repositório, e a listagem de arquivos ocultos do `public_html` também não mostrava um existente.

**Implantação verificada:** HTTP no domínio raiz, HTTP em `www` com caminho/parâmetros e HTTPS em `www` redirecionaram corretamente; a origem HTTPS canônica respondeu 200 e o desafio ACME permaneceu acessível por HTTP com status 200. CSS, JavaScript e configuração publicados corresponderam exatamente aos arquivos locais. O HTML publicado correspondeu ao local, com a única diferença de um script de rastreamento inserido pela própria GoDaddy antes do fechamento do documento.

Os metadados canonical/Open Graph e o calendário usam o domínio definido. Todos os recursos locais mantêm caminhos relativos. Ao mudar o domínio, atualize `publicUrl` em `config.js`, canonical/Open Graph em `index.html` e a URL no calendário.

O certificado Let's Encrypt foi instalado no cPanel e é válido até **18/01/2027 às 02:31:43 UTC**. A renovação é **manual**, conforme aprovado, e precisa ser concluída antes dessa data caso o site permaneça ativo. Chaves privadas, dados da conta ACME e desafios temporários não fazem parte do repositório ou do pacote.

A configuração de DNS e as validações de propriedade pertencem ao provedor; este repositório não cria registros DNS nem contém códigos TXT de validação. Após publicar, confirme redirecionamentos, imagens, calendário, links de rota e um envio real de recado pela origem HTTPS. O FormSubmit pode exigir confirmação para a nova origem. Para os testes por terminal nesta hospedagem, `curl --http1.1` evita uma particularidade observada nas respostas HEAD por HTTP/2, sem desabilitar a validação TLS.

## Fotografias, fontes e informações

As três fotografias do casal foram fornecidas pelos noivos. As cópias publicadas preservam todos os pixels originais e tiveram metadados pessoais (incluindo EXIF/GPS) removidos sem recompressão; os arquivos de origem permanecem intactos. O site aplica somente enquadramento e um filtro CSS leve, sem modificar rostos ou gerar fotografias do casal por IA.

As imagens da propriedade são do [anúncio da chácara no Airbnb](https://www.airbnb.com.br/rooms/1361560195328864319), usado como referência do local escolhido. O site não publica documentos da reserva, identificadores de reserva, instruções privadas de acesso ou dados do anfitrião. O hero transita automaticamente entre a foto diurna original e uma interpretação artística da luz do entardecer sobre essa mesma imagem. O tratamento é identificado na legenda, sem apresentá-lo como registro fotográfico real do pôr do sol no local. O arquivo `assets/venue-sunset.png` é a cópia integral do tratamento fornecido para essa direção visual. O pôr do sol nas fotografias do casal é real.

A estimativa **2h a 2h30 de São Paulo** é deliberadamente aproximada. Referências consultadas: [Distância Entre](https://www.distanciaentre.com.br/sao-paulo/sarapui) e [Rota Mapas](https://www.rotamapas.com.br/distancia-entre-sao-paulo-e-sarapui). O ponto de partida e o trânsito alteram o percurso; os botões Google Maps e Waze abrem a rota atual para o endereço da comemoração.

Fontes Cormorant Garamond e Manrope, obtidas do Google Fonts e servidas localmente. Licenças SIL Open Font License incluídas em `assets/fonts/`. Não há requisições a Google Fonts, cookies próprios, mapas incorporados nem scripts próprios de publicidade. A trilha usa arquivos MP3 servidos pela mesma hospedagem e o recurso de áudio do navegador, sem player musical externo, API de terceiros, credenciais ou autenticação.

O site usa `noindex, nofollow` para desencorajar indexação por buscadores. Isso não cria uma barreira de acesso: quem tiver a URL pode abrir a página pública.

## Verificação

Sintaxe JavaScript:

```sh
node --check script.js
node --check config.js
node --check portal.js
node --check nature.js
node --check music-tracks.js
node --check music.js
```

Pontos de revisão após novas publicações: visual em desktop e celular; navegação por teclado; menu mobile; abertura/fechamento de fotos; calendário; Google Maps/Waze; abertura do convite final; HTTPS, redirecionamentos e envio de recados. Na trilha, confira carregamento dos MP3, play após bloqueio de reprodução automática, pausa/continuação, cliques rápidos em anterior/próxima, término real da faixa, volume e fades. A ativação da origem HTTPS e a chegada de um recado enviado pelo navegador foram confirmadas em 20/10/2026 às 03:34:12 UTC. O botão de envio nasce desabilitado no HTML e só é habilitado após a instalação do handler JavaScript. O formulário declara `method="post"`, para evitar dados pessoais em query strings se o JavaScript não carregar.

## Trilha e interação

A abertura dura até **cinco segundos**: um único **V** aparece, e seu traço se prolonga até formar o **W**. O monograma é um SVG contínuo, cercado por um portal botânico discreto. A abertura termina automaticamente; Escape, o primeiro foco em um controle, clique/toque ou início de rolagem revelam a página imediatamente. Ela não é apresentada com movimento reduzido e fecha se essa preferência for ativada ou se a página voltar pelo cache de navegação. Os timers e listeners de interação são removidos ao terminar. Sem JavaScript, a abertura permanece oculta.

A luz do hero avança automaticamente até o entardecer em um ciclo suave de **28 segundos**: cerca de 10 segundos de evolução, 7 segundos de permanência e um retorno de 11 segundos. Não há seletor nem ação necessária para iniciar. A legenda explica a interpretação artística da luz; textos e controles mantêm contraste ao longo da transição. O efeito usa somente opacidade CSS sobre as duas imagens existentes, sem novos downloads ou temporizadores JavaScript.

A trilha fica em uma **barra própria fixa de 60 px no desktop e 56 px no celular**, com título e artista da música, controles de anterior/próxima e pausa/continuação e indicação de progresso. Ela usa um único elemento de áudio HTML e **nove MP3 fornecidos pelo casal**, nesta ordem: “N” — Nando Reis e ANAVITÓRIA; “Oceano” — Djavan; “Tua” — ANAVITÓRIA; “Me Espera” — Sandy e Tiago Iorc; “Tangerina (Ao Vivo)” — Tiago Iorc e DUDA BEAT; “Aurora” — Jão; “Trevo (Tu)” — ANAVITÓRIA e Tiago Iorc; “Catedral” — Jão; “Agora Eu Quero Ir” — ANAVITÓRIA.

Depois do carregamento da página e do fim da abertura, o player tenta iniciar a trilha conforme a política de reprodução do navegador. Se a reprodução automática for bloqueada, o visitante pode iniciá-la pelo botão de play. O volume é definido em **18%**. Os fades de entrada e de fim duram aproximadamente **dois segundos**; ao escolher anterior/próxima durante a reprodução, a saída dura **600 ms** antes de carregar a nova música. As transições são sequenciais, sem sobrepor duas músicas.

Pausar preserva a posição para continuar e cancela uma troca ainda em andamento. Anterior/próxima mantém a trilha pausada quando essa foi a escolha do visitante. A troca automática depende do evento real de término da faixa, sem usar um temporizador para presumir que a música acabou. O indicador de reprodução acompanha os eventos do áudio. A trilha pode continuar com a aba em segundo plano; sair da página pausa o áudio, e voltar pelo histórico não o retoma automaticamente.

Após uma interação, o player pode usar a Web Audio API para controlar o volume por ganho; o volume nativo é a alternativa quando esse recurso não está disponível. Em navegadores que não permitam nenhum dos controles, o volume depende do aparelho e os fades podem não ser aplicados.

Os arquivos permanecem na própria hospedagem, em `assets/audio/`. Não há vídeos incorporados, anúncios de um serviço musical, autenticação ou dependência de um catálogo externo. O funcionamento depende do carregamento dos MP3 e das permissões de áudio do navegador; falhas de rede podem interromper a reprodução.

Em **20/10/2026**, os nove arquivos especificados pelo casal foram copiados integralmente de Downloads para `assets/audio/`, sem transcodificação. A igualdade de cada cópia foi conferida por SHA-256. O total é **82.868.953 bytes** (aproximadamente 79 MiB). Os nove MP3 também passaram pela leitura de formato e duração com `afinfo`, e a hospedagem respondeu com tipo `audio/mpeg` e tamanho esperado para cada arquivo. No navegador, foram confirmados play/pausa, navegação manual e a passagem de “Oceano” para “Tua”: o ganho desceu até aproximadamente zero no final e voltou a 18% em dois segundos. Não foi feita a audição integral das nove músicas. O harness de estados cobre bloqueio de autoplay, pausa durante troca, cliques rápidos, navegação circular e término real sem avanço duplicado.

A página adiciona entradas graduais, pequenos pontos de luz e um brilho sutil de entardecer, além de reflexo suave sobre o vidro em dispositivos com mouse. Um pequeno grupo de aves em SVG atravessa somente o céu do hero: três no desktop e duas no celular, sem imagens adicionais ou bibliotecas de animação. A paisagem deixa de animar quando sai da tela, e as animações CSS pausam quando a aba fica em segundo plano.

Flores e pétalas em SVG caem somente pelas margens durante a rolagem, enquanto pequenas folhagens nas bordas inferiores balançam discretamente. O movimento desacelera até parar cerca de dois segundos depois da rolagem, sem manter um loop de animação ocioso. Há oito flores no desktop e quatro no celular, confinadas a faixas laterais para deixar o conteúdo central livre. A camada é decorativa, não recebe cliques ou foco e fica oculta durante a abertura, ao preencher campos ou com um diálogo aberto. Não usa canvas, bibliotecas ou imagens externas; também se suspende em abas ocultas e desaparece com movimento reduzido ou na impressão.

As animações iniciam automaticamente, sem controles de ajuste na página. A preferência do sistema `prefers-reduced-motion: reduce` prevalece, desativando os movimentos e mantendo uma composição estática de entardecer. Sem JavaScript, o conteúdo continua visível e a paisagem permanece estática.

Ramos e ornamentos vetoriais aparecem em traços graduais uma única vez ao entrar na tela. As fotografias usam molduras retangulares com cantos discretos, de até 20 px no desktop e 14 px no celular, com filetes finos nas imagens do local. A galeria ampliada permite navegar pelas três imagens com **Foto anterior**, **Próxima foto** ou as setas do teclado, informa a posição atual e devolve o foco à foto de origem ao fechar.
