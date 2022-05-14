<script>
  import Titulo from "./TituloDeSecao.svelte";

  export let titulo;
  export let centralizar = false;
</script>

<style>
  section {
    margin: 0 auto;
    width: 90%;
    max-width: 95rem;
  }

  .centralizar {
    text-align: center;
  }

  @media only screen and (min-width: 550px) {
    section {
      width: 80%;
    }
  }
</style>

<section class:centralizar>
  <Titulo>{titulo}</Titulo>
  <slot />
</section>
