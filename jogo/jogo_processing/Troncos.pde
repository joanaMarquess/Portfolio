class Tronco {
  float posX;
  float posY;

  boolean regouArvore = false;
  float lado;

  Tronco(float x, float y, float l) {
    posX = x;
    posY = y;

    lado=l;
  }


  void desenhaTronco() {
    if (regouArvore) {
      image(arvoresImg, posX, posY, 120, 120);
    } else {
      image(TroncoImg, posX, posY, lado, lado);
    }
  }

  void verificaTroca(boolean teclaEspaco) {
    if (!regouArvore && dist(robo.posX, robo.posY, posX, posY) < 60 && teclaEspaco) {
      regouArvore = true;
      somRega.play();
      energiaAtual -= 10;
      energiaAtual = max(0, energiaAtual);
      pontuacao += 10;
    }
  }
}
