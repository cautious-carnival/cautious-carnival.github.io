<script>
  const url = "https://www.timeapi.io/api/Time/current/zone?timeZone=Brazil/East";
  const requisicao = fetch(url, { mode: "no-cors" }).then(r => r.json());
</script>

<style>
  footer {
    height: 10rem;
    color: white;
    background: #1a222c;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>

<footer>
  {#await requisicao}
    Carregando informações...
  {:then dados} 
  <span> &copy; {dados} Helton Ricardo </span>
    
  {/await}
</footer>
