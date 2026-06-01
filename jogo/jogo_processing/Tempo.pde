class Tempo {
  float tempo;
  float duracaoNivel = 90;
  boolean gameOver = false;
  boolean audioTocado = false;
  int framesPassados = 0;
  float tempoInicioEfeito = -1;
  float duracaoEfeito = 5;
  boolean efeitoAtivo = false;
  String efeitoAtual = ""; // "" = nenhum, "estrela", "inseto"


  Tempo() {
    resetTempo();
  }

  void resetTempo() {
    tempo = 0;
    gameOver = false;
    efeitoAtivo = false;
    tempoInicioEfeito = -1;
    efeitoAtual = "";
    framesPassados = 0;
  }

  void contarTempo() {
    if (!gameOver) {
      if (!(efeitoAtivo && efeitoAtual.equals("arbusto"))) {
        tempo += 1.0 / frameRate;
      }

      framesPassados++;

      // a cada 90 frames a energia diminui 1 valor

      if (framesPassados >= duracaoNivel) {
        energiaAtual = max(0, energiaAtual - 1);
        framesPassados = 0;
      }


      if (tempo >= duracaoNivel) {
        gameOver = true;
        tempo = duracaoNivel;
      }


      if (efeitoAtivo && tempo - tempoInicioEfeito >= duracaoEfeito) {
        efeitoAtivo = false;
        reverterEfeito();
        efeitoAtual = "";
      }
    }
  }

  void ativarEfeito(String tipo) {
    efeitoAtivo = true;
    tempoInicioEfeito = tempo;
    efeitoAtual = tipo;
    aplicarEfeito();
  }

  void aplicarEfeito() {
    if (efeitoAtual.equals("estrela")) {
      robo.velX += 10;
      robo.velY += 10;
    } else if (efeitoAtual.equals("inseto")) {

      robo.velX = max(0, robo.velX - 5);
      robo.velY = max(0, robo.velY - 5);
    } else if (efeitoAtual.equals("arbusto")) {
      tempoInicioEfeito = tempo;
    }
  }

  void reverterEfeito() {
    if (efeitoAtual.equals("estrela")) {

      robo.velX -= 10;
      robo.velY -= 10;
    } else if (efeitoAtual.equals("inseto")) {

      robo.velX = min(12, robo.velX + 5);
      robo.velY = min(12, robo.velY + 5);
    } else if (efeitoAtual.equals("arbusto")) {
    }
  }



  void desenhar() {
    contarTempo();
    fill(255, 0, 0);
    rect(width/2 - 690, 25, 155, 60, 20);
    fill(255);
    textSize(26);
    textAlign(CORNER);
    text("Time: " + (int(duracaoNivel - tempo)), width/2 - 660, 65);
  }
}
