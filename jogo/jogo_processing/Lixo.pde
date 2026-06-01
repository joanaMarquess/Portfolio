class Lixo {

  float posX;
  float posY;
  float lado;

  Lixo(float x, float y, float l ) {
    posX = x;
    posY = y;
    lado = l;
  }

  void desenhaLixo () {
    image(lata2, posX, posY, 35, 35);
  }
}
