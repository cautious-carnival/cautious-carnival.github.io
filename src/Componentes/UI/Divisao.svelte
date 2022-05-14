<script>
  import MargemHorizontal from "./MargemHorizontal.svelte";
</script>

<style>
  hr {
    height: 1px;
    width: 90%;
    max-width: 95rem;
    border: none;
    background-color: #ccc;
  }

  @media only screen and (min-width: 550px) {
    hr {
      width: 80%;
    }
  }
</style>

<MargemHorizontal />
<hr />
<MargemHorizontal />
