<script>
  import Capa from "./Componentes/Capa.svelte";
  import Rodape from "./Componentes/Rodape.svelte";
  import Secao from "./Componentes/Secao/Secao.svelte";
  import Divisao from "./Componentes/UI/Divisao.svelte";
  import MargemHorizontal from "./Componentes/UI/MargemHorizontal.svelte";

  new SweetScroll();
</script>

<Capa />

<MargemHorizontal id="inicio" />

<Secao titulo="Sobre Mim" centralizar>
  <p>Sou analista desenvolvedor de softwares e entusiasta do mundo da tecnologia.</p>
  <p>
    Trabalho no Inatel - Instituto Nacional de Telecomunicações - usando tecnologias como <strong>Java</strong>,
    <strong>Spring</strong>
    e
    <strong>Hibernate</strong>. Nas horas vagas gosto de me arriscar no
    <em>frontend</em> usando <strong>JavaScript</strong>,
    <strong>React</strong> e <strong>Svelte ♥</strong>.
  </p>
</Secao>

<Divisao />

<Secao titulo="Competências">
  <ul>
    <li>
      <strong>Proficiência:</strong> C, Python, Java, Hibernate, Spring, JavaScript, React, Svelte, HTML, CSS e DevOps
    </li>
    <li>
      <strong>Aprendizagem:</strong> Design Patterns, Docker, Go, Rust, IA e Machine Learning
    </li>
  </ul>
</Secao>

<Divisao />

<Secao titulo="Projetos">
  <div class="project">
    <h2>Projeto #1: IngressoJá!</h2>
    <ul>
      <li>Projeto de plataforma on-line para compra e venda de ingressos;</li>
      <li>Usando Java, Hibernate e SpringBoot para o server side e Svelte para client side;</li>
      <li>Desafios envolvendo comunicação com APIs do Mercado Pago e Amazon AWS.</li>
    </ul>
  </div>
</Secao>

<Divisao />

<Secao titulo="Experiências">
  <div class="employments">
    <h2>INATEL - Instituto Nacional de Telecomunicações</h2>
    <span>Backend Developer, Out 2021 - Atual</span>
    <ul>
      <li>Java, Hibernate e Spring</li>
      <li>Docker, Kubernetes e Rancher</li>
      <li>Git, GitHub e Azure Devops</li>
    </ul>
  </div>
  <div class="employments">
    <h2>PRODAM - Empresa de Tecnologia da Informação e Comunicação do Município de São Paulo</h2>
    <span>Estagiário de Engenharia de Software, Dez 2020 - Out 2021</span>
    <ul>
      <li>JavaScript, React, Angular, Vue.js e Svelte</li>
      <li>Git, GitHub e Team Fondation Service</li>
    </ul>
  </div>
</Secao>

<Divisao />

<Secao titulo="Educação">
  <div class="education">
    <h2>IFSP - Instituto Federal de Educação, Ciência e Tecnologia São Paulo</h2>
    <span> Análise e Desenvolvimento de Sistemas, Mar 2019 - Jan 2022 </span>
  </div>
  <div class="education">
    <h2>UNITAU - Universidade de Taubaté</h2>
    <span> Engenharia de Computação, Fev 2015 - Jul 2017 </span>
  </div>
  <div class="education">
    <h2>IFSP - Instituto Federal de Educação, Ciência e Tecnologia São Paulo</h2>
    <span> Técnico em Informática, Mar 2013 - Nov 2014 </span>
  </div>
</Secao>

<Divisao />

<Secao titulo="Conquistas">
  <ul>
    <li>3º lugar na III Maratona de Programação IFTEC 2020</li>
    <li>6º lugar na Maratona Estadual de Programação INTERIF 2020</li>
    <li>4º lugar na primeira etapa da Maratona Estadual de Programação INTERIF 2019</li>
    <li>1º lugar na Maratona de Programação IFSPCJO 2019</li>
  </ul>
</Secao>

<Divisao />

<Secao titulo="Contatos" centralizar>
  <p>
    <a href="mailto:helton_ricardo13@hotmail.com">E-mail</a>
  </p>
  <p>
    <a href="https://www.instagram.com/helton.x/">Instagram</a>
  </p>
  <p>
    <a href="https://github.com/heltonricardo/">GitHub</a>
  </p>
  <p>
    <a href="https://www.linkedin.com/in/heltonricardo/">LinkedIn</a>
  </p>
</Secao>

<MargemHorizontal />

<Rodape />
