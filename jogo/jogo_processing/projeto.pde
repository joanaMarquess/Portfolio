import processing.sound.*;
SoundFile somEstrela;
SoundFile menuMusica;
SoundFile lixoSom;
SoundFile somBotao;
SoundFile somRega;
SoundFile gameOver;
SoundFile gameWin;
SoundFile somErroRobo;
SoundFile somNivel;
SoundFile fundoJogo;
SoundFile somRecarga;

Botao botaoJogar;
Botao botaoSair;
Botao botaoVoltarMenu;
Botao botaoRegras;
Botao proxNivel;

Tempo tempo;
Robo robo;
Inseto inseto;
Arvore [] arvore;
Tronco [] Troncos;
Lixo[] lixo;
Obstaculo[] obstaculo;
Recarga[] recarga;


// Todos os valores apresentados são referentes ao nivel 1

int estacoes = 2;
int arvores = 6;
int nTroncos = 4;
int nLixos = 4;
int nObstaculos = 4;
int pontuacao = 0;
int nivel = 1;
int energiaMax = 100;
int energiaAtual = energiaMax;

int posYvolume;
int oldPosX, oldPosY;
int oldPx, oldPy;

float estrelaX, estrelaY;
float bonusX, bonusY;

boolean arbustoVisivel = true;
boolean estrelaVisivel = true;
boolean somGameOverTocou = false;
boolean proxNivelTocou = false;
boolean menu = true;
boolean proximoNivel = false;
boolean mexer = true;
boolean menuPausa = false;

PImage arbustoBonus;
PImage insetoImg;
PImage recargaImg;
PImage lata2;
PImage estrela;
PImage roboImagem;
PImage arvoresImg;
PImage TroncoImg;
PImage obstaculos;
PImage botaoPausa;
PImage botaoContinuar;
PImage botaoPlay;

PFont fonte;
String nomeDoJogo = "Robot Adventure";




