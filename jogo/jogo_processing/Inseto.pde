class Inseto {
  float posX, posY; 
  float centroX, centroY; 
  float angulo; 
  float raio; 
  float velocidadeAngular; 
  PImage imagem;
  boolean visivel; 

  Inseto(float x, float y, PImage img) {
    posX = x;
    posY = y;
    centroX = x;
    centroY = y;
    angulo = random(TWO_PI);
    raio = random(20, 50);
    velocidadeAngular = random(0.02, 0.05);
    imagem = img;
    visivel = true;
  }

  void desenhaInseto() {
    if (visivel) {
      image(imagem, posX, posY, 50, 50);
    }
  }

  void movimenta() {
    if (!visivel) return;

    
    angulo += velocidadeAngular;

   
    posX = centroX + cos(angulo) * raio;
    posY = centroY + sin(angulo) * raio;

   
    if (random(1) < 0.01) {
      centroX = random(50, width - 50);
      centroY = random(50, height - 50);
      raio = random(20, 50); 
      velocidadeAngular = random(0.02, 0.05); 
    }

    
    if (posX < 50 || posX > width - 50) {
      centroX = width / 2; 
    }
    if (posY < 50 || posY > height - 50) {
      centroY = height / 2; 
    }
  }

  boolean verificaColisao(float roboX, float roboY, float raioRobo) {
    if (!visivel) return false;

    boolean colidiu = dist(roboX, roboY, posX, posY) < raioRobo - 30 + 15;
    if (colidiu) {
      visivel = false; 
      somErroRobo.play();
      pontuacao -= 5;
    }
    return colidiu;
  }

  void resetPosicao() {
    posX = random(50, width - 50);
    posY = random(100, height - 100);
    centroX = posX;
    centroY = posY;
    angulo = random(TWO_PI);
    visivel = true;
  }
}
