
const id = 0;

const server = `localhost:8082/game/${id}`;

function getState() {
    const myHeaders = new Headers();
    // myHeaders.append('Content-Type', 'application/json');
    const myInit = {
      method: 'GET',
      path: server,
      headers: myHeaders,
      mode: 'cors',
      cache: 'default'
    };
    return myInit;
}
  
export default getState;