const writeEvent = (text) => {
  // ul elem
  const parent = document.querySelector('#events');

  //li elem
  const el = document.createElement('li');
  el.innerHTML = text;

  parent.appendChild(el);
}

const onFormSubmitted = (e) => {
  e.preventDefault();

  const input = document.querySelector('#chat');
  const text = input.value;
  input.value = '';

  sock.emit('message', text);
};

writeEvent('Welcome to RPS!')

const sock = io();
sock.on('message', writeEvent);

document.querySelector('#chat-form')
.addEventListener('submit', onFormSubmitted);
