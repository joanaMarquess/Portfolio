class Botao {
  float posX;
  float posY;
  float largura;
  float altura;
  color cor;
  color corStroke;
  String texto;


  Botao(String t, float x, float y, float w, float h, color c, color cs) {
    texto = t;
    posX = x;
    posY = y;
    largura = w;
    altura = h;
    cor = c;
    corStroke = cs;
  }

  void desenhaBotao() {
    rectMode(CENTER);
    fill(cor);
    stroke(corStroke);
    strokeWeight(3);
    rect(posX, posY, largura, altura, 30);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(32);
    text(texto, posX, posY);
  }

  boolean foiClicado(float mouseX, float mouseY) {
    return mouseX > posX - largura / 2 && mouseX < posX + largura / 2 &&
      mouseY > posY - altura / 2 && mouseY < posY + altura / 2;
  }
}
