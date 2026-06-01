class Robo {

  float posX;
  float posY;
  float velX;
  float velY;
  float raio;
  color cor;
  PImage roboImagem;
  

  Robo (float x, float y, float vx, float vy, float r, color c, PImage rImg) {
    posX = x;
    posY = y;
    velX = vx;
    velY = vy;
    raio = r;
    cor = c;
    roboImagem = rImg;
  }

  void desenhaRobo () {
    imageMode(CENTER);
    image(roboImagem, posX, posY, raio * 2, raio * 2);
    
    posX = constrain(posX, raio, width - raio);
    posY = constrain(posY, 80, height - raio);
  }
}