void setup() {
  fullScreen();
  posYvolume = height / 2 - 95;

  fonte = createFont("Halo Dek.ttf", 50);
  textFont(fonte);

  menuMusica = new SoundFile(this, "menu.mp3");
  somEstrela = new SoundFile(this, "star.mp3");
  lixoSom = new SoundFile(this, "lixo.mp3");
  somBotao = new SoundFile(this, "botao.mp3");
  somRega = new SoundFile(this, "rega.wav");
  gameOver = new SoundFile(this, "gameover.wav");
  gameWin = new SoundFile(this, "gamewin.mp3");
  somErroRobo = new SoundFile(this, "erro.wav");
  somNivel = new SoundFile(this, "nivel.wav");
  fundoJogo = new SoundFile(this, "fundo.mp3");
  somRecarga = new SoundFile(this, "botao.wav");


  //classe botao

  //botoes menu principal

  botaoJogar = new Botao("Play", width / 2, height / 2 - 50, 300, 80, color(#ffa333), color(#FF9133));
  botaoSair = new Botao("Exit", width / 2, height / 2 + 50, 300, 80, color(#ffa333), color(#FF9133));
  botaoRegras = new Botao("How to Play", width/2, height/2 + 150, 300, 80, color(#ffa333), color(#FF9133));

  //botoes para o restante jogo

  botaoVoltarMenu = new Botao("Back to Menu", width / 2, height / 2 + 300, 300, 80, color(255, 127, 180), color (#E04D96));
  proxNivel = new Botao (" Level" + (nivel), width/2, height/2 + 100, 300, 80, color(#B47EBE), color(#9E5C99));

  botaoPausa = loadImage("pausa.png");
  botaoContinuar = loadImage("play.png");
  botaoPlay = loadImage("casita.png");

  // arbusto que faz parar o tempo temporariamente

  arbustoBonus = loadImage("special.png");
  bonusX = random(70, width - 70);
  bonusY = random(100, height - 70);


  // classe inseto

  insetoImg = loadImage("inseto.png");
  inseto = new Inseto(random(70, width - 70), random(70, height - 70), insetoImg);


  // classe tempo

  tempo = new Tempo();


  // classe robo

  roboImagem = loadImage("robo2.png");
  robo = new Robo( 60, height/2, 15, 15, 32, color(255, 0, 0), roboImagem);


  // classe obstaculos

  obstaculos = loadImage("obstaculo.png");
  obstaculo = new Obstaculo[nObstaculos];
  for (int o = 0; o<nObstaculos; o++) {
    obstaculo[o] = new Obstaculo (random(100, width-100), random(100, height-100), random(60, 80), obstaculos);
  }
 

  // classe arvores

  float lado = 160;
  arvoresImg = loadImage("arvore.png");

  int numX = int(width/lado);
  int numY= int(1080/lado);

  arvore = new Arvore[arvores];
  for (int i =0; i<arvores; ) {
    int posX = int(random(1, numX-1));
    int posY = int(random(1, numY-1));
    if (posX != oldPosX || posY != oldPosY ) {
      arvore[i] = new Arvore(posX*lado, posY*lado, lado);
      oldPosX = posX;
      oldPosY = posY;
      i++;
    }
  }



  //classe troncos

  float ladoTronco = 100;
  TroncoImg= loadImage("tronco.png");

  int numeroX = int(width/ladoTronco);
  int numeroY= int(1080/ladoTronco);

  Troncos = new Tronco[nTroncos];
  for (int i = 0; i < nTroncos; ) {
    int px = int(random(1, numeroX - 1));
    int py= int(random(2, numeroY/2));

    boolean colideComArvore = false;

    for (int j = 0; j < arvore.length; j++) {
      if (arvore[j].colideComTronco(px * ladoTronco, py * ladoTronco)) {
        colideComArvore = true;
        break;
      }
    }

    if (!colideComArvore && (px != oldPx || py != oldPy)) {
      Troncos[i] = new Tronco(px * ladoTronco, py * ladoTronco, ladoTronco);
      oldPx = px;
      oldPy = py;
      i++;
    }
  }



  // classe lixo

  lata2 = loadImage("lata2.png");
  float l = 10;

  lixo = new Lixo [nLixos];
  for (int i =0; i<nLixos; i++) {
    lixo[i] = new Lixo(random(l*2, width-l*2), random(80, height-l*2), l);
  }


  // classe estações de recarga

  recargaImg = loadImage("recarga.png");
  float ladoEstacao = 160;
  recarga = new Recarga [estacoes];
  for (int i =0; i<estacoes; i++) {
    recarga[i] = new Recarga( random(200, width-200), random(200, height -200), ladoEstacao);
  }


  // estrela que aumenta a velocidade temporariamente

  estrela = loadImage("estrela.png");
  estrelaX = random(70, width - 70);
  estrelaY = random(70, height - 70);


  // inseto que reduz a velocidade temporariamente

  inseto.resetPosicao();


  inicializaNivel();
}



void draw() {

  // se no menu:
  if (menu) {
    if (fundoJogo.isPlaying()) {
      fundoJogo.stop();
    }
    somGameOverTocou = false;
    if (!menuMusica.isPlaying()) {
      menuMusica.loop();
    }
    background(#b65fcf);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(75);
    text(nomeDoJogo, width / 2, height / 2 - 200);

    botaoJogar.desenhaBotao();
    botaoSair.desenhaBotao();
    botaoRegras.desenhaBotao();
    return;
  }

  // se no menu pausa
  if (menuPausa) {
    mostraMenuPausa();
    return;
  }


  // tela entre níveis
  if (proximoNivel) {
    if (fundoJogo.isPlaying()) {
      fundoJogo.stop();
    }
    background(#F5AD39);
    fill(255);
    textSize(80);
    textAlign(CENTER, CENTER);
    text("WELL DONE!", width / 2, height / 2);
    proxNivel.texto="Level " + (nivel);
    proxNivel.desenhaBotao();
    if (!somNivel.isPlaying() && !proxNivelTocou) {
      somNivel.play();
      proxNivelTocou = true;
      return;
    }

    // tela final
    if (nivel > 3) {
      if (!gameWin.isPlaying()) {
        gameWin.play();
      }
      text("The End!", width / 2, height / 2);
      textSize(32);
      text("Final Score: " + pontuacao, width / 2, height / 2 + 70);
      noLoop();
    }
    return;
  }


  // tela de game over

  if (energiaAtual <= 0 || tempo.gameOver) {

    fundoJogo.stop();

    if (!somGameOverTocou) {
      if (!gameOver.isPlaying()) {
        gameOver.play();
      }
      somGameOverTocou = true;
    }

    background(255, 0, 0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(75);
    text("Game Over!", width / 2, height / 2);
    botaoVoltarMenu.cor = color(70);
    botaoVoltarMenu.posX = width/2 ;
    botaoVoltarMenu.posY = height/2 + 100 ;
    botaoVoltarMenu.corStroke = color(0);
    botaoVoltarMenu.desenhaBotao();
    return;
  }


  if (!fundoJogo.isPlaying()) {
    fundoJogo.loop();
  }

  // cor de fundo dos níveis
  background(#82a263);
  noStroke();


  //desenhar obstaculos
  for (int o = 0; o<obstaculo.length; o++) {
    obstaculo[o].desenhar();
  }


  // desenhar arbusto especial

  if (arbustoVisivel) {
    image(arbustoBonus, bonusX, bonusY, 70, 70);

    if (verificaColisao(robo.posX, robo.posY, bonusX, bonusY, 15)) {
      arbustoVisivel = false;
      tempo.ativarEfeito("arbusto");
    }
  }



  //desenhar obstaculos
  for (int o = 0; o<nObstaculos; o++) {
    obstaculo[o].desenhar();
  }


  // desenhar troncos

  for (int i = 0; i < Troncos.length; i++) {
    Troncos[i].verificaTroca(keyPressed && key == ' ');
    Troncos[i].desenhaTronco();
  }


  // desenhar robo
  robo.desenhaRobo();


  // desenhar árvores
  for (int i = 0; i < arvore.length; i++) {
    arvore[i].desenhaArvore();
  }

  boolean todasArvoresRegadas = true;
  for (int i = 0; i < Troncos.length; i++) {
    if (!Troncos[i].regouArvore) {
      todasArvoresRegadas = false;
    }
  }
  
  
  // desenha estacao recarga

  for (int i =0; i<recarga.length; i++) {
    recarga[i].desenhaEstacao();
  }



  // desenhar inseto

  if (inseto.visivel) {
    inseto.movimenta();
    inseto.desenhaInseto();

    if (inseto.verificaColisao(robo.posX, robo.posY, robo.raio)) {
      tempo.ativarEfeito("inseto");
    }
  }



  // desenhar lixos
  boolean lixosApanhados = true;



  // desenhar estrela

  if (estrelaVisivel) {
    image(estrela, estrelaX, estrelaY, 30, 30);

    if (verificaColisao(robo.posX, robo.posY, estrelaX, estrelaY, 15)) {
      estrelaVisivel = false;
      tempo.ativarEfeito("estrela");
      somEstrela.play();
    }
  }


  // verifica colisão entre o lixo e o robo

  for (int l = 0; l < lixo.length; l++) {
    if (lixo[l] != null && verificaColisao(robo.posX, robo.posY, lixo[l].posX, lixo[l].posY, lixo[l].lado / 2)) {

      lixo[l] = null;
      pontuacao += 5;
      energiaAtual -= 10;
      lixoSom.play();
    }
    if (lixo[l] != null) {
      lixosApanhados = false;
      lixo[l].desenhaLixo();
    }
  }

  // condições para passar de nivel

  if (lixosApanhados && todasArvoresRegadas && !proximoNivel) {
    proximoNivel = true;
    nivel++;
  }

  // tela de explicação  do jogo

  if (telaRegras) {
    mostraRegras();
    botaoVoltarMenu.desenhaBotao();
    return;
  }

  // desenha as barras do tempo, pontuação e energia
  mostraPontuacao();
  tempo.desenhar();
}

float volume = 1;

//verifica se o robo tocou no lixo
// x1 y1 centro do robo x2 y2 centro lixo
boolean verificaColisao(float x1, float y1, float x2, float y2, float raioObjeto) {
  return dist(x1, y1, x2, y2) < robo.raio + raioObjeto;
}

// tela de pausa

void mostraMenuPausa() {
  if (!menuMusica.isPlaying()) {
    menuMusica.play();
  }

  rectMode(CENTER);
  fill(#b65fcf);
  stroke(#9b4f97);
  strokeWeight(5);
  rect (width/2, height/2, width/2, height/2 + 200, 35);
  image(botaoContinuar, width / 2, height / 2 - 20, 150, 150);
  image(botaoPlay, width / 2, height / 2 + 95, 80, 80);
  noStroke();

  //pausa
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(60);
  text("Game Paused", width / 2, height / 2 - 190);
  if (fundoJogo.isPlaying()) {
    fundoJogo.stop();
  }

  // funcionalidade do som
  fill(200);
  rect(width / 2 + 190, height / 2 + 50, 10, 290);
  stroke(#DAA520);
  strokeWeight(2);
  fill(255, 255, 0);
  rect(width / 2 + 190, posYvolume, 30, 30);
  noStroke();

  if (mousePressed) {
    if (mouseX > width / 2 + 165 && mouseX < width / 2 + 205 && mouseY > height / 2 - 95 && mouseY < height / 2 + 200) {
      posYvolume = mouseY;
      volume = map(posYvolume, height / 2 -95, height / 2 + 215, 1, 0);
      menuMusica.amp(volume);
      somEstrela.amp(volume);
      lixoSom.amp(volume);
      somBotao.amp(volume);
      somRega.amp(volume);
      gameOver.amp(volume);
      gameWin.amp(volume);
      somErroRobo.amp(volume);
      somNivel.amp(volume);
      fundoJogo.amp(volume);
      somRecarga.amp(volume);
    }
  }
}




void mostraPontuacao() {
  //botao de pausa
  image(botaoPausa, width - 60, 50, 60, 60);

  // barra de pontuação
  fill(#F5AD39);
  rectMode(CENTER);
  rect(width/2-400, 55, 250, 60, 20);
  fill(255);
  textAlign(CENTER, TOP);
  textSize(29);
  text("Score: " + pontuacao, width/2 - 400, 45);

  // barra de energia

  float larguraEnergia = map(energiaAtual, 0, energiaMax, 0, 440);
  fill(#F2F24E);
  rectMode(CORNER);
  rect(width/2 - 265, 25, larguraEnergia, 60, 20);

  // contador de lixo e arvores

  int lixosApanhados = 0;
  int troncosRegados = 0;

  for (int l = 0; l < lixo.length; l++) {
    if (lixo[l] == null) {
      lixosApanhados++;
    }
  }

  for (int t = 0; t < Troncos.length; t++) {
    if (Troncos[t].regouArvore) {
      troncosRegados++;
    }
  }

  textAlign(LEFT, CENTER);
  textSize(25);
  fill(0, 150, 0);
  rect(width / 2 + 190, 25, 240, 60, 20);
  fill(255);
  image (lata2, width/2 +230, 55, 40, 40) ;
  text ( lixosApanhados + "/" + nLixos, width/2 +260, 55);
  image (TroncoImg, width/2 + 350, 55, 55, 55);
  text( troncosRegados  + "/" + nTroncos, width/2 + 365, 55);
}



void inicializaNivel() {

  // reinicia energia
  energiaAtual = energiaMax;
  tempo.resetTempo();

  // reinicia robo
  robo.posX = 60;
  robo.posY=height/2;


  // redução do tempo consoante o nivel
  if (nivel == 2) {
    tempo.duracaoNivel = 70;
  } else if (nivel == 3) {
    tempo.duracaoNivel = 55;
    estacoes = 1;
  } else {
    estacoes = 2;
  }

  robo.velX = 15;
  robo.velY = 15;


  // aumenta a dificuldade
  arvores = arvores + (nivel - 1) * 2;
  nLixos = nLixos + (nivel - 1) * 2;
  nTroncos = nTroncos + (nivel - 1) * 2;

  // nova posição para a estrela
  estrelaX = random(50, width - 50);
  estrelaY = random(100, height - 100);
  estrelaVisivel = true;

  // nova posição para arbusto especial
  bonusX = random(70, width - 70);
  bonusY = random(70, height - 70);
  arbustoVisivel = true;


  inseto.resetPosicao();
  inicializaObjetos();

  proxNivelTocou = false;
}


void inicializaObjetos() {

  // reinicia estação de recarga

  float ladoEstacao = 160;
  recarga = new Recarga [estacoes];
  for (int i =0; i<estacoes; i++) {
    recarga[i] = new Recarga( random(200, width-200), random(200, height -200), ladoEstacao);
  }

  // reinicia as árvores
  float ladoArvore = 160;
  int numX = int(width/ladoArvore);
  int numY= int(1080/ladoArvore);

  arvore = new Arvore[arvores];
  for (int i =0; i<arvores; ) {
    int posX = int(random(numX));
    int posY = int(random(1, numY));
    if (posX != oldPosX || posY != oldPosY ) {
      arvore[i] = new Arvore(posX*ladoArvore, posY*ladoArvore, ladoArvore);
      oldPosX = posX;
      oldPosY = posY;
      i++;
    }
  }


  // reinicia as Troncos
  float ladoTronco = 100;
  TroncoImg= loadImage("tronco.png");

  int numeroX = int(width/ladoTronco);
  int numeroY= int(1080/ladoTronco);

  Troncos = new Tronco[nTroncos];
  for (int i = 0; i < nTroncos; ) {
    int px = int(random(1, numeroX - 1));
    int py= int(random(2, numeroY/2));

    boolean colideComArvore = false;

    for (int j = 0; j < arvore.length; j++) {
      if (arvore[j].colideComTronco(px * ladoTronco, py * ladoTronco)) {
        colideComArvore = true;
        break;
      }
    }

    if (!colideComArvore && (px != oldPx || py != oldPy)) {
      Troncos[i] = new Tronco(px * ladoTronco, py * ladoTronco, ladoTronco);
      oldPx = px;
      oldPy = py;
      i++;
    }
  }


  // reinicia os lixos

  lixo = new Lixo[nLixos];
  float tamanhoLixo = 10;
  for (int i = 0; i < nLixos; i++) {
    lixo[i] = new Lixo(random(tamanhoLixo, width - tamanhoLixo),
      random(120, height - tamanhoLixo),
      tamanhoLixo);
  }
}


boolean telaRegras = false;

void mostraRegras() {
  telaRegras = true;
  background(#59bfff);
  textAlign(CENTER, CENTER);
  textSize(65);
  fill(255);
  text("Game Rules:", width / 2, 200);
  textSize(35);
  text("1. Use the arrow keys to move the robot around.", width / 2, 300);
  text("2. Press 'R' to recharge you energy when close to the station.", width / 2, 360);
  text("3. Collect trash and water plants by pressing the space bar to gain points.", width / 2, 420);
  text("4. Avoid obstacles and enemies to survive.", width / 2, 480);
  text("5. Search for the special plant to gain more time.", width / 2, 540);
  text("6. The star gives you extra speed temporarily.", width / 2, 600);
  text("Good Luck! ", width / 2, 660);
  botaoVoltarMenu.cor = color(255, 127, 180);
  botaoVoltarMenu.posX = width/2 ;
  botaoVoltarMenu.posY = height/2 + 300 ;
  botaoVoltarMenu.corStroke = color(#b84b92);
  if (fundoJogo.isPlaying()) {
    fundoJogo.stop();
  }
}



void keyPressed() {
  if (!proximoNivel) {
    boolean right = false, left = false, up = false, down = false;

    for (int i = 0; i < obstaculo.length; i++) {
      if (obstaculo[i].colisaoObj(robo.posX + robo.velX, robo.posY, robo.raio)) {
        right = true;
      }
    }
    for (int i = 0; i < obstaculo.length; i++) {
      if (obstaculo[i].colisaoObj(robo.posX - robo.velX, robo.posY, robo.raio)) {
        left=true;
      }
    }

    for (int i = 0; i < obstaculo.length; i++) {
      if (obstaculo[i].colisaoObj(robo.posX, robo.posY - robo.velY, robo.raio)) {
        up=true;
      }
    }
    for (int i = 0; i < obstaculo.length; i++) {
      if (obstaculo[i].colisaoObj(robo.posX, robo.posY + robo.velY, robo.raio)) {
        down=true;
      }
    }
    if (keyCode == RIGHT && !right ) {
      robo.posX += robo.velX;
    } else if ( keyCode == LEFT && !left) {
      robo.posX -= robo.velX;
    } else if (keyCode == UP && !up) {
      robo.posY -= robo.velY;
    } else if (keyCode == DOWN && !down) {
      robo.posY += robo.velY;
    }
  }
}

void mousePressed() {

  if (menu) {
    if ( botaoJogar.foiClicado(mouseX, mouseY)) {
      somBotao.play();
      if (menuMusica.isPlaying()) menuMusica.stop();
      menu = false;
      pontuacao = 0;
      arvores = 6;
      nTroncos = 4;
      nLixos = 4;
      nObstaculos = 4;
      energiaAtual = energiaMax;
      inicializaNivel();
    } else if (botaoSair.foiClicado(mouseX, mouseY)) {
      somBotao.play();
      exit();
    } else if (botaoRegras.foiClicado(mouseX, mouseY)) {
      somBotao.play();
      menu = false;
      telaRegras = true;
    }
    return;
  }

  // botao canto
  if (!menuPausa && mouseX > width - 90 && mouseX < width - 30 && mouseY > 30 && mouseY < 80) {
    menuPausa = true;
    somBotao.play();
  }

  // botao voltar ao jogo
  if (menuPausa && mouseX > width / 2 - 50 && mouseX < width / 2 + 45 && mouseY > height / 2 - 45 && mouseY < height / 2 + 15) {
    somBotao.play();
    if (menuMusica.isPlaying()) menuMusica.stop();
    menuPausa = false;
  }

  // botao voltar menu
  if (menuPausa && mouseX > width / 2 - 40 && mouseX < width / 2 + 40 && mouseY > height / 2 + 70 && mouseY < height / 2 + 140) {
    menu=true;
    menuPausa = false;
    somBotao.play();
  }

  if (menuPausa && mouseX > width / 2 + 165 && mouseX < width / 2 + 205 && mouseY > height / 2 - 95 && mouseY < height / 2 + 200) {
    posYvolume = mouseY;
    volume = map(posYvolume, height / 2 -95, height / 2 + 215, 1, 0);
    menuMusica.amp(volume);

  }

    // no game over botao para voltar ao menu

    if ((energiaAtual <= 0 || tempo.gameOver) && botaoVoltarMenu.foiClicado(mouseX, mouseY)) {
      menu = true;
      nivel = 1;
    }

    if (proxNivel.foiClicado(mouseX, mouseY)) {
      proximoNivel = false;
      inicializaNivel();
      somBotao.play();
    }

    if (telaRegras && botaoVoltarMenu.foiClicado(mouseX, mouseY)) {
      telaRegras = false;
      menu = true;
      somBotao.play();
    }
  }
