<style>
  .fundo {
    width: 100%;
    min-height: 100vh;
    background: #222b42;
  }

  .centro {
    color: #fff;
    text-align: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .centro-titulo {
    font-size: 4rem;
    line-height: 2;
  }

  .centro-descricao {
    font-size: 2.5rem;
    display: block;
    margin-top: 10px;
  }

  .centro-imagem {
    width: 25rem;
    border-radius: 50%;
  }

  .centro-icons {
    display: flex;
    justify-content: center;
    text-align: center;
  }

  .down,
  .centro-icons .icon {
    color: #fff;
    text-align: center;
  }

  .centro-icons .icon {
    width: 30px;
    height: 30px;
    padding: 10px;
    border-radius: 50%;
    border: 1px solid #fff;
    transition: all 0.7s;
    font-size: 28px;
    margin: 5px;
  }

  .centro-icons .icon:active,
  .centro-icons .icon:hover {
    color: #1a222c;
    background: #fff;
  }

  .down {
    position: absolute;
    bottom: 25px;
    width: 100%;
    margin: 0 auto;
    display: block;
    font-size: 30px;
    cursor: pointer;
  }

  .down .icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    animation: pulse 1.3s infinite;
  }

  .down .icon:hover {
    color: #4b5664;
  }
</style>

<div class="fundo">
  <div class="centro">
    <img class="centro-imagem" src="./img/minha-imagem.jpg" alt="Minha Imagem" />
    <h1>
      <span class="centro-titulo">Helton Ricardo</span>
      <span class="centro-descricao">Software Developer</span>
    </h1>
    <div class="centro-icons">
      <a href="mailto:helton_ricardo13@hotmail.com">
        <i class="icon fa fa-envelope" />
      </a>
      <a href="https://www.instagram.com/helton.x/" target="_blank">
        <i class="icon fa fa-instagram" />
      </a>
      <a href="https://www.linkedin.com/in/heltonricardo/" target="_blank">
        <i class="icon fa fa-linkedin" />
      </a>
      <a href="https://github.com/heltonricardo/" target="_blank">
        <i class="icon fa fa-github-alt" />
      </a>
    </div>
  </div>
  <a class="down" href="#inicio" data-scroll="">
    <i class="icon fa fa-chevron-down" />
  </a>
</div>
