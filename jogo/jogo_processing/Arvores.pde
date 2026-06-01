class Arvore {
  float posX;
  float posY;
  float lado;

  Arvore(float x, float y, float l ) {
    posX = x;
    posY = y;
    lado = l;
  }

  void desenhaArvore () {
    image(arvoresImg, posX, posY, lado, lado);
  }


  boolean colideComArvore(float obx, float oby) {
    if (dist(posX, posY, obx, oby) < arvoresImg.width) {
      return true;
    } else {
      return false;
    }
  }


 boolean colideComTronco(float obX, float obY) {
    float distancia = dist(posX + lado / 2, posY + lado / 2, obX + 100 / 2, obY + 100 / 2);
    return distancia < (lado / 2 + 100 / 2);
}



  float getX() {
    return posX;
  }

  float getY() {
    return posY;
  }
}
