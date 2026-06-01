class Obstaculo {
  float posX, posY;
  float lado, altura;
  PImage imagem;


  Obstaculo(float x, float y, float l, PImage img) {
    posX = x;
    posY = y;
    lado = l;
    imagem = img;
    altura = (lado*135/167);
  }


  void desenhar() {
    imageMode(CENTER);
    image(imagem, posX, posY, lado, altura);
  }

  boolean colisaoObj(float novoX, float novoY, float tamanhoRobo) {
    return (dist(novoX, novoY, posX, posY)< (altura/2)+tamanhoRobo);
  }
}
