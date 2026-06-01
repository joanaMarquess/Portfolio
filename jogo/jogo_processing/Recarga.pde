class Recarga {
  float posX;
  float posY;
  float lado;

  Recarga(float x, float y, float l ) {
    posX = x;
    posY = y;
    lado = l;
  }

  void desenhaEstacao() {
    image(recargaImg, posX, posY, lado, lado);

    if (verificaColisao(robo.posX, robo.posY, posX+20, posY+20, lado / 2)) {
      if (keyPressed && (key == 'r' || key == 'R')) {
        energiaAtual = min(energiaAtual + 2, energiaMax);
        if (!somRecarga.isPlaying()) {
          somRecarga.play();
        }
      }
    }
  }
}
